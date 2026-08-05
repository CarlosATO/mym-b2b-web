# Reporte Importación Controlada de Imágenes Heredadas (Fase 6D.6E)

## Objetivo

Preparar y validar la importación manual controlada, desde la UI admin, de las 2 imágenes heredadas aprobadas en la revisión visual 6D.6D.

Carlos ejecutó la importación real desde la UI usando el flujo `Importar imagen desde URL`. Desde terminal solo se ejecutaron SELECTs de lectura para validar el resultado; no se importaron imágenes automáticamente, no se subieron archivos desde terminal, no se modificó Storage desde terminal y no se publicaron productos.

## SKUs Aprobados para Importación Controlada

| SKU | product_id | Producto B2B | WooCommerce variación | URL origen |
|-----|------------|--------------|-----------------------|------------|
| `100909` | `160c93e0-a76a-43d1-bd6d-014ff2465ebd` | BRIT CARE CAT GR. FREE SENIOR WEIGHT CONTROL 2KG | BRIT CARE CAT GR. FREE SENIOR WEIGHT CONTROL - 2 Kg | `https://amimascota.cl/wp-content/uploads/2023/12/100909-e1705558221301.jpg` |
| `101215` | `b6451a48-af47-4e8a-bde1-c7aa67b13413` | BRIT CARE GRAIN-FREE SALMON ADULT 12KG | BRIT CARE GRAIN-FREE SALMON ADULT - 12 Kg | `https://amimascota.cl/wp-content/uploads/2023/12/101216-1-e1705557976161.png` |

## SKUs Excluidos

| SKU | Estado | Motivo |
|-----|--------|--------|
| `101213` | `rechazado` | Riesgo de peso/formato incorrecto para Adult Large 3KG. |
| `101216` | `rechazado` | Usa imagen asociada al 12KG; no segura para producto 3KG. |
| `101221` | `pendiente_revision` | Puppy Salmon, peso no confirmado visualmente. |
| `101222` | `pendiente_revision` | Misma imagen Puppy, peso no confirmado visualmente. |

## Estado Previo Validado

Validación realizada con SELECTs de solo lectura antes de cualquier importación UI:

| SKU | Producto existe | Imagen primaria | primary_image_url derivada | review_status | Activo | Visible | Destacado | Bsale sync | product_prices | product_stock | public_count | public_slug_count |
|-----|-----------------|-----------------|----------------------------|---------------|--------|---------|-----------|------------|----------------|---------------|--------------|-------------------|
| `100909` | Sí | `0` | `null` | `draft` | `false` | `false` | `false` | `pending` | `0` | `0` | `0` | `0` |
| `101215` | Sí | `0` | `null` | `draft` | `false` | `false` | `false` | `pending` | `0` | `0` | `0` | `0` |

Conteo actual de objetos en bucket `product-images` antes de la prueba: `3`.

## Resultado de Importación UI

Carlos importó manualmente las 2 imágenes aprobadas. Ambas quedaron copiadas en Supabase Storage y asociadas como imagen primaria del producto correspondiente.

| SKU | URL final Supabase Storage | Ruta Storage | MIME | Tamaño | Imagen primaria |
|-----|----------------------------|--------------|------|--------|-----------------|
| `100909` | `https://oekmztbfasmildyuajji.supabase.co/storage/v1/object/public/product-images/d1000000-0000-0000-0000-000000000001/160c93e0-a76a-43d1-bd6d-014ff2465ebd/595a1520-da9a-455e-bbba-d57fdae05314.jpg` | `d1000000-0000-0000-0000-000000000001/160c93e0-a76a-43d1-bd6d-014ff2465ebd/595a1520-da9a-455e-bbba-d57fdae05314.jpg` | `image/jpeg` | `34135` bytes | `1` |
| `101215` | `https://oekmztbfasmildyuajji.supabase.co/storage/v1/object/public/product-images/d1000000-0000-0000-0000-000000000001/b6451a48-af47-4e8a-bde1-c7aa67b13413/b25e345a-e02c-4120-b959-de384362028b.png` | `d1000000-0000-0000-0000-000000000001/b6451a48-af47-4e8a-bde1-c7aa67b13413/b25e345a-e02c-4120-b959-de384362028b.png` | `image/png` | `102763` bytes | `1` |

Conteo final de objetos en bucket `product-images`: `5`.

Las URLs finales apuntan a Supabase Storage `product-images` y no a `amimascota.cl`.

## Estado Final Validado

Validación realizada con SELECTs de solo lectura después de la importación UI:

| SKU | review_status | Activo | Visible | Destacado | Bsale sync | product_prices | product_stock | public_count | public_slug_count |
|-----|---------------|--------|---------|-----------|------------|----------------|---------------|--------------|-------------------|
| `100909` | `draft` | `false` | `false` | `false` | `pending` | `0` | `0` | `0` | `0` |
| `101215` | `draft` | `false` | `false` | `false` | `pending` | `0` | `0` | `0` | `0` |

Ambos productos siguen en borrador, inactivos, no visibles y no destacados. No hubo publicación automática y `/catalogo` no expone estos productos.

## Instrucciones para Carlos

### Producto 1 - SKU 100909

URL edición local:

```text
http://localhost:3000/admin/productos/160c93e0-a76a-43d1-bd6d-014ff2465ebd/editar
```

URL imagen origen:

```text
https://amimascota.cl/wp-content/uploads/2023/12/100909-e1705558221301.jpg
```

### Producto 2 - SKU 101215

URL edición local:

```text
http://localhost:3000/admin/productos/b6451a48-af47-4e8a-bde1-c7aa67b13413/editar
```

URL imagen origen:

```text
https://amimascota.cl/wp-content/uploads/2023/12/101216-1-e1705557976161.png
```

### Pasos para cada producto

1. Abrir la URL de edición.
2. Pegar la URL origen en `Importar imagen desde URL`.
3. Presionar `Importar imagen`.
4. Verificar preview.
5. Verificar que la URL final sea Supabase Storage `product-images`.
6. Presionar `Guardar cambios`.
7. Mantener el producto en `draft`, inactivo, no visible y no destacado.

## Alcance de Seguridad

- No se llama Bsale.
- No se llama RPC apply.
- No se crean, borran, modifican ni publican productos desde terminal.
- No se importan imágenes por terminal.
- No se suben imágenes por terminal.
- No se modifica Storage desde terminal.
- No se tocan `product_prices` ni `product_stock`.
- No se toca WordPress/WooCommerce/cPanel ni se usan credenciales de esos sistemas.
- No se ejecutan SQLs de modificación; solo SELECTs de lectura.
- No se incluyen CSVs, outputs locales ni imágenes en el repo.

## Estado de la Fase

La importación real de las 2 imágenes aprobadas fue ejecutada por Carlos desde la UI admin y validada posteriormente con SELECTs de solo lectura. Los SKUs rechazados o pendientes de revisión (`101213`, `101216`, `101221`, `101222`) no fueron importados en esta fase.
