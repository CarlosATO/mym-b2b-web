# Reporte de Aplicación de Estructura — Apply Controlado Bsale (Fase 6D.4D-A)

- **Fecha/hora local**: 2026-08-04 08:47:45 (-04)
- **Fase**: 6D.4D-A — aplicación real de estructura/RPC del apply controlado, SIN ejecutar apply
- **Estado**: estructura aplicada y validada en Supabase real. Sin commit, sin push.
- **Base**: migración versionada en commit `0866d3e`.

## 1. Comando ejecutado

```
npx supabase db query --linked --file supabase/migrations/20260804120000_web_b2b_controlled_bsale_product_apply.sql
```

- Resultado: exitoso (exit 0, sin errores).
- NO se usó `db push`, `db pull` ni `migration repair`.
- NO se llamó `public.web_b2b_system_apply_bsale_product_import_run`.

## 2. Estado previo (prevalidación)

| Elemento | Antes |
|---|---|
| `web_b2b.products` (company MYM) | 4 |
| `web_b2b.bsale_product_apply_runs` | no existe |
| `web_b2b.bsale_product_apply_items` | no existe |
| `public.web_b2b_system_apply_bsale_product_import_run` | no existe |
| `web_b2b.generate_unique_product_slug_for_import` | no existe |
| `uq_import_items_id_run_company` (import_items) | no existe |
| `product_prices` | 0 |
| `product_stock` | 0 |
| `product_images` | 3 |

## 3. Estado posterior (validaciones A–I)

### A. Tablas
- `web_b2b.bsale_product_apply_runs` ✅ existe
- `web_b2b.bsale_product_apply_items` ✅ existe

### B. RLS activo
- `apply_runs`: `relrowsecurity = true` ✅
- `apply_items`: `relrowsecurity = true` ✅

### C. Policies
- 0 policies en las tablas nuevas ✅

### D. Permisos
- Tablas: 0 privilegios de anon/authenticated sobre apply_runs/apply_items ✅
- RPC `public.web_b2b_system_apply_bsale_product_import_run`: EXECUTE solo `service_role` (+ `postgres` owner; sin public/anon/authenticated) ✅
- Helper `web_b2b.generate_unique_product_slug_for_import`: EXECUTE solo `service_role` (+ `postgres` owner; sin public/anon/authenticated) ✅

### E. Constraints
- `uq_apply_runs_company_import_run` = UNIQUE (company_id, import_run_id) ✅
- `uq_apply_items_company_import_item` = UNIQUE (company_id, import_item_id) ✅
- `uq_apply_runs_id_company` = UNIQUE (id, company_id) ✅
- `fk_apply_items_import_item_run_company` = FK (import_item_id, import_run_id, company_id) → import_items(id, run_id, company_id) ✅
- `fk_apply_runs_import_run_company` = FK (import_run_id, company_id) → import_runs(id, company_id) ✅
- `fk_apply_items_apply_run_company` = FK (apply_run_id, company_id) ON DELETE CASCADE ✅
- `fk_apply_items_product` = FK (product_id) → products(id) ON DELETE SET NULL ✅
- `chk_apply_run_max_items` = max_items BETWEEN 1 AND 20 ✅
- `chk_apply_run_status` / `chk_apply_run_source` / `chk_apply_run_mode` / `chk_apply_item_action` / `chk_apply_item_status` / `chk_apply_run_counters` ✅
- `uq_import_items_id_run_company` = UNIQUE (id, run_id, company_id) sobre `web_b2b.bsale_product_import_items` ✅

### F. Funciones
| Función | SECURITY DEFINER | search_path |
|---|---|---|
| `public.web_b2b_system_apply_bsale_product_import_run` | true | `search_path=""` (vacío) |
| `web_b2b.generate_unique_product_slug_for_import` | true | `search_path=""` (vacío) |

### G. Productos sin cambios
- `products` MYM: 4 → 4 ✅ (total 4 → 4)

### H. Sin tocar precios/stock/imágenes
- `product_prices`: 0 → 0 ✅
- `product_stock`: 0 → 0 ✅
- `product_images`: 3 → 3 ✅

### I. Apply vacías
- `bsale_product_apply_runs`: 0 filas ✅
- `bsale_product_apply_items`: 0 filas ✅

## 4. Confirmaciones

- ✅ Estructura aplicada solo con `db query --linked --file` (sin db push/pull/migration repair).
- ✅ NO se llamó la RPC de apply; NO se crearon/modificaron/borraron productos.
- ✅ Sin precios/stock/imágenes modificados.
- ✅ apply_runs/apply_items vacías (0/0).
- ✅ Sin llamadas Bsale; sin WordPress/WooCommerce/cPanel; sin imágenes.
- ✅ Sin commit, sin push.

## 5. Siguiente fase

- 6D.4D: primer apply real (máximo 20 productos), previa decisión DEMO/TEST y revisión visual del run dry_run elegido.
