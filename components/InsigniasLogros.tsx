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
      desc: 'Tu debut en el salón',
      icon: Heart,
      desbloqueado: citas > 0,
      color: primaryColor
    },
    {
      id: 'fiel',
      titulo: 'Cliente',
      subtitulo: 'Fiel',
      desc: 'Más de 5 visitas registradas',
      icon: Crown,
      desbloqueado: citas >= 5,
      color: '#F59E0B'
    },
    {
      id: 'racha_activa',
      titulo: 'Racha',
      subtitulo: 'Fresh',
      desc: 'Mantienes tu racha activa',
      icon: Flame,
      desbloqueado: racha > 0,
      color: '#F97316'
    },
    {
      id: 'embajador',
      titulo: 'Socio',
      subtitulo: 'Embajador',
      desc: 'Invitaste amigos al ecosistema',
      icon: Sparkles,
      desbloqueado: referidos > 0,
      color: '#A855F7'
    },
    {
      id: 'coleccionista',
      titulo: 'Explorador',
      subtitulo: 'De Estilos',
      desc: 'Probaste 3 o más servicios',
      icon: Zap,
      desbloqueado: serviciosUnicos >= 3,
      color: '#06B6D4'
    }
  ]

  const totalInsignias = insignias.length
  const desbloqueadas = insignias.filter(i => i.desbloqueado).length

  return (
    <div className="space-y-4">

      {/* Encabezado estilo original */}
      <div className="flex items-center gap-4">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Award className="w-5 h-5" style={{ color: primaryColor }} />
        </div>
        <div>
          <h2 className={`text-base font-light tracking-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
            Insignias y <span className="font-serif italic font-normal" style={{ color: primaryColor }}>Reconocimientos</span>
          </h2>
          <p className={`text-[10px] uppercase tracking-[0.2em] font-medium mt-0.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            Colecciona logros con cada visita
          </p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="flex items-center justify-end gap-2">
        <div className="w-20 h-1 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
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

      {/* Grid de Insignias estilo original */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {insignias.map((insignia) => {
          const Icon = insignia.icon
          return (
            <div 
              key={insignia.id}
              className={`relative flex flex-col items-center justify-between p-4 rounded-2xl border text-center transition-all duration-300 ${
                insignia.desbloqueado 
                  ? `hover:-translate-y-1`
                  : 'opacity-40 hover:opacity-60'
              } ${
                isDark 
                  ? 'bg-[#1a1625] border-fuchsia-950/30 hover:border-fuchsia-950/60' 
                  : 'bg-white border-pink-100/60 hover:border-pink-300'
              }`}
              style={insignia.desbloqueado ? {
                boxShadow: `0 4px 12px ${insignia.color}15`
              } : {}}
            >
              {/* Icono */}
              <div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 ${
                  insignia.desbloqueado ? 'group-hover:scale-110' : ''
                }`}
                style={insignia.desbloqueado ? {
                  background: `linear-gradient(135deg, ${insignia.color}20, ${insignia.color}05)`,
                  color: insignia.color
                } : {
                  color: isDark ? '#4a4a5a' : '#c0c0c0'
                }}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Textos */}
              <div className="space-y-1 flex-1 flex flex-col justify-center">
                <p className={`text-xs font-medium tracking-tight ${
                  insignia.desbloqueado 
                    ? isDark ? 'text-stone-200' : 'text-stone-800' 
                    : isDark ? 'text-stone-600' : 'text-stone-400'
                }`}>
                  {insignia.titulo} <span className={`font-serif italic block ${
                    insignia.desbloqueado 
                      ? isDark ? 'text-stone-400' : 'text-stone-500'
                      : isDark ? 'text-stone-700' : 'text-stone-300'
                  }`}>{insignia.subtitulo}</span>
                </p>
                <p className={`text-[9px] font-light leading-tight mt-1 ${
                  isDark ? 'text-stone-500' : 'text-stone-400'
                }`}>
                  {insignia.desc}
                </p>
              </div>

              {/* Estado */}
              <div className="mt-3 pt-1 flex items-center justify-center h-4 w-full">
                {insignia.desbloqueado ? (
                  <span className={`text-[8px] font-mono font-bold tracking-widest px-2 py-0.5 rounded-full uppercase border ${
                    isDark 
                      ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' 
                      : 'text-emerald-600 bg-emerald-50 border-emerald-200'
                  }`}>
                    ✓ Logrado
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