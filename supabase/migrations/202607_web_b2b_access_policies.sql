-- ==============================================================================
-- MIGRACIÓN DE POLÍTICAS DE ACCESO (Fase 2)
-- Archivo: 202607_web_b2b_access_policies.sql
-- ==============================================================================

-- Limpieza preventiva de helpers de versiones anteriores (sin company_id)
DROP FUNCTION IF EXISTS web_b2b.is_web_admin() CASCADE;
DROP FUNCTION IF EXISTS web_b2b.is_web_content_manager() CASCADE;
DROP FUNCTION IF EXISTS web_b2b.is_web_super_admin() CASCADE;
DROP FUNCTION IF EXISTS web_b2b.is_approved_customer() CASCADE;
DROP FUNCTION IF EXISTS web_b2b.customer_can_view_prices() CASCADE;
DROP FUNCTION IF EXISTS web_b2b.get_public_catalog_products() CASCADE;
DROP FUNCTION IF EXISTS web_b2b.get_public_product_by_slug(text) CASCADE;

-- ==============================================================================
-- 1. FUNCIONES HELPER (SECURITY DEFINER para sortear RLS si es necesario)
-- ==============================================================================

-- 1.A) is_web_admin_for_company()
CREATE OR REPLACE FUNCTION web_b2b.is_web_admin_for_company(target_company_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = web_b2b
AS $$
  SELECT EXISTS (
    SELECT 1 FROM web_b2b.admin_access
    WHERE user_id = auth.uid()
      AND company_id = target_company_id
      AND is_active = true
      AND role IN ('WEB_SUPER_ADMIN', 'WEB_ADMIN', 'WEB_CONTENT_MANAGER', 'WEB_SALES')
  );
$$;
REVOKE ALL ON FUNCTION web_b2b.is_web_admin_for_company(uuid) FROM public;
GRANT EXECUTE ON FUNCTION web_b2b.is_web_admin_for_company(uuid) TO authenticated;

-- 1.B) is_web_content_manager_for_company()
CREATE OR REPLACE FUNCTION web_b2b.is_web_content_manager_for_company(target_company_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = web_b2b
AS $$
  SELECT EXISTS (
    SELECT 1 FROM web_b2b.admin_access
    WHERE user_id = auth.uid()
      AND company_id = target_company_id
      AND is_active = true
      AND role IN ('WEB_SUPER_ADMIN', 'WEB_ADMIN', 'WEB_CONTENT_MANAGER')
  );
$$;
REVOKE ALL ON FUNCTION web_b2b.is_web_content_manager_for_company(uuid) FROM public;
GRANT EXECUTE ON FUNCTION web_b2b.is_web_content_manager_for_company(uuid) TO authenticated;

-- 1.C) is_web_super_admin_for_company()
CREATE OR REPLACE FUNCTION web_b2b.is_web_super_admin_for_company(target_company_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = web_b2b
AS $$
  SELECT EXISTS (
    SELECT 1 FROM web_b2b.admin_access
    WHERE user_id = auth.uid()
      AND company_id = target_company_id
      AND is_active = true
      AND role = 'WEB_SUPER_ADMIN'
  );
$$;
REVOKE ALL ON FUNCTION web_b2b.is_web_super_admin_for_company(uuid) FROM public;
GRANT EXECUTE ON FUNCTION web_b2b.is_web_super_admin_for_company(uuid) TO authenticated;

-- 1.D) is_approved_customer_for_company()
CREATE OR REPLACE FUNCTION web_b2b.is_approved_customer_for_company(target_company_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = web_b2b
AS $$
  SELECT EXISTS (
    SELECT 1 FROM web_b2b.customer_access
    WHERE user_id = auth.uid()
      AND company_id = target_company_id
      AND status = 'approved'
  );
$$;
REVOKE ALL ON FUNCTION web_b2b.is_approved_customer_for_company(uuid) FROM public;
GRANT EXECUTE ON FUNCTION web_b2b.is_approved_customer_for_company(uuid) TO authenticated;

-- 1.E) customer_can_view_prices_for_company()
CREATE OR REPLACE FUNCTION web_b2b.customer_can_view_prices_for_company(target_company_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = web_b2b
AS $$
  SELECT EXISTS (
    SELECT 1 FROM web_b2b.customer_access
    WHERE user_id = auth.uid()
      AND company_id = target_company_id
      AND status = 'approved'
      AND can_view_prices = true
  );
$$;
REVOKE ALL ON FUNCTION web_b2b.customer_can_view_prices_for_company(uuid) FROM public;
GRANT EXECUTE ON FUNCTION web_b2b.customer_can_view_prices_for_company(uuid) TO authenticated;

-- 1.F) can_manage_customers_for_company()
CREATE OR REPLACE FUNCTION web_b2b.can_manage_customers_for_company(target_company_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = web_b2b
AS $$
  SELECT EXISTS (
    SELECT 1 FROM web_b2b.admin_access
    WHERE user_id = auth.uid()
      AND company_id = target_company_id
      AND is_active = true
      AND role IN ('WEB_SUPER_ADMIN', 'WEB_ADMIN', 'WEB_SALES')
  );
$$;
REVOKE ALL ON FUNCTION web_b2b.can_manage_customers_for_company(uuid) FROM public;
GRANT EXECUTE ON FUNCTION web_b2b.can_manage_customers_for_company(uuid) TO authenticated;


-- ==============================================================================
-- 2. POLÍTICAS PÚBLICAS MÍNIMAS
-- ==============================================================================

-- IMPORTANTE: No hay públicas para brands, categories, banners, promotions, products, product_images, product_prices, etc.
-- TODO ACCESO PÚBLICO SE HACE POR RPC


-- ==============================================================================
-- 3. FUNCIONES RPC PARA CATÁLOGO PÚBLICO (SEGURIDAD DE COLUMNAS)
-- ==============================================================================

DROP TYPE IF EXISTS web_b2b.public_product_info CASCADE;
CREATE TYPE web_b2b.public_product_info AS (
  id uuid,
  name text,
  slug text,
  short_description text,
  description text,
  is_featured boolean,
  brand_name text,
  category_name text,
  primary_image_url text
);

DROP TYPE IF EXISTS web_b2b.public_brand_info CASCADE;
CREATE TYPE web_b2b.public_brand_info AS (
  id uuid,
  name text,
  slug text,
  logo_url text
);

DROP TYPE IF EXISTS web_b2b.public_category_info CASCADE;
CREATE TYPE web_b2b.public_category_info AS (
  id uuid,
  parent_id uuid,
  name text,
  slug text
);

DROP TYPE IF EXISTS web_b2b.public_banner_info CASCADE;
CREATE TYPE web_b2b.public_banner_info AS (
  id uuid,
  title text,
  image_url text,
  link_url text,
  position text,
  order_index integer
);

DROP TYPE IF EXISTS web_b2b.public_promotion_info CASCADE;
CREATE TYPE web_b2b.public_promotion_info AS (
  id uuid,
  product_id uuid,
  title text,
  description text,
  badge_text text,
  start_date timestamptz,
  end_date timestamptz
);

-- RPC: Catálogo general
CREATE OR REPLACE FUNCTION web_b2b.get_public_catalog_products(target_company_id uuid)
RETURNS SETOF web_b2b.public_product_info
LANGUAGE sql SECURITY DEFINER SET search_path = web_b2b
AS $$
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.short_description,
    p.description,
    p.is_featured,
    b.name AS brand_name,
    c.name AS category_name,
    (SELECT pi.url FROM web_b2b.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS primary_image_url
  FROM web_b2b.products p
  LEFT JOIN web_b2b.brands b ON p.brand_id = b.id
  LEFT JOIN web_b2b.categories c ON p.category_id = c.id
  WHERE p.company_id = target_company_id
    AND p.is_active = true 
    AND p.is_visible = true
    AND (b.id IS NULL OR (b.company_id = target_company_id AND b.is_active = true))
    AND (c.id IS NULL OR (c.company_id = target_company_id AND c.is_active = true));
$$;
REVOKE ALL ON FUNCTION web_b2b.get_public_catalog_products(uuid) FROM public;
GRANT EXECUTE ON FUNCTION web_b2b.get_public_catalog_products(uuid) TO anon, authenticated;

-- RPC: Detalle de producto por slug
CREATE OR REPLACE FUNCTION web_b2b.get_public_product_by_slug(target_company_id uuid, product_slug text)
RETURNS SETOF web_b2b.public_product_info
LANGUAGE sql SECURITY DEFINER SET search_path = web_b2b
AS $$
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.short_description,
    p.description,
    p.is_featured,
    b.name AS brand_name,
    c.name AS category_name,
    (SELECT pi.url FROM web_b2b.product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS primary_image_url
  FROM web_b2b.products p
  LEFT JOIN web_b2b.brands b ON p.brand_id = b.id
  LEFT JOIN web_b2b.categories c ON p.category_id = c.id
  WHERE p.company_id = target_company_id
    AND p.slug = product_slug
    AND p.is_active = true 
    AND p.is_visible = true
    AND (b.id IS NULL OR (b.company_id = target_company_id AND b.is_active = true))
    AND (c.id IS NULL OR (c.company_id = target_company_id AND c.is_active = true));
$$;
REVOKE ALL ON FUNCTION web_b2b.get_public_product_by_slug(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION web_b2b.get_public_product_by_slug(uuid, text) TO anon, authenticated;

-- RPC: Marcas públicas
CREATE OR REPLACE FUNCTION web_b2b.get_public_brands(target_company_id uuid)
RETURNS SETOF web_b2b.public_brand_info
LANGUAGE sql SECURITY DEFINER SET search_path = web_b2b
AS $$
  SELECT id, name, slug, logo_url
  FROM web_b2b.brands
  WHERE company_id = target_company_id
    AND is_active = true;
$$;
REVOKE ALL ON FUNCTION web_b2b.get_public_brands(uuid) FROM public;
GRANT EXECUTE ON FUNCTION web_b2b.get_public_brands(uuid) TO anon, authenticated;

-- RPC: Categorías públicas
CREATE OR REPLACE FUNCTION web_b2b.get_public_categories(target_company_id uuid)
RETURNS SETOF web_b2b.public_category_info
LANGUAGE sql SECURITY DEFINER SET search_path = web_b2b
AS $$
  SELECT id, parent_id, name, slug
  FROM web_b2b.categories
  WHERE company_id = target_company_id
    AND is_active = true;
$$;
REVOKE ALL ON FUNCTION web_b2b.get_public_categories(uuid) FROM public;
GRANT EXECUTE ON FUNCTION web_b2b.get_public_categories(uuid) TO anon, authenticated;

-- RPC: Banners públicos
CREATE OR REPLACE FUNCTION web_b2b.get_public_banners(target_company_id uuid)
RETURNS SETOF web_b2b.public_banner_info
LANGUAGE sql SECURITY DEFINER SET search_path = web_b2b
AS $$
  SELECT id, title, image_url, link_url, position, order_index
  FROM web_b2b.banners
  WHERE company_id = target_company_id
    AND is_active = true;
$$;
REVOKE ALL ON FUNCTION web_b2b.get_public_banners(uuid) FROM public;
GRANT EXECUTE ON FUNCTION web_b2b.get_public_banners(uuid) TO anon, authenticated;

-- RPC: Promociones públicas
CREATE OR REPLACE FUNCTION web_b2b.get_public_promotions(target_company_id uuid)
RETURNS SETOF web_b2b.public_promotion_info
LANGUAGE sql SECURITY DEFINER SET search_path = web_b2b
AS $$
  SELECT id, product_id, title, description, badge_text, start_date, end_date
  FROM web_b2b.promotions
  WHERE company_id = target_company_id
    AND is_active = true
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now());
$$;
REVOKE ALL ON FUNCTION web_b2b.get_public_promotions(uuid) FROM public;
GRANT EXECUTE ON FUNCTION web_b2b.get_public_promotions(uuid) TO anon, authenticated;


-- ==============================================================================
-- 4. POLÍTICAS PARA CLIENTES B2B APROBADOS
-- ==============================================================================

CREATE POLICY "Customers can view their own access record" ON web_b2b.customer_access
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Approved customers can view prices" ON web_b2b.product_prices
  FOR SELECT USING (web_b2b.customer_can_view_prices_for_company(company_id));


-- ==============================================================================
-- 5. POLÍTICAS PARA ADMINISTRADORES WEB
-- ==============================================================================

-- LECTURA TOTAL LIMITADA A LA EMPRESA
CREATE POLICY "Admins can view all brands" ON web_b2b.brands FOR SELECT USING (web_b2b.is_web_admin_for_company(company_id));
CREATE POLICY "Admins can view all categories" ON web_b2b.categories FOR SELECT USING (web_b2b.is_web_admin_for_company(company_id));
CREATE POLICY "Admins can view all products" ON web_b2b.products FOR SELECT USING (web_b2b.is_web_admin_for_company(company_id));
CREATE POLICY "Admins can view all images" ON web_b2b.product_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM web_b2b.products p WHERE p.id = product_images.product_id AND web_b2b.is_web_admin_for_company(p.company_id))
);
CREATE POLICY "Admins can view all banners" ON web_b2b.banners FOR SELECT USING (web_b2b.is_web_admin_for_company(company_id));
CREATE POLICY "Admins can view all promotions" ON web_b2b.promotions FOR SELECT USING (web_b2b.is_web_admin_for_company(company_id));
CREATE POLICY "Admins can view all prices" ON web_b2b.product_prices FOR SELECT USING (web_b2b.is_web_admin_for_company(company_id));
CREATE POLICY "Admins can view all stock" ON web_b2b.product_stock FOR SELECT USING (web_b2b.is_web_admin_for_company(company_id));
CREATE POLICY "Admins can view all sync logs" ON web_b2b.sync_logs FOR SELECT USING (web_b2b.is_web_admin_for_company(company_id));
CREATE POLICY "Admins can view all audit logs" ON web_b2b.admin_audit_logs FOR SELECT USING (web_b2b.is_web_admin_for_company(company_id));

-- MUTACIONES CONTENT MANAGERS LIMITADAS A LA EMPRESA
-- IMPORTANTE: No se permite borrado físico de productos, marcas ni categorías desde roles de contenido en MVP.
-- La eliminación real debe hacerse por service role/backend controlado o una futura política específica de super admin.
-- La desactivación (soft-delete) se maneja mediante UPDATE en los campos is_active / is_visible.

CREATE POLICY "Content managers can insert brands" ON web_b2b.brands FOR INSERT WITH CHECK (web_b2b.is_web_content_manager_for_company(company_id));
CREATE POLICY "Content managers can update brands" ON web_b2b.brands FOR UPDATE USING (web_b2b.is_web_content_manager_for_company(company_id)) WITH CHECK (web_b2b.is_web_content_manager_for_company(company_id));
-- CREATE POLICY "Content managers can delete brands" ON web_b2b.brands FOR DELETE USING (web_b2b.is_web_content_manager_for_company(company_id));

CREATE POLICY "Content managers can insert categories" ON web_b2b.categories FOR INSERT WITH CHECK (web_b2b.is_web_content_manager_for_company(company_id));
CREATE POLICY "Content managers can update categories" ON web_b2b.categories FOR UPDATE USING (web_b2b.is_web_content_manager_for_company(company_id)) WITH CHECK (web_b2b.is_web_content_manager_for_company(company_id));
-- CREATE POLICY "Content managers can delete categories" ON web_b2b.categories FOR DELETE USING (web_b2b.is_web_content_manager_for_company(company_id));

CREATE POLICY "Content managers can insert products" ON web_b2b.products FOR INSERT WITH CHECK (web_b2b.is_web_content_manager_for_company(company_id));
CREATE POLICY "Content managers can update products" ON web_b2b.products FOR UPDATE USING (web_b2b.is_web_content_manager_for_company(company_id)) WITH CHECK (web_b2b.is_web_content_manager_for_company(company_id));
-- CREATE POLICY "Content managers can delete products" ON web_b2b.products FOR DELETE USING (web_b2b.is_web_content_manager_for_company(company_id));

CREATE POLICY "Content managers can insert images" ON web_b2b.product_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM web_b2b.products p WHERE p.id = product_id AND web_b2b.is_web_content_manager_for_company(p.company_id))
);
CREATE POLICY "Content managers can update images" ON web_b2b.product_images FOR UPDATE USING (
  EXISTS (SELECT 1 FROM web_b2b.products p WHERE p.id = product_id AND web_b2b.is_web_content_manager_for_company(p.company_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM web_b2b.products p WHERE p.id = product_id AND web_b2b.is_web_content_manager_for_company(p.company_id))
);
CREATE POLICY "Content managers can delete images" ON web_b2b.product_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM web_b2b.products p WHERE p.id = product_id AND web_b2b.is_web_content_manager_for_company(p.company_id))
);

