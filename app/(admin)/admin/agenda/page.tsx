'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar as CalendarIcon, Clock, User, Sparkles, 
  ChevronLeft, ChevronRight, CheckCircle2, 
  Play, Filter, DollarSign, Layers, Plus, Trash2, 
  X, CalendarDays, CalendarRange, Calendar
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'

type ViewMode = 'day' | 'week' | 'month'

export default function AdminAgendaPage() {
  const [citas, setCitas] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date())
  const [filtroStaff, setFiltroStaff] = useState<string>('todos')
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [esBloqueo, setEsBloqueo] = useState(false)

  const [newCita, setNewCita] = useState({
    clientId: '',
    serviceId: '',
    staffId: '',
    date: '',
    time: '',
    notes: '',
  })

  const horasDelDia = Array.from({ length: 12 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`)

  const mostrarToastLlamativo = (nuevaCita: any) => {
    const ID_TOAST = 'toast-nueva-cita';
    let toastExistente = document.getElementById(ID_TOAST);
    if (toastExistente) toastExistente.remove();

    const toast = document.createElement('div');
    toast.id = ID_TOAST;
    // Toast adaptativo usando las variables globales
    toast.className = "fixed top-5 right-5 z-[9999] bg-card border-2 border-amber-500 text-foreground p-4 rounded-2xl shadow-2xl dark:shadow-amber-500/10 max-w-sm animate-[bounce_1s_ease-in-out_2] transition-all duration-300";

    toast.innerHTML = `
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">¡Nueva Cita Recibida!</h4>
        </div>
        <p class="text-xs text-mutedForeground">Una clienta se acaba de agendar para el día <span class="font-bold text-stone-900 dark:text-white">${nuevaCita.date}</span> a las <span class="font-bold text-stone-900 dark:text-white">${nuevaCita.time.slice(0,5)}</span>.</p>
        <div class="flex justify-end gap-2 mt-1">
          <button id="btn-cerrar-toast" class="text-[10px] font-mono uppercase px-2 py-1 text-mutedForeground hover:text-foreground transition-colors">Cerrar</button>
          <button id="btn-ir-toast" class="text-[10px] font-mono uppercase bg-amber-500 text-black px-2.5 py-1 rounded font-bold hover:bg-amber-400 transition-all shadow-md shadow-amber-500/10">Revisar Ahora</button>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    document.getElementById('btn-cerrar-toast')?.addEventListener('click', () => toast.remove());
    document.getElementById('btn-ir-toast')?.addEventListener('click', () => {
      if (nuevaCita.date) {
        const fechaCita = new Date(nuevaCita.date.replace(/-/g, '\/'));
        setFechaSeleccionada(fechaCita);
      }
      setViewMode('day');
      setFiltroStaff('todos');
      toast.remove();
    });

    setTimeout(() => {
      if (document.body.contains(toast)) toast.remove();
    }, 10000);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        let query = supabase
          .from('appointments')
          .select(`
            *,
            clients:client_id (id, name, email, phone),
            services:service_id (id, name, price, duration),
            staff:professional_id (id, name)
          `)

        if (viewMode === 'day') {
          const dateStr = format(fechaSeleccionada, 'yyyy-MM-dd')
          query = query.eq('date', dateStr)
        } else if (viewMode === 'week') {
          const weekStart = startOfWeek(fechaSeleccionada, { weekStartsOn: 1 })
          const weekEnd = endOfWeek(fechaSeleccionada, { weekStartsOn: 1 })
          query = query.gte('date', format(weekStart, 'yyyy-MM-dd')).lte('date', format(weekEnd, 'yyyy-MM-dd'))
        } else if (viewMode === 'month') {
          const monthStart = startOfMonth(fechaSeleccionada)
          const monthEnd = endOfMonth(fechaSeleccionada)
          query = query.gte('date', format(monthStart, 'yyyy-MM-dd')).lte('date', format(monthEnd, 'yyyy-MM-dd'))
        }

        if (filtroStaff !== 'todos') {
          query = query.eq('professional_id', filtroStaff)
        }

        const { data: citasData, error: citasError } = await query.order('time', { ascending: true })

        if (citasError) throw citasError

        const [staffRes, servicesRes, clientsRes] = await Promise.all([
          supabase.from('professionals').select('*').eq('is_active', true),
          supabase.from('services').select('*').eq('is_active', true),
          supabase.from('clients').select('*')
        ])

        setCitas(citasData || [])
        setStaff(staffRes.data || [])
        setServices(servicesRes.data || [])
        setClients(clientsRes.data || [])

      } catch (err: any) {
        console.error('Error general de carga:', err)
        setError(err.message || 'Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    const canalCitas = supabase
      .channel('cambios-agenda-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          console.log("Realtime detectó cambio:", payload);
          if (payload.eventType === 'INSERT') {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav')
            audio.volume = 0.4
            audio.play().catch(e => console.log("Audio bloqueado"))
            mostrarToastLlamativo(payload.new)
          }
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canalCitas)
    }
  }, [fechaSeleccionada, filtroStaff, viewMode])

  const cambiarEstadoCita = async (id: string, nuevoEstado: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: nuevoEstado })
        .eq('id', id)

      if (error) throw error
      setCitas(prev => prev.map(c => c.id === id ? { ...c, status: nuevoEstado } : c))
    } catch (err) {
      console.error('Error actualizando estado:', err)
    }
  }

  const eliminarCita = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta cita?')) return
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

      if (error) throw error
      setCitas(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Error eliminando cita:', err)
    }
  }

  const handleAgendarCita = async () => {
    if (!newCita.clientId || !newCita.serviceId || !newCita.date || !newCita.time) {
      alert('Completa todos los campos obligatorios')
      return
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            client_id: newCita.clientId,
            professional_id: newCita.staffId || null,
            service_id: newCita.serviceId,
            date: newCita.date,
            time: newCita.time,
            status: 'pending',
            total_price: services.find(s => s.id === newCita.serviceId)?.price || 0,
            notes: newCita.notes
          }
        ])
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setCitas(prev => [...prev, data[0]])
      }

      setShowNewAppointment(false)
      setNewCita({ clientId: '', serviceId: '', staffId: '', date: '', time: '', notes: '' })
    } catch (err) {
      console.error('Error agendando cita:', err)
      alert('Error al agendar la cita')
    }
  }

  const bloquearHorarioProfesional = async () => {
    if (!newCita.date || !newCita.time || !newCita.staffId) {
      alert('Selecciona Fecha, Hora y el Profesional a bloquear')
      return
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            client_id: null,
            professional_id: newCita.staffId,
            service_id: null,
            date: newCita.date,
            time: newCita.time.includes(':00') ? newCita.time : `${newCita.time}:00`,
            status: 'blocked',
            notes: newCita.notes || 'Bloqueo administrativo',
            total_price: 0
          }
        ])
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setCitas(prev => [...prev, data[0]])
      }

      setShowNewAppointment(false)
      setEsBloqueo(false)
      setNewCita({ clientId: '', serviceId: '', staffId: '', date: '', time: '', notes: '' })
      alert("Horario bloqueado correctamente.")
    } catch (err) {
      console.error('Error al bloquear:', err)
      alert('Error al guardar el bloqueo')
    }
  }

  const cambiarDia = (offset: number) => {
    const d = new Date(fechaSeleccionada)
    if (viewMode === 'day') d.setDate(d.getDate() + offset)
    else if (viewMode === 'week') d.setDate(d.getDate() + (offset * 7))
    else if (viewMode === 'month') d.setMonth(d.getMonth() + offset)
    setFechaSeleccionada(d)
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string, color: string }> = {
      pending: { label: 'Pendiente', color: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' },
      confirmed: { label: 'Confirmada', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
      in_progress: { label: 'En proceso', color: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' },
      completed: { label: 'Completada', color: 'bg-stone-500/10 border-stone-500/20 text-stone-600 dark:text-stone-400' },
      cancelled: { label: 'Cancelada', color: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' },
      blocked: { label: 'Bloqueado', color: 'bg-stone-200 dark:bg-stone-800/50 border-border text-stone-700 dark:text-amber-500/80' },
    }
    return config[status] || config.pending
  }

  const getCitasDelDia = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return citas.filter(c => c.date === dateStr)
  }

  const totalIngresos = citas
    .filter(c => c.status === 'completed')
    .reduce((sum, c) => sum + Number(c.services?.price || 0), 0)

  const citasPendientes = citas.filter(c => c.status === 'pending').length

  const formatFechaTitulo = () => {
    if (viewMode === 'day') return format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })
    if (viewMode === 'week') {
      const start = startOfWeek(fechaSeleccionada, { weekStartsOn: 1 })
      const end = endOfWeek(fechaSeleccionada, { weekStartsOn: 1 })
      return `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM yyyy', { locale: es })}`
    }
    return format(fechaSeleccionada, 'MMMM yyyy', { locale: es })
  }

  const renderVistaDia = () => {
    const citasDelDia = citas.filter(c => c.date === format(fechaSeleccionada, 'yyyy-MM-dd'))

    if (citasDelDia.length === 0) {
      return (
        <div className="text-center py-12 border border-dashed border-border rounded-xl space-y-2 bg-card">
          <Sparkles className="w-6 h-6 text-mutedForeground mx-auto" />
          <p className="text-xs text-mutedForeground font-mono">No hay citas para este día</p>
          <button 
            onClick={() => setShowNewAppointment(true)}
            className="text-rose-500 hover:text-rose-400 text-xs font-medium transition-colors"
          >
            Agendar nueva cita →
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <p className="text-[10px] font-mono text-mutedForeground mb-2 uppercase tracking-wider">
          Cronograma de citas para hoy ({citasDelDia.length})
        </p>

        {citasDelDia.map((cita) => {
          const statusInfo = getStatusBadge(cita.status)
          const isProcessing = cita.status === 'in_progress'
          const isCompleted = cita.status === 'completed'

          let cardBg = 'bg-card border-border'
          if (isProcessing) cardBg = 'bg-amber-500/[0.04] dark:bg-amber-950/20 border-amber-500/30'
          if (isCompleted) cardBg = 'bg-emerald-500/[0.02] dark:bg-emerald-950/10 border-emerald-500/20 opacity-70'

          const horaMostrar = cita.time ? cita.time.substring(0, 5) : '--:--'

          return (
            <div key={cita.id} className="flex items-start gap-3 md:gap-4">
              <div className="w-14 md:w-16 flex-shrink-0 pt-3 text-right">
                <span className="text-xs font-mono font-bold text-rose-500 dark:text-rose-400 tracking-wider">
{horaMostrar}
                </span>
              </div>
              <div className="w-px bg-border self-stretch flex-shrink-0 relative">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-muted border border-background" />
              </div>
              <div className={`flex-1 border rounded-xl p-3 md:p-4 transition-all ${cardBg}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted border border-border/50 flex items-center justify-center text-cyan-500 dark:text-cyan-400 font-mono text-[10px] flex-shrink-0">
                      {horaMostrar}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-foreground truncate">{cita.clients?.name || 'Cliente'}</h4>
                      <p className="text-[11px] text-mutedForeground truncate">{cita.services?.name || 'Servicio'}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] text-mutedForeground flex items-center gap-1">
                          <User className="w-3 h-3" /> {cita.staff?.name || 'Sin asignar'}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      {cita.notes && (
                        <p className="text-[10px] text-mutedForeground italic mt-1.5 border-l border-border pl-2">
                          "{cita.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 self-end sm:self-center">
                    <span className="text-xs font-mono font-bold text-emerald-500 dark:text-emerald-400 mr-2">
                      ${Number(cita.services?.price || 0).toLocaleString()}
                    </span>
                    {cita.status === 'pending' && (
                      <button onClick={() => cambiarEstadoCita(cita.id, 'confirmed')} className="text-[9px] px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all whitespace-nowrap">
                        Confirmar
                      </button>
                    )}
                    {(cita.status === 'pending' || cita.status === 'confirmed') && (
                      <button onClick={() => cambiarEstadoCita(cita.id, 'in_progress')} className="text-[9px] px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all whitespace-nowrap">
                        Iniciar
                      </button>
                    )}
                    {isProcessing && (
                      <button onClick={() => cambiarEstadoCita(cita.id, 'completed')} className="text-[9px] px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all whitespace-nowrap">
                        Completar
                      </button>
                    )}
                    {!isCompleted && cita.status !== 'cancelled' && (
                      <button onClick={() => eliminarCita(cita.id)} className="text-[9px] p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderVistaSemana = () => {
    const weekStart = startOfWeek(fechaSeleccionada, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(fechaSeleccionada, { weekStartsOn: 1 }) })

    const horaInicioNum = 9
    const horaFinNum = 20
    const totalHoras = horaFinNum - horaInicioNum + 1
    const horasCuadricula = Array.from({ length: totalHoras }, (_, i) => i + horaInicioNum)
    const HORA_HEIGHT_PX = 65

    const limpiarHora24h = (timeStr: string | null) => {
      if (!timeStr) return '--:--'
      const parts = timeStr.split(':')
      if (parts.length < 2) return '--:--'
      return `${parts[0].padStart(2, '0')}:${parts[1].substring(0, 2)}`
    }

    return (
      <div className="overflow-x-auto select-none border border-border rounded-xl">
        <div className="min-w-[850px] flex flex-col font-sans bg-background">

          <div className="flex border-b border-border bg-card/80 sticky top-0 z-20 backdrop-blur-md">
            <div className="w-16 flex-shrink-0 border-r border-border bg-card sticky left-0 z-30" />
            <div className="flex-1 grid grid-cols-7">
              {weekDays.map((day) => {
                const isTodayDate = isToday(day)
                return (
                  <div key={day.toString()} className={`text-center py-2.5 border-r border-border/60 last:border-r-0 flex flex-col items-center justify-center ${isTodayDate ? 'bg-cyan-500/[0.04]' : ''}`}>
                    <span className={`text-[10px] font-mono uppercase tracking-wider ${isTodayDate ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-mutedForeground'}`}>
                      {format(day, 'EEE', { locale: es })}
                    </span>
                    <p className={`text-base font-mono font-bold mt-0.5 rounded-full w-7 h-7 flex items-center justify-center ${isTodayDate ? 'bg-cyan-500 text-white dark:text-black shadow-md shadow-cyan-500/20' : 'text-foreground'}`}>
                      {format(day, 'd')}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex relative">

            <div className="w-16 flex-shrink-0 border-r border-border bg-card text-right pr-2.5 sticky left-0 z-10">
              {horasCuadricula.map((hora) => (
                <div key={hora} className="text-[10px] font-mono text-mutedForeground font-medium flex items-start justify-end pt-1" style={{ height: `${HORA_HEIGHT_PX}px` }}>
                  {String(hora).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            <div className="flex-1 grid grid-cols-7 relative">

              <div className="absolute inset-0 pointer-events-none flex flex-col z-0">
                {horasCuadricula.map((hora) => (
                  <div key={`line-${hora}`} className="border-b border-border/40 w-full" style={{ height: `${HORA_HEIGHT_PX}px` }} />
                ))}
              </div>

              {weekDays.map((day) => {
                const citasDelDia = getCitasDelDia(day)
                const isTodayDate = isToday(day)

                return (
                  <div key={`col-${day}`} className={`relative border-r border-border/60 last:border-r-0 min-h-full z-10 ${isTodayDate ? 'bg-cyan-500/[0.01]' : ''}`} style={{ height: `${totalHoras * HORA_HEIGHT_PX}px` }}>
                    {citasDelDia.map((cita) => {
                      if (!cita.time) return null

                      const horaFormateada = limpiarHora24h(cita.time)
                      const [hStr, mStr] = horaFormateada.split(':')
                      const horaCita = parseInt(hStr, 10)
                      const minCita = parseInt(mStr, 10) || 0

                      if (horaCita < horaInicioNum || horaCita > horaFinNum) return null

                      const duracionMinutos = cita.services?.duration || 60
                      const minutosDesdeInicio = ((horaCita - horaInicioNum) * 60) + minCita
                      const topPx = (minutosDesdeInicio / 60) * HORA_HEIGHT_PX
                      const heightPx = (duracionMinutos / 60) * HORA_HEIGHT_PX

                      const statusInfo = getStatusBadge(cita.status)
                      const isProcessing = cita.status === 'in_progress'
                      const isCompleted = cita.status === 'completed'

                      let cardBgColor = 'bg-card/95 border-border text-foreground'
                      if (isProcessing) cardBgColor = 'bg-amber-500/[0.08] dark:bg-amber-950/85 border-amber-500/40 text-amber-800 dark:text-amber-200 shadow-md shadow-amber-500/5'
                      if (isCompleted) cardBgColor = 'bg-muted/40 border-emerald-500/20 text-mutedForeground opacity-60'
                      if (cita.status === 'blocked') cardBgColor = 'bg-muted/80 border-dashed border-border text-mutedForeground opacity-70'

                      return (
                        <div
                          key={cita.id}
                          className={`absolute left-1 right-1 rounded-xl border p-1.5 overflow-hidden transition-all hover:z-30 hover:scale-[1.01] hover:shadow-xl shadow-lg flex flex-col justify-between group ${cardBgColor}`}
                          style={{ top: `${topPx + 2}px`, height: `${Math.max(heightPx - 4, 32)}px` }}
                          title={`${horaFormateada} - ${cita.clients?.name}: ${cita.services?.name}`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[9px] font-mono font-bold text-cyan-600 dark:text-cyan-400">{horaFormateada}</span>
                              {heightPx >= 45 && (
                                <span className={`text-[6px] px-1 py-0.2 rounded border uppercase font-mono tracking-wider bg-background/50 border-current ${statusInfo.color.split(' ')[2]}`}>
                                  {statusInfo.label}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold truncate text-foreground mt-0.5 tracking-wide">
                              {cita.clients?.name || 'Cliente'}
                            </p>
                            {heightPx > 50 && (
                              <p className="text-[9px] text-mutedForeground font-medium truncate mt-0.5">
                                {cita.services?.name || 'Servicio'}
                              </p>
                            )}
                          </div>
                          {heightPx >= 65 && (
                            <div className="flex items-center justify-between text-[8px] border-t border-border/80 pt-1 mt-1 font-mono">
                              <span className="text-mutedForeground font-sans truncate max-w-[65%]">
                                {cita.staff?.name || 'Sin asignar'}
                              </span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                ${Number(cita.services?.price || 0).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderVistaMes = () => {
    const monthStart = startOfMonth(fechaSeleccionada)
    const daysInMonth = getDaysInMonth(fechaSeleccionada)

    let startDay = monthStart.getDay()
    const ajusteStartDay = startDay === 0 ? 6 : startDay - 1

    const days = []
    for (let i = 0; i < ajusteStartDay; i++) { days.push(null) }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), i)
      days.push(date)
    }

    const format24h = (timeStr: string | null) => {
      if (!timeStr) return '--:--'
      const [horas, minutos] = timeStr.split(':')
      if (!horas || !minutos) return '--:--'
      return `${horas.padStart(2, '0')}:${minutos.substring(0, 2)}`
    }

    return (
      <div className="flex flex-col h-full font-sans select-none">
        <div className="grid grid-cols-7 border-b border-border bg-muted/20 text-center font-mono text-[10px] text-mutedForeground py-2">
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((d) => (
            <span key={d} className="hidden sm:block uppercase tracking-wider">{d}</span>
          ))}
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, idx) => (
            <span key={`short-${idx}`} className="sm:hidden uppercase tracking-wider">{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-border border-b border-r border-l border-border rounded-b-xl overflow-hidden">
          {days.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="bg-muted/10 min-h-[90px] sm:min-h-[120px]" />
            }

            const citasDelDia = getCitasDelDia(day).sort((a, b) => (a.time || '').localeCompare(b.time || ''))
            const isTodayDate = isToday(day)

            return (
              <div 
                key={idx} 
                onClick={() => { setFechaSeleccionada(day); setViewMode('day') }}
                className={`bg-card p-1.5 min-h-[95px] sm:min-h-[130px] flex flex-col justify-between cursor-pointer transition-all hover:bg-muted/40 relative group ${
                  isTodayDate ? 'ring-1 ring-inset ring-cyan-500/30 bg-cyan-500/[0.02]' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-mono font-bold flex items-center justify-center rounded-md w-6 h-6 ${
                    isTodayDate ? 'bg-cyan-500 text-white dark:text-black shadow-md shadow-cyan-500/20' : 'text-mutedForeground group-hover:text-foreground'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {citasDelDia.length > 0 && (
                    <span className="text-[9px] font-mono font-medium text-mutedForeground sm:hidden">
                      {citasDelDia.length}u
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-1 overflow-y-hidden max-h-[65px] sm:max-h-[95px]">
                  {citasDelDia.slice(0, 3).map((cita) => {
                    const hora24 = format24h(cita.time)
                    const isProcessing = cita.status === 'in_progress'
                    const isCompleted = cita.status === 'completed'

                    let badgeStyle = 'bg-background border-border text-foreground'
                    if (isProcessing) badgeStyle = 'bg-amber-500/[0.08] dark:bg-amber-950/50 border-amber-500/30 text-amber-700 dark:text-amber-300'
                    if (isCompleted) badgeStyle = 'bg-muted/20 border-emerald-500/20 text-mutedForeground opacity-60'

                    return (
                      <div key={cita.id} className={`group/item flex items-center gap-1 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded border truncate transition-colors ${badgeStyle}`} title={`${hora24} - ${cita.clients?.name}`}>
                        <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 flex-shrink-0">{hora24}</span>
                        <span className="truncate font-medium flex-1">{cita.clients?.name || 'Cliente'}</span>
                      </div>
                    )
                  })}

                  {citasDelDia.length > 3 && (
                    <div className="text-[8px] sm:text-[10px] text-cyan-600 dark:text-cyan-500/70 font-mono font-medium pl-1 bg-cyan-500/5 rounded py-0.5 border border-cyan-500/10 text-center">
                      + {citasDelDia.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-rose-500 dark:text-red-400 text-sm">Error al cargar los datos</p>
          <p className="text-mutedForeground text-xs mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 rounded-xl text-xs"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 px-2 sm:px-4 pb-12">
      {/* HEADER */}
      <div className="bg-card border border-border p-3 sm:p-5 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-xl">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-serif italic text-foreground">Agenda Admin</h2>
              <p className="text-[9px] sm:text-[11px] text-mutedForeground font-mono">
                {citas.length} citas cargadas en esta vista
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setShowNewAppointment(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-medium hover:shadow-lg transition-all flex items-center gap-1 sm:gap-2"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
              <span>Agendar</span>
            </button>

            <div className="flex bg-muted border border-border rounded-xl p-0.5">
              <button 
                onClick={() => setViewMode('day')}
                className={`px-2.5 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-mono transition-all ${viewMode === 'day' ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20' : 'text-mutedForeground hover:text-foreground'}`}
              >
                Día
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={`px-2.5 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-mono transition-all ${viewMode === 'week' ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20' : 'text-mutedForeground hover:text-foreground'}`}
              >
                Semana
              </button>
              <button 
                onClick={() => setViewMode('month')}
                className={`px-2.5 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-mono transition-all ${viewMode === 'month' ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20' : 'text-mutedForeground hover:text-foreground'}`}
              >
                Mes
              </button>
            </div>

            <button 
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden p-1.5 sm:p-2 bg-muted border border-border rounded-xl text-mutedForeground hover:text-foreground transition-all"
            >
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border">
          <button onClick={() => cambiarDia(-1)} className="p-1.5 sm:p-2 rounded-lg bg-background border border-border text-mutedForeground hover:text-foreground transition-all">
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <span className="text-[10px] sm:text-xs font-mono font-bold text-foreground uppercase tracking-wider text-center flex-1">
            {formatFechaTitulo()}
          </span>
          <button onClick={() => cambiarDia(1)} className="p-1.5 sm:p-2 rounded-lg bg-background border border-border text-mutedForeground hover:text-foreground transition-all">
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {showMobileFilters && (
          <div className="lg:hidden mt-3 pt-3 border-t border-border space-y-2">
            <select 
              value={filtroStaff} 
              onChange={(e) => setFiltroStaff(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-cyan-500"
            >
              <option value="todos">🌟 Todo el Equipo</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>💅 {s.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="hidden lg:flex items-center gap-3 mt-3 pt-3 border-t border-border">
          <Filter className="w-3.5 h-3.5 text-mutedForeground" />
          <select 
            value={filtroStaff} 
            onChange={(e) => setFiltroStaff(e.target.value)}
            className="bg-muted border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="todos">🌟 Todo el Equipo</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>💅 {s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {citasPendientes > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between mb-4 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <p className="text-xs font-mono text-amber-600 dark:text-amber-400">
              Tienes <span className="font-bold">{citasPendientes}</span> {citasPendientes === 1 ? 'cita pendiente' : 'citas pendientes'} por confirmar
            </p>
          </div>
          <button 
            onClick={() => {
              const primeraPendiente = citas.find(c => c.status === 'pending');
              if (primeraPendiente && primeraPendiente.date) {
                const fechaCita = new Date(primeraPendiente.date.replace(/-/g, '\/'));
                setFechaSeleccionada(fechaCita);
              }
              setViewMode('day');
              setFiltroStaff('todos');
            }}
            className="text-[10px] font-mono uppercase bg-amber-500 text-black px-2 py-0.5 rounded font-bold hover:bg-amber-400 transition-colors"
          >
            Ver citas
          </button>
        </div>
      )}

      {/* METRICAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-card border border-border p-3 sm:p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[8px] sm:text-[10px] text-mutedForeground font-mono uppercase tracking-widest">Turnos</p>
            <p className="text-base sm:text-xl font-mono font-bold text-foreground mt-0.5">{citas.length}</p>
          </div>
          <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500 dark:text-cyan-400/70" />
        </div>
        <div className="bg-card border border-border p-3 sm:p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[8px] sm:text-[10px] text-mutedForeground font-mono uppercase tracking-widest">Proceso</p>
            <p className="text-base sm:text-xl font-mono font-bold text-amber-500 mt-0.5">
              {citas.filter(c => c.status === 'in_progress').length}
            </p>
          </div>
          <Play className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500/70" />
        </div>
        <div className="bg-card border border-border p-3 sm:p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[8px] sm:text-[10px] text-mutedForeground font-mono uppercase tracking-widest">Completadas</p>
            <p className="text-base sm:text-xl font-mono font-bold text-emerald-500 mt-0.5">
              {citas.filter(c => c.status === 'completed').length}
            </p>
          </div>
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500/70" />
        </div>
        <div className="bg-card border border-border p-3 sm:p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[8px] sm:text-[10px] text-mutedForeground font-mono uppercase tracking-widest">Ingresos</p>
            <p className="text-base sm:text-xl font-mono font-bold text-emerald-500 mt-0.5">${totalIngresos.toLocaleString()}</p>
          </div>
          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500/70" />
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="bg-card border border-border rounded-2xl p-3 sm:p-6 shadow-xl relative min-h-[300px]">
        {viewMode === 'day' && renderVistaDia()}
        {viewMode === 'week' && renderVistaSemana()}
        {viewMode === 'month' && renderVistaMes()}
      </div>

      {/* MODAL NUEVA CITA */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />
                Agendar cita
              </h3>
              <button onClick={() => setShowNewAppointment(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-mutedForeground" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAgendarCita(); }} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs text-mutedForeground font-medium mb-1">Cliente *</label>
                <select 
                  value={newCita.clientId}
                  onChange={(e) => setNewCita({...newCita, clientId: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-foreground focus:outline-none focus:border-cyan-500"
                  required
                >
                  <option value="">Selecciona un cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-mutedForeground font-medium mb-1">Servicio *</label>
                <select 
                  value={newCita.serviceId}
                  onChange={(e) => setNewCita({...newCita, serviceId: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-foreground focus:outline-none focus:border-cyan-500"
                  required
                >
                  <option value="">Selecciona un servicio</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (${s.price})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-mutedForeground font-medium mb-1">Profesional</label>
                <select 
                  value={newCita.staffId}
                  onChange={(e) => setNewCita({...newCita, staffId: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-foreground focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Cualquier profesional</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-mutedForeground font-medium mb-1">Fecha *</label>
                  <input 
                    type="date"
                    value={newCita.date}
                    onChange={(e) => setNewCita({...newCita, date: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-foreground focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-mutedForeground font-medium mb-1">Hora *</label>
                  <input 
                    type="time"
                    value={newCita.time}
                    onChange={(e) => setNewCita({...newCita, time: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-foreground focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-mutedForeground font-medium mb-1">Notas</label>
                <textarea 
                  value={newCita.notes}
                  onChange={(e) => setNewCita({...newCita, notes: e.target.value})}
                  rows={2}
                  className="w-full bg-background border border-border rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-foreground focus:outline-none focus:border-cyan-500 placeholder-mutedForeground"
                  placeholder="Alergias, observaciones..."
                />
              </div>

              <div className="flex gap-3 pt-3 sm:pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowNewAppointment(false)}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-background border border-border text-mutedForeground rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
                >
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
