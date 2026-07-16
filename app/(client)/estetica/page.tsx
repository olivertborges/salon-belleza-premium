// app/(client)/micropigmentacion/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Clock, 
  DollarSign, 
  Star,
  Sparkles,
  Search,
  Filter,
  Grid3x3,
  LayoutList,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Heart,
  Users,
  Award,
  Quote,
  Calendar,
  User,
  Crown,
  Gem,
  Zap,
  Eye,
  Camera,
  Image,
  StarHalf,
  Send,
  X,
  Loader2,
  Palette,
  Brush,
  Droplets,
  Feather,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Youtube
} from 'lucide-react'

interface Servicio {
  id: string
  tenant_id: string
  name: string
  description: string
  price: number
  duration: number
  category: string
  is_active: boolean
  image_url: string | null
  created_at: string
}

interface Review {
  id: string
  tenant_id: string
  client_id: string
  service_id: string
  professional_id: string | null
  rating: number
  comment: string
  images: string[]
  is_approved: boolean
  created_at: string
  client_name?: string
}

// ✅ IMÁGENES REALES DE MICROPIGMENTACIÓN
const MICRO_IMAGES = {
  // Hero - Imagen de cejas profesional
  hero: 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=1200&h=600&fit=crop',
  // Cejas
  cejas1: 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=600&h=400&fit=crop',
  cejas2: 'https://images.unsplash.com/photo-1611849889765-cde2b945cf09?w=600&h=400&fit=crop',
  cejas3: 'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=600&h=400&fit=crop',
  // Labios
  labios1: 'https://images.unsplash.com/photo-1589256469067-ea99122bb5f4?w=600&h=400&fit=crop',
  labios2: 'https://images.unsplash.com/photo-1589256469067-ea99122bb5f4?w=600&h=400&fit=crop',
  // Ojos
  ojos1: 'https://images.unsplash.com/photo-1611849889765-cde2b945cf09?w=600&h=400&fit=crop',
  ojos2: 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=600&h=400&fit=crop',
  // Tratamientos
  tratamiento: 'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=600&h=400&fit=crop',
  // Galería
  gallery1: 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=400&h=400&fit=crop',
  gallery2: 'https://images.unsplash.com/photo-1611849889765-cde2b945cf09?w=400&h=400&fit=crop',
  gallery3: 'https://images.unsplash.com/photo-1589256469067-ea99122bb5f4?w=400&h=400&fit=crop',
  gallery4: 'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=400&h=400&fit=crop',
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

export default function MicropigmentacionPage() {
  const { user, tenantId } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'

  const [servicios, setServicios] = useState<Servicio[]>([])
  const [filteredServicios, setFilteredServicios] = useState<Servicio[]>([])
  const [reviews, setReviews] = useState<Record<string, Review[]>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedService, setSelectedService] = useState<Servicio | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'servicios' | 'galeria' | 'testimonios'>('servicios')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
  }

  const categories = [
    { id: 'all', label: 'Todos', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'Cejas', label: 'Cejas', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'Labios', label: 'Labios', icon: <Droplets className="w-3.5 h-3.5" /> },
    { id: 'Ojos', label: 'Ojos', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'Tratamientos', label: 'Tratamientos', icon: <Feather className="w-3.5 h-3.5" /> },
  ]

  useEffect(() => {
    loadServicios()
    loadReviews()
  }, [tenantId])

  const loadServicios = async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .in('category', ['Cejas', 'Labios', 'Ojos', 'Tratamientos', 'micropigmentacion', 'Micropigmentación'])
        .order('name', { ascending: true })

      if (error) throw error
      setServicios(data || [])
      setFilteredServicios(data || [])
    } catch (error) {
      console.error('Error cargando servicios:', error)
      setError('Error al cargar los servicios')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadReviews = async () => {
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
          client_name: user.name || 'Cliente'
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

  useEffect(() => {
    let filtered = servicios
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory)
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term)
      )
    }
    setFilteredServicios(filtered)
  }, [selectedCategory, searchTerm, servicios])

  const openModal = (servicio: Servicio) => {
    setSelectedService(servicio)
    setIsModalOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedService(null)
    document.body.style.overflow = 'unset'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 animate-spin" style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }} />
          <Sparkles className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ color: primaryColor }} />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse" style={{ color: primaryColor }}>
          Cargando experiencias de micropigmentación...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">

      {/* MENSAJES */}
      {errorMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0">
          <img 
            src={MICRO_IMAGES.hero}
            alt="Micropigmentación"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        </div>

        <div className="relative z-10 px-6 py-16 md:py-24 md:px-12 lg:px-16">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-sm bg-white/10 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/80">
                  Fresh Nails • Micropigmentación
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-white leading-[1.1]">
                <span className="font-serif italic" style={{ color: secondaryColor }}>Arte</span>
                <span className="block text-5xl md:text-7xl lg:text-8xl font-bold">Permanent</span>
              </h1>

              <p className="text-base md:text-lg text-white/80 mt-4 max-w-lg leading-relaxed">
                Microblading, Microshading y técnicas avanzadas de micropigmentación para realzar tu belleza natural.
              </p>

              <div className="flex items-center gap-4 mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 max-w-sm">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  A
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Ana Martínez</p>
                  <p className="text-xs text-white/60">Especialista en Micropigmentación</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-[10px] text-white/60 ml-1">(5.0)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  href="/agenda"
                  className="px-6 py-3 rounded-xl text-white text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                  style={{ background: brandGradient.backgroundImage }}
                >
                  <Calendar className="w-4 h-4" />
                  Reservar con Ana
                </Link>
                <button
                  onClick={() => setActiveTab('galeria')}
                  className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-white/20"
                >
                  <Camera className="w-4 h-4" />
                  Ver galería
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-pink-100/60 dark:border-fuchsia-950/60">
        {[
          { id: 'servicios', label: 'Servicios', icon: <Sparkles className="w-4 h-4" /> },
          { id: 'galeria', label: 'Galería', icon: <Camera className="w-4 h-4" /> },
          { id: 'testimonios', label: 'Testimonios', icon: <Quote className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 ${
              activeTab === tab.id
                ? 'border-pink-500 text-stone-900 dark:text-white'
                : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
            }`}
            style={activeTab === tab.id ? { borderColor: primaryColor } : {}}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: SERVICIOS */}
      {activeTab === 'servicios' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'text-white shadow-md'
                    : isDark
                      ? 'bg-[#130f24] border-fuchsia-950 text-stone-400 hover:text-stone-200'
                      : 'bg-white border-pink-100/60 text-stone-600 hover:bg-pink-50'
                }`}
                style={selectedCategory === cat.id ? { background: brandGradient.backgroundImage } : {}}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-3 p-3 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <Search className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
              <input 
                type="text" 
                placeholder="Buscar servicios..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-stone-800 dark:text-pink-100 placeholder:text-stone-400 w-full"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border ${
                  showFilters ? 'text-white border-transparent shadow-md' : 'bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950'
                }`}
                style={showFilters ? { background: brandGradient.backgroundImage } : {}}
              >
                <Filter className="w-3.5 h-3.5" /> Filtros
              </button>

              <div className={`flex rounded-xl overflow-hidden border p-0.5 bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950`}>
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'text-white shadow-sm' : 'text-stone-400'}`} style={viewMode === 'grid' ? { background: brandGradient.backgroundImage } : {}}>
                  <Grid3x3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'text-white shadow-sm' : 'text-stone-400'}`} style={viewMode === 'list' ? { background: brandGradient.backgroundImage } : {}}>
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredServicios.length === 0 ? (
              <div className="col-span-full text-center py-16 border border-dashed rounded-2xl border-pink-200 dark:border-fuchsia-950">
                <Eye className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-sm text-stone-500">No hay servicios disponibles</p>
              </div>
            ) : (
              filteredServicios.map((servicio) => {
                const avgRating = getAverageRating(servicio.id)
                const ratingCount = getRatingCount(servicio.id)

                // ✅ Asignar imagen según categoría
                let imageUrl = servicio.image_url || MICRO_IMAGES.cejas1
                if (servicio.category === 'Labios') {
                  imageUrl = servicio.image_url || MICRO_IMAGES.labios1
                } else if (servicio.category === 'Ojos') {
                  imageUrl = servicio.image_url || MICRO_IMAGES.ojos1
                } else if (servicio.category === 'Cejas') {
                  imageUrl = servicio.image_url || MICRO_IMAGES.cejas1
                }

                return (
                  <motion.div key={servicio.id} variants={itemVariants}>
                    <div 
                      className="group relative rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 hover:border-pink-300 dark:hover:border-fuchsia-800"
                      onClick={() => openModal(servicio)}
                    >
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="relative aspect-video overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800">
                        <img 
                          src={imageUrl}
                          alt={servicio.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-stone-800 dark:text-white group-hover:text-pink-500 transition-colors">
                            {servicio.name}
                          </h3>
                          <span className="text-xs font-bold text-emerald-500">
                            ${servicio.price}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                          {servicio.description}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-pink-100/60 dark:border-fuchsia-950">
                          <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
                            <Clock className="w-3.5 h-3.5" />
                            {servicio.duration} min
                          </div>
                          <div className="flex items-center gap-2">
                            {avgRating > 0 ? (
                              <div className="flex items-center gap-1">
                                {renderStars(avgRating, 'sm')}
                                <span className="text-[10px] text-stone-500">({ratingCount})</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-stone-400">Sin reseñas</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-pink-100/60 dark:border-fuchsia-950" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedService(servicio)
                            setShowReviewModal(true)
                            setRating(0)
                            setComment('')
                          }}
                          className="px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors flex items-center gap-1"
                        >
                          <Star className="w-3 h-3" /> Calificar
                        </button>
                        
                        <Link
                          href="/agenda"
                          className="flex-1 px-3 py-1.5 rounded-lg text-white text-[9px] font-bold uppercase tracking-widest transition hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-1"
                          style={{ background: brandGradient.backgroundImage }}
                        >
                          <Calendar className="w-3 h-3" /> Agendar
                        </Link>
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
            Descubre nuestro trabajo y transformaciones
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { src: MICRO_IMAGES.cejas1, title: 'Microblading cejas', categoria: 'Cejas' },
              { src: MICRO_IMAGES.cejas2, title: 'Microshading', categoria: 'Cejas' },
              { src: MICRO_IMAGES.labios1, title: 'Pigmentación labios', categoria: 'Labios' },
              { src: MICRO_IMAGES.ojos1, title: 'Pigmentación ojos', categoria: 'Ojos' },
              { src: MICRO_IMAGES.cejas3, title: 'Cejas pelo a pelo', categoria: 'Cejas' },
              { src: MICRO_IMAGES.ojos2, title: 'Ojos definidos', categoria: 'Ojos' },
              { src: MICRO_IMAGES.labios2, title: 'Labios hidratados', categoria: 'Labios' },
              { src: MICRO_IMAGES.tratamiento, title: 'Tratamiento especial', categoria: 'Tratamientos' },
            ].map((img, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
              >
                <img 
                  src={img.src}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div>
                    <p className="text-white text-xs font-bold">{img.title}</p>
                    <p className="text-white/60 text-[8px]">{img.categoria}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* TAB: TESTIMONIOS */}
      {activeTab === 'testimonios' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
            Lo que dicen nuestros clientes
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(reviews).flat().length > 0 ? (
              Object.values(reviews).flat().slice(0, 6).map((review, idx) => (
                <div key={idx} className="p-4 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                      {review.client_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-stone-900 dark:text-white">{review.client_name}</p>
                      <p className="text-xs text-stone-400">Micropigmentación</p>
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
                { name: 'Laura García', comment: 'El microblading es increíble. Mis cejas se ven naturales y perfectas.', rating: 5 },
                { name: 'Carmen Rodríguez', comment: 'La pigmentación de labios cambió mi vida. Ya no necesito maquillaje.', rating: 5 },
                { name: 'Sofía Martínez', comment: 'Excelente profesional, resultados espectaculares.', rating: 5 },
              ].map((t, idx) => (
                <div key={idx} className="p-4 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-stone-900 dark:text-white">{t.name}</p>
                      <p className="text-xs text-stone-400">Micropigmentación</p>
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

      {/* MODAL DE SERVICIO */}
      <AnimatePresence>
        {isModalOpen && selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${
                isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-white border-pink-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>

              <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
                <img 
                  src={selectedService.image_url || MICRO_IMAGES.cejas1}
                  alt={selectedService.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-bold">
                  {selectedService.duration} min
                </div>
              </div>

              <h3 className="text-2xl font-bold text-stone-900 dark:text-white">
                {selectedService.name}
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
                {selectedService.description}
              </p>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-pink-100/60 dark:border-fuchsia-950">
                <div className="text-2xl font-bold text-emerald-500">
                  ${selectedService.price}
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/agenda"
                    className="px-4 py-2 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition hover:scale-105 active:scale-95 flex items-center gap-1"
                    style={{ background: brandGradient.backgroundImage }}
                  >
                    <Calendar className="w-4 h-4" /> Agendar
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE CALIFICACIÓN */}
      <AnimatePresence>
        {showReviewModal && selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setShowReviewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
                isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-white border-pink-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowReviewModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>

              <h3 className="text-xl font-bold text-stone-900 dark:text-white">
                Calificar {selectedService.name}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                Comparte tu experiencia
              </p>

              <div className="flex items-center gap-1 my-6 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`w-10 h-10 ${
                        (hoverRating || rating) >= star 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-stone-300 dark:text-stone-600'
                      } transition-colors`}
                    />
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
                placeholder="Escribe tu experiencia..."
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 resize-none ${
                  isDark 
                    ? 'bg-[#0f0c1b] border-fuchsia-950 text-white placeholder-stone-500' 
                    : 'bg-stone-50 border-pink-100/60 text-stone-900 placeholder-stone-400'
                }`}
                rows={4}
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting || rating === 0 || !comment.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Enviando</>
                  ) : (
                    <><Send className="w-4 h-4" /> Enviar</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}