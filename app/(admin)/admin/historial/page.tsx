'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  History, ShoppingBag, CheckCircle2, Clock, Search,
  ArrowRight, User, GraduationCap, DollarSign
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
  cita: { label: 'Cita', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/[0.08] dark:bg-emerald-500/[0.04]', border: 'border-emerald-500/20 hover:border-emerald-500/40', glow: 'hover:shadow-emerald-500/[0.03]', icon: CheckCircle2 },
  venta: { label: 'Venta', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/[0.08] dark:bg-violet-500/[0.04]', border: 'border-violet-500/20 hover:border-violet-500/40', glow: 'hover:shadow-violet-500/[0.03]', icon: ShoppingBag },
  curso: { label: 'Curso', color: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-500/[0.08] dark:bg-fuchsia-500/[0.04]', border: 'border-fuchsia-500/20 hover:border-fuchsia-500/40', glow: 'hover:shadow-fuchsia-500/[0.03]', icon: GraduationCap },
  cliente: { label: 'Cliente', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/[0.08] dark:bg-cyan-500/[0.04]', border: 'border-cyan-500/20 hover:border-cyan-500/40', glow: 'hover:shadow-cyan-500/[0.03]', icon: User },
  pago: { label: 'Pago', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/[0.08] dark:bg-amber-500/[0.04]', border: 'border-amber-500/20 hover:border-amber-500/40', glow: 'hover:shadow-amber-500/[0.03]', icon: DollarSign }
}

export default function HistorialPage() {
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
            description: `Servicio: ${c.services?.name || 'N/A'} — Módulo horario: ${c.time}`,
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
            title: `Venta procesada con éxito`,
            description: `Cierre de caja y salida de inventario`,
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
            title: `Curso dictado: ${c.title}`,
            description: `Instructor: ${c.instructor} • Graduados: ${c.enrolled} alumnos`,
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
            title: `Alta de nuevo cliente: ${c.name}`,
            description: `Contacto: ${c.email || 'Sin Correo'} • Tel: ${c.phone || 'Sin Teléfono'}`,
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
      <div className="flex h-96 flex-col items-center justify-center font-mono text-xs tracking-[0.25em] text-amber-500/80 gap-3">
        <div className="w-5 h-5 border border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        SYNC_ACTIVITY_LOGS...
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 sm:px-0">
      
      {/* HEADER DE LUXE - AMBER BORDER & RADIAL GLOW */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/[0.06] via-card to-card border border-amber-500/20 p-6 shadow-xl shadow-amber-500/[0.01]">
        <div className="absolute top-0 right-0 w-56 h-56 bg-amber-500/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 font-mono font-bold">📜 Auditoría General</p>
            <h2 className="text-2xl font-serif italic text-foreground tracking-wide">Historial del Sistema</h2>
            <p className="text-xs text-mutedForeground">Línea de tiempo consolidada con los flujos operativos de la academia y el salón.</p>
          </div>
          <button 
            onClick={cargarHistorial}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-amber-500/20 hover:border-amber-500/40 text-amber-700 dark:text-amber-400 text-xs font-mono font-medium transition-all duration-300 shadow-md hover:shadow-amber-500/[0.05] self-start sm:self-auto active:scale-95"
          >
            <History className="w-3.5 h-3.5" />
            SINC_LOGS
          </button>
        </div>
      </div>

      {/* METRICAS AVANZADAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['todos', 'cita', 'venta', 'cliente'] as const).map((type) => {
          const count = type === 'todos' ? historial.length : historial.filter(i => i.type === type).length
          const label = type === 'todos' ? 'Eventos Totales' : (TYPE_CONFIG[type]?.label + 's')
          const colorClass = type === 'todos' ? 'text-amber-600 dark:text-amber-400' : TYPE_CONFIG[type].color

          return (
            <div key={type} className="relative overflow-hidden rounded-xl bg-card border border-border/80 p-4 transition-all duration-300 hover:border-amber-500/20 hover:shadow-md hover:shadow-amber-500/[0.01] group">
              <div className="absolute top-0 left-0 w-1 h-full bg-border group-hover:bg-amber-500/20 transition-all duration-300" />
              <p className="text-[9px] text-mutedForeground font-mono uppercase tracking-[0.15em] pl-1">{label}</p>
              <span className={`text-2xl font-mono font-bold block mt-1 pl-1 tracking-tight ${colorClass}`}>
                {count.toString().padStart(2, '0')}
              </span>
            </div>
          )
        })}
      </div>

      {/* ÁREA DE CONTROLES Y FILTRADO */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center bg-card border border-border rounded-xl px-3.5 py-2.5 flex-1 focus-within:border-amber-500/30 transition-all duration-300 shadow-sm">
          <Search className="w-4 h-4 text-mutedForeground/60 shrink-0" />
          <input 
            type="text" 
            placeholder="Filtrar por registros, nombres o referencias..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-foreground placeholder-mutedForeground/50 w-full ml-3 font-sans"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border/40 md:border-none">
          {['todos', 'cita', 'venta', 'curso', 'cliente'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-mono font-medium border transition-all duration-300 whitespace-nowrap ${
                filterType === type
                  ? 'bg-amber-500/[0.08] border-amber-500/40 text-amber-700 dark:text-amber-400 shadow-sm shadow-amber-500/[0.03]'
                  : 'bg-card border-border text-mutedForeground hover:text-foreground hover:border-border-strong'
              }`}
            >
              {type === 'todos' ? 'VER_TODO' : TYPE_CONFIG[type]?.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* TIMELINE DE HISTORIAL RE-DISEÑADO */}
      <div className="relative space-y-4 pl-2 sm:pl-6 before:absolute before:left-[18px] sm:before:left-[34px] before:top-3 before:bottom-3 before:w-[1px] before:bg-gradient-to-b before:from-border before:via-border before:to-transparent">
        {error && (
          <div className="text-center py-4 border border-rose-500/20 bg-rose-500/[0.02] text-rose-600 dark:text-rose-400 rounded-xl font-mono text-xs shadow-inner">
            EXEC_ERROR: {error}
          </div>
        )}

        {filtrados.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl font-mono text-mutedForeground/60 text-xs tracking-wide bg-card/40">
            NO_LOGS_FOUND: Criterio sin coincidencias en el bloque activo.
          </div>
        ) : (
          filtrados.map((item, index) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.cita
            const IconComponent = config.icon

            return (
              <div 
                key={`${item.id}-${index}`} 
                className={`relative bg-card border border-border/90 rounded-xl p-4 transition-all duration-300 hover:-translate-y-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${config.glow} hover:border-amber-500/20 group`}
              >
                {/* Indicador de Línea de Tiempo Acoplado */}
                <div className="absolute left-[-18px] sm:left-[-34px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-border border border-card group-hover:bg-amber-500 group-hover:scale-125 transition-all duration-300 z-10 hidden sm:block" />

                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Avatar/Contenedor del Icono Estilizado */}
                  <div className={`w-9 h-9 rounded-xl ${config.bg} border ${config.border.split(' ')[0]} flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-inner`}>
                    <span className={config.color}><IconComponent className="w-4 h-4" /></span>
                  </div>
                  
                  {/* Textos y Etiquetas */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-xs font-semibold text-foreground tracking-wide truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{item.title}</h4>
                      <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-md border ${config.bg} ${config.color} ${config.border} uppercase tracking-wider`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-mutedForeground truncate font-sans tracking-normal">{item.description}</p>
                    
                    {/* Timestamp Metadatos */}
                    <div className="flex items-center gap-4 pt-1.5 text-[10px] text-mutedForeground font-mono">
                      <span className="flex items-center gap-1.5 bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
                        <Clock className="w-3 h-3 text-mutedForeground/60" />
                        {new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      {item.amount !== undefined && item.amount > 0 && (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02] border border-emerald-500/10 px-2 py-0.5 rounded-md">
                          ${item.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones y Estatus Final */}
                <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-border/40 sm:border-none pt-3 sm:pt-0">
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border bg-muted/50 border-border text-mutedForeground tracking-wider uppercase">
                    {item.status}
                  </span>
                  <button className="p-1.5 rounded-xl bg-muted/40 border border-border/60 hover:border-amber-500/30 text-mutedForeground hover:text-amber-500 transition-all duration-300 shadow-sm">
                    <ArrowRight className="w-4 h-4" />
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
