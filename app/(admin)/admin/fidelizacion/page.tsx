'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Crown, Gift, Plus, Trash2, Sparkles, Scissors, 
  Percent, Layers, Edit3, Check, X, Loader2 
} from 'lucide-react'

interface LevelForm {
  id?: string
  name: string
  emoji: string
  min_points: number
  wallet_type: 'glow' | 'hair'
}

interface RewardForm {
  id?: string
  name: string
  description: string
  points_required: number
  tier: string
  wallet_type: 'glow' | 'hair'
  discount_percentage: number
}

export default function AdminVIPConfigPage() {
  const { tenantId, loading: authLoading } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [activeTab, setActiveTab] = useState<'glow' | 'hair'>('glow')
  const [levels, setLevels] = useState<LevelForm[]>([])
  const [rewards, setRewards] = useState<RewardForm[]>([])
  const [loading, setLoading] = useState(true)

  const [newLevel, setNewLevel] = useState<LevelForm>({ name: '', emoji: '✨', min_points: 0, wallet_type: 'glow' })
  const [newReward, setNewReward] = useState<RewardForm>({ name: '', description: '', points_required: 0, tier: 'Bronce', wallet_type: 'glow', discount_percentage: 0 })

  const [editingLevelId, setEditingLevelId] = useState<string | null>(null)
  const [editLevelData, setEditLevelData] = useState<LevelForm | null>(null)

  const [editingRewardId, setEditingRewardId] = useState<string | null>(null)
  const [editRewardData, setEditRewardData] = useState<RewardForm | null>(null)

  useEffect(() => {
    if (tenantId) {
      fetchConfig()
    } else if (authLoading === false || authLoading === undefined) {
      setLoading(false)
    }
  }, [tenantId, activeTab, authLoading])

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const [lvResponse, rwResponse] = await Promise.all([
        supabase
          .from('vip_levels')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('wallet_type', activeTab)
          .order('min_points', { ascending: true }),
        supabase
          .from('reward_catalog')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('wallet_type', activeTab)
          .order('points_required', { ascending: true })
      ])

      if (lvResponse.error) throw lvResponse.error
      if (rwResponse.error) throw rwResponse.error

      setLevels(lvResponse.data || [])
      setRewards(rwResponse.data || [])
    } catch (e) {
      console.error('Error cargando configuración VIP:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLevel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return
    try {
      const { error } = await supabase.from('vip_levels').insert([{
        ...newLevel,
        wallet_type: activeTab,
        tenant_id: tenantId,
        is_active: true
      }])
      if (error) throw error
      setNewLevel({ name: '', emoji: '✨', min_points: 0, wallet_type: activeTab })
      fetchConfig()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return
    try {
      const { error } = await supabase.from('reward_catalog').insert([{
        ...newReward,
        wallet_type: activeTab,
        tenant_id: tenantId,
        is_active: true
      }])
      if (error) throw error
      setNewReward({ name: '', description: '', points_required: 0, tier: 'Bronce', wallet_type: activeTab, discount_percentage: 0 })
      fetchConfig()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleSaveLevelEdit = async (id: string) => {
    if (!editLevelData) return
    try {
      const { error } = await supabase
        .from('vip_levels')
        .update({
          name: editLevelData.name,
          emoji: editLevelData.emoji,
          min_points: editLevelData.min_points
        })
        .eq('id', id)

      if (error) throw error
      setEditingLevelId(null)
      fetchConfig()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleSaveRewardEdit = async (id: string) => {
    if (!editRewardData) return
    try {
      const { error } = await supabase
        .from('reward_catalog')
        .update({
          name: editRewardData.name,
          description: editRewardData.description,
          points_required: editRewardData.points_required,
          tier: editRewardData.tier,
          discount_percentage: editRewardData.discount_percentage
        })
        .eq('id', id)

      if (error) throw error
      setEditingRewardId(null)
      fetchConfig()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleDeleteLevel = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este rango?')) return
    try {
      const { error } = await supabase.from('vip_levels').delete().eq('id', id)
      if (error) throw error
      fetchConfig()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleDeleteReward = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este premio?')) return
    try {
      const { error } = await supabase.from('reward_catalog').delete().eq('id', id)
      if (error) throw error
      fetchConfig()
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (authLoading || (loading && tenantId)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-stone-400 dark:text-stone-500" />
        <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase">Sincronizando Beneficios...</span>
      </div>
    )
  }

  if (!tenantId) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full border border-stone-200 dark:border-stone-800 flex items-center justify-center mb-4 shadow-sm bg-stone-50 dark:bg-stone-900/50">
          <Crown className="w-5 h-5 text-stone-400 dark:text-stone-500 stroke-[1.25]" />
        </div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-stone-500">Acceso Restringido</p>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-2 leading-relaxed">
          Tu cuenta de administrador no cuenta con un identificador de negocio asignado (<code className="font-mono text-amber-600 dark:text-amber-400 px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-900">tenant_id</code>) en la base de datos de perfiles.
        </p>
      </div>
    )
  }

  return (
    <div className={`w-full max-w-6xl mx-auto p-4 md:p-8 antialiased space-y-8 transition-colors duration-300 selection:bg-amber-500/10 ${
      isDark ? 'text-stone-300' : 'text-stone-800'
    }`}>

      {/* CABECERA MINIMALISTA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-200 dark:border-stone-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 shadow-sm" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-mono font-bold">Panel de Fidelidad</p>
          </div>
          <h1 className="text-3xl font-serif italic tracking-tight text-stone-900 dark:text-stone-100 mt-2">
            Club <span className="text-stone-400 dark:text-stone-500">VIP & Beneficios</span>
          </h1>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 max-w-xl">Configure las escalas transaccionales y el catálogo exclusivo de recompensas para sus clientes.</p>
        </div>

        {/* SELECTOR DE PLATAFORMA / WALLET */}
        <div className="flex rounded-xl p-1 shadow-sm border bg-stone-50 border-stone-200 dark:bg-stone-900/40 dark:border-stone-800/80 shrink-0 self-start md:self-end">
          <button 
            type="button"
            onClick={() => setActiveTab('glow')} 
            className={`px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'glow' 
                ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 border border-stone-200 dark:border-stone-800 shadow-sm font-black' 
                : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
            }`}
          >
            <Sparkles className="w-3 h-3" /> Estética & Glow
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('hair')} 
            className={`px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'hair' 
                ? 'bg-white dark:bg-stone-900 text-indigo-600 dark:text-indigo-400 border border-stone-200 dark:border-stone-800 shadow-sm font-black' 
                : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
            }`}
          >
            <Scissors className="w-3 h-3" /> Peluquería Crew
          </button>
        </div>
      </div>

      {/* CONTENEDOR GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* COLUMNA IZQUIERDA: GESTIÓN DE NIVELES */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Layers className="w-3.5 h-3.5 text-stone-400" />
            <h2 className="text-[10px] uppercase font-mono font-bold tracking-widest text-stone-400 dark:text-stone-500">1. Escalafón de Rangos</h2>
          </div>

          {/* Formulario Nivel */}
          <form onSubmit={handleAddLevel} className="rounded-2xl p-5 space-y-4 border bg-stone-50/50 dark:bg-[#12100e]/30 border-stone-200/80 dark:border-stone-800/50">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">Nombre del Rango</label>
                <input 
                  type="text" placeholder="Ej: Platinum" required
                  value={newLevel.name} onChange={e => setNewLevel({...newLevel, name: e.target.value})}
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 dark:focus:border-stone-700 transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5 text-center">Insignia</label>
                <input 
                  type="text" placeholder="✨" required
                  value={newLevel.emoji} onChange={e => setNewLevel({...newLevel, emoji: e.target.value})}
                  className="w-full px-3 py-2 text-xs text-center rounded-xl border bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-stone-700 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">Puntaje de Corte (Mínimo requerido)</label>
              <input 
                type="number" 
                value={newLevel.min_points} 
                onChange={e => setNewLevel({...newLevel, min_points: e.target.value === '' ? 0 : Number(e.target.value)})}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-stone-700 transition-colors"
              />
            </div>
            <button type="submit" className="w-full py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:opacity-90 active:scale-[0.99] flex items-center justify-center gap-1.5 transition-all">
              <Plus className="w-3.5 h-3.5" /> Crear Rango VIP
            </button>
          </form>

          {/* Lista de Niveles */}
          <div className="space-y-2.5">
            {levels.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-2xl border-stone-200 dark:border-stone-800/80 bg-stone-50/20 dark:bg-transparent">
                <p className="text-[11px] font-mono text-stone-400">No se registran rangos de corte activos.</p>
              </div>
            ) : (
              levels.map((l) => {
                const isEditing = editingLevelId === l.id;
                return (
                  <div key={l.id} className="rounded-xl p-4 border bg-white dark:bg-[#110f0e]/50 border-stone-200 dark:border-stone-900/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all">
                    {isEditing && editLevelData ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <input 
                            type="text" value={editLevelData.name} onChange={e => setEditLevelData({...editLevelData, name: e.target.value})}
                            className="col-span-2 p-2 text-xs rounded-lg border bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100"
                          />
                          <input 
                            type="text" value={editLevelData.emoji} onChange={e => setEditLevelData({...editLevelData, emoji: e.target.value})}
                            className="p-2 text-xs text-center rounded-lg border bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-mono uppercase text-stone-400 block mb-1">Mínimo Requerido</label>
                          <input 
                            type="number" value={editLevelData.min_points} onChange={e => setEditLevelData({...editLevelData, min_points: Number(e.target.value)})}
                            className="w-full p-2 text-xs font-mono rounded-lg border bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100"
                          />
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                          <button type="button" onClick={() => setEditingLevelId(null)} className="px-2.5 py-1 text-[10px] font-mono text-stone-400 hover:text-stone-600 flex items-center gap-1"><X className="w-3 h-3" /> Cancelar</button>
                          <button type="button" onClick={() => l.id && handleSaveLevelEdit(l.id)} className="px-3 py-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm"><Check className="w-3 h-3" /> Guardar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl border flex items-center justify-center text-sm bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 shadow-inner">
                            {l.emoji}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-900 dark:text-stone-100">{l.name}</p>
                            <p className="text-[10px] font-mono text-stone-400 mt-0.5">Límite base: <span className="font-bold text-stone-600 dark:text-stone-300">{l.min_points} pts</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button type="button" onClick={() => { setEditingLevelId(l.id || null); setEditLevelData(l); }} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"><Edit3 className="w-3.5 h-3.5 stroke-[1.5]" /></button>
                          <button type="button" onClick={() => l.id && handleDeleteLevel(l.id)} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5 stroke-[1.5]" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: CATÁLOGO DE PREMIOS */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Gift className="w-3.5 h-3.5 text-stone-400" />
            <h2 className="text-[10px] uppercase font-mono font-bold tracking-widest text-stone-400 dark:text-stone-500">2. Catálogo de Premios & Canjes</h2>
          </div>

          {/* Formulario Recompensas */}
          <form onSubmit={handleAddReward} className="rounded-2xl p-5 space-y-4 border bg-stone-50/50 dark:bg-[#12100e]/30 border-stone-200/80 dark:border-stone-800/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">Nombre del Premio</label>
                <input 
                  type="text" placeholder="Ej: Set Nail Care Premium" required
                  value={newReward.name} onChange={e => setNewReward({...newReward, name: e.target.value})}
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 dark:focus:border-stone-700 transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">Costo (Puntos requeridos)</label>
                <input 
                  type="number" placeholder="Ej: 1500" required
                  value={newReward.points_required || ''} onChange={e => setNewReward({...newReward, points_required: Number(e.target.value)})}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-stone-700 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">Descripción o Condiciones del Beneficio</label>
              <textarea 
                placeholder="Indique qué servicios incluye o limitaciones del premio canjeado..." required
                value={newReward.description} onChange={e => setNewReward({...newReward, description: e.target.value})}
                className="w-full px-3 py-2 text-xs rounded-xl border h-16 bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-stone-700 resize-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">Rango Mínimo Autorizado</label>
                <input 
                  type="text" placeholder="Ej: Oro / Todos" required
                  value={newReward.tier} onChange={e => setNewReward({...newReward, tier: e.target.value})}
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-stone-700 transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5 flex items-center gap-1">
                  <Percent className="w-2.5 h-2.5 text-stone-400" /> Descuento Directo (%)
                </label>
                <input 
                  type="number" placeholder="Ej: 15 (Opcional)"
                  value={newReward.discount_percentage} 
                  onChange={e => setNewReward({...newReward, discount_percentage: e.target.value === '' ? 0 : Number(e.target.value)})}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-stone-700 transition-colors"
                />
              </div>
            </div>

            <button type="submit" className="w-full py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:opacity-90 active:scale-[0.99] flex items-center justify-center gap-1.5 transition-all">
              <Plus className="w-3.5 h-3.5" /> Agregar al Catálogo
            </button>
          </form>

          {/* Grid de Cards de Premios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rewards.length === 0 ? (
              <div className="col-span-full text-center py-8 border border-dashed rounded-2xl border-stone-200 dark:border-stone-800/80 bg-stone-50/20 dark:bg-transparent">
                <p className="text-[11px] font-mono text-stone-400">No hay premios creados en esta billetera.</p>
              </div>
            ) : (
              rewards.map((r) => {
                const isEditing = editingRewardId === r.id;
                return (
                  <div key={r.id} className="group relative p-4 rounded-xl border bg-white dark:bg-[#110f0e]/50 border-stone-200 dark:border-stone-900/80 flex flex-col justify-between min-h-[140px] shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all">
                    
                    {!isEditing && (
                      <div className="absolute top-3 right-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button type="button" onClick={() => { setEditingRewardId(r.id || null); setEditRewardData(r); }} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"><Edit3 className="w-3 h-3 stroke-[1.5]" /></button>
                        <button type="button" onClick={() => r.id && handleDeleteReward(r.id)} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3 stroke-[1.5]" /></button>
                      </div>
                    )}

                    {isEditing && editRewardData ? (
                      <div className="space-y-2.5 w-full text-left">
                        <input 
                          type="text" value={editRewardData.name} onChange={e => setEditRewardData({...editRewardData, name: e.target.value})}
                          className="w-full p-2 text-xs rounded-lg border font-bold bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white"
                        />
                        <textarea 
                          value={editRewardData.description} onChange={e => setEditRewardData({...editRewardData, description: e.target.value})}
                          className="w-full p-2 text-[11px] rounded-lg border h-14 resize-none bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] font-mono uppercase text-stone-400">Rango</label>
                            <input 
                              type="text" value={editRewardData.tier} onChange={e => setEditRewardData({...editRewardData, tier: e.target.value})}
                              className="w-full p-1.5 text-xs rounded-lg border bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-mono uppercase text-stone-400">Costo Pts</label>
                            <input 
                              type="number" value={editRewardData.points_required} onChange={e => setEditRewardData({...editRewardData, points_required: Number(e.target.value)})}
                              className="w-full p-1.5 text-xs font-mono rounded-lg border bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[8px] font-mono uppercase text-stone-400">Descuento %</label>
                          <input 
                            type="number" value={editRewardData.discount_percentage} onChange={e => setEditRewardData({...editRewardData, discount_percentage: e.target.value === '' ? 0 : Number(e.target.value)})}
                            className="w-full p-1.5 text-xs font-mono rounded-lg border bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200"
                          />
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                          <button type="button" onClick={() => setEditingRewardId(null)} className="px-2 py-1 text-[10px] font-mono text-stone-400 flex items-center gap-0.5"><X className="w-2.5 h-2.5" /> Cancelar</button>
                          <button type="button" onClick={() => r.id && handleSaveRewardEdit(r.id)} className="px-2.5 py-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 rounded-lg text-[10px] font-bold flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> Guardar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1 pr-8">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-mono uppercase font-semibold px-1.5 py-0.5 rounded border border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-500 tracking-wider">
                              {r.tier}
                            </span>
                            {r.discount_percentage > 0 && (
                              <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/5 dark:bg-amber-400/10 px-1.5 py-0.5 rounded">
                                -{r.discount_percentage}% OFF
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold tracking-tight pt-1 text-stone-900 dark:text-stone-100">{r.name}</h4>
                          <p className="text-[11px] leading-relaxed line-clamp-2 text-stone-400 dark:text-stone-500">{r.description}</p>
                        </div>

                        <div className="pt-2.5 mt-3 border-t border-stone-100 dark:border-stone-900 flex items-center justify-between">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400">Valor de canje</span>
                          <strong className={`text-xs font-mono font-bold ${
                            activeTab === 'glow' ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'
                          }`}>{r.points_required} PTS</strong>
                        </div>
                      </>
                    )}

                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
