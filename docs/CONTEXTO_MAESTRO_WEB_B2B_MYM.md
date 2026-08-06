# Contexto Maestro — MYM Web B2B

Documento único de contexto del proyecto **MYM Web B2B**. Su propósito es permitir retomar el trabajo con cualquier agente futuro sin perder contexto técnico, comercial ni operativo.

- **Fecha de creación:** 06/08/2026
- **Base:** levantamiento maestro del proyecto (git, fases, decisiones, fuentes, seguridad, conteos).
- **Regla de lectura:** este documento es referencia. No modificar archivos del proyecto por instrucción de este documento; las reglas de trabajo están en la sección 18.

---

## 1. Resumen ejecutivo

MYM Web B2B es una nueva plataforma web B2B para **MYM Distribuidora**, independiente de la infraestructura actual en WordPress/WooCommerce (`amimascota.cl`). El portal es un e-commerce/catálogo comercial propio, rápido, controlado y escalable, con integración segura a **Bsale** como fuente de verdad operacional.

Estado actual (06/08/2026):

- Next.js 16 (App Router) + TypeScript + Tailwind + Supabase (schema `web_b2b`) + Storage `product-images`.
- Catálogo público operativo sin precios: **4 productos visibles** (3 DEMO + 1 Bsale piloto SKU `100909`).
- Admin funcional: categorías, marcas, productos, importaciones Bsale (solo lectura), publicación segura.
- **74 productos** en `web_b2b.products`: 70 reales Bsale (draft), 3 DEMO, 1 TEST.
- `product_prices` y `product_stock`: **0 filas**. Sin carga real de precios/stock (bloqueada por diseño hasta validar fuente oficial).
- RPC privada para cliente aprobado aplicada y validada.
- Cliente Bsale read-only (precio/stock por variante) implementado en código, sin commit todavía.
- **No listo para producción comercial completa**: fase de integración controlada, pilotos y preparación de sync.

---

## 2. Objetivo comercial

La nueva Web B2B de MYM busca **reemplazar o complementar** la experiencia actual basada en WordPress/WooCommerce con un portal propio para clientes comerciales.

El portal debe permitir:

- catálogo público **sin precios**;
- catálogo privado **con precios para clientes aprobados**;
- presentación comercial profesional (marca, categorías, imágenes, SEO);
- administración interna de contenido web (panel admin);
- futura toma de pedidos;
- integración segura con **Bsale como fuente operacional**.

Fuera del MVP: pagos online y pedidos/compra (`can_create_orders` queda para fase futura).

---

## 3. Principios rectores

1. **Bsale es la fuente de verdad operacional** (productos, variantes, SKU, barcode, precio vigente, stock).
2. **La web B2B es la fuente de verdad comercial/presentación** (imágenes definitivas, descripciones, SEO, marca/categoría web, visibilidad, destacado, orden comercial).
3. **amimascota.cl / WooCommerce es fuente legacy** (imágenes históricas, descripciones útiles, contenido comercial base) **sin dependencia permanente**.
4. **El público nunca ve precios ni stock exacto.**
5. **El cliente no aprobado nunca ve precios ni stock.**
6. **El cliente aprobado ve precio (LP COMERCIANTE, IVA incluido) y disponibilidad resumida**, no cantidad exacta por defecto.
7. **No inventar datos**: no usar costo como precio, no usar historial de ventas como precio vigente, no inventar stock.
8. **No hotlinking**: las imágenes se sirven desde Supabase Storage.
9. **No crear productos manualmente**: los productos provienen exclusivamente de Bsale; el admin edita solo presentación web.
10. **No tocar WordPress/WooCommerce/cPanel** salvo lectura explícita.

---

## 4. Arquitectura general

```
┌─────────────────────┐     ┌──────────────────────────┐
│  Frontend Next.js   │     │  Supabase (PostgreSQL)   │
│  (App Router, SSR)  │────▶│  schema web_b2b (12 tabs)│
│  /catalogo, /admin  │     │  RLS deny-by-default     │
└──────────┬──────────┘     │  RPC públicas get_public_│
           │                │  RPC privada comercial   │
           │                │  Storage product-images  │
           │                └────────────┬─────────────┘
           │                             │
           ▼                             ▼
┌─────────────────────┐      ┌──────────────────────────┐
│  Bsale API (ERP)    │      │  WordPress/WooCommerce   │
│  fuente operacional │◀────▶│  amimascota.cl (legacy)  │
│  precio + stock     │      │  imágenes/descripciones  │
└─────────────────────┘      └──────────────────────────┘
```

