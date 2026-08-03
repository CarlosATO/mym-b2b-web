-- ==============================================================================
-- 1. Tabla de Control de Corridas (Runs)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS web_b2b.bsale_product_import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  started_by uuid,
  source text NOT NULL DEFAULT 'manual',
  mode text NOT NULL DEFAULT 'dry_run',
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  total_seen integer NOT NULL DEFAULT 0,
  total_created integer NOT NULL DEFAULT 0,
  total_updated integer NOT NULL DEFAULT 0,
  total_skipped integer NOT NULL DEFAULT 0,
  total_conflicts integer NOT NULL DEFAULT 0,
  total_errors integer NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_bsale_import_runs_id_company UNIQUE (id, company_id),
  CONSTRAINT chk_run_source CHECK (source IN ('manual', 'scheduled', 'script', 'admin')),
  CONSTRAINT chk_run_mode CHECK (mode IN ('dry_run', 'apply')),
  CONSTRAINT chk_run_status CHECK (status IN ('running', 'success', 'failed', 'partial', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_bsale_import_runs_company_started 
  ON web_b2b.bsale_product_import_runs(company_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_bsale_import_runs_company_status 
  ON web_b2b.bsale_product_import_runs(company_id, status);

CREATE INDEX IF NOT EXISTS idx_bsale_import_runs_company_mode 
  ON web_b2b.bsale_product_import_runs(company_id, mode);

-- ==============================================================================
-- 2. Tabla de Items (Detalle por producto/variante)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS web_b2b.bsale_product_import_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL,
  company_id uuid NOT NULL,
  bsale_variant_id text,
  sku text,
  source_name text,
  matched_product_id uuid REFERENCES web_b2b.products(id) ON DELETE SET NULL,
  action text NOT NULL,
  status text NOT NULL,
  conflict_type text,
  message text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_bsale_import_items_run_company
    FOREIGN KEY (run_id, company_id)
    REFERENCES web_b2b.bsale_product_import_runs(id, company_id)
    ON DELETE CASCADE,
  CONSTRAINT chk_item_action CHECK (action IN ('create', 'update', 'skip', 'conflict', 'error', 'link_existing')),
  CONSTRAINT chk_item_status CHECK (status IN ('pending', 'success', 'skipped', 'conflict', 'error')),
  CONSTRAINT chk_item_conflict CHECK (
    conflict_type IS NULL OR 
    conflict_type IN (
      'duplicate_sku', 
      'duplicate_bsale_variant_id', 
      'sku_variant_mismatch', 
      'missing_sku', 
      'missing_name', 
      'inactive_in_bsale_active_in_web', 
      'invalid_payload', 
      'unknown'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_bsale_import_items_run 
  ON web_b2b.bsale_product_import_items(run_id);

CREATE INDEX IF NOT EXISTS idx_bsale_import_items_sku 
  ON web_b2b.bsale_product_import_items(company_id, sku);

CREATE INDEX IF NOT EXISTS idx_bsale_import_items_variant_id 
  ON web_b2b.bsale_product_import_items(company_id, bsale_variant_id);

CREATE INDEX IF NOT EXISTS idx_bsale_import_items_status 
  ON web_b2b.bsale_product_import_items(company_id, status);

CREATE INDEX IF NOT EXISTS idx_bsale_import_items_conflict 
  ON web_b2b.bsale_product_import_items(company_id, conflict_type);

CREATE INDEX IF NOT EXISTS idx_bsale_import_items_matched_product 
  ON web_b2b.bsale_product_import_items(matched_product_id);

-- ==============================================================================
-- 3. RLS Policies (Restrictivas)
-- ==============================================================================

ALTER TABLE web_b2b.bsale_product_import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_b2b.bsale_product_import_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE web_b2b.bsale_product_import_runs FROM public;
REVOKE ALL ON TABLE web_b2b.bsale_product_import_runs FROM anon;
REVOKE ALL ON TABLE web_b2b.bsale_product_import_runs FROM authenticated;

REVOKE ALL ON TABLE web_b2b.bsale_product_import_items FROM public;
REVOKE ALL ON TABLE web_b2b.bsale_product_import_items FROM anon;
REVOKE ALL ON TABLE web_b2b.bsale_product_import_items FROM authenticated;

-- No se exponen políticas de SELECT, INSERT, UPDATE, DELETE para web_b2b. 
-- Todo el acceso será mediado por las funciones SECURITY DEFINER (para consultas admin) 
-- y scripts ejecutados por service_role (que ignora RLS).

-- ==============================================================================
-- 4. RPCs de Consulta Admin (Solo Lectura)
-- ==============================================================================

-- A. Listar Corridas
CREATE OR REPLACE FUNCTION public.web_b2b_admin_list_bsale_product_import_runs(target_company_id uuid)
RETURNS TABLE (
  id uuid,
  source text,
  mode text,
  status text,
  started_at timestamptz,
  finished_at timestamptz,
  total_seen integer,
  total_created integer,
  total_updated integer,
  total_skipped integer,
  total_conflicts integer,
  total_errors integer,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Validar que el usuario tiene rol de admin para esta compañía
  PERFORM web_b2b.check_admin_access(target_company_id);

  RETURN QUERY
  SELECT 
    r.id,
    r.source,
    r.mode,
    r.status,
    r.started_at,
    r.finished_at,
    r.total_seen,
    r.total_created,
    r.total_updated,
    r.total_skipped,
    r.total_conflicts,
    r.total_errors,
    r.error_message
  FROM web_b2b.bsale_product_import_runs r
  WHERE r.company_id = target_company_id
  ORDER BY r.started_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.web_b2b_admin_list_bsale_product_import_runs(uuid) FROM public;
REVOKE ALL ON FUNCTION public.web_b2b_admin_list_bsale_product_import_runs(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.web_b2b_admin_list_bsale_product_import_runs(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.web_b2b_admin_list_bsale_product_import_runs(uuid) TO authenticated;

-- B. Listar Items de una Corrida (Paginado)
CREATE OR REPLACE FUNCTION public.web_b2b_admin_list_bsale_product_import_items(
  target_company_id uuid, 
  import_run_id uuid,
  page_size integer DEFAULT 100,
  page_number integer DEFAULT 1
)
RETURNS TABLE (
  id uuid,
  run_id uuid,
  bsale_variant_id text,
  sku text,
  source_name text,
  matched_product_id uuid,
  action text,
  status text,
  conflict_type text,
  message text,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_page_size integer;
  v_page_number integer;
  v_offset integer;
  v_total_count bigint;
BEGIN
  -- Validar que el usuario tiene rol de admin para esta compañía
  PERFORM web_b2b.check_admin_access(target_company_id);

  -- Validar que la corrida pertenece a la compañía
  IF NOT EXISTS (SELECT 1 FROM web_b2b.bsale_product_import_runs r WHERE r.id = import_run_id AND r.company_id = target_company_id) THEN
    RAISE EXCEPTION 'Run no encontrado o no pertenece a la compañía';
  END IF;

  -- Sanitización
  v_page_size := COALESCE(page_size, 100);
  IF v_page_size < 1 THEN v_page_size := 100; END IF;
  IF v_page_size > 200 THEN v_page_size := 200; END IF;

  v_page_number := COALESCE(page_number, 1);
  IF v_page_number < 1 THEN v_page_number := 1; END IF;
  IF v_page_number > 500 THEN v_page_number := 500; END IF;
  
  v_offset := (v_page_number - 1) * v_page_size;

  -- Obtener count total
  SELECT COUNT(*) INTO v_total_count
  FROM web_b2b.bsale_product_import_items i
  WHERE i.run_id = import_run_id AND i.company_id = target_company_id;

  RETURN QUERY
  SELECT 
    i.id,
    i.run_id,
    i.bsale_variant_id,
    i.sku,
    i.source_name,
    i.matched_product_id,
    i.action,
    i.status,
    i.conflict_type,
    i.message,
    i.created_at,
    v_total_count AS total_count
  FROM web_b2b.bsale_product_import_items i
  WHERE i.run_id = import_run_id AND i.company_id = target_company_id
  ORDER BY i.created_at ASC, i.id ASC
  LIMIT v_page_size
  OFFSET v_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.web_b2b_admin_list_bsale_product_import_items(uuid, uuid, integer, integer) FROM public;
REVOKE ALL ON FUNCTION public.web_b2b_admin_list_bsale_product_import_items(uuid, uuid, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.web_b2b_admin_list_bsale_product_import_items(uuid, uuid, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.web_b2b_admin_list_bsale_product_import_items(uuid, uuid, integer, integer) TO authenticated;
