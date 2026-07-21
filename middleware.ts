import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { type ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Inicializar respuesta base
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // 2. Cliente Supabase SSR
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

  // 3. Obtener usuario de forma segura
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user || null
  } catch (error) {
    user = null
  }

  // --- CONTROL DE FLUJO EXACTO ---

  // CASO 1: No está autenticado e intenta entrar a zonas privadas (/dashboard o /admin)
  if (!user && (pathname === '/dashboard' || pathname.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // CASO 2: El usuario se acaba de loguear y está en /login (Redirección inicial)
  if (user && pathname === '/login') {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      const userRole = profile?.role || 'client'
      const isAdmin = ['admin', 'staff', 'owner'].includes(userRole)

      // El admin va a /dashboard, el cliente va a /portal
      const target = isAdmin ? '/dashboard' : '/portal'
      return NextResponse.redirect(new URL(target, request.url))
    } catch (e) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // CASO 3: Protección de la zona Admin (/admin/:path*)
  // Si un cliente intenta entrar a las rutas /admin, lo rebotamos a la raíz (/)
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

// 4. El Matcher perfecto para tu arquitectura
export const config = {
  matcher: [
    '/dashboard',    // Captura la entrada inicial del Admin
    '/admin/:path*', // Captura la navegación subsiguiente del Admin
    '/login'         // Captura el login para ambos
  ],
}
