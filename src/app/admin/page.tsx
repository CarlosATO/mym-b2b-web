import { getCurrentWebAdminAccess } from '@/lib/api/admin-access';
import AdminQuickAccessCard from '@/components/admin/AdminQuickAccessCard';

const ROLE_LABELS: Record<string, string> = {
  WEB_SUPER_ADMIN: 'Super Administrador',
  WEB_ADMIN: 'Administrador',
  WEB_CONTENT_MANAGER: 'Gestor de Contenido',
  WEB_SALES: 'Ventas',
};

export default async function AdminDashboardPage() {
  const adminAccess = await getCurrentWebAdminAccess();
  const roleLabel = adminAccess?.role ? (ROLE_LABELS[adminAccess.role] ?? adminAccess.role) : 'Administrador';

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-2xl px-8 py-7">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">Panel de administración</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Bienvenido al Portal B2B
        </h1>
        <p className="text-blue-200 text-sm max-w-lg leading-relaxed">
          Desde aquí gestionas el contenido y el acceso al catálogo mayorista de MYM Distribuidora.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 border border-white/30 text-white px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Quick access cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <AdminQuickAccessCard
            href="/admin/banners"
            title="Banners"
            description="Administra los banners del home y catálogo del portal público."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            }
            available
          />
          <AdminQuickAccessCard
            href="/admin/productos"
            title="Productos Web"
            description="Gestiona visibilidad, imágenes y contenido de los productos del catálogo."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
            }
            available
          />
          <AdminQuickAccessCard
            href="/admin/clientes"
            title="Clientes B2B"
            description="Aprueba o rechaza solicitudes de acceso de clientes mayoristas."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            }
            available
          />
          <AdminQuickAccessCard
            href="/admin/configuracion"
            title="Configuración"
            description="Parámetros del portal, integraciones y ajustes generales."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            }
            available
          />
        </div>
      </div>

      {/* Upcoming features */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Próximamente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <AdminQuickAccessCard
            href="#"
            title="Sincronización Bsale"
            description="Importación automática de productos, precios y stock desde Bsale."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            }
            badge="En desarrollo"
            available={false}
          />
          <AdminQuickAccessCard
            href="#"
            title="Pedidos en línea"
            description="Gestión y aprobación de pedidos mayoristas directamente desde el portal."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            }
            badge="En desarrollo"
            available={false}
          />
          <AdminQuickAccessCard
            href="#"
            title="Listas de precios"
            description="Gestión de listas de precios diferenciadas por cliente o segmento."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            }
            badge="Planificado"
            available={false}
          />
        </div>
      </div>

      {/* Activity placeholder */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Actividad reciente</h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-slate-200 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <p className="text-sm text-slate-400">Próximamente: auditoría de accesos y actividad.</p>
        </div>
      </div>
    </div>
  );
}
