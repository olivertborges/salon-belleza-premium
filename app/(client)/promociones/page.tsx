'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Sparkles, 
  Gift, 
  Clock, 
  Tag, 
  Percent, 
  Crown,
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
  Loader
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

export default function PromocionesPage() {
  const { tenantId } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const [promociones, setPromociones] = useState<Promocion[]>([])
  const [filteredPromociones, setFilteredPromociones] = useState<Promocion[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Cursor interactivo premium
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 })
  const [isHoveringCard, setIsHoveringCard] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    loadPromociones()
  }, [])

  const loadPromociones = async () => {
    try {
      let query = supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .order('featured', { ascending: false })
        .order('valid_until', { ascending: true })
      
      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      }
      
      const { data, error } = await query

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
      case 'premium': return <Crown className="w-3.5 h-3.5" />
      case 'welcome': return <Gift className="w-3.5 h-3.5" />
      case 'seasonal': return <Sparkles className="w-3.5 h-3.5" />
      default: return <Tag className="w-3.5 h-3.5" />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'flash': return 'Flash Sale'
      case 'premium': return 'Premium Lounge'
      case 'welcome': return 'Bienvenida'
      case 'seasonal': return 'Temporada'
      default: return 'Especial'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-neutral-950 flex flex-col items-center justify-center gap-4">
        <Loader className="w-6 h-6 text-[#FF2A75] animate-spin stroke-[1.5]" />
        <span className="text-xs tracking-[0.2em] uppercase text-[#B8965A] dark:text-[#C9A96E] font-medium font-sans">Sincronizando Ofertas Exclusivas...</span>
      </div>
    )
  }

  return (
    <div className="bg-[#FDFBF7] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 min-h-screen relative overflow-x-hidden selection:bg-[#FF2A75]/20 font-sans transition-colors duration-300">
      
      {/* CURSOR INTERACTIVO EDITORIAL */}
      <div 
        className="hidden md:block fixed pointer-events-none z-50 rounded-full border transition-all duration-75 ease-out -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
        style={{
          left: `${mousePos.x}px`,
          top: `${mousePos.y}px`,
          width: isHoveringCard ? '60px' : '30px',
          height: isHoveringCard ? '60px' : '30px',
          borderColor: isHoveringCard ? '#FF2A75' : '#C9A96E',
          backgroundColor: isHoveringCard ? 'rgba(255, 42, 117, 0.1)' : 'transparent'
        }}
      >
        {isHoveringCard && (
          <div className="w-full h-full flex items-center justify-center text-[9px] font-light text-white font-mono">GET</div>
        )}
      </div>

      {/* HEADER EDITORIAL */}
      <div className="relative border-b border-neutral-300 dark:border-neutral-800/60 overflow-hidden bg-white dark:bg-transparent">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-100/30 dark:from-neutral-900/40 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 py-16 space-y-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-[10px] tracking-widest font-semibold uppercase text-neutral-500 dark:text-neutral-400 hover:text-[#FF2A75] dark:hover:text-[#FF2A75] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2]" /> Volver al Atelier
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-7xl font-light tracking-[0.1em] uppercase font-serif leading-none text-neutral-900 dark:text-white">
                Ofertas <span className="font-serif italic font-light text-[#B8965A] dark:text-[#C9A96E] normal-case">Exclusivas</span>
              </h1>
              <p className="text-xs font-sans tracking-[0.2em] text-neutral-500 dark:text-neutral-400 uppercase font-medium">
                Oportunidades de diseño y vanguardia por tiempo limitado
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[10px] tracking-[0.25em] font-bold uppercase px-4 py-2 rounded-full border bg-white dark:bg-neutral-900/40 border-neutral-300 dark:border-neutral-800 text-[#B8965A] dark:text-[#C9A96E] shadow-xs">
                <Zap className="w-3 h-3 inline mr-1 text-[#FF2A75] fill-current" />
                {promociones.filter(p => p.featured).length} Destacadas de la firma
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS Y CONTROLES */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-[#FDFBF7]/90 dark:bg-neutral-950/80 border-b border-neutral-300 dark:border-neutral-800/60 transition-colors duration-300 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {/* Campo de búsqueda */}
          <div className="w-full md:max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 dark:text-neutral-400 stroke-[1.5]" />
            <input
              type="text"
              placeholder="Escriba estilo, código o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-full border text-xs tracking-wider transition-all bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#B8965A] border-neutral-300 dark:border-neutral-800 focus:border-[#B8965A]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800"
              >
                <X className="w-3.5 h-3.5 text-neutral-500" />
              </button>
            )}
          </div>

          {/* Filtros avanzados */}
          <div className="w-full md:w-auto flex items-center justify-end gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-3 rounded-full text-xs font-sans tracking-wider font-medium flex items-center gap-2 border transition-all ${
                showFilters 
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-transparent shadow-md' 
                  : 'bg-white dark:bg-neutral-900/60 border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 shadow-xs'
              }`}
            >
              <Filter className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Categorías</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform stroke-[1.5] ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Alternador de Layout */}
            <div className="flex rounded-full overflow-hidden border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-1 shadow-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-all ${
                  viewMode === 'grid'
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
              >
                <Grid3x3 className="w-3.5 h-3.5 stroke-[1.5]" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-all ${
                  viewMode === 'list'
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5 stroke-[1.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Panel de Categorías Desplegable */}
        {showFilters && (
          <div className="max-w-7xl mx-auto px-4 pb-6 transition-all">
            <div className="flex flex-wrap gap-2 bg-neutral-100/80 dark:bg-neutral-900/50 p-3 rounded-2xl border border-neutral-300 dark:border-neutral-800/50">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-xs font-sans tracking-wider font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-[#FF2A75] text-white shadow-md'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-700'
                }`}
              >
                Todo el Universo
              </button>
              {['flash', 'premium', 'seasonal', 'welcome'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-sans tracking-wider font-medium transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-[#FF2A75] text-white shadow-md'
                      : 'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-700'
                  }`}
                >
                  {getCategoryIcon(cat)}
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN PRINCIPAL DE CONTENIDOS */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        
        <div className="flex items-center justify-between text-[11px] font-sans tracking-widest uppercase text-neutral-500 dark:text-neutral-400 font-semibold">
          <span>{filteredPromociones.length} Piezas Encontradas</span>
          {filteredPromociones.length > 0 && <span>Curadas por Exclusividad</span>}
        </div>

        {filteredPromociones.length === 0 ? (
          <div className="text-center py-24 rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-800 max-w-md mx-auto space-y-4 bg-white dark:bg-transparent">
            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mx-auto">
              <Gift className="w-5 h-5 text-neutral-400 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-sans tracking-wider uppercase font-semibold text-neutral-800 dark:text-white">Búsqueda sin Resultados</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 font-light px-6">
                No encontramos ofertas activas con esos criterios. Limpia los filtros para redescubrir el portfolio.
              </p>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-5 py-2 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[10px] tracking-widest uppercase font-semibold transition-all"
              >
                Restaurar Filtros
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {filteredPromociones.map((promo) => (
              <PromocionCard
                key={promo.id}
                promo={promo}
                isDark={isDark}
                copiedCode={copiedCode}
                onCopy={copyCode}
                hoveredId={hoveredId}
                setHoveredId={setHoveredId}
                setIsHoveringCard={setIsHoveringCard}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {filteredPromociones.map((promo) => (
              <PromocionListItem
                key={promo.id}
                promo={promo}
                isDark={isDark}
                copiedCode={copiedCode}
                onCopy={copyCode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE: Tarjeta de Promoción Premium (Grid)
// ============================================================
function PromocionCard({ 
  promo, 
  isDark, 
  copiedCode, 
  onCopy,
  hoveredId,
  setHoveredId,
  setIsHoveringCard
}: { 
  promo: Promocion
  isDark: boolean
  copiedCode: string | null
  onCopy: (code: string) => void
  hoveredId: string | null
  setHoveredId: (id: string | null) => void
  setIsHoveringCard: (hovering: boolean) => void
}) {
  const isHovered = hoveredId === promo.id
  const isFlash = promo.category === 'flash'
  const isPremium = promo.category === 'premium'

  const cardBgStyle = promo.background_color 
    ? { backgroundImage: `linear-gradient(135deg, ${promo.background_color}cc, ${promo.accent_color || promo.background_color}ee)` }
    : undefined;

  const getGradientClass = () => {
    if (isFlash) return 'bg-gradient-to-br from-white dark:from-neutral-900 via-red-50/40 dark:via-red-950/20 to-white dark:to-neutral-950 border-red-300 dark:border-red-900/40'
    if (isPremium) return 'bg-gradient-to-br from-white dark:from-neutral-900 via-amber-50/50 dark:via-[#C9A96E]/10 to-white dark:to-neutral-950 border-[#B8965A]/40 dark:border-[#C9A96E]/30'
    return 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-800/80'
  }

  return (
    <div
      onMouseEnter={() => { setHoveredId(promo.id); setIsHoveringCard(true); }}
      onMouseLeave={() => { setHoveredId(null); setIsHoveringCard(false); }}
      className={`group relative rounded-2xl overflow-hidden border transition-all duration-500 ${getGradientClass()} ${
        isHovered ? 'scale-[1.02] shadow-xl border-neutral-400 dark:border-neutral-600 z-10' : 'shadow-xs'
      }`}
      style={cardBgStyle}
    >
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-[#FF2A75]/5 rounded-full blur-2xl transition-opacity group-hover:opacity-100" />
      
      <div className="p-6 space-y-5 relative z-10">
        
        <div className="flex justify-between items-start gap-2">
          <div className="flex gap-1.5 flex-wrap">
            {promo.featured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-400/30 text-[8px] font-mono tracking-widest uppercase font-bold">
                <Star className="w-2.5 h-2.5 fill-current" /> Destacado
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[8px] font-mono tracking-widest uppercase font-bold border ${
              promo.category === 'flash' ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30' :
              promo.category === 'premium' ? 'bg-[#C9A96E]/10 text-[#8F6F35] dark:text-[#C9A96E] border-[#B8965A]/30' :
              promo.category === 'welcome' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' :
              'bg-[#FF2A75]/10 text-[#FF2A75] border-[#FF2A75]/30'
            }`}>
              {promo.category === 'flash' && <Flame className="w-2.5 h-2.5 fill-current" />}
              {promo.category === 'premium' && <Crown className="w-2.5 h-2.5" />}
              {promo.category === 'welcome' && <Gift className="w-2.5 h-2.5" />}
              {promo.category === 'seasonal' && <Sparkles className="w-2.5 h-2.5" />}
              {promo.category}
            </span>
          </div>
          
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-[#FF2A75]">
            <Share2 className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>
        </div>

        {promo.image_url ? (
          <div className="rounded-xl overflow-hidden aspect-video w-full bg-neutral-100 dark:bg-neutral-950 relative border border-neutral-200 dark:border-neutral-800/40">
            <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </div>
        ) : (
          <div className="rounded-xl aspect-video w-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-950/40 border border-neutral-200 dynamic-border">
            <Percent className="w-10 h-10 text-neutral-400 dark:text-neutral-700 stroke-[1.5]" />
          </div>
        )}

        <div className="space-y-1">
          <h3 className="text-lg font-serif font-medium tracking-wide text-neutral-900 dark:text-white line-clamp-1">
            {promo.title}
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans font-light line-clamp-2 leading-relaxed">
            {promo.description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 pt-3 border-t border-neutral-200 dark:border-neutral-800/60">
          <div>
            {promo.discount_percent > 0 && (
              <div className="flex items-baseline gap-0.5">
                <span className="text-3xl font-mono font-light tracking-tighter text-[#FF2A75]">{promo.discount_percent}%</span>
                <span className="text-[9px] text-[#8F6F35] dark:text-[#C9A96E] font-bold tracking-widest uppercase">Off</span>
              </div>
            )}
            {promo.min_purchase && (
              <p className="text-[8px] text-neutral-500 dark:text-neutral-500 font-mono font-semibold uppercase tracking-widest mt-0.5">
                Mín: ${promo.min_purchase}
              </p>
            )}
          </div>

          {promo.code && (
            <button
              onClick={() => onCopy(promo.code!)}
              className={`px-4 py-2 rounded-lg text-[10px] font-mono tracking-widest uppercase transition-all duration-300 flex items-center gap-1.5 border shadow-2xs ${
                copiedCode === promo.code
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent'
                  : 'bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-800'
              }`}
            >
              {copiedCode === promo.code ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-neutral-500 dark:text-neutral-400" /> {promo.code}
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[9px] font-mono text-neutral-500 dark:text-neutral-500 pt-1">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 stroke-[1.5]" />
            <span>Validez: {new Date(promo.valid_until).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          </div>
          {promo.uses_limit && (
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3 stroke-[1.5]" />
              <span>{promo.uses_count || 0}/{promo.uses_limit} u.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE: Promoción en Vista Lista Minimalista
// ============================================================
function PromocionListItem({ 
  promo, 
  isDark, 
  copiedCode, 
  onCopy 
}: { 
  promo: Promocion
  isDark: boolean
  copiedCode: string | null
  onCopy: (code: string) => void
}) {
  return (
    <div className="group rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800/80 transition-all hover:border-neutral-400 dark:hover:border-neutral-700 hover:shadow-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        
        {promo.image_url ? (
          <img 
            src={promo.image_url} 
            alt={promo.title} 
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-neutral-200 dark:border-neutral-800/40"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800/40">
            <Percent className="w-6 h-6 text-neutral-400 dark:text-neutral-600 stroke-[1.5]" />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-base font-medium tracking-wide text-neutral-900 dark:text-white">{promo.title}</h3>
            {promo.featured && (
              <span className="text-[8px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-400/30">
                Destacado
              </span>
            )}
            <span className="text-[8px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
              {promo.category}
            </span>
          </div>
          
          <p className="text-xs font-sans font-light text-neutral-600 dark:text-neutral-400 line-clamp-1">
            {promo.description}
          </p>

          <div className="flex items-center gap-4 pt-1">
            {promo.discount_percent > 0 && (
              <span className="text-base font-mono font-medium text-[#FF2A75]">{promo.discount_percent}% Off</span>
            )}
            <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-500 flex items-center gap-1">
              <Clock className="w-3 h-3 stroke-[1.5]" />
              Hasta {new Date(promo.valid_until).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>

        {promo.code && (
          <button
            onClick={() => onCopy(promo.code!)}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-[10px] font-mono tracking-widest uppercase transition-all duration-300 border flex-shrink-0 shadow-2xs ${
              copiedCode === promo.code
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent'
                : 'bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-800'
            }`}
          >
            {copiedCode === promo.code ? '✓ Copiado' : `Usar ${promo.code}`}
          </button>
        )}
      </div>
    </div>
  )
}