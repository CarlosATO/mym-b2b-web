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
