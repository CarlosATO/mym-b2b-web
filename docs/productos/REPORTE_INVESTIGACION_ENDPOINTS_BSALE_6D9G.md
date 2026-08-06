# Reporte Investigación de Endpoints Bsale para Precio y Stock (Fase 6D.9G)

## Objetivo
Investigar, en modo lectura y sin modificar datos, qué endpoints reales usa la integración Bsale del repositorio para obtener precio y stock, y si esos endpoints admiten el identificador del SKU piloto `100909` (`bsale_variant_id=1494`).

## Alcance y reglas
- Solo lectura.
- Sin modificar WordPress, WooCommerce, Bsale, Supabase, frontend ni productos.
- Sin insertar/editar precios, stock ni productos.
- Sin commit ni push.

## Revisión del código existente
### Integración Bsale actual del repositorio
- El cliente base en [src/lib/bsale/client.ts](../../src/lib/bsale/client.ts) está preparado para llamar a la API desde el servidor, pero las funciones de precio y stock están todavía como placeholders.
- El flujo read-only para importar productos en [src/lib/bsale-product-import/bsale-readonly.ts](../../src/lib/bsale-product-import/bsale-readonly.ts) usa `GET /variants.json?limit={n}&offset={m}&expand=product`.
- Ese flujo permite obtener la variante Bsale y su SKU, pero no consulta precio ni stock vigente.

### Conclusión del código
- No existe una implementación funcional de precio/stock en el repositorio actual.
- La integración actual está orientada a catálogo/variante, no a precio/stock operativo.
- El identificador que sí se usa en el flujo actual es `bsale_variant_id` (por ejemplo `1494` para SKU `100909`).

## Endpoint correcto de precio detectado
### Ruta identificada
- La ruta de listas de precio observable desde la API es:
  - `GET /price_lists.json`
  - `GET /price_lists/{price_list_id}/details.json`

### Lista oficial confirmada
- La lista `LP COMERCIANTE` está disponible con ID `4`.

### Estructura observada
- Los items del detalle de lista devuelven campos como:
  - `id`
  - `variantValue`
  - `variantValueWithTaxes`
  - `variant.id`

### Comportamiento observado para la variante piloto
- Se recorrieron los detalles completos de la lista `4` y se buscó explícitamente la variante `1494`.
- Resultado: no apareció ninguna entrada para `variant.id = 1494` en la lista `LP COMERCIANTE` en la respuesta consultada.

### Conclusión de precio
- El endpoint correcto para inspeccionar precios de `LP COMERCIANTE` es la ruta de detalle de lista de precios:
  - `GET /price_lists/4/details.json`
- Para este SKU piloto, la variante `1494` no aparece en la lista `LP COMERCIANTE` en la respuesta actual; por lo tanto, no hay precio vigente documentado para ese SKU en esa lista en esta auditoría.
- El identificador que debería usarse para el cruce es el `variant.id` de Bsale, no el `product_id` local `1072` ni el SKU `100909` directamente en la consulta de detalle de lista.

## Endpoint correcto de stock detectado
### Ruta identificada
- La ruta real de stock observada es:
  - `GET /stocks.json?variantid={variantId}`

### Estructura observada
- Los items de stock devuelven campos como:
  - `quantity`
  - `quantityReserved`
  - `quantityAvailable`
  - `variant.id`
  - `office.id` / `office.name`

### Comportamiento observado para la variante piloto
- Se consultó:
  - `GET /stocks.json?variantid=1494`
- Resultado: `count: 0` y `items: []`.

### Conclusión de stock
- El endpoint correcto para stock es `/stocks.json` con filtro por `variantid`.
- El stock está modelado por `office`/bodega/sucursal; no es un único valor global.
- Para la variante `1494` no se obtuvo ninguna fila de stock en la respuesta consultada.
- No se puede asumir stock real ni disponibilidad global a partir de esta respuesta; el estado correcto es `sin dato / sin registro` en la auditoría actual.

## Validación adicional con producto control positivo
### Producto control probado
- Código Bsale: `557325`
- Variant id: `6216`
- Producto: `BELCANDO ADULT DINNER`

### Resultado observado
- Precio:
  - `GET /price_lists/4/details.json?variantid=6216` devolvió `count: 1` y un item con `variantValueWithTaxes: 53900.0`.
- Stock:
  - `GET /stocks.json?variantid=6216` devolvió `count: 1` y un item con `quantityAvailable: 1.0`.

### Interpretación
- El patrón de filtro por `variantid` sí funciona para precio y stock en Bsale.
- La ausencia de resultados para la variante `1494` del SKU piloto `100909` no se debe a un error del endpoint/filtro, sino a que en la auditoría actual esa variante no tiene un precio/stock disponible en la lista `LP COMERCIANTE` ni un registro de stock en la ruta consultada.

## Identificador correcto a usar
### Para la integración futura
- Precio:
  - usar `bsale_variant_id` (por ejemplo `1494`) y cruzarlo contra los items de `price_lists/{id}/details.json`.
- Stock:
  - usar `bsale_variant_id` (por ejemplo `1494`) en `GET /stocks.json?variantid=1494`.

### No usar como identificador principal para esta fase
- El `product_id` local `1072` no fue suficiente para obtener una fila de precio/stock en las pruebas realizadas.
- El SKU `100909` tampoco devolvió una fila de stock por el endpoint probado; para precio, el cruce debe hacerse por `variant.id` y no por el código de SKU en la ruta concreta de lista de precios.

## Hallazgo final
- El endpoint de precio que sí existe es el detalle de la lista de precios Bsale: `/price_lists/{price_list_id}/details.json`.
- El endpoint de stock que sí existe es `/stocks.json` filtrado por `variantid`.
- Para el SKU piloto `100909` (`bsale_variant_id=1494`) no se encontraron ni precio ni stock en la respuesta consultada.
- La conclusión técnica segura es:
  - `price_candidate = null` en la auditoría actual.
  - `stock_candidate = null` en la auditoría actual.
  - `availability_status = consult`.
- La fase 6D.9I implementó una capa read-only server-side para volver a consultar esos endpoints de manera controlada, sin escribir datos ni modificar el frontend.

## Resultado de la auditoría
- Se confirmó el patrón técnico real de lectura a Bsale sin modificar datos.
- No se encontraron evidencias suficientes para cargar precio ni stock del piloto desde la ruta consultada.
- El siguiente paso válido es implementar un cliente Bsale específico para estas dos rutas, manteniendo el uso de `bsale_variant_id` como llave operativa y agregando una regla para consolidar stock por office/sucursal.
