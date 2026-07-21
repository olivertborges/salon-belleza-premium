import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 🔥 VARIABLE GLOBAL PARA LOGS (se reinicia en cada request)
let logs: string[] = []

function addLog(message: string) {
  const timestamp = new Date().toLocaleTimeString()
  const log = `[${timestamp}] ${message}`
  logs.push(log)
  console.log(log)
}

// 🔥 FUNCIÓN PARA GENERAR HTML DE LOGS
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
          .timestamp { color: #666; }
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
          <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #333; font-size: 12px; color: #666;">
            Total de pasos: ${logs.length}
          </div>
        </div>
      </body>
    </html>
  `
}

export async function middleware(request: NextRequest) {
  // 🔥 REINICIAR LOGS
  logs = []
  
  const { pathname } = request.nextUrl
  addLog(`📍 INICIO - Ruta solicitada: ${pathname}`)
  addLog(`📍 URL completa: ${request.url}`)
  
  // 🔥 1. CREAR RESPUESTA BASE
  addLog(`👉 Paso 1: Creando respuesta base...`)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 🔥 2. CREAR CLIENTE DE SUPABASE
  addLog(`👉 Paso 2: Creando cliente de Supabase...`)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll()
          addLog(`📦 Cookies encontradas: ${cookies.length}`)
          return cookies
        },
        setAll(cookiesToSet: any[]) {
          addLog(`📦 Estableciendo ${cookiesToSet.length} cookies`)
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // 🔥 3. OBTENER USUARIO
  addLog(`👉 Paso 3: Obteniendo usuario...`)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError) {
    addLog(`❌ Error obteniendo usuario: ${userError.message}`)
  }

  if (user) {
    addLog(`✅ Usuario encontrado: ${user.email}`)
    addLog(`👤 ID: ${user.id}`)
    addLog(`👤 Metadata: ${JSON.stringify(user.user_metadata)}`)
  } else {
    addLog(`⚠️ No hay usuario autenticado`)
  }

  // 🔥 4. VERIFICAR RUTAS PÚBLICAS
  addLog(`👉 Paso 4: Verificando si es ruta pública...`)
  const publicPaths = ['/login', '/auth', '/reset-password']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  addLog(`📍 ¿Es ruta pública? ${isPublicPath ? '✅ SI' : '❌ NO'}`)

  // 🔥 5. SI NO HAY USUARIO
  addLog(`👉 Paso 5: Verificando si hay usuario...`)
  if (!user) {
    addLog(`⚠️ Sin usuario autenticado`)
    
    if (isPublicPath || pathname === '/') {
      addLog(`✅ Ruta pública permitida: ${pathname}`)
      return showLogsPage(response)
    }
    
    addLog(`🔒 Ruta protegida sin usuario, redirigiendo a /login`)
    addLog(`👉 REDIRIGIENDO A: /login`)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 🔥 6. OBTENER ROL
  addLog(`👉 Paso 6: Obteniendo rol del usuario...`)
  let userRole = 'client'
  let isAdmin = false

  try {
    addLog(`📡 Consultando tabla profiles para: ${user.id}`)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      addLog(`❌ Error en profiles: ${profileError.message}`)
    }

    if (profile) {
      userRole = profile.role || 'client'
      addLog(`✅ Rol encontrado en DB: ${userRole}`)
    } else {
      addLog(`⚠️ No hay perfil, asignando rol por defecto: client`)
      userRole = 'client'
    }

    isAdmin = ['admin', 'staff', 'owner'].includes(userRole)
    addLog(`👤 Usuario: ${user.email} | Rol: ${userRole} | Admin: ${isAdmin}`)
    
  } catch (error: any) {
    addLog(`❌ Error obteniendo rol: ${error.message}`)
  }

  // 🔥 7. SI ESTÁ EN LOGIN
  addLog(`👉 Paso 7: Verificando si está en /login...`)
  if (pathname === '/login' || pathname === '/auth') {
    const destino = isAdmin ? '/dashboard' : '/portal'
    addLog(`🔄 Usuario en login, redirigiendo a: ${destino}`)
    addLog(`👉 REDIRIGIENDO A: ${destino}`)
    return NextResponse.redirect(new URL(destino, request.url))
  }

  // 🔥 8. SI ESTÁ EN RAÍZ
  addLog(`👉 Paso 8: Verificando si está en raíz...`)
  if (pathname === '/') {
    const destino = isAdmin ? '/dashboard' : '/portal'
    addLog(`🔄 Usuario en raíz, redirigiendo a: ${destino}`)
    addLog(`👉 REDIRIGIENDO A: ${destino}`)
    return NextResponse.redirect(new URL(destino, request.url))
  }

  // 🔥 9. SI ESTÁ EN DASHBOARD
  addLog(`👉 Paso 9: Verificando si está en /dashboard...`)
  if (pathname === '/dashboard') {
    addLog(`📍 Ruta: /dashboard | IsAdmin: ${isAdmin}`)
    if (!isAdmin) {
      addLog(`⛔ Usuario no admin en dashboard, redirigiendo a /portal`)
      addLog(`👉 REDIRIGIENDO A: /portal`)
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    addLog(`✅ Admin autorizado en dashboard`)
    return showLogsPage(response)
  }

  // 🔥 10. SI ESTÁ EN ADMIN
  addLog(`👉 Paso 10: Verificando si está en /admin...`)
  if (pathname.startsWith('/admin')) {
    addLog(`📍 Ruta: /admin | IsAdmin: ${isAdmin}`)
    if (!isAdmin) {
      addLog(`⛔ Usuario no admin en admin, redirigiendo a /portal`)
      addLog(`👉 REDIRIGIENDO A: /portal`)
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    addLog(`✅ Admin autorizado en /admin`)
    return showLogsPage(response)
  }

  // 🔥 11. SI ESTÁ EN PORTAL
  addLog(`👉 Paso 11: Verificando si está en /portal...`)
  if (pathname === '/portal') {
    addLog(`✅ Usuario en portal, acceso permitido`)
    return showLogsPage(response)
  }

  // 🔥 12. CUALQUIER OTRA RUTA
  addLog(`👉 Paso 12: Cualquier otra ruta: ${pathname}`)
  addLog(`✅ Ruta permitida: ${pathname}`)
  return showLogsPage(response)
}

// 🔥 FUNCIÓN PARA MOSTRAR PÁGINA DE LOGS
function showLogsPage(response: NextResponse) {
  const html = getLogsHTML()
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}

// 🔥 CONFIGURACIÓN
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