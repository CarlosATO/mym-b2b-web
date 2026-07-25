import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      {/* Sidebar Admin */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="font-bold text-xl tracking-tight">MYM Panel B2B</div>
        </div>
        
        {/* TODO: Validar rol WEB_ADMIN o WEB_SUPER_ADMIN antes de renderizar el layout en producción. La validación final de rol quedará preparada para revisar web_b2b.admin_access */}
        
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <Link href="/admin" className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/banners" className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
            Banners
          </Link>
          <Link href="/admin/productos" className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
            Productos Web
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
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">Admin User</div>
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              A
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 p-8">
          {/* Advertencia temporal */}
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Modo Desarrollo</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Este panel admin está en fase de creación. Las protecciones reales requerirán que el usuario tenga un registro en <code>web_b2b.admin_access</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {children}
        </div>
      </main>
    </div>
  );
}
