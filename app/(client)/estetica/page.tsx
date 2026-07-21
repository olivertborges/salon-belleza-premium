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
  Star,
  Clock,
  Calendar,
  Crown,
  Droplets,
  Feather,
  Eye,
  Camera,
  Quote,
  Send,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  Grid3x3,
  LayoutList,
  StarHalf,
  Flower2,
  Gem,
  ArrowRight,
  Heart,
  Compass,
  Zap,
  Shield,
  Award,
  Sparkle,
  Sun,
  Moon,
  Wind
} from 'lucide-react'

interface Servicio {
  id: string
  name: string
  description: string
  price: number
  duration: number
  category: string
  icon: string
  is_active: boolean
  badge?: string
  image_url?: string
}

interface Review {
  id: string
  tenant_id: string
  client_id: string
  service_id: string
  rating: number
  comment: string
  created_at: string
  client_name?: string
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

export default function EsteticaPage() {
  const { theme } = useTheme()
  const { user, tenantId } = useAuth()
  const { settings } = useSettings()
  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'

  const [servicios, setServicios] = useState<Servicio[]>([])
  const [filteredServicios, setFilteredServicios] = useState<Servicio[]>([])
  const [reviews, setReviews] = useState<Record<string, Review[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('todos')
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedService, setSelectedService] = useState<Servicio | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'servicios' | 'galeria' | 'testimonios'>('servicios')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
  }

  useEffect(() => {
    cargarServicios()
    cargarReviews()
  }, [tenantId])

  useEffect(() => {
    let filtrados = servicios

    if (selectedCategory !== 'todos') {
      filtrados = filtrados.filter(s => s.category === selectedCategory)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtrados = filtrados.filter(s => 
        s.name.toLowerCase().includes(term) || 
        s.description?.toLowerCase().includes(term)
      )
    }

    setFilteredServicios(filtrados)
  }, [selectedCategory, searchTerm, servicios])

  const cargarServicios = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error

      const esteticaServices = (data || []).filter(s =>
        ['Estética', 'Facial', 'Corporal', 'Masajes', 'Depilación', 'Cejas'].includes(s.category)
      )

      setServicios(esteticaServices)
      setFilteredServicios(esteticaServices)

