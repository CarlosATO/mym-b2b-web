# Diseño del Primer Apply Controlado — Bsale → web_b2b.products (Fase 6D.4A)

- **Estado**: SOLO DISEÑO. No se implementa ni ejecuta nada de este documento todavía.
- **Fase**: 6D.4A (previa a 6D.4B migración/RPC, 6D.4C dry-run técnico, 6D.4D primer apply real).
- **Base**: Fase 6D.3F cerrada (commit `e5c2d13`). Bsale reporta 3.591 variantes; muestra de 200 analizada (184 create / 16 skip / 0 conflicts / 0 errors); `web_b2b.products` con 4 productos (demo/TEST).

## 1. Objetivo

Ejecutar, en una fase posterior, la creación controlada de un máximo de **20 productos** en `web_b2b.products` a partir de items de una auditoría dry-run revisada visualmente en el panel admin. Los productos nacen en estado seguro: `review_status='draft'`, `is_active=false`, `is_visible=false`, `is_featured=false`, `bsale_sync_enabled=true`, `bsale_sync_status='pending'`. Sin precios, sin stock, sin imágenes, sin publicación pública, sin carrito, sin pagos, sin Storage.

## 2. Criterio de selección del primer apply

El primer apply toma como máximo 20 items desde **una única auditoría dry-run ya revisada visualmente** (recomendado: el run más reciente `success` aprobado por ID).

Criterios obligatorios de selección de cada item:
- `run.mode = 'dry_run'`
- `run.status = 'success'`
- `item.action = 'create'`
- `item.status = 'pending'`
- `item.conflict_type IS NULL`
- `item.sku` no nulo
- `item.bsale_variant_id` no nulo
- `item.source_name` no nulo
- No productos inactivos/skipped, no conflictos, no errores
- Límite máximo 20 items

Selección del run:
- Usar el run más reciente validado visualmente, o
- Un run específico aprobado por ID explícito (parámetro `import_run_id`).

## 3. Validaciones previas al apply

Antes de insertar cada producto:
- El SKU no existe en `web_b2b.products` para el `company_id`.
- El `bsale_variant_id` no existe en `web_b2b.products` para el `company_id`.
- El `slug` generado no colisiona; si colisiona, usar sufijo controlado (`-1`, `-2`, ...).
- `name`/`source_name` válido (no vacío).
- `proposed_changes` del item NO contiene `price`/`stock`/`cost` (debe estar ya sanitizado).
- `item.payload.dry_run = true` (el payload persistido debe marcar dry_run).
- El run pertenece al `company_id`.
- El run no ha sido aplicado antes (idempotencia, ver sección 4).
- Si no hay candidatos válidos para aplicar, el apply aborta con excepción controlada (sin apply_run vacío).
- Duplicados detectados (SKU o `bsale_variant_id` ya existentes en `web_b2b.products` para el company) → `apply_item` registrado como `conflict`; nunca producto inseguro.

## 4. Idempotencia y bloqueo (diseño)

Opciones evaluadas:
1. Columnas `applied_at` / `apply_run_id` en `bsale_product_import_runs` e items.
2. Tabla de control ligera `web_b2b.bsale_product_apply_runs` (cabecera: id, import_run_id, company_id, status, applied_at, created_count, error_message) + `web_b2b.bsale_product_apply_items` (relación apply_run → import_item → product_id creado).
3. Reutilizar las tablas de auditoría existentes con columnas adicionales.

**Recomendación**: opción 2 (nueva tabla `web_b2b.bsale_product_apply_runs` + `apply_items`). Es la más segura y mantenible porque:
- No mezcla el ciclo de vida del dry-run con el del apply.
- Registra exactamente qué productos creó cada apply (trazabilidad).
- Permite idempotencia por `import_run_id` único (índice único `(company_id, import_run_id)`).
- Si falla a mitad de transacción, el rollback deja trazabilidad clara (nada persistido si se usa transacción; si hay modo parcial, un `status='failed'` en apply_runs con `error_message`).

