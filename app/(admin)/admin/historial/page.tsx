// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { 
  History, CheckCircle2, Clock, Search,
  ArrowRight, User, DollarSign, Sparkles,
  RefreshCw, X, TrendingUp, Calendar, Users,
  Plus
} from 'lucide-react'

// ✅ TIPOS SIMPLIFICADOS - Solo Citas y Clientes
interface HistorialItem {
  id: string
  type: 'cita' | 'cliente'
  title: string
  description: string
  date: string
  amount?: number
  status: string
}

// ✅ SOLO 2 CONFIGURACIONES
const TYPE_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  bg: string; 
  icon: React.ComponentType<{ className?: string }> 
}> = {
  cita: { 
    label: 'Cita', 
    color: 'text-pink-600 dark:text-pink-400', 
    bg: 'bg-pink-500/10 dark:bg-pink-500/5', 
    icon: CheckCircle2 
  },
  cliente: { 
    label: 'Cliente', 
    color: 'text-amber-600 dark:text-amber-400', 
    bg: 'bg-amber-500/10 dark:bg-amber-500/5', 
    icon: User 
  }
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

  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'

  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
  }

  const primaryBgStyle = { backgroundColor: primaryColor }

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

      // 1. ✅ CITAS COMPLETADAS
      const { data: citas } = await supabase
        .from('appointments')
        .select(`
          id, total_price, date, time, status,
          clients:client_id (name),
          services:service_id (name)
        `)
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .limit(20)

      if (citas) {
        citas.forEach((c: any) => {
          items.push({
            id: c.id,
            type: 'cita',
            title: `Cita completada: ${c.clients?.name || 'Cliente'}`,
            description: `${c.services?.name || 'Servicio'} — ${c.time || '--:--'}`,
            date: `${c.date}T12:00:00`,
            amount: c.total_price || 0,
            status: 'Completada'
          })
        })
      }

      // 2. ✅ CLIENTES NUEVOS
      const { data: clientes } = await supabase
        .from('clients')
        .select('id, name, email, phone, created_at')
        .order('created_at', { ascending: false })
        .limit(20)

      if (clientes) {
        clientes.forEach((c) => {
          items.push({
            id: c.id,
            type: 'cliente',
            title: `Nueva clienta: ${c.name}`,
            description: `Email: ${c.email || 'No registrado'} • Tel: ${c.phone || 'No registrado'}`,
            date: c.created_at,
            amount: 0,
            status: 'Registrada'
          })
        })
      }

      // Ordenar por fecha (más reciente primero)
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

  // ✅ FILTROS SIMPLIFICADOS
  const filtrados = historial.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                        item.description.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'todos' || item.type === filterType
    return matchSearch && matchType
  })

  // ✅ KPIS SIMPLIFICADOS
  const totalEventos = historial.length
  const totalCitas = historial.filter(i => i.type === 'cita').length
  const totalClientes = historial.filter(i => i.type === 'cliente').length
  const totalIngresos = historial
    .filter(i => i.amount && i.amount > 0)
    .reduce((sum, i) => sum + (i.amount || 0), 0)

  // ✅ FILTROS SIMPLIFICADOS (solo 3 opciones)
  const filtros = [
    { id: 'todos', label: 'VER TODO' },
    { id: 'cita', label: 'CITAS' },
    { id: 'cliente', label: 'CLIENTES' }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute w-48 h-48 bg-amber-500/5 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite] delay-300" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
            <History className="w-6 h-6 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-sm font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 animate-pulse">
              CARGANDO
            </p>
            <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              HISTORIAL FRESH
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span 
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-pink-500/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1 max-w-6xl mx-auto">

      {/* ============================================================ */}
      {/* CABECERA PRINCIPAL — IDÉNTICA AL DASHBOARD */}
      {/* ============================================================ */}
      <div 
        className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl text-white border border-white/10"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, #EF4444 100%)`
        }}
      >
        {/* Efecto de Luces y Brillos de Fondo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-black/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Textos Principales */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-pink-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Auditoría del Sistema
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight drop-shadow-sm">
              Historial Fresh Nails
            </h1>
            <p className="text-xs md:text-sm text-pink-50/80 font-medium max-w-md">
              Registro cronológico de citas completadas y nuevas clientas del salón.
            </p>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <button 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95 shadow-lg"
              title="Actualizar Historial"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MENSAJES */}
      {/* ============================================================ */}
      {error && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-rose-500/10 to-pink-500/5 border border-rose-500/20 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
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

      {/* ============================================================ */}
      {/* KPIS SIMPLIFICADOS - 4 columnas responsivas */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl shrink-0" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Total</p>
            <h3 className="text-sm sm:text-base font-mono font-black text-stone-900 dark:text-pink-100">{totalEventos}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-pink-500/10 text-pink-500 shrink-0">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Citas</p>
            <h3 className="text-sm sm:text-base font-mono font-black text-pink-500">{totalCitas}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Clientes</p>
            <h3 className="text-sm sm:text-base font-mono font-black text-amber-500">{totalClientes}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Ingresos</p>
            <h3 className="text-sm sm:text-base font-mono font-black text-emerald-500">${totalIngresos.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FILTROS Y BUSCADOR - SIMPLIFICADO */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-3 p-3 rounded-2xl border flex-1 bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 shadow-sm">
          <Search className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
          <input 
            type="text" 
            placeholder="Buscar por cliente, servicio o descripción..." 
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

        {/* ✅ FILTROS SIMPLIFICADOS - solo 3 opciones */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {filtros.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-mono font-bold transition-all duration-300 whitespace-nowrap ${
                filterType === f.id
                  ? 'text-white shadow-md'
                  : 'bg-white dark:bg-[#130f24] border border-pink-100/60 dark:border-fuchsia-950 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-pink-100 hover:border-pink-200'
              }`}
              style={filterType === f.id ? brandGradient : {}}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* LISTA DE HISTORIAL - LÍNEA DE TIEMPO */}
      {/* ============================================================ */}
      <div className="relative space-y-3 pl-2 sm:pl-6 before:absolute before:left-[18px] sm:before:left-[34px] before:top-3 before:bottom-3 before:w-[1px] before:bg-gradient-to-b before:from-pink-200/60 dark:before:from-fuchsia-950/60 before:to-transparent">
        {filtrados.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-2xl font-mono text-stone-400 text-xs bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
            No se encontraron registros en este segmento.
          </div>
        ) : (
          filtrados.map((item, index) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.cita
            const IconComponent = config.icon
            const isCita = item.type === 'cita'

            return (
              <div 
                key={`${item.id}-${index}`} 
                className={`relative border rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 hover:border-pink-300 dark:hover:border-fuchsia-800`}
              >
                {/* Timeline Node */}
                <div className={`absolute left-[-18px] sm:left-[-34px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border transition-all duration-300 hidden sm:block ${
                  isCita 
                    ? 'bg-pink-500 border-pink-300 dark:border-fuchsia-800' 
                    : 'bg-amber-500 border-amber-300 dark:border-fuchsia-800'
                }`} />

                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Icono */}
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${config.bg} bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950`}>
                    <span className={config.color}><IconComponent className="w-4 h-4" /></span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-xs font-bold text-stone-800 dark:text-pink-100 truncate group-hover:text-pink-500 transition-colors">
                        {item.title}
                      </h4>
                      <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-pink-200/60 truncate">{item.description}</p>

                    {/* Meta tags */}
                    <div className="flex items-center gap-3 pt-1 text-[10px] text-stone-400 dark:text-stone-500 font-mono">
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        {new Date(item.date).toLocaleDateString('es-ES', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </span>
                      {isCita && item.amount && item.amount > 0 && (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">
                          ${item.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between sm:justify-end gap-3 border-t pt-2.5 sm:pt-0 sm:border-t-0 border-pink-100/60 dark:border-fuchsia-950/50">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-500 dark:text-pink-300`}>
                    {item.status}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ============================================================ */}
      {/* STYLES GLOBALES */}
      {/* ============================================================ */}
      <style jsx global>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>

    </div>
  )
}