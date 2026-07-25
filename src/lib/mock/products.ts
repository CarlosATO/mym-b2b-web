import { Product } from '@/types';

export const mockProducts: Product[] = [
  {
    id: 'prod_1',
    company_id: 'comp_1',
    brand_id: 'brand_1',
    category_id: 'cat_1',
    name: 'Producto de Ejemplo 1',
    slug: 'producto-ejemplo-1',
    sku: 'MOCK-001',
    short_description: 'Descripción corta del producto 1.',
    description: 'Descripción detallada del producto 1 para clientes B2B.',
    is_active: true,
    is_visible: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_2',
    company_id: 'comp_1',
    brand_id: 'brand_2',
    category_id: 'cat_1',
    name: 'Producto de Ejemplo 2',
    slug: 'producto-ejemplo-2',
    sku: 'MOCK-002',
    short_description: 'Descripción corta del producto 2.',
    description: 'Descripción detallada del producto 2 para clientes B2B.',
    is_active: true,
    is_visible: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
