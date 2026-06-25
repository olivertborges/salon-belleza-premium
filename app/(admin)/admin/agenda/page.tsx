'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar as CalendarIcon, Clock, User, Sparkles, 
  ChevronLeft, ChevronRight, CheckCircle2, 
  Play, Filter, DollarSign, Layers, Plus, Trash2, 
  X, CalendarDays, CalendarRange, Calendar
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'

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
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [esBloqueo, setEsBloqueo] = useState(false)

  const [newCita, setNewCita] = useState({
    clientId: '',
    serviceId: '',
    staffId: '',
    date: '',
    time: '',
    notes: '',
  })

  // Generamos las horas en formato estándar "HH:MM"
  const horasDelDia = Array.from({ length: 12 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`)


  const mostrarToastLlamativo = (nuevaCita: any) => {
    // Evitar duplicados si entran varias cosas
    const ID_TOAST = 'toast-nueva-cita';
    let toastExistente = document.getElementById(ID_TOAST);
    if (toastExistente) toastExistente.remove();

    // Crear el contenedor
    const toast = document.createElement('div');
    toast.id = ID_TOAST;
    // Estilos premium flotantes en la esquina superior derecha con Tailwind
    toast.className = "fixed top-5 right-5 z-[9999] bg-[#0e0c0b] border-2 border-amber-500 text-white p-4 rounded-2xl shadow-2xl shadow-amber-500/20 max-w-sm animate-[bounce_1s_ease-in-out_2] transition-all duration-300";
    
    toast.innerHTML = `
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">¡Nueva Cita Recibida!</h4>
        </div>
        <p class="text-xs text-stone-300">Una clienta se acaba de agendar para el día <span class="font-bold text-white">${nuevaCita.date}</span> a las <span class="font-bold text-white">${nuevaCita.time.slice(0,5)}</span>.</p>
        <div class="flex justify-end gap-2 mt-1">
          <button id="btn-cerrar-toast" class="text-[10px] font-mono uppercase px-2 py-1 text-stone-400 hover:text-white transition-colors">Cerrar</button>
          <button id="btn-ir-toast" class="text-[10px] font-mono uppercase bg-amber-500 text-black px-2.5 py-1 rounded font-bold hover:bg-amber-400 transition-all shadow-md shadow-amber-500/10">Revisar Ahora</button>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    // Acción del botón "Cerrar"
    document.getElementById('btn-cerrar-toast')?.addEventListener('click', () => toast.remove());

    // Acción del botón "Revisar Ahora" (viaja a la fecha exacta de la cita)
    document.getElementById('btn-ir-toast')?.addEventListener('click', () => {
      if (nuevaCita.date) {
        const fechaCita = new Date(nuevaCita.date.replace(/-/g, '\/'));
        setFechaSeleccionada(fechaCita);
      }
      setViewMode('day');
      setFiltroStaff('todos');
      toast.remove();
    });

    // Se autodestruye a los 10 segundos si no haces clic
    setTimeout(() => {
      if (document.body.contains(toast)) toast.remove();
    }, 10000);
  };
// ============================================
  // CARGAR DATOS DESDE SUPABASE + TIEMPO REAL
  // ============================================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        let query = supabase
          .from('appointments')
          .select(`
            *,
            clients:client_id (id, name, email, phone),
            services:service_id (id, name, price, duration),
            staff:professional_id (id, name)
          `)

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
          supabase.from('professionals').select('*').eq('is_active', true),
          supabase.from('services').select('*').eq('is_active', true),
          supabase.from('clients').select('*')
        ])

        setCitas(citasData || [])
        setStaff(staffRes.data || [])
        setServices(servicesRes.data || [])
        setClients(clientsRes.data || [])

      } catch (err: any) {
        console.error('❌ Error general de carga:', err)
        setError(err.message || 'Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // ESCUCHAR EN TIEMPO REAL INSERCIONES Y CAMBIOS

const canalCitas = supabase
      .channel('cambios-agenda-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          // 👇 PEGA ESTA LÍNEA DEBAJO PARA ASOMARNOS A VER QUÉ ENVIÓ SUPABASE
          console.log("👉 ¡EL REALTIME DETECTÓ ALGO! Aquí está el paquete:", payload);

          if (payload.eventType === 'INSERT') {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav')
            audio.volume = 0.4
            audio.play().catch(e => console.log("Audio bloqueado"))
            
            mostrarToastLlamativo(payload.new)
          }

          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canalCitas)
    }
  }, [fechaSeleccionada, filtroStaff, viewMode])

  const cambiarEstadoCita = async (id: string, nuevoEstado: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: nuevoEstado })
        .eq('id', id)

      if (error) throw error
      setCitas(prev => prev.map(c => c.id === id ? { ...c, status: nuevoEstado } : c))
    } catch (err) {
      console.error('Error actualizando estado de la cita:', err)
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
    } catch (err) {
      console.error('Error eliminando cita:', err)
    }
  }

  const handleAgendarCita = async () => {
    if (!newCita.clientId || !newCita.serviceId || !newCita.date || !newCita.time) {
      alert('Por favor completa todos los campos obligatorios')
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
        .select(`
          *,
          clients:client_id (id, name, email, phone),
          services:service_id (id, name, price, duration),
          staff:professional_id (id, name)
        `)

      if (error) throw error

      if (data && data.length > 0) {
        setCitas(prev => [...prev, data[0]])
      }
      
      setShowNewAppointment(false)
      setNewCita({ clientId: '', serviceId: '', staffId: '', date: '', time: '', notes: '' })
    } catch (err) {
      console.error('Error agendando cita:', err)
      alert('Error al agendar la cita')
    }
  }

  // 👇 PEGA LA NUEVA FUNCIÓN AQUÍ ABAJO
  const bloquearHorarioProfesional = async () => {
    if (!newCita.date || !newCita.time || !newCita.staffId) {
      alert('Por favor selecciona Fecha, Hora y el Profesional a bloquear')
      return
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            client_id: null,
            professional_id: newCita.staffId,
            service_id: null,
            date: newCita.date,
            time: newCita.time.includes(':00') ? newCita.time : `${newCita.time}:00`,
            status: 'blocked',
            notes: newCita.notes || 'Bloqueo administrativo (Descanso/Médico)',
            total_price: 0
          }
        ])
        .select(`
          *,
          clients:client_id (id, name, email, phone),
          services:service_id (id, name, price, duration),
          staff:professional_id (id, name)
        `)

      if (error) throw error

      if (data && data.length > 0) {
        setCitas(prev => [...prev, data[0]])
      }
      
      setShowNewAppointment(false)
      setEsBloqueo(false) // Reseteamos el modo
      setNewCita({ clientId: '', serviceId: '', staffId: '', date: '', time: '', notes: '' })
      alert("Horario bloqueado correctamente.")
    } catch (err) {
      console.error('Error al bloquear:', err)
      alert('Error al guardar el bloqueo')
    }
  }

  const cambiarDia = (offset: number) => {
    const d = new Date(fechaSeleccionada)
    if (viewMode === 'day') d.setDate(d.getDate() + offset)
    else if (viewMode === 'week') d.setDate(d.getDate() + (offset * 7))
    else if (viewMode === 'month') d.setMonth(d.getMonth() + offset)
    setFechaSeleccionada(d)
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string, color: string }> = {
      pending: { label: 'Pendiente', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
      confirmed: { label: 'Confirmada', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
      in_progress: { label: 'En proceso', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
      completed: { label: 'Completada', color: 'bg-stone-500/10 border-stone-500/20 text-stone-400' },
      cancelled: { label: 'Cancelada', color: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
      blocked: { label: 'Bloqueado', color: 'bg-stone-800/50 border-stone-700/40 text-amber-500/80' },
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

  const formatFechaTitulo = () => {
    if (viewMode === 'day') return format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })
    if (viewMode === 'week') {
      const start = startOfWeek(fechaSeleccionada, { weekStartsOn: 1 })
      const end = endOfWeek(fechaSeleccionada, { weekStartsOn: 1 })
      return `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM yyyy', { locale: es })}`
    }
    return format(fechaSeleccionada, 'MMMM yyyy', { locale: es })
  }

// ============================================
// VISTA DÍA CORREGIDA (REEMPLAZAR EN TU ARCHIVO)
// ============================================
const renderVistaDia = () => {
  const citasDelDia = citas.filter(c => c.date === format(fechaSeleccionada, 'yyyy-MM-dd'))

  if (citasDelDia.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-stone-900 rounded-xl space-y-2">
        <Sparkles className="w-6 h-6 text-stone-600 mx-auto" />
        <p className="text-xs text-stone-400 font-mono">No hay citas para este día</p>
        <button 
          onClick={() => setShowNewAppointment(true)}
          className="text-cyan-400 hover:text-cyan-300 text-xs font-medium transition-colors"
        >
          Agendar nueva cita →
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-mono text-stone-500 mb-2 uppercase tracking-wider">
        Cronograma de citas para hoy ({citasDelDia.length})
      </p>
      
      {citasDelDia.map((cita) => {
        const statusInfo = getStatusBadge(cita.status)
        const isPending = cita.status === 'pending'
        const isProcessing = cita.status === 'in_progress'
        const isCompleted = cita.status === 'completed'

        let cardBg = 'bg-stone-900/30 border-stone-800/60'
        if (isProcessing) cardBg = 'bg-amber-950/20 border-amber-500/30'
        if (isCompleted) cardBg = 'bg-emerald-950/10 border-emerald-500/20 opacity-70'

        // Formatear la hora de forma segura para mostrarla visualmente
        const horaMostrar = cita.time ? cita.time.substring(0, 5) : '--:--'

        return (
          <div key={cita.id} className="flex items-start gap-3 md:gap-4">
            {/* Eje del tiempo / Hora al lado izquierdo */}
            <div className="w-14 md:w-16 flex-shrink-0 pt-3 text-right">
              <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider">
                {horaMostrar}
              </span>
            </div>
            
            {/* Línea divisoria vertical */}
            <div className="w-px bg-stone-800 self-stretch flex-shrink-0 relative">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-stone-700 border border-stone-950" />
            </div>

            {/* Tarjeta de la Cita */}
            <div className={`flex-1 border rounded-xl p-3 md:p-4 transition-all ${cardBg}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-800 border border-stone-700/50 flex items-center justify-center text-cyan-400 font-mono text-[10px] flex-shrink-0">
                    {horaMostrar}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{cita.clients?.name || 'Cliente'}</h4>
                    <p className="text-[11px] text-stone-400 truncate">{cita.services?.name || 'Servicio'}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[10px] text-stone-500 flex items-center gap-1">
                        <User className="w-3 h-3" /> {cita.staff?.name || 'Sin asignar'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    {cita.notes && (
                      <p className="text-[10px] text-stone-500 italic mt-1.5 border-l border-stone-800 pl-2">
                        "{cita.notes}"
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Botones de acción rápidos */}
                <div className="flex flex-wrap items-center gap-1 self-end sm:self-center">
                  <span className="text-xs font-mono font-bold text-emerald-400 mr-2">
                    ${Number(cita.services?.price || 0).toLocaleString()}
                  </span>
                  {isPending && (
                    <button onClick={() => cambiarEstadoCita(cita.id, 'confirmed')} className="text-[9px] px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all whitespace-nowrap">
                      Confirmar
                    </button>
                  )}
                  {(isPending || cita.status === 'confirmed') && (
                    <button onClick={() => cambiarEstadoCita(cita.id, 'in_progress')} className="text-[9px] px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all whitespace-nowrap">
                      Iniciar
                    </button>
                  )}
                  {isProcessing && (
                    <button onClick={() => cambiarEstadoCita(cita.id, 'completed')} className="text-[9px] px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all whitespace-nowrap">
                      Completar
                    </button>
                  )}
                  {!isCompleted && cita.status !== 'cancelled' && (
                    <button onClick={() => eliminarCita(cita.id)} className="text-[9px] p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// VISTA SEMANA TIPO GOOGLE CALENDAR (24 HORAS)
// ============================================
const renderVistaSemana = () => {
  const weekStart = startOfWeek(fechaSeleccionada, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(fechaSeleccionada, { weekStartsOn: 1 }) })

  // Definimos el rango visible de horas en la cuadrícula (Formato 24h estricto: de 09:00 a 20:00)
  const horaInicioNum = 9
  const horaFinNum = 20
  const totalHoras = horaFinNum - horaInicioNum + 1
  const horasCuadricula = Array.from({ length: totalHoras }, (_, i) => i + horaInicioNum)

  // Altura fija en píxeles por cada hora de la cuadrícula
  const HORA_HEIGHT_PX = 65 

  // Helper para normalizar cualquier string de hora de la BD a formato "HH:MM" de 24h
  const limpiarHora24h = (timeStr: string | null) => {
    if (!timeStr) return '--:--'
    const parts = timeStr.split(':')
    if (parts.length < 2) return '--:--'
    return `${parts[0].padStart(2, '0')}:${parts[1].substring(0, 2)}`
  }

  return (
    <div className="overflow-x-auto select-none border border-stone-900 rounded-xl">
      {/* Contenedor principal con un ancho mínimo para habilitar scroll lateral suave en móviles */}
      <div className="min-w-[850px] flex flex-col font-sans bg-[#0e0c0b]">
        
        {/* ENCABEZADO SUPERIOR: DÍAS DE LA SEMANA */}
        <div className="flex border-b border-stone-900 bg-stone-950/80 sticky top-0 z-20 backdrop-blur-md">
          {/* Espacio para alinear con la columna vertical de horas */}
          <div className="w-16 flex-shrink-0 border-r border-stone-900 bg-stone-950/40" />
          
          {/* Grid de 7 columnas para los días */}
          <div className="flex-1 grid grid-cols-7">
            {weekDays.map((day) => {
              const isTodayDate = isToday(day)
              return (
                <div 
                  key={day.toString()} 
                  className={`text-center py-2.5 border-r border-stone-900/60 last:border-r-0 flex flex-col items-center justify-center ${
                    isTodayDate ? 'bg-cyan-500/[0.04]' : ''
                  }`}
                >
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${isTodayDate ? 'text-cyan-400 font-bold' : 'text-stone-500'}`}>
                    {format(day, 'EEE', { locale: es })}
                  </span>
                  <p className={`text-base font-mono font-bold mt-0.5 rounded-full w-7 h-7 flex items-center justify-center ${
                    isTodayDate ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20' : 'text-stone-200'
                  }`}>
                    {format(day, 'd')}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* CUADRÍCULA CUERPO: RELOJ HORIZONTAL Y COLUMNAS RECTANGULARES */}
        <div className="flex relative">
          
          {/* COLUMNA VERTICAL IZQUIERDA: HORAS DE GUÍA (EJE Y) */}
          <div className="w-16 flex-shrink-0 border-r border-stone-900 bg-stone-950/30 text-right pr-2.5">
            {horasCuadricula.map((hora) => (
              <div 
                key={hora} 
                className="text-[10px] font-mono text-stone-500 font-medium flex items-start justify-end pt-1"
                style={{ height: `${HORA_HEIGHT_PX}px` }}
              >
                {String(hora).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* ÁREA DE CONTENIDO: REJILLA DE FONDO + TARJETAS DE CITAS */}
          <div className="flex-1 grid grid-cols-7 relative">
            
            {/* Líneas sutiles horizontales de fondo (Líneas de las horas) */}
            <div className="absolute inset-0 pointer-events-none flex flex-col z-0">
              {horasCuadricula.map((hora) => (
                <div 
                  key={`line-${hora}`} 
                  className="border-b border-stone-900/40 w-full" 
                  style={{ height: `${HORA_HEIGHT_PX}px` }}
                />
              ))}
            </div>

            {/* COLUMNAS INTERNAS (UNA POR CADA DÍA DE LA SEMANA) */}
            {weekDays.map((day) => {
              const citasDelDia = getCitasDelDia(day)
              const isTodayDate = isToday(day)

              return (
                <div 
                  key={`col-${day}`} 
                  className={`relative border-r border-stone-900/60 last:border-r-0 min-h-full z-10 ${
                    isTodayDate ? 'bg-cyan-500/[0.01]' : ''
                  }`}
                  style={{ height: `${totalHoras * HORA_HEIGHT_PX}px` }}
                >
                  {citasDelDia.map((cita) => {
                    if (!cita.time) return null

                    // Forzar limpieza y lectura en base 24h
                    const horaFormateada = limpiarHora24h(cita.time)
                    const [hStr, mStr] = horaFormateada.split(':')
                    const horaCita = parseInt(hStr, 10)
                    const minCita = parseInt(mStr, 10) || 0
                    
                    // Si cae fuera de las horas visibles de la cuadrícula, la descartamos de la vista
                    if (horaCita < horaInicioNum || horaCita > horaFinNum) return null

                    // Duración por defecto (en minutos): Si no viene de la BD se asume 1 hora (60 mins)
                    const duracionMinutos = cita.services?.duration || 60

                    // Calcular la posición 'top' píxel por píxel basados en la hora y minutos
                    const minutosDesdeInicio = ((horaCita - horaInicioNum) * 60) + minCita
                    const topPx = (minutosDesdeInicio / 60) * HORA_HEIGHT_PX

                    // Calcular la altura proporcional a la duración del servicio
                    const heightPx = (duracionMinutos / 60) * HORA_HEIGHT_PX

                    const statusInfo = getStatusBadge(cita.status)
                    const isProcessing = cita.status === 'in_progress'
                    const isCompleted = cita.status === 'completed'

                    // Estilos visuales dinámicos de la tarjeta según el estado actual
                    let cardBgColor = 'bg-stone-900/90 border-stone-800 text-stone-200'
                    if (isProcessing) cardBgColor = 'bg-amber-950/85 border-amber-500/40 text-amber-200 shadow-md shadow-amber-500/5'
                    if (isCompleted) cardBgColor = 'bg-emerald-950/30 border-emerald-500/20 text-stone-500 opacity-60'
                    if (cita.status === 'blocked') cardBgColor = 'bg-stone-950/90 border-dashed border-stone-800 text-stone-500 opacity-70 strip-bg'
                    return (
                      <div
                        key={cita.id}
                        className={`absolute left-1 right-1 rounded-xl border p-1.5 overflow-hidden transition-all hover:z-30 hover:scale-[1.01] hover:shadow-xl shadow-lg flex flex-col justify-between group ${cardBgColor}`}
                        style={{ 
                          top: `${topPx + 2}px`, // Separación sutil arriba
                          height: `${Math.max(heightPx - 4, 32)}px` // Previene colapso completo en turnos muy cortos
                        }}
                        title={`${horaFormateada} - ${cita.clients?.name}: ${cita.services?.name}`}
                      >
                        <div className="min-w-0">
                          {/* Fila superior: Hora en 24h e Indicador de Estado */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-mono font-bold text-cyan-400">
                              {horaFormateada}
                            </span>
                            {heightPx >= 45 && (
                              <span className={`text-[6px] px-1 py-0.2 rounded border uppercase font-mono tracking-wider bg-black/30 border-current ${statusInfo.color.split(' ')[2]}`}>
                                {statusInfo.label}
                              </span>
                            )}
                          </div>

                          {/* Nombre del Cliente */}
                          <p className="text-[10px] font-bold truncate text-white mt-0.5 tracking-wide">
                            {cita.clients?.name || 'Cliente'}
                          </p>

                          {/* Nombre del Servicio (Sólo si hay suficiente espacio vertical) */}
                          {heightPx > 50 && (
                            <p className="text-[9px] text-stone-400 font-medium truncate mt-0.5">
                              {cita.services?.name || 'Servicio'}
                            </p>
                          )}
                        </div>

                        {/* Fila Inferior: Profesional y Precio (Sólo si hay suficiente espacio vertical) */}
                        {heightPx >= 65 && (
                          <div className="flex items-center justify-between text-[8px] border-t border-stone-800/80 pt-1 mt-1 font-mono">
                            <span className="text-stone-400 font-sans truncate max-w-[65%]">
                              {cita.staff?.name || 'Sin asignar'}
                            </span>
                            <span className="font-bold text-emerald-400">
                              ${Number(cita.services?.price || 0).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

        </div>

      </div>
    </div>
  )
}

// ============================================
// VISTA MES TIPO GOOGLE CALENDAR (24 HORAS)
// ============================================
const renderVistaMes = () => {
  const monthStart = startOfMonth(fechaSeleccionada)
  const daysInMonth = getDaysInMonth(fechaSeleccionada)
  
  // El día de la semana en que empieza el mes (0: Domingo, 1: Lunes, etc.)
  let startDay = monthStart.getDay()
  // Ajuste para que la semana empiece en Lunes (si es Domingo(0), pasa a ser el 7º día)
  const ajusteStartDay = startDay === 0 ? 6 : startDay - 1

  const days = []
  
  // Rellenar los días vacíos del mes anterior
  for (let i = 0; i < ajusteStartDay; i++) {
    days.push(null)
  }
  
  // Registrar los días reales del mes actual
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), i)
    days.push(date)
  }

  // Helper para forzar la hora al formato estricto de 24h "HH:MM"
  const format24h = (timeStr: string | null) => {
    if (!timeStr) return '--:--'
    // Si viene "14:30:00" o "09:15", tomamos solo los primeros 5 caracteres
    const [horas, minutos] = timeStr.split(':')
    if (!horas || !minutos) return '--:--'
    return `${horas.padStart(2, '0')}:${minutos.substring(0, 2)}`
  }

  return (
    <div className="flex flex-col h-full font-sans select-none">
      
      {/* CABECERA: DÍAS DE LA SEMANA */}
      <div className="grid grid-cols-7 border-b border-stone-900 bg-stone-950/20 text-center font-mono text-[10px] text-stone-500 py-2">
        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((d) => (
          <span key={d} className="hidden sm:block uppercase tracking-wider">{d}</span>
        ))}
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, idx) => (
          <span key={`short-${idx}`} className="sm:hidden uppercase tracking-wider">{d}</span>
        ))}
      </div>

      {/* CUADRÍCULA DE DÍAS */}
      <div className="grid grid-cols-7 gap-px bg-stone-900 border-b border-r border-l border-stone-900 rounded-b-xl overflow-hidden">
        {days.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="bg-stone-950/10 min-h-[90px] sm:min-h-[120px]" />
          }

          const citasDelDia = getCitasDelDia(day).sort((a, b) => (a.time || '').localeCompare(b.time || ''))
          const isTodayDate = isToday(day)

          return (
            <div 
              key={idx} 
              onClick={() => { setFechaSeleccionada(day); setViewMode('day') }}
              className={`bg-[#0e0c0b] p-1.5 min-h-[95px] sm:min-h-[130px] flex flex-col justify-between cursor-pointer transition-all hover:bg-stone-900/40 relative group ${
                isTodayDate ? 'ring-1 ring-inset ring-cyan-500/30 bg-cyan-500/[0.02]' : ''
              }`}
            >
              {/* NÚMERO DEL DÍA */}
              <div className="flex justify-between items-center mb-1">
                <span 
                  className={`text-xs font-mono font-bold flex items-center justify-center rounded-md w-6 h-6 ${
                    isTodayDate 
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20' 
                      : 'text-stone-400 group-hover:text-white'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                
                {/* Indicador discreto si hay muchas citas */}
                {citasDelDia.length > 0 && (
                  <span className="text-[9px] font-mono font-medium text-stone-500 sm:hidden">
                    {citasDelDia.length}u
                  </span>
                )}
              </div>

              {/* LISTA DE CITAS DENTRO DE LA CELDA (ESTILO GOOGLE CALENDAR) */}
              <div className="flex-1 space-y-1 overflow-y-hidden max-h-[65px] sm:max-h-[95px]">
                {citasDelDia.slice(0, 3).map((cita) => {
                  const statusInfo = getStatusBadge(cita.status)
                  const hora24 = format24h(cita.time)
                  
                  const isProcessing = cita.status === 'in_progress'
                  const isCompleted = cita.status === 'completed'

                  let badgeStyle = 'bg-stone-900 border-stone-800 text-stone-200'
                  if (isProcessing) badgeStyle = 'bg-amber-950/50 border-amber-500/30 text-amber-300'
                  if (isCompleted) badgeStyle = 'bg-emerald-950/20 border-emerald-500/20 text-stone-500 opacity-60'

                  return (
                    <div 
                      key={cita.id}
                      className={`group/item flex items-center gap-1 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded border truncate transition-colors ${badgeStyle}`}
                      title={`${hora24} - ${cita.clients?.name}`}
                    >
                      {/* Hora fija en 24h */}
                      <span className="font-mono font-bold text-cyan-400 flex-shrink-0">
                        {hora24}
                      </span>
                      {/* Nombre del cliente */}
                      <span className="truncate font-medium flex-1">
                        {cita.clients?.name || 'Cliente'}
                      </span>
                    </div>
                  )
                })}

                {/* BOTÓN DE "MÁS CITAS" */}
                {citasDelDia.length > 3 && (
                  <div className="text-[8px] sm:text-[10px] text-cyan-500/70 font-mono font-medium pl-1 bg-cyan-500/5 rounded py-0.5 border border-cyan-500/10 text-center">
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
          <p className="text-red-400 text-sm">Error al cargar los datos</p>
          <p className="text-stone-400 text-xs mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl text-xs"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 px-2 sm:px-4 pb-12">
      {/* HEADER */}
      <div className="bg-[#0e0c0b] border border-stone-900 p-3 sm:p-5 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-serif italic text-white">Agenda Admin</h2>
              <p className="text-[9px] sm:text-[11px] text-stone-400 font-mono">
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

            <div className="flex bg-stone-900/60 border border-stone-900 rounded-xl p-0.5">
              <button 
                onClick={() => setViewMode('day')}
                className={`px-2.5 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-mono transition-all ${viewMode === 'day' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20' : 'text-stone-400 hover:text-white'}`}
              >
                Día
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={`px-2.5 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-mono transition-all ${viewMode === 'week' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20' : 'text-stone-400 hover:text-white'}`}
              >
                Semana
              </button>
              <button 
                onClick={() => setViewMode('month')}
                className={`px-2.5 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-mono transition-all ${viewMode === 'month' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20' : 'text-stone-400 hover:text-white'}`}
              >
                Mes
              </button>
            </div>

            <button 
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden p-1.5 sm:p-2 bg-stone-900/60 border border-stone-900 rounded-xl text-stone-400 hover:text-white transition-all"
            >
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-stone-900">
          <button onClick={() => cambiarDia(-1)} className="p-1.5 sm:p-2 rounded-lg bg-stone-950 border border-stone-800 text-stone-400 hover:text-white transition-all">
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <span className="text-[10px] sm:text-xs font-mono font-bold text-stone-200 uppercase tracking-wider text-center flex-1">
            {formatFechaTitulo()}
          </span>
          <button onClick={() => cambiarDia(1)} className="p-1.5 sm:p-2 rounded-lg bg-stone-950 border border-stone-800 text-stone-400 hover:text-white transition-all">
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {showMobileFilters && (
          <div className="lg:hidden mt-3 pt-3 border-t border-stone-900 space-y-2">
            <select 
              value={filtroStaff} 
              onChange={(e) => setFiltroStaff(e.target.value)}
              className="w-full bg-stone-900/60 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="todos">🌟 Todo el Equipo</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>💅 {s.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="hidden lg:flex items-center gap-3 mt-3 pt-3 border-t border-stone-900">
          <Filter className="w-3.5 h-3.5 text-stone-500" />
          <select 
            value={filtroStaff} 
            onChange={(e) => setFiltroStaff(e.target.value)}
            className="bg-stone-900/60 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="todos">🌟 Todo el Equipo</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>💅 {s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pega esto debajo de donde se muestra el título "Agenda Admin" y los ingresos */}
        {citasPendientes > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between mb-4 animate-pulse">
            <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <p className="text-xs font-mono text-amber-400">
                Tienes <span className="font-bold">{citasPendientes}</span> {citasPendientes === 1 ? 'cita pendiente' : 'citas pendientes'} por confirmar
            </p>
            </div>
            <button 
            onClick={() => {
            // Buscamos la primera cita pendiente que tengamos en la lista
            const primeraPendiente = citas.find(c => c.status === 'pending');
            
            if (primeraPendiente && primeraPendiente.date) {
                // Convertimos el string "YYYY-MM-DD" a un objeto Date real
                // Usamos el reemplazo de guiones por barras para evitar problemas de zona horaria local
                const fechaCita = new Date(primeraPendiente.date.replace(/-/g, '\/'));
                setFechaSeleccionada(fechaCita);
            }
            
            // Cambiamos a la vista de día y limpiamos los filtros para asegurarnos de que se vea
            setViewMode('day');
            setFiltroStaff('todos');
            }}
            className="text-[10px] font-mono uppercase bg-amber-500 text-black px-2 py-0.5 rounded font-bold hover:bg-amber-400 transition-colors"
            >
            Ver citas
            </button>
        </div>
        )}

      {/* METRICAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-[#0e0c0b]/40 border border-stone-900 p-3 sm:p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[8px] sm:text-[10px] text-stone-500 font-mono uppercase tracking-widest">Turnos</p>
            <p className="text-base sm:text-xl font-mono font-bold text-stone-200 mt-0.5">{citas.length}</p>
          </div>
          <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400/70" />
        </div>
        <div className="bg-[#0e0c0b]/40 border border-stone-900 p-3 sm:p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[8px] sm:text-[10px] text-stone-500 font-mono uppercase tracking-widest">Proceso</p>
            <p className="text-base sm:text-xl font-mono font-bold text-amber-400 mt-0.5">
              {citas.filter(c => c.status === 'in_progress').length}
            </p>
          </div>
          <Play className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400/70" />
        </div>
        <div className="bg-[#0e0c0b]/40 border border-stone-900 p-3 sm:p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[8px] sm:text-[10px] text-stone-500 font-mono uppercase tracking-widest">Completadas</p>
            <p className="text-base sm:text-xl font-mono font-bold text-emerald-400 mt-0.5">
              {citas.filter(c => c.status === 'completed').length}
            </p>
          </div>
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400/70" />
        </div>
        <div className="bg-[#0e0c0b]/40 border border-stone-900 p-3 sm:p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[8px] sm:text-[10px] text-stone-500 font-mono uppercase tracking-widest">Ingresos</p>
            <p className="text-base sm:text-xl font-mono font-bold text-emerald-400 mt-0.5">${totalIngresos.toLocaleString()}</p>
          </div>
          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400/70" />
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="bg-[#0e0c0b] border border-stone-900 rounded-2xl p-3 sm:p-6 shadow-xl relative min-h-[300px]">
        {viewMode === 'day' && renderVistaDia()}
        {viewMode === 'week' && renderVistaSemana()}
        {viewMode === 'month' && renderVistaMes()}
      </div>

      {/* MODAL NUEVA CITA */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e0c0b] border border-stone-900 rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                Agendar cita
              </h3>
              <button onClick={() => setShowNewAppointment(false)} className="p-1 hover:bg-stone-900 rounded-lg transition-colors">
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-stone-400" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAgendarCita(); }} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs text-stone-400 font-medium mb-1">Cliente *</label>
                <select 
                  value={newCita.clientId}
                  onChange={(e) => setNewCita({...newCita, clientId: e.target.value})}
                  className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  required
                >
                  <option value="">Selecciona un cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-stone-400 font-medium mb-1">Servicio *</label>
                <select 
                  value={newCita.serviceId}
                  onChange={(e) => setNewCita({...newCita, serviceId: e.target.value})}
                  className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  required
                >
                  <option value="">Selecciona un servicio</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (${s.price})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-stone-400 font-medium mb-1">Profesional</label>
                <select 
                  value={newCita.staffId}
                  onChange={(e) => setNewCita({...newCita, staffId: e.target.value})}
                  className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Cualquier profesional</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-400 font-medium mb-1">Fecha *</label>
                  <input 
                    type="date"
                    value={newCita.date}
                    onChange={(e) => setNewCita({...newCita, date: e.target.value})}
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 font-medium mb-1">Hora *</label>
                  <input 
                    type="time"
                    value={newCita.time}
                    onChange={(e) => setNewCita({...newCita, time: e.target.value})}
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-stone-400 font-medium mb-1">Notas</label>
                <textarea 
                  value={newCita.notes}
                  onChange={(e) => setNewCita({...newCita, notes: e.target.value})}
                  rows={2}
                  className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder-stone-500"
                  placeholder="Alergias, observaciones..."
                />
              </div>

              <div className="flex gap-3 pt-3 sm:pt-4 border-t border-stone-900">
                <button
                  type="button"
                  onClick={() => setShowNewAppointment(false)}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-stone-900/50 border border-stone-900 text-stone-400 rounded-xl text-sm font-medium hover:bg-stone-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
                >
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}