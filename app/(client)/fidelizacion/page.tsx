// @ts-nocheck
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
  const [clientId, setClientId] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    fetchVIPData()
  }, [user?.id])

  const fetchVIPData = async () => {
    try {
      setLoading(true)

      // 1. PASO IGUAL AL DASHBOARD DE HOY: Obtener primero el ID relacional de la tabla 'clients'
      const { data: clienteData, error: clienteError } = await supabase
        .from('clients')
        .select('id')
        .eq('auth_user_id', user?.id)
        .maybeSingle()

      if (clienteError) console.error("❌ Error leyendo cliente:", clienteError.message)

      if (clienteData) {
        const activeClientId = clienteData.id
        setClientId(activeClientId)

        // 2. PASO IGUAL AL DASHBOARD DE HOY: Buscar la wallet usando el client_id resuelto
        const { data: walletData, error: walletError } = await supabase
          .from('loyalty_wallets')
          .select('*')
          .eq('client_id', activeClientId)
          .maybeSingle()

        if (walletError) console.error("❌ Error leyendo loyalty_wallets:", walletError.message)

        setWallet(walletData || {
          glow_points: 0, glow_points_earned: 0, glow_points_redeemed: 0,
          hair_points: 0, hair_points_earned: 0, hair_points_redeemed: 0,
          glow_level: 'Bronce', hair_level: 'Bronce'
        })

        // 3. Cargar Niveles y Catálogo de Premios filtrando por tenant_id si está presente
        const queryGlowLevels = supabase.from('vip_levels').select('*').eq('wallet_type', 'glow').eq('is_active', true)
        const queryHairLevels = supabase.from('vip_levels').select('*').eq('wallet_type', 'hair').eq('is_active', true)
        const queryGlowRewards = supabase.from('reward_catalog').select('*').eq('wallet_type', 'glow').eq('is_active', true)
        const queryHairRewards = supabase.from('reward_catalog').select('*').eq('wallet_type', 'hair').eq('is_active', true)

        if (tenantId) {
          queryGlowLevels.eq('tenant_id', tenantId)
          queryHairLevels.eq('tenant_id', tenantId)
          queryGlowRewards.eq('tenant_id', tenantId)
          queryHairRewards.eq('tenant_id', tenantId)
        }

        const [gLvResponse, hLvResponse, gRwResponse, hRwResponse] = await Promise.all([
          queryGlowLevels.order('min_points', { ascending: true }),
          queryHairLevels.order('min_points', { ascending: true }),
          queryGlowRewards.order('points_required', { ascending: true }),
          queryHairRewards.order('points_required', { ascending: true })
        ])

        setGlowLevels(gLvResponse.data || [])
        setHairLevels(hLvResponse.data || [])
        setGlowRewards(gRwResponse.data || [])
        setHairRewards(hRwResponse.data || [])
      }
      
    } catch (error) {
      console.error('❌ Error en carga VIP:', error)
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
    if (!selectedReward || !clientId || !tenantId) return
    try {
      const { data, error } = await supabase.rpc('redeem_reward', {
        p_client_id: clientId, // Enviamos el ID interno correcto
        p_tenant_id: tenantId,
        p_reward_id: selectedReward.id,
        p_wallet_type: activeTab
      })
      if (error) throw error
      setGeneratedCode(data)
      confetti({ particleCount: 120, spread: 60, origin: { y: 0.7 } })
      fetchVIPData()
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
      <div className="flex h-96 flex-col items-center justify-center space-y-3">
        <div className="relative">
          <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-10 h-10 border-4 border-pink-500/20 rounded-full animate-ping"></div>
        </div>
        <span className="text-[10px] font-mono tracking-widest uppercase font-black text-pink-500 animate-pulse">Sincronizando puntos...</span>
      </div>
    )
  }

  return (
    <div className={`w-full max-w-5xl mx-auto p-4 md:p-6 antialiased selection:bg-pink-500/20 relative min-h-[60vh] space-y-6 transition-colors duration-500 overflow-x-hidden ${
      isDark ? 'text-stone-200' : 'text-stone-800'
    }`}>

      <div className="absolute top-[-5%] left-1/3 w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none bg-pink-500/[0.03]" />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes customFadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes customSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .custom-animate-fade { animation: customFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-animate-slide { animation: customSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />

      {/* HEADER */}
      <div className={`relative overflow-hidden rounded-3xl border p-6 shadow-xl custom-animate-fade ${
        isDark 
          ? 'bg-gradient-to-br from-stone-950 via-pink-950/10 to-neutral-950 border-pink-950/30' 
          : 'bg-gradient-to-br from-stone-900 via-pink-600 to-violet-500 border-pink-100'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-pulse" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className={`text-[9px] uppercase tracking-[0.25em] font-mono flex items-center gap-2 ${isDark ? 'text-pink-400' : 'text-pink-100'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              👑 Club VIP Elite
            </p>
            <h2 className="text-2xl font-black text-white tracking-tight mt-1">
              Tu Pasaporte de <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-violet-200 to-white">Beneficios</span>
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-pink-100/90'}`}>
              Descubre tus premios disponibles y las metas de los siguientes rangos exclusivos.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-3 py-1.5 rounded-xl border text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 ${
              isDark 
                ? 'bg-pink-500/10 border-pink-500/30 text-pink-400' 
                : 'bg-white/90 border-pink-100 text-stone-800 shadow-sm'
            }`}>
              <Gem className="w-3 h-3 text-pink-500" />
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
                  ? 'bg-stone-900 text-pink-400 border border-stone-800 shadow-md' 
                  : 'bg-white text-pink-600 border border-stone-200 shadow-md'
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
                  ? 'bg-stone-900 text-violet-400 border border-stone-800 shadow-md' 
                  : 'bg-white text-violet-600 border border-stone-200 shadow-md'
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
            ? 'bg-gradient-to-br from-stone-900/40 to-stone-950/40 border-stone-900 shadow-[0_20px_40px_rgba(0,0,0,0.3)]' 
            : 'bg-gradient-to-br from-white to-stone-50 border-pink-100'
        }`}>
          <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-5 dark:opacity-[0.08] pointer-events-none transition-all duration-700 group-hover:scale-125 ${
            activeTab === 'glow' ? 'bg-pink-500' : 'bg-violet-500'
          }`} />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <span className={`text-[10px] uppercase font-mono font-black tracking-widest block ${
                isDark ? 'text-stone-500' : 'text-stone-400'
              }`}>Puntaje Disponible</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-black tracking-tight ${
                  activeTab === 'glow'
                    ? isDark ? 'text-pink-400' : 'text-pink-600'
                    : isDark ? 'text-violet-400' : 'text-violet-600'
                }`}>
                  {currentPoints}
                </span>
                <span className={`text-xs font-mono font-black uppercase ${
                  activeTab === 'glow' 
                    ? 'text-pink-500/70'
                    : 'text-violet-500/70'
                }`}>Puntos</span>
              </div>
            </div>

            <div className={`flex items-center gap-3 border p-3 rounded-2xl shrink-0 w-full sm:w-auto ${
              isDark ? 'bg-stone-950/60 border-stone-900' : 'bg-stone-50 border-pink-50'
            }`}>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl shadow-sm ${
                isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-pink-100'
              }`}>
                {currentInfo.current?.emoji || '🥉'}
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400">Tu Rango VIP</p>
                <p className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>{currentLevelName}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className={`w-full h-2 border rounded-full overflow-hidden p-[2px] shadow-inner ${
              isDark ? 'bg-stone-950/80 border-stone-900' : 'bg-stone-100 border-pink-100/60'
            }`}>
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  activeTab === 'glow' 
                    ? 'bg-gradient-to-r from-pink-500 to-pink-300' 
                    : 'bg-gradient-to-r from-violet-500 to-violet-300'
                }`} 
                style={{ width: `${currentInfo.progress}%` }} 
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-stone-400">
              {currentInfo.next ? (
                <>
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-pink-400" /> Progreso de Nivel</span>
                  <span>Faltan <strong className={`font-bold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{currentInfo.needed} pts</strong> para {currentInfo.next.name}</span>
                </>
              ) : (
                <span className="text-pink-500 dark:text-pink-400 font-black flex items-center gap-1.5 w-full justify-center py-0.5 uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5" /> ¡Nivel máximo alcanzado!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ESCALAFÓN DEL CLUB */}
        {currentLevels.length > 0 && (
          <div className={`border rounded-2xl p-4 space-y-3 custom-animate-slide ${
            isDark ? 'bg-stone-900/20 border-stone-900' : 'bg-stone-50/50 border-pink-100/40'
          }`}>
            <p className="text-[9px] uppercase font-mono font-black tracking-widest text-stone-400 px-1">Escalafón del Club Exclusive</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {currentLevels.map((lvl) => {
                const isCurrent = lvl.name.toLowerCase() === currentLevelName.toLowerCase()
                const isPassed = currentPoints >= lvl.min_points
                return (
                  <div 
                    key={lvl.id} 
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isCurrent 
                        ? 'bg-pink-500/5 border-pink-500/40 shadow-sm ring-1 ring-pink-500/20'
                        : isPassed 
                          ? isDark ? 'bg-stone-950/20 border-stone-900 opacity-75' : 'bg-stone-100/40 border-pink-50/60 opacity-75'
                          : 'opacity-40 border-transparent bg-stone-500/[0.02]'
                    }`}
                  >
                    <span className="text-lg block mb-1">{lvl.emoji}</span>
                    <p className={`text-xs font-black tracking-tight ${
                      isCurrent 
                        ? 'text-pink-500'
                        : isDark ? 'text-stone-300' : 'text-stone-700'
                    }`}>{lvl.name}</p>
                    <p className="text-[9px] font-mono mt-0.5 text-stone-500">{lvl.min_points} pts</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* CATÁLOGO DE PREMIOS */}
        <div className="space-y-4 pt-2 custom-animate-slide">
          <div className="flex items-center gap-2 px-1">
            <Gift className="w-4 h-4 text-pink-500" />
            <h3 className="text-[10px] uppercase font-mono font-black tracking-widest text-stone-400">Catálogo de Premios</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentRewards.length === 0 ? (
              <div className={`col-span-full p-8 text-center border border-dashed rounded-2xl ${
                isDark ? 'border-stone-900 bg-stone-900/10 text-stone-500' : 'border-pink-100 bg-white text-stone-400'
              }`}>
                <p className="text-xs font-mono mb-1">No hay premios asignados para tu catálogo todavía.</p>
                <p className="text-[10px] text-stone-500">Asegúrate de que las filas de `reward_catalog` tengan cargado el wallet_type correspondiente.</p>
              </div>
            ) : (
              currentRewards.map((r) => {
                const lockedByTier = isTierLocked(r.tier, currentLevels, currentLevelName)
                const canAfford = currentPoints >= r.points_required && !lockedByTier

                return (
                  <div 
                    key={r.id} 
                    className={`group relative p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-4 bg-white dark:bg-stone-900/20 backdrop-blur-sm ${
                      lockedByTier 
                        ? 'border-stone-900/40 bg-stone-950/5 opacity-50 shadow-inner'
                        : canAfford 
                          ? isDark ? 'border-stone-900 hover:border-pink-500/20 shadow-sm hover:shadow-md' : 'border-pink-100/80 hover:border-pink-300 shadow-sm hover:shadow-md'
                          : 'border-stone-200/40 opacity-75'
                    }`}
                  >
                    {lockedByTier && (
                      <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] font-mono font-black border shadow-sm z-10 ${
                        isDark ? 'bg-stone-900 border-stone-800 text-stone-400' : 'bg-stone-100 border-stone-200 text-stone-500'
                      }`}>
                        <Lock className="w-2.5 h-2.5 text-pink-500" /> Rango {r.tier}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-sm font-black tracking-tight transition-colors flex items-center gap-1 ${
                          lockedByTier 
                            ? 'text-stone-500 line-through'
                            : isDark ? 'text-stone-100 group-hover:text-pink-400' : 'text-stone-900 group-hover:text-pink-600'
                        }`}>
                          {r.name}
                        </p>
                        {!lockedByTier && r.discount_percentage > 0 && (
                          <span className="text-[9px] font-mono font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md border border-rose-500/20 shrink-0">
                            -{r.discount_percentage}% OFF
                          </span>
                        )}
                      </div>
                      <p className={`text-xs leading-normal line-clamp-2 ${
                        lockedByTier ? 'text-stone-500/40' : 'text-stone-500 dark:text-stone-400'
                      }`}>{r.description || 'Ritual exclusivo VIP de alta gama.'}</p>
                    </div>

                    <div className={`flex items-center justify-between pt-3 border-t mt-auto ${
                      isDark ? 'border-stone-900/60' : 'border-stone-100'
                    }`}>
                      <div className="flex flex-col">
                        <span className={`text-xs font-mono font-black ${
                          lockedByTier 
                            ? 'text-stone-500'
                            : activeTab === 'glow' ? 'text-pink-500' : 'text-violet-500'
                        }`}>{r.points_required} PTS</span>
                        <span className="text-[8px] font-mono uppercase tracking-wider text-stone-500">Nivel: {r.tier}</span>
                      </div>

                      {lockedByTier ? (
                        <span className={`text-[9px] font-mono uppercase tracking-wider font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-xl border ${
                          isDark ? 'text-stone-600 bg-stone-900/60 border-stone-800' : 'text-stone-400 bg-stone-50 border-stone-200'
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
                              : 'bg-stone-100 dark:bg-stone-900/40 text-stone-400 dark:text-stone-600 border-stone-200 dark:border-stone-800 cursor-not-allowed'
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
          <div className={`border rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden transition-all duration-500 border-t-pink-500/30 ${
            isDark ? 'bg-stone-950 border-stone-900' : 'bg-white border-pink-100'
          }`}>

            {!generatedCode ? (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 border border-pink-500/20 bg-pink-500/10 text-pink-500 rounded-full flex items-center justify-center mx-auto">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-black text-base tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>¿Confirmar Canje?</h4>
                  <p className="text-xs mt-1 text-stone-500 dark:text-stone-400">
                    Canjearás <strong className="font-mono text-pink-500">{selectedReward.points_required} puntos</strong> por:
                  </p>
                  <p className={`text-xs font-bold mt-3 p-3 rounded-xl border ${
                    isDark ? 'text-pink-400 bg-stone-900 border-stone-800' : 'text-pink-700 bg-pink-50/40 border-pink-100'
                  }`}>{selectedReward.name}</p>
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button onClick={() => setShowRedeemModal(false)} className={`flex-1 py-2.5 border text-xs rounded-xl font-bold transition-colors ${
                    isDark ? 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800' : 'bg-stone-100 border-stone-200 text-stone-500 hover:bg-stone-200'
                  }`}>Cancelar</button>
                  <button onClick={requestRedeem} className={`flex-1 py-2.5 text-xs font-black rounded-xl shadow-lg ${
                    isDark ? 'bg-white text-black hover:bg-stone-100' : 'bg-stone-900 text-white hover:bg-stone-800'
                  }`}>Confirmar</button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 text-center">
                <div className="w-12 h-12 border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-black text-base tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>¡Premio Canjeado!</h4>
                  <p className="text-[11px] mt-1 text-stone-500 dark:text-stone-400">
                    Presenta este código en recepción.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl inline-block shadow-md border mx-auto ${
                  isDark ? 'bg-stone-950 border-stone-900' : 'bg-white border-pink-50'
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
                  isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-50 border-stone-200'
                }`}>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-stone-400">Código</span>
                  <span className={`font-black tracking-widest text-sm ${isDark ? 'text-white' : 'text-stone-900'}`}>{generatedCode}</span>
                  <button 
                    type="button"
                    onClick={() => copyToClipboard(generatedCode)} 
                    className="p-1.5 rounded-lg transition-all hover:bg-stone-500/10 text-stone-400 hover:text-stone-200"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button 
                  onClick={() => { setShowRedeemModal(false); setGeneratedCode(null); }} 
                  className={`w-full py-2.5 text-xs rounded-xl font-black transition-colors ${
                    isDark ? 'bg-stone-800 text-stone-200 hover:bg-stone-700' : 'bg-stone-900 text-white hover:bg-stone-800'
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