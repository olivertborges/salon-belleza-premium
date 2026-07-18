'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Heart, 
  X, 
  Loader,     
  Calendar,
  Eye,
  Maximize2,
  Quote,
  Sparkles,
  Layers
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
    text: 'Una experiencia religiosa para mis manos. El nivel de detalle y el ambiente te aíslan en un oasis de lujo.'
  },
  {
    id: 't2',
    name: 'Camila Rossi',
    service: 'Minimalist Fine Art',
    text: 'Buscaba trazos perfectos y limpieza absoluta. Es arte real sobre tus uñas, un deleite visual.'
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
  
  // Bandeja Interactiva de Favoritos (Moodboard de la clienta)
  const [favorites, setFavorites] = useState<GalleryImage[]>([])
  const [showMoodboard, setShowMoodboard] = useState(false)

  // Control de Slider Antes/Después
  const sliderRef = useRef<HTMLDivElement>(null)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDraggingSlider, setIsDraggingSlider] = useState(false)

  // Lightbox
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

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

  const toggleFavorite = (img: GalleryImage, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorites(prev => {
      const exists = prev.find(item => item.id === img.id)
      if (exists) {
        return prev.filter(item => item.id !== img.id)
      } else {
        // Al agregar el primero, abrimos la bandeja automáticamente para sorprenderla
        if (prev.length === 0) setShowMoodboard(true)
        return [...prev, img]
      }
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
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center gap-5">
        <Loader className="w-5 h-5 text-neutral-400 animate-spin stroke-[1]" />
        <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 font-light">
          Diseñando la Experiencia...
        </span>
      </div>
    )
  }

  const featuredBeforeAfter = publicImages.find(img => img.before_image_url && img.after_image_url)

  return (
    <div className="bg-[#FAF9F6] text-neutral-800 min-h-screen relative font-sans antialiased selection:bg-neutral-200">
      
      {/* TEXTURA DE PAPEL PREMIUM FLOTANTE */}
      <div className="fixed inset-0 opacity-[0.025] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')] z-50" />

      {/* CABECERA EDITORIAL */}
      <header className="max-w-7xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-24 text-center space-y-6 relative z-10">
        <div className="space-y-3">
          <span className="text-[9px] text-[#C9A96E] tracking-[0.6em] uppercase font-semibold block">
            A Sensory Exhibition
          </span>
          <h1 className="text-5xl md:text-8xl font-extralight tracking-tight text-neutral-900 font-serif lowercase leading-none">
            curaduría <span className="font-serif italic font-light text-neutral-400">fresh</span>
          </h1>
        </div>
        <p className="text-neutral-500 text-xs md:text-sm tracking-[0.15em] font-light max-w-xl mx-auto leading-relaxed">
          Presiona el corazón en tus diseños favoritos para crear tu propio Moodboard interactivo y comparar tu próximo estilo.
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-40 space-y-24 relative z-10">
        
        {/* NAVEGACIÓN Y FILTROS */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-neutral-200/80 pb-6 gap-6">
          <div className="flex gap-8 text-xs tracking-[0.2em] uppercase font-light">
            <button 
              onClick={() => setActiveTab('public')}
              className={`pb-6 relative transition-all duration-300 ${activeTab === 'public' ? 'text-neutral-900 font-medium' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              Colección de Arte
              {activeTab === 'public' && <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-neutral-900" />}
            </button>
            <button 
              onClick={() => setActiveTab('personal')}
              className={`pb-6 relative transition-all duration-300 ${activeTab === 'personal' ? 'text-neutral-900 font-medium' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              Tu Historial ({clientImages.length})
              {activeTab === 'personal' && <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-neutral-900" />}
            </button>
          </div>

          {activeTab === 'public' && (
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { id: 'all', label: 'Ver Todo' },
                { id: 'glossy', label: 'Ultra Glossy' },
                { id: '3d', label: 'Escultural 3D' },
                { id: 'minimal', label: 'Pure Minimal' },
                { id: 'abstract', label: 'Fine Art' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setSensoryFilter(btn.id as any)}
                  className={`px-4 py-2 rounded-full text-[11px] tracking-wider font-light transition-all duration-500 border ${
                    sensoryFilter === btn.id 
                      ? 'bg-neutral-900 border-neutral-900 text-white shadow-lg shadow-neutral-900/10' 
                      : 'bg-white border-neutral-200/80 text-neutral-500 hover:border-neutral-400 hover:text-neutral-800'
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
            
            {/* LIVING BENTO GRID: Estructura asimétrica premium estilo revista */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {filteredImages.map((img, index) => {
                const isFavorite = favorites.some(fav => fav.id === img.id)
                
                // Distribución asimétrica de proporciones según el índice para dar dinamismo
                const isLargeCard = index % 4 === 0

                return (
                  <div 
                    key={img.id} 
                    className={`space-y-4 flex flex-col justify-between ${isLargeCard ? 'md:col-span-2 lg:col-span-2' : ''}`}
                  >
                    {/* CONTENEDOR DE IMAGEN INMERSIVA */}
                    <div 
                      onClick={() => setSelectedImage(img)}
                      className="group relative w-full overflow-hidden rounded-2xl bg-neutral-100 transition-all duration-700 hover:shadow-[0_30px_60px_rgba(0,0,0,0.04)] cursor-pointer"
                      style={{ aspectRatio: isLargeCard ? '16/10' : '4/5' }}
                    >
                      <img 
                        src={img.image_url} 
                        alt={img.title} 
                        className="w-full h-full object-cover transition-transform duration-[2.5s] cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-105"
                        loading="lazy"
                      />
                      
                      {/* Velo Cinematográfico gradiente */}
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Información flotante fluida */}
                      <div className="absolute bottom-6 left-6 right-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-3 group-hover:translate-y-0 flex items-end justify-between z-10">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase tracking-[0.2em] text-[#C9A96E] font-medium">{img.sensory_category}</span>
                          <h3 className="font-serif text-2xl italic font-light leading-none">{img.title}</h3>
                        </div>
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white">
                          <Maximize2 className="w-3.5 h-3.5 stroke-[1.5]" />
                        </div>
                      </div>

                      {/* Botón corazón de guardado rápido */}
                      <button 
                        onClick={(e) => toggleFavorite(img, e)}
                        className="absolute top-6 right-6 p-3 rounded-full bg-white/80 backdrop-blur-md text-neutral-800 transition-all duration-300 shadow-xs hover:scale-110 z-20"
                      >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-neutral-400'}`} />
                      </button>
                    </div>

                    {/* PIE DE TARJETA MINIMAL */}
                    <div className="flex items-center justify-between px-2 pt-1">
                      <div>
                        <h4 className="text-sm font-medium text-neutral-900">{img.title}</h4>
                        <span className="text-[11px] text-neutral-400 font-light">{img.client_name}</span>
                      </div>
                      <span className="text-xs font-mono text-neutral-400">{img.price}</span>
                    </div>
                  </div>
                )
              })}

              {/* TESTIMONIO EMBEBIDO COMO PIEZA DE ARTE TEXTUAL */}
              <div className="bg-[#F3EFEA] p-8 md:p-12 rounded-2xl flex flex-col justify-between aspect-square md:aspect-auto border border-neutral-200/40 lg:col-span-1">
                <Quote className="w-8 h-8 text-neutral-300 stroke-[1]" />
                <p className="font-serif italic text-xl text-neutral-700 leading-relaxed font-light">
                  "{PREMIUM_TESTIMONIALS[0].text}"
                </p>
                <div>
                  <h4 className="text-xs font-medium tracking-widest uppercase text-neutral-900">{PREMIUM_TESTIMONIALS[0].name}</h4>
                  <span className="text-[10px] text-neutral-400 tracking-wider mt-1 block">{PREMIUM_TESTIMONIALS[0].service}</span>
                </div>
              </div>
            </div>

            {/* SECCIÓN SLIDER ANTES/DESPUÉS PREMIUM */}
            {featuredBeforeAfter && (
              <div className="bg-[#F3EFEA] rounded-2xl p-6 md:p-16 border border-neutral-200/60 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-4 space-y-6">
                  <span className="text-[9px] text-[#C9A96E] uppercase font-mono tracking-[0.3em] font-medium block">Visual Anatomy</span>
                  <h2 className="font-serif text-3xl md:text-4xl tracking-tight text-neutral-900 font-light leading-tight">
                    La ingeniería detrás del cambio.
                  </h2>
                  <p className="text-xs text-neutral-500 leading-relaxed font-light">
                    Desliza interactivamente para inspeccionar la simetría de la estructura, el balance y la perfección en la limpieza antes y después.
                  </p>
                  <div className="pt-4 border-t border-neutral-300/40 space-y-1">
                    <div className="text-xs font-medium text-neutral-800">{featuredBeforeAfter.title}</div>
                    <div className="text-[11px] text-neutral-400 font-mono">{featuredBeforeAfter.price} — Atelier Finish</div>
                  </div>
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
                      src={featuredBeforeAfter.after_image_url || ""}
                      alt="Resultado" 
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                    <div className="absolute bottom-4 right-4 bg-neutral-900/80 backdrop-blur-xs px-3 py-1 rounded text-[9px] tracking-[0.2em] text-white uppercase font-light">Después</div>

                    <div 
                      className="absolute inset-y-0 left-0 overflow-hidden"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      <img 
                        src={featuredBeforeAfter.before_image_url || ""}
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
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-neutral-300 shadow-lg flex items-center justify-center text-[10px] text-neutral-400 transition-transform duration-300 hover:scale-110">
                        ||
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* TU HISTORIAL PRIVADO */
          clientImages.length === 0 ? (
            <div className="text-center py-24 max-w-md mx-auto space-y-4 border border-dashed border-neutral-200 rounded-xl bg-white">
              <span className="text-xs font-light uppercase tracking-widest text-neutral-400 block">Tu espacio exclusivo</span>
              <p className="text-xs text-neutral-500 font-light px-8 leading-relaxed">
                Aquí se guardará el registro fotográfico de la salud y estética de tus uñas. Tus fotos se sincronizarán de manera automática tras tu cita.
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
                  <div className="aspect-square w-full rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/40">
                    <img src={img.image_url} alt={img.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
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

      {/* BANDEJA DE EXPERIENCIA: MOODBOARD DE COMPARACIÓN FLOTANTE */}
      {favorites.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl transition-all duration-500 ease-in-out">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-neutral-200/60 p-4 space-y-4">
            
            {/* Encabezado de la bandeja */}
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowMoodboard(!showMoodboard)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-900 rounded-lg text-white">
                  <Layers className="w-3.5 h-3.5 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold tracking-wider uppercase text-neutral-900">Tu Moodboard Creativo</h4>
                  <p className="text-[10px] text-neutral-400">{favorites.length} {favorites.length === 1 ? 'diseño seleccionado' : 'diseños para comparar'}</p>
                </div>
              </div>
              <button className="text-xs text-neutral-500 underline font-light tracking-wider uppercase text-[10px]">
                {showMoodboard ? 'Minimizar' : 'Expandir y Comparar'}
              </button>
            </div>

            {/* Carrusel Deslizable de Comparación */}
            {showMoodboard && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                  {favorites.map((img) => (
                    <div 
                      key={img.id}
                      className="relative w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-neutral-100 shrink-0 snap-start border border-neutral-200/60 group"
                      onClick={() => setSelectedImage(img)}
                    >
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFavorites(prev => prev.filter(item => item.id !== img.id)) }}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-black transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400 font-light italic">¿Lista para tu cambio de look?</span>
                  <button 
                    onClick={() => alert('Redireccionando a la agenda con tus favoritos vinculados...')}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-[10px] uppercase tracking-widest font-medium hover:bg-neutral-800 transition-colors shadow-xs"
                  >
                    Reservar con estos Estilos
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIGHTBOX INMERSIVO (MODAL) */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-[#FAF9F6]/98 backdrop-blur-xl transition-all duration-500"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)} 
            className="absolute top-6 right-6 p-3 text-neutral-400 hover:text-neutral-900 transition-colors z-50 rounded-full hover:bg-neutral-100"
          >
            <X className="w-5 h-5 stroke-[1]" />
          </button>

          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 overflow-hidden border border-neutral-200/60"
            onClick={e => e.stopPropagation()}
          >
            <div className="md:col-span-7 bg-[#F3EFEA] aspect-square md:aspect-auto md:h-[75vh] overflow-hidden">
              <img 
                src={selectedImage.image_url} 
                alt={selectedImage.title} 
                className="w-full h-full object-cover" 
              />
            </div>

            <div className="md:col-span-5 p-6 md:p-10 flex flex-col justify-between space-y-8 bg-white">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-medium tracking-[0.2em] uppercase bg-[#F3EFEA] text-neutral-600 px-2.5 py-1 rounded">
                    {selectedImage.sensory_category}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {formatDate(selectedImage.created_at)}
                  </span>
                </div>

                <h3 className="font-serif text-3xl text-neutral-900 font-light tracking-tight leading-none">
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
                    <span className="text-neutral-400 font-light">Autoría:</span>
                    <span className="font-normal text-neutral-900">{selectedImage.client_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-light">Métricas:</span>
                    <span className="font-normal text-neutral-900 flex items-center gap-1 font-mono">
                      <Eye className="w-3 h-3 stroke-[1.5]" /> {selectedImage.views || 14} visualizaciones
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-100 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase text-neutral-400 tracking-widest font-medium">Inversión Estimada</span>
                  <span className="text-xl font-mono text-neutral-900 mt-0.5">{selectedImage.price || '$45.00'}</span>
                </div>
                <button 
                  onClick={() => { setSelectedImage(null); alert('Redireccionando al agendamiento...'); }}
                  className="px-6 py-3 bg-neutral-900 text-white rounded-lg text-xs uppercase tracking-widest font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5 stroke-[1.5]" /> Agendar Look
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
