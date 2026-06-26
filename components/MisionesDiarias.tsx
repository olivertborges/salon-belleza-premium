'use client'

import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { CheckCircle2, Circle, Flame, Sparkles, Trophy } from 'lucide-react'

export default function MisionesDiarias() {
  const { theme } = useTheme()
  const [misiones] = useState([
    { id: 1, texto: 'Revisar tus puntos acumulados', puntos: 10, completada: true },
    { id: 2, texto: 'Compartir tu código de referido QR', puntos: 25, completada: false },
    { id: 3, texto: 'Agendar o verificar tu próxima sesión de belleza', puntos: 15, completada: false },
  ])

  const isDark = theme === 'dark'
  const completadas = misiones.filter(m => m.completada).length
  const porcentaje = Math.round((completadas / misiones.length) * 100)

  return (
    <div className={`border p-6 sm:p-8 rounded-3xl transition-all duration-300 shadow-md ${
      isDark 
        ? 'bg-[#141211] border-stone-850 shadow-[0_30px_60px_rgba(0,0,0,0.5)]' 
        : 'bg-white border-stone-200'
    } space-y-6`}>

      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 ${
        isDark ? 'border-stone-900' : 'border-stone-100'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 border rounded-xl flex items-center justify-center ${
            isDark 
              ? 'bg-gradient-to-r from-orange-500/10 to-rose-500/10 border-orange-500/20' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <Flame className="w-5 h-5 text-orange-500 dark:text-orange-400 animate-pulse" />
          </div>
          <div>
            <h2 className={`text-xl font-extralight tracking-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
              Misiones <span className="font-serif italic font-normal text-rose-600 dark:text-rose-300">Diarias</span>
            </h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-medium mt-1">Suma puntos Fresh cada día</p>
          </div>
        </div>

        <div className={`inline-flex items-center gap-2 border px-4 py-2 rounded-xl self-start sm:self-center ${
          isDark ? 'bg-orange-500/5 border-orange-500/20' : 'bg-orange-50/50 border-orange-200'
        }`}>
          <span className="text-xs text-stone-500 dark:text-stone-400 font-light">Racha Actual:</span>
          <span className="text-sm font-mono font-bold text-orange-500 dark:text-orange-400 flex items-center gap-1">
            3 Días <Flame className="w-3.5 h-3.5 fill-orange-500/20" />
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className={`flex justify-between text-[11px] font-mono tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Progreso de hoy</span>
          <span className={`font-bold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{porcentaje}%</span>
        </div>
        <div className={`h-2 w-full rounded-full overflow-hidden border relative ${
          isDark ? 'bg-stone-950 border-stone-900' : 'bg-stone-100 border-stone-200/60'
        }`}>
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
                ? isDark
                  ? 'bg-stone-900/20 border-stone-850/60 opacity-60' 
                  : 'bg-stone-50 border-stone-200/60 opacity-60'
                : isDark
                  ? 'bg-stone-900/40 border-stone-850 hover:border-stone-700'
                  : 'bg-stone-50/60 border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center gap-3.5 max-w-[80%]">
              {mision.completada ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
              ) : (
                <Circle className={`w-5 h-5 shrink-0 ${isDark ? 'text-stone-700' : 'text-stone-300'}`} />
              )}
              <p className={`text-xs md:text-sm font-light tracking-wide ${
                mision.completada 
                  ? 'line-through text-stone-400 dark:text-stone-500' 
                  : isDark ? 'text-stone-300' : 'text-stone-700'
              }`}>
                {mision.texto}
              </p>
            </div>

            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
              isDark ? 'bg-stone-950 border-stone-900' : 'bg-stone-100/80 border-stone-200/60'
            }`}>
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">+{mision.puntos}</span>
              <Sparkles className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
