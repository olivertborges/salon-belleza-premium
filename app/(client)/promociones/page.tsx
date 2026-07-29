// @ts-nocheck
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
  Users,
  Crown,
  Gem,
  ArrowRight,
  Heart,
  Compass,
  Shield,
  Award,
  Sparkle,
  PartyPopper
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

const PromocionesLoadingSpinner = ({ isDark }: { isDark: boolean }) => (
  <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-500 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-16 h-16">
        <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
        <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
      </div>
      <p className={`text-[10px] tracking-[0.4em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]/60'}`}>
        Cargando ofertas exclusivas...
      </p>
    </div>
  </div>
)

export default function PromocionesCliente() {
  const { user, tenantId, refreshUserData } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'

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
      let clientName = 'Cliente'
      let clientEmail = user?.email || ''

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle()

      if (profileData) {
        clientName = profileData.full_name || 'Cliente'
        clientEmail = profileData.email || user?.email || ''
      }

      const { error: updateError } = await supabase
        .from('promotions')
        .update({ uses_count: (promo.uses_count || 0) + 1 })
        .eq('id', promo.id)

      if (updateError) throw updateError

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
      setSuccess(`🎉 ¡Promoción "${promo.title}" aplicada con éxito!`)
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
    return <PromocionesLoadingSpinner isDark={isDark} />
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-16 relative overflow-x-hidden ${
      isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'
    }`}>
      {/* Fondo texturizado */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-7xl mx-auto px-4 space-y-8 relative z-10">

        {/* ============================================================ */}
        {/* HEADER — PRESTIGE EDITION */}
        {/* ============================================================ */}
        <div className={`relative overflow-hidden rounded-2xl border p-7 md:p-10 shadow-lg transition-all duration-300 mt-4 ${
          isDark 
            ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_15px_35px_rgba(0,0,0,0.3)]' 
            : 'bg-white border-[#F0E4DA] shadow-[0_15px_35px_rgba(240,228,218,0.6)]'
        }`}>
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute -bottom-32 left-1/4 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none animate-[pulse_10s_ease-in-out_infinite] delay-1000" />
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_transparent_0%,_white_100%)] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full backdrop-blur-xl border ${
                isDark ? 'bg-[#D4AF37]/10 border-[#D4AF37]/20' : 'bg-[#D4AF37]/10 border-[#D4AF37]/20'
              }`}>
                <Sparkle className="w-3.5 h-3.5 text-[#D4AF37] animate-[spin_4s_linear_infinite]" />
                <span className={`text-[8px] uppercase tracking-[0.25em] font-black ${
                  isDark ? 'text-[#D4AF37]' : 'text-[#D4AF37]'
                }`}>
                  ✦ {settings?.business_name || 'Fresh Nails Studio'} ✦
                </span>
              </div>

              <h2 className={`text-3xl md:text-5xl font-black tracking-tight leading-[1.1] ${
                isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
              }`}>
                Ofertas{' '}
                <span className="font-serif italic font-light text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#E8D5A0] to-[#D4AF37] bg-[length:200%_auto] animate-[gradient_4s_ease-in-out_infinite]">
                  Exclusivas
                </span>
              </h2>
              <p className={`text-xs font-light tracking-wide ${
                isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
              }`}>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse mr-2" />
                {filteredPromociones.length} promociones disponibles para ti
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <button 
                onClick={() => loadPromociones()} 
                disabled={refreshing} 
                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-2 border shadow-lg group hover:scale-105 active:scale-95 ${
                  isDark 
                    ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588] hover:border-[#D4AF37]/40 hover:text-[#FFF9F6]' 
                    : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E] hover:border-[#D4AF37]/40 hover:text-[#1A0E0A]'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''} group-hover:rotate-180 transition-transform duration-500`} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>

              <Link 
                href="/portal"
                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 ${
                  isDark 
                    ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' 
                    : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37] hover:text-[#1A0E0A] shadow-[0_4px_15px_rgba(26,14,10,0.15)]'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300" /> 
                <span>Volver</span>
              </Link>
            </div>
          </div>

          <div className="absolute bottom-5 right-8 opacity-10 text-[#D4AF37] text-[10px] font-black tracking-[0.3em] select-none pointer-events-none">
            ✦ PROMOCIONES ✦
          </div>
        </div>

        {/* ============================================================ */}
        {/* MENSAJES */}
        {/* ============================================================ */}
        {error && (
          <div className={`flex items-start gap-4 border p-5 rounded-2xl transition-all duration-300 shadow-lg ${
            isDark 
              ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' 
              : 'bg-[#FFF9F6] border-[#D4AF37]/30 text-[#1A0E0A]'
          }`}>
            <div className={`p-2 rounded-xl shrink-0 ${
              isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
            }`}>
              <AlertCircle className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div className="space-y-0.5">
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
              }`}>Error</p>
              <p className={`text-sm font-light ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className={`flex items-start gap-4 border p-5 rounded-2xl transition-all duration-300 shadow-lg animate-fadeIn ${
            isDark 
              ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' 
              : 'bg-[#FFF9F6] border-[#D4AF37]/30 text-[#1A0E0A]'
          }`}>
            <div className={`p-2 rounded-xl shrink-0 ${
              isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
            }`}>
              <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div className="space-y-0.5">
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
              }`}>¡Éxito!</p>
              <p className={`text-sm font-light ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{success}</p>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* KPIS */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`group p-4 rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
            isDark 
              ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
              : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                isDark ? 'bg-[#3D281E] text-[#D4AF37]' : 'bg-[#FFF9F6] text-[#D4AF37]'
              }`}>
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-[8px] font-black font-mono uppercase tracking-[0.2em] ${
                  isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                }`}>Promociones</p>
                <h3 className={`font-serif text-2xl font-light ${
                  isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                }`}>{promociones.length}</h3>
              </div>
            </div>
          </div>

          <div className={`group p-4 rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
            isDark 
              ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
              : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                isDark ? 'bg-[#3D281E] text-[#D4AF37]' : 'bg-[#FFF9F6] text-[#D4AF37]'
              }`}>
                <Star className="w-4 h-4 fill-current" />
              </div>
              <div>
                <p className={`text-[8px] font-black font-mono uppercase tracking-[0.2em] ${
                  isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                }`}>Destacadas</p>
                <h3 className={`font-serif text-2xl font-light ${
                  isDark ? 'text-[#D4AF37]' : 'text-[#D4AF37]'
                }`}>{promociones.filter(p => p.featured).length}</h3>
              </div>
            </div>
          </div>

          <div className={`group p-4 rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
            isDark 
              ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
              : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                isDark ? 'bg-[#3D281E] text-[#D4AF37]' : 'bg-[#FFF9F6] text-[#D4AF37]'
              }`}>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-[8px] font-black font-mono uppercase tracking-[0.2em] ${
                  isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                }`}>Activas</p>
                <h3 className={`font-serif text-2xl font-light ${
                  isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                }`}>{promociones.length}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* FILTROS */}
        {/* ============================================================ */}
        <div className={`flex flex-col md:flex-row gap-3 p-4 rounded-2xl border transition-all duration-300 ${
          isDark 
            ? 'bg-[#2A1B14]/60 border-[#3D281E]' 
            : 'bg-white border-[#F0E4DA] shadow-[0_4px_15px_rgba(240,228,218,0.3)]'
        }`}>
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <Search className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
            <input 
              type="text" 
              placeholder="Buscar promociones..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`bg-transparent border-none outline-none text-xs w-full font-medium ${
                isDark ? 'text-[#FFF9F6] placeholder:text-[#A89588]' : 'text-[#1A0E0A] placeholder:text-[#A89588]'
              }`}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-1.5 border transition-all duration-300 ${
                showFilters 
                  ? isDark 
                    ? 'bg-[#D4AF37] text-[#1A0E0A] border-[#D4AF37] shadow-[0_2px_10px_rgba(212,175,55,0.2)]' 
                    : 'bg-[#1A0E0A] text-[#FFF9F6] border-[#1A0E0A] shadow-[0_2px_10px_rgba(26,14,10,0.15)]'
                  : isDark 
                    ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588]' 
                    : 'bg-white border-[#F0E4DA] text-[#5C4A3E]'
              }`}
            >
              <Filter className="w-3.5 h-3.5" /> Categorías
            </button>

            <div className={`flex rounded-xl overflow-hidden border p-0.5 ${
              isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
            }`}>
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-1.5 rounded-lg transition-all duration-300 ${
                  viewMode === 'grid' 
                    ? isDark ? 'bg-[#3D281E] text-[#D4AF37]' : 'bg-[#F0E4DA] text-[#1A0E0A]'
                    : isDark ? 'text-[#A89588] hover:text-[#FFF9F6]' : 'text-[#A89588] hover:text-[#1A0E0A]'
                }`}
              >
                <Grid3x3 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-1.5 rounded-lg transition-all duration-300 ${
                  viewMode === 'list' 
                    ? isDark ? 'bg-[#3D281E] text-[#D4AF37]' : 'bg-[#F0E4DA] text-[#1A0E0A]'
                    : isDark ? 'text-[#A89588] hover:text-[#FFF9F6]' : 'text-[#A89588] hover:text-[#1A0E0A]'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filtros desplegables */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`flex flex-wrap gap-2 p-3 rounded-2xl border overflow-hidden ${
                isDark 
                  ? 'bg-[#2A1B14]/60 border-[#3D281E]' 
                  : 'bg-white border-[#F0E4DA]'
              }`}
            >
              <button 
                onClick={() => setSelectedCategory('all')} 
                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                  selectedCategory === 'all' 
                    ? isDark 
                      ? 'bg-[#D4AF37] text-[#1A0E0A] shadow-[0_2px_10px_rgba(212,175,55,0.2)]' 
                      : 'bg-[#1A0E0A] text-[#FFF9F6] shadow-[0_2px_10px_rgba(26,14,10,0.15)]'
                    : isDark 
                      ? 'bg-[#1E120C] text-[#A89588] hover:text-[#FFF9F6]' 
                      : 'bg-[#FFF9F6] text-[#5C4A3E] hover:text-[#1A0E0A]'
                }`}
              >
                Todas
              </button>
              {['flash', 'premium', 'seasonal', 'welcome'].map((cat) => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)} 
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300 flex items-center gap-1 ${
                    selectedCategory === cat 
                      ? isDark 
                        ? 'bg-[#D4AF37] text-[#1A0E0A] shadow-[0_2px_10px_rgba(212,175,55,0.2)]' 
                        : 'bg-[#1A0E0A] text-[#FFF9F6] shadow-[0_2px_10px_rgba(26,14,10,0.15)]'
                      : isDark 
                        ? 'bg-[#1E120C] text-[#A89588] hover:text-[#FFF9F6]' 
                        : 'bg-[#FFF9F6] text-[#5C4A3E] hover:text-[#1A0E0A]'
                  }`}
                >
                  {getCategoryIcon(cat)} {getCategoryLabel(cat)}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================ */}
        {/* GRID DE TARJETAS */}
        {/* ============================================================ */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4'}`}
        >
          {filteredPromociones.length === 0 ? (
            <div className={`col-span-full text-center py-20 border border-dashed rounded-2xl transition-all duration-300 ${
              isDark 
                ? 'border-[#3D281E] bg-[#2A1B14]/40' 
                : 'border-[#F0E4DA] bg-white'
            }`}>
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 ${
                isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
              }`}>
                <Gift className={`w-9 h-9 ${isDark ? 'text-[#A89588]' : 'text-[#A89588]'}`} />
              </div>
              <p className={`text-sm font-medium ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                No hay promociones disponibles
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                Vuelve pronto para descubrir nuevas ofertas exclusivas
              </p>
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
                  appliedPromo={appliedPromo}
                  viewMode={viewMode}
                />
              </motion.div>
            ))
          )}
        </motion.div>

        {/* ============================================================ */}
        {/* MODAL */}
        {/* ============================================================ */}
        {isModalOpen && selectedPromo && (
          <PromocionModal
            promo={selectedPromo}
            onClose={closeModal}
            onApply={applyPromotion}
            isDark={isDark}
            appliedPromo={appliedPromo}
          />
        )}

      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes shine {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-shine {
          animation: shine 1.5s ease-in-out infinite;
        }
      `}</style>
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
  appliedPromo,
  viewMode
}: { 
  promo: Promocion
  isDark: boolean
  copiedCode: string | null
  onCopy: (code: string) => void
  onApply: (promo: Promocion) => void
  onOpenModal: (promo: Promocion) => void
  appliedPromo: string | null
  viewMode: 'grid' | 'list'
}) {
  const isFlash = promo.category === 'flash'
  const isPremium = promo.category === 'premium'
  const isApplied = appliedPromo === promo.id

  const cardContent = (
    <>
      <div className="relative overflow-hidden aspect-video">
        {promo.image_url ? (
          <>
            <img 
              src={promo.image_url} 
              alt={promo.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </>
        ) : (
          <div className={`flex items-center justify-center w-full h-full ${
            isDark ? 'bg-[#2A1B14]' : 'bg-[#FFF9F6]'
          }`}>
            <Percent className={`w-12 h-12 ${isDark ? 'text-[#A89588]' : 'text-[#A89588]'}`} />
          </div>
        )}

        {promo.discount_percent > 0 && (
          <div className="absolute top-3 right-3 px-3.5 py-2 rounded-xl bg-black/70 backdrop-blur-sm text-white shadow-xl border border-[#D4AF37]/30">
            <span className="text-xl font-black">-{promo.discount_percent}%</span>
          </div>
        )}

        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] text-white shadow-lg backdrop-blur-sm ${
            isFlash ? 'bg-gradient-to-r from-rose-500 to-rose-600' :
            isPremium ? 'bg-gradient-to-r from-[#D4AF37] to-[#E8D5A0] text-[#1A0E0A]' :
            'bg-gradient-to-r from-purple-500 to-purple-600'
          }`}>
            {getCategoryIcon(promo.category)}
            {getCategoryLabel(promo.category)}
          </span>
          {promo.featured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] bg-[#D4AF37] text-[#1A0E0A] shadow-lg">
              <Star className="w-2.5 h-2.5 fill-current" /> Destacado
            </span>
          )}
          {isApplied && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] bg-emerald-500 text-white shadow-lg">
              <CheckCircle2 className="w-2.5 h-2.5" /> Aplicada
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-3">
        <h3 className={`font-serif text-lg font-light tracking-wide transition-colors ${
          isDark ? 'text-[#FFF9F6] group-hover:text-[#D4AF37]' : 'text-[#1A0E0A] group-hover:text-[#D4AF37]'
        }`}>
          {promo.title}
        </h3>

        <p className={`text-xs font-light line-clamp-2 ${
          isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
        }`}>
          {promo.description}
        </p>

        <div className={`flex items-center justify-between pt-3 border-t ${
          isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
        }`}>
          <div className={`flex items-center gap-2 text-[9px] font-medium ${
            isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
          }`}>
            <Clock className="w-3 h-3 text-[#D4AF37]" />
            {promo.valid_until ? new Date(promo.valid_until).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'Sin fecha'}
          </div>
          {promo.uses_limit && (
            <div className={`flex items-center gap-1 text-[9px] font-medium ${
              isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
            }`}>
              <Users className="w-3 h-3 text-[#D4AF37]" />
              {promo.uses_count || 0}/{promo.uses_limit}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
          {promo.code && (
            <button
              onClick={() => onCopy(promo.code!)}
              className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-1.5 border ${
                copiedCode === promo.code
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg'
                  : isDark
                    ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588] hover:border-[#D4AF37]/40 hover:text-[#FFF9F6]'
                    : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E] hover:border-[#D4AF37]/40 hover:text-[#1A0E0A]'
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
            className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-1.5 shadow-lg hover:scale-105 active:scale-95 ${
              appliedPromo 
                ? 'opacity-40 cursor-not-allowed bg-stone-500' 
                : isDark 
                  ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' 
                  : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37] hover:text-[#1A0E0A] shadow-[0_4px_15px_rgba(26,14,10,0.15)]'
            }`}
          >
            {appliedPromo === promo.id ? (
              <><Check className="w-3 h-3" /> Aplicada</>
            ) : (
              <><PartyPopper className="w-3 h-3" /> Aplicar</>
            )}
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div 
      className={`group relative rounded-2xl overflow-hidden border transition-all duration-500 cursor-pointer hover:-translate-y-1 ${
        isApplied 
          ? 'border-[#D4AF37] shadow-[0_15px_40px_rgba(212,175,55,0.2)] scale-[1.02]' 
          : isDark 
            ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
            : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
      }`}
      onClick={() => onOpenModal(promo)}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-[#D4AF37]/[0.03] to-[#E8D5A0]/[0.01]" />

      {viewMode === 'list' ? (
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-1/3 shrink-0">{cardContent.props.children[0]}</div>
          <div className="sm:w-2/3">{cardContent.props.children[1]}</div>
        </div>
      ) : (
        cardContent
      )}
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
  appliedPromo
}: { 
  promo: Promocion
  onClose: () => void
  onApply: (promo: Promocion) => void
  isDark: boolean
  appliedPromo: string | null
}) {
  const isApplied = appliedPromo === promo.id
  const isFlash = promo.category === 'flash'
  const isPremium = promo.category === 'premium'

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`relative w-full max-w-md rounded-2xl border p-7 shadow-2xl max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={onClose} 
            className={`absolute top-4 right-4 p-2.5 rounded-full transition-all duration-300 hover:scale-110 ${
              isDark ? 'text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E]' : 'text-[#A89588] hover:text-[#1A0E0A] hover:bg-[#F0E4DA]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>

          {promo.image_url && (
            <div className="rounded-2xl overflow-hidden mb-5 aspect-video">
              <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-serif text-2xl font-light ${
                isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
              }`}>{promo.title}</h3>
              {promo.featured && (
                <Star className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37] animate-pulse" />
              )}
              {isApplied && (
                <span className="text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full bg-emerald-500 text-white shadow-lg">
                  ✓ Aplicada
                </span>
              )}
            </div>

            <p className={`text-sm font-light leading-relaxed ${
              isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
            }`}>
              {promo.description}
            </p>

            {promo.discount_percent > 0 && (
              <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                isDark ? 'bg-[#3D281E]/40 border-[#D4AF37]/30' : 'bg-[#FFF9F6] border-[#D4AF37]/30'
              }`}>
                <div className={`p-2 rounded-xl ${
                  isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
                }`}>
                  <Percent className={`w-5 h-5 text-[#D4AF37]`} />
                </div>
                <span className={`text-xl font-black text-[#D4AF37]`}>
                  {promo.discount_percent}% de descuento
                </span>
              </div>
            )}

            {promo.terms && (
              <div className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
              }`}>
                <p className={`text-[9px] leading-relaxed ${
                  isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                }`}>
                  <span className="font-black uppercase tracking-[0.15em]">Términos:</span> {promo.terms}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {promo.code && (
                <button 
                  onClick={() => navigator.clipboard.writeText(promo.code!)} 
                  className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 border ${
                    isDark 
                      ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588] hover:border-[#D4AF37]/40 hover:text-[#FFF9F6]' 
                      : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E] hover:border-[#D4AF37]/40 hover:text-[#1A0E0A]'
                  }`}
                >
                  <Copy className="w-4 h-4" /> Usar {promo.code}
                </button>
              )}
              <button 
                onClick={() => onApply(promo)} 
                disabled={!!appliedPromo} 
                className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 ${
                  appliedPromo ? 'opacity-40 cursor-not-allowed bg-stone-500' : isDark ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37] hover:text-[#1A0E0A]'
                }`}
              >
                {appliedPromo === promo.id ? (
                  <><Check className="w-4 h-4" /> Aplicada</>
                ) : (
                  <><PartyPopper className="w-4 h-4" /> Aplicar ahora</>
                )}
              </button>
            </div>

            <div className={`flex items-center justify-between text-xs pt-3 border-t ${
              isDark ? 'border-[#3D281E] text-[#A89588]' : 'border-[#F0E4DA] text-[#5C4A3E]'
            }`}>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#D4AF37]" />
                Válido hasta {new Date(promo.valid_until).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
              {promo.uses_limit && (
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#D4AF37]" />
                  {promo.uses_count || 0}/{promo.uses_limit} usos
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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