import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentWebAdminAccess } from '@/lib/api/admin-access';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/actions/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const adminAccess = await getCurrentWebAdminAccess();

  if (!adminAccess || !adminAccess.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-red-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso Denegado</h2>
          <p className="text-slate-600 mb-6">
            No tienes los permisos necesarios o tu cuenta de administrador no está activa para ingresar a esta sección.
          </p>
          <Link href="/" className="inline-block px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors">
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      {/* Sidebar Admin */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="font-bold text-xl tracking-tight">MYM Panel B2B</div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <Link href="/admin" className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/productos" className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
            Productos Web
          </Link>
          <Link href="/admin/categorias" className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
            Categorías
          </Link>
          <Link href="/admin/marcas" className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
            Marcas
          </Link>
          <Link href="/admin/banners" className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
            Banners
          </Link>
          <Link href="/admin/clientes" className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
            Clientes B2B
          </Link>
          <Link href="/admin/configuracion" className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
            Configuración
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <Link href="/" className="flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-300 border border-slate-700 rounded-md hover:bg-slate-800 transition-colors">
            Volver a la Web
          </Link>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top Header Admin */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Administración</h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-slate-600">{adminAccess.role}</div>
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
              </div>
            </div>
            
            <form action={logout}>
              <button 
                type="submit" 
                className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors border-l border-slate-200 pl-6"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 p-8 min-w-0">
          {adminAccess.mfa_required && (
            <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">TODO TÉCNICO: Verificación MFA Pendiente</h3>
                  <div className="mt-1 text-sm text-amber-700">
                    <p>
                      Tu cuenta requiere MFA (mfa_required=true). La validación real del nivel AAL de Supabase Auth debe implementarse antes de permitir mutaciones sensibles en producción.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {children}
        </div>
      </main>
    </div>
  );
}
