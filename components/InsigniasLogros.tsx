'use client'

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Award, Zap, Sparkles, Flame, Crown, Heart, Lock, Gem, Star } from 'lucide-react'

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
      colorClassDark: 'from-[#D4AF37]/10 to-[#E8D5A0]/5 text-[#D4AF37] border-[#D4AF37]/30 shadow-[0_10px_30px_rgba(212,175,55,0.1)]',
      colorClassLight: 'from-[#D4AF37]/5 to-[#E8D5A0]/5 text-[#D4AF37] border-[#D4AF37]/20 shadow-sm',
      iconColorDark: 'text-[#D4AF37] bg-[#3D281E] border-[#D4AF37]/30',
      iconColorLight: 'text-[#D4AF37] bg-[#FFF9F6] border-[#D4AF37]/20'
    },
    {
      id: 'fiel',
      titulo: 'Cliente',
      subtitulo: 'Fiel',
      desc: 'Más de 5 visitas registradas',
      icon: Crown,
      desbloqueado: citas >= 5,
      colorClassDark: 'from-[#D4AF37]/10 to-[#E8D5A0]/5 text-[#D4AF37] border-[#D4AF37]/30 shadow-[0_10px_30px_rgba(212,175,55,0.1)]',
      colorClassLight: 'from-[#D4AF37]/5 to-[#E8D5A0]/5 text-[#D4AF37] border-[#D4AF37]/20 shadow-sm',
      iconColorDark: 'text-[#D4AF37] bg-[#3D281E] border-[#D4AF37]/30',
      iconColorLight: 'text-[#D4AF37] bg-[#FFF9F6] border-[#D4AF37]/20'
    },
    {
      id: 'racha_activa',
      titulo: 'Racha',
      subtitulo: 'Fresh',
      desc: 'Mantienes tu racha activa',
      icon: Flame,
      desbloqueado: racha > 0,
      colorClassDark: 'from-[#D4AF37]/10 to-[#E8D5A0]/5 text-[#D4AF37] border-[#D4AF37]/30 shadow-[0_10px_30px_rgba(212,175,55,0.1)]',
      colorClassLight: 'from-[#D4AF37]/5 to-[#E8D5A0]/5 text-[#D4AF37] border-[#D4AF37]/20 shadow-sm',
      iconColorDark: 'text-[#D4AF37] bg-[#3D281E] border-[#D4AF37]/30',
      iconColorLight: 'text-[#D4AF37] bg-[#FFF9F6] border-[#D4AF37]/20'
    },
    {
      id: 'embajador',
      titulo: 'Socio',
      subtitulo: 'Embajador',
      desc: 'Invitaste amigos al ecosistema',
      icon: Sparkles,
      desbloqueado: referidos > 0,
      colorClassDark: 'from-[#D4AF37]/10 to-[#E8D5A0]/5 text-[#D4AF37] border-[#D4AF37]/30 shadow-[0_10px_30px_rgba(212,175,55,0.1)]',
      colorClassLight: 'from-[#D4AF37]/5 to-[#E8D5A0]/5 text-[#D4AF37] border-[#D4AF37]/20 shadow-sm',
      iconColorDark: 'text-[#D4AF37] bg-[#3D281E] border-[#D4AF37]/30',
      iconColorLight: 'text-[#D4AF37] bg-[#FFF9F6] border-[#D4AF37]/20'
    },
    {
      id: 'coleccionista',
      titulo: 'Explorador',
      subtitulo: 'De Estilos',
      desc: 'Probaste 3 o más servicios',
      icon: Zap,
      desbloqueado: serviciosUnicos >= 3,
      colorClassDark: 'from-[#D4AF37]/10 to-[#E8D5A0]/5 text-[#D4AF37] border-[#D4AF37]/30 shadow-[0_10px_30px_rgba(212,175,55,0.1)]',
      colorClassLight: 'from-[#D4AF37]/5 to-[#E8D5A0]/5 text-[#D4AF37] border-[#D4AF37]/20 shadow-sm',
      iconColorDark: 'text-[#D4AF37] bg-[#3D281E] border-[#D4AF37]/30',
      iconColorLight: 'text-[#D4AF37] bg-[#FFF9F6] border-[#D4AF37]/20'
    }
  ]

  // Calcular insignias desbloqueadas
  const desbloqueadas = insignias.filter(i => i.desbloqueado).length
  const totalInsignias = insignias.length

  return (
    <div className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 shadow-sm ${
      isDark 
        ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
        : 'bg-white border-[#F0E4DA] shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
    } space-y-6`}>

      {/* ============================================================ */}
      {/* ENCABEZADO */}
      {/* ============================================================ */}
      <div className={`flex items-center justify-between border-b pb-4 ${
        isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
            isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
          }`}>
            <Award className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h2 className={`font-serif text-xl font-light ${
              isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
            }`}>
              Insignias y <span className="font-serif italic text-[#D4AF37]">Reconocimientos</span>
            </h2>
            <p className={`text-[8px] uppercase tracking-[0.2em] font-medium mt-0.5 ${
              isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
            }`}>
              Colecciona logros con cada visita
            </p>
          </div>
        </div>

        {/* Contador de insignias */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
          isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
        }`}>
          <Gem className="w-4 h-4 text-[#D4AF37]" />
          <span className={`text-sm font-black ${
            isDark ? 'text-[#D4AF37]' : 'text-[#D4AF37]'
          }`}>
            {desbloqueadas}/{totalInsignias}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* GRID DE INSIGNIAS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {insignias.map((insignia) => {
          const Icon = insignia.icon
          const isUnlocked = insignia.desbloqueado

          return (
            <div 
              key={insignia.id}
              className={`relative flex flex-col items-center justify-between p-4 sm:p-5 rounded-2xl border text-center transition-all duration-500 group ${
                isUnlocked 
                  ? isDark
                    ? `bg-gradient-to-b ${insignia.colorClassDark} hover:-translate-y-1 hover:shadow-lg`
                    : `bg-gradient-to-b ${insignia.colorClassLight} hover:-translate-y-1 hover:shadow-lg`
                  : isDark
                    ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#3D281E]'
                    : 'bg-[#FFF9F6] border-[#F0E4DA] hover:bg-[#FFF9F6]'
              }`}
            >
              {/* Icono */}
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 ${
                isUnlocked 
                  ? isDark ? insignia.iconColorDark : insignia.iconColorLight
                  : isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#A89588]'
              }`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Título */}
              <div className="space-y-0.5 flex-1 flex flex-col justify-center">
                <p className={`text-xs font-medium tracking-tight ${
                  isUnlocked 
                    ? isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]' 
                    : isDark ? 'text-[#A89588]' : 'text-[#A89588]'
                }`}>
                  {insignia.titulo} 
                  <span className={`font-serif italic block text-[#D4AF37]`}>
                    {insignia.subtitulo}
                  </span>
                </p>
                <p className={`text-[8px] font-light leading-tight mt-1 max-w-[100px] mx-auto ${
                  isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                }`}>
                  {insignia.desc}
                </p>
              </div>

              {/* Estado */}
              <div className="mt-3 pt-1 flex items-center justify-center h-4 w-full">
                {isUnlocked ? (
                  <span className={`text-[7px] font-mono font-bold tracking-[0.15em] px-2 py-0.5 rounded-full uppercase border ${
                    isDark 
                      ? 'text-[#D4AF37] bg-[#3D281E] border-[#D4AF37]/30' 
                      : 'text-[#D4AF37] bg-[#FFF9F6] border-[#D4AF37]/20'
                  }`}>
                    ✓ Desbloqueado
                  </span>
                ) : (
                  <div className={`flex items-center gap-1 transition-colors ${
                    isDark ? 'text-[#A89588]' : 'text-[#A89588]'
                  }`}>
                    <Lock className="w-2.5 h-2.5" />
                    <span className="text-[7px] font-mono uppercase tracking-[0.1em]">Bloqueado</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ============================================================ */}
      {/* BARRA DE PROGRESO DE INSIGNIAS */}
      {/* ============================================================ */}
      <div className={`pt-4 border-t ${
        isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
      }`}>
        <div className="flex justify-between items-center mb-2">
          <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${
            isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
          }`}>
            Progreso de Colección
          </span>
          <span className={`text-[8px] font-black font-mono text-[#D4AF37]`}>
            {desbloqueadas}/{totalInsignias}
          </span>
        </div>
        <div className={`h-2 w-full rounded-full overflow-hidden ${
          isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'
        }`}>
          <div 
            className="h-full rounded-full bg-[#D4AF37] transition-all duration-700 ease-out" 
            style={{ width: `${(desbloqueadas / totalInsignias) * 100}%` }} 
          />
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  )
}