- **Frontend:** Next.js (App Router), Server Components; lógica de datos server-only.
- **Backend/BD:** Supabase, schema `web_b2b` aislado del ERP; RLS en todas las tablas.
- **Auth:** Supabase Auth compartido con el ERP, autorización separada en `web_b2b.admin_access` / `customer_access`.
- **Storage:** Supabase Storage bucket `product-images`.
- **Integración ERP:** Bsale API REST v1 (`https://api.bsale.io/v1`), solo server-side.
- **Despliegue recomendado (futuro):** Railway o Vercel, 100% independiente de WordPress.
- **Sync futuro:** proyección controlada Bsale → `web_b2b.product_prices` / `product_stock` → RPC privada → UI cliente aprobado. Nunca consulta Bsale por cada visita pública.

---

## 5. Fuentes de verdad y responsabilidades

### Bsale = fuente de verdad operacional

| Dato | Responsable |
|---|---|
| Productos | Bsale (importados por apply controlado) |
| Variantes | Bsale |
| SKU/código | Bsale (`variant.code`) |
| Barcode | Bsale (`variant.bar_code`) |
| Precio vigente | Bsale (`LP COMERCIANTE`, `variantValueWithTaxes`) |
| Stock/disponibilidad | Bsale (`stocks.json` → `quantityAvailable`) |

### Web B2B (Supabase `web_b2b`) = fuente de verdad comercial/presentación

| Dato | Responsable |
|---|---|
| Imágenes definitivas | Web B2B (Supabase Storage `product-images`) |
| Descripciones | Web B2B (edición admin) |
| SEO (`seo_title`, `seo_description`, slug) | Web B2B |
| Marca/categoría web | Web B2B |
| Visibilidad (`is_active`, `is_visible`, `review_status`) | Web B2B |
| Destacado (`is_featured`) | Web B2B |
| Orden comercial | Web B2B |

### amimascota.cl / WooCommerce = fuente legacy (no dependencia permanente)

| Dato | Uso |
|---|---|
| Imágenes históricas | Importación controlada → Supabase Storage |
| Descripciones útiles | Contenido comercial base (migración futura) |
| CSV local | Cruce por SKU para localizar imágenes |

---

## 6. Stack técnico y repositorio

- **Repositorio:** `https://github.com/CarlosATO/mym-b2b-web.git` (remote `origin`), rama `main`.
- **Framework:** Next.js **16.2.12** (App Router). **IMPORTANTE:** esta versión tiene breaking changes vs Next.js estándar; leer guías en `node_modules/next/dist/docs/` antes de escribir código.
- **Lenguaje:** TypeScript 5.
- **Estilos:** Tailwind CSS 4.
- **Supabase:** `@supabase/ssr` 0.12.3, `@supabase/supabase-js` 2.110.8. Proyecto `mym-distribuidora-prod` (ref `oekmztbfasmildyuajji`).
- **Scripts npm:** `dev` (puerto 3000), `build`, `start`, `lint` (eslint).
- **Variables de entorno (`.env.example`):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (nunca al cliente), `BSALE_API_BASE_URL`, `BSALE_ACCESS_TOKEN` (nunca al cliente), `MYM_COMPANY_ID`. **No incluir contenido de `.env.local` en ningún documento ni commit.**
- **Rutas clave del código:**
  - Cliente Bsale: `src/lib/bsale/client.ts`, `src/lib/bsale/types.ts`
  - Importación productos Bsale: `src/lib/bsale-product-import/` (readonly, mapper, planner, audit-writer)
  - API catálogo: `src/lib/api/catalog.ts`, `src/lib/api/admin-*.ts`
  - Supabase: `src/lib/supabase/{client,server,admin}.ts` (admin es server-only)
  - Utilidades: `src/lib/utils/{product-publication,product-image-storage,category-hierarchy}.ts`
  - Scripts: `scripts/bsale-product-import/*`, `scripts/audit-web-product-images.mjs`, `scripts/import-product-images-batch.mjs`, `scripts/audit-bsale-commercial-state.mjs`
  - Migraciones: `supabase/migrations/` (13 archivos aplicados)
  - Seed demo: `supabase/scripts/202607_seed_demo_catalog_web_b2b.sql`

---

## 7. Seguridad y accesos

### Contratos de visibilidad

| Actor | Precio | Stock |
|---|---|---|
| Visitante público (anon) | Nunca | No ve stock exacto |
| Cliente logueado no aprobado | Nunca | No ve stock exacto |
| Cliente aprobado (`status='approved'` + `can_view_prices=true`) | Sí — LP COMERCIANTE, IVA incluido | Disponibilidad resumida (no cantidad) |
| Admin | Visible en panel interno futuro | Visible en panel interno futuro |

