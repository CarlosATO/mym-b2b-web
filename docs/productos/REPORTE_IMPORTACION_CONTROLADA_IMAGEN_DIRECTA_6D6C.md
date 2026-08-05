# Reporte Importación Controlada Imagen Directa (Fase 6D.6C)

## Objetivo

Preparar y validar la importación manual controlada, desde la UI admin, de la única imagen directa candidata detectada en el dry-run WooCommerce 6D.6B.

La imagen fue importada por Carlos desde la UI admin. Desde terminal solo se ejecutaron SELECTs de lectura para validar el resultado; no se importaron imágenes automáticamente, no se modificó Storage desde terminal y no se publicaron productos.

## Candidato Directo Seleccionado

| Campo | Valor |
|-------|-------|
| `product_id` B2B | `0aee8c51-e67e-4b64-bc7c-d7ede8f380d0` |
| SKU | `101219` |
| Producto B2B | `BRIT CARE GRAIN-FREE SALMON JUNIOR LARGE 3KG` |
| Producto WooCommerce | `BRIT CARE GRAIN-FREE SALMON JUNIOR LARGE 3KG` |
| WooCommerce ID | `990517` |
| Tipo WooCommerce | `simple` |
| Match status dry-run | `exact_sku` |
| Match type operativo | `high_sku_direct_image` |
| Fuente de imagen | `direct` |
| Confianza | `high` |
| Razón | `Exact SKU match with direct image` |
| URL origen WooCommerce | `https://amimascota.cl/wp-content/uploads/2023/12/Junior-large-brit-care-salmon.png` |

## Resultado de Importación UI

Carlos importó la imagen desde la UI usando la URL directa de WooCommerce. La imagen quedó copiada en Supabase Storage y asociada como imagen primaria del producto.

| Campo | Valor |
|-------|-------|
| URL final `primary_image_url` | `https://oekmztbfasmildyuajji.supabase.co/storage/v1/object/public/product-images/d1000000-0000-0000-0000-000000000001/0aee8c51-e67e-4b64-bc7c-d7ede8f380d0/46a1ebb0-1769-4a33-90b1-dcd2b63b355d.png` |
| Ruta Storage | `d1000000-0000-0000-0000-000000000001/0aee8c51-e67e-4b64-bc7c-d7ede8f380d0/46a1ebb0-1769-4a33-90b1-dcd2b63b355d.png` |
| Bucket | `product-images` |
| MIME | `image/png` |
| Tamaño | `155106` bytes |
| Límite | `<= 5 MB` |
| Conteo total actual de objetos en `product-images` | `3` |
| URL final apunta a Supabase Storage | Sí |
| URL final apunta a `amimascota.cl` | No |

## Estado Previo Validado

Validación realizada con SELECTs de solo lectura:

| Validación | Resultado |
|------------|-----------|
| Producto existe | Sí |
| `sku` | `101219` |
| `review_status` | `draft` |
| `is_active` | `false` |
| `is_visible` | `false` |
| `is_featured` | `false` |
| `bsale_sync_status` | `pending` |
| Imagen primaria en `web_b2b.product_images` | `0` |
| `product_prices` | `0` |
| `product_stock` | `0` |
| Exposición por detalle público | `0` |
| Exposición en catálogo público | `0` |

## Estado Final Validado

Validación realizada con SELECTs de solo lectura después de la importación UI:

| Validación | Resultado |
|------------|-----------|
| Producto existe | Sí |
| `sku` | `101219` |
| `review_status` | `draft` |
| `is_active` | `false` |
| `is_visible` | `false` |
| `is_featured` | `false` |
| `bsale_sync_status` | `pending` |
| `primary_image_url` | Informada, apuntando a Supabase Storage |
| Imagen primaria en `web_b2b.product_images` | `1` |
| `product_prices` | `0` |
| `product_stock` | `0` |
| Exposición por detalle público | `0` |
| Exposición en catálogo público | `0` |

El producto sigue en borrador, inactivo, no visible y no destacado. No hubo publicación automática.

## URL de Edición Local

```text
http://localhost:3000/admin/productos/0aee8c51-e67e-4b64-bc7c-d7ede8f380d0/editar
```

## Instrucciones para Carlos

1. Abrir el producto en la URL local de edición.
2. Pegar la URL origen WooCommerce en `Importar imagen desde URL`.
3. Presionar `Importar imagen`.
4. Verificar que la URL final generada apunte a Supabase Storage en el bucket `product-images`.
5. Presionar `Guardar cambios`.
6. Mantener el producto en `draft`, inactivo, no visible y no destacado.

URL origen a pegar:

```text
https://amimascota.cl/wp-content/uploads/2023/12/Junior-large-brit-care-salmon.png
```

## Reglas de Seguridad

- No se llama Bsale.
- No se llama RPC apply.
- No se crean, borran, modifican ni publican productos desde terminal.
- No se importan imágenes automáticamente desde terminal.
- No se suben imágenes desde terminal.
- No se modifica Storage desde terminal.
- No se tocan `product_prices` ni `product_stock`.
- No se toca WordPress/WooCommerce/cPanel ni se usan credenciales de esos sistemas.
- No se ejecutan SQLs de modificación.
- Solo se usan SELECTs de lectura para validación.
- No hubo importación masiva; solo se validó la importación manual por UI del candidato directo.

## Estado de la Fase

La importación real del candidato directo fue ejecutada por Carlos desde la UI admin y validada posteriormente con SELECTs de solo lectura. Los 6 candidatos heredados desde padre siguen pendientes de revisión visual previa y no fueron importados en esta subfase.
