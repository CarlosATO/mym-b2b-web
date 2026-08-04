'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ProductImageUploadProps {
  companyId: string;
  productId: string;
  value: string;
  onChange: (value: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

function getFileExtension(mimeType: string) {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return null;
  }
}

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

function getRandomFileName(ext: string) {
  const randomId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${randomId}.${ext}`;
}

export default function ProductImageUpload({ companyId, productId, value, onChange }: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage(null);
    setError(null);

    const validationError = getUploadError(file);
    if (validationError) {
      setError(validationError);
      event.target.value = '';
      return;
    }

    const ext = getFileExtension(file.type);
    if (!ext) {
      setError('No se pudo determinar la extensión del archivo.');
      event.target.value = '';
      return;
    }

    if (!companyId || !productId) {
      setError('Falta contexto del producto para subir la imagen.');
      event.target.value = '';
      return;
    }

    const fileName = getRandomFileName(ext);
    const objectPath = `${companyId}/${productId}/${fileName}`;
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
      setMessage('Imagen subida correctamente. Recuerda guardar los cambios del producto.');
    } catch (uploadError: unknown) {
      setError(formatStorageError(uploadError));
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
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
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
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

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {message && <p className="text-sm font-medium text-green-700">{message}</p>}
      {error && <p className="text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}
