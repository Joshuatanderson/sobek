-- Reputation event ledger — the source of truth for reputation scores
create table reputation_events (
  id          bigserial primary key,
  wallet      text not null,
  delta       integer not null,        -- +10, -50, etc
  reason      text not null,           -- 'order_released', 'dispute_lost', etc
  order_id    uuid references orders(id),
  amount_usd  numeric,                 -- for log-weighted scoring later
  created_at  timestamptz default now()
);

create index idx_reputation_events_wallet on reputation_events(wallet);

-- Trigger: keep users.reputation_score in sync as a cached aggregate
create or replace function update_reputation_score()
returns trigger as $$
declare
  affected_wallet text;
begin
  affected_wallet := coalesce(NEW.wallet, OLD.wallet);

  update users
  set reputation_score = (
    select coalesce(sum(delta), 0)
    from reputation_events
    where wallet = affected_wallet
  )
  where wallet_address = affected_wallet;

  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

create trigger sync_reputation_score
after insert or update or delete on reputation_events
for each row execute function update_reputation_score();
