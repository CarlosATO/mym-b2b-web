# Reporte Preflight Taxonomia Minima (Fase 6D.8B-B1)

## Objetivo

Preparar el diseno exacto de la taxonomia minima necesaria para normalizar comercialmente 4 productos del lote inicial y dejar 1 producto pendiente de confirmacion humana.

Esta fase no crea marcas, no crea categorias, no modifica productos, no publica productos, no toca precios, no toca stock, no importa imagenes y no modifica Storage.

## Contexto

Bsale es la fuente oficial de productos. La web B2B complementa esos productos con curacion comercial:

- Imagen.
- Marca y categoria web.
- Descripcion.
- SEO.
- Publicacion controlada.

El objetivo posterior es que los productos sincronizados desde Bsale queden como borradores seguros y luego el admin complete la curacion antes de publicar.

## Precheck

Estado Git inicial:

```text
?? supabase/.temp/
```

Conteos validados con SELECTs de solo lectura:

| Metrica | Valor |
|---------|------:|
| `web_b2b.products` | 74 |
| Productos Bsale reales | 70 |
| Productos Bsale publicados/expuestos | 0 |
| `product_prices` | 0 |
| `product_stock` | 0 |
| `product_images` | 13 |
| Storage `product-images` | 9 |

## Estructura de Marcas

Columnas reales de `web_b2b.brands`:

