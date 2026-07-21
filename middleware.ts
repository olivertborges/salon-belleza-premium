import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isDev = process.env.NODE_ENV === 'development'

  // 1. Crear una respuesta base limpia
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Crear el cliente de Supabase mutando de forma segura los headers
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 3. Obtener el usuario autenticado (Lee y refresca las cookies automáticamente)
  const { data: { user } } = await supabase.auth.getUser()

  // 🛠️ BYPASS PARA DESARROLLO MÓVIL (TERMUX)
  // Si estás probando localmente en el móvil y las cookies de servidor fallan, 
  // dejamos pasar la petición para que el AuthContext del cliente tome el control.
  if (!user && isDev) {
    console.log(`📱 [Termux Bypass] Sin cookie en el servidor para: ${pathname}. Delegando protección al cliente.`);
    return response
  }

  // 4. PROTECCIÓN: Si no hay usuario y no está el bypass activo, directo al login
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // 5. CONTROL DE ROLES EN SERVIDOR
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'client'
    const isAdmin = ['admin', 'staff', 'owner'].includes(userRole)

    // Redirecciones cruzadas basadas en roles
    if (pathname.startsWith('/dashboard') && !isAdmin) {
      console.log(`🚫 No autorizado para dashboard (${userRole}). Redirigiendo a /portal`)
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    
    if (pathname.startsWith('/portal') && isAdmin) {
      console.log(`👨‍💼 Admin detectado en ruta de cliente. Redirigiendo a /dashboard`)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (e) {
    console.error('⚠️ Error validando rol en Middleware, delegando al cliente:', e)
  }

  return response
}

// Configuración del Matcher: Evitamos interceptar archivos estáticos desde la raíz
export const config = {
  matcher: [
    /*
     * Match todas las rutas excepto:
     * - api (rutas de la API)
     * - login, register (vistas públicas de auth)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico, sitemap.xml, robots.txt (archivos SEO/Metas)
     * - extensiones comunes de imágenes/recursos
     */
    '/((?!api|login|register|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
