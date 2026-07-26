import Link from 'next/link';

export default function HomeHero() {
  return (
    <section className="relative w-full h-[400px] md:h-[500px] flex items-center overflow-hidden bg-slate-900 border-b border-slate-200">
      {/* Background Image - Right aligned */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-right md:bg-[position:80%_center]"
        style={{ backgroundImage: "url('/assets/brand/hero-bg.png')" }}
      />
      {/* Soft dark overlay: strong on the left for text, transparent on the right for image */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-900 via-slate-900/70 to-transparent md:w-3/4" />

      <div className="container mx-auto px-4 relative z-20 flex flex-col items-start w-full">
        <div className="max-w-lg md:max-w-xl py-8">
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-amber-300 mb-3 border border-amber-400/40 px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">
            Portal B2B Mayorista
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4 text-white tracking-tight drop-shadow-md">
            El mejor surtido para<br/>
            <span className="text-amber-400">tu Pet Shop</span>
          </h1>
          <p className="text-sm md:text-base text-slate-200 mb-6 leading-relaxed max-w-md drop-shadow-sm">
            Explora nuestro catálogo mayorista. Alimentos, accesorios y arenas con disponibilidad inmediata y precios exclusivos para clientes registrados.
          </p>
          
          <div className="flex gap-3">
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-700 text-white font-semibold rounded hover:bg-blue-800 transition-colors shadow-sm text-sm"
            >
              Ver Catálogo
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-2.5 font-semibold text-white bg-white/10 border border-white/20 rounded hover:bg-white/20 transition-colors shadow-sm text-sm backdrop-blur-sm"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
