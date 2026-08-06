# Reporte Cliente Bsale Read-Only para Precio/Stock (Fase 6D.9I)

## Objetivo
Implementar, en modo lectura y sin modificar datos, una capa server-side en el repositorio para consultar:
- precio B2B desde la lista `LP COMERCIANTE` por `bsale_variant_id`;
- stock disponible desde Bsale por `bsale_variant_id`;
- sin insertar datos en Supabase, sin publicar productos y sin modificar frontend.

## Alcance y reglas
- Solo lectura.
- No insertar precios, stock, productos ni imágenes.
- No ejecutar SQL ni llamadas RPC apply.
- No modificar WordPress, WooCommerce, cPanel, Storage ni frontend.
- No imprimir secrets, tokens ni headers sensibles.
- No hacer push ni commit sin autorización explícita posterior.

## Implementación realizada
### Capa server-side
Se añadieron funciones read-only en [src/lib/bsale/client.ts](../../src/lib/bsale/client.ts):
- `getB2BPriceFromCommercialPriceListByVariantId(variantId)`
- `getB2BStockByVariantId(variantId)`

### Tipos auxiliares
Se extendieron los tipos de Bsale en [src/lib/bsale/types.ts](../../src/lib/bsale/types.ts) para modelar:
- detalle de lista de precios;
- stock por variante;
- resultado seguro para precio y stock.

### Script de auditoría dry-run
Se creó [scripts/audit-bsale-commercial-state.mjs](../../scripts/audit-bsale-commercial-state.mjs) para ejecutar una auditoría read-only con variantes de ejemplo:
- `6216` (control positivo)
- `1494` (SKU piloto anterior)

## Comportamiento implementado
### Precio
- Se consulta `GET /price_lists/4/details.json?variantid={variantId}`.
- Se usa la lista oficial `LP COMERCIANTE` con `price_list_id = 4`.
- Se devuelve `variantValueWithTaxes` como precio B2B con IVA incluido.
- Si no existe entrada, se devuelve `status: 'not_found'`.

### Stock
- Se consulta `GET /stocks.json?variantid={variantId}`.
- Se consolida `quantityAvailable` por sucursal cuando existen múltiples filas.
- Se devuelve un estado de disponibilidad resumido:
  - `available`
  - `out_of_stock`
  - `consult`
- No se expone `quantity` exacta a la UI pública.

## Validación ejecutada
### Control positivo 6216
Resultado observado:
- `priceFound: true`
- `priceWithTaxes: 53900`
- `stockFound: true`
- `availabilityStatus: available`

### SKU piloto 1494
Resultado observado:
- `priceFound: false`
- `priceStatus: not_found`
- `stockFound: false`
- `availabilityStatus: consult`

## Conclusión
La implementación server-side queda preparada para consultas Bsale read-only sobre precio y stock por variante, sin escribir datos en Supabase ni modificar el frontend. La diferencia entre el control positivo y el SKU piloto sigue siendo de datos/lista/stock, no de un problema del endpoint o del filtro.

## Siguiente fase recomendada
- 6D.9J: diseño de proyección controlada de Bsale hacia `web_b2b.product_prices` y `web_b2b.product_stock`.
