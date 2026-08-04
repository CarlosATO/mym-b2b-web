# Reporte — Revisión Post-Apply y Preparación de Curación Comercial (Fase 6D.4E)

- **Fecha/hora local**: 2026-08-04 09:10 (-04)
- **apply_run_id revisado**: `9a209048-b2fe-4ee4-af42-b5bf3901442c`
- **import_run usado**: `22e1d487-36e6-4475-a0e0-a28d0305dbcc`
- **Productos revisados**: 20 (todos los creados en el primer apply real)

## Validación del apply (solo SELECT, sin cambios)

| Validación | Resultado |
|---|---|
| Items del apply_run | 20 |
| Productos existentes en `web_b2b.products` | 20/20 |
| Productos inseguros (fuera de draft/inactivo/no visible/pending/NULL) | 0 |
| Productos Bsale visibles públicamente (is_visible + is_active) | 0 |
| Productos del apply con precio | 0 |
| Productos del apply con stock | 0 |
| Productos del apply con imagen | 0 |

## Listado compacto de los 20 productos

Todos: `review_status='draft'`, `is_active=false`, `is_visible=false`, `is_featured=false`, `bsale_sync_status='pending'`, `bsale_last_checked_at=NULL`, sin categoría ni marca.

| # | SKU | variant | Nombre | slug |
|---|---|---|---|---|
| 1 | 00016 | 1478 | SAFARI PEZ HENO CONEJO-CUYE | safari-pez-heno-conejo-cuye |
| 2 | 66200 | 1485 | PELUCHE DE GATO MOUNSTRUOS SURTIDOS | peluche-de-gato-mounstruos-surtidos |
| 3 | 74528 | 1488 | PELUCHE PEZ REAL PEQUEÑO | peluche-pez-real-pequeno |
| 4 | 73310 | 1491 | TRAILLA AMIGO TELA 1.0CM | trailla-amigo-tela-1-0cm |
| 5 | 62596 | 1493 | JUG GATO PORFIADO HA | jug-gato-porfiado-ha |
| 6 | 100909 | 1494 | BRIT CARE CAT GR. FREE SENIOR WEIGHT CONTROL 2KG | brit-care-cat-gr-free-senior-weight-control-2kg |
| 7 | 064992107253 | 1497 | ORIJEN FIT AND TRIM DOG 11.35KG | orijen-fit-and-trim-dog-11-35kg |
| 8 | B-DOR44550-2KG | 1499 | ORIJEN FIT AND TRIM DOG 2KG | orijen-fit-and-trim-dog-2kg |
| 9 | B-DOR44550-6KG | 1500 | ORIJEN FIT AND TRIM DOG 5.9KG | orijen-fit-and-trim-dog-5-9kg |
| 10 | 100066 | 1507 | HARTZ TUFF STUFF POLLO CON CUERDA LARGE | hartz-tuff-stuff-pollo-con-cuerda-large |
| 11 | 100080 | 1506 | HARTZ ZOO BALLOONS DOG TOY | hartz-zoo-balloons-dog-toy |
| 12 | 10.123 | 1503 | BRACCO TRAVEL TRANSPORTADORA Nº3 | bracco-travel-transportadora-n-3 |
| 13 | 10.40ME-ECO | 1504 | GIPSY TRANSPORTADORA N° 1 Nº1 | gipsy-transportadora-n-1-n-1 |
| 14 | 10.42EM | 1505 | GIPSY TRANSPORTADORA N° 3 Nº3 | gipsy-transportadora-n-3-n-3 |
| 15 | 101215 | 1511 | BRIT CARE GRAIN-FREE SALMON ADULT 12KG | brit-care-grain-free-salmon-adult-12kg |
| 16 | 101216 | 1512 | BRIT CARE GRAIN-FREE SALMON ADULT 3KG | brit-care-grain-free-salmon-adult-3kg |
| 17 | 101213 | 1513 | BRIT CARE GRAIN-FREE SALMON ADULT LARGE 3KG | brit-care-grain-free-salmon-adult-large-3kg |
| 18 | 101219 | 1510 | BRIT CARE GRAIN-FREE SALMON JUNIOR LARGE 3KG | brit-care-grain-free-salmon-junior-large-3kg |
| 19 | 101221 | 1508 | BRIT CARE GRAIN-FREE SALMON PUPPY 12KG | brit-care-grain-free-salmon-puppy-12kg |
| 20 | 101222 | 1509 | BRIT CARE GRAIN-FREE SALMON PUPPY 3KG | brit-care-grain-free-salmon-puppy-3kg |

Nota: el slug `gipsy-transportadora-n-1-n-1` conserva el «Nº1» del nombre original (sufijo generado por el helper para evitar colisión/duplicación en el nombre fuente de Bsale).

## Diagnóstico de campos faltantes (20 productos)

| Campo | Faltantes |
|---|---|
| Sin categoría (`category_id IS NULL`) | 20/20 |
| Sin marca (`brand_id IS NULL`) | 20/20 |
| Sin imagen (`product_images` vacía) | 20/20 |
| Sin descripción (description y short_description NULL) | 20/20 |
| Sin SEO (seo_title y seo_description NULL) | 20/20 |
| Listos para revisión comercial | 0/20 |
| Requieren curación manual | 20/20 |

