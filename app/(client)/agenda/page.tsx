'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar as CalendarIcon, Clock, User, Sparkles, ChevronRight, 
  CheckCircle2, ChevronLeft, ChevronRight as ChevronRightIcon,
  Phone, Mail, FileText, Bookmark, 
  Scissors, Heart, ArrowRight, Calendar,
  Star, Award, Zap, Shield, Check, X,
  MessageCircle, MapPin, Gift, Crown
} from 'lucide-react'
import { 
  format, addDays, isToday, parseISO, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameDay, isBefore, startOfDay, addMonths, subMonths,
  isWeekend, getDay
} from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function ClientBookingPage() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const isDark = theme === 'dark'
  
  const [paso, setPaso] = useState<number>(1)
  const [services, setServices] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [citasYBloqueos, setCitasYBloqueos] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedTime, setSelectedTime] = useState<string>('')
  
  const [clientData, setClientData] = useState({ name: '', phone: '', email: '', notes: '' })
  const [showSuccessAnimation, setShowSuccessAnimation] = useState<boolean>(false)

  const horariosJornada = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', 
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', 
    '18:00', '18:30', '19:00', '19:30'
  ]

  // === EFECTOS ===
  useEffect(() => {
    const fetchInicial = async () => {
      try {
        const [servicesRes, staffRes] = await Promise.all([
          supabase.from('services').select('*').eq('is_active', true),
          supabase.from('staff').select('*').eq('is_active', true)
        ])
        setServices(servicesRes.data || [])
        setStaff(staffRes.data || [])
      } catch (err) {
        console.error("Error al cargar datos iniciales:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchInicial()
  }, [])

  useEffect(() => {
    if (!selectedProfessional) return

    const fetchOcupacion = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('time, status, service_id, services(duration)')
        .eq('professional_id', selectedProfessional.id)
        .eq('date', selectedDate)
        .neq('status', 'cancelled')

      if (!error && data) {
        setCitasYBloqueos(data)
      }
    }

    fetchOcupacion()
  }, [selectedDate, selectedProfessional])

  // === FUNCIONES DE DISPONIBILIDAD ===
  const comprobarDisponibilidad = (horaEvaluar: string, fechaEvaluarStr = selectedDate) => {
    if (fechaEvaluarStr === format(new Date(), 'yyyy-MM-dd')) {
      const ahoraStr = format(new Date(), 'HH:mm')
      if (horaEvaluar < ahoraStr) return { disponible: false, motivo: 'Pasado' }
    }

    for (const item of citasYBloqueos) {
      if (!item.time) continue
      
      const horaInicio = item.time.substring(0, 5) 
      const duracion = item.services?.duration || 30 
      
      const [hIni, mIni] = horaInicio.split(':').map(Number)
      const totalMinutosInicio = hIni * 60 + mIni
      const totalMinutosFin = totalMinutosInicio + duracion

      const [hEval, mEval] = horaEvaluar.split(':').map(Number)
      const totalMinutosEval = hEval * 60 + mEval

      if (totalMinutosEval >= totalMinutosInicio && totalMinutosEval < totalMinutosFin) {
        return { disponible: false, motivo: item.status === 'blocked' ? 'Bloqueado' : 'Ocupado' }
      }
    }
    return { disponible: true, motivo: '' }
  }

  const diasDelMes = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  // === MANEJO DE RESERVA ===
  const handleFinalizarReserva = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientData.name || !clientData.phone) {
      alert("Por favor introduce tu nombre y teléfono de contacto")
      return
    }

    try {
      setSubmitting(true)
      let client_id = null
      
      const { data: clientesEncontrados } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', clientData.phone.trim())

      const clienteExistente = clientesEncontrados && clientesEncontrados.length > 0 ? clientesEncontrados[0] : null

      if (clienteExistente) {
        client_id = clienteExistente.id
      } else {
        const { data: nuevoClienteData, error: insertClientError } = await supabase
          .from('clients')
          .insert([{ 
            name: clientData.name.trim(), 
            phone: clientData.phone.trim(), 
            email: clientData.email.trim() || null 
          }])
          .select('id')

        if (insertClientError) throw insertClientError
        client_id = nuevoClienteData && nuevoClienteData[0]?.id
      }

      if (!client_id) throw new Error("Error al procesar cliente.")

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert([
          {
            client_id,
            professional_id: selectedProfessional.id,
            service_id: selectedService.id,
            date: selectedDate,
            time: selectedTime, 
            status: 'pending', 
            total_price: Number(selectedService.price),
            notes: clientData.notes.trim() || null
          }
        ])

      if (appointmentError) throw appointmentError
      
      // Mostrar animación de éxito
      setShowSuccessAnimation(true)
      setTimeout(() => {
        setPaso(5)
        setShowSuccessAnimation(false)
      }, 800)
      
    } catch (err) {
      console.error(err)
      alert("Error al guardar la reserva.")
    } finally {
      setSubmitting(false)
    }
  }

  const horasMauna = horariosJornada.filter(h => h < '14:00')
  const horasTarde = horariosJornada.filter(h => h >= '14:00')

  // === ESTADO DE CARGA ===
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-rose-500/20 rounded-full animate-ping" />
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-background text-foreground antialiased selection:bg-rose-500/20 pb-24 transition-colors duration-300 ${
      isDark ? 'bg-[#0a0908]' : 'bg-[#fcfbfa]'
    }`}>
      
      <div className="max-w-6xl mx-auto px-4 md:px-6">

        {/* ============================================================ */}
        {/* HEADER CON CARD-GLOW */}
        {/* ============================================================ */}
        <div className={`card-glow relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500/[0.08] via-card to-card border border-rose-500/20 p-6 shadow-xl mt-6 animate-fade-up ${
          isDark 
            ? 'bg-gradient-to-br from-rose-950/20 via-[#161311] to-[#0a0908]' 
            : 'bg-gradient-to-br from-rose-50/50 via-white to-stone-50'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className={`text-[10px] uppercase tracking-[0.3em] font-mono flex items-center gap-2 ${
                isDark ? 'text-rose-400' : 'text-rose-600'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                📅 Agenda tu cita
              </p>
              <h2 className="text-2xl font-serif italic text-foreground mt-1">
                Reserva tu <span className="text-shimmer">Experiencia</span>
              </h2>
              <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Elige tu servicio, profesional y horario en pocos pasos.
              </p>
            </div>
            {user && (
              <Link
                href="/reservas"
                className={`px-3 py-1.5 rounded-xl text-[10px] font-mono transition-all flex items-center gap-1.5 ${
                  isDark 
                    ? 'bg-stone-800/40 border border-stone-700 text-stone-300 hover:bg-stone-700/40' 
                    : 'bg-stone-100/60 border border-stone-200 text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                <Calendar className="w-3 h-3" />
                Ver mis reservas
              </Link>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* INDICADOR DE PASOS */}
        {/* ============================================================ */}
        {paso < 5 && (
          <div className="flex items-center justify-center gap-2 mt-8 mb-6">
            {[1, 2, 3, 4].map((num) => {
              const isActive = paso === num
              const isCompleted = paso > num
              const labels = ['Servicio', 'Profesional', 'Fecha', 'Confirmar']
              
              return (
                <div key={num} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-110' 
                        : isCompleted 
                          ? 'bg-emerald-500 text-white' 
                          : isDark 
                            ? 'bg-stone-800 text-stone-500' 
                            : 'bg-stone-200 text-stone-400'
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : num}
                    </div>
                    <span className={`text-[9px] mt-1 font-mono ${
                      isActive ? 'text-rose-500 font-bold' : isDark ? 'text-stone-500' : 'text-stone-400'
                    }`}>
                      {labels[num - 1]}
                    </span>
                  </div>
                  {num < 4 && (
                    <div className={`w-8 h-px mx-1 ${
                      paso > num ? isDark ? 'bg-emerald-500' : 'bg-emerald-500' : isDark ? 'bg-stone-700' : 'bg-stone-300'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ============================================================ */}
        {/* CONTENEDOR PRINCIPAL */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-4">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* ============================================================ */}
            {/* PASO 1: SERVICIOS */}
            {/* ============================================================ */}
            {paso === 1 && (
              <div className="space-y-4 animate-fade-up">
                <div>
                  <h3 className="text-lg font-medium text-foreground">¿Qué servicio deseas?</h3>
                  <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Selecciona el tratamiento que mejor se adapte a ti
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
                  {services.map((serv, index) => (
                    <button
                      key={serv.id}
                      onClick={() => { setSelectedService(serv); setPaso(2); }}
                      className={`card-glow group relative rounded-2xl border p-5 text-left transition-all hover:-translate-y-1 shadow-sm ${
                        isDark 
                          ? 'bg-stone-900/40 border-stone-800/70 hover:border-rose-500/30 hover:shadow-[0_20px_30px_-10px_rgba(0,0,0,0.7)]' 
                          : 'bg-white border-stone-200/90 hover:border-rose-500/40 hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.05)]'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Badge decorativo */}
                      {index === 0 && (
                        <div className={`absolute top-3 right-3 text-[8px] font-mono uppercase px-2 py-0.5 rounded-full ${
                          isDark 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                          Popular
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`font-medium transition-colors group-hover:text-rose-600 dark:group-hover:text-rose-400 ${
                            isDark ? 'text-stone-200' : 'text-stone-800'
                          }`}>
                            {serv.name}
                          </h4>
                          <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                            {serv.description || 'Tratamiento profesional de alta calidad'}
                          </p>
                        </div>
                        <ChevronRight className={`w-4 h-4 mt-1 transition-transform group-hover:translate-x-1 flex-shrink-0 ${
                          isDark ? 'text-stone-600' : 'text-stone-300'
                        }`} />
                      </div>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                        <span className={`text-sm font-mono font-bold ${
                          isDark ? 'text-rose-400' : 'text-rose-600'
                        }`}>
                          ${Number(serv.price).toLocaleString()}
                        </span>
                        <span className={`text-[10px] font-mono flex items-center gap-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                          <Clock className="w-3 h-3" /> {serv.duration} min
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* PASO 2: PROFESIONALES */}
            {/* ============================================================ */}
            {paso === 2 && (
              <div className="space-y-4 animate-fade-up delay-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-foreground">Elige a tu profesional</h3>
                    <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      {selectedService?.name} — {selectedService?.duration} min
                    </p>
                  </div>
                  <button 
                    onClick={() => setPaso(1)} 
                    className={`text-[10px] font-mono transition-colors flex items-center gap-1 ${
                      isDark ? 'text-stone-400 hover:text-stone-200' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <X className="w-3 h-3" /> Cambiar servicio
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
                  {staff.map((prof, index) => (
                    <button
                      key={prof.id}
                      onClick={() => { setSelectedProfessional(prof); setPaso(3); }}
                      className={`card-glow group rounded-2xl border p-4 text-left transition-all hover:-translate-y-1 shadow-sm ${
                        isDark 
                          ? 'bg-stone-900/40 border-stone-800/70 hover:border-rose-500/30 hover:shadow-[0_20px_30px_-10px_rgba(0,0,0,0.7)]' 
                          : 'bg-white border-stone-200/90 hover:border-rose-500/40 hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.05)]'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold relative ${
                          isDark 
                            ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' 
                            : 'bg-rose-500/10 border border-rose-500/20 text-rose-600'
                        }`}>
                          {prof.name?.charAt(0).toUpperCase()}
                          {index === 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[8px] text-white font-bold">
                              ★
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className={`font-medium transition-colors group-hover:text-rose-600 dark:group-hover:text-rose-400 ${
                            isDark ? 'text-stone-200' : 'text-stone-800'
                          }`}>
                            {prof.name}
                          </h4>
                          <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                            {prof.specialty || prof.role || 'Especialista'}
                          </p>
                        </div>
                        <ChevronRight className={`w-4 h-4 ml-auto transition-transform group-hover:translate-x-1 ${
                          isDark ? 'text-stone-600' : 'text-stone-300'
                        }`} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* PASO 3: CALENDARIO Y HORARIOS */}
            {/* ============================================================ */}
            {paso === 3 && (
              <div className="space-y-6 animate-fade-up delay-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-foreground">Elige fecha y hora</h3>
                    <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      {selectedProfessional?.name} — {selectedService?.name}
                    </p>
                  </div>
                  <button 
                    onClick={() => setPaso(2)} 
                    className={`text-[10px] font-mono transition-colors flex items-center gap-1 ${
                      isDark ? 'text-stone-400 hover:text-stone-200' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <X className="w-3 h-3" /> Cambiar profesional
                  </button>
                </div>

                {/* CALENDARIO */}
                <div className={`card-glow border rounded-2xl p-6 shadow-sm ${
                  isDark ? 'bg-stone-900/30 border-stone-800/80' : 'bg-white border-stone-200'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-medium text-foreground capitalize">
                      {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h4>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
                        disabled={isBefore(startOfMonth(currentMonth), new Date())}
                        className={`p-2 rounded-xl border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                          isDark 
                            ? 'border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800/30' 
                            : 'border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
                        className={`p-2 rounded-xl border transition-colors ${
                          isDark 
                            ? 'border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800/30' 
                            : 'border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                        }`}
                      >
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                      <div key={d} className={`text-[10px] font-mono py-1 ${
                        isDark ? 'text-stone-500' : 'text-stone-400'
                      }`}>{d}</div>
                    ))}
                    {diasDelMes.map((dia, idx) => {
                      const diaStr = format(dia, 'yyyy-MM-dd')
                      const esPasado = isBefore(startOfDay(dia), startOfDay(new Date()))
                      const esSeleccionado = selectedDate === diaStr
                      const esFinDeSemana = isWeekend(dia)
                      
                      return (
                        <button
                          key={idx}
                          disabled={esPasado}
                          onClick={() => { setSelectedDate(diaStr); setSelectedTime(''); }}
                          className={`py-2.5 rounded-xl text-sm font-mono transition-all relative ${
                            esSeleccionado 
                              ? 'bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20' 
                              : esPasado 
                                ? `text-stone-500/30 cursor-not-allowed ${isDark ? 'text-stone-700' : 'text-stone-300'}` 
                                : esFinDeSemana
                                  ? isDark 
                                    ? 'text-rose-400/70 hover:bg-rose-500/10 hover:text-rose-300' 
                                    : 'text-rose-400/70 hover:bg-rose-500/10'
                                  : isDark 
                                    ? 'text-stone-300 hover:bg-stone-800/50' 
                                    : 'text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          {format(dia, 'd')}
                          {esFinDeSemana && !esSeleccionado && !esPasado && (
                            <div className="w-1 h-1 mx-auto mt-0.5 rounded-full bg-rose-400/50" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* HORARIOS */}
                {selectedDate && (
                  <div className={`card-glow border rounded-2xl p-6 shadow-sm ${
                    isDark ? 'bg-stone-900/30 border-stone-800/80' : 'bg-white border-stone-200'
                  }`}>
                    <p className={`text-xs font-mono border-b pb-3 mb-4 flex items-center justify-between ${
                      isDark ? 'text-stone-400 border-stone-800' : 'text-stone-500 border-stone-200'
                    }`}>
                      <span>{format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es })}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isWeekend(parseISO(selectedDate))
                          ? isDark 
                            ? 'bg-rose-500/10 text-rose-400' 
                            : 'bg-rose-500/10 text-rose-600'
                          : isDark 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        {isWeekend(parseISO(selectedDate)) ? 'Fin de semana' : 'Laborable'}
                      </span>
                    </p>

                    {/* Mañana */}
                    <div className="mb-4">
                      <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                        🌅 Mañana
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                        {horasMauna.map((hora) => {
                          const infoDisp = comprobarDisponibilidad(hora)
                          const seleccionado = selectedTime === hora
                          return (
                            <button
                              key={hora}
                              disabled={!infoDisp.disponible}
                              onClick={() => setSelectedTime(hora)}
                              className={`py-2.5 rounded-xl text-xs font-mono transition-all border text-center ${
                                seleccionado
                                  ? 'bg-rose-500 text-white font-bold border-rose-500 shadow-lg shadow-rose-500/20'
                                  : infoDisp.disponible
                                    ? isDark 
                                      ? 'bg-stone-900/30 border-stone-800 text-stone-300 hover:border-rose-500/30 hover:text-rose-400' 
                                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-rose-500/30 hover:text-rose-600'
                                    : `bg-muted/10 border-transparent text-muted-foreground/40 cursor-not-allowed line-through opacity-40`
                              }`}
                            >
                              {hora}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Tarde */}
                    <div>
                      <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                        🌆 Tarde
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                        {horasTarde.map((hora) => {
                          const infoDisp = comprobarDisponibilidad(hora)
                          const seleccionado = selectedTime === hora
                          return (
                            <button
                              key={hora}
                              disabled={!infoDisp.disponible}
                              onClick={() => setSelectedTime(hora)}
                              className={`py-2.5 rounded-xl text-xs font-mono transition-all border text-center ${
                                seleccionado
                                  ? 'bg-rose-500 text-white font-bold border-rose-500 shadow-lg shadow-rose-500/20'
                                  : infoDisp.disponible
                                    ? isDark 
                                      ? 'bg-stone-900/30 border-stone-800 text-stone-300 hover:border-rose-500/30 hover:text-rose-400' 
                                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-rose-500/30 hover:text-rose-600'
                                    : `bg-muted/10 border-transparent text-muted-foreground/40 cursor-not-allowed line-through opacity-40`
                              }`}
                            >
                              {hora}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {selectedTime && (
                  <button
                    onClick={() => setPaso(4)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-sm font-medium transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 glow-hover"
                  >
                    Continuar <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* PASO 4: FORMULARIO */}
            {/* ============================================================ */}
            {paso === 4 && (
              <div className="space-y-4 animate-fade-up delay-400">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-foreground">Completa tus datos</h3>
                    <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      {selectedService?.name} — {format(parseISO(selectedDate), "d MMM")} a las {selectedTime}
                    </p>
                  </div>
                  <button 
                    onClick={() => setPaso(3)} 
                    className={`text-[10px] font-mono transition-colors flex items-center gap-1 ${
                      isDark ? 'text-stone-400 hover:text-stone-200' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <X className="w-3 h-3" /> Cambiar horario
                  </button>
                </div>

                <form onSubmit={handleFinalizarReserva} className={`card-glow border rounded-2xl p-6 shadow-sm space-y-4 ${
                  isDark ? 'bg-stone-900/30 border-stone-800/80' : 'bg-white border-stone-200'
                }`}>
                  <div>
                    <label className={`block text-[10px] font-mono uppercase tracking-wider mb-1.5 ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}>Nombre completo *</label>
                    <div className="relative">
                      <User className={`absolute left-3.5 top-3.5 w-4 h-4 ${isDark ? 'text-stone-500' : 'text-stone-400'}`} />
                      <input
                        type="text"
                        required
                        value={clientData.name}
                        onChange={(e) => setClientData({...clientData, name: e.target.value})}
                        className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-rose-500/50 transition-all ${
                          isDark 
                            ? 'bg-stone-950 border-stone-800 text-stone-200' 
                            : 'bg-white border-stone-200 text-stone-900'
                        }`}
                        placeholder="Tu nombre completo"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-mono uppercase tracking-wider mb-1.5 ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}>Teléfono *</label>
                    <div className="relative">
                      <Phone className={`absolute left-3.5 top-3.5 w-4 h-4 ${isDark ? 'text-stone-500' : 'text-stone-400'}`} />
                      <input
                        type="tel"
                        required
                        value={clientData.phone}
                        onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                        className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-rose-500/50 transition-all ${
                          isDark 
                            ? 'bg-stone-950 border-stone-800 text-stone-200' 
                            : 'bg-white border-stone-200 text-stone-900'
                        }`}
                        placeholder="Ej. 099123456"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-mono uppercase tracking-wider mb-1.5 ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}>Email</label>
                    <div className="relative">
                      <Mail className={`absolute left-3.5 top-3.5 w-4 h-4 ${isDark ? 'text-stone-500' : 'text-stone-400'}`} />
                      <input
                        type="email"
                        value={clientData.email}
                        onChange={(e) => setClientData({...clientData, email: e.target.value})}
                        className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-rose-500/50 transition-all ${
                          isDark 
                            ? 'bg-stone-950 border-stone-800 text-stone-200' 
                            : 'bg-white border-stone-200 text-stone-900'
                        }`}
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-mono uppercase tracking-wider mb-1.5 ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}>Notas adicionales</label>
                    <div className="relative">
                      <FileText className={`absolute left-3.5 top-3.5 w-4 h-4 ${isDark ? 'text-stone-500' : 'text-stone-400'}`} />
                      <textarea
                        value={clientData.notes}
                        onChange={(e) => setClientData({...clientData, notes: e.target.value})}
                        rows={2}
                        className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-rose-500/50 transition-all resize-none ${
                          isDark 
                            ? 'bg-stone-950 border-stone-800 text-stone-200' 
                            : 'bg-white border-stone-200 text-stone-900'
                        }`}
                        placeholder="Alergias, preferencias, necesidades especiales..."
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-medium transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 glow-hover ${
                      submitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Confirmar reserva
                      </>
                    )}
                  </button>

                  <p className={`text-[10px] text-center font-mono ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                    Al confirmar, aceptas nuestros términos y condiciones
                  </p>
                </form>
              </div>
            )}

            {/* ============================================================ */}
            {/* PASO 5: ÉXITO */}
            {/* ============================================================ */}
            {paso === 5 && (
              <div className={`card-glow border rounded-3xl p-8 text-center max-w-lg mx-auto shadow-xl relative overflow-hidden ${
                isDark ? 'bg-stone-900/30 border-stone-800/80' : 'bg-white border-stone-200'
              }`}>
                {/* Línea superior decorativa */}
                <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
                
                {/* Partículas de confeti animadas */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'][i % 5],
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${2 + Math.random() * 2}s`
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border-2 border-emerald-500/30 animate-scale-in">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>

                  <h3 className="text-2xl font-serif italic text-foreground mt-4">¡Reserva confirmada!</h3>
                  <p className={`text-sm mt-2 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Tu cita ha sido agendada exitosamente. Te esperamos.
                  </p>
                </div>

                {/* Detalles de la reserva */}
                <div className={`border rounded-xl p-4 text-left space-y-2 mt-6 relative z-10 ${
                  isDark ? 'bg-stone-950/30 border-stone-800' : 'bg-stone-50 border-stone-200'
                }`}>
                  <div className="flex justify-between text-sm">
                    <span className={`${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Servicio</span>
                    <span className="font-medium text-foreground">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={`${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Profesional</span>
                    <span className="font-medium text-foreground">{selectedProfessional?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={`${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Fecha</span>
                    <span className="font-medium text-foreground">
                      {format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={`${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Hora</span>
                    <span className="font-medium text-foreground">{selectedTime}</span>
                  </div>
                  <div className={`flex justify-between text-sm pt-2 mt-2 border-t ${
                    isDark ? 'border-stone-800' : 'border-stone-200'
                  }`}>
                    <span className={`${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Total</span>
                    <span className="font-bold text-rose-500">${Number(selectedService?.price).toLocaleString()}</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="space-y-3 mt-6 relative z-10">
                  <button
                    onClick={() => {
                      setPaso(1)
                      setSelectedService(null)
                      setSelectedProfessional(null)
                      setSelectedTime('')
                      setClientData({ name: '', phone: '', email: '', notes: '' })
                      setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-medium transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 glow-hover"
                  >
                    <Calendar className="w-4 h-4" />
                    Agendar otra cita
                  </button>

                  <Link
                    href="/reservas"
                    className={`block w-full py-3 rounded-xl text-sm font-medium transition-all text-center border ${
                      isDark 
                        ? 'border-stone-700 text-stone-300 hover:bg-stone-800/30' 
                        : 'border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Ver mis reservas
                  </Link>
                </div>
              </div>
            )}

          </div>

          {/* ============================================================ */}
          {/* SIDEBAR DERECHO - RESUMEN */}
          {/* ============================================================ */}
          {paso < 5 && (
            <div className={`card-glow border rounded-2xl p-5 space-y-5 lg:sticky lg:top-6 shadow-sm relative overflow-hidden ${
              isDark ? 'bg-stone-900/30 border-stone-800/80' : 'bg-white border-stone-200'
            }`}>
              {/* Badge decorativo */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-rose-500/5 to-transparent rounded-bl-full pointer-events-none" />
              
              <h3 className={`text-[10px] font-mono uppercase tracking-[0.2em] border-b pb-3 flex items-center gap-2 ${
                isDark ? 'text-stone-400 border-stone-800' : 'text-stone-500 border-stone-200'
              }`}>
                <Bookmark className="w-3 h-3 text-rose-500" /> Resumen
              </h3>
              
              {/* Servicio */}
              {selectedService ? (
                <div className="space-y-1 relative z-10">
                  <p className={`text-[10px] font-mono uppercase tracking-wider ${
                    isDark ? 'text-rose-400' : 'text-rose-600'
                  }`}>Servicio</p>
                  <p className="text-sm font-medium text-foreground">{selectedService.name}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className={`text-xs font-mono flex items-center gap-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      <Clock className="w-3 h-3" /> {selectedService.duration} min
                    </span>
                    <span className={`text-xs font-mono font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      ${Number(selectedService.price).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <p className={`text-xs font-mono italic ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Selecciona un servicio
                </p>
              )}

              {/* Profesional */}
              {selectedProfessional && (
                <div className={`space-y-1 pt-3 border-t ${
                  isDark ? 'border-stone-800' : 'border-stone-200'
                } relative z-10`}>
                  <p className={`text-[10px] font-mono uppercase tracking-wider ${
                    isDark ? 'text-rose-400' : 'text-rose-600'
                  }`}>Profesional</p>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {selectedProfessional.name}
                  </p>
                </div>
              )}

              {/* Fecha y hora */}
              {selectedTime && (
                <div className={`space-y-1 pt-3 border-t ${
                  isDark ? 'border-stone-800' : 'border-stone-200'
                } relative z-10`}>
                  <p className={`text-[10px] font-mono uppercase tracking-wider ${
                    isDark ? 'text-rose-400' : 'text-rose-600'
                  }`}>Fecha y Hora</p>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {format(parseISO(selectedDate), "EEEE d", { locale: es })}
                  </p>
                  <div className={`text-xs font-mono font-bold mt-1 w-fit px-2 py-0.5 rounded-md ${
                    isDark 
                      ? 'text-amber-300 bg-amber-950/20 border border-amber-900/20' 
                      : 'text-rose-700 bg-rose-50 border border-rose-200'
                  }`}>
                    {selectedTime} hs
                  </div>
                </div>
              )}

              {/* Total fijo */}
              {selectedService && (
                <div className={`pt-4 border-t flex items-center justify-between ${
                  isDark ? 'border-stone-800' : 'border-stone-200'
                } relative z-10`}>
                  <span className={`text-[10px] font-mono uppercase tracking-wide ${
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  }`}>Total</span>
                  <span className="text-lg font-mono font-bold text-shimmer">
                    ${Number(selectedService.price).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Indicador de pasos completados */}
              <div className={`pt-3 border-t flex items-center gap-2 text-[9px] font-mono ${
                isDark ? 'text-stone-500 border-stone-800' : 'text-stone-400 border-stone-200'
              } relative z-10`}>
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${paso >= 1 ? 'bg-emerald-500' : isDark ? 'bg-stone-700' : 'bg-stone-300'}`} />
                  Servicio
                </span>
                <span className="text-stone-500">→</span>
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${paso >= 2 ? 'bg-emerald-500' : isDark ? 'bg-stone-700' : 'bg-stone-300'}`} />
                  Staff
                </span>
                <span className="text-stone-500">→</span>
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${paso >= 3 ? 'bg-emerald-500' : isDark ? 'bg-stone-700' : 'bg-stone-300'}`} />
                  Agenda
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}