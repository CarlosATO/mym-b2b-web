-- ==============================================================================
-- MIGRACION CANDIDATA 6D.7B: APPLY BATCH Bsale v2
-- ==============================================================================
-- Objetivo:
--   Permitir aplicar un dry-run Bsale completo de hasta 100 candidatos create,
--   manteniendo productos en estado seguro y evitando que un run de 50 quede
--   marcado como aplicado si solo se procesan 20 items.
--
-- Alcance:
--   * No elimina ni reemplaza la RPC v1.
--   * Amplia el constraint de max_items en apply_runs de 1..20 a 1..100.
--   * Crea public.web_b2b_system_apply_bsale_product_import_run_v2.
--   * Inserta solo en web_b2b.products y tablas de auditoria apply existentes.
--   * No toca product_prices, product_stock, product_images ni Storage.
--   * No publica productos.
--
-- Estado:
--   Candidata para prueba con BEGIN; ... ROLLBACK en 6D.7B.
-- ==============================================================================

ALTER TABLE web_b2b.bsale_product_apply_runs
  DROP CONSTRAINT IF EXISTS chk_apply_run_max_items;

ALTER TABLE web_b2b.bsale_product_apply_runs
  ADD CONSTRAINT chk_apply_run_max_items CHECK (max_items BETWEEN 1 AND 100);

