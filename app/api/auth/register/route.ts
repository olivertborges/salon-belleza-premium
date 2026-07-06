import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('\n==================================================')
  console.log('🚀 [REGISTRO OPTIMIZADO CON REGALO DE BIENVENIDA Y WALLET VIP]')
  console.log('==================================================')

  try {
    const body = await request.json()
    const { email, password, nombre, telefono, referralCode } = body

    if (!email || !password || !nombre) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Usamos el cliente admin para tener superpoderes de escritura sin chocar con RLS
    const supabaseAdmin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const cleanEmail = email.trim().toLowerCase()
    console.log(`📤 Creando usuario: ${cleanEmail} | Referido: ${referralCode || 'Ninguno'}`)

    // 1. Crear el usuario en la autenticación de Supabase
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

    // 2. Determinar puntos iniciales por referidos
    // Si viene recomendado, le regalamos 500 puntos en Estética (glow) y 0 en Peluquería (hair)
    // Puedes ajustar el regalo a tu gusto
    const puntosInicialesGlow = referralCode ? 500 : 0
    const puntosInicialesHair = 0

    console.log(`🎁 Inicializando billetera VIP. Puntos iniciales Estética: ${puntosInicialesGlow}`)

    // 3. Crear su Billetera de Fidelización en 'loyalty_wallets'
    const { data: walletData, error: walletError } = await supabaseAdmin
      .from('loyalty_wallets')
      .insert([
        {
          client_id: userId,
          glow_points: puntosInicialesGlow,
          glow_points_earned: puntosInicialesGlow,
          glow_points_redeemed: 0,
          glow_level: 'bronce',
          hair_points: puntosInicialesHair,
          hair_points_earned: puntosInicialesHair,
          hair_points_redeemed: 0,
          hair_level: 'bronce',
          is_active: true
        }
      ])
      .select()
      .single()

    if (walletError) {
      console.log('⚠️ Error al crear la loyalty_wallet (No detiene el flujo):', walletError.message)
    } else if (puntosInicialesGlow > 0) {
      // 4. Si ganó puntos por referido, guardamos la transacción en el historial
      const { error: txError } = await supabaseAdmin
        .from('loyalty_transactions')
        .insert([
          {
            client_id: userId,
            wallet_type: 'glow', // Cuenta para el balance de estética
            points: puntosInicialesGlow,
            type: 'earned',
            category: 'referral',
            description: `Bono de bienvenida por código de referido: ${referralCode}`
          }
        ])
      
      if (txError) console.log('⚠️ Error al asentar transacción de referido:', txError.message)
    }

    // 5. Login automático para el cliente
    const supabasePublic = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: loginData } = await supabasePublic.auth.signInWithPassword({
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