Requisitos de diseño:
- Un run dry-run no puede aplicarse dos veces (bloqueo por índice único + check dentro de la RPC).
- El apply registra qué productos creó.
- Todo el apply se ejecuta en **una transacción** (BEGIN/COMMIT; ante error → ROLLBACK).
- Si ocurre error, queda trazabilidad: apply_runs con `status='failed'` y `error_message` (solo si el diseño decide persistir el fallo fuera de la transacción; lo más simple y seguro: rollback total y el error llega como excepción de la RPC, sin estado intermedio).

No se implementa SQL todavía; es diseño.

## 5. RPC system propuesta (NO ejecutada)

```
public.web_b2b_system_apply_bsale_product_import_run(
  target_company_id uuid,
  import_run_id uuid,
  max_items integer DEFAULT 20
)
```

Características requeridas:
- `SECURITY DEFINER`
- `SET search_path = ''`
- `GRANT EXECUTE` solo a `service_role`
- Sin `auth.uid()`, sin `check_admin_access()`
- Sin SQL dinámico
- No acepta secretos
- No toca precios/stock/imágenes
- Inserta únicamente en `web_b2b.products` y tablas de control/auditoría de apply
- Valida `max_items <= 20` en esta primera fase (rechazo controlado si se supera); `COALESCE(max_items, 20)` como default efectivo
- Ejecuta el criterio de selección de la sección 2 y las validaciones de la sección 3 dentro de la transacción

## 6. Mapping exacto a web_b2b.products

Desde `item`/auditoría (campos del RPC de apply):

| Columna | Valor |
|---|---|
| company_id | target_company_id |
| sku | item.sku |
| bsale_variant_id | item.bsale_variant_id |
| name | item.source_name |
| slug | generado desde source_name (+ sufijo si colisiona; fallback con sku) |
| short_description | null |
| description | null |
| category_id | null |
| brand_id | null |
| is_active | false |
| is_visible | false |
| is_featured | false |
| review_status | 'draft' |
| order_index | 0 |
| seo_title | null |
| seo_description | null |
| bsale_sync_enabled | true |
| bsale_sync_status | 'pending' |
| bsale_last_checked_at | null (no se ha sincronizado operacionalmente aún; `now()` sería engañoso) |
| created_at / updated_at | defaults de la tabla |

No se inserta en `product_images`, `product_prices`, `product_stock`.

## 7. Auditoría del apply

Registrar:
- run aplicado (import_run_id).
- fecha de apply.
- cantidad creada.
- productos creados (IDs).
- errores.
- usuario/system que ejecutó (service_role; `started_by` o columna `applied_by` con 'system').
- relación import_item → product_id creado.

Forma propuesta:
- `web_b2b.bsale_product_apply_runs(id, company_id, import_run_id, status, created_count, applied_at, error_message)`.
- `web_b2b.bsale_product_apply_items(id, apply_run_id, import_item_id, product_id, sku)`.
- Índice único `(company_id, import_run_id)` en apply_runs para idempotencia.

## 8. Rollback conceptual

- No habrá borrado automático masivo desde UI.
- Si hay error posterior al apply:
  - Marcar productos creados como `is_active=false` e `is_visible=false`.
  - Mantener `review_status='draft'`.
  - Eventualmente limpiar con SQL/script controlado usando IDs exactos (nunca por rango/filtro amplio).
  - Nunca borrar sin revisión humana.

## 9. Limpieza DEMO/TEST

Productos actuales: DEMO-001, DEMO-002, DEMO-003, TEST-UI-001 (4 registros en `web_b2b.products`).
- **No se eliminan en esta fase.**
- Estrategia propuesta (a decidir en 6D.4B/6D.4C, una de las siguientes):
  1. Mantenerlos inactivos/draft y excluirlos de vistas reales, o
  2. Limpiarlos con SQL controlado (IDs exactos) antes del primer apply, o
  3. Excluirlos explícitamente de la selección del apply por SKU.
- La recomendación más conservadora para el primer apply: no borrar; marcar inactivo/no visible si estorban y excluirlos por SKU del apply.

## 10. Riesgos

