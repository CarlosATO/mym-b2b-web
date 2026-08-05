# Reporte Preflight Normalizacion Productos con Imagen (Fase 6D.8A)

## Objetivo

Auditar los productos Bsale reales que ya tienen imagen primaria en Supabase Storage y determinar su nivel de preparacion comercial antes de una normalizacion manual controlada.

Esta fase es solo lectura y documental. No crea productos, no modifica productos, no publica productos, no importa imagenes, no sube archivos, no modifica Storage, no toca precios y no toca stock.

## Contexto Estrategico

Bsale es la fuente oficial de productos. La web B2B complementa esos productos con curacion comercial:

- Imagen.
- Categoria y marca web.
- Descripcion corta.
- Descripcion larga.
- SEO title.
- SEO description.
- Visibilidad/publicacion controlada.

Los productos nuevos de Bsale deben entrar a la web como borradores seguros y luego pasar por curacion humana antes de publicarse.

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
| DEMO | 3 |
| TEST | 1 |
| Productos Bsale reales con imagen primaria | 9 |
| `product_images` | 13 |
| Storage `product-images` | 9 |
| `product_prices` | 0 |
| `product_stock` | 0 |
| Productos Bsale publicados/visibles | 0 |
| Productos Bsale expuestos en catalogo publico | 0 |

Categorias existentes observadas con SELECT de solo lectura:

- `Accesorios`
- `Accesorios > Transportadoras`
- `Alimentos Demo`
- `Gatos`
- `Gatos > Alimentos para gatos`
- `Perros`
- `Perros > Alimentos para perros`

Nota operativa: una consulta auxiliar de marcas fue interrumpida por bloqueo temporal de autenticacion del CLI de Supabase tras reintentos. No afecta el preflight principal: la tabla de productos ya muestra `brand_name` para los productos con marca asignada y `null` para los restantes.

## Clasificacion Readiness

Criterios:

- `A. ready_for_pilot_review`: imagen primaria, marca, categoria final, descripcion corta, descripcion larga, SEO title, SEO description, slug valido y estado seguro.
- `B. missing_commercial_content`: tiene imagen, marca/categoria suficientes, pero falta descripcion o SEO.
- `C. missing_taxonomy`: tiene imagen, pero falta marca o categoria/subcategoria.
- `D. image_data_warning`: problema de imagen, URL externa o multiples primarias.
- `E. unsafe_publication_state`: activo, visible, destacado o publicado sin aprobacion.

Resumen:

| Clasificacion | Cantidad |
|---------------|---------:|
| `A. ready_for_pilot_review` | 0 |
| `B. missing_commercial_content` | 1 |
| `C. missing_taxonomy` | 8 |
| `D. image_data_warning` | 0 |
| `E. unsafe_publication_state` | 0 |

## Productos Bsale con Imagen Primaria

| SKU | product_id | Variante Bsale | Producto | Marca | Categoria | Short | Desc | SEO title | SEO desc | Imagenes primarias / total | Estado | Public | Readiness |
|-----|------------|----------------|----------|-------|-----------|-------|------|-----------|----------|----------------------------|--------|--------|-----------|
| `10.123` | `a38ed49d-cb1a-4b36-8254-132050ba069e` | `1503` | BRACCO TRAVEL TRANSPORTADORA Nº3 | BRACCO | Accesorios > Transportadoras | si | si | no | no | 1 / 1 | draft/inactivo/no visible/no destacado/pending | 0 | `B. missing_commercial_content` |
| `100583` | `52fdf695-2c9d-4425-a843-6c08dae31b04` | `1552` | BRIT LATA PATE Y MEAT DUCK 400GR | falta | falta | no | no | no | no | 1 / 1 | draft/inactivo/no visible/no destacado/pending | 0 | `C. missing_taxonomy` |
| `100584` | `2d503986-85d5-4217-bf9b-307c3dde82ed` | `1551` | BRIT LATA PATE Y MEAT PUPPY 400GR | falta | falta | no | no | no | no | 1 / 1 | draft/inactivo/no visible/no destacado/pending | 0 | `C. missing_taxonomy` |
| `100588` | `ffb60504-e85f-4d51-b2e3-b98751a99d62` | `1550` | BRIT LATA MONO PROTEIN TURKEY 400GR | falta | falta | no | no | no | no | 1 / 1 | draft/inactivo/no visible/no destacado/pending | 0 | `C. missing_taxonomy` |
| `100909` | `160c93e0-a76a-43d1-bd6d-014ff2465ebd` | `1494` | BRIT CARE CAT GR. FREE SENIOR WEIGHT CONTROL 2KG | falta | falta | no | no | no | no | 1 / 1 | draft/inactivo/no visible/no destacado/pending | 0 | `C. missing_taxonomy` |
| `101188` | `dab271c7-83bf-45c0-82b3-bd5caadf6c0b` | `1556` | BRIT CARE LETS BITE SNACKS DUCK FILLETS 80GR | falta | falta | no | no | no | no | 1 / 1 | draft/inactivo/no visible/no destacado/pending | 0 | `C. missing_taxonomy` |
| `101215` | `b6451a48-af47-4e8a-bde1-c7aa67b13413` | `1511` | BRIT CARE GRAIN-FREE SALMON ADULT 12KG | falta | falta | no | no | no | no | 1 / 1 | draft/inactivo/no visible/no destacado/pending | 0 | `C. missing_taxonomy` |
| `101219` | `0aee8c51-e67e-4b64-bc7c-d7ede8f380d0` | `1510` | BRIT CARE GRAIN-FREE SALMON JUNIOR LARGE 3KG | falta | falta | no | no | no | no | 1 / 1 | draft/inactivo/no visible/no destacado/pending | 0 | `C. missing_taxonomy` |
| `66200` | `83bdcb5d-acc3-48a6-8ba2-1c605b29d542` | `1485` | PELUCHE DE GATO MOUNSTRUOS SURTIDOS | falta | falta | no | no | no | no | 1 / 2 | draft/inactivo/no visible/no destacado/pending | 0 | `C. missing_taxonomy` |

