'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { AdminCategory } from '@/lib/api/admin-catalog';
import { upsertCategoryAction, ActionResponse } from '@/app/actions/admin-categories';
import { buildCategoryPathOptions, getCategoryDescendantIds } from '@/lib/utils/category-hierarchy';

interface CategoryFormProps {
  initialData?: AdminCategory | null;
  categories: AdminCategory[];
}

const initialState: ActionResponse = {
  success: false,
};

export default function CategoryForm({ initialData, categories }: CategoryFormProps) {
  const [state, formAction, isPending] = useActionState(upsertCategoryAction, initialState);
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [slugEdited, setSlugEdited] = useState(!!initialData);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    
    if (!slugEdited && newName) {
      const generatedSlug = newName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    } else if (!newName && !slugEdited) {
      setSlug('');
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setSlugEdited(true);
  };

  const descendantIds = initialData?.id ? getCategoryDescendantIds(categories, initialData.id) : new Set<string>();
  const availableParentOptions = buildCategoryPathOptions(categories).filter((option) => {
    if (!initialData?.id) {
      return true;
    }

    return option.id !== initialData.id && !descendantIds.has(option.id);
  });

  return (
    <form action={formAction} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      {state.message && (
        <div className={`p-4 rounded-md ${state.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {state.message}
        </div>
      )}

      {initialData && <input type="hidden" name="id" value={initialData.id} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nombre *</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={name}
            onChange={handleNameChange}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {state.errors?.name && <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>}
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-slate-700">Slug *</label>
          <input
            type="text"
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={handleSlugChange}
            pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
            title="Solo letras minúsculas, números y guiones."
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {state.errors?.slug && <p className="mt-1 text-sm text-red-600">{state.errors.slug[0]}</p>}
        </div>

        {/* Parent Category */}
        <div>
          <label htmlFor="parent_id" className="block text-sm font-medium text-slate-700">Categoría Padre</label>
          <p className="mt-1 text-xs text-slate-500">Deja vacío para crear una categoría principal. Selecciona una categoría padre para crear una subcategoría.</p>
          <select
            id="parent_id"
            name="parent_id"
            defaultValue={initialData?.parent_id || ''}
            className="mt-2 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
          >
            <option value="">Sin categoría padre</option>
            {availableParentOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.path}</option>
            ))}
          </select>
        </div>

        {/* Display Style */}
        <div>
          <label htmlFor="display_style" className="block text-sm font-medium text-slate-700">Estilo de Visualización</label>
          <select
            id="display_style"
            name="display_style"
            defaultValue={initialData?.display_style || 'grid'}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
          >
            <option value="grid">Grid (Tarjetas cuadradas)</option>
            <option value="list">Lista (Fila)</option>
            <option value="banner">Banner Destacado</option>
            <option value="hidden">Oculto</option>
          </select>
        </div>

        {/* Order Index */}
        <div>
          <label htmlFor="order_index" className="block text-sm font-medium text-slate-700">Orden de Visualización</label>
          <input
            type="number"
            id="order_index"
            name="order_index"
            defaultValue={initialData?.order_index || 0}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        {/* Icon Name */}
        <div>
          <label htmlFor="icon_name" className="block text-sm font-medium text-slate-700">Ícono (nombre/clase opcional)</label>
          <input
            type="text"
            id="icon_name"
            name="icon_name"
            defaultValue={initialData?.icon_name || ''}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Image URL */}
        <div className="md:col-span-2">
          <label htmlFor="image_url" className="block text-sm font-medium text-slate-700">URL Imagen Principal</label>
          <input
            type="url"
            id="image_url"
            name="image_url"
            defaultValue={initialData?.image_url || ''}
            placeholder="https://..."
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Banner URL */}
        <div className="md:col-span-2">
          <label htmlFor="banner_image_url" className="block text-sm font-medium text-slate-700">URL Imagen de Banner</label>
          <input
            type="url"
            id="banner_image_url"
            name="banner_image_url"
            defaultValue={initialData?.banner_image_url || ''}
            placeholder="https://..."
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">Descripción</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={initialData?.description || ''}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* SEO */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="seo_title" className="block text-sm font-medium text-slate-700">SEO Title</label>
            <input
              type="text"
              id="seo_title"
              name="seo_title"
              defaultValue={initialData?.seo_title || ''}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="seo_description" className="block text-sm font-medium text-slate-700">SEO Description</label>
            <input
              type="text"
              id="seo_description"
              name="seo_description"
              defaultValue={initialData?.seo_description || ''}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="md:col-span-2 flex flex-wrap gap-8 py-4 border-t border-slate-100">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              value="true"
              defaultChecked={initialData?.is_active ?? true}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
            />
            <span className="ml-2 text-sm text-slate-700 font-medium">Activa</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_visible_catalog"
              value="true"
              defaultChecked={initialData?.is_visible_catalog ?? true}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
            />
            <span className="ml-2 text-sm text-slate-700 font-medium">Visible en Catálogo</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_visible_home"
              value="true"
              defaultChecked={initialData?.is_visible_home ?? false}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
            />
            <span className="ml-2 text-sm text-slate-700 font-medium">Destacada en Portada</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-4 border-t border-slate-100 pt-6">
        <Link 
          href="/admin/categorias" 
          className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? 'Guardando...' : (initialData ? 'Actualizar Categoría' : 'Crear Categoría')}
        </button>
      </div>
    </form>
  );
}
