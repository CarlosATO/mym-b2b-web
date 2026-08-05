export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const PRODUCT_IMAGE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type ProductImageMimeType = (typeof PRODUCT_IMAGE_ALLOWED_MIME_TYPES)[number];

export function getProductImageExtension(mimeType: string) {
  switch (mimeType) {
    case 'image/jpg':
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return null;
  }
}

export function isAllowedProductImageMimeType(mimeType: string) {
  return mimeType === 'image/jpg' || PRODUCT_IMAGE_ALLOWED_MIME_TYPES.includes(mimeType as ProductImageMimeType);
}

export function buildProductImageObjectPath({
  companyId,
  productId,
  extension,
}: {
  companyId: string;
  productId: string;
  extension: string;
}) {
  const randomId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${companyId}/${productId}/${randomId}.${extension}`;
}
