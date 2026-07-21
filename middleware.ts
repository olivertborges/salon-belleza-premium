import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { type ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({
    request: { headers: request.headers }
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Sin sesión → solo permitir acceso a login y raíz
  if (!user) {
    if (pathname !== '/login' && pathname !== '/') {
      console.log('🔒 Sin sesión, redirigiendo a login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // ✅ CLAVE: No redirigir desde servidor en login/raíz → lo decide el cliente
  if (pathname === '/login' || pathname === '/') {
    return response
  }

  // Para rutas protegidas, verificamos el rol
  let userRole = 'client'
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    userRole = profile?.role || 'client'
  } catch (err) {
    console.error('Error obteniendo rol:', err)
  }

  const isAdmin = ['admin', 'staff', 'owner'].includes(userRole)

  if ((pathname === '/dashboard' || pathname.startsWith('/admin')) && !isAdmin) {
    console.log(`⛔ Acceso denegado a ${userRole}, redirigiendo a /portal`)
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  return response
}

export const config = {
  matcher: ['/', '/dashboard', '/admin/:path*', '/login', '/portal']
}