      const categorias = [...new Set(esteticaServices.map(s => s.category).filter(Boolean))] as string[]
      setCategoriasDisponibles(categorias)

    } catch (error) {
      console.error('Error cargando servicios de estética:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarReviews = async () => {
    if (!tenantId) return

    try {
      const reviewsMap: Record<string, Review[]> = {}

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          clients:client_id (name, avatar_url)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        data.forEach((review: any) => {
          const serviceId = review.service_id
          if (!reviewsMap[serviceId]) {
            reviewsMap[serviceId] = []
          }
          reviewsMap[serviceId].push({
            ...review,
            client_name: review.clients?.name || 'Cliente'
          })
        })
      }

      setReviews(reviewsMap)
    } catch (error) {
      console.error('Error cargando reviews:', error)
    }
  }

  const handleSubmitReview = async () => {
    if (!user) {
      setErrorMessage('Debes iniciar sesión para calificar')
      setTimeout(() => setErrorMessage(null), 3000)
      return
    }

    if (!tenantId) {
      setErrorMessage('No hay tenant disponible')
      setTimeout(() => setErrorMessage(null), 3000)
      return
    }

    if (rating === 0) {
      setErrorMessage('Selecciona una calificación')
      setTimeout(() => setErrorMessage(null), 3000)
      return
    }

    if (!comment.trim()) {
      setErrorMessage('Escribe un comentario')
      setTimeout(() => setErrorMessage(null), 3000)
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          tenant_id: tenantId,
          client_id: user.id,
          service_id: selectedService!.id,
          professional_id: null,
          rating: rating,
          comment: comment.trim(),
          images: [],
          is_approved: true,
          created_at: new Date().toISOString()
        })
        .select()

      if (error) throw error

      if (data) {
        const newReview: Review = {
          ...data[0],
          client_name: user.user_metadata?.name || user.email || 'Cliente'
        }
        setReviews(prev => ({
          ...prev,
          [selectedService!.id]: [newReview, ...(prev[selectedService!.id] || [])]
        }))
      }

      setSuccessMessage('✅ ¡Gracias por tu calificación!')
      setTimeout(() => setSuccessMessage(null), 3000)

      setShowReviewModal(false)
      setRating(0)
      setComment('')
      setSelectedService(null)

    } catch (error: any) {
      console.error('Error enviando review:', error)
      setErrorMessage('Error al enviar la calificación')
      setTimeout(() => setErrorMessage(null), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  const getAverageRating = (serviceId: string) => {
    const serviceReviews = reviews[serviceId] || []
    if (serviceReviews.length === 0) return 0
    const sum = serviceReviews.reduce((acc, r) => acc + r.rating, 0)
    return sum / serviceReviews.length
  }

  const getRatingCount = (serviceId: string) => {
    return reviews[serviceId]?.length || 0
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' }
    const sizeClass = sizes[size]
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className={`${sizeClass} fill-amber-400 text-amber-400`} />
        ))}
        {hasHalfStar && <StarHalf className={`${sizeClass} fill-amber-400 text-amber-400`} />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className={`${sizeClass} text-stone-300 dark:text-stone-600`} />
        ))}
      </div>
    )
  }

  const getIconForCategory = (cat: string) => {
    const map: Record<string, any> = {
      'Facial': Flower2,
      'Corporal': Droplets,
      'Masajes': Sparkles,
      'Depilación': Feather,
      'Cejas': Eye,
      'Estética': Sparkles
    }
    return map[cat] || Sparkles
  }

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Sparkles, Flower2, Droplets, Feather, Eye, Crown, Star
    }
    return icons[iconName] || Sparkles
  }

  const getBadgeColor = (badge?: string) => {
    switch(badge) {
      case 'Más Solicitado': return 'bg-rose-500/10 border-rose-500/20 text-rose-500'
      case 'Tendencia': return 'bg-violet-500/10 border-violet-500/20 text-violet-500'
      case 'Premium': return 'bg-amber-500/10 border-amber-500/20 text-amber-500'
      case 'Nuevo': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
      default: return 'bg-stone-500/10 border-stone-500/20 text-stone-500'
    }
  }

  const categoriasFiltro = [
    { id: 'todos', label: 'Todos', icon: Sparkles },
    ...categoriasDisponibles.map(cat => ({
      id: cat,
      label: cat,
      icon: getIconForCategory(cat)
    }))
  ]

  const categoriasFinal = categoriasFiltro.length > 1 ? categoriasFiltro : [
    { id: 'todos', label: 'Todos', icon: Sparkles },
    { id: 'Facial', label: 'Facial', icon: Flower2 },
    { id: 'Corporal', label: 'Corporal', icon: Droplets },
    { id: 'Masajes', label: 'Masajes', icon: Sparkles },
    { id: 'Depilación', label: 'Depilación', icon: Feather },
    { id: 'Cejas', label: 'Cejas', icon: Eye },
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute w-48 h-48 bg-amber-500/5 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite] delay-300" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
            <Sparkles className="w-6 h-6 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-sm font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 animate-pulse">
              CARGANDO
            </p>
            <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              BIENESTAR & MEDISPA
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
    <div className={`w-full min-h-screen overflow-x-hidden transition-colors duration-700 ${
      isDark ? 'bg-gradient-to-b from-[#09090b] via-[#0d0d12] to-[#09090b] text-stone-200' : 'bg-gradient-to-b from-stone-50 via-white to-stone-50/30 text-stone-800'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 relative">

        {/* Efectos de fondo */}
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[160px] bg-pink-500/[0.03] pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-[300px] h-[300px] rounded-full blur-[140px] bg-amber-500/[0.02] pointer-events-none" />

        {/* MENSAJES */}
        {errorMessage && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[999] px-6 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium backdrop-blur-xl shadow-2xl animate-fadeIn flex items-center gap-3 max-w-[90vw]">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium truncate">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[999] px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium backdrop-blur-xl shadow-2xl animate-fadeIn flex items-center gap-3 max-w-[90vw]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium truncate">{successMessage}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* HERO BANNER — PRESTIGE EDITION */}
        {/* ============================================================ */}
        <div className={`relative overflow-hidden rounded-[2.5rem] border p-7 md:p-10 shadow-2xl transition-all duration-500 mt-4 ${
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

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full backdrop-blur-xl border ${
                isDark ? 'bg-pink-500/10 border-pink-500/20' : 'bg-white/20 border-white/30'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                <span className={`text-[8px] uppercase tracking-[0.25em] font-black ${
                  isDark ? 'text-pink-300' : 'text-white'
                }`}>
                  ✦ Cuidado & Estética Avanzada ✦
                </span>
              </div>

              <h2 className={`text-3xl md:text-5xl font-black tracking-tight leading-[1.1] ${
                isDark ? 'text-white' : 'text-white'
              }`}>
                Bienestar &{' '}
                <span className="font-serif italic font-light text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-amber-200 to-white bg-[length:200%_auto] animate-[gradient_4s_ease-in-out_infinite]">
                  MediSpa
                </span>
              </h2>
              <p className={`text-xs font-medium tracking-wide max-w-md ${
                isDark ? 'text-stone-400' : 'text-pink-100/90'
              }`}>
                Tratamientos faciales, corporales y masajes para equilibrar cuerpo y mente.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className={`px-4 py-2.5 rounded-xl border text-[9px] font-mono font-black uppercase tracking-[0.15em] flex items-center gap-2 backdrop-blur-md shadow-lg ${
                isDark ? 'bg-stone-900/80 border-stone-800/80 text-stone-400' : 'bg-white/90 border-pink-100/80 text-stone-800 shadow-pink-200/20'
              }`}>
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                {servicios.length} Rituales
              </div>

              <Link
                href={user ? '/agenda' : '/login'}
                className="group relative overflow-hidden px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-2.5 transition-all duration-500 hover:-translate-y-0.5 active:scale-[0.97]"
                style={brandGradient}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
                <Calendar className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-500" />
                <span className="relative">Agendar Cita</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TABS NAVEGACIÓN — REDISEÑADOS */}
        {/* ============================================================ */}
        <div className={`flex border-b pb-0 mt-6 sm:mt-8 overflow-x-auto ${
          isDark ? 'border-stone-900/60' : 'border-stone-200/60'
        }`}>
          {[
            { id: 'servicios', label: 'Servicios', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'galeria', label: 'Galería', icon: <Camera className="w-4 h-4" /> },
            { id: 'testimonios', label: 'Testimonios', icon: <Quote className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative px-6 py-3.5 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-pink-500' 
                  : isDark ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
              }`}
              style={activeTab === tab.id ? { color: primaryColor } : {}}
            >
              {tab.icon}
              <span className="relative z-10">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.span 
                  layoutId="tabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ============================================================ */}
        {/* TAB: SERVICIOS — REDISEÑADO */}
        {/* ============================================================ */}
        {activeTab === 'servicios' && (
          <div className="mt-6 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className={`text-xs sm:text-sm font-black uppercase tracking-wider font-mono flex items-center gap-2 ${
                isDark ? 'text-stone-200' : 'text-stone-800'
              }`}>
                <Sparkles className="w-4 h-4 text-pink-500" />
                Filtrar Tratamientos
              </h3>
              {selectedCategory !== 'todos' && (
                <button
                  onClick={() => setSelectedCategory('todos')}
                  className="text-[10px] font-mono font-black uppercase tracking-widest text-pink-500 hover:text-pink-400 transition-colors flex items-center gap-1"
                >
                  Ver Todos <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Grid de Filtros Rápidos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {categoriasFinal.map((cat) => {
                const Icon = cat.icon
                const isActive = selectedCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-500 text-[10px] sm:text-xs relative overflow-hidden group ${
                      isActive
                        ? `text-white shadow-xl scale-[1.02] bg-gradient-to-r from-pink-500 to-rose-500 border-transparent`
                        : isDark
                          ? 'bg-stone-900/40 border-stone-900/60 text-stone-400 hover:border-pink-500/30 hover:text-stone-200'
                          : 'bg-white/80 border-stone-200/60 text-stone-500 hover:border-pink-300 hover:shadow-md'
                    }`}
                    >
                      {isActive && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white/60 animate-ping" />
                      )}
                      <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                        isActive ? 'text-white' : isDark ? 'text-stone-500 group-hover:text-pink-400' : 'text-stone-400 group-hover:text-pink-500'
                      }`} />
                      <span className="font-bold uppercase tracking-wide truncate">{cat.label}</span>
                    </button>
                  )
                }
              })}
            </div>

            {/* Buscador y Selectores */}
            <div className={`flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border shadow-lg ${
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
                  placeholder="Buscar tratamientos por nombre o descripción..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`bg-transparent border-none outline-none text-xs w-full font-medium min-w-0 ${
                    isDark ? 'text-white placeholder:text-stone-600' : 'text-stone-800 placeholder:text-stone-400'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-medium flex items-center gap-1.5 border transition-all duration-300 ${
                    showFilters 
                      ? 'text-white border-transparent shadow-md scale-105' 
                      : isDark ? 'bg-[#0f0c1b] border-stone-800/60 text-stone-400' : 'bg-white border-stone-200/60 text-stone-500'
                  }`}
                  style={showFilters ? { background: brandGradient.backgroundImage } : {}}
                >
                  <Filter className="w-3.5 h-3.5" /> Filtros
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

            {/* CONTENEDOR RENDERIZADO DE TRATAMIENTOS */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-3"}
            >
              {filteredServicios.length === 0 ? (
                <div className={`col-span-full border border-dashed rounded-3xl p-16 text-center transition-all duration-500 ${
                  isDark 
                    ? 'border-stone-800/60 bg-stone-900/20' 
                    : 'border-stone-200/60 bg-white/40 shadow-inner'
                }`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isDark ? 'bg-stone-800/50' : 'bg-pink-100/50'
                  }`}>
                    <Sparkles className={`w-8 h-8 ${
                      isDark ? 'text-stone-600' : 'text-pink-300'
                    }`} />
                  </div>
                  <p className={`text-sm font-black tracking-tight ${
                    isDark ? 'text-stone-300' : 'text-stone-700'
                  }`}>
                    No se encontraron tratamientos
                  </p>
                  <p className={`text-xs mt-1 ${
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  }`}>
                    Intenta con otros filtros o palabras clave
                  </p>
                </div>
              ) : (
                filteredServicios.map((servicio) => {
                  const Icon = getIcon(servicio.icon || 'Sparkles')
                  const badgeColor = getBadgeColor(servicio.badge)
                  const avgRating = getAverageRating(servicio.id)
                  const ratingCount = getRatingCount(servicio.id)

                  return (
                    <motion.div key={servicio.id} variants={itemVariants}>
                      <div
                        className={`group relative rounded-2xl border p-5 transition-all duration-500 transform hover:-translate-y-1.5 flex ${
                          viewMode === 'grid' ? 'flex-col justify-between min-h-[220px]' : 'flex-row gap-6 items-center'
                        } overflow-hidden cursor-pointer ${
                          isDark
                            ? 'bg-gradient-to-br from-[#130f24]/80 via-[#130f24]/40 to-[#130f24]/80 border-stone-900/60 hover:border-pink-500/30 hover:shadow-2xl shadow-lg'
                            : 'bg-gradient-to-br from-white via-stone-50/60 to-white border-stone-200/50 hover:border-pink-300/50 hover:shadow-2xl shadow-md'
                        }`}
                        onClick={() => {
                          setSelectedService(servicio)
                          setIsModalOpen(true)
                        }}
                      >
                        {/* Gradiente de fondo sutil */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-pink-500/[0.03] to-rose-500/[0.01]" />

                        {/* Badge flotante */}
                        {servicio.badge && viewMode === 'grid' && (
                          <span className={`absolute top-4 right-4 z-10 text-[7px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border ${badgeColor}`}>
                            {servicio.badge}
                          </span>
                        )}

                        <div className={viewMode === 'list' ? 'flex-1 flex gap-5 items-center min-w-0 relative z-10' : 'w-full relative z-10'}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shrink-0 ${
                            isDark ? 'bg-pink-500/10 border border-pink-500/20 text-pink-400' : 'bg-stone-50 border border-stone-100/80 text-pink-600'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className={`font-black text-sm tracking-tight transition-colors truncate ${
                                isDark ? 'text-stone-100 group-hover:text-pink-400' : 'text-stone-800 group-hover:text-pink-600'
                              }`}>
                                {servicio.name}
                              </h4>
                              {servicio.badge && viewMode === 'list' && (
                                <span className={`text-[7px] font-mono font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border ${badgeColor}`}>
                                  {servicio.badge}
                                </span>
                              )}
                            </div>
                            <p className={`text-[10px] leading-relaxed line-clamp-2 ${
                              isDark ? 'text-stone-400' : 'text-stone-500'
                            }`}>
                              {servicio.description || 'Tratamiento profesional estético de alta gama.'}
                            </p>

                            <div className="flex items-center gap-2 mt-1.5">
                              {avgRating > 0 ? (
                                <>
                                  {renderStars(avgRating, 'sm')}
                                  <span className={`text-[9px] font-bold ${
                                    isDark ? 'text-stone-400' : 'text-stone-600'
                                  }`}>{avgRating.toFixed(1)}</span>
                                  <span className={`text-[8px] ${
                                    isDark ? 'text-stone-500' : 'text-stone-400'
                                  }`}>({ratingCount})</span>
                                </>
                              ) : (
                                <span className={`text-[9px] ${
                                  isDark ? 'text-stone-500' : 'text-stone-400'
                                }`}>Sin calificaciones</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={`flex items-center justify-between border-dashed relative z-10 ${
                          viewMode === 'grid' ? 'border-t mt-3 pt-3.5' : 'flex-col sm:flex-row gap-2 border-l pl-5'
                        } ${isDark ? 'border-stone-800/60' : 'border-stone-200/60'}`}>
                          <div className="flex items-center gap-2.5 whitespace-nowrap">
                            <span className={`text-base font-mono font-black tracking-tight ${
                              isDark ? 'text-pink-400' : 'text-stone-950'
                            }`}>
                              ${servicio.price?.toLocaleString()}
                            </span>
                            <span className={`text-[8px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                              isDark ? 'text-stone-500' : 'text-stone-400'
                            }`}>
                              <Clock className="w-3 h-3 text-pink-400" />
                              {servicio.duration || 60} Min
                            </span>
                          </div>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setSelectedService(servicio)
                                setShowReviewModal(true)
                                setRating(0)
                                setComment('')
                              }}
                              className={`p-1.5 sm:p-2 rounded-xl transition-all duration-300 ${
                                isDark
                                  ? 'bg-stone-950/60 border border-stone-800/60 text-stone-400 hover:text-amber-400 hover:border-amber-500/30'
                                  : 'bg-stone-50 border border-stone-100/60 text-stone-400 hover:text-amber-500 hover:border-amber-300'
                              }`}
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                            <Link
                              href={user ? '/agenda' : '/login'}
                              className={`p-1.5 sm:p-2 rounded-xl transition-all duration-300 ${
                                isDark
                                  ? 'bg-stone-950/60 border border-stone-800/60 text-stone-400 hover:text-pink-400 hover:border-pink-500/30'
                                  : 'bg-stone-50 border border-stone-100/60 text-stone-500 hover:text-stone-950 hover:border-pink-300'
                              }`}
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </motion.div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB: GALERÍA — REDISEÑADA */}
        {/* ============================================================ */}
        {activeTab === 'galeria' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 mt-6">
            <p className={`text-sm text-center ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}>
              Descubre nuestro trabajo y resultados en estética
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { src: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=400&fit=crop', title: 'Tratamiento facial' },
                { src: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop', title: 'Limpieza profunda' },
                { src: 'https://images.unsplash.com/photo-1540555700478-4be6f5f1ccd7?w=400&h=400&fit=crop', title: 'Tratamiento corporal' },
                { src: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop', title: 'Bienestar' },
              ].map((img, idx) => (
                <motion.div 
                  key={idx} 
                  whileHover={{ scale: 1.03 }}
                  className={`relative aspect-square rounded-2xl overflow-hidden group cursor-pointer transition-all duration-500 ${
                    isDark ? 'shadow-black/20' : 'shadow-stone-200/20'
                  }`}
                >
                  <img src={img.src} alt={img.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-3">
                    <p className="text-white text-xs font-bold tracking-wide">{img.title}</p>
                  </div>
                  <div className="absolute top-3 left-3 text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white/80">
                    #{String(idx + 1).padStart(2, '0')}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* TAB: TESTIMONIOS — REDISEÑADO */}
        {/* ============================================================ */}
        {activeTab === 'testimonios' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 mt-6">
            <p className={`text-sm text-center ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}>
              Lo que dicen nuestros clientes sobre su experiencia
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(reviews).flat().length > 0 ? (
                Object.values(reviews).flat().slice(0, 6).map((review, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                    className={`group p-5 rounded-2xl border transition-all duration-500 hover:-translate-y-1 ${
                      isDark 
                        ? 'bg-gradient-to-br from-[#130f24]/80 to-[#130f24]/40 border-stone-900/60 hover:border-pink-500/30 hover:shadow-2xl' 
                        : 'bg-gradient-to-br from-white via-stone-50/60 to-white border-stone-200/50 hover:border-pink-300/50 hover:shadow-2xl'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-pink-500/20">
                        {review.client_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <p className={`font-black text-sm tracking-tight ${
                          isDark ? 'text-stone-100' : 'text-stone-800'
                        }`}>
                          {review.client_name}
                        </p>
                        <p className={`text-[10px] font-medium ${
                          isDark ? 'text-stone-500' : 'text-stone-400'
                        }`}>
                          Estética
                        </p>
                      </div>
                    </div>
                    <div className="flex text-amber-400 text-sm mb-2">
                      {[...Array(review.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className={`text-sm leading-relaxed ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}>
                      "{review.comment}"
                    </p>
                  </motion.div>
                ))
              ) : (
                [
                  { name: 'María González', comment: 'Los tratamientos faciales son increíbles. Mi piel nunca se había visto tan radiante.', rating: 5 },
                  { name: 'Laura Pérez', comment: 'El masaje corporal fue una experiencia relajante.', rating: 5 },
                  { name: 'Carmen Sánchez', comment: 'Me encanta el servicio de depilación. Rápido, indoloro y resultados perfectos.', rating: 5 },
                ].map((t, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                    className={`group p-5 rounded-2xl border transition-all duration-500 hover:-translate-y-1 ${
                      isDark 
                        ? 'bg-gradient-to-br from-[#130f24]/80 to-[#130f24]/40 border-stone-900/60 hover:border-pink-500/30 hover:shadow-2xl' 
                        : 'bg-gradient-to-br from-white via-stone-50/60 to-white border-stone-200/50 hover:border-pink-300/50 hover:shadow-2xl'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-pink-500/20">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className={`font-black text-sm tracking-tight ${
                          isDark ? 'text-stone-100' : 'text-stone-800'
                        }`}>
                          {t.name}
                        </p>
                        <p className={`text-[10px] font-medium ${
                          isDark ? 'text-stone-500' : 'text-stone-400'
                        }`}>
                          Estética
                        </p>
                      </div>
                    </div>
                    <div className="flex text-amber-400 text-sm mb-2">
                      {[...Array(t.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className={`text-sm leading-relaxed ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}>
                      "{t.comment}"
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* MODAL DETALLES DEL SERVICIO — REDISEÑADO */}
        {/* ============================================================ */}
        <AnimatePresence>
          {isModalOpen && selectedService && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)}>
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${
                isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-white border-pink-200'
              }`} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <X className="w-5 h-5 text-stone-400" />
                </button>
                <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
                  <img src={selectedService.image_url || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop'} alt={selectedService.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-bold">{selectedService.duration} min</div>
                </div>
                <h3 className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-stone-900'
                }`}>{selectedService.name}</h3>
                <p className={`text-sm mt-2 leading-relaxed ${
                  isDark ? 'text-stone-400' : 'text-stone-600'
                }`}>{selectedService.description}</p>
                <div className={`flex items-center justify-between mt-4 pt-4 border-t ${
                  isDark ? 'border-fuchsia-950' : 'border-pink-100/60'
                }`}>
                  <div className="text-2xl font-bold text-emerald-500">${selectedService.price}</div>
                  <Link href="/agenda" className="group relative overflow-hidden px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] text-white shadow-xl flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95" style={brandGradient}>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
                    <Calendar className="w-4 h-4" /> Agendar
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================ */}
        {/* MODAL DE RESEÑAS / CALIFICACIÓN — REDISEÑADO */}
        {/* ============================================================ */}
        <AnimatePresence>
          {showReviewModal && selectedService && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setShowReviewModal(false)}>
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
                isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-white border-pink-200'
              }`} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowReviewModal(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <X className="w-5 h-5 text-stone-400" />
                </button>

                <div className="text-center mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                    isDark ? 'bg-amber-500/10' : 'bg-amber-50'
                  }`}>
                    <Star className="w-8 h-8 text-amber-400" />
                  </div>
                  <h3 className={`text-xl font-black tracking-tight ${
                    isDark ? 'text-white' : 'text-stone-900'
                  }`}>
                    Calificar {selectedService.name}
                  </h3>
                  <p className={`text-xs mt-1 ${
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  }`}>
                    Comparte tu experiencia con este servicio
                  </p>
                </div>

                <div className="flex items-center gap-1 my-6 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button 
                      key={star} 
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onMouseEnter={() => setHoverRating(star)} 
                      onMouseLeave={() => setHoverRating(0)} 
                      onClick={() => setRating(star)} 
                      className="p-1 transition-transform"
                    >
                      <Star className={`w-10 h-10 transition-all duration-300 ${
                        (hoverRating || rating) >= star 
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]' 
                          : isDark ? 'text-stone-700' : 'text-stone-300'
                      }`} />
                    </motion.button>
                  ))}
                </div>

                <p className={`text-center text-sm font-medium mb-4 ${
                  isDark ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  {rating === 0 ? 'Selecciona una calificación' : 
                   rating === 1 ? '⭐ Muy malo' :
                   rating === 2 ? '⭐⭐ Regular' :
                   rating === 3 ? '⭐⭐⭐ Bueno' :
                   rating === 4 ? '⭐⭐⭐⭐ Muy bueno' :
                   '⭐⭐⭐⭐⭐ Excelente'}
                </p>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Escribe tu experiencia con este servicio..."
                  className={`w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500/20 resize-none ${
                    isDark 
                      ? 'bg-stone-900/60 border-stone-800/60 text-white placeholder:text-stone-500' 
                      : 'bg-stone-50/80 border-stone-200/60 text-stone-900 placeholder:text-stone-400'
                  }`}
                  rows={4}
                  style={comment ? { borderColor: primaryColor, borderWidth: '1px' } : {}}
                />

                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={() => setShowReviewModal(false)} 
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 hover:scale-105 active:scale-95 border ${
                      isDark 
                        ? 'border-stone-800/60 text-stone-400 hover:bg-stone-800/50' 
                        : 'border-stone-200/60 text-stone-500 hover:bg-stone-50'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitting || rating === 0 || !comment.trim()}
                    className="flex-1 px-4 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> 
                        Enviando
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> 
                        Enviar
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================ */}
        {/* STYLES GLOBALES */}
        {/* ============================================================ */}
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
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
          .animate-shine {
            animation: shine 1.5s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>  // ← Este es el ÚNICO cierre del div principal
  )      // ← Cierre de la función
}        // ← Cierre de la exportación