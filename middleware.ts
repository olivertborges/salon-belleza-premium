import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 🔥 CREAR RESPUESTA
  let response = NextResponse.next()
  
  // 🔥 CREAR CLIENTE SUPABASE
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // 🔥 OBTENER SESIÓN
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user || null

  // 🔥 ============================================================
  // 🔥 REGLAS DE REDIRECCIÓN PARA TUS RUTAS
  // 🔥 ============================================================

  // 🔥 CASO 1: Sin usuario
  if (!user) {
    // Rutas públicas que NO requieren login
    if (pathname === '/login' || pathname === '/auth' || pathname === '/reset-password') {
      return response // ✅ Permitir
    }
    // Todo lo demás, redirigir a login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 🔥 CASO 2: Con usuario - obtener rol
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
    
    console.log(`👤 ${user.email} | Rol: ${userRole} | Admin: ${isAdmin}`)
  } catch (error) {
    console.error('Error obteniendo rol:', error)
  }

  // 🔥 ============================================================
  // 🔥 REDIRECCIONES SEGÚN RUTA
  // 🔥 ============================================================

  // 1. Si está en /login → Redirigir según rol
  if (pathname === '/login') {
    const destino = isAdmin ? '/dashboard' : '/portal'
    return NextResponse.redirect(new URL(destino, request.url))
  }

  // 2. Si está en / (raíz) → Redirigir según rol
  if (pathname === '/') {
    const destino = isAdmin ? '/dashboard' : '/portal'
    return NextResponse.redirect(new URL(destino, request.url))
  }

  // 3. Si está en /dashboard o /admin/* → SOLO ADMIN
  if (pathname === '/dashboard' || pathname.startsWith('/admin')) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    return response // ✅ Admin permitido
  }

  // 4. Si está en /portal → CUALQUIER USUARIO AUTENTICADO
  if (pathname === '/portal') {
    return response // ✅ Permitido
  }

  // 5. Cualquier otra ruta → Permitir
  return response
}

// 🔥 SOLO estas rutas ejecutan el middleware
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