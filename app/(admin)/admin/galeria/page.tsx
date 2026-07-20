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
  FileImage, Layers
} from 'lucide-react'

type Photo = {
  id: string
  image_url: string | null
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
  
  // Estados para archivos (Soporta Normal o Antes/Después)
  const [isBeforeAfter, setIsBeforeAfter] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedBeforeFile, setSelectedBeforeFile] = useState<File | null>(null)
  const [previewBeforeUrl, setPreviewBeforeUrl] = useState<string | null>(null)
  const [selectedAfterFile, setSelectedAfterFile] = useState<File | null>(null)
  const [previewAfterUrl, setPreviewAfterUrl] = useState<string | null>(null)
  
  // Estado para el slider interactivo del Lightbox público interno
  const [sliderPosition, setSliderPosition] = useState(50)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const beforeFileInputRef = useRef<HTMLInputElement>(null)
  const afterFileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    category: 'Nail Art',
    description: '',
    image_url: '',
    before_image_url: '',
    after_image_url: '',
    is_active: true,
    sort_order: 0
  })

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

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
    return null
  }, [tenantId])

  // CARGAR FOTOS ACTUALIZADA (Soporta columnas antes/después en admin también)
  const fetchPhotos = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      else setRefreshing(true)
      setError(null)

      let activeTenantId = await getTenantId()
      if (!activeTenantId) {
        setPhotos([])
        setLoading(false)
        setRefreshing(false)
        return
      }

      let allPhotos: Photo[] = []

      // 1. Fotos de admin (tabla gallery incluyendo before y after urls)
      const { data: adminPhotos, error: adminError } = await supabase
        .from('gallery')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (adminError) {
        console.error('Error cargando fotos de admin:', adminError)
      } else if (adminPhotos) {
        const mappedAdminPhotos = adminPhotos.map((p: any) => ({
          ...p,
          source: 'admin' as const,
          image_url: p.image_url || p.after_image_url || p.before_image_url || null,
          before_image_url: p.before_image_url || null,
          after_image_url: p.after_image_url || null,
          professional_id: p.professional_id || null,
          client_name: null,
          client_id: null,
          price: null,
          polish_used: null,
          sensory_category: null,
          views: 0
        }))
        allPhotos = [...allPhotos, ...mappedAdminPhotos]
      }

      // 2. Fotos de clientes
      const { data: clientPhotos, error: clientError } = await supabase
        .from('client_gallery')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false })

      if (clientError) {
        console.error('Error cargando fotos de clientes:', clientError)
      } else if (clientPhotos) {
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

      allPhotos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setPhotos(allPhotos)

    } catch (err: any) {
      setError('Error al cargar la galería')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [getTenantId])

  useEffect(() => {
    fetchPhotos(true)
  }, [fetchPhotos])

  const uploadFile = async (file: File, tenantId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `gallery/${tenantId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(filePath, file, { cacheControl: '3600', upsert: false })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(filePath)
    return urlData.publicUrl
  }

  const handleFileSelectGeneric = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('⚠️ Por favor selecciona una imagen válida')
      return
    }

    setFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  // SUBMIT MEJORADO (Gestiona condicionalmente subidas normales o dobles)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const activeTenantId = await getTenantId()
      if (!activeTenantId) throw new Error('⚠️ No se pudo identificar tu salón.')

      setUploading(true)

      let imageUrl = formData.image_url
      let beforeUrl = formData.before_image_url
      let afterUrl = formData.after_image_url

      if (!editingPhoto) {
        if (isBeforeAfter) {
          if (!selectedBeforeFile || !selectedAfterFile) {
            throw new Error('⚠️ Debes seleccionar ambas imágenes para el Antes y Después')
          }
          beforeUrl = await uploadFile(selectedBeforeFile, activeTenantId)
          afterUrl = await uploadFile(selectedAfterFile, activeTenantId)
          imageUrl = afterUrl // Fallback para vistas simples
        } else {
          if (!selectedFile) throw new Error('⚠️ Debes seleccionar una imagen')
          imageUrl = await uploadFile(selectedFile, activeTenantId)
          beforeUrl = ''
          afterUrl = ''
        }
      }

      if (editingPhoto) {
        const { error: updateError } = await supabase
          .from('gallery')
          .update({
            image_url: imageUrl,
            before_image_url: beforeUrl || null,
            after_image_url: afterUrl || null,
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
            image_url: imageUrl || null,
            before_image_url: beforeUrl || null,
            after_image_url: afterUrl || null,
            title: formData.title || null,
            category: formData.category || 'Nail Art',
            description: formData.description || null,
            is_active: formData.is_active,
            sort_order: formData.sort_order || 0
          })

        if (insertError) throw insertError
        setSuccess('✨ ¡Trabajo guardado exitosamente!')
      }

      await fetchPhotos(false)
      resetForm()
      setShowModal(false)

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado')
    } military {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'Nail Art',
      description: '',
      image_url: '',
      before_image_url: '',
      after_image_url: '',
      is_active: true,
      sort_order: 0
    })
    setSelectedFile(null)
    setPreviewUrl(null)
    setSelectedBeforeFile(null)
    setPreviewBeforeUrl(null)
    setSelectedAfterFile(null)
    setPreviewAfterUrl(null)
    setIsBeforeAfter(false)
    setEditingPhoto(null)
  }

  const deletePhoto = async (id: string, e?: React.MouseEvent, source?: string) => {
    if (e) e.stopPropagation()
    if (source === 'client') {
      setError('⚠️ No se pueden eliminar fotos de clientes')
      return
    }
    if (!confirm('¿Eliminar esta foto de la galería?')) return

    try {
      const { error } = await supabase.from('gallery').delete().eq('id', id)
      if (error) throw error
      setPhotos(photos.filter(p => p.id !== id))
      if (selectedPhoto?.id === id) {
        setShowLightbox(false)
        setSelectedPhoto(null)
      }
      setSuccess('🗑️ Foto eliminada')
    } catch (err: any) {
      setError('Error al eliminar la foto')
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean, e?: React.MouseEvent, source?: string) => {
    if (e) e.stopPropagation()
    if (source === 'client') return

    try {
      const { error } = await supabase.from('gallery').update({ is_active: !currentStatus }).eq('id', id)
      if (error) throw error
      setPhotos(photos.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p))
      setSuccess(currentStatus ? '👁️ Foto ocultada' : '👁️ Foto visible')
    } catch (err: any) {
      setError('Error al cambiar estado')
    }
  }

  const openLightbox = (photo: Photo) => {
    setSelectedPhoto(photo)
    setSliderPosition(50) // Resetear posición del slider interactivo
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

    let newIndex = direction === 'next' 
      ? (currentIndex + 1) % photosFiltradas.length
      : (currentIndex - 1 + photosFiltradas.length) % photosFiltradas.length
    
    setSelectedPhoto(photosFiltradas[newIndex])
    setSliderPosition(50)
  }

  const photosFiltradas = photos.filter(p => categoryFilter === 'Todas' || p.category === categoryFilter)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-1 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl p-[2px] shadow-2xl" style={brandGradient}>
        <div className="relative z-10 rounded-[23px] p-6 md:p-8 bg-white/95 dark:bg-[#0f0c1b]/95 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl text-white shadow-xl shrink-0" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}>
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold font-mono" style={{ color: settings?.primary_color || '#DB5B9A' }}>✨ Estudio Técnico</p>
                <h2 className="text-2xl md:text-4xl font-serif font-extrabold text-stone-900 dark:text-white mt-1">Control de Galería</h2>
                <p className="text-xs text-stone-500">{photos.length} publicaciones registradas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { resetForm(); setShowModal(true); }}
                className="px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2"
                style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Subir Contenido</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ALERTAS */}
      <AnimatePresence>
        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-500">{error}</div>}
        {success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-500">{success}</div>}
      </AnimatePresence>

      {/* CATEGORÍAS */}
      <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${
              categoryFilter === cat ? 'text-white shadow-lg' : 'text-stone-500 bg-white border dark:bg-[#130f24]'
            }`}
            style={categoryFilter === cat ? { backgroundColor: settings?.primary_color || '#DB5B9A' } : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* GRID DE PORTAFOLIO */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {photosFiltradas.map((photo) => {
          const hasBeforeAfter = photo.before_image_url && photo.after_image_url
          const imageToShow = photo.after_image_url || photo.image_url || photo.before_image_url || ''

          return (
            <div
              key={`${photo.source}-${photo.id}`}
              onClick={() => openLightbox(photo)}
              onMouseEnter={() => setHoveredId(photo.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-white dark:bg-[#130f24] border shadow-sm transition-all"
            >
              <img src={imageToShow} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              
              {/* Badge indicando tipo de formato */}
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className={`text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full text-white ${photo.source === 'client' ? 'bg-amber-500/90' : 'bg-pink-500/90'}`}>
                  {photo.source === 'client' ? '👤 Cliente' : '👑 Admin'}
                </span>
                {hasBeforeAfter && (
                  <span className="text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-600 text-white flex items-center gap-1">
                    <Scissors className="w-2 h-2" /> Slider
                  </span>
                )}
              </div>

              {/* Controles de acción rápida en Hover */}
              <AnimatePresence>
                {hoveredId === photo.id && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openLightbox(photo); }} className="p-2 bg-white/20 rounded-xl text-white hover:bg-white/40"><ZoomIn className="w-4 h-4" /></button>
                    {photo.source === 'admin' && (
                      <>
                        <button onClick={(e) => {
                          e.stopPropagation()
                          setEditingPhoto(photo)
                          setIsBeforeAfter(!!(photo.before_image_url && photo.after_image_url))
                          setFormData({
                            title: photo.title || '',
                            category: photo.category || 'Nail Art',
                            description: photo.description || '',
                            image_url: photo.image_url || '',
                            before_image_url: photo.before_image_url || '',
                            after_image_url: photo.after_image_url || '',
                            is_active: photo.is_active,
                            sort_order: photo.sort_order || 0
                          })
                          setShowModal(true)
                        }} className="p-2 bg-blue-500/40 rounded-xl text-white hover:bg-blue-500/70"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={(e) => toggleActive(photo.id, photo.is_active, e, photo.source)} className="p-2 bg-amber-500/40 rounded-xl text-white hover:bg-amber-500/70">{photo.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                        <button onClick={(e) => deletePhoto(photo.id, e, photo.source)} className="p-2 bg-red-500/40 rounded-xl text-white hover:bg-red-500"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* LIGHTBOX CON SLIDER INTERACTIVO INCORPORADO */}
      <AnimatePresence>
        {showLightbox && selectedPhoto && (
          <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4" onClick={closeLightbox}>
            <button onClick={closeLightbox} className="absolute top-6 right-6 p-3 rounded-2xl bg-white/10 text-white z-20"><X className="w-6 h-6" /></button>
            
            <div className="relative max-w-4xl w-full max-h-[80vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
              
              {selectedPhoto.before_image_url && selectedPhoto.after_image_url ? (
                /* RENDERIZADO DEL SLIDER INTERACTIVO "ANTES Y DESPUÉS" */
                <div className="relative w-full aspect-square max-h-[65vh] rounded-2xl overflow-hidden select-none border border-white/10">
                  {/* Foto del Después (Fondo) */}
                  <img src={selectedPhoto.after_image_url} alt="Después" className="w-full h-full object-contain pointer-events-none" />
                  
                  {/* Foto del Antes (Capa recortada superior) */}
                  <div 
                    className="absolute inset-0 top-0 left-0 overflow-hidden" 
                    style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                  >
                    <img src={selectedPhoto.before_image_url} alt="Antes" className="w-full h-full object-contain pointer-events-none" />
                  </div>

                  {/* Barra Deslizadora */}
                  <div className="absolute inset-0 w-full h-full flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={sliderPosition} 
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                    />
                    <div className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none z-20" style={{ left: `${sliderPosition}%` }}>
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-stone-900 font-bold text-xs flex items-center justify-center shadow-2xl border border-stone-200 pointer-events-none">
                        ↔
                      </div>
                    </div>
                  </div>

                  {/* Etiquetas informativas en las esquinas */}
                  <span className="absolute bottom-4 left-4 bg-black/70 text-white text-[10px] font-mono px-2 py-1 rounded-md z-10 border border-white/10">← ANTES</span>
                  <span className="absolute bottom-4 right-4 bg-black/70 text-white text-[10px] font-mono px-2 py-1 rounded-md z-10 border border-white/10">DESPUÉS →</span>
                </div>
              ) : (
                /* Imagen Fija Tradicional */
                <img src={selectedPhoto.image_url || ''} alt="" className="w-full h-full max-h-[65vh] object-contain rounded-2xl shadow-2xl" />
              )}

              {/* METADATOS INFERIORES */}
              <div className="w-full p-4 bg-stone-900/80 rounded-2xl mt-4 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold">{selectedPhoto.title || 'Trabajo Registrado'}</h4>
                    <p className="text-xs text-stone-400 mt-1">{selectedPhoto.description || 'Sin descripción adicional.'}</p>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/10">{selectedPhoto.category}</span>
                </div>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE SUBIDA / EDICIÓN RENOVADO */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setShowModal(false); resetForm(); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#130f24] border p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              
              <button onClick={() => { setShowModal(false); resetForm(); }} className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700"><X className="w-5 h-5" /></button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl text-white shadow-md" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}>
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-serif font-extrabold text-stone-800 dark:text-pink-100">
                  {editingPhoto ? 'Modificar Publicación' : 'Subir Nueva Obra'}
                </h3>
              </div>

              {/* Selector de formato (Solo visible al crear un registro nuevo) */}
              {!editingPhoto && (
                <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 dark:bg-stone-900 rounded-xl mb-4">
                  <button type="button" onClick={() => setIsBeforeAfter(false)} className={`py-2 text-xs font-bold rounded-lg transition-all ${!isBeforeAfter ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs' : 'text-stone-400'}`}>
                    Foto Estándar
                  </button>
                  <button type="button" onClick={() => setIsBeforeAfter(true)} className={`py-2 text-xs font-bold rounded-lg transition-all ${isBeforeAfter ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs' : 'text-stone-400'}`}>
                    Antes / Después
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* LOGICA DINÁMICA DE SUBIDA DE ARCHIVOS */}
                {!editingPhoto && (
                  isBeforeAfter ? (
                    /* DOBLE CONTROL DE ARCHIVO PARA ANTES Y DESPUÉS */
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-bold tracking-wider text-stone-500 mb-1">Foto del Antes *</label>
                        <div onClick={() => beforeFileInputRef.current?.click()} className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer min-h-[140px] flex flex-col justify-center items-center bg-stone-50/50 hover:bg-stone-50 dark:bg-stone-900/30">
                          <input ref={beforeFileInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelectGeneric(e, setSelectedBeforeFile, setPreviewBeforeUrl)} className="hidden" />
                          {previewBeforeUrl ? (
                            <img src={previewBeforeUrl} alt="Antes" className="max-h-24 rounded object-contain" />
                          ) : (
                            <>
                              <FileImage className="w-6 h-6 text-stone-400 mb-1" />
                              <span className="text-[10px] text-stone-500 font-medium">Subir Antes</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold tracking-wider text-stone-500 mb-1">Foto del Después *</label>
                        <div onClick={() => afterFileInputRef.current?.click()} className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer min-h-[140px] flex flex-col justify-center items-center bg-stone-50/50 hover:bg-stone-50 dark:bg-stone-900/30">
                          <input ref={afterFileInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelectGeneric(e, setSelectedAfterFile, setPreviewAfterUrl)} className="hidden" />
                          {previewAfterUrl ? (
                            <img src={previewAfterUrl} alt="Después" className="max-h-24 rounded object-contain" />
                          ) : (
                            <>
                              <FileImage className="w-6 h-6 text-stone-400 mb-1" />
                              <span className="text-[10px] text-stone-500 font-medium">Subir Después</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* CONTROL TRADICIONAL DE FOTO FIJA */
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1.5">Imagen Principal *</label>
                      <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer bg-stone-50/50 hover:bg-stone-50 dark:bg-stone-900/30">
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelectGeneric(e, setSelectedFile, setPreviewUrl)} className="hidden" />
                        {previewUrl ? (
                          <img src={previewUrl} alt="" className="max-h-40 mx-auto rounded-lg object-contain" />
                        ) : (
                          <div className="py-2">
                            <ImageIcon className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                            <p className="text-xs text-stone-600">Presiona para examinar el catálogo</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}

                {/* TÍTULO */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1">Título</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] text-sm" placeholder="Ej: Full Set Baby Boomer" />
                </div>

                {/* CATEGORÍA */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1">Categoría</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] text-sm">
                    {categories.filter(c => c !== 'Todas').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {/* DESCRIPCIÓN */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1">Detalles de la Obra</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] text-sm resize-none" placeholder="Especificaciones del servicio prestado..." />
                </div>

                {/* VISIBILIDAD Y ORDEN */}
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 rounded border-stone-300 text-pink-500 focus:ring-pink-500" />
                    <span className="text-xs font-medium text-stone-600">Publicar inmediatamente</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-stone-400">Prioridad:</span>
                    <input type="number" value={formData.sort_order} onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 border rounded-lg text-center text-xs bg-white" />
                  </div>
                </div>

                {/* BOTONES ACCIÓN ACCIONAR */}
                <div className="flex gap-3 pt-4 border-t dark:border-stone-800">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-2.5 rounded-xl border text-xs font-bold uppercase text-stone-600">Cancelar</button>
                  <button type="submit" disabled={uploading} className="flex-1 px-4 py-2.5 rounded-xl text-white text-xs font-bold uppercase flex items-center justify-center gap-2" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {uploading ? 'Procesando...' : 'Guardar'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
