'use server';

import { createClient } from '@/lib/supabase/server';
import { getWebAdminAccessForUser } from '@/lib/api/admin-access';
import { redirect } from 'next/navigation';

export async function login(prevState: { error: string | null } | null, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Por favor ingresa correo y contraseña.' };
  }

  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !authData.user) {
    return { error: 'Credenciales incorrectas o usuario no autorizado.' };
  }

  // Verificar si tiene acceso de administrador usando el mismo cliente y el userId recién obtenido
  const adminAccess = await getWebAdminAccessForUser({
    supabase,
    userId: authData.user.id
  });

  if (adminAccess && adminAccess.is_active) {
    redirect('/admin');
  } else {
    redirect('/catalogo');
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
