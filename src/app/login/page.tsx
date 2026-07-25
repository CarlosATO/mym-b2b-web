import PublicLayout from '@/components/layout/PublicLayout';
import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';

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
            
            <LoginForm />
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
