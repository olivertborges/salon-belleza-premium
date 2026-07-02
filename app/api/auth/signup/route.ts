import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('📝 [API] Iniciando registro...')
  
  const cookieStore = cookies()
  const { email, password, fullName, phone } = await request.json()
  
  console.log('📧 Email:', email)
  console.log('👤 Nombre:', fullName)

  const response = NextResponse.json({ success: true })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 1. Crear usuario
  console.log('📤 [API] Llamando a signUp...')
  
  const { data, error: signUpError } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password: password.trim(),
    options: {
      data: {
        full_name: fullName.trim(),
        phone: phone?.trim() || '',
      }
    }
  })

  console.log('📦 [API] Respuesta de signUp:')
  console.log('  - data:', data)
  console.log('  - error:', signUpError)

  if (signUpError) {
    console.log('❌ [API] Error en signUp:', signUpError.message)
    return NextResponse.json({ error: signUpError.message }, { status: 400 })
  }

  if (!data?.user) {
    console.log('❌ [API] No se recibió usuario en la respuesta')
    return NextResponse.json({ error: 'No se pudo crear el usuario' }, { status: 400 })
  }

  console.log('✅ [API] Usuario creado:', data.user.id)

  // 2. Obtener tenant
  console.log('📤 [API] Buscando tenant...')
  
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('name', 'Salon Fresh Nails')
    .single()

  if (tenantError) {
    console.log('⚠️ [API] Error al obtener tenant:', tenantError.message)
  }

  const tenantId = tenant?.id
  console.log('  - tenantId:', tenantId)

  // 3. Crear perfil
  console.log('📤 [API] Creando perfil...')
  
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: data.user.id,
      tenant_id: tenantId,
      email: email.trim().toLowerCase(),
      full_name: fullName.trim(),
      role: 'client',
      is_active: true,
    })

  if (profileError) {
    console.log('❌ [API] Error al crear perfil:', profileError.message)
  } else {
    console.log('✅ [API] Perfil creado')
  }

  // 4. Crear cliente
  console.log('📤 [API] Creando cliente...')
  
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      auth_user_id: data.user.id,
      tenant_id: tenantId,
      profile_id: data.user.id,
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      points: 100,
      is_active: true,
    })
    .select('id')
    .single()

  if (clientError) {
    console.log('❌ [API] Error al crear cliente:', clientError.message)
  } else {
    console.log('✅ [API] Cliente creado:', client?.id)
  }

  // 5. Crear wallet
  if (client) {
    console.log('📤 [API] Creando wallet...')
    
    const { error: walletError } = await supabase
      .from('loyalty_wallets')
      .insert({
        client_id: client.id,
        tenant_id: tenantId,
        glow_points: 0,
        hair_points: 100,
      })

    if (walletError) {
      console.log('❌ [API] Error al crear wallet:', walletError.message)
    } else {
      console.log('✅ [API] Wallet creada')
    }
  }

  console.log('🎉 [API] Proceso completado para:', email)

  return NextResponse.json({ 
    success: true, 
    user: data.user,
    client: client 
  })
}
