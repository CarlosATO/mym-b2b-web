import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminProduct, getAdminCategories, getAdminBrands } from '@/lib/api/admin-catalog';
import ProductForm from '@/components/admin/ProductForm';

export const metadata = {
  title: 'Editar Producto | Admin',
};

export default async function EditAdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient();
  const companyId = process.env.MYM_COMPANY_ID;

  if (!companyId) {
    return <div>Error: Configuración de servidor incompleta (MYM_COMPANY_ID missing).</div>;
  }

  const resolvedParams = await params;
  const productId = resolvedParams.id;

  const [product, categories, brands] = await Promise.all([
    getAdminProduct(supabase, companyId, productId),
    getAdminCategories(supabase, companyId),
    getAdminBrands(supabase, companyId)
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Editar Producto</h1>
        <p className="text-sm text-slate-500 mt-1">
          Normaliza la información comercial de {product.name} antes de publicar.
        </p>
      </div>

      <ProductForm 
        companyId={companyId}
        initialData={product}
        categories={categories} 
        brands={brands} 
      />
    </div>
  );
}
