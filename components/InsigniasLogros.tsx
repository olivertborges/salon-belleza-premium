'use client'

import React from 'react'
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
  
  const insignias = [
    {
      id: 'primera_cita',
      titulo: 'Primera',
      subtitulo: 'Sesión',
      desc: 'Tu debut en el salón',
      icon: Heart,
      desbloqueado: citas > 0,
      colorClass: 'from-rose-500/10 to-pink-500/10 text-rose-400 border-rose-500/30 shadow-[0_10px_30px_rgba(244,63,94,0.1)]',
      iconColor: 'text-rose-400 bg-rose-950/40 border-rose-500/30'
    },
    {
      id: 'fiel',
      titulo: 'Cliente',
      subtitulo: 'Fiel',
      desc: 'Más de 5 visitas registradas',
      icon: Crown,
      desbloqueado: citas >= 5,
      colorClass: 'from-amber-500/10 to-yellow-600/10 text-amber-300 border-amber-500/30 shadow-[0_10px_30px_rgba(245,158,11,0.1)]',
      iconColor: 'text-amber-400 bg-amber-950/40 border-amber-500/30'
    },
    {
      id: 'racha_activa',
      titulo: 'Racha',
      subtitulo: 'Fresh',
      desc: 'Mantienes tu racha activa',
      icon: Flame,
      desbloqueado: racha > 0,
      colorClass: 'from-orange-600/10 to-amber-500/10 text-orange-400 border-orange-500/30 shadow-[0_10px_30px_rgba(234,88,12,0.1)]',
      iconColor: 'text-orange-400 bg-orange-950/40 border-orange-500/30'
    },
    {
      id: 'embajador',
      titulo: 'Socio',
      subtitulo: 'Embajador',
      desc: 'Invitaste amigos al ecosistema',
      icon: Sparkles,
      desbloqueado: referidos > 0,
      colorClass: 'from-purple-500/10 to-indigo-500/10 text-purple-400 border-purple-500/30 shadow-[0_10px_30px_rgba(168,85,247,0.1)]',
      iconColor: 'text-purple-400 bg-purple-950/40 border-purple-500/30'
    },
    {
      id: 'coleccionista',
      titulo: 'Explorador',
      subtitulo: 'De Estilos',
      desc: 'Probaste 3 o más servicios',
      icon: Zap,
      desbloqueado: serviciosUnicos >= 3,
      colorClass: 'from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_10px_30px_rgba(6,182,212,0.1)]',
      iconColor: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30'
    }
  ]

  return (
    <div className="bg-[#141211] border border-stone-850 p-8 rounded-3xl shadow-2xl space-y-8 font-sans">
      
      {/* Encabezado Principal */}
      <div className="flex items-center gap-4 border-b border-stone-900 pb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
          <Award className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h2 className="text-xl font-extralight tracking-tight text-stone-100">
            Insignias y <span className="font-serif italic font-normal text-rose-300">Reconocimientos</span>
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-medium mt-1">Colecciona logros con cada visita</p>
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
                  ? `bg-gradient-to-b ${insignia.colorClass} hover:-translate-y-1`
                  : 'bg-[#1a1715]/40 border-stone-900 hover:border-stone-850'
              }`}
            >
              {/* Icono de la Insignia */}
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${
                insignia.desbloqueado 
                  ? insignia.iconColor
                  : 'bg-stone-950 border-stone-900 text-stone-600'
              }`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Textos Mixtos Estilo Fresh Nails */}
              <div className="space-y-1 flex-1 flex flex-col justify-center">
                <p className={`text-xs font-medium tracking-tight ${insignia.desbloqueado ? 'text-stone-100' : 'text-stone-400'}`}>
                  {insignia.titulo} <span className={`font-serif italic block ${insignia.desbloqueado ? 'text-rose-300' : 'text-stone-500/70'}`}>{insignia.subtitulo}</span>
                </p>
                <p className="text-[9px] text-stone-500 font-light leading-tight mt-1.5 max-w-[110px] mx-auto">
                  {insignia.desc}
                </p>
              </div>

              {/* Indicador de Estado Elegante inferior */}
              <div className="mt-4 pt-1 flex items-center justify-center h-4 w-full">
                {insignia.desbloqueado ? (
                  <span className="text-[8px] font-mono font-bold text-rose-400 tracking-widest bg-rose-500/5 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase">
                    Desbloqueado
                  </span>
                ) : (
                  <div className="flex items-center gap-1 text-stone-600 group-hover:text-stone-500 transition-colors">
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