## Brechas Detectadas

- No hay productos listos para piloto de publicacion.
- 1 producto, BRACCO, ya tiene marca/categoria y descripciones, pero falta SEO title y SEO description.
- 8 productos tienen imagen primaria, pero faltan marca y categoria.
- Los 8 productos sin taxonomia tambien carecen de descripcion corta, descripcion larga y SEO.
- No se detectaron URLs primarias externas: las 9 imagenes primarias apuntan a Supabase Storage `product-images`.
- No se detectaron productos Bsale en estado inseguro de publicacion.
- `66200` tiene 2 imagenes totales, pero solo 1 primaria; no es inconsistencia critica.

## Riesgos

- Publicar sin taxonomia o sin descripciones generaria catalogo incompleto aunque haya imagen.
- Los productos por formato/peso requieren textos y SEO especificos para evitar confusion comercial.
- La normalizacion debe seguir sin crear precios ni stock; esos datos pertenecen a fases posteriores de integracion Bsale.

## Propuesta 6D.8B

Seleccionar maximo 5 productos para normalizacion comercial inicial, sin publicar:

| Prioridad | SKU | Producto | Marca probable | Categoria probable | Texto faltante |
|-----------|-----|----------|----------------|--------------------|----------------|
| 1 | `100583` | BRIT LATA PATE Y MEAT DUCK 400GR | BRIT | Perros > Alimentos para perros | short, description, SEO title, SEO description |
| 2 | `100584` | BRIT LATA PATE Y MEAT PUPPY 400GR | BRIT | Perros > Alimentos para perros | short, description, SEO title, SEO description |
| 3 | `100588` | BRIT LATA MONO PROTEIN TURKEY 400GR | BRIT | Perros > Alimentos para perros | short, description, SEO title, SEO description |
| 4 | `101188` | BRIT CARE LETS BITE SNACKS DUCK FILLETS 80GR | BRIT CARE | Perros > Alimentos para perros o futura categoria Snacks | short, description, SEO title, SEO description |
| 5 | `100909` | BRIT CARE CAT GR. FREE SENIOR WEIGHT CONTROL 2KG | BRIT CARE | Gatos > Alimentos para gatos | short, description, SEO title, SEO description |

Alternativa: incluir `101215` en lugar de `100909` si Carlos prefiere priorizar productos de perro antes que gato.

Decision requerida de Carlos antes de 6D.8B:

- Confirmar los 5 SKUs iniciales.
- Confirmar si se usaran categorias existentes o si se debe disenar una categoria nueva para snacks.
- Confirmar si las marcas BRIT y BRIT CARE se crean/se asignan como marcas separadas o se agrupan.
- Confirmar que 6D.8B seguira sin publicar y sin tocar precios/stock.

## Alcance Ejecutado

- SELECTs de solo lectura.
- Documentacion del preflight.
- Sin SQL de modificacion.
- Sin `db push`, `db pull` ni `migration repair`.
- Sin Bsale.
- Sin RPC apply.
- Sin productos creados, modificados, borrados o publicados.
- Sin imagenes subidas/importadas.
- Sin Storage modificado.
- Sin precios/stock.
- Sin WordPress/WooCommerce/cPanel.
