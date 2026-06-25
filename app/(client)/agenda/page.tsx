'use client'

import React, { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, User, Sparkles, ChevronRight, CheckCircle2, ShieldAlert, X } from 'lucide-react'
import { format, addDays, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'

export default function ClientBookingPage() {
  const [paso, setPaso] = useState<number>(1)
  const [services, setServices] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [citasYBloqueos, setCitasYBloqueos] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Estado de la reserva actual
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedTime, setSelectedTime] = useState<string>('')
  
  // Datos del cliente
  const [clientData, setClientData] = useState({ name: '', phone: '', email: '', notes: '' })

  // 1. Horarios base disponibles en el salón (Formato 24h)
  const horariosJornada = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', 
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', 
    '18:00', '18:30', '19:00', '19:30'
  ]

  // Cargar Servicios y Profesionales al iniciar
  useEffect(() => {
    const fetchInicial = async () => {
      try {
        const [servicesRes, staffRes] = await Promise.all([
          supabase.from('services').select('*').eq('is_active', true),
          supabase.from('professionals').select('*').eq('is_active', true)
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

  // Cargar citas y bloqueos cuando cambia la fecha o el profesional
  useEffect(() => {
    if (!selectedProfessional) return

    const fetchOcupacion = async () => {
      // Buscamos citas de ese día para ese profesional que NO estén canceladas
      // NOTA: Si usas una tabla separada para bloqueos de horario de la profesional, la unes aquí en un Promise.all. 
      // Si usas la misma tabla 'appointments' con status = 'cancelled' o 'blocked', este query ya lo cubre todo.
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

  // Función clave: Determina si una hora en punto está disponible u ocupada/bloqueada
  const comprobarDisponibilidad = (horaEvaluar: string) => {
    // Si la fecha elegida es HOY, no permitir reservar horas del pasado
    if (selectedDate === format(new Date(), 'yyyy-MM-dd')) {
      const ahoraStr = format(new Date(), 'HH:mm')
      if (horaEvaluar < ahoraStr) return { disponible: false, motivo: 'Pasado' }
    }

    // Recorrer las citas u horarios bloqueados existentes del día
    for (const item of citasYBloqueos) {
      if (!item.time) continue
      
      const horaInicio = item.time.substring(0, 5) // "14:00"
      const duracion = item.services?.duration || 30 // Si es un bloqueo manual puede no tener servicio, por defecto 30m
      
      // Calcular límite de finalización del bloqueo/cita
      const [hIni, mIni] = horaInicio.split(':').map(Number)
      const totalMinutosInicio = hIni * 60 + mIni
      const totalMinutosFin = totalMinutosInicio + duracion

      // Calcular minutos de la hora que la clienta quiere evaluar
      const [hEval, mEval] = horaEvaluar.split(':').map(Number)
      const totalMinutosEval = hEval * 60 + mEval

      // Si la hora evaluada cae dentro del rango ocupado por otra cita o bloqueo activo
      if (totalMinutosEval >= totalMinutosInicio && totalMinutosEval < totalMinutosFin) {
        return { 
          disponible: false, 
          motivo: item.status === 'blocked' ? 'Bloqueo Profesional' : 'Ocupado' 
        }
      }
    }

    return { disponible: true, motivo: '' }
  }

  // Manejar el envío final de la reserva
  const handleFinalizarReserva = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientData.name || !clientData.phone) {
      alert("Por favor introduce tu nombre y teléfono de contacto")
      return
    }

    try {
      // 1. Primero creamos o buscamos el cliente por su teléfono/email en tu tabla 'clients'
      // Para simplificar el ejemplo, insertamos la cita asumiendo que guardas los datos del contacto directos o creas uno rápido:
      let client_id = null
      
//   ESTA FORMA ES ULTRA SEGURA Y NO DA ERROR 406
      const { data: clientesEncontrados, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', clientData.phone)

      // Verificamos si encontramos al menos un cliente en el arreglo
      const clienteExistente = clientesEncontrados && clientesEncontrados.length > 0 
        ? clientesEncontrados[0] 
        : null

      if (clienteExistente) {
        client_id = clienteExistente.id
      } else {
        const { data: nuevoCliente } = await supabase
          .from('clients')
          .insert([{ name: clientData.name, phone: clientData.phone, email: clientData.email }])
          .select('id')
          .single()
        client_id = nuevoCliente?.id
      }

      // 2. Insertar la cita en la base de datos
      const { error } = await supabase
        .from('appointments')
        .insert([
          {
            client_id: client_id,
            professional_id: selectedProfessional.id,
            service_id: selectedService.id,
            date: selectedDate,
            time: `${selectedTime}:00`,
            status: 'pending', // Queda pendiente de confirmación por el admin
            total_price: selectedService.price,
            notes: clientData.notes
          }
        ])

      if (error) throw error

      setPaso(5) // Ir al paso de éxito rotundo
    } catch (err) {
      console.error(err)
      alert("Hubo un error al procesar tu reserva. Inténtalo de nuevo.")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0e0c0b]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-stone-200 font-sans pb-12">
      {/* HEADER VISUAL */}
      <div className="bg-[#0e0c0b] border-b border-stone-900 py-6 px-4 text-center">
        <h1 className="font-serif italic text-2xl text-white tracking-wide">Reserva tu Turno</h1>
        <p className="text-xs text-stone-400 font-mono mt-1">Paso {paso} de 4</p>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-6">
        
        {/* PASO 1: SELECCIÓN DE SERVICIO */}
        {paso === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-widest">1. Selecciona el servicio</h3>
            <div className="grid gap-2">
              {services.map((serv) => (
                <button
                  key={serv.id}
                  onClick={() => { setSelectedService(serv); setPaso(2); }}
                  className="bg-[#0e0c0b] border border-stone-900 rounded-xl p-4 text-left flex justify-between items-center hover:border-stone-700 transition-all group"
                >
                  <div>
                    <h4 className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">{serv.name}</h4>
                    <p className="text-xs text-stone-400 font-mono mt-0.5">{serv.duration} min</p>
                  </div>
                  <span className="text-sm font-mono font-bold text-emerald-400">${Number(serv.price).toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PASO 2: SELECCIÓN DE PROFESIONAL */}
        {paso === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-widest">2. Elige profesional</h3>
              <button onClick={() => setPaso(1)} className="text-xs text-stone-500 hover:text-white font-mono">← Volver</button>
            </div>
            <div className="grid gap-2">
              {staff.map((prof) => (
                <button
                  key={prof.id}
                  onClick={() => { setSelectedProfessional(prof); setPaso(3); }}
                  className="bg-[#0e0c0b] border border-stone-900 rounded-xl p-4 text-left flex items-center gap-3 hover:border-stone-700 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-xs font-bold text-cyan-400">
                    {prof.name.substring(0,2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">{prof.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PASO 3: SELECCIÓN DE FECHA Y HORARIO (MÓDULO DE BLOQUEOS) */}
        {paso === 3 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-widest">3. Fecha y Hora (24h)</h3>
              <button onClick={() => setPaso(2)} className="text-xs text-stone-500 hover:text-white font-mono">← Volver</button>
            </div>

            {/* Selector de Fecha rápido (Siguientes 7 días) */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {Array.from({ length: 7 }).map((_, i) => {
                const dia = addDays(new Date(), i)
                const diaStr = format(dia, 'yyyy-MM-dd')
                const activo = selectedDate === diaStr
                return (
                  <button
                    key={diaStr}
                    onClick={() => { setSelectedDate(diaStr); setSelectedTime(''); }}
                    className={`flex-shrink-0 w-16 py-2 rounded-xl text-center border transition-all ${
                      activo 
                        ? 'bg-cyan-500 border-cyan-400 text-black font-bold shadow-lg shadow-cyan-500/10' 
                        : 'bg-[#0e0c0b] border-stone-900 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <span className="text-[10px] font-mono uppercase block">{format(dia, 'EEE', { locale: es })}</span>
                    <span className="text-sm block font-mono font-bold mt-0.5">{format(dia, 'd')}</span>
                  </button>
                )
              })}
            </div>

            {/* Cuadrícula de Horas con validación de bloqueos */}
            <div className="bg-[#0e0c0b] border border-stone-900 p-4 rounded-2xl">
              <p className="text-[10px] font-mono text-stone-500 mb-3 uppercase tracking-wider">Horarios para el {format(parseISO(selectedDate), "d 'de' MMMM", { locale: es })}</p>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {horariosJornada.map((hora) => {
                  const infoDisp = comprobarDisponibilidad(hora)
                  const seleccionado = selectedTime === hora

                  return (
                    <button
                      key={hora}
                      disabled={!infoDisp.disponible}
                      onClick={() => setSelectedTime(hora)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all relative ${
                        seleccionado
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 border-cyan-400 text-white shadow-md'
                          : infoDisp.disponible
                            ? 'bg-stone-900/40 border-stone-800/80 text-stone-200 hover:border-cyan-500/30'
                            : 'bg-stone-950/20 border-stone-950 text-stone-600 cursor-not-allowed line-through'
                      }`}
                      title={!infoDisp.disponible ? `No disponible: ${infoDisp.motivo}` : 'Disponible'}
                    >
                      {hora}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedTime && (
              <button
                onClick={() => setPaso(4)}
                className="w-full bg-white text-black text-xs font-mono font-bold py-3 rounded-xl hover:bg-stone-200 transition-all flex items-center justify-center gap-1 uppercase tracking-wider"
              >
                <span>Confirmar Horario {selectedTime}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* PASO 4: DATOS DEL CLIENTE Y REVISIÓN */}
        {paso === 4 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-widest">4. Tus Datos</h3>
              <button onClick={() => setPaso(3)} className="text-xs text-stone-500 hover:text-white font-mono">← Volver</button>
            </div>

            <div className="bg-[#0e0c0b] border border-stone-900 p-4 rounded-2xl space-y-2 text-xs font-mono">
              <p className="text-white font-serif italic text-sm border-b border-stone-900 pb-2">Resumen de tu Turno</p>
              <p><span className="text-stone-500">Servicio:</span> {selectedService?.name}</p>
              <p><span className="text-stone-500">Profesional:</span> {selectedProfessional?.name}</p>
              <p><span className="text-stone-500">Fecha y Hora:</span> {selectedDate} a las {selectedTime} hs</p>
              <p><span className="text-stone-500">Precio Total:</span> <span className="text-emerald-400 font-bold">${Number(selectedService?.price).toLocaleString()}</span></p>
            </div>

            <form onSubmit={handleFinalizarReserva} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={clientData.name}
                  onChange={(e) => setClientData({...clientData, name: e.target.value})}
                  className="w-full bg-[#0e0c0b] border border-stone-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Ej. María Pérez"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Teléfono de Contacto *</label>
                <input
                  type="tel"
                  required
                  value={clientData.phone}
                  onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                  className="w-full bg-[#0e0c0b] border border-stone-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Ej. +34 600 000 000"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Email (Opcional)</label>
                <input
                  type="email"
                  value={clientData.email}
                  onChange={(e) => setClientData({...clientData, email: e.target.value})}
                  className="w-full bg-[#0e0c0b] border border-stone-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  placeholder="maria@example.com"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Notas o Aclaraciones</label>
                <textarea
                  value={clientData.notes}
                  onChange={(e) => setClientData({...clientData, notes: e.target.value})}
                  rows={2}
                  className="w-full bg-[#0e0c0b] border border-stone-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder-stone-600 text-xs"
                  placeholder="Alergias, preferencias..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-mono font-bold py-3 rounded-xl hover:shadow-lg transition-all uppercase tracking-wider text-xs mt-2"
              >
                Solicitar Reserva Turno
              </button>
            </form>
          </div>
        )}

        {/* PASO 5: ÉXITO ROTUNDO */}
        {paso === 5 && (
          <div className="bg-[#0e0c0b] border border-stone-900 p-6 rounded-2xl text-center space-y-4 mt-8 shadow-xl">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <div>
              <h3 className="font-serif italic text-xl text-white">¡Reserva Solicitada!</h3>
              <p className="text-xs text-stone-400 font-mono mt-1.5 max-w-sm mx-auto">
                Tu turno para el <span className="text-cyan-400">{selectedDate}</span> a las <span className="text-cyan-400">{selectedTime} h</span> ha sido enviado. Estamos revisando tu solicitud.
              </p>
            </div>
            <div className="border-t border-stone-900 pt-4">
              <button
                onClick={() => { setPaso(1); setSelectedService(null); setSelectedProfessional(null); setSelectedTime(''); }}
                className="px-4 py-2 bg-stone-900 text-stone-300 hover:text-white rounded-xl text-xs font-mono font-bold border border-stone-850"
              >
                Volver a Agendar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}