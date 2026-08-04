# Reporte de Prueba Técnica con ROLLBACK — Apply Controlado Bsale (Fase 6D.4C)

- **Fecha/hora local**: 2026-08-04 08:38:53 (-04)
- **Fase**: 6D.4C — migración formal candidata + prueba técnica con `BEGIN; ... ROLLBACK`
- **Estado**: SOLO prueba técnica. Nada persistido. Sin commit, sin push.
- **Base**: borrador aprobado 6D.4B (commit `f3baa0a`); último commit `f3baa0a`.

## 1. Migración candidata

- **Archivo**: `supabase/migrations/20260804120000_web_b2b_controlled_bsale_product_apply.sql`
- **Contenido**: conversión formal del borrador 6D.4B sin cambio de alcance:
  - `web_b2b.bsale_product_apply_runs` (UNIQUE(company_id, import_run_id), FK compuesta a import_runs, RLS + REVOKE public/anon/authenticated).
  - DO block: `UNIQUE(id, run_id, company_id)` sobre `web_b2b.bsale_product_import_items` (tabla existente 6D.3C).
  - `web_b2b.bsale_product_apply_items` (FK compuesta a import_items(id, run_id, company_id), FK a products ON DELETE SET NULL, UNIQUE(company_id, import_item_id), RLS + REVOKE).
  - Helper `web_b2b.generate_unique_product_slug_for_import` (acentos/ñ/ç con `translate`, SECURITY DEFINER, `SET search_path=''`, REVOKE + GRANT solo service_role).
  - RPC `public.web_b2b_system_apply_bsale_product_import_run` (SECURITY DEFINER, `SET search_path=''`, COALESCE max_items, validaciones, conflict en duplicados, excepción sin candidatos; REVOKE + GRANT solo service_role).
  - Sin precios/stock/imágenes, sin SQL dinámico, sin `auth.uid()`/`check_admin_access()`, sin policies, sin llamadas Bsale, sin DELETE/UPDATE sobre productos existentes.

## 2. Revisión estática

- Sin `product_prices` / `product_stock` / `product_images` como target de INSERT/UPDATE/DELETE (solo mención en comentarios).
- Sin SQL dinámico (`EXECUTE` solo como `GRANT EXECUTE`).
- Sin `auth.uid()`, sin `check_admin_access()`, sin `CREATE POLICY`, sin llamadas Bsale.
- Único INSERT a `web_b2b.products`: creación de productos nuevos desde items válidos.
- REVOKE a public/anon/authenticated y GRANT EXECUTE solo a `service_role` (helper y RPC).
- RLS habilitado en las 2 tablas nuevas; 0 policies.

## 3. Prueba de migración con ROLLBACK

- **Método**: `supabase db query --linked` con bloque `BEGIN; <migración>; validaciones; ROLLBACK;`.
- **Dentro de la transacción**:
  - `apply_runs_table = web_b2b.bsale_product_apply_runs` ✅
  - `apply_items_table = web_b2b.bsale_product_apply_items` ✅
  - Funciones creadas: `generate_unique_product_slug_for_import`, `web_b2b_system_apply_bsale_product_import_run` (2/2) ✅
  - Constraint `uq_import_items_id_run_company` creado (1) ✅
  - Policies en tablas nuevas: 0 ✅
  - `products_during = 4` (aún sin RPC) ✅
- **Después del ROLLBACK**: tablas `NULL`, funciones 0, constraint 0, products 4 → la migración no dejó nada persistido ✅

## 4. Run usado para la prueba técnica

- **Run principal**: `22e1d487-36e6-4475-a0e0-a28d0305dbcc` (dry_run / success, 20 items, 20 candidatos válidos, company `d1000000-0000-0000-0000-000000000001`).
- Runs adicionales (solo pruebas negativas, sin persistencia): `4ff40ac6-9c44-4888-acd2-001df70ce578` (50 candidatos), `b82aa362-3af2-4bd0-952d-da601353cc67` (49 candidatos).
- No se crearon runs nuevos; no se llamó Bsale.

## 5. Prueba técnica RPC con ROLLBACK

