import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isDev = process.env.NODE_ENV === 'development'

  // ============================================
  // 🔓 RUTAS PÚBLICAS (NO requieren autenticación)
  // ============================================
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.some(r => pathname === r)

  // ============================================
  // 🔓 RUTAS DE API Y ESTÁTICOS
  // ============================================
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)) {
    return NextResponse.next()
  }

  // RUTAS PROTEGIDAS
  const adminRoutes = ['/dashboard', '/admin']
  const isAdminRoute = adminRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))

  const clientRoutes = ['/portal', '/academy', '/agenda', '/reservas', '/review', '/referidos', '/citas']
  const isClientRoute = clientRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))

  // ============================================
  // CREAR CLIENTE SUPABASE
  // ============================================
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // OBTENER USUARIO desde la cookie
  const { data: { user } } = await supabase.auth.getUser()

  // 🛠️ PARCHE CRÍTICO PARA TERMUX / MÓVIL EN DESARROLLO 🛠️
  // Si estamos en entorno local y no viene la cookie, dejamos pasar la petición para evitar el bucle infinito.
  // El cliente (AuthContext) se encargará de validar el LocalStorage y proteger la vista.
  if (!user && isDev && (isAdminRoute || isClientRoute)) {
    console.log(`⚠️ [Middleware Bypass] Sin cookie detectada en móvil local. Permitiendo paso a: ${pathname}`)
    return response
  }

  // ============================================
  // FLUJO NORMAL (PRODUCCIÓN O CON COOKIES)
  // ============================================
  if (!user) {
    if (isPublicRoute) return response
    if (isAdminRoute || isClientRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // Si hay usuario, intentamos leer el perfil
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'client'
    const isAdmin = ['admin', 'staff', 'owner'].includes(userRole)

    if (isPublicRoute) {
      return NextResponse.redirect(new URL(isAdmin ? '/dashboard' : '/portal', request.url))
    }

    if (!isAdmin && isAdminRoute) {
      return NextResponse.redirect(new URL('/portal', request.url))
    }

    if (isAdmin && isClientRoute && pathname !== '/portal') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (err) {
    console.error("[Middleware] Error cargando rol, continuando por defecto:", err)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
