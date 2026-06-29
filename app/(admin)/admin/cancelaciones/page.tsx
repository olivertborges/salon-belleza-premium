'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
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
      // ✅ CONSULTA CORREGIDA - SIN staff:professional_id
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

      // ✅ Cargar staff por separado
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
      <div className="flex h-96 items-center justify-center font-mono text-xs text-rose-500">
        <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mr-2" />
        Cargando cancelaciones...
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500/[0.05] via-card to-card border border-rose-500/20 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 font-mono">❌ Cancelaciones</p>
            <h2 className="text-2xl font-serif italic text-foreground mt-1">Citas Canceladas</h2>
            <p className="text-xs text-mutedForeground mt-1">Historial de citas canceladas y pérdidas asociadas.</p>
          </div>
          <button 
            onClick={fetchCancelaciones}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-all shadow-lg shadow-rose-600/10 self-start sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* ALERTAS */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-600 dark:text-red-400 text-xs">
          <p className="font-mono">❌ {error}</p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-600 dark:text-emerald-400 text-xs">
          <p className="font-mono">✅ {success}</p>
        </div>
      )}

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-card border border-border p-5 flex items-center justify-between">
          <div>
            <p className="text-mutedForeground text-xs font-medium">Total Canceladas</p>
            <span className="text-2xl font-mono font-bold text-rose-600 dark:text-rose-400 block mt-1">{totalCanceladas}</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-5 flex items-center justify-between">
          <div>
            <p className="text-mutedForeground text-xs font-medium">Ingresos Perdidos</p>
            <span className="text-2xl font-mono font-bold text-rose-600 dark:text-rose-400 block mt-1">
              ${totalPerdido.toLocaleString()}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-5 flex items-center justify-between">
          <div>
            <p className="text-mutedForeground text-xs font-medium">Clientes Afectados</p>
            <span className="text-2xl font-mono font-bold text-foreground block mt-1">
              {clientesAfectados}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-muted border border-border text-mutedForeground">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center bg-muted border border-border rounded-xl px-3 py-2.5 flex-1">
          <Search className="w-4 h-4 text-mutedForeground shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, servicio o ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-foreground placeholder-mutedForeground w-full ml-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="date"
            value={filterDate}
            onChange={(e) => filtrarPorFecha(e.target.value)}
            className="bg-muted border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-rose-500/30"
          />
          {filterDate && (
            <button 
              onClick={() => setFilterDate('')}
              className="px-3 py-2.5 rounded-xl bg-muted border border-border text-mutedForeground hover:text-foreground text-xs"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* LISTA DE CANCELACIONES */}
      <div className="space-y-3">
        {citasFiltradas.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl font-mono text-mutedForeground text-xs">
            {search || filterDate ? 'No hay cancelaciones con esos filtros' : 'No hay citas canceladas'}
          </div>
        ) : (
          citasFiltradas.map((cita) => (
            <div 
              key={cita.id} 
              className="bg-card border border-border rounded-xl p-4 hover:border-rose-500/20 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-medium text-foreground truncate">
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
                    className="p-1.5 rounded-lg bg-background border border-border text-mutedForeground hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/20 transition-all"
                    title="Eliminar permanentemente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-lg bg-background border border-border text-mutedForeground hover:text-foreground transition-all">
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