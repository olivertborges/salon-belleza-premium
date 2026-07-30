// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sparkles, Percent, Calendar, ArrowLeft, Trash2, Edit, CheckCircle2, AlertCircle, Tag, Clock, ShieldCheck, Image as ImageIcon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface Promocion {
  id: string
  title: string
  description: string
  discount_percent: number
  code: string | null
  valid_until: string
  category: 'flash' | 'welcome' | 'referral' | 'special'
  is_active: boolean
  featured: boolean
  image_url?: string | null
  created_at?: string
}

export default function DetallePromocionPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [promo, setPromo] = useState<Promocion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchPromoDetalle()
    }
  }, [id])

  const fetchPromoDetalle = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setPromo(data)
    } catch (err) {
      console.error('Error al cargar la promoción:', err)
      setError('No se pudo encontrar la promoción solicitada.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar permanentemente esta promoción?')
    if (!confirmDelete) return

    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id)

      if (error) throw error
      router.push('/admin/promociones')
    } catch (err) {
      console.error('Error al eliminar:', err)
      alert('Hubo un error al intentar eliminar la promoción.')
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'flash': return { label: '⚡ Flash', style: 'bg-red-500/10 border-red-500/30 text-red-500' }
      case 'welcome': return { label: '🎁 Welcome', style: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' }
      case 'referral': return { label: '🔗 Referral', style: 'bg-blue-500/10 border-blue-500/30 text-blue-500' }
      default: return { label: '⭐ Special', style: 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#C9A96E]' }
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center space-y-4 ${isDark ? 'bg-[#150D08]' : 'bg-[#FDFBF9]'}`}>
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
        <p className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
          Cargando detalles...
        </p>
      </div>
    )
  }

  if (error || !promo) {
    return (
      <div className={`min-h-screen max-w-3xl mx-auto px-4 py-20 text-center space-y-6 ${isDark ? 'bg-[#150D08]' : 'bg-[#FDFBF9]'}`}>
        <div className={`p-6 rounded-3xl border flex flex-col items-center justify-center gap-3 ${isDark ? 'bg-rose-950/20 border-rose-900/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm font-medium">{error || 'Promoción no encontrada.'}</p>
        </div>
        <Link 
          href="/admin/promociones" 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-neutral-950 font-black text-xs uppercase tracking-[0.15em] bg-gradient-to-r from-[#D4AF37] via-[#E8D5A0] to-[#C9A96E]"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a promociones
        </Link>
      </div>
    )
  }

  const catInfo = getCategoryBadge(promo.category)

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-16 relative overflow-hidden ${isDark ? 'bg-[#150D08]' : 'bg-[#FDFBF9]'}`}>
      
      {/* Fondos Decorativos */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#EC4899]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 relative z-10 pt-6">

        {/* BARRA SUPERIOR DE NAVEGACIÓN Y ACCIONES */}
        <div className="flex items-center justify-between">
          <Link 
            href="/admin/promociones" 
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all border ${
              isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#BCAEA5] hover:text-white' : 'bg-white border-[#EADED5] text-[#6E5A4D] hover:text-[#1A0E0A]'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver
          </Link>

          <div className="flex items-center gap-3">
            <Link 
              href={`/admin/promociones/editar/${promo.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-neutral-950 font-black text-xs uppercase tracking-[0.15em] bg-gradient-to-r from-[#D4AF37] via-[#E8D5A0] to-[#C9A96E] shadow-md hover:scale-[1.02] transition-transform"
            >
              <Edit className="w-3.5 h-3.5" /> Editar
            </Link>

            <button 
              onClick={handleDelete}
              className={`p-2 rounded-xl transition-all border ${
                isDark ? 'bg-rose-950/30 border-rose-900/50 text-rose-400 hover:bg-rose-900/40' : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
              }`}
              title="Eliminar Promoción"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TARJETA PRINCIPAL DE DETALLE */}
        <div className={`rounded-3xl border overflow-hidden transition-all duration-500 ${
          isDark 
            ? 'bg-[#1E120C] border-[#3D281E] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]' 
            : 'bg-white border-[#EADED5] shadow-[0_25px_50px_-15px_rgba(225,208,195,0.4)]'
        }`}>
          
          {/* FOTO COMPLETA DE LA PROMOCIÓN (SI EXISTE) */}
          {promo.image_url ? (
            <div className="w-full relative max-h-[420px] overflow-hidden border-b border-[#3D281E]/40 bg-neutral-950/10 flex items-center justify-center">
              <img 
                src={promo.image_url} 
                alt={promo.title} 
                className="w-full h-full object-contain max-h-[400px] transition-transform duration-700 hover:scale-[1.01]"
              />
            </div>
          ) : (
            <div className={`w-full h-32 border-b flex items-center justify-center gap-2 ${
              isDark ? 'bg-[#271810]/40 border-[#3D281E] text-[#BCAEA5]' : 'bg-[#FAF6F2] border-[#EADED5] text-[#6E5A4D]'
            }`}>
              <ImageIcon className="w-5 h-5 opacity-40" />
              <span className="text-[11px] font-black uppercase tracking-widest opacity-60">Sin imagen adjunta</span>
            </div>
          )}

          <div className="p-6 md:p-10 space-y-8">

            {/* ENCABEZADO Y TÍTULO COMPLETO SIN CORTES */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${catInfo.style}`}>
                  {catInfo.label}
                </span>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                    promo.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}>
                    {promo.is_active ? '● Activa en sistema' : '○ Inactiva'}
                  </span>
                  
                  {promo.featured && (
                    <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#C9A96E]">
                      ★ Destacada
                    </span>
                  )}
                </div>
              </div>

              {/* TÍTULO COMPLETO EXPUESTO CORRECTAMENTE */}
              <h1 className={`font-serif text-3xl md:text-5xl font-extrabold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                {promo.title}
              </h1>
            </div>

            {/* DESCUENTO Y CÓDIGO DESTACADO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
                isDark ? 'bg-[#271810]/60 border-[#3D281E]' : 'bg-[#FAF6F2] border-[#EADED5]'
              }`}>
                <div className="p-3 rounded-xl bg-gradient-to-tr from-[#D4AF37] via-[#EC4899] to-[#C9A96E] text-white shadow-md">
                  <Percent className="w-6 h-6" />
                </div>
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                    Descuento Aplicado
                  </span>
                  <p className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                    {promo.discount_percent}% OFF
                  </p>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
                isDark ? 'bg-[#271810]/60 border-[#3D281E]' : 'bg-[#FAF6F2] border-[#EADED5]'
              }`}>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#D4AF37]' : 'bg-white border-[#EADED5] text-[#D4AF37]'}`}>
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                    Código de Cupón
                  </span>
                  <p className={`text-lg font-mono font-bold tracking-wider ${isDark ? 'text-[#D4AF37]' : 'text-[#8C6D33]'}`}>
                    {promo.code ? promo.code : 'Sin código (Automático)'}
                  </p>
                </div>
              </div>
            </div>

            {/* DESCRIPCIÓN DETALLADA COMPLETA */}
            <div className="space-y-3 pt-2">
              <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-[#C9A96E]' : 'text-[#8C6D33]'}`}>
                Descripción de la Campaña
              </h3>
              <div className={`p-6 rounded-2xl border leading-relaxed text-sm font-light whitespace-pre-line ${
                isDark ? 'bg-[#150D08]/60 border-[#3D281E] text-[#D0C2B8]' : 'bg-[#FCF9F6] border-[#EADED5] text-[#4A3B32]'
              }`}>
                {promo.description || 'No se ingresó una descripción detallada para esta promoción.'}
              </div>
            </div>

            {/* METADATOS DE VALIDEZ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#3D281E]/30">
              <div className="flex items-center gap-3">
                <Calendar className={`w-4 h-4 ${isDark ? 'text-[#C9A96E]' : 'text-[#8C6D33]'}`} />
                <div>
                  <span className={`text-[10px] font-bold uppercase block ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Válido hasta</span>
                  <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                    {promo.valid_until ? new Date(promo.valid_until).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Sin fecha límite'}
                  </span>
                </div>
              </div>

              {promo.created_at && (
                <div className="flex items-center gap-3">
                  <Clock className={`w-4 h-4 ${isDark ? 'text-[#C9A96E]' : 'text-[#8C6D33]'}`} />
                  <div>
                    <span className={`text-[10px] font-bold uppercase block ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Creado el</span>
                    <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                      {new Date(promo.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
