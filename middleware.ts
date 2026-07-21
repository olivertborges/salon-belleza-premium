import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { type ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Inicializamos la respuesta UNA SOLA VEZ
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Inicializamos Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: Partial<ResponseCookie> }[]) {
          // CORRECCIÓN: Modificamos las cookies sobre la respuesta existente, 
          // NUNCA volvemos a instanciar "NextResponse.next()" aquí adentro.
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // 3. Validamos el usuario. 
  // Si no hay sesión, supabase.auth.getUser() devolverá data.user = null de forma segura.
  const { data: { user } } = await supabase.auth.getUser()

  // 4. Lógica de protección de rutas públicas/privadas
  if (!user) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/portal')) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  // 5. Si está autenticado e intenta ir a /login, redirigir a su panel
  if (pathname === '/login') {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      const userRole = profile?.role || 'client'
      const isAdmin = ['admin', 'staff', 'owner'].includes(userRole)
      const target = isAdmin ? '/dashboard' : '/portal'
      
      return NextResponse.redirect(new URL(target, request.url))
    } catch (e) {
      return response
    }
  }

  // 6. Restricciones de Roles cruzados
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const userRole = profile?.role || 'client'
    const isAdmin = ['admin', 'staff', 'owner'].includes(userRole)

    if (pathname.startsWith('/dashboard') && !isAdmin) {
      return NextResponse.redirect(new URL('/portal', request.url))
    }

    if (pathname.startsWith('/portal') && isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (e) {
    // Si la base de datos falla temporalmente, dejamos pasar
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/portal/:path*',
    '/login'
  ],
}
