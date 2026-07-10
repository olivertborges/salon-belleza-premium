'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  History, ShoppingBag, CheckCircle2, Clock, Search,
  ArrowRight, User, GraduationCap, DollarSign, Sparkles
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
  glow: string;
  icon: React.ComponentType<{ className?: string }> 
}> = {
  cita: { label: 'Cita', color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500/[0.08] dark:bg-pink-500/[0.04]', border: 'border-pink-500/20 hover:border-pink-500/40', glow: 'hover:shadow-pink-500/[0.03]', icon: CheckCircle2 },
  venta: { label: 'Venta', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/[0.08] dark:bg-rose-500/[0.04]', border: 'border-rose-500/20 hover:border-rose-500/40', glow: 'hover:shadow-rose-500/[0.03]', icon: ShoppingBag },
  curso: { label: 'Curso', color: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-500/[0.08] dark:bg-fuchsia-500/[0.04]', border: 'border-fuchsia-500/20 hover:border-fuchsia-500/40', glow: 'hover:shadow-fuchsia-500/[0.03]', icon: GraduationCap },
  cliente: { label: 'Cliente', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/[0.08] dark:bg-amber-500/[0.04]', border: 'border-amber-500/20 hover:border-amber-500/40', glow: 'hover:shadow-amber-500/[0.03]', icon: User },
  pago: { label: 'Pago', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/[0.08] dark:bg-emerald-500/[0.04]', border: 'border-emerald-500/20 hover:border-emerald-500/40', glow: 'hover:shadow-emerald-500/[0.03]', icon: DollarSign }
}

export default function HistorialPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarHistorial()
  }, [])

  const cargarHistorial = async () => {
    setLoading(true)
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
    } catch (err: any) {
      console.error('Error cargando historial:', err)
      setError(err.message || 'Error de sincronización con la base de datos')
    } finally {
      setLoading(false)
    }
  }

  const filtrados = historial.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                        item.description.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'todos' || item.type === filterType
    return matchSearch && matchType
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-pink-600/80 dark:text-pink-400/80 font-mono text-xs uppercase tracking-widest animate-pulse">Sincronizando Auditoría...</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 p-1 max-w-6xl mx-auto ${isDark ? 'text-pink-100' : 'text-stone-800'}`}>

      {/* BIENVENIDA / HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 p-[1px] shadow-xl shadow-pink-500/10">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-transparent to-amber-400/20 animate-pulse" />
        <div className={`relative z-10 rounded-[23px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-pink-500 dark:text-pink-400 font-bold font-mono">📜 Registro Operativo General</p>
              <h2 className="text-2xl font-serif font-extrabold bg-gradient-to-r from-stone-900 via-pink-900 to-rose-800 bg-clip-text text-transparent dark:from-white dark:to-pink-200 mt-0.5">
                Historial del Sistema
              </h2>
              <p className="text-xs text-stone-500 dark:text-pink-200/60 mt-0.5">Auditoría cronológica de eventos, facturación y altas en Fresh Nails.</p>
            </div>
          </div>

          <button 
            onClick={cargarHistorial}
            className={`px-3 py-2 rounded-xl border hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold self-start md:self-auto ${
              isDark 
                ? 'bg-zinc-800/40 text-pink-400 border-zinc-700/60 hover:border-pink-500/40' 
                : 'bg-pink-50 text-pink-600 border-pink-100/60 hover:bg-pink-100/50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Actualizar Registro
          </button>
        </div>
      </div>

      {/* MÉTRICAS VIVAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['todos', 'cita', 'venta', 'cliente'] as const).map((type) => {
          const count = type === 'todos' ? historial.length : historial.filter(i => i.type === type).length
          const label = type === 'todos' ? 'Eventos Totales' : (TYPE_CONFIG[type]?.label + 's')
          const colorGradient = type === 'todos' 
            ? 'from-pink-600 to-rose-600 dark:from-pink-400 dark:to-pink-100' 
            : type === 'cita' ? 'from-pink-500 to-pink-600'
            : type === 'venta' ? 'from-rose-500 to-rose-600'
            : 'from-amber-500 to-amber-600'

          return (
            <div 
              key={type} 
              className={`rounded-2xl border p-4 shadow-sm hover:shadow-pink-500/5 hover:-translate-y-0.5 transition-all group relative overflow-hidden ${
                isDark ? 'bg-zinc-900 border-zinc-800/80' : 'bg-white border-pink-100/60'
              }`}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-pink-500/[0.03] to-transparent rounded-bl-full" />
              <p className="text-stone-400 dark:text-stone-500 text-[9px] font-bold uppercase tracking-wider">{label}</p>
              <span className={`text-3xl font-mono font-bold block bg-gradient-to-r ${colorGradient} bg-clip-text text-transparent mt-1`}>
                {count.toString().padStart(2, '0')}
              </span>
            </div>
          )
        })}
      </div>

      {/* FILTROS Y BUSCADOR */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className={`flex items-center border rounded-xl px-3.5 py-2.5 flex-1 transition-all duration-300 shadow-sm ${
          isDark ? 'bg-zinc-900 border-zinc-800/80 focus-within:border-pink-500/40' : 'bg-white border-pink-100/60 focus-within:border-pink-500/30'
        }`}>
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Filtrar eventos por cliente, descripción..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-stone-800 dark:text-pink-100 placeholder-stone-400 w-full ml-3 font-sans"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['todos', 'cita', 'venta', 'curso', 'cliente'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-mono font-bold transition-all duration-300 whitespace-nowrap ${
                filterType === type
                  ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
                  : isDark
                    ? 'bg-zinc-900 border border-zinc-800 text-stone-400 hover:text-pink-200 hover:border-zinc-700'
                    : 'bg-white border border-pink-100/60 text-stone-500 hover:text-stone-800 hover:border-pink-200'
              }`}
            >
              {type === 'todos' ? 'VER_TODO' : TYPE_CONFIG[type]?.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA LÍNEA DE TIEMPO */}
      <div className={`relative space-y-3 pl-2 sm:pl-6 before:absolute before:left-[18px] sm:before:left-[34px] before:top-3 before:bottom-3 before:w-[1px] before:bg-gradient-to-b ${
        isDark ? 'before:from-zinc-800' : 'before:from-pink-100'
      } before:to-transparent`}>
        {error && (
          <div className="text-center py-4 border border-rose-500/20 bg-rose-500/[0.02] text-rose-600 dark:text-rose-400 rounded-xl font-mono text-xs">
            ERROR_LOG: {error}
          </div>
        )}

        {filtrados.length === 0 ? (
          <div className={`text-center py-12 border border-dashed rounded-2xl font-mono text-stone-400 text-xs ${
            isDark ? 'border-zinc-800' : 'border-pink-100'
          }`}>
            No se encontraron registros en este segmento.
          </div>
        ) : (
          filtrados.map((item, index) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.cita
            const IconComponent = config.icon

            return (
              <div 
                key={`${item.id}-${index}`} 
                className={`relative border rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm group ${config.glow} ${
                  isDark ? 'bg-zinc-900 border-zinc-800/80 hover:border-zinc-700' : 'bg-white border-pink-100/40 hover:border-pink-300'
                }`}
              >
                {/* Timeline Node Ring */}
                <div className={`absolute left-[-18px] sm:left-[-34px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border group-hover:bg-pink-500 group-hover:scale-125 transition-all duration-300 hidden sm:block ${
                  isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-pink-100 border-white'
                }`} />

                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Icon Wrapper */}
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${config.bg} ${config.border.split(' ')[0]}`}>
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
                    <p className="text-xs text-stone-500 dark:text-pink-200/60 truncate font-sans">{item.description}</p>

                    {/* Meta tags */}
                    <div className="flex items-center gap-3 pt-1 text-[10px] text-stone-400 dark:text-stone-500 font-mono">
                      <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${
                        isDark ? 'bg-zinc-800/40 border-zinc-700/50' : 'bg-pink-50/50 border-pink-100/30'
                      }`}>
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
                <div className={`flex items-center justify-between sm:justify-end gap-3 border-t pt-2.5 sm:pt-0 sm:border-t-0 ${
                  isDark ? 'border-zinc-800/60' : 'border-pink-50'
                }`}>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                    isDark ? 'bg-zinc-800/40 border-zinc-700 text-pink-300' : 'bg-pink-50/50 border-pink-100/40 text-stone-500'
                  }`}>
                    {item.status}
                  </span>
                  <button className={`p-1.5 rounded-xl border transition-all duration-300 ${
                    isDark 
                      ? 'bg-zinc-800/20 border-zinc-800 hover:border-pink-500/40 text-stone-400 hover:text-pink-400' 
                      : 'bg-pink-50/50 border-pink-100/60 hover:border-pink-300 text-stone-400 hover:text-pink-500'
                  }`}>
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
