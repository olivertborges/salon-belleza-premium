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
    backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute w-48 h-48 bg-amber-500/5 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite] delay-300" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
            <Gift className="w-6 h-6 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-sm font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 animate-pulse">
              CARGANDO
            </p>
            <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              EXPERIENCIAS EXCLUSIVAS
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span 
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-pink-500/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-8 p-1 max-w-7xl mx-auto pb-16 antialiased transition-colors duration-700 ${
      isDark ? 'bg-gradient-to-b from-[#09090b] via-[#0d0d12] to-[#09090b]' : 'bg-gradient-to-b from-stone-50 via-white to-stone-50/30'
    }`}>

      {/* ============================================================ */}
      {/* HEADER — PRESTIGE EDITION */}
      {/* ============================================================ */}
      <div className={`relative overflow-hidden rounded-[2.5rem] border p-7 md:p-10 shadow-2xl transition-all duration-500 ${
        isDark 
          ? 'bg-gradient-to-br from-zinc-950 via-zinc-900/60 to-black border-zinc-900/60 shadow-[0_20px_60px_rgba(0,0,0,0.6)]' 
          : 'bg-gradient-to-br from-stone-900 via-stone-950 to-rose-950 border-stone-800/50 shadow-[0_20px_60px_rgba(219,91,154,0.12)]'
      }`}>
        {/* Efectos de luz ambiental */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none animate-[pulse_10s_ease-in-out_infinite] delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Rejilla decorativa */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_transparent_0%,_white_100%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full backdrop-blur-xl border ${
              isDark ? 'bg-pink-500/10 border-pink-500/20' : 'bg-white/20 border-white/30'
            }`}>
              <Sparkle className="w-3.5 h-3.5 text-amber-400 animate-[spin_4s_linear_infinite]" />
              <span className={`text-[8px] uppercase tracking-[0.25em] font-black ${
                isDark ? 'text-pink-300' : 'text-white'
              }`}>
                ✦ {settings?.business_name || 'Fresh Nails Studio'} ✦
              </span>
            </div>

            <h2 className={`text-3xl md:text-5xl font-black tracking-tight leading-[1.1] ${
              isDark ? 'text-white' : 'text-white'
            }`}>
              Ofertas{' '}
              <span className="font-serif italic font-light text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-amber-200 to-white bg-[length:200%_auto] animate-[gradient_4s_ease-in-out_infinite]">
                Exclusivas
              </span>
            </h2>
            <p className={`text-xs font-medium tracking-wide ${
              isDark ? 'text-stone-400' : 'text-pink-100/90'
            }`}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-2" />
              {filteredPromociones.length} promociones disponibles para ti
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button 
              onClick={() => loadPromociones()} 
              disabled={refreshing} 
              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-2 border shadow-lg group hover:scale-105 active:scale-95 ${
                isDark 
                  ? 'bg-stone-900/80 border-stone-800/80 text-stone-400 hover:border-pink-500/30 hover:text-white' 
                  : 'bg-white/90 border-pink-100/80 text-stone-600 hover:border-pink-300 hover:shadow-pink-200/20'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''} group-hover:rotate-180 transition-transform duration-500`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            
            <Link 
              href="/portal"
              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-2 shadow-xl group hover:scale-105 active:scale-95 ${
                isDark 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/30 hover:shadow-pink-500/50' 
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/30 hover:shadow-pink-500/50'
              }`}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300" /> 
              <span className="relative">Volver</span>
            </Link>
          </div>
        </div>

        {/* Decoración esquina */}
        <div className="absolute bottom-5 right-8 opacity-10 text-white text-[10px] font-black tracking-[0.3em] select-none pointer-events-none">
          ✦ PROMOCIONES ✦
        </div>
      </div>

      {/* ============================================================ */}
      {/* MENSAJES — REDISEÑADOS */}
      {/* ============================================================ */}
      {error && (
        <div className={`flex items-start gap-4 border p-5 rounded-2xl backdrop-blur-md transition-all duration-500 shadow-lg ${
          isDark 
            ? 'bg-gradient-to-r from-rose-500/10 to-rose-600/5 border-rose-500/20 text-rose-400 shadow-rose-500/5' 
            : 'bg-gradient-to-r from-rose-50/80 to-rose-100/40 border-rose-200/60 text-rose-800 shadow-rose-200/20'
        }`}>
          <div className={`p-2 rounded-xl shrink-0 ${
            isDark ? 'bg-rose-500/10' : 'bg-rose-100/50'
          }`}>
            <AlertCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="space-y-0.5">
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] font-mono ${
              isDark ? 'text-rose-400/80' : 'text-rose-700'
            }`}>Error</p>
            <p className={`text-sm font-medium ${
              isDark ? 'text-rose-300/90' : 'text-rose-800'
            }`}>{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className={`flex items-start gap-4 border p-5 rounded-2xl backdrop-blur-md transition-all duration-500 shadow-lg animate-fadeIn ${
          isDark 
            ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5' 
            : 'bg-gradient-to-r from-emerald-50/80 to-emerald-100/40 border-emerald-200/60 text-emerald-800 shadow-emerald-200/20'
        }`}>
          <div className={`p-2 rounded-xl shrink-0 ${
            isDark ? 'bg-emerald-500/10' : 'bg-emerald-100/50'
          }`}>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="space-y-0.5">
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] font-mono ${
              isDark ? 'text-emerald-400/80' : 'text-emerald-700'
            }`}>¡Éxito!</p>
            <p className={`text-sm font-medium ${
              isDark ? 'text-emerald-300/90' : 'text-emerald-800'
            }`}>{success}</p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* KPIS — REDISEÑADOS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`group p-4 rounded-2xl border shadow-lg transition-all duration-500 hover:-translate-y-0.5 hover:shadow-xl ${
          isDark 
            ? 'bg-stone-900/40 border-stone-900/60 shadow-black/20 hover:border-pink-500/30' 
            : 'bg-white/80 border-stone-200/60 shadow-stone-200/20 hover:border-pink-300/50 backdrop-blur-sm'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 ${
              isDark ? 'bg-pink-500/10 text-pink-400' : 'bg-pink-100/50 text-pink-600'
            }`}>
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <p className={`text-[8px] font-black font-mono uppercase tracking-[0.2em] ${
                isDark ? 'text-stone-500' : 'text-stone-400'
              }`}>Promociones</p>
              <h3 className={`text-xl font-black ${
                isDark ? 'text-white' : 'text-stone-800'
              }`}>{promociones.length}</h3>
            </div>
          </div>
        </div>
        
        <div className={`group p-4 rounded-2xl border shadow-lg transition-all duration-500 hover:-translate-y-0.5 hover:shadow-xl ${
          isDark 
            ? 'bg-stone-900/40 border-stone-900/60 shadow-black/20 hover:border-amber-500/30' 
            : 'bg-white/80 border-stone-200/60 shadow-stone-200/20 hover:border-amber-300/50 backdrop-blur-sm'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 ${
              isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100/50 text-amber-600'
            }`}>
              <Star className="w-4 h-4 fill-current" />
            </div>
            <div>
              <p className={`text-[8px] font-black font-mono uppercase tracking-[0.2em] ${
                isDark ? 'text-stone-500' : 'text-stone-400'
              }`}>Destacadas</p>
              <h3 className={`text-xl font-black ${
                isDark ? 'text-amber-400' : 'text-amber-600'
              }`}>{promociones.filter(p => p.featured).length}</h3>
            </div>
          </div>
        </div>
        
        <div className={`group p-4 rounded-2xl border shadow-lg transition-all duration-500 hover:-translate-y-0.5 hover:shadow-xl ${
          isDark 
            ? 'bg-stone-900/40 border-stone-900/60 shadow-black/20 hover:border-emerald-500/30' 
            : 'bg-white/80 border-stone-200/60 shadow-stone-200/20 hover:border-emerald-300/50 backdrop-blur-sm'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 ${
              isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100/50 text-emerald-600'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className={`text-[8px] font-black font-mono uppercase tracking-[0.2em] ${
                isDark ? 'text-stone-500' : 'text-stone-400'
              }`}>Activas</p>
              <h3 className={`text-xl font-black ${
                isDark ? 'text-emerald-400' : 'text-emerald-600'
              }`}>{promociones.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FILTROS — REDISEÑADOS */}
      {/* ============================================================ */}
      <div className={`flex flex-col md:flex-row gap-3 p-4 rounded-2xl border shadow-lg ${
        isDark 
          ? 'bg-[#130f24]/80 border-stone-900/60 shadow-black/20' 
          : 'bg-white/80 border-stone-200/60 shadow-stone-200/20 backdrop-blur-sm'
      }`}>
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <Search className={`w-4 h-4 shrink-0 ${
            isDark ? 'text-stone-500' : 'text-stone-400'
          }`} />
          <input 
            type="text" 
            placeholder="Buscar promociones..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`bg-transparent border-none outline-none text-xs w-full font-medium ${
              isDark ? 'text-white placeholder:text-stone-600' : 'text-stone-800 placeholder:text-stone-400'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-1.5 border transition-all duration-300 ${
              showFilters 
                ? 'text-white border-transparent shadow-md scale-105' 
                : isDark ? 'bg-[#0f0c1b] border-stone-800/60 text-stone-400' : 'bg-white border-stone-200/60 text-stone-500'
            }`}
            style={showFilters ? { background: brandGradient.backgroundImage } : {}}
          >
            <Filter className="w-3.5 h-3.5" /> Categorías
          </button>
          
          <div className={`flex rounded-xl overflow-hidden border p-0.5 ${
            isDark ? 'border-stone-800/60 bg-[#0f0c1b]' : 'border-stone-200/60 bg-white'
          }`}>
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-1.5 rounded-lg transition-all duration-300 ${
                viewMode === 'grid' 
                  ? 'text-white shadow-sm' 
                  : isDark ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
              }`}
              style={viewMode === 'grid' ? { background: brandGradient.backgroundImage } : {}}
            >
              <Grid3x3 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-1.5 rounded-lg transition-all duration-300 ${
                viewMode === 'list' 
                  ? 'text-white shadow-sm' 
                  : isDark ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
              }`}
              style={viewMode === 'list' ? { background: brandGradient.backgroundImage } : {}}
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
                ? 'bg-[#130f24]/80 border-stone-900/60' 
                : 'bg-white/80 border-stone-200/60 backdrop-blur-sm'
            }`}
          >
            <button 
              onClick={() => setSelectedCategory('all')} 
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                selectedCategory === 'all' 
                  ? 'text-white shadow-sm scale-105' 
                  : isDark ? 'bg-stone-900/40 text-stone-400 hover:text-stone-200' : 'bg-stone-50 border-pink-100/60 text-stone-600 hover:text-stone-800'
              }`}
              style={selectedCategory === 'all' ? { background: brandGradient.backgroundImage } : {}}
            >
              Todas
            </button>
            {['flash', 'premium', 'seasonal', 'welcome'].map((cat) => (
              <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)} 
                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300 flex items-center gap-1 ${
                  selectedCategory === cat 
                    ? 'text-white shadow-sm scale-105' 
                    : isDark ? 'bg-stone-900/40 text-stone-400 hover:text-stone-200' : 'bg-stone-50 border-pink-100/60 text-stone-600 hover:text-stone-800'
                }`}
                style={selectedCategory === cat ? { background: brandGradient.backgroundImage } : {}}
              >
                {getCategoryIcon(cat)} {getCategoryLabel(cat)}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* GRID DE TARJETAS — REDISEÑADO */}
      {/* ============================================================ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4'}`}
      >
        {filteredPromociones.length === 0 ? (
          <div className={`col-span-full text-center py-20 border border-dashed rounded-3xl transition-all duration-500 ${
            isDark 
              ? 'border-stone-800/60 bg-stone-900/20' 
              : 'border-stone-200/60 bg-white/40'
          }`}>
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 ${
              isDark ? 'bg-stone-800/50' : 'bg-stone-100'
            }`}>
              <Gift className={`w-9 h-9 ${
                isDark ? 'text-stone-600' : 'text-stone-400'
              }`} />
            </div>
            <p className={`text-sm font-medium ${
              isDark ? 'text-stone-300' : 'text-stone-700'
            }`}>
              No hay promociones disponibles
            </p>
            <p className={`text-xs mt-1 ${
              isDark ? 'text-stone-500' : 'text-stone-400'
            }`}>
              Vuelve pronto para descubrir nuevas ofertas exclusivas
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {['✨', '💎', '🌟'].map((emoji, i) => (
                <span key={i} className="text-lg animate-[bounce_2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.2}s` }}>
                  {emoji}
                </span>
              ))}
            </div>
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
                viewMode={viewMode}
              />
            </motion.div>
          ))
        )}
      </motion.div>

      {/* ============================================================ */}
      {/* MODAL — REDISEÑADO */}
      {/* ============================================================ */}
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
// COMPONENTE: Tarjeta de Promoción — REDISEÑADA
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
  appliedPromo,
  viewMode
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
  viewMode: 'grid' | 'list'
}) {
  const isFlash = promo.category === 'flash'
  const isPremium = promo.category === 'premium'
  const isApplied = appliedPromo === promo.id

  const cardContent = (
    <>
      {/* Imagen o placeholder */}
      <div className="relative overflow-hidden bg-stone-100 dark:bg-stone-800 aspect-video">
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
          <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900">
            <Percent className={`w-12 h-12 ${
              isDark ? 'text-stone-600' : 'text-stone-300'
            }`} />
          </div>
        )}

        {/* Badge de descuento */}
        {promo.discount_percent > 0 && (
          <div className="absolute top-3 right-3 px-3.5 py-2 rounded-xl bg-black/70 backdrop-blur-sm text-white shadow-xl border border-amber-400/30">
            <span className="text-xl font-black">-{promo.discount_percent}%</span>
          </div>
        )}

        {/* Badges de categoría */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] text-white shadow-lg backdrop-blur-sm ${
            isFlash ? 'bg-gradient-to-r from-red-500 to-red-600' :
            isPremium ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
            'bg-gradient-to-r from-purple-500 to-purple-600'
          }`}>
            {getCategoryIcon(promo.category)}
            {getCategoryLabel(promo.category)}
          </span>
          {promo.featured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] bg-amber-400 text-stone-900 shadow-lg">
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

      {/* Contenido */}
      <div className="p-5 space-y-3">
        <h3 className={`font-black text-sm tracking-tight line-clamp-1 transition-colors ${
          isDark ? 'text-stone-100 group-hover:text-pink-400' : 'text-stone-800 group-hover:text-pink-600'
        }`}>
          {promo.title}
        </h3>
        
        <p className={`text-xs line-clamp-2 ${
          isDark ? 'text-stone-400' : 'text-stone-500'
        }`}>
          {promo.description}
        </p>

        {/* Footer */}
        <div className={`flex items-center justify-between pt-3 border-t ${
          isDark ? 'border-stone-800/60' : 'border-stone-200/60'
        }`}>
          <div className={`flex items-center gap-2 text-[9px] font-medium ${
            isDark ? 'text-stone-400' : 'text-stone-500'
          }`}>
            <Clock className="w-3 h-3 text-pink-400" />
            {promo.valid_until ? new Date(promo.valid_until).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'Sin fecha'}
          </div>
          {promo.uses_limit && (
            <div className={`flex items-center gap-1 text-[9px] font-medium ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}>
              <Users className="w-3 h-3 text-pink-400" />
              {promo.uses_count || 0}/{promo.uses_limit}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
          {promo.code && (
            <button
              onClick={() => onCopy(promo.code!)}
              className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-1.5 border ${
                copiedCode === promo.code
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg'
                  : isDark
                    ? 'bg-stone-900/60 border-stone-800/60 text-stone-300 hover:border-pink-500/30 hover:text-white'
                    : 'bg-stone-50 border-stone-200/60 text-stone-600 hover:border-pink-300 hover:text-pink-600'
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
            className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] text-white transition-all duration-300 flex items-center justify-center gap-1.5 shadow-lg hover:scale-105 active:scale-95 ${
              appliedPromo ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            style={{ background: brandGradient.backgroundImage }}
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
      className={`group relative rounded-2xl overflow-hidden border transition-all duration-500 cursor-pointer ${
        isApplied 
          ? 'border-emerald-500 shadow-2xl shadow-emerald-500/20 scale-[1.02]' 
          : isDark 
            ? 'bg-gradient-to-br from-[#130f24]/80 to-[#130f24]/40 border-stone-900/60 hover:border-pink-500/30 hover:shadow-2xl shadow-lg' 
            : 'bg-gradient-to-br from-white via-stone-50/60 to-white border-stone-200/50 hover:border-pink-300/50 hover:shadow-2xl shadow-md'
      }`}
      onClick={() => onOpenModal(promo)}
    >
      {/* Gradiente de fondo sutil */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-pink-500/[0.03] to-rose-500/[0.01]" />
      
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
// COMPONENTE: Modal de Detalle — REDISEÑADO
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
          className={`relative w-full max-w-md rounded-3xl border p-7 shadow-2xl max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-white border-pink-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón cerrar */}
          <button 
            onClick={onClose} 
            className={`absolute top-4 right-4 p-2.5 rounded-full transition-all duration-300 hover:scale-110 ${
              isDark ? 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Imagen */}
          {promo.image_url && (
            <div className="rounded-2xl overflow-hidden mb-5 aspect-video">
              <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Contenido */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-2xl font-bold ${
                isDark ? 'text-white' : 'text-stone-900'
              }`}>{promo.title}</h3>
              {promo.featured && (
                <Star className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
              )}
              {isApplied && (
                <span className="text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full bg-emerald-500 text-white shadow-lg">
                  ✓ Aplicada
                </span>
              )}
            </div>

            <p className={`text-sm leading-relaxed ${
              isDark ? 'text-stone-400' : 'text-stone-600'
            }`}>
              {promo.description}
            </p>

            {/* Descuento */}
            {promo.discount_percent > 0 && (
              <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50/80 border-emerald-200/60'
              }`}>
                <div className={`p-2 rounded-xl ${
                  isDark ? 'bg-emerald-500/10' : 'bg-emerald-100/50'
                }`}>
                  <Percent className={`w-5 h-5 ${
                    isDark ? 'text-emerald-400' : 'text-emerald-500'
                  }`} />
                </div>
                <span className={`text-xl font-black ${
                  isDark ? 'text-emerald-400' : 'text-emerald-600'
                }`}>
                  {promo.discount_percent}% de descuento
                </span>
              </div>
            )}

            {/* Términos */}
            {promo.terms && (
              <div className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-stone-900/40 border-stone-800/60' : 'bg-stone-50/80 border-stone-200/60'
              }`}>
                <p className={`text-[9px] leading-relaxed ${
                  isDark ? 'text-stone-400' : 'text-stone-500'
                }`}>
                  <span className="font-black uppercase tracking-[0.15em]">Términos:</span> {promo.terms}
                </p>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3">
              {promo.code && (
                <button 
                  onClick={() => navigator.clipboard.writeText(promo.code!)} 
                  className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 ${
                    isDark 
                      ? 'bg-stone-900/60 border border-stone-800/60 text-stone-300 hover:border-pink-500/30 hover:text-white' 
                      : 'bg-stone-50 border border-stone-200/60 text-stone-600 hover:border-pink-300 hover:text-pink-600'
                  }`}
                >
                  <Copy className="w-4 h-4" /> Usar {promo.code}
                </button>
              )}
              <button 
                onClick={() => onApply(promo)} 
                disabled={!!appliedPromo} 
                className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 ${
                  appliedPromo ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                style={{ background: brandGradient.backgroundImage }}
              >
                {appliedPromo === promo.id ? (
                  <><Check className="w-4 h-4" /> Aplicada</>
                ) : (
                  <><PartyPopper className="w-4 h-4" /> Aplicar ahora</>
                )}
              </button>
            </div>

            {/* Footer info */}
            <div className={`flex items-center justify-between text-xs pt-3 border-t ${
              isDark ? 'border-stone-800/60 text-stone-500' : 'border-stone-200/60 text-stone-400'
            }`}>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-pink-400" />
                Válido hasta {new Date(promo.valid_until).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
              {promo.uses_limit && (
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-pink-400" />
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