// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/contexts/SettingsContext'
import { 
  Crown, Gift, Plus, Trash2, Sparkles, 
  Percent, Layers, Edit3, Check, X, RefreshCw,
  Save, Users, Star, Award, Zap, AlertCircle,
  TrendingUp, Calendar, Package, PlusCircle
} from 'lucide-react'

interface Level {
  id: string
  name: string
  min_points: number
  emoji: string
}

interface Reward {
  id: string
  name: string
  description: string
  points_required: number
  discount_percentage: number
}

// ✅ EMOJIS FIJOS POR NIVEL
const LEVEL_EMOJIS: Record<string, string> = {
  'Bronce': '🥉',
  'Plata': '🥈',
  'Oro': '🥇',
  'Platino': '💎',
  'Diamante': '💠'
}

const DEFAULT_LEVELS = [
  { name: 'Bronce', emoji: '🥉', min_points: 0 },
  { name: 'Plata', emoji: '🥈', min_points: 500 },
  { name: 'Oro', emoji: '🥇', min_points: 1500 },
  { name: 'Platino', emoji: '💎', min_points: 3000 }
]

export default function AdminVIPConfigPage() {
  const { tenantId, loading: authLoading } = useAuth()
  const { settings } = useSettings()

  const [levels, setLevels] = useState<Level[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Estados para formularios
  const [newLevel, setNewLevel] = useState({ name: '', min_points: 0 })
  const [newReward, setNewReward] = useState({ name: '', description: '', points_required: 0, discount_percentage: 0 })

  // Estados para modales de edición
  const [editingLevel, setEditingLevel] = useState<Level | null>(null)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [showLevelModal, setShowLevelModal] = useState(false)
  const [showRewardModal, setShowRewardModal] = useState(false)

  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'

  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
  }

  const primaryBgStyle = { backgroundColor: primaryColor }

  useEffect(() => {
    if (tenantId) {
      fetchConfig()
    } else if (authLoading === false || authLoading === undefined) {
      setLoading(false)
    }
  }, [tenantId, authLoading])

  const fetchConfig = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)

    try {
      // ✅ SOLO UN SISTEMA DE PUNTOS - Eliminado wallet_type
      const [lvResponse, rwResponse] = await Promise.all([
        supabase
          .from('vip_levels')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('min_points', { ascending: true }),
        supabase
          .from('reward_catalog')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('points_required', { ascending: true })
      ])

      if (lvResponse.error) throw lvResponse.error
      if (rwResponse.error) throw rwResponse.error

      // ✅ Si no hay niveles, crear los predeterminados
      if (!lvResponse.data || lvResponse.data.length === 0) {
        const defaultLevels = DEFAULT_LEVELS.map(l => ({
          ...l,
          tenant_id: tenantId,
          is_active: true
        }))
        const { error: insertError } = await supabase
          .from('vip_levels')
          .insert(defaultLevels)
        if (insertError) throw insertError
        // Recargar después de crear los niveles por defecto
        const { data: newLevels } = await supabase
          .from('vip_levels')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('min_points', { ascending: true })
        setLevels(newLevels || [])
      } else {
        setLevels(lvResponse.data || [])
      }

      setRewards(rwResponse.data || [])
    } catch (e: any) {
      console.error('Error cargando configuración VIP:', e)
      setError(e.message || 'Error al cargar la configuración')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchConfig(true)
  }

  // ✅ CREAR NIVEL
  const handleAddLevel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return
    setError(null)
    setSuccess(null)

    try {
      const emoji = LEVEL_EMOJIS[newLevel.name] || '⭐'
      const { error } = await supabase.from('vip_levels').insert([{
        name: newLevel.name,
        min_points: newLevel.min_points,
        emoji: emoji,
        tenant_id: tenantId,
        is_active: true
      }])
      if (error) throw error
      setNewLevel({ name: '', min_points: 0 })
      setSuccess('Rango VIP creado correctamente')
      setTimeout(() => setSuccess(null), 3000)
      fetchConfig(false)
    } catch (e: any) {
      setError(e.message)
      setTimeout(() => setError(null), 3000)
    }
  }

  // ✅ CREAR PREMIO
  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase.from('reward_catalog').insert([{
        name: newReward.name,
        description: newReward.description,
        points_required: newReward.points_required,
        discount_percentage: newReward.discount_percentage || 0,
        tenant_id: tenantId,
        is_active: true
      }])
      if (error) throw error
      setNewReward({ name: '', description: '', points_required: 0, discount_percentage: 0 })
      setSuccess('Premio agregado correctamente')
      setTimeout(() => setSuccess(null), 3000)
      fetchConfig(false)
    } catch (e: any) {
      setError(e.message)
      setTimeout(() => setError(null), 3000)
    }
  }

  // ✅ ACTUALIZAR NIVEL
  const handleUpdateLevel = async () => {
    if (!editingLevel) return
    setError(null)
    setSuccess(null)

    try {
      const emoji = LEVEL_EMOJIS[editingLevel.name] || '⭐'
      const { error } = await supabase
        .from('vip_levels')
        .update({
          name: editingLevel.name,
          min_points: editingLevel.min_points,
          emoji: emoji
        })
        .eq('id', editingLevel.id)

      if (error) throw error
      setShowLevelModal(false)
      setEditingLevel(null)
      setSuccess('Rango actualizado correctamente')
      setTimeout(() => setSuccess(null), 3000)
      fetchConfig(false)
    } catch (e: any) {
      setError(e.message)
      setTimeout(() => setError(null), 3000)
    }
  }

  // ✅ ACTUALIZAR PREMIO
  const handleUpdateReward = async () => {
    if (!editingReward) return
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from('reward_catalog')
        .update({
          name: editingReward.name,
          description: editingReward.description,
          points_required: editingReward.points_required,
          discount_percentage: editingReward.discount_percentage || 0
        })
        .eq('id', editingReward.id)

      if (error) throw error
      setShowRewardModal(false)
      setEditingReward(null)
      setSuccess('Premio actualizado correctamente')
      setTimeout(() => setSuccess(null), 3000)
      fetchConfig(false)
    } catch (e: any) {
      setError(e.message)
      setTimeout(() => setError(null), 3000)
    }
  }

  // ✅ ELIMINAR NIVEL
  const handleDeleteLevel = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este rango?')) return
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase.from('vip_levels').delete().eq('id', id)
      if (error) throw error
      setSuccess('Rango eliminado correctamente')
      setTimeout(() => setSuccess(null), 3000)
      fetchConfig(false)
    } catch (e: any) {
      setError(e.message)
      setTimeout(() => setError(null), 3000)
    }
  }

  // ✅ ELIMINAR PREMIO
  const handleDeleteReward = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este premio?')) return
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase.from('reward_catalog').delete().eq('id', id)
      if (error) throw error
      setSuccess('Premio eliminado correctamente')
      setTimeout(() => setSuccess(null), 3000)
      fetchConfig(false)
    } catch (e: any) {
      setError(e.message)
      setTimeout(() => setError(null), 3000)
    }
  }

  const totalLevels = levels.length
  const totalRewards = rewards.length

  if (authLoading || (loading && tenantId)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute w-48 h-48 bg-amber-500/5 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite] delay-300" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
            <Crown className="w-6 h-6 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-sm font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 animate-pulse">
              CARGANDO
            </p>
            <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              CLUB VIP FRESH
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span 
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-pink-500/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-6 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 shadow-sm bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
          <Crown className="w-5 h-5 text-pink-500 stroke-[1.5]" />
        </div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] font-bold" style={{ color: primaryColor }}>
          Acceso Restringido
        </p>
        <p className="text-[11px] text-stone-500 dark:text-pink-100/60 mt-2 leading-relaxed">
          Tu cuenta de administrador no cuenta con un identificador de negocio asignado.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1 max-w-6xl mx-auto">

      {/* ============================================================ */}
      {/* CABECERA PRINCIPAL — IDÉNTICA AL DASHBOARD */}
      {/* ============================================================ */}
      <div 
        className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl text-white border border-white/10"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, #EF4444 100%)`
        }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-black/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-pink-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Configuración de Beneficios
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight drop-shadow-sm">
              Club VIP Fresh Nails
            </h1>
            <p className="text-xs md:text-sm text-pink-50/80 font-medium max-w-md">
              Gestiona los rangos VIP y el catálogo de premios para tus clientas.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <button 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95 shadow-lg"
              title="Actualizar Configuración"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MENSAJES */}
      {/* ============================================================ */}
      {error && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-rose-500/10 to-pink-500/5 border border-rose-500/20 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-xs text-stone-700 dark:text-rose-400 font-medium min-w-0">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <p className="text-xs text-stone-700 dark:text-emerald-400 font-medium min-w-0">{success}</p>
        </div>
      )}

      {/* ============================================================ */}
      {/* KPIS — 2 columnas responsivas */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl shrink-0" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Rangos VIP</p>
            <h3 className="text-sm sm:text-base font-mono font-black text-stone-900 dark:text-pink-100">{totalLevels}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Premios</p>
            <h3 className="text-sm sm:text-base font-mono font-black text-amber-500">{totalRewards}</h3>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ============================================================ */}
        {/* COLUMNA IZQUIERDA: NIVELES VIP */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Layers className="w-4 h-4" style={{ color: primaryColor }} />
            <h2 className="text-[10px] uppercase font-mono font-bold tracking-widest text-stone-400 dark:text-stone-500">
              1. Escalafón de Rangos
            </h2>
          </div>

          {/* Formulario Nuevo Nivel */}
          <form onSubmit={handleAddLevel} className="rounded-2xl p-5 space-y-4 border shadow-sm bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">Nombre</label>
                <select 
                  value={newLevel.name} 
                  onChange={e => setNewLevel({...newLevel, name: e.target.value})}
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  required
                >
                  <option value="">Seleccionar</option>
                  {Object.keys(LEVEL_EMOJIS).map(name => (
                    <option key={name} value={name}>{LEVEL_EMOJIS[name]} {name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">Puntos Mínimos</label>
                <input 
                  type="number" 
                  value={newLevel.min_points} 
                  onChange={e => setNewLevel({...newLevel, min_points: Number(e.target.value)})}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  required
                />
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 text-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-1.5 shadow-md" style={primaryBgStyle}>
              <Plus className="w-3.5 h-3.5" /> Crear Rango VIP
            </button>
          </form>

          {/* Lista de Niveles */}
          <div className="space-y-2.5">
            {levels.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-2xl font-mono text-stone-400 text-xs bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
                No hay rangos configurados
              </div>
            ) : (
              levels.map((l) => (
                <div key={l.id} className="group flex items-center justify-between p-4 rounded-xl border shadow-sm transition-all hover:border-pink-300 bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 hover:shadow-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl border flex items-center justify-center text-xl shadow-sm bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950">
                      {l.emoji || '⭐'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-stone-800 dark:text-pink-100 truncate">{l.name}</p>
                      <p className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                        {l.min_points} pts mínimos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      type="button" 
                      onClick={() => { setEditingLevel(l); setShowLevelModal(true); }}
                      className="p-1.5 rounded-xl border transition-colors bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-400 hover:text-pink-500 dark:hover:text-pink-400"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => l.id && handleDeleteLevel(l.id)}
                      className="p-1.5 rounded-xl border transition-colors bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* COLUMNA DERECHA: PREMIOS */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Gift className="w-4 h-4 text-amber-500" />
            <h2 className="text-[10px] uppercase font-mono font-bold tracking-widest text-stone-400 dark:text-stone-500">
              2. Catálogo de Premios
            </h2>
          </div>

          {/* Formulario Nuevo Premio */}
          <form onSubmit={handleAddReward} className="rounded-2xl p-5 space-y-4 border shadow-sm bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
            <div>
              <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">Nombre del Premio</label>
              <input 
                type="text" placeholder="Ej: Set Nail Care Premium" required
                value={newReward.name} onChange={e => setNewReward({...newReward, name: e.target.value})}
                className="w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-all"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">Descripción</label>
              <textarea 
                placeholder="Describe el premio o sus condiciones..." required
                value={newReward.description} onChange={e => setNewReward({...newReward, description: e.target.value})}
                className="w-full px-3 py-2 text-xs rounded-xl border h-14 bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-all resize-none"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">Puntos Requeridos</label>
                <input 
                  type="number" placeholder="1500" required
                  value={newReward.points_required || ''} onChange={e => setNewReward({...newReward, points_required: Number(e.target.value)})}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5 flex items-center gap-1">
                  <Percent className="w-3 h-3" /> Descuento %
                </label>
                <input 
                  type="number" placeholder="15"
                  value={newReward.discount_percentage || ''} 
                  onChange={e => setNewReward({...newReward, discount_percentage: Number(e.target.value)})}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 text-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-1.5 shadow-md" style={primaryBgStyle}>
              <Plus className="w-3.5 h-3.5" /> Agregar Premio
            </button>
          </form>

          {/* Grid de Premios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rewards.length === 0 ? (
              <div className="col-span-full text-center py-8 border border-dashed rounded-2xl font-mono text-stone-400 text-xs bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
                No hay premios creados
              </div>
            ) : (
              rewards.map((r) => (
                <div key={r.id} className="group p-4 rounded-xl border shadow-sm transition-all hover:border-pink-300 bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 hover:shadow-md flex flex-col">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-stone-800 dark:text-pink-100 truncate">{r.name}</h4>
                      <p className="text-[11px] text-stone-500 dark:text-pink-100/60 line-clamp-2">{r.description}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button 
                        type="button" 
                        onClick={() => { setEditingReward(r); setShowRewardModal(true); }}
                        className="p-1.5 rounded-xl border transition-colors bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-400 hover:text-pink-500 dark:hover:text-pink-400"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => r.id && handleDeleteReward(r.id)}
                        className="p-1.5 rounded-xl border transition-colors bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-pink-100/60 dark:border-fuchsia-950/50">
                    <span className="text-[10px] font-mono font-bold" style={{ color: primaryColor }}>
                      {r.points_required} pts
                    </span>
                    {r.discount_percentage > 0 && (
                      <span className="text-[10px] font-mono font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                        -{r.discount_percentage}% OFF
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: EDITAR NIVEL */}
      {/* ============================================================ */}
      {showLevelModal && editingLevel && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setShowLevelModal(false); setEditingLevel(null); }}>
          <div className="relative w-full max-w-md rounded-2xl shadow-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowLevelModal(false); setEditingLevel(null); }} className="absolute top-4 right-4 p-2 hover:bg-pink-50 dark:hover:bg-fuchsia-950/40 rounded-xl transition-colors">
              <X className="w-5 h-5 text-stone-400" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl text-white shadow-md" style={primaryBgStyle}>
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif font-extrabold text-stone-900 dark:text-white">Editar Rango</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">Nombre</label>
                <select 
                  value={editingLevel.name} 
                  onChange={e => setEditingLevel({...editingLevel, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                >
                  {Object.keys(LEVEL_EMOJIS).map(name => (
                    <option key={name} value={name}>{LEVEL_EMOJIS[name]} {name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">Puntos Mínimos</label>
                <input 
                  type="number" 
                  value={editingLevel.min_points} 
                  onChange={e => setEditingLevel({...editingLevel, min_points: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowLevelModal(false); setEditingLevel(null); }} className="flex-1 py-2.5 rounded-xl border text-xs font-bold uppercase text-stone-600 dark:text-stone-300">Cancelar</button>
                <button type="button" onClick={handleUpdateLevel} className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold uppercase flex items-center justify-center gap-2 shadow-md hover:scale-105 transition-all" style={primaryBgStyle}>
                  <Check className="w-4 h-4" /> Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDITAR PREMIO */}
      {/* ============================================================ */}
      {showRewardModal && editingReward && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setShowRewardModal(false); setEditingReward(null); }}>
          <div className="relative w-full max-w-md rounded-2xl shadow-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowRewardModal(false); setEditingReward(null); }} className="absolute top-4 right-4 p-2 hover:bg-pink-50 dark:hover:bg-fuchsia-950/40 rounded-xl transition-colors">
              <X className="w-5 h-5 text-stone-400" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl text-white shadow-md" style={primaryBgStyle}>
                <Gift className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif font-extrabold text-stone-900 dark:text-white">Editar Premio</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">Nombre</label>
                <input 
                  type="text" value={editingReward.name} onChange={e => setEditingReward({...editingReward, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">Descripción</label>
                <textarea 
                  value={editingReward.description} onChange={e => setEditingReward({...editingReward, description: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all resize-none"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">Puntos</label>
                  <input 
                    type="number" value={editingReward.points_required} onChange={e => setEditingReward({...editingReward, points_required: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">Descuento %</label>
                  <input 
                    type="number" value={editingReward.discount_percentage} onChange={e => setEditingReward({...editingReward, discount_percentage: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowRewardModal(false); setEditingReward(null); }} className="flex-1 py-2.5 rounded-xl border text-xs font-bold uppercase text-stone-600 dark:text-stone-300">Cancelar</button>
                <button type="button" onClick={handleUpdateReward} className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold uppercase flex items-center justify-center gap-2 shadow-md hover:scale-105 transition-all" style={primaryBgStyle}>
                  <Check className="w-4 h-4" /> Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STYLES GLOBALES */}
      {/* ============================================================ */}
      <style jsx global>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>

    </div>
  )
}