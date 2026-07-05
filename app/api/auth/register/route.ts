import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('\n==================================================')
  console.log('🚀 [REGISTRO OPTIMIZADO CON REFERIDO]')
  console.log('==================================================')

  try {
    const body = await request.json()
    // Añadimos referralCode a la desestructuración
    const { email, password, nombre, telefono, referralCode } = body

    if (!email || !password || !nombre) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const supabaseAdmin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const cleanEmail = email.trim().toLowerCase()
    console.log(`📤 Creando usuario: ${cleanEmail} | Referido: ${referralCode || 'Ninguno'}`)

    // Enviamos el referralCode en la metadata para que tu Trigger lo procese
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: nombre.trim(),
        phone: telefono || '',
        referral_code_used: referralCode || ''
      }
    })

    if (authError) {
      console.log('❌ Error en Auth Admin:', authError.message)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user?.id
    console.log(`✅ Usuario creado correctamente. ID: ${userId}`)

    // Login automático
    const supabasePublic = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: loginData, error: loginError } = await supabasePublic.auth.signInWithPassword({
      email: cleanEmail,
      password: password
    })

    return NextResponse.json({
      success: true,
      userId,
      session: loginData?.session || null
    })

  } catch (err: any) {
    console.log('❌ Error crítico en API de registro:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
