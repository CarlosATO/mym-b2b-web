# Reporte Preflight Precios y Stock B2B (Fase 6D.9A)

## Objetivo

Auditar el estado actual y disenar la integracion inicial de precios y stock para productos Bsale en la Web B2B, respetando la regla comercial confirmada por Carlos:

- Visitantes publicos pueden ver productos publicados, imagen, marca, categoria y descripcion.
- Visitantes publicos no ven precios ni stock exacto.
- Clientes registrados/aprobados podran ver precios y disponibilidad cuando exista la fase privada.
- No se insertan precios.
- No se inserta stock.
- No se publican productos adicionales.
- No se modifica Storage ni imagenes.

## Precheck

`git status --short` previo:

```text
?? supabase/.temp/
```

Solo aparece `supabase/.temp/` sin trackear; no forma parte de esta fase.

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
| Productos con imagen primaria | 12 |
| Catalogo publico via wrapper actual | 4 |
| Catalogo publico via RPC paginada estricta | 1 |

Producto piloto publico validado:

| Campo | Valor |
|-------|-------|
| SKU | `100909` |
| product_id | `160c93e0-a76a-43d1-bd6d-014ff2465ebd` |
| Nombre | BRIT CARE Cat Grain Free Senior Weight Control 2 kg |
| Slug | `brit-care-cat-grain-free-senior-weight-control-2kg` |
| Estado | `published` / activo / visible / no destacado |
| Marca | BRIT CARE |
| Categoria | Alimento seco |
| Imagen primaria | Supabase Storage `product-images` |
| `product_prices` del producto | 0 |
| `product_stock` del producto | 0 |
| `public_slug_count` | 1 |

Los SKUs `100583`, `100584`, `100588` y `101188` siguen `draft`, inactivos y no visibles.

## Modelo Actual `web_b2b.product_prices`

Columnas:

| Columna | Tipo | Null | Default | Nota |
|---------|------|------|---------|------|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `product_id` | `uuid` | no | - | FK a `web_b2b.products(id)` |
| `company_id` | `uuid` | no | - | Tenant |
| `price` | `numeric` | no | - | `numeric(12,2)` en migracion base |
| `currency` | `text` | no | `CLP` | Solo `CLP` |
| `source` | `text` | no | - | `bsale`, `manual` o `import` |
| `updated_at` | `timestamptz` | si | `now()` | Ultima actualizacion |

Constraints e indices:

- PK: `product_prices_pkey`.
- FK: `product_prices_product_id_fkey` con `ON DELETE CASCADE`.
- UNIQUE: `(product_id, company_id, source)`.
- CHECK: `currency = 'CLP'`.
- CHECK: `source IN ('bsale', 'manual', 'import')`.
- Indice: `idx_product_prices_product_id(product_id)`.

RLS y policies:

- RLS habilitado.
- `Approved customers can view prices`: SELECT si `web_b2b.customer_can_view_prices_for_company(company_id)`.
- `Admins can view all prices`: SELECT si `web_b2b.is_web_admin_for_company(company_id)`.
- No hay policy publica anonima.

Brechas del modelo:

- No existe soporte fisico actual para listas de precio.
- No existe `price_list_id`.
- No hay vigencia desde/hasta.
- No separa precio neto/bruto.
- No modela IVA/impuestos.
- Para MVP sirve como precio base proyectado desde Bsale, no como matriz comercial completa.

## Modelo Actual `web_b2b.product_stock`

Columnas:

| Columna | Tipo | Null | Default | Nota |
|---------|------|------|---------|------|
| `id` | `uuid` | no | `gen_random_uuid()` | PK |
| `product_id` | `uuid` | no | - | FK a `web_b2b.products(id)` |
| `company_id` | `uuid` | no | - | Tenant |
| `quantity` | `integer` | no | `0` | Stock exacto interno |
| `status` | `text` | no | - | Disponibilidad |
| `source` | `text` | no | - | `bsale`, `manual` o `import` |
| `updated_at` | `timestamptz` | si | `now()` | Ultima actualizacion |

