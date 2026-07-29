// @ts-nocheck
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  format, parseISO, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameDay, isBefore, startOfDay, 
  addMonths, subMonths, getDay
} from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

import { 
  Calendar, User, Sparkles, ChevronRight, 
  CheckCircle2, ChevronLeft, Phone, Mail, FileText,
  Scissors, Heart, ArrowRight, Check, X, Crown, Star,
  AlertCircle, ShieldCheck, Clock, Info, Search, ChevronDown, Plus, Trash2
} from 'lucide-react'

// ============================================================
// TIPOS E INTERFACES
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
  rating?: number
  reviews_count?: number
  biography?: string
  services?: Service[]
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

const FALLBACK_STAFF: Staff[] = [
  { id: '1', name: 'Laura Gómez', specialty: 'Manicura & Nail Art', is_active: true, rating: 4.9, reviews_count: 124, biography: 'Especialista en diseños a mano alzada y extensiones esculpidas con más de 5 años de trayectoria.' },
  { id: '2', name: 'María Fernández', specialty: 'Micropigmentación & Cejas', is_active: true, rating: 4.8, reviews_count: 98, biography: 'Apasionada por la armonía facial. Experta en Microblading y sombreado de efecto polvo.' },
  { id: '3', name: 'Ana Martínez', specialty: 'Peluquería & Colorimetría', is_active: true, rating: 4.7, reviews_count: 86, biography: 'Especialista en cambios de look globales, balayage y tratamientos de hidratación profunda.' },
  { id: '4', name: 'Carolina Ruiz', specialty: 'Estética & Depilación', is_active: true, rating: 4.9, reviews_count: 142, biography: 'Dedicada al cuidado de la piel. Experta en tratamientos faciales avanzados y depilación definitiva.' },
]

const CATEGORIES = [
  { id: 'nails', label: 'Uñas & Manicura', icon: Heart },
  { id: 'micropigmentation', label: 'Micropigmentación', icon: Crown },
  { id: 'hair', label: 'Peluquería & Color', icon: Scissors },
  { id: 'others', label: 'Otros Tratamientos', icon: Star },
]

const DEFAULT_TIMES = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30'
]

