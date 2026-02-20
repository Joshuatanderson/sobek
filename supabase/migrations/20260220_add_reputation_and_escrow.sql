-- Add reputation score to users
alter table users
add column reputation_score integer default 0;

-- Add escrow tracking columns to orders
alter table orders
add column escrow_status text default 'active'
    check (escrow_status in ('active', 'released', 'disputed', 'refunded')),
add column release_at timestamptz,
add column hedera_schedule_id text,
add column dispute_initiated_by text,
add column dispute_initiated_at timestamptz;
