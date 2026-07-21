import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ❌ SIN SESIÓN: solo protege rutas, NO redirige si ya estás en login
  if (!user) {
    if (pathname !== '/login' && pathname !== '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // ✅ SI ESTÁS EN LOGIN Y YA TENÉS SESIÓN: redirige UNA SOLA VEZ y listo
  if (pathname === '/login') {
    let userRole = 'client'
    try {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).maybeSingle()
      userRole = profile?.role || 'client'
    } catch {}

    const destino = ['admin','staff','owner'].includes(userRole) ? '/dashboard' : '/portal'
    console.log(`✅ Middleware: ya logueado → ${destino}`)
    return NextResponse.redirect(new URL(destino, request.url))
  }

  // Protección de rutas de admin
  let userRole = 'client'
  try {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).maybeSingle()
    userRole = profile?.role || 'client'
  } catch {}

  const isAdmin = ['admin','staff','owner'].includes(userRole)
  if ((pathname === '/dashboard' || pathname.startsWith('/admin')) && !isAdmin) {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  return response
}

export const config = {
  matcher: ['/', '/dashboard', '/admin/:path*', '/login', '/portal']
}