Conclusión: el 100% de los productos importados requiere curación comercial antes de publicación. No hay ninguno listo para publicar.

## Estado DEMO/TEST

| SKU | Nombre | review_status | is_active | is_visible | is_featured | categoría/marca |
|---|---|---|---|---|---|---|
| DEMO-001 | Demo Alimento Adulto 15kg | draft | true | true | true | sí / sí |
| DEMO-002 | Demo Snack Mascota 500g | draft | true | true | false | sí / sí |
| DEMO-003 | Demo Arena Sanitaria 10kg | draft | true | true | true | sí / sí |
| TEST-UI-001 | Producto Prueba UI B2B | draft | false | false | false | sin categoría / sí |

- Los 4 siguen intactos y sin modificar en esta fase.
- **Hallazgo relevante**: DEMO-001/002/003 están `is_active=true` + `is_visible=true` → son los 3 productos que sí aparecen en el catálogo público hoy. TEST-UI-001 está oculto.

### Estrategia recomendada

- **Mantenerlos durante el desarrollo**: no molestan mientras el resto del catálogo esté en borrador.
- **Antes de cualquier publicación real**: limpiarlos con script/SQL controlado (IDs exactos) o dejarlos fuera de producción (p. ej. `is_visible=false`). Nunca publicarlos como catálogo B2B real.
- **Nunca mezclarlos** con productos Bsale: no asignarles categorías/marcas comerciales finales; marcarlos siempre como contenido demo.
- Acción recomendada: en la fase de curación/pre-publicación, desactivar/ocultar (o eliminar controladamente) DEMO-001/002/003 y TEST-UI-001.

## Diseño de flujo futuro: productos nuevos desde Bsale

### Principio rector

Productos nuevos de Bsale **entran como borrador seguro** (nunca se publican automáticamente):

- `review_status='draft'`
- `is_active=false`, `is_visible=false`, `is_featured=false`
- `bsale_sync_enabled=true`, `bsale_sync_status='pending'` (o estado equivalente)
- Sin publicación pública automática; sin precios/stock/imágenes en esta etapa
- El admin debe curar y publicar explícitamente

### A. Sync automático (programado)

- Corre programado (cron/Edge Function/worker), mismo proceso que 6D.4D: auditoría dry_run → apply controlado con la RPC `web_b2b_system_apply_bsale_product_import_run`.
- Detecta variantes/productos nuevos (planner con conflict/skip); importa como borrador seguro; registra auditoría (`bsale_product_import_runs`/`import_items` y `apply_runs`/`apply_items`).
- No publica nada; no toca imágenes en esta etapa; **no sobrescribe contenido curado** (solo crea nuevos; los existentes curados no se tocan).
- Debe respetar el mismo límite conservador por ejecución y la idempotencia ya probada.

### B. Botón manual "Sincronizar desde Bsale"

- Disponible solo para admin autorizado (misma seguridad que RPCs admin existentes).
- Dispara el **mismo proceso** que el sync automático (misma lógica segura, misma RPC).
- Caso de uso: se acaba de crear un producto en Bsale y se quiere revisarlo rápido en la web (siempre como borrador).
- No publica automáticamente. No permite crear productos manuales aislados (creación manual de productos sigue deshabilitada).

### C. Panel de revisión "Productos pendientes de curación"

- Vista admin con filtros: Sin categoría · Sin marca · Sin imagen · Borrador · Pendiente Bsale.
- Acciones futuras (fase posterior): asignar categoría, asignar marca, cargar/asociar imagen, editar descripción comercial, publicar (publicar = activar + visible, solo tras curación completa).

## Nota: imágenes desde la página actual (fase futura separada)

- Las imágenes se importarán/asociarán **después**, en fase separada (fuente probable: web actual / WordPress / cPanel).
- No todos los productos tendrán imagen; se debe auditar cobertura:
  - match por SKU si existe;
  - match por slug/nombre si no existe SKU;
  - productos con imagen;
  - productos sin imagen;
  - imágenes sin producto asociado (huérfanas).
- No mezclar imágenes con el apply de productos base (el apply 6D.4D no crea ni toca imágenes; se mantiene la regla `no_images=true`).

## Recomendación de curación comercial (próximos pasos)

1. **No importar masivamente todavía**: la muestra de 20 es la base para definir categorías/marcas.
2. **Curar la primera muestra**: definir mapeo de categorías (Alimentos perros/gatos, Accesorios, Juguetes, Transporte…) y marcas (BRIT, ORIJEN, HARTZ, GIPSY, BRACCO, otros), asignar descripciones/SEO de muestra.
3. **Diseñar sync recurrente** (A + B) reutilizando la lógica de 6D.4D ya validada.
4. **Abordar imágenes** como fase separada (auditoría + importación).
5. **Limpiar DEMO/TEST** antes de cualquier publicación real.

## Hallazgos / Riesgos

- 20/20 requieren curación (0 listos): no hay riesgo de publicación accidental mientras permanezcan en el estado seguro actual.
- DEMO-001/002/003 siguen visibles en catálogo público: son contenido demo; deben retirarse antes de producción.
- Slugs con «nº/n°» del nombre fuente quedan normalizados; revisar el caso `gipsy-transportadora-n-1-n-1` en curación si se quiere mejorar el nombre en Bsale.
- Sin cambios de datos en esta fase: solo lectura + reporte.
