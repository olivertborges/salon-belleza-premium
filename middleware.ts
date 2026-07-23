import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // ✅ USAR getUser() EN LUGAR DE getSession() - MÁS CONFIABLE
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // ✅ LOG PARA DEPURACIÓN (opcional)
  // console.log('Middleware - User:', user?.email, 'Error:', userError?.message)

  const { pathname } = request.nextUrl

  // ✅ RUTAS PÚBLICAS
  const publicRoutes = ['/', '/servicios', '/galeria', '/login', '/register', '/auth/callback', '/auth/reset-password']
  const protectedRoutes = ['/agenda', '/portal', '/mis-citas', '/perfil']
  const adminRoutes = ['/admin']

  // ✅ SI ESTÁ EN /login O /register → DEJAR PASAR SIEMPRE
  if (pathname === '/login' || pathname === '/register') {
    return response
  }

  // ✅ SI ES RUTA PÚBLICA → DEJAR PASAR
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return response
  }

  // ✅ SI EL USUARIO ESTÁ LOGUEADO → DEJAR PASAR
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

  // ✅ NO HAY USUARIO Y LA RUTA ES PROTEGIDA → REDIRIGIR A LOGIN
  if (protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // ✅ NO HAY USUARIO Y LA RUTA ES DE ADMIN → REDIRIGIR A LOGIN
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