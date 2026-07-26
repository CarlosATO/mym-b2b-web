import PublicLayout from '@/components/layout/PublicLayout';
import ProductCard from '@/components/catalog/ProductCard';
import EmptyState from '@/components/catalog/EmptyState';
import { getPublicCatalogProducts, getPublicBrands, getPublicCategories } from '@/lib/api/catalog';

export const metadata = {
  title: 'Catálogo Mayorista — MYM Distribuidora',
  description: 'Catálogo B2B de productos para mascotas. Encuentra todo para tu pet shop o veterinaria.',
};

type Product = {
  id: string; slug: string; name: string; brand_name?: string;
  category_name?: string; short_description?: string;
  primary_image_url?: string; is_featured?: boolean;
};
type Brand = { id: string; name: string };
type Category = { id: string; name: string; parent_id?: string };

export default async function CatalogoPage() {
  const [products, brands, categories] = await Promise.all([
    getPublicCatalogProducts(), getPublicBrands(), getPublicCategories(),
  ]);

  const typedProducts = products as Product[];
  const typedBrands = brands as Brand[];
  const typedCategories = (categories as Category[]).filter((c) => !c.parent_id);

  return (
    <PublicLayout>
      {/* Search Header - Comercial Style */}
      <div className="bg-white border-b border-slate-200 py-6 md:py-8 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            <div className="text-center md:text-left md:flex justify-between items-end mb-2">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Catálogo Mayorista</h1>
                <p className="text-slate-500 text-sm mt-1">Explora nuestro surtido exclusivo para clientes B2B.</p>
              </div>
              <div className="hidden md:flex items-center gap-2 mt-4 md:mt-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {typedProducts.length} Productos
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {typedBrands.length} Marcas
                </span>
              </div>
            </div>

            {/* Main Search Bar for Catalog */}
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <input 
                type="text" 
                placeholder="Busca por nombre, categoría, marca, o SKU..." 
                className="w-full pl-11 pr-32 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all shadow-inner"
              />
              <button className="absolute inset-y-1.5 right-1.5 px-6 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors">
                Buscar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* ── Sidebar Filters ── */}
            <aside className="w-full md:w-64 flex-shrink-0">
              <div className="bg-white border border-slate-200 rounded-xl p-6 sticky top-24 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-slate-900 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
                    Filtros
                  </h2>
                  <button className="text-xs text-blue-600 hover:underline font-medium">Limpiar</button>
                </div>

                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-2">Familia / Categoría</h3>
                  {typedCategories.length > 0 ? (
                    <ul className="space-y-2.5 mt-3">
                      {typedCategories.map((cat) => (
                        <li key={cat.id} className="flex items-center gap-3">
                          <input type="checkbox" id={`cat-${cat.id}`} className="w-4 h-4 accent-blue-600 rounded border-slate-300 cursor-pointer" />
                          <label htmlFor={`cat-${cat.id}`} className="text-sm text-slate-700 cursor-pointer hover:text-blue-700 font-medium select-none">{cat.name}</label>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No hay categorías.</p>
                  )}
                </div>

                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-2">Marcas</h3>
                  {typedBrands.length > 0 ? (
                    <ul className="space-y-2.5 mt-3">
                      {typedBrands.map((m) => (
                        <li key={m.id} className="flex items-center gap-3">
                          <input type="checkbox" id={`m-${m.id}`} className="w-4 h-4 accent-blue-600 rounded border-slate-300 cursor-pointer" />
                          <label htmlFor={`m-${m.id}`} className="text-sm text-slate-700 cursor-pointer hover:text-blue-700 font-medium select-none">{m.name}</label>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No hay marcas.</p>
                  )}
                </div>

                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-8 text-center">
                  <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <p className="text-xs font-semibold text-blue-900 mb-1">Cuentas Mayoristas</p>
                  <p className="text-[11px] text-blue-700/80 leading-relaxed">
                    Inicia sesión para visualizar listas de precios y disponibilidad de inventario.
                  </p>
                </div>
              </div>
            </aside>

            {/* ── Product Grid ── */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm text-slate-500 hidden sm:block">
                  Mostrando <span className="font-semibold text-slate-900">{typedProducts.length}</span> resultados
                </p>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-sm text-slate-500 hidden sm:block">Ordenar por:</span>
                  <select className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Relevancia</option>
                    <option>Nombre (A-Z)</option>
                    <option>Nombre (Z-A)</option>
                    <option>Marca</option>
                  </select>
                </div>
              </div>

              {typedProducts.length === 0 ? (
                <EmptyState title="No se encontraron productos" description="Intenta ajustar los filtros de tu búsqueda." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {typedProducts.map((p) => <ProductCard key={p.id} {...p} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
