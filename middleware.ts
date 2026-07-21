import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 🔥 VARIABLE GLOBAL PARA LOGS
let logs: string[] = []

function addLog(message: string) {
  const timestamp = new Date().toLocaleTimeString()
  const log = `[${timestamp}] ${message}`
  logs.push(log)
  console.log(log)
}

function getLogsHTML() {
  return `
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
            max-width: 900px;
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
          .log-line {
            padding: 4px 0;
            border-bottom: 1px solid #1a1a1a;
            font-size: 13px;
          }
          .error { color: #ff4444; }
          .success { color: #44ff44; }
          .info { color: #44aaff; }
          .warning { color: #ffaa44; }
          .highlight { color: #ff6b9d; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔍 DIAGNÓSTICO DEL MIDDLEWARE</h1>
          ${logs.map(log => {
            let className = 'info'
            if (log.includes('❌') || log.includes('Error')) className = 'error'
            else if (log.includes('✅') || log.includes('éxito')) className = 'success'
            else if (log.includes('⚠️')) className = 'warning'
            else if (log.includes('👉') || log.includes('📍')) className = 'highlight'
            return `<div class="log-line ${className}">${log}</div>`
          }).join('')}
        </div>
      </body>
    </html>
  `
}

export async function middleware(request: NextRequest) {
  logs = []
  
  const { pathname } = request.nextUrl
  addLog(`📍 INICIO - Ruta: ${pathname}`)
  
  // 🔥 1. CREAR RESPUESTA
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 🔥 2. CREAR CLIENTE DE SUPABASE
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll()
          addLog(`📦 Cookies: ${cookies.length} encontradas`)
          return cookies
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // 🔥 3. USAR getSession() EN VEZ DE getUser()
  addLog(`👉 Obteniendo sesión...`)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    addLog(`❌ Error en sesión: ${sessionError.message}`)
  }

  const user = session?.user || null
  
  if (user) {
    addLog(`✅ Usuario: ${user.email}`)
    addLog(`👤 ID: ${user.id}`)
  } else {
    addLog(`⚠️ Sin sesión activa`)
  }

  // 🔥 4. RUTAS PÚBLICAS
  const publicPaths = ['/login', '/auth', '/reset-password']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  addLog(`📍 Ruta pública: ${isPublicPath ? '✅' : '❌'}`)

  // 🔥 5. SIN USUARIO
  if (!user) {
    if (isPublicPath || pathname === '/') {
      addLog(`✅ Permitido: ${pathname}`)
      return response
    }
    addLog(`🔒 Redirigiendo a /login`)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 🔥 6. OBTENER ROL
  let userRole = 'client'
  let isAdmin = false

  try {
    addLog(`👉 Obteniendo rol...`)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    userRole = profile?.role || 'client'
    isAdmin = ['admin', 'staff', 'owner'].includes(userRole)
    addLog(`✅ Rol: ${userRole} | Admin: ${isAdmin}`)
    
  } catch (error: any) {
    addLog(`❌ Error: ${error.message}`)
  }

  // 🔥 7. EN LOGIN
  if (pathname === '/login' || pathname === '/auth') {
    const destino = isAdmin ? '/dashboard' : '/portal'
    addLog(`🔄 Login → ${destino}`)
    return NextResponse.redirect(new URL(destino, request.url))
  }

  // 🔥 8. EN RAÍZ
  if (pathname === '/') {
    const destino = isAdmin ? '/dashboard' : '/portal'
    addLog(`🔄 Raíz → ${destino}`)
    return NextResponse.redirect(new URL(destino, request.url))
  }

  // 🔥 9. DASHBOARD
  if (pathname === '/dashboard') {
    if (!isAdmin) {
      addLog(`⛔ No admin → /portal`)
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    addLog(`✅ Admin en dashboard`)
    return response
  }

  // 🔥 10. ADMIN
  if (pathname.startsWith('/admin')) {
    if (!isAdmin) {
      addLog(`⛔ No admin → /portal`)
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    addLog(`✅ Admin en /admin`)
    return response
  }

  // 🔥 11. PORTAL
  if (pathname === '/portal') {
    addLog(`✅ Portal permitido`)
    return response
  }

  addLog(`✅ Ruta permitida: ${pathname}`)
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