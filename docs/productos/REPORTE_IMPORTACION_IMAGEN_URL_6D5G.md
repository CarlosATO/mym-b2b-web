# Reporte - Importacion de Imagen desde URL a Storage (Fase 6D.5G)

- **Fecha/hora local**: 2026-08-04 12:13 (-0400)
- **Ámbito**: `ProductForm` + Server Action server-side para copiar imagen desde URL a `product-images`
- **Sin cambios de datos**: no productos nuevos, no precios, no stock, no publicación

## Objetivo

Permitir que el admin pegue una URL externa y el sistema copie la imagen a Storage propio, dejando la URL pública de Supabase lista para guardar en el producto.

## Arquitectura usada

- Componente cliente: `src/components/admin/ProductImageUpload.tsx`
- Server Action: `src/app/actions/admin-product-images.ts`
- Helper compartido: `src/lib/utils/product-image-storage.ts`
- Storage: bucket `product-images`

## Flujo

1. El admin pega una URL externa en la imagen principal.
2. Se presiona `Importar imagen`.
3. El Server Action valida sesión, permisos, producto y URL.
4. La imagen se descarga en servidor.
5. Se valida MIME y tamaño.
6. Se sube a `product-images/{company_id}/{product_id}/{uuid}.{ext}`.
7. Se obtiene `publicUrl` de Supabase.
8. El componente actualiza el preview y el campo de imagen.
9. El admin guarda el producto para persistir la imagen primaria.

## Validaciones URL

- Solo `http` / `https`.
- Rechazo de `file:`, `ftp:`, `data:`, `javascript:`.
- Rechazo de `localhost`, `127.0.0.1`, `0.0.0.0`, `::1` y destinos privados/locales razonables.
- Resolución DNS y bloqueo de IP privadas cuando aplica.

## Validaciones de archivo remoto

- MIME permitidos:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
- Tamaño máximo: 5 MB
- Rechazo de respuestas no 2xx, HTML, PDF, SVG, GIF y otros tipos no permitidos.

## Seguridad

- No usa `service_role` en frontend.
- La descarga y validación ocurren en servidor.
- La escritura en Storage depende de policies existentes.
- No es una migración masiva.

## Causa raíz y corrección

- Causa raíz detectada: el flujo de importación estaba mezclado con el submit del formulario principal y la UI podía quedarse en preview sin una copia persistida en Storage/BD.
- Corrección aplicada: el botón `Importar imagen` quedó desacoplado del submit principal y dispara el Server Action de forma imperativa; el preview solo se actualiza cuando el Server Action devuelve un `publicUrl` de Supabase.
- Regla final: no se acepta URL externa como resultado final ni como `primary_image_url`.

## Validación real

- Producto probado realmente: `PELUCHE DE GATO MOUNSTRUOS SURTIDOS` / `83bdcb5d-acc3-48a6-8ba2-1c605b29d542` / SKU `66200`.
- SAFARI no fue el producto finalmente probado en la re-prueba.
- `primary_image_url` final: `https://oekmztbfasmildyuajji.supabase.co/storage/v1/object/public/product-images/d1000000-0000-0000-0000-000000000001/83bdcb5d-acc3-48a6-8ba2-1c605b29d542/0639b8d3-ace0-4ead-b5bc-4211a69c6515.jpg`.
- La URL final pertenece a Supabase Storage `product-images` y no apunta a WordPress ni cPanel.
- El RPC admin confirma persistencia real de la imagen primaria para ese producto.
- En Storage existe el objeto bajo `d1000000-0000-0000-0000-000000000001/83bdcb5d-acc3-48a6-8ba2-1c605b29d542/` con MIME `image/jpeg` y tamaño `26137` bytes.
- Conclusión: la copia a Storage funcionó y la asociación quedó persistida en la base; no hacía falta un guardado adicional para este caso.

## Persistencia esperada

- La importación debería dejar la URL pública lista en el formulario.
- El guardado final sigue ocurriendo con `Guardar cambios`.
- No se publica el producto automáticamente.

## Estado final

- `review_status`: `draft`
- `is_active`: `false`
- `is_visible`: `false`
- `is_featured`: `false`
- `bsale_sync_status`: `pending`
- No exposición pública en `/catalogo`.
- `public_count = 0`.
- `public_slug_count = 0`.
- `product-images` mantiene 2 objetos actuales en total.

## Cierre

- Fase 6D.5G validada con producto real distinto de SAFARI.
- No depende de URL externa como resultado final.
- La persistencia quedó en Storage y en la base.
