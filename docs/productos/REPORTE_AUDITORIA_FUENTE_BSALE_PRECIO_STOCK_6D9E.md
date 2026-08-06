# Reporte Auditoría Fuente Oficial Bsale para Precios y Stock (Fase 6D.9E)

## Objetivo
Auditar la fuente oficial Bsale para precio vigente y stock disponible del SKU piloto 100909, considerando explícitamente la lista oficial LP COMERCIANTE y la integración WooCommerce actual como referencia read-only, identificar endpoint/campos/tabla espejo/sync requerido y proponer una ruta segura de sincronización hacia web_b2b.product_prices y web_b2b.product_stock, sin insertar datos ni modificar productos, frontend o Storage.

## Precheck
- Rama actual: main.
- Commit base conocido en historial: ba7a6c8 (`docs: record pilot price and stock preflight`).
- Working tree: limpio salvo [supabase/.temp](../../supabase/.temp) como elemento no rastreado.
- No se creó commit ni se hizo push en esta fase.
- No se ejecutó SQL de modificación ni operaciones de apply.

## Mapeo SKU piloto 100909 confirmado
- product_id: 160c93e0-a76a-43d1-bd6d-014ff2465ebd
- company_id: d1000000-0000-0000-0000-000000000001
- bsale_variant_id: 1494
- Bsale product ID local: 1072
- Variante local: integraciones.bsale_variants.bsale_id=1494, code=100909, description=2KG, bar_code=8595602540945
- Producto sigue publicado/activo/visible, sin destacar.

## Auditoría de código existente
### Cliente Bsale actual
- El cliente central en [src/lib/bsale/client.ts](../../src/lib/bsale/client.ts) exige la variable de entorno `BSALE_ACCESS_TOKEN` y está preparado para mandar requests al endpoint base de Bsale desde el servidor.
- Sin embargo, las funciones de precio y stock están implementadas como placeholders (`fetchBsaleStock`, `fetchBsalePrices`) y devuelven valores vacíos o cero.
- No existe un flujo real de sincronización de precios o stock desde esta capa en el estado actual del repositorio.
- La nueva referencia entregada por Carlos fija la fuente oficial para el portal B2B en la lista Bsale `LP COMERCIANTE`; las listas `NAVIDAD PROMO` y `PRECIOS RETAIL` quedan descartadas para esta fase.

### Lectura Bsale para importación de productos
- [src/lib/bsale-product-import/bsale-readonly.ts](../../src/lib/bsale-product-import/bsale-readonly.ts) usa una llamada de solo lectura a `/variants.json` con `limit/offset` y `expand=product` para auditoría/importación de productos.
- Ese flujo está orientado a metadata de variante y catálogo, no a precio vigente ni stock disponible.
- Los scripts en [scripts/bsale-product-import](../../scripts/bsale-product-import) no escriben ni proyectan precios/stock a web_b2b.

### Tipos y contrato actual
- [src/lib/bsale/types.ts](../../src/lib/bsale/types.ts) define `BsalePrice` y `BsaleStock` solo como interfaces placeholder sin contrato real con endpoint, moneda, lista de precio o warehouse mapping.

## Auditoría de schema y RPC
### Tablas de destino en web_b2b
- [supabase/migrations/202607_web_b2b_initial_schema.sql](../../supabase/migrations/202607_web_b2b_initial_schema.sql) define las tablas `web_b2b.product_prices` y `web_b2b.product_stock` con estructura para precio, moneda, estado, source y updated_at.
- En el estado actual del proyecto estas tablas no tienen datos de precio/stock cargados para el piloto; el preflight de la fase anterior registró `product_prices=0` y `product_stock=0`.

### RPC privada actual
- [supabase/migrations/20260805140000_web_b2b_customer_product_commercial_state.sql](../../supabase/migrations/20260805140000_web_b2b_customer_product_commercial_state.sql) consume `web_b2b.product_prices` y `web_b2b.product_stock` para devolver precio y disponibilidad resumida a clientes aprobados.
- En el estado actual, si esas tablas están vacías, la RPC no inventa precio ni stock; devuelve condiciones de bloqueo/consulta (por ejemplo `login_required`, `missing_price`, `missing_stock` o `consult`).

