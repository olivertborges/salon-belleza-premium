'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle2, Circle, Flame, Trophy, Sparkles } from 'lucide-react'

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

      alert(`🎉 ¡Misión completada! Ganaste +${mision.points} puntos.`)
    } catch (error) {
      console.error(error)
    }
  }

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
    <div className={`p-6 md:p-8 rounded-3xl border transition-all duration-500 shadow-xl relative overflow-hidden ${
      isDark ? 'bg-stone-900/60 border-pink-950/30 backdrop-blur-md' : 'bg-white border-pink-100/70'
    } space-y-6`}>
      
      {/* Elemento sutil decorativo en la esquina */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 dark:bg-pink-500/10 rounded-bl-full pointer-events-none"></div>

      {/* ENCABEZADO CHIC */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-pink-100/40 dark:border-stone-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-pink-500 to-amber-400 text-white shadow-md shadow-pink-500/20">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-stone-800 dark:text-white">
              Misiones <span className="font-serif italic font-normal text-pink-500 dark:text-pink-400">Diarias</span>
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/10">
                ✨ Glow: {puntosGlow}
              </span>
              <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10">
                💇 Hair: {puntosHair}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* METRO DE PROGRESO PREMIUM */}
      <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-black tracking-widest uppercase text-stone-500 dark:text-stone-400">
          <span className="flex items-center gap-1">
            <Trophy className="w-3 h-3 text-amber-500 animate-bounce" /> META DIARIA
          </span>
          <span className="font-mono text-pink-500 dark:text-pink-400">
            {completadas}/{misiones.length} • {porcentaje}%
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-stone-100 dark:bg-stone-950 p-0.5 border border-pink-100/30 dark:border-stone-850 overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-pink-500 via-pink-400 to-amber-400 transition-all duration-700 ease-out shadow-sm" 
            style={{ width: `${porcentaje}%` }} 
          />
        </div>
      </div>

      {/* LISTADO DE MISIONES GLAMOUR */}
      <div className="space-y-3">
        {misiones.map((mision) => {
          const esHair = mision.category === 'hair'
          return (
            <div 
              key={mision.id}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                mision.completed 
                  ? 'opacity-50 bg-stone-100/50 dark:bg-stone-950/30 border-stone-200 dark:border-stone-850' 
                  : `cursor-pointer bg-gradient-to-r from-white to-stone-50/50 dark:from-stone-950 dark:to-stone-900/60 shadow-sm border-pink-100/60 dark:border-stone-800/80 hover:border-pink-400 dark:hover:border-pink-500/40 hover:-translate-y-0.5`
              }`}
              onClick={() => { if (!mision.completed) completarMision(mision.id) }}
            >
              {/* Barra lateral sutil de categoría */}
              {!mision.completed && (
                <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${
                  esHair ? 'from-amber-400 to-amber-500' : 'from-pink-500 to-pink-400'
                }`} />
              )}

              <div className="flex items-center gap-3.5 pl-1.5">
                <div className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300">
                  {mision.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className={`w-5 h-5 ${esHair ? 'text-amber-400' : 'text-pink-400'}`} />
                  )}
                </div>
                <div>
                  <p className={`text-xs md:text-sm font-black text-stone-800 dark:text-stone-200 ${
                    mision.completed ? 'line-through text-stone-400 dark:text-stone-500 font-normal' : ''
                  }`}>
                    {mision.title}
                  </p>
                  <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 mt-0.5">
                    {mision.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`text-xs font-black tracking-tight font-mono px-2.5 py-1 rounded-xl shadow-sm ${
                  mision.completed
                    ? 'bg-stone-200 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                    : esHair 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-pink-500 text-white'
                }`}>
                  +{mision.points} Pts
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
