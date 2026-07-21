import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 🔥 Crear respuesta base única
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // 🔥 Cliente Supabase con sincronización de cookies correcta
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { 
          return request.cookies.getAll() 
        },
        setAll(cookiesToSet) {
          // Es OBLIGATORIO actualizar tanto la petición como la respuesta
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // 🔥 SOLUCIÓN AL BUCLE: Cambiamos getSession por getUser
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user || null
  } catch (error) {
    user = null
  }

  // 🔥 Si no hay usuario autenticado
  if (!user) {
    // Si ya va a una página pública, lo dejamos pasar de largo
    if (pathname === '/login' || pathname === '/auth' || pathname === '/reset-password') {
      return response
    }
    // Si intenta ir a cualquier otra ruta protegida, al login de cabeza
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 🔥 Obtener el rol desde la base de datos
  let userRole = 'client'
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    userRole = profile?.role || 'client'
  } catch (error) {
    console.error('Error al obtener perfil:', error)
  }

  const isAdmin = ['admin', 'staff', 'owner'].includes(userRole)

  // 🔥 Reglas de redirección precisas

  // Si ya inició sesión e intenta entrar a /login, /auth o a la raíz '/'
  if (pathname === '/login' || pathname === '/auth' || pathname === '/') {
    const target = isAdmin ? '/dashboard' : '/portal'
    return NextResponse.redirect(new URL(target, request.url))
  }

  // Si es un cliente común e intenta colarse en /dashboard o /admin/...
  if (!isAdmin && (pathname === '/dashboard' || pathname.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  // Si es un administrador e intenta ir a /portal (asumiendo que los admins no deben estar ahí)
  if (isAdmin && pathname === '/portal') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/', '/login', '/auth', '/dashboard', '/admin/:path*', '/portal', '/reset-password'],
}
