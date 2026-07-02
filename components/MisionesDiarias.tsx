'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { 
  CheckCircle2, Circle, Flame, Sparkles, Trophy, 
  Calendar, Users, Share2, User, Star, Award
} from 'lucide-react'

interface Mision {
  id: string
  title: string
  description: string
  icon: string
  points: number
  target: number
  progress: number
  completed: boolean
}

export default function MisionesDiarias() {
  const { theme } = useTheme()
  const { user, tenantId } = useAuth()
  const [misiones, setMisiones] = useState<Mision[]>([])
  const [loading, setLoading] = useState(true)
  const [racha, setRacha] = useState(0)
  const [totalPuntos, setTotalPuntos] = useState(0)
  const [clientId, setClientId] = useState<string | null>(null)

  const isDark = theme === 'dark'

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Calendar, Users, Share2, User, Star, Award
    }
    return icons[iconName] || Star
  }

  // Obtener client_id
  const getClientId = async () => {
    if (!user?.id) return null
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      if (error) return null
      return data?.id || null
    } catch (error) {
      return null
    }
  }

  // Obtener puntos de loyalty_wallets
  const obtenerPuntosWallet = async (clientId: string) => {
    if (!clientId || !tenantId) return 0
    try {
      const { data, error } = await supabase
        .from('loyalty_wallets')
        .select('glow_points')
        .eq('client_id', clientId)
        .eq('tenant_id', tenantId)
        .single()
      if (error) return 0
      return data?.glow_points || 0
    } catch (error) {
      return 0
    }
  }

  // Sumar puntos a loyalty_wallets
  const sumarPuntosWallet = async (clientId: string, puntos: number) => {
    if (!clientId || !tenantId) return
    
    try {
      // Verificar si existe wallet
      const { data: walletData } = await supabase
        .from('loyalty_wallets')
        .select('glow_points')
        .eq('client_id', clientId)
        .eq('tenant_id', tenantId)
        .single()

      if (!walletData) {
        // Crear wallet si no existe
        await supabase
          .from('loyalty_wallets')
          .insert([{
            client_id: clientId,
            tenant_id: tenantId,
            glow_points: puntos,
            hair_points: 0,
            created_at: new Date().toISOString()
          }])
      } else {
        // Sumar puntos a wallet existente
        await supabase
          .from('loyalty_wallets')
          .update({
            glow_points: (walletData.glow_points || 0) + puntos,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', clientId)
          .eq('tenant_id', tenantId)
      }
      
      // Actualizar puntos totales
      const nuevosPuntos = await obtenerPuntosWallet(clientId)
      setTotalPuntos(nuevosPuntos)
      
    } catch (error) {
      console.error('Error sumando puntos a wallet:', error)
    }
  }

  useEffect(() => {
    async function loadMisiones() {
      if (!user?.id || !tenantId) {
        setLoading(false)
        return
      }

      try {
        // Obtener client_id
        const cId = await getClientId()
        if (!cId) {
          setLoading(false)
          return
        }
        setClientId(cId)

        // Obtener puntos de wallet
        const puntos = await obtenerPuntosWallet(cId)
        setTotalPuntos(puntos)

        // Obtener misiones del sistema
        const { data: misionesData, error: misionesError } = await supabase
          .from('missions')
          .select('*')
          .eq('is_active', true)
          .eq('tenant_id', tenantId)
          .order('order', { ascending: true })

        if (misionesError) {
          console.error('Error cargando misiones:', misionesError)
          setLoading(false)
          return
        }

        // Obtener misiones completadas hoy
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        const hoyStr = hoy.toISOString()

        const { data: completadasData } = await supabase
          .from('client_missions')
          .select('mission_id')
          .eq('client_id', cId)
          .eq('tenant_id', tenantId)
          .gte('completed_at', hoyStr)

        const completadasSet = new Set(completadasData?.map(c => c.mission_id) || [])

        // Mapear misiones con su estado
        const misionesConEstado = misionesData.map((mision: any) => ({
          ...mision,
          progress: completadasSet.has(mision.id) ? mision.target : 0,
          completed: completadasSet.has(mision.id)
        }))

        setMisiones(misionesConEstado)

        // Calcular racha
        const rachaCalculada = completadasData?.length > 0 ? 3 : 0
        setRacha(rachaCalculada)

      } catch (error) {
        console.error('Error en loadMisiones:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMisiones()
  }, [user, tenantId])

  const completarMision = async (misionId: string) => {
    if (!clientId || !tenantId) return
    
    try {
      // Buscar la misión
      const mision = misiones.find(m => m.id === misionId)
      if (!mision || mision.completed) return

      // Registrar misión completada
      const { error: insertError } = await supabase
        .from('client_missions')
        .insert([{
          client_id: clientId,
          mission_id: misionId,
          tenant_id: tenantId,
          completed_at: new Date().toISOString()
        }])

      if (insertError) throw insertError

      // Sumar puntos a loyalty_wallets
      await sumarPuntosWallet(clientId, mision.points)

      // Actualizar estado local
      setMisiones(prev => prev.map(m => 
        m.id === misionId 
          ? { ...m, completed: true, progress: m.target }
          : m
      ))

      alert(`🎉 ¡Misión completada! Has ganado +${mision.points} puntos`)

    } catch (error) {
      console.error('Error completando misión:', error)
      alert('Error al completar la misión')
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 rounded-3xl border ${
        isDark ? 'bg-[#141211] border-stone-850' : 'bg-white border-stone-200'
      }`}>
        <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const completadas = misiones.filter(m => m.completed).length
  const porcentaje = misiones.length > 0 ? Math.round((completadas / misiones.length) * 100) : 0

  return (
    <div className={`border p-6 sm:p-8 rounded-3xl transition-all duration-300 shadow-md ${
      isDark 
        ? 'bg-[#141211] border-stone-850 shadow-[0_30px_60px_rgba(0,0,0,0.5)]' 
        : 'bg-white border-stone-200'
    } space-y-6`}>

      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 ${
        isDark ? 'border-stone-900' : 'border-stone-100'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 border rounded-xl flex items-center justify-center ${
            isDark 
              ? 'bg-gradient-to-r from-orange-500/10 to-rose-500/10 border-orange-500/20' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <Flame className="w-5 h-5 text-orange-500 dark:text-orange-400 animate-pulse" />
          </div>
          <div>
            <h2 className={`text-xl font-extralight tracking-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
              Misiones <span className="font-serif italic font-normal text-rose-600 dark:text-rose-300">Diarias</span>
            </h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-medium mt-1">
              {misiones.length} misiones • {totalPuntos} puntos totales
            </p>
          </div>
        </div>

        <div className={`inline-flex items-center gap-2 border px-4 py-2 rounded-xl self-start sm:self-center ${
          isDark ? 'bg-orange-500/5 border-orange-500/20' : 'bg-orange-50/50 border-orange-200'
        }`}>
          <span className="text-xs text-stone-500 dark:text-stone-400 font-light">Racha:</span>
          <span className="text-sm font-mono font-bold text-orange-500 dark:text-orange-400 flex items-center gap-1">
            {racha} {racha === 1 ? 'Día' : 'Días'} 
            {racha > 0 && <Flame className="w-3.5 h-3.5 fill-orange-500/20" />}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className={`flex justify-between text-[11px] font-mono tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Progreso de hoy</span>
          <span className={`font-bold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
            {completadas}/{misiones.length} • {porcentaje}%
          </span>
        </div>
        <div className={`h-2 w-full rounded-full overflow-hidden border relative ${
          isDark ? 'bg-stone-950 border-stone-900' : 'bg-stone-100 border-stone-200/60'
        }`}>
          <div 
            className="h-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {misiones.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            <p className="text-sm">No hay misiones disponibles hoy</p>
            <p className="text-[10px] mt-1">Vuelve más tarde para nuevas misiones</p>
          </div>
        ) : (
          misiones.map((mision) => {
            const IconComponent = getIcon(mision.icon)

            return (
              <div 
                key={mision.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                  mision.completed 
                    ? isDark
                      ? 'bg-stone-900/20 border-stone-850/60 opacity-60' 
                      : 'bg-stone-50 border-stone-200/60 opacity-60'
                    : isDark
                      ? 'bg-stone-900/40 border-stone-850 hover:border-stone-700 cursor-pointer'
                      : 'bg-stone-50/60 border-stone-200 hover:border-stone-300 cursor-pointer'
                }`}
                onClick={() => {
                  if (!mision.completed) {
                    completarMision(mision.id)
                  }
                }}
              >
                <div className="flex items-center gap-3.5 max-w-[75%]">
                  {mision.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className={`w-5 h-5 shrink-0 ${isDark ? 'text-stone-700' : 'text-stone-300'}`} />
                  )}
                  <div>
                    <p className={`text-xs md:text-sm font-light tracking-wide ${
                      mision.completed 
                        ? 'line-through text-stone-400 dark:text-stone-500' 
                        : isDark ? 'text-stone-300' : 'text-stone-700'
                    }`}>
                      {mision.title}
                    </p>
                    <p className={`text-[9px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                      {mision.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                    isDark ? 'bg-stone-950 border-stone-900' : 'bg-stone-100/80 border-stone-200/60'
                  }`}>
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                      +{mision.points}
                    </span>
                    <Sparkles className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
