-- Add configurable escrow duration per product (default 72h, max 62 days for Hedera limit)
ALTER TABLE products
  ADD COLUMN escrow_duration_hours integer DEFAULT 72
  CONSTRAINT escrow_duration_hours_range CHECK (escrow_duration_hours > 0 AND escrow_duration_hours <= 1488);

-- Store the on-chain escrow registration index on orders (for releaseToReceiver calls)
ALTER TABLE orders
  ADD COLUMN escrow_registration bigint;

-- Update escrow_status CHECK constraint to include new states
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_escrow_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_escrow_status_check
  CHECK (escrow_status IN ('none', 'pending_schedule', 'active', 'releasing', 'released', 'disputed', 'refunded'));

-- Change default from 'active' to 'none' so orders without explicit escrow_status don't look escrowed
ALTER TABLE orders ALTER COLUMN escrow_status SET DEFAULT 'none';
