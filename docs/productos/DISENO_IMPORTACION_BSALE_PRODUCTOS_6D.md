# Diseño de Importación Bsale - Productos B2B (Fase 6D)

Este documento define la arquitectura técnica, modelo de datos y reglas de negocio para la sincronización inicial y continua del catálogo de productos desde Bsale hacia el esquema `web_b2b`.

## 1. Fuente Oficial

Bsale es la única fuente oficial y operacional para la información "dura" del inventario. Desde Bsale se controlará la creación primaria de variantes, estado comercial, identificadores y métricas operacionales.

Los datos estrictamente dominados por Bsale son:
- **SKU** (Código único de producto/variante)
- **bsale_variant_id** (Identificador único interno en Bsale)
- **Nombre base** (Nombre operacional o ticket del producto)
- **Estado operacional** (Activo/Inactivo a nivel inventario)
- **Precio futuro** (Listas de precios, ofertas temporales, tarifas B2B)
- **Stock futuro/referencial** (Cantidades en bodegas, disponibilidad física)

## 2. Modelo `web_b2b`

La web B2B actúa como la capa de presentación comercial. Su objetivo principal es embellecer, agrupar y categorizar los datos fríos de Bsale para ventas B2B atractivas.

### Campos provenientes e impulsados por Bsale:
Estos campos se pueblan inicialmente desde Bsale y las actualizaciones de Bsale pueden sobrescribir o alertar sobre cambios operacionales:
- `sku`
- `bsale_variant_id`
- `name` (Solo como valor inicial, si el usuario no ha puesto un nombre comercial)
- `bsale_sync_enabled` (Estado técnico del vínculo)
- `bsale_sync_status` (Estado del último intento de cruce)

### Campos administrados exclusivamente por la Web B2B:
El admin de la web es el dueño absoluto de estos campos. La importación de Bsale NUNCA debe sobrescribir estos valores si ya fueron definidos.
- `slug`
- `short_description`
- `description`
- `category_id`
- `brand_id`
- `is_active` (Decisión de venderlo en B2B)
- `is_visible` (Decisión de listarlo públicamente)
- `is_featured` (Prioridad visual)
- `review_status` (Flujo de aprobación de contenido: draft/ready/published)
- `order_index`
- `seo_title`
- `seo_description`
- `product_images` (Asociación con imágenes web)

## 3. Reglas de Upsert (Cruce de Catálogo)

La lógica de ingesta debe ser segura, determinística y respetar el trabajo del equipo de marketing (presentación web).

1. **Match Principal (`bsale_variant_id`)**: Si el ID de la variante Bsale ya existe en `web_b2b.products`, actualizar sus datos operacionales manteniendo intacta la presentación comercial.
2. **Match Secundario (`sku`)**: Si el `bsale_variant_id` no coincide o viene nulo, pero el SKU existe en la web, vincularlos (asignar el `bsale_variant_id` al registro web).
3. **Manejo de Conflictos**: Si existe un SKU en web, y un `bsale_variant_id` en web, pero *pertenecen a productos distintos*, rechazar la actualización para esa variante y registrar un conflicto en la auditoría (requiere resolución humana).
4. **Protección de Trabajo Web**: Nunca sobrescribir `description`, `seo_title`, o relaciones de imágenes durante una sincronización rutinaria.
5. **Nuevos Productos**: Un producto nuevo que baja de Bsale por primera vez debe insertarse con `review_status = 'draft'` e `is_active = false`. No se publican automáticamente sin la categorización e imágenes correspondientes.

## 4. Diseño del Stock Referencial

La plataforma B2B NO debe exponer cantidades exactas de inventario al cliente final ni en el frontend para evitar problemas de concurrencia y especulación de competencia.

El stock exacto traído desde Bsale se traducirá (en una fase futura) en estados referenciales semánticos:
- **Disponible** (Ej: Stock > 10)
- **Pocas unidades** (Ej: 0 < Stock <= 10)
- **Sin stock** (Ej: Stock = 0, sin opciones de backorder)
- **Consultar** (Casos especiales, productos a pedido o dropshipping)

## 5. Diseño de Precios

Los precios NO forman parte de esta fase inicial (6D). La estrategia a futuro dictará que:
- La web B2B NO expondrá precios públicos a usuarios anónimos o no validados (protección de tarifas mayoristas).
- El precio solo será visible y consultado para clientes autenticados en bases a sus listas de precios (Fases Posteriores).
- En la etapa actual, los precios se mantendrán ocultos y se omitirá su procesamiento.

