'use client'

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { Award, Zap, Sparkles, Flame, Crown, Heart, Lock, CheckCircle2 } from 'lucide-react'

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
  const { settings } = useSettings()
  const isDark = theme === 'dark'

  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'

  const insignias = [
    {
      id: 'primera_cita',
      titulo: 'Primera',
      subtitulo: 'Sesión',
      desc: 'Tu debut en el salón',
      icon: Heart,
      desbloqueado: citas > 0,
      color: primaryColor
    },
    {
      id: 'fiel',
      titulo: 'Cliente',
      subtitulo: 'Fiel',
      desc: '5+ visitas',
      icon: Crown,
      desbloqueado: citas >= 5,
      color: '#F59E0B'
    },
    {
      id: 'racha_activa',
      titulo: 'Racha',
      subtitulo: 'Fresh',
      desc: 'Mantén tu racha',
      icon: Flame,
      desbloqueado: racha > 0,
      color: '#F97316'
    },
    {
      id: 'embajador',
      titulo: 'Socio',
      subtitulo: 'Embajador',
      desc: 'Invitaste amigos',
      icon: Sparkles,
      desbloqueado: referidos > 0,
      color: '#A855F7'
    },
    {
      id: 'coleccionista',
      titulo: 'Explorador',
      subtitulo: 'De Estilos',
      desc: '3+ servicios',
      icon: Zap,
      desbloqueado: serviciosUnicos >= 3,
      color: '#06B6D4'
    }
  ]

  const totalInsignias = insignias.length
  const desbloqueadas = insignias.filter(i => i.desbloqueado).length

  return (
    <div className={`space-y-4 ${
      isDark ? 'text-stone-100' : 'text-stone-900'
    }`}>

      {/* Encabezado con progreso */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${primaryColor}10` }}>
            <Award className="w-3.5 h-3.5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h3 className="text-xs font-black tracking-tight">
              <span className={isDark ? 'text-white' : 'text-stone-900'}>Logros </span>
              <span className="font-serif italic" style={{ color: primaryColor }}>
                {desbloqueadas}/{totalInsignias}
              </span>
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${(desbloqueadas / totalInsignias) * 100}%`,
                background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
              }}
            />
          </div>
          <span className="text-[8px] font-mono font-bold text-stone-400 dark:text-stone-500">
            {Math.round((desbloqueadas / totalInsignias) * 100)}%
          </span>
        </div>
      </div>

      {/* Grid de Insignias Compacto */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {insignias.map((insignia) => {
          const Icon = insignia.icon
          return (
            <div 
              key={insignia.id}
              className={`relative group flex flex-col items-center p-2.5 rounded-xl border transition-all duration-300 ${
                insignia.desbloqueado 
                  ? `hover:-translate-y-0.5 hover:shadow-md cursor-default`
                  : 'opacity-40 hover:opacity-60'
              } ${
                isDark 
                  ? 'bg-[#130f24] border-fuchsia-950' 
                  : 'bg-white border-pink-100/60'
              }`}
              style={insignia.desbloqueado ? {
                borderColor: `${insignia.color}30`,
                boxShadow: `0 4px 12px ${insignia.color}10`
              } : {}}
            >
              {/* Icono */}
              <div 
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                  insignia.desbloqueado 
                    ? 'bg-gradient-to-br' 
                    : 'bg-stone-100 dark:bg-stone-800'
                }`}
                style={insignia.desbloqueado ? {
                  background: `linear-gradient(135deg, ${insignia.color}20, ${insignia.color}05)`,
                  color: insignia.color
                } : {
                  color: isDark ? '#4a4a4a' : '#a0a0a0'
                }}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Texto */}
              <div className="text-center mt-1.5">
                <p className={`text-[7px] font-black uppercase tracking-wider ${
                  insignia.desbloqueado 
                    ? isDark ? 'text-white' : 'text-stone-800'
                    : 'text-stone-400 dark:text-stone-600'
                }`}>
                  {insignia.titulo}
                </p>
                <p className={`text-[6px] font-serif italic ${
                  insignia.desbloqueado 
                    ? 'text-stone-500 dark:text-stone-400'
                    : 'text-stone-400 dark:text-stone-600'
                }`}>
                  {insignia.subtitulo}
                </p>
              </div>

              {/* Badge de estado */}
              {insignia.desbloqueado && (
                <div className="absolute -top-1 -right-1">
                  <CheckCircle2 className="w-3 h-3" style={{ color: insignia.color }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mensaje de motivación */}
      {desbloqueadas < totalInsignias && (
        <p className="text-[8px] font-medium text-center text-stone-400 dark:text-stone-500 italic">
          {totalInsignias - desbloqueadas} logro{totalInsignias - desbloqueadas > 1 ? 's' : ''} por desbloquear
        </p>
      )}
    </div>
  )
}