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
- [x] Fase 6C.3: CRUD crear/editar producto (UI técnica completada).
- [x] Fase 6C.3A: Ajuste de negocio: deshabilitada creación manual de productos. Los productos provendrán exclusivamente de Bsale/Sincronización. Admin edita únicamente presentación web.
- [x] Fase 6D.3C: RPC system de auditoría dry_run aplicada y validada (`202607_web_b2b_system_create_bsale_import_audit_rpc.sql`). Dry-run real persistido (run `success`, 20 items, `sensitive_payload_count = 0`). Commit `49806cd`.
- [x] Fase 6D.3D: Panel admin de auditorías Bsale (listado `/admin/productos/importaciones` + detalle `/[id]`). Solo lectura vía RPCs admin; sin Bsale, sin importación, sin productos/precios/stock/imágenes.
- [x] Fase 6D.3E: Dry-run ampliado/segmentado (`dry-run-bsale-segmented-audit.ts`). Lectura paginada Bsale (2 segmentos × 50), planner global, persistencia en 2 runs dry_run de 50 items cada uno, `sensitive_payload_count = 0`, productos intactos (4 → 4).
- [x] Fase 6D.3F: Análisis de cobertura Bsale read-only (`analyze-bsale-coverage.ts`). Total Bsale reportado: 3.591 variantes; 200 analizadas (5.57%); planner 184 create / 16 skip / 0 conflictos; reporte `docs/productos/REPORTE_COBERTURA_BSALE_6D3F.md` con estrategia de primer apply conservador. Sin runs/items nuevos.
- [x] Fase 6D.4A: Diseño del primer apply controlado (`docs/productos/DISENO_PRIMER_APPLY_BSALE_6D4A.md`). Selección ≤ 20 items, validaciones previas, idempotencia (apply_runs/apply_items), RPC system propuesta, rollback conceptual, limpieza DEMO/TEST, riesgos. Sin implementación.
- [x] Fase 6D.4B: Migración/RPC de apply controlado (borrador SQL, sin ejecutar). Borrador local creado: `docs/productos/borrador_apply_control_6d4b.sql` (tablas apply_runs/apply_items, helper slug, RPC system). Revisión 2 aplicada: `bsale_last_checked_at=NULL`, `max_items` con COALESCE, slug con acentos (translate), revokes del helper, duplicados como `conflict`, excepción sin candidatos, amarre FK `(id, run_id, company_id)`. Cerrada como borrador final (commit `f3baa0a`).
- [x] Fase 6D.4C: Migración formal candidata + prueba técnica con ROLLBACK. Creada `supabase/migrations/20260804120000_web_b2b_controlled_bsale_product_apply.sql`. Probada solo con `BEGIN; ... ROLLBACK`: migración aplica, RPC crea máx 20 productos seguros sin persistir; negativas PASS (max_items>20, NULL→20, run inexistente, doble apply). Hallazgo: colisión de nombre `import_run_id` (42702) corregida con prefijos `p_` en la candidata y el borrador 6D.4B fue alineado con la misma corrección (sin divergencia documental). Reporte `docs/productos/REPORTE_ROLLBACK_APPLY_BSALE_6D4C.md`. Cerrada (commit `0866d3e`).
- [x] Fase 6D.4D-A: Aplicación real de estructura apply controlado SIN ejecutar apply. Migración `20260804120000_web_b2b_controlled_bsale_product_apply.sql` aplicada en Supabase real con `db query --linked --file` (sin db push/pull/repair). Tablas, RLS, constraints, funciones y grants validados; products sigue en 4; apply_runs/apply_items vacías; RPC de apply NO llamada. Reporte `docs/productos/REPORTE_APLICACION_ESTRUCTURA_APPLY_BSALE_6D4D_A.md`. Cerrada (commit `22d8ca1`).
- [ ] Fase 6D.4D-B: Primer apply real (máximo 20 productos). Primer apply ejecutado UNA sola vez con run dry_run `22e1d487-36e6-4475-a0e0-a28d0305dbcc` y `max_items=20`: apply_run `9a209048-b2fe-4ee4-af42-b5bf3901442c` status success, 20/20 creados, 0 conflictos/errores; products 4→24 en estado seguro (draft/inactivo/no visible), sin precios/stock/imágenes; DEMO/TEST intactos; sin exposición pública. Reporte `docs/productos/REPORTE_PRIMER_APPLY_BSALE_6D4D_B.md`. (en revisión visual admin). Validada visualmente por Carlos. Cerrada con commit y push.
- [ ] Fase 6D.4E: Revisión post-apply y preparación de curación comercial (diagnóstico, sin ejecución). 20/20 productos revisados: 0 inseguros, 0 visibles, 0 con precio/stock/imagen; 20/20 requieren curación (sin categoría/marca/imagen/descripción/SEO). DEMO/TEST intactos (DEMO-001/002/003 visibles en catálogo público; limpiar antes de publicación). Diseño del flujo futuro: sync automático + botón manual "Sincronizar desde Bsale" (misma lógica segura), panel de curación, imágenes como fase separada. Reporte `docs/productos/REPORTE_POST_APPLY_CURACION_BSALE_6D4E.md`. (en revisión). Validada por Carlos. Cerrada con commit y push.
- [ ] Fase 6D.5A: Normalización comercial de productos importados Bsale. El listado `/admin/productos` ya identifica pendientes de normalización con badge, orden sugerido y filtros (pendientes, sin categoría, sin marca, sin imagen, nuevos Bsale). No importa más productos; no llama Bsale; no ejecuta apply; solo prepara curación antes de publicación. Reporte `docs/productos/REPORTE_NORMALIZACION_PRODUCTOS_BSALE_6D5A.md`.
- [ ] Fase 6D.5A.1: Compactar resumen superior de productos. KPIs más pequeños y menos altos, filtros más compactos, tabla con más protagonismo; se separa `Pendientes de normalización` de `Nuevos Bsale pendientes`.
- [ ] Fase 6D.5A.2: Filtros automáticos y corrección de error en `/admin/productos`. El botón `Filtrar` fue eliminado; los selects y búsqueda actualizan la URL automáticamente; `getAdminProducts` normaliza filtros vacíos a `NULL` y mejora el logging de error para evitar el fallo `Error fetching admin products: {}`.
- [ ] Fase 6D.5B: Formulario de edición para normalización comercial. Se reorganizó el formulario por secciones (Identidad Bsale, Normalización comercial, Imagen principal, SEO, Checklist, Estado/publicación), con SKU/variant/sync en solo lectura, checklist de campos faltantes, soporte de imagen principal individual y advertencia de publicación humana. Reporte `docs/productos/REPORTE_FORMULARIO_NORMALIZACION_BSALE_6D5B.md`.
- [ ] Fase 6D.5B.1: Corrección layout formulario normalización comercial. El formulario quedó en dos columnas claras, alerta superior compacta, columna lateral como panel de control y footer de acciones más cercano; publicación segura incompleta pendiente para 6D.5C.
- [ ] Fase 6D.5C: Publicación segura de productos normalizados. El guardado permite borrador incompleto, pero bloquea active/visible/published/featured si faltan categoría, marca, imagen principal, nombre, slug o descripción. Helper compartido `src/lib/utils/product-publication.ts`, Server Action y UI muestran aviso claro. Reporte `docs/productos/REPORTE_PUBLICACION_SEGURA_PRODUCTOS_BSALE_6D5C.md`.
- [ ] Fase 6D.5D: Diseño de gestión de imágenes de productos. Documento solo diseño para carga local desde computador e importación por URL con Storage propio. `primary_image_url` seguirá siendo la interfaz de edición hasta implementar subida real. Reporte `docs/productos/DISENO_IMAGENES_PRODUCTOS_BSALE_6D5D.md`.
- [x] Fase 6D.5E-A: Base Storage para imágenes de productos. Migración candidata `20260804130000_web_b2b_product_images_storage.sql` validada con `BEGIN; ... ROLLBACK;`: bucket `product-images`, helpers de path y policies de `storage.objects` sin persistir cambios. Reporte `docs/productos/REPORTE_STORAGE_IMAGENES_PRODUCTOS_6D5E_A.md`.
- [x] Fase 6D.5E-B: Carga individual de imágenes desde computador. Implementada en `ProductForm` con upload a `product-images` y validada por Carlos con el producto `BRACCO TRAVEL TRANSPORTADORA Nº3`; la imagen quedó en Storage, `primary_image_url` se actualizó y el producto siguió borrador/inactivo/no visible. Reporte `docs/productos/REPORTE_UPLOAD_INDIVIDUAL_IMAGEN_BSALE_6D5E_B.md`.
- [x] Fase 6D.5F-A: Visualización jerárquica de categorías. La UI muestra padre/subcategoría con rutas como `Accesorios > Transportadoras` sin cambiar `parent_id` ni el schema. Reporte `docs/productos/REPORTE_CATEGORIAS_JERARQUICAS_6D5F_A.md`.
- [x] Fase 6D.5F-B: Curación manual de BRACCO y cierre operativo. Producto curado desde admin con categoría hija, marca, descripción e imagen; sigue en borrador/inactivo/no visible/no destacado y no aparece en catálogo. Reporte `docs/productos/REPORTE_CURACION_PRODUCTO_BRACCO_6D5F_B.md`.
- [x] Fase 6D.5G: Importación de imagen desde URL a Storage. Flujo corregido en server-side para copiar una imagen externa a `product-images`; la re-prueba real se validó con `PELUCHE DE GATO MOUNSTRUOS SURTIDOS` y dejó `primary_image_url` persistida en Storage y BD. Reporte `docs/productos/REPORTE_IMPORTACION_IMAGEN_URL_6D5G.md`.
- [ ] Fase 6D.5: Curación comercial de la muestra (categorías, marcas, descripciones/SEO) y diseño de sync recurrente Bsale.
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
- [x] Fase 6D.6A: Auditoría de imágenes desde web actual (dry-run/diseño). Diseño para futura migración masiva de imágenes desde WooCommerce hacia Supabase Storage. Reporte `docs/productos/DISENO_AUDITORIA_IMAGENES_WEB_ACTUAL_6D6A.md`.
- [x] Fase 6D.6B: Dry-run real con CSV WooCommerce (Match y reporte sin mutaciones). Métrica final corregida: 1 candidato directo apto para importación automática futura, 6 candidatos heredados desde padre aptos para revisión visual/importación controlada, 2 bloqueados por imagen existente y 15 ignorados. Reporte `docs/productos/REPORTE_DRY_RUN_CSV_WOOCOMMERCE_6D6B.md`.
- [x] Fase 6D.6B-FIX: Build sin dependencia externa de Google Fonts. Se eliminó `next/font/google` y `@import` remoto de Inter; la app usa stack de sistema y `npm run build` ya no requiere descargar fuentes. Reporte `docs/productos/REPORTE_BUILD_SIN_GOOGLE_FONTS_6D6B_FIX.md`.
- [ ] Fase 6D.6C: Desarrollo e importación real controlada de imágenes desde CSV, separando importación automática del candidato directo y revisión visual previa para candidatos heredados desde padre.
