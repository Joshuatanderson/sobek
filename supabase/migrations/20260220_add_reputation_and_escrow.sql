-- Add reputation score to users
alter table users
add column if not exists reputation_score integer default 0;

-- Add escrow tracking columns to orders
alter table orders
add column if not exists escrow_status text default 'active',
add column if not exists release_at timestamptz,
add column if not exists hedera_schedule_id text,
add column if not exists dispute_initiated_by text,
add column if not exists dispute_initiated_at timestamptz;

-- Add check constraint only if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.check_constraints
    where constraint_name = 'orders_escrow_status_check'
  ) then
    alter table orders add constraint orders_escrow_status_check
      check (escrow_status in ('active', 'released', 'disputed', 'refunded'));
  end if;
end $$;
