// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Crear una respuesta inicial limpia
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Inicializar el cliente de Supabase SSR mutando de forma segura la cabecera 'Set-Cookie'
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Actualiza las cookies en la petición para que las rutas internas las lean
          request.cookies.set({ name, value, ...options })
          // Actualiza las cookies en la respuesta final que va al navegador
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 3. Obtener el usuario autenticado de forma segura (refresca tokens si es necesario)
  const { data: { user } } = await supabase.auth.getUser()

  // 4. Si el usuario NO está autenticado y busca una ruta protegida -> Redirigir a /login
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
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

// 6. El Matcher: Protege /dashboard y /portal, ignorando login, registro y estáticos
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/portal/:path*'
  ],
}
