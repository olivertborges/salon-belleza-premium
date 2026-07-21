import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { type ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Crear respuesta inicial estándar
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // 2. Cliente de Supabase SSR corregido para Next.js 14+
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { 
          return request.cookies.getAll() 
        },
        setAll(cookiesToSet: { name: string; value: string; options: Partial<ResponseCookie> }[]) {
          // Escribimos en request y en la respuesta original
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })

          // SOLUCIÓN CLAVE: Si Supabase muta cookies durante la verificación, 
          // refrescamos los headers de la respuesta base para que el servidor de Next los lea en este mismo ciclo.
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // 3. Obtener el usuario de forma segura
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user || null
  } catch (error) {
    user = null
  }

  // --- REGLAS DE ACCESO ---

  // Si NO hay usuario autenticado
  if (!user) {
    if (pathname === '/login' || pathname === '/auth' || pathname === '/reset-password') {
      return response
    }
    // Si intenta ir a zona protegida sin sesión, lo mandamos al login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si SÍ hay usuario, buscamos su rol
  let userRole = 'client'
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    userRole = profile?.role || 'client'
  } catch (error) {
    // Si falla la BD temporalmente, asumimos cliente para no romper el flujo
  }

  const isAdmin = ['admin', 'staff', 'owner'].includes(userRole)

  // Redirección inmediata si ya está logueado e intenta ir a páginas públicas o raíz
  if (pathname === '/login' || pathname === '/auth' || pathname === '/') {
    const destination = isAdmin ? '/dashboard' : '/portal'
    const redirectRes = NextResponse.redirect(new URL(destination, request.url))
    
    // IMPORTANTE: Copiamos las cookies de sesión refrescadas a la respuesta de redirección
    response.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value)
    })
    return redirectRes
  }

  // Si un cliente intenta entrar al dashboard o rutas /admin, lo mandamos a su portal
  if (!isAdmin && (pathname === '/dashboard' || pathname.startsWith('/admin'))) {
    const redirectRes = NextResponse.redirect(new URL('/portal', request.url))
    response.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value)
    })
    return redirectRes
  }

  // Si un admin cae por error en /portal, lo movemos al dashboard
  if (isAdmin && pathname === '/portal') {
    const redirectRes = NextResponse.redirect(new URL('/dashboard', request.url))
    response.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value)
    })
    return redirectRes
  }

  return response
}

export const config = {
  matcher: ['/', '/login', '/auth', '/dashboard', '/admin/:path*', '/portal', '/reset-password'],
}