### Reglas de seguridad implementadas

1. **Service role key** solo server-side (`src/lib/supabase/admin.ts` con `server-only`).
2. **`BSALE_ACCESS_TOKEN`** solo server-side (`src/lib/bsale/client.ts` con `server-only`).
3. **RLS deny-by-default** en las 12 tablas de `web_b2b`; sin SELECT directo público a tablas base.
4. **Wrappers RPC públicas** (`public.web_b2b_get_public_*`) con `SECURITY DEFINER`, `search_path=''`; no devuelven precio, stock ni `bsale_variant_id`.
5. **RPC privada** `public.web_b2b_customer_get_product_commercial_state(p_company_id, p_product_id)` → jsonb; execute solo `authenticated`; sin sesión → `login_required`; no aprobado → `not_approved`; **no devuelve `quantity`**; no inventa precio/stock.
6. **RPCs admin** (`web_b2b_admin_*`) `SECURITY DEFINER`, `search_path=''`, revocadas a `public/anon`, ejecución solo `authenticated`; no acceden a precios/stock.
7. **Soft-delete obligatorio** (sin DELETE físico para roles de contenido).
8. **Multi-tenant por `company_id`** en todas las políticas.
9. **MFA:** flag `mfa_required=true` en admin, pero validación AAL2 **pendiente técnicamente** (no asumir MFA obligatorio aún).
10. **Sin `service_role` en frontend; sin `quantity` expuesta; sin hotlinks.**

---

## 8. Estado funcional actual

| Área | Estado |
|---|---|
| Catálogo público `/catalogo` | Operativo (wrapper `web_b2b_get_public_catalog_products`; 4 visibles; sin precio/stock) |
| Detalle de producto `/productos/[slug]` | Operativo; ficha piloto `100909` OK con aviso "Precio disponible para clientes aprobados" |
| Login `/login` | Operativo (Supabase Auth + Server Actions SSR); redirección por rol |
| Admin `/admin` | Operativo (validación de sesión + `admin_access`) |
| Admin productos | Listado con filtros/badges; edición con publicación segura (bloquea publicar si falta categoría/marca/imagen/nombre/slug/descripción) |
| Admin marcas | CRUD operativo (`BRIT`, `BRIT CARE` creadas) |
| Admin categorías | CRUD con jerarquía (`perros-alimento-humedo`, `perros-snacks-premios`, `gatos-alimento-seco`) |
| Importación Bsale | Dry-run segmentado (2×50) + apply controlado v1 (20) y v2 (50) ejecutados; panel de auditorías solo lectura |
| Imágenes | Storage operativo: upload individual, importación por URL, batch (4); 13 filas, 9 objetos, 12 con primaria |
| Publicación piloto | SKU `100909` publicado (único Bsale público) |
| Precios | `product_prices` = 0 (sin carga; bloqueada por fuente no confirmada) |
| Stock | `product_stock` = 0 (sin carga; disponibilidad propuesta `consult`) |
| RPC privada cliente aprobado | Aplicada y validada |
| Cliente Bsale read-only | Implementado en `client.ts` + script auditoría; **sin commit** |
| Script auditoría comercial | `scripts/audit-bsale-commercial-state.mjs` (dry-run read-only) |

---

## 9. Línea de tiempo de fases

Leyenda: **cerrado remoto** = commiteado y pusheado · **pendiente push** = commiteado local sin push · **en curso/sin commit**.

