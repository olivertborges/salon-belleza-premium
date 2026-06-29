'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { 
  Crown, Gift, Clock, Zap, Check, ArrowRight, Sparkles, Scissors, 
  X, Ticket, Copy, ShieldCheck, Award, TrendingUp, QrCode 
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
  const [copied, setCopied] = useState(false)

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
    if (!levels || levels.length === 0) return { current: null, next: null, progress: 0, needed: 0 }
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400 animate-pulse">Abriendo tu bóveda VIP...</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-5 pb-24 px-4 pt-4 text-stone-800 dark:text-stone-200 antialiased selection:bg-amber-500/20">
      
      {/* SELECTOR DE SUB-SISTEMAS */}
      <div className="flex bg-stone-100 dark:bg-stone-900/60 backdrop-blur-md border border-stone-200 dark:border-stone-800/80 rounded-2xl p-1 shadow-inner">
        <button 
          onClick={() => { setActiveTab('glow'); setGeneratedCode(null); }} 
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-1.5 ${activeTab === 'glow' ? 'bg-white dark:bg-stone-950 text-amber-600 dark:text-amber-400 border border-stone-200 dark:border-stone-800 shadow-md' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-400'}`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Estética
        </button>
        <button 
          onClick={() => { setActiveTab('hair'); setGeneratedCode(null); }} 
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-1.5 ${activeTab === 'hair' ? 'bg-white dark:bg-stone-950 text-indigo-600 dark:text-indigo-400 border border-stone-200 dark:border-stone-800 shadow-md' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-400'}`}
        >
          <Scissors className="w-3.5 h-3.5" /> Peluquería
        </button>
      </div>

      {/* TARJETA DE BALANCE VIP (ESTILO WALLET PASSPORT) */}
      <div className="relative overflow-hidden rounded-3xl border border-stone-200 dark:border-stone-800 bg-gradient-to-b from-white via-white to-stone-50 dark:from-stone-950 dark:via-stone-950 dark:to-stone-900 p-5 shadow-xl dark:shadow-2xl group">
        <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10 dark:opacity-20 pointer-events-none transition-colors duration-500 ${activeTab === 'glow' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
        
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[9px] text-stone-400 dark:text-stone-500 uppercase font-mono font-black tracking-widest block">Balance Acumulado</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-stone-900 dark:text-white tracking-tight">{currentWallet.points}</span>
              <span className={`text-xs font-mono font-bold ${activeTab === 'glow' ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'}`}>pts</span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-lg shadow-sm">
              {currentInfo.current?.emoji || '🥉'}
            </div>
            <p className="text-xs font-black text-stone-900 dark:text-white mt-1.5 tracking-tight">{currentWallet.level}</p>
            <span className="text-[9px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider">Rango Actual</span>
          </div>
        </div>

        {/* BARRA DE PROGRESO DE NIVEL */}
        <div className="mt-5 space-y-1.5">
          <div className="w-full h-1.5 bg-stone-200/80 dark:bg-stone-900/80 border border-stone-300/40 dark:border-stone-800/40 rounded-full overflow-hidden p-[1px]">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${activeTab === 'glow' ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-indigo-600 to-indigo-400'}`} 
              style={{ width: `${currentInfo.progress}%` }} 
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-stone-400 dark:text-stone-500">
            {currentInfo.next ? (
              <>
                <span>Progreso Rango</span>
                <span>Faltan <strong className="text-stone-700 dark:text-stone-300">{currentInfo.needed} pts</strong> para {currentInfo.next.name}</span>
              </>
            ) : (
              <span className="text-amber-600 dark:text-amber-400/80 font-bold flex items-center gap-1 w-full justify-center py-0.5"><Award className="w-3 h-3" /> ¡Has alcanzado el rango máximo!</span>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN DE PREMIOS */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 px-1">
          <Gift className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
          <h3 className="text-[10px] uppercase font-mono font-black tracking-widest text-stone-500 dark:text-stone-400">Catálogo de Recompensas</h3>
        </div>
        
        <div className="space-y-2">
          {currentWallet.rewards.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl">
              <p className="text-xs text-stone-400 dark:text-stone-500 font-mono">No hay premios cargados para esta cartera.</p>
            </div>
          ) : (
            currentWallet.rewards.map(r => {
              const canAfford = currentWallet.points >= r.points_required
              return (
                <div 
                  key={r.id} 
                  className={`p-3.5 rounded-2xl border transition-all flex justify-between items-center gap-4 bg-white dark:bg-stone-950/40 backdrop-blur-sm relative group ${canAfford ? 'border-stone-200 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700/80 shadow-sm dark:shadow-md' : 'border-stone-100 dark:border-stone-900/40 opacity-40'}`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-stone-800 dark:text-stone-200 group-hover:text-black dark:group-hover:text-white transition-colors">{r.name}</p>
                    {r.description && <p className="text-[10px] text-stone-400 dark:text-stone-500 leading-tight pr-2 line-clamp-2">{r.description}</p>}
                    <div className="flex items-center gap-2 pt-1">
                      <span className={`text-[10px] font-mono font-black ${activeTab === 'glow' ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{r.points_required} PTS</span>
                      {r.discount_percentage > 0 && (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/20 font-mono">-{r.discount_percentage}% OFF</span>
                      )}
                    </div>
                  </div>
                  <button 
                    disabled={!canAfford} 
                    onClick={() => { setSelectedReward(r); setShowRedeemModal(true); }} 
                    className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shrink-0 border active:scale-95 ${canAfford ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-black dark:border-white hover:bg-stone-800 dark:hover:bg-stone-200 shadow-sm' : 'bg-stone-100 text-stone-400 border-stone-200 dark:bg-stone-900 dark:text-stone-600 dark:border-stone-800 cursor-not-allowed'}`}
                  >
                    Canjear
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* MODAL MULTI-ESTADO */}
      {showRedeemModal && selectedReward && (
        <div className="fixed inset-0 bg-stone-950/40 dark:bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl relative overflow-hidden">
            
            {!generatedCode ? (
              <div className="space-y-4 text-center">
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-stone-900 dark:text-white text-sm">¿Confirmar Canje de Puntos?</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Se debitarán <strong className="text-stone-900 dark:text-white font-mono">{selectedReward.points_required} puntos</strong> de tu saldo por:</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-bold mt-2 bg-stone-50 dark:bg-stone-900/60 p-2 rounded-xl border border-stone-200 dark:border-stone-800ップ">{selectedReward.name}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowRedeemModal(false)} className="flex-1 py-2.5 bg-stone-100 border border-stone-200 dark:bg-stone-900 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 rounded-xl font-bold hover:bg-stone-200 dark:hover:bg-stone-800">Cancelar</button>
                  <button onClick={requestRedeem} className="flex-1 py-2.5 bg-stone-900 text-white dark:bg-white dark:text-black text-xs font-black rounded-xl shadow-lg">Confirmar</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-stone-900 dark:text-white text-sm">¡Canje Procesado Exitosamente!</h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Muestra este código QR en la recepción para validar tu beneficio.</p>
                </div>

                {/* CONTENEDOR CON RELIEVE BLANCO SIEMPRE FIJO PARA FACILITAR ESCANEO DE QR */}
                <div className="bg-white p-4 rounded-2xl inline-block shadow-md border border-stone-200 mx-auto">
                  <QRCodeSVG 
                    value={generatedCode.toUpperCase().trim()} 
                    size={160}
                    level="H"
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                  />
                </div>

                <div className="flex items-center justify-between bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-3 py-2.5 rounded-xl font-mono text-xs max-w-xs mx-auto">
                  <span className="text-stone-400 dark:text-stone-500 tracking-wider text-[10px] uppercase font-bold">Código</span>
                  <span className="font-black text-stone-900 dark:text-white tracking-widest text-sm">{generatedCode}</span>
                  <button 
                    type="button"
                    onClick={() => copyToClipboard(generatedCode)} 
                    className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <p className="text-[10px] text-stone-400 dark:text-stone-500 italic">El saldo ha sido actualizado en tu cuenta.</p>
                
                <button 
                  onClick={() => { setShowRedeemModal(false); setGeneratedCode(null); }} 
                  className="w-full py-2.5 bg-stone-900 text-white dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300 text-xs rounded-xl font-bold hover:bg-stone-800"
                >
                  Finalizar y Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
