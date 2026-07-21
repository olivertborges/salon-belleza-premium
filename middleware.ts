// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 🔥 Crear respuesta
  let response = NextResponse.next()
  
  // 🔥 Crear cliente de Supabase
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

  // 🔥 OBTENER SESIÓN
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user || null

  // 🔥 LOGS EN PANTALLA
  const logs = []
  logs.push(`📍 Ruta: ${pathname}`)
  logs.push(`👤 Usuario: ${user?.email || 'NO LOGUEADO'}`)

  // 🔥 Si NO hay usuario
  if (!user) {
    logs.push(`❌ No hay sesión`)
    logs.push(`👉 Redirigiendo a /login`)
    
    // Si está en ruta pública, dejar pasar
    if (pathname === '/login' || pathname === '/auth' || pathname === '/reset-password') {
      logs.push(`✅ Ruta pública, permitiendo acceso`)
      return showLogs(response, logs)
    }
    
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 🔥 Si HAY usuario, obtener rol
  let userRole = 'client'
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    
    userRole = profile?.role || 'client'
    logs.push(`✅ Rol: ${userRole}`)
  } catch (error: any) {
    logs.push(`❌ Error obteniendo rol: ${error.message}`)
  }

  const isAdmin = ['admin', 'staff', 'owner'].includes(userRole)

  // 🔥 REGLAS DE REDIRECCIÓN
  // 1. Si está en login, redirigir según rol
  if (pathname === '/login') {
    const destino = isAdmin ? '/dashboard' : '/portal'
    logs.push(`👉 Redirigiendo de /login a ${destino}`)
    return NextResponse.redirect(new URL(destino, request.url))
  }

  // 2. Si está en raíz, redirigir según rol
  if (pathname === '/') {
    const destino = isAdmin ? '/dashboard' : '/portal'
    logs.push(`👉 Redirigiendo de / a ${destino}`)
    return NextResponse.redirect(new URL(destino, request.url))
  }

  // 3. Si está en dashboard/admin y no es admin
  if ((pathname === '/dashboard' || pathname.startsWith('/admin')) && !isAdmin) {
    logs.push(`⛔ Usuario ${userRole} en admin, redirigiendo a /portal`)
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  // 4. Si está en portal, permitir
  if (pathname === '/portal') {
    logs.push(`✅ Portal permitido`)
    return showLogs(response, logs)
  }

  // 5. Cualquier otra ruta, permitir
  logs.push(`✅ Ruta permitida: ${pathname}`)
  return showLogs(response, logs)
}

// 🔥 Función para mostrar los logs
function showLogs(response: NextResponse, logs: string[]) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { 
            background: #0a0908; 
            color: #00ff00; 
            font-family: monospace; 
            padding: 20px;
            margin: 0;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: #141211;
            border: 2px solid #00ff00;
            border-radius: 12px;
            padding: 20px;
          }
          h1 { 
            color: #ff6b9d; 
            font-size: 18px;
            border-bottom: 1px solid #333;
            padding-bottom: 10px;
          }
          .log {
            padding: 6px 0;
            border-bottom: 1px solid #1a1a1a;
            font-size: 14px;
          }
          .error { color: #ff4444; }
          .success { color: #44ff44; }
          .info { color: #44aaff; }
          .warning { color: #ffaa44; }
          .highlight { color: #ff6b9d; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔍 DIAGNÓSTICO DEL MIDDLEWARE</h1>
          ${logs.map(log => {
            let className = 'info'
            if (log.includes('❌') || log.includes('Error')) className = 'error'
            else if (log.includes('✅')) className = 'success'
            else if (log.includes('⚠️')) className = 'warning'
            else if (log.includes('👉') || log.includes('📍')) className = 'highlight'
            return `<div class="log ${className}">${log}</div>`
          }).join('')}
          <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #333; font-size: 12px; color: #666;">
            Total: ${logs.length} pasos
          </div>
        </div>
      </body>
    </html>
  `
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
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