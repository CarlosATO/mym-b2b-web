export interface ProductPublicationInput {
  category_id?: string | null;
  brand_id?: string | null;
  primary_image_url?: string | null;
  name?: string | null;
  slug?: string | null;
  short_description?: string | null;
  description?: string | null;
}

function hasText(value?: string | null) {
  return Boolean((value ?? '').trim());
}

export function validateProductPublicationReadiness(input: ProductPublicationInput) {
  const missingFields: string[] = [];

  if (!hasText(input.category_id)) missingFields.push('categoría');
  if (!hasText(input.brand_id)) missingFields.push('marca');
  if (!hasText(input.primary_image_url)) missingFields.push('imagen principal');
  if (!hasText(input.name)) missingFields.push('nombre comercial');
  if (!hasText(input.slug)) missingFields.push('slug');
  if (!hasText(input.short_description) && !hasText(input.description)) missingFields.push('descripción comercial');

  return {
    isReady: missingFields.length === 0,
    missingFields,
  };
}

export function formatMissingPublicationFields(missingFields: string[]) {
  if (missingFields.length === 0) return '';
  if (missingFields.length === 1) return missingFields[0];
  if (missingFields.length === 2) return `${missingFields[0]} y ${missingFields[1]}`;
  return `${missingFields.slice(0, -1).join(', ')} y ${missingFields[missingFields.length - 1]}`;
}
