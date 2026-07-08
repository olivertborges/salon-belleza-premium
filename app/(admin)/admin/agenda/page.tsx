'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Calendar as CalendarIcon, Clock, User, Sparkles, 
  ChevronLeft, ChevronRight, CheckCircle2, 
  Play, Filter, DollarSign, Layers, Plus, Trash2, 
  X, Edit, Save, FileText, TrendingUp, Users, 
  Calendar, ChevronDown, Bell, Menu, Search,
  Star, Award, Zap, Eye, MessageCircle, Ban,
  RefreshCw, Scissors, Loader2, Building2
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
      isDark ? 'bg-stone-900 border-stone-800 text-stone-200' : 'bg-white border-stone-200 text-stone-800'
    }`

    toast.innerHTML = `
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <h4 class="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">¡Nueva Cita!</h4>
        </div>
        <p class="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">Una clienta se acaba de agendar para el <span class="font-mono font-bold text-stone-900 dark:text-stone-100">${nuevaCita.date}</span> a las <span class="font-mono font-bold text-stone-900 dark:text-stone-100">${nuevaCita.time.slice(0,5)}</span>.</p>
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
      in_progress: { label: 'En proceso', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: Play },
      completed: { label: 'Completada', color: 'text-stone-500 dark:text-stone-400', bg: 'bg-stone-500/10 border-stone-500/20', icon: Award },
      cancelled: { label: 'Cancelada', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: X },
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
  // RENDER VISTA DÍA (REDISEÑADO)
  // ============================================================
  const renderVistaDia = () => {
    const citasDelDia = citas.filter(c => c.date === format(fechaSeleccionada, 'yyyy-MM-dd'))
    const citasOrdenadas = [...citasDelDia].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

    if (citasOrdenadas.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-stone-200 dark:border-stone-800 flex items-center justify-center bg-stone-50/50 dark:bg-stone-900/20">
            <CalendarIcon className="w-6 h-6 text-stone-300 dark:text-stone-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-serif italic text-stone-400 dark:text-stone-500">Día libre</p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">No hay citas agendadas para este día</p>
          </div>
          <button 
            onClick={() => setShowNewAppointment(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-mono uppercase tracking-wider hover:opacity-90 transition-all shadow-sm"
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
      { key: 'mañana', label: 'Mañana', emoji: '🌅', citas: grupos.mañana },
      { key: 'tarde', label: 'Tarde', emoji: '☀️', citas: grupos.tarde },
      { key: 'noche', label: 'Noche', emoji: '🌙', citas: grupos.noche }
    ]

    return (
      <div className="space-y-5 pb-4">
        <div className={`flex items-center justify-between p-4 rounded-2xl border ${
          isDark ? 'bg-stone-900/40 border-stone-800' : 'bg-white border-stone-200 shadow-sm'
        }`}>
          <div>
            <p className="text-[9px] font-mono text-stone-400 uppercase tracking-[0.15em] font-bold">
              {format(fechaSeleccionada, 'EEEE', { locale: es })}
            </p>
            <h2 className="text-2xl font-serif italic text-stone-900 dark:text-stone-100 mt-0.5">
              {format(fechaSeleccionada, 'd', { locale: es })}
              <span className="text-sm font-serif font-normal text-stone-400 ml-1.5">
                {format(fechaSeleccionada, 'MMMM', { locale: es })}
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[9px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-lg border ${
              isDark ? 'bg-stone-900/60 border-stone-800 text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-500'
            }`}>
              {citasOrdenadas.length} {citasOrdenadas.length === 1 ? 'Turno' : 'Turnos'}
            </span>
            {isToday(fechaSeleccionada) && (
              <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Hoy
              </span>
            )}
          </div>
        </div>

        {franjas.map(({ key, label, emoji, citas: citasFranja }) => {
          if (citasFranja.length === 0) return null

          return (
            <div key={key} className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{emoji}</span>
                <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] font-bold text-stone-400 dark:text-stone-500">
                  {label}
                </h3>
                <span className="text-[9px] font-mono text-stone-300 dark:text-stone-600">({citasFranja.length})</span>
              </div>

              <div className="space-y-2">
                {citasFranja.map((cita) => {
                  const statusInfo = getStatusBadge(cita.status)
                  const horaMostrar = cita.time ? cita.time.substring(0, 5) : '--:--'
                  const isCompleted = cita.status === 'completed'
                  const isProcessing = cita.status === 'in_progress'

                  let cardBg = isDark ? 'bg-stone-900/40 border-stone-800' : 'bg-white border-stone-200 shadow-sm'
                  if (isCompleted) {
                    cardBg = isDark ? 'bg-stone-900/20 border-stone-800/50 opacity-60' : 'bg-stone-50/60 border-stone-200/50 opacity-60'
                  }
                  if (isProcessing) {
                    cardBg = isDark ? 'bg-stone-900/60 border-blue-500/30' : 'bg-white border-blue-300 shadow-md'
                  }

                  return (
                    <div 
                      key={cita.id} 
                      onClick={() => abrirDetalleCita(cita)}
                      className={`relative overflow-hidden rounded-xl border p-4 transition-all cursor-pointer hover:scale-[1.01] hover:shadow-lg flex items-center justify-between gap-4 ${cardBg}`}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                        cita.status === 'pending' ? 'bg-amber-400' :
                        cita.status === 'confirmed' ? 'bg-emerald-400' :
                        cita.status === 'in_progress' ? 'bg-blue-400 animate-pulse' :
                        cita.status === 'completed' ? 'bg-stone-400' :
                        'bg-rose-400'
                      }`} />

                      <div className="flex items-center gap-4 min-w-0 pl-3">
                        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                          isDark ? 'border-stone-800 bg-stone-950' : 'border-stone-200 bg-stone-50'
                        }`}>
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span className="text-[11px] font-mono font-bold mt-0.5 text-stone-700 dark:text-stone-300">
                            {horaMostrar}
                          </span>
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate flex items-center gap-2">
                            {cita.clients?.name || 'Cliente'}
                          </h4>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate flex items-center gap-1.5">
                            <Scissors className="w-3 h-3 text-stone-400" />
                            {cita.services?.name || 'Servicio'}
                          </p>
                          <p className="text-[9px] text-stone-400 dark:text-stone-500 font-mono flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {cita.staff?.name || 'Sin asignar'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-sm font-mono font-bold text-stone-900 dark:text-stone-200">
                          ${Number(cita.services?.price || 0).toLocaleString()}
                        </span>
                        <span className={`text-[8px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
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
  // RENDER VISTA SEMANA (REDISEÑADO)
  // ============================================================
  const renderVistaSemana = () => {
    const weekStart = startOfWeek(fechaSeleccionada, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(fechaSeleccionada, { weekStartsOn: 1 }) })

    const horaInicioNum = 9
    const horaFinNum = 20
    const totalHoras = horaFinNum - horaInicioNum + 1
    const horasCuadricula = Array.from({ length: totalHoras }, (_, i) => i + horaInicioNum)
    const HORA_ALTURA = 72

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
          isDark ? 'border-stone-800 bg-stone-900/30' : 'border-stone-200 bg-white shadow-sm'
        }`}>
          <div className="min-w-[950px] flex flex-col">

            <div className={`flex border-b ${
              isDark ? 'border-stone-800 bg-stone-950/60' : 'border-stone-200 bg-stone-50/80'
            }`}>
              <div className={`w-16 flex-shrink-0 border-r ${
                isDark ? 'border-stone-800' : 'border-stone-200'
              }`} />
              <div className="flex-1 grid grid-cols-7">
                {weekDays.map((day) => {
                  const isTodayDate = isToday(day)
                  const citasDelDia = getCitasDelDia(day)
                  const tieneCitas = citasDelDia.length > 0

                  return (
                    <div 
                      key={day.toString()} 
                      className={`text-center py-3 border-r last:border-r-0 transition-all ${
                        isDark ? 'border-stone-800' : 'border-stone-200'
                      } ${
                        isTodayDate ? isDark ? 'bg-stone-800/40' : 'bg-stone-100/60' : ''
                      }`}
                    >
                      <span className={`text-[9px] font-mono uppercase tracking-widest font-bold ${
                        isTodayDate ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400 dark:text-stone-500'
                      }`}>
                        {format(day, 'EEE', { locale: es })}
                      </span>
                      <div className={`mt-1 text-sm font-mono font-bold ${
                        isTodayDate 
                          ? `w-8 h-8 flex items-center justify-center rounded-xl mx-auto ${
                            isDark ? 'bg-stone-100 text-stone-900' : 'bg-stone-900 text-white'
                          } shadow-sm` 
                          : `text-stone-700 dark:text-stone-300 ${tieneCitas ? 'font-bold' : 'font-normal'}`
                      }`}>
                        {format(day, 'd')}
                      </div>
                      {tieneCitas && (
                        <div className="mt-1 flex justify-center gap-0.5">
                          {citasDelDia.slice(0, 3).map((_, i) => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-stone-600" />
                          ))}
                          {citasDelDia.length > 3 && (
                            <span className="text-[7px] font-mono text-stone-400">+{citasDelDia.length - 3}</span>
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
                  isDark ? 'border-stone-800 bg-stone-950/90' : 'border-stone-200 bg-stone-50/90'
                } z-[15] sticky left-0`}
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

                  <div className="absolute inset-0 grid grid-cols-7" style={{ gridTemplateRows: `repeat(${totalHoras}, ${HORA_ALTURA}px)` }}>
                    {weekDays.map((day, colIdx) => {
                      const dayStr = format(day, 'yyyy-MM-dd')
                      return horasCuadricula.map((hora, rowIdx) => {
                        const horaStr = String(hora).padStart(2, '0')
                        return (
                          <DroppableSlot
                            key={`slot-${dayStr}-${horaStr}`}
                            id={`slot-${dayStr}-${horaStr}`}
                            className={`border-r border-b ${
                              isDark ? 'border-stone-900/40 hover:bg-stone-900/30' : 'border-stone-100 hover:bg-stone-50'
                            } transition-colors`}
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

                        let cardBgColor = `bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 shadow-sm`
                        if (isProcessing) cardBgColor = `bg-amber-500/5 dark:bg-amber-500/5 border-amber-500/30 text-stone-800 dark:text-stone-100`
                        if (isCompleted) cardBgColor = `bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-900 text-stone-400 dark:text-stone-500 opacity-60`

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
                                    <span className="text-[9px] font-mono font-bold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                                      {horaFormateada}
                                    </span>
                                    <span className={`text-[6px] px-1.5 py-0.5 rounded-full border uppercase font-mono font-bold tracking-wider ${statusInfo.color} ${statusInfo.bg}`}>
                                      {statusInfo.label === 'En proceso' ? 'Proceso' : 
                                       statusInfo.label === 'Confirmada' ? '✓' :
                                       statusInfo.label === 'Pendiente' ? '⏳' :
                                       statusInfo.label === 'Completada' ? '✅' : '✕'}
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
  // RENDER VISTA MES (REDISEÑADO)
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
      <div className={`flex flex-col h-full select-none rounded-2xl overflow-hidden border ${
        isDark ? 'border-stone-800' : 'border-stone-200'
      }`}>
        <div className={`grid grid-cols-7 text-center font-mono font-bold text-[9px] py-2.5 ${
          isDark ? 'bg-stone-950/60 text-stone-500 border-b border-stone-800' : 'bg-stone-50/80 text-stone-400 border-b border-stone-200'
        }`}>
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, idx) => (
            <span key={idx} className="uppercase tracking-widest">{d}</span>
          ))}
        </div>

        <div className={`grid grid-cols-7 gap-px ${
          isDark ? 'bg-stone-800' : 'bg-stone-200'
        }`}>
          {days.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className={`${isDark ? 'bg-stone-950/60' : 'bg-stone-50'} min-h-[85px]`} />
            }

            const citasDelDia = getCitasDelDia(day).sort((a, b) => (a.time || '').localeCompare(b.time || ''))
            const isTodayDate = isToday(day)
            const tieneCitas = citasDelDia.length > 0

            return (
              <div 
                key={idx} 
                onClick={() => { setFechaSeleccionada(day); setViewMode('day') }}
                className={`${isDark ? 'bg-stone-950' : 'bg-white'} p-2 min-h-[85px] flex flex-col justify-between cursor-pointer transition-all hover:bg-stone-50 dark:hover:bg-stone-900/40 relative ${
                  isTodayDate ? 'ring-1 ring-inset ring-stone-400 dark:ring-stone-700 bg-stone-50/60 dark:bg-stone-900/30' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-mono font-bold flex items-center justify-center rounded-md w-6 h-6 transition-all ${
                    isTodayDate 
                      ? 'bg-stone-950 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm' 
                      : tieneCitas 
                        ? 'text-stone-900 dark:text-stone-100 font-bold' 
                        : 'text-stone-400 dark:text-stone-600'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {tieneCitas && (
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isDark ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {citasDelDia.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-0.5 mt-1 overflow-y-hidden max-h-[55px]">
                  {citasDelDia.slice(0, 2).map((cita) => {
                    const hora24 = format24h(cita.time)

                    let badgeStyle = `text-[7px] px-1 py-0.5 rounded truncate font-mono flex items-center gap-0.5 ${
                      isDark ? 'bg-stone-900/60 text-stone-400' : 'bg-stone-50 text-stone-600'
                    }`
                    if (cita.status === 'in_progress') {
                      badgeStyle = `text-[7px] px-1 py-0.5 rounded truncate font-mono flex items-center gap-0.5 ${
                        isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                      }`
                    }
                    if (cita.status === 'completed') {
                      badgeStyle = `text-[7px] px-1 py-0.5 rounded truncate font-mono flex items-center gap-0.5 opacity-50 line-through ${
                        isDark ? 'bg-stone-900/40 text-stone-500' : 'bg-stone-50 text-stone-400'
                      }`
                    }

                    return (
                      <div 
                        key={cita.id} 
                        onClick={(e) => { e.stopPropagation(); abrirDetalleCita(cita) }}
                        className={`cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${badgeStyle}`}
                        title={`${hora24} - ${cita.clients?.name}`}
                      >
                        <span className="font-mono font-bold shrink-0">{hora24}</span>
                        <span className="truncate flex-1">{cita.clients?.name || 'Cliente'}</span>
                      </div>
                    )
                  })}

                  {citasDelDia.length > 2 && (
                    <div className={`text-[6px] text-center font-mono font-bold py-0.5 rounded ${
                      isDark ? 'bg-stone-900/40 text-stone-500' : 'bg-stone-50 text-stone-400'
                    }`}>
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
    <div className={`min-h-screen pb-20 pt-4 antialiased space-y-6 max-w-6xl mx-auto px-4 ${
      isDark ? 'text-stone-300' : 'text-stone-800'
    }`}>

      {/* HEADER */}
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
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 text-[11px] font-mono uppercase tracking-wider transition-all hover:opacity-90 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Nueva Cita
          </button>
          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            className="p-2.5 border border-stone-200 dark:border-stone-800 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900 transition-all text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            title="Calendario rápido"
          >
            <CalendarIcon className="w-4 h-4 stroke-[1.5]" />
          </button>
          <button 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="p-2.5 border border-stone-200 dark:border-stone-800 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900 transition-all text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            title="Filtros por Staff"
          >
            <Filter className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* CONTROLES DE VISTA Y FECHA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/20 rounded-xl p-1 self-start">
          <button 
            onClick={() => setViewMode('day')}
            className={`px-5 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all ${
              viewMode === 'day' 
                ? 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-sm' 
                : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
            }`}
          >
            Día
          </button>
          <button 
            onClick={() => setViewMode('week')}
            className={`px-5 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all ${
              viewMode === 'week' 
                ? 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-sm' 
                : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
            }`}
          >
            Semana
          </button>
          <button 
            onClick={() => setViewMode('month')}
            className={`px-5 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all ${
              viewMode === 'month' 
                ? 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-sm' 
                : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
            }`}
          >
            Mes
          </button>
        </div>

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

      {/* FILTROS */}
      {showMobileFilters && (
        <div className={`p-4 border rounded-xl ${
          isDark ? 'bg-stone-900/30 border-stone-800' : 'bg-stone-50/50 border-stone-200'
        }`}>
          <label className="text-[9px] font-mono uppercase tracking-wider font-bold text-stone-400 flex items-center gap-1">
            <Users className="w-3 h-3" /> Filtrar Especialista
          </label>
          <select 
            value={filtroStaff} 
            onChange={(e) => setFiltroStaff(e.target.value)}
            className={`w-full sm:w-64 mt-1.5 border rounded-xl px-3 py-2 text-xs focus:outline-none ${
              isDark ? 'bg-stone-950 border-stone-800 text-stone-300' : 'bg-white border-stone-200 text-stone-700'
            }`}
          >
            <option value="todos">Todo el Equipo</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* MINI CALENDARIO */}
      {showCalendar && (
        <div className={`border rounded-xl p-4 shadow-sm ${
          isDark ? 'bg-stone-900/40 border-stone-800' : 'bg-white border-stone-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
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

      {/* NOTIFICACIÓN DE PENDIENTES */}
      {citasPendientes > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
              Tienes {citasPendientes} {citasPendientes === 1 ? 'turno pendiente' : 'turnos pendientes'} por confirmar
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
            className="text-[9px] font-mono uppercase border border-amber-500/20 px-3 py-1 rounded-md text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/5 transition-all"
          >
            Enfocar
          </button>
        </div>
      )}

      {/* MÉTRICAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className={`border rounded-xl p-3 text-center ${
          isDark ? 'bg-stone-900/40 border-stone-800' : 'bg-white border-stone-200 shadow-sm'
        }`}>
          <p className="text-[8px] text-stone-400 font-mono uppercase tracking-widest font-bold">Total Turnos</p>
          <p className="text-xl font-mono font-bold text-stone-900 dark:text-stone-100 mt-0.5">{citas.length}</p>
          <Layers className="w-3.5 h-3.5 mx-auto mt-1 text-stone-400 stroke-[1.25]" />
        </div>
        <div className={`border rounded-xl p-3 text-center ${
          isDark ? 'bg-stone-900/40 border-stone-800' : 'bg-white border-stone-200 shadow-sm'
        }`}>
          <p className="text-[8px] text-stone-400 font-mono uppercase tracking-widest font-bold">En Proceso</p>
          <p className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {citas.filter(c => c.status === 'in_progress').length}
          </p>
          <Play className="w-3.5 h-3.5 mx-auto mt-1 text-amber-500/40 stroke-[1.25]" />
        </div>
        <div className={`border rounded-xl p-3 text-center ${
          isDark ? 'bg-stone-900/40 border-stone-800' : 'bg-white border-stone-200 shadow-sm'
        }`}>
          <p className="text-[8px] text-stone-400 font-mono uppercase tracking-widest font-bold">Completados</p>
          <p className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {citas.filter(c => c.status === 'completed').length}
          </p>
          <CheckCircle2 className="w-3.5 h-3.5 mx-auto mt-1 text-emerald-500/40 stroke-[1.25]" />
        </div>
        <div className={`border rounded-xl p-3 text-center ${
          isDark ? 'bg-stone-900/40 border-stone-800' : 'bg-white border-stone-200 shadow-sm'
        }`}>
          <p className="text-[8px] text-stone-400 font-mono uppercase tracking-widest font-bold">Caja Estimada</p>
          <p className="text-xl font-mono font-bold text-stone-900 dark:text-stone-100 mt-0.5">${totalIngresos.toLocaleString()}</p>
          <DollarSign className="w-3.5 h-3.5 mx-auto mt-1 text-stone-400 stroke-[1.25]" />
        </div>
      </div>

      {/* RENDER DE LA VISTA SELECCIONADA */}
      <div className="w-full">
        {viewMode === 'day' && renderVistaDia()}
        {viewMode === 'week' && renderVistaSemana()}
        {viewMode === 'month' && renderVistaMes()}
      </div>

      {/* ============================================================
          MODAL: NUEVA CITA
          ============================================================ */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-stone-950/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
            isDark ? 'bg-stone-900 border border-stone-800' : 'bg-white border border-stone-200'
          }`}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${
              isDark ? 'border-stone-800' : 'border-stone-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-stone-800' : 'bg-stone-100'
                }`}>
                  <Plus className="w-4 h-4 text-stone-500" />
                </div>
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-stone-900 dark:text-stone-100">Agendar Turno</h3>
              </div>
              <button 
                onClick={() => setShowNewAppointment(false)} 
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 max-h-[70vh]">
              <form onSubmit={(e) => { e.preventDefault(); handleAgendarCita() }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold flex items-center gap-1">
                    <User className="w-3 h-3" /> Cliente <span className="text-stone-400">*</span>
                  </label>
                  <select 
                    value={newCita.clientId}
                    onChange={(e) => setNewCita({...newCita, clientId: e.target.value})}
                    className={`w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 transition-all ${
                      isDark ? 'bg-stone-950 border border-stone-800 text-stone-200 focus:ring-stone-700' : 'bg-stone-50 border border-stone-200 text-stone-800 focus:ring-stone-400'
                    }`}
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
                    <Sparkles className="w-3 h-3" /> Servicio <span className="text-stone-400">*</span>
                  </label>
                  <select 
                    value={newCita.serviceId}
                    onChange={(e) => setNewCita({...newCita, serviceId: e.target.value})}
                    className={`w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 transition-all ${
                      isDark ? 'bg-stone-950 border border-stone-800 text-stone-200 focus:ring-stone-700' : 'bg-stone-50 border border-stone-200 text-stone-800 focus:ring-stone-400'
                    }`}
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
                    <Users className="w-3 h-3" /> Especialista
                  </label>
                  <select 
                    value={newCita.staffId}
                    onChange={(e) => setNewCita({...newCita, staffId: e.target.value})}
                    className={`w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 transition-all ${
                      isDark ? 'bg-stone-950 border border-stone-800 text-stone-200 focus:ring-stone-700' : 'bg-stone-50 border border-stone-200 text-stone-800 focus:ring-stone-400'
                    }`}
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
                      <CalendarIcon className="w-3 h-3" /> Fecha <span className="text-stone-400">*</span>
                    </label>
                    <input 
                      type="date"
                      value={newCita.date}
                      onChange={(e) => setNewCita({...newCita, date: e.target.value})}
                      className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 transition-all ${
                        isDark ? 'bg-stone-950 border border-stone-800 text-stone-200 focus:ring-stone-700' : 'bg-stone-50 border border-stone-200 text-stone-800 focus:ring-stone-400'
                      }`}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Hora <span className="text-stone-400">*</span>
                    </label>
                    <TimePicker
                      value={newCita.time}
                      onChange={(time) => setNewCita({...newCita, time})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Observaciones
                  </label>
                  <textarea 
                    value={newCita.notes}
                    onChange={(e) => setNewCita({...newCita, notes: e.target.value})}
                    rows={2}
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 transition-all resize-none ${
                      isDark ? 'bg-stone-950 border border-stone-800 text-stone-200 focus:ring-stone-700' : 'bg-stone-50 border border-stone-200 text-stone-800 focus:ring-stone-400'
                    }`}
                    placeholder="Alergias, especificaciones..."
                  />
                </div>

                {formError && (
                  <div className={`p-3 rounded-xl text-[11px] font-mono leading-relaxed ${
                    isDark ? 'bg-stone-950 border border-stone-800 text-stone-400' : 'bg-stone-50 border border-stone-200 text-stone-600'
                  }`}>
                    {formError}
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setShowNewAppointment(false)}
                    className={`flex-1 px-4 py-2 rounded-xl text-[11px] font-mono uppercase tracking-wider transition-colors ${
                      isDark ? 'border border-stone-800 text-stone-400 hover:bg-stone-800' : 'border border-stone-200 text-stone-500 hover:bg-stone-50'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-xl text-[11px] font-mono uppercase tracking-wider font-bold transition-opacity hover:opacity-90 shadow-sm bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
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
          MODAL: DETALLE DE CITA
          ============================================================ */}
      {showDetailModal && selectedCita && (
        <div className="fixed inset-0 bg-stone-950/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-stone-900 border border-stone-800' : 'bg-white border border-stone-200'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-stone-400" />
                Ficha del Turno
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold">Notas</label>
                  <textarea
                    value={selectedCita.notes || ''}
                    onChange={(e) => setSelectedCita({...selectedCita, notes: e.target.value})}
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none resize-none ${
                      isDark ? 'bg-stone-950 border border-stone-800 text-stone-200' : 'bg-stone-50 border border-stone-200 text-stone-800'
                    }`}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                  <button
                    onClick={() => setIsEditing(false)}
                    className={`flex-1 px-4 py-2 rounded-xl text-[11px] font-mono uppercase tracking-wider ${
                      isDark ? 'border border-stone-800 text-stone-400' : 'border border-stone-200 text-stone-500'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={actualizarCita}
                    className="flex-1 px-4 py-2 rounded-xl text-[11px] font-mono uppercase tracking-wider font-bold bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 text-xs">
                  <div className={`flex justify-between py-1.5 border-b ${
                    isDark ? 'border-stone-800' : 'border-stone-100'
                  }`}>
                    <span className="text-stone-400 font-mono uppercase tracking-wider text-[10px]">Clienta</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{selectedCita.clients?.name || 'Cliente'}</span>
                  </div>
                  <div className={`flex justify-between py-1.5 border-b ${
                    isDark ? 'border-stone-800' : 'border-stone-100'
                  }`}>
                    <span className="text-stone-400 font-mono uppercase tracking-wider text-[10px]">Servicio</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{selectedCita.services?.name || 'Servicio'}</span>
                  </div>
                  <div className={`flex justify-between py-1.5 border-b ${
                    isDark ? 'border-stone-800' : 'border-stone-100'
                  }`}>
                    <span className="text-stone-400 font-mono uppercase tracking-wider text-[10px]">Especialista</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{selectedCita.staff?.name || 'Sin Asignar'}</span>
                  </div>
                  <div className={`flex justify-between py-1.5 border-b ${
                    isDark ? 'border-stone-800' : 'border-stone-100'
                  }`}>
                    <span className="text-stone-400 font-mono uppercase tracking-wider text-[10px]">Horario</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                      {selectedCita.time?.substring(0,5)} hs • {selectedCita.date}
                    </span>
                  </div>
                  <div className={`flex justify-between py-1.5 border-b ${
                    isDark ? 'border-stone-800' : 'border-stone-100'
                  }`}>
                    <span className="text-stone-400 font-mono uppercase tracking-wider text-[10px]">Estado</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      getStatusBadge(selectedCita.status).bg
                    } ${getStatusBadge(selectedCita.status).color}`}>
                      {getStatusBadge(selectedCita.status).label}
                    </span>
                  </div>
                  {selectedCita.notes && (
                    <div className={`p-2.5 rounded-xl text-[11px] leading-relaxed ${
                      isDark ? 'bg-stone-950 border border-stone-800 text-stone-400' : 'bg-stone-50 border border-stone-200 text-stone-500'
                    }`}>
                      <span className="block font-mono text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-0.5">Notas</span>
                      {selectedCita.notes}
                    </div>
                  )}
                </div>

                <div className="space-y-1 pt-2">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold block">Actualizar Estado</label>
                  <div className="grid grid-cols-3 gap-1">
                    {['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].slice(0, 3).map((st: any) => (
                      <button
                        key={st}
                        onClick={() => cambiarEstadoCita(selectedCita.id, st)}
                        className={`px-2 py-1.5 text-[9px] font-mono uppercase tracking-wider border rounded-md transition-all ${
                          selectedCita.status === st 
                            ? isDark ? 'bg-stone-100 text-stone-900 font-bold' : 'bg-stone-900 text-white font-bold'
                            : isDark ? 'border-stone-800 text-stone-400 hover:bg-stone-800' : 'border-stone-200 text-stone-400 hover:bg-stone-50'
                        }`}
                      >
                        {st === 'pending' ? '⏳ Pend' : st === 'confirmed' ? '✓ Conf' : '▶️ Proceso'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                  <button
                    onClick={() => setIsEditing(true)}
                    className={`flex-1 px-4 py-2 rounded-xl text-[11px] font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                      isDark ? 'border border-stone-800 text-stone-300 hover:bg-stone-800' : 'border border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Edit className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => eliminarCita(selectedCita.id)}
                    className="flex-1 px-4 py-2 rounded-xl text-[11px] font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 border border-rose-200 text-rose-600 dark:text-rose-400 dark:border-rose-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
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