## 6. Auditoría y Sync Logs

Es vital registrar detalladamente los resultados de la sincronización:
- **Productos creados**: Inserciones netas nuevas.
- **Productos actualizados**: Cruces exitosos (cambio de stock/precio u omisión segura).
- **Productos omitidos**: Productos en Bsale que no aplican a la empresa actual o no tienen SKU.
- **Conflictos**: Registros donde el cruce secundario de SKU falló por duplicidad estructural (ver sección 7).
- **Errores**: Excepciones de base de datos o fallos de red.
- **Fecha de última sincronización**: A nivel de tabla (`bsale_last_checked_at` en producto) y a nivel general (un registro de log).

## 7. Tabla Lógica de Conflictos

El importador debe detectar, catalogar y alertar sobre las siguientes anomalías:
1. **SKU Duplicado en Bsale**: Bsale envía múltiples variantes con el mismo SKU que intentarían cruzar con un único registro web.
2. **bsale_variant_id Duplicado**: Se intenta inyectar un ID de variante a un SKU distinto en la web.
3. **Producto sin SKU**: Bsale expone un producto innominado (debe omitirse, el SKU es obligatorio).
4. **Producto sin Nombre**: Imposible armar el `slug` básico, se marca como conflicto.
5. **Producto Inactivo en Bsale pero Activo en Web**: Bsale lo dio de baja operativamente, pero en la web sigue publicándose y vendiéndose (alerta roja).
6. **Producto sin Categoría Web / Sin Imagen**: Reporte de calidad para el equipo de marketing (no bloquea el importador técnico, pero es útil comercialmente).

## 8. Relación Temporal con Imágenes (Migración WordPress/cPanel)

Bsale no maneja eficientemente las imágenes comerciales de alta calidad requeridas para un e-commerce B2B. 
Por lo tanto, la web actual (cPanel / WooCommerce / WordPress) se usará **exclusivamente como fuente temporal y de un solo uso** para rescatar las fotos existentes de los productos.

- No se realizará una integración continua o permanente con WordPress.
- En una fase posterior (Fase 6E), se correrá un script que cruce los productos de la base de datos migrada (por SKU / slug / nombre) contra la carpeta de medios de WordPress, descargando las imágenes, subiéndolas al `Storage` nativo de Supabase y vinculándolas a `web_b2b.product_images`.

La elección de Supabase Storage se adopta como almacenamiento inicial definitivo para esta etapa. Si en el futuro el volumen, costo o rendimiento lo exige, se podrá evaluar Cloudflare R2/CDN sin cambiar la lógica de negocio ni la tabla web_b2b.product_images.

## 9. 6D.2 — Modelo de Control de Corridas
Se ha propuesto el modelo SQL base (sin aplicarlo todavía):
- **Tabla de runs**: `web_b2b.bsale_product_import_runs` para auditar cuándo y cómo se corrió la importación.
- **Tabla de items**: `web_b2b.bsale_product_import_items` para el detalle de cada producto revisado.
- Permite la bandera de `mode` (`dry_run` o `apply`) para correr pruebas seguras sin alterar DB.
- Todavía no se llama a Bsale. La visualización de este historial en el panel admin queda para fase posterior.

## 10. 6D.3A — Simulador local con fixtures
Se ha implementado un simulador local en TypeScript (`src/lib/bsale-product-import/planner.ts` y scripts asociados).
- **Aislamiento**: No llama a Bsale, no escribe en Supabase, y no crea productos reales.
- **Validación Temprana**: Valida todas las reglas de cruce (SKU, bsaleVariantId, conflictos) antes de conectar la API real.
- **Control de Riesgos**: El script `dry_run` local permite detectar conflictos estructurales usando fixtures de muestra, previniendo errores durante la ejecución real en Supabase.

## 11. Fases Propuestas Siguientes

1. **6D.3**: Desarrollo de script de ingesta local que conecte con el endpoint controlado de Bsale (solo lectura) usando la lógica validada en 6D.3A.
2. **6D.4**: Ejecución de importación con una muestra pequeña y validación de las reglas de upsert, conflictos y protección de datos comerciales en DB de staging/local.
3. **6E**: Script de una sola vez para volcado de imágenes desde la web actual hacia el Storage de Supabase.

