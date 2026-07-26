import PublicLayout from '@/components/layout/PublicLayout';
import ProductCard from '@/components/catalog/ProductCard';
import Link from 'next/link';
import { getPublicCatalogProducts } from '@/lib/api/catalog';
import HomeHero from '@/components/home/HomeHero';
import PromoCarousel from '@/components/home/PromoCarousel';
import PetCategorySection from '@/components/home/PetCategorySection';

export const metadata = {
  title: 'MYM Distribuidora — Portal B2B Mayorista Mascotas',
  description: 'Portal de compras mayoristas exclusivo para clientes registrados del rubro mascotas.',
};

type Product = {
  id: string; slug: string; name: string; brand_name?: string;
  category_name?: string; short_description?: string;
  primary_image_url?: string; is_featured?: boolean;
};

export default async function Home() {
  const [products] = await Promise.all([
    getPublicCatalogProducts(),
  ]);

  const typedProducts = products as Product[];
  const displayedProducts = typedProducts.slice(0, 8); // Just show a few as "Destacados"

  const catCategories = [
    { title: 'Alimentos Secos', icon: '🥣' },
    { title: 'Alimentos Húmedos', icon: '🥫' },
    { title: 'Snacks', icon: '🐟' },
    { title: 'Arenas Sanitarias', icon: '🪨' },
    { title: 'Accesorios', icon: '🧶' },
  ];

  const dogCategories = [
    { title: 'Alimentos Secos', icon: '🥣' },
    { title: 'Alimentos Húmedos', icon: '🥫' },
    { title: 'Snacks y Huesos', icon: '🦴' },
    { title: 'Higiene', icon: '🧴' },
    { title: 'Accesorios', icon: '🦮' },
  ];

  return (
    <PublicLayout>
      {/* Hero Comercial */}
      <HomeHero />

      {/* Ofertas Inmediatas */}
      <PromoCarousel />

      {/* Tienda Gatos */}
      <PetCategorySection title="Tienda para Gatos" type="gatos" categories={catCategories} />

      {/* Tienda Perros */}
      <PetCategorySection title="Tienda para Perros" type="perros" categories={dogCategories} />

      {/* Catálogo B2B / Destacados */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-8 gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Productos Destacados</h2>
              <p className="text-slate-500 text-sm mt-1">Selección de nuestro catálogo mayorista</p>
            </div>
            <Link href="/catalogo" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors bg-white px-4 py-2 border border-slate-200 rounded-lg hover:border-blue-300 shadow-sm">
              Ver catálogo completo →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedProducts.map((p) => <ProductCard key={p.id} {...p} />)}
          </div>
        </div>
      </section>

      {/* Beneficios B2B */}
      <section className="py-12 bg-slate-900 text-white border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-700">
            {[
              { icon: '📦', title: 'Catálogo mayorista', desc: 'Surtido completo en stock real.' },
              { icon: '🔒', title: 'Acceso exclusivo', desc: 'Precios preferenciales B2B.' },
              { icon: '🚚', title: 'Despacho rápido', desc: 'Entregas a tu local comercial.' },
            ].map((b, i) => (
              <div key={i} className="pt-6 md:pt-0 px-4">
                <div className="text-3xl mb-3">{b.icon}</div>
                <h3 className="font-semibold text-white mb-1">{b.title}</h3>
                <p className="text-sm text-slate-400">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-2 text-slate-900">¿Tienes un Pet Shop o Veterinaria?</h2>
          <p className="text-slate-600 mb-6 text-sm max-w-md mx-auto">
            Únete a MYM Distribuidora y accede a las mejores marcas del mercado con condiciones exclusivas para mayoristas.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-800 transition-colors shadow-md text-sm"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
