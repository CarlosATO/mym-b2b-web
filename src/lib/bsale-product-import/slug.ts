export function generateInitialSlug(name: string | null, sku: string | null): string | null {
  const sanitize = (val: string) => val
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (name) {
    const nameSlug = sanitize(name);
    if (nameSlug) return nameSlug;
  }

  if (sku) {
    const skuSlug = sanitize(sku);
    if (skuSlug) return skuSlug;
  }

  return null;
}
