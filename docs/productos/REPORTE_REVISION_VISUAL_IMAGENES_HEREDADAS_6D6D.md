# Reporte Revisión Visual de Imágenes Heredadas (Fase 6D.6D)

## Objetivo

Preparar la revisión visual de los 6 candidatos con imagen heredada desde producto padre WooCommerce detectados en el dry-run 6D.6B.

Esta fase no importa imágenes, no sube archivos, no modifica Storage, no modifica productos y no publica productos. Solo identifica candidatos, valida estado actual con SELECTs de lectura y deja una pauta para aprobación humana.

## Contexto

- La imagen directa del SKU `101219` ya fue importada controladamente por UI en 6D.6C.
- Los 6 candidatos de esta fase vienen desde variaciones WooCommerce cuya imagen efectiva se obtuvo desde el producto padre.
- No deben importarse automáticamente sin revisión visual, porque una imagen heredada puede representar la línea correcta pero mostrar un peso, formato o variante distinta.

## Candidatos Heredados

| SKU | Producto B2B | Producto WooCommerce variación | Producto WooCommerce padre | URL imagen origen | Riesgo visual | Recomendación preliminar |
|-----|--------------|--------------------------------|----------------------------|-------------------|---------------|--------------------------|
| `100909` | BRIT CARE CAT GR. FREE SENIOR WEIGHT CONTROL 2KG | BRIT CARE CAT GR. FREE SENIOR WEIGHT CONTROL - 2 Kg | BRIT CARE CAT GR. FREE SENIOR WEIGHT CONTROL | `https://amimascota.cl/wp-content/uploads/2023/12/100909-e1705558221301.jpg` | Bajo/medio: coincide SKU y formato 2 Kg en la variación, pero la imagen viene heredada desde padre y debe confirmarse visualmente. | `revisar_manual` |
| `101213` | BRIT CARE GRAIN-FREE SALMON ADULT LARGE 3KG | BRIT CARE GRAIN-FREE SALMON ADULT LARGE - 3 Kg | BRIT CARE GRAIN-FREE SALMON ADULT LARGE | `https://amimascota.cl/wp-content/uploads/2023/12/101216-e1705557985716.png` | Medio/alto: producto B2B es Adult Large 3KG, pero el nombre del archivo fuente referencia `101216`; revisar que no muestre Adult estándar u otro formato. | `revisar_manual` |
| `101215` | BRIT CARE GRAIN-FREE SALMON ADULT 12KG | BRIT CARE GRAIN-FREE SALMON ADULT - 12 Kg | BRIT CARE GRAIN-FREE SALMON ADULT | `https://amimascota.cl/wp-content/uploads/2023/12/101216-1-e1705557976161.png` | Alto: comparte imagen heredada con SKU `101216` de 3KG; puede mostrar peso 3KG aunque el producto sea 12KG. | `revisar_manual` |
| `101216` | BRIT CARE GRAIN-FREE SALMON ADULT 3KG | BRIT CARE GRAIN-FREE SALMON ADULT - 3 Kg | BRIT CARE GRAIN-FREE SALMON ADULT | `https://amimascota.cl/wp-content/uploads/2023/12/101216-1-e1705557976161.png` | Medio: coincide línea y formato 3 Kg, pero sigue siendo imagen heredada desde padre; confirmar que el envase visible diga 3KG. | `revisar_manual` |
| `101221` | BRIT CARE GRAIN-FREE SALMON PUPPY 12KG | BRIT CARE GRAIN-FREE SALMON PUPPY - 12 Kg | BRIT CARE GRAIN-FREE SALMON PUPPY | `https://amimascota.cl/wp-content/uploads/2023/12/101222-e1705557953466.jpg` | Alto: comparte imagen heredada con SKU `101222` de 3KG; puede mostrar peso 3KG aunque el producto sea 12KG. | `revisar_manual` |
| `101222` | BRIT CARE GRAIN-FREE SALMON PUPPY 3KG | BRIT CARE GRAIN-FREE SALMON PUPPY - 3 Kg | BRIT CARE GRAIN-FREE SALMON PUPPY | `https://amimascota.cl/wp-content/uploads/2023/12/101222-e1705557953466.jpg` | Medio: coincide línea y formato 3 Kg, pero sigue siendo imagen heredada desde padre; confirmar que el envase visible diga 3KG. | `revisar_manual` |

