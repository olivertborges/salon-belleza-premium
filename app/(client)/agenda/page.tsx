'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation' // 👈 Integrado
import { 
  Calendar as CalendarIcon, Clock, User, Sparkles, ChevronRight, 
  CheckCircle2, ChevronLeft, ChevronRight as ChevronRightIcon,
  Phone, Mail, FileText, Bookmark, 
  Scissors, Heart, ArrowRight, Calendar,
  Star, Award, Zap, Shield, Check, X,
  MessageCircle, MapPin, Gift, Crown,
  Layers
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

const CATEGORIAS_CONFIG: Record<string, { label: string; icon: any; desc: string }> = {
  'todas': { label: 'Todos los Rituales', icon: Layers, desc: 'Explora nuestra colección completa' },
  'uñas': { label: 'Uñas & Manicura', icon: Heart, desc: 'Esculpidas, gel y diseños de alta gama' },
  'micropigmentacion': { label: 'Micropigmentación', icon: Crown, desc: 'Diseño hiperrealista de cejas y labios' },
  'peluqueria': { label: 'Peluquería Boutique', icon: Scissors, desc: 'Cortes exclusivos, colorimetría y brillo' },
  'otros': { label: 'Otros Servicios', icon: Sparkles, desc: 'Cuidado extra para potenciar tu brillo' }
}

export default function ClientBookingPage() {
  const { theme } = useTheme()
  const { user, tenantId } = useAuth()
  const isDark = theme === 'dark'
  
  // 🧭 LECTURA DE URL PARAMS
  const searchParams = useSearchParams()
  const urlProfessionalId = searchParams.get('professional')
  const urlStyleName = searchParams.get('style')

  const [paso, setPaso] = useState<number>(1)
  const [services, setServices] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [citasYBloqueos, setCitasYBloqueos] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([])

  const [activeCategory, setActiveCategory] = useState<string>('todas')
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedTime, setSelectedTime] = useState<string>('')

  const [clientData, setClientData] = useState({ name: '', phone: '', email: '', notes: '' })
  const [showSuccessAnimation, setShowSuccessAnimation] = useState<boolean>(false)

  const horariosPorDefecto = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', 
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', 
    '18:00', '18:30', '19:00', '19:30'
  ]

  const esNoLaborable = (fecha: Date) => {
    const dia = getDay(fecha)
    return dia === 0 || dia === 1
  }

  const obtenerHorariosBD = async () => {
    try {
      const { data, error } = await supabase
        .from('working_hours')
        .select('start_time')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('start_time', { ascending: true })

      if (error) throw error
      if (data && data.length > 0) return data.map((h: any) => h.start_time)
      return horariosPorDefecto
    } catch (error) {
      console.error('Error obteniendo horarios:', error)
      return horariosPorDefecto
    }
  }

  // 1. Carga inicial de datos de Supabase
  useEffect(() => {
    const fetchInicial = async () => {
      try {
        const [servicesRes, staffRes, horarios] = await Promise.all([
          supabase.from('services').select('*').eq('is_active', true),
          supabase.from('staff').select('*').eq('is_active', true),
          obtenerHorariosBD()
        ])
        
        const bdedServices = servicesRes.data || []
        const bdedStaff = staffRes.data || []
        
        setServices(bdedServices)
        setStaff(bdedStaff)
        setHorariosDisponibles(horarios)

        // 💡 2. LÓGICA DE PRE-SELECCIÓN INTEGRADA:
        // Evaluamos los parámetros de la URL inmediatamente después de recibir la data de la BD.
        let servicioEncontrado = null
        let profesionalEncontrado = null

        if (urlStyleName) {
          servicioEncontrado = bdedServices.find(
            (s: any) => s.name.toLowerCase().trim() === urlStyleName.toLowerCase().trim() || s.id === urlStyleName
          )
          if (servicioEncontrado) {
            setSelectedService(servicioEncontrado)
          }
        }

        if (urlProfessionalId) {
          profesionalEncontrado = bdedStaff.find((p: any) => p.id === urlProfessionalId)
          if (profesionalEncontrado) {
            setSelectedProfessional(profesionalEncontrado)
          }
        }

        // Determinar dinámicamente a qué paso enviar al usuario según lo que ya tenemos
        if (servicioEncontrado && profesionalEncontrado) {
          setPaso(3) // Salta directo al calendario
        } else if (servicioEncontrado) {
          setPaso(2) // Ya eligió ritual, que elija profesional
        } else if (profesionalEncontrado) {
          setPaso(1) // Sabe el profesional, pero debe elegir qué ritual hacerse con él
        }

      } catch (err) {
        console.error("Error al cargar datos iniciales:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchInicial()
  }, [urlProfessionalId, urlStyleName]) // Se re-ejecuta de manera segura si cambian los parámetros

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

  const getServiceCategoryKey = (categoryName: string): string => {
    if (!categoryName) return 'otros'
    const normalized = categoryName.toLowerCase().trim()
    if (normalized.includes('uña') || normalized.includes('nail') || normalized.includes('manicur')) return 'uñas'
    if (normalized.includes('micro') || normalized.includes('pigment') || normalized.includes('ceja')) return 'micropigmentacion'
    if (normalized.includes('pelu') || normalized.includes('pelo') || normalized.includes('cabello') || normalized.includes('corte')) return 'peluqueria'
    return 'otros'
  }

  const filteredServices = services.filter(serv => {
    if (activeCategory === 'todas') return true
    return getServiceCategoryKey(serv.category) === activeCategory
  })

  const handleFinalizarReserva = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientData.name || !clientData.phone) {
      alert("Por favor introduce tu nombre y teléfono de contacto")
      return
    }

    try {
      setSubmitting(true)
      let client_id = null

      if (user?.id) {
        const { data: clienteAuth } = await supabase
          .from('clients')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (clienteAuth) client_id = clienteAuth.id
      }

      if (!client_id) {
        const { data: clientesEncontrados } = await supabase
          .from('clients')
          .select('id')
          .eq('phone', clientData.phone.trim())

        if (clientesEncontrados && clientesEncontrados.length > 0) {
          client_id = clientesEncontrados[0].id
        }
      }

      if (!client_id) {
        const { data: nuevoClienteData, error: insertClientError } = await supabase
          .from('clients')
          .insert([{ 
            name: clientData.name.trim(), 
            phone: clientData.phone.trim(), 
            email: clientData.email.trim() || null,
            auth_user_id: user?.id || null,
            tenant_id: tenantId,
            points: 0,
            is_active: true
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
            notes: clientData.notes.trim() || null,
            tenant_id: tenantId
          }
        ])

      if (appointmentError) throw appointmentError

      const PUNTOS_POR_CITA = 50

      const { data: walletData, error: walletError } = await supabase
        .from('loyalty_wallets')
        .select('glow_points')
        .eq('client_id', client_id)
        .eq('tenant_id', tenantId)
        .single()

      if (!walletData) {
        await supabase
          .from('loyalty_wallets')
          .insert([{
            client_id: client_id,
            tenant_id: tenantId,
            glow_points: PUNTOS_POR_CITA,
            hair_points: 0,
            created_at: new Date().toISOString()
          }])
      } else {
        await supabase
          .from('loyalty_wallets')
          .update({
            glow_points: (walletData.glow_points || 0) + PUNTOS_POR_CITA,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', client_id)
          .eq('tenant_id', tenantId)
      }

      const { data: misionData } = await supabase
        .from('missions')
        .select('id, points')
        .eq('tenant_id', tenantId)
        .eq('title', 'Agenda una cita')
        .single()

      if (misionData) {
        const hoy = new Date().toISOString().split('T')[0]
        const { data: misionCompletada } = await supabase
          .from('client_missions')
          .select('id')
          .eq('client_id', client_id)
          .eq('mission_id', misionData.id)
          .gte('completed_at', hoy)
          .single()

        if (!misionCompletada) {
          await supabase
            .from('client_missions')
            .insert([{
              client_id: client_id,
              mission_id: misionData.id,
              tenant_id: tenantId,
              completed_at: new Date().toISOString()
            }])

          const { data: walletActual } = await supabase
            .from('loyalty_wallets')
            .select('glow_points')
            .eq('client_id', client_id)
            .eq('tenant_id', tenantId)
            .single()

          if (walletActual) {
            await supabase
              .from('loyalty_wallets')
              .update({
                glow_points: (walletActual.glow_points || 0) + misionData.points,
                updated_at: new Date().toISOString()
              })
              .eq('client_id', client_id)
              .eq('tenant_id', tenantId)
          }
        }
      }

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

  const horasMauna = horariosDisponibles.length > 0 
    ? horariosDisponibles.filter(h => h < '14:00')
    : horariosPorDefecto.filter(h => h < '14:00')

  const horasTarde = horariosDisponibles.length > 0
    ? horariosDisponibles.filter(h => h >= '14:00')
    : horariosPorDefecto.filter(h => h >= '14:00')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin" />
          <Sparkles className="w-5 h-5 text-pink-500 absolute animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen antialiased selection:bg-pink-500/20 pb-24 transition-colors duration-500 ${
      isDark ? 'bg-stone-950 text-stone-100' : 'bg-gradient-to-b from-pink-50/20 via-amber-50/10 to-stone-50/30 text-stone-900'
    }`}>
      <div className="max-w-5xl mx-auto px-4">

        {/* 👑 HERO BANNER ATELIER PRESTIGE */}
        <div className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 shadow-xl mt-4 transition-all duration-300 ${
          isDark 
            ? 'bg-gradient-to-br from-stone-950 via-pink-950/20 to-neutral-950 border-pink-950/40' 
            : 'bg-gradient-to-br from-stone-900 via-pink-600 to-amber-500 border-pink-100'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className={`inline-flex items-center gap-2 border px-3 py-1 rounded-full backdrop-blur-md ${isDark ? 'bg-pink-500/10 border-pink-500/30' : 'bg-white/20 border-white/30'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                <span className={`text-[9px] uppercase tracking-widest font-black ${isDark ? 'text-pink-300' : 'text-white'}`}>Atelier Digital Experience</span>
              </div>
              <h2 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-white'}`}>
                Reserva tu <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-amber-200 to-white">Santuario</span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-pink-100/90 font-medium'}`}>
                Diseña tu sesión de belleza boutique seleccionando el ritual y el especialista ideal.
              </p>
            </div>
            {user && (
              <Link
                href="/reservas"
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border shadow-sm ${
                  isDark 
                    ? 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800' 
                    : 'bg-stone-950 border-stone-900 text-white hover:bg-stone-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-pink-400" />
                Mis Citas VIP →
              </Link>
            )}
          </div>
        </div>

        {/* 🧭 STEPPER GLAM */}
        {paso < 5 && (
          <div className={`flex items-center justify-between gap-2 mt-8 mb-8 p-4 rounded-2xl border ${isDark ? 'bg-stone-900/30 border-stone-900' : 'bg-white/60 border-pink-100/70 shadow-sm backdrop-blur-sm'}`}>
            {[1, 2, 3, 4].map((num) => {
              const isActive = paso === num
              const isCompleted = paso > num
              const labels = ['Servicio', 'Profesional', 'Agenda', 'Confirmar']

              return (
                <div key={num} className="flex-1 flex items-center group">
                  <div className="flex flex-col sm:flex-row items-center gap-2 mx-auto">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-300 border ${
                      isActive 
                        ? 'bg-stone-950 text-white border-stone-900 dark:bg-white dark:text-stone-950 dark:border-white shadow-md scale-105' 
                        : isCompleted 
                          ? 'bg-pink-500 text-white border-pink-500' 
                          : isDark 
                            ? 'bg-stone-950 border-stone-800 text-stone-600' 
                            : 'bg-stone-50 border-stone-200 text-stone-400'
                    }`}>
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : num}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider hidden sm:block ${
                      isActive ? 'text-pink-600 dark:text-pink-400' : isDark ? 'text-stone-500' : 'text-stone-400'
                    }`}>
                      {labels[num - 1]}
                    </span>
                  </div>
                  {num < 4 && (
                    <div className={`w-6 md:w-12 h-[2px] rounded-full mx-auto hidden xs:block ${
                      paso > num ? 'bg-pink-500' : isDark ? 'bg-stone-800' : 'bg-pink-100/80'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 💼 MAIN GRID NUCLEUS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-4">
          <div className="lg:col-span-2 space-y-6">

            {/* STEP 1: SERVICES RITUAL */}
            {paso === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-pink-100/40 dark:border-stone-900 pb-2">
                  <h3 className="text-lg font-black tracking-tight">¿Qué ritual deseas experimentar?</h3>
                  <p className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Elige una categoría para descubrir nuestras especialidades boutique.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.entries(CATEGORIAS_CONFIG).map(([key, config]) => {
                    const IconComponent = config.icon
                    const isSelected = activeCategory === key
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveCategory(key)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-300 space-y-1.5 ${
                          isSelected
                            ? 'bg-stone-950 text-white dark:bg-white dark:text-stone-950 border-stone-950 dark:border-white shadow-md scale-[1.02]'
                            : isDark
                              ? 'bg-stone-900/40 border-stone-900 text-stone-400 hover:bg-stone-900/80'
                              : 'bg-white border-pink-100/60 text-stone-600 hover:border-pink-200 hover:bg-pink-50/20'
                        }`}
                      >
                        <IconComponent className={`w-4 h-4 ${isSelected ? 'text-pink-400 dark:text-pink-600' : 'text-stone-400 group-hover:text-pink-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-wider">{config.label.split(' ')[0]}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="px-1 text-[11px] italic text-stone-500 dark:text-stone-400 font-serif">
                  {CATEGORIAS_CONFIG[activeCategory]?.desc}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredServices.length > 0 ? (
                    filteredServices.map((serv, index) => (
                      <button
                        key={serv.id}
                        onClick={() => { setSelectedService(serv); setPaso(2); }}
                        className={`group relative rounded-2xl border p-5 text-left transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col justify-between min-h-[145px] ${
                          isDark 
                            ? 'bg-stone-900/40 border-stone-900 hover:border-pink-500/20 hover:bg-stone-900/60 shadow-lg' 
                            : 'bg-white border-pink-100/60 hover:border-pink-300 hover:shadow-md'
                        }`}
                      >
                        {index === 0 && activeCategory === 'todas' && (
                          <div className="absolute top-4 right-4 text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Recomendado
                          </div>
                        )}

                        <div className="space-y-1 pr-12">
                          <span className="text-[9px] uppercase font-mono font-black tracking-widest text-pink-500/80 block">
                            {serv.category || 'Servicio'}
                          </span>
                          <h4 className="font-black text-sm tracking-tight text-stone-900 dark:text-stone-200 group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors">
                            {serv.name}
                          </h4>
                          <p className={`text-xs line-clamp-2 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                            {serv.description || 'Tratamiento boutique personalizado con productos orgánicos premium.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-dashed mt-4 pt-3 border-stone-200 dark:border-stone-800/80 w-full">
                          <span className="text-sm font-black font-mono text-pink-600 dark:text-pink-400">
                            ${Number(serv.price).toLocaleString()}
                          </span>
                          <span className={`text-[10px] font-black font-mono uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                            <Clock className="w-3 h-3 text-pink-500" /> {serv.duration} min
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center border border-dashed rounded-2xl border-stone-300 dark:border-stone-800">
                      <p className="text-xs font-serif italic text-stone-400">No encontramos rituales cargados en esta categoría actualmente.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: PROFESSIONAL STAFF */}
            {paso === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-pink-100/40 dark:border-stone-900 pb-3">
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Selecciona tu especialista</h3>
                    <p className="text-xs font-serif italic text-pink-500 dark:text-pink-400">
                      {selectedService?.name} — {selectedService?.duration} minutos de sesión
                    </p>
                  </div>
                  <button onClick={() => setPaso(1)} className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border px-3 py-1.5 rounded-xl transition ${isDark ? 'border-stone-800 hover:bg-stone-900 text-stone-400' : 'border-pink-100 bg-white hover:bg-pink-50/50 text-stone-600'}`}>
                    <X className="w-3 h-3 text-pink-500" /> Cambiar ritual
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {staff.map((prof, index) => (
                    <button
                      key={prof.id}
                      onClick={() => { setSelectedProfessional(prof); setPaso(3); }}
                      className={`group rounded-2xl border p-4 text-left transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-between ${
                        isDark 
                          ? 'bg-stone-900/40 border-stone-900 hover:border-pink-500/20 hover:bg-stone-900/60 shadow-lg' 
                          : 'bg-white border-pink-100/60 hover:border-pink-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm relative ${
                          isDark ? 'bg-stone-950 border border-stone-800 text-pink-400' : 'bg-pink-50 border border-pink-100 text-pink-600 shadow-inner'
                        }`}>
                          {prof.name?.charAt(0).toUpperCase()}
                          {index === 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[7px] text-white font-bold shadow-sm">
                              ★
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-black text-sm tracking-tight text-stone-800 dark:text-stone-200 group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors">
                            {prof.name}
                          </h4>
                          <p className={`text-[11px] font-medium ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                            {prof.specialty || prof.role || 'Estilista Master'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-stone-300 dark:text-stone-700 transition-transform group-hover:translate-x-1`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: CALENDAR & SLOTS */}
            {paso === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-pink-100/40 dark:border-stone-900 pb-3">
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Planifica tu cita</h3>
                    <p className="text-xs font-serif italic text-pink-500 dark:text-pink-400">
                      Con {selectedProfessional?.name} para {selectedService?.name}
                    </p>
                  </div>
                  <button onClick={() => setPaso(2)} className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border px-3 py-1.5 rounded-xl transition ${isDark ? 'border-stone-800 hover:bg-stone-900 text-stone-400' : 'border-pink-100 bg-white hover:bg-pink-50/50 text-stone-600'}`}>
                    <X className="w-3 h-3 text-pink-500" /> Cambiar profesional
                  </button>
                </div>

                <div className={`border rounded-2xl p-6 shadow-xl ${isDark ? 'bg-stone-900/30 border-stone-900' : 'bg-white border-pink-100/60'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-black tracking-widest uppercase font-mono text-stone-800 dark:text-stone-100">
                      {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h4>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
                        disabled={isBefore(startOfMonth(currentMonth), new Date())}
                        className={`p-2 rounded-xl border transition-all disabled:opacity-20 disabled:cursor-not-allowed ${
                          isDark ? 'border-stone-800 text-stone-400 hover:bg-stone-800' : 'border-pink-100 text-stone-600 hover:bg-pink-50/40'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
                        className={`p-2 rounded-xl border transition-all ${
                          isDark ? 'border-stone-800 text-stone-400 hover:bg-stone-800' : 'border-pink-100 text-stone-600 hover:bg-pink-50/40'
                        }`}
                      >
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                      <div key={d} className={`text-[10px] font-black font-mono py-1 text-stone-400 dark:text-stone-500`}>{d}</div>
                    ))}

                    {Array.from({ length: (getDay(diasDelMes[0]) + 6) % 7 }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}

                    {diasDelMes.map((dia, idx) => {
                      const diaStr = format(dia, 'yyyy-MM-dd')
                      const esPasado = isBefore(startOfDay(dia), startOfDay(new Date()))
                      const esSeleccionado = selectedDate === diaStr
                      const noLaborable = esNoLaborable(dia)

                      return (
                        <button
                          key={idx}
                          disabled={esPasado || noLaborable}
                          onClick={() => { setSelectedDate(diaStr); setSelectedTime(''); }}
                          className={`py-2 rounded-xl text-xs font-mono font-bold transition-all relative ${
                            esSeleccionado 
                              ? 'bg-stone-950 text-white border border-stone-950 dark:bg-white dark:text-stone-950 dark:border-white shadow-md font-black scale-105' 
                              : esPasado || noLaborable
                                ? 'text-stone-300 dark:text-stone-800 cursor-not-allowed line-through opacity-30' 
                                : isDark 
                                  ? 'text-stone-300 hover:bg-stone-800 border border-transparent' 
                                  : 'text-stone-600 hover:bg-pink-50/60 border border-transparent hover:border-pink-200'
                          }`}
                        >
                          {format(dia, 'd')}
                          {noLaborable && !esSeleccionado && !esPasado && (
                            <div className="w-1 h-1 mx-auto mt-0.5 rounded-full bg-pink-400/60" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {selectedDate && (
                  <div className={`border rounded-2xl p-6 shadow-xl space-y-6 ${isDark ? 'bg-stone-900/30 border-stone-900' : 'bg-white border-pink-100/60'}`}>
                    <p className={`text-xs font-black font-mono border-b pb-3 flex items-center justify-between ${isDark ? 'text-stone-400 border-stone-800' : 'text-stone-500 border-pink-100/80'}`}>
                      <span className="capitalize font-sans font-black text-sm tracking-tight text-stone-800 dark:text-stone-200">
                        {format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es })}
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase font-mono tracking-widest ${
                        esNoLaborable(parseISO(selectedDate))
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {esNoLaborable(parseISO(selectedDate)) ? 'Cerrado' : 'Disponible'}
                      </span>
                    </p>

                    <div className="space-y-2">
                      <span className="text-[10px] font-black font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500 block">🌅 Turnos Mañana</span>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {horasMauna.map((hora) => {
                          const infoDisp = comprobarDisponibilidad(hora)
                          const seleccionado = selectedTime === hora
                          return (
                            <button
                              key={hora}
                              disabled={!infoDisp.disponible}
                              onClick={() => setSelectedTime(hora)}
                              className={`py-3 rounded-xl text-xs font-mono transition-all border text-center font-bold ${
                                seleccionado
                                  ? 'bg-pink-500 text-white font-black border-pink-500 shadow-md'
                                  : infoDisp.disponible
                                    ? isDark 
                                      ? 'bg-stone-950 border-stone-800 hover:border-pink-500/30 text-stone-300' 
                                      : 'bg-stone-50 border-stone-200 hover:border-pink-400 text-stone-600 hover:bg-white shadow-inner'
                                    : 'bg-stone-100/30 dark:bg-stone-900/20 border-transparent text-stone-400 dark:text-stone-700 cursor-not-allowed line-through opacity-20'
                              }`}
                            >
                              {hora} hs
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-black font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500 block">🌆 Turnos Tarde</span>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {horasTarde.map((hora) => {
                          const infoDisp = comprobarDisponibilidad(hora)
                          const seleccionado = selectedTime === hora
                          return (
                            <button
                              key={hora}
                              disabled={!infoDisp.disponible}
                              onClick={() => setSelectedTime(hora)}
                              className={`py-3 rounded-xl text-xs font-mono transition-all border text-center font-bold ${
                                seleccionado
                                  ? 'bg-pink-500 text-white font-black border-pink-500 shadow-md'
                                  : infoDisp.disponible
                                    ? isDark 
                                      ? 'bg-stone-950 border-stone-800 hover:border-pink-500/30 text-stone-300' 
                                      : 'bg-stone-50 border-stone-200 hover:border-pink-400 text-stone-600 hover:bg-white shadow-inner'
                                    : 'bg-stone-100/30 dark:bg-stone-900/20 border-transparent text-stone-400 dark:text-stone-700 cursor-not-allowed line-through opacity-20'
                              }`}
                            >
                              {hora} hs
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
                    className="w-full py-4 rounded-xl bg-stone-950 text-white dark:bg-white dark:text-stone-950 font-black text-xs tracking-[0.2em] uppercase transition-all duration-300 transform active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg"
                  >
                    CONTINUAR REGISTRO <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* STEP 4: CUSTOMER DATA */}
            {paso === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-pink-100/40 dark:border-stone-900 pb-3">
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Completa tu ficha boutique</h3>
                    <p className="text-xs font-serif italic text-pink-500 dark:text-pink-400">
                      Reserva fijada para el {format(parseISO(selectedDate), "d MMM")} a las {selectedTime} hs
                    </p>
                  </div>
                  <button onClick={() => setPaso(3)} className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border px-3 py-1.5 rounded-xl transition ${isDark ? 'border-stone-800 hover:bg-stone-900 text-stone-400' : 'border-pink-100 bg-white hover:bg-pink-50/50 text-stone-600'}`}>
                    <X className="w-3 h-3 text-pink-500" /> Cambiar horario
                  </button>
                </div>

                <form onSubmit={handleFinalizarReserva} className={`border rounded-2xl p-6 shadow-xl space-y-5 ${isDark ? 'bg-stone-900/30 border-stone-900' : 'bg-white border-pink-100/60'}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">Nombre completo *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
                        <input
                          type="text"
                          required
                          value={clientData.name}
                          onChange={(e) => setClientData({...clientData, name: e.target.value})}
                          className={`w-full border rounded-xl pl-11 pr-4 py-3.5 text-xs font-bold focus:outline-none focus:border-pink-500/50 transition-all ${isDark ? 'bg-stone-950 border-stone-800 text-stone-200' : 'bg-stone-50/50 border-pink-100 text-stone-900'}`}
                          placeholder="Tu nombre completo"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">WhatsApp / Teléfono *</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
                        <input
                          type="tel"
                          required
                          value={clientData.phone}
                          onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                          className={`w-full border rounded-xl pl-11 pr-4 py-3.5 text-xs font-bold focus:outline-none focus:border-pink-500/50 transition-all ${isDark ? 'bg-stone-950 border-stone-800 text-stone-200' : 'bg-stone-50/50 border-pink-100 text-stone-900'}`}
                          placeholder="Ej. 099123456"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
                      <input
                        type="email"
                        value={clientData.email}
                        onChange={(e) => setClientData({...clientData, email: e.target.value})}
                        className={`w-full border rounded-xl pl-11 pr-4 py-3.5 text-xs font-bold focus:outline-none focus:border-pink-500/50 transition-all ${isDark ? 'bg-stone-950 border-stone-800 text-stone-200' : 'bg-stone-50/50 border-pink-100 text-stone-900'}`}
                        placeholder="tu@email.com (para confirmación digital)"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">Preferencias o Notas Especiales</label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
                      <textarea
                        value={clientData.notes}
                        onChange={(e) => setClientData({...clientData, notes: e.target.value})}
                        rows={3}
                        className={`w-full border rounded-xl pl-11 pr-4 py-3.5 text-xs font-bold focus:outline-none focus:border-pink-500/50 transition-all resize-none ${isDark ? 'bg-stone-950 border-stone-800 text-stone-200' : 'bg-stone-50/50 border-pink-100 text-stone-900'}`}
                        placeholder="Indícanos alergias, remoción de producto previo, o cualquier detalle para tu comodidad..."
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 text-white font-black text-xs tracking-[0.2em] uppercase transition-all duration-300 transform active:scale-[0.99] shadow-xl shadow-pink-500/10 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        PROCESANDO REQUISICIÓN...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        CONSOLIDAR CITA VIP
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center font-mono text-stone-400 dark:text-stone-500 tracking-wide">
                    Al procesar, declaras estar de acuerdo con nuestra política de puntualidad y cancelación.
                  </p>
                </form>
              </div>
            )}

            {/* STEP 5: SUCCESS */}
            {paso === 5 && (
              <div className={`border rounded-3xl p-8 text-center max-w-lg mx-auto shadow-2xl relative overflow-hidden animate-scale-up ${isDark ? 'bg-stone-900/30 border-stone-900' : 'bg-white border-pink-100/60'}`}>
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pink-500 via-amber-400 to-pink-500" />

                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-pulse" />
                </div>

                <h3 className="text-2xl font-black tracking-tight mt-5">¡Ritual Agendado!</h3>
                <p className={`text-xs mt-1 font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Tu lugar en el santuario ha sido reservado de forma impecable.
                </p>

                <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500/10 rounded-full border border-pink-500/20 text-pink-500 font-mono text-[10px] font-black uppercase tracking-widest mt-3 animate-bounce">
                  🎉 +50 Puntos Glow Acreditados
                </div>

                <div className={`border rounded-2xl p-4 text-left space-y-3 mt-6 text-xs font-bold border-dashed ${isDark ? 'bg-stone-950/40 border-stone-800' : 'bg-stone-50/60 border-pink-100'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400 dark:text-stone-500 uppercase tracking-wider text-[10px] font-mono">Ritual</span>
                    <span className="text-stone-800 dark:text-stone-200">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400 dark:text-stone-500 uppercase tracking-wider text-[10px] font-mono">Especialista</span>
                    <span className="text-stone-800 dark:text-stone-200">{selectedProfessional?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400 dark:text-stone-500 uppercase tracking-wider text-[10px] font-mono">Fecha</span>
                    <span className="text-stone-800 dark:text-stone-200 capitalize">
                      {format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400 dark:text-stone-500 uppercase tracking-wider text-[10px] font-mono">Bloque Horario</span>
                    <span className="px-2 py-0.5 bg-stone-950 dark:bg-stone-800 text-white rounded font-mono text-[11px]">{selectedTime} hs</span>
                  </div>
                  <div className="flex justify-between items-center pt-2.5 border-t border-stone-200 dark:border-stone-800">
                    <span className="text-stone-500 uppercase tracking-widest text-[10px] font-mono">Inversión Total</span>
                    <span className="text-base font-black font-mono text-pink-600 dark:text-pink-400">${Number(selectedService?.price).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <button
                    onClick={() => {
                      setPaso(1)
                      setSelectedService(null)
                      setSelectedProfessional(null)
                      setSelectedTime('')
                      setClientData({ name: '', phone: '', email: '', notes: '' })
                      setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
                      setActiveCategory('todas')
                    }}
                    className="w-full py-3.5 rounded-xl bg-stone-950 text-white hover:bg-stone-900 text-xs font-black tracking-widest uppercase transition transform active:scale-95 shadow-md border border-stone-800"
                  >
                    AGENDAR NUEVA EXPERIENCIA
                  </button>

                  <Link
                    href="/reservas"
                    className={`block w-full py-3.5 rounded-xl text-xs font-black tracking-widest uppercase text-center border transition ${
                      isDark ? 'border-stone-800 text-stone-300 hover:bg-stone-900' : 'border-pink-100 text-stone-600 bg-white hover:bg-pink-50/30'
                    }`}
                  >
                    VER PANEL DE CITAS
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 🎫 SIDEBAR RESUMEN */}
          {paso < 5 && (
            <div className={`border rounded-2xl p-5 space-y-5 lg:sticky lg:top-6 shadow-xl relative overflow-hidden backdrop-blur-xl ${isDark ? 'bg-stone-900/30 border-stone-900' : 'bg-white border-pink-100/60'}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-500/5 to-transparent rounded-bl-full pointer-events-none" />

              <h3 className={`text-[10px] font-black font-mono uppercase tracking-[0.25em] border-b pb-3 flex items-center gap-2 ${isDark ? 'text-stone-400 border-stone-800' : 'text-stone-500 border-pink-100'}`}>
                <Bookmark className="w-3.5 h-3.5 text-pink-500" /> RESUMEN DE RITUAL
              </h3>

              {selectedService ? (
                <div className="space-y-1 animate-fade-in">
                  <p className="text-[9px] font-black font-mono uppercase tracking-widest text-pink-500 dark:text-pink-400">Tratamiento</p>
                  <p className="text-sm font-black tracking-tight text-stone-800 dark:text-stone-100">{selectedService.name}</p>
                  <div className="flex items-center gap-3 mt-1.5 font-mono text-[11px] font-bold">
                    <span className="flex items-center gap-1 text-stone-400 dark:text-stone-500">
                      <Clock className="w-3 h-3 text-pink-500" /> {selectedService.duration} min
                    </span>
                    <span className="text-pink-600 dark:text-pink-400">
                      ${Number(selectedService.price).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-serif italic text-stone-400 dark:text-stone-500">Por favor escoge un ritual de belleza...</p>
              )}

              {selectedProfessional && (
                <div className={`space-y-1 pt-3.5 border-t border-dashed animate-fade-in ${isDark ? 'border-stone-800' : 'border-pink-100'}`}>
                  <p className="text-[9px] font-black font-mono uppercase tracking-widest text-pink-500 dark:text-pink-400">Master Asignado</p>
                  <p className="text-xs font-black text-stone-800 dark:text-stone-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {selectedProfessional.name}
                  </p>
                </div>
              )}

              {selectedTime && (
                <div className={`space-y-1 pt-3.5 border-t border-dashed animate-fade-in ${isDark ? 'border-stone-800' : 'border-pink-100'}`}>
                  <p className="text-[9px] font-black font-mono uppercase tracking-widest text-pink-500 dark:text-pink-400">Bloque Reservado</p>
                  <p className="text-xs font-black text-stone-800 dark:text-stone-200 capitalize">
                    {format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                  <div className="text-[10px] font-mono font-black mt-1.5 w-fit px-2.5 py-0.5 rounded-lg bg-stone-950 dark:bg-stone-800 text-white tracking-widest">
                    {selectedTime} HS
                  </div>
                </div>
              )}

              {selectedService && (
                <div className={`pt-4 border-t flex items-center justify-between ${isDark ? 'border-stone-800' : 'border-pink-100'}`}>
                  <span className="text-[10px] font-black font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">Total Neto</span>
                  <span className="text-lg font-black font-mono text-pink-600 dark:text-pink-400">
                    ${Number(selectedService.price).toLocaleString()}
                  </span>
                </div>
              )}

              <div className={`pt-3.5 border-t flex items-center gap-2 text-[9px] font-black font-mono tracking-wider ${isDark ? 'text-stone-600 border-stone-800' : 'text-stone-400 border-pink-100'}`}>
                <span className={`flex items-center gap-1 ${paso >= 1 ? 'text-pink-500' : ''}`}>Ritual</span>
                <span>→</span>
                <span className={`flex items-center gap-1 ${paso >= 2 ? 'text-pink-500' : ''}`}>Staff</span>
                <span>→</span>
                <span className={`flex items-center gap-1 ${paso >= 3 ? 'text-pink-500' : ''}`}>Agenda</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
