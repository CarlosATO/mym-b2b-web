import { BsaleVariantFixture } from './types';

export function combineProductNameAndVariantDescription(baseName: string, variantDescription: string): string {
  const base = baseName.trim();
  const extra = variantDescription.trim();

  if (base === '') {
    return extra;
  }
  if (extra === '') {
    return base;
  }

  const baseLower = base.toLowerCase();
  const extraLower = extra.toLowerCase();

  // Do not duplicate when the variant description is repeated or already included in the base name.
  if (baseLower === extraLower || baseLower.includes(extraLower)) {
    return base;
  }

  return `${base} ${extra}`.replace(/\s+/g, ' ').trim();
}

export function getBestProductNameFromBsaleVariant(rawVariant: unknown): string | null {
  if (!rawVariant || typeof rawVariant !== 'object') {
    return null;
  }

  const v = rawVariant as Record<string, unknown>;
  const p = v.product as Record<string, unknown> | undefined;

  const variantDescription = typeof v.description === 'string' ? v.description.trim() : '';
  const variantName = typeof v.name === 'string' ? v.name.trim() : '';

  // Priority: product.name -> product.description (commercial/base name).
  let baseName: string | null = null;
  if (p && typeof p.name === 'string' && p.name.trim() !== '') {
    baseName = p.name.trim();
  } else if (p && typeof p.description === 'string' && p.description.trim() !== '') {
    baseName = p.description.trim();
  }

  if (baseName) {
    // Optionally append the variant characteristic (e.g. "2KG") to the base name.
    return combineProductNameAndVariantDescription(baseName, variantDescription);
  }

  // Fallback: only when there is no product name/description, use the variant
  // description (characteristic) as the name. Never invent a name from the SKU.
  if (variantDescription !== '') {
    return variantDescription;
  }
  if (variantName !== '') {
    return variantName;
  }
  return null;
}

export function mapBsaleVariantToPlannerItem(rawVariant: unknown): BsaleVariantFixture {
  // We use unknown and cast locally to a flexible record to avoid any type checking errors
  const v = rawVariant as Record<string, unknown>;

  if (!v || typeof v !== 'object') {
    throw new Error('Invalid payload from Bsale');
  }

  // Extract fields defensively
  const bsaleVariantId = v.id ? String(v.id) : null;

  // SKU can come from code or barCode. We prefer code, then barCode.
  let sku: string | null = null;
  if (typeof v.code === 'string' && v.code.trim() !== '') {
    sku = v.code.trim();
  } else if (typeof v.barCode === 'string' && v.barCode.trim() !== '') {
    sku = v.barCode.trim();
  }

  // Name priority: product.name -> product.description, appending the variant
  // characteristic when useful, and falling back to variant.description only
  // when there is no product name/description.
  const name = getBestProductNameFromBsaleVariant(rawVariant);

  // State 0 is usually inactive in Bsale, 1 is active.
  const isActiveInBsale = v.state !== 0;

  return {
    bsaleVariantId,
    sku,
    name,
    isActiveInBsale,
    stockQuantity: null, // Ignored for planner
    price: null          // Ignored for planner
  };
}
