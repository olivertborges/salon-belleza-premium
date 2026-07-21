import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Crear una respuesta inicial limpia
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Inicializar el cliente de Supabase SSR mutando de forma segura las cookies sin romper cabeceras
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
            response = NextResponse.next({
              request: { headers: request.headers },
            })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // 3. Obtener el usuario autenticado de forma segura
  const { data: { user } } = await supabase.auth.getUser()

  // 4. Si el usuario NO está autenticado y busca una ruta protegida -> Redirigir a /login
  if (!user) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/portal')) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  // 5. Si SÍ está autenticado, verificamos su rol para evitar accesos indebidos
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
    // Si la base de datos falla temporalmente, dejamos pasar para que resuelva el cliente
  }

  return response
}

// 6. El Matcher ampliado para interceptar todo correctamente excepto estáticos
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/portal/:path*',
    '/login'
  ],
}
