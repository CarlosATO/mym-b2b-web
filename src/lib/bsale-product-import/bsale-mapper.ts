import { BsaleVariantFixture } from './types';

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

  // Name priority: variant.description -> product.name -> product.description -> variant.name -> fallback null
  let name: string | null = null;
  const p = v.product as Record<string, unknown> | undefined;

  if (typeof v.description === 'string' && v.description.trim() !== '') {
    name = v.description.trim();
  } else if (p && typeof p.name === 'string' && p.name.trim() !== '') {
    name = p.name.trim();
  } else if (p && typeof p.description === 'string' && p.description.trim() !== '') {
    name = p.description.trim();
  } else if (typeof v.name === 'string' && v.name.trim() !== '') {
    name = v.name.trim();
  }
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