### 6D.3B — Lectura real Bsale en dry-run
Esta fase realiza una validación controlada para alimentar el planner con datos reales desde la API de Bsale.
- **Solo GET/lectura**: Se usa el cliente Bsale preexistente de solo lectura (`bsaleFetch`) apuntando al endpoint de variantes de Bsale.
- **Muestra Limitada**: La consulta está restringida mediante el parámetro `limit` (max 50) para no agotar recursos ni saturar el servidor local.
- **Sin escritura en Supabase**: Los productos resultantes de Bsale se mapean en memoria local usando `bsale-mapper.ts` y pasan al `planner.ts`. No existe ejecución de escrituras SQL ni llamadas al Upsert de Supabase.
- **Sin productos creados**: Garantizado por el flujo puro del planner local que solo devuelve `proposedChanges` sin mutar el catálogo real.
- **Sin precios/stock procesados**: El mapper explícitamente anula precios y cantidades de inventario (`null`), confirmando la regla de negocio para etapas tempranas.
- **Nombre comercial (importante)**: Las variantes de Bsale pueden traer la característica (tamaño/formato) en `variant.description` (ej. `2KG`, `PEQUEÑO`, `N°1`). El nombre comercial debe construirse desde `product.name` / `product.description` (prioridad en ese orden) y opcionalmente **anexar** la descripción de variante (`"Alimento Mascota Adulto"` + `"2KG"` → `"Alimento Mascota Adulto 2KG"`). `source_name` no debe quedar solo como tamaño/formato. Solo si no existe nombre de producto se usa `variant.description` como fallback; nunca se inventa nombre desde el SKU.
- **Objetivo**: Validar el contrato real Bsale → planner local de forma totalmente aislada y segura antes de proceder a la inserción real de productos.

- **Comparación Segura**: Se leen los productos web existentes exclusivamente mediante la RPC de sistema `public.web_b2b_system_list_products_for_import` utilizando la clave `service_role`. Esto protege el esquema y evita problemas de permisos sin requerir una sesión de usuario (`auth.uid()`). No se manipulan runs/items todavía.

### 6D.3C — Dry-run real persistido en auditoría
Esta subfase tiene como objetivo registrar el resultado de un "dry-run" en las tablas de auditoría `web_b2b.bsale_product_import_runs` e `items`, sin mutar el catálogo de productos de la tienda.
- **Modo `dry_run`**: El campo `mode` de la corrida se fija en `dry_run`, lo cual asegura semánticamente que la corrida fue solo una simulación evaluativa.
- **Aislamiento Total de Catálogo**: Ni `web_b2b.products`, ni `product_prices`, ni `product_stock`, ni imágenes son modificados. El simulador arroja intenciones de cambio que se guardan purificadas de datos comerciales.
- **Escritura vía RPC System**: Dado que las tablas de auditoría pertenecen al esquema privado `web_b2b`, y con el fin de evitar inyecciones e ignorar el RLS correctamente usando la clave `service_role` desde un worker de backend, la escritura del log de auditoría se realiza mediante una nueva RPC `public.web_b2b_system_create_bsale_product_import_audit`. (Pendiente de aplicación por seguridad de fase).
- **Validaciones obligatorias de la RPC**: `p_mode` debe ser exclusivamente `dry_run` (cualquier otro valor lanza excepción controlada); `p_items` no puede ser `null`, debe ser un array JSON y su longitud no puede superar **50 elementos** en esta fase; `p_summary` no puede ser `null` y debe ser un objeto JSON; todos los contadores (`p_total_seen`, `p_total_created`, `p_total_updated`, `p_total_skipped`, `p_total_conflicts`, `p_total_errors`) deben ser `>= 0`.
- **Sanitización reforzada del payload**: El cliente solo persiste el payload mínimo `{ dry_run: true, proposed_changes: {...} }`. `proposed_changes` se copia únicamente si es un objeto plano (arrays y valores primitivos se descartan y quedan como `{}`), y se eliminan defensivamente —incluso en objetos anidados— las claves `price`, `stock`, `stockQuantity`, `stock_quantity`, `price_amount` y `cost`. No se guarda el payload completo de Bsale, token, URL completa, precio, ni stock exacto.
- **Nombre comercial en source_name**: El `source_name` persistido usa el nombre comercial construido por el mapper (ver nota en 6D.3B): base desde `product.name`/`product.description` con la característica de variante anexada cuando es útil. Un run histórico puede mostrar solo la característica (`2KG`) si se persistió antes de esta corrección; los runs nuevos ya no quedan así.
- **Estados persistidos en esta fase**: La RPC persiste auditorías `dry_run` completas con estado `success` o `partial` (según existan errores/conflictos). Si la transacción falla, no queda ningún run `failed` persistido (rollback total). El manejo del estado `failed` queda pendiente para una fase futura de observabilidad avanzada.
- **Propósito**: Sirve para evaluar a nivel macro en el panel de administrador qué impacto tendrá la siguiente importación, permitiendo aceptar o rechazar corridas completas y estudiar conflictos pre-existentes sin riesgo.

