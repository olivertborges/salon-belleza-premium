import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('\n==================================================')
  console.log('🚀 [REGISTRO OPTIMIZADO PARA TRIGGER DE LA BD]')
  console.log('==================================================')

  try {
    const body = await request.json()
    const { email, password, nombre, telefono } = body

    if (!email || !password || !nombre) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Cliente administrativo para la creación
    const supabaseAdmin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const cleanEmail = email.trim().toLowerCase()
    console.log(`📤 Creando usuario en Auth y enviando metadata al trigger: ${cleanEmail}`)

    // Creamos el usuario enviando el nombre y teléfono en user_metadata.
    // El trigger handle_new_user se encargará de rellenar profiles, clients y loyalty_wallets.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: nombre.trim(),
        phone: telefono || ''
      }
    })

    if (authError) {
      console.log('❌ Error en Auth Admin:', authError.message)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user?.id
    console.log(`✅ Usuario creado e hilos de la BD ejecutados. ID: ${userId}`)

    // Generamos inicio de sesión automático inmediato con el cliente público
    console.log('🔑 Generando inicio de sesión automático...')
    const supabasePublic = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: loginData, error: loginError } = await supabasePublic.auth.signInWithPassword({
      email: cleanEmail,
      password: password
    })

    if (loginError) {
      console.log('⚠️ Registro completo, pero el login inmediato falló:', loginError.message)
      return NextResponse.json({ 
        success: true, 
        userId, 
        requireManualLogin: true,
        message: 'Cuenta lista. Por favor, inicia sesión de forma manual.' 
      })
    }

    console.log('🎉 [REGISTRO Y CONFIGURACIÓN AUTOMÁTICA COMPLETADOS CON ÉXITO]')
    return NextResponse.json({
      success: true,
      userId,
      session: loginData.session
    })

  } catch (err: any) {
    console.log('❌ Error crítico en pasarela superior:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
