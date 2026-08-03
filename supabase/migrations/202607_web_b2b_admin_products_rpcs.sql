-- ==============================================================================
-- MIGRACIÓN 6C.1: RPCs Admin Productos
-- ==============================================================================

DROP FUNCTION IF EXISTS public.web_b2b_admin_list_products(uuid, text, text, uuid, uuid, integer, integer);
DROP FUNCTION IF EXISTS public.web_b2b_admin_get_product(uuid, uuid);
DROP FUNCTION IF EXISTS public.web_b2b_admin_upsert_product(uuid, uuid, text, text, text, text, text, uuid, uuid, boolean, boolean, boolean, text, integer, text, text, bigint, boolean, text, text);
DROP FUNCTION IF EXISTS public.web_b2b_admin_upsert_product(uuid, uuid, text, text, text, text, text, uuid, uuid, boolean, boolean, boolean, text, integer, text, text, text, boolean, text, text);
DROP FUNCTION IF EXISTS public.web_b2b_admin_set_product_status(uuid, uuid, boolean, boolean, text);

-- ------------------------------------------------------------------------------
-- 1. Listado de Productos Admin (Paginado)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.web_b2b_admin_list_products(
  p_target_company_id uuid,
  search_query text DEFAULT NULL,
  filter_review_status text DEFAULT NULL,
  filter_category_id uuid DEFAULT NULL,
  filter_brand_id uuid DEFAULT NULL,
  page_size integer DEFAULT 50,
  page_number integer DEFAULT 1
)
RETURNS TABLE (
  id uuid,
  sku text,
  name text,
  slug text,
  short_description text,
  description text,
  brand_id uuid,
  brand_name text,
  category_id uuid,
  category_name text,
  is_active boolean,
  is_visible boolean,
  is_featured boolean,
  review_status text,
  order_index integer,
  seo_title text,
  seo_description text,
  bsale_variant_id text,
  bsale_sync_enabled boolean,
  bsale_sync_status text,
  bsale_last_checked_at timestamptz,
  primary_image_url text,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_limit integer;
  v_offset integer;
  v_total_count bigint;
  v_search text;
BEGIN
  -- Validar acceso admin
  PERFORM web_b2b.check_admin_access(p_target_company_id);

  -- 1. Sanitizar paginación
  IF page_size IS NULL OR page_size < 1 THEN
    v_limit := 50;
  ELSIF page_size > 100 THEN
    v_limit := 100;
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

  -- 3. Calcular total de registros para paginación
  SELECT COUNT(*)
  INTO v_total_count
  FROM web_b2b.products p
  WHERE p.company_id = p_target_company_id
    AND (filter_review_status IS NULL OR p.review_status = filter_review_status)
    AND (filter_category_id IS NULL OR p.category_id = filter_category_id)
    AND (filter_brand_id IS NULL OR p.brand_id = filter_brand_id)
    AND (
      v_search IS NULL 
      OR p.name ILIKE '%' || v_search || '%'
      OR p.sku ILIKE '%' || v_search || '%'
    );

  RETURN QUERY
  SELECT 
    p.id,
    p.sku,
    p.name,
    p.slug,
    p.short_description,
    p.description,
    p.brand_id,
    b.name AS brand_name,
    p.category_id,
    c.name AS category_name,
    p.is_active,
    p.is_visible,
    p.is_featured,
    p.review_status,
    p.order_index,
    p.seo_title,
    p.seo_description,
    p.bsale_variant_id,
    p.bsale_sync_enabled,
    p.bsale_sync_status,
    p.bsale_last_checked_at,
    pi.url AS primary_image_url,
    p.created_at,
    p.updated_at,
    v_total_count AS total_count
  FROM web_b2b.products p
  LEFT JOIN web_b2b.categories c 
    ON c.id = p.category_id 
   AND c.company_id = p.company_id
  LEFT JOIN web_b2b.brands b 
    ON b.id = p.brand_id 
   AND b.company_id = p.company_id
  LEFT JOIN web_b2b.product_images pi ON pi.product_id = p.id AND pi.is_primary = true
  WHERE p.company_id = p_target_company_id
    AND (filter_review_status IS NULL OR p.review_status = filter_review_status)
    AND (filter_category_id IS NULL OR p.category_id = filter_category_id)
    AND (filter_brand_id IS NULL OR p.brand_id = filter_brand_id)
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

REVOKE ALL ON FUNCTION public.web_b2b_admin_list_products(uuid, text, text, uuid, uuid, integer, integer) FROM public;
REVOKE ALL ON FUNCTION public.web_b2b_admin_list_products(uuid, text, text, uuid, uuid, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.web_b2b_admin_list_products(uuid, text, text, uuid, uuid, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.web_b2b_admin_list_products(uuid, text, text, uuid, uuid, integer, integer) TO authenticated;


-- ------------------------------------------------------------------------------
-- 2. Obtener Producto Específico Admin
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.web_b2b_admin_get_product(p_target_company_id uuid, p_product_id uuid)
RETURNS TABLE (
  id uuid,
  sku text,
  name text,
  slug text,
  short_description text,
  description text,
  brand_id uuid,
  brand_name text,
  category_id uuid,
  category_name text,
  is_active boolean,
  is_visible boolean,
  is_featured boolean,
  review_status text,
  order_index integer,
  seo_title text,
  seo_description text,
  bsale_variant_id text,
  bsale_sync_enabled boolean,
  bsale_sync_status text,
  bsale_last_checked_at timestamptz,
  primary_image_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Validar acceso admin
  PERFORM web_b2b.check_admin_access(p_target_company_id);

  RETURN QUERY
  SELECT 
    p.id,
    p.sku,
    p.name,
    p.slug,
    p.short_description,
    p.description,
    p.brand_id,
    b.name AS brand_name,
    p.category_id,
    c.name AS category_name,
    p.is_active,
    p.is_visible,
    p.is_featured,
    p.review_status,
    p.order_index,
    p.seo_title,
    p.seo_description,
    p.bsale_variant_id,
    p.bsale_sync_enabled,
    p.bsale_sync_status,
    p.bsale_last_checked_at,
    pi.url AS primary_image_url,
    p.created_at,
    p.updated_at
  FROM web_b2b.products p
  LEFT JOIN web_b2b.categories c 
    ON c.id = p.category_id 
   AND c.company_id = p.company_id
  LEFT JOIN web_b2b.brands b 
    ON b.id = p.brand_id 
   AND b.company_id = p.company_id
  LEFT JOIN web_b2b.product_images pi ON pi.product_id = p.id AND pi.is_primary = true
  WHERE p.company_id = p_target_company_id AND p.id = p_product_id
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.web_b2b_admin_get_product(uuid, uuid) FROM public;
REVOKE ALL ON FUNCTION public.web_b2b_admin_get_product(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.web_b2b_admin_get_product(uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.web_b2b_admin_get_product(uuid, uuid) TO authenticated;


-- ------------------------------------------------------------------------------
-- 3. Upsert de Producto Admin
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.web_b2b_admin_upsert_product(
  p_product_id uuid,
  p_target_company_id uuid,
  p_sku text,
  p_name text,
  p_slug text,
  p_short_description text,
  p_description text,
  p_brand_id uuid,
  p_category_id uuid,
  p_is_active boolean,
  p_is_visible boolean,
  p_is_featured boolean,
  p_review_status text,
  p_order_index integer,
  p_seo_title text,
  p_seo_description text,
  p_bsale_variant_id text,
  p_bsale_sync_enabled boolean,
  p_bsale_sync_status text,
  p_primary_image_url text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_new_product_id uuid;
  v_normalized_slug text;
  v_normalized_name text;
  v_normalized_sku text;
  v_is_active boolean;
  v_is_visible boolean;
  v_is_featured boolean;
  v_review_status text;
  v_bsale_sync_enabled boolean;
  v_final_sync_status text;
  v_bsale_variant_id text;
BEGIN
  -- 1. Validar acceso admin y obtener v_user_id
  v_user_id := web_b2b.check_admin_access(p_target_company_id);

  -- 2. Normalización básica
  v_normalized_name := trim(p_name);
  v_normalized_slug := lower(trim(p_slug));
  v_normalized_sku := trim(p_sku);
  v_is_active := COALESCE(p_is_active, false);
  v_is_visible := COALESCE(p_is_visible, false);
  v_is_featured := COALESCE(p_is_featured, false);
  v_review_status := COALESCE(NULLIF(TRIM(p_review_status), ''), 'draft');
  v_bsale_sync_enabled := COALESCE(p_bsale_sync_enabled, true);

  -- 3. Validaciones de negocio
  IF v_normalized_name IS NULL OR v_normalized_name = '' THEN
    RAISE EXCEPTION 'El nombre del producto no puede estar vacío.';
  END IF;

  IF v_normalized_slug IS NULL OR v_normalized_slug = '' THEN
    RAISE EXCEPTION 'El slug del producto no puede estar vacío.';
  END IF;

  IF v_normalized_sku IS NULL OR v_normalized_sku = '' THEN
    RAISE EXCEPTION 'El SKU del producto no puede estar vacío.';
  END IF;

  IF NOT v_normalized_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'El slug solo puede contener letras minúsculas, números y guiones.';
  END IF;

  IF v_review_status NOT IN ('draft', 'ready', 'published', 'hidden') THEN
    RAISE EXCEPTION 'Estado de revisión inválido: %', v_review_status;
  END IF;

  -- 4. Validar relaciones
  IF p_category_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM web_b2b.categories WHERE id = p_category_id AND company_id = p_target_company_id) THEN
      RAISE EXCEPTION 'La categoría no existe o no pertenece a esta compañía.';
    END IF;
  END IF;

  IF p_brand_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM web_b2b.brands WHERE id = p_brand_id AND company_id = p_target_company_id) THEN
      RAISE EXCEPTION 'La marca no existe o no pertenece a esta compañía.';
    END IF;
  END IF;

  -- 5. Lógica de estado de sincronización Bsale
  v_final_sync_status := COALESCE(NULLIF(LOWER(TRIM(p_bsale_sync_status)), ''), 'pending');
  IF NOT v_bsale_sync_enabled THEN
    v_final_sync_status := 'disabled';
  ELSIF v_final_sync_status NOT IN ('pending', 'synced', 'error', 'disabled') THEN
    RAISE EXCEPTION 'Estado de sincronización Bsale inválido: %', v_final_sync_status;
  END IF;

  v_bsale_variant_id := NULLIF(TRIM(COALESCE(p_bsale_variant_id, '')), '');

  -- 6. Validaciones de unicidad excluyendo el producto actual
  IF EXISTS (SELECT 1 FROM web_b2b.products WHERE company_id = p_target_company_id AND slug = v_normalized_slug AND (p_product_id IS NULL OR id != p_product_id)) THEN
    RAISE EXCEPTION 'El slug "%" ya está en uso por otro producto.', v_normalized_slug;
  END IF;

  IF EXISTS (SELECT 1 FROM web_b2b.products WHERE company_id = p_target_company_id AND sku = v_normalized_sku AND (p_product_id IS NULL OR id != p_product_id)) THEN
    RAISE EXCEPTION 'El SKU "%" ya está en uso por otro producto.', v_normalized_sku;
  END IF;

  IF v_bsale_variant_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM web_b2b.products WHERE company_id = p_target_company_id AND bsale_variant_id = v_bsale_variant_id AND (p_product_id IS NULL OR id != p_product_id)) THEN
      RAISE EXCEPTION 'El ID de variante Bsale "%" ya está asignado a otro producto.', v_bsale_variant_id;
    END IF;
  END IF;

  -- 7. Upsert
  IF p_product_id IS NULL THEN
    INSERT INTO web_b2b.products (
      company_id, sku, name, slug, short_description, description,
      brand_id, category_id, is_active, is_visible, is_featured,
      review_status, order_index, seo_title, seo_description,
      bsale_variant_id, bsale_sync_enabled, bsale_sync_status
    )
    VALUES (
      p_target_company_id, v_normalized_sku, v_normalized_name, v_normalized_slug,
      p_short_description, p_description, p_brand_id, p_category_id,
      v_is_active, v_is_visible, v_is_featured,
      v_review_status, COALESCE(p_order_index, 0), p_seo_title, p_seo_description,
      v_bsale_variant_id, v_bsale_sync_enabled, v_final_sync_status
    )
    RETURNING id INTO v_new_product_id;

    -- Auditoría creación
    INSERT INTO web_b2b.admin_audit_logs (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (p_target_company_id, v_user_id, 'CREATE_PRODUCT', 'PRODUCT', v_new_product_id,
      jsonb_build_object('name', v_normalized_name, 'sku', v_normalized_sku));

  ELSE
    UPDATE web_b2b.products
    SET
      sku = v_normalized_sku,
      name = v_normalized_name,
      slug = v_normalized_slug,
      short_description = p_short_description,
      description = p_description,
      brand_id = p_brand_id,
      category_id = p_category_id,
      is_active = v_is_active,
      is_visible = v_is_visible,
      is_featured = v_is_featured,
      review_status = v_review_status,
      order_index = COALESCE(p_order_index, 0),
      seo_title = p_seo_title,
      seo_description = p_seo_description,
      bsale_variant_id = v_bsale_variant_id,
      bsale_sync_enabled = v_bsale_sync_enabled,
      bsale_sync_status = v_final_sync_status,
      updated_at = now()
    WHERE id = p_product_id AND company_id = p_target_company_id
    RETURNING id INTO v_new_product_id;

    IF v_new_product_id IS NULL THEN
      RAISE EXCEPTION 'Producto no encontrado o no pertenece a la compañía.';
    END IF;

    -- Auditoría edición
    INSERT INTO web_b2b.admin_audit_logs (company_id, user_id, action, entity_type, entity_id, details)
    VALUES (p_target_company_id, v_user_id, 'UPDATE_PRODUCT', 'PRODUCT', v_new_product_id,
      jsonb_build_object('name', v_normalized_name, 'sku', v_normalized_sku));
  END IF;

  -- 8. Gestionar Imagen Primaria
  IF p_primary_image_url IS NOT NULL AND trim(p_primary_image_url) != '' THEN
    -- Desmarcar anteriores
    UPDATE web_b2b.product_images 
    SET is_primary = false 
    WHERE product_id = v_new_product_id AND is_primary = true;

    -- Intentar marcar la existente (si la url ya estaba) como primaria
    UPDATE web_b2b.product_images 
    SET is_primary = true 
    WHERE product_id = v_new_product_id AND url = trim(p_primary_image_url);

    -- Si no se actualizó ninguna, es que la url es nueva para este producto
    IF NOT FOUND THEN
      INSERT INTO web_b2b.product_images (product_id, url, is_primary, order_index)
      VALUES (v_new_product_id, trim(p_primary_image_url), true, 0);
    END IF;
  END IF;

  RETURN v_new_product_id;
END;
$$;

REVOKE ALL ON FUNCTION public.web_b2b_admin_upsert_product(uuid, uuid, text, text, text, text, text, uuid, uuid, boolean, boolean, boolean, text, integer, text, text, text, boolean, text, text) FROM public;
REVOKE ALL ON FUNCTION public.web_b2b_admin_upsert_product(uuid, uuid, text, text, text, text, text, uuid, uuid, boolean, boolean, boolean, text, integer, text, text, text, boolean, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.web_b2b_admin_upsert_product(uuid, uuid, text, text, text, text, text, uuid, uuid, boolean, boolean, boolean, text, integer, text, text, text, boolean, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.web_b2b_admin_upsert_product(uuid, uuid, text, text, text, text, text, uuid, uuid, boolean, boolean, boolean, text, integer, text, text, text, boolean, text, text) TO authenticated;


-- ------------------------------------------------------------------------------
-- 4. Toggle Rápido de Estado de Producto
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.web_b2b_admin_set_product_status(
  p_target_company_id uuid,
  p_product_id uuid,
  p_is_active boolean,
  p_is_visible boolean,
  p_review_status text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_review_status text;
BEGIN
  -- Validar acceso admin y obtener v_user_id
  v_user_id := web_b2b.check_admin_access(p_target_company_id);
  v_review_status := NULLIF(TRIM(p_review_status), '');

  IF v_review_status IS NOT NULL AND v_review_status NOT IN ('draft', 'ready', 'published', 'hidden') THEN
    RAISE EXCEPTION 'Estado de revisión inválido: %', v_review_status;
  END IF;

  UPDATE web_b2b.products
  SET
    is_active = COALESCE(p_is_active, is_active),
    is_visible = COALESCE(p_is_visible, is_visible),
    review_status = COALESCE(v_review_status, review_status),
    updated_at = now()
  WHERE id = p_product_id AND company_id = p_target_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado o no pertenece a la compañía.';
  END IF;

  -- Auditoría edición
  INSERT INTO web_b2b.admin_audit_logs (company_id, user_id, action, entity_type, entity_id, details)
  VALUES (p_target_company_id, v_user_id, 'UPDATE_PRODUCT_STATUS', 'PRODUCT', p_product_id,
    jsonb_build_object('is_active', p_is_active, 'is_visible', p_is_visible, 'review_status', v_review_status));

  RETURN p_product_id;
END;
$$;

REVOKE ALL ON FUNCTION public.web_b2b_admin_set_product_status(uuid, uuid, boolean, boolean, text) FROM public;
REVOKE ALL ON FUNCTION public.web_b2b_admin_set_product_status(uuid, uuid, boolean, boolean, text) FROM anon;
REVOKE ALL ON FUNCTION public.web_b2b_admin_set_product_status(uuid, uuid, boolean, boolean, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.web_b2b_admin_set_product_status(uuid, uuid, boolean, boolean, text) TO authenticated;
