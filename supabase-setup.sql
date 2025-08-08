-- NextPOS Cashier Database Setup
-- Jalankan script ini di Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Buat tabel categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat tabel products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  barcode VARCHAR(255) UNIQUE,
  image TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat tabel orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'DIGITAL')),
  cash_received DECIMAL(10,2) CHECK (cash_received >= 0),
  change_amount DECIMAL(10,2) DEFAULT 0 CHECK (change_amount >= 0),
  status VARCHAR(50) DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat tabel order_items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat tabel profiles untuk user management (opsional)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'CASHIER' CHECK (role IN ('ADMIN', 'MANAGER', 'CASHIER')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Buat function untuk update stock produk
CREATE OR REPLACE FUNCTION update_product_stock(product_id UUID, quantity_sold INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET stock = GREATEST(0, stock - quantity_sold),
      updated_at = NOW()
  WHERE id = product_id;
  
  -- Log jika stok menjadi negatif
  IF (SELECT stock FROM products WHERE id = product_id) < 0 THEN
    RAISE WARNING 'Stock for product % is now negative', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Buat function untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Buat triggers untuk auto-update timestamp
CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Makanan', 'Produk makanan dan snack'),
('Minuman', 'Berbagai jenis minuman'),
('Elektronik', 'Perangkat elektronik dan gadget'),
('Alat Tulis', 'Perlengkapan kantor dan sekolah'),
('Kesehatan', 'Produk kesehatan dan obat-obatan')
ON CONFLICT (name) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, stock, barcode, category_id) VALUES
('Nasi Goreng Spesial', 'Nasi goreng dengan telur dan ayam', 15000, 50, '8991234567890', (SELECT id FROM categories WHERE name = 'Makanan')),
('Mie Ayam Bakso', 'Mie ayam dengan bakso dan pangsit', 12000, 30, '8991234567891', (SELECT id FROM categories WHERE name = 'Makanan')),
('Gado-gado', 'Gado-gado dengan bumbu kacang', 10000, 25, '8991234567892', (SELECT id FROM categories WHERE name = 'Makanan')),
('Soto Ayam', 'Soto ayam dengan nasi', 13000, 40, '8991234567893', (SELECT id FROM categories WHERE name = 'Makanan')),
('Rendang', 'Rendang daging sapi', 18000, 20, '8991234567894', (SELECT id FROM categories WHERE name = 'Makanan')),

('Es Teh Manis', 'Es teh manis segar', 5000, 100, '8991234567895', (SELECT id FROM categories WHERE name = 'Minuman')),
('Kopi Hitam', 'Kopi hitam tanpa gula', 8000, 80, '8991234567896', (SELECT id FROM categories WHERE name = 'Minuman')),
('Jus Jeruk', 'Jus jeruk segar', 12000, 60, '8991234567897', (SELECT id FROM categories WHERE name = 'Minuman')),
('Es Campur', 'Es campur dengan buah-buahan', 15000, 35, '8991234567898', (SELECT id FROM categories WHERE name = 'Minuman')),
('Air Mineral', 'Air mineral 600ml', 3000, 200, '8991234567899', (SELECT id FROM categories WHERE name = 'Minuman')),

('Pulpen Biru', 'Pulpen tinta biru', 3000, 200, '8991234567900', (SELECT id FROM categories WHERE name = 'Alat Tulis')),
('Pensil 2B', 'Pensil kayu 2B', 2000, 150, '8991234567901', (SELECT id FROM categories WHERE name = 'Alat Tulis')),
('Buku Tulis', 'Buku tulis 38 lembar', 5000, 100, '8991234567902', (SELECT id FROM categories WHERE name = 'Alat Tulis')),
('Penghapus', 'Penghapus karet putih', 1500, 300, '8991234567903', (SELECT id FROM categories WHERE name = 'Alat Tulis')),
('Penggaris', 'Penggaris plastik 30cm', 2500, 80, '8991234567904', (SELECT id FROM categories WHERE name = 'Alat Tulis')),

('Paracetamol', 'Obat penurun panas', 8000, 50, '8991234567905', (SELECT id FROM categories WHERE name = 'Kesehatan')),
('Vitamin C', 'Suplemen vitamin C', 15000, 30, '8991234567906', (SELECT id FROM categories WHERE name = 'Kesehatan')),
('Masker Medis', 'Masker medis 3 ply', 25000, 100, '8991234567907', (SELECT id FROM categories WHERE name = 'Kesehatan')),
('Hand Sanitizer', 'Hand sanitizer 60ml', 12000, 75, '8991234567908', (SELECT id FROM categories WHERE name = 'Kesehatan')),
('Plaster', 'Plaster luka strip', 5000, 120, '8991234567909', (SELECT id FROM categories WHERE name = 'Kesehatan'))
ON CONFLICT (barcode) DO NOTHING;

-- Setup Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Buat policies untuk authenticated users
CREATE POLICY "Allow authenticated users to read categories" ON categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read products" ON products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert orders" ON orders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read orders" ON orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert order_items" ON order_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read order_items" ON order_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to read own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Allow users to update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Function untuk membuat profile otomatis saat user register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger untuk membuat profile otomatis
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Selesai setup database
SELECT 'Database setup completed successfully!' as message;