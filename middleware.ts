import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { type ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

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
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: Partial<ResponseCookie> }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set({ name, value, ...options })
              response = NextResponse.next({
                request: { headers: request.headers },
              })
              response.cookies.set({ name, value, ...options })
            })
          },
        },
      }
    )

    // Intentar obtener usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      throw new Error(`Error de Supabase Auth: ${authError.message}`)
    }

    // Lógica normal de rutas
    if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/portal'))) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return response

  } catch (err: any) {
    // ¡ESTO DETENDRÁ EL BUCLE Y MOSTRARÁ EL ERROR VISUALMENTE EN TU PANTALLA!
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Error de Middleware / Supabase</title>
          <style>
            body { font-family: sans-serif; padding: 40px; background: #fee2e2; color: #991b1b; }
            pre { background: #fff; padding: 20px; border-radius: 8px; overflow-x: auto; border: 1px solid #fecaca; }
          </style>
        </head>
        <body>
          <h1>🚨 Se atrapó un error en el Middleware</h1>
          <p>El bucle infinito ocurre por este problema exacto:</p>
          <pre>${err.stack || err.message || JSON.stringify(err)}</pre>
          <p><strong>Variables de entorno detectadas:</strong></p>
          <ul>
            <li>URL presente: ${Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)}</li>
            <li>KEY presente: ${Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}</li>
          </ul>
        </body>
      </html>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/portal/:path*',
    '/login'
  ],
}
