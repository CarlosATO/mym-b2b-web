import { planBsaleProductImport } from '../../src/lib/bsale-product-import/planner';
import { bsaleSourceProductsFixture, existingWebProductsFixture } from '../../src/lib/bsale-product-import/fixtures';

function main() {
  console.log('--- BSALE PRODUCT IMPORT: LOCAL FIXTURE DRY RUN ---\n');
  
  const { items, summary } = planBsaleProductImport({
    sourceProducts: bsaleSourceProductsFixture,
    existingWebProducts: existingWebProductsFixture
  });

  console.log('=== SUMMARY ===');
  console.table(summary);
  console.log('\n=== ITEMS RESULT ===');
  
  const compactItems = items.map(i => ({
    action: i.action,
    status: i.status,
    sku: i.sku,
    bsaleVariantId: i.bsaleVariantId,
    conflictType: i.conflictType || '-',
    matchedProductId: i.matchedProductId || '-',
    message: i.message
  }));

  console.table(compactItems);
  
  console.log('\n--- DRY RUN COMPLETED ---');
  console.log('NOTE: No Supabase connection was made. No products were mutated.');
}

main();
