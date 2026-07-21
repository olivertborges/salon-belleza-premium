import { NextResponse } from 'next/server'

export function middleware() {
  // Apagado total. Deja pasar todas las peticiones del universo sin tocar cookies ni Supabase.
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
