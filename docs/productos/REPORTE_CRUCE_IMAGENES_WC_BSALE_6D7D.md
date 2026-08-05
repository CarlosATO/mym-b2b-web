# Reporte Cruce Imagenes WooCommerce / Bsale (Fase 6D.7D)

## Objetivo

Cruzar los 70 productos Bsale reales existentes en `web_b2b.products` contra el CSV WooCommerce ya descargado para detectar candidatos de imagen por lote.

Esta fase es solo dry-run/auditoria: no importa imagenes, no descarga imagenes, no modifica Storage, no modifica productos, no toca precios/stock y no publica productos.

## Fuente Usada

CSV WooCommerce local:

```text
local-data/wc-images-audit/wc-products-original-20260805.csv
```

Snapshot B2B local generado con SELECTs de solo lectura:

```text
local-data/wc-images-audit/output/current-bsale-products-70-20260805.raw.json
```

Outputs locales generados:

```text
local-data/wc-images-audit/output/b2b70-wc-image-match-audit-20260805.csv
local-data/wc-images-audit/output/b2b70-wc-image-match-summary-20260805.json
```

`local-data/` no esta trackeado por Git y estos outputs no deben commitearse.

## Estado Inicial

| Metrica | Valor |
|---------|------:|
| Total productos `web_b2b.products` | 74 |
| Productos Bsale reales evaluados | 70 |
| DEMO | 3 |
| TEST | 1 |
| `product_prices` | 0 |
| `product_stock` | 0 |
| `product_images` | 9 |
| Productos con imagen primaria | 8 |
| Storage `product-images` | 5 |

Dentro de los 70 productos Bsale reales evaluados:

- 5 ya tienen imagen primaria.
- 65 no tienen imagen primaria.

## Metodologia

El script `scripts/audit-web-product-images.mjs` fue ajustado para:

- Leer el CSV WooCommerce real.
- Leer un snapshot B2B actual de 70 productos Bsale reales.
- Detectar columnas WooCommerce relevantes automaticamente.
- Cruzar por SKU exacto normalizado (`trim` + comparacion case-insensitive).
- No usar fuzzy matching para candidatos automaticos.
- No descargar ni validar contenido de imagen; solo validar formato URL `http/https`.
- No reemplazar imagenes existentes.

Columnas WooCommerce detectadas:

| Campo | Columna |
|-------|---------|
| SKU | `SKU` |
| Nombre | `Nombre` |
| Tipo | `Tipo` |
| Padre | `Superior` |
| Imagenes | `Imágenes` |
| Categorias | `Categorías` |
| Descripcion corta | `Descripción corta` |
| Descripcion | `Descripción` |

## Clasificacion

| Codigo | Estado | Accion |
|--------|--------|--------|
| A | `already_has_primary_image` | `skip_no_replace` |
| B | `direct_sku_image` | `candidate_auto_import` |
| C | `inherited_parent_image` | `candidate_review_required` |
| D | `duplicate_sku_or_conflict` | `blocked_conflict` |
| E | `no_image_match` | `no_import` |
| F | `invalid_url` | `blocked_invalid_url` |

## Metricas WooCommerce

| Metrica | Valor |
|---------|------:|
| Total filas | 3.566 |
| Filas con SKU | 3.181 |
| Filas sin SKU | 385 |
| Productos simples | 2.015 |
| Productos variables/padres | 382 |
| Variaciones | 1.169 |
| Filas con imagen directa | 1.531 |
| Imagenes unicas | 1.361 |
| Variaciones con imagen heredada desde padre | 721 |
| SKUs duplicados en CSV | 24 |

## Metricas del Cruce

| Metrica | Valor |
|---------|------:|
| Total productos Bsale evaluados | 70 |
| Con imagen primaria existente | 5 |
| Sin imagen primaria | 65 |
| Matches directos high | 4 |
| Matches heredados medium | 9 |
| Conflictos/duplicados en evaluados | 0 |
| URLs invalidas | 0 |
| Sin match o sin imagen | 52 |
| Candidatos automaticos importables | 4 |
| Candidatos que requieren revision manual | 9 |
| Bloqueados por ya tener imagen | 5 |
| Bloqueados por conflicto | 0 |
| Imagenes estimadas para importacion automatica en 6D.7E | 4 |

## Candidatos High para Importacion Automatica

Estos productos no tienen imagen primaria, tienen SKU exacto en WooCommerce y la misma fila tiene imagen directa valida.

