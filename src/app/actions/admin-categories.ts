'use server';

import { createClient } from '@/lib/supabase/server';
import { upsertAdminCategory } from '@/lib/api/admin-catalog';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface ActionResponse {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export async function upsertCategoryAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const companyId = process.env.MYM_COMPANY_ID;

    if (!companyId) {
      throw new Error('Configuración del servidor incompleta (MYM_COMPANY_ID missing).');
    }

    // Extraer datos del formulario
    const id = formData.get('id') as string | null;
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const parent_id = formData.get('parent_id') as string | null;
    const description = formData.get('description') as string | null;
    const display_style = (formData.get('display_style') as string) as "grid" | "list" | "banner" | "hidden";
    const image_url = formData.get('image_url') as string | null;
    const banner_image_url = formData.get('banner_image_url') as string | null;
    const icon_name = formData.get('icon_name') as string | null;
    const seo_title = formData.get('seo_title') as string | null;
    const seo_description = formData.get('seo_description') as string | null;
    const is_active = formData.get('is_active') === 'true';
    const is_visible_home = formData.get('is_visible_home') === 'true';
    const is_visible_catalog = formData.get('is_visible_catalog') === 'true';
    const order_index = parseInt(formData.get('order_index') as string || '0', 10);

    // Validaciones básicas manuales (aunque RPC también valida)
    const errors: Record<string, string[]> = {};
    if (!name || name.trim() === '') errors.name = ['El nombre es obligatorio.'];
    if (!slug || slug.trim() === '') errors.slug = ['El slug es obligatorio.'];
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const categoryData: Parameters<typeof upsertAdminCategory>[2] = {
      ...(id ? { id } : {}),
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      parent_id: parent_id && parent_id !== '' ? parent_id : null,
      description: description || null,
      display_style,
      image_url: image_url || null,
      banner_image_url: banner_image_url || null,
      icon_name: icon_name || null,
      seo_title: seo_title || null,
      seo_description: seo_description || null,
      is_active,
      is_visible_home,
      is_visible_catalog,
      order_index
    };

    // Llamada a la capa de API que usa la RPC
    await upsertAdminCategory(supabase, companyId, categoryData);

  } catch (error: unknown) {
    console.error('Error in upsertCategoryAction:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Ocurrió un error inesperado al guardar la categoría.'
    };
  }

  // Revalidar y redirigir
  revalidatePath('/admin/categorias');
  revalidatePath('/catalogo');
  redirect('/admin/categorias');
}
