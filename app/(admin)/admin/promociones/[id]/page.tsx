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
  Share2,
  AlertCircle
} from 'lucide-react'

// ✅ CATEGORÍAS SIMPLIFICADAS
const categories = [
  { value: 'flash', label: '⚡ Flash', color: 'bg-red-500/20 text-red-600 border-red-500/30' },
  { value: 'welcome', label: '🎁 Welcome', color: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' },
  { value: 'referral', label: '🔗 Referral', color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
  { value: 'special', label: '⭐ Special', color: 'bg-purple-500/20 text-purple-600 border-purple-500/30' }
]

// ✅ STYLES
const styles = [
  { value: 'volante', label: '📄 Volante' },
  { value: 'tarjeta', label: '💳 Tarjeta' },
  { value: 'flyer', label: '📋 Flyer' }
]

interface Promocion {
  id: string
  tenant_id: string
  title: string
  description: string
  image_url: string | null
  discount_percent: number
  code: string | null
  valid_until: string
  category: 'flash' | 'welcome' | 'referral' | 'special'
  style: 'volante' | 'tarjeta' | 'flyer'
  is_active: boolean
  featured: boolean
  created_at: string
  uses_count: number
  uses_limit: number | null
  terms?: string
}

export default function DetallePromocionPage() {
  const router = useRouter()
  const params = useParams()
  const { tenantId } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'

  const [promo, setPromo] = useState<Promocion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
  }

  const primaryBgStyle = { backgroundColor: primaryColor }

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

  const getCategoryInfo = (category: string) => {
    const found = categories.find(c => c.value === category)
    return found || categories[3] // special por defecto
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'flash': return <Flame className="w-4 h-4" />
      case 'welcome': return <Gift className="w-4 h-4" />
      case 'referral': return <Users className="w-4 h-4" />
      default: return <Star className="w-4 h-4" />
    }
  }

  const getStyleLabel = (style: string) => {
    const found = styles.find(s => s.value === style)
    return found?.label || style
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute w-48 h-48 bg-amber-500/5 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite] delay-300" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
            <Gift className="w-6 h-6 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-sm font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 animate-pulse">
              CARGANDO
            </p>
            <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              DETALLE PROMOCIÓN
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span 
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-pink-500/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !promo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <div className="w-16 h-16 rounded-2xl border flex items-center justify-center bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400">{error || 'Promoción no encontrada'}</p>
        <Link 
          href="/admin/promociones"
          className="px-6 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-md"
          style={primaryBgStyle}
        >
          Volver a promociones
        </Link>
      </div>
    )
  }

  const categoryInfo = getCategoryInfo(promo.category)

  return (
    <div className="space-y-6 p-1 max-w-4xl mx-auto">

      {/* ============================================================ */}
      {/* CABECERA PRINCIPAL — IDÉNTICA AL DASHBOARD */}
      {/* ============================================================ */}
      <div 
        className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl text-white border border-white/10"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, #EF4444 100%)`
        }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-black/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-pink-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Detalle de Promoción
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/admin/promociones"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight drop-shadow-sm truncate max-w-[200px] md:max-w-[400px]">
                {promo.title}
              </h1>
            </div>
            <p className="text-xs md:text-sm text-pink-50/80 font-medium max-w-md">
              Detalle de la promoción especial.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <Link 
              href={`/admin/promociones/editar/${promo.id}`}
              className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95 shadow-lg"
              title="Editar Promoción"
            >
              <Edit className="w-5 h-5" />
            </Link>
            <Link 
              href={`/promociones-cliente#${promo.id}`}
              target="_blank"
              className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95 shadow-lg"
              title="Ver en cliente"
            >
              <Eye className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CONTENIDO */}
      {/* ============================================================ */}
      <div className={`rounded-2xl border p-6 space-y-6 shadow-sm ${
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
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${categoryInfo.color}`}>
            {getCategoryIcon(promo.category)}
            {categoryInfo.label}
          </span>
          {promo.featured && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-600 border border-amber-500/30">
              <Star className="w-3.5 h-3.5 fill-current" /> Destacada
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-stone-500/20 text-stone-600 border border-stone-500/30">
            <Tag className="w-3.5 h-3.5" /> {getStyleLabel(promo.style)}
          </span>
        </div>

        {/* TÍTULO Y DESCRIPCIÓN */}
        <div>
          <h3 className="text-2xl font-bold text-stone-900 dark:text-white">{promo.title}</h3>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
            {promo.description || 'Sin descripción'}
          </p>
        </div>

        {/* GRID DE INFORMACIÓN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <p className="text-base font-medium text-stone-900 dark:text-white flex items-center gap-2">
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
            <p className="text-base font-medium text-stone-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-stone-400" />
              {promo.uses_count || 0}{promo.uses_limit ? ` / ${promo.uses_limit}` : ''}
            </p>
          </div>

          {/* Creación */}
          <div className={`rounded-xl p-4 border ${
            isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-stone-50 border-pink-100/60'
          }`}>
            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Creada</p>
            <p className="text-base font-medium text-stone-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-400" />
              {new Date(promo.created_at).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>

          {/* Estilo */}
          <div className={`rounded-xl p-4 border ${
            isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-stone-50 border-pink-100/60'
          }`}>
            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Estilo</p>
            <p className="text-base font-medium text-stone-900 dark:text-white">
              {getStyleLabel(promo.style)}
            </p>
          </div>
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

      {/* ============================================================ */}
      {/* STYLES GLOBALES */}
      {/* ============================================================ */}
      <style jsx global>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>

    </div>
  )
}