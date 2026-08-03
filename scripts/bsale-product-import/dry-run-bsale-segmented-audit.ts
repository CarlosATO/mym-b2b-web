import { fetchBsaleProductSegment } from '../../src/lib/bsale-product-import/bsale-readonly';
import { mapBsaleVariantToPlannerItem } from '../../src/lib/bsale-product-import/bsale-mapper';
import { fetchExistingWebProducts } from '../../src/lib/bsale-product-import/web-products-readonly';
import { planBsaleProductImport } from '../../src/lib/bsale-product-import/planner';
import { persistDryRunAudit } from '../../src/lib/bsale-product-import/import-audit-writer';
import { chunkPlannerItems, summarizePlannerItems } from '../../src/lib/bsale-product-import/chunk-summary';
import { PlannerSummary } from '../../src/lib/bsale-product-import/types';

// Limits for this first segmented version. Never exceeded unless changed
// explicitly in a later phase.
const BATCH_SIZE = 50;
const MAX_BATCHES = 2;
const MAX_TOTAL = 100;

function printSummary(label: string, summary: PlannerSummary) {
  console.log(label);
  console.table(summary);
}

async function main() {
  console.log('DRY RUN SEGMENTED AUDIT ONLY — no product writes.\n');

  const companyId = process.env.MYM_COMPANY_ID;
  if (!companyId) {
    throw new Error('MYM_COMPANY_ID is required.');
  }

  // 1. Read existing web products once via system RPC (read-only).
  const webProducts = await fetchExistingWebProducts();
  console.log(`Web products loaded for comparison: ${webProducts.length}\n`);

  // 2. Read Bsale in segments (max 50 per request, max 2 batches, max 100 total).
  const rawSegments: unknown[][] = [];
  let totalRead = 0;
  let offset = 0;

  while (rawSegments.length < MAX_BATCHES && totalRead < MAX_TOTAL) {
    const remaining = MAX_TOTAL - totalRead;
    const limit = Math.min(BATCH_SIZE, remaining);
    const items = await fetchBsaleProductSegment({ limit, offset });
    rawSegments.push(items);
    totalRead += items.length;
    console.log(`Segment ${rawSegments.length}: read ${items.length} items (offset ${offset}).`);
    if (items.length < limit) {
      break;
    }
    offset += items.length;
  }

  console.log(`Segments read: ${rawSegments.length}`);
  console.log(`Total Bsale items read: ${totalRead}\n`);

  // 3. Map all segments to planner fixtures.
  const sourceProducts = rawSegments.flat().map(item => {
    try {
      return mapBsaleVariantToPlannerItem(item);
    } catch {
      return null;
    }
  });

  // 4. Planner runs over the FULL set read, so duplicates between segments
  //    (e.g. same SKU in segment 1 and segment 2) are detected globally.
  const { items, summary: globalSummary } = planBsaleProductImport({
    sourceProducts,
    existingWebProducts: webProducts
  });

  printSummary('=== GLOBAL SUMMARY ===', globalSummary);

  // 5. Persist audit in chunks of max 50 items (RPC limit). Each chunk becomes
  //    its own dry_run run, with the summary of that chunk only.
  const chunks = chunkPlannerItems(items, BATCH_SIZE);
  const runIds: string[] = [];
  let totalItemsInserted = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkSummary = summarizePlannerItems(chunk);

    const runId = await persistDryRunAudit({
      companyId,
      source: 'script',
      mode: 'dry_run',
      summary: chunkSummary,
      items: chunk
    });

    runIds.push(runId);
    totalItemsInserted += chunk.length;
    console.log(
      `Run ${i + 1}/${chunks.length}: ${runId} — ${chunk.length} items ` +
      `(created=${chunkSummary.totalCreated}, updated=${chunkSummary.totalUpdated}, ` +
      `skipped=${chunkSummary.totalSkipped}, conflicts=${chunkSummary.totalConflicts}, errors=${chunkSummary.totalErrors}).`
    );
  }

  console.log('\n=== PERSISTED AUDIT ===');
  if (runIds.length === 0) {
    console.log('No runs persisted (no planner items).');
  } else {
    runIds.forEach((runId, i) => {
      console.log(`Run ${i + 1} ID: ${runId}`);
    });
  }
  console.log(`Total audit items inserted: ${totalItemsInserted}`);

  console.log('\n--- DRY RUN SEGMENTED COMPLETED ---');
  console.log('No products were created or updated.');
}

main();
