// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, Percent, Calendar, ArrowRight, CheckCircle2, PlusCircle, Settings, Trash2, Eye, Flame, Gift, Users, Star, AlertCircle } from 'lucide-react'
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
}

export default function PromocionesPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [promociones, setPromociones] = useState<Promocion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar promociones desde Supabase al montar el componente
  useEffect(() => {
    fetchPromociones()
  }, [])

  const fetchPromociones = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPromociones(data || [])
    } catch (err) {
      console.error('Error al cargar promociones:', err)
      setError('No se pudieron cargar las promociones desde la base de datos.')
    } finally {
      setLoading(false)
    }
  }

  // Función directa para eliminar desde la lista si se requiere
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault() // Evita que se abra el detalle al hacer click en eliminar
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar esta promoción?')
    if (!confirmDelete) return

    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Actualizar estado localmente
      setPromociones(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error('Error al eliminar:', err)
      alert('Hubo un error al eliminar la promoción')
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

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-12 relative overflow-hidden ${isDark ? 'bg-[#150D08]' : 'bg-[#FDFBF9]'}`}>
      
      {/* Fondos Decorativos Orgánicos */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#EC4899]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none z-0 opacity-15 mix-blend-overlay bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 relative z-10 pt-4">

        {/* HEADER HERO BANNER */}
        <div className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ${
          isDark 
            ? 'bg-gradient-to-br from-[#271810] via-[#1E120C] to-[#160E09] border-[#3D281E] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]' 
            : 'bg-gradient-to-br from-white via-[#FBF7F4] to-[#F5ECE5] border-[#EADED5] shadow-[0_25px_50px_-15px_rgba(225,208,195,0.4)]'
        }`}>
          <div className="absolute -top-40 -right-40 w-[350px] h-[350px] bg-gradient-to-br from-[#EC4899]/20 to-[#D4AF37]/20 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

          <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37] via-[#EC4899] to-[#3B82F6] rounded-2xl blur-md opacity-70" />
                <div className="relative p-4 rounded-2xl shadow-xl bg-neutral-950 text-white flex items-center justify-center border border-white/10">
                  <Percent className="w-7 h-7 text-[#D4AF37]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[9px] font-black uppercase tracking-[0.25em] text-[#C9A96E]">
                  <Sparkles className="w-2.5 h-2.5" />
                  ✦ Base de Datos Activa
                </div>
                <h2 className={`font-serif text-3xl md:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                  Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#EC4899] to-[#C9A96E] font-serif italic font-normal">Promociones</span>
                </h2>
                <p className={`text-sm font-light ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                  Campañas comerciales sincronizadas directamente con Supabase.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 border-t pt-5 md:pt-0 md:border-t-0 border-[#EADED5] dark:border-[#3D281E]">
              <Link 
                href="/admin/promociones/crear" 
                className="w-full sm:w-auto px-5 py-3 rounded-xl text-neutral-950 font-black text-xs uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl shadow-[#D4AF37]/10 hover:shadow-[#D4AF37]/20 hover:scale-[1.03] active:scale-95 bg-gradient-to-r from-[#D4AF37] via-[#E8D5A0] to-[#C9A96E]"
              >
                <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Nueva Promoción</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ESTADO DE CARGA */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
            <p className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
              Consultando promociones...
            </p>
          </div>
        ) : error ? (
          <div className={`p-6 rounded-2xl border flex items-center gap-3 ${isDark ? 'bg-rose-950/20 border-rose-900/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-medium">{error}</p>
          </div>
        ) : promociones.length === 0 ? (
          /* ESTADO VACÍO */
          <div className={`text-center py-16 px-6 rounded-3xl border border-dashed space-y-4 ${
            isDark ? 'bg-[#1E120C]/40 border-[#3D281E]' : 'bg-white/60 border-[#EADED5]'
          }`}>
            <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center border ${isDark ? 'bg-[#291A11] border-[#3D281E] text-[#C9A96E]' : 'bg-[#FAF6F2] border-[#EADED5] text-[#C9A96E]'}`}>
              <Gift className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className={`font-serif text-lg font-bold ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>No hay promociones registradas</h3>
              <p className={`text-xs font-light max-w-sm mx-auto ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                Crea tu primera promoción para empezar a recompensar a tus clientes fieles.
              </p>
            </div>
            <Link 
              href="/admin/promociones/crear" 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-neutral-950 font-black text-[10px] uppercase tracking-[0.15em] bg-gradient-to-r from-[#D4AF37] via-[#E8D5A0] to-[#C9A96E] shadow-md"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Crear primera promoción
            </Link>
          </div>
        ) : (
          /* GRILLA DINÁMICA DESDE SUPABASE */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promociones.map((promo) => {
              const catInfo = getCategoryBadge(promo.category)
              return (
                <div 
                  key={promo.id}
                  className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-500 hover:shadow-2xl ${
                    isDark 
                      ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#D4AF37]/50 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.6)]' 
                      : 'bg-white border-[#EADED5] hover:border-[#D4AF37]/50 shadow-[0_15px_40px_-20px_rgba(225,208,195,0.5)]'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#D4AF37]/10 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110" />
                  
                  <div className="flex flex-col h-full justify-between space-y-4">
                    
                    <Link href={`/admin/promociones/${promo.id}`} className="block space-y-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${catInfo.style}`}>
                          {catInfo.label}
                        </span>
                        
                        {/* Estado Activo / Inactivo */}
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          promo.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                        }`}>
                          {promo.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      
                      <div className="flex items-start justify-between gap-4 mt-2">
                        <div>
                          <h3 className={`font-serif text-xl font-bold ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                            {promo.title}
                          </h3>
                          <p className={`text-xs font-light mt-1 line-clamp-2 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                            {promo.description || 'Sin descripción detallada'}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl shrink-0 shadow-xl bg-gradient-to-tr from-[#D4AF37] via-[#EC4899] to-[#C9A96E] text-white flex flex-col items-center justify-center min-w-[85px] text-center border border-white/10">
                          <span className="text-xs font-black uppercase tracking-tighter leading-none opacity-90 text-white">Dto</span>
                          <span className="text-sm font-serif font-black tracking-tight leading-none mt-1 text-white">
                            {promo.discount_percent}%
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="flex items-center justify-between pt-4 border-t border-dashed border-[#EADED5]/60 dark:border-[#3D281E]/60">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#C9A96E]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{promo.valid_until ? new Date(promo.valid_until).toLocaleDateString() : 'Sin límite'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Botón Eliminar rápido */}
                        <button 
                          onClick={(e) => handleDelete(promo.id, e)}
                          className={`p-1.5 rounded-xl transition-all duration-300 ${
                            isDark ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20' : 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                          }`}
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Botón Editar */}
                        <Link 
                          href={`/admin/promociones/editar/${promo.id}`}
                          className={`text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 ${
                            isDark ? 'text-[#BCAEA5] bg-[#291A11] hover:text-[#D4AF37]' : 'text-[#6E5A4D] bg-[#FAF6F2] hover:text-[#D4AF37]'
                          }`}
                        >
                          <Settings className="w-3 h-3" />
                          <span>Editar</span>
                        </Link>

                        {/* Botón Ver Detalle */}
                        <Link 
                          href={`/admin/promociones/${promo.id}`}
                          className={`text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 ${
                            isDark ? 'text-white bg-[#3D281E] hover:bg-[#D4AF37] hover:text-neutral-950' : 'text-neutral-950 bg-[#EADED5] hover:bg-[#D4AF37] hover:text-neutral-950'
                          }`}
                        >
                          <span>Ver</span>
                          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
