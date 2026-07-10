'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Calendar as CalendarIcon, Clock, User, Sparkles, 
  ChevronLeft, ChevronRight, CheckCircle2, 
  Play, Filter, DollarSign, Layers, Plus, Trash2, 
  X, Edit, FileText, Users, ChevronDown, 
  Award, Ban, RefreshCw, Scissors, Loader2, Building2,
  CalendarDays, Smartphone, Check
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, startOfMonth, endOfMonth, getDaysInMonth, isSameDay, addDays } from 'date-fns'
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

  // Estados de datos
  const [citas, setCitas] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date())
  const [filtroStaff, setFiltroStaff] = useState<string>('todos')
  const [viewMode, setViewMode] = useState<ViewMode>('week') // Por defecto en semana con vista optimizada
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
  
  // Referencia para scroll automático en móvil
  const mobileDaysContainerRef = useRef<HTMLDivElement>(null)

  const [newCita, setNewCita] = useState({
    clientId: '',
    serviceId: '',
    staffId: '',
    date: '',
    time: '',
    notes: '',
  })

  // Toast persistente y elegante para nuevas citas en tiempo real
  const mostrarToastLlamativo = (nuevaCita: any) => {
    if (!nuevaCita || !nuevaCita.date || !nuevaCita.time) return

    const ID_TOAST = 'toast-nueva-cita'
    let toastExistente = document.getElementById(ID_TOAST)
    if (toastExistente) toastExistente.remove()

    const toast = document.createElement('div')
    toast.id = ID_TOAST
    toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:top-5 md:right-5 z-[9999] p-4 rounded-2xl shadow-2xl w-[92%] max-w-sm transition-all duration-300 border ${
      isDark ? 'bg-zinc-900/95 border-fuchsia-900 text-pink-100' : 'bg-white/95 border-pink-200 text-stone-800'
    } backdrop-blur-md`

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

  // DND Kit Config
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

    // Actualización optimista
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
      console.error('Error al actualizar fecha por arrastre:', err)
      setCitas(copiaCitasPrevias)
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

  // Obtención de datos unificada
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
    }
  }

  useEffect(() => {
    fetchData()

    const canalCitas = supabase
      .channel('cambios-agenda-admin')
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
    if (!confirm('¿Estás seguro de cancelar esta cita?')) return
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

      if (error) throw error
      setCitas(prev => prev.filter(c => c.id !== id))
      setShowDetailModal(false)
    } catch (err) {
      console.error('Error al eliminar:', err)
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
      alert('Error al guardar cambios')
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
      await fetchData()
    } catch (err: any) {
      console.error('Error al agendar:', err)
      setFormError(err.message || 'Error al agendar el turno')
    }
  }

  // COMPONENTE: Listado enfocado del día (usado tanto para Día, Semana-Mobile y Mes-Mobile)
  const renderListadoEnfocado = (fechaFocus: Date) => {
    const citasDelDia = citas.filter(c => c.date === format(fechaFocus, 'yyyy-MM-dd'))
    const citasOrdenadas = [...citasDelDia].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

    if (citasOrdenadas.length === 0) {
      return (
        <div className={`p-8 rounded-2xl border text-center space-y-4 ${
          isDark ? 'bg-zinc-900/20 border-fuchsia-950/40' : 'bg-pink-50/20 border-pink-100'
        }`}>
          <div className="w-12 h-12 rounded-full border border-dashed border-pink-300 dark:border-fuchsia-800/40 flex items-center justify-center mx-auto bg-white dark:bg-zinc-950">
            <CalendarIcon className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-pink-50">Día libre en el Studio</h4>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">Sin turnos reservados para esta fecha.</p>
          </div>
          <button 
            onClick={() => handleSlotClick(format(fechaFocus, 'yyyy-MM-dd'), '10:00')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-pink-500 text-white rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-pink-600 transition-all font-bold"
          >
            <Plus className="w-3.5 h-3.5" /> Agendar aquí
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {citasOrdenadas.map((cita) => {
          const statusInfo = getStatusBadge(cita.status)
          const horaMostrar = cita.time ? cita.time.substring(0, 5) : '--:--'
          const isCompleted = cita.status === 'completed'
          const isProcessing = cita.status === 'in_progress'

          let cardBg = isDark ? 'bg-zinc-900/40 border-fuchsia-950/40' : 'bg-white border-pink-100 shadow-sm'
          if (isCompleted) cardBg = isDark ? 'bg-zinc-950/30 border-fuchsia-950/10 opacity-60' : 'bg-stone-50/70 border-stone-200/40 opacity-70'
          if (isProcessing) cardBg = isDark ? 'bg-fuchsia-950/20 border-pink-500/30 shadow-md' : 'bg-pink-50/30 border-pink-200 shadow-md'

          return (
            <div 
              key={cita.id} 
              onClick={() => abrirDetalleCita(cita)}
              className={`relative overflow-hidden rounded-2xl border p-4 transition-all cursor-pointer hover:scale-[1.005] flex items-center justify-between gap-3 ${cardBg}`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
                cita.status === 'pending' ? 'bg-amber-400' :
                cita.status === 'confirmed' ? 'bg-emerald-400' :
                cita.status === 'in_progress' ? 'bg-pink-500 animate-pulse' :
                cita.status === 'completed' ? 'bg-stone-400' : 'bg-rose-500'
              }`} />

              <div className="flex items-center gap-3.5 min-w-0 pl-1">
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                  isDark ? 'border-fuchsia-950 bg-zinc-950 text-pink-300' : 'border-pink-50 bg-pink-50/30 text-pink-700'
                }`}>
                  <Clock className="w-3 h-3 opacity-60" />
                  <span className="text-[11px] font-mono font-black mt-0.5">{horaMostrar}</span>
                </div>

                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-sm font-black text-stone-900 dark:text-pink-50 truncate tracking-wide">
                    {cita.clients?.name || 'Cliente'}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-pink-200/50">
                    <span className="font-bold text-pink-500 truncate max-w-[120px]">💅 {cita.services?.name || 'Servicio'}</span>
                    <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-fuchsia-900 shrink-0" />
                    <span className="truncate max-w-[100px]">✨ {cita.staff?.name || 'Cualquiera'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-xs font-mono font-black text-stone-900 dark:text-pink-200">
                  ${Number(cita.services?.price || 0).toLocaleString()}
                </span>
                <span className={`text-[8px] font-mono uppercase tracking-widest font-black px-2 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // VISTA: Día tradicional
  const renderVistaDia = () => {
    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isDark ? 'bg-zinc-900/40 border-fuchsia-950/60' : 'bg-white border-pink-50 shadow-sm'
        }`}>
          <div>
            <p className="text-[9px] font-mono text-pink-500 uppercase tracking-widest font-bold">Fecha enfocada</p>
            <h3 className="text-xl font-serif italic text-stone-900 dark:text-pink-50 capitalize mt-0.5">
              {format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}
            </h3>
          </div>
          <button 
            onClick={() => handleSlotClick(format(fechaSeleccionada, 'yyyy-MM-dd'), '12:00')}
            className="p-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {renderListadoEnfocado(fechaSeleccionada)}
      </div>
    )
  }

  // VISTA: Semana (Mobile-First: Carrusel de enfoque de 1 día | Escritorio: Grilla Completa)
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
        {/* === VERSION MOBILE: Carrusel de tarjetas de enfoque activo === */}
        <div className="block md:hidden space-y-4">
          <div className="relative">
            <div 
              ref={mobileDaysContainerRef}
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {weekDays.map((day) => {
                const isSelected = isSameDay(day, fechaSeleccionada)
                const isTodayDate = isToday(day)
                const citasDelDia = getCitasDelDia(day)
                
                return (
                  <button
                    key={day.toString()}
                    onClick={() => setFechaSeleccionada(day)}
                    className={`flex-shrink-0 w-[68px] py-3 rounded-2xl border text-center snap-center transition-all flex flex-col items-center justify-between gap-1.5 ${
                      isSelected 
                        ? 'bg-gradient-to-b from-pink-500 to-rose-500 border-transparent text-white shadow-md shadow-pink-500/10 scale-105' 
                        : isDark 
                          ? 'bg-zinc-950 border-fuchsia-950/60 text-pink-100/60' 
                          : 'bg-white border-pink-100 text-stone-700'
                    }`}
                  >
                    <span className={`text-[8px] font-mono uppercase tracking-widest font-black ${
                      isSelected ? 'text-pink-100' : 'text-stone-400 dark:text-pink-300/40'
                    }`}>
                      {format(day, 'EEE', { locale: es })}
                    </span>
                    <span className="text-base font-mono font-black">{format(day, 'd')}</span>
                    
                    {/* Indicador de carga de trabajo de manera estética */}
                    <div className="h-1.5 flex items-center gap-0.5">
                      {citasDelDia.slice(0, 3).map((_, i) => (
                        <span 
                          key={i} 
                          className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-pink-500'}`} 
                        />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
            
            {/* Sombras difuminadas laterales para sugerir scroll */}
            <div className="absolute top-0 bottom-2 left-0 w-4 bg-gradient-to-r from-stone-50 dark:from-zinc-950 to-transparent pointer-events-none" />
            <div className="absolute top-0 bottom-2 right-0 w-4 bg-gradient-to-l from-stone-50 dark:from-zinc-950 to-transparent pointer-events-none" />
          </div>

          {/* Tarjeta de enfoque activo para el día seleccionado */}
          <div className={`p-4.5 rounded-2xl border ${
            isDark ? 'bg-zinc-950/40 border-fuchsia-950/60' : 'bg-white border-pink-100/60 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-pink-100/40 dark:border-fuchsia-950/50">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-pink-600 dark:text-pink-400 font-black">
                  Turnos para hoy
                </h4>
              </div>
              <button 
                onClick={() => handleSlotClick(format(fechaSeleccionada, 'yyyy-MM-dd'), '12:00')}
                className="text-[9px] font-mono uppercase tracking-wider text-pink-500 font-bold flex items-center gap-0.5 hover:opacity-85"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Turno
              </button>
            </div>
            {renderListadoEnfocado(fechaSeleccionada)}
          </div>
        </div>

        {/* === VERSION DESKTOP: Grilla clásica Drag and Drop === */}
        <div className="hidden md:block">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className={`overflow-x-auto select-none rounded-2xl border ${
              isDark ? 'border-fuchsia-950 bg-zinc-900/20' : 'border-pink-100 bg-white shadow-sm'
            }`}>
              <div className="min-w-[950px] flex flex-col">
                {/* Cabecera de días */}
                <div className={`flex border-b ${
                  isDark ? 'border-fuchsia-950 bg-zinc-950/80' : 'border-pink-100 bg-pink-50/20'
                }`}>
                  <div className={`w-16 flex-shrink-0 border-r ${isDark ? 'border-fuchsia-950' : 'border-pink-100'}`} />
                  <div className="flex-1 grid grid-cols-7">
                    {weekDays.map((day) => {
                      const isTodayDate = isToday(day)
                      const citasDelDia = getCitasDelDia(day)
                      const tieneCitas = citasDelDia.length > 0

                      return (
                        <div 
                          key={day.toString()} 
                          className={`text-center py-3.5 border-r last:border-r-0 transition-all ${
                            isDark ? 'border-fuchsia-950' : 'border-pink-50'
                          } ${isTodayDate ? (isDark ? 'bg-fuchsia-950/20' : 'bg-pink-50/40') : ''}`}
                        >
                          <span className={`text-[9px] font-mono uppercase tracking-widest font-black ${
                            isTodayDate ? 'text-pink-500' : 'text-stone-400 dark:text-pink-300/30'
                          }`}>
                            {format(day, 'EEE', { locale: es })}
                          </span>
                          <div className={`mt-1.5 text-base font-mono font-black ${
                            isTodayDate 
                              ? `w-8 h-8 flex items-center justify-center rounded-xl mx-auto ${
                                isDark ? 'bg-gradient-to-tr from-pink-500 to-rose-500 text-white' : 'bg-stone-900 text-white'
                              } shadow-sm` 
                              : `text-stone-700 dark:text-pink-100`
                          }`}>
                            {format(day, 'd')}
                          </div>
                          {tieneCitas && (
                            <div className="mt-1 flex justify-center gap-1">
                              {citasDelDia.slice(0, 3).map((_, i) => (
                                <span key={i} className="w-1 h-1 rounded-full bg-pink-400" />
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Grid con horarios */}
                <div className="flex relative">
                  {/* Regla de horas */}
                  <div className={`w-16 flex-shrink-0 border-r ${
                    isDark ? 'border-fuchsia-950 bg-zinc-950/90' : 'border-pink-100 bg-pink-50/10'
                  } z-10`} style={{ height: `${totalHoras * HORA_ALTURA}px` }}>
                    {horasCuadricula.map((hora) => (
                      <div 
                        key={hora} 
                        className="text-[10px] font-mono font-bold text-stone-400 dark:text-pink-200/40 flex items-start justify-end pr-3 pt-2" 
                        style={{ height: `${HORA_ALTURA}px` }}
                      >
                        {String(hora).padStart(2, '0')}:00
                      </div>
                    ))}
                  </div>

                  {/* Cuerpo de la matriz */}
                  <div className="flex-1 relative" style={{ height: `${totalHoras * HORA_ALTURA}px` }}>
                    {/* Slots interactivos */}
                    <div className="absolute inset-0 grid grid-cols-7" style={{ gridTemplateRows: `repeat(${totalHoras}, ${HORA_ALTURA}px)` }}>
                      {weekDays.map((day, colIdx) => {
                        const dayStr = format(day, 'yyyy-MM-dd')
                        return horasCuadricula.map((hora, rowIdx) => {
                          const horaStr = String(hora).padStart(2, '0')
                          const slotKey = `slot-${dayStr}-${horaStr}`
                          return (
                            <DroppableSlot
                              key={slotKey}
                              id={slotKey}
                              className={`border-r border-b ${
                                isDark ? 'border-fuchsia-950/20 hover:bg-fuchsia-950/10' : 'border-pink-50/50 hover:bg-pink-50/20'
                              }`}
                              style={{
                                gridColumn: colIdx + 1,
                                gridRow: rowIdx + 1,
                                cursor: 'pointer'
                              }}
                            >
                              <div
                                className="w-full h-full"
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleSlotClick(dayStr, horaStr)
                                }}
                              />
                            </DroppableSlot>
                          )
                        })
                      })}
                    </div>

                    {/* Tarjetas de citas arrastrables */}
                    <div className="absolute inset-0 grid grid-cols-7 pointer-events-none" style={{ gridTemplateRows: `repeat(${totalHoras}, ${HORA_ALTURA}px)` }}>
                      {weekDays.map((day, colIdx) => {
                        return getCitasDelDia(day).map((cita) => {
                          if (!cita.time) return null
                          const [hStr] = cita.time.split(':')
                          const horaCita = parseInt(hStr, 10)

                          if (horaCita < horaInicioNum || horaCita > horaFinNum) return null

                          const filaInicio = (horaCita - horaInicioNum) + 1
                          const spanFilas = Math.max(1, Math.round((cita.services?.duration || 60) / 60))
                          const statusInfo = getStatusBadge(cita.status)
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
                                className={`w-full h-full border rounded-xl p-2.5 flex flex-col justify-between overflow-hidden transition-all ${
                                  isDark ? 'bg-zinc-900 border-fuchsia-950 text-pink-100' : 'bg-white border-pink-100 text-stone-800'
                                } ${isDragging ? 'opacity-30 ring-2 ring-pink-500' : 'hover:shadow-lg'}`}
                              >
                                <div onClick={() => abrirDetalleCita(cita)} className="w-full h-full cursor-pointer flex flex-col justify-between">
                                  <div className="min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[9px] font-mono font-bold bg-pink-50 dark:bg-fuchsia-950/50 px-1.5 py-0.5 rounded">
                                        {cita.time.substring(0, 5)}
                                      </span>
                                      <span className={`text-[7px] px-1.5 py-0.5 rounded-full border uppercase font-mono font-black ${statusInfo.color} ${statusInfo.bg}`}>
                                        {statusInfo.label}
                                      </span>
                                    </div>
                                    <p className="text-xs font-black truncate text-stone-900 dark:text-pink-50 mt-1.5">
                                      {cita.clients?.name || 'Cliente'}
                                    </p>
                                    <p className="text-[10px] text-pink-500 font-bold truncate">
                                      {cita.services?.name || 'Servicio'}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between text-[8px] border-t border-pink-100/20 dark:border-fuchsia-950/40 pt-1.5 mt-1 font-mono">
                                    <span className="truncate">💅 {cita.staff?.name || 'Sin asign.'}</span>
                                    <span className="font-black">${Number(cita.services?.price || 0).toLocaleString()}</span>
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
        </div>
      </div>
    )
  }

  // VISTA: Mes (Mobile-First: Sin texto en celdas, lista abajo | Escritorio: Clásico con mini-badges)
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
        {/* Grilla compacta de mes común para móvil y desktop */}
        <div className={`flex flex-col select-none rounded-2xl overflow-hidden border ${
          isDark ? 'border-fuchsia-950' : 'border-pink-100 bg-white shadow-sm'
        }`}>
          {/* Cabecera de días abreviados */}
          <div className={`grid grid-cols-7 text-center font-mono font-black text-[9px] py-2.5 border-b ${
            isDark ? 'bg-zinc-950/80 text-pink-300/60 border-fuchsia-950' : 'bg-pink-50/40 text-pink-700/80 border-pink-100'
          }`}>
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, idx) => (
              <span key={idx} className="uppercase tracking-widest">{d}</span>
            ))}
          </div>

          {/* Grilla de números */}
          <div className={`grid grid-cols-7 gap-px ${
            isDark ? 'bg-fuchsia-950/30' : 'bg-pink-100/60'
          }`}>
            {days.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className={`${isDark ? 'bg-zinc-950/40' : 'bg-pink-50/10'} min-h-[58px] md:min-h-[90px]`} />
              }

              const isSelected = isSameDay(day, fechaSeleccionada)
              const isTodayDate = isToday(day)
              const citasDelDia = getCitasDelDia(day)
              const tieneCitas = citasDelDia.length > 0

              return (
                <div 
                  key={idx} 
                  onClick={() => setFechaSeleccionada(day)}
                  className={`p-1.5 min-h-[58px] md:min-h-[90px] flex flex-col justify-between cursor-pointer transition-all ${
                    isDark ? 'bg-zinc-950' : 'bg-white'
                  } ${isSelected ? 'bg-pink-500/10 dark:bg-fuchsia-950/20' : 'hover:bg-pink-50/10'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-[11px] font-mono font-black flex items-center justify-center rounded-lg w-5.5 h-5.5 transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-tr from-pink-500 to-rose-500 text-white' 
                        : isTodayDate 
                          ? 'border border-pink-400 text-pink-500' 
                          : 'text-stone-700 dark:text-pink-100'
                    }`}>
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Indicador de turnos: Mobile (Puntitos) vs Desktop (Textos recortados) */}
                  <div className="mt-1 w-full">
                    {/* Puntitos para Mobile */}
                    <div className="flex md:hidden justify-center gap-0.5">
                      {citasDelDia.slice(0, 3).map((cita, i) => (
                        <span 
                          key={i} 
                          className={`w-1 h-1 rounded-full ${
                            cita.status === 'in_progress' ? 'bg-pink-500' :
                            cita.status === 'completed' ? 'bg-stone-400' : 'bg-amber-400'
                          }`} 
                        />
                      ))}
                    </div>

                    {/* Contenido en línea para Escritorio */}
                    <div className="hidden md:block space-y-1 max-h-[50px] overflow-hidden">
                      {citasDelDia.slice(0, 2).map((cita) => (
                        <div 
                          key={cita.id}
                          className={`text-[8px] px-1.5 py-0.5 rounded truncate font-mono flex items-center gap-1 ${
                            isDark ? 'bg-zinc-900 text-pink-300' : 'bg-pink-50 text-pink-800'
                          }`}
                        >
                          <span className="font-black shrink-0">{cita.time?.substring(0, 5)}</span>
                          <span className="truncate">{cita.clients?.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tarjeta de enfoque bajo el mes en móvil */}
        <div className="block md:hidden p-4.5 rounded-2xl border bg-white dark:bg-zinc-950/40 border-pink-100 dark:border-fuchsia-950/60 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-pink-100/40 dark:border-fuchsia-950/40 pb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-pink-500 font-bold">
              Detalle del {format(fechaSeleccionada, "d 'de' MMMM", { locale: es })}
            </span>
            <button 
              onClick={() => handleSlotClick(format(fechaSeleccionada, 'yyyy-MM-dd'), '12:00')}
              className="text-[9px] font-mono bg-pink-100 text-pink-600 px-2.5 py-1 rounded-lg font-black"
            >
              + Agendar
            </button>
          </div>
          {renderListadoEnfocado(fechaSeleccionada)}
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen pb-20 pt-4 antialiased space-y-5 max-w-6xl mx-auto px-4 ${
      isDark ? 'text-pink-100' : 'text-stone-800'
    }`}>
      {/* Cabecera optimizada con márgenes móviles controlados */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-pink-100 dark:border-fuchsia-950">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
            <p className="text-[9px] uppercase tracking-[0.25em] text-pink-500 font-mono font-black">Control Studio</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-stone-900 dark:text-pink-50 mt-1">
            Agenda <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent italic font-normal">Fresh Nails</span>
          </h1>
          <p className="text-[11px] text-stone-400 dark:text-pink-200/40 mt-0.5">Manejo óptimo de turnos y sincronización offline/online en tiempo real.</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowNewAppointment(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[11px] font-mono uppercase tracking-widest font-bold shadow-md shadow-pink-500/10 active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" /> Nuevo Turno
          </button>
          <button 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`p-2.5 border rounded-xl transition-all ${
              showMobileFilters ? 'bg-pink-500 border-pink-500 text-white' : 'border-pink-100 dark:border-fuchsia-950 text-pink-500'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controladores de Fecha y Vistas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Selector de Vistas */}
        <div className="flex border border-pink-100 dark:border-fuchsia-950 bg-pink-50/20 dark:bg-fuchsia-950/10 rounded-xl p-1 justify-between sm:justify-start">
          {(['day', 'week', 'month'] as const).map((mode) => (
            <button 
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 sm:flex-initial px-5 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-black transition-all ${
                viewMode === mode 
                  ? 'bg-white dark:bg-zinc-900 border border-pink-100 dark:border-fuchsia-900/40 text-pink-600 dark:text-pink-400 shadow-sm' 
                  : 'text-stone-400 hover:text-pink-500 dark:hover:text-pink-300'
              }`}
            >
              {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>

        {/* Navegador de Fecha */}
        <div className="flex items-center gap-2 border border-pink-100 dark:border-fuchsia-950 bg-pink-50/10 dark:bg-fuchsia-950/10 rounded-xl px-2 py-1 justify-between">
          <button onClick={() => cambiarDia(-1)} className="p-1.5 rounded-lg hover:bg-pink-50 dark:hover:bg-fuchsia-950/40">
            <ChevronLeft className="w-4 h-4 text-pink-500" />
          </button>
          <span className="text-xs font-serif font-extrabold text-stone-900 dark:text-pink-100 text-center flex-1 capitalize tracking-wide px-3">
            {formatFechaTitulo()}
          </span>
          <button onClick={() => cambiarDia(1)} className="p-1.5 rounded-lg hover:bg-pink-50 dark:hover:bg-fuchsia-950/40">
            <ChevronRight className="w-4 h-4 text-pink-500" />
          </button>
        </div>
      </div>

      {/* Panel de Filtros Especialistas */}
      {showMobileFilters && (
        <div className={`p-4 border rounded-2xl animate-fade-in ${
          isDark ? 'bg-zinc-950/40 border-fuchsia-950' : 'bg-pink-50/20 border-pink-100'
        }`}>
          <label className="text-[10px] font-mono uppercase tracking-widest font-black text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Filtrar por Profesional
          </label>
          <select 
            value={filtroStaff} 
            onChange={(e) => setFiltroStaff(e.target.value)}
            className={`w-full sm:w-72 mt-2 border rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-pink-400 focus:outline-none ${
              isDark ? 'bg-zinc-900 border-fuchsia-950 text-pink-100' : 'bg-white border-pink-100 text-stone-700'
            }`}
          >
            <option value="todos">🌸 Mostrar todos los turnos del equipo</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>✨ {s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Indicador de Turnos Pendientes */}
      {citasPendientes > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold">
              Tenes {citasPendientes} {citasPendientes === 1 ? 'turno por confirmar' : 'turnos esperando aprobación'}
            </p>
          </div>
          <button 
            onClick={() => { setViewMode('day'); setFiltroStaff('todos') }}
            className="text-[9px] font-mono uppercase bg-white dark:bg-zinc-900 border border-amber-400/40 px-2.5 py-1 rounded-lg text-amber-700 dark:text-amber-400 font-black"
          >
            Resolver
          </button>
        </div>
      )}

      {/* Grid de Métricas Generales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`border rounded-2xl p-3 text-center ${
          isDark ? 'bg-zinc-900/40 border-fuchsia-950/60' : 'bg-white border-pink-100'
        }`}>
          <p className="text-[8px] text-stone-400 dark:text-pink-300/40 font-mono uppercase tracking-widest font-black">Turnos Totales</p>
          <p className="text-xl font-mono font-black text-stone-900 dark:text-pink-100 mt-0.5">{citas.length}</p>
        </div>
        <div className={`border rounded-2xl p-3 text-center ${
          isDark ? 'bg-zinc-900/40 border-fuchsia-950/60' : 'bg-white border-pink-100'
        }`}>
          <p className="text-[8px] text-stone-400 dark:text-pink-300/40 font-mono uppercase tracking-widest font-black">En Sillón</p>
          <p className="text-xl font-mono font-black text-pink-600 dark:text-pink-400 mt-0.5">
            {citas.filter(c => c.status === 'in_progress').length}
          </p>
        </div>
        <div className={`border rounded-2xl p-3 text-center ${
          isDark ? 'bg-zinc-900/40 border-fuchsia-950/60' : 'bg-white border-pink-100'
        }`}>
          <p className="text-[8px] text-stone-400 dark:text-pink-300/40 font-mono uppercase tracking-widest font-black">Completados</p>
          <p className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {citas.filter(c => c.status === 'completed').length}
          </p>
        </div>
        <div className="border rounded-2xl p-3 text-center bg-gradient-to-tr from-pink-50/40 to-rose-50/20 dark:from-fuchsia-950/10 dark:to-transparent border-pink-100 dark:border-fuchsia-950">
          <p className="text-[8px] text-pink-600 dark:text-pink-400 font-mono uppercase tracking-widest font-black">Caja Cerrada</p>
          <p className="text-xl font-mono font-black text-stone-900 dark:text-pink-100 mt-0.5 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent dark:from-pink-300 dark:to-amber-300">
            ${totalIngresos.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Renderizado de la Vista Seleccionada */}
      <div className="w-full">
        {viewMode === 'day' && renderVistaDia()}
        {viewMode === 'week' && renderVistaSemana()}
        {viewMode === 'month' && renderVistaMes()}
      </div>

      {/* MODAL: Nuevo Turno */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-zinc-950/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
            isDark ? 'bg-zinc-900 border border-fuchsia-950' : 'bg-white border border-pink-100'
          }`}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${
              isDark ? 'border-fuchsia-950 bg-zinc-950/40' : 'border-pink-100 bg-pink-50/10'
            }`}>
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-pink-500" />
                <h3 className="text-xs font-mono uppercase tracking-widest font-black text-stone-900 dark:text-pink-100">Agendar Turno VIP</h3>
              </div>
              <button onClick={() => setShowNewAppointment(false)} className="p-1.5 hover:bg-pink-50 dark:hover:bg-fuchsia-950/60 rounded-xl text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 max-h-[70vh] space-y-4">
              <form onSubmit={(e) => { e.preventDefault(); handleAgendarCita() }} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-pink-300/40 font-bold">Cliente *</label>
                  <select 
                    value={newCita.clientId}
                    onChange={(e) => setNewCita({...newCita, clientId: e.target.value})}
                    className={`w-full rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-pink-400 focus:outline-none ${
                      isDark ? 'bg-zinc-950 border border-fuchsia-950 text-pink-100' : 'bg-pink-50/30 border border-pink-100 text-stone-800'
                    }`}
                    required
                  >
                    <option value="">Selecciona una clienta de la lista</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-pink-300/40 font-bold">Servicio *</label>
                  <select 
                    value={newCita.serviceId}
                    onChange={(e) => setNewCita({...newCita, serviceId: e.target.value})}
                    className={`w-full rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-pink-400 focus:outline-none ${
                      isDark ? 'bg-zinc-950 border border-fuchsia-950 text-pink-100' : 'bg-pink-50/30 border border-pink-100 text-stone-800'
                    }`}
                    required
                  >
                    <option value="">Selecciona un servicio</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (${s.price})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-pink-300/40 font-bold">Especialista Asignado</label>
                  <select 
                    value={newCita.staffId}
                    onChange={(e) => setNewCita({...newCita, staffId: e.target.value})}
                    className={`w-full rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-pink-400 focus:outline-none ${
                      isDark ? 'bg-zinc-950 border border-fuchsia-950 text-pink-100' : 'bg-pink-50/30 border border-pink-100 text-stone-800'
                    }`}
                  >
                    <option value="">Cualquier especialista disponible</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-pink-300/40 font-bold">Fecha *</label>
                    <input 
                      type="date"
                      value={newCita.date}
                      onChange={(e) => setNewCita({...newCita, date: e.target.value})}
                      className={`w-full rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-pink-400 focus:outline-none ${
                        isDark ? 'bg-zinc-950 border border-fuchsia-950 text-pink-100' : 'bg-pink-50/30 border border-pink-100 text-stone-800'
                      }`}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-pink-300/40 font-bold">Hora *</label>
                    <TimePicker
                      value={newCita.time}
                      onChange={(time) => setNewCita({...newCita, time})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-pink-300/40 font-bold">Notas del Turno</label>
                  <textarea 
                    value={newCita.notes}
                    onChange={(e) => setNewCita({...newCita, notes: e.target.value})}
                    rows={2}
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-pink-400 focus:outline-none resize-none ${
                      isDark ? 'bg-zinc-950 border border-fuchsia-950 text-pink-100' : 'bg-pink-50/30 border border-pink-100 text-stone-800'
                    }`}
                    placeholder="Detalles del diseño de uñas, etc..."
                  />
                </div>

                {formError && (
                  <div className={`p-3 rounded-xl text-[11px] font-mono leading-relaxed border ${
                    isDark ? 'bg-fuchsia-950/20 border-fuchsia-900 text-pink-300' : 'bg-pink-50 border-pink-100 text-pink-800'
                  }`}>
                    {formError}
                  </div>
                )}

                <div className="flex gap-2.5 pt-3 border-t border-pink-100/40 dark:border-fuchsia-950">
                  <button
                    type="button"
                    onClick={() => setShowNewAppointment(false)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-[11px] font-mono uppercase tracking-widest border ${
                      isDark ? 'border-fuchsia-950 text-pink-300/60' : 'border-pink-100 text-stone-500 hover:bg-pink-50'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-mono uppercase tracking-widest font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                  >
                    Confirmar Turno
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Detalle de Cita */}
      {showDetailModal && selectedCita && (
        <div className="fixed inset-0 bg-zinc-950/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-zinc-900 border border-fuchsia-950' : 'bg-white border border-pink-100'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-pink-100/40 dark:border-fuchsia-950">
              <h3 className="text-xs font-mono uppercase tracking-widest font-black text-stone-900 dark:text-pink-100 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-pink-500" /> Detalle del Turno
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-pink-50 dark:hover:bg-fuchsia-950 rounded-xl text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-pink-300/40 font-bold">Notas Internas</label>
                  <textarea
                    value={selectedCita.notes || ''}
                    onChange={(e) => setSelectedCita({...selectedCita, notes: e.target.value})}
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-pink-400 resize-none ${
                      isDark ? 'bg-zinc-950 border border-fuchsia-950 text-pink-100' : 'bg-pink-50/30 border border-pink-100 text-stone-800'
                    }`}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2.5 pt-3 border-t border-pink-100/40 dark:border-fuchsia-950">
                  <button
                    onClick={() => setIsEditing(false)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-[11px] font-mono uppercase tracking-widest border ${
                      isDark ? 'border-fuchsia-950 text-pink-300/60' : 'border-pink-100 text-stone-500'
                    }`}
                  >
                    Atrás
                  </button>
                  <button
                    onClick={actualizarCita}
                    className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-mono uppercase tracking-widest font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-pink-100/20 dark:border-fuchsia-950/40">
                    <span className="text-stone-400 font-mono text-[10px]">Clienta</span>
                    <span className="font-black text-stone-900 dark:text-pink-50">{selectedCita.clients?.name}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-pink-100/20 dark:border-fuchsia-950/40">
                    <span className="text-stone-400 font-mono text-[10px]">Servicio</span>
                    <span className="font-bold text-pink-500">{selectedCita.services?.name}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-pink-100/20 dark:border-fuchsia-950/40">
                    <span className="text-stone-400 font-mono text-[10px]">Especialista</span>
                    <span className="font-bold">{selectedCita.staff?.name || 'Por asignar'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-pink-100/20 dark:border-fuchsia-950/40">
                    <span className="text-stone-400 font-mono text-[10px]">Fecha y Hora</span>
                    <span className="font-mono font-bold text-pink-500">
                      {selectedCita.time?.substring(0,5)} hs • {selectedCita.date}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-pink-100/20 dark:border-fuchsia-950/40">
                    <span className="text-stone-400 font-mono text-[10px]">Estado</span>
                    <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full border ${
                      getStatusBadge(selectedCita.status).bg
                    } ${getStatusBadge(selectedCita.status).color}`}>
                      {getStatusBadge(selectedCita.status).label}
                    </span>
                  </div>
                  {selectedCita.notes && (
                    <div className={`p-3 rounded-xl text-[11px] leading-relaxed border mt-2 ${
                      isDark ? 'bg-zinc-950 border-fuchsia-950 text-pink-200/60' : 'bg-pink-50/40 border-pink-100 text-stone-600'
                    }`}>
                      <span className="block font-mono text-[8px] text-pink-500 font-black mb-0.5">Notas de la Cita:</span>
                      {selectedCita.notes}
                    </div>
                  )}
                </div>

                {/* Switcher de flujo de estados rápido para operadoras */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-stone-400 dark:text-pink-300/40 font-black block">
                    Actualizar Flujo del Turno
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].slice(0, 3).map((st: any) => (
                      <button
                        key={st}
                        onClick={() => cambiarEstadoCita(selectedCita.id, st)}
                        className={`px-2 py-2 text-[9px] font-mono uppercase tracking-wider border rounded-xl transition-all font-black ${
                          selectedCita.status === st 
                            ? 'bg-gradient-to-tr from-pink-500 to-rose-500 text-white border-transparent shadow-sm'
                            : isDark ? 'border-fuchsia-950 text-pink-300/60 hover:bg-fuchsia-950/30' : 'border-pink-100 text-stone-400 hover:bg-pink-50/50'
                        }`}
                      >
                        {st === 'pending' ? '⏳ Espera' : st === 'confirmed' ? '✓ OK' : '💅 Sillón'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-3.5 border-t border-pink-100/40 dark:border-fuchsia-950">
                  <button
                    onClick={() => setIsEditing(true)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-[11px] font-mono uppercase tracking-widest font-black flex items-center justify-center gap-1.5 border ${
                      isDark ? 'border-fuchsia-950 text-pink-300 hover:bg-fuchsia-950/30' : 'border-pink-100 text-stone-700 hover:bg-pink-50'
                    }`}
                  >
                    <Edit className="w-3.5 h-3.5 text-pink-500" /> Editar Notas
                  </button>
                  <button
                    onClick={() => eliminarCita(selectedCita.id)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-mono uppercase tracking-widest font-black flex items-center justify-center gap-1.5 border border-rose-200 text-rose-600 dark:text-rose-400 dark:border-rose-950/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Cancelar Turno
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
