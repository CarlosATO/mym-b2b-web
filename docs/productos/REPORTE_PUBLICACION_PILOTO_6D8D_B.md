# Reporte Publicacion Piloto (Fase 6D.8D-B)

## Objetivo

Validar la publicacion piloto real de 1 producto Bsale normalizado, realizada manualmente por Carlos desde la UI admin.

Esta validacion fue solo lectura desde terminal. No se modificaron productos, precios, stock, imagenes ni Storage durante la validacion.

## Producto Piloto Publicado

| Campo | Valor |
|-------|-------|
| SKU | `100909` |
| product_id | `160c93e0-a76a-43d1-bd6d-014ff2465ebd` |
| Producto | BRIT CARE Cat Grain Free Senior Weight Control 2 kg |
| Slug | `brit-care-cat-grain-free-senior-weight-control-2kg` |
| Marca | BRIT CARE |
| Categoria | Alimento seco |

Campos cambiados por Carlos desde UI admin:

- `review_status`: `published`
- `is_active`: `true`
- `is_visible`: `true`
- `is_featured`: `false`

Campos no modificados:

- SKU.
- `bsale_variant_id`.
- `bsale_sync_status`.
- Precio.
- Stock.
- Imagen.
- Storage.

## Evidencia Visual Reportada por Carlos

- El producto aparece en `/catalogo`.
- La ficha publica abre en:
  `http://localhost:3000/productos/brit-care-cat-grain-free-senior-weight-control-2kg`
- Se muestra imagen, marca, categoria y descripcion.
- La UI muestra aviso "Precio disponible para clientes aprobados".
- No aparece precio falso.
- No aparece stock falso.

## Validacion DB del Producto

| Requisito | Resultado |
|-----------|-----------|
| SKU `100909` existe una sola vez | OK |
| product_id correcto | OK |
| `review_status = published` | OK |
| `is_active = true` | OK |
| `is_visible = true` | OK |
| `is_featured = false` | OK |
| `bsale_sync_status = pending` | OK |
| Marca `BRIT CARE` | OK |
| Categoria `Alimento seco` | OK |
| Slug correcto | OK |
| Imagen primaria presente | OK |
| Imagen apunta a Supabase Storage `product-images` | OK |
| `short_description` presente | OK |
| `description` presente | OK |
| `seo_title` presente | OK |
| `seo_description` presente | OK |
| `product_prices` del producto | 0 |
| `product_stock` del producto | 0 |
| `public_count` | 1 |
| `public_slug_count` | 1 |
| Aparece en wrapper/RPC publica de catalogo | OK |

Imagen primaria:

```text
https://oekmztbfasmildyuajji.supabase.co/storage/v1/object/public/product-images/d1000000-0000-0000-0000-000000000001/160c93e0-a76a-43d1-bd6d-014ff2465ebd/595a1520-da9a-455e-bbba-d57fdae05314.jpg
```

## Control de Exposicion

Productos Bsale publicados/expuestos:

| SKU | product_id | Producto | Estado |
|-----|------------|----------|--------|
| `100909` | `160c93e0-a76a-43d1-bd6d-014ff2465ebd` | BRIT CARE Cat Grain Free Senior Weight Control 2 kg | published/activo/visible/no destacado |

Validaciones:

- Productos Bsale publicados/expuestos total: 1.
- El unico Bsale publicado/expuesto es SKU `100909`.
- No se publicaron `100583`, `100584`, `100588` ni `101188`.
- Los otros Bsale reales siguen sin exposicion publica.
- Catalogo publico total: 4 productos visibles actuales.
- Desglose catalogo: 3 DEMO + 1 Bsale piloto.
- Ficha publica por slug retorna 1 producto.

## Conteos Generales

| Metrica | Antes 6D.8D-B | Despues validado |
|---------|--------------:|-----------------:|
| `web_b2b.products` | 74 | 74 |
| Productos Bsale reales | 70 | 70 |
| `product_prices` | 0 | 0 |
| `product_stock` | 0 | 0 |
| `product_images` | 13 | 13 |
| Storage `product-images` | 9 | 9 |
| Productos con imagen primaria | 12 | 12 |
| Productos Bsale publicados/expuestos | 0 | 1 |
| Catalogo publico total | 3 | 4 |

## Riesgos Pendientes

- Todavia no hay integracion de precios/stock.
- Esta fase valida visualizacion publica, no venta completa.
- Las wrappers publicas actuales exponen por `is_active = true` + `is_visible = true`; por eso `review_status` debe mantenerse coherente aunque esa RPC antigua no lo exija todavia.
- Antes de publicacion amplia conviene migrar `/catalogo` a la RPC paginada que tambien exige `review_status = 'published'`.

## Alcance Ejecutado

- SELECTs de solo lectura.
- RPCs publicas de lectura para validar catalogo y ficha.
- Documentacion del resultado real.
- Sin SQL de modificacion desde terminal.
- Sin `db push`, `db pull` ni `migration repair`.
- Sin Bsale.
- Sin RPC apply.
- Sin productos modificados/publicados desde terminal.
- Sin precios/stock.
- Sin imagenes/Storage.
- Sin WordPress/WooCommerce/cPanel.
