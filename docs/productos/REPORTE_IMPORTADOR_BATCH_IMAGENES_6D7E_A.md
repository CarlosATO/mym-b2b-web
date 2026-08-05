# Reporte Importador Batch Imagenes High (Fase 6D.7E-A)

## Objetivo

Crear un importador batch seguro para imagenes WooCommerce high y ejecutarlo primero en modo dry-run.

Esta subfase no importa imagenes, no sube archivos, no modifica Storage, no inserta filas en `product_images`, no modifica productos, no publica productos y no toca precios/stock.

## Motivo de Separar Dry-run y Apply

La importacion por lote tiene efectos fuera de la base, especialmente subida a Supabase Storage. Por eso se separa en dos pasos:

1. 6D.7E-A: validar candidatos, URL, MIME, tamano y ruta planificada sin mutaciones.
2. 6D.7E-B: ejecutar importacion real solo si Carlos aprueba el resultado del dry-run.

## Precheck

Estado del repositorio antes de trabajar:

```text
?? supabase/.temp/
```

El archivo de auditoria existe y `local-data/` no esta trackeado por Git:

```text
local-data/wc-images-audit/output/b2b70-wc-image-match-audit-20260805.csv
```

Estado de base validado con SELECTs de solo lectura:

| Metrica | Valor |
|---------|------:|
| `web_b2b.products` | 74 |
| Productos Bsale reales | 70 |
| `product_images` | 9 |
| Productos con imagen primaria | 8 |
| Storage `product-images` | 5 |
| `product_prices` | 0 |
| `product_stock` | 0 |

Los 4 candidatos high:

- Existen una sola vez en B2B.
- No tienen imagen primaria.
- Estan `review_status = draft`.
- Estan `is_active = false`.
- Estan `is_visible = false`.
- Estan `is_featured = false`.
- Tienen `bsale_sync_status = pending`.
- No estan expuestos en catalogo publico.

## Script Creado

Archivo:

```text
scripts/import-product-images-batch.mjs
```

Caracteristicas:

- Node estandar, sin dependencias nuevas.
- Lee candidatos desde:
  `local-data/wc-images-audit/output/b2b70-wc-image-match-audit-20260805.csv`
- Filtra:
  - `recommended_action = candidate_auto_import`
  - `confidence = high`
  - `has_primary_image = false`
- Soporta dos modos:
  - `--dry-run`
  - `--apply --confirm`
- Si se ejecuta `--apply` sin `--confirm`, se detiene.

Validaciones por candidato:

- SKU existe una sola vez en B2B.
- `product_id` coincide con B2B actual.
- Producto no tiene imagen primaria.
- Producto sigue draft/inactivo/no visible/no destacado.
- `bsale_sync_status = pending`.
- Producto no esta expuesto publicamente.
- URL origen usa `http/https`.
- URL no es local/private/file/data/javascript.
- Host esperado: `amimascota.cl`.
- MIME permitido: `image/jpeg`, `image/png`, `image/webp`.
- Tamano maximo: 5 MB.
- Extension destino coherente.
- Ruta destino esperada: `{company_id}/{product_id}/{uuid}.{ext}`.

El modo `--apply` fue implementado pero no ejecutado en esta subfase. En apply repetira validaciones, descargara la imagen, subira al bucket `product-images`, insertara `web_b2b.product_images` como primaria y no reemplazara si aparece imagen existente.

## Dry-run Ejecutado

Comando:

```bash
node scripts/import-product-images-batch.mjs --dry-run
```

Resultado:

| Metrica | Valor |
|---------|------:|
| Total candidatos | 4 |
| `would_import` | 4 |
| `blocked` | 0 |
| `imported` | 0 |
| `products` antes/despues | 74 / 74 |
| `product_images` antes/despues | 9 / 9 |
| Storage `product-images` antes/despues | 5 / 5 |
| `product_prices` antes/despues | 0 / 0 |
| `product_stock` antes/despues | 0 / 0 |
| Imagenes actuales de candidatos | 0 |

## Candidatos Validados

| SKU | product_id | Producto | MIME | Tamano bytes | Ruta planeada | Accion |
|-----|------------|----------|------|-------------:|---------------|--------|
| `100583` | `52fdf695-2c9d-4425-a843-6c08dae31b04` | BRIT LATA PATE Y MEAT DUCK 400GR | `image/jpeg` | 57376 | `d1000000-0000-0000-0000-000000000001/52fdf695-2c9d-4425-a843-6c08dae31b04/62fbc9f8-7231-4ff7-88c4-f45a24c7a456.jpg` | `would_import` |
| `100584` | `2d503986-85d5-4217-bf9b-307c3dde82ed` | BRIT LATA PATE Y MEAT PUPPY 400GR | `image/jpeg` | 43030 | `d1000000-0000-0000-0000-000000000001/2d503986-85d5-4217-bf9b-307c3dde82ed/1fecdb4d-6454-4387-8d1e-b1f3ec0a4a6c.jpg` | `would_import` |
| `100588` | `ffb60504-e85f-4d51-b2e3-b98751a99d62` | BRIT LATA MONO PROTEIN TURKEY 400GR | `image/jpeg` | 54809 | `d1000000-0000-0000-0000-000000000001/ffb60504-e85f-4d51-b2e3-b98751a99d62/4bfd0b7d-7f4a-44a4-b7c1-a00ae10cc208.jpg` | `would_import` |
| `101188` | `dab271c7-83bf-45c0-82b3-bd5caadf6c0b` | BRIT CARE LETS BITE SNACKS DUCK FILLETS 80GR | `image/jpeg` | 59317 | `d1000000-0000-0000-0000-000000000001/dab271c7-83bf-45c0-82b3-bd5caadf6c0b/087d2d8f-a217-4fc2-b7c1-6d1d5b47b683.jpg` | `would_import` |

## Outputs Locales

Generados en `local-data/wc-images-audit/output/`:

```text
batch-image-import-dry-run-6D7E-20260805.json
batch-image-import-dry-run-6D7E-20260805.csv
```

Estos outputs son locales y no deben commitearse.

## Decision Requerida para 6D.7E-B

Carlos debe aprobar la ejecucion real:

```bash
node scripts/import-product-images-batch.mjs --apply --confirm
```

Resultado esperado en 6D.7E-B si no cambia el estado previo:

- 4 imagenes subidas a Supabase Storage `product-images`.
- 4 filas nuevas en `web_b2b.product_images`.
- Los productos seguiran draft/inactivos/no visibles/no destacados.
- No habra precios ni stock.
- No se publicara nada.

## Alcance Ejecutado

- No se importaron imagenes.
- No se subieron imagenes.
- No se modifico Storage.
- No se insertaron filas en `product_images`.
- No se modificaron productos.
- No se publicaron productos.
- No se tocaron `product_prices` ni `product_stock`.
- No se llamo Bsale.
- No se llamo RPC apply.
- No se ejecuto SQL de modificacion.
- No se toco WordPress/WooCommerce/cPanel.
