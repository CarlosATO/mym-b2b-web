# Reporte Preflight Importacion Bsale Batch (Fase 6D.7A)

## Objetivo

Preparar una importacion ampliada de productos Bsale mediante batch controlado, sin aplicar todavia. La fase ejecuta auditoria dry-run, valida estado previo y deja una propuesta para aprobacion de Carlos antes de cualquier creacion real.

No se ejecuta apply, no se crean productos, no se modifican productos, no se publican productos, no se importan imagenes y no se toca Storage.

## Implementacion Existente Auditada

- Script correcto de dry-run Bsale: `scripts/bsale-product-import/dry-run-bsale-segmented-audit.ts`.
- Lectura Bsale: `src/lib/bsale-product-import/bsale-readonly.ts`, usando GET a `/variants.json?limit={limit}&offset={offset}&expand=product`.
- Planner/deduplicacion: `src/lib/bsale-product-import/planner.ts`.
- Persistencia de auditoria: `src/lib/bsale-product-import/import-audit-writer.ts`.
- RPC de auditoria dry-run: `public.web_b2b_system_create_bsale_product_import_audit`.
- Tablas de auditoria: `web_b2b.bsale_product_import_runs` y `web_b2b.bsale_product_import_items`.
- RPC apply controlado existente: `public.web_b2b_system_apply_bsale_product_import_run`.
- Tablas apply: `web_b2b.bsale_product_apply_runs` y `web_b2b.bsale_product_apply_items`.

Reglas actuales de deduplicacion:

- Conflicto si falta SKU.
- Conflicto si falta nombre.
- Conflicto si hay SKU duplicado dentro del payload.
- Conflicto si hay `bsale_variant_id` duplicado dentro del payload.
- Conflicto si SKU y `bsale_variant_id` apuntan a productos web distintos.
- Exclusion por producto ya existente, usando match por `bsale_variant_id` o por SKU.
- Producto nuevo inactivo en Bsale se omite en la fase inicial.

Campos que el apply inserta en `web_b2b.products`:

- `company_id`, `sku`, `bsale_variant_id`, `name`, `slug`.
- `short_description = NULL`, `description = NULL`.
- `category_id = NULL`, `brand_id = NULL`.
- `is_active = false`, `is_visible = false`, `is_featured = false`.
- `review_status = draft`, `order_index = 0`.
- `seo_title = NULL`, `seo_description = NULL`.
- `bsale_sync_enabled = true`, `bsale_sync_status = pending`, `bsale_last_checked_at = NULL`.

No inserta precios, stock ni imagenes.

## Estado Previo de Base

Validado con SELECTs de solo lectura antes y despues del dry-run:

| Metrica | Valor |
|---------|------:|
| Total productos `web_b2b.products` | 24 |
| Productos DEMO | 3 |
| Productos TEST | 1 |
| Productos Bsale reales (`bsale_variant_id` no null) | 20 |
| `review_status = draft` | 24 |
| `review_status = ready` | 0 |
| `review_status = published` | 0 |
| `is_active = true` | 3 |
| `is_visible = true` | 3 |
| `is_featured = true` | 2 |
| Productos con imagen primaria en `product_images` | 8 |
| Registros `product_images` | 9 |
| Registros `product_prices` | 0 |
| Registros `product_stock` | 0 |
| Objetos en bucket `product-images` | 5 |

Ultimo apply real existente:

| apply_run_id | import_run_id | status | max_items | creados | conflictos | errores |
|--------------|---------------|--------|----------:|--------:|-----------:|--------:|
| `9a209048-b2fe-4ee4-af42-b5bf3901442c` | `22e1d487-36e6-4475-a0e0-a28d0305dbcc` | `success` | 20 | 20 | 0 | 0 |

## Dry-run 6D.7A Preparado

Comando base del flujo existente:

```bash
node scripts/bsale-product-import/dry-run-bsale-segmented-audit.ts
```

Por compatibilidad local, se ejecuto una copia temporal compilada del mismo script en `/private/tmp`, sin modificar archivos del proyecto.

El script leyo 100 variantes Bsale en dos segmentos de 50 y persistio 2 runs dry-run:

| run | import_run_id | total_seen | created | updated | skipped | conflicts | errors | status |
|-----|---------------|-----------:|--------:|--------:|--------:|----------:|-------:|--------|
| 1 | `ae2441fd-d7a3-4712-974a-ae7de634eb19` | 50 | 29 | 20 | 1 | 0 | 0 | `success` |
| 2 | `734968e6-c1f2-44bd-8812-8d4b32576d58` | 50 | 50 | 0 | 0 | 0 | 0 | `success` |

Resumen global:

- Total leidos desde Bsale: 100.
- Candidatos `create`: 79.
- Existentes para `update`: 20.
- Skipped: 1.
- Conflicts: 0.
- Errors: 0.
- Productos creados/modificados en esta fase: 0.

## Primeros 20 Candidatos del Run Recomendado

Run recomendado para apply posterior inicial: `734968e6-c1f2-44bd-8812-8d4b32576d58`, porque contiene 50/50 items `create` y no mezcla updates ni skipped.

