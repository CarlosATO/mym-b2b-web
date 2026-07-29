import BrandForm from '@/components/admin/BrandForm';
import Link from 'next/link';

export const metadata = {
  title: 'Nueva Marca | Admin',
};

export default function NewBrandPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/marcas"
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva Marca</h1>
          <p className="text-sm text-slate-500 mt-1">
            Agrega una nueva marca al catálogo B2B.
          </p>
        </div>
      </div>

      <BrandForm />
    </div>
  );
}
