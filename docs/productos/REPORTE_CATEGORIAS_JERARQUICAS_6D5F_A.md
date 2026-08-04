# Reporte - Visualización Jerárquica de Categorías (Fase 6D.5F-A)

- **Fecha/hora local**: 2026-08-04 12:13 (-0400)
- **Ámbito**: administración de categorías, selector dependiente en productos y selector de padre en categorías
- **Sin cambios de datos**: no SQL, no schema, no productos, no precios, no stock

## Objetivo

Mostrar la estructura real de categorías y subcategorías de forma clara, sin cambiar la base de datos.

## Decisión arquitectónica

- No se cambió `parent_id`.
- No se agregó `subcategory_id`.
- `category_id` sigue representando la categoría final asignada al producto.
- Las categorías padre agrupan y las subcategorías clasifican.

## Implementación

- Helper compartido de jerarquía: `src/lib/utils/category-hierarchy.ts`
- Vista admin de categorías: ahora renderiza padre primero y subcategorías debajo con sangría visual.
- Selector en `ProductForm`: usa `Categoría principal` + `Subcategoría` y muestra la ruta final solo como apoyo.
- Selector de padre en `CategoryForm`: también muestra rutas jerárquicas y evita elegir la propia categoría o sus descendientes.

## Resultado visual

- Categorías padre visibles como nivel raíz.
- Subcategorías mostradas como hijas, con sangría y badges más compactos.
- La columna de estados quedó más densa, en una sola línea cuando cabe.

## Validación funcional

- El producto puede seguir asignándose a una sola `category_id`.
- La validación de publicación segura sigue igual.
- Si la categoría principal tiene subcategorías, publicar exige una subcategoría específica.
- `category_id` final sigue representando la clasificación elegida del producto.

## Pendiente

- Si se requieren más niveles profundos, el helper ya soporta árbol recursivo.
- No hay cambios de datos ni migraciones asociadas.
