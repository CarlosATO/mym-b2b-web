# Reporte Build sin Google Fonts (Fase 6D.6B-FIX)

## Contexto

Durante el cierre de 6D.6B, `npm run build` falló en un entorno con red restringida porque Next intentó descargar la fuente Inter desde Google Fonts durante la compilación.

El error observado fue:

```text
next/font: error:
Failed to fetch `Inter` from Google Fonts.
```

## Causa

La dependencia externa estaba en dos puntos operativos:

- `src/app/layout.tsx`: importaba `Inter` desde `next/font/google` y aplicaba `inter.variable` en el elemento `<html>`.
- `src/app/globals.css`: importaba Inter directamente desde `https://fonts.googleapis.com` y usaba `Inter` como primera fuente del stack global.

Esto hacía que el build pudiera depender de acceso externo a Google Fonts.

## Solución Aplicada

Se eliminó la carga externa de Inter:

- Se quitó `import { Inter } from "next/font/google"`.
- Se quitó la inicialización `const inter = Inter(...)`.
- Se quitó `inter.variable` del `className` del `<html>`.
- Se eliminó el `@import url(...)` a `fonts.googleapis.com`.
- Se cambió `--font-sans` y `body` a un stack de sistema.

Fuente final usada:

```css
system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, Helvetica, sans-serif
```

## Validación

- `npm run lint`: OK.
- `npm run build`: OK sin descargar Google Fonts.
- Búsqueda final sin referencias operativas a `next/font/google`, `fonts.googleapis.com`, `fonts.gstatic.com` o `Inter` en `src`.
- `package.json` mantiene el puerto local: `"dev": "next dev -p 3000"`.
- `package-lock.json` no fue modificado.

## Alcance de Seguridad

Este fix solo cambia layout/estilos y documentación.

No se ejecutó SQL, no se usó `db push`, `db pull` ni `migration repair`, no se llamó Bsale, no se llamó RPC apply, no se crearon/modificaron/borraron/publicaron productos, no se subieron/importaron imágenes, no se modificó Storage, no se tocaron precios ni stock, y no se interactuó con WordPress/WooCommerce/cPanel.
