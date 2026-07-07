'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle2, Circle, Flame, Trophy } from 'lucide-react'

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
    <div className={`border p-6 sm:p-8 rounded-3xl transition-all duration-300 shadow-md ${
      isDark ? 'bg-[#141211] border-stone-850' : 'bg-white border-stone-200'
    } space-y-6`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 dark:border-stone-900">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border rounded-xl flex items-center justify-center bg-orange-50 dark:bg-orange-500/10 dark:border-orange-500/20">
            <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
          </div>
          <div>
            <h2 className={`text-xl font-extralight tracking-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
              Misiones <span className="font-serif italic font-normal text-rose-600 dark:text-rose-300">Diarias</span>
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <p className="text-[10px] font-mono font-semibold text-rose-500">✨ Estética: {puntosGlow} pts</p>
              <p className="text-[10px] font-mono font-semibold text-amber-500">💇 Peluquería: {puntosHair} pts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-mono tracking-wider text-stone-400">
          <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-amber-500" /> Progreso</span>
          <span>{completadas}/{misiones.length} • {porcentaje}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-stone-100 dark:bg-stone-950 border dark:border-stone-900 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all duration-500" style={{ width: `${porcentaje}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {misiones.map((mision) => (
          <div 
            key={mision.id}
            className={`flex items-center justify-between p-4 rounded-xl border ${
              mision.completed ? 'opacity-60 bg-stone-900/10' : 'cursor-pointer hover:border-stone-500 bg-stone-900/30'
            }`}
            onClick={() => { if (!mision.completed) completarMision(mision.id) }}
          >
            <div className="flex items-center gap-3">
              {mision.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-stone-600" />}
              <div>
                <p className={`text-xs md:text-sm font-light ${mision.completed ? 'line-through text-stone-500' : ''}`}>{mision.title}</p>
                <p className="text-[9px] text-stone-500">{mision.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-amber-400 font-bold">+{mision.points}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
