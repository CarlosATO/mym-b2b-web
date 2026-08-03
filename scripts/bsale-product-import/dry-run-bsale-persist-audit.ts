import { fetchBsaleProductSample } from '../../src/lib/bsale-product-import/bsale-readonly';
import { mapBsaleVariantToPlannerItem } from '../../src/lib/bsale-product-import/bsale-mapper';
import { fetchExistingWebProducts } from '../../src/lib/bsale-product-import/web-products-readonly';
import { planBsaleProductImport } from '../../src/lib/bsale-product-import/planner';
import { persistDryRunAudit } from '../../src/lib/bsale-product-import/import-audit-writer';

async function main() {
  console.log('--- BSALE PRODUCT IMPORT: DRY RUN AUDIT ---');
  console.log('DRY RUN AUDIT ONLY — no product writes.\n');

  try {
    const companyId = process.env.MYM_COMPANY_ID;
    if (!companyId) {
      throw new Error('MYM_COMPANY_ID is required.');
    }

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
    
    // 5. Persist the audit (This will fail if the RPC is not applied)
    console.log('\nPersisting audit in database...');
    const runId = await persistDryRunAudit({
      companyId,
      source: 'script',
      mode: 'dry_run',
      summary,
      items
    });

    console.log(`\nAudit successfully persisted!`);
    console.log(`Run ID: ${runId}`);
    console.log(`Inserted ${items.length} items into audit log.`);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('\nERROR:', errorMessage);
    
    if (errorMessage.includes('web_b2b_system_create_bsale_product_import_audit')) {
      console.error('\nTECHNICAL BLOCKER:');
      console.error('The RPC "web_b2b_system_create_bsale_product_import_audit" does not exist.');
      console.error('Because web_b2b is private, we need this RPC to persist audits.');
      console.error('Please review the SQL draft in docs/productos/borrador_rpc_auditoria.sql');
    }
  } finally {
    console.log('\n--- DRY RUN COMPLETED ---');
    console.log('No products were created or updated.');
  }
}

main();
