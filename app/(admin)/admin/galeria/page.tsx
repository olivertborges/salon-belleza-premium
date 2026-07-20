'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
  FileImage, Layers, Search, SlidersHorizontal,
  Grid, BarChart3, RefreshCw, ArrowUpDown,
  Download, Share2, Info, CheckCircle2, AlertCircle
} from 'lucide-react'

// ==========================================
// DEFINICIÓN DE TIPOS E INTERFACES COMPLETAS
// ==========================================
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
  professional_name?: string | null
  client_name?: string | null
  client_id?: string | null
  before_image_url?: string | null
  after_image_url?: string | null
  price?: number | null
  polish_used?: string | null
  sensory_category?: string | null
  views?: number
  likes?: number
  sort_order?: number
  tags?: string[] | null
}

type Professional = {
  id: string
  full_name: string
  role?: string
}

type GalleryStats = {
  totalPhotos: number
  adminPhotos: number
  clientPhotos: number
  totalViews: number
  totalLikes: number
  beforeAfterCount: number
}

const categories = ['Todas', 'Nail Art', 'Acrílicas', 'Semipermanente', 'Esmaltado', 'Pedicuría', 'Micropigmentacion', 'Peluquería']
const sensoryCategories = ['Clásico', 'Audaz', 'Minimalista', 'Elegante', 'Glitter/Brillante', 'Nude/Natural', 'Temático']

