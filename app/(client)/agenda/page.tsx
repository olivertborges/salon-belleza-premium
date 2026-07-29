// @ts-nocheck
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  format, addDays, isToday, parseISO, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameDay, isBefore, startOfDay, addMonths, subMonths,
  isWeekend, getDay, isAfter
} from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================================
// ICONOS - SOLO LOS NECESARIOS
// ============================================================
import { 
  Calendar, Clock, User, Sparkles, ChevronRight, 
  CheckCircle2, ChevronLeft, Phone, Mail, FileText,
  Scissors, Heart, ArrowRight, Check, X, Crown,
  Star, Award, Zap, Shield, Layers, Gem, Compass, Flower2, 
  PartyPopper, Bookmark, MapPin, MessageCircle, CalendarDays,
  Sun, Moon, Palette, Eye, Info, AlertCircle
} from 'lucide-react'

// ============================================================
// TIPOS
// ============================================================
interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  category: string
  image_url?: string
  is_active: boolean
}

interface Staff {
  id: string
  name: string
  email?: string
  phone?: string
  specialty?: string
  avatar_url?: string
  is_active: boolean
}

interface Appointment {
  id: string
  time: string
  status: string
  service_id: string
  services?: { duration: number }
}

interface ClientData {
  name: string
  phone: string
  email: string
  notes: string
}

// ============================================================
// CATEGORÍAS DE SERVICIOS
// ============================================================
const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: Sparkles, color: '#D4AF37' },
  { id: 'nails', label: 'Uñas', icon: Heart, color: '#E879A0' },
  { id: 'micropigmentation', label: 'Micropigmentación', icon: Crown, color: '#F2994A' },
  { id: 'hair', label: 'Peluquería', icon: Scissors, color: '#2D9CDB' },
  { id: 'others', label: 'Otros', icon: Star, color: '#9B5DE5' },
]

