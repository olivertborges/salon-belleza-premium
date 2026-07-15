// app/(client)/promociones-cliente/page.tsx
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
  Diamond,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Users
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
  hidden: { opacity: 0, y: 20, scale: 0.98 },
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
  const { user, tenantId, refreshUserData } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'

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
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
  }

  useEffect(() => {
    const checkUserAndLoad = async () => {
      if (!user) {
        await refreshUserData()
      }
      loadPromociones()
    }
    checkUserAndLoad()
  }, [tenantId, user])

  const loadPromociones = async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setPromociones(data || [])
      setFilteredPromociones(data || [])
    } catch (error) {
      console.error('Error cargando promociones:', error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ APLICAR PROMOCIÓN - CORREGIDO (usando full_name de profiles)
  const applyPromotion = async (promo: Promocion) => {
    if (!user) {
      setError('Debes iniciar sesión para usar esta promoción')
      setTimeout(() => setError(null), 3000)
      return
    }

    if (promo.uses_limit && promo.uses_count && promo.uses_count >= promo.uses_limit) {
      setError('Esta promoción ya no está disponible')
      setTimeout(() => setError(null), 3000)
      return
    }

    try {
      // ✅ OBTENER DATOS DEL CLIENTE - USANDO full_name DE profiles
      let clientName = 'Cliente'
      let clientEmail = user?.email || ''

      // Buscar en profiles (la columna es full_name)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle()

      if (profileData) {
        clientName = profileData.full_name || 'Cliente'
        clientEmail = profileData.email || user?.email || ''
        console.log('✅ Nombre encontrado en profiles:', clientName)
      }

      // 1. Incrementar contador de usos
      const { error: updateError } = await supabase
        .from('promotions')
        .update({ uses_count: (promo.uses_count || 0) + 1 })
        .eq('id', promo.id)

      if (updateError) throw updateError

      // 2. Registrar uso con nombre y email
      const { error: usageError } = await supabase
        .from('promotion_usage')
        .insert({
          promotion_id: promo.id,
          user_id: user.id,
          client_id: user.id,
          client_name: clientName,
          client_email: clientEmail,
          tenant_id: tenantId,
          action: 'applied',
          used_at: new Date().toISOString()
        })

      if (usageError) {
        console.error('Error registrando uso:', usageError)
      }

      // 3. Notificar al admin
      try {
        const { data: adminUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin')
          .eq('tenant_id', tenantId)
          .maybeSingle()

        if (adminUser) {
          await supabase
            .from('notifications')
            .insert({
              user_id: adminUser.id,
              tenant_id: tenantId,
              title: `🎉 Nueva promoción aplicada`,
              message: `${clientName} aplicó "${promo.title}" (${promo.discount_percent}% off)`,
              type: 'promo',
              read: false,
              created_at: new Date().toISOString()
            })
        }
      } catch (e) {}

      setAppliedPromo(promo.id)
      setSuccess(`¡Promoción "${promo.title}" aplicada con éxito!`)
      loadPromociones()

      setTimeout(() => {
        setSuccess(null)
        setAppliedPromo(null)
      }, 5000)

    } catch (error) {
      console.error('Error aplicando promoción:', error)
      setError('Error al aplicar la promoción. Intenta nuevamente.')
      setTimeout(() => setError(null), 3000)
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
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: primaryColor }} />
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse" style={{ color: primaryColor }}>
          Cargando Experiencias Exclusivas...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl p-[1px] shadow-xl" style={brandGradient}>
        <div className="absolute inset-0 opacity-20 animate-pulse" style={brandGradient} />
        <div className="relative z-10 rounded-[23px] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0f0c1b]">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3.5 rounded-2xl text-white shadow-md shrink-0" style={{ backgroundColor: primaryColor }}>
              <Gift className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold font-mono truncate" style={{ color: primaryColor }}>
                ✨ {settings?.business_name || 'Fresh Nails Studio'}
              </p>
              <h2 className="text-xl md:text-2xl font-serif font-extrabold text-stone-900 dark:text-white mt-0.5 truncate">
                Ofertas Exclusivas
              </h2>
              <p className="text-xs text-stone-500 dark:text-pink-100/60 mt-0.5 truncate">
                {filteredPromociones.length} promociones disponibles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto justify-end">
            <button 
              onClick={() => loadPromociones()} 
              disabled={refreshing} 
              className="px-3 py-2 rounded-xl bg-pink-50 dark:bg-fuchsia-950/40 border border-pink-100/60 dark:border-fuchsia-900/40 hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
              style={{ color: primaryColor }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <Link 
              href="/portal"
              className="px-3 py-2 rounded-xl text-white hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver
            </Link>
          </div>
        </div>
      </div>

      {/* MENSAJES */}
      {error && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-rose-500/10 to-pink-500/5 border border-rose-500/20 flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <p className="text-xs text-stone-700 dark:text-rose-400 font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-xs text-stone-700 dark:text-emerald-400 font-medium">{success}</p>
        </div>
      )}

      {/* KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl p-3 border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-black">Promociones</p>
            <h3 className="text-sm font-mono font-black text-stone-900 dark:text-pink-100">{promociones.length}</h3>
          </div>
        </div>
        <div className="rounded-2xl p-3 border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <Star className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-black">Destacadas</p>
            <h3 className="text-sm font-mono font-black text-amber-500">{promociones.filter(p => p.featured).length}</h3>
          </div>
        </div>
        <div className="rounded-2xl p-3 border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-black">Activas</p>
            <h3 className="text-sm font-mono font-black text-emerald-500">{promociones.length}</h3>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col md:flex-row gap-3 p-3 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <Search className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
          <input 
            type="text" 
            placeholder="Buscar promociones..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-stone-800 dark:text-pink-100 placeholder:text-stone-400 w-full"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border ${
              showFilters ? 'text-white border-transparent shadow-md' : 'bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950'
            }`}
            style={showFilters ? { background: brandGradient.backgroundImage } : {}}
          >
            <Filter className="w-3.5 h-3.5" /> Categorías
          </button>
          <div className="flex rounded-xl overflow-hidden border p-0.5 bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'text-white shadow-sm' : 'text-stone-400'}`} style={viewMode === 'grid' ? { background: brandGradient.backgroundImage } : {}}>
              <Grid3x3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'text-white shadow-sm' : 'text-stone-400'}`} style={viewMode === 'list' ? { background: brandGradient.backgroundImage } : {}}>
              <LayoutList className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 p-3 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
          <button onClick={() => setSelectedCategory('all')} className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${selectedCategory === 'all' ? 'text-white shadow-sm' : 'bg-stone-50 border-pink-100/60 text-stone-600'}`} style={selectedCategory === 'all' ? { background: brandGradient.backgroundImage } : {}}>
            Todas
          </button>
          {['flash', 'premium', 'seasonal', 'welcome'].map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all flex items-center gap-1 ${selectedCategory === cat ? 'text-white shadow-sm' : 'bg-stone-50 border-pink-100/60 text-stone-600'}`} style={selectedCategory === cat ? { background: brandGradient.backgroundImage } : {}}>
              {getCategoryIcon(cat)} {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      )}

      {/* GRID DE TARJETAS */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredPromociones.length === 0 ? (
          <div className="col-span-full text-center py-16 border border-dashed rounded-2xl border-pink-200 dark:border-fuchsia-950">
            <Gift className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-stone-500">No hay promociones disponibles</p>
          </div>
        ) : (
          filteredPromociones.map((promo) => (
            <motion.div key={promo.id} variants={itemVariants}>
              <PromocionCard
                promo={promo}
                isDark={isDark}
                copiedCode={copiedCode}
                onCopy={copyCode}
                onApply={applyPromotion}
                onOpenModal={openModal}
                primaryColor={primaryColor}
                brandGradient={brandGradient}
                appliedPromo={appliedPromo}
              />
            </motion.div>
          ))
        )}
      </motion.div>

      {/* MODAL */}
      {isModalOpen && selectedPromo && (
        <PromocionModal
          promo={selectedPromo}
          onClose={closeModal}
          onApply={applyPromotion}
          isDark={isDark}
          primaryColor={primaryColor}
          brandGradient={brandGradient}
          appliedPromo={appliedPromo}
        />
      )}
    </div>
  )
}

// ============================================================
// COMPONENTE: Tarjeta de Promoción
// ============================================================
function PromocionCard({ 
  promo, 
  isDark, 
  copiedCode, 
  onCopy,
  onApply,
  onOpenModal,
  primaryColor,
  brandGradient,
  appliedPromo
}: { 
  promo: Promocion
  isDark: boolean
  copiedCode: string | null
  onCopy: (code: string) => void
  onApply: (promo: Promocion) => void
  onOpenModal: (promo: Promocion) => void
  primaryColor: string
  brandGradient: { backgroundImage: string }
  appliedPromo: string | null
}) {
  const isFlash = promo.category === 'flash'
  const isPremium = promo.category === 'premium'
  const isApplied = appliedPromo === promo.id

  return (
    <div 
      className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer ${
        isApplied 
          ? 'border-emerald-500 shadow-emerald-500/20' 
          : isDark 
            ? 'bg-[#130f24] border-fuchsia-950 hover:border-fuchsia-800' 
            : 'bg-white border-pink-100/60 hover:border-pink-300 hover:shadow-lg'
      }`}
      onClick={() => onOpenModal(promo)}
    >
      {promo.image_url ? (
        <div className="relative aspect-video overflow-hidden bg-stone-100 dark:bg-stone-800">
          <img 
            src={promo.image_url} 
            alt={promo.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          {promo.discount_percent > 0 && (
            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-white text-lg font-bold border border-amber-400/30">
              -{promo.discount_percent}%
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900">
          <Percent className="w-12 h-12 text-stone-300 dark:text-stone-600" />
          {promo.discount_percent > 0 && (
            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-white text-lg font-bold border border-amber-400/30">
              -{promo.discount_percent}%
            </div>
          )}
        </div>
      )}

      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest text-white shadow-sm ${
          isFlash ? 'bg-gradient-to-r from-red-500 to-red-600' :
          isPremium ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
          'bg-gradient-to-r from-purple-500 to-purple-600'
        }`}>
          {getCategoryIcon(promo.category)}
          {getCategoryLabel(promo.category)}
        </span>
        {promo.featured && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest bg-amber-400 text-stone-900 shadow-sm">
            <Star className="w-2.5 h-2.5 fill-current" /> Destacado
          </span>
        )}
        {isApplied && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest bg-emerald-500 text-white shadow-sm">
            <CheckCircle2 className="w-2.5 h-2.5" /> Aplicada
          </span>
        )}
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-bold text-sm text-stone-800 dark:text-white line-clamp-1">
          {promo.title}
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
          {promo.description}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-pink-100/60 dark:border-fuchsia-950">
          <div className="flex items-center gap-2 text-[10px] text-stone-400 dark:text-stone-500">
            <Clock className="w-3 h-3" />
            {promo.valid_until ? new Date(promo.valid_until).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'Sin fecha'}
          </div>
          {promo.uses_limit && (
            <div className="flex items-center gap-1 text-[10px] text-stone-400">
              <Users className="w-3 h-3" />
              {promo.uses_count || 0}/{promo.uses_limit}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          {promo.code && (
            <button
              onClick={() => onCopy(promo.code!)}
              className={`flex-1 px-2 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${
                copiedCode === promo.code
                  ? 'bg-emerald-500 text-white'
                  : isDark
                    ? 'bg-[#0f0c1b] text-stone-300 hover:bg-stone-800'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {copiedCode === promo.code ? (
                <><Check className="w-3 h-3" /> Copiado</>
              ) : (
                <><Copy className="w-3 h-3" /> {promo.code}</>
              )}
            </button>
          )}
          
          <button
            onClick={() => onApply(promo)}
            disabled={!!appliedPromo}
            className={`flex-1 px-2 py-1.5 rounded-lg text-white text-[8px] font-bold uppercase tracking-widest transition hover:scale-105 active:scale-95 ${
              appliedPromo ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ background: brandGradient.backgroundImage }}
          >
            {appliedPromo === promo.id ? '✓ Aplicada' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE: Modal de Detalle
// ============================================================
function PromocionModal({ 
  promo, 
  onClose, 
  onApply,
  isDark,
  primaryColor,
  brandGradient,
  appliedPromo
}: { 
  promo: Promocion
  onClose: () => void
  onApply: (promo: Promocion) => void
  isDark: boolean
  primaryColor: string
  brandGradient: { backgroundImage: string }
  appliedPromo: string | null
}) {
  const isApplied = appliedPromo === promo.id

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div 
        className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-white border-pink-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <X className="w-5 h-5 text-stone-400" />
        </button>

        {promo.image_url && (
          <div className="rounded-2xl overflow-hidden mb-4 aspect-video">
            <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-stone-900 dark:text-white">{promo.title}</h3>
            {promo.featured && <Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
            {isApplied && (
              <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500 text-white">
                ✓ Aplicada
              </span>
            )}
          </div>

          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{promo.description}</p>

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

          <div className="flex gap-2">
            {promo.code && (
              <button onClick={() => navigator.clipboard.writeText(promo.code!)} className="flex-1 py-3 rounded-xl text-white text-sm font-bold uppercase tracking-widest transition hover:scale-[1.02] active:scale-95" style={{ background: brandGradient.backgroundImage }}>
                <Copy className="w-4 h-4 inline mr-2" /> Usar código {promo.code}
              </button>
            )}
            <button onClick={() => onApply(promo)} disabled={!!appliedPromo} className={`flex-1 py-3 rounded-xl text-white text-sm font-bold uppercase tracking-widest transition hover:scale-[1.02] active:scale-95 ${appliedPromo ? 'opacity-50 cursor-not-allowed' : ''}`} style={{ background: brandGradient.backgroundImage }}>
              {appliedPromo === promo.id ? '✓ Aplicada' : 'Aplicar ahora'}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Válido hasta {new Date(promo.valid_until).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
            {promo.uses_limit && (
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {promo.uses_count || 0}/{promo.uses_limit} usos
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
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