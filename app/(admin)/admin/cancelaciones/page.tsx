'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { 
  XCircle, Calendar, User, Scissors, Search, 
  Clock, DollarSign, ArrowRight, Trash2,
  RefreshCw, X, CheckCircle2, Users, TrendingDown
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

  const [citas, setCitas] = useState<CitaCancelada[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

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
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: settings?.primary_color || '#DB5B9A' }}></div>
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse" style={{ color: settings?.primary_color || '#DB5B9A' }}>
          Cargando cancelaciones...
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
              <XCircle className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold font-mono truncate" style={{ color: settings?.primary_color || '#DB5B9A' }}>
                ❌ {settings?.business_name || 'Salón VIP'}
              </p>
              <h2 className="text-xl md:text-2xl font-serif font-extrabold text-stone-900 dark:text-white mt-0.5 truncate">
                Citas Canceladas
              </h2>
              <p className="text-xs text-stone-500 dark:text-pink-100/60 mt-0.5 truncate">
                Historial de citas canceladas y pérdidas asociadas.
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${settings?.primary_color || '#DB5B9A'}10`, color: settings?.primary_color || '#DB5B9A' }}>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Total Canceladas</p>
            <h3 className="text-sm font-mono font-black text-rose-600 dark:text-rose-400">{totalCanceladas}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Ingresos Perdidos</p>
            <h3 className="text-sm font-mono font-black text-rose-600 dark:text-rose-400">${totalPerdido.toLocaleString()}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Clientes Afectados</p>
            <h3 className="text-sm font-mono font-black text-stone-900 dark:text-pink-100">{clientesAfectados}</h3>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-3 p-3 rounded-2xl border flex-1 bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 transition-all duration-300">
          <Search className="w-4 h-4 shrink-0" style={{ color: settings?.primary_color || '#DB5B9A' }} />
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
            style={{ 
              '--tw-ring-color': settings?.primary_color || '#DB5B9A'
            } as React.CSSProperties}
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

      {/* LISTA DE CANCELACIONES */}
      <div className={`space-y-3 transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>
        {citasFiltradas.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-2xl font-mono text-stone-400 text-xs bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
            {search || filterDate ? 'No hay cancelaciones con esos filtros' : 'No hay citas canceladas'}
          </div>
        ) : (
          citasFiltradas.map((cita) => (
            <div 
              key={cita.id} 
              className="rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-500/5 bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 hover:border-rose-300 dark:hover:border-rose-800"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white dark:bg-[#0f0c1b] border border-pink-100/60 dark:border-fuchsia-950 text-rose-500">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold truncate text-stone-800 dark:text-pink-100">
                        {cita.clients?.name || 'Cliente'}
                      </h4>
                      <span className="text-[8px] font-mono tracking-wider px-2 py-0.5 rounded-full text-rose-600 dark:text-rose-400 uppercase font-bold bg-white dark:bg-[#0f0c1b] border border-rose-500/20">
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
                    className="p-1.5 rounded-xl border transition-all bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-400 hover:text-rose-500 hover:border-rose-500/20"
                    title="Eliminar permanentemente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-xl border transition-all bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-400 hover:text-pink-500 dark:hover:text-pink-400">
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