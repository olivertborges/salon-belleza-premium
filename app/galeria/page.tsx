'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, Heart, X, Sparkles, Image as ImageIcon,
  ArrowDown, Eye, ChevronLeft, ChevronRight,
  Grid, LayoutList, Calendar, Crown, Star
} from 'lucide-react'
import Link from 'next/link'

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
  source?: 'admin' | 'client'
  category?: string
}

export default function GaleriaPublicPage() {
  const { user, tenantId } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set())
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Lightbox
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getTenantId = useCallback(async (): Promise<string | null> => {
    if (tenantId) return tenantId
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null
    if (session.user.user_metadata?.tenant_id) return session.user.user_metadata.tenant_id
    if (session.user.app_metadata?.tenant_id) return session.user.app_metadata.tenant_id

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

  const loadGallery = useCallback(async () => {
    setLoading(true)
    try {
      const activeTenantId = await getTenantId()
      if (!activeTenantId) {
        setLoading(false)
        return
      }

      let allImages: GalleryImage[] = []

      // 1. Fotos de Admin
      const { data: adminPhotos } = await supabase
        .from('gallery')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (adminPhotos) {
        const mapped = adminPhotos.map((p: any) => ({
          ...p,
          source: 'admin' as const,
          client_name: p.client_name || 'Fresh Nails Studio',
          likes: p.likes ?? 0,
          category: p.category || 'Exclusivo'
        }))
        allImages = [...allImages, ...mapped]
      }

      // 2. Fotos de Clientes (públicas)
      const { data: clientPhotos } = await supabase
        .from('client_gallery')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('is_active', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (clientPhotos) {
        const mapped = clientPhotos.map((p: any) => ({
          id: p.id,
          tenant_id: p.tenant_id,
          image_url: p.after_image_url || p.image_url || p.before_image_url || '',
          title: p.title || 'Aporte de Cliente',
          description: p.description || '',
          is_active: p.is_active !== undefined ? p.is_active : true,
          is_public: p.is_public !== undefined ? p.is_public : true,
          created_at: p.created_at,
          source: 'client' as const,
          client_name: p.client_name || 'Cliente',
          likes: p.likes || 0,
          category: p.category || 'Exclusivo'
        }))
        allImages = [...allImages, ...mapped]
      }

      allImages.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setImages(allImages)
    } catch (error) {
      console.error('Error cargando galería:', error)
    } finally {
      setLoading(false)
    }
  }, [getTenantId])

  useEffect(() => {
    loadGallery()
  }, [loadGallery])

  // Filtros
  const categories = ['all', 'Uñas', 'Micropigmentación', 'Peluquería', 'Cejas', 'Estética']
  
  const filteredImages = useMemo(() => {
    if (filter === 'all') return images
    return images.filter(img => img.category === filter)
  }, [images, filter])

  // Likes (solo si está logueado)
  const handleLike = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!user) return // ✅ Solo si está logueado
    setLikedImages(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setImages(imgs => imgs.map(img => img.id === id ? { ...img, likes: (img.likes || 1) - 1 } : img))
      } else {
        next.add(id)
        setImages(imgs => imgs.map(img => img.id === id ? { ...img, likes: (img.likes || 0) + 1 } : img))
      }
      return next
    })
  }, [user])

  // Lightbox
  const openLightbox = useCallback((img: GalleryImage) => {
    if (isModalOpen) return
    setIsModalOpen(true)
    setSelectedImage(img)
    document.body.style.overflow = 'hidden'
  }, [isModalOpen])

  const closeLightbox = useCallback(() => {
    setIsModalOpen(false)
    document.body.style.overflow = 'unset'
    setTimeout(() => setSelectedImage(null), 250)
  }, [])

  const navigateLightbox = useCallback((direction: 'next' | 'prev') => {
    if (!selectedImage) return
    const currentIndex = filteredImages.findIndex(i => i.id === selectedImage.id)
    if (currentIndex === -1) return
    let newIndex = direction === 'next' 
      ? (currentIndex + 1) % filteredImages.length
      : (currentIndex - 1 + filteredImages.length) % filteredImages.length
    setSelectedImage(filteredImages[newIndex])
  }, [selectedImage, filteredImages])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) closeLightbox()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isModalOpen, closeLightbox])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0b0a] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-[#C9A96E]/20 border-t-[#C9A96E] animate-spin" />
            <Sparkles className="w-6 h-6 text-[#C9A96E] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-xs text-stone-400 tracking-[0.3em] uppercase animate-pulse font-light">Cargando galería...</p>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-700 ${
      isDark ? 'bg-[#0d0b0a] text-white' : 'bg-[#FAF8F5] text-neutral-900'
    }`}>

      {/* ============================================================ */}
      {/* HERO */}
      {/* ============================================================ */}
      <section className={`relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden ${
        isDark ? 'bg-gradient-to-br from-[#C9A96E]/10 via-neutral-950 to-[#C9A96E]/5' : 'bg-gradient-to-br from-[#C9A96E]/15 via-[#FAF8F5] to-[#C9A96E]/5'
      }`}>
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1000 600">
          <path d="M 0 100 Q 150 20 250 120 T 500 80 T 750 150 T 1000 60" stroke="#C9A96E" strokeWidth="1.5" fill="none" />
          <circle cx="500" cy="350" r="4" fill="#C9A96E" opacity="0.15" />
        </svg>

        <div className="relative z-10 text-center max-w-3xl px-6">
          <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full border backdrop-blur-xl mb-6 ${
            isDark ? 'bg-[#C9A96E]/10 border-[#C9A96E]/20' : 'bg-white/40 border-[#C9A96E]/30'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-[#C9A96E] animate-[spin_4s_linear_infinite]" />
            <span className="text-[8px] tracking-[0.3em] uppercase font-black text-[#C9A96E]">✦ Galería Fresh Nails ✦</span>
          </div>

          <h1 className={`text-4xl md:text-6xl lg:text-7xl font-light font-serif tracking-wide ${
            isDark ? 'text-white' : 'text-neutral-800'
          }`}>
            Galería de{' '}
            <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#C9A96E] via-[#D4B87A] to-[#C9A96E] animate-gradient">
              Arte
            </span>
          </h1>
          <p className={`text-sm font-light mt-4 ${
            isDark ? 'text-neutral-400' : 'text-neutral-500'
          }`}>
            Descubre nuestra colección de diseños exclusivos, creados por nuestros artistas.
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* GALERÍA */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-20 pb-20">

        {/* CONTROLES */}
        <div className={`rounded-2xl border shadow-2xl p-5 mb-10 backdrop-blur-xl ${
          isDark ? 'bg-neutral-900/80 border-neutral-800/60 shadow-black/40' : 'bg-white/90 border-neutral-200/50 shadow-neutral-200/20'
        }`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[7px] tracking-[0.3em] uppercase font-black mr-1 ${
                isDark ? 'text-neutral-500' : 'text-neutral-400'
              }`}>
                Filtrar:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase transition-all duration-300 ${
                    filter === cat
                      ? 'bg-[#C9A96E] text-white shadow-lg shadow-[#C9A96E]/20 scale-105'
                      : isDark ? 'bg-neutral-800/50 text-neutral-400 hover:text-neutral-200' : 'bg-neutral-100/80 text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {cat === 'all' ? '✦ Todo' : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span>{filteredImages.length} trabajos</span>
            </div>
          </div>
        </div>

        {/* GRID */}
        {filteredImages.length === 0 ? (
          <div className={`text-center py-20 rounded-3xl border border-dashed ${
            isDark ? 'border-neutral-800/60 bg-neutral-900/20' : 'border-neutral-200/60 bg-white/40'
          }`}>
            <ImageIcon className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`} />
            <p className="text-sm font-medium text-neutral-500">No hay imágenes en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((img, idx) => {
              const isLiked = likedImages.has(img.id)
              const isHovered = hoveredId === img.id
              const isAdmin = img.source === 'admin'

              return (
                <motion.div
                  key={`${img.source}-${img.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: (idx % 8) * 0.04 }}
                  className="aspect-square rounded-2xl overflow-hidden cursor-pointer group relative bg-stone-900/20"
                  onMouseEnter={() => setHoveredId(img.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => openLightbox(img)}
                >
                  <img 
                    src={img.image_url} 
                    alt={img.title || 'Trabajo'}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Overlay en hover */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-all duration-500 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-sm font-light truncate">{img.title || 'Trabajo'}</h3>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[9px] text-white/50">
                          {img.client_name || (isAdmin ? 'Fresh Nails' : 'Cliente')}
                        </span>
                        <button 
                          onClick={(e) => handleLike(img.id, e)} 
                          className={`p-1.5 rounded-full transition-all duration-300 ${
                            isLiked ? 'text-red-500' : 'text-white/60 hover:text-white'
                          }`}
                          disabled={!user}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className={`text-[6px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full text-white backdrop-blur-md ${
                      isAdmin ? 'bg-pink-500/70' : 'bg-amber-500/70'
                    }`}>
                      {isAdmin ? '👑 Studio' : '📸 Cliente'}
                    </span>
                    {img.category && img.category !== 'Exclusivo' && (
                      <span className="text-[6px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white/80">
                        {img.category}
                      </span>
                    )}
                  </div>

                  {/* Likes */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full text-[8px] text-white/70">
                    <Heart className="w-2.5 h-2.5 fill-current" />
                    {img.likes || 0}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* LIGHTBOX */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isModalOpen && selectedImage && (
          <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4" onClick={closeLightbox}>
            <button onClick={closeLightbox} className="absolute top-4 right-4 md:top-6 md:right-6 p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 bg-black/40 backdrop-blur-sm">
              <X className="w-6 h-6" />
            </button>

            {filteredImages.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }} className="absolute left-3 md:left-6 p-3 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 bg-black/30 backdrop-blur-sm">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }} className="absolute right-3 md:right-6 p-3 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 bg-black/30 backdrop-blur-sm">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-[10px] tracking-[0.2em] font-mono z-50 bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
              {filteredImages.findIndex(i => i.id === selectedImage.id) + 1} / {filteredImages.length}
            </div>

            <div className="relative z-10 max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <img 
                src={selectedImage.image_url} 
                alt={selectedImage.title || ''}
                className="max-h-[80vh] w-auto object-contain rounded-2xl shadow-2xl"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-b-2xl">
                <h3 className="text-white text-lg font-light">{selectedImage.title || 'Trabajo'}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-white/60">
                  <span>{selectedImage.client_name || (selectedImage.source === 'admin' ? 'Fresh Nails' : 'Cliente')}</span>
                  <span>•</span>
                  <span>{selectedImage.category || 'Exclusivo'}</span>
                  {selectedImage.likes !== undefined && selectedImage.likes > 0 && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {selectedImage.likes}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient { animation: gradient 4s ease-in-out infinite; }
      `}</style>
    </div>
  )
}