- **apply_run_id obtenido dentro del rollback**: `0d1cb00a-2b80-45b7-9251-f630d6a51c5c`
- **apply_run**: `status=success`, `max_items=20`, `total_candidates=20`, `total_created=20`, `total_conflicts=0`, `total_errors=0`

| Métrica | Antes | Dentro (rollback) | Después del rollback |
|---|---|---|---|
| `web_b2b.products` | 4 | 24 (20 nuevos) | 4 |
| Productos nuevos company (no DEMO/TEST) | 0 | 20 | 0 |
| `product_prices` | 0 | 0 | 0 |
| `product_stock` | 0 | 0 | 0 |
| `product_images` | 3 | 3 | 3 |
| `apply_runs` | no existe | 1 | no existe |
| `apply_items` | no existe | 20 | no existe |
| Funciones (helper + RPC) | 0 | 2 | 0 |
| Constraint `uq_import_items_id_run_company` | 0 | 1 | 0 |
| DEMO-001/002/003 + TEST-UI-001 | 4 | 4 | 4 |

- **Productos que se habrían creado**: 20 (todos de items válidos `create/pending`, dry_run aplicado).
- **Estado seguro (0 violaciones)**: los 20 productos creados cumplen `review_status='draft'`, `is_active=false`, `is_visible=false`, `is_featured=false`, `bsale_sync_enabled=true`, `bsale_sync_status='pending'`, `bsale_last_checked_at IS NULL` ✅
- **apply_items completos**: 20/20 con `import_item_id`, `product_id`, `sku`, `bsale_variant_id`, `action='create'`, `status='success'`, `message` ✅
- **Sin precios/stock/imágenes**: conteos idénticos antes/durante; imágenes 3→3 (sin cambios) ✅
- **Productos existentes no modificados**: 4 productos DEMO/TEST intactos (mismo count y mismo sku set) ✅
- **Después del ROLLBACK**: products volvió a 4; no existen apply_runs/apply_items/funciones/constraint; runs de importación intactos (4 runs, 120 items en los runs probados) ✅

## 6. Pruebas negativas (todas con ROLLBACK)

| Prueba | Resultado |
|---|---|
| A. `max_items=21` debe fallar | PASS |
| B. `max_items=NULL` debe usar 20 | PASS (max=20, created=20, status=success) |
| C. run inexistente debe fallar | PASS |
| D. doble apply del mismo run (2º debe fallar por idempotencia) | PASS |
| E. run sin candidatos válidos debe fallar | NO_PROBADO: no existe run dry_run/success sin candidatos válidos en la DB (se documenta; se cubre por revisión estática del check 0.1) |

## 7. Hallazgos y ajustes requeridos

1. **Error 42702 detectado en ejecución** — `column reference "import_run_id" is ambiguous` en la query de idempotencia de la RPC (parámetro vs columna `a.import_run_id`). **Corregido en la migración candidata** renombrando los parámetros de la RPC con prefijo `p_` (`p_target_company_id`, `p_import_run_id`, `p_max_items`). La firma para REVOKE/GRANT no cambia (`(uuid, uuid, integer)`).
   - ✅ **Alineación documental**: el borrador `docs/productos/borrador_apply_control_6d4b.sql` fue actualizado con la misma corrección (prefijos `p_`) y quedó consistente con la migración candidata (única diferencia: línea de comentario). La migración candidata es la fuente autoritativa.
2. **Prueba E sin caso real**: no existe un run dry_run/success sin candidatos; el chequeo 0.1 de la RPC cubre el caso por inspección y quedará cubierto si surge un run así.
3. **Imágenes**: los productos creados no tienen imagen (esperado). La importación/asociación de imágenes es fase separada (auditoría por SKU/slug/nombre/cobertura).

## 8. Confirmaciones

- ✅ Migración y RPC ejecutadas ÚNICAMENTE dentro de `BEGIN; ... ROLLBACK`.
- ✅ Sin db push / db pull / migration repair.
- ✅ Sin llamadas Bsale; sin WordPress/WooCommerce/cPanel; sin imágenes.
- ✅ Sin productos/apply_runs/apply_items persistidos después del rollback.
- ✅ Sin precios/stock persistidos.
- ✅ Sin commit, sin push.
