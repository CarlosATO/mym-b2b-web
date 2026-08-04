# Reporte — Normalización Comercial de Productos Bsale (Fase 6D.5A)

- **Fecha/hora local**: 2026-08-04 09:55 (-04)
- **Base**: apply_run `9a209048-b2fe-4ee4-af42-b5bf3901442c`
- **Ámbito**: UI admin / solo lectura; sin Bsale, sin apply, sin precios/stock/imágenes

## Objetivo

Marcar claramente los productos Bsale importados que requieren curación comercial antes de publicar.

## Decisión

- No se creó un módulo nuevo.
- La normalización vive en el listado actual `/admin/productos`.
- Los nuevos productos Bsale quedan identificados como `Pendiente de normalización`.

## Regla derivada

`Pendiente de normalización = review_status='draft' AND is_active=false AND is_visible=false AND (category_id IS NULL OR brand_id IS NULL OR primary_image_url IS NULL OR falta descripción/SEO)`

Además:

- `Nuevo Bsale` cuando existe `bsale_variant_id`, `bsale_sync_status='pending'`, y sigue en draft/inactivo/no visible.

## UI agregada

- Badge `Pendiente de normalización`
- Badge `Nuevo Bsale`
- Resumen superior compacto con KPIs pequeños para priorizar la tabla
- Filtros:
  - Pendientes de normalización
  - Sin categoría
  - Sin marca
  - Sin imagen
  - Nuevos Bsale pendientes
  - Búsqueda / estado / categoría / marca existentes
- Resumen superior:
  - Total productos
  - Pendientes de normalización
  - Sin categoría
  - Sin marca
  - Sin imagen
  - Visibles / públicos
- Orden sugerido: pendientes de normalización primero; luego recién importados primero por `created_at`.

## Ajuste de 6D.5A.1

- Se compactó el resumen superior para liberar espacio vertical de la tabla.
- Se separó explícitamente `Pendientes de normalización` de `Nuevos Bsale pendientes` para evitar confundir los 20 Bsale con el caso especial `TEST-UI-001`.

## Ajuste de 6D.5A.2

- Se eliminó el botón `Filtrar`.
- Los filtros ahora se aplican automáticamente al cambiar selección o escribir en búsqueda.
- Se corrigió el error de `getAdminProducts`: el listado estaba recibiendo filtros vacíos como `''` hacia la RPC y eso terminaba en rechazo de tipos/validación en Supabase; ahora esos valores se normalizan a `NULL` antes de llamar `web_b2b_admin_list_products` y se registran campos útiles en el log de error.

## Estado comercial

- Los 20 productos importados siguen en estado seguro (draft, inactivos, no visibles).
- 20/20 sin categoría, sin marca, sin imagen, sin descripción/SEO.
- 0 listos para publicar.
- 20 requieren curación manual.

## Revisión DEMO/TEST

- DEMO-001 / DEMO-002 / DEMO-003 siguen como catálogo demo visible actual.
- TEST-UI-001 sigue oculto.
- No se modificaron.

## Limitaciones detectadas

- `primary_image_url` sí está disponible en el listado admin, así que el filtro `Sin imagen` puede resolverse sin migración nueva.
- `created_at` también está disponible, así que el orden de recién importados primero es viable.
- La verificación visual interactiva del panel admin requiere sesión autenticada; la ruta responde con `307` hacia `/login` cuando no hay sesión.

## Próximos pasos

1. Curar categorías y marcas de la muestra.
2. Revisar nombre comercial donde haga falta.
3. Separar imágenes en fase posterior.
4. Más adelante, implementar sync automático + botón manual "Sincronizar desde Bsale" con la misma lógica segura, dejando los productos en este mismo estado de normalización.