### 6D.3D — Panel admin de auditorías Bsale
Esta subfase implementa la visualización en el panel admin de las corridas dry_run persistidas en `web_b2b.bsale_product_import_runs` e `items`. Es SOLO auditoría/visualización.
- **Muestra runs/items persistidos**: Listado de corridas en `/admin/productos/importaciones` y detalle de items en `/admin/productos/importaciones/[id]`, incluyendo la corrida dry_run real creada en 6D.3C.
- **Usa RPCs admin read-only**: Se consumen exclusivamente `public.web_b2b_admin_list_bsale_product_import_runs(target_company_id)` y `public.web_b2b_admin_list_bsale_product_import_items(target_company_id, import_run_id, page_size, page_number)` desde el usuario autenticado normal (validan admin con `web_b2b.check_admin_access`). NO se usa `service_role` en la UI admin, ni `.schema('web_b2b').from(...)`, ni acceso directo a tablas.
- **No llama Bsale**: El panel solo lee registros ya persistidos; no hay conexión a la API de Bsale.
- **No ejecuta importación**: No hay botones de aplicar/importar ahora/crear productos. La única acción es navegar al detalle read-only.
- **No toca productos/precios/stock/imágenes**: Las RPCs usadas retornan solo datos de auditoría (sin payload, sin precios, sin stock, sin imágenes).
- **Capa API modular**: `src/lib/api/admin-import-audits.ts` (server-only) expone `getBsaleProductImportRuns()` y `getBsaleProductImportItems(runId, pageSize, pageNumber)`, leyendo `MYM_COMPANY_ID` desde el servidor.
- **Servicio**: Sirve como revisión previa antes de permitir cualquier `apply` en fases futuras.

### 6D.3E — Dry-run ampliado/segmentado
Esta subfase amplía la lectura de Bsale real de forma segmentada para obtener un dry-run más representativo, sin aplicar nada al catálogo.
- **Lectura Bsale en segmentos**: Se usa `fetchBsaleProductSegment({ limit, offset })` sobre `/variants.json` (paginación `limit` + `offset` de Bsale v1, con `expand=product`, solo GET). La lectura respeta límites defensivos: `batchSize` 50 por request, `maxBatches` 2 y `maxTotal` 100 items en esta primera versión (nunca se supera salvo cambio explícito de código en otra fase).
- **Planner global**: El planner corre sobre el conjunto completo leído (todos los segmentos combinados), no por batch aislado. Así, si un mismo SKU aparece en más de un segmento, ambos quedan registrados como conflicto `duplicate_sku`.
- **Persistencia en múltiples runs**: La RPC `web_b2b_system_create_bsale_product_import_audit` acepta máximo 50 items por llamada, por lo que el resultado del planner se divide en chunks de máximo 50 (`chunkPlannerItems`) y cada chunk se persiste como una corrida `dry_run` separada con su propio summary (`summarizePlannerItems`). El script además imprime un summary global en consola.
- **Validaciones**: `sensitive_payload_count = 0` en los runs nuevos; `web_b2b.products` sin cambios (mismo conteo antes/después); sin precios/stock/imágenes; sin `apply`; sin botones de importación real (el panel de auditorías existente muestra los nuevos runs automáticamente).
- **Límite de esta fase**: máximo 2 runs y 100 items totales insertados.

