'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import { 
  Sparkles, 
  Gift, 
  Clock, 
  Tag, 
  ChevronRight, 
  Percent, 
  Crown,
  Flame,
  Eye,
  Share2,
  X
} from 'lucide-react'
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
  category: 'flash' | 'premium' | 'seasonal' | 'welcome' | 'referral'
  style: 'volante' | 'tarjeta' | 'flyer'
  is_active: boolean
  featured: boolean
  created_at: string
  terms?: string
  min_purchase?: number
  uses_limit?: number
  uses_count?: number
  background_color?: string
  accent_color?: string
}

interface PromocionesVolanteProps {
  limit?: number
  showTitle?: boolean
  className?: string
}

export default function PromocionesVolante({ 
  limit = 6, 
  showTitle = true,
  className = ''
}: PromocionesVolanteProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [promociones, setPromociones] = useState<Promocion[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    loadPromociones()
  }, [])

  const loadPromociones = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit || 6)

      if (error) throw error
      setPromociones(data || [])
    } catch (error) {
      console.error('Error cargando promociones:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (loading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={`rounded-2xl p-6 animate-pulse ${isDark ? 'bg-stone-800/50' : 'bg-pink-50/50'}`}>
            <div className="h-32 rounded-xl bg-pink-200/30 dark:bg-pink-900/20 mb-3" />
            <div className="h-4 bg-pink-200/30 dark:bg-pink-900/20 rounded w-3/4 mb-2" />
            <div className="h-3 bg-pink-200/30 dark:bg-pink-900/20 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (promociones.length === 0) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              Ofertas <span className="font-serif italic font-normal text-pink-500">Exclusivas</span>
            </h2>
            <p className="text-xs text-stone-400 font-medium mt-0.5">Promociones especiales para ti</p>
          </div>
          <Link href="/promociones" className="text-xs font-bold text-pink-500 hover:text-pink-600 flex items-center gap-1 transition-colors">
            Ver todas <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {promociones.map((promo) => {
          const isHovered = hoveredId === promo.id
          const isFlash = promo.category === 'flash'
          const isPremium = promo.category === 'premium'

          return (
            <div
              key={promo.id}
              onMouseEnter={() => setHoveredId(promo.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`group relative rounded-3xl overflow-hidden transition-all duration-500 ${
                isHovered ? 'scale-[1.02] shadow-2xl' : 'shadow-md hover:shadow-xl'
              } ${isDark ? 'border-stone-800' : 'border-pink-100'}`}
              style={{
                background: promo.background_color 
                  ? `linear-gradient(135deg, ${promo.background_color}, ${promo.accent_color || promo.background_color}dd)`
                  : isFlash 
                    ? 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)'
                    : isPremium
                    ? 'linear-gradient(135deg, #1a1a2e, #2d1b69, #1a1a2e)'
                    : 'linear-gradient(135deg, #1a1a2e, #2d1b69, #0f3460)'
              }}
            >
              {/* Efectos de luz */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none" />
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-500/10 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl animate-pulse delay-1000" />
              
              <div className="relative p-6 space-y-4 z-10">
                {/* Badge de categoría */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-2 flex-wrap">
                    {isFlash && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[8px] font-black uppercase tracking-widest">
                        <Flame className="w-3 h-3" /> Flash Sale
                      </span>
                    )}
                    {isPremium && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] font-black uppercase tracking-widest">
                        <Crown className="w-3 h-3" /> Premium
                      </span>
                    )}
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-white/10 hover:bg-white/20">
                    <Share2 className="w-3.5 h-3.5 text-white/60" />
                  </button>
                </div>

                {/* Imagen o ícono */}
                {promo.image_url ? (
                  <div className="rounded-xl overflow-hidden h-32 -mx-2">
                    <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`rounded-xl h-32 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-white/10'}`}>
                    <Percent className="w-12 h-12 text-white/20" />
                  </div>
                )}

                {/* Contenido */}
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight line-clamp-1">
                    {promo.title}
                  </h3>
                  <p className="text-sm text-white/70 font-light line-clamp-2 mt-0.5">
                    {promo.description}
                  </p>
                </div>

                {/* Descuento y código */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    {promo.discount_percent > 0 && (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">{promo.discount_percent}%</span>
                        <span className="text-xs text-white/50 font-medium">OFF</span>
                      </div>
                    )}
                    {promo.min_purchase && (
                      <p className="text-[8px] text-white/40 font-medium uppercase tracking-widest">
                        Compra mín. ${promo.min_purchase}
                      </p>
                    )}
                  </div>

                  {promo.code && (
                    <button
                      onClick={() => copyCode(promo.code!)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                        copiedCode === promo.code
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
                      }`}
                    >
                      {copiedCode === promo.code ? '✓ Copiado' : promo.code}
                    </button>
                  )}
                </div>

                {/* Válido hasta */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1.5 text-[9px] text-white/40 font-medium">
                    <Clock className="w-3 h-3" />
                    Válido hasta {new Date(promo.valid_until).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                  {promo.uses_limit && (
                    <div className="flex items-center gap-1 text-[9px] text-white/40 font-medium">
                      <Eye className="w-3 h-3" />
                      {promo.uses_count || 0}/{promo.uses_limit}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}