| Fase | Qué se hizo | Commit | Migración (aplicada en Supabase real) | Estado |
|---|---|---|---|---|
| Setup inicial | Base Next.js + base MYM | `ed03daf`, `c0956f9` (25/07) | — | cerrado remoto |
| Fase 1 — Schema `web_b2b` | 12 tablas, RLS deny-by-default | — | `202607_web_b2b_initial_schema.sql` | cerrado remoto |
| Fase 2 — RLS | 12 funciones RPC seguras, roles | `ed07358` (25/07) | `202607_web_b2b_access_policies.sql`, `202607_web_b2b_public_wrappers.sql` | cerrado remoto |
| Bootstrap admin | Primer `WEB_SUPER_ADMIN` controlado | — | (script directo) | cerrado remoto |
| Frontend público | Conexión a RPCs (SSR) | `faa1dd0` (25/07) | — | cerrado remoto |
| Login | Supabase Auth + Server Actions | `6862b57`, `cfdfd6c` (25/07) | — | cerrado remoto |
| Seed demo | 3 DEMO + 1 TEST | `b65bf43` (25/07) | `supabase/scripts/202607_seed_demo_catalog_web_b2b.sql` | cerrado remoto |
| Admin categorías/marcas | RPCs + CRUD (6A/6B) | `ebd1b7e`…`8c4fe7c` (26–28/07) | `202607_web_b2b_admin_catalog_support.sql`, `..._admin_categories_brands_rpcs.sql` | cerrado remoto |
| Admin productos | RPCs + UI listado/edición (6C) | `654ad6b`…`ab072de` (03/08) | `202607_web_b2b_admin_products_rpcs.sql` | cerrado remoto |
| Decisión: no crear productos manualmente | Bsale única fuente (6C.3A) | `7b9ab2b` (03/08) | — | cerrado remoto |
| Importación Bsale dry-run | Modelo control, planner, RPCs system, dry-run real | `58d9de6`…`2949716` (03/08) | `202607_web_b2b_bsale_product_import_control.sql`, `..._system_create_bsale_import_audit_rpc.sql`, `..._system_product_read_rpc.sql` | cerrado remoto |
| Apply 20 productos | Primer apply real 4→24 (6D.4) | `1bf98ac`…`c9bb35e` (03–04/08) | `20260804120000_web_b2b_controlled_bsale_product_apply.sql` | cerrado remoto |
| Auditoría imágenes WC | Dry-run CSV, imports controlados (6D.6) | `5e8fa95`…`252c198` (05/08) | — | cerrado remoto |
| Apply 50 productos | Batch v2, 24→74 (6D.7C) | `9825e27`, `1692c1d`, `5c7aec1` (05/08) | `20260805130000_web_b2b_bsale_product_apply_batch_v2.sql` | cerrado remoto |
| Importación imágenes batch | 4 imágenes high (6D.7E) | `be53a7d`, `d647fd7`, `3447843` (05/08) | — | cerrado remoto |
| Normalización comercial | Taxonomía mínima + 4 productos (6D.8) | `cb04456`…`0f57692` (05/08) | — | cerrado remoto |
| Publicación piloto SKU 100909 | 1 Bsale público (6D.8D) | `d83e6c9`, `d7b7682` (05/08) | — | cerrado remoto |
| Preflight precios/stock | Diseño proyección (6D.9A) | `ba1504b` (05/08) | — | cerrado remoto |
| RPC privada | Migración + aplicación (6D.9B/9C) | `2e2895e`, `892be92` (05/08) | `20260805140000_web_b2b_customer_product_commercial_state.sql` | cerrado remoto |
| Preflight carga piloto | Fuentes locales auditadas, sin carga (6D.9D-A) | `ba7a6c8` (05/08) | — | cerrado remoto (último push OK) |
| Auditoría fuente Bsale | LP COMERCIANTE oficial (6D.9E) | `ca04ec6` (06/08) | — | **pendiente push** |
| Identificación lista precio/stock | ID=4, endpoints (6D.9F) | **sin commit** | — | en curso |
| Investigación endpoints | Control positivo 557325 (6D.9G) | **sin commit** | — | en curso |
| Cliente Bsale read-only | Funciones + script (6D.9I) | **sin commit (código modificado)** | — | en curso |

---

## 10. Estado de productos y catálogo

### Conteos vigentes (validados 06/08)

| Métrica | Valor |
|---|---:|
| `web_b2b.products` | 74 |
| Productos Bsale reales | 70 (20 apply v1 + 50 apply v2) |
| Productos DEMO | 3 (DEMO-001/002/003, visibles) |
| Productos TEST | 1 (TEST-001, no visible) |
| Bsale publicados/expuestos | 1 (SKU `100909`) |
| Catálogo público (wrapper actual) | 4 (3 DEMO + 1 piloto) |
| Catálogo público (RPC paginada estricta) | 1 |
| `product_prices` / `product_stock` | 0 / 0 |
| `product_images` | 13 |
| Storage `product-images` | 9 objetos |
| Productos con imagen primaria | 12 |
| Variantes Bsale totales | 3.591 (200 analizadas = 5.57%) |

### Producto piloto publicado

| Campo | Valor |
|---|---|
| SKU | `100909` |
| product_id | `160c93e0-a76a-43d1-bd6d-014ff2465ebd` |
| company_id | `d1000000-0000-0000-0000-000000000001` |
| bsale_variant_id | `1494` (Bsale product `1072`) |
| Nombre web | BRIT CARE Cat Grain Free Senior Weight Control 2 kg |
| Estado | `published` / activo / visible / no destacado |
| Marca / Categoría | BRIT CARE / Alimento seco |
| Imagen primaria | Supabase Storage `product-images` |
| Precio/stock | 0 / 0 |

