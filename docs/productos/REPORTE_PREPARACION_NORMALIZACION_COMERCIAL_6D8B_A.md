# Reporte Preparacion Normalizacion Comercial (Fase 6D.8B-A)

## Objetivo

Preparar la normalizacion comercial de un lote inicial de 5 productos Bsale con imagen primaria, sin modificar productos, marcas, categorias, precios, stock, Storage ni estado de publicacion.

Esta fase deja una propuesta lista para revision de Carlos antes de aplicar cambios reales.

## Contexto

Bsale es la fuente oficial de productos. La web B2B complementa esos productos con curacion comercial:

- Imagen.
- Marca y categoria web.
- Descripcion corta.
- Descripcion larga.
- SEO title.
- SEO description.
- Visibilidad y publicacion controlada.

Los productos nuevos creados en Bsale deben sincronizarse hacia la web como borradores seguros. Luego el admin web completa imagen y curacion antes de publicar.

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
| `product_images` | 13 |
| Storage `product-images` | 9 |
| `product_prices` | 0 |
| `product_stock` | 0 |
| Productos Bsale publicados/expuestos | 0 |
| SKUs objetivo encontrados | 5 |
| SKUs objetivo distintos | 5 |
| SKUs objetivo con imagen primaria | 5 |
| SKUs objetivo en estado seguro | 5 |
| Public count lote | 0 |
| Public slug count lote | 0 |

Los 5 productos del lote:

- Existen una sola vez.
- Tienen 1 imagen primaria.
- Siguen `review_status = draft`.
- Siguen `is_active = false`.
- Siguen `is_visible = false`.
- Siguen `is_featured = false`.
- Tienen `bsale_sync_status = pending`.
- No aparecen en catalogo publico.

## Productos del Lote

| SKU | product_id | Variante Bsale | Nombre actual | Slug actual | Imagen primaria | Estado |
|-----|------------|----------------|---------------|-------------|-----------------|--------|
| `100583` | `52fdf695-2c9d-4425-a843-6c08dae31b04` | `1552` | BRIT LATA PATE Y MEAT DUCK 400GR | `brit-lata-pate-y-meat-duck-400gr` | si | draft/inactivo/no visible/no destacado/pending |
| `100584` | `2d503986-85d5-4217-bf9b-307c3dde82ed` | `1551` | BRIT LATA PATE Y MEAT PUPPY 400GR | `brit-lata-pate-y-meat-puppy-400gr` | si | draft/inactivo/no visible/no destacado/pending |
| `100588` | `ffb60504-e85f-4d51-b2e3-b98751a99d62` | `1550` | BRIT LATA MONO PROTEIN TURKEY 400GR | `brit-lata-mono-protein-turkey-400gr` | si | draft/inactivo/no visible/no destacado/pending |
| `100909` | `160c93e0-a76a-43d1-bd6d-014ff2465ebd` | `1494` | BRIT CARE CAT GR. FREE SENIOR WEIGHT CONTROL 2KG | `brit-care-cat-gr-free-senior-weight-control-2kg` | si | draft/inactivo/no visible/no destacado/pending |
| `101188` | `dab271c7-83bf-45c0-82b3-bd5caadf6c0b` | `1556` | BRIT CARE LETS BITE SNACKS DUCK FILLETS 80GR | `brit-care-lets-bite-snacks-duck-fillets-80gr` | si | draft/inactivo/no visible/no destacado/pending |

## Taxonomia Existente

### Marcas

| brand_id | Marca | Slug | Activa | Visible |
|----------|-------|------|--------|---------|
| `b0b66bcc-74b1-4c97-8257-387564643567` | BRACCO | `bracco` | si | n/a |
| `097fd590-4a8c-4c9f-83a5-a89a19faff06` | DEMO MYM | `demo-mym` | si | n/a |
| `0b02b3e1-d547-4043-9dce-bb9d008724c6` | Royal Canin. | `royal-canin` | si | n/a |

No existen marcas `BRIT` ni `BRIT CARE`.

### Categorias

| category_id | Categoria | Slug | Parent | Nivel | Activa | Visible |
|-------------|-----------|------|--------|-------|--------|---------|
| `624aaabd-7414-4c71-a179-dbf0990715fd` | Accesorios | `accesorios` | - | padre | si | n/a |
| `c223f786-7ac4-4490-bbb7-1626e4501a56` | Transportadoras | `transportadoras` | Accesorios | hija | si | n/a |
| `7b5db6c9-f04b-423d-a5f6-cf38a7835b5f` | Alimentos Demo | `alimentos-demo` | - | padre | si | n/a |
| `2b8766a2-3a35-43df-a731-7be6d3654b67` | Gatos | `gatos` | - | padre | si | n/a |
| `8e33de7f-ee6a-4da6-b464-e8f55e37016c` | Alimentos para gatos | `alimentos-para-gatos` | Gatos | hija | si | n/a |
| `676d20a3-a14c-434c-b4a8-cb3fccd9c709` | Perros | `perros` | - | padre | si | n/a |
| `86eac6cc-14c0-4438-a7e4-1de2c7500347` | Alimentos para perros | `alimentos-para-perros` | Perros | hija | si | n/a |

