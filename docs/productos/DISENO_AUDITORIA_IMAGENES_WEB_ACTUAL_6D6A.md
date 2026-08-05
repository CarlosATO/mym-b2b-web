# Diseño de Auditoría de Imágenes Web Actual (Fase 6D.6A)

## Contexto y Objetivo
El objetivo es preparar una futura migración masiva y controlada de las imágenes de los productos desde la web actual hacia el entorno de Supabase Storage (`product-images`).
**Esta fase es estrictamente de diseño y auditoría (dry-run).** No se realiza importación masiva ni se modifican los productos en la base de datos.

## 1. Fuentes Posibles para la Auditoría
Para obtener un inventario confiable de imágenes actuales sin modificar el sistema web en producción, sugerimos los siguientes enfoques de menor a mayor esfuerzo:

1. **Exportación Manual de WooCommerce (Recomendado)**
   - Si la tienda actual es WooCommerce, un administrador puede exportar los productos a CSV.
   - **Ventajas**: Contiene el SKU y las URLs de las imágenes agrupadas y estructuradas. No requiere scraping ni acceso de API.
2. **Sitemap XML de Imágenes**
   - Extraer las URLs de imágenes indexadas.
   - **Desventajas**: Difícil correlacionar con SKU exactos si la URL no contiene información identificable de manera estructurada.
3. **WooCommerce API (Solo lectura)**
   - Consultar `GET /wp-json/wc/v3/products`.
   - **Desventajas**: Requiere credenciales de acceso a la API (Consumer Key / Secret), que actualmente están prohibidas en esta fase.

*Recomendación para la fase de migración*: Pedir al usuario (Carlos) que proporcione un archivo CSV exportado desde WooCommerce.

## 2. Identificación de Imágenes y Duplicados
Cada imagen se identificará utilizando:
- **URL original**: Ejemplo `https://midominio.com/wp-content/uploads/producto.jpg`.
- **SKU (Esencial)**: Servirá como puente entre la tienda actual y Bsale.
- **Slug del producto / Título**.

Para evitar duplicados durante una futura descarga:
- Mantener un registro (Set o tabla temporal) de URLs ya procesadas.
- Registrar el `SKU` para evitar asignar la misma imagen dos veces si el producto no lo requiere.

## 3. Niveles de Confianza y Reglas de Matching

Se definen tres niveles de confianza para relacionar el catálogo web actual con la base de datos Bsale:

- **Match Alto**: 
  - El SKU exportado coincide exactamente con el `sku` en `web_b2b.products`.
  - **Acción**: `import_auto_candidate`. Seguro para ser importado automáticamente.
- **Match Medio**: 
  - No hay SKU, pero el nombre del producto es extremadamente similar (ej. > 85% similitud de tokens).
  - **Acción**: `review_required`. Se listará en el reporte para aprobación manual del administrador.
- **Match Bajo**:
  - Solo coinciden palabras genéricas y no hay SKU.
  - **Acción**: `ignore`. No se importa automáticamente.

**Reglas Estrictas de Migración:**
- Nunca reemplazar una imagen existente (`primary_image_url != null`) sin confirmación explícita.
- Nunca publicar un producto automáticamente solo por haber recibido una imagen.
- Todas las imágenes serán alojadas en Supabase Storage (`product-images`).

## 4. Diseño del Reporte Dry-Run
El reporte de auditoría se generará en formato JSON/CSV para revisión.

```json
[
  {
    "product_id": "83bdcb5d-acc3-48a6-8ba2-1c605b29d542",
    "sku": "66200",
    "product_name_bsale": "PELUCHE DE GATO MOUNSTRUOS SURTIDOS",
    "current_primary_image": null,
    "source_url": "https://actual.com/wp-content/uploads/peluche.jpg",
    "match_type": "alto",
    "confidence": 100,
    "reason": "Match exacto por SKU",
    "action_suggested": "import_auto_candidate",
    "notes": "Listo para importación automatizada"
  }
]
```

## 5. Resumen Actual de Productos sin Imagen
Basado en la lectura actual del sistema (`web_b2b_system_list_products_for_import`):
- **Total de productos reales**: 24
- **Productos en borrador (`draft`)**: 24
- **Visibles**: 3
- **Inactivos**: 21
- **Con imágenes**: Aproximadamente 6 (basado en pruebas recientes y seeders base).
- **Sin imágenes**: Aproximadamente 18 (productos recién importados de Bsale).

## 6. Siguientes Pasos (Para Fase Posterior)
- El usuario provee la fuente de datos (idealmente CSV WooCommerce).
- Se ejecuta un script real (`node scripts/audit-web-product-images.mjs`) que lee el CSV y ejecuta la validación cruzada para generar el reporte de auditoría.
- Tras la aprobación humana de `review_required`, se procede con la fase de ingesta y carga en Storage.
