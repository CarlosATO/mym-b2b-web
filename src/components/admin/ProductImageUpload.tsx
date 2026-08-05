'use client';

import { useActionState, useEffect, useRef, useState, useTransition, type ChangeEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { importProductImageFromUrlAction, type ImportProductImageFromUrlState } from '@/app/actions/admin-product-images';
import { buildProductImageObjectPath, getProductImageExtension } from '@/lib/utils/product-image-storage';

interface ProductImageUploadProps {
  companyId: string;
  productId: string;
  value: string;
  onChange: (value: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const initialImportState: ImportProductImageFromUrlState = { success: false };

function getUploadError(file: File) {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return 'Formato no permitido. Usa JPG, PNG o WEBP.';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'El archivo supera el máximo permitido de 5 MB.';
  }

  return null;
}

function formatStorageError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Error al subir la imagen.';
  const normalized = message.toLowerCase();

  if (normalized.includes('row-level security') || normalized.includes('rls')) {
    return 'No tienes permisos para subir esta imagen a Storage.';
  }

  if (normalized.includes('jwt') || normalized.includes('auth')) {
    return 'Tu sesión no es válida. Vuelve a iniciar sesión.';
  }

  if (normalized.includes('already exists') || normalized.includes('duplicate')) {
    return 'Ya existe un archivo con ese nombre. Intenta subirlo de nuevo.';
  }

  return message;
}

export default function ProductImageUpload({ companyId, productId, value, onChange }: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [importState, importFormAction] = useActionState(importProductImageFromUrlAction, initialImportState);
  const [isImportPending, startImportTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (importState.success && importState.publicUrl) {
      onChange(importState.publicUrl);
    }
  }, [importState, onChange]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadMessage(null);
    setUploadError(null);

    const validationError = getUploadError(file);
    if (validationError) {
      setUploadError(validationError);
      event.target.value = '';
      return;
    }

    const ext = getProductImageExtension(file.type);
    if (!ext) {
      setUploadError('No se pudo determinar la extensión del archivo.');
      event.target.value = '';
      return;
    }

    if (!companyId || !productId) {
      setUploadError('Falta contexto del producto para subir la imagen.');
      event.target.value = '';
      return;
    }

    const objectPath = buildProductImageObjectPath({
      companyId,
      productId,
      extension: ext,
    });
    const supabase = createClient();

    setIsUploading(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(objectPath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('product-images').getPublicUrl(objectPath);
      const publicUrl = data.publicUrl;

      if (!publicUrl) {
        throw new Error('No se pudo obtener la URL pública de la imagen.');
      }

      onChange(publicUrl);
      setUploadMessage('Imagen subida correctamente. Recuerda guardar los cambios del producto.');
    } catch (uploadError: unknown) {
      setUploadError(formatStorageError(uploadError));
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <>
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="product_id" value={productId} />

      <div className="space-y-4">
      {value ? (
        <div className="h-56 w-full rounded border border-slate-200 bg-center bg-contain bg-no-repeat" style={{ backgroundImage: `url(${value})` }} />
      ) : (
        <div className="flex h-56 w-full items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">
          Sin imagen principal
        </div>
      )}

      <div>
        <label htmlFor="primary_image_url" className="block text-sm font-medium text-slate-700">URL imagen principal</label>
        <input
          type="url"
          name="primary_image_url"
          id="primary_image_url"
          value={value}
          readOnly
          placeholder="Se completará al importar"
          className="mt-1 block w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm shadow-sm"
        />
        </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? 'Subiendo...' : 'Subir desde mi computador'}
        </button>
        <span className="text-xs text-slate-500">Formatos permitidos: JPG, PNG, WEBP. Máximo 5 MB.</span>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
        <div>
          <label htmlFor="import_image_url" className="block text-sm font-medium text-slate-700">Importar imagen desde URL</label>
          <p className="mt-1 text-xs text-slate-500">La imagen se copiará a Storage propio. No dependeremos de la URL original.</p>
        </div>
        <input
          type="url"
          id="import_image_url"
          value={importUrl}
          onChange={(e) => setImportUrl(e.target.value)}
          placeholder="https://..."
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => {
            const formData = new FormData();
            formData.set('company_id', companyId);
            formData.set('product_id', productId);
            formData.set('primary_image_url', importUrl.trim());

            setUploadMessage(null);
            setUploadError(null);
            startImportTransition(() => {
              void importFormAction(formData);
            });
          }}
          disabled={isImportPending || isUploading || !importUrl.trim()}
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isImportPending ? 'Importando...' : 'Importar imagen'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {uploadMessage && <p className="text-sm font-medium text-green-700">{uploadMessage}</p>}
      {uploadError && <p className="text-sm font-medium text-red-700">{uploadError}</p>}
      {importState.success && importState.message && <p className="text-sm font-medium text-green-700">{importState.message}</p>}
      {!importState.success && importState.error && <p className="text-sm font-medium text-red-700">{importState.error}</p>}
      </div>
    </>
  );
}
