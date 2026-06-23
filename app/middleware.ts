import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Rutas públicas (no requieren autenticación)
  const publicRoutes = ['/login', '/register', '/']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Rutas de admin
  const isAdminRoute = pathname.startsWith('/admin')
  const isDashboardRoute = pathname.startsWith('/dashboard')

  // Si no hay sesión y no es ruta pública → redirigir a login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Si hay sesión y está en login/register → redirigir según rol
  if (session && (pathname === '/login' || pathname === '/register')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Si es ruta de admin y el usuario no es admin → redirigir a home
  if (isAdminRoute || isDashboardRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session?.user?.id || '')
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}
