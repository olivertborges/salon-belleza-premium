// app/(admin)/promociones/[id]/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Gift,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Users,
  Tag,
  Percent,
  Flame,
  Crown,
  Sparkles,
  Star,
  CheckCircle2,
  XCircle,
  Eye,
  Copy,
  Share2
} from 'lucide-react'

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
  uses_count: number
  uses_limit: number | null
  terms?: string
  min_purchase?: number
}

export default function DetallePromocionPage() {
  const router = useRouter()
  const params = useParams()
  const { tenantId } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color || '#DB5B9A'

  const [promo, setPromo] = useState<Promocion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

  useEffect(() => {
    if (params?.id) {
      loadPromocion(params.id as string)
    }
  }, [params])

  const loadPromocion = async (id: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setPromo(data)
    } catch (error) {
      console.error('Error cargando promoción:', error)
      setError('No se encontró la promoción')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'flash': return <Flame className="w-5 h-5" />
      case 'premium': return <Crown className="w-5 h-5" />
      case 'welcome': return <Gift className="w-5 h-5" />
      case 'seasonal': return <Sparkles className="w-5 h-5" />
      default: return <Tag className="w-5 h-5" />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'flash': return 'Flash Sale'
      case 'premium': return 'Premium'
      case 'welcome': return 'Bienvenida'
      case 'seasonal': return 'Temporada'
      default: return 'Especial'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'flash': return 'bg-red-500/20 text-red-600 border-red-500/30'
      case 'premium': return 'bg-amber-500/20 text-amber-600 border-amber-500/30'
      case 'welcome': return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
      case 'seasonal': return 'bg-purple-500/20 text-purple-600 border-purple-500/30'
      default: return 'bg-stone-500/20 text-stone-600 border-stone-500/30'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: primaryColor }} />
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse" style={{ color: primaryColor }}>
          Cargando promoción...
        </p>
      </div>
    )
  }

  if (error || !promo) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Gift className="w-16 h-16 text-stone-300" />
        <p className="text-sm text-stone-500">{error || 'Promoción no encontrada'}</p>
        <Link 
          href="/admin/promociones"
          className="px-4 py-2 rounded-xl text-white text-xs font-bold hover:scale-105 transition-all"
          style={{ backgroundColor: primaryColor }}
        >
          Volver a promociones
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1 max-w-4xl mx-auto">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl p-[1px] shadow-xl" style={brandGradient}>
        <div className="absolute inset-0 opacity-20 animate-pulse" style={brandGradient} />
        <div className="relative z-10 rounded-[23px] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0f0c1b]">
          <div className="flex items-center gap-4 min-w-0">
            <Link 
              href="/admin/promociones"
              className="p-2 rounded-xl hover:bg-pink-50 dark:hover:bg-fuchsia-950/40 transition-colors text-stone-500 hover:text-pink-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-serif font-extrabold text-stone-900 dark:text-white mt-0.5 truncate">
                {promo.title}
              </h2>
              <p className="text-xs text-stone-500 dark:text-pink-100/60 mt-0.5 truncate">
                Detalle de la promoción
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto justify-end">
            <Link 
              href={`/admin/promociones/editar/${promo.id}`}
              className="px-3 py-2 rounded-xl bg-pink-50 dark:bg-fuchsia-950/40 border border-pink-100/60 dark:border-fuchsia-900/40 hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
              style={{ color: primaryColor }}
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Editar</span>
            </Link>
            <Link 
              href={`/promociones-cliente#${promo.id}`}
              target="_blank"
              className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100/60 dark:border-blue-900/40 hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
              style={{ color: '#3B82F6' }}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver en cliente</span>
            </Link>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className={`rounded-2xl border p-6 space-y-6 ${
        isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
      }`}>

        {/* IMAGEN */}
        {promo.image_url && (
          <div className="rounded-xl overflow-hidden border border-pink-100/60 dark:border-fuchsia-950">
            <img 
              src={promo.image_url} 
              alt={promo.title} 
              className="w-full max-h-80 object-cover"
            />
          </div>
        )}

        {/* BADGES */}
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${getCategoryColor(promo.category)}`}>
            {getCategoryIcon(promo.category)}
            {getCategoryLabel(promo.category)}
          </span>
          {promo.featured && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-amber-500/20 text-amber-600 border border-amber-500/30">
              <Star className="w-3.5 h-3.5 fill-current" /> Destacada
            </span>
          )}
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${
            promo.is_active 
              ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
              : 'bg-red-500/20 text-red-600 border-red-500/30'
          }`}>
            {promo.is_active ? (
              <><CheckCircle2 className="w-3.5 h-3.5" /> Activa</>
            ) : (
              <><XCircle className="w-3.5 h-3.5" /> Inactiva</>
            )}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-stone-500/20 text-stone-600 border border-stone-500/30">
            <Tag className="w-3.5 h-3.5" /> {promo.style || 'Volante'}
          </span>
        </div>

        {/* TÍTULO Y DESCRIPCIÓN */}
        <div>
          <h3 className="text-2xl font-bold text-stone-900 dark:text-white">{promo.title}</h3>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
            {promo.description}
          </p>
        </div>

        {/* GRID DE INFORMACIÓN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Descuento */}
          <div className={`rounded-xl p-4 border ${
            isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-stone-50 border-pink-100/60'
          }`}>
            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Descuento</p>
            <p className="text-2xl font-bold text-emerald-500">{promo.discount_percent}%</p>
          </div>

          {/* Código */}
          <div className={`rounded-xl p-4 border ${
            isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-stone-50 border-pink-100/60'
          }`}>
            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Código promocional</p>
            <div className="flex items-center gap-2">
              <code className="text-lg font-mono font-bold text-stone-900 dark:text-white">
                {promo.code || 'Sin código'}
              </code>
              {promo.code && (
                <button
                  onClick={() => copyToClipboard(promo.code!)}
                  className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-stone-400" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Fecha de expiración */}
          <div className={`rounded-xl p-4 border ${
            isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-stone-50 border-pink-100/60'
          }`}>
            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Válido hasta</p>
            <p className="text-lg font-medium text-stone-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-400" />
              {promo.valid_until ? new Date(promo.valid_until).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              }) : 'Sin fecha límite'}
            </p>
          </div>

          {/* Usos */}
          <div className={`rounded-xl p-4 border ${
            isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-stone-50 border-pink-100/60'
          }`}>
            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Usos</p>
            <p className="text-lg font-medium text-stone-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-stone-400" />
              {promo.uses_count || 0}{promo.uses_limit ? ` / ${promo.uses_limit}` : ''}
            </p>
          </div>

          {/* Creación */}
          <div className={`rounded-xl p-4 border ${
            isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-stone-50 border-pink-100/60'
          }`}>
            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Creada</p>
            <p className="text-lg font-medium text-stone-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-400" />
              {new Date(promo.created_at).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>

          {/* Compra mínima */}
          {promo.min_purchase && (
            <div className={`rounded-xl p-4 border ${
              isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-stone-50 border-pink-100/60'
            }`}>
              <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Compra mínima</p>
              <p className="text-lg font-medium text-stone-900 dark:text-white">
                ${promo.min_purchase}
              </p>
            </div>
          )}
        </div>

        {/* Términos */}
        {promo.terms && (
          <div className={`rounded-xl p-4 border ${
            isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-stone-50 border-pink-100/60'
          }`}>
            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Términos y condiciones</p>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">{promo.terms}</p>
          </div>
        )}
      </div>
    </div>
  )
}