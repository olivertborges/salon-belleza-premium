'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Heart, 
  X, 
  Loader,     
  Calendar,
  Sparkles,
  Columns,
  ChevronRight,
  Maximize2
} from 'lucide-react'

interface GalleryImage {
  id: string
  image_url: string
  title: string
  description: string
  is_active: boolean
  is_public: boolean
  created_at: string
  client_name?: string
  sensory_category?: 'glossy' | '3d' | 'minimal' | 'abstract'
  polish_used?: string
  price?: string | number
}

export default function GaleriaInnovadoraPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  
  // Datos originales
  const [allImages, setAllImages] = useState<GalleryImage[]>([])
  
  // Estado de favoritos y el comparador interactivo de pantalla dividida
  const [favorites, setFavorites] = useState<GalleryImage[]>([])
  const [compareMode, setCompareMode] = useState(false)
  const [slotA, setSlotA] = useState<GalleryImage | null>(null)
  const [slotB, setSlotB] = useState<GalleryImage | null>(null)

  // Lightbox clásico de detalle
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  useEffect(() => {
    loadGalleryData()
  }, [user])

  const loadGalleryData = async () => {
    setLoading(true)
    try {
      const { data: publicPhotos } = await supabase
        .from('client_gallery')
        .select('*')
        .eq('is_active', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (publicPhotos) {
        const mapped = publicPhotos.map((photo: any) => ({
          ...photo,
          client_name: photo.client_name || 'Fresh Master',
          sensory_category: photo.sensory_category || 'minimal',
          price: photo.price ? `$${photo.price}` : '$45.00'
        }))
        setAllImages(mapped)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCompare = (img: GalleryImage) => {
    if (!slotA) {
      setSlotA(img)
      setCompareMode(true)
    } else if (!slotB && slotA.id !== img.id) {
      setSlotB(img)
      setCompareMode(true)
    } else {
      // Si ambos están llenos, desplaza el primero
      setSlotA(slotB)
      setSlotB(img)
    }
  }

  const toggleFavorite = (img: GalleryImage) => {
    setFavorites(prev => 
      prev.some(f => f.id === img.id) ? prev.filter(f => f.id !== img.id) : [...prev, img]
    )
  }

  // Agrupamos dinámicamente para las colecciones deslizables horizontales
  const categories = {
    minimal: allImages.filter(i => i.sensory_category === 'minimal'),
    '3d': allImages.filter(i => i.sensory_category === '3d'),
    glossy: allImages.filter(i => i.sensory_category === 'glossy'),
    abstract: allImages.filter(i => i.sensory_category === 'abstract'),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center gap-4">
        <Loader className="w-5 h-5 text-neutral-600 animate-spin" />
        <span className="text-[10px] tracking-[0.4em] uppercase text-neutral-500 font-light">Iniciando Exhibición</span>
      </div>
    )
  }

  return (
    <div className="bg-[#0B0B0B] text-neutral-200 min-h-screen pb-32 font-sans antialiased overflow-x-hidden">
      
      {/* GLOW DE AMBIENTE INMERSIVO */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-neutral-900/40 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute top-[40vh] right-0 w-[300px] h-[400px] bg-neutral-800/20 rounded-full filter blur-[100px] pointer-events-none" />

      {/* HEADER TIPO MUSEO DIGITAL */}
      <header className="max-w-7xl mx-auto px-6 pt-24 pb-12 space-y-4 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-500 font-medium">Atelier Experiential Canvas</span>
        </div>
        <h1 className="text-4xl md:text-7xl font-light font-serif tracking-tight text-white lowercase">
          diseño <span className="italic text-neutral-600">vanguardia</span>
        </h1>
        <p className="text-neutral-500 text-xs tracking-wider max-w-md font-light">
          Desliza lateralmente para explorar. Toca el ícono de columnas <Columns className="w-3 h-3 inline mx-1 text-neutral-400" /> en cualquier pieza para llevarla al estudio de comparación en tiempo real.
        </p>
      </header>

      {/* SECCIÓN DE CAROUSELS HORIZONTALES INMERSIVOS */}
      <main className="space-y-16 pl-6 md:pl-16 relative z-10">
        {Object.entries(categories).map(([categoryName, images]) => {
          if (images.length === 0) return null
          return (
            <div key={categoryName} className="space-y-4">
              {/* Título de la colección */}
              <div className="flex items-center justify-between pr-6 md:pr-16 border-b border-neutral-900 pb-3">
                <h2 className="text-sm font-light tracking-[0.3em] uppercase text-neutral-400 flex items-center gap-2">
                  <span>//</span> {categoryName === '3d' ? 'Escultural 3D' : categoryName === 'minimal' ? 'Pure Minimal' : categoryName === 'glossy' ? 'Ultra Glossy' : 'Fine Art'}
                </h2>
                <span className="text-[10px] text-neutral-600 font-mono flex items-center gap-1">
                  {images.length} piezas <ChevronRight className="w-3 h-3" />
                </span>
              </div>

              {/* Contenedor deslizable nativo y fluido */}
              <div className="flex gap-6 overflow-x-auto pr-6 md:pr-16 pt-2 pb-6 scrollbar-none snap-x snap-mandatory">
                {images.map((img) => {
                  const isFav = favorites.some(f => f.id === img.id)
                  return (
                    <div 
                      key={img.id}
                      className="w-[280px] md:w-[380px] shrink-0 snap-start space-y-4 group relative"
                    >
                      {/* Envoltura de la Imagen con Aspect Ratio de Revista */}
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] bg-neutral-900 border border-neutral-900/60 shadow-2xl">
                        <img 
                          src={img.image_url} 
                          alt={img.title} 
                          className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
                          loading="lazy"
                        />
                        
                        {/* Gradiente oscuro */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 opacity-80" />

                        {/* Controles interactivos flotantes rápidos */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                          <button 
                            onClick={() => toggleFavorite(img)}
                            className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white transition-all hover:scale-110 active:scale-95"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-neutral-300'}`} />
                          </button>
                          <button 
                            onClick={() => handleAddToCompare(img)}
                            className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white transition-all hover:scale-110 active:scale-95"
                            title="Añadir a comparación"
                          >
                            <Columns className={`w-3.5 h-3.5 ${slotA?.id === img.id || slotB?.id === img.id ? 'text-amber-400' : 'text-neutral-300'}`} />
                          </button>
                        </div>

                        {/* Detalles de la Obra en la base de la foto */}
                        <div className="absolute bottom-6 left-6 right-6 space-y-2">
                          <p className="text-[10px] font-mono text-neutral-400">{img.client_name}</p>
                          <h3 className="font-serif text-2xl italic text-white leading-tight font-light">{img.title}</h3>
                          <div className="pt-2 flex items-center justify-between border-t border-white/10">
                            <span className="text-xs font-mono text-neutral-300">{img.price}</span>
                            <button 
                              onClick={() => setSelectedImage(img)}
                              className="text-[9px] uppercase tracking-widest text-neutral-400 flex items-center gap-1 hover:text-white"
                            >
                              Detalles <Maximize2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </main>

      {/* COMPARADOR DE PANTALLA DIVIDIDA */}
      {compareMode && (
        <div className="fixed inset-0 z-50 bg-[#070707] flex flex-col animate-in fade-in duration-300">
          {/* Cabecera del Comparador */}
          <div className="p-4 md:p-6 border-b border-neutral-900 flex items-center justify-between bg-[#0B0B0B]">
            <div>
              <h3 className="text-xs uppercase tracking-widest font-semibold text-white">Laboratorio de Estilo</h3>
              <p className="text-[10px] text-neutral-500">Inspecciona y compara las texturas lado a lado para decidir</p>
            </div>
            <button 
              onClick={() => setCompareMode(false)}
              className="p-3 bg-neutral-900 rounded-full text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Área de Pantalla Dividida */}
          <div className="flex-1 grid grid-cols-2 bg-black h-full relative">
            
            {/* Slot de Imagen Izquierda */}
            <div className="relative border-r border-neutral-900 h-full bg-neutral-950 flex items-center justify-center overflow-hidden">
              {slotA ? (
                <>
                  <img src={slotA.image_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md p-3 rounded-xl max-w-[85%]">
                    <p className="text-[11px] font-serif italic text-white truncate">{slotA.title}</p>
                    <p className="text-[9px] font-mono text-neutral-400 mt-0.5">{slotA.price}</p>
                  </div>
                  <button onClick={() => setSlotA(null)} className="absolute top-4 left-4 p-2 bg-black/40 text-white rounded-full"><X className="w-3 h-3" /></button>
                </>
              ) : (
                <div className="text-center p-4 space-y-2">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Lado A Vacío</p>
                  <p className="text-[9px] text-neutral-700 max-w-[120px] mx-auto">Cierra esta vista y toca el icono flotante de una foto para mandarla aquí.</p>
                </div>
              )}
            </div>

            {/* Slot de Imagen Derecha */}
            <div className="relative h-full bg-neutral-950 flex items-center justify-center overflow-hidden">
              {slotB ? (
                <>
                  <img src={slotB.image_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md p-3 rounded-xl max-w-[85%]">
                    <p className="text-[11px] font-serif italic text-white truncate">{slotB.title}</p>
                    <p className="text-[9px] font-mono text-neutral-400 mt-0.5">{slotB.price}</p>
                  </div>
                  <button onClick={() => setSlotB(null)} className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full"><X className="w-3 h-3" /></button>
                </>
              ) : (
                <div className="text-center p-4 space-y-2">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Lado B Vacío</p>
                  <p className="text-[9px] text-neutral-700 max-w-[120px] mx-auto">Selecciona otro diseño de la galería para contrastar las diferencias.</p>
                </div>
              )}
            </div>
          </div>

          {/* Acciones de la parte inferior */}
          <div className="p-4 bg-[#0B0B0B] border-t border-neutral-900 flex items-center justify-between">
            <span className="text-[10px] text-neutral-500 font-light italic">¿Resolviste tu duda estética?</span>
            <button 
              onClick={() => { setCompareMode(false); alert('Aperturando agenda corporativa...'); }}
              className="px-5 py-3 bg-white text-black font-medium text-[10px] uppercase tracking-widest rounded-xl hover:bg-neutral-200 transition-colors"
              disabled={!slotA && !slotB}
            >
              Agendar con esta Selección
            </button>
          </div>
        </div>
      )}

      {/* BOTÓN FLOTANTE PERMANENTE CUANDO HAY ELEMENTOS */}
      {(slotA || slotB) && !compareMode && (
        <button 
          onClick={() => setCompareMode(true)}
          className="fixed bottom-6 right-6 z-40 bg-white text-black px-4 py-3 rounded-full flex items-center gap-2 shadow-2xl transition-transform hover:scale-105 active:scale-95 text-[11px] tracking-wider uppercase font-medium"
        >
          <Columns className="w-3.5 h-3.5" />
          Comparar Laboratorio ({slotA ? 1 : 0} + {slotB ? 1 : 0})
        </button>
      )}

      {/* DETALLE LIGHTBOX */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="bg-[#0F0F0F] border border-neutral-900 rounded-[2rem] max-w-lg w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="aspect-square relative w-full bg-neutral-900">
              <img src={selectedImage.image_url} alt="" className="w-full h-full object-cover" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">{selectedImage.sensory_category}</span>
                <h4 className="text-xl font-serif text-white italic mt-1 font-light">{selectedImage.title}</h4>
                {selectedImage.description && <p className="text-xs text-neutral-400 font-light mt-2 leading-relaxed">{selectedImage.description}</p>}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-neutral-900">
                <div>
                  <p className="text-[9px] text-neutral-600 uppercase">Precio Estimado</p>
                  <p className="text-lg font-mono text-white mt-0.5">{selectedImage.price}</p>
                </div>
                <button 
                  onClick={() => { setSelectedImage(null); alert('Aperturando agenda corporativa...'); }}
                  className="px-4 py-2.5 bg-neutral-800 text-white hover:bg-neutral-700 transition-colors text-[10px] tracking-wider uppercase font-medium rounded-lg"
                >
                  Reservar este Look
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
