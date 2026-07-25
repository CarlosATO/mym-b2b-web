import { Banner } from '@/types';

export const mockBanners: Banner[] = [
  {
    id: 'banner_1',
    company_id: 'comp_1',
    title: 'Gran Oferta Mayorista',
    image_url: '/placeholder-banner-1.jpg',
    link_url: '/catalogo',
    position: 'hero',
    is_active: true,
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
