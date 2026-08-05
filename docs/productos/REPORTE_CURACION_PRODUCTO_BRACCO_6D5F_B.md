# Reporte - Curación Manual de BRACCO (Fase 6D.5F-B)

- **Fecha/hora local**: 2026-08-04 12:13 (-0400)
- **Ámbito**: curación manual en admin de un producto Bsale ya importado
- **Sin cambios de datos por esta documentación**: no SQL, no productos nuevos, no precios, no stock, no publicación

## Objetivo

Registrar la curación manual de BRACCO y dejar constancia de su estado operativo sin publicarlo.

## Producto validado

- `BRACCO TRAVEL TRANSPORTADORA Nº3`
- `product_id`: `a38ed49d-cb1a-4b36-8254-132050ba069e`
- `SKU`: `10.123`

## Estado final curado

- Categoría final: `Transportadoras`
- Ruta jerárquica: `Accesorios > Transportadoras`
- Marca: `BRACCO`
- Descripción corta: presente y completada
- Descripción larga: presente y completada
- Imagen principal: presente

## Estado final del producto

- `review_status = draft`
- `is_active = false`
- `is_visible = false`
- `is_featured = false`
- `bsale_sync_status = pending`

## Validación pública

- No aparece en `/catalogo`.
- `public_count = 0`.
- `public_slug_count = 0`.

## Precios y stock

- `product_prices = 0`
- `product_stock = 0`

## Pendiente

- Importación de imagen desde URL a Storage.
- Curación ampliada por lotes desde Bsale.
- Publicación controlada posterior cuando la ficha esté completa.
- Puerto local ya quedó en `3000`.
- La importación desde URL quedó implementada para otros productos; BRACCO no se usará como prueba.
