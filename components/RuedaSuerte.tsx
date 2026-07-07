'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { X, Sparkles, Award, AlertCircle, Loader2 } from 'lucide-react'

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
        
        // CORRECCIÓN EXACTA BASADA EN EL SCHEMA VERIFICADO
        const { error: txError } = await supabase.from('loyalty_transactions').insert({
          client_id: clientId,
          tenant_id: resolvedTenantId,
          points: premioGanado.value,
          type: 'earned',       // VALOR VERIFICADO EN EL CHECK
          wallet_type: premioGanado.type, // VALOR VERIFICADO EN EL CHECK ('hair' o 'glow')
          category: 'manual',    // VALOR VERIFICADO EN EL CHECK
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
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md" onClick={!isSpinning ? onClose : undefined} />

      <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-stone-900 border border-stone-800 p-6 text-center shadow-2xl z-10">
        
        {/* PANEL DE AUDITORÍA */}
        <div className="mb-4 p-3 bg-black/60 rounded-xl border border-dashed border-stone-700 text-left text-[11px] font-mono space-y-1 text-stone-300">
          <p className="text-amber-400 font-bold border-b border-stone-800 pb-0.5 mb-1">🔍 AUDITORÍA DE BASE DE DATOS:</p>
          <p>• LocalStorage: <span className="font-bold text-white">{debugTokenExists}</span></p>
          <p>• Auth User UID: <span className="font-bold text-white">{debugRawUser}</span></p>
          <p>• Fila en Clients: <span className="font-bold text-white">{debugClientTable}</span></p>
          <p className="border-t border-stone-800/80 pt-1 mt-1 text-cyan-400">• Operación DB: <span className="font-bold text-white">{debugDBWriteStatus}</span></p>
        </div>

        {!isSpinning && (
          <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-full hover:bg-stone-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}

        {isValidating ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-stone-300 font-mono text-sm tracking-wide animate-pulse">Consultando base de datos...</p>
          </div>
        ) : errorMessage ? (
          <div className="py-8 flex flex-col items-center space-y-4">
            <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-white font-medium text-base">Estado de la cuenta</h3>
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