### 6D.3F — Revisión de cobertura y estrategia primer apply
Esta subfase es SOLO análisis/reporte (read-only). No se implementa ni ejecuta apply.
- **Análisis read-only**: lectura de metadata de paginación Bsale (`fetchBsaleVariantPageMetadata`) y de segmentos controlados (`fetchBsaleProductSegment`), sin persistir runs/items nuevos.
- **Estimación de cobertura Bsale**: la API de Bsale v1 reporta `count` total (3.591 variantes en la ejecución de referencia); el análisis cubrió una muestra ampliada de máximo **200 items** (4 segmentos × 50, offsets 0/50/100/150 ≈ 5.57%).
- **Planner global**: se ejecuta sobre el conjunto completo leído para detectar duplicados entre segmentos; summary y muestras compactas (5 create / 5 skip / 5 conflict) se imprimen sin precios, stock ni payload.
- **No toca catálogo**: sin productos, precios, stock ni imágenes; productos web solo como comparación read-only.
- **Salida como reporte markdown**: `docs/productos/REPORTE_COBERTURA_BSALE_6D3F.md` con metadata, segmentos, summary, hallazgos, riesgos y recomendación de primer apply conservador (máx 20 productos, `draft`, `is_active=false`, `is_visible=false`, `bsale_sync_status='pending'`, sin precios/stock/imágenes, rollback conceptual vía migration/script controlado).
- **Primer apply**: queda para fase posterior (6D.4 o siguiente), con su propia revisión.

### 6D.4A — Diseño primer apply controlado
Esta subfase es SOLO diseño; no se implementa ni ejecuta apply.
- **Documento de diseño**: `docs/productos/DISENO_PRIMER_APPLY_BSALE_6D4A.md` define la estrategia completa del primer apply controlado desde una auditoría dry-run hacia `web_b2b.products`.
- **Selección**: máximo 20 items de un único run `dry_run` / `success` revisado visualmente, con `action='create'`, `status='pending'`, `conflict_type IS NULL`, sku/bsale_variant_id/source_name no nulos.
- **Validaciones previas**: SKU y bsale_variant_id inexistentes en `web_b2b.products` para la compañía, slug sin colisión (sufijo controlado), `proposed_changes` sin price/stock/cost, `payload.dry_run=true`, run perteneciente a la compañía y no aplicado antes.
- **Idempotencia**: nueva tabla `web_b2b.bsale_product_apply_runs` (+ `apply_items`) con índice único `(company_id, import_run_id)`; apply en transacción; nunca doble apply.
- **RPC futura (no ejecutada)**: `public.web_b2b_system_apply_bsale_product_import_run(target_company_id, import_run_id, max_items default 20)`, `SECURITY DEFINER`, `SET search_path=''`, GRANT solo `service_role`, `max_items <= 20`, sin SQL dinámico, sin precios/stock/imágenes.
- **Estado de creación seguro**: `draft`, `is_active=false`, `is_visible=false`, `is_featured=false`, `bsale_sync_enabled=true`, `bsale_sync_status='pending'`, sin precios/stock/imágenes/publicación.
- **Rollback conceptual**: nunca borrado automático; ante fallos marcar inactivo/no visible; limpieza por SQL/script controlado con IDs exactos.
- **DEMO/TEST**: DEMO-001..003 y TEST-UI-001 se mantienen; antes del apply real decidir entre mantener inactivos, limpiar controlado o excluirlos por SKU.
- **Siguiente fases**: 6D.4B (migración/RPC borrador sin ejecutar), 6D.4C (dry-run técnico con transacción rollback), 6D.4D (primer apply real ≤ 20 productos).

### 6D.4B — Borrador SQL/RPC de apply controlado
Esta subfase es SOLO borrador/revisión técnica; no se ejecuta SQL ni se crean productos.
- **Borrador local**: `docs/productos/borrador_apply_control_6d4b.sql` (aún no migración formal) con tablas `web_b2b.bsale_product_apply_runs` y `bsale_product_apply_items`, helper `web_b2b.generate_unique_product_slug_for_import` y RPC futura `public.web_b2b_system_apply_bsale_product_import_run`.
- **Detalles**: ver `docs/productos/DISENO_PRIMER_APPLY_BSALE_6D4A.md` (sección 6D.4B). Aplica máximo 20 items de un run `dry_run`/`success` revisado; productos en estado seguro (`draft`, inactivo, no visible, `bsale_sync_status='pending'`); idempotencia por UNIQUE(company_id, import_run_id); transacción atómica con rollback total; sin precios/stock/imágenes.
