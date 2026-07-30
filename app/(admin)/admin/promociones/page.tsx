// app/(admin)/promociones/page.tsx
// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Tag, 
  Percent, 
  Calendar, 
  Trash2, 
  Edit, 
  Star, 
  Sparkles, 
  Gift, 
  AlertCircle, 
  CheckCircle2, 
  Users,
  Flame,
  Copy,
  Check,
  TrendingUp,
  Zap
} from 'lucide-react'

interface Promotion {
  id: string
  title: string
  description: string
  discount_percent: number
  code: string
  valid_until: string
  category: 'flash' | 'welcome' | 'referral' | 'special'
  style: 'volante' | 'tarjeta' | 'flyer'
  featured: boolean
  is_active: boolean
  uses_limit: number | null
  current_uses: number
  terms: string
  image_url: string
}

const baseCategories = [
  { value: 'all', label: 'Todas' },
  { value: 'flash', label: '⚡ Flash' },
  { value: 'welcome', label: '🎁 Welcome' },
  { value: 'referral', label: '🔗 Referral' },
  { value: 'special', label: '⭐ Special' }
]

const categoryColors = {
  flash: 'bg-red-500/10 text-red-500 border-red-500/20',
  welcome: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  referral: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  special: 'bg-[#D4AF37]/10 text-[#C9A96E] border-[#D4AF37]/30'
}

