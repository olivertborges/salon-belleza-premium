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

const EsteticaLoadingSpinner = ({ isDark }: { isDark: boolean }) => (
  <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-500 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-16 h-16">
        <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
        <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
      </div>
      <p className={`text-[10px] tracking-[0.4em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]/60'}`}>
        Cargando bienestar & estética...
      </p>
    </div>
  </div>
)

export default function EsteticaPage() {
  const { theme } = useTheme()
  const { user, tenantId } = useAuth()
  const { settings } = useSettings()
  const isDark = theme === 'dark'

  const [servicios, setServicios] = useState<Servicio[]>([])
  const [filteredServicios, setFilteredServicios] = useState<Servicio[]>([])
  const [reviews, setReviews] = useState<Record<string, Review[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  const [galleryImages, setGalleryImages] = useState<any[]>([])
  const [selectedImage, setSelectedImage] = useState<any | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          cargarServicios(),
          cargarReviews(),
          cargarGallery()
        ])
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Error al cargar los datos')
      }
    }
    loadData()
  }, [tenantId])

  useEffect(() => {
    try {
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
    } catch (err) {
      console.error('Error filtering:', err)
    }
  }, [selectedCategory, searchTerm, servicios])

  const cargarServicios = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!tenantId) {
        await new Promise(resolve => setTimeout(resolve, 500))
        if (!tenantId) {
          setError('No se pudo cargar el tenant. Por favor, recarga la página.')
          setLoading(false)
          return
        }
      }

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
      setError('Error al cargar los servicios')
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

  const cargarGallery = async () => {
    if (!tenantId) return
    try {
      let allImages: any[] = []
      const { data: adminPhotos, error: adminError } = await supabase
        .from('gallery')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .ilike('category', 'Estética')
        .order('created_at', { ascending: false })
      if (!adminError && adminPhotos) {
        const mappedAdmin = adminPhotos.map((p: any) => ({
          ...p,
          source: 'admin' as const,
          category: p.category || 'Estética'
        }))
        allImages = [...allImages, ...mappedAdmin]
      }
      const { data: clientPhotos, error: clientError } = await supabase
        .from('client_gallery')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .eq('is_public', true)
        .ilike('category', 'Estética')
        .order('created_at', { ascending: false })
      if (!clientError && clientPhotos) {
        const mappedClient = clientPhotos.map((p: any) => ({
          id: p.id,
          tenant_id: p.tenant_id,
          image_url: p.after_image_url || p.image_url || p.before_image_url || '',
          title: p.title || 'Trabajo de cliente',
          category: p.category || 'Estética',
          description: p.description || '',
          is_active: p.is_active !== undefined ? p.is_active : true,
          created_at: p.created_at,
          source: 'client' as const
        }))
        allImages = [...allImages, ...mappedClient]
      }
      allImages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setGalleryImages(allImages)
    } catch (error) {
      console.error('Error cargando galería:', error)
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
    try {
      const serviceReviews = reviews[serviceId] || []
      if (serviceReviews.length === 0) return 0
      const sum = serviceReviews.reduce((acc, r) => acc + r.rating, 0)
      return sum / serviceReviews.length
    } catch {
      return 0
    }
  }

  const getRatingCount = (serviceId: string) => {
    try {
      return reviews[serviceId]?.length || 0
    } catch {
      return 0
    }
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
          <Star key={`full-${i}`} className={`${sizeClass} fill-[#D4AF37] text-[#D4AF37]`} />
        ))}
        {hasHalfStar && <StarHalf className={`${sizeClass} fill-[#D4AF37] text-[#D4AF37]`} />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className={`${sizeClass} ${isDark ? 'text-[#3D281E]' : 'text-[#F0E4DA]'}`} />
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
    switch (badge) {
      case 'Más Solicitado': return 'bg-[#D4AF37]/10 border-[#D4AF37]/20 text-[#D4AF37]'
      case 'Tendencia': return 'bg-[#D4AF37]/10 border-[#D4AF37]/20 text-[#D4AF37]'
      case 'Premium': return 'bg-[#D4AF37]/10 border-[#D4AF37]/20 text-[#D4AF37]'
      case 'Nuevo': return 'bg-[#D4AF37]/10 border-[#D4AF37]/20 text-[#D4AF37]'
      default: return 'bg-[#A89588]/10 border-[#A89588]/20 text-[#A89588]'
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

  const openLightbox = (image: any) => {
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

  if (loading) {
    return <EsteticaLoadingSpinner isDark={isDark} />
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[60vh] ${
        isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'
      }`}>
        <div className={`rounded-2xl p-8 max-w-md text-center border ${
          isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
        }`}>
          <AlertCircle className="w-12 h-12 text-[#D4AF37] mx-auto mb-4" />
          <p className={`text-lg font-bold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>Ups, algo salió mal</p>
          <p className={`text-sm mt-2 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={`mt-4 px-6 py-2 rounded-xl font-bold text-sm transition-colors ${
              isDark 
                ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37] hover:text-[#1A0E0A]'
            }`}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-16 relative overflow-x-hidden ${
      isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'
    }`}>
      {/* Fondo texturizado */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-7xl mx-auto px-4 space-y-8 relative z-10">

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
        {/* HERO SECTION — CON FOTO DE ANY */}
        {/* ============================================================ */}
        <div className={`relative overflow-hidden rounded-2xl min-h-[440px] md:min-h-[500px] flex items-center shadow-lg mt-4 border transition-all duration-300 ${
          isDark 
            ? 'border-[#3D281E] shadow-[0_15px_35px_rgba(0,0,0,0.3)]' 
            : 'border-[#F0E4DA] shadow-[0_15px_35px_rgba(240,228,218,0.6)]'
        }`}>
          <div className="absolute inset-0">
            <img 
              src="https://kzovcbefedfmpeucrofh.supabase.co/storage/v1/object/public/profesionals/any.png"
              alt="Any - Estética y Bienestar"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 p-6 md:p-12 max-w-3xl w-full">
            <div className="text-white">
              
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-sm border mb-4 ${
                isDark 
                  ? 'bg-[#D4AF37]/10 border-[#D4AF37]/20' 
                  : 'bg-white/10 border-white/20'
              }`}>
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                <span className={`text-[7px] uppercase tracking-[0.2em] font-black ${
                  isDark ? 'text-[#D4AF37]' : 'text-white/90'
                }`}>
                  {settings?.business_name || 'Fresh Nails Studio'}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                <span className="font-serif italic font-light text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#E8D5A0] to-white">
                  Any
                </span>
                <span className="block text-white/90 text-2xl md:text-3xl lg:text-4xl font-light mt-1">
                  Estética & Bienestar
                </span>
              </h1>
              
              <p className="text-sm md:text-base text-white/70 mt-3 max-w-md font-light tracking-wide">
                Especialista en tratamientos faciales, corporales y masajes para equilibrar cuerpo y mente.
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link 
                  href="/agenda" 
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97] ${
                    isDark 
                      ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                      : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37] hover:text-[#1A0E0A]'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Reservar con Any</span>
                </Link>

                <button 
                  onClick={() => setActiveTab('galeria')} 
                  className={`px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97] backdrop-blur-sm ${
                    isDark 
                      ? 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20' 
                      : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" /> 
                  <span>Galería</span>
                </button>
              </div>

              <div className="flex gap-4 mt-6 pt-4 border-t border-white/10">
                <div>
                  <p className="text-lg font-black text-[#D4AF37]">{servicios.length}</p>
                  <p className="text-[7px] font-black uppercase tracking-[0.15em] text-white/40">Servicios</p>
                </div>
                <div className="w-px bg-white/10" />
                <div>
                  <p className="text-lg font-black text-[#D4AF37]">{galleryImages.length}</p>
                  <p className="text-[7px] font-black uppercase tracking-[0.15em] text-white/40">Trabajos</p>
                </div>
                <div className="w-px bg-white/10" />
                <div>
                  <p className="text-lg font-black text-[#D4AF37]">{Object.values(reviews).flat().length}</p>
                  <p className="text-[7px] font-black uppercase tracking-[0.15em] text-white/40">Reseñas</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TABS NAVEGACIÓN — RESPONSIVE */}
        {/* ============================================================ */}
        <div className={`flex border-b pb-0 overflow-x-auto ${
          isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
        }`}>
          {[
            { id: 'servicios', label: 'Rituales', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'galeria', label: 'Inspiración', icon: <Camera className="w-4 h-4" /> },
            { id: 'testimonios', label: 'Testimonios', icon: <Quote className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] font-black whitespace-nowrap transition-all duration-500 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-[#D4AF37]'
                  : isDark ? 'text-[#A89588] hover:text-[#FFF9F6]' : 'text-[#5C4A3E] hover:text-[#1A0E0A]'
              }`}
            >
              {tab.icon}
              <span className="relative z-10">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.span
                  layoutId="tabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#D4AF37]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ============================================================ */}
        {/* TAB: SERVICIOS */}
        {/* ============================================================ */}
        {activeTab === 'servicios' && (
          <div className="mt-6 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-black uppercase tracking-wider font-mono flex items-center gap-2 ${
                isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
              }`}>
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                Filtrar Tratamientos
              </h3>
              {selectedCategory !== 'todos' && (
                <button
                  onClick={() => setSelectedCategory('todos')}
                  className="text-[10px] font-mono font-black uppercase tracking-widest text-[#D4AF37] hover:text-[#E8D5A0] transition-colors flex items-center gap-1"
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
                        ? isDark 
                          ? 'bg-[#D4AF37] text-[#1A0E0A] border-[#D4AF37] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' 
                          : 'bg-[#1A0E0A] text-[#FFF9F6] border-[#1A0E0A] shadow-[0_4px_15px_rgba(26,14,10,0.2)]'
                        : isDark
                          ? 'bg-[#2A1B14] border-[#3D281E] text-[#A89588] hover:border-[#D4AF37]/40 hover:text-[#FFF9F6]'
                          : 'bg-white border-[#F0E4DA] text-[#5C4A3E] hover:border-[#D4AF37]/40 hover:text-[#1A0E0A]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive 
                        ? isDark ? 'text-[#1A0E0A]' : 'text-[#FFF9F6]'
                        : isDark ? 'text-[#A89588] group-hover:text-[#D4AF37]' : 'text-[#A89588] group-hover:text-[#D4AF37]'
                    }`} />
                    <span className="font-bold uppercase tracking-wide truncate">{cat.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Buscador y Selectores */}
            <div className={`flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border transition-all duration-300 ${
              isDark 
                ? 'bg-[#2A1B14]/60 border-[#3D281E]' 
                : 'bg-white border-[#F0E4DA] shadow-[0_4px_15px_rgba(240,228,218,0.3)]'
            }`}>
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <Search className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
                <input
                  type="text"
                  placeholder="Buscar tratamientos por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`bg-transparent border-none outline-none text-xs w-full font-medium min-w-0 ${
                    isDark ? 'text-[#FFF9F6] placeholder:text-[#A89588]' : 'text-[#1A0E0A] placeholder:text-[#A89588]'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-medium flex items-center gap-1.5 border transition-all duration-300 ${
                    showFilters
                      ? isDark 
                        ? 'bg-[#D4AF37] text-[#1A0E0A] border-[#D4AF37]' 
                        : 'bg-[#1A0E0A] text-[#FFF9F6] border-[#1A0E0A]'
                      : isDark 
                        ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588]' 
                        : 'bg-white border-[#F0E4DA] text-[#5C4A3E]'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" /> Filtros
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

            {/* CONTENEDOR RENDERIZADO DE TRATAMIENTOS */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-3"}
            >
              {filteredServicios.length === 0 ? (
                <div className={`col-span-full border border-dashed rounded-2xl p-16 text-center transition-all duration-300 ${
                  isDark
                    ? 'border-[#3D281E] bg-[#2A1B14]/40'
                    : 'border-[#F0E4DA] bg-white'
                }`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
                  }`}>
                    <Sparkles className={`w-8 h-8 ${isDark ? 'text-[#A89588]' : 'text-[#A89588]'}`} />
                  </div>
                  <p className={`text-sm font-medium ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                    No se encontraron tratamientos
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
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
                        className={`group relative rounded-2xl border p-5 transition-all duration-500 transform hover:-translate-y-1 hover:shadow-xl flex ${
                          viewMode === 'grid' ? 'flex-col justify-between min-h-[220px]' : 'flex-row gap-6 items-center'
                        } overflow-hidden cursor-pointer ${
                          isDark
                            ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]'
                            : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
                        }`}
                        onClick={() => {
                          setSelectedService(servicio)
                          setIsModalOpen(true)
                        }}
                      >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-[#D4AF37]/[0.03] to-[#E8D5A0]/[0.01]" />

                        {servicio.badge && viewMode === 'grid' && (
                          <span className={`absolute top-4 right-4 z-10 text-[7px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border ${badgeColor}`}>
                            {servicio.badge}
                          </span>
                        )}

                        <div className={viewMode === 'list' ? 'flex-1 flex gap-5 items-center min-w-0 relative z-10' : 'w-full relative z-10'}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shrink-0 ${
                            isDark ? 'bg-[#3D281E] border border-[#D4AF37]/20 text-[#D4AF37]' : 'bg-[#FFF9F6] border border-[#F0E4DA] text-[#D4AF37]'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className={`font-black text-sm tracking-tight transition-colors truncate ${
                                isDark ? 'text-[#FFF9F6] group-hover:text-[#D4AF37]' : 'text-[#1A0E0A] group-hover:text-[#D4AF37]'
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
                              isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                            }`}>
                              {servicio.description || 'Tratamiento profesional estético de alta gama.'}
                            </p>

                            <div className="flex items-center gap-2 mt-1.5">
                              {avgRating > 0 ? (
                                <>
                                  {renderStars(avgRating, 'sm')}
                                  <span className={`text-[9px] font-bold ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>{avgRating.toFixed(1)}</span>
                                  <span className={`text-[8px] ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>({ratingCount})</span>
                                </>
                              ) : (
                                <span className={`text-[9px] ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Sin calificaciones</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={`flex items-center justify-between border-dashed relative z-10 ${
                          viewMode === 'grid' ? 'border-t mt-3 pt-3.5' : 'flex-col sm:flex-row gap-2 border-l pl-5'
                        } ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`}>
                          <div className="flex items-center gap-2.5 whitespace-nowrap">
                            <span className={`text-base font-mono font-black tracking-tight text-[#D4AF37]`}>
                              ${servicio.price?.toLocaleString()}
                            </span>
                            <span className={`text-[8px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                              isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                            }`}>
                              <Clock className="w-3 h-3 text-[#D4AF37]" />
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
                                  ? 'bg-[#1E120C] border border-[#3D281E] text-[#A89588] hover:text-[#D4AF37] hover:border-[#D4AF37]/30'
                                  : 'bg-[#FFF9F6] border border-[#F0E4DA] text-[#A89588] hover:text-[#D4AF37] hover:border-[#D4AF37]/30'
                              }`}
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                            <Link
                              href={user ? '/agenda' : '/login'}
                              className={`p-1.5 sm:p-2 rounded-xl transition-all duration-300 ${
                                isDark
                                  ? 'bg-[#1E120C] border border-[#3D281E] text-[#A89588] hover:text-[#D4AF37] hover:border-[#D4AF37]/30'
                                  : 'bg-[#FFF9F6] border border-[#F0E4DA] text-[#A89588] hover:text-[#D4AF37] hover:border-[#D4AF37]/30'
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
        {/* TAB: GALERÍA */}
        {/* ============================================================ */}
        {activeTab === 'galeria' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 mt-6">
            {galleryImages.length === 0 ? (
              <div className={`text-center py-20 rounded-2xl border border-dashed transition-all duration-300 ${
                isDark 
                  ? 'bg-[#2A1B14]/40 border-[#3D281E]' 
                  : 'bg-white border-[#F0E4DA]'
              }`}>
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 ${
                  isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
                }`}>
                  <Camera className={`w-9 h-9 ${isDark ? 'text-[#A89588]' : 'text-[#A89588]'}`} />
                </div>
                <p className={`text-sm font-medium ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  No hay fotos de estética aún
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                  Las fotos subidas desde el panel de administración aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {galleryImages.slice(0, 8).map((img, index) => (
                  <motion.div
                    key={`${img.source}-${img.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    onClick={() => openLightbox(img)}
                    className={`relative rounded-2xl overflow-hidden cursor-pointer group aspect-square transition-all duration-500 hover:-translate-y-1 ${
                      isDark 
                        ? 'bg-[#2A1B14] hover:shadow-[0_10px_30px_rgba(212,175,55,0.1)]' 
                        : 'bg-[#FFF9F6] hover:shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
                    }`}
                  >
                    <img 
                      src={img.image_url} 
                      alt={img.title || 'Trabajo de estética'}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="text-sm font-light truncate">{img.title || 'Trabajo de estética'}</h3>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ${
                            img.source === 'admin' ? 'bg-[#D4AF37] text-[#1A0E0A]' : 'bg-[#A89588] text-white'
                          }`}>
                            {img.source === 'admin' ? 'Fresh Nails' : 'Cliente'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white/80">
                      #{String(index + 1).padStart(2, '0')}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* TAB: TESTIMONIOS */}
        {/* ============================================================ */}
        {activeTab === 'testimonios' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 mt-6">
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
                        ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]'
                        : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#E8D5A0] flex items-center justify-center text-[#1A0E0A] font-black text-sm shadow-lg shadow-[#D4AF37]/20">
                        {review.client_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <p className={`font-black text-sm tracking-tight ${
                          isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                        }`}>
                          {review.client_name}
                        </p>
                        <p className={`text-[10px] font-medium ${
                          isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                        }`}>
                          Estética
                        </p>
                      </div>
                    </div>
                    <div className="flex text-[#D4AF37] text-sm mb-2">
                      {renderStars(review.rating || 5, 'md')}
                    </div>
                    <p className={`text-sm leading-relaxed ${
                      isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                    }`}>
                      "{review.comment}"
                    </p>
                  </motion.div>
                ))
              ) : (
                <>
                  <div className={`group p-5 rounded-2xl border transition-all duration-500 hover:-translate-y-1 ${
                    isDark
                      ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]'
                      : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#E8D5A0] flex items-center justify-center text-[#1A0E0A] font-black text-sm">M</div>
                      <div>
                        <p className={`font-black text-sm tracking-tight ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>María González</p>
                        <p className={`text-[10px] font-medium ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Estética</p>
                      </div>
                    </div>
                    <div className="flex text-[#D4AF37] text-sm mb-2">{renderStars(5, 'md')}</div>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                      "Los tratamientos faciales son increíbles. Mi piel nunca se había visto tan radiante."
                    </p>
                  </div>
                  <div className={`group p-5 rounded-2xl border transition-all duration-500 hover:-translate-y-1 ${
                    isDark
                      ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]'
                      : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#E8D5A0] flex items-center justify-center text-[#1A0E0A] font-black text-sm">L</div>
                      <div>
                        <p className={`font-black text-sm tracking-tight ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>Laura Pérez</p>
                        <p className={`text-[10px] font-medium ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Estética</p>
                      </div>
                    </div>
                    <div className="flex text-[#D4AF37] text-sm mb-2">{renderStars(5, 'md')}</div>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                      "El masaje corporal fue una experiencia relajante y revitalizante."
                    </p>
                  </div>
                  <div className={`group p-5 rounded-2xl border transition-all duration-500 hover:-translate-y-1 ${
                    isDark
                      ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]'
                      : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#E8D5A0] flex items-center justify-center text-[#1A0E0A] font-black text-sm">C</div>
                      <div>
                        <p className={`font-black text-sm tracking-tight ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>Carmen Sánchez</p>
                        <p className={`text-[10px] font-medium ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Estética</p>
                      </div>
                    </div>
                    <div className="flex text-[#D4AF37] text-sm mb-2">{renderStars(5, 'md')}</div>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                      "Me encanta el servicio de depilación. Rápido, indoloro y resultados perfectos."
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* MODAL DETALLES DEL SERVICIO */}
        {/* ============================================================ */}
        <AnimatePresence>
          {isModalOpen && selectedService && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)}>
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${
                isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
              }`} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setIsModalOpen(false)} className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                  isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#F0E4DA]'
                }`}>
                  <X className={`w-5 h-5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
                </button>
                <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
                  <img src={selectedService.image_url || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop'} alt={selectedService.name} className="w-full h-full object-cover" />
                  <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg backdrop-blur-sm text-xs font-bold ${
                    isDark ? 'bg-black/60 text-white' : 'bg-white/80 text-[#1A0E0A]'
                  }`}>{selectedService.duration} min</div>
                </div>
                <h3 className={`text-2xl font-bold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{selectedService.name}</h3>
                <p className={`text-sm mt-2 leading-relaxed ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>{selectedService.description}</p>
                <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`}>
                  <div className="text-2xl font-bold text-[#D4AF37]">${selectedService.price}</div>
                  <Link href="/agenda" className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] shadow-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 ${
                    isDark 
                      ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                      : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37] hover:text-[#1A0E0A]'
                  }`}>
                    <Calendar className="w-4 h-4" /> Agendar
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================ */}
        {/* MODAL DE RESEÑAS / CALIFICACIÓN */}
        {/* ============================================================ */}
        <AnimatePresence>
          {showReviewModal && selectedService && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setShowReviewModal(false)}>
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
                isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
              }`} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowReviewModal(false)} className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                  isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#F0E4DA]'
                }`}>
                  <X className={`w-5 h-5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
                </button>

                <div className="text-center mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                    isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
                  }`}>
                    <Star className="w-8 h-8 text-[#D4AF37]" />
                  </div>
                  <h3 className={`text-xl font-black tracking-tight ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                    Calificar {selectedService.name}
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
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
                          ? 'fill-[#D4AF37] text-[#D4AF37] drop-shadow-[0_0_12px_rgba(212,175,55,0.3)]'
                          : isDark ? 'text-[#3D281E]' : 'text-[#F0E4DA]'
                      }`} />
                    </motion.button>
                  ))}
                </div>

                <p className={`text-center text-sm font-medium mb-4 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
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
                  className={`w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 resize-none ${
                    isDark
                      ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#A89588]'
                      : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A] placeholder:text-[#A89588]'
                  }`}
                  rows={4}
                  style={comment ? { borderColor: '#D4AF37', borderWidth: '1px' } : {}}
                />

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 hover:scale-105 active:scale-95 border ${
                      isDark
                        ? 'border-[#3D281E] text-[#A89588] hover:bg-[#3D281E] hover:text-[#FFF9F6]'
                        : 'border-[#F0E4DA] text-[#5C4A3E] hover:bg-[#F0E4DA] hover:text-[#1A0E0A]'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitting || rating === 0 || !comment.trim()}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDark 
                        ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                        : 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]'
                    }`}
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
        {/* LIGHTBOX */}
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
              <motion.button 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={closeLightbox}
                className="absolute top-4 right-4 md:top-6 md:right-6 p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 bg-black/40 backdrop-blur-sm"
              >
                <X className="w-6 h-6" />
              </motion.button>

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

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-[10px] tracking-[0.3em] font-mono z-50 bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10"
              >
                {galleryImages.findIndex(i => i.id === selectedImage.id) + 1} / {galleryImages.length}
              </motion.div>

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
                  alt={selectedImage.title || 'Galería de estética'}
                  className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-2xl"
                />

                {(selectedImage.title || selectedImage.source) && (
                  <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-b-2xl`}>
                    {selectedImage.title && (
                      <p className="text-white text-lg font-light">{selectedImage.title}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-0.5 rounded-full ${
                        selectedImage.source === 'admin' ? 'bg-[#D4AF37] text-[#1A0E0A]' : 'bg-[#A89588] text-white'
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

      </div>

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
  )
}