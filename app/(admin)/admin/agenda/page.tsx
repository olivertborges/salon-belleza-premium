// app/(admin)/agenda/page.tsx
// @ts-nocheck
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Calendar, Clock, Sparkles, ChevronLeft, ChevronRight, 
  CheckCircle2, Play, Filter, DollarSign, Layers, Plus, Trash2, 
  X, Edit, FileText, Users, ChevronDown, Award, Ban, RefreshCw, 
  Loader2, Building2, CalendarDays, Check, TrendingUp, Save,
  Eye, EyeOff, Circle, Sun, Moon, Cloud, Search, User
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, startOfMonth, endOfMonth, getDaysInMonth, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import { TimePicker } from '@/components/TimePicker'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

type ViewMode = 'day' | 'week' | 'month'

export default function AdminAgendaPage() {
  const { settings } = useSettings()
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [citas, setCitas] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date())
  const [filtroStaff, setFiltroStaff] = useState<string>('todos')
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCita, setSelectedCita] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isStaff, setIsStaff] = useState(false)
  const [staffId, setStaffId] = useState<string | null>(null)
  
  // Nuevo estado para el modal premium de profesionales
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [searchStaff, setSearchStaff] = useState('')

  const [newCita, setNewCita] = useState({
    clientId: '',
    serviceId: '',
    staffId: '',
    date: '',
    time: '',
    notes: '',
  })

  // Detectar si el usuario es staff y bloquear accesos cruzados
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

  // Toast para nuevas citas
  const mostrarToastLlamativo = (nuevaCita: any) => {
    if (!nuevaCita || !nuevaCita.date || !nuevaCita.time) return

    const ID_TOAST = 'toast-nueva-cita'
    let toastExistente = document.getElementById(ID_TOAST)
    if (toastExistente) toastExistente.remove()

    const toast = document.createElement('div')
    toast.id = ID_TOAST
    toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:top-5 md:right-5 z-[9999] p-4 rounded-2xl shadow-2xl w-[92%] max-w-sm transition-all duration-300 border ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'} backdrop-blur-md`

    toast.innerHTML = `
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D4AF37]"></span>
          </span>
          <h4 class="text-[10px] font-mono font-black uppercase tracking-widest text-[#D4AF37]">¡Nuevo Turno!</h4>
        </div>
        <p class="text-xs ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'} leading-relaxed">
          Agendado para el <strong class="font-mono text-[#D4AF37]">${nuevaCita.date}</strong> a las <strong class="font-mono text-[#D4AF37]">${nuevaCita.time.slice(0,5)} hs</strong>.
        </p>
        <div class="flex justify-end gap-3 mt-1.5 border-t ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'} pt-2">
          <button id="btn-cerrar-toast" class="text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-[#A89588] hover:text-[#D4AF37]' : 'text-[#5C4A3E] hover:text-[#D4AF37]'} transition-colors py-1 px-2">Cerrar</button>
          <button id="btn-ir-toast" class="text-[10px] font-mono uppercase tracking-wider bg-[#D4AF37] text-[#1A0E0A] px-3 py-1 rounded-lg hover:bg-[#E8D5A0] transition-all font-bold">Ver Turno</button>
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
      toast.remove()
    })

    setTimeout(() => {
      if (document.body.contains(toast)) toast.remove()
    }, 12000)
  }

  // Sincronización e Ingesta de Datos
  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      let query = supabase.from('appointments').select('*')

      if (isStaff && staffId) {
        query = query.eq('professional_id', staffId)
      } else if (filtroStaff !== 'todos' && !isStaff) {
        query = query.eq('professional_id', filtroStaff)
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

      setCitas(citasConRelaciones)
      setStaff(staffRes.data || [])
      setServices(servicesRes.data || [])
      setClients(clientsRes.data || [])

    } catch (err: any) {
      console.error('Error al sincronizar datos:', err)
      setError(err.message || 'Error de conexión')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [fechaSeleccionada, filtroStaff, viewMode, isStaff, staffId])

  useEffect(() => {
    fetchData(false)

    const canalCitas = supabase
      .channel('cambios-agenda-admin-v5')
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments' }, () => fetchData(false))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'appointments' }, () => fetchData(false))
      .subscribe()

    return () => {
      supabase.removeChannel(canalCitas)
    }
  }, [fetchData])

  const cargarDatos = () => {
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
      pending: { label: 'Pendiente', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10 border-[#D4AF37]/25', icon: Clock },
      confirmed: { label: 'Confirmada', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/25', icon: CheckCircle2 },
      in_progress: { label: 'En curso', color: 'text-[#EC4899]', bg: 'bg-[#EC4899]/10 border-[#EC4899]/25', icon: Play },
      completed: { label: 'Completada', color: 'text-[#3B82F6]', bg: 'bg-[#3B82F6]/10 border-[#3B82F6]/25', icon: Award },
      cancelled: { label: 'Cancelada', color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/25', icon: X },
      blocked: { label: 'Bloqueado', color: 'text-stone-500', bg: 'bg-stone-500/10 border-stone-500/25', icon: Ban },
    }
    return config[status] || config.pending
  }

  const getCitasDelDia = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return citas.filter((c: any) => c.date === dateStr)
  }

  const stats = useMemo(() => {
    const totalIngresos = citas
      .filter((c: any) => c.status === 'completed')
      .reduce((sum: number, c: any) => sum + Number(c.services?.price || 0), 0)
    const citasPendientes = citas.filter((c: any) => c.status === 'pending').length
    const totalCitasVista = citas.filter((c: any) => c.status !== 'blocked' && c.status !== 'cancelled').length
    return { totalIngresos, citasPendientes, totalCitasVista }
  }, [citas])

  const abrirDetalleCita = (cita: any) => {
    setSelectedCita(cita)
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
      const selectedStaffId = isStaff && staffId ? staffId : newCita.staffId

      const appointmentData = {
        client_id: newCita.clientId,
        professional_id: selectedStaffId || null,
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
          setFormError(`⚠️ Conflicto de horario para el profesional en este horario.`)
          return
        }
        throw error
      }

      if (data && data.length > 0) {
        setCitas((prev: any[]) => [...prev, data[0]])
      }

      setShowNewAppointment(false)
      setNewCita({ clientId: '', serviceId: '', staffId: '', date: '', time: '', notes: '' })
      setSuccess('Cita agendada correctamente')
      setTimeout(() => setSuccess(null), 3000)
      await fetchData(false)
    } catch (err: any) {
      setFormError(err.message || 'Error al agendar el turno')
    }
  }

  const handleSlotClick = (dateStr: string, horaStr: string) => {
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

  // Filtrado de staff para el nuevo buscador del modal
  const filteredStaffList = useMemo(() => {
    return staff.filter(s => s.name?.toLowerCase().includes(searchStaff.toLowerCase()))
  }, [staff, searchStaff])

  const renderListaCitas = (fecha: Date) => {
    const citasDelDia = getCitasDelDia(fecha)
    const citasOrdenadas = [...citasDelDia].sort((a: any, b: any) => (a.time || '').localeCompare(b.time || ''))

    if (citasOrdenadas.length === 0) {
      return (
        <div className="text-center py-6">
          <div className={`text-sm font-light ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
            Sin turnos para este día
          </div>
          <button 
            onClick={() => handleSlotClick(format(fecha, 'yyyy-MM-dd'), '11:00')}
            className="mt-2 text-xs text-[#D4AF37] hover:text-[#E8D5A0] font-medium transition-colors"
          >
            + Agregar turno
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {citasOrdenadas.map((cita: any, index: number) => {
          const statusInfo = getStatusBadge(cita.status)
          const isBlocked = cita.status === 'blocked'
          const borderColor = index % 3 === 0 ? 'border-l-[#D4AF37]' : index % 3 === 1 ? 'border-l-[#EC4899]' : 'border-l-[#3B82F6]'

          return (
            <div 
              key={cita.id} 
              onClick={() => !isBlocked && abrirDetalleCita(cita)}
              className={`group flex items-center justify-between p-3 rounded-xl border-l-4 transition-all ${
                isBlocked 
                  ? isDark ? 'bg-[#1E120C] border-[#3D281E] opacity-70' : 'bg-[#FFF9F6] border-[#F0E4DA] opacity-70'
                  : isDark ? `bg-[#2A1B14] border-[#3D281E] ${borderColor} cursor-pointer hover:bg-[#3D281E]` 
                           : `bg-white border-[#F0E4DA] ${borderColor} cursor-pointer hover:bg-[#FFF9F6]`
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                  isBlocked ? 'bg-stone-400' : index % 3 === 0 ? 'bg-[#D4AF37]' : index % 3 === 1 ? 'bg-[#EC4899]' : 'bg-[#3B82F6]'
                }`}>
                  {isBlocked ? <Ban className="w-4 h-4" /> : cita.clients?.name?.charAt(0) || 'C'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium whitespace-normal break-words pr-2 ${
                    isBlocked ? isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]' : isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                  }`}>
                    {isBlocked ? 'Bloqueado' : cita.clients?.name || 'Cliente'}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className={`text-[10px] font-medium whitespace-normal break-words ${isBlocked ? isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]' : 'text-[#D4AF37]'}`}>
                      {isBlocked ? 'Sin servicio' : cita.services?.name || 'Servicio'}
                    </span>
                    <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-[#3D281E]' : 'bg-[#F0E4DA]'}`} />
                    <span className={`text-[10px] font-mono font-bold ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                      {cita.time?.slice(0,5) || '--:--'}
                    </span>
                  </div>
                </div>
              </div>
              {!isBlocked && (
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs font-mono font-bold text-[#D4AF37]">
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

  const renderVistaDia = () => {
    const citasDelDia = getCitasDelDia(fechaSeleccionada)
    const citasOrdenadas = [...citasDelDia].sort((a: any, b: any) => (a.time || '').localeCompare(b.time || ''))
    const franjas = [
      { nombre: '🌅 Mañana', horas: Array.from({ length: 5 }, (_, i) => i + 8) },
      { nombre: '☀️ Tarde', horas: Array.from({ length: 6 }, (_, i) => i + 13) },
    ]
    const getCitaEnHora = (hora: number) => {
      return citasOrdenadas.find((c: any) => {
        const cHora = c.time ? parseInt(c.time.split(':')[0], 10) : -1
        return cHora === hora
      })
    }

    return (
      <div className="space-y-4">
        <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${
          isToday(fechaSeleccionada) ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30' : isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl text-white shadow-md bg-[#D4AF37]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-xl font-serif font-light ${isToday(fechaSeleccionada) ? 'text-[#D4AF37]' : isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  {format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}
                </h3>
                <div className="flex items-center gap-3 mt-0.5">
                  {isToday(fechaSeleccionada) && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-1">
                      <Circle className="w-2 h-2 fill-current animate-pulse" /> Hoy
                    </span>
                  )}
                  <span className={`text-xs font-medium ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                    {citasOrdenadas.length} {citasOrdenadas.length === 1 ? 'turno' : 'turnos'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => handleSlotClick(format(fechaSeleccionada, 'yyyy-MM-dd'), '11:00')}
              className="px-4 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2 hover:scale-105 transition-all shadow-md bg-[#D4AF37] hover:bg-[#E8D5A0]"
            >
              <Plus className="w-4 h-4" /> Agregar Turno
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {franjas.map((franja) => (
            <div key={franja.nombre} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>{franja.nombre}</span>
                <div className={`flex-1 h-px ${isDark ? 'bg-[#3D281E]' : 'bg-[#F0E4DA]'}`} />
              </div>
              <div className="grid grid-cols-1 gap-3">
                {franja.horas.map((hora, index) => {
                  const cita = getCitaEnHora(hora)
                  const horaStr = String(hora).padStart(2, '0')
                  const isBlocked = cita?.status === 'blocked'
                  const statusInfo = getStatusBadge(cita?.status || 'pending')

                  // Paleta dinámica y limpia para las reservas en lugar de colores chillones e invasivos
                  const softBg = isDark 
                    ? index % 3 === 0 ? 'bg-[#2E251B] border-[#D4AF37]/30 hover:bg-[#382D20]' : index % 3 === 1 ? 'bg-[#2E1E26] border-[#EC4899]/30 hover:bg-[#38252E]' : 'bg-[#1E2633] border-[#3B82F6]/30 hover:bg-[#253042]'
                    : index % 3 === 0 ? 'bg-[#FCF9F2] border-[#D4AF37]/40 hover:bg-[#FAF2E3]' : index % 3 === 1 ? 'bg-[#FDF2F7] border-[#EC4899]/40 hover:bg-[#FBE5F0]' : 'bg-[#F2F7FF] border-[#3B82F6]/40 hover:bg-[#E5EFFF]'
                  
                  const activeLeftBorder = index % 3 === 0 ? 'border-l-[#D4AF37]' : index % 3 === 1 ? 'border-l-[#EC4899]' : 'border-l-[#3B82F6]'

                  return (
                    <div 
                      key={hora}
                      onClick={() => cita ? abrirDetalleCita(cita) : handleSlotClick(format(fechaSeleccionada, 'yyyy-MM-dd'), horaStr)}
                      className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                        cita 
                          ? isBlocked 
                            ? isDark ? 'bg-[#1E120C] border-[#3D281E] opacity-60' : 'bg-[#FFF9F6] border-[#F0E4DA] opacity-60'
                            : `${softBg} ${activeLeftBorder} border-l-4 cursor-pointer shadow-sm hover:shadow-md`
                          : isDark ? `bg-transparent border-dashed border-[#3D281E] hover:border-[#D4AF37]/20 hover:bg-[#2A1B14]/20` : `bg-transparent border-dashed border-[#F0E4DA] hover:border-[#D4AF37]/20 hover:bg-[#FFF9F6]/40`
                      }`}
                    >
                      {/* Línea de Hora a la izquierda */}
                      <div className="flex flex-col items-center justify-center shrink-0">
                        <span className={`text-sm font-mono font-black ${cita ? isDark ? 'text-white' : 'text-[#1A0E0A]' : isDark ? 'text-[#3D281E]' : 'text-[#C4B5A9]'}`}>
                          {horaStr}:00
                        </span>
                        <span className={`text-[9px] font-mono ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>
                          60 min
                        </span>
                      </div>

                      {/* Contenido principal de la Celda */}
                      {cita ? (
                        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2 min-w-0">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {!isBlocked ? (
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm ${
                                index % 3 === 0 ? 'bg-[#D4AF37]' : index % 3 === 1 ? 'bg-[#EC4899]' : 'bg-[#3B82F6]'
                              }`}>
                                {cita.clients?.name?.charAt(0) || 'C'}
                              </div>
                            ) : (
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-500 text-white shrink-0 shadow-sm">
                                <Ban className="w-4 h-4" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p className={`text-sm font-bold tracking-tight whitespace-normal break-words leading-tight ${
                                isBlocked ? isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]' : isDark ? 'text-white' : 'text-[#1A0E0A]'
                              }`}>
                                {isBlocked ? 'Bloqueo Administrativo' : cita.clients?.name || 'Cliente sin registrar'}
                              </p>
                              
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className={`text-xs font-semibold whitespace-normal break-words ${
                                  isBlocked ? isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]' : 'text-[#D4AF37]'
                                }`}>
                                  {isBlocked ? 'Horario reservado' : cita.services?.name || 'Servicio General'}
                                </span>
                                
                                {!isBlocked && cita.staff && (
                                  <>
                                    <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-[#4E392E]' : 'bg-[#EADED5]'}`} />
                                    <span className={`text-[11px] font-medium flex items-center gap-1 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                                      <User className="w-3 h-3 text-[#C9A96E]" /> {cita.staff.name}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Precios e indicadores del estado de la reserva */}
                          {!isBlocked && (
                            <div className="flex items-center md:flex-col md:items-end justify-between md:justify-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-black/5 dark:border-white/5">
                              <span className="text-sm font-mono font-black text-[#D4AF37]">
                                ${Number(cita.services?.price || 0).toLocaleString()}
                              </span>
                              <span className={`text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border shadow-xs ${statusInfo.bg} ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`flex-1 text-xs tracking-wide italic font-light py-1.5 transition-colors group-hover:text-[#D4AF37] ${isDark ? 'text-[#5C4A3E]' : 'text-[#C4B5A9]'}`}>
                          Espacio disponible — Clic para agendar cita rápida
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderVistaSemana = () => {
    const weekStart = startOfWeek(fechaSeleccionada, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(fechaSeleccionada, { weekStartsOn: 1 }) })

    return (
      <div className="space-y-4">
        <div className="md:hidden">
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const citasDelDia = getCitasDelDia(day)
              const isSelected = isSameDay(day, fechaSeleccionada)
              const isTodayDate = isToday(day)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setFechaSeleccionada(day)}
                  className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${
                    isSelected ? 'bg-[#D4AF37] text-[#1A0E0A] border-[#D4AF37]' : isTodayDate ? 'border-[#D4AF37]/30 bg-[#D4AF37]/10' : isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
                  }`}
                >
                  <span className={`text-[6px] font-black uppercase tracking-wider ${isSelected ? 'text-[#1A0E0A]/70' : isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>{format(day, 'EEE', { locale: es })}</span>
                  <span className={`text-sm font-black ${isSelected ? 'text-[#1A0E0A]' : isTodayDate ? 'text-[#D4AF37]' : isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{format(day, 'd')}</span>
                  {citasDelDia.length > 0 && (
                    <span className={`text-[6px] font-mono font-bold mt-0.5 px-1 py-0.5 rounded-full ${isSelected ? 'bg-[#1A0E0A]/20 text-[#1A0E0A]' : 'bg-[#D4AF37]/20 text-[#D4AF37]'}`}>{citasDelDia.length}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="hidden md:block">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const citasDelDia = getCitasDelDia(day)
              const isSelected = isSameDay(day, fechaSeleccionada)
              const isTodayDate = isToday(day)

              return (
                <div 
                  key={day.toISOString()}
                  onClick={() => setFechaSeleccionada(day)}
                  className={`rounded-2xl border p-2 transition-all cursor-pointer min-h-[180px] ${
                    isSelected ? 'border-[#D4AF37] shadow-lg scale-[1.02]' : isTodayDate ? 'border-[#D4AF37]/30 bg-[#D4AF37]/5' : isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
                  }`}
                >
                  <div className={`flex items-center justify-between mb-1.5 ${isSelected || isTodayDate ? 'text-[#D4AF37]' : isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                    <span className="text-[9px] font-black uppercase">{format(day, 'EEE', { locale: es })}</span>
                    <span className={`text-base font-black ${isSelected || isTodayDate ? 'text-[#D4AF37]' : isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{format(day, 'd')}</span>
                  </div>
                  <div className="space-y-1 max-h-[140px] overflow-y-auto">
                    {citasDelDia.slice(0, 3).map((cita: any) => (
                      <div 
                        key={cita.id}
                        onClick={(e) => { e.stopPropagation(); abrirDetalleCita(cita) }}
                        className={`p-1.5 rounded-lg text-[10px] cursor-pointer transition-all hover:shadow-md ${
                          cita.status === 'blocked' ? isDark ? 'bg-[#1E120C] border border-[#3D281E]' : 'bg-[#FFF9F6] border border-[#F0E4DA]' : isDark ? `bg-[#2A1B14] border border-[#3D281E] hover:border-[#D4AF37]/40` : `bg-white border border-[#F0E4DA] hover:border-[#D4AF37]/40`
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-mono font-bold ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>{cita.time?.slice(0,5) || '--:--'}</span>
                          {cita.status === 'blocked' && <Ban className="w-2.5 h-2.5 text-stone-400" />}
                        </div>
                        <p className={`font-medium whitespace-normal break-words text-[9px] ${cita.status === 'blocked' ? isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]' : isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{cita.status === 'blocked' ? 'Bloqueado' : cita.clients?.name || 'Cliente'}</p>
                      </div>
                    ))}
                    {citasDelDia.length > 3 && <p className={`text-[8px] font-medium text-center ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>+{citasDelDia.length - 3} más</p>}
                    {citasDelDia.length === 0 && <p className={`text-[9px] text-center italic py-2 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Sin turnos</p>}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleSlotClick(format(day, 'yyyy-MM-dd'), '11:00') }}
                    className={`w-full mt-1.5 p-0.5 rounded-lg text-[7px] font-black uppercase tracking-wider border border-dashed ${isDark ? 'border-[#3D281E] text-[#A89588] hover:bg-[#3D281E]/30' : 'border-[#F0E4DA] text-[#5C4A3E] hover:bg-[#F0E4DA]/30'}`}
                  >+ Agregar</button>
                </div>
              )
            })}
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${isToday(fechaSeleccionada) ? 'bg-[#D4AF37]/5 border-[#D4AF37]/30' : isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
          <h4 className={`text-xs font-black uppercase tracking-wider mb-3 ${isToday(fechaSeleccionada) ? 'text-[#D4AF37]' : isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
            {format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}{isToday(fechaSeleccionada) && ' ✦ Hoy'}
          </h4>
          {renderListaCitas(fechaSeleccionada)}
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

    return (
      <div className="space-y-4">
        <div className={`rounded-2xl overflow-hidden border shadow-sm ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
          <div className={`grid grid-cols-7 text-center font-mono font-black text-[9px] py-2.5 border-b ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'}`}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, idx) => (
              <span key={idx} className={idx % 3 === 0 ? 'text-[#D4AF37]' : idx % 3 === 1 ? 'text-[#EC4899]' : 'text-[#3B82F6]'}>{d}</span>
            ))}
          </div>
          <div className={`grid grid-cols-7 gap-px ${isDark ? 'bg-[#3D281E]' : 'bg-[#F0E4DA]'}`}>
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="bg-stone-50/10 min-h-[40px] md:min-h-[60px]" />
              const isSelected = isSameDay(day, fechaSeleccionada)
              const isTodayDate = isToday(day)
              const citasDelDia = getCitasDelDia(day)

              return (
                <div 
                  key={idx} 
                  onClick={() => setFechaSeleccionada(day)}
                  className={`p-1 md:p-1.5 min-h-[40px] md:min-h-[60px] flex flex-col justify-between cursor-pointer transition-all ${
                    isSelected ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/40' : isTodayDate ? 'bg-[#D4AF37]/10' : isDark ? 'bg-[#2A1B14]' : 'bg-white'
                  } hover:bg-[#D4AF37]/5`}
                >
                  <span className={`text-xs font-mono font-black flex items-center justify-center rounded-lg w-5 h-5 ${
                    isSelected ? 'bg-[#D4AF37] text-[#1A0E0A]' : isTodayDate ? 'border border-[#D4AF37] text-[#D4AF37]' : isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                  }`}>{format(day, 'd')}</span>
                  {citasDelDia.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-0.5 mt-0.5">
                      {citasDelDia.slice(0, 2).map((cita: any, i: number) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${cita.status === 'blocked' ? 'bg-stone-400' : i % 3 === 0 ? 'bg-[#D4AF37]' : i % 3 === 1 ? 'bg-[#EC4899]' : 'bg-[#3B82F6]'}`} />
                      ))}
                      {citasDelDia.length > 2 && <span className={`text-[6px] font-mono ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>+{citasDelDia.length - 2}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${isToday(fechaSeleccionada) ? 'bg-[#D4AF37]/5 border-[#D4AF37]/30' : isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
          <h4 className={`text-xs font-black uppercase tracking-wider mb-3 ${isToday(fechaSeleccionada) ? 'text-[#D4AF37]' : isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
            {format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}{isToday(fechaSeleccionada) && ' ✦ Hoy'}
          </h4>
          {renderListaCitas(fechaSeleccionada)}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-500 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
            <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
          </div>
          <p className={`text-[10px] tracking-[0.4em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]/60'}`}>Cargando agenda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-8 relative overflow-x-hidden ${isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'}`}>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-7xl mx-auto px-4 space-y-6 relative z-10 pt-4">

        {/* HERO BANNER - CON CONTENEDORES KPI */}
        <div className={`relative rounded-3xl border shadow-xl transition-all duration-300 ${
          isDark ? 'bg-gradient-to-br from-[#271810] via-[#1E120C] to-[#160E09] border-[#3D281E]' : 'bg-gradient-to-br from-white via-[#FBF7F4] to-[#F5ECE5] border-[#EADED5]'
        }`}>
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 p-6 md:p-8 space-y-6">
            
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <div className="p-3.5 rounded-2xl shadow-sm shrink-0 bg-[#D4AF37] text-white">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[10px] uppercase tracking-[0.25em] font-black text-[#D4AF37]">✦ {settings?.business_name || 'Salón VIP'}</p>
                  <h2 className={`font-serif text-2xl md:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                    Agenda Fresh Nails
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                    Control absoluto de disponibilidad, reservas activas y administración del flujo de trabajo diario.
                  </p>
                </div>
              </div>

              {/* Botones de Operación y Filtro Administrador */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                
                {/* BOTÓN REVISADO: Lanza el modal completo para seleccionar al profesional de forma limpia */}
                {!isStaff && staff.length > 0 && (
                  <button
                    onClick={() => { setSearchStaff(''); setShowStaffModal(true) }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                      isDark ? 'bg-[#150D08] border-[#3D281E] text-[#BCAEA5] hover:border-[#D4AF37]/50' : 'bg-white border-[#EADED5] text-[#6E5A4D] hover:border-[#D4AF37]/50'
                    }`}
                  >
                    <Users className="w-4 h-4 text-[#D4AF37]" />
                    <span>
                      {filtroStaff !== 'todos' 
                        ? `${staff.find((s: any) => s.id === filtroStaff)?.name || 'Profesional'}`
                        : 'Filtrar por Profesional'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-[#A89588]" />
                  </button>
                )}

                <button 
                  onClick={() => cargarDatos()} 
                  className={`px-3.5 py-2.5 rounded-xl border transition-all text-xs font-black uppercase tracking-[0.15em] flex items-center gap-2 ${
                    isDark ? 'bg-[#150D08] border-[#3D281E] text-[#BCAEA5] hover:text-white' : 'bg-white border-[#EADED5] text-[#6E5A4D] hover:text-[#1A0E0A]'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#C9A96E] ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Sincronizar</span>
                </button>

                <button 
                  onClick={() => handleSlotClick(format(fechaSeleccionada, 'yyyy-MM-dd'), '12:00')}
                  className="px-4 py-2.5 rounded-xl text-[#1A0E0A] text-xs font-black uppercase tracking-[0.15em] transition-all bg-[#D4AF37] hover:bg-[#E8D5A0] shadow-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Turno</span>
                </button>
              </div>
            </div>

            {/* Fila de Componentes KPI */}
            <div className={`grid grid-cols-3 gap-3 p-3 rounded-2xl border ${
              isDark ? 'bg-[#150D08]/60 border-[#3D281E]/70' : 'bg-[#FAF6F2]/60 border-[#EADED5]/70'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl text-white bg-[#D4AF37] shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[9px] font-black uppercase tracking-wider truncate ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>Turnos Vista</p>
                  <h3 className={`text-sm md:text-base font-extrabold truncate ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>{stats.totalCitasVista}</h3>
                </div>
              </div>

              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl text-white bg-[#EC4899] shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[9px] font-black uppercase tracking-wider truncate ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>En Espera</p>
                  <h3 className="text-sm md:text-base font-extrabold truncate text-[#EC4899]">{stats.citasPendientes}</h3>
                </div>
              </div>

              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl text-white bg-[#3B82F6] shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[9px] font-black uppercase tracking-wider truncate ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>Caja Cierre</p>
                  <h3 className="text-sm md:text-base font-extrabold truncate text-[#3B82F6]">${stats.totalIngresos.toLocaleString()}</h3>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* NOTIFICACIONES */}
        {error && (
          <div className={`flex items-start gap-4 border p-4 rounded-2xl text-rose-500 ${isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-200'}`}>
            <X className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-sm font-light">{error}</p>
          </div>
        )}
        {success && (
          <div className={`flex items-start gap-4 border p-4 rounded-2xl text-emerald-500 ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-sm font-light">{success}</p>
          </div>
        )}

        {/* NAVEGACIÓN Y SELECTOR DE VISTA VISTA CENTRADO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className={`flex w-full sm:w-auto justify-center border rounded-xl p-1 shadow-sm ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'}`}>
            {(['day', 'week', 'month'] as const).map((mode, idx) => (
              <button 
                key={mode} 
                onClick={() => setViewMode(mode)} 
                className={`flex-1 sm:flex-initial text-center px-6 py-2 rounded-lg text-xs font-mono uppercase font-black tracking-wider transition-all duration-200 ${
                  viewMode === mode 
                    ? `text-white shadow-md ${idx % 3 === 0 ? 'bg-[#D4AF37]' : idx % 3 === 1 ? 'bg-[#EC4899]' : 'bg-[#3B82F6]'}` 
                    : isDark ? 'text-[#A89588] hover:text-[#FFF9F6]' : 'text-[#5C4A3E] hover:text-[#1A0E0A]'
                }`}
              >
                {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>

          <div className={`flex items-center justify-between border rounded-xl px-2 py-1 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <button onClick={() => cambiarDia(-1)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#FFF9F6]'}`}>
              <ChevronLeft className="w-4 h-4 text-[#D4AF37]" />
            </button>
            <span className={`text-xs font-serif font-extrabold px-4 capitalize ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
              {formatFechaTitulo()}
            </span>
            <button onClick={() => cambiarDia(1)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#FFF9F6]'}`}>
              <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </div>
        </div>

        {/* COMPONENTE PRINCIPAL DE AGENDAS */}
        <div className="w-full">
          {viewMode === 'day' && renderVistaDia()}
          {viewMode === 'week' && renderVistaSemana()}
          {viewMode === 'month' && renderVistaMes()}
        </div>

        {/* MODAL REMODELADO: FILTRO DE PROFESIONALES PREMIUM */}
        {showStaffModal && !isStaff && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all">
            <div className={`relative w-full max-w-lg rounded-3xl shadow-2xl border p-6 flex flex-col max-h-[85vh] transition-all duration-300 transform scale-100 ${
              isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
            }`}>
              
              {/* Botón de Cierre */}
              <button 
                onClick={() => setShowStaffModal(false)} 
                className={`absolute top-5 right-5 p-2 rounded-xl transition-colors ${
                  isDark ? 'text-[#A89588] hover:text-white hover:bg-[#3D281E]' : 'text-[#5C4A3E] hover:text-[#1A0E0A] hover:bg-[#F0E4DA]'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Cabecera del Modal */}
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl text-white shadow-md bg-[#D4AF37]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-xl font-serif font-extrabold ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>Seleccionar Agenda</h3>
                  <p className={`text-xs ${isDark ? 'text-[#A89588]' : 'text-[#7C6A5E]'}`}>Elige de qué especialista deseas visualizar el flujo de trabajo.</p>
                </div>
              </div>

              {/* Input buscador interno */}
              <div className="relative mb-4">
                <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-[#5C4A3E]' : 'text-[#C4B5A9]'}`} />
                <input
                  type="text"
                  placeholder="Buscar profesional..."
                  value={searchStaff}
                  onChange={(e) => setSearchStaff(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 ${
                    isDark ? 'bg-[#1E120C] border-[#3D281E] text-white' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A]'
                  }`}
                />
              </div>

              {/* Lista Scrolleable de Tarjetas */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[45vh]">
                
                {/* Opción global "Todas las Agendas" */}
                {searchStaff === '' && (
                  <div
                    onClick={() => { setFiltroStaff('todos'); setShowStaffModal(false) }}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      filtroStaff === 'todos'
                        ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]'
                        : isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#BCAEA5] hover:bg-[#3D281E]/40' : 'bg-[#FFF9F6] border-[#EADED5] text-[#6E5A4D] hover:bg-[#FFF9F6]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#D4AF37] text-[#1A0E0A] flex items-center justify-center font-black text-xs">ALL</div>
                      <div>
                        <p className="text-xs font-black tracking-wide">Todas las Agendas</p>
                        <p className={`text-[10px] ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>Vista unificada del salón entero</p>
                      </div>
                    </div>
                    {filtroStaff === 'todos' && <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />}
                  </div>
                )}

                {/* Mapeo de Profesionales Filtrados */}
                {filteredStaffList.length > 0 ? (
                  filteredStaffList.map((s: any, idx: number) => {
                    const isSelected = filtroStaff === s.id
                    const colorIndicator = idx % 3 === 0 ? 'bg-[#D4AF37]' : idx % 3 === 1 ? 'bg-[#EC4899]' : 'bg-[#3B82F6]'
                    
                    return (
                      <div
                        key={s.id}
                        onClick={() => { setFiltroStaff(s.id); setShowStaffModal(false) }}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#D4AF37]/10 border-[#D4AF37]'
                            : isDark ? 'bg-[#1E120C] border-[#3D281E] hover:bg-[#3D281E]/40' : 'bg-white border-[#EADED5] hover:bg-[#FFF9F6]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-full ${colorIndicator} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}>
                            {s.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#D4AF37]' : isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                              {s.name}
                            </p>
                            <p className={`text-[10px] truncate ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>
                              {s.specialty || 'Especialista Fresh Nails'}
                            </p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />}
                      </div>
                    )
                  })
                ) : (
                  <div className={`text-center py-8 text-xs italic ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>
                    No se encontraron profesionales con ese nombre.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: REGISTRO DE TURNOS */}
        {showNewAppointment && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`relative w-full max-w-md rounded-2xl shadow-2xl border p-6 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
              <button onClick={() => setShowNewAppointment(false)} className={`absolute top-4 right-4 p-2 rounded-xl transition-colors ${isDark ? 'text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E]' : 'text-[#5C4A3E] hover:text-[#1A0E0A] hover:bg-[#F0E4DA]'}`}>
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl text-white shadow-md bg-[#D4AF37]"><Plus className="w-5 h-5" /></div>
                <h3 className={`text-xl font-serif font-light ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>Nuevo Turno</h3>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleAgendarCita() }} className="space-y-4">
                <div>
                  <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Clienta *</label>
                  <select
                    value={newCita.clientId}
                    onChange={(e) => setNewCita({...newCita, clientId: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A]'}`}
                    required
                  >
                    <option value="">Selecciona Clienta</option>
                    {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Servicio *</label>
                  <select
                    value={newCita.serviceId}
                    onChange={(e) => setNewCita({...newCita, serviceId: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A]'}`}
                    required
                  >
                    <option value="">Selecciona Servicio</option>
                    {services.map((s: any) => <option key={s.id} value={s.id}>{s.name} (${s.price})</option>)}
                  </select>
                </div>

                {!isStaff && staff.length > 0 && (
                  <div>
                    <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Profesional</label>
                    <select
                      value={newCita.staffId}
                      onChange={(e) => setNewCita({...newCita, staffId: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A]'}`}
                    >
                      <option value="">Sin asignar</option>
                      {staff.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Fecha *</label>
                    <input
                      type="date"
                      value={newCita.date}
                      onChange={(e) => setNewCita({...newCita, date: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A]'}`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Hora *</label>
                    <TimePicker value={newCita.time} onChange={(time) => setNewCita({...newCita, time})} />
                  </div>
                </div>

                <div>
                  <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Notas</label>
                  <textarea
                    value={newCita.notes}
                    onChange={(e) => setNewCita({...newCita, notes: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 resize-none ${isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A]'}`}
                    rows={2}
                  />
                </div>

                {formError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">{formError}</div>}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowNewAppointment(false)} className={`flex-1 px-4 py-2.5 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest ${isDark ? 'border-[#3D281E] text-[#A89588] hover:bg-[#3D281E]' : 'border-[#F0E4DA] text-[#5C4A3E] hover:bg-[#F0E4DA]'}`}>Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl text-white hover:scale-105 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#E8D5A0]"><Save className="w-4 h-4" />Agendar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ACCIONES Y DETALLE */}
        {showDetailModal && selectedCita && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`relative w-full max-w-md rounded-2xl shadow-2xl border p-6 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
              <button onClick={() => setShowDetailModal(false)} className={`absolute top-4 right-4 p-2 rounded-xl transition-colors ${isDark ? 'text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E]' : 'text-[#5C4A3E] hover:text-[#1A0E0A] hover:bg-[#F0E4DA]'}`}>
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl text-white shadow-md bg-[#D4AF37]"><FileText className="w-5 h-5" /></div>
                <h3 className={`text-xl font-serif font-light ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>Detalle de Cita</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className={`flex justify-between py-2 border-b ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`}>
                  <span className={isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}>Clienta</span>
                  <span className={`font-bold whitespace-normal break-words text-right max-w-[70%] ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{selectedCita.clients?.name || 'No asignado'}</span>
                </div>
                <div className={`flex justify-between py-2 border-b ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`}>
                  <span className={isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}>Servicio</span>
                  <span className={`font-bold whitespace-normal break-words text-right max-w-[70%] ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{selectedCita.services?.name || 'No asignado'}</span>
                </div>
                <div className={`flex justify-between py-2 border-b ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`}>
                  <span className={isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}>Profesional</span>
                  <span className={`font-bold whitespace-normal break-words text-right max-w-[70%] ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{selectedCita.staff?.name || 'Sin asignar'}</span>
                </div>
                <div className={`flex justify-between py-2 border-b ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`}>
                  <span className={isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}>Fecha</span>
                  <span className={`font-bold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{selectedCita.date}</span>
                </div>
                <div className={`flex justify-between py-2 border-b ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`}>
                  <span className={isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}>Hora</span>
                  <span className={`font-bold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{selectedCita.time?.substring(0,5)} hs</span>
                </div>
                <div className={`flex justify-between py-2 border-b ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`}>
                  <span className={isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}>Estado</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${getStatusBadge(selectedCita.status).color}`}>
                    {getStatusBadge(selectedCita.status).label}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className={isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}>Total</span>
                  <span className="font-bold text-[#D4AF37]">${Number(selectedCita.total_price || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 mt-4">
                {['pending', 'confirmed', 'completed'].map((status, idx) => (
                  <button
                    key={status}
                    onClick={() => cambiarEstadoCita(selectedCita.id, status as any)}
                    className={`p-2 text-[10px] font-mono uppercase font-bold rounded-xl border transition-all ${
                      selectedCita.status === status 
                        ? `text-white border-transparent ${idx % 3 === 0 ? 'bg-[#D4AF37]' : idx % 3 === 1 ? 'bg-[#EC4899]' : 'bg-[#3B82F6]'}` 
                        : isDark ? 'border-[#3D281E] text-[#A89588] hover:bg-[#3D281E]' : 'border-[#F0E4DA] text-[#5C4A3E] hover:bg-[#F0E4DA]'
                    }`}
                  >
                    {status === 'pending' ? 'Pendiente' : status === 'confirmed' ? 'Confirmar' : 'Completar'}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => { if(confirm('¿Eliminar esta cita?')) eliminarCita(selectedCita.id) }} 
                className="w-full mt-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all text-xs font-mono uppercase font-bold"
              >
                <Trash2 className="w-3.5 h-3.5 inline mr-2" />Eliminar Turno
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
