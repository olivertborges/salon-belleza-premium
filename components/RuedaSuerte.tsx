'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { X, Sparkles, Award, AlertCircle, Loader2, Gift, Star, Zap, Gem, Crown, Clock } from 'lucide-react'

interface RuletaModalProps {
  isOpen: boolean
  onClose: () => void
  onPremioProcesado?: () => void
  usuarioActivo?: any
  tenantIdActivo?: string
}

// Premios con diseño mejorado
const PREMIOS = [
  { id: 0, text: '50', icon: '💇‍♀️', value: 50, type: 'hair', color: '#F59E0B', bg: 'from-amber-400 to-amber-600' },
  { id: 1, text: '10', icon: '✨', value: 10, type: 'glow', color: '#EC4899', bg: 'from-pink-400 to-pink-600' },
  { id: 2, text: '🎯', icon: '🎯', value: 0, type: 'none', color: '#78716C', bg: 'from-stone-400 to-stone-600' },
  { id: 3, text: '100', icon: '👑', value: 100, type: 'hair', color: '#FBBF24', bg: 'from-yellow-400 to-yellow-600' },
  { id: 4, text: '50', icon: '💎', value: 50, type: 'glow', color: '#DB2777', bg: 'from-rose-400 to-rose-600' },
  { id: 5, text: '🎰', icon: '🎰', value: 0, type: 'none', color: '#A8A29E', bg: 'from-stone-300 to-stone-500' },
]

