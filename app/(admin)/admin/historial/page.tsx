'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  History, Calendar, Users, DollarSign, BookOpen, 
  ShoppingBag, CheckCircle2, Clock, Filter, Search,
  ArrowRight, User, Scissors, Package, GraduationCap
} from 'lucide-react'

interface HistorialItem {
  id: string
  type: 'cita' | 'venta' | 'curso' | 'cliente' | 'pago'
  title: string
  description: string
  date: string
  amount?: number
  status: string
  icon: JSX.Element
  color: string
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
          *,
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
            description: `Servicio: ${c.services?.name || 'N/A'} - ${c.time}`,
            date: c.date,
            amount: c.total_price || 0,
            status: 'Completada',
            icon: <CheckCircle2 className="w-4 h-4" />,
            color: 'text-emerald-400'
          })
        })
      }

      // 2. Ventas de productos
      const { data: ventas } = await supabase
        .from('sales')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10)

      if (ventas) {
        ventas.forEach((v: any) => {
          items.push({
            id: v.id,
            type: 'venta',
            title: `Venta realizada`,
            description: `Total: $${v.total?.toLocaleString()}`,
            date: v.created_at,
            amount: v.total || 0,
            status: 'Completada',
            icon: <ShoppingBag className="w-4 h-4" />,
            color: 'text-violet-400'
          })
        })
      }

      // 3. Cursos finalizados
      const { data: cursos } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'Finalizado')
        .order('start_date', { ascending: false })
        .limit(10)

      if (cursos) {
        cursos.forEach((c: any) => {
          items.push({
            id: c.id,
            type: 'curso',
            title: `Curso finalizado: ${c.title}`,
            description: `Instructor: ${c.instructor} - ${c.enrolled} alumnos`,
            date: c.start_date,
            amount: c.price || 0,
            status: 'Finalizado',
            icon: <GraduationCap className="w-4 h-4" />,
            color: 'text-fuchsia-400'
          })
        })
      }

      // 4. Clientes nuevos
      const { data: clientes } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (clientes) {
        clientes.forEach((c: any) => {
          items.push({
            id: c.id,
            type: 'cliente',
            title: `Nuevo cliente: ${c.name}`,
            description: `Email: ${c.email || 'N/A'} - Tel: ${c.phone || 'N/A'}`,
            date: c.created_at,
            amount: 0,
            status: 'Registrado',
            icon: <User className="w-4 h-4" />,
            color: 'text-cyan-400'
          })
        })
      }

      // Ordenar por fecha (más reciente primero)
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setHistorial(items.slice(0, 30))
    } catch (err: any) {
      console.error('Error cargando historial:', err)
      setError(err.message || 'Error al cargar el historial')
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

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      cita: 'Citas',
      venta: 'Ventas',
      curso: 'Cursos',
      cliente: 'Clientes',
      pago: 'Pagos'
    }
    return labels[type] || type
  }

  const getTypeBadge = (type: string) => {
    const config: Record<string, { color: string, bg: string }> = {
      cita: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
      venta: { color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
      curso: { color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10 border-fuchsia-500/20' },
      cliente: { color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
      pago: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' }
    }
    return config[type] || config.cita
  }

  if (loading) {
    return <div className="flex h-96 items-center justify-center font-mono text-xs text-rose-400">Cargando historial...</div>
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/40 via-stone-900/40 to-[#0e0c0b] border border-amber-500/20 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-mono">📜 Registro de Actividad</p>
            <h2 className="text-2xl font-serif italic text-white mt-1">Historial</h2>
            <p className="text-xs text-stone-400 mt-1">Todos los eventos importantes del salón en un solo lugar.</p>
          </div>
          <button 
            onClick={cargarHistorial}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-all shadow-lg shadow-amber-600/10 self-start sm:self-auto"
          >
            <History className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-stone-900/30 border border-stone-900 p-3 text-center">
          <p className="text-[8px] text-stone-500 font-mono uppercase tracking-wider">Total Eventos</p>
          <span className="text-xl font-mono font-bold text-stone-100 block">{historial.length}</span>
        </div>
        <div className="rounded-xl bg-stone-900/30 border border-stone-900 p-3 text-center">
          <p className="text-[8px] text-stone-500 font-mono uppercase tracking-wider">Citas</p>
          <span className="text-xl font-mono font-bold text-emerald-400 block">
            {historial.filter(i => i.type === 'cita').length}
          </span>
        </div>
        <div className="rounded-xl bg-stone-900/30 border border-stone-900 p-3 text-center">
          <p className="text-[8px] text-stone-500 font-mono uppercase tracking-wider">Ventas</p>
          <span className="text-xl font-mono font-bold text-violet-400 block">
            {historial.filter(i => i.type === 'venta').length}
          </span>
        </div>
        <div className="rounded-xl bg-stone-900/30 border border-stone-900 p-3 text-center">
          <p className="text-[8px] text-stone-500 font-mono uppercase tracking-wider">Clientes Nuevos</p>
          <span className="text-xl font-mono font-bold text-cyan-400 block">
            {historial.filter(i => i.type === 'cliente').length}
          </span>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center bg-stone-900/40 border border-stone-900 rounded-xl px-3 py-2.5 flex-1">
          <Search className="w-4 h-4 text-stone-500 shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar en el historial..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-stone-200 placeholder-stone-500 w-full ml-2"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['todos', 'cita', 'venta', 'curso', 'cliente'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all whitespace-nowrap ${
                filterType === type
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                  : 'bg-transparent border-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-900/30'
              }`}
            >
              {type === 'todos' ? 'Todos' : getTypeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE HISTORIAL */}
      <div className="space-y-2">
        {filtrados.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-stone-900 rounded-xl font-mono text-stone-500 text-xs">
            No hay eventos en el historial
          </div>
        ) : (
          filtrados.map((item, index) => {
            const badge = getTypeBadge(item.type)
            return (
              <div 
                key={`${item.id}-${index}`} 
                className="bg-[#0e0c0b] border border-stone-900 rounded-xl p-4 hover:border-amber-500/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center ${item.color} flex-shrink-0`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-medium text-white truncate">{item.title}</h4>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full border ${badge.bg} ${badge.color}`}>
                        {getTypeLabel(item.type)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 truncate">{item.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-[10px] text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      {item.amount && item.amount > 0 && (
                        <span className="font-mono font-bold text-emerald-400">
                          ${item.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className={`text-[9px] px-2 py-1 rounded-full border ${badge.bg} ${badge.color}`}>
                    {item.status}
                  </span>
                  <button className="p-1 rounded-lg hover:bg-stone-900 transition-all text-stone-500 hover:text-stone-300">
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
