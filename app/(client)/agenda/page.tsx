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

// Mapeo visual de categorías según los datos reales extraídos
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

  // Autofill del usuario autenticado
  useEffect(() => {
    if (user) {
      setClientData(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        email: user.email || ''
      }))
    }
  }, [user])

  // Obtener horarios base de trabajo
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

  // Carga inicial de datos desde Supabase
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

  // Cargar citas del profesional seleccionado para la fecha dada
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

  // Clasificador de categorías visuales según las respuestas de la BD
  const getServiceCategory = useCallback((catName: string): string => {
    if (!catName) return 'others'
    const norm = catName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    
    if (norm === 'unas' || norm === 'manicuria' || norm.includes('mano') || norm.includes('pie')) return 'nails'
    if (norm === 'cejas' || norm === 'pestanas' || norm === 'labios' || norm.includes('micro')) return 'micropigmentation'
    if (norm === 'corte' || norm === 'color' || norm.includes('pelu')) return 'hair'
    
    return 'others'
  }, [])

  // ============================================================
  // FILTRADO INTELIGENTE MAPEADO CON LAS ESPECIALIDADES REALES
  // ============================================================
  const servicesByCategory = useMemo(() => {
    if (!selectedProfessional) return { nails: [], micropigmentation: [], hair: [], others: [] }

    const specText = selectedProfessional.specialty?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || ''

    let baseServices = services.filter(service => {
      const sCat = service.category?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || ''
      
      // Regla 1: Si la especialidad menciona Manos/Pies/Uñas/Manicuría
      const targetsNails = specText.includes('una') || specText.includes('manicur') || specText.includes('mano') || specText.includes('pie')
      // Regla 2: Si la especialidad menciona Micropigmentación/Cejas/Pestañas/Labios
      const targetsMicro = specText.includes('micro') || specText.includes('ceja') || specText.includes('pestana') || specText.includes('labio')
      // Regla 3: Si la especialidad menciona Peluquería/Corte/Color
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

      // Si el profesional tiene múltiples áreas mezcladas, evaluamos de forma individual el renglón
      const matchesCategory = (sCat === 'unas' || sCat === 'manicuria') && (specText.includes('una') || specText.includes('manic')) ||
                              (sCat === 'cejas' || sCat === 'pestanas' || sCat === 'labios') && (specText.includes('ceja') || specText.includes('pestan') || specText.includes('labio') || specText.includes('micro')) ||
                              (sCat === 'corte' || sCat === 'color') && (specText.includes('pelu') || specText.includes('corte') || specText.includes('color'))

      return matchesCategory
    })

    // Fallback de seguridad extrema: si no cruzó ningún servicio por texto, mostramos los globales activos
    if (baseServices.length === 0) {
      baseServices = services
    }

    // Buscador interactivo
    const filtered = baseServices.filter(s => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      const nameNorm = s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      const descNorm = (s.description || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      return nameNorm.includes(query) || descNorm.includes(query)
    })

    // Distribuir en grupos visuales finales
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
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 rounded-full border-4 border-rose-100 border-t-rose-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen pb-32 ${isDark ? 'bg-zinc-950 text-stone-100' : 'bg-stone-50 text-stone-800'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* ENCABEZADO */}
        <div className={`p-8 rounded-3xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'}`}>
          <span className="text-[10px] font-bold tracking-widest text-rose-500 uppercase block mb-1">✦ Panel de Reservas</span>
          <h1 className="text-3xl font-serif font-light">Reserva tu Turno</h1>
          <p className="text-xs text-stone-400 mt-1">Sincronización automática de especialidades según los registros de la base de datos.</p>
        </div>

        {/* PASOS: TOTALMENTE INTEGRADOS CON GRID ADAPTATIVO SIN SCROLL LATERAL */}
        {step < 5 && (
          <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white shadow-sm'}`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full justify-items-stretch">
              {[1, 2, 3, 4].map((num) => (
                <div 
                  key={num} 
                  className={`flex items-center gap-2 p-2 rounded-xl transition-all ${step === num ? 'bg-rose-50 border border-rose-200 shadow-2xs' : ''}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors flex-shrink-0 ${step === num ? 'bg-rose-500 text-white' : step > num ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
                    {step > num ? <Check className="w-3 h-3" /> : num}
                  </div>
                  <span className={`text-xs tracking-tight transition-all font-medium ${step === num ? 'font-bold text-rose-600' : 'text-stone-500'}`}>
                    {['1. Perfil', '2. Servicios', '3. Horario', '4. Registrar'][num - 1]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            
            {error && (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs font-medium flex items-center gap-2">
                <X className="w-4 h-4 cursor-pointer" onClick={() => setError(null)} /> {error}
              </div>
            )}

            {/* PASO 1: PROFESIONALES ACTIVOS */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staff.map((prof) => (
                  <div 
                    key={prof.id} 
                    onClick={() => { setSelectedProfessional(prof); setStep(2); }}
                    className={`p-6 rounded-2xl border cursor-pointer text-left transition-all ${isDark ? 'bg-zinc-900 border-zinc-800 hover:border-rose-500' : 'bg-white border-stone-200 hover:border-rose-300 hover:shadow-md'}`}
                  >
                    <div className="flex gap-4 items-center">
                      <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 font-bold text-xl flex items-center justify-center border shadow-inner overflow-hidden flex-shrink-0">
                        {prof.avatar_url && !avatarErrors[prof.id] ? (
                          <img src={prof.avatar_url} alt="" className="w-full h-full object-cover" onError={() => setAvatarErrors(prev => ({ ...prev, [prof.id]: true }))}/>
                        ) : prof.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-stone-800">{prof.name}</h3>
                        <p className="text-[11px] text-rose-500 font-medium">{prof.specialty || 'Especialista'}</p>
                        <div className="flex items-center gap-1 text-[10px] text-amber-500 mt-0.5">
                          <Star className="w-3 h-3 fill-current"/> <span>4.9</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PASO 2: CATÁLOGO DE TRATAMIENTOS */}
            {step === 2 && selectedProfessional && (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <h2 className="text-base font-bold text-stone-800">Servicios Asignados</h2>
                    <p className="text-[11px] text-stone-400">Tratamientos correspondientes a la especialidad de {selectedProfessional.name}.</p>
                  </div>
                  <button onClick={() => { setStep(1); setSelectedServices([]); }} className="text-xs text-rose-500 font-medium hover:underline">Cambiar Profesional</button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Escribe para buscar un tratamiento..." 
                    className="w-full bg-white border border-stone-200 text-stone-800 text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-rose-400"
                  />
                </div>

                <div className="space-y-2">
                  {CATEGORIES.map(cat => {
                    const categoryServices = servicesByCategory[cat.id] || []
                    const isExpanded = !!expandedCategories[cat.id]
                    if (categoryServices.length === 0) return null

                    return (
                      <div key={cat.id} className="bg-white border border-stone-100 rounded-xl overflow-hidden shadow-sm">
                        <button 
                          type="button" 
                          onClick={() => toggleCategory(cat.id)}
                          className="w-full px-4 py-3 bg-stone-50/60 flex justify-between items-center text-xs font-semibold text-stone-700"
                        >
                          <span className="flex items-center gap-2">
                            <cat.icon className="w-3.5 h-3.5 text-rose-400" />
                            {cat.label} ({categoryServices.length})
                          </span>
                          <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isExpanded ? 'rotate-180 text-rose-500' : ''}`} />
                        </button>

                        {isExpanded && (
                          <div className="p-3 bg-white grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-stone-50">
                            {categoryServices.map(service => {
                              const isSelected = selectedServices.some(s => s.id === service.id)
                              return (
                                <div 
                                  key={service.id}
                                  onClick={() => toggleServiceSelection(service)}
                                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between relative ${isSelected ? 'bg-rose-50/40 border-rose-400 shadow-2xs' : 'bg-white border-stone-200 hover:border-stone-300'}`}
                                >
                                  <div className="pr-6">
                                    <h4 className={`text-xs font-semibold ${isSelected ? 'text-rose-600' : 'text-stone-800'}`}>{service.name}</h4>
                                    <p className="text-[10px] text-stone-400 line-clamp-2 mt-0.5 font-light">{service.description || 'Servicio premium del salón.'}</p>
                                  </div>
                                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-stone-50 text-[10px] font-medium text-stone-500">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-stone-300"/> {service.duration} min</span>
                                    <span className="text-rose-500 font-bold text-xs">${Number(service.price).toLocaleString()}</span>
                                  </div>
                                  <div className={`absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center text-xs ${isSelected ? 'bg-rose-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
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

            {/* PASO 3: CALENDARIO */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <h2 className="text-sm font-bold text-stone-800">Fecha y Hora</h2>
                  <button onClick={() => setStep(2)} className="text-xs text-rose-500 font-medium hover:underline">Volver a Servicios</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-3 p-4 bg-white border rounded-2xl shadow-sm space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-stone-700">
                      <span className="uppercase">{format(currentMonth, 'MMMM yyyy', { locale: es })}</span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 border rounded hover:bg-stone-50"><ChevronLeft className="w-3.5 h-3.5"/></button>
                        <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 border rounded hover:bg-stone-50"><ChevronRight className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-stone-400">
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
                            className={`p-2 text-xs font-semibold rounded-lg text-center ${isSelected ? 'bg-rose-500 text-white shadow-sm' : disabled ? 'text-stone-200 opacity-25 cursor-not-allowed' : 'text-stone-700 hover:bg-stone-50'}`}
                          >
                            {format(day, 'd')}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-2 p-4 bg-white border rounded-2xl shadow-sm max-h-[300px] overflow-y-auto space-y-3">
                    <span className="text-[10px] font-bold text-stone-400 block uppercase">Turnos</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {availableTimes.map(t => {
                        const { available } = checkAvailability(t)
                        return (
                          <button 
                            key={t}
                            type="button"
                            disabled={!available}
                            onClick={() => setSelectedTime(t)}
                            className={`py-1.5 text-xs rounded-lg border font-medium ${selectedTime === t ? 'bg-rose-500 text-white border-rose-500' : available ? 'bg-white border-stone-200 hover:border-rose-300' : 'bg-stone-50 text-stone-300 line-through cursor-not-allowed'}`}
                          >
                            {t}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {selectedTime && (
                  <button onClick={() => setStep(4)} className="w-full py-3 bg-rose-500 text-white font-semibold rounded-xl text-xs uppercase tracking-wider shadow-md hover:bg-rose-600 transition-all">
                    Continuar al Formulario
                  </button>
                )}
              </div>
            )}

            {/* PASO 4: FORMULARIO */}
            {step === 4 && (
              <div className="p-6 bg-white border rounded-2xl shadow-sm space-y-4 text-left">
                <h3 className="text-base font-bold text-stone-800 border-b pb-2">Información de Contacto</h3>
                <form onSubmit={e => { e.preventDefault(); setShowSummaryModal(true); }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-stone-400 block mb-1">Nombre Completo *</label>
                      <input type="text" required value={clientData.name} onChange={e => setClientData({...clientData, name: e.target.value})} className="w-full bg-white border border-stone-200 text-stone-800 px-3 py-2 rounded-xl text-xs focus:outline-rose-400" placeholder="Tu nombre" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-400 block mb-1">WhatsApp de contacto *</label>
                      <input type="tel" required value={clientData.phone} onChange={e => setClientData({...clientData, phone: e.target.value})} className="w-full bg-white border border-stone-200 text-stone-800 px-3 py-2 rounded-xl text-xs focus:outline-rose-400" placeholder="Ej: 099123456" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-400 block mb-1">Notas Adicionales</label>
                    <textarea value={clientData.notes} onChange={e => setClientData({...clientData, notes: e.target.value})} className="w-full bg-white border border-stone-200 text-stone-800 p-3 rounded-xl text-xs focus:outline-rose-400 resize-none" rows={3} placeholder="Detalles de interés..." />
                  </div>
                  <button type="submit" className="w-full py-3 bg-rose-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-rose-600">
                    Ver Resumen del Turno
                  </button>
                </form>
              </div>
            )}

            {/* PASO 5: PANTALLA ÉXITO */}
            {step === 5 && (
              <div className="p-8 bg-white border rounded-3xl text-center shadow-lg space-y-4 max-w-md mx-auto">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-100">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-serif text-stone-800">¡Turno Agendado con Éxito!</h2>
                <p className="text-xs text-stone-400">Tu cita ha sido guardada satisfactoriamente en nuestra agenda.</p>
                <div className="p-4 bg-stone-50 rounded-xl text-left text-xs space-y-2 text-stone-700">
                  <div><strong>Profesional:</strong> {selectedProfessional?.name}</div>
                  <div><strong>Fecha y Hora:</strong> {selectedDate} a las {selectedTime} hs</div>
                  <div className="border-t pt-2">
                    <strong>Tratamientos Seleccionados:</strong>
                    {selectedServices.map(s => <div key={s.id} className="text-stone-500 pl-2">• {s.name} ({s.category})</div>)}
                  </div>
                </div>
                <button onClick={() => { setStep(1); setSelectedServices([]); setSelectedTime(''); }} className="w-full py-2.5 bg-stone-900 text-white text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-stone-800">
                  Volver al Panel Principal
                </button>
              </div>
            )}

          </div>

          {/* TOTALES LATERAL */}
          {step > 1 && step < 5 && (
            <div className="p-5 bg-white border rounded-2xl shadow-sm text-left space-y-4 lg:sticky lg:top-4">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block border-b pb-1">Resumen</span>
              
              {selectedProfessional && (
                <div className="text-xs">
                  <span className="text-stone-400 block text-[10px] font-bold uppercase">Especialista</span>
                  <span className="font-semibold text-stone-800">{selectedProfessional.name}</span>
                </div>
              )}

              {selectedServices.length > 0 && (
                <div className="space-y-1 text-xs pt-2 border-t border-stone-100">
                  <span className="text-stone-400 block text-[10px] font-bold uppercase">Tratamientos</span>
                  {selectedServices.map(s => (
                    <div key={s.id} className="flex justify-between items-center bg-stone-50 p-1.5 rounded-lg text-[11px] text-stone-700">
                      <span className="truncate max-w-[140px]">{s.name}</span>
                      <button onClick={() => toggleServiceSelection(s)} className="text-stone-400 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  ))}
                </div>
              )}

              {selectedTime && (
                <div className="text-xs pt-2 border-t border-stone-100">
                  <span className="text-stone-400 block text-[10px] font-bold uppercase">Fecha y Hora</span>
                  <span className="font-medium text-stone-800">{selectedDate} — {selectedTime} hs</span>
                </div>
              )}

              {selectedServices.length > 0 && (
                <div className="pt-3 border-t border-stone-100 flex justify-between items-center font-bold text-stone-800">
                  <span className="text-[10px] text-stone-400 uppercase">Monto Final:</span>
                  <span className="text-rose-500 font-serif text-lg">${totalPrice.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* FOOTER DISPOSITIVOS MÓVILES */}
      {step === 2 && selectedServices.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t p-4 shadow-xl flex items-center justify-between lg:hidden">
          <div className="text-left">
            <span className="text-[9px] text-stone-400 font-bold uppercase block">Total</span>
            <span className="text-base font-bold text-rose-500 font-serif">${totalPrice.toLocaleString()}</span>
          </div>
          <button onClick={() => setStep(3)} className="px-5 py-2.5 bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md uppercase tracking-wider hover:bg-rose-600 flex items-center gap-1">
            Elegir Horario <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4 text-left">
            <h3 className="font-serif text-base text-stone-800 border-b pb-2">Confirmar Cita</h3>
            <div className="text-xs space-y-2 bg-stone-50 p-3 rounded-xl border text-stone-700">
              <div><strong>Cliente:</strong> {clientData.name}</div>
              <div><strong>WhatsApp:</strong> {clientData.phone}</div>
              <div><strong>Especialista:</strong> {selectedProfessional?.name}</div>
              <div><strong>Fecha/Hora:</strong> {selectedDate} a las {selectedTime} hs</div>
              <div className="border-t pt-2">
                <strong>Importe Total:</strong> <span className="text-rose-500 font-bold">${totalPrice.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowSummaryModal(false)} className="flex-1 py-2 border rounded-xl text-xs font-semibold hover:bg-stone-50">Editar</button>
              <button type="button" onClick={handleSubmit} disabled={submitting} className="flex-1 py-2 bg-emerald-500 text-white font-bold rounded-xl text-xs disabled:opacity-50">
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-[70vh]"><div className="w-12 h-12 rounded-full border-4 border-rose-100 border-t-rose-500 animate-spin" /></div>}>
      <AgendaContent />
    </Suspense>
  )
}
