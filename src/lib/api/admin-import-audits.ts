import 'server-only';
import { createClient } from '@/lib/supabase/server';

// ----------------------------------------------------------------------
// Interfaces (solo lectura, RPCs admin)
// ----------------------------------------------------------------------

export interface AdminImportRun {
  id: string;
  source: string;
  mode: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  total_seen: number;
  total_created: number;
  total_updated: number;
  total_skipped: number;
  total_conflicts: number;
  total_errors: number;
  error_message: string | null;
}

export interface AdminImportItem {
  id: string;
  run_id: string;
  bsale_variant_id: string | null;
  sku: string | null;
  source_name: string | null;
  matched_product_id: string | null;
  action: string;
  status: string;
  conflict_type: string | null;
  message: string | null;
  created_at: string;
  total_count: number;
}

function getCompanyId(): string {
  const companyId = process.env.MYM_COMPANY_ID;
  if (!companyId) {
    throw new Error('Configuración de servidor incompleta (MYM_COMPANY_ID missing).');
  }
  return companyId;
}

// ----------------------------------------------------------------------
// RPCs admin read-only (solo lectura; NO service_role)
// ----------------------------------------------------------------------

export async function getBsaleProductImportRuns(): Promise<AdminImportRun[]> {
  const supabase = await createClient();
  const companyId = getCompanyId();

  const { data, error } = await supabase.rpc('web_b2b_admin_list_bsale_product_import_runs', {
    target_company_id: companyId
  });

  if (error) {
    console.error('Error fetching Bsale import runs:', error);
    throw error;
  }

  return (data ?? []) as AdminImportRun[];
}

export async function getBsaleProductImportItems(
  runId: string,
  pageSize = 100,
  pageNumber = 1
): Promise<AdminImportItem[]> {
  const supabase = await createClient();
  const companyId = getCompanyId();

  const { data, error } = await supabase.rpc('web_b2b_admin_list_bsale_product_import_items', {
    target_company_id: companyId,
    import_run_id: runId,
    page_size: pageSize,
    page_number: pageNumber
  });

  if (error) {
    console.error('Error fetching Bsale import items:', error);
    throw error;
  }

  return (data ?? []) as AdminImportItem[];
}
