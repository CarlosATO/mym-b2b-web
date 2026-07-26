import Link from 'next/link';

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  brand_name?: string;
  category_name?: string;
  short_description?: string;
  primary_image_url?: string;
  is_featured?: boolean;
}

export default function ProductCard({
  slug, name, brand_name, category_name,
  short_description, primary_image_url, is_featured,
}: ProductCardProps) {
  return (
    <Link
      href={`/productos/${slug}`}
      className="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 relative"
    >
      {/* Badges Overlay */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        <span className="text-[10px] font-bold tracking-wider uppercase bg-blue-700/90 text-white px-2 py-1 rounded shadow-sm backdrop-blur-sm">
          B2B
        </span>
        {is_featured && (
          <span className="text-[10px] font-bold tracking-wider uppercase bg-amber-500 text-white px-2 py-1 rounded shadow-sm">
            Top
          </span>
        )}
      </div>

      {/* Image Container - White background, clean look */}
      <div className="aspect-square bg-white flex items-center justify-center p-4 relative border-b border-slate-100">
        {primary_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primary_image_url}
            alt={name}
            className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 rounded-lg text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
            <span className="text-xs font-medium">Sin foto</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 p-5 pt-4">
        {/* Brand & Category */}
        <div className="flex items-center gap-2 text-xs mb-1.5">
          {brand_name ? (
            <span className="font-bold text-blue-700 uppercase tracking-wide">{brand_name}</span>
          ) : (
            <span className="text-slate-400">Genérico</span>
          )}
          {category_name && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 capitalize">{category_name}</span>
            </>
          )}
        </div>

        {/* Product Title */}
        <h3 className="font-semibold text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors text-[15px] mb-2">
          {name}
        </h3>

        {/* Short Description */}
        {short_description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
            {short_description}
          </p>
        )}

        {/* Price Lock Notice & Action */}
        <div className="mt-auto pt-3 border-t border-slate-100/80">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>Precio con cuenta</span>
            </div>
            <span className="font-semibold text-blue-700 group-hover:underline">
              Ver Detalle
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
