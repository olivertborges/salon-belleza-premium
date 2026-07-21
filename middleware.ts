import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 🔥 CREAR RESPUESTA
  let response = NextResponse.next()
  
  // 🔥 CREAR CLIENTE
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // 🔥 USAR getSession()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user || null

  // 🔥 RUTAS PÚBLICAS
  const publicPaths = ['/login', '/auth', '/reset-password']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // 🔥 SIN USUARIO
  if (!user) {
    if (isPublicPath || pathname === '/') {
      return response
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 🔥 OBTENER ROL
  let isAdmin = false
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    
    isAdmin = ['admin', 'staff', 'owner'].includes(profile?.role || 'client')
  } catch (error) {}

  // 🔥 EN LOGIN
  if (pathname === '/login' || pathname === '/auth') {
    return NextResponse.redirect(new URL(isAdmin ? '/dashboard' : '/portal', request.url))
  }

  // 🔥 EN RAÍZ
  if (pathname === '/') {
    return NextResponse.redirect(new URL(isAdmin ? '/dashboard' : '/portal', request.url))
  }

  // 🔥 DASHBOARD O ADMIN
  if (pathname === '/dashboard' || pathname.startsWith('/admin')) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    return response
  }

  // 🔥 PORTAL
  if (pathname === '/portal') {
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/auth',
    '/dashboard',
    '/admin/:path*',
    '/portal',
    '/reset-password',
  ],
}