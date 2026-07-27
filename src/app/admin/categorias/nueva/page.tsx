import { createClient } from '@/lib/supabase/server';
import { getAdminCategories } from '@/lib/api/admin-catalog';
import CategoryForm from '@/components/admin/CategoryForm';
import Link from 'next/link';

export const metadata = {
  title: 'Nueva Categoría | Admin',
};

export default async function NewCategoryPage() {
  const supabase = await createClient();
  const companyId = process.env.MYM_COMPANY_ID;

  if (!companyId) {
    return <div>Error: Configuración de servidor incompleta (MYM_COMPANY_ID missing).</div>;
  }

  const categories = await getAdminCategories(supabase, companyId);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/categorias"
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva Categoría</h1>
          <p className="text-sm text-slate-500 mt-1">
            Agrega una nueva categoría al catálogo B2B.
          </p>
        </div>
      </div>

      <CategoryForm categories={categories} />
    </div>
  );
}
