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
        className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
      >
        Iniciar sesión
      </Link>
    );
  }

  const adminAccess = await getCurrentWebAdminAccess();

  return (
    <div className="flex items-center gap-3">
      {adminAccess && adminAccess.is_active && (
        <Link
          href="/admin"
          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          Panel Admin
        </Link>
      )}

      <span className="text-sm font-medium text-slate-700 hidden sm:block">
        {user.email?.split('@')[0]}
      </span>

      <form action={logout}>
        <button
          type="submit"
          className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors border-l border-slate-200 pl-3 ml-1"
        >
          Salir
        </button>
      </form>
    </div>
  );
}