export default function PromocionesPage() {
  const { tenantId } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    loadPromotions()
  }, [tenantId])

  const loadPromotions = async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPromotions(data || [])
    } catch (err: any) {
      console.error('Error cargando promociones:', err)
      setError(err.message || 'Error al cargar las promociones')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta promoción?')) return

    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id)

      if (error) throw error

      setPromotions(prev => prev.filter(p => p.id !== id))
      setSuccess('Promoción eliminada correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error eliminando promoción:', err)
      setError(err.message || 'Error al eliminar la promoción')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active: !currentState })
        .eq('id', id)

      if (error) throw error

      setPromotions(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentState } : p))
    } catch (err: any) {
      console.error('Error actualizando estado:', err)
      setError('Error al actualizar el estado')
      setTimeout(() => setError(null), 3000)
    }
  }

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Detectar categorías únicas presentes en las promociones para agregarlas dinámicamente si no están en la lista base
  const dynamicCategories = React.useMemo(() => {
    const catsMap = new Map(baseCategories.map(c => [c.value, c]))
    promotions.forEach(p => {
      if (p.category && !catsMap.has(p.category)) {
        // Formatear la categoría detectada de forma limpia
        const formattedLabel = p.category.charAt(0).toUpperCase() + p.category.slice(1)
        catsMap.set(p.category, { value: p.category, label: `🏷️ ${formattedLabel}` })
      }
    })
    return Array.from(catsMap.values())
  }, [promotions])

  const filteredPromotions = promotions.filter(promo => {
    const matchesSearch = promo.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          promo.code?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || promo.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden ${isDark ? 'bg-[#150D08]' : 'bg-[#FDFBF9]'}`}>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[100px] pointer-events-none" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-[#D4AF37]/20 shadow-2xl">
          <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
          <p className="text-xs font-black tracking-[0.2em] text-[#C9A96E] uppercase animate-pulse">
            Cargando promociones...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-16 relative overflow-hidden ${isDark ? 'bg-[#150D08] text-[#FFF9F6]' : 'bg-[#FDFBF9] text-[#1A0E0A]'}`}>
      
      {/* Fondos Decorativos Orgánicos */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#EC4899]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 relative z-10 pt-4">

        {/* ============================================================ */}
        {/* CABECERA HERO BANNER CON ACCESO A CREAR Y USO */}
        {/* ============================================================ */}
        <div className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ${
          isDark 
            ? 'bg-gradient-to-br from-[#271810] via-[#1E120C] to-[#160E09] border-[#3D281E] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]' 
            : 'bg-gradient-to-br from-white via-[#FBF7F4] to-[#F5ECE5] border-[#EADED5] shadow-[0_25px_50px_-15px_rgba(225,208,195,0.4)]'
        }`}>
          <div className="absolute -top-40 -right-40 w-[300px] h-[300px] bg-gradient-to-br from-[#EC4899]/10 to-[#D4AF37]/10 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

          <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[9px] font-black uppercase tracking-[0.25em] text-[#C9A96E]">
                <Sparkles className="w-2.5 h-2.5" />
                ✦ Panel de Control
              </div>
              <h1 className={`font-serif text-2xl md:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                Gestión de Promociones
              </h1>
              <p className={`text-xs ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                Administra cupones, descuentos y ofertas especiales para tus clientes.
              </p>
            </div>

            {/* BOTONES DE ACCIÓN (CREAR + USO) */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/admin/promociones/uso"
                className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all border flex items-center gap-2 ${
                  isDark ? 'bg-[#291A11] border-[#3D281E] text-[#BCAEA5] hover:text-white' : 'bg-[#FAF6F2] border-[#EADED5] text-[#6E5A4D] hover:text-[#1A0E0A]'
                }`}
              >
                <Users className="w-4 h-4 text-[#C9A96E]" />
                <span>Ver Usos</span>
              </Link>

              <Link
                href="/admin/promociones/crear"
                className="px-6 py-3 rounded-xl text-neutral-950 font-black text-xs uppercase tracking-[0.15em] transition-all duration-300 shadow-xl bg-gradient-to-r from-[#D4AF37] via-[#E8D5A0] to-[#C9A96E] hover:scale-[1.02] active:scale-95 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Promoción</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MENSAJES DE ESTADO */}
        {/* ============================================================ */}
        {error && (
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isDark ? 'bg-rose-950/20 border-rose-900/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-xs font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isDark ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p className="text-xs font-medium">{success}</p>
          </div>
        )}

        {/* ============================================================ */}
        {/* FILTROS Y BÚSQUEDA (CORREGIDO PARA WRAP Y SIN SCROLL HORIZONTAL) */}
        {/* ============================================================ */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          
          {/* Búsqueda */}
          <div className={`w-full lg:w-80 p-3 rounded-2xl border flex items-center gap-3 transition-all duration-300 shrink-0 ${
            isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5] shadow-sm'
          }`}>
            <Search className="w-4 h-4 text-[#C9A96E] shrink-0" />
            <input 
              type="text" 
              placeholder="Buscar por título o código..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`bg-transparent border-none outline-none text-xs w-full ${
                isDark ? 'text-white placeholder-[#8A766A]' : 'text-[#1A0E0A] placeholder-[#A39081]'
              }`}
            />
          </div>

          {/* Categorías (Con flex-wrap para que bajen de línea ordenadamente sin requerir scroll horizontal) */}
          <div className="flex flex-wrap items-center gap-2 w-full">
            {dynamicCategories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedCategory === cat.value
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#C9A96E] text-neutral-950 border-transparent shadow-md'
                    : isDark 
                      ? 'bg-[#1E120C] border-[#3D281E] text-[#BCAEA5] hover:text-white' 
                      : 'bg-white border-[#EADED5] text-[#6E5A4D] hover:text-[#1A0E0A]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

        </div>

        {/* ============================================================ */}
        {/* GRID DE PROMOCIONES */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromotions.length === 0 ? (
            <div className={`col-span-full text-center py-16 border border-dashed rounded-3xl ${
              isDark ? 'border-[#3D281E] bg-[#1E120C]/30 text-[#BCAEA5]' : 'border-[#EADED5] bg-white/50 text-[#6E5A4D]'
            }`}>
              <div className="flex flex-col items-center gap-3">
                <Gift className="w-10 h-10 text-[#C9A96E]/60" />
                <p className="text-xs font-bold uppercase tracking-wider">No se encontraron promociones</p>
                <Link
                  href="/admin/promociones/crear"
                  className="mt-2 text-xs font-bold text-[#C9A96E] hover:underline"
                >
                  Crear tu primera promoción
                </Link>
              </div>
            </div>
          ) : (
            filteredPromotions.map((promo) => {
              const catStyle = categoryColors[promo.category] || categoryColors.special

              return (
                <div 
                  key={promo.id}
                  className={`group relative rounded-3xl border overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col ${
                    isDark 
                      ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#D4AF37]/50' 
                      : 'bg-white border-[#EADED5] hover:border-[#D4AF37]/50 shadow-md'
                  }`}
                >
                  {/* Imagen opcional si existe */}
                  {promo.image_url && (
                    <div className="relative h-48 w-full overflow-hidden border-b border-[#3D281E]/20">
                      <img 
                        src={promo.image_url} 
                        alt={promo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${catStyle}`}>
                          {promo.category}
                        </span>

                        {promo.featured && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-400/10 text-amber-400 border border-amber-400/20">
                            <Star className="w-3 h-3 fill-current" /> Destacada
                          </span>
                        )}
                      </div>

                      <h3 className={`font-serif text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                        {promo.title}
                      </h3>

                      {promo.description && (
                        <p className={`text-xs line-clamp-2 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                          {promo.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-[#3D281E]/30">
                      
                      {/* Descuento y Código */}
                      <div className="flex items-center justify-between gap-2">
                        {promo.discount_percent > 0 && (
                          <div className="flex items-center gap-1 text-emerald-500 font-bold text-sm">
                            <Percent className="w-4 h-4" />
                            <span>{promo.discount_percent}% OFF</span>
                          </div>
                        )}

                        {promo.code && (
                          <button
                            onClick={() => copyCode(promo.code, promo.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                              isDark ? 'bg-[#150D08] border-[#3D281E] text-[#FFF9F6] hover:border-[#D4AF37]' : 'bg-[#FAF8F5] border-[#EADED5] text-[#1A0E0A] hover:border-[#D4AF37]'
                            }`}
                            title="Copiar código"
                          >
                            <Tag className="w-3 h-3 text-[#C9A96E]" />
                            <span>{promo.code}</span>
                            {copiedId === promo.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-60" />}
                          </button>
                        )}
                      </div>

                      {/* Fecha de expiración */}
                      {promo.valid_until && (
                        <div className={`flex items-center gap-1.5 text-[10px] ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                          <Calendar className="w-3 h-3 text-[#C9A96E]" />
                          <span>Válido hasta: {new Date(promo.valid_until).toLocaleDateString()}</span>
                        </div>
                      )}

                      {/* Acciones de la tarjeta */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={() => handleToggleActive(promo.id, promo.is_active)}
                          className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border transition-all ${
                            promo.is_active 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}
                        >
                          {promo.is_active ? '● Activa' : '○ Inactiva'}
                        </button>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/promociones/editar/${promo.id}`}
                            className={`p-2 rounded-xl border transition-all ${
                              isDark ? 'bg-[#150D08] border-[#3D281E] text-[#BCAEA5] hover:text-white' : 'bg-[#FAF6F2] border-[#EADED5] text-[#6E5A4D] hover:text-[#1A0E0A]'
                            }`}
                            title="Editar"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleDelete(promo.id)}
                            className="p-2 rounded-xl border bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20 transition-all"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  )
}
