'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  XCircle, Calendar, User, Scissors, Search, 
  Filter, Clock, DollarSign, ArrowRight, Trash2,
  RefreshCw, AlertCircle
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
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const [citas, setCitas] = useState<CitaCancelada[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchCancelaciones = async () => {
    setLoading(true)
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

      let citasConStaff = data || []
      
      if (data && data.length > 0) {
        const staffIds = data
          .map(c => c.professional_id)
          .filter(id => id)

        let staffMap: Record<string, { name: string }> = {}
        if (staffIds.length > 0) {
          const { data: staffData } = await supabase
            .from('staff')
            .select('id, name')
            .in('id', staffIds)

          if (staffData) {
            staffMap = staffData.reduce((acc, s) => ({ ...acc, [s.id]: { name: s.name } }), {})
          }
        }

        citasConStaff = data.map(cita => ({
          ...cita,
          staff: cita.professional_id ? staffMap[cita.professional_id] || null : null
        }))
      }

      setCitas(citasConStaff)
    } catch (err: any) {
      console.error('Error cargando cancelaciones:', err)
      setError(err.message || 'Error al cargar las cancelaciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCancelaciones()
  }, [])

  const eliminarCita = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar permanentemente esta cita cancelada?')) return

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

      if (error) throw error

      setCitas(prev => prev.filter(c => c.id !== id))
      setSuccess('✅ Cita eliminada permanentemente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error eliminando cita:', err)
      setError(err.message || 'Error al eliminar la cita')
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
      <div className="flex h-96 items-center justify-center">
        <div className="relative">
          <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-8 h-8 border-3 border-rose-500/20 rounded-full animate-ping"></div>
        </div>
        <span className="ml-4 text-xs font-mono text-rose-500 animate-pulse">Cargando cancelaciones...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 transition-colors duration-300">

      {/* HEADER CON CARD-GLOW Y EFECTOS */}
      <div className={`card-glow relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500/[0.08] via-card to-card border border-rose-500/20 p-6 shadow-xl animate-fade-up ${
        isDark 
          ? 'bg-gradient-to-br from-rose-950/20 via-[#161311] to-[#0a0908]' 
          : 'bg-gradient-to-br from-rose-50/50 via-white to-stone-50'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-rose-600 dark:text-rose-400 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              ❌ Cancelaciones
            </p>
            <h2 className="text-2xl font-serif italic text-foreground mt-1">
              Citas <span className="text-shimmer">Canceladas</span>
            </h2>
            <p className="text-xs text-mutedForeground mt-1">Historial de citas canceladas y pérdidas asociadas.</p>
          </div>
          <button 
            onClick={fetchCancelaciones}
            className="glow-hover flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-medium transition-all shadow-lg shadow-rose-600/20 self-start sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* ALERTAS CON EFECTOS */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-600 dark:text-red-400 text-xs animate-fade-up">
          <p className="font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            ❌ {error}
          </p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-600 dark:text-emerald-400 text-xs animate-fade-up">
          <p className="font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ✅ {success}
          </p>
        </div>
      )}

      {/* MÉTRICAS CON CARD-GLOW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 stagger-children">
        <div className={`card-glow rounded-2xl bg-card border border-border p-5 flex items-center justify-between hover:border-rose-500/30 transition-all hover:scale-105 ${
          isDark ? 'bg-[#141211]' : 'bg-white'
        }`}>
          <div>
            <p className="text-mutedForeground text-xs font-medium uppercase tracking-wider">Total Canceladas</p>
            <span className="text-2xl font-mono font-bold text-rose-600 dark:text-rose-400 block mt-1">{totalCanceladas}</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className={`card-glow rounded-2xl bg-card border border-border p-5 flex items-center justify-between hover:border-rose-500/30 transition-all hover:scale-105 ${
          isDark ? 'bg-[#141211]' : 'bg-white'
        }`}>
          <div>
            <p className="text-mutedForeground text-xs font-medium uppercase tracking-wider">Ingresos Perdidos</p>
            <span className="text-2xl font-mono font-bold text-rose-600 dark:text-rose-400 block mt-1">
              ${totalPerdido.toLocaleString()}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className={`card-glow rounded-2xl bg-card border border-border p-5 flex items-center justify-between hover:border-rose-500/30 transition-all hover:scale-105 ${
          isDark ? 'bg-[#141211]' : 'bg-white'
        }`}>
          <div>
            <p className="text-mutedForeground text-xs font-medium uppercase tracking-wider">Clientes Afectados</p>
            <span className="text-2xl font-mono font-bold text-foreground block mt-1">
              {clientesAfectados}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-muted border border-border text-mutedForeground">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTROS CON EFECTOS */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-up delay-200">
        <div className={`flex items-center border rounded-xl px-3 py-2.5 flex-1 transition-all focus-within:border-rose-500/50 focus-within:shadow-lg focus-within:shadow-rose-500/5 ${
          isDark ? 'bg-stone-900/40 border-stone-800' : 'bg-stone-100 border-stone-200'
        }`}>
          <Search className="w-4 h-4 text-mutedForeground shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, servicio o ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`bg-transparent border-none outline-none text-xs text-foreground placeholder-mutedForeground w-full ml-2 ${
              isDark ? 'text-stone-200' : 'text-stone-800'
            }`}
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="text-mutedForeground hover:text-foreground transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="date"
            value={filterDate}
            onChange={(e) => filtrarPorFecha(e.target.value)}
            className={`border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-rose-500/30 transition-all ${
              isDark 
                ? 'bg-stone-900/40 border-stone-800 text-stone-200' 
                : 'bg-stone-100 border-stone-200 text-stone-800'
            }`}
          />
          {filterDate && (
            <button 
              onClick={() => setFilterDate('')}
              className={`px-3 py-2.5 rounded-xl border text-xs transition-all hover:scale-105 ${
                isDark 
                  ? 'bg-stone-900/40 border-stone-800 text-mutedForeground hover:text-foreground' 
                  : 'bg-stone-100 border-stone-200 text-mutedForeground hover:text-foreground'
              }`}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* LISTA DE CANCELACIONES CON CARD-GLOW */}
      <div className="space-y-3 stagger-children">
        {citasFiltradas.length === 0 ? (
          <div className={`text-center py-16 border border-dashed rounded-xl font-mono text-mutedForeground text-xs animate-fade-up ${
            isDark ? 'border-stone-800 bg-stone-950/10' : 'border-stone-200 bg-stone-50/50'
          }`}>
            {search || filterDate ? 'No hay cancelaciones con esos filtros' : 'No hay citas canceladas'}
          </div>
        ) : (
          citasFiltradas.map((cita, index) => (
            <div 
              key={cita.id} 
              className={`card-glow rounded-xl p-4 transition-all hover:border-rose-500/30 hover:scale-[1.01] animate-fade-up delay-${(index % 5) * 100} ${
                isDark 
                  ? 'bg-[#141211] border-stone-850 hover:bg-stone-900/40' 
                  : 'bg-white border-stone-200 hover:bg-stone-50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm font-medium truncate ${
                        isDark ? 'text-stone-200' : 'text-stone-800'
                      }`}>
                        {cita.clients?.name || 'Cliente'}
                      </h4>
                      <span className="text-[8px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                        Cancelada
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-mutedForeground">
                      <span className="flex items-center gap-1">
                        <Scissors className="w-3 h-3 text-mutedForeground/60" />
                        {cita.services?.name || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-mutedForeground/60" />
                        {cita.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-mutedForeground/60" />
                        {cita.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-mutedForeground/60" />
                        {cita.staff?.name || 'Sin asignar'}
                      </span>
                    </div>
                    {cita.notes && (
                      <p className="text-[10px] text-mutedForeground/80 mt-1 italic">"{cita.notes}"</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400">
                    ${cita.total_price?.toLocaleString() || 0}
                  </span>
                  <button 
                    onClick={() => eliminarCita(cita.id)}
                    className={`p-1.5 rounded-lg border transition-all hover:scale-110 ${
                      isDark 
                        ? 'bg-stone-900 border-stone-800 text-mutedForeground hover:text-rose-400 hover:border-rose-500/20' 
                        : 'bg-stone-100 border-stone-200 text-mutedForeground hover:text-rose-600 hover:border-rose-500/20'
                    }`}
                    title="Eliminar permanentemente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button className={`p-1.5 rounded-lg border transition-all hover:scale-110 ${
                    isDark 
                      ? 'bg-stone-900 border-stone-800 text-mutedForeground hover:text-foreground' 
                      : 'bg-stone-100 border-stone-200 text-mutedForeground hover:text-foreground'
                  }`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}