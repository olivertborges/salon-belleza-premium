'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Gift, Sparkles, Clock, ChevronRight, Percent, Star, Flame, Crown } from 'lucide-react'
import Link from 'next/link'

interface Promocion {
  id: string
  tenant_id: string
  title: string
  description: string
  image_url: string | null
  discount_percent: number
  discount_amount: number | null
  code: string | null
  valid_until: string
  category: string
  style: string
  is_active: boolean
  featured: boolean
  created_at: string
  background_color?: string
  accent_color?: string
}

interface PromocionesVolanteProps {
  limit?: number
  showTitle?: boolean
  className?: string
}

export default function PromocionesVolante({ 
  limit = 3, 
  showTitle = false,
  className = ''
}: PromocionesVolanteProps) {
  const { tenantId } = useAuth()
  const { theme } = useTheme()
  const [promociones, setPromociones] = useState<Promocion[]>([])
  const [loading, setLoading] = useState(true)

  const isDark = theme === 'dark'

  useEffect(() => {
    async function cargarPromociones() {
      if (!tenantId) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('promotions')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .gte('valid_until', new Date().toISOString())
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) throw error
        setPromociones(data || [])
      } catch (error) {
        console.error('Error cargando promociones:', error)
      } finally {
        setLoading(false)
      }
    }

    cargarPromociones()
  }, [tenantId, limit])

  if (loading || promociones.length === 0) return null

  return (
    <div className={`rounded-2xl border p-4 transition-all hover:shadow-md ${
      isDark 
        ? 'bg-gradient-to-r from-pink-950/20 via-stone-900/50 to-amber-950/10 border-pink-950/30' 
        : 'bg-gradient-to-r from-pink-50/50 via-amber-50/30 to-white border-pink-100/60'
    } ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className={`w-4 h-4 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              isDark ? 'text-pink-400' : 'text-pink-600'
            }`}>
              Promociones Especiales
            </span>
          </div>
          <Link 
            href="/promociones"
            className={`text-[9px] font-medium flex items-center gap-1 transition-colors ${
              isDark ? 'text-stone-400 hover:text-pink-400' : 'text-stone-500 hover:text-pink-600'
            }`}
          >
            Ver todas <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {promociones.map((promo) => {
          const isFlash = promo.category === 'flash'
          const isPremium = promo.category === 'premium'

          return (
            <Link
              key={promo.id}
              href={`/promociones#${promo.id}`}
              className={`group p-3 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                isDark 
                  ? 'bg-stone-900/50 border-stone-800 hover:border-pink-500/30' 
                  : 'bg-white border-pink-100/60 hover:border-pink-300'
              }`}
              style={promo.background_color ? {
                borderColor: isDark ? `${promo.background_color}40` : promo.background_color
              } : {}}
            >
              <div className="flex items-start gap-3">
                {promo.image_url ? (
                  <img 
                    src={promo.image_url} 
                    alt={promo.title}
                    className="w-12 h-12 rounded-lg object-cover border border-stone-200 dark:border-stone-700 flex-shrink-0"
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isDark ? 'bg-stone-800' : 'bg-pink-50'
                  }`}>
                    {isFlash ? (
                      <Flame className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                    ) : isPremium ? (
                      <Crown className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                    ) : (
                      <Percent className={`w-5 h-5 ${isDark ? 'text-pink-400' : 'text-pink-500'}`} />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold tracking-tight truncate text-stone-900 dark:text-white">
                      {promo.title}
                    </h4>
                    {promo.discount_percent > 0 && (
                      <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                        -{promo.discount_percent}%
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                    {promo.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {promo.code && (
                      <span className="text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                        {promo.code}
                      </span>
                    )}
                    {promo.featured && (
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                    )}
                    {isFlash && (
                      <span className="text-[7px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                        Flash
                      </span>
                    )}
                    {promo.valid_until && (
                      <span className="text-[8px] text-stone-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(promo.valid_until).toLocaleDateString('es-ES', { 
                          day: '2-digit', 
                          month: 'short' 
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}