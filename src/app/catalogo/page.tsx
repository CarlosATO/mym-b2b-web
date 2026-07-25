import PublicLayout from '@/components/layout/PublicLayout';
import Link from 'next/link';
import { getPublicCatalogProducts, getPublicBrands, getPublicCategories } from '@/lib/api/catalog';

export default async function CatalogoPage() {
  const products = await getPublicCatalogProducts();
  const brands = await getPublicBrands();
  const categories = await getPublicCategories();

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar de Filtros */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white p-4 border border-slate-200 rounded-lg sticky top-24">
              <h2 className="font-bold text-lg mb-4">Filtros</h2>
              
              <div className="mb-6">
                <h3 className="font-medium text-sm text-slate-700 mb-2">Categorías</h3>
                {categories.length > 0 ? (
                  <ul className="space-y-2">
                    {categories.map((cat: { id: string; name: string }) => (
                      <li key={cat.id} className="flex items-center gap-2">
                        <input type="checkbox" id={`cat-${cat.id}`} className="rounded border-slate-300" />
                        <label htmlFor={`cat-${cat.id}`} className="text-sm text-slate-600">{cat.name}</label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">No hay categorías disponibles.</p>
                )}
              </div>

              <div>
                <h3 className="font-medium text-sm text-slate-700 mb-2">Marcas</h3>
                {brands.length > 0 ? (
                  <ul className="space-y-2">
                    {brands.map((marca: { id: string; name: string }) => (
                      <li key={marca.id} className="flex items-center gap-2">
                        <input type="checkbox" id={`marca-${marca.id}`} className="rounded border-slate-300" />
                        <label htmlFor={`marca-${marca.id}`} className="text-sm text-slate-600">{marca.name}</label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">No hay marcas disponibles.</p>
                )}
              </div>
            </div>
          </aside>

          {/* Grilla de Productos */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold">Catálogo de Productos</h1>
              <div className="relative">
                <input 
                  type="search" 
                  placeholder="Buscar productos..." 
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
                <div className="absolute left-3 top-2.5 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-lg font-medium text-slate-900 mb-2">Catálogo vacío</h3>
                <p className="text-slate-500">Pronto tendremos productos disponibles en esta sección.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product: { id: string; slug: string; name: string; primary_image_url?: string; short_description?: string }) => (
                  <Link href={`/productos/${product.slug}`} key={product.id} className="group flex flex-col bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-slate-100 rounded-md mb-4 flex items-center justify-center text-slate-400 overflow-hidden relative">
                      {product.primary_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.primary_image_url} alt={product.name} className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-sm">Sin imagen</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                      {product.short_description || 'Sin descripción disponible.'}
                    </p>
                    <div className="mt-auto">
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        Inicia sesión para ver precios
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
