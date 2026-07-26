-- ==============================================================================
-- MIGRACIÓN 6A.1: Soporte para Admin Catálogo B2B (Estructura y Performance)
-- ==============================================================================
-- Propósito: Prepara el modelo de datos para escalabilidad, búsquedas y SEO 
-- requeridos por el Panel Administrador, sin ejecutar inserciones aún.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- A) Ampliación de web_b2b.categories
-- ------------------------------------------------------------------------------
ALTER TABLE web_b2b.categories
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS banner_image_url text,
ADD COLUMN IF NOT EXISTS display_style text DEFAULT 'grid',
ADD COLUMN IF NOT EXISTS icon_name text,
ADD COLUMN IF NOT EXISTS seo_title text,
ADD COLUMN IF NOT EXISTS seo_description text,
ADD COLUMN IF NOT EXISTS is_visible_home boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_visible_catalog boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'web_b2b.categories'::regclass AND conname = 'chk_categories_display_style'
  ) THEN
    ALTER TABLE web_b2b.categories ADD CONSTRAINT chk_categories_display_style CHECK (display_style IN ('grid', 'list', 'banner', 'hidden'));
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- B) Ampliación de web_b2b.products
-- ------------------------------------------------------------------------------
ALTER TABLE web_b2b.products
ADD COLUMN IF NOT EXISTS bsale_sync_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS bsale_sync_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS bsale_last_checked_at timestamptz,
ADD COLUMN IF NOT EXISTS seo_title text,
ADD COLUMN IF NOT EXISTS seo_description text,
ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'web_b2b.products'::regclass AND conname = 'chk_products_bsale_sync_status'
  ) THEN
    ALTER TABLE web_b2b.products ADD CONSTRAINT chk_products_bsale_sync_status CHECK (bsale_sync_status IN ('pending', 'synced', 'error', 'disabled'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'web_b2b.products'::regclass AND conname = 'chk_products_review_status'
  ) THEN
    ALTER TABLE web_b2b.products ADD CONSTRAINT chk_products_review_status CHECK (review_status IN ('draft', 'ready', 'published', 'hidden'));
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- C) Índices de Rendimiento Adicionales
-- ------------------------------------------------------------------------------
-- Índices Categorías
CREATE INDEX IF NOT EXISTS idx_categories_is_visible_home ON web_b2b.categories(company_id, is_visible_home);
CREATE INDEX IF NOT EXISTS idx_categories_is_visible_catalog ON web_b2b.categories(company_id, is_visible_catalog);
CREATE INDEX IF NOT EXISTS idx_categories_order_index ON web_b2b.categories(company_id, order_index);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON web_b2b.categories(slug);

-- Índices Productos
CREATE INDEX IF NOT EXISTS idx_products_category_id ON web_b2b.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON web_b2b.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_review_status ON web_b2b.products(company_id, review_status);
CREATE INDEX IF NOT EXISTS idx_products_bsale_sync ON web_b2b.products(company_id, bsale_sync_enabled, bsale_sync_status);
CREATE INDEX IF NOT EXISTS idx_products_order_index ON web_b2b.products(company_id, order_index);

-- ------------------------------------------------------------------------------
-- D) Búsqueda (Trigram Indexing)
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Usar extensiones calificadas para gin_trgm_ops asegura que Supabase/PostgreSQL las encuentre 
-- correctamente en el esquema `extensions` sin depender del search_path local.
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON web_b2b.products USING gin (name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_sku_trgm ON web_b2b.products USING gin (sku extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_categories_name_trgm ON web_b2b.categories USING gin (name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_brands_name_trgm ON web_b2b.brands USING gin (name extensions.gin_trgm_ops);

-- ------------------------------------------------------------------------------
-- E) RPC Pública Paginada
-- Retorna array vacío si no hay coincidencias.
-- NO retorna precio, stock numérico ni variantes Bsale.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.web_b2b_get_public_catalog_products_paginated(
  target_company_id uuid,
  search_query text DEFAULT NULL,
  category_slug text DEFAULT NULL,
  brand_slug text DEFAULT NULL,
  page_size integer DEFAULT 24,
  page_number integer DEFAULT 1
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  short_description text,
  description text,
  is_featured boolean,
  brand_name text,
  category_name text,
  primary_image_url text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' -- Seguridad estricta PGRST106
AS $$
DECLARE
  v_limit integer;
  v_offset integer;
  v_total_count bigint;
  v_search text;
BEGIN
  -- 1. Sanitizar paginación
  IF page_size IS NULL OR page_size < 1 THEN
    v_limit := 24;
  ELSIF page_size > 60 THEN
    v_limit := 60;
  ELSE
    v_limit := page_size;
  END IF;

  IF page_number IS NULL OR page_number < 1 THEN
    v_offset := 0;
  ELSIF page_number > 500 THEN
    v_offset := (500 - 1) * v_limit;
  ELSE
    v_offset := (page_number - 1) * v_limit;
  END IF;

  -- 2. Normalizar búsqueda
  v_search := NULLIF(LEFT(TRIM(COALESCE(search_query, '')), 100), '');

  -- 3. Calcular count total primero
  SELECT COUNT(*)
  INTO v_total_count
  FROM web_b2b.products p
  LEFT JOIN web_b2b.categories c ON c.id = p.category_id
  LEFT JOIN web_b2b.brands b ON b.id = p.brand_id
  WHERE p.company_id = target_company_id
    AND p.is_active = true
    AND p.is_visible = true
    AND p.review_status = 'published'
    AND (category_slug IS NULL OR (c.company_id = target_company_id AND c.slug = category_slug))
    AND (brand_slug IS NULL OR (b.company_id = target_company_id AND b.slug = brand_slug))
    AND (
      v_search IS NULL 
      OR p.name ILIKE '%' || v_search || '%'
      OR p.sku ILIKE '%' || v_search || '%'
    );

  -- 4. Retornar dataset paginado
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.short_description,
    p.description,
    p.is_featured,
    b.name AS brand_name,
    c.name AS category_name,
    pi.url AS primary_image_url,
    v_total_count AS total_count
  FROM web_b2b.products p
  LEFT JOIN web_b2b.categories c ON c.id = p.category_id
  LEFT JOIN web_b2b.brands b ON b.id = p.brand_id
  LEFT JOIN web_b2b.product_images pi ON pi.product_id = p.id AND pi.is_primary = true
  WHERE p.company_id = target_company_id
    AND p.is_active = true
    AND p.is_visible = true
    AND p.review_status = 'published'
    AND (category_slug IS NULL OR (c.company_id = target_company_id AND c.slug = category_slug))
    AND (brand_slug IS NULL OR (b.company_id = target_company_id AND b.slug = brand_slug))
    AND (
      v_search IS NULL 
      OR p.name ILIKE '%' || v_search || '%'
      OR p.sku ILIKE '%' || v_search || '%'
    )
  ORDER BY p.order_index ASC NULLS LAST, p.created_at DESC
  LIMIT v_limit
  OFFSET v_offset;

END;
$$;

-- Revocación segura de permisos (principio de menor privilegio)
REVOKE ALL ON FUNCTION public.web_b2b_get_public_catalog_products_paginated(uuid, text, text, text, integer, integer) FROM public;
-- Otorgar solo a roles anónimo y autenticado
GRANT EXECUTE ON FUNCTION public.web_b2b_get_public_catalog_products_paginated(uuid, text, text, text, integer, integer) TO anon, authenticated;
