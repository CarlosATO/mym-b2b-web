'use server';

import dns from 'node:dns/promises';
import net from 'node:net';
import { createClient } from '@/lib/supabase/server';
import { getCurrentWebAdminAccess } from '@/lib/api/admin-access';
import { getAdminProduct } from '@/lib/api/admin-catalog';
import {
  PRODUCT_IMAGE_MAX_BYTES,
  buildProductImageObjectPath,
  getProductImageExtension,
  isAllowedProductImageMimeType,
} from '@/lib/utils/product-image-storage';

export interface ImportProductImageFromUrlState {
  success: boolean;
  message?: string;
  error?: string;
  publicUrl?: string;
}

const PRIVATE_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
]);

function isPrivateIp(ip: string) {
  const ipVersion = net.isIP(ip);
  if (ipVersion === 4) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }

  if (ipVersion === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === '::1') return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    if (normalized.startsWith('fe80:')) return true;
  }

  return false;
}

async function isPrivateHostname(hostname: string) {
  if (PRIVATE_HOSTS.has(hostname.toLowerCase()) || hostname.toLowerCase().endsWith('.local')) {
    return true;
  }

  if (net.isIP(hostname)) {
    return isPrivateIp(hostname);
  }

  try {
    const resolved = await dns.lookup(hostname, { all: true });
    return resolved.some((entry) => isPrivateIp(entry.address));
  } catch {
    return false;
  }
}

function normalizeContentType(contentType: string | null) {
  return contentType?.split(';')[0]?.trim().toLowerCase() || null;
}

function errorResponse(message: string): ImportProductImageFromUrlState {
  return { success: false, error: message };
}

async function readResponseBodyWithLimit(response: Response, limitBytes: number) {
  if (!response.body) {
    throw new Error('La respuesta no contiene datos descargables.');
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      totalBytes += value.byteLength;
      if (totalBytes > limitBytes) {
        await reader.cancel();
        throw new Error('La imagen supera el máximo permitido de 5 MB.');
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return combined;
}

async function downloadImageFromUrl(rawUrl: string) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error('La URL no es válida.');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('La URL debe usar http o https.');
  }

  if (await isPrivateHostname(parsedUrl.hostname)) {
    throw new Error('No se permiten URLs locales o privadas.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(parsedUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`No se pudo descargar la imagen (HTTP ${response.status}).`);
    }

    const finalUrl = new URL(response.url);
    if (await isPrivateHostname(finalUrl.hostname)) {
      throw new Error('La URL final redirige a un destino privado o local.');
    }

    const contentType = normalizeContentType(response.headers.get('content-type'));
    if (!contentType || !isAllowedProductImageMimeType(contentType)) {
      throw new Error('La URL no apunta a una imagen permitida (JPG, PNG o WEBP).');
    }

    const contentLengthHeader = response.headers.get('content-length');
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      if (Number.isFinite(contentLength) && contentLength > PRODUCT_IMAGE_MAX_BYTES) {
        throw new Error('La imagen supera el máximo permitido de 5 MB.');
      }
    }

    return {
      bytes: await readResponseBodyWithLimit(response, PRODUCT_IMAGE_MAX_BYTES),
      contentType,
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('La descarga tardó demasiado y fue cancelada.');
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function importProductImageFromUrlAction(
  _prevState: ImportProductImageFromUrlState,
  formData: FormData
): Promise<ImportProductImageFromUrlState> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse('No autorizado');
    }

    const adminAccess = await getCurrentWebAdminAccess();
    if (!adminAccess?.is_active) {
      return errorResponse('No tienes permisos activos para subir imágenes.');
    }

    const companyId = (formData.get('company_id')?.toString() || process.env.MYM_COMPANY_ID || '').trim();
    const productId = (formData.get('product_id')?.toString() || '').trim();
    const imageUrl = (formData.get('primary_image_url')?.toString() || '').trim();

    if (!companyId || companyId !== adminAccess.company_id) {
      return errorResponse('La compañía no coincide con tu sesión.');
    }

    if (!productId) {
      return errorResponse('Falta el producto a asociar.');
    }

    if (!imageUrl) {
      return errorResponse('Debes pegar una URL de imagen antes de importar.');
    }

    const product = await getAdminProduct(supabase, companyId, productId);
    if (!product) {
      return errorResponse('El producto no existe o no pertenece a esta compañía.');
    }

    const remoteImage = await downloadImageFromUrl(imageUrl);
    const extension = getProductImageExtension(remoteImage.contentType);

    if (!extension) {
      return errorResponse('No se pudo determinar la extensión de la imagen.');
    }

    const objectPath = buildProductImageObjectPath({
      companyId,
      productId,
      extension,
    });

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(objectPath, new Blob([remoteImage.bytes], { type: remoteImage.contentType }), {
        contentType: remoteImage.contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('product-images').getPublicUrl(objectPath);
    const publicUrl = data.publicUrl;

    if (!publicUrl) {
      return errorResponse('No se pudo obtener la URL pública de la imagen.');
    }

    return {
      success: true,
      publicUrl,
      message: 'Imagen importada correctamente a Storage. Recuerda guardar los cambios del producto.',
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al importar la imagen desde URL.';
    return errorResponse(message);
  }
}
