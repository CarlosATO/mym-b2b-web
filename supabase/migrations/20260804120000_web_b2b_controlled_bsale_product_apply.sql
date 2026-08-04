-- ==============================================================================
-- MIGRACIÓN FORMAL CANDIDATA 6D.4C: APPLY CONTROLADO Bsale dry-run -> web_b2b.products
-- ORIGEN: docs/productos/borrador_apply_control_6d4b.sql
--         (borrador aprobado en 6D.4B, commit f3baa0a; revisado en 6D.4C).
-- ESTADO: CANDIDATA. Probada SOLO dentro de transacción BEGIN; ... ROLLBACK (6D.4C).
--         NO aplicada de forma persistente todavía. Primer apply real = fase 6D.4D.
--
-- ALCANCE:
--   * Crear web_b2b.bsale_product_apply_runs y web_b2b.bsale_product_apply_items.
--   * Helper de slug único: web_b2b.generate_unique_product_slug_for_import
--     (normaliza acentos/ñ/ç con translate, sin extensiones; GRANT solo service_role).
--   * RPC public.web_b2b_system_apply_bsale_product_import_run
--     (SECURITY DEFINER, service_role, max_items 1..20 con COALESCE,
--     sin candidatos -> excepción controlada, sin precios/stock/imágenes).
--   * NO toca product_prices, product_stock, product_images.
--   * NO expone web_b2b en PostgREST.
--   * NO agrega UI ni funciones admin.
--
-- DECISIONES DE DISEÑO (6D.4A):
--   * Idempotencia: UNIQUE(company_id, import_run_id) en apply_runs y
--     UNIQUE(company_id, import_item_id) en apply_items.
--   * Transacción atómica: si algo falla -> RAISE EXCEPTION -> rollback total.
--   * bsale_last_checked_at = NULL: el apply crea el vínculo inicial desde la
--     auditoría dry-run, pero aún no hay sincronización operativa (coherencia
--     con bsale_sync_status = 'pending').
--   * bsale_sync_status = 'pending': aún no se sincronizan precios/stock ni
--     se completa la curación comercial.
-- ==============================================================================

-- ==============================================================================
-- A. Tabla web_b2b.bsale_product_apply_runs
-- ==============================================================================

