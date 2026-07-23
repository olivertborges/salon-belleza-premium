import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // ✅ Crear una respuesta que pueda modificar las cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // ✅ Crear el cliente de Supabase con manejo correcto de cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // ✅ REFRESCAR LA SESIÓN - Esto es CRUCIAL para que el middleware detecte al usuario
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  const { pathname } = request.nextUrl

  // ✅ RUTAS PÚBLICAS (siempre accesibles)
  const publicRoutes = ['/', '/servicios', '/galeria', '/login', '/register', '/auth/callback', '/auth/reset-password']

  // ✅ RUTAS PROTEGIDAS
  const protectedRoutes = ['/agenda', '/portal', '/mis-citas', '/perfil']

  // ✅ RUTAS DE ADMIN
  const adminRoutes = ['/admin']

  // 🔥 1. SI ESTÁ EN /login O /register → DEJAR PASAR SIEMPRE
  if (pathname === '/login' || pathname === '/register') {
    return response
  }

  // 🔥 2. SI ES RUTA PÚBLICA → DEJAR PASAR
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return response
  }

  // 🔥 3. SI EL USUARIO ESTÁ LOGUEADO → DEJAR PASAR
  if (user) {
    // Verificar admin solo para /admin
    if (pathname.startsWith('/admin')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/portal', request.url))
      }
    }
    return response
  }

  // 🔥 4. NO HAY USUARIO Y LA RUTA ES PROTEGIDA → REDIRIGIR A LOGIN
  if (protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // 🔥 5. NO HAY USUARIO Y LA RUTA ES DE ADMIN → REDIRIGIR A LOGIN
  if (adminRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}