'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, Image as ImageIcon, UploadCloud, 
  Trash2, Loader2, Sparkles, X, ZoomIn,
  ChevronLeft, ChevronRight, LayoutGrid,
  Clock, Calendar, Tag, Users, Edit3,
  Check, Eye, EyeOff, User, DollarSign,
  Palette, Scissors, TrendingUp, Heart,
  FileImage
} from 'lucide-react'

type Photo = {
  id: string
  image_url: string
  title: string | null
  category: string | null
  description: string | null
  is_active: boolean
  created_at: string
  source: 'admin' | 'client'
  professional_id?: string | null
  client_name?: string | null
  client_id?: string | null
  before_image_url?: string | null
  after_image_url?: string | null
  price?: number | null
  polish_used?: string | null
  sensory_category?: string | null
  views?: number
  sort_order?: number
}

const categories = ['Todas', 'Nail Art', 'Acrílicas', 'Semipermanente', 'Esmaltado', 'Pedicuría', 'Micropigmentacion', 'Peluquería']

export default function GaleriaAdminPage() {
  const { settings } = useSettings()
  const { tenantId, user, loading: authLoading } = useAuth()

  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showLightbox, setShowLightbox] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    category: 'Nail Art',
    description: '',
    image_url: '',
    is_active: true,
    sort_order: 0
  })

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

  // ============================================================
  // 🔥 FUNCIÓN PARA OBTENER TENANT_ID
  // ============================================================
  const getTenantId = useCallback(async (): Promise<string | null> => {
    // 1. Primero del contexto
    if (tenantId) return tenantId

    // 2. De la sesión
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    // 3. De user_metadata
    if (session.user.user_metadata?.tenant_id) {
      return session.user.user_metadata.tenant_id
    }

    // 4. De app_metadata
    if (session.user.app_metadata?.tenant_id) {
      return session.user.app_metadata.tenant_id
    }

    // 5. De profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', session.user.id)
      .maybeSingle()

    if (profile?.tenant_id) return profile.tenant_id

    // 6. De clients
    const { data: client } = await supabase
      .from('clients')
      .select('tenant_id')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()

    if (client?.tenant_id) return client.tenant_id

    return null
  }, [tenantId])

  // ============================================================
  // 🔥 CARGAR FOTOS - CORREGIDO CON FALLBACK
  // ============================================================
  const fetchPhotos = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      else setRefreshing(true)
      setError(null)

      // Obtener tenantId
      let activeTenantId = await getTenantId()

      if (!activeTenantId) {
        console.warn('⚠️ No se encontró tenantId, usando modo demostración')
        setPhotos([])
        setLoading(false)
        setRefreshing(false)
        return
      }

      console.log('🔍 Cargando fotos para tenant:', activeTenantId)

      let allPhotos: Photo[] = []

      // 1. Fotos de admin (tabla gallery)
      const { data: adminPhotos, error: adminError } = await supabase
        .from('gallery')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (adminError) {
        console.error('Error cargando fotos de admin:', adminError)
      } else if (adminPhotos) {
        console.log(`📸 Encontradas ${adminPhotos.length} fotos de admin`)
        const mappedAdminPhotos = adminPhotos.map((p: any) => ({
          ...p,
          source: 'admin' as const,
          professional_id: p.professional_id || null,
          client_name: null,
          client_id: null,
          before_image_url: null,
          after_image_url: null,
          price: null,
          polish_used: null,
          sensory_category: null,
          views: 0
        }))
        allPhotos = [...allPhotos, ...mappedAdminPhotos]
      }

      // 2. Fotos de clientes (tabla client_gallery)
      const { data: clientPhotos, error: clientError } = await supabase
        .from('client_gallery')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false })

      if (clientError) {
        console.error('Error cargando fotos de clientes:', clientError)
      } else if (clientPhotos) {
        console.log(`📸 Encontradas ${clientPhotos.length} fotos de clientes`)
        const mappedClientPhotos = clientPhotos.map((p: any) => ({
          id: p.id,
          image_url: p.after_image_url || p.image_url || p.before_image_url || '',
          title: p.title || 'Trabajo de cliente',
          category: p.category || 'Nail Art',
          description: p.description || '',
          is_active: p.is_active !== undefined ? p.is_active : true,
          created_at: p.created_at,
          source: 'client' as const,
          professional_id: p.professional_id || null,
          client_name: p.client_name || 'Cliente',
          client_id: p.client_id || null,
          before_image_url: p.before_image_url || null,
          after_image_url: p.after_image_url || null,
          price: p.price || null,
          polish_used: p.polish_used || null,
          sensory_category: p.sensory_category || null,
          views: p.views || 0,
          sort_order: p.sort_order || 0
        }))
        allPhotos = [...allPhotos, ...mappedClientPhotos]
      }

      // Ordenar por fecha (más reciente primero)
      allPhotos.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      console.log(`✅ Total: ${allPhotos.length} fotos cargadas`)
      setPhotos(allPhotos)

    } catch (err: any) {
      console.error('❌ Error cargando galería:', err)
      setError(err.message || 'Error al cargar la galería')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [getTenantId])

  // ============================================================
  // 🔥 EFECTO PARA CARGAR FOTOS - CON DEPENDENCIAS CORRECTAS
  // ============================================================
  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      if (!mounted) return
      await fetchPhotos(true)
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [fetchPhotos])

  // ============================================================
  // SUBIR ARCHIVO A STORAGE
  // ============================================================
  const uploadFile = async (file: File, tenantId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `gallery/${tenantId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('gallery')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  }

  // ============================================================
  // MANEJAR SELECCIÓN DE ARCHIVO
  // ============================================================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('⚠️ Por favor selecciona una imagen válida')
      setTimeout(() => setError(null), 3000)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('⚠️ La imagen no puede superar los 10MB')
      setTimeout(() => setError(null), 3000)
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // ============================================================
  // HANDLE SUBMIT
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const activeTenantId = await getTenantId()
      if (!activeTenantId) {
        throw new Error('⚠️ No se pudo identificar tu salón. Intenta recargar la página.')
      }

      setUploading(true)

      let imageUrl = formData.image_url
      if (selectedFile) {
        imageUrl = await uploadFile(selectedFile, activeTenantId)
      }

      if (!editingPhoto && !imageUrl) {
        throw new Error('⚠️ Debes seleccionar una imagen')
      }

      if (editingPhoto) {
        const { error: updateError } = await supabase
          .from('gallery')
          .update({
            image_url: imageUrl,
            title: formData.title,
            category: formData.category,
            description: formData.description,
            is_active: formData.is_active,
            sort_order: formData.sort_order
          })
          .eq('id', editingPhoto.id)
          .eq('tenant_id', activeTenantId)

        if (updateError) throw updateError
        setSuccess('✨ ¡Foto actualizada exitosamente!')
      } else {
        const { error: insertError } = await supabase
          .from('gallery')
          .insert({
            tenant_id: activeTenantId,
            professional_id: user?.id || null,
            image_url: imageUrl,
            title: formData.title || null,
            category: formData.category || 'Nail Art',
            description: formData.description || null,
            is_active: formData.is_active,
            sort_order: formData.sort_order || 0
          })

        if (insertError) throw insertError
        setSuccess('✨ ¡Foto subida exitosamente!')
      }

      await fetchPhotos(false)
      resetForm()
      setShowModal(false)

    } catch (err: any) {
      console.error("Error en handleSubmit:", err)
      setError(err.message || 'Ocurrió un error inesperado')
    } finally {
      setUploading(false)
    }
  }

  // ============================================================
  // RESET FORM
  // ============================================================
  const resetForm = () => {
    setFormData({
      title: '',
      category: 'Nail Art',
      description: '',
      image_url: '',
      is_active: true,
      sort_order: 0
    })
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setEditingPhoto(null)
  }

  // ============================================================
  // ELIMINAR FOTO
  // ============================================================
  const deletePhoto = async (id: string, e?: React.MouseEvent, source?: string) => {
    if (e) e.stopPropagation()

    if (source === 'client') {
      setError('⚠️ No se pueden eliminar fotos de clientes')
      setTimeout(() => setError(null), 3000)
      return
    }
    if (!confirm('¿Eliminar esta foto de la galería?')) return

    try {
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id)

      if (error) throw error

      setPhotos(photos.filter(p => p.id !== id))
      if (selectedPhoto?.id === id) {
        setShowLightbox(false)
        setSelectedPhoto(null)
      }
      setSuccess('🗑️ Foto eliminada')
      setTimeout(() => setSuccess(null), 2000)
    } catch (err: any) {
      console.error('Error al eliminar:', err)
      setError(err.message || 'Error al eliminar la foto')
      setTimeout(() => setError(null), 3000)
    }
  }

  // ============================================================
  // TOGGLE ACTIVO
  // ============================================================
  const toggleActive = async (id: string, currentStatus: boolean, e?: React.MouseEvent, source?: string) => {
    if (e) e.stopPropagation()
    if (source === 'client') {
      setError('⚠️ No se puede cambiar estado de fotos de clientes')
      setTimeout(() => setError(null), 3000)
      return
    }

    try {
      const { error } = await supabase
        .from('gallery')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      setPhotos(photos.map(p => 
        p.id === id ? { ...p, is_active: !currentStatus } : p
      ))
      setSuccess(currentStatus ? '👁️ Foto ocultada' : '👁️ Foto visible')
      setTimeout(() => setSuccess(null), 2000)
    } catch (err: any) {
      console.error('Error cambiando estado:', err)
      setError(err.message || 'Error al cambiar estado')
      setTimeout(() => setError(null), 3000)
    }
  }

  // ============================================================
  // LIGHTBOX
  // ============================================================
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
      className="space-y-6 p-1 max-w-7xl mx-auto w-full overflow-x-hidden"
    >
      {/* HEADER */}
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
                  ✨ Galería Unificada
                </motion.p>
                <motion.h2 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl md:text-4xl font-serif font-extrabold text-stone-900 dark:text-white mt-1"
                >
                  <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">Todas</span> las Fotos
                </motion.h2>
                <motion.p 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs text-stone-500 dark:text-pink-100/60 mt-1"
                >
                  {photos.length} obras • Admin + Clientes
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
                <LayoutGrid className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { 
                  resetForm()
                  setShowModal(true)
                }}
                className="px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all"
                style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
              >
                <UploadCloud className="w-4 h-4" />
                <span className="hidden sm:inline">Subir Foto</span>
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

      {/* CATEGORÍAS */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-nowrap gap-1.5 w-max"
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
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap shrink-0 ${
                categoryFilter === cat
                  ? 'text-white shadow-lg'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-pink-100 bg-white dark:bg-[#130f24] border border-pink-100/60 dark:border-fuchsia-950'
              }`}
              style={categoryFilter === cat ? { backgroundColor: settings?.primary_color || '#DB5B9A' } : {}}
            >
              {cat}
              {cat !== 'Todas' && (
                <span className="ml-1 text-[8px] opacity-70">
                  ({photos.filter(p => p.category === cat).length})
                </span>
              )}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* CONTADOR */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <p className="text-xs text-stone-400 dark:text-stone-500 font-mono">
          Mostrando <span className="font-bold text-stone-700 dark:text-pink-100">{photosFiltradas.length}</span> {photosFiltradas.length === 1 ? 'obra' : 'obras'}
          <span className="ml-2 text-[10px]">
            <span className="text-pink-500">●</span> Admin: {photos.filter(p => p.source === 'admin').length}
            <span className="ml-2 text-amber-500">●</span> Clientes: {photos.filter(p => p.source === 'client').length}
          </span>
        </p>
        {refreshing && (
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: settings?.primary_color || '#DB5B9A' }} />
        )}
      </motion.div>

      {/* GRID DE FOTOS */}
      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05,
              delayChildren: 0.1
            }
          }
        }}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <AnimatePresence mode="wait">
          {photosFiltradas.length === 0 ? (
            <motion.div 
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                visible: { opacity: 1, scale: 1 }
              }}
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
            photosFiltradas.map((photo) => {
              const imageToShow = photo.after_image_url || photo.image_url || photo.before_image_url || ''
              const isClient = photo.source === 'client'

              return (
                <motion.div
                  key={`${photo.source}-${photo.id}`}
                  variants={{
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
                  }}
                  layoutId={`photo-${photo.id}`}
                  onHoverStart={() => setHoveredId(photo.id)}
                  onHoverEnd={() => setHoveredId(null)}
                  onClick={() => openLightbox(photo)}
                  className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-white dark:bg-[#130f24] border shadow-sm hover:shadow-2xl transition-shadow duration-500 ${
                    isClient 
                      ? 'border-amber-300/40 dark:border-amber-800/40' 
                      : 'border-pink-100/60 dark:border-fuchsia-950'
                  } ${!photo.is_active ? 'opacity-60' : ''}`}
                >
                  <motion.img 
                    src={imageToShow} 
                    alt={photo.title || 'Muestra de trabajo'} 
                    className="w-full h-full object-cover"
                    animate={{ 
                      scale: hoveredId === photo.id ? 1.08 : 1
                    }}
                    transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                  />

                  <div className="absolute top-3 left-3">
                    <span className={`text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md ${
                      isClient 
                        ? 'bg-amber-500/80 text-white' 
                        : 'bg-pink-500/80 text-white'
                    }`}>
                      {isClient ? '👤 Cliente' : '👑 Admin'}
                    </span>
                  </div>

                  {isClient && photo.price && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-emerald-500/80 backdrop-blur-md text-white text-[8px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                        <DollarSign className="w-2.5 h-2.5" />
                        {photo.price}
                      </span>
                    </div>
                  )}

                  {isClient && photo.client_name && (
                    <div className="absolute bottom-3 left-3">
                      <span className="text-white/80 text-[8px] font-mono flex items-center gap-1 backdrop-blur-sm bg-black/30 px-2 py-0.5 rounded-full">
                        <User className="w-2.5 h-2.5" />
                        {photo.client_name}
                      </span>
                    </div>
                  )}

                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredId === photo.id ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />

                  <motion.div 
                    className="absolute top-3 right-3"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ 
                      opacity: hoveredId === photo.id ? 1 : 0.6,
                      y: hoveredId === photo.id ? 0 : -5
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-mono uppercase tracking-wider px-3 py-1 rounded-full border border-white/10">
                      <Tag className="w-2.5 h-2.5 inline mr-1" />
                      {photo.category || 'Sin categoría'}
                    </span>
                  </motion.div>

                  {photo.title && (
                    <motion.div 
                      className="absolute bottom-12 left-3 right-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ 
                        opacity: hoveredId === photo.id ? 1 : 0,
                        y: hoveredId === photo.id ? 0 : 10
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-white/90 text-xs font-bold truncate">
                        {photo.title}
                      </p>
                    </motion.div>
                  )}

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

                    {!isClient && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingPhoto(photo)
                            setFormData({
                              title: photo.title || '',
                              category: photo.category || 'Nail Art',
                              description: photo.description || '',
                              image_url: photo.image_url || '',
                              is_active: photo.is_active,
                              sort_order: photo.sort_order || 0
                            })
                            setSelectedFile(null)
                            setPreviewUrl(null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                            setShowModal(true)
                          }}
                          className="p-2 bg-white/20 backdrop-blur-md hover:bg-blue-500/60 text-white rounded-xl transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => toggleActive(photo.id, photo.is_active, e, photo.source)}
                          className="p-2 bg-white/20 backdrop-blur-md hover:bg-amber-500/60 text-white rounded-xl transition-all"
                        >
                          {photo.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, backgroundColor: '#ef4444' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => deletePhoto(photo.id, e, photo.source)}
                          className="p-2 bg-white/20 backdrop-blur-md hover:bg-red-500 text-white rounded-xl transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                      </>
                    )}
                  </motion.div>

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
              )
            })
          )}
        </AnimatePresence>
      </motion.div>

      {/* LIGHTBOX */}
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

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full max-h-[85vh]"
            >
              <img 
                src={selectedPhoto.after_image_url || selectedPhoto.image_url || selectedPhoto.before_image_url || ''} 
                alt={selectedPhoto.title || 'Galería'} 
                className="w-full h-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl"
              >
                <div className="flex flex-wrap items-center justify-between text-white gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      selectedPhoto.source === 'client' 
                        ? 'bg-amber-500/80' 
                        : 'bg-pink-500/80'
                    }`}>
                      {selectedPhoto.source === 'client' ? '👤 Cliente' : '👑 Admin'}
                    </span>
                    {selectedPhoto.title && (
                      <span className="text-sm font-bold text-white/90">
                        {selectedPhoto.title}
                      </span>
                    )}
                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-mono uppercase tracking-wider px-3 py-1 rounded-full border border-white/10">
                      <Tag className="w-3 h-3 inline mr-1.5" />
                      {selectedPhoto.category || 'Sin categoría'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40 font-mono">
                      {photosFiltradas.findIndex(p => p.id === selectedPhoto.id) + 1} / {photosFiltradas.length}
                    </span>
                    {selectedPhoto.source === 'admin' && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingPhoto(selectedPhoto)
                            setFormData({
                              title: selectedPhoto.title || '',
                              category: selectedPhoto.category || 'Nail Art',
                              description: selectedPhoto.description || '',
                              image_url: selectedPhoto.image_url || '',
                              is_active: selectedPhoto.is_active,
                              sort_order: selectedPhoto.sort_order || 0
                            })
                            setSelectedFile(null)
                            setPreviewUrl(null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                            setShowModal(true)
                            setShowLightbox(false)
                          }}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/80 text-white rounded-xl transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => deletePhoto(selectedPhoto.id, e, selectedPhoto.source)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/80 text-white rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>

                {selectedPhoto.source === 'client' && (
                  <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-white/10">
                    {selectedPhoto.client_name && (
                      <span className="text-xs text-white/60 flex items-center gap-1.5">
                        <User className="w-3 h-3" />
                        {selectedPhoto.client_name}
                      </span>
                    )}
                    {selectedPhoto.price && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3" />
                        ${selectedPhoto.price}
                      </span>
                    )}
                    {selectedPhoto.polish_used && (
                      <span className="text-xs text-white/60 flex items-center gap-1.5">
                        <Palette className="w-3 h-3" />
                        {selectedPhoto.polish_used}
                      </span>
                    )}
                    {selectedPhoto.sensory_category && (
                      <span className="text-xs text-white/60 flex items-center gap-1.5">
                        <Heart className="w-3 h-3" />
                        {selectedPhoto.sensory_category}
                      </span>
                    )}
                    {selectedPhoto.views !== undefined && (
                      <span className="text-xs text-white/40 flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3" />
                        {selectedPhoto.views} vistas
                      </span>
                    )}
                    {selectedPhoto.before_image_url && selectedPhoto.after_image_url && (
                      <span className="text-xs text-amber-400 flex items-center gap-1.5">
                        <Scissors className="w-3 h-3" />
                        Antes / Después
                      </span>
                    )}
                  </div>
                )}

                {selectedPhoto.description && (
                  <p className="text-xs text-white/60 mt-2 line-clamp-2">
                    {selectedPhoto.description}
                  </p>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              setShowModal(false)
              resetForm()
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-3xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-pink-50 dark:hover:bg-fuchsia-950/40 transition-colors text-stone-400 hover:text-stone-700 dark:hover:text-pink-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl text-white shadow-md" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}>
                  {editingPhoto ? <Edit3 className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
                </div>
                <h3 className="text-xl font-serif font-extrabold text-stone-800 dark:text-pink-100">
                  {editingPhoto ? 'Editar Foto' : 'Subir Foto'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ÁREA DE SUBIDA DE ARCHIVO */}
                {!editingPhoto && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                      Seleccionar Imagen *
                    </label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-pink-500/50 ${
                        previewUrl 
                          ? 'border-pink-500/50 bg-pink-50/10' 
                          : 'border-stone-300 dark:border-fuchsia-950 hover:bg-pink-50/5'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      {previewUrl ? (
                        <div className="relative">
                          <img 
                            src={previewUrl} 
                            alt="Vista previa" 
                            className="max-h-48 mx-auto rounded-lg object-contain"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedFile(null)
                              setPreviewUrl(null)
                              if (fileInputRef.current) fileInputRef.current.value = ''
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="py-4">
                          <FileImage className="w-12 h-12 mx-auto text-stone-400 dark:text-stone-600 mb-3" />
                          <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
                            Haz clic para seleccionar
                          </p>
                          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                            JPEG, PNG, WebP • Máx. 10MB
                          </p>
                        </div>
                      )}

                      {uploading && uploadProgress > 0 && (
                        <div className="mt-3">
                          <div className="w-full bg-stone-200 dark:bg-fuchsia-950/50 rounded-full h-2 overflow-hidden">
                            <motion.div 
                              className="h-full rounded-full"
                              style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <p className="text-xs text-stone-400 mt-1">{uploadProgress}% subido</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Título */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                    Título
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm"
                    style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
                    placeholder="Título de la obra"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm appearance-none"
                    style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
                  >
                    {categories.filter(c => c !== 'Todas').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm resize-none"
                    style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
                    placeholder="Descripción de la obra..."
                  />
                </div>

                {/* Solo para edición: mostrar URL actual */}
                {editingPhoto && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                      Imagen actual
                    </label>
                    <div className="relative rounded-xl overflow-hidden border border-pink-100/60 dark:border-fuchsia-950">
                      <img 
                        src={formData.image_url} 
                        alt="Imagen actual" 
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Checkboxes */}
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 rounded border-pink-300 text-pink-500 focus:ring-pink-500"
                    />
                    <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Visible</span>
                  </label>

                  <div className="flex-1 min-w-[80px]">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1">
                      Orden
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-1.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm"
                      style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border hover:bg-pink-50 dark:hover:bg-fuchsia-950/30 transition-all text-xs font-bold uppercase tracking-widest border-pink-100/60 dark:border-fuchsia-950 text-stone-600 dark:text-stone-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-2.5 rounded-xl text-white hover:scale-105 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {uploading ? 'Subiendo...' : (editingPhoto ? 'Actualizar' : 'Guardar')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
