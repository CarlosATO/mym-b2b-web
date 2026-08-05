# Reporte Importacion Batch Imagenes High (Fase 6D.7E-B)

## Objetivo

Ejecutar la importacion real por lote de las 4 imagenes WooCommerce clasificadas como high en 6D.7D y validadas en dry-run en 6D.7E-A.

La importacion se realizo hacia Supabase Storage `product-images` y se asocio cada imagen como primaria en `web_b2b.product_images`.

## Alcance y Reglas

- Se ejecuto el apply real una sola vez.
- No se importaron SKUs distintos de los 4 candidatos high.
- No se importaron candidatos medium.
- No se reemplazaron imagenes existentes.
- No se publicaron productos.
- No se modifico `web_b2b.products` fuera de la asociacion de imagen primaria derivada desde `product_images`.
- No se tocaron `product_prices`.
- No se tocaron `product_stock`.
- No se llamo Bsale.
- No se llamo RPC apply de productos.
- No se ejecuto SQL de modificacion manual.
- No se uso `db push`, `db pull` ni `migration repair`.
- No se toco WordPress/WooCommerce/cPanel.
- No se modifico `package.json` ni `package-lock.json`.
- El puerto local sigue siendo `3000`.

## Estado Previo

Validado antes del apply:

| Metrica | Valor |
|---------|------:|
| `web_b2b.products` | 74 |
| Productos Bsale reales | 70 |
| `product_images` | 9 |
| Productos con imagen primaria | 8 |
| Storage `product-images` | 5 |
| `product_prices` | 0 |
| `product_stock` | 0 |

Estado previo de los 4 SKUs:

- Existian una sola vez en B2B.
- No tenian imagen primaria.
- Estaban `review_status = draft`.
- Estaban `is_active = false`.
- Estaban `is_visible = false`.
- Estaban `is_featured = false`.
- Tenian `bsale_sync_status = pending`.
- No aparecian en catalogo publico.

## Comando Ejecutado

```bash
node scripts/import-product-images-batch.mjs --apply --confirm
```

Resultado del apply:

| Metrica | Valor |
|---------|------:|
| Total candidatos | 4 |
| Importados | 4 |
| Bloqueados | 0 |
| Fallidos | 0 |
| `product_images` antes/despues | 9 / 13 |
| Storage `product-images` antes/despues | 5 / 9 |
| `products` antes/despues | 74 / 74 |
| `product_prices` antes/despues | 0 / 0 |
| `product_stock` antes/despues | 0 / 0 |

## Imagenes Importadas

| SKU | product_id | Producto | URL origen | URL final Supabase | Storage path | MIME | Tamano |
|-----|------------|----------|------------|--------------------|--------------|------|-------:|
| `100583` | `52fdf695-2c9d-4425-a843-6c08dae31b04` | BRIT LATA PATE Y MEAT DUCK 400GR | `https://amimascota.cl/wp-content/uploads/2023/12/duck.jpg` | `https://oekmztbfasmildyuajji.supabase.co/storage/v1/object/public/product-images/d1000000-0000-0000-0000-000000000001/52fdf695-2c9d-4425-a843-6c08dae31b04/ed995af9-8d6e-4b7a-b5c4-5b6df62308f9.jpg` | `d1000000-0000-0000-0000-000000000001/52fdf695-2c9d-4425-a843-6c08dae31b04/ed995af9-8d6e-4b7a-b5c4-5b6df62308f9.jpg` | `image/jpeg` | 57376 bytes |
| `100584` | `2d503986-85d5-4217-bf9b-307c3dde82ed` | BRIT LATA PATE Y MEAT PUPPY 400GR | `https://amimascota.cl/wp-content/uploads/2023/12/pate.jpg` | `https://oekmztbfasmildyuajji.supabase.co/storage/v1/object/public/product-images/d1000000-0000-0000-0000-000000000001/2d503986-85d5-4217-bf9b-307c3dde82ed/dfa90e0a-9215-4a23-8c1f-05848507df02.jpg` | `d1000000-0000-0000-0000-000000000001/2d503986-85d5-4217-bf9b-307c3dde82ed/dfa90e0a-9215-4a23-8c1f-05848507df02.jpg` | `image/jpeg` | 43030 bytes |
| `100588` | `ffb60504-e85f-4d51-b2e3-b98751a99d62` | BRIT LATA MONO PROTEIN TURKEY 400GR | `https://amimascota.cl/wp-content/uploads/2023/12/X_8595602529780default.jpg` | `https://oekmztbfasmildyuajji.supabase.co/storage/v1/object/public/product-images/d1000000-0000-0000-0000-000000000001/ffb60504-e85f-4d51-b2e3-b98751a99d62/223692e8-1599-4215-9c53-bce2ee0f9a76.jpg` | `d1000000-0000-0000-0000-000000000001/ffb60504-e85f-4d51-b2e3-b98751a99d62/223692e8-1599-4215-9c53-bce2ee0f9a76.jpg` | `image/jpeg` | 54809 bytes |
| `101188` | `dab271c7-83bf-45c0-82b3-bd5caadf6c0b` | BRIT CARE LETS BITE SNACKS DUCK FILLETS 80GR | `https://amimascota.cl/wp-content/uploads/2023/12/Brit-Lets-Bite-Meat-Snacks-Duck-Fillets-80-gr-e1705557682868.jpg` | `https://oekmztbfasmildyuajji.supabase.co/storage/v1/object/public/product-images/d1000000-0000-0000-0000-000000000001/dab271c7-83bf-45c0-82b3-bd5caadf6c0b/bc507805-e413-4925-a703-aee742ea32da.jpg` | `d1000000-0000-0000-0000-000000000001/dab271c7-83bf-45c0-82b3-bd5caadf6c0b/bc507805-e413-4925-a703-aee742ea32da.jpg` | `image/jpeg` | 59317 bytes |

## Validacion Posterior

Conteos posteriores:

| Metrica | Valor |
|---------|------:|
| `web_b2b.products` | 74 |
| `product_images` | 13 |
| Productos con imagen primaria | 12 |
| Storage `product-images` | 9 |
| `product_prices` | 0 |
| `product_stock` | 0 |
| Public count de los 4 SKUs | 0 |
| Public slug count de los 4 SKUs | 0 |

Los 4 productos quedaron con:

- 1 imagen primaria en `web_b2b.product_images`.
- URL final apuntando a Supabase Storage `product-images`.
- URL final sin hotlink a `amimascota.cl`.
- `review_status = draft`.
- `is_active = false`.
- `is_visible = false`.
- `is_featured = false`.
- `bsale_sync_status = pending`.
- `product_prices = 0`.
- `product_stock = 0`.
- Sin exposicion en `/catalogo`.

Nota de esquema: `web_b2b.products.primary_image_url` no existe como columna fisica en esta base; la fuente persistida para imagen primaria es `web_b2b.product_images` con `is_primary = true`.

## Outputs Locales

El apply genero outputs locales en:

```text
local-data/wc-images-audit/output/batch-image-import-apply-6D7E-20260805.json
local-data/wc-images-audit/output/batch-image-import-apply-6D7E-20260805.csv
```

Estos archivos son evidencia local y no deben commitearse.

## Siguiente Paso Recomendado

6D.7F:

- Revisar visualmente los 9 candidatos medium heredados; o
- Avanzar en normalizacion comercial de productos con imagen.

En ambos casos se mantiene la regla: no reemplazar imagenes existentes y no publicar productos automaticamente.