No existen subcategorias especificas para:

- Alimento humedo.
- Latas / conservas.
- Alimento seco.
- Snacks / premios.

## Brechas Taxonomicas

- Falta marca `BRIT`.
- Falta marca `BRIT CARE`.
- Para un catalogo mas claro, conviene crear subcategorias hijas antes de aplicar normalizacion fina:
  - `Perros > Alimento humedo`
  - `Perros > Snacks y premios`
  - `Gatos > Alimento seco`
- Si Carlos prefiere una primera normalizacion mas simple, se pueden usar las categorias existentes:
  - `Perros > Alimentos para perros`
  - `Gatos > Alimentos para gatos`

## Propuesta Comercial por Producto

### SKU 100583

| Campo | Propuesta |
|-------|-----------|
| Nombre sugerido | BRIT Pate & Meat Duck 400 g |
| Slug sugerido | `brit-pate-meat-duck-400g` |
| Marca sugerida | BRIT |
| Categoria principal | Perros |
| Subcategoria sugerida | Alimento humedo / Latas |
| Short description | Alimento humedo Brit en formato lata de 400 g, con pato como sabor principal. |
| Description | Presentacion en lata de 400 g para complementar la oferta de alimento humedo para perros. Su nombre comercial identifica sabor duck y linea Pate & Meat. Revisar etiqueta antes de publicar para completar composicion y etapa recomendada si corresponde. |
| SEO title | BRIT Pate & Meat Duck 400 g |
| SEO description | Lata Brit Pate & Meat Duck de 400 g para perros. Producto en borrador pendiente de revision comercial antes de publicacion. |
| Observaciones/riesgos | No afirmar composicion nutricional ni etapa de vida sin etiqueta. |
| Viabilidad | `B. needs_taxonomy_creation` |

### SKU 100584

| Campo | Propuesta |
|-------|-----------|
| Nombre sugerido | BRIT Pate & Meat Puppy 400 g |
| Slug sugerido | `brit-pate-meat-puppy-400g` |
| Marca sugerida | BRIT |
| Categoria principal | Perros |
| Subcategoria sugerida | Alimento humedo / Latas |
| Short description | Alimento humedo Brit en lata de 400 g, identificado para cachorro. |
| Description | Producto Brit en formato lata de 400 g para la linea Puppy. Mantener redaccion sobria hasta confirmar detalle de composicion y recomendaciones de uso desde etiqueta o ficha oficial. |
| SEO title | BRIT Pate & Meat Puppy 400 g |
| SEO description | Lata Brit Pate & Meat Puppy de 400 g. Producto con imagen primaria, pendiente de curacion y revision antes de publicacion. |
| Observaciones/riesgos | No prometer beneficios de crecimiento ni salud sin informacion tecnica. |
| Viabilidad | `B. needs_taxonomy_creation` |

### SKU 100588

| Campo | Propuesta |
|-------|-----------|
| Nombre sugerido | BRIT Mono Protein Turkey 400 g |
| Slug sugerido | `brit-mono-protein-turkey-400g` |
| Marca sugerida | BRIT |
| Categoria principal | Perros o Gatos, pendiente de confirmar |
| Subcategoria sugerida | Alimento humedo / Latas |
| Short description | Alimento humedo Brit Mono Protein Turkey en formato lata de 400 g. |
| Description | Presentacion Brit Mono Protein Turkey de 400 g. Antes de aplicar publicacion o categoria final, confirmar visualmente en etiqueta si corresponde a perro, gato o ambos. |
| SEO title | BRIT Mono Protein Turkey 400 g |
| SEO description | Lata Brit Mono Protein Turkey de 400 g con imagen primaria cargada. Requiere confirmacion de especie antes de normalizacion final. |
| Observaciones/riesgos | Duda de especie/categoria desde el nombre disponible. |
| Viabilidad | `C. needs_human_confirmation` |

### SKU 101188

