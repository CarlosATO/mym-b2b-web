# Reporte Normalizacion Comercial Inicial (Fase 6D.8B-C)

## Objetivo

Aplicar normalizacion comercial inicial a 4 productos Bsale con imagen y taxonomia clara, manteniendolos como borradores seguros.

Normalizar no significa publicar. Ningun producto quedo activo, visible, destacado ni publicado.

## Metodo Usado

Se uso el mecanismo admin seguro existente:

- RPC `public.web_b2b_admin_upsert_product`.
- Validacion de acceso admin mediante `web_b2b.check_admin_access`.
- Relaciones de marca/categoria validadas por la RPC.
- Slugs y unicidad validados por la RPC.
- Auditoria administrativa generada por la RPC.

Ejecucion operativa:

- Se invoco la RPC admin para los 4 productos autorizados.
- No se hizo `UPDATE` directo sobre tablas.
- No se llamo RPC apply de productos Bsale.
- No se modificaron `product_prices`, `product_stock`, `product_images` ni Storage.
- Se paso `p_primary_image_url = null` para no tocar `web_b2b.product_images`.

## Precheck

Conteos previos validados con SELECTs de solo lectura:

| Metrica | Valor |
|---------|------:|
| `web_b2b.products` | 74 |
| Productos Bsale reales | 70 |
| Productos Bsale publicados/expuestos | 0 |
| `product_prices` | 0 |
| `product_stock` | 0 |
| `product_images` | 13 |
| Storage `product-images` | 9 |
| SKUs objetivo encontrados | 4 |
| SKUs objetivo con imagen primaria | 4 |
| SKUs objetivo en estado seguro | 4 |
| Public count lote | 0 |
| Public slug count lote | 0 |

Taxonomia objetivo validada:

| Tipo | Nombre | ID | Slug | Activa | Visible catalogo |
|------|--------|----|------|--------|------------------|
| Marca | BRIT | `dfa7ec0c-5ab9-4417-9c24-e4591f854b6d` | `brit` | si | n/a |
| Marca | BRIT CARE | `29333c92-ded6-4ea1-8d76-d60f6fd4ed08` | `brit-care` | si | n/a |
| Categoria | Alimento humedo | `f136bb31-8b6f-440e-9442-b7361a02e70e` | `perros-alimento-humedo` | si | si |
| Categoria | Snacks y premios | `d785e101-d67f-4103-b214-db264dfa3592` | `perros-snacks-premios` | si | si |
| Categoria | Alimento seco | `64346055-e5c6-40d9-b159-7a9a46ab5e95` | `gatos-alimento-seco` | si | si |

## Productos Normalizados

| SKU | product_id | Nombre final | Slug final | Marca | Categoria | Estado |
|-----|------------|--------------|------------|-------|-----------|--------|
| `100583` | `52fdf695-2c9d-4425-a843-6c08dae31b04` | BRIT Lata Paté & Meat Duck 400 g | `brit-lata-pate-meat-duck-400g` | BRIT | Alimento humedo | draft/inactivo/no visible/no destacado/pending |
| `100584` | `2d503986-85d5-4217-bf9b-307c3dde82ed` | BRIT Lata Paté & Meat Puppy 400 g | `brit-lata-pate-meat-puppy-400g` | BRIT | Alimento humedo | draft/inactivo/no visible/no destacado/pending |
| `101188` | `dab271c7-83bf-45c0-82b3-bd5caadf6c0b` | BRIT CARE Let's Bite Duck Fillets 80 g | `brit-care-lets-bite-duck-fillets-80g` | BRIT CARE | Snacks y premios | draft/inactivo/no visible/no destacado/pending |
| `100909` | `160c93e0-a76a-43d1-bd6d-014ff2465ebd` | BRIT CARE Cat Grain Free Senior Weight Control 2 kg | `brit-care-cat-grain-free-senior-weight-control-2kg` | BRIT CARE | Alimento seco | draft/inactivo/no visible/no destacado/pending |

