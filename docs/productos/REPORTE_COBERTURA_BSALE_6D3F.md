# Reporte de Cobertura Bsale — Fase 6D.3F

- **Fecha/hora ejecución**: 03-08-2026, 4:59:26 p. m. (2026-08-03T20:59:26.410Z UTC)
- **Modo**: solo lectura / análisis. No se crearon ni modificaron productos.

## Metadata de paginación Bsale

- **Total reportado por la API**: 3591
- **limit**: 1 | **offset**: 0
- **next**: sí | **previous**: no

## Segmentos analizados

- **segmentSize**: 50 | **maxSegments**: 4 | **maxItemsToAnalyze**: 200
- **Segmentos leídos**: 4 (offsets 0, 50, 100, 150)
- **Total items Bsale analizados**: 200
- **Cobertura analizada aproximada**: 5.57%
- **Productos web usados para comparación**: 4

## Summary global del planner

| totalSeen | 200 |
| totalCreated | 184 |
| totalUpdated | 0 |
| totalLinkedExisting | 0 |
| totalSkipped | 16 |
| totalConflicts | 0 |
| totalErrors | 0 |

## Conteos adicionales

- **SKUs únicos en muestra**: 200
- **bsaleVariantIds únicos en muestra**: 200
- **source_name vacíos/inválidos**: 0
- **Productos inactivos omitidos (skipped)**: 16

## Hallazgos

- **created (184)**: variantes válidas listas para creación futura.
- **updated (0)**: ninguna variante actualizaría (consistente con catálogo web actual).
- **linked (0)**: ningún vínculo por SKU con productos web existentes.
- **skipped (16)**: 16 variantes inactivas omitidas.
- **conflicts (0)**: ninguno en la muestra.
- **errors (0)**: ninguno.

### Muestra: productos que se crearían (máx 5)

| sku | bsaleVariantId | sourceName | action | conflictType | message |
|---|---|---|---|---|---|
| 00016 | 1478 | SAFARI PEZ HENO CONEJO-CUYE | create | - | New product to create |
| 66200 | 1485 | PELUCHE DE GATO MOUNSTRUOS SURTIDOS | create | - | New product to create |
| 74528 | 1488 | PELUCHE PEZ REAL PEQUEÑO | create | - | New product to create |
| 73310 | 1491 | TRAILLA AMIGO TELA 1.0CM | create | - | New product to create |
| 62596 | 1493 | JUG GATO PORFIADO HA | create | - | New product to create |

### Muestra: omitidos (máx 5)

| sku | bsaleVariantId | sourceName | action | conflictType | message |
|---|---|---|---|---|---|
| PD68668 | 1524 | PLANET DOG PLANET BALL AZUL/VERDE "M" | skip | - | Producto inactivo en Bsale, no se importa en fase inicial. |
| 2087 | 1669 | AFP MODERN CAT FLASH BALL | skip | - | Producto inactivo en Bsale, no se importa en fase inicial. |
| 2135 | 1682 | BIOLINE BOLA CATNIP | skip | - | Producto inactivo en Bsale, no se importa en fase inicial. |
| 2158 | 1686 | AFP VARILLA PELOTAS GATO FLUFFY WAND | skip | - | Producto inactivo en Bsale, no se importa en fase inicial. |
| 2800 | 1722 | AFP FURRY BALL FLUFFER NARANJA | skip | - | Producto inactivo en Bsale, no se importa en fase inicial. |

### Muestra: conflictos (máx 5)

_ninguno_

## Calidad de nombres

Los source_name de la muestra ampliada provienen del mapper corregido (6D.3E): base comercial desde `product.name`/description con característica de variante anexada cuando corresponde. No se observan nombres que queden solo como tamaño/formato.

## Riesgos detectados

- Catálogo Bsale real con **total reportado de 3591**; la muestra de 200 items es parcial.
- Los productos web actuales parecen demo/TEST (4 registros); un primer apply podría mezclar datos reales con demo.
- No hay precios ni stock sincronizados todavía (fuera de alcance de 6D).

## Observación sobre productos demo/test

La base actual (4 productos web) se usa solo como comparación read-only. Antes del primer apply se recomienda limpiar o ignorar explícitamente registros TEST/DEMO (revisión manual).

## Recomendación de primer apply controlado (FASE POSTERIOR, no implementada)

- **Selección**: primeros **20 productos válidos** de un dry-run `success` revisado visualmente en el panel, o un segmento controlado sin conflictos ni skipped.
- **Validaciones previas**: sin `duplicate_sku`, sin `duplicate_bsale_variant_id`, sin `missing_name`, sin `missing_sku`, sin productos inactivos.
- **Resultado esperado**: insertar SOLO en `web_b2b.products`: `review_status='draft'`, `is_active=false`, `is_visible=false`, `bsale_sync_enabled=true`.
  - `bsale_sync_status`: se recomienda `pending` (el estado `success` implica que la sincronización operativa ya ocurrió, lo cual aún no es cierto en esta fase).
- **Sin precios, sin stock, sin imágenes, sin publicación pública**.
- **Rollback conceptual**: no borrar automáticamente. Ante fallos, marcar inactivo/no visible o limpiar con migration/script controlado; nunca desde UI.
- **Fase**: 6D.4 o posterior, con su propia revisión.