### Taxonomía creada

- Marcas: `BRIT` (`dfa7ec0c-5ab9-4417-9c24-e4591f854b6d`), `BRIT CARE` (`29333c92-ded6-4ea1-8d76-d60f6fd4ed08`).
- Categorías: `perros-alimento-humedo`, `perros-snacks-premios`, `gatos-alimento-seco`.
- Pendiente: confirmar especie/categoría de `100588`.

---

## 11. Estado de imágenes y contenido legacy

- **Origen real:** `https://amimascota.cl/wp-content/uploads/2023/12/…` (dominio legacy). **No aparece `mympremium.cl` en el CSV revisado.**
- **CSV WooCommerce local:** `local-data/wc-images-audit/wc-products-original-20260805.csv` (9.6 MB, 3.566 filas; 3.181 con SKU; 1.531 con imagen directa; 721 heredadas; 24 SKUs duplicados). Columnas: `SKU`, `Nombre`, `Tipo`, `Superior`, `Imágenes`, `Categorías`, `Descripción corta`, `Descripción`. **No commiteable** (excluido por `.git/info/exclude`).
- **Ejemplos de URLs:** `duck.jpg`, `pate.jpg`, `X_8595602529780default.jpg`, `Brit-Lets-Bite-Meat-Snacks-Duck-Fillets-80-gr-e1705557682868.jpg`, `100901-e1705558229218.jpg`, `weight-control-feline-cl.jpeg`.
- **Importado a Supabase Storage:** 13 filas `product_images`; 9 objetos en `product-images`; 12 productos con imagen primaria.
- **Ya usado:** dry-run CSV (1 directo / 6 heredados); importaciones controladas `101219`, `100909`, `101215`; cruce 70 productos (4 high directos, 9 medium heredados, 5 bloqueados por imagen existente); batch real `100583`, `100584`, `100588`, `101188`.
- **Pendiente legacy:** 52 productos Bsale sin match/imagen; 9 candidatos medium sin revisión visual (`101213`, `101216`, `101221`, `101222`, `100901`, `1231015`, `1231035`, `1232015`, `1232035`); descripciones legacy aún no migradas.
- **Limitación actual:** `product_images` no registra `source_url` / `source_type` / `source_domain` → falta trazabilidad del origen.
- **Recomendación:** agregar columnas de trazabilidad de imagen (URL origen, dominio, fecha de importación) en fase futura.

---

## 12. Estado de precios y stock

### Decisión vigente

- **No cargar precio ni stock** hasta tener fuente oficial validada (aprobado por Carlos).
- Disponibilidad segura actual: **`consult`** para productos sin datos.
- `price_candidate = null`, `stock_candidate = null` para el piloto `100909` (no se encontró precio/stock en Bsale para `LP COMERCIANTE`/stock actual).

### Modelo destino (`web_b2b`)

- **`product_prices`:** `product_id`, `company_id`, `price numeric(12,2)`, `currency CHECK = 'CLP'`, `source CHECK in ('bsale','manual','import')`, UNIQUE `(product_id, company_id, source)`, RLS (solo cliente aprobado vía helper + admin).
- **`product_stock`:** `product_id`, `company_id`, `quantity integer`, `status CHECK in ('in_stock','low_stock','out_of_stock','unknown')`, `source`, UNIQUE `(product_id, company_id, source)`, RLS (solo admin; sin policy cliente — la salida al cliente es por RPC privada).
- Brechas conocidas: sin `price_list_id`, sin vigencia, sin neto/bruto, sin `warehouse_id`/bodega.

### Arquitectura recomendada (proyección)

```
Bsale (LP COMERCIANTE + stocks.json)
  → sync controlado server-side
  → web_b2b.product_prices / product_stock (source='bsale')
  → RPC privada cliente aprobado
  → UI cliente aprobado
```

- Frecuencia: precio con sync programado/manual + auditoría; stock más frecuente. Nunca consulta Bsale por visita pública.

### Pilotos

| Piloto | Rol | Estado |
|---|---|---|
| **`100909` / variante `1494`** | Piloto de **publicación visual** | Publicado; único Bsale público; **sin precio/stock** (no devuelve datos en LP COMERCIANTE) |
| **`557325` / variante `6216`** (BELCANDO ADULT DINNER) | **Control positivo técnico** precio/stock | Precio `variantValueWithTaxes: 53900` · `quantityAvailable: 1` · debe evaluarse como nuevo piloto técnico |

---

## 13. Endpoints Bsale confirmados

