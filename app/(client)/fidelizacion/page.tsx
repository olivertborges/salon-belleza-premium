'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Crown, Gift, Check, ArrowUpRight, Sparkles, Scissors, 
  Ticket, Copy, ShieldCheck, Award, TrendingUp, Lock,
  Gem, Star, Zap, Wallet, ChevronRight
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { QRCodeSVG } from 'qrcode.react'

interface WalletData {
  glow_points: number
  glow_points_earned: number
  glow_points_redeemed: number
  hair_points: number
  hair_points_earned: number
  hair_points_redeemed: number
  glow_level: string
  hair_level: string
}

interface LevelData {
  id: string
  name: string
  emoji: string
  color_hex: string
  badge: string
  benefits: string[]
  min_points: number
}

interface Reward {
  id: string
  name: string
  description: string
  points_required: number
  tier: string
  discount_percentage: number
}

export default function VIPClubPage() {
  const { user, tenantId } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [glowLevels, setGlowLevels] = useState<LevelData[]>([])
  const [hairLevels, setHairLevels] = useState<LevelData[]>([])
  const [glowRewards, setGlowRewards] = useState<Reward[]>([])
  const [hairRewards, setHairRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'glow' | 'hair'>('glow')
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (user?.id && tenantId) {
      fetchData()
    }
  }, [user, tenantId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // PRIMERO: Obtener el cliente por auth_user_id
      const { data: cliente, error: clienteError } = await supabase
        .from('clients')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single()

      if (clienteError) {
        console.error('Error obteniendo cliente:', clienteError)
        setLoading(false)
        return
      }

      if (!cliente) {
        console.log('Cliente no encontrado')
        setLoading(false)
        return
      }

      // SEGUNDO: Obtener wallet del cliente
      const { data: walletData, error: walletError } = await supabase
        .from('loyalty_wallets')
        .select('*')
        .eq('client_id', cliente.id)
        .eq('tenant_id', tenantId)
        .single()

      if (walletError && walletError.code !== 'PGRST116') {
        console.error('Error cargando wallet:', walletError)
      }

      setWallet(walletData || {
        glow_points: 0, glow_points_earned: 0, glow_points_redeemed: 0,
        hair_points: 0, hair_points_earned: 0, hair_points_redeemed: 0,
        glow_level: 'Bronce', hair_level: 'Bronce'
      })

      // Obtener niveles VIP
      const { data: gLv } = await supabase
        .from('vip_levels')
        .select('*')
        .eq('wallet_type', 'glow')
        .eq('is_active', true)
        .eq('tenant_id', tenantId)
        .order('min_points', { ascending: true })

      setGlowLevels(gLv || [])

      const { data: hLv } = await supabase
        .from('vip_levels')
        .select('*')
        .eq('wallet_type', 'hair')
        .eq('is_active', true)
        .eq('tenant_id', tenantId)
        .order('min_points', { ascending: true })

      setHairLevels(hLv || [])

      // Obtener recompensas
      const { data: gRw } = await supabase
        .from('reward_catalog')
        .select('*')
        .eq('wallet_type', 'glow')
        .eq('is_active', true)
        .eq('tenant_id', tenantId)
        .order('points_required', { ascending: true })

      setGlowRewards(gRw || [])

      const { data: hRw } = await supabase
        .from('reward_catalog')
        .select('*')
        .eq('wallet_type', 'hair')
        .eq('is_active', true)
        .eq('tenant_id', tenantId)
        .order('points_required', { ascending: true })

      setHairRewards(hRw || [])
      
    } catch (e) {
      console.error('Error cargando datos VIP:', e)
    } finally {
      setLoading(false)
    }
  }

  const getLevelInfo = (points: number, levels: LevelData[]) => {
    if (!levels || levels.length === 0) return { current: null, next: null, progress: 0, needed: 0 }
    const current = [...levels].reverse().find(l => l.min_points <= points) || levels[0]
    const next = levels.find(l => l.min_points > points)
    if (!next) return { current, next: null, progress: 100, needed: 0 }
    const base = current ? current.min_points : 0
    const stepTotal = next.min_points - base
    const stepProgress = points - base
    return { current, next, progress: Math.min((stepProgress / stepTotal) * 100, 100), needed: next.min_points - points }
  }

  const currentLevels = activeTab === 'glow' ? glowLevels : hairLevels
  const currentRewards = activeTab === 'glow' ? glowRewards : hairRewards
  const currentPoints = activeTab === 'glow' ? (wallet?.glow_points || 0) : (wallet?.hair_points || 0)
  const currentLevelName = activeTab === 'glow' ? (wallet?.glow_level || 'Bronce') : (wallet?.hair_level || 'Bronce')

  const currentInfo = getLevelInfo(currentPoints, currentLevels)

  const requestRedeem = async () => {
    if (!selectedReward || !user?.id || !tenantId) return
    try {
      const { data, error } = await supabase.rpc('redeem_reward', {
        p_client_id: user.id,
        p_tenant_id: tenantId,
        p_reward_id: selectedReward.id,
        p_wallet_type: activeTab
      })
      if (error) throw error
      setGeneratedCode(data)
      confetti({ particleCount: 120, spread: 60, origin: { y: 0.7 } })
      fetchData()
    } catch (e: any) {
      alert(e.message || 'Error procesando el canje')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isTierLocked = (rewardTier: string, levels: LevelData[], currentTierName: string) => {
    const currentLevelIdx = levels.findIndex(l => l.name.toLowerCase() === currentTierName.toLowerCase())
    const rewardLevelIdx = levels.findIndex(l => l.name.toLowerCase() === rewardTier.toLowerCase())
    if (currentLevelIdx === -1 || rewardLevelIdx === -1) return false
    return rewardLevelIdx > currentLevelIdx
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="relative">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-8 h-8 border-3 border-amber-500/20 rounded-full animate-ping"></div>
        </div>
        <span className="ml-4 text-xs font-mono text-amber-500 animate-pulse">Cargando club VIP...</span>
      </div>
    )
  }

  return (
    <div className={`w-full max-w-5xl mx-auto p-4 md:p-6 antialiased selection:bg-amber-500/20 relative min-h-[60vh] space-y-6 transition-colors duration-300 overflow-x-hidden ${
      isDark ? 'text-stone-200' : 'text-stone-800'
    }`}>

      <div className={`absolute top-[-5%] left-1/3 w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none ${
        isDark ? 'bg-amber-500/[0.04]' : 'bg-amber-500/[0.02]'
      }`} />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes customFadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes customSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .custom-animate-fade { animation: customFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-animate-slide { animation: customSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />

      {/* HEADER */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/[0.08] via-card to-card border border-amber-500/20 p-6 shadow-xl custom-animate-fade ${
        isDark 
          ? 'bg-gradient-to-br from-amber-950/20 via-[#161311] to-[#0a0908]' 
          : 'bg-gradient-to-br from-amber-50/50 via-white to-stone-50'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              👑 Club VIP Elite
            </p>
            <h2 className="text-2xl font-serif italic text-foreground mt-1">
              Tu Pasaporte de <span className="text-shimmer">Beneficios</span>
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Descubre tus premios disponibles y las metas de los siguientes rangos exclusivos.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-3 py-1.5 rounded-xl border text-[10px] font-mono flex items-center gap-1.5 ${
              isDark 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
            }`}>
              <Gem className="w-3 h-3" />
              {activeTab === 'glow' ? 'Glow' : 'Hair'} Points
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 space-y-6">

        {/* SELECTOR DE SUB-SISTEMAS */}
        <div className={`flex border rounded-2xl p-1.5 shadow-inner max-w-md custom-animate-fade ${
          isDark ? 'bg-stone-900/40 border-stone-800/80' : 'bg-stone-100/80 border-stone-200/80'
        }`}>
          <button 
            onClick={() => { setActiveTab('glow'); setGeneratedCode(null); }} 
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 ${
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
            onClick={() => { setActiveTab('hair'); setGeneratedCode(null); }} 
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 ${
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

        {/* TARJETA DE BALANCE VIP */}
        <div className={`relative overflow-hidden rounded-3xl border p-6 shadow-sm group custom-animate-slide ${
          isDark 
            ? 'bg-gradient-to-br from-stone-900/40 to-stone-950/40 border-stone-800/70 shadow-[0_20px_40px_rgba(0,0,0,0.5)]' 
            : 'bg-gradient-to-br from-white to-stone-50 border-stone-200/90'
        }`}>
          <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-5 dark:opacity-[0.08] pointer-events-none transition-all duration-700 group-hover:scale-125 ${
            activeTab === 'glow' ? 'bg-amber-500' : 'bg-indigo-500'
          }`} />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <span className={`text-[10px] uppercase font-mono font-black tracking-widest block ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`}>Puntaje Disponible</span>
              <div className="flex items-baseline gap-3">
                <span className={`text-5xl font-black tracking-tight ${
                  activeTab === 'glow'
                    ? isDark ? 'text-amber-400' : 'text-amber-600'
                    : isDark ? 'text-indigo-400' : 'text-indigo-600'
                }`}>
                  {currentPoints}
                </span>
                <span className={`text-sm font-mono font-black uppercase ${
                  activeTab === 'glow' 
                    ? isDark ? 'text-amber-400/70' : 'text-amber-600/70'
                    : isDark ? 'text-indigo-400/70' : 'text-indigo-600/70'
                }`}>Puntos</span>
              </div>
            </div>

            <div className={`flex items-center gap-3 border p-3 rounded-2xl shrink-0 w-full sm:w-auto ${
              isDark 
                ? 'bg-stone-950/60 border-stone-800' 
                : 'bg-stone-50 border-stone-200'
            }`}>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl shadow-sm ${
                isDark 
                  ? 'bg-stone-900 border-stone-800' 
                  : 'bg-white border-stone-200'
              }`}>
                {currentInfo.current?.emoji || '🥉'}
              </div>
              <div>
                <p className={`text-[10px] font-mono uppercase tracking-wider ${
                  isDark ? 'text-stone-400' : 'text-stone-500'
                }`}>Tu Rango VIP</p>
                <p className={`text-sm font-black tracking-tight ${
                  isDark ? 'text-white' : 'text-stone-900'
                }`}>{currentLevelName}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className={`w-full h-2 border rounded-full overflow-hidden p-[2px] shadow-inner ${
              isDark 
                ? 'bg-stone-950/80 border-stone-800/80' 
                : 'bg-stone-100 border-stone-200'
            }`}>
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)] ${
                  activeTab === 'glow' 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-300 dark:from-amber-500 dark:to-amber-300' 
                    : 'bg-gradient-to-r from-indigo-500 to-indigo-300 dark:from-indigo-500 dark:to-indigo-300'
                }`} 
                style={{ width: `${currentInfo.progress}%` }} 
              />
            </div>
            <div className={`flex justify-between items-center text-[11px] font-mono ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}>
              {currentInfo.next ? (
                <>
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Progreso de Nivel</span>
                  <span>Faltan <strong className={`font-bold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{currentInfo.needed} pts</strong> para {currentInfo.next.name}</span>
                </>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5 w-full justify-center py-0.5">
                  <Award className="w-3.5 h-3.5" /> ¡Nivel máximo alcanzado!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ESCALAFÓN DEL CLUB */}
        <div className={`border rounded-2xl p-4 space-y-3 custom-animate-slide ${
          isDark ? 'bg-stone-900/20 border-stone-800/80' : 'bg-stone-50 border-stone-200/60'
        }`}>
          <p className={`text-[10px] uppercase font-mono font-bold tracking-widest px-1 ${
            isDark ? 'text-stone-400' : 'text-stone-500'
          }`}>Escalafón del Club Exclusive</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {currentLevels.map((lvl) => {
              const isCurrent = lvl.name.toLowerCase() === currentLevelName.toLowerCase()
              const isPassed = currentPoints >= lvl.min_points
              return (
                <div 
                  key={lvl.id} 
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isCurrent 
                      ? isDark 
                        ? 'bg-stone-900 border-amber-500/40 shadow-sm ring-1 ring-amber-500/20' 
                        : 'bg-white border-amber-500/40 shadow-sm ring-1 ring-amber-500/20'
                      : isPassed 
                        ? isDark 
                          ? 'bg-stone-950/20 border-stone-800/40 opacity-75' 
                          : 'bg-stone-100/50 border-stone-200/50 opacity-75'
                        : isDark 
                          ? 'bg-stone-950/5 border-stone-900/40 opacity-40' 
                          : 'bg-stone-100/20 border-stone-200/20 opacity-40'
                  }`}
                >
                  <span className="text-lg block mb-1">{lvl.emoji}</span>
                  <p className={`text-xs font-black tracking-tight ${
                    isCurrent 
                      ? isDark ? 'text-amber-400' : 'text-amber-600'
                      : isDark ? 'text-stone-300' : 'text-stone-700'
                  }`}>{lvl.name}</p>
                  <p className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{lvl.min_points} pts</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* CATÁLOGO DE PREMIOS */}
        <div className="space-y-4 pt-2 custom-animate-slide">
          <div className="flex items-center gap-2 px-1">
            <Gift className={`w-4 h-4 ${isDark ? 'text-amber-500' : 'text-amber-600'}`} />
            <h3 className={`text-xs uppercase font-mono font-black tracking-widest ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}>Catálogo de Premios</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentRewards.length === 0 ? (
              <div className={`col-span-full p-8 text-center border border-dashed rounded-2xl ${
                isDark 
                  ? 'border-stone-800/80 bg-stone-900/10 text-stone-500' 
                  : 'border-stone-200 bg-white/50 text-stone-400'
              }`}>
                <p className="text-xs font-mono">No hay premios disponibles en este momento.</p>
              </div>
            ) : (
              currentRewards.map((r) => {
                const lockedByTier = isTierLocked(r.tier, currentLevels, currentLevelName)
                const canAfford = currentPoints >= r.points_required && !lockedByTier

                return (
                  <div 
                    key={r.id} 
                    className={`group relative p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-4 bg-white dark:bg-stone-900/30 backdrop-blur-sm ${
                      lockedByTier 
                        ? isDark 
                          ? 'border-stone-900/40 bg-stone-950/5 shadow-inner' 
                          : 'border-stone-200/40 bg-stone-50/50 shadow-inner'
                        : canAfford 
                          ? isDark 
                            ? 'border-stone-800/80 hover:border-amber-500/30 shadow-sm hover:shadow-md hover:-translate-y-0.5' 
                            : 'border-stone-200 hover:border-amber-500/40 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                          : isDark 
                            ? 'border-stone-800/60 opacity-75' 
                            : 'border-stone-200/60 opacity-75'
                    }`}
                  >
                    {lockedByTier && (
                      <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold border shadow-sm z-10 ${
                        isDark 
                          ? 'bg-stone-900 border-stone-800 text-stone-400' 
                          : 'bg-stone-200/80 border-stone-300/50 text-stone-500'
                      }`}>
                        <Lock className="w-2.5 h-2.5 text-stone-400" /> Rango {r.tier}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-sm font-black tracking-tight transition-colors flex items-center gap-1 ${
                          lockedByTier 
                            ? isDark ? 'text-stone-600 line-through' : 'text-stone-400 line-through'
                            : isDark 
                              ? 'text-stone-100 group-hover:text-amber-400' 
                              : 'text-stone-900 group-hover:text-amber-600'
                        }`}>
                          {r.name}
                        </p>
                        {!lockedByTier && r.discount_percentage > 0 && (
                          <span className="text-[9px] font-mono font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 shrink-0">
                            -{r.discount_percentage}% OFF
                          </span>
                        )}
                      </div>
                      <p className={`text-xs leading-normal line-clamp-2 ${
                        lockedByTier 
                          ? isDark ? 'text-stone-600/50' : 'text-stone-400/60'
                          : isDark ? 'text-stone-400' : 'text-stone-500'
                      }`}>{r.description || 'Sin descripción detallada.'}</p>
                    </div>

                    <div className={`flex items-center justify-between pt-3 border-t mt-auto ${
                      isDark ? 'border-stone-800/60' : 'border-stone-100'
                    }`}>
                      <div className="flex flex-col">
                        <span className={`text-xs font-mono font-black ${
                          lockedByTier 
                            ? isDark ? 'text-stone-600' : 'text-stone-400'
                            : activeTab === 'glow' 
                              ? isDark ? 'text-amber-400' : 'text-amber-600'
                              : isDark ? 'text-indigo-400' : 'text-indigo-600'
                        }`}>{r.points_required} PTS</span>
                        <span className={`text-[9px] font-mono uppercase tracking-wider ${
                          isDark ? 'text-stone-500' : 'text-stone-400'
                        }`}>Nivel: {r.tier}</span>
                      </div>

                      {lockedByTier ? (
                        <span className={`text-[9px] font-mono uppercase tracking-wider font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-xl border ${
                          isDark 
                            ? 'text-stone-600 bg-stone-900/60 border-stone-800/60' 
                            : 'text-stone-400 bg-stone-100 border-stone-200'
                        }`}>
                          Bloqueado
                        </span>
                      ) : (
                        <button 
                          disabled={!canAfford} 
                          onClick={() => { setSelectedReward(r); setShowRedeemModal(true); }} 
                          className={`px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shrink-0 border active:scale-95 flex items-center gap-1 ${
                            canAfford 
                              ? isDark 
                                ? 'bg-white text-black border-white hover:bg-stone-100 shadow-sm' 
                                : 'bg-stone-900 text-white border-stone-900 hover:bg-stone-800 shadow-sm'
                              : isDark 
                                ? 'bg-stone-900 text-stone-600 border-stone-800 cursor-not-allowed' 
                                : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                          }`}
                        >
                          {currentPoints >= r.points_required ? 'Canjear' : 'Faltan Puntos'} 
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE CANJE */}
      {showRedeemModal && selectedReward && (
        <div className="fixed inset-0 bg-stone-950/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 custom-animate-fade">
          <div className={`border rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden transition-all duration-500 border-t-amber-500/30 ${
            isDark 
              ? 'bg-stone-950 border-stone-800' 
              : 'bg-white border-stone-200'
          }`}>

            {!generatedCode ? (
              <div className="space-y-4 text-center">
                <div className={`w-12 h-12 border rounded-full flex items-center justify-center mx-auto ${
                  isDark 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                }`}>
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-black text-base tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>¿Confirmar Canje?</h4>
                  <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Canjearás <strong className={`font-mono ${isDark ? 'text-white' : 'text-stone-900'}`}>{selectedReward.points_required} puntos</strong> por:
                  </p>
                  <p className={`text-xs font-bold mt-3 p-3 rounded-xl border ${
                    isDark 
                      ? 'text-amber-400 bg-stone-900 border-stone-800' 
                      : 'text-amber-700 bg-stone-50 border-stone-200'
                  }`}>{selectedReward.name}</p>
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button onClick={() => setShowRedeemModal(false)} className={`flex-1 py-2.5 border text-xs rounded-xl font-bold transition-colors ${
                    isDark 
                      ? 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800' 
                      : 'bg-stone-100 border-stone-200 text-stone-500 hover:bg-stone-200'
                  }`}>Cancelar</button>
                  <button onClick={requestRedeem} className={`flex-1 py-2.5 text-xs font-black rounded-xl shadow-lg ${
                    isDark 
                      ? 'bg-white text-black hover:bg-stone-100' 
                      : 'bg-stone-900 text-white hover:bg-stone-800'
                  }`}>Confirmar</button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 text-center">
                <div className={`w-12 h-12 border rounded-full flex items-center justify-center mx-auto ${
                  isDark 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-black text-base tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>¡Premio Canjeado!</h4>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Presenta este código en recepción.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl inline-block shadow-md border mx-auto ${
                  isDark 
                    ? 'bg-stone-950 border-stone-800' 
                    : 'bg-white border-stone-200'
                }`}>
                  <QRCodeSVG 
                    value={generatedCode.toUpperCase().trim()} 
                    size={170}
                    level="H"
                    bgColor={isDark ? '#0a0908' : '#FFFFFF'}
                    fgColor={isDark ? '#FFFFFF' : '#000000'}
                  />
                </div>

                <div className={`flex items-center justify-between border px-3 py-2.5 rounded-xl font-mono text-xs max-w-xs mx-auto shadow-inner ${
                  isDark 
                    ? 'bg-stone-900 border-stone-800' 
                    : 'bg-stone-50 border-stone-200'
                }`}>
                  <span className={`text-[9px] uppercase font-bold tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Código</span>
                  <span className={`font-black tracking-widest text-sm ${isDark ? 'text-white' : 'text-stone-900'}`}>{generatedCode}</span>
                  <button 
                    type="button"
                    onClick={() => copyToClipboard(generatedCode)} 
                    className={`p-1.5 rounded-lg transition-all ${
                      isDark 
                        ? 'hover:bg-stone-800 text-stone-400 hover:text-white' 
                        : 'hover:bg-stone-200 text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button 
                  onClick={() => { setShowRedeemModal(false); setGeneratedCode(null); }} 
                  className={`w-full py-2.5 text-xs rounded-xl font-black transition-colors ${
                    isDark 
                      ? 'bg-stone-800 text-stone-200 hover:bg-stone-700' 
                      : 'bg-stone-900 text-white hover:bg-stone-800'
                  }`}
                >
                  Finalizar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
