# Reporte Identificación Técnica de LP COMERCIANTE y Endpoints Bsale para Precio/Stock (Fase 6D.9F)

## Objetivo
Identificar técnicamente, en modo lectura, el ID de la lista `LP COMERCIANTE` y los endpoints/campos Bsale necesarios para obtener precio vigente con IVA incluido y stock/disponibilidad confiable del SKU piloto `100909`, sin modificar productos, precios, stock ni frontend.

## Precheck Git
- Rama actual: `main`.
- Commit local actual: `ca04ec6` (`docs: record Bsale price and stock source audit`).
- Working tree: limpio salvo el no rastreado [supabase/.temp](../../supabase/.temp).
- `git rev-list --left-right --count HEAD...origin/main` devolvió `1 0`, indicando que el commit local está adelantado respecto a la referencia remota local, pero el push remoto sigue bloqueado por el error de red/HTTP anterior.

## Regla comercial confirmada
- Lista Bsale oficial para el portal B2B: `LP COMERCIANTE`.
- Precios de `LP COMERCIANTE`: con IVA incluido.
- Moneda objetivo: `CLP`.
- No usar `NAVIDAD PROMO`, `PRECIOS RETAIL`, costo ni historial de ventas.

## Identificación técnica de la lista LP COMERCIANTE
### Endpoint probado
- GET `https://api.bsale.io/v1/price_lists.json?limit=100`
- Sin token expuesto en la documentación; solo se usó el `access_token` del entorno local y no se imprimieron secretos.

### Resultado observado
- La API devolvió varias listas, incluyendo:
  - `LP COMERCIANTE` con `id: 4`
  - `state: 0`
- La lista existe en la API, pero en el estado observado aparece desactivada/inactiva.

### Conclusión técnica
- Se identificó técnicamente el ID de la lista: `4`.
- El nombre exacto encontrado: `LP COMERCIANTE`.
- El estado observado: `0` (no activo en la respuesta consultada).
- Se conserva la regla comercial confirmada por Carlos, pero sigue pendiente confirmar si el ID `4` es el correcto para el flujo operacional del portal o si existe una variación activa en otra instancia/ambiente.

## Precio vigente del SKU 100909
### Variante y SKU
- SKU: `100909`
- `bsale_variant_id`: `1494`
- `bsale_product_id` local: `1072`
- barcode: `8595602540945`

### Endpoint probado para precio
- GET `https://api.bsale.io/v1/price_lists/4/details.json?variantid=1494`

### Resultado observado
- La respuesta devolvió `count: 0` y `items: []` para la variante `1494`.
- No se encontró precio vigente en la lista `LP COMERCIANTE` para esa variante en la respuesta consultada.

### Conclusión técnica
- `price_candidate`: `null`.
- Nivel de confianza: `blocked`.
- Motivo: la lista existe, pero la API no devolvió un precio para la variante piloto en la consulta de lectura realizada.
- Sigue pendiente confirmar si:
  - la variante necesita otro identificador de lista/price list;
  - la respuesta debe consultarse por otro endpoint;
  - la lista está desactivada y no debe usarse para este flujo;
  - el precio está en otra entidad de la API Bsale.

## Stock / disponibilidad del SKU 100909
### Endpoints probados
- `GET /variants/1494/stock.json`
- `GET /variants/1494/stocks.json`
- `GET /variants/1494/stock_details.json`
- `GET /products/1072/variants/1494/stock.json`
- `GET /products/1072/variants/1494/stocks.json`

### Resultado observado
- Todos devolvieron `404 Not Found` o no correspondieron al endpoint real del entorno/instancia probada.

### Conclusión técnica
- `stock_candidate`: `null`.
- `availability_status` recomendado: `consult`.
- Nivel de confianza: `blocked`.
- Motivo: no se encontró un endpoint real/operativo de stock para la variante pilotada en la respuesta de la API consultada.

## Riesgos y hallazgos
- La API Bsale responde y permite identificar listas de precio, pero el detalle para la variante `1494` está vacío.
- La lista `LP COMERCIANTE` existe, pero su estado observado es `0`, lo que introduce riesgo de que se trate de una lista no activa o no apta para este flujo.
- No existe evidencia suficiente en esta sesión para asumir un precio o stock concreto para el piloto.
- No se deben inventar valores ni cargar datos en `web_b2b.product_prices` ni `web_b2b.product_stock` sin una fuente operativa confirmada.

## Siguiente fase recomendada
- 6D.9G: implementar o validar un cliente Bsale específico para listas de precio y stock, con identificación técnica de la lista activa correcta y validación del endpoint de stock para la variante piloto.
- Mientras tanto, la opción segura es mantener el precio/stock como `blocked` y `consult`.

## Validaciones ejecutadas
- Lint: `npm run lint`
- Build: `npm run build`
- Git status: `git status --short`

## Resultado
- Lint: OK.
- Build: OK.
- Git status: sin cambios de código ni mutaciones; solo se mantiene el estado no rastreado de [supabase/.temp](../../supabase/.temp).
