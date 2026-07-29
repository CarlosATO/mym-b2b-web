import { createClient } from '@/lib/supabase/server';
import { getAdminBrands } from '@/lib/api/admin-catalog';
import BrandForm from '@/components/admin/BrandForm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Editar Marca | Admin',
};

interface EditBrandPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBrandPage({ params }: EditBrandPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const companyId = process.env.MYM_COMPANY_ID;

  if (!companyId) {
    return <div>Error: Configuración de servidor incompleta (MYM_COMPANY_ID missing).</div>;
  }

  const brands = await getAdminBrands(supabase, companyId);
  const brand = brands.find((b) => b.id === id);

  if (!brand) {
    notFound();
  }

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
          <h1 className="text-2xl font-bold text-slate-900">Editar Marca</h1>
          <p className="text-sm text-slate-500 mt-1">
            Modificando: {brand.name}
          </p>
        </div>
      </div>

      <BrandForm initialData={brand} />
    </div>
  );
}
