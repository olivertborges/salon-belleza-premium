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
import { motion } from 'framer-motion'

import { 
  Calendar, User, Sparkles, ChevronRight, 
  CheckCircle2, ChevronLeft, Phone, Mail, FileText,
  Scissors, Heart, ArrowRight, Check, X, Crown, Star,
  AlertCircle
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
  { id: '1', name: 'Laura Gómez', specialty: 'Manicura & Nail Art', is_active: true, rating: 4.9 },
  { id: '2', name: 'María Fernández', specialty: 'Micropigmentación & Cejas', is_active: true, rating: 4.8 },
  { id: '3', name: 'Ana Martínez', specialty: 'Peluquería & Colorimetría', is_active: true, rating: 4.7 },
  { id: '4', name: 'Carolina Ruiz', specialty: 'Estética & Depilación', is_active: true, rating: 4.9 },
]

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: Sparkles },
  { id: 'nails', label: 'Uñas', icon: Heart },
  { id: 'micropigmentation', label: 'Micropigmentación', icon: Crown },
  { id: 'hair', label: 'Peluquería', icon: Scissors },
  { id: 'others', label: 'Otros', icon: Star },
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

  // Selecciones
  const [selectedProfessional, setSelectedProfessional] = useState<Staff | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'))
  const [selectedTime, setSelectedTime] = useState('')
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  // Cliente
  const [clientData, setClientData] = useState<ClientData>({ 
    name: '', phone: '', email: '', notes: '' 
  })

  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({})

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
      return data && data.length > 0 ? data.map((h: any) => h.start_time) : DEFAULT_TIMES
    } catch {
      return DEFAULT_TIMES
    }
  }, [tenantId])

  // Carga inicial de datos
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
        setError('No pudimos cargar los datos. Por favor, intenta de nuevo.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()
    return () => { isMounted = false }
  }, [fetchWorkingHours, urlProfessionalId])

  // Carga de citas (Corregido: Dependencia por ID primitivo)
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
        console.error('Error cargando citas:', err)
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

  // Memorización de servicios filtrados
  const professionalServices = useMemo(() => {
    if (selectedProfessional?.services && selectedProfessional.services.length > 0) {
      return selectedProfessional.services
    }
    if (selectedCategory === 'all') return services
    return services.filter(s => getServiceCategory(s.category) === selectedCategory)
  }, [selectedProfessional, services, selectedCategory, getServiceCategory])

  // Optimización de Disponibilidad
  const checkAvailability = useCallback((time: string) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    if (selectedDate === today) {
      const now = format(new Date(), 'HH:mm')
      if (time < now) return { available: false, reason: 'pasado' }
    }

    const [h2, m2] = time.split(':').map(Number)
    const checkMinutes = h2 * 60 + m2

    for (const app of appointments) {
      if (!app.time) continue
      const startTime = app.time.substring(0, 5)
      const duration = app.services?.duration || 30

      const [h1, m1] = startTime.split(':').map(Number)
      const startMinutes = h1 * 60 + m1
      const endMinutes = startMinutes + duration

      if (checkMinutes >= startMinutes && checkMinutes < endMinutes) {
        return { 
          available: false, 
          reason: app.status === 'blocked' ? 'bloqueado' : 'ocupado' 
        }
      }
    }

    return { available: true, reason: '' }
  }, [appointments, selectedDate])

  const daysInMonth = useMemo(() => eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  }), [currentMonth])

  const isDayDisabled = useCallback((date: Date) => {
    const day = getDay(date)
    return day === 0 || day === 1 || isBefore(startOfDay(date), startOfDay(new Date()))
  }, [])

  const morningTimes = useMemo(() => availableTimes.filter(t => t < '14:00'), [availableTimes])
  const afternoonTimes = useMemo(() => availableTimes.filter(t => t >= '14:00'), [availableTimes])

  // Manejo de envío de formulario
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

      if (!clientId) throw new Error('No se pudo procesar el cliente')

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

      // Gestión de Loyalty Wallet sin fallos por .single()
      const POINTS = 50
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

      setStep(5)
    } catch (err) {
      setError('Ocurrió un error al reservar. Por favor, intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-rose-200/30 border-t-rose-400 animate-spin" />
            <Sparkles className="w-5 h-5 text-rose-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-xs text-stone-400 tracking-widest uppercase font-light animate-pulse">
            Cargando profesionales...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-zinc-950' : 'bg-stone-50'}`}>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* HEADER */}
        <div className={`p-6 rounded-2xl border transition-all duration-300 ${
          isDark ? 'bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border-zinc-800/50' : 'bg-white/80 border-rose-100/50 shadow-sm'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className={`text-sm font-serif italic ${isDark ? 'text-rose-400' : 'text-rose-500'}`}>
                ✦ Elige a tu especialista
              </span>
              <h1 className={`text-2xl font-serif font-light ${isDark ? 'text-white' : 'text-stone-800'}`}>
                Reserva con tu <span className="italic text-rose-500">profesional</span> favorito
              </h1>
            </div>
            {user && (
              <Link href="/reservas" className="px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all duration-300 flex items-center gap-2 border border-stone-200 hover:border-rose-300">
                <Calendar className="w-4 h-4" /> Mis citas <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* STEPPER */}
        {step < 5 && (
          <div className={`flex items-center gap-2 p-3 rounded-xl border ${isDark ? 'border-zinc-800/50 bg-zinc-900/30' : 'border-stone-200/50 bg-white/60'}`}>
            {[1, 2, 3, 4].map((num) => {
              const isActive = step === num
              const isCompleted = step > num
              const labels = ['Profesional', 'Servicio', 'Horario', 'Datos']
              return (
                <div key={num} className="flex-1 flex items-center gap-2">
                  <div className={`flex items-center gap-2 min-w-0 ${isActive ? 'flex-1' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isActive ? 'bg-rose-500 text-white shadow-lg' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-400'
                    }`}>
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : num}
                    </div>
                    <span className={`text-[9px] font-medium truncate hidden sm:block ${isActive ? 'text-stone-800 font-bold' : 'text-stone-400'}`}>
                      {labels[num - 1]}
                    </span>
                  </div>
                  {num < 4 && <div className="flex-1 h-px bg-stone-200" />}
                </div>
              )
            })}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="p-4 rounded-xl border flex items-start gap-3 bg-rose-50 border-rose-200 text-rose-600">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => setError(null)} className="text-xs underline opacity-70 hover:opacity-100">Cerrar</button>
            </div>
          </div>
        )}

        {/* CONTENIDO INTERACTIVO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            
            {/* PASO 1: PROFESIONALES */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {staff.map((prof, idx) => (
                  <button key={prof.id} onClick={() => { setSelectedProfessional(prof); setStep(2); }} className="p-5 rounded-2xl border text-left bg-white hover:shadow-md transition-all flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center font-bold text-xl overflow-hidden flex-shrink-0">
                      {prof.avatar_url && !avatarErrors[prof.id] ? (
                        <img 
                          src={prof.avatar_url} 
                          alt={prof.name} 
                          className="w-full h-full object-cover" 
                          onError={() => setAvatarErrors(prev => ({ ...prev, [prof.id]: true }))}
                        />
                      ) : (
                        prof.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-800">{prof.name}</h4>
                      <p className="text-xs text-stone-400">{prof.specialty || 'Especialista'}</p>
                      <div className="flex items-center gap-1 text-xs text-amber-500 mt-1">
                        <Star className="w-3 h-3 fill-current" /> {prof.rating?.toFixed(1) || '4.8'}
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {/* PASO 2: SERVICIOS */}
            {step === 2 && selectedProfessional && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-serif">Servicios de <span className="text-rose-500">{selectedProfessional.name}</span></h3>
                  <button onClick={() => setStep(1)} className="text-xs text-stone-400 hover:text-rose-500 flex items-center gap-1"><X className="w-3 h-3"/> Cambiar</button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon
                    return (
                      <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2 rounded-full text-xs flex items-center gap-2 ${selectedCategory === cat.id ? 'bg-rose-500 text-white' : 'bg-white text-stone-600 border'}`}>
                        <Icon className="w-3.5 h-3.5" /> {cat.label}
                      </button>
                    )
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {professionalServices.map(service => (
                    <button key={service.id} onClick={() => { setSelectedService(service); setStep(3); }} className="p-4 rounded-xl border bg-white text-left hover:border-rose-400 transition-all">
                      <h4 className="font-semibold text-sm">{service.name}</h4>
                      <p className="text-xs text-stone-400 line-clamp-1">{service.description}</p>
                      <div className="flex justify-between items-center mt-2 text-xs">
                        <span className="text-rose-500 font-bold">${Number(service.price).toLocaleString()}</span>
                        <span className="text-stone-400">{service.duration} min</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* PASO 3: CALENDARIO Y HORAS */}
            {step === 3 && selectedService && selectedProfessional && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-serif">Selecciona tu Horario</h3>
                  <button onClick={() => setStep(2)} className="text-xs text-stone-400 hover:text-rose-500"><X className="w-3 h-3"/> Cambiar</button>
                </div>

                {/* Grid simple de calendario */}
                <div className="p-4 bg-white rounded-xl border space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium uppercase">{format(currentMonth, 'MMMM yyyy', { locale: es })}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 border rounded"><ChevronLeft className="w-4 h-4"/></button>
                      <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 border rounded"><ChevronRight className="w-4 h-4"/></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {daysInMonth.map((day, i) => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const disabled = isDayDisabled(day)
                      return (
                        <button key={i} disabled={disabled} onClick={() => { setSelectedDate(dateStr); setSelectedTime(''); }} className={`p-2 rounded ${selectedDate === dateStr ? 'bg-rose-500 text-white' : disabled ? 'text-stone-200' : 'hover:bg-stone-100'}`}>
                          {format(day, 'd')}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Bloques Horarios */}
                <div className="p-4 bg-white rounded-xl border space-y-4">
                  <div>
                    <span className="text-xs text-stone-400 block mb-2">Turnos de Mañana</span>
                    <div className="flex flex-wrap gap-2">
                      {morningTimes.map(t => {
                        const { available } = checkAvailability(t)
                        return (
                          <button key={t} disabled={!available} onClick={() => setSelectedTime(t)} className={`px-3 py-1.5 rounded text-xs border ${selectedTime === t ? 'bg-rose-500 text-white' : 'bg-stone-50 disabled:opacity-30'}`}>
                            {t}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-stone-400 block mb-2">Turnos de Tarde</span>
                    <div className="flex flex-wrap gap-2">
                      {afternoonTimes.map(t => {
                        const { available } = checkAvailability(t)
                        return (
                          <button key={t} disabled={!available} onClick={() => setSelectedTime(t)} className={`px-3 py-1.5 rounded text-xs border ${selectedTime === t ? 'bg-rose-500 text-white' : 'bg-stone-50 disabled:opacity-30'}`}>
                            {t}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {selectedTime && (
                  <button onClick={() => setStep(4)} className="w-full py-3 bg-rose-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg">
                    Continuar <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )}

            {/* PASO 4: FORMULARIO CLIENTE */}
            {step === 4 && selectedService && selectedProfessional && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 bg-white rounded-xl border space-y-4">
                <h3 className="text-lg font-serif">Completa tus datos personales</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Nombre Completo *</label>
                    <input type="text" required value={clientData.name} onChange={e => setClientData({...clientData, name: e.target.value})} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Tu nombre" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">WhatsApp / Teléfono *</label>
                    <input type="tel" required value={clientData.phone} onChange={e => setClientData({...clientData, phone: e.target.value})} className="w-full border p-2.5 rounded-lg text-sm" placeholder="Ej: 099123456" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Correo Electrónico</label>
                    <input type="email" value={clientData.email} onChange={e => setClientData({...clientData, email: e.target.value})} className="w-full border p-2.5 rounded-lg text-sm" placeholder="tu@correo.com" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Notas o Aclaraciones</label>
                    <textarea value={clientData.notes} onChange={e => setClientData({...clientData, notes: e.target.value})} className="w-full border p-2.5 rounded-lg text-sm resize-none" rows={3} placeholder="Detalles particulares..." />
                  </div>

                  <button type="submit" disabled={submitting} className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl disabled:opacity-50">
                    {submitting ? 'Procesando Reserva...' : 'Confirmar Cita'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* PASO 5: PANTALLA DE ÉXITO */}
            {step === 5 && selectedService && selectedProfessional && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 bg-white rounded-2xl border text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-serif font-light text-stone-800">¡Tu reserva está <span className="text-rose-500 font-normal">confirmada</span>!</h2>
                <p className="text-sm text-stone-500">Te esperamos el próximo <strong>{format(parseISO(selectedDate), "d 'de' MMMM", { locale: es })}</strong> a las {selectedTime} hs.</p>
                
                <button onClick={() => { setStep(1); setSelectedService(null); setSelectedTime(''); }} className="mt-4 px-6 py-2 bg-stone-100 rounded-xl text-sm font-medium hover:bg-stone-200 transition-all">
                  Volver al inicio
                </button>
              </motion.div>
            )}

          </div>

          {/* SIDEBAR: RESUMEN DE COMPRA */}
          {step > 1 && step < 5 && (
            <div className="p-5 bg-white rounded-xl border h-fit space-y-4 lg:sticky lg:top-6">
              <span className="text-xs uppercase tracking-wider text-stone-400 block font-bold">Resumen</span>
              <div className="space-y-2 text-sm">
                {selectedProfessional && <div><p className="text-stone-400 text-xs">Especialista</p><p className="font-medium">{selectedProfessional.name}</p></div>}
                {selectedService && <div className="pt-2 border-t"><p className="text-stone-400 text-xs">Servicio</p><p className="font-medium">{selectedService.name}</p></div>}
                {selectedTime && <div className="pt-2 border-t"><p className="text-stone-400 text-xs">Fecha y Hora</p><p className="font-medium">{selectedDate} a las {selectedTime} hs</p></div>}
              </div>
              {selectedService && (
                <div className="pt-3 border-t flex justify-between items-center font-bold text-stone-800">
                  <span>Total:</span>
                  <span className="text-rose-500 text-lg">${Number(selectedService.price).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function ClientBookingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-t-rose-400 animate-spin" />
      </div>
    }>
      <AgendaContent />
    </Suspense>
  )
}
