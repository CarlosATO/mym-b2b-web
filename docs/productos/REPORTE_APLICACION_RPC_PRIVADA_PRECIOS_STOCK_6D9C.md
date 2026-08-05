# Reporte Aplicacion RPC Privada Precios y Stock (Fase 6D.9C)

## Objetivo

Aplicar en Supabase real la RPC privada/autenticada para entregar precio y disponibilidad resumida a clientes B2B aprobados, sin insertar precios/stock reales y sin modificar frontend.

## Regla Comercial

| Actor | Resultado esperado |
|-------|--------------------|
| Visitante publico | No recibe precio ni stock exacto; ve mensaje bloqueado en UI publica |
| Cliente logeado no aprobado | No recibe precio ni stock exacto; ve mensaje de cuenta pendiente/no aprobada |
| Cliente aprobado | Recibe precio y disponibilidad resumida; no recibe stock exacto por defecto |

## Estado Previo

Precheck local:

```text
?? supabase/.temp/
```

Conteos antes de aplicar:

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
| RPC privada existente antes | No |

## Migracion Aplicada

Archivo aplicado:

```text
supabase/migrations/20260805140000_web_b2b_customer_product_commercial_state.sql
```

Comando usado:

```text
npx supabase db query --linked --file supabase/migrations/20260805140000_web_b2b_customer_product_commercial_state.sql
```

Resultado:

- Aplicacion OK.
- No se uso `db push`.
- No se uso `db pull`.
- No se uso `migration repair`.
- No se aplicaron otras migraciones.

## RPC Aplicada

```sql
public.web_b2b_customer_get_product_commercial_state(
  p_company_id uuid,
  p_product_id uuid
)
returns jsonb
```

Validacion estructural:

| Campo | Resultado |
|-------|-----------|
| Funcion existe | OK |
| Schema | `public` |
| Argumentos | `p_company_id uuid, p_product_id uuid` |
| Retorno | `jsonb` |
| `SECURITY DEFINER` | OK |
| `search_path` | `""` |

Permisos:

| Rol | EXECUTE |
|-----|---------|
| `public` | No |
| `anon` | No |
| `authenticated` | Si |

ACL real:

```text
{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}
```

## Validacion de Comportamiento

Llamada sin `auth.uid()`:

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

Llamada con `auth.uid()` simulado sin registro aprobado:

```json
{
  "access_status": "not_approved",
  "availability_status": null,
  "can_purchase": false,
  "can_view_price": false,
  "currency": null,
  "price": null,
  "reason": "customer_not_approved"
}
```

Validaciones:

- No devuelve `quantity`.
- No devuelve precio a visitante/sin sesion.
- No devuelve precio a usuario autenticado no aprobado.
- Con `product_prices=0` no inventa precio.
- `can_purchase=false` sin precio/stock.
- No rompe catalogo publico.
- SKU `100909` sigue visible publicamente, sin precio/stock publico.

Limitacion:

- Todavia no se valido respuesta de cliente aprobado con precio real porque `product_prices=0` y `product_stock=0`.
- Esa prueba queda para 6D.9D, despues de una carga piloto controlada de precio/stock.

## RPCs Publicas

No se modificaron las RPCs publicas:

- `public.web_b2b_get_public_catalog_products`.
- `public.web_b2b_get_public_product_by_slug`.
- `public.web_b2b_get_public_catalog_products_paginated`.

Siguen sin retornar precio, stock ni `bsale_variant_id`.

## Conteos Posteriores

| Metrica | Antes | Despues |
|---------|------:|--------:|
| `web_b2b.products` | 74 | 74 |
| Productos Bsale reales | 70 | 70 |
| Productos Bsale publicados/expuestos | 1 | 1 |
| `product_prices` | 0 | 0 |
| `product_stock` | 0 | 0 |
| `product_images` | 13 | 13 |
| Storage `product-images` | 9 | 9 |
| Catalogo publico wrapper actual | 4 | 4 |

## Siguiente Fase

6D.9D: Carga piloto controlada de precio/stock para SKU `100909` desde fuente Bsale/controlada.

Requisitos sugeridos:

- Cargar solo SKU `100909`.
- Mantener sin publicacion adicional.
- No exponer stock exacto.
- Validar respuesta de la RPC como cliente aprobado.
- Validar que visitante y cliente no aprobado siguen sin precio.

## Confirmaciones de Seguridad

- No se insertaron precios.
- No se inserto stock.
- No se modificaron productos.
- No se publicaron productos adicionales.
- No se modifico frontend.
- No se llamo Bsale.
- No se llamo RPC apply.
- No se uso `db push`, `db pull` ni `migration repair`.
- No se subieron/importaron imagenes.
- No se modifico Storage.
- No se toco WordPress/WooCommerce/cPanel.
- Sin commit.
- Sin push.
