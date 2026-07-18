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
  Upload,
  ArrowRight,
  ArrowLeft,
  Eye
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
  views?: number
  before_image_url?: string | null
  after_image_url?: string | null
  dominant_color?: string
  sensory_category?: string
}

export default function GaleriaPage() {
  const { user, tenantId } = useAuth()
  
  // Refs para interactividad y cursor
  const containerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados de datos (Lógica Supabase Intacta)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<GalleryImage[]>([])
  const [clientId, setClientId] = useState<string | null>(null)
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set())

  // Estados de la experiencia cinematográfica
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [cursorType, setCursorType] = useState<'default' | 'view'>('default')
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  // Auto-play pausado cuando no hay actividad del ratón
  const autoplayTimer = useRef<NodeJS.Timeout | null>(null)
  const [isAutoplayActive, setIsAutoplayActive] = useState(false)

  // Coordenadas del cursor personalizado
  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (!cursorRef.current) return
      cursorRef.current.style.transform = `translate3d(${e.clientX - 16}px, ${e.clientY - 16}px, 0)`
      resetAutoplayTimer()
    }
    window.addEventListener('mousemove', moveCursor)
    return () => window.removeEventListener('mousemove', moveCursor)
  }, [])

  // Temporizador para activar Auto-Play sutil si el usuario se queda quieto
  const resetAutoplayTimer = () => {
    setIsAutoplayActive(false)
    if (autoplayTimer.current) clearTimeout(autoplayTimer.current)
    autoplayTimer.current = setTimeout(() => {
      if (selectedIdx === null) setIsAutoplayActive(true)
    }, 5000)
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isAutoplayActive && images.length > 0) {
      interval = setInterval(() => {
        // Desplazamiento orgánico simulando un carrusel vivo
        const container = containerRef.current
        if (container) {
          container.scrollBy({ left: 300, behavior: 'smooth' })
          if (container.scrollLeft + container.clientWidth >= container.scrollHeight) {
            container.scrollTo({ left: 0, behavior: 'smooth' })
          }
        }
      }, 3500)
    }
    return () => clearInterval(interval)
  }, [isAutoplayActive, images])

  // Carga de datos de Supabase original
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const { data, error } = await supabase
          .from('client_gallery')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        
        // Inyectamos colores dominantes estéticos por si no existen en tu DB para el efecto Blur-up
        const adaptiveColors = ['#EAE3DB', '#D2C9BF', '#E8DCC4', '#C3B091', '#E3D7FF', '#D1E8E2']
        const formatted = (data || []).map((img, i) => ({
          ...img,
          dominant_color: img.dominant_color || adaptiveColors[i % adaptiveColors.length],
          client_name: img.client_name || 'Fresh Nails Atelier',
          likes: img.likes || 0,
          views: img.views || 0
        }))
        setImages(formatted)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchGallery()
    resetAutoplayTimer()
    return () => { if (autoplayTimer.current) clearTimeout(autoplayTimer.current) }
  }, [user])

  // Efecto Onda expansiva (Ripple) al hacer clic
  const handleScreenClick = (e: React.MouseEvent) => {
    const newRipple = { id: Date.now(), x: e.clientX, y: e.clientY }
    setRipples(prev => [...prev, newRipple])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 600)
  }

  // Teclado activo para navegación de cine
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIdx === null) return
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'Escape') setSelectedIdx(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIdx, images])

  const handleNext = () => {
    if (selectedIdx !== null && images.length > 0) {
      setSelectedIdx((selectedIdx + 1) % images.length)
    }
  }

  const handlePrev = () => {
    if (selectedIdx !== null && images.length > 0) {
      setSelectedIdx((selectedIdx - 1 + images.length) % images.length)
    }
  }

  const handleLike = async (e: React.MouseEvent, id: string, index: number) => {
    e.stopPropagation()
    const nextLikes = new Set(likedImages)
    let updatedLikes = images[index].likes || 0

    if (nextLikes.has(id)) {
      nextLikes.delete(id)
      updatedLikes = Math.max(0, updatedLikes - 1)
    } else {
      nextLikes.add(id)
      updatedLikes += 1
    }
    setLikedImages(nextLikes)
    
    const updatedImages = [...images]
    updatedImages[index].likes = updatedLikes
    setImages(updatedImages)

    // Sincronización en segundo plano con Supabase
    await supabase.from('client_gallery').update({ likes: updatedLikes }).eq('id', id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-neutral-950 flex flex-col items-center justify-center gap-4">
        <Loader className="w-5 h-5 text-neutral-800 dark:text-neutral-200 animate-spin stroke-[1]" />
        <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 font-mono">Iniciando Teatro Visual...</p>
      </div>
    )
  }

  return (
    <div 
      onClick={handleScreenClick}
      className="min-h-screen bg-[#FAF9F5] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-700 relative overflow-x-hidden select-none cursor-none"
    >
      {/* 7. CURSOR PERSONALIZADO INTELIGENTE */}
      <div 
        ref={cursorRef}
        className={`fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-50 transition-all duration-300 border border-neutral-900/40 dark:border-white/40 flex items-center justify-center bg-white/10 backdrop-blur-xs mix-blend-difference ${
          cursorType === 'view' ? 'scale-[2.2] bg-neutral-900/20' : 'scale-100'
        }`}
      >
        {cursorType === 'view' && <span className="text-[5px] tracking-widest text-white uppercase font-bold font-sans">Ver</span>}
      </div>

      {/* RIPPLES (ONDAS EXPANSIVAS) */}
      {ripples.map(r => (
        <span 
          key={r.id} 
          style={{ left: r.x, top: r.y }} 
          className="fixed w-3 h-3 bg-neutral-900/10 dark:bg-white/10 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-[ping_0.6s_cubic-bezier(0.1,0.8,0.3,1)_1] z-50"
        />
      ))}

      {/* ENCABEZADO EDITORIAL CON MÁRGENES GENEROSOS */}
      <header className="max-w-7xl mx-auto px-8 pt-24 pb-12 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] tracking-[0.4em] uppercase text-neutral-400 font-bold block">Lookbook de Autor</span>
            <h1 className="text-4xl md:text-6xl font-light font-serif tracking-wide leading-none">
              Fresh Nails <br /><span className="italic font-normal text-neutral-400">Atelier</span>
            </h1>
          </div>
          <p className="text-xs text-neutral-400 font-light max-w-xs leading-relaxed uppercase tracking-wider">
            Diseños orgánicos libres de la rigidez geométrica convencional.
          </p>
        </div>
      </header>

      {/* 1. DISEÑO "SIN CUADRÍCULA" (Mosaico fluido asimétrico con espacios generosos) */}
      <main 
        ref={containerRef}
        className="max-w-7xl mx-auto px-6 md:px-12 pb-32 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-x-8 gap-y-20 items-start"
      >
        {images.map((img, idx) => {
          const isHovered = hoveredId === img.id
          const isLoaded = loadedImages.has(img.id)

          // Asignación de columnas asimétrica matemática pura para romper la rigidez
          const gridClasses = [
            'md:col-span-4 mt-0',
            'md:col-span-5 md:mt-12',
            'md:col-span-3 mt-0',
            'md:col-span-6 md:mt-[-4rem]',
            'md:col-span-3 mt-4',
            'md:col-span-3 md:mt-16'
          ][idx % 6]

          // Rotaciones sutiles aleatorias basadas en el índice (Regla 1)
          const customRotation = [
            'hover:rotate-0 rotate-1',
            'hover:rotate-0 -rotate-1',
            'hover:rotate-0 rotate-2',
            'hover:rotate-0 -rotate-2',
            'hover:rotate-0 rotate-0'
          ][idx % 5]

          return (
            <motion.div
              key={img.id}
              className={`${gridClasses} relative group`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, delay: (idx % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }} // 2. Revelado al hacer scroll en cascada
              onMouseEnter={() => { setHoveredId(img.id); setCursorType('view'); }}
              onMouseLeave={() => { setHoveredId(null); setCursorType('default'); }}
              onClick={() => setSelectedIdx(idx)}
            >
              {/* Contenedor de Imagen de Autor */}
              <div className={`relative w-full overflow-hidden rounded-2xl shadow-xs transition-transform duration-700 ease-[0.16,1,0.3,1] ${customRotation}`}>
                
                {/* 6. CARGA INTELIGENTE (Placeholder con Color Dominante + Blur-up) */}
                <div 
                  style={{ backgroundColor: img.dominant_color }}
                  className={`w-full aspect-[4/5] transition-opacity duration-1000 ${isLoaded ? 'opacity-0 absolute inset-0' : 'opacity-100 animate-pulse'}`}
                />

                {/* 2. Zoom con sentido y sutil cambio de brillo en Hover */}
                <img 
                  src={img.image_url} 
                  alt={img.title}
                  onLoad={() => setLoadedImages(prev => new Set([...prev, img.id]))}
                  className={`w-full aspect-[4/5] object-cover transition-all duration-[1.5s] cubic-bezier(0.16, 1, 0.3, 1) ${
                    isHovered ? 'scale-105 brightness-95' : 'scale-100'
                  } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                />

                {/* 5. EFECTO "POLAROID" (Icono de interacción emerge volando en hover) */}
                <button 
                  onClick={(e) => handleLike(e, img.id, idx)}
                  className={`absolute bottom-4 right-4 p-3 rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md shadow-xs text-neutral-900 dark:text-white border border-neutral-200/20 transition-all duration-500 transform ${
                    isHovered ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-75'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${likedImages.has(img.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
              </div>

              {/* 5. INFORMACIÓN FLOTANTE (Subrayado autodisegnable en Hover) */}
              <div className="mt-4 space-y-1 px-1">
                <h3 className="font-serif text-lg tracking-wide text-neutral-800 dark:text-neutral-100 relative inline-block">
                  {img.title}
                  <span className={`absolute bottom-0 left-0 h-[1px] bg-neutral-900 dark:bg-white transition-all duration-500 ${isHovered ? 'w-full' : 'w-0'}`} />
                </h3>
                <div className="flex items-center justify-between text-[10px] tracking-wider text-neutral-400 uppercase font-mono">
                  <span>Por {img.client_name}</span>
                  <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> {img.views}</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </main>

      {/* 3. TRANSICIONES DE CINE (Fondo con Oscurecimiento + Desenfoque en vivo Blur) */}
      <AnimatePresence>
        {selectedIdx !== null && (
          <motion.div 
            className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setSelectedIdx(null)}
            onMouseEnter={() => setCursorType('default')}
          >
            {/* BOTÓN CERRAR */}
            <button 
              onClick={() => setSelectedIdx(null)}
              className="absolute top-6 right-6 p-3 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 z-50"
            >
              <X className="w-4 h-4" />
            </button>

            {/* CONTENEDOR FLUIDO CINEMATOGRÁFICO */}
            <div className="w-full max-w-5xl h-full flex items-center justify-center relative">
              
              {/* 4. NAVEGACIÓN INVISIBLE PERO INTUITIVA (Click en laterales) */}
              <div 
                className="absolute left-0 inset-y-0 w-1/4 z-30 cursor-none flex items-center justify-start p-4 group/nav"
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              >
                <div className="p-3 bg-white/5 border border-white/10 rounded-full text-white/40 group-hover/nav:text-white group-hover/nav:bg-white/10 transition-all opacity-0 group-hover/nav:opacity-100">
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </div>

              <div 
                className="absolute right-0 inset-y-0 w-1/4 z-30 cursor-none flex items-center justify-end p-4 group/nav"
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
              >
                <div className="p-3 bg-white/5 border border-white/10 rounded-full text-white/40 group-hover/nav:text-white group-hover/nav:bg-white/10 transition-all opacity-0 group-hover/nav:opacity-100">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* 3. Expansión Física Fluida con Framer Motion */}
              <motion.div 
                key={selectedIdx}
                className="bg-neutral-900 text-white rounded-3xl overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 shadow-2xl border border-white/10 relative z-20 h-auto md:max-h-[80vh]"
                initial={{ scale: 0.93, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.93, y: 20, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Imagen del Cine-Modal */}
                <div className="relative aspect-square md:aspect-auto md:h-full bg-neutral-950 flex items-center">
                  <img 
                    src={images[selectedIdx].image_url} 
                    alt={images[selectedIdx].title} 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* 4. CONTADOR MINIMALISTA EN LA ESQUINA */}
                  <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-mono tracking-widest text-white/90 uppercase border border-white/10">
                    {String(selectedIdx + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
                  </div>
                </div>

                {/* Ficha Editorial Descriptiva */}
                <div className="p-8 sm:p-12 flex flex-col justify-between bg-neutral-900 space-y-6 overflow-y-auto">
                  <div className="space-y-4">
                    <span className="text-[9px] tracking-[0.25em] font-bold text-neutral-500 uppercase block">Diseño Seleccionado</span>
                    <h2 className="font-serif text-3xl font-light tracking-wide">{images[selectedIdx].title}</h2>
                    {images[selectedIdx].description && (
                      <p className="text-xs font-light leading-relaxed text-neutral-400 bg-black/20 p-4 rounded-xl border border-white/5">
                        {images[selectedIdx].description}
                      </p>
                    )}
                  </div>

                  <div className="pt-6 border-t border-white/10 flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">Autor del Arte</span>
                      <span className="text-sm font-light text-neutral-200">{images[selectedIdx].client_name}</span>
                    </div>
                    <button 
                      onClick={(e) => handleLike(e, images[selectedIdx].id, selectedIdx)}
                      className="px-5 py-3 bg-white text-neutral-900 rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-200 transition-colors flex items-center gap-2"
                    >
                      <Heart className={`w-3.5 h-3.5 ${likedImages.has(images[selectedIdx].id) ? 'fill-current text-red-500' : ''}`} /> 
                      Inspiración ({images[selectedIdx].likes})
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
