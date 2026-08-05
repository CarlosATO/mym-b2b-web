# Reporte Diseno RPC Privada Precios y Stock (Fase 6D.9B)

## Objetivo

Disenar y validar una RPC privada/autenticada para entregar precio y disponibilidad resumida a clientes B2B aprobados, separada de las RPCs publicas de catalogo y detalle.

Esta fase no inserta precios, no inserta stock, no modifica productos, no cambia frontend, no llama Bsale y no expone precio/stock publicamente.

## Regla Base Confirmada

| Actor | Precio | Stock |
|-------|--------|-------|
| Visitante publico | No recibe precio | No recibe stock exacto; ve mensaje bloqueado |
| Cliente logeado no aprobado | No recibe precio | No recibe stock exacto; ve mensaje de cuenta pendiente/no aprobada |
| Cliente aprobado | Recibe precio | Recibe disponibilidad resumida; no recibe stock exacto por defecto |

## Precheck

Estado local previo:

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

El publico no recibe precio ni stock en las wrappers actuales:

- `public.web_b2b_get_public_catalog_products`
- `public.web_b2b_get_public_product_by_slug`
- `public.web_b2b_get_public_catalog_products_paginated`

Las columnas retornadas son de presentacion publica: id, nombre, slug, descripciones, destacado, marca, categoria, imagen y, en la RPC paginada, `total_count`. No retornan precio, stock ni `bsale_variant_id`.

## Helpers Auditados

Helper principal:

```sql
web_b2b.customer_can_view_prices_for_company(target_company_id uuid)
```

Condicion real:

- `auth.uid()` debe existir.
- Debe haber registro en `web_b2b.customer_access`.
- `company_id = target_company_id`.
- `status = 'approved'`.
- `can_view_prices = true`.

Helper complementario:

```sql
web_b2b.is_approved_customer_for_company(target_company_id uuid)
```

Condicion real:

- `auth.uid()` debe existir.
- Debe haber registro en `web_b2b.customer_access`.
- `company_id = target_company_id`.
- `status = 'approved'`.

Diferencia importante:

- `is_approved_customer_for_company` valida aprobacion general.
- `customer_can_view_prices_for_company` valida aprobacion y permiso explicito para ver precios.

## Contrato RPC Propuesto

Migracion candidata:

```text
supabase/migrations/20260805140000_web_b2b_customer_product_commercial_state.sql
```

RPC:

```sql
public.web_b2b_customer_get_product_commercial_state(
  p_company_id uuid,
  p_product_id uuid
)
returns jsonb
```

Permisos:

- `REVOKE` a `public`.
- `REVOKE` a `anon`.
- `GRANT EXECUTE` solo a `authenticated`.

Seguridad interna:

- Usa `SECURITY DEFINER`.
- Usa `SET search_path = ''`.
- Valida `auth.uid()`.
- Valida producto publicado: `company_id`, `id`, `is_active=true`, `is_visible=true`, `review_status='published'`.
- Valida permiso con `web_b2b.customer_can_view_prices_for_company(p_company_id)`.
- No devuelve `product_stock.quantity`.
- No modifica tablas.

Respuesta sin sesion:

```json
{
  "access_status": "login_required",
  "can_view_price": false,
  "price": null,
  "currency": null,
  "availability_status": null,
  "can_purchase": false,
  "reason": "login_required"
}
```

Respuesta cliente autenticado no aprobado:

```json
{
  "access_status": "not_approved",
  "can_view_price": false,
  "price": null,
  "currency": null,
  "availability_status": null,
  "can_purchase": false,
  "reason": "customer_not_approved"
}
```

Respuesta producto no disponible/publicado:

```json
{
  "access_status": "not_available",
  "can_view_price": false,
  "price": null,
  "currency": null,
  "availability_status": null,
  "can_purchase": false,
  "reason": "product_not_available"
}
```

Respuesta cliente aprobado:

