import { bsaleFetch } from '../bsale/client';

export type BsaleApiResponse<T> = {
  count: number;
  href: string;
  next?: string;
  previous?: string;
  limit: number;
  offset: number;
  items: T[];
};

export async function fetchBsaleProductSample({ limit = 20 }: { limit?: number } = {}) {
  // Ensure limit is between 1 and 50
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  
  // Fetch variants from Bsale
  // We use variants because they contain SKU (code/barCode) and variantId
  const response = await bsaleFetch<BsaleApiResponse<unknown>>(`/variants.json?limit=${safeLimit}&expand=product`);
  return response.items;
}
