-- Rename tasks table to products
ALTER TABLE tasks RENAME TO products;

-- Rename the FK column on orders
ALTER TABLE orders RENAME COLUMN task_id TO product_id;

-- Rename the FK constraint
ALTER TABLE orders RENAME CONSTRAINT orders_task_id_fkey TO orders_product_id_fkey;

-- Rename the agent_id FK constraint on products (was tasks_agent_id_fkey)
ALTER TABLE products RENAME CONSTRAINT tasks_agent_id_fkey TO products_agent_id_fkey;
