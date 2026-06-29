'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Crown, Gift, Clock, Zap, Check, ArrowRight, Sparkle, Scissors, X, Ticket, Copy, ShieldCheck } from 'lucide-react'
import confetti from 'canvas-confetti'

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

  useEffect(() => {
    if (user?.id && tenantId) {
      fetchData()
    }
  }, [user, tenantId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: walletData } = await supabase
        .from('loyalty_wallets')
        .select('*')
        .eq('client_id', user?.id)
        .eq('tenant_id', tenantId)
        .single()

      setWallet(walletData || {
        glow_points: 0, glow_points_earned: 0, glow_points_redeemed: 0,
        hair_points: 0, hair_points_earned: 0, hair_points_redeemed: 0,
        glow_level: 'Bronce', hair_level: 'Bronce'
      })

      const { data: gLv } = await supabase.from('vip_levels').select('*').eq('wallet_type', 'glow').eq('is_active', true).eq('tenant_id', tenantId).order('min_points', { ascending: true })
      const { data: hLv } = await supabase.from('vip_levels').select('*').eq('wallet_type', 'hair').eq('is_active', true).eq('tenant_id', tenantId).order('min_points', { ascending: true })
      setGlowLevels(gLv || [])
      setHairLevels(hLv || [])

      const { data: gRw } = await supabase.from('reward_catalog').select('*').eq('wallet_type', 'glow').eq('is_active', true).eq('tenant_id', tenantId).order('points_required', { ascending: true })
      const { data: hRw } = await supabase.from('reward_catalog').select('*').eq('wallet_type', 'hair').eq('is_active', true).eq('tenant_id', tenantId).order('points_required', { ascending: true })
      setGlowRewards(gRw || [])
      setHairRewards(hRw || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const getLevelInfo = (points: number, levels: LevelData[]) => {
    const current = [...levels].reverse().find(l => l.min_points <= points) || levels[0]
    const next = levels.find(l => l.min_points > points)
    if (!next) return { current, next, progress: 100, needed: 0 }
    const base = current ? current.min_points : 0
    const stepTotal = next.min_points - base
    const stepProgress = points - base
    return { current, next, progress: Math.min((stepProgress / stepTotal) * 100, 100), needed: next.min_points - points }
  }

  const currentInfo = activeTab === 'glow' 
    ? getLevelInfo(wallet?.glow_points || 0, glowLevels)
    : getLevelInfo(wallet?.hair_points || 0, hairLevels)

  const currentWallet = activeTab === 'glow' ? {
    points: wallet?.glow_points || 0, rewards: glowRewards, level: wallet?.glow_level || 'Bronce'
  } : {
    points: wallet?.hair_points || 0, rewards: hairRewards, level: wallet?.hair_level || 'Bronce'
  }

  const requestRedeem = async () => {
    if (!selectedReward || !user?.id || !tenantId) return
    try {
      const { data, error } = await supabase.rpc('redeem_reward', {
        p_client_id: user.id, p_tenant_id: tenantId, p_reward_id: selectedReward.id, p_wallet_type: activeTab
      })
      if (error) throw error
      setGeneratedCode(data)
      confetti({ particleCount: 100, spread: 50 })
      fetchData()
    } catch (e: any) {
      alert(e.message || 'Error procesando el canje')
    }
  }

  if (loading) return <div className="p-10 text-center text-xs text-stone-500">Cargando Club VIP...</div>

  return (
    <div className="max-w-md mx-auto space-y-5 pb-24 px-3 pt-4 text-stone-200">
      <div className="flex bg-stone-900 border border-stone-800 rounded-xl p-1">
        <button onClick={() => { setActiveTab('glow'); setGeneratedCode(null); }} className={`flex-1 py-2 rounded-lg text-xs font-bold ${activeTab === 'glow' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-stone-400'}`}>Estética</button>
        <button onClick={() => { setActiveTab('hair'); setGeneratedCode(null); }} className={`flex-1 py-2 rounded-lg text-xs font-bold ${activeTab === 'hair' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-stone-400'}`}>Peluquería</button>
      </div>

      <div className="bg-stone-950 border border-stone-900 rounded-2xl p-4">
        <div className="flex justify-between">
          <div>
            <span className="text-[10px] text-stone-500 block uppercase font-mono">Puntos Disponibles</span>
            <span className="text-3xl font-black text-white">{currentWallet.points}</span>
          </div>
          <div className="text-right">
            <span className="text-xl">{currentInfo.current?.emoji || '🥉'}</span>
            <p className="text-xs font-bold text-white">{currentWallet.level}</p>
          </div>
        </div>
        <div className="w-full h-1 bg-stone-900 rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-amber-500 transition-all" style={{ width: `${currentInfo.progress}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-mono text-stone-400 px-1">Premios Disponibles</h3>
        {currentWallet.rewards.map(r => {
          const canAfford = currentWallet.points >= r.points_required
          return (
            <div key={r.id} className={`p-3 rounded-xl border bg-stone-900/30 flex justify-between items-center ${canAfford ? 'border-stone-800' : 'border-stone-950 opacity-40'}`}>
              <div>
                <p className="text-xs font-bold text-stone-200">{r.name}</p>
                <span className="text-[10px] text-amber-400 font-mono">{r.points_required} pts</span>
              </div>
              <button disabled={!canAfford} onClick={() => { setSelectedReward(r); setShowRedeemModal(true); }} className="px-3 py-1 bg-stone-800 text-[10px] font-bold rounded-lg border border-stone-700 text-white">Canjear</button>
            </div>
          )
        })}
      </div>

      {showRedeemModal && selectedReward && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 max-w-sm w-full text-center">
            {!generatedCode ? (
              <>
                <p className="text-xs text-stone-300">¿Canjear {selectedReward.name}?</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setShowRedeemModal(false)} className="flex-1 py-1.5 bg-stone-900 text-xs text-stone-400 rounded-lg">No</button>
                  <button onClick={requestRedeem} className="flex-1 py-1.5 bg-amber-500 text-xs font-bold text-black rounded-lg">Sí, seguro</button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <span className="text-[10px] text-amber-400 font-mono block">Código de Reserva</span>
                <div className="text-xl font-mono font-black tracking-widest text-white bg-stone-900 p-2 rounded-lg border border-stone-800">{generatedCode}</div>
                <p className="text-[10px] text-stone-500">Muestre este código en caja para retirar su premio.</p>
                <button onClick={() => { setShowRedeemModal(false); setGeneratedCode(null); }} className="w-full py-1.5 bg-stone-800 text-xs rounded-lg text-stone-300">Cerrar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
