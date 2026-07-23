import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // ✅ OBTENER SESIÓN DEL USUARIO
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  const { pathname } = request.nextUrl

  // ✅ RUTAS PÚBLICAS (no requieren autenticación)
  const publicRoutes = [
    '/',
    '/servicios',
    '/galeria',
    '/login',
    '/register',
    '/auth/callback',
    '/auth/reset-password'
  ]

  // ✅ RUTAS QUE REQUIEREN AUTENTICACIÓN
  const protectedRoutes = [
    '/agenda',
    '/portal',
    '/mis-citas',
    '/perfil',
    '/admin'
  ]

  // ✅ RUTAS DE ADMIN (requieren rol admin)
  const adminRoutes = ['/admin']

  // ✅ 1. SI ESTÁ EN /login Y NO HAY USUARIO → DEJAR PASAR (NO REDIRIGIR)
  if (pathname === '/login' && !user) {
    return response // ← ¡CRUCIAL! No redirigir
  }

  // ✅ 2. SI ESTÁ EN /register Y NO HAY USUARIO → DEJAR PASAR
  if (pathname === '/register' && !user) {
    return response
  }

  // ✅ 3. SI EL USUARIO ESTÁ LOGUEADO Y VA A /login → REDIRIGIR A PORTAL
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  // ✅ 4. VERIFICAR SI ES UNA RUTA PÚBLICA (permitir acceso)
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  if (isPublicRoute) {
    return response // ← Permitir acceso a rutas públicas
  }

  // ✅ 5. VERIFICAR SI ES UNA RUTA PROTEGIDA
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // 🔒 SI LA RUTA ES PROTEGIDA Y NO HAY USUARIO → REDIRIGIR A LOGIN
  if (isProtectedRoute && !user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // 👑 SI LA RUTA ES DE ADMIN Y EL USUARIO NO ES ADMIN → REDIRIGIR A PORTAL
  if (isProtectedRoute && user) {
    const isAdminRoute = adminRoutes.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    )

    if (isAdminRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/portal', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}