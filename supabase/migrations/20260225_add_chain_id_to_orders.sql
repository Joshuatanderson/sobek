-- Add chain_id so the escrow release cron knows which chain to release on.
-- Default 8453 (Base mainnet) backfills existing rows.
ALTER TABLE orders ADD COLUMN chain_id integer NOT NULL DEFAULT 8453;
