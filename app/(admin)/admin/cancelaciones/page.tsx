'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  XCircle, Calendar, User, Scissors, Search, 
  Clock, DollarSign, ArrowRight, Trash2,
  RefreshCw
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
      setSuccess('Cita eliminada permanentemente')
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
      <div className={`relative overflow-hidden rounded-2xl border border-rose-500/20 p-6 shadow-xl animate-fade-up ${
        isDark 
          ? 'bg-gradient-to-br from-rose-950/20 via-zinc-900 to-zinc-950' 
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
            <h2 className="text-2xl font-serif italic mt-1 text-zinc-900 dark:text-zinc-50">
              Citas <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">Canceladas</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Historial de citas canceladas y pérdidas asociadas.</p>
          </div>
          <button 
            onClick={fetchCancelaciones}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-lg shadow-rose-600/20 self-start sm:self-auto active:scale-[0.99]"
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className={`rounded-2xl border p-5 flex items-center justify-between hover:border-rose-500/30 transition-all hover:scale-[1.02] ${
          isDark ? 'bg-zinc-900 border-zinc-800/80' : 'bg-white border-stone-200'
        }`}>
          <div>
            <p className="text-stone-400 dark:text-stone-500 text-[10px] font-mono uppercase tracking-wider">Total Canceladas</p>
            <span className="text-2xl font-mono font-bold text-rose-600 dark:text-rose-400 block mt-1">{totalCanceladas}</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className={`rounded-2xl border p-5 flex items-center justify-between hover:border-rose-500/30 transition-all hover:scale-[1.02] ${
          isDark ? 'bg-zinc-900 border-zinc-800/80' : 'bg-white border-stone-200'
        }`}>
          <div>
            <p className="text-stone-400 dark:text-stone-500 text-[10px] font-mono uppercase tracking-wider">Ingresos Perdidos</p>
            <span className="text-2xl font-mono font-bold text-rose-600 dark:text-rose-400 block mt-1">
              ${totalPerdido.toLocaleString()}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className={`rounded-2xl border p-5 flex items-center justify-between hover:border-rose-500/30 transition-all hover:scale-[1.02] ${
          isDark ? 'bg-zinc-900 border-zinc-800/80' : 'bg-white border-stone-200'
        }`}>
          <div>
            <p className="text-stone-400 dark:text-stone-500 text-[10px] font-mono uppercase tracking-wider">Clientes Afectados</p>
            <span className="text-2xl font-mono font-bold text-stone-800 dark:text-zinc-100 block mt-1">
              {clientesAfectados}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-stone-100 dark:bg-zinc-950/40 border border-stone-200 dark:border-zinc-800 text-stone-500 dark:text-stone-400">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTROS CON EFECTOS */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-up">
        <div className={`flex items-center border rounded-xl px-3 py-2.5 flex-1 transition-all focus-within:border-rose-500/50 focus-within:shadow-lg focus-within:shadow-rose-500/5 ${
          isDark ? 'bg-zinc-950/40 border-zinc-800' : 'bg-stone-50 border-stone-200'
        }`}>
          <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, servicio o ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`bg-transparent border-none outline-none text-xs placeholder-stone-400 dark:placeholder-stone-500 w-full ml-2 ${
              isDark ? 'text-stone-200' : 'text-stone-800'
            }`}
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors"
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
            className={`border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-rose-500/30 transition-all ${
              isDark 
                ? 'bg-zinc-950/40 border-zinc-800 text-stone-200' 
                : 'bg-stone-50 border-stone-200 text-stone-800'
            }`}
          />
          {filterDate && (
            <button 
              onClick={() => setFilterDate('')}
              className={`px-3 py-2.5 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider transition-all hover:scale-105 ${
                isDark 
                  ? 'bg-zinc-950/40 border-zinc-800 text-stone-400 hover:text-stone-200' 
                  : 'bg-stone-50 border-stone-200 text-stone-500 hover:text-stone-800'
              }`}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* LISTA DE CANCELACIONES CON CARD-GLOW */}
      <div className="space-y-3">
        {citasFiltradas.length === 0 ? (
          <div className={`text-center py-16 border border-dashed rounded-xl font-mono text-xs ${
            isDark ? 'border-zinc-800 bg-zinc-900/20 text-stone-500' : 'border-stone-200 bg-stone-50/50 text-stone-400'
          }`}>
            {search || filterDate ? 'No hay cancelaciones con esos filtros' : 'No hay citas canceladas'}
          </div>
        ) : (
          citasFiltradas.map((cita) => (
            <div 
              key={cita.id} 
              className={`rounded-xl p-4 border transition-all hover:border-rose-500/30 hover:scale-[1.01] duration-300 ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800/80 hover:bg-zinc-900/40' 
                  : 'bg-white border-stone-200 hover:bg-stone-50/60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm font-bold truncate ${
                        isDark ? 'text-stone-200' : 'text-stone-800'
                      }`}>
                        {cita.clients?.name || 'Cliente'}
                      </h4>
                      <span className="text-[8px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 uppercase font-bold">
                        Cancelada
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-stone-400 dark:text-stone-500">
                      <span className="flex items-center gap-1">
                        <Scissors className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                        {cita.services?.name || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                        {cita.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                        {cita.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                        {cita.staff?.name || 'Sin asignar'}
                      </span>
                    </div>
                    {cita.notes && (
                      <p className="text-[10px] text-stone-400/80 dark:text-stone-500/80 mt-1 italic">"{cita.notes}"</p>
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
                        ? 'bg-zinc-950/40 border-zinc-800 text-stone-400 hover:text-rose-400 hover:border-rose-500/20' 
                        : 'bg-pink-50/30 border-pink-100/40 text-stone-500 hover:text-rose-600 hover:border-rose-500/20'
                    }`}
                    title="Eliminar permanentemente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button className={`p-1.5 rounded-lg border transition-all hover:scale-110 ${
                    isDark 
                      ? 'bg-zinc-950/40 border-zinc-800 text-stone-400 hover:text-zinc-200' 
                      : 'bg-pink-50/30 border-pink-100/40 text-stone-500 hover:text-stone-800'
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
