import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getAdminBrands } from '@/lib/api/admin-catalog';

export const metadata = {
  title: 'Marcas | Admin',
};

export default async function AdminBrandsPage() {
  const supabase = await createClient();
  const companyId = process.env.MYM_COMPANY_ID;

  if (!companyId) {
    return <div>Error: Configuración de servidor incompleta (MYM_COMPANY_ID missing).</div>;
  }

  const brands = await getAdminBrands(supabase, companyId);
  const totalCount = brands.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marcas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona las marcas disponibles en el catálogo B2B. Mostrando {totalCount} marcas.
          </p>
        </div>
        <Link
          href="/admin/marcas/nueva"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-900 hover:bg-slate-800 transition-colors"
        >
          Nueva Marca
        </Link>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        {totalCount === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">No hay marcas</h3>
            <p className="mt-1 text-sm text-slate-500">Comienza agregando la primera marca de tus productos.</p>
            <div className="mt-6">
              <Link
                href="/admin/marcas/nueva"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Crear marca
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Logo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Slug</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {brand.logo_url ? (
                        <div 
                          className="h-8 w-auto min-w-[2rem] bg-contain bg-no-repeat bg-center" 
                          style={{ backgroundImage: `url(${brand.logo_url})` }}
                          aria-label={`Logo de ${brand.name}`}
                        />
                      ) : (
                        <div className="h-8 w-8 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs font-medium">
                          Sin logo
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{brand.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {brand.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${brand.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {brand.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/admin/marcas/${brand.id}/editar`} className="text-blue-600 hover:text-blue-900">
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
