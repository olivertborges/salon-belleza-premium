'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar as CalendarIcon, Clock, User, Sparkles, 
  ChevronLeft, ChevronRight, CheckCircle2, 
  Play, DollarSign, Layers 
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'

export default function StaffAgendaPage() {
  const { user, tenantId } = useAuth()
  const [citas, setCitas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0])
  const [staffId, setStaffId] = useState<string | null>(null)

  const horasDelDia = Array.from({ length: 12 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`)

  useEffect(() => {
    if (tenantId && user) {
      obtenerStaffId()
    }
  }, [tenantId, user])

  useEffect(() => {
    if (staffId) {
      cargarCitas()
    }
  }, [staffId, fechaSeleccionada])

  const obtenerStaffId = async () => {
    try {
      const { data } = await supabase
        .from('staff')
        .select('id')
        .eq('email', user?.email)
        .eq('tenant_id', tenantId)
        .single()

      if (data) setStaffId(data.id)
    } catch (error) {
      console.error('Error obteniendo staff:', error)
    }
  }

  const cargarCitas = async () => {
    if (!staffId) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('appointments')
        .select(`
          *,
          clients:client_id (id, name, email, phone),
          services:service_id (id, name, price, duration)
        `)
        .eq('tenant_id', tenantId)
        .eq('staff_id', staffId)
        .eq('date', fechaSeleccionada)

      if (data) setCitas(data)
    } catch (error) {
      console.error('Error cargando citas:', error)
    } finally {
      setLoading(false)
    }
  }

  const cambiarEstadoCita = async (id: string, nuevoEstado: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: nuevoEstado })
        .eq('id', id)

      if (error) throw error
      setCitas(prev => prev.map(c => c.id === id ? { ...c, status: nuevoEstado } : c))
    } catch (error) {
      console.error('Error actualizando cita:', error)
    }
  }

  const citasFiltradas = citas
  const totalIngresosHoy = citasFiltradas
    .filter(c => c.status === 'completed')
    .reduce((sum, c) => sum + Number(c.services?.price || 0), 0)

  const cambiarDia = (offset: number) => {
    const d = new Date(fechaSeleccionada)
    d.setDate(d.getDate() + offset)
    setFechaSeleccionada(d.toISOString().split('T')[0])
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string, color: string }> = {
      pending: { label: 'Pendiente', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
      confirmed: { label: 'Confirmada', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
      in_progress: { label: 'En proceso', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
      completed: { label: 'Completada', color: 'bg-stone-500/10 border-stone-500/20 text-stone-400' },
      cancelled: { label: 'Cancelada', color: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
    }
    return config[status] || config.pending
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0e0c0b] border border-stone-900 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-serif italic text-white">Mi Agenda</h2>
            <p className="text-[11px] text-stone-400 font-mono">Tus turnos del día</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-stone-900/40 border border-stone-900 p-1.5 rounded-xl w-full lg:w-auto justify-between lg:justify-start">
          <button onClick={() => cambiarDia(-1)} className="p-2 rounded-lg bg-stone-950 border border-stone-800 text-stone-400 hover:text-white transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold px-4 text-stone-200 uppercase tracking-wider">
            {new Date(fechaSeleccionada).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <button onClick={() => cambiarDia(1)} className="p-2 rounded-lg bg-stone-950 border border-stone-800 text-stone-400 hover:text-white transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0e0c0b]/40 border border-stone-900 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-stone-500 font-mono uppercase tracking-widest">Tus Turnos</p>
            <p className="text-xl font-mono font-bold text-stone-200 mt-1">{citasFiltradas.length}</p>
          </div>
          <Layers className="w-5 h-5 text-cyan-400/70" />
        </div>
        <div className="bg-[#0e0c0b]/40 border border-stone-900 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-stone-500 font-mono uppercase tracking-widest">En Proceso</p>
            <p className="text-xl font-mono font-bold text-amber-400 mt-1">
              {citasFiltradas.filter(c => c.status === 'in_progress').length}
            </p>
          </div>
          <Play className="w-5 h-5 text-amber-400/70 animate-pulse" />
        </div>
        <div className="bg-[#0e0c0b]/40 border border-stone-900 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-stone-500 font-mono uppercase tracking-widest">Ingresos Generados</p>
            <p className="text-xl font-mono font-bold text-emerald-400 mt-1">${totalIngresosHoy.toLocaleString()}</p>
          </div>
          <DollarSign className="w-5 h-5 text-emerald-400/70" />
        </div>
      </div>

      {/* TIMELINE */}
      <div className="bg-[#0e0c0b] border border-stone-900 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {citasFiltradas.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-stone-900 rounded-xl space-y-2">
            <Sparkles className="w-6 h-6 text-stone-600 mx-auto" />
            <p className="text-xs text-stone-400 font-mono">No tienes citas para este día.</p>
          </div>
        ) : (
          <div className="relative space-y-1">
            {horasDelDia.map((hora) => {
              const citasDeEstaHora = citasFiltradas.filter(c => c.time?.startsWith(hora.substring(0, 5)))

              return (
                <div key={hora} className="flex gap-4 min-h-[90px] group relative">
                  <div className="w-14 text-right pt-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-stone-500 tracking-wider group-hover:text-cyan-400 transition-colors">
                      {hora}
                    </span>
                  </div>

                  <div className="w-px bg-stone-900 relative group-hover:bg-stone-800 transition-colors">
                    <div className="absolute top-3 -left-[3px] w-1.5 h-1.5 rounded-full bg-stone-800 group-hover:bg-cyan-500 transition-colors"></div>
                  </div>

                  <div className="flex-1 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {citasDeEstaHora.map((cita) => {
                      const statusInfo = getStatusBadge(cita.status)
                      const isPending = cita.status === 'pending'
                      const isProcessing = cita.status === 'in_progress'
                      const isCompleted = cita.status === 'completed'

                      let cardBg = 'bg-stone-900/20 border-stone-900/80 hover:border-stone-800'
                      if (isProcessing) cardBg = 'bg-amber-950/20 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                      if (isCompleted) cardBg = 'bg-emerald-950/10 border-emerald-500/20 opacity-70'

                      return (
                        <div key={cita.id} className={`border rounded-xl p-4 flex flex-col justify-between gap-3 transition-all ${cardBg}`}>
                          <div>
                            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-stone-500 block">
                              {cita.time} - {cita.services?.name || 'Servicio'}
                            </span>
                            <h4 className="text-xs font-bold text-stone-100 mt-0.5 flex items-center gap-1.5">
                              <User className="w-3 h-3 text-stone-400" />
                              {cita.clients?.name || 'Cliente'}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-stone-900/40">
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              ${Number(cita.services?.price || 0).toLocaleString()}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 pt-1 border-t border-stone-900/20">
                            {isPending && (
                              <button onClick={() => cambiarEstadoCita(cita.id, 'confirmed')} className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                                Confirmar
                              </button>
                            )}
                            {(isPending || cita.status === 'confirmed') && (
                              <button onClick={() => cambiarEstadoCita(cita.id, 'in_progress')} className="text-[10px] px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all">
                                Iniciar
                              </button>
                            )}
                            {isProcessing && (
                              <button onClick={() => cambiarEstadoCita(cita.id, 'completed')} className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                                Completar
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
