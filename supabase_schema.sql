-- ============================================
-- SISTEMA DE RESTAURANTE / PANCHERÍA
-- Schema para Supabase - MVP
-- Pegar en: Supabase → SQL Editor → New Query
-- ============================================

-- ============================================
-- 1. CATEGORÍAS DE PRODUCTOS
-- ============================================
CREATE TABLE categories (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name      TEXT NOT NULL UNIQUE,
  emoji     TEXT DEFAULT '🍽️',
  position  INT  DEFAULT 0,
  active    BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. PRODUCTOS
-- ============================================
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL,
  image_url   TEXT,
  active      BOOLEAN DEFAULT true,
  stock       INT DEFAULT -1,  -- -1 = sin límite
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. MESAS
-- ============================================
CREATE TABLE tables (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number     INT NOT NULL UNIQUE,
  label      TEXT,           -- Ej: "Mesa 1", "Mostrador", "Terraza"
  qr_slug    TEXT UNIQUE,    -- Ej: "mesa-1" → /menu?t=mesa-1
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. PEDIDOS
-- ============================================
CREATE TABLE orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id      UUID REFERENCES tables(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  type          TEXT NOT NULL CHECK (type IN ('dine_in', 'delivery', 'takeaway')),
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  delivery_address TEXT,
  notes         TEXT,
  total         NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. ITEMS DEL PEDIDO
-- ============================================
CREATE TABLE order_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,   -- copia del nombre (por si cambia)
  unit_price   NUMERIC(10,2) NOT NULL,
  quantity     INT NOT NULL DEFAULT 1,
  subtotal     NUMERIC(10,2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. ÍNDICES (performance)
-- ============================================
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active   ON products(active);

-- ============================================
-- 7. FUNCIÓN: actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- CATEGORÍAS: lectura pública, escritura solo autenticados
CREATE POLICY "categories_public_read"  ON categories  FOR SELECT USING (true);
CREATE POLICY "categories_auth_write"   ON categories  FOR ALL    USING (auth.role() = 'authenticated');

-- PRODUCTOS: lectura pública (solo activos para anon), escritura solo auth
CREATE POLICY "products_public_read"    ON products    FOR SELECT USING (true);
CREATE POLICY "products_auth_write"     ON products    FOR ALL    USING (auth.role() = 'authenticated');

-- MESAS: lectura pública, escritura solo auth
CREATE POLICY "tables_public_read"      ON tables      FOR SELECT USING (true);
CREATE POLICY "tables_auth_write"       ON tables      FOR ALL    USING (auth.role() = 'authenticated');

-- PEDIDOS: inserción pública (cliente crea pedido), lectura/modificación solo auth
CREATE POLICY "orders_public_insert"    ON orders      FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_auth_all"         ON orders      FOR ALL    USING (auth.role() = 'authenticated');

-- ORDER ITEMS: inserción pública, lectura/modificación solo auth
CREATE POLICY "order_items_public_insert" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_auth_all"      ON order_items FOR ALL    USING (auth.role() = 'authenticated');

-- ============================================
-- 9. REALTIME (para pedidos en vivo)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- ============================================
-- 10. DATOS DE EJEMPLO (opcional, para testear)
-- ============================================

-- Categorías
INSERT INTO categories (name, emoji, position) VALUES
  ('Panchos',    '🌭', 1),
  ('Hamburguesas','🍔', 2),
  ('Papas',      '🍟', 3),
  ('Bebidas',    '🥤', 4),
  ('Postres',    '🍨', 5);

-- Mesas
INSERT INTO tables (number, label, qr_slug) VALUES
  (1, 'Mesa 1',    'mesa-1'),
  (2, 'Mesa 2',    'mesa-2'),
  (3, 'Mesa 3',    'mesa-3'),
  (4, 'Barra',     'barra'),
  (5, 'Terraza 1', 'terraza-1');

-- Productos (se insertan luego de tener los IDs de categorías)
-- Usar el panel de Supabase o el admin del sistema para cargar productos.

-- ============================================
-- LISTO ✓
-- Próximos pasos:
--   1. Ir a Authentication → Users → crear usuario dueño
--   2. Copiar la URL y anon key del proyecto
--   3. Arrancar con el frontend React
-- ============================================
