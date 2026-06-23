'use client'

import React, { useState, useEffect } from 'react'
import { Cake, Gift, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'

interface CumpleanosProps {
  user: {
    id: string
    name?: string
    fechaNacimiento?: string
  } | null
  onPuntosGanados?: (puntos: number) => void
}

export default function Cumpleanos({ user, onPuntosGanados }: CumpleanosProps) {
  const [esCumpleanos, setEsCumpleanos] = useState(false)
  const [cuponMostrado, setCuponMostrado] = useState(false)

  useEffect(() => {
    const fechaNacimiento = user?.fechaNacimiento
    if (fechaNacimiento) {
      const hoy = new Date()
      const cumple = new Date(fechaNacimiento)
      
      // Validar mes y día
      if (hoy.getMonth() === cumple.getMonth() && hoy.getDate() === cumple.getDate()) {
        setEsCumpleanos(true)

        const añoActual = hoy.getFullYear()
        const yaVisto = localStorage.getItem(`cumpleanos_${user?.id}_${añoActual}`)
        
        if (!yaVisto && !cuponMostrado) {
          setCuponMostrado(true)
          
          // Confetti premium en tonos negros, dorados y piedra
          confetti({ 
            particleCount: 140, 
            spread: 90, 
            origin: { y: 0.6 }, 
            colors: ['#1c1917', '#78716c', '#d6d3d1', '#e7e5e4'] 
          })
          
          setTimeout(() => {
            confetti({ 
              particleCount: 60, 
              spread: 60, 
              origin: { y: 0.7 },
              colors: ['#1c1917', '#d6d3d1']
            })
          }, 400)
          
          if (onPuntosGanados) onPuntosGanados(500)
          localStorage.setItem(`cumpleanos_${user?.id}_${añoActual}`, 'true')
        }
      }
    }
  }, [user, onPuntosGanados, cuponMostrado])

  if (!esCumpleanos) return null

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-stone-200 p-6 shadow-sm transition-all duration-300 animate-in fade-in duration-500">
      {/* Micro-acentos geométricos minimalistas de fondo */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-stone-50 rounded-full -mr-8 -mt-8 border border-stone-100" />
      
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
          <div className="w-12 h-12 bg-stone-900 text-white rounded-xl flex items-center justify-center shadow-xs animate-bounce">
            <Cake className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <h3 className="font-serif text-base text-stone-800 tracking-tight">¡Feliz Cumpleaños, {user?.name || 'Bonita'}!</h3>
              <Sparkles className="w-3.5 h-3.5 text-stone-400 animate-pulse" />
            </div>
            <p className="text-[11px] font-light text-stone-400 mt-0.5">
              Hoy celebramos tu día especial con una cortesía exclusiva de nuestro club.
            </p>
          </div>
        </div>

        {cuponMostrado && (
          <div className="bg-stone-50 border border-stone-200/60 rounded-xl px-5 py-3 text-center min-w-[120px] self-stretch sm:self-auto flex flex-col justify-center items-center">
            <Gift className="w-4 h-4 mb-1 text-stone-700" />
            <p className="text-xs font-mono font-bold text-stone-800 tracking-wider">20% OFF</p>
            <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400 mt-0.5">Próxima Cita</p>
          </div>
        )}
      </div>
    </div>
  )
}
