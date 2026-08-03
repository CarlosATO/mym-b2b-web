# Tareas Pendientes y Roadmap

## Completado
- [x] Fase 1: schema web_b2b creado en Supabase real con RLS deny-by-default.
- [x] Fase 2: Creación local de archivo de migración con policies, vistas y funciones helper (`202607_web_b2b_access_policies.sql`).
- [x] Fase 2: Ejecución de migración de policies RLS en Supabase real (RPC públicas y roles).
- [x] Fase 3: Obtener MYM_COMPANY_ID e insertar primer WEB_SUPER_ADMIN de forma controlada.
- [x] Fase 3.1: Conectar frontend público a RPCs de catálogo usando Supabase client server-side.
- [x] Fase 3.1: Configurar validación de `web_b2b.admin_access` en `/admin` de forma segura.
- [x] Fase 3.2: Implementar login real con Supabase Auth y Server Actions (SSR).
- [x] Fase 4: Preparar y ejecutar carga mínima de datos de catálogo B2B de forma controlada (`202607_seed_demo_catalog_web_b2b.sql`).
- [x] Fase 5: Rediseño visual hacia look comercial B2B (Mascotas/Distribuidora).
- [x] Fase 6A.1: Creación y aplicación estructural en `web_b2b` usando `db query --linked` para soporte admin (columnas, índices, RPC paginada). No se modificaron datos reales.
- [x] Fase 6B.1: Creación y aplicación estructural de RPCs seguras para Categorías y Marcas.
- [x] Fase 6B.2: Frontend CRUD de Categorías y Marcas en Panel Admin.

## Próximos Pasos Inmediatos
- [x] Fase 6C.1: RPCs Admin Productos aplicadas y validadas (`202607_web_b2b_admin_products_rpcs.sql`). `bsale_variant_id` ajustado a text. Funciones validadas con `BEGIN/ROLLBACK` sin dejar persistidos datos temporales.
- [x] Fase 6C.2: Frontend Listado de Productos en Panel Admin.
- [ ] Fase 6C.3: CRUD crear/editar producto.
- [ ] Fase 6D: Integrar Storage seguro de imágenes.
- [ ] Fase 7: Importación WooCommerce/cPanel + cruce Bsale (solo revisión, no crear en Bsale).
- [ ] Fase 8: Sincronización real Bsale stock/precios.

## Notas Arquitectónicas Clave (Aprobadas en Fase 6)
- **Bsale es fuente oficial de stock, pero la web pública lee de Supabase.** No hay consultas en tiempo real de Bsale por cada visita pública.
- **El catálogo público debe ser paginado** mediante la nueva RPC `get_public_catalog_products_paginated`.
- **Imágenes finales** deben servirse desde Supabase Storage o CDN (prohibido hotlinking a WordPress).
- **El panel admin escribirá vía RPCs controladas** (SECURITY DEFINER, public schema temporal, auditoría).
- **Importación WooCommerce** requerirá validación de imágenes y cruce por SKU.

## Tareas Restantes de Migración e Integración
- [ ] Revisar la integración existente de Bsale en el ERP para estandarizar modelos.
- [ ] Exportar CSV de productos actuales desde WooCommerce.
- [ ] Descargar imágenes de WooCommerce (modo lectura).
- [ ] Mapear SKUs con imágenes.
- [ ] Subir imágenes al nuevo Supabase Storage.
- [ ] Implementar middleware y Higher Order Components para validación de roles de Admin.
- [ ] Implementar las pantallas reales del panel admin con mutaciones Server Actions.
- [ ] Preparar el despliegue en entorno de Staging (e.g., Railway o Vercel).
- [ ] **FUTURO:** Si Supabase reconoce correctamente la exposición de `web_b2b` en la API REST, eliminar los "Wrapper RPCs" del schema `public` y restaurar los llamados directos desde el frontend para simplificar la arquitectura.
- [ ] **FUTURO:** Diseñar e implementar el modelo de Listas de Precios (tablas `price_lists`, `customer_price_lists`) y su lógica de resolución.

## Pendientes Permanentes
- [ ] Mantener archivos modulares y evitar archivos sobre 1000 líneas.
