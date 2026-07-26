import Link from 'next/link';

interface PetCategoryCardProps {
  title: string;
  type: 'gatos' | 'perros';
  icon: string;
}

export default function PetCategoryCard({ title, type, icon }: PetCategoryCardProps) {
  const badgeColor = type === 'gatos' ? 'bg-teal-600 text-white' : 'bg-blue-600 text-white';

  return (
    <Link href={`/catalogo?categoria=${encodeURIComponent(title)}`} className="group block bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-24 bg-slate-50 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div className="p-3 text-center border-t border-slate-100">
        <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm mb-1.5 ${badgeColor}`}>
          {type}
        </span>
        <h4 className="font-semibold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">
          {title}
        </h4>
      </div>
    </Link>
  );
}
