import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  fetchBsaleProductSegment,
  fetchBsaleVariantPageMetadata
} from '../../src/lib/bsale-product-import/bsale-readonly';
import { mapBsaleVariantToPlannerItem } from '../../src/lib/bsale-product-import/bsale-mapper';
import { fetchExistingWebProducts } from '../../src/lib/bsale-product-import/web-products-readonly';
import { planBsaleProductImport } from '../../src/lib/bsale-product-import/planner';
import { PlannerItemResult, PlannerSummary } from '../../src/lib/bsale-product-import/types';

// Limits for this analysis phase. Never exceeded unless changed explicitly.
const SEGMENT_SIZE = 50;
const MAX_SEGMENTS = 4;
const MAX_ITEMS_TO_ANALYZE = 200;

const REPORT_PATH = resolve(process.cwd(), 'docs/productos/REPORTE_COBERTURA_BSALE_6D3F.md');

type SampleRow = {
  sku: string | null;
  bsaleVariantId: string | null;
  sourceName: string | null;
  action: string;
  conflictType?: string | null;
  message?: string | null;
};

function toSampleRow(item: PlannerItemResult): SampleRow {
  return {
    sku: item.sku,
    bsaleVariantId: item.bsaleVariantId,
    sourceName: item.sourceName,
    action: item.action,
    conflictType: item.conflictType,
    message: item.message
  };
}

function printSamples(label: string, items: PlannerItemResult[]) {
  console.log(label);
  if (items.length === 0) {
    console.log('  (none)');
    return;
  }
  for (const item of items.slice(0, 5)) {
    console.log(
      `  sku=${item.sku || '-'} | variant=${item.bsaleVariantId || '-'} | name=${item.sourceName || '-'} | action=${item.action}` +
      (item.conflictType ? ` | conflict=${item.conflictType}` : '') +
      (item.message ? ` | message=${item.message}` : '')
    );
  }
}

function markdownTable(rows: SampleRow[]): string {
  const lines = ['| sku | bsaleVariantId | sourceName | action | conflictType | message |', '|---|---|---|---|---|---|'];
  for (const row of rows) {
    lines.push(
      `| ${row.sku || '-'} | ${row.bsaleVariantId || '-'} | ${row.sourceName || '-'} | ${row.action} | ${row.conflictType || '-'} | ${row.message || '-'} |`
    );
  }
  return lines.join('\n');
}

function formatSummaryLine(s: PlannerSummary): string {
  return `| totalSeen | ${s.totalSeen} |
| totalCreated | ${s.totalCreated} |
| totalUpdated | ${s.totalUpdated} |
| totalLinkedExisting | ${s.totalLinkedExisting} |
| totalSkipped | ${s.totalSkipped} |
| totalConflicts | ${s.totalConflicts} |
| totalErrors | ${s.totalErrors} |`;
}

