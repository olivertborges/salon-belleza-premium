import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { type ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Creamos la respuesta base única. NUNCA la volveremos a sobreescribir con "NextResponse.next()".
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Inicializar cliente Supabase SSR oficial
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: Partial<ResponseCookie> }[]) {
          // El método oficial muta las cookies directamente sobre los objetos existentes sin romper la instancia.
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // 3. Obtener sesión de forma segura
  const { data: { user } } = await supabase.auth.getUser()

  // --- COMPROBACIÓN DE RUTAS ---

  // CASO A: No hay sesión y se intenta acceder a zonas protegidas
  if (!user) {
    if (pathname === '/dashboard' || pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // CASO B: Sí hay sesión y está parado en /login
  if (pathname === '/login') {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      const userRole = profile?.role || 'client'
      const isAdmin = ['admin', 'staff', 'owner'].includes(userRole)

      // Si es admin va al dashboard inicial, si es cliente va al /portal
      return NextResponse.redirect(new URL(isAdmin ? '/dashboard' : '/portal', request.url))
    } catch (e) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // CASO C: Protección de rutas /admin contra clientes malintencionados
  if (pathname.startsWith('/admin')) {
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
