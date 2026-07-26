import Link from 'next/link';
import PetCategoryCard from './PetCategoryCard';

interface PetCategorySectionProps {
  title: string;
  type: 'gatos' | 'perros';
  categories: { title: string; icon: string }[];
}

export default function PetCategorySection({ title, type, categories }: PetCategorySectionProps) {
  const themeColor = type === 'gatos' ? 'bg-teal-700' : 'bg-blue-800';
  const lightColor = type === 'gatos' ? 'bg-teal-50' : 'bg-blue-50';

  return (
    <section className={`py-12 ${lightColor} border-t border-slate-200`}>
      <div className="container mx-auto px-4">
        {/* Thematic Banner */}
        <div className={`${themeColor} text-white rounded-2xl p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center justify-between shadow-md`}>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
              {type === 'gatos' ? '🐱' : '🐶'} {title}
            </h2>
            <p className="text-white/80 text-sm max-w-xl">
              Explora nuestra selección completa de productos diseñados específicamente para el bienestar y cuidado de los {type}.
            </p>
          </div>
          <Link href={`/catalogo?familia=${type}`} className="mt-4 md:mt-0 px-6 py-2.5 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors shadow-sm whitespace-nowrap text-sm">
            Ver todo el catálogo
          </Link>
        </div>

        {/* Subcategories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat, i) => (
            <PetCategoryCard key={i} title={cat.title} type={type} icon={cat.icon} />
          ))}
        </div>
      </div>
    </section>
  );
}
