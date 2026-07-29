'use server';

import { createClient } from '@/lib/supabase/server';
import { upsertAdminBrand } from '@/lib/api/admin-catalog';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface BrandActionResponse {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export async function upsertBrandAction(
  prevState: BrandActionResponse | null,
  formData: FormData
): Promise<BrandActionResponse> {
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
    const logo_url = formData.get('logo_url') as string | null;
    const is_active = formData.get('is_active') === 'true';

    // Validaciones básicas manuales (aunque RPC también valida)
    const errors: Record<string, string[]> = {};
    if (!name || name.trim() === '') errors.name = ['El nombre es obligatorio.'];
    if (!slug || slug.trim() === '') errors.slug = ['El slug es obligatorio.'];
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const brandData: Parameters<typeof upsertAdminBrand>[2] = {
      ...(id ? { id } : {}),
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      logo_url: logo_url || null,
      is_active,
    };

    // Llamada a la capa de API que usa la RPC
    await upsertAdminBrand(supabase, companyId, brandData);

  } catch (error: unknown) {
    console.error('Error in upsertBrandAction:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Ocurrió un error inesperado al guardar la marca.'
    };
  }

  // Revalidar y redirigir
  revalidatePath('/admin/marcas');
  revalidatePath('/catalogo');
  redirect('/admin/marcas');
}
