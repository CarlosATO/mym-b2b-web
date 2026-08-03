import { 
  ExistingWebProductFixture, 
  PlannerResult,
  PlannerItemResult,
  PlannerSummary
} from './types';
import { normalizeImportedProduct } from './normalizers';
import { generateInitialSlug } from './slug';

type PlannerParams = {
  sourceProducts: unknown[];
  existingWebProducts: ExistingWebProductFixture[];
};

export function planBsaleProductImport({ sourceProducts, existingWebProducts }: PlannerParams): PlannerResult {
  const items: PlannerItemResult[] = [];
  const summary: PlannerSummary = {
    totalSeen: 0,
    totalCreated: 0,
    totalUpdated: 0,
    totalLinkedExisting: 0,
    totalSkipped: 0,
    totalConflicts: 0,
    totalErrors: 0
  };

  const skuCounts = new Map<string, number>();
  const bsaleVariantIdCounts = new Map<string, number>();

  for (const raw of sourceProducts) {
    try {
      const imported = normalizeImportedProduct(raw);
      if (imported.sku) {
        skuCounts.set(imported.sku, (skuCounts.get(imported.sku) || 0) + 1);
      }
      if (imported.bsaleVariantId) {
        bsaleVariantIdCounts.set(imported.bsaleVariantId, (bsaleVariantIdCounts.get(imported.bsaleVariantId) || 0) + 1);
      }
    } catch {
      // ignore in pre-scan
    }
  }

  for (const raw of sourceProducts) {
    summary.totalSeen++;
    
    let imported;
    try {
      imported = normalizeImportedProduct(raw);
    } catch (err: unknown) {
      summary.totalErrors++;
      const errorMessage = err instanceof Error ? err.message : 'Invalid payload';
      items.push({
        action: 'error',
        status: 'error',
        sku: null,
        bsaleVariantId: null,
        sourceName: null,
        matchedProductId: null,
        conflictType: 'invalid_payload',
        message: errorMessage,
        proposedChanges: null,
        shouldWriteProduct: false
      });
      continue;
    }

    if (!imported.sku) {
      summary.totalConflicts++;
      items.push({
        action: 'conflict',
        status: 'conflict',
        sku: null,
        bsaleVariantId: imported.bsaleVariantId,
        sourceName: imported.name,
        matchedProductId: null,
        conflictType: 'missing_sku',
        message: 'Product missing SKU',
        proposedChanges: null,
        shouldWriteProduct: false
      });
      continue;
    }

    if (!imported.name) {
      summary.totalConflicts++;
      items.push({
        action: 'conflict',
        status: 'conflict',
        sku: imported.sku,
        bsaleVariantId: imported.bsaleVariantId,
        sourceName: null,
        matchedProductId: null,
        conflictType: 'missing_name',
        message: 'Product missing name',
        proposedChanges: null,
        shouldWriteProduct: false
      });
      continue;
    }

    if (imported.bsaleVariantId && (bsaleVariantIdCounts.get(imported.bsaleVariantId) || 0) > 1) {
      summary.totalConflicts++;
      items.push({
        action: 'conflict',
        status: 'conflict',
        sku: imported.sku,
        bsaleVariantId: imported.bsaleVariantId,
        sourceName: imported.name,
        matchedProductId: null,
        conflictType: 'duplicate_bsale_variant_id',
        message: 'Duplicate bsaleVariantId in payload',
        proposedChanges: null,
        shouldWriteProduct: false
      });
      continue;
    }

    if (imported.sku && (skuCounts.get(imported.sku) || 0) > 1) {
      summary.totalConflicts++;
      items.push({
        action: 'conflict',
        status: 'conflict',
        sku: imported.sku,
        bsaleVariantId: imported.bsaleVariantId,
        sourceName: imported.name,
        matchedProductId: null,
        conflictType: 'duplicate_sku',
        message: 'Duplicate SKU in payload',
        proposedChanges: null,
        shouldWriteProduct: false
      });
      continue;
    }

    const matchByVariantId = imported.bsaleVariantId 
      ? existingWebProducts.find(p => p.bsaleVariantId === imported.bsaleVariantId)
      : undefined;
      
    const matchBySku = existingWebProducts.find(p => p.sku === imported.sku);

    if (matchByVariantId && matchBySku && matchByVariantId.id !== matchBySku.id) {
      summary.totalConflicts++;
      items.push({
        action: 'conflict',
        status: 'conflict',
        sku: imported.sku,
        bsaleVariantId: imported.bsaleVariantId,
        sourceName: imported.name,
        matchedProductId: null,
        conflictType: 'sku_variant_mismatch',
        message: 'Variant ID and SKU match different existing web products',
        proposedChanges: null,
        shouldWriteProduct: false
      });
      continue;
    }

    if (!matchByVariantId && !matchBySku) {
      if (!imported.isActiveInBsale) {
        summary.totalSkipped++;
        items.push({
          action: 'skip',
          status: 'skipped',
          sku: imported.sku,
          bsaleVariantId: imported.bsaleVariantId,
          sourceName: imported.name,
          matchedProductId: null,
          message: 'Producto inactivo en Bsale, no se importa en fase inicial.',
          proposedChanges: null,
          shouldWriteProduct: false
        });
        continue;
      }

      summary.totalCreated++;
      items.push({
        action: 'create',
        status: 'pending',
        sku: imported.sku,
        bsaleVariantId: imported.bsaleVariantId,
        sourceName: imported.name,
        matchedProductId: null,
        message: 'New product to create',
        proposedChanges: {
          sku: imported.sku,
          bsale_variant_id: imported.bsaleVariantId,
          name: imported.name,
          slug: generateInitialSlug(imported.name, imported.sku),
          review_status: 'draft',
          is_active: false,
          is_visible: false,
          bsale_sync_enabled: true,
          bsale_sync_status: 'pending'
        },
        shouldWriteProduct: false
      });
      continue;
    }

    if (matchByVariantId) {
      if (!imported.isActiveInBsale && matchByVariantId.isActive) {
        summary.totalConflicts++;
        items.push({
          action: 'conflict',
          status: 'conflict',
          sku: imported.sku,
          bsaleVariantId: imported.bsaleVariantId,
          sourceName: imported.name,
          matchedProductId: matchByVariantId.id,
          conflictType: 'inactive_in_bsale_active_in_web',
          message: 'Product inactive in Bsale but active in Web',
          proposedChanges: null,
          shouldWriteProduct: false
        });
        continue;
      }

      summary.totalUpdated++;
      items.push({
        action: 'update',
        status: 'pending',
        sku: imported.sku,
        bsaleVariantId: imported.bsaleVariantId,
        sourceName: imported.name,
        matchedProductId: matchByVariantId.id,
        message: 'Update existing product operational data',
        proposedChanges: {
          bsale_sync_status: 'success'
        },
        shouldWriteProduct: false
      });
      continue;
    }

    if (matchBySku && !matchByVariantId) {
      if (!imported.isActiveInBsale && matchBySku.isActive) {
        summary.totalConflicts++;
        items.push({
          action: 'conflict',
          status: 'conflict',
          sku: imported.sku,
          bsaleVariantId: imported.bsaleVariantId,
          sourceName: imported.name,
          matchedProductId: matchBySku.id,
          conflictType: 'inactive_in_bsale_active_in_web',
          message: 'Product inactive in Bsale but active in Web',
          proposedChanges: null,
          shouldWriteProduct: false
        });
        continue;
      }

      summary.totalLinkedExisting++;
      items.push({
        action: 'link_existing',
        status: 'pending',
        sku: imported.sku,
        bsaleVariantId: imported.bsaleVariantId,
        sourceName: imported.name,
        matchedProductId: matchBySku.id,
        message: 'Link bsale variant to existing web product by SKU',
        proposedChanges: {
          bsale_variant_id: imported.bsaleVariantId,
          bsale_sync_status: 'success'
        },
        shouldWriteProduct: false
      });
      continue;
    }
  }

  return { items, summary };
}
