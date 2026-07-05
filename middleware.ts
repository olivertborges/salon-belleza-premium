import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isDev = process.env.NODE_ENV === 'development'

  // Evitar interceptar archivos estáticos y APIs
  if (pathname.startsWith('/api/') || pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)) {
    return NextResponse.next()
  }

  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.next()
  }

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

  // Intentar obtener el usuario de la cookie
  const { data: { user } } = await supabase.auth.getUser()

  // 🛠️ BYPASS INTELIGENTE PARA DESARROLLO EN MÓVIL (TERMUX) 🛠️
  // Si estamos en desarrollo local y el navegador del celular se niega a enviar la cookie,
  // el servidor DEJA PASAR la petición. El archivo 'layout.tsx' o tu 'AuthContext' 
  // en el cliente (que sí tiene acceso al LocalStorage del teléfono) se encargará de validar
  // si realmente hay sesión y expulsarlo si es un intruso.
  if (!user && isDev) {
    console.log(`📱 [Termux Bypass] Sin cookie en el servidor para: ${pathname}. Delegando protección al cliente.`);
    return response
  }

  // FLUJO DE PRODUCCIÓN / CON COOKIES FUNCIONALES
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si hay cookie y usuario, validamos roles en el servidor normalmente
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'client'
    const isAdmin = ['admin', 'staff', 'owner'].includes(userRole)

    if (pathname.startsWith('/dashboard') && !isAdmin) {
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    if (pathname.startsWith('/portal') && isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (e) {
    // Si falla la base de datos, dejamos pasar y que el cliente resuelva
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*'],
}
