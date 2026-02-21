-- Fix: the orders_escrow_status_check constraint (carried over from the old table name)
-- is missing 'releasing' and 'resolving' states, which blocks the cron from claiming
-- transactions for release.
--
-- Drop both possible constraint names and recreate with all valid states.
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS orders_escrow_status_check;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_escrow_status_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_escrow_status_check
  CHECK (escrow_status IN (
    'none', 'pending_schedule', 'active', 'releasing', 'released',
    'disputed', 'resolving', 'refunded'
  ));
