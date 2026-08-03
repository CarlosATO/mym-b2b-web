import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getAdminProducts } from '@/lib/api/admin-catalog';

export const metadata = {
  title: 'Productos | Admin',
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const companyId = process.env.MYM_COMPANY_ID;

  if (!companyId) {
    return <div>Error: Configuración de servidor incompleta (MYM_COMPANY_ID missing).</div>;
  }

  const resolvedParams = await searchParams;
  
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;
  const status = typeof resolvedParams.status === 'string' ? resolvedParams.status : undefined;
  const category = typeof resolvedParams.category === 'string' ? resolvedParams.category : undefined;
  const brand = typeof resolvedParams.brand === 'string' ? resolvedParams.brand : undefined;

  const products = await getAdminProducts(supabase, companyId, {
    search_query: q,
    filter_review_status: status,
    filter_category_id: category,
    filter_brand_id: brand,
    page_number: page,
    page_size: 50,
  });

  const totalCount = products.length > 0 ? products[0].total_count : 0;
  const totalPages = Math.ceil(totalCount / 50);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Publicado</span>;
      case 'ready': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Listo</span>;
      case 'hidden': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Oculto</span>;
      case 'draft':
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Borrador</span>;
    }
  };

  const getSyncBadge = (status: string) => {
    switch (status) {
      case 'synced': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Sincronizado</span>;
      case 'error': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Error</span>;
      case 'pending': 
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pendiente</span>;
    }
  };

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 truncate">Productos Web</h1>
          <p className="text-sm text-slate-500 mt-1 break-words">
            Los productos provienen de Bsale y aquí se administra su presentación web. Mostrando {totalCount} productos.
          </p>
        </div>
        <span
          className="inline-flex flex-shrink-0 items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-400 cursor-not-allowed"
          aria-disabled="true"
          title="Próxima Fase"
        >
          Nuevo Producto (Próxima Fase)
        </span>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden flex flex-col">
        {/* Simple Filters Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4 items-center">
          <form className="flex flex-wrap gap-4 items-center w-full" method="GET" action="/admin/productos">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre o SKU..."
              className="border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border flex-1 min-w-[200px]"
            />
            <select
              name="status"
              defaultValue={status || ''}
              className="border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
            >
              <option value="">Cualquier estado</option>
              <option value="draft">Borrador</option>
              <option value="ready">Listo</option>
              <option value="published">Publicado</option>
              <option value="hidden">Oculto</option>
            </select>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-900 hover:bg-slate-800"
            >
              Filtrar
            </button>
            {(q || status || category || brand) && (
              <Link href="/admin/productos" className="text-sm text-blue-600 hover:text-blue-900 ml-2">
                Limpiar
              </Link>
            )}
          </form>
        </div>

        {totalCount === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">No hay productos</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-lg mx-auto">
              Aún no hay productos cargados en el catálogo web. La carga principal vendrá desde Bsale y luego se complementará con imágenes/descripciones web.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Producto</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Categoría / Marca</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vínculo Bsale</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado Web</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {product.primary_image_url ? (
                            <div 
                              className="h-10 w-10 bg-contain bg-no-repeat bg-center rounded-md border border-slate-200" 
                              style={{ backgroundImage: `url(${product.primary_image_url})` }}
                              aria-label={`Imagen de ${product.name}`}
                            />
                          ) : (
                            <div className="h-10 w-10 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                              IMG
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{product.name}</div>
                          <div className="text-sm text-slate-500">SKU: {product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{product.category_name || '-'}</div>
                      <div className="text-sm text-slate-500">{product.brand_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {product.bsale_variant_id ? 'Vinculado' : 'Sin vínculo'}
                      </div>
                      <div className="mt-1">
                        {getSyncBadge(product.bsale_sync_status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(product.review_status)}
                        <div className="flex gap-1 mt-1">
                          {product.is_active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">Activo</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800">Inactivo</span>
                          )}
                          {product.is_visible && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">Visible</span>
                          )}
                          {product.is_featured && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800">Destacado</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <span 
                        className="text-slate-400 cursor-not-allowed"
                        aria-disabled="true"
                        title="Próxima fase"
                      >
                        Editar
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Mostrando página <span className="font-medium">{page}</span> de <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Link
                    href={`/admin/productos?page=${page > 1 ? page - 1 : 1}${q ? `&q=${q}` : ''}${status ? `&status=${status}` : ''}`}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium ${page <= 1 ? 'text-slate-300 pointer-events-none' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Anterior
                  </Link>
                  <Link
                    href={`/admin/productos?page=${page < totalPages ? page + 1 : totalPages}${q ? `&q=${q}` : ''}${status ? `&status=${status}` : ''}`}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium ${page >= totalPages ? 'text-slate-300 pointer-events-none' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Siguiente
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
