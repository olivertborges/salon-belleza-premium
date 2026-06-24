'use client'

import React, { useState } from 'react'
import { CheckCircle2, Circle, Flame, Sparkles, Trophy } from 'lucide-react'

export default function MisionesDiarias() {
  const [misiones] = useState([
    { id: 1, texto: 'Revisar tus puntos acumulados', puntos: 10, completada: true },
    { id: 2, texto: 'Compartir tu código de referido QR', puntos: 25, completada: false },
    { id: 3, texto: 'Agendar o verificar tu próxima sesión de belleza', puntos: 15, completada: false },
  ])

  const completadas = misiones.filter(m => m.completada).length
  const porcentaje = Math.round((completadas / misiones.length) * 100)

  return (
    <div className="bg-[#141211] border border-stone-850 p-8 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.85)] space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-900 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500/10 to-rose-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extralight tracking-tight text-stone-100">
              Misiones <span className="font-serif italic font-normal text-rose-300">Diarias</span>
            </h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-medium mt-1">Suma puntos Fresh cada día</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-orange-500/5 border border-orange-500/20 px-4 py-2 rounded-xl self-start sm:self-center">
          <span className="text-xs text-stone-400 font-light">Racha Actual:</span>
          <span className="text-sm font-mono font-bold text-orange-400 flex items-center gap-1">
            3 Días <Flame className="w-3.5 h-3.5 fill-orange-500/20" />
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-mono tracking-wider text-stone-400">
          <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-amber-400" /> Progreso de hoy</span>
          <span className="text-stone-200 font-bold">{porcentaje}%</span>
        </div>
        <div className="h-2 w-full bg-stone-950 rounded-full overflow-hidden border border-stone-900 relative">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {misiones.map((mision) => (
          <div 
            key={mision.id}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
              mision.completada 
                ? 'bg-stone-900/20 border-stone-850/60 opacity-60' 
                : 'bg-stone-900/50 border-stone-800/80 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center gap-3.5 max-w-[80%]">
              {mision.completada ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-stone-600 shrink-0" />
              )}
              <p className={`text-xs md:text-sm font-light tracking-wide ${mision.completada ? 'line-through text-stone-500' : 'text-stone-300'}`}>
                {mision.texto}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-stone-950 px-2.5 py-1 rounded-lg border border-stone-900">
              <span className="text-[10px] font-mono text-amber-400 font-bold">+{mision.puntos}</span>
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
