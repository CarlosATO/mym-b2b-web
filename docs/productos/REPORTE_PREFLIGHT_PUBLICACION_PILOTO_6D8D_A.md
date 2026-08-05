# Reporte Preflight Publicacion Piloto (Fase 6D.8D-A)

## Objetivo

Validar si el producto Bsale normalizado SKU `100909` esta listo para una publicacion piloto controlada desde UI admin.

Esta fase no publica, no modifica productos, no toca precios, no toca stock, no toca imagenes y no modifica Storage.

## Producto Piloto

| Campo | Valor |
|-------|-------|
| SKU | `100909` |
| product_id | `160c93e0-a76a-43d1-bd6d-014ff2465ebd` |
| Nombre | BRIT CARE Cat Grain Free Senior Weight Control 2 kg |
| Slug | `brit-care-cat-grain-free-senior-weight-control-2kg` |
| Marca | BRIT CARE |
| Marca ID | `29333c92-ded6-4ea1-8d76-d60f6fd4ed08` |
| Categoria | Alimento seco |
| Categoria ID | `64346055-e5c6-40d9-b159-7a9a46ab5e95` |
| Jerarquia | Gatos > Alimentos para gatos > Alimento seco |

## Precheck

Conteos validados con SELECTs de solo lectura:

| Metrica | Valor |
|---------|------:|
| SKU `100909` encontrado | 1 |
| `web_b2b.products` | 74 |
| Productos Bsale reales | 70 |
| Productos Bsale publicados/expuestos | 0 |
| `product_prices` | 0 |
| `product_stock` | 0 |
| `product_images` | 13 |
| Storage `product-images` | 9 |

## Validacion del Producto

| Requisito | Resultado |
|-----------|-----------|
| Existe una sola vez | OK |
| Tiene imagen primaria | OK, 1 primaria |
| Imagen apunta a Supabase Storage | OK |
| Tiene marca BRIT CARE | OK |
| Tiene categoria Alimento seco | OK |
| Tiene slug | OK |
| Tiene short_description | OK |
| Tiene description | OK |
| Tiene seo_title | OK |
| Tiene seo_description | OK |
| `review_status = draft` | OK |
| `is_active = false` | OK |
| `is_visible = false` | OK |
| `is_featured = false` | OK |
| `bsale_sync_status = pending` | OK |
| `product_prices = 0` | OK |
| `product_stock = 0` | OK |
| `public_count = 0` | OK |
| `public_slug_count = 0` | OK |

Imagen primaria:

```text
https://oekmztbfasmildyuajji.supabase.co/storage/v1/object/public/product-images/d1000000-0000-0000-0000-000000000001/160c93e0-a76a-43d1-bd6d-014ff2465ebd/595a1520-da9a-455e-bbba-d57fdae05314.jpg
```

## Comportamiento Publico

La app publica actual usa:

- `/catalogo`: `src/lib/api/catalog.ts` llama `public.web_b2b_get_public_catalog_products`.
- `/productos/[slug]`: `src/lib/api/catalog.ts` llama `public.web_b2b_get_public_product_by_slug`.

Esas wrappers llaman las RPCs antiguas:

- `web_b2b.get_public_catalog_products`
- `web_b2b.get_public_product_by_slug`

Condiciones actuales de exposicion en esas RPCs:

- `p.company_id = target_company_id`
- `p.is_active = true`
- `p.is_visible = true`
- marca activa si existe
- categoria activa si existe

Importante:

- La RPC publica antigua no exige `review_status = 'published'`.
- Existe una RPC paginada mas estricta, `public.web_b2b_get_public_catalog_products_paginated`, que si exige `review_status = 'published'`, `is_active = true` e `is_visible = true`, pero la pagina `/catalogo` aun no la usa.

Conclusion operativa:

- Hoy el producto se expondria publicamente si Carlos marca `is_active=true` e `is_visible=true`.
- Para mantener consistencia editorial y preparar la migracion futura a la RPC paginada, la publicacion piloto debe cambiar en una sola accion UI:
  - `review_status = published`
  - `is_active = true`
  - `is_visible = true`
  - `is_featured = false`, salvo decision explicita distinta.

## Precio y Stock

La UI publica actual no consulta ni renderiza precio/stock en catalogo ni ficha publica.

- `ProductCard` muestra aviso generico: precio con cuenta.
- La ficha publica muestra aviso de precio disponible para clientes aprobados.
- Las RPCs publicas no retornan precio, stock numerico ni variantes Bsale.

Por lo tanto, publicar este producto sin precio/stock no rompe la UI publica actual. Comercialmente, queda pendiente integrar precios/stock antes de una publicacion amplia.

## Seguridad de Publicacion

Es seguro publicar solo este producto como piloto controlado, con estas condiciones:

- Hacerlo desde UI admin.
- Cambiar solo SKU `100909`.
- Mantener `is_featured = false`.
- No tocar precios.
- No tocar stock.
- No tocar imagenes.
- No modificar Storage.
- Verificar inmediatamente que solo aparece 1 producto nuevo en `/catalogo`.

Advertencia:

- Debido a la RPC publica antigua, activar y hacer visible un producto lo expone aunque `review_status` no sea `published`. En la UI se debe cuidar que `is_active` e `is_visible` no se activen accidentalmente en otros productos.

## Instrucciones para Carlos

URL de edicion local:

```text
http://localhost:3000/admin/productos/160c93e0-a76a-43d1-bd6d-014ff2465ebd/editar
```

Campos exactos a cambiar para publicacion piloto:

1. `review_status`: `published`
2. `is_active`: activar
3. `is_visible`: activar
4. `is_featured`: mantener desactivado
5. Guardar cambios

No cambiar:

- SKU
- Bsale variant id
- Bsale sync status
- Marca
- Categoria
- Imagen
- Precios
- Stock

URL publica esperada:

```text
http://localhost:3000/productos/brit-care-cat-grain-free-senior-weight-control-2kg
```

Tambien deberia aparecer en:

```text
http://localhost:3000/catalogo
```

## Impacto Esperado

Si Carlos publica solo este producto desde UI:

- Se expone 1 producto Bsale normalizado.
- No se publican otros productos.
- No se crean productos.
- No se tocan precios/stock.
- No se tocan imagenes/Storage.

## Siguiente Paso

6D.8D-B: Carlos ejecuta la publicacion piloto desde UI admin y luego se valida con SELECTs de solo lectura y revision publica.

## Alcance Ejecutado

- SELECTs de solo lectura.
- Revision de RPCs publicas y componentes publicos.
- Documentacion del preflight.
- Sin SQL de modificacion.
- Sin Bsale.
- Sin RPC apply.
- Sin productos modificados/publicados.
- Sin precios/stock.
- Sin imagenes/Storage.
- Sin WordPress/WooCommerce/cPanel.
