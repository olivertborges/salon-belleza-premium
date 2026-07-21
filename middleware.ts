import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { type ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Crear respuesta inicial
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // 2. Cliente de Supabase SSR
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

          response = NextResponse.next({
            request: { headers: request.headers },
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // 3. Obtener el usuario autenticado desde la sesión segura
  const { data: { user } } = await supabase.auth.getUser()

  // --- REGLAS DE CONTROL DE ACCESO (SIN CONSULTAS A TABLAS) ---

  // Si NO hay sesión iniciada y quiere entrar a zonas protegidas
  if (!user) {
    if (pathname === '/login' || pathname === '/auth' || pathname === '/reset-password') {
      return response
    }
    // Si no está logueado y va a /dashboard o /portal, va directo a /login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si SÍ hay sesión iniciada e intenta entrar a la raíz o al login
  if (user && (pathname === '/login' || pathname === '/auth' || pathname === '/')) {
    // 💡 SOLUCIÓN: Lo mandamos a una ruta intermedia o directamente al portal genérico.
    // Deja que la página de destino decida si debe moverlo a /dashboard si es admin.
    const redirectRes = NextResponse.redirect(new URL('/portal', request.url))
    
    response.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value)
    })
    return redirectRes
  }

  return response
}

export const config = {
  // Protegemos explícitamente las rutas críticas
  matcher: ['/', '/login', '/auth', '/dashboard/:path*', '/admin/:path*', '/portal/:path*', '/reset-password'],
}
