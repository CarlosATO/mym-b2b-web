import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getAdminCategories } from '@/lib/api/admin-catalog';
import { buildCategoryTree } from '@/lib/utils/category-hierarchy';

export const metadata = {
  title: 'Categorías | Admin',
};

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const companyId = process.env.MYM_COMPANY_ID;

  if (!companyId) {
    return <div>Error: Configuración de servidor incompleta (MYM_COMPANY_ID missing).</div>;
  }

  const categories = await getAdminCategories(supabase, companyId);
  const categoryTree = buildCategoryTree(categories);
  const totalCount = categories.length;

  const renderRows = (nodes: typeof categoryTree) => nodes.map((node) => {
    const category = node.category;
    const parentName = category.parent_id
      ? categories.find((c) => c.id === category.parent_id)?.name || 'Desconocido'
      : '-';
    const rowIsParent = node.depth === 0;
    const rowPadding = rowIsParent ? 'px-6 py-4' : 'px-6 py-2.5';
    const nameClass = rowIsParent ? 'text-sm font-semibold text-slate-900' : 'text-sm font-medium text-slate-700';
    const badgeClass = rowIsParent
      ? 'bg-slate-100 text-slate-700'
      : 'bg-blue-50 text-blue-700';

    return (
      <React.Fragment key={category.id}>
        <tr className={rowIsParent ? 'hover:bg-slate-50' : 'bg-slate-50/40 hover:bg-slate-100/60'}>
          <td className={rowPadding}>
            <div className="flex items-start gap-2" style={{ paddingLeft: `${node.depth * 16}px` }}>
              <span className={`mt-0.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeClass}`}>
                {rowIsParent ? 'Padre' : 'Hija'}
              </span>
              <div className="min-w-0">
                <div className={`flex items-center gap-2 ${nameClass}`}>
                  {node.depth > 0 && <span className="text-slate-400 font-normal">└─</span>}
                  <span className="truncate">{category.name}</span>
                </div>
                <div className="text-[11px] leading-4 text-slate-500">Ruta: {node.path}</div>
              </div>
            </div>
          </td>
          <td className={`${rowPadding} whitespace-nowrap text-sm text-slate-500`}>
            {category.slug}
          </td>
          <td className={`${rowPadding} whitespace-nowrap text-sm text-slate-500`}>
            {parentName}
          </td>
          <td className={`${rowPadding} whitespace-nowrap text-sm text-slate-500`}>
            {category.order_index}
          </td>
          <td className={`${rowPadding} whitespace-nowrap text-sm text-slate-500`}>
            {category.display_style}
          </td>
          <td className={`${rowPadding} whitespace-nowrap`}>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {category.is_active ? 'Activa' : 'Inactiva'}
              </span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${category.is_visible_catalog ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>
                {category.is_visible_catalog ? 'Catálogo' : 'No Catálogo'}
              </span>
              {category.is_visible_home && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 font-medium bg-amber-100 text-amber-800">
                  Portada
                </span>
              )}
            </div>
          </td>
          <td className={`${rowPadding} whitespace-nowrap text-right text-sm font-medium`}>
            <Link href={`/admin/categorias/${category.id}/editar`} className="text-blue-600 hover:text-blue-900">
              Editar
            </Link>
          </td>
        </tr>
        {node.children.length > 0 && renderRows(node.children)}
      </React.Fragment>
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categorías</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona la estructura del catálogo B2B. Mostrando {totalCount} categorías.
          </p>
        </div>
        <Link
          href="/admin/categorias/nueva"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-900 hover:bg-slate-800 transition-colors"
        >
          Nueva Categoría
        </Link>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        {totalCount === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">No hay categorías</h3>
            <p className="mt-1 text-sm text-slate-500">Comienza creando tu primera categoría para organizar el catálogo.</p>
            <div className="mt-6">
              <Link
                href="/admin/categorias/nueva"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Crear categoría
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Slug</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Padre</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Orden</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estilo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estados</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {renderRows(categoryTree)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
