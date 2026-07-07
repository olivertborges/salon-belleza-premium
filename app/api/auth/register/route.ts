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
      console.log('⚠️ [LOG] Registro cancelado: Faltan campos obligatorios.')
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const supabaseAdmin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const cleanEmail = email.trim().toLowerCase()
    console.log(`📩 [LOG STEP 1] Intentando registrar: ${cleanEmail}`)

    // 1. Crear el usuario en auth.users
    console.log('📡 [LOG STEP 2] Creando usuario en auth.users...')
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
      console.log('❌ [LOG ERROR] Supabase Auth rechazó el registro:', authError.message)
      throw new Error(`Error en Auth Admin: ${authError.message}`)
    }

    const userId = authData.user?.id
    console.log(`🟢 [LOG STEP 3] Usuario creado en Auth. ID: ${userId}`)

    // Obtener el ID del negocio (tenant_id) de tu base de datos
    const { data: tenantData } = await supabaseAdmin.from('tenants').select('id').limit(1).single()
    const currentTenantId = tenantData?.id

    // Buscar si el código de referido existe para identificar al padrino
    let v_referrer_id = null
    if (referralCode) {
      const { data: referrerData } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('referral_code', referralCode.trim())
        .maybeSingle()
      
      if (referrerData) {
        v_referrer_id = referrerData.id
        console.log(`👤 [LOG REFERIDO] Padrino detectado con ID: ${v_referrer_id}`)
      }
    }

    // 2. Insertar al cliente en public.clients (Evitamos colisiones con un upsert por si acaso)
    console.log('📡 [LOG STEP 3.5] Creando registro en la tabla public.clients...')
    const { error: clientError } = await supabaseAdmin
      .from('clients')
      .upsert([
        {
          id: userId,
          auth_user_id: userId,
          name: nombre.trim(),
          email: cleanEmail,
          phone: telefono || '',
          referred_by_id: v_referrer_id,
          referral_code: 'REF-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          tenant_id: currentTenantId
        }
      ], { onConflict: 'id' })

    if (clientError) {
      console.log('❌ [LOG ERROR] La tabla public.clients rechazó al cliente!')
      throw new Error(`Error en public.clients: ${clientError.message}`)
    }
    console.log('🟢 [LOG STEP 3.6] Cliente asentado correctamente en public.clients.')

    // Definir los puntos de bienvenida oficiales (100 normales)
    const puntosInicialesGlow = 100
    const puntosInicialesHair = 0

    console.log(`📡 [LOG STEP 4] Insertando/Verificando en loyalty_wallets con 100 puntos...`)

    // 🌟 [PASO REPARADO CONTRA DUPLICADOS]: Cambiamos .insert por un .upsert controlado
    // Si la billetera ya existe debido al unique constraint, simplemente ignorará el duplicado o mantendrá el registro
    const { error: walletError } = await supabaseAdmin
      .from('loyalty_wallets')
      .upsert([
        {
          client_id: userId,
          tenant_id: currentTenantId,
          glow_points: puntosInicialesGlow,
          glow_points_earned: puntosInicialesGlow,
          glow_points_redeemed: 0,
          glow_level: 1,  
          hair_points: puntosInicialesHair,
          hair_points_earned: puntosInicialesHair,
          hair_points_redeemed: 0,
          hair_level: 1,  
          is_active: true
        }
      ], { onConflict: 'client_id,tenant_id' }) // Especificamos las columnas exactas del constraint que chocaba

    if (walletError) {
      console.log('❌ [LOG ERROR] La tabla loyalty_wallets rechazó la operación!')
      throw new Error(`Error en loyalty_wallets: ${walletError.message}`)
    }
    console.log('🟢 [LOG STEP 5] Billetera asegurada exitosamente con sus 100 puntos.')

    // 3. Si viene por un código de referido, premiamos al padrino con 500 puntos extra
    if (v_referrer_id) {
      console.log('📡 [LOG STEP 6] Aplicando bono de 500 puntos al padrino...')
      
      // Consultamos los puntos actuales del padrino para sumarle de forma segura
      const { data: currentWallet } = await supabaseAdmin
        .from('loyalty_wallets')
        .select('glow_points, glow_points_earned')
        .eq('client_id', v_referrer_id)
        .single()

      if (currentWallet) {
        await supabaseAdmin
          .from('loyalty_wallets')
          .update({ 
            glow_points: (currentWallet.glow_points || 0) + 500,
            glow_points_earned: (currentWallet.glow_points_earned || 0) + 500,
            updated_at: new Date() 
          })
          .eq('client_id', v_referrer_id)
      }

      // Asentar en transacciones el historial del nuevo cliente
      await supabaseAdmin.from('loyalty_transactions').insert([
        {
          client_id: userId,
          wallet_type: 'glow',
          points: puntosInicialesGlow,
          type: 'earned',
          category: 'welcome',
          description: `Bono de bienvenida inicial por invitación`
        }
      ])
    }

    console.log('🏁 [LOG FINAL] ¡Todo el flujo se completó con éxito total!')
    return NextResponse.json({ success: true, userId })

  } catch (err: any) {
    console.log('\n💥💥💥 [API CRASH LOG] 💥💥💥')
    console.log('Mensaje del error:', err.message)
    console.log('==================================================')
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
