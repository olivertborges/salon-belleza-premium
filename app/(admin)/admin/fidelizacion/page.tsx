'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { 
  Users, Search, Plus, Minus, Edit, Trash2, Crown, Gift, Settings, 
  RefreshCw, X, Save, ToggleRight, ToggleLeft, Ticket, ShieldAlert, 
  CheckCircle2, QrCode, TrendingUp, Award, Activity, Sparkles, Sliders
} from 'lucide-react'

interface Client {
  id: string; name: string; email: string; phone: string;
  glow_points: number; glow_level: string;
  hair_points: number; hair_level: string;
}
interface Level { id: string; name: string; min_points: number; emoji: string; badge: string; wallet_type: string; benefits: string[]; }
interface Reward { id: string; name: string; description: string; points_required: number; tier: string; wallet_type: string; discount_percentage: number; }
interface Config { id: string; wallet_type: string; is_enabled: boolean; conversion_rate: number; point_value: number; expire_months: number; }

export default function AdminVIPGlowPage() {
  const { tenantId } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [config, setConfig] = useState<Config[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'levels' | 'rewards' | 'config'>('overview')

  // Estado del Escáner QR
  const [voucherCode, setVoucherCode] = useState('')
  const [validationResult, setValidationResult] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  // Modales
  const [showPointsModal, setShowPointsModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [pointsAmount, setPointsAmount] = useState(0)
  const [pointsReason, setPointsReason] = useState('')
  const [pointsType, setPointsType] = useState<'earned' | 'redeemed'>('earned')
  const [pointsWallet, setPointsWallet] = useState<'glow' | 'hair'>('glow')

  const [showLevelModal, setShowLevelModal] = useState(false)
  const [editingLevel, setEditingLevel] = useState<Level | null>(null)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)

  useEffect(() => { if (tenantId) fetchData() }, [tenantId])

  useEffect(() => {
    if (isScanning) {
      setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          "qr-reader", 
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        )
        scanner.render(
          async (decodedText) => {
            setVoucherCode(decodedText)
            setIsScanning(false)
            scanner.clear()
            await executeVoucherRedeem(decodedText)
          },
          (error) => { }
        )
        scannerRef.current = scanner
      }, 300)
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear()
        scannerRef.current = null
      }
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
      }
    }
  }, [isScanning])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: clData } = await supabase.from('clients').select('id, name, email, phone, loyalty_wallets(glow_points, glow_level, hair_points, hair_level)').eq('tenant_id', tenantId)
      setClients(clData?.map((c: any) => ({
        id: c.id, name: c.name, email: c.email, phone: c.phone,
        glow_points: c.loyalty_wallets?.[0]?.glow_points || 0,
        glow_level: c.loyalty_wallets?.[0]?.glow_level || 'Bronce',
        hair_points: c.loyalty_wallets?.[0]?.hair_points || 0,
        hair_level: c.loyalty_wallets?.[0]?.hair_level || 'Bronce'
      })) || [])

      const { data: lv } = await supabase.from('vip_levels').select('*').eq('tenant_id', tenantId).eq('is_active', true).order('min_points', { ascending: true })
      setLevels(lv || [])
      const { data: rw } = await supabase.from('reward_catalog').select('*').eq('tenant_id', tenantId).eq('is_active', true).order('points_required', { ascending: true })
      setRewards(rw || [])
      const { data: cf } = await supabase.from('loyalty_config').select('*').eq('tenant_id', tenantId)
      setConfig(cf || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const executeVoucherRedeem = async (codeToRedeem: string) => {
    if (!codeToRedeem.trim() || !tenantId) return
    try {
      const { data, error } = await supabase.rpc('process_redeem_code', { 
        p_code: codeToRedeem.toUpperCase().trim(), 
        p_tenant_id: tenantId 
      })
      if (error) throw error
      if (data && data.length > 0) {
        setValidationResult(data[0])
        if (data[0].success) { setVoucherCode(''); fetchData(); }
      }
    } catch (e: any) { alert(e.message) }
  }

  const handleUpdatePoints = async () => {
    if (!selectedClient || pointsAmount <= 0 || !tenantId) return
    try {
      const netPoints = pointsType === 'earned' ? pointsAmount : -pointsAmount
      const { error } = await supabase.rpc('update_loyalty_points', {
        p_client_id: selectedClient.id, p_tenant_id: tenantId, p_points: netPoints,
        p_type: pointsType, p_category: pointsType === 'earned' ? 'purchase' : 'manual',
        p_description: pointsReason || 'Ajuste manual administrativo', p_wallet_type: pointsWallet
      })
      if (error) throw error
      setShowPointsModal(false); setPointsAmount(0); setPointsReason(''); fetchData()
    } catch (e: any) { alert(e.message) }
  }

  const toggleWallet = async (walletType: string, currentStatus: boolean) => {
    try {
      await supabase.from('loyalty_config').update({ is_enabled: !currentStatus }).eq('wallet_type', walletType).eq('tenant_id', tenantId)
      fetchData()
    } catch (e) { console.error(e) }
  }

  const saveLevel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget)
    const payload = {
      name: fd.get('name'), min_points: parseInt(fd.get('min_points') as string),
      emoji: fd.get('emoji'), badge: fd.get('badge'), wallet_type: fd.get('wallet_type'),
      benefits: (fd.get('benefits') as string).split(',').map(b => b.trim()), tenant_id: tenantId
    }
    if (editingLevel) {
      await supabase.from('vip_levels').update(payload).eq('id', editingLevel.id).eq('tenant_id', tenantId)
    } else {
      await supabase.from('vip_levels').insert(payload)
    }
    setShowLevelModal(false); setEditingLevel(null); fetchData()
  }

  const saveReward = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget)
    const payload = {
      name: fd.get('name'), description: fd.get('description'), points_required: parseInt(fd.get('points_required') as string),
      tier: fd.get('tier'), wallet_type: fd.get('wallet_type'), discount_percentage: parseInt(fd.get('discount_percentage') as string) || 0, tenant_id: tenantId
    }
    if (editingReward) {
      await supabase.from('reward_catalog').update(payload).eq('id', editingReward.id).eq('tenant_id', tenantId)
    } else {
      await supabase.from('reward_catalog').insert(payload)
    }
    setShowRewardModal(false); setEditingReward(null); fetchData()
  }

  const deleteLevel = async (id: string) => { if (confirm('¿Eliminar este nivel VIP?')) { await supabase.from('vip_levels').update({ is_active: false }).eq('id', id).eq('tenant_id', tenantId); fetchData() } }
  const deleteReward = async (id: string) => { if (confirm('¿Eliminar este premio del catálogo?')) { await supabase.from('reward_catalog').update({ is_active: false }).eq('id', id).eq('tenant_id', tenantId); fetchData() } }

  const glowConfig = config.find(c => c.wallet_type === 'glow') || { conversion_rate: 100, point_value: 5, is_enabled: true, expire_months: 12 }
  const hairConfig = config.find(c => c.wallet_type === 'hair') || { conversion_rate: 100, point_value: 5, is_enabled: true, expire_months: 12 }

  const totalGlowPoints = clients.reduce((acc, c) => acc + c.glow_points, 0)
  const totalHairPoints = clients.reduce((acc, c) => acc + c.hair_points, 0)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-stone-500 dark:text-stone-400 animate-pulse">Sincronizando ecosistema de fidelización...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-2 sm:p-6 text-stone-700 dark:text-stone-300 antialiased selection:bg-amber-500/30 selection:text-stone-900 dark:selection:text-white">
      
      {/* HEADER ADAPTATIVO */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gradient-to-br dark:from-stone-900 dark:via-stone-950 dark:to-black p-6 border border-stone-200 dark:border-stone-800/80 shadow-xl dark:shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-amber-500/10 transition-all duration-700" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[9px] font-black uppercase tracking-widest rounded-full shadow-md">HQ Control</span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <p className="text-[10px] font-mono text-stone-400 dark:text-stone-500">v2.5 Hybrid Mode</p>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-white mt-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" /> Panel de Fidelidad VIP
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mt-0.5 leading-relaxed">Infraestructura unificada de puntos para tratamientos de estética y estilismo capilar.</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-700 dark:text-stone-300 font-mono text-[11px] font-bold hover:bg-stone-200 dark:hover:bg-stone-800 dark:hover:text-white transition-all shadow-sm active:scale-95">
          <RefreshCw className="w-3.5 h-3.5 text-amber-500" /> Sincronizar Base
        </button>
      </div>

      {/* RECEPTOR DE VOUCHERS Y QR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800/80 bg-white dark:bg-stone-950 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5"><Ticket className="w-4 h-4" /> RECEPTOR EXPRESO DE VOUCHERS</span>
                <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">Valide credenciales o presione el escáner para usar la cámara en vivo.</p>
              </div>
              <button 
                onClick={() => setIsScanning(!isScanning)} 
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 border text-[11px] transition-all shadow-md active:scale-95 ${isScanning ? 'bg-rose-500/20 border-rose-500/40 text-rose-600 dark:text-rose-400 animate-pulse' : 'bg-amber-500 text-black border-amber-600 font-black'}`}
              >
                <QrCode className="w-4 h-4" /> {isScanning ? 'Apagar Cámara' : 'Escanear QR Clienta'}
              </button>
            </div>

            {isScanning && (
              <div className="my-3 overflow-hidden rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-2 max-w-sm mx-auto">
                <div id="qr-reader" className="w-full"></div>
              </div>
            )}

            <div className="flex gap-2">
              <input type="text" placeholder="Código alfanumérico manual (Ej: GLW-7B2C)" value={voucherCode} onChange={e => setVoucherCode(e.target.value)} className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2.5 font-mono uppercase tracking-widest text-xs text-stone-900 dark:text-white flex-1 outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-stone-900 transition-all" />
              <button onClick={() => executeVoucherRedeem(voucherCode)} className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-800/50 text-stone-700 dark:text-stone-200 font-bold px-4 rounded-xl text-xs transition-all active:scale-95">Validar</button>
            </div>
          </div>

          {validationResult && (
            <div className={`p-3 rounded-xl mt-3 border flex items-center gap-3 ${validationResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
              {validationResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
              <div>
                <span className="font-bold text-xs block">{validationResult.message}</span>
                {validationResult.success && <span className="text-[10px] text-stone-400 dark:text-stone-500">La cuenta de la clienta ha sido actualizada en tiempo real.</span>}
              </div>
            </div>
          )}
        </div>

        {/* METRICAS RÁPIDAS */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
          <div className="bg-white dark:bg-gradient-to-br dark:from-stone-950 dark:to-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-md relative group overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-3 text-amber-500/10 group-hover:text-amber-500/20 transition-colors"><Crown className="w-12 h-12" /></div>
            <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-stone-400 dark:text-stone-500">Volumen Estética</p>
            <p className="text-2xl font-black text-stone-900 dark:text-white mt-1 tracking-tight">{totalGlowPoints} <span className="text-xs font-normal text-amber-600 dark:text-amber-400">pts</span></p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 font-mono"><TrendingUp className="w-3 h-3" /> Canales Activos</div>
          </div>
          <div className="bg-white dark:bg-gradient-to-br dark:from-stone-950 dark:to-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-md relative group overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-3 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors"><Award className="w-12 h-12" /></div>
            <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-stone-400 dark:text-stone-500">Volumen Peluquería</p>
            <p className="text-2xl font-black text-stone-900 dark:text-white mt-1 tracking-tight">{totalHairPoints} <span className="text-xs font-normal text-indigo-600 dark:text-indigo-400">pts</span></p>
            <div className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 mt-2 font-mono"><Activity className="w-3 h-3" /> Carteras Seguras</div>
          </div>
        </div>
      </div>

      {/* TABS (ESTILO NAVIGATION DOCK) */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1 bg-white dark:bg-stone-950/80 border border-stone-200 dark:border-stone-800/80 rounded-2xl shadow-sm backdrop-blur-md">
        {[
          { id: 'overview', name: 'Dashboard', icon: Activity },
          { id: 'clients', name: 'Clientes y Puntos', icon: Users },
          { id: 'levels', name: 'Niveles VIP', icon: Crown },
          { id: 'rewards', name: 'Catálogo Premios', icon: Gift },
          { id: 'config', name: 'Reglas de Moneda', icon: Sliders }
        ].map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${active ? 'bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm border border-stone-200 dark:border-stone-800' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'}`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-amber-500' : ''}`} /> {tab.name}
            </button>
          )
        })}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-900 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">📈 Actividad Operativa del Programa</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">El sistema multi-fidelidad está procesando puntos bajo aislamiento estricto de inquilinos. Actualmente hay <strong className="text-stone-900 dark:text-white">{clients.length} clientes registrados</strong> acumulando beneficios.</p>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="p-3 bg-stone-50 dark:bg-stone-900/40 rounded-xl text-center border border-stone-200 dark:border-stone-800/50"><p className="text-[10px] font-mono text-stone-400 dark:text-stone-500">Rangos VIP</p><p className="text-base font-black text-stone-900 dark:text-white mt-1">{levels.length}</p></div>
              <div className="p-3 bg-stone-50 dark:bg-stone-900/40 rounded-xl text-center border border-stone-200 dark:border-stone-800/50"><p className="text-[10px] font-mono text-stone-400 dark:text-stone-500">Premios</p><p className="text-base font-black text-stone-900 dark:text-white mt-1">{rewards.length}</p></div>
              <div className="p-3 bg-stone-50 dark:bg-stone-900/40 rounded-xl text-center border border-stone-200 dark:border-stone-800/50"><p className="text-[10px] font-mono text-stone-400 dark:text-stone-500">Configuración</p><p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2">ONLINE</p></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gradient-to-b dark:from-stone-950 dark:to-stone-900 border border-stone-200 dark:border-stone-900 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <h4 className="font-bold text-xs text-stone-400 dark:text-stone-500 uppercase font-mono">Conversor por Defecto</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">Cada compra acumula puntos según la tasa asignada a cada línea de negocio.</p>
            </div>
            <div className="border-t border-stone-100 dark:border-stone-800/80 pt-3 mt-4 space-y-1 text-[11px] font-mono text-stone-500 dark:text-stone-400">
              <div className="flex justify-between"><span>Estética:</span><span className="text-stone-900 dark:text-white">$U {glowConfig.conversion_rate} = 1pt</span></div>
              <div className="flex justify-between"><span>Peluquería:</span><span className="text-stone-900 dark:text-white">$U {hairConfig.conversion_rate} = 1pt</span></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CLIENTES */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400 dark:text-stone-500" />
            <input type="text" placeholder="Buscar clienta por nombre, email o número de contacto..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-900 rounded-xl pl-9 pr-4 py-2.5 text-xs text-stone-900 dark:text-white outline-none focus:border-stone-400 dark:focus:border-stone-700 placeholder-stone-400 transition-all" />
          </div>

          <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-900 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-900/50 text-[10px] font-mono uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-900">
                    <th className="p-4">Identificación / Perfil</th>
                    <th className="p-4 text-center">💎 Monedero Estética</th>
                    <th className="p-4 text-center">✂️ Monedero Peluquería</th>
                    <th className="p-4 text-right">Ajustes Manuales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-900/60">
                  {clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())).map(c => (
                    <tr key={c.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/30 transition-all group">
                      <td className="p-4">
                        <p className="font-bold text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors text-xs">{c.name}</p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono mt-0.5">{c.email} {c.phone && `• ${c.phone}`}</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">{c.glow_points}</span>
                        <span className="text-[10px] block text-stone-400 dark:text-stone-500 font-medium">{c.glow_level}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">{c.hair_points}</span>
                        <span className="text-[10px] block text-stone-400 dark:text-stone-500 font-medium">{c.hair_level}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setSelectedClient(c); setPointsType('earned'); setShowPointsModal(true); }} className="p-1.5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10 transition-all"><Plus className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setSelectedClient(c); setPointsType('redeemed'); setShowPointsModal(true); }} className="p-1.5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-500/10 dark:hover:bg-rose-500/10 transition-all"><Minus className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: NIVELES VIP */}
      {activeTab === 'levels' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-white">Rangos de Progresión Escalada</h3>
              <p className="text-[11px] text-stone-400 dark:text-stone-500">Defina los umbrales automáticos de nivel VIP.</p>
            </div>
            <button onClick={() => { setEditingLevel(null); setShowLevelModal(true); }} className="bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"><Plus className="w-4 h-4 text-amber-500" /> Agregar Rango</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {levels.map(l => (
              <div key={l.id} className="p-4 bg-white dark:bg-gradient-to-br dark:from-stone-950 dark:to-stone-900/60 border border-stone-200 dark:border-stone-900 rounded-2xl shadow-md flex justify-between items-start group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-stone-200 dark:bg-stone-800 group-hover:bg-amber-500 transition-all" />
                <div className="space-y-1 pl-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{l.emoji}</span>
                    <h4 className="font-black text-stone-900 dark:text-white text-xs">{l.name}</h4>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-mono font-bold tracking-wider ${l.wallet_type === 'glow' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20'}`}>{l.wallet_type === 'glow' ? 'Estética' : 'Peluquería'}</span>
                  </div>
                  <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400">Mínimo Necesario: <strong className="text-stone-800 dark:text-stone-300">{l.min_points} puntos</strong></p>
                  {l.benefits && l.benefits.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1">
                      {l.benefits.map((b, idx) => (
                        <span key={idx} className="text-[9px] bg-stone-50 dark:bg-stone-900 text-stone-500 dark:text-stone-400 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-800/80">{b}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => { setEditingLevel(l); setShowLevelModal(true); }} className="p-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 rounded-xl hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-all shadow-sm"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteLevel(l.id)} className="p-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-rose-500 rounded-xl hover:bg-rose-500/10 transition-all shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: PREMIOS */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-white">Catálogo de Recompensas de Canje</h3>
              <p className="text-[11px] text-stone-400 dark:text-stone-500">Premios que los usuarios adquieren debitando sus balances acumulados.</p>
            </div>
            <button onClick={() => { setEditingReward(null); setShowRewardModal(true); }} className="bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"><Plus className="w-4 h-4 text-amber-400" /> Agregar Premio</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map(r => (
              <div key={r.id} className="p-4 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-900 rounded-2xl shadow-md flex justify-between items-center group relative overflow-hidden">
                <div className="space-y-1">
                  <h4 className="font-black text-stone-900 dark:text-white text-xs">{r.name}</h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal max-w-sm">{r.description || 'Sin descripción detallada registrada.'}</p>
                  <div className="flex items-center gap-1.5 pt-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500 text-black font-black rounded-lg shadow-sm">{r.points_required} PTS</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 bg-stone-50 dark:bg-stone-900 text-stone-500 dark:text-stone-400 rounded border border-stone-200 dark:border-stone-800 capitalize">{r.wallet_type === 'glow' ? 'Estética' : 'Peluquería'}</span>
                    {r.discount_percentage > 0 && <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-200 dark:border-emerald-500/20">-{r.discount_percentage}% desc</span>}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0 pl-2">
                  <button onClick={() => { setEditingReward(r); setShowRewardModal(true); }} className="p-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 rounded-xl hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-all shadow-sm"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteReward(r.id)} className="p-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-rose-400 rounded-xl hover:bg-rose-500/10 transition-all shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: MONEDAS */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Estética (Glow Points)', conf: glowConfig, type: 'glow' },
            { title: 'Peluquería (Hair Points)', conf: hairConfig, type: 'hair' }
          ].map(box => (
            <div key={box.type} className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-900 rounded-2xl p-5 space-y-4 shadow-md relative overflow-hidden">
              <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-900 pb-3">
                <div>
                  <h3 className="font-black text-stone-900 dark:text-white text-xs">{box.title}</h3>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500">Estado de acumulación automática.</p>
                </div>
                <button onClick={() => toggleWallet(box.type, box.conf.is_enabled)} className="focus:outline-none transition-transform active:scale-95">
                  {box.conf.is_enabled ? <ToggleRight className="w-7 h-7 text-emerald-500 dark:text-emerald-400" /> : <ToggleLeft className="w-7 h-7 text-stone-300 dark:text-stone-700" />}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-stone-50 dark:bg-stone-900/50 p-3 rounded-xl border border-stone-200 dark:border-stone-800/60"><p className="text-[9px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider">Inversión</p><p className="font-mono text-xs font-bold text-stone-900 dark:text-white mt-1">$U {Number(box.conf.conversion_rate).toFixed(0)}</p><span className="text-[8px] text-stone-400 dark:text-stone-600 block mt-0.5">= 1 punto</span></div>
                <div className="bg-stone-50 dark:bg-stone-900/50 p-3 rounded-xl border border-stone-200 dark:border-stone-800/60"><p className="text-[9px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider">Valor Monetario</p><p className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">$U {Number(box.conf.point_value).toFixed(0)}</p><span className="text-[8px] text-stone-400 dark:text-stone-600 block mt-0.5">de saldo valor</span></div>
                <div className="bg-stone-50 dark:bg-stone-900/50 p-3 rounded-xl border border-stone-200 dark:border-stone-800/60"><p className="text-[9px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider">Expiración</p><p className="font-mono text-xs font-bold text-amber-600 dark:text-amber-500 mt-1">{box.conf.expire_months}</p><span className="text-[8px] text-stone-400 dark:text-stone-600 block mt-0.5">meses corridos</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: AJUSTE MANUAL */}
      {showPointsModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative">
            <div>
              <h3 className="font-black text-stone-900 dark:text-white text-sm">{pointsType === 'earned' ? 'Abonar Puntos Manuales' : 'Debitar Puntos Manuales'}</h3>
              <p className="text-[11px] text-stone-500 mt-0.5">Clienta: {selectedClient.name}</p>
            </div>
            <div className="space-y-3">
              <div><label className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-mono font-bold mb-1">Cartera Afectada</label><select value={pointsWallet} onChange={e => setPointsWallet(e.target.value as any)} className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 text-xs text-stone-900 dark:text-white outline-none focus:border-amber-500"><option value="glow">Estética (Glow Points)</option><option value="hair">Peluquería (Hair Points)</option></select></div>
              <div><label className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-mono font-bold mb-1">Monto de Puntos</label><input type="number" value={pointsAmount} onChange={e => setPointsAmount(parseInt(e.target.value) || 0)} className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 font-mono text-xs text-stone-900 dark:text-white outline-none focus:border-amber-500" /></div>
              <div><label className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-mono font-bold mb-1">Concepto Justificativo</label><input type="text" placeholder="Ej: Cortesía de administración" value={pointsReason} onChange={e => setPointsReason(e.target.value)} className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 text-xs text-stone-900 dark:text-white outline-none focus:border-amber-500 placeholder-stone-400 dark:placeholder-stone-600" /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowPointsModal(false)} className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-600 dark:text-stone-400 font-bold hover:bg-stone-200 dark:hover:bg-stone-800 transition-all">Cancelar</button>
              <button type="button" onClick={handleUpdatePoints} className="flex-1 py-2.5 bg-amber-500 text-black font-black rounded-xl text-xs transition-all shadow-md active:scale-95">Confirmar Ajuste</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRO NIVELES */}
      {showLevelModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <form onSubmit={saveLevel} className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-black text-stone-900 dark:text-white text-sm">{editingLevel ? 'Modificar Rango VIP' : 'Nuevo Rango VIP'}</h3>
            <div className="space-y-3">
              <div><label className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-mono mb-1">Ecosistema</label><select name="wallet_type" defaultValue={editingLevel?.wallet_type || 'glow'} className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 text-xs text-stone-900 dark:text-white outline-none"><option value="glow">Estética</option><option value="hair">Peluquería</option></select></div>
              <div><label className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-mono mb-1">Nombre del Rango</label><input type="text" name="name" defaultValue={editingLevel?.name || ''} required className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 text-xs text-stone-900 dark:text-white outline-none" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-mono mb-1">Mínimo Requerido</label><input type="number" name="min_points" defaultValue={editingLevel?.min_points || 0} required className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 text-xs text-stone-900 dark:text-white font-mono outline-none" /></div>
                <div><label className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-mono mb-1">Emoji Icono</label><input type="text" name="emoji" defaultValue={editingLevel?.emoji || '🥇'} required className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 text-center text-xs text-stone-900 dark:text-white outline-none" /></div>
              </div>
              <div><label className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-mono mb-1">Texto Badge</label><input type="text" name="badge" defaultValue={editingLevel?.badge || 'VIP'} className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 text-xs text-stone-900 dark:text-white outline-none" /></div>
              <div><label className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-mono mb-1">Beneficios (Por comas)</label><input type="text" name="benefits" defaultValue={editingLevel?.benefits?.join(', ') || ''} placeholder="Acceso Lounge, Infusiones Libres" className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 text-xs text-stone-900 dark:text-white outline-none placeholder-stone-400 dark:placeholder-stone-600" /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowLevelModal(false)} className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-600 dark:text-stone-400 font-bold hover:bg-stone-200 dark:hover:bg-stone-800">Cerrar</button>
              <button type="submit" className="flex-1 py-2.5 bg-amber-500 text-black font-black rounded-xl text-xs transition-all active:scale-95">Guardar Rango</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: REGISTRO RECOMPENSAS */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <form onSubmit={saveReward} className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-black text-stone-900 dark:text-white text-sm">{editingReward ? 'Modificar Entrada' : 'Nueva Recompensa'}</h3>
            <div className="space-y-3">
              <div><label className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-mono mb-1">Cartera de Débito</label><select name="wallet_type" defaultValue={editingReward?.wallet_type || 'glow'} className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 text-xs text-stone-900 dark:text-white outline-none"><option value="glow">Estética</option><option value="hair">Peluquería</option></select></div>
              <div><label className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-mono mb-1">Título del Premio</label><input type="text" name="name" defaultValue={editingReward?.name || ''} required className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 text-xs text-stone-900 dark:text-white outline-none" /></div>
              <div><label className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-mono mb-1">Descripción</label><input type="text" name="description" defaultValue={editingReward?.description || ''} className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 text-xs text-stone-900 dark:text-white outline-none placeholder-stone-400 dark:placeholder-stone-600" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-mono mb-1">Costo Puntos</label><input type="number" name="points_required" defaultValue={editingReward?.points_required || 10} required className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 text-xs text-stone-900 dark:text-white font-mono outline-none" /></div>
                <div><label className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-mono mb-1">Clasificación Tier</label><select name="tier" defaultValue={editingReward?.tier || 'express'} className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 text-xs text-stone-900 dark:text-white outline-none"><option value="express">Express</option><option value="match">Match</option><option value="vip_luxury">VIP Luxury</option></select></div>
              </div>
              <div><label className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-mono mb-1">Porcentaje Descuento (Opcional)</label><input type="number" name="discount_percentage" defaultValue={editingReward?.discount_percentage || 0} className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 text-xs text-stone-900 dark:text-white font-mono outline-none" /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowRewardModal(false)} className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-600 dark:text-stone-400 font-bold hover:bg-stone-200 dark:hover:bg-stone-800">Cerrar</button>
              <button type="submit" className="flex-1 py-2.5 bg-amber-500 text-black font-black rounded-xl text-xs transition-all active:scale-95">Guardar Premio</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
