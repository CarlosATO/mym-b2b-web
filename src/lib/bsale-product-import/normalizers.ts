export function normalizeSku(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

export function normalizeBsaleVariantId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

export function normalizeName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
  if (typeof value === 'number') return value === 1;
  return false;
}

export function normalizeImportedProduct(raw: unknown) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid payload');
  }
  const payload = raw as Record<string, unknown>;
  return {
    bsaleVariantId: normalizeBsaleVariantId(payload.bsaleVariantId),
    sku: normalizeSku(payload.sku),
    name: normalizeName(payload.name),
    isActiveInBsale: normalizeBoolean(payload.isActiveInBsale),
    stockQuantity: payload.stockQuantity ?? null,
    price: payload.price ?? null,
  };
}
