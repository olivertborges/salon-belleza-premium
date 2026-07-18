'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Heart, 
  X, 
  Sparkles, 
  Loader,     
  Calendar,
  Eye,
  Maximize2,
  Quote
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
  sensory_category?: 'glossy' | '3d' | 'minimal' | 'abstract'
  polish_used?: string
  price?: string | number
  views?: number
  before_image_url?: string | null
  after_image_url?: string | null
}

const PREMIUM_TESTIMONIALS = [
  {
    id: 't1',
    name: 'Valeria Mendoza',
    service: 'Esculturales 3D Jelly',
    text: 'Una experiencia religiosa para mis manos. El nivel de detalle y la atmósfera minimalista del salón te hacen sentir en un oasis de lujo.'
  },
  {
    id: 't2',
    name: 'Camila Rossi',
    service: 'Minimalist Fine Art',
    text: 'Buscaba trazos perfectos y limpieza absoluta. Fresh Nails superó cualquier expectativa. Es arte real sobre tus uñas.'
  }
]

export default function GaleriaPage() {
  const { user } = useAuth()

  // Control de hidratación para Next.js
  const [mounted, setMounted] = useState(false)

  // Estados principales
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'public' | 'personal'>('public')
  const [sensoryFilter, setSensoryFilter] = useState<'all' | 'glossy' | '3d' | 'minimal' | 'abstract'>('all')

  // Datos
  const [publicImages, setPublicImages] = useState<GalleryImage[]>([])
  const [clientImages, setClientImages] = useState<GalleryImage[]>([])
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set())

  // Control de Slider Antes/Después
  const sliderRef = useRef<HTMLDivElement>(null)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDraggingSlider, setIsDraggingSlider] = useState(false)

  // Lightbox & Modal
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  // Forzar que el cliente esté montado antes de calcular fechas locales
  useEffect(() => {
    setMounted(true)
  }, [])

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
          const { data: personalPhotos } = await supabase
            .from('client_gallery')
            .select('*')
            .eq('client_id', cliente.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })

          if (personalPhotos) setClientImages(personalPhotos)
        }
      }

      const { data: publicPhotos } = await supabase
        .from('client_gallery')
        .select('*')
        .eq('is_active', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(30)

      if (publicPhotos) {
        const mappedPublic = publicPhotos.map((photo: any) => ({
          ...photo,
          client_name: photo.client_name || (!photo.client_id ? 'Fresh Nails Master' : 'Client Look'),
          likes: photo.likes ?? 0,
          views: photo.views ?? 0,
          sensory_category: photo.sensory_category || 'minimal',
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

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
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

  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }

  const filteredImages = publicImages.filter(
    img => sensoryFilter === 'all' || img.sensory_category === sensoryFilter
  )

  // Formateador seguro para evitar errores en servidores SSR
  const formatDate = (dateString: string) => {
    if (!mounted) return '—'
    try {
      return new Date(dateString).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch {
      return '—'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center gap-5">
        <Loader className="w-5 h-5 text-neutral-400 animate-spin stroke-[1]" />
        <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 font-light">
          Cargando Espacio Visual
        </span>
      </div>
    )
  }

  const featuredBeforeAfter = publicImages.find(img => img.before_image_url && img.after_image_url)

  return (
    <div className="bg-[#FAF8F5] text-neutral-800 min-h-screen selection:bg-neutral-200 selection:text-neutral-900 transition-colors duration-500 font-sans antialiased">
      
      {/* SECCIÓN HERO MINIMALISTA */}
      <header className="max-w-7xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-24 text-center space-y-6">
        <div className="space-y-3">
          <span className="text-[9px] text-neutral-400 tracking-[0.5em] uppercase font-medium block">
            — Handcrafted Perfection
          </span>
          <h1 className="text-4xl md:text-7xl font-extralight tracking-tight text-neutral-900 font-serif lowercase leading-tight">
            el porfolio <span className="font-serif italic font-light text-neutral-400">fresh</span>
          </h1>
        </div>
        <p className="text-neutral-500 text-xs md:text-sm tracking-[0.15em] font-light max-w-lg mx-auto leading-relaxed">
          Un archivo visual dedicado a la alta costura en uñas, el minimalismo estricto y la salud del diseño.
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-32 space-y-24">
        
        {/* FILTROS Y TABS ESTILO EDITORIAL */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-neutral-200/80 pb-6 gap-6">
          <div className="flex gap-8 text-xs tracking-[0.2em] uppercase font-light">
            <button 
              onClick={() => setActiveTab('public')}
              className={`pb-6 relative transition-all duration-300 ${activeTab === 'public' ? 'text-neutral-900 font-medium' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              Colección Global
              {activeTab === 'public' && <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-neutral-900" />}
            </button>
            <button 
              onClick={() => setActiveTab('personal')}
              className={`pb-6 relative transition-all duration-300 ${activeTab === 'personal' ? 'text-neutral-900 font-medium' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              Bitácora Privada ({clientImages.length})
              {activeTab === 'personal' && <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-neutral-900" />}
            </button>
          </div>

          {activeTab === 'public' && (
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { id: 'all', label: 'Ver Todo' },
                { id: 'glossy', label: 'Glossy Finish' },
                { id: '3d', label: '3D Textures' },
                { id: 'minimal', label: 'Strict Minimal' },
                { id: 'abstract', label: 'Fine Art' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setSensoryFilter(btn.id as any)}
                  className={`px-4 py-1.5 rounded-full text-[11px] tracking-wider font-light transition-all duration-300 border ${
                    sensoryFilter === btn.id 
                      ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs' 
                      : 'bg-transparent border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-800'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CONTENIDO PRINCIPAL */}
        {activeTab === 'public' ? (
          <div className="space-y-24">
            
            {/* CUADRÍCULA DE ARTE EDITORIAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
              {filteredImages.map((img, index) => {
                const isLiked = likedImages.has(img.id)
                
                // Inserción orgánica de testimonios cada 3 imágenes
                const showTestimonial = index > 0 && index % 3 === 0
                const testimonialIndex = Math.floor(index / 3) % PREMIUM_TESTIMONIALS.length
                const testimonial = PREMIUM_TESTIMONIALS[testimonialIndex]

                return (
                  <div key={img.id} className="space-y-12">
                    {showTestimonial && (
                      <div className="bg-[#F3EFEA] p-8 md:p-10 rounded-2xl space-y-6 flex flex-col justify-between aspect-square border border-neutral-200/40">
                        <Quote className="w-8 h-8 text-neutral-300 stroke-[1]" />
                        <p className="font-serif italic text-lg text-neutral-700 leading-relaxed font-light">
                          "{testimonial.text}"
                        </p>
                        <div>
                          <h4 className="text-xs font-medium tracking-widest uppercase text-neutral-900">{testimonial.name}</h4>
                          <span className="text-[10px] text-neutral-400 tracking-wider mt-1 block">{testimonial.service}</span>
                        </div>
                      </div>
                    )}

                    {/* TARJETA DE IMAGEN */}
                    <div 
                      onClick={() => setSelectedImage(img)}
                      className="group block cursor-pointer space-y-4"
                    >
                      <div className="relative aspect-[4/5] w-full bg-[#F3EFEA] rounded-xl overflow-hidden transition-all duration-700 ease-out group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)]">
                        <img 
                          src={img.image_url} 
                          alt={img.title} 
                          className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-[1.2s] ease-out group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-neutral-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 z-10">
                          <div className="p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg text-neutral-900 hover:bg-white hover:scale-105 transition-all">
                            <Maximize2 className="w-3.5 h-3.5 stroke-[1.5]" />
                          </div>
                        </div>
                      </div>

                      {/* PIE DE FOTO */}
                      <div className="flex items-start justify-between px-1">
                        <div className="space-y-1 max-w-[80%]">
                          <h3 className="font-serif text-lg font-light text-neutral-900 group-hover:text-neutral-600 transition-colors">
                            {img.title}
                          </h3>
                          <div className="flex items-center gap-3 text-[10px] tracking-wider text-neutral-400 font-light">
                            <span>{img.client_name}</span>
                            <span>•</span>
                            <span className="uppercase text-[9px] tracking-[0.15em] text-[#C9A96E] font-medium">{img.sensory_category}</span>
                          </div>
                        </div>

                        <button 
                          onClick={(e) => handleLike(img.id, e)}
                          className={`p-2 rounded-full transition-colors ${isLiked ? 'text-neutral-900' : 'text-neutral-300 hover:text-neutral-500'}`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-neutral-900 text-neutral-900' : ''} stroke-[1.2]`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* SECCIÓN SLIDER ANTES/DESPUÉS */}
            <div className="bg-[#F3EFEA] rounded-2xl p-8 md:p-16 border border-neutral-200/60 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-4 space-y-6">
                <span className="text-[9px] text-[#C9A96E] uppercase font-mono tracking-[0.3em] font-medium block">Technical Analysis</span>
                <h2 className="font-serif text-3xl md:text-4xl tracking-tight text-neutral-900 font-light leading-tight">
                  La arquitectura del set perfecto.
                </h2>
                <p className="text-xs text-neutral-500 leading-relaxed font-light">
                  Desliza el control interactivo para apreciar la alineación, el balance del ápice y la limpieza impecable de la cutícula antes y después del esculpido.
                </p>
                {featuredBeforeAfter && (
                  <div className="pt-4 border-t border-neutral-300/40 space-y-1">
                    <div className="text-xs font-medium text-neutral-800">{featuredBeforeAfter.title}</div>
                    <div className="text-[11px] text-neutral-400 font-mono">{featuredBeforeAfter.price} — Master Finish</div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-8 w-full">
                <div 
                  ref={sliderRef}
                  onMouseMove={(e) => isDraggingSlider && handleSliderMove(e.clientX)}
                  onTouchMove={(e) => isDraggingSlider && e.touches[0] && handleSliderMove(e.touches[0].clientX)}
                  onMouseDown={() => setIsDraggingSlider(true)}
                  onTouchStart={() => setIsDraggingSlider(true)}
                  onMouseUp={() => setIsDraggingSlider(false)}
                  onTouchEnd={() => setIsDraggingSlider(false)}
                  onMouseLeave={() => setIsDraggingSlider(false)}
                  className="relative aspect-[16/10] w-full max-w-2xl mx-auto rounded-xl overflow-hidden bg-neutral-200 select-none cursor-ew-resize border border-neutral-300/40"
                >
                  <img 
                    src={featuredBeforeAfter?.after_image_url || "https://images.unsplash.com/photo-1604654894610-df490651e56c?q=80&w=1200"}
                    alt="Resultado Final" 
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute bottom-4 right-4 bg-neutral-900/80 backdrop-blur-xs px-3 py-1 rounded text-[9px] tracking-[0.2em] text-white uppercase font-light">Después</div>

                  <div 
                    className="absolute inset-y-0 left-0 overflow-hidden"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img 
                      src={featuredBeforeAfter?.before_image_url || "https://images.unsplash.com/photo-1632345031435-8797b2d58045?q=80&w=1200"}
                      alt="Estado Inicial" 
                      className="absolute inset-y-0 left-0 w-full h-full object-cover max-w-none pointer-events-none"
                      style={{ width: sliderRef.current?.getBoundingClientRect().width }}
                    />
                    <div className="absolute bottom-4 left-4 bg-neutral-900/80 backdrop-blur-xs px-3 py-1 rounded text-[9px] tracking-[0.2em] text-white uppercase font-light">Antes</div>
                  </div>

                  <div 
                    className="absolute inset-y-0 w-[1px] -translate-x-1/2 pointer-events-none z-30 bg-neutral-400"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-neutral-300 shadow-sm flex items-center justify-center text-[10px] text-neutral-400 transition-transform duration-300 hover:scale-110">
                      ||
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* BITÁCORA PRIVADA */
          clientImages.length === 0 ? (
            <div className="text-center py-24 max-w-md mx-auto space-y-4 border border-dashed border-neutral-200 rounded-xl">
              <span className="text-xs font-light uppercase tracking-widest text-neutral-400 block">Sin registros activos</span>
              <p className="text-xs text-neutral-500 font-light px-8 leading-relaxed">
                Aquí se resguardará la bitácora de salud y estética de tus manos. Las fotos se sincronizarán de manera automática tras tu sesión en cabina.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {clientImages.map((img) => (
                <div 
                  key={img.id} 
                  onClick={() => setSelectedImage(img)}
                  className="group cursor-zoom-in space-y-2"
                >
                  <div className="aspect-square w-full rounded-lg overflow-hidden bg-neutral-100">
                    <img src={img.image_url} alt={img.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102" />
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono block">
                    {formatDate(img.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* LIGHTBOX DETALLES INMERSIVO */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-[#FAF8F5]/98 backdrop-blur-md overflow-y-auto"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)} 
            className="absolute top-8 right-8 p-3 text-neutral-400 hover:text-neutral-900 transition-colors z-50 rounded-full hover:bg-neutral-100"
          >
            <X className="w-5 h-5 stroke-[1]" />
          </button>

          <div 
            className="bg-white rounded-2xl shadow-xl max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 overflow-hidden border border-neutral-200/60"
            onClick={e => e.stopPropagation()}
          >
            <div className="md:col-span-7 bg-[#F3EFEA] aspect-square md:aspect-auto md:h-[70vh] overflow-hidden">
              <img 
                src={selectedImage.image_url} 
                alt={selectedImage.title} 
                className="w-full h-full object-cover" 
              />
            </div>

            <div className="md:col-span-5 p-8 md:p-12 flex flex-col justify-between space-y-8 bg-white">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-medium tracking-[0.2em] uppercase bg-[#F3EFEA] text-neutral-600 px-2.5 py-1 rounded">
                    {selectedImage.sensory_category}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {formatDate(selectedImage.created_at)}
                  </span>
                </div>

                <h3 className="font-serif text-2xl md:text-3xl text-neutral-900 font-light tracking-tight leading-tight">
                  {selectedImage.title}
                </h3>

                {selectedImage.description && (
                  <p className="text-xs font-light leading-relaxed text-neutral-500">
                    {selectedImage.description}
                  </p>
                )}

                <div className="pt-6 space-y-3 font-sans text-xs border-t border-neutral-100 text-neutral-600">
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-light">Esmaltado base:</span>
                    <span className="font-normal text-neutral-900">{selectedImage.polish_used || 'Fresh Nails Premium'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-light">Especialista:</span>
                    <span className="font-normal text-neutral-900">Master Staff</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-light">Métricas de interés:</span>
                    <span className="font-normal text-neutral-900 flex items-center gap-1 font-mono">
                      <Eye className="w-3 h-3 stroke-[1.5]" /> {selectedImage.views || 12}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-100 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase text-neutral-400 tracking-widest font-medium">Inversión set</span>
                  <span className="text-xl font-mono text-neutral-900 mt-1">{selectedImage.price || '$45.00'}</span>
                </div>
                <button 
                  onClick={() => { setSelectedImage(null); alert('Redireccionando al agendamiento oficial...'); }}
                  className="px-6 py-3 bg-neutral-900 text-white rounded-lg text-xs uppercase tracking-widest font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5 stroke-[1.5]" /> Reservar Cita
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
