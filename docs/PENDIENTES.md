# Tareas Pendientes y Roadmap

## Completado
- [x] Fase 1: schema web_b2b creado en Supabase real con RLS deny-by-default.
- [x] Revisar detalladamente la migración SQL (`202607_web_b2b_initial_schema.sql`).
- [x] Ejecutar migración SQL en la base de datos Supabase (solo tras aprobación).
- [x] Conectar variables reales de Supabase en `.env.local` (excluido de Git).
- [x] Configurar credenciales reales de Bsale.

## Próximos Pasos Inmediatos
- [ ] Crear migración de policies públicas mínimas para catálogo sin precios.
- [ ] Crear policies o RPC para clientes aprobados con precios.
- [ ] Crear acceso admin con web_b2b.admin_access.
- [ ] Insertar primer admin web manualmente después de definir flujo seguro.
- [ ] Preparar estrategia de importación de productos e imágenes.

## Tareas Restantes de Migración e Integración
- [ ] Revisar la integración existente de Bsale en el ERP para estandarizar modelos.
- [ ] Exportar CSV de productos actuales desde WooCommerce.
- [ ] Descargar imágenes de WooCommerce (modo lectura).
- [ ] Mapear SKUs con imágenes.
- [ ] Subir imágenes al nuevo Supabase Storage.
- [ ] Implementar políticas RLS reales.
- [ ] Implementar lógica completa de inicio de sesión (SSR).
- [ ] Implementar middleware y Higher Order Components para validación de roles de Admin.
- [ ] Implementar las pantallas reales del panel admin con mutaciones Server Actions.
- [ ] Preparar el despliegue en entorno de Staging (e.g., Railway o Vercel).

## Pendientes Permanentes
- [ ] Mantener archivos modulares y evitar archivos sobre 1000 líneas.
