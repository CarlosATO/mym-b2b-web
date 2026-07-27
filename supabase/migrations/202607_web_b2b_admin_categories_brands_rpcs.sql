-- ==============================================================================
-- MIGRACIÓN 6B.1: RPCs Admin para Gestión de Categorías y Marcas
-- ==============================================================================
-- Propósito: Proveer funciones seguras para que el frontend administre
-- categorías y marcas sin exponer acceso directo de escritura a las tablas.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Helper: Validar acceso de administrador y obtener user_id
-- ------------------------------------------------------------------------------
-- Este helper interno (privado) facilita la validación DRY dentro de las RPCs.
-- Lanza excepción si no es admin, o retorna el user_id autenticado.
CREATE OR REPLACE FUNCTION web_b2b.check_admin_access(p_company_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' 
AS $$
DECLARE
  v_uid uuid;
  v_role text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autorizado. Se requiere sesión activa.';
  END IF;

  SELECT role INTO v_role
  FROM web_b2b.admin_access
  WHERE user_id = v_uid 
    AND company_id = p_company_id 
    AND is_active = true;

  IF v_role IS NULL OR v_role NOT IN ('WEB_SUPER_ADMIN', 'WEB_ADMIN', 'WEB_CONTENT_MANAGER') THEN
    RAISE EXCEPTION 'No autorizado. Permisos insuficientes.';
  END IF;

  RETURN v_uid;
END;
$$;

-- Revocación absoluta: no invocable directamente, solo por RPCs internas
REVOKE ALL ON FUNCTION web_b2b.check_admin_access(uuid) FROM public;
REVOKE ALL ON FUNCTION web_b2b.check_admin_access(uuid) FROM anon;
REVOKE ALL ON FUNCTION web_b2b.check_admin_access(uuid) FROM authenticated;


-- ------------------------------------------------------------------------------
-- 2. Listado Seguro de Categorías (Admin)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.web_b2b_admin_list_categories(
  target_company_id uuid
)
RETURNS TABLE (
  id uuid,
  parent_id uuid,
  name text,
  slug text,
  description text,
  image_url text,
  banner_image_url text,
  display_style text,
  icon_name text,
  seo_title text,
  seo_description text,
  is_active boolean,
  is_visible_home boolean,
  is_visible_catalog boolean,
  order_index integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Validar acceso de administrador (lanzará error si falla)
  PERFORM web_b2b.check_admin_access(target_company_id);

  RETURN QUERY
  SELECT 
    c.id, c.parent_id, c.name, c.slug, c.description, c.image_url, 
    c.banner_image_url, c.display_style, c.icon_name, c.seo_title, 
    c.seo_description, c.is_active, c.is_visible_home, c.is_visible_catalog, 
    c.order_index, c.created_at, c.updated_at
  FROM web_b2b.categories c
  WHERE c.company_id = target_company_id
  ORDER BY c.order_index ASC NULLS LAST, c.name ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.web_b2b_admin_list_categories(uuid) FROM public;
REVOKE ALL ON FUNCTION public.web_b2b_admin_list_categories(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.web_b2b_admin_list_categories(uuid) TO authenticated;


-- ------------------------------------------------------------------------------
-- 3. Upsert de Categorías (Crear / Editar)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.web_b2b_admin_upsert_category(
  p_category_id uuid,
  p_target_company_id uuid,
  p_parent_id uuid,
  p_name text,
  p_slug text,
  p_description text,
  p_image_url text,
  p_banner_image_url text,
  p_display_style text,
  p_icon_name text,
  p_seo_title text,
  p_seo_description text,
  p_is_active boolean,
  p_is_visible_home boolean,
  p_is_visible_catalog boolean,
  p_order_index integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid;
  v_action text;
  v_final_id uuid;
  v_details jsonb;
  v_name text;
  v_slug text;
  v_display_style text;
  v_cycle_check boolean;
BEGIN
  -- 1. Validar acceso admin
  v_uid := web_b2b.check_admin_access(p_target_company_id);

  -- 2. Normalización y Validaciones robustas
  v_name := TRIM(p_name);
  v_slug := LOWER(TRIM(p_slug));
  v_display_style := COALESCE(NULLIF(TRIM(p_display_style), ''), 'grid');

  IF NULLIF(COALESCE(v_name, ''), '') IS NULL OR NULLIF(COALESCE(v_slug, ''), '') IS NULL THEN
    RAISE EXCEPTION 'Nombre y slug son obligatorios.';
  END IF;

  IF v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Slug inválido. Usa minúsculas, números y guiones.';
  END IF;

  IF v_display_style NOT IN ('grid', 'list', 'banner', 'hidden') THEN
    RAISE EXCEPTION 'Estilo de visualización (display_style) inválido.';
  END IF;

  -- 3. Validar duplicidad de slug
  IF EXISTS (
    SELECT 1
    FROM web_b2b.categories
    WHERE company_id = p_target_company_id
      AND slug = v_slug
      AND (p_category_id IS NULL OR id <> p_category_id)
  ) THEN
    RAISE EXCEPTION 'Ya existe una categoría con ese slug.';
  END IF;

  -- 4. Validar jerarquía y evitar ciclos
  IF p_parent_id IS NOT NULL THEN
    IF p_category_id IS NOT NULL AND p_parent_id = p_category_id THEN
      RAISE EXCEPTION 'Una categoría no puede ser padre de sí misma.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM web_b2b.categories WHERE id = p_parent_id AND company_id = p_target_company_id) THEN
      RAISE EXCEPTION 'La categoría padre especificada no existe o pertenece a otra compañía.';
    END IF;

    IF p_category_id IS NOT NULL THEN
      WITH RECURSIVE CategoryPath AS (
        SELECT id, parent_id
        FROM web_b2b.categories
        WHERE id = p_parent_id AND company_id = p_target_company_id
        UNION ALL
        SELECT c.id, c.parent_id
        FROM web_b2b.categories c
        INNER JOIN CategoryPath cp ON c.id = cp.parent_id
        WHERE c.company_id = p_target_company_id
      )
      SELECT EXISTS (
        SELECT 1 FROM CategoryPath WHERE id = p_category_id
      ) INTO v_cycle_check;

      IF v_cycle_check THEN
        RAISE EXCEPTION 'Ciclo jerárquico detectado. No puedes mover una categoría debajo de sus descendientes.';
      END IF;
    END IF;
  END IF;

  -- 5. Preparar details de auditoría
  v_details := jsonb_build_object(
    'name', v_name,
    'slug', v_slug,
    'parent_id', p_parent_id,
    'display_style', v_display_style,
    'is_active', p_is_active,
    'is_visible_home', p_is_visible_home,
    'is_visible_catalog', p_is_visible_catalog
  );

  -- 6. Inserción o Actualización
  IF p_category_id IS NULL THEN
    v_action := 'CREATE';
    INSERT INTO web_b2b.categories (
      company_id, parent_id, name, slug, description, image_url, banner_image_url, 
      display_style, icon_name, seo_title, seo_description, is_active, 
      is_visible_home, is_visible_catalog, order_index
    ) VALUES (
      p_target_company_id, p_parent_id, v_name, v_slug, p_description, p_image_url, p_banner_image_url, 
      v_display_style, p_icon_name, p_seo_title, p_seo_description, p_is_active, 
      p_is_visible_home, p_is_visible_catalog, COALESCE(p_order_index, 0)
    ) RETURNING id INTO v_final_id;
  ELSE
    v_action := 'UPDATE';
    IF NOT EXISTS (SELECT 1 FROM web_b2b.categories WHERE id = p_category_id AND company_id = p_target_company_id) THEN
      RAISE EXCEPTION 'Categoría no encontrada.';
    END IF;

    UPDATE web_b2b.categories SET
      parent_id = p_parent_id,
      name = v_name,
      slug = v_slug,
      description = p_description,
      image_url = p_image_url,
      banner_image_url = p_banner_image_url,
      display_style = v_display_style,
      icon_name = p_icon_name,
      seo_title = p_seo_title,
      seo_description = p_seo_description,
      is_active = p_is_active,
      is_visible_home = p_is_visible_home,
      is_visible_catalog = p_is_visible_catalog,
      order_index = COALESCE(p_order_index, 0),
      updated_at = NOW()
    WHERE id = p_category_id AND company_id = p_target_company_id
    RETURNING id INTO v_final_id;
  END IF;

  -- 7. Registrar en auditoría
  INSERT INTO web_b2b.admin_audit_logs (
    company_id, user_id, action, entity_type, entity_id, details
  ) VALUES (
    p_target_company_id, v_uid, v_action, 'CATEGORY', v_final_id, v_details
  );

  RETURN v_final_id;
END;
$$;

REVOKE ALL ON FUNCTION public.web_b2b_admin_upsert_category(uuid, uuid, uuid, text, text, text, text, text, text, text, text, text, boolean, boolean, boolean, integer) FROM public;
REVOKE ALL ON FUNCTION public.web_b2b_admin_upsert_category(uuid, uuid, uuid, text, text, text, text, text, text, text, text, text, boolean, boolean, boolean, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.web_b2b_admin_upsert_category(uuid, uuid, uuid, text, text, text, text, text, text, text, text, text, boolean, boolean, boolean, integer) TO authenticated;


-- ------------------------------------------------------------------------------
-- 4. Listado Seguro de Marcas (Admin)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.web_b2b_admin_list_brands(
  target_company_id uuid
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  logo_url text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM web_b2b.check_admin_access(target_company_id);

  RETURN QUERY
  SELECT 
    b.id, b.name, b.slug, b.logo_url, b.is_active, b.created_at, b.updated_at
  FROM web_b2b.brands b
  WHERE b.company_id = target_company_id
  ORDER BY b.name ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.web_b2b_admin_list_brands(uuid) FROM public;
REVOKE ALL ON FUNCTION public.web_b2b_admin_list_brands(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.web_b2b_admin_list_brands(uuid) TO authenticated;


-- ------------------------------------------------------------------------------
-- 5. Upsert de Marcas (Crear / Editar)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.web_b2b_admin_upsert_brand(
  p_brand_id uuid,
  p_target_company_id uuid,
  p_name text,
  p_slug text,
  p_logo_url text,
  p_is_active boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid;
  v_action text;
  v_final_id uuid;
  v_details jsonb;
  v_name text;
  v_slug text;
BEGIN
  -- 1. Validar acceso admin
  v_uid := web_b2b.check_admin_access(p_target_company_id);

  -- 2. Normalización y Validaciones robustas
  v_name := TRIM(p_name);
  v_slug := LOWER(TRIM(p_slug));

  IF NULLIF(COALESCE(v_name, ''), '') IS NULL OR NULLIF(COALESCE(v_slug, ''), '') IS NULL THEN
    RAISE EXCEPTION 'Nombre y slug son obligatorios.';
  END IF;

  IF v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Slug inválido. Usa minúsculas, números y guiones.';
  END IF;

  -- 3. Validar duplicidad de slug
  IF EXISTS (
    SELECT 1
    FROM web_b2b.brands
    WHERE company_id = p_target_company_id
      AND slug = v_slug
      AND (p_brand_id IS NULL OR id <> p_brand_id)
  ) THEN
    RAISE EXCEPTION 'Ya existe una marca con ese slug.';
  END IF;

  -- 4. Preparar details de auditoría
  v_details := jsonb_build_object(
    'name', v_name,
    'slug', v_slug,
    'is_active', p_is_active
  );

  -- 5. Inserción o Actualización
  IF p_brand_id IS NULL THEN
    v_action := 'CREATE';
    INSERT INTO web_b2b.brands (
      company_id, name, slug, logo_url, is_active
    ) VALUES (
      p_target_company_id, v_name, v_slug, p_logo_url, p_is_active
    ) RETURNING id INTO v_final_id;
  ELSE
    v_action := 'UPDATE';
    IF NOT EXISTS (SELECT 1 FROM web_b2b.brands WHERE id = p_brand_id AND company_id = p_target_company_id) THEN
      RAISE EXCEPTION 'Marca no encontrada.';
    END IF;

    UPDATE web_b2b.brands SET
      name = v_name,
      slug = v_slug,
      logo_url = p_logo_url,
      is_active = p_is_active,
      updated_at = NOW()
    WHERE id = p_brand_id AND company_id = p_target_company_id
    RETURNING id INTO v_final_id;
  END IF;

  -- 6. Registrar en auditoría
  INSERT INTO web_b2b.admin_audit_logs (
    company_id, user_id, action, entity_type, entity_id, details
  ) VALUES (
    p_target_company_id, v_uid, v_action, 'BRAND', v_final_id, v_details
  );

  RETURN v_final_id;
END;
$$;

REVOKE ALL ON FUNCTION public.web_b2b_admin_upsert_brand(uuid, uuid, text, text, text, boolean) FROM public;
REVOKE ALL ON FUNCTION public.web_b2b_admin_upsert_brand(uuid, uuid, text, text, text, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.web_b2b_admin_upsert_brand(uuid, uuid, text, text, text, boolean) TO authenticated;
