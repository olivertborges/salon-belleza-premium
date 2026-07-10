'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Calendar as CalendarIcon, Clock, User, Sparkles, 
  ChevronLeft, ChevronRight, CheckCircle2, 
  Play, Filter, DollarSign, Layers, Plus, Trash2, 
  X, Edit, FileText, Users, ChevronDown, 
  Award, Ban, RefreshCw, Scissors, Loader2, Building2,
  CalendarDays, Smartphone, Check, TrendingUp, Calendar as CalendarIconCheck
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, startOfMonth, endOfMonth, getDaysInMonth, isSameDay, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import { TimePicker } from '@/components/TimePicker'
import { useSettings } from '@/contexts/SettingsContext'
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
  const { settings } = useSettings()

  // Estados de datos
  const [citas, setCitas] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date())
  const [filtroStaff, setFiltroStaff] = useState<string>('todos')
  const [viewMode, setViewMode] = useState<ViewMode>('week') 
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCita, setSelectedCita] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
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

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

  // Toast para nuevas citas online en tiempo real
  const mostrarToastLlamativo = (nuevaCita: any) => {
    if (!nuevaCita || !nuevaCita.date || !nuevaCita.time) return

    const ID_TOAST = 'toast-nueva-cita'
    let toastExistente = document.getElementById(ID_TOAST)
    if (toastExistente) toastExistente.remove()

    const toast = document.createElement('div')
    toast.id = ID_TOAST
    toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:top-5 md:right-5 z-[9999] p-4 rounded-2xl shadow-2xl w-[92%] max-w-sm transition-all duration-300 border bg-white dark:bg-[#0f0c1b] border-pink-200 dark:border-fuchsia-950 backdrop-blur-md`

    toast.innerHTML = `
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
          </span>
          <h4 class="text-[10px] font-mono font-black uppercase tracking-widest text-pink-600 dark:text-pink-400">¡Nuevo Turno Online!</h4>
        </div>
        <p class="text-xs text-stone-600 dark:text-pink-200/70 leading-relaxed">
          Agendado para el <strong class="font-mono text-pink-600 dark:text-pink-400">${nuevaCita.date}</strong> a las <strong class="font-mono text-pink-600 dark:text-pink-400">${nuevaCita.time.slice(0,5)} hs</strong>.
        </p>
        <div class="flex justify-end gap-3 mt-1.5 border-t border-pink-100 dark:border-fuchsia-950/60 pt-2">
          <button id="btn-cerrar-toast" class="text-[10px] font-mono uppercase tracking-wider text-stone-400 hover:text-pink-500 transition-colors py-1 px-2">Cerrar</button>
          <button id="btn-ir-toast" class="text-[10px] font-mono uppercase tracking-wider bg-pink-500 text-white px-3 py-1 rounded-lg hover:bg-pink-600 transition-all font-bold">Ver Turno</button>
        </div>
      </div>
    `

    document.body.appendChild(toast)

    document.getElementById('btn-cerrar-toast')?.addEventListener('click', () => toast.remove())
    document.getElementById('btn-ir-toast')?.addEventListener('click', () => {
      if (nuevaCita.date) {
        const fechaCita = new Date(nuevaCita.date.replace(/-/g, '/'))
        setFechaSeleccionada(fechaCita)
      }
      setViewMode('day')
      setFiltroStaff('todos')
      toast.remove()
    })

    setTimeout(() => {
      if (document.body.contains(toast)) toast.remove()
    }, 12000)
  }

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 4,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
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
      setSuccess('Cita movida correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error al actualizar fecha por arrastre:', err)
      setCitas(copiaCitasPrevias)
      setError('Error al mover la cita')
      setTimeout(() => setError(null), 3000)
    } finally {
      setActiveId(null)
    }
  }

  const handleSlotClick = (dateStr: string, horaStr: string) => {
    setNewCita({
      clientId: '',
      serviceId: '',
      staffId: filtroStaff !== 'todos' ? filtroStaff : '',
      date: dateStr,
      time: `${horaStr}:00`,
      notes: ''
    })
    setFormError(null)
    setShowNewAppointment(true)
  }

  // Sincronización e Ingesta de Datos Centralizada
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
      console.error('Error al sincronizar datos:', err)
      setError(err.message || 'Error de conexión con el Studio')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()

    const canalCitas = supabase
      .channel('cambios-agenda-admin-v3')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'appointments' },
        (payload) => {
          if (payload.new.status !== 'blocked') {
            mostrarToastLlamativo(payload.new)
          }
          fetchData()
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'appointments' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'appointments' },
        () => fetchData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canalCitas)
    }
  }, [fechaSeleccionada, filtroStaff, viewMode])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

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
      pending: { label: 'Espera', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock },
      confirmed: { label: 'Confirmada', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
      in_progress: { label: 'En sillón', color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', icon: Play },
      completed: { label: 'Finalizado', color: 'text-stone-500 dark:text-fuchsia-300/70', bg: 'bg-stone-500/10 border-stone-500/20 dark:bg-fuchsia-500/10 dark:border-fuchsia-500/20', icon: Award },
      cancelled: { label: 'Cancelado', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: X },
      blocked: { label: 'Bloqueado', color: 'text-stone-600 dark:text-stone-400', bg: 'bg-stone-100 dark:bg-zinc-900 border-stone-200 dark:border-zinc-800', icon: Ban },
    }
    return config[status] || config.pending
  }

  const getCitasDelDia = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return citas.filter(c => c.date === dateStr)
  }

  // Cálculos de KPIs Dinámicos basados en la vista actual
  const totalIngresos = citas
    .filter(c => c.status === 'completed')
    .reduce((sum, c) => sum + Number(c.services?.price || 0), 0)

  const citasPendientes = citas.filter(c => c.status === 'pending').length
  const totalCitasVista = citas.filter(c => c.status !== 'blocked' && c.status !== 'cancelled').length

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
      setSuccess('Estado actualizado correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error actualizando estado:', err)
      setError('Error al actualizar estado')
      setTimeout(() => setError(null), 3000)
    }
  }

  const eliminarCita = async (id: string) => {
    if (!confirm('¿Estás seguro de cancelar esta cita?')) return
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

      if (error) throw error
      setCitas(prev => prev.filter(c => c.id !== id))
      setShowDetailModal(false)
      setSuccess('Cita eliminada correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error al eliminar:', err)
      setError('Error al eliminar la cita')
      setTimeout(() => setError(null), 3000)
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
      setSuccess('Cita actualizada correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error actualizando cita:', err)
      setError('Error al guardar cambios')
      setTimeout(() => setError(null), 3000)
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
          setFormError(`⚠️ Conflicto de horario para ${profesional} en este horario.`)
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
      setSuccess('Cita agendada correctamente')
      setTimeout(() => setSuccess(null), 3000)
      await fetchData()
    } catch (err: any) {
      console.error('Error al agendar:', err)
      setFormError(err.message || 'Error al agendar el turno')
    }
  }

  // COMPONENTE: Listado enfocado (Mobile / Detalle)
  const renderListadoEnfocado = (fechaFocus: Date) => {
    const citasDelDia = citas.filter(c => c.date === format(fechaFocus, 'yyyy-MM-dd'))
    const citasOrdenadas = [...citasDelDia].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

    if (citasOrdenadas.length === 0) {
      return (
        <div className="p-6 rounded-2xl border text-center space-y-3 bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
          <CalendarIcon className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600" />
          <p className="text-xs font-bold text-stone-600 dark:text-stone-400">Sin turnos agendados</p>
          <button 
            onClick={() => handleSlotClick(format(fechaFocus, 'yyyy-MM-dd'), '11:00')}
            className="px-3 py-1.5 text-white rounded-lg text-[9px] font-mono uppercase tracking-widest font-bold hover:scale-105 transition-all"
            style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
          >
            + Cita Rápida
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-2.5 w-full">
        {citasOrdenadas.map((cita) => {
          const statusInfo = getStatusBadge(cita.status)
          const horaMostrar = cita.time ? cita.time.substring(0, 5) : '--:--'

          return (
            <div 
              key={cita.id} 
              onClick={() => abrirDetalleCita(cita)}
              className="relative overflow-hidden rounded-2xl border p-3.5 transition-all cursor-pointer flex items-center justify-between gap-2 bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-500/5"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                cita.status === 'pending' ? 'bg-amber-400' :
                cita.status === 'confirmed' ? 'bg-emerald-400' :
                cita.status === 'in_progress' ? 'bg-pink-500' : 'bg-stone-400'
              }`} />

              <div className="flex items-center gap-3 min-w-0 pl-1.5 flex-1">
                <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 border font-mono bg-white dark:bg-[#0f0c1b] border-pink-100 dark:border-fuchsia-950 text-pink-700 dark:text-pink-300">
                  <span className="text-[10px] font-black">{horaMostrar}</span>
                </div>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <h4 className="text-xs font-black text-stone-900 dark:text-pink-50 truncate">
                    {cita.clients?.name || 'Cliente'}
                  </h4>
                  <p className="text-[10px] font-bold truncate" style={{ color: settings?.primary_color || '#DB5B9A' }}>
                    💅 {cita.services?.name || 'Servicio'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs font-mono font-black text-stone-900 dark:text-pink-100">
                  ${Number(cita.services?.price || 0).toLocaleString()}
                </span>
                <span className={`text-[7px] font-mono uppercase tracking-widest font-black px-1.5 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderVistaDia = () => {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
          <h3 className="text-lg font-serif italic text-stone-900 dark:text-pink-50 capitalize">
            {format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}
          </h3>
        </div>
        {renderListadoEnfocado(fechaSeleccionada)}
      </div>
    )
  }

  // VISTA: Semana con grilla fija de 7 días sin scroll en móvil
  const renderVistaSemana = () => {
    const weekStart = startOfWeek(fechaSeleccionada, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(fechaSeleccionada, { weekStartsOn: 1 }) })

    const horaInicioNum = 9
    const horaFinNum = 20
    const totalHoras = horaFinNum - horaInicioNum + 1
    const horasCuadricula = Array.from({ length: totalHoras }, (_, i) => i + horaInicioNum)
    const HORA_ALTURA = 76

    return (
      <div className="space-y-4">
        {/* VERSION MOBILE RESPONSIVE */}
        <div className="block md:hidden space-y-4">
          <div className="grid grid-cols-7 gap-1 border p-1 rounded-2xl bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, fechaSeleccionada)

              return (
                <button
                  key={day.toString()}
                  onClick={() => setFechaSeleccionada(day)}
                  className={`py-2 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                    isSelected 
                      ? 'text-white shadow-sm scale-105 font-bold'
                      : 'bg-transparent text-stone-700 dark:text-pink-100/70'
                  }`}
                  style={isSelected ? brandGradient : {}}
                >
                  <span className={`text-[8px] font-mono uppercase tracking-tight font-bold ${
                    isSelected ? 'text-pink-100' : 'text-stone-400 dark:text-pink-300/30'
                  }`}>
                    {format(day, 'eeeeee', { locale: es })}
                  </span>
                  <span className="text-xs font-mono font-black">{format(day, 'd')}</span>
                </button>
              )
            })}
          </div>

          <div className="p-4 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 shadow-sm">
            <h4 className="text-[10px] font-mono uppercase tracking-widest font-black mb-3 border-b border-pink-100/20 pb-1.5" style={{ color: settings?.primary_color || '#DB5B9A' }}>
              Turnos: {format(fechaSeleccionada, "EEEE d", { locale: es })}
            </h4>
            {renderListadoEnfocado(fechaSeleccionada)}
          </div>
        </div>

        {/* VERSION DESKTOP */}
        <div className="hidden md:block">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="overflow-x-auto select-none rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 shadow-sm">
              <div className="min-w-[950px] flex flex-col">
                <div className="flex border-b border-pink-100/60 dark:border-fuchsia-950/50">
                  <div className="w-16 flex-shrink-0 border-r border-pink-100/60 dark:border-fuchsia-950/50" />
                  <div className="flex-1 grid grid-cols-7">
                    {weekDays.map((day) => {
                      const isTodayDate = isToday(day)
                      return (
                        <div key={day.toString()} className={`text-center py-3.5 border-r last:border-r-0 border-pink-100/60 dark:border-fuchsia-950/50 ${isTodayDate ? 'bg-pink-500/5' : ''}`}>
                          <span className="text-[9px] font-mono uppercase tracking-widest font-black text-stone-400">{format(day, 'EEE', { locale: es })}</span>
                          <div className={`mt-1.5 text-base font-mono font-black ${isTodayDate ? 'text-pink-500' : 'text-stone-700 dark:text-pink-100'}`}>{format(day, 'd')}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="flex relative">
                  <div className="w-16 flex-shrink-0 border-r border-pink-100/60 dark:border-fuchsia-950/50 z-10 font-mono text-[10px] text-stone-400" style={{ height: `${totalHoras * HORA_ALTURA}px` }}>
                    {horasCuadricula.map((hora) => (
                      <div key={hora} className="pr-3 pt-2 text-right" style={{ height: `${HORA_ALTURA}px` }}>{String(hora).padStart(2, '0')}:00</div>
                    ))}
                  </div>
                  <div className="flex-1 relative" style={{ height: `${totalHoras * HORA_ALTURA}px` }}>
                    <div className="absolute inset-0 grid grid-cols-7" style={{ gridTemplateRows: `repeat(${totalHoras}, ${HORA_ALTURA}px)` }}>
                      {weekDays.map((day, colIdx) => {
                        const dayStr = format(day, 'yyyy-MM-dd')
                        return horasCuadricula.map((hora, rowIdx) => (
                          <DroppableSlot key={`slot-${dayStr}-${hora}`} id={`slot-${dayStr}-${hora}`} className="border-r border-b border-pink-100/30 dark:border-fuchsia-950/10">
                            <div className="w-full h-full" onClick={() => handleSlotClick(dayStr, String(hora).padStart(2, '0'))} />
                          </DroppableSlot>
                        ))
                      })}
                    </div>
                    <div className="absolute inset-0 grid grid-cols-7 pointer-events-none" style={{ gridTemplateRows: `repeat(${totalHoras}, ${HORA_ALTURA}px)` }}>
                      {weekDays.map((day, colIdx) => getCitasDelDia(day).map((cita) => {
                        if (!cita.time) return null
                        const horaCita = parseInt(cita.time.split(':')[0], 10)
                        if (horaCita < horaInicioNum || horaCita > horaFinNum) return null
                        return (
                          <div key={cita.id} className="p-1 pointer-events-auto" style={{ gridColumn: colIdx + 1, gridRow: `${(horaCita - horaInicioNum) + 1} / span 1` }}>
                            <div onClick={() => abrirDetalleCita(cita)} className="bg-white dark:bg-[#0f0c1b] border rounded-xl p-2 cursor-pointer h-full border-pink-100 dark:border-fuchsia-950 hover:shadow-md transition-all">
                              <span className="text-[9px] font-mono px-1 rounded text-pink-600 dark:text-pink-400" style={{ backgroundColor: `${settings?.primary_color || '#DB5B9A'}10` }}>
                                {cita.time.substring(0,5)}
                              </span>
                              <p className="text-xs font-black truncate mt-1 text-stone-900 dark:text-pink-50">{cita.clients?.name}</p>
                            </div>
                          </div>
                        )
                      }))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DndContext>
        </div>
      </div>
    )
  }

  // VISTA: Mes con interactividad corregida al presionar un día
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

    return (
      <div className="space-y-4">
        <div className="flex flex-col rounded-2xl overflow-hidden border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 shadow-sm">
          <div className="grid grid-cols-7 text-center font-mono font-black text-[9px] py-2 border-b bg-pink-50/30 dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950/50">
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((d, idx) => <span key={idx} className="text-stone-500 dark:text-stone-400">{d}</span>)}
          </div>

          <div className="grid grid-cols-7 gap-px bg-pink-100/40 dark:bg-fuchsia-950/20">
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="bg-stone-50/10 min-h-[50px] md:min-h-[80px]" />

              const isSelected = isSameDay(day, fechaSeleccionada)
              const isTodayDate = isToday(day)
              const citasDelDia = getCitasDelDia(day)

              return (
                <div 
                  key={idx} 
                  onClick={() => setFechaSeleccionada(day)}
                  className={`p-2 min-h-[50px] md:min-h-[80px] flex flex-col justify-between cursor-pointer transition-all bg-white dark:bg-[#130f24] ${
                    isSelected ? 'bg-pink-500/10 dark:bg-fuchsia-950/30' : ''
                  } hover:bg-pink-50 dark:hover:bg-fuchsia-950/20`}
                >
                  <span className={`text-xs font-mono font-black flex items-center justify-center rounded-lg w-5 h-5 ${
                    isSelected 
                      ? 'text-white' 
                      : isTodayDate 
                        ? 'border border-pink-500 text-pink-500' 
                        : 'text-stone-700 dark:text-pink-100'
                  }`} style={isSelected ? brandGradient : {}}>
                    {format(day, 'd')}
                  </span>

                  <div className="flex justify-center gap-0.5 mt-1">
                    {citasDelDia.slice(0, 3).map((_, i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Listado dinámico vinculado */}
        <div className="p-4 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 shadow-sm">
          <p className="text-[10px] font-mono font-bold mb-3" style={{ color: settings?.primary_color || '#DB5B9A' }}>
            Turnos del {format(fechaSeleccionada, "d 'de' MMMM", { locale: es })}
          </p>
          {renderListadoEnfocado(fechaSeleccionada)}
        </div>
      </div>
    )
  }

  // LOADING
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: settings?.primary_color || '#DB5B9A' }}></div>
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse" style={{ color: settings?.primary_color || '#DB5B9A' }}>
          Cargando agenda...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1 max-w-full overflow-x-hidden">

      {/* HEADER CON GRADIENTE CONFIGURABLE */}
      <div className="relative overflow-hidden rounded-3xl p-[1px] shadow-xl" style={brandGradient}>
        <div className="absolute inset-0 opacity-20 animate-pulse" style={brandGradient} />
        <div className="relative z-10 rounded-[23px] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0f0c1b]">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3.5 rounded-2xl text-white shadow-md shrink-0" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}>
              <CalendarIcon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold font-mono truncate" style={{ color: settings?.primary_color || '#DB5B9A' }}>
                ✨ {settings?.business_name || 'Salón VIP'}
              </p>
              <h2 className="text-xl md:text-2xl font-serif font-extrabold text-stone-900 dark:text-white mt-0.5 truncate">
                Agenda Fresh Nails
              </h2>
              <p className="text-xs text-stone-500 dark:text-pink-100/60 mt-0.5 truncate">
                Gestión profesional de turnos y horarios
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
            <button 
              onClick={() => setShowNewAppointment(true)}
              className="px-3 py-2 rounded-xl text-white hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
              style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuevo Turno</span>
              <span className="sm:hidden">+</span>
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
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${settings?.primary_color || '#DB5B9A'}10`, color: settings?.primary_color || '#DB5B9A' }}>
            <CalendarIconCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Turnos</p>
            <h3 className="text-sm font-mono font-black text-stone-900 dark:text-pink-100">{totalCitasVista}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Espera</p>
            <h3 className="text-sm font-mono font-black text-amber-500">{citasPendientes}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Caja</p>
            <h3 className="text-sm font-mono font-black text-emerald-500">${totalIngresos.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* SELECTORES DE VISTA Y FECHAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex border rounded-xl p-1 bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
          {(['day', 'week', 'month'] as const).map((mode) => (
            <button 
              key={mode} 
              onClick={() => setViewMode(mode)} 
              className={`px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase font-black transition-all ${
                viewMode === mode 
                  ? 'text-white shadow-sm' 
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-pink-100'
              }`}
              style={viewMode === mode ? brandGradient : {}}
            >
              {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between border rounded-xl px-2 py-1 bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
          <button 
            onClick={() => cambiarDia(-1)} 
            className="p-1.5 hover:bg-pink-50 dark:hover:bg-fuchsia-950/40 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" style={{ color: settings?.primary_color || '#DB5B9A' }} />
          </button>
          <span className="text-xs font-serif font-extrabold text-stone-900 dark:text-pink-100 px-4 capitalize">
            {formatFechaTitulo()}
          </span>
          <button 
            onClick={() => cambiarDia(1)} 
            className="p-1.5 hover:bg-pink-50 dark:hover:bg-fuchsia-950/40 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" style={{ color: settings?.primary_color || '#DB5B9A' }} />
          </button>
        </div>
      </div>

      {/* FILTRO DE STAFF */}
      {staff.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
          <Users className="w-4 h-4 shrink-0" style={{ color: settings?.primary_color || '#DB5B9A' }} />
          <select
            value={filtroStaff}
            onChange={(e) => setFiltroStaff(e.target.value)}
            className="w-full bg-transparent outline-none text-sm font-medium text-stone-700 dark:text-pink-100 min-w-0"
          >
            <option value="todos">Todos los profesionales</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* VISTAS PRINCIPALES */}
      <div className="w-full">
        {viewMode === 'day' && renderVistaDia()}
        {viewMode === 'week' && renderVistaSemana()}
        {viewMode === 'month' && renderVistaMes()}
      </div>

      {/* MODAL: NUEVA CITA */}
      {showNewAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl shadow-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 p-6 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowNewAppointment(false)}
              className="absolute top-4 right-4 p-2 hover:bg-pink-50 dark:hover:bg-fuchsia-950/40 rounded-xl transition-colors text-stone-400 hover:text-stone-700 dark:hover:text-pink-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl text-white shadow-md" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}>
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif font-extrabold text-stone-800 dark:text-pink-100">
                Nuevo Turno
              </h3>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAgendarCita() }} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                  Clienta *
                </label>
                <select
                  value={newCita.clientId}
                  onChange={(e) => setNewCita({...newCita, clientId: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm appearance-none"
                  style={{ 
                    '--tw-ring-color': settings?.primary_color || '#DB5B9A'
                  } as React.CSSProperties}
                  required
                >
                  <option value="">Selecciona Clienta</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                  Servicio *
                </label>
                <select
                  value={newCita.serviceId}
                  onChange={(e) => setNewCita({...newCita, serviceId: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm appearance-none"
                  style={{ 
                    '--tw-ring-color': settings?.primary_color || '#DB5B9A'
                  } as React.CSSProperties}
                  required
                >
                  <option value="">Selecciona Servicio</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} (${s.price})</option>)}
                </select>
              </div>

              {staff.length > 0 && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                    Profesional
                  </label>
                  <select
                    value={newCita.staffId}
                    onChange={(e) => setNewCita({...newCita, staffId: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm appearance-none"
                    style={{ 
                      '--tw-ring-color': settings?.primary_color || '#DB5B9A'
                    } as React.CSSProperties}
                  >
                    <option value="">Sin asignar</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={newCita.date}
                    onChange={(e) => setNewCita({...newCita, date: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm"
                    style={{ 
                      '--tw-ring-color': settings?.primary_color || '#DB5B9A'
                    } as React.CSSProperties}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                    Hora *
                  </label>
                  <TimePicker 
                    value={newCita.time} 
                    onChange={(time) => setNewCita({...newCita, time})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                  Notas
                </label>
                <textarea
                  value={newCita.notes}
                  onChange={(e) => setNewCita({...newCita, notes: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm resize-none"
                  style={{ 
                    '--tw-ring-color': settings?.primary_color || '#DB5B9A'
                  } as React.CSSProperties}
                  rows={2}
                />
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewAppointment(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border hover:bg-pink-50 dark:hover:bg-fuchsia-950/30 transition-all text-xs font-bold uppercase tracking-widest border-pink-100/60 dark:border-fuchsia-950 text-stone-600 dark:text-stone-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl text-white hover:scale-105 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                  style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
                >
                  <Save className="w-4 h-4" />
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETALLE DE CITA */}
      {showDetailModal && selectedCita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl shadow-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 p-6 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowDetailModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-pink-50 dark:hover:bg-fuchsia-950/40 rounded-xl transition-colors text-stone-400 hover:text-stone-700 dark:hover:text-pink-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl text-white shadow-md" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}>
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif font-extrabold text-stone-800 dark:text-pink-100">
                Detalle de Cita
              </h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-pink-100/20 dark:border-fuchsia-950/30">
                <span className="text-stone-500 dark:text-stone-400">Clienta</span>
                <span className="font-bold text-stone-900 dark:text-pink-100">{selectedCita.clients?.name || 'No asignado'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-pink-100/20 dark:border-fuchsia-950/30">
                <span className="text-stone-500 dark:text-stone-400">Servicio</span>
                <span className="font-bold text-stone-900 dark:text-pink-100">{selectedCita.services?.name || 'No asignado'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-pink-100/20 dark:border-fuchsia-950/30">
                <span className="text-stone-500 dark:text-stone-400">Profesional</span>
                <span className="font-bold text-stone-900 dark:text-pink-100">{selectedCita.staff?.name || 'Sin asignar'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-pink-100/20 dark:border-fuchsia-950/30">
                <span className="text-stone-500 dark:text-stone-400">Fecha</span>
                <span className="font-bold text-stone-900 dark:text-pink-100">{selectedCita.date}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-pink-100/20 dark:border-fuchsia-950/30">
                <span className="text-stone-500 dark:text-stone-400">Hora</span>
                <span className="font-bold text-stone-900 dark:text-pink-100">{selectedCita.time?.substring(0,5)} hs</span>
              </div>
              <div className="flex justify-between py-2 border-b border-pink-100/20 dark:border-fuchsia-950/30">
                <span className="text-stone-500 dark:text-stone-400">Estado</span>
                <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${getStatusBadge(selectedCita.status).color}`}>
                  {getStatusBadge(selectedCita.status).label}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-stone-500 dark:text-stone-400">Total</span>
                <span className="font-bold text-stone-900 dark:text-pink-100">${Number(selectedCita.total_price || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mt-4">
              {['pending', 'confirmed', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => cambiarEstadoCita(selectedCita.id, status as any)}
                  className={`p-2 text-[10px] font-mono uppercase font-bold rounded-xl border transition-all ${
                    selectedCita.status === status 
                      ? 'text-white border-transparent' 
                      : 'border-pink-100/60 dark:border-fuchsia-950 text-stone-600 dark:text-stone-400 hover:bg-pink-50 dark:hover:bg-fuchsia-950/30'
                  }`}
                  style={selectedCita.status === status ? brandGradient : {}}
                >
                  {status}
                </button>
              ))}
            </div>

            <button 
              onClick={() => { if(confirm('¿Eliminar esta cita?')) eliminarCita(selectedCita.id) }} 
              className="w-full mt-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all text-xs font-mono uppercase font-bold"
            >
              <Trash2 className="w-3.5 h-3.5 inline mr-2" />
              Eliminar Turno
            </button>
          </div>
        </div>
      )}
    </div>
  )
}