'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Gift, Sparkles, Clock, ChevronRight, Percent } from 'lucide-react'
import Link from 'next/link'

interface Promocion {
  id: string
  title: string
  description: string
  image_url: string | null
  discount_percent: number
  code: string | null
  valid_until: string
  category: string
  featured: boolean
}

interface PromocionesVolanteProps {
  limit?: number
  showTitle?: boolean
}

export default function PromocionesVolante({ 
  limit = 3, 
  showTitle = false 
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
    }`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className={`w-4 h-4 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              isDark ? 'text-pink-400' : 'text-pink-600'
            }`}>
              Ofertas Especiales
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
        {promociones.map((promo) => (
          <Link
            key={promo.id}
            href={`/promociones#${promo.id}`}
            className={`group p-3 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-lg ${
              isDark 
                ? 'bg-stone-900/50 border-stone-800 hover:border-pink-500/30' 
                : 'bg-white border-pink-100/60 hover:border-pink-300'
            }`}
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
                  <Percent className={`w-5 h-5 ${isDark ? 'text-pink-400' : 'text-pink-500'}`} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold tracking-tight truncate text-stone-900 dark:text-white">
                  {promo.title}
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">
                  {promo.description}
                </p>
                {promo.discount_percent > 0 && (
                  <span className="inline-block mt-1 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    -{promo.discount_percent}%
                  </span>
                )}
                {promo.valid_until && (
                  <span className="ml-2 text-[8px] text-stone-400">
                    {new Date(promo.valid_until).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}