'use client'

import { useState, useEffect, useRef } from 'react'
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
}

export default function GaleriaPage() {
  const { user, tenantId } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const galleryRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  const [likedAnimating, setLikedAnimating] = useState<string | null>(null)

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadCategory, setUploadCategory] = useState<'glossy' | '3d' | 'minimal' | 'abstract'>('glossy')
  const [uploadPrice, setUploadPrice] = useState('')
  const [uploadPolish, setUploadPolish] = useState('')
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })

  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    loadGalleryData()
  }, [user])

  const loadGalleryData = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const activeUserId = session?.user?.id || user?.id

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

          if (personalPhotos) setClientImages(personalPhotos)
        }
      }

      const { data: publicPhotos, error: publicError } = await supabase
        .from('client_gallery')
        .select('*')
        .eq('is_active', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(40)

      if (publicError) throw publicError

      if (publicPhotos) {
        const mappedPublic = publicPhotos.map((photo: any) => ({
          ...photo,
          client_name: photo.client_name || (photo.client_id ? 'Cliente' : 'Fresh Nails'),
          uploaded_by_admin: !photo.client_id,
          likes: photo.likes ?? 0,
          views: photo.views ?? 0,
          sensory_category: photo.sensory_category || 'glossy',
          polish_used: photo.polish_used || 'Fresh Nails Premium',
          price: photo.price ? `$${photo.price}` : '$45.00'
        }))

        setPublicImages(mappedPublic)
      }
    } catch (error) {
      console.error('Error cargando la galería:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredImages = publicImages.filter(
    img => sensoryFilter === 'all' || img.sensory_category === sensoryFilter
  )

  const handleLike = (id: string) => {
    setLikedAnimating(id)
    setTimeout(() => setLikedAnimating(null), 500)

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
  }

  const handleUpload = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const activeUserId = session?.user?.id || user?.id

    if (!uploadFile || !activeUserId) {
      setUploadStatus({ type: 'error', message: 'Debes seleccionar una imagen y estar autenticado.' })
      return
    }

    setUploading(true)
    setUploadStatus({ type: null, message: '' })

    try {
      let resolvedTenantId = tenantId || session?.user?.user_metadata?.tenant_id || session?.user?.app_metadata?.tenant_id

      if (!resolvedTenantId) {
        const { data: clientRow } = await supabase
          .from('clients')
          .select('tenant_id')
          .eq('auth_user_id', activeUserId)
          .maybeSingle()
        if (clientRow?.tenant_id) resolvedTenantId = clientRow.tenant_id
      }

      if (!resolvedTenantId) throw new Error("Falta el identificador del salón.")

      const isAdmin = session?.user?.user_metadata?.role === 'admin' || session?.user?.app_metadata?.role === 'admin'

      const fileExt = uploadFile.name.split('.').pop()
      const folder = isAdmin ? 'salon' : clientId || 'guests'
      const fileName = `${folder}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, uploadFile)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(fileName)
      let afterImageUrl = urlData.publicUrl

      const newImage = {
        client_id: isAdmin ? null : clientId,
        tenant_id: resolvedTenantId,
        image_url: afterImageUrl,
        title: uploadTitle || (isAdmin ? 'Diseño Exclusivo' : 'Mi Diseño'),
        description: uploadDescription || '',
        price: parseFloat(uploadPrice) || 45.00,
        polish_used: uploadPolish || 'Fresh Nails Premium',
        sensory_category: uploadCategory,
        is_active: true,
        is_public: true,
        created_at: new Date().toISOString()
      }

      const { data: insertData, error: dbError } = await supabase
        .from('client_gallery')
        .insert([newImage])
        .select()

      if (dbError) throw dbError

      if (insertData && insertData[0]) {
        const localCreated: GalleryImage = {
          ...insertData[0],
          client_name: isAdmin ? 'Fresh Nails' : 'Tú',
          uploaded_by_admin: isAdmin,
          likes: 0,
          views: 0,
          sensory_category: uploadCategory,
          polish_used: uploadPolish || 'Fresh Nails Premium',
          price: `$${parseFloat(uploadPrice) || 45.00}`
        }

        setPublicImages(prev => [localCreated, ...prev])
        if (!isAdmin) setClientImages(prev => [insertData[0], ...prev])
      }

      setUploadStatus({ type: 'success', message: '¡Diseño publicado exitosamente!' })
      setTimeout(() => {
        setShowUploadModal(false)
        setUploadTitle('')
        setUploadDescription('')
        setUploadPrice('')
        setUploadPolish('')
        setUploadFile(null)
        setPreviewUrl(null)
        setUploadStatus({ type: null, message: '' })
      }, 1200)

    } catch (e: any) {
      setUploadStatus({ type: 'error', message: e.message || 'Error al guardar.' })
    } finally {
      setUploading(false)
    }
  }

  const openLightbox = (img: GalleryImage) => {
    const index = filteredImages.findIndex(i => i.id === img.id)
    setLightboxIndex(index >= 0 ? index : 0)
    setSelectedImage(img)
  }

  const navigateLightbox = (direction: 'next' | 'prev') => {
    if (!selectedImage) return
    const currentIndex = filteredImages.findIndex(i => i.id === selectedImage.id)
    let newIndex
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % filteredImages.length
    } else {
      newIndex = (currentIndex - 1 + filteredImages.length) % filteredImages.length
    }
    setLightboxIndex(newIndex)
    setSelectedImage(filteredImages[newIndex])
  }

  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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
      {/* ============================================================
          HERO - CON LÍNEAS ABSTRACTAS NO UNIFORMES
      ============================================================ */}
      <section className="relative h-[60vh] min-h-[450px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#C9A96E]/15 via-[#FAF8F5] to-[#C9A96E]/5 dark:from-[#C9A96E]/10 dark:via-neutral-950 dark:to-[#C9A96E]/5">
        
        {/* Líneas abstractas no uniformes - Galería de arte */}
        <svg 
          className="absolute inset-0 w-full h-full opacity-30 dark:opacity-20"
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Líneas curvas orgánicas */}
          <path 
            d="M 0 100 Q 150 20 250 120 T 500 80 T 750 150 T 1000 60" 
            stroke="#C9A96E" 
            strokeWidth="1.5" 
            fill="none" 
            opacity="0.6"
          />
          <path 
            d="M 0 180 Q 200 300 350 200 T 600 280 T 850 180 T 1000 250" 
            stroke="#C9A96E" 
            strokeWidth="1" 
            fill="none" 
            opacity="0.4"
          />
          <path 
            d="M 0 280 Q 180 180 300 300 T 550 240 T 800 320 T 1000 280" 
            stroke="#C9A96E" 
            strokeWidth="0.8" 
            fill="none" 
            opacity="0.3"
          />
          <path 
            d="M 0 380 Q 250 450 400 350 T 700 420 T 900 370 T 1000 400" 
            stroke="#C9A96E" 
            strokeWidth="1.2" 
            fill="none" 
            opacity="0.35"
          />
          <path 
            d="M 0 450 Q 180 500 300 440 T 600 500 T 850 460 T 1000 500" 
            stroke="#C9A96E" 
            strokeWidth="0.6" 
            fill="none" 
            opacity="0.25"
          />
          
          {/* Líneas rectas en diferentes ángulos */}
          <line x1="100" y1="0" x2="200" y2="600" stroke="#C9A96E" strokeWidth="1" opacity="0.2" />
          <line x1="350" y1="0" x2="280" y2="600" stroke="#C9A96E" strokeWidth="0.8" opacity="0.15" />
          <line x1="600" y1="0" x2="700" y2="600" stroke="#C9A96E" strokeWidth="1" opacity="0.2" />
          <line x1="850" y1="0" x2="800" y2="600" stroke="#C9A96E" strokeWidth="0.6" opacity="0.15" />
          
          {/* Líneas diagonales abstractas */}
          <line x1="50" y1="0" x2="0" y2="150" stroke="#C9A96E" strokeWidth="0.8" opacity="0.2" />
          <line x1="750" y1="0" x2="1000" y2="250" stroke="#C9A96E" strokeWidth="0.8" opacity="0.15" />
          <line x1="0" y1="450" x2="300" y2="600" stroke="#C9A96E" strokeWidth="0.8" opacity="0.15" />
          <line x1="650" y1="450" x2="1000" y2="600" stroke="#C9A96E" strokeWidth="0.8" opacity="0.15" />
          
          {/* Formas geométricas abstractas sutiles */}
          <rect x="150" y="80" width="40" height="40" stroke="#C9A96E" strokeWidth="1" fill="none" opacity="0.15" transform="rotate(25 170 100)" />
          <rect x="520" y="120" width="30" height="30" stroke="#C9A96E" strokeWidth="0.8" fill="none" opacity="0.12" transform="rotate(-15 535 135)" />
          <rect x="800" y="200" width="50" height="50" stroke="#C9A96E" strokeWidth="0.8" fill="none" opacity="0.1" transform="rotate(40 825 225)" />
          
          {/* Círculos abstractos */}
          <circle cx="250" cy="480" r="60" stroke="#C9A96E" strokeWidth="0.6" fill="none" opacity="0.1" />
          <circle cx="750" cy="100" r="80" stroke="#C9A96E" strokeWidth="0.6" fill="none" opacity="0.08" />
          <circle cx="100" cy="300" r="40" stroke="#C9A96E" strokeWidth="0.5" fill="none" opacity="0.1" />
          
          {/* Puntos decorativos */}
          <circle cx="50" cy="200" r="3" fill="#C9A96E" opacity="0.2" />
          <circle cx="300" cy="100" r="2" fill="#C9A96E" opacity="0.15" />
          <circle cx="500" cy="350" r="4" fill="#C9A96E" opacity="0.15" />
          <circle cx="700" cy="280" r="2" fill="#C9A96E" opacity="0.2" />
          <circle cx="950" cy="420" r="3" fill="#C9A96E" opacity="0.15" />
          <circle cx="180" cy="500" r="2" fill="#C9A96E" opacity="0.12" />
          <circle cx="850" cy="80" r="2.5" fill="#C9A96E" opacity="0.12" />
        </svg>

        {/* Círculos difuminados de fondo */}
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#C9A96E]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#C9A96E]/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#C9A96E]/5 blur-3xl" />

        {/* Contenido */}
        <div className="relative z-10 text-center max-w-3xl px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A96E]/30 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-sm mb-6">
            <Sparkles className="w-3 h-3 text-[#C9A96E]" />
            <span className="text-[8px] tracking-[0.3em] uppercase text-[#C9A96E] font-medium">Galería Fresh Nails</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-light font-serif tracking-wide text-neutral-800 dark:text-white drop-shadow-sm">
            Galería de Arte
          </h1>
          
          <div className="w-12 h-[2px] bg-[#C9A96E] mx-auto my-6" />
          
          <p className="text-sm text-neutral-500 dark:text-neutral-400 tracking-[0.15em] uppercase font-light max-w-md mx-auto">
            Descubre la colección de diseños exclusivos
          </p>
          
          <button 
            onClick={scrollToGallery}
            className="mt-8 px-8 py-3 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] tracking-[0.25em] uppercase font-medium hover:bg-[#C9A96E] dark:hover:bg-[#C9A96E] hover:text-white transition-all duration-500 flex items-center gap-3 mx-auto shadow-lg hover:shadow-[#C9A96E]/20"
          >
            Explorar <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ============================================================
          GALERÍA
      ============================================================ */}
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

              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-[#C9A96E] dark:hover:bg-[#C9A96E] transition-all duration-300 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" /> Subir
              </button>
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
              </div>
            ) : (
              <div className={viewMode === 'masonry' ? 'columns-2 md:columns-3 lg:columns-4 gap-4 md:gap-6 space-y-4 md:space-y-6' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'}>
                {filteredImages.map((img, idx) => {
                  const isLiked = likedImages.has(img.id)
                  const isHovered = hoveredImageId === img.id

                  const heights = ['h-[320px]', 'h-[400px]', 'h-[280px]', 'h-[360px]', 'h-[440px]', 'h-[300px]']
                  const heightClass = heights[idx % heights.length]

                  return (
                    <motion.div
                      key={img.id}
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
                                {img.client_name || 'Fresh Nails'}
                              </span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleLike(img.id); }} 
                                className={`p-1.5 rounded-full transition-all duration-300 ${
                                  isLiked ? 'text-red-500' : 'text-white/60 hover:text-white'
                                } ${likedAnimating === img.id ? 'animate-ping' : ''}`}
                              >
                                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full text-[7px] text-white/80 tracking-[0.2em] uppercase font-medium">
                          {img.sensory_category || 'Exclusivo'}
                        </div>

                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full text-[8px] text-white/60">
                          <Heart className="w-2.5 h-2.5 fill-current" />
                          {img.likes || 0}
                        </div>
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
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 px-6 py-2 rounded-full bg-neutral-900 text-white text-[10px] tracking-[0.15em] uppercase font-light hover:bg-[#C9A96E] transition-colors"
                >
                  Subir mi primera foto
                </button>
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
          LIGHTBOX - COMPLETO CON PRECIO, NOMBRE, DESCRIPCIÓN, ARTISTA
      ============================================================ */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <div className="absolute inset-0 bg-black/80" />

            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {filteredImages.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
                  className="absolute left-2 md:left-6 p-2 md:p-3 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
                  className="absolute right-2 md:right-6 p-2 md:p-3 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </>
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-[10px] tracking-[0.2em] font-mono z-50">
              {lightboxIndex + 1} / {filteredImages.length}
            </div>

            <motion.div 
              className="relative z-10 w-full max-w-5xl max-h-[90vh] bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl"
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
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

                {/* Info - COMPLETA con todo lo que tenía antes */}
                <div className="md:w-2/5 p-6 md:p-8 bg-neutral-900 text-white flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-4">
                    {/* Categoría */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[8px] tracking-[0.2em] uppercase bg-white/10 px-3 py-1 rounded-full">
                        {selectedImage.sensory_category || 'Exclusivo'}
                      </span>
                    </div>

                    {/* Título */}
                    <h2 className="font-serif text-2xl md:text-3xl font-light tracking-wide">
                      {selectedImage.title}
                    </h2>

                    {/* Descripción */}
                    {selectedImage.description && (
                      <p className="text-sm text-neutral-400 font-light leading-relaxed">
                        {selectedImage.description}
                      </p>
                    )}

                    {/* Detalles - PRECIO, ARTISTA, ESMALTADO, VISUALIZACIONES */}
                    <div className="space-y-3 pt-4 border-t border-white/10">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500 text-sm">Artista</span>
                        <span className="text-white/90 font-light">{selectedImage.client_name || 'Fresh Nails'}</span>
                      </div>
                      
                      {selectedImage.polish_used && (
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-500 text-sm">Esmaltado</span>
                          <span className="text-white/90 font-light text-right text-sm">{selectedImage.polish_used}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500 text-sm">Visualizaciones</span>
                        <span className="text-white/90 font-light">{selectedImage.views || 0}</span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-neutral-500 text-sm">Precio</span>
                        <span className="text-2xl font-serif text-[#C9A96E]">{selectedImage.price || '$45.00'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center gap-3 pt-6 border-t border-white/10 mt-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleLike(selectedImage.id); }}
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
                      onClick={() => { setSelectedImage(null); }}
                      className="px-5 py-3 rounded-full bg-[#C9A96E] text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-[#B8955A] transition-all flex items-center gap-2"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Agendar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE SUBIDA */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div 
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-neutral-900 z-10 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <h3 className="text-sm font-medium tracking-wide">Publicar Nuevo Diseño</h3>
                <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Nombre del Diseño *</label>
                  <input 
                    type="text" 
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Ej: Glossy Chrome Effect" 
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:border-[#C9A96E] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Descripción</label>
                  <textarea 
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Detalles del esmaltado, técnicas usadas..." 
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:border-[#C9A96E] transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Imagen Final *</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-6 text-center cursor-pointer hover:border-[#C9A96E] transition-colors relative min-h-[120px] flex items-center justify-center"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadFile(e.target.files[0])
                          const reader = new FileReader()
                          reader.onload = (event) => setPreviewUrl(event.target?.result as string)
                          reader.readAsDataURL(e.target.files[0])
                        }
                      }} 
                      className="hidden" 
                      accept="image/*" 
                    />
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="space-y-2">
                        <Camera className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-600" />
                        <p className="text-xs text-neutral-400">Haz clic para subir la foto</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Precio</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
                      <input 
                        type="number" 
                        value={uploadPrice}
                        onChange={(e) => setUploadPrice(e.target.value)}
                        placeholder="45.00" 
                        step="0.01"
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:border-[#C9A96E] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Categoría</label>
                    <select 
                      value={uploadCategory} 
                      onChange={(e) => setUploadCategory(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:border-[#C9A96E] transition-colors"
                    >
                      <option value="glossy">✨ Glossy</option>
                      <option value="3d">💎 3D</option>
                      <option value="minimal">🌿 Minimal</option>
                      <option value="abstract">🎨 Abstracto</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Productos Usados</label>
                  <input 
                    type="text" 
                    value={uploadPolish}
                    onChange={(e) => setUploadPolish(e.target.value)}
                    placeholder="Ej: OPI Neon Pink + Chrome Powder" 
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:border-[#C9A96E] transition-colors"
                  />
                </div>

                {uploadStatus.type && (
                  <div className={`p-3 rounded-xl text-xs text-center ${
                    uploadStatus.type === 'success' 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-500'
                  }`}>
                    {uploadStatus.message}
                  </div>
                )}

                <button
                  disabled={uploading}
                  onClick={handleUpload}
                  className="w-full py-3.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs tracking-[0.15em] uppercase font-medium rounded-xl hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? 'Publicando...' : 'Publicar en Galería'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}