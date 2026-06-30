'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
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
  const { tenantId } = useAuth()
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
    }
  }, [tenantId, activeTab])

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const { data: lvData } = await supabase
        .from('vip_levels')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('wallet_type', activeTab)
        .order('min_points', { ascending: true })

      const { data: rwData } = await supabase
        .from('reward_catalog')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('wallet_type', activeTab)
        .order('points_required', { ascending: true })

      setLevels(lvData || [])
      setRewards(rwData || [])
    } catch (e) {
      console.error(e)
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
      await supabase.from('vip_levels').delete().eq('id', id)
      fetchConfig()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleDeleteReward = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este premio?')) return
    try {
      await supabase.from('reward_catalog').delete().eq('id', id)
      fetchConfig()
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="relative">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-8 h-8 border-3 border-amber-500/20 rounded-full animate-ping"></div>
        </div>
        <span className="ml-4 text-xs font-mono text-amber-500 animate-pulse">Cargando configuración VIP...</span>
      </div>
    )
  }

  return (
    <div className={`w-full max-w-5xl mx-auto p-4 md:p-6 antialiased relative min-h-[80vh] space-y-6 transition-colors duration-300 ${
      isDark ? 'text-stone-200' : 'text-stone-800'
    }`}>
      
      {/* HEADER CON CARD-GLOW */}
      <div className={`card-glow relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/[0.08] via-card to-card border border-amber-500/20 p-6 shadow-xl animate-fade-up ${
        isDark 
          ? 'bg-gradient-to-br from-amber-950/20 via-[#161311] to-[#0a0908]' 
          : 'bg-gradient-to-br from-amber-50/50 via-white to-stone-50'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              👑 Backoffice VIP
            </p>
            <h2 className="text-2xl font-serif italic text-foreground mt-1">
              Fidelización <span className="text-shimmer">Premium</span>
            </h2>
            <p className="text-xs text-mutedForeground mt-1">Gestione los rangos VIP y el catálogo de premios disponibles de forma directa.</p>
          </div>
          
          <div className={`flex border rounded-xl p-1 shadow-inner shrink-0 self-start md:self-center ${
            isDark ? 'bg-stone-900/40 border-stone-800/80' : 'bg-stone-100/80 border-stone-200/80'
          }`}>
            <button 
              onClick={() => { setActiveTab('glow'); }} 
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all duration-300 flex items-center gap-1.5 ${
                activeTab === 'glow' 
                  ? isDark 
                    ? 'bg-stone-900 text-amber-400 border border-stone-800 shadow-md' 
                    : 'bg-white text-amber-600 border border-stone-200 shadow-md'
                  : isDark 
                    ? 'text-stone-500 hover:text-stone-200' 
                    : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Estética & Glow
            </button>
            <button 
              onClick={() => { setActiveTab('hair'); }} 
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all duration-300 flex items-center gap-1.5 ${
                activeTab === 'hair' 
                  ? isDark 
                    ? 'bg-stone-900 text-indigo-400 border border-stone-800 shadow-md' 
                    : 'bg-white text-indigo-600 border border-stone-200 shadow-md'
                  : isDark 
                    ? 'text-stone-500 hover:text-stone-200' 
                    : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" /> Peluquería Crew
            </button>
          </div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* SECCIÓN NIVELES */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Layers className={`w-4 h-4 ${isDark ? 'text-amber-500' : 'text-amber-600'}`} />
            <h2 className="text-xs uppercase font-mono font-black tracking-widest text-stone-500">1. Escalafón de Niveles</h2>
          </div>

          <form onSubmit={handleAddLevel} className={`rounded-2xl p-4 space-y-3 shadow-sm border ${
            isDark ? 'bg-stone-900/40 border-stone-800/80' : 'bg-white border-stone-200/90'
          }`}>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 block mb-1">Nombre</label>
                <input 
                  type="text" placeholder="Ej: Plata" required
                  value={newLevel.name} onChange={e => setNewLevel({...newLevel, name: e.target.value})}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-none ${
                    isDark 
                      ? 'bg-stone-950/60 border-stone-800 text-stone-200' 
                      : 'bg-stone-50 border-stone-200 text-stone-800'
                  }`}
                />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 block mb-1 text-center">Icono</label>
                <input 
                  type="text" placeholder="🥈" required
                  value={newLevel.emoji} onChange={e => setNewLevel({...newLevel, emoji: e.target.value})}
                  className={`w-full p-2.5 text-xs text-center rounded-xl border focus:outline-none ${
                    isDark 
                      ? 'bg-stone-950/60 border-stone-800 text-stone-200' 
                      : 'bg-stone-50 border-stone-200 text-stone-800'
                  }`}
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 block mb-1">Puntos Mínimos</label>
              <input 
                type="number" 
                value={newLevel.min_points} 
                onChange={e => setNewLevel({...newLevel, min_points: e.target.value === '' ? 0 : Number(e.target.value)})}
                className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-none ${
                  isDark 
                    ? 'bg-stone-950/60 border-stone-800 text-stone-200' 
                    : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              />
            </div>
            <button type="submit" className="glow-hover w-full py-2.5 bg-stone-900 text-white dark:bg-white dark:text-black rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-stone-800 flex items-center justify-center gap-1 transition-all">
              <Plus className="w-3.5 h-3.5" /> Agregar Nuevo Rango
            </button>
          </form>

          <div className="space-y-2">
            {levels.length === 0 ? (
              <p className={`text-[11px] font-mono text-center py-4 border border-dashed rounded-2xl ${
                isDark ? 'text-stone-500 bg-stone-900/10' : 'text-stone-400 bg-stone-50'
              }`}>No hay rangos creados.</p>
            ) : (
              levels.map((l) => {
                const isEditing = editingLevelId === l.id;
                return (
                  <div key={l.id} className={`rounded-2xl p-3.5 shadow-sm border transition-all ${
                    isDark ? 'bg-stone-900/30 border-stone-800/80' : 'bg-white border-stone-200'
                  }`}>
                    {isEditing && editLevelData ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <input 
                            type="text" value={editLevelData.name} onChange={e => setEditLevelData({...editLevelData, name: e.target.value})}
                            className={`col-span-2 p-2 text-xs rounded-lg border ${
                              isDark 
                                ? 'bg-stone-950 border-stone-800 text-stone-200' 
                                : 'bg-stone-100 border-stone-200 text-stone-800'
                            }`}
                          />
                          <input 
                            type="text" value={editLevelData.emoji} onChange={e => setEditLevelData({...editLevelData, emoji: e.target.value})}
                            className={`p-2 text-xs text-center rounded-lg border ${
                              isDark 
                                ? 'bg-stone-950 border-stone-800 text-stone-200' 
                                : 'bg-stone-100 border-stone-200 text-stone-800'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-mono font-bold text-stone-400">Puntos Mínimos</label>
                          <input 
                            type="number" value={editLevelData.min_points} onChange={e => setEditLevelData({...editLevelData, min_points: Number(e.target.value)})}
                            className={`w-full p-2 text-xs font-mono rounded-lg border ${
                              isDark 
                                ? 'bg-stone-950 border-stone-800 text-stone-200' 
                                : 'bg-stone-100 border-stone-200 text-stone-800'
                            }`}
                          />
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                          <button onClick={() => setEditingLevelId(null)} className="px-2.5 py-1 text-[11px] font-mono flex items-center gap-1 text-stone-400 hover:text-stone-600"><X className="w-3 h-3" /> Cancelar</button>
                          <button onClick={() => l.id && handleSaveLevelEdit(l.id)} className="px-3 py-1 bg-amber-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm"><Check className="w-3 h-3" /> Guardar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-base shadow-inner ${
                            isDark 
                              ? 'bg-stone-900 border-stone-800' 
                              : 'bg-stone-50 border-stone-200'
                          }`}>{l.emoji}</div>
                          <div>
                            <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-stone-900'}`}>{l.name}</p>
                            <p className={`text-[10px] font-mono ${isDark ? 'text-stone-400' : 'text-stone-400'}`}>Requisito: <strong className={isDark ? 'text-stone-300' : 'text-stone-600'}>{l.min_points} pts</strong></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all">
                          <button onClick={() => { setEditingLevelId(l.id || null); setEditLevelData(l); }} className={`p-2 rounded-xl transition-all ${isDark ? 'text-stone-400 hover:text-amber-400' : 'text-stone-400 hover:text-amber-500'}`}><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => l.id && handleDeleteLevel(l.id)} className={`p-2 rounded-xl transition-all ${isDark ? 'text-stone-400 hover:text-red-400' : 'text-stone-400 hover:text-red-500'}`}><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* SECCIÓN RECOMPENSAS */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Gift className={`w-4 h-4 ${isDark ? 'text-amber-500' : 'text-amber-600'}`} />
            <h2 className="text-xs uppercase font-mono font-black tracking-widest text-stone-500">2. Catálogo de Premios</h2>
          </div>

          <form onSubmit={handleAddReward} className={`rounded-2xl p-5 space-y-4 shadow-sm border ${
            isDark ? 'bg-stone-900/40 border-stone-800/80' : 'bg-white border-stone-200/90'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 block mb-1">Nombre del Premio</label>
                <input 
                  type="text" placeholder="Ej: Pedicura Completa" required
                  value={newReward.name} onChange={e => setNewReward({...newReward, name: e.target.value})}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-none ${
                    isDark 
                      ? 'bg-stone-950/60 border-stone-800 text-stone-200' 
                      : 'bg-stone-50 border-stone-200 text-stone-800'
                  }`}
                />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 block mb-1">Costo (Puntos)</label>
                <input 
                  type="number" placeholder="Ej: 2500" required
                  value={newReward.points_required || ''} onChange={e => setNewReward({...newReward, points_required: Number(e.target.value)})}
                  className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-none ${
                    isDark 
                      ? 'bg-stone-950/60 border-stone-800 text-stone-200' 
                      : 'bg-stone-50 border-stone-200 text-stone-800'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 block mb-1">Descripción</label>
              <textarea 
                placeholder="Detalles que incluye el premio..." required
                value={newReward.description} onChange={e => setNewReward({...newReward, description: e.target.value})}
                className={`w-full p-2.5 text-xs rounded-xl border h-16 resize-none focus:outline-none ${
                  isDark 
                    ? 'bg-stone-950/60 border-stone-800 text-stone-200' 
                    : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 block mb-1">Rango Exclusivo</label>
                <input 
                  type="text" placeholder="Ej: Plata" required
                  value={newReward.tier} onChange={e => setNewReward({...newReward, tier: e.target.value})}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-none ${
                    isDark 
                      ? 'bg-stone-950/60 border-stone-800 text-stone-200' 
                      : 'bg-stone-50 border-stone-200 text-stone-800'
                  }`}
                />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 block mb-1 flex items-center gap-0.5">
                  <Percent className={`w-2.5 h-2.5 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} /> % Descuento
                </label>
                <input 
                  type="number" placeholder="Ej: 0"
                  value={newReward.discount_percentage} 
                  onChange={e => setNewReward({...newReward, discount_percentage: e.target.value === '' ? 0 : Number(e.target.value)})}
                  className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-none ${
                    isDark 
                      ? 'bg-stone-950/60 border-stone-800 text-stone-200' 
                      : 'bg-stone-50 border-stone-200 text-stone-800'
                  }`}
                />
              </div>
            </div>

            <button type="submit" className="glow-hover w-full py-2.5 bg-stone-900 text-white dark:bg-white dark:text-black rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-stone-800 flex items-center justify-center gap-1 transition-all">
              <Plus className="w-3.5 h-3.5" /> Publicar en el Catálogo
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rewards.length === 0 ? (
              <div className={`col-span-full p-6 text-center border border-dashed rounded-2xl ${
                isDark ? 'bg-stone-900/5 border-stone-800/80' : 'bg-stone-50 border-stone-200'
              }`}>
                <p className={`text-[11px] font-mono ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>Catálogo vacío.</p>
              </div>
            ) : (
              rewards.map((r) => {
                const isEditing = editingRewardId === r.id;
                return (
                  <div key={r.id} className={`group relative p-4 rounded-2xl border shadow-sm flex flex-col justify-between gap-3 transition-all card-glow ${
                    isDark 
                      ? 'bg-stone-900/20 border-stone-800/80' 
                      : 'bg-white border-stone-200'
                  }`}>
                    
                    {!isEditing && (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all z-10">
                        <button onClick={() => { setEditingRewardId(r.id || null); setEditRewardData(r); }} className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-stone-400 hover:text-amber-400' : 'text-stone-400 hover:text-amber-500'}`}><Edit3 className="w-3 h-3" /></button>
                        <button onClick={() => r.id && handleDeleteReward(r.id)} className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-stone-400 hover:text-red-400' : 'text-stone-400 hover:text-red-500'}`}><Trash2 className="w-3 h-3" /></button>
                      </div>
                    )}

                    {isEditing && editRewardData ? (
                      <div className="space-y-2.5 w-full text-left">
                        <input 
                          type="text" value={editRewardData.name} onChange={e => setEditRewardData({...editRewardData, name: e.target.value})}
                          className={`w-full p-2 text-xs rounded-lg border font-bold ${
                            isDark 
                              ? 'bg-stone-950 border-stone-800 text-white' 
                              : 'bg-stone-100 border-stone-200 text-stone-900'
                          }`}
                        />
                        <textarea 
                          value={editRewardData.description} onChange={e => setEditRewardData({...editRewardData, description: e.target.value})}
                          className={`w-full p-2 text-[11px] rounded-lg border h-14 resize-none ${
                            isDark 
                              ? 'bg-stone-950 border-stone-800 text-stone-400' 
                              : 'bg-stone-100 border-stone-200 text-stone-600'
                          }`}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] font-mono uppercase text-stone-400">Rango</label>
                            <input 
                              type="text" value={editRewardData.tier} onChange={e => setEditRewardData({...editRewardData, tier: e.target.value})}
                              className={`w-full p-1.5 text-xs rounded-lg border ${
                                isDark 
                                  ? 'bg-stone-950 border-stone-800 text-stone-200' 
                                  : 'bg-stone-100 border-stone-200 text-stone-800'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-mono uppercase text-stone-400">Costo Pts</label>
                            <input 
                              type="number" value={editRewardData.points_required} onChange={e => setEditRewardData({...editRewardData, points_required: Number(e.target.value)})}
                              className={`w-full p-1.5 text-xs font-mono rounded-lg border ${
                                isDark 
                                  ? 'bg-stone-950 border-stone-800 text-stone-200' 
                                  : 'bg-stone-100 border-stone-200 text-stone-800'
                              }`}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[8px] font-mono uppercase text-stone-400">Descuento %</label>
                          <input 
                            type="number" value={editRewardData.discount_percentage} onChange={e => setEditRewardData({...editRewardData, discount_percentage: e.target.value === '' ? 0 : Number(e.target.value)})}
                            className={`w-full p-1.5 text-xs font-mono rounded-lg border ${
                              isDark 
                                ? 'bg-stone-950 border-stone-800 text-stone-200' 
                                : 'bg-stone-100 border-stone-200 text-stone-800'
                            }`}
                          />
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                          <button onClick={() => setEditingRewardId(null)} className="px-2 py-1 text-[10px] font-mono text-stone-400 flex items-center gap-0.5"><X className="w-2.5 h-2.5" /> Cancelar</button>
                          <button onClick={() => r.id && handleSaveRewardEdit(r.id)} className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> Guardar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1 pr-12">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[9px] font-mono uppercase font-black px-1.5 py-0.5 rounded border tracking-wider ${
                              isDark 
                                ? 'bg-stone-800 border-stone-700 text-stone-400' 
                                : 'bg-stone-100 border-stone-200 text-stone-500'
                            }`}>
                              {r.tier}
                            </span>
                            {r.discount_percentage > 0 && (
                              <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                -{r.discount_percentage}% OFF
                              </span>
                            )}
                          </div>
                          <h4 className={`text-xs font-black tracking-tight pt-0.5 ${isDark ? 'text-white' : 'text-stone-900'}`}>{r.name}</h4>
                          <p className={`text-[11px] leading-normal line-clamp-2 ${isDark ? 'text-stone-400' : 'text-stone-400'}`}>{r.description}</p>
                        </div>

                        <div className={`pt-2 border-t flex items-center justify-between ${
                          isDark ? 'border-stone-800/60' : 'border-stone-100'
                        }`}>
                          <span className={`text-[10px] font-mono uppercase tracking-widest ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>Inversión</span>
                          <strong className={`text-xs font-mono font-black ${
                            activeTab === 'glow' 
                              ? isDark ? 'text-amber-400' : 'text-amber-600'
                              : isDark ? 'text-indigo-400' : 'text-indigo-600'
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

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  )
}