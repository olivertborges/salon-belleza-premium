import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 🔥 MIDDLEWARE DESACTIVADO - Permite todo el acceso
  console.log('📍 [Middleware] DESACTIVADO - Permitiendo todo el acceso')
  return NextResponse.next()
}

export const config = {
  matcher: [], // ❌ No matchea ninguna ruta
}