export interface Brand {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  logo_url?: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  company_id: string;
  parent_id?: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  company_id: string;
  brand_id?: string;
  category_id?: string;
  bsale_variant_id?: string;
  name: string;
  slug: string;
  sku?: string;
  short_description?: string;
  description?: string;
  is_active: boolean;
  is_visible: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  order_index: number;
}

export interface ProductPrice {
  id: string;
  product_id: string;
  company_id: string;
  price: number;
  currency: string;
  source: 'bsale' | 'manual' | 'import';
  updated_at: string;
}

export type AvailabilityStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';

export interface ProductStock {
  id: string;
  product_id: string;
  company_id: string;
  quantity: number;
  status: AvailabilityStatus;
  source: 'bsale' | 'manual' | 'import';
  updated_at: string;
}

export interface Banner {
  id: string;
  company_id: string;
  title?: string;
  image_url: string;
  link_url?: string;
  position: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: string;
  company_id: string;
  product_id?: string;
  title: string;
  description?: string;
  badge_text?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

export type CustomerAccessStatus = 'pending' | 'approved' | 'rejected';

export interface CustomerAccess {
  user_id: string;
  company_id: string;
  customer_email: string;
  business_name?: string;
  tax_id?: string;
  status: CustomerAccessStatus;
  can_view_prices: boolean;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
}

export type AdminRole = 'WEB_SUPER_ADMIN' | 'WEB_ADMIN' | 'WEB_CONTENT_MANAGER' | 'WEB_SALES';

export interface AdminAccess {
  id: string;
  company_id: string;
  user_id: string;
  role: AdminRole;
  is_active: boolean;
  mfa_required: boolean;
  created_at: string;
  updated_at: string;
}
