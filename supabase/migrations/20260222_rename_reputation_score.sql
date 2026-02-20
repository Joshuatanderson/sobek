-- Rename reputation_score → reputation_sum for clarity (it's sum(delta) from the ledger)
alter table users rename column reputation_score to reputation_sum;

-- Update the trigger to write to the renamed column
create or replace function update_reputation_score()
returns trigger as $$
declare
  affected_wallet text;
begin
  affected_wallet := coalesce(NEW.wallet, OLD.wallet);

  update users
  set reputation_sum = (
    select coalesce(sum(delta), 0)
    from reputation_events
    where wallet = affected_wallet
  )
  where wallet_address = affected_wallet;

  return coalesce(NEW, OLD);
end;
$$ language plpgsql;
