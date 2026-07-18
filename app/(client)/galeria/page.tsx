'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Camera, 
  Heart, 
  X, 
  Sparkles, 
  Loader,     
  Image as ImageIcon,
  ArrowDown,
  Calendar,
  Eye,
  Upload,
  Filter,
  Grid,
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
  before_image_url?: string | null
  after_image_url?: string | null
}

export default function GaleriaPage() {
  const { user, tenantId } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Refs
  const galleryRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const beforeInputRef = useRef<HTMLInputElement>(null)

  // Estados principales
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'public' | 'personal'>('public')
  const [sensoryFilter, setSensoryFilter] = useState<'all' | 'glossy' | '3d' | 'minimal' | 'abstract'>('all')

  // Estados de datos
  const [publicImages, setPublicImages] = useState<GalleryImage[]>([])
  const [clientImages, setClientImages] = useState<GalleryImage[]>([])
  const [clientId, setClientId] = useState<string | null>(null)
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set())

  // Micro-interacciones simplificadas y refinadas
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set())
  const [renderedFilters, setRenderedFilters] = useState<GalleryImage[]>([])
  const [likedAnimating, setLikedAnimating] = useState<string | null>(null)

  // Slider Antes/Después
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDraggingSlider, setIsDraggingSlider] = useState(false)

  // Modal de subida
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

  // Lightbox
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  // ============================================================
  // CARGAR DATOS DESDE SUPABASE (Lógica Original Intacta)
  // ============================================================
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
        const mappedPublic = publicPhotos.map((photo: any) => {
          const isAdmin = !photo.client_id
          return {
            ...photo,
            client_name: photo.client_name || (isAdmin ? 'Fresh Nails' : 'Cliente'),
            uploaded_by_admin: isAdmin,
            likes: photo.likes ?? 0,
            views: photo.views ?? 0,
            sensory_category: photo.sensory_category || 'glossy',
            polish_used: photo.polish_used || 'Fresh Nails Premium',
            price: photo.price ? `$${photo.price}` : '$45.00',
            before_image_url: photo.before_image_url || null,
            after_image_url: photo.after_image_url || null
          }
        })
        setPublicImages(mappedPublic)
      }
    } catch (error) {
      console.error('Error cargando la galería:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrado elegante en cascada
  useEffect(() => {
    const baseImages = publicImages.filter(img => sensoryFilter === 'all' || img.sensory_category === sensoryFilter)
    setRenderedFilters([])

    baseImages.forEach((img, index) => {
      setTimeout(() => {
        setRenderedFilters(prev => [...prev, img])
      }, index * 40) // Animación fluida más veloz
    })
  }, [sensoryFilter, publicImages])

  // Intersection Observer para revelado suave al hacer scroll
  useEffect(() => {
    if (loading || renderedFilters.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-id')
            if (id) setVisibleItems((prev) => new Set([...prev, id]))
          }
        })
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    )

    const elements = document.querySelectorAll('.scroll-reveal-item')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [loading, renderedFilters])

  // Subida de Archivos (Lógica Original Intacta)
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

      let beforeImageUrl = null
      if (uploadBeforeFile) {
        const beforeFileName = `before/${Date.now()}_${uploadBeforeFile.name}`
        const { error: beforeError } = await supabase.storage
          .from('gallery')
          .upload(beforeFileName, uploadBeforeFile)

        if (!beforeError) {
          const { data: beforeUrlData } = supabase.storage.from('gallery').getPublicUrl(beforeFileName)
          beforeImageUrl = beforeUrlData.publicUrl
        }
      }

      const newImage = {
        client_id: isAdmin ? null : clientId,
        tenant_id: resolvedTenantId,
        image_url: afterImageUrl,
        title: uploadTitle || (isAdmin ? 'Estilo de Vanguardia' : 'Mi Diseño'),
        description: uploadDescription || '',
        before_image_url: beforeImageUrl,
        after_image_url: afterImageUrl,
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
          price: `$${parseFloat(uploadPrice) || 45.00}`,
          before_image_url: beforeImageUrl,
          after_image_url: afterImageUrl
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
        setUploadBeforeFile(null)
        setUploadBeforePreview(null)
        setUploadStatus({ type: null, message: '' })
      }, 1200)

    } catch (e: any) {
      setUploadStatus({ type: 'error', message: e.message || 'Error al guardar.' })
    } finally {
      setUploading(false)
    }
  }

  // Gestión de Likes
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

  // Manejo del control deslizante Antes/Después
  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }

  const scrollSmoothToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] dark:bg-neutral-950 flex flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-2 border-neutral-200 dark:border-neutral-800 rounded-full animate-ping absolute" />
          <Loader className="w-6 h-6 text-neutral-800 dark:text-neutral-200 animate-spin stroke-[1]" />
        </div>
        <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-500 dark:text-neutral-400 font-medium">
          Cargando Espacio de Arte...
        </span>
      </div>
    )
  }

  return (
    <div className="bg-[#FAF6F0] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 min-h-screen relative overflow-x-hidden transition-colors duration-500 selection:bg-neutral-900/10 dark:selection:bg-white/10 selection:text-current">
      
      {/* HERO MINIMALISTA DE ALTO IMPACTO */}
      <div className="relative w-full h-[85vh] overflow-hidden bg-neutral-900 flex items-center justify-center">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover brightness-75 contrast-105 select-none pointer-events-none transition-transform duration-[3s] scale-100"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-manicure-treatment-in-a-beauty-salon-41551-large.mp4" type="video/mp4" />
        </video>

        {/* Gradiente sutil editorial */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF6F0] via-black/30 to-black/60 dark:from-neutral-950 transition-colors duration-500" />

        <div className="relative text-center space-y-6 max-w-4xl px-6 z-20 mt-12">
          <div className="space-y-4 animate-[fadeIn_1s_ease]">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/20 rounded-full bg-white/5 backdrop-blur-md">
              <Sparkle className="w-3 h-3 text-white/80 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-white/80 text-[9px] tracking-[0.3em] uppercase font-semibold">
                Lookbook Oficial
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-light tracking-[0.08em] text-white font-serif uppercase leading-none drop-shadow-sm">
              Fresh Nails <br />
              <span className="italic font-normal tracking-normal normal-case opacity-90 block mt-2 text-2xl sm:text-3xl md:text-5xl font-sans text-neutral-200">
                Atelier del diseño
              </span>
            </h1>
          </div>
          <p className="text-white/70 text-xs sm:text-sm tracking-[0.2em] font-light max-w-xl mx-auto uppercase leading-relaxed">
            Explora creaciones exclusivas e interactúa con el portafolio de nuestras artistas residenciales.
          </p>
          <div className="pt-6">
            <button 
              onClick={scrollSmoothToGallery}
              className="px-8 py-3 rounded-full text-[10px] font-medium tracking-[0.25em] uppercase bg-white text-neutral-950 hover:bg-neutral-950 hover:text-white transition-all duration-300 shadow-xl flex items-center gap-3 mx-auto group"
            >
              <span>Ingresar a la Galería</span>
              <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN PRINCIPAL DE CONTENIDO */}
      <div ref={galleryRef} className="max-w-7xl mx-auto px-4 sm:px-8 py-16 space-y-16 relative z-20">

        {/* CONTROLES DE PESTAÑA PRINCIPALES */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-neutral-300/40 dark:border-neutral-800 pb-4 gap-6">
          <div className="flex gap-8 text-xs tracking-[0.2em] uppercase font-medium">
            <button 
              onClick={() => setActiveTab('public')}
              className={`pb-4 relative transition-all duration-300 ${activeTab === 'public' ? 'text-neutral-900 dark:text-white font-bold opacity-100' : 'text-neutral-400 dark:text-neutral-500 hover:opacity-80'}`}
            >
              Colección de Alta Costura
              {activeTab === 'public' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-900 dark:bg-white" />}
            </button>
            <button 
              onClick={() => setActiveTab('personal')}
              className={`pb-4 relative transition-all duration-300 ${activeTab === 'personal' ? 'text-neutral-900 dark:text-white font-bold opacity-100' : 'text-neutral-400 dark:text-neutral-500 hover:opacity-80'}`}
            >
              Mi Bitácora Privada ({clientImages.length})
              {activeTab === 'personal' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-900 dark:bg-white" />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-2.5 rounded-xl text-[10px] font-semibold tracking-[0.2em] uppercase bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-white transition-all duration-300 shadow-sm flex items-center gap-2"
          >
            <Camera className="w-3.5 h-3.5" /> Compartir mi Estilo
          </button>
        </div>

        {/* BARRA DE FILTRADO SENSORIAL DE AUTOR */}
        {activeTab === 'public' && (
          <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-neutral-300/30 dark:border-neutral-800/60 shadow-xs gap-4">
            <div className="flex items-center gap-2 text-neutral-400 px-2 text-xs uppercase tracking-wider font-medium">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtrar Estilo:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center w-full md:w-auto">
              {[
                { id: 'all', label: 'Ver Todo' },
                { id: 'glossy', label: 'Efecto Glossy ✨' },
                { id: '3d', label: 'Alta Textura 3D 💎' },
                { id: 'minimal', label: 'Minimalismo Puro 🌿' },
                { id: 'abstract', label: 'Arte Abstracto 🎨' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setSensoryFilter(btn.id as any)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-medium tracking-wide transition-all duration-200 ${
                    sensoryFilter === btn.id 
                      ? 'bg-neutral-950 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-xs scale-[1.02]' 
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CONTENEDOR DE PRODUCTOS / DISEÑOS GRID CLEAN EDITORIAL */}
        {activeTab === 'public' ? (
          renderedFilters.length === 0 ? (
            /* Estado de carga interna o esqueleto elegante */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="space-y-3">
                  <div className="w-full aspect-[4/5] rounded-2xl bg-neutral-200/60 dark:bg-neutral-900 animate-pulse" />
                  <div className="h-3 w-2/3 bg-neutral-200 dark:bg-neutral-900 rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-neutral-200 dark:bg-neutral-900 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            /* Grid simétrico y moderno estilo e-commerce premium */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {renderedFilters.map((img, index) => {
                const isLiked = likedImages.has(img.id)
                const isVisible = visibleItems.has(img.id)

                // Renderizado sutil de un banner publicitario elegante integrado en la grilla cada 6 items
                const insertBanner = index > 0 && index % 6 === 0

                return (
                  <div key={img.id} className="contents">
                    {insertBanner && (
                      <div className="rounded-2xl bg-neutral-950 p-8 text-white flex flex-col justify-between border border-neutral-800 shadow-md min-h-[350px] aspect-[4/5] sm:col-span-1">
                        <div className="space-y-4">
                          <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-500 block font-mono">Experiencia Salon</span>
                          <h3 className="font-serif text-2xl font-light tracking-wide leading-tight">
                            ¿Lista para tu próximo cambio?
                          </h3>
                          <p className="text-xs font-light text-neutral-400 leading-relaxed">
                            Reserva un diagnóstico personalizado con nuestras expertas en salud y diseño de uñas.
                          </p>
                        </div>
                        <button 
                          onClick={() => alert('Redireccionando al agendamiento oficial...')}
                          className="w-full py-3 bg-white text-neutral-950 rounded-xl text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-200 transition-colors duration-300"
                        >
                          Agendar Cita ✦
                        </button>
                      </div>
                    )}

                    <div
                      data-id={img.id}
                      onClick={() => setSelectedImage(img)}
                      className={`scroll-reveal-item group flex flex-col space-y-3 cursor-pointer transition-all duration-700 ease-out ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                      }`}
                    >
                      {/* Contenedor de la Imagen */}
                      <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-300/20 dark:border-neutral-800/40 shadow-xs">
                        <img 
                          src={img.image_url} 
                          alt={img.title} 
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" 
                          loading="lazy"
                        />
                        
                        {/* Tags de estado flotantes sutiles */}
                        <div className="absolute top-3 left-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 border border-neutral-200/20 shadow-xs">
                          {img.sensory_category || 'Colección'}
                        </div>

                        {img.before_image_url && img.after_image_url && (
                          <div className="absolute top-3 right-3 bg-neutral-900/80 text-white backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider border border-white/10 shadow-xs">
                            Transformación
                          </div>
                        )}

                        {/* Botón de Like interactivo sobre la foto */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleLike(img.id); }} 
                          className={`absolute bottom-3 right-3 p-2.5 rounded-xl backdrop-blur-md transition-all duration-300 border ${
                            isLiked 
                              ? 'bg-neutral-900 text-white border-transparent scale-105' 
                              : 'bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white border-neutral-200/40 dark:border-neutral-700/40 hover:bg-white dark:hover:bg-neutral-900'
                          } ${likedAnimating === img.id ? 'animate-[ping_0.3s_ease-out_1]' : ''}`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-red-500' : ''} stroke-[1.8]`} />
                        </button>
                      </div>

                      {/* Metadatos informativos inferiores */}
                      <div className="flex justify-between items-start px-1">
                        <div className="space-y-0.5 max-w-[75%]">
                          <h4 className="font-serif text-base tracking-wide text-neutral-900 dark:text-neutral-100 group-hover:underline truncate">
                            {img.title}
                          </h4>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 font-light truncate">
                            Por {img.client_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-mono font-medium text-neutral-900 dark:text-neutral-100">
                            {img.price}
                          </span>
                          <div className="flex items-center justify-end gap-1 text-[10px] text-neutral-400 mt-0.5">
                            <Eye className="w-3 h-3" />
                            <span>{img.views || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          /* HISTORIAL PRIVADO LIMPIO */
          clientImages.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-neutral-900/40 rounded-3xl border border-dashed border-neutral-300/60 dark:border-neutral-800 max-w-md mx-auto space-y-4 p-8">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto">
                <ImageIcon className="w-5 h-5 text-neutral-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm tracking-wider uppercase font-semibold">Tu bitácora está libre</h3>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 font-light px-4">
                  Sube fotos de tus visitas para dar seguimiento a la evolución, largo y cuidado de tus uñas.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {clientImages.map((img) => (
                <div 
                  key={img.id} 
                  onClick={() => setSelectedImage(img)}
                  className="group relative rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 cursor-zoom-in aspect-square shadow-xs hover:shadow-md transition-all duration-300"
                >
                  <img src={img.image_url} alt={img.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <span className="text-[10px] text-white/90 font-mono">
                      {new Date(img.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* DEMOSTRACIÓN DE TÉCNICA DINÁMICA (SLIDER ANTES/DESPUÉS) */}
        {activeTab === 'public' && renderedFilters.length > 0 && (
          <div className="space-y-6 pt-12 border-t border-neutral-300/30 dark:border-neutral-800/60">
            <div className="text-center space-y-2 max-w-lg mx-auto">
              <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-[0.2em]">Arquitectura y Anatomía</div>
              <h2 className="font-serif text-2xl sm:text-4xl tracking-wide font-light">Resultados Reales</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light leading-relaxed">
                Desplaza la barra divisoria lateralmente para visualizar los procesos de corrección y perfeccionamiento estructural.
              </p>
            </div>

            {(() => {
              const beforeAfterImage = renderedFilters.find(img => img.before_image_url && img.after_image_url)
              const beforeImage = beforeAfterImage?.before_image_url || "https://images.unsplash.com/photo-1632345031435-8797b2d58045?q=80&w=1200&auto=format&fit=crop"
              const afterImage = beforeAfterImage?.after_image_url || "https://images.unsplash.com/photo-1604654894610-df490651e56c?q=80&w=1200&auto=format&fit=crop"

              return (
                <div 
                  ref={sliderRef}
                  onMouseMove={(e) => isDraggingSlider && handleSliderMove(e.clientX)}
                  onTouchMove={(e) => isDraggingSlider && e.touches[0] && handleSliderMove(e.touches[0].clientX)}
                  onMouseDown={() => setIsDraggingSlider(true)}
                  onTouchStart={() => setIsDraggingSlider(true)}
                  onMouseUp={() => setIsDraggingSlider(false)}
                  onTouchEnd={() => setIsDraggingSlider(false)}
                  onMouseLeave={() => setIsDraggingSlider(false)}
                  className="relative w-full max-w-4xl aspect-[16/10] sm:aspect-video mx-auto rounded-3xl overflow-hidden shadow-xl bg-neutral-200 dark:bg-neutral-900 select-none cursor-ew-resize border border-neutral-300/20 dark:border-neutral-800"
                >
                  {/* Lado Derecho: DESPUÉS */}
                  <div className="absolute inset-0">
                    <img src={afterImage} alt="Resultado Final" className="w-full h-full object-cover pointer-events-none" />
                    <div className="absolute bottom-4 right-4 bg-neutral-950/80 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] tracking-widest text-white uppercase font-semibold border border-white/10">Después</div>
                  </div>

                  {/* Lado Izquierdo: ANTES */}
                  <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
                    <img 
                      src={beforeImage} 
                      alt="Estado Inicial" 
                      className="absolute inset-y-0 left-0 h-full object-cover max-w-none pointer-events-none"
                      style={{ width: sliderRef.current?.getBoundingClientRect().width }}
                    />
                    <div className="absolute bottom-4 left-4 bg-neutral-950/80 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] tracking-widest text-white uppercase font-semibold border border-white/10">Antes</div>
                  </div>

                  {/* Línea Divisoria Interactiva */}
                  <div className="absolute inset-y-0 w-px -translate-x-1/2 pointer-events-none z-30" style={{ left: `${sliderPosition}%`, backgroundColor: 'rgba(255,255,255,0.4)' }}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 shadow-xl flex items-center justify-center text-xs text-neutral-600 dark:text-neutral-400">
                      <Grid className="w-3.5 h-3.5 rotate-45" />
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

      </div>

      {/* LIGHTBOX DETALLADO EDITORIAL */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-neutral-950/90 backdrop-blur-md animate-[fadeIn_0.2s_ease]"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)} 
            className="absolute top-6 right-6 p-2.5 text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>

          <div 
            className="bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 animate-[scaleUp_0.3s_cubic-bezier(0.16,1,0.3,1)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative aspect-square md:aspect-auto md:h-full bg-neutral-100 dark:bg-neutral-950 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800">
              <img src={selectedImage.image_url} alt={selectedImage.title} className="w-full h-full object-cover" />
            </div>

            <div className="p-6 sm:p-10 flex flex-col justify-between space-y-8 bg-white dark:bg-neutral-900">
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    {selectedImage.sensory_category || 'Exclusivo'}
                  </span>
                  <span className="text-xs text-neutral-400 font-light">
                    {new Date(selectedImage.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif text-2xl sm:text-3xl font-light tracking-wide text-neutral-900 dark:text-white">
                    {selectedImage.title}
                  </h3>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">Publicado por {selectedImage.client_name}</p>
                </div>

                {selectedImage.description && (
                  <p className="text-xs font-light leading-relaxed text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200/50 dark:border-neutral-800/60">
                    {selectedImage.description}
                  </p>
                )}

                <div className="space-y-3 pt-2 text-xs font-light">
                  <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                    <span className="text-neutral-400">Gama de esmalte:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{selectedImage.polish_used}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                    <span className="text-neutral-400">Atención:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">Fresh Nails Staff Certificado</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-neutral-400">Vistas de inspiración:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {selectedImage.views || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Inversión Estimada</span>
                  <span className="text-2xl font-mono font-bold text-neutral-900 dark:text-white">{selectedImage.price}</span>
                </div>
                <button 
                  onClick={() => { setSelectedImage(null); alert('Redireccionando al agendamiento oficial...'); }}
                  className="px-6 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 rounded-xl text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" /> Agendar este Look
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SUBIDA COMPLETO REDISEÑADO CON FLUIDEZ */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease]">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">

            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3 sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <span className="text-xs font-bold tracking-widest uppercase text-neutral-400">Registrar Nuevo Diseño</span>
              <button onClick={() => setShowUploadModal(false)} className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold">Título del Estilo *</label>
                <input 
                  type="text" 
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Ej: Velvet Cat Eye Chrome" 
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm focus:outline-hidden focus:border-neutral-400"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold">Descripción Técnica</label>
                <textarea 
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Detalla los efectos o stickers utilizados..." 
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm focus:outline-hidden focus:border-neutral-400 resize-none"
                />
              </div>

              {/* Zona de Subida Resultado Final */}
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold">Foto Final *</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 text-center cursor-pointer aspect-video flex flex-col items-center justify-center relative overflow-hidden bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <input type="file" ref={fileInputRef} onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0])
                      const reader = new FileReader()
                      reader.onload = (event) => setPreviewUrl(event.target?.result as string)
                      reader.readAsDataURL(e.target.files[0])
                    }
                  }} className="hidden" accept="image/*" />
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview Final" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="space-y-1">
                      <Camera className="w-5 h-5 mx-auto text-neutral-400" />
                      <p className="text-[11px] text-neutral-400 font-light">Esmaltado finalizado</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Zona de Subida Foto Antes */}
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold">Foto Antes (Opcional)</label>
                <div 
                  onClick={() => beforeInputRef.current?.click()}
                  className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 text-center cursor-pointer aspect-video flex flex-col items-center justify-center relative overflow-hidden bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <input ref={beforeInputRef} type="file" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadBeforeFile(e.target.files[0])
                      const reader = new FileReader()
                      reader.onload = (event) => setUploadBeforePreview(event.target?.result as string)
                      reader.readAsDataURL(e.target.files[0])
                    }
                  }} className="hidden" accept="image/*" />
                  {uploadBeforePreview ? (
                    <img src={uploadBeforePreview} alt="Preview Antes" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="space-y-1">
                      <Camera className="w-4 h-4 mx-auto text-neutral-400" />
                      <p className="text-[11px] text-neutral-400 font-light">Estado inicial de la uña</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold">Precio ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-mono">$</span>
                  <input 
                    type="number" 
                    value={uploadPrice}
                    onChange={(e) => setUploadPrice(e.target.value)}
                    placeholder="45.00" 
                    step="0.01"
                    min="0"
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold">Categoría Visual</label>
                <select 
                  value={uploadCategory} 
                  onChange={(e) => setUploadCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm focus:outline-hidden"
                >
                  <option value="glossy">✨ Efecto Glossy</option>
                  <option value="3d">💎 Textura 3D</option>
                  <option value="minimal">🌿 Minimalismo</option>
                  <option value="abstract">🎨 Arte Abstracto</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold">Materiales / Tonos Usados</label>
                <input 
                  type="text" 
                  value={uploadPolish}
                  onChange={(e) => setUploadPolish(e.target.value)}
                  placeholder="Ej: Base Gel, OPI Chrome Powder White" 
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm focus:outline-hidden Magnet"
                />
              </div>
            </div>

            {uploadStatus.type && (
              <div className={`p-3 rounded-xl text-xs text-center font-medium ${
                uploadStatus.type === 'success' 
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200' 
                  : 'bg-red-50 dark:bg-red-950/30 text-red-500'
              }`}>
                {uploadStatus.message}
              </div>
            )}

            <button
              type="button"
              disabled={uploading}
              onClick={handleUpload}
              className="w-full py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 tracking-widest text-xs uppercase font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Registrando en base de datos...' : 'Publicar en Lookbook'}
            </button>

          </div>
        </div>
      )}

    </div>
  )
}

/* WIDGET AUXILIAR REDISEÑADO DE FORMA LIMPIA */
export function SidebarGalleryWidget() {
  return (
    <div className="p-5 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 text-xs font-light shadow-xs space-y-2.5">
      <div className="flex items-center gap-1.5 text-neutral-800 dark:text-white font-semibold tracking-wider uppercase text-[11px]">
        <Sparkles className="w-4 h-4" /> Universo Atelier
      </div>
      <p className="leading-relaxed text-neutral-500 dark:text-neutral-400 text-[11px]">
        Explora combinaciones cromáticas avanzadas de esmaltado de autor e interactúa de manera directa guardando tu historial.
      </p>
    </div>
  )
}
