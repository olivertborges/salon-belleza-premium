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
import { 
  Calendar, User, Sparkles, ChevronRight, 
  CheckCircle2, ChevronLeft, Phone, Mail, FileText,
  Scissors, Heart, ArrowRight, Check, X, Crown, Star,
  Clock, Search, ChevronDown, Plus, Trash2
} from 'lucide-react'

// ============================================================
// INTERFACES
// ============================================================
interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  category: string
  subcategory?: string
  is_active: boolean
}

interface Staff {
  id: string
  name: string
  specialty?: string
  avatar_url?: string
  is_active: boolean
  rating?: number
  reviews_count?: number
  biography?: string
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

const CATEGORIES = [
  { id: 'nails', label: 'Uñas & Manicuría', icon: Heart },
  { id: 'micropigmentation', label: 'Micropigmentación & Mirada', icon: Crown },
  { id: 'hair', label: 'Peluquería & Color', icon: Scissors },
  { id: 'others', label: 'Otros Tratamientos', icon: Star },
]

const DEFAULT_TIMES = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30'
]

// ============================================================
// COMPONENTE DE CARGA
// ============================================================
const BookingLoadingSpinner = ({ isDark }: { isDark: boolean }) => (
  <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-500 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-16 h-16">
        <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
        <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
      </div>
      <p className={`text-[10px] tracking-[0.4em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]/60'}`}>
        Cargando agenda de belleza...
      </p>
    </div>
  </div>
)

