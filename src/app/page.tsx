import PublicLayout from '@/components/layout/PublicLayout';
import Link from 'next/link';

export default function Home() {
  return (
    <PublicLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
          Catálogo Mayorista
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10">
          Encuentra los mejores productos para tu negocio. Regístrate para acceder a precios exclusivos y gestionar tus compras de manera eficiente.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/catalogo" 
            className="px-8 py-3 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            Ver Catálogo
          </Link>
          <Link 
            href="/login" 
            className="px-8 py-3 text-base font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 transition-colors shadow-sm"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
      
      {/* Sección de Productos Destacados (Mock) */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Productos Destacados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4 flex flex-col">
                <div className="aspect-square bg-slate-100 rounded-md mb-4 flex items-center justify-center text-slate-400">
                  Imagen {i}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Producto de Ejemplo {i}</h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                  Descripción corta del producto. Ideal para mostrar un poco de contexto.
                </p>
                <div className="mt-auto">
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    Inicia sesión para ver precios
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
