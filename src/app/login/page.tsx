import PublicLayout from '@/components/layout/PublicLayout';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Iniciar Sesión B2B</h1>
              <p className="text-sm text-slate-500 mt-2">Accede a tu cuenta comercial de MYM</p>
            </div>
            
            <form className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <input 
                  type="email" 
                  id="email" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ejemplo@empresa.com"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Contraseña
                  </label>
                  <Link href="#" className="text-xs text-blue-600 hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <input 
                  type="password" 
                  id="password" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
              
              <button 
                type="button" 
                className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors mt-6"
              >
                Ingresar
              </button>
            </form>
          </div>
          
          <div className="bg-slate-50 p-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600 mb-2">¿Aún no eres cliente B2B?</p>
            <Link 
              href="#" 
              className="inline-block px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50 transition-colors text-sm"
            >
              Solicita acceso comercial
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
