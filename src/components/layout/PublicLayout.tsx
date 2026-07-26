import React from 'react';
import Link from 'next/link';
import BrandLogo from './BrandLogo';
import AuthNav from './AuthNav';
import HeaderSearch from './HeaderSearch';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8 flex-shrink-0">
            <BrandLogo size="md" showText variant="dark" />
            <nav className="hidden lg:flex items-center gap-1">
              <Link href="/" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-700 hover:bg-slate-50 rounded-md transition-colors">
                Inicio
              </Link>
              <Link href="/catalogo" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-700 hover:bg-slate-50 rounded-md transition-colors">
                Catálogo
              </Link>
            </nav>
          </div>
          
          <HeaderSearch />

          <div className="flex-shrink-0 flex items-center">
            <AuthNav />
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-white border-t border-slate-800">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Brand */}
            <div>
              <BrandLogo size="lg" showText variant="light" />
              <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-xs">
                Plataforma B2B exclusiva para clientes mayoristas del rubro mascotas. Catálogo con acceso controlado y precios comerciales.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-blue-300 border border-blue-700 bg-blue-950/50 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Plataforma en preparación
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Navegación</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
                <li><Link href="/catalogo" className="hover:text-white transition-colors">Catálogo</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Acceso clientes</Link></li>
              </ul>
            </div>

            {/* Access */}
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Información</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                El acceso a precios y condiciones comerciales es exclusivo para clientes aprobados. Contacta a tu ejecutivo comercial para obtener acceso al portal.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 py-4">
          <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} MYM Distribuidora. Todos los derechos reservados.
            </p>
            <p className="text-xs text-slate-600">Portal B2B — Solo para uso comercial autorizado</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
