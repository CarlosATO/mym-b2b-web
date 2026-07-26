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

## Próximos Pasos Inmediatos
- [ ] Implementar enforcement técnico real de MFA (nivel AAL) para cuentas administrativas.
- [ ] Diseñar estrategia de importación masiva desde Bsale (sincronización).
- [ ] Diseñar estrategia de procesamiento y migración de imágenes desde WooCommerce hacia Supabase Storage.

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
