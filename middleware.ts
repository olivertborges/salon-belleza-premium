import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 🔥 1. CREAR RESPUESTA BASE
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 🔥 2. CREAR CLIENTE DE SUPABASE CON TIPOS CORRECTOS
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: Partial<ResponseCookie> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // 🔥 3. OBTENER USUARIO
  const { data: { user } } = await supabase.auth.getUser()

  // 🔥 4. RUTAS PÚBLICAS (NO REQUIEREN AUTENTICACIÓN)
  const publicPaths = ['/login', '/auth', '/reset-password']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // 🔥 5. SI NO HAY USUARIO
  if (!user) {
    // Si está en ruta pública, permitir acceso
    if (isPublicPath || pathname === '/') {
      return response
    }
    // Si no, redirigir a login
    console.log('🔒 [Middleware] Sin sesión, redirigiendo a login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 🔥 6. SI HAY USUARIO - OBTENER ROL
  let userRole = 'client'
  let isAdmin = false

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    userRole = profile?.role || 'client'
    isAdmin = ['admin', 'staff', 'owner'].includes(userRole)
    
    console.log(`👤 [Middleware] ${user.email} | Rol: ${userRole} | Admin: ${isAdmin}`)
  } catch (error) {
    console.error('❌ [Middleware] Error obteniendo rol:', error)
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

  // 🔥 9. RUTAS DE ADMIN - VERIFICAR ROL
  if (pathname.startsWith('/admin') || pathname === '/dashboard') {
    if (!isAdmin) {
      console.log(`⛔ [Middleware] ${userRole} en admin, redirigiendo a /portal`)
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    console.log(`✅ [Middleware] Admin autorizado en ${pathname}`)
    return response
  }

  // 🔥 10. RUTA PORTAL - PERMITIR ACCESO
  if (pathname === '/portal') {
    console.log(`✅ [Middleware] Usuario en portal`)
    return response
  }

  // 🔥 11. CUALQUIER OTRA RUTA - PERMITIR
  console.log(`✅ [Middleware] Ruta permitida: ${pathname}`)
  return response
}

// 🔥 12. CONFIGURACIÓN - SOLO RUTAS IMPORTANTES
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