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
  console.log("🔍 [DEBUG MIDDLEWARE] ¿Usuario encontrado en server?:", !!user);

  const { pathname } = request.nextUrl
  const isAdminPath = pathname.startsWith('/dashboard') || pathname.startsWith('/admin')
  const clientRoutes = ['/portal', '/academy', '/agenda', '/reservas', '/review', '/referidos', '/citas']
  const isGoingToClientPath = clientRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isAuthPage = pathname === '/login' || pathname === '/register'

  // SI NO HAY USUARIO
  if (!user) {
    if (isAdminPath || isGoingToClientPath) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // SI HAY USUARIO: Obtener rol solo si es necesario
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const userRole = profile?.role || 'client'
  const isActualAdmin = ['admin', 'staff', 'owner'].includes(userRole)

  // EVITAR BUCLES: Si está en login y ya tiene sesión, mandarlo a su sitio
  if (isAuthPage) {
    return NextResponse.redirect(new URL(isActualAdmin ? '/dashboard' : '/portal', request.url))
  }

  // REGLAS DE ACCESO
  if (!isActualAdmin && isAdminPath) return NextResponse.redirect(new URL('/portal', request.url))
  if (isActualAdmin && isGoingToClientPath && pathname !== '/portal') return NextResponse.redirect(new URL('/dashboard', request.url))

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
