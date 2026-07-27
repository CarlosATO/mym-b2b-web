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
