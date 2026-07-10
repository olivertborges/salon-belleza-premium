'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { X, Sparkles, Award, AlertCircle, Loader2, Gift, Star, Zap } from 'lucide-react'

interface RuletaModalProps {
  isOpen: boolean
  onClose: () => void
  onPremioProcesado?: () => void
  usuarioActivo?: any
  tenantIdActivo?: string
}

// Colores Premium
const PREMIOS = [
  { id: 1, text: '50 Pts Hair', value: 50, type: 'hair', color: '#F59E0B' },
  { id: 2, text: '10 Pts Glow', value: 10, type: 'glow', color: '#DB2777' },
  { id: 3, text: 'Sigue Intentando', value: 0, type: 'none', color: '#292524' },
  { id: 4, text: '100 Pts Hair', value: 100, type: 'hair', color: '#FBBF24' },
  { id: 5, text: '50 Pts Glow', value: 50, type: 'glow', color: '#EC4899' },
  { id: 6, text: 'Suerte Próxima', value: 0, type: 'none', color: '#44403C' },
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

  const [isSpinning, setIsSpinning] = useState(false)
  const [chosenPrize, setChosenPrize] = useState<typeof PREMIOS[0] | null>(null)
  const [rotationDegrees, setRotationDegrees] = useState(0)
  const ruletaRef = useRef<HTMLDivElement>(null)

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
  }

  useEffect(() => {
    async function validarAccesoRuleta() {
      if (!isOpen) return

      setIsValidating(true)
      setErrorMessage(null)
      setYaGiroHoy(false)
      setChosenPrize(null)

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

        const { data: transData } = await supabase
          .from('loyalty_transactions')
          .select('id')
          .eq('client_id', clientData.id)
          .ilike('description', '%Ruleta Diaria%')
          .gte('created_at', hoyInicio.toISOString())

        if (transData && transData.length > 0) {
          setYaGiroHoy(true)
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

    const gradosPorSeccion = 360 / PREMIOS.length
    const desfasePremio = randomIndex * gradosPorSeccion
    const totalGrados = 1800 + (360 - desfasePremio)

    setRotationDegrees(totalGrados)

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
          description: `Ruleta Diaria: ${premioGanado.text}`
        })

        if (txError) {
          setIsSpinning(false)
          return
        }

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

      setYaGiroHoy(true)
      setIsSpinning(false)
    }, 3500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 antialiased">
      {/* Fondo */}
      <div 
        className="fixed inset-0 transition-opacity duration-300" 
        style={{ backgroundColor: isDark ? 'rgba(15, 12, 27, 0.85)' : 'rgba(0, 0, 0, 0.5)' }}
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
            className={`absolute top-4 right-4 p-1.5 rounded-xl transition-all ${
              isDark ? 'text-stone-500 hover:text-pink-400 hover:bg-stone-900' : 'text-stone-400 hover:text-pink-500 hover:bg-pink-50'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {isValidating ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }} />
              <Sparkles className="w-4 h-4 absolute animate-pulse" style={{ color: primaryColor }} />
            </div>
            <p className={`text-[11px] uppercase tracking-widest font-mono animate-pulse ${
              isDark ? 'text-stone-500' : 'text-stone-400'
            }`}>
              Cargando...
            </p>
          </div>
        ) : errorMessage ? (
          <div className="py-8 flex flex-col items-center space-y-4">
            <div className="p-3 rounded-full border" style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}20` }}>
              <AlertCircle className="w-8 h-8" style={{ color: primaryColor }} />
            </div>
            <h3 className={`font-black text-base tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
              Estado de la cuenta
            </h3>
            <p className={`text-xs px-4 leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              {errorMessage}
            </p>
            <button 
              onClick={onClose} 
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-black tracking-widest uppercase transition hover:scale-105 active:scale-95 ${
                isDark ? 'bg-stone-800 hover:bg-stone-700' : 'bg-stone-900 hover:bg-stone-800'
              }`}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Encabezado */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] uppercase tracking-widest font-black mb-2"
                style={{ borderColor: `${primaryColor}30`, color: primaryColor }}
              >
                <Sparkles className="w-3 h-3 animate-pulse" style={{ color: secondaryColor }} />
                Ruleta VIP
              </div>
              <h3 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
                Gira y gana{' '}
                <span className="font-serif italic font-normal" style={{ color: primaryColor }}>
                  Premios
                </span>
              </h3>
            </div>

            {/* Ruleta */}
            <div className="relative w-64 h-64 mx-auto my-4 flex items-center justify-center">
              {/* Marcador */}
              <div className="absolute -top-2.5 z-30 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[22px]"
                style={{ borderTopColor: primaryColor }}
              />

              {/* Anillo */}
              <div className="absolute inset-0 rounded-full border-[6px] pointer-events-none"
                style={{ borderColor: isDark ? '#1a1625' : '#f3f4f6' }}
              />

              <div
                ref={ruletaRef}
                style={{
                  transform: `rotate(${rotationDegrees}deg)`,
                  transition: isSpinning ? 'transform 3.5s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none',
                }}
                className="w-full h-full rounded-full overflow-hidden relative"
              >
                {PREMIOS.map((premio, idx) => {
                  const angle = 60 * idx
                  return (
                    <div
                      key={premio.id}
                      className="absolute top-0 left-0 w-full h-full origin-center flex items-center justify-center text-white select-none"
                      style={{
                        transform: `rotate(${angle}deg)`,
                        clipPath: 'polygon(50% 50%, 50% 0%, 100% 28.87%, 100% 30%)',
                        backgroundColor: premio.color,
                      }}
                    >
                      <span className="absolute top-7 font-mono text-[8px] font-black tracking-tight uppercase text-center w-16 whitespace-normal leading-3 text-white drop-shadow-lg"
                        style={{ transform: 'rotate(30deg)' }}
                      >
                        {premio.text.replace(' Pts ', '\n')}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Botón central */}
              <button
                onClick={ejecutarGiro}
                disabled={isSpinning || yaGiroHoy}
                className={`absolute w-16 h-16 rounded-full border-4 flex flex-col items-center justify-center z-20 font-black transition-all ${
                  yaGiroHoy 
                    ? 'bg-stone-700 text-stone-400 cursor-not-allowed' 
                    : isSpinning 
                      ? 'animate-pulse' 
                      : 'hover:scale-105 active:scale-95'
                }`}
                style={yaGiroHoy ? {} : isSpinning ? {
                  background: brandGradient.backgroundImage,
                  borderColor: isDark ? '#1a1625' : '#f3f4f6'
                } : {
                  background: brandGradient.backgroundImage,
                  borderColor: isDark ? '#1a1625' : '#f3f4f6',
                  boxShadow: `0 0 30px ${primaryColor}40`
                }}
              >
                <span className="text-[9px] uppercase font-mono tracking-tighter text-white">
                  {yaGiroHoy ? 'Listo' : isSpinning ? '...' : 'Girar'}
                </span>
                {!yaGiroHoy && !isSpinning && (
                  <Gift className="w-3 h-3 text-white/80" />
                )}
              </button>
            </div>

            {/* Resultado */}
            <div className={`min-h-[50px] flex items-center justify-center px-4 rounded-2xl border py-3 ${
              isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-stone-50/50 border-pink-100/60'
            }`}>
              {chosenPrize ? (
                <div className="space-y-0.5">
                  <p className={`text-[9px] uppercase tracking-widest font-black ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                    ¡Premio!
                  </p>
                  <p className={`text-sm font-bold flex items-center justify-center gap-1.5 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    <Award className="w-4 h-4" style={{ color: primaryColor }} />
                    <span style={{ color: primaryColor }}>{chosenPrize.text}</span>
                  </p>
                </div>
              ) : yaGiroHoy ? (
                <p className={`text-xs font-medium italic ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                  ✨ Vuelve mañana para más premios
                </p>
              ) : (
                <p className={`text-xs font-medium ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                  Presiona el centro para girar
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}