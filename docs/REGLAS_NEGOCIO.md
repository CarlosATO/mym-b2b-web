# Reglas de Negocio

## Visitantes (Público)
- **Precios**: Un visitante no autenticado NUNCA ve precios de productos.
- **Stock**: Un visitante no autenticado NUNCA ve stock exacto (solo disponibilidad si se decide mostrar).
- **Catálogo**: Pueden explorar el catálogo, ver imágenes y descripciones.

## Clientes (Autenticados)
- **Precios**: Un cliente solo ve precios si está autenticado, tiene su cuenta en estado `approved` y `can_view_prices = true` en `web_b2b.customer_access`.
- **Stock**: Los clientes aprobados ven la disponibilidad general del producto (En stock, Poco stock, Sin stock), no el número exacto.
- **Precio Oficial**: El precio que ve el cliente proviene de Bsale (como fuente oficial).

## Administradores (Panel Admin)
- **Precios**: El administrador web no puede cambiar los precios oficiales desde el panel (esto se hace en Bsale).
- **Contenido**: El panel admin se usa para gestionar banners, imágenes, descripciones largas, promociones visuales, productos destacados y aprobar accesos de clientes.
- **Roles**: El acceso al panel depende de la tabla `web_b2b.admin_access` y sus roles definidos (`WEB_SUPER_ADMIN`, `WEB_ADMIN`, etc.).

## Sistema de Pagos
- El portal de pagos no forma parte del MVP inicial.

## Fase 2: Reglas de Autorización Base de Datos (RLS)
- **Visitantes:** La base de datos, por diseño, bloquea lectura a precios y stock.
- **Clientes Aprobados:** La lectura a `product_prices` está estrictamente condicionada a la función `web_b2b.customer_can_view_prices_for_company()`.
- **Protección de Stock Exacto:** Ningún cliente puede hacer un SELECT directo a la cantidad de stock en la base de datos, asegurando privacidad comercial.
- **Administradores:** Solo el rol `WEB_SUPER_ADMIN` puede escalar privilegios en `admin_access`, limitando drásticamente el riesgo de cuentas comprometidas, y las políticas están segmentadas por `company_id` (multi-tenant).

## Listas de Precios Futuras
- **MVP Actual:** Se usará el precio base desde Bsale para los clientes aprobados.
- **Evolución:** La arquitectura no debe bloquear listas de precio diferenciadas.
- **Modelo Sugerido:** 
  - Nuevas tablas: `web_b2b.price_lists`, `web_b2b.customer_price_lists`.
  - Atributo agregado: `product_prices.price_list_id`.
- **Regla Futura:** Cliente → Lista de precio asignada → Precio de producto por lista → Fallback al precio base.

## Eliminación de Datos (MVP)
- **Soft-Delete:** Los productos, marcas y categorías no se eliminan físicamente desde el panel administrativo. Se desactivan mediante las banderas `is_active = false` (y `is_visible = false` en el caso de productos).
- **Justificación:** Son parte del catálogo estructural y suelen sincronizarse desde el ERP (Bsale). Su eliminación física queda reservada para procesos de backend o `service_role`.
