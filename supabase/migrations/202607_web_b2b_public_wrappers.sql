-- ==============================================================================
-- MIGRACIÓN DE CONTINGENCIA: WRAPPERS PÚBLICOS PARA WEB_B2B
-- Objetivo: Esquivar el error PGRST106 exponiendo funciones en el schema public.
-- Restricción: No se exponen tablas base (como products o admin_access).
-- ==============================================================================

-- 1. Wrapper para get_public_catalog_products
CREATE OR REPLACE FUNCTION public.web_b2b_get_public_catalog_products(target_company_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  short_description text,
  description text,
  is_featured boolean,
  brand_name text,
  category_name text,
  primary_image_url text
)
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  SELECT *
  FROM web_b2b.get_public_catalog_products(target_company_id);
$$;
REVOKE ALL ON FUNCTION public.web_b2b_get_public_catalog_products(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.web_b2b_get_public_catalog_products(uuid) TO anon, authenticated;

-- 2. Wrapper para get_public_product_by_slug
CREATE OR REPLACE FUNCTION public.web_b2b_get_public_product_by_slug(target_company_id uuid, product_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  short_description text,
  description text,
  is_featured boolean,
  brand_name text,
  category_name text,
  primary_image_url text
)
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  SELECT *
  FROM web_b2b.get_public_product_by_slug(target_company_id, product_slug);
$$;
REVOKE ALL ON FUNCTION public.web_b2b_get_public_product_by_slug(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.web_b2b_get_public_product_by_slug(uuid, text) TO anon, authenticated;

-- 3. Wrapper para get_public_brands
CREATE OR REPLACE FUNCTION public.web_b2b_get_public_brands(target_company_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  logo_url text
)
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  SELECT *
  FROM web_b2b.get_public_brands(target_company_id);
$$;
REVOKE ALL ON FUNCTION public.web_b2b_get_public_brands(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.web_b2b_get_public_brands(uuid) TO anon, authenticated;

-- 4. Wrapper para get_public_categories
CREATE OR REPLACE FUNCTION public.web_b2b_get_public_categories(target_company_id uuid)
RETURNS TABLE (
  id uuid,
  parent_id uuid,
  name text,
  slug text
)
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  SELECT *
  FROM web_b2b.get_public_categories(target_company_id);
$$;
REVOKE ALL ON FUNCTION public.web_b2b_get_public_categories(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.web_b2b_get_public_categories(uuid) TO anon, authenticated;

-- 5. Wrapper para get_public_banners
CREATE OR REPLACE FUNCTION public.web_b2b_get_public_banners(target_company_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  image_url text,
  link_url text,
  "position" text,
  order_index integer
)
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  SELECT *
  FROM web_b2b.get_public_banners(target_company_id);
$$;
REVOKE ALL ON FUNCTION public.web_b2b_get_public_banners(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.web_b2b_get_public_banners(uuid) TO anon, authenticated;

-- 6. Wrapper para get_public_promotions
CREATE OR REPLACE FUNCTION public.web_b2b_get_public_promotions(target_company_id uuid)
RETURNS TABLE (
  id uuid,
  product_id uuid,
  title text,
  description text,
  badge_text text,
  start_date timestamptz,
  end_date timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  SELECT *
  FROM web_b2b.get_public_promotions(target_company_id);
$$;
REVOKE ALL ON FUNCTION public.web_b2b_get_public_promotions(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.web_b2b_get_public_promotions(uuid) TO anon, authenticated;

-- 7. Wrapper para admin_access
CREATE OR REPLACE FUNCTION public.web_b2b_get_current_admin_access(target_company_id uuid)
RETURNS TABLE (
  role text,
  company_id uuid,
  is_active boolean,
  mfa_required boolean
)
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  SELECT 
    a.role, 
    a.company_id, 
    a.is_active, 
    a.mfa_required
  FROM web_b2b.admin_access a
  WHERE a.user_id = auth.uid()
    AND a.company_id = target_company_id
    AND a.is_active = true
    AND auth.uid() IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.web_b2b_get_current_admin_access(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.web_b2b_get_current_admin_access(uuid) TO authenticated;
