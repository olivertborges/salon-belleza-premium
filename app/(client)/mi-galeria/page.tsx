// @ts-nocheck
'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, 
  Heart, 
  X, 
  Sparkles, 
  Loader,     
  Image as ImageIcon,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  LayoutList,
  Calendar,
  Sparkle
} from 'lucide-react'

interface GalleryImage {
  id: string
  client_id: string | null
  tenant_id: string
  image_url: string
  title: string
  description: string
  is_active: boolean
  is_public: boolean
  created_at: string
  client_name?: string
  likes?: number
  uploaded_by_admin?: boolean
  sensory_category?: 'glossy' | '3d' | 'minimal' | 'abstract'
  polish_used?: string
  price?: string | number
  views?: number
  source?: 'admin' | 'client'
}

export default function GaleriaPage() {
  const { user, tenantId } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const galleryRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'public' | 'personal'>('public')
  const [sensoryFilter, setSensoryFilter] = useState<'all' | 'glossy' | '3d' | 'minimal' | 'abstract'>('all')

  const [publicImages, setPublicImages] = useState<GalleryImage[]>([])
  const [clientImages, setClientImages] = useState<GalleryImage[]>([])
  const [clientId, setClientId] = useState<string | null>(null)
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'masonry' | 'grid'>('masonry')

  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null)

  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // ============================================================
  // FUNCIÓN PARA OBTENER TENANT_ID
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
  // CARGAR DATOS
  // ============================================================
  const loadGalleryData = useCallback(async () => {
    setLoading(true)
    try {
      const activeTenantId = await getTenantId()

      if (!activeTenantId) {
        setLoading(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const activeUserId = session?.user?.id || user?.id

      let allImages: GalleryImage[] = []

      // Fotos de ADMIN
      const { data: adminPhotos, error: adminError } = await supabase
        .from('gallery')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (!adminError && adminPhotos) {
        const mappedAdmin = adminPhotos.map((p: any) => ({
          ...p,
          source: 'admin' as const,
          client_name: p.client_name || 'Fresh Nails',
          uploaded_by_admin: true,
          likes: p.likes ?? 0,
          views: p.views ?? 0,
          sensory_category: p.sensory_category || 'glossy',
          polish_used: p.polish_used || 'Fresh Nails Premium',
          price: p.price ? `$${p.price}` : null
        }))
        allImages = [...allImages, ...mappedAdmin]
      }

      // Fotos de CLIENTES
      const { data: clientPhotos, error: clientError } = await supabase
        .from('client_gallery')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('is_active', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (!clientError && clientPhotos) {
        const mappedClient = clientPhotos.map((p: any) => ({
          ...p,
          source: 'client' as const,
          client_name: p.client_name || 'Cliente',
          uploaded_by_admin: false,
          likes: p.likes ?? 0,
          views: p.views ?? 0,
          sensory_category: p.sensory_category || 'glossy',
          polish_used: p.polish_used || 'Fresh Nails Premium',
          price: p.price ? `$${p.price}` : null,
          image_url: p.after_image_url || p.image_url || p.before_image_url || ''
        }))
        allImages = [...allImages, ...mappedClient]
      }

      allImages.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setPublicImages(allImages)

      // Fotos personales
      if (activeUserId) {
        const { data: cliente } = await supabase
          .from('clients')
          .select('id')
          .eq('auth_user_id', activeUserId)
          .maybeSingle()

        if (cliente?.id) {
          setClientId(cliente.id)
          const { data: personalPhotos } = await supabase
            .from('client_gallery')
            .select('*')
            .eq('client_id', cliente.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })

          if (personalPhotos) {
            setClientImages(personalPhotos)
          }
        }
      }

    } catch (error) {
      console.error('Error cargando la galería:', error)
    } finally {
      setLoading(false)
    }
  }, [user, getTenantId])

  useEffect(() => {
    loadGalleryData()
  }, [loadGalleryData])

  // ============================================================
  // FILTROS
  // ============================================================
  const filteredImages = useMemo(() => {
    return publicImages.filter(
      img => sensoryFilter === 'all' || img.sensory_category === sensoryFilter
    )
  }, [publicImages, sensoryFilter])

  // ============================================================
  // LIKES
  // ============================================================
  const handleLike = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setLikedImages(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setPublicImages(imgs => imgs.map(img => img.id === id ? { ...img, likes: (img.likes || 1) - 1 } : img))
      } else {
        next.add(id)
        setPublicImages(imgs => imgs.map(img => img.id === id ? { ...img, likes: (img.likes || 0) + 1 } : img))
      }
      return next
    })
  }, [])

  // ============================================================
  // MODAL - LIGHTBOX
  // ============================================================
  const openLightbox = useCallback((img: GalleryImage) => {
    if (isModalOpen) return
    setIsModalOpen(true)
    setSelectedImage(img)
    document.body.style.overflow = 'hidden'
  }, [isModalOpen])

  const closeLightbox = useCallback(() => {
    setIsModalOpen(false)
    document.body.style.overflow = 'unset'
    setTimeout(() => {
      setSelectedImage(null)
    }, 250)
  }, [])

  const navigateLightbox = useCallback((direction: 'next' | 'prev') => {
    if (!selectedImage) return
    const currentIndex = filteredImages.findIndex(i => i.id === selectedImage.id)
    if (currentIndex === -1) return

    let newIndex
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % filteredImages.length
    } else {
      newIndex = (currentIndex - 1 + filteredImages.length) % filteredImages.length
    }
    setSelectedImage(filteredImages[newIndex])
  }, [selectedImage, filteredImages])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeLightbox()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isModalOpen, closeLightbox])

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-500 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
            <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
          </div>
          <p className={`text-[10px] tracking-[0.4em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]/60'}`}>
            Cargando galería de arte...
          </p>
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

      {/* ============================================================ */}
{/* HERO — VIDEO DE FONDO COMPLETO EN LA TARJETA HERO */}
{/* ============================================================ */}
<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
  <div className={`relative overflow-hidden rounded-3xl border shadow-2xl transition-all duration-500 ${
    isDark ? 'border-[#3D281E] shadow-[0_20px_50px_rgba(0,0,0,0.8)]' : 'border-[#F0E4DA] shadow-[0_20px_50px_rgba(240,228,218,0.8)]'
  }`}>

    {/* Video reproduciéndose en todo el fondo */}
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      <video
        src="https://kzovcbefedfmpeucrofh.supabase.co/storage/v1/object/public/gallery/any.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover scale-105"
      />
      {/* Capa de opacidad y degradado para que el texto sea perfectamente legible */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
    </div>

    {/* Contenido flotando encima del video */}
    <div className="relative z-10 px-6 py-20 sm:py-28 md:py-36 max-w-3xl mx-auto text-center space-y-6">
      
      {/* Badge Flotante */}
      <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full backdrop-blur-md bg-white/10 border border-white/20 text-[#D4AF37] shadow-lg">
        <Sparkles className="w-3.5 h-3.5 animate-[spin_4s_linear_infinite]" />
        <span className="text-[9px] tracking-[0.3em] uppercase font-black text-amber-200">
          ✦ Galería & Experiencia Visual ✦
        </span>
      </div>

      {/* Título Principal */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-light text-white tracking-wide leading-tight drop-shadow-md">
        Inspiración{' '}
        <span className="italic block font-serif text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFF5D0] to-[#D4AF37]">
          Visual & Arte
        </span>
      </h1>

      {/* Descripción */}
      <p className="text-sm sm:text-base font-light text-white/80 max-w-xl mx-auto leading-relaxed drop-shadow-sm">
        Explora nuestros acabados exclusivos y las tendencias más finas en un solo lugar.
      </p>

      {/* Botón de Acción */}
      <div className="pt-4 flex items-center justify-center">
        <button 
          onClick={() => galleryRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="group inline-flex items-center gap-3 px-8 py-3.5 rounded-full text-[10px] tracking-[0.25em] uppercase font-bold bg-[#D4AF37] text-[#1A0E0A] hover:bg-white hover:text-black transition-all duration-300 shadow-[0_10px_25px_rgba(212,175,55,0.3)] hover:scale-105"
        >
          <span>Explorar Colección</span>
          <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform duration-300" />
        </button>
      </div>

    </div>
  </div>
</div>


      {/* ============================================================ */}
      {/* GALERÍA */}
      {/* ============================================================ */}
      <div ref={galleryRef} className="max-w-7xl mx-auto px-4 md:px-8 mt-12 relative z-20 pb-20">

        {/* CONTROLES FLOTANTES */}
        <div className={`rounded-2xl border shadow-lg p-5 md:p-6 mb-10 transition-all duration-300 ${
          isDark 
            ? 'bg-[#2A1B14]/90 border-[#3D281E] shadow-[0_10px_30px_rgba(0,0,0,0.3)]' 
            : 'bg-white border-[#F0E4DA] shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
        }`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Tabs */}
            <div className={`flex gap-1 rounded-full p-1 w-full md:w-auto ${
              isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'
            }`}>
              <button
                onClick={() => setActiveTab('public')}
                className={`flex-1 md:flex-none px-5 py-2.5 rounded-full text-[9px] tracking-[0.2em] uppercase font-black transition-all duration-500 ${
                  activeTab === 'public' 
                    ? isDark 
                      ? 'bg-[#D4AF37] text-[#1A0E0A] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' 
                      : 'bg-[#1A0E0A] text-[#FFF9F6] shadow-[0_4px_15px_rgba(26,14,10,0.2)]' 
                    : isDark ? 'text-[#A89588] hover:text-[#FFF9F6]' : 'text-[#5C4A3E] hover:text-[#1A0E0A]'
                }`}
              >
                Colección
              </button>
              <button
                onClick={() => setActiveTab('personal')}
                className={`flex-1 md:flex-none px-5 py-2.5 rounded-full text-[9px] tracking-[0.2em] uppercase font-black transition-all duration-500 ${
                  activeTab === 'personal' 
                    ? isDark 
                      ? 'bg-[#D4AF37] text-[#1A0E0A] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' 
                      : 'bg-[#1A0E0A] text-[#FFF9F6] shadow-[0_4px_15px_rgba(26,14,10,0.2)]' 
                    : isDark ? 'text-[#A89588] hover:text-[#FFF9F6]' : 'text-[#5C4A3E] hover:text-[#1A0E0A]'
                }`}
              >
                Mis Fotos <span className="ml-1 text-[7px] opacity-50">({clientImages.length})</span>
              </button>
            </div>

            {/* Controles de vista */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className={`flex gap-1 rounded-full p-1 ${
                isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'
              }`}>
                <button
                  onClick={() => setViewMode('masonry')}
                  className={`p-2 rounded-full transition-all duration-300 ${
                    viewMode === 'masonry' 
                      ? isDark 
                        ? 'bg-[#D4AF37] text-[#1A0E0A] shadow-[0_2px_10px_rgba(212,175,55,0.2)]' 
                        : 'bg-[#1A0E0A] text-[#FFF9F6] shadow-[0_2px_10px_rgba(26,14,10,0.15)]' 
                      : isDark ? 'text-[#A89588] hover:text-[#FFF9F6]' : 'text-[#A89588] hover:text-[#1A0E0A]'
                  }`}
                >
                  <Grid3x3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? isDark 
                        ? 'bg-[#D4AF37] text-[#1A0E0A] shadow-[0_2px_10px_rgba(212,175,55,0.2)]' 
                        : 'bg-[#1A0E0A] text-[#FFF9F6] shadow-[0_2px_10px_rgba(26,14,10,0.15)]' 
                      : isDark ? 'text-[#A89588] hover:text-[#FFF9F6]' : 'text-[#A89588] hover:text-[#1A0E0A]'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Filtros de categoría */}
          {activeTab === 'public' && (
            <div className={`flex flex-wrap items-center gap-2 mt-4 pt-4 border-t ${
              isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
            }`}>
              <span className={`text-[7px] tracking-[0.3em] uppercase font-black mr-2 ${
                isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
              }`}>
                Filtrar:
              </span>
              {[
                { id: 'all', label: 'Todo', icon: '✦' },
                { id: 'glossy', label: 'Glossy', icon: '✨' },
                { id: '3d', label: '3D', icon: '💎' },
                { id: 'minimal', label: 'Minimal', icon: '🌿' },
                { id: 'abstract', label: 'Abstracto', icon: '🎨' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setSensoryFilter(btn.id as any)}
                  className={`group relative px-4 py-1.5 rounded-full text-[8px] tracking-[0.15em] font-black uppercase transition-all duration-500 ${
                    sensoryFilter === btn.id 
                      ? isDark 
                        ? 'bg-[#D4AF37] text-[#1A0E0A] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' 
                        : 'bg-[#1A0E0A] text-[#FFF9F6] shadow-[0_4px_15px_rgba(26,14,10,0.15)]'
                      : isDark 
                        ? 'bg-[#2A1B14]/50 text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E]' 
                        : 'bg-[#FFF9F6]/80 text-[#5C4A3E] hover:text-[#1A0E0A] hover:bg-[#F0E4DA]'
                  }`}
                >
                  <span className="mr-1">{btn.icon}</span> {btn.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* CONTENIDO — GALERÍA PÚBLICA */}
        {/* ============================================================ */}
        {activeTab === 'public' ? (
          <>
            {filteredImages.length === 0 ? (
              <div className={`text-center py-20 rounded-2xl border border-dashed transition-all duration-300 ${
                isDark 
                  ? 'border-[#3D281E] bg-[#2A1B14]/40' 
                  : 'border-[#F0E4DA] bg-white'
              }`}>
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 ${
                  isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
                }`}>
                  <ImageIcon className={`w-9 h-9 ${isDark ? 'text-[#A89588]' : 'text-[#A89588]'}`} />
                </div>
                <p className={`text-sm font-medium ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  No hay imágenes en esta categoría
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                  Las fotos subidas por el administrador aparecerán aquí automáticamente
                </p>
              </div>
            ) : (
              <div className={viewMode === 'masonry' ? 'columns-2 md:columns-3 lg:columns-4 gap-4 md:gap-5 space-y-4 md:space-y-5' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5'}>
                {filteredImages.map((img, idx) => {
                  const isLiked = likedImages.has(img.id)
                  const isHovered = hoveredImageId === img.id
                  const isAdmin = img.source === 'admin'

                  const heights = ['h-[320px]', 'h-[400px]', 'h-[280px]', 'h-[360px]', 'h-[440px]', 'h-[300px]']
                  const heightClass = heights[idx % heights.length]

                  return (
                    <motion.div
                      key={`${img.source}-${img.id}`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: (idx % 6) * 0.06, ease: "easeOut" }}
                      className={`break-inside-avoid ${viewMode === 'grid' ? heightClass : ''}`}
                      onMouseEnter={() => setHoveredImageId(img.id)}
                      onMouseLeave={() => setHoveredImageId(null)}
                    >
                      <div 
                        onClick={() => openLightbox(img)}
                        className={`relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-500 ${
                          viewMode === 'masonry' ? '' : `h-full ${heightClass}`
                        } ${
                          isHovered 
                            ? isDark 
                              ? 'shadow-[0_15px_40px_rgba(212,175,55,0.15)] scale-[1.02]' 
                              : 'shadow-[0_15px_40px_rgba(212,175,55,0.2)] scale-[1.02]' 
                            : isDark ? 'shadow-[0_10px_30px_rgba(0,0,0,0.2)]' : 'shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
                        }`}
                      >
                        <img 
                          src={img.image_url} 
                          alt={img.title}
                          className={`w-full h-full object-cover transition-all duration-700 ${
                            isHovered ? 'scale-105 brightness-90' : 'scale-100'
                          }`}
                          loading="lazy"
                        />

                        {/* Overlay en hover */}
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-all duration-500 ${
                          isHovered ? 'opacity-100' : 'opacity-0'
                        }`}>
                          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                            <h3 className="font-serif text-lg font-light tracking-wide truncate">
                              {img.title}
                            </h3>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[9px] text-white/50 font-light">
                                {img.client_name || (isAdmin ? 'Fresh Nails' : 'Cliente')}
                              </span>
                              <button 
                                onClick={(e) => handleLike(img.id, e)} 
                                className={`p-1.5 rounded-full transition-all duration-300 ${
                                  isLiked ? 'text-rose-400' : 'text-white/60 hover:text-white'
                                }`}
                              >
                                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Badge de origen */}
                        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[6px] text-white/90 tracking-[0.25em] uppercase font-black backdrop-blur-md ${
                          isAdmin ? 'bg-[#D4AF37]/80' : 'bg-[#A89588]/80'
                        }`}>
                          {isAdmin ? '👑 Studio' : '📸 Cliente'}
                        </div>

                        {/* Badge categoría */}
                        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full text-[6px] text-white/80 tracking-[0.2em] uppercase font-medium">
                          {img.sensory_category || 'Exclusivo'}
                        </div>

                        {/* Contador de likes */}
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full text-[8px] text-white/70">
                          <Heart className="w-2.5 h-2.5 fill-current" />
                          {img.likes || 0}
                        </div>

                        {/* Precio */}
                        {isAdmin && img.price && (
                          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full text-[8px] text-[#D4AF37] font-black">
                            {img.price}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          /* ============================================================ */
          /* CONTENIDO — GALERÍA PERSONAL */
          /* ============================================================ */
          <div>
            {clientImages.length === 0 ? (
              <div className={`text-center py-20 rounded-2xl border border-dashed transition-all duration-300 ${
                isDark 
                  ? 'border-[#3D281E] bg-[#2A1B14]/40' 
                  : 'border-[#F0E4DA] bg-white'
              }`}>
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 ${
                  isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
                }`}>
                  <Camera className={`w-9 h-9 ${isDark ? 'text-[#A89588]' : 'text-[#A89588]'}`} />
                </div>
                <p className={`text-sm font-medium ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  Tu historial está vacío
                </p>
                <p className={`text-xs mt-1 max-w-xs mx-auto ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                  Sube tus primeros diseños para mantener un seguimiento de tu evolución
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                {clientImages.map((img, idx) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                    onClick={() => openLightbox(img)}
                    className={`relative rounded-2xl overflow-hidden cursor-pointer group aspect-square transition-all duration-500 hover:-translate-y-1 ${
                      isDark 
                        ? 'bg-[#2A1B14] hover:shadow-[0_10px_30px_rgba(212,175,55,0.1)]' 
                        : 'bg-[#FFF9F6] hover:shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
                    }`}
                  >
                    <img 
                      src={img.image_url} 
                      alt={img.title}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h4 className="text-sm font-light truncate">{img.title}</h4>
                        <p className="text-[8px] text-white/50 mt-0.5">
                          {new Date(img.created_at).toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 text-[6px] font-black uppercase tracking-[0.25em] px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white/70">
                      #{String(idx + 1).padStart(2, '0')}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* LIGHTBOX */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isModalOpen && selectedImage && (
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

            {filteredImages.length > 1 && (
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
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative z-10 w-full max-w-6xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`flex flex-col md:flex-row h-full rounded-2xl overflow-hidden shadow-2xl ${
                isDark 
                  ? 'bg-[#2A1B14] border border-[#3D281E]' 
                  : 'bg-white border border-[#F0E4DA]'
              }`}>
                <div className="md:w-3/5 bg-[#1E120C] flex items-center justify-center p-4 md:p-6 min-h-[300px] md:min-h-[500px]">
                  <img 
                    src={selectedImage.image_url} 
                    alt={selectedImage.title}
                    className="w-full h-full object-contain max-h-[70vh] md:max-h-[75vh] rounded-lg"
                  />
                </div>

                <div className={`md:w-2/5 p-6 md:p-8 flex flex-col justify-between overflow-y-auto ${
                  isDark ? 'bg-[#2A1B14] text-[#FFF9F6]' : 'bg-white text-[#1A0E0A]'
                }`}>
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[7px] tracking-[0.2em] uppercase font-black px-3 py-1 rounded-full ${
                        isDark ? 'bg-[#3D281E] text-[#A89588]' : 'bg-[#FFF9F6] text-[#5C4A3E]'
                      }`}>
                        {selectedImage.sensory_category || 'Exclusivo'}
                      </span>
                    </div>

                    <h2 className={`font-serif text-2xl md:text-3xl font-light tracking-wide ${
                      isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                    }`}>
                      {selectedImage.title}
                    </h2>

                    {selectedImage.description && (
                      <p className={`text-sm font-light leading-relaxed ${
                        isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                      }`}>
                        {selectedImage.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