| Ítem | Valor |
|---|---|
| Endpoint de precio | `GET /price_lists/{price_list_id}/details.json` (+ filtro `?variantid=`) |
| Endpoint de stock | `GET /stocks.json?variantid={variantId}` (por bodega/office) |
| `price_list_id` | `4` (`LP COMERCIANTE`) |
| Campo precio a mostrar | `variantValueWithTaxes` (IVA incluido; `variantValue` es neto) |
| Campo stock interno recomendado | `quantityAvailable` (también `quantity`, `quantityReserved`, `variant.id`, `office.id/name`) |
| Control positivo | `557325` / variante `6216` → precio **53900**, stock **1** |
| Piloto `100909` / variante `1494` | precio **count 0** · stock **count 0** |
| Interpretación | Diferencia de **datos**, no del endpoint/filtro |
| Rutas descartadas | `/variants/{id}/stock.json`, `stock_details.json`, `stocks.json` anidados → 404 |
| Base URL | `https://api.bsale.io/v1` (header `access_token` server-side) |

---

## 14. RPCs y contratos de visibilidad

### RPCs públicas (wrappers `public`)

- `web_b2b_get_public_catalog_products` — catálogo; expone por `is_active` + `is_visible` (no exige `review_status='published'`).
- `web_b2b_get_public_product_by_slug` — ficha pública.
- `web_b2b_get_public_catalog_products_paginated` — estricta: exige `review_status='published'`; `/catalogo` aún no la usa (migrar en fase separada).
- `web_b2b_get_current_admin_access` y otros wrappers de sesión/roles.
- **Ninguna devuelve precio, stock ni `bsale_variant_id`.**

### RPC privada (cliente aprobado)

```sql
public.web_b2b_customer_get_product_commercial_state(p_company_id uuid, p_product_id uuid)
returns jsonb
```

- `SECURITY DEFINER`, `search_path=''`, execute solo `authenticated`.
- Sin sesión → `login_required`; usuario no aprobado → `not_approved`; no expone `quantity`; con tablas vacías no inventa precio/stock.

### RPCs admin

- `web_b2b_admin_*` (categorías, marcas, productos, upsert, auditorías import): `SECURITY DEFINER`, `search_path=''`, solo `authenticated`, sin acceso a precios/stock.

### Helpers RLS

- `web_b2b.is_approved_customer_for_company(company_id)`
- `web_b2b.customer_can_view_prices_for_company(company_id)`
- `web_b2b.is_web_admin_for_company(company_id)`
- `web_b2b.is_web_super_admin_for_company(company_id)`
- `web_b2b.is_web_content_manager_for_company(company_id)`

---

## 15. Estado Git y commits pendientes

### Estado exacto (06/08/2026)

| Ítem | Valor |
|---|---|
| Rama | `main` |
| Último commit local | `ca04ec6` — `docs: record Bsale price and stock source audit` |
| `git rev-list --left-right --count HEAD...origin/main` | `1 0` |
| Push | `ca04ec6` **pendiente de push por bloqueo CONNECT tunnel 403** (evidencia indirecta en reporte 6D.9F: "push remoto sigue bloqueado por el error de red/HTTP anterior") |
| Último push exitoso | `ba7a6c8` (05/08) |
| Total commits | 65 |

### Cambios locales pendientes de commit

| Archivo | Tipo |
|---|---|
| `docs/PENDIENTES.md` | documentación (modificado) |
| `src/lib/bsale/client.ts` | código (modificado — cliente Bsale read-only) |
| `src/lib/bsale/types.ts` | código (modificado — tipos) |
| `docs/productos/REPORTE_IDENTIFICACION_LISTA_PRECIO_STOCK_BSALE_6D9F.md` | documentación (nuevo) |
| `docs/productos/REPORTE_INVESTIGACION_ENDPOINTS_BSALE_6D9G.md` | documentación (nuevo) |
| `docs/productos/REPORTE_CLIENTE_BSALE_READONLY_PRECIO_STOCK_6D9I.md` | documentación (nuevo) |
| `scripts/audit-bsale-commercial-state.mjs` | script (nuevo) |

### NO commitear

- `supabase/.temp/` (cache local de supabase CLI; no está en `.gitignore`).
- `local-data/` (CSVs y outputs locales; excluido por `.git/info/exclude`).
- `.env.local` y cualquier archivo `.env*` (ignorados; solo `!.env.example`).

---

## 16. Pendientes priorizados

### Alta

