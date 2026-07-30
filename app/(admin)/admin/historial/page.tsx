// app/(admin)/historial/page.tsx
// @ts-nocheck
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  History, CheckCircle2, Clock, Search,
  User, DollarSign, TrendingUp,
  RefreshCw, X, Calendar, Users,
  AlertCircle, Trash2, Filter, ChevronLeft, ChevronRight,
  Sparkles
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
  cita: { label: 'Cita', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10', border: 'border-[#D4AF37]/20', icon: CheckCircle2 },
  cliente: { label: 'Cliente', color: 'text-[#EC4899]', bg: 'bg-[#EC4899]/10', border: 'border-[#EC4899]/20', icon: User }
}

const ITEMS_PER_PAGE = 10

export default function HistorialPage() {
  const { tenantId } = useAuth()
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

  const cargarHistorial = useCallback(async (showLoading = true) => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    if (showLoading) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const items: HistorialItem[] = []

      const [citasRes, clientesRes] = await Promise.all([
        supabase
          .from('appointments')
          .select(`id, total_price, date, time, status, clients:client_id (name), services:service_id (name)`)
          .eq('tenant_id', tenantId)
          .order('date', { ascending: false })
          .limit(100),
        supabase
          .from('clients')
          .select('id, name, email, phone, created_at')
          .eq('tenant_id', tenantId)
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
  }, [tenantId])

  useEffect(() => {
    cargarHistorial(true)
  }, [cargarHistorial])

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

  const eliminarIndividual = async (item: HistorialItem) => {
    if (!confirm(`¿Eliminar "${item.title}"?`)) return
    setDeleting(true)
    try {
      await supabase.from(item.table).delete().eq('id', item.id)
      setSuccess('✅ Registro eliminado correctamente')
      setTimeout(() => setSuccess(null), 3000)
      await cargarHistorial(false)
    } catch (err: any) {
      setError(err.message || 'Error al eliminar')
      setTimeout(() => setError(null), 3000)
    } finally {
      setDeleting(false)
    }
  }

  const eliminarSeleccionados = async () => {
    if (!confirm(`¿Estás seguro de eliminar ${selectedItems.size} registro(s) seleccionados?`)) return
    setDeleting(true)
    try {
      const ids = Array.from(selectedItems)
      const citasIds = ids.filter(id => historial.find(h => h.id === id)?.table === 'appointments')
      const clientesIds = ids.filter(id => historial.find(h => h.id === id)?.table === 'clients')

      if (citasIds.length > 0) await supabase.from('appointments').delete().in('id', citasIds)
      if (clientesIds.length > 0) await supabase.from('clients').delete().in('id', clientesIds)

      setSuccess(`${selectedItems.size} registros eliminados correctamente`)
      setTimeout(() => setSuccess(null), 3000)
      await cargarHistorial(false)
    } catch (err: any) {
      setError(err.message || 'Error al eliminar los registros')
      setTimeout(() => setError(null), 3000)
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
      <div className={`flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden ${isDark ? 'bg-[#150D08]' : 'bg-[#FDFBF9]'}`}>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[100px] pointer-events-none" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-[#D4AF37]/20 shadow-2xl">
          <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
          <p className="text-xs font-black tracking-[0.2em] text-[#C9A96E] uppercase animate-pulse">
            Cargando Historial...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-16 relative overflow-hidden ${isDark ? 'bg-[#150D08] text-[#FFF9F6]' : 'bg-[#FDFBF9] text-[#1A0E0A]'}`}>
      
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#EC4899]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 relative z-10 pt-4">
        
        {/* ============================================================ */}
        {/* CABECERA HERO BANNER CON COMPONENTES KPI INTEGRADOS */}
        {/* ============================================================ */}
        <div className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ${
          isDark 
            ? 'bg-gradient-to-br from-[#271810] via-[#1E120C] to-[#160E09] border-[#3D281E] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]' 
            : 'bg-gradient-to-br from-white via-[#FBF7F4] to-[#F5ECE5] border-[#EADED5] shadow-[0_25px_50px_-15px_rgba(225,208,195,0.4)]'
        }`}>
          <div className="absolute -top-40 -right-40 w-[300px] h-[300px] bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

          <div className="relative z-10 p-6 md:p-8 space-y-6">
            
            {/* Fila del Título y Acciones */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[9px] font-black uppercase tracking-[0.25em] text-[#C9A96E]">
                  <Sparkles className="w-2.5 h-2.5" />
                  ✦ Registro General
                </div>
                <h1 className={`font-serif text-2xl md:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                  Historial de Actividad
                </h1>
                <p className={`text-xs ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                  Monitorea el flujo de citas y nuevos clientes registrados en el sistema.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button 
                  onClick={() => cargarHistorial(false)} 
                  disabled={refreshing} 
                  className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all border flex items-center gap-2 ${
                    isDark ? 'bg-[#291A11] border-[#3D281E] text-[#BCAEA5] hover:text-white' : 'bg-[#FAF6F2] border-[#EADED5] text-[#6E5A4D] hover:text-[#1A0E0A]'
                  }`}
                  title="Sincronizar historial"
                >
                  <RefreshCw className={`w-4 h-4 text-[#C9A96E] ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>

                {selectedItems.size > 0 && (
                  <button 
                    onClick={eliminarSeleccionados} 
                    disabled={deleting} 
                    className="px-5 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase tracking-[0.15em] transition-all shadow-xl flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar ({selectedItems.size})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Fila de Contenedores de Estado (Incrustados e Indestructibles) */}
            <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 p-3 rounded-2xl border ${
              isDark ? 'bg-[#150D08]/60 border-[#3D281E]/70' : 'bg-[#FAF6F2]/60 border-[#EADED5]/70'
            }`}>
              
              {/* Eventos */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#C9A96E] border border-[#D4AF37]/20 shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[9px] font-black uppercase tracking-wider truncate ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>Total Eventos</p>
                  <h3 className={`text-sm md:text-base font-extrabold truncate ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>{stats.totalEventos}</h3>
                </div>
              </div>

              {/* Citas */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[9px] font-black uppercase tracking-wider truncate ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>Total Citas</p>
                  <h3 className={`text-sm md:text-base font-extrabold truncate ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>{stats.totalCitas}</h3>
                </div>
              </div>

              {/* Clientes */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-[#EC4899]/10 text-[#EC4899] border border-[#EC4899]/20 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[9px] font-black uppercase tracking-wider truncate ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>Total Clientes</p>
                  <h3 className={`text-sm md:text-base font-extrabold truncate ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>{stats.totalClientes}</h3>
                </div>
              </div>

              {/* Ingresos */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[9px] font-black uppercase tracking-wider truncate ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>Ingresos Totales</p>
                  <h3 className={`text-sm md:text-base font-extrabold truncate text-emerald-500`}>${stats.totalIngresos.toLocaleString()}</h3>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* MENSAJES */}
        {success && (
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isDark ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p className="text-xs font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isDark ? 'bg-rose-950/20 border-rose-900/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-xs font-medium">{error}</p>
          </div>
        )}

        {/* ============================================================ */}
        {/* FILTROS — RESPONSIVE (CON WRAP) */}
        {/* ============================================================ */}
        <div className={`p-4 rounded-3xl border flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between ${
          isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5] shadow-sm'
        }`}>
          
          {/* Buscador */}
          <div className={`w-full xl:w-72 p-3 rounded-2xl border flex items-center gap-3 transition-all duration-300 shrink-0 ${
            isDark ? 'bg-[#150D08] border-[#3D281E]' : 'bg-[#FAF6F2] border-[#EADED5]'
          }`}>
            <Search className="w-4 h-4 text-[#C9A96E] shrink-0" />
            <input 
              type="text" 
              placeholder="Buscar en el historial..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className={`bg-transparent border-none outline-none text-xs w-full ${
                isDark ? 'text-white placeholder-[#8A766A]' : 'text-[#1A0E0A] placeholder-[#A39081]'
              }`}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-[#C9A96E] hover:underline shrink-0">Limpiar</button>
            )}
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
            
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)} 
              className={`px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer ${
                isDark ? 'bg-[#150D08] border-[#3D281E] text-white' : 'bg-[#FAF6F2] border-[#EADED5] text-[#1A0E0A]'
              }`}
            >
              <option value="todos">Tipos</option>
              <option value="cita">Citas</option>
              <option value="cliente">Clientes</option>
            </select>

            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)} 
              className={`px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer ${
                isDark ? 'bg-[#150D08] border-[#3D281E] text-white' : 'bg-[#FAF6F2] border-[#EADED5] text-[#1A0E0A]'
              }`}
            >
              <option value="todos">Estados</option>
              {estadosDisponibles.map(est => <option key={est} value={est}>{est}</option>)}
            </select>

            <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(e.target.value)} 
              className={`px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer ${
                isDark ? 'bg-[#150D08] border-[#3D281E] text-white' : 'bg-[#FAF6F2] border-[#EADED5] text-[#1A0E0A]'
              }`}
            >
              <option value="todos">Meses</option>
              {mesesDisponibles.map(m => (
                <option key={m} value={m}>{format(new Date(m + '-01'), 'MMM yyyy', { locale: es })}</option>
              ))}
            </select>

            <button 
              onClick={toggleSelectAll} 
              className={`px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider border transition-all ${
                isDark ? 'bg-[#291A11] border-[#3D281E] text-[#BCAEA5] hover:text-white' : 'bg-[#FAF6F2] border-[#EADED5] text-[#6E5A4D] hover:text-[#1A0E0A]'
              }`}
            >
              {selectAll ? 'Deseleccionar' : 'Seleccionar'}
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* LISTA DE REGISTROS */}
        {/* ============================================================ */}
        <div className="space-y-3">
          {paginatedItems.length === 0 ? (
            <div className={`text-center py-16 border border-dashed rounded-3xl ${
              isDark ? 'border-[#3D281E] bg-[#1E120C]/30 text-[#BCAEA5]' : 'border-[#EADED5] bg-white/50 text-[#6E5A4D]'
            }`}>
              <div className="flex flex-col items-center gap-3">
                <History className="w-10 h-10 text-[#C9A96E]/60" />
                <p className="text-xs font-bold uppercase tracking-wider">No se encontraron registros en el historial</p>
              </div>
            </div>
          ) : (
            paginatedItems.map((item, index) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.cita
              const IconComponent = config.icon
              const isSelected = selectedItems.has(item.id)

              return (
                <div 
                  key={`${item.id}-${index}`} 
                  className={`group relative rounded-3xl border p-4 transition-all duration-300 flex items-center gap-3 ${
                    isSelected 
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-md' 
                      : isDark 
                        ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#D4AF37]/40' 
                        : 'bg-white border-[#EADED5] hover:border-[#D4AF37]/40 shadow-sm'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => toggleSelect(item.id)} 
                    className="w-4 h-4 accent-[#D4AF37] cursor-pointer shrink-0" 
                  />
                  
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${config.bg} ${config.border}`}>
                    <IconComponent className={`w-4 h-4 ${config.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                        {item.title}
                      </h4>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${config.bg} ${config.color} ${config.border}`}>
                        {config.label}
                      </span>
                      <span className={`text-[9px] ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>
                        {format(new Date(item.date), 'dd/MM/yy')}
                      </span>
                      {item.type === 'cita' && item.amount !== undefined && item.amount > 0 && (
                        <span className="text-[10px] font-mono font-bold text-[#D4AF37]">
                          ${item.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] truncate ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                      {item.description}
                    </p>
                  </div>

                  <span className={`text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${
                    isDark ? 'bg-[#150D08] border-[#3D281E] text-[#BCAEA5]' : 'bg-[#FAF6F2] border-[#EADED5] text-[#6E5A4D]'
                  }`}>
                    {item.status}
                  </span>

                  <button 
                    onClick={() => eliminarIndividual(item)} 
                    className={`p-2 rounded-xl border transition-all shrink-0 ${
                      isDark 
                        ? 'bg-[#150D08] border-[#3D281E] text-[#8A766A] hover:text-rose-400 hover:border-rose-500/30' 
                        : 'bg-[#FAF6F2] border-[#EADED5] text-[#A39081] hover:text-rose-500 hover:border-rose-500/30'
                    }`}
                    title="Eliminar este registro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* ============================================================ */}
        {/* PAGINADOR */}
        {/* ============================================================ */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between p-4 rounded-3xl border ${
            isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5] shadow-sm'
          }`}>
            <p className={`text-xs ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
              Página <span className="font-bold">{currentPage}</span> de <span className="font-bold">{totalPages}</span> ({filtered.length} ítems)
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)} 
                className={`p-2.5 rounded-2xl border disabled:opacity-30 transition-all ${
                  isDark ? 'bg-[#150D08] border-[#3D281E] text-white hover:bg-[#291A11]' : 'bg-[#FAF6F2] border-[#EADED5] text-[#1A0E0A] hover:bg-[#F0E4DA]'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => p + 1)} 
                className={`p-2.5 rounded-2xl border disabled:opacity-30 transition-all ${
                  isDark ? 'bg-[#150D08] border-[#3D281E] text-white hover:bg-[#291A11]' : 'bg-[#FAF6F2] border-[#EADED5] text-[#1A0E0A] hover:bg-[#F0E4DA]'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
