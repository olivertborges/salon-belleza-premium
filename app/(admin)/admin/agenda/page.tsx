'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar as CalendarIcon, Clock, User, Sparkles, 
  ChevronLeft, ChevronRight, CheckCircle2, 
  Play, Filter, DollarSign, Layers, Plus, Trash2, 
  X, Edit, FileText, Users, ChevronDown, 
  Award, Ban, RefreshCw, Scissors, Loader2, Building2
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, startOfMonth, endOfMonth, getDaysInMonth, isSameDay } from 'date-fns'
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

  const [newCita, setNewCita] = useState({
    clientId: '',
    serviceId: '',
    staffId: '',
    date: '',
    time: '',
    notes: '',
  })

  const mostrarToastLlamativo = (nuevaCita: any) => {
    if (!nuevaCita || !nuevaCita.date || !nuevaCita.time) return

    const ID_TOAST = 'toast-nueva-cita'
    let toastExistente = document.getElementById(ID_TOAST)
    if (toastExistente) toastExistente.remove()

    const toast = document.createElement('div')
    toast.id = ID_TOAST
    toast.className = `fixed top-5 right-5 z-[9999] p-4 rounded-xl shadow-2xl max-w-sm transition-all duration-300 border ${
      isDark ? 'bg-zinc-900 border-fuchsia-900 text-pink-100' : 'bg-white border-pink-200 text-stone-800'
    }`

    toast.innerHTML = `
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
          </span>
          <h4 class="text-[10px] font-mono font-bold uppercase tracking-widest text-pink-600 dark:text-pink-400">¡Nueva Cita!</h4>
        </div>
        <p class="text-[11px] text-stone-500 dark:text-pink-200/70 leading-relaxed">Una clienta se acaba de agendar para el <span class="font-mono font-bold text-pink-600 dark:text-pink-400">${nuevaCita.date}</span> a las <span class="font-mono font-bold text-pink-600 dark:text-pink-400">${nuevaCita.time.slice(0,5)}</span>.</p>
        <div class="flex justify-end gap-3 mt-1 border-t border-pink-100 dark:border-fuchsia-950 pt-2">
          <button id="btn-cerrar-toast" class="text-[9px] font-mono uppercase tracking-wider text-stone-400 hover:text-pink-500 transition-colors">Cerrar</button>
          <button id="btn-ir-toast" class="text-[9px] font-mono uppercase tracking-wider border border-pink-200 dark:border-fuchsia-800 px-2 py-0.5 rounded hover:bg-pink-50 dark:hover:bg-fuchsia-950 transition-all font-bold text-pink-600 dark:text-pink-300">Revisar</button>
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
      pending: { label: 'Pendiente', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock },
      confirmed: { label: 'Confirmada', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
      in_progress: { label: 'En proceso', color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', icon: Play },
      completed: { label: 'Completada', color: 'text-stone-500 dark:text-fuchsia-400/70', bg: 'bg-stone-500/10 border-stone-500/20 dark:bg-fuchsia-500/10 dark:border-fuchsia-500/20', icon: Award },
      cancelled: { label: 'Cancelada', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: X },
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
      console.error('Error deleting appointment:', err)
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
      console.error('Error updating appointment:', err)
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

  const renderVistaDia = () => {
    const citasDelDia = citas.filter(c => c.date === format(fechaSeleccionada, 'yyyy-MM-dd'))
    const citasOrdenadas = [...citasDelDia].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

    if (citasOrdenadas.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 space-y-5">
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-pink-200 dark:border-fuchsia-950 flex items-center justify-center bg-pink-50/30 dark:bg-fuchsia-950/10">
            <CalendarIcon className="w-8 h-8 text-pink-300 dark:text-fuchsia-800" />
          </div>
          <div className="text-center">
            <p className="text-base font-serif italic text-stone-400 dark:text-pink-200/50">Día libre en el Studio</p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">No hay citas agendadas para esta fecha</p>
          </div>
          <button 
            onClick={() => setShowNewAppointment(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white rounded-xl text-xs font-mono uppercase tracking-widest hover:opacity-95 transition-all shadow-md shadow-pink-500/20 font-bold"
          >
            <Plus className="w-4 h-4" />
            Agendar turno VIP
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
      { key: 'mañana', label: 'Turnos Mañana', emoji: '✨', citas: grupos.mañana },
      { key: 'tarde', label: 'Turnos Tarde', emoji: '💖', citas: grupos.tarde },
      { key: 'noche', label: 'Turnos Noche', emoji: '🌙', citas: grupos.noche }
    ]

    return (
      <div className="space-y-6 pb-6">
        <div className={`flex items-center justify-between p-5 rounded-2xl border ${
          isDark ? 'bg-zinc-900/60 border-fuchsia-950/60' : 'bg-white border-pink-100 shadow-sm'
        }`}>
          <div>
            <p className="text-[10px] font-mono text-pink-500 dark:text-pink-400 uppercase tracking-[0.2em] font-bold">
              {format(fechaSeleccionada, 'EEEE', { locale: es })}
            </p>
            <h2 className="text-3xl font-serif italic text-stone-900 dark:text-pink-50 mt-1 capitalize">
              {format(fechaSeleccionada, 'd', { locale: es })}
              <span className="text-base font-serif font-normal text-stone-400 dark:text-pink-200/40 ml-2">
                {format(fechaSeleccionada, 'MMMM', { locale: es })}
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-xl border font-bold ${
              isDark ? 'bg-fuchsia-950/40 border-fuchsia-900/40 text-pink-300' : 'bg-pink-50/60 border-pink-100 text-pink-700'
            }`}>
              {citasOrdenadas.length} {citasOrdenadas.length === 1 ? 'Turno' : 'Turnos'}
            </span>
            {isToday(fechaSeleccionada) && (
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-pink-600 dark:text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20 shadow-sm shadow-pink-500/5">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 animate-pulse" />
                Hoy
              </span>
            )}
          </div>
        </div>

        {franjas.map(({ key, label, emoji, citas: citasFranja }) => {
          if (citasFranja.length === 0) return null

          return (
            <div key={key} className="space-y-3">
              <div className="flex items-center gap-2.5 pl-1">
                <span className="text-base text-pink-500">{emoji}</span>
                <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] font-black text-stone-400 dark:text-pink-200/40">
                  {label}
                </h3>
                <span className="text-[10px] font-mono text-pink-400/60 dark:text-pink-300/30">({citasFranja.length})</span>
              </div>

              <div className="space-y-2.5">
                {citasFranja.map((cita) => {
                  const statusInfo = getStatusBadge(cita.status)
                  const horaMostrar = cita.time ? cita.time.substring(0, 5) : '--:--'
                  const isCompleted = cita.status === 'completed'
                  const isProcessing = cita.status === 'in_progress'

                  let cardBg = isDark ? 'bg-zinc-900/40 border-fuchsia-950/40' : 'bg-white border-pink-50 shadow-sm'
                  if (isCompleted) {
                    cardBg = isDark ? 'bg-zinc-950/40 border-fuchsia-950/20 opacity-50' : 'bg-stone-50/50 border-stone-200/40 opacity-60'
                  }
                  if (isProcessing) {
                    cardBg = isDark ? 'bg-fuchsia-950/20 border-pink-500/30 shadow-md shadow-pink-500/5' : 'bg-pink-50/30 border-pink-300 shadow-md shadow-pink-500/5'
                  }

                  return (
                    <div 
                      key={cita.id} 
                      onClick={() => abrirDetalleCita(cita)}
                      className={`relative overflow-hidden rounded-2xl border p-4.5 transition-all cursor-pointer hover:scale-[1.01] hover:shadow-xl hover:border-pink-300/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${cardBg}`}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
                        cita.status === 'pending' ? 'bg-amber-400' :
                        cita.status === 'confirmed' ? 'bg-emerald-400' :
                        cita.status === 'in_progress' ? 'bg-gradient-to-b from-pink-500 to-rose-500 animate-pulse' :
                        cita.status === 'completed' ? 'bg-stone-400 dark:bg-fuchsia-900' :
                        'bg-rose-500'
                      }`} />

                      <div className="flex items-center gap-4 min-w-0 pl-2">
                        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border transition-colors ${
                          isDark ? 'border-fuchsia-950 bg-zinc-950 text-pink-300' : 'border-pink-100 bg-pink-50/40 text-pink-700'
                        }`}>
                          <Clock className="w-3.5 h-3.5 opacity-60" />
                          <span className="text-xs font-mono font-black mt-1">
                            {horaMostrar}
                          </span>
                        </div>

                        <div className="space-y-1 min-w-0">
                          <h4 className="text-base font-black text-stone-900 dark:text-pink-50 tracking-wide truncate">
                            {cita.clients?.name || 'Cliente'}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-pink-200/60">
                            <span className="font-bold text-pink-600 dark:text-pink-400 flex items-center gap-1">
                              <Scissors className="w-3 h-3 text-pink-400 shrink-0" />
                              {cita.services?.name || 'Servicio'}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-fuchsia-900 shrink-0" />
                            <span className="font-mono text-[10px] uppercase tracking-wider flex items-center gap-1 dark:text-pink-300/60">
                              <Building2 className="w-3 h-3 text-stone-400 shrink-0" />
                              {cita.staff?.name || 'Sin asignar'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-0 border-dashed border-pink-100 dark:border-fuchsia-950 pt-2 sm:pt-0">
                        <span className="text-base font-mono font-black text-stone-900 dark:text-pink-100 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent dark:from-pink-300 dark:to-amber-300">
                          ${Number(cita.services?.price || 0).toLocaleString()}
                        </span>
                        <span className={`text-[8px] font-mono uppercase tracking-widest font-black px-3 py-1 rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
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

  const renderVistaSemana = () => {
    const weekStart = startOfWeek(fechaSeleccionada, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(fechaSeleccionada, { weekStartsOn: 1 }) })

    const horaInicioNum = 9
    const horaFinNum = 20
    const totalHoras = horaFinNum - horaInicioNum + 1
    const horasCuadricula = Array.from({ length: totalHoras }, (_, i) => i + horaInicioNum)
    const HORA_ALTURA = 76

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
        <div className={`overflow-x-auto select-none rounded-2xl border ${
          isDark ? 'border-fuchsia-950 bg-zinc-900/20' : 'border-pink-100 bg-white shadow-sm'
        }`}>
          <div className="min-w-[950px] flex flex-col">

            <div className={`flex border-b ${
              isDark ? 'border-fuchsia-950 bg-zinc-950/80' : 'border-pink-100 bg-pink-50/20'
            }`}>
              <div className={`w-16 flex-shrink-0 border-r ${
                isDark ? 'border-fuchsia-950' : 'border-pink-100'
              }`} />
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
                      } ${
                        isTodayDate ? isDark ? 'bg-fuchsia-950/20' : 'bg-pink-50/40' : ''
                      }`}
                    >
                      <span className={`text-[9px] font-mono uppercase tracking-[0.2em] font-black ${
                        isTodayDate ? 'text-pink-500' : 'text-stone-400 dark:text-pink-300/30'
                      }`}>
                        {format(day, 'EEE', { locale: es })}
                      </span>
                      <div className={`mt-1.5 text-base font-mono font-black ${
                        isTodayDate 
                          ? `w-8 h-8 flex items-center justify-center rounded-xl mx-auto ${
                            isDark ? 'bg-gradient-to-tr from-pink-500 to-rose-500 text-white' : 'bg-stone-900 text-white'
                          } shadow-sm shadow-pink-500/10` 
                          : `text-stone-700 dark:text-pink-100 ${tieneCitas ? 'font-black' : 'font-normal'}`
                      }`}>
                        {format(day, 'd')}
                      </div>
                      {tieneCitas && (
                        <div className="mt-1.5 flex justify-center gap-1">
                          {citasDelDia.slice(0, 3).map((_, i) => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-gradient-to-tr from-pink-400 to-rose-400 dark:from-pink-500 dark:to-fuchsia-600" />
                          ))}
                          {citasDelDia.length > 3 && (
                            <span className="text-[8px] font-mono font-bold text-pink-500/70">+{citasDelDia.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex relative">
              <div 
                className={`w-16 flex-shrink-0 border-r ${
                  isDark ? 'border-fuchsia-950 bg-zinc-950/90' : 'border-pink-100 bg-pink-50/10'
                } z-[15] sticky left-0`}
                style={{ height: `${totalHoras * HORA_ALTURA}px` }}
              >
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

              <div className="flex-1 overflow-x-auto relative">
                <div className="relative" style={{ height: `${totalHoras * HORA_ALTURA}px`, minWidth: '700px' }}>

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
                              isDark ? 'border-fuchsia-950/30 hover:bg-fuchsia-950/10' : 'border-pink-50/60 hover:bg-pink-50/20'
                            } transition-colors`}
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
                        const isDragging = activeId === cita.id

                        let cardBgColor = `bg-white dark:bg-zinc-900 border-pink-100 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 shadow-sm`
                        if (isProcessing) cardBgColor = `bg-gradient-to-tr from-pink-500/10 to-rose-500/5 border-pink-400/40 text-stone-800 dark:text-pink-50 ring-1 ring-pink-400/20`
                        if (isCompleted) cardBgColor = `bg-stone-50 dark:bg-zinc-950 border-stone-200/60 dark:border-fuchsia-950/20 text-stone-400 dark:text-pink-300/30 opacity-60`

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
                              className={`w-full h-full border rounded-xl p-2.5 flex flex-col justify-between overflow-hidden transition-all ${cardBgColor} ${
                                isDragging ? 'opacity-30 ring-2 ring-pink-400' : 'hover:shadow-md hover:border-pink-300/30'
                              }`}
                            >
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  abrirDetalleCita(cita)
                                }} 
                                className="w-full h-full cursor-pointer flex flex-col justify-between"
                              >
                                <div className="min-w-0 space-y-0.5">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[9px] font-mono font-black text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-fuchsia-950/50 px-1.5 py-0.5 rounded-md">
                                      {horaFormateada}
                                    </span>
                                    <span className={`text-[6px] px-1.5 py-0.5 rounded-full border uppercase font-mono font-black tracking-widest ${statusInfo.color} ${statusInfo.bg}`}>
                                      {statusInfo.label === 'En proceso' ? 'Proceso' : 
                                       statusInfo.label === 'Confirmada' ? '✓' :
                                       statusInfo.label === 'Pendiente' ? '⏳' :
                                       statusInfo.label === 'Completada' ? '✅' : '✕'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] font-black truncate text-stone-900 dark:text-pink-50 pt-1 tracking-wide">
                                    {cita.clients?.name || 'Cliente'}
                                  </p>
                                  <p className="text-[9px] text-pink-600 dark:text-pink-400 font-bold truncate">
                                    {cita.services?.name || 'Servicio'}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between text-[8px] border-t border-pink-100/40 dark:border-fuchsia-950/50 pt-1.5 mt-1 font-mono">
                                  <span className="text-stone-400 dark:text-pink-200/40 truncate max-w-[55%]">
                                    💅 {cita.staff?.name || 'Sin'}
                                  </span>
                                  <span className="font-black text-pink-600 dark:text-pink-300">
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
      <div className={`flex flex-col h-full select-none rounded-2xl overflow-hidden border ${
        isDark ? 'border-fuchsia-950' : 'border-pink-100'
      }`}>
        <div className={`grid grid-cols-7 text-center font-mono font-black text-[10px] py-3 ${
          isDark ? 'bg-zinc-950/80 text-pink-300/60 border-b border-fuchsia-950' : 'bg-pink-50/40 text-pink-700/80 border-b border-pink-100'
        }`}>
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, idx) => (
            <span key={idx} className="uppercase tracking-widest">{d}</span>
          ))}
        </div>

        <div className={`grid grid-cols-7 gap-px ${
          isDark ? 'bg-fuchsia-950/30' : 'bg-pink-100/60'
        }`}>
          {days.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className={`${isDark ? 'bg-zinc-950/40' : 'bg-pink-50/10'} min-h-[90px]`} />
            }

            const citasDelDia = getCitasDelDia(day).sort((a, b) => (a.time || '').localeCompare(b.time || ''))
            const isTodayDate = isToday(day)
            const tieneCitas = citasDelDia.length > 0

            return (
              <div 
                key={idx} 
                onClick={() => { setFechaSeleccionada(day); setViewMode('day') }}
                className={`${isDark ? 'bg-zinc-950' : 'bg-white'} p-2 min-h-[90px] flex flex-col justify-between cursor-pointer transition-all hover:bg-pink-50/20 dark:hover:bg-fuchsia-950/10 relative ${
                  isTodayDate ? 'ring-1 ring-inset ring-pink-400 bg-pink-50/10 dark:bg-fuchsia-950/20' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-mono font-black flex items-center justify-center rounded-lg w-6 h-6 transition-all ${
                    isTodayDate 
                      ? 'bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-sm' 
                      : tieneCitas 
                        ? 'text-stone-900 dark:text-pink-50 font-black' 
                        : 'text-stone-400 dark:text-pink-300/20'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {tieneCitas && (
                    <span className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded-md ${
                      isDark ? 'bg-fuchsia-950 text-pink-300' : 'bg-pink-50 text-pink-700'
                    }`}>
                      {citasDelDia.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-1 mt-1.5 overflow-y-hidden max-h-[60px]">
                  {citasDelDia.slice(0, 2).map((cita) => {
                    const hora24 = format24h(cita.time)

                    let badgeStyle = `text-[8px] px-1.5 py-0.5 rounded-md truncate font-mono flex items-center gap-1 ${
                      isDark ? 'bg-zinc-900 text-pink-300/80 border border-fuchsia-950/40' : 'bg-pink-50/40 text-pink-800 border border-pink-100/30'
                    }`
                    if (cita.status === 'in_progress') {
                      badgeStyle = `text-[8px] px-1.5 py-0.5 rounded-md truncate font-mono flex items-center gap-1 font-bold ${
                        isDark ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : 'bg-pink-50 text-pink-600 border border-pink-200'
                      }`
                    }
                    if (cita.status === 'completed') {
                      badgeStyle = `text-[8px] px-1.5 py-0.5 rounded-md truncate font-mono flex items-center gap-1 opacity-50 line-through ${
                        isDark ? 'bg-zinc-950 text-stone-500 border border-transparent' : 'bg-stone-50 text-stone-400'
                      }`
                    }

                    return (
                      <div 
                        key={cita.id} 
                        onClick={(e) => { e.stopPropagation(); abrirDetalleCita(cita) }}
                        className={`cursor-pointer transition-colors ${badgeStyle}`}
                        title={`${hora24} - ${cita.clients?.name}`}
                      >
                        <span className="font-black shrink-0">{hora24}</span>
                        <span className="truncate flex-1 tracking-wide">{cita.clients?.name || 'Cliente'}</span>
                      </div>
                    )
                  })}

                  {citasDelDia.length > 2 && (
                    <div className={`text-[7px] text-center font-mono font-black py-0.5 rounded-md ${
                      isDark ? 'bg-fuchsia-950/20 text-pink-400/50' : 'bg-pink-50/30 text-pink-600/70'
                    }`}>
                      +{citasDelDia.length - 2} más turnos
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
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
        <p className="text-[10px] text-pink-500 font-mono tracking-widest uppercase font-bold animate-pulse">Sincronizando Agenda Fresh Nails VIP...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 p-4">
        <div className="text-center space-y-4 max-w-sm border border-pink-100 dark:border-fuchsia-950 p-6 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl shadow-pink-500/5">
          <X className="w-6 h-6 text-rose-500 mx-auto" />
          <p className="text-xs font-mono uppercase tracking-widest text-rose-500 font-bold">Fallo de sincronización</p>
          <p className="text-xs text-stone-500 dark:text-pink-200/60 leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-pink-200 dark:border-fuchsia-800 rounded-xl text-[10px] font-mono uppercase tracking-wider font-bold hover:bg-pink-50 dark:hover:bg-fuchsia-950 transition-all text-pink-600 dark:text-pink-400"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reintentar Conexión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen pb-20 pt-4 antialiased space-y-6 max-w-6xl mx-auto px-4 ${
      isDark ? 'text-pink-100' : 'text-stone-800'
    }`}>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-pink-100 dark:border-fuchsia-950">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 dark:bg-pink-400 animate-pulse" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-pink-500 dark:text-pink-400 font-mono font-black">✨ Control Studio</p>
          </div>
          <h1 className="text-4xl font-serif font-black tracking-tight text-stone-900 dark:text-pink-50 mt-2">
            Agenda <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 bg-clip-text text-transparent italic font-normal">Fresh Nails</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-pink-200/50 mt-1">Gestión avanzada de turnos en tiempo real, flujos de trabajo e ingresos del equipo.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-end">
          <button 
            onClick={() => setShowNewAppointment(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[11px] font-mono uppercase tracking-widest font-bold transition-all hover:opacity-95 shadow-md shadow-pink-500/10"
          >
            <Plus className="w-4 h-4" /> Nuevo Turno
          </button>
          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            className={`p-2.5 border rounded-xl transition-all ${
              showCalendar 
                ? 'bg-pink-500 border-pink-500 text-white shadow-inner' 
                : 'border-pink-100 dark:border-fuchsia-950 hover:bg-pink-50/50 dark:hover:bg-fuchsia-950/30 text-pink-500'
            }`}
            title="Calendario rápido"
          >
            <CalendarIcon className="w-4 h-4 stroke-[2]" />
          </button>
          <button 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`p-2.5 border rounded-xl transition-all ${
              showMobileFilters 
                ? 'bg-pink-500 border-pink-500 text-white shadow-inner' 
                : 'border-pink-100 dark:border-fuchsia-950 hover:bg-pink-50/50 dark:hover:bg-fuchsia-950/30 text-pink-500'
            }`}
            title="Filtros Especialistas"
          >
            <Filter className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex border border-pink-100 dark:border-fuchsia-950 bg-pink-50/20 dark:bg-fuchsia-950/10 rounded-xl p-1 self-start">
          {(['day', 'week', 'month'] as const).map((mode) => (
            <button 
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-5 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-black transition-all ${
                viewMode === mode 
                  ? 'bg-white dark:bg-zinc-900 border border-pink-100 dark:border-fuchsia-900/40 text-pink-600 dark:text-pink-400 shadow-sm' 
                  : 'text-stone-400 hover:text-pink-500 dark:hover:text-pink-300/60'
              }`}
            >
              {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 border border-pink-100 dark:border-fuchsia-950 bg-pink-50/10 dark:bg-fuchsia-950/10 rounded-xl px-3 py-1.5 justify-between md:justify-start min-w-[300px]">
          <button 
            onClick={() => cambiarDia(-1)} 
            className="p-1.5 rounded-lg hover:bg-pink-50 dark:hover:bg-fuchsia-950/40 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-pink-500 font-bold" />
          </button>
          <span className="text-xs font-serif font-extrabold text-stone-900 dark:text-pink-100 text-center flex-1 capitalize tracking-wide">
            {formatFechaTitulo()}
          </span>
          <button 
            onClick={() => cambiarDia(1)} 
            className="p-1.5 rounded-lg hover:bg-pink-50 dark:hover:bg-fuchsia-950/40 transition-all"
          >
            <ChevronRight className="w-4 h-4 text-pink-500 font-bold" />
          </button>
        </div>
      </div>

      {showMobileFilters && (
        <div className={`p-4 border rounded-2xl shadow-inner ${
          isDark ? 'bg-zinc-950/40 border-fuchsia-950' : 'bg-pink-50/20 border-pink-100'
        }`}>
          <label className="text-[10px] font-mono uppercase tracking-widest font-black text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Filtrar Especialista en Turnos
          </label>
          <select 
            value={filtroStaff} 
            onChange={(e) => setFiltroStaff(e.target.value)}
            className={`w-full sm:w-72 mt-2 border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-pink-400 transition-all ${
              isDark ? 'bg-zinc-900 border-fuchsia-950 text-pink-100' : 'bg-white border-pink-100 text-stone-700'
            }`}
          >
            <option value="todos">🌸 Todo el Equipo Studio</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>✨ {s.name}</option>
            ))}
          </select>
        </div>
      )}

      {showCalendar && (
        <div className={`border rounded-2xl p-4.5 shadow-xl shadow-pink-500/5 ${
          isDark ? 'bg-zinc-900/90 border-fuchsia-950' : 'bg-white border-pink-100'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1 rounded-lg hover:bg-pink-50">
              <ChevronLeft className="w-4 h-4 text-pink-500" />
            </button>
            <span className="text-xs font-mono uppercase tracking-widest text-pink-600 dark:text-pink-400 font-black">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </span>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1 rounded-lg hover:bg-pink-50">
              <ChevronRight className="w-4 h-4 text-pink-500" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
              <span key={d} className="text-[10px] font-mono text-stone-400 dark:text-pink-300/30 font-black">{d}</span>
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
                    className={`p-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-md' 
                        : tieneCita 
                          ? 'text-pink-600 dark:text-pink-300 bg-pink-500/10 border border-pink-500/20' 
                          : 'text-stone-500 hover:bg-pink-50/50 dark:text-pink-100/60 dark:hover:bg-fuchsia-950/30'
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

      {citasPendientes > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <p className="text-[11px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-black">
              Tenes {citasPendientes} {citasPendientes === 1 ? 'turno por confirmar' : 'turnos pendientes por confirmar'}
            </p>
          </div>
          <button 
            onClick={() => {
              const primeraPendiente = citas.find(c => c.status === 'pending')
              if (primeraPendiente && primeraPendiente.date) {
                const fechaCita = new Date(primeraPendiente.date.replace(/-/g, '/'))
                setFechaSeleccionada(fechaCita)
              }
              setViewMode('day')
              setFiltroStaff('todos')
            }}
            className="text-[9px] font-mono uppercase border border-amber-400/40 px-3 py-1.5 rounded-xl text-amber-700 dark:text-amber-400 font-black hover:bg-amber-500/10 transition-all bg-white dark:bg-zinc-900"
          >
            Enfocar Solicitudes
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`border rounded-2xl p-4 text-center relative overflow-hidden ${
          isDark ? 'bg-zinc-900/40 border-fuchsia-950/60' : 'bg-white border-pink-100 shadow-sm'
        }`}>
          <p className="text-[9px] text-stone-400 dark:text-pink-300/40 font-mono uppercase tracking-widest font-black">Total Turnos</p>
          <p className="text-2xl font-mono font-black text-stone-900 dark:text-pink-100 mt-1">{citas.length}</p>
          <Layers className="w-4 h-4 mx-auto mt-1.5 text-pink-400/60 stroke-[1.5]" />
        </div>
        <div className={`border rounded-2xl p-4 text-center relative overflow-hidden ${
          isDark ? 'bg-zinc-900/40 border-fuchsia-950/60' : 'bg-white border-pink-100 shadow-sm'
        }`}>
          <p className="text-[9px] text-stone-400 dark:text-pink-300/40 font-mono uppercase tracking-widest font-black">En Proceso</p>
          <p className="text-2xl font-mono font-black text-pink-600 dark:text-pink-400 mt-1">
            {citas.filter(c => c.status === 'in_progress').length}
          </p>
          <Play className="w-4 h-4 mx-auto mt-1.5 text-pink-500/40 stroke-[1.5] animate-pulse" />
        </div>
        <div className={`border rounded-2xl p-4 text-center relative overflow-hidden ${
          isDark ? 'bg-zinc-900/40 border-fuchsia-950/60' : 'bg-white border-pink-100 shadow-sm'
        }`}>
          <p className="text-[9px] text-stone-400 dark:text-pink-300/40 font-mono uppercase tracking-widest font-black">Completados</p>
          <p className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {citas.filter(c => c.status === 'completed').length}
          </p>
          <CheckCircle2 className="w-4 h-4 mx-auto mt-1.5 text-emerald-500/40 stroke-[1.5]" />
        </div>
        <div className={`border rounded-2xl p-4 text-center bg-gradient-to-tr from-pink-50/50 to-amber-50/30 dark:from-fuchsia-950/10 dark:to-transparent border-pink-100 dark:border-fuchsia-950 shadow-sm`}>
          <p className="text-[9px] text-pink-600 dark:text-pink-400 font-mono uppercase tracking-widest font-black">Caja Estimada</p>
          <p className="text-2xl font-mono font-black text-stone-900 dark:text-pink-100 mt-1 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent dark:from-pink-300 dark:to-amber-300">
            ${totalIngresos.toLocaleString()}
          </p>
          <DollarSign className="w-4 h-4 mx-auto mt-1.5 text-pink-500 stroke-[1.5]" />
        </div>
      </div>

      <div className="w-full">
        {viewMode === 'day' && renderVistaDia()}
        {viewMode === 'week' && renderVistaSemana()}
        {viewMode === 'month' && renderVistaMes()}
      </div>

      {showNewAppointment && (
        <div className="fixed inset-0 bg-zinc-950/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all transform scale-100 ${
            isDark ? 'bg-zinc-900 border border-fuchsia-950' : 'bg-white border border-pink-100'
          }`}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${
              isDark ? 'border-fuchsia-950 bg-zinc-950/40' : 'border-pink-100 bg-pink-50/10'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-fuchsia-950/50' : 'bg-pink-50'
                }`}>
                  <Plus className="w-4 h-4 text-pink-500" />
                </div>
                <h3 className="text-xs font-mono uppercase tracking-widest font-black text-stone-900 dark:text-pink-100">Agendar Turno Studio</h3>
              </div>
              <button 
                onClick={() => setShowNewAppointment(false)} 
                className="p-1.5 rounded-xl hover:bg-pink-50 dark:hover:bg-fuchsia-950/60 text-stone-400 hover:text-pink-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 max-h-[72vh] space-y-4">
              <form onSubmit={(e) => { e.preventDefault(); handleAgendarCita() }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-pink-300/40 font-black flex items-center gap-1">
                    <User className="w-3 h-3 text-pink-400" /> Cliente <span className="text-pink-500">*</span>
                  </label>
                  <select 
                    value={newCita.clientId}
                    onChange={(e) => setNewCita({...newCita, clientId: e.target.value})}
                    className={`w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-pink-400 transition-all ${
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

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-pink-300/40 font-black flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-pink-400" /> Servicio Solicitado <span className="text-pink-500">*</span>
                  </label>
                  <select 
                    value={newCita.serviceId}
                    onChange={(e) => setNewCita({...newCita, serviceId: e.target.value})}
                    className={`w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-pink-400 transition-all ${
                      isDark ? 'bg-zinc-950 border border-fuchsia-950 text-pink-100' : 'bg-pink-50/30 border border-pink-100 text-stone-800'
                    }`}
                    required
                  >
                    <option value="">Selecciona un servicio de manicuría/pedicuría</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (${s.price})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-pink-300/40 font-black flex items-center gap-1">
                    <Users className="w-3 h-3 text-pink-400" /> Especialista Asignado
                  </label>
                  <select 
                    value={newCita.staffId}
                    onChange={(e) => setNewCita({...newCita, staffId: e.target.value})}
                    className={`w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-pink-400 transition-all ${
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
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-pink-300/40 font-black flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3 text-pink-400" /> Fecha <span className="text-pink-500">*</span>
                    </label>
                    <input 
                      type="date"
                      value={newCita.date}
                      onChange={(e) => setNewCita({...newCita, date: e.target.value})}
                      className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-pink-400 transition-all ${
                        isDark ? 'bg-zinc-950 border border-fuchsia-950 text-pink-100' : 'bg-pink-50/30 border border-pink-100 text-stone-800'
                      }`}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-pink-300/40 font-black flex items-center gap-1">
                      <Clock className="w-3 h-3 text-pink-400" /> Hora <span className="text-pink-500">*</span>
                    </label>
                    <TimePicker
                      value={newCita.time}
                      onChange={(time) => setNewCita({...newCita, time})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-pink-300/40 font-black flex items-center gap-1">
                    <FileText className="w-3 h-3 text-pink-400" /> Notas Internas
                  </label>
                  <textarea 
                    value={newCita.notes}
                    onChange={(e) => setNewCita({...newCita, notes: e.target.value})}
                    rows={2}
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-pink-400 transition-all resize-none ${
                      isDark ? 'bg-zinc-950 border border-fuchsia-950 text-pink-100' : 'bg-pink-50/30 border border-pink-100 text-stone-800'
                    }`}
                    placeholder="Diseños específicos, detalles a tener en cuenta..."
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
                    className={`flex-1 px-4 py-2.5 rounded-xl text-[11px] font-mono uppercase tracking-widest transition-colors border ${
                      isDark ? 'border-fuchsia-950 text-pink-300/60 hover:bg-fuchsia-950/40' : 'border-pink-100 text-stone-500 hover:bg-pink-50'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-mono uppercase tracking-widest font-bold transition-opacity hover:opacity-95 shadow-md bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                  >
                    Confirmar Turno
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedCita && (
        <div className="fixed inset-0 bg-zinc-950/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto transform scale-100 transition-all ${
            isDark ? 'bg-zinc-900 border border-fuchsia-950' : 'bg-white border border-pink-100'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-pink-100/40 dark:border-fuchsia-950">
              <h3 className="text-xs font-mono uppercase tracking-widest font-black text-stone-900 dark:text-pink-100 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-pink-500" />
                Ficha del Turno VIP
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-pink-50 dark:hover:bg-fuchsia-950 rounded-xl text-stone-400 hover:text-pink-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-pink-300/40 font-black">Notas Internas Studio</label>
                  <textarea
                    value={selectedCita.notes || ''}
                    onChange={(e) => setSelectedCita({...selectedCita, notes: e.target.value})}
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-pink-400 resize-none ${
                      isDark ? 'bg-zinc-950 border border-fuchsia-950 text-pink-100' : 'bg-pink-50/30 border border-pink-100 text-stone-800'
                    }`}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2.5 pt-3 border-t border-pink-100/40 dark:border-fuchsia-950">
                  <button
                    onClick={() => setIsEditing(false)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-[11px] font-mono uppercase tracking-widest border ${
                      isDark ? 'border-fuchsia-950 text-pink-300/60' : 'border-pink-100 text-stone-500 hover:bg-pink-50'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={actualizarCita}
                    className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-mono uppercase tracking-widest font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 text-xs">
                  <div className={`flex justify-between py-2 border-b ${
                    isDark ? 'border-fuchsia-950/40' : 'border-pink-50'
                  }`}>
                    <span className="text-stone-400 dark:text-pink-300/40 font-mono uppercase tracking-wider text-[10px]">Clienta</span>
                    <span className="font-black text-stone-900 dark:text-pink-50">{selectedCita.clients?.name || 'Cliente'}</span>
                  </div>
                  <div className={`flex justify-between py-2 border-b ${
                    isDark ? 'border-fuchsia-950/40' : 'border-pink-50'
                  }`}>
                    <span className="text-stone-400 dark:text-pink-300/40 font-mono uppercase tracking-wider text-[10px]">Servicio</span>
                    <span className="font-bold text-pink-600 dark:text-pink-400">{selectedCita.services?.name || 'Servicio'}</span>
                  </div>
                  <div className={`flex justify-between py-2 border-b ${
                    isDark ? 'border-fuchsia-950/40' : 'border-pink-50'
                  }`}>
                    <span className="text-stone-400 dark:text-pink-300/40 font-mono uppercase tracking-wider text-[10px]">Especialista</span>
                    <span className="font-bold text-stone-800 dark:text-pink-200">{selectedCita.staff?.name || 'Sin Asignar'}</span>
                  </div>
                  <div className={`flex justify-between py-2 border-b ${
                    isDark ? 'border-fuchsia-950/40' : 'border-pink-50'
                  }`}>
                    <span className="text-stone-400 dark:text-pink-300/40 font-mono uppercase tracking-wider text-[10px]">Horario Cita</span>
                    <span className="font-mono font-bold text-pink-600 dark:text-pink-300">
                      {selectedCita.time?.substring(0,5)} hs • {selectedCita.date}
                    </span>
                  </div>
                  <div className={`flex justify-between py-2 border-b ${
                    isDark ? 'border-fuchsia-950/40' : 'border-pink-50'
                  }`}>
                    <span className="text-stone-400 dark:text-pink-300/40 font-mono uppercase tracking-wider text-[10px]">Estado de Flujo</span>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      getStatusBadge(selectedCita.status).bg
                    } ${getStatusBadge(selectedCita.status).color}`}>
                      {getStatusBadge(selectedCita.status).label}
                    </span>
                  </div>
                  {selectedCita.notes && (
                    <div className={`p-3 rounded-xl text-[11px] leading-relaxed border ${
                      isDark ? 'bg-zinc-950 border-fuchsia-950 text-pink-200/60' : 'bg-pink-50/40 border-pink-100 text-stone-600'
                    }`}>
                      <span className="block font-mono text-[9px] uppercase tracking-wider text-pink-500 font-black mb-0.5">Notas</span>
                      {selectedCita.notes}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-stone-400 dark:text-pink-300/40 font-black block">Cambiar Estado de la Clienta</label>
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
                        {st === 'pending' ? '⏳ Espera' : st === 'confirmed' ? '✓ OK' : '💅 En Sillón'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-3.5 border-t border-pink-100/40 dark:border-fuchsia-950">
                  <button
                    onClick={() => setIsEditing(true)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-[11px] font-mono uppercase tracking-widest font-black flex items-center justify-center gap-1.5 border ${
                      isDark ? 'border-fuchsia-950 text-pink-300 hover:bg-fuchsia-930/30' : 'border-pink-100 text-stone-700 hover:bg-pink-50'
                    }`}
                  >
                    <Edit className="w-3.5 h-3.5 text-pink-500" /> Editar Ficha
                  </button>
                  <button
                    onClick={() => eliminarCita(selectedCita.id)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-mono uppercase tracking-widest font-black flex items-center justify-center gap-1.5 border border-rose-200 text-rose-600 dark:text-rose-400 dark:border-rose-950/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Cancelar Cita
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