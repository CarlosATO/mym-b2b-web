import 'server-only';
import { BsaleProduct, BsalePrice, BsaleStock } from './types';

// ADVERTENCIA DE SEGURIDAD:
// BSALE_ACCESS_TOKEN nunca debe ser enviado o expuesto al frontend.
// Todas las llamadas a Bsale deben realizarse desde el servidor.

const BSALE_API_BASE_URL = process.env.BSALE_API_BASE_URL || 'https://api.bsale.cl/v1';
const BSALE_TOKEN = process.env.BSALE_ACCESS_TOKEN;

export async function bsaleFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!BSALE_TOKEN) {
    throw new Error('BSALE_ACCESS_TOKEN is not defined');
  }

  const response = await fetch(`${BSALE_API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'access_token': BSALE_TOKEN,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Bsale API error: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchBsaleProducts(): Promise<BsaleProduct[]> {
  // Placeholder: No ejecutaremos llamadas reales sin credenciales válidas
  console.log('fetchBsaleProducts placeholder called');
  return [];
}

export async function fetchBsaleStock(variantId: string): Promise<BsaleStock> {
  // Placeholder
  console.log(`fetchBsaleStock placeholder called for ${variantId}`);
  return { quantity: 0 };
}

export async function fetchBsalePrices(variantId: string): Promise<BsalePrice[]> {
  // Placeholder
  console.log(`fetchBsalePrices placeholder called for ${variantId}`);
  return [];
}
