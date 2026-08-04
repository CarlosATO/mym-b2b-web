import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getAdminProducts, getAdminCategories, getAdminBrands, AdminProduct } from '@/lib/api/admin-catalog';
import ProductFilters from '@/components/admin/ProductFilters';

export const metadata = {
  title: 'Productos | Admin',
};

type NormalizationFilter = 'all' | 'pending_normalization' | 'no_category' | 'no_brand' | 'no_image' | 'new_bsale';

function hasDescription(product: AdminProduct) {
  return Boolean((product.short_description ?? '').trim() || (product.description ?? '').trim());
}

function hasSeo(product: AdminProduct) {
  return Boolean((product.seo_title ?? '').trim() || (product.seo_description ?? '').trim());
}

function isPendingNormalization(product: AdminProduct) {
  return product.review_status === 'draft'
    && !product.is_active
    && !product.is_visible
    && (
      !product.category_id
      || !product.brand_id
      || !product.primary_image_url
      || !hasDescription(product)
      || !hasSeo(product)
    );
}

function isNewBsaleProduct(product: AdminProduct) {
  return Boolean(
    product.bsale_variant_id
    && product.bsale_sync_status === 'pending'
    && product.review_status === 'draft'
    && !product.is_active
    && !product.is_visible
  );
}

function formatCount(value: number) {
  return new Intl.NumberFormat('es-CL').format(value);
}

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
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;
  const status = typeof resolvedParams.status === 'string' ? resolvedParams.status : undefined;
  const category = typeof resolvedParams.category === 'string' ? resolvedParams.category : undefined;
  const brand = typeof resolvedParams.brand === 'string' ? resolvedParams.brand : undefined;
  const normalization = typeof resolvedParams.normalization === 'string'
    ? resolvedParams.normalization as NormalizationFilter
    : 'all';

  const [products, categories, brands] = await Promise.all([
    getAdminProducts(supabase, companyId, {
      search_query: q,
      filter_review_status: status,
      filter_category_id: category,
      filter_brand_id: brand,
      page_number: 1,
      page_size: 100,
    }),
    getAdminCategories(supabase, companyId),
    getAdminBrands(supabase, companyId),
  ]);

  const totalCount = products.length > 0 ? products[0].total_count : 0;
  const enrichedProducts = products.map((product) => ({
    ...product,
    pendingNormalization: isPendingNormalization(product),
    newBsale: isNewBsaleProduct(product),
    missingImage: !product.primary_image_url,
    missingCategory: !product.category_id,
    missingBrand: !product.brand_id,
  }));

  const summaryCounts = {
    pendingNormalization: enrichedProducts.filter((product) => product.pendingNormalization).length,
    newBsale: enrichedProducts.filter((product) => product.newBsale).length,
    noCategory: enrichedProducts.filter((product) => product.missingCategory).length,
    noBrand: enrichedProducts.filter((product) => product.missingBrand).length,
    noImage: enrichedProducts.filter((product) => product.missingImage).length,
    visible: enrichedProducts.filter((product) => product.is_visible).length,
  };

  const filteredProducts = enrichedProducts
    .filter((product) => {
      switch (normalization) {
        case 'pending_normalization':
          return product.pendingNormalization;
        case 'no_category':
          return product.missingCategory;
        case 'no_brand':
          return product.missingBrand;
        case 'no_image':
          return product.missingImage;
        case 'new_bsale':
          return product.newBsale;
        case 'all':
        default:
          return true;
      }
    })
    .sort((a, b) => {
      if (a.pendingNormalization !== b.pendingNormalization) {
        return Number(b.pendingNormalization) - Number(a.pendingNormalization);
      }

      if (a.newBsale !== b.newBsale) {
        return Number(b.newBsale) - Number(a.newBsale);
      }

      const createdDiff = Date.parse(b.created_at) - Date.parse(a.created_at);
      if (createdDiff !== 0) return createdDiff;

      const orderDiff = a.order_index - b.order_index;
      if (orderDiff !== 0) return orderDiff;

      return a.name.localeCompare(b.name, 'es');
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Publicado</span>;
      case 'ready': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Listo</span>;
      case 'hidden': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Oculto</span>;
      case 'draft':
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Borrador</span>;
    }
  };

  const getNormalizationBadge = (product: (typeof filteredProducts)[number]) => {
    if (product.pendingNormalization) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Pendiente de normalización</span>;
    }

    return null;
  };

  const getNewBsaleBadge = (product: (typeof filteredProducts)[number]) => {
    if (product.newBsale) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">Nuevo Bsale</span>;
    }

    return null;
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
            Los productos provienen de Bsale. Este panel los normaliza comercialmente antes de publicar. Mostrando {formatCount(totalCount)} productos.
          </p>
        </div>
        <Link
          href="/admin/productos/importaciones"
          className="inline-flex flex-shrink-0 items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-900 hover:bg-slate-800"
          title="Ver historial de dry-runs de importación Bsale"
        >
          Auditorías Bsale
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-7">
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Total</div>
          <div className="mt-1 text-lg font-semibold leading-none text-slate-900">{formatCount(totalCount)}</div>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 shadow-sm">
          <div className="text-[10px] font-medium uppercase tracking-wider text-amber-700">Pend. normalización</div>
          <div className="mt-1 text-lg font-semibold leading-none text-amber-900">{formatCount(summaryCounts.pendingNormalization)}</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Nuevos Bsale</div>
          <div className="mt-1 text-lg font-semibold leading-none text-slate-900">{formatCount(summaryCounts.newBsale)}</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Sin categoría</div>
          <div className="mt-1 text-lg font-semibold leading-none text-slate-900">{formatCount(summaryCounts.noCategory)}</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Sin marca</div>
          <div className="mt-1 text-lg font-semibold leading-none text-slate-900">{formatCount(summaryCounts.noBrand)}</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Sin imagen</div>
          <div className="mt-1 text-lg font-semibold leading-none text-slate-900">{formatCount(summaryCounts.noImage)}</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Visibles</div>
          <div className="mt-1 text-lg font-semibold leading-none text-slate-900">{formatCount(summaryCounts.visible)}</div>
        </div>
      </div>

      <ProductFilters
        key={`${q ?? ''}|${status ?? ''}|${category ?? ''}|${brand ?? ''}|${normalization}`}
        q={q}
        status={status}
        category={category}
        brand={brand}
        normalization={normalization}
        categories={categories}
        brands={brands}
      />
      <p className="-mt-3 text-[11px] text-slate-500">
        Vista actual: {formatCount(filteredProducts.length)} productos.
      </p>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden flex flex-col">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">No hay productos</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-lg mx-auto">
              No hay productos para esta combinación de filtros. Los importados desde Bsale siguen en borrador hasta su normalización comercial.
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
                {filteredProducts.map((product) => (
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
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {getNormalizationBadge(product)}
                            {getNewBsaleBadge(product)}
                          </div>
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
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {!product.category_id && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">Sin categoría</span>
                          )}
                          {!product.brand_id && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">Sin marca</span>
                          )}
                          {!product.primary_image_url && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">Sin imagen</span>
                          )}
                          {product.is_active ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">Activo</span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800">Inactivo</span>
                          )}
                          {product.is_visible && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">Visible</span>
                          )}
                          {product.is_featured && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800">Destacado</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/productos/${product.id}/editar`}
                        className="text-blue-600 hover:text-blue-900"
                      >
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
