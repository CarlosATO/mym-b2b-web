import PublicLayout from '@/components/layout/PublicLayout';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicProductBySlug } from '@/lib/api/catalog';

export const dynamic = 'force-dynamic';

type ProductDetail = {
  id: string; name: string; slug: string; sku?: string;
  short_description?: string; description?: string; is_featured?: boolean;
  brand_name?: string; category_name?: string; primary_image_url?: string;
};

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const raw = await getPublicProductBySlug(slug);

  if (!raw) notFound();
  const product = raw as ProductDetail;

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-700 transition-colors">Inicio</Link>
          <span>›</span>
          <Link href="/catalogo" className="hover:text-blue-700 transition-colors">Catálogo</Link>
          <span>›</span>
          <span className="text-slate-900 font-medium line-clamp-1">{product.name}</span>
        </nav>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image */}
            <div className="bg-slate-50 flex items-center justify-center min-h-[380px] md:min-h-[480px] p-8 relative">
              {product.is_featured && (
                <span className="absolute top-4 left-4 text-xs font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full">Destacado</span>
              )}
              <span className="absolute top-4 right-4 text-xs font-semibold bg-blue-700 text-white px-2.5 py-1 rounded-full">Catálogo B2B</span>

              {product.primary_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.primary_image_url} alt={product.name} className="object-contain max-h-[420px] w-full drop-shadow-sm" />
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
                  <span className="text-sm">Sin imagen disponible</span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-8 md:p-10 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                {product.brand_name && (
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{product.brand_name}</span>
                )}
                {product.category_name && (
                  <span className="text-xs text-slate-500">{product.category_name}</span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 leading-tight">{product.name}</h1>
              {product.sku && <p className="text-xs text-slate-400 mb-5 font-mono">SKU: {product.sku}</p>}

              <div className="text-slate-600 text-sm leading-relaxed mb-8 flex-1">
                {product.description || product.short_description || <em className="text-slate-400">Sin descripción detallada.</em>}
              </div>

              {/* Price notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <h3 className="font-semibold text-amber-900 mb-1 text-sm">Precio disponible para clientes aprobados</h3>
                <p className="text-xs text-amber-700 mb-4">Los precios y disponibilidad son exclusivos para clientes con cuenta activa.</p>
                <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors shadow-sm">
                  Iniciar sesión →
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Link href="/catalogo" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-700 transition-colors">
            ← Volver al catálogo
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
