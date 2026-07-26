-- Seed Controlado: Catálogo Demo B2B
-- Objetivo: Generar datos mínimos para probar frontend sin integrar ERP ni llenar base de datos real.

DO $$
DECLARE
  v_company_id uuid := 'd1000000-0000-0000-0000-000000000001';
  v_brand_id uuid;
  v_category_id uuid;
  v_product1_id uuid;
  v_product2_id uuid;
  v_product3_id uuid;
BEGIN
  -- 1. Insertar o recuperar Marca
  INSERT INTO web_b2b.brands (company_id, name, slug, logo_url, is_active)
  VALUES (
    v_company_id, 
    'DEMO MYM', 
    'demo-mym', 
    'https://placehold.co/200x100/eeeeee/888888?text=DEMO+MYM', 
    true
  )
  ON CONFLICT (company_id, slug) DO UPDATE SET 
    name = EXCLUDED.name, 
    is_active = EXCLUDED.is_active
  RETURNING id INTO v_brand_id;

  -- 2. Insertar o recuperar Categoría
  INSERT INTO web_b2b.categories (company_id, name, slug, is_active)
  VALUES (
    v_company_id, 
    'Alimentos Demo', 
    'alimentos-demo', 
    true
  )
  ON CONFLICT (company_id, slug) DO UPDATE SET 
    name = EXCLUDED.name, 
    is_active = EXCLUDED.is_active
  RETURNING id INTO v_category_id;

  -- 3. Insertar o recuperar Productos (Sin precio, sin stock, sin bsale_variant_id)
  -- Producto 1
  INSERT INTO web_b2b.products (
    company_id, brand_id, category_id, name, slug, sku, 
    short_description, description, is_active, is_visible, is_featured
  ) VALUES (
    v_company_id, v_brand_id, v_category_id,
    'Demo Alimento Adulto 15kg', 'demo-alimento-adulto-15kg', 'DEMO-001',
    'Alimento premium para perros adultos', 'Descripción detallada del alimento premium demo...', 
    true, true, true
  )
  ON CONFLICT (company_id, sku) DO UPDATE SET 
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    is_active = EXCLUDED.is_active,
    is_visible = EXCLUDED.is_visible
  RETURNING id INTO v_product1_id;

  -- Producto 2
  INSERT INTO web_b2b.products (
    company_id, brand_id, category_id, name, slug, sku, 
    short_description, description, is_active, is_visible, is_featured
  ) VALUES (
    v_company_id, v_brand_id, v_category_id,
    'Demo Snack Mascota 500g', 'demo-snack-mascota-500g', 'DEMO-002',
    'Snack saludable de pollo', 'Descripción detallada del snack saludable...', 
    true, true, false
  )
  ON CONFLICT (company_id, sku) DO UPDATE SET 
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    is_active = EXCLUDED.is_active,
    is_visible = EXCLUDED.is_visible
  RETURNING id INTO v_product2_id;

  -- Producto 3
  INSERT INTO web_b2b.products (
    company_id, brand_id, category_id, name, slug, sku, 
    short_description, description, is_active, is_visible, is_featured
  ) VALUES (
    v_company_id, v_brand_id, v_category_id,
    'Demo Arena Sanitaria 10kg', 'demo-arena-sanitaria-10kg', 'DEMO-003',
    'Arena super aglomerante', 'Descripción detallada de arena sanitaria...', 
    true, true, true
  )
  ON CONFLICT (company_id, sku) DO UPDATE SET 
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    is_active = EXCLUDED.is_active,
    is_visible = EXCLUDED.is_visible
  RETURNING id INTO v_product3_id;

  -- Insertar imágenes para los productos (limpiar antes para evitar duplicados en cada corrida)
  DELETE FROM web_b2b.product_images WHERE product_id IN (v_product1_id, v_product2_id, v_product3_id);
  
  INSERT INTO web_b2b.product_images (product_id, url, alt_text, is_primary) VALUES
  (v_product1_id, 'https://placehold.co/600x600/eeeeee/888888?text=Demo+Alimento', 'Demo Alimento Adulto', true),
  (v_product2_id, 'https://placehold.co/600x600/eeeeee/888888?text=Demo+Snack', 'Demo Snack Mascota', true),
  (v_product3_id, 'https://placehold.co/600x600/eeeeee/888888?text=Demo+Arena', 'Demo Arena Sanitaria', true);

  -- 4. Banner Principal (Idempotente vía DELETE preventivo basado en link_url o similar)
  DELETE FROM web_b2b.banners WHERE company_id = v_company_id AND link_url = '/catalogo?demo=true';
  
  INSERT INTO web_b2b.banners (company_id, title, image_url, link_url, "position", is_active, order_index)
  VALUES (
    v_company_id,
    'Portal B2B MYM - Catálogo mayorista en preparación',
    'https://placehold.co/1200x400/eeeeee/888888?text=Portal+B2B+MYM',
    '/catalogo?demo=true',
    'hero',
    true,
    1
  );

END $$;
