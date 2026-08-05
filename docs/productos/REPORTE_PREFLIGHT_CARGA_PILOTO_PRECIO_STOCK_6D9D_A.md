# Reporte Preflight Carga Piloto Precio/Stock (Fase 6D.9D-A)

## Objetivo

Auditar fuente oficial/local de precio y stock para el producto piloto SKU `100909` y preparar una propuesta de carga piloto, sin insertar ni modificar datos.

Esta fase no inserta precio, no inserta stock, no modifica productos, no modifica frontend, no llama Bsale, no llama RPC apply y no publica productos adicionales.

## Estado Actual

Precheck local:

```text
?? supabase/.temp/
```

Conteos validados con SELECTs de solo lectura:

| Metrica | Valor |
|---------|------:|
| `web_b2b.products` | 74 |
| Productos Bsale reales | 70 |
| Productos Bsale publicados/expuestos | 1 |
| Unico Bsale publico | SKU `100909` |
| `product_prices` | 0 |
| `product_stock` | 0 |
| `product_images` | 13 |
| Storage `product-images` | 9 |
| Catalogo publico wrapper actual | 4 |
| RPC privada comercial | Existe |

La RPC privada aplicada en 6D.9C sigue disponible:

```sql
public.web_b2b_customer_get_product_commercial_state(p_company_id uuid, p_product_id uuid)
returns jsonb
```

## Mapeo SKU 100909

Producto Web B2B:

| Campo | Valor |
|-------|-------|
| SKU | `100909` |
| product_id | `160c93e0-a76a-43d1-bd6d-014ff2465ebd` |
| company_id | `d1000000-0000-0000-0000-000000000001` |
| Nombre web | BRIT CARE Cat Grain Free Senior Weight Control 2 kg |
| Slug | `brit-care-cat-grain-free-senior-weight-control-2kg` |
| `bsale_variant_id` | `1494` |
| `bsale_sync_enabled` | `true` |
| `bsale_sync_status` | `pending` |
| `bsale_last_checked_at` | `null` |
| Estado | `published` / activo / visible / no destacado |
| Marca | BRIT CARE |
| Categoria | Alimento seco |
| `product_prices` asociados | 0 |
| `product_stock` asociados | 0 |

Nota: `web_b2b.products` no tiene una columna generica `source`; el origen operacional queda representado por el vinculo `bsale_variant_id`.

Variante Bsale local en `integraciones.bsale_variants`:

| Campo | Valor |
|-------|-------|
| UUID interno | `96f2d4bf-beb6-40c0-930b-7f5b9d296d95` |
| `bsale_id` | `1494` |
| `bsale_product_id` | `1072` |
| `code` | `100909` |
| `description` | `2KG` |
| `bar_code` | `8595602540945` |
| `state` | `1` |
| `unlimited_stock` | `false` |
| `allow_negative_stock` | `false` |
| `synced_at` | `2026-07-03T16:59:16.987+00:00` |

Producto Bsale local en `integraciones.bsale_products`:

| Campo | Valor |
|-------|-------|
| UUID interno | `a2a40934-5e6e-4638-8d6b-385692696c9e` |
| `bsale_id` | `1072` |
| Nombre Bsale | BRIT CARE CAT GR. FREE SENIOR WEIGHT CONTROL |
| `stock_control` | `true` |
| `state` | `1` |
| `product_type_id` | `18` |
| `synced_at` | `2026-07-03T16:59:05.193+00:00` |

## Fuente Local de Precio

Tablas/locales auditadas:

- `web_b2b.product_prices`: existe, pero esta vacia.
- `integraciones.bsale_variants`: contiene metadata de variante; el `raw_json` referencia endpoint Bsale de precios, pero no contiene precio persistido.
- `integraciones.bsale_variant_costs`: contiene costo, no precio de venta.
- `integraciones.bsale_clients`: contiene `price_list_id` y `price_list_name` por cliente, no detalle de precio por variante.
- `integraciones.bsale_document_details` y vistas de pedidos/ventas: contienen valores historicos de documentos, no precio oficial vigente para publicar en B2B.

Hallazgo relevante:

```text
integraciones.bsale_variants.raw_json.prices.href =
https://api.bsale.io/v1/price_lists//details.json?variantid=1494
```

No se llamo Bsale real en esta fase.

Costo local encontrado:

| Tabla | Valor |
|-------|------:|
| `integraciones.bsale_variant_costs.average_cost` | 0 |
| `integraciones.bsale_variant_costs.total_cost` | 0 |

Ese dato no es precio de venta y no debe usarse como precio B2B.

Resultado:

| Campo | Valor |
|-------|-------|
| Fuente local confiable de precio oficial | No encontrada |
| `price_candidate` | `null` |
| Moneda | Pendiente |
| Neto/bruto/IVA | Pendiente |
| Grado de confianza | Bloqueado |

Bloqueo:

