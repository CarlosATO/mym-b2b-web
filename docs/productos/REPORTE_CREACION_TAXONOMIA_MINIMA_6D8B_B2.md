# Reporte Creacion Taxonomia Minima (Fase 6D.8B-B2)

## Objetivo

Validar la creacion real, realizada manualmente por Carlos desde la UI admin, de la taxonomia minima requerida para normalizar el primer lote de productos Bsale con imagen.

Esta validacion fue solo lectura. No se ejecuto SQL de modificacion desde terminal y no se modificaron productos, precios, stock, imagenes ni Storage.

## Taxonomia Creada desde UI Admin

### Marcas

| Marca | Slug | ID final | Activa | Duplicados por slug |
|-------|------|----------|--------|--------------------:|
| BRIT | `brit` | `dfa7ec0c-5ab9-4417-9c24-e4591f854b6d` | si | 0 |
| BRIT CARE | `brit-care` | `29333c92-ded6-4ea1-8d76-d60f6fd4ed08` | si | 0 |

Nota de esquema: `web_b2b.brands` no tiene columna `is_visible`; por eso la visibilidad de marca no aplica actualmente.

### Categorias

| Categoria | Slug | ID final | Parent esperado | parent_id | Activa | Visible catalogo | Visible home | Duplicados por slug |
|-----------|------|----------|-----------------|-----------|--------|------------------|--------------|--------------------:|
| Alimento humedo | `perros-alimento-humedo` | `f136bb31-8b6f-440e-9442-b7361a02e70e` | Perros > Alimentos para perros | `86eac6cc-14c0-4438-a7e4-1de2c7500347` | si | si | no | 0 |
| Snacks y premios | `perros-snacks-premios` | `d785e101-d67f-4103-b214-db264dfa3592` | Perros | `676d20a3-a14c-434c-b4a8-cb3fccd9c709` | si | si | no | 0 |
| Alimento seco | `gatos-alimento-seco` | `64346055-e5c6-40d9-b159-7a9a46ab5e95` | Gatos > Alimentos para gatos | `8e33de7f-ee6a-4da6-b464-e8f55e37016c` | si | si | no | 0 |

## Validacion de Jerarquia

| Slug | Parent real | Parent slug | Resultado |
|------|-------------|-------------|-----------|
| `perros-alimento-humedo` | Alimentos para perros | `alimentos-para-perros` | OK |
| `perros-snacks-premios` | Perros | `perros` | OK |
| `gatos-alimento-seco` | Alimentos para gatos | `alimentos-para-gatos` | OK |

## Conteos de Seguridad

| Metrica | Antes 6D.8B-B2 | Despues validado |
|---------|----------------:|------------------:|
| `web_b2b.products` | 74 | 74 |
| Productos Bsale reales | 70 | 70 |
| `product_prices` | 0 | 0 |
| `product_stock` | 0 | 0 |
| `product_images` | 13 | 13 |
| Storage `product-images` | 9 | 9 |
| Productos Bsale publicados/expuestos | 0 | 0 |
| Productos expuestos/publicados totales | 0 | 0 |

## Impacto Confirmado

- Se crearon solo marcas y categorias desde UI admin.
- No se modificaron productos.
- No se publicaron productos.
- No se tocaron precios.
- No se toco stock.
- No se importaron ni subieron imagenes.
- No se modifico Storage.
- No se llamo Bsale.
- No se llamo RPC apply de productos.
- No se uso SQL de modificacion desde terminal.

## Taxonomia Disponible para Normalizacion

La taxonomia minima queda disponible para una siguiente fase de normalizacion comercial:

| SKU | Producto | Marca disponible | Categoria disponible |
|-----|----------|------------------|----------------------|
| `100583` | BRIT LATA PATE Y MEAT DUCK 400GR | BRIT | Perros > Alimentos para perros > Alimento humedo |
| `100584` | BRIT LATA PATE Y MEAT PUPPY 400GR | BRIT | Perros > Alimentos para perros > Alimento humedo |
| `101188` | BRIT CARE LETS BITE SNACKS DUCK FILLETS 80GR | BRIT CARE | Perros > Snacks y premios |
| `100909` | BRIT CARE CAT GR. FREE SENIOR WEIGHT CONTROL 2KG | BRIT CARE | Gatos > Alimentos para gatos > Alimento seco |

Pendiente:

- `100588` sigue pendiente de confirmacion humana de especie/categoria antes de normalizarlo.

## Siguiente Paso Recomendado

6D.8B-C: aplicar normalizacion comercial controlada al lote aprobado, usando UI admin o mecanismo controlado existente, manteniendo todos los productos:

- `review_status = draft`
- `is_active = false`
- `is_visible = false`
- `is_featured = false`
- Sin precios
- Sin stock
- Sin publicacion

## Alcance de Validacion

- SELECTs de solo lectura.
- Documentacion del resultado real.
- Sin SQL de modificacion desde terminal.
- Sin `db push`, `db pull` ni `migration repair`.
- Sin Bsale.
- Sin RPC apply de productos.
- Sin productos creados, modificados, borrados o publicados desde terminal.
- Sin imagenes subidas/importadas desde terminal.
- Sin Storage/precios/stock.
- Sin WordPress/WooCommerce/cPanel.
