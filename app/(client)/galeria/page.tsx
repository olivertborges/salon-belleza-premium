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
  Eye,
  Upload,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  LayoutList,
  Plus,
  Calendar
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
  source?: 'admin' | 'client'  // 🔥 Nuevo campo para identificar origen
}

export default function GaleriaPage() {
  const { user, tenantId } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const galleryRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const beforeInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'public' | 'personal'>('public')
  const [sensoryFilter, setSensoryFilter] = useState<'all' | 'glossy' | '3d' | 'minimal' | 'abstract'>('all')

  const [publicImages, setPublicImages] = useState<GalleryImage[]>([])
  const [clientImages, setClientImages] = useState<GalleryImage[]>([])
  const [clientId, setClientId] = useState<string | null>(null)
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'masonry' | 'grid'>('masonry')

  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null)

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadBeforeFile, setUploadBeforeFile] = useState<File | null>(null)
  const [uploadBeforePreview, setUploadBeforePreview] = useState<string | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadCategory, setUploadCategory] = useState<'glossy' | '3d' | 'minimal' | 'abstract'>('glossy')
  const [uploadPrice, setUploadPrice] = useState('')
  const [uploadPolish, setUploadPolish] = useState('')
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })

  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
  // 🔥 CARGAR DATOS - CONSULTA AMBAS TABLAS
  // ============================================================
  const loadGalleryData = useCallback(async () => {
    setLoading(true)
    try {
      const activeTenantId = await getTenantId()
      
      if (!activeTenantId) {
        console.warn('⚠️ No se encontró tenantId')
        setLoading(false)
        return
      }

      console.log('🔍 Cargando galería para tenant:', activeTenantId)

      const { data: { session } } = await supabase.auth.getSession()
      const activeUserId = session?.user?.id || user?.id

      let allImages: GalleryImage[] = []

      // ============================================================
      // 1. FOTOS DE ADMIN (tabla gallery)
      // ============================================================
      const { data: adminPhotos, error: adminError } = await supabase
        .from('gallery')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (adminError) {
        console.error('Error cargando fotos de admin:', adminError)
      } else if (adminPhotos) {
        console.log(`📸 Encontradas ${adminPhotos.length} fotos de admin`)
        const mappedAdmin = adminPhotos.map((p: any) => ({
          ...p,
          source: 'admin' as const,
          client_name: p.client_name || 'Fresh Nails',
          uploaded_by_admin: true,
          likes: p.likes ?? 0,
          views: p.views ?? 0,
          sensory_category: p.sensory_category || 'glossy',
          polish_used: p.polish_used || 'Fresh Nails Premium',
          price: p.price ? `$${p.price}` : '$45.00'
        }))
        allImages = [...allImages, ...mappedAdmin]
      }

      // ============================================================
      // 2. FOTOS DE CLIENTES (tabla client_gallery)
      // ============================================================
      const { data: clientPhotos, error: clientError } = await supabase
        .from('client_gallery')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('is_active', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (clientError) {
        console.error('Error cargando fotos de clientes:', clientError)
      } else if (clientPhotos) {
        console.log(`📸 Encontradas ${clientPhotos.length} fotos de clientes`)
        const mappedClient = clientPhotos.map((p: any) => ({
          ...p,
          source: 'client' as const,
          client_name: p.client_name || 'Cliente',
          uploaded_by_admin: false,
          likes: p.likes ?? 0,
          views: p.views ?? 0,
          sensory_category: p.sensory_category || 'glossy',
          polish_used: p.polish_used || 'Fresh Nails Premium',
          price: p.price ? `$${p.price}` : '$45.00',
          image_url: p.after_image_url || p.image_url || p.before_image_url || ''
        }))
        allImages = [...allImages, ...mappedClient]
      }

      // Ordenar por fecha (más reciente primero)
      allImages.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      console.log(`✅ Total: ${allImages.length} fotos cargadas`)
      setPublicImages(allImages)

      // ============================================================
      // 3. FOTOS PERSONALES DEL CLIENTE (si está logueado)
      // ============================================================
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
            console.log(`📸 Encontradas ${personalPhotos.length} fotos personales del cliente`)
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

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeLightbox()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isModalOpen, closeLightbox])

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-neutral-950 flex flex-col items-center justify-center gap-4">
        <Loader className="w-6 h-6 text-[#C9A96E] animate-spin stroke-[1.5]" />
        <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 font-light">Cargando galería...</span>
      </div>
    )
  }

  return (
    <div className="bg-[#FAF8F5] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 min-h-screen transition-colors duration-300">
      {/* HERO */}
      <section className="relative h-[60vh] min-h-[450px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#C9A96E]/15 via-[#FAF8F5] to-[#C9A96E]/5 dark:from-[#C9A96E]/10 dark:via-neutral-950 dark:to-[#C9A96E]/5">
        <svg 
          className="absolute inset-0 w-full h-full opacity-30 dark:opacity-20"
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid meet"
        >
          <path d="M 0 100 Q 150 20 250 120 T 500 80 T 750 150 T 1000 60" stroke="#C9A96E" strokeWidth="1.5" fill="none" opacity="0.6" />
          <path d="M 0 180 Q 200 300 350 200 T 600 280 T 850 180 T 1000 250" stroke="#C9A96E" strokeWidth="1" fill="none" opacity="0.4" />
          <circle cx="500" cy="350" r="4" fill="#C9A96E" opacity="0.15" />
        </svg>

        <div className="relative z-10 text-center max-w-3xl px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A96E]/30 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-sm mb-6">
            <Sparkles className="w-3 h-3 text-[#C9A96E]" />
            <span className="text-[8px] tracking-[0.3em] uppercase text-[#C9A96E] font-medium">Galería Fresh Nails</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light font-serif tracking-wide text-neutral-800 dark:text-white">Galería de Arte</h1>
          <div className="w-12 h-[2px] bg-[#C9A96E] mx-auto my-6" />
          <button 
            onClick={() => galleryRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-8 px-8 py-3 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] tracking-[0.25em] uppercase font-medium hover:bg-[#C9A96E] transition-all flex items-center gap-3 mx-auto shadow-lg"
          >
            Explorar <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* GALERÍA */}
      <div ref={galleryRef} className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-20">
        {/* CONTROLES FLOTANTES */}
        <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-neutral-200/50 dark:border-neutral-800/50 p-4 md:p-5 mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 rounded-full p-1 w-full md:w-auto">
              <button
                onClick={() => setActiveTab('public')}
                className={`flex-1 md:flex-none px-5 py-2 rounded-full text-[10px] tracking-[0.15em] uppercase font-medium transition-all duration-300 ${
                  activeTab === 'public' 
                    ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' 
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600'
                }`}
              >
                Colección
              </button>
              <button
                onClick={() => setActiveTab('personal')}
                className={`flex-1 md:flex-none px-5 py-2 rounded-full text-[10px] tracking-[0.15em] uppercase font-medium transition-all duration-300 ${
                  activeTab === 'personal' 
                    ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' 
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600'
                }`}
              >
                Mis Fotos <span className="ml-1 text-[8px] opacity-60">({clientImages.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 rounded-full p-1">
                <button
                  onClick={() => setViewMode('masonry')}
                  className={`p-1.5 rounded-full transition-all duration-300 ${
                    viewMode === 'masonry' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-neutral-400'
                  }`}
                >
                  <Grid3x3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-full transition-all duration-300 ${
                    viewMode === 'grid' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-neutral-400'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {activeTab === 'public' && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-neutral-200/50 dark:border-neutral-800/50">
              <span className="text-[8px] tracking-[0.2em] uppercase text-neutral-400 dark:text-neutral-500 font-medium mr-2">
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
                  className={`group relative px-4 py-1.5 rounded-full text-[9px] tracking-[0.05em] font-medium transition-all duration-300 ${
                    sensoryFilter === btn.id 
                      ? 'bg-[#C9A96E] text-white shadow-md shadow-[#C9A96E]/20 scale-105' 
                      : 'bg-neutral-100/80 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <span className="mr-1">{btn.icon}</span> {btn.label}
                  {sensoryFilter === btn.id && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CONTENIDO */}
        {activeTab === 'public' ? (
          <>
            {filteredImages.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                  <ImageIcon className="w-6 h-6 text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-400 font-light">No hay imágenes en esta categoría</p>
                <p className="text-xs text-neutral-400 font-light mt-1">Las fotos subidas por el administrador aparecerán aquí automáticamente</p>
              </div>
            ) : (
              <div className={viewMode === 'masonry' ? 'columns-2 md:columns-3 lg:columns-4 gap-4 md:gap-6 space-y-4 md:space-y-6' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'}>
                {filteredImages.map((img, idx) => {
                  const isLiked = likedImages.has(img.id)
                  const isHovered = hoveredImageId === img.id
                  const isAdmin = img.source === 'admin'

                  const heights = ['h-[320px]', 'h-[400px]', 'h-[280px]', 'h-[360px]', 'h-[440px]', 'h-[300px]']
                  const heightClass = heights[idx % heights.length]

                  return (
                    <motion.div
                      key={`${img.source}-${img.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: (idx % 6) * 0.06 }}
                      className={`break-inside-avoid ${viewMode === 'grid' ? heightClass : ''}`}
                      onMouseEnter={() => setHoveredImageId(img.id)}
                      onMouseLeave={() => setHoveredImageId(null)}
                    >
                      <div 
                        onClick={() => openLightbox(img)}
                        className={`relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-500 ${
                          viewMode === 'masonry' ? '' : `h-full ${heightClass}`
                        } ${isHovered ? 'shadow-2xl scale-[1.02] z-10' : 'shadow-sm'}`}
                      >
                        <img 
                          src={img.image_url} 
                          alt={img.title}
                          className={`w-full h-full object-cover transition-all duration-700 ${
                            isHovered ? 'scale-105 brightness-90' : 'scale-100'
                          }`}
                          loading="lazy"
                        />

                        <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-500 ${
                          isHovered ? 'opacity-100' : 'opacity-0'
                        }`}>
                          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                            <h3 className="font-serif text-lg font-light tracking-wide truncate">
                              {img.title}
                            </h3>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-white/60 font-light">
                                {img.client_name || (isAdmin ? 'Fresh Nails' : 'Cliente')}
                              </span>
                              <button 
                                onClick={(e) => handleLike(img.id, e)} 
                                className={`p-1.5 rounded-full transition-all duration-300 ${
                                  isLiked ? 'text-red-500' : 'text-white/60 hover:text-white'
                                }`}
                              >
                                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Badge de origen */}
                        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[7px] text-white/80 tracking-[0.2em] uppercase font-medium ${
                          isAdmin ? 'bg-pink-500/80' : 'bg-amber-500/80'
                        }`}>
                          {isAdmin ? '👑 Fresh Nails' : '👤 Cliente'}
                        </div>

                        {/* Badge categoría */}
                        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full text-[7px] text-white/80 tracking-[0.2em] uppercase font-medium">
                          {img.sensory_category || 'Exclusivo'}
                        </div>

                        {/* Contador de likes */}
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full text-[8px] text-white/60">
                          <Heart className="w-2.5 h-2.5 fill-current" />
                          {img.likes || 0}
                        </div>

                        {/* Precio (solo para fotos de admin) */}
                        {isAdmin && img.price && (
                          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full text-[8px] text-[#C9A96E] font-medium">
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
          <div>
            {clientImages.length === 0 ? (
              <div className="text-center py-20 bg-white/50 dark:bg-neutral-800/30 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-700">
                <div className="w-20 h-20 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Tu historial está vacío</h3>
                <p className="text-xs text-neutral-400 font-light mt-1 max-w-xs mx-auto">
                  Sube tus primeros diseños para mantener un seguimiento de tu evolución
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {clientImages.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => openLightbox(img)}
                    className="relative rounded-2xl overflow-hidden cursor-pointer group aspect-square bg-neutral-100 dark:bg-neutral-800"
                  >
                    <img 
                      src={img.image_url} 
                      alt={img.title}
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h4 className="text-sm font-light truncate">{img.title}</h4>
                        <p className="text-[9px] text-white/50">
                          {new Date(img.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================
          LIGHTBOX
      ============================================================ */}
      <AnimatePresence>
        {isModalOpen && selectedImage && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-hidden animate-fadeIn"
            onClick={closeLightbox}
          >
            <button 
              onClick={closeLightbox}
              className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 bg-black/40 backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>

            {filteredImages.length > 1 && (
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
              {filteredImages.findIndex(i => i.id === selectedImage.id) + 1} / {filteredImages.length}
            </div>

            <div 
              className="relative z-10 w-full max-w-5xl max-h-[90vh] bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col md:flex-row h-full">
                {/* Imagen */}
                <div className="md:w-3/5 bg-neutral-950 flex items-center justify-center p-4 min-h-[300px] md:min-h-[500px]">
                  <img 
                    src={selectedImage.image_url} 
                    alt={selectedImage.title}
                    className="w-full h-full object-contain max-h-[70vh] md:max-h-[75vh] rounded-lg"
                  />
                </div>

                {/* Info */}
                <div className="md:w-2/5 p-6 md:p-8 bg-neutral-900 text-white flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[8px] tracking-[0.2em] uppercase bg-white/10 px-3 py-1 rounded-full">
                        {selectedImage.sensory_category || 'Exclusivo'}
                      </span>
                      {selectedImage.source === 'admin' && (
                        <span className="text-[8px] tracking-[0.2em] uppercase bg-pink-500/30 px-3 py-1 rounded-full text-pink-300">
                          Fresh Nails
                        </span>
                      )}
                    </div>

                    <h2 className="font-serif text-2xl md:text-3xl font-light tracking-wide">
                      {selectedImage.title}
                    </h2>

                    {selectedImage.description && (
                      <p className="text-sm text-neutral-400 font-light leading-relaxed">
                        {selectedImage.description}
                      </p>
                    )}

                    <div className="space-y-2 pt-4 border-t border-white/10 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Artista</span>
                        <span>{selectedImage.client_name || 'Fresh Nails'}</span>
                      </div>
                      {selectedImage.polish_used && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Esmaltado</span>
                          <span className="text-right text-sm">{selectedImage.polish_used}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Visualizaciones</span>
                        <span>{selectedImage.views || 0}</span>
                      </div>
                      {selectedImage.price && (
                        <div className="flex justify-between pt-2 border-t border-white/5">
                          <span className="text-neutral-500">Precio</span>
                          <span className="text-2xl font-serif text-[#C9A96E]">{selectedImage.price}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-6 border-t border-white/10 mt-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleLike(selectedImage.id, e); }}
                      className={`flex-1 py-3 rounded-full text-[10px] tracking-[0.15em] uppercase font-medium transition-all flex items-center justify-center gap-2 ${
                        likedImages.has(selectedImage.id) 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${likedImages.has(selectedImage.id) ? 'fill-current' : ''}`} />
                      {likedImages.has(selectedImage.id) ? 'Inspirado' : 'Inspirar'}
                    </button>
                    
                    <button 
                      className="px-5 py-3 rounded-full bg-[#C9A96E] text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-[#B8955A] transition-all flex items-center gap-2"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Agendar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
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