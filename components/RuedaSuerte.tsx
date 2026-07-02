'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'

interface RuedaSuerteProps {
  onPuntosGanados?: (puntos: number) => void
  userId?: string | null
  clientId?: string | null
  tenantId?: string | null
}

export default function RuedaSuerte({ 
  onPuntosGanados, 
  userId, 
  clientId: propClientId, 
  tenantId: propTenantId 
}: RuedaSuerteProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // USAR PROPS DIRECTAMENTE
  const clientId = propClientId
  const tenantId = propTenantId
  const userEmail = userId

  const [spinCount, setSpinCount] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState<string>('')

  // Debug inicial
  useEffect(() => {
    setDebugInfo(`📥 Props: userId=${userId || 'NULL'} clientId=${propClientId || 'NULL'} tenantId=${propTenantId || 'NULL'}`)
  }, [userId, propClientId, propTenantId])

  // Verificar giros del día
  useEffect(() => {
    if (!clientId || !tenantId) {
      setDebugInfo(`⏳ Esperando datos... clientId: ${clientId ? '✅' : '❌'} tenantId: ${tenantId ? '✅' : '❌'}`)
      return
    }

    const checkSpin = async () => {
      try {
        const { data, error } = await supabase
          .from('loyalty_transactions')
          .select('created_at')
          .eq('client_id', clientId)
          .eq('transaction_type', 'ruleta')
          .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())

        if (error) {
          setDebugInfo(`❌ Error al verificar giros: ${error.message}`)
          return
        }

        setSpinCount(data?.length || 0)
        setDebugInfo(`✅ Listo para jugar - Giros hoy: ${data?.length || 0}`)
      } catch (err: any) {
        setDebugInfo(`❌ Error: ${err.message}`)
      }
    }

    checkSpin()
  }, [clientId, tenantId])

  const handleSpin = async () => {
    // Mostrar debug
    setDebugInfo(`🔍 Intentando girar - clientId: ${clientId || 'NULL'} | tenantId: ${tenantId || 'NULL'} | userId: ${userId || 'NULL'}`)

    // VALIDACIONES
    if (!clientId) {
      setError('❌ ERROR: No se encontró el ID del cliente. Cierra sesión y vuelve a entrar.')
      setDebugInfo('❌ clientId es NULL')
      return
    }

    if (!tenantId) {
      setError('❌ ERROR: No se encontró el ID del salón.')
      setDebugInfo('❌ tenantId es NULL')
      return
    }

    if (isSpinning) return

    if (spinCount >= 1) {
      setError('⏰ Ya giraste la ruleta hoy. Vuelve mañana!')
      return
    }

    setIsSpinning(true)
    setError('')
    setResult(null)
    setMessage('🎰 Girando...')
    setDebugInfo('🔄 Girando la ruleta...')

    try {
      const puntosGanados = Math.floor(Math.random() * 451) + 50
      setResult(puntosGanados)
      setDebugInfo(`🎯 Resultado: ${puntosGanados} puntos`)

      await new Promise(resolve => setTimeout(resolve, 2000))

      // Guardar en la base de datos
      const { data: wallet, error: walletError } = await supabase
        .from('loyalty_wallets')
        .select('id, glow_points, hair_points')
        .eq('client_id', clientId)
        .eq('tenant_id', tenantId)
        .single()

      if (walletError) {
        setError('❌ Error al obtener wallet: ' + walletError.message)
        setDebugInfo(`❌ Error wallet: ${walletError.message}`)
        setIsSpinning(false)
        return
      }

      setDebugInfo(`✅ Wallet encontrada: ${wallet.id}`)

      const nuevosGlowPoints = (wallet.glow_points || 0) + puntosGanados

      const { error: updateError } = await supabase
        .from('loyalty_wallets')
        .update({
          glow_points: nuevosGlowPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id)

      if (updateError) {
        setError('❌ Error al guardar los puntos: ' + updateError.message)
        setDebugInfo(`❌ Error update: ${updateError.message}`)
        setIsSpinning(false)
        return
      }

      setDebugInfo(`✅ Puntos guardados: ${puntosGanados}`)

      // Registrar transacción
      await supabase
        .from('loyalty_transactions')
        .insert({
          client_id: clientId,
          tenant_id: tenantId,
          transaction_type: 'ruleta',
          points: puntosGanados,
          description: `🎰 Ruleta - Ganaste ${puntosGanados} puntos`,
          created_at: new Date().toISOString()
        })

      setSpinCount(1)
      setMessage(`🎉 ¡Ganaste ${puntosGanados} puntos!`)
      setDebugInfo(`✅ Completado - +${puntosGanados} puntos`)

      if (onPuntosGanados) {
        onPuntosGanados(puntosGanados)
      }

    } catch (err: any) {
      setError('❌ Error inesperado: ' + err.message)
      setDebugInfo(`❌ Catch error: ${err.message}`)
    } finally {
      setIsSpinning(false)
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
      isDark
        ? 'bg-[#141211] border-stone-800/50 shadow-xl shadow-black/30'
        : 'bg-white border-stone-200/80 shadow-xl shadow-stone-200/30'
    }`}>
      <div className="relative z-10 p-6 md:p-8">

        {/* PANEL DE DEBUG VISUAL */}
        <div className="mb-4 p-3 bg-gray-900 text-green-400 font-mono text-[10px] rounded-lg overflow-auto max-h-32 border border-gray-700">
          <div className="text-yellow-400 font-bold mb-1">🐛 DEBUG RULETA</div>
          <div>👤 Usuario: {userEmail || 'NO LOGUEADO'}</div>
          <div>🆔 Client ID: {clientId || '❌ NULL'}</div>
          <div>🏢 Tenant ID: {tenantId || '❌ NULL'}</div>
          <div>📊 Estado: {debugInfo || 'Esperando...'}</div>
          <div>🎯 Giros hoy: {spinCount}/1</div>
        </div>

        {/* Título */}
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 rounded-2xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
            <span className="text-2xl">🎰</span>
          </div>
          <div>
            <h2 className={`text-xl font-light ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
              Ruleta de la <span className="font-serif italic text-amber-500">Suerte</span>
            </h2>
            <p className={`text-[11px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              {spinCount >= 1 ? '✅ Ya giraste hoy. Vuelve mañana!' : '🎯 Gira y gana hasta 500 puntos!'}
            </p>
          </div>
        </div>

        {/* Errores */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className={`mb-4 p-4 rounded-2xl text-center ${
            isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
          }`}>
            <p className="text-2xl font-bold text-amber-500">+{result} pts</p>
          </div>
        )}

        {/* Botón */}
        <button
          onClick={handleSpin}
          disabled={isSpinning || spinCount >= 1 || !clientId}
          className={`w-full py-4 rounded-2xl font-medium transition-all duration-300 ${
            isSpinning || spinCount >= 1 || !clientId
              ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:shadow-2xl hover:shadow-amber-500/30 active:scale-[0.98]'
          }`}
        >
          {!clientId ? '⚠️ Inicia sesión para jugar' :
           isSpinning ? '🎰 Girando...' :
           spinCount >= 1 ? '✅ Ya jugaste hoy' :
           '🎰 Girar la ruleta'}
        </button>

        {/* Info extra */}
        <div className="mt-4 text-center">
          <p className={`text-[10px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            {spinCount >= 1 
              ? '🔄 Vuelve mañana para más puntos'
              : clientId ? '✅ Listo para jugar!' : '🔑 Inicia sesión para jugar'}
          </p>
        </div>
      </div>
    </div>
  )
}
