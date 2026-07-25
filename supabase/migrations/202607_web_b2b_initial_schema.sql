-- Esquema principal para B2B Web
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE SCHEMA IF NOT EXISTS web_b2b;

-- Tabla: web_b2b.brands
CREATE TABLE IF NOT EXISTS web_b2b.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (company_id, slug)
);

-- Tabla: web_b2b.categories
CREATE TABLE IF NOT EXISTS web_b2b.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  parent_id uuid REFERENCES web_b2b.categories(id),
  name text NOT NULL,
  slug text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (company_id, slug)
);

-- Tabla: web_b2b.products
CREATE TABLE IF NOT EXISTS web_b2b.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  brand_id uuid REFERENCES web_b2b.brands(id),
  category_id uuid REFERENCES web_b2b.categories(id),
  bsale_variant_id text, -- Puede ser null si el producto no está sincronizado
  name text NOT NULL,
  slug text NOT NULL,
  sku text, -- Puede ser null
  short_description text,
  description text,
  is_active boolean DEFAULT true,
  is_visible boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (company_id, slug),
  UNIQUE (company_id, sku),
  UNIQUE (company_id, bsale_variant_id)
);

-- Índices para products
CREATE INDEX IF NOT EXISTS idx_products_company_id ON web_b2b.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_visibility ON web_b2b.products(company_id, is_visible, is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON web_b2b.products(company_id, is_featured);
CREATE INDEX IF NOT EXISTS idx_products_sku ON web_b2b.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_bsale_variant_id ON web_b2b.products(bsale_variant_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON web_b2b.products(slug);
CREATE INDEX IF NOT EXISTS idx_categories_company_parent ON web_b2b.categories(company_id, parent_id);

-- Tabla: web_b2b.product_images
CREATE TABLE IF NOT EXISTS web_b2b.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES web_b2b.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  is_primary boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_one_primary ON web_b2b.product_images(product_id) WHERE is_primary = true;

-- Tabla: web_b2b.product_prices
-- NOTA: Bsale será la fuente oficial de precios.
-- Los precios solo serán visibles para clientes aprobados.
CREATE TABLE IF NOT EXISTS web_b2b.product_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES web_b2b.products(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  price numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'CLP' CHECK (currency IN ('CLP')),
  source text NOT NULL CHECK (source IN ('bsale', 'manual', 'import')),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (product_id, company_id, source)
);
CREATE INDEX IF NOT EXISTS idx_product_prices_product_id ON web_b2b.product_prices(product_id);

-- Tabla: web_b2b.product_stock
-- NOTA: Bsale será la fuente oficial de stock.
CREATE TABLE IF NOT EXISTS web_b2b.product_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES web_b2b.products(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('in_stock', 'low_stock', 'out_of_stock', 'unknown')),
  source text NOT NULL CHECK (source IN ('bsale', 'manual', 'import')),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (product_id, company_id, source)
);
CREATE INDEX IF NOT EXISTS idx_product_stock_product_id ON web_b2b.product_stock(product_id);

-- Tabla: web_b2b.banners
CREATE TABLE IF NOT EXISTS web_b2b.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  title text,
  image_url text NOT NULL,
  link_url text,
  position text NOT NULL,
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_banners_company_active ON web_b2b.banners(company_id, is_active);

-- Tabla: web_b2b.promotions
CREATE TABLE IF NOT EXISTS web_b2b.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  product_id uuid REFERENCES web_b2b.products(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  badge_text text,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_promotions_company_active ON web_b2b.promotions(company_id, is_active);

-- Tabla: web_b2b.customer_access
CREATE TABLE IF NOT EXISTS web_b2b.customer_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  customer_email text NOT NULL,
  business_name text,
  tax_id text,
  bsale_client_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  can_view_prices boolean DEFAULT false,
  can_create_orders boolean DEFAULT false,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_customer_access_user_id ON web_b2b.customer_access(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_access_email ON web_b2b.customer_access(customer_email);
CREATE INDEX IF NOT EXISTS idx_customer_access_company_status ON web_b2b.customer_access(company_id, status);

-- Tabla: web_b2b.admin_access (Autorización separada del ERP)
CREATE TABLE IF NOT EXISTS web_b2b.admin_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid NOT NULL, -- ID del usuario en auth.users
  role text NOT NULL CHECK (role IN ('WEB_SUPER_ADMIN', 'WEB_ADMIN', 'WEB_CONTENT_MANAGER', 'WEB_SALES')),
  is_active boolean DEFAULT true,
  mfa_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (company_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_admin_access_user_id ON web_b2b.admin_access(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_access_company_active ON web_b2b.admin_access(company_id, is_active);

-- Tabla: web_b2b.admin_audit_logs
CREATE TABLE IF NOT EXISTS web_b2b.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Tabla: web_b2b.sync_logs
CREATE TABLE IF NOT EXISTS web_b2b.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  sync_type text NOT NULL, -- e.g., 'bsale_products', 'bsale_prices'
  status text NOT NULL CHECK (status IN ('success', 'error', 'running')),
  records_processed integer DEFAULT 0,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- ==============================================================================
-- SEGURIDAD Y POLÍTICAS (Row Level Security - RLS)
-- ==============================================================================
-- REGLAS ESTRICTAS DE SEGURIDAD:
-- 1. Las tablas base no deben exponerse directamente al frontend sin políticas.
-- 2. Los clientes B2B no tienen acceso al ERP bajo ninguna circunstancia.
-- 3. Los usuarios ERP no tienen acceso automático al admin web.
-- 4. El uso del Service Role está estrictamente reservado para backend y sincronizadores.
-- ==============================================================================

-- Activar RLS en TODAS las tablas web_b2b (Enfoque Deny-by-Default)
ALTER TABLE web_b2b.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_b2b.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_b2b.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_b2b.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_b2b.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_b2b.product_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_b2b.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_b2b.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_b2b.customer_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_b2b.admin_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_b2b.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_b2b.sync_logs ENABLE ROW LEVEL SECURITY;

-- NOTA IMPORTANTE:
-- No se han creado políticas (Policies) permisivas amplias en esta fase.
-- Todas las tablas bloquean operaciones por defecto para la API de Supabase.
-- Las políticas específicas para lectura de catálogo, precios a clientes aprobados
-- y acceso a administradores se crearán en una migración posterior, garantizando
-- que no exista exposición de datos accidental.