- `id uuid`
- `company_id uuid`
- `name text`
- `slug text`
- `logo_url text`
- `is_active boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

Constraints e indices relevantes:

- `brands_pkey`: primary key en `id`.
- `brands_company_id_slug_key`: unique por `(company_id, slug)`.
- `idx_brands_name_trgm`: indice trigram para busqueda por nombre.

Observaciones:

- `brands` no tiene `is_visible`.
- `brands` no tiene `order_index`.
- El slug se valida desde RPC admin con formato `^[a-z0-9]+(-[a-z0-9]+)*$`.

### Marcas Existentes

| brand_id | Marca | Slug | Activa | Visible | order_index |
|----------|-------|------|--------|---------|-------------|
| `b0b66bcc-74b1-4c97-8257-387564643567` | BRACCO | `bracco` | si | n/a | n/a |
| `097fd590-4a8c-4c9f-83a5-a89a19faff06` | DEMO MYM | `demo-mym` | si | n/a | n/a |
| `0b02b3e1-d547-4043-9dce-bb9d008724c6` | Royal Canin. | `royal-canin` | si | n/a | n/a |

No existen:

- `BRIT` / `brit`
- `BRIT CARE` / `brit-care`

## Propuesta de Marcas Nuevas

| Marca | Slug | is_active | is_visible | order_index | Uso | Observacion |
|-------|------|-----------|------------|-------------|-----|-------------|
| BRIT | `brit` | true | n/a | n/a | `100583`, `100584` y, si se confirma especie, `100588` | Requerida para productos BRIT LATA. |
| BRIT CARE | `brit-care` | true | n/a | n/a | `101188`, `100909` | Requerida para productos BRIT CARE. |

No se propone `order_index` porque la tabla `web_b2b.brands` no lo soporta actualmente.

## Estructura de Categorias

Columnas reales de `web_b2b.categories`:

- `id uuid`
- `company_id uuid`
- `parent_id uuid`
- `name text`
- `slug text`
- `is_active boolean`
- `created_at timestamptz`
- `updated_at timestamptz`
- `description text`
- `image_url text`
- `banner_image_url text`
- `display_style text`
- `icon_name text`
- `seo_title text`
- `seo_description text`
- `is_visible_home boolean`
- `is_visible_catalog boolean`
- `order_index integer`

Constraints e indices relevantes:

- `categories_pkey`: primary key en `id`.
- `categories_company_id_slug_key`: unique por `(company_id, slug)`.
- `categories_parent_id_fkey`: `parent_id` referencia `web_b2b.categories(id)`.
- `chk_categories_display_style`: valores permitidos `grid`, `list`, `banner`, `hidden`.
- `idx_categories_company_parent`: busqueda por compania y padre.
- `idx_categories_is_visible_home` y `idx_categories_is_visible_catalog`.
- `idx_categories_order_index`.
- `idx_categories_slug`.
- `idx_categories_name_trgm`.

La RPC admin valida:

- Nombre y slug obligatorios.
- Slug en minusculas, numeros y guiones.
- `display_style` permitido.
- Slug unico por compania.
- Parent existente dentro de la misma compania.
- Sin ciclos jerarquicos.
- Registro en `web_b2b.admin_audit_logs`.

## Categorias Existentes Relevantes

| category_id | Categoria | Slug | Parent | Nivel | Activa | Visible catalogo | Visible home | order_index |
|-------------|-----------|------|--------|-------|--------|------------------|--------------|------------:|
| `676d20a3-a14c-434c-b4a8-cb3fccd9c709` | Perros | `perros` | - | padre | si | si | si | 1 |
| `86eac6cc-14c0-4438-a7e4-1de2c7500347` | Alimentos para perros | `alimentos-para-perros` | Perros | hija | si | si | si | 10 |
| `2b8766a2-3a35-43df-a731-7be6d3654b67` | Gatos | `gatos` | - | padre | si | si | si | 2 |
| `8e33de7f-ee6a-4da6-b464-e8f55e37016c` | Alimentos para gatos | `alimentos-para-gatos` | Gatos | hija | si | si | si | 20 |
| `624aaabd-7414-4c71-a179-dbf0990715fd` | Accesorios | `accesorios` | - | padre | si | si | no | 10 |
| `c223f786-7ac4-4490-bbb7-1626e4501a56` | Transportadoras | `transportadoras` | Accesorios | hija | si | si | no | 10 |

Tambien existe `Alimentos Demo`, que no debe usarse para productos reales Bsale.

IDs padres confirmados:

- `Perros`: `676d20a3-a14c-434c-b4a8-cb3fccd9c709`
- `Gatos`: `2b8766a2-3a35-43df-a731-7be6d3654b67`
- `Alimentos para perros`: `86eac6cc-14c0-4438-a7e4-1de2c7500347`
- `Alimentos para gatos`: `8e33de7f-ee6a-4da6-b464-e8f55e37016c`

## Propuesta de Categorias Nuevas

| Categoria | Slug | Parent propuesto | parent_id | is_active | is_visible_home | is_visible_catalog | order_index | Uso |
|-----------|------|------------------|-----------|-----------|-----------------|--------------------|------------:|-----|
| Alimento humedo | `perros-alimento-humedo` | Perros > Alimentos para perros | `86eac6cc-14c0-4438-a7e4-1de2c7500347` | true | false | true | 10 | `100583`, `100584` |
| Snacks y premios | `perros-snacks-premios` | Perros | `676d20a3-a14c-434c-b4a8-cb3fccd9c709` | true | false | true | 20 | `101188` |
| Alimento seco | `gatos-alimento-seco` | Gatos > Alimentos para gatos | `8e33de7f-ee6a-4da6-b464-e8f55e37016c` | true | false | true | 10 | `100909` |

Valores comunes sugeridos:

- `display_style = grid`
- `image_url = null`
- `banner_image_url = null`
- `icon_name = null`
- `seo_title`: completar sobrio en fase de creacion real.
- `seo_description`: completar sobrio en fase de creacion real.

## SKUs por Taxonomia

| SKU | Producto | Marca futura | Categoria futura | Estado |
|-----|----------|--------------|------------------|--------|
| `100583` | BRIT LATA PATE Y MEAT DUCK 400GR | BRIT | Perros > Alimentos para perros > Alimento humedo | Preparado |
| `100584` | BRIT LATA PATE Y MEAT PUPPY 400GR | BRIT | Perros > Alimentos para perros > Alimento humedo | Preparado |
| `101188` | BRIT CARE LETS BITE SNACKS DUCK FILLETS 80GR | BRIT CARE | Perros > Snacks y premios | Preparado |
| `100909` | BRIT CARE CAT GR. FREE SENIOR WEIGHT CONTROL 2KG | BRIT CARE | Gatos > Alimentos para gatos > Alimento seco | Preparado |
| `100588` | BRIT LATA MONO PROTEIN TURKEY 400GR | BRIT, pendiente | Categoria pendiente | Pendiente de confirmacion humana de especie/categoria |

## Mecanismos Existentes

Se revisaron:

- `src/app/actions/admin-brands.ts`
- `src/app/actions/admin-categories.ts`
- `src/lib/api/admin-catalog.ts`
- `supabase/migrations/202607_web_b2b_admin_categories_brands_rpcs.sql`
- Paginas `/admin/marcas` y `/admin/categorias`.

Mecanismos disponibles:

- UI admin de marcas y categorias.
- Server Actions.
- RPCs admin:
  - `public.web_b2b_admin_upsert_brand`
  - `public.web_b2b_admin_upsert_category`

Las RPCs:

- Son `SECURITY DEFINER`.
- Validan acceso con `web_b2b.check_admin_access`.
- Revocan `public` y `anon`.
- Conceden ejecucion a `authenticated`.
- Validan slug y duplicados.
- Registran auditoria en `web_b2b.admin_audit_logs`.

## Recomendacion para 6D.8B-B2

Recomendacion principal: crear la taxonomia minima desde UI admin, manualmente por Carlos.

Motivos:

- Usa el flujo existente y probado de admin.
- Respeta Server Actions y RPCs controladas.
- Registra auditoria.
- No requiere SQL directo ni migracion.
- Permite revisar nombres/slugs antes de guardar.

Alternativa tecnica: usar RPC/admin action controlada si Carlos necesita trazabilidad exacta de argumentos y resultados. No se recomienda SQL directo para esta fase salvo que la UI falle o se requiera una correccion estructural.

## Impacto Esperado de Crear Taxonomia

Crear estas marcas/categorias:

- No publica productos.
- No modifica productos.
- No toca precios.
- No toca stock.
- No toca imagenes.
- No modifica Storage.
- No expone productos Bsale en catalogo publico.
- Solo habilita la normalizacion comercial posterior.

## Riesgos y Decisiones Pendientes

- Confirmar si `BRIT` y `BRIT CARE` deben existir como marcas separadas.
- Confirmar nombres definitivos:
  - `Alimento humedo` vs `Latas y conservas`.
  - `Snacks y premios` vs `Premios`.
  - `Alimento seco`.
- Confirmar si `100588` corresponde a perro, gato o ambos antes de asignar categoria.
- Evitar usar `Alimentos Demo` para productos reales.
- Mantener todos los productos en estado seguro hasta que exista una fase explicita de publicacion.

## Alcance Ejecutado

- SELECTs de solo lectura.
- Revision de estructura, constraints, indices, Server Actions, RPCs y UI admin.
- Documentacion de taxonomia minima propuesta.
- Sin SQL de modificacion.
- Sin `db push`, `db pull` ni `migration repair`.
- Sin Bsale.
- Sin RPC apply.
- Sin productos modificados/publicados.
- Sin marcas/categorias creadas o modificadas.
- Sin imagenes subidas/importadas.
- Sin Storage modificado.
- Sin precios/stock.
- Sin WordPress/WooCommerce/cPanel.
