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
  Image as ImageIcon
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
    backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
  }

  const categories = [
    { id: 'all', label: 'Todos', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'Cejas', label: 'Cejas', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'Labios', label: 'Labios', icon: <Droplets className="w-3.5 h-3.5" /> },
    { id: 'Ojos', label: 'Ojos', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'Tratamientos', label: 'Tratamientos', icon: <Feather className="w-3.5 h-3.5" /> },
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
        .ilike('category', 'Micropigmentacion') // 🔥 Filtro por categoría
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 animate-spin" style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }} />
          <Sparkles className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: primaryColor }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4">
      {errorMessage && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">{errorMessage}</div>}
      {successMessage && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">{successMessage}</div>}

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl min-h-[380px] flex items-center">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=1200&h=600&fit=crop" alt="Micropigmentación" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        </div>
        <div className="relative z-10 p-6 md:p-12 max-w-2xl text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/10 mb-4 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Fresh Nails • Micropigmentación</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-light tracking-tight leading-tight">
            <span className="font-serif italic" style={{ color: secondaryColor }}>Arte</span> Permanente
          </h1>
          <p className="text-sm md:text-base text-white/80 mt-4 max-w-md">
            Microblading, Microshading y técnicas avanzadas conducidas por nuestra especialista.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/agenda" className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 transition hover:scale-105" style={{ background: brandGradient.backgroundImage }}>
              <Calendar className="w-4 h-4" /> Reservar
            </Link>
            <button onClick={() => setActiveTab('galeria')} className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition hover:bg-white/20">
              <Camera className="w-4 h-4" /> Galería
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-stone-200 dark:border-stone-800">
        {(['servicios', 'galeria', 'testimonios'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all ${
              activeTab === tab ? 'text-pink-500' : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
            style={activeTab === tab ? { borderColor: primaryColor, color: primaryColor } : {}}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ============================================================
          TAB: SERVICIOS
      ============================================================ */}
      {activeTab === 'servicios' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id ? 'text-white shadow-md' : isDark ? 'bg-[#130f24] text-stone-400' : 'bg-white text-stone-600 border'
                }`}
                style={selectedCategory === cat.id ? { background: brandGradient.backgroundImage } : {}}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 p-3 rounded-2xl border bg-white dark:bg-[#130f24] dark:border-stone-800">
            <div className="flex-1 flex items-center gap-3">
              <Search className="w-4 h-4 text-stone-400" />
              <input 
                type="text" 
                placeholder="Buscar servicios..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent outline-none text-xs w-full dark:text-white"
              />
            </div>
            <div className="flex rounded-xl overflow-hidden border p-0.5 dark:border-stone-800">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-stone-100 dark:bg-stone-800' : 'text-stone-400'}`}><Grid3x3 className="w-3.5 h-3.5" /></button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-stone-100 dark:bg-stone-800' : 'text-stone-400'}`}><LayoutList className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible" 
            className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}
          >
            {filteredServicios.map((servicio) => {
              const avgRating = getAverageRating(servicio.id)

              return (
                <motion.div 
                  key={servicio.id} 
                  variants={itemVariants} 
                  className={`p-4 border rounded-2xl bg-white dark:bg-[#130f24] dark:border-stone-800 flex ${viewMode === 'grid' ? 'flex-col justify-between' : 'flex-row gap-4 items-center'}`}
                >
                  <div onClick={() => openModal(servicio)} className={`cursor-pointer ${viewMode === 'grid' ? 'space-y-2' : 'flex-1 flex gap-4 items-center'}`}>
                    <img src={servicio.image_url || 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=600&h=400&fit=crop'} alt={servicio.name} className={`${viewMode === 'grid' ? 'w-full aspect-video' : 'w-24 h-24'} object-cover rounded-xl`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center"><h3 className="font-bold text-sm dark:text-white">{servicio.name}</h3><span className="text-xs font-bold text-emerald-500">${servicio.price}</span></div>
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1">{servicio.description}</p>
                    </div>
                  </div>
                  <div className={`flex items-center justify-between ${viewMode === 'grid' ? 'mt-4 pt-2 border-t' : 'flex-col gap-2 justify-center'} dark:border-stone-800`}>
                    <div className="flex items-center gap-1 text-[11px] text-stone-400"><Clock className="w-3 h-3" /> {servicio.duration} min</div>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedService(servicio); setShowReviewModal(true) }} className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1"><Star className="w-3 h-3 fill-amber-500" /> Reseñar</button>
                      <Link href="/agenda" className="px-3 py-1 rounded-lg text-white text-[10px] font-bold uppercase tracking-wider" style={{ background: brandGradient.backgroundImage }}>Agendar</Link>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      )}

      {/* ============================================================
          TAB: GALERÍA - CON FOTOS DE LA BASE DE DATOS
      ============================================================ */}
      {activeTab === 'galeria' && (
        <div>
          {galleryImages.length === 0 ? (
            <div className="text-center py-16 bg-stone-50 dark:bg-stone-900/30 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800">
              <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-stone-400" />
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400 font-light">No hay fotos de micropigmentación aún</p>
              <p className="text-xs text-stone-400 mt-1">Las fotos subidas desde el panel de administración aparecerán aquí</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((img) => (
                <div
                  key={`${img.source}-${img.id}`}
                  onClick={() => openLightbox(img)}
                  className="relative rounded-2xl overflow-hidden cursor-pointer group aspect-square bg-stone-100 dark:bg-stone-800 hover:shadow-2xl transition-all duration-300"
                >
                  <img 
                    src={img.image_url} 
                    alt={img.title || 'Trabajo de micropigmentación'}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  
                  {/* Overlay en hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-sm font-light truncate">{img.title || 'Trabajo de micropigmentación'}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-white/60">
                          {img.source === 'admin' ? '👑 Fresh Nails' : '👤 Cliente'}
                        </span>
                        <ZoomIn className="w-4 h-4 text-white/60" />
                      </div>
                    </div>
                  </div>

                  {/* Badge de origen */}
                  <div className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[7px] text-white/90 tracking-[0.15em] uppercase font-medium ${
                    img.source === 'admin' ? 'bg-pink-500/80' : 'bg-amber-500/80'
                  }`}>
                    {img.source === 'admin' ? 'Fresh Nails' : 'Cliente'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          TAB: TESTIMONIOS
      ============================================================ */}
      {activeTab === 'testimonios' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(reviews).flat().length === 0 ? (
            <div className="col-span-full text-center py-16 text-stone-400 text-xs uppercase tracking-widest">
              <Quote className="w-8 h-8 mx-auto mb-4 opacity-20" />
              Aún no hay testimonios registrados
            </div>
          ) : (
            Object.values(reviews).flat().map((rev) => (
              <div key={rev.id} className="p-5 border rounded-2xl bg-white dark:bg-[#130f24] dark:border-stone-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-xs dark:text-white">{rev.client_name}</h4>
                    <span className="text-[10px] text-stone-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                  </div>
                  {renderStars(rev.rating)}
                </div>
                <p className="text-xs italic text-stone-600 dark:text-stone-300 flex gap-2">
                  <Quote className="w-4 h-4 shrink-0 opacity-20" />
                  {rev.comment}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ============================================================
          LIGHTBOX PARA GALERÍA
      ============================================================ */}
      <AnimatePresence>
        {isLightboxOpen && selectedImage && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-fadeIn"
            onClick={closeLightbox}
          >
            <button 
              onClick={closeLightbox}
              className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 bg-black/40 backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>

            {galleryImages.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
                  className="absolute left-2 md:left-6 p-2 md:p-3 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 bg-black/20 backdrop-blur-xs"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
                  className="absolute right-2 md:right-6 p-2 md:p-3 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 bg-black/20 backdrop-blur-xs"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-[10px] tracking-[0.2em] font-mono z-50">
              {galleryImages.findIndex(i => i.id === selectedImage.id) + 1} / {galleryImages.length}
            </div>

            <div 
              className="relative z-10 max-w-5xl max-h-[90vh] animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedImage.image_url} 
                alt={selectedImage.title || 'Galería de micropigmentación'}
                className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-2xl"
              />
              
              {selectedImage.title && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl">
                  <p className="text-white text-sm font-light">{selectedImage.title}</p>
                  <p className="text-[10px] text-white/50 mt-1">
                    {selectedImage.source === 'admin' ? '👑 Fresh Nails' : '👤 Cliente'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================
          MODAL DE SERVICIO
      ============================================================ */}
      <AnimatePresence>
        {isModalOpen && selectedService && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
            <motion.div className="bg-white dark:bg-[#0f0c1b] p-6 rounded-3xl max-w-sm w-full space-y-4 relative" onClick={e => e.stopPropagation()}>
              <button onClick={closeModal} className="absolute top-4 right-4 text-stone-400"><X className="w-4 h-4" /></button>
              <h3 className="text-lg font-bold dark:text-white">{selectedService.name}</h3>
              <p className="text-xs text-stone-500 leading-relaxed">{selectedService.description}</p>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-emerald-500">${selectedService.price}</span>
                <Link href="/agenda" className="px-4 py-2 text-white text-xs font-bold rounded-xl" style={{ background: brandGradient.backgroundImage }}>Agendar Cupo</Link>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showReviewModal && selectedService && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowReviewModal(false)}>
            <motion.div className="bg-white dark:bg-[#0f0c1b] p-6 rounded-3xl max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-bold dark:text-white">Calificar {selectedService.name}</h3>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(s)}>
                    <Star className={`w-8 h-8 ${(hoverRating || rating) >= s ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                  </button>
                ))}
              </div>
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Tu opinión sobre el servicio..." className="w-full p-3 border rounded-xl text-xs dark:bg-stone-900 outline-none" rows={3} />
              <div className="flex gap-2">
                <button onClick={() => setShowReviewModal(false)} className="flex-1 py-2 border rounded-xl text-xs">Cancelar</button>
                <button onClick={handleSubmitReview} disabled={submitting || !rating} className="flex-1 py-2 text-white text-xs rounded-xl font-bold flex justify-center items-center" style={{ backgroundColor: primaryColor }}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          STYLES GLOBALES
      ============================================================ */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            transform: scale(0.92);
            opacity: 0;
          }
          to { 
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}