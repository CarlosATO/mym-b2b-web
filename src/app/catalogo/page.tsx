import PublicLayout from '@/components/layout/PublicLayout';
import Link from 'next/link';

export default function CatalogoPage() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar de Filtros (Placeholder) */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white p-4 border border-slate-200 rounded-lg sticky top-24">
              <h2 className="font-bold text-lg mb-4">Filtros</h2>
              
              <div className="mb-6">
                <h3 className="font-medium text-sm text-slate-700 mb-2">Categorías</h3>
                <ul className="space-y-2">
                  {['Abarrotes', 'Lácteos', 'Bebidas', 'Limpieza'].map((cat) => (
                    <li key={cat} className="flex items-center gap-2">
                      <input type="checkbox" id={`cat-${cat}`} className="rounded border-slate-300" />
                      <label htmlFor={`cat-${cat}`} className="text-sm text-slate-600">{cat}</label>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-sm text-slate-700 mb-2">Marcas</h3>
                <ul className="space-y-2">
                  {['Marca A', 'Marca B', 'Marca C'].map((marca) => (
                    <li key={marca} className="flex items-center gap-2">
                      <input type="checkbox" id={`marca-${marca}`} className="rounded border-slate-300" />
                      <label htmlFor={`marca-${marca}`} className="text-sm text-slate-600">{marca}</label>
                    </li>
                  ))}
                </ul>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <Link href={`/productos/producto-mock-${i}`} key={i} className="group flex flex-col bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-slate-100 rounded-md mb-4 flex items-center justify-center text-slate-400">
                    Imagen Placeholder
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">Producto de Ejemplo {i}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                    Descripción corta del producto. Ideal para mostrar un poco de contexto de lo que es.
                  </p>
                  <div className="mt-auto">
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      Inicia sesión para ver precios
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
