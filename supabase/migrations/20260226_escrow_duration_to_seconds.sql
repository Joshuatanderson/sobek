-- Rename escrow_duration_hours → escrow_duration_seconds and convert existing values
ALTER TABLE products DROP CONSTRAINT IF EXISTS escrow_duration_hours_range;
ALTER TABLE products RENAME COLUMN escrow_duration_hours TO escrow_duration_seconds;

-- Convert existing hour values to seconds
UPDATE products SET escrow_duration_seconds = escrow_duration_seconds * 3600
  WHERE escrow_duration_seconds IS NOT NULL;

-- Default 300s (5 min), max ~62 days in seconds (5356800)
ALTER TABLE products ALTER COLUMN escrow_duration_seconds SET DEFAULT 10;
ALTER TABLE products ADD CONSTRAINT escrow_duration_seconds_range
  CHECK (escrow_duration_seconds > 0 AND escrow_duration_seconds <= 5356800);
