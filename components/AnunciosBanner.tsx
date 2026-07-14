'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { 
  Megaphone, 
  Sparkles, 
  ArrowRight, 
  X, 
  Clock,
  Star,
  Gift
} from 'lucide-react'
import Link from 'next/link'

interface Anuncio {
  id: string
  tenant_id: string
  title: string
  subtitle: string | null
  description: string | null
  image_url: string | null
  link_url: string | null
  link_text: string | null
  type: 'banner' | 'popup' | 'floating'
  position: 'top' | 'bottom' | 'hero'
  style: 'premium' | 'minimal' | 'colorful'
  background_color: string | null
  accent_color: string | null
  is_active: boolean
  priority: number
  valid_from: string
  valid_until: string
  created_at: string
}

interface AnunciosBannerProps {
  position?: 'top' | 'bottom' | 'hero'
  limit?: number
  className?: string
}

export default function AnunciosBanner({ 
  position = 'hero', 
  limit = 3,
  className = ''
}: AnunciosBannerProps) {
  const { theme } = useTheme()
  const { tenantId } = useAuth()
  const isDark = theme === 'dark'
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadAnuncios()
  }, [position, tenantId])

  const loadAnuncios = async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .eq('position', position)
        .gte('valid_until', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit || 3)

      if (error) throw error
      setAnuncios(data || [])
    } catch (error) {
      console.error('Error cargando anuncios:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissAnuncio = (id: string) => {
    setDismissed(prev => new Set([...prev, id]))
  }

  if (loading || anuncios.length === 0) return null

  return (
    <div className={`space-y-3 ${className}`}>
      {anuncios.map((anuncio) => {
        if (dismissed.has(anuncio.id)) return null

        const isPremium = anuncio.style === 'premium'
        const isMinimal = anuncio.style === 'minimal'
        const isColorful = anuncio.style === 'colorful'

        return (
          <div
            key={anuncio.id}
            className={`relative rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-xl ${
              isPremium 
                ? 'bg-gradient-to-r from-stone-900 via-purple-900/80 to-pink-900/80 border border-white/10' 
                : isColorful
                ? 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 border border-pink-500/20'
                : isDark
                ? 'bg-stone-800/50 border-stone-700'
                : 'bg-white border-pink-100'
            }`}
            style={{
              background: anuncio.background_color 
                ? `linear-gradient(135deg, ${anuncio.background_color}, ${anuncio.accent_color || anuncio.background_color}dd)`
                : undefined
            }}
          >
            <button
              onClick={() => dismissAnuncio(anuncio.id)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-4 h-4 opacity-60 hover:opacity-100" />
            </button>

            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {anuncio.image_url ? (
                <img 
                  src={anuncio.image_url} 
                  alt={anuncio.title} 
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isPremium ? 'bg-white/10' : isColorful ? 'bg-pink-500/20' : 'bg-pink-100 dark:bg-pink-900/20'
                }`}>
                  {isPremium ? (
                    <Star className="w-6 h-6 text-amber-400" />
                  ) : isColorful ? (
                    <Sparkles className="w-6 h-6 text-purple-500" />
                  ) : (
                    <Megaphone className="w-6 h-6 text-pink-500" />
                  )}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-black tracking-tight ${
                    isPremium ? 'text-white' : isColorful ? 'text-purple-900 dark:text-purple-300' : ''
                  }`}>
                    {anuncio.title}
                  </h3>
                  {anuncio.type === 'popup' && (
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-500 border border-pink-500/20">
                      Nueva
                    </span>
                  )}
                </div>
                {anuncio.subtitle && (
                  <p className={`text-xs font-medium ${
                    isPremium ? 'text-white/60' : isColorful ? 'text-purple-700 dark:text-purple-400' : 'text-stone-500 dark:text-stone-400'
                  }`}>
                    {anuncio.subtitle}
                  </p>
                )}
                {anuncio.description && (
                  <p className={`text-xs font-light mt-0.5 ${
                    isPremium ? 'text-white/40' : isColorful ? 'text-purple-600 dark:text-purple-400/70' : 'text-stone-400'
                  }`}>
                    {anuncio.description}
                  </p>
                )}
              </div>

              {anuncio.link_url && (
                <Link
                  href={anuncio.link_url}
                  className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                    isPremium 
                      ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20' 
                      : isColorful
                      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/25'
                      : isDark
                      ? 'bg-stone-700 hover:bg-stone-600 text-stone-200'
                      : 'bg-stone-900 hover:bg-stone-800 text-white'
                  }`}
                >
                  {anuncio.link_text || 'Ver más'} <ArrowRight className="w-3 h-3 inline ml-1" />
                </Link>
              )}
            </div>

            <div className="h-0.5 w-full bg-white/5 relative">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                style={{ 
                  width: `${Math.max(0, ((new Date(anuncio.valid_until).getTime() - Date.now()) / (new Date(anuncio.valid_until).getTime() - new Date(anuncio.valid_from).getTime())) * 100)}%` 
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}