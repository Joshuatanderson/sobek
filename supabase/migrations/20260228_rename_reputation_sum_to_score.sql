-- Rename reputation_sum → reputation_score.
-- The column is NOT a sum of deltas — it's a computed Gemini formula score:
--   round(max^0.15 * avg^0.15 * Mrate * log10(1+n) * 10)
-- Renaming to reputation_score accurately reflects what it stores.

ALTER TABLE public.users RENAME COLUMN reputation_sum TO reputation_score;

-- Recreate RLS guard trigger to reference reputation_score
CREATE OR REPLACE FUNCTION protect_users_columns()
RETURNS trigger AS $$
BEGIN
  IF current_setting('role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.reputation_score IS DISTINCT FROM OLD.reputation_score THEN
    RAISE EXCEPTION 'Cannot directly modify reputation_score';
  END IF;
  IF NEW.erc8004_agent_id IS DISTINCT FROM OLD.erc8004_agent_id THEN
    RAISE EXCEPTION 'Cannot directly modify erc8004_agent_id';
  END IF;
  IF NEW.telegram_chat_id IS DISTINCT FROM OLD.telegram_chat_id THEN
    RAISE EXCEPTION 'Cannot directly modify telegram_chat_id';
  END IF;
  IF NEW.telegram_link_token IS DISTINCT FROM OLD.telegram_link_token THEN
    RAISE EXCEPTION 'Cannot directly modify telegram_link_token';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the reputation trigger function to SET reputation_score
CREATE OR REPLACE FUNCTION update_reputation_score()
RETURNS trigger AS $$
DECLARE
  affected_wallet text;
  max_usd numeric;
  avg_usd numeric;
  n integer;
  success_count integer;
  total_resolved integer;
  success_rate numeric;
  m_rate numeric;
  score numeric;
  seller_user_id uuid;
BEGIN
  affected_wallet := COALESCE(NEW.wallet, OLD.wallet);

  SELECT
    COALESCE(MAX(amount_usd), 0),
    COALESCE(AVG(amount_usd), 0),
    COUNT(*)
  INTO max_usd, avg_usd, n
  FROM reputation_events
  WHERE wallet = affected_wallet AND delta > 0;

  SELECT id INTO seller_user_id
  FROM users WHERE wallet_address = affected_wallet;

  IF seller_user_id IS NOT NULL THEN
    SELECT
      COUNT(*) FILTER (WHERE t.escrow_status = 'released'),
      COUNT(*)
    INTO success_count, total_resolved
    FROM transactions t
    JOIN products p ON p.id = t.product_id
    WHERE p.agent_id = seller_user_id
      AND t.escrow_status IN ('released', 'refunded');
  ELSE
    success_count := 0;
    total_resolved := 0;
  END IF;

  IF total_resolved = 0 THEN
    m_rate := 1.10;
  ELSE
    success_rate := success_count::numeric / total_resolved;
    IF success_rate >= 0.99 THEN m_rate := 1.10;
    ELSIF success_rate >= 0.95 THEN m_rate := 1.00;
    ELSIF success_rate >= 0.90 THEN m_rate := 0.70;
    ELSE m_rate := 0.10;
    END IF;
  END IF;

  IF n = 0 OR max_usd <= 0 OR avg_usd <= 0 THEN
    score := 0;
  ELSE
    score := ROUND(
      POWER(max_usd, 0.15) * POWER(avg_usd, 0.15) * m_rate * LOG(1 + n) * 10
    );
  END IF;

  UPDATE users
  SET reputation_score = score
  WHERE wallet_address = affected_wallet;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
