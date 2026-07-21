import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Respuesta por defecto
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // 2. Cliente de Supabase (con tipos básicos para que Vercel no proteste)
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
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // 3. Verificamos si hay sesión
  const { data: { user } } = await supabase.auth.getUser()

  // 4. SI NO ESTÁ LOGUEADO: Lo mandamos al login si intenta entrar a zonas protegidas
  if (!user) {
    if (pathname === '/login' || pathname === '/auth') {
      return response
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 5. SI SÍ ESTÁ LOGUEADO: Si intenta ir a la raíz o al login, lo mandamos directo al dashboard
  if (user && (pathname === '/login' || pathname === '/')) {
    const redirectRes = NextResponse.redirect(new URL('/dashboard', request.url))
    // Copiamos las cookies para no perder la sesión en el viaje
    response.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value)
    })
    return redirectRes
  }

  return response
}

export const config = {
  // Solo vigilamos estas rutas exactas
  matcher: ['/', '/login', '/dashboard/:path*', '/portal/:path*'],
}
