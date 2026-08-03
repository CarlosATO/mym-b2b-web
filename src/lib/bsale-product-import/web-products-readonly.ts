import { createAdminClient } from '../supabase/admin';
import { ExistingWebProductFixture } from './types';

export async function fetchExistingWebProducts(): Promise<ExistingWebProductFixture[]> {
  const supabase = createAdminClient();
  const companyId = process.env.MYM_COMPANY_ID;

  if (!companyId) {
    throw new Error('MYM_COMPANY_ID is required to fetch web products');
  }

  const { data, error } = await supabase.rpc('web_b2b_system_list_products_for_import', {
    target_company_id: companyId
  });

  if (error) {
    throw new Error(`Failed to fetch web products: ${error.message}`);
  }

  if (!data) return [];

  return data.map((p: Record<string, unknown>) => {
    const rawStatus = p.review_status as string;
    const isValidStatus = ['draft', 'ready', 'published', 'hidden'].includes(rawStatus);
    const reviewStatus = isValidStatus ? (rawStatus as 'draft' | 'ready' | 'published') : 'draft';

    return {
      id: p.id as string,
      sku: (p.sku as string) || null,
      bsaleVariantId: (p.bsale_variant_id as string) || null,
      name: p.name as string,
      slug: p.slug as string,
      isActive: p.is_active as boolean,
      isVisible: p.is_visible as boolean,
      reviewStatus,
      hasCuratedContent: p.has_curated_content as boolean
    };
  });
}