CREATE POLICY "Content managers can insert banners" ON web_b2b.banners FOR INSERT WITH CHECK (web_b2b.is_web_content_manager_for_company(company_id));
CREATE POLICY "Content managers can update banners" ON web_b2b.banners FOR UPDATE USING (web_b2b.is_web_content_manager_for_company(company_id)) WITH CHECK (web_b2b.is_web_content_manager_for_company(company_id));
CREATE POLICY "Content managers can delete banners" ON web_b2b.banners FOR DELETE USING (web_b2b.is_web_content_manager_for_company(company_id));

CREATE POLICY "Content managers can insert promotions" ON web_b2b.promotions FOR INSERT WITH CHECK (web_b2b.is_web_content_manager_for_company(company_id));
CREATE POLICY "Content managers can update promotions" ON web_b2b.promotions FOR UPDATE USING (web_b2b.is_web_content_manager_for_company(company_id)) WITH CHECK (web_b2b.is_web_content_manager_for_company(company_id));
CREATE POLICY "Content managers can delete promotions" ON web_b2b.promotions FOR DELETE USING (web_b2b.is_web_content_manager_for_company(company_id));

-- GESTIÓN DE CUSTOMER_ACCESS
CREATE POLICY "Admins and Sales can read customer access" ON web_b2b.customer_access 
  FOR SELECT USING (
    user_id = auth.uid() OR web_b2b.can_manage_customers_for_company(company_id)
  );