Constraints e indices:

- PK: `product_stock_pkey`.
- FK: `product_stock_product_id_fkey` con `ON DELETE CASCADE`.
- UNIQUE: `(product_id, company_id, source)`.
- CHECK: `status IN ('in_stock', 'low_stock', 'out_of_stock', 'unknown')`.
- CHECK: `source IN ('bsale', 'manual', 'import')`.
- Indice: `idx_product_stock_product_id(product_id)`.

RLS y policies:

- RLS habilitado.
- `Admins can view all stock`: SELECT si `web_b2b.is_web_admin_for_company(company_id)`.
- No existe policy para clientes aprobados.
- No existe policy publica anonima.

Brechas del modelo:

- No hay `warehouse_id`.
- No distingue stock por bodega/sucursal.
- Guarda cantidad exacta, pero la regla comercial recomienda exponer solo disponibilidad resumida.
- Hoy no hay salida segura para cliente aprobado; requiere RPC privada que derive disponibilidad sin revelar cantidad si Carlos no aprueba stock exacto.

## Acceso Cliente Aprobado

`web_b2b.customer_access` existe y tiene:

- `user_id`.
- `company_id`.
- `customer_email`.
- `business_name`.
- `tax_id`.
- `bsale_client_id`.
- `status`: `pending`, `approved`, `rejected`.
- `can_view_prices`.
- `can_create_orders`.
- `approved_at`.
- `approved_by`.

Helpers auditados:

- `web_b2b.is_approved_customer_for_company(target_company_id)`: exige `auth.uid()`, `company_id` y `status='approved'`.
- `web_b2b.customer_can_view_prices_for_company(target_company_id)`: exige `auth.uid()`, `company_id`, `status='approved'` y `can_view_prices=true`.

Estado actual:

- Existe base suficiente para autorizar precios.
- Falta una RPC publica/autenticada de lectura privada para devolver precio y disponibilidad al cliente aprobado.
- Falta definir si `can_create_orders` sera requisito para compra futura o solo para pedido.

## Fuente de Precio y Stock

Hallazgo de codigo/documentacion:

- Bsale ya es la fuente oficial declarada para precios y stock.
- `src/lib/bsale/client.ts` contiene placeholders `fetchBsalePrices` y `fetchBsaleStock`, pero no hay sincronizacion real implementada.
- El importador de productos Bsale actual importa identidad de producto/variante y deja `bsale_sync_status='pending'`.
- Las fases de apply documentan explicitamente que no crean precios, stock ni imagenes.
- No se detectaron tablas espejo operativas de precios/stock Bsale en el repositorio.

Fuente recomendada de precio:

- Bsale como fuente operacional.
- `web_b2b.product_prices` como proyeccion segura para la web.
- `source='bsale'` para precio base MVP.

Fuente recomendada de stock:

- Bsale como fuente operacional.
- `web_b2b.product_stock` como proyeccion segura para la web.
- `source='bsale'` y `status` derivado desde `quantity`.

Frecuencia recomendada inicial:

- Precio: sync controlado programado y/o manual admin, con auditoria; no consulta Bsale por cada visita.
- Stock: sync mas frecuente que precios, tambien proyectado en Supabase; no consulta Bsale por cada visita publica.

## Exposicion Publica Actual

Frontend publico:

- `/catalogo` usa `src/lib/api/catalog.ts` -> `public.web_b2b_get_public_catalog_products`.
- `/productos/[slug]` usa `src/lib/api/catalog.ts` -> `public.web_b2b_get_public_product_by_slug`.

Wrappers/RPCs actuales:

- Las wrappers antiguas retornan `id`, `name`, `slug`, descripciones, `is_featured`, marca, categoria e imagen primaria.
- No retornan precio.
- No retornan stock.
- No retornan `bsale_variant_id`.
- Condicionan exposicion por `is_active=true` e `is_visible=true`; la version antigua no exige `review_status='published'`.
- Existe `public.web_b2b_get_public_catalog_products_paginated`, que si exige `review_status='published'`, `is_active=true` e `is_visible=true`, pero `/catalogo` aun no la usa.

