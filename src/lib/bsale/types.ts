export interface BsaleProduct {
  id: number;
  name: string;
  description: string;
  classification: number;
  // Añadir más campos según la API real de Bsale
}

export interface BsaleVariant {
  id: number;
  productId: number;
  description: string;
  sku: string;
  code: string;
  // Añadir más campos
}

export interface BsalePrice {
  id: number;
  priceListId: number;
  variantId: number;
  price: number;
  currency: string;
}

export interface BsaleStock {
  quantity: number;
  // Podría incluir desglose por sucursal
}

export interface BsalePriceListDetailItem {
  id?: number | string;
  variantValue?: number | string | null;
  variantValueWithTaxes?: number | string | null;
  variant?: {
    id?: number | string | null;
    href?: string | null;
  } | null;
}

export interface BsalePriceListDetailsResponse {
  count?: number | null;
  items?: BsalePriceListDetailItem[];
}

export interface BsaleStockItem {
  id?: number | string;
  quantity?: number | string | null;
  quantityAvailable?: number | string | null;
  variant?: {
    id?: number | string | null;
    href?: string | null;
  } | null;
  office?: {
    id?: number | string | null;
    href?: string | null;
  } | null;
}

export interface BsaleStockResponse {
  count?: number | null;
  items?: BsaleStockItem[];
}

export type BsaleCommercialAvailabilityStatus = 'consult' | 'available' | 'out_of_stock';

export interface B2BPriceReadResult {
  status: 'ok' | 'not_found' | 'error';
  priceWithTaxes: number | null;
  priceNet: number | null;
  currency: 'CLP';
  priceListId: number;
  source: 'bsale_lp_comerciante';
  confidence: 'high';
  errorMessage?: string;
}

export interface B2BStockReadResult {
  status: 'ok' | 'not_found' | 'error';
  quantityAvailableInternal: number;
  availabilityStatus: BsaleCommercialAvailabilityStatus;
  source: 'bsale_stock';
  confidence: 'high';
  errorMessage?: string;
}
