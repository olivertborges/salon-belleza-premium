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
  ZoomIn,
  Upload
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
  const heroRef = useRef<HTMLDivElement>(null)
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

  // Micro-interacciones
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 })
  const [isHoveringImage, setIsHoveringImage] = useState(false)
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null)
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set())
  const [renderedFilters, setRenderedFilters] = useState<GalleryImage[]>([])
  const [likedAnimating, setLikedAnimating] = useState<string | null>(null)

  // Slider Antes/Después
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDraggingSlider, setIsDraggingSlider] = useState(false)

  // Modal de subida - CAMPOS COMPLETOS
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

  // Historias de Instagram en Móvil
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)
  const [storyProgress, setStoryProgress] = useState(0)

  // ============================================================
  // 1. CURSOR Y PARALLAX
  // ============================================================
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }

    const handleScroll = () => {
      if (!heroRef.current) return
      const scrolled = window.scrollY
      heroRef.current.style.opacity = Math.max(0, 1 - scrolled / 600).toString()
      heroRef.current.style.transform = `translateY(${scrolled * 0.4}px)`
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // ============================================================
  // 2. HISTORIAS DE INSTAGRAM
  // ============================================================
  useEffect(() => {
    if (activeTab !== 'public' || renderedFilters.length === 0) return
    
    const interval = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          setActiveStoryIndex((prevIndex) => (prevIndex + 1) % renderedFilters.length)
          return 0
        }
        return prev + 1.5
      })
    }, 50)

    return () => clearInterval(interval)
  }, [activeStoryIndex, renderedFilters, activeTab])

  useEffect(() => {
    setStoryProgress(0)
  }, [activeStoryIndex])

  // ============================================================
  // 3. CARGAR DATOS DESDE SUPABASE
  // ============================================================
  useEffect(() => {
    loadGalleryData()
  }, [user])

  const loadGalleryData = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const activeUserId = session?.user?.id || user?.id

      // Cargar imágenes del cliente
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

      // Cargar imágenes públicas
      const { data: publicPhotos, error: publicError } = await supabase
        .from('client_gallery')
        .select('*')
        .eq('is_active', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(40)

      if (publicError) throw publicError

      // Mapear datos respetando los existentes
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

  // ============================================================
  // 4. FILTRO EN CASCADA
  // ============================================================
  useEffect(() => {
    const baseImages = publicImages.filter(img => sensoryFilter === 'all' || img.sensory_category === sensoryFilter)
    setRenderedFilters([])
    
    baseImages.forEach((img, index) => {
      setTimeout(() => {
        setRenderedFilters(prev => [...prev, img])
      }, index * 80)
    })
  }, [sensoryFilter, publicImages])

  // ============================================================
  // 5. INTERSECTION OBSERVER
  // ============================================================
  useEffect(() => {
    if (loading || renderedFilters.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-id')
            if (id) setVisibleItems((prev) => new Set([...prev, id]))
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    const elements = document.querySelectorAll('.scroll-reveal-item')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [loading, renderedFilters])

  // ============================================================
  // 6. SUBIR IMAGEN CON TODOS LOS CAMPOS
  // ============================================================
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
      
      // Subir imagen principal
      const fileExt = uploadFile.name.split('.').pop()
      const folder = isAdmin ? 'salon' : clientId || 'guests'
      const fileName = `${folder}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, uploadFile)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(fileName)
      let afterImageUrl = urlData.publicUrl

      // Subir imagen de "antes" si existe
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

      // Insertar en base de datos
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

  // ============================================================
  // 7. LIKES
  // ============================================================
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

  // ============================================================
  // 8. SLIDER ANTES/DESPUÉS
  // ============================================================
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

  // ============================================================
  // 9. RENDER
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-neutral-950 flex flex-col items-center justify-center gap-4">
        <Loader className="w-6 h-6 text-[#FF2A75] animate-spin stroke-[1.5]" />
        <span className="text-xs tracking-[0.2em] uppercase text-[#C9A96E] font-light font-sans">Cargando Experiencia Visual...</span>
      </div>
    )
  }

  return (
    <div className="bg-[#FDFBF7] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 min-h-screen relative overflow-x-hidden selection:bg-[#FF2A75]/20 font-sans transition-colors duration-300">
      
      <style jsx global>{`
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes scaleUp {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes slideDown {
          0% { transform: translateY(-20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-pop { animation: pop 0.4s ease; }
        .animate-scale-up { animation: scaleUp 0.4s ease-out; }
        .animate-fade-in { animation: fadeIn 0.3s ease; }
        .animate-slide-down { animation: slideDown 0.3s ease; }
      `}</style>

      {/* CURSOR PERSONALIZADO */}
      <div 
        className="hidden md:block fixed pointer-events-none z-50 rounded-full border transition-all duration-75 ease-out -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
        style={{
          left: `${mousePos.x}px`,
          top: `${mousePos.y}px`,
          width: isHoveringImage ? '50px' : '30px',
          height: isHoveringImage ? '50px' : '30px',
          borderColor: isHoveringImage ? '#FF2A75' : '#C9A96E',
          backgroundColor: isHoveringImage ? 'rgba(255, 42, 117, 0.1)' : 'transparent'
        }}
      >
        {isHoveringImage && (
          <div className="w-full h-full flex items-center justify-center text-xs font-light text-white font-mono">+</div>
        )}
      </div>

      {/* HERO SECTION */}
      <div ref={heroRef} className="relative w-full h-screen overflow-hidden bg-neutral-950 flex items-center justify-center z-10">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover brightness-90 saturate-110 scale-105 select-none pointer-events-none"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-manicure-treatment-in-a-beauty-salon-41551-large.mp4" type="video/mp4" />
        </video>
        
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF2A75]/10 via-transparent to-[#FDFBF7] dark:to-neutral-950 transition-colors duration-300" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cGF0aCBkPSJNMzYgMjRjMCAzLjMxNC0yLjY4NiA2LTYgNnMtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTYgNiAyLjY4NiA2IDZ6bS0xMiA0YzAgMy4zMTQtMi42ODYgNi02IDZzLTYtMi42ODYtNi02IDIuNjg2LTYgNi02IDYgMi42ODYgNiA2eiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjwvc3ZnPg==')] opacity-50" />
        
        <div className="relative text-center space-y-6 max-w-3xl px-4 z-20">
          <div className="space-y-2">
            <span className="text-[#C9A96E] text-[10px] font-sans tracking-[0.4em] uppercase font-light block animate-pulse">
              ✦ SALON ✦
            </span>
            <h1 className="text-5xl md:text-8xl font-light tracking-[0.15em] text-white font-serif uppercase leading-tight drop-shadow-2xl">
              Fresh Nails
            </h1>
          </div>
          <p className="text-white/60 text-xs md:text-sm font-sans tracking-[0.3em] uppercase font-light max-w-md mx-auto">
            El arte de la manicura elevado a su máxima expresión
          </p>
          <div className="pt-4">
            <button 
              onClick={scrollSmoothToGallery}
              className="group px-10 py-3.5 rounded-full text-xs font-sans font-medium tracking-[0.25em] uppercase border border-white/30 text-white hover:bg-white hover:text-neutral-900 transition-all duration-500 backdrop-blur-sm flex items-center gap-3 mx-auto hover:shadow-[0_0_40px_rgba(255,42,117,0.3)]"
            >
              <span>Explorar Colección</span>
              <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>

      {/* GALERÍA */}
      <div ref={galleryRef} className="max-w-7xl mx-auto px-6 md:px-10 py-20 space-y-20 relative z-20 -mt-10">
        
        {/* CONTROLES */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-neutral-200/60 dark:border-neutral-800 pb-6 gap-4">
          <div className="flex gap-8 text-sm tracking-[0.15em] uppercase font-sans font-light">
            <button 
              onClick={() => setActiveTab('public')}
              className={`pb-4 relative transition-colors ${activeTab === 'public' ? 'text-neutral-900 dark:text-white font-medium' : 'text-neutral-400 dark:text-neutral-500'}`}
            >
              Colección Alta Gama
              {activeTab === 'public' && <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#FF2A75]" />}
            </button>
            <button 
              onClick={() => setActiveTab('personal')}
              className={`pb-4 relative transition-colors ${activeTab === 'personal' ? 'text-neutral-900 dark:text-white font-medium' : 'text-neutral-400 dark:text-neutral-500'}`}
            >
              Mi Historial Privado ({clientImages.length})
              {activeTab === 'personal' && <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#FF2A75]" />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-2.5 rounded-full text-xs font-sans font-light tracking-[0.15em] uppercase bg-neutral-900 dark:bg-neutral-800 text-white hover:bg-[#FF2A75] dark:hover:bg-[#FF2A75] transition-all duration-500 shadow-xl flex items-center gap-2"
          >
            <Camera className="w-3.5 h-3.5 stroke-[1.2]" /> Registrar Mi Look
          </button>
        </div>

        {/* FILTROS SENSORIALES */}
        {activeTab === 'public' && (
          <div className="flex flex-wrap justify-center items-center gap-3 md:sticky md:top-6 z-40 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md p-3 rounded-full border border-neutral-200/50 dark:border-neutral-800/50 w-fit mx-auto shadow-sm">
            {[
              { id: 'all', label: 'Todo el Universo' },
              { id: 'glossy', label: 'Efecto Glossy ✨' },
              { id: '3d', label: 'Textura 3D 💎' },
              { id: 'minimal', label: 'Minimalismo 🌿' },
              { id: 'abstract', label: 'Arte Abstracto 🎨' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setSensoryFilter(btn.id as any)}
                className={`px-5 py-2 rounded-full text-xs font-sans tracking-wider font-light transition-all duration-300 ${
                  sensoryFilter === btn.id 
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-lg scale-102 border-transparent' 
                    : 'bg-white/20 dark:bg-neutral-800/20 border border-neutral-200/30 dark:border-neutral-700/30 text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white hover:shadow-[0_0_20px_rgba(201,169,110,0.15)]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* HISTORIAS DE INSTAGRAM (MÓVIL) */}
        {activeTab === 'public' && renderedFilters.length > 0 && (
          <div className="block md:hidden w-full space-y-4">
            <span className="text-[10px] tracking-[0.2em] font-medium uppercase text-[#C9A96E] block text-center">Exploración Rápida</span>
            <div className="relative aspect-[9/16] w-full max-w-sm mx-auto rounded-3xl overflow-hidden bg-neutral-900 shadow-2xl">
              <div className="absolute top-4 inset-x-4 z-30 flex gap-1.5">
                {renderedFilters.map((_, idx) => (
                  <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all ease-linear"
                      style={{ 
                        width: idx < activeStoryIndex ? '100%' : idx === activeStoryIndex ? `${storyProgress}%` : '0%' 
                      }}
                    />
                  </div>
                ))}
              </div>

              <img 
                src={renderedFilters[activeStoryIndex]?.image_url} 
                alt={renderedFilters[activeStoryIndex]?.title}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 space-y-2 text-white">
                <span className="text-[9px] tracking-widest font-mono text-[#C9A96E] uppercase bg-black/40 px-2 py-0.5 rounded-md">
                  {renderedFilters[activeStoryIndex]?.sensory_category}
                </span>
                <h3 className="font-serif text-xl tracking-wide">{renderedFilters[activeStoryIndex]?.title}</h3>
                <p className="text-[11px] text-neutral-300 font-light truncate">{renderedFilters[activeStoryIndex]?.description || 'Diseño exclusivo por Fresh Nails.'}</p>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-xs font-mono tracking-wider text-pink-400">{renderedFilters[activeStoryIndex]?.price}</span>
                  <button 
                    onClick={() => setSelectedImage(renderedFilters[activeStoryIndex])}
                    className="text-[10px] uppercase tracking-widest font-sans underline"
                  >
                    Detalles
                  </button>
                </div>
              </div>

              <div className="absolute inset-y-0 left-0 w-1/4 z-20" onClick={() => setActiveStoryIndex(prev => Math.max(0, prev - 1))} />
              <div className="absolute inset-y-0 right-0 w-1/4 z-20" onClick={() => setActiveStoryIndex(prev => (prev + 1) % renderedFilters.length)} />
            </div>
          </div>
        )}

        {/* GALERÍA MASONRY */}
        {activeTab === 'public' ? (
          renderedFilters.length === 0 ? (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-8 space-y-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="break-inside-avoid">
                  <div className="w-full rounded-2xl bg-[#FFB6C1]/20 dark:bg-neutral-800/40 animate-pulse relative overflow-hidden" style={{ height: `${200 + Math.random() * 200}px` }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="hidden md:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8 [column-rule:1px_solid_rgba(201,169,110,0.1)]">
              {renderedFilters.map((img, index) => {
                const isLiked = likedImages.has(img.id)
                const isVisible = visibleItems.has(img.id)
                
                const heightMap = {
                  'glossy': 'min-h-[320px]',
                  '3d': 'min-h-[420px]',
                  'minimal': 'min-h-[280px]',
                  'abstract': 'min-h-[380px]'
                }
                const heightClass = heightMap[img.sensory_category || 'glossy']

                const insertBanner = index > 0 && index % 8 === 0

                return (
                  <div key={img.id} className="break-inside-avoid mb-8">
                    {insertBanner && (
                      <div className="w-full rounded-3xl bg-gradient-to-br from-[#FF2A75] via-[#912aff] to-[#C9A96E] p-8 text-white relative overflow-hidden shadow-xl transition-all duration-500 hover:[transform:perspective(1000px)_rotateX(5deg)] group min-h-[320px] flex flex-col justify-between">
                        <div className="absolute -right-20 -top-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-black/10 rounded-full blur-2xl" />
                        <div className="space-y-3 relative z-10">
                          <span className="text-[8px] tracking-[0.3em] uppercase font-mono text-white/60 block">Edición Limitada</span>
                          <h3 className="font-serif text-2xl font-light tracking-wide leading-tight">
                            ¿Inspirado? <br className="hidden sm:block" />Reserva tu sesión
                          </h3>
                        </div>
                        <button className="w-fit px-6 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-[10px] font-sans tracking-[0.2em] uppercase font-medium border border-white/30 hover:bg-white hover:text-neutral-900 transition-all duration-300 relative z-10">
                          Agendar Cita ✦
                        </button>
                      </div>
                    )}

                    <div
                      data-id={img.id}
                      onClick={() => setSelectedImage(img)}
                      onMouseEnter={() => { setIsHoveringImage(true); setHoveredImageId(img.id); }}
                      onMouseLeave={() => { setIsHoveringImage(false); setHoveredImageId(null); }}
                      className={`scroll-reveal-item group relative ${heightClass} w-full rounded-2xl overflow-hidden cursor-none bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/20 dark:border-neutral-800/20 transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                        hoveredImageId === img.id ? 'scale-[1.02] z-30 shadow-2xl' : ''
                      } ${
                        hoveredImageId && hoveredImageId !== img.id ? 'brightness-50 blur-[2px] scale-[0.98]' : ''
                      } ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                      }`}
                    >
                      <img 
                        src={img.image_url} 
                        alt={img.title} 
                        className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105 select-none pointer-events-none" 
                        loading="lazy"
                      />
                      
                      <div className="absolute top-4 left-4 z-20 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md text-[8px] font-sans font-medium uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                        {img.sensory_category || 'Exclusivo'}
                      </div>

                      <div className="absolute top-4 right-4 flex items-center gap-1.5 text-white/60 text-[8px] font-mono bg-black/30 backdrop-blur-xs px-2 py-1 rounded-md">
                        <Eye className="w-3 h-3" />
                        {img.views || 0}
                      </div>

                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-[7px] tracking-[0.3em] uppercase text-white/40 font-mono">
                          ✦ Fresh Nails
                        </span>
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 flex flex-col justify-end">
                        <div className="flex items-end justify-between text-white">
                          <div className="min-w-0 pr-3">
                            <h3 className="font-serif text-sm tracking-wide truncate">{img.title}</h3>
                            <p className="text-[10px] text-neutral-300 font-light truncate mt-0.5">{img.client_name || 'Fresh Nails'}</p>
                            {img.price && (
                              <p className="text-[10px] font-mono text-[#C9A96E] mt-0.5">{img.price}</p>
                            )}
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleLike(img.id); }} 
                            className={`p-2 rounded-full backdrop-blur-md transition-all duration-300 ${
                              isLiked ? 'bg-[#FF2A75] text-white scale-110' : 'bg-white/20 text-white hover:bg-white/40'
                            } ${likedAnimating === img.id ? 'animate-pop' : ''}`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''} stroke-[1.5]`} />
                          </button>
                        </div>
                      </div>

                      {/* Badge de "Antes/Después" si tiene ambas imágenes */}
                      {img.before_image_url && img.after_image_url && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-[#FF2A75]/90 backdrop-blur-xs px-3 py-0.5 rounded-full text-[7px] font-sans font-medium uppercase tracking-widest text-white">
                          Antes / Después
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          /* HISTORIAL PRIVADO */
          clientImages.length === 0 ? (
            <div className="text-center py-24 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 max-w-md mx-auto space-y-3">
              <ImageIcon className="w-5 h-5 mx-auto text-neutral-400 dark:text-neutral-600 stroke-[1.2]" />
              <h3 className="text-xs font-sans tracking-wider uppercase font-medium">Historial Vacío</h3>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 font-light px-6">Conserva las imágenes de tus visitas para monitorear el cuidado de tus uñas.</p>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
              {clientImages.map((img) => (
                <div 
                  key={img.id} 
                  onClick={() => setSelectedImage(img)}
                  className="break-inside-avoid group relative rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border dark:border-neutral-800 cursor-zoom-in transition-transform duration-300 hover:scale-[1.02]"
                >
                  <img src={img.image_url} alt={img.title} className="w-full h-auto object-cover" />
                  <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] text-white font-mono">
                    {new Date(img.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* SLIDER ANTES/DESPUÉS DINÁMICO */}
        {activeTab === 'public' && renderedFilters.length > 0 && (
          <div className="space-y-4 pt-10 border-t border-neutral-200/50 dark:border-neutral-800/50">
            <div className="text-center space-y-1">
              <span className="text-[10px] text-[#C9A96E] uppercase font-sans tracking-[0.25em] block font-medium">✦ Demostración de Técnica ✦</span>
              <h2 className="font-serif text-2xl tracking-wide font-light">Efecto Revelador: Arquitectura de la Uña</h2>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 font-light">Arrastra el control deslizante para ver la transformación</p>
            </div>
            
            {(() => {
              // Buscar la primera imagen que tenga before y after
              const beforeAfterImage = renderedFilters.find(
                img => img.before_image_url && img.after_image_url
              )
              
              // Usar imágenes de la BD o por defecto
              const beforeImage = beforeAfterImage?.before_image_url || 
                "https://images.unsplash.com/photo-1632345031435-8797b2d58045?q=80&w=1200&auto=format&fit=crop"
              const afterImage = beforeAfterImage?.after_image_url || 
                "https://images.unsplash.com/photo-1604654894610-df490651e56c?q=80&w=1200&auto=format&fit=crop"
              
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
                  className="relative w-full max-w-3xl aspect-video mx-auto rounded-3xl overflow-hidden shadow-2xl bg-neutral-800 select-none cursor-ew-resize"
                >
                  {/* Lado Derecho: DESPUÉS */}
                  <div className="absolute inset-0">
                    <img 
                      src={afterImage}
                      alt="Después" 
                      className="w-full h-full object-cover pointer-events-none"
                    />
                    <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-md text-[10px] tracking-widest text-white uppercase font-sans font-light">Después</div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-white/5 text-8xl font-serif tracking-widest">✦</span>
                    </div>
                  </div>

                  {/* Lado Izquierdo: ANTES */}
                  <div 
                    className="absolute inset-y-0 left-0 overflow-hidden"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img 
                      src={beforeImage}
                      alt="Antes" 
                      className="absolute inset-y-0 left-0 w-full h-full object-cover max-w-none pointer-events-none"
                      style={{ width: sliderRef.current?.getBoundingClientRect().width }}
                    />
                    <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-md text-[10px] tracking-widest text-white uppercase font-sans font-light">Antes</div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-white/5 text-8xl font-serif tracking-widest">✦</span>
                    </div>
                  </div>

                  {/* Línea Divisoria */}
                  <div 
                    className="absolute inset-y-0 w-[2px] -translate-x-1/2 pointer-events-none z-30"
                    style={{ 
                      left: `${sliderPosition}%`,
                      backgroundColor: '#C9A96E',
                      boxShadow: '0 0 20px #FF2A75, 0 0 40px #FF2A75'
                    }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-neutral-900 border-2 border-[#C9A96E] dark:border-neutral-700 shadow-2xl flex items-center justify-center text-xs font-light text-neutral-500 transition-all duration-300 hover:scale-110">
                      <span className="text-[10px]">↔</span>
                    </div>
                  </div>
                  
                  {/* Información del diseño */}
                  {beforeAfterImage && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full text-[10px] text-white/80 font-sans tracking-wider flex items-center gap-4">
                      <span>{beforeAfterImage.title}</span>
                      <span className="text-[#C9A96E]">{beforeAfterImage.price}</span>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

      </div>

      {/* LIGHTBOX */}
      {selectedImage && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in overflow-y-auto transition-colors duration-300 ${
            isDark ? 'bg-neutral-950/98' : 'bg-[#f5e6d3]/95'
          }`}
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)} 
            className={`absolute top-6 right-6 p-2 hover:scale-110 transition-transform z-50 rounded-full ${
              isDark ? 'text-neutral-200 hover:bg-neutral-800' : 'text-neutral-800 hover:bg-white/50'
            }`}
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>

          <div 
            className={`rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 animate-scale-up ${
              isDark ? 'bg-neutral-900' : 'bg-white'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="relative aspect-square w-full bg-[#FDFBF7] dark:bg-neutral-950 overflow-hidden group">
              <img 
                src={selectedImage.image_url} 
                alt={selectedImage.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-zoom-in" 
              />
              <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-xs px-2 py-1 rounded text-[8px] text-white/60 font-mono flex items-center gap-1">
                <ZoomIn className="w-3 h-3" /> Zoom
              </div>
            </div>

            <div className={`p-8 flex flex-col justify-between space-y-6 ${
              isDark ? 'text-neutral-100' : 'text-neutral-900'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[9px] font-sans font-medium tracking-[0.25em] uppercase px-3 py-1 rounded-md ${
                    isDark ? 'bg-neutral-800 text-[#C9A96E]' : 'bg-[#f5e6d3] text-[#C9A96E]'
                  }`}>
                    {selectedImage.sensory_category || 'Exclusivo'}
                  </span>
                  <span className="text-[9px] font-sans font-light text-neutral-400 dark:text-neutral-500 tracking-wider">
                    {new Date(selectedImage.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="font-serif text-2xl md:text-3xl font-light tracking-wide">
                  {selectedImage.title}
                </h3>
                <div className="h-[1px] w-12 bg-[#C9A96E]" />
                
                {selectedImage.description && (
                  <p className={`text-xs font-sans font-light leading-relaxed ${
                    isDark ? 'text-neutral-400' : 'text-neutral-500'
                  }`}>
                    {selectedImage.description}
                  </p>
                )}

                <div className={`pt-4 space-y-3 font-sans text-xs border-t ${
                  isDark ? 'border-neutral-800' : 'border-neutral-100'
                }`}>
                  <div className="flex justify-between">
                    <span className="text-neutral-400 dark:text-neutral-500 font-light">Esmaltado/Sistema:</span>
                    <span className="font-medium">{selectedImage.polish_used || 'Fresh Nails Premium Finish'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400 dark:text-neutral-500 font-light">Especialista:</span>
                    <span className="font-medium">Fresh Nails Master Staff</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400 dark:text-neutral-500 font-light">Visualizaciones:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {selectedImage.views || 0}
                    </span>
                  </div>
                  {selectedImage.before_image_url && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400 dark:text-neutral-500 font-light">Antes/Después:</span>
                      <span className="font-medium text-[#C9A96E]">✓ Disponible</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={`pt-6 border-t flex items-center justify-between gap-4 ${
                isDark ? 'border-neutral-800' : 'border-neutral-100'
              }`}>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase text-neutral-400 dark:text-neutral-500 font-sans tracking-widest">Inversión Look</span>
                  <span className="text-2xl font-mono font-medium text-[#FF2A75]">{selectedImage.price || '$45.00'}</span>
                </div>
                <button 
                  onClick={() => { setSelectedImage(null); alert('Redireccionando al agendamiento oficial...'); }}
                  className="px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full text-xs uppercase font-sans tracking-widest font-medium hover:bg-[#FF2A75] dark:hover:bg-[#FF2A75] hover:text-white dark:hover:text-white transition-all duration-300 flex items-center gap-2 shadow-md"
                >
                  <Calendar className="w-3.5 h-3.5 stroke-[1.2]" /> Reservar Hora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SUBIDA CON TODOS LOS CAMPOS */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className={`w-full max-w-lg rounded-3xl overflow-hidden p-6 space-y-4 shadow-2xl border max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-[#FDFBF7] border-neutral-200'
          }`}>
            
            <div className={`flex items-center justify-between border-b pb-2 sticky top-0 ${
              isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-[#FDFBF7]'
            }`}>
              <span className="text-xs font-sans font-medium tracking-widest uppercase text-[#C9A96E]">Publicar Nuevo Look</span>
              <button onClick={() => setShowUploadModal(false)} className={`p-1 ${
                isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-400 hover:text-neutral-600'
              }`}>
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            {/* Título */}
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block font-sans">Nombre del Diseño *</label>
              <input 
                type="text" 
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Ej: Glossy Chrome Effect" 
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-[#C9A96E] text-sm ${
                  isDark ? 'bg-neutral-950 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
                }`}
              />
            </div>

            {/* Descripción */}
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block font-sans">Descripción</label>
              <textarea 
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Detalles del esmaltado, técnicas usadas..." 
                rows={2}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-[#C9A96E] resize-none text-sm ${
                  isDark ? 'bg-neutral-950 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
                }`}
              />
            </div>

            {/* Imagen PRINCIPAL (Resultado Final) */}
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block font-sans">Imagen Final (Resultado) *</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-4 text-center cursor-pointer min-h-[100px] flex flex-col items-center justify-center relative overflow-hidden transition-colors ${
                  isDark ? 'border-neutral-700 hover:bg-neutral-800' : 'border-neutral-300 hover:bg-neutral-50'
                }`}
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
                  <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="space-y-1">
                    <Camera className="w-5 h-5 mx-auto text-neutral-400 dark:text-neutral-600 stroke-[1.2]" />
                    <p className={`text-xs font-light ${
                      isDark ? 'text-neutral-500' : 'text-neutral-500'
                    }`}>Subir foto del resultado final</p>
                  </div>
                )}
              </div>
            </div>

            {/* Imagen de ANTES (Opcional) */}
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block font-sans">Imagen de Antes (Opcional)</label>
              <div 
                onClick={() => beforeInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-4 text-center cursor-pointer min-h-[80px] flex flex-col items-center justify-center relative overflow-hidden transition-colors ${
                  isDark ? 'border-neutral-700 hover:bg-neutral-800' : 'border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <input 
                  ref={beforeInputRef}
                  type="file" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadBeforeFile(e.target.files[0])
                      const reader = new FileReader()
                      reader.onload = (event) => setUploadBeforePreview(event.target?.result as string)
                      reader.readAsDataURL(e.target.files[0])
                    }
                  }} 
                  className="hidden" 
                  accept="image/*" 
                />
                {uploadBeforePreview ? (
                  <img src={uploadBeforePreview} alt="Antes Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="space-y-1">
                    <Camera className="w-4 h-4 mx-auto text-neutral-400 dark:text-neutral-600 stroke-[1.2]" />
                    <p className={`text-[10px] font-light ${
                      isDark ? 'text-neutral-500' : 'text-neutral-500'
                    }`}>Subir foto antes del tratamiento</p>
                  </div>
                )}
              </div>
            </div>

            {/* Precio */}
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block font-sans">Precio</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-sans">$</span>
                <input 
                  type="number" 
                  value={uploadPrice}
                  onChange={(e) => setUploadPrice(e.target.value)}
                  placeholder="45.00" 
                  step="0.01"
                  min="0"
                  className={`w-full pl-7 pr-3 py-2 rounded-lg border focus:outline-none focus:border-[#C9A96E] text-sm ${
                    isDark ? 'bg-neutral-950 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
                  }`}
                />
              </div>
            </div>

            {/* Esmaltado usado */}
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block font-sans">Productos/Esmaltados Usados</label>
              <input 
                type="text" 
                value={uploadPolish}
                onChange={(e) => setUploadPolish(e.target.value)}
                placeholder="Ej: OPI Neon Pink + Chrome Powder" 
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-[#C9A96E] text-sm ${
                  isDark ? 'bg-neutral-950 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
                }`}
              />
            </div>

            {/* Categoría Sensorial */}
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block font-sans">Categoría Sensorial</label>
              <select 
                value={uploadCategory} 
                onChange={(e) => setUploadCategory(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none text-sm ${
                  isDark ? 'bg-neutral-950 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
                }`}
              >
                <option value="glossy">✨ Efecto Glossy</option>
                <option value="3d">💎 Textura 3D</option>
                <option value="minimal">🌿 Minimalismo</option>
                <option value="abstract">🎨 Arte Abstracto</option>
              </select>
            </div>

            {uploadStatus.type && (
              <div className={`p-2.5 rounded-lg text-[10px] text-center font-sans animate-slide-down ${
                uploadStatus.type === 'success' 
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300' 
                  : 'bg-red-50 dark:bg-red-950/30 text-red-500'
              }`}>
                {uploadStatus.message}
              </div>
            )}

            <button
              type="button"
              disabled={uploading}
              onClick={handleUpload}
              className="w-full py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-sans tracking-widest text-xs uppercase font-medium rounded-lg hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              {uploading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? 'Publicando...' : 'Publicar en Portfolio'}
            </button>

          </div>
        </div>
      )}

    </div>
  )
}

export function SidebarGalleryWidget() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return (
    <div className={`p-4 rounded-xl border text-xs font-sans font-light shadow-xs space-y-2 transition-colors duration-300 ${
      isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200/40'
    }`}>
      <div className="flex items-center gap-1.5 text-[#FF2A75] font-medium tracking-wide">
        <Sparkles className="w-3.5 h-3.5" /> Universo Fresh Nails
      </div>
      <p className={`leading-relaxed text-[11px] ${
        isDark ? 'text-neutral-400' : 'text-neutral-500'
      }`}>
        Explora el porfolio interactivo de alta costura y mantén al día tu bitácora privada de cuidado.
      </p>
    </div>
  )
}