// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { X, Sparkles, Gift, Clock, Loader2, Award, Star, PartyPopper, Gem, Crown } from 'lucide-react'

interface RuletaModalProps {
  isOpen: boolean
  onClose: () => void
  onPremioProcesado?: () => void
  usuarioActivo?: any
  tenantIdActivo?: string
}

// 🎯 10 PREMIOS con probabilidades ponderadas
const PREMIOS = [
  { id: 0, label: '10', emoji: '💫', value: 10, type: 'glow', weight: 25, color: '#D4AF37' },
  { id: 1, label: '15', emoji: '🌟', value: 15, type: 'hair', weight: 20, color: '#D4AF37' },
  { id: 2, label: '20', emoji: '✨', value: 20, type: 'glow', weight: 15, color: '#D4AF37' },
  { id: 3, label: '30', emoji: '💎', value: 30, type: 'hair', weight: 10, color: '#D4AF37' },
  { id: 4, label: '40', emoji: '👑', value: 40, type: 'glow', weight: 8, color: '#D4AF37' },
  { id: 5, label: '50', emoji: '🏆', value: 50, type: 'hair', weight: 7, color: '#D4AF37' },
  { id: 6, label: '75', emoji: '💎', value: 75, type: 'glow', weight: 5, color: '#D4AF37' },
  { id: 7, label: '100', emoji: '👑', value: 100, type: 'hair', weight: 4, color: '#D4AF37' },
  { id: 8, label: '200', emoji: '💎', value: 200, type: 'glow', weight: 3, color: '#D4AF37' },
  { id: 9, label: '500', emoji: '👑', value: 500, type: 'hair', weight: 1, color: '#D4AF37' },
]

