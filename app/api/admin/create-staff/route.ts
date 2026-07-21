// app/api/admin/create-staff/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // ✅ Verificar que las variables existen
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_URL no está definida')
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    const body = await request.json()
    const { email, name, role, tenantId } = body

    // Validar datos
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email y nombre son requeridos' },
        { status: 400 }
      )
    }

    // ... resto del código
  } catch (error) {
    console.error('Error en create-staff:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}