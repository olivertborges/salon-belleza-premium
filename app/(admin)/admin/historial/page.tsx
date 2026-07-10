'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { 
  History, ShoppingBag, CheckCircle2, Clock, Search,
  ArrowRight, User, GraduationCap, DollarSign, Sparkles,
  RefreshCw, X, TrendingUp, Calendar, Users, Package
} from 'lucide-react'

interface HistorialItem {
  id: string
  type: 'cita' | 'venta' | 'curso' | 'cliente' | 'pago'
  title: string
  description: string
  date: string
  amount?: number
  status: string
}

const TYPE_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  bg: string; 
  border: string;
  icon: React.ComponentType<{ className?: string }> 
}> = {
  cita: { label: 'Cita', color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500/[0.08] dark:bg-pink-500/[0.04]', border: 'border-pink-500/20 hover:border-pink-500/40', icon: CheckCircle2 },
  venta: { label: 'Venta', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/[0.08] dark:bg-rose-500/[0.04]', border: 'border-rose-500/20 hover:border-rose-500/40', icon: ShoppingBag },
  curso: { label: 'Curso', color: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-500/[0.08] dark:bg-fuchsia-500/[0.04]', border: 'border-fuchsia-500/20 hover:border-fuchsia-500/40', icon: GraduationCap },
  cliente: { label: 'Cliente', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/[0.08] dark:bg-amber-500/[0.04]', border: 'border-amber-500/20 hover:border-amber-500/40', icon: User },
  pago: { label: 'Pago', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/[0.08] dark:bg-emerald-500/[0.04]', border: 'border-emerald-500/20 hover:border-emerald-500/40', icon: DollarSign }
}

export default function HistorialPage() {
  const { settings } = useSettings()

  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

  useEffect(() => {
    cargarHistorial()
  }, [])

  const cargarHistorial = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)

    try {
      const items: HistorialItem[] = []

      // 1. Citas completadas
      const { data: citas } = await supabase
        .from('appointments')
        .select(`
          id, total_price, date, time, status,
          clients:client_id (name),
          services:service_id (name)
        `)
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .limit(10)

      if (citas) {
        citas.forEach((c: any) => {
          items.push({
            id: c.id,
            type: 'cita',
            title: `Cita completada: ${c.clients?.name || 'Cliente'}`,
            description: `Servicio: ${c.services?.name || 'N/A'} — ${c.time}`,
            date: `${c.date}T12:00:00`,
            amount: c.total_price || 0,
            status: 'Completada'
          })
        })
      }

      // 2. Ventas de productos
      const { data: ventas } = await supabase
        .from('sales')
        .select('id, total, created_at, status')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10)

      if (ventas) {
        ventas.forEach((v) => {
          items.push({
            id: v.id,
            type: 'venta',
            title: `Venta realizada con éxito`,
            description: `Cierre de caja e inventario saliente`,
            date: v.created_at,
            amount: v.total || 0,
            status: 'Completada'
          })
        })
      }

      // 3. Cursos finalizados
      const { data: cursos } = await supabase
        .from('courses')
        .select('id, title, instructor, enrolled, price, start_date, status')
        .eq('status', 'Finalizado')
        .order('start_date', { ascending: false })
        .limit(10)

      if (cursos) {
        cursos.forEach((c) => {
          items.push({
            id: c.id,
            type: 'curso',
            title: `Curso finalizado: ${c.title}`,
            description: `Instructor: ${c.instructor} • ${c.enrolled} alumnos graduados`,
            date: c.start_date,
            amount: c.price || 0,
            status: 'Finalizado'
          })
        })
      }

      // 4. Clientes nuevos
      const { data: clientes } = await supabase
        .from('clients')
        .select('id, name, email, phone, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      if (clientes) {
        clientes.forEach((c) => {
          items.push({
            id: c.id,
            type: 'cliente',
            title: `Nueva clienta registrada: ${c.name}`,
            description: `Email: ${c.email || 'N/A'} • Tel: ${c.phone || 'N/A'}`,
            date: c.created_at,
            amount: 0,
            status: 'Registrado'
          })
        })
      }

      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setHistorial(items)
      setSuccess('Historial actualizado correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error cargando historial:', err)
      setError(err.message || 'Error de sincronización con la base de datos')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    cargarHistorial(true)
  }

  const filtrados = historial.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                        item.description.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'todos' || item.type === filterType
    return matchSearch && matchType
  })

  // Estadísticas para KPIs
  const totalEventos = historial.length
  const totalCitas = historial.filter(i => i.type === 'cita').length
  const totalVentas = historial.filter(i => i.type === 'venta').length
  const totalClientes = historial.filter(i => i.type === 'cliente').length
  const totalIngresos = historial
    .filter(i => i.amount && i.amount > 0)
    .reduce((sum, i) => sum + (i.amount || 0), 0)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: settings?.primary_color || '#DB5B9A' }}></div>
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse" style={{ color: settings?.primary_color || '#DB5B9A' }}>
          Sincronizando Auditoría...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1 max-w-6xl mx-auto">

      {/* HEADER CON GRADIENTE CONFIGURABLE */}
      <div className="relative overflow-hidden rounded-3xl p-[1px] shadow-xl" style={brandGradient}>
        <div className="absolute inset-0 opacity-20 animate-pulse" style={brandGradient} />
        <div className="relative z-10 rounded-[23px] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0f0c1b]">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3.5 rounded-2xl text-white shadow-md shrink-0" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}>
              <History className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold font-mono truncate" style={{ color: settings?.primary_color || '#DB5B9A' }}>
                📜 {settings?.business_name || 'Salón VIP'}
              </p>
              <h2 className="text-xl md:text-2xl font-serif font-extrabold text-stone-900 dark:text-white mt-0.5 truncate">
                Historial del Sistema
              </h2>
              <p className="text-xs text-stone-500 dark:text-pink-100/60 mt-0.5 truncate">
                Auditoría cronológica de eventos, facturación y altas en Fresh Nails.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto justify-end">
            <button 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className="px-3 py-2 rounded-xl bg-pink-50 dark:bg-fuchsia-950/40 border border-pink-100/60 dark:border-fuchsia-900/40 hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
              style={{ color: settings?.primary_color || '#DB5B9A' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Cargando...' : 'Actualizar'}</span>
              <span className="sm:hidden">{refreshing ? '...' : 'Act.'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MENSAJES DE ERROR/SUCCESS */}
      {error && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-rose-500/10 to-pink-500/5 border border-rose-500/20 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <X className="w-4 h-4" />
          </div>
          <p className="text-xs text-stone-700 dark:text-rose-400 font-medium min-w-0">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs text-stone-700 dark:text-emerald-400 font-medium min-w-0">{success}</p>
        </div>
      )}

      {/* KPIS MODERNOS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${settings?.primary_color || '#DB5B9A'}10`, color: settings?.primary_color || '#DB5B9A' }}>
            <History className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Total Eventos</p>
            <h3 className="text-sm font-mono font-black text-stone-900 dark:text-pink-100">{totalEventos}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Citas</p>
            <h3 className="text-sm font-mono font-black text-stone-900 dark:text-pink-100">{totalCitas}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Ventas</p>
            <h3 className="text-sm font-mono font-black text-stone-900 dark:text-pink-100">{totalVentas}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Ingresos</p>
            <h3 className="text-sm font-mono font-black text-emerald-500">${totalIngresos.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* FILTROS Y BUSCADOR */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-3 p-3 rounded-2xl border flex-1 bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 transition-all duration-300">
          <Search className="w-4 h-4 shrink-0" style={{ color: settings?.primary_color || '#DB5B9A' }} />
          <input 
            type="text" 
            placeholder="Filtrar eventos por cliente, descripción..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-stone-800 dark:text-pink-100 placeholder:text-stone-400 w-full"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="p-1 hover:bg-pink-100 dark:hover:bg-fuchsia-950/50 rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4 text-stone-400" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['todos', 'cita', 'venta', 'curso', 'cliente'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-mono font-bold transition-all duration-300 whitespace-nowrap ${
                filterType === type
                  ? 'text-white shadow-md'
                  : 'bg-white dark:bg-[#130f24] border border-pink-100/60 dark:border-fuchsia-950 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-pink-100 hover:border-pink-200'
              }`}
              style={filterType === type ? brandGradient : {}}
            >
              {type === 'todos' ? 'VER TODO' : TYPE_CONFIG[type]?.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA LÍNEA DE TIEMPO */}
      <div className={`relative space-y-3 pl-2 sm:pl-6 before:absolute before:left-[18px] sm:before:left-[34px] before:top-3 before:bottom-3 before:w-[1px] before:bg-gradient-to-b ${
        'before:from-pink-200/60 dark:before:from-fuchsia-950/60'
      } before:to-transparent`}>
        {filtrados.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-2xl font-mono text-stone-400 text-xs bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
            No se encontraron registros en este segmento.
          </div>
        ) : (
          filtrados.map((item, index) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.cita
            const IconComponent = config.icon

            return (
              <div 
                key={`${item.id}-${index}`} 
                className={`relative border rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 hover:border-pink-300 dark:hover:border-fuchsia-800`}
              >
                {/* Timeline Node Ring */}
                <div className={`absolute left-[-18px] sm:left-[-34px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border transition-all duration-300 hidden sm:block ${
                  'bg-white dark:bg-[#130f24] border-pink-300 dark:border-fuchsia-800 group-hover:bg-pink-500 group-hover:scale-125'
                }`} />

                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Icon Wrapper */}
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${config.bg} ${config.border.split(' ')[0]} bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950`}>
                    <span className={config.color}><IconComponent className="w-4 h-4" /></span>
                  </div>

                  {/* Info Block */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-xs font-bold text-stone-800 dark:text-pink-100 truncate group-hover:text-pink-500 transition-colors">{item.title}</h4>
                      <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${config.bg} ${config.color} ${config.border.split(' ')[0]}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-pink-200/60 truncate">{item.description}</p>

                    {/* Meta tags */}
                    <div className="flex items-center gap-3 pt-1 text-[10px] text-stone-400 dark:text-stone-500 font-mono">
                      <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950`}>
                        <Clock className="w-3 h-3 text-stone-400" />
                        {new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      {item.amount !== undefined && item.amount > 0 && (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/[0.04] px-1.5 py-0.5 rounded border border-emerald-500/10">
                          ${item.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badge & Action */}
                <div className={`flex items-center justify-between sm:justify-end gap-3 border-t pt-2.5 sm:pt-0 sm:border-t-0 border-pink-100/60 dark:border-fuchsia-950/50`}>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-500 dark:text-pink-300`}>
                    {item.status}
                  </span>
                  <button className={`p-1.5 rounded-xl border transition-all duration-300 bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 hover:border-pink-300 text-stone-400 hover:text-pink-500 dark:hover:text-pink-400`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}