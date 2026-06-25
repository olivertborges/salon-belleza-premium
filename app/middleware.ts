import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // OBTENER ROL DESDE LA TABLA PROFILES (no desde user_metadata)
  let userRole = 'client'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = profile?.role || 'client'
  }

  console.log('🔍 Middleware - User:', user?.email, 'Role:', userRole, 'Path:', pathname)

  // --- DEFINICIÓN DE RUTAS ---
  const adminRoutes = ['/dashboard', '/admin', '/clientes', '/productos', '/servicios', '/admin/agenda']
  const clientRoutes = ['/portal', '/academy', '/agenda', '/reservas', '/review', '/referidos', '/citas']

  const isGoingToAdmin = adminRoutes.some(r => pathname.startsWith(r))
  const isGoingToClient = clientRoutes.some(r => pathname.startsWith(r))
  const isLoginPage = pathname === '/login' || pathname === '/register'

  // 1. SI NO HAY USUARIO Y QUIERE IR A RUTA PROTEGIDA → LOGIN
  if (!user) {
    if (isGoingToAdmin || isGoingToClient) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // 2. SI HAY USUARIO Y ESTÁ EN EL LOGIN O RAÍZ → REDIRIGIR SEGÚN ROL
  if (isLoginPage || pathname === '/') {
    const redirectUrl = userRole === 'admin' || userRole === 'staff' ? '/dashboard' : '/portal'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // 3. SEGURIDAD: ADMIN NO PUEDE IR A RUTAS DE CLIENTE Y VICEVERSA
  if (userRole !== 'admin' && userRole !== 'staff' && isGoingToAdmin) {
    return NextResponse.redirect(new URL('/portal', request.url))
  }
  
  if ((userRole === 'admin' || userRole === 'staff') && isGoingToClient) {
    // Los admin/staff pueden ir a rutas de cliente si quieren
    // Pero si quieres bloquearlo, descomenta la línea de abajo
    // return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
