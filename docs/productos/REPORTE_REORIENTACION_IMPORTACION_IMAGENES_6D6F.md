# Reporte Reorientacion Importacion de Imagenes (Fase 6D.6F)

## Objetivo

Registrar el cambio estrategico definido por Carlos para la Fase 6D.6F: pausar la importacion manual una a una de imagenes Puppy pendientes y reorientar el trabajo hacia un proceso por lote, controlado y posterior a la importacion ampliada de productos desde Bsale.

Esta fase queda como cierre documental de decision. No importa imagenes, no modifica productos, no modifica Storage y no publica productos.

## Contexto Validado

El flujo manual `Importar imagen desde URL` ya fue validado en fases anteriores:

- Fase 6D.6C: 1 imagen directa importada manualmente desde UI.
- Fase 6D.6E: 2 imagenes heredadas aprobadas importadas manualmente desde UI.

Actualmente existen 5 productos con imagen propia en Supabase Storage `product-images`.

La revision pendiente de los SKU Puppy se detiene porque continuar producto por producto no es eficiente para el volumen esperado.

## Candidatos Puppy Reorientados

Los siguientes productos no se importan en esta fase y quedan pendientes para un futuro batch automatico/revision controlada:

| SKU | product_id | Producto B2B | URL WooCommerce heredada | Decision 6D.6F |
|-----|------------|--------------|---------------------------|----------------|
| `101221` | `eb41570b-3dd0-448b-84a4-9fe68362736a` | BRIT CARE GRAIN-FREE SALMON PUPPY 12KG | `https://amimascota.cl/wp-content/uploads/2023/12/101222-e1705557953466.jpg` | Pendiente para batch futuro/revision |
| `101222` | `a7616df6-cccb-41af-925a-a860cbc10fa3` | BRIT CARE GRAIN-FREE SALMON PUPPY 3KG | `https://amimascota.cl/wp-content/uploads/2023/12/101222-e1705557953466.jpg` | Pendiente para batch futuro/revision |

## Nueva Estrategia

1. Bsale queda como fuente oficial de productos.
2. Primero se importaran mas productos desde Bsale mediante batch controlado.
3. Luego se cruzaran esos productos contra el CSV WooCommerce ya descargado.
4. Despues se importaran imagenes por lote hacia Supabase Storage solo para matches confiables.
5. No se reemplazaran imagenes existentes.
6. No se publicaran productos automaticamente.

## Reglas de Seguridad

- No se importaron imagenes en esta fase.
- No se subieron imagenes.
- No se modifico Storage.
- No se modificaron productos.
- No se publicaron productos.
- No se tocaron precios ni stock.
- No se llamo Bsale.
- No se llamo RPC apply.
- No se ejecuto SQL.
- No se toco WordPress/WooCommerce/cPanel.

## Estado de la Fase

6D.6F queda reorientada. La importacion manual Puppy queda cancelada y los SKU `101221` y `101222` permanecen pendientes para un flujo futuro por lote, posterior a la importacion controlada de mas productos desde Bsale y al cruce con el CSV WooCommerce.
