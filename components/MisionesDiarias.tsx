// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle2, Circle, Flame, Trophy, Sparkles, Gem, Star } from 'lucide-react'

interface Mision {
  id: string
  title: string
  description: string
  icon: string
  points: number
  target: number
  progress: number
  completed: boolean
  category?: 'glow' | 'hair'
}

export default function MisionesDiarias() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [misiones, setMisiones] = useState<Mision[]>([])
  const [loading, setLoading] = useState(true)
  const [racha, setRacha] = useState(0)

  const [puntosGlow, setPuntosGlow] = useState(0)
  const [puntosHair, setPuntosHair] = useState(0)
  const [clientId, setClientId] = useState<string | null>(null)

  const isDark = theme === 'dark'

  const getClientId = async () => {
    if (!user?.id) return null
    try {
      const { data } = await supabase
        .from('clients')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      return data?.id || null
    } catch {
      return null
    }
  }

  const cargarSaldosWallet = async (clientId: string) => {
    if (!clientId) return { glow: 0, hair: 0 }
    try {
      const { data } = await supabase
        .from('loyalty_wallets')
        .select('glow_points, hair_points')
        .eq('client_id', clientId)
        .maybeSingle()
      if (!data) return { glow: 0, hair: 0 }

      return {
        glow: data.glow_points || 0,
        hair: data.hair_points || 0
      }
    } catch {
      return { glow: 0, hair: 0 }
    }
  }

  const completarMision = async (misionId: string) => {
    if (!clientId) return

    try {
      const mision = misiones.find(m => m.id === misionId)
      if (!mision || mision.completed) return

      const { error: insertError } = await supabase
        .from('client_missions')
        .insert({
          client_id: clientId,
          mission_id: misionId,
          completed_at: new Date().toISOString()
        })

      if (insertError) throw insertError

      const columnaPuntos = mision.category === 'hair' ? 'hair_points' : 'glow_points'
      const { data: walletData } = await supabase
        .from('loyalty_wallets')
        .select('id, glow_points, hair_points')
        .eq('client_id', clientId)
        .maybeSingle()

      if (walletData) {
        const puntosActuales = walletData[columnaPuntos] || 0
        await supabase
          .from('loyalty_wallets')
          .update({ [columnaPuntos]: puntosActuales + mision.points })
          .eq('id', walletData.id)
      }

      setMisiones(prev => prev.map(m => 
        m.id === misionId ? { ...m, completed: true, progress: m.target } : m
      ))

      const saldos = await cargarSaldosWallet(clientId)
      setPuntosGlow(saldos.glow)
      setPuntosHair(saldos.hair)

      // Notificación visual
      setSuccessMessage(`🎉 ¡Misión completada! Ganaste +${mision.points} puntos.`)
      setTimeout(() => setSuccessMessage(null), 4000)

    } catch (error) {
      console.error(error)
      setErrorMessage('Error al completar la misión')
      setTimeout(() => setErrorMessage(null), 3000)
    }
  }

  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadMisiones() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const cId = await getClientId()
        if (!cId) {
          setLoading(false)
          return
        }
        setClientId(cId)

        const saldos = await cargarSaldosWallet(cId)
        setPuntosGlow(saldos.glow)
        setPuntosHair(saldos.hair)

        const { data: misionesData } = await supabase
          .from('missions')
          .select('*')
          .eq('is_active', true)

        if (!misionesData) {
          setLoading(false)
          return
        }

        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)

        const { data: completadasData } = await supabase
          .from('client_missions')
          .select('mission_id')
          .eq('client_id', cId)
          .gte('completed_at', hoy.toISOString())

        const arrayCompletadas = completadasData || []
        const completadasSet = new Set(arrayCompletadas.map(c => c.mission_id))

        setMisiones(misionesData.map((m: any) => ({
          ...m,
          category: m.category || 'glow',
          progress: completadasSet.has(m.id) ? m.target : 0,
          completed: completadasSet.has(m.id)
        })))
        setRacha(arrayCompletadas.length > 0 ? 3 : 0)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadMisiones()
  }, [user])

  if (loading) return null

  const completadas = misiones.filter(m => m.completed).length
  const porcentaje = misiones.length > 0 ? Math.round((completadas / misiones.length) * 100) : 0

  return (
    <div className={`p-6 md:p-8 rounded-2xl border transition-all duration-300 shadow-sm relative overflow-hidden ${
      isDark 
        ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
        : 'bg-white border-[#F0E4DA] shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
    } space-y-6`}>

      {/* Mensajes flotantes */}
      {successMessage && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 px-6 py-3 rounded-xl border text-sm font-medium shadow-lg animate-fadeIn ${
          isDark 
            ? 'bg-[#3D281E]/90 border-[#D4AF37]/30 text-[#D4AF37]' 
            : 'bg-white border-[#D4AF37]/30 text-[#1A0E0A]'
        }`}>
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 px-6 py-3 rounded-xl border text-sm font-medium shadow-lg animate-fadeIn ${
          isDark 
            ? 'bg-[#3D281E]/90 border-rose-500/30 text-rose-400' 
            : 'bg-white border-rose-300 text-rose-600'
        }`}>
          {errorMessage}
        </div>
      )}

      {/* Elemento decorativo */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-bl-full pointer-events-none" />

      {/* ============================================================ */}
      {/* ENCABEZADO */}
      {/* ============================================================ */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 ${
        isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
            isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
          }`}>
            <Flame className="w-5 h-5 text-[#D4AF37] animate-pulse" />
          </div>
          <div>
            <h2 className={`font-serif text-xl font-light ${
              isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
            }`}>
              Misiones <span className="font-serif italic text-[#D4AF37]">Diarias</span>
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-full border ${
                isDark 
                  ? 'bg-[#3D281E] border-[#D4AF37]/20 text-[#D4AF37]' 
                  : 'bg-[#FFF9F6] border-[#D4AF37]/20 text-[#D4AF37]'
              }`}>
                <Gem className="w-3 h-3 mr-1.5" />
                Glow: {puntosGlow}
              </span>
              <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-full border ${
                isDark 
                  ? 'bg-[#3D281E] border-[#D4AF37]/20 text-[#D4AF37]' 
                  : 'bg-[#FFF9F6] border-[#D4AF37]/20 text-[#D4AF37]'
              }`}>
                <Sparkles className="w-3 h-3 mr-1.5" />
                Hair: {puntosHair}
              </span>
            </div>
          </div>
        </div>

        {/* Racha */}
        {racha > 0 && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
            isDark ? 'bg-[#3D281E] border-[#D4AF37]/20' : 'bg-[#FFF9F6] border-[#D4AF37]/20'
          }`}>
            <Trophy className="w-4 h-4 text-[#D4AF37]" />
            <span className={`text-xs font-black ${
              isDark ? 'text-[#D4AF37]' : 'text-[#D4AF37]'
            }`}>
              Racha: {racha} días 🔥
            </span>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* BARRA DE PROGRESO */}
      {/* ============================================================ */}
      <div className="space-y-2">
        <div className={`flex justify-between text-[10px] font-black uppercase tracking-[0.2em] ${
          isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
        }`}>
          <span className="flex items-center gap-1">
            <Trophy className="w-3 h-3 text-[#D4AF37]" /> META DIARIA
          </span>
          <span className={`font-mono text-[#D4AF37]`}>
            {completadas}/{misiones.length} • {porcentaje}%
          </span>
        </div>
        <div className={`h-2.5 w-full rounded-full p-0.5 border ${
          isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
        }`}>
          <div 
            className="h-full rounded-full bg-[#D4AF37] transition-all duration-700 ease-out" 
            style={{ width: `${porcentaje}%` }} 
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* LISTADO DE MISIONES */}
      {/* ============================================================ */}
      <div className="space-y-3">
        {misiones.map((mision) => {
          const esHair = mision.category === 'hair'
          return (
            <div 
              key={mision.id}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                mision.completed 
                  ? isDark 
                    ? 'opacity-50 bg-[#1E120C] border-[#3D281E]' 
                    : 'opacity-50 bg-[#FFF9F6] border-[#F0E4DA]'
                  : `cursor-pointer hover:-translate-y-0.5 shadow-sm ${
                    isDark 
                      ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40' 
                      : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40'
                  }`
              }`}
              onClick={() => { if (!mision.completed) completarMision(mision.id) }}
            >
              {/* Barra lateral de categoría */}
              {!mision.completed && (
                <div className={`absolute left-0 top-0 h-full w-1 rounded-r-full ${
                  esHair ? 'bg-[#D4AF37]' : 'bg-[#D4AF37]'
                }`} />
              )}

              <div className="flex items-center gap-3.5 pl-1.5 flex-1 min-w-0">
                <div className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300">
                  {mision.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className={`w-5 h-5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs md:text-sm font-medium ${
                    mision.completed 
                      ? isDark ? 'text-[#A89588] line-through' : 'text-[#5C4A3E] line-through'
                      : isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                  }`}>
                    {mision.title}
                  </p>
                  <p className={`text-[10px] font-light mt-0.5 truncate ${
                    isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                  }`}>
                    {mision.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                <span className={`text-[10px] font-black font-mono px-2.5 py-1 rounded-full shadow-sm border ${
                  mision.completed
                    ? isDark 
                      ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588]' 
                      : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E]'
                    : isDark 
                      ? 'bg-[#D4AF37] border-[#D4AF37] text-[#1A0E0A]' 
                      : 'bg-[#D4AF37] border-[#D4AF37] text-[#1A0E0A]'
                }`}>
                  +{mision.points} Pts
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ============================================================ */}
      {/* FOOTER CON ESTADÍSTICA */}
      {/* ============================================================ */}
      <div className={`pt-4 border-t ${
        isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
      }`}>
        <div className="flex items-center justify-between text-[9px]">
          <span className={`font-medium ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
            {completadas === misiones.length ? '🎉 ¡Todas las misiones completadas!' : `Faltan ${misiones.length - completadas} misiones`}
          </span>
          <span className={`font-black uppercase tracking-[0.15em] text-[#D4AF37]`}>
            {porcentaje}% completado
          </span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}