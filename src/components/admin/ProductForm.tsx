'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminProduct, AdminCategory, AdminBrand } from '@/lib/api/admin-catalog';
import { saveAdminProduct } from '@/app/actions/admin-products';

interface ProductFormProps {
  initialData?: AdminProduct;
  categories: AdminCategory[];
  brands: AdminBrand[];
}

export default function ProductForm({ initialData, categories, brands }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // States to handle client-side slug generation if it's new
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [slugEdited, setSlugEdited] = useState(!!initialData?.slug);
  
  const [primaryImageUrl, setPrimaryImageUrl] = useState(initialData?.primary_image_url || '');

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!slugEdited) {
      setSlug(generateSlug(newName));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setSlugEdited(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await saveAdminProduct(formData, initialData?.id);

    if (result.success) {
      router.push('/admin/productos');
    } else {
      setError(result.error || 'Ocurrió un error al guardar');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700 font-medium">
              Este producto está preparado para integrarse con Bsale. Precios y stock se sincronizarán en fases posteriores; no se editan desde esta pantalla.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* Identificación / SKU */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-medium text-slate-900 mb-4">Identificación y Presentación Web</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-slate-700">SKU (Código único) *</label>
                <input
                  type="text"
                  name="sku"
                  id="sku"
                  required
                  defaultValue={initialData?.sku}
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nombre del Producto *</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={name}
                  onChange={handleNameChange}
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-slate-700">Slug (URL amigable) *</label>
                <input
                  type="text"
                  name="slug"
                  id="slug"
                  required
                  pattern="^[a-z0-9-]+$"
                  title="Solo minúsculas, números y guiones"
                  value={slug}
                  onChange={handleSlugChange}
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                />
                <p className="mt-1 text-xs text-slate-500">Solo minúsculas, números y guiones.</p>
              </div>

              <div>
                <label htmlFor="short_description" className="block text-sm font-medium text-slate-700">Descripción Corta</label>
                <textarea
                  name="short_description"
                  id="short_description"
                  rows={2}
                  defaultValue={initialData?.short_description || ''}
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">Descripción Completa</label>
                <textarea
                  name="description"
                  id="description"
                  rows={5}
                  defaultValue={initialData?.description || ''}
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                />
              </div>
            </div>
          </div>

          {/* Vínculo Bsale */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-medium text-slate-900 mb-4">Vínculo con Bsale (Fase Posterior)</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="bsale_variant_id" className="block text-sm font-medium text-slate-700">Variante ID (Bsale)</label>
                <input
                  type="text"
                  name="bsale_variant_id"
                  id="bsale_variant_id"
                  defaultValue={initialData?.bsale_variant_id || ''}
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border bg-slate-50"
                />
                <p className="mt-1 text-xs text-slate-500">ID interno de la variante en Bsale (dejar vacío si no está vinculado aún).</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bsale_sync_status" className="block text-sm font-medium text-slate-700">Estado de Sincronización</label>
                  <select
                    name="bsale_sync_status"
                    id="bsale_sync_status"
                    defaultValue={initialData?.bsale_sync_status || 'pending'}
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="synced">Sincronizado</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                
                <div className="flex items-center pt-6">
                  <div className="flex items-center h-5">
                    <input
                      id="bsale_sync_enabled"
                      name="bsale_sync_enabled"
                      type="checkbox"
                      defaultChecked={initialData?.bsale_sync_enabled ?? false}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-slate-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="bsale_sync_enabled" className="font-medium text-slate-700">Habilitar sincronización</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar del formulario */}
        <div className="space-y-6">
          
          {/* Publicación y Estado */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-medium text-slate-900 mb-4">Publicación</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="review_status" className="block text-sm font-medium text-slate-700">Estado del contenido</label>
                <select
                  name="review_status"
                  id="review_status"
                  defaultValue={initialData?.review_status || 'draft'}
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                >
                  <option value="draft">Borrador</option>
                  <option value="ready">Listo para publicar</option>
                  <option value="published">Publicado</option>
                  <option value="hidden">Oculto</option>
                </select>
              </div>

              <div className="pt-2 space-y-3">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      defaultChecked={initialData?.is_active ?? false}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-slate-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_active" className="font-medium text-slate-700">Activo (habilitado en catálogo)</label>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="is_visible"
                      name="is_visible"
                      type="checkbox"
                      defaultChecked={initialData?.is_visible ?? false}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-slate-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_visible" className="font-medium text-slate-700">Visible en tienda</label>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="is_featured"
                      name="is_featured"
                      type="checkbox"
                      defaultChecked={initialData?.is_featured ?? false}
                      className="focus:ring-blue-500 h-4 w-4 text-purple-600 border-slate-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_featured" className="font-medium text-slate-700">Destacado</label>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <label htmlFor="order_index" className="block text-sm font-medium text-slate-700">Índice de Orden</label>
                <input
                  type="number"
                  name="order_index"
                  id="order_index"
                  defaultValue={initialData?.order_index || 0}
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                />
              </div>
            </div>
          </div>

          {/* Clasificación */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-medium text-slate-900 mb-4">Clasificación</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-slate-700">Categoría Web</label>
                <select
                  name="category_id"
                  id="category_id"
                  defaultValue={initialData?.category_id || ''}
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                >
                  <option value="">Ninguna</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="brand_id" className="block text-sm font-medium text-slate-700">Marca Web</label>
                <select
                  name="brand_id"
                  id="brand_id"
                  defaultValue={initialData?.brand_id || ''}
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                >
                  <option value="">Ninguna</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Imagen Principal */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-medium text-slate-900 mb-4">Imagen Principal</h2>
            
            <div className="space-y-4">
              {primaryImageUrl ? (
                <div 
                  className="h-48 w-full bg-contain bg-no-repeat bg-center rounded border border-slate-200"
                  style={{ backgroundImage: `url(${primaryImageUrl})` }}
                />
              ) : (
                <div className="h-48 w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded flex items-center justify-center">
                  <span className="text-slate-400 text-sm">Sin imagen</span>
                </div>
              )}
              
              <div>
                <label htmlFor="primary_image_url" className="block text-sm font-medium text-slate-700">URL Temporal de Imagen</label>
                <input
                  type="url"
                  name="primary_image_url"
                  id="primary_image_url"
                  value={primaryImageUrl}
                  onChange={(e) => setPrimaryImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                />
                <p className="mt-1 text-xs text-slate-500">Carga de imágenes directo a Storage pendiente (Fase 6D).</p>
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-medium text-slate-900 mb-4">SEO</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="seo_title" className="block text-sm font-medium text-slate-700">Título SEO</label>
                <input
                  type="text"
                  name="seo_title"
                  id="seo_title"
                  defaultValue={initialData?.seo_title || ''}
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              <div>
                <label htmlFor="seo_description" className="block text-sm font-medium text-slate-700">Descripción SEO</label>
                <textarea
                  name="seo_description"
                  id="seo_description"
                  rows={3}
                  defaultValue={initialData?.seo_description || ''}
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={() => router.push('/admin/productos')}
          className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Crear Producto')}
        </button>
      </div>
    </form>
  );
}