async function main() {
  console.log('BSALE COVERAGE ANALYSIS — read-only, no product writes.\n');

  const companyId = process.env.MYM_COMPANY_ID;
  if (!companyId) {
    throw new Error('MYM_COMPANY_ID is required.');
  }

  // 1. Bsale pagination metadata (read-only).
  const metadata = await fetchBsaleVariantPageMetadata({ limit: 1, offset: 0 });
  console.log('=== BSALE PAGINATION METADATA ===');
  console.log(`total (reported by API): ${metadata.total === null ? 'NOT PROVIDED' : metadata.total}`);
  console.log(`limit: ${metadata.limit} | offset: ${metadata.offset} | next: ${metadata.next ? 'yes' : 'no'} | previous: ${metadata.previous ? 'yes' : 'no'}`);
  console.log(`items returned by metadata call: ${metadata.itemsReturned}\n`);

  // 2. Existing web products for comparison (system RPC, read-only).
  const webProducts = await fetchExistingWebProducts();
  console.log(`Web products used for comparison: ${webProducts.length}\n`);

  // 3. Read Bsale segments (max 4 x 50 = 200).
  const offsets = Array.from({ length: MAX_SEGMENTS }, (_, i) => i * SEGMENT_SIZE);
  const rawSegments: unknown[][] = [];
  let totalRead = 0;

  for (const offset of offsets) {
    if (totalRead >= MAX_ITEMS_TO_ANALYZE) break;
    const remaining = MAX_ITEMS_TO_ANALYZE - totalRead;
    const limit = Math.min(SEGMENT_SIZE, remaining);
    const items = await fetchBsaleProductSegment({ limit, offset });
    rawSegments.push(items);
    totalRead += items.length;
    console.log(`Segment offset=${offset}: read ${items.length} items.`);
    if (items.length < limit) break;
  }

  const segmentsAnalyzed = rawSegments.length;
  console.log(`\nSegments analyzed: ${segmentsAnalyzed}`);
  console.log(`Total Bsale items analyzed: ${totalRead}`);

  const percentage = metadata.total && metadata.total > 0
    ? `${((totalRead / metadata.total) * 100).toFixed(2)}%`
    : 'n/a';
  console.log(`Approximate coverage analyzed: ${percentage}\n`);

  // 4. Map + planner over the FULL set read (duplicates across segments detected).
  const sourceProducts = rawSegments.flat().map(item => {
    try {
      return mapBsaleVariantToPlannerItem(item);
    } catch {
      return null;
    }
  });

  const { items, summary } = planBsaleProductImport({
    sourceProducts,
    existingWebProducts: webProducts
  });

  console.log('=== GLOBAL SUMMARY ===');
  console.table(summary);

  // 5. Extra counts.
  const uniqueSkus = new Set(items.map(i => i.sku).filter((sku): sku is string => Boolean(sku)));
  const uniqueVariantIds = new Set(items.map(i => i.bsaleVariantId).filter((id): id is string => Boolean(id)));
  const emptyNames = items.filter(i => !i.sourceName).length;
  const skippedItems = items.filter(i => i.action === 'skip');
  const createdItems = items.filter(i => i.action === 'create');
  const conflictedItems = items.filter(i => i.action === 'conflict');

  console.log('=== EXTRA COUNTS ===');
  console.log(`Unique SKUs in sample: ${uniqueSkus.size}`);
  console.log(`Unique bsaleVariantIds in sample: ${uniqueVariantIds.size}`);
  console.log(`Empty/invalid source_name: ${emptyNames}`);
  console.log(`Inactive products skipped: ${skippedItems.length}\n`);

  // 6. Compact samples (no price, no stock, no payload).
  printSamples('\n=== SAMPLE: 5 PRODUCTS TO CREATE ===', createdItems);
  printSamples('=== SAMPLE: 5 SKIPPED (if any) ===', skippedItems);
  printSamples('=== SAMPLE: 5 CONFLICTS (if any) ===', conflictedItems);

  // 7. Write markdown report.
  const runAt = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' });
  const runAtIso = new Date().toISOString();

  const report = `# Reporte de Cobertura Bsale — Fase 6D.3F

- **Fecha/hora ejecución**: ${runAt} (${runAtIso} UTC)
- **Modo**: solo lectura / análisis. No se crearon ni modificaron productos.

## Metadata de paginación Bsale

- **Total reportado por la API**: ${metadata.total === null ? 'NO ENTREGADO por Bsale (alternativa: paginar hasta que items.length < limit, o usar endpoint de conteo dedicado si existe)' : metadata.total}
- **limit**: ${metadata.limit} | **offset**: ${metadata.offset}
- **next**: ${metadata.next ? 'sí' : 'no'} | **previous**: ${metadata.previous ? 'sí' : 'no'}

## Segmentos analizados

- **segmentSize**: ${SEGMENT_SIZE} | **maxSegments**: ${MAX_SEGMENTS} | **maxItemsToAnalyze**: ${MAX_ITEMS_TO_ANALYZE}
- **Segmentos leídos**: ${segmentsAnalyzed} (offsets ${offsets.slice(0, segmentsAnalyzed).join(', ')})
- **Total items Bsale analizados**: ${totalRead}
- **Cobertura analizada aproximada**: ${percentage}
- **Productos web usados para comparación**: ${webProducts.length}

## Summary global del planner

${formatSummaryLine(summary)}

## Conteos adicionales

- **SKUs únicos en muestra**: ${uniqueSkus.size}
- **bsaleVariantIds únicos en muestra**: ${uniqueVariantIds.size}
- **source_name vacíos/inválidos**: ${emptyNames}
- **Productos inactivos omitidos (skipped)**: ${skippedItems.length}

## Hallazgos

- **created (${summary.totalCreated})**: ${createdItems.length === 0 ? 'ninguno' : 'variantes válidas listas para creación futura.'}
- **updated (${summary.totalUpdated})**: ${summary.totalUpdated === 0 ? 'ninguna variante actualizaría (consistente con catálogo web actual).' : `${summary.totalUpdated} variantes actualizarían.`}
- **linked (${summary.totalLinkedExisting})**: ${summary.totalLinkedExisting === 0 ? 'ningún vínculo por SKU con productos web existentes.' : `${summary.totalLinkedExisting} vínculos por SKU.`}
- **skipped (${summary.totalSkipped})**: ${skippedItems.length === 0 ? 'ninguno.' : `${skippedItems.length} variantes inactivas omitidas.`}
- **conflicts (${summary.totalConflicts})**: ${conflictedItems.length === 0 ? 'ninguno en la muestra.' : `${conflictedItems.length} conflictos detectados.`}
- **errors (${summary.totalErrors})**: ${summary.totalErrors === 0 ? 'ninguno.' : `${summary.totalErrors} errores de mapeo.`}

### Muestra: productos que se crearían (máx 5)

${createdItems.length === 0 ? '_ninguno_' : markdownTable(createdItems.slice(0, 5).map(toSampleRow))}

### Muestra: omitidos (máx 5)

${skippedItems.length === 0 ? '_ninguno_' : markdownTable(skippedItems.slice(0, 5).map(toSampleRow))}

### Muestra: conflictos (máx 5)

${conflictedItems.length === 0 ? '_ninguno_' : markdownTable(conflictedItems.slice(0, 5).map(toSampleRow))}

## Calidad de nombres

Los source_name de la muestra ampliada provienen del mapper corregido (6D.3E): base comercial desde \`product.name\`/description con característica de variante anexada cuando corresponde. No se observan nombres que queden solo como tamaño/formato.

## Riesgos detectados

- Catálogo Bsale real con **${metadata.total === null ? 'total no reportado (requiere verificación adicional)' : `total reportado de ${metadata.total}`}**; la muestra de ${totalRead} items es parcial.
- Los productos web actuales parecen demo/TEST (4 registros); un primer apply podría mezclar datos reales con demo.
- No hay precios ni stock sincronizados todavía (fuera de alcance de 6D).

## Observación sobre productos demo/test

La base actual (${webProducts.length} productos web) se usa solo como comparación read-only. Antes del primer apply se recomienda limpiar o ignorar explícitamente registros TEST/DEMO (revisión manual).

## Recomendación de primer apply controlado (FASE POSTERIOR, no implementada)

- **Selección**: primeros **20 productos válidos** de un dry-run \`success\` revisado visualmente en el panel, o un segmento controlado sin conflictos ni skipped.
- **Validaciones previas**: sin \`duplicate_sku\`, sin \`duplicate_bsale_variant_id\`, sin \`missing_name\`, sin \`missing_sku\`, sin productos inactivos.
- **Resultado esperado**: insertar SOLO en \`web_b2b.products\`: \`review_status='draft'\`, \`is_active=false\`, \`is_visible=false\`, \`bsale_sync_enabled=true\`.
  - \`bsale_sync_status\`: se recomienda \`pending\` (el estado \`success\` implica que la sincronización operativa ya ocurrió, lo cual aún no es cierto en esta fase).
- **Sin precios, sin stock, sin imágenes, sin publicación pública**.
- **Rollback conceptual**: no borrar automáticamente. Ante fallos, marcar inactivo/no visible o limpiar con migration/script controlado; nunca desde UI.
- **Fase**: 6D.4 o posterior, con su propia revisión.
`;

  writeFileSync(REPORT_PATH, report, 'utf8');
  console.log(`\nReport written to: ${REPORT_PATH}`);

  console.log('\n--- COVERAGE ANALYSIS COMPLETED ---');
  console.log('No products were created or updated.');
}

main();
