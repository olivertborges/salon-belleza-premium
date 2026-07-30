// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/contexts/SettingsContext'
import { useTheme } from '@/contexts/ThemeContext'
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
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [levels, setLevels] = useState<Level[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [newLevel, setNewLevel] = useState({ name: '', min_points: 0 })
  const [newReward, setNewReward] = useState({ name: '', description: '', points_required: 0, discount_percentage: 0 })

  const [editingLevel, setEditingLevel] = useState<Level | null>(null)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [showLevelModal, setShowLevelModal] = useState(false)
  const [showRewardModal, setShowRewardModal] = useState(false)

  // ============================================================
  // PALETA DE COLORES - DORADO PROTAGONISTA
  // ============================================================
  const gold = '#D4AF37'
  const goldLight = '#E8D5A0'
  const goldDark = '#C9A96E'
  const pink = '#EC4899'
  const blue = '#3B82F6'

  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${gold}, ${goldLight}, ${gold})`
  }

  const headerGradient = {
    backgroundImage: `linear-gradient(135deg, ${gold} 0%, ${goldDark} 50%, ${goldLight} 100%)`
  }

  const primaryBgStyle = { backgroundColor: gold }

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
      <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-500 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
            <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
          </div>
          <p className={`text-[10px] tracking-[0.4em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]/60'}`}>
            Cargando Club VIP...
          </p>
        </div>
      </div>
    )
  }

  if (!tenantId) {
    return (
      <div className={`flex flex-col items-center justify-center h-96 text-center p-6 max-w-md mx-auto ${
        isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'
      }`}>
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 shadow-sm ${
          isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
        }`}>
          <Crown className="w-5 h-5 text-[#D4AF37] stroke-[1.5]" />
        </div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] font-bold text-[#D4AF37]">
          Acceso Restringido
        </p>
        <p className={`text-[11px] mt-2 leading-relaxed ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
          Tu cuenta de administrador no cuenta con un identificador de negocio asignado.
        </p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-8 relative overflow-x-hidden ${isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'}`}>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-6xl mx-auto px-4 space-y-6 relative z-10">

        {/* ============================================================ */}
        {/* CABECERA — DORADO PROTAGONISTA */}
        {/* ============================================================ */}
        <div 
          className="relative overflow-hidden rounded-2xl p-6 md:p-8 shadow-2xl text-white border border-white/10"
          style={headerGradient}
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-black/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-white/80">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                Configuración de Beneficios
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight drop-shadow-sm">
                Club VIP Fresh Nails
              </h1>
              <p className="text-xs md:text-sm text-white/80 font-medium max-w-md">
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
          <div className={`flex items-start gap-4 border p-4 rounded-2xl transition-all duration-300 ${isDark ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#D4AF37]/30 text-[#1A0E0A]'}`}>
            <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
              <AlertCircle className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-sm font-light">{error}</p>
          </div>
        )}

        {success && (
          <div className={`flex items-start gap-4 border p-4 rounded-2xl transition-all duration-300 ${isDark ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#D4AF37]/30 text-[#1A0E0A]'}`}>
            <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
              <Check className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-sm font-light">{success}</p>
          </div>
        )}

        {/* ============================================================ */}
        {/* KPIS */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-2xl p-3 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
                <Layers className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="min-w-0">
                <p className={`text-[8px] font-mono uppercase tracking-wider font-black ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Rangos VIP</p>
                <p className={`text-lg font-black ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{totalLevels}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-3 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
                <Gift className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="min-w-0">
                <p className={`text-[8px] font-mono uppercase tracking-wider font-black ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Premios</p>
                <p className="text-lg font-black text-[#D4AF37]">{totalRewards}</p>
              </div>
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
              <Layers className="w-4 h-4 text-[#D4AF37]" />
              <h2 className={`text-[10px] uppercase font-mono font-bold tracking-widest ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                1. Escalafón de Rangos
              </h2>
            </div>

            {/* Formulario Nuevo Nivel */}
            <form onSubmit={handleAddLevel} className={`rounded-2xl p-5 space-y-4 border shadow-sm transition-all duration-300 ${
              isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
            }`}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-[9px] font-mono font-bold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Nombre</label>
                  <select 
                    value={newLevel.name} 
                    onChange={e => setNewLevel({...newLevel, name: e.target.value})}
                    className={`w-full px-3 py-2 text-xs rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                      isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A]'
                    }`}
                    required
                  >
                    <option value="">Seleccionar</option>
                    {Object.keys(LEVEL_EMOJIS).map(name => (
                      <option key={name} value={name}>{LEVEL_EMOJIS[name]} {name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`text-[9px] font-mono font-bold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Puntos Mínimos</label>
                  <input 
                    type="number" 
                    value={newLevel.min_points} 
                    onChange={e => setNewLevel({...newLevel, min_points: Number(e.target.value)})}
                    className={`w-full px-3 py-2 text-xs font-mono rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                      isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A]'
                    }`}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 text-[#1A0E0A] rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-1.5 shadow-md bg-[#D4AF37] hover:bg-[#E8D5A0]">
                <Plus className="w-3.5 h-3.5" /> Crear Rango VIP
              </button>
            </form>

            {/* Lista de Niveles */}
            <div className="space-y-2.5">
              {levels.length === 0 ? (
                <div className={`text-center py-6 border border-dashed rounded-2xl font-mono text-xs ${
                  isDark ? 'bg-[#2A1B14]/40 border-[#3D281E] text-[#A89588]' : 'bg-white border-[#F0E4DA] text-[#5C4A3E]'
                }`}>
                  No hay rangos configurados
                </div>
              ) : (
                levels.map((l) => (
                  <div key={l.id} className={`group flex items-center justify-between p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${
                    isDark ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40' : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40'
                  }`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl shadow-sm ${
                        isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
                      }`}>
                        {l.emoji || '⭐'}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{l.name}</p>
                        <p className={`text-[10px] font-mono ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                          {l.min_points} pts mínimos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        type="button" 
                        onClick={() => { setEditingLevel(l); setShowLevelModal(true); }}
                        className={`p-1.5 rounded-xl border transition-colors ${
                          isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588] hover:text-[#D4AF37]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E] hover:text-[#D4AF37]'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => l.id && handleDeleteLevel(l.id)}
                        className={`p-1.5 rounded-xl border transition-colors ${
                          isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588] hover:text-rose-500' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E] hover:text-rose-500'
                        }`}
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
              <Gift className="w-4 h-4 text-[#D4AF37]" />
              <h2 className={`text-[10px] uppercase font-mono font-bold tracking-widest ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                2. Catálogo de Premios
              </h2>
            </div>

            {/* Formulario Nuevo Premio */}
            <form onSubmit={handleAddReward} className={`rounded-2xl p-5 space-y-4 border shadow-sm transition-all duration-300 ${
              isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
            }`}>
              <div>
                <label className={`text-[9px] font-mono font-bold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Nombre del Premio</label>
                <input 
                  type="text" placeholder="Ej: Set Nail Care Premium" required
                  value={newReward.name} onChange={e => setNewReward({...newReward, name: e.target.value})}
                  className={`w-full px-3 py-2 text-xs rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                    isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#A89588]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A] placeholder:text-[#5C4A3E]'
                  }`}
                />
              </div>
              <div>
                <label className={`text-[9px] font-mono font-bold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Descripción</label>
                <textarea 
                  placeholder="Describe el premio o sus condiciones..." required
                  value={newReward.description} onChange={e => setNewReward({...newReward, description: e.target.value})}
                  className={`w-full px-3 py-2 text-xs rounded-xl border h-14 transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 resize-none ${
                    isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#A89588]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A] placeholder:text-[#5C4A3E]'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-[9px] font-mono font-bold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Puntos Requeridos</label>
                  <input 
                    type="number" placeholder="1500" required
                    value={newReward.points_required || ''} onChange={e => setNewReward({...newReward, points_required: Number(e.target.value)})}
                    className={`w-full px-3 py-2 text-xs font-mono rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                      isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A]'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[9px] font-mono font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                    <Percent className="w-3 h-3" /> Descuento %
                  </label>
                  <input 
                    type="number" placeholder="15"
                    value={newReward.discount_percentage || ''} 
                    onChange={e => setNewReward({...newReward, discount_percentage: Number(e.target.value)})}
                    className={`w-full px-3 py-2 text-xs font-mono rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                      isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A]'
                    }`}
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 text-[#1A0E0A] rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-1.5 shadow-md bg-[#D4AF37] hover:bg-[#E8D5A0]">
                <Plus className="w-3.5 h-3.5" /> Agregar Premio
              </button>
            </form>

            {/* Grid de Premios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rewards.length === 0 ? (
                <div className={`col-span-full text-center py-8 border border-dashed rounded-2xl font-mono text-xs ${
                  isDark ? 'bg-[#2A1B14]/40 border-[#3D281E] text-[#A89588]' : 'bg-white border-[#F0E4DA] text-[#5C4A3E]'
                }`}>
                  No hay premios creados
                </div>
              ) : (
                rewards.map((r) => (
                  <div key={r.id} className={`group p-4 rounded-xl border shadow-sm transition-all hover:shadow-md flex flex-col ${
                    isDark ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40' : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40'
                  }`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <h4 className={`text-sm font-medium truncate ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{r.name}</h4>
                        <p className={`text-[11px] line-clamp-2 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>{r.description}</p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button 
                          type="button" 
                          onClick={() => { setEditingReward(r); setShowRewardModal(true); }}
                          className={`p-1.5 rounded-xl border transition-colors ${
                            isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588] hover:text-[#D4AF37]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E] hover:text-[#D4AF37]'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => r.id && handleDeleteReward(r.id)}
                          className={`p-1.5 rounded-xl border transition-colors ${
                            isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588] hover:text-rose-500' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E] hover:text-rose-500'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className={`flex items-center justify-between mt-3 pt-3 border-t ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`}>
                      <span className="text-[10px] font-mono font-bold text-[#D4AF37]">
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
        {/* MODAL: EDITAR NIVEL — CON TEMA */}
        {/* ============================================================ */}
        {showLevelModal && editingLevel && (
          <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setShowLevelModal(false); setEditingLevel(null); }}>
            <div className={`relative w-full max-w-md rounded-2xl shadow-2xl border p-6 transition-all duration-300 ${
              isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
            }`} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setShowLevelModal(false); setEditingLevel(null); }} className={`absolute top-4 right-4 p-2 rounded-xl transition-colors ${
                isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#F0E4DA]'
              }`}>
                <X className={`w-5 h-5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl text-white shadow-md bg-[#D4AF37]">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className={`text-xl font-serif font-extrabold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>Editar Rango</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Nombre</label>
                  <select 
                    value={editingLevel.name} 
                    onChange={e => setEditingLevel({...editingLevel, name: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                      isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A]'
                    }`}
                  >
                    {Object.keys(LEVEL_EMOJIS).map(name => (
                      <option key={name} value={name}>{LEVEL_EMOJIS[name]} {name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Puntos Mínimos</label>
                  <input 
                    type="number" 
                    value={editingLevel.min_points} 
                    onChange={e => setEditingLevel({...editingLevel, min_points: Number(e.target.value)})}
                    className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                      isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A]'
                    }`}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowLevelModal(false); setEditingLevel(null); }} className={`flex-1 py-2.5 rounded-xl border text-xs font-bold uppercase transition-colors ${
                    isDark ? 'border-[#3D281E] text-[#A89588] hover:bg-[#3D281E]' : 'border-[#F0E4DA] text-[#5C4A3E] hover:bg-[#F0E4DA]'
                  }`}>Cancelar</button>
                  <button type="button" onClick={handleUpdateLevel} className="flex-1 py-2.5 rounded-xl text-[#1A0E0A] text-xs font-bold uppercase flex items-center justify-center gap-2 shadow-md hover:scale-105 transition-all bg-[#D4AF37] hover:bg-[#E8D5A0]">
                    <Check className="w-4 h-4" /> Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL: EDITAR PREMIO — CON TEMA */}
        {/* ============================================================ */}
        {showRewardModal && editingReward && (
          <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setShowRewardModal(false); setEditingReward(null); }}>
            <div className={`relative w-full max-w-md rounded-2xl shadow-2xl border p-6 transition-all duration-300 ${
              isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
            }`} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setShowRewardModal(false); setEditingReward(null); }} className={`absolute top-4 right-4 p-2 rounded-xl transition-colors ${
                isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#F0E4DA]'
              }`}>
                <X className={`w-5 h-5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl text-white shadow-md bg-[#D4AF37]">
                  <Gift className="w-5 h-5" />
                </div>
                <h3 className={`text-xl font-serif font-extrabold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>Editar Premio</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Nombre</label>
                  <input 
                    type="text" value={editingReward.name} onChange={e => setEditingReward({...editingReward, name: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                      isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A]'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Descripción</label>
                  <textarea 
                    value={editingReward.description} onChange={e => setEditingReward({...editingReward, description: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 resize-none ${
                      isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A]'
                    }`}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Puntos</label>
                    <input 
                      type="number" value={editingReward.points_required} onChange={e => setEditingReward({...editingReward, points_required: Number(e.target.value)})}
                      className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                        isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Descuento %</label>
                    <input 
                      type="number" value={editingReward.discount_percentage} onChange={e => setEditingReward({...editingReward, discount_percentage: Number(e.target.value)})}
                      className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                        isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A]'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowRewardModal(false); setEditingReward(null); }} className={`flex-1 py-2.5 rounded-xl border text-xs font-bold uppercase transition-colors ${
                    isDark ? 'border-[#3D281E] text-[#A89588] hover:bg-[#3D281E]' : 'border-[#F0E4DA] text-[#5C4A3E] hover:bg-[#F0E4DA]'
                  }`}>Cancelar</button>
                  <button type="button" onClick={handleUpdateReward} className="flex-1 py-2.5 rounded-xl text-[#1A0E0A] text-xs font-bold uppercase flex items-center justify-center gap-2 shadow-md hover:scale-105 transition-all bg-[#D4AF37] hover:bg-[#E8D5A0]">
                    <Check className="w-4 h-4" /> Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      <style jsx global>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>

    </div>
  )
}