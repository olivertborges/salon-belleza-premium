'use client'

import React, { useState } from 'react'
import { Calendar, Sparkles, ArrowRight } from 'lucide-react'

export default function AgendarCita() {
  const [isHovered, setIsHovered] = useState(false)

  const handleOpenBooking = () => {
    // Evento nativo para abrir el flujo de reserva si está integrado, o redirección
    window.dispatchEvent(new CustomEvent('completarMision', { detail: { accion: 'agendar' } }))
    // Aquí puedes añadir la lógica de apertura de modal o router.push('/reserva')
    alert('Abriendo sistema premium de reservas...')
  }

  return (
    <div className="relative inline-block group">
      {/* Aura o resplandor de fondo dinámico */}
      <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 rounded-2xl blur-md opacity-40 group-hover:opacity-80 transition duration-1000 group-hover:duration-200 animate-tilt pointer-events-none" />
      
      {/* Botón Principal */}
      <button
        onClick={handleOpenBooking}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative flex items-center gap-3.5 px-8 py-4 bg-gradient-to-r from-stone-950 via-[#1c1816] to-stone-950 hover:from-stone-900 hover:to-stone-950 border border-rose-400/30 group-hover:border-rose-400/60 rounded-xl text-white transition-all duration-300 shadow-[0_15px_30px_rgba(0,0,0,0.6)] transform group-hover:scale-[1.03] overflow-hidden"
      >
        {/* Efecto de destello metálico reflejado que cruza el botón */}
        <div className="absolute inset-0 w-[50%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-150%] group-hover:translate-x-[250%] transition-transform duration-1000 ease-out pointer-events-none" />

        {/* Icono con animación sutil */}
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 group-hover:bg-rose-500/20 transition-colors">
          <Calendar className="w-4 h-4 text-rose-300 group-hover:rotate-6 transition-transform" />
        </div>

        {/* Texto con juego de tipografía fina */}
        <div className="text-left">
          <span className="block text-[9px] font-mono tracking-[0.25em] text-amber-300/80 uppercase font-bold">Reserva Exclusiva</span>
          <span className="text-sm font-light tracking-wide text-stone-100 group-hover:text-white flex items-center gap-1.5">
            Agendar mi <span className="font-serif italic font-normal text-rose-300 group-hover:text-rose-200">Cita</span>
          </span>
        </div>

        {/* Flecha elegante de salida */}
        <div className="ml-2 relative flex items-center">
          <ArrowRight className="w-4 h-4 text-stone-400 transform group-hover:translate-x-1 transition-transform duration-300" />
          <Sparkles className="w-3 h-3 text-amber-400 absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity" />
        </div>
      </button>
    </div>
  )
}
