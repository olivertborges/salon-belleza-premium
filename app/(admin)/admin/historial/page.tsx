// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  History, CheckCircle2, Clock, Search,
  User, DollarSign, TrendingUp,
  RefreshCw, X, Calendar, Users,
  AlertCircle, Trash2, Filter
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { es } from 'date-fns/locale'

interface HistorialItem {
  id: string
  type: 'cita' | 'cliente'
  title: string
  description: string
  date: string
  amount?: number
  status: string
  table: 'appointments' | 'clients'
}

const TYPE_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  bg: string; 
  icon: React.ComponentType<{ className?: string }> 
}> = {
  cita: { 
    label: 'Cita', 
    color: 'text-[#D4AF37]', 
    bg: 'bg-[#D4AF37]/10', 
    icon: CheckCircle2 
  },
  cliente: { 
    label: 'Cliente', 
    color: 'text-[#EC4899]', 
    bg: 'bg-[#EC4899]/10', 
    icon: User 
  }
}

export default function HistorialPage() {
  const { settings } = useSettings()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [filtered, setFiltered] = useState<HistorialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const [filterMonth, setFilterMonth] = useState<string>('todos')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // ============================================================
  // PALETA DE COLORES - DORADO PROTAGONISTA
  // ============================================================
  const gold = '#D4AF37'
  const goldLight = '#E8D5A0'
  const goldDark = '#C9A96E'
  const pink = '#EC4899'
  const blue = '#3B82F6'

  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${gold}, ${goldLight}, ${gold})`
  }

  const headerGradient = {
    backgroundImage: `linear-gradient(135deg, ${gold} 0%, ${goldDark} 50%, ${goldLight} 100%)`
  }

  const mesesDisponibles = () => {
    const meses = new Set<string>()
    historial.forEach(item => {
      const fecha = new Date(item.date)
      meses.add(format(fecha, 'yyyy-MM'))
    })
    return Array.from(meses).sort().reverse()
  }

  useEffect(() => {
    cargarHistorial()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [historial, search, filterType, filterMonth])

  const aplicarFiltros = () => {
    let result = [...historial]

    if (search.trim() !== '') {
      const q = search.toLowerCase().trim()
      result = result.filter(item => 
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      )
    }

    if (filterType !== 'todos') {
      result = result.filter(item => item.type === filterType)
    }

    if (filterMonth !== 'todos') {
      result = result.filter(item => {
        const fecha = new Date(item.date)
        return format(fecha, 'yyyy-MM') === filterMonth
      })
    }

    setFiltered(result)
  }

  const cargarHistorial = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const items: HistorialItem[] = []

      const { data: citas } = await supabase
        .from('appointments')
        .select(`
          id, total_price, date, time, status,
          clients:client_id (name),
          services:service_id (name)
        `)
        .order('date', { ascending: false })
        .limit(50)

      if (citas) {
        const statusMap: Record<string, string> = {
          pending: 'Pendiente',
          confirmed: 'Confirmada',
          in_progress: 'En curso',
          completed: 'Completada',
          cancelled: 'Cancelada'
        }
        citas.forEach((c: any) => {
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

      const { data: clientes } = await supabase
        .from('clients')
        .select('id, name, email, phone, created_at')
        .order('created_at', { ascending: false })
        .limit(30)

      if (clientes) {
        clientes.forEach((c) => {
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
      setSuccess('Historial actualizado')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error cargando historial:', err)
      setError(err.message || 'Error de sincronización')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    cargarHistorial(true)
  }

  const eliminarSeleccionados = async () => {
    if (selectedItems.size === 0) {
      setError('No hay registros seleccionados')
      setTimeout(() => setError(null), 3000)
      return
    }

    if (!confirm(`¿Eliminar ${selectedItems.size} registro(s) seleccionados?`)) return

    setDeleting(true)
    setError(null)

    try {
      const ids = Array.from(selectedItems)
      
      const citasIds = ids.filter(id => {
        const item = historial.find(h => h.id === id)
        return item?.table === 'appointments'
      })
      
      const clientesIds = ids.filter(id => {
        const item = historial.find(h => h.id === id)
        return item?.table === 'clients'
      })

      if (citasIds.length > 0) {
        const { error: err1 } = await supabase
          .from('appointments')
          .delete()
          .in('id', citasIds)
        if (err1) throw err1
      }

      if (clientesIds.length > 0) {
        const { error: err2 } = await supabase
          .from('clients')
          .delete()
          .in('id', clientesIds)
        if (err2) throw err2
      }

      setSuccess(`✅ ${selectedItems.size} registro(s) eliminados`)
      setTimeout(() => setSuccess(null), 3000)
      await cargarHistorial(false)
    } catch (err: any) {
      setError(err.message || 'Error al eliminar')
      setTimeout(() => setError(null), 3000)
    } finally {
      setDeleting(false)
    }
  }

  const eliminarMes = async (month: string) => {
    if (!confirm(`¿Eliminar TODOS los registros de ${format(new Date(month + '-01'), 'MMMM yyyy', { locale: es })}?`)) return

    setDeleting(true)
    setError(null)

    try {
      const itemsToDelete = historial.filter(item => {
        const fecha = new Date(item.date)
        return format(fecha, 'yyyy-MM') === month
      })

      if (itemsToDelete.length === 0) return

      const citasIds = itemsToDelete
        .filter(item => item.table === 'appointments')
        .map(item => item.id)

      const clientesIds = itemsToDelete
        .filter(item => item.table === 'clients')
        .map(item => item.id)

      if (citasIds.length > 0) {
        const { error: err1 } = await supabase
          .from('appointments')
          .delete()
          .in('id', citasIds)
        if (err1) throw err1
      }

      if (clientesIds.length > 0) {
        const { error: err2 } = await supabase
          .from('clients')
          .delete()
          .in('id', clientesIds)
        if (err2) throw err2
      }

      setSuccess(`✅ ${itemsToDelete.length} registros de ${format(new Date(month + '-01'), 'MMMM yyyy', { locale: es })} eliminados`)
      setTimeout(() => setSuccess(null), 3000)
      await cargarHistorial(false)
    } catch (err: any) {
      setError(err.message || 'Error al eliminar')
      setTimeout(() => setError(null), 3000)
    } finally {
      setDeleting(false)
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedItems)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedItems(newSet)
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set())
    } else {
      const ids = new Set(filtered.map(item => item.id))
      setSelectedItems(ids)
    }
    setSelectAll(!selectAll)
  }

  const totalEventos = historial.length
  const totalCitas = historial.filter(i => i.type === 'cita').length
  const totalClientes = historial.filter(i => i.type === 'cliente').length
  const totalIngresos = historial
    .filter(i => i.amount && i.amount > 0)
    .reduce((sum, i) => sum + (i.amount || 0), 0)

  const meses = mesesDisponibles()

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-500 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
            <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
          </div>
          <p className={`text-[10px] tracking-[0.4em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]/60'}`}>
            Cargando historial...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-8 relative overflow-x-hidden ${isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'}`}>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-6xl mx-auto px-4 space-y-5 relative z-10">

        {/* ============================================================ */}
        {/* CABECERA — TÍTULO DENTRO DE LA TARJETA SIN DESBORDAR */}
        {/* ============================================================ */}
        <div 
          className="relative overflow-hidden rounded-2xl p-5 md:p-6 shadow-xl text-white border border-white/10"
          style={headerGradient}
        >
          <div className="absolute top-0 right-0 w-60 h-60 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-serif font-black tracking-tight truncate">
                  Historial Fresh Nails
                </h1>
                <p className="text-[10px] text-white/70 font-medium">
                  {totalEventos} registros • {totalCitas} citas • {totalClientes} clientes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={handleRefresh} 
                disabled={refreshing} 
                className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95 shadow-lg"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {selectedItems.size > 0 && (
                <button 
                  onClick={eliminarSeleccionados}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? '...' : `${selectedItems.size}`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MENSAJES */}
        {/* ============================================================ */}
        {error && (
          <div className={`flex items-start gap-3 border p-3 rounded-xl transition-all duration-300 ${isDark ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#D4AF37]/30 text-[#1A0E0A]'}`}>
            <AlertCircle className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <p className="text-xs font-light">{error}</p>
          </div>
        )}

        {success && (
          <div className={`flex items-start gap-3 border p-3 rounded-xl transition-all duration-300 ${isDark ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#D4AF37]/30 text-[#1A0E0A]'}`}>
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <p className="text-xs font-light">{success}</p>
          </div>
        )}

        {/* ============================================================ */}
        {/* KPIS — COMPACTOS */}
        {/* ============================================================ */}
        <div className="grid grid-cols-4 gap-2">
          <div className={`rounded-xl p-2 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-[#D4AF37]" />
              <div>
                <p className={`text-[6px] font-mono uppercase tracking-wider font-black ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Total</p>
                <p className={`text-xs font-black ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{totalEventos}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-2 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              <div>
                <p className={`text-[6px] font-mono uppercase tracking-wider font-black ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Citas</p>
                <p className="text-xs font-black text-[#D4AF37]">{totalCitas}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-2 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#EC4899]" />
              <div>
                <p className={`text-[6px] font-mono uppercase tracking-wider font-black ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Clientes</p>
                <p className="text-xs font-black text-[#EC4899]">{totalClientes}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-2 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
              <div>
                <p className={`text-[6px] font-mono uppercase tracking-wider font-black ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Ingresos</p>
                <p className="text-xs font-black text-[#D4AF37]">${totalIngresos.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* FILTROS — EN UNA SOLA LÍNEA */}
        {/* ============================================================ */}
        <div className={`flex flex-wrap items-center gap-2 p-2 rounded-xl border shadow-sm transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
          {/* Buscador */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[100px]">
            <Search className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`bg-transparent border-none outline-none text-[11px] w-full font-medium ${isDark ? 'text-[#FFF9F6] placeholder:text-[#A89588]' : 'text-[#1A0E0A] placeholder:text-[#A89588]'}`}
            />
            {search && (
              <button onClick={() => setSearch('')} className={`p-0.5 rounded ${isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#F0E4DA]'}`}>
                <X className={`w-3 h-3 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
              </button>
            )}
          </div>

          <div className="w-px h-5 bg-[#F0E4DA] dark:bg-[#3D281E]" />

          {/* Filtro Tipo */}
          <div className="flex items-center gap-1">
            <Filter className={`w-3 h-3 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
            {['todos', 'cita', 'cliente'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all ${
                  filterType === f
                    ? 'bg-[#D4AF37] text-[#1A0E0A]'
                    : isDark ? 'text-[#A89588] hover:text-[#FFF9F6]' : 'text-[#5C4A3E] hover:text-[#1A0E0A]'
                }`}
              >
                {f === 'todos' ? 'Todo' : f === 'cita' ? 'Citas' : 'Clientes'}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-[#F0E4DA] dark:bg-[#3D281E]" />

          {/* Filtro Mes */}
          <div className="flex items-center gap-1">
            <Calendar className={`w-3 h-3 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className={`bg-transparent border-none outline-none text-[8px] font-black uppercase tracking-wider ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}
            >
              <option value="todos">Todos</option>
              {meses.map((m) => (
                <option key={m} value={m}>
                  {format(new Date(m + '-01'), 'MMM yyyy', { locale: es })}
                </option>
              ))}
            </select>
            {filterMonth !== 'todos' && (
              <button 
                onClick={() => eliminarMes(filterMonth)}
                className="p-0.5 rounded hover:bg-rose-500/20 text-rose-500 transition-all"
                title="Eliminar todos los registros de este mes"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Selector de selección */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={toggleSelectAll}
              className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-wider transition-all ${isDark ? 'bg-[#3D281E] text-[#A89588] hover:bg-[#4A3227]' : 'bg-[#F0E4DA] text-[#5C4A3E] hover:bg-[#E8DDD4]'}`}
            >
              {selectAll ? 'Deseleccionar' : 'Seleccionar todo'}
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* LISTA DE HISTORIAL */}
        {/* ============================================================ */}
        <div className="relative space-y-2">
          {filtered.length === 0 ? (
            <div className={`text-center py-8 border border-dashed rounded-xl text-xs ${isDark ? 'bg-[#2A1B14]/40 border-[#3D281E] text-[#A89588]' : 'bg-white border-[#F0E4DA] text-[#5C4A3E]'}`}>
              No se encontraron registros
            </div>
          ) : (
            filtered.map((item, index) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.cita
              const IconComponent = config.icon
              const isCita = item.type === 'cita'
              const isSelected = selectedItems.has(item.id)

              return (
                <div 
                  key={`${item.id}-${index}`} 
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 ${
                    isSelected 
                      ? isDark ? 'bg-[#D4AF37]/20 border-[#D4AF37]' : 'bg-[#D4AF37]/10 border-[#D4AF37]'
                      : isDark ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/30' : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/30'
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(item.id)}
                    className="w-3.5 h-3.5 rounded border-[#D4AF37] text-[#D4AF37] focus:ring-0 cursor-pointer"
                  />

                  {/* Icono */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                    <IconComponent className={`w-3.5 h-3.5 ${config.color}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-[11px] font-medium truncate ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                        {item.title}
                      </h4>
                      <span className={`text-[6px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                      <span className={`text-[6px] font-mono px-1.5 py-0.5 rounded border ${isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E]'}`}>
                        {format(new Date(item.date), 'dd/MM/yy')}
                      </span>
                      {isCita && item.amount && item.amount > 0 && (
                        <span className="text-[9px] font-bold text-[#D4AF37]">
                          ${item.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className={`text-[9px] truncate ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                      {item.description}
                    </p>
                  </div>

                  {/* Status */}
                  <span className={`text-[6px] font-mono font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E]'}`}>
                    {item.status}
                  </span>

                  {/* Eliminar individual */}
                  <button
                    onClick={() => {
                      const itemToDelete = historial.find(h => h.id === item.id)
                      if (!itemToDelete) return
                      if (!confirm(`¿Eliminar "${item.title}"?`)) return
                      
                      const table = itemToDelete.table
                      supabase
                        .from(table)
                        .delete()
                        .eq('id', item.id)
                        .then(() => {
                          setSuccess('✅ Registro eliminado')
                          setTimeout(() => setSuccess(null), 3000)
                          cargarHistorial(false)
                        })
                        .catch(() => {
                          setError('Error al eliminar')
                          setTimeout(() => setError(null), 3000)
                        })
                    }}
                    className="p-1 rounded hover:bg-rose-500/20 text-rose-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )
            })
          )}
        </div>

      </div>

      <style jsx global>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>

    </div>
  )
}