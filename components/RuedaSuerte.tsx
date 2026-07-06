'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js' // 👈 Importamos el creador nativo para asegurar la persistencia
import { X, Sparkles, Award, AlertCircle, Loader2 } from 'lucide-react'

// Creamos un cliente local ultra-seguro y persistente SOLO para la ruleta
// Esto obliga al navegador a buscar el token de sesión en el LocalStorage sí o sí.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabaseRuleta = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
})

interface RuletaModalProps {
  isOpen: boolean
  onClose: () => void
  onPremioProcesado?: () => void
  usuarioActivo?: any
  tenantIdActivo?: string
}

const PREMIOS = [
  { id: 1, text: '50 Pts Peluquería', value: 50, type: 'hair', color: '#f59e0b' },
  { id: 2, text: '10 Pts Estética', value: 10, type: 'glow', color: '#ec4899' },
  { id: 3, text: 'Sigue Intentando', value: 0, type: 'none', color: '#6b7280' },
  { id: 4, text: '100 Pts Peluquería', value: 100, type: 'hair', color: '#d97706' },
  { id: 5, text: '50 Pts Estética', value: 50, type: 'glow', color: '#db2777' },
  { id: 6, text: 'Suerte Próxima', value: 0, type: 'none', color: '#4b5563' },
]

