import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  // TODO: Implementar validación real con Supabase Auth y SSR.
  // Por ahora, solo es una protección conceptual para evitar acceso directo accidental
  // a las rutas de admin sin pasar por un proceso de login (que aquí no está implementado real aún).
  
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  
  if (isAdminRoute) {
    // Aquí se debería obtener la sesión del usuario usando createServerClient de @supabase/ssr
    // const supabase = createServerClient(...)
    // const { data: { session } } = await supabase.auth.getSession()
    
    // Y luego, validar que el usuario tenga un registro activo en web_b2b.admin_access
    // con un rol válido (WEB_SUPER_ADMIN, WEB_ADMIN, etc.)
    
    // Si no hay sesión o no es admin, redirigir:
    // return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
