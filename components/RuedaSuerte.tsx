'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { X, Sparkles, Gift, Clock, Loader2, Crown, Award } from 'lucide-react'

interface RuletaModalProps {
  isOpen: boolean
  onClose: () => void
  onPremioProcesado?: () => void
  usuarioActivo?: any
  tenantIdActivo?: string
}

const PREMIOS = [
  { id: 0, label: '50 Pts', emoji: '💇‍♀️', value: 50, type: 'hair', color: '#F59E0B', bg: '#F59E0B' },
  { id: 1, label: '10 Pts', emoji: '✨', value: 10, type: 'glow', color: '#EC4899', bg: '#EC4899' },
  { id: 2, label: 'Suerte', emoji: '🍀', value: 0, type: 'none', color: '#22C55E', bg: '#22C55E' },
  { id: 3, label: '100 Pts', emoji: '👑', value: 100, type: 'hair', color: '#FBBF24', bg: '#FBBF24' },
  { id: 4, label: '50 Pts', emoji: '💎', value: 50, type: 'glow', color: '#DB2777', bg: '#DB2777' },
  { id: 5, label: 'Suerte', emoji: '⭐', value: 0, type: 'none', color: '#8B5CF6', bg: '#8B5CF6' },
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
  const [currentRotation, setCurrentRotation] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [prizeIndex, setPrizeIndex] = useState<number | null>(null)

  const brandGradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`

  // Dibujar la ruleta en canvas con colores vibrantes
  useEffect(() => {
    if (!canvasRef.current) return
    drawWheel(0)
  }, [isDark, primaryColor, secondaryColor])

  const drawWheel = (rotation: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = canvas.width
    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 8

    ctx.clearRect(0, 0, size, size)

    const segmentAngle = (2 * Math.PI) / PREMIOS.length

    // Dibujar cada segmento
    PREMIOS.forEach((premio, i) => {
      const startAngle = i * segmentAngle + rotation
      const endAngle = startAngle + segmentAngle

      // Segmento con color
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      // Colores vibrantes alternados
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
        '#FF8A5C', '#A29BFE', '#FD79A8', '#00B894', '#FDCB6E', '#6C5CE7'
      ]
      ctx.fillStyle = colors[i % colors.length]
      ctx.fill()
      
      // Borde del segmento
      ctx.strokeStyle = isDark ? '#1a1625' : '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Dibujar texto dentro del segmento
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(startAngle + segmentAngle / 2)
      
      // Emoji grande
      ctx.font = '28px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 8
      ctx.fillText(premio.emoji, radius * 0.6, -12)
      
      // Texto del premio
      ctx.shadowBlur = 0
      ctx.font = 'bold 11px Arial'
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 4
      ctx.fillText(premio.label, radius * 0.6, 20)
      
      ctx.restore()
    })

    // Círculo exterior decorativo
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 3
    ctx.stroke()

    // Círculo central con gradiente
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30)
    gradient.addColorStop(0, secondaryColor)
    gradient.addColorStop(1, primaryColor)
    
    ctx.shadowBlur = 20
    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI)
    ctx.fillStyle = gradient
    ctx.fill()
    
    // Borde del centro
    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Icono en el centro
    ctx.shadowBlur = 0
    ctx.font = '22px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.shadowBlur = 10
    ctx.fillText('🎯', centerX, centerY + 1)
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

        // Verificar giro de hoy en DB
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
    setPrizeIndex(randomIndex)
    const premioGanado = PREMIOS[randomIndex]

    // Calcular rotación para que caiga en el premio
    const segmentAngle = (2 * Math.PI) / PREMIOS.length
    const targetAngle = (2 * Math.PI) - (randomIndex * segmentAngle + segmentAngle / 2)
    const spins = 8
    const totalRotation = spins * 2 * Math.PI + targetAngle
    
    const newRotation = currentRotation + totalRotation
    setCurrentRotation(newRotation)

    // Animar con 20 frames para suavidad
    let currentFrame = 0
    const totalFrames = 60
    const startRotation = currentRotation
    const endRotation = newRotation
    
    const animate = () => {
      currentFrame++
      const progress = currentFrame / totalFrames
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startRotation + (endRotation - startRotation) * eased
      drawWheel(current)
      
      if (currentFrame < totalFrames) {
        requestAnimationFrame(animate)
      } else {
        drawWheel(endRotation)
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
        }, 500)
      }
    }
    
    animate()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Fondo */}
      <div 
        className="fixed inset-0 backdrop-blur-sm transition-opacity duration-300" 
        style={{ backgroundColor: isDark ? 'rgba(15, 12, 27, 0.85)' : 'rgba(0, 0, 0, 0.6)' }}
        onClick={!isSpinning ? onClose : undefined} 
      />

      <div className={`relative w-full max-w-sm transform overflow-hidden rounded-3xl border shadow-2xl p-5 text-center transition-all ${
        isDark ? 'bg-[#0f0c1b] border-fuchsia-950/40' : 'bg-white border-pink-100/60'
      }`}>

        {/* Cerrar */}
        {!isSpinning && (
          <button 
            onClick={onClose} 
            className={`absolute top-3 right-3 p-1.5 rounded-xl transition-all ${
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
            <p className={`text-[10px] uppercase tracking-widest ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              Cargando...
            </p>
          </div>
        ) : errorMessage ? (
          <div className="py-8 flex flex-col items-center space-y-4">
            <div className="p-3 rounded-full border" style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}20` }}>
              <Award className="w-8 h-8" style={{ color: primaryColor }} />
            </div>
            <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-stone-900'}`}>
              Ups, algo pasó
            </h3>
            <p className={`text-xs px-4 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              {errorMessage}
            </p>
            <button 
              onClick={onClose} 
              className="px-6 py-2.5 rounded-xl text-white text-xs font-black uppercase transition hover:scale-105 active:scale-95"
              style={{ background: brandGradient }}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Título */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[8px] uppercase tracking-[0.2em] font-black mb-1.5"
                style={{ borderColor: `${primaryColor}30`, color: primaryColor }}
              >
                <Sparkles className="w-3 h-3" style={{ color: secondaryColor }} />
                Ruleta VIP
              </div>
              <h3 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
                Gira y gana{' '}
                <span className="font-serif italic font-normal" style={{ color: primaryColor }}>
                  premios
                </span>
              </h3>
              {yaGiroHoy && proximoGiro && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800/50 border border-stone-700/50">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span className="text-[8px] font-mono font-medium text-stone-400">
                    Próximo en {proximoGiro}
                  </span>
                </div>
              )}
            </div>

            {/* Canvas de la ruleta */}
            <div className="relative w-[260px] h-[260px] mx-auto">
              {/* Flecha indicadora */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px]" 
                  style={{ borderTopColor: primaryColor }} 
                />
              </div>

              {/* Decoración exterior */}
              <div className="absolute -inset-2 rounded-full opacity-20 blur-xl" style={{ background: brandGradient }} />

              <canvas
                ref={canvasRef}
                width={260}
                height={260}
                className="w-full h-full rounded-full shadow-2xl relative z-10"
                style={{ boxShadow: `0 0 50px ${primaryColor}30` }}
              />

              {/* Botón girar sobre el canvas */}
              {!yaGiroHoy && (
                <button
                  onClick={ejecutarGiro}
                  disabled={isSpinning}
                  className="absolute inset-0 w-full h-full rounded-full flex items-center justify-center transition-all duration-300 z-20"
                >
                  {isSpinning ? (
                    <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border-2 border-white/20">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white/20"
                      style={{ 
                        background: brandGradient,
                        boxShadow: `0 0 40px ${primaryColor}60`
                      }}
                    >
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                  )}
                </button>
              )}

              {yaGiroHoy && (
                <div className="absolute inset-0 w-full h-full rounded-full flex items-center justify-center z-20">
                  <div className="w-14 h-14 rounded-full bg-stone-900/80 backdrop-blur-sm border-2 border-stone-700 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-stone-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Resultado */}
            <div className={`min-h-[44px] flex items-center justify-center px-4 rounded-xl border py-2 transition-all ${
              chosenPrize ? 'border-opacity-100' : 'border-opacity-30'
            }`}
              style={chosenPrize ? {
                borderColor: primaryColor,
                backgroundColor: `${primaryColor}10`
              } : {
                borderColor: isDark ? '#2a2435' : '#e5e7eb',
              }}
            >
              {chosenPrize ? (
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{chosenPrize.emoji}</span>
                  <div className="text-left">
                    <p className={`text-[7px] uppercase tracking-widest font-black ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                      ¡Felicidades!
                    </p>
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                      {chosenPrize.value > 0 ? (
                        <>Ganaste <span style={{ color: primaryColor }}>{chosenPrize.value} pts</span></>
                      ) : (
                        <span className="text-stone-400">¡Sigue intentando!</span>
                      )}
                    </p>
                  </div>
                </div>
              ) : yaGiroHoy ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <p className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Ya giraste hoy
                  </p>
                </div>
              ) : (
                <p className={`text-xs font-medium ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                  {isSpinning ? '🎡 Girando...' : 'Toca el centro para girar'}
                </p>
              )}
            </div>

            {/* Footer */}
            <p className={`text-[7px] uppercase tracking-[0.2em] ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>
              {yaGiroHoy ? '🔒 Un giro por día' : '🎯 Un giro diario'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}