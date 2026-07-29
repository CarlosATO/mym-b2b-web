'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { AdminBrand } from '@/lib/api/admin-catalog';
import { upsertBrandAction, BrandActionResponse } from '@/app/actions/admin-brands';

interface BrandFormProps {
  initialData?: AdminBrand | null;
}

const initialState: BrandActionResponse = {
  success: false,
};

export default function BrandForm({ initialData }: BrandFormProps) {
  const [state, formAction, isPending] = useActionState(upsertBrandAction, initialState);
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

        {/* Logo URL */}
        <div className="md:col-span-2">
          <label htmlFor="logo_url" className="block text-sm font-medium text-slate-700">URL Logo (opcional)</label>
          <input
            type="url"
            id="logo_url"
            name="logo_url"
            defaultValue={initialData?.logo_url || ''}
            placeholder="https://..."
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
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
        </div>
      </div>

      <div className="flex justify-end gap-4 border-t border-slate-100 pt-6">
        <Link 
          href="/admin/marcas" 
          className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? 'Guardando...' : (initialData ? 'Actualizar Marca' : 'Crear Marca')}
        </button>
      </div>
    </form>
  );
}
