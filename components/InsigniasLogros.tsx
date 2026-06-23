'use client'

import React, { useState, useEffect } from 'react'
import { Trophy } from 'lucide-react'
import { createPortal } from 'react-dom'

interface Insignia {
  id: number
  nombre: string
  descripcion: string
  icono: string
  color: string
  puntos: number
  condicion: (citas: number, serviciosUnicos: number, referidos: number, puntos: number, racha: number) => boolean
}

const insigniasDisponibles: Insignia[] = [
  { id: 1, nombre: "Primera cita", descripcion: "Agendaste tu primera visita", icono: "🎯", color: "from-stone-800 to-stone-900", puntos: 100, condicion: (citas) => citas >= 1 },
  { id: 2, nombre: "Exploradora", descripcion: "Probaste 3 servicios", icono: "🗺️", color: "from-amber-700 to-amber-900", puntos: 200, condicion: (_, serviciosUnicos) => serviciosUnicos >= 3 },
  { id: 3, nombre: "Fiel", descripcion: "10 visitas al salón", icono: "👑", color: "from-yellow-600 to-amber-700", puntos: 500, condicion: (citas) => citas >= 10 },
  { id: 4, nombre: "Tendencias", descripcion: "Pionera en nuevos lanzamientos", icono: "🌟", color: "from-rose-700 to-stone-900", puntos: 300, condicion: () => false },
  { id: 5, nombre: "Influencer", descripcion: "3 amigas invitadas", icono: "👥", color: "from-stone-700 to-stone-800", puntos: 400, condicion: (_, __, referidos) => referidos >= 3 },
  { id: 6, nombre: "Puntos Elite", descripcion: "5000 puntos acumulados", icono: "💎", color: "from-stone-950 to-stone-800", puntos: 1000, condicion: (_, __, ___, puntos) => puntos >= 5000 },
  { id: 7, nombre: "Racha", descripcion: "5 semanas seguidas viniendo", icono: "🔥", color: "from-amber-600 to-rose-700", puntos: 300, condicion: (_, __, ___, ____, racha) => racha >= 5 },
  { id: 8, nombre: "Social", descripcion: "Compartió en redes", icono: "📱", color: "from-stone-800 to-stone-600", puntos: 150, condicion: () => false },
]

interface InsigniasLogrosProps {
  citas: number
  serviciosUnicos: number
  referidos: number
  puntos: number
  racha: number
}

export default function InsigniasLogros({ citas, serviciosUnicos, referidos, puntos, racha }: InsigniasLogrosProps) {
  const [insignias, setInsignias] = useState<any[]>([])
  const [insigniasObtenidas, setInsigniasObtenidas] = useState(0)
  const [nuevaInsignia, setNuevaInsignia] = useState<Insignia | null>(null)
  const [mounted, setMounted] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  // Asegurar montaje en cliente para Portals en Next.js
  useEffect(() => {
    setMounted(true)
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [timeoutId])

  useEffect(() => {
    const nuevasInsignias = insigniasDisponibles.map(insignia => ({
      ...insignia,
      obtenida: insignia.condicion(citas, serviciosUnicos, referidos, puntos, racha)
    }))

    const obtenidas = nuevasInsignias.filter(i => i.obtenida).length

    if (obtenidas > insigniasObtenidas && insignias.length > 0) {
      const recienObtenida = nuevasInsignias.find(i => i.obtenida && !insignias.find(ins => ins.id === i.id)?.obtenida)
      if (recienObtenida && !nuevaInsignia) {
        setNuevaInsignia(recienObtenida)
        const id = setTimeout(() => {
          setNuevaInsignia(null)
        }, 4000)
        setTimeoutId(id)
      }
    }

    setInsignias(nuevasInsignias)
    setInsigniasObtenidas(obtenidas)
  }, [citas, serviciosUnicos, referidos, puntos, racha])

  const cerrarModal = () => {
    if (timeoutId) clearTimeout(timeoutId)
    setNuevaInsignia(null)
  }

  // Estructura limpia para el Portal
  const modalContent = nuevaInsignia && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={cerrarModal} />
      <div className={`relative bg-gradient-to-br ${nuevaInsignia.color} text-white rounded-2xl p-8 text-center shadow-2xl max-w-sm w-full z-10 border border-white/10 transition-all duration-300 transform scale-100`}>
        <button onClick={cerrarModal} className="absolute top-4 right-4 text-white/70 hover:text-white font-mono text-xs tracking-widest">
          ✕
        </button>
        <div className="text-6xl mb-4 drop-shadow-md">{nuevaInsignia.icono}</div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-stone-300">Logro Desbloqueado</p>
        <h3 className="text-xl font-serif mt-1 tracking-tight">{nuevaInsignia.nombre}</h3>
        <p className="text-xs text-stone-200/80 font-light mt-2 px-2">{nuevaInsignia.descripcion}</p>
        <div className="mt-6 inline-block bg-white/10 border border-white/20 rounded-full px-4 py-1 text-[11px] font-mono tracking-wider">
          +{nuevaInsignia.puntos} PUNTOS CLUB
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-4 mb-5 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-stone-100 rounded-xl flex items-center justify-center border border-stone-200">
              <Trophy className="w-4 h-4 text-stone-700" />
            </div>
            <div>
              <h3 className="font-serif text-base text-stone-800 tracking-tight">Insignias & Reconocimientos</h3>
              <p className="text-[11px] text-stone-400 font-light">Completa misiones y eleva tu nivel dentro del club.</p>
            </div>
          </div>
          <div className="inline-block bg-stone-50 border border-stone-200 px-3 py-1 rounded-full text-right self-start sm:self-auto">
            <span className="text-[10px] font-mono font-bold text-stone-600 tracking-wider uppercase">{insigniasObtenidas} / {insignias.length} Obtenidas</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {insignias.map(insignia => (
            <div
              key={insignia.id}
              className={`relative overflow-hidden rounded-xl p-4 text-center transition-all border ${
                insignia.obtenida 
                  ? `bg-gradient-to-br ${insignia.color} text-white border-transparent shadow-sm` 
                  : 'bg-stone-50/50 border-stone-200/80 grayscale opacity-60'
              }`}
            >
              {insignia.obtenida && (
                <div className="absolute top-2 right-2">
                  <div className="w-3.5 h-3.5 bg-white text-stone-900 rounded-full flex items-center justify-center shadow-xs">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
              <div className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-105">
                {insignia.icono}
              </div>
              <p className={`text-xs font-bold tracking-tight ${insignia.obtenida ? 'text-white' : 'text-stone-700'}`}>
                {insignia.nombre}
              </p>
              <p className={`text-[10px] leading-tight font-light mt-1 max-w-[120px] mx-auto ${insignia.obtenida ? 'text-white/80' : 'text-stone-400'}`}>
                {insignia.descripcion}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Renderizado seguro de Portals en el body de Next.js */}
      {mounted && nuevaInsignia && createPortal(modalContent, document.body)}
    </>
  )
}
