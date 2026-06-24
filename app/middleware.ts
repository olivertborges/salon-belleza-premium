import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 🔥 MIDDLEWARE DESACTIVADO EN DESARROLLO
// Para probar sin autenticación, simplemente permitimos todo

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 🆕 PERMITIR TODO EN DESARROLLO
  // Si estás en desarrollo, no bloquees nada
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  // ⚠️ SOLO EN PRODUCCIÓN SE APLICA LA AUTENTICACIÓN
  // Para producción, puedes descomentar el código de abajo
  // y asegurarte de tener las variables de entorno configuradas

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}
