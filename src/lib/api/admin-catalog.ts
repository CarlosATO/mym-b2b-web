import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------------
// Interfaces
// ----------------------------------------------------------------------

export interface AdminCategory {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  banner_image_url: string | null;
  display_style: 'grid' | 'list' | 'banner' | 'hidden';
  icon_name: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_active: boolean;
  is_visible_home: boolean;
  is_visible_catalog: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface AdminBrand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------
// Funciones de Categorías
// ----------------------------------------------------------------------

export async function getAdminCategories(
  supabase: SupabaseClient,
  companyId: string
): Promise<AdminCategory[]> {
  const { data, error } = await supabase.rpc('web_b2b_admin_list_categories', {
    target_company_id: companyId
  });

  if (error) {
    console.error('Error fetching admin categories:', error);
    throw error;
  }

  return data as AdminCategory[];
}

export async function upsertAdminCategory(
  supabase: SupabaseClient,
  companyId: string,
  category: Partial<AdminCategory> & { name: string; slug: string; display_style: string }
): Promise<string> {
  const { data, error } = await supabase.rpc('web_b2b_admin_upsert_category', {
    p_category_id: category.id || null,
    p_target_company_id: companyId,
    p_parent_id: category.parent_id || null,
    p_name: category.name,
    p_slug: category.slug,
    p_description: category.description || null,
    p_image_url: category.image_url || null,
    p_banner_image_url: category.banner_image_url || null,
    p_display_style: category.display_style,
    p_icon_name: category.icon_name || null,
    p_seo_title: category.seo_title || null,
    p_seo_description: category.seo_description || null,
    p_is_active: category.is_active ?? true,
    p_is_visible_home: category.is_visible_home ?? false,
    p_is_visible_catalog: category.is_visible_catalog ?? true,
    p_order_index: category.order_index ?? 0
  });

  if (error) {
    console.error('Error upserting admin category:', error);
    throw error;
  }

  return data as string;
}

// ----------------------------------------------------------------------
// Funciones de Marcas
// ----------------------------------------------------------------------

export async function getAdminBrands(
  supabase: SupabaseClient,
  companyId: string
): Promise<AdminBrand[]> {
  const { data, error } = await supabase.rpc('web_b2b_admin_list_brands', {
    target_company_id: companyId
  });

  if (error) {
    console.error('Error fetching admin brands:', error);
    throw error;
  }

  return data as AdminBrand[];
}

export async function upsertAdminBrand(
  supabase: SupabaseClient,
  companyId: string,
  brand: Partial<AdminBrand> & { name: string; slug: string }
): Promise<string> {
  const { data, error } = await supabase.rpc('web_b2b_admin_upsert_brand', {
    p_brand_id: brand.id || null,
    p_target_company_id: companyId,
    p_name: brand.name,
    p_slug: brand.slug,
    p_logo_url: brand.logo_url || null,
    p_is_active: brand.is_active ?? true
  });

  if (error) {
    console.error('Error upserting admin brand:', error);
    throw error;
  }

  return data as string;
}

// ----------------------------------------------------------------------
// Funciones de Productos
// ----------------------------------------------------------------------

export interface AdminProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  brand_id: string | null;
  brand_name: string | null;
  category_id: string | null;
  category_name: string | null;
  is_active: boolean;
  is_visible: boolean;
  is_featured: boolean;
  review_status: string;
  order_index: number;
  seo_title: string | null;
  seo_description: string | null;
  bsale_variant_id: string | null;
  bsale_sync_enabled: boolean;
  bsale_sync_status: string;
  bsale_last_checked_at: string | null;
  primary_image_url: string | null;
  created_at: string;
  updated_at: string;
  total_count: number;
}

export interface GetAdminProductsParams {
  search_query?: string | null;
  filter_review_status?: string | null;
  filter_category_id?: string | null;
  filter_brand_id?: string | null;
  page_size?: number;
  page_number?: number;
}

export async function getAdminProducts(
  supabase: SupabaseClient,
  companyId: string,
  params?: GetAdminProductsParams
): Promise<AdminProduct[]> {
  const { data, error } = await supabase.rpc('web_b2b_admin_list_products', {
    p_target_company_id: companyId,
    search_query: params?.search_query ?? null,
    filter_review_status: params?.filter_review_status ?? null,
    filter_category_id: params?.filter_category_id ?? null,
    filter_brand_id: params?.filter_brand_id ?? null,
    page_size: params?.page_size ?? 50,
    page_number: params?.page_number ?? 1
  });

  if (error) {
    console.error('Error fetching admin products:', error);
    throw error;
  }

  return data as AdminProduct[];
}

export async function getAdminProduct(
  supabase: SupabaseClient,
  companyId: string,
  productId: string
): Promise<AdminProduct | null> {
  const { data, error } = await supabase.rpc('web_b2b_admin_get_product', {
    p_target_company_id: companyId,
    p_product_id: productId
  });

  if (error) {
    console.error('Error fetching admin product:', error);
    throw error;
  }

  if (!data || data.length === 0) return null;
  return data[0] as AdminProduct;
}

export async function upsertAdminProduct(
  supabase: SupabaseClient,
  companyId: string,
  product: Partial<AdminProduct> & { sku: string; name: string; slug: string }
): Promise<string> {
  const { data, error } = await supabase.rpc('web_b2b_admin_upsert_product', {
    p_product_id: product.id || null,
    p_target_company_id: companyId,
    p_sku: product.sku,
    p_name: product.name,
    p_slug: product.slug,
    p_short_description: product.short_description || null,
    p_description: product.description || null,
    p_brand_id: product.brand_id || null,
    p_category_id: product.category_id || null,
    p_is_active: product.is_active ?? false,
    p_is_visible: product.is_visible ?? false,
    p_is_featured: product.is_featured ?? false,
    p_review_status: product.review_status || 'draft',
    p_order_index: product.order_index ?? 0,
    p_seo_title: product.seo_title || null,
    p_seo_description: product.seo_description || null,
    p_bsale_variant_id: product.bsale_variant_id || null,
    p_bsale_sync_enabled: product.bsale_sync_enabled ?? false,
    p_bsale_sync_status: product.bsale_sync_status || 'pending',
    p_primary_image_url: product.primary_image_url || null
  });

  if (error) {
    console.error('Error upserting admin product:', error);
    throw error;
  }

  return data as string;
}

