# Reporte - Upload Individual de Imagen de Producto (Fase 6D.5E-B)

- **Fecha/hora local**: 2026-08-04 12:13 (-0400)
- **Ámbito**: `ProductForm` + componente cliente de upload + prueba real validada por Carlos
- **Sin cambios de datos**: no productos, no precios, no stock, no imágenes reales

## Objetivo

Permitir subir una imagen individual desde el computador del usuario, guardarla en Supabase Storage y actualizar `primary_image_url` en el formulario del producto.

## Arquitectura usada

- `ProductForm` sigue siendo el formulario principal de edición.
- Se agregó un componente cliente dedicado: `src/components/admin/ProductImageUpload.tsx`.
- El componente usa `src/lib/supabase/client.ts` para autenticar con la sesión normal del admin.
- No se usa `service_role` en frontend.

## Ruta de Storage

- Bucket: `product-images`
- Ruta: `company_id/product_id/uuid.ext`
- Nombre final:
  - `image/jpeg` -> `.jpg`
  - `image/png` -> `.png`
  - `image/webp` -> `.webp`

## Validaciones

- MIME permitidos:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
- Tamaño máximo: 5 MB
- Rechazo explícito de formatos como SVG, GIF, PDF o archivos sin MIME válido

## Prueba real validada

- Producto: `a38ed49d-cb1a-4b36-8254-132050ba069e`
- Nombre: `BRACCO TRAVEL TRANSPORTADORA Nº3`
- SKU: `10.123`
- Carlos subió una imagen local y confirmó la miniatura en `/admin/productos`.
- El producto siguió en borrador, inactivo y no visible.

## Flujo de usuario

1. El usuario abre `/admin/productos/[id]/editar`.
2. Ve preview actual, URL editable y botón `Subir desde mi computador`.
3. Selecciona una imagen local.
4. El archivo se sube a `product-images`.
5. La URL pública resultante se copia al campo `primary_image_url`.
6. El usuario sigue con `Guardar cambios` para persistir el producto.

## Manejo de errores

- Archivo demasiado grande.
- MIME no permitido.
- Falta de contexto `company_id` o `product_id`.
- Error de Storage o de URL pública.
- Error claro visible en la UI.

## Seguridad

- No se publica el producto automáticamente.
- La lectura del bucket sigue siendo pública por decisión de negocio.
- La escritura/reemplazo/borrado dependen de policies de Storage.
- La acción de guardar sigue pasando por la validación de publicación segura 6D.5C.

## Verificación post-upload

- `primary_image_url` quedó informado y apunta al bucket `product-images`.
- Objeto Storage validado:
  - ruta: `d1000000-0000-0000-0000-000000000001/a38ed49d-cb1a-4b36-8254-132050ba069e/9c78856f-6ecb-42c2-9a6b-5814e4337c2f.png`
  - MIME: `image/png`
  - tamaño: `128858` bytes
- Storage bucket:
  - objetos: `1`
- Relación de catálogo:
  - `product_images_count = 4`
- Estado del producto:
  - `review_status = draft`
  - `is_active = false`
  - `is_visible = false`
  - `is_featured = false`
  - `bsale_sync_status = pending`
  - `category_id = null`
  - `brand_id = null`
- Catálogo público:
  - el producto no aparece en `/catalogo`
  - `public_count = 0`
  - `public_slug_count = 0`

## Conteos del listado admin

- `Sin imagen = 20`
- `Pendientes de normalización = 21`
- `Nuevos Bsale = 20`

## No realizado

- No se subieron imágenes adicionales.
- No hubo publicación pública.
- No hubo cambios de precios o stock.
- No hubo intervención de Bsale.
- No hubo WordPress/WooCommerce/cPanel.

## Pendiente

- Importación desde URL hacia Storage.
- Migración masiva desde la web actual / WordPress / cPanel.
- Uso formal de `product_images` si más adelante se decide persistir esa relación.

## Prueba sugerida para Carlos

- Producto: `a38ed49d-cb1a-4b36-8254-132050ba069e`
- Nombre: `BRACCO TRAVEL TRANSPORTADORA Nº3`
- Pasos:
  1. Abrir edición del producto.
  2. Subir una imagen local.
  3. Confirmar preview.
  4. Guardar como borrador.
  5. Verificar que `primary_image_url` cambió.
  6. Confirmar que el producto sigue draft/inactivo/no visible.
