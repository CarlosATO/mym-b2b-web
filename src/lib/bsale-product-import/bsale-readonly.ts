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

export async function fetchBsaleProductSegment({
  limit = 50,
  offset = 0,
}: { limit?: number; offset?: number } = {}) {
  // Bsale v1 paginates /variants.json with limit + offset (response includes
  // offset/limit and next/previous hrefs). Clamp defensively.
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 50);
  const safeOffset = Math.max(Math.floor(offset), 0);

  // Fetch variants from Bsale, read-only GET. No prices, no stock processed.
  const response = await bsaleFetch<BsaleApiResponse<unknown>>(
    `/variants.json?limit=${safeLimit}&offset=${safeOffset}&expand=product`
  );
  return response.items;
}

export type BsalePageMetadata = {
  total: number | null;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
  itemsReturned: number;
};

export async function fetchBsaleVariantPageMetadata({
  limit = 1,
  offset = 0,
}: { limit?: number; offset?: number } = {}) {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 50);
  const safeOffset = Math.max(Math.floor(offset), 0);

  // Read-only metadata call. Only pagination fields are returned; the items
  // themselves are never printed or processed here.
  const response = await bsaleFetch<BsaleApiResponse<unknown>>(
    `/variants.json?limit=${safeLimit}&offset=${safeOffset}&expand=product`
  );

  return {
    total: typeof response.count === 'number' ? response.count : null,
    limit: typeof response.limit === 'number' ? response.limit : safeLimit,
    offset: typeof response.offset === 'number' ? response.offset : safeOffset,
    next: response.next || null,
    previous: response.previous || null,
    itemsReturned: Array.isArray(response.items) ? response.items.length : 0
  } satisfies BsalePageMetadata;
}
