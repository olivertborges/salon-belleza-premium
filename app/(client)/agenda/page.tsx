// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Calendar as CalendarIcon, Clock, User, Sparkles, ChevronRight, 
  CheckCircle2, ChevronLeft, ChevronRight as ChevronRightIcon,
  Phone, Mail, FileText, Bookmark, 
  Scissors, Heart, ArrowRight, Calendar,
  Star, Award, Zap, Shield, Check, X,
  MessageCircle, MapPin, Gift, Crown,
  Layers, Gem, Compass, Flower2, PartyPopper
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

const CATEGORIAS_CONFIG: Record<string, { label: string; icon: any; desc: string; color: string }> = {
  'todas': { label: 'Todos los Rituales', icon: Layers, desc: 'Explora nuestra colección completa', color: 'from-pink-500 to-rose-500' },
  'uñas': { label: 'Uñas & Manicura', icon: Heart, desc: 'Esculpidas, gel y diseños de alta gama', color: 'from-rose-500 to-pink-500' },
  'micropigmentacion': { label: 'Micropigmentación', icon: Crown, desc: 'Diseño hiperrealista de cejas y labios', color: 'from-amber-500 to-orange-500' },
  'peluqueria': { label: 'Peluquería Boutique', icon: Scissors, desc: 'Cortes exclusivos, colorimetría y brillo', color: 'from-violet-500 to-purple-500' },
  'otros': { label: 'Otros Servicios', icon: Sparkles, desc: 'Cuidado extra para potenciar tu brillo', color: 'from-emerald-500 to-teal-500' }
}

