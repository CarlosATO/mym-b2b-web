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
