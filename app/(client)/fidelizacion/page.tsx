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
  Diamond, PartyPopper, Medal, Flame, Compass, Heart,
  X
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { QRCodeSVG } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'

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

const VIPLoadingSpinner = ({ isDark }: { isDark: boolean }) => (
  <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-500 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-16 h-16">
        <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
        <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
      </div>
      <p className={`text-[10px] tracking-[0.4em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]/60'}`}>
        Cargando Club VIP Elite...
      </p>
    </div>
  </div>
)

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

      const { data: clienteData, error: clienteError } = await supabase
        .from('clients')
        .select('id')
        .eq('auth_user_id', user?.id)
        .maybeSingle()

      if (clienteError) console.error("❌ Error leyendo cliente:", clienteError.message)

      if (clienteData) {
        const activeClientId = clienteData.id
        setClientId(activeClientId)

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
    return <VIPLoadingSpinner isDark={isDark} />
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-16 relative overflow-x-hidden ${
      isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'
    }`}>
      {/* Fondo texturizado */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-5xl mx-auto px-4 space-y-8 relative z-10">

        {/* ============================================================ */}
        {/* HEADER — PRESTIGE EDITION */}
        {/* ============================================================ */}
        <div className={`relative overflow-hidden rounded-2xl border p-7 md:p-10 shadow-lg transition-all duration-300 mt-4 ${
          isDark 
            ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_15px_35px_rgba(0,0,0,0.3)]' 
            : 'bg-white border-[#F0E4DA] shadow-[0_15px_35px_rgba(240,228,218,0.6)]'
        }`}>
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute -bottom-32 left-1/4 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none animate-[pulse_10s_ease-in-out_infinite] delay-1000" />
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_transparent_0%,_white_100%)] pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full backdrop-blur-xl border ${
                isDark ? 'bg-[#D4AF37]/10 border-[#D4AF37]/20' : 'bg-[#D4AF37]/10 border-[#D4AF37]/20'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                <span className={`text-[8px] uppercase tracking-[0.25em] font-black ${
                  isDark ? 'text-[#D4AF37]' : 'text-[#D4AF37]'
                }`}>
                  👑 Club VIP Elite
                </span>
              </div>

              <h2 className={`text-3xl md:text-5xl font-black tracking-tight leading-[1.1] ${
                isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
              }`}>
                Tu Pasaporte de{' '}
                <span className="font-serif italic font-light text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#E8D5A0] to-[#D4AF37] bg-[length:200%_auto] animate-[gradient_4s_ease-in-out_infinite]">
                  Beneficios
                </span>
              </h2>
              <p className={`text-xs font-light tracking-wide ${
                isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
              }`}>
                Descubre tus premios disponibles y las metas de los siguientes rangos exclusivos.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-4 py-2.5 rounded-xl border text-[9px] font-mono font-black uppercase tracking-[0.15em] flex items-center gap-2 shadow-lg ${
                isDark 
                  ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588]' 
                  : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E]'
              }`}>
                <Gem className={`w-3.5 h-3.5 ${
                  activeTab === 'glow' ? 'text-[#D4AF37]' : 'text-[#D4AF37]'
                }`} />
                {activeTab === 'glow' ? 'Glow' : 'Hair'} Points
              </span>
            </div>
          </div>

          <div className="absolute bottom-5 right-8 opacity-10 text-[#D4AF37] text-[10px] font-black tracking-[0.3em] select-none pointer-events-none">
            ✦ VIP ✦
          </div>
        </div>

        {/* ============================================================ */}
        {/* SELECTOR DE SUB-SISTEMAS */}
        {/* ============================================================ */}
        <div className={`flex rounded-2xl p-1.5 shadow-lg max-w-md border ${
          isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
        }`}>
          <button 
            onClick={() => { setActiveTab('glow'); setGeneratedCode(null); }} 
            className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-[0.15em] transition-all duration-500 flex items-center justify-center gap-2.5 ${
              activeTab === 'glow' 
                ? isDark 
                  ? 'bg-[#D4AF37] text-[#1A0E0A] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' 
                  : 'bg-[#1A0E0A] text-[#FFF9F6] shadow-[0_4px_15px_rgba(26,14,10,0.15)]'
                : isDark 
                  ? 'text-[#A89588] hover:text-[#FFF9F6]' 
                  : 'text-[#5C4A3E] hover:text-[#1A0E0A]'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Estética & Glow
          </button>
          <button 
            onClick={() => { setActiveTab('hair'); setGeneratedCode(null); }} 
            className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-[0.15em] transition-all duration-500 flex items-center justify-center gap-2.5 ${
              activeTab === 'hair' 
                ? isDark 
                  ? 'bg-[#D4AF37] text-[#1A0E0A] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' 
                  : 'bg-[#1A0E0A] text-[#FFF9F6] shadow-[0_4px_15px_rgba(26,14,10,0.15)]'
                : isDark 
                  ? 'text-[#A89588] hover:text-[#FFF9F6]' 
                  : 'text-[#5C4A3E] hover:text-[#1A0E0A]'
            }`}
          >
            <Scissors className="w-4 h-4" /> Peluquería Crew
          </button>
        </div>

        {/* ============================================================ */}
        {/* TARJETA DE BALANCE VIP */}
        {/* ============================================================ */}
        <div className={`relative overflow-hidden rounded-2xl border p-7 md:p-10 shadow-lg transition-all duration-300 hover:shadow-xl ${
          isDark 
            ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_15px_35px_rgba(0,0,0,0.3)]' 
            : 'bg-white border-[#F0E4DA] shadow-[0_15px_35px_rgba(240,228,218,0.6)]'
        }`}>
          <div className={`absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none transition-all duration-1000 ${
            isDark ? 'bg-[#D4AF37]/5' : 'bg-[#D4AF37]/5'
          }`} />

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-2">
              <span className={`text-[9px] uppercase font-mono font-black tracking-[0.2em] block ${
                isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
              }`}>
                Puntaje Disponible
              </span>
              <div className="flex items-baseline gap-3">
                <span className={`font-serif text-6xl md:text-7xl font-light tracking-tight text-[#D4AF37]`}>
                  {currentPoints}
                </span>
                <span className={`text-xs font-mono font-black uppercase tracking-[0.15em] ${
                  isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                }`}>
                  Puntos
                </span>
              </div>
            </div>

            <div className={`flex items-center gap-4 border p-4 rounded-2xl shadow-sm ${
              isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
            }`}>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-sm ${
                isDark ? 'bg-[#3D281E] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
              }`}>
                {currentInfo.current?.emoji || '🥉'}
              </div>
              <div>
                <p className={`text-[8px] font-mono uppercase tracking-[0.25em] ${
                  isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                }`}>
                  Tu Rango VIP
                </p>
                <p className={`font-serif text-lg font-light ${
                  isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                }`}>
                  {currentLevelName}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className={`w-full h-2.5 rounded-full overflow-hidden p-[2px] shadow-inner ${
              isDark ? 'bg-[#1E120C] border border-[#3D281E]' : 'bg-[#FFF9F6] border border-[#F0E4DA]'
            }`}>
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out bg-[#D4AF37]" 
                style={{ width: `${Math.min(currentInfo.progress, 100)}%` }} 
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono">
              {currentInfo.next ? (
                <>
                  <span className={`flex items-center gap-1.5 ${
                    isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                  }`}>
                    <TrendingUp className="w-3 h-3 text-[#D4AF37]" /> 
                    Progreso de Nivel
                  </span>
                  <span className={`font-medium ${
                    isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                  }`}>
                    Faltan <strong className="font-black text-[#D4AF37]">{currentInfo.needed} pts</strong> para {currentInfo.next.name}
                  </span>
                </>
              ) : (
                <span className="font-black flex items-center gap-2 w-full justify-center py-1 uppercase tracking-wider text-[#D4AF37]">
                  <Award className="w-4 h-4" /> ¡Nivel máximo alcanzado!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ESCALAFÓN DEL CLUB */}
        {/* ============================================================ */}
        {currentLevels.length > 0 && (
          <div className={`border rounded-2xl p-5 space-y-4 shadow-sm transition-all duration-300 ${
            isDark ? 'bg-[#2A1B14]/40 border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
          }`}>
            <p className={`text-[8px] uppercase font-mono font-black tracking-[0.3em] px-1 ${
              isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
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
                        ? `bg-[#D4AF37]/10 border-[#D4AF37]/40 shadow-[0_4px_15px_rgba(212,175,55,0.15)] scale-[1.02]`
                        : isPassed 
                          ? isDark ? 'bg-[#2A1B14] border-[#3D281E] opacity-75' : 'bg-white border-[#F0E4DA] opacity-75'
                          : 'opacity-40 border-transparent bg-stone-500/[0.02]'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{lvl.emoji}</span>
                    <p className={`text-xs font-black tracking-tight ${
                      isCurrent ? 'text-[#D4AF37]' : isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                    }`}>{lvl.name}</p>
                    <p className={`text-[8px] font-mono mt-0.5 ${
                      isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                    }`}>{lvl.min_points} pts</p>
                    {isCurrent && (
                      <div className="w-1.5 h-1.5 rounded-full mx-auto mt-1.5 animate-pulse bg-[#D4AF37]" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CATÁLOGO DE PREMIOS */}
        {/* ============================================================ */}
        <div className="space-y-5 pt-2">
          <div className="flex items-center gap-3 px-1">
            <div className={`p-2 rounded-xl ${
              isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
            }`}>
              <Gift className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <h3 className={`text-[9px] uppercase font-mono font-black tracking-[0.25em] ${
              isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
            }`}>
              Catálogo de Premios
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentRewards.length === 0 ? (
              <div className={`col-span-full p-12 text-center border border-dashed rounded-2xl transition-all duration-300 ${
                isDark ? 'border-[#3D281E] bg-[#2A1B14]/40' : 'border-[#F0E4DA] bg-white'
              }`}>
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
                }`}>
                  <Gift className={`w-8 h-8 ${isDark ? 'text-[#A89588]' : 'text-[#A89588]'}`} />
                </div>
                <p className={`text-sm font-medium ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>No hay premios disponibles</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Vuelve pronto para descubrir nuevas recompensas</p>
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
                    className={`group relative p-5 rounded-2xl border transition-all duration-500 flex flex-col justify-between gap-4 hover:-translate-y-1 ${
                      lockedByTier 
                        ? isDark ? 'bg-[#2A1B14]/40 border-[#3D281E] opacity-50' : 'bg-white/50 border-[#F0E4DA] opacity-50'
                        : canAfford 
                          ? isDark ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]' : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
                          : isDark ? 'bg-[#2A1B14]/40 border-[#3D281E] opacity-75' : 'bg-white/50 border-[#F0E4DA] opacity-75'
                    }`}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-[#D4AF37]/[0.03] to-[#E8D5A0]/[0.01] rounded-2xl" />

                    {lockedByTier && (
                      <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[7px] font-mono font-black border shadow-sm z-10 ${
                        isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E]'
                      }`}>
                        <Lock className="w-2.5 h-2.5 text-[#D4AF37]" /> Rango {r.tier}
                      </div>
                    )}

                    <div className="space-y-2 relative z-10">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`font-serif text-sm font-light tracking-wide transition-colors ${
                          lockedByTier 
                            ? 'text-[#A89588] line-through'
                            : isDark ? 'text-[#FFF9F6] group-hover:text-[#D4AF37]' : 'text-[#1A0E0A] group-hover:text-[#D4AF37]'
                        }`}>
                          {r.name}
                        </p>
                        {!lockedByTier && r.discount_percentage > 0 && (
                          <span className={`text-[8px] font-mono font-black px-2.5 py-1 rounded-full border shadow-sm shrink-0 ${
                            isDark 
                              ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20' 
                              : 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20'
                          }`}>
                            -{r.discount_percentage}% OFF
                          </span>
                        )}
                      </div>
                      <p className={`text-xs font-light leading-relaxed line-clamp-2 ${
                        lockedByTier ? 'text-[#A89588]/40' : isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                      }`}>
                        {r.description || 'Ritual exclusivo VIP de alta gama.'}
                      </p>
                    </div>

                    <div className={`flex items-center justify-between pt-3 border-t relative z-10 ${
                      isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
                    }`}>
                      <div className="flex flex-col">
                        <span className={`text-xs font-mono font-black text-[#D4AF37]`}>
                          {r.points_required} PTS
                        </span>
                        <span className={`text-[7px] font-mono uppercase tracking-[0.15em] ${
                          isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                        }`}>
                          Nivel: {r.tier}
                        </span>
                      </div>

                      {lockedByTier ? (
                        <span className={`text-[8px] font-mono uppercase tracking-[0.15em] font-black flex items-center gap-1 px-3 py-1.5 rounded-xl border ${
                          isDark ? 'text-[#A89588] bg-[#1E120C] border-[#3D281E]' : 'text-[#5C4A3E] bg-[#FFF9F6] border-[#F0E4DA]'
                        }`}>
                          Bloqueado
                        </span>
                      ) : (
                        <button 
                          disabled={!canAfford} 
                          onClick={() => { setSelectedReward(r); setShowRedeemModal(true); }} 
                          className={`px-4 py-2 text-[9px] font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-300 border active:scale-95 flex items-center gap-1.5 shadow-sm hover:scale-105 ${
                            canAfford 
                              ? isDark 
                                ? 'bg-[#D4AF37] text-[#1A0E0A] border-[#D4AF37] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' 
                                : 'bg-[#1A0E0A] text-[#FFF9F6] border-[#1A0E0A] shadow-[0_4px_15px_rgba(26,14,10,0.15)]'
                              : isDark
                                ? 'bg-[#1E120C] text-[#A89588] border-[#3D281E] cursor-not-allowed'
                                : 'bg-[#FFF9F6] text-[#5C4A3E] border-[#F0E4DA] cursor-not-allowed'
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
        {/* MODAL DE CANJE */}
        {/* ============================================================ */}
        <AnimatePresence>
          {showRedeemModal && selectedReward && (
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
                className={`relative w-full max-w-md rounded-2xl border p-7 shadow-2xl overflow-hidden transition-all duration-300 ${
                  isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#D4AF37]" />

                <button 
                  onClick={() => { setShowRedeemModal(false); setGeneratedCode(null); }} 
                  className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                    isDark ? 'text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E]' : 'text-[#A89588] hover:text-[#1A0E0A] hover:bg-[#F0E4DA]'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>

                {!generatedCode ? (
                  <div className="space-y-5 text-center pt-2">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border shadow-sm ${
                      isDark ? 'bg-[#3D281E] border-[#D4AF37]/20' : 'bg-[#FFF9F6] border-[#D4AF37]/20'
                    }`}>
                      <Ticket className={`w-7 h-7 text-[#D4AF37]`} />
                    </div>
                    <div>
                      <h4 className={`font-serif text-xl font-light ${
                        isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                      }`}>
                        ¿Confirmar Canje?
                      </h4>
                      <p className={`text-sm font-light mt-1.5 ${
                        isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                      }`}>
                        Canjearás <strong className="font-mono text-[#D4AF37]">{selectedReward.points_required} puntos</strong> por:
                      </p>
                      <div className={`mt-4 p-4 rounded-xl border shadow-sm ${
                        isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
                      }`}>
                        <p className={`font-serif text-sm font-light text-[#D4AF37]`}>
                          {selectedReward.name}
                        </p>
                        {selectedReward.discount_percentage > 0 && (
                          <p className={`text-xs mt-0.5 ${
                            isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
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
                            ? 'border-[#3D281E] text-[#A89588] hover:bg-[#3D281E] hover:text-[#FFF9F6]' 
                            : 'border-[#F0E4DA] text-[#5C4A3E] hover:bg-[#F0E4DA] hover:text-[#1A0E0A]'
                        }`}
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={requestRedeem} 
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg ${
                          isDark 
                            ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' 
                            : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37] hover:text-[#1A0E0A] shadow-[0_4px_15px_rgba(26,14,10,0.15)]'
                        }`}
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 text-center pt-2">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border shadow-sm ${
                      isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                    }`}>
                      <ShieldCheck className="w-7 h-7 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className={`font-serif text-xl font-light ${
                        isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                      }`}>
                        ¡Premio Canjeado! 🎉
                      </h4>
                      <p className={`text-sm font-light mt-1.5 ${
                        isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                      }`}>
                        Presenta este código en recepción.
                      </p>
                    </div>

                    <div className={`p-4 rounded-2xl inline-block shadow-xl border mx-auto ${
                      isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
                    }`}>
                      <QRCodeSVG 
                        value={generatedCode.toUpperCase().trim()} 
                        size={180}
                        level="H"
                        bgColor={isDark ? '#1E120C' : '#FFFFFF'}
                        fgColor={isDark ? '#FFF9F6' : '#1A0E0A'}
                      />
                    </div>

                    <div className={`flex items-center justify-between border px-4 py-3 rounded-xl font-mono text-xs max-w-xs mx-auto shadow-inner ${
                      isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
                    }`}>
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${
                        isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                      }`}>
                        Código
                      </span>
                      <span className={`font-black tracking-widest text-sm ${
                        isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                      }`}>
                        {generatedCode}
                      </span>
                      <button 
                        type="button"
                        onClick={() => copyToClipboard(generatedCode)} 
                        className={`p-1.5 rounded-lg transition-all duration-300 hover:scale-110 ${
                          isDark ? 'text-[#A89588] hover:text-[#FFF9F6]' : 'text-[#A89588] hover:text-[#1A0E0A]'
                        }`}
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button 
                      onClick={() => { setShowRedeemModal(false); setGeneratedCode(null); }} 
                      className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 hover:scale-105 active:scale-95 ${
                        isDark 
                          ? 'bg-[#3D281E] text-[#A89588] hover:bg-[#4A3227] hover:text-[#FFF9F6]' 
                          : 'bg-[#F0E4DA] text-[#5C4A3E] hover:bg-[#E8DDD4] hover:text-[#1A0E0A]'
                      }`}
                    >
                      Finalizar
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

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