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
  Flower2
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
    backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
          <Sparkles className="w-5 h-5 text-pink-500 absolute animate-pulse" />
        </div>
        <p className={`text-xs font-mono tracking-widest uppercase font-black animate-pulse ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
          Iniciando Módulo Estética...
        </p>
      </div>
    )
  }

  return (
    <div className={`w-full min-h-screen overflow-x-hidden transition-colors duration-500 ${
      isDark ? 'bg-stone-950 text-stone-200' : 'bg-gradient-to-b from-pink-50/10 via-amber-50/5 to-stone-50/30 text-stone-800'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[160px] bg-pink-500/[0.03] pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-[300px] h-[300px] rounded-full blur-[140px] bg-amber-500/[0.02] pointer-events-none" />

        {/* MENSAJES */}
        {errorMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 max-w-[90vw]">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium truncate">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 max-w-[90vw]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium truncate">{successMessage}</span>
          </div>
        )}

        {/* HERO BANNER */}
        <div className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 md:p-8 shadow-xl transition-all duration-300 ${
          isDark
            ? 'bg-gradient-to-br from-stone-950 via-pink-950/10 to-neutral-950 border-pink-950/30'
            : 'bg-gradient-to-br from-stone-900 via-pink-600 to-amber-500 border-pink-100'
        }`}>
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1">
              <div className={`inline-flex items-center gap-2 border px-3 py-1 rounded-full backdrop-blur-md ${isDark ? 'bg-pink-500/10 border-pink-500/30' : 'bg-white/20 border-white/30'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                <span className={`text-[9px] uppercase tracking-widest font-black ${isDark ? 'text-pink-300' : 'text-white'}`}>Cuidado & Estética Avanzada</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Bienestar & <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-amber-200 to-white">MediSpa</span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-pink-100/90 font-medium'}`}>
                Tratamientos faciales, corporales y masajes para equilibrar cuerpo y mente.
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
              <div className={`px-3 py-1.5 sm:py-2 rounded-xl border text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md ${
                isDark ? 'bg-stone-900 border-stone-800 text-stone-400' : 'bg-white/90 border-pink-100 text-stone-800'
              }`}>
                <Crown className="w-3 h-3 text-amber-400" />
                {servicios.length} Rituales
              </div>

              <Link
                href={user ? '/agenda' : '/login'}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 border shadow-sm ${
                  isDark
                    ? 'bg-pink-500/20 border-pink-500/30 text-pink-300 hover:bg-pink-500/30'
                    : 'bg-stone-950 border-stone-900 text-white hover:bg-stone-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Agendar Cita
              </Link>
            </div>
          </div>
        </div>

        {/* TABS NAVEGACIÓN */}
        <div className="flex border-b border-pink-100/60 dark:border-fuchsia-950/60 mt-6 sm:mt-8 overflow-x-auto">
          {[
            { id: 'servicios', label: 'Servicios', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'galeria', label: 'Galería', icon: <Camera className="w-4 h-4" /> },
            { id: 'testimonios', label: 'Testimonios', icon: <Quote className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-stone-900 dark:text-white'
                  : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
              }`}
              style={activeTab === tab.id ? { borderColor: primaryColor, color: primaryColor } : {}}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: SERVICIOS */}
        {activeTab === 'servicios' && (
          <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider font-mono flex items-center gap-2 text-stone-800 dark:text-stone-200">
                <Sparkles className="w-4 h-4 text-pink-500" />
                Filtrar Tratamientos
              </h3>
              {selectedCategory !== 'todos' && (
                <button
                  onClick={() => setSelectedCategory('todos')}
                  className="text-[10px] font-mono font-black uppercase tracking-widest text-pink-500 hover:text-pink-400 transition-colors"
                >
                  Ver Todos →
                </button>
              )}
            </div>

            {/* Grid de Filtros Rápidos de Categoría */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 sm:gap-2">
              {categoriasFinal.map((cat) => {
                const Icon = cat.icon
                const isActive = selectedCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border text-left transition-all duration-300 text-[10px] sm:text-xs ${
                      isActive
                        ? isDark
                          ? 'bg-pink-500/10 border-pink-500/40 text-pink-400 shadow-sm'
                          : 'bg-stone-950 border-stone-900 text-white shadow-sm'
                        : isDark
                          ? 'bg-stone-900/40 border-stone-900 text-stone-400 hover:border-pink-500/20 hover:text-stone-200'
                          : 'bg-white border-pink-100/60 text-stone-500 hover:border-pink-300 hover:text-stone-800 shadow-sm'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-pink-400' : 'text-stone-400'}`} />
                    <span className="font-bold uppercase tracking-wide truncate">{cat.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Buscador Superior y Selectores de Vista */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
              <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
                <Search className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
                <input 
                  type="text" 
                  placeholder="Buscar tratamientos por nombre o descripción..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-stone-800 dark:text-pink-100 placeholder:text-stone-400 w-full min-w-0"
                />
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-medium flex items-center gap-1.5 border ${
                    showFilters ? 'text-white border-transparent shadow-md' : 'bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950'
                  }`}
                  style={showFilters ? { background: brandGradient.backgroundImage } : {}}
                >
                  <Filter className="w-3.5 h-3.5" /> Filtros
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

            {/* CONTENEDOR RENDERIZADO DE TRATAMIENTOS */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4" : "space-y-3"}
            >
              {filteredServicios.length === 0 ? (
                <div className={`col-span-full border border-dashed rounded-3xl p-12 sm:p-16 text-center ${
                  isDark ? 'border-stone-800 bg-stone-900/10' : 'border-pink-100 bg-white/40 shadow-inner'
                }`}>
                  <Sparkles className={`w-10 h-10 mx-auto mb-4 ${isDark ? 'text-stone-800' : 'text-pink-200'}`} />
                  <p className="text-sm font-black tracking-tight text-stone-800 dark:text-stone-200">No se encontraron tratamientos con esos criterios</p>
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
                        className={`group relative rounded-2xl border p-4 sm:p-5 transition-all duration-300 transform hover:-translate-y-0.5 flex ${
                          viewMode === 'grid' ? 'flex-col justify-between min-h-[200px] sm:min-h-[220px]' : 'flex-row gap-4 items-center'
                        } overflow-hidden cursor-pointer ${
                          isDark
                            ? 'bg-stone-900/40 border-stone-900 hover:border-pink-500/20 hover:bg-stone-900/60 shadow-lg'
                            : 'bg-white border-pink-100/60 hover:border-pink-300 hover:shadow-md'
                        }`}
                        onClick={() => {
                          setSelectedService(servicio)
                          setIsModalOpen(true)
                        }}
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-pink-500/[0.02] to-transparent rounded-bl-full pointer-events-none" />

                        <div className={viewMode === 'list' ? 'flex-1 flex gap-4 items-center min-w-0' : 'w-full'}>
                          <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all group-hover:scale-105 ${
                              isDark ? 'bg-pink-500/10 border border-pink-500/20 text-pink-400' : 'bg-stone-50 border border-stone-100 text-pink-600'
                            }`}>
                              <Icon className="w-3.5 h-3.5 sm:w-4 h-4" />
                            </div>
                          </div>

                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-black text-xs sm:text-sm tracking-tight text-stone-900 dark:text-stone-200 group-hover:text-pink-500 transition-colors truncate">
                                {servicio.name}
                              </h4>
                              {servicio.badge && viewMode === 'list' && (
                                <span className={`text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${badgeColor}`}>
                                  {servicio.badge}
                                </span>
                              )}
                            </div>
                            <p className={`text-[10px] sm:text-[11px] leading-relaxed line-clamp-2 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                              {servicio.description || 'Tratamiento profesional estético de alta gama.'}
                            </p>

                            <div className="flex items-center gap-1.5 sm:gap-2 mt-2">
                              {avgRating > 0 ? (
                                <>
                                  {renderStars(avgRating, 'sm')}
                                  <span className="text-[9px] sm:text-[10px] font-bold text-stone-600 dark:text-stone-400">{avgRating.toFixed(1)}</span>
                                  <span className="text-[8px] sm:text-[9px] text-stone-400">({ratingCount})</span>
                                </>
                              ) : (
                                <span className="text-[9px] sm:text-[10px] text-stone-400">Sin calificaciones</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={`flex items-center justify-between border-dashed ${
                          viewMode === 'grid' ? 'border-t mt-3 sm:mt-4 pt-3 sm:pt-3.5' : 'flex-col sm:flex-row gap-2 border-l pl-4'
                        } ${isDark ? 'border-stone-800/80' : 'border-stone-100'}`}>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className={`text-sm sm:text-base font-mono font-black tracking-tight ${isDark ? 'text-pink-400' : 'text-stone-950'}`}>
                              ${servicio.price?.toLocaleString()}
                            </span>
                            <span className="text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
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
                                  ? 'bg-stone-950/60 border border-stone-800 text-stone-400 hover:text-amber-400 hover:border-amber-500/30'
                                  : 'bg-stone-50 border border-stone-100 text-stone-400 hover:text-amber-500 hover:border-amber-300'
                              }`}
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                            <Link
                              href={user ? '/agenda' : '/login'}
                              className={`p-1.5 sm:p-2 rounded-xl transition-all duration-300 ${
                                isDark
                                  ? 'bg-stone-950/60 border border-stone-800 text-stone-400 hover:text-pink-400 hover:border-pink-500/30'
                                  : 'bg-stone-50 border border-stone-100 text-stone-500 hover:text-stone-950 hover:border-pink-300'
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

        {/* TAB: GALERÍA */}
        {activeTab === 'galeria' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 mt-4 sm:mt-6">
            <p className="text-sm text-stone-500 dark:text-stone-400 text-center">Descubre nuestro trabajo y resultados en estética</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              {[
                { src: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=400&fit=crop', title: 'Tratamiento facial' },
                { src: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop', title: 'Limpieza profunda' },
                { src: 'https://images.unsplash.com/photo-1540555700478-4be6f5f1ccd7?w=400&h=400&fit=crop', title: 'Tratamiento corporal' },
                { src: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop', title: 'Bienestar' },
              ].map((img, idx) => (
                <motion.div key={idx} whileHover={{ scale: 1.02 }} className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer">
                  <img src={img.src} alt={img.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 sm:p-3">
                    <p className="text-white text-[10px] sm:text-xs font-bold">{img.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB: TESTIMONIOS */}
        {activeTab === 'testimonios' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 mt-4 sm:mt-6">
            <p className="text-sm text-stone-500 dark:text-stone-400 text-center">Lo que dicen nuestros clientes sobre su experiencia</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Object.values(reviews).flat().length > 0 ? (
                Object.values(reviews).flat().slice(0, 6).map((review, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                        {review.client_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-stone-900 dark:text-white">{review.client_name}</p>
                        <p className="text-xs text-stone-400">Estética</p>
                      </div>
                    </div>
                    <div className="flex text-amber-400 text-xs mb-2">
                      {[...Array(review.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">"{review.comment}"</p>
                  </div>
                ))
              ) : (
                [
                  { name: 'María González', comment: 'Los tratamientos faciales son increíbles. Mi piel nunca se había visto tan radiante.', rating: 5 },
                  { name: 'Laura Pérez', comment: 'El masaje corporal fue una experiencia relajante.', rating: 5 },
                  { name: 'Carmen Sánchez', comment: 'Me encanta el servicio de depilación. Rápido, indoloro y resultados perfectos.', rating: 5 },
                ].map((t, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-stone-900 dark:text-white">{t.name}</p>
                        <p className="text-xs text-stone-400">Estética</p>
                      </div>
                    </div>
                    <div className="flex text-amber-400 text-xs mb-2">
                      {[...Array(t.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">"{t.comment}"</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* MODAL DETALLES DEL SERVICIO */}
        <AnimatePresence>
          {isModalOpen && selectedService && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)}>
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-white border-pink-200'}`} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <X className="w-5 h-5 text-stone-400" />
                </button>
                <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
                  <img src={selectedService.image_url || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop'} alt={selectedService.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-bold">{selectedService.duration} min</div>
                </div>
                <h3 className="text-2xl font-bold text-stone-900 dark:text-white">{selectedService.name}</h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">{selectedService.description}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-pink-100/60 dark:border-fuchsia-950">
                  <div className="text-2xl font-bold text-emerald-500">${selectedService.price}</div>
                  <Link href="/agenda" className="px-4 py-2 rounded-xl text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1" style={{ background: brandGradient.backgroundImage }}>
                    <Calendar className="w-4 h-4" /> Agendar
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL DE RESEÑAS / CALIFICACIÓN */}
        <AnimatePresence>
          {showReviewModal && selectedService && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setShowReviewModal(false)}>
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl ${isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-white border-pink-200'}`} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowReviewModal(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <X className="w-5 h-5 text-stone-400" />
                </button>
                <h3 className="text-xl font-bold text-stone-900 dark:text-white">Calificar {selectedService.name}</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Comparte tu experiencia con este servicio</p>

                <div className="flex items-center gap-1 my-6 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)} className="p-1 transition-transform hover:scale-110">
                      <Star className={`w-10 h-10 ${(hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-stone-300 dark:text-stone-600'} transition-colors`} />
                    </button>
                  ))}
                </div>

                <p className="text-center text-sm font-medium text-stone-600 dark:text-stone-400 mb-4">
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
                  className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 resize-none ${isDark ? 'bg-[#0f0c1b] border-fuchsia-950 text-white placeholder-stone-500' : 'bg-stone-50 border-pink-100/60 text-stone-900 placeholder-stone-400'}`}
                  rows={4}
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />

                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowReviewModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700">Cancelar</button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitting || rating === 0 || !comment.trim()}
                    className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando</> : <><Send className="w-4 h-4" /> Enviar</>}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
