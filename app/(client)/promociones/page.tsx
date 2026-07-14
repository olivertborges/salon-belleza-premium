'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Gift, 
  Clock, 
  Tag, 
  Percent, 
  Flame,
  Eye,
  Share2,
  X,
  ArrowLeft,
  Search,
  Filter,
  Grid3x3,
  LayoutList,
  ChevronDown,
  Zap,
  Star,
  Copy,
  Check,
  Loader,
  Diamond
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
  terms?: string
  min_purchase?: number
  uses_limit?: number
  uses_count?: number
  background_color?: string
  accent_color?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 24 
    }
  }
}

export default function PromocionesCliente() {
  const { tenantId } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color || '#DB5B9A'

  const [promociones, setPromociones] = useState<Promocion[]>([])
  const [filteredPromociones, setFilteredPromociones] = useState<Promocion[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPromo, setSelectedPromo] = useState<Promocion | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const brandGradient = `linear-gradient(135deg, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`

  useEffect(() => {
    loadPromociones()
  }, [tenantId])

  const loadPromociones = async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    try {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .gte('valid_until', hoy.toISOString())
        .order('featured', { ascending: false })
        .order('valid_until', { ascending: true })

      if (error) throw error
      setPromociones(data || [])
      setFilteredPromociones(data || [])
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

  useEffect(() => {
    let filtered = promociones

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.code?.toLowerCase().includes(term)
      )
    }

    setFilteredPromociones(filtered)
  }, [selectedCategory, searchTerm, promociones])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'flash': return <Flame className="w-3.5 h-3.5" />
      case 'premium': return <Diamond className="w-3.5 h-3.5" />
      case 'welcome': return <Gift className="w-3.5 h-3.5" />
      case 'seasonal': return <Sparkles className="w-3.5 h-3.5" />
      default: return <Tag className="w-3.5 h-3.5" />
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

  const openModal = (promo: Promocion) => {
    setSelectedPromo(promo)
    setIsModalOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedPromo(null)
    document.body.style.overflow = 'unset'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 animate-spin" style={{ borderColor: `${primaryColor}30`, borderTopColor: primaryColor }} />
          <Sparkles className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ color: primaryColor }} />
        </div>
        <p className="text-xs tracking-[0.2em] uppercase font-medium text-stone-400 dark:text-stone-500">
          Cargando experiencias exclusivas...
        </p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-[#0f0c1b]' : 'bg-gradient-to-br from-pink-50/30 via-white to-amber-50/20'
    }`}>

      {/* HEADER - REDUCIDO */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ background: brandGradient }} />
        <div className="relative max-w-7xl mx-auto px-4 py-4 md:py-6">
          <Link 
            href="/portal" 
            className="inline-flex items-center gap-2 text-[10px] tracking-widest font-semibold uppercase text-stone-500 dark:text-stone-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-light tracking-tight">
                <span className={isDark ? 'text-white' : 'text-stone-900'}>
                  Ofertas{' '}
                </span>
                <span className="font-serif italic font-light" style={{ color: primaryColor }}>
                  Exclusivas
                </span>
              </h1>
              <p className="text-[10px] tracking-[0.2em] text-stone-400 dark:text-stone-500 uppercase font-medium mt-1">
                Oportunidades por tiempo limitado
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/50 dark:bg-stone-900/50 border-pink-100/60 dark:border-fuchsia-950">
                <Zap className="w-3 h-3" style={{ color: primaryColor }} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-stone-600 dark:text-stone-400">
                  {promociones.filter(p => p.featured).length} Destacadas
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS - STICKY PEGADO AL BORDE (CORREGIDO) */}
      <div className={`sticky top-0 z-50 border-b transition-all duration-300 backdrop-blur-md ${
        isDark 
          ? 'bg-[#0f0c1b]/95 border-fuchsia-950/30 shadow-[0_-1px_0_rgba(15,12,27,1)]' 
          : 'bg-white/95 border-pink-100/60 shadow-[0_-1px_0_rgba(255,255,255,1)]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="w-full md:max-w-md relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-stone-500' : 'text-stone-400'
            }`} />
            <input
              type="text"
              placeholder="Buscar promociones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-11 pr-10 py-2.5 rounded-full border text-sm transition-all focus:outline-none focus:ring-2 ${
                isDark 
                  ? 'bg-[#130f24] border-fuchsia-950 text-white placeholder-stone-500' 
                  : 'bg-stone-50 border-pink-100/60 text-stone-900 placeholder-stone-400'
              }`}
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800"
              >
                <X className="w-3.5 h-3.5 text-stone-400" />
              </button>
            )}
          </div>

          <div className="w-full md:w-auto flex items-center justify-end gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-full text-xs font-medium flex items-center gap-2 border transition-all ${
                showFilters 
                  ? 'text-white border-transparent shadow-md'
                  : isDark
                    ? 'bg-[#130f24] border-fuchsia-950 text-stone-300 hover:bg-[#1a1430]'
                    : 'bg-white border-pink-100/60 text-stone-600 hover:bg-pink-50'
              }`}
              style={showFilters ? { background: brandGradient } : {}}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Categorías</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <div className={`flex rounded-full overflow-hidden border p-1 ${
              isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
            }`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-all ${
                  viewMode === 'grid'
                    ? 'text-white shadow-md'
                    : isDark ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
                }`}
                style={viewMode === 'grid' ? { background: brandGradient } : {}}
              >
                <Grid3x3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-all ${
                  viewMode === 'list'
                    ? 'text-white shadow-md'
                    : isDark ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
                }`}
                style={viewMode === 'list' ? { background: brandGradient } : {}}
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-4 pb-4">
                <div className={`flex flex-wrap gap-2 p-3 rounded-2xl border ${
                  isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-stone-50/50 border-pink-100/60'
                }`}>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                      selectedCategory === 'all'
                        ? 'text-white shadow-md'
                        : isDark
                          ? 'bg-[#0f0c1b] border-fuchsia-950 text-stone-400 hover:text-stone-200'
                          : 'bg-white border-pink-100/60 text-stone-600 hover:bg-pink-50'
                    }`}
                    style={selectedCategory === 'all' ? { background: brandGradient } : {}}
                  >
                    Todas
                  </button>
                  {['flash', 'premium', 'seasonal', 'welcome'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                        selectedCategory === cat
                          ? 'text-white shadow-md'
                          : isDark
                            ? 'bg-[#0f0c1b] border-fuchsia-950 text-stone-400 hover:text-stone-200'
                            : 'bg-white border-pink-100/60 text-stone-600 hover:bg-pink-50'
                      }`}
                      style={selectedCategory === cat ? { background: brandGradient } : {}}
                    >
                      {getCategoryIcon(cat)}
                      {getCategoryLabel(cat)}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CONTENIDO */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between text-xs tracking-widest uppercase font-medium text-stone-400 dark:text-stone-500 mb-6">
          <span>{filteredPromociones.length} promociones</span>
          {filteredPromociones.length > 0 && <span>✦ Exclusivas</span>}
        </div>

        <AnimatePresence mode="wait">
          {filteredPromociones.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-24 rounded-3xl border-2 border-dashed max-w-md mx-auto space-y-4"
              style={{ borderColor: `${primaryColor}30` }}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                isDark ? 'bg-[#130f24]' : 'bg-pink-50'
              }`}>
                <Gift className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-sm font-bold text-stone-800 dark:text-white">Sin resultados</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                No hay promociones activas con estos filtros.
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-6 py-2 rounded-full text-white text-xs font-bold uppercase tracking-widest transition hover:scale-105 active:scale-95"
                  style={{ background: brandGradient }}
                >
                  Limpiar filtros
                </button>
              )}
            </motion.div>
          ) : viewMode === 'grid' ? (
            <motion.div
              key="grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredPromociones.map((promo) => (
                <motion.div key={promo.id} variants={itemVariants}>
                  <PromocionCard
                    promo={promo}
                    isDark={isDark}
                    copiedCode={copiedCode}
                    onCopy={copyCode}
                    onOpenModal={openModal}
                    primaryColor={primaryColor}
                    brandGradient={brandGradient}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4 max-w-4xl mx-auto"
            >
              {filteredPromociones.map((promo) => (
                <motion.div key={promo.id} variants={itemVariants}>
                  <PromocionListItem
                    promo={promo}
                    isDark={isDark}
                    copiedCode={copiedCode}
                    onCopy={copyCode}
                    primaryColor={primaryColor}
                    brandGradient={brandGradient}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODAL DETALLE */}
      <AnimatePresence>
        {isModalOpen && selectedPromo && (
          <PromocionModal
            promo={selectedPromo}
            onClose={closeModal}
            isDark={isDark}
            primaryColor={primaryColor}
            brandGradient={brandGradient}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================
// COMPONENTE: Tarjeta de Promoción (Grid)
// ============================================================
function PromocionCard({ 
  promo, 
  isDark, 
  copiedCode, 
  onCopy,
  onOpenModal,
  primaryColor,
  brandGradient
}: { 
  promo: Promocion
  isDark: boolean
  copiedCode: string | null
  onCopy: (code: string) => void
  onOpenModal: (promo: Promocion) => void
  primaryColor: string
  brandGradient: string
}) {
  const isFlash = promo.category === 'flash'
  const isPremium = promo.category === 'premium'

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 ${
        isDark 
          ? 'bg-[#130f24] border-fuchsia-950 hover:border-fuchsia-800' 
          : 'bg-white border-pink-200 hover:border-pink-400 shadow-sm'
      }`}
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
        isDark ? 'bg-white/5' : 'bg-pink-50/50'
      }`} />

      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest text-white shadow-lg ${
          isFlash ? 'bg-gradient-to-r from-red-500 to-red-600' :
          isPremium ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
          'bg-gradient-to-r from-purple-500 to-purple-600'
        }`}>
          {getCategoryIcon(promo.category)}
          {getCategoryLabel(promo.category)}
        </span>
        {promo.featured && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest bg-amber-400 text-stone-900 shadow-lg">
            <Star className="w-2.5 h-2.5 fill-current" /> Destacado
          </span>
        )}
      </div>

      <button 
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
        onClick={() => {}}
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>

      {promo.image_url ? (
        <div className="relative aspect-video overflow-hidden bg-stone-100 dark:bg-stone-800">
          <img 
            src={promo.image_url} 
            alt={promo.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900">
          <Percent className="w-16 h-16 text-stone-300 dark:text-stone-600" />
        </div>
      )}

      <div className="p-5 space-y-3">
        <h3 className="text-lg font-bold tracking-tight line-clamp-1 text-stone-900 dark:text-white">
          {promo.title}
        </h3>
        <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
          {promo.description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-fuchsia-950">
          <div>
            {promo.discount_percent > 0 && (
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold" style={{ color: primaryColor }}>
                  {promo.discount_percent}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                  Off
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {promo.code && (
              <button
                onClick={() => onCopy(promo.code!)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  copiedCode === promo.code
                    ? 'bg-emerald-500 text-white'
                    : isDark
                      ? 'bg-[#0f0c1b] text-stone-300 hover:bg-stone-800'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {copiedCode === promo.code ? (
                  <><Check className="w-3 h-3 inline mr-1" /> Copiado</>
                ) : (
                  <><Copy className="w-3 h-3 inline mr-1" /> {promo.code}</>
                )}
              </button>
            )}
            
            <button
              onClick={() => onOpenModal(promo)}
              className="px-4 py-2 rounded-xl text-white text-[10px] font-bold uppercase tracking-widest transition hover:scale-105 active:scale-95"
              style={{ background: brandGradient }}
            >
              Ver más
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[9px] text-stone-500 dark:text-stone-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(promo.valid_until).toLocaleDateString('es-ES', { 
              day: '2-digit', 
              month: 'short',
              year: 'numeric'
            })}
          </span>
          {promo.uses_limit && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {promo.uses_count || 0}/{promo.uses_limit}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================
// COMPONENTE: Promoción en Vista Lista
// ============================================================
function PromocionListItem({ 
  promo, 
  isDark, 
  copiedCode, 
  onCopy,
  primaryColor,
  brandGradient
}: { 
  promo: Promocion
  isDark: boolean
  copiedCode: string | null
  onCopy: (code: string) => void
  primaryColor: string
  brandGradient: string
}) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`group rounded-2xl border p-4 transition-all ${
        isDark 
          ? 'bg-[#130f24] border-fuchsia-950 hover:border-fuchsia-800' 
          : 'bg-white border-pink-200 hover:border-pink-400 shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {promo.image_url ? (
          <img 
            src={promo.image_url} 
            alt={promo.title} 
            className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-stone-200 dark:border-fuchsia-950"
          />
        ) : (
          <div className={`w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isDark ? 'bg-[#0f0c1b]' : 'bg-stone-100'
          }`}>
            <Percent className="w-8 h-8 text-stone-400 dark:text-stone-600" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold tracking-tight text-stone-900 dark:text-white">
              {promo.title}
            </h3>
            {promo.featured && (
              <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/20">
                Destacado
              </span>
            )}
            <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
              promo.category === 'flash' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
              promo.category === 'premium' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
              'bg-purple-500/20 text-purple-600 dark:text-purple-400'
            }`}>
              {getCategoryLabel(promo.category)}
            </span>
          </div>

          <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-1 mt-1">
            {promo.description}
          </p>

          <div className="flex items-center gap-4 mt-2">
            {promo.discount_percent > 0 && (
              <span className="text-lg font-bold" style={{ color: primaryColor }}>
                {promo.discount_percent}% Off
              </span>
            )}
            <span className="text-[10px] text-stone-500 dark:text-stone-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(promo.valid_until).toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: 'short' 
              })}
            </span>
          </div>
        </div>

        {promo.code && (
          <button
            onClick={() => onCopy(promo.code!)}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
              copiedCode === promo.code
                ? 'bg-emerald-500 text-white'
                : isDark
                  ? 'bg-[#0f0c1b] text-stone-300 hover:bg-stone-800'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {copiedCode === promo.code ? '✓ Copiado' : `Usar ${promo.code}`}
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================
// COMPONENTE: Modal de Detalle
// ============================================================
function PromocionModal({ 
  promo, 
  onClose, 
  isDark,
  primaryColor,
  brandGradient
}: { 
  promo: Promocion
  onClose: () => void
  isDark: boolean
  primaryColor: string
  brandGradient: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-white border-pink-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5 text-stone-400" />
        </button>

        {promo.image_url && (
          <div className="rounded-2xl overflow-hidden mb-4 aspect-video">
            <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-stone-900 dark:text-white">
              {promo.title}
            </h3>
            {promo.featured && (
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            )}
          </div>

          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            {promo.description}
          </p>

          {promo.discount_percent > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Percent className="w-5 h-5 text-emerald-500" />
              <span className="text-lg font-bold text-emerald-500">{promo.discount_percent}% de descuento</span>
            </div>
          )}

          {promo.terms && (
            <div className="p-3 rounded-xl bg-stone-100 dark:bg-[#130f24] border border-stone-200 dark:border-fuchsia-950">
              <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                <span className="font-bold uppercase tracking-widest">Términos:</span> {promo.terms}
              </p>
            </div>
          )}

          {promo.code && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(promo.code!)
              }}
              className="w-full py-3 rounded-xl text-white text-sm font-bold uppercase tracking-widest transition hover:scale-[1.02] active:scale-95"
              style={{ background: brandGradient }}
            >
              <Copy className="w-4 h-4 inline mr-2" /> Usar código {promo.code}
            </button>
          )}

          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Válido hasta {new Date(promo.valid_until).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </span>
            {promo.uses_limit && (
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {promo.uses_count || 0}/{promo.uses_limit} usos
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============================================================
// HELPERS
// ============================================================
function getCategoryIcon(category: string) {
  switch (category) {
    case 'flash': return <Flame className="w-3 h-3" />
    case 'premium': return <Diamond className="w-3 h-3" />
    case 'welcome': return <Gift className="w-3 h-3" />
    case 'seasonal': return <Sparkles className="w-3 h-3" />
    default: return <Tag className="w-3 h-3" />
  }
}

function getCategoryLabel(category: string) {
  switch (category) {
    case 'flash': return 'Flash'
    case 'premium': return 'Premium'
    case 'welcome': return 'Bienvenida'
    case 'seasonal': return 'Temporada'
    default: return 'Especial'
  }
}
