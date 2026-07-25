# Estándares de Código y Mantenibilidad

Este documento define las reglas de calidad, arquitectura y buenas prácticas que deben seguirse estrictamente en el desarrollo de la plataforma B2B.

## 1. Tamaño y Modularidad de Archivos
- **Evitar archivos grandes:** Es mandatorio mantener los archivos pequeños y enfocados.
- **Ideal:** Entre 300 y 500 líneas por archivo.
- **Máximo excepcional:** 1000 líneas.
- **Acción requerida:** Si un archivo se acerca o supera las 1000 líneas, DEBE dividirse en módulos más pequeños.

## 2. Separación de Responsabilidades
- **Componentes visuales:** Deben ubicarse exclusivamente en `src/components`.
- **Lógica de negocio:** Debe residir en `src/lib` o en servicios dedicados, no mezclada en la UI.
- **Tipos de TypeScript:** Todos los tipos e interfaces deben estar centralizados o estructurados en `src/types`.
- **Acceso a datos:** Las consultas a la base de datos o APIs deben estar separadas de la interfaz de usuario.
- **Validaciones:** Deben estar separadas y ser reutilizables.
- **Utilidades:** Las funciones de ayuda o genéricas deben ir en `src/lib/utils`.

## 3. Componentes
- **Evitar componentes gigantes:** Mantenerlos enfocados en una sola responsabilidad.
- **Modularización UI:** Separar claramente cards, filtros, layouts, formularios y tablas en sus propios archivos.
- **Fetch de Datos:** No mezclar fetch de datos complejo dentro de componentes visuales (Client Components) si puede abstraerse en Server Components o hooks/servicios separados.

## 4. Seguridad Estricta
- **`server-only`:** Nunca importar utilidades marcadas con `server-only` (como clientes de DB o APIs privadas) en componentes cliente (`"use client"`).
- **Service Role:** Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al frontend.
- **Bsale Token:** Nunca exponer `BSALE_ACCESS_TOKEN` al frontend.
- **Privacidad de Precios:** Nunca mostrar precios ni disponibilidad exacta a visitantes no autenticados o clientes no aprobados.

## 5. Calidad del Código
- **Validación Continua:** Ejecutar `npm run lint` y `npm run build` obligatoriamente antes de dar por cerrada cada fase o tarea.
- **Nomenclatura:** Mantener nombres claros, descriptivos y en inglés o español según la convención acordada, pero siempre consistentes.
- **DRY (Don't Repeat Yourself):** Evitar código duplicado a toda costa; abstraer en funciones o componentes reutilizables.
- **Documentación:** Documentar decisiones arquitectónicas importantes y mantener actualizados los archivos en `/docs`.
