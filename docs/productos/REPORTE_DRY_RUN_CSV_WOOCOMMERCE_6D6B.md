# Reporte Dry-Run CSV WooCommerce (Fase 6D.6B)

## 1. Contexto de Ejecución
Este reporte resume los resultados del cruce en entorno local (dry-run) entre el catálogo actual B2B (obtenido mediante RPC de solo lectura) y un volcado CSV de WooCommerce original para planificar la migración masiva de imágenes.

- **Fecha de Ejecución**: 05 Agosto 2026
- **Archivo Fuente (Local)**: `wc-products-original-20260805.csv`
- **Tamaño Aprox**: 9.6 MB
- **Seguridad**: Ejecución de solo lectura. No se importaron imágenes a Storage, no se llamaron APIs externas (Bsale), ni se ejecutaron sentencias SQL mutables.

## 2. Métricas de WooCommerce CSV
| Métrica | Valor |
|---------|-------|
| Total filas | 3,566 |
| Filas con SKU | 3,181 |
| Filas sin SKU | 385 |
| Productos Simples | 2,015 |
| Productos Variables | 382 |
| Variaciones | 1,169 |
| Con Imagen Directa | 1,531 |
| Imágenes Únicas | 1,361 |
| Variaciones con Imagen Heredada de Padre | 721 |

> **Nota sobre herencia**: En WooCommerce, las variaciones a menudo no tienen una URL de imagen propia en el CSV, sino que dependen de la columna `Superior` (parent) para heredar la imagen del producto variable. El script logra resolver 721 casos usando esta lógica.

## 3. Métricas Portal B2B Actual
| Métrica | Valor |
|---------|-------|
| Total Productos | 24 |
| Con Imagen (`primary_image_url`) | 2 |
| Sin Imagen | 22 |
| En estado Borrador (`draft`) | 24 |
| Visibles | 3 |
| Inactivos | 21 |

## 4. Resultados de Matching (Cruce SKU/Nombre)
El cruce determinó la elegibilidad de los productos del portal B2B para recibir imágenes desde el CSV:

| Estado de Matching | Cantidad | Acción Recomendada |
|--------------------|----------|--------------------|
| `import_auto_candidate` (High Direct) | 1 | Procesar automáticamente |
| High Inherited desde padre | 6 | Revisión visual previa; importación controlada si corresponde |
| `already_has_image` | 2 | Ignorar (No sobreescribir) |
| `no_match` | 15 | Ignorar |
| `review_required` | 0 | Revisión Humana |

**Candidato automático puro**: 1 producto con imagen directa.

**Candidatos heredados de alta confianza**: 6 productos. No deben tratarse como importación automática ciega en la siguiente fase; requieren revisión visual previa porque, en productos por peso/formato, la imagen heredada desde el padre puede ser comercialmente válida, pero también podría mostrar un peso específico incorrecto.

## 5. Ejemplos Representativos
- **Candidato Directo (High Direct)**: Producto simple en B2B con SKU exacto coincidente con fila simple en WC y URL de imagen disponible en la misma fila.
- **Candidato Heredado (High Inherited)**: Variación en WC cuyo SKU coincide con el de B2B, pero su imagen reside en la fila del "Padre". El script recupera la imagen correctamente, pero estos casos quedan para revisión visual e importación controlada, no para automatización ciega.
- **Bloqueado (Already Has Image)**: `10.123` y `66200` que ya tienen `primary_image_url` cargada en fases anteriores. No se sobreescriben.

## 6. Riesgos Detectados y Recomendaciones
- **Variaciones Huérfanas**: Si en un futuro un producto variable en WooCommerce no tiene imagen en su registro padre, sus variaciones no podrán resolverse automáticamente.
- **Peso/Formato en Imágenes Heredadas**: Una imagen heredada desde el padre puede mostrar un formato específico que no corresponda exactamente a la variante B2B. Los 6 candidatos heredados deben revisarse visualmente antes de cualquier importación real.
- **Imágenes Externas**: Las URLs obtenidas del CSV apuntan al servidor original. La fase de importación real deberá descargar estos binarios (Server-Side) y subirlos a Supabase Storage tal como se validó en 6D.5G.

**Recomendación**: La lógica de dry-run es robusta y confirma que la herencia padre/hijo incrementa significativamente el yield, pero la siguiente fase debe separar dos carriles: 1 candidato directo apto para importación automática futura y 6 candidatos heredados aptos para revisión visual/importación controlada. No se reemplazan imágenes existentes y no se publica nada automáticamente.

## 7. Confirmaciones Finales de Integridad
✅ No hubo llamadas a Bsale ni APIs externas.
✅ No se modificó Supabase Storage.
✅ No se crearon, borraron ni modificaron productos.
✅ Precios y Stock intactos.
✅ Sin interacciones SQL mutables.
