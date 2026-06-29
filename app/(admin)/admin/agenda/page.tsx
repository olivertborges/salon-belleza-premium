'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar as CalendarIcon, Clock, User, Sparkles, 
  ChevronLeft, ChevronRight, CheckCircle2, 
  Play, Filter, DollarSign, Layers, Plus, Trash2, 
  X, Edit, Save, FileText
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import { TimePicker } from '@/components/TimePicker'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor
} from '@dnd-kit/core'
import { DraggableAppointment } from '@/components/agenda/DraggableAppointment'
import { DroppableSlot } from '@/components/agenda/DroppableSlot'

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
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCita, setSelectedCita] = useState<any>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [newCita, setNewCita] = useState({
    clientId: '',
    serviceId: '',
    staffId: '',
    date: '',
    time: '',
    notes: '',
  })

  // ============================================================
// MOSTRAR TOAST (Notificación visual)
// ============================================================
const mostrarToastLlamativo = (nuevaCita: any) => {
  if (!nuevaCita || !nuevaCita.date || !nuevaCita.time) {
    console.warn('⚠️ Cita incompleta para mostrar toast:', nuevaCita)
    return
  }

  const ID_TOAST = 'toast-nueva-cita'
  let toastExistente = document.getElementById(ID_TOAST)
  if (toastExistente) toastExistente.remove()

  const toast = document.createElement('div')
  toast.id = ID_TOAST
  toast.className = "fixed top-5 right-5 z-[9999] bg-card border-2 border-amber-500 text-foreground p-4 rounded-2xl shadow-2xl dark:shadow-amber-500/10 max-w-sm animate-[bounce_1s_ease-in-out_2] transition-all duration-300"

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
  `

  document.body.appendChild(toast)

  document.getElementById('btn-cerrar-toast')?.addEventListener('click', () => toast.remove())
  document.getElementById('btn-ir-toast')?.addEventListener('click', () => {
    if (nuevaCita.date) {
      const fechaCita = new Date(nuevaCita.date.replace(/-/g, '\/'))
      setFechaSeleccionada(fechaCita)
    }
    setViewMode('day')
    setFiltroStaff('todos')
    toast.remove()
  })

  setTimeout(() => {
    if (document.body.contains(toast)) toast.remove()
  }, 10000)
}

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 80,
        tolerance: 5,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    if (event.activatorEvent) {
      event.activatorEvent.preventDefault()
    }

    const { active, over } = event
    if (!over) return

    const appointmentId = active.id as string
    const slotId = over.id as string

    if (!slotId.startsWith('slot-')) return

    const partes = slotId.split('-')
    if (partes.length < 5) return

    const nuevaFecha = `${partes[1]}-${partes[2]}-${partes[3]}`
    const nuevaHora = `${partes[4]}:00:00`

    const copiaCitasPrevias = [...citas]

    setCitas(prev => prev.map(c => 
      c.id === appointmentId 
        ? { ...c, date: nuevaFecha, time: nuevaHora } 
        : c
    ))

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ date: nuevaFecha, time: nuevaHora })
        .eq('id', appointmentId)

      if (error) throw error
    } catch (err) {
      console.error('Error al actualizar en Supabase, revirtiendo...', err)
      setCitas(copiaCitasPrevias)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase.from('appointments').select('*')

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
        supabase.from('staff').select('*').eq('is_active', true),
        supabase.from('services').select('*').eq('is_active', true),
        supabase.from('clients').select('*')
      ])

      const citasConRelaciones = citasData.map(cita => ({
        ...cita,
        clients: clientsRes.data?.find(c => c.id === cita.client_id) || null,
        services: servicesRes.data?.find(s => s.id === cita.service_id) || null,
        staff: staffRes.data?.find(s => s.id === cita.professional_id) || null
      }))

      setCitas(citasConRelaciones)
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

useEffect(() => {
  fetchData()

  // ✅ CANAL REALTIME PARA ESCUCHAR NUEVAS CITAS
  const canalCitas = supabase
    .channel('cambios-agenda-admin')
    .on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'appointments' 
      },
      (payload) => {
        console.log('🆕 Nueva cita detectada por Realtime:', payload.new)
        
        // ✅ Mostrar toast si la cita no es un bloqueo
        if (payload.new.status !== 'blocked') {
          mostrarToastLlamativo(payload.new)
        }
        
        // ✅ Recargar datos para actualizar la vista
        fetchData()
      }
    )
    .on(
      'postgres_changes',
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'appointments' 
      },
      (payload) => {
        console.log('📝 Cita actualizada:', payload.new)
        fetchData()
      }
    )
    .on(
      'postgres_changes',
      { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'appointments' 
      },
      () => {
        console.log('🗑️ Cita eliminada')
        fetchData()
      }
    )
    .subscribe((status) => {
      console.log('📡 Estado del canal Realtime:', status)
    })

  return () => {
    supabase.removeChannel(canalCitas)
  }
}, [fechaSeleccionada, filtroStaff, viewMode])

  const cambiarDia = (offset: number) => {
    const d = new Date(fechaSeleccionada)
    if (viewMode === 'day') d.setDate(d.getDate() + offset)
    else if (viewMode === 'week') d.setDate(d.getDate() + (offset * 7))
    else if (viewMode === 'month') d.setMonth(d.getMonth() + offset)
    setFechaSeleccionada(d)
  }

  const formatFechaTitulo = () => {
    if (viewMode === 'day') return format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })
    if (viewMode === 'week') {
      const start = startOfWeek(fechaSeleccionada, { weekStartsOn: 1 })
      const end = endOfWeek(fechaSeleccionada, { weekStartsOn: 1 })
      return `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM yyyy', { locale: es })}`
    }
    return format(fechaSeleccionada, 'MMMM yyyy', { locale: es })
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

  const abrirDetalleCita = (cita: any) => {
    setSelectedCita(cita)
    setIsEditing(false)
    setShowDetailModal(true)
  }

  const cambiarEstadoCita = async (id: string, nuevoEstado: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: nuevoEstado })
        .eq('id', id)

      if (error) throw error
      setCitas(prev => prev.map(c => c.id === id ? { ...c, status: nuevoEstado } : c))
      if (selectedCita) setSelectedCita({ ...selectedCita, status: nuevoEstado })
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
      setShowDetailModal(false)
    } catch (err) {
      console.error('Error eliminando cita:', err)
    }
  }

  const actualizarCita = async () => {
    if (!selectedCita) return
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          client_id: selectedCita.clients?.id || selectedCita.client_id,
          professional_id: selectedCita.staff?.id || selectedCita.professional_id,
          service_id: selectedCita.services?.id || selectedCita.service_id,
          date: selectedCita.date,
          time: selectedCita.time,
          notes: selectedCita.notes,
          total_price: selectedCita.total_price
        })
        .eq('id', selectedCita.id)

      if (error) throw error
      setCitas(prev => prev.map(c => c.id === selectedCita.id ? selectedCita : c))
      setIsEditing(false)
      setShowDetailModal(false)
    } catch (err) {
      console.error('Error actualizando cita:', err)
      alert('Error al actualizar la cita')
    }
  }

  const handleAgendarCita = async () => {
    setFormError(null)

    if (!newCita.clientId || !newCita.serviceId || !newCita.date || !newCita.time) {
      setFormError('Completa todos los campos obligatorios')
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

      if (error) {
        if (error.code === '23505' || error.code === '409') {
          const profesional = staff.find(s => s.id === newCita.staffId)?.name || 'el profesional'
          setFormError(`⚠️ Ya existe una cita para ${profesional} en esta fecha y hora.`)
          return
        }
        throw error
      }

      if (data && data.length > 0) {
        setCitas(prev => [...prev, data[0]])
      }

      setShowNewAppointment(false)
      setNewCita({ clientId: '', serviceId: '', staffId: '', date: '', time: '', notes: '' })
      setFormError(null)
      await fetchData()
    } catch (err: any) {
      console.error('Error agendando cita:', err)
      setFormError(err.message || 'Error al agendar la cita')
    }
  }

  // ============================================================
  // VISTA DÍA
  // ============================================================
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
            <div 
              key={cita.id} 
              onClick={() => abrirDetalleCita(cita)}
              className="flex items-start gap-3 md:gap-4 cursor-pointer hover:bg-muted/20 rounded-xl transition-colors"
            >
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
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 self-end sm:self-center">
                    <span className="text-xs font-mono font-bold text-emerald-500 dark:text-emerald-400 mr-2">
                      ${Number(cita.services?.price || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ============================================================
  // VISTA SEMANA - ARRASTRE FUNCIONAL
  // ============================================================
  const renderVistaSemana = () => {
    const weekStart = startOfWeek(fechaSeleccionada, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(fechaSeleccionada, { weekStartsOn: 1 }) })

    const horaInicioNum = 9
    const horaFinNum = 20
    const totalHoras = horaFinNum - horaInicioNum + 1
    const horasCuadricula = Array.from({ length: totalHoras }, (_, i) => i + horaInicioNum)
    const HORA_ALTURA = 65

    const limpiarHora24h = (timeStr: string | null) => {
      if (!timeStr) return '--:--'
      const parts = timeStr.split(':')
      if (parts.length < 2) return '--:--'
      return `${parts[0].padStart(2, '0')}:${parts[1].substring(0, 2)}`
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto select-none border border-border rounded-xl bg-background shadow-sm">
          <div className="min-w-[900px] flex flex-col font-sans">
            
            {/* HEADER */}
            <div className="flex border-b border-border bg-card sticky top-0 z-30">
              <div className="w-16 flex-shrink-0 border-r border-border bg-card" />
              <div className="flex-1 grid grid-cols-7">
                {weekDays.map((day) => {
                  const isTodayDate = isToday(day)
                  return (
                    <div key={day.toString()} className={`text-center py-2.5 border-r border-border/60 last:border-r-0 flex flex-col items-center justify-center ${isTodayDate ? 'bg-cyan-500/5' : ''}`}>
                      <span className={`text-[10px] font-mono uppercase tracking-wider ${isTodayDate ? 'text-cyan-500 font-bold' : 'text-muted-foreground'}`}>
                        {format(day, 'EEE', { locale: es })}
                      </span>
                      <p className={`text-sm font-mono font-bold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${isTodayDate ? 'bg-cyan-500 text-white shadow-sm' : 'text-foreground'}`}>
                        {format(day, 'd')}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CUERPO */}
            <div className="flex relative">
              
              {/* HORAS */}
              <div className="w-16 flex-shrink-0 border-r border-border bg-card/50 text-right pr-2.5 z-20">
                {horasCuadricula.map((hora) => (
                  <div key={hora} className="text-[10px] font-mono text-muted-foreground font-medium flex items-start justify-end pt-2" style={{ height: `${HORA_ALTURA}px` }}>
                    {String(hora).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* GRILLA */}
              <div className="flex-1 relative" style={{ height: `${totalHoras * HORA_ALTURA}px` }}>
                
                {/* SLOTS - fondo */}
                <div className="absolute inset-0 grid grid-cols-7" style={{ gridTemplateRows: `repeat(${totalHoras}, ${HORA_ALTURA}px)` }}>
                  {weekDays.map((day, colIdx) => {
                    const dayStr = format(day, 'yyyy-MM-dd')
                    return horasCuadricula.map((hora, rowIdx) => {
                      const horaStr = String(hora).padStart(2, '0')
                      return (
                        <DroppableSlot
                          key={`slot-${dayStr}-${horaStr}`}
                          id={`slot-${dayStr}-${horaStr}`}
                          className="border-r border-b border-border/20 hover:bg-cyan-500/5 transition-colors"
                          style={{
                            gridColumn: colIdx + 1,
                            gridRow: rowIdx + 1,
                            cursor: 'pointer'
                          }}
                        >
                          <div
                            className="w-full h-full"
                            onClick={() => {
                              setNewCita({ ...newCita, date: dayStr, time: `${horaStr}:00` })
                              setShowNewAppointment(true)
                            }}
                          />
                        </DroppableSlot>
                      )
                    })
                  })}
                </div>

                {/* CITAS - encima */}
                <div className="absolute inset-0 grid grid-cols-7 pointer-events-none" style={{ gridTemplateRows: `repeat(${totalHoras}, ${HORA_ALTURA}px)` }}>
                  {weekDays.map((day, colIdx) => {
                    const citasDelDia = getCitasDelDia(day)

                    return citasDelDia.map((cita) => {
                      if (!cita.time) return null

                      const horaFormateada = limpiarHora24h(cita.time)
                      const [hStr] = horaFormateada.split(':')
                      const horaCita = parseInt(hStr, 10)

                      if (horaCita < horaInicioNum || horaCita > horaFinNum) return null

                      const filaInicio = (horaCita - horaInicioNum) + 1
                      const duracionMinutos = cita.services?.duration || 60
                      const spanFilas = Math.max(1, Math.round(duracionMinutos / 60))

                      const statusInfo = getStatusBadge(cita.status)
                      const isProcessing = cita.status === 'in_progress'
                      const isCompleted = cita.status === 'completed'

                      let cardBgColor = 'bg-card border-border text-foreground'
                      if (isProcessing) cardBgColor = 'bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-200'
                      if (isCompleted) cardBgColor = 'bg-muted/60 border-emerald-500/20 text-muted-foreground opacity-70'
                      if (cita.status === 'blocked') cardBgColor = 'bg-stone-200 dark:bg-stone-800 border-dashed border-stone-400 text-muted-foreground opacity-80'

                      const isDragging = activeId === cita.id

                      return (
                        <div
                          key={cita.id}
                          className="p-1 pointer-events-auto"
                          style={{
                            gridColumn: colIdx + 1,
                            gridRow: `${filaInicio} / span ${spanFilas}`
                          }}
                        >
                        <DraggableAppointment
                          id={cita.id}
                          disabled={cita.status === 'completed' || cita.status === 'cancelled'}
                          className={`w-full h-full border rounded-xl p-2 flex flex-col justify-between overflow-hidden ${cardBgColor} ${isDragging ? 'opacity-50 ring-2 ring-cyan-500' : ''}`}
                        >
                          <div 
                            onClick={(e) => {
                              e.stopPropagation()
                              abrirDetalleCita(cita)
                            }} 
                            className="w-full h-full cursor-pointer flex flex-col justify-between"
                          >
                              <div className="min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[9px] font-mono font-bold text-cyan-600 dark:text-cyan-400">{horaFormateada}</span>
                                  <span className={`text-[6px] px-1 py-0.5 rounded border uppercase font-mono tracking-wider bg-background/50 border-current ${statusInfo.color.split(' ')[2] || ''}`}>
                                    {statusInfo.label}
                                  </span>
                                </div>
                                <p className="text-[10px] font-bold truncate text-foreground mt-1 tracking-wide">
                                  {cita.clients?.name || 'Cliente'}
                                </p>
                                <p className="text-[9px] text-muted-foreground font-medium truncate mt-0.5">
                                  {cita.services?.name || 'Servicio'}
                                </p>
                              </div>
                              <div className="flex items-center justify-between text-[8px] border-t border-border/60 pt-1 mt-1 font-mono">
                                <span className="text-muted-foreground font-sans truncate max-w-[60%]">
                                  {cita.staff?.name || 'Sin asignar'}
                                </span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  ${Number(cita.services?.price || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </DraggableAppointment>
                        </div>
                      )
                    })
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DndContext>
    )
  }

  // ============================================================
  // VISTA MES
  // ============================================================
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
                      <div 
                        key={cita.id} 
                        onClick={(e) => { e.stopPropagation(); abrirDetalleCita(cita) }}
                        className={`group/item flex items-center gap-1 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded border truncate transition-colors cursor-pointer hover:border-cyan-500/50 ${badgeStyle}`} 
                        title={`${hora24} - ${cita.clients?.name}`}
                      >
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

  // ============================================================
  // LOADING / ERROR
  // ============================================================
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

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 px-2 sm:px-4 pb-12">
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

      <div className="bg-card border border-border rounded-2xl p-3 sm:p-6 shadow-xl relative min-h-[300px]">
        {viewMode === 'day' && renderVistaDia()}
        {viewMode === 'week' && renderVistaSemana()}
        {viewMode === 'month' && renderVistaMes()}
      </div>

      {/* MODAL NUEVA CITA */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Agendar cita</h3>
                  <p className="text-[10px] text-mutedForeground font-mono">Registra una nueva cita en la agenda</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewAppointment(false)} 
                className="w-8 h-8 rounded-xl hover:bg-muted/50 transition-colors flex items-center justify-center text-mutedForeground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <form onSubmit={(e) => { e.preventDefault(); handleAgendarCita(); }} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
                    <User className="w-3.5 h-3.5" /> Cliente <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    value={newCita.clientId}
                    onChange={(e) => setNewCita({...newCita, clientId: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                    required
                  >
                    <option value="">Selecciona un cliente</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
                    <Sparkles className="w-3.5 h-3.5" /> Servicio <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    value={newCita.serviceId}
                    onChange={(e) => setNewCita({...newCita, serviceId: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                    required
                  >
                    <option value="">Selecciona un servicio</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (${s.price})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
                    <User className="w-3.5 h-3.5" /> Profesional
                  </label>
                  <select 
                    value={newCita.staffId}
                    onChange={(e) => setNewCita({...newCita, staffId: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  >
                    <option value="">Cualquier profesional</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
                      <CalendarIcon className="w-3.5 h-3.5" /> Fecha <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="date"
                      value={newCita.date}
                      onChange={(e) => setNewCita({...newCita, date: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
                      <Clock className="w-3.5 h-3.5" /> Hora <span className="text-rose-500">*</span>
                    </label>
                    <TimePicker
                      value={newCita.time}
                      onChange={(time) => setNewCita({...newCita, time})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
                    <FileText className="w-3.5 h-3.5" /> Notas
                  </label>
                  <textarea 
                    value={newCita.notes}
                    onChange={(e) => setNewCita({...newCita, notes: e.target.value})}
                    rows={2}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none placeholder-mutedForeground/60"
                    placeholder="Alergias, observaciones..."
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowNewAppointment(false)}
                    className="flex-1 px-4 py-2.5 bg-muted/30 border border-border text-mutedForeground hover:bg-muted/50 rounded-xl text-sm font-medium transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agendar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE CITA */}
      {showDetailModal && selectedCita && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />
                Detalle de Cita
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-mutedForeground" />
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-mutedForeground font-medium mb-1">Cliente</label>
                  <select 
                    value={selectedCita.client_id || selectedCita.clients?.id || ''}
                    onChange={(e) => setSelectedCita({
                      ...selectedCita, 
                      client_id: e.target.value,
                      clients: clients.find(c => c.id === e.target.value)
                    })}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-cyan-500"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-mutedForeground font-medium mb-1">Servicio</label>
                  <select 
                    value={selectedCita.service_id || selectedCita.services?.id || ''}
                    onChange={(e) => {
                      const service = services.find(s => s.id === e.target.value)
                      setSelectedCita({
                        ...selectedCita, 
                        service_id: e.target.value,
                        services: service,
                        total_price: service?.price || 0
                      })
                    }}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-cyan-500"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (${s.price})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-mutedForeground font-medium mb-1">Profesional</label>
                  <select 
                    value={selectedCita.professional_id || selectedCita.staff?.id || ''}
                    onChange={(e) => setSelectedCita({
                      ...selectedCita, 
                      professional_id: e.target.value,
                      staff: staff.find(s => s.id === e.target.value)
                    })}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">Sin asignar</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-mutedForeground font-medium mb-1">Fecha</label>
                    <input 
                      type="date"
                      value={selectedCita.date || ''}
                      onChange={(e) => setSelectedCita({...selectedCita, date: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-mutedForeground font-medium mb-1">Hora</label>
                    <TimePicker
                      value={selectedCita.time || ''}
                      onChange={(time) => setSelectedCita({...selectedCita, time})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-mutedForeground font-medium mb-1">Notas</label>
                  <textarea 
                    value={selectedCita.notes || ''}
                    onChange={(e) => setSelectedCita({...selectedCita, notes: e.target.value})}
                    rows={2}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-border">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-2 bg-muted/30 text-mutedForeground rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={actualizarCita}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border">
                  <div>
                    <p className="text-[10px] text-mutedForeground font-mono uppercase tracking-wider">Estado</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusBadge(selectedCita.status).color}`}>
                      {getStatusBadge(selectedCita.status).label}
                    </span>
                  </div>
                  <span className="text-lg font-mono font-bold text-emerald-500">
                    ${Number(selectedCita.services?.price || selectedCita.total_price || 0).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/10 rounded-xl border border-border">
                    <p className="text-[9px] text-mutedForeground font-mono uppercase tracking-wider">Cliente</p>
                    <p className="text-sm font-medium text-foreground">{selectedCita.clients?.name || 'Sin cliente'}</p>
                    <p className="text-xs text-mutedForeground">{selectedCita.clients?.phone || ''}</p>
                  </div>
                  <div className="p-3 bg-muted/10 rounded-xl border border-border">
                    <p className="text-[9px] text-mutedForeground font-mono uppercase tracking-wider">Servicio</p>
                    <p className="text-sm font-medium text-foreground">{selectedCita.services?.name || 'Sin servicio'}</p>
                    <p className="text-xs text-mutedForeground">{selectedCita.services?.duration || 0} min</p>
                  </div>
                </div>

                <div className="p-3 bg-muted/10 rounded-xl border border-border">
                  <p className="text-[9px] text-mutedForeground font-mono uppercase tracking-wider">Profesional</p>
                  <p className="text-sm font-medium text-foreground">{selectedCita.staff?.name || 'Sin asignar'}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/10 rounded-xl border border-border">
                    <p className="text-[9px] text-mutedForeground font-mono uppercase tracking-wider">Fecha</p>
                    <p className="text-sm font-medium text-foreground">{selectedCita.date || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-muted/10 rounded-xl border border-border">
                    <p className="text-[9px] text-mutedForeground font-mono uppercase tracking-wider">Hora</p>
                    <p className="text-sm font-medium text-foreground">{selectedCita.time ? selectedCita.time.substring(0,5) : 'N/A'}</p>
                  </div>
                </div>

                {selectedCita.notes && (
                  <div className="p-3 bg-muted/10 rounded-xl border border-border">
                    <p className="text-[9px] text-mutedForeground font-mono uppercase tracking-wider">Notas</p>
                    <p className="text-sm text-mutedForeground">{selectedCita.notes}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                  {selectedCita.status === 'pending' && (
                    <>
                      <button
                        onClick={() => cambiarEstadoCita(selectedCita.id, 'confirmed')}
                        className="flex-1 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium hover:bg-emerald-500/20 transition-all"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => cambiarEstadoCita(selectedCita.id, 'cancelled')}
                        className="flex-1 px-3 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium hover:bg-rose-500/20 transition-all"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                  {(selectedCita.status === 'pending' || selectedCita.status === 'confirmed') && (
                    <button
                      onClick={() => cambiarEstadoCita(selectedCita.id, 'in_progress')}
                      className="flex-1 px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-medium hover:bg-amber-500/20 transition-all"
                    >
                      Iniciar
                    </button>
                  )}
                  {selectedCita.status === 'in_progress' && (
                    <button
                      onClick={() => cambiarEstadoCita(selectedCita.id, 'completed')}
                      className="flex-1 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium hover:bg-emerald-500/20 transition-all"
                    >
                      Completar
                    </button>
                  )}
                  {selectedCita.status !== 'completed' && selectedCita.status !== 'cancelled' && (
                    <button
                      onClick={() => cambiarEstadoCita(selectedCita.id, 'cancelled')}
                      className="flex-1 px-3 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium hover:bg-rose-500/20 transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 px-4 py-2 bg-muted/30 border border-border text-foreground rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarCita(selectedCita.id)}
                    className="flex-1 px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}