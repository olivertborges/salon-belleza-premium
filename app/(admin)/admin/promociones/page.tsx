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
  Percent, Copy, ChevronLeft, ChevronRight
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

const styles = [
  { value: 'volante', label: '📄 Volante' },
  { value: 'tarjeta', label: '💳 Tarjeta' },
  { value: 'flyer', label: '📋 Flyer' }
]

// ============================================================
// CONFIGURACIÓN DE PAGINACIÓN (CLIENTE)
// ============================================================
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
  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'

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

  // ============================================================
  // ESTADO DE PAGINACIÓN
  // ============================================================
  const [currentPage, setCurrentPage] = useState<number>(1)

  const primaryBgStyle = { backgroundColor: primaryColor }

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
      setError('Error al cargar las promociones')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // ============================================================
  // LÓGICA DE FILTRADO (MEMORIZADA)
  // ============================================================
  const filteredPromociones = useMemo(() => {
    return promociones.filter((promo) => {
      // Filtro de Búsqueda
      const t = searchTerm.toLowerCase().trim()
      const matchesSearch = t === '' || 
        promo.title.toLowerCase().includes(t) ||
        promo.description?.toLowerCase().includes(t) ||
        promo.code?.toLowerCase().includes(t)

      // Filtro de Categoría
      const matchesCategory = filterCategory === 'all' || promo.category === filterCategory

      // Filtro de Estado (Activa/Inactiva)
      const matchesStatus = filterActive === 'all' || 
        (filterActive === 'active' && promo.is_active) ||
        (filterActive === 'inactive' && !promo.is_active)

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [promociones, searchTerm, filterCategory, filterActive])

  // ============================================================
  // LÓGICA DE PAGINACIÓN (CLIENTE)
  // ============================================================
  
  // Reiniciar a la página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterCategory, filterActive])

  const totalPages = Math.ceil(filteredPromociones.length / ITEMS_PER_PAGE)
  
  // Segmento de datos memorizado para la página actual
  const paginatedPromociones = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return filteredPromociones.slice(start, end)
  }, [filteredPromociones, currentPage])

  // ============================================================
  // ACCIONES (ELIMINAR, ESTADO, COPIAR)
  // ============================================================
  const handleDelete = async (id: string) => {
    const { count } = await supabase
      .from('promotion_usage')
      .select('*', { count: 'exact', head: true })
      .eq('promotion_id', id)

    const usoCount = count || 0
    let confirmMessage = '¿Estás seguro de eliminar esta promoción?'
    if (usoCount > 0) {
      confirmMessage = `⚠️ Esta promoción tiene ${usoCount} uso${usoCount > 1 ? 's' : ''}. Al eliminarla, también se eliminarán todos los registros de uso.`
    }
    if (!confirm(confirmMessage)) return

    setDeletingId(id)
    try {
      if (usoCount > 0) await supabase.from('promotion_usage').delete().eq('promotion_id', id)
      
      const { data: promo } = await supabase.from('promotions').select('image_url').eq('id', id).single()
      if (promo?.image_url) {
        try {
          const urlParts = promo.image_url.split('/')
          const filePath = urlParts.slice(urlParts.indexOf('promotions')).join('/')
          await supabase.storage.from('promotions').remove([filePath])
        } catch (e) {}
      }
      await supabase.from('promotions').delete().eq('id', id)
      setSuccess(`✅ Promoción eliminada correctamente`)
      loadPromociones()
    } catch (error: any) {
      setError(`❌ Error al eliminar: ${error.message || 'Error desconocido'}`)
    } finally {
      setDeletingId(null)
      setTimeout(() => { setSuccess(null); setError(null) }, 3000)
    }
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

  // ============================================================
  // HELPERS VISUALES
  // ============================================================
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'flash': return <Flame className="w-4 h-4" />; case 'welcome': return <Gift className="w-4 h-4" />; case 'referral': return <Users className="w-4 h-4" />; default: return <Star className="w-4 h-4" />
    }
  }
  const getCategoryLabel = (category: string) => categories.find(c => c.value === category)?.label.split(' ')[1] || 'Special'
  const getCategoryColor = (category: string) => categories.find(c => c.value === category)?.color || 'from-purple-400 to-purple-600'
  const getStyleLabel = (style: string) => styles.find(s => s.value === style)?.label || style

  // ============================================================
  // RENDER - LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
            <Gift className="w-6 h-6 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-sm font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 animate-pulse">CARGANDO PROMOCIONES</p>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER - MAIN UI
  // ============================================================
  return (
    <div className="space-y-6 p-1 max-w-7xl mx-auto">

      {/* CABECERA PRINCIPAL */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl text-white border border-white/10" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, #EF4444 100%)` }}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-pink-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Gestión Comercial
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight drop-shadow-sm">Promociones Fresh Nails</h1>
            <p className="text-xs md:text-sm text-pink-50/80 font-medium max-w-md">Crea y gestiona ofertas, descuentos y códigos de referido para tus clientes.</p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <Link href="/admin/promociones/uso" className="p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-500 transition-all active:scale-95 flex items-center gap-2 text-xs font-semibold">
              <Users className="w-4 h-4" /><span className="hidden sm:inline">Registro de Usos</span>
            </Link>
            <button onClick={() => { setRefreshing(true); loadPromociones() }} disabled={refreshing} className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95 shadow-lg">
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/admin/promociones/crear" className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white text-stone-900 font-black text-xs uppercase tracking-widest shadow-xl hover:bg-pink-50 hover:scale-105 active:scale-95 transition-all">
              <div className="p-1 rounded-md bg-stone-900 text-white"><Plus className="w-3 h-3 stroke-[3]" /></div><span>Nueva Promoción</span>
            </Link>
          </div>
        </div>
      </div>

      {/* MENSAJES DE ESTADO */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-2xl p-4 bg-gradient-to-r from-rose-500/10 to-pink-500/5 border border-rose-500/20 flex items-center gap-3 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" /><p className="text-xs text-stone-700 dark:text-rose-400 font-medium">{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-2xl p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex items-center gap-3 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /><p className="text-xs text-stone-700 dark:text-emerald-400 font-medium">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPIS DETALLADOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Total', value: promociones.length, icon: Gift, color: primaryColor, bgColor: `${primaryColor}10` },
          { label: 'Activas', value: promociones.filter(p => p.is_active).length, icon: CheckCircle2, color: '#10B981', bgColor: '#10B98110' },
          { label: 'Destacadas', value: promociones.filter(p => p.featured).length, icon: Star, color: '#F59E0B', bgColor: '#F59E0B10' },
          { label: 'Usos Totales', value: promociones.reduce((sum, p) => sum + (p.uses_count || 0), 0), icon: Users, color: '#8B5CF6', bgColor: '#8B5CF610' }
        ].map((kpi, i) => (
          <div key={i} className={`rounded-2xl p-3 sm:p-4 shadow-sm border ${isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'} flex items-center gap-3 min-w-0`}>
            <div className="p-2 sm:p-2.5 rounded-xl shrink-0" style={{ backgroundColor: kpi.bgColor, color: kpi.color }}><kpi.icon className="w-4 h-4 sm:w-5 sm:h-5" /></div>
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">{kpi.label}</p>
              <h3 className="text-base sm:text-lg font-mono font-black text-stone-900 dark:text-pink-100">{kpi.value.toLocaleString()}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* BARRA DE FILTROS AVANZADA */}
      <div className={`flex flex-col sm:flex-row gap-3 p-3 rounded-2xl border shadow-sm ${isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'}`}>
        <div className="flex-1 flex items-center gap-3 min-w-0 bg-stone-50 dark:bg-[#0f0c1b] px-3 py-2 rounded-xl border border-pink-100/60 dark:border-fuchsia-950">
          <Search className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
          <input type="text" placeholder="Buscar por título, descripción o código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-xs text-stone-800 dark:text-pink-100 placeholder:text-stone-400 w-full" />
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={`px-3 py-2 rounded-xl text-xs border ${isDark ? 'bg-[#0f0c1b] text-pink-100 border-fuchsia-950' : 'bg-white text-stone-800 border-pink-100/60'} flex-1 sm:flex-none`}>
            <option value="all">Todas las categorías</option>
            {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
          </select>
          <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className={`px-3 py-2 rounded-xl text-xs border ${isDark ? 'bg-[#0f0c1b] text-pink-100 border-fuchsia-950' : 'bg-white text-stone-800 border-pink-100/60'} flex-1 sm:flex-none`}>
            <option value="all">Todos los estados</option><option value="active">Solo Activas</option><option value="inactive">Solo Inactivas</option>
          </select>
        </div>
      </div>

      {/* GRILLA DE PROMOCIONES PAGINADA */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredPromociones.length === 0 ? (
            <motion.div key="empty" variants={itemVariants} className="col-span-full text-center py-16 border border-dashed rounded-2xl border-pink-200 dark:border-fuchsia-950 bg-white/5">
              <Gift className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-sm text-stone-500 dark:text-stone-400">No se encontraron promociones con los filtros actuales.</p>
              <Link href="/admin/promociones/crear" className="inline-block mt-4 px-4 py-2 rounded-xl text-white text-xs font-bold hover:scale-105 transition-all" style={primaryBgStyle}>Crear nueva promoción</Link>
            </motion.div>
          ) : (
            paginatedPromociones.map((promo) => (
              <motion.div key={promo.id} variants={itemVariants} layout layoutId={promo.id} className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDark ? 'bg-[#130f24] border-fuchsia-950 hover:border-fuchsia-800' : 'bg-white border-pink-100/60 hover:border-pink-300'}`}>
                {/* Imagen y Descuento */}
                <div className="relative aspect-video overflow-hidden bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  {promo.image_url ? (
                    <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <Percent className="w-12 h-12 text-stone-300 dark:text-stone-600" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  {promo.discount_percent > 0 && (
                    <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-white text-lg font-bold border border-amber-400/30">-{promo.discount_percent}%</div>
                  )}
                  {/* Badges Flotantes */}
                  <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest text-white shadow-sm bg-gradient-to-r ${getCategoryColor(promo.category)}`}>{getCategoryIcon(promo.category)}{getCategoryLabel(promo.category)}</span>
                    {promo.featured && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest bg-amber-400 text-stone-900 shadow-sm"><Star className="w-2.5 h-2.5 fill-current" /> Destacada</span>}
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-stone-800 dark:text-white line-clamp-1 group-hover:color-[${primaryColor}]">{promo.title}</h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed min-h-[32px]">{promo.description || 'Sin descripción disponible.'}</p>
                  </div>

                  {/* Info Inferior */}
                  <div className={`flex items-center justify-between pt-2.5 border-t ${isDark ? 'border-fuchsia-950' : 'border-pink-100/60'}`}>
                    <div className="flex items-center gap-1.5 text-[10px] text-stone-400 dark:text-stone-500"><Clock className="w-3 h-3" />{promo.valid_until ? new Date(promo.valid_until).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'Sin caducidad'}</div>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-stone-500 dark:text-stone-400"><Users className="w-3 h-3" style={{ color: primaryColor }} />{promo.uses_count || 0}{promo.uses_limit ? ` / ${promo.uses_limit}` : ' usos'}</div>
                  </div>

                  {/* Bloque de Acciones */}
                  <div className={`flex items-center gap-2 pt-3 border-t ${isDark ? 'border-fuchsia-950' : 'border-pink-100/60'}`}>
                    {promo.code && (
                      <button onClick={() => copyCode(promo.code!, promo.id)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-colors ${isDark ? 'bg-[#1E120C] border-fuchsia-950 text-stone-300 hover:bg-fuchsia-950' : 'bg-stone-50 border-pink-100 text-stone-600 hover:bg-pink-50'}`}>
                        {copiedId === promo.id ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> {promo.code}</>}
                      </button>
                    )}
                    <button onClick={() => handleToggleActive(promo.id, promo.is_active)} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-colors ${promo.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'}`}>
                      {promo.is_active ? 'Activa' : 'Pausada'}
                    </button>
                    <div className="flex items-center gap-1 shrink-0 ml-auto">
                      {[ { href: `/admin/promociones/${promo.id}`, icon: Eye, color: 'hover:text-blue-500' }, { href: `/admin/promociones/editar/${promo.id}`, icon: Edit, color: 'hover:text-amber-500' } ].map((action, i) => (
                        <Link key={i} href={action.href} className={`p-1.5 rounded-lg text-stone-400 transition-colors ${isDark ? 'hover:bg-fuchsia-950' : 'hover:bg-pink-50'} ${action.color}`}><action.icon className="w-3.5 h-3.5" /></Link>
                      ))}
                      <button onClick={() => handleDelete(promo.id)} disabled={deletingId === promo.id} className={`p-1.5 rounded-lg text-stone-400 transition-colors ${isDark ? 'hover:bg-fuchsia-950' : 'hover:bg-pink-50'} hover:text-red-500 disabled:opacity-50`}>
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
      {/* CONTROLES DE PAGINACIÓN */}
      {/* ============================================================ */}
      {totalPages > 1 && (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border font-mono text-xs shadow-sm ${isDark ? 'bg-[#130f24] border-fuchsia-950 text-stone-400' : 'bg-white border-pink-100/60 text-stone-500'}`}>
          <span>Página <span className="font-bold text-pink-500 dark:text-pink-400">{currentPage}</span> de <span className="font-bold">{totalPages}</span> ({filteredPromociones.length} resultados)</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={`p-2.5 rounded-xl border transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${isDark ? 'bg-[#0f0c1b] border-fuchsia-950 hover:bg-fuchsia-950' : 'bg-stone-50 border-pink-100 hover:bg-pink-50'} text-stone-600 dark:text-pink-100`}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 mx-1">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => {
                const esPaginaActual = currentPage === page
                // Lógica para mostrar solo algunas páginas si hay muchas (opcional, aquí simple)
                return (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-xl border text-[10px] font-bold transition-all ${esPaginaActual ? 'text-white' : isDark ? 'bg-[#0f0c1b] border-fuchsia-950 text-stone-400 hover:border-fuchsia-800' : 'bg-white border-pink-100/60 text-stone-500 hover:border-pink-300'}`} style={esPaginaActual ? primaryBgStyle : {}}>{page}</button>
                )
              })}
            </div>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className={`p-2.5 rounded-xl border transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${isDark ? 'bg-[#0f0c1b] border-fuchsia-950 hover:bg-fuchsia-950' : 'bg-stone-50 border-pink-100 hover:bg-pink-50'} text-stone-600 dark:text-pink-100`}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
