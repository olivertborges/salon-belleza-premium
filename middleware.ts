import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { type ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Creamos la respuesta base
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Inicializar cliente Supabase SSR
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

  // 3. Obtener usuario y perfil EN UNA SOLA CONSULTA
  const { data: { user } } = await supabase.auth.getUser()
  
  // Si no hay usuario, permitir acceso solo a login
  if (!user) {
    // Si está en ruta protegida, redirigir a login
    if (pathname !== '/login' && pathname !== '/') {
      console.log('🔒 Sin sesión, redirigiendo a login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // Obtener el rol del usuario
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
    
    console.log(`👤 Usuario: ${user.email} | Rol: ${userRole} | Admin: ${isAdmin}`)
  } catch (error) {
    console.error('Error obteniendo rol:', error)
    // Si hay error, asumir cliente
    userRole = 'client'
    isAdmin = false
  }

  // ============================================================
  // 📍 REGLAS DE REDIRECCIÓN - SIN BUCLE
  // ============================================================

  // 🔥 CASO 1: Usuario en /login → Redirigir según rol
  if (pathname === '/login') {
    const target = isAdmin ? '/dashboard' : '/portal'
    console.log(`🔄 Usuario autenticado en login, redirigiendo a: ${target}`)
    return NextResponse.redirect(new URL(target, request.url))
  }

  // 🔥 CASO 2: Usuario en /dashboard o /admin → Verificar rol
  if (pathname === '/dashboard' || pathname.startsWith('/admin')) {
    if (!isAdmin) {
      console.log(`⛔ Usuario ${userRole} intentando acceder a admin, redirigiendo a /portal`)
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    // Si es admin, permitir acceso
    return response
  }

  // 🔥 CASO 3: Usuario en /portal → Verificar que tenga acceso
  if (pathname === '/portal') {
    // Todos los usuarios autenticados pueden acceder a portal
    return response
  }

  // 🔥 CASO 4: Usuario en / → Determinar destino según rol
  if (pathname === '/') {
    const target = isAdmin ? '/dashboard' : '/portal'
    console.log(`🔄 Usuario en raíz, redirigiendo a: ${target}`)
    return NextResponse.redirect(new URL(target, request.url))
  }

  // ============================================================
  // ✅ CUALQUIER OTRA RUTA: Permitir acceso
  // ============================================================
  return response
}

// Configuración del middleware
export const config = {
  matcher: [
    /*
     * Coincidir con las rutas principales:
     * - Dashboard y admin
     * - Login
     * - Portal
     * - Raíz
     */
    '/',
    '/dashboard',
    '/admin/:path*',
    '/login',
    '/portal',
  ],
}