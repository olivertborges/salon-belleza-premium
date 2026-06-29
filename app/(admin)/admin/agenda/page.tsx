'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Calendar as CalendarIcon, Clock, User, Sparkles, 
  ChevronLeft, ChevronRight, CheckCircle2, 
  Play, Filter, DollarSign, Layers, Plus, Trash2, 
  X, Edit, Save, FileText, TrendingUp, Users, 
  Calendar, ChevronDown, Bell, Menu, Search,
  Star, Award, Zap, Eye, MessageCircle, Ban,
  RefreshCw
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
      completed: { label: 'Completada', color: 'text-stone-600 dark:text-stone-400', bg: 'bg-stone-500/10 border-stone-500/20', icon: Award },
      cancelled: { label: 'Cancelada', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: X },
      blocked: { label: 'Bloqueado', color: 'text-stone-700 dark:text-amber-500/80', bg: 'bg-stone-200 dark:bg-stone-800/50 border-border', icon: Ban },
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
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center border-2 border-dashed border-cyan-500/30">
            <Sparkles className="w-8 h-8 text-cyan-500/50" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">¡Día tranquilo! 🌟</p>
            <p className="text-sm text-mutedForeground mt-1">No hay citas agendadas para hoy</p>
          </div>
          <button 
            onClick={() => setShowNewAppointment(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-medium shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            Agendar nueva cita
          </button>
        </div>
      )
    }

    // Agrupar por franja horaria
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
      { key: 'mañana', label: '🌅 Mañana', icon: '☀️', citas: grupos.mañana },
      { key: 'tarde', label: '🌤️ Tarde', icon: '🌤️', citas: grupos.tarde },
      { key: 'noche', label: '🌙 Noche', icon: '🌙', citas: grupos.noche }
    ]

    return (
      <div className="space-y-6 pb-4">
        {/* Header del día */}
        <div className="flex items-center justify-between bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl p-4 border border-cyan-500/10">
          <div>
            <p className="text-xs font-mono text-mutedForeground uppercase tracking-wider">
              {format(fechaSeleccionada, 'EEEE', { locale: es })}
            </p>
            <h2 className="text-2xl font-bold text-foreground">
              {format(fechaSeleccionada, 'd', { locale: es })}
              <span className="text-base font-normal text-mutedForeground ml-1">
                de {format(fechaSeleccionada, 'MMMM', { locale: es })}
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20">
              {citasOrdenadas.length} citas
            </span>
          </div>
        </div>

        {/* Citas por franja horaria */}
        {franjas.map(({ key, label, icon, citas: citasFranja }) => {
          if (citasFranja.length === 0) return null
          
          return (
            <div key={key} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <h3 className="text-sm font-semibold text-foreground">{label}</h3>
                <span className="text-xs text-mutedForeground font-mono">({citasFranja.length})</span>
              </div>
              
              {citasFranja.map((cita) => {
                const statusInfo = getStatusBadge(cita.status)
                const horaMostrar = cita.time ? cita.time.substring(0, 5) : '--:--'
                const isCompleted = cita.status === 'completed'
                const isProcessing = cita.status === 'in_progress'
                
                let cardBg = 'bg-card border-border'
                let borderGradient = 'border-cyan-500/20'
                if (isCompleted) {
                  cardBg = 'bg-emerald-500/[0.03] dark:bg-emerald-950/10 border-emerald-500/20'
                  borderGradient = 'border-emerald-500/20'
                }
                if (isProcessing) {
                  cardBg = 'bg-amber-500/[0.06] dark:bg-amber-950/20 border-amber-500/30'
                  borderGradient = 'border-amber-500/30'
                }

                return (
                  <div 
                    key={cita.id} 
                    onClick={() => abrirDetalleCita(cita)}
                    className={`relative overflow-hidden rounded-2xl border-2 p-4 transition-all cursor-pointer hover:scale-[1.02] hover:shadow-xl ${cardBg} ${borderGradient}`}
                  >
                    {/* Barra lateral de estado */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-full ${
                      isCompleted ? 'bg-emerald-500' : 
                      isProcessing ? 'bg-amber-500' : 
                      'bg-cyan-500'
                    }`} />
                    
                    <div className="pl-3 flex items-start gap-3">
                      {/* Avatar grande */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/20 flex-shrink-0">
                        {cita.clients?.name?.charAt(0) || '?'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-base font-semibold text-foreground truncate">
                              {cita.clients?.name || 'Cliente'}
                            </h4>
                            <p className="text-sm text-mutedForeground truncate">
                              {cita.services?.name || 'Servicio'}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-mono font-bold text-cyan-600 dark:text-cyan-400">
                              {horaMostrar}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-mutedForeground flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {cita.staff?.name || 'Sin asignar'}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
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
        })}
      </div>
    )
  }

  // ============================================================
  // VISTA SEMANA - CON HORAS FIJAS (CORREGIDO Z-INDEX)
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

    const coloresDias = [
      'border-cyan-500/30',
      'border-blue-500/30',
      'border-indigo-500/30',
      'border-purple-500/30',
      'border-pink-500/30',
      'border-rose-500/30',
      'border-emerald-500/30',
    ]

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto select-none border-2 border-border rounded-2xl bg-background shadow-xl">
          <div className="min-w-[900px] flex flex-col font-sans">

            {/* HEADER DE DIAS - z-index reducido a 10 para que no compita con el header del layout */}
            <div className="flex border-b-2 border-border bg-card sticky top-0 z-10">
              <div className="w-16 flex-shrink-0 border-r-2 border-border bg-card/80 backdrop-blur-sm" />
              <div className="flex-1 grid grid-cols-7">
                {weekDays.map((day, idx) => {
                  const isTodayDate = isToday(day)
                  const colorDia = coloresDias[idx % coloresDias.length]
                  return (
                    <div 
                      key={day.toString()} 
                      className={`text-center py-3 border-r-2 border-border/60 last:border-r-0 flex flex-col items-center justify-center transition-all ${
                        isTodayDate 
                          ? 'bg-gradient-to-b from-cyan-500/20 to-blue-500/10 border-b-2 border-cyan-500' 
                          : `hover:bg-cyan-500/5`
                      }`}
                    >
                      <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                        isTodayDate ? 'text-cyan-500' : 'text-mutedForeground'
                      }`}>
                        {format(day, 'EEE', { locale: es })}
                      </span>
                      <div className={`mt-1 w-8 h-8 flex items-center justify-center rounded-full text-sm font-mono font-bold transition-all ${
                        isTodayDate 
                          ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 scale-110' 
                          : 'text-foreground hover:scale-105'
                      }`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CUERPO */}
            <div className="flex relative">

              {/* HORAS FIJAS - z-index reducido a 15 para que esté por debajo del header del layout */}
              <div 
                className="w-16 flex-shrink-0 border-r-2 border-border bg-card/95 backdrop-blur-sm z-[15] sticky left-0"
                style={{ height: `${totalHoras * HORA_ALTURA}px` }}
              >
                {horasCuadricula.map((hora) => {
                  const isHoraPico = hora >= 12 && hora <= 14
                  return (
                    <div 
                      key={hora} 
                      className={`text-[10px] font-mono font-bold flex items-start justify-end pr-2.5 pt-2 ${
                        isHoraPico ? 'text-amber-500 dark:text-amber-400' : 'text-mutedForeground'
                      }`} 
                      style={{ height: `${HORA_ALTURA}px` }}
                    >
                      {String(hora).padStart(2, '0')}:00
                    </div>
                  )
                })}
              </div>

              {/* CONTENEDOR SCROLLABLE */}
              <div className="flex-1 overflow-x-auto relative">
                <div className="relative" style={{ height: `${totalHoras * HORA_ALTURA}px`, minWidth: '700px' }}>

                  {/* SLOTS */}
                  <div className="absolute inset-0 grid grid-cols-7" style={{ gridTemplateRows: `repeat(${totalHoras}, ${HORA_ALTURA}px)` }}>
                    {weekDays.map((day, colIdx) => {
                      const dayStr = format(day, 'yyyy-MM-dd')
                      return horasCuadricula.map((hora, rowIdx) => {
                        const horaStr = String(hora).padStart(2, '0')
                        return (
                          <DroppableSlot
                            key={`slot-${dayStr}-${horaStr}`}
                            id={`slot-${dayStr}-${horaStr}`}
                            className="border-r border-b border-border/10 hover:bg-cyan-500/10 transition-colors"
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

                  {/* CITAS */}
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

                        let cardBgColor = 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700 text-foreground shadow-sm'
                        if (isProcessing) cardBgColor = 'bg-gradient-to-br from-amber-400/20 to-amber-500/10 border-2 border-amber-400/40 text-amber-800 dark:text-amber-200 shadow-amber-500/20'
                        if (isCompleted) cardBgColor = 'bg-gradient-to-br from-emerald-400/10 to-emerald-500/5 border-2 border-emerald-400/20 text-muted-foreground opacity-75'
                        if (cita.status === 'blocked') cardBgColor = 'bg-gradient-to-br from-gray-300/30 to-gray-400/10 dark:from-gray-700/50 dark:to-gray-800/30 border-2 border-dashed border-gray-400 text-muted-foreground opacity-80'

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
                              className={`w-full h-full border-2 rounded-xl p-2 flex flex-col justify-between overflow-hidden transition-all ${cardBgColor} ${
                                isDragging ? 'opacity-50 ring-4 ring-cyan-500 shadow-2xl scale-105' : 'hover:shadow-lg hover:scale-[1.02]'
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
                                    <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                                      {horaFormateada}
                                    </span>
                                    <span className={`text-[6px] px-1.5 py-0.5 rounded-full border-2 uppercase font-mono tracking-wider font-bold ${
                                      statusInfo.color
                                    }`}>
                                      {statusInfo.label}
                                    </span>
                                  </div>
                                  <p className="text-[10px] font-bold truncate text-foreground mt-1 tracking-wide flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                    {cita.clients?.name || 'Cliente'}
                                  </p>
                                  <p className="text-[8px] text-muted-foreground font-medium truncate opacity-80">
                                    {cita.services?.name || 'Servicio'}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between text-[7px] border-t border-border/40 pt-1 mt-1 font-mono">
                                  <span className="text-muted-foreground font-sans truncate max-w-[55%] flex items-center gap-1">
                                    <User className="w-2.5 h-2.5" /> {cita.staff?.name || 'Sin'}
                                  </span>
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[9px]">
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
  // VISTA MES - CALENDAR FLOW MEJORADO
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
      <div className="flex flex-col h-full font-sans select-none">
        <div className="grid grid-cols-7 border-b-2 border-border bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 text-center font-mono font-bold text-[10px] text-mutedForeground py-2.5 rounded-t-xl">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, idx) => (
            <span key={idx} className="uppercase tracking-wider hover:text-foreground transition-colors cursor-default">
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-border border-b-2 border-r-2 border-l-2 border-border rounded-b-xl overflow-hidden">
          {days.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="bg-muted/5 min-h-[85px]" />
            }

            const citasDelDia = getCitasDelDia(day).sort((a, b) => (a.time || '').localeCompare(b.time || ''))
            const isTodayDate = isToday(day)
            const tieneCitas = citasDelDia.length > 0
            const esDiaConCitas = diasConCitas.has(format(day, 'yyyy-MM-dd'))

            return (
              <div 
                key={idx} 
                onClick={() => { setFechaSeleccionada(day); setViewMode('day') }}
                className={`bg-card p-2 min-h-[85px] flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] relative group ${
                  isTodayDate 
                    ? 'ring-2 ring-inset ring-cyan-500/40 bg-gradient-to-br from-cyan-500/5 to-blue-500/5' 
                    : tieneCitas 
                      ? 'hover:bg-gradient-to-br hover:from-cyan-500/5 hover:to-transparent' 
                      : 'hover:bg-muted/20'
                }`}
              >
                {/* Fecha */}
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-mono font-bold flex items-center justify-center rounded-xl w-8 h-8 transition-all ${
                    isTodayDate 
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 scale-110' 
                      : esDiaConCitas 
                        ? 'text-cyan-600 dark:text-cyan-400 group-hover:scale-110' 
                        : 'text-mutedForeground group-hover:text-foreground'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {tieneCitas && (
                    <span className="text-[8px] font-mono font-bold text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                      {citasDelDia.length}
                    </span>
                  )}
                </div>

                {/* Citas */}
                <div className="flex-1 space-y-0.5 mt-1 overflow-y-hidden max-h-[55px]">
                  {citasDelDia.slice(0, 2).map((cita) => {
                    const hora24 = format24h(cita.time)
                    const isProcessing = cita.status === 'in_progress'
                    const isCompleted = cita.status === 'completed'

                    let badgeStyle = 'bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 text-foreground shadow-sm'
                    if (isProcessing) badgeStyle = 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 border-l-2 border-l-amber-500'
                    if (isCompleted) badgeStyle = 'bg-emerald-500/5 border-emerald-500/20 text-mutedForeground opacity-60 line-through'

                    return (
                      <div 
                        key={cita.id} 
                        onClick={(e) => { e.stopPropagation(); abrirDetalleCita(cita) }}
                        className={`group/item flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded-lg truncate transition-all cursor-pointer hover:scale-[1.05] hover:shadow-md ${badgeStyle}`} 
                        title={`${hora24} - ${cita.clients?.name}`}
                      >
                        <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 flex-shrink-0 text-[8px]">
                          {hora24}
                        </span>
                        <span className="truncate font-medium flex-1 text-[8px]">
                          {cita.clients?.name?.substring(0, 10) || 'Cliente'}
                        </span>
                        {isProcessing && <Zap className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />}
                        {isCompleted && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />}
                      </div>
                    )
                  })}

                  {citasDelDia.length > 2 && (
                    <div className="text-[7px] text-cyan-600 dark:text-cyan-500/70 font-mono font-bold bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20 text-center py-0.5">
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
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-14 h-14 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-mutedForeground font-mono animate-pulse">Cargando agenda...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto border-2 border-rose-500/20">
            <X className="w-8 h-8 text-rose-500" />
          </div>
          <p className="text-lg font-bold text-rose-500 dark:text-red-400">Error al cargar los datos</p>
          <p className="text-sm text-mutedForeground">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-medium shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER PRINCIPAL - HYBRID TIMELINE
  // ============================================================
  return (
    // Añadimos padding-top para que el contenido no se superponga con el header del layout
    // El header del layout tiene altura ~80px (h-20), así que usamos pt-20
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 pb-20 pt-20">
      {/* HEADER DE LA AGENDA - CON z-index 20 PARA QUE QUEDE DETRÁS DEL HEADER DEL LAYOUT (z-30) */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-xl border-b border-border shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl shadow-lg shadow-cyan-500/20">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Agenda</h1>
                <p className="text-[10px] text-mutedForeground font-mono">{citas.length} citas totales</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowNewAppointment(true)}
                className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 transition-all"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
              <button 
                onClick={() => setShowCalendar(!showCalendar)}
                className="p-2.5 bg-muted/30 border border-border rounded-2xl hover:bg-muted/50 transition-all"
              >
                <Calendar className="w-5 h-5 text-mutedForeground" />
              </button>
            </div>
          </div>

          {/* Selector de vista tipo tabs */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex bg-muted/30 border border-border rounded-2xl p-1">
              <button 
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'day' 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20' 
                    : 'text-mutedForeground hover:text-foreground'
                }`}
              >
                Día
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'week' 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20' 
                    : 'text-mutedForeground hover:text-foreground'
                }`}
              >
                Semana
              </button>
              <button 
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'month' 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20' 
                    : 'text-mutedForeground hover:text-foreground'
                }`}
              >
                Mes
              </button>
            </div>

            <button 
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="p-2 bg-muted/30 border border-border rounded-2xl hover:bg-muted/50 transition-all"
            >
              <Filter className="w-4 h-4 text-mutedForeground" />
            </button>
          </div>

          {/* Navegación de fechas */}
          <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-border">
            <button 
              onClick={() => cambiarDia(-1)} 
              className="p-2.5 rounded-2xl bg-background border border-border text-mutedForeground hover:text-foreground hover:border-cyan-500/30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-mono font-bold text-foreground uppercase tracking-wider text-center flex-1">
              {formatFechaTitulo()}
            </span>
            <button 
              onClick={() => cambiarDia(1)} 
              className="p-2.5 rounded-2xl bg-background border border-border text-mutedForeground hover:text-foreground hover:border-cyan-500/30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Filtros mobile */}
          {showMobileFilters && (
            <div className="mt-3 pt-3 border-t border-border">
              <select 
                value={filtroStaff} 
                onChange={(e) => setFiltroStaff(e.target.value)}
                className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="todos">🌟 Todo el Equipo</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>💅 {s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Mini calendario desplegable */}
      {showCalendar && (
        <div className="mx-4 mt-3 bg-card border border-border rounded-2xl shadow-xl p-4 animate-slideDown">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
              <ChevronLeft className="w-5 h-5 text-mutedForeground" />
            </button>
            <span className="text-sm font-bold text-foreground">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </span>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
              <ChevronRight className="w-5 h-5 text-mutedForeground" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
              <span key={d} className="text-[10px] font-mono text-mutedForeground">{d}</span>
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
                    className={`p-2 rounded-xl text-sm font-mono transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20' 
                        : tieneCita 
                          ? 'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10' 
                          : 'text-mutedForeground hover:bg-muted/30'
                    }`}
                  >
                    {format(day, 'd')}
                    {tieneCita && <div className="w-1 h-1 mx-auto mt-0.5 rounded-full bg-cyan-500" />}
                  </button>
                )
              })
            })()}
          </div>
        </div>
      )}

      {/* Alertas de pendientes */}
      {citasPendientes > 0 && (
        <div className="mx-4 mt-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <p className="text-sm font-mono text-amber-600 dark:text-amber-400">
              <span className="font-bold">{citasPendientes}</span> pendiente{citasPendientes !== 1 ? 's' : ''}
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
            className="text-xs font-mono uppercase bg-amber-500 text-black px-4 py-2 rounded-xl font-bold hover:bg-amber-400 transition-all"
          >
            Ver ahora
          </button>
        </div>
      )}

      {/* Stats cards - modernas y grandes */}
      <div className="grid grid-cols-4 gap-2 px-4 mt-3">
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <p className="text-[8px] text-mutedForeground font-mono uppercase tracking-widest">Total</p>
          <p className="text-xl font-mono font-bold text-foreground">{citas.length}</p>
          <Layers className="w-4 h-4 mx-auto mt-1 text-cyan-500/50" />
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <p className="text-[8px] text-mutedForeground font-mono uppercase tracking-widest">Proceso</p>
          <p className="text-xl font-mono font-bold text-amber-500">
            {citas.filter(c => c.status === 'in_progress').length}
          </p>
          <Play className="w-4 h-4 mx-auto mt-1 text-amber-500/50" />
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <p className="text-[8px] text-mutedForeground font-mono uppercase tracking-widest">Completadas</p>
          <p className="text-xl font-mono font-bold text-emerald-500">
            {citas.filter(c => c.status === 'completed').length}
          </p>
          <CheckCircle2 className="w-4 h-4 mx-auto mt-1 text-emerald-500/50" />
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <p className="text-[8px] text-mutedForeground font-mono uppercase tracking-widest">Ingresos</p>
          <p className="text-xl font-mono font-bold text-emerald-500">${totalIngresos.toLocaleString()}</p>
          <DollarSign className="w-4 h-4 mx-auto mt-1 text-emerald-500/50" />
        </div>
      </div>

      {/* Contenido de la agenda */}
      <div className="px-4 mt-4">
        <div className="bg-card border border-border rounded-3xl p-4 shadow-xl relative min-h-[400px]">
          {viewMode === 'day' && renderVistaDia()}
          {viewMode === 'week' && renderVistaSemana()}
          {viewMode === 'month' && renderVistaMes()}
        </div>
      </div>

      {/* ============================================================
          MODALES - MANTENIDOS IGUALES POR LA LÓGICA
          ============================================================ */}
      
      {/* MODAL NUEVA CITA */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-card border-2 border-border rounded-3xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">

            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-border bg-gradient-to-r from-cyan-500/5 to-blue-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-xl shadow-cyan-500/20">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Agendar cita</h3>
                  <p className="text-[10px] text-mutedForeground font-mono">Registra una nueva cita</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewAppointment(false)} 
                className="w-9 h-9 rounded-2xl hover:bg-muted/50 transition-colors flex items-center justify-center text-mutedForeground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <form onSubmit={(e) => { e.preventDefault(); handleAgendarCita(); }} className="space-y-4">

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-mutedForeground font-bold">
                    <User className="w-4 h-4" /> Cliente <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    value={newCita.clientId}
                    onChange={(e) => setNewCita({...newCita, clientId: e.target.value})}
                    className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20"
                    required
                  >
                    <option value="">Selecciona un cliente</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-mutedForeground font-bold">
                    <Sparkles className="w-4 h-4" /> Servicio <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    value={newCita.serviceId}
                    onChange={(e) => setNewCita({...newCita, serviceId: e.target.value})}
                    className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20"
                    required
                  >
                    <option value="">Selecciona un servicio</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (${s.price})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-mutedForeground font-bold">
                    <User className="w-4 h-4" /> Profesional
                  </label>
                  <select 
                    value={newCita.staffId}
                    onChange={(e) => setNewCita({...newCita, staffId: e.target.value})}
                    className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20"
                  >
                    <option value="">Cualquier profesional</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-mutedForeground font-bold">
                      <CalendarIcon className="w-4 h-4" /> Fecha <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="date"
                      value={newCita.date}
                      onChange={(e) => setNewCita({...newCita, date: e.target.value})}
                      className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-mutedForeground font-bold">
                      <Clock className="w-4 h-4" /> Hora <span className="text-rose-500">*</span>
                    </label>
                    <TimePicker
                      value={newCita.time}
                      onChange={(time) => setNewCita({...newCita, time})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-mutedForeground font-bold">
                    <FileText className="w-4 h-4" /> Notas
                  </label>
                  <textarea 
                    value={newCita.notes}
                    onChange={(e) => setNewCita({...newCita, notes: e.target.value})}
                    rows={2}
                    className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 resize-none placeholder-mutedForeground/60"
                    placeholder="Alergias, observaciones..."
                  />
                </div>

                {formError && (
                  <div className="bg-rose-500/10 border-2 border-rose-500/30 rounded-2xl p-3 text-rose-600 dark:text-rose-400 text-sm font-medium">
                    {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-2 border-t-2 border-border">
                  <button
                    type="button"
                    onClick={() => setShowNewAppointment(false)}
                    className="flex-1 px-4 py-3 bg-muted/30 border-2 border-border text-mutedForeground hover:bg-muted/50 rounded-2xl text-sm font-medium transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl text-sm font-bold hover:shadow-2xl hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Agendar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE */}
      {showDetailModal && selectedCita && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-card border-2 border-border rounded-3xl p-5 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-cyan-500" />
                Detalle de Cita
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-muted rounded-2xl transition-colors">
                <X className="w-5 h-5 text-mutedForeground" />
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-mutedForeground font-bold mb-1.5">Cliente</label>
                  <select 
                    value={selectedCita.client_id || selectedCita.clients?.id || ''}
                    onChange={(e) => setSelectedCita({
                      ...selectedCita, 
                      client_id: e.target.value,
                      clients: clients.find(c => c.id === e.target.value)
                    })}
                    className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-mutedForeground font-bold mb-1.5">Servicio</label>
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
                    className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (${s.price})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-mutedForeground font-bold mb-1.5">Profesional</label>
                  <select 
                    value={selectedCita.professional_id || selectedCita.staff?.id || ''}
                    onChange={(e) => setSelectedCita({
                      ...selectedCita, 
                      professional_id: e.target.value,
                      staff: staff.find(s => s.id === e.target.value)
                    })}
                    className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20"
                  >
                    <option value="">Sin asignar</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-mutedForeground font-bold mb-1.5">Fecha</label>
                    <input 
                      type="date"
                      value={selectedCita.date || ''}
                      onChange={(e) => setSelectedCita({...selectedCita, date: e.target.value})}
                      className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-mutedForeground font-bold mb-1.5">Hora</label>
                    <TimePicker
                      value={selectedCita.time || ''}
                      onChange={(time) => setSelectedCita({...selectedCita, time})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-mutedForeground font-bold mb-1.5">Notas</label>
                  <textarea 
                    value={selectedCita.notes || ''}
                    onChange={(e) => setSelectedCita({...selectedCita, notes: e.target.value})}
                    rows={2}
                    className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t-2 border-border">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-3 bg-muted/30 text-mutedForeground rounded-2xl text-sm font-medium hover:bg-muted/50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={actualizarCita}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl text-sm font-bold hover:shadow-2xl hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-2xl border-2 border-border">
                  <div>
                    <p className="text-[10px] text-mutedForeground font-mono uppercase tracking-wider font-bold">Estado</p>
                    <span className={`text-sm px-3 py-1 rounded-full border-2 font-bold ${getStatusBadge(selectedCita.status).bg} ${getStatusBadge(selectedCita.status).color}`}>
                      {getStatusBadge(selectedCita.status).label}
                    </span>
                  </div>
                  <span className="text-xl font-mono font-bold text-emerald-500">
                    ${Number(selectedCita.services?.price || selectedCita.total_price || 0).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/10 rounded-2xl border-2 border-border">
                    <p className="text-[10px] text-mutedForeground font-mono uppercase tracking-wider font-bold">Cliente</p>
                    <p className="text-base font-bold text-foreground">{selectedCita.clients?.name || 'Sin cliente'}</p>
                    <p className="text-xs text-mutedForeground">{selectedCita.clients?.phone || ''}</p>
                  </div>
                  <div className="p-3 bg-muted/10 rounded-2xl border-2 border-border">
                    <p className="text-[10px] text-mutedForeground font-mono uppercase tracking-wider font-bold">Servicio</p>
                    <p className="text-base font-bold text-foreground">{selectedCita.services?.name || 'Sin servicio'}</p>
                    <p className="text-xs text-mutedForeground">{selectedCita.services?.duration || 0} min</p>
                  </div>
                </div>

                <div className="p-3 bg-muted/10 rounded-2xl border-2 border-border">
                  <p className="text-[10px] text-mutedForeground font-mono uppercase tracking-wider font-bold">Profesional</p>
                  <p className="text-base font-bold text-foreground">{selectedCita.staff?.name || 'Sin asignar'}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/10 rounded-2xl border-2 border-border">
                    <p className="text-[10px] text-mutedForeground font-mono uppercase tracking-wider font-bold">Fecha</p>
                    <p className="text-base font-bold text-foreground">{selectedCita.date || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-muted/10 rounded-2xl border-2 border-border">
                    <p className="text-[10px] text-mutedForeground font-mono uppercase tracking-wider font-bold">Hora</p>
                    <p className="text-base font-bold text-foreground">{selectedCita.time ? selectedCita.time.substring(0,5) : 'N/A'}</p>
                  </div>
                </div>

                {selectedCita.notes && (
                  <div className="p-3 bg-muted/10 rounded-2xl border-2 border-border">
                    <p className="text-[10px] text-mutedForeground font-mono uppercase tracking-wider font-bold">Notas</p>
                    <p className="text-sm text-mutedForeground">{selectedCita.notes}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-3 border-t-2 border-border">
                  {selectedCita.status === 'pending' && (
                    <>
                      <button
                        onClick={() => cambiarEstadoCita(selectedCita.id, 'confirmed')}
                        className="flex-1 px-3 py-2.5 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-bold hover:bg-emerald-500/20 transition-all"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => cambiarEstadoCita(selectedCita.id, 'cancelled')}
                        className="flex-1 px-3 py-2.5 bg-rose-500/10 border-2 border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold hover:bg-rose-500/20 transition-all"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                  {(selectedCita.status === 'pending' || selectedCita.status === 'confirmed') && (
                    <button
                      onClick={() => cambiarEstadoCita(selectedCita.id, 'in_progress')}
                      className="flex-1 px-3 py-2.5 bg-amber-500/10 border-2 border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-2xl text-xs font-bold hover:bg-amber-500/20 transition-all"
                    >
                      Iniciar
                    </button>
                  )}
                  {selectedCita.status === 'in_progress' && (
                    <button
                      onClick={() => cambiarEstadoCita(selectedCita.id, 'completed')}
                      className="flex-1 px-3 py-2.5 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-bold hover:bg-emerald-500/20 transition-all"
                    >
                      Completar
                    </button>
                  )}
                  {selectedCita.status !== 'completed' && selectedCita.status !== 'cancelled' && (
                    <button
                      onClick={() => cambiarEstadoCita(selectedCita.id, 'cancelled')}
                      className="flex-1 px-3 py-2.5 bg-rose-500/10 border-2 border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold hover:bg-rose-500/20 transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 px-4 py-3 bg-muted/30 border-2 border-border text-foreground rounded-2xl text-sm font-bold hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-5 h-5" />
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarCita(selectedCita.id)}
                    className="flex-1 px-4 py-3 bg-rose-500/10 border-2 border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-2xl text-sm font-bold hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
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
