import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Crear respuesta inicial
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // 2. Instanciar Supabase con asignación estricta de cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Actualizamos las cookies en la petición (para que Supabase las lea en esta misma ejecución)
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
          })

          // Re-instanciamos la respuesta para asegurar que viaje limpia con las nuevas cabeceras de petición
          response = NextResponse.next({
            request: { headers: request.headers },
          })

          // Fijamos las cookies en la respuesta final para el navegador
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // 3. Obtener el usuario
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user || null
  } catch (error) {
    user = null
  }

  // --- COMPROBACIÓN RÁPIDA DE RUTAS ---
  
  // Si no está logueado e intenta ir a zonas de admin
  if (!user && (pathname === '/dashboard' || pathname.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si está logueado e intenta entrar a /login
  if (user && pathname === '/login') {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      const userRole = profile?.role || 'client'
      const isAdmin = ['admin', 'staff', 'owner'].includes(userRole)

      return NextResponse.redirect(new URL(isAdmin ? '/dashboard' : '/portal', request.url))
    } catch (e) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Si un cliente intenta pisar /admin
  if (user && pathname.startsWith('/admin')) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      const userRole = profile?.role || 'client'
      const isAdmin = ['admin', 'staff', 'owner'].includes(userRole)

      if (!isAdmin) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard',
    '/admin/:path*',
    '/login'
  ],
}
