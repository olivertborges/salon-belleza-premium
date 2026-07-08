'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Calendar as CalendarIcon, Clock, User, Sparkles, 
  ChevronLeft, ChevronRight, CheckCircle2, 
  Play, Filter, DollarSign, Layers, Plus, Trash2, 
  X, Edit, Save, FileText, TrendingUp, Users, 
  Calendar, ChevronDown, Bell, Menu, Search,
  Star, Award, Zap, Eye, MessageCircle, Ban,
  RefreshCw, Scissors, Loader2
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, startOfMonth, endOfMonth, getDaysInMonth, isSameDay, isSameMonth } from 'date-fns'
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
import { useTheme } from '@/contexts/ThemeContext'

type ViewMode = 'day' | 'week' | 'month'

export default function AdminAgendaPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

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
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [citaParaEliminar, setCitaParaEliminar] = useState<string | null>(null)

  const [newCita, setNewCita] = useState({
    clientId: '',
    serviceId: '',
    staffId: '',
    date: '',
    time: '',
    notes: '',
  })

  // ============================================================
  // MOSTRAR TOAST
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
    toast.className = `fixed top-5 right-5 z-[9999] p-4 rounded-xl shadow-xl max-w-sm transition-all duration-300 border ${
      isDark ? 'bg-stone-900 border-stone-800 text-stone-200' : 'bg-white border-stone-200 text-stone-800'
    }`

    toast.innerHTML = `
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <h4 class="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">¡Nueva Cita Recibida!</h4>
        </div>
        <p class="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">Una clienta se acaba de agendar para el día <span class="font-mono font-bold text-stone-900 dark:text-stone-100">${nuevaCita.date}</span> a las <span class="font-mono font-bold text-stone-900 dark:text-stone-100">${nuevaCita.time.slice(0,5)}</span>.</p>
        <div class="flex justify-end gap-3 mt-1 border-t border-stone-100 dark:border-stone-800/60 pt-2">
          <button id="btn-cerrar-toast" class="text-[9px] font-mono uppercase tracking-wider text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors">Cerrar</button>
          <button id="btn-ir-toast" class="text-[9px] font-mono uppercase tracking-wider border border-stone-200 dark:border-stone-700 px-2 py-0.5 rounded hover:bg-stone-50 dark:hover:bg-stone-800 transition-all font-bold">Revisar</button>
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
          if (payload.new.status !== 'blocked') {
            mostrarToastLlamativo(payload.new)
          }
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
    const config: Record<string, { label: string, color: string, bg: string, icon: any }> = {
      pending: { label: 'Pendiente', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/5 border-amber-500/10', icon: Clock },
      confirmed: { label: 'Confirmada', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/10', icon: CheckCircle2 },
      in_progress: { label: 'En proceso', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/5 border-blue-500/10', icon: Play },
      completed: { label: 'Completada', color: 'text-stone-500 dark:text-stone-400', bg: 'bg-stone-500/5 border-stone-500/10', icon: Award },
      cancelled: { label: 'Cancelada', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/5 border-rose-500/10', icon: X },
      blocked: { label: 'Bloqueado', color: 'text-stone-600 dark:text-stone-400', bg: 'bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800', icon: Ban },
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
  // VISTA DÍA - HYBRID TIMELINE CARDS
  // ============================================================
  const renderVistaDia = () => {
    const citasDelDia = citas.filter(c => c.date === format(fechaSeleccionada, 'yyyy-MM-dd'))
    const citasOrdenadas = [...citasDelDia].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

    if (citasOrdenadas.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-12 h-12 rounded-full border border-dashed border-stone-200 dark:border-stone-800 flex items-center justify-center bg-stone-50 dark:bg-stone-900/40">
            <Sparkles className="w-4 h-4 text-stone-400 stroke-[1.25]" />
          </div>
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-widest text-stone-400">Sin Movimiento</p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">No hay citas agendadas para este día.</p>
          </div>
          <button 
            onClick={() => setShowNewAppointment(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-stone-50 dark:hover:bg-stone-900 transition-all text-stone-600 dark:text-stone-300"
          >
            <Plus className="w-3.5 h-3.5" />
            Agendar turno
          </button>
        </div>
      )
    }

    const agruparPorFranja = () => {
      const grupos = {
        mañana: [] as any[],
        tarde: [] as any[],
        noche: [] as any[]
      }

      citasOrdenadas.forEach(cita => {
        if (!cita.time) return
        const hora = parseInt(cita.time.split(':')[0])
        if (hora < 12) grupos.mañana.push(cita)
        else if (hora < 18) grupos.tarde.push(cita)
        else grupos.noche.push(cita)
      })

      return grupos
    }

    const grupos = agruparPorFranja()
    const franjas = [
      { key: 'mañana', label: 'Mañana', icon: <Clock className="w-3 h-3 text-stone-400" />, citas: grupos.mañana },
      { key: 'tarde', label: 'Tarde', icon: <Clock className="w-3 h-3 text-stone-400" />, citas: grupos.tarde },
      { key: 'noche', label: 'Noche', icon: <Clock className="w-3 h-3 text-stone-400" />, citas: grupos.noche }
    ]

    return (
      <div className="space-y-6 pb-4">
        <div className="flex items-center justify-between p-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/10">
          <div>
            <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold">
              {format(fechaSeleccionada, 'EEEE', { locale: es })}
            </p>
            <h2 className="text-xl font-serif italic text-stone-900 dark:text-stone-100 mt-1">
              {format(fechaSeleccionada, 'd', { locale: es })}
              <span className="text-xs font-serif font-normal text-stone-400 ml-1">
                de {format(fechaSeleccionada, 'MMMM', { locale: es })}
              </span>
            </h2>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider bg-stone-100 dark:bg-stone-900 text-stone-500 border border-stone-200 dark:border-stone-800 px-3 py-1 rounded-md">
              {citasOrdenadas.length} {citasOrdenadas.length === 1 ? 'Turno' : 'Turnos'}
            </span>
          </div>
        </div>

        {franjas.map(({ key, label, icon, citas: citasFranja }) => {
          if (citasFranja.length === 0) return null

          return (
            <div key={key} className="space-y-2.5">
              <div className="flex items-center gap-2 border-b border-stone-100 dark:border-stone-900 pb-1.5">
                {icon}
                <h3 className="text-[10px] font-mono uppercase tracking-widest font-bold text-stone-400">{label}</h3>
                <span className="text-[10px] font-mono text-stone-400">({citasFranja.length})</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {citasFranja.map((cita) => {
                  const statusInfo = getStatusBadge(cita.status)
                  const horaMostrar = cita.time ? cita.time.substring(0, 5) : '--:--'
                  const isCompleted = cita.status === 'completed'
                  const isProcessing = cita.status === 'in_progress'

                  let cardBg = 'bg-white dark:bg-[#110f0e]/40 border-stone-200 dark:border-stone-900/80'
                  if (isCompleted) {
                    cardBg = 'bg-stone-50/40 dark:bg-stone-950/10 border-stone-200 dark:border-stone-900/50 opacity-70'
                  }
                  if (isProcessing) {
                    cardBg = 'bg-white dark:bg-[#110f0e]/50 border-amber-500/20 dark:border-amber-500/20'
                  }

                  return (
                    <div 
                      key={cita.id} 
                      onClick={() => abrirDetalleCita(cita)}
                      className={`relative overflow-hidden rounded-xl border p-4 transition-all cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900/30 flex items-center justify-between gap-4 ${cardBg}`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Indicador de hora elegante */}
                        <div className="w-12 h-12 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center shrink-0">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span className="text-[10px] font-mono font-bold mt-0.5 text-stone-600 dark:text-stone-300">{horaMostrar}</span>
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate flex items-center gap-1.5">
                            <User className="w-3 h-3 text-stone-400" /> {cita.clients?.name || 'Cliente'}
                          </h4>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate flex items-center gap-1.5">
                            <Scissors className="w-3 h-3 text-stone-400" /> {cita.services?.name || 'Servicio'}
                          </p>
                          <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono flex items-center gap-1">
                            <span>💅 {cita.staff?.name || 'Sin asignar'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-xs font-mono font-bold text-stone-900 dark:text-stone-200">
                          ${Number(cita.services?.price || 0).toLocaleString()}
                        </span>
                        <span className={`text-[8px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ============================================================
  // VISTA SEMANA
  // ============================================================
  const renderVistaSemana = () => {
    const weekStart = startOfWeek(fechaSeleccionada, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(fechaSeleccionada, { weekStartsOn: 1 }) })

    const horaInicioNum = 9
    const horaFinNum = 20
    const totalHoras = horaFinNum - horaInicioNum + 1
    const horasCuadricula = Array.from({ length: totalHoras }, (_, i) => i + horaInicioNum)
    const HORA_ALTURA = 70

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
        <div className="overflow-x-auto select-none border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-[#0c0a09]">
          <div className="min-w-[900px] flex flex-col">

            {/* Cabecera de días de la semana */}
            <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/80 sticky top-0 z-10">
              <div className="w-16 flex-shrink-0 border-r border-stone-200 dark:border-stone-800" />
              <div className="flex-1 grid grid-cols-7">
                {weekDays.map((day) => {
                  const isTodayDate = isToday(day)
                  return (
                    <div 
                      key={day.toString()} 
                      className={`text-center py-2.5 border-r border-stone-200 dark:border-stone-800/60 last:border-r-0 flex flex-col items-center justify-center transition-all ${
                        isTodayDate ? 'bg-stone-100/50 dark:bg-stone-900/40' : ''
                      }`}
                    >
                      <span className={`text-[9px] font-mono uppercase tracking-widest font-bold ${
                        isTodayDate ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400'
                      }`}>
                        {format(day, 'EEE', { locale: es })}
                      </span>
                      <div className={`mt-1 text-xs font-mono font-bold ${
                        isTodayDate 
                          ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 w-6 h-6 flex items-center justify-center rounded-md shadow-sm' 
                          : 'text-stone-700 dark:text-stone-300'
                      }`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cuadricula Horaria */}
            <div className="flex relative">
              <div 
                className="w-16 flex-shrink-0 border-r border-stone-200 dark:border-stone-800 bg-stone-50/90 dark:bg-stone-950/90 z-[15] sticky left-0"
                style={{ height: `${totalHoras * HORA_ALTURA}px` }}
              >
                {horasCuadricula.map((hora) => (
                  <div 
                    key={hora} 
                    className="text-[9px] font-mono font-bold text-stone-400 flex items-start justify-end pr-2.5 pt-2" 
                    style={{ height: `${HORA_ALTURA}px` }}
                  >
                    {String(hora).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-x-auto relative">
                <div className="relative" style={{ height: `${totalHoras * HORA_ALTURA}px`, minWidth: '700px' }}>

                  {/* Slots Droppables de Fondo */}
                  <div className="absolute inset-0 grid grid-cols-7" style={{ gridTemplateRows: `repeat(${totalHoras}, ${HORA_ALTURA}px)` }}>
                    {weekDays.map((day, colIdx) => {
                      const dayStr = format(day, 'yyyy-MM-dd')
                      return horasCuadricula.map((hora, rowIdx) => {
                        const horaStr = String(hora).padStart(2, '0')
                        return (
                          <DroppableSlot
                            key={`slot-${dayStr}-${horaStr}`}
                            id={`slot-${dayStr}-${horaStr}`}
                            className="border-r border-b border-stone-100 dark:border-stone-900/40 hover:bg-stone-50 dark:hover:bg-stone-900/20 transition-colors"
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

                  {/* Citas Draggables Flotantes */}
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

                        let cardBgColor = 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 shadow-sm'
                        if (isProcessing) cardBgColor = 'bg-amber-500/[0.03] dark:bg-amber-500/[0.02] border-amber-500/30 text-stone-800 dark:text-stone-100'
                        if (isCompleted) cardBgColor = 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-900 text-stone-400 dark:text-stone-500 opacity-60'

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
                              className={`w-full h-full border rounded-xl p-2 flex flex-col justify-between overflow-hidden transition-all ${cardBgColor} ${
                                isDragging ? 'opacity-40 ring-1 ring-stone-400 dark:ring-stone-700' : 'hover:bg-stone-50 dark:hover:bg-stone-900/60'
                              }`}
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
                                    <span className="text-[9px] font-mono font-bold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">
                                      {horaFormateada}
                                    </span>
                                    <span className={`text-[7px] px-1.5 py-0.5 rounded-full border uppercase font-mono font-bold tracking-wider ${statusInfo.color} ${statusInfo.bg}`}>
                                      {statusInfo.label}
                                    </span>
                                  </div>
                                  <p className="text-[10px] font-bold truncate text-stone-900 dark:text-stone-100 mt-1 tracking-wide">
                                    {cita.clients?.name || 'Cliente'}
                                  </p>
                                  <p className="text-[8px] text-stone-400 dark:text-stone-500 font-medium truncate">
                                    {cita.services?.name || 'Servicio'}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between text-[8px] border-t border-stone-100 dark:border-stone-800/60 pt-1 mt-1 font-mono">
                                  <span className="text-stone-400 truncate max-w-[55%]">
                                    👤 {cita.staff?.name || 'Sin'}
                                  </span>
                                  <span className="font-bold text-stone-900 dark:text-stone-200">
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

    const diasConCitas = new Set()
    citas.forEach(c => diasConCitas.add(c.date))

    return (
      <div className="flex flex-col h-full select-none">
        <div className="grid grid-cols-7 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 text-center font-mono font-bold text-[9px] text-stone-400 py-2.5 rounded-t-xl">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, idx) => (
            <span key={idx} className="uppercase tracking-widest">{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-stone-200 dark:bg-stone-800/80 border-b border-r border-l border-stone-200 dark:border-stone-800 rounded-b-xl overflow-hidden">
          {days.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="bg-stone-50/30 dark:bg-stone-900/10 min-h-[85px]" />
            }

            const citasDelDia = getCitasDelDia(day).sort((a, b) => (a.time || '').localeCompare(b.time || ''))
            const isTodayDate = isToday(day)
            const tieneCitas = citasDelDia.length > 0
            const esDiaConCitas = diasConCitas.has(format(day, 'yyyy-MM-dd'))

            return (
              <div 
                key={idx} 
                onClick={() => { setFechaSeleccionada(day); setViewMode('day') }}
                className={`bg-white dark:bg-[#110f0e]/60 p-2 min-h-[85px] flex flex-col justify-between cursor-pointer transition-all hover:bg-stone-50 dark:hover:bg-stone-900/40 relative group ${
                  isTodayDate ? 'ring-1 ring-inset ring-stone-400 dark:ring-stone-700 bg-stone-50/60 dark:bg-stone-900/30' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-mono font-bold flex items-center justify-center rounded-md w-5 h-5 transition-all ${
                    isTodayDate 
                      ? 'bg-stone-950 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm' 
                      : esDiaConCitas 
                        ? 'text-stone-900 dark:text-stone-100 font-bold' 
                        : 'text-stone-400'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {tieneCitas && (
                    <span className="text-[8px] font-mono font-bold text-stone-500 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-1.5 py-0.5 rounded">
                      {citasDelDia.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-0.5 mt-1 overflow-y-hidden max-h-[55px]">
                  {citasDelDia.slice(0, 2).map((cita) => {
                    const hora24 = format24h(cita.time)
                    const isProcessing = cita.status === 'in_progress'
                    const isCompleted = cita.status === 'completed'

                    let badgeStyle = 'bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-900 text-stone-700 dark:text-stone-300'
                    if (isProcessing) badgeStyle = 'bg-white border-amber-500/30 text-stone-800 dark:text-stone-100 border-l-2 border-l-amber-500'
                    if (isCompleted) badgeStyle = 'bg-stone-50 dark:bg-stone-950 border-stone-100 dark:border-stone-900 text-stone-400 dark:text-stone-500 opacity-50 line-through'

                    return (
                      <div 
                        key={cita.id} 
                        onClick={(e) => { e.stopPropagation(); abrirDetalleCita(cita) }}
                        className={`flex items-center gap-1 text-[8px] px-1 py-0.5 rounded transition-all cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-900 truncate ${badgeStyle}`} 
                        title={`${hora24} - ${cita.clients?.name}`}
                      >
                        <span className="font-mono font-bold shrink-0 text-[8px] opacity-80">
                          {hora24}
                        </span>
                        <span className="truncate font-medium flex-1 text-[8px]">
                          {cita.clients?.name || 'Cliente'}
                        </span>
                      </div>
                    )
                  })}

                  {citasDelDia.length > 2 && (
                    <div className="text-[7px] text-stone-400 dark:text-stone-500 font-mono font-bold bg-stone-50 dark:bg-stone-950 rounded border border-stone-100 dark:border-stone-900 text-center py-0.5">
                      +{citasDelDia.length - 2} más
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
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
        <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase">Sincronizando agenda...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 p-4">
        <div className="text-center space-y-3 max-w-sm border border-stone-200 dark:border-stone-800/60 p-6 rounded-xl bg-white dark:bg-[#110f0e]">
          <X className="w-5 h-5 text-rose-500 mx-auto" />
          <p className="text-xs font-mono uppercase tracking-wider text-rose-500">Fallo de sincronización</p>
          <p className="text-[11px] text-stone-400">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-stone-200 dark:border-stone-800 rounded-lg text-[10px] font-mono uppercase tracking-wider hover:bg-stone-50 dark:hover:bg-stone-900 transition-all text-stone-600 dark:text-stone-300"
          >
            <RefreshCw className="w-3 h-3" /> Reintentar
          </button>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <div className={`min-h-screen pb-20 pt-4 antialiased space-y-6 max-w-5xl mx-auto px-4 ${
      isDark ? 'text-stone-300' : 'text-stone-800'
    }`}>

      {/* CABECERA EDITORIAL */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-stone-600 animate-pulse" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-mono font-bold">Panel de Control</p>
          </div>
          <h1 className="text-3xl font-serif italic tracking-tight text-stone-900 dark:text-stone-100 mt-2">
            Agenda <span className="text-stone-400 dark:text-stone-500">Premium</span>
          </h1>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">Gestión integral de turnos, estados de flujo e ingresos del equipo.</p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-end">
          <button 
            onClick={() => setShowNewAppointment(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 text-[11px] font-mono uppercase tracking-wider transition-all hover:opacity-90 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Nueva Cita
          </button>
          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            className="p-2 border border-stone-200 dark:border-stone-800 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900 transition-all text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            title="Calendario rápido"
          >
            <CalendarIcon className="w-4 h-4 stroke-[1.5]" />
          </button>
          <button 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="p-2 border border-stone-200 dark:border-stone-800 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900 transition-all text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            title="Filtros por Staff"
          >
            <Filter className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* SELECTORES Y CONTROL DE FECHAS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Modos de vista */}
        <div className="flex border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/20 rounded-xl p-1 self-start">
          <button 
            onClick={() => setViewMode('day')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all ${
              viewMode === 'day' 
                ? 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-sm' 
                : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
            }`}
          >
            Día
          </button>
          <button 
            onClick={() => setViewMode('week')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all ${
              viewMode === 'week' 
                ? 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-sm' 
                : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
            }`}
          >
            Semana
          </button>
          <button 
            onClick={() => setViewMode('month')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all ${
              viewMode === 'month' 
                ? 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-sm' 
                : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
            }`}
          >
            Mes
          </button>
        </div>

        {/* Navegador de fecha */}
        <div className="flex items-center gap-3 border border-stone-200 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-900/10 rounded-xl px-3 py-1.5 justify-between md:justify-start min-w-[280px]">
          <button 
            onClick={() => cambiarDia(-1)} 
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-900 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200" />
          </button>
          <span className="text-[11px] font-serif italic text-stone-900 dark:text-stone-100 text-center flex-1 font-bold">
            {formatFechaTitulo()}
          </span>
          <button 
            onClick={() => cambiarDia(1)} 
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-900 transition-all"
          >
            <ChevronRight className="w-4 h-4 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200" />
          </button>
        </div>
      </div>

      {/* FILTROS PLEGABLES */}
      {showMobileFilters && (
        <div className="p-4 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50/50 dark:bg-stone-900/20 space-y-1.5">
          <label className="text-[9px] font-mono uppercase tracking-wider font-bold text-stone-400 flex items-center gap-1">
            <Users className="w-3 h-3" /> Filtrar Especialista
          </label>
          <select 
            value={filtroStaff} 
            onChange={(e) => setFiltroStaff(e.target.value)}
            className="w-full sm:w-64 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="todos">Todo el Equipo</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* MINI CALENDARIO INTERACTIVO */}
      {showCalendar && (
        <div className="bg-white dark:bg-[#110f0e] border border-stone-200 dark:border-stone-800/80 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
              <ChevronLeft className="w-4 h-4 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200" />
            </button>
            <span className="text-xs font-mono uppercase tracking-wider text-stone-500 font-bold">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </span>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
              <ChevronRight className="w-4 h-4 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
              <span key={d} className="text-[9px] font-mono text-stone-400 font-bold">{d}</span>
            ))}
            {(() => {
              const start = startOfMonth(currentMonth)
              const end = endOfMonth(currentMonth)
              const days = eachDayOfInterval({ start, end })
              const firstDay = start.getDay() === 0 ? 6 : start.getDay() - 1
              const padded = Array(firstDay).fill(null)
              return [...padded, ...days].map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="p-1" />
                const tieneCita = citas.some(c => c.date === format(day, 'yyyy-MM-dd'))
                const isSelected = isSameDay(day, fechaSeleccionada)
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setFechaSeleccionada(day)
                      setShowCalendar(false)
                    }}
                    className={`p-1.5 rounded-md text-[11px] font-mono font-bold transition-all ${
                      isSelected 
                        ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950' 
                        : tieneCita 
                          ? 'text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-900/60' 
                          : 'text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900/20'
                    }`}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })
            })()}
          </div>
        </div>
      )}

      {/* NOTIFICACIÓN INTERNA DE PENDIENTES */}
      {citasPendientes > 0 && (
        <div className="bg-amber-500/[0.03] border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
              Tienes {citasPendientes} {citasPendientes === 1 ? 'turno pendiente' : 'turnos pendientes'} por confirmar
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
            className="text-[9px] font-mono uppercase border border-amber-500/20 px-2.5 py-1 rounded-md text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/5 transition-all"
          >
            Enfocar
          </button>
        </div>
      )}

      {/* TABLERO DE MÉTRICAS (ESTADÍSTICAS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="border border-stone-200 dark:border-stone-800/80 bg-white dark:bg-[#110f0e]/50 rounded-xl p-3 text-center shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <p className="text-[8px] text-stone-400 font-mono uppercase tracking-widest font-bold">Total Turnos</p>
          <p className="text-xl font-mono font-bold text-stone-900 dark:text-stone-100 mt-0.5">{citas.length}</p>
          <Layers className="w-3.5 h-3.5 mx-auto mt-1 text-stone-400 stroke-[1.25]" />
        </div>
        <div className="border border-stone-200 dark:border-stone-800/80 bg-white dark:bg-[#110f0e]/50 rounded-xl p-3 text-center shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <p className="text-[8px] text-stone-400 font-mono uppercase tracking-widest font-bold">En Proceso</p>
          <p className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {citas.filter(c => c.status === 'in_progress').length}
          </p>
          <Play className="w-3.5 h-3.5 mx-auto mt-1 text-amber-500/40 stroke-[1.25]" />
        </div>
        <div className="border border-stone-200 dark:border-stone-800/80 bg-white dark:bg-[#110f0e]/50 rounded-xl p-3 text-center shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <p className="text-[8px] text-stone-400 font-mono uppercase tracking-widest font-bold">Completados</p>
          <p className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {citas.filter(c => c.status === 'completed').length}
          </p>
          <CheckCircle2 className="w-3.5 h-3.5 mx-auto mt-1 text-emerald-500/40 stroke-[1.25]" />
        </div>
        <div className="border border-stone-200 dark:border-stone-800/80 bg-white dark:bg-[#110f0e]/50 rounded-xl p-3 text-center shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <p className="text-[8px] text-stone-400 font-mono uppercase tracking-widest font-bold">Caja Estimada</p>
          <p className="text-xl font-mono font-bold text-stone-900 dark:text-stone-100 mt-0.5">${totalIngresos.toLocaleString()}</p>
          <DollarSign className="w-3.5 h-3.5 mx-auto mt-1 text-stone-400 stroke-[1.25]" />
        </div>
      </div>

      {/* CONTENEDOR ESTRUCTURAL DE LA AGENDA */}
      <div className="w-full">
        {viewMode === 'day' && renderVistaDia()}
        {viewMode === 'week' && renderVistaSemana()}
        {viewMode === 'month' && renderVistaMes()}
      </div>

      {/* ============================================================
          MODAL: REGISTRO DE NUEVA CITA
          ============================================================ */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-stone-950/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#110f0e] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">

            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-950/20">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg border border-stone-200 dark:border-stone-800 flex items-center justify-center bg-white dark:bg-stone-900 shadow-sm">
                  <Plus className="w-3.5 h-3.5 text-stone-500" />
                </div>
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-stone-900 dark:text-stone-100">Agendar Turno</h3>
                </div>
              </div>
              <button 
                onClick={() => setShowNewAppointment(false)} 
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-900 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              <form onSubmit={(e) => { e.preventDefault(); handleAgendarCita(); }} className="space-y-4">

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold flex items-center gap-1">
                    <User className="w-3 h-3" /> Cliente <span className="text-stone-400 dark:text-stone-600">*</span>
                  </label>
                  <select 
                    value={newCita.clientId}
                    onChange={(e) => setNewCita({...newCita, clientId: e.target.value})}
                    className="w-full bg-stone-50/60 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-700 transition-all"
                    required
                  >
                    <option value="">Selecciona una clienta</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Servicio o Tratamiento <span className="text-stone-400 dark:text-stone-600">*</span>
                  </label>
                  <select 
                    value={newCita.serviceId}
                    onChange={(e) => setNewCita({...newCita, serviceId: e.target.value})}
                    className="w-full bg-stone-50/60 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-700 transition-all"
                    required
                  >
                    <option value="">Selecciona un servicio</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (${s.price})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold flex items-center gap-1">
                    <Users className="w-3 h-3" /> Especialista Asignado
                  </label>
                  <select 
                    value={newCita.staffId}
                    onChange={(e) => setNewCita({...newCita, staffId: e.target.value})}
                    className="w-full bg-stone-50/60 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-700 transition-all"
                  >
                    <option value="">Cualquier especialista</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" /> Fecha <span className="text-stone-400 dark:text-stone-600">*</span>
                    </label>
                    <input 
                      type="date"
                      value={newCita.date}
                      onChange={(e) => setNewCita({...newCita, date: e.target.value})}
                      className="w-full bg-stone-50/60 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-700 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Hora <span className="text-stone-400 dark:text-stone-600">*</span>
                    </label>
                    <TimePicker
                      value={newCita.time}
                      onChange={(time) => setNewCita({...newCita, time})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Observaciones o Notas
                  </label>
                  <textarea 
                    value={newCita.notes}
                    onChange={(e) => setNewCita({...newCita, notes: e.target.value})}
                    rows={2}
                    className="w-full bg-stone-50/60 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-700 resize-none"
                    placeholder="Alergias, especificaciones..."
                  />
                </div>

                {formError && (
                  <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 text-stone-600 dark:text-stone-400 text-[11px] font-mono leading-relaxed">
                    {formError}
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-stone-100 dark:border-stone-900">
                  <button
                    type="button"
                    onClick={() => setShowNewAppointment(false)}
                    className="flex-1 px-4 py-2 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 rounded-xl text-[11px] font-mono uppercase tracking-wider transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-stone-950 dark:bg-stone-100 text-white dark:text-stone-950 rounded-xl text-[11px] font-mono uppercase tracking-wider font-bold transition-opacity hover:opacity-90 shadow-sm"
                  >
                    Confirmar Turno
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: DETALLE Y EDICIÓN DE CITA EXISTENTE
          ============================================================ */}
      {showDetailModal && selectedCita && (
        <div className="fixed inset-0 bg-stone-950/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#110f0e] border border-stone-200 dark:border-stone-800 rounded-2xl p-5 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100 dark:border-stone-900">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-stone-400" />
                Ficha del Turno
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-lg text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                {/* Campos de edición básicos en línea con la lógica */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold">Notas de la Cita</label>
                  <textarea
                    value={selectedCita.notes || ''}
                    onChange={(e) => setSelectedCita({...selectedCita, notes: e.target.value})}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs focus:outline-none resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-3 border-t border-stone-100 dark:border-stone-900">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-2 border border-stone-200 dark:border-stone-800 text-stone-500 rounded-xl text-[11px] font-mono uppercase tracking-wider"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={actualizarCita}
                    className="flex-1 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 font-bold rounded-xl text-[11px] font-mono uppercase tracking-wider"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visualización informativa de la ficha */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-stone-50 dark:border-stone-900">
                    <span className="text-stone-400 font-mono uppercase tracking-wider text-[10px]">Clienta</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{selectedCita.clients?.name || 'Cliente'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-50 dark:border-stone-900">
                    <span className="text-stone-400 font-mono uppercase tracking-wider text-[10px]">Servicio</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{selectedCita.services?.name || 'Servicio'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-50 dark:border-stone-900">
                    <span className="text-stone-400 font-mono uppercase tracking-wider text-[10px]">Especialista</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{selectedCita.staff?.name || 'Sin Asignar'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-50 dark:border-stone-900">
                    <span className="text-stone-400 font-mono uppercase tracking-wider text-[10px]">Horario</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{selectedCita.time?.substring(0,5)} hs ({selectedCita.date})</span>
                  </div>
                  {selectedCita.notes && (
                    <div className="p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-900 rounded-xl text-[11px] text-stone-500 leading-relaxed">
                      <span className="block font-mono text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-0.5">Notas internas</span>
                      {selectedCita.notes}
                    </div>
                  )}
                </div>

                {/* Controles de cambio de estado rápido de tu componente */}
                <div className="space-y-1 pt-2">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold block">Actualizar Estado</label>
                  <div className="grid grid-cols-3 gap-1">
                    {['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].slice(0, 3).map((st: any) => (
                      <button
                        key={st}
                        onClick={() => cambiarEstadoCita(selectedCita.id, st)}
                        className={`px-2 py-1 text-[9px] font-mono uppercase tracking-wider border rounded-md transition-all ${
                          selectedCita.status === st 
                            ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 font-bold' 
                            : 'text-stone-400 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900'
                        }`}
                      >
                        {st === 'pending' ? 'Pendiente' : st === 'confirmed' ? 'Confirmar' : 'Proceso'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Acciones principales del Modal */}
                <div className="flex gap-2 pt-3 border-t border-stone-100 dark:border-stone-900">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 px-4 py-2 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-[11px] font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => eliminarCita(selectedCita.id)}
                    className="flex-1 px-4 py-2 border border-stone-200 dark:border-stone-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-[11px] font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
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
