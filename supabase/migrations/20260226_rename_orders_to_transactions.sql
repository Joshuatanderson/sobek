-- Rename "orders" table to "transactions"
ALTER TABLE orders RENAME TO transactions;

-- Rename foreign key constraints to match new table name
ALTER TABLE transactions RENAME CONSTRAINT orders_client_id_fkey TO transactions_client_id_fkey;
ALTER TABLE transactions RENAME CONSTRAINT orders_product_id_fkey TO transactions_product_id_fkey;

-- Rename the order_id column in reputation_events to transaction_id
ALTER TABLE reputation_events RENAME COLUMN order_id TO transaction_id;
ALTER TABLE reputation_events RENAME CONSTRAINT reputation_events_order_id_fkey TO reputation_events_transaction_id_fkey;
