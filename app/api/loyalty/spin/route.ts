import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('\n==================================================')
  console.log('🎰 [API RULETA] Procesando premio seguro en el servidor...')
  console.log('==================================================')

  const cookieStore = cookies()
  const { clientId, tenantId, points } = await request.json()

  if (!clientId || !tenantId || points === undefined) {
    return NextResponse.json({ error: 'Faltan datos requeridos (clientId, tenantId o puntos).' }, { status: 400 })
  }

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

  // 1. Verificar si ya giró hoy consultando las transacciones
  const inicioHoy = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
  const { data: transaccionesHoy, error: errorTxCheck } = await supabase
    .from('loyalty_transactions')
    .select('id')
    .eq('client_id', clientId)
    .eq('transaction_type', 'ruleta')
    .gte('created_at', inicioHoy)

  if (errorTxCheck) {
    console.log('❌ Error al validar giros de hoy:', errorTxCheck.message)
    return NextResponse.json({ error: 'Error verificando límites diarios.' }, { status: 500 })
  }

  if (transaccionesHoy && transaccionesHoy.length >= 1) {
    console.log(`⚠️ Cliente ${clientId} intentó girar el mismo día otra vez.`)
    return NextResponse.json({ error: 'Ya utilizaste tu tiro de hoy.' }, { status: 400 })
  }

  // 2. Obtener la billetera actual
  const { data: wallet, error: walletError } = await supabase
    .from('loyalty_wallets')
    .select('id, glow_points')
    .eq('client_id', clientId)
    .eq('tenant_id', tenantId)
    .single()

  if (walletError) {
    console.log('❌ Error al buscar la wallet:', walletError.message)
    return NextResponse.json({ error: 'Billetera no encontrada.' }, { status: 400 })
  }

  // 3. Sumar los puntos obtenidos en la ruleta
  const nuevosGlowPoints = (wallet.glow_points || 0) + points
  console.log(`📊 Puntos actuales: ${wallet.glow_points} | Sumando: ${points} | Total: ${nuevosGlowPoints}`)

  const { error: updateError } = await supabase
    .from('loyalty_wallets')
    .update({
      glow_points: nuevosGlowPoints,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id)

  if (updateError) {
    console.log('❌ Error al actualizar la wallet:', updateError.message)
    return NextResponse.json({ error: 'No se pudieron asignar los puntos.' }, { status: 400 })
  }

  // 4. Crear el registro histórico en la tabla de transacciones
  console.log('📤 Creando registro histórico en transacciones...')
  const { error: insertTxError } = await supabase
    .from('loyalty_transactions')
    .insert({
      client_id: clientId,
      tenant_id: tenantId,
      transaction_type: 'ruleta',
      points: points,
      description: `🎰 Ruleta - Ganaste ${points} puntos`,
      created_at: new Date().toISOString()
    })

  if (insertTxError) {
    console.log('⚠️ Alerta: Los puntos se sumaron pero falló el registro histórico:', insertTxError.message)
  }

  console.log('✅ [API RULETA] ¡Puntos procesados con éxito en el servidor!')
  return NextResponse.json({ success: true, nuevosGlowPoints })
}