function AgendaContent() {
  const { theme } = useTheme()
  const { user, tenantId } = useAuth()
  const isDark = theme === 'dark'
  const searchParams = useSearchParams()
  const urlProfessionalId = searchParams?.get('professional') || null

  // Estados
  const [staff, setStaff] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Selecciones
  const [step, setStep] = useState(1)
  const [selectedProfessional, setSelectedProfessional] = useState<Staff | null>(null)
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    nails: true,
    micropigmentation: true,
    hair: true,
    others: true
  })
  const [selectedDate, setSelectedDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'))
  const [selectedTime, setSelectedTime] = useState('')
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({})

  const [clientData, setClientData] = useState<ClientData>({ 
    name: '', phone: '', email: '', notes: '' 
  })

  useEffect(() => {
    if (user) {
      setClientData(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        email: user.email || ''
      }))
    }
  }, [user])

  const fetchWorkingHours = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('working_hours')
        .select('start_time')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('start_time', { ascending: true })

      return data && data.length > 0 ? data.map((h: any) => h.start_time.substring(0, 5)) : DEFAULT_TIMES
    } catch {
      return DEFAULT_TIMES
    }
  }, [tenantId])

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

        const staffData = staffRes.data || []
        const servicesData = servicesRes.data || []

        setStaff(staffData)
        setServices(servicesData)
        setAvailableTimes(hours)

        if (urlProfessionalId) {
          const foundStaff = staffData.find((p: any) => p.id === urlProfessionalId)
          if (foundStaff) {
            setSelectedProfessional(foundStaff)
            setStep(2)
          }
        }
      } catch (err) {
        setError('Error al conectar con el catálogo de Supabase.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()
    return () => { isMounted = false }
  }, [fetchWorkingHours, urlProfessionalId])

  useEffect(() => {
    if (!selectedProfessional?.id) return
    let isMounted = true

    const fetchAppointments = async () => {
      try {
        const { data } = await supabase
          .from('appointments')
          .select('time, status, service_id, services:service_id(duration)')
          .eq('professional_id', selectedProfessional.id)
          .eq('date', selectedDate)
          .neq('status', 'cancelled')

        if (data && isMounted) setAppointments(data as any)
      } catch (err) {
        console.error(err)
      }
    }

    fetchAppointments()
    return () => { isMounted = false }
  }, [selectedDate, selectedProfessional])

  const getServiceCategory = useCallback((catName: string): string => {
    if (!catName) return 'others'
    const norm = catName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()

    if (norm === 'unas' || norm === 'manicuria' || norm.includes('mano') || norm.includes('pie')) return 'nails'
    if (norm === 'cejas' || norm === 'pestanas' || norm === 'labios' || norm.includes('micro')) return 'micropigmentation'
    if (norm === 'corte' || norm === 'color' || norm.includes('pelu')) return 'hair'

    return 'others'
  }, [])

  const servicesByCategory = useMemo(() => {
    if (!selectedProfessional) return { nails: [], micropigmentation: [], hair: [], others: [] }

    const specText = selectedProfessional.specialty?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || ''

    let baseServices = services.filter(service => {
      const sCat = service.category?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || ''

      const targetsNails = specText.includes('una') || specText.includes('manicur') || specText.includes('mano') || specText.includes('pie')
      const targetsMicro = specText.includes('micro') || specText.includes('ceja') || specText.includes('pestana') || specText.includes('labio')
      const targetsHair = specText.includes('pelu') || specText.includes('corte') || specText.includes('color')

      if (targetsNails && (sCat === 'unas' || sCat === 'manicuria' || sCat.includes('mano') || sCat.includes('pie'))) {
        return true
      }
      if (targetsMicro && (sCat === 'cejas' || sCat === 'pestanas' || sCat === 'labios' || sCat.includes('micro'))) {
        return true
      }
      if (targetsHair && (sCat === 'corte' || sCat === 'color' || sCat.includes('pelu'))) {
        return true
      }

      const matchesCategory = (sCat === 'unas' || sCat === 'manicuria') && (specText.includes('una') || specText.includes('manic')) ||
                              (sCat === 'cejas' || sCat === 'pestanas' || sCat === 'labios') && (specText.includes('ceja') || specText.includes('pestan') || specText.includes('labio') || specText.includes('micro')) ||
                              (sCat === 'corte' || sCat === 'color') && (specText.includes('pelu') || specText.includes('corte') || specText.includes('color'))

      return matchesCategory
    })

    if (baseServices.length === 0) {
      baseServices = services
    }

    const filtered = baseServices.filter(s => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      const nameNorm = s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      const descNorm = (s.description || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      return nameNorm.includes(query) || descNorm.includes(query)
    })

    const groups: Record<string, Service[]> = { nails: [], micropigmentation: [], hair: [], others: [] }
    filtered.forEach(s => {
      const catId = getServiceCategory(s.category)
      if (groups[catId]) groups[catId].push(s)
      else groups['others'].push(s)
    })

    return groups
  }, [selectedProfessional, services, searchQuery, getServiceCategory])

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

  const totalDuration = useMemo(() => selectedServices.reduce((sum, s) => sum + s.duration, 0), [selectedServices])
  const totalPrice = useMemo(() => selectedServices.reduce((sum, s) => sum + Number(s.price), 0), [selectedServices])

  const checkAvailability = useCallback((time: string) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    if (selectedDate === today) {
      const now = format(new Date(), 'HH:mm')
      if (time < now) return { available: false }
    }

    const [h2, m2] = time.split(':').map(Number)
    const checkStart = h2 * 60 + m2
    const checkEnd = checkStart + totalDuration

    for (const app of appointments) {
      if (!app.time) continue
      const [h1, m1] = app.time.substring(0, 5).split(':').map(Number)
      const start = h1 * 60 + m1
      const end = start + (app.services?.duration || 30)

      if (checkStart < end && checkEnd > start) {
        return { available: false }
      }
    }
    return { available: true }
  }, [appointments, selectedDate, totalDuration])

  const daysInMonth = useMemo(() => eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  }), [currentMonth])

  const isDayDisabled = useCallback((date: Date) => {
    const day = getDay(date)
    return day === 0 || isBefore(startOfDay(date), startOfDay(new Date()))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientData.name || !clientData.phone) {
      setError('Nombre y WhatsApp requeridos.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      let clientId = null

      if (user?.id) {
        const { data: ec } = await supabase.from('clients').select('id').eq('auth_user_id', user.id).maybeSingle()
        if (ec) clientId = ec.id
      }

      if (!clientId) {
        const { data: pm } = await supabase.from('clients').select('id').eq('phone', clientData.phone.trim()).limit(1)
        if (pm && pm.length > 0) clientId = pm[0].id
      }

      if (!clientId) {
        const { data: nc, error: ce } = await supabase.from('clients').insert([{
          name: clientData.name.trim(),
          phone: clientData.phone.trim(),
          email: clientData.email.trim() || null,
          auth_user_id: user?.id || null,
          tenant_id: tenantId,
          points: 0,
          is_active: true
        }]).select('id')
        if (ce) throw ce
        clientId = nc?.[0]?.id
      }

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

      const { error: ae } = await supabase.from('appointments').insert(appointmentsToInsert)
      if (ae) throw ae

      setShowSummaryModal(false)
      setStep(5)
    } catch (err) {
      setError('Problema al guardar la cita.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <BookingLoadingSpinner isDark={isDark} />
  }

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-500 antialiased ${
      isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'
    }`}>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 relative z-10">

        {/* ENCABEZADO */}
        <div className={`p-6 rounded-2xl border transition-all duration-300 ${
          isDark 
            ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_15px_35px_rgba(0,0,0,0.3)]' 
            : 'bg-white border-[#F0E4DA] shadow-[0_15px_35px_rgba(240,228,218,0.6)]'
        }`}>
          <span className="text-[10px] font-bold tracking-[0.3em] text-[#D4AF37] uppercase block mb-1">
            ✦ Panel de Reservas
          </span>
          <h1 className={`font-serif text-3xl font-light tracking-tight ${
            isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
          }`}>
            Reserva tu Turno
          </h1>
          <p className={`text-xs font-light mt-1 ${
            isDark ? 'text-[#FFF9F6]/60' : 'text-[#5C4A3E]'
          }`}>
            Sincronización automática de especialidades según los registros de la base de datos.
          </p>
        </div>

        {/* STEPPER HOMOGÉNEO */}
        {step < 5 && (
          <div className={`p-6 rounded-2xl border transition-all duration-300 ${
            isDark 
              ? 'bg-[#2A1B14]/40 border-[#3D281E]' 
              : 'bg-white border-[#F0E4DA] shadow-sm'
          }`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
              {[1, 2, 3, 4].map((num) => {
                const isActive = step === num
                const isCompleted = step > num
                return (
                  <div 
                    key={num} 
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isActive 
                        ? isDark ? 'bg-[#3D281E] border border-[#D4AF37]/40' : 'bg-[#FFF9F6] border border-[#D4AF37]/30'
                        : ''
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors flex-shrink-0 ${
                      isActive 
                        ? 'bg-[#D4AF37] text-[#1A0E0A]' 
                        : isCompleted 
                          ? 'bg-[#D4AF37]/30 text-[#D4AF37]' 
                          : isDark ? 'bg-[#3D281E] text-[#FFF9F6]/40' : 'bg-[#F0E4DA] text-[#5C4A3E]'
                    }`}>
                      {isCompleted ? <Check className="w-3 h-3" /> : num}
                    </div>
                    <span className={`text-[11px] tracking-wide transition-all ${
                      isActive 
                        ? 'font-bold text-[#D4AF37]'
                        : isDark ? 'text-[#FFF9F6]/60' : 'text-[#5C4A3E]'
                    }`}>
                      {['1. Perfil', '2. Servicios', '3. Horario', '4. Registrar'][num - 1]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">

            {error && (
              <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 ${
                isDark ? 'bg-[#3D281E]/60 text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'
              }`}>
                <X className="w-4 h-4 cursor-pointer text-[#D4AF37]" onClick={() => setError(null)} /> 
                {error}
              </div>
            )}

            {/* PASO 1 */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staff.map((prof) => (
                  <div 
                    key={prof.id} 
                    onClick={() => { setSelectedProfessional(prof); setStep(2); }}
                    className={`p-6 rounded-2xl border cursor-pointer text-left transition-all duration-300 hover:-translate-y-0.5 ${
                      isDark 
                        ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
                        : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
                    }`}
                  >
                    <div className="flex gap-4 items-center">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center border shrink-0 overflow-hidden ${
                        isDark ? 'bg-[#3D281E] border-[#D4AF37]/40' : 'bg-[#FFF9F6] border-[#D4AF37]/30'
                      }`}>
                        {prof.avatar_url && !avatarErrors[prof.id] ? (
                          <img src={prof.avatar_url} alt="" className="w-full h-full object-cover" onError={() => setAvatarErrors(prev => ({ ...prev, [prof.id]: true }))}/>
                        ) : (
                          <span className={`font-serif text-xl font-light ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                            {prof.name?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className={`font-serif text-lg font-light ${
                          isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                        }`}>
                          {prof.name}
                        </h3>
                        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#D4AF37]">
                          {prof.specialty || 'Especialista'}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-[#D4AF37] mt-0.5">
                          <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" /> 
                          <span>{prof.rating || '4.9'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PASO 2 */}
            {step === 2 && selectedProfessional && (
              <div className="space-y-4">
                <div className={`flex justify-between items-center pb-3 border-b ${
                  isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
                }`}>
                  <div>
                    <h2 className={`font-serif text-xl font-light ${
                      isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                    }`}>
                      Servicios Asignados
                    </h2>
                    <p className={`text-[10px] font-light ${
                      isDark ? 'text-[#FFF9F6]/60' : 'text-[#5C4A3E]'
                    }`}>
                      Tratamientos correspondientes a la especialidad de {selectedProfessional.name}.
                    </p>
                  </div>
                  <button 
                    onClick={() => { setStep(1); setSelectedServices([]); }} 
                    className={`text-[9px] font-bold tracking-[0.2em] uppercase transition-colors ${
                      isDark ? 'text-[#A89588] hover:text-[#D4AF37]' : 'text-[#5C4A3E] hover:text-[#D4AF37]'
                    }`}
                  >
                    Cambiar
                  </button>
                </div>

                <div className="relative">
                  <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                  }`} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Escribe para buscar un tratamiento..." 
                    className={`w-full border rounded-xl text-xs pl-10 pr-4 py-2.5 transition-all duration-300 ${
                      isDark 
                        ? 'bg-[#2A1B14] border-[#3D281E] text-[#FFF9F6] placeholder-[#A89588] focus:border-[#D4AF37]/60' 
                        : 'bg-white border-[#F0E4DA] text-[#1A0E0A] placeholder-[#A89588] focus:border-[#D4AF37]/60'
                    }`}
                  />
                </div>

                <div className="space-y-3">
                  {CATEGORIES.map(cat => {
                    const categoryServices = servicesByCategory[cat.id] || []
                    const isExpanded = !!expandedCategories[cat.id]
                    if (categoryServices.length === 0) return null

                    return (
                      <div key={cat.id} className={`border rounded-xl overflow-hidden transition-all duration-300 ${
                        isDark ? 'bg-[#2A1B14]/40 border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
                      }`}>
                        <button 
                          type="button" 
                          onClick={() => toggleCategory(cat.id)}
                          className={`w-full px-4 py-3 flex justify-between items-center text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${
                            isDark ? 'bg-[#3D281E]/40 text-[#FFF9F6]/70 hover:text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#5C4A3E] hover:text-[#1A0E0A]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <cat.icon className="w-3.5 h-3.5 text-[#D4AF37]" />
                            {cat.label} ({categoryServices.length})
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''} text-[#A89588]`} />
                        </button>

                        {isExpanded && (
                          <div className={`p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t ${
                            isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
                          }`}>
                            {categoryServices.map(service => {
                              const isSelected = selectedServices.some(s => s.id === service.id)
                              return (
                                <div 
                                  key={service.id}
                                  onClick={() => toggleServiceSelection(service)}
                                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-300 flex flex-col justify-between relative hover:-translate-y-0.5 ${
                                    isSelected 
                                      ? isDark 
                                        ? 'bg-[#3D281E] border-[#D4AF37]/60 shadow-[0_4px_15px_rgba(212,175,55,0.1)]' 
                                        : 'bg-[#FFF9F6] border-[#D4AF37]/60 shadow-[0_4px_15px_rgba(212,175,55,0.1)]'
                                      : isDark 
                                        ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/30' 
                                        : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/30'
                                  }`}
                                >
                                  <div className="pr-6">
                                    <h4 className={`text-xs font-semibold ${
                                      isSelected 
                                        ? 'text-[#D4AF37]' 
                                        : isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                                    }`}>
                                      {service.name}
                                    </h4>
                                    <p className={`text-[10px] font-light line-clamp-2 mt-0.5 ${
                                      isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                                    }`}>
                                      {service.description || 'Servicio premium del salón.'}
                                    </p>
                                  </div>
                                  <div className={`flex justify-between items-center mt-3 pt-2 border-t text-[9px] font-bold tracking-[0.1em] ${
                                    isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
                                  }`}>
                                    <span className={`flex items-center gap-1 ${
                                      isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                                    }`}>
                                      <Clock className="w-3 h-3" /> {service.duration} min
                                    </span>
                                    <span className="text-[#D4AF37]">
                                      ${Number(service.price).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className={`absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold transition-all ${
                                    isSelected 
                                      ? 'bg-[#D4AF37] text-[#1A0E0A]' 
                                      : isDark ? 'bg-[#3D281E] text-[#A89588]' : 'bg-[#F0E4DA] text-[#A89588]'
                                  }`}>
                                    {isSelected ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* PASO 3 */}
            {step === 3 && (
              <div className="space-y-4">
                <div className={`flex justify-between items-center pb-3 border-b ${
                  isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
                }`}>
                  <h2 className={`font-serif text-xl font-light ${
                    isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                  }`}>
                    Fecha y Hora
                  </h2>
                  <button 
                    onClick={() => setStep(2)} 
                    className={`text-[9px] font-bold tracking-[0.2em] uppercase transition-colors ${
                      isDark ? 'text-[#A89588] hover:text-[#D4AF37]' : 'text-[#5C4A3E] hover:text-[#D4AF37]'
                    }`}
                  >
                    Volver
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Calendario */}
                  <div className={`md:col-span-3 p-6 border rounded-2xl transition-all duration-300 space-y-4 ${
                    isDark 
                      ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
                      : 'bg-white border-[#F0E4DA] shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
                  }`}>
                    <div className={`flex justify-between items-center text-xs font-bold ${
                      isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                    }`}>
                      <span className="font-serif text-sm font-light uppercase tracking-wide">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                      </span>
                      <div className="flex gap-1">
                        <button 
                          type="button" 
                          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isDark ? 'border-[#3D281E] hover:bg-[#3D281E]' : 'border-[#F0E4DA] hover:bg-[#FFF9F6]'
                          }`}
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isDark ? 'border-[#3D281E] hover:bg-[#3D281E]' : 'border-[#F0E4DA] hover:bg-[#FFF9F6]'
                          }`}
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className={`grid grid-cols-7 gap-1 text-center text-[9px] font-bold tracking-[0.2em] uppercase ${
                      isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                    }`}>
                      {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, idx) => <div key={idx}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {daysInMonth.map((day, i) => {
                        const dateStr = format(day, 'yyyy-MM-dd')
                        const disabled = isDayDisabled(day)
                        const isSelected = selectedDate === dateStr
                        return (
                          <button 
                            key={i} 
                            type="button"
                            disabled={disabled}
                            onClick={() => { setSelectedDate(dateStr); setSelectedTime(''); }}
                            className={`p-2 text-xs font-serif font-light rounded-lg text-center transition-all duration-300 ${
                              isSelected 
                                ? 'bg-[#D4AF37] text-[#1A0E0A] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' 
                                : disabled 
                                  ? isDark ? 'text-[#3D281E] cursor-not-allowed' : 'text-[#F0E4DA] cursor-not-allowed'
                                  : isDark 
                                    ? 'text-[#FFF9F6]/70 hover:bg-[#3D281E] hover:text-[#FFF9F6]' 
                                    : 'text-[#5C4A3E] hover:bg-[#FFF9F6] hover:text-[#1A0E0A]'
                            }`}
                          >
                            {format(day, 'd')}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Horarios */}
                  <div className={`md:col-span-2 p-6 border rounded-2xl transition-all duration-300 max-h-[340px] overflow-y-auto space-y-4 ${
                    isDark 
                      ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
                      : 'bg-white border-[#F0E4DA] shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
                  }`}>
                    <span className={`text-[9px] font-bold tracking-[0.3em] uppercase block ${
                      isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                    }`}>
                      Turnos
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {availableTimes.map(t => {
                        const { available } = checkAvailability(t)
                        return (
                          <button 
                            key={t}
                            type="button"
                            disabled={!available}
                            onClick={() => setSelectedTime(t)}
                            className={`py-2 text-xs rounded-lg border font-medium transition-all duration-300 ${
                              selectedTime === t 
                                ? 'bg-[#D4AF37] text-[#1A0E0A] border-[#D4AF37] shadow-[0_2px_10px_rgba(212,175,55,0.3)]' 
                                : available 
                                  ? isDark 
                                    ? 'bg-[#2A1B14] border-[#3D281E] text-[#FFF9F6]/70 hover:border-[#D4AF37]/40 hover:text-[#FFF9F6]' 
                                    : 'bg-white border-[#F0E4DA] text-[#5C4A3E] hover:border-[#D4AF37]/40 hover:text-[#1A0E0A]'
                                  : isDark 
                                    ? 'bg-[#1E120C] border-[#3D281E] text-[#3D281E] cursor-not-allowed line-through' 
                                    : 'bg-[#F0E4DA] border-[#F0E4DA] text-[#A89588] cursor-not-allowed line-through'
                            }`}
                          >
                            {t}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {selectedTime && (
                  <button 
                    onClick={() => setStep(4)} 
                    className={`w-full py-3.5 font-bold rounded-xl text-[10px] tracking-[0.3em] uppercase transition-all duration-300 shadow-md hover:shadow-lg ${
                      isDark 
                        ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                        : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37]'
                    }`}
                  >
                    Continuar al Formulario
                  </button>
                )}
              </div>
            )}

            {/* PASO 4 */}
            {step === 4 && (
              <div className={`p-6 border rounded-2xl transition-all duration-300 space-y-4 ${
                isDark 
                  ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
                  : 'bg-white border-[#F0E4DA] shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
              }`}>
                <h3 className={`font-serif text-xl font-light border-b pb-2 ${
                  isDark ? 'text-[#FFF9F6] border-[#3D281E]' : 'text-[#1A0E0A] border-[#F0E4DA]'
                }`}>
                  Información de Contacto
                </h3>
                <form onSubmit={e => { e.preventDefault(); setShowSummaryModal(true); }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`text-[9px] font-bold tracking-[0.2em] uppercase block mb-1 ${
                        isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                      }`}>
                        Nombre Completo *
                      </label>
                      <input 
                        type="text" 
                        required 
                        value={clientData.name} 
                        onChange={e => setClientData({...clientData, name: e.target.value})} 
                        className={`w-full border rounded-xl px-3 py-2.5 text-xs transition-all duration-300 ${
                          isDark 
                            ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] placeholder-[#A89588] focus:border-[#D4AF37]/60' 
                            : 'bg-white border-[#F0E4DA] text-[#1A0E0A] placeholder-[#A89588] focus:border-[#D4AF37]/60'
                        }`}
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <label className={`text-[9px] font-bold tracking-[0.2em] uppercase block mb-1 ${
                        isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                      }`}>
                        WhatsApp de contacto *
                      </label>
                      <input 
                        type="tel" 
                        required 
                        value={clientData.phone} 
                        onChange={e => setClientData({...clientData, phone: e.target.value})} 
                        className={`w-full border rounded-xl px-3 py-2.5 text-xs transition-all duration-300 ${
                          isDark 
                            ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] placeholder-[#A89588] focus:border-[#D4AF37]/60' 
                            : 'bg-white border-[#F0E4DA] text-[#1A0E0A] placeholder-[#A89588] focus:border-[#D4AF37]/60'
                        }`}
                        placeholder="Ej: 099123456"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`text-[9px] font-bold tracking-[0.2em] uppercase block mb-1 ${
                      isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                    }`}>
                      Notas Adicionales
                    </label>
                    <textarea 
                      value={clientData.notes} 
                      onChange={e => setClientData({...clientData, notes: e.target.value})} 
                      className={`w-full border rounded-xl p-3 text-xs transition-all duration-300 resize-none ${
                        isDark 
                          ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] placeholder-[#A89588] focus:border-[#D4AF37]/60' 
                          : 'bg-white border-[#F0E4DA] text-[#1A0E0A] placeholder-[#A89588] focus:border-[#D4AF37]/60'
                      }`}
                      rows={3} 
                      placeholder="Detalles de interés..."
                    />
                  </div>
                  <button 
                    type="submit" 
                    className={`w-full py-3.5 font-bold rounded-xl text-[10px] tracking-[0.3em] uppercase transition-all duration-300 shadow-md hover:shadow-lg ${
                      isDark 
                        ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                        : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37]'
                    }`}
                  >
                    Ver Resumen del Turno
                  </button>
                </form>
              </div>
            )}

            {/* PASO 5 */}
            {step === 5 && (
              <div className={`p-8 border rounded-2xl text-center transition-all duration-300 shadow-lg max-w-md mx-auto ${
                isDark 
                  ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_15px_35px_rgba(0,0,0,0.3)]' 
                  : 'bg-white border-[#F0E4DA] shadow-[0_15px_35px_rgba(240,228,218,0.6)]'
              }`}>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto border ${
                  isDark ? 'bg-[#3D281E] border-[#D4AF37]/40' : 'bg-[#FFF9F6] border-[#D4AF37]/30'
                }`}>
                  <CheckCircle2 className="w-8 h-8 text-[#D4AF37]" />
                </div>
                <h2 className={`font-serif text-2xl font-light mt-4 ${
                  isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                }`}>
                  ¡Turno Agendado con Éxito!
                </h2>
                <p className={`text-xs font-light mt-1 ${
                  isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                }`}>
                  Tu cita ha sido guardada satisfactoriamente en nuestra agenda.
                </p>
                <div className={`mt-4 p-4 rounded-xl text-left text-xs space-y-2 transition-all ${
                  isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'
                }`}>
                  <div className={isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}>
                    <strong>Profesional:</strong> {selectedProfessional?.name}
                  </div>
                  <div className={isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}>
                    <strong>Fecha y Hora:</strong> {selectedDate} a las {selectedTime} hs
                  </div>
                  <div className={`border-t pt-2 ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`}>
                    <strong className={isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}>Tratamientos:</strong>
                    {selectedServices.map(s => (
                      <div key={s.id} className={isDark ? 'text-[#A89588] pl-2' : 'text-[#5C4A3E] pl-2'}>
                        • {s.name}
                      </div>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => { setStep(1); setSelectedServices([]); setSelectedTime(''); }} 
                  className={`mt-4 w-full py-3 font-bold rounded-xl text-[10px] tracking-[0.3em] uppercase transition-all duration-300 ${
                    isDark 
                      ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                      : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37]'
                  }`}
                >
                  Volver al Panel Principal
                </button>
              </div>
            )}

          </div>

          {/* SIDEBAR - RESUMEN CON BOTONES DE ESCRITORIO */}
          {step > 1 && step < 5 && (
            <div className={`p-6 border rounded-2xl transition-all duration-300 space-y-4 lg:sticky lg:top-4 ${
              isDark 
                ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
                : 'bg-white border-[#F0E4DA] shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
            }`}>
              <span className={`text-[9px] font-bold tracking-[0.3em] uppercase block border-b pb-2 ${
                isDark ? 'text-[#A89588] border-[#3D281E]' : 'text-[#5C4A3E] border-[#F0E4DA]'
              }`}>
                Resumen
              </span>

              {selectedProfessional && (
                <div className="text-xs">
                  <span className={`block text-[9px] font-bold tracking-[0.2em] uppercase ${
                    isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                  }`}>
                    Especialista
                  </span>
                  <span className={`font-serif text-sm font-light ${
                    isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                  }`}>
                    {selectedProfessional.name}
                  </span>
                </div>
              )}

              {selectedServices.length > 0 && (
                <div className={`space-y-1.5 text-xs pt-2 border-t ${
                  isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
                }`}>
                  <span className={`block text-[9px] font-bold tracking-[0.2em] uppercase ${
                    isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                  }`}>
                    Tratamientos
                  </span>
                  {selectedServices.map(s => (
                    <div key={s.id} className={`flex justify-between items-center p-2 rounded-lg text-[10px] transition-all ${
                      isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'
                    }`}>
                      <span className={isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}>
                        {s.name}
                      </span>
                      <button 
                        onClick={() => toggleServiceSelection(s)} 
                        className="text-[#A89588] hover:text-[#D4AF37]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {selectedTime && (
                <div className={`text-xs pt-2 border-t ${
                  isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
                }`}>
                  <span className={`block text-[9px] font-bold tracking-[0.2em] uppercase ${
                    isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                  }`}>
                    Fecha y Hora
                  </span>
                  <span className={`font-medium ${
                    isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                  }`}>
                    {selectedDate} — {selectedTime} hs
                  </span>
                </div>
              )}

              {selectedServices.length > 0 && (
                <div className={`pt-3 border-t flex justify-between items-center font-bold mb-2 ${
                  isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
                }`}>
                  <span className={`text-[9px] font-bold tracking-[0.2em] uppercase ${
                    isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                  }`}>
                    Monto Final:
                  </span>
                  <span className="font-serif text-lg text-[#D4AF37]">
                    ${totalPrice.toLocaleString()}
                  </span>
                </div>
              )}

              {/* BOTONES DE AVANCE EN PANTALLA GRANDE (ESCRITORIO) */}
              {step === 2 && selectedServices.length > 0 && (
                <button 
                  onClick={() => setStep(3)} 
                  className={`hidden lg:flex w-full mt-4 px-5 py-3 font-bold rounded-xl text-[10px] tracking-[0.25em] uppercase shadow-md items-center justify-center gap-2 transition-all duration-300 ${
                    isDark 
                      ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                      : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37]'
                  }`}
                >
                  Elegir Horario <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {step === 3 && selectedTime && (
                <button 
                  onClick={() => setStep(4)} 
                  className={`hidden lg:flex w-full mt-4 px-5 py-3 font-bold rounded-xl text-[10px] tracking-[0.25em] uppercase shadow-md items-center justify-center gap-2 transition-all duration-300 ${
                    isDark 
                      ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                      : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37]'
                  }`}
                >
                  Ir al Formulario <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      {/* FOOTER MÓVIL PARA PASO 2 Y PASO 3 */}
      {((step === 2 && selectedServices.length > 0) || (step === 3 && selectedTime)) && (
        <div className={`fixed bottom-0 left-0 right-0 z-40 p-4 shadow-xl flex items-center justify-between lg:hidden transition-all duration-300 ${
          isDark ? 'bg-[#2A1B14] border-t border-[#3D281E]' : 'bg-white border-t border-[#F0E4DA]'
        }`}>
          <div className="text-left">
            <span className={`text-[9px] font-bold tracking-[0.2em] uppercase block ${
              isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
            }`}>
              Total
            </span>
            <span className="font-serif text-base font-bold text-[#D4AF37]">
              ${totalPrice.toLocaleString()}
            </span>
          </div>
          {step === 2 ? (
            <button 
              onClick={() => setStep(3)} 
              className={`px-5 py-2.5 font-bold rounded-xl text-[10px] tracking-[0.25em] uppercase shadow-md flex items-center gap-1 transition-all duration-300 ${
                isDark 
                  ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                  : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37]'
              }`}
            >
              Elegir Horario <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={() => setStep(4)} 
              className={`px-5 py-2.5 font-bold rounded-xl text-[10px] tracking-[0.25em] uppercase shadow-md flex items-center gap-1 transition-all duration-300 ${
                isDark 
                  ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                  : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37]'
              }`}
            >
              Ir al Formulario <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A0E0A]/60 backdrop-blur-sm">
          <div className={`rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4 transition-all duration-300 ${
            isDark 
              ? 'bg-[#2A1B14] border border-[#3D281E]' 
              : 'bg-white border border-[#F0E4DA]'
          }`}>
            <h3 className={`font-serif text-xl font-light border-b pb-2 ${
              isDark ? 'text-[#FFF9F6] border-[#3D281E]' : 'text-[#1A0E0A] border-[#F0E4DA]'
            }`}>
              Confirmar Cita
            </h3>
            <div className={`text-xs space-y-2 p-3 rounded-xl border ${
              isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
            }`}>
              <div className={isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}>
                <strong>Cliente:</strong> {clientData.name}
              </div>
              <div className={isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}>
                <strong>WhatsApp:</strong> {clientData.phone}
              </div>
              <div className={isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}>
                <strong>Especialista:</strong> {selectedProfessional?.name}
              </div>
              <div className={isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}>
                <strong>Fecha/Hora:</strong> {selectedDate} a las {selectedTime} hs
              </div>
              <div className={`border-t pt-2 ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`}>
                <strong className={isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}>
                  Importe Total:
                </strong>
                <span className="font-serif font-bold ml-1 text-[#D4AF37]">
                  ${totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setShowSummaryModal(false)} 
                className={`flex-1 py-2 border rounded-xl text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 ${
                  isDark 
                    ? 'border-[#3D281E] text-[#A89588] hover:bg-[#3D281E] hover:text-[#FFF9F6]' 
                    : 'border-[#F0E4DA] text-[#5C4A3E] hover:bg-[#FFF9F6] hover:text-[#1A0E0A]'
                }`}
              >
                Editar
              </button>
              <button 
                type="button" 
                onClick={handleSubmit} 
                disabled={submitting} 
                className={`flex-1 py-2 font-bold rounded-xl text-[10px] tracking-[0.2em] uppercase transition-all duration-300 disabled:opacity-50 ${
                  isDark 
                    ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                    : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37]'
                }`}
              >
                {submitting ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default function ClientBookingPage() {
  return (
    <Suspense fallback={<BookingLoadingSpinner isDark={false} />}>
      <AgendaContent />
    </Suspense>
  )
}
