// @ts-nocheck
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Edit, Trash2, Eye, Gift,
  Flame, Star, RefreshCw, AlertCircle,
  CheckCircle2, Clock, Users, Loader2,
  Percent, Copy, ChevronLeft, ChevronRight, Crown
} from 'lucide-react'

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
}

const categories = [
  { value: 'flash', label: '⚡ Flash', color: 'from-red-500 to-red-600' },
  { value: 'welcome', label: '🎁 Welcome', color: 'from-emerald-400 to-emerald-600' },
  { value: 'referral', label: '🔗 Referral', color: 'from-blue-400 to-blue-600' },
  { value: 'special', label: '⭐ Special', color: 'from-purple-400 to-purple-600' }
]

const styles_options = [
  { value: 'volante', label: '📄 Volante' },
  { value: 'tarjeta', label: '💳 Tarjeta' },
  { value: 'flyer', label: '📋 Flyer' }
]

// ============================================================
// PALETA DE COLORES GOLD PREMIUM (Forzada para consistencia)
// ============================================================
const GOLD_COLORS = {
  primary: '#D4AF37', // Dorado Principal
  light: '#E8D5A0',   // Dorado Claro
  dark: '#C9A96E',    // Dorado Oscuro
  textOnGold: '#1A0E0A', // Marrón casi negro para texto sobre dorado
  bgDark: '#1E120C',  // Fondo Oscuro Premium
  cardDark: '#2A1B14', // Fondo Tarjeta Oscura
  borderDark: '#3D281E', // Borde Oscuro
  bgLight: '#FFF9F6', // Fondo Claro Premium
  cardLight: '#FFFFFF', // Fondo Tarjeta Clara
  borderLight: '#F0E4DA', // Borde Claro
  textLight: '#5C4A3E' // Texto Marrón Suave
}

// Configuración de paginación
const ITEMS_PER_PAGE = 6

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { 
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
}

