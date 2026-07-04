import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('\n==================================================')
  console.log('🚀 [REGISTRO] Procesando bono de bienvenida (100 pts)')
  console.log('==================================================')

  const cookieStore = cookies()
  const { email, password, fullName, phone } = await request.json()
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

  // 1. Crear el usuario en Supabase Auth
  console.log('📤 1. Creando usuario en Auth...')
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password: password.trim(),
    options: {
      data: { full_name: fullName.trim(), phone: phone?.trim() || '' }
    }
  })

  if (authError) {
    console.log('❌ Error en Auth:', authError.message)
    return NextResponse.json({ error: `Auth: ${authError.message}` }, { status: 400 })
  }

  const userId = authData.user?.id
  if (!userId) return NextResponse.json({ error: 'ID de usuario no generado.' }, { status: 400 })

  // 2. Buscar el Tenant ID
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('name', 'Salon Fresh Nails')
    .single()
  
  const tenantId = tenant?.id || null

  // 3. Crear Perfil Público
  console.log('📤 2. Creando perfil...')
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      tenant_id: tenantId,
      email: email.trim().toLowerCase(),
      full_name: fullName.trim(),
      role: 'client',
      is_active: true
    })

  if (profileError) {
    console.log('❌ Error en profiles:', profileError.message)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  // 4. Crear Cliente con los 100 puntos iniciales por registro
  console.log('📤 3. Guardando cliente con 100 puntos de bienvenida...')
  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .insert({
      auth_user_id: userId,
      tenant_id: tenantId,
      profile_id: userId,
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      points: 100, // Bono por registrarse por primera vez
      is_active: true
    })
    .select('id')
    .single()

  if (clientError) {
    console.log('❌ Error en clients:', clientError.message)
    return NextResponse.json({ error: clientError.message }, { status: 400 })
  }

  // 5. Inicializar la Billetera de Lealtad (Loyalty Wallet)
  console.log('📤 4. Inicializando billetera de lealtad...')
  const { error: walletError } = await supabase
    .from('loyalty_wallets')
    .insert({
      client_id: clientData.id,
      tenant_id: tenantId,
      glow_points: 0,
      hair_points: 100 // Reflejamos los mismos 100 puntos iniciales
    })

  if (walletError) {
    console.log('❌ Error en wallet:', walletError.message)
    return NextResponse.json({ error: walletError.message }, { status: 400 })
  }

  console.log(`🎉 ¡Completado! Cliente registrado y premiado con 100 pts: ${email}`)
  return NextResponse.json({ success: true, user: authData.user, client: clientData })
}
