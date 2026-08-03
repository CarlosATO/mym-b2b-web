import { createClient } from '@/lib/supabase/server';
import { getAdminCategories, getAdminBrands } from '@/lib/api/admin-catalog';
import ProductForm from '@/components/admin/ProductForm';

export const metadata = {
  title: 'Nuevo Producto | Admin',
};

export default async function NewAdminProductPage() {
  const supabase = await createClient();
  const companyId = process.env.MYM_COMPANY_ID;

  if (!companyId) {
    return <div>Error: Configuración de servidor incompleta (MYM_COMPANY_ID missing).</div>;
  }

  const [categories, brands] = await Promise.all([
    getAdminCategories(supabase, companyId),
    getAdminBrands(supabase, companyId)
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo Producto</h1>
        <p className="text-sm text-slate-500 mt-1">
          Crea un nuevo producto en el catálogo B2B. Los precios y el stock se gestionan a través de Bsale.
        </p>
      </div>

      <ProductForm 
        categories={categories} 
        brands={brands} 
      />
    </div>
  );
}
