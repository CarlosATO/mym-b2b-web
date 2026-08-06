import 'server-only';
import {
  B2BPriceReadResult,
  B2BStockReadResult,
  BsalePrice,
  BsalePriceListDetailsResponse,
  BsaleProduct,
  BsaleStock,
  BsaleStockResponse,
} from './types';

// ADVERTENCIA DE SEGURIDAD:
// BSALE_ACCESS_TOKEN nunca debe ser enviado o expuesto al frontend.
// Todas las llamadas a Bsale deben realizarse desde el servidor.

const BSALE_API_BASE_URL = process.env.BSALE_API_BASE_URL || 'https://api.bsale.io/v1';
const BSALE_TOKEN = process.env.BSALE_ACCESS_TOKEN;
const B2B_COMMERCIAL_PRICE_LIST_ID = 4;
const B2B_PRICE_LIST_DETAILS_ENDPOINT = `/price_lists/${B2B_COMMERCIAL_PRICE_LIST_ID}/details.json`;
const B2B_STOCK_ENDPOINT = '/stocks.json';

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
}

export async function bsaleFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!BSALE_TOKEN) {
    throw new Error('BSALE_ACCESS_TOKEN is not defined');
  }

  const response = await fetch(`${BSALE_API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'access_token': BSALE_TOKEN,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Bsale API error: ${response.status}`);
  }

  return response.json();
}

export async function fetchBsaleProducts(): Promise<BsaleProduct[]> {
  // Placeholder: No ejecutaremos llamadas reales sin credenciales válidas
  return [];
}

export async function getB2BPriceFromCommercialPriceListByVariantId(
  variantId: string | number
): Promise<B2BPriceReadResult> {
  const normalizedVariantId = String(variantId);

  try {
    const response = await bsaleFetch<BsalePriceListDetailsResponse>(
      `${B2B_PRICE_LIST_DETAILS_ENDPOINT}?variantid=${encodeURIComponent(normalizedVariantId)}`
    );

    const items = Array.isArray(response.items) ? response.items : [];
    const matchedItem = items.find((entry) => {
      const entryVariantId = entry?.variant?.id;
      return entryVariantId != null && String(entryVariantId) === normalizedVariantId;
    });

    if (!matchedItem) {
      return {
        status: 'not_found',
        priceWithTaxes: null,
        priceNet: null,
        currency: 'CLP',
        priceListId: B2B_COMMERCIAL_PRICE_LIST_ID,
        source: 'bsale_lp_comerciante',
        confidence: 'high',
      };
    }

    return {
      status: 'ok',
      priceWithTaxes: toNumber(matchedItem.variantValueWithTaxes),
      priceNet: toNumber(matchedItem.variantValue),
      currency: 'CLP',
      priceListId: B2B_COMMERCIAL_PRICE_LIST_ID,
      source: 'bsale_lp_comerciante',
      confidence: 'high',
    };
  } catch (error) {
    return {
      status: 'error',
      priceWithTaxes: null,
      priceNet: null,
      currency: 'CLP',
      priceListId: B2B_COMMERCIAL_PRICE_LIST_ID,
      source: 'bsale_lp_comerciante',
      confidence: 'high',
      errorMessage: error instanceof Error ? error.message : 'Unknown Bsale price error',
    };
  }
}

export async function getB2BStockByVariantId(variantId: string | number): Promise<B2BStockReadResult> {
  const normalizedVariantId = String(variantId);

  try {
    const response = await bsaleFetch<BsaleStockResponse>(
      `${B2B_STOCK_ENDPOINT}?variantid=${encodeURIComponent(normalizedVariantId)}`
    );

    const items = Array.isArray(response.items) ? response.items : [];

    if (items.length === 0) {
      return {
        status: 'not_found',
        quantityAvailableInternal: 0,
        availabilityStatus: 'consult',
        source: 'bsale_stock',
        confidence: 'high',
      };
    }

    const quantityAvailableInternal = items.reduce((sum, item) => sum + (toNumber(item.quantityAvailable) ?? 0), 0);
    const availabilityStatus = quantityAvailableInternal > 0 ? 'available' : 'out_of_stock';

    return {
      status: 'ok',
      quantityAvailableInternal,
      availabilityStatus,
      source: 'bsale_stock',
      confidence: 'high',
    };
  } catch (error) {
    return {
      status: 'error',
      quantityAvailableInternal: 0,
      availabilityStatus: 'consult',
      source: 'bsale_stock',
      confidence: 'high',
      errorMessage: error instanceof Error ? error.message : 'Unknown Bsale stock error',
    };
  }
}

export async function fetchBsaleStock(variantId: string): Promise<BsaleStock> {
  const stockResult = await getB2BStockByVariantId(variantId);
  return { quantity: stockResult.quantityAvailableInternal };
}

export async function fetchBsalePrices(variantId: string): Promise<BsalePrice[]> {
  const priceResult = await getB2BPriceFromCommercialPriceListByVariantId(variantId);

  if (priceResult.status !== 'ok' || priceResult.priceWithTaxes == null) {
    return [];
  }

  return [
    {
      id: 0,
      priceListId: priceResult.priceListId,
      variantId: Number(variantId),
      price: priceResult.priceWithTaxes,
      currency: priceResult.currency,
    },
  ];
}