// ✅ COMPONENTE QUE USA useSearchParams - ENVUELTO EN SUSPENSE
function AgendaContent() {
  const { theme } = useTheme()
  const { user, tenantId } = useAuth()
  const isDark = theme === 'dark'

  // 🧭 LECTURA DE URL PARAMS - AHORA DENTRO DE SUSPENSE
  const searchParams = useSearchParams()
  const urlProfessionalId = searchParams?.get('professional') || null
  const urlStyleName = searchParams?.get('style') || null

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

        if (servicioEncontrado && profesionalEncontrado) {
          setPaso(3)
        } else if (servicioEncontrado) {
          setPaso(2)
        } else if (profesionalEncontrado) {
          setPaso(1)
        }

      } catch (err) {
        console.error("Error al cargar datos iniciales:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchInicial()
  }, [urlProfessionalId, urlStyleName])

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
      <div className="flex items-center justify-center min-h-[60vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute w-48 h-48 bg-amber-500/5 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite] delay-300" />
        <div className="relative flex flex-col items-center justify-center gap-4 bg-white/5 backdrop-blur-2xl px-10 py-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
            <Sparkles className="w-5 h-5 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 animate-pulse">
            Cargando Santuario...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen antialiased selection:bg-pink-500/20 pb-24 transition-colors duration-700 ${
      isDark ? 'bg-gradient-to-b from-stone-950 via-stone-950/95 to-stone-950 text-stone-100' : 'bg-gradient-to-b from-pink-50/20 via-amber-50/10 to-stone-50/30 text-stone-900'
    }`}>
      <div className="max-w-6xl mx-auto px-4">

        {/* 👑 HERO BANNER ATELIER PRESTIGE — EDICIÓN LUXURY */}
        <div className={`relative overflow-hidden rounded-3xl border p-7 md:p-10 shadow-2xl mt-6 transition-all duration-500 ${
          isDark 
            ? 'bg-gradient-to-br from-stone-950 via-pink-950/20 to-neutral-950 border-pink-950/30 shadow-[0_20px_60px_rgba(0,0,0,0.6)]' 
            : 'bg-gradient-to-br from-stone-900 via-pink-800 to-amber-600 border-pink-200/30 shadow-[0_20px_60px_rgba(219,91,154,0.15)]'
        }`}>
          {/* Efectos de luz ambiental */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/15 rounded-full blur-[120px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/10 rounded-full blur-[100px] pointer-events-none animate-[pulse_10s_ease-in-out_infinite] delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />
          
          {/* Rejilla decorativa */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_transparent_0%,_white_100%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              {/* Badge */}
              <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full backdrop-blur-xl border ${
                isDark ? 'bg-pink-500/10 border-pink-500/20' : 'bg-white/20 border-white/30'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                <span className={`text-[8px] uppercase tracking-[0.25em] font-black ${
                  isDark ? 'text-pink-300' : 'text-white'
                }`}>
                  ✦ Atelier Digital Experience ✦
                </span>
              </div>

              <h2 className={`text-3xl md:text-5xl font-black tracking-tight leading-[1.1] ${
                isDark ? 'text-white' : 'text-white'
              }`}>
                Reserva tu{' '}
                <span className="font-serif italic font-light text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-amber-200 to-white bg-[length:200%_auto] animate-[gradient_4s_ease-in-out_infinite]">
                  Santuario
                </span>
              </h2>
              <p className={`text-xs font-medium tracking-wide max-w-md ${
                isDark ? 'text-stone-400' : 'text-pink-100/90'
              }`}>
                Diseña tu sesión de belleza boutique seleccionando el ritual y el especialista ideal para potenciar tu esencia.
              </p>
            </div>
            
            {user && (
              <Link
                href="/reservas"
                className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2.5 border shadow-lg group ${
                  isDark 
                    ? 'bg-stone-900/80 border-stone-800/80 text-stone-300 hover:bg-stone-800/80 hover:border-pink-500/30 hover:text-white' 
                    : 'bg-stone-950/80 border-stone-800/80 text-white hover:bg-stone-900 hover:border-pink-300/30'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-pink-400 group-hover:rotate-12 transition-transform duration-300" />
                Mis Citas VIP
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>

        {/* 🧭 STEPPER GLAM — REDISEÑADO */}
        {paso < 5 && (
          <div className={`flex items-center justify-between gap-2 mt-8 mb-8 p-4 md:p-5 rounded-2xl border shadow-lg ${
            isDark 
              ? 'bg-stone-900/40 border-stone-900/60 shadow-black/30' 
              : 'bg-white/80 border-pink-100/60 shadow-pink-200/20 backdrop-blur-sm'
          }`}>
            {[1, 2, 3, 4].map((num) => {
              const isActive = paso === num
              const isCompleted = paso > num
              const labels = ['Ritual', 'Especialista', 'Agenda', 'Confirmar']

              return (
                <div key={num} className="flex-1 flex items-center group">
                  <div className="flex flex-col sm:flex-row items-center gap-2 mx-auto">
                    <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-500 border ${
                      isActive 
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-500 shadow-lg shadow-pink-500/30 scale-110' 
                        : isCompleted 
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' 
                          : isDark 
                            ? 'bg-stone-950 border-stone-800 text-stone-600' 
                            : 'bg-stone-50 border-stone-200 text-stone-400'
                    }`}>
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : num}
                      {isActive && (
                        <span className="absolute -inset-1 rounded-xl bg-pink-500/20 blur-md -z-10 animate-pulse" />
                      )}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-[0.15em] hidden sm:block ${
                      isActive ? 'text-pink-600 dark:text-pink-400' : isCompleted ? 'text-emerald-500 dark:text-emerald-400' : isDark ? 'text-stone-500' : 'text-stone-400'
                    }`}>
                      {labels[num - 1]}
                    </span>
                  </div>
                  {num < 4 && (
                    <div className={`w-8 md:w-16 h-[2px] rounded-full mx-auto hidden xs:block transition-all duration-500 ${
                      paso > num ? 'bg-gradient-to-r from-pink-500 to-rose-500' : isDark ? 'bg-stone-800' : 'bg-pink-100/80'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 💼 MAIN GRID NUCLEUS — CON ESPACIADO PREMIUM */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-4">
          <div className="lg:col-span-2 space-y-6">

            {/* STEP 1: SERVICES RITUAL — REDISEÑADO */}
            {paso === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className={`border-b pb-3 ${
                  isDark ? 'border-stone-900' : 'border-pink-100/40'
                }`}>
                  <h3 className="text-xl font-black tracking-tight">¿Qué ritual deseas experimentar?</h3>
                  <p className={`text-xs font-medium mt-0.5 ${
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  }`}>
                    Elige una categoría para descubrir nuestras especialidades boutique.
                  </p>
                </div>

                {/* Categorías — con efecto premium */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {Object.entries(CATEGORIAS_CONFIG).map(([key, config]) => {
                    const IconComponent = config.icon
                    const isSelected = activeCategory === key
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveCategory(key)}
                        className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all duration-500 space-y-2 group ${
                          isSelected
                            ? `bg-gradient-to-br ${config.color} text-white border-transparent shadow-xl shadow-${key === 'todas' ? 'pink' : key === 'uñas' ? 'rose' : key === 'micropigmentacion' ? 'amber' : key === 'peluqueria' ? 'violet' : 'emerald'}-500/20 scale-[1.02]`
                            : isDark
                              ? 'bg-stone-900/40 border-stone-900 text-stone-400 hover:border-stone-700 hover:bg-stone-900/80'
                              : 'bg-white border-pink-100/60 text-stone-600 hover:border-pink-300 hover:bg-pink-50/30'
                        }`}
                      >
                        <IconComponent className={`w-5 h-5 transition-all duration-300 ${
                          isSelected ? 'text-white' : 'text-stone-400 group-hover:text-pink-500'
                        }`} />
                        <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${
                          isSelected ? 'text-white' : 'text-stone-500'
                        }`}>
                          {config.label.split(' ')[0]}
                        </span>
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white/40 animate-ping" />
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className={`px-1 py-2 text-[11px] italic font-serif ${
                  isDark ? 'text-stone-400' : 'text-stone-500'
                }`}>
                  {CATEGORIAS_CONFIG[activeCategory]?.desc}
                </div>

                {/* Grid de servicios — con tarjetas premium */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredServices.length > 0 ? (
                    filteredServices.map((serv, index) => {
                      const categoryKey = getServiceCategoryKey(serv.category)
                      const categoryConfig = CATEGORIAS_CONFIG[categoryKey] || CATEGORIAS_CONFIG['otros']
                      
                      return (
                        <button
                          key={serv.id}
                          onClick={() => { setSelectedService(serv); setPaso(2); }}
                          className={`group relative rounded-2xl border p-5 text-left transition-all duration-500 transform hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between min-h-[160px] overflow-hidden ${
                            isDark 
                              ? 'bg-stone-900/40 border-stone-900 hover:border-pink-500/30 hover:bg-stone-900/60 shadow-lg' 
                              : 'bg-white border-pink-100/60 hover:border-pink-300 hover:shadow-xl shadow-md'
                          }`}
                        >
                          {/* Gradiente de fondo sutil */}
                          <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${categoryConfig.color}`} />
                          
                          {/* Badge recomendado */}
                          {index === 0 && activeCategory === 'todas' && (
                            <div className="absolute top-4 right-4 z-10 text-[7px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-400/30 shadow-lg shadow-amber-500/20">
                              ★ Recomendado
                            </div>
                          )}

                          {/* Icono de categoría */}
                          <div className={`absolute top-4 right-4 opacity-5 group-hover:opacity-20 transition-opacity duration-500`}>
                            {React.createElement(categoryConfig.icon, { className: 'w-12 h-12' })}
                          </div>

                          <div className="space-y-1.5 pr-12 z-10">
                            <span className={`text-[8px] uppercase font-mono font-black tracking-[0.2em] ${
                              isDark ? 'text-pink-500/80' : 'text-pink-500'
                            }`}>
                              {serv.category || 'Servicio'}
                            </span>
                            <h4 className={`font-black text-sm tracking-tight transition-colors ${
                              isDark ? 'text-stone-200 group-hover:text-pink-400' : 'text-stone-900 group-hover:text-pink-600'
                            }`}>
                              {serv.name}
                            </h4>
                            <p className={`text-xs line-clamp-2 ${
                              isDark ? 'text-stone-400' : 'text-stone-500'
                            }`}>
                              {serv.description || 'Tratamiento boutique personalizado con productos orgánicos premium.'}
                            </p>
                          </div>

                          <div className={`flex items-center justify-between border-t border-dashed mt-4 pt-3 w-full z-10 ${
                            isDark ? 'border-stone-800/80' : 'border-stone-200'
                          }`}>
                            <span className={`text-sm font-black font-mono ${
                              isDark ? 'text-pink-400' : 'text-pink-600'
                            }`}>
                              ${Number(serv.price).toLocaleString()}
                            </span>
                            <span className={`text-[9px] font-black font-mono uppercase tracking-wider flex items-center gap-1.5 ${
                              isDark ? 'text-stone-500' : 'text-stone-400'
                            }`}>
                              <Clock className="w-3 h-3 text-pink-500" /> {serv.duration} min
                            </span>
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    <div className={`col-span-full py-16 text-center border border-dashed rounded-2xl ${
                      isDark ? 'border-stone-800 bg-stone-900/20' : 'border-stone-300 bg-stone-50/30'
                    }`}>
                      <Sparkles className="w-8 h-8 text-stone-400 mx-auto mb-3 opacity-30" />
                      <p className="text-xs font-serif italic text-stone-400">No encontramos rituales cargados en esta categoría actualmente.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: PROFESSIONAL STAFF — REDISEÑADO */}
            {paso === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4 ${
                  isDark ? 'border-stone-900' : 'border-pink-100/40'
                }`}>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Selecciona tu especialista</h3>
                    <p className={`text-xs font-serif italic mt-0.5 ${
                      isDark ? 'text-pink-400' : 'text-pink-500'
                    }`}>
                      {selectedService?.name} — {selectedService?.duration} minutos de sesión
                    </p>
                  </div>
                  <button 
                    onClick={() => setPaso(1)} 
                    className={`text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 border px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-95 ${
                      isDark ? 'border-stone-800 hover:bg-stone-900 text-stone-400' : 'border-pink-200 bg-white hover:bg-pink-50/50 text-stone-600'
                    }`}
                  >
                    <X className="w-3 h-3 text-pink-500" /> Cambiar ritual
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {staff.map((prof, index) => (
                    <button
                      key={prof.id}
                      onClick={() => { setSelectedProfessional(prof); setPaso(3); }}
                      className={`group rounded-2xl border p-5 text-left transition-all duration-500 transform hover:-translate-y-1.5 hover:shadow-2xl flex items-center justify-between relative overflow-hidden ${
                        isDark 
                          ? 'bg-stone-900/40 border-stone-900 hover:border-pink-500/30 hover:bg-stone-900/60 shadow-lg' 
                          : 'bg-white border-pink-100/60 hover:border-pink-300 hover:shadow-xl shadow-md'
                      }`}
                    >
                      {/* Efecto de gradiente */}
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-br ${
                        index === 0 ? 'from-amber-500 to-orange-500' : 'from-pink-500 to-rose-500'
                      }`} />

                      <div className="flex items-center gap-4 z-10">
                        <div className={`relative w-14 h-14 rounded-xl flex items-center justify-center font-black text-lg transition-all duration-500 group-hover:scale-105 ${
                          isDark 
                            ? `bg-gradient-to-br ${index === 0 ? 'from-amber-500/20 to-orange-500/20' : 'from-pink-500/20 to-rose-500/20'} border ${index === 0 ? 'border-amber-500/30' : 'border-pink-500/30'} text-pink-400` 
                            : `bg-gradient-to-br ${index === 0 ? 'from-amber-50 to-orange-50' : 'from-pink-50 to-rose-50'} border ${index === 0 ? 'border-amber-200' : 'border-pink-200'} text-pink-600 shadow-inner`
                        }`}>
                          {prof.name?.charAt(0).toUpperCase()}
                          {index === 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center text-[7px] text-white font-black shadow-lg shadow-amber-500/20 animate-pulse">
                              ★
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className={`font-black text-sm tracking-tight transition-colors ${
                            isDark ? 'text-stone-200 group-hover:text-pink-400' : 'text-stone-800 group-hover:text-pink-600'
                          }`}>
                            {prof.name}
                          </h4>
                          <p className={`text-[10px] font-medium ${
                            isDark ? 'text-stone-500' : 'text-stone-400'
                          }`}>
                            {prof.specialty || prof.role || 'Estilista Master'}
                          </p>
                          {index === 0 && (
                            <span className="inline-block text-[7px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white mt-1">
                              Top Rating
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-all duration-300 group-hover:translate-x-1 ${
                        isDark ? 'text-stone-600' : 'text-stone-300'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: CALENDAR & SLOTS — REDISEÑADO */}
            {paso === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4 ${
                  isDark ? 'border-stone-900' : 'border-pink-100/40'
                }`}>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Planifica tu cita</h3>
                    <p className={`text-xs font-serif italic mt-0.5 ${
                      isDark ? 'text-pink-400' : 'text-pink-500'
                    }`}>
                      Con {selectedProfessional?.name} para {selectedService?.name}
                    </p>
                  </div>
                  <button onClick={() => setPaso(2)} className={`text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 border px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-95 ${
                    isDark ? 'border-stone-800 hover:bg-stone-900 text-stone-400' : 'border-pink-200 bg-white hover:bg-pink-50/50 text-stone-600'
                  }`}>
                    <X className="w-3 h-3 text-pink-500" /> Cambiar profesional
                  </button>
                </div>

                {/* Calendario — con efecto premium */}
                <div className={`border rounded-2xl p-6 md:p-8 shadow-2xl transition-all duration-500 ${
                  isDark ? 'bg-stone-900/40 border-stone-900/60 shadow-black/40' : 'bg-white border-pink-100/60 shadow-pink-200/20'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <h4 className={`text-sm font-black tracking-[0.15em] uppercase font-mono ${
                      isDark ? 'text-stone-100' : 'text-stone-800'
                    }`}>
                      {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
                        disabled={isBefore(startOfMonth(currentMonth), new Date())}
                        className={`p-2.5 rounded-xl border transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed hover:scale-105 ${
                          isDark ? 'border-stone-800 text-stone-400 hover:bg-stone-800' : 'border-pink-200 text-stone-600 hover:bg-pink-50/40'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
                        className={`p-2.5 rounded-xl border transition-all duration-300 hover:scale-105 ${
                          isDark ? 'border-stone-800 text-stone-400 hover:bg-stone-800' : 'border-pink-200 text-stone-600 hover:bg-pink-50/40'
                        }`}
                      >
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Grid de días — con diseño premium */}
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                      <div key={d} className={`text-[9px] font-black font-mono py-2 ${
                        isDark ? 'text-stone-500' : 'text-stone-400'
                      }`}>{d}</div>
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
                          className={`relative py-2.5 rounded-xl text-xs font-mono font-bold transition-all duration-300 ${
                            esSeleccionado 
                              ? `bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 scale-105 font-black border-0` 
                              : esPasado || noLaborable
                                ? `text-stone-400 dark:text-stone-800 cursor-not-allowed line-through opacity-25` 
                                : isDark 
                                  ? `text-stone-300 hover:bg-stone-800 hover:border-pink-500/30 border border-transparent` 
                                  : `text-stone-600 hover:bg-pink-50/60 border border-transparent hover:border-pink-200`
                          }`}
                        >
                          {format(dia, 'd')}
                          {noLaborable && !esSeleccionado && !esPasado && (
                            <div className="w-1 h-1 mx-auto mt-0.5 rounded-full bg-pink-400/60" />
                          )}
                          {esSeleccionado && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Horarios — con diseño mejorado */}
                {selectedDate && (
                  <div className={`border rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 transition-all duration-500 ${
                    isDark ? 'bg-stone-900/40 border-stone-900/60 shadow-black/40' : 'bg-white border-pink-100/60 shadow-pink-200/20'
                  }`}>
                    <p className={`text-xs font-black font-mono border-b pb-4 flex items-center justify-between ${
                      isDark ? 'text-stone-400 border-stone-800' : 'text-stone-500 border-pink-100/80'
                    }`}>
                      <span className="capitalize font-sans font-black text-sm tracking-tight text-stone-800 dark:text-stone-200">
                        {format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es })}
                      </span>
                      <span className={`text-[9px] px-3 py-1 rounded-full uppercase font-mono tracking-[0.15em] border ${
                        esNoLaborable(parseISO(selectedDate))
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      }`}>
                        {esNoLaborable(parseISO(selectedDate)) ? 'Cerrado' : 'Disponible'}
                      </span>
                    </p>

                    {/* Mañana */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-400 to-orange-400" />
                        <span className={`text-[9px] font-black font-mono uppercase tracking-[0.2em] ${
                          isDark ? 'text-stone-400' : 'text-stone-500'
                        }`}>🌅 Turnos Mañana</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {horasMauna.map((hora) => {
                          const infoDisp = comprobarDisponibilidad(hora)
                          const seleccionado = selectedTime === hora
                          return (
                            <button
                              key={hora}
                              disabled={!infoDisp.disponible}
                              onClick={() => setSelectedTime(hora)}
                              className={`py-3.5 rounded-xl text-xs font-mono transition-all duration-300 border text-center font-bold ${
                                seleccionado
                                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black border-pink-500 shadow-lg shadow-pink-500/30 scale-105'
                                  : infoDisp.disponible
                                    ? isDark 
                                      ? 'bg-stone-950 border-stone-800 hover:border-pink-500/30 hover:bg-stone-800 text-stone-300' 
                                      : 'bg-stone-50 border-stone-200 hover:border-pink-400 hover:bg-white text-stone-600 shadow-sm hover:shadow-md'
                                    : 'bg-stone-100/30 dark:bg-stone-900/20 border-transparent text-stone-400 dark:text-stone-700 cursor-not-allowed line-through opacity-20'
                              }`}
                            >
                              {hora} hs
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Tarde */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-400 to-purple-400" />
                        <span className={`text-[9px] font-black font-mono uppercase tracking-[0.2em] ${
                          isDark ? 'text-stone-400' : 'text-stone-500'
                        }`}>🌆 Turnos Tarde</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {horasTarde.map((hora) => {
                          const infoDisp = comprobarDisponibilidad(hora)
                          const seleccionado = selectedTime === hora
                          return (
                            <button
                              key={hora}
                              disabled={!infoDisp.disponible}
                              onClick={() => setSelectedTime(hora)}
                              className={`py-3.5 rounded-xl text-xs font-mono transition-all duration-300 border text-center font-bold ${
                                seleccionado
                                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black border-pink-500 shadow-lg shadow-pink-500/30 scale-105'
                                  : infoDisp.disponible
                                    ? isDark 
                                      ? 'bg-stone-950 border-stone-800 hover:border-pink-500/30 hover:bg-stone-800 text-stone-300' 
                                      : 'bg-stone-50 border-stone-200 hover:border-pink-400 hover:bg-white text-stone-600 shadow-sm hover:shadow-md'
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
                    className={`w-full py-4.5 rounded-xl font-black text-xs tracking-[0.2em] uppercase transition-all duration-500 transform active:scale-[0.98] hover:-translate-y-0.5 flex items-center justify-center gap-3 shadow-2xl group relative overflow-hidden ${
                      isDark 
                        ? 'bg-gradient-to-r from-white to-stone-200 text-stone-950 hover:shadow-xl hover:shadow-white/10' 
                        : 'bg-gradient-to-r from-stone-950 to-stone-800 text-white hover:shadow-xl hover:shadow-stone-900/20'
                    }`}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
                    <span className="relative flex items-center gap-2">
                      CONTINUAR REGISTRO
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* STEP 4: CUSTOMER DATA — REDISEÑADO */}
            {paso === 4 && (
              <div className="space-y-5 animate-fade-in">
                <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4 ${
                  isDark ? 'border-stone-900' : 'border-pink-100/40'
                }`}>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Completa tu ficha boutique</h3>
                    <p className={`text-xs font-serif italic mt-0.5 ${
                      isDark ? 'text-pink-400' : 'text-pink-500'
                    }`}>
                      Reserva fijada para el {format(parseISO(selectedDate), "d MMM")} a las {selectedTime} hs
                    </p>
                  </div>
                  <button onClick={() => setPaso(3)} className={`text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 border px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-95 ${
                    isDark ? 'border-stone-800 hover:bg-stone-900 text-stone-400' : 'border-pink-200 bg-white hover:bg-pink-50/50 text-stone-600'
                  }`}>
                    <X className="w-3 h-3 text-pink-500" /> Cambiar horario
                  </button>
                </div>

                <form onSubmit={handleFinalizarReserva} className={`border rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 transition-all duration-500 ${
                  isDark ? 'bg-stone-900/40 border-stone-900/60 shadow-black/40' : 'bg-white border-pink-100/60 shadow-pink-200/20'
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Nombre */}
                    <div className="space-y-2">
                      <label className={`block text-[9px] font-black font-mono uppercase tracking-[0.2em] ${
                        isDark ? 'text-stone-400' : 'text-stone-500'
                      }`}>
                        Nombre completo <span className="text-pink-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                          clientData.name ? 'text-pink-500' : 'text-stone-400 group-focus-within:text-pink-500'
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={clientData.name}
                          onChange={(e) => setClientData({...clientData, name: e.target.value})}
                          className={`w-full border rounded-xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-pink-500/50 transition-all duration-300 ${
                            isDark 
                              ? 'bg-stone-950/60 border-stone-800/80 text-stone-200 focus:bg-stone-950' 
                              : 'bg-stone-50/60 border-pink-200/60 text-stone-900 focus:bg-white'
                          }`}
                          placeholder="Tu nombre completo"
                        />
                        <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500 ${
                          clientData.name ? 'w-full' : 'w-0'
                        }`} />
                      </div>
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-2">
                      <label className={`block text-[9px] font-black font-mono uppercase tracking-[0.2em] ${
                        isDark ? 'text-stone-400' : 'text-stone-500'
                      }`}>
                        WhatsApp / Teléfono <span className="text-pink-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                          clientData.phone ? 'text-pink-500' : 'text-stone-400 group-focus-within:text-pink-500'
                        }`}>
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          required
                          value={clientData.phone}
                          onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                          className={`w-full border rounded-xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-pink-500/50 transition-all duration-300 ${
                            isDark 
                              ? 'bg-stone-950/60 border-stone-800/80 text-stone-200 focus:bg-stone-950' 
                              : 'bg-stone-50/60 border-pink-200/60 text-stone-900 focus:bg-white'
                          }`}
                          placeholder="Ej. 099123456"
                        />
                        <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500 ${
                          clientData.phone ? 'w-full' : 'w-0'
                        }`} />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className={`block text-[9px] font-black font-mono uppercase tracking-[0.2em] ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}>
                      Correo Electrónico
                    </label>
                    <div className="relative group">
                      <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                        clientData.email ? 'text-pink-500' : 'text-stone-400 group-focus-within:text-pink-500'
                      }`}>
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={clientData.email}
                        onChange={(e) => setClientData({...clientData, email: e.target.value})}
                        className={`w-full border rounded-xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-pink-500/50 transition-all duration-300 ${
                          isDark 
                            ? 'bg-stone-950/60 border-stone-800/80 text-stone-200 focus:bg-stone-950' 
                            : 'bg-stone-50/60 border-pink-200/60 text-stone-900 focus:bg-white'
                        }`}
                        placeholder="tu@email.com (para confirmación digital)"
                      />
                      <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500 ${
                        clientData.email ? 'w-full' : 'w-0'
                      }`} />
                    </div>
                  </div>

                  {/* Notas */}
                  <div className="space-y-2">
                    <label className={`block text-[9px] font-black font-mono uppercase tracking-[0.2em] ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}>
                      Preferencias o Notas Especiales
                    </label>
                    <div className="relative group">
                      <div className={`absolute left-4 top-4 transition-colors duration-300 ${
                        clientData.notes ? 'text-pink-500' : 'text-stone-400 group-focus-within:text-pink-500'
                      }`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <textarea
                        value={clientData.notes}
                        onChange={(e) => setClientData({...clientData, notes: e.target.value})}
                        rows={3}
                        className={`w-full border rounded-xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-pink-500/50 transition-all duration-300 resize-none ${
                          isDark 
                            ? 'bg-stone-950/60 border-stone-800/80 text-stone-200 focus:bg-stone-950' 
                            : 'bg-stone-50/60 border-pink-200/60 text-stone-900 focus:bg-white'
                        }`}
                        placeholder="Indícanos alergias, remoción de producto previo, o cualquier detalle para tu comodidad..."
                      />
                      <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500 ${
                        clientData.notes ? 'w-full' : 'w-0'
                      }`} />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-4.5 rounded-xl font-black text-xs tracking-[0.2em] uppercase transition-all duration-500 transform active:scale-[0.98] hover:-translate-y-0.5 flex items-center justify-center gap-3 shadow-2xl group relative overflow-hidden ${
                      isDark 
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/30 hover:shadow-pink-500/50' 
                        : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/30 hover:shadow-pink-500/50'
                    }`}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        PROCESANDO REQUISICIÓN...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        CONSOLIDAR CITA VIP
                      </>
                    )}
                  </button>

                  <p className={`text-[9px] text-center font-mono tracking-wide ${
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  }`}>
                    Al procesar, declaras estar de acuerdo con nuestra política de puntualidad y cancelación.
                  </p>
                </form>
              </div>
            )}

            {/* STEP 5: SUCCESS — REDISEÑADO */}
            {paso === 5 && (
              <div className={`border rounded-3xl p-8 md:p-10 text-center max-w-lg mx-auto shadow-2xl relative overflow-hidden animate-scale-up ${
                isDark ? 'bg-stone-900/40 border-stone-900/60 shadow-black/40' : 'bg-white border-pink-100/60 shadow-pink-200/20'
              }`}>
                {/* Línea superior */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pink-500 via-amber-400 to-rose-500" />
                
                {/* Fondo decorativo */}
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-pink-500/5 rounded-full blur-2xl" />
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl" />

                <div className="relative z-10">
                  {/* Icono de éxito */}
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto border shadow-xl ${
                    isDark 
                      ? 'bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/10' 
                      : 'bg-emerald-50 border-emerald-200 shadow-emerald-200/30'
                  }`}>
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-[pulse_2s_ease-in-out_infinite]" />
                  </div>

                  <h3 className="text-3xl font-black tracking-tight mt-6">¡Ritual Agendado!</h3>
                  <p className={`text-sm mt-1.5 font-medium ${
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  }`}>
                    Tu lugar en el santuario ha sido reservado de forma impecable.
                  </p>

                  {/* Badge de puntos */}
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-full border border-pink-500/20 text-pink-500 font-mono text-[10px] font-black uppercase tracking-[0.15em] mt-4 animate-bounce">
                    <Sparkles className="w-3.5 h-3.5" />
                    +50 Puntos Glow Acreditados
                  </div>

                  {/* Resumen */}
                  <div className={`border rounded-2xl p-5 text-left space-y-3 mt-6 text-sm font-bold ${
                    isDark ? 'bg-stone-950/60 border-stone-800/60' : 'bg-stone-50/80 border-pink-200/60'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] font-black font-mono uppercase tracking-[0.15em] ${
                        isDark ? 'text-stone-500' : 'text-stone-400'
                      }`}>Ritual</span>
                      <span className={`${
                        isDark ? 'text-stone-200' : 'text-stone-800'
                      }`}>{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] font-black font-mono uppercase tracking-[0.15em] ${
                        isDark ? 'text-stone-500' : 'text-stone-400'
                      }`}>Especialista</span>
                      <span className={`${
                        isDark ? 'text-stone-200' : 'text-stone-800'
                      }`}>{selectedProfessional?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] font-black font-mono uppercase tracking-[0.15em] ${
                        isDark ? 'text-stone-500' : 'text-stone-400'
                      }`}>Fecha</span>
                      <span className={`capitalize ${
                        isDark ? 'text-stone-200' : 'text-stone-800'
                      }`}>
                        {format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] font-black font-mono uppercase tracking-[0.15em] ${
                        isDark ? 'text-stone-500' : 'text-stone-400'
                      }`}>Bloque Horario</span>
                      <span className={`px-3 py-1 rounded-lg font-mono text-xs font-black ${
                        isDark ? 'bg-stone-800 text-white' : 'bg-stone-900 text-white'
                      }`}>
                        {selectedTime} hs
                      </span>
                    </div>
                    <div className={`flex justify-between items-center pt-3 border-t ${
                      isDark ? 'border-stone-800' : 'border-stone-200'
                    }`}>
                      <span className={`text-[9px] font-black font-mono uppercase tracking-[0.15em] ${
                        isDark ? 'text-stone-500' : 'text-stone-400'
                      }`}>Inversión Total</span>
                      <span className="text-xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
                        ${Number(selectedService?.price).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Botones */}
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
                      className={`w-full py-4 rounded-xl font-black text-[10px] tracking-[0.2em] uppercase transition-all duration-500 transform active:scale-[0.98] hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-xl group relative overflow-hidden ${
                        isDark 
                          ? 'bg-stone-800 text-white hover:bg-stone-700 border border-stone-700' 
                          : 'bg-stone-900 text-white hover:bg-stone-800 border border-stone-800'
                      }`}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
                      <PartyPopper className="w-4 h-4 text-amber-400" />
                      AGENDAR NUEVA EXPERIENCIA
                    </button>

                    <Link
                      href="/reservas"
                      className={`block w-full py-4 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase text-center border transition-all duration-300 hover:scale-[1.01] ${
                        isDark 
                          ? 'border-stone-800 text-stone-300 hover:bg-stone-900/50' 
                          : 'border-pink-200 text-stone-600 bg-white hover:bg-pink-50/30'
                      }`}
                    >
                      VER PANEL DE CITAS
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 🎫 SIDEBAR RESUMEN — REDISEÑADO */}
          {paso < 5 && (
            <div className={`border rounded-2xl p-6 space-y-5 lg:sticky lg:top-6 shadow-2xl relative overflow-hidden backdrop-blur-xl transition-all duration-500 ${
              isDark ? 'bg-stone-900/40 border-stone-900/60 shadow-black/40' : 'bg-white/90 border-pink-100/60 shadow-pink-200/20'
            }`}>
              {/* Decoración */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-500/5 to-transparent rounded-bl-full pointer-events-none" />
              
              <h3 className={`text-[9px] font-black font-mono uppercase tracking-[0.25em] border-b pb-4 flex items-center gap-2 ${
                isDark ? 'text-stone-400 border-stone-800' : 'text-stone-500 border-pink-200/60'
              }`}>
                <Bookmark className="w-3.5 h-3.5 text-pink-500" /> RESUMEN DE RITUAL
              </h3>

              {selectedService ? (
                <div className="space-y-1.5 animate-fade-in">
                  <p className={`text-[8px] font-black font-mono uppercase tracking-[0.2em] ${
                    isDark ? 'text-pink-400' : 'text-pink-500'
                  }`}>Tratamiento</p>
                  <p className={`text-sm font-black tracking-tight ${
                    isDark ? 'text-stone-100' : 'text-stone-800'
                  }`}>{selectedService.name}</p>
                  <div className="flex items-center gap-3 mt-2 font-mono text-xs font-bold">
                    <span className={`flex items-center gap-1 ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}>
                      <Clock className="w-3 h-3 text-pink-500" /> {selectedService.duration} min
                    </span>
                    <span className={`${
                      isDark ? 'text-pink-400' : 'text-pink-600'
                    }`}>
                      ${Number(selectedService.price).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <p className={`text-xs font-serif italic ${
                  isDark ? 'text-stone-500' : 'text-stone-400'
                }`}>Por favor escoge un ritual de belleza...</p>
              )}

              {selectedProfessional && (
                <div className={`space-y-1 pt-4 border-t border-dashed animate-fade-in ${
                  isDark ? 'border-stone-800' : 'border-pink-200/40'
                }`}>
                  <p className={`text-[8px] font-black font-mono uppercase tracking-[0.2em] ${
                    isDark ? 'text-pink-400' : 'text-pink-500'
                  }`}>Master Asignado</p>
                  <p className={`text-sm font-black flex items-center gap-2 ${
                    isDark ? 'text-stone-100' : 'text-stone-800'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {selectedProfessional.name}
                  </p>
                </div>
              )}

              {selectedTime && (
                <div className={`space-y-1 pt-4 border-t border-dashed animate-fade-in ${
                  isDark ? 'border-stone-800' : 'border-pink-200/40'
                }`}>
                  <p className={`text-[8px] font-black font-mono uppercase tracking-[0.2em] ${
                    isDark ? 'text-pink-400' : 'text-pink-500'
                  }`}>Bloque Reservado</p>
                  <p className={`text-sm font-black capitalize ${
                    isDark ? 'text-stone-100' : 'text-stone-800'
                  }`}>
                    {format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                  <div className={`text-[10px] font-mono font-black mt-2 w-fit px-3 py-1 rounded-lg ${
                    isDark ? 'bg-stone-800 text-white' : 'bg-stone-900 text-white'
                  }`}>
                    {selectedTime} HS
                  </div>
                </div>
              )}

              {selectedService && (
                <div className={`pt-4 border-t flex items-center justify-between ${
                  isDark ? 'border-stone-800' : 'border-pink-200/40'
                }`}>
                  <span className={`text-[9px] font-black font-mono uppercase tracking-[0.15em] ${
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  }`}>Total Neto</span>
                  <span className={`text-xl font-black font-mono ${
                    isDark ? 'text-pink-400' : 'text-pink-600'
                  }`}>
                    ${Number(selectedService.price).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Stepper mini */}
              <div className={`pt-4 border-t flex items-center gap-2 text-[8px] font-black font-mono tracking-[0.15em] ${
                isDark ? 'text-stone-600 border-stone-800' : 'text-stone-400 border-pink-200/40'
              }`}>
                <span className={`flex items-center gap-1 ${paso >= 1 ? 'text-pink-500' : ''}`}>Ritual</span>
                <span>→</span>
                <span className={`flex items-center gap-1 ${paso >= 2 ? 'text-pink-500' : ''}`}>Staff</span>
                <span>→</span>
                <span className={`flex items-center gap-1 ${paso >= 3 ? 'text-pink-500' : ''}`}>Agenda</span>
                <span>→</span>
                <span className={`flex items-center gap-1 ${paso >= 4 ? 'text-pink-500' : ''}`}>Datos</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ✅ COMPONENTE PRINCIPAL CON SUSPENSE
export default function ClientBookingPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute w-48 h-48 bg-amber-500/5 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite] delay-300" />
        <div className="relative flex flex-col items-center justify-center gap-4 bg-white/5 backdrop-blur-2xl px-10 py-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
            <Sparkles className="w-5 h-5 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 animate-pulse">
            Cargando Santuario...
          </p>
        </div>
      </div>
    }>
      <AgendaContent />
    </Suspense>
  )
}