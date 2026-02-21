-- Track who received escrow funds and when
ALTER TABLE orders ADD COLUMN IF NOT EXISTS escrow_resolved_to text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS escrow_resolved_at timestamptz;

-- Backfill: orders with no escrow_registration should have escrow_status = 'none'
-- The first migration set the default to 'active', so old rows got that value incorrectly.
UPDATE orders
SET escrow_status = 'none'
WHERE escrow_registration IS NULL
  AND escrow_status != 'none';
