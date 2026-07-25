import React from 'react';
import Link from 'next/link';
import AuthNav from './AuthNav';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl">
                MYM
              </div>
              <span className="font-semibold text-lg hidden sm:block">Distribuidora</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium hover:text-blue-600 transition-colors">
                Inicio
              </Link>
              <Link href="/catalogo" className="text-sm font-medium hover:text-blue-600 transition-colors">
                Catálogo
              </Link>
              <Link href="#" className="text-sm font-medium hover:text-blue-600 transition-colors">
                Marcas
              </Link>
              <Link href="#" className="text-sm font-medium hover:text-blue-600 transition-colors">
                Contacto
              </Link>
            </nav>
          </div>
          
          <div>
            <AuthNav />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
                MYM
              </div>
              <span className="font-semibold">Distribuidora</span>
            </div>
            <p className="text-sm text-slate-500">
              Plataforma B2B exclusiva para clientes comerciales.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Catálogo</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/catalogo" className="hover:text-blue-600">Ver Todo</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Novedades</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Promociones</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Soporte</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="#" className="hover:text-blue-600">Contacto</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Preguntas Frecuentes</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Términos y Condiciones</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>ventas@mymdistribuidora.cl</li>
              <li>+56 9 0000 0000</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-slate-100 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} MYM Distribuidora. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
