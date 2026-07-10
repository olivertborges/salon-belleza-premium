'use client'

import React, { useState, useEffect } from 'react'
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
  const [isMounted, setIsMounted] = useState(false)
  
  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color
  const secondaryColor = settings?.secondary_color

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Si no hay settings, mostrar loading
  if (!isMounted || !settings) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-stone-200 dark:bg-stone-700 w-7 h-7" />
            <div className="h-5 w-24 bg-stone-200 dark:bg-stone-700 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-stone-200 dark:bg-stone-700" />
            <div className="h-3 w-8 bg-stone-200 dark:bg-stone-700 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="p-3 rounded-xl bg-stone-200 dark:bg-stone-700 h-20" />
          ))}
        </div>
      </div>
    )
  }

  const insignias = [
    {
      id: 'primera_cita',
      titulo: 'Primera',
      subtitulo: 'Sesión',
      icon: Heart,
      desbloqueado: citas > 0,
      color: primaryColor
    },
    {
      id: 'fiel',
      titulo: 'Cliente',
      subtitulo: 'Fiel',
      icon: Crown,
      desbloqueado: citas >= 5,
      color: '#F59E0B'
    },
    {
      id: 'racha_activa',
      titulo: 'Racha',
      subtitulo: 'Fresh',
      icon: Flame,
      desbloqueado: racha > 0,
      color: '#F97316'
    },
    {
      id: 'embajador',
      titulo: 'Socio',
      subtitulo: 'Embajador',
      icon: Sparkles,
      desbloqueado: referidos > 0,
      color: '#A855F7'
    },
    {
      id: 'coleccionista',
      titulo: 'Explorador',
      subtitulo: 'De Estilos',
      icon: Zap,
      desbloqueado: serviciosUnicos >= 3,
      color: '#06B6D4'
    }
  ]

  const totalInsignias = insignias.length
  const desbloqueadas = insignias.filter(i => i.desbloqueado).length

  return (
    <div className="space-y-4">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div 
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Award className="w-4 h-4" style={{ color: primaryColor }} />
          </div>
          <div>
            <h3 className="text-sm font-medium tracking-tight">
              <span className={isDark ? 'text-stone-200' : 'text-stone-700'}>
                Logros
              </span>
              <span className="ml-1.5 text-xs font-normal" style={{ color: primaryColor }}>
                {desbloqueadas}/{totalInsignias}
              </span>
            </h3>
          </div>
        </div>
        
        {/* Barra de progreso */}
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-700"
              style={{ 
                width: `${(desbloqueadas / totalInsignias) * 100}%`,
                background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
              }}
            />
          </div>
          <span className="text-[10px] font-mono font-medium text-stone-400 dark:text-stone-500">
            {Math.round((desbloqueadas / totalInsignias) * 100)}%
          </span>
        </div>
      </div>

      {/* Grid de Insignias */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {insignias.map((insignia) => {
          const Icon = insignia.icon
          return (
            <div 
              key={insignia.id}
              className={`relative group flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${
                insignia.desbloqueado 
                  ? `hover:-translate-y-0.5`
                  : 'opacity-50 hover:opacity-70'
              } ${
                isDark 
                  ? 'bg-[#1a1625] hover:bg-[#1f1a2e]' 
                  : 'bg-stone-50/80 hover:bg-stone-100/80'
              }`}
            >
              {/* Icono */}
              <div 
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  insignia.desbloqueado 
                    ? 'group-hover:scale-110' 
                    : ''
                }`}
                style={insignia.desbloqueado ? {
                  background: `linear-gradient(135deg, ${insignia.color}20, ${insignia.color}08)`,
                  color: insignia.color
                } : {
                  color: isDark ? '#4a4a5a' : '#c0c0c0'
                }}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Texto */}
              <div className="text-center mt-1.5">
                <p className={`text-[8px] font-semibold uppercase tracking-wide ${
                  insignia.desbloqueado 
                    ? isDark ? 'text-stone-300' : 'text-stone-700'
                    : isDark ? 'text-stone-600' : 'text-stone-400'
                }`}>
                  {insignia.titulo}
                </p>
                <p className={`text-[7px] font-light tracking-wide ${
                  insignia.desbloqueado 
                    ? isDark ? 'text-stone-500' : 'text-stone-400'
                    : isDark ? 'text-stone-700' : 'text-stone-300'
                }`}>
                  {insignia.subtitulo}
                </p>
              </div>

              {/* Indicador de desbloqueo */}
              {insignia.desbloqueado && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-3 h-3 rounded-full flex items-center justify-center bg-white dark:bg-[#1a1625]">
                    <CheckCircle2 className="w-2.5 h-2.5" style={{ color: insignia.color }} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mensaje */}
      {desbloqueadas < totalInsignias && (
        <p className={`text-[9px] text-center ${
          isDark ? 'text-stone-500' : 'text-stone-400'
        }`}>
          {totalInsignias - desbloqueadas} logro{totalInsignias - desbloqueadas > 1 ? 's' : ''} por descubrir
        </p>
      )}

      {desbloqueadas === totalInsignias && (
        <div className="text-center">
          <p className={`text-[9px] font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            ✨ ¡Colección completa! ✨
          </p>
        </div>
      )}
    </div>
  )
}