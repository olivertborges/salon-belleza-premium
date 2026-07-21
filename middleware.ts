import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 🔥 Crear respuesta
  let response = NextResponse.next()
  
  // 🔥 Cliente Supabase
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

  // 🔥 Obtener sesión
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user || null

  // 🔥 Si no hay usuario
  if (!user) {
    if (pathname === '/login' || pathname === '/auth' || pathname === '/reset-password') {
      return response
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 🔥 Obtener rol
  let userRole = 'client'
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    
    userRole = profile?.role || 'client'
  } catch (error) {
    console.error('Error:', error)
  }

  const isAdmin = ['admin', 'staff', 'owner'].includes(userRole)

  // 🔥 Reglas de redirección
  // Si está en login, redirigir
  if (pathname === '/login') {
    return NextResponse.redirect(new URL(isAdmin ? '/dashboard' : '/portal', request.url))
  }

  // Si está en raíz, redirigir
  if (pathname === '/') {
    return NextResponse.redirect(new URL(isAdmin ? '/dashboard' : '/portal', request.url))
  }

  // Si está en dashboard/admin y no es admin
  if ((pathname === '/dashboard' || pathname.startsWith('/admin')) && !isAdmin) {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  // Permitir el resto
  return response
}

export const config = {
  matcher: ['/', '/login', '/auth', '/dashboard', '/admin/:path*', '/portal', '/reset-password'],
}