- Importar demasiados productos sin categoría/marca/imagen (catálogo incompleto visualmente).
- Duplicidad SKU no detectada por carrera (dos applies simultáneos) — mitigar con transacción + índices únicos.
- Slugs colisionados — mitigar con sufijo controlado.
- Diferencias entre variante Bsale y producto base (nombre/presentación) — mitigar con mapper ya corregido y revisión visual.
- Productos inactivos en Bsale — ya excluidos por el planner (skip).
- Imposibilidad de rollback automático si se borra mal — nunca borrar sin revisión; usar flags.
- Mezcla con productos demo/test — excluir por SKU y/o limpiar controlado.

## 11. Recomendación final

- **NO aplicar aún.**
- **6D.4B**: crear migración + RPC de apply controlado (borrador SQL en repositorio, sin ejecutar) + tablas de apply_runs/apply_items.
- **6D.4C**: dry-run técnico del apply con transacción y ROLLBACK (verificar selección, mappings, idempotencia) sin persistir productos.
- **6D.4D**: primer apply real con máximo 20 productos, tras revisión visual del run elegido y limpieza/decisión DEMO/TEST.

### 6D.4B — Borrador SQL/RPC apply controlado

Subfase de revisión técnica: borrador SQL local, sin ejecutar.

- **Archivo**: `docs/productos/borrador_apply_control_6d4b.sql` (aún NO es migración formal; se convierte en `supabase/migrations/...` solo tras aprobación en 6D.4C).
- **Tablas propuestas**:
  - `web_b2b.bsale_product_apply_runs`: cabecera de cada apply (company_id, import_run_id, source, mode='controlled_apply', status running/success/failed/partial/cancelled, max_items 1..20, contadores ≥ 0, summary, error_message, timestamps). Checks source IN ('script','system','admin'), UNIQUE(company_id, import_run_id), FK compuesta a import_runs(id, company_id). RLS habilitada sin policies; REVOKE a public/anon/authenticated.
  - `web_b2b.bsale_product_apply_items`: detalle por item (apply_run_id, company_id, import_run_id, import_item_id, product_id, sku, bsale_variant_id, action create/skip/conflict/error, status success/skipped/conflict/error, message). FK compuesta a apply_runs, FK compuesta a import_items(id, run_id, company_id) — previa adición de UNIQUE(id, run_id, company_id) sobre la tabla existente vía DO block —, FK a products(id) ON DELETE SET NULL, UNIQUE(company_id, import_item_id). RLS restrictiva. apply_items registra únicamente los candidatos intentados por el apply; los import_items no elegibles permanecen en la auditoría dry-run.
- **Helper de slug**: `web_b2b.generate_unique_product_slug_for_import(p_company_id, p_name, p_sku)` — minúsculas, normalización de acentos/ñ/ç con `translate` (sin unaccent ni extensiones nuevas), no alfanuméricos → guiones, colapsa repetidos, fallback a sku, sufijo `-2`, `-3`… ante colisión, límite defensivo 100 intentos, sin SQL dinámico, SECURITY DEFINER, `SET search_path=''`, REVOKE a public/anon/authenticated y GRANT solo service_role.
- **RPC futura**: `public.web_b2b_system_apply_bsale_product_import_run(target_company_id, import_run_id, max_items DEFAULT 20)` — SECURITY DEFINER, `SET search_path=''`, sin auth.uid()/check_admin_access()/SQL dinámico/secretos, GRANT solo service_role, `max_items` entre 1 y 20 con `COALESCE(max_items, 20)` (variable `v_max_items` usada en apply_runs y LIMIT). Inserta únicamente en `web_b2b.products`, `apply_runs` y `apply_items`.
- **Validaciones del apply**: run existe y pertenece a la compañía; `mode='dry_run'`; `status='success'`; sin apply previo (idempotencia); sin candidatos válidos → excepción controlada sin apply_run vacío; selección de items `create`/`pending`/sin conflict_type con sku, bsale_variant_id y source_name no nulos y `payload->>'dry_run'='true'`, limitado a `max_items`; validación de SKU y bsale_variant_id inexistentes en products; slug único. Duplicados detectados (SKU o bsale_variant_id ya existentes) → apply_item `conflict`/`conflict` (nunca producto inseguro, nunca skip).
- **Datos insertados**: draft, is_active=false, is_visible=false, is_featured=false, bsale_sync_enabled=true, bsale_sync_status='pending' (aún sin sincronización operativa), bsale_last_checked_at=null (vínculo inicial desde la auditoría; coherencia con 'pending'), sin precios/stock/imágenes.
- **Errores/rollback**: transacción atómica; fallo → RAISE EXCEPTION → rollback total (sin productos ni apply_run persistidos); `failed` persistido queda para observabilidad futura.
- **DEMO/TEST**: nota en el borrador — DEMO-001..003 y TEST-UI-001 se revisan antes del primer apply real; en 6D.4B no se limpian.

