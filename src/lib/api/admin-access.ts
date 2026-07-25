import 'server-only';
import { createClient } from '@/lib/supabase/server';

export interface AdminAccessInfo {
  role: string;
  company_id: string;
  is_active: boolean;
  mfa_required: boolean;
}

export async function getCurrentWebAdminAccess(): Promise<AdminAccessInfo | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return null; // Estado controlado: sin sesión
  }

  // Consulta respetando RLS (el usuario solo puede ver si tiene permiso)
  const { data, error } = await supabase
    .schema('web_b2b')
    .from('admin_access')
    .select('role, company_id, is_active, mfa_required')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return null; // Acceso denegado controlado
  }

  return {
    role: data.role,
    company_id: data.company_id,
    is_active: data.is_active,
    mfa_required: data.mfa_required
  };
}
