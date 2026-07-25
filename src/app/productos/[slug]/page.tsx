import PublicLayout from '@/components/layout/PublicLayout';
import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/catalogo" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            &larr; Volver al catálogo
          </Link>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Imagen del producto */}
            <div className="p-8 bg-slate-50 flex items-center justify-center min-h-[400px]">
              <div className="text-slate-400 font-medium">
                Imagen de {params.slug}
              </div>
            </div>
            
            {/* Detalles del producto */}
            <div className="p-8 md:p-12 flex flex-col">
              <div className="text-sm font-medium text-blue-600 mb-2">Marca de Ejemplo</div>
              <h1 className="text-3xl font-bold text-slate-900 mb-4">
                Producto de Ejemplo ({params.slug})
              </h1>
              <div className="text-sm text-slate-500 mb-6">Categoría: Ejemplo</div>
              
              <div className="prose prose-sm text-slate-600 mb-8">
                <p>
                  Esta es una descripción detallada del producto. Aquí se mostrarían las características principales, 
                  especificaciones técnicas y cualquier otra información relevante para el cliente B2B.
                </p>
                <ul>
                  <li>Característica 1</li>
                  <li>Característica 2</li>
                  <li>SKU: MOCK-12345</li>
                </ul>
              </div>
              
              <div className="mt-auto pt-8 border-t border-slate-100">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                  <h3 className="font-semibold text-amber-800 mb-2">Inicia sesión para ver precio y disponibilidad</h3>
                  <p className="text-sm text-amber-700 mb-4">
                    Para ver los precios especiales para tu empresa y poder agregar productos al carro, necesitas iniciar sesión.
                  </p>
                  <Link 
                    href="/login" 
                    className="inline-block px-6 py-2 bg-amber-600 text-white font-medium rounded-md hover:bg-amber-700 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
