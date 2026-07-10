'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { 
  Crown, Gift, Plus, Trash2, Sparkles, Scissors, 
  Percent, Layers, Edit3, Check, X
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
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-pink-600/80 font-mono text-xs uppercase tracking-widest animate-pulse">Sincronizando Beneficios...</p>
      </div>
    )
  }

  if (!tenantId) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl border border-pink-100 dark:border-fuchsia-950 flex items-center justify-center mb-4 shadow-sm bg-[#fffdfd] dark:bg-[#130f24]">
          <Crown className="w-5 h-5 text-pink-500 stroke-[1.5]" />
        </div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-pink-500 font-bold">Acceso Restringido</p>
        <p className="text-[11px] text-stone-500 dark:text-pink-100/60 mt-2 leading-relaxed">
          Tu cuenta de administrador no cuenta con un identificador de negocio asignado (<code className="font-mono text-pink-500 px-1 py-0.5 rounded bg-pink-50 dark:bg-fuchsia-950/40">tenant_id</code>) en la base de datos de perfiles.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-1">

      {/* CABECERA CON DEGRADADO ORIGINAL */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 p-[1px] shadow-xl shadow-pink-500/10">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-transparent to-amber-400/20 animate-pulse" />
        <div className="relative z-10 rounded-[23px] bg-[#fffdfd] dark:bg-[#0f0c1b] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/30">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-pink-500 dark:text-pink-400 font-bold font-mono">💎 Panel de Fidelidad</p>
              <h1 className="text-2xl font-serif font-extrabold bg-gradient-to-r from-stone-900 via-pink-900 to-rose-800 bg-clip-text text-transparent dark:from-white dark:to-pink-200 mt-0.5">
                Club VIP & Beneficios
              </h1>
              <p className="text-xs text-stone-500 dark:text-pink-100/60 mt-0.5">Configure las escalas transaccionales y el catálogo exclusivo de recompensas.</p>
            </div>
          </div>

          {/* SELECTOR DE PLATAFORMA / WALLET ESTILO FRESH */}
          <div className="flex rounded-xl p-1 border bg-pink-50/50 border-pink-100/60 dark:bg-[#130f24] dark:border-fuchsia-950 shrink-0 self-start md:self-auto">
            <button 
              type="button"
              onClick={() => setActiveTab('glow')} 
              className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'glow' 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm font-black' 
                  : 'text-stone-400 dark:text-stone-500 hover:text-pink-500 dark:hover:text-pink-300'
              }`}
            >
              <Sparkles className="w-3 h-3" /> Nail & Glow
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('hair')} 
              className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'hair' 
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-sm font-black' 
                  : 'text-stone-400 dark:text-stone-500 hover:text-rose-500 dark:hover:text-amber-300'
              }`}
            >
              <Scissors className="w-3 h-3" /> Hair Crew
            </button>
          </div>
        </div>
      </div>

      {/* CONTENEDOR GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* COLUMNA IZQUIERDA: GESTIÓN DE NIVELES */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Layers className="w-3.5 h-3.5 text-pink-500" />
            <h2 className="text-[10px] uppercase font-mono font-bold tracking-widest text-stone-400 dark:text-stone-500">1. Escalafón de Rangos</h2>
          </div>

          {/* Formulario Nivel */}
          <form onSubmit={handleAddLevel} className="rounded-2xl p-5 space-y-4 bg-[#fffdfd] dark:bg-[#130f24] border border-pink-100/60 dark:border-fuchsia-950 shadow-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">Nombre del Rango</label>
                <input 
                  type="text" placeholder="Ej: Platinum" required
                  value={newLevel.name} onChange={e => setNewLevel({...newLevel, name: e.target.value})}
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-transparent border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 placeholder-stone-400 focus:outline-none focus:border-pink-300 transition-colors font-sans"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5 text-center">Insignia</label>
                <input 
                  type="text" placeholder="✨" required
                  value={newLevel.emoji} onChange={e => setNewLevel({...newLevel, emoji: e.target.value})}
                  className="w-full px-3 py-2 text-xs text-center rounded-xl border bg-transparent border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:border-pink-300 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">Puntaje de Corte (Mínimo requerido)</label>
              <input 
                type="number" 
                value={newLevel.min_points} 
                onChange={e => setNewLevel({...newLevel, min_points: e.target.value === '' ? 0 : Number(e.target.value)})}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border bg-transparent border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:border-pink-300 transition-colors"
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:opacity-95 active:scale-[0.99] flex items-center justify-center gap-1.5 transition-all shadow-md shadow-pink-500/10">
              <Plus className="w-3.5 h-3.5" /> Crear Rango VIP
            </button>
          </form>

          {/* Lista de Niveles */}
          <div className="space-y-2.5">
            {levels.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-2xl border-pink-100 dark:border-fuchsia-950 font-mono text-stone-400 text-xs">
                No se registran rangos de corte activos.
              </div>
            ) : (
              levels.map((l) => {
                const isEditing = editingLevelId === l.id;
                return (
                  <div key={l.id} className="rounded-xl p-4 bg-[#fffdfd] dark:bg-[#130f24] border border-pink-100/40 dark:border-fuchsia-950/70 shadow-xs transition-all hover:border-pink-300 group">
                    {isEditing && editLevelData ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <input 
                            type="text" value={editLevelData.name} onChange={e => setEditLevelData({...editLevelData, name: e.target.value})}
                            className="col-span-2 p-2 text-xs rounded-lg border bg-transparent border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100"
                          />
                          <input 
                            type="text" value={editLevelData.emoji} onChange={e => setEditLevelData({...editLevelData, emoji: e.target.value})}
                            className="p-2 text-xs text-center rounded-lg border bg-transparent border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-mono uppercase text-stone-400 block mb-1">Mínimo Requerido</label>
                          <input 
                            type="number" value={editLevelData.min_points} onChange={e => setEditLevelData({...editLevelData, min_points: Number(e.target.value)})}
                            className="w-full p-2 text-xs font-mono rounded-lg border bg-transparent border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100"
                          />
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                          <button type="button" onClick={() => setEditingLevelId(null)} className="px-2.5 py-1 text-[10px] font-mono text-stone-400 hover:text-stone-600 flex items-center gap-1"><X className="w-3 h-3" /> Cancelar</button>
                          <button type="button" onClick={() => l.id && handleSaveLevelEdit(l.id)} className="px-3 py-1 bg-pink-500 text-white rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm"><Check className="w-3 h-3" /> Guardar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl border flex items-center justify-center text-sm bg-pink-5050 dark:bg-fuchsia-950/20 border-pink-100/60 dark:border-fuchsia-950 shadow-inner">
                            {l.emoji}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-800 dark:text-pink-100">{l.name}</p>
                            <p className="text-[10px] font-mono text-stone-400 dark:text-stone-500 mt-0.5">Límite base: <span className="font-bold text-pink-500">{l.min_points} pts</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => { setEditingLevelId(l.id || null); setEditLevelData(l); }} className="p-1.5 rounded-xl bg-pink-50/50 dark:bg-fuchsia-950/20 border border-pink-100/60 dark:border-fuchsia-950/40 text-stone-400 hover:text-pink-500 transition-colors"><Edit3 className="w-3.5 h-3.5 stroke-[1.5]" /></button>
                          <button type="button" onClick={() => l.id && handleDeleteLevel(l.id)} className="p-1.5 rounded-xl bg-pink-50/50 dark:bg-fuchsia-950/20 border border-pink-100/60 dark:border-fuchsia-950/40 text-stone-400 hover:text-rose-500 transition-colors"><Trash2 className="w-3.5 h-3.5 stroke-[1.5]" /></button>
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
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Gift className="w-3.5 h-3.5 text-rose-500" />
            <h2 className="text-[10px] uppercase font-mono font-bold tracking-widest text-stone-400 dark:text-stone-500">2. Catálogo de Premios & Canjes</h2>
          </div>

          {/* Formulario Recompensas */}
          <form onSubmit={handleAddReward} className="rounded-2xl p-5 space-y-4 bg-[#fffdfd] dark:bg-[#130f24] border border-pink-100/60 dark:border-fuchsia-950 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">Nombre del Premio</label>
                <input 
                  type="text" placeholder="Ej: Set Nail Care Premium" required
                  value={newReward.name} onChange={e => setNewReward({...newReward, name: e.target.value})}
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-transparent border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 placeholder-stone-400 focus:outline-none focus:border-pink-300 transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">Costo (Puntos requeridos)</label>
                <input 
                  type="number" placeholder="Ej: 1500" required
                  value={newReward.points_required || ''} onChange={e => setNewReward({...newReward, points_required: Number(e.target.value)})}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border bg-transparent border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:border-pink-300 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">Descripción o Condiciones del Beneficio</label>
              <textarea 
                placeholder="Indique qué servicios incluye o limitaciones del premio canjeado..." required
                value={newReward.description} onChange={e => setNewReward({...newReward, description: e.target.value})}
                className="w-full px-3 py-2 text-xs rounded-xl border h-16 bg-transparent border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:border-pink-300 resize-none transition-colors font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">Rango Mínimo Autorizado</label>
                <input 
                  type="text" placeholder="Ej: Oro / Todos" required
                  value={newReward.tier} onChange={e => setNewReward({...newReward, tier: e.target.value})}
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-transparent border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:border-pink-300 transition-colors"
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
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border bg-transparent border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:border-pink-300 transition-colors"
                />
              </div>
            </div>

            <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:opacity-95 active:scale-[0.99] flex items-center justify-center gap-1.5 transition-all shadow-md shadow-pink-500/10">
              <Plus className="w-3.5 h-3.5" /> Agregar al Catálogo
            </button>
          </form>

          {/* Grid de Cards de Premios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rewards.length === 0 ? (
              <div className="col-span-full text-center py-8 border border-dashed rounded-2xl border-pink-100 dark:border-fuchsia-950 font-mono text-stone-400 text-xs">
                No hay premios creados en esta billetera.
              </div>
            ) : (
              rewards.map((r) => {
                const isEditing = editingRewardId === r.id;
                return (
                  <div key={r.id} className="group relative p-4 rounded-xl bg-[#fffdfd] dark:bg-[#130f24] border border-pink-100/40 dark:border-fuchsia-950/70 flex flex-col justify-between min-h-[140px] shadow-xs transition-all hover:border-pink-300">

                    {!isEditing && (
                      <div className="absolute top-3 right-3 flex items-center gap-0.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button type="button" onClick={() => { setEditingRewardId(r.id || null); setEditRewardData(r); }} className="p-1.5 rounded-xl bg-pink-50/50 dark:bg-fuchsia-950/20 border border-pink-100/60 dark:border-fuchsia-950/40 text-stone-400 hover:text-pink-500 transition-colors"><Edit3 className="w-3 h-3 stroke-[1.5]" /></button>
                        <button type="button" onClick={() => r.id && handleDeleteReward(r.id)} className="p-1.5 rounded-xl bg-pink-50/50 dark:bg-fuchsia-950/20 border border-pink-100/60 dark:border-fuchsia-950/40 text-stone-400 hover:text-rose-500 transition-colors"><Trash2 className="w-3 h-3 stroke-[1.5]" /></button>
                      </div>
                    )}

                    {isEditing && editRewardData ? (
                      <div className="space-y-2.5 w-full text-left">
                        <input 
                          type="text" value={editRewardData.name} onChange={e => setEditRewardData({...editRewardData, name: e.target.value})}
                          className="w-full p-2 text-xs rounded-lg border bg-transparent border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 font-bold"
                        />
                        <textarea 
                          value={editRewardData.description} onChange={e => setEditRewardData({...editRewardData, description: e.target.value})}
                          className="w-full p-2 text-[11px] rounded-lg border h-14 resize-none bg-transparent border-pink-100/60 dark:border-fuchsia-950 text-stone-500 dark:text-pink-100/60"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] font-mono uppercase text-stone-400">Rango</label>
                            <input 
                              type="text" value={editRewardData.tier} onChange={e => setEditRewardData({...editRewardData, tier: e.target.value})}
                              className="w-full p-1.5 text-xs rounded-lg border bg-transparent border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-200"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-mono uppercase text-stone-400">Costo Pts</label>
                            <input 
                              type="number" value={editRewardData.points_required} onChange={e => setEditRewardData({...editRewardData, points_required: Number(e.target.value)})}
                              className="w-full p-1.5 text-xs font-mono rounded-lg border bg-transparent border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-200"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[8px] font-mono uppercase text-stone-400">Descuento %</label>
                          <input 
                            type="number" value={editRewardData.discount_percentage} onChange={e => setEditRewardData({...editRewardData, discount_percentage: e.target.value === '' ? 0 : Number(e.target.value)})}
                            className="w-full p-1.5 text-xs font-mono rounded-lg border bg-transparent border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-200"
                          />
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                          <button type="button" onClick={() => setEditingRewardId(null)} className="px-2 py-1 text-[10px] font-mono text-stone-400 flex items-center gap-0.5"><X className="w-2.5 h-2.5" /> Cancelar</button>
                          <button type="button" onClick={() => r.id && handleSaveRewardEdit(r.id)} className="px-2.5 py-1 bg-pink-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> Guardar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1 pr-8">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border border-pink-100 dark:border-fuchsia-950 text-stone-400 dark:text-stone-500 tracking-wider">
                              {r.tier}
                            </span>
                            {r.discount_percentage > 0 && (
                              <span className="text-[9px] font-mono font-bold text-rose-500 bg-rose-500/[0.08] dark:bg-rose-500/[0.04] px-1.5 py-0.5 rounded border border-rose-500/10">
                                -{r.discount_percentage}% OFF
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold tracking-tight pt-1 text-stone-800 dark:text-pink-100">{r.name}</h4>
                          <p className="text-[11px] leading-relaxed line-clamp-2 text-stone-500 dark:text-pink-100/60 font-sans">{r.description}</p>
                        </div>

                        <div className="pt-2.5 mt-3 border-t border-pink-50 dark:border-fuchsia-950/40 flex items-center justify-between">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500">Valor de canje</span>
                          <strong className={`text-xs font-mono font-extrabold ${
                            activeTab === 'glow' ? 'text-pink-500' : 'text-rose-500'
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