CREATE POLICY "Admins can update customer access" ON web_b2b.customer_access 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM web_b2b.admin_access 
      WHERE user_id = auth.uid() 
        AND is_active = true 
        AND company_id = customer_access.company_id 
        AND role IN ('WEB_SUPER_ADMIN', 'WEB_ADMIN')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM web_b2b.admin_access 
      WHERE user_id = auth.uid() 
        AND is_active = true 
        AND company_id = customer_access.company_id 
        AND role IN ('WEB_SUPER_ADMIN', 'WEB_ADMIN')
    )
  );

-- GESTIÓN DE ADMIN_ACCESS
CREATE POLICY "Super Admins can read admin access" ON web_b2b.admin_access FOR SELECT USING (web_b2b.is_web_super_admin_for_company(company_id));
CREATE POLICY "Super Admins can insert admin access" ON web_b2b.admin_access FOR INSERT WITH CHECK (web_b2b.is_web_super_admin_for_company(company_id));
CREATE POLICY "Super Admins can update admin access" ON web_b2b.admin_access FOR UPDATE USING (web_b2b.is_web_super_admin_for_company(company_id)) WITH CHECK (web_b2b.is_web_super_admin_for_company(company_id));
CREATE POLICY "Super Admins can delete admin access" ON web_b2b.admin_access FOR DELETE USING (web_b2b.is_web_super_admin_for_company(company_id));