## Decisión Final de Revisión Visual

Carlos revisó visualmente los candidatos heredados. La fase queda cerrada como revisión visual/documental: no se importaron imágenes, no se modificó Storage y no se modificaron productos.

| SKU | Decisión | Motivo |
|-----|----------|--------|
| `100909` | `aprobar` | La imagen corresponde a Brit Care Cat Senior Weight Control. Aprobada para importación controlada. |
| `101213` | `rechazar` | La imagen no es segura para el producto Adult Large 3KG; posible formato incorrecto. Rechazada por ahora. |
| `101215` | `aprobar` | La imagen corresponde a Adult Salmon formato 12KG. Aprobada para importación controlada. |
| `101216` | `rechazar` | Usa imagen asociada al 12KG; no es segura para producto 3KG. Rechazada por ahora. |
| `101221` | `pendiente_revision` | La imagen corresponde a Puppy Salmon, pero el peso no fue confirmado visualmente. |
| `101222` | `pendiente_revision` | Usa la misma imagen Puppy; el peso no fue confirmado visualmente. |

Solo los SKUs `100909` y `101215` pasan a una importación controlada posterior. Los SKUs `101213` y `101216` quedan rechazados por riesgo de peso/formato. Los SKUs `101221` y `101222` quedan pendientes de revisión visual futura.

## Estado Previo Validado

Validación realizada con SELECTs de solo lectura:

| SKU | product_id | Imagen primaria | review_status | Activo | Visible | Destacado | Bsale sync | product_prices | product_stock | public_count | public_slug_count |
|-----|------------|-----------------|---------------|--------|---------|-----------|------------|----------------|---------------|--------------|-------------------|
| `100909` | `160c93e0-a76a-43d1-bd6d-014ff2465ebd` | `0` | `draft` | `false` | `false` | `false` | `pending` | `0` | `0` | `0` | `0` |
| `101213` | `33084da4-c5ac-4890-9f2c-efe6fb51bd5d` | `0` | `draft` | `false` | `false` | `false` | `pending` | `0` | `0` | `0` | `0` |
| `101215` | `b6451a48-af47-4e8a-bde1-c7aa67b13413` | `0` | `draft` | `false` | `false` | `false` | `pending` | `0` | `0` | `0` | `0` |
| `101216` | `77970fd0-daea-4999-8631-07117b8fce3b` | `0` | `draft` | `false` | `false` | `false` | `pending` | `0` | `0` | `0` | `0` |
| `101221` | `eb41570b-3dd0-448b-84a4-9fe68362736a` | `0` | `draft` | `false` | `false` | `false` | `pending` | `0` | `0` | `0` | `0` |
| `101222` | `a7616df6-cccb-41af-925a-a860cbc10fa3` | `0` | `draft` | `false` | `false` | `false` | `pending` | `0` | `0` | `0` | `0` |

Ningún candidato tiene imagen primaria actualmente, por lo que ninguno se marca `already_has_image`.

## Criterios de Revisión Visual

- Aprobar si la imagen representa claramente la misma línea de producto y no muestra un peso/formato contradictorio.
- Revisar manual si la imagen es genérica o el peso mostrado no se distingue.
- Rechazar si la imagen muestra otro formato, otra especie, otro peso incompatible o un producto distinto.
- Nunca reemplazar una imagen existente automáticamente.
- Nunca publicar un producto solo por tener imagen.

## Instrucciones para Carlos

Revisión visual completada por Carlos. La siguiente fase planificada es 6D.6E, enfocada exclusivamente en importar de forma controlada las imágenes aprobadas:

```text
100909
101215
```

No se deben importar en 6D.6E los SKUs `101213`, `101216`, `101221` ni `101222`.

## Alcance de Seguridad

- No se llamó Bsale.
- No se llamó RPC apply.
- No se crearon, borraron, modificaron ni publicaron productos.
- No se subieron ni importaron imágenes.
- No se modificó Storage.
- No se tocaron `product_prices` ni `product_stock`.
- No se tocó WordPress/WooCommerce/cPanel interno ni se usaron credenciales de esos sistemas.
- No se ejecutó SQL de modificación; solo SELECTs de lectura para validar estado.
- No se incluyeron CSVs, outputs locales ni imágenes en el repo.
