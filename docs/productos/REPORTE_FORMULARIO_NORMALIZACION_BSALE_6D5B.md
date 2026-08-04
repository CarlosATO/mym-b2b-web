# Reporte — Formulario de Normalización Comercial Bsale (Fase 6D.5B)

- **Fecha/hora local**: 2026-08-04 10:45 (-04)
- **Ámbito**: UI admin de edición de productos
- **Sin cambios de datos**: no Bsale, no apply, no precios/stock, no publicación automática

## Objetivo

Permitir normalizar productos importados desde Bsale antes de publicarlos.

## Auditoría del formulario actual

Campos ya soportados por el flujo existente de edición:

- `sku`
- `name`
- `slug`
- `short_description`
- `description`
- `category_id`
- `brand_id`
- `primary_image_url`
- `seo_title`
- `seo_description`
- `review_status`
- `is_active`
- `is_visible`
- `is_featured`
- `order_index`
- `bsale_variant_id`
- `bsale_sync_status`
- `bsale_sync_enabled`

## Campos editables

- Nombre comercial
- Slug
- Categoría / Familia web
- Marca web
- Descripción corta
- Descripción larga
- Imagen principal individual por URL
- SEO title
- SEO description
- Estado del contenido
- Activo / Visible / Destacado
- Orden

## Campos read-only

- SKU
- Bsale Variant ID
- Estado sync Bsale
- Sincronización Bsale

## Imagen principal

- Sí existe soporte real para `primary_image_url`.
- Se muestra preview individual.
- Se puede reemplazar la URL de una sola imagen por producto.
- La importación masiva de imágenes desde la web actual / WordPress / cPanel queda para fase posterior separada.

## Checklist de normalización

Se agregó un checklist visible con estados `Completo` / `Pendiente` para:

- Categoría / Familia
- Marca web
- Imagen principal
- Descripción corta
- Descripción larga
- SEO
- Producto visible / publicado

## Nuevo Bsale

Cuando el producto cumple:

- `bsale_variant_id` existe
- `bsale_sync_status='pending'`
- `review_status='draft'`
- `is_active=false`
- `is_visible=false`

se muestra el aviso:

`Producto recién importado desde Bsale. Debe normalizarse antes de publicarlo.`

## Mejoras del layout

- Se separó claramente la identidad Bsale de la normalización comercial.
- Se agruparon los campos en secciones:
  - Identidad Bsale
  - Normalización comercial
  - Imagen principal
  - SEO
  - Checklist de normalización
  - Estado y publicación
- Se añadió advertencia de publicación: publicar solo cuando categoría, marca, imagen y contenido estén revisados.

## Riesgo / advertencia

- El formulario existente todavía permite cambiar estado de publicación (`review_status`, `is_active`, `is_visible`, `is_featured`) porque ya estaba soportado por el flujo actual.
- No se tocó el backend ni se agregó publicación automática.
- Se recomienda publicar solo con revisión humana.

## Validaciones

- `/admin/productos` sigue funcionando con los KPIs compactos y filtros automáticos.
- `/admin/productos/[id]/editar` responde `307` hacia `/login` sin sesión y muestra la nueva estructura de normalización con sesión admin.
- `primary_image_url` quedó confirmado como soporte existente y utilizable en edición individual.
- No se tocaron productos, precios, stock ni imágenes masivas.

## Corrección de layout 6D.5B

- Se reordenó el formulario en dos columnas claras: columna principal izquierda (Identidad Bsale, Normalización comercial, Imagen principal, SEO) y panel lateral derecho (Checklist de normalización, Estado y publicación).
- La alerta superior quedó compacta, con wrapping correcto y ancho controlado para evitar cortes horizontales.
- El footer de acciones quedó alineado al final y más cerca del contenido.
- La columna lateral se comporta como panel de control y queda mejor alineada con el flujo de trabajo de curación.

## Limitaciones

- La checklist refleja el estado actual del formulario; para campos no controlados por la UI no hay reactividad parcial en tiempo real.
- La carga masiva de imágenes desde la web actual sigue fuera de esta fase.
- La publicación segura incompleta se tratará en la fase 6D.5C.

## Próximos pasos

1. Curar la primera muestra Bsale con este formulario.
2. Reforzar publicación humana, no automática.
3. Dejar la importación masiva de imágenes para fase posterior.

## Ajuste 6D.5C

- Se agregó la validación de publicación segura para bloquear `active/visible/published/featured` si faltan categoría, marca, imagen principal, nombre, slug o descripción.
- El formulario ahora muestra un panel que diferencia borrador permitido de publicación bloqueada.