CREATE TABLE IF NOT EXISTS web_b2b.bsale_product_apply_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  import_run_id uuid NOT NULL,
  executed_by uuid,
  source text NOT NULL DEFAULT 'script',
  mode text NOT NULL DEFAULT 'controlled_apply',
  status text NOT NULL DEFAULT 'running',
  max_items integer NOT NULL,
  total_candidates integer NOT NULL DEFAULT 0,
  total_created integer NOT NULL DEFAULT 0,
  total_skipped integer NOT NULL DEFAULT 0,
  total_conflicts integer NOT NULL DEFAULT 0,
  total_errors integer NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_apply_runs_id_company UNIQUE (id, company_id),
  CONSTRAINT uq_apply_runs_company_import_run UNIQUE (company_id, import_run_id),
  CONSTRAINT fk_apply_runs_import_run_company
    FOREIGN KEY (import_run_id, company_id)
    REFERENCES web_b2b.bsale_product_import_runs(id, company_id),
  CONSTRAINT chk_apply_run_source CHECK (source IN ('script', 'system', 'admin')),
  CONSTRAINT chk_apply_run_mode CHECK (mode IN ('controlled_apply')),
  CONSTRAINT chk_apply_run_status CHECK (status IN ('running', 'success', 'failed', 'partial', 'cancelled')),
  CONSTRAINT chk_apply_run_max_items CHECK (max_items BETWEEN 1 AND 20),
  CONSTRAINT chk_apply_run_counters CHECK (
    total_candidates >= 0 AND
    total_created >= 0 AND
    total_skipped >= 0 AND
    total_conflicts >= 0 AND
    total_errors >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_apply_runs_company_created
  ON web_b2b.bsale_product_apply_runs(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_apply_runs_company_import_run
  ON web_b2b.bsale_product_apply_runs(company_id, import_run_id);

CREATE INDEX IF NOT EXISTS idx_apply_runs_company_status
  ON web_b2b.bsale_product_apply_runs(company_id, status);

ALTER TABLE web_b2b.bsale_product_apply_runs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE web_b2b.bsale_product_apply_runs FROM public;
REVOKE ALL ON TABLE web_b2b.bsale_product_apply_runs FROM anon;
REVOKE ALL ON TABLE web_b2b.bsale_product_apply_runs FROM authenticated;

-- ==============================================================================
-- A.1 Amarre de integridad apply_items -> import_items (tabla existente 6D.3C)
-- ==============================================================================
-- bsale_product_import_items ya existe en la DB; se agrega UNIQUE(id, run_id,
-- company_id) vía DO block para poder referenciarla desde la FK compuesta de
-- apply_items. Riesgo de creación: nulo, porque id es PK NOT NULL (el par
-- (id, ...) nunca tiene duplicados y no hay valores nulos en el constraint).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_import_items_id_run_company'
      AND conrelid = 'web_b2b.bsale_product_import_items'::regclass
  ) THEN
    ALTER TABLE web_b2b.bsale_product_import_items
      ADD CONSTRAINT uq_import_items_id_run_company
      UNIQUE (id, run_id, company_id);
  END IF;
END;
$$;

-- ==============================================================================
-- B. Tabla web_b2b.bsale_product_apply_items
-- ==============================================================================

CREATE TABLE IF NOT EXISTS web_b2b.bsale_product_apply_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apply_run_id uuid NOT NULL,
  company_id uuid NOT NULL,
  import_run_id uuid NOT NULL,
  import_item_id uuid NOT NULL,
  product_id uuid,
  sku text,
  bsale_variant_id text,
  action text NOT NULL,
  status text NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_apply_items_company_import_item UNIQUE (company_id, import_item_id),
  CONSTRAINT fk_apply_items_apply_run_company
    FOREIGN KEY (apply_run_id, company_id)
    REFERENCES web_b2b.bsale_product_apply_runs(id, company_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_apply_items_import_item_run_company
    FOREIGN KEY (import_item_id, import_run_id, company_id)
    REFERENCES web_b2b.bsale_product_import_items(id, run_id, company_id),
  CONSTRAINT fk_apply_items_product
    FOREIGN KEY (product_id)
    REFERENCES web_b2b.products(id)
    ON DELETE SET NULL,
  CONSTRAINT chk_apply_item_action CHECK (action IN ('create', 'skip', 'conflict', 'error')),
  CONSTRAINT chk_apply_item_status CHECK (status IN ('success', 'skipped', 'conflict', 'error'))
);

CREATE INDEX IF NOT EXISTS idx_apply_items_apply_run
  ON web_b2b.bsale_product_apply_items(apply_run_id);

CREATE INDEX IF NOT EXISTS idx_apply_items_company_import_run
  ON web_b2b.bsale_product_apply_items(company_id, import_run_id);

CREATE INDEX IF NOT EXISTS idx_apply_items_company_import_item
  ON web_b2b.bsale_product_apply_items(company_id, import_item_id);

CREATE INDEX IF NOT EXISTS idx_apply_items_company_sku
  ON web_b2b.bsale_product_apply_items(company_id, sku);

CREATE INDEX IF NOT EXISTS idx_apply_items_company_variant_id
  ON web_b2b.bsale_product_apply_items(company_id, bsale_variant_id);

CREATE INDEX IF NOT EXISTS idx_apply_items_product
  ON web_b2b.bsale_product_apply_items(product_id);

ALTER TABLE web_b2b.bsale_product_apply_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE web_b2b.bsale_product_apply_items FROM public;
REVOKE ALL ON TABLE web_b2b.bsale_product_apply_items FROM anon;
REVOKE ALL ON TABLE web_b2b.bsale_product_apply_items FROM authenticated;

-- ==============================================================================
-- C. Helper de slug único (sin SQL dinámico)
-- ==============================================================================

CREATE OR REPLACE FUNCTION web_b2b.generate_unique_product_slug_for_import(
  p_company_id uuid,
  p_name text,
  p_sku text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_raw text;
  v_base text;
  v_slug text;
  v_try integer;
  v_max_tries constant integer := 100;
BEGIN
  -- 1. Base desde name, fallback a sku. Nunca vacío.
  v_raw := lower(coalesce(nullif(trim(p_name), ''), nullif(trim(p_sku), ''), 'producto'));

  -- 2. Normalizar acentos/ñ/ç sin extensiones (translate es built-in de Postgres).
  --    Cubre á/é/í/ó/ú, ä/ë/ï/ö/ü, ñ y ç.
  v_raw := translate(v_raw, 'áéíóúäëïöüñç', 'aeiouaeiounc');

  -- 3. Reemplazar no alfanuméricos por guiones y colapsar repetidos.
  v_base := regexp_replace(v_raw, '[^a-z0-9]+', '-', 'g');
  v_base := regexp_replace(v_base, '(-)+', '-', 'g');
  v_base := trim(BOTH '-' FROM v_base);

  IF v_base = '' THEN
    v_base := 'producto';
  END IF;

  -- 4. Probar v_base, luego v_base-2, v_base-3, ... hasta límite defensivo.
  v_try := 1;
  LOOP
    IF v_try = 1 THEN
      v_slug := v_base;
    ELSE
      v_slug := v_base || '-' || v_try;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM web_b2b.products
      WHERE company_id = p_company_id AND slug = v_slug
    ) THEN
      RETURN v_slug;
    END IF;

    v_try := v_try + 1;
    IF v_try > v_max_tries THEN
      RAISE EXCEPTION 'No se pudo generar un slug único para el producto después de % intentos.', v_max_tries;
    END IF;
  END LOOP;
END;
$$;

-- Restricción de seguridad: el helper solo se invoca desde la RPC system.
REVOKE ALL ON FUNCTION web_b2b.generate_unique_product_slug_for_import(uuid, text, text) FROM public;
REVOKE ALL ON FUNCTION web_b2b.generate_unique_product_slug_for_import(uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION web_b2b.generate_unique_product_slug_for_import(uuid, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION web_b2b.generate_unique_product_slug_for_import(uuid, text, text) TO service_role;

-- ==============================================================================
-- D. RPC System de Apply Controlado
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.web_b2b_system_apply_bsale_product_import_run(
  p_target_company_id uuid,
  p_import_run_id uuid,
  p_max_items integer DEFAULT 20
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_apply_run_id uuid;
  v_max_items integer;
  v_candidates integer := 0;
  v_created integer := 0;
  v_skipped integer := 0;
  v_conflicts integer := 0;
  v_errors integer := 0;
  v_item RECORD;
  v_product_id uuid;
  v_slug text;
  v_final_status text;
BEGIN
  -- ----------------------------------------------------------------------------
  -- 0. Validaciones de entrada y del run (sin SQL dinámico, sin secretos).
  -- ----------------------------------------------------------------------------
  v_max_items := COALESCE(p_max_items, 20);

  IF v_max_items < 1 OR v_max_items > 20 THEN
    RAISE EXCEPTION 'max_items debe estar entre 1 y 20 en esta primera fase.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM web_b2b.bsale_product_import_runs r
    WHERE r.id = p_import_run_id AND r.company_id = p_target_company_id
  ) THEN
    RAISE EXCEPTION 'Run de importación no encontrado o no pertenece a la compañía.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM web_b2b.bsale_product_import_runs r
    WHERE r.id = p_import_run_id AND r.company_id = p_target_company_id
      AND r.mode = 'dry_run' AND r.status = 'success'
  ) THEN
    RAISE EXCEPTION 'El run debe ser dry_run y status success para poder aplicarse.';
  END IF;

  -- Idempotencia: un mismo dry-run no puede aplicarse dos veces.
  IF EXISTS (
    SELECT 1 FROM web_b2b.bsale_product_apply_runs a
    WHERE a.company_id = p_target_company_id AND a.import_run_id = p_import_run_id
  ) THEN
    RAISE EXCEPTION 'El run ya fue aplicado anteriormente.';
  END IF;

  -- ----------------------------------------------------------------------------
  -- 0.1 Sin candidatos válidos -> excepción controlada, sin apply_run vacío.
  -- ----------------------------------------------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM web_b2b.bsale_product_import_items i
    WHERE i.run_id = p_import_run_id
      AND i.company_id = p_target_company_id
      AND i.action = 'create'
      AND i.status = 'pending'
      AND i.conflict_type IS NULL
      AND i.sku IS NOT NULL
      AND i.bsale_variant_id IS NOT NULL
      AND i.source_name IS NOT NULL
      AND i.payload->>'dry_run' = 'true'
  ) THEN
    RAISE EXCEPTION 'No hay candidatos válidos para aplicar en este run.';
  END IF;

  -- ----------------------------------------------------------------------------
  -- 1. Registrar apply_run en estado running (parte de la transacción atómica).
  -- ----------------------------------------------------------------------------
  INSERT INTO web_b2b.bsale_product_apply_runs (
    company_id, import_run_id, source, mode, status, max_items
  ) VALUES (
    p_target_company_id, p_import_run_id, 'script', 'controlled_apply', 'running', v_max_items
  )
  RETURNING id INTO v_apply_run_id;

  -- ----------------------------------------------------------------------------
  -- 2. Seleccionar candidatos: solo items create/pending válidos del dry_run.
  --    Un item que no cumpla los criterios NO crea producto inseguro.
  -- ----------------------------------------------------------------------------
  FOR v_item IN
    SELECT i.id, i.sku, i.bsale_variant_id, i.source_name, i.payload
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
    LIMIT v_max_items
  LOOP
    v_candidates := v_candidates + 1;

    -- --------------------------------------------------------------------------
    -- 2.1 Validaciones de duplicidad contra web_b2b.products.
    --     Duplicados detectados -> apply_item como conflict (nunca producto inseguro).
    -- --------------------------------------------------------------------------
    IF EXISTS (
      SELECT 1 FROM web_b2b.products p
      WHERE p.company_id = p_target_company_id AND p.sku = v_item.sku
    ) THEN
      v_conflicts := v_conflicts + 1;
      INSERT INTO web_b2b.bsale_product_apply_items (
        apply_run_id, company_id, import_run_id, import_item_id,
        sku, bsale_variant_id, action, status, message
      ) VALUES (
        v_apply_run_id, p_target_company_id, p_import_run_id, v_item.id,
        v_item.sku, v_item.bsale_variant_id, 'conflict', 'conflict',
        'SKU ya existe en web_b2b.products'
      );
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM web_b2b.products p
      WHERE p.company_id = p_target_company_id AND p.bsale_variant_id = v_item.bsale_variant_id
    ) THEN
      v_conflicts := v_conflicts + 1;
      INSERT INTO web_b2b.bsale_product_apply_items (
        apply_run_id, company_id, import_run_id, import_item_id,
        sku, bsale_variant_id, action, status, message
      ) VALUES (
        v_apply_run_id, p_target_company_id, p_import_run_id, v_item.id,
        v_item.sku, v_item.bsale_variant_id, 'conflict', 'conflict',
        'bsale_variant_id ya existe en web_b2b.products'
      );
      CONTINUE;
    END IF;

    -- --------------------------------------------------------------------------
    -- 2.2 Slug único (helper web_b2b.generate_unique_product_slug_for_import).
    -- --------------------------------------------------------------------------
    v_slug := web_b2b.generate_unique_product_slug_for_import(
      p_target_company_id, v_item.source_name, v_item.sku
    );

    -- --------------------------------------------------------------------------
    -- 2.3 Crear producto en estado seguro. Solo web_b2b.products.
    --     Sin precios, sin stock, sin imágenes, sin publicación pública.
    -- --------------------------------------------------------------------------
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
      NULL -- vínculo inicial sin sincronización operativa (coherencia con 'pending')
    )
    RETURNING id INTO v_product_id;

    v_created := v_created + 1;

    INSERT INTO web_b2b.bsale_product_apply_items (
      apply_run_id, company_id, import_run_id, import_item_id, product_id,
      sku, bsale_variant_id, action, status, message
    ) VALUES (
      v_apply_run_id, p_target_company_id, p_import_run_id, v_item.id, v_product_id,
      v_item.sku, v_item.bsale_variant_id, 'create', 'success',
      'Producto creado en estado draft/inactivo/no visible'
    );
  END LOOP;

  -- ----------------------------------------------------------------------------
  -- 3. Cerrar apply_run. success si todo OK; partial si hubo skip/conflict/error.
  -- ----------------------------------------------------------------------------
  IF v_created > 0 AND (v_skipped = 0 AND v_conflicts = 0 AND v_errors = 0) THEN
    v_final_status := 'success';
  ELSE
    v_final_status := 'partial';
  END IF;

  UPDATE web_b2b.bsale_product_apply_runs
  SET status = v_final_status,
      total_candidates = v_candidates,
      total_created = v_created,
      total_skipped = v_skipped,
      total_conflicts = v_conflicts,
      total_errors = v_errors,
      summary = jsonb_build_object(
        'dry_run_applied', true,
        'created_safe_state', 'draft/inactive/not_visible',
        'no_prices', true,
        'no_stock', true,
        'no_images', true
      ),
      finished_at = now()
  WHERE id = v_apply_run_id;

  RETURN v_apply_run_id;