1. Resolver push pendiente (`ca04ec6`) — bloqueo CONNECT tunnel 403.
2. Consolidar commit agrupado (documentación 6D.9E/F/G/I + `PENDIENTES.md` + `client.ts` + `types.ts` + script auditoría).
3. Revisar/terminar cliente Bsale read-only (manejo de oficinas múltiples, paginación, errores).
4. Diseñar proyección Bsale → `web_b2b.product_prices` / `product_stock` (sync controlado).
5. Elegir piloto técnico `557325` (control positivo con precio 53.900 y stock 1).
6. Decidir si importar `557325` a `web_b2b` si no existe.
7. Limpiar DEMO antes de producción (3 DEMO visibles en catálogo público).

### Media

8. Adaptar UI cliente aprobado (precio + disponibilidad resumida solo a aprobados).
9. Migrar `/catalogo` a la RPC paginada estricta (`review_status='published'`).
10. Validación MFA AAL2 (pendiente técnico).
11. Migrar contenido legacy (descripciones; revisión de 9 candidatos heredados; 52 sin match).
12. Trazabilidad de imágenes (`source_url`/`source_type`/`source_domain`).
13. Confirmar actividad real de `LP COMERCIANTE` (state=0 observado) y lista activa correcta.

### Futuro

14. Sync recurrente Bsale (jobs; sin consulta Bsale por visita).
15. Listas de precios diferenciadas (`price_lists`, `customer_price_lists`, `price_list_id`).
16. Pedidos/compra (`can_create_orders`); pagos fuera del MVP.
17. Deploy staging (Railway/Vercel) y producción.
18. Eliminar wrappers públicas si Supabase expone `web_b2b` por REST.
19. Consolidación de stock por bodega y política de `low_stock`.

---

## 17. Riesgos conocidos

1. **Push bloqueado (403):** 1 commit acumulado; riesgo de divergencia y conflicto.
2. **Commits locales acumulados:** crecen sin push.
3. **Usar producto sin precio como piloto** (`100909`): no valida cadena completa → usar `557325`.
4. **Exponer precio por RPC pública:** riesgo si se modifica una wrapper accidentalmente.
5. **Mostrar stock exacto:** prohibido; mitigado en RPC privada.
6. **Usar costo como precio:** prohibido (costo local = 0).
7. **Usar historial de ventas como precio vigente:** prohibido.
8. **Depender de WordPress legacy:** URLs de amimascota.cl pueden fallar; no hotlinkear.
9. **Hotlinks:** prohibidos; importar server-side a Storage.
10. **Stock por bodega mal consolidado:** `stocks.json` devuelve filas por `office`; consolidar solo oficinas válidas.
11. **Lista `LP COMERCIANTE` con state=0:** riesgo de lista no activa.
12. **Micro-commits/push excesivos:** regla de agrupar por hitos.

---

## 18. Reglas de trabajo

