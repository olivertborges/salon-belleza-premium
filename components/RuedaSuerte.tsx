'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { X, Sparkles, Award, AlertCircle, Loader2, Database } from 'lucide-react'

interface RuletaModalProps {
  isOpen: boolean
  onClose: () => void
  onPremioProcesado?: () => void
  usuarioActivo?: any
  tenantIdActivo?: string
}

// Colores Premium adaptados a la paleta Chic (Rosas, Oros, Carbón)
const PREMIOS = [
  { id: 1, text: '50 Pts Peluquería', value: 50, type: 'hair', color: '#d97706' }, // Oro profundo
  { id: 2, text: '10 Pts Estética', value: 10, type: 'glow', color: '#db2777' },   // Rosa vibrante
  { id: 3, text: 'Sigue Intentando', value: 0, type: 'none', color: '#292524' },   // Carbón estético
  { id: 4, text: '100 Pts Peluquería', value: 100, type: 'hair', color: '#f59e0b' }, // Oro brillante
  { id: 5, text: '50 Pts Estética', value: 50, type: 'glow', color: '#ec4899' },    // Rosa glow
  { id: 6, text: 'Suerte Próxima', value: 0, type: 'none', color: '#44403c' },     // Stone oscuro
]

export default function RuletaModal({ isOpen, onClose, onPremioProcesado, usuarioActivo, tenantIdActivo }: RuletaModalProps) {
  const { refreshUserData } = useAuth()
  const [isValidating, setIsValidating] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [resolvedTenantId, setResolvedTenantId] = useState<string | null>(null)
  const [yaGiroHoy, setYaGiroHoy] = useState(false)

  const [isSpinning, setIsSpinning] = useState(false)
  const [chosenPrize, setChosenPrize] = useState<typeof PREMIOS[0] | null>(null)
  const [rotationDegrees, setRotationDegrees] = useState(0)
  const ruletaRef = useRef<HTMLDivElement>(null)

  const [debugTokenExists, setDebugTokenExists] = useState<string>('Cargando...')
  const [debugRawUser, setDebugRawUser] = useState<string>('Cargando...')
  const [debugClientTable, setDebugClientTable] = useState<string>('Cargando...')
  const [debugDBWriteStatus, setDebugDBWriteStatus] = useState<string>('Esperando tiro...')

  useEffect(() => {
    async function validarAccesoRuleta() {
      if (!isOpen) return

      setIsValidating(true)
      setErrorMessage(null)
      setYaGiroHoy(false)
      setChosenPrize(null)

      try {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('freshnails-auth-token')
          setDebugTokenExists(token ? '✅ SÍ EXISTE EN STORAGE' : '❌ NO EXISTE (Vacio)')
        }

        let currentUserId = usuarioActivo?.id

        const { data: { session } } = await supabase.auth.getSession()
        currentUserId = session?.user?.id
        
        if (session?.user) {
          setDebugRawUser(`✅ ID: ${session.user.id}`)
        } else {
          setDebugRawUser('❌ Supabase reporta session = null')
          setErrorMessage('No hay sesión activa de Supabase.')
          setIsValidating(false)
          return
        }

        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id, tenant_id')
          .eq('auth_user_id', currentUserId)
          .maybeSingle()

        if (clientError) {
          setDebugClientTable(`❌ Error DB: ${clientError.message}`)
          setErrorMessage(`Error de base de datos: ${clientError.message}`)
          setIsValidating(false)
          return
        }

        if (!clientData) {
          setDebugClientTable('❌ Tu usuario NO existe en la tabla "clients"')
          setErrorMessage('Tu cuenta no está vinculada a un perfil de cliente.')
          setIsValidating(false)
          return
        }

        setDebugClientTable(`✅ Cliente ID: ${clientData.id} | Tenant: ${clientData.tenant_id}`)

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
          setDebugDBWriteStatus('ℹ️ Ya giraste hoy de forma preventiva.')
        } else {
          setDebugDBWriteStatus('✅ Listo para girar.')
        }

        setIsValidating(false)
      } catch (error: any) {
        setErrorMessage(`Ocurrió un error inesperado: ${error.message || error}`)
        setIsValidating(false)
      }
    }

    validarAccesoRuleta()
  }, [isOpen, usuarioActivo, tenantIdActivo])

  const ejecutarGiro = async () => {
    if (isSpinning || yaGiroHoy || !clientId || !resolvedTenantId) return

    setIsSpinning(true)
    setChosenPrize(null)
    setDebugDBWriteStatus('⏳ Girando... Esperando detención...')

    const randomIndex = Math.floor(Math.random() * PREMIOS.length)
    const premioGanado = PREMIOS[randomIndex]

    const gradosPorSeccion = 360 / PREMIOS.length
    const desfasePremio = randomIndex * gradosPorSeccion
    const totalGrados = 1800 + (360 - desfasePremio)

    setRotationDegrees(totalGrados)

    setTimeout(async () => {
      setChosenPrize(premioGanado)

      if (premioGanado.value > 0) {
        setDebugDBWriteStatus('💾 Insertando historial con tipos estrictos...')
        
        const { error: txError } = await supabase.from('loyalty_transactions').insert({
          client_id: clientId,
          tenant_id: resolvedTenantId,
          points: premioGanado.value,
          type: 'earned',       
          wallet_type: premioGanado.type, 
          category: 'manual',    
          description: `Premio obtenido en Ruleta Diaria: ${premioGanado.text}`
        })

        if (txError) {
          setDebugDBWriteStatus(`❌ Error Historial: ${txError.message} (Código: ${txError.code})`)
          setIsSpinning(false)
          return
        }

        const columnaPuntos = premioGanado.type === 'hair' ? 'hair_points' : 'glow_points'
        setDebugDBWriteStatus('💾 Leyendo billetera (loyalty_wallets)...')

        const { data: wallet, error: walletGetError } = await supabase
          .from('loyalty_wallets')
          .select('*')
          .eq('client_id', clientId)
          .eq('tenant_id', resolvedTenantId)
          .maybeSingle()

        if (walletGetError) {
          setDebugDBWriteStatus(`❌ Error billetera: ${walletGetError.message}`)
          setIsSpinning(false)
          return
        }

        if (wallet) {
          setDebugDBWriteStatus(`💾 Actualizando saldo en columna: ${columnaPuntos}`)
          const { error: updateError } = await supabase
            .from('loyalty_wallets')
            .update({ [columnaPuntos]: (wallet[columnaPuntos] || 0) + premioGanado.value })
            .eq('client_id', clientId)
            .eq('tenant_id', resolvedTenantId)

          if (updateError) {
            setDebugDBWriteStatus(`❌ Error actualizando saldo: ${updateError.message}`)
            setIsSpinning(false)
            return
          }
        } else {
          setDebugDBWriteStatus('💾 Creando saldo inicial de billetera...')
          const { error: insertWalletError } = await supabase
            .from('loyalty_wallets')
            .insert({
              client_id: clientId,
              tenant_id: resolvedTenantId,
              hair_points: premioGanado.type === 'hair' ? premioGanado.value : 0,
              glow_points: premioGanado.type === 'glow' ? premioGanado.value : 0
            })

          if (insertWalletError) {
            setDebugDBWriteStatus(`❌ Error saldo inicial: ${insertWalletError.message}`)
            setIsSpinning(false)
            return
          }
        }

        setDebugDBWriteStatus('🔄 Sincronizando con la interfaz...')
        if (refreshUserData) {
          await refreshUserData()
        }

        setDebugDBWriteStatus('🎉 ¡PUNTOS ASENTADOS CON ÉXITO!')
        if (onPremioProcesado) onPremioProcesado()
      } else {
        setDebugDBWriteStatus('ℹ️ 0 puntos ganados. Fin del proceso.')
      }

      setYaGiroHoy(true)
      setIsSpinning(false)
    }, 3500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 antialiased">
      {/* Fondo traslúcido estilizado */}
      <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-md transition-opacity duration-300" onClick={!isSpinning ? onClose : undefined} />

      <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-gradient-to-b from-stone-900 to-stone-950 border border-pink-950/40 p-6 text-center shadow-2xl z-10 transition-all">
        
        {/* PANEL DE AUDITORÍA CON ESTILO TERMINAL MINIMALISTA */}
        <div className="mb-5 p-3.5 bg-stone-950/80 rounded-2xl border border-stone-800 text-left text-[10px] font-mono space-y-1 text-stone-400 shadow-inner">
          <div className="flex items-center gap-1.5 text-pink-400 font-black border-b border-stone-900 pb-1 mb-1.5 uppercase tracking-wider">
            <Database className="w-3 h-3" /> Monitor de Procesos Supabase
          </div>
          <p>• LocalStorage: <span className="font-bold text-stone-200">{debugTokenExists}</span></p>
          <p>• Auth User UID: <span className="font-bold text-stone-200">{debugRawUser}</span></p>
          <p>• Tabla Clients: <span className="font-bold text-stone-200">{debugClientTable}</span></p>
          <p className="border-t border-stone-900 pt-1 mt-1.5 text-amber-400">• Estado Transacción: <span className="font-bold text-stone-100">{debugDBWriteStatus}</span></p>
        </div>

        {!isSpinning && (
          <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-pink-400 p-1.5 rounded-xl hover:bg-stone-900 transition-all">
            <X className="w-4 h-4" />
          </button>
        )}

        {isValidating ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
              <Sparkles className="w-4 h-4 text-amber-400 absolute animate-pulse" />
            </div>
            <p className="text-stone-400 font-mono text-[11px] uppercase tracking-widest animate-pulse">Sincronizando con el Atelier...</p>
          </div>
        ) : errorMessage ? (
          <div className="py-8 flex flex-col items-center space-y-4">
            <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-white font-black text-base tracking-tight">Estado de la cuenta</h3>
            <p className="text-stone-400 text-xs px-4 leading-relaxed">{errorMessage}</p>
            <button onClick={onClose} className="mt-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-white text-xs font-black tracking-widest uppercase">Cerrar</button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-500/10 to-amber-500/10 border border-pink-500/20 px-3 py-1 rounded-full text-pink-400 text-[10px] uppercase tracking-widest font-black mb-2">
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" /> Fresh Luck VIP
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white">
                Gira y gana <span className="font-serif italic font-normal text-pink-400">Premios</span>
              </h3>
            </div>

            {/* ENTORNO COMPLETO DE LA RULETA */}
            <div className="relative w-64 h-64 mx-auto my-4 flex items-center justify-center">
              {/* Marcador superior estilizado */}
              <div className="absolute -top-2.5 z-30 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[22px] border-t-pink-500 filter drop-shadow-[0_2px_4px_rgba(236,72,153,0.4)]" />
              
              {/* Anillo de contención premium */}
              <div className="absolute inset-0 rounded-full border-[6px] border-stone-950 shadow-2xl shadow-pink-500/5 z-10 pointer-events-none" />

              <div
                ref={ruletaRef}
                style={{
                  transform: `rotate(${rotationDegrees}deg)`,
                  transition: isSpinning ? 'transform 3.5s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none',
                }}
                className="w-full h-full rounded-full overflow-hidden relative border border-stone-950"
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
                      <span className="absolute top-7 font-mono text-[9px] font-black tracking-tight uppercase text-center w-20 whitespace-normal leading-3 text-stone-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" style={{ transform: 'rotate(30deg)' }}>
                        {premio.text.replace(' Pts ', '\n')}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Botón Núcleo Interactuable */}
              <button
                onClick={ejecutarGiro}
                disabled={isSpinning || yaGiroHoy}
                className={`absolute w-16 h-16 rounded-full border-4 border-stone-950 shadow-2xl flex flex-col items-center justify-center z-20 font-black transition-all ${
                  yaGiroHoy 
                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed shadow-none' 
                    : isSpinning 
                      ? 'bg-pink-600 text-white animate-pulse' 
                      : 'bg-gradient-to-br from-pink-400 via-pink-500 to-amber-500 text-white hover:scale-105 active:scale-95 shadow-pink-500/20'
                }`}
              >
                <span className="text-[10px] uppercase font-mono tracking-tighter">
                  {yaGiroHoy ? 'Listo' : isSpinning ? '...' : 'GIRAR'}
                </span>
              </button>
            </div>

            {/* FOOTER MENSAJE DE RESULTADO */}
            <div className="min-h-[50px] flex items-center justify-center px-4 bg-stone-950/40 rounded-2xl border border-stone-900 py-3">
              {chosenPrize ? (
                <div className="space-y-0.5">
                  <p className="text-stone-500 text-[10px] uppercase tracking-widest font-black">¡Atelier Glamour!</p>
                  <p className="text-white text-sm font-bold flex items-center justify-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" /> Reclamaste: <span className="text-pink-400 font-black">{chosenPrize.text}</span>
                  </p>
                </div>
              ) : yaGiroHoy ? (
                <p className="text-stone-500 text-xs font-medium italic">Tu oportunidad dorada de hoy concluyó. ¡Vuelve mañana!</p>
              ) : (
                <p className="text-stone-400 text-xs font-medium leading-relaxed">Presiona el núcleo dorado para iniciar tu fortuna diaria.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
