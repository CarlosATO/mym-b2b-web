import 'server-only';
import { createClient } from '@/lib/supabase/server';

const MYM_COMPANY_ID = process.env.MYM_COMPANY_ID;

export async function getPublicCatalogProducts() {
  if (!MYM_COMPANY_ID) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc('web_b2b_get_public_catalog_products', { target_company_id: MYM_COMPANY_ID });
  if (error) {
    console.error('Error fetching catalog:', error);
    return [];
  }
  return data || [];
}

export async function getPublicProductBySlug(slug: string) {
  if (!MYM_COMPANY_ID) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc('web_b2b_get_public_product_by_slug', { target_company_id: MYM_COMPANY_ID, product_slug: slug });
  if (error) {
    console.error('Error fetching product by slug:', error);
    return null;
  }
  return data?.[0] || null;
}

export async function getPublicBrands() {
  if (!MYM_COMPANY_ID) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc('web_b2b_get_public_brands', { target_company_id: MYM_COMPANY_ID });
  if (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
  return data || [];
}

export async function getPublicCategories() {
  if (!MYM_COMPANY_ID) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc('web_b2b_get_public_categories', { target_company_id: MYM_COMPANY_ID });
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data || [];
}

export async function getPublicBanners() {
  if (!MYM_COMPANY_ID) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc('web_b2b_get_public_banners', { target_company_id: MYM_COMPANY_ID });
  if (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
  return data || [];
}

export async function getPublicPromotions() {
  if (!MYM_COMPANY_ID) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc('web_b2b_get_public_promotions', { target_company_id: MYM_COMPANY_ID });
  if (error) {
    console.error('Error fetching promotions:', error);
    return [];
  }
  return data || [];
}
