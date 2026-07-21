// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Crown, Gift, Check, ArrowUpRight, Sparkles, Scissors, 
  Ticket, Copy, ShieldCheck, Award, TrendingUp, Lock,
  Gem, Star, Zap, Wallet, ChevronRight, 
  Diamond, PartyPopper, Medal, Flame, Compass, Heart
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
        p_client_id: clientId,
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
              CLUB VIP ELITE
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

  return (
    <div className={`w-full max-w-5xl mx-auto p-4 md:p-6 pb-16 antialiased selection:bg-pink-500/20 min-h-[60vh] space-y-8 transition-colors duration-700 overflow-x-hidden ${
      isDark ? 'bg-gradient-to-b from-[#09090b] via-[#0d0d12] to-[#09090b] text-stone-200' : 'bg-gradient-to-b from-stone-50 via-white to-stone-50/30 text-stone-800'
    }`}>

      {/* Efectos de fondo */}
      <div className="absolute top-[-5%] left-1/3 w-[400px] h-[400px] rounded-full blur-[160px] pointer-events-none bg-pink-500/[0.03]" />
      <div className="absolute bottom-[-5%] right-1/3 w-[300px] h-[300px] rounded-full blur-[140px] pointer-events-none bg-amber-500/[0.02]" />

      {/* ============================================================ */}
      {/* HEADER — PRESTIGE EDITION */}
      {/* ============================================================ */}
      <div className={`relative overflow-hidden rounded-[2.5rem] border p-7 md:p-10 shadow-2xl transition-all duration-500 ${
        isDark 
          ? 'bg-gradient-to-br from-zinc-950 via-zinc-900/60 to-black border-zinc-900/60 shadow-[0_20px_60px_rgba(0,0,0,0.6)]' 
          : 'bg-gradient-to-br from-stone-900 via-stone-950 to-rose-950 border-stone-800/50 shadow-[0_20px_60px_rgba(219,91,154,0.12)]'
      }`}>
        {/* Efectos de luz ambiental */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none animate-[pulse_10s_ease-in-out_infinite] delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Rejilla decorativa */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_transparent_0%,_white_100%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full backdrop-blur-xl border ${
              isDark ? 'bg-pink-500/10 border-pink-500/20' : 'bg-white/20 border-white/30'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className={`text-[8px] uppercase tracking-[0.25em] font-black ${
                isDark ? 'text-pink-300' : 'text-white'
              }`}>
                👑 Club VIP Elite
              </span>
            </div>

            <h2 className={`text-3xl md:text-5xl font-black tracking-tight leading-[1.1] ${
              isDark ? 'text-white' : 'text-white'
            }`}>
              Tu Pasaporte de{' '}
              <span className="font-serif italic font-light text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-amber-200 to-white bg-[length:200%_auto] animate-[gradient_4s_ease-in-out_infinite]">
                Beneficios
              </span>
            </h2>
            <p className={`text-xs font-medium tracking-wide ${
              isDark ? 'text-stone-400' : 'text-pink-100/90'
            }`}>
              Descubre tus premios disponibles y las metas de los siguientes rangos exclusivos.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-4 py-2.5 rounded-xl border text-[9px] font-mono font-black uppercase tracking-[0.15em] flex items-center gap-2 backdrop-blur-md shadow-lg ${
              isDark ? 'bg-stone-900/80 border-stone-800/80 text-stone-400' : 'bg-white/90 border-pink-100/80 text-stone-800 shadow-pink-200/20'
            }`}>
              <Gem className={`w-3.5 h-3.5 ${
                activeTab === 'glow' ? 'text-pink-400' : 'text-violet-400'
              }`} />
              {activeTab === 'glow' ? 'Glow' : 'Hair'} Points
            </span>
          </div>
        </div>

        {/* Decoración esquina */}
        <div className="absolute bottom-5 right-8 opacity-10 text-white text-[10px] font-black tracking-[0.3em] select-none pointer-events-none">
          ✦ VIP ✦
        </div>
      </div>

      {/* ============================================================ */}
      {/* SELECTOR DE SUB-SISTEMAS — REDISEÑADO */}
      {/* ============================================================ */}
      <div className={`flex border rounded-2xl p-1.5 shadow-xl max-w-md ${
        isDark ? 'bg-stone-900/40 border-stone-900/60' : 'bg-stone-100/80 border-stone-200/60'
      }`}>
        <button 
          onClick={() => { setActiveTab('glow'); setGeneratedCode(null); }} 
          className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-[0.15em] transition-all duration-500 flex items-center justify-center gap-2.5 ${
            activeTab === 'glow' 
              ? isDark 
                ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-400 border border-pink-500/30 shadow-lg scale-[1.02]' 
                : 'bg-white text-pink-600 border border-pink-200 shadow-md'
              : isDark 
                ? 'text-stone-500 hover:text-stone-200' 
                : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Estética & Glow
        </button>
        <button 
          onClick={() => { setActiveTab('hair'); setGeneratedCode(null); }} 
          className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-[0.15em] transition-all duration-500 flex items-center justify-center gap-2.5 ${
            activeTab === 'hair' 
              ? isDark 
                ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-400 border border-violet-500/30 shadow-lg scale-[1.02]' 
                : 'bg-white text-violet-600 border border-violet-200 shadow-md'
              : isDark 
                ? 'text-stone-500 hover:text-stone-200' 
                : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Scissors className="w-4 h-4" /> Peluquería Crew
        </button>
      </div>

      {/* ============================================================ */}
      {/* TARJETA DE BALANCE VIP — REDISEÑADA */}
      {/* ============================================================ */}
      <div className={`relative overflow-hidden rounded-[2.5rem] border p-7 md:p-10 shadow-2xl transition-all duration-500 hover:shadow-3xl ${
        isDark 
          ? 'bg-gradient-to-br from-stone-900/60 via-stone-900/30 to-stone-950/60 border-stone-900/60 shadow-black/40' 
          : 'bg-gradient-to-br from-white via-stone-50/80 to-white border-stone-200/50 shadow-stone-300/30'
      }`}>
        {/* Efecto de fondo */}
        <div className={`absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none transition-all duration-1000 ${
          activeTab === 'glow' 
            ? 'bg-pink-500/5' 
            : 'bg-violet-500/5'
        }`} />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <span className={`text-[9px] uppercase font-mono font-black tracking-[0.2em] block ${
              isDark ? 'text-stone-500' : 'text-stone-400'
            }`}>
              Puntaje Disponible
            </span>
            <div className="flex items-baseline gap-3">
              <span className={`text-6xl md:text-7xl font-black tracking-tight ${
                activeTab === 'glow'
                  ? isDark ? 'text-pink-400' : 'text-pink-600'
                  : isDark ? 'text-violet-400' : 'text-violet-600'
              }`}>
                {currentPoints}
              </span>
              <span className={`text-xs font-mono font-black uppercase tracking-[0.15em] ${
                activeTab === 'glow' 
                  ? isDark ? 'text-pink-500/60' : 'text-pink-400'
                  : isDark ? 'text-violet-500/60' : 'text-violet-400'
              }`}>
                Puntos
              </span>
            </div>
          </div>

          {/* Badge de nivel */}
          <div className={`flex items-center gap-4 border p-4 rounded-2xl shadow-lg ${
            isDark ? 'bg-stone-950/60 border-stone-800/60' : 'bg-stone-50 border-stone-200/60'
          }`}>
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-sm ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}>
              {currentInfo.current?.emoji || '🥉'}
            </div>
            <div>
              <p className={`text-[8px] font-mono uppercase tracking-[0.25em] ${
                isDark ? 'text-stone-500' : 'text-stone-400'
              }`}>
                Tu Rango VIP
              </p>
              <p className={`text-lg font-black tracking-tight ${
                isDark ? 'text-white' : 'text-stone-900'
              }`}>
                {currentLevelName}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-6 space-y-2">
          <div className={`w-full h-2.5 rounded-full overflow-hidden p-[2px] shadow-inner ${
            isDark ? 'bg-stone-950/80 border border-stone-900/60' : 'bg-stone-100 border border-stone-200/60'
          }`}>
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                activeTab === 'glow' 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500' 
                  : 'bg-gradient-to-r from-violet-500 to-purple-500'
              }`} 
              style={{ width: `${Math.min(currentInfo.progress, 100)}%` }} 
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono">
            {currentInfo.next ? (
              <>
                <span className={`flex items-center gap-1.5 ${
                  isDark ? 'text-stone-500' : 'text-stone-400'
                }`}>
                  <TrendingUp className={`w-3 h-3 ${
                    activeTab === 'glow' ? 'text-pink-400' : 'text-violet-400'
                  }`} /> 
                  Progreso de Nivel
                </span>
                <span className={`font-medium ${
                  isDark ? 'text-stone-300' : 'text-stone-700'
                }`}>
                  Faltan <strong className={`font-black ${
                    activeTab === 'glow' ? 'text-pink-500' : 'text-violet-500'
                  }`}>{currentInfo.needed} pts</strong> para {currentInfo.next.name}
                </span>
              </>
            ) : (
              <span className={`font-black flex items-center gap-2 w-full justify-center py-1 uppercase tracking-wider ${
                activeTab === 'glow' ? 'text-pink-500' : 'text-violet-500'
              }`}>
                <Award className="w-4 h-4" /> ¡Nivel máximo alcanzado!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ESCALAFÓN DEL CLUB — REDISEÑADO */}
      {/* ============================================================ */}
      {currentLevels.length > 0 && (
        <div className={`border rounded-2xl p-5 space-y-4 shadow-lg transition-all duration-500 ${
          isDark ? 'bg-stone-900/30 border-stone-900/60 shadow-black/20' : 'bg-stone-50/80 border-stone-200/60 shadow-stone-200/20'
        }`}>
          <p className={`text-[8px] uppercase font-mono font-black tracking-[0.3em] px-1 ${
            isDark ? 'text-stone-500' : 'text-stone-400'
          }`}>
            Escalafón del Club Exclusive
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {currentLevels.map((lvl) => {
              const isCurrent = lvl.name.toLowerCase() === currentLevelName.toLowerCase()
              const isPassed = currentPoints >= lvl.min_points
              return (
                <div 
                  key={lvl.id} 
                  className={`p-4 rounded-xl border text-center transition-all duration-500 ${
                    isCurrent 
                      ? `bg-gradient-to-br ${activeTab === 'glow' ? 'from-pink-500/10 to-rose-500/5' : 'from-violet-500/10 to-purple-500/5'} border-${activeTab === 'glow' ? 'pink' : 'violet'}-500/40 shadow-lg ring-1 ring-${activeTab === 'glow' ? 'pink' : 'violet'}-500/20 scale-[1.02]`
                      : isPassed 
                        ? isDark ? 'bg-stone-950/20 border-stone-900/60 opacity-75' : 'bg-stone-100/40 border-stone-200/60 opacity-75'
                        : 'opacity-40 border-transparent bg-stone-500/[0.02]'
                  }`}
                >
                  <span className="text-2xl block mb-1">{lvl.emoji}</span>
                  <p className={`text-xs font-black tracking-tight ${
                    isCurrent 
                      ? activeTab === 'glow' ? 'text-pink-500' : 'text-violet-500'
                      : isDark ? 'text-stone-300' : 'text-stone-700'
                  }`}>{lvl.name}</p>
                  <p className={`text-[8px] font-mono mt-0.5 ${
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  }`}>{lvl.min_points} pts</p>
                  {isCurrent && (
                    <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1.5 animate-pulse ${
                      activeTab === 'glow' ? 'bg-pink-500' : 'bg-violet-500'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CATÁLOGO DE PREMIOS — REDISEÑADO */}
      {/* ============================================================ */}
      <div className="space-y-5 pt-2">
        <div className="flex items-center gap-3 px-1">
          <div className={`p-2 rounded-xl ${
            isDark ? 'bg-pink-500/10' : 'bg-pink-100/50'
          }`}>
            <Gift className={`w-4 h-4 ${
              isDark ? 'text-pink-400' : 'text-pink-600'
            }`} />
          </div>
          <h3 className={`text-[9px] uppercase font-mono font-black tracking-[0.25em] ${
            isDark ? 'text-stone-400' : 'text-stone-500'
          }`}>
            Catálogo de Premios
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentRewards.length === 0 ? (
            <div className={`col-span-full p-12 text-center border border-dashed rounded-2xl transition-all duration-500 ${
              isDark ? 'border-stone-800/60 bg-stone-900/20 text-stone-500' : 'border-stone-200/60 bg-white/40 text-stone-400'
            }`}>
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                isDark ? 'bg-stone-800/50' : 'bg-stone-100'
              }`}>
                <Gift className={`w-8 h-8 ${
                  isDark ? 'text-stone-600' : 'text-stone-400'
                }`} />
              </div>
              <p className="text-sm font-medium">No hay premios disponibles</p>
              <p className="text-xs mt-1 text-stone-400">Vuelve pronto para descubrir nuevas recompensas</p>
            </div>
          ) : (
            currentRewards.map((r, index) => {
              const lockedByTier = isTierLocked(r.tier, currentLevels, currentLevelName)
              const canAfford = currentPoints >= r.points_required && !lockedByTier

              return (
                <motion.div 
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className={`group relative p-5 rounded-2xl border transition-all duration-500 flex flex-col justify-between gap-4 ${
                    lockedByTier 
                      ? isDark ? 'bg-stone-900/20 border-stone-900/60 opacity-50' : 'bg-stone-50/50 border-stone-200/60 opacity-50'
                      : canAfford 
                        ? isDark ? 'bg-stone-900/40 border-stone-900/60 hover:border-pink-500/30 hover:shadow-2xl shadow-lg' : 'bg-white border-stone-200/50 hover:border-pink-300/50 hover:shadow-2xl shadow-md'
                        : isDark ? 'bg-stone-900/20 border-stone-900/60 opacity-75' : 'bg-stone-50/50 border-stone-200/60 opacity-75'
                  }`}
                >
                  {/* Gradiente de fondo sutil */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-pink-500/[0.03] to-rose-500/[0.01] rounded-2xl" />

                  {lockedByTier && (
                    <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[7px] font-mono font-black border shadow-sm z-10 ${
                      isDark ? 'bg-stone-900 border-stone-800 text-stone-400' : 'bg-stone-100 border-stone-200 text-stone-500'
                    }`}>
                      <Lock className="w-2.5 h-2.5 text-pink-500" /> Rango {r.tier}
                    </div>
                  )}

                  <div className="space-y-2 relative z-10">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`font-black text-sm tracking-tight transition-colors flex items-center gap-1.5 ${
                        lockedByTier 
                          ? 'text-stone-500 line-through'
                          : isDark ? 'text-stone-100 group-hover:text-pink-400' : 'text-stone-900 group-hover:text-pink-600'
                      }`}>
                        {r.name}
                      </p>
                      {!lockedByTier && r.discount_percentage > 0 && (
                        <span className={`text-[8px] font-mono font-black px-2.5 py-1 rounded-full border shadow-sm shrink-0 ${
                          isDark 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                        }`}>
                          -{r.discount_percentage}% OFF
                        </span>
                      )}
                    </div>
                    <p className={`text-xs leading-relaxed line-clamp-2 ${
                      lockedByTier ? 'text-stone-500/40' : isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}>
                      {r.description || 'Ritual exclusivo VIP de alta gama.'}
                    </p>
                  </div>

                  <div className={`flex items-center justify-between pt-3 border-t relative z-10 ${
                    isDark ? 'border-stone-800/60' : 'border-stone-200/60'
                  }`}>
                    <div className="flex flex-col">
                      <span className={`text-xs font-mono font-black ${
                        lockedByTier 
                          ? 'text-stone-500'
                          : activeTab === 'glow' ? 'text-pink-500' : 'text-violet-500'
                      }`}>
                        {r.points_required} PTS
                      </span>
                      <span className={`text-[7px] font-mono uppercase tracking-[0.15em] ${
                        isDark ? 'text-stone-500' : 'text-stone-400'
                      }`}>
                        Nivel: {r.tier}
                      </span>
                    </div>

                    {lockedByTier ? (
                      <span className={`text-[8px] font-mono uppercase tracking-[0.15em] font-black flex items-center gap-1 px-3 py-1.5 rounded-xl border ${
                        isDark ? 'text-stone-600 bg-stone-900/60 border-stone-800' : 'text-stone-400 bg-stone-50 border-stone-200'
                      }`}>
                        Bloqueado
                      </span>
                    ) : (
                      <button 
                        disabled={!canAfford} 
                        onClick={() => { setSelectedReward(r); setShowRedeemModal(true); }} 
                        className={`px-4 py-2 text-[9px] font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-300 border active:scale-95 flex items-center gap-1.5 shadow-lg hover:scale-105 ${
                          canAfford 
                            ? isDark 
                              ? 'bg-white text-black border-white hover:bg-stone-100 shadow-white/10' 
                              : 'bg-stone-900 text-white border-stone-900 hover:bg-stone-800 shadow-stone-900/20'
                            : isDark
                              ? 'bg-stone-900/40 text-stone-600 border-stone-800 cursor-not-allowed'
                              : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                        }`}
                      >
                        {currentPoints >= r.points_required ? (
                          <>
                            <PartyPopper className="w-3 h-3" /> Canjear
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" /> Faltan Puntos
                          </>
                        )}
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL DE CANJE — REDISEÑADO */}
      {/* ============================================================ */}
      {showRedeemModal && selectedReward && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50"
            onClick={() => { setShowRedeemModal(false); setGeneratedCode(null); }}
          >
            <motion.div 
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`relative w-full max-w-md rounded-3xl border p-7 shadow-2xl overflow-hidden transition-all duration-500 ${
                isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-white border-pink-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Línea superior decorativa */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                activeTab === 'glow' 
                  ? 'from-pink-500 via-rose-500 to-pink-500' 
                  : 'from-violet-500 via-purple-500 to-violet-500'
              }`} />

              <button 
                onClick={() => { setShowRedeemModal(false); setGeneratedCode(null); }} 
                className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                  isDark ? 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              {!generatedCode ? (
                <div className="space-y-5 text-center pt-2">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border shadow-lg ${
                    isDark ? 'bg-pink-500/10 border-pink-500/20 shadow-pink-500/5' : 'bg-pink-50 border-pink-200 shadow-pink-200/30'
                  }`}>
                    <Ticket className={`w-7 h-7 ${
                      isDark ? 'text-pink-400' : 'text-pink-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className={`text-xl font-black tracking-tight ${
                      isDark ? 'text-white' : 'text-stone-900'
                    }`}>
                      ¿Confirmar Canje?
                    </h4>
                    <p className={`text-sm mt-1.5 ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}>
                      Canjearás <strong className={`font-mono ${
                        activeTab === 'glow' ? 'text-pink-500' : 'text-violet-500'
                      }`}>{selectedReward.points_required} puntos</strong> por:
                    </p>
                    <div className={`mt-4 p-4 rounded-xl border shadow-sm ${
                      isDark ? 'bg-stone-900/40 border-stone-800/60' : 'bg-stone-50/80 border-stone-200/60'
                    }`}>
                      <p className={`font-black text-sm ${
                        isDark ? 'text-pink-400' : 'text-pink-700'
                      }`}>
                        {selectedReward.name}
                      </p>
                      {selectedReward.discount_percentage > 0 && (
                        <p className={`text-xs mt-0.5 ${
                          isDark ? 'text-stone-400' : 'text-stone-500'
                        }`}>
                          {selectedReward.discount_percentage}% de descuento
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => { setShowRedeemModal(false); setGeneratedCode(null); }} 
                      className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 border ${
                        isDark 
                          ? 'border-stone-800/60 text-stone-400 hover:bg-stone-800/50' 
                          : 'border-stone-200/60 text-stone-500 hover:bg-stone-50'
                      }`}
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={requestRedeem} 
                      className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                        isDark 
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/30' 
                          : 'bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/30'
                      }`}
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 text-center pt-2">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border shadow-lg ${
                    isDark ? 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5' : 'bg-emerald-50 border-emerald-200 shadow-emerald-200/30'
                  }`}>
                    <ShieldCheck className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className={`text-xl font-black tracking-tight ${
                      isDark ? 'text-white' : 'text-stone-900'
                    }`}>
                      ¡Premio Canjeado! 🎉
                    </h4>
                    <p className={`text-sm mt-1.5 ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}>
                      Presenta este código en recepción.
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl inline-block shadow-xl border mx-auto ${
                    isDark ? 'bg-stone-950 border-stone-900' : 'bg-white border-stone-200'
                  }`}>
                    <QRCodeSVG 
                      value={generatedCode.toUpperCase().trim()} 
                      size={180}
                      level="H"
                      bgColor={isDark ? '#0a0908' : '#FFFFFF'}
                      fgColor={isDark ? '#FFFFFF' : '#000000'}
                    />
                  </div>

                  <div className={`flex items-center justify-between border px-4 py-3 rounded-xl font-mono text-xs max-w-xs mx-auto shadow-inner ${
                    isDark ? 'bg-stone-900/40 border-stone-800/60' : 'bg-stone-50 border-stone-200/60'
                  }`}>
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${
                      isDark ? 'text-stone-500' : 'text-stone-400'
                    }`}>
                      Código
                    </span>
                    <span className={`font-black tracking-widest text-sm ${
                      isDark ? 'text-white' : 'text-stone-900'
                    }`}>
                      {generatedCode}
                    </span>
                    <button 
                      type="button"
                      onClick={() => copyToClipboard(generatedCode)} 
                      className={`p-1.5 rounded-lg transition-all duration-300 hover:scale-110 ${
                        isDark ? 'text-stone-400 hover:text-stone-200' : 'text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <button 
                    onClick={() => { setShowRedeemModal(false); setGeneratedCode(null); }} 
                    className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 hover:scale-105 active:scale-95 ${
                      isDark 
                        ? 'bg-stone-800 text-stone-200 hover:bg-stone-700' 
                        : 'bg-stone-900 text-white hover:bg-stone-800'
                    }`}
                  >
                    Finalizar
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ============================================================ */}
      {/* STYLES GLOBALES */}
      {/* ============================================================ */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}