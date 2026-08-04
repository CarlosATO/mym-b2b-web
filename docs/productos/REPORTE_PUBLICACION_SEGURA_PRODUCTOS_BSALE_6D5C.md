# Reporte — Publicación Segura de Productos Bsale (Fase 6D.5C)

- **Fecha/hora local**: 2026-08-04 11:05 (-04)
- **Ámbito**: formulario de edición / guardado de producto
- **Sin cambios de datos**: no Bsale, no apply, no precios/stock, no publicación automática

## Objetivo

Evitar que un producto incompleto importado desde Bsale quede activo, visible o publicado por error.

## Regla de publicación segura

Se bloquea el guardado cuando el usuario intenta publicar/visibilizar un producto incompleto:

- `is_visible=true`
- `is_active=true`
- `review_status='published'`
- `is_featured=true`

Para esos casos, el producto debe cumplir al menos:

- categoría / familia web
- marca web
- imagen principal
- nombre comercial
- slug
- descripción corta o descripción larga

## Campos obligatorios para publicar

- `category_id`
- `brand_id`
- `primary_image_url`
- `name`
- `slug`
- `short_description` o `description`

## Campos que no bloquean todavía

- `seo_title`
- `seo_description`
- precio
- stock

## Dónde se implementó

- Helper compartido: `src/lib/utils/product-publication.ts`
- Server Action: `src/app/actions/admin-products.ts`
- UI del formulario: `src/components/admin/ProductForm.tsx`

## Comportamiento al guardar borrador

- Si el producto se guarda como borrador incompleto (`draft`, `is_active=false`, `is_visible=false`, `is_featured=false`), el guardado se permite.
- Esto deja al admin normalizar antes de publicar.

## Comportamiento al intentar publicar incompleto

- No se guarda el cambio inseguro.
- El Server Action devuelve un error claro:
  `No se puede publicar este producto. Falta: ...`
- El formulario muestra un panel explicando los campos faltantes.

## Validación visual

- El formulario muestra un bloque de estado y publicación con aviso de listo / pendiente.
- Si se intenta publicar sin cumplir requisitos, la UI deja claro el bloqueo antes de persistir.

## Limitaciones

- El bloqueo se centra en normalización comercial; precios y stock siguen fuera de esta fase.
- La importación masiva de imágenes sigue pendiente para fase posterior.

## Próximos pasos

1. Curar la muestra con este bloqueo activo.
2. Mantener publicación manual y segura.
3. Tratar precios/stock e imágenes masivas en fases posteriores.
