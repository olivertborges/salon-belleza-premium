'use client'

import React, { useState, useEffect } from 'react'
import { Flame, Calendar } from 'lucide-react'

export default function RachaDeVisitas() {
  const [racha, setRacha] = useState(0)

  useEffect(() => {
    const rachaGuardada = localStorage.getItem("freshNails_racha") || "0"
    const ultimaVisita = localStorage.getItem("freshNails_ultimaVisita")
    const rachaInt = parseInt(rachaGuardada, 10)
    setRacha(rachaInt)

    if (ultimaVisita) {
      const diasDesdeUltima = Math.floor((new Date().getTime() - new Date(ultimaVisita).getTime()) / (1000 * 60 * 60 * 24))
      if (diasDesdeUltima > 7 && rachaInt > 0) {
        setRacha(0)
        localStorage.setItem("freshNails_racha", "0")
      }
    }
  }, [])

  const getMensaje = () => {
    if (racha === 0) return "Agenda tu primera sesión para comenzar tu racha."
    if (racha === 1) return "¡Estilo reactivado! Sigue así."
    if (racha === 2) return "2 semanas seguidas cuidando de ti."
    if (racha === 3) return "3 semanas. ¡Tu constancia se nota!"
    return `¡${racha} semanas consecutivas! Eres una clienta distinguida.`
  };

  return (
    <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Info Principal */}
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors ${
            racha > 0 
              ? 'bg-stone-900 border-stone-900 text-white' 
              : 'bg-stone-50 border-stone-200 text-stone-400'
          }`}>
            <Flame className={`w-5 h-5 ${racha > 0 ? 'animate-pulse' : ''}`} />
          </div>
          
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Frecuencia Club</p>
            <h4 className="text-xl font-serif text-stone-800 tracking-tight mt-0.5">
              {racha > 0 ? `${racha} ${racha === 1 ? 'Semana' : 'Semanas'}` : 'Sin Racha Activa'}
            </h4>
            <p className="text-xs text-stone-500 font-light mt-1">{getMensaje()}</p>
          </div>
        </div>

        {/* Badge Lateral de Alerta */}
        {racha > 0 && (
          <div className="inline-flex items-center gap-1.5 bg-stone-50 border border-stone-200/80 px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider text-stone-600 self-stretch sm:self-auto justify-center">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>Mantén la Constancia</span>
          </div>
        )}

      </div>
    </div>
  )
}