| # | SKU | bsale_variant_id | Nombre | Accion prevista | Motivo |
|---:|-----|------------------|--------|-----------------|--------|
| 1 | `19482` | `1591` | COLLAR ISABELINO 12.5CM | `create` | New product to create |
| 2 | `101188` | `1556` | BRIT CARE LETS BITE SNACKS DUCK FILLETS 80GR | `create` | New product to create |
| 3 | `1G120000012` | `1588` | ISIS BANDEJA GATO 42CM GRIS | `create` | New product to create |
| 4 | `1881-L` | `1579` | WONDER DOG ARNES PECHO SPACE TRAVELL T.L | `create` | New product to create |
| 5 | `65148` | `1568` | BOTIN GAMUSA PARA PERROS ROSA/CAFE N2 | `create` | New product to create |
| 6 | `1NP0309000GR` | `1615` | CHALECO HOLLYVET DISENOS SURTIDOS GRANDE | `create` | New product to create |
| 7 | `1231035` | `1563` | ROYAL CANIN YOUNG MALE 3.5KG | `create` | New product to create |
| 8 | `5426150` | `1561` | ROYAL CANIN MEDIUM PUPPY 15KG | `create` | New product to create |
| 9 | `1IP100101015` | `1608` | INSTINCT PERRO SALMON 9KG | `create` | New product to create |
| 10 | `1IG100101013` | `1600` | INSTINCT PERRO PATO 9KG | `create` | New product to create |
| 11 | `10200019` | `1560` | ROYAL CANIN MEDIUM PUPPY 2.5KG | `create` | New product to create |
| 12 | `100596` | `1554` | BRIT PREMIUM BY NATURE JUNIOR SMALL 3KG | `create` | New product to create |
| 13 | `100524` | `1586` | BRIT CARE MINI LIGHT Y STERILISED 2KG | `create` | New product to create |
| 14 | `65147` | `1567` | BOTIN GAMUSA PARA PERROS ROSA/CAFE N1 | `create` | New product to create |
| 15 | `1006556` | `1557` | TRAPER REPELENTE AEROSOL PERRO Y GATO 440CC | `create` | New product to create |
| 16 | `1IP020860101` | `1606` | MR CHEF MAGIC SMOKY MINI 2.5 7UND | `create` | New product to create |
| 17 | `100901` | `1559` | BRIT CARE CAT GR. FREE KITTEN HEALTHY GROWTH Y DEVELOMENT 2KG | `create` | New product to create |
| 18 | `1G120000018` | `1594` | ISIS BANDEJA GATO 50CM GRIS | `create` | New product to create |
| 19 | `1NP061400012` | `1619` | BRAVECTO (20-40KG) 1000MG | `create` | New product to create |
| 20 | `19480` | `1587` | COLLAR ISABELINO 7.5CM | `create` | New product to create |

## Advertencias

- El dry-run de 100 items se persistio en 2 runs de 50 por limite actual de la RPC de auditoria (`p_items` maximo 50).
- El apply controlado actual acepta `p_max_items` entre 1 y 20.
- Aplicar un run con mas de 20 candidatos usando `p_max_items = 20` deja el run marcado como aplicado y no permite aplicar el resto del mismo run por la idempotencia `UNIQUE(company_id, import_run_id)`.
- Por lo anterior, NO se debe aplicar el run recomendado de 50 candidatos con `max_items = 20`.
- Antes de aplicar lotes reales se requiere una subfase posterior que disene o ajuste un mecanismo seguro para aplicar runs exactos de 20, soportar lotes mayores sin marcar indebidamente candidatos no procesados, o crear subruns aplicables completos. No se implementa ese cambio en 6D.7A.

## Condicion de Aprobacion para Apply Posterior

Sin ejecutar en esta fase.

El run mas limpio para usar como fuente de candidatos es `734968e6-c1f2-44bd-8812-8d4b32576d58`, porque contiene 50/50 items `create` y no mezcla updates ni skipped. Sin embargo, no debe aplicarse directamente con el mecanismo actual.

Llamada NO autorizada para ejecutar en este estado:

```sql
select public.web_b2b_system_apply_bsale_product_import_run(
  'd1000000-0000-0000-0000-000000000001'::uuid,
  '734968e6-c1f2-44bd-8812-8d4b32576d58'::uuid,
  20
);
```

Motivo: el apply actual procesaria solo 20 candidatos y marcaria completo el `import_run_id`, dejando 30 candidatos del mismo run sin posibilidad de apply posterior por idempotencia.

Resultado esperado cuando Carlos apruebe una subfase posterior con mecanismo seguro:

- Productos creados solo desde candidatos aprobados y procesables completos.
- Todos `review_status = draft`.
- Todos `is_active = false`.
- Todos `is_visible = false`.
- Todos `is_featured = false`.
- Todos `bsale_sync_status = pending`.
- Sin precio.
- Sin stock.
- Sin imagen.
- Sin exposicion publica.

Decision requerida antes de aplicar:

1. Autorizar una fase tecnica para generar runs exactos de 20 candidatos; o
2. Autorizar una fase tecnica para soportar lotes mayores sin marcar indebidamente candidatos no procesados; o
3. Autorizar una fase tecnica para crear subruns aplicables completos desde el dry-run limpio.

## Relacion con Imagenes

La importacion de imagenes por lote queda para despues del apply ampliado y del cruce contra el CSV WooCommerce ya descargado.

Reglas que se mantienen:

- No reemplazar imagenes existentes.
- Importar imagenes solo para matches confiables.
- Servir imagen final desde Supabase Storage `product-images`.
- No publicar productos automaticamente.

## Alcance Ejecutado

- Se consulto Bsale solo en modo lectura/dry-run.
- Se persistio auditoria dry-run.
- No se llamo RPC apply.
- No se crearon, modificaron, borraron ni publicaron productos.
- No se importaron ni subieron imagenes.
- No se modifico Storage.
- No se tocaron precios ni stock.
- No se toco WordPress/WooCommerce/cPanel.
- No se ejecuto SQL de modificacion directa.