1. **No commit/push por microcambio** — agrupar por hitos relevantes.
2. **Validación proporcional** al impacto.
3. **Documentación puede acumularse.**
4. **Código/migraciones requieren lint/build** (`npm run lint`, `npm run build`).
5. **Datos reales requieren secuencia:** preflight → ejecución → validación → documentación.
6. **No `db push` / `db pull` / `migration repair`** — usar `db query --linked --file` para SQL puntual aprobado.
7. **No `git add .`** ni **`git add -A`** — staging selectivo.
8. **No force push.**
9. **No secretos** — nunca exponer `BSALE_ACCESS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, claves de `.env.local`.
10. **No tocar WordPress/WooCommerce/cPanel** salvo lectura explícita.
11. No llamar Bsale sin necesidad real; no llamar RPC apply sin fase aprobada; no inventar precios/stock.

---

## 19. Próxima ruta recomendada

1. **Cierre/commit agrupado:** documentación 6D.9E/F/G/I + `PENDIENTES.md` + `client.ts` + `types.ts` + `scripts/audit-bsale-commercial-state.mjs`; reintento de push (validar si el bloqueo CONNECT tunnel 403 fue transitorio).
2. **Confirmación operacional `LP COMERCIANTE`:** validar con Carlos si `price_list_id=4` es la lista activa correcta y su estado.
3. **Proyección Bsale price/stock:** dry-run del sync controlado Bsale → `web_b2b.product_prices` / `product_stock` (`price_lists/4/details` + `stocks.json` consolidado por oficinas válidas).
4. **Prueba piloto técnica con `557325`** (variante `6216`): importar producto si no existe → proyectar precio 53.900 / stock → validar cadena completa.
5. **Validación RPC cliente aprobado** con sesión real aprobada: precio visible, disponibilidad resumida, sin `quantity`.
6. **UI cliente aprobado:** precio + disponibilidad para aprobados; bloqueo para público/pendiente; migrar `/catalogo` a RPC paginada estricta.
7. **Migración contenido legacy:** descripciones WooCommerce; revisión/importación de 9 candidatos medium; trazabilidad de imágenes.
8. **Limpieza DEMO/TEST** y publicación controlada de los 70 productos Bsale normalizados.
9. **Producción:** staging (Railway/Vercel) → sync recurrente Bsale → corte del portal B2B.

---

## 20. Dudas abiertas

1. ¿`price_list_id=4` es la lista activa correcta para operación? (state=0 observado).
2. ¿Por qué `100909`/variante `1494` no tiene precio/stock en `LP COMERCIANTE`? ¿Se carga en Bsale o se descarta como piloto?
3. ¿Se aprueba `557325` como piloto técnico? ¿Se importa a `web_b2b` si no existe?
4. ¿Precio B2B siempre con IVA incluido en UI para todos los aprobados?
5. ¿Stock consolidado o por bodega? ¿Qué oficinas/sucursales cuentan como válidas?
6. ¿Umbral de `low_stock` ("Pocas unidades")?
7. ¿`can_create_orders` será requisito para ver precios o solo para comprar?
8. ¿Cuándo limpiar los 3 DEMO y el TEST del catálogo público?
9. ¿Se autoriza importación de las 9 imágenes heredadas medium tras revisión visual?
10. ¿Descripciones legacy de WooCommerce se migran automáticamente o solo normalización manual?
11. ¿MFA AAL2 debe ser bloqueante para admins en esta fase?
12. ¿El sync Bsale será job programado, manual admin, o ambos? ¿Frecuencia precio vs stock?
13. ¿Se requiere pedido/compra en el MVP o solo catálogo+precios?
14. ¿Hay un CSV WooCommerce más reciente que el de 05/08?
15. ¿El bloqueo de push es transitorio (red/proxy) o una política que impide pushes?

---

## 21. Prompt corto para retomar el proyecto

Copia y pega el siguiente bloque en un nuevo chat/agente para continuar:

```text
Proyecto: MYM Web B2B — portal B2B de MYM Distribuidora (Next.js + Supabase + Bsale).
Ubicación: repositorio local /Users/carlosalegria/Desktop/mym-b2b-web (rama main, origin CarlosATO/mym-b2b-web.git).
Contexto: leer primero docs/CONTEXTO_MAESTRO_WEB_B2B_MYM.md y docs/PENDIENTES.md.
NO tocar: WordPress/WooCommerce/cPanel, Bsale (salvo lectura aprobada), Storage/imágenes, productos,
precios/stock (no insertar), frontend fuera de lo pedido, supabase/.temp/, local-data/.
NO usar: db push/db pull/migration repair, git add ., git add -A, force push, commit o push sin autorización.
Sin secretos: nunca imprimir BSALE_ACCESS_TOKEN ni SUPABASE_SERVICE_ROLE_KEY ni contenido de .env.local.
Estado actual (06/08/2026): catálogo público sin precios (4 visibles: 3 DEMO + 1 piloto SKU 100909);
74 productos (70 Bsale reales draft); product_prices y product_stock vacíos; RPC privada de cliente aprobado
aplicada; cliente Bsale read-only implementado sin commit; commit ca04ec6 pendiente de push por bloqueo
CONNECT tunnel 403; cambios locales: docs/PENDIENTES.md, src/lib/bsale/client.ts, src/lib/bsale/types.ts,
3 reportes 6D.9F/6D.9G/6D.9I y scripts/audit-bsale-commercial-state.mjs.
Bsale: LP COMERCIANTE = price_list_id 4; precio = GET /price_lists/4/details.json?variantid={id}
(campo variantValueWithTaxes, IVA incluido, CLP); stock = GET /stocks.json?variantid={id}
(campo quantityAvailable, consolidar por oficinas válidas); control positivo 557325/variante 6216
(precio 53900, stock 1); piloto 100909/variante 1494 sin precio ni stock en Bsale.
Reglas: agrupar commits por hitos; datos reales requieren preflight → ejecución → validación → documentación;
código/migraciones requieren npm run lint y npm run build; SQL puntual solo con db query --linked --file.
Próxima tarea recomendada:
1) preparar (sin ejecutar) el commit agrupado documental+código de los cambios listados y validar si el
bloqueo de push se resolvió; 2) confirmar con Carlos la lista activa LP COMERCIANTE; 3) diseñar dry-run
de proyección Bsale → web_b2b.product_prices/product_stock; 4) evaluar 557325 como piloto técnico.
Empieza leyendo los documentos de contexto y reporta tu plan antes de tocar código.
```
