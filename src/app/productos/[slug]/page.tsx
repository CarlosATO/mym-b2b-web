import PublicLayout from '@/components/layout/PublicLayout';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicProductBySlug } from '@/lib/api/catalog';

// Si usas generateStaticParams o similar, puedes configurarlo aquí.
// Por ahora, asumimos SSR/dinámico para B2B.
export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);

  if (!product) {
    notFound();
  }

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
            <div className="p-8 bg-slate-50 flex items-center justify-center min-h-[400px] relative">
              {product.primary_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.primary_image_url} alt={product.name} className="object-contain w-full h-full max-h-[400px]" />
              ) : (
                <div className="text-slate-400 font-medium">
                  Sin imagen disponible
                </div>
              )}
            </div>
            
            {/* Detalles del producto */}
            <div className="p-8 md:p-12 flex flex-col">
              {product.brand_id && <div className="text-sm font-medium text-blue-600 mb-2">Marca ID: {product.brand_id}</div>}
              <h1 className="text-3xl font-bold text-slate-900 mb-4">
                {product.name}
              </h1>
              {product.category_id && <div className="text-sm text-slate-500 mb-6">Categoría ID: {product.category_id}</div>}
              
              <div className="prose prose-sm text-slate-600 mb-8">
                <p>
                  {product.description || product.short_description || 'Sin descripción detallada.'}
                </p>
                <ul>
                  {product.sku && <li>SKU: {product.sku}</li>}
                  {product.pack_unit && <li>Unidad de empaque: {product.pack_unit}</li>}
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
