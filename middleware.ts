import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { type ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Crear respuesta inicial limpia
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Inicializar cliente SSR de Supabase mutando cookies de forma segura
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
            response = NextResponse.next({
              request: { headers: request.headers },
            })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // 3. Obtener el usuario controlando el error de sesión ausente
  // Usamos un bloque interno para que "Auth session missing!" no rompa el Middleware
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user || null
  } catch (e) {
    // Si no hay sesión o falla la lectura, asumimos que no hay usuario autenticado
    user = null
  }

  // 4. Si el usuario NO está autenticado y busca una ruta protegida -> Redirigir a /login
  if (!user) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/portal')) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  // 5. Si ya está autenticado e intenta ir a /login, lo mandamos a su panel correspondiente
  if (user && pathname === '/login') {
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
      // Si falla la DB, lo dejamos pasar al flujo normal
    }
  }

  // 6. Si SÍ está autenticado, verificamos su rol para evitar accesos cruzados
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const userRole = profile?.role || 'client'
    const isAdmin = ['admin', 'staff', 'owner'].includes(userRole)

    // Si es un cliente intentando entrar al panel de administración
    if (pathname.startsWith('/dashboard') && !isAdmin) {
      return NextResponse.redirect(new URL('/portal', request.url))
    }

    // Si es un administrador intentando entrar a la vista de clientes
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