export default function RuletaModal({ isOpen, onClose, onPremioProcesado, usuarioActivo, tenantIdActivo }: RuletaModalProps) {
  const [isValidating, setIsValidating] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [resolvedTenantId, setResolvedTenantId] = useState<string | null>(null)
  const [yaGiroHoy, setYaGiroHoy] = useState(false)

  const [isSpinning, setIsSpinning] = useState(false)
  const [chosenPrize, setChosenPrize] = useState<typeof PREMIOS[0] | null>(null)
  const [rotationDegrees, setRotationDegrees] = useState(0)
  const ruletaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function validarAccesoRuleta() {
      if (!isOpen) return
      
      setIsValidating(true)
      setErrorMessage(null)
      setYaGiroHoy(false)
      setChosenPrize(null)

      try {
        let currentUserId = usuarioActivo?.id
        let currentTenantId = tenantIdActivo

        // 🔍 FORZAR DETECCIÓN: Le pedimos la sesión a nuestra instancia persistente
        if (!currentUserId) {
          console.log('📡 [Ruleta] Forzando lectura de sesión persistente...');
          
          // Intentamos primero con la sesión actual
          const { data: { session }, error: sessionError } = await supabaseRuleta.auth.getSession()
          
          if (sessionError) {
            console.error('❌ [Ruleta] Error al extraer sesión persistente:', sessionError)
          }

          if (session?.user) {
            currentUserId = session.user.id
            console.log('✅ [Ruleta] ¡Sesión encontrada por LocalStorage! ID:', currentUserId)
          } else {
            // Intento desesperado secundario: Ver si hay un usuario actual cargado en memoria
            const { data: { user } } = await supabaseRuleta.auth.getUser()
            if (user) {
              currentUserId = user.id
              console.log('✅ [Ruleta] ¡Usuario recuperado mediante getUser()! ID:', currentUserId)
            }
          }
        }

        // Si después de forzar la persistencia sigue dando null, es porque las llaves de autenticación están en otra cookie o localStorage key
        if (!currentUserId) {
          console.error('❌ [Ruleta] Supabase sigue reportando null. No hay token de login válido en este dominio.');
          setErrorMessage('No se pudo verificar la sesión activa desde el panel principal. Por favor, cierra sesión e ingresa nuevamente.')
          setIsValidating(false)
          return
        }

        // Buscamos el cliente correspondiente en la tabla 'clients'
        console.log('📡 [Ruleta] Buscando perfil en base de datos para el UUID registrado:', currentUserId)
        const { data: clientData, error: clientError } = await supabaseRuleta
          .from('clients')
          .select('id, tenant_id')
          .eq('auth_user_id', currentUserId)
          .maybeSingle()

        if (clientError) {
          console.error('❌ [Ruleta] Error en tabla "clients":', clientError)
          setErrorMessage('Error de conexión al verificar tu perfil de cliente.')
          setIsValidating(false)
          return
        }

        if (!clientData) {
          console.error('❌ [Ruleta] No existe el auth_user_id en la tabla clients. ¿El registro guardó la fila?')
          setErrorMessage('Tu usuario está registrado, pero tu perfil de cliente no está completamente vinculado.')
          setIsValidating(false)
          return
        }

        const finalTenantId = currentTenantId || clientData.tenant_id
        
        if (!finalTenantId) {
          setErrorMessage('No se pudo determinar el comercio asociado a tu perfil.')
          setIsValidating(false)
          return
        }

        setClientId(clientData.id)
        setResolvedTenantId(finalTenantId)

        // Verificar si ya giró hoy
        const hoyInicio = new Date()
        hoyInicio.setHours(0, 0, 0, 0)
        const hoyFin = new Date()
        hoyFin.setHours(23, 59, 59, 999)

        const { data: transData } = await supabaseRuleta
          .from('loyalty_transactions')
          .select('id')
          .eq('client_id', clientData.id)
          .eq('tenant_id', finalTenantId)
          .eq('source', 'ruleta')
          .gte('created_at', hoyInicio.toISOString())
          .lte('created_at', hoyFin.toISOString())

        if (transData && transData.length > 0) {
          setYaGiroHoy(true)
        }

        setIsValidating(false)

      } catch (error) {
        console.error('❌ [Ruleta] Excepción atrapada:', error)
        setErrorMessage('Ocurrió un error inesperado al validar tus datos de acceso.')
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
        try {
          await supabaseRuleta.from('loyalty_transactions').insert({
            client_id: clientId,
            tenant_id: resolvedTenantId,
            source: 'ruleta',
            points: premioGanado.value,
            type: premioGanado.type,
            description: `Premio obtenido en Ruleta Diaria: ${premioGanado.text}`
          })

          const columnaPuntos = premioGanado.type === 'hair' ? 'hair_points' : 'glow_points'
          
          const { data: wallet } = await supabaseRuleta
            .from('loyalty_wallets')
            .select('*')
            .eq('client_id', clientId)
            .eq('tenant_id', resolvedTenantId)
            .maybeSingle()

          if (wallet) {
            const saldoActual = wallet[columnaPuntos] || 0
            await supabaseRuleta
              .from('loyalty_wallets')
              .update({ [columnaPuntos]: saldoActual + premioGanado.value })
              .eq('client_id', clientId)
              .eq('tenant_id', resolvedTenantId)
          }
          
          if (onPremioProcesado) onPremioProcesado()

        } catch (dbError) {
          console.error('Fallo al guardar premio:', dbError)
        }
      }

      setYaGiroHoy(true)
      setIsSpinning(false)
    }, 3500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md" onClick={!isSpinning ? onClose : undefined} />

      <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-stone-900 border border-stone-800 p-6 text-center shadow-2xl z-10">
        {!isSpinning && (
          <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-full hover:bg-stone-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}

        {isValidating ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-stone-300 font-mono text-sm tracking-wide animate-pulse">Forzando enlace de sesión segura...</p>
          </div>
        ) : errorMessage ? (
          <div className="py-8 flex flex-col items-center space-y-4">
            <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-white font-medium text-base">Verificación de Cuenta</h3>
            <p className="text-stone-400 text-xs px-4 leading-relaxed">{errorMessage}</p>
            <button onClick={onClose} className="mt-2 px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-medium">Cerrar</button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400 text-[10px] uppercase tracking-wider font-medium mb-2">
                <Sparkles className="w-3 h-3" /> Club VIP Activo
              </div>
              <h3 className="text-xl font-light tracking-tight text-white">
                Gira y gana <span className="font-serif italic text-amber-500">Puntos</span>
              </h3>
            </div>

            <div className="relative w-64 h-64 mx-auto my-4 flex items-center justify-center">
              <div className="absolute -top-2 z-30 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-rose-500 filter drop-shadow-md" />
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/40 shadow-2xl shadow-amber-500/10" />

              <div
                ref={ruletaRef}
                style={{
                  transform: `rotate(${rotationDegrees}deg)`,
                  transition: isSpinning ? 'transform 3.5s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none',
                }}
                className="w-full h-full rounded-full overflow-hidden relative border-2 border-stone-900"
              >
                {PREMIOS.map((premio, idx) => {
                  const angle = 60 * idx
                  return (
                    <div
                      key={premio.id}
                      className="absolute top-0 left-0 w-full h-full origin-center flex items-center justify-center text-white"
                      style={{
                        transform: `rotate(${angle}deg)`,
                        clipPath: 'polygon(50% 50%, 50% 0%, 100% 28.87%, 100% 30%)',
                        backgroundColor: premio.color,
                      }}
                    >
                      <span className="absolute top-8 font-mono text-[9px] font-bold tracking-tighter uppercase text-center w-24 whitespace-normal leading-3" style={{ transform: 'rotate(30deg)' }}>
                        {premio.text.replace(' Pts ', '\n')}
                      </span>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={ejecutarGiro}
                disabled={isSpinning || yaGiroHoy}
                className={`absolute w-16 h-16 rounded-full border-4 border-stone-900 shadow-xl flex flex-col items-center justify-center z-20 font-bold transition-all ${
                  yaGiroHoy ? 'bg-stone-700 text-stone-400 cursor-not-allowed' : isSpinning ? 'bg-amber-600 text-white animate-pulse' : 'bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 hover:scale-105'
                }`}
              >
                <span className="text-[10px] uppercase font-mono tracking-tighter">
                  {yaGiroHoy ? 'Listo' : isSpinning ? '...' : 'GIRAR'}
                </span>
              </button>
            </div>

            <div className="min-h-[48px] flex items-center justify-center px-4">
              {chosenPrize ? (
                <div className="space-y-1">
                  <p className="text-stone-400 text-xs font-light">¡Felicitaciones!</p>
                  <p className="text-white text-sm font-medium flex items-center justify-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" /> Ganaste <span className="text-amber-400 font-bold">{chosenPrize.text}</span>
                  </p>
                </div>
              ) : yaGiroHoy ? (
                <p className="text-stone-500 text-xs italic font-light">Ya has jugado tu tiro de hoy. Vuelve mañana.</p>
              ) : (
                <p className="text-stone-400 text-xs font-light leading-relaxed">Presiona el centro para iniciar la ruleta diaria.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}