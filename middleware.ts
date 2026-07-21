import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { type ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // CORRECCIÓN: Le asignamos el tipo explícito a cookiesToSet para que TypeScript compile en Vercel
        setAll(cookiesToSet: { name: string; value: string; options: Partial<ResponseCookie> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          supabaseResponse = NextResponse.next({
            request,
          })
          
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Obtener la sesión de forma segura
  const { data: { user } } = await supabase.auth.getUser()
  const url = request.nextUrl

  // 1. Si no hay usuario y entra a rutas protegidas -> ir a /login
  if (!user && (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/portal'))) {
    return NextResponse.redirect(new URL('/login', url))
  }

  // 2. Si ya hay usuario y está en /login -> redirigir según su rol
  if (user && url.pathname === '/login') {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      const role = profile?.role || 'client'
      const destination = ['admin', 'staff', 'owner'].includes(role) ? '/dashboard' : '/portal'
      return NextResponse.redirect(new URL(destination, url))
    } catch (e) {
      return NextResponse.redirect(new URL('/portal', url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
