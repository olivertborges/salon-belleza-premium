'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar as CalendarIcon, Clock, User, Sparkles, ChevronRight, 
  CheckCircle2, ChevronLeft, ChevronRight as ChevronRightIcon,
  Sparkles as SparklesIcon, Scissors, Heart, Phone, Mail, FileText, Bookmark
} from 'lucide-react'
import { 
  format, addDays, isToday, parseISO, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameDay, isBefore, startOfDay, addMonths, subMonths 
} from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'

export default function ClientBookingPage() {
  const [paso, setPaso] = useState<number>(1)
  const [services, setServices] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [citasYBloqueos, setCitasYBloqueos] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedTime, setSelectedTime] = useState<string>('')
  
  const [clientData, setClientData] = useState({ name: '', phone: '', email: '', notes: '' })

  const horariosJornada = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', 
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', 
    '18:00', '18:30', '19:00', '19:30'
  ]

  useEffect(() => {
    const fetchInicial = async () => {
      try {
        const [servicesRes, staffRes] = await Promise.all([
          supabase.from('services').select('*').eq('is_active', true),
          // ✅ CAMBIADO: Ahora usa 'staff' en lugar de 'professionals'
          supabase.from('staff').select('*').eq('is_active', true)
        ])
        setServices(servicesRes.data || [])
        setStaff(staffRes.data || [])
        console.log('Staff cargado:', staffRes.data) // Para depuración
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

  const handleFinalizarReserva = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientData.name || !clientData.phone) {
      alert("Por favor introduce tu nombre y teléfono de contacto")
      return
    }

    try {
      setLoading(true)
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
          .insert([{ name: clientData.name.trim(), phone: clientData.phone.trim(), email: clientData.email.trim() || null }])
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
      setPaso(5)
    } catch (err) {
      console.error(err)
      alert("Error al guardar la reserva.")
    } finally {
      setLoading(false)
    }
  }

  const horasMauna = horariosJornada.filter(h => h < '14:00')
  const horasTarde = horariosJornada.filter(h => h >= '14:00')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-rose-500">
        <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-rose-500/30 pb-24 relative z-10 overflow-hidden">
      
      {/* SECCIÓN DE TÍTULO INTERNO DE LA PÁGINA */}
      <div className="max-w-5xl mx-auto pt-12 pb-6 flex flex-col md:flex-row items-center justify-between gap-5 border-b border-border/40 relative z-20">
        <div className="text-center md:text-left">
          <h1 className="font-serif italic text-2xl md:text-3xl bg-gradient-to-r from-zinc-900 via-rose-600 to-amber-600 dark:from-stone-100 dark:via-rose-300 dark:to-amber-200 bg-clip-text text-transparent">
            Reserva tu Experiencia
          </h1>
          <p className="text-[10px] text-muted-foreground dark:text-stone-500 font-mono uppercase tracking-[0.25em] mt-1">Fresh Nails • Atelier Boutique</p>
        </div>

        {/* Stepper Sensible al Tema */}
        {paso < 5 && (
          <div className="flex items-center gap-3 bg-muted dark:bg-stone-900 p-2 rounded-full border border-border text-xs font-mono">
            {[1, 2, 3, 4].map((num) => {
              const etiquetas = ['Tratamiento', 'Especialista', 'Agenda', 'Confirmación']
              const esActivo = paso === num
              return (
                <div key={num} className="flex items-center gap-1.5 px-2 py-1 rounded-full transition-all">
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] transition-all ${
                      esActivo 
                        ? 'bg-gradient-to-r from-rose-600 to-amber-500 dark:from-rose-500 dark:to-amber-500 text-white font-bold ring-4 ring-rose-500/10 dark:ring-rose-500/20' 
                        : paso > num ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50' : 'text-muted-foreground bg-background border border-border'
                    }`}
                  >
                    {num}
                  </div>
                  {esActivo && (
                    <span className="text-[10px] font-medium text-foreground hidden lg:inline-block">
                      {etiquetas[num - 1]}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* CONTENEDOR PRINCIPAL - CONTROL DE CAPAS REFORZADO */}
      <div className="max-w-5xl mx-auto pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative z-10">
        
        {/* COLUMNA DINÁMICA DE FLUJO */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* PASO 1: SERVICIOS */}
          {paso === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xs font-mono text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-2">
                  <SparklesIcon className="w-3.5 h-3.5" /> Paso Ilustre
                </h2>
                <h3 className="text-xl font-serif italic text-foreground">Selecciona el tratamiento ideal</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {services.map((serv) => (
                  <button
                    key={serv.id}
                    onClick={() => { setSelectedService(serv); setPaso(2); }}
                    className="bg-card hover:bg-muted/40 border border-border hover:border-rose-500/40 rounded-2xl p-6 text-left flex flex-col justify-between gap-6 cursor-pointer transition-all hover:-translate-y-0.5 group relative overflow-hidden active:scale-[0.99] shadow-sm z-0"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/5 to-transparent rounded-bl-full pointer-events-none" />
                    <div className="space-y-2 relative z-10">
                      <h4 className="text-base font-medium text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1">{serv.name}</h4>
                      <p className="text-xs text-muted-foreground font-sans font-light line-clamp-2 leading-relaxed">
                        {serv.description || 'Tratamiento personalizado enfocado en la salud y estética integral.'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border w-full relative z-10">
                      <span className="text-xs text-muted-foreground dark:text-stone-400 font-mono flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md border border-border">
                        <Clock className="w-3 h-3 text-rose-500 dark:text-rose-400" /> {serv.duration} min
                      </span>
                      <span className="text-base font-mono font-bold bg-gradient-to-r from-zinc-900 to-rose-600 dark:from-stone-100 dark:to-rose-300 bg-clip-text text-transparent">
                        ${Number(serv.price).toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PASO 2: PROFESIONALES */}
          {paso === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <h2 className="text-xs font-mono text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Preferencia Staff
                  </h2>
                  <h3 className="text-xl font-serif italic text-foreground">¿Con quién deseas atenderte?</h3>
                </div>
                <button onClick={() => setPaso(1)} className="text-xs text-muted-foreground hover:text-foreground font-mono bg-muted px-3 py-1.5 rounded-lg border border-border transition-colors">← Volver</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {staff.map((prof) => (
                  <button
                    key={prof.id}
                    onClick={() => { setSelectedProfessional(prof); setPaso(3); }}
                    className="bg-card hover:bg-muted/40 border border-border hover:border-rose-500/40 rounded-2xl p-5 text-left flex items-center justify-between cursor-pointer transition-all group active:scale-[0.99] shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-xs font-mono font-bold text-rose-600 dark:text-rose-400 shadow-inner group-hover:border-rose-500/30 transition-all">
                        {prof.name?.substring(0,2).toUpperCase() || 'NA'}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-base font-medium text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{prof.name}</h4>
                        <p className="text-[11px] text-muted-foreground font-mono tracking-wide">
                          {prof.specialty || prof.role || 'Especialista'}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-rose-500 group-hover:border-rose-500/20 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PASO 3: CALENDARIO Y HORARIOS */}
          {paso === 3 && (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <h2 className="text-xs font-mono text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-2">
                    <CalendarIcon className="w-3.5 h-3.5" /> Cronograma
                  </h2>
                  <h3 className="text-xl font-serif italic text-foreground">Planifica tu visita</h3>
                </div>
                <button onClick={() => setPaso(2)} className="text-xs text-muted-foreground hover:text-foreground font-mono bg-muted px-3 py-1.5 rounded-lg border border-border transition-colors">← Volver</button>
              </div>

              {/* CALENDARIO */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-medium font-serif italic text-foreground capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
                      disabled={isBefore(startOfMonth(currentMonth), new Date())}
                      className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed bg-muted/50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground bg-muted/50 transition-colors">
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">
                  {['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sá'].map(d => <div key={d} className="py-1">{d}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {diasDelMes.map((dia, idx) => {
                    const diaStr = format(dia, 'yyyy-MM-dd')
                    const esPasado = isBefore(startOfDay(dia), startOfDay(new Date()))
                    const esSeleccionado = selectedDate === diaStr
                    
                    return (
                      <button
                        key={idx}
                        disabled={esPasado}
                        onClick={() => { setSelectedDate(diaStr); setSelectedTime(''); }}
                        className={`py-3 rounded-xl text-xs font-mono transition-all flex flex-col items-center justify-center relative aspect-square border ${
                          esSeleccionado 
                            ? 'bg-gradient-to-tr from-rose-600 to-amber-500 text-white font-bold border-transparent shadow-md' 
                            : esPasado 
                              ? 'text-muted-foreground/30 cursor-not-allowed border-transparent opacity-40 bg-muted/20' 
                              : 'bg-muted/40 hover:bg-muted border-border text-foreground hover:border-muted-foreground/30'
                        }`}
                      >
                        <span>{format(dia, 'd')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* HORAS DE LA AGENDA */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
                <p className="text-xs font-mono text-muted-foreground border-b border-border pb-3 uppercase tracking-wider">
                  Bloques horarios • {format(parseISO(selectedDate), "d 'de' MMMM", { locale: es })}
                </p>

                {/* MAÑANA */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-widest block">Franja Matutina</span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
                              ? 'bg-zinc-900 text-white dark:bg-stone-100 dark:text-black font-bold border-transparent shadow-sm'
                              : infoDisp.disponible
                                ? 'bg-muted/30 border-border text-foreground hover:border-rose-500/40 hover:bg-card'
                                : 'bg-muted/10 border-transparent text-muted-foreground/40 cursor-not-allowed line-through opacity-40'
                          }`}
                        >
                          {hora}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* TARDE */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-widest block">Franja Vespertina</span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
                              ? 'bg-zinc-900 text-white dark:bg-stone-100 dark:text-black font-bold border-transparent shadow-sm'
                              : infoDisp.disponible
                                ? 'bg-muted/30 border-border text-foreground hover:border-rose-500/40 hover:bg-card'
                                : 'bg-muted/10 border-transparent text-muted-foreground/40 cursor-not-allowed line-through opacity-40'
                          }`}
                        >
                          {hora}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {selectedTime && (
                <button
                  onClick={() => setPaso(4)}
                  className="w-full bg-gradient-to-r from-rose-600 to-amber-500 text-white text-xs font-mono font-bold py-4 rounded-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-md active:scale-[0.99]"
                >
                  <span>Continuar al formulario ({selectedTime} hs)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

{/* PASO 4: FORMULARIO CLIENTE */}
{paso === 4 && (
  <div className="space-y-4">
    <div className="flex justify-between items-end">
      <div className="space-y-1">
        <h2 className="text-xs font-mono text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-2">
          <User className="w-3.5 h-3.5" /> Seguridad
        </h2>
        <h3 className="text-xl font-serif italic text-foreground">Completa tu información</h3>
      </div>
      <button onClick={() => setPaso(3)} className="text-xs text-muted-foreground hover:text-foreground font-mono bg-muted px-3 py-1.5 rounded-lg border border-border transition-colors">← Volver</button>
    </div>

    <form onSubmit={handleFinalizarReserva} className="space-y-5 bg-card border border-border p-6 rounded-2xl shadow-sm">
      <div>
        <label className="block text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1.5">Nombre Completo *</label>
        <div className="relative">
          <User className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400 dark:text-stone-500" />
          <input
            type="text"
            required
            value={clientData.name}
            onChange={(e) => setClientData({...clientData, name: e.target.value})}
            className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 dark:text-white focus:outline-none focus:border-rose-500/50 transition-colors placeholder-stone-400 dark:placeholder-stone-500"
            placeholder="María Pérez"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1.5">Teléfono Celular *</label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400 dark:text-stone-500" />
          <input
            type="tel"
            required
            value={clientData.phone}
            onChange={(e) => setClientData({...clientData, phone: e.target.value})}
            className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 dark:text-white focus:outline-none focus:border-rose-500/50 transition-colors placeholder-stone-400 dark:placeholder-stone-500"
            placeholder="Ej. 099123456"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1.5">Email corporativo o personal</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400 dark:text-stone-500" />
          <input
            type="email"
            value={clientData.email}
            onChange={(e) => setClientData({...clientData, email: e.target.value})}
            className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 dark:text-white focus:outline-none focus:border-rose-500/50 transition-colors placeholder-stone-400 dark:placeholder-stone-500"
            placeholder="maria@example.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1.5">Notas especiales para tu atelier</label>
        <div className="relative">
          <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400 dark:text-stone-500" />
          <textarea
            value={clientData.notes}
            onChange={(e) => setClientData({...clientData, notes: e.target.value})}
            rows={3}
            className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 dark:text-white focus:outline-none focus:border-rose-500/50 transition-colors placeholder-stone-400 dark:placeholder-stone-500 resize-none text-xs leading-relaxed"
            placeholder="Indica cualquier requerimiento o preferencia específica..."
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-rose-600 to-amber-500 text-white font-mono font-bold py-4 rounded-xl hover:opacity-95 transition-all uppercase tracking-widest text-xs shadow-md active:scale-[0.99]"
      >
        Confirmar y Solicitar Turno
      </button>
    </form>
  </div>
)}

{/* PASO 5: EXITO - CON FLUJO COMPLETO */}
{paso === 5 && (
  <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-8 max-w-lg mx-auto shadow-xl relative overflow-hidden">
    {/* Borde superior decorativo */}
    <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
    
    {/* Confeti animado (opcional) */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-0 left-1/4 w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
      <div className="absolute top-0 left-2/4 w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
      <div className="absolute top-0 left-3/4 w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-2 left-1/3 w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.7s' }} />
    </div>

    {/* Icono de éxito */}
    <div className="relative z-10">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border-2 border-emerald-500/30">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>
    </div>

    {/* Mensaje de éxito */}
    <div className="space-y-3 relative z-10">
      <h3 className="font-serif italic text-2xl text-foreground">¡Turno Solicitado!</h3>
      <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
        Tu reserva se registró con éxito y se encuentra en estado de evaluación.
      </p>
    </div>

    {/* Resumen de la cita */}
    <div className="bg-muted/20 border border-border rounded-xl p-4 text-left space-y-2 relative z-10">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground font-mono">Servicio</span>
        <span className="text-foreground font-medium">{selectedService?.name}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground font-mono">Profesional</span>
        <span className="text-foreground font-medium">{selectedProfessional?.name}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground font-mono">Fecha</span>
        <span className="text-foreground font-medium">{selectedDate}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground font-mono">Hora</span>
        <span className="text-foreground font-medium">{selectedTime}</span>
      </div>
      <div className="flex justify-between text-xs border-t border-border pt-2 mt-2">
        <span className="text-muted-foreground font-mono">Total</span>
        <span className="text-emerald-500 font-bold">${Number(selectedService?.price || 0).toLocaleString()}</span>
      </div>
    </div>

    {/* Acciones */}
    <div className="space-y-3 relative z-10">
      <button
        onClick={() => {
          setPaso(1)
          setSelectedService(null)
          setSelectedProfessional(null)
          setSelectedTime('')
          setClientData({ name: '', phone: '', email: '', notes: '' })
        }}
        className="w-full bg-gradient-to-r from-rose-600 to-amber-500 text-white text-xs font-mono font-bold py-3.5 rounded-xl hover:opacity-95 transition-all uppercase tracking-widest shadow-md active:scale-[0.99]"
      >
        Agendar otro turno
      </button>

      <a
        href="/reservas"
        className="block w-full bg-muted/30 border border-border text-foreground text-xs font-mono font-bold py-3.5 rounded-xl hover:bg-muted/50 transition-all uppercase tracking-widest text-center"
      >
        Ver mis reservas
      </a>
    </div>
  </div>
)}

        </div>

        {/* SIDEBAR DERECHO */}
        {paso < 5 && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-5 lg:sticky lg:top-6 shadow-sm relative overflow-hidden">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-2 flex items-center gap-2">
              <Bookmark className="w-3 h-3 text-rose-500" /> Resumen de Cita
            </h3>
            
            {selectedService ? (
              <div className="space-y-1">
                <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400 uppercase tracking-wider">Servicio Seleccionado</p>
                <p className="text-sm font-medium text-foreground">{selectedService.name}</p>
                <p className="text-xs text-muted-foreground font-mono flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedService.duration} min</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground font-mono italic">Selecciona un servicio para comenzar...</p>
            )}

            {selectedProfessional && (
              <div className="space-y-1 pt-3 border-t border-border">
                <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400 uppercase tracking-wider">Especialista Atendiendo</p>
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {selectedProfessional.name}
                </p>
              </div>
            )}

            {selectedTime && (
              <div className="space-y-1 pt-3 border-t border-border">
                <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400 uppercase tracking-wider">Fecha y Hora Pactada</p>
                <p className="text-sm font-medium text-foreground capitalize">
                  {format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es })}
                </p>
                <p className="text-xs text-rose-700 dark:text-amber-300 font-mono font-bold mt-0.5 bg-rose-50 dark:bg-amber-950/20 border border-rose-200 dark:border-amber-900/20 w-fit px-2 py-0.5 rounded-md">{selectedTime} hs</p>
              </div>
            )}

            {selectedService && (
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wide">Importe Total</span>
                <span className="text-lg font-mono font-bold bg-gradient-to-r from-zinc-900 to-rose-600 dark:from-stone-100 dark:to-rose-300 bg-clip-text text-transparent">
                  ${Number(selectedService.price).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}