```json
{
  "access_status": "approved",
  "can_view_price": true,
  "price": 12345.00,
  "currency": "CLP",
  "availability_status": "available",
  "can_purchase": true,
  "reason": null,
  "price_updated_at": "...",
  "stock_updated_at": "..."
}
```

## Disponibilidad Resumida

Regla propuesta en la RPC:

| Estado interno | Respuesta cliente |
|----------------|-------------------|
| Sin fila `product_stock` | `consult` |
| `status = out_of_stock` | `out_of_stock` |
| `status = low_stock` | `low_stock` |
| `quantity <= 0` | `out_of_stock` |
| `status = in_stock` y cantidad positiva | `available` |
| Otro caso | `consult` |

La RPC nunca devuelve `quantity`.

Regla de compra:

- Sin precio: `can_purchase=false`, `reason='missing_price'`.
- Sin stock o stock consultable: `can_purchase=false`, `reason='missing_stock'`.
- Sin stock disponible: `can_purchase=false`, `reason='out_of_stock'`.
- Precio y disponibilidad valida: `can_purchase=true`.

## Resultado BEGIN/ROLLBACK

Prueba ejecutada contra Supabase real con migracion candidata envuelta en transaccion:

```text
BEGIN;
-- aplicar migracion candidata
-- validar funcion, permisos y comportamiento sin auth.uid()
ROLLBACK;
```

Resultado de aserciones:

| Validacion | Resultado |
|------------|-----------|
| La funcion compila dentro de la transaccion | OK |
| `anon` no tiene EXECUTE | OK |
| `authenticated` tiene EXECUTE | OK |
| Llamada sin `auth.uid()` devuelve `login_required` | OK |
| Respuesta no expone `quantity` | OK |
| `product_prices` sigue 0 dentro de prueba | OK |
| `product_stock` sigue 0 dentro de prueba | OK |
| Funcion no existe despues de `ROLLBACK` | OK |

Conteos despues del rollback:

| Metrica | Valor |
|---------|------:|
| `web_b2b.products` | 74 |
| `product_prices` | 0 |
| `product_stock` | 0 |
| `product_images` | 13 |
| Storage `product-images` | 9 |
| Catalogo publico wrapper actual | 4 |

Limitacion de prueba:

- Como `product_prices=0` y `product_stock=0`, todavia no se valida una respuesta con precio real ni disponibilidad real.
- No se simulo un cliente aprobado con datos temporales para evitar insertar registros de prueba en `customer_access`, `product_prices` o `product_stock`.

## Decision Tecnica

La RPC por `product_id` es suficiente para la primera integracion porque las RPCs publicas ya devuelven `id` del producto. Una variante por slug podria agregarse despues, pero no es necesaria para el MVP si la UI obtiene primero el producto publico.

La RPC privada no reemplaza las RPCs publicas. Se consume de forma complementaria solo desde UI autenticada.

## Siguientes Fases Recomendadas

1. 6D.9C: Aplicar la migracion RPC privada.
   - Solo estructura.
   - Sin insertar precio/stock.
   - Validar grants y que la RPC exista persistida.

2. 6D.9D: Cargar precio/stock piloto para SKU `100909`.
   - Fuente Bsale/controlada.
   - Insert controlado solo para producto piloto.
   - Sin publicar productos adicionales.

3. 6D.9E: Adaptar UI de cliente aprobado.
   - Visitante: mensaje bloqueado.
   - Cliente no aprobado: mensaje de cuenta pendiente/no aprobada.
   - Cliente aprobado: precio y disponibilidad resumida.

## Confirmaciones de Seguridad

- No se insertaron precios.
- No se inserto stock.
- No se modificaron productos.
- No se publicaron productos adicionales.
- No se modifico frontend.
- No se modificaron RPCs publicas.
- No se modificaron policies RLS persistentes.
- No se llamo Bsale.
- No se llamo RPC apply.
- No se uso `db push`, `db pull` ni `migration repair`.
- No se modificaron imagenes.
- No se modifico Storage.
- No se toco WordPress/WooCommerce/cPanel.
- Sin commit.
- Sin push.
