import { BsaleVariantFixture, ExistingWebProductFixture } from './types';

const validBsaleSourceProductsFixture: BsaleVariantFixture[] = [
  // 1. Valid new product (original clashed with duplicates)
  {
    bsaleVariantId: 'bsale-100',
    sku: 'SKU-100',
    name: 'Tornillo de Acero 10mm',
    isActiveInBsale: true,
    stockQuantity: 500,
    price: 150
  },
  // 2. Valid product matching by bsaleVariantId (original clashed with duplicates)
  {
    bsaleVariantId: 'bsale-101',
    sku: 'SKU-101',
    name: 'Tuerca Hexagonal 10mm',
    isActiveInBsale: true
  },
  // 3. Valid product matching by SKU (missing bsaleVariantId in web DB)
  {
    bsaleVariantId: 'bsale-102',
    sku: 'SKU-102',
    name: 'Arandela Plana 10mm',
    isActiveInBsale: true
  },
  // 4. Missing SKU
  {
    bsaleVariantId: 'bsale-103',
    sku: null,
    name: 'Clavo de Acero',
    isActiveInBsale: true
  },
  // 5. Missing Name
  {
    bsaleVariantId: 'bsale-104',
    sku: 'SKU-104',
    name: '   ', // becomes null after trim
    isActiveInBsale: true
  },
  // 6. Duplicate SKU in payload (clashing with SKU-100 above)
  {
    bsaleVariantId: 'bsale-105',
    sku: 'SKU-100',
    name: 'Tornillo de Acero 10mm (Otra Caja)',
    isActiveInBsale: true
  },
  // 7. Duplicate bsaleVariantId in payload (clashing with bsale-101 above)
  {
    bsaleVariantId: 'bsale-101',
    sku: 'SKU-106',
    name: 'Tuerca Hexagonal Especial',
    isActiveInBsale: true
  },
  // 8. Sku / Variant mismatch
  {
    bsaleVariantId: 'bsale-107',
    sku: 'SKU-108',
    name: 'Llave Inglesa',
    isActiveInBsale: true
  },
  // 9. Inactive in Bsale but active in Web
  {
    bsaleVariantId: 'bsale-109',
    sku: 'SKU-109',
    name: 'Martillo Viejo',
    isActiveInBsale: false
  },
  // 10. Inactive in Bsale and does not exist in Web
  {
    bsaleVariantId: 'bsale-110',
    sku: 'SKU-110',
    name: 'Producto Descontinuado',
    isActiveInBsale: false
  },
  // 11. New Valid Create Case
  {
    bsaleVariantId: 'bsale-200',
    sku: 'SKU-200',
    name: 'Producto Nuevo Valido',
    isActiveInBsale: true,
    stockQuantity: 10,
    price: 1000
  },
  // 12. New Valid Update Case
  {
    bsaleVariantId: 'bsale-201',
    sku: 'SKU-201',
    name: 'Producto Existente Bsale',
    isActiveInBsale: true
  }
];

export const bsaleSourceProductsFixture: unknown[] = [
  ...validBsaleSourceProductsFixture,
  null // 13. Invalid payload entirely
];

export const existingWebProductsFixture: ExistingWebProductFixture[] = [
  // Matches case 2 (now duplicate)
  {
    id: 'db-uuid-101',
    sku: 'SKU-101',
    bsaleVariantId: 'bsale-101',
    name: 'Tuerca Hexagonal 10mm Web',
    slug: 'tuerca-hexagonal-10mm-web',
    isActive: true,
    isVisible: true,
    reviewStatus: 'published',
    hasCuratedContent: true
  },
  // Matches case 3
  {
    id: 'db-uuid-102',
    sku: 'SKU-102',
    bsaleVariantId: null,
    name: 'Arandela Plana 10mm Web',
    slug: 'arandela-plana-10mm',
    isActive: true,
    isVisible: true,
    reviewStatus: 'published',
    hasCuratedContent: true
  },
  // Mismatch for case 8: We have a product with bsale-107 but SKU-X, and a product with SKU-108 but bsale-Y
  {
    id: 'db-uuid-107',
    sku: 'SKU-X',
    bsaleVariantId: 'bsale-107',
    name: 'Llave Francesa',
    slug: 'llave-francesa',
    isActive: true,
    isVisible: true,
    reviewStatus: 'published',
    hasCuratedContent: false
  },
  {
    id: 'db-uuid-108',
    sku: 'SKU-108',
    bsaleVariantId: 'bsale-Y',
    name: 'Llave Inglesa',
    slug: 'llave-inglesa',
    isActive: true,
    isVisible: true,
    reviewStatus: 'published',
    hasCuratedContent: false
  },
  // Matches case 9
  {
    id: 'db-uuid-109',
    sku: 'SKU-109',
    bsaleVariantId: 'bsale-109',
    name: 'Martillo Viejo Web',
    slug: 'martillo-viejo',
    isActive: true,
    isVisible: true,
    reviewStatus: 'published',
    hasCuratedContent: true
  },
  // Matches case 12
  {
    id: 'db-uuid-201',
    sku: 'SKU-201',
    bsaleVariantId: 'bsale-201',
    name: 'Producto Existente Web',
    slug: 'producto-existente-web',
    isActive: true,
    isVisible: true,
    reviewStatus: 'published',
    hasCuratedContent: true
  }
];
