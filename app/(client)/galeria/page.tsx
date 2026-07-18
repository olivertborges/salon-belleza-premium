'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  X, 
  Sparkles, 
  Loader,     
  ArrowDown,
  Plus,
  Calendar,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  LayoutList
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
  price: number
  views?: number
  professional_id?: string 
}

export default function GaleriaPage() {
  const { user, tenantId } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()

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
  const [fullImageMode, setFullImageMode] = useState(false)

  // Pre-carga automática de la ruta agenda
  useEffect(() => {
    router.prefetch('/agenda')
  }, [router])

  useEffect(() => {
    loadGalleryData()
  }, [user])

  useEffect(() => {
    if (!selectedImage) setFullImageMode(false)
  }, [selectedImage])

  // 🔥 Solución definitiva contra el doble render/recarga usando manipulación de historial nativa + router client-side
  const handleBookingRedirect = (image: GalleryImage) => {
    const profId = image.professional_id || ''
    const designTitle = encodeURIComponent(image.title)
    const targetUrl = `/agenda?professional=${profId}&style=${designTitle}`

    // 1. Limpiamos estados del modal para desmontar elementos gráficos pesados
    setSelectedImage(null)
    setFullImageMode(false)

    // 2. Modificamos la URL en segundo plano mediante pushState nativo del navegador.
    if (typeof window !== 'undefined') {
      window.history.pushState({ ...window.history.state, as: targetUrl, url: targetUrl }, '', targetUrl)
    }

    // 3. Ejecutamos la redirección puramente interna controlando que no se dispare un reset del scroll
    setTimeout(() => {
      router.push(targetUrl, { scroll: false })
    }, 50)
  }

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

      // Corregido: Sin comillas literales
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
          price: photo.price ? Number(photo.price) : 45.00,
          professional_id: photo.professional_id || '' 
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
          price: parseFloat(uploadPrice) || 45.00
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
    setSelectedImage(img)
  }

  const navigateLightbox = (direction: 'next' | 'prev') => {
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
            onClick={scrollToGallery}
            className="mt-8 px-8 py-3 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] tracking-[0.25em] uppercase font-medium hover:bg-[#C9A96E] transition-all flex items-center gap-3 mx-auto shadow-lg"
          >
            Explorar <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* CONTROLES DE LA GALERÍA */}
      <div ref={galleryRef} className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-20">
        <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-neutral-200/50 dark:border-neutral-800/50 p-4 md:p-5 mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 rounded-full p-1 w-full md:w-auto">
              <button
                onClick={() => setActiveTab('public')}
                className={`flex-1 md:flex-none px-5 py-2 rounded-full text-[10px] tracking-[0.15em] uppercase font-medium transition-all duration-300 ${
                  activeTab === 'public' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-400'
                }`}
              >
                Colección
              </button>
              <button
                onClick={() => setActiveTab('personal')}
                className={`flex-1 md:flex-none px-5 py-2 rounded-full text-[10px] tracking-[0.15em] uppercase font-medium transition-all duration-300 ${
                  activeTab === 'personal' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-400'
                }`}
              >
                Mis Fotos <span className="ml-1 text-[8px] opacity-60">({clientImages.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 rounded-full p-1">
                <button onClick={() => setViewMode('masonry')} className={`p-1.5 rounded-full ${viewMode === 'masonry' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-neutral-400'}`}>
                  <Grid3x3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-full ${viewMode === 'grid' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-neutral-400'}`}>
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-[#C9A96E] transition-all flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" /> Subir
              </button>
            </div>
          </div>

          {activeTab === 'public' && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-neutral-200/50 dark:border-neutral-800/50">
              <span className="text-[8px] tracking-[0.2em] uppercase text-neutral-400 font-medium mr-2">Filtrar:</span>
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
                  className={`px-4 py-1.5 rounded-full text-[9px] font-medium transition-all ${
                    sensoryFilter === btn.id ? 'bg-[#C9A96E] text-white shadow-md' : 'bg-neutral-100 dark:bg-neutral-800/50 text-neutral-500'
                  }`}
                >
                  <span className="mr-1">{btn.icon}</span> {btn.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LISTADO DE IMÁGENES */}
        {activeTab === 'public' ? (
          <>
            {filteredImages.length === 0 ? (
              <div className="text-center py-20">
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
                        <img src={img.image_url} alt={img.title} className="w-full h-full object-cover" loading="lazy" />
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                            <h3 className="font-serif text-lg font-light tracking-wide truncate">{img.title}</h3>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-white/60">{img.client_name || 'Fresh Nails'}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleLike(img.id); }} 
                                className={`p-1.5 rounded-full transition-transform active:scale-125 ${isLiked ? 'text-red-500' : 'text-white/60'}`}
                              >
                                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full text-[7px] text-white/80 tracking-[0.2em] uppercase font-medium">
                          {img.sensory_category || 'Exclusivo'}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {clientImages.map((img) => (
              <div key={img.id} onClick={() => openLightbox(img)} className="relative rounded-2xl overflow-hidden cursor-pointer group aspect-square bg-neutral-100 dark:bg-neutral-800 hover:shadow-lg transition-all">
                <img src={img.image_url} alt={img.title} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL LIGHTBOX */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 bg-black/40 backdrop-blur-sm"
              title="Cerrar modal"
            >
              <X className="w-6 h-6" />
            </button>

            {activeTab === 'public' && filteredImages.length > 1 && (
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

            <motion.div 
              className={`relative z-10 w-full flex flex-col md:flex-row bg-neutral-900 transition-all duration-500 ease-out overflow-hidden rounded-2xl shadow-2xl flex-nowrap ${
                fullImageMode ? 'max-w-4xl h-auto max-h-[90vh]' : 'max-w-5xl h-auto max-h-[90vh] md:max-h-[82vh]'
              }`}
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* LADO DE LA IMAGEN */}
              <div 
                className={`bg-neutral-950 flex items-center justify-center p-3 md:p-6 overflow-hidden relative group cursor-pointer transition-all duration-500 flex-1 ${
                  fullImageMode ? 'w-full min-h-[60vh] md:min-h-[80vh]' : 'w-full md:w-[58%] min-h-[35vh] md:min-h-0'
                }`}
                onClick={() => setFullImageMode(!fullImageMode)}
              >
                <img 
                  src={selectedImage.image_url} 
                  alt={selectedImage.title}
                  className={`w-auto h-auto object-contain rounded-lg shadow-2xl transition-all duration-500 ${
                    fullImageMode ? 'max-h-[70vh] md:max-h-[76vh] scale-[1.01]' : 'max-h-[40vh] md:max-h-[72vh]'
                  }`}
                />

                <button
                  onClick={(e) => { e.stopPropagation(); setFullImageMode(!fullImageMode); }}
                  className="absolute bottom-4 right-4 p-2.5 bg-black/60 hover:bg-[#C9A96E] text-white rounded-xl backdrop-blur-md transition-all duration-300 flex items-center gap-2 text-[9px] tracking-widest uppercase shadow-lg border border-white/5 z-20"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-white" />
                  <span>{fullImageMode ? 'Ver Info' : 'Solo Foto'}</span>
                </button>
              </div>

              {/* LADO DE INFORMACIÓN */}
              <AnimatePresence initial={false}>
                {!fullImageMode && (
                  <motion.div 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '100%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="w-full md:w-[42%] p-5 md:p-8 bg-neutral-900 text-white flex flex-col justify-between overflow-y-auto overflow-x-hidden max-h-[45vh] md:max-h-none border-t border-white/5 md:border-t-0 md:border-l border-white/5 shrink-0"
                  >
                    <div className="space-y-4">
                      <span className="text-[8px] tracking-[0.2em] uppercase bg-white/10 px-3 py-1 rounded-full inline-block text-neutral-300">
                        {selectedImage.sensory_category || 'Exclusivo'}
                      </span>

                      <h2 className="font-serif text-xl md:text-3xl font-light tracking-wide text-white leading-tight break-words">
                        {selectedImage.title}
                      </h2>

                      {selectedImage.description && (
                        <p className="text-xs md:text-sm text-neutral-400 font-light leading-relaxed break-words">
                          {selectedImage.description}
                        </p>
                      )}

                      <div className="space-y-2.5 pt-4 border-t border-white/10">
                        <div className="flex justify-between items-center text-xs md:text-sm gap-2">
                          <span className="text-neutral-500 shrink-0">Artista</span>
                          <span className="text-white/90 font-light truncate">{selectedImage.client_name || 'Fresh Nails'}</span>
                        </div>
                        {selectedImage.polish_used && (
                          <div className="flex justify-between items-center text-xs md:text-sm gap-2">
                            <span className="text-neutral-500 shrink-0">Esmaltado</span>
                            <span className="text-white/90 font-light text-right truncate">{selectedImage.polish_used}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-xs md:text-sm">
                          <span className="text-neutral-500">Visualizaciones</span>
                          <span className="text-white/90 font-light">{selectedImage.views || 0}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                          <span className="text-neutral-500 text-xs md:text-sm">Precio</span>
                          <span className="text-xl md:text-2xl font-serif text-[#C9A96E]">
                            ${Number(selectedImage.price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-5 border-t border-white/10 mt-5 md:mt-8">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLike(selectedImage.id); }}
                        className={`flex-1 py-2.5 md:py-3 rounded-full text-[9px] md:text-[10px] tracking-[0.15em] uppercase font-medium transition-all flex items-center justify-center gap-2 ${
                          likedImages.has(selectedImage.id) 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${likedImages.has(selectedImage.id) ? 'fill-current' : ''}`} />
                        {likedImages.has(selectedImage.id) ? 'Inspirado' : 'Inspirar'}
                      </button>

                      <button 
                        onClick={() => handleBookingRedirect(selectedImage)}
                        className="px-4 md:px-5 py-2.5 md:py-3 rounded-full bg-[#C9A96E] text-white text-[9px] md:text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-[#B8955A] transition-all flex items-center gap-1.5 shadow-md shrink-0"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Agendar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE SUBIDA */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div 
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-neutral-900 z-10 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <h3 className="text-sm font-medium tracking-wide">Publicar Nuevo Diseño</h3>
                <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase block mb-1">Nombre del Diseño *</label>
                  <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Ej: Glossy Chrome" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase block mb-1">Descripción</label>
                  <textarea value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} placeholder="Detalles..." rows={2} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-sm resize-none" />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase block mb-1">Imagen Final *</label>
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-6 text-center cursor-pointer relative min-h-[120px] flex items-center justify-center">
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
                    {previewUrl ? <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" /> : <p className="text-xs text-neutral-400">Subir foto</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase block mb-1">Precio</label>
                    <input type="number" value={uploadPrice} onChange={(e) => setUploadPrice(e.target.value)} placeholder="45.00" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase block mb-1">Categoría</label>
                    <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value as any)} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white dark:bg-neutral-950 text-sm">
                      <option value="glossy">✨ Glossy</option>
                      <option value="3d">💎 3D</option>
                      <option value="minimal">🌿 Minimal</option>
                      <option value="abstract">🎨 Abstracto</option>
                    </select>
                  </div>
                </div>

                {uploadStatus.type && (
                  <div className={`p-3 rounded-xl text-xs text-center ${uploadStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {uploadStatus.message}
                  </div>
                )}

                <button disabled={uploading} onClick={handleUpload} className="w-full py-3.5 bg-neutral-900 text-white text-xs uppercase font-medium rounded-xl disabled:opacity-40 transition-all hover:bg-neutral-800">
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
