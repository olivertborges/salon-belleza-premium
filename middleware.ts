import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
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

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // 1. Obtener el rol real desde la base de datos
  let userRole = 'client'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = profile?.role || 'client'
  }

  console.log('🛡️ [MIDDLEWARE SEGURIDAD] Email:', user?.email || 'Nadie', '| Role:', userRole, '| Path:', pathname)

  // Definición de rutas según el rol
  const isAdminPath = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/clientes') || pathname.startsWith('/productos') || pathname.startsWith('/servicios')
  const clientRoutes = ['/portal', '/academy', '/agenda', '/reservas', '/review', '/referidos', '/citas', '/fidelizacion']
  const isGoingToClientPath = clientRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isLoginPage = pathname === '/login' || pathname === '/register'

  // REGLA 1: SI NO HAY SESIÓN ACTIVA
  if (!user) {
    if (isAdminPath || isGoingToClientPath) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // REGLA 2: SI ESTÁ LOGUEADO E INTENTA IR A LOGIN O LA RAÍZ
  if (isLoginPage || pathname === '/') {
    const redirectUrl = (userRole === 'admin' || userRole === 'staff' || userRole === 'owner') ? '/dashboard' : '/portal'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // REGLA 3: PROTECCIÓN DE RUTAS DE ADMIN (Si NO es admin y quiere entrar a rutas de admin -> Al portal de cliente)
  const isActualAdmin = userRole === 'admin' || userRole === 'staff' || userRole === 'owner'
  
  if (!isActualAdmin && isAdminPath) {
    console.warn(`⚠️ Bloqueado: Cliente intentó entrar a ruta admin: ${pathname}`)
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  // REGLA 4: PROTECCIÓN DE RUTAS DE CLIENTE (Si SÍ es admin y quiere entrar al portal de clientes -> Al dashboard)
  if (isActualAdmin && isGoingToClientPath) {
    console.warn(`⚠️ Bloqueado: Admin intentó entrar a ruta cliente: ${pathname}`)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