| Campo | Propuesta |
|-------|-----------|
| Nombre sugerido | BRIT CARE Lets Bite Duck Fillets 80 g |
| Slug sugerido | `brit-care-lets-bite-duck-fillets-80g` |
| Marca sugerida | BRIT CARE |
| Categoria principal | Perros |
| Subcategoria sugerida | Snacks / Premios |
| Short description | Snack Brit Care Lets Bite Duck Fillets en formato 80 g. |
| Description | Snack de la linea Brit Care Lets Bite en formato 80 g, identificado como Duck Fillets. Mantener como borrador hasta completar revision comercial y categoria final de premios o snacks. |
| SEO title | BRIT CARE Lets Bite Duck Fillets 80 g |
| SEO description | Snack Brit Care Lets Bite Duck Fillets 80 g con imagen primaria en Supabase Storage. Pendiente de revision antes de publicacion. |
| Observaciones/riesgos | Falta subcategoria especifica de snacks/premios. |
| Viabilidad | `B. needs_taxonomy_creation` |

### SKU 100909

| Campo | Propuesta |
|-------|-----------|
| Nombre sugerido | BRIT CARE Cat Grain Free Senior Weight Control 2 kg |
| Slug sugerido | `brit-care-cat-grain-free-senior-weight-control-2kg` |
| Marca sugerida | BRIT CARE |
| Categoria principal | Gatos |
| Subcategoria sugerida | Alimento seco |
| Short description | Alimento Brit Care para gato senior, linea Grain Free Senior Weight Control, formato 2 kg. |
| Description | Producto Brit Care Cat Grain Free Senior Weight Control en formato 2 kg. La descripcion debe mantenerse informativa y sin claims medicos hasta confirmar ficha tecnica o etiqueta oficial. |
| SEO title | BRIT CARE Cat Grain Free Senior Weight Control 2 kg |
| SEO description | Alimento Brit Care Cat Grain Free Senior Weight Control de 2 kg, con imagen primaria cargada y pendiente de curacion antes de publicacion. |
| Observaciones/riesgos | No afirmar efectos sobre peso o salud mas alla del nombre comercial. |
| Viabilidad | `B. needs_taxonomy_creation` |

## Clasificacion de Viabilidad

| SKU | Clasificacion | Motivo |
|-----|---------------|--------|
| `100583` | `B. needs_taxonomy_creation` | Falta marca BRIT y subcategoria fina de alimento humedo/latas. |
| `100584` | `B. needs_taxonomy_creation` | Falta marca BRIT y subcategoria fina de alimento humedo/latas. |
| `100588` | `C. needs_human_confirmation` | Falta marca BRIT, falta taxonomia fina y se debe confirmar especie/categoria. |
| `101188` | `B. needs_taxonomy_creation` | Falta marca BRIT CARE y subcategoria snacks/premios. |
| `100909` | `B. needs_taxonomy_creation` | Falta marca BRIT CARE y subcategoria alimento seco para gatos. |

No hay productos `apply_ready` porque las marcas necesarias no existen todavia.

## Recomendacion 6D.8B-B

Dividir la siguiente fase en dos pasos:

1. `6D.8B-B1`: crear taxonomia minima, previa aprobacion de Carlos:
   - Marca `BRIT`.
   - Marca `BRIT CARE`.
   - Subcategoria `Perros > Alimento humedo` o `Perros > Latas y conservas`.
   - Subcategoria `Perros > Snacks y premios`.
   - Subcategoria `Gatos > Alimento seco`.
2. `6D.8B-B2`: aplicar normalizacion comercial a los productos aprobados, manteniendo:
   - `review_status = draft`.
   - `is_active = false`.
   - `is_visible = false`.
   - `is_featured = false`.
   - `bsale_sync_status = pending`.
   - Sin precios.
   - Sin stock.
   - Sin publicacion.

Decision requerida de Carlos:

- Confirmar si `BRIT` y `BRIT CARE` seran marcas separadas.
- Confirmar nombres de subcategorias.
- Confirmar si `100588` corresponde a perro, gato o ambos.
- Confirmar si el lote se mantiene con estos 5 SKUs antes de aplicar cambios reales.

## Alcance Ejecutado

- SELECTs de solo lectura.
- Revision documental de estado y taxonomia.
- Propuesta comercial generada sin claims medicos ni promesas no verificadas.
- Sin SQL de modificacion.
- Sin `db push`, `db pull` ni `migration repair`.
- Sin Bsale.
- Sin RPC apply.
- Sin productos creados, modificados, borrados o publicados.
- Sin marcas/categorias creadas o modificadas.
- Sin imagenes subidas/importadas.
- Sin Storage modificado.
- Sin precios/stock.
- Sin WordPress/WooCommerce/cPanel.
