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
  const [viewMode, setViewMode] = useState<ViewMode>('week') 
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

  // Toast para nuevas citas online en tiempo real
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

  // COMPONENTE: Listado enfocado (Mobile / Detalle)
  const renderListadoEnfocado = (fechaFocus: Date) => {
    const citasDelDia = citas.filter(c => c.date === format(fechaFocus, 'yyyy-MM-dd'))
    const citasOrdenadas = [...citasDelDia].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

    if (citasOrdenadas.length === 0) {
      return (
        <div className={`p-6 rounded-xl border text-center space-y-3 ${
          isDark ? 'bg-zinc-900/20 border-fuchsia-950/40' : 'bg-pink-50/20 border-pink-100'
        }`}>
          <p className="text-xs font-bold text-stone-900 dark:text-pink-100">Sin turnos agendados</p>
          <button 
            onClick={() => handleSlotClick(format(fechaFocus, 'yyyy-MM-dd'), '11:00')}
            className="px-3 py-1.5 bg-pink-500 text-white rounded-lg text-[9px] font-mono uppercase tracking-widest font-black"
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
              className={`relative overflow-hidden rounded-xl border p-3.5 transition-all cursor-pointer flex items-center justify-between gap-2 ${
                isDark ? 'bg-zinc-900/60 border-fuchsia-950/50' : 'bg-white border-pink-100 shadow-sm'
              }`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                cita.status === 'pending' ? 'bg-amber-400' :
                cita.status === 'confirmed' ? 'bg-emerald-400' :
                cita.status === 'in_progress' ? 'bg-pink-500' : 'bg-stone-400'
              }`} />

              <div className="flex items-center gap-3 min-w-0 pl-1.5 flex-1">
                <div className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0 border font-mono ${
                  isDark ? 'border-fuchsia-950 bg-zinc-950 text-pink-300' : 'border-pink-50 bg-pink-50/40 text-pink-700'
                }`}>
                  <span className="text-[10px] font-black">{horaMostrar}</span>
                </div>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <h4 className="text-xs font-black text-stone-900 dark:text-pink-50 truncate">
                    {cita.clients?.name || 'Cliente'}
                  </h4>
                  <p className="text-[10px] text-pink-500 font-bold truncate">
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
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-zinc-900/40 border-fuchsia-950' : 'bg-white border-pink-50'}`}>
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
        {/* === VERSION MOBILE RESPONSIVE: Grid fija de 7 columnas exactas === */}
        <div className="block md:hidden space-y-4">
          <div className={`grid grid-cols-7 gap-1 border p-1 rounded-xl bg-pink-50/10 dark:bg-zinc-950/40 ${
            isDark ? 'border-fuchsia-950/60' : 'border-pink-100/60'
          }`}>
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, fechaSeleccionada)
              
              return (
                <button
                  key={day.toString()}
                  onClick={() => setFechaSeleccionada(day)}
                  className={`py-2 rounded-lg text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                    isSelected 
                      ? 'bg-gradient-to-b from-pink-500 to-rose-500 text-white shadow-sm scale-105 font-bold' 
                      : isDark 
                        ? 'bg-zinc-900/40 text-pink-100/70 border border-fuchsia-950/30' 
                        : 'bg-white text-stone-700 border border-pink-50'
                  }`}
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

          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-zinc-950/20 border-fuchsia-950/60' : 'bg-white border-pink-100/60 shadow-sm'
          }`}>
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-pink-500 font-black mb-3 border-b border-pink-100/20 pb-1.5">
              Turnos: {format(fechaSeleccionada, "EEEE d", { locale: es })}
            </h4>
            {renderListadoEnfocado(fechaSeleccionada)}
          </div>
        </div>

        {/* === VERSION DESKTOP === */}
        <div className="hidden md:block">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className={`overflow-x-auto select-none rounded-2xl border ${isDark ? 'border-fuchsia-950 bg-zinc-900/20' : 'border-pink-100 bg-white shadow-sm'}`}>
              <div className="min-w-[950px] flex flex-col">
                <div className={`flex border-b ${isDark ? 'border-fuchsia-950 bg-zinc-950/80' : 'border-pink-100 bg-pink-50/20'}`}>
                  <div className={`w-16 flex-shrink-0 border-r ${isDark ? 'border-fuchsia-950' : 'border-pink-100'}`} />
                  <div className="flex-1 grid grid-cols-7">
                    {weekDays.map((day) => {
                      const isTodayDate = isToday(day)
                      return (
                        <div key={day.toString()} className={`text-center py-3.5 border-r last:border-r-0 ${isDark ? 'border-fuchsia-950' : 'border-pink-50'} ${isTodayDate ? 'bg-pink-500/5' : ''}`}>
                          <span className="text-[9px] font-mono uppercase tracking-widest font-black text-stone-400">{format(day, 'EEE', { locale: es })}</span>
                          <div className={`mt-1.5 text-base font-mono font-black ${isTodayDate ? 'text-pink-500' : 'text-stone-700 dark:text-pink-100'}`}>{format(day, 'd')}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="flex relative">
                  <div className="w-16 flex-shrink-0 border-r z-10 font-mono text-[10px] text-stone-400" style={{ height: `${totalHoras * HORA_ALTURA}px` }}>
                    {horasCuadricula.map((hora) => (
                      <div key={hora} className="pr-3 pt-2 text-right" style={{ height: `${HORA_ALTURA}px` }}>{String(hora).padStart(2, '0')}:00</div>
                    ))}
                  </div>
                  <div className="flex-1 relative" style={{ height: `${totalHoras * HORA_ALTURA}px` }}>
                    <div className="absolute inset-0 grid grid-cols-7" style={{ gridTemplateRows: `repeat(${totalHoras}, ${HORA_ALTURA}px)` }}>
                      {weekDays.map((day, colIdx) => {
                        const dayStr = format(day, 'yyyy-MM-dd')
                        return horasCuadricula.map((hora, rowIdx) => (
                          <DroppableSlot key={`slot-${dayStr}-${hora}`} id={`slot-${dayStr}-${hora}`} className="border-r border-b border-pink-50/30 dark:border-fuchsia-950/10">
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
                            <div onClick={() => abrirDetalleCita(cita)} className="bg-white dark:bg-zinc-900 border rounded-xl p-2 cursor-pointer h-full border-pink-100 dark:border-fuchsia-950">
                              <span className="text-[9px] font-mono bg-pink-50 dark:bg-zinc-950 px-1 rounded text-pink-600">{cita.time.substring(0,5)}</span>
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
        <div className={`flex flex-col rounded-xl overflow-hidden border ${isDark ? 'border-fuchsia-950' : 'border-pink-100 bg-white shadow-sm'}`}>
          <div className="grid grid-cols-7 text-center font-mono font-black text-[9px] py-2 border-b dark:bg-zinc-950 bg-pink-50/30">
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((d, idx) => <span key={idx}>{d}</span>)}
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
                  className={`p-2 min-h-[50px] md:min-h-[80px] flex flex-col justify-between cursor-pointer transition-all ${
                    isDark ? 'bg-zinc-950' : 'bg-white'
                  } ${isSelected ? 'bg-pink-500/10 dark:bg-fuchsia-950/30' : ''}`}
                >
                  <span className={`text-xs font-mono font-black flex items-center justify-center rounded-lg w-5 h-5 ${
                    isSelected ? 'bg-pink-500 text-white' : isTodayDate ? 'border border-pink-500 text-pink-500' : 'text-stone-700 dark:text-pink-100'
                  }`}>
                    {format(day, 'd')}
                  </span>

                  <div className="flex justify-center gap-0.5 mt-1">
                    {citasDelDia.slice(0, 3).map((_, i) => (
                      <span key={i} className="w-1 h-1 rounded-full bg-pink-400" />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Listado dinámico vinculado */}
        <div className="p-4 rounded-xl border bg-white dark:bg-zinc-950/40 border-pink-100 dark:border-fuchsia-950/60 shadow-sm">
          <p className="text-[10px] font-mono text-pink-500 font-bold mb-3">
            Turnos del {format(fechaSeleccionada, "d 'de' MMMM", { locale: es })}
          </p>
          {renderListadoEnfocado(fechaSeleccionada)}
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen pb-20 pt-4 max-w-6xl mx-auto px-4 ${isDark ? 'text-pink-100' : 'text-stone-800'}`}>
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-pink-100 dark:border-fuchsia-950">
        <div>
          <h1 className="text-3xl font-serif font-black text-stone-900 dark:text-pink-50">
            Agenda <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent italic font-normal">Fresh Nails</span>
          </h1>
        </div>
        <button onClick={() => setShowNewAppointment(true)} className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[11px] font-mono uppercase tracking-widest font-bold shadow-md shadow-pink-500/10">
          <Plus className="w-4 h-4" /> Nuevo Turno
        </button>
      </div>

      {/* === SECCIÓN DE CAPIS / KPIS MODERNAS Y RESPONSIVAS === */}
      <div className="grid grid-cols-3 gap-2.5 my-5">
        {/* KPI 1: Total Atendidos/Citas */}
        <div className={`p-3 rounded-2xl border transition-all ${
          isDark ? 'bg-zinc-900/40 border-fuchsia-950/60' : 'bg-white border-pink-100 shadow-sm shadow-pink-500/5'
        } flex items-center gap-3`}>
          <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500 hidden xs:block">
            <CalendarIconCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-pink-300/40 font-black truncate">Turnos</p>
            <h3 className="text-sm md:text-base font-mono font-black text-stone-900 dark:text-pink-50">{totalCitasVista}</h3>
          </div>
        </div>

        {/* KPI 2: En Espera / Pendientes */}
        <div className={`p-3 rounded-2xl border transition-all ${
          isDark ? 'bg-zinc-900/40 border-fuchsia-950/60' : 'bg-white border-pink-100 shadow-sm shadow-pink-500/5'
        } flex items-center gap-3`}>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 hidden xs:block">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-pink-300/40 font-black truncate">Espera</p>
            <h3 className="text-sm md:text-base font-mono font-black text-amber-500">{citasPendientes}</h3>
          </div>
        </div>

        {/* KPI 3: Ingresos Completados */}
        <div className={`p-3 rounded-2xl border transition-all ${
          isDark ? 'bg-zinc-900/40 border-fuchsia-950/60' : 'bg-white border-pink-100 shadow-sm shadow-pink-500/5'
        } flex items-center gap-3`}>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hidden xs:block">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-pink-300/40 font-black truncate">Caja</p>
            <h3 className="text-sm md:text-base font-mono font-black text-emerald-500">${totalIngresos.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Selectores de vista y fechas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 my-4">
        <div className="flex border border-pink-100 dark:border-fuchsia-950 rounded-xl p-1 bg-pink-50/10">
          {(['day', 'week', 'month'] as const).map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode)} className={`px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase font-black ${viewMode === mode ? 'bg-white dark:bg-zinc-900 text-pink-600 shadow-sm' : 'text-stone-400'}`}>
              {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between border border-pink-100 dark:border-fuchsia-950 rounded-xl px-2 py-1">
          <button onClick={() => cambiarDia(-1)}><ChevronLeft className="w-4 h-4 text-pink-500" /></button>
          <span className="text-xs font-serif font-extrabold text-stone-900 dark:text-pink-100 px-4 capitalize">{formatFechaTitulo()}</span>
          <button onClick={() => cambiarDia(1)}><ChevronRight className="w-4 h-4 text-pink-500" /></button>
        </div>
      </div>

      {/* Vistas principales */}
      <div className="w-full">
        {viewMode === 'day' && renderVistaDia()}
        {viewMode === 'week' && renderVistaSemana()}
        {viewMode === 'month' && renderVistaMes()}
      </div>

      {/* Modales Clásicos */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl p-5 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-mono uppercase font-black">Nuevo Turno</h3>
              <button onClick={() => setShowNewAppointment(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAgendarCita() }} className="space-y-3">
              <select value={newCita.clientId} onChange={(e) => setNewCita({...newCita, clientId: e.target.value})} className="w-full p-2.5 text-xs rounded-xl border bg-transparent" required>
                <option value="">Selecciona Clienta</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={newCita.serviceId} onChange={(e) => setNewCita({...newCita, serviceId: e.target.value})} className="w-full p-2.5 text-xs rounded-xl border bg-transparent" required>
                <option value="">Selecciona Servicio</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} (${s.price})</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={newCita.date} onChange={(e) => setNewCita({...newCita, date: e.target.value})} className="p-2 text-xs rounded-xl border bg-transparent" required />
                <TimePicker value={newCita.time} onChange={(time) => setNewCita({...newCita, time})} />
              </div>
              {formError && <p className="text-xs text-red-500">{formError}</p>}
              <button type="submit" className="w-full py-2 bg-pink-500 text-white rounded-xl text-xs font-mono uppercase font-bold">Agendar</button>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedCita && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl p-5 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-mono uppercase font-black">Detalle</h3>
              <button onClick={() => setShowDetailModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 text-xs">
              <p><strong>Clienta:</strong> {selectedCita.clients?.name}</p>
              <p><strong>Servicio:</strong> {selectedCita.services?.name}</p>
              <p><strong>Horario:</strong> {selectedCita.time?.substring(0,5)} hs</p>
            </div>
            <div className="grid grid-cols-3 gap-1 mt-4">
              {['pending', 'confirmed', 'completed'].map((st: any) => (
                <button key={st} onClick={() => cambiarEstadoCita(selectedCita.id, st)} className={`p-2 text-[10px] font-mono uppercase border rounded-xl ${selectedCita.status === st ? 'bg-pink-500 text-white' : ''}`}>
                  {st}
                </button>
              ))}
            </div>
            <button onClick={() => { if(confirm('¿Eliminar?')) eliminarCita(selectedCita.id) }} className="w-full mt-4 py-2 border border-rose-500 text-rose-500 rounded-xl text-xs font-mono uppercase font-black">
              Eliminar Turno
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