export default function GaleriaAdminPage() {
  const { settings } = useSettings()
  const { tenantId, user, loading: authLoading } = useAuth()

  // Estados de carga y datos principales
  const [photos, setPhotos] = useState<Photo[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // Estados de filtros avanzados, orden y búsquedas
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [sensoryFilter, setSensoryFilter] = useState('Todos')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'admin' | 'client'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'views' | 'likes' | 'order'>('date_desc')
  const [viewMode, setViewMode] = useState<'grid' | 'masonry' | 'compact'>('grid')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showStatsPanel, setShowStatsPanel] = useState(false)

  // Estados de modales y visualización (Lightbox)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showLightbox, setShowLightbox] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)

  // Mensajes de feedback del sistema
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Estados para archivos multimedia y previsualizaciones (Soporta Normal o Antes/Después)
  const [isBeforeAfter, setIsBeforeAfter] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedBeforeFile, setSelectedBeforeFile] = useState<File | null>(null)
  const [previewBeforeUrl, setPreviewBeforeUrl] = useState<string | null>(null)
  const [selectedAfterFile, setSelectedAfterFile] = useState<File | null>(null)
  const [previewAfterUrl, setPreviewAfterUrl] = useState<string | null>(null)

  // Referencias HTML
  const fileInputRef = useRef<HTMLInputElement>(null)
  const beforeFileInputRef = useRef<HTMLInputElement>(null)
  const afterFileInputRef = useRef<HTMLInputElement>(null)

  // Datos estructurados del formulario
  const [formData, setFormData] = useState({
    title: '',
    category: 'Nail Art',
    sensory_category: 'Clásico',
    description: '',
    image_url: '',
    before_image_url: '',
    after_image_url: '',
    is_active: true,
    sort_order: 0,
    professional_id: '',
    price: '',
    polish_used: '',
    tagsInput: ''
  })

  // Estilos de marca dinámicos basados en la configuración del Tenant
  const brandGradient = useMemo(() => ({
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }), [settings])

  const primaryBgStyle = useMemo(() => ({
    backgroundColor: settings?.primary_color || '#DB5B9A'
  }), [settings])

  // Resolución segura del Tenant ID mediante fallback encadenado
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

  // Cargar lista de profesionales para asignaciones en la galería
  const fetchProfessionals = useCallback(async (activeTenantId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('tenant_id', activeTenantId)
        .order('full_name', { ascending: true })

      if (!error && data) {
        setProfessionals(data)
      }
    } catch (err) {
      console.error('Error cargando profesionales:', err)
    }
  }, [])

  // CARGAR FOTOS DE MÚLTIPLES ORÍGENES (ADMIN Y CLIENTES) CON TODA LA DATA ASOCIADA
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

      // Disparar la carga de profesionales en paralelo
      fetchProfessionals(activeTenantId)

      let allPhotos: Photo[] = []

      // 1. Extracción de datos desde la galería del Administrador
      const { data: adminPhotos, error: adminError } = await supabase
        .from('gallery')
        .select('*')
        .eq('tenant_id', activeTenantId)

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
          client_name: p.client_name || null,
          client_id: p.client_id || null,
          price: p.price || null,
          polish_used: p.polish_used || null,
          sensory_category: p.sensory_category || 'Clásico',
          views: p.views || 0,
          likes: p.likes || 0,
          sort_order: p.sort_order || 0,
          tags: p.tags || []
        }))
        allPhotos = [...allPhotos, ...mappedAdminPhotos]
      }

      // 2. Extracción de datos desde la galería de aportes de Clientes
      const { data: clientPhotos, error: clientError } = await supabase
        .from('client_gallery')
        .select('*')
        .eq('tenant_id', activeTenantId)

      if (clientError) {
        console.error('Error cargando fotos de clientes:', clientError)
      } else if (clientPhotos) {
        const mappedClientPhotos = clientPhotos.map((p: any) => ({
          id: p.id,
          image_url: p.after_image_url || p.image_url || p.before_image_url || '',
          title: p.title || 'Aporte de Cliente',
          category: p.category || 'Nail Art',
          sensory_category: p.sensory_category || 'Clásico',
          description: p.description || '',
          is_active: p.is_active !== undefined ? p.is_active : true,
          created_at: p.created_at,
          source: 'client' as const,
          professional_id: p.professional_id || null,
          client_name: p.client_name || 'Cliente Anónimo',
          client_id: p.client_id || null,
          before_image_url: p.before_image_url || null,
          after_image_url: p.after_image_url || null,
          price: p.price || null,
          polish_used: p.polish_used || null,
          views: p.views || 0,
          likes: p.likes || 0,
          sort_order: p.sort_order || 0,
          tags: p.tags || []
        }))
        allPhotos = [...allPhotos, ...mappedClientPhotos]
      }

      setPhotos(allPhotos)

    } catch (err: any) {
      setError('No se pudo sincronizar la galería multimedia.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [getTenantId, fetchProfessionals])

  useEffect(() => {
    fetchPhotos(true)
  }, [fetchPhotos])

  // Mapear nombres de profesionales de forma optimizada
  const professionalMap = useMemo(() => {
    const map: Record<string, string> = {}
    professionals.forEach(p => {
      map[p.id] = p.full_name
    })
    return map
  }, [professionals])

  // CÁLCULO DE MÉTRICAS Y ESTADÍSTICAS DEL PANEL INTACTO
  const stats = useMemo<GalleryStats>(() => {
    return photos.reduce((acc, current) => {
      acc.totalPhotos++
      if (current.source === 'admin') acc.adminPhotos++
      if (current.source === 'client') acc.clientPhotos++
      if (current.before_image_url && current.after_image_url) acc.beforeAfterCount++
      acc.totalViews += (current.views || 0)
      acc.totalLikes += (current.likes || 0)
      return acc
    }, { totalPhotos: 0, adminPhotos: 0, clientPhotos: 0, totalViews: 0, totalLikes: 0, beforeAfterCount: 0 })
  }, [photos])

  // MOTOR FILTRADO Y ORDENAMIENTO COMPLETO Y AVANZADO
  const filteredAndSortedPhotos = useMemo(() => {
    let result = [...photos]

    // Filtro por Categorías principales
    if (categoryFilter !== 'Todas') {
      result = result.filter(p => p.category === categoryFilter)
    }

    // Filtro por Categoría Sensorial / Estilo
    if (sensoryFilter !== 'Todos') {
      result = result.filter(p => p.sensory_category === sensoryFilter)
    }

    // Filtro de Origen
    if (sourceFilter !== 'all') {
      result = result.filter(p => p.source === sourceFilter)
    }

    // Filtro por Estado de Visibilidad pública
    if (statusFilter !== 'all') {
      const targetStatus = statusFilter === 'active'
      result = result.filter(p => p.is_active === targetStatus)
    }

    // Buscador global por texto (títulos, descripciones, etiquetas, esmaltes)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.polish_used && p.polish_used.toLowerCase().includes(q)) ||
        (p.client_name && p.client_name.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      )
    }

    // Clasificación y ordenamiento avanzado de datos
    result.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0)
      if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0)
      if (sortBy === 'order') return (a.sort_order || 0) - (b.sort_order || 0)
      return 0
    })

    return result
  }, [photos, categoryFilter, sensoryFilter, sourceFilter, statusFilter, searchQuery, sortBy])

  // MANEJO DE SUBIDAS A STORAGE
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
      setError('⚠️ Por favor selecciona un formato de imagen válido (PNG, JPEG, WEBP).')
      return
    }

    setFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  // SUBMIT COMPLETO SIN SIMPLIFICACIONES (MANEJA LA METADATA AVANZADA Y ANTES/DESPUÉS)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const activeTenantId = await getTenantId()
      if (!activeTenantId) throw new Error('⚠️ Sesión o Salón no válido.')

      setUploading(true)

      let imageUrl = formData.image_url
      let beforeUrl = formData.before_image_url
      let afterUrl = formData.after_image_url

      // Procesar carga si es un elemento nuevo
      if (!editingPhoto) {
        if (isBeforeAfter) {
          if (!selectedBeforeFile || !selectedAfterFile) {
            throw new Error('⚠️ Es obligatorio cargar ambas capturas para el formato interactivo.')
          }
          beforeUrl = await uploadFile(selectedBeforeFile, activeTenantId)
          afterUrl = await uploadFile(selectedAfterFile, activeTenantId)
          imageUrl = afterUrl
        } else {
          if (!selectedFile) throw new Error('⚠️ Debes seleccionar una imagen para la publicación.')
          imageUrl = await uploadFile(selectedFile, activeTenantId)
          beforeUrl = ''
          afterUrl = ''
        }
      } else {
        // En caso de edición, si se seleccionaron archivos nuevos, se reemplazan
        if (isBeforeAfter) {
          if (selectedBeforeFile) beforeUrl = await uploadFile(selectedBeforeFile, activeTenantId)
          if (selectedAfterFile) {
            afterUrl = await uploadFile(selectedAfterFile, activeTenantId)
            imageUrl = afterUrl
          }
        } else {
          if (selectedFile) imageUrl = await uploadFile(selectedFile, activeTenantId)
        }
      }

      // Procesamiento de etiquetas (Tags) split por comas
      const tagsArray = formData.tagsInput
        ? formData.tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t !== '')
        : []

      const payload = {
        tenant_id: activeTenantId,
        professional_id: formData.professional_id || null,
        image_url: imageUrl || null,
        before_image_url: beforeUrl || null,
        after_image_url: afterUrl || null,
        title: formData.title || null,
        category: formData.category,
        sensory_category: formData.sensory_category,
        description: formData.description || null,
        is_active: formData.is_active,
        sort_order: formData.sort_order || 0,
        price: formData.price ? parseFloat(formData.price) : null,
        polish_used: formData.polish_used || null,
        tags: tagsArray
      }

      if (editingPhoto) {
        const { error: updateError } = await supabase
          .from('gallery')
          .update(payload)
          .eq('id', editingPhoto.id)
          .eq('tenant_id', activeTenantId)

        if (updateError) throw updateError
        setSuccess('✨ Publicación de portafolio actualizada correctamente.')
      } else {
        const { error: insertError } = await supabase
          .from('gallery')
          .insert(payload)

        if (insertError) throw insertError
        setSuccess('✨ Nueva obra guardada y añadida al catálogo.')
      }

      await fetchPhotos(false)
      resetForm()
      setShowModal(false)

    } catch (err: any) {
      setError(err.message || 'Error al guardar la información en la galería.')
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'Nail Art',
      sensory_category: 'Clásico',
      description: '',
      image_url: '',
      before_image_url: '',
      after_image_url: '',
      is_active: true,
      sort_order: 0,
      professional_id: '',
      price: '',
      polish_used: '',
      tagsInput: ''
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
      setError('⚠️ Las fotos de reseñas de clientes deben ser moderadas desde el módulo de valoraciones.')
      return
    }
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente este registro de la galería?')) return

    try {
      const { error } = await supabase.from('gallery').delete().eq('id', id)
      if (error) throw error
      setPhotos(photos.filter(p => p.id !== id))
      if (selectedPhoto?.id === id) closeLightbox()
      setSuccess('🗑️ Registro purgado de las bases de datos.')
    } catch (err) {
      setError('No se pudo ejecutar la eliminación del archivo.')
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean, e?: React.MouseEvent, source?: string) => {
    if (e) e.stopPropagation()
    const targetTable = source === 'client' ? 'client_gallery' : 'gallery'

    try {
      const { error } = await supabase
        .from(targetTable)
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      setPhotos(photos.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p))
      setSuccess(!currentStatus ? '👁️ El elemento ahora es visible de cara al público.' : '👁️ Publicación oculta del portafolio público.')
    } catch (err) {
      setError('No se pudo alterar el estado de visibilidad.')
    }
  }

  // ACCIONES DE NAVEGACIÓN COMPLETA DE LIGHTBOX
  const openLightbox = (photo: Photo) => {
    const index = filteredAndSortedPhotos.findIndex(p => p.id === photo.id)
    setSelectedPhoto(photo)
    setLightboxIndex(index !== -1 ? index : 0)
    setSliderPosition(50)
    setShowLightbox(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setShowLightbox(false)
    setSelectedPhoto(null)
    document.body.style.overflow = 'auto'
  }

  const navigateLightbox = (direction: 'next' | 'prev') => {
    if (filteredAndSortedPhotos.length === 0) return
    let newIndex = direction === 'next' ? lightboxIndex + 1 : lightboxIndex - 1
    
    if (newIndex >= filteredAndSortedPhotos.length) newIndex = 0
    if (newIndex < 0) newIndex = filteredAndSortedPhotos.length - 1

    setLightboxIndex(newIndex)
    setSelectedPhoto(filteredAndSortedPhotos[newIndex])
    setSliderPosition(50)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-4 max-w-7xl mx-auto dark:text-stone-100">
      
      {/* HEADER COMPLETO ORIGINAL */}
      <div className="relative overflow-hidden rounded-3xl p-[2px] shadow-2xl" style={brandGradient}>
        <div className="relative z-10 rounded-[23px] p-6 md:p-8 bg-white/95 dark:bg-[#0f0c1b]/95 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl text-white shadow-xl shrink-0" style={primaryBgStyle}>
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold font-mono" style={{ color: settings?.primary_color || '#DB5B9A' }}>✨ Catálogo Técnico y Curaduría</p>
                <h2 className="text-2xl md:text-4xl font-serif font-extrabold text-stone-900 dark:text-white mt-1">Control de Galería</h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Administra el portafolio comercial, visualiza métricas de impacto y aprueba multimedia de clientes.</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={() => setShowStatsPanel(!showStatsPanel)}
                className="p-2.5 rounded-xl border bg-white dark:bg-[#130f24] hover:bg-stone-50 text-stone-600 dark:text-stone-300 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
              >
                <BarChart3 className="w-4 h-4" />
                <span>{showStatsPanel ? 'Ocultar Métricas' : 'Métricas'}</span>
              </button>

              <button 
                onClick={() => fetchPhotos(false)}
                disabled={refreshing}
                className="p-2.5 rounded-xl border bg-white dark:bg-[#130f24] hover:bg-stone-50 text-stone-600 dark:text-stone-300"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button 
                onClick={() => { resetForm(); setShowModal(true); }}
                className="px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 transition-transform hover:scale-[1.02]"
                style={primaryBgStyle}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Subir Contenido</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DE MÉTRICAS E HISTOGRAMA DE VISTAS COMPLETO */}
      <AnimatePresence>
        {showStatsPanel && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-5 bg-stone-50 dark:bg-[#130f24] rounded-2xl border border-stone-200/60 dark:border-stone-800">
              <div className="p-4 bg-white dark:bg-[#0f0c1b] rounded-xl border shadow-xs">
                <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Total Portafolio</p>
                <p className="text-xl font-bold mt-1 text-stone-800 dark:text-white">{stats.totalPhotos}</p>
              </div>
              <div className="p-4 bg-white dark:bg-[#0f0c1b] rounded-xl border shadow-xs">
                <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Por el Salón</p>
                <p className="text-xl font-bold mt-1 text-pink-500">{stats.adminPhotos}</p>
              </div>
              <div className="p-4 bg-white dark:bg-[#0f0c1b] rounded-xl border shadow-xs">
                <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Por Clientes</p>
                <p className="text-xl font-bold mt-1 text-amber-500">{stats.clientPhotos}</p>
              </div>
              <div className="p-4 bg-white dark:bg-[#0f0c1b] rounded-xl border shadow-xs">
                <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Antes y Después</p>
                <p className="text-xl font-bold mt-1 text-purple-500">{stats.beforeAfterCount}</p>
              </div>
              <div className="p-4 bg-white dark:bg-[#0f0c1b] rounded-xl border shadow-xs">
                <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Impresiones / Vistas</p>
                <p className="text-xl font-bold mt-1 text-blue-500 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> {stats.totalViews}
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-[#0f0c1b] rounded-xl border shadow-xs">
                <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Interacciones (Likes)</p>
                <p className="text-xl font-bold mt-1 text-red-500 flex items-center gap-1">
                  <Heart className="w-4 h-4 fill-red-500 text-red-500" /> {stats.totalLikes}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMPONENTE DE SEGUIMIENTO DE NOTIFICACIONES */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> <span>{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BLOQUE DE CONTROLES: BARRA DE BÚSQUEDA Y FILTROS INTEGRADOS */}
      <div className="bg-white dark:bg-[#130f24] rounded-2xl border p-4 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Buscar por título, etiquetas, técnica, esmalte utilizado o cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-stone-50/50 dark:bg-[#0f0c1b] text-xs focus:ring-1 focus:ring-stone-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${showAdvancedFilters ? 'bg-stone-100 dark:bg-stone-800' : 'bg-white dark:bg-[#130f24]'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtros</span>
            </button>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl border bg-white dark:bg-[#130f24] text-xs font-medium"
            >
              <option value="date_desc">Más recientes primero</option>
              <option value="date_asc">Más antiguos primero</option>
              <option value="views">Mayor popularidad (Vistas)</option>
              <option value="likes">Más valorados (Likes)</option>
              <option value="order">Orden manual estricto</option>
            </select>

            <div className="border rounded-xl p-1 flex items-center gap-1 bg-stone-50 dark:bg-stone-900">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-white dark:bg-stone-800 shadow-xs' : 'text-stone-400'}`}><Grid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('masonry')} className={`p-1.5 rounded-lg ${viewMode === 'masonry' ? 'bg-white dark:bg-stone-800 shadow-xs' : 'text-stone-400'}`}><LayoutGrid className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* FILTROS AVANZADOS EXPANDIBLES ORIGINALES */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pt-3 border-t dark:border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Origen del Archivo</label>
                <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as any)} className="w-full p-2 rounded-xl border bg-stone-50 text-xs">
                  <option value="all">Todos los orígenes (Admin + Clientes)</option>
                  <option value="admin">Creados únicamente por el Administrador</option>
                  <option value="client">Subidos por Clientes / Reseñas</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Filtro Sensorial o Estilo</label>
                <select value={sensoryFilter} onChange={(e) => setSensoryFilter(e.target.value)} className="w-full p-2 rounded-xl border bg-stone-50 text-xs">
                  <option value="Todos">Todos los estilos estéticos</option>
                  {sensoryCategories.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Visibilidad Comercial</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full p-2 rounded-xl border bg-stone-50 text-xs">
                  <option value="all">Ver todo el catálogo</option>
                  <option value="active">Solo elementos visibles en web</option>
                  <option value="inactive">Solo elementos archivados/ocultos</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SELECTOR RAPIDO DE CATEGORIAS - CORREGIDO DEFINITIVAMENTE */}
      <div className="w-full overflow-visible">
        <div className="flex flex-wrap gap-1.5 w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                categoryFilter === cat ? 'text-white shadow-md font-extrabold' : 'text-stone-500 bg-white border dark:bg-[#130f24]'
              }`}
              style={categoryFilter === cat ? primaryBgStyle : {}}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* RENDERIZADO DE CONTENIDO: SOPORTE MASONRY O REGULAR GRID */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-400">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: settings?.primary_color || '#DB5B9A' }} />
          <p className="text-xs font-medium">Procesando portafolio comercial...</p>
        </div>
      ) : filteredAndSortedPhotos.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-stone-50/50 dark:bg-[#130f24]/30">
          <ImageIcon className="w-10 h-10 mx-auto text-stone-300 mb-2" />
          <p className="text-sm font-medium text-stone-500">No se encontraron registros que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className={viewMode === 'masonry' ? 'columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4' : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'}>
          {filteredAndSortedPhotos.map((photo) => {
            const isSlider = photo.before_image_url && photo.after_image_url
            const currentThumbnail = photo.after_image_url || photo.image_url || ''

            return (
              <div
                key={`${photo.source}-${photo.id}`}
                onClick={() => openLightbox(photo)}
                onMouseEnter={() => setHoveredId(photo.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer bg-white dark:bg-[#130f24] border shadow-xs transition-all ${
                  viewMode === 'masonry' ? 'break-inside-avoid mb-4' : 'aspect-square'
                } ${!photo.is_active ? 'opacity-60 grayscale-[30%]' : ''}`}
              >
                <img 
                  src={currentThumbnail} 
                  alt={photo.title || ''} 
                  className={`w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ${viewMode === 'masonry' ? 'h-auto max-h-[450px]' : ''}`}
                />
                
                {/* Badges superiores de metadata */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[85%]">
                  <span className={`text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md text-white shadow-xs ${photo.source === 'client' ? 'bg-amber-500/95' : 'bg-pink-500/95'}`}>
                    {photo.source === 'client' ? `👤 ${photo.client_name || 'Cliente'}` : '👑 Studio'}
                  </span>
                  {isSlider && (
                    <span className="text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-600 text-white flex items-center gap-1 shadow-xs">
                      <Scissors className="w-2.5 h-2.5" /> Slider
                    </span>
                  )}
                  {!photo.is_active && (
                    <span className="text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-900/90 text-white">
                      Oculto
                    </span>
                  )}
                </div>

                {/* Overlays de control avanzados en Hover */}
                <AnimatePresence>
                  {hoveredId === photo.id && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-950/70 p-3 flex flex-col justify-between text-white">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); openLightbox(photo); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"><ZoomIn className="w-3.5 h-3.5" /></button>
                        {photo.source === 'admin' && (
                          <>
                            <button onClick={(e) => {
                              e.stopPropagation()
                              setEditingPhoto(photo)
                              setIsBeforeAfter(!!(photo.before_image_url && photo.after_image_url))
                              setFormData({
                                title: photo.title || '',
                                category: photo.category || 'Nail Art',
                                sensory_category: photo.sensory_category || 'Clásico',
                                description: photo.description || '',
                                image_url: photo.image_url || '',
                                before_image_url: photo.before_image_url || '',
                                after_image_url: photo.after_image_url || '',
                                is_active: photo.is_active,
                                sort_order: photo.sort_order || 0,
                                professional_id: photo.professional_id || '',
                                price: photo.price ? photo.price.toString() : '',
                                polish_used: photo.polish_used || '',
                                tagsInput: photo.tags ? photo.tags.join(', ') : ''
                              })
                              setShowModal(true)
                            }} className="p-2 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30 rounded-xl transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={(e) => toggleActive(photo.id, photo.is_active, e, photo.source)} className="p-2 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/30 rounded-xl transition-all">{photo.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</button>
                            <button onClick={(e) => deletePhoto(photo.id, e, photo.source)} className="p-2 bg-red-500/20 hover:bg-red-600 border border-red-500/30 rounded-xl transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-bold truncate line-clamp-1">{photo.title || 'Trabajo del Salón'}</h4>
                        <p className="text-[10px] text-stone-300 truncate line-clamp-1 mt-0.5">{photo.category} • {photo.sensory_category}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[9px] text-stone-400 font-mono border-t border-white/10 pt-1.5">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {photo.views || 0}</span>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {photo.likes || 0}</span>
                          {photo.price && <span className="flex items-center text-emerald-400">${photo.price}</span>}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      {/* LIGHTBOX AVANZADO CON INTERACCIÓN ANTES/DESPUÉS Y NAVEGACIÓN COMPLETA */}
      <AnimatePresence>
        {showLightbox && selectedPhoto && (
          <div className="fixed inset-0 z-[9999] bg-stone-950/95 backdrop-blur-xl flex flex-col md:flex-row" onClick={closeLightbox}>
            
            {/* Contenedor Visual Principal */}
            <div className="relative flex-1 flex items-center justify-center p-4 h-[65vh] md:h-full" onClick={(e) => e.stopPropagation()}>
              <button onClick={closeLightbox} className="absolute top-6 right-6 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white z-50 md:hidden"><X className="w-5 h-5" /></button>
              
              {/* Controles Laterales de Navegación del Carrusel */}
              <button onClick={() => navigateLightbox('prev')} className="absolute left-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all z-40"><ChevronLeft className="w-6 h-6" /></button>
              <button onClick={() => navigateLightbox('next')} className="absolute right-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all z-40"><ChevronRight className="w-6 h-6" /></button>

              {selectedPhoto.before_image_url && selectedPhoto.after_image_url ? (
                /* COMPONENTE INTERACTIVO DE DESLIZAMIENTO (SLIDER) REAL */
                <div className="relative w-full max-w-2xl aspect-square md:max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl bg-stone-900 border border-white/5 select-none">
                  <img src={selectedPhoto.after_image_url} alt="Después" className="w-full h-full object-cover pointer-events-none" />
                  
                  <div 
                    className="absolute inset-0 top-0 left-0 overflow-hidden" 
                    style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                  >
                    <img src={selectedPhoto.before_image_url} alt="Antes" className="w-full h-full object-cover pointer-events-none" />
                  </div>

                  {/* Input Invisible del Slider */}
                  <div className="absolute inset-0 w-full h-full flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={sliderPosition} 
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                    />
                    {/* Línea Divisoria */}
                    <div className="absolute top-0 bottom-0 w-[2px] bg-white shadow-xl pointer-events-none z-20" style={{ left: `${sliderPosition}%` }}>
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-stone-900 font-bold text-xs flex items-center justify-center shadow-2xl border border-stone-300 pointer-events-none">
                        ↔
                      </div>
                    </div>
                  </div>

                  <span className="absolute bottom-4 left-4 bg-stone-950/80 text-white text-[9px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-md z-10 border border-white/10">← ANTES</span>
                  <span className="absolute bottom-4 right-4 bg-stone-950/80 text-white text-[9px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-md z-10 border border-white/10">DESPUÉS →</span>
                </div>
              ) : (
                /* Imagen Fija Tradicional */
                <img src={selectedPhoto.image_url || ''} alt={selectedPhoto.title || ''} className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
              )}
            </div>

            {/* Barra de Información Lateral (Metadata Detallada) Intacta */}
            <div className="w-full md:w-96 bg-stone-900 md:h-full overflow-y-auto p-6 flex flex-col justify-between text-stone-200 border-t md:border-t-0 md:border-l border-white/10" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-6">
                <div className="hidden md:flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Detalle Técnico</span>
                  <button onClick={closeLightbox} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>

                <div>
                  <span className="px-2.5 py-1 bg-white/10 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider">{selectedPhoto.category}</span>
                  <h3 className="text-xl font-serif font-bold text-white mt-3">{selectedPhoto.title || 'Trabajo sin Título'}</h3>
                  <p className="text-xs text-stone-400 mt-2 leading-relaxed">{selectedPhoto.description || 'Sin descripción técnica añadida.'}</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Estilo:</span>
                    <span className="font-medium text-white">{selectedPhoto.sensory_category || 'Clásico'}</span>
                  </div>
                  
                  {selectedPhoto.professional_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Profesional:</span>
                      <span className="font-medium text-white">{professionalMap[selectedPhoto.professional_id] || 'Asignado'}</span>
                    </div>
                  )}

                  {selectedPhoto.polish_used && (
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Material / Esmalte:</span>
                      <span className="font-medium text-pink-400 font-mono">{selectedPhoto.polish_used}</span>
                    </div>
                  )}

                  {selectedPhoto.price && (
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Valor Comercial:</span>
                      <span className="font-bold text-emerald-400">${selectedPhoto.price}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Registro:</span>
                    <span className="font-mono text-stone-300">{new Date(selectedPhoto.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <span className="block text-[10px] uppercase font-bold text-stone-400 mb-2 font-mono">Etiquetas de Búsqueda</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedPhoto.tags.map(t => <span key={t} className="px-2 py-0.5 bg-white/5 border border-white/5 text-stone-300 rounded text-[9px] font-mono">#{t}</span>)}
                    </div>
                  </div>
                )}
              </div>

              {/* Acciones del Administrador sobre la foto en Lightbox */}
              {selectedPhoto.source === 'admin' && (
                <div className="pt-6 border-t border-white/10 flex gap-2">
                  <button 
                    onClick={(e) => {
                      closeLightbox()
                      setEditingPhoto(selectedPhoto)
                      setIsBeforeAfter(!!(selectedPhoto.before_image_url && selectedPhoto.after_image_url))
                      setFormData({
                        title: selectedPhoto.title || '',
                        category: selectedPhoto.category || 'Nail Art',
                        sensory_category: selectedPhoto.sensory_category || 'Clásico',
                        description: selectedPhoto.description || '',
                        image_url: selectedPhoto.image_url || '',
                        before_image_url: selectedPhoto.before_image_url || '',
                        after_image_url: selectedPhoto.after_image_url || '',
                        is_active: selectedPhoto.is_active,
                        sort_order: selectedPhoto.sort_order || 0,
                        professional_id: selectedPhoto.professional_id || '',
                        price: selectedPhoto.price ? selectedPhoto.price.toString() : '',
                        polish_used: selectedPhoto.polish_used || '',
                        tagsInput: selectedPhoto.tags ? selectedPhoto.tags.join(', ') : ''
                      })
                      setShowModal(true)
                    }}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" /> Editar Obra
                  </button>
                  <button 
                    onClick={(e) => deletePhoto(selectedPhoto.id, e, selectedPhoto.source)}
                    className="p-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </AnimatePresence>

      {/* MODAL COMPLETO DE SUBIDA / EDICIÓN CON TODA LA METADATA ORIGINAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[9999] bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => { setShowModal(false); resetForm(); }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              onClick={(e) => e.stopPropagation()} 
              className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#130f24] border border-stone-200 dark:border-stone-800 p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              <button onClick={() => { setShowModal(false); resetForm(); }} className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"><X className="w-5 h-5" /></button>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl text-white shadow-md" style={primaryBgStyle}>
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-serif font-extrabold text-stone-900 dark:text-white">
                  {editingPhoto ? 'Modificar Registro de Obra' : 'Subir Nueva Creación al Portafolio'}
                </h3>
              </div>

              {/* Selector de formato dinámico */}
              {!editingPhoto && (
                <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 dark:bg-stone-900/60 rounded-xl mb-4 border">
                  <button type="button" onClick={() => setIsBeforeAfter(false)} className={`py-2 text-xs font-bold rounded-lg transition-all ${!isBeforeAfter ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs' : 'text-stone-400 dark:text-stone-500'}`}>
                    Imagen Estándar / Galería Simple
                  </button>
                  <button type="button" onClick={() => setIsBeforeAfter(true)} className={`py-2 text-xs font-bold rounded-lg transition-all ${isBeforeAfter ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs' : 'text-stone-400 dark:text-stone-500'}`}>
                    Formato Interactivo Antes/Después
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* INTERFAZ DINÁMICA DE MULTIMEDIA */}
                {isBeforeAfter ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400 mb-1 font-mono">Foto del Antes (Estado inicial) *</label>
                      <div onClick={() => beforeFileInputRef.current?.click()} className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer min-h-[130px] flex flex-col justify-center items-center bg-stone-50/50 hover:bg-stone-100/50 dark:bg-stone-900/20 border-stone-200 dark:border-stone-800 transition-colors">
                        <input ref={beforeFileInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelectGeneric(e, setSelectedBeforeFile, setPreviewBeforeUrl)} className="hidden" />
                        {previewBeforeUrl ? (
                          <div className="relative group">
                            <img src={previewBeforeUrl} alt="Antes" className="max-h-24 rounded object-contain mx-auto" />
                            <p className="text-[8px] text-stone-400 mt-1 font-mono">Haga clic para cambiar</p>
                          </div>
                        ) : formData.before_image_url ? (
                          <img src={formData.before_image_url} alt="Antes actual" className="max-h-24 rounded object-contain mx-auto" />
                        ) : (
                          <>
                            <FileImage className="w-5 h-5 text-stone-400 mb-1" />
                            <span className="text-[10px] text-stone-500 font-medium">Examinar Antes</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400 mb-1 font-mono">Foto del Después (Resultado) *</label>
                      <div onClick={() => afterFileInputRef.current?.click()} className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer min-h-[130px] flex flex-col justify-center items-center bg-stone-50/50 hover:bg-stone-100/50 dark:bg-stone-900/20 border-stone-200 dark:border-stone-800 transition-colors">
                        <input ref={afterFileInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelectGeneric(e, setSelectedAfterFile, setPreviewAfterUrl)} className="hidden" />
                        {previewAfterUrl ? (
                          <div className="relative group">
                            <img src={previewAfterUrl} alt="Después" className="max-h-24 rounded object-contain mx-auto" />
                            <p className="text-[8px] text-stone-400 mt-1 font-mono">Haga clic para cambiar</p>
                          </div>
                        ) : formData.after_image_url ? (
                          <img src={formData.after_image_url} alt="Después actual" className="max-h-24 rounded object-contain mx-auto" />
                        ) : (
                          <>
                            <FileImage className="w-5 h-5 text-stone-400 mb-1" />
                            <span className="text-[10px] text-stone-500 font-medium">Examinar Después</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5 font-mono">Imagen de Trabajo Principal *</label>
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer bg-stone-50/50 hover:bg-stone-100/50 dark:bg-stone-900/20 border-stone-200 dark:border-stone-800 transition-colors">
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelectGeneric(e, setSelectedFile, setPreviewUrl)} className="hidden" />
                      {previewUrl ? (
                        <img src={previewUrl} alt="" className="max-h-36 mx-auto rounded-xl object-contain" />
                      ) : formData.image_url ? (
                        <img src={formData.image_url} alt="" className="max-h-36 mx-auto rounded-xl object-contain" />
                      ) : (
                        <div className="py-2">
                          <ImageIcon className="w-7 h-7 mx-auto text-stone-400 mb-1" />
                          <p className="text-xs text-stone-600 dark:text-stone-300">Presiona para cargar el archivo multimedia</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* FILA DE TEXTOS BÁSICOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1 font-mono">Título del Servicio</label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 rounded-xl border bg-white dark:bg-[#0f0c1b] text-xs focus:ring-1" placeholder="Ej: Kapping Gel con Deco Francesa" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1 font-mono">Profesional que Ejecutó</label>
                    <select value={formData.professional_id} onChange={(e) => setFormData({...formData, professional_id: e.target.value})} className="w-full px-4 py-2 rounded-xl border bg-white dark:bg-[#0f0c1b] text-xs">
                      <option value="">No asignar / Salón General</option>
                      {professionals.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                    </select>
                  </div>
                </div>

                {/* FILA DE METADATA AVANZADA COMPLETA ORIGINAL */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="col-span-1">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1 font-mono">Categoría Principal</label>
                    <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 rounded-xl border bg-white text-xs">
                      {categories.filter(c => c !== 'Todas').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1 font-mono">Estilo / Sensorial</label>
                    <select value={formData.sensory_category} onChange={(e) => setFormData({...formData, sensory_category: e.target.value})} className="w-full px-3 py-2 rounded-xl border bg-white text-xs">
                      {sensoryCategories.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1 font-mono">Precio de Venta (Ref)</label>
                    <input type="number" step="any" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-3 py-2 rounded-xl border bg-white text-xs" placeholder="Ej: 2500" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1 font-mono">Material / Esmalte</label>
                    <input type="text" value={formData.polish_used} onChange={(e) => setFormData({...formData, polish_used: e.target.value})} className="w-full px-3 py-2 rounded-xl border bg-white text-xs" placeholder="Ej: OPI Sec 22" />
                  </div>
                </div>

                {/* INPUT DE ETIQUETAS / TAGS COMAS COMPLETO */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1 font-mono">Etiquetas Clave (Separadas por comas)</label>
                  <input type="text" value={formData.tagsInput} onChange={(e) => setFormData({...formData, tagsInput: e.target.value})} className="w-full px-4 py-2 rounded-xl border bg-white dark:bg-[#0f0c1b] text-xs" placeholder="Ej: matte, stiletto, neón, halloween" />
                </div>

                {/* DESCRIPCIÓN */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1 font-mono">Descripción Técnica Ampliada</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} className="w-full px-4 py-2 rounded-xl border bg-white dark:bg-[#0f0c1b] text-xs resize-none" placeholder="Escribe detalles técnicos, duración del proceso o cuidados requeridos..." />
                </div>

                {/* VISIBILIDAD Y PRIORIDAD DE ORDENAMIENTO */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 rounded border-stone-300 text-pink-500 focus:ring-0" />
                    <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Habilitar visibilidad inmediata en catálogo comercial</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-stone-400">Orden (Sort):</span>
                    <input type="number" value={formData.sort_order} onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})} className="w-14 p-1 border rounded-lg text-center text-xs bg-white text-stone-900" />
                  </div>
                </div>

                {/* BOTONES ACCIONADORES DEL FORMULARIO */}
                <div className="flex gap-3 pt-3 border-t dark:border-stone-800">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 py-2.5 rounded-xl border text-xs font-bold uppercase text-stone-600 dark:text-stone-300">Cancelar</button>
                  <button type="submit" disabled={uploading} className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold uppercase flex items-center justify-center gap-2 shadow-md" style={primaryBgStyle}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {uploading ? 'Guardando cambios...' : 'Confirmar y Guardar'}
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