export default function AdminPromocionesPage() {
  const { tenantId } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'

  // Gradiente de marca forzado (Gold Luxury)
  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${GOLD_COLORS.primary} 0%, ${GOLD_COLORS.dark} 50%, ${GOLD_COLORS.light} 100%)`
  }

  const [promociones, setPromociones] = useState<Promocion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterActive, setFilterActive] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Estado de Paginación
  const [currentPage, setCurrentPage] = useState<number>(1)

  useEffect(() => {
    loadPromociones()
  }, [tenantId])

  const loadPromociones = async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }
    setError(null)
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPromociones(data || [])
    } catch (error) {
      console.error('Error cargando promociones:', error)
      setError('Error al cargar las promociones comercial.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // ============================================================
  // LÓGICA DE FILTRADO Y PAGINACIÓN
  // ============================================================
  const filteredPromociones = useMemo(() => {
    return promociones.filter((promo) => {
      const t = searchTerm.toLowerCase().trim()
      const matchesSearch = t === '' || 
        promo.title.toLowerCase().includes(t) ||
        promo.description?.toLowerCase().includes(t) ||
        promo.code?.toLowerCase().includes(t)
      const matchesCategory = filterCategory === 'all' || promo.category === filterCategory
      const matchesStatus = filterActive === 'all' || 
        (filterActive === 'active' && promo.is_active) ||
        (filterActive === 'inactive' && !promo.is_active)
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [promociones, searchTerm, filterCategory, filterActive])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterCategory, filterActive])

  const totalPages = Math.ceil(filteredPromociones.length / ITEMS_PER_PAGE)
  
  const paginatedPromociones = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return filteredPromociones.slice(start, end)
  }, [filteredPromociones, currentPage])

  // ============================================================
  // ACCIONES
  // ============================================================
  const handleDelete = async (id: string) => {
    const { count } = await supabase.from('promotion_usage').select('*', { count: 'exact', head: true }).eq('promotion_id', id)
    const usoCount = count || 0
    let confirmMessage = '¿Estás seguro de eliminar esta promoción?'
    if (usoCount > 0) confirmMessage = `⚠️ Esta promoción tiene ${usoCount} uso${usoCount > 1 ? 's' : ''}. Al eliminarla, también se eliminarán todos los registros de uso.`
    if (!confirm(confirmMessage)) return
    setDeletingId(id)
    try {
      if (usoCount > 0) await supabase.from('promotion_usage').delete().eq('promotion_id', id)
      await supabase.from('promotions').delete().eq('id', id)
      setSuccess(`✅ Promoción eliminada correctamente`)
      loadPromociones()
    } catch (error: any) { setError(`❌ Error al eliminar: ${error.message || 'Error desconocido'}`) }
    finally { setDeletingId(null); setTimeout(() => { setSuccess(null); setError(null) }, 3000) }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await supabase.from('promotions').update({ is_active: !currentStatus }).eq('id', id)
      setSuccess(`✅ Promoción ${!currentStatus ? 'activada' : 'desactivada'}`)
      loadPromociones()
    } catch (error) { setError('❌ Error al cambiar el estado') }
    finally { setTimeout(() => setSuccess(null), 3000) }
  }

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Helpers Visuales
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'flash': return <Flame className="w-3.5 h-3.5" />; case 'welcome': return <Gift className="w-3.5 h-3.5" />; case 'referral': return <Users className="w-3.5 h-3.5" />; default: return <Star className="w-3.5 h-3.5" />
    }
  }
  const getCategoryLabel = (category: string) => categories.find(c => c.value === category)?.label.split(' ')[1] || 'Special'
  const getCategoryColor = (category: string) => categories.find(c => c.value === category)?.color || 'from-purple-400 to-purple-600'

  // ============================================================
  // RENDER - LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[70vh] transition-colors duration-500 ${isDark ? `bg-[${GOLD_COLORS.bgDark}]` : `bg-[${GOLD_COLORS.bgLight}]`}`}>
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className={`w-16 h-16 rounded-full border-2 ${isDark ? 'border-[#D4AF37]/20' : 'border-[#D4AF37]/20'} border-t-[#D4AF37] animate-spin`} />
            <Crown className="w-6 h-6 text-[#D4AF37] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-[10px] tracking-[0.4em] uppercase font-light animate-pulse" style={{ color: GOLD_COLORS.primary }}>Cargando Promociones</p>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER - MAIN UI (ESTILOS DORADOS FORZADOS)
  // ============================================================
  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-8 relative overflow-x-hidden ${isDark ? `bg-[${GOLD_COLORS.bgDark}] text-[#FFF9F6]` : `bg-[${GOLD_COLORS.bgLight}] text-[#1A0E0A]`}`}>
      
      {/* Patrón de fondo sutil */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-5 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-7xl mx-auto px-4 space-y-6 relative z-10 pt-4">

        {/* CABECERA PRINCIPAL GOLD */}
        <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl text-white border border-white/10" style={brandGradient}>
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-black/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-white/90">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Club VIP Ofertas
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight drop-shadow-sm" style={{ color: GOLD_COLORS.textOnGold }}>Promociones Fresh Nails</h1>
              <p className="text-xs md:text-sm font-medium max-w-md" style={{ color: `${GOLD_COLORS.textOnGold}CC` }}>Crea y gestiona ofertas, descuentos y códigos de referido exclusivos.</p>
            </div>
            <div className="flex items-center gap-3 self-start md:self-center shrink-0">
              <Link href="/admin/promociones/uso" className="p-3 rounded-xl bg-black/10 hover:bg-black/20 border border-black/10 text-black/80 transition-all active:scale-95 flex items-center gap-2 text-xs font-bold" style={{ color: GOLD_COLORS.textOnGold, borderColor: `${GOLD_COLORS.textOnGold}20` }}>
                <Users className="w-4 h-4" /><span className="hidden sm:inline">Registro de Usos</span>
              </Link>
              <button onClick={() => { setRefreshing(true); loadPromociones() }} disabled={refreshing} className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95 shadow-lg">
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <Link href="/admin/promociones/crear" className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#F0E4DA] hover:scale-105 active:scale-95 transition-all" style={{ color: GOLD_COLORS.textOnGold }}>
                <PlusCircle className="w-4 h-4" style={{ color: GOLD_COLORS.primary }} /> Nueva Promoción
              </Link>
            </div>
          </div>
        </div>

        {/* MENSAJES DE ESTADO */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`rounded-2xl p-4 flex items-center gap-3 border ${isDark ? `bg-[#3D281E]/40 border-[${GOLD_COLORS.primary}]/30` : `bg-white border-[${GOLD_COLORS.primary}]/30`}`}>
              <AlertCircle className="w-4 h-4 shrink-0" style={{ color: GOLD_COLORS.primary }} /><p className="text-xs font-medium" style={{ color: isDark ? '#FFF9F6' : '#1A0E0A' }}>{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`rounded-2xl p-4 flex items-center gap-3 border ${isDark ? `bg-[#3D281E]/40 border-[${GOLD_COLORS.primary}]/30` : `bg-white border-[${GOLD_COLORS.primary}]/30`}`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: GOLD_COLORS.primary }} /><p className="text-xs font-medium" style={{ color: isDark ? '#FFF9F6' : '#1A0E0A' }}>{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPIS GOLD */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: promociones.length, icon: Gift, color: GOLD_COLORS.primary },
            { label: 'Activas', value: promociones.filter(p => p.is_active).length, icon: CheckCircle2, color: '#10B981' },
            { label: 'Destacadas', value: promociones.filter(p => p.featured).length, icon: Star, color: GOLD_COLORS.primary },
            { label: 'Usos Totales', value: promociones.reduce((sum, p) => sum + (p.uses_count || 0), 0), icon: Users, color: '#8B5CF6' }
          ].map((kpi, i) => (
            <div key={i} className={`rounded-2xl p-4 shadow-sm border ${isDark ? `bg-[${GOLD_COLORS.cardDark}] border-[${GOLD_COLORS.borderDark}]` : 'bg-white border-[#F0E4DA]'} flex items-center gap-3 min-w-0`}>
              <div className={`p-2.5 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`} style={{ color: kpi.color }}><kpi.icon className="w-4 h-4 sm:w-5 sm:h-5" /></div>
              <div className="min-w-0">
                <p className={`text-[8px] sm:text-[10px] font-mono uppercase tracking-wider font-black ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>{kpi.label}</p>
                <h3 className="text-base sm:text-lg font-mono font-black" style={{ color: isDark ? '#FFF9F6' : '#1A0E0A' }}>{kpi.value.toLocaleString()}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* BARRA DE FILTROS GOLD */}
        <div className={`flex flex-col sm:flex-row gap-3 p-3 rounded-2xl border shadow-sm ${isDark ? `bg-[${GOLD_COLORS.cardDark}] border-[${GOLD_COLORS.borderDark}]` : 'bg-white border-[#F0E4DA]'}`}>
          <div className={`flex-1 flex items-center gap-3 min-w-0 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'} px-3 py-2 rounded-xl border ${isDark ? `border-[${GOLD_COLORS.borderDark}]` : 'border-[#F0E4DA]'}`}>
            <Search className="w-4 h-4 shrink-0" style={{ color: GOLD_COLORS.primary }} />
            <input type="text" placeholder="Buscar por título, descripción o código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-xs placeholder:text-stone-400 w-full" style={{ color: isDark ? '#FFF9F6' : '#1A0E0A' }} />
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={`px-3 py-2 rounded-xl text-xs border transition-all focus:outline-none focus:ring-1 ${isDark ? `bg-[#0f0c1b] text-pink-100 border-[${GOLD_COLORS.borderDark}] focus:ring-[#D4AF37]/30` : `bg-white text-stone-800 border-[#F0E4DA] focus:ring-[#D4AF37]/30`} flex-1 sm:flex-none`}>
              <option value="all">Todas las categorías</option>
              {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
            </select>
            <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className={`px-3 py-2 rounded-xl text-xs border transition-all focus:outline-none focus:ring-1 ${isDark ? `bg-[#0f0c1b] text-pink-100 border-[${GOLD_COLORS.borderDark}] focus:ring-[#D4AF37]/30` : `bg-white text-stone-800 border-[#F0E4DA] focus:ring-[#D4AF37]/30`} flex-1 sm:flex-none`}>
              <option value="all">Todos los estados</option><option value="active">Solo Activas</option><option value="inactive">Solo Inactivas</option>
            </select>
          </div>
        </div>

        {/* GRILLA DE PROMOCIONES GOLD PAGINADA */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredPromociones.length === 0 ? (
              <motion.div key="empty" variants={itemVariants} className={`col-span-full text-center py-16 border border-dashed rounded-2xl ${isDark ? `border-[${GOLD_COLORS.primary}]/20 bg-black/10` : 'border-stone-200 bg-white'}`}>
                <Gift className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                <p className="text-sm text-stone-500">No se encontraron promociones con los filtros actuales.</p>
                <Link href="/admin/promociones/crear" className="inline-block mt-4 px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 transition-all" style={{ ...brandGradient, color: GOLD_COLORS.textOnGold }}>Crear nueva promoción</Link>
              </motion.div>
            ) : (
              paginatedPromociones.map((promo) => (
                <motion.div key={promo.id} variants={itemVariants} layout layoutId={promo.id} className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDark ? `bg-[${GOLD_COLORS.cardDark}] border-[${GOLD_COLORS.borderDark}] hover:border-[${GOLD_COLORS.primary}]/40` : `bg-white border-[#F0E4DA] hover:border-[${GOLD_COLORS.primary}]/40`}`}>
                  {/* Imagen y Descuento */}
                  <div className="relative aspect-video overflow-hidden bg-stone-100 dark:bg-stone-800 flex items-center justify-center border-b ${isDark ? `border-[${GOLD_COLORS.borderDark}]` : 'border-[#F0E4DA]'}`>
                    {promo.image_url ? (
                      <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <Percent className={`w-12 h-12 ${isDark ? 'text-stone-700' : 'text-stone-200'}`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    
                    {/* Badge Descuento Gold */}
                    {promo.discount_percent > 0 && (
                      <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-lg font-bold border" style={{ color: GOLD_COLORS.primary, borderColor: `${GOLD_COLORS.primary}40` }}>-{promo.discount_percent}%</div>
                    )}
                    
                    {/* Badges Flotantes */}
                    <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest text-white shadow-sm bg-gradient-to-r ${getCategoryColor(promo.category)}`}>{getCategoryIcon(promo.category)}{getCategoryLabel(promo.category)}</span>
                      {promo.featured && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest bg-[#D4AF37] text-[#1A0E0A] shadow-sm"><Star className="w-2.5 h-2.5 fill-current" /> Destacada</span>}
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-4 space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm line-clamp-1 transition-colors group-hover:text-[#D4AF37]" style={{ color: isDark ? '#FFF9F6' : '#1A0E0A' }}>{promo.title}</h3>
                      <p className={`text-xs leading-relaxed min-h-[32px] line-clamp-2 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>{promo.description || 'Sin descripción disponible.'}</p>
                    </div>

                    {/* Info Inferior */}
                    <div className={`flex items-center justify-between pt-2.5 border-t ${isDark ? `border-[${GOLD_COLORS.borderDark}]` : 'border-[#F0E4DA]'}`}>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-400 dark:text-stone-500"><Clock className="w-3 h-3" />{promo.valid_until ? new Date(promo.valid_until).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'Sin caducidad'}</div>
                      <div className={`flex items-center gap-1.5 text-[10px] font-medium ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}><Users className="w-3 h-3" style={{ color: GOLD_COLORS.primary }} />{promo.uses_count || 0}{promo.uses_limit ? ` / ${promo.uses_limit}` : ' usos'}</div>
                    </div>

                    {/* Bloque de Acciones */}
                    <div className={`flex items-center gap-2 pt-3 border-t ${isDark ? `border-[${GOLD_COLORS.borderDark}]` : 'border-[#F0E4DA]'}`}>
                      {promo.code && (
                        <button onClick={() => copyCode(promo.code!, promo.id)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-colors ${isDark ? `bg-[#1E120C] border-[${GOLD_COLORS.borderDark}] text-stone-300 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30` : 'bg-stone-50 border-pink-100 text-stone-600 hover:bg-pink-50 hover:border-[#D4AF37]/30'}`}>
                          {copiedId === promo.id ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Copiado</> : <><Copy className="w-3.5 h-3.5" style={{ color: GOLD_COLORS.primary }} /> {promo.code}</>}
                        </button>
                      )}
                      <button onClick={() => handleToggleActive(promo.id, promo.is_active)} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-colors ${promo.is_active ? `bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20` : `${isDark ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-600'} border-stone-200 hover:bg-stone-200`}`}>
                        {promo.is_active ? 'Activa' : 'Pausada'}
                      </button>
                      <div className="flex items-center gap-1 shrink-0 ml-auto">
                        <Link href={`/admin/promociones/${promo.id}`} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#FFF9F6]'} hover:text-[#D4AF37]`}><Eye className="w-3.5 h-3.5" /></Link>
                        <Link href={`/admin/promociones/editar/${promo.id}`} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#FFF9F6]'} hover:text-[#D4AF37]`}><Edit className="w-3.5 h-3.5" /></Link>
                        <button onClick={() => handleDelete(promo.id)} disabled={deletingId === promo.id} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#FFF9F6]'} hover:text-red-500 disabled:opacity-50`}>
                          {deletingId === promo.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>

        {/* ============================================================ */}
        {/* CONTROLES DE PAGINACIÓN GOLD */}
        {/* ============================================================ */}
        {totalPages > 1 && (
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border font-mono text-xs shadow-sm ${isDark ? `bg-[${GOLD_COLORS.cardDark}] border-[${GOLD_COLORS.borderDark}]` : 'bg-white border-[#F0E4DA]'}`}>
            <span style={{ color: isDark ? '#A89588' : '#5C4A3E' }}>Página <span className="font-bold text-[#D4AF37]">{currentPage}</span> de <span className="font-bold" style={{ color: isDark ? '#FFF9F6' : '#1A0E0A' }}>{totalPages}</span> ({filteredPromociones.length} resultados)</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={`p-2.5 rounded-xl border transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${isDark ? `bg-[#1E120C] border-[${GOLD_COLORS.borderDark}] hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/10` : 'bg-stone-50 border-pink-100 hover:bg-pink-50'}`} style={{ color: GOLD_COLORS.primary }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 mx-1">
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => {
                  const esPaginaActual = currentPage === page
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-xl border text-[10px] font-bold transition-all ${esPaginaActual ? `border-[${GOLD_COLORS.primary}]` : isDark ? `bg-[#1E120C] border-[${GOLD_COLORS.borderDark}] hover:border-[#D4AF37]/40` : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40'}`} style={esPaginaActual ? { ...brandGradient, color: GOLD_COLORS.textOnGold } : { color: isDark ? '#FFF9F6' : '#1A0E0A' }}>{page}</button>
                  )
                })}
              </div>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className={`p-2.5 rounded-xl border transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${isDark ? `bg-[#1E120C] border-[${GOLD_COLORS.borderDark}] hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/10` : 'bg-stone-50 border-pink-100 hover:bg-pink-50'}`} style={{ color: GOLD_COLORS.primary }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