END;
$$;

-- Restricción de seguridad total: Solo para uso por service_role
REVOKE ALL ON FUNCTION public.web_b2b_system_apply_bsale_product_import_run(uuid, uuid, integer) FROM public;
REVOKE ALL ON FUNCTION public.web_b2b_system_apply_bsale_product_import_run(uuid, uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.web_b2b_system_apply_bsale_product_import_run(uuid, uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.web_b2b_system_apply_bsale_product_import_run(uuid, uuid, integer) TO service_role;

-- ==============================================================================
-- NOTAS ADICIONALES
-- ==============================================================================
-- 1. Transacción atómica: si una validación falla (RAISE EXCEPTION) o la
--    transacción aborta, NO queda ningún producto ni apply_run persistido
--    (rollback total).
-- 2. Si el caller desea un comportamiento no destructivo previo, se puede
--    envolver el llamado en BEGIN; ... ROLLBACK (dry-run técnico 6D.4C).
-- 3. DEMO/TEST: antes del primer apply real revisar DEMO-001, DEMO-002,
--    DEMO-003 y TEST-UI-001. En 6D.4B/6D.4C NO se limpian; en fase futura
--    decidir entre mantenerlos inactivos/draft, excluirlos de vistas o
--    limpiarlos por SQL/script controlado con IDs exactos.
-- 4. No se tocan product_prices, product_stock, product_images.
-- 5. apply_items registra únicamente los candidatos intentados por el apply,
--    no todos los import_items del dry-run original. Los import_items no
--    elegibles permanecen disponibles en la auditoría dry-run.
-- 6. 6D.4C: esta migración se probó únicamente con BEGIN; ... ROLLBACK.
--    NO se aplicó de forma persistente. La aplicación real es fase 6D.4D.
