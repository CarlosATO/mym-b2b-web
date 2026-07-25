import PublicLayout from '@/components/layout/PublicLayout';
import Link from 'next/link';
import { getPublicBanners, getPublicCatalogProducts } from '@/lib/api/catalog';

export default async function Home() {
  const banners = await getPublicBanners();
  const products = await getPublicCatalogProducts();

  // En el MVP sin datos, aseguramos que siempre haya algo que mostrar o manejamos el estado vacío elegantemente.
  // Podríamos filtrar `products.filter(p => p.is_featured)` si el schema tuviera esa columna implementada con datos.
  const featuredProducts = products.slice(0, 4);

  return (
    <PublicLayout>
      {/* Banners Hero Section */}
      {banners.length > 0 ? (
        <div className="w-full bg-slate-900 text-white min-h-[40vh] flex items-center justify-center">
          {/* Aquí iría un carrusel real con banners. Por ahora mostramos el primero */}
          <div className="text-center px-4">
            <h2 className="text-3xl font-bold mb-4">{banners[0].title}</h2>
            {banners[0].link_url && (
              <Link href={banners[0].link_url} className="text-blue-400 hover:underline">
                Ver más
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 bg-slate-50">
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
      )}
      
      {/* Sección de Productos Destacados */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Productos Destacados</h2>
          
          {featuredProducts.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-slate-500">Pronto tendremos productos disponibles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.map((product: { id: string; slug: string; name: string; primary_image_url?: string; short_description?: string }) => (
                <Link href={`/productos/${product.slug}`} key={product.id} className="group border border-slate-200 rounded-lg p-4 flex flex-col hover:shadow-md transition-shadow">
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
      </section>
    </PublicLayout>
  );
}
