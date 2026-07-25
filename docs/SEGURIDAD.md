# Seguridad B2B Web

El diseño del proyecto MYM B2B Web incorpora las siguientes medidas de seguridad obligatorias:

1. **Service Role Key Protegido**:
   - La clave `SUPABASE_SERVICE_ROLE_KEY` **nunca** debe ser expuesta al cliente (frontend).
   - El cliente `src/lib/supabase/admin.ts` tiene un import `server-only` para garantizar que no se incluya en el bundle del cliente accidentalmente.

2. **Bsale Token Protegido**:
   - `BSALE_ACCESS_TOKEN` **nunca** debe ser expuesto al cliente.
   - Las utilidades de Bsale (`src/lib/bsale/client.ts`) están protegidas con `server-only`.

3. **Autenticación vs Autorización**:
   - Las rutas de `/admin` requieren no solo una sesión válida, sino también una validación de rol contra la tabla `web_b2b.admin_access`.
   - Un usuario con cuenta en el ERP no tiene acceso a la web B2B ni al panel admin a menos que se le otorgue explícitamente en las tablas correspondientes (`customer_access` o `admin_access`).

4. **Protección de Datos (RLS)**:
   - Row Level Security (RLS) en Supabase es **obligatorio** antes de cargar datos reales. Las políticas determinarán que el público general solo pueda leer productos visibles y activos.

5. **Aislamiento del Legacy**:
   - La web actual WordPress/WooCommerce no se toca en absoluto. No se comparten bases de datos, claves ni usuarios directamente con WP.

6. **MFA para Administradores**:
   - Se recomienda fuertemente (y se marca en la BD) que los usuarios con roles administrativos tengan Multi-Factor Authentication (MFA) habilitado en Supabase Auth.

## Fase 2: Políticas de Acceso de Datos (RLS)
- **Visitante Anónimo (Público):** Solo puede consultar el catálogo público (marcas, categorías, productos visibles y activos) a través de políticas SELECT restringidas **vía funciones RPC (`get_public_*`)**. No hay acceso directo a las tablas base.
- **Cliente B2B Aprobado:** Puede consultar lo anterior y además tiene acceso a sus propios datos de acceso, y lectura a precios.
- **Protección Estricta de Precios y Stock:** `product_prices` **no es público** bajo ninguna circunstancia. El stock exacto (`product_stock.quantity`) **no se expone** a los clientes para evitar revelar información comercial sensible; la disponibilidad se informa a través de textos generales.
- **Admin Web:** La autorización administrativa se controla con funciones seguras, y los permisos granulares (crear, actualizar, borrar contenido) dependen del rol activo en `web_b2b.admin_access`.
- **Integridad de Catálogo (MVP):** Los content managers no tienen permisos de `DELETE` físico sobre `brands`, `categories` ni `products` para evitar pérdida accidental de data vital sincronizada desde el ERP. En su lugar, gestionan la visibilidad (`is_active=false`, `is_visible=false`).

## Fase 3.1: Conexión Segura de Frontend a RPCs
1. **Consumo Server-Side:** Toda la lógica de conexión con la base de datos se realiza en módulos `server-only` usando el cliente Supabase SSR configurado de forma segura (`createClient` de SSR).
2. **Consultas Restringidas por RPC:** El frontend público **no realiza consultas `.from('products')`** y similares; toda interacción está encapsulada a través de las RPCs `get_public_*` validadas por `target_company_id`.
3. **Validación Panel Admin:** El acceso a las rutas `/admin` verifica forzosamente que el usuario autenticado posea un registro activo en `web_b2b.admin_access`, mediante la función `getCurrentWebAdminAccess()`. Esto garantiza que tener cuenta en auth.users no otorga acceso de administración.
4. **Pendiente Técnico (TODO MFA):** Se configuró el flag `mfa_required=true` en el bootstrap de la cuenta `WEB_SUPER_ADMIN`. Actualmente el sistema advierte sobre este requerimiento, pero la validación técnica real del nivel `AAL2` mediante Supabase Auth está pendiente para una fase posterior de estabilización.
