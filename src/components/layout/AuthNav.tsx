import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentWebAdminAccess } from '@/lib/api/admin-access';
import { logout } from '@/app/actions/auth';

export default async function AuthNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Link 
        href="/login" 
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
      >
        Iniciar sesión
      </Link>
    );
  }

  const adminAccess = await getCurrentWebAdminAccess();

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-slate-700">
        Mi cuenta
      </span>
      
      {adminAccess && adminAccess.is_active && (
        <Link 
          href="/admin" 
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Panel Admin
        </Link>
      )}
      
      <form action={logout}>
        <button 
          type="submit" 
          className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors border-l border-slate-200 pl-4 ml-2"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
