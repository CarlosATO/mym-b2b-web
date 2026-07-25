# Fase 2: Políticas de Acceso RLS (web_b2b)

## Objetivo de la Fase 2
El objetivo de esta fase fue implementar y desplegar el modelo de seguridad a nivel de filas (RLS) en el esquema `web_b2b`. Esto asegura un acceso estrictamente controlado a la información pública, la protección total de datos sensibles comerciales y un sistema de roles para la administración del portal.

## Migración Ejecutada
- **Archivo:** `supabase/migrations/202607_web_b2b_access_policies.sql`

## Confirmación de Ejecución
- ✅ **Despliegue Real:** La migración fue ejecutada y validada exitosamente sobre el motor PostgreSQL de Supabase en producción/staging.

## Funciones/RPCs Creadas
Las siguientes rutinas seguras fueron desplegadas (todas operando bajo el alcance aislado del esquema `web_b2b` y exigiendo el paso de `target_company_id`):

- `can_manage_customers_for_company`
- `customer_can_view_prices_for_company`
- `get_public_banners`
- `get_public_brands`
- `get_public_catalog_products`
- `get_public_categories`
- `get_public_product_by_slug`
- `get_public_promotions`
- `is_approved_customer_for_company`
- `is_web_admin_for_company`
- `is_web_content_manager_for_company`
- `is_web_super_admin_for_company`

## Garantías de Seguridad Comprobadas
- ✅ **Catálogo Público:** Todo acceso a `products`, `brands`, `categories`, `banners` y `promotions` se consulta de manera forzosa a través de las funciones RPC para limpiar campos internos y garantizar la segmentación multiempresa (`target_company_id`).
- ✅ **Filtros Estrictos:** No existe política directa de tipo `SELECT` público (anon o autenticado sin roles) sobre las tablas base `products` o `product_images`.
- ✅ **Aislamiento Comercial:** Los precios (`product_prices`) y el inventario exacto (`product_stock`) **no son públicos**.
- ✅ **Separación de Responsabilidades:** El rol `WEB_CONTENT_MANAGER` ha sido excluido del acceso a la tabla de clientes (`customer_access`), garantizando privacidad de cartera.
- ✅ **Protección de Datos Maestros:** Las tablas estructurales (`brands`, `categories`, `products`) no poseen política de `DELETE` para roles de contenido, promoviendo de forma mandatoria la desactivación de registros en vez del borrado físico (soft-delete).

## Garantías Adicionales
- ✅ **Entorno Limpio:** No se cargó ningún dato real ni sintético en esta etapa.
- ✅ **ERP/Legacy Intactos:** No hubo llamados a la API de Bsale. Tampoco existió ninguna conexión o afectación sobre los procesos del sistema legacy en WordPress/WooCommerce.

## Riesgos y Pendientes Restantes
1. **Administración huérfana:** Todavía no existe el primer usuario administrador web creado en la tabla `admin_access`. Este paso es bloqueante para autogestión.
2. **Entorno vacío:** Todavía no hay datos de catálogo insertados para ser presentados.
3. **Integración SPA:** Todavía falta conectar el frontend (Next.js) con las RPCs seguras de lectura del catálogo.
