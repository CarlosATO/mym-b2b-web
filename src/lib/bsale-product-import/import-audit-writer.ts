import { PlannerItemResult, PlannerSummary } from './types';
import { createAdminClient } from '../supabase/admin';

export type PersistAuditParams = {
  companyId: string;
  source: 'script' | 'manual' | 'scheduled' | 'admin';
  mode: 'dry_run';
  summary: PlannerSummary;
  items: PlannerItemResult[];
};

const SENSITIVE_KEYS = ['price', 'stock', 'stockQuantity', 'stock_quantity', 'price_amount', 'cost'];

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/_/g, '');
}

const SENSITIVE_KEY_SET = new Set(SENSITIVE_KEYS.map(normalizeKey));

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) &&
    (Object.prototype.toString.call(value) === '[object Object]');
}

function stripSensitiveKeys(value: unknown, depth = 0): unknown {
  if (!isPlainObject(value) || depth > 4) {
    return value;
  }

  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_KEY_SET.has(normalizeKey(key))) {
      continue;
    }
    clean[key] = isPlainObject(val) ? stripSensitiveKeys(val, depth + 1) : val;
  }
  return clean;
}

function sanitizeProposedChanges(proposedChanges: unknown): Record<string, unknown> {
  if (!isPlainObject(proposedChanges)) {
    return {};
  }
  const cleaned = stripSensitiveKeys(proposedChanges);
  return isPlainObject(cleaned) ? cleaned : {};
}

export async function persistDryRunAudit({
  companyId,
  source,
  mode,
  summary,
  items
}: PersistAuditParams): Promise<string> {
  const supabase = createAdminClient();

  // Format items to match the RPC expectations. Only a minimal sanitized payload
  // is persisted: no full Bsale payload, no token, no URL, no price/stock.
  const formattedItems = items.map(item => {
    const payload = {
      dry_run: true,
      proposed_changes: sanitizeProposedChanges(item.proposedChanges)
    };

    return {
      bsale_variant_id: item.bsaleVariantId || '',
      sku: item.sku || '',
      source_name: item.sourceName || '',
      matched_product_id: item.matchedProductId,
      action: item.action,
      status: item.status,
      conflict_type: item.conflictType,
      message: item.message,
      payload
    };
  });

  const { data, error } = await supabase.rpc('web_b2b_system_create_bsale_product_import_audit', {
    target_company_id: companyId,
    p_source: source,
    p_mode: mode,
    p_total_seen: summary.totalSeen,
    p_total_created: summary.totalCreated,
    p_total_updated: summary.totalUpdated,
    p_total_skipped: summary.totalSkipped,
    p_total_conflicts: summary.totalConflicts,
    p_total_errors: summary.totalErrors,
    p_summary: summary,
    p_items: formattedItems
  });

  if (error) {
    throw new Error(`Failed to persist audit: ${error.message}`);
  }

  return data as string;
}
