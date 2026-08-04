'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminProduct, AdminCategory, AdminBrand } from '@/lib/api/admin-catalog';
import { saveAdminProduct } from '@/app/actions/admin-products';
import { formatMissingPublicationFields, validateProductPublicationReadiness } from '@/lib/utils/product-publication';
import { getCategorySelection, getTopLevelCategories, getChildCategories, hasChildCategories, getCategoryById } from '@/lib/utils/category-hierarchy';
import ProductImageUpload from '@/components/admin/ProductImageUpload';

interface ProductFormProps {
  companyId: string;
  initialData?: AdminProduct;
  categories: AdminCategory[];
  brands: AdminBrand[];
}

function createSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function ChecklistPill({ complete }: { complete: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${complete ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
      {complete ? 'Completo' : 'Pendiente'}
    </span>
  );
}

export default function ProductForm({ companyId, initialData, categories, brands }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [slugEdited, setSlugEdited] = useState(!!initialData?.slug);
  const [shortDescription, setShortDescription] = useState(initialData?.short_description || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const initialCategorySelection = useMemo(
    () => getCategorySelection(categories, initialData?.category_id),
    [categories, initialData?.category_id]
  );
  const [parentCategoryId, setParentCategoryId] = useState(initialCategorySelection.parentId);
  const [subcategoryId, setSubcategoryId] = useState(initialCategorySelection.childId);
  const [brandId, setBrandId] = useState(initialData?.brand_id || '');
  const [primaryImageUrl, setPrimaryImageUrl] = useState(initialData?.primary_image_url || '');
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description || '');
  const [reviewStatus, setReviewStatus] = useState(initialData?.review_status || 'draft');
  const [isActive, setIsActive] = useState(initialData?.is_active ?? false);
  const [isVisible, setIsVisible] = useState(initialData?.is_visible ?? false);
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured ?? false);
  const [orderIndex, setOrderIndex] = useState(String(initialData?.order_index ?? 0));

  const isNewBsale = Boolean(
    initialData?.bsale_variant_id
    && initialData.bsale_sync_status === 'pending'
    && initialData.review_status === 'draft'
    && !initialData.is_active
    && !initialData.is_visible
  );

  const parentCategories = useMemo(() => getTopLevelCategories(categories), [categories]);
  const subcategoryOptions = useMemo(() => (
    parentCategoryId ? getChildCategories(categories, parentCategoryId) : []
  ), [categories, parentCategoryId]);
  const selectedCategoryId = subcategoryId || parentCategoryId || '';
  const selectedCategory = useMemo(() => getCategoryById(categories, selectedCategoryId), [categories, selectedCategoryId]);
  const publicationIntent = reviewStatus === 'published' || isActive || isVisible || isFeatured;
  const parentCategoryHasChildren = parentCategoryId ? hasChildCategories(categories, parentCategoryId) : false;
  const categoryRequiresSpecificChild = Boolean(parentCategoryId && parentCategoryHasChildren && !subcategoryId);
  const publicationCategoryRequiresChild = publicationIntent && categoryRequiresSpecificChild;

  const publicationReadiness = validateProductPublicationReadiness({
    category_id: selectedCategoryId,
    brand_id: brandId,
    primary_image_url: primaryImageUrl,
    name,
    slug,
    short_description: shortDescription,
    description,
  });
  const missingPublicationFields = formatMissingPublicationFields(publicationReadiness.missingFields);
  const publicationMissingCategory = publicationCategoryRequiresChild
    ? 'subcategoría específica'
    : null;
  const publicationMissingFields = [missingPublicationFields, publicationMissingCategory].filter(Boolean).join(', ');
  const publicationReadyToPublish = publicationReadiness.isReady && !categoryRequiresSpecificChild;

  const checklist = useMemo(() => ([
    { label: 'Categoría / Familia', complete: Boolean(selectedCategoryId) && !categoryRequiresSpecificChild },
    { label: 'Marca web', complete: Boolean(brandId) },
    { label: 'Imagen principal', complete: Boolean(primaryImageUrl.trim()) },
    { label: 'Descripción corta', complete: Boolean(shortDescription.trim()) },
    { label: 'Descripción larga', complete: Boolean(description.trim()) },
    { label: 'SEO', complete: Boolean(seoTitle.trim() && seoDescription.trim()) },
    { label: 'Producto visible / publicado', complete: publicationReadyToPublish && publicationIntent },
  ]), [selectedCategoryId, categoryRequiresSpecificChild, brandId, primaryImageUrl, shortDescription, description, seoTitle, seoDescription, publicationReadyToPublish, publicationIntent]);

  const completeCount = checklist.filter((item) => item.complete).length;
  const selectedCategoryPath = useMemo(() => {
    if (!selectedCategory) return '';
    if (!selectedCategory.parent_id) return selectedCategory.name;

    const parentName = parentCategories.find((category) => category.id === selectedCategory.parent_id)?.name || 'Ninguna';
    return `${parentName} > ${selectedCategory.name}`;
  }, [parentCategories, selectedCategory]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await saveAdminProduct(formData, initialData?.id);

    if (result.success) {
      router.push('/admin/productos');
      return;
    }

    setError(result.error || 'Ocurrió un error al guardar');
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-6xl space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="max-w-4xl text-sm leading-6 text-blue-700 font-medium">
          Este producto proviene de Bsale. La identidad operacional no debe editarse desde la web. Precios y stock siguen fuera de esta pantalla.
        </p>
        {isNewBsale && (
          <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-800 font-semibold">
            Producto recién importado desde Bsale. Debe normalizarse antes de publicarlo.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Identidad Bsale</h2>
            <p className="mt-1 text-sm text-slate-500">Solo lectura. Esta identidad no debe editarse desde la web.</p>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-slate-700">SKU</label>
                <input
                  type="text"
                  name="sku"
                  id="sku"
                  readOnly={!!initialData}
                  defaultValue={initialData?.sku}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm ${initialData ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'}`}
                />
              </div>
              <div>
                <label htmlFor="bsale_variant_id" className="block text-sm font-medium text-slate-700">Bsale Variant ID</label>
                <input
                  type="text"
                  name="bsale_variant_id"
                  id="bsale_variant_id"
                  readOnly={!!initialData?.bsale_variant_id}
                  defaultValue={initialData?.bsale_variant_id || ''}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm ${initialData?.bsale_variant_id ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'}`}
                />
              </div>
              <div>
                <div className="block text-sm font-medium text-slate-700">Estado sync Bsale</div>
                <div className="mt-1 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                  {initialData?.bsale_sync_status || 'pending'}
                </div>
                <input type="hidden" name="bsale_sync_status" value={initialData?.bsale_sync_status || 'pending'} />
              </div>
              <div>
                <div className="block text-sm font-medium text-slate-700">Sincronización Bsale</div>
                <div className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${initialData?.bsale_sync_enabled ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}`}>
                  {initialData?.bsale_sync_enabled ? 'habilitada' : 'deshabilitada'}
                </div>
                {initialData?.bsale_sync_enabled && <input type="hidden" name="bsale_sync_enabled" value="on" />}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Normalización comercial</h2>
            <p className="mt-1 text-sm text-slate-500">Categoría/Familia define dónde aparecerá el producto en la web. Marca ayuda a filtrar y ordenar comercialmente.</p>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nombre comercial</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setName(newName);
                    if (!slugEdited) {
                      setSlug(createSlug(newName));
                    }
                  }}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-slate-700">Slug</label>
                <input
                  type="text"
                  name="slug"
                  id="slug"
                  required
                  pattern="^[a-z0-9-]+$"
                  title="Solo minúsculas, números y guiones"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugEdited(true);
                  }}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-500">Solo minúsculas, números y guiones.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="category_parent_id" className="block text-sm font-medium text-slate-700">Categoría principal</label>
                  <select
                    id="category_parent_id"
                    value={parentCategoryId}
                    onChange={(e) => {
                      setParentCategoryId(e.target.value);
                      setSubcategoryId('');
                    }}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Ninguna</option>
                    {parentCategories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <input type="hidden" name="category_parent_id" value={parentCategoryId} />
                </div>

                <div>
                  <label htmlFor="category_subcategory_id" className="block text-sm font-medium text-slate-700">Subcategoría</label>
                  <select
                    id="category_subcategory_id"
                    value={subcategoryId}
                    onChange={(e) => setSubcategoryId(e.target.value)}
                    disabled={!parentCategoryId || subcategoryOptions.length === 0}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="">{parentCategoryId ? 'Sin subcategoría' : 'Selecciona una categoría principal'}</option>
                    {subcategoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <input type="hidden" name="category_subcategory_id" value={subcategoryId} />
                  <input type="hidden" name="category_id" value={selectedCategoryId} />
                  <p className="mt-1 text-xs text-slate-500">Selecciona la subcategoría más específica disponible.</p>
                  {selectedCategoryPath && (
                    <p className="mt-1 text-xs font-medium text-slate-600">Ruta elegida: {selectedCategoryPath}</p>
                  )}
                  {parentCategoryId && subcategoryOptions.length === 0 && (
                    <p className="mt-1 text-xs text-slate-500">Esta categoría principal no tiene subcategorías.</p>
                  )}
                  {publicationMissingCategory && (
                    <p className="mt-1 text-xs font-medium text-amber-700">Para publicar, selecciona una {publicationMissingCategory}.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="brand_id" className="block text-sm font-medium text-slate-700">Marca web</label>
                  <select
                    name="brand_id"
                    id="brand_id"
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Ninguna</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="short_description" className="block text-sm font-medium text-slate-700">Descripción corta</label>
                <textarea
                  name="short_description"
                  id="short_description"
                  rows={3}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">Descripción larga</label>
                <textarea
                  name="description"
                  id="description"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Imagen principal</h2>
            <p className="mt-1 text-sm text-slate-500">Sube una imagen desde tu computador o pega una URL. La importación masiva desde la web actual vendrá después.</p>

            <div className="mt-4 space-y-4">
              <ProductImageUpload
                companyId={companyId}
                productId={initialData?.id || ''}
                value={primaryImageUrl}
                onChange={setPrimaryImageUrl}
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">SEO</h2>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="seo_title" className="block text-sm font-medium text-slate-700">SEO title</label>
                <input
                  type="text"
                  name="seo_title"
                  id="seo_title"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="seo_description" className="block text-sm font-medium text-slate-700">SEO description</label>
                <textarea
                  name="seo_description"
                  id="seo_description"
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Checklist de normalización</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{completeCount}/{checklist.length}</span>
            </div>
            <div className="mt-4 space-y-2">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <ChecklistPill complete={item.complete} />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Estado y publicación</h2>
            <p className="mt-1 text-sm text-amber-700">Publica solo cuando categoría, marca, imagen y contenido estén revisados.</p>

            <div className={`mt-4 rounded-md border p-4 ${publicationReadiness.isReady ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                <p className={`text-sm font-medium ${publicationReadyToPublish ? 'text-green-800' : 'text-amber-800'}`}>
                  {publicationReadyToPublish ? 'Este producto está listo para publicación.' : 'Este producto aún no está listo para publicación.'}
                </p>
                {!publicationReadyToPublish && (
                  <p className="mt-1 text-sm text-amber-700">
                    Falta: {publicationMissingFields || 'completar la clasificación' }.
                  </p>
                )}
                {publicationIntent && !publicationReadyToPublish && (
                  <p className="mt-2 text-sm font-semibold text-red-700">
                    Si intentas dejarlo activo, visible o publicado ahora, el guardado será bloqueado.
                  </p>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="review_status" className="block text-sm font-medium text-slate-700">Estado del contenido</label>
                <select
                  name="review_status"
                  id="review_status"
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="draft">Borrador</option>
                  <option value="ready">Listo para publicar</option>
                  <option value="published">Publicado</option>
                  <option value="hidden">Oculto</option>
                </select>
              </div>

              <div className="space-y-3 pt-1">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    <span className="font-medium text-slate-700">Activo</span>
                    <span className="block text-slate-500">Habilitado en catálogo.</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 text-sm">
                  <input
                    id="is_visible"
                    name="is_visible"
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    <span className="font-medium text-slate-700">Visible en tienda</span>
                    <span className="block text-slate-500">Se expone en catálogo público.</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 text-sm">
                  <input
                    id="is_featured"
                    name="is_featured"
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-blue-500"
                  />
                  <span>
                    <span className="font-medium text-slate-700">Destacado</span>
                    <span className="block text-slate-500">Solo para productos curados.</span>
                  </span>
                </label>
              </div>

              <div>
                <label htmlFor="order_index" className="block text-sm font-medium text-slate-700">Índice de orden</label>
                <input
                  type="number"
                  name="order_index"
                  id="order_index"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="flex justify-end gap-4 border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={() => router.push('/admin/productos')}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
