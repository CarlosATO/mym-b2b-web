import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getAdminCategories } from '@/lib/api/admin-catalog';

export const metadata = {
  title: 'Categorías | Admin',
};

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const companyId = process.env.MYM_COMPANY_ID;

  if (!companyId) {
    return <div>Error: Configuración de servidor incompleta (MYM_COMPANY_ID missing).</div>;
  }

  const categories = await getAdminCategories(supabase, companyId);
  const totalCount = categories.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categorías</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona la estructura del catálogo B2B. Mostrando {totalCount} categorías.
          </p>
        </div>
        <Link
          href="/admin/categorias/nueva"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-900 hover:bg-slate-800 transition-colors"
        >
          Nueva Categoría
        </Link>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        {totalCount === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">No hay categorías</h3>
            <p className="mt-1 text-sm text-slate-500">Comienza creando tu primera categoría para organizar el catálogo.</p>
            <div className="mt-6">
              <Link
                href="/admin/categorias/nueva"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Crear categoría
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Slug</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Padre</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estilo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estados</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {categories.map((category) => {
                  const parentName = category.parent_id 
                    ? categories.find(c => c.id === category.parent_id)?.name || 'Desconocido'
                    : '-';
                  
                  return (
                    <tr key={category.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{category.name}</div>
                        <div className="text-xs text-slate-500">Orden: {category.order_index}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {category.slug}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {parentName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {category.display_style}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {category.is_active ? 'Activa' : 'Inactiva'}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.is_visible_catalog ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>
                            {category.is_visible_catalog ? 'Catálogo' : 'No Catálogo'}
                          </span>
                          {category.is_visible_home && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              Portada
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/admin/categorias/${category.id}/editar`} className="text-blue-600 hover:text-blue-900">
                          Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