### 6D.4C — Migración candidata y prueba técnica rollback

Subfase de prueba técnica SIN persistencia: la migración candidata y la RPC se ejecutan únicamente dentro de transacciones `BEGIN; ... ROLLBACK`.

- **Migración candidata**: `supabase/migrations/20260804120000_web_b2b_controlled_bsale_product_apply.sql` — conversión formal del borrador 6D.4B (commit `f3baa0a`), sin cambio de alcance. NO está aplicada en la DB.
- **Prueba de aplicación (rollback)**: la migración completa se ejecutó dentro de `BEGIN; ... ROLLBACK`; tablas, constraint UNIQUE, helper y RPC quedaron disponibles dentro de la transacción y no existen después del rollback.
- **Prueba técnica RPC (rollback)**: con el run `22e1d487-36e6-4475-a0e0-a28d0305dbcc` (dry_run/success, 20 items válidos) la RPC creó 20 productos en estado seguro (`draft`, inactivo, no visible, `bsale_sync_status='pending'`, `bsale_last_checked_at=NULL`), sin precios/stock/imágenes, y registró apply_runs + 20 apply_items completos. Todo se deshizo con ROLLBACK.
- **Pruebas negativas (rollback)**: max_items>20 falla; max_items NULL usa 20; run inexistente falla; doble apply del mismo run falla por idempotencia. Sin candidatos: no se probó (no existe run sin candidatos en la DB).
- **Hallazgo corregido**: la RPC del borrador provocaba error `42702 column reference "import_run_id" is ambiguous` (parámetro vs columna de tabla). Se corrigió en la migración candidata con prefijos `p_` (`p_target_company_id`, `p_import_run_id`, `p_max_items`) y el borrador `docs/productos/borrador_apply_control_6d4b.sql` fue alineado con la misma corrección para evitar divergencia documental (única diferencia: línea de comentario).
- **Estado**: fase lista para 6D.4D (primer apply real ≤ 20 productos) tras decisión DEMO/TEST y revisión visual del run elegido.

### 6D.4D-A — Aplicación real de estructura (sin ejecutar apply)

Subfase de instalación estructural: se aplica la migración en Supabase real y se valida; la RPC de apply NO se llama y NO se crean productos.

- **Comando**: `npx supabase db query --linked --file supabase/migrations/20260804120000_web_b2b_controlled_bsale_product_apply.sql` (sin db push/db pull/migration repair).
- **Validado**: tablas apply_runs/apply_items existen con RLS activo y 0 policies; REVOKE a public/anon/authenticated y GRANT EXECUTE solo a service_role (RPC y helper); ambas funciones SECURITY DEFINER con `search_path=''`; constraints UNIQUE(company_id, import_run_id), UNIQUE(company_id, import_item_id), FK compuesta (import_item_id, import_run_id, company_id), checks max_items 1..20, status/source/mode/action; `uq_import_items_id_run_company` sobre import_items.
- **Sin efectos de datos**: `web_b2b.products` 4→4; product_prices 0, product_stock 0, product_images 3 sin cambios; apply_runs 0 y apply_items 0.
- **Reporte**: `docs/productos/REPORTE_APLICACION_ESTRUCTURA_APPLY_BSALE_6D4D_A.md`.
- **Siguiente**: 6D.4D (primer apply real ≤ 20 productos) tras decisión DEMO/TEST.

### 6D.4D-B — Primer apply real controlado (ejecutado)

Subfase de ejecución real: la RPC de apply se ejecuta UNA sola vez, sin ROLLBACK (persistente), con máx 20 productos y verificación inmediata de estado seguro. Sin Bsale; sin precios/stock/imágenes; DEMO/TEST intactos (decisión: no limpiar).