function AgendaContent() {
  const { theme } = useTheme()
  const { user, tenantId } = useAuth()
  const isDark = theme === 'dark'

  const searchParams = useSearchParams()
  const urlProfessionalId = searchParams?.get('professional') || null

  // Estados principales
  const [step, setStep] = useState(1)
  const [staff, setStaff] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Selecciones (Modificado para Carrito Múltiple)
  const [selectedProfessional, setSelectedProfessional] = useState<Staff | null>(null)
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  
  const [selectedDate, setSelectedDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'))
  const [selectedTime, setSelectedTime] = useState('')
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  // Modales y UI extras
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({})

  // Cliente
  const [clientData, setClientData] = useState<ClientData>({ 
    name: '', phone: '', email: '', notes: '' 
  })

  // Autofill
  useEffect(() => {
    if (user) {
      setClientData(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        email: user.email || ''
      }))
    }
  }, [user])

  // Fetch Horarios base
  const fetchWorkingHours = useCallback(async () => {
    try {
      const { data, error: fetchErr } = await supabase
        .from('working_hours')
        .select('start_time')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('start_time', { ascending: true })

      if (fetchErr) throw fetchErr
      return data && data.length > 0 ? data.map((h: any) => h.start_time.substring(0, 5)) : DEFAULT_TIMES
    } catch {
      return DEFAULT_TIMES
    }
  }, [tenantId])

  // Carga inicial
  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [staffRes, servicesRes, hours] = await Promise.all([
          supabase.from('staff').select('*').eq('is_active', true),
          supabase.from('services').select('*').eq('is_active', true),
          fetchWorkingHours()
        ])

        if (!isMounted) return

        let staffData = staffRes.data || []
        if (staffData.length === 0) staffData = FALLBACK_STAFF

        setStaff(staffData)
        setServices(servicesRes.data || [])
        setAvailableTimes(hours)

        if (urlProfessionalId) {
          const foundStaff = staffData.find((p: any) => p.id === urlProfessionalId)
          if (foundStaff) {
            setSelectedProfessional(foundStaff)
            setStep(2)
          }
        }
      } catch (err) {
        setError('No pudimos cargar la agenda correctamente. Por favor, refresca la página.')
      } finaly {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()
    return () => { isMounted = false }
  }, [fetchWorkingHours, urlProfessionalId])

  // Carga de citas optimizada
  const professionalId = selectedProfessional?.id
  useEffect(() => {
    if (!professionalId) return
    let isMounted = true

    const fetchAppointments = async () => {
      try {
        const { data, error: appErr } = await supabase
          .from('appointments')
          .select('time, status, service_id, services:service_id(duration)')
          .eq('professional_id', professionalId)
          .eq('date', selectedDate)
          .neq('status', 'cancelled')

        if (!appErr && data && isMounted) {
          setAppointments(data as any)
        }
      } catch (err) {
        console.error('Error cargando agenda de citas:', err)
      }
    }

    fetchAppointments()
    return () => { isMounted = false }
  }, [selectedDate, professionalId])

  // Normalizador de categorías
  const getServiceCategory = useCallback((category: string): string => {
    if (!category) return 'others'
    const normalized = category.toLowerCase().trim()
    if (normalized.includes('uña') || normalized.includes('nail') || normalized.includes('manicur')) return 'nails'
    if (normalized.includes('micro') || normalized.includes('pigment') || normalized.includes('ceja')) return 'micropigmentation'
    if (normalized.includes('pelu') || normalized.includes('pelo') || normalized.includes('cabello')) return 'hair'
    return 'others'
  }, [])

  // Totales del carrito
  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.duration, 0)
  }, [selectedServices])

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + Number(s.price), 0)
  }, [selectedServices])

  // Filtrado de servicios con motor de búsqueda e indexación por categorías
  const servicesByCategory = useMemo(() => {
    const baseServices = selectedProfessional?.services && selectedProfessional.services.length > 0
      ? selectedProfessional.services
      : services

    const filtered = baseServices.filter(s => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return s.name.toLowerCase().includes(query) || (s.description && s.description.toLowerCase().includes(query))
    })

    const groups: Record<string, Service[]> = { nails: [], micropigmentation: [], hair: [], others: [] }
    filtered.forEach(s => {
      const cat = getServiceCategory(s.category)
      if (groups[cat]) groups[cat].push(s)
      else groups['others'].push(s)
    })

    return groups
  }, [selectedProfessional, services, searchQuery, getServiceCategory])

  // Auto-expandir categorías si hay una búsqueda activa
  useEffect(() => {
    if (searchQuery) {
      setExpandedCategories({ nails: true, micropigmentation: true, hair: true, others: true })
    }
  }, [searchQuery])

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }))
  }

  const toggleServiceSelection = (service: Service) => {
    setSelectedServices(prev => {
      const exists = prev.some(s => s.id === service.id)
      if (exists) return prev.filter(s => s.id !== service.id)
      return [...prev, service]
    })
  }

  // Verificación de disponibilidad acumulada de alto rendimiento
  const checkAvailability = useCallback((time: string) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    if (selectedDate === today) {
      const now = format(new Date(), 'HH:mm')
      if (time < now) return { available: false, reason: 'pasado' }
    }

    const [h2, m2] = time.split(':').map(Number)
    const checkStartMinutes = h2 * 60 + m2
    const checkEndMinutes = checkStartMinutes + totalDuration

    for (const app of appointments) {
      if (!app.time) continue
      const startTime = app.time.substring(0, 5)
      const duration = app.services?.duration || 30

      const [h1, m1] = startTime.split(':').map(Number)
      const startMinutes = h1 * 60 + m1
      const endMinutes = startMinutes + duration

      // Valida solapamiento de rangos completos
      if (checkStartMinutes < endMinutes && checkEndMinutes > startMinutes) {
        return { 
          available: false, 
          reason: app.status === 'blocked' ? 'bloqueado' : 'ocupado' 
        }
      }
    }

    return { available: true, reason: '' }
  }, [appointments, selectedDate, totalDuration])

  const daysInMonth = useMemo(() => eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  }), [currentMonth])

  const isDayDisabled = useCallback((date: Date) => {
    const day = getDay(date)
    return day === 0 || isBefore(startOfDay(date), startOfDay(new Date()))
  }, [])

  const morningTimes = useMemo(() => availableTimes.filter(t => t < '14:00'), [availableTimes])
  const afternoonTimes = useMemo(() => availableTimes.filter(t => t >= '14:00'), [availableTimes])

  // Envío del registro de turnos múltiples
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientData.name || !clientData.phone) {
      setError('Por favor, ingresa tu nombre y número de contacto para continuar.')
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
          .maybeSingle()

        if (existingClient) clientId = existingClient.id
      }

      if (!clientId) {
        const { data: phoneMatch } = await supabase
          .from('clients')
          .select('id')
          .eq('phone', clientData.phone.trim())
          .limit(1)

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

      if (!clientId) throw new Error('Identificación del cliente errónea')

      // Insertar el bloque de servicios seleccionados (Citas agrupadas en el mismo slot temporal)
      const appointmentsToInsert = selectedServices.map(service => ({
        client_id: clientId,
        professional_id: selectedProfessional?.id,
        service_id: service.id,
        date: selectedDate,
        time: selectedTime,
        status: 'pending',
        total_price: Number(service.price || 0),
        notes: clientData.notes.trim() || null,
        tenant_id: tenantId
      }))

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointmentsToInsert)

      if (appointmentError) throw appointmentError

      // Gestión de Puntos
      const POINTS = 50 * selectedServices.length
      const { data: wallet } = await supabase
        .from('loyalty_wallets')
        .select('glow_points')
        .eq('client_id', clientId)
        .eq('tenant_id', tenantId)
        .maybeSingle()

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

      setShowSummaryModal(false)
      setStep(5)
    } catch (err) {
      setError('Ocurrió un error inesperado al agendar tu turno. Por favor, reintenta.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-rose-100 border-t-rose-500 animate-spin" />
            <Sparkles className="w-6 h-6 text-rose-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-sm font-serif italic text-stone-400 animate-pulse">
            Preparando tu experiencia Premium...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-500 ${isDark ? 'bg-zinc-950 text-stone-100' : 'bg-stone-50 text-stone-800'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* TOP BANNER */}
        <div className={`p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
          isDark ? 'bg-gradient-to-br from-zinc-900 via-zinc-950 to-stone-900 border-zinc-800/80 shadow-2xl' : 'bg-white border-rose-100/70 shadow-xl shadow-rose-100/20'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-300/10 rounded-full filter blur-3xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-500'}`}>
                  ✦ Salón de Experiencias
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-light tracking-wide">
                Reserva tu cita <span className="italic font-normal text-rose-500">Exclusiva</span>
              </h1>
              <p className="text-sm text-stone-400 max-w-xl font-light">
                Selecciona tu especialista de confianza y combina todos tus tratamientos favoritos en un mismo turno.
              </p>
            </div>
          </div>
        </div>

        {/* INDICADOR DE PASOS AVANZADO */}
        {step < 5 && (
          <div className={`p-4 rounded-2xl border flex items-center justify-between overflow-x-auto gap-4 scrollbar-none ${
            isDark ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-white/80 border-stone-200/60 shadow-sm'
          }`}>
            {[1, 2, 3, 4].map((num) => {
              const isActive = step === num
              const isCompleted = step > num
              const labels = ['Especialista', 'Tratamientos', 'Agenda & Hora', 'Tus Datos']
              return (
                <div key={num} className="flex items-center gap-3 flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                    isActive ? 'bg-rose-500 text-white ring-4 ring-rose-500/20 shadow-lg shadow-rose-500/30' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-400'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : num}
                  </div>
                  <span className={`text-xs tracking-wider transition-colors duration-300 ${isActive ? 'font-bold text-rose-500' : isCompleted ? 'text-emerald-500' : 'text-stone-400'}`}>
                    {labels[num - 1]}
                  </span>
                  {num < 4 && <div className={`w-8 h-px ${isCompleted ? 'bg-emerald-400' : 'bg-stone-200'}`} />}
                </div>
              )
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            
            <AnimatePresence mode="wait">
              
              {/* PASO 1: SELECCIÓN DE PROFESIONAL */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-4">
                  <h2 className="text-xl font-serif font-light tracking-wide flex items-center gap-2">
                    <User className="w-5 h-5 text-rose-500" /> Selecciona un Profesional Especializado
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {staff.map((prof) => (
                      <div 
                        key={prof.id} 
                        onClick={() => { setSelectedProfessional(prof); setStep(2); }}
                        className={`p-6 rounded-2xl border text-left cursor-pointer transition-all duration-300 flex flex-col justify-between group relative overflow-hidden ${
                          isDark ? 'bg-zinc-900/60 border-zinc-800/80 hover:border-rose-500/40 hover:bg-zinc-900' : 'bg-white border-stone-200 hover:border-rose-300 hover:shadow-xl hover:shadow-rose-100/30'
                        }`}
                      >
                        <div className="flex gap-4 items-start relative z-10">
                          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center font-bold text-2xl text-rose-500 overflow-hidden flex-shrink-0 shadow-inner">
                            {prof.avatar_url && !avatarErrors[prof.id] ? (
                              <img 
                                src={prof.avatar_url} 
                                alt={prof.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                onError={() => setAvatarErrors(prev => ({ ...prev, [prof.id]: true }))}
                              />
                            ) : (
                              prof.name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-semibold text-base tracking-wide group-hover:text-rose-500 transition-colors">{prof.name}</h4>
                            <p className="text-xs text-rose-500/80 font-medium">{prof.specialty || 'Estilista Profesional'}</p>
                            <div className="flex items-center gap-1.5 text-xs text-amber-500 pt-1">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span className="font-bold">{prof.rating?.toFixed(1) || '4.9'}</span>
                              <span className="text-stone-400">({prof.reviews_count || '120'} reseñas)</span>
                            </div>
                          </div>
                        </div>
                        {prof.biography && (
                          <p className="text-xs text-stone-400 font-light mt-4 leading-relaxed line-clamp-2 italic">
                            "{prof.biography}"
                          </p>
                        )}
                        <div className="absolute bottom-4 right-4 p-1.5 rounded-full bg-stone-50 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* PASO 2: ESTRUCTURA DE ACORDEÓN FLEXIBLE CON MÚLTIPLE SELECCIÓN Y BUSCADOR RESPONSIVE */}
              {step === 2 && selectedProfessional && (
                <motion.div key="step2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2 border-b">
                    <div>
                      <h2 className="text-xl font-serif font-light flex items-center gap-2 text-stone-800">
                        <Scissors className="w-5 h-5 text-rose-500" /> Catálogo de Tratamientos
                      </h2>
                      <p className="text-xs text-stone-400">Selecciona uno o varios servicios ofrecidos por {selectedProfessional.name}</p>
                    </div>
                    <button onClick={() => { setStep(1); setSelectedServices([]); }} className="text-xs font-semibold text-rose-500 flex items-center gap-1 self-start sm:self-auto hover:underline">
                      <X className="w-3.5 h-3.5"/> Cambiar Especialista
                    </button>
                  </div>

                  {/* BUSCADOR RESPONSIVE INTELIGENTE */}
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar tratamiento (ej: Manicura, Microblading...)" 
                      className="w-full bg-white border border-stone-200 text-stone-800 text-sm pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 transition-all shadow-sm"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* ACORDEONES RESPONSIVE POR CATEGORÍA */}
                  <div className="space-y-3">
                    {CATEGORIES.map(cat => {
                      const Icon = cat.icon
                      const categoryServices = servicesByCategory[cat.id] || []
                      const isExpanded = !!expandedCategories[cat.id]
                      
                      // Contar cuántos de esta categoría están en el carrito
                      const selectedInCat = categoryServices.filter(s => selectedServices.some(sel => sel.id === s.id)).length

                      if (categoryServices.length === 0 && searchQuery) return null

                      return (
                        <div key={cat.id} className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm transition-all">
                          {/* Encabezado del Acordeón */}
                          <button 
                            onClick={() => toggleCategory(cat.id)}
                            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-stone-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${selectedInCat > 0 ? 'bg-rose-500 text-white shadow-md' : 'bg-stone-50 text-stone-500'}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold text-stone-800 tracking-wide">{cat.label}</h3>
                                <p className="text-[11px] text-stone-400 font-light">{categoryServices.length} opciones disponibles</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {selectedInCat > 0 && (
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[10px] font-bold rounded-full">
                                  {selectedInCat} elegido{selectedInCat > 1 ? 's' : ''}
                                </span>
                              )}
                              <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-rose-500' : ''}`} />
                            </div>
                          </button>

                          {/* Cuerpo del Acordeón con Grid Flexible (Sin Scroll Horizontal) */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }} 
                                animate={{ height: 'auto', opacity: 1 }} 
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                              >
                                <div className="px-5 pb-5 pt-1 border-t border-stone-50 bg-stone-50/30 grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {categoryServices.map(service => {
                                    const isSelected = selectedServices.some(s => s.id === service.id)
                                    return (
                                      <div 
                                        key={service.id} 
                                        onClick={() => toggleServiceSelection(service)}
                                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between relative group ${
                                          isSelected 
                                            ? 'bg-rose-50/40 border-rose-400 shadow-sm ring-1 ring-rose-400/30' 
                                            : 'bg-white border-stone-200 hover:border-stone-300 hover:shadow-md'
                                        }`}
                                      >
                                        <div className="space-y-1.5 pr-8">
                                          <div className="flex flex-wrap justify-between items-start gap-1">
                                            <h4 className={`font-semibold text-xs tracking-wide transition-colors ${isSelected ? 'text-rose-600 font-bold' : 'text-stone-800'}`}>
                                              {service.name}
                                            </h4>
                                          </div>
                                          <p className="text-[11px] text-stone-400 font-light leading-relaxed line-clamp-2">
                                            {service.description || 'Sin descripción disponible.'}
                                          </p>
                                        </div>

                                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-stone-100/70 text-[11px] font-medium">
                                          <span className="flex items-center gap-1 text-stone-400">
                                            <Clock className="w-3.5 h-3.5 text-stone-300"/> {service.duration} min
                                          </span>
                                          <span className="text-rose-500 font-serif font-bold text-sm">
                                            ${Number(service.price).toLocaleString()}
                                          </span>
                                        </div>

                                        {/* Botón de Acción Circular Superior Derecho */}
                                        <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                          isSelected ? 'bg-rose-500 text-white scale-110' : 'bg-stone-50 text-stone-400 border border-stone-200 group-hover:bg-rose-50 group-hover:text-rose-500'
                                        }`}>
                                          {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3" />}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* PASO 3: CALENDARIO Y AGENDA DE HORAS */}
              {step === 3 && selectedServices.length > 0 && selectedProfessional && (
                <motion.div key="step3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <div>
                      <h2 className="text-xl font-serif font-light flex items-center gap-2 text-stone-800">
                        <Calendar className="w-5 h-5 text-rose-500" /> Agenda tu Turno
                      </h2>
                    </div>
                    <button onClick={() => { setStep(2); setSelectedTime(''); }} className="text-xs font-semibold text-rose-500 flex items-center gap-1 hover:underline">
                      <X className="w-3.5 h-3.5"/> Cambiar Servicios
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Calendario */}
                    <div className="md:col-span-3 p-5 bg-white rounded-2xl border space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold uppercase tracking-wider text-stone-700">{format(currentMonth, 'MMMM yyyy', { locale: es })}</span>
                        <div className="flex gap-1">
                          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 border rounded-lg hover:bg-stone-50"><ChevronLeft className="w-4 h-4"/></button>
                          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 border rounded-lg hover:bg-stone-50"><ChevronRight className="w-4 h-4"/></button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-stone-400 mb-2">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d} className="py-1">{d}</div>)}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {daysInMonth.map((day, i) => {
                          const dateStr = format(day, 'yyyy-MM-dd')
                          const disabled = isDayDisabled(day)
                          const isSelected = selectedDate === dateStr
                          return (
                            <button 
                              key={i} 
                              disabled={disabled} 
                              onClick={() => { setSelectedDate(dateStr); setSelectedTime(''); }} 
                              className={`p-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center ${
                                isSelected ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : disabled ? 'text-stone-200 cursor-not-allowed opacity-30' : 'hover:bg-stone-100 text-stone-700'
                              }`}
                            >
                              {format(day, 'd')}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Selector de Horas */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="p-5 bg-white rounded-2xl border shadow-sm max-h-[380px] overflow-y-auto space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Horarios para el {format(parseISO(selectedDate), 'dd/MM')}</h4>
                        
                        <div className="space-y-2">
                          <span className="text-[10px] text-stone-400 font-bold tracking-wider block">Mañana</span>
                          <div className="grid grid-cols-2 gap-2">
                            {morningTimes.map(t => {
                              const { available } = checkAvailability(t)
                              const isTimeSelected = selectedTime === t
                              return (
                                <button 
                                  key={t} 
                                  disabled={!available} 
                                  onClick={() => setSelectedTime(t)} 
                                  className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                                    isTimeSelected ? 'bg-rose-500 text-white border-rose-500' : available ? 'bg-white border-stone-200 hover:border-rose-300' : 'bg-stone-50 text-stone-300 cursor-not-allowed line-through'
                                  }`}
                                >
                                  {t}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] text-stone-400 font-bold tracking-wider block">Tarde</span>
                          <div className="grid grid-cols-2 gap-2">
                            {afternoonTimes.map(t => {
                              const { available } = checkAvailability(t)
                              const isTimeSelected = selectedTime === t
                              return (
                                <button 
                                  key={t} 
                                  disabled={!available} 
                                  onClick={() => setSelectedTime(t)} 
                                  className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                                    isTimeSelected ? 'bg-rose-500 text-white border-rose-500' : available ? 'bg-white border-stone-200 hover:border-rose-300' : 'bg-stone-50 text-stone-300 cursor-not-allowed line-through'
                                  }`}
                                >
                                  {t}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedTime && (
                    <button onClick={() => setStep(4)} className="w-full py-4 bg-rose-500 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all">
                      Confirmar Fecha y Hora <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              )}

              {/* PASO 4: FORMULARIO CLIENTE */}
              {step === 4 && selectedServices.length > 0 && selectedProfessional && (
                <motion.div key="step4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="p-6 bg-white rounded-2xl border space-y-6 shadow-sm">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <h3 className="text-xl font-serif font-light flex items-center gap-2 text-stone-800">
                      <FileText className="w-5 h-5 text-rose-500" /> Información de Contacto
                    </h3>
                    <button onClick={() => setStep(3)} className="text-xs font-semibold text-rose-500 hover:underline">Volver a la Agenda</button>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); setShowSummaryModal(true); }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-stone-500 block mb-1.5">Nombre y Apellido *</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input type="text" required value={clientData.name} onChange={e => setClientData({...clientData, name: e.target.value})} className="w-full bg-white border border-stone-200 text-stone-800 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-rose-400" placeholder="Escribe tu nombre completo" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-500 block mb-1.5">WhatsApp de Contacto *</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input type="tel" required value={clientData.phone} onChange={e => setClientData({...clientData, phone: e.target.value})} className="w-full bg-white border border-stone-200 text-stone-800 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-rose-400" placeholder="Ej: 099123456" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-500 block mb-1.5">Correo Electrónico (Opcional)</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="email" value={clientData.email} onChange={e => setClientData({...clientData, email: e.target.value})} className="w-full bg-white border border-stone-200 text-stone-800 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-rose-400" placeholder="tu@correo.com" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-500 block mb-1.5">Notas Especiales o Preferencias</label>
                      <textarea value={clientData.notes} onChange={e => setClientData({...clientData, notes: e.target.value})} className="w-full bg-white border border-stone-200 text-stone-800 p-4 rounded-xl text-sm resize-none focus:outline-rose-400" rows={3} placeholder="Si tienes alguna alergia, preferencia de color o indicación, escríbela aquí..." />
                    </div>

                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/60 flex gap-3 text-xs text-amber-700">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>Al hacer clic en continuar, visualizarás el resumen definitivo de tu cita antes del registro final.</p>
                    </div>

                    <button type="submit" className="w-full py-4 bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all flex items-center justify-center gap-2">
                      Revisar Detalles de Reserva <ChevronRight className="w-4 h-4"/>
                    </button>
                  </form>
                </motion.div>
              )}

              {/* PASO 5: PANTALLA DE ÉXITO */}
              {step === 5 && selectedServices.length > 0 && selectedProfessional && (
                <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 bg-white rounded-3xl border border-stone-200 text-center space-y-6 shadow-xl max-w-xl mx-auto">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-serif font-light text-stone-800">¡Tu Experiencia ha sido <span className="text-rose-500 font-normal italic">Agendada</span>!</h2>
                    <p className="text-sm text-stone-500 px-4">Hemos procesado tu reserva con éxito. El salón ha guardado tu lugar preferencial.</p>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-2xl text-left space-y-3 text-xs border border-stone-100">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Especialista:</span>
                      <span className="font-semibold text-stone-800">{selectedProfessional.name}</span>
                    </div>
                    <div className="flex flex-col gap-1 border-y border-stone-200/55 py-2">
                      <span className="text-stone-400 mb-0.5">Tratamientos:</span>
                      {selectedServices.map(s => (
                        <div key={s.id} className="flex justify-between pl-2 font-medium text-stone-700">
                          <span>• {s.name}</span>
                          <span>${Number(s.price).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Día y Hora:</span>
                      <span className="font-semibold text-rose-500">{format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es })} a las {selectedTime} hs</span>
                    </div>
                  </div>

                  <div className="p-4 bg-rose-50/50 rounded-xl flex items-center gap-3 text-left text-xs text-rose-700 border border-rose-100/50">
                    <ShieldCheck className="w-5 h-5 flex-shrink-0 text-rose-500" />
                    <p>¡Ganaste <strong>{50 * selectedServices.length} Glow Points</strong> por tu reserva combinada!</p>
                  </div>

                  <button onClick={() => { setStep(1); setSelectedServices([]); setSelectedTime(''); }} className="w-full py-3 bg-stone-900 text-white font-medium rounded-xl hover:bg-stone-800 transition-all text-xs tracking-widest uppercase">
                    Volver a la Cartelera Principal
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* SIDEBAR DERECHO: RESUMEN RESPONSIVE */}
          {step > 1 && step < 5 && (
            <div className="p-6 bg-white rounded-2xl border border-stone-200 h-fit space-y-5 lg:sticky lg:top-8 shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-xs uppercase tracking-wider text-stone-400 font-bold">Tu Selección</span>
                <span className="px-2 py-0.5 bg-rose-50 text-[10px] text-rose-500 font-bold rounded">Paso {step} de 4</span>
              </div>
              
              <div className="space-y-4 text-sm">
                {selectedProfessional && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center font-bold overflow-hidden text-sm">
                      {selectedProfessional.avatar_url && !avatarErrors[selectedProfessional.id] ? (
                        <img src={selectedProfessional.avatar_url} alt="" className="w-full h-full object-cover" onError={() => setAvatarErrors(prev => ({ ...prev, [selectedProfessional.id]: true }))}/>
                      ) : selectedProfessional.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">Profesional</p>
                      <p className="font-semibold text-stone-800 text-xs">{selectedProfessional.name}</p>
                    </div>
                  </div>
                )}

                {selectedServices.length > 0 && (
                  <div className="pt-3 border-t border-stone-100 space-y-2">
                    <p className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">Tratamientos Seleccionados</p>
                    <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                      {selectedServices.map(s => (
                        <div key={s.id} className="flex justify-between items-center bg-stone-50 p-2 rounded-lg text-xs">
                          <span className="font-medium text-stone-700 truncate max-w-[150px]">{s.name}</span>
                          <button onClick={() => toggleServiceSelection(s)} className="text-stone-400 hover:text-rose-500 ml-2">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-stone-400 font-light mt-0.5">Duración combinada: {totalDuration} min</p>
                  </div>
                )}

                {selectedTime && (
                  <div className="pt-3 border-t border-stone-100">
                    <p className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">Cita Programada</p>
                    <p className="font-semibold text-stone-800 text-xs capitalize">{format(parseISO(selectedDate), "EEEE dd 'de' MMMM", { locale: es })}</p>
                    <p className="text-rose-500 font-bold text-xs mt-0.5">{selectedTime} Horas</p>
                  </div>
                )}
              </div>

              {selectedServices.length > 0 && (
                <div className="pt-4 border-t border-stone-100 flex justify-between items-center font-bold text-stone-800">
                  <span className="text-xs uppercase tracking-wider text-stone-400">Total Estimado:</span>
                  <span className="text-rose-500 font-serif text-xl">${totalPrice.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* STICKY BOTTOM BAR ORIGINAL PARA SELECCIÓN MÚLTIPLE EN MÓVILES */}
      {step === 2 && selectedServices.length > 0 && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          exit={{ y: 100, opacity: 0 }} 
          className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200/80 p-4 shadow-xl shadow-stone-900/10 backdrop-blur-md"
        >
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Carrito ({selectedServices.length})</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-rose-500 font-serif">${totalPrice.toLocaleString()}</span>
                <span className="text-xs text-stone-400 font-medium">· {totalDuration} min</span>
              </div>
            </div>
            <button 
              onClick={() => setStep(3)} 
              className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold tracking-wider rounded-xl shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition-all"
            >
              Continuar a la Agenda <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      <AnimatePresence>
        {showSummaryModal && selectedServices.length > 0 && selectedProfessional && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-6">
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-serif text-lg text-stone-800">Verifica tu Solicitud</h3>
                <button onClick={() => setShowSummaryModal(false)} className="p-1 rounded-full hover:bg-stone-100"><X className="w-4 h-4 text-stone-400"/></button>
              </div>

              <div className="space-y-3 text-xs bg-stone-50 p-4 rounded-xl border max-h-60 overflow-y-auto">
                <div className="flex justify-between"><span className="text-stone-400">Cliente:</span><span className="font-semibold text-stone-800">{clientData.name}</span></div>
                <div className="flex justify-between"><span className="text-stone-400">Teléfono:</span><span className="font-semibold text-stone-800">{clientData.phone}</span></div>
                <div className="flex justify-between"><span className="text-stone-400">Profesional:</span><span className="font-semibold text-stone-800">{selectedProfessional.name}</span></div>
                
                <div className="border-t border-stone-200/60 pt-2 space-y-1">
                  <span className="text-stone-400 block font-bold">Servicios a reservar:</span>
                  {selectedServices.map(s => (
                    <div key={s.id} className="flex justify-between pl-2 text-stone-700">
                      <span>• {s.name} ({s.duration} min)</span>
                      <span className="font-semibold">${Number(s.price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-stone-200/60 pt-2 flex justify-between">
                  <span className="text-stone-400 font-bold">Total Acumulado:</span>
                  <span className="font-bold text-rose-500">${totalPrice.toLocaleString()} ({totalDuration} min)</span>
                </div>
                
                <div className="flex justify-between"><span className="text-stone-400">Fecha/Hora:</span><span className="font-semibold text-rose-500">{selectedDate} a las {selectedTime} hs</span></div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowSummaryModal(false)} className="flex-1 py-3 border rounded-xl text-xs font-semibold hover:bg-stone-50">Corregir</button>
                <button type="button" onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/10 disabled:opacity-50">
                  {submitting ? 'Confirmando...' : 'Confirmar Todo'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ClientBookingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 rounded-full border-4 border-rose-100 border-t-rose-500 animate-spin" />
      </div>
    }>
      <AgendaContent />
    </Suspense>
  )
}
