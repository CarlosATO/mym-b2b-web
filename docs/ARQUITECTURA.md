# Arquitectura del Sistema

La arquitectura de la nueva plataforma MYM Web B2B se compone de las siguientes tecnologías principales:

## Frontend (Next.js)
- **Framework**: Next.js (App Router).
- **Lenguaje**: TypeScript.
- **Estilos**: Tailwind CSS.
- **Renderizado**: Server Components (RSC) siempre que sea posible para maximizar el rendimiento y SEO.

## Backend y Base de Datos (Supabase)
- **Database**: PostgreSQL alojado en Supabase, utilizando un schema dedicado `web_b2b` para separar los datos B2B de los datos del ERP existente.
- **Autenticación**: Supabase Auth, compartido con el ERP, pero con tablas de autorización (`admin_access`, `customer_access`) separadas.
- **Storage**: Supabase Storage se utilizará en el futuro para almacenar imágenes de productos, banners y otros activos estáticos.

## Integración ERP (Bsale)
- **API REST**: Integración directa con la API de Bsale.
- **Sincronización**: Procesos de backend seguros se encargarán de sincronizar precios y stock desde Bsale hacia Supabase, o consultarlo en tiempo real según sea necesario.

## Hosting y Despliegue
- **Recomendación**: Railway o Vercel. Railway se recomienda para mantener un ecosistema junto a posibles servicios de backend adicionales.
- **Aislamiento**: Despliegue 100% independiente de la actual web WordPress.