// Colores para los segmentos (tonos dorados)
const COLORS = [
  '#D4AF37', '#E8D5A0', '#C9A96E', '#D4AF37', '#E8D5A0',
  '#C9A96E', '#D4AF37', '#E8D5A0', '#C9A96E', '#D4AF37'
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

  const [isValidating, setIsValidating] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [resolvedTenantId, setResolvedTenantId] = useState<string | null>(null)
  const [yaGiroHoy, setYaGiroHoy] = useState(false)
  const [proximoGiro, setProximoGiro] = useState<string | null>(null)

  const [isSpinning, setIsSpinning] = useState(false)
  const [chosenPrize, setChosenPrize] = useState<typeof PREMIOS[0] | null>(null)
  const [rotation, setRotation] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)

  const [particles, setParticles] = useState<{ x: number; y: number; emoji: string; size: number; delay: number }[]>([])
  const celebrationTimeout = useRef<NodeJS.Timeout | null>(null)

  const brandGradient = `linear-gradient(135deg, #D4AF37, #E8D5A0, #D4AF37)`

  // 🎯 Función para seleccionar premio con peso ponderado
  const selectPrizeWithWeight = () => {
    const totalWeight = PREMIOS.reduce((sum, p) => sum + p.weight, 0)
    let random = Math.random() * totalWeight

    for (const premio of PREMIOS) {
      random -= premio.weight
      if (random <= 0) {
        return premio
      }
    }
    return PREMIOS[0]
  }

  // 🎉 Generar partículas de celebración
  const generateCelebration = () => {
    const emojis = ['✨', '⭐', '🌟', '💎', '👑', '🎉', '🎊', '💫', '🏆', '🎯']
    const newParticles = []
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        size: 16 + Math.random() * 24,
        delay: Math.random() * 0.5
      })
    }
    setParticles(newParticles)
    setShowCelebration(true)

    // Limpiar después de 3 segundos
    if (celebrationTimeout.current) {
      clearTimeout(celebrationTimeout.current)
    }
    celebrationTimeout.current = setTimeout(() => {
      setShowCelebration(false)
      setParticles([])
    }, 3000)
  }

  // Verificar giro del día
  useEffect(() => {
    async function validarAccesoRuleta() {
      if (!isOpen) return

      setIsValidating(true)
      setErrorMessage(null)
      setYaGiroHoy(false)
      setChosenPrize(null)
      setProximoGiro(null)
      setShowCelebration(false)
      setParticles([])

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
    setShowCelebration(false)
    setParticles([])

    const premioGanado = selectPrizeWithWeight()
    const winningIndex = PREMIOS.findIndex(p => p.id === premioGanado.id)

    const segmentAngle = 360 / PREMIOS.length
    const targetAngle = 360 - (winningIndex * segmentAngle + segmentAngle / 2)
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

          // 🎉 ACTIVAR CELEBRACIÓN
          generateCelebration()

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
        style={{ backgroundColor: isDark ? 'rgba(30, 18, 12, 0.9)' : 'rgba(0, 0, 0, 0.7)' }}
        onClick={!isSpinning ? onClose : undefined} 
      />

      <div className={`relative w-full max-w-md transform overflow-hidden rounded-2xl shadow-2xl p-6 transition-all border ${
        isDark 
          ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_20px_60px_rgba(0,0,0,0.5)]' 
          : 'bg-white border-[#F0E4DA] shadow-[0_20px_60px_rgba(240,228,218,0.4)]'
      }`}>

        {!isSpinning && (
          <button 
            onClick={onClose} 
            className={`absolute top-4 right-4 p-2 rounded-full transition-all z-10 ${
              isDark ? 'hover:bg-[#3D281E] text-[#A89588] hover:text-[#FFF9F6]' : 'hover:bg-[#F0E4DA] text-[#A89588] hover:text-[#1A0E0A]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {isValidating ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 animate-spin border-[#D4AF37]/20 border-t-[#D4AF37]" />
              <Sparkles className="w-4 h-4 absolute animate-pulse text-[#D4AF37]" />
            </div>
            <p className={`text-xs uppercase tracking-widest font-medium ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
              Preparando tu experiencia
            </p>
          </div>
        ) : errorMessage ? (
          <div className="py-12 flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10">
              <Award className="w-10 h-10 text-[#D4AF37]" />
            </div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
              Algo salió mal
            </h3>
            <p className={`text-sm px-6 text-center ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
              {errorMessage}
            </p>
            <button 
              onClick={onClose} 
              className="px-8 py-3 rounded-xl text-[#1A0E0A] text-sm font-bold uppercase tracking-wide transition hover:scale-105 active:scale-95 bg-[#D4AF37] hover:bg-[#E8D5A0]"
            >
              Cerrar
            </button>
          </div>
        ) : yaGiroHoy ? (
          // VISTA BLOQUEADA
          <div className="py-8 flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-[#D4AF37]/20 flex items-center justify-center bg-[#D4AF37]/5">
                <Clock className="w-12 h-12 text-[#D4AF37]" />
              </div>
              <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full text-[10px] font-bold bg-[#D4AF37] text-[#1A0E0A]">
                Bloqueado
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className={`text-2xl font-bold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                ¡Ya giraste hoy! 🎡
              </h3>
              <p className={`text-sm ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                Vuelve mañana para más premios
              </p>
              {proximoGiro && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
                  isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
                }`}>
                  <Clock className="w-4 h-4 text-[#D4AF37]" />
                  <span className={`text-sm font-medium ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                    Próximo giro en {proximoGiro}
                  </span>
                </div>
              )}
            </div>

            <button 
              onClick={onClose} 
              className="px-8 py-3 rounded-xl text-[#1A0E0A] text-sm font-bold uppercase tracking-wide transition hover:scale-105 active:scale-95 bg-[#D4AF37] hover:bg-[#E8D5A0]"
            >
              Entendido
            </button>
          </div>
        ) : (
          // RULETA ACTIVA
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] uppercase tracking-[0.2em] font-bold mb-2 ${
                isDark ? 'border-[#D4AF37]/30 text-[#D4AF37] bg-[#D4AF37]/10' : 'border-[#D4AF37]/30 text-[#D4AF37] bg-[#D4AF37]/10'
              }`}>
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                Ruleta VIP
                <Gift className="w-3 h-3 text-[#D4AF37]" />
              </div>
              <h3 className={`text-2xl font-bold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                Gira y gana{' '}
                <span className="font-serif italic text-[#D4AF37]">premios</span>
              </h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                Un giro por día • 10 premios disponibles
              </p>
            </div>

            {/* Ruleta con SVG */}
            <div className="relative w-[280px] h-[280px] mx-auto">
              {/* Flecha indicadora */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-[#D4AF37]" />
              </div>

              {/* Anillo decorativo */}
              <div className="absolute -inset-3 rounded-full opacity-20 blur-2xl bg-[#D4AF37]" />

              {/* SVG de la ruleta */}
              <div 
                className="w-full h-full rounded-full shadow-2xl relative overflow-hidden"
                style={{ 
                  boxShadow: `0 0 60px rgba(212, 175, 55, 0.25)`,
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
                          stroke={isDark ? '#2A1B14' : '#FFFFFF'}
                          strokeWidth="1.5"
                        />
                        <text
                          x={textX}
                          y={textY - 8}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="22"
                          fill={isDark ? '#FFF9F6' : '#1A0E0A'}
                          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                        >
                          {premio.emoji}
                        </text>
                        <text
                          x={textX}
                          y={textY + 14}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill={isDark ? '#FFF9F6' : '#1A0E0A'}
                          style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))' }}
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
                      boxShadow: `0 0 50px rgba(212, 175, 55, 0.3)`
                    }}
                  >
                    <Gift className="w-7 h-7 text-[#1A0E0A]" />
                  </div>
                )}
              </button>
            </div>

            {/* Resultado con celebración */}
            <div className={`min-h-[52px] flex items-center justify-center px-4 rounded-xl border py-2.5 transition-all relative overflow-hidden ${
              chosenPrize ? 'border-opacity-100 border-[#D4AF37]' : 'border-opacity-30'
            }`}
              style={chosenPrize ? {
                backgroundColor: isDark ? 'rgba(212, 175, 55, 0.08)' : 'rgba(212, 175, 55, 0.05)'
              } : {
                borderColor: isDark ? '#3D281E' : '#F0E4DA',
              }}
            >
              {/* Partículas de celebración */}
              {showCelebration && particles.length > 0 && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {particles.map((p, i) => (
                    <span
                      key={i}
                      className="absolute animate-celebration"
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        fontSize: `${p.size}px`,
                        animationDelay: `${p.delay}s`,
                        transform: 'scale(0)'
                      }}
                    >
                      {p.emoji}
                    </span>
                  ))}
                </div>
              )}

              {chosenPrize ? (
                <div className="flex items-center gap-3 relative z-10">
                  <span className="text-3xl animate-bounce">{chosenPrize.emoji}</span>
                  <div className="text-left">
                    <p className={`text-[8px] uppercase tracking-widest font-bold text-[#D4AF37]`}>
                      ¡Felicidades!
                    </p>
                    <p className={`text-base font-bold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                      {chosenPrize.value > 0 ? (
                        <>Ganaste <span className="text-[#D4AF37]">{chosenPrize.value} pts</span></>
                      ) : (
                        <span className="text-[#A89588]">¡Sigue intentando!</span>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <p className={`text-sm font-medium ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                  {isSpinning ? '🎡 Girando...' : 'Toca el centro para girar'}
                </p>
              )}
            </div>

            {/* Leyenda de probabilidades */}
            <div className="grid grid-cols-5 gap-1 text-center">
              <div className="text-[8px] text-[#D4AF37]/70">10-20 pts</div>
              <div className="text-[8px] text-[#D4AF37]/70">30-50 pts</div>
              <div className="text-[8px] text-[#D4AF37]/70">75-100 pts</div>
              <div className="text-[8px] text-[#D4AF37]/70">200 pts</div>
              <div className="text-[8px] text-[#D4AF37]/70">500 pts</div>
              <div className={`text-[7px] col-span-5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                ⬆ Más común → Más raro ⬆
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes celebration {
          0% {
            transform: scale(0) translateY(0) rotate(0deg);
            opacity: 0;
          }
          20% {
            transform: scale(1.2) translateY(-30px) rotate(20deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) translateY(-120px) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-celebration {
          animation: celebration 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}