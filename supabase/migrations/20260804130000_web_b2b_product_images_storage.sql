-- ==============================================================================
-- MIGRACIÓN 6D.5E-A: Base Storage para imágenes de productos
-- ==============================================================================

-- ----------------------------------------------------------------------------
-- 1. Helpers de validación de rutas en Storage
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION web_b2b.storage_object_company_id(object_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_company text;
BEGIN
  IF object_name IS NULL OR object_name = '' THEN
    RETURN NULL;
  END IF;

  IF array_length(string_to_array(object_name, '/'), 1) < 3 THEN
    RETURN NULL;
  END IF;

  v_company := split_part(object_name, '/', 1);

  IF v_company = '' THEN
    RETURN NULL;
  END IF;

  RETURN v_company::uuid;
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION web_b2b.storage_object_product_id(object_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_product text;
BEGIN
  IF object_name IS NULL OR object_name = '' THEN
    RETURN NULL;
  END IF;

  IF array_length(string_to_array(object_name, '/'), 1) < 3 THEN
    RETURN NULL;
  END IF;

  v_product := split_part(object_name, '/', 2);

  IF v_product = '' THEN
    RETURN NULL;
  END IF;

  RETURN v_product::uuid;
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION web_b2b.can_manage_product_image_object(object_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  v_company_id := web_b2b.storage_object_company_id(object_name);

  IF v_company_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN web_b2b.is_web_content_manager_for_company(v_company_id);
END;
$$;

REVOKE ALL ON FUNCTION web_b2b.storage_object_company_id(text) FROM public;
REVOKE ALL ON FUNCTION web_b2b.storage_object_company_id(text) FROM anon;
REVOKE ALL ON FUNCTION web_b2b.storage_object_company_id(text) FROM authenticated;

REVOKE ALL ON FUNCTION web_b2b.storage_object_product_id(text) FROM public;
REVOKE ALL ON FUNCTION web_b2b.storage_object_product_id(text) FROM anon;
REVOKE ALL ON FUNCTION web_b2b.storage_object_product_id(text) FROM authenticated;

REVOKE ALL ON FUNCTION web_b2b.can_manage_product_image_object(text) FROM public;
REVOKE ALL ON FUNCTION web_b2b.can_manage_product_image_object(text) FROM anon;
REVOKE ALL ON FUNCTION web_b2b.can_manage_product_image_object(text) FROM authenticated;

GRANT EXECUTE ON FUNCTION web_b2b.storage_object_company_id(text) TO authenticated;
GRANT EXECUTE ON FUNCTION web_b2b.storage_object_product_id(text) TO authenticated;
GRANT EXECUTE ON FUNCTION web_b2b.can_manage_product_image_object(text) TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. Bucket product-images
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    public = EXCLUDED.public;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'storage'
      AND table_name = 'buckets'
      AND column_name = 'file_size_limit'
  ) THEN
    EXECUTE 'UPDATE storage.buckets SET file_size_limit = 5242880 WHERE id = ''product-images''';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'storage'
      AND table_name = 'buckets'
      AND column_name = 'allowed_mime_types'
  ) THEN
    EXECUTE 'UPDATE storage.buckets
             SET allowed_mime_types = ARRAY[''image/jpeg'', ''image/png'', ''image/webp'']
             WHERE id = ''product-images''';
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- 3. Policies sobre storage.objects
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "product-images public read" ON storage.objects;
DROP POLICY IF EXISTS "product-images admin insert" ON storage.objects;
DROP POLICY IF EXISTS "product-images admin update" ON storage.objects;
DROP POLICY IF EXISTS "product-images admin delete" ON storage.objects;

CREATE POLICY "product-images public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "product-images admin insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND web_b2b.can_manage_product_image_object(name)
);

CREATE POLICY "product-images admin update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND web_b2b.can_manage_product_image_object(name)
)
WITH CHECK (
  bucket_id = 'product-images'
  AND web_b2b.can_manage_product_image_object(name)
);

CREATE POLICY "product-images admin delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND web_b2b.can_manage_product_image_object(name)
);

-- ----------------------------------------------------------------------------
-- 4. Notas de seguridad
-- ----------------------------------------------------------------------------
-- Ruta recomendada: company_id/product_id/uuid.ext
-- Lectura pública: sí, solo para este bucket.
-- Escritura: solo authenticated con permiso content manager/admin para la compañía de la primera carpeta.
-- No se modifica web_b2b.products, product_prices, product_stock ni primary_image_url.
