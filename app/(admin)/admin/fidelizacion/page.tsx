'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { 
  Users, Search, Plus, Minus, Edit, Trash2, Crown, Gift, Settings, 
  RefreshCw, X, Save, ToggleRight, ToggleLeft, Ticket, ShieldAlert, CheckCircle2 
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
  const [activeTab, setActiveTab] = useState<'clients' | 'levels' | 'rewards' | 'config'>('clients')
  
  const [voucherCode, setVoucherCode] = useState('')
  const [validationResult, setValidationResult] = useState<any>(null)

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

  const handleValidateVoucher = async () => {
    if (!voucherCode.trim() || !tenantId) return
    try {
      const { data, error } = await supabase.rpc('process_redeem_code', { p_code: voucherCode.toUpperCase().trim(), p_tenant_id: tenantId })
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

  if (loading) return <div className="p-8 text-center text-xs text-stone-500">Cargando Consola Total de Fidelización...</div>

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 text-stone-300 text-xs">
      <div className="flex justify-between items-center border-b border-stone-900 pb-4">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">💎 Panel de Control Multi-Fidelidad</h1>
          <p className="text-[10px] text-stone-500">Gestión de balances, catálogos e inquilinos aislados</p>
        </div>
        <button onClick={fetchData} className="p-2 bg-stone-900 border border-stone-800 rounded-xl hover:text-white"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* TAQUILLA DE CANJES DE CAJA */}
      <div className="bg-gradient-to-r from-stone-950 to-stone-900 border border-amber-500/10 rounded-xl p-4 shadow-xl">
        <span className="font-mono text-amber-400 font-bold block mb-2 flex items-center gap-1.5"><Ticket className="w-4 h-4" /> RECEPTOR DE VOUCHERS SEGUROS</span>
        <div className="flex gap-2">
          <input type="text" placeholder="Código de canje (Ej: GLO-E3A21)" value={voucherCode} onChange={e => setVoucherCode(e.target.value)} className="bg-stone-900 border border-stone-800 rounded-lg p-2 font-mono uppercase tracking-widest text-white flex-1 outline-none" />
          <button onClick={handleValidateVoucher} className="bg-amber-600 hover:bg-amber-500 text-black font-bold px-4 rounded-lg transition-colors">Despachar Premio</button>
        </div>
        {validationResult && (
          <div className={`p-3 rounded-lg mt-2 border flex items-center gap-2 ${validationResult.success ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' : 'bg-rose-950/20 border-rose-900/40 text-rose-400'}`}>
            {validationResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-rose-400" />}
            <span className="font-medium">{validationResult.message}</span>
          </div>
        )}
      </div>

      {/* TABS PRINCIPALES */}
      <div className="flex bg-stone-900 border border-stone-800 rounded-xl p-1 font-semibold">
        <button onClick={() => setActiveTab('clients')} className={`flex-1 py-2 rounded-lg ${activeTab === 'clients' ? 'bg-stone-800 text-white' : 'text-stone-400'}`}>Clientes y Puntos</button>
        <button onClick={() => setActiveTab('levels')} className={`flex-1 py-2 rounded-lg ${activeTab === 'levels' ? 'bg-stone-800 text-white' : 'text-stone-400'}`}>Niveles VIP</button>
        <button onClick={() => setActiveTab('rewards')} className={`flex-1 py-2 rounded-lg ${activeTab === 'rewards' ? 'bg-stone-800 text-white' : 'text-stone-400'}`}>Catálogo Premios</button>
        <button onClick={() => setActiveTab('config')} className={`flex-1 py-2 rounded-lg ${activeTab === 'config' ? 'bg-stone-800 text-white' : 'text-stone-400'}`}>Moneda/Ajustes</button>
      </div>

      {/* SECCIÓN CLIENTES */}
      {activeTab === 'clients' && (
        <div className="space-y-3">
          <input type="text" placeholder="Filtrar por nombre o email..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-white" />
          <div className="bg-stone-950 border border-stone-900 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-900/30 text-stone-500 font-mono border-b border-stone-900">
                  <th className="p-3">Clienta</th>
                  <th className="p-3 text-center">💎 Estética</th>
                  <th className="p-3 text-center">✂️ Peluquería</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-900">
                {clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(c => (
                  <tr key={c.id} className="hover:bg-stone-900/20">
                    <td className="p-3"><p className="font-bold text-white">{c.name}</p><p className="text-[10px] text-stone-500">{c.email}</p></td>
                    <td className="p-3 text-center font-mono font-bold text-amber-400">{c.glow_points} <span className="text-[10px] font-sans text-stone-500">({c.glow_level})</span></td>
                    <td className="p-3 text-center font-mono font-bold text-indigo-400">{c.hair_points} <span className="text-[10px] font-sans text-stone-500">({c.hair_level})</span></td>
                    <td className="p-3 text-right flex justify-end gap-1">
                      <button onClick={() => { setSelectedClient(c); setPointsType('earned'); setShowPointsModal(true); }} className="p-1.5 bg-stone-900 border border-stone-800 text-emerald-400 rounded-lg hover:bg-stone-800"><Plus className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setSelectedClient(c); setPointsType('redeemed'); setShowPointsModal(true); }} className="p-1.5 bg-stone-900 border border-stone-800 text-rose-400 rounded-lg hover:bg-stone-800"><Minus className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECCIÓN NIVELES VIP */}
      {activeTab === 'levels' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center"><h3 className="font-bold text-white">Configuración de Rangos VIP</h3><button onClick={() => { setEditingLevel(null); setShowLevelModal(true); }} className="bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:text-white"><Plus className="w-3.5 h-3.5" /> Agregar Nivel</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {levels.map(l => (
              <div key={l.id} className="p-3 bg-stone-950 border border-stone-900 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-white flex items-center gap-1.5">{l.emoji} {l.name} <span className="text-[9px] px-1.5 bg-stone-900 text-stone-400 border border-stone-800 rounded">{l.wallet_type === 'glow' ? 'Estética' : 'Peluquería'}</span></p>
                  <p className="text-[10px] text-stone-500 font-mono mt-0.5">Mínimo requerido: {l.min_points} pts</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingLevel(l); setShowLevelModal(true); }} className="p-1.5 bg-stone-900 border border-stone-800 text-stone-400 rounded hover:text-white"><Edit className="w-3 h-3" /></button>
                  <button onClick={() => deleteLevel(l.id)} className="p-1.5 bg-stone-900 border border-stone-800 text-rose-500 rounded hover:bg-rose-950/20"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN CATÁLOGO DE PREMIOS */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center"><h3 className="font-bold text-white">Catálogo Público de Recompensas</h3><button onClick={() => { setEditingReward(null); setShowRewardModal(true); }} className="bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:text-white"><Plus className="w-3.5 h-3.5" /> Agregar Premio</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rewards.map(r => (
              <div key={r.id} className="p-3 bg-stone-950 border border-stone-900 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-white">{r.name}</p>
                  <p className="text-[10px] text-stone-400 leading-tight mt-0.5">{r.description}</p>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="text-[9px] px-1.5 bg-amber-500/10 text-amber-400 font-mono rounded font-bold">{r.points_required} pts</span>
                    <span className="text-[9px] px-1.5 bg-stone-900 text-stone-400 border border-stone-800 rounded capitalize">{r.wallet_type === 'glow' ? 'Estética' : 'Peluquería'}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingReward(r); setShowRewardModal(true); }} className="p-1.5 bg-stone-900 border border-stone-800 text-stone-400 rounded hover:text-white"><Edit className="w-3 h-3" /></button>
                  <button onClick={() => deleteReward(r.id)} className="p-1.5 bg-stone-900 border border-stone-800 text-rose-500 rounded hover:bg-rose-950/20"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN AJUSTES DE REGELAS DE MONEDA */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Estética (Glow Points)', conf: glowConfig, type: 'glow' },
            { title: 'Peluquería (Hair Points)', conf: hairConfig, type: 'hair' }
          ].map(box => (
            <div key={box.type} className="bg-stone-950 border border-stone-900 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-stone-900 pb-2">
                <h3 className="font-bold text-white">{box.title}</h3>
                <button onClick={() => toggleWallet(box.type, box.conf.is_enabled)} className="p-1">
                  {box.conf.is_enabled ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6 text-stone-600" />}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-stone-900/50 p-2 rounded-lg border border-stone-800"><p className="text-[9px] text-stone-500 font-mono">Regla Inversión</p><p className="font-bold text-white mt-0.5">$U {Number(box.conf.conversion_rate).toFixed(0)} = 1pt</p></div>
                <div className="bg-stone-900/50 p-2 rounded-lg border border-stone-800"><p className="text-[9px] text-stone-500 font-mono">Valor de Canje</p><p className="font-bold text-emerald-400 mt-0.5">$U {Number(box.conf.point_value).toFixed(0)}</p></div>
                <div className="bg-stone-900/50 p-2 rounded-lg border border-stone-800"><p className="text-[9px] text-stone-500 font-mono">Vencimiento</p><p className="font-bold text-amber-500 mt-0.5">{box.conf.expire_months} meses</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL AJUSTE MANUAL DE SALDOS */}
      {showPointsModal && selectedClient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 max-w-sm w-full space-y-3">
            <h3 className="font-bold text-white text-sm">{pointsType === 'earned' ? 'Abonar Puntos' : 'Debitar Puntos'}</h3>
            <div className="space-y-2">
              <div><label className="text-stone-500 block mb-0.5">Cartera destino</label><select value={pointsWallet} onChange={e => setPointsWallet(e.target.value as any)} className="w-full bg-stone-900 border border-stone-800 rounded p-2 text-white"><option value="glow">Estética (Glow)</option><option value="hair">Peluquería (Hair)</option></select></div>
              <div><label className="text-stone-500 block mb-0.5">Cantidad</label><input type="number" value={pointsAmount} onChange={e => setPointsAmount(parseInt(e.target.value) || 0)} className="w-full bg-stone-900 border border-stone-800 rounded p-2 text-white font-mono" /></div>
              <div><label className="text-stone-500 block mb-0.5">Concepto / Motivo</label><input type="text" placeholder="Ej: Bonificación especial" value={pointsReason} onChange={e => setPointsReason(e.target.value)} className="w-full bg-stone-900 border border-stone-800 rounded p-2 text-white" /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowPointsModal(false)} className="flex-1 py-2 bg-stone-900 rounded-lg text-stone-400">Cancelar</button>
              <button onClick={handleUpdatePoints} className="flex-1 py-2 bg-amber-600 text-black font-bold rounded-lg">Aplicar Transacción</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NIVELES VIP (NUEVO/EDICIÓN) */}
      {showLevelModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={saveLevel} className="bg-stone-950 border border-stone-800 rounded-xl p-4 max-w-sm w-full space-y-3">
            <h3 className="font-bold text-white text-sm">{editingLevel ? 'Editar Rango VIP' : 'Nuevo Rango VIP'}</h3>
            <div className="space-y-2">
              <div><label className="text-stone-500 block mb-0.5">Línea de Negocio</label><select name="wallet_type" defaultValue={editingLevel?.wallet_type || 'glow'} className="w-full bg-stone-900 border border-stone-800 rounded p-1.5 text-white"><option value="glow">Estética</option><option value="hair">Peluquería</option></select></div>
              <div><label className="text-stone-500 block mb-0.5">Nombre del Rango</label><input type="text" name="name" defaultValue={editingLevel?.name || ''} required className="w-full bg-stone-900 border border-stone-800 rounded p-1.5 text-white" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-stone-500 block mb-0.5">Mínimo Puntos</label><input type="number" name="min_points" defaultValue={editingLevel?.min_points || 0} required className="w-full bg-stone-900 border border-stone-800 rounded p-1.5 text-white font-mono" /></div>
                <div><label className="text-stone-500 block mb-0.5">Emoji Icono</label><input type="text" name="emoji" defaultValue={editingLevel?.emoji || '🥉'} required className="w-full bg-stone-900 border border-stone-800 rounded p-1.5 text-center text-white" /></div>
              </div>
              <div><label className="text-stone-500 block mb-0.5">Texto Badge</label><input type="text" name="badge" defaultValue={editingLevel?.badge || 'VIP'} className="w-full bg-stone-900 border border-stone-800 rounded p-1.5 text-white" /></div>
              <div><label className="text-stone-500 block mb-0.5">Beneficios (Separados por coma)</label><input type="text" name="benefits" defaultValue={editingLevel?.benefits?.join(', ') || ''} placeholder="Café premium gratis, 10% extra en combos" className="w-full bg-stone-900 border border-stone-800 rounded p-1.5 text-white" /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowLevelModal(false)} className="flex-1 py-1.5 bg-stone-900 rounded text-stone-400">Cerrar</button>
              <button type="submit" className="flex-1 py-1.5 bg-amber-600 text-black font-bold rounded">Guardar Nivel</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CATALOGO PREMIOS (NUEVO/EDICIÓN) */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={saveReward} className="bg-stone-950 border border-stone-800 rounded-xl p-4 max-w-sm w-full space-y-3">
            <h3 className="font-bold text-white text-sm">{editingReward ? 'Editar Premio' : 'Nuevo Premio'}</h3>
            <div className="space-y-2">
              <div><label className="text-stone-500 block mb-0.5">Línea de Negocio</label><select name="wallet_type" defaultValue={editingReward?.wallet_type || 'glow'} className="w-full bg-stone-900 border border-stone-800 rounded p-1.5 text-white"><option value="glow">Estética</option><option value="hair">Peluquería</option></select></div>
              <div><label className="text-stone-500 block mb-0.5">Premio (Título)</label><input type="text" name="name" defaultValue={editingReward?.name || ''} required className="w-full bg-stone-900 border border-stone-800 rounded p-1.5 text-white" /></div>
              <div><label className="text-stone-500 block mb-0.5">Descripción Corta</label><input type="text" name="description" defaultValue={editingReward?.description || ''} className="w-full bg-stone-900 border border-stone-800 rounded p-1.5 text-white" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-stone-500 block mb-0.5">Puntos Requeridos</label><input type="number" name="points_required" defaultValue={editingReward?.points_required || 10} required className="w-full bg-stone-900 border border-stone-800 rounded p-1.5 text-white font-mono" /></div>
                <div><label className="text-stone-500 block mb-0.5">Clasificación Tier</label><select name="tier" defaultValue={editingReward?.tier || 'express'} className="w-full bg-stone-900 border border-stone-800 rounded p-1.5 text-white"><option value="express">Express</option><option value="match">Match</option><option value="vip_luxury">VIP Luxury</option></select></div>
              </div>
              <div><label className="text-stone-500 block mb-0.5">Porcentaje Descuento (Opcional)</label><input type="number" name="discount_percentage" defaultValue={editingReward?.discount_percentage || 0} className="w-full bg-stone-900 border border-stone-800 rounded p-1.5 text-white font-mono" /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowRewardModal(false)} className="flex-1 py-1.5 bg-stone-900 rounded text-stone-400">Cerrar</button>
              <button type="submit" className="flex-1 py-1.5 bg-amber-600 text-black font-bold rounded">Guardar Catálogo</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
