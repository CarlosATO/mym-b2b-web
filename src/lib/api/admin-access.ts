import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AdminAccessInfo {
  role: string;
  company_id: string;
  is_active: boolean;
  mfa_required: boolean;
}

export async function getWebAdminAccessForUser({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<AdminAccessInfo | null> {
  const companyId = process.env.MYM_COMPANY_ID;
  if (!companyId) {
    console.error('MYM_COMPANY_ID no configurado');
    return null;
  }

  console.log('[DEBUG AUTH] Evaluando admin_access para:', {
    userId,
    companyId,
  });

  // Consulta usando el wrapper público para evadir el bloqueo de PGRST106
  const { data, error } = await supabase
    .rpc('web_b2b_get_current_admin_access', { target_company_id: companyId })
    .maybeSingle();

  console.log('[DEBUG AUTH] Resultado de la query:', {
    huboError: !!error,
    errorObj: error,
    encontroData: !!data
  });

  if (error || !data) {
    return null;
  }

  const adminData = data as AdminAccessInfo;

  return {
    role: adminData.role,
    company_id: adminData.company_id,
    is_active: adminData.is_active,
    mfa_required: adminData.mfa_required
  };
}

export async function getCurrentWebAdminAccess(): Promise<AdminAccessInfo | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return null; // Estado controlado: sin sesión
  }

  return getWebAdminAccessForUser({ supabase, userId: user.id });
}
