'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaClock, 
  FaUser, 
  FaCut, 
  FaCheckCircle, 
  FaWhatsapp, 
  FaGem, 
  FaCrown 
} from 'react-icons/fa'

export default function ReservasPage() {
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')

  // Datos Premium Simulados (Que luego vendrán de tu Supabase)
  const servicios = [
    { id: 1, name: 'Microblading', price: 150, duration: 120, category: 'Cejas', desc: 'Diseño pelo a pelo hiperrealista personalizado.' },
    { id: 2, name: 'Micropigmentación Labial', price: 180, duration: 90, category: 'Labios', desc: 'Efecto acuarela para unos labios con color natural.' },
    { id: 3, name: 'Powder Brows', price: 160, duration: 120, category: 'Cejas', desc: 'Efecto sombreado / maquillaje suave de larga duración.' },
    { id: 4, name: 'Uñas Acrílicas Full Set', price: 65, duration: 75, category: 'Uñas', desc: 'Extensión premium con diseño Nail Art incluido.' }
  ]

  const equipo = [
    { id: 1, name: 'Elena Gómez', role: 'Master en Cejas y Micropigmentación', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
    { id: 2, name: 'Carlos Ruiz', role: 'Especialista en Nail Art & Tendencias', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' }
  ]

  const horas = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00']

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 pb-12 overflow-x-hidden">
      
      {/* Header Estilizado */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-50 flex items-center justify-between">
        <Link href="/" className="text-slate-400 flex items-center gap-2 text-xs uppercase tracking-wider font-medium">
          <FaArrowLeft className="text-rose-400" /> Volver
        </Link>
        <div className="text-center">
          <h1 className="text-xs tracking-[0.2em] font-light text-slate-400">SALÓN PREMIUM</h1>
          <p className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400 uppercase">Experiencia de Reserva</p>
        </div>
        <div className="w-12" />
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        
        {/* Indicador de Pasos Tipo App */}
        {step < 4 && (
          <div className="grid grid-cols-3 gap-2 mb-6 bg-slate-900/50 border border-slate-800 p-2.5 rounded-2xl text-[10px] text-center uppercase tracking-wider font-medium">
            <div className={`py-1.5 rounded-xl transition-all ${step === 1 ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md' : 'text-slate-500'}`}>1. Qué</div>
            <div className={`py-1.5 rounded-xl transition-all ${step === 2 ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md' : 'text-slate-500'}`}>2. Quién</div>
            <div className={`py-1.5 rounded-xl transition-all ${step === 3 ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md' : 'text-slate-500'}`}>3. Cuándo</div>
          </div>
        )}

        {/* PASO 1: SERVICIOS VISUALES */}
        {step === 1 && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-base font-medium tracking-tight text-slate-200 mb-4 flex items-center gap-2">
              <FaCut className="text-rose-400 text-sm" /> Selecciona el tratamiento de tus sueños
            </h2>
            <div className="space-y-3">
              {servicios.map((service) => (
                <div 
                  key={service.id}
                  onClick={() => { setSelectedService(service); setStep(2); }}
                  className="p-4 rounded-2xl border bg-slate-900/60 border-slate-800/80 shadow-xl cursor-pointer active:scale-[0.99] transition-all relative overflow-hidden group hover:border-rose-500/50"
                >
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-rose-500/10 to-transparent w-24 h-full pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest bg-slate-800 text-amber-400 px-2 py-0.5 rounded-md font-medium">
                        {service.category}
                      </span>
                      <h3 className="font-bold text-sm text-slate-100 mt-1.5 group-hover:text-rose-400 transition-colors">{service.name}</h3>
                      <p className="text-slate-400 text-xs font-light mt-1 leading-relaxed pr-4">{service.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black bg-gradient-to-r from-rose-400 to-amber-400 text-transparent bg-clip-text">${service.price}</p>
                      <span className="text-[10px] text-slate-500 block mt-1">⏱ {service.duration}m</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASO 2: SELECCIÓN DE STAFF */}
        {step === 2 && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-medium text-slate-200 flex items-center gap-2">
                <FaUser className="text-rose-400 text-sm" /> Elige al profesional de tu confianza
              </h2>
              <button onClick={() => setStep(1)} className="text-xs text-rose-400 hover:underline">Atrás</button>
            </div>
            
            <div className="space-y-3">
              {equipo.map((member) => (
                <div
                  key={member.id}
                  onClick={() => { setSelectedStaff(member); setStep(3); }}
                  className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-xl cursor-pointer active:scale-[0.99] transition-all flex items-center gap-4 hover:border-amber-500/50 group"
                >
                  <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-800 group-hover:ring-amber-500/50 transition-all"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-100 group-hover:text-amber-400 transition-colors">{member.name}</h3>
                    <p className="text-xs text-slate-400 font-light mt-0.5">{member.role}</p>
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full mt-2 inline-block">Disponible hoy</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASO 3: CALENDARIO Y HORAS TÁCTILES */}
        {step === 3 && (
          <div className="animate-in fade-in duration-300 bg-slate-900/80 border border-slate-800 p-5 rounded-3xl shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-sm uppercase tracking-wider font-bold text-slate-200 flex items-center gap-2">
                <FaCalendarAlt className="text-rose-400" /> Agenda tu cita
              </h2>
              <button onClick={() => setStep(2)} className="text-xs text-rose-400 hover:underline">Atrás</button>
            </div>

            {/* Input de fecha futurista */}
            <div className="mb-5">
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">1. Selecciona el Día</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-100 font-medium transition-all"
              />
            </div>

            {/* Selector de Horas Táctil */}
            <div className="mb-6">
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">2. Selecciona la Hora</label>
              <div className="grid grid-cols-3 gap-2">
                {horas.map((hora) => (
                  <button
                    key={hora}
                    type="button"
                    onClick={() => setSelectedTime(hora)}
                    className={`py-3 rounded-xl border text-xs font-bold tracking-wide transition-all active:scale-95 ${
                      selectedTime === hora 
                        ? 'bg-gradient-to-r from-rose-500 to-amber-500 border-transparent text-white shadow-md' 
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {hora}
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen de Ticket Estilo Lujo */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 mb-5 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-rose-500/10 rounded-full blur-xl" />
              <div className="flex justify-between text-slate-400">
                <span>Tratamiento:</span>
                <span className="text-slate-200 font-bold">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Especialista:</span>
                <span className="text-slate-200 font-medium">{selectedStaff?.name}</span>
              </div>
              {selectedDate && (
                <div className="flex justify-between text-slate-400">
                  <span>Cuándo:</span>
                  <span className="text-amber-400 font-bold">{selectedDate} @ {selectedTime || '--:--'}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center mt-2">
                <span className="text-slate-300 font-semibold">Total a Pagar en Salón:</span>
                <span className="text-base font-black bg-gradient-to-r from-rose-400 to-amber-400 text-transparent bg-clip-text">${selectedService?.price}</span>
              </div>
            </div>

            <button
              onClick={() => setStep(4)}
              disabled={!selectedDate || !selectedTime}
              className="w-full bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98] transition-transform bg-[size:200%_auto] hover:bg-right"
            >
              Confirmar Reserva de Lujo
            </button>
          </div>
        )}

        {/* PASO 4: ÉXITO ROTUNDO */}
        {step === 4 && (
          <div className="text-center bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
              <FaCheckCircle />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-100 mb-1">¡Cita Asegurada!</h2>
            <p className="text-xs text-slate-400 font-light mb-6 px-4">Tu espacio ha sido bloqueado en la agenda. Te enviaremos un recordatorio automatizado antes de tu cita.</p>
            
            <div className="flex flex-col gap-2">
              <Link href="/" className="w-full">
                <button className="w-full bg-slate-800 text-slate-200 py-3 rounded-xl text-xs font-semibold active:scale-95 transition-transform border border-slate-700/60">
                  Volver a la Página Principal
                </button>
              </Link>
              <a href="https://wa.me/1234567890" target="_blank" className="w-full">
                <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md">
                  <FaWhatsapp /> Avisar por WhatsApp
                </button>
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
