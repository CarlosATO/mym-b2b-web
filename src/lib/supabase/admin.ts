import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// ADVERTENCIA DE SEGURIDAD:
// Este cliente utiliza el SUPABASE_SERVICE_ROLE_KEY, el cual otorga privilegios
// de administrador y bypass de RLS (Row Level Security).
// NUNCA DEBE SER USADO EN COMPONENTES CLIENTE.
// Solo debe utilizarse en el backend seguro, scripts, route handlers protegidos
// o server actions debidamente protegidas.

export function createAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables for Admin Client');
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
