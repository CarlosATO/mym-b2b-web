# Reporte Diseno Apply Batch Bsale (Fase 6D.7B)

## Objetivo

Disenar y validar un mecanismo seguro para aplicar lotes Bsale completos sin romper auditoria ni marcar como aplicado un run parcialmente procesado.

Esta fase no aplica cambios reales, no crea productos persistentes, no modifica productos, no publica productos, no crea precios, no crea stock, no importa imagenes y no modifica Storage.

## Diagnostico del Apply Actual

RPC auditada:

```text
public.web_b2b_system_apply_bsale_product_import_run(
  p_target_company_id uuid,
  p_import_run_id uuid,
  p_max_items integer default 20
)
```

Hallazgos:

- `p_max_items` se normaliza con `COALESCE(p_max_items, 20)`.
- La RPC rechaza `max_items < 1` o `max_items > 20`.
- La tabla `web_b2b.bsale_product_apply_runs` tambien tiene constraint `chk_apply_run_max_items CHECK (max_items BETWEEN 1 AND 20)`.
- La seleccion toma items `create`, `pending`, sin `conflict_type`, con SKU, `bsale_variant_id`, `source_name` y `payload->>'dry_run' = 'true'`.
- Inserta productos solo en `web_b2b.products`.
- Cada producto queda en estado seguro: `draft`, `is_active=false`, `is_visible=false`, `is_featured=false`, `bsale_sync_status='pending'`.
- No inserta precios, stock ni imagenes.
- Registra cabecera en `web_b2b.bsale_product_apply_runs` y detalle en `web_b2b.bsale_product_apply_items`.
- La idempotencia se controla con `UNIQUE(company_id, import_run_id)` en `apply_runs` y `UNIQUE(company_id, import_item_id)` en `apply_items`.
- No actualiza `bsale_product_import_runs` ni `bsale_product_import_items`.

Problema detectado en 6D.7A:

- El run recomendado `734968e6-c1f2-44bd-8812-8d4b32576d58` contiene 50 candidatos `create`.
- Si se aplicara con la RPC actual y `max_items=20`, se crearian solo 20 productos, pero el run quedaria marcado como aplicado en `apply_runs`.
- Por la idempotencia, los 30 candidatos restantes no podrian aplicarse despues desde el mismo `import_run_id`.

## Alternativas Evaluadas

### Alternativa A: runs exactos de 20

Crear dry-runs/subruns aplicables de exactamente 20 candidatos y usar la RPC actual.

Ventajas:

- No requiere cambiar la RPC actual.
- Mantiene el limite conservador original.
- Menor superficie de cambio.

Riesgos/costos:

- Requiere generar subruns limpios desde los candidatos existentes.
- Aumenta la cantidad de runs para lotes grandes.
- Puede duplicar logica de seleccion/segmentacion fuera de la base.

### Alternativa B: nueva RPC v2 batch completo

Crear `public.web_b2b_system_apply_bsale_product_import_run_v2` para aplicar un run completo de hasta 100 candidatos.

Ventajas:

- Respeta el run de auditoria como unidad completa.
- Evita aplicar parcialmente un run por error de limite.
- Mantiene trazabilidad en las tablas `apply_runs` y `apply_items`.
- No elimina ni rompe la RPC anterior.

Riesgos/costos:

- Requiere migracion candidata.
- Requiere ampliar el constraint de `apply_runs.max_items` de 20 a 100.
- Debe quedar muy claro que v2 aplica runs completos o rechaza antes de crear productos.

## Decision Recomendada

Recomendada la alternativa B para 6D.7C, con una condicion estricta: v2 debe aplicar el run completo o abortar antes de crear productos.

La RPC v1 queda intacta para casos conservadores de 20 items. La v2 queda separada para batch controlado.

## Migracion Candidata

Archivo creado:

```text
supabase/migrations/20260805130000_web_b2b_bsale_product_apply_batch_v2.sql
```

Resumen:

- No elimina la funcion anterior.
- Amplia `chk_apply_run_max_items` a `BETWEEN 1 AND 100`.
- Crea `public.web_b2b_system_apply_bsale_product_import_run_v2`.
- Firma:

```sql
public.web_b2b_system_apply_bsale_product_import_run_v2(
  p_target_company_id uuid,
  p_import_run_id uuid,
  p_max_items integer DEFAULT NULL
) returns jsonb
```

Validaciones principales:

