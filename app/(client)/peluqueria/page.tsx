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
  Scissors, 
  Clock, 
  Sparkles, 
  Search, 
  Filter, 
  Grid3x3, 
  LayoutList, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Camera, 
  Star, 
  StarHalf, 
  X, 
  Send, 
  Loader2,
  Palette,
  Droplets,
  Wind,
  Quote,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Gem,
  Crown,
  ArrowRight,
  Heart,
  Flower2,
  Compass,
  Zap,
  Shield,
  User
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

const HAIR_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200&h=600&fit=crop',
  corte1: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=400&fit=crop',
  corte2: 'https://images.unsplash.com/photo-1560869713-7d0a2943087e?w=600&h=400&fit=crop',
  color: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&h=400&fit=crop',
  tratamiento: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop',
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

// ============================================================
// COMPONENTE DE CARGA
// ============================================================
const PeluqueriaLoadingSpinner = ({ isDark }: { isDark: boolean }) => (
  <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-500 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-16 h-16">
        <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
        <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
      </div>
      <p className={`text-[10px] tracking-[0.4em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]/60'}`}>
        Cargando arte capilar...
      </p>
    </div>
  </div>
)

export default function PeluqueriaPage() {
  const { user, tenantId } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'

  const [servicios, setServicios] = useState<Servicio[]>([])
  const [filteredServicios, setFilteredServicios] = useState<Servicio[]>([])
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [reviews, setReviews] = useState<Record<string, Review[]>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
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

  // Lightbox
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const categories = [
    { id: 'all', label: 'Todos', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'Corte', label: 'Cortes', icon: <Scissors className="w-3.5 h-3.5" /> },
    { id: 'Color', label: 'Coloración', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'Tratamientos', label: 'Tratamientos', icon: <Droplets className="w-3.5 h-3.5" /> },
    { id: 'Peinados', label: 'Peinados', icon: <Wind className="w-3.5 h-3.5" /> },
  ]

  const getTenantId = useCallback(async (): Promise<string | null> => {
    if (tenantId) return tenantId
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null
    if (session.user.user_metadata?.tenant_id) return session.user.user_metadata.tenant_id
    if (session.user.app_metadata?.tenant_id) return session.user.app_metadata.tenant_id
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', session.user.id).maybeSingle()
    if (profile?.tenant_id) return profile.tenant_id
    const { data: client } = await supabase.from('clients').select('tenant_id').eq('auth_user_id', session.user.id).maybeSingle()
    if (client?.tenant_id) return client.tenant_id
    return null
  }, [tenantId])

  const loadServicios = async () => {
    const activeTenantId = await getTenantId()
    if (!activeTenantId) { setLoading(false); return }
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('is_active', true)
        .in('category', ['Corte', 'Color', 'Tratamientos', 'Peinados', 'peluqueria', 'Peluquería'])
        .order('name', { ascending: true })
      if (error) throw error
      setServicios(data || [])
      setFilteredServicios(data || [])
    } catch (error) {
      console.error('Error cargando servicios:', error)
    }
  }

  const loadGallery = async () => {
    const activeTenantId = await getTenantId()
    if (!activeTenantId) return
    try {
      let allImages: GalleryImage[] = []
      const { data: adminPhotos, error: adminError } = await supabase
        .from('gallery')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('is_active', true)
        .ilike('category', 'Peluquería')
        .order('created_at', { ascending: false })
      if (!adminError && adminPhotos) {
        const mappedAdmin = adminPhotos.map((p: any) => ({
          ...p,
          source: 'admin' as const,
          category: p.category || 'Peluquería'
        }))
        allImages = [...allImages, ...mappedAdmin]
      }
      const { data: clientPhotos, error: clientError } = await supabase
        .from('client_gallery')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('is_active', true)
        .eq('is_public', true)
        .ilike('category', 'Peluquería')
        .order('created_at', { ascending: false })
      if (!clientError && clientPhotos) {
        const mappedClient = clientPhotos.map((p: any) => ({
          id: p.id,
          tenant_id: p.tenant_id,
          image_url: p.after_image_url || p.image_url || p.before_image_url || '',
          title: p.title || 'Trabajo de cliente',
          category: p.category || 'Peluquería',
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([loadServicios(), loadGallery(), loadReviews()])
      setLoading(false)
    }
    loadData()
  }, [tenantId])

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
        {[...Array(fullStars)].map((_, i) => <Star key={`f-${i}`} className={`${sizeClass} fill-[#D4AF37] text-[#D4AF37]`} />)}
        {hasHalfStar && <StarHalf className={`${sizeClass} fill-[#D4AF37] text-[#D4AF37]`} />}
        {[...Array(emptyStars)].map((_, i) => <Star key={`e-${i}`} className={`${sizeClass} ${isDark ? 'text-[#3D281E]' : 'text-[#F0E4DA]'}`} />)}
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

  const openLightbox = (image: GalleryImage) => {
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
    return <PeluqueriaLoadingSpinner isDark={isDark} />
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-16 relative overflow-x-hidden ${
      isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'
    }`}>
      {/* Fondo texturizado */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-7xl mx-auto px-4 space-y-8 relative z-10">

        {errorMessage && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[999] px-6 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium backdrop-blur-xl shadow-2xl">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[999] px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium backdrop-blur-xl shadow-2xl">
            {successMessage}
          </div>
        )}

        {/* ============================================================ */}
{/* HERO SECTION — CON SYLVANA COMO IMAGEN PRINCIPAL */}
{/* ============================================================ */}
<div className={`relative overflow-hidden rounded-2xl min-h-[440px] flex items-center shadow-lg mt-4 border transition-all duration-300 ${
  isDark 
    ? 'border-[#3D281E] shadow-[0_15px_35px_rgba(0,0,0,0.3)]' 
    : 'border-[#F0E4DA] shadow-[0_15px_35px_rgba(240,228,218,0.6)]'
}`}>
  {/* Fondo con FOTO DE SYLVANA como imagen principal */}
  <div className="absolute inset-0">
    <img 
      src="https://kzovcbefedfmpeucrofh.supabase.co/storage/v1/object/public/profesionals/sil.png"
      alt="Sylvana - Peluquería y Depilación"
      className="w-full h-full object-cover object-top"
    />
    {/* Overlay oscuro para legibilidad del texto */}
    <div className={`absolute inset-0 ${
      isDark 
        ? 'bg-gradient-to-r from-[#1E120C]/90 via-[#1E120C]/60 to-[#1E120C]/30' 
        : 'bg-gradient-to-r from-[#1A0E0A]/85 via-[#1A0E0A]/50 to-transparent'
    }`} />
    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
  </div>

  {/* Efectos de luz ambiental */}
  <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none" />
  <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

  <div className="relative z-10 p-8 md:p-14 max-w-4xl w-full">
    <div className="text-white">
      <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full backdrop-blur-xl border mb-6 ${
        isDark 
          ? 'bg-[#D4AF37]/10 border-[#D4AF37]/20' 
          : 'bg-white/10 border-white/20'
      }`}>
        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] animate-[spin_4s_linear_infinite]" />
        <span className={`text-[8px] uppercase tracking-[0.25em] font-black ${
          isDark ? 'text-[#D4AF37]' : 'text-white/90'
        }`}>
          {settings?.business_name || 'Fresh Nails Studio'} • <span className="font-bold">Peluquería & Depilación</span>
        </span>
      </div>

      <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
        <span className="font-serif italic font-light text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#E8D5A0] to-white bg-[length:200%_auto] animate-[gradient_4s_ease-in-out_infinite]">
          Arte
        </span>{' '}
        Capilar
      </h1>
      <p className="text-sm md:text-base text-white/80 mt-4 max-w-lg font-medium tracking-wide">
        Transformamos tu estilo con cortes, tratamientos y depilación de vanguardia, diseñados para realzar tu esencia.
      </p>

      <div className="flex flex-wrap gap-3 mt-8">
        <Link 
          href="/agenda" 
          className={`group relative overflow-hidden px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-3 transition-all duration-500 hover:-translate-y-0.5 active:scale-[0.97] ${
            isDark 
              ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
              : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37] hover:text-[#1A0E0A]'
          }`}
        >
          <Calendar className="w-4 h-4 group-hover:rotate-12 transition-transform duration-500" />
          <span>Reservar con Sylvana</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
        </Link>

        <button 
          onClick={() => setActiveTab('galeria')} 
          className={`px-6 py-3.5 rounded-xl border text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2.5 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97] backdrop-blur-sm ${
            isDark 
              ? 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20' 
              : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
          }`}
        >
          <Camera className="w-4 h-4" /> 
          <span>Galería</span>
        </button>
      </div>

      {/* Micro estadísticas */}
      <div className="flex gap-6 mt-8 pt-6 border-t border-white/10">
        <div>
          <p className="text-2xl font-black text-[#D4AF37]">{servicios.length}</p>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50">Servicios</p>
        </div>
        <div className="w-px bg-white/10" />
        <div>
          <p className="text-2xl font-black text-[#D4AF37]">{galleryImages.length}</p>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50">Trabajos</p>
        </div>
        <div className="w-px bg-white/10" />
        <div>
          <p className="text-2xl font-black text-[#D4AF37]">{Object.values(reviews).flat().length}</p>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50">Reseñas</p>
        </div>
      </div>
    </div>
  </div>
</div>

        {/* ============================================================ */}
{/* TABS — RESPONSIVE */}
{/* ============================================================ */}
<div className={`flex justify-center border-b pb-0 overflow-x-auto ${
  isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
}`}>
  {(['servicios', 'galeria', 'testimonios'] as const).map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`relative px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] font-black whitespace-nowrap transition-all duration-500 ${
        activeTab === tab 
          ? 'text-[#D4AF37]' 
          : isDark ? 'text-[#A89588] hover:text-[#FFF9F6]' : 'text-[#5C4A3E] hover:text-[#1A0E0A]'
      }`}
    >
      <span className="relative z-10">
        {tab === 'servicios' ? 'Rituales' : tab === 'galeria' ? 'Inspiración' : 'Testimonios'}
      </span>
      {activeTab === tab && (
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
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`relative px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-500 flex items-center gap-1.5 border ${
                    selectedCategory === cat.id 
                      ? isDark 
                        ? 'bg-[#D4AF37] text-[#1A0E0A] border-[#D4AF37] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' 
                        : 'bg-[#1A0E0A] text-[#FFF9F6] border-[#1A0E0A] shadow-[0_4px_15px_rgba(26,14,10,0.2)]'
                      : isDark 
                        ? 'bg-[#2A1B14] border-[#3D281E] text-[#A89588] hover:border-[#D4AF37]/40 hover:text-[#FFF9F6]' 
                        : 'bg-white border-[#F0E4DA] text-[#5C4A3E] hover:border-[#D4AF37]/40 hover:text-[#1A0E0A]'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            <div className={`flex gap-3 p-4 rounded-2xl border transition-all duration-300 ${
              isDark 
                ? 'bg-[#2A1B14]/60 border-[#3D281E]' 
                : 'bg-white border-[#F0E4DA] shadow-[0_4px_15px_rgba(240,228,218,0.3)]'
            }`}>
              <div className="flex-1 flex items-center gap-3">
                <Search className={`w-4 h-4 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
                <input 
                  type="text" 
                  placeholder="Buscar servicios..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`bg-transparent outline-none text-xs w-full font-medium ${
                    isDark ? 'text-[#FFF9F6] placeholder:text-[#A89588]' : 'text-[#1A0E0A] placeholder:text-[#A89588]'
                  }`}
                />
              </div>
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

            <motion.div variants={containerVariants} initial="hidden" animate="visible" className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-3"}>
              {filteredServicios.map((servicio) => {
                const avgRating = getAverageRating(servicio.id)
                return (
                  <motion.div 
                    key={servicio.id} 
                    variants={itemVariants} 
                    className={`group relative rounded-2xl border p-5 transition-all duration-500 flex flex-col justify-between overflow-hidden hover:-translate-y-1 ${
                      isDark 
                        ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
                        : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
                    }`}
                  >
                    <div className="cursor-pointer space-y-3 relative z-10" onClick={() => openModal(servicio)}>
                      <div className="relative overflow-hidden rounded-xl aspect-video">
                        <img 
                          src={servicio.image_url || HAIR_IMAGES.corte1} 
                          alt={servicio.name} 
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className={`absolute bottom-2 right-2 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.1em] backdrop-blur-md ${
                          isDark ? 'bg-black/60 text-white/80' : 'bg-white/80 text-[#1A0E0A]'
                        }`}>
                          <Clock className="w-2.5 h-2.5 inline mr-1" /> {servicio.duration} min
                        </div>
                      </div>

                      <div className="flex justify-between items-start gap-2">
                        <h3 className={`font-black text-sm tracking-tight transition-colors ${
                          isDark ? 'text-[#FFF9F6] group-hover:text-[#D4AF37]' : 'text-[#1A0E0A] group-hover:text-[#D4AF37]'
                        }`}>
                          {servicio.name}
                        </h3>
                        <span className={`text-sm font-black font-mono text-[#D4AF37]`}>
                          ${servicio.price}
                        </span>
                      </div>

                      <p className={`text-xs line-clamp-2 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                        {servicio.description}
                      </p>

                      {avgRating > 0 && (
                        <div className="flex items-center gap-2">
                          {renderStars(avgRating, 'sm')}
                          <span className={`text-[10px] font-medium ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                            ({reviews[servicio.id]?.length || 0})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={`flex items-center justify-between mt-4 pt-4 border-t relative z-10 ${
                      isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
                    }`}>
                      <div className={`flex items-center gap-1 text-[10px] font-medium ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                        <Scissors className="w-3 h-3 text-[#D4AF37]" />
                        {servicio.category || 'Peluquería'}
                      </div>
                      <button 
                        onClick={() => { setSelectedService(servicio); setShowReviewModal(true) }} 
                        className={`text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 transition-all duration-300 hover:scale-105 text-[#D4AF37] hover:text-[#E8D5A0]`}
                      >
                        <Star className="w-3 h-3 fill-[#D4AF37]" /> Reseñar
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB: GALERÍA */}
        {/* ============================================================ */}
        {activeTab === 'galeria' && (
          <div>
            {galleryImages.length === 0 ? (
              <div className={`text-center py-20 rounded-2xl border border-dashed transition-all duration-300 ${
                isDark 
                  ? 'bg-[#2A1B14]/40 border-[#3D281E]' 
                  : 'bg-white border-[#F0E4DA]'
              }`}>
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 ${
                  isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
                }`}>
                  <ImageIcon className={`w-9 h-9 ${isDark ? 'text-[#A89588]' : 'text-[#A89588]'}`} />
                </div>
                <p className={`text-sm font-medium ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  No hay fotos de peluquería aún
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                  Las fotos subidas desde el panel de administración aparecerán aquí
                </p>
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
                    className={`relative rounded-2xl overflow-hidden cursor-pointer group aspect-square transition-all duration-500 hover:-translate-y-1 ${
                      isDark 
                        ? 'bg-[#2A1B14] hover:shadow-[0_10px_30px_rgba(212,175,55,0.1)]' 
                        : 'bg-[#FFF9F6] hover:shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
                    }`}
                  >
                    <img 
                      src={img.image_url} 
                      alt={img.title || 'Trabajo de peluquería'}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                      loading="lazy"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="text-sm font-light truncate">{img.title || 'Trabajo de peluquería'}</h3>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ${
                            img.source === 'admin' ? 'bg-[#D4AF37] text-[#1A0E0A]' : 'bg-[#A89588] text-white'
                          }`}>
                            {img.source === 'admin' ? 'Fresh Nails' : 'Cliente'}
                          </span>
                          <ZoomIn className="w-4 h-4 text-white/60 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>

                    <div className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[6px] text-white/90 tracking-[0.15em] uppercase font-black backdrop-blur-md ${
                      img.source === 'admin' ? 'bg-[#D4AF37]/80' : 'bg-[#A89588]/80'
                    }`}>
                      {img.source === 'admin' ? '👑 Studio' : '📸 Cliente'}
                    </div>

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
        {/* TAB: TESTIMONIOS */}
        {/* ============================================================ */}
        {activeTab === 'testimonios' && (
          <div>
            {Object.values(reviews).flat().length === 0 ? (
              <div className={`text-center py-20 rounded-2xl border border-dashed transition-all duration-300 ${
                isDark 
                  ? 'bg-[#2A1B14]/40 border-[#3D281E]' 
                  : 'bg-white border-[#F0E4DA]'
              }`}>
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 ${
                  isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
                }`}>
                  <Quote className={`w-9 h-9 ${isDark ? 'text-[#A89588]' : 'text-[#A89588]'}`} />
                </div>
                <p className={`text-sm font-medium ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  Aún no hay testimonios registrados
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
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
                        ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
                        : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className={`font-black text-sm tracking-tight ${
                          isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                        }`}>
                          {rev.client_name}
                        </h4>
                        <span className={`text-[10px] font-medium ${
                          isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
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

                    <div className={`relative pl-4 border-l-2 border-[#D4AF37]`}>
                      <Quote className={`absolute -left-2 -top-1 w-4 h-4 ${
                        isDark ? 'text-[#D4AF37]/30' : 'text-[#D4AF37]/30'
                      }`} />
                      <p className={`text-sm leading-relaxed pl-4 ${
                        isDark ? 'text-[#FFF9F6]/80' : 'text-[#1A0E0A]/80'
                      }`}>
                        {rev.comment}
                      </p>
                    </div>

                    <div className={`mt-3 pt-3 border-t text-[9px] font-medium ${
                      isDark ? 'border-[#3D281E] text-[#A89588]' : 'border-[#F0E4DA] text-[#5C4A3E]'
                    }`}>
                      <span className="inline-flex items-center gap-1.5">
                        <Scissors className="w-3 h-3 text-[#D4AF37]" />
                        Servicio: <span className={`font-bold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
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
        {/* LIGHTBOX — CON COLORES CONSISTENTES */}
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
                  alt={selectedImage.title || 'Galería de peluquería'}
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

        {/* ============================================================ */}
        {/* MODAL DE DETALLE DE SERVICIO — CON COLORES CONSISTENTES */}
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
                className={`relative p-8 rounded-2xl max-w-md w-full space-y-5 shadow-2xl border ${
                  isDark 
                    ? 'bg-[#2A1B14] border-[#3D281E]' 
                    : 'bg-white border-[#F0E4DA]'
                }`}
                onClick={e => e.stopPropagation()}
              >
                <button 
                  onClick={closeModal}
                  className={`absolute top-4 right-4 p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                    isDark ? 'text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E]' : 'text-[#A89588] hover:text-[#1A0E0A] hover:bg-[#F0E4DA]'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="aspect-video rounded-xl overflow-hidden">
                  <img 
                    src={selectedService.image_url || HAIR_IMAGES.corte1} 
                    alt={selectedService.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] text-[#D4AF37]`}>
                      {selectedService.category || 'Servicio'}
                    </span>
                    <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-[#3D281E]' : 'bg-[#F0E4DA]'}`} />
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                      <Clock className="w-2.5 h-2.5 inline" /> {selectedService.duration} min
                    </span>
                  </div>
                  <h3 className={`text-xl font-black tracking-tight mt-1 ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                    {selectedService.name}
                  </h3>
                  <p className={`text-xs leading-relaxed mt-2 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                    {selectedService.description || 'Experiencia capilar premium diseñada para realzar tu estilo.'}
                  </p>
                </div>

                <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`}>
                  <div>
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Inversión</span>
                    <p className="text-2xl font-black font-mono text-[#D4AF37]">
                      ${selectedService.price}
                    </p>
                  </div>
                  <Link 
                    href="/agenda" 
                    className={`px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] shadow-lg flex items-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 ${
                      isDark 
                        ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                        : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37] hover:text-[#1A0E0A]'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Agendar Cupo</span>
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* MODAL DE RESEÑA — CON COLORES CONSISTENTES */}
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
                className={`relative p-8 rounded-2xl max-w-sm w-full space-y-5 shadow-2xl border ${
                  isDark 
                    ? 'bg-[#2A1B14] border-[#3D281E]' 
                    : 'bg-white border-[#F0E4DA]'
                }`}
                onClick={e => e.stopPropagation()}
              >
                <button 
                  onClick={() => setShowReviewModal(false)}
                  className={`absolute top-4 right-4 p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                    isDark ? 'text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E]' : 'text-[#A89588] hover:text-[#1A0E0A] hover:bg-[#F0E4DA]'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                    isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
                  }`}>
                    <Star className="w-8 h-8 text-[#D4AF37]" />
                  </div>
                  <h3 className={`text-xl font-black tracking-tight ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                    Calificar servicio
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                    {selectedService.name}
                  </p>
                </div>

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
                          ? 'fill-[#D4AF37] text-[#D4AF37] drop-shadow-[0_0_12px_rgba(212,175,55,0.3)]' 
                          : isDark ? 'text-[#3D281E]' : 'text-[#F0E4DA]'
                      }`} />
                    </motion.button>
                  ))}
                </div>

                <textarea 
                  value={comment} 
                  onChange={e => setComment(e.target.value)} 
                  placeholder="Cuéntanos tu experiencia con este servicio..." 
                  className={`w-full p-4 rounded-xl text-sm font-medium transition-all duration-300 resize-none focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                    isDark 
                      ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#A89588]' 
                      : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A] placeholder:text-[#A89588]'
                  }`}
                  rows={4}
                  style={comment ? { borderColor: '#D4AF37', borderWidth: '1px' } : {}}
                />

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowReviewModal(false)} 
                    className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 hover:scale-105 active:scale-95 border ${
                      isDark 
                        ? 'border-[#3D281E] text-[#A89588] hover:bg-[#3D281E] hover:text-[#FFF9F6]' 
                        : 'border-[#F0E4DA] text-[#5C4A3E] hover:bg-[#F0E4DA] hover:text-[#1A0E0A]'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSubmitReview} 
                    disabled={submitting || !rating || !comment.trim()} 
                    className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDark 
                        ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                        : 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]'
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