## Campos Aplicados

### SKU 100583

- `brand_id`: `dfa7ec0c-5ab9-4417-9c24-e4591f854b6d`
- `category_id`: `f136bb31-8b6f-440e-9442-b7361a02e70e`
- `short_description`: presente.
- `description`: presente.
- `seo_title`: `BRIT Lata Paté Duck 400 g para perros`
- `seo_description`: presente.

### SKU 100584

- `brand_id`: `dfa7ec0c-5ab9-4417-9c24-e4591f854b6d`
- `category_id`: `f136bb31-8b6f-440e-9442-b7361a02e70e`
- `short_description`: presente.
- `description`: presente.
- `seo_title`: `BRIT Lata Paté Puppy 400 g para cachorros`
- `seo_description`: presente.

### SKU 101188

- `brand_id`: `29333c92-ded6-4ea1-8d76-d60f6fd4ed08`
- `category_id`: `d785e101-d67f-4103-b214-db264dfa3592`
- `short_description`: presente.
- `description`: presente.
- `seo_title`: `BRIT CARE Let's Bite Duck Fillets 80 g`
- `seo_description`: presente.

### SKU 100909

- `brand_id`: `29333c92-ded6-4ea1-8d76-d60f6fd4ed08`
- `category_id`: `64346055-e5c6-40d9-b159-7a9a46ab5e95`
- `short_description`: presente.
- `description`: presente.
- `seo_title`: `BRIT CARE Cat Senior Weight Control 2 kg`
- `seo_description`: presente.

## Validacion Posterior

Conteos despues de aplicar:

| Metrica | Antes | Despues |
|---------|------:|--------:|
| `web_b2b.products` | 74 | 74 |
| Productos Bsale reales | 70 | 70 |
| Productos Bsale publicados/expuestos | 0 | 0 |
| `product_prices` | 0 | 0 |
| `product_stock` | 0 | 0 |
| `product_images` | 13 | 13 |
| Storage `product-images` | 9 | 9 |
| Productos normalizados | 0 | 4 |
| Normalizados con campos comerciales completos | 0 | 4 |
| Public count lote | 0 | 0 |
| Public slug count lote | 0 | 0 |

Los 4 productos normalizados tienen:

- `brand_id` correcto.
- `category_id` correcto.
- `short_description` presente.
- `description` presente.
- `seo_title` presente.
- `seo_description` presente.
- Slug correcto.
- 1 imagen primaria existente.
- `review_status = draft`.
- `is_active = false`.
- `is_visible = false`.
- `is_featured = false`.
- `bsale_sync_status = pending`.
- `public_count = 0`.
- `public_slug_count = 0`.

## SKU 100588

El SKU `100588` queda pendiente por confirmacion humana de especie/categoria.

Estado validado:

- `brand_id = null`.
- `category_id = null`.
- `short_description = null`.
- `description = null`.
- `seo_title = null`.
- `seo_description = null`.
- Sigue `review_status = draft`.
- Sigue inactivo/no visible/no destacado.
- Tiene 1 imagen primaria.
- No fue normalizado en esta fase.

## Seguridad

- No se publicaron productos.
- No se modificaron productos fuera de los 4 SKUs autorizados.
- No se crearon productos.
- No se borraron productos.
- No se tocaron precios.
- No se toco stock.
- No se importaron ni subieron imagenes.
- No se modifico Storage.
- No se llamo Bsale.
- No se llamo RPC apply de productos Bsale.
- No se uso `db push`, `db pull` ni `migration repair`.
- No se toco WordPress/WooCommerce/cPanel.

## Siguiente Paso Recomendado

6D.8D: publicacion piloto controlada de 1 producto normalizado, cuando Carlos apruebe.

Condicion: antes de publicar debe mantenerse la validacion de publicacion segura y confirmar explicitamente producto, visibilidad y estado final.
