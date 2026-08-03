import { fetchBsaleProductSample } from '../../src/lib/bsale-product-import/bsale-readonly';
import { mapBsaleVariantToPlannerItem } from '../../src/lib/bsale-product-import/bsale-mapper';
import { fetchExistingWebProducts } from '../../src/lib/bsale-product-import/web-products-readonly';
import { planBsaleProductImport } from '../../src/lib/bsale-product-import/planner';

async function main() {
  console.log('--- BSALE PRODUCT IMPORT: REAL BSALE DRY RUN ---');
  console.log('DRY RUN ONLY — no writes to Supabase, no product mutations.\n');

  try {
    // 1. Fetch web products for comparison
    console.log('Fetching existing web products from Supabase...');
    const webProducts = await fetchExistingWebProducts();
    console.log(`Fetched ${webProducts.length} web products.\n`);

    // 2. Fetch sample from Bsale
    console.log('Fetching variant sample from Bsale (limit: 20)...');
    const rawBsaleItems = await fetchBsaleProductSample({ limit: 20 });
    console.log(`Fetched ${rawBsaleItems.length} items from Bsale.\n`);



    // 3. Map Bsale items to our internal contract
    const sourceProducts = rawBsaleItems.map(item => {
      try {
        return mapBsaleVariantToPlannerItem(item);
      } catch {
        // Return null for invalid payloads to be caught by the planner
        return null;
      }
    });

    // 4. Run the planner
    const { items, summary } = planBsaleProductImport({
      sourceProducts,
      existingWebProducts: webProducts
    });

    console.log('=== SUMMARY ===');
    console.table(summary);
    
    console.log('\n=== ITEMS RESULT (Top 50) ===');
    const compactItems = items.slice(0, 50).map(i => ({
      action: i.action,
      status: i.status,
      sku: i.sku,
      bsaleVariantId: i.bsaleVariantId,
      conflictType: i.conflictType || '-',
      matchedProductId: i.matchedProductId || '-',
      message: i.message
    }));

    console.table(compactItems);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('\nERROR:', errorMessage);
    if (errorMessage.includes('BSALE_ACCESS_TOKEN')) {
      console.error('Missing BSALE_ACCESS_TOKEN in environment variables.');
    } else if (errorMessage.includes('MYM_COMPANY_ID')) {
      console.error('Missing MYM_COMPANY_ID in environment variables.');
    } else if (errorMessage.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.');
    } else if (errorMessage.includes('NEXT_PUBLIC_SUPABASE_URL')) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL in environment variables.');
    }
  } finally {
    console.log('\n--- DRY RUN COMPLETED ---');
    console.log('No products were created or updated.');
  }
}

main();