export default function RuletaModal({ 
  isOpen, 
  onClose, 
  onPremioProcesado, 
  usuarioActivo, 
  tenantIdActivo 
}: RuletaModalProps) {
  const { refreshUserData } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSettings()
  
  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'
  
  const [isValidating, setIsValidating] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [resolvedTenantId, setResolvedTenantId] = useState<string | null>(null)
  const [yaGiroHoy, setYaGiroHoy] = useState(false)
  const [proximoGiro, setProximoGiro] = useState<string | null>(null)

  const [isSpinning, setIsSpinning] = useState(false)
  const [chosenPrize, setChosenPrize] = useState<typeof PREMIOS[0] | null>(null)
  const [rotationDegrees, setRotationDegrees] = useState(0)
  const ruletaRef = useRef<HTMLDivElement>(null)

  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
  }

  // Verificar si ya giró hoy (desde la base de datos)
  useEffect(() => {
    async function validarAccesoRuleta() {
      if (!isOpen) return

      setIsValidating(true)
      setErrorMessage(null)
      setYaGiroHoy(false)
      setChosenPrize(null)
      setProximoGiro(null)

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const currentUserId = session?.user?.id || usuarioActivo?.id

        if (!currentUserId) {
          setErrorMessage('No hay sesión activa.')
          setIsValidating(false)
          return
        }

        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id, tenant_id')
          .eq('auth_user_id', currentUserId)
          .maybeSingle()

        if (clientError || !clientData) {
          setErrorMessage('Perfil de cliente no encontrado.')
          setIsValidating(false)
          return
        }

        const finalTenantId = tenantIdActivo || clientData.tenant_id
        setClientId(clientData.id)
        setResolvedTenantId(finalTenantId)

        // 🔒 VERIFICACIÓN ESTRICTA: Buscar giro de hoy en la base de datos
        const hoyInicio = new Date()
        hoyInicio.setHours(0, 0, 0, 0)
        hoyInicio.setMinutes(0, 0, 0)

        const mananaInicio = new Date(hoyInicio)
        mananaInicio.setDate(mananaInicio.getDate() + 1)

        const { data: transData, error: transError } = await supabase
          .from('loyalty_transactions')
          .select('id, created_at')
          .eq('client_id', clientData.id)
          .eq('tenant_id', finalTenantId)
          .ilike('description', '%Ruleta Diaria%')
          .gte('created_at', hoyInicio.toISOString())
          .lt('created_at', mananaInicio.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)

        if (transError) {
          console.error('Error verificando giro:', transError)
        }

        if (transData && transData.length > 0) {
          setYaGiroHoy(true)
          // Calcular tiempo restante para próximo giro
          const ahora = new Date()
          const manana = new Date(hoyInicio)
          manana.setDate(manana.getDate() + 1)
          const diffMs = manana.getTime() - ahora.getTime()
          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
          const diffMin = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
          setProximoGiro(`${diffHrs}h ${diffMin}m`)
        } else {
          setYaGiroHoy(false)
        }

        setIsValidating(false)
      } catch (error: any) {
        setErrorMessage(`Error: ${error.message || error}`)
        setIsValidating(false)
      }
    }

    validarAccesoRuleta()
  }, [isOpen, usuarioActivo, tenantIdActivo])

  const ejecutarGiro = async () => {
    if (isSpinning || yaGiroHoy || !clientId || !resolvedTenantId) return

    setIsSpinning(true)
    setChosenPrize(null)

    // Seleccionar premio aleatorio
    const randomIndex = Math.floor(Math.random() * PREMIOS.length)
    const premioGanado = PREMIOS[randomIndex]

    // Calcular rotación
    const gradosPorSeccion = 360 / PREMIOS.length
    const desfasePremio = randomIndex * gradosPorSeccion
    const totalGrados = 1800 + (360 - desfasePremio)

    setRotationDegrees(totalGrados)

    // Esperar a que termine la animación
    setTimeout(async () => {
      setChosenPrize(premioGanado)

      if (premioGanado.value > 0) {
        // 🔒 REGISTRAR EN BASE DE DATOS (IMPOSIBLE DE ELIMINAR CON COOKIES)
        const { error: txError } = await supabase.from('loyalty_transactions').insert({
          client_id: clientId,
          tenant_id: resolvedTenantId,
          points: premioGanado.value,
          type: 'earned',
          wallet_type: premioGanado.type,
          category: 'manual',
          description: `Ruleta Diaria: ${premioGanado.icon} ${premioGanado.value} pts`
        })

        if (txError) {
          console.error('Error guardando transacción:', txError)
          setIsSpinning(false)
          return
        }

        // Actualizar billetera
        const columnaPuntos = premioGanado.type === 'hair' ? 'hair_points' : 'glow_points'

        const { data: wallet } = await supabase
          .from('loyalty_wallets')
          .select('*')
          .eq('client_id', clientId)
          .eq('tenant_id', resolvedTenantId)
          .maybeSingle()

        if (wallet) {
          await supabase
            .from('loyalty_wallets')
            .update({ [columnaPuntos]: (wallet[columnaPuntos] || 0) + premioGanado.value })
            .eq('client_id', clientId)
            .eq('tenant_id', resolvedTenantId)
        } else {
          await supabase
            .from('loyalty_wallets')
            .insert({
              client_id: clientId,
              tenant_id: resolvedTenantId,
              hair_points: premioGanado.type === 'hair' ? premioGanado.value : 0,
              glow_points: premioGanado.type === 'glow' ? premioGanado.value : 0
            })
        }

        if (refreshUserData) await refreshUserData()
        if (onPremioProcesado) onPremioProcesado()
      }

      // ✅ Marcar como girado HOY (persistente en DB)
      setYaGiroHoy(true)
      
      // Calcular tiempo para próximo giro
      const hoyInicio = new Date()
      hoyInicio.setHours(0, 0, 0, 0)
      const manana = new Date(hoyInicio)
      manana.setDate(manana.getDate() + 1)
      const ahora = new Date()
      const diffMs = manana.getTime() - ahora.getTime()
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMin = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      setProximoGiro(`${diffHrs}h ${diffMin}m`)

      setIsSpinning(false)
    }, 4000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 antialiased">
      {/* Fondo con blur elegante */}
      <div 
        className="fixed inset-0 transition-opacity duration-300 backdrop-blur-sm" 
        style={{ backgroundColor: isDark ? 'rgba(15, 12, 27, 0.85)' : 'rgba(0, 0, 0, 0.6)' }}
        onClick={!isSpinning ? onClose : undefined} 
      />

      <div className={`relative w-full max-w-md transform overflow-hidden rounded-3xl border shadow-2xl p-6 text-center transition-all ${
        isDark 
          ? 'bg-[#0f0c1b] border-fuchsia-950/40' 
          : 'bg-white border-pink-100/60'
      }`}>

        {/* Botón cerrar */}
        {!isSpinning && (
          <button 
            onClick={onClose} 
            className={`absolute top-3 right-3 p-2 rounded-xl transition-all ${
              isDark ? 'hover:bg-stone-800/50 text-stone-500 hover:text-pink-400' : 'hover:bg-pink-50 text-stone-400 hover:text-pink-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {isValidating ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 animate-spin" style={{ borderColor: `${primaryColor}30`, borderTopColor: primaryColor }} />
              <Sparkles className="w-4 h-4 absolute animate-pulse" style={{ color: primaryColor }} />
            </div>
            <p className={`text-[10px] uppercase tracking-widest font-mono ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              Preparando tu experiencia...
            </p>
          </div>
        ) : errorMessage ? (
          <div className="py-8 flex flex-col items-center space-y-4">
            <div className="p-3 rounded-full border" style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}20` }}>
              <AlertCircle className="w-8 h-8" style={{ color: primaryColor }} />
            </div>
            <h3 className={`font-black text-base tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
              Ups, algo pasó
            </h3>
            <p className={`text-xs px-4 leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              {errorMessage}
            </p>
            <button 
              onClick={onClose} 
              className={`px-6 py-2.5 rounded-xl text-white text-xs font-black tracking-widest uppercase transition hover:scale-105 active:scale-95`}
              style={{ background: brandGradient.backgroundImage }}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Encabezado */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] uppercase tracking-[0.2em] font-black mb-2"
                style={{ borderColor: `${primaryColor}30`, color: primaryColor }}
              >
                <Sparkles className="w-3 h-3 animate-pulse" style={{ color: secondaryColor }} />
                Ruleta VIP
                <Gift className="w-3 h-3 animate-pulse" style={{ color: secondaryColor }} />
              </div>
              <h3 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
                Gira y gana{' '}
                <span className="font-serif italic font-normal" style={{ color: primaryColor }}>
                  Premios
                </span>
              </h3>
              {yaGiroHoy && proximoGiro && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800/50 border border-stone-700/50">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span className="text-[9px] font-mono font-medium text-stone-400">
                    Próximo giro en {proximoGiro}
                  </span>
                </div>
              )}
            </div>

            {/* 🎡 RULETA REDISEÑADA */}
            <div className="relative w-64 h-64 mx-auto my-3">
              {/* Anillo decorativo exterior */}
              <div className="absolute -inset-2 rounded-full opacity-20 blur-xl" style={{ background: brandGradient.backgroundImage }} />
              
              {/* Anillo de luces */}
              <div className="absolute -inset-1.5 rounded-full border-2" style={{ borderColor: `${primaryColor}30` }} />
              
              <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl" style={{ boxShadow: `0 0 60px ${primaryColor}20` }}>
                {/* Fondo de la ruleta con gradiente */}
                <div className="absolute inset-0" style={{ background: isDark ? '#1a1625' : '#faf7f5' }} />
                
                {/* Los segmentos */}
                <div
                  ref={ruletaRef}
                  style={{
                    transform: `rotate(${rotationDegrees}deg)`,
                    transition: isSpinning ? 'transform 4s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none',
                  }}
                  className="w-full h-full rounded-full relative"
                >
                  {PREMIOS.map((premio, idx) => {
                    const angle = (360 / PREMIOS.length) * idx
                    return (
                      <div
                        key={premio.id}
                        className="absolute top-0 left-0 w-full h-full"
                        style={{
                          transform: `rotate(${angle}deg)`,
                          clipPath: 'polygon(50% 50%, 50% 0%, 100% 28.87%, 100% 30%)',
                        }}
                      >
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ 
                            background: `linear-gradient(135deg, ${premio.color}dd, ${premio.color}aa)`,
                            clipPath: 'polygon(50% 50%, 50% 0%, 100% 28.87%, 100% 30%)',
                          }}
                        >
                          <div className="absolute top-6 flex flex-col items-center" style={{ transform: 'rotate(30deg)' }}>
                            <span className="text-lg leading-none">{premio.icon}</span>
                            {premio.value > 0 && (
                              <span className="text-[8px] font-black text-white drop-shadow-lg mt-0.5">
                                {premio.value}pts
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Centro con gradiente y efectos */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-20 h-20 rounded-full border-4" style={{ borderColor: isDark ? '#1a1625' : '#faf7f5' }}>
                    <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: brandGradient.backgroundImage }}>
                      <Crown className="w-6 h-6 text-white/80" />
                    </div>
                  </div>
                </div>

                {/* Marcador superior */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
                  <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px]" style={{ borderTopColor: primaryColor }} />
                </div>
              </div>

              {/* Botón de giro (sobrepuesto) */}
              <button
                onClick={ejecutarGiro}
                disabled={isSpinning || yaGiroHoy}
                className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                  yaGiroHoy 
                    ? 'cursor-not-allowed' 
                    : isSpinning 
                      ? 'cursor-wait' 
                      : 'cursor-pointer hover:scale-105 active:scale-95'
                }`}
              >
                {yaGiroHoy ? (
                  <div className="w-16 h-16 rounded-full bg-stone-700/80 border-2 border-stone-600 flex items-center justify-center backdrop-blur-sm">
                    <Clock className="w-6 h-6 text-stone-400" />
                  </div>
                ) : isSpinning ? (
                  <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur-sm animate-pulse">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center border-2 backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
                    style={{ 
                      background: brandGradient.backgroundImage,
                      borderColor: isDark ? '#2a2435' : '#faf7f5',
                      boxShadow: `0 0 40px ${primaryColor}50`
                    }}
                  >
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                )}
              </button>
            </div>

            {/* Resultado */}
            <div className={`min-h-[52px] flex items-center justify-center px-4 rounded-xl border py-2.5 transition-all ${
              chosenPrize ? 'border-opacity-100' : 'border-opacity-30'
            }`}
              style={chosenPrize ? {
                borderColor: primaryColor,
                backgroundColor: `${primaryColor}08`
              } : {
                borderColor: isDark ? '#2a2435' : '#e5e7eb',
                backgroundColor: isDark ? 'rgba(15,12,27,0.5)' : 'transparent'
              }}
            >
              {chosenPrize ? (
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{chosenPrize.icon}</div>
                  <div className="text-left">
                    <p className={`text-[8px] uppercase tracking-widest font-black ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                      ¡Felicidades!
                    </p>
                    <p className={`text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                      Ganaste{' '}
                      <span className="font-black" style={{ color: primaryColor }}>
                        {chosenPrize.value > 0 ? `${chosenPrize.value} puntos` : '¡Suerte la próxima!'}
                      </span>
                    </p>
                  </div>
                </div>
              ) : yaGiroHoy ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <p className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Ya giraste hoy. Vuelve mañana {proximoGiro && `en ${proximoGiro}`}
                  </p>
                </div>
              ) : (
                <p className={`text-xs font-medium ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                  {isSpinning ? '🎡 Girando...' : '✨ Presiona el centro para girar'}
                </p>
              )}
            </div>

            {/* Footer con restricción visible */}
            <div className="text-center">
              <p className={`text-[8px] uppercase tracking-[0.2em] font-mono ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>
                {yaGiroHoy ? '🔒 Un giro por día' : '🎯 Un giro diario'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}