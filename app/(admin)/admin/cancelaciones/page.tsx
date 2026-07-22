'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  XCircle, Calendar, User, Scissors, Search, 
  Clock, DollarSign, ArrowRight, Trash2,
  RefreshCw, X, CheckCircle2, Users, TrendingDown,
  AlertCircle, PlusCircle
} from 'lucide-react'

interface CitaCancelada {
  id: string
  client_id: string
  professional_id: string
  service_id: string
  date: string
  time: string
  status: string
  notes: string
  total_price: number
  cancelled_at: string
  clients: { name: string; email: string; phone: string }
  services: { name: string; price: number; duration: number }
  staff: { name: string } | null
}

export default function CancelacionesPage() {
  const { settings } = useSettings()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'

  const [citas, setCitas] = useState<CitaCancelada[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
  }

  const primaryBgStyle = { backgroundColor: primaryColor }

  const fetchCancelaciones = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients:client_id (id, name, email, phone),
          services:service_id (id, name, price, duration)
        `)
        .eq('status', 'cancelled')
        .order('date', { ascending: false })

      if (error) throw error

      let citasConStaff: any[] = []

      if (data && data.length > 0) {
        const staffIds = data
          .map((c: any) => c.professional_id)
          .filter((id: any) => id)

        let staffMap: Record<string, { name: string }> = {}
        if (staffIds.length > 0) {
          const { data: staffData } = await supabase
            .from('staff')
            .select('id, name')
            .in('id', staffIds)

          if (staffData) {
            staffMap = (staffData as any[]).reduce((acc: any, s: any) => ({ ...acc, [s.id]: { name: s.name } }), {})
          }
        }

        citasConStaff = data.map((cita: any) => ({
          ...cita,
          staff: cita.professional_id ? staffMap[cita.professional_id] || null : null
        }))
      }

      setCitas(citasConStaff)
      setSuccess('Cancelaciones actualizadas correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error cargando cancelaciones:', err)
      setError(err.message || 'Error al cargar las cancelaciones')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCancelaciones()
  }, [])

  const handleRefresh = () => {
    fetchCancelaciones(true)
  }

  const eliminarCita = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar permanentemente esta cita cancelada?')) return

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

      if (error) throw error

      setCitas(prev => prev.filter(c => c.id !== id))
      setSuccess('Cita eliminada permanentemente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error eliminando cita:', err)
      setError(err.message || 'Error al eliminar la cita')
      setTimeout(() => setError(null), 3000)
    }
  }

  const filtrarPorFecha = (fecha: string) => {
    setFilterDate(fecha)
  }

  const citasFiltradas = citas.filter(c => {
    const matchSearch = c.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
                        c.services?.name?.toLowerCase().includes(search.toLowerCase()) ||
                        c.id?.toLowerCase().includes(search.toLowerCase())
    const matchDate = filterDate ? c.date === filterDate : true
    return matchSearch && matchDate
  })

  const totalCanceladas = citas.length
  const totalPerdido = citas.reduce((sum, c) => sum + (c.total_price || 0), 0)
  const clientesAfectados = new Set(citas.map(c => c.client_id)).size

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute w-48 h-48 bg-amber-500/5 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite] delay-300" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
            <XCircle className="w-6 h-6 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-sm font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 animate-pulse">
              CARGANDO
            </p>
            <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              CANCELACIONES FRESH
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
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-black/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-pink-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Historial de Cancelaciones
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight drop-shadow-sm">
              Citas Canceladas
            </h1>
            <p className="text-xs md:text-sm text-pink-50/80 font-medium max-w-md">
              {totalCanceladas} citas canceladas registradas en el sistema.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <button 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95 shadow-lg"
              title="Actualizar Cancelaciones"
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
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <p className="text-xs text-stone-700 dark:text-rose-400 font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-xs text-stone-700 dark:text-emerald-400 font-medium">{success}</p>
        </div>
      )}

      {/* ============================================================ */}
      {/* KPIS — 3 columnas responsivas */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl shrink-0" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
            <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Total Canceladas</p>
            <h3 className="text-sm sm:text-base font-mono font-black text-rose-500">{totalCanceladas}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Ingresos Perdidos</p>
            <h3 className="text-sm sm:text-base font-mono font-black text-rose-500">${totalPerdido.toLocaleString()}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Clientes Afectados</p>
            <h3 className="text-sm sm:text-base font-mono font-black text-amber-500">{clientesAfectados}</h3>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FILTROS */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-3 p-3 rounded-2xl border shadow-sm flex-1 bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
          <Search className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
          <input 
            type="text" 
            placeholder="Buscar por cliente, servicio o ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-stone-800 dark:text-pink-100 placeholder:text-stone-400 w-full"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="p-1 hover:bg-pink-100 dark:hover:bg-fuchsia-950/50 rounded-lg transition-colors shrink-0"
            >
              <XCircle className="w-4 h-4 text-stone-400" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="date"
            value={filterDate}
            onChange={(e) => filtrarPorFecha(e.target.value)}
            className="px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
          {filterDate && (
            <button 
              onClick={() => setFilterDate('')}
              className="px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-600 dark:text-stone-400 hover:bg-pink-50 dark:hover:bg-fuchsia-950/30 transition-all text-xs font-mono font-bold uppercase tracking-wider"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* LISTA DE CANCELACIONES — TARJETAS PREMIUM */}
      {/* ============================================================ */}
      <div className={`space-y-3 transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>
        {citasFiltradas.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-2xl font-mono text-stone-400 text-xs bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
            <XCircle className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
              {search || filterDate ? 'No hay cancelaciones con esos filtros' : 'No hay citas canceladas'}
            </p>
          </div>
        ) : (
          citasFiltradas.map((cita) => (
            <div 
              key={cita.id} 
              className={`group relative rounded-2xl border p-4 md:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isDark 
                  ? 'bg-[#130f24] border-fuchsia-950 hover:border-rose-800' 
                  : 'bg-white border-pink-100/60 hover:border-rose-300'
              }`}
            >
              {/* Línea lateral roja decorativa */}
              <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-rose-400 to-rose-600" />

              <div className="pl-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Columna izquierda */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isDark ? 'bg-rose-950/30 border border-rose-800' : 'bg-rose-50 border border-rose-100'
                  }`}>
                    <XCircle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold truncate text-stone-800 dark:text-pink-100">
                        {cita.clients?.name || 'Cliente'}
                      </h4>
                      <span className="text-[8px] font-mono tracking-wider px-2 py-0.5 rounded-full text-rose-600 dark:text-rose-400 uppercase font-bold bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                        Cancelada
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-stone-400 dark:text-stone-500">
                      <span className="flex items-center gap-1">
                        <Scissors className="w-3 h-3" />
                        {cita.services?.name || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {cita.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {cita.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {cita.staff?.name || 'Sin asignar'}
                      </span>
                    </div>
                    {cita.notes && (
                      <p className="text-[10px] text-stone-400/80 dark:text-stone-500/80 mt-1 italic line-clamp-1">
                        "{cita.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Columna derecha — Acciones */}
                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                  <span className="text-sm font-mono font-bold text-rose-500">
                    ${cita.total_price?.toLocaleString() || 0}
                  </span>
                  <button 
                    onClick={() => eliminarCita(cita.id)}
                    className={`p-1.5 rounded-xl border transition-all ${
                      isDark 
                        ? 'bg-[#0f0c1b] border-fuchsia-950 text-stone-400 hover:text-rose-400 hover:border-rose-800' 
                        : 'bg-white border-pink-100/60 text-stone-400 hover:text-rose-500 hover:border-rose-200'
                    }`}
                    title="Eliminar permanentemente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
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