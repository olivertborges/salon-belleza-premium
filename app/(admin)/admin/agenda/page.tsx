// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Calendar as CalendarIcon, Clock, User, Sparkles, 
  ChevronLeft, ChevronRight, CheckCircle2, 
  Play, Filter, DollarSign, Layers, Plus, Trash2, 
  X, Edit, FileText, Users, ChevronDown, 
  Award, Ban, RefreshCw, Scissors, Loader2, Building2,
  CalendarDays, Smartphone, Check, TrendingUp, Calendar as CalendarIconCheck, Save,
  Eye, EyeOff, Circle
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, startOfMonth, endOfMonth, getDaysInMonth, isSameDay, addDays, isSameMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import { TimePicker } from '@/components/TimePicker'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'

type ViewMode = 'day' | 'week' | 'month'

export default function AdminAgendaPage() {
  const { settings } = useSettings()
  const { user, role } = useAuth()

  // Estados de datos
  const [citas, setCitas] = useState<any>([])
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
  const [formError, setFormError] = useState<string | null>(null)
  const [isStaff, setIsStaff] = useState(false)
  const [staffId, setStaffId] = useState<string | null>(null)

  // Estados para nueva cita
  const [newCita, setNewCita] = useState({
    clientId: '',
    serviceId: '',
    staffId: '',
    date: '',
    time: '',
    notes: '',
  })

  // Detectar si el usuario es staff (empleada)
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user?.id) return
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        const isStaffUser = profile?.role === 'staff'
        setIsStaff(isStaffUser)

        if (isStaffUser) {
          // Obtener el ID del staff asociado a este usuario
          const { data: staffData } = await supabase
            .from('staff')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle()
          
          if (staffData) {
            setStaffId(staffData.id)
            setFiltroStaff(staffData.id)
          }
        }
      } catch (error) {
        console.error('Error verificando rol:', error)
      }
    }
    checkUserRole()
  }, [user])

  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

  // Toast para nuevas citas online
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
      if (!isStaff) setFiltroStaff('todos')
      toast.remove()
    })

    setTimeout(() => {
      if (document.body.contains(toast)) toast.remove()
    }, 12000)
  }

  // Sincronización e Ingesta de Datos Centralizada
  const fetchData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)

    try {
      let query = supabase.from('appointments').select('*')

      // Si es staff, solo ver sus citas
      if (isStaff && staffId) {
        query = query.eq('professional_id', staffId)
      }

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

      if (filtroStaff !== 'todos' && !isStaff) {
        query = query.eq('professional_id', filtroStaff)
      }

      const { data: citasData, error: citasError } = await query.order('time', { ascending: true })

      if (citasError) throw citasError

      const [staffRes, servicesRes, clientsRes] = await Promise.all([
        supabase.from('staff').select('*').eq('is_active', true),
        supabase.from('services').select('*').eq('is_active', true),
        supabase.from('clients').select('*')
      ])

      const citasConRelaciones = citasData.map((cita: any) => ({
        ...cita,
        clients: clientsRes.data?.find((c: any) => c.id === cita.client_id) || null,
        services: servicesRes.data?.find((s: any) => s.id === cita.service_id) || null,
        staff: staffRes.data?.find((s: any) => s.id === cita.professional_id) || null
      }))

      setCitas(citasConRelaciones as any)
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

  // useEffect principal
  useEffect(() => {
    fetchData(false)

    const canalCitas = supabase
      .channel('cambios-agenda-admin-v3')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'appointments' },
        (payload) => {
          if (payload.new.status !== 'blocked') {
            mostrarToastLlamativo(payload.new)
          }
          fetchData(false)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'appointments' },
        () => fetchData(false)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'appointments' },
        () => fetchData(false)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canalCitas)
    }
  }, [fechaSeleccionada, filtroStaff, viewMode, isStaff, staffId])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData(true)
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
      pending: { label: 'Pendiente', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock },
      confirmed: { label: 'Confirmada', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
      in_progress: { label: 'En curso', color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', icon: Play },
      completed: { label: 'Completada', color: 'text-stone-500 dark:text-stone-400', bg: 'bg-stone-500/10 border-stone-500/20', icon: Award },
      cancelled: { label: 'Cancelada', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: X },
      blocked: { label: 'Bloqueado', color: 'text-stone-500 dark:text-stone-500', bg: 'bg-stone-500/10 border-stone-500/20 dark:bg-stone-800/30', icon: Ban },
    }
    return config[status] || config.pending
  }

  const getCitasDelDia = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return citas.filter((c: any) => c.date === dateStr)
  }

  // Cálculos de KPIs
  const totalIngresos = citas
    .filter((c: any) => c.status === 'completed')
    .reduce((sum: number, c: any) => sum + Number(c.services?.price || 0), 0)

  const citasPendientes = citas.filter((c: any) => c.status === 'pending').length
  const totalCitasVista = citas.filter((c: any) => c.status !== 'blocked' && c.status !== 'cancelled').length

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
      setCitas((prev: any[]) => prev.map((c: any) => c.id === id ? { ...c, status: nuevoEstado } : c))
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
      setCitas((prev: any[]) => prev.filter((c: any) => c.id !== id))
      setShowDetailModal(false)
      setSuccess('Cita eliminada correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error al eliminar:', err)
      setError('Error al eliminar la cita')
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
      const appointmentData = {
        client_id: newCita.clientId,
        professional_id: newCita.staffId || null,
        service_id: newCita.serviceId,
        date: newCita.date,
        time: newCita.time,
        status: 'pending' as const,
        total_price: services.find((s: any) => s.id === newCita.serviceId)?.price || 0,
        notes: newCita.notes,
        tenant_id: settings?.tenant_id || null
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData] as any)
        .select()

      if (error) {
        if (error.code === '23505' || error.code === '409') {
          const profesional = staff.find((s: any) => s.id === newCita.staffId)?.name || 'el profesional'
          setFormError(`⚠️ Conflicto de horario para ${profesional} en este horario.`)
          return
        }
        throw error
      }

      if (data && data.length > 0) {
        setCitas((prev: any[]) => [...prev, data[0]])
      }

      setShowNewAppointment(false)
      setNewCita({ clientId: '', serviceId: '', staffId: '', date: '', time: '', notes: '' })
      setFormError(null)
      setSuccess('Cita agendada correctamente')
      setTimeout(() => setSuccess(null), 3000)
      await fetchData(false)
    } catch (err: any) {
      console.error('Error al agendar:', err)
      setFormError(err.message || 'Error al agendar el turno')
    }
  }

  const handleSlotClick = (dateStr: string, horaStr: string) => {
    // Si es staff, auto-asignar su ID
    setNewCita({
      clientId: '',
      serviceId: '',
      staffId: isStaff && staffId ? staffId : (filtroStaff !== 'todos' ? filtroStaff : ''),
      date: dateStr,
      time: `${horaStr}:00`,
      notes: ''
    })
    setFormError(null)
    setShowNewAppointment(true)
  }

  // ============================================================
  // RENDER VISTA DÍA
  // ============================================================
  const renderVistaDia = () => {
    const citasDelDia = getCitasDelDia(fechaSeleccionada)
    const citasOrdenadas = [...citasDelDia].sort((a: any, b: any) => (a.time || '').localeCompare(b.time || ''))

    const horas = Array.from({ length: 12 }, (_, i) => i + 8) // 8:00 a 20:00

    return (
      <div className="space-y-4">
        {/* Cabecera del día */}
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isToday(fechaSeleccionada) 
            ? 'bg-gradient-to-r from-pink-500/10 to-rose-500/5 border-pink-500/20' 
            : 'bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-serif italic font-bold ${
                isToday(fechaSeleccionada) ? 'text-pink-500' : 'text-stone-900 dark:text-pink-100'
              }`}>
                {format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}
              </h3>
              {isToday(fechaSeleccionada) && (
                <span className="text-xs font-medium text-pink-500 flex items-center gap-1">
                  <Circle className="w-2 h-2 fill-current" /> Hoy
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleSlotClick(format(fechaSeleccionada, 'yyyy-MM-dd'), '11:00')}
                className="px-3 py-1.5 rounded-xl text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:scale-105 transition-all shadow-md"
                style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
              >
                <Plus className="w-3.5 h-3.5" /> Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de citas por hora */}
        <div className="space-y-1">
          {horas.map((hora) => {
            const horaStr = String(hora).padStart(2, '0')
            const citaEnHora = citasOrdenadas.find((c: any) => {
              const cHora = c.time ? parseInt(c.time.split(':')[0], 10) : -1
              return cHora === hora
            })

            return (
              <div 
                key={hora} 
                className={`flex items-center gap-3 p-2 rounded-xl border transition-all hover:shadow-sm ${
                  citaEnHora 
                    ? 'bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 cursor-pointer hover:border-pink-300' 
                    : 'bg-transparent border-transparent hover:border-pink-100/30'
                }`}
                onClick={() => citaEnHora ? abrirDetalleCita(citaEnHora) : handleSlotClick(format(fechaSeleccionada, 'yyyy-MM-dd'), horaStr)}
              >
                <div className="w-16 text-xs font-mono font-bold text-stone-400 shrink-0">
                  {horaStr}:00
                </div>
                
                {citaEnHora ? (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 bg-gradient-to-br from-pink-500 to-rose-500`}>
                        {citaEnHora.clients?.name?.charAt(0) || 'C'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-stone-800 dark:text-pink-100 truncate">
                          {citaEnHora.clients?.name || 'Cliente'}
                        </p>
                        <p className="text-[10px] font-medium text-pink-500 truncate">
                          {citaEnHora.services?.name || 'Servicio'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-emerald-500">
                        ${Number(citaEnHora.services?.price || 0).toLocaleString()}
                      </span>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(citaEnHora.status).bg} ${getStatusBadge(citaEnHora.status).color}`}>
                        {getStatusBadge(citaEnHora.status).label}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 text-xs text-stone-300 dark:text-stone-600 italic font-light">
                    Sin turno
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER VISTA SEMANA
  // ============================================================
  const renderVistaSemana = () => {
    const weekStart = startOfWeek(fechaSeleccionada, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(fechaSeleccionada, { weekStartsOn: 1 }) })

    return (
      <div className="space-y-4">
        {/* Versión móvil: scroll horizontal */}
        <div className="block md:hidden overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            {weekDays.map((day) => {
              const citasDelDia = getCitasDelDia(day)
              const isSelected = isSameDay(day, fechaSeleccionada)
              const isTodayDate = isToday(day)

              return (
                <button
                  key={day.toString()}
                  onClick={() => setFechaSeleccionada(day)}
                  className={`flex flex-col items-center p-3 rounded-2xl border transition-all min-w-[70px] ${
                    isSelected 
                      ? 'text-white shadow-lg scale-105' 
                      : isTodayDate 
                        ? 'border-pink-500/30 bg-pink-500/5'
                        : 'bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950'
                  }`}
                  style={isSelected ? brandGradient : {}}
                >
                  <span className={`text-[8px] font-black uppercase tracking-wider ${
                    isSelected ? 'text-pink-100' : 'text-stone-400'
                  }`}>
                    {format(day, 'EEE', { locale: es })}
                  </span>
                  <span className={`text-lg font-black ${
                    isSelected ? 'text-white' : isTodayDate ? 'text-pink-500' : 'text-stone-800 dark:text-pink-100'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {citasDelDia.length > 0 && (
                    <span className={`text-[8px] font-mono font-bold mt-1 px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-pink-500/10 text-pink-500'
                    }`}>
                      {citasDelDia.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Versión desktop: grilla */}
        <div className="hidden md:block overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const citasDelDia = getCitasDelDia(day)
                const isSelected = isSameDay(day, fechaSeleccionada)
                const isTodayDate = isToday(day)

                return (
                  <div 
                    key={day.toString()}
                    onClick={() => setFechaSeleccionada(day)}
                    className={`rounded-2xl border p-3 transition-all cursor-pointer min-h-[200px] ${
                      isSelected 
                        ? 'border-pink-500/40 shadow-lg scale-[1.02]' 
                        : isTodayDate 
                          ? 'border-pink-500/20 bg-pink-500/5'
                          : 'border-pink-100/60 dark:border-fuchsia-950'
                    }`}
                    style={isSelected ? { borderColor: settings?.primary_color || '#DB5B9A' } : {}}
                  >
                    <div className={`flex items-center justify-between mb-2 ${
                      isSelected ? 'text-pink-500' : isTodayDate ? 'text-pink-500' : 'text-stone-400'
                    }`}>
                      <span className={`text-xs font-black uppercase ${
                        isSelected ? 'text-pink-500' : isTodayDate ? 'text-pink-500' : 'text-stone-500'
                      }`}>
                        {format(day, 'EEE', { locale: es })}
                      </span>
                      <span className={`text-lg font-black ${
                        isSelected ? 'text-pink-500' : isTodayDate ? 'text-pink-500' : 'text-stone-800 dark:text-pink-100'
                      }`}>
                        {format(day, 'd')}
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                      {citasDelDia.slice(0, 4).map((cita: any) => (
                        <div 
                          key={cita.id}
                          onClick={(e) => { e.stopPropagation(); abrirDetalleCita(cita) }}
                          className={`p-2 rounded-xl text-xs cursor-pointer transition-all hover:shadow-md ${
                            cita.status === 'blocked' 
                              ? 'bg-stone-100 dark:bg-stone-800/30 border border-stone-200 dark:border-stone-700' 
                              : 'bg-white dark:bg-[#0f0c1b] border border-pink-100/60 dark:border-fuchsia-950 hover:border-pink-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-stone-500 dark:text-stone-400">
                              {cita.time?.slice(0,5) || '--:--'}
                            </span>
                            {cita.status === 'blocked' && (
                              <Ban className="w-3 h-3 text-stone-400" />
                            )}
                          </div>
                          <p className={`font-bold truncate ${
                            cita.status === 'blocked' 
                              ? 'text-stone-400 dark:text-stone-500' 
                              : 'text-stone-800 dark:text-pink-100'
                          }`}>
                            {cita.status === 'blocked' ? 'Bloqueado' : cita.clients?.name || 'Cliente'}
                          </p>
                        </div>
                      ))}
                      {citasDelDia.length > 4 && (
                        <p className="text-[9px] text-stone-400 font-medium text-center">
                          +{citasDelDia.length - 4} más
                        </p>
                      )}
                      {citasDelDia.length === 0 && (
                        <p className="text-[10px] text-stone-300 dark:text-stone-600 text-center italic py-4">
                          Sin turnos
                        </p>
                      )}
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSlotClick(format(day, 'yyyy-MM-dd'), '11:00') }}
                      className="w-full mt-2 p-1 rounded-lg text-[8px] font-black uppercase tracking-wider border border-dashed border-pink-200 dark:border-fuchsia-800 text-pink-400 hover:bg-pink-50 dark:hover:bg-fuchsia-950/20 transition-all"
                    >
                      + Agregar
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Lista del día seleccionado (móvil y desktop) */}
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isToday(fechaSeleccionada) 
            ? 'bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-pink-500/20' 
            : 'bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950'
        }`}>
          <h4 className={`text-xs font-black uppercase tracking-wider mb-3 ${
            isToday(fechaSeleccionada) ? 'text-pink-500' : 'text-stone-500'
          }`}>
            {format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}
            {isToday(fechaSeleccionada) && ' ✦ Hoy'}
          </h4>
          {renderListaCitas(fechaSeleccionada)}
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER VISTA MES
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

    return (
      <div className="space-y-4">
        {/* Calendario en grid */}
        <div className="rounded-2xl overflow-hidden border shadow-sm bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 text-center font-mono font-black text-[9px] py-2.5 border-b bg-pink-50/30 dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950/50">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, idx) => (
              <span key={idx} className="text-stone-500 dark:text-stone-400">{d}</span>
            ))}
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
                  className={`p-1.5 md:p-2 min-h-[50px] md:min-h-[80px] flex flex-col justify-between cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-pink-500/10 dark:bg-fuchsia-950/30' 
                      : isTodayDate 
                        ? 'bg-pink-500/5 dark:bg-fuchsia-950/10'
                        : 'bg-white dark:bg-[#130f24]'
                  } hover:bg-pink-50 dark:hover:bg-fuchsia-950/20`}
                >
                  <span className={`text-xs font-mono font-black flex items-center justify-center rounded-lg w-6 h-6 ${
                    isSelected 
                      ? 'text-white' 
                      : isTodayDate 
                        ? 'border border-pink-500 text-pink-500' 
                        : 'text-stone-700 dark:text-pink-100'
                  }`} style={isSelected ? brandGradient : {}}>
                    {format(day, 'd')}
                  </span>

                  {citasDelDia.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                      {citasDelDia.slice(0, 3).map((cita: any, i: number) => (
                        <div 
                          key={i} 
                          className={`w-1.5 h-1.5 rounded-full ${
                            cita.status === 'blocked' 
                              ? 'bg-stone-400 dark:bg-stone-600' 
                              : 'bg-pink-500'
                          }`} 
                        />
                      ))}
                      {citasDelDia.length > 3 && (
                        <span className="text-[7px] font-mono text-stone-400 dark:text-stone-500">+{citasDelDia.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Lista del día seleccionado */}
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isToday(fechaSeleccionada) 
            ? 'bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-pink-500/20' 
            : 'bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950'
        }`}>
          <h4 className={`text-xs font-black uppercase tracking-wider mb-3 ${
            isToday(fechaSeleccionada) ? 'text-pink-500' : 'text-stone-500'
          }`}>
            {format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}
            {isToday(fechaSeleccionada) && ' ✦ Hoy'}
          </h4>
          {renderListaCitas(fechaSeleccionada)}
        </div>
      </div>
    )
  }

  // ============================================================
  // COMPONENTE: Lista de Citas (reutilizable)
  // ============================================================
  const renderListaCitas = (fecha: Date) => {
    const citasDelDia = getCitasDelDia(fecha)
    const citasOrdenadas = [...citasDelDia].sort((a: any, b: any) => (a.time || '').localeCompare(b.time || ''))

    if (citasOrdenadas.length === 0) {
      return (
        <div className="text-center py-6">
          <div className="text-stone-300 dark:text-stone-600 text-sm font-light">
            Sin turnos para este día
          </div>
          <button 
            onClick={() => handleSlotClick(format(fecha, 'yyyy-MM-dd'), '11:00')}
            className="mt-2 text-xs text-pink-500 hover:text-pink-600 font-medium transition-colors"
          >
            + Agregar turno
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {citasOrdenadas.map((cita: any) => {
          const statusInfo = getStatusBadge(cita.status)
          const isBlocked = cita.status === 'blocked'

          return (
            <div 
              key={cita.id} 
              onClick={() => !isBlocked && abrirDetalleCita(cita)}
              className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${
                isBlocked 
                  ? 'bg-stone-50 dark:bg-stone-900/30 border-stone-200 dark:border-stone-700 cursor-default opacity-70' 
                  : 'bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 cursor-pointer hover:border-pink-300 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                  isBlocked 
                    ? 'bg-stone-400' 
                    : 'bg-gradient-to-br from-pink-500 to-rose-500'
                }`}>
                  {isBlocked ? <Ban className="w-4 h-4" /> : cita.clients?.name?.charAt(0) || 'C'}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-bold truncate ${
                    isBlocked 
                      ? 'text-stone-400 dark:text-stone-500' 
                      : 'text-stone-800 dark:text-pink-100'
                  }`}>
                    {isBlocked ? 'Bloqueado' : cita.clients?.name || 'Cliente'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium truncate ${
                      isBlocked ? 'text-stone-400' : 'text-pink-500'
                    }`}>
                      {isBlocked ? 'Sin servicio' : cita.services?.name || 'Servicio'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
                    <span className="text-[10px] font-mono font-bold text-stone-400">
                      {cita.time?.slice(0,5) || '--:--'}
                    </span>
                  </div>
                </div>
              </div>

              {!isBlocked && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-bold text-emerald-500">
                    ${Number(cita.services?.price || 0).toLocaleString()}
                  </span>
                  <span className={`text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute w-48 h-48 bg-amber-500/5 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite] delay-300" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
            <CalendarIcon className="w-6 h-6 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-sm font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 animate-pulse">
              CARGANDO
            </p>
            <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              AGENDA FRESH
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span 
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-pink-500/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-6 p-1 max-w-full overflow-x-hidden">
      
      {/* ============================================================ */}
      {/* HEADER CON GRADIENTE */}
      {/* ============================================================ */}
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
                {isStaff ? 'Tus turnos asignados' : 'Gestión profesional de turnos'}
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

      {/* ============================================================ */}
      {/* MENSAJES DE ERROR/SUCCESS */}
      {/* ============================================================ */}
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

      {/* ============================================================ */}
      {/* KPIS MODERNOS */}
      {/* ============================================================ */}
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

      {/* ============================================================ */}
      {/* SELECTORES DE VISTA Y FECHAS */}
      {/* ============================================================ */}
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

      {/* ============================================================ */}
      {/* FILTRO DE STAFF (SOLO PARA ADMIN) */}
      {/* ============================================================ */}
      {!isStaff && staff.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 shadow-sm">
          <Users className="w-4 h-4 shrink-0" style={{ color: settings?.primary_color || '#DB5B9A' }} />
          <select
            value={filtroStaff}
            onChange={(e) => setFiltroStaff(e.target.value)}
            className="w-full bg-transparent outline-none text-sm font-medium text-stone-700 dark:text-pink-100 min-w-0"
          >
            <option value="todos">Todos los profesionales</option>
            {staff.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {filtroStaff !== 'todos' && (
            <button 
              onClick={() => setFiltroStaff('todos')}
              className="text-[10px] font-black uppercase tracking-wider text-pink-500 hover:text-pink-400 transition-colors"
            >
              ✕ Limpiar
            </button>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* VISTAS PRINCIPALES */}
      {/* ============================================================ */}
      <div className="w-full">
        {viewMode === 'day' && renderVistaDia()}
        {viewMode === 'week' && renderVistaSemana()}
        {viewMode === 'month' && renderVistaMes()}
      </div>

      {/* ============================================================ */}
      {/* MODAL: NUEVA CITA */}
      {/* ============================================================ */}
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
                  style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
                  required
                >
                  <option value="">Selecciona Clienta</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                  style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
                  required
                >
                  <option value="">Selecciona Servicio</option>
                  {services.map((s: any) => <option key={s.id} value={s.id}>{s.name} (${s.price})</option>)}
                </select>
              </div>

              {!isStaff && staff.length > 0 && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                    Profesional
                  </label>
                  <select
                    value={newCita.staffId}
                    onChange={(e) => setNewCita({...newCita, staffId: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm appearance-none"
                    style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
                  >
                    <option value="">Sin asignar</option>
                    {staff.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                    style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
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
                  style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
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

      {/* ============================================================ */}
      {/* MODAL: DETALLE DE CITA */}
      {/* ============================================================ */}
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
                  {status === 'pending' ? 'Pendiente' : status === 'confirmed' ? 'Confirmar' : 'Completar'}
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

      {/* ============================================================ */}
      {/* STYLES GLOBALES */}
      {/* ============================================================ */}
      <style jsx global>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>

    </div>
  )
}