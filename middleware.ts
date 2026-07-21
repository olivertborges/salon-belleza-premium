import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 🔥 CASO 1: SIN USUARIO - Redirigir a login si está en ruta protegida
  if (!user) {
    const publicPaths = ['/login', '/']
    if (!publicPaths.includes(pathname)) {
      console.log('🔒 [Middleware] Sin sesión, redirigiendo a login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // 🔥 OBTENER ROL UNA SOLA VEZ
  let userRole = 'client'
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    userRole = profile?.role || 'client'
    console.log(`👤 [Middleware] Usuario: ${user.email} | Rol: ${userRole}`)
  } catch (error) {
    console.error('❌ [Middleware] Error obteniendo rol:', error)
  }

  const isAdmin = ['admin', 'staff', 'owner'].includes(userRole)
  const destino = isAdmin ? '/dashboard' : '/portal'

  // 🔥 CASO 2: EN LOGIN - Redirigir según rol
  if (pathname === '/login') {
    console.log(`🔄 [Middleware] En login, redirigiendo a: ${destino}`)
    return NextResponse.redirect(new URL(destino, request.url))
  }

  // 🔥 CASO 3: EN RUTA ADMIN - Verificar permisos
  if (pathname === '/dashboard' || pathname.startsWith('/admin')) {
    if (!isAdmin) {
      console.log(`⛔ [Middleware] Usuario ${userRole} en admin, redirigiendo a /portal`)
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    console.log(`✅ [Middleware] Admin autorizado en ${pathname}`)
    return response
  }

  // 🔥 CASO 4: EN PORTAL - Permitir acceso
  if (pathname === '/portal') {
    console.log(`✅ [Middleware] Usuario en portal`)
    return response
  }

  // 🔥 CASO 5: EN RAÍZ - Redirigir según rol
  if (pathname === '/') {
    console.log(`🔄 [Middleware] En raíz, redirigiendo a: ${destino}`)
    return NextResponse.redirect(new URL(destino, request.url))
  }

  return response
}

export const config = {
  matcher: ['/', '/dashboard', '/admin/:path*', '/login', '/portal']
}