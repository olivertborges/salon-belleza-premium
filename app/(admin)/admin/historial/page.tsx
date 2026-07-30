// @ts-nocheck
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  History, CheckCircle2, Clock, Search,
  User, DollarSign, TrendingUp,
  RefreshCw, X, Calendar, Users,
  AlertCircle, Trash2, Filter, ChevronLeft, ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type HistorialItem = {
  id: string
  type: 'cita' | 'cliente'
  title: string
  description: string
  date: string
  amount?: number
  status: string
  table: 'appointments' | 'clients'
}

const TYPE_CONFIG = {
  cita: { label: 'Cita', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10', icon: CheckCircle2 },
  cliente: { label: 'Cliente', color: 'text-[#EC4899]', bg: 'bg-[#EC4899]/10', icon: User }
}

const GOLD_PALETTE = { primary: '#D4AF37', light: '#E8D5A0', dark: '#C9A96E' }
const ITEMS_PER_PAGE = 10

export default function HistorialPage() {
  const { settings } = useSettings()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const [filterMonth, setFilterMonth] = useState<string>('todos')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const headerGradient = useMemo(() => ({
    backgroundImage: `linear-gradient(135deg, ${GOLD_PALETTE.primary} 0%, ${GOLD_PALETTE.dark} 50%, ${GOLD_PALETTE.light} 100%)`
  }), [])

  const cargarHistorial = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const items: HistorialItem[] = []

      const [citasRes, clientesRes] = await Promise.all([
        supabase
          .from('appointments')
          .select(`id, total_price, date, time, status, clients:client_id (name), services:service_id (name)`)
          .order('date', { ascending: false })
          .limit(100),
        supabase
          .from('clients')
          .select('id, name, email, phone, created_at')
          .order('created_at', { ascending: false })
          .limit(50)
      ])

      if (citasRes.data) {
        const statusMap: Record<string, string> = {
          pending: 'Pendiente', confirmed: 'Confirmada', in_progress: 'En curso', completed: 'Completada', cancelled: 'Cancelada'
        }
        citasRes.data.forEach((c: any) => {
          items.push({
            id: c.id,
            type: 'cita',
            table: 'appointments',
            title: `Cita: ${c.clients?.name || 'Cliente'}`,
            description: `${c.services?.name || 'Servicio'} — ${c.time?.slice(0,5) || '--:--'}`,
            date: `${c.date}T12:00:00`,
            amount: c.total_price || 0,
            status: statusMap[c.status] || c.status || 'Pendiente'
          })
        })
      }

      if (clientesRes.data) {
        clientesRes.data.forEach((c: any) => {
          items.push({
            id: c.id,
            type: 'cliente',
            table: 'clients',
            title: `Nueva clienta: ${c.name}`,
            description: `Email: ${c.email || 'No registrado'} • Tel: ${c.phone || 'No registrado'}`,
            date: c.created_at,
            amount: 0,
            status: 'Registrada'
          })
        })
      }

      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setHistorial(items)
      setSelectedItems(new Set())
      setSelectAll(false)
      setCurrentPage(1)
      setSuccess('Historial actualizado')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Error de sincronización')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    cargarHistorial(true)
  }, [cargarHistorial])

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterType, filterMonth, filterStatus])

  const mesesDisponibles = useMemo(() => {
    const meses = new Set<string>()
    historial.forEach(item => {
      const fecha = new Date(item.date)
      if (!isNaN(fecha.getTime())) meses.add(format(fecha, 'yyyy-MM'))
    })
    return Array.from(meses).sort().reverse()
  }, [historial])

  const estadosDisponibles = useMemo(() => {
    const estados = new Set<string>()
    historial.forEach(item => estados.add(item.status))
    return Array.from(estados)
  }, [historial])

  const filtered = useMemo(() => {
    let result = [...historial]
    const q = search.toLowerCase().trim()

    if (q) {
      result = result.filter(item => 
        item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
      )
    }
    if (filterType !== 'todos') result = result.filter(item => item.type === filterType)
    if (filterStatus !== 'todos') result = result.filter(item => item.status === filterStatus)
    if (filterMonth !== 'todos') {
      result = result.filter(item => {
        const fecha = new Date(item.date)
        return !isNaN(fecha.getTime()) && format(fecha, 'yyyy-MM') === filterMonth
      })
    }
    return result
  }, [historial, search, filterType, filterMonth, filterStatus])

  // Paginación lógica
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  const stats = useMemo(() => {
    const totalEventos = historial.length
    const totalCitas = historial.filter(i => i.type === 'cita').length
    const totalClientes = historial.filter(i => i.type === 'cliente').length
    const totalIngresos = historial.filter(i => i.amount && i.amount > 0).reduce((sum, i) => sum + (i.amount || 0), 0)
    return { totalEventos, totalCitas, totalClientes, totalIngresos }
  }, [historial])

  const eliminarSeleccionados = async () => {
    if (!confirm(`¿Eliminar ${selectedItems.size} registro(s) seleccionados?`)) return
    setDeleting(true)
    try {
      const ids = Array.from(selectedItems)
      const citasIds = ids.filter(id => historial.find(h => h.id === id)?.table === 'appointments')
      const clientesIds = ids.filter(id => historial.find(h => h.id === id)?.table === 'clients')

      if (citasIds.length > 0) await supabase.from('appointments').delete().in('id', citasIds)
      if (clientesIds.length > 0) await supabase.from('clients').delete().in('id', clientesIds)

      setSuccess(`✅ ${selectedItems.size} registros eliminados`)
      setTimeout(() => setSuccess(null), 3000)
      await cargarHistorial(false)
    } catch (err: any) {
      setError(err.message || 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(paginatedItems.map(item => item.id)))
    }
    setSelectAll(!selectAll)
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[70vh] ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-[#D4AF37] border-white/20 animate-spin" />
          <p className="text-[10px] tracking-widest uppercase opacity-60">Cargando Historial...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen pb-8 relative overflow-x-hidden ${isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'}`}>
      <div className="max-w-6xl mx-auto px-4 space-y-4 pt-6 relative z-10">
        
        {/* Cabecera */}
        <div className="relative overflow-hidden rounded-2xl p-5 shadow-xl text-white" style={headerGradient}>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md shrink-0"><History className="w-5 h-5" /></div>
              <div>
                <h1 className="text-xl font-serif font-black tracking-tight">Historial Fresh Nails</h1>
                <p className="text-[10px] text-white/70">{stats.totalEventos} registros totales</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => cargarHistorial(false)} disabled={refreshing} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all"><RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /></button>
              {selectedItems.size > 0 && (
                <button onClick={eliminarSeleccionados} disabled={deleting} className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-[10px] font-bold uppercase flex items-center gap-2 shadow-lg">
                  <Trash2 className="w-4 h-4" /> {selectedItems.size}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Alertas */}
        {success && <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs">{success}</div>}
        {error && <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs">{error}</div>}

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total', value: stats.totalEventos, icon: History, color: 'text-[#D4AF37]' },
            { label: 'Citas', value: stats.totalCitas, icon: Calendar, color: 'text-[#D4AF37]' },
            { label: 'Clientes', value: stats.totalClientes, icon: Users, color: 'text-[#EC4899]' },
            { label: 'Ingresos', value: `$${stats.totalIngresos.toLocaleString()}`, icon: TrendingUp, color: 'text-[#D4AF37]' }
          ].map((kpi, idx) => (
            <div key={idx} className={`rounded-xl p-2.5 border ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
              <div className="flex items-center gap-2">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <div>
                  <p className="text-[7px] font-bold opacity-60 uppercase">{kpi.label}</p>
                  <p className="text-xs font-black">{kpi.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Barra de Filtros Extendida */}
        <div className={`flex flex-wrap items-center gap-3 p-3 rounded-xl border shadow-sm ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
          <div className="flex items-center gap-2 flex-1 min-w-[150px]">
            <Search className="w-4 h-4 opacity-50" />
            <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-xs w-full outline-none" />
            {search && <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch('')} />}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 opacity-50" />
            
            {/* Tipo */}
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-transparent text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer">
              <option value="todos">Todos los Tipos</option>
              <option value="cita">Citas</option>
              <option value="cliente">Clientes</option>
            </select>

            {/* Estado */}
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-transparent text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer">
              <option value="todos">Todos los Estados</option>
              {estadosDisponibles.map(est => <option key={est} value={est}>{est}</option>)}
            </select>

            {/* Mes */}
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-transparent text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer">
              <option value="todos">Todos los Meses</option>
              {mesesDisponibles.map(m => (
                <option key={m} value={m}>{format(new Date(m + '-01'), 'MMM yyyy', { locale: es })}</option>
              ))}
            </select>
          </div>

          <button onClick={toggleSelectAll} className={`ml-auto px-2.5 py-1 rounded text-[8px] font-bold uppercase tracking-wider ${isDark ? 'bg-[#3D281E] hover:bg-[#4A3227]' : 'bg-[#F0E4DA] hover:bg-[#E8DDD4]'}`}>
            {selectAll ? 'Deseleccionar Pág.' : 'Seleccionar Pág.'}
          </button>
        </div>

        {/* Lista Paginada */}
        <div className="space-y-2">
          {paginatedItems.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-xl text-xs opacity-50">No hay registros coincidentes</div>
          ) : (
            paginatedItems.map((item, index) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.cita
              const IconComponent = config.icon
              const isSelected = selectedItems.has(item.id)

              return (
                <div key={`${item.id}-${index}`} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'border-[#D4AF37] bg-[#D4AF37]/10' : isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(item.id)} className="w-3.5 h-3.5 accent-[#D4AF37] cursor-pointer" />
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}><IconComponent className={`w-4 h-4 ${config.color}`} /></div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold truncate">{item.title}</h4>
                      <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border uppercase ${config.bg} ${config.color}`}>{config.label}</span>
                      <span className="text-[7px] opacity-60 font-mono">{format(new Date(item.date), 'dd/MM/yyyy')}</span>
                      {item.type === 'cita' && item.amount && item.amount > 0 && <span className="text-xs font-black text-[#D4AF37]">${item.amount.toLocaleString()}</span>}
                    </div>
                    <p className="text-[10px] opacity-70 truncate mt-0.5">{item.description}</p>
                  </div>

                  <span className={`text-[7px] font-bold px-2 py-0.5 rounded-full border uppercase ${isDark ? 'border-white/10' : 'border-black/5'}`}>{item.status}</span>
                </div>
              )
            })
          )}
        </div>

        {/* Paginador Inferior */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-[10px] opacity-60">Página {currentPage} de {totalPages} ({filtered.length} ítems)</p>
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-lg border disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-lg border disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
