'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  X, 
  Loader,     
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
  dominant_color?: string
}

export default function GaleriaPage() {
  const { user, tenantId } = useAuth()
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)

  // Estados de datos
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState<GalleryImage[]>([])
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set())

  // Estados de la experiencia cinematográfica (NUEVOS)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [cursorType, setCursorType] = useState<'default' | 'view' | 'next'>('default')
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [isAutoplayActive, setIsAutoplayActive] = useState(false)
  const autoplayTimer = useRef<NodeJS.Timeout | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // 7. CURSOR PERSONALIZADO
  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      resetAutoplayTimer()
    }
    window.addEventListener('mousemove', moveCursor)
    return () => window.removeEventListener('mousemove', moveCursor)
  }, [])

  // Auto-play pausado (NUEVO)
  const resetAutoplayTimer = () => {
    setIsAutoplayActive(false)
    if (autoplayTimer.current) clearTimeout(autoplayTimer.current)
    autoplayTimer.current = setTimeout(() => {
      if (selectedIdx === null) setIsAutoplayActive(true)
    }, 5000)
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isAutoplayActive && images.length > 1) {
      interval = setInterval(() => {
        const container = containerRef.current
        if (container) {
          const scrollAmount = container.scrollLeft + 400
          if (scrollAmount >= container.scrollWidth - container.clientWidth) {
            container.scrollTo({ left: 0, behavior: 'smooth' })
          } else {
            container.scrollBy({ left: 400, behavior: 'smooth' })
          }
        }
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [isAutoplayActive, images])

  // Carga de datos
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const { data, error } = await supabase
          .from('client_gallery')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        
        const colors = ['#F5F0EB', '#EBE4DC', '#F0E8DD', '#E8DDD2', '#F2EBE6', '#E5DDD5']
        const formatted = (data || []).map((img, i) => ({
          ...img,
          dominant_color: img.dominant_color || colors[i % colors.length],
          client_name: img.client_name || 'Fresh Nails',
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
  }, [])

  // 3. NAVEGACIÓN POR TECLADO (NUEVO)
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

  // 5. ONDA EXPANSIVA (RIPPLE) (NUEVO)
  const handleScreenClick = (e: React.MouseEvent) => {
    const newRipple = { 
      id: Date.now(), 
      x: e.clientX, 
      y: e.clientY 
    }
    setRipples(prev => [...prev, newRipple])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 700)
  }

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

    await supabase.from('client_gallery').update({ likes: updatedLikes }).eq('id', id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-neutral-950 flex flex-col items-center justify-center gap-4">
        <Loader className="w-5 h-5 text-neutral-800 dark:text-neutral-200 animate-spin stroke-[1]" />
        <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 font-mono">Cargando galería...</p>
      </div>
    )
  }

  return (
    <div 
      onClick={handleScreenClick}
      className="min-h-screen bg-[#FAF9F5] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-700 relative overflow-x-hidden select-none cursor-none"
    >
      {/* 7. CURSOR PERSONALIZADO (NUEVO) */}
      <div 
        ref={cursorRef}
        style={{ 
          left: mousePosition.x - 16, 
          top: mousePosition.y - 16 
        }}
        className={`fixed w-8 h-8 rounded-full pointer-events-none z-[999] transition-all duration-200 border flex items-center justify-center ${
          cursorType === 'view' 
            ? 'scale-[2.5] bg-white/10 border-white/60' 
            : cursorType === 'next'
            ? 'scale-[1.5] bg-white/20 border-white/40'
            : 'scale-100 bg-transparent border-white/30'
        }`}
      >
        {cursorType === 'view' && (
          <span className="text-[6px] tracking-[0.15em] text-white uppercase font-bold">Ver</span>
        )}
        {cursorType === 'next' && (
          <ArrowRight className="w-4 h-4 text-white" />
        )}
      </div>

      {/* 5. RIPPLES (ONDAS EXPANSIVAS) (NUEVO) */}
      {ripples.map(r => (
        <span 
          key={r.id} 
          style={{ left: r.x, top: r.y }} 
          className="fixed w-6 h-6 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 z-[998] border border-white/30 animate-[ping_0.7s_ease-out_1]"
        />
      ))}

      {/* ENCABEZADO */}
      <header className="max-w-7xl mx-auto px-8 pt-24 pb-12 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] tracking-[0.4em] uppercase text-neutral-400 font-bold block">Galería</span>
            <h1 className="text-4xl md:text-6xl font-light font-serif tracking-wide leading-none">
              Fresh Nails <br /><span className="italic font-normal text-neutral-400">Atelier</span>
            </h1>
          </div>
          <p className="text-xs text-neutral-400 font-light max-w-xs leading-relaxed uppercase tracking-wider">
            {images.length} obras · Diseño orgánico
          </p>
        </div>
      </header>

      {/* 1. DISEÑO MOSAICO ASIMÉTRICO (NUEVO) */}
      <main 
        ref={containerRef}
        className="max-w-7xl mx-auto px-6 md:px-12 pb-32 columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-8 space-y-8"
      >
        {images.map((img, idx) => {
          const isHovered = hoveredId === img.id
          const isLoaded = loadedImages.has(img.id)
          
          // Alturas aleatorias para efecto orgánico
          const heights = ['h-[500px]', 'h-[400px]', 'h-[600px]', 'h-[450px]', 'h-[550px]', 'h-[380px]']
          const heightClass = heights[idx % heights.length]

          // Rotaciones sutiles
          const rotations = ['rotate-1', '-rotate-1', 'rotate-2', '-rotate-2', 'rotate-0']
          const rotation = rotations[idx % rotations.length]

          return (
            <motion.div
              key={img.id}
              className={`break-inside-avoid relative group cursor-none ${rotation}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                duration: 0.7, 
                delay: (idx % 4) * 0.08, 
                ease: [0.16, 1, 0.3, 1] 
              }}
              onMouseEnter={() => { 
                setHoveredId(img.id)
                setCursorType('view')
              }}
              onMouseLeave={() => { 
                setHoveredId(null)
                setCursorType('default')
              }}
              onClick={() => setSelectedIdx(idx)}
            >
              <div className={`relative w-full ${heightClass} overflow-hidden rounded-2xl shadow-sm transition-transform duration-700`}>
                
                {/* 6. CARGA INTELIGENTE CON COLOR DOMINANTE (NUEVO) */}
                <div 
                  style={{ backgroundColor: img.dominant_color }}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    isLoaded ? 'opacity-0' : 'opacity-100 animate-pulse'
                  }`}
                />

                {/* 2. ZOOM Y BRILLO EN HOVER (NUEVO) */}
                <img 
                  src={img.image_url} 
                  alt={img.title}
                  onLoad={() => setLoadedImages(prev => new Set([...prev, img.id]))}
                  className={`w-full h-full object-cover transition-all duration-[1.8s] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isHovered ? 'scale-110 brightness-90' : 'scale-100'
                  } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                />

                {/* 5. EFECTO POLAROID (NUEVO) */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent transition-opacity duration-500 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* 5. INFORMACIÓN FLOTANTE CON SUBRAYADO (NUEVO) */}
                <div className={`absolute bottom-0 left-0 right-0 p-6 text-white transition-all duration-500 transform ${
                  isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}>
                  <h3 className="font-serif text-xl tracking-wide relative inline-block">
                    {img.title}
                    <span className={`absolute bottom-0 left-0 h-[2px] bg-white transition-all duration-700 ${
                      isHovered ? 'w-full' : 'w-0'
                    }`} />
                  </h3>
                  <p className="text-[10px] tracking-[0.15em] uppercase opacity-70 font-mono mt-1">
                    {img.client_name}
                  </p>
                </div>

                {/* Botón Like flotante */}
                <button 
                  onClick={(e) => handleLike(e, img.id, idx)}
                  className={`absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur-md shadow-lg transition-all duration-500 transform ${
                    isHovered ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${
                    likedImages.has(img.id) ? 'fill-red-500 text-red-500' : 'text-neutral-700'
                  }`} />
                </button>

                {/* Contador de vistas */}
                <div className={`absolute top-4 left-4 flex items-center gap-1.5 text-white/80 text-[9px] font-mono tracking-wider transition-all duration-500 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}>
                  <Eye className="w-3 h-3" />
                  {img.views}
                </div>
              </div>
            </motion.div>
          )
        })}
      </main>

      {/* 3. MODAL CINEMATOGRÁFICO (NUEVO COMPLETAMENTE) */}
      <AnimatePresence>
        {selectedIdx !== null && images[selectedIdx] && (
          <motion.div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => setSelectedIdx(null)}
          >
            {/* Botón cerrar */}
            <button 
              onClick={() => setSelectedIdx(null)}
              className="absolute top-6 right-6 p-3 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 z-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full max-w-6xl h-full flex items-center justify-center relative">
              
              {/* 4. NAVEGACIÓN LATERAL INVISIBLE (NUEVO) */}
              <div 
                className="absolute left-0 inset-y-0 w-1/3 z-30 flex items-center justify-start p-4 group/nav cursor-none"
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                onMouseEnter={() => setCursorType('next')}
                onMouseLeave={() => setCursorType('default')}
              >
                <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-white/40 group-hover/nav:text-white group-hover/nav:bg-white/10 transition-all opacity-0 group-hover/nav:opacity-100 -translate-x-4 group-hover/nav:translate-x-0">
                  <ArrowLeft className="w-5 h-5" />
                </div>
              </div>

              <div 
                className="absolute right-0 inset-y-0 w-1/3 z-30 flex items-center justify-end p-4 group/nav cursor-none"
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                onMouseEnter={() => setCursorType('next')}
                onMouseLeave={() => setCursorType('default')}
              >
                <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-white/40 group-hover/nav:text-white group-hover/nav:bg-white/10 transition-all opacity-0 group-hover/nav:opacity-100 translate-x-4 group-hover/nav:translate-x-0">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>

              {/* 3. EXPANSIÓN FLUIDA (NUEVO) */}
              <motion.div 
                key={selectedIdx}
                className="bg-neutral-900 rounded-3xl overflow-hidden max-w-5xl w-full grid grid-cols-1 lg:grid-cols-5 shadow-2xl border border-white/10 relative z-20"
                initial={{ scale: 0.92, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.92, y: 30, opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.8 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Imagen */}
                <div className="lg:col-span-3 relative bg-neutral-950 flex items-center justify-center min-h-[400px] lg:min-h-[600px]">
                  <img 
                    src={images[selectedIdx].image_url} 
                    alt={images[selectedIdx].title} 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* 4. CONTADOR MINIMALISTA (NUEVO) */}
                  <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-mono tracking-[0.2em] text-white/80 border border-white/10">
                    {String(selectedIdx + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
                  </div>
                </div>

                {/* Ficha descriptiva */}
                <div className="lg:col-span-2 p-8 lg:p-10 flex flex-col justify-between bg-neutral-900 min-h-[300px]">
                  <div className="space-y-6">
                    <div>
                      <span className="text-[9px] tracking-[0.25em] font-bold text-neutral-500 uppercase block mb-2">
                        Obra
                      </span>
                      <h2 className="font-serif text-2xl lg:text-3xl font-light tracking-wide text-white">
                        {images[selectedIdx].title}
                      </h2>
                    </div>
                    
                    {images[selectedIdx].description && (
                      <div className="bg-white/5 p-5 rounded-xl border border-white/5">
                        <p className="text-sm font-light leading-relaxed text-neutral-300">
                          {images[selectedIdx].description}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-6 text-xs text-neutral-500">
                      <span className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        {images[selectedIdx].views} vistas
                      </span>
                      <span className="flex items-center gap-2">
                        <Heart className={`w-4 h-4 ${
                          likedImages.has(images[selectedIdx].id) ? 'fill-red-500 text-red-500' : ''
                        }`} />
                        {images[selectedIdx].likes} inspiraciones
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] uppercase font-bold text-neutral-500 tracking-wider block">
                        Artista
                      </span>
                      <span className="text-sm font-light text-neutral-200">
                        {images[selectedIdx].client_name}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => handleLike(e, images[selectedIdx].id, selectedIdx)}
                      className="px-6 py-3 bg-white text-neutral-900 rounded-xl text-[10px] uppercase tracking-[0.15em] font-bold hover:bg-neutral-200 transition-all flex items-center gap-2"
                    >
                      <Heart className={`w-4 h-4 ${
                        likedImages.has(images[selectedIdx].id) ? 'fill-current text-red-500' : ''
                      }`} /> 
                      Inspirar
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