## Hallazgos de precio vigente
- Fuente local oficial confiable: no encontrada en el código ni en el schema existente para este piloto.
- La referencia comercial nueva entregada por Carlos define a `LP COMERCIANTE` como la lista oficial para el portal B2B; `NAVIDAD PROMO` y `PRECIOS RETAIL` quedan descartadas.
- No existe actualmente una fuente local confiable ni un flujo real de sincronización de precios/stock desde Bsale hacia `web_b2b.product_prices` y `web_b2b.product_stock`.
- No se usó costo como precio. El costo de `integraciones.bsale_variant_costs` no es una fuente válida de precio de venta.
- No se usaron documentos/ventas históricas como precio vigente.
- Carlos confirmó que la lista Bsale `LP COMERCIANTE` maneja precios con IVA incluido. Para el portal B2B, el precio visible al cliente aprobado debe ser el precio de `LP COMERCIANTE` con IVA incluido.
- Sigue pendiente confirmar técnicamente, por lectura de API o fuente documental del ERP, el ID exacto de la lista `LP COMERCIANTE` y el campo desde donde se obtendrá el precio.
- `price_candidate`: null.
- Nivel de confianza: blocked.
- Regla neto/bruto/IVA: no se pudo confirmar con fuente oficial disponible; no debe inferirse ni inventarse.

## Hallazgos de stock disponible
- La fuente local auditada del preflight anterior, `integraciones.bsale_stock_current`, no tenía filas para `variant_id=1494` / SKU 100909.
- La referencia de la web actual WordPress/WooCommerce indica que la integración existente sincroniza stock desde Bsale, con configuración de `Sincronizar stock: Sí`, `Limitar stock traído desde Bsale: 0` y `Crear productos automáticamente: Sí`.
- En el estado del repositorio nuevo no se encontró un sync controlado propio que proyecte stock a `web_b2b.product_stock`; por tanto, el comportamiento actual de stock en la web B2B sigue siendo un bloqueo para un piloto confiable.
- `stock_candidate`: null.
- Estado de disponibilidad recomendado: `consult`.
- Nivel de confianza: blocked.

## Llamadas Bsale
- No se llamó Bsale en esta fase.
- No se imprimieron tokens, headers ni secretos.
- Dado el estado actual del repositorio, se evitó cualquier llamada a ciegas a Bsale para precio/stock.

## Arquitectura recomendada
### Recomendación actualizada
Se propone una arquitectura en dos capas, con una fase previa de sync controlado desde Bsale hacia estructuras de integración y luego una proyección hacia web_b2b:

- Precio: `Bsale LP COMERCIANTE` → sync controlado → `web_b2b.product_prices` → RPC privada cliente aprobado → UI cliente aprobado.
- Stock: `Bsale stock por variante/sucursal` → sync controlado → `web_b2b.product_stock` → RPC privada como disponibilidad resumida → UI cliente aprobado.

### Por qué
- Mejora seguridad y trazabilidad.
- Permite validar endpoint, moneda, lista de precio, warehouse mapping y frescura de datos.
- Reduce riesgo de publicar precios/stock incorrectos en el catálogo B2B.
- Facilita rollback y consistencia con el modelo actual de web_b2b.
- Mantiene la regla comercial: público nunca recibe precio/stock; cliente no aprobado nunca recibe precio/stock; cliente aprobado recibe precio y disponibilidad resumida sin quantity exacta por defecto.

## Decisión de negocio
- No cargar precio piloto aún.
- No cargar stock piloto aún.
- No mostrar precio/stock exacto al cliente público ni a clientes no aprobados.
- Mantener disponibilidad `consult` hasta contar con una fuente oficial y validada.

## Siguiente fase recomendada
- 6D.9F: implementar o auditar el sync oficial de precios y stock Bsale hacia integraciones o web_b2b, validar endpoint/campos/lista de precio `LP COMERCIANTE`, warehouse mapping y reglas de IVA, y luego abrir una carga piloto controlada con aprobación explícita.

## Validaciones ejecutadas
- Lint: `npm run lint`
- Build: `npm run build`
- Estado Git: `git status --short`

## Resultado de validaciones
- Lint: OK.
- Build: OK en el entorno local disponible.
- Git status: solo se detecta el estado no rastreado de [supabase/.temp](../../supabase/.temp) y los cambios de documentación del presente reporte.

## Conclusión
La fuente oficial Bsale no está aún integrada de forma confiable para precio vigente y stock disponible en el estado actual del repositorio. La ruta segura es no cargar piloto, no inventar datos y avanzar con una fase de sincronización/validación oficial antes de exponer precio o stock en la web B2B.
