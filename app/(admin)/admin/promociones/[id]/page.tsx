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
  Sparkles,
  Star,
  CheckCircle2,
  XCircle,
  Eye,
  Copy,
  AlertCircle
} from 'lucide-react'

// ✅ CATEGORÍAS ADAPTADAS AL DISEÑO PREMIUM Y CONTRASTE OPTIMIZADO
const categories = [
  { value: 'flash', label: '⚡ Flash', color: 'bg-red-500/10 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-500/20' },
  { value: 'welcome', label: '🎁 Welcome', color: 'bg-emerald-500/10 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { value: 'referral', label: '🔗 Referral', color: 'bg-blue-500/10 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { value: 'special', label: '⭐ Special', color: 'bg-[#D4AF37]/10 text-[#C9A96E] border-[#D4AF37]/30' }
]

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
  const { theme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'
  
  const primaryColor = settings?.primary_color || '#D4AF37'
  const secondaryColor = settings?.secondary_color || '#EC4899'

  const [promo, setPromo] = useState<Promocion | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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

  // ✅ ACCIÓN DE ELIMINACIÓN ASÍNCRONA CON SUPABASE
  const handleDelete = async () => {
    if (!promo) return
    
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar esta promoción de forma permanente? Esta acción no se puede deshacer.')
    if (!confirmDelete) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', promo.id)

      if (error) throw error
      
      router.push('/admin/promociones')
    } catch (err) {
      console.error('Error al eliminar promoción:', err)
      alert('Hubo un error al intentar eliminar la promoción. Inténtalo de nuevo.')
      setDeleting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getCategoryInfo = (category: string) => {
    const found = categories.find(c => c.value === category)
    return found || categories[3]
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'flash': return <Flame className="w-3.5 h-3.5" />
      case 'welcome': return <Gift className="w-3.5 h-3.5" />
      case 'referral': return <Users className="w-3.5 h-3.5" />
      default: return <Star className="w-3.5 h-3.5" />
    }
  }

  const getStyleLabel = (style: string) => {
    const found = styles.find(s => s.value === style)
    return found?.label || style
  }

  // ============================================================ 
  // ESTADO DE CARGA O ELIMINACIÓN
  // ============================================================ 
  if (loading || deleting) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#150D08]' : 'bg-[#FDFBF9]'}`}>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[100px] pointer-events-none" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-[#D4AF37]/20 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
            <Gift className="w-6 h-6 text-[#D4AF37] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-xs font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#EC4899] to-[#C9A96E] animate-pulse">
              {deleting ? 'ELIMINANDO PROMOCIÓN' : 'CARGANDO DETALLES'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================ 
  // ESTADO ERROR
  // ============================================================ 
  if (error || !promo) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[70vh] space-y-5 ${isDark ? 'bg-[#150D08] text-[#FFF9F6]' : 'bg-[#FDFBF9] text-[#1A0E0A]'}`}>
        <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center shadow-lg ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'}`}>
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <p className={`text-sm font-light ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>{error || 'Promoción no encontrada'}</p>
        <Link 
          href="/admin/promociones"
          className="px-6 py-3 rounded-xl text-neutral-950 font-black text-xs uppercase tracking-[0.15em] transition-all duration-300 shadow-xl bg-gradient-to-r from-[#D4AF37] via-[#E8D5A0] to-[#C9A96E] hover:scale-[1.02]"
        >
          Volver a promociones
        </Link>
      </div>
    )
  }

  const categoryInfo = getCategoryInfo(promo.category)

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-12 relative overflow-hidden ${isDark ? 'bg-[#150D08] text-[#FFF9F6]' : 'bg-[#FDFBF9] text-[#1A0E0A]'}`}>
      
      {/* Fondos Decorativos Orgánicos */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#EC4899]/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 space-y-6 relative z-10 pt-4">

        {/* ============================================================ */}
        {/* CABECERA PRINCIPAL */}
        {/* ============================================================ */}
        <div className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ${
          isDark 
            ? 'bg-gradient-to-br from-[#271810] via-[#1E120C] to-[#160E09] border-[#3D281E] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]' 
            : 'bg-gradient-to-br from-white via-[#FBF7F4] to-[#F5ECE5] border-[#EADED5] shadow-[0_25px_50px_-15px_rgba(225,208,195,0.4)]'
        }`}>
          <div className="absolute -top-40 -right-40 w-[300px] h-[300px] bg-gradient-to-br from-[#EC4899]/10 to-[#D4AF37]/10 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

          <div className="relative z-10 p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Link 
                href="/admin/promociones"
                className={`p-3 rounded-xl border transition-all duration-300 ${
                  isDark ? 'bg-[#291A11] border-[#3D281E] text-[#BCAEA5] hover:text-white' : 'bg-[#FAF6F2] border-[#EADED5] text-[#6E5A4D] hover:text-[#1A0E0A]'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[9px] font-black uppercase tracking-[0.25em] text-[#C9A96E]">
                  <Sparkles className="w-2.5 h-2.5" />
                  ✦ Vista Detallada
                </div>
                <h1 className={`font-serif text-2xl md:text-3xl font-extrabold tracking-tight truncate max-w-[180px] md:max-w-[320px] ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                  {promo.title}
                </h1>
              </div>
            </div>

            {/* BOTONERA ACCIONES DE CABECERA CON ELIMINAR INCLUIDO */}
            <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
              {/* 🗑️ BOTÓN ELIMINAR INTEGRADO */}
              <button 
                onClick={handleDelete}
                className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 transition-all duration-300 active:scale-95 shadow-md flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.15em]"
                title="Eliminar Promoción"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden md:inline">Eliminar</span>
              </button>

              <Link 
                href={`/admin/promociones/editar/${promo.id}`}
                className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] ${
                  isDark 
                    ? 'bg-[#291A11] border-[#3D281E] text-[#BCAEA5] hover:text-white hover:border-[#D4AF37]/50' 
                    : 'bg-white border-[#EADED5] text-[#6E5A4D] hover:text-[#1A0E0A] hover:border-[#D4AF37]/50'
                }`}
                title="Editar Promoción"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden md:inline">Editar</span>
              </Link>
              
              <Link 
                href={`/promociones-cliente#${promo.id}`}
                target="_blank"
                className="p-3 rounded-xl text-neutral-950 font-black text-[10px] uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 shadow-md bg-gradient-to-r from-[#D4AF37] via-[#E8D5A0] to-[#C9A96E] hover:scale-[1.03]"
                title="Ver en cliente"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden md:inline">Previsualizar</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CONTENIDO PRINCIPAL */}
        {/* ============================================================ */}
        <div className={`rounded-3xl border p-6 md:p-8 space-y-8 shadow-xl transition-all duration-500 ${
          isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'
        }`}>

          {/* IMAGEN DE LA PROMOCIÓN */}
          {promo.image_url && (
            <div className={`rounded-2xl overflow-hidden border p-2 ${isDark ? 'bg-[#150D08] border-[#3D281E]' : 'bg-[#FAF6F2] border-[#EADED5]'}`}>
              <img 
                src={promo.image_url} 
                alt={promo.title} 
                className="w-full max-h-72 object-cover rounded-xl"
              />
            </div>
          )}

          {/* BADGES PREMIUM */}
          <div className="flex flex-wrap gap-2.5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${categoryInfo.color}`}>
              {getCategoryIcon(promo.category)}
              {categoryInfo.label}
            </span>
            {promo.featured && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-current" /> Destacada
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
              promo.is_active 
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-red-500/10 text-red-600 border-red-500/20'
            }`}>
              {promo.is_active ? (
                <><CheckCircle2 className="w-3.5 h-3.5" /> Activa</>
              ) : (
                <><XCircle className="w-3.5 h-3.5" /> Inactiva</>
              )}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
              isDark ? 'bg-[#291A11] border-[#3D281E] text-[#BCAEA5]' : 'bg-[#FAF6F2] border-[#EADED5] text-[#6E5A4D]'
            }`}>
              <Tag className="w-3.5 h-3.5" /> {getStyleLabel(promo.style)}
            </span>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="space-y-2">
            <h3 className={`font-serif text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
              Descripción General
            </h3>
            <p className={`text-sm font-light leading-relaxed ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
              {promo.description || 'Esta promoción no cuenta con una descripción detallada en este momento.'}
            </p>
          </div>

          {/* GRID DE INFORMACIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            {/* Descuento */}
            <div className="rounded-2xl p-4 shadow-xl border border-white/10 bg-gradient-to-tr from-[#D4AF37] via-[#EC4899] to-[#C9A96E] text-white flex flex-col justify-between min-h-[105px]">
              <p className="text-[9px] text-white/80 font-black uppercase tracking-widest">Valor del Descuento</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-3xl font-serif font-black tracking-tight text-white">{promo.discount_percent}%</span>
                <Percent className="w-6 h-6 text-white/40 stroke-[2.5]" />
              </div>
            </div>

            {/* Código */}
            <div className={`rounded-2xl p-4 border flex flex-col justify-between min-h-[105px] transition-all duration-300 ${
              isDark ? 'bg-[#150D08] border-[#3D281E]' : 'bg-[#FAF8F5] border-[#EADED5]'
            }`}>
              <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>Código Promocional</p>
              <div className="flex items-center justify-between mt-2 gap-2">
                <code className={`text-base font-mono font-bold tracking-wider ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  {promo.code || 'SIN CÓDIGO'}
                </code>
                {promo.code && (
                  <button
                    onClick={() => copyToClipboard(promo.code!)}
                    className={`p-2 rounded-xl transition-all border ${
                      isDark ? 'bg-[#291A11] border-[#3D281E] hover:bg-[#3D281E] text-[#C9A96E]' : 'bg-white border-[#EADED5] hover:bg-[#FAF6F2] text-[#C9A96E]'
                    }`}
                  >
                    {copied ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Fecha de expiración */}
            <div className={`rounded-2xl p-4 border flex flex-col justify-between min-h-[105px] ${
              isDark ? 'bg-[#150D08] border-[#3D281E]' : 'bg-[#FAF8F5] border-[#EADED5]'
            }`}>
              <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>Válido Hasta</p>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs font-semibold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  {promo.valid_until ? new Date(promo.valid_until).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }) : 'Sin límite'}
                </span>
                <Calendar className="w-4 h-4 text-[#C9A96E]" />
              </div>
            </div>

            {/* Usos */}
            <div className={`rounded-2xl p-4 border flex flex-col justify-between min-h-[105px] ${
              isDark ? 'bg-[#150D08] border-[#3D281E]' : 'bg-[#FAF8F5] border-[#EADED5]'
            }`}>
              <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>Redenciones / Límite</p>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-sm font-bold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  {promo.uses_count || 0} <span className="font-light text-xs opacity-60">/ {promo.uses_limit ? promo.uses_limit : '∞'}</span>
                </span>
                <Users className="w-4 h-4 text-[#C9A96E]" />
              </div>
            </div>

            {/* Creación */}
            <div className={`rounded-2xl p-4 border flex flex-col justify-between min-h-[105px] ${
              isDark ? 'bg-[#150D08] border-[#3D281E]' : 'bg-[#FAF8F5] border-[#EADED5]'
            }`}>
              <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>Fecha de Registro</p>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs font-medium ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  {new Date(promo.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
                <Clock className="w-4 h-4 text-[#C9A96E]" />
              </div>
            </div>

            {/* Estilo Visual */}
            <div className={`rounded-2xl p-4 border flex flex-col justify-between min-h-[105px] ${
              isDark ? 'bg-[#150D08] border-[#3D281E]' : 'bg-[#FAF8F5] border-[#EADED5]'
            }`}>
              <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>Formato Visual</p>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  {getStyleLabel(promo.style)}
                </span>
                <Tag className="w-4 h-4 text-[#C9A96E]" />
              </div>
            </div>
          </div>

          {/* Términos y Condiciones */}
          {promo.terms && (
            <div className={`rounded-2xl p-5 border-t border-dashed space-y-2 ${
              isDark ? 'border-[#3D281E]/60 bg-[#150D08]/40' : 'border-[#EADED5]/60 bg-[#FAF8F5]/40'
            }`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>Términos & Condiciones</p>
              <p className={`text-xs font-light leading-relaxed whitespace-pre-line ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>{promo.terms}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
