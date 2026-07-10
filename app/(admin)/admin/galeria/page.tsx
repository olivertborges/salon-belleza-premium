'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, Image as ImageIcon, UploadCloud, 
  Trash2, Loader2, Sparkles, X, ZoomIn,
  ChevronLeft, ChevronRight, Grid3x3, LayoutGrid,
  Heart, Star, Clock, Calendar, Tag, ExternalLink
} from 'lucide-react'

type Photo = {
  id: string
  image_url: string
  uploaded_by: 'admin'
  category: string
  created_at: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    transition: { duration: 0.2 }
  }
}

const categories = ['Todas', 'Nail Art', 'Acrílicas', 'Semipermanente', 'Esmaltado', 'Pedicuría']

export default function GaleriaAdminPage() {
  const { settings } = useSettings()
  const { tenantId, loading: authLoading } = useAuth()

  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showLightbox, setShowLightbox] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

  const fetchPhotos = async (showLoading = true) => {
    if (!tenantId) return
    if (showLoading) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)

    try {
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('uploaded_by', 'admin')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setPhotos(data as Photo[])
      setSuccess('Galería actualizada')
      setTimeout(() => setSuccess(null), 2000)
    } catch (err: any) {
      console.error('Error cargando catálogo del salón:', err)
      setError(err.message || 'Error al cargar la galería')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (tenantId) fetchPhotos()
  }, [tenantId])

  const handleUploadPlaceholder = async () => {
    if (!tenantId) return
    setError(null)
    setSuccess(null)
    try {
      setUploading(true)

      const mockImages = [
        'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1632345031435-8797b2d58045?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1596462502278-6d3be8bd3d3c?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1571781418606-70265b9f2ea0?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&auto=format&fit=crop&q=80'
      ]
      const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)]

      const { error } = await supabase
        .from('gallery_photos')
        .insert({
          tenant_id: tenantId,
          uploaded_by: 'admin',
          image_url: randomImage,
          category: categoryFilter === 'Todas' ? 'Nail Art' : categoryFilter,
        })

      if (error) throw error
      setSuccess('✨ ¡Foto agregada a la galería!')
      setTimeout(() => setSuccess(null), 2500)
      fetchPhotos(false)
    } catch (err: any) {
      console.error('Error al subir foto al catálogo:', err)
      setError(err.message || 'Error al subir la foto')
      setTimeout(() => setError(null), 3000)
    } finally {
      setUploading(false)
    }
  }

  const deletePhoto = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!confirm('¿Eliminar esta foto de la galería?')) return
    
    try {
      const { error } = await supabase.from('gallery_photos').delete().eq('id', id)
      if (error) throw error
      setPhotos(photos.filter(p => p.id !== id))
      if (selectedPhoto?.id === id) {
        setShowLightbox(false)
        setSelectedPhoto(null)
      }
      setSuccess('🗑️ Foto eliminada')
      setTimeout(() => setSuccess(null), 2000)
    } catch (err: any) {
      console.error('Error al eliminar del catálogo:', err)
      setError(err.message || 'Error al eliminar la foto')
      setTimeout(() => setError(null), 3000)
    }
  }

  const openLightbox = (photo: Photo) => {
    setSelectedPhoto(photo)
    setShowLightbox(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setShowLightbox(false)
    setSelectedPhoto(null)
    document.body.style.overflow = 'auto'
  }

  const navigateLightbox = (direction: 'next' | 'prev') => {
    const currentIndex = photosFiltradas.findIndex(p => p.id === selectedPhoto?.id)
    if (currentIndex === -1) return
    
    let newIndex
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % photosFiltradas.length
    } else {
      newIndex = (currentIndex - 1 + photosFiltradas.length) % photosFiltradas.length
    }
    setSelectedPhoto(photosFiltradas[newIndex])
  }

  const photosFiltradas = photos.filter(p => 
    categoryFilter === 'Todas' || p.category === categoryFilter
  )

  // Keyboard events for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showLightbox) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') navigateLightbox('prev')
      if (e.key === 'ArrowRight') navigateLightbox('next')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showLightbox, selectedPhoto, photosFiltradas])

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: settings?.primary_color || '#DB5B9A' }} />
          <div className="absolute inset-0 w-12 h-12 rounded-full animate-ping opacity-20" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }} />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse" style={{ color: settings?.primary_color || '#DB5B9A' }}>
          Cargando galería...
        </p>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-1 max-w-7xl mx-auto"
    >

      {/* HEADER ESPECTACULAR */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
        className="relative overflow-hidden rounded-3xl p-[2px] shadow-2xl" 
        style={brandGradient}
      >
        <div className="absolute inset-0 opacity-30 animate-pulse" style={brandGradient} />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }} />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ backgroundColor: settings?.secondary_color || '#E5A46E' }} />
        
        <div className="relative z-10 rounded-[23px] p-6 md:p-8 bg-white/95 dark:bg-[#0f0c1b]/95 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <motion.div 
                whileHover={{ rotate: -10, scale: 1.1 }}
                className="p-4 rounded-2xl text-white shadow-xl shrink-0" 
                style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
              >
                <Camera className="w-6 h-6 md:w-7 md:h-7" />
              </motion.div>
              <div>
                <motion.p 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-[10px] uppercase tracking-[0.3em] font-bold font-mono" 
                  style={{ color: settings?.primary_color || '#DB5B9A' }}
                >
                  ✨ Portafolio Profesional
                </motion.p>
                <motion.h2 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl md:text-4xl font-serif font-extrabold text-stone-900 dark:text-white mt-1"
                >
                  Galería de <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">Trabajos</span>
                </motion.h2>
                <motion.p 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs text-stone-500 dark:text-pink-100/60 mt-1"
                >
                  {photos.length} obras • Gestión visual del catálogo profesional
                </motion.p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode(viewMode === 'grid' ? 'masonry' : 'grid')}
                className="p-2.5 rounded-xl border bg-white/50 dark:bg-[#1a1430]/40 border-pink-100/60 dark:border-fuchsia-950 text-stone-500 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
              >
                {viewMode === 'grid' ? <LayoutGrid className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUploadPlaceholder}
                disabled={uploading}
                className="px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Agregar Foto</span>
                <span className="sm:hidden">+</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* MENSAJES */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl p-4 bg-gradient-to-r from-rose-500/10 to-pink-500/5 border border-rose-500/20 flex items-center gap-3 shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <X className="w-4 h-4" />
            </div>
            <p className="text-xs text-stone-700 dark:text-rose-400 font-medium min-w-0">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex items-center gap-3 shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs text-stone-700 dark:text-emerald-400 font-medium min-w-0">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CATEGORÍAS CON ANIMACIÓN */}
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2 pb-1"
      >
        {categories.map((cat, index) => (
          <motion.button
            key={cat}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * index }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
              categoryFilter === cat
                ? 'text-white shadow-lg'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-pink-100 bg-white dark:bg-[#130f24] border border-pink-100/60 dark:border-fuchsia-950'
            }`}
            style={categoryFilter === cat ? { backgroundColor: settings?.primary_color || '#DB5B9A' } : {}}
          >
            {cat}
            {cat !== 'Todas' && (
              <span className="ml-1.5 text-[9px] opacity-70">
                ({photos.filter(p => p.category === cat).length})
              </span>
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* CONTADOR Y ESTADO */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <p className="text-xs text-stone-400 dark:text-stone-500 font-mono">
          Mostrando <span className="font-bold text-stone-700 dark:text-pink-100">{photosFiltradas.length}</span> {photosFiltradas.length === 1 ? 'obra' : 'obras'}
        </p>
        {refreshing && (
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: settings?.primary_color || '#DB5B9A' }} />
        )}
      </motion.div>

      {/* GRID DE FOTOS CON ANIMACIONES STAGGER */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`grid gap-4 ${
          viewMode === 'grid' 
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' 
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        }`}
      >
        <AnimatePresence mode="wait">
          {photosFiltradas.length === 0 ? (
            <motion.div 
              variants={itemVariants}
              className="col-span-full text-center py-20 border border-dashed rounded-3xl bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950"
            >
              <motion.div 
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: settings?.primary_color || '#DB5B9A' }} />
              </motion.div>
              <p className="text-sm font-mono text-stone-400">No hay fotos en esta categoría</p>
              <p className="text-xs text-stone-400/60 mt-1">Agrega tus primeros trabajos al portafolio</p>
            </motion.div>
          ) : (
            photosFiltradas.map((photo, index) => (
              <motion.div
                key={photo.id}
                variants={itemVariants}
                layoutId={`photo-${photo.id}`}
                onHoverStart={() => setHoveredId(photo.id)}
                onHoverEnd={() => setHoveredId(null)}
                onClick={() => openLightbox(photo)}
                className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-white dark:bg-[#130f24] border border-pink-100/60 dark:border-fuchsia-950 shadow-sm hover:shadow-2xl transition-shadow duration-500"
              >
                {/* Imagen con efecto de zoom */}
                <motion.img 
                  src={photo.image_url} 
                  alt="Muestra de trabajo" 
                  className="w-full h-full object-cover"
                  animate={{ 
                    scale: hoveredId === photo.id ? 1.08 : 1
                  }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                />

                {/* Overlay con gradiente y glow */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredId === photo.id ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />

                {/* Badge de categoría */}
                <motion.div 
                  className="absolute top-3 left-3"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ 
                    opacity: hoveredId === photo.id ? 1 : 0.6,
                    y: hoveredId === photo.id ? 0 : -5
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-mono uppercase tracking-wider px-3 py-1 rounded-full border border-white/10">
                    <Tag className="w-2.5 h-2.5 inline mr-1" />
                    {photo.category}
                  </span>
                </motion.div>

                {/* Botones de acción en hover */}
                <motion.div 
                  className="absolute bottom-3 right-3 flex gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: hoveredId === photo.id ? 1 : 0,
                    y: hoveredId === photo.id ? 0 : 10
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      openLightbox(photo)
                    }}
                    className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-xl transition-all"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: '#ef4444' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => deletePhoto(photo.id, e)}
                    className="p-2 bg-white/20 backdrop-blur-md hover:bg-red-500 text-white rounded-xl transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>
                </motion.div>

                {/* Info inferior */}
                <motion.div 
                  className="absolute bottom-3 left-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredId === photo.id ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-white/80 font-mono text-[9px] flex items-center gap-1.5">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(photo.created_at).toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </p>
                </motion.div>

                {/* Efecto de brillo en borde */}
                <motion.div 
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  animate={{
                    boxShadow: hoveredId === photo.id 
                      ? `inset 0 0 30px ${settings?.primary_color || '#DB5B9A'}20` 
                      : 'inset 0 0 0px transparent'
                  }}
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* LIGHTBOX ESPECTACULAR */}
      <AnimatePresence>
        {showLightbox && selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            {/* Botón cerrar */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.2 }}
              onClick={closeLightbox}
              className="absolute top-6 right-6 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all z-10"
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Navegación */}
            {photosFiltradas.length > 1 && (
              <>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: 0.3 }}
                  onClick={(e) => { e.stopPropagation(); navigateLightbox('prev') }}
                  className="absolute left-6 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: 0.3 }}
                  onClick={(e) => { e.stopPropagation(); navigateLightbox('next') }}
                  className="absolute right-6 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </motion.button>
              </>
            )}

            {/* Imagen con animación de zoom */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full max-h-[85vh]"
            >
              <img 
                src={selectedPhoto.image_url} 
                alt="Galería" 
                className="w-full h-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              />

              {/* Info inferior en lightbox */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl"
              >
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-4">
                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-mono uppercase tracking-wider px-3 py-1 rounded-full border border-white/10">
                      <Tag className="w-3 h-3 inline mr-1.5" />
                      {selectedPhoto.category}
                    </span>
                    <span className="text-xs text-white/60 font-mono flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(selectedPhoto.created_at).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40 font-mono">
                      {photosFiltradas.findIndex(p => p.id === selectedPhoto.id) + 1} / {photosFiltradas.length}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => deletePhoto(selectedPhoto.id, e)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/80 text-white rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}