// @ts-nocheck
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  Star,
  Sparkles,
  Search,
  Filter,
  Grid3x3,
  LayoutList,
  AlertCircle,
  CheckCircle2,
  Quote,
  Calendar,
  Eye,
  Camera,
  StarHalf,
  Send,
  X,
  Loader2,
  Droplets,
  Feather,
  Heart,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Gem,
  Crown,
  ArrowRight,
  Flower2,
  Compass,
  Zap,
  Shield,
  Award,
  Sparkle
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

interface GalleryImage {
  id: string
  tenant_id: string
  image_url: string
  title: string
  category: string
  description: string
  is_active: boolean
  created_at: string
  source: 'admin' | 'client'
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
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
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [reviews, setReviews] = useState<Record<string, Review[]>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedService, setSelectedService] = useState<Servicio | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'servicios' | 'galeria' | 'testimonios'>('servicios')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 🔥 Lightbox para galería
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
  }

  const categories = [
    { id: 'all', label: 'Todos', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'from-pink-500 to-rose-500' },
    { id: 'Cejas', label: 'Cejas', icon: <Eye className="w-3.5 h-3.5" />, color: 'from-amber-500 to-orange-500' },
    { id: 'Labios', label: 'Labios', icon: <Droplets className="w-3.5 h-3.5" />, color: 'from-rose-500 to-pink-500' },
    { id: 'Ojos', label: 'Ojos', icon: <Eye className="w-3.5 h-3.5" />, color: 'from-violet-500 to-purple-500' },
    { id: 'Tratamientos', label: 'Tratamientos', icon: <Feather className="w-3.5 h-3.5" />, color: 'from-emerald-500 to-teal-500' },
  ]

  // ============================================================
  // 🔥 FUNCIÓN PARA OBTENER TENANT_ID
  // ============================================================
  const getTenantId = useCallback(async (): Promise<string | null> => {
    if (tenantId) return tenantId

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    if (session.user.user_metadata?.tenant_id) {
      return session.user.user_metadata.tenant_id
    }

    if (session.user.app_metadata?.tenant_id) {
      return session.user.app_metadata.tenant_id
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', session.user.id)
      .maybeSingle()

    if (profile?.tenant_id) return profile.tenant_id

    const { data: client } = await supabase
      .from('clients')
      .select('tenant_id')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()

    if (client?.tenant_id) return client.tenant_id

    return null
  }, [tenantId])

  // ============================================================
  // 🔥 CARGAR SERVICIOS
  // ============================================================
  const loadServicios = async () => {
    const activeTenantId = await getTenantId()
    if (!activeTenantId) { setLoading(false); return }

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('is_active', true)
        .in('category', ['Cejas', 'Labios', 'Ojos', 'Tratamientos', 'micropigmentacion', 'Micropigmentación'])
        .order('name', { ascending: true })

      if (error) throw error
      setServicios(data || [])
      setFilteredServicios(data || [])
    } catch (error) {
      console.error('Error cargando servicios:', error)
    }
  }

  // ============================================================
  // 🔥 CARGAR GALERÍA - FOTOS CON CATEGORÍA MICROPIGMENTACION
  // ============================================================
  const loadGallery = async () => {
    const activeTenantId = await getTenantId()
    if (!activeTenantId) return

    try {
      console.log('🔍 Cargando galería de micropigmentación para tenant:', activeTenantId)

      let allImages: GalleryImage[] = []

      // 1. Fotos de ADMIN (tabla gallery) con categoría Micropigmentacion
      const { data: adminPhotos, error: adminError } = await supabase
        .from('gallery')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('is_active', true)
        .ilike('category', 'Micropigmentacion')
        .order('created_at', { ascending: false })

      if (adminError) {
        console.error('Error cargando fotos de admin:', adminError)
      } else if (adminPhotos) {
        console.log(`📸 Encontradas ${adminPhotos.length} fotos de admin con categoría Micropigmentacion`)
        const mappedAdmin = adminPhotos.map((p: any) => ({
          ...p,
          source: 'admin' as const,
          category: p.category || 'Micropigmentacion'
        }))
        allImages = [...allImages, ...mappedAdmin]
      }

      // 2. Fotos de CLIENTES (tabla client_gallery) con categoría Micropigmentacion
      const { data: clientPhotos, error: clientError } = await supabase
        .from('client_gallery')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('is_active', true)
        .eq('is_public', true)
        .ilike('category', 'Micropigmentacion')
        .order('created_at', { ascending: false })

      if (clientError) {
        console.error('Error cargando fotos de clientes:', clientError)
      } else if (clientPhotos) {
        console.log(`📸 Encontradas ${clientPhotos.length} fotos de clientes con categoría Micropigmentacion`)
        const mappedClient = clientPhotos.map((p: any) => ({
          id: p.id,
          tenant_id: p.tenant_id,
          image_url: p.after_image_url || p.image_url || p.before_image_url || '',
          title: p.title || 'Trabajo de cliente',
          category: p.category || 'Micropigmentacion',
          description: p.description || '',
          is_active: p.is_active !== undefined ? p.is_active : true,
          created_at: p.created_at,
          source: 'client' as const
        }))
        allImages = [...allImages, ...mappedClient]
      }

      // Ordenar por fecha
      allImages.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      console.log(`✅ Total: ${allImages.length} fotos de micropigmentación cargadas`)
      setGalleryImages(allImages)

    } catch (error) {
      console.error('Error cargando galería:', error)
    }
  }

  // ============================================================
  // CARGAR REVIEWS
  // ============================================================
  const loadReviews = async () => {
    const activeTenantId = await getTenantId()
    if (!activeTenantId) return

    try {
      const reviewsMap: Record<string, Review[]> = {}
      const { data, error } = await supabase
        .from('reviews')
        .select(`*, clients:client_id (name, avatar_url)`)
        .eq('tenant_id', activeTenantId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        data.forEach((review: any) => {
          const serviceId = review.service_id
          if (!reviewsMap[serviceId]) reviewsMap[serviceId] = []
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

  // ============================================================
  // EFECTO PRINCIPAL
  // ============================================================
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        loadServicios(),
        loadGallery(),
        loadReviews()
      ])
      setLoading(false)
    }
    loadData()
  }, [tenantId])

  // ============================================================
  // FILTROS
  // ============================================================
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

  // ============================================================
  // FUNCIONES DE REVIEWS
  // ============================================================
  const getAverageRating = (serviceId: string) => {
    const serviceReviews = reviews[serviceId] || []
    if (serviceReviews.length === 0) return 0
    return serviceReviews.reduce((acc, r) => acc + r.rating, 0) / serviceReviews.length
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' }
    const sizeClass = sizes[size]
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => <Star key={`f-${i}`} className={`${sizeClass} fill-amber-400 text-amber-400`} />)}
        {hasHalfStar && <StarHalf className={`${sizeClass} fill-amber-400 text-amber-400`} />}
        {[...Array(emptyStars)].map((_, i) => <Star key={`e-${i}`} className={`${sizeClass} text-stone-300 dark:text-stone-600`} />)}
      </div>
    )
  }

  const handleSubmitReview = async () => {
    const activeTenantId = await getTenantId()
    if (!user || !activeTenantId || rating === 0 || !comment.trim()) return
    setSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          tenant_id: activeTenantId,
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
    } catch (error) {
      setErrorMessage('Error al enviar la calificación')
      setTimeout(() => setErrorMessage(null), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================================
  // LIGHTBOX PARA GALERÍA
  // ============================================================
  const openLightbox = (image: GalleryImage) => {
    const index = galleryImages.findIndex(i => i.id === image.id)
    setLightboxIndex(index >= 0 ? index : 0)
    setSelectedImage(image)
    setIsLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
    setSelectedImage(null)
    document.body.style.overflow = 'unset'
  }

  const navigateLightbox = (direction: 'next' | 'prev') => {
    if (!selectedImage) return
    const currentIndex = galleryImages.findIndex(i => i.id === selectedImage.id)
    if (currentIndex === -1) return

    let newIndex
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % galleryImages.length
    } else {
      newIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length
    }
    setSelectedImage(galleryImages[newIndex])
  }

  // ============================================================
  // MODALES
  // ============================================================
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

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
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
              ARTE PERMANENTE
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
    <div className={`space-y-8 pb-16 max-w-7xl mx-auto px-4 antialiased transition-colors duration-700 ${
      isDark ? 'bg-gradient-to-b from-[#09090b] via-[#0d0d12] to-[#09090b]' : 'bg-gradient-to-b from-stone-50 via-white to-stone-50/30'
    }`}>
      
      {errorMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[999] px-6 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium backdrop-blur-xl shadow-2xl animate-fadeIn">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[999] px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium backdrop-blur-xl shadow-2xl animate-fadeIn">
          {successMessage}
        </div>
      )}

      {/* ============================================================ */}
      {/* HERO SECTION — PRESTIGE EDITION */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-[2.5rem] min-h-[440px] flex items-center shadow-2xl mt-4">
        <div className="absolute inset-0">
          <img 
            src="https://plus.unsplash.com/premium_photo-1661580887141-7adca5e04c02?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
            alt="Micropigmentación" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        </div>

        {/* Efectos de luz ambiental */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 p-8 md:p-14 max-w-3xl text-white">
          <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full backdrop-blur-xl border mb-6 ${
            isDark ? 'bg-pink-500/10 border-pink-500/20' : 'bg-white/10 border-white/20'
          }`}>
            <Sparkle className="w-3.5 h-3.5 text-amber-400 animate-[spin_4s_linear_infinite]" />
            <span className={`text-[8px] uppercase tracking-[0.25em] font-black ${
              isDark ? 'text-pink-300' : 'text-white/90'
            }`}>
              {settings?.business_name || 'Fresh Nails Studio'} • <span className="font-bold">Micropigmentación</span>
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
            <span className="font-serif italic font-light text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-amber-200 to-white bg-[length:200%_auto] animate-[gradient_4s_ease-in-out_infinite]">
              Arte
            </span>{' '}
            Permanente
          </h1>
          <p className="text-sm md:text-base text-white/80 mt-4 max-w-lg font-medium tracking-wide">
            Microblading, Microshading y técnicas avanzadas conducidas por nuestra especialista, diseñadas para realzar tu belleza natural.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <Link 
              href="/agenda" 
              className="group relative overflow-hidden px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 transition-all duration-500 hover:-translate-y-0.5 active:scale-[0.97]"
              style={brandGradient}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
              <Calendar className="w-4 h-4 group-hover:rotate-12 transition-transform duration-500" />
              <span className="relative">Reservar</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            
            <button 
              onClick={() => setActiveTab('galeria')} 
              className="px-6 py-3.5 rounded-xl bg-white/10 border border-white/20 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2.5 transition-all duration-300 hover:bg-white/20 hover:-translate-y-0.5 active:scale-[0.97] backdrop-blur-sm"
            >
              <Camera className="w-4 h-4" /> 
              <span>Galería</span>
            </button>
          </div>

          {/* Micro estadísticas */}
          <div className="flex gap-6 mt-8 pt-6 border-t border-white/10">
            <div>
              <p className="text-2xl font-black text-white">{servicios.length}</p>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50">Servicios</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="text-2xl font-black text-white">{galleryImages.length}</p>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50">Trabajos</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="text-2xl font-black text-white">{Object.values(reviews).flat().length}</p>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50">Reseñas</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TABS DE SECCIÓN — REDISEÑADOS */}
      {/* ============================================================ */}
      <div className={`flex justify-center border-b pb-0 ${
        isDark ? 'border-stone-900/60' : 'border-stone-200/60'
      }`}>
        {(['servicios', 'galeria', 'testimonios'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-8 py-4 text-xs uppercase tracking-[0.2em] font-black transition-all duration-500 ${
              activeTab === tab 
                ? 'text-pink-500' 
                : isDark ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
            }`}
            style={activeTab === tab ? { color: primaryColor } : {}}
          >
            <span className="relative z-10">{tab === 'servicios' ? 'Rituales' : tab === 'galeria' ? 'Inspiración' : 'Testimonios'}</span>
            {activeTab === tab && (
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
      {/* CONTENIDO DINÁMICO POR TAB — SERVICIOS */}
      {/* ============================================================ */}
      {activeTab === 'servicios' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Categorías y Filtros */}
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`relative px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-500 flex items-center gap-1.5 border ${
                  selectedCategory === cat.id 
                    ? `text-white shadow-xl scale-105 bg-gradient-to-r ${cat.color}` 
                    : isDark 
                      ? 'bg-[#130f24] border-[#1a1430] text-stone-400 hover:border-stone-700 hover:text-stone-200' 
                      : 'bg-white border-stone-200/60 text-stone-600 hover:border-pink-300 hover:shadow-md'
                }`}
                style={selectedCategory === cat.id ? { 
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  borderColor: 'transparent'
                } : {}}
              >
                {cat.icon} {cat.label}
                {selectedCategory === cat.id && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white/60 animate-ping" />
                )}
              </button>
            ))}
          </div>

          {/* Búsqueda y vista */}
          <div className={`flex gap-3 p-4 rounded-2xl border shadow-lg ${
            isDark 
              ? 'bg-[#130f24]/80 border-stone-900/60 shadow-black/20' 
              : 'bg-white/80 border-stone-200/60 shadow-stone-200/20 backdrop-blur-sm'
          }`}>
            <div className="flex-1 flex items-center gap-3">
              <Search className={`w-4 h-4 ${
                isDark ? 'text-stone-500' : 'text-stone-400'
              }`} />
              <input 
                type="text" 
                placeholder="Buscar servicios..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`bg-transparent outline-none text-xs w-full font-medium ${
                  isDark ? 'text-white placeholder:text-stone-600' : 'text-stone-800 placeholder:text-stone-400'
                }`}
              />
            </div>
            <div className={`flex rounded-xl overflow-hidden border p-0.5 ${
              isDark ? 'border-stone-800/60' : 'border-stone-200/60'
            }`}>
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-1.5 rounded-lg transition-all duration-300 ${
                  viewMode === 'grid' 
                    ? isDark ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-800' 
                    : isDark ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <Grid3x3 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-1.5 rounded-lg transition-all duration-300 ${
                  viewMode === 'list' 
                    ? isDark ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-800' 
                    : isDark ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Grid de renderizado */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-3"}>
            {filteredServicios.map((servicio) => {
              const avgRating = getAverageRating(servicio.id)
              return (
                <motion.div 
                  key={servicio.id} 
                  variants={itemVariants} 
                  className={`group relative rounded-2xl border p-5 transition-all duration-500 flex flex-col justify-between overflow-hidden ${
                    isDark 
                      ? 'bg-gradient-to-br from-[#130f24]/80 via-[#130f24]/40 to-[#130f24]/80 border-stone-900/60 hover:border-pink-500/30 hover:shadow-2xl shadow-lg' 
                      : 'bg-gradient-to-br from-white via-stone-50/60 to-white border-stone-200/50 hover:border-pink-300/50 hover:shadow-2xl shadow-md'
                  }`}
                >
                  {/* Gradiente de fondo sutil */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-pink-500/[0.03] to-rose-500/[0.01]" />

                  <div className="cursor-pointer space-y-3 relative z-10" onClick={() => openModal(servicio)}>
                    <div className="relative overflow-hidden rounded-xl aspect-video">
                      <img 
                        src={servicio.image_url || 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=600&h=400&fit=crop'} 
                        alt={servicio.name} 
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Badge de duración */}
                      <div className={`absolute bottom-2 right-2 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.1em] backdrop-blur-md ${
                        isDark ? 'bg-black/60 text-white/80' : 'bg-white/80 text-stone-700'
                      }`}>
                        <Clock className="w-2.5 h-2.5 inline mr-1" /> {servicio.duration} min
                      </div>
                    </div>

                    <div className="flex justify-between items-start gap-2">
                      <h3 className={`font-black text-sm tracking-tight transition-colors ${
                        isDark ? 'text-stone-100 group-hover:text-pink-400' : 'text-stone-800 group-hover:text-pink-600'
                      }`}>
                        {servicio.name}
                      </h3>
                      <span className={`text-sm font-black font-mono ${
                        isDark ? 'text-emerald-400' : 'text-emerald-600'
                      }`}>
                        ${servicio.price}
                      </span>
                    </div>
                    
                    <p className={`text-xs line-clamp-2 ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}>
                      {servicio.description}
                    </p>

                    {/* Rating */}
                    {avgRating > 0 && (
                      <div className="flex items-center gap-2">
                        {renderStars(avgRating, 'sm')}
                        <span className={`text-[10px] font-medium ${
                          isDark ? 'text-stone-400' : 'text-stone-500'
                        }`}>
                          ({reviews[servicio.id]?.length || 0})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer con acción */}
                  <div className={`flex items-center justify-between mt-4 pt-4 border-t relative z-10 ${
                    isDark ? 'border-stone-800/60' : 'border-stone-200/60'
                  }`}>
                    <div className={`flex items-center gap-1 text-[10px] font-medium ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}>
                      <Eye className="w-3 h-3 text-pink-400" />
                      {servicio.category || 'Micropigmentación'}
                    </div>
                    <button 
                      onClick={() => { setSelectedService(servicio); setShowReviewModal(true) }} 
                      className={`text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 transition-all duration-300 hover:scale-105 ${
                        isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-500 hover:text-amber-600'
                      }`}
                    >
                      <Star className="w-3 h-3 fill-amber-400" /> Reseñar
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: GALERÍA — REDISEÑADA */}
      {/* ============================================================ */}
      {activeTab === 'galeria' && (
        <div className="animate-fadeIn">
          {galleryImages.length === 0 ? (
            <div className={`text-center py-20 rounded-3xl border border-dashed transition-all duration-500 ${
              isDark 
                ? 'bg-stone-900/20 border-stone-800/60' 
                : 'bg-stone-50/60 border-stone-200/60'
            }`}>
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 ${
                isDark ? 'bg-stone-800/50' : 'bg-stone-100'
              }`}>
                <ImageIcon className={`w-9 h-9 ${
                  isDark ? 'text-stone-600' : 'text-stone-400'
                }`} />
              </div>
              <p className={`text-sm font-medium ${
                isDark ? 'text-stone-300' : 'text-stone-700'
              }`}>
                No hay fotos de micropigmentación aún
              </p>
              <p className={`text-xs mt-1 ${
                isDark ? 'text-stone-500' : 'text-stone-400'
              }`}>
                Las fotos subidas desde el panel de administración aparecerán aquí
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((img, index) => (
                <motion.div
                  key={`${img.source}-${img.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  onClick={() => openLightbox(img)}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer group aspect-square transition-all duration-500 ${
                    isDark 
                      ? 'bg-stone-900/40 hover:shadow-2xl hover:shadow-pink-500/5' 
                      : 'bg-stone-100 hover:shadow-2xl hover:shadow-pink-200/20'
                  }`}
                >
                  <img 
                    src={img.image_url} 
                    alt={img.title || 'Trabajo de micropigmentación'}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    loading="lazy"
                  />

                  {/* Overlay en hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-sm font-light truncate">{img.title || 'Trabajo de micropigmentación'}</h3>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ${
                          img.source === 'admin' ? 'bg-pink-500/80' : 'bg-amber-500/80'
                        }`}>
                          {img.source === 'admin' ? 'Fresh Nails' : 'Cliente'}
                        </span>
                        <ZoomIn className="w-4 h-4 text-white/60 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>

                  {/* Badge de origen flotante */}
                  <div className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[6px] text-white/90 tracking-[0.15em] uppercase font-black backdrop-blur-md ${
                    img.source === 'admin' ? 'bg-pink-500/60' : 'bg-amber-500/60'
                  }`}>
                    {img.source === 'admin' ? '👑 Studio' : '📸 Cliente'}
                  </div>

                  {/* Contador de índice */}
                  <div className="absolute top-3 right-3 text-[8px] font-mono font-black text-white/40">
                    #{String(index + 1).padStart(2, '0')}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: TESTIMONIOS — REDISEÑADO */}
      {/* ============================================================ */}
      {activeTab === 'testimonios' && (
        <div className="animate-fadeIn">
          {Object.values(reviews).flat().length === 0 ? (
            <div className={`text-center py-20 rounded-3xl border border-dashed transition-all duration-500 ${
              isDark 
                ? 'bg-stone-900/20 border-stone-800/60' 
                : 'bg-stone-50/60 border-stone-200/60'
            }`}>
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 ${
                isDark ? 'bg-stone-800/50' : 'bg-stone-100'
              }`}>
                <Quote className={`w-9 h-9 ${
                  isDark ? 'text-stone-600' : 'text-stone-400'
                }`} />
              </div>
              <p className={`text-sm font-medium ${
                isDark ? 'text-stone-300' : 'text-stone-700'
              }`}>
                Aún no hay testimonios registrados
              </p>
              <p className={`text-xs mt-1 ${
                isDark ? 'text-stone-500' : 'text-stone-400'
              }`}>
                Sé el primero en compartir tu experiencia
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Object.values(reviews).flat().map((rev, index) => (
                <motion.div
                  key={rev.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className={`group p-6 rounded-2xl border transition-all duration-500 hover:-translate-y-1 ${
                    isDark 
                      ? 'bg-gradient-to-br from-[#130f24]/80 to-[#130f24]/40 border-stone-900/60 hover:border-pink-500/30 hover:shadow-2xl' 
                      : 'bg-gradient-to-br from-white via-stone-50/60 to-white border-stone-200/50 hover:border-pink-300/50 hover:shadow-2xl'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className={`font-black text-sm tracking-tight ${
                        isDark ? 'text-stone-100' : 'text-stone-800'
                      }`}>
                        {rev.client_name}
                      </h4>
                      <span className={`text-[10px] font-medium ${
                        isDark ? 'text-stone-500' : 'text-stone-400'
                      }`}>
                        {new Date(rev.created_at).toLocaleDateString('es-ES', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    {renderStars(rev.rating, 'md')}
                  </div>
                  
                  <div className={`relative pl-4 border-l-2 ${
                    isDark ? 'border-pink-500/30' : 'border-pink-200'
                  }`}>
                    <Quote className={`absolute -left-2 -top-1 w-4 h-4 ${
                      isDark ? 'text-pink-500/30' : 'text-pink-300'
                    }`} />
                    <p className={`text-sm leading-relaxed pl-4 ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}>
                      {rev.comment}
                    </p>
                  </div>

                  {/* Badge de servicio */}
                  <div className={`mt-3 pt-3 border-t text-[9px] font-medium ${
                    isDark ? 'border-stone-800/60 text-stone-500' : 'border-stone-200/60 text-stone-400'
                  }`}>
                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="w-3 h-3 text-pink-400" />
                      Servicio: <span className={`font-bold ${
                        isDark ? 'text-stone-300' : 'text-stone-600'
                      }`}>
                        {servicios.find(s => s.id === rev.service_id)?.name || 'No especificado'}
                      </span>
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* LIGHTBOX PARA GALERÍA — CON DISEÑO PREMIUM */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isLightboxOpen && selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-3 md:p-6"
            onClick={closeLightbox}
          >
            {/* Botón cerrar */}
            <motion.button 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              onClick={closeLightbox}
              className="absolute top-4 right-4 md:top-6 md:right-6 p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 bg-black/40 backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Navegación */}
            {galleryImages.length > 1 && (
              <>
                <motion.button 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
                  className="absolute left-2 md:left-6 p-2.5 md:p-3.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 bg-black/30 backdrop-blur-sm"
                >
                  <ChevronLeft className="w-6 h-6" />
                </motion.button>
                <motion.button 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
                  className="absolute right-2 md:right-6 p-2.5 md:p-3.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 bg-black/30 backdrop-blur-sm"
                >
                  <ChevronRight className="w-6 h-6" />
                </motion.button>
              </>
            )}

            {/* Contador */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-[10px] tracking-[0.3em] font-mono z-50 bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10"
            >
              {galleryImages.findIndex(i => i.id === selectedImage.id) + 1} / {galleryImages.length}
            </motion.div>

            {/* Imagen */}
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative z-10 max-w-5xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedImage.image_url} 
                alt={selectedImage.title || 'Galería de micropigmentación'}
                className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-2xl"
              />

              {/* Info inferior */}
              {(selectedImage.title || selectedImage.source) && (
                <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-b-2xl ${
                  !selectedImage.title ? 'pb-12' : ''
                }`}>
                  {selectedImage.title && (
                    <p className="text-white text-lg font-light">{selectedImage.title}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-0.5 rounded-full ${
                      selectedImage.source === 'admin' ? 'bg-pink-500/80' : 'bg-amber-500/80'
                    }`}>
                      {selectedImage.source === 'admin' ? '👑 Fresh Nails' : '📸 Cliente'}
                    </span>
                    {selectedImage.category && (
                      <>
                        <span className="w-0.5 h-3 bg-white/20" />
                        <span className="text-[10px] text-white/50">{selectedImage.category}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL DE DETALLE DE SERVICIO — REDISEÑADO */}
      {/* ============================================================ */}
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
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`relative p-8 rounded-3xl max-w-md w-full space-y-5 shadow-2xl border ${
                isDark 
                  ? 'bg-gradient-to-br from-[#130f24] to-[#0f0c1b] border-stone-900/60' 
                  : 'bg-white border-stone-200/60'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={closeModal}
                className={`absolute top-4 right-4 p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                  isDark ? 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="aspect-video rounded-xl overflow-hidden">
                <img 
                  src={selectedService.image_url || 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=600&h=400&fit=crop'} 
                  alt={selectedService.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${
                    isDark ? 'text-pink-400' : 'text-pink-500'
                  }`}>
                    {selectedService.category || 'Micropigmentación'}
                  </span>
                  <span className={`w-1 h-1 rounded-full ${
                    isDark ? 'bg-stone-700' : 'bg-stone-300'
                  }`} />
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  }`}>
                    <Clock className="w-2.5 h-2.5 inline" /> {selectedService.duration} min
                  </span>
                </div>
                <h3 className={`text-xl font-black tracking-tight mt-1 ${
                  isDark ? 'text-white' : 'text-stone-900'
                }`}>
                  {selectedService.name}
                </h3>
                <p className={`text-xs leading-relaxed mt-2 ${
                  isDark ? 'text-stone-400' : 'text-stone-500'
                }`}>
                  {selectedService.description || 'Técnica avanzada de micropigmentación diseñada para realzar tu belleza natural.'}
                </p>
              </div>

              <div className={`flex items-center justify-between pt-4 border-t ${
                isDark ? 'border-stone-800/60' : 'border-stone-200/60'
              }`}>
                <div>
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  }`}>Inversión</span>
                  <p className={`text-2xl font-black font-mono ${
                    isDark ? 'text-emerald-400' : 'text-emerald-600'
                  }`}>
                    ${selectedService.price}
                  </p>
                </div>
                <Link 
                  href="/agenda" 
                  className="group relative overflow-hidden px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] text-white shadow-xl flex items-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95"
                  style={brandGradient}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="relative">Agendar Cupo</span>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* MODAL DE RESEÑA — REDISEÑADO */}
        {/* ============================================================ */}
        {showReviewModal && selectedService && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setShowReviewModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`relative p-8 rounded-3xl max-w-sm w-full space-y-5 shadow-2xl border ${
                isDark 
                  ? 'bg-gradient-to-br from-[#130f24] to-[#0f0c1b] border-stone-900/60' 
                  : 'bg-white border-stone-200/60'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowReviewModal(false)}
                className={`absolute top-4 right-4 p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                  isDark ? 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  isDark ? 'bg-amber-500/10' : 'bg-amber-50'
                }`}>
                  <Star className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className={`text-xl font-black tracking-tight ${
                  isDark ? 'text-white' : 'text-stone-900'
                }`}>
                  Calificar servicio
                </h3>
                <p className={`text-xs mt-1 ${
                  isDark ? 'text-stone-400' : 'text-stone-500'
                }`}>
                  {selectedService.name}
                </p>
              </div>

              {/* Estrellas */}
              <div className="flex justify-center gap-1.5 py-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <motion.button
                    key={s}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(s)}
                    className="focus:outline-none"
                  >
                    <Star className={`w-10 h-10 transition-all duration-300 ${
                      (hoverRating || rating) >= s 
                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]' 
                        : isDark ? 'text-stone-700' : 'text-stone-300'
                    }`} />
                  </motion.button>
                ))}
              </div>

              <textarea 
                value={comment} 
                onChange={e => setComment(e.target.value)} 
                placeholder="Cuéntanos tu experiencia con este servicio..." 
                className={`w-full p-4 rounded-xl text-sm font-medium transition-all duration-300 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/20 ${
                  isDark 
                    ? 'bg-stone-900/60 border-stone-800/60 text-white placeholder:text-stone-500' 
                    : 'bg-stone-50/80 border-stone-200/60 text-stone-800 placeholder:text-stone-400'
                }`}
                rows={4}
                style={comment ? { borderColor: primaryColor, borderWidth: '1px' } : {}}
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowReviewModal(false)} 
                  className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 hover:scale-105 active:scale-95 border ${
                    isDark 
                      ? 'border-stone-800/60 text-stone-400 hover:bg-stone-800/50' 
                      : 'border-stone-200/60 text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSubmitReview} 
                  disabled={submitting || !rating || !comment.trim()} 
                  className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-xl disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDark 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/30' 
                      : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/30'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Enviar Reseña
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