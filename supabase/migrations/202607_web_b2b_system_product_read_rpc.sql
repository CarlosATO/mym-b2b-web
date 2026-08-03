-- ==============================================================================
-- MIGRACIÓN 6D.2B: RPC System Read-Only para Import Worker
-- ==============================================================================

DROP FUNCTION IF EXISTS public.web_b2b_system_list_products_for_import(uuid);

-- ------------------------------------------------------------------------------
-- 1. Listado de Productos Sistema (Solo Lectura, Sin Sesión, Para Service Role)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.web_b2b_system_list_products_for_import(
  target_company_id uuid
)
RETURNS TABLE (
  id uuid,
  sku text,
  bsale_variant_id text,
  name text,
  slug text,
  is_active boolean,
  is_visible boolean,
  review_status text,
  has_curated_content boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.sku,
    p.bsale_variant_id,
    p.name,
    p.slug,
    p.is_active,
    p.is_visible,
    p.review_status,
    (
      NULLIF(TRIM(COALESCE(p.short_description, '')), '') IS NOT NULL OR
      NULLIF(TRIM(COALESCE(p.description, '')), '') IS NOT NULL OR
      NULLIF(TRIM(COALESCE(p.seo_title, '')), '') IS NOT NULL OR
      NULLIF(TRIM(COALESCE(p.seo_description, '')), '') IS NOT NULL
    ) AS has_curated_content
  FROM web_b2b.products p
  WHERE p.company_id = target_company_id
  ORDER BY p.created_at ASC, p.id ASC;
END;
$$;

-- Restricción estricta de permisos
REVOKE ALL ON FUNCTION public.web_b2b_system_list_products_for_import(uuid) FROM public;
REVOKE ALL ON FUNCTION public.web_b2b_system_list_products_for_import(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.web_b2b_system_list_products_for_import(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.web_b2b_system_list_products_for_import(uuid) TO service_role;
