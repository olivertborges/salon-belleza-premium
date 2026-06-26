'use client'

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Award, Zap, Sparkles, Flame, Crown, Heart, Lock } from 'lucide-react'

interface InsigniasLogrosProps {
  citas: number
  serviciosUnicos: number
  referidos: number
  puntos: number
  racha?: number
}

export default function InsigniasLogros({
  citas = 0,
  serviciosUnicos = 0,
  referidos = 0,
  puntos = 0,
  racha = 0
}: InsigniasLogrosProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const insignias = [
    {
      id: 'primera_cita',
      titulo: 'Primera',
      subtitulo: 'Sesión',
      desc: 'Tu debut en el salón',
      icon: Heart,
      desbloqueado: citas > 0,
      colorClassDark: 'from-rose-500/10 to-pink-500/10 text-rose-400 border-rose-500/30 shadow-[0_10px_30px_rgba(244,63,94,0.1)]',
      colorClassLight: 'from-rose-500/5 to-pink-500/5 text-rose-600 border-rose-200 shadow-sm',
      iconColorDark: 'text-rose-400 bg-rose-950/40 border-rose-500/30',
      iconColorLight: 'text-rose-600 bg-rose-50 border-rose-200'
    },
    {
      id: 'fiel',
      titulo: 'Cliente',
      subtitulo: 'Fiel',
      desc: 'Más de 5 visitas registradas',
      icon: Crown,
      desbloqueado: citas >= 5,
      colorClassDark: 'from-amber-500/10 to-yellow-600/10 text-amber-300 border-amber-500/30 shadow-[0_10px_30px_rgba(245,158,11,0.1)]',
      colorClassLight: 'from-amber-500/5 to-yellow-600/5 text-amber-700 border-amber-200 shadow-sm',
      iconColorDark: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
      iconColorLight: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      id: 'racha_activa',
      titulo: 'Racha',
      subtitulo: 'Fresh',
      desc: 'Mantienes tu racha activa',
      icon: Flame,
      desbloqueado: racha > 0,
      colorClassDark: 'from-orange-600/10 to-amber-500/10 text-orange-400 border-orange-500/30 shadow-[0_10px_30px_rgba(234,88,12,0.1)]',
      colorClassLight: 'from-orange-500/5 to-amber-500/5 text-orange-700 border-orange-200 shadow-sm',
      iconColorDark: 'text-orange-400 bg-orange-950/40 border-orange-500/30',
      iconColorLight: 'text-orange-600 bg-orange-50 border-orange-200'
    },
    {
      id: 'embajador',
      titulo: 'Socio',
      subtitulo: 'Embajador',
      desc: 'Invitaste amigos al ecosistema',
      icon: Sparkles,
      desbloqueado: referidos > 0,
      colorClassDark: 'from-purple-500/10 to-indigo-500/10 text-purple-400 border-purple-500/30 shadow-[0_10px_30px_rgba(168,85,247,0.1)]',
      colorClassLight: 'from-purple-500/5 to-indigo-500/5 text-purple-700 border-purple-200 shadow-sm',
      iconColorDark: 'text-purple-400 bg-purple-950/40 border-purple-500/30',
      iconColorLight: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
      id: 'coleccionista',
      titulo: 'Explorador',
      subtitulo: 'De Estilos',
      desc: 'Probaste 3 o más servicios',
      icon: Zap,
      desbloqueado: serviciosUnicos >= 3,
      colorClassDark: 'from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_10px_30px_rgba(6,182,212,0.1)]',
      colorClassLight: 'from-cyan-500/5 to-blue-500/5 text-cyan-700 border-cyan-200 shadow-sm',
      iconColorDark: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
      iconColorLight: 'text-cyan-600 bg-cyan-50 border-cyan-200'
    }
  ]

  return (
    <div className={`border p-6 sm:p-8 rounded-3xl transition-all duration-300 shadow-md ${
      isDark 
        ? 'bg-[#141211] border-stone-850 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' 
        : 'bg-white border-stone-200'
    } space-y-8`}>

      {/* Encabezado Principal */}
      <div className={`flex items-center gap-4 border-b pb-6 ${
        isDark ? 'border-stone-900' : 'border-stone-100'
      }`}>
        <div className={`w-12 h-12 border rounded-xl flex items-center justify-center ${
          isDark ? 'bg-gradient-to-r from-rose-500/10 to-amber-500/10 border-amber-500/20' : 'bg-rose-50 border-rose-200'
        }`}>
          <Award className="w-5 h-5 text-rose-500 dark:text-rose-400" />
        </div>
        <div>
          <h2 className={`text-xl font-extralight tracking-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
            Insignias y <span className="font-serif italic font-normal text-rose-600 dark:text-rose-300">Reconocimientos</span>
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-medium mt-1">Colecciona logros con cada visita</p>
        </div>
      </div>

      {/* Grid de Insignias Estilizadas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {insignias.map((insignia) => {
          const Icon = insignia.icon
          return (
            <div 
              key={insignia.id}
              className={`relative flex flex-col items-center justify-between p-6 rounded-2xl border text-center transition-all duration-500 group ${
                insignia.desbloqueado 
                  ? isDark
                    ? `bg-gradient-to-b ${insignia.colorClassDark} hover:-translate-y-1`
                    : `bg-gradient-to-b ${insignia.colorClassLight} hover:-translate-y-1`
                  : isDark
                    ? 'bg-[#1a1715]/40 border-stone-900 hover:border-stone-850'
                    : 'bg-stone-50/50 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {/* Icono de la Insignia */}
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${
                insignia.desbloqueado 
                  ? isDark ? insignia.iconColorDark : insignia.iconColorLight
                  : isDark ? 'bg-stone-950 border-stone-900 text-stone-600' : 'bg-stone-100 border-stone-200 text-stone-400'
              }`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Textos Mixtos Estilo Fresh Nails */}
              <div className="space-y-1 flex-1 flex flex-col justify-center">
                <p className={`text-xs font-medium tracking-tight ${
                  insignia.desbloqueado 
                    ? isDark ? 'text-stone-100' : 'text-stone-800' 
                    : 'text-stone-400 dark:text-stone-500'
                }`}>
                  {insignia.titulo} <span className={`font-serif italic block ${
                    insignia.desbloqueado 
                      ? 'text-rose-600 dark:text-rose-300' 
                      : 'text-stone-400 dark:text-stone-500/70'
                  }`}>{insignia.subtitulo}</span>
                </p>
                <p className={`text-[9px] font-light leading-tight mt-1.5 max-w-[110px] mx-auto ${
                  isDark ? 'text-stone-500' : 'text-stone-400'
                }`}>
                  {insignia.desc}
                </p>
              </div>

              {/* Indicador de Estado Elegante inferior */}
              <div className="mt-4 pt-1 flex items-center justify-center h-4 w-full">
                {insignia.desbloqueado ? (
                  <span className={`text-[8px] font-mono font-bold tracking-widest px-2 py-0.5 rounded-full uppercase border ${
                    isDark 
                      ? 'text-rose-400 bg-rose-500/5 border-rose-500/20' 
                      : 'text-rose-600 bg-rose-50 border-rose-200'
                  }`}>
                    Desbloqueado
                  </span>
                ) : (
                  <div className={`flex items-center gap-1 transition-colors ${
                    isDark ? 'text-stone-600 group-hover:text-stone-500' : 'text-stone-400 group-hover:text-stone-600'
                  }`}>
                    <Lock className="w-2.5 h-2.5" />
                    <span className="text-[8px] font-mono uppercase tracking-widest">Por lograr</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
