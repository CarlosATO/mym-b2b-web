# Diseño — Gestión de Imágenes de Productos Bsale (Fase 6D.5D)

## Objetivo

Definir el flujo correcto para gestionar imágenes de productos en la Web B2B MYM con dos entradas:

- carga local desde el computador del usuario
- importación / asociación desde URL, especialmente para rescatar imágenes desde la web actual / WordPress / cPanel

Esta fase es solo diseño. No implementa subida, bucket, SQL ni mutaciones.

## Auditoría del estado actual

### Lo que existe hoy

- `primary_image_url` ya está soportado en el formulario de edición.
- `primary_image_url` se persiste en el flujo actual de guardado.
- `primary_image_url` se usa para preview en:
  - el formulario admin
  - el listado admin
  - el catálogo público
  - la ficha pública
- El código actual no muestra soporte real para upload a Storage.
- No hay uso de `product_images` en el frontend/admin codebase actual.
- No existe UI de arrastre/carga de archivo todavía.

### Lo que falta

- Subida real de archivo desde el navegador o el servidor.
- Bucket de Storage para imágenes definitivas.
- Políticas de acceso/servicio para imágenes.
- Migración de imágenes desde la web actual / WordPress / cPanel.

## Diseño de carga local

### UX propuesta

- Botón `Subir desde mi computador`.
- Preview inmediata antes de guardar.
- Sustitución de la imagen principal actual.
- Texto de ayuda breve: la imagen quedará bajo control de la nueva plataforma.

### Reglas recomendadas

- Tipos permitidos: `jpg`, `jpeg`, `png`, `webp`.
- Rechazar `svg` salvo sanitización explícita.
- Tamaño máximo recomendado: definir límite conservador antes de implementar.
- Nombre seguro y normalizado.

### Destino recomendado

- Bucket `product-images`.
- Ruta sugerida: `company_id/product_id/uuid.ext`.
- Guardar la URL final en `primary_image_url` o en la entidad equivalente que use la plataforma.

### Resultado esperado

- Preview visible.
- Imagen principal actualizada.
- No publicar automáticamente.

## Diseño de imagen por URL

### Opción simple

- El usuario pega una URL pública y se guarda como imagen principal.

### Opción recomendada para producción

- El usuario pega la URL.
- El sistema descarga/copia la imagen a Storage.
- Se guarda la URL definitiva de Storage.

### Recomendación

La opción recomendada para producción es **copiar a Storage** y no depender permanentemente de WordPress/cPanel.

## Migración inicial desde la web actual

### Flujo futuro

1. Extraer URLs desde WordPress/cPanel.
2. Auditar cobertura.
3. Matchear por:
   - SKU
   - slug
   - nombre
   - revisión manual
4. Clasificar:
   - match confiable
   - match dudoso
   - sin imagen
   - imagen sin producto
5. Importar primero solo matches confiables.
6. No publicar productos automáticamente.
7. Generar reporte de cobertura.

## UI final deseada en ProductForm

- Preview actual.
- Campo URL imagen.
- Botón `Subir desde mi computador`.
- Botón `Importar desde URL` o `Usar URL`.
- Texto: `La importación masiva desde la web actual se hará en una fase posterior.`

## Seguridad

- No exponer `service_role` en frontend.
- Si la subida es desde cliente, usar políticas Storage seguras.
- Validar tamaño y tipo.
- No aceptar archivos peligrosos sin sanitización.
- Mantener las imágenes definitivas bajo control de Storage propio.

## Riesgos

- URLs externas inestables si se deja el modo simple.
- Archivos peligrosos o demasiado pesados.
- Dependencia permanente de WordPress/cPanel si no se copia a Storage.
- Mezcla accidental entre imágenes ya curadas y pendientes.

## Próximas fases recomendadas

- **6D.5E**: carga individual desde computador.
- **6D.5F**: curar 1 producto real con imagen definitiva.
- **6D.6**: migración masiva desde la web actual.