UI publica:

- `ProductCard` muestra mensaje generico `Precio con cuenta`.
- La ficha publica muestra `Precio disponible para clientes aprobados`.
- Publicar un producto sin precio/stock no rompe la UI actual.
- Visitante publico no recibe precio ni stock exacto.

Validacion actual:

- Catalogo publico visible total por wrapper actual: 4 productos, compuesto por 3 DEMO + 1 Bsale piloto.
- Bsale publicado/expuesto total: 1.
- Unico Bsale publico: SKU `100909`.

## Diseno Recomendado

Arquitectura recomendada:

```text
Bsale / integracion operacional
-> sync controlado server-side
-> web_b2b.product_prices / web_b2b.product_stock
-> RPC autenticada para cliente aprobado
-> UI privada cliente logeado
```

Regla de visibilidad propuesta:

| Actor | Precio | Stock |
|-------|--------|-------|
| Visitante publico | No visible | No ve stock exacto |
| Cliente logeado no aprobado | No visible | No ve stock exacto |
| Cliente aprobado con `can_view_prices=true` | Visible | Disponibilidad resumida |
| Admin | Visible en panel interno futuro | Visible en panel interno futuro |

Recomendacion concreta:

- No exponer `product_stock.quantity` al cliente en MVP.
- Mostrar disponibilidad resumida: `Disponible`, `Pocas unidades`, `Sin stock` o `Consultar`.
- Mantener productos publicables visualmente aunque no tengan precio/stock.
- Bloquear compra/pedido si falta precio o disponibilidad valida.
- Crear una RPC nueva autenticada, no modificar la publica para devolver precio/stock.
- Migrar `/catalogo` a la RPC paginada estricta en una fase separada para alinear `review_status='published'`.

## Decisiones Requeridas de Carlos

1. Precio: confirmar si se muestra precio con IVA o neto.
2. Stock: confirmar si se muestra stock exacto o solo disponibilidad resumida.
3. Listas de precio: confirmar si MVP usa precio base unico o si debe preparar lista por cliente.
4. Bodega: confirmar si se usara stock consolidado o por bodega/sucursal.
5. Producto con precio y sin stock: mostrar como `Consultar` o bloquear pedido.
6. Producto con stock y sin precio: mostrar ficha publica, pero bloquear pedido.
7. Acceso: confirmar que solo `status='approved'` + `can_view_prices=true` ve precios.
8. Compra futura: definir si `can_create_orders=true` sera requisito adicional.

## Siguientes Fases Sugeridas

1. 6D.9B: Diseno de RPC privada para cliente aprobado.
   - No insertar datos todavia.
   - Definir contrato de retorno: precio, moneda, disponibilidad resumida, fecha de actualizacion.
   - No devolver stock exacto salvo aprobacion explicita.

2. 6D.9C: Sync dry-run de precios/stock Bsale.
   - Leer fuente Bsale o espejo disponible.
   - Generar preview sin insertar `product_prices` ni `product_stock`.
   - Validar mapeo por `bsale_variant_id`.

3. 6D.9D: Insert controlado de precios/stock para el producto piloto.
   - Solo despues de aprobar reglas de visibilidad.
   - Mantener sin publicacion adicional.

4. 6D.9E: UI cliente aprobada.
   - Mostrar precio solo a cliente aprobado.
   - Mostrar disponibilidad resumida.
   - Mantener mensaje bloqueado para visitantes y cuentas pendientes.

## Confirmaciones de Seguridad

- No se ejecuto SQL de modificacion.
- No se inserto precio.
- No se inserto stock.
- No se modificaron productos.
- No se publicaron productos adicionales.
- No se modificaron RPCs.
- No se modificaron policies RLS.
- No se modifico frontend.
- No se llamo Bsale.
- No se llamo RPC apply.
- No se uso `db push`, `db pull` ni `migration repair`.
- No se modificaron imagenes.
- No se modifico Storage.
- No se toco WordPress/WooCommerce/cPanel.
- Sin commit.
- Sin push.
