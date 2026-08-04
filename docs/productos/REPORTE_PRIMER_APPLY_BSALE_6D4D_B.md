# Reporte — Primer Apply Real Bsale (Fase 6D.4D-B)

- **Fecha/hora local**: 2026-08-04 08:55 – 08:57 (-04)
- **Fecha/hora DB (UTC)**: apply completado 2026-08-04 12:56:13.752413+00
- **Entorno**: Supabase real (linked), rama `main`, último commit previo `22d8ca1`
- **Run dry_run usado**: `22e1d487-36e6-4475-a0e0-a28d0305dbcc` (mode `dry_run`, status `success`, 20 items, 20 candidatos válidos, 0 conflictos — mismo run validado en prueba rollback 6D.4C)
- **apply_run_id creado**: `9a209048-b2fe-4ee4-af42-b5bf3901442c`

## SQL exacto ejecutado (sin secretos)

```sql
-- Prevalidación (solo SELECT, una vez)
-- Conteos base, run, idempotencia, candidatos, colisiones: PASS
-- Candidatos: 20 (action='create', status='pending', conflict_type IS NULL,
--              sku/bsale_variant_id/source_name NOT NULL, payload->>'dry_run'='true')
-- Colisiones: 0 SKU, 0 bsale_variant_id contra web_b2b.products (MYM)

-- Única llamada real (persistente, sin ROLLBACK)
SELECT public.web_b2b_system_apply_bsale_product_import_run(
  'd1000000-0000-0000-0000-000000000001'::uuid,
  '22e1d487-36e6-4475-a0e0-a28d0305dbcc'::uuid,
  20
) AS apply_run_id;
-- Resultado: 9a209048-b2fe-4ee4-af42-b5bf3901442c

-- Postvalidación (solo SELECT): conteos, apply_run, apply_items, productos, catálogo público
```

## Conteos antes / después

| Tabla | Antes | Después | Δ |
|---|---|---|---|
| `web_b2b.products` (MYM) | 4 | 24 | +20 |
| `web_b2b.product_prices` | 0 | 0 | 0 |
| `web_b2b.product_stock` | 0 | 0 | 0 |
| `web_b2b.product_images` | 3 | 3 | 0 |
| `web_b2b.bsale_product_apply_runs` | 0 | 1 | +1 |
| `web_b2b.bsale_product_apply_items` | 0 | 20 | +20 |

## Summary apply_run

| Campo | Valor |
|---|---|
| id | `9a209048-b2fe-4ee4-af42-b5bf3901442c` |
| company_id | `d1000000-0000-0000-0000-000000000001` |
| import_run_id | `22e1d487-36e6-4475-a0e0-a28d0305dbcc` |
| mode | `controlled_apply` |
| source | `script` |
| status | `success` |
| max_items | 20 |
| total_candidates / total_created | 20 / 20 |
| total_skipped / total_conflicts / total_errors | 0 / 0 / 0 |
| summary | `{"created_safe_state": "draft/inactive/not_visible", "dry_run_applied": true, "no_images": true, "no_prices": true, "no_stock": true}` |
| error_message | NULL |

## Validación apply_items (20/20)

- 20 filas, todas `action='create'`, `status='success'`.
- 20/20 con `import_item_id`, `product_id`, `sku`, `bsale_variant_id` y `message` no nulos (`"Producto creado en estado draft/inactivo/no visible"`).
- Muestra (4): SKU `00016` (variant `1478`, product `a22441bf-…`), `064992107253` (`1497`), `10.123` (`1503`), `10.40ME-ECO` (`1504`).

## Validación productos creados (20/20 en estado seguro)

Todas las filas creadas cumplen:

- `company_id = d1000000-0000-0000-0000-000000000001`
- `review_status = 'draft'`, `is_active = false`, `is_visible = false`, `is_featured = false`
- `bsale_sync_enabled = true`, `bsale_sync_status = 'pending'`, `bsale_last_checked_at IS NULL`
- `category_id`, `brand_id`, `short_description`, `description`, `seo_title`, `seo_description` = NULL
- Sin `product_prices`, `product_stock` ni `product_images` asociados

Muestra (3): SKU `00016` (SAFARI PEZ HENO CONEJO-CUYE), `66200` (PELUCHE DE GATO MOUNSTRUOS SURTIDOS), `74528` (PELUCHE PEZ REAL PEQUEÑO) — todos draft/inactivos/no visibles.

Verificación de estado inseguro: **0 filas** fuera del estado seguro sobre los 20 product_id de apply_items.

## No exposición pública

- Catálogo público (`public.web_b2b_get_public_catalog_products` para MYM): **3 productos visibles** — los preexistentes; los 20 nuevos NO aparecen.
- Los 20 nuevos quedan draft/inactivos/no visibles; invisibles al público y sin precio/stock.

## DEMO/TEST intactos

- `DEMO-001`, `DEMO-002`, `DEMO-003`, `TEST-UI-001`: **4/4 presentes, sin modificar**. No se realizó limpieza (decisión 6D.4D-B: mantenerlos intactos; no mezclar con el primer apply).

## Revisión visual admin

- App levantada en `http://localhost:3001` (dev server, PID 13210): `/` 200, `/catalogo` 200, `/admin/productos` 307 (redirige a login, requiere auth).
- Revisión visual en `http://localhost:3001/admin/productos` queda a cargo del usuario en navegador: deben verse 24 productos totales (20 nuevos como borrador, inactivos/no publicados, sin imagen, sin precio, sin stock) y el catálogo público sin los nuevos.
- No se creó/edió nada desde la UI; no se cambiaron estados.

## Riesgos / Remanentes

- Los 20 productos aún **sin categoría** y **sin marca**.
- Los 20 productos aún **sin imágenes** (fase posterior separada; imágenes desde web actual quedan pendientes).
- Los 20 productos **no visibles** hasta completar presentación web y decisión de publicación.
- Precios y stock pendientes de la sincronización real Bsale (fase posterior).
