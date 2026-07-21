import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 🔥 1. CREAR RESPUESTA BASE
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 🔥 2. CREAR CLIENTE DE SUPABASE
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // 🔥 3. OBTENER SESIÓN (USAR getSession EN VEZ DE getUser)
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user || null

  console.log(`📍 [Middleware] Ruta: ${pathname} | Usuario: ${user?.email || 'sin sesión'}`)

  // 🔥 4. RUTAS PÚBLICAS
  const publicPaths = ['/login', '/auth', '/reset-password']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // 🔥 5. SI NO HAY USUARIO
  if (!user) {
    // Si está en ruta pública, permitir acceso
    if (isPublicPath || pathname === '/') {
      console.log('📍 [Middleware] Sin sesión, permitiendo ruta pública')
      return response
    }
    // Si está en ruta protegida, redirigir a login
    console.log('🔒 [Middleware] Sin sesión, redirigiendo a login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 🔥 6. SI HAY USUARIO - OBTENER ROL DESDE LA SESIÓN PRIMERO
  // Intentar obtener el rol de la metadata de la sesión
  let userRole = session?.user?.user_metadata?.role || 'client'
  let isAdmin = ['admin', 'staff', 'owner'].includes(userRole)

  console.log(`👤 [Middleware] Usuario: ${user.email} | Rol de metadata: ${userRole}`)

  // Si no tenemos rol en la metadata, consultar la base de datos
  if (!userRole || userRole === 'client') {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        userRole = profile.role || 'client'
        isAdmin = ['admin', 'staff', 'owner'].includes(userRole)
        console.log(`👤 [Middleware] Rol de DB: ${userRole}`)
      }
    } catch (error) {
      console.error('❌ [Middleware] Error obteniendo rol:', error)
    }
  }

  // 🔥 7. SI ESTÁ EN LOGIN - REDIRIGIR SEGÚN ROL
  if (pathname === '/login' || pathname === '/auth') {
    const destino = isAdmin ? '/dashboard' : '/portal'
    console.log(`🔄 [Middleware] En login, redirigiendo a: ${destino}`)
    return NextResponse.redirect(new URL(destino, request.url))
  }

  // 🔥 8. SI ESTÁ EN RAÍZ - REDIRIGIR SEGÚN ROL
  if (pathname === '/') {
    const destino = isAdmin ? '/dashboard' : '/portal'
    console.log(`🔄 [Middleware] En raíz, redirigiendo a: ${destino}`)
    return NextResponse.redirect(new URL(destino, request.url))
  }

  // 🔥 9. SI ESTÁ EN DASHBOARD - VERIFICAR ROL
  if (pathname === '/dashboard') {
    if (!isAdmin) {
      console.log(`⛔ [Middleware] Usuario no admin en dashboard, redirigiendo a /portal`)
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    console.log(`✅ [Middleware] Admin autorizado en dashboard`)
    return response
  }

  // 🔥 10. SI ESTÁ EN ADMIN - VERIFICAR ROL
  if (pathname.startsWith('/admin')) {
    if (!isAdmin) {
      console.log(`⛔ [Middleware] Usuario no admin en admin, redirigiendo a /portal`)
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    console.log(`✅ [Middleware] Admin autorizado en /admin`)
    return response
  }

  // 🔥 11. SI ESTÁ EN PORTAL - PERMITIR
  if (pathname === '/portal') {
    console.log(`✅ [Middleware] Usuario en portal`)
    return response
  }

  // 🔥 12. CUALQUIER OTRA RUTA - PERMITIR
  console.log(`✅ [Middleware] Ruta permitida: ${pathname}`)
  return response
}

// 🔥 CONFIGURACIÓN
export const config = {
  matcher: [
    '/',
    '/login',
    '/auth',
    '/dashboard',
    '/admin/:path*',
    '/portal',
    '/reset-password',
  ],
}