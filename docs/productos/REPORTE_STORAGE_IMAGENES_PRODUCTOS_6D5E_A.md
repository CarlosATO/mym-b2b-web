# Reporte - Base Storage para Imágenes de Productos (Fase 6D.5E-A)

- **Fecha/hora local**: 2026-08-04 12:13 (-0400)
- **Ámbito**: bucket real de Supabase Storage + migración candidata aplicada
- **Sin cambios de datos**: no productos, no precios, no stock, no imágenes reales

## Objetivo

Preparar y validar el bucket `product-images` y sus policies para que las imágenes de productos vivan en Storage propio.

## Estado real del bucket

- Bucket creado manualmente por Carlos en el panel de Supabase.
- `public = true`.
- `file_size_limit = 5242880`.
- `allowed_mime_types = {image/jpeg,image/png,image/webp}`.

## Lo que se implementó en la migración

- Helpers de extracción de contexto desde el path del objeto:
  - `web_b2b.storage_object_company_id(text)`
  - `web_b2b.storage_object_product_id(text)`
  - `web_b2b.can_manage_product_image_object(text)`
- Bucket `storage.buckets`:
  - `product-images`
  - `public = true`
  - intento de límite de 5 MB
  - intento de permitir `image/jpeg`, `image/png` y `image/webp`
- Policies en `storage.objects`:
  - lectura pública del bucket
  - insert/update/delete solo para usuarios autenticados con permiso de contenido/admin sobre la compañía indicada en la ruta

## Ajustes hechos durante la validación

- Se corrigió un `EXECUTE` anidado que rompía el SQL.
- Se removió `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY` porque el rol de ejecución no es owner de esa tabla.
- Se simplificó el helper de escritura para validar solo la primera carpeta (`company_id`) y `is_web_content_manager_for_company`.

## Validación técnica

- La migración se ejecutó dentro de `BEGIN; ... ROLLBACK;`.
- La migración se aplicó también en Supabase real.
- Dentro de la transacción, el bucket y las policies aparecieron correctamente.
- Fuera de la transacción, no quedaron residuos persistidos.

## Contadores observados

- Antes de la validación: bucket ya existente, policies `0`.
- Dentro de la transacción: `product-images=1`, policies `4`.
- Después del rollback: bucket persistente `1`, policies persistentes `4`.

## Resultado

- Base Storage preparada y validada en real.
- Sin tocar `web_b2b.products`, `web_b2b.product_prices`, `web_b2b.product_stock` ni `primary_image_url`.

## Próximos pasos

1. Implementar la fase 6D.5E-B para carga individual desde computador.
2. Luego abordar la importación/migración masiva desde la web actual.