CREATE OR REPLACE FUNCTION public.web_b2b_system_apply_bsale_product_import_run_v2(
  p_target_company_id uuid,
  p_import_run_id uuid,
  p_max_items integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_apply_run_id uuid;
  v_max_items integer;
  v_eligible_candidates integer := 0;
  v_created integer := 0;
  v_item RECORD;
  v_product_id uuid;
  v_slug text;
BEGIN
  -- ---------------------------------------------------------------------------
  -- 0. Validaciones de entrada y del run.
  -- ---------------------------------------------------------------------------
  IF p_target_company_id IS NULL THEN
    RAISE EXCEPTION 'target_company_id es requerido.';
  END IF;

  IF p_import_run_id IS NULL THEN
    RAISE EXCEPTION 'import_run_id es requerido.';
  END IF;

  IF p_max_items IS NULL THEN
    v_max_items := 100;
  ELSE
    v_max_items := p_max_items;
  END IF;

  IF v_max_items < 1 OR v_max_items > 100 THEN
    RAISE EXCEPTION 'max_items debe estar entre 1 y 100 para apply batch v2.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM web_b2b.bsale_product_import_runs r
    WHERE r.id = p_import_run_id
      AND r.company_id = p_target_company_id
      AND r.mode = 'dry_run'
      AND r.status = 'success'
  ) THEN
    RAISE EXCEPTION 'El run debe existir, pertenecer a la compañía, ser dry_run y estar en status success.';
  END IF;

  -- Idempotencia: mantiene compatibilidad con la tabla apply_runs existente.
  IF EXISTS (
    SELECT 1
    FROM web_b2b.bsale_product_apply_runs a
    WHERE a.company_id = p_target_company_id
      AND a.import_run_id = p_import_run_id
  ) THEN
    RAISE EXCEPTION 'El run ya fue aplicado anteriormente.';
  END IF;

  SELECT count(*) INTO v_eligible_candidates
  FROM web_b2b.bsale_product_import_items i
  WHERE i.run_id = p_import_run_id
    AND i.company_id = p_target_company_id
    AND i.action = 'create'
    AND i.status = 'pending'
    AND i.conflict_type IS NULL
    AND i.sku IS NOT NULL
    AND i.bsale_variant_id IS NOT NULL
    AND i.source_name IS NOT NULL
    AND i.payload->>'dry_run' = 'true';

  IF v_eligible_candidates = 0 THEN
    RAISE EXCEPTION 'No hay candidatos create válidos para aplicar en este run.';
  END IF;

  -- v2 aplica runs completos. Si el limite no cubre todos los candidatos,
  -- rechaza antes de crear apply_run/productos para no marcar parcialmente.
  IF v_eligible_candidates > v_max_items THEN
    RAISE EXCEPTION 'El run tiene % candidatos elegibles y max_items=%; v2 solo aplica runs completos.', v_eligible_candidates, v_max_items;
  END IF;

  -- Prevalidaciones de duplicidad antes de registrar apply_run.
  IF EXISTS (
    SELECT 1
    FROM web_b2b.bsale_product_import_items i
    JOIN web_b2b.products p
      ON p.company_id = p_target_company_id
     AND p.sku = i.sku
    WHERE i.run_id = p_import_run_id
      AND i.company_id = p_target_company_id
      AND i.action = 'create'
      AND i.status = 'pending'
      AND i.conflict_type IS NULL
      AND i.payload->>'dry_run' = 'true'
  ) THEN
    RAISE EXCEPTION 'El run contiene SKU que ya existen en web_b2b.products.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM web_b2b.bsale_product_import_items i
    JOIN web_b2b.products p
      ON p.company_id = p_target_company_id
     AND p.bsale_variant_id = i.bsale_variant_id
    WHERE i.run_id = p_import_run_id
      AND i.company_id = p_target_company_id
      AND i.action = 'create'
      AND i.status = 'pending'
      AND i.conflict_type IS NULL
      AND i.payload->>'dry_run' = 'true'
  ) THEN
    RAISE EXCEPTION 'El run contiene bsale_variant_id que ya existen en web_b2b.products.';
  END IF;

  -- ---------------------------------------------------------------------------
  -- 1. Registrar apply_run solo despues de validar que el run completo es viable.
  -- ---------------------------------------------------------------------------
  INSERT INTO web_b2b.bsale_product_apply_runs (
    company_id, import_run_id, source, mode, status, max_items
  ) VALUES (
    p_target_company_id, p_import_run_id, 'script', 'controlled_apply', 'running', v_max_items
  )
  RETURNING id INTO v_apply_run_id;

  -- ---------------------------------------------------------------------------
  -- 2. Crear todos los candidatos elegibles en estado seguro.
  -- ---------------------------------------------------------------------------
  FOR v_item IN
    SELECT i.id, i.sku, i.bsale_variant_id, i.source_name
    FROM web_b2b.bsale_product_import_items i
    WHERE i.run_id = p_import_run_id
      AND i.company_id = p_target_company_id
      AND i.action = 'create'
      AND i.status = 'pending'
      AND i.conflict_type IS NULL
      AND i.sku IS NOT NULL
      AND i.bsale_variant_id IS NOT NULL
      AND i.source_name IS NOT NULL
      AND i.payload->>'dry_run' = 'true'
    ORDER BY i.created_at ASC, i.id ASC
  LOOP
    v_slug := web_b2b.generate_unique_product_slug_for_import(
      p_target_company_id, v_item.source_name, v_item.sku
    );

    INSERT INTO web_b2b.products (
      company_id,
      sku,
      bsale_variant_id,
      name,
      slug,
      short_description,
      description,
      category_id,
      brand_id,
      is_active,
      is_visible,
      is_featured,
      review_status,
      order_index,
      seo_title,
      seo_description,
      bsale_sync_enabled,
      bsale_sync_status,
      bsale_last_checked_at
    ) VALUES (
      p_target_company_id,
      v_item.sku,
      v_item.bsale_variant_id,
      v_item.source_name,
      v_slug,
      NULL,
      NULL,
      NULL,
      NULL,
      false,
      false,
      false,
      'draft',
      0,
      NULL,
      NULL,
      true,
      'pending',
      NULL
    )
    RETURNING id INTO v_product_id;

    v_created := v_created + 1;

    INSERT INTO web_b2b.bsale_product_apply_items (
      apply_run_id, company_id, import_run_id, import_item_id, product_id,
      sku, bsale_variant_id, action, status, message
    ) VALUES (
      v_apply_run_id, p_target_company_id, p_import_run_id, v_item.id, v_product_id,
      v_item.sku, v_item.bsale_variant_id, 'create', 'success',
      'Producto creado por apply batch v2 en estado draft/inactivo/no visible'
    );
  END LOOP;

  IF v_created <> v_eligible_candidates THEN
    RAISE EXCEPTION 'Apply incompleto: candidatos=% creados=%.', v_eligible_candidates, v_created;
  END IF;

  UPDATE web_b2b.bsale_product_apply_runs
  SET status = 'success',
      total_candidates = v_eligible_candidates,
      total_created = v_created,
      total_skipped = 0,
      total_conflicts = 0,
      total_errors = 0,
      summary = jsonb_build_object(
        'apply_version', 'v2',
        'full_run_required', true,
        'dry_run_applied', true,
        'created_safe_state', 'draft/inactive/not_visible/not_featured',
        'no_prices', true,
        'no_stock', true,
        'no_images', true,
        'no_publication', true
      ),
      finished_at = now()
  WHERE id = v_apply_run_id;

  RETURN jsonb_build_object(
    'apply_run_id', v_apply_run_id,
    'import_run_id', p_import_run_id,
    'status', 'success',
    'total_candidates', v_eligible_candidates,
    'total_created', v_created,
    'total_skipped', 0,
    'total_conflicts', 0,
    'total_errors', 0,
    'safe_state', 'draft/inactive/not_visible/not_featured',
    'no_prices', true,
    'no_stock', true,
    'no_images', true,
    'no_publication', true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.web_b2b_system_apply_bsale_product_import_run_v2(uuid, uuid, integer) FROM public;
REVOKE ALL ON FUNCTION public.web_b2b_system_apply_bsale_product_import_run_v2(uuid, uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.web_b2b_system_apply_bsale_product_import_run_v2(uuid, uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.web_b2b_system_apply_bsale_product_import_run_v2(uuid, uuid, integer) TO service_role;