- **Prevalidaciones (todas PASS antes de llamar la RPC)**: conteos base (products 4, prices 0, stock 0, images 3, apply_runs 0, apply_items 0); run `22e1d487-36e6-4475-a0e0-a28d0305dbcc` con company_id correcto, mode `dry_run`, status `success`; sin apply previo (idempotencia); 20 candidatos `create`/`pending`/sin conflict_type con sku/bsale_variant_id/source_name y `payload->>'dry_run'='true'`; 0 colisiones de SKU y 0 de bsale_variant_id contra `web_b2b.products`.
- **Ejecución única**: `SELECT public.web_b2b_system_apply_bsale_product_import_run('d1000000-0000-0000-0000-000000000001'::uuid, '22e1d487-36e6-4475-a0e0-a28d0305dbcc'::uuid, 20)` → `apply_run_id = 9a209048-b2fe-4ee4-af42-b5bf3901442c` (persistido).
- **Resultado**: apply_run `success`, max_items 20, total_candidates 20, total_created 20, total_skipped 0, total_conflicts 0, total_errors 0; summary `{created_safe_state: draft/inactive/not_visible, dry_run_applied: true, no_images: true, no_prices: true, no_stock: true}`; 20 apply_items `create`/`success` completos (import_item_id, product_id, sku, bsale_variant_id, message).
- **Productos creados**: 20 en estado seguro (draft, inactivo, no visible, no featured, `bsale_sync_enabled=true`, `bsale_sync_status='pending'`, `bsale_last_checked_at=NULL`, sin categoría/marca/descripciones/SEO).
- **Conteos post**: products 4→24; apply_runs 0→1; apply_items 0→20; prices 0, stock 0, images 3 sin cambios.
- **No exposición pública**: las RPCs de catálogo público muestran solo los productos visibles preexistentes; los 20 nuevos no aparecen.
- **DEMO/TEST**: DEMO-001/002/003 y TEST-UI-001 intactos y sin modificar.
- **Reporte**: `docs/productos/REPORTE_PRIMER_APPLY_BSALE_6D4D_B.md`.

### 6D.4E — Revisión post-apply y curación comercial (diagnóstico)

Subfase SOLO lectura y diseño; no importa más productos, no llama Bsale, no ejecuta apply, no toca precios/stock/imágenes.

- **Revisión del apply**: 20/20 productos del apply_run `9a209048-b2fe-4ee4-af42-b5bf3901442c` presentes en `web_b2b.products`; 0 inseguros; 0 visibles públicamente; 0 con precio/stock/imagen.
- **Diagnóstico de curación**: 20/20 sin categoría, sin marca, sin imagen, sin descripción y sin SEO → 0 listos para revisión comercial, 20 requieren curación manual. Después del primer apply NO se recomienda importar masivamente todavía; primero curar la muestra.
- **DEMO/TEST**: DEMO-001/002/003 (activos/visibles en catálogo público) y TEST-UI-001 (oculto) siguen intactos. Estrategia: mantener durante desarrollo; antes de publicación real limpiarlos con script/SQL controlado o dejarlos fuera de producción; nunca mezclarlos con productos Bsale.
- **Flujo futuro de productos nuevos desde Bsale** (diseñado, no implementado):
  - Entrada siempre como borrador seguro: `draft`, `is_active=false`, `is_visible=false`, `is_featured=false`, `bsale_sync_status='pending'`, sin publicación automática.
  - A. Sync automático programado: corre en cron, detecta variantes nuevas, importa como borrador, registra auditoría, no publica, no toca imágenes, no sobrescribe contenido curado.
  - B. Botón admin "Sincronizar desde Bsale": solo admin autorizado, dispara el MISMO proceso, sin publicación automática, sin productos manuales aislados.
  - C. Panel "Productos pendientes de curación": filtros sin categoría/marca/imagen, borrador, pendiente Bsale; acciones futuras asignar categoría/marca, cargar imagen, editar descripción, publicar.
- **Imágenes**: fase futura separada; auditoría por SKU y por slug/nombre; productos sin imagen son esperados; nunca mezclar con apply base.
- **Reporte**: `docs/productos/REPORTE_POST_APPLY_CURACION_BSALE_6D4E.md`.
