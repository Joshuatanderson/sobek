-- Install the Gemini reputation formula as a trigger on reputation_events.
-- On every insert/update/delete, recomputes reputation_sum for the affected wallet.
-- Also backfills all existing wallets with reputation events.

-- 1. Create or replace the trigger function
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

  -- Aggregate from positive reputation events
  SELECT
    COALESCE(MAX(amount_usd), 0),
    COALESCE(AVG(amount_usd), 0),
    COUNT(*)
  INTO max_usd, avg_usd, n
  FROM reputation_events
  WHERE wallet = affected_wallet AND delta > 0;

  -- Look up seller user ID
  SELECT id INTO seller_user_id
  FROM users WHERE wallet_address = affected_wallet;

  -- Compute success rate from transactions
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

  -- Mrate from SLA tier (default Sovereign for no track record)
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

  -- Full formula: round(max^0.15 * avg^0.15 * Mrate * log10(1 + n) * 10)
  IF n = 0 OR max_usd <= 0 OR avg_usd <= 0 THEN
    score := 0;
  ELSE
    score := ROUND(
      POWER(max_usd, 0.15) * POWER(avg_usd, 0.15) * m_rate * LOG(1 + n) * 10
    );
  END IF;

  UPDATE users
  SET reputation_sum = score
  WHERE wallet_address = affected_wallet;

  RETURN COALESCE(NEW, OLD);
END;
$$ language plpgsql;

-- 2. Bind trigger to reputation_events
DROP TRIGGER IF EXISTS trg_update_reputation ON reputation_events;
CREATE TRIGGER trg_update_reputation
  AFTER INSERT OR UPDATE OR DELETE ON reputation_events
  FOR EACH ROW EXECUTE FUNCTION update_reputation_score();

-- 3. Backfill: recompute reputation_sum for all wallets that have events
DO $$
DECLARE
  w text;
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
  FOR w IN SELECT DISTINCT wallet FROM reputation_events LOOP
    -- Aggregate from positive reputation events
    SELECT
      COALESCE(MAX(re.amount_usd), 0),
      COALESCE(AVG(re.amount_usd), 0),
      COUNT(*)
    INTO max_usd, avg_usd, n
    FROM reputation_events re
    WHERE re.wallet = w AND re.delta > 0;

    -- Look up seller user ID
    SELECT id INTO seller_user_id
    FROM users WHERE wallet_address = w;

    -- Compute success rate
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

    UPDATE users SET reputation_sum = score WHERE wallet_address = w;
  END LOOP;
END;
$$;