No existe en la base local una tabla espejo clara de lista de precios Bsale con precio vigente por `variant_id=1494`. Antes de insertar en `web_b2b.product_prices`, Carlos debe aprobar una fuente concreta: endpoint Bsale de lista de precios, export controlado o tabla espejo existente documentada.

## Fuente Local de Stock

Tabla local auditada:

```text
integraciones.bsale_stock_current
```

Columnas relevantes:

- `variant_id`
- `variant_code`
- `quantity`
- `quantity_reserved`
- `quantity_available`
- `office_id`
- `synced_at`
- `updated_at`

Resultado para SKU `100909` / variant `1494`:

| Metrica | Valor |
|---------|------:|
| Filas encontradas | 0 |
| `quantity_total` | `null` |
| `quantity_reserved_total` | `null` |
| `quantity_available_total` | `null` |
| `max_updated_at` | `null` |

Resultado:

| Campo | Valor |
|-------|-------|
| Fuente local confiable de stock actual | Tabla existe, pero sin fila para el SKU piloto |
| `stock_candidate` | `null` |
| Tipo | Sin dato; no consolidado ni por bodega |
| `availability_status` propuesto | `consult` |
| Grado de confianza | Bloqueado para cantidad; seguro como `consult` |

## Validacion RPC con Tablas Vacias

Llamada sin sesion:

```json
{
  "access_status": "login_required",
  "availability_status": null,
  "can_purchase": false,
  "can_view_price": false,
  "currency": null,
  "price": null,
  "reason": "login_required"
}
```

Validaciones:

- RPC privada existe.
- Sin sesion no entrega precio.
- No devuelve `quantity`.
- Con `product_prices=0` y `product_stock=0`, no inventa datos.
- Catalogo publico sigue en 4 visibles.
- SKU `100909` sigue siendo el unico Bsale publico.

## Propuesta de Carga Piloto

No ejecutar todavia.

Para `web_b2b.product_prices`, solo cuando Carlos apruebe precio y regla IVA:

| Campo | Valor propuesto |
|-------|-----------------|
| `product_id` | `160c93e0-a76a-43d1-bd6d-014ff2465ebd` |
| `company_id` | `d1000000-0000-0000-0000-000000000001` |
| `price` | Pendiente; no inventar |
| `currency` | `CLP` |
| `source` | `bsale` |
| `updated_at` | `now()` al aplicar |

Para `web_b2b.product_stock`, solo cuando Carlos apruebe fuente/regla:

| Campo | Valor propuesto |
|-------|-----------------|
| `product_id` | `160c93e0-a76a-43d1-bd6d-014ff2465ebd` |
| `company_id` | `d1000000-0000-0000-0000-000000000001` |
| `quantity` | Pendiente; no inventar |
| `status` | `consult` si no hay stock confiable; `out_of_stock` si `quantity <= 0`; `in_stock` si `quantity > 0` |
| `source` | `bsale` |
| `updated_at` | `now()` al aplicar |

Importante:

- Aunque `product_stock` guarde `quantity` internamente, la RPC privada no devuelve cantidad exacta.
- Sin precio confiable, `can_purchase` debe seguir `false`.

## Decisiones Requeridas de Carlos

1. Confirmar fuente oficial para precio piloto: endpoint Bsale, export controlado o tabla espejo distinta.
2. Confirmar si precio B2B se mostrara con IVA o neto.
3. Confirmar si existe lista de precios especifica para clientes B2B.
4. Confirmar fuente oficial para stock piloto: `bsale_stock_current`, endpoint Bsale, ERP interno o carga controlada.
5. Confirmar si stock interno sera consolidado o por bodega.
6. Confirmar que cliente aprobado vera solo disponibilidad resumida, no cantidad exacta.
7. Confirmar que si hay precio pero no stock, se mostrara precio con disponibilidad `consultar` y sin compra automatica.
8. Confirmar que si hay stock pero no precio, no se habilitara compra y se mostrara precio pendiente.
9. Confirmar que 6D.9D-B cargara solo SKU `100909` como piloto.

## Recomendacion Siguiente

6D.9D-B debe ejecutarse solo si Carlos aprueba valores concretos de precio/stock y regla IVA/stock.

Recomendacion operativa:

- No cargar precio desde costo.
- No cargar precio desde documentos historicos.
- No cargar stock inventado.
- Si no hay stock confiable, cargar solo precio aprobado y dejar stock como `consult`, o postergar ambos hasta tener fuente operacional clara.

## Confirmaciones de Seguridad

- No se ejecuto SQL de modificacion.
- No se uso `db push`, `db pull` ni `migration repair`.
- No se llamo Bsale real.
- No se llamo RPC apply.
- No se modificaron productos.
- No se publicaron productos.
- No se insertaron precios.
- No se inserto stock.
- No se modificaron RPCs.
- No se modifico frontend.
- No se subieron/importaron imagenes.
- No se modifico Storage.
- No se toco WordPress/WooCommerce/cPanel.
- Sin commit.
- Sin push.
