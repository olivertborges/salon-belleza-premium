import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // 3. Obtener usuario
  const { data: { user } } = await supabase.auth.getUser()

  // ============================================================
  // ✅ CASO 1: Usuario NO autenticado
  // ============================================================
  if (!user) {
    // Si intenta entrar a rutas protegidas, redirigir a login
    if (pathname.startsWith('/admin') || pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Si está en login o cualquier otra ruta pública, dejar pasar
    return response
  }

  // ============================================================
  // ✅ CASO 2: Usuario autenticado
  // ============================================================
  
  // Obtener el rol del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const userRole = profile?.role || 'client'
  const isAdmin = ['admin', 'staff', 'owner'].includes(userRole)

  // ============================================================
  // ✅ CASO 2a: Usuario en /login - REDIRIGIR SEGÚN ROL
  // ============================================================
  if (pathname === '/login') {
    console.log('🔐 Usuario autenticado en login, redirigiendo a:', isAdmin ? '/dashboard' : '/portal')
    return NextResponse.redirect(new URL(isAdmin ? '/dashboard' : '/portal', request.url))
  }

  // ============================================================
  // ✅ CASO 2b: Usuario en /dashboard o /admin - VERIFICAR ROL
  // ============================================================
  if (pathname.startsWith('/admin') || pathname === '/dashboard') {
    if (!isAdmin) {
      console.log('⛔ Usuario no autorizado en admin, redirigiendo a /portal')
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    // ✅ Usuario admin, dejar pasar
    return response
  }

  // ============================================================
  // ✅ CASO 2c: Usuario normal en /portal - dejar pasar
  // ============================================================
  return response
}

export const config = {
  matcher: [
    '/dashboard',
    '/admin/:path*',
    '/login',
    '/portal'
  ],
}