- `target_company_id` e `import_run_id` requeridos.
- Run debe existir, pertenecer a la compania, ser `dry_run` y estar `success`.
- Run no debe existir previamente en `web_b2b.bsale_product_apply_runs`.
- `max_items` entre 1 y 100; si es `NULL`, usa 100.
- Cuenta candidatos elegibles `create/pending`.
- Si candidatos elegibles es 0, rechaza.
- Si candidatos elegibles supera `max_items`, rechaza antes de crear apply_run/productos.
- Prevalida duplicados por SKU y `bsale_variant_id` contra `web_b2b.products`.

Comportamiento transaccional:

- Registra `apply_run` solo despues de validar que el run completo es viable.
- Crea todos los candidatos elegibles.
- Inserta `apply_items` para cada producto creado.
- Si el numero creado no coincide con los candidatos elegibles, lanza excepcion y la transaccion completa hace rollback.
- Devuelve envelope JSON con `apply_run_id`, `import_run_id`, `status`, contadores y flags de seguridad.

Estado de productos creados por v2:

- `review_status = draft`
- `is_active = false`
- `is_visible = false`
- `is_featured = false`
- `bsale_sync_status = pending`
- Sin precio
- Sin stock
- Sin imagen
- Sin publicacion

Permisos:

- `REVOKE` a `public`, `anon` y `authenticated`.
- `GRANT EXECUTE` solo a `service_role`.
- No se expone `service_role` en frontend.

## Prueba BEGIN/ROLLBACK

Run usado:

```text
734968e6-c1f2-44bd-8812-8d4b32576d58
```

Prueba ejecutada dentro de transaccion:

```sql
BEGIN;
-- aplicar migracion candidata
select public.web_b2b_system_apply_bsale_product_import_run_v2(
  'd1000000-0000-0000-0000-000000000001'::uuid,
  '734968e6-c1f2-44bd-8812-8d4b32576d58'::uuid,
  50
);
-- validar conteos
ROLLBACK;
```

Resultado de la llamada v2 dentro de la transaccion:

| Campo | Valor |
|-------|-------|
| status | `success` |
| total_candidates | 50 |
| total_created | 50 |
| total_skipped | 0 |
| total_conflicts | 0 |
| total_errors | 0 |
| safe_state | `draft/inactive/not_visible/not_featured` |
| no_prices | `true` |
| no_stock | `true` |
| no_images | `true` |
| no_publication | `true` |

Conteos:

| Momento | products | Bsale products | draft | active | visible | featured |
|---------|---------:|---------------:|------:|-------:|--------:|---------:|
| Antes dentro de TX | 24 | 20 | - | 3 | 3 | 2 |
| Durante TX | 74 | 70 | 74 | 3 | 3 | 2 |
| Despues del ROLLBACK | 24 | - | - | - | - | - |

Validacion de nuevos productos dentro de TX:

| Metrica | Valor |
|---------|------:|
| Nuevos productos temporales | 50 |
| Nuevos productos en estado seguro | 50 |
| Nuevos productos expuestos publicamente | 0 |

Tablas relacionadas:

| Momento | product_prices | product_stock | product_images | Storage product-images |
|---------|---------------:|--------------:|---------------:|-----------------------:|
| Durante TX | 0 | 0 | 9 | 5 |
| Despues del ROLLBACK | 0 | 0 | 9 | 5 |

Verificacion post-rollback:

- `web_b2b.products` volvio a 24.
- `product_prices` sigue 0.
- `product_stock` sigue 0.
- `product_images` sigue 9.
- Bucket `product-images` sigue 5 objetos.
- La funcion v2 no quedo instalada persistentemente (`v2_function_count = 0`).

## Riesgos y Condiciones para 6D.7C

- Antes de apply real debe aprobarse aplicar la migracion candidata de forma persistente.
- El apply real debe usar un run limpio con candidatos `create` completos.
- No se debe usar v1 sobre un run de 50 con `max_items=20`.
- No se deben importar imagenes en el mismo paso del apply de productos.
- La verificacion posterior a 6D.7C debe confirmar productos 24 -> 74, precios/stock 0, imagenes sin cambio y catalogo publico sin nuevos productos.

## Alcance Ejecutado

- Se leyeron migraciones, docs y RPC actual.
- Se creo migracion candidata.
- Se probo con `BEGIN; ... ROLLBACK`.
- No se ejecuto apply real persistente.
- No se llamo Bsale.
- No se crearon productos persistentes.
- No se modificaron productos persistentes.
- No se publicaron productos.
- No se crearon precios ni stock.
- No se importaron imagenes.
- No se modifico Storage.
- No se toco WordPress/WooCommerce/cPanel.
