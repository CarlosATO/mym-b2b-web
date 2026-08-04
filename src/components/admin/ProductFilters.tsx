'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { AdminBrand, AdminCategory } from '@/lib/api/admin-catalog';

type NormalizationFilter = 'all' | 'pending_normalization' | 'no_category' | 'no_brand' | 'no_image' | 'new_bsale';

interface ProductFiltersProps {
  q?: string;
  status?: string;
  category?: string;
  brand?: string;
  normalization?: NormalizationFilter;
  categories: AdminCategory[];
  brands: AdminBrand[];
}

function setQueryValue(params: URLSearchParams, key: string, value?: string) {
  const trimmed = value?.trim() ?? '';
  if (trimmed) {
    params.set(key, trimmed);
  } else {
    params.delete(key);
  }
}

export default function ProductFilters({
  q = '',
  status = '',
  category = '',
  brand = '',
  normalization = 'all',
  categories,
  brands,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(q);

  const sortedCategories = useMemo(() => categories.slice().sort((a, b) => a.name.localeCompare(b.name, 'es')), [categories]);
  const sortedBrands = useMemo(() => brands.slice().sort((a, b) => a.name.localeCompare(b.name, 'es')), [brands]);

  const updateQuery = (updates: Partial<Record<'q' | 'status' | 'category' | 'brand' | 'normalization', string>>) => {
    const params = new URLSearchParams();
    setQueryValue(params, 'q', updates.q ?? searchValue);
    setQueryValue(params, 'status', updates.status ?? status);
    setQueryValue(params, 'category', updates.category ?? category);
    setQueryValue(params, 'brand', updates.brand ?? brand);
    setQueryValue(params, 'normalization', updates.normalization ?? (normalization === 'all' ? '' : normalization));

    const queryString = params.toString();

    startTransition(() => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  };

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchValue !== q) {
        updateQuery({ q: searchValue });
      }
    }, 300);

    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-3 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2 items-end w-full">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500" htmlFor="q">Buscar</label>
            <input
              type="text"
              id="q"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Nombre o SKU..."
              className="w-full h-9 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 border"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500" htmlFor="status">Estado</label>
            <select
              name="status"
              id="status"
              value={status}
              onChange={(event) => updateQuery({ status: event.target.value })}
              className="h-9 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 border min-w-[150px]"
            >
              <option value="">Cualquier estado</option>
              <option value="draft">Borrador</option>
              <option value="ready">Listo</option>
              <option value="published">Publicado</option>
              <option value="hidden">Oculto</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500" htmlFor="category">Categoría</label>
            <select
              name="category"
              id="category"
              value={category}
              onChange={(event) => updateQuery({ category: event.target.value })}
              className="h-9 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 border min-w-[180px]"
            >
              <option value="">Todas las categorías</option>
              {sortedCategories.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500" htmlFor="brand">Marca</label>
            <select
              name="brand"
              id="brand"
              value={brand}
              onChange={(event) => updateQuery({ brand: event.target.value })}
              className="h-9 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 border min-w-[180px]"
            >
              <option value="">Todas las marcas</option>
              {sortedBrands.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500" htmlFor="normalization">Normalización</label>
            <select
              name="normalization"
              id="normalization"
              value={normalization}
              onChange={(event) => updateQuery({ normalization: event.target.value })}
              className="h-9 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 border min-w-[200px]"
            >
              <option value="all">Todos</option>
              <option value="pending_normalization">Pendientes de normalización</option>
              <option value="no_category">Sin categoría</option>
              <option value="no_brand">Sin marca</option>
              <option value="no_image">Sin imagen</option>
              <option value="new_bsale">Nuevos Bsale pendientes</option>
            </select>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 lg:text-right">
          <div>Orden sugerido: pendientes primero.</div>
          <div className={isPending ? 'opacity-70' : ''}>Vista actual se actualiza al cambiar filtros.</div>
        </div>
      </div>
    </div>
  );
}
