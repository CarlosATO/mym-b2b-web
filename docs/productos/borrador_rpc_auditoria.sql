-- BORRADOR: NO EJECUTAR TODAVÍA EN ESTA FASE.
-- RPC para persistir los resultados del planner (runs e items) usando service_role.
-- Justificación: Al no estar expuesto el schema web_b2b en PostgREST,
-- los scripts ejecutados vía supabase-js no pueden insertar directamente en estas tablas.

-- ALCANCE DE ESTA FASE:
-- * Esta RPC persiste auditorías dry_run COMPLETAS.
-- * Si la transacción falla, no queda ningún run 'failed' persistido
--   (la transacción hace rollback de run e items).
-- * El estado 'failed' queda pendiente para una fase futura de
--   observabilidad avanzada (no se implementa manejo complejo aquí).
-- * En esta fase los únicos status persistidos son 'success' o 'partial'.

CREATE OR REPLACE FUNCTION public.web_b2b_system_create_bsale_product_import_audit(
  target_company_id uuid,
  p_source text,
  p_mode text,
  p_total_seen integer,
  p_total_created integer,
  p_total_updated integer,
  p_total_skipped integer,
  p_total_conflicts integer,
  p_total_errors integer,
  p_summary jsonb,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_run_id uuid;
  v_status text;
BEGIN
  -- 0. Validaciones estrictas
  IF p_mode <> 'dry_run' THEN
    RAISE EXCEPTION 'El modo debe ser exclusivamente dry_run en esta fase.';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'p_items debe ser un array JSON válido y no nulo.';
  END IF;

  IF jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'p_items no puede superar 50 elementos en esta fase de prueba.';
  END IF;

  IF p_summary IS NULL OR jsonb_typeof(p_summary) <> 'object' THEN
    RAISE EXCEPTION 'p_summary debe ser un objeto JSON válido y no nulo.';
  END IF;

  IF p_total_seen < 0 OR p_total_created < 0 OR p_total_updated < 0 OR p_total_skipped < 0 OR p_total_conflicts < 0 OR p_total_errors < 0 THEN
    RAISE EXCEPTION 'Los contadores de auditoría no pueden ser negativos.';
  END IF;

  -- 1. Determinar el status final del run basado en errores/conflictos
  --    (dry_run completo => 'success' o 'partial'; 'failed' queda pendiente
  --     de una fase futura de observabilidad avanzada).
  IF p_total_errors > 0 OR p_total_conflicts > 0 THEN
    v_status := 'partial';
  ELSE
    v_status := 'success';
  END IF;

  -- 2. Insertar el Run
  INSERT INTO web_b2b.bsale_product_import_runs (
    company_id,
    started_by,
    source,
    mode,
    status,
    started_at,
    finished_at,
    total_seen,
    total_created,
    total_updated,
    total_skipped,
    total_conflicts,
    total_errors,
    summary,
    error_message
  ) VALUES (
    target_company_id,
    NULL, -- started_by nulo porque es script system
    p_source,
    p_mode,
    v_status,
    now(),
    now(),
    p_total_seen,
    p_total_created,
    p_total_updated,
    p_total_skipped,
    p_total_conflicts,
    p_total_errors,
    p_summary,
    NULL
  )
  RETURNING id INTO v_run_id;

  -- 3. Insertar los items
  IF jsonb_array_length(p_items) > 0 THEN
    INSERT INTO web_b2b.bsale_product_import_items (
      run_id,
      company_id,
      bsale_variant_id,
      sku,
      source_name,
      matched_product_id,
      action,
      status,
      conflict_type,
      message,
      payload
    )
    SELECT
      v_run_id,
      target_company_id,
      NULLIF(i.bsale_variant_id, ''),
      NULLIF(i.sku, ''),
      i.source_name,
      i.matched_product_id,
      i.action,
      i.status,
      NULLIF(i.conflict_type, ''),
      i.message,
      i.payload
    FROM jsonb_to_recordset(p_items) AS i(
      bsale_variant_id text,
      sku text,
      source_name text,
      matched_product_id uuid,
      action text,
      status text,
      conflict_type text,
      message text,
      payload jsonb
    );
  END IF;

  RETURN v_run_id;
END;
$$;

-- Restricción de seguridad total: Solo para uso por service_role
REVOKE ALL ON FUNCTION public.web_b2b_system_create_bsale_product_import_audit(uuid, text, text, integer, integer, integer, integer, integer, integer, jsonb, jsonb) FROM public;
REVOKE ALL ON FUNCTION public.web_b2b_system_create_bsale_product_import_audit(uuid, text, text, integer, integer, integer, integer, integer, integer, jsonb, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.web_b2b_system_create_bsale_product_import_audit(uuid, text, text, integer, integer, integer, integer, integer, integer, jsonb, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.web_b2b_system_create_bsale_product_import_audit(uuid, text, text, integer, integer, integer, integer, integer, integer, jsonb, jsonb) TO service_role;
