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

## 9. Fases Propuestas Siguientes

1. **6D.1**: Aprobación de este documento de diseño.
2. **6D.2**: Creación de RPCs (e.g., `web_b2b_sync_bsale_product`) y tablas de control de importación (logs).
3. **6D.3**: Desarrollo de script de ingesta local que lea un payload de prueba o conecte con el endpoint controlado de Bsale (solo lectura).
4. **6D.4**: Ejecución de importación con una muestra pequeña y validación de las reglas de upsert, conflictos y protección de datos comerciales.
5. **6E**: Script de una sola vez para volcado de imágenes desde la web actual hacia el Storage de Supabase.
