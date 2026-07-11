'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { X, Sparkles, Gift, Clock, Loader2, Award } from 'lucide-react'

interface RuletaModalProps {
  isOpen: boolean
  onClose: () => void
  onPremioProcesado?: () => void
  usuarioActivo?: any
  tenantIdActivo?: string
}

const PREMIOS = [
  { id: 0, label: '50', emoji: '💇', value: 50, type: 'hair', color: '#F59E0B' },
  { id: 1, label: '10', emoji: '✨', value: 10, type: 'glow', color: '#EC4899' },
  { id: 2, label: '🍀', emoji: '🍀', value: 0, type: 'none', color: '#10B981' },
  { id: 3, label: '100', emoji: '👑', value: 100, type: 'hair', color: '#FBBF24' },
  { id: 4, label: '50', emoji: '💎', value: 50, type: 'glow', color: '#DB2777' },
  { id: 5, label: '⭐', emoji: '⭐', value: 0, type: 'none', color: '#8B5CF6' },
]

const COLORS = [
  '#EF4444', // Rojo
  '#14B8A6', // Turquesa
  '#22C55E', // Verde
  '#F59E0B', // Ámbar
  '#EC4899', // Rosa
  '#8B5CF6', // Morado
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
  const [rotation, setRotation] = useState(0)

  const brandGradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`

  // Verificar giro del día
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

        const hoyInicio = new Date()
        hoyInicio.setHours(0, 0, 0, 0)
        const mananaInicio = new Date(hoyInicio)
        mananaInicio.setDate(mananaInicio.getDate() + 1)

        const { data: transData } = await supabase
          .from('loyalty_transactions')
          .select('id, created_at')
          .eq('client_id', clientData.id)
          .eq('tenant_id', finalTenantId)
          .ilike('description', '%Ruleta Diaria%')
          .gte('created_at', hoyInicio.toISOString())
          .lt('created_at', mananaInicio.toISOString())
          .limit(1)

        if (transData && transData.length > 0) {
          setYaGiroHoy(true)
          const ahora = new Date()
          const diffMs = mananaInicio.getTime() - ahora.getTime()
          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
          const diffMin = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
          setProximoGiro(`${diffHrs}h ${diffMin}m`)
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

    const randomIndex = Math.floor(Math.random() * PREMIOS.length)
    const premioGanado = PREMIOS[randomIndex]

    const segmentAngle = 360 / PREMIOS.length
    const targetAngle = 360 - (randomIndex * segmentAngle + segmentAngle / 2)
    const spins = 6
    const totalRotation = spins * 360 + targetAngle
    
    setRotation(rotation + totalRotation)

    setTimeout(async () => {
      setChosenPrize(premioGanado)

      if (premioGanado.value > 0) {
        const { error: txError } = await supabase.from('loyalty_transactions').insert({
          client_id: clientId,
          tenant_id: resolvedTenantId,
          points: premioGanado.value,
          type: 'earned',
          wallet_type: premioGanado.type,
          category: 'manual',
          description: `Ruleta Diaria: ${premioGanado.emoji} ${premioGanado.value} pts`
        })

        if (!txError) {
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
      }

      setYaGiroHoy(true)
      const hoyInicio = new Date()
      hoyInicio.setHours(0, 0, 0, 0)
      const mananaInicio = new Date(hoyInicio)
      mananaInicio.setDate(mananaInicio.getDate() + 1)
      const ahora = new Date()
      const diffMs = mananaInicio.getTime() - ahora.getTime()
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMin = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      setProximoGiro(`${diffHrs}h ${diffMin}m`)

      setIsSpinning(false)
    }, 4500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 backdrop-blur-md transition-opacity duration-300" 
        style={{ backgroundColor: isDark ? 'rgba(15, 12, 27, 0.9)' : 'rgba(0, 0, 0, 0.7)' }}
        onClick={!isSpinning ? onClose : undefined} 
      />

      <div className={`relative w-full max-w-md transform overflow-hidden rounded-3xl shadow-2xl p-6 transition-all ${
        isDark ? 'bg-[#0f0c1b]' : 'bg-white'
      }`}>

        {!isSpinning && (
          <button 
            onClick={onClose} 
            className={`absolute top-4 right-4 p-2 rounded-full transition-all z-10 ${
              isDark ? 'hover:bg-stone-800 text-stone-500 hover:text-pink-400' : 'hover:bg-stone-100 text-stone-400 hover:text-pink-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {isValidating ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 animate-spin" style={{ borderColor: `${primaryColor}30`, borderTopColor: primaryColor }} />
              <Sparkles className="w-4 h-4 absolute animate-pulse" style={{ color: primaryColor }} />
            </div>
            <p className={`text-xs uppercase tracking-widest font-medium ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              Preparando tu experiencia
            </p>
          </div>
        ) : errorMessage ? (
          <div className="py-12 flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full border" style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}20` }}>
              <Award className="w-10 h-10" style={{ color: primaryColor }} />
            </div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
              Algo salió mal
            </h3>
            <p className={`text-sm px-6 text-center ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              {errorMessage}
            </p>
            <button 
              onClick={onClose} 
              className="px-8 py-3 rounded-xl text-white text-sm font-bold uppercase tracking-wide transition hover:scale-105 active:scale-95"
              style={{ background: brandGradient }}
            >
              Cerrar
            </button>
          </div>
        ) : yaGiroHoy ? (
          // VISTA BLOQUEADA
          <div className="py-8 flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 flex items-center justify-center" style={{ borderColor: `${primaryColor}30` }}>
                <Clock className="w-12 h-12" style={{ color: primaryColor }} />
              </div>
              <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                Bloqueado
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                ¡Ya giraste hoy! 🎡
              </h3>
              <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Vuelve mañana para más premios
              </p>
              {proximoGiro && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-800/50 border border-stone-700/50">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className={`text-sm font-medium ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                    Próximo giro en {proximoGiro}
                  </span>
                </div>
              )}
            </div>

            <button 
              onClick={onClose} 
              className="px-8 py-3 rounded-xl text-white text-sm font-bold uppercase tracking-wide transition hover:scale-105 active:scale-95"
              style={{ background: brandGradient }}
            >
              Entendido
            </button>
          </div>
        ) : (
          // RULETA ACTIVA - Con canvas para forma perfecta
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] uppercase tracking-[0.2em] font-bold mb-2"
                style={{ borderColor: `${primaryColor}30`, color: primaryColor }}
              >
                <Sparkles className="w-3 h-3" style={{ color: secondaryColor }} />
                Ruleta VIP
                <Gift className="w-3 h-3" style={{ color: secondaryColor }} />
              </div>
              <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                Gira y gana{' '}
                <span className="font-serif italic" style={{ color: primaryColor }}>
                  premios
                </span>
              </h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                Un giro por día • Premios exclusivos
              </p>
            </div>

            {/* Ruleta con SVG para forma perfecta */}
            <div className="relative w-[280px] h-[280px] mx-auto">
              {/* Flecha indicadora */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px]" 
                  style={{ borderTopColor: primaryColor }} 
                />
              </div>

              {/* Anillo decorativo */}
              <div className="absolute -inset-3 rounded-full opacity-20 blur-2xl" style={{ background: brandGradient }} />

              {/* SVG de la ruleta */}
              <div 
                className="w-full h-full rounded-full shadow-2xl relative overflow-hidden"
                style={{ 
                  boxShadow: `0 0 60px ${primaryColor}25`,
                }}
              >
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? 'transform 4.5s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none'
                  }}
                >
                  {PREMIOS.map((premio, index) => {
                    const angle = (360 / PREMIOS.length) * index
                    const rad = (angle * Math.PI) / 180
                    const nextRad = ((angle + 360 / PREMIOS.length) * Math.PI) / 180
                    
                    const x1 = 100 + 85 * Math.cos(rad)
                    const y1 = 100 + 85 * Math.sin(rad)
                    const x2 = 100 + 85 * Math.cos(nextRad)
                    const y2 = 100 + 85 * Math.sin(nextRad)
                    
                    const midAngle = rad + (nextRad - rad) / 2
                    const textX = 100 + 55 * Math.cos(midAngle)
                    const textY = 100 + 55 * Math.sin(midAngle)
                    
                    return (
                      <g key={premio.id}>
                        <path
                          d={`M 100 100 L ${x1} ${y1} A 85 85 0 0 1 ${x2} ${y2} Z`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <text
                          x={textX}
                          y={textY - 8}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="24"
                          fill="white"
                          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                        >
                          {premio.emoji}
                        </text>
                        <text
                          x={textX}
                          y={textY + 16}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="10"
                          fontWeight="bold"
                          fill="white"
                          style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}
                        >
                          {premio.label}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>

              {/* Centro con botón */}
              <button
                onClick={ejecutarGiro}
                disabled={isSpinning}
                className="absolute inset-0 w-full h-full rounded-full flex items-center justify-center z-10 transition-all duration-300"
              >
                {isSpinning ? (
                  <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border-2 border-white/20">
                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                  </div>
                ) : (
                  <div 
                    className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white/20"
                    style={{ 
                      background: brandGradient,
                      boxShadow: `0 0 50px ${primaryColor}50`
                    }}
                  >
                    <Gift className="w-7 h-7 text-white" />
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
              }}
            >
              {chosenPrize ? (
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{chosenPrize.emoji}</span>
                  <div className="text-left">
                    <p className={`text-[8px] uppercase tracking-widest font-bold ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                      ¡Felicidades!
                    </p>
                    <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                      {chosenPrize.value > 0 ? (
                        <>Ganaste <span style={{ color: primaryColor }}>{chosenPrize.value} pts</span></>
                      ) : (
                        <span className="text-stone-400">¡Sigue intentando!</span>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <p className={`text-sm font-medium ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                  {isSpinning ? '🎡 Girando...' : 'Toca el centro para girar'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}