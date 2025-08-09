-- Fix RLS Policies untuk CRUD operations
-- Jalankan script ini di Supabase SQL Editor

-- Tambah policies untuk products table
CREATE POLICY "Allow authenticated users to insert products" ON products
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update products" ON products
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete products" ON products
  FOR DELETE TO authenticated USING (true);

-- Tambah policies untuk categories table
CREATE POLICY "Allow authenticated users to insert categories" ON categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update categories" ON categories
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete categories" ON categories
  FOR DELETE TO authenticated USING (true);

-- Tambah policies untuk orders table (update dan delete)
CREATE POLICY "Allow authenticated users to update orders" ON orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete orders" ON orders
  FOR DELETE TO authenticated USING (true);

-- Tambah policies untuk order_items table (update dan delete)
CREATE POLICY "Allow authenticated users to update order_items" ON order_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete order_items" ON order_items
  FOR DELETE TO authenticated USING (true);