// ============================================================
// COMPONENTE PRINCIPAL CON SUSPENSE
// ============================================================
function AgendaContent() {
  const { theme } = useTheme()
  const { user, tenantId } = useAuth()
  const isDark = theme === 'dark'

  const searchParams = useSearchParams()
  const urlProfessionalId = searchParams?.get('professional') || null
  const urlServiceName = searchParams?.get('service') || null

  // Estados
  const [step, setStep] = useState(1)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [availableTimes, setAvailableTimes] = useState<string[]>([])

  // Selecciones
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<Staff | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedTime, setSelectedTime] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Cliente
  const [clientData, setClientData] = useState<ClientData>({ 
    name: '', phone: '', email: '', notes: '' 
  })

  // UI
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ============================================================
  // HORARIOS PREDETERMINADOS
  // ============================================================
  const DEFAULT_TIMES = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30'
  ]

  // ============================================================
  // FUNCIÓN PARA OBTENER HORARIOS DE LA DB
  // ============================================================
  const fetchWorkingHours = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('working_hours')
        .select('start_time')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('start_time', { ascending: true })

      if (error) throw error
      if (data && data.length > 0) {
        return data.map((h: any) => h.start_time)
      }
      return DEFAULT_TIMES
    } catch {
      return DEFAULT_TIMES
    }
  }, [tenantId])

  // ============================================================
  // CARGA INICIAL DE DATOS
  // ============================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [servicesRes, staffRes, hours] = await Promise.all([
          supabase.from('services').select('*').eq('is_active', true),
          supabase.from('staff').select('*').eq('is_active', true),
          fetchWorkingHours()
        ])

        const servicesData = servicesRes.data || []
        const staffData = staffRes.data || []

        setServices(servicesData)
        setStaff(staffData)
        setAvailableTimes(hours)

        // Pre-selección por URL
        if (urlServiceName) {
          const foundService = servicesData.find(
            (s: any) => s.name.toLowerCase().trim() === urlServiceName.toLowerCase().trim()
          )
          if (foundService) {
            setSelectedService(foundService)
            setStep(2)
          }
        }

        if (urlProfessionalId) {
          const foundStaff = staffData.find((p: any) => p.id === urlProfessionalId)
          if (foundStaff) {
            setSelectedProfessional(foundStaff)
            if (selectedService) setStep(3)
          }
        }

      } catch (err) {
        console.error('Error cargando datos:', err)
        setError('No pudimos cargar los servicios. Por favor, intenta de nuevo.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [fetchWorkingHours, urlProfessionalId, urlServiceName])

  // ============================================================
  // OBTENER OCUPACIÓN DEL PROFESIONAL
  // ============================================================
  useEffect(() => {
    if (!selectedProfessional) return

    const fetchAppointments = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('time, status, service_id, services:service_id(duration)')
          .eq('professional_id', selectedProfessional.id)
          .eq('date', selectedDate)
          .neq('status', 'cancelled')

        if (!error && data) {
          setAppointments(data as any)
        }
      } catch (err) {
        console.error('Error cargando citas:', err)
      }
    }

    fetchAppointments()
  }, [selectedDate, selectedProfessional])

  // ============================================================
  // VERIFICAR DISPONIBILIDAD DE HORA
  // ============================================================
  const checkAvailability = useCallback((time: string, date: string = selectedDate) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    if (date === today) {
      const now = format(new Date(), 'HH:mm')
      if (time < now) return { available: false, reason: 'pasado' }
    }

    for (const app of appointments) {
      if (!app.time) continue
      const startTime = app.time.substring(0, 5)
      const duration = app.services?.duration || 30

      const [h1, m1] = startTime.split(':').map(Number)
      const [h2, m2] = time.split(':').map(Number)
      const startMinutes = h1 * 60 + m1
      const endMinutes = startMinutes + duration
      const checkMinutes = h2 * 60 + m2

      if (checkMinutes >= startMinutes && checkMinutes < endMinutes) {
        return { 
          available: false, 
          reason: app.status === 'blocked' ? 'bloqueado' : 'ocupado' 
        }
      }
    }

    return { available: true, reason: '' }
  }, [appointments, selectedDate])

  // ============================================================
  // OBTENER CATEGORÍA DE UN SERVICIO
  // ============================================================
  const getServiceCategory = useCallback((category: string): string => {
    if (!category) return 'others'
    const normalized = category.toLowerCase().trim()
    if (normalized.includes('uña') || normalized.includes('nail') || normalized.includes('manicur')) return 'nails'
    if (normalized.includes('micro') || normalized.includes('pigment') || normalized.includes('ceja')) return 'micropigmentation'
    if (normalized.includes('pelu') || normalized.includes('pelo') || normalized.includes('cabello')) return 'hair'
    return 'others'
  }, [])

  // ============================================================
  // SERVICIOS FILTRADOS
  // ============================================================
  const filteredServices = useMemo(() => {
    if (selectedCategory === 'all') return services
    return services.filter(s => getServiceCategory(s.category) === selectedCategory)
  }, [services, selectedCategory, getServiceCategory])

  // ============================================================
  // HORAS DE MAÑANA Y TARDE
  // ============================================================
  const morningTimes = availableTimes.filter(t => t < '14:00')
  const afternoonTimes = availableTimes.filter(t => t >= '14:00')

  // ============================================================
  // DÍAS DEL MES
  // ============================================================
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  const isDayDisabled = useCallback((date: Date) => {
    const day = getDay(date)
    return day === 0 || day === 1 || isBefore(startOfDay(date), startOfDay(new Date()))
  }, [])

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0]
  }

  // ============================================================
  // RESERVAR CITA
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientData.name || !clientData.phone) {
      setError('Por favor, completa tu nombre y teléfono.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      let clientId = null

      if (user?.id) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (existingClient) clientId = existingClient.id
      }

      if (!clientId) {
        const { data: phoneMatch } = await supabase
          .from('clients')
          .select('id')
          .eq('phone', clientData.phone.trim())

        if (phoneMatch && phoneMatch.length > 0) {
          clientId = phoneMatch[0].id
        }
      }

      if (!clientId) {
        const { data: newClient, error: clientError } = await supabase
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

        if (clientError) throw clientError
        clientId = newClient?.[0]?.id
      }

      if (!clientId) throw new Error('No se pudo crear el cliente')

      // Crear cita
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert([{
          client_id: clientId,
          professional_id: selectedProfessional?.id,
          service_id: selectedService?.id,
          date: selectedDate,
          time: selectedTime,
          status: 'pending',
          total_price: Number(selectedService?.price || 0),
          notes: clientData.notes.trim() || null,
          tenant_id: tenantId
        }])

      if (appointmentError) throw appointmentError

      // Sumar puntos
      const POINTS = 50
      const { data: wallet } = await supabase
        .from('loyalty_wallets')
        .select('glow_points')
        .eq('client_id', clientId)
        .eq('tenant_id', tenantId)
        .single()

      if (wallet) {
        await supabase
          .from('loyalty_wallets')
          .update({
            glow_points: (wallet.glow_points || 0) + POINTS,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', clientId)
          .eq('tenant_id', tenantId)
      } else {
        await supabase
          .from('loyalty_wallets')
          .insert([{
            client_id: clientId,
            tenant_id: tenantId,
            glow_points: POINTS,
            hair_points: 0,
            created_at: new Date().toISOString()
          }])
      }

      setShowSuccess(true)
      setTimeout(() => setStep(5), 600)

    } catch (err) {
      console.error(err)
      setError('Ocurrió un error al reservar. Por favor, intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================================
  // RENDER - LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-rose-200/30 border-t-rose-400 animate-spin" />
            <Sparkles className="w-5 h-5 text-rose-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-xs text-stone-400 tracking-widest uppercase font-light animate-pulse">
            Cargando servicios...
          </p>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDark ? 'bg-zinc-950' : 'bg-stone-50'
    }`}>
      
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ============================================================ */}
        {/* HEADER HERO - VERSIÓN COMPACTA Y ELEGANTE */}
        {/* ============================================================ */}
        <div className={`p-6 rounded-2xl border transition-all duration-300 ${
          isDark 
            ? 'bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border-zinc-800/50' 
            : 'bg-white/80 border-rose-100/50 shadow-sm'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-serif italic ${
                  isDark ? 'text-rose-400' : 'text-rose-500'
                }`}>
                  ✦ Reserva tu experiencia
                </span>
              </div>
              <h1 className={`text-2xl font-serif font-light ${
                isDark ? 'text-white' : 'text-stone-800'
              }`}>
                Agenda tu <span className={`font-serif italic ${
                  isDark ? 'text-rose-400' : 'text-rose-500'
                }`}>momento</span> de belleza
              </h1>
            </div>

            {user && (
              <Link
                href="/reservas"
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all duration-300 flex items-center gap-2 border ${
                  isDark 
                    ? 'border-zinc-800/50 text-zinc-400 hover:text-white hover:border-rose-500/30' 
                    : 'border-stone-200 text-stone-500 hover:text-rose-600 hover:border-rose-300/50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Mis citas
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* STEPPER - VERSIÓN LIMPIA */}
        {/* ============================================================ */}
        {step < 5 && (
          <div className={`flex items-center gap-2 p-3 rounded-xl border ${
            isDark ? 'border-zinc-800/50 bg-zinc-900/30' : 'border-stone-200/50 bg-white/60'
          }`}>
            {[1, 2, 3, 4].map((num) => {
              const isActive = step === num
              const isCompleted = step > num
              const labels = ['Servicio', 'Profesional', 'Horario', 'Datos']

              return (
                <div key={num} className="flex-1 flex items-center gap-2">
                  <div className={`flex items-center gap-2 min-w-0 ${
                    isActive ? 'flex-1' : ''
                  }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 flex-shrink-0 ${
                      isActive 
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25' 
                        : isCompleted 
                          ? 'bg-emerald-500 text-white' 
                          : isDark 
                            ? 'bg-zinc-800 text-zinc-500' 
                            : 'bg-stone-200 text-stone-400'
                    }`}>
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : num}
                    </div>
                    <span className={`text-[9px] font-medium truncate hidden sm:block ${
                      isActive 
                        ? isDark ? 'text-white' : 'text-stone-800'
                        : isCompleted 
                          ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                          : isDark ? 'text-zinc-500' : 'text-stone-400'
                    }`}>
                      {labels[num - 1]}
                    </span>
                  </div>
                  {num < 4 && (
                    <div className={`flex-1 h-px min-w-[8px] ${
                      isCompleted ? 'bg-emerald-500' : isDark ? 'bg-zinc-800' : 'bg-stone-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ============================================================ */}
        {/* ERROR */}
        {/* ============================================================ */}
        {error && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isDark 
              ? 'bg-rose-950/20 border-rose-800/30 text-rose-400' 
              : 'bg-rose-50 border-rose-200 text-rose-600'
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{error}</p>
              <button 
                onClick={() => setError(null)} 
                className="text-xs underline opacity-70 hover:opacity-100 transition-opacity"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CONTENIDO PRINCIPAL */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ============================================================ */}
          {/* PASOS */}
          {/* ============================================================ */}
          <div className="lg:col-span-2 space-y-5">

            {/* ============================================================ */}
            {/* PASO 1: SERVICIOS */}
            {/* ============================================================ */}
            {step === 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div>
                  <h2 className={`text-lg font-serif font-light ${
                    isDark ? 'text-white' : 'text-stone-800'
                  }`}>
                    Elige tu <span className="text-rose-500">servicio</span>
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-stone-400'}`}>
                    Selecciona una categoría y luego el tratamiento deseado
                  </p>
                </div>

                {/* Categorías */}
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon
                    const isSelected = selectedCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                            : isDark
                              ? 'bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                              : 'bg-white/60 text-stone-500 hover:text-stone-800 hover:bg-stone-100/50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cat.label}
                      </button>
                    )
                  })}
                </div>

                {/* Grid de servicios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredServices.length > 0 ? (
                    filteredServices.map((service, idx) => (
                      <motion.button
                        key={service.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        onClick={() => {
                          setSelectedService(service)
                          setStep(2)
                        }}
                        className={`group p-4 rounded-xl border text-left transition-all duration-300 hover:-translate-y-0.5 ${
                          isDark 
                            ? 'bg-zinc-900/40 border-zinc-800/50 hover:border-rose-500/30 hover:bg-zinc-900/60' 
                            : 'bg-white/60 border-stone-200/50 hover:border-rose-300/50 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0">
                            <h4 className={`text-sm font-semibold truncate ${
                              isDark ? 'text-white' : 'text-stone-800'
                            }`}>
                              {service.name}
                            </h4>
                            <p className={`text-xs line-clamp-1 ${
                              isDark ? 'text-zinc-400' : 'text-stone-400'
                            }`}>
                              {service.description || 'Tratamiento de belleza premium'}
                            </p>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-rose-500 font-bold">
                                ${Number(service.price).toLocaleString()}
                              </span>
                              <span className={isDark ? 'text-zinc-500' : 'text-stone-400'}>
                                {service.duration} min
                              </span>
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${
                            isDark ? 'text-zinc-600' : 'text-stone-300'
                          }`} />
                        </div>
                      </motion.button>
                    ))
                  ) : (
                    <div className={`col-span-full py-12 text-center border border-dashed rounded-xl ${
                      isDark ? 'border-zinc-800' : 'border-stone-200'
                    }`}>
                      <Sparkles className={`w-8 h-8 mx-auto mb-3 ${
                        isDark ? 'text-zinc-600' : 'text-stone-300'
                      }`} />
                      <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-stone-400'}`}>
                        No hay servicios en esta categoría
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ============================================================ */}
            {/* PASO 2: PROFESIONAL */}
            {/* ============================================================ */}
            {step === 2 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-lg font-serif font-light ${
                      isDark ? 'text-white' : 'text-stone-800'
                    }`}>
                      Elige tu <span className="text-rose-500">profesional</span>
                    </h2>
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-stone-400'}`}>
                      {selectedService?.name} — {selectedService?.duration} minutos
                    </p>
                  </div>
                  <button 
                    onClick={() => setStep(1)}
                    className={`text-xs font-medium flex items-center gap-1 transition-colors ${
                      isDark ? 'text-zinc-400 hover:text-white' : 'text-stone-400 hover:text-rose-500'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" /> Cambiar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {staff.map((prof, idx) => (
                    <button
                      key={prof.id}
                      onClick={() => {
                        setSelectedProfessional(prof)
                        setStep(3)
                      }}
                      className={`group p-4 rounded-xl border text-left transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-4 ${
                        isDark 
                          ? 'bg-zinc-900/40 border-zinc-800/50 hover:border-rose-500/30 hover:bg-zinc-900/60' 
                          : 'bg-white/60 border-stone-200/50 hover:border-rose-300/50 hover:shadow-md'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                        idx === 0 
                          ? 'bg-rose-500/10 text-rose-500' 
                          : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {prof.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-semibold ${
                          isDark ? 'text-white' : 'text-stone-800'
                        }`}>
                          {prof.name}
                        </h4>
                        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-stone-400'}`}>
                          {prof.specialty || prof.role || 'Especialista'}
                        </p>
                        {idx === 0 && (
                          <span className="inline-block text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white mt-1">
                            Top
                          </span>
                        )}
                      </div>
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                        isDark ? 'text-zinc-600' : 'text-stone-300'
                      }`} />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ============================================================ */}
            {/* PASO 3: CALENDARIO Y HORARIO */}
            {/* ============================================================ */}
            {step === 3 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-lg font-serif font-light ${
                      isDark ? 'text-white' : 'text-stone-800'
                    }`}>
                      Elige tu <span className="text-rose-500">horario</span>
                    </h2>
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-stone-400'}`}>
                      Con {selectedProfessional?.name} para {selectedService?.name}
                    </p>
                  </div>
                  <button 
                    onClick={() => setStep(2)}
                    className={`text-xs font-medium flex items-center gap-1 transition-colors ${
                      isDark ? 'text-zinc-400 hover:text-white' : 'text-stone-400 hover:text-rose-500'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" /> Cambiar
                  </button>
                </div>

                {/* Calendario */}
                <div className={`p-5 rounded-xl border ${
                  isDark ? 'border-zinc-800/50 bg-zinc-900/30' : 'border-stone-200/50 bg-white/60'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-sm font-medium ${
                      isDark ? 'text-white' : 'text-stone-800'
                    }`}>
                      {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-zinc-800' : 'hover:bg-stone-100'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-zinc-800' : 'hover:bg-stone-100'
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                      <div key={d} className={`text-[10px] font-medium py-1.5 ${
                        isDark ? 'text-zinc-500' : 'text-stone-400'
                      }`}>{d}</div>
                    ))}

                    {Array.from({ length: (getDay(daysInMonth[0]) + 6) % 7 }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}

                    {daysInMonth.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const isSelected = selectedDate === dateStr
                      const disabled = isDayDisabled(day)

                      return (
                        <button
                          key={dateStr}
                          disabled={disabled}
                          onClick={() => {
                            setSelectedDate(dateStr)
                            setSelectedTime('')
                          }}
                          className={`py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isSelected
                              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                              : disabled
                                ? isDark ? 'text-zinc-700 cursor-not-allowed' : 'text-stone-300 cursor-not-allowed'
                                : isDark 
                                  ? 'text-zinc-300 hover:bg-zinc-800' 
                                  : 'text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          {format(day, 'd')}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Horarios */}
                {selectedDate && (
                  <div className={`p-5 rounded-xl border ${
                    isDark ? 'border-zinc-800/50 bg-zinc-900/30' : 'border-stone-200/50 bg-white/60'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-sm font-medium ${
                        isDark ? 'text-white' : 'text-stone-800'
                      }`}>
                        {format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es })}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        isDayDisabled(parseISO(selectedDate))
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {isDayDisabled(parseISO(selectedDate)) ? 'Cerrado' : 'Disponible'}
                      </span>
                    </div>

                    {!isDayDisabled(parseISO(selectedDate)) && (
                      <>
                        {/* Mañana */}
                        <div className="space-y-2 mb-4">
                          <p className={`text-[10px] font-medium uppercase tracking-wider ${
                            isDark ? 'text-zinc-500' : 'text-stone-400'
                          }`}>
                            Mañana
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {morningTimes.map((time) => {
                              const { available, reason } = checkAvailability(time)
                              const isSelected = selectedTime === time
                              return (
                                <button
                                  key={time}
                                  disabled={!available}
                                  onClick={() => setSelectedTime(time)}
                                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                                    isSelected
                                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                                      : available
                                        ? isDark 
                                          ? 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800'
                                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                        : isDark 
                                          ? 'bg-zinc-800/20 text-zinc-600 cursor-not-allowed'
                                          : 'bg-stone-50 text-stone-300 cursor-not-allowed'
                                  }`}
                                >
                                  {time}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Tarde */}
                        <div className="space-y-2">
                          <p className={`text-[10px] font-medium uppercase tracking-wider ${
                            isDark ? 'text-zinc-500' : 'text-stone-400'
                          }`}>
                            Tarde
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {afternoonTimes.map((time) => {
                              const { available, reason } = checkAvailability(time)
                              const isSelected = selectedTime === time
                              return (
                                <button
                                  key={time}
                                  disabled={!available}
                                  onClick={() => setSelectedTime(time)}
                                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                                    isSelected
                                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                                      : available
                                        ? isDark 
                                          ? 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800'
                                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                        : isDark 
                                          ? 'bg-zinc-800/20 text-zinc-600 cursor-not-allowed'
                                          : 'bg-stone-50 text-stone-300 cursor-not-allowed'
                                  }`}
                                >
                                  {time}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {selectedTime && (
                  <button
                    onClick={() => setStep(4)}
                    className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      isDark 
                        ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/25' 
                        : 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/25'
                    }`}
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )}

            {/* ============================================================ */}
            {/* PASO 4: DATOS DEL CLIENTE */}
            {/* ============================================================ */}
            {step === 4 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-lg font-serif font-light ${
                      isDark ? 'text-white' : 'text-stone-800'
                    }`}>
                      Tus <span className="text-rose-500">datos</span>
                    </h2>
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-stone-400'}`}>
                      {format(parseISO(selectedDate), "d MMM")} a las {selectedTime} hs
                    </p>
                  </div>
                  <button 
                    onClick={() => setStep(3)}
                    className={`text-xs font-medium flex items-center gap-1 transition-colors ${
                      isDark ? 'text-zinc-400 hover:text-white' : 'text-stone-400 hover:text-rose-500'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" /> Cambiar
                  </button>
                </div>

                <form onSubmit={handleSubmit} className={`p-6 rounded-xl border ${
                  isDark ? 'border-zinc-800/50 bg-zinc-900/30' : 'border-stone-200/50 bg-white/60'
                }`}>
                  <div className="space-y-4">
                    <div>
                      <label className={`text-xs font-medium block mb-1.5 ${
                        isDark ? 'text-zinc-400' : 'text-stone-500'
                      }`}>
                        Nombre completo <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                          isDark ? 'text-zinc-600' : 'text-stone-400'
                        }`} />
                        <input
                          type="text"
                          required
                          value={clientData.name}
                          onChange={(e) => setClientData({...clientData, name: e.target.value})}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/20 ${
                            isDark 
                              ? 'bg-zinc-950/50 border-zinc-800/50 text-white focus:border-rose-500/50' 
                              : 'bg-white/80 border-stone-200 text-stone-800 focus:border-rose-400'
                          }`}
                          placeholder="Tu nombre completo"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`text-xs font-medium block mb-1.5 ${
                        isDark ? 'text-zinc-400' : 'text-stone-500'
                      }`}>
                        WhatsApp / Teléfono <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                          isDark ? 'text-zinc-600' : 'text-stone-400'
                        }`} />
                        <input
                          type="tel"
                          required
                          value={clientData.phone}
                          onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/20 ${
                            isDark 
                              ? 'bg-zinc-950/50 border-zinc-800/50 text-white focus:border-rose-500/50' 
                              : 'bg-white/80 border-stone-200 text-stone-800 focus:border-rose-400'
                          }`}
                          placeholder="099 123 456"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`text-xs font-medium block mb-1.5 ${
                        isDark ? 'text-zinc-400' : 'text-stone-500'
                      }`}>
                        Correo electrónico
                      </label>
                      <div className="relative">
                        <Mail className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                          isDark ? 'text-zinc-600' : 'text-stone-400'
                        }`} />
                        <input
                          type="email"
                          value={clientData.email}
                          onChange={(e) => setClientData({...clientData, email: e.target.value})}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/20 ${
                            isDark 
                              ? 'bg-zinc-950/50 border-zinc-800/50 text-white focus:border-rose-500/50' 
                              : 'bg-white/80 border-stone-200 text-stone-800 focus:border-rose-400'
                          }`}
                          placeholder="tu@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`text-xs font-medium block mb-1.5 ${
                        isDark ? 'text-zinc-400' : 'text-stone-500'
                      }`}>
                        Notas o preferencias
                      </label>
                      <div className="relative">
                        <FileText className={`w-4 h-4 absolute left-3 top-3 ${
                          isDark ? 'text-zinc-600' : 'text-stone-400'
                        }`} />
                        <textarea
                          rows={3}
                          value={clientData.notes}
                          onChange={(e) => setClientData({...clientData, notes: e.target.value})}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/20 ${
                            isDark 
                              ? 'bg-zinc-950/50 border-zinc-800/50 text-white focus:border-rose-500/50' 
                              : 'bg-white/80 border-stone-200 text-stone-800 focus:border-rose-400'
                          }`}
                          placeholder="Alergias, preferencias, o cualquier detalle..."
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                        submitting
                          ? 'opacity-70 cursor-not-allowed'
                          : isDark 
                            ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/25' 
                            : 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/25'
                      }`}
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Confirmar Reserva
                        </>
                      )}
                    </button>

                    <p className={`text-[9px] text-center ${
                      isDark ? 'text-zinc-500' : 'text-stone-400'
                    }`}>
                      Al reservar, aceptas nuestra política de puntualidad y cancelación.
                    </p>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ============================================================ */}
            {/* PASO 5: ÉXITO */}
            {/* ============================================================ */}
            {step === 5 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-8 rounded-2xl text-center border ${
                  isDark ? 'border-zinc-800/50 bg-zinc-900/30' : 'border-stone-200/50 bg-white/60'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>

                <h2 className={`text-2xl font-serif font-light ${
                  isDark ? 'text-white' : 'text-stone-800'
                }`}>
                  ¡Reserva <span className="text-rose-500">confirmada</span>!
                </h2>

                <p className={`text-sm mt-2 ${isDark ? 'text-zinc-400' : 'text-stone-400'}`}>
                  Tu experiencia de belleza ha sido agendada exitosamente.
                </p>

                <div className={`mt-6 p-4 rounded-xl text-left space-y-2 text-sm border ${
                  isDark ? 'border-zinc-800/50 bg-zinc-950/30' : 'border-stone-200/50 bg-white/40'
                }`}>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-zinc-500' : 'text-stone-400'}>Servicio</span>
                    <span className={isDark ? 'text-white' : 'text-stone-800'}>{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-zinc-500' : 'text-stone-400'}>Profesional</span>
                    <span className={isDark ? 'text-white' : 'text-stone-800'}>{selectedProfessional?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-zinc-500' : 'text-stone-400'}>Fecha</span>
                    <span className={isDark ? 'text-white' : 'text-stone-800'}>
                      {format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-zinc-500' : 'text-stone-400'}>Hora</span>
                    <span className={isDark ? 'text-white' : 'text-stone-800'}>{selectedTime} hs</span>
                  </div>
                  <div className={`flex justify-between pt-2 border-t ${
                    isDark ? 'border-zinc-800' : 'border-stone-200'
                  }`}>
                    <span className={isDark ? 'text-zinc-500' : 'text-stone-400'}>Total</span>
                    <span className="text-rose-500 font-bold">
                      ${Number(selectedService?.price).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setStep(1)
                      setSelectedService(null)
                      setSelectedProfessional(null)
                      setSelectedTime('')
                      setClientData({ name: '', phone: '', email: '', notes: '' })
                      setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
                      setShowSuccess(false)
                    }}
                    className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isDark 
                        ? 'bg-zinc-800 text-white hover:bg-zinc-700' 
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    Nueva reserva
                  </button>
                  <Link
                    href="/reservas"
                    className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isDark 
                        ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/25' 
                        : 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/25'
                    }`}
                  >
                    Ver mis citas
                  </Link>
                </div>
              </motion.div>
            )}
          </div>

          {/* ============================================================ */}
          {/* SIDEBAR - RESUMEN */}
          {/* ============================================================ */}
          {step < 5 && (
            <div className={`lg:sticky lg:top-6 space-y-4 p-5 rounded-xl border h-fit ${
              isDark ? 'border-zinc-800/50 bg-zinc-900/30' : 'border-stone-200/50 bg-white/60'
            }`}>
              <h3 className={`text-xs font-medium uppercase tracking-wider ${
                isDark ? 'text-zinc-500' : 'text-stone-400'
              }`}>
                Resumen
              </h3>

              <div className="space-y-3 text-sm">
                {selectedService ? (
                  <div>
                    <p className={isDark ? 'text-zinc-500' : 'text-stone-400'}>Servicio</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-stone-800'}`}>
                      {selectedService.name}
                    </p>
                    <div className="flex gap-3 text-xs mt-1">
                      <span className={isDark ? 'text-zinc-500' : 'text-stone-400'}>
                        {selectedService.duration} min
                      </span>
                      <span className="text-rose-500 font-bold">
                        ${Number(selectedService.price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className={isDark ? 'text-zinc-500' : 'text-stone-400'}>
                    Selecciona un servicio
                  </p>
                )}

                {selectedProfessional && (
                  <div className={`pt-3 border-t ${isDark ? 'border-zinc-800' : 'border-stone-200'}`}>
                    <p className={isDark ? 'text-zinc-500' : 'text-stone-400'}>Profesional</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-stone-800'}`}>
                      {selectedProfessional.name}
                    </p>
                  </div>
                )}

                {selectedTime && (
                  <div className={`pt-3 border-t ${isDark ? 'border-zinc-800' : 'border-stone-200'}`}>
                    <p className={isDark ? 'text-zinc-500' : 'text-stone-400'}>Horario</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-stone-800'}`}>
                      {format(parseISO(selectedDate), "d MMM")} · {selectedTime} hs
                    </p>
                  </div>
                )}
              </div>

              {selectedService && (
                <div className={`pt-3 border-t flex items-center justify-between ${
                  isDark ? 'border-zinc-800' : 'border-stone-200'
                }`}>
                  <span className={isDark ? 'text-zinc-500' : 'text-stone-400'}>Total</span>
                  <span className="text-rose-500 font-bold text-lg">
                    ${Number(selectedService.price).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-[10px] text-stone-400">
                <div className={`flex-1 h-px ${isDark ? 'bg-zinc-800' : 'bg-stone-200'}`} />
                <span>Paso {step}/4</span>
                <div className={`flex-1 h-px ${isDark ? 'bg-zinc-800' : 'bg-stone-200'}`} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// EXPORT PRINCIPAL CON SUSPENSE
// ============================================================
export default function ClientBookingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-rose-200/30 border-t-rose-400 animate-spin" />
            <Sparkles className="w-5 h-5 text-rose-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-xs text-stone-400 tracking-widest uppercase font-light animate-pulse">
            Cargando agenda...
          </p>
        </div>
      </div>
    }>
      <AgendaContent />
    </Suspense>
  )
}