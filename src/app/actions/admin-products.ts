'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { upsertAdminProduct, AdminProduct } from '@/lib/api/admin-catalog';
import { formatMissingPublicationFields, validateProductPublicationReadiness } from '@/lib/utils/product-publication';

export async function saveAdminProduct(formData: FormData, productId?: string) {
  try {
    const supabase = await createClient();
    const companyId = process.env.MYM_COMPANY_ID;

    if (!companyId) {
      throw new Error('Configuración de servidor incompleta (MYM_COMPANY_ID missing).');
    }

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No autorizado');
    }

    const isActive = formData.get('is_active') === 'on';
    const isVisible = formData.get('is_visible') === 'on';
    const isFeatured = formData.get('is_featured') === 'on';
    const bsaleSyncEnabled = formData.get('bsale_sync_enabled') === 'on';
    const orderIndexStr = formData.get('order_index')?.toString() || '0';

    const product: Partial<AdminProduct> & { sku: string; name: string; slug: string } = {
      id: productId,
      sku: formData.get('sku') as string,
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      short_description: formData.get('short_description') as string || null,
      description: formData.get('description') as string || null,
      category_id: formData.get('category_id') as string || null,
      brand_id: formData.get('brand_id') as string || null,
      is_active: isActive,
      is_visible: isVisible,
      is_featured: isFeatured,
      review_status: formData.get('review_status') as string || 'draft',
      order_index: parseInt(orderIndexStr, 10) || 0,
      seo_title: formData.get('seo_title') as string || null,
      seo_description: formData.get('seo_description') as string || null,
      bsale_variant_id: formData.get('bsale_variant_id') as string || null,
      bsale_sync_enabled: bsaleSyncEnabled,
      bsale_sync_status: formData.get('bsale_sync_status') as string || 'pending',
      primary_image_url: formData.get('primary_image_url') as string || null,
    };

    const publicationIntent = isActive || isVisible || isFeatured || product.review_status === 'published';
    if (publicationIntent) {
      const readiness = validateProductPublicationReadiness(product);
      if (!readiness.isReady) {
        throw new Error(`No se puede publicar este producto. Falta: ${formatMissingPublicationFields(readiness.missingFields)}.`);
      }
    }

    if (!product.sku || !product.name || !product.slug) {
      throw new Error('SKU, Nombre y Slug son obligatorios');
    }

    // Normalizar null strings
    if (product.category_id === '') product.category_id = null;
    if (product.brand_id === '') product.brand_id = null;

    await upsertAdminProduct(supabase, companyId, product);

    revalidatePath('/admin/productos');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error saving admin product:', error);
    const message = error instanceof Error ? error.message : 'Error al guardar el producto';
    return { success: false, error: message };
  }
}