| SKU | bsale_variant_id | Producto B2B | URL origen |
|-----|------------------|--------------|------------|
| `100583` | `1552` | BRIT LATA PATE Y MEAT DUCK 400GR | `https://amimascota.cl/wp-content/uploads/2023/12/duck.jpg` |
| `100584` | `1551` | BRIT LATA PATE Y MEAT PUPPY 400GR | `https://amimascota.cl/wp-content/uploads/2023/12/pate.jpg` |
| `100588` | `1550` | BRIT LATA MONO PROTEIN TURKEY 400GR | `https://amimascota.cl/wp-content/uploads/2023/12/X_8595602529780default.jpg` |
| `101188` | `1556` | BRIT CARE LETS BITE SNACKS DUCK FILLETS 80GR | `https://amimascota.cl/wp-content/uploads/2023/12/Brit-Lets-Bite-Meat-Snacks-Duck-Fillets-80-gr-e1705557682868.jpg` |

## Candidatos Medium para Revision Manual

Estos productos no tienen imagen primaria, tienen SKU exacto en WooCommerce y obtienen imagen heredada desde padre. Requieren revision visual antes de importacion real.

| SKU | bsale_variant_id | Producto B2B | URL origen |
|-----|------------------|--------------|------------|
| `101213` | `1513` | BRIT CARE GRAIN-FREE SALMON ADULT LARGE 3KG | `https://amimascota.cl/wp-content/uploads/2023/12/101216-e1705557985716.png` |
| `101216` | `1512` | BRIT CARE GRAIN-FREE SALMON ADULT 3KG | `https://amimascota.cl/wp-content/uploads/2023/12/101216-1-e1705557976161.png` |
| `101221` | `1508` | BRIT CARE GRAIN-FREE SALMON PUPPY 12KG | `https://amimascota.cl/wp-content/uploads/2023/12/101222-e1705557953466.jpg` |
| `101222` | `1509` | BRIT CARE GRAIN-FREE SALMON PUPPY 3KG | `https://amimascota.cl/wp-content/uploads/2023/12/101222-e1705557953466.jpg` |
| `100901` | `1559` | BRIT CARE CAT GR. FREE KITTEN HEALTHY GROWTH Y DEVELOMENT 2KG | `https://amimascota.cl/wp-content/uploads/2023/12/100901-e1705558229218.jpg` |
| `1231015` | `1562` | ROYAL CANIN YOUNG MALE 1.5KG | `https://amimascota.cl/wp-content/uploads/2023/12/weight-control-feline-cl.jpeg` |
| `1231035` | `1563` | ROYAL CANIN YOUNG MALE 3.5KG | `https://amimascota.cl/wp-content/uploads/2023/12/weight-control-feline-cl.jpeg` |
| `1232015` | `1564` | ROYAL CANIN YOUNG FEMALE 1.5KG | `https://amimascota.cl/wp-content/uploads/2023/12/weight-control-feline-cl.jpeg` |
| `1232035` | `1565` | ROYAL CANIN YOUNG FEMALE 3.5KG | `https://amimascota.cl/wp-content/uploads/2023/12/weight-control-feline-cl.jpeg` |

## Bloqueados por Imagen Existente

Estos productos ya tienen imagen primaria en Supabase Storage. No se reemplazan.

| SKU | bsale_variant_id | Producto B2B | Accion |
|-----|------------------|--------------|--------|
| `10.123` | `1503` | BRACCO TRAVEL TRANSPORTADORA Nº3 | `skip_no_replace` |
| `100909` | `1494` | BRIT CARE CAT GR. FREE SENIOR WEIGHT CONTROL 2KG | `skip_no_replace` |
| `101215` | `1511` | BRIT CARE GRAIN-FREE SALMON ADULT 12KG | `skip_no_replace` |
| `101219` | `1510` | BRIT CARE GRAIN-FREE SALMON JUNIOR LARGE 3KG | `skip_no_replace` |
| `66200` | `1485` | PELUCHE DE GATO MOUNSTRUOS SURTIDOS | `skip_no_replace` |

## Conflictos y URLs Invalidas

- Conflictos/duplicados para productos evaluados: 0.
- URLs invalidas: 0.

## Decision Recomendada para 6D.7E

Preparar importacion por lote solo para los 4 candidatos `direct_sku_image` con confianza high:

- `100583`
- `100584`
- `100588`
- `101188`

Los 9 candidatos `inherited_parent_image` deben quedar para revision visual previa o importacion controlada posterior. No deben entrar en importacion automatica ciega, especialmente cuando el producto tiene peso/formato en el nombre.

## Alcance Ejecutado

- No se importaron imagenes.
- No se descargaron imagenes.
- No se subieron imagenes.
- No se modifico Storage.
- No se modificaron productos.
- No se publicaron productos.
- No se tocaron `product_prices` ni `product_stock`.
- No se llamo Bsale.
- No se llamo RPC apply.
- No se ejecuto SQL de modificacion.
- No se toco WordPress/WooCommerce/cPanel.
