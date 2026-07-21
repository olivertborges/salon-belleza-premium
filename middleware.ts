import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 🔥 SOLUCIÓN: Si estamos en /login, NO hacer nada
  if (pathname === '/login') {
    console.log('📍 [Middleware] En /login, permitiendo acceso sin redirección')
    return NextResponse.next()
  }

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

  // 🔥 CASO 1: SIN USUARIO
  if (!user) {
    // Si está en ruta protegida, redirigir a login
    if (pathname !== '/' && pathname !== '/login' && !pathname.startsWith('/api')) {
      console.log('🔒 [Middleware] Sin sesión, redirigiendo a login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // 🔥 OBTENER ROL (solo si es necesario)
  let userRole = 'client'
  let isAdmin = false
  
  // Solo obtener el rol si estamos en rutas que lo necesitan
  const needsRole = pathname === '/' || pathname === '/dashboard' || pathname.startsWith('/admin') || pathname === '/portal'
  
  if (needsRole) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      userRole = profile?.role || 'client'
      isAdmin = ['admin', 'staff', 'owner'].includes(userRole)
      console.log(`👤 [Middleware] Usuario: ${user.email} | Rol: ${userRole}`)
    } catch (error) {
      console.error('❌ [Middleware] Error obteniendo rol:', error)
    }
  }

  // 🔥 CASO 2: EN RAÍZ - Redirigir según rol
  if (pathname === '/') {
    const destino = isAdmin ? '/dashboard' : '/portal'
    console.log(`🔄 [Middleware] En raíz, redirigiendo a: ${destino}`)
    return NextResponse.redirect(new URL(destino, request.url))
  }

  // 🔥 CASO 3: EN DASHBOARD O ADMIN - Verificar permisos
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

  return response
}

export const config = {
  matcher: [
    /*
     * 🔥 IMPORTANTE: EXCLUIR /login del middleware
     * El middleware NO debe procesar la ruta de login
     */
    '/',
    '/dashboard',
    '/admin/:path*',
    '/portal',
    // '/login'  ← ELIMINADO: No procesar login
  ],
}