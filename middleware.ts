import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Definimos la estructura exacta que espera Supabase para las opciones de cookies
interface CookieOption {
  name: string
  value: string
  options: any // Usamos any aquí para evitar traer el módulo conflictivo de Next
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Crear respuesta inicial estándar
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // 2. Cliente de Supabase SSR con tipado explícito nativo
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { 
          return request.cookies.getAll() 
        },
        // Declaramos explícitamente el tipo de cookiesToSet para complacer a TypeScript
        setAll(cookiesToSet: CookieOption[]) {
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

  // 3. Obtener el usuario de forma segura
  const { data: { user } } = await supabase.auth.getUser()

  // --- REGLAS DE ACCESO ---

  // Si NO hay usuario autenticado y va a zonas protegidas
  if (!user) {
    if (pathname === '/login' || pathname === '/auth' || pathname === '/reset-password') {
      return response
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si SÍ hay usuario e intenta entrar a páginas de acceso público
  if (user && (pathname === '/login' || pathname === '/auth' || pathname === '/')) {
    const redirectRes = NextResponse.redirect(new URL('/portal', request.url))
    response.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value)
    })
    return redirectRes
  }

  return response
}

export const config = {
  matcher: ['/', '/login', '/auth', '/dashboard/:path*', '/admin/:path*', '/portal/:path*', '/reset-password'],
}
