// @ts-nocheck
'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, Image as ImageIcon, UploadCloud, 
  Trash2, Loader2, X, ZoomIn,
  ChevronLeft, ChevronRight,
  Calendar, Tag, Users, Edit3,
  Check, Eye, EyeOff, User,
  Layers, Search, RefreshCw,
  Info, CheckCircle2, AlertCircle,
  Sparkles, Crown, Star, Plus
} from 'lucide-react'

type Photo = {
  id: string
  image_url: string | null
  title: string | null
  category: string | null
  description: string | null
  is_active: boolean
  created_at: string
  sort_order: number | null
  professional_id: string | null
  source: 'admin' | 'client'
  client_name?: string | null
  client_id?: string | null
  before_image_url?: string | null
  after_image_url?: string | null
  views?: number
  likes?: number
}

type Professional = {
  id: string
  full_name: string
  role?: string
}

const categories = ['Todas', 'Uñas', 'Micropigmentacion', 'Peluquería', 'Cejas']

export default function GaleriaAdminPage() {
  const { settings } = useSettings()
  const { tenantId } = useAuth()

  const [photos, setPhotos] = useState<Photo[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showLightbox, setShowLightbox] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    category: 'Uñas',
    description: '',
    image_url: '',
    is_active: true,
    sort_order: 0,
    professional_id: ''
  })

  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'

  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
  }

  const primaryBgStyle = { backgroundColor: primaryColor }

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

    return profile?.tenant_id || null
  }, [tenantId])

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

  const fetchPhotos = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      else setRefreshing(true)
      setError(null)

      const activeTenantId = await getTenantId()
      if (!activeTenantId) {
        setPhotos([])
        setLoading(false)
        setRefreshing(false)
        return
      }

      fetchProfessionals(activeTenantId)

      let allPhotos: Photo[] = []

      const { data: adminPhotos, error: adminError } = await supabase
        .from('gallery')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('sort_order', { ascending: true })

      if (adminError) {
        console.error('Error cargando fotos de admin:', adminError)
      } else if (adminPhotos) {
        const mappedAdminPhotos = adminPhotos.map((p: any) => ({
          id: p.id,
          image_url: p.image_url || '',
          title: p.title || null,
          category: p.category || 'Uñas',
          description: p.description || null,
          is_active: p.is_active !== undefined ? p.is_active : true,
          created_at: p.created_at,
          sort_order: p.sort_order || 0,
          professional_id: p.professional_id || null,
          source: 'admin' as const,
          client_name: null,
          client_id: null,
          before_image_url: null,
          after_image_url: null,
          views: 0,
          likes: 0
        }))
        allPhotos = [...allPhotos, ...mappedAdminPhotos]
      }

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
          category: p.category || 'Uñas',
          description: p.description || '',
          is_active: p.is_active !== undefined ? p.is_active : true,
          created_at: p.created_at,
          sort_order: p.sort_order || 0,
          professional_id: p.professional_id || null,
          source: 'client' as const,
          client_name: p.client_name || 'Cliente',
          client_id: p.client_id || null,
          before_image_url: p.before_image_url || null,
          after_image_url: p.after_image_url || null,
          views: p.views || 0,
          likes: p.likes || 0
        }))
        allPhotos = [...allPhotos, ...mappedClientPhotos]
      }

      allPhotos.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setPhotos(allPhotos)

    } catch (err: any) {
      setError('No se pudo sincronizar la galería.')
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [getTenantId, fetchProfessionals])

  useEffect(() => {
    fetchPhotos(true)
  }, [fetchPhotos])

  const professionalMap = useMemo(() => {
    const map: Record<string, string> = {}
    professionals.forEach(p => {
      map[p.id] = p.full_name
    })
    return map
  }, [professionals])

  const stats = useMemo(() => {
    const total = photos.length
    const adminCount = photos.filter(p => p.source === 'admin').length
    const clientCount = photos.filter(p => p.source === 'client').length
    const activeCount = photos.filter(p => p.is_active).length
    return { total, adminCount, clientCount, activeCount }
  }, [photos])

  const filteredPhotos = useMemo(() => {
    let result = [...photos]

    if (categoryFilter !== 'Todas') {
      result = result.filter(p => p.category === categoryFilter)
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.client_name && p.client_name.toLowerCase().includes(q))
      )
    }

    return result
  }, [photos, categoryFilter, searchQuery])

  const getImageUrl = (photo: Photo) => {
    if (photo.source === 'admin') {
      return photo.image_url || ''
    }
    return photo.after_image_url || photo.image_url || photo.before_image_url || ''
  }

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('⚠️ Selecciona un formato de imagen válido.')
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const activeTenantId = await getTenantId()
      if (!activeTenantId) throw new Error('⚠️ Sesión o Salón no válido.')

      setUploading(true)

      let imageUrl = formData.image_url

      if (!editingPhoto) {
        if (!selectedFile) throw new Error('⚠️ Debes seleccionar una imagen.')
        imageUrl = await uploadFile(selectedFile, activeTenantId)
      } else {
        if (selectedFile) {
          imageUrl = await uploadFile(selectedFile, activeTenantId)
        }
      }

      const payload = {
        tenant_id: activeTenantId,
        professional_id: formData.professional_id || null,
        image_url: imageUrl || null,
        title: formData.title || null,
        category: formData.category,
        description: formData.description || null,
        is_active: formData.is_active,
        sort_order: formData.sort_order || 0
      }

      if (editingPhoto) {
        const { error: updateError } = await supabase
          .from('gallery')
          .update(payload)
          .eq('id', editingPhoto.id)
          .eq('tenant_id', activeTenantId)

        if (updateError) throw updateError
        setSuccess('✨ Publicación actualizada correctamente.')
      } else {
        const { error: insertError } = await supabase
          .from('gallery')
          .insert(payload)

        if (insertError) throw insertError
        setSuccess('✨ Nueva obra guardada en el catálogo.')
      }

      await fetchPhotos(false)
      resetForm()
      setShowModal(false)

    } catch (err: any) {
      setError(err.message || 'Error al guardar la información.')
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'Uñas',
      description: '',
      image_url: '',
      is_active: true,
      sort_order: 0,
      professional_id: ''
    })
    setSelectedFile(null)
    setPreviewUrl(null)
    setEditingPhoto(null)
  }

  const deletePhoto = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!confirm('¿Eliminar permanentemente este registro?')) return

    try {
      const { error } = await supabase.from('gallery').delete().eq('id', id)
      if (error) throw error
      setPhotos(photos.filter(p => p.id !== id))
      if (selectedPhoto?.id === id) closeLightbox()
      setSuccess('🗑️ Registro eliminado.')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('No se pudo eliminar el archivo.')
      setTimeout(() => setError(null), 3000)
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    try {
      const { error } = await supabase
        .from('gallery')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      setPhotos(photos.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p))
      setSuccess(!currentStatus ? '👁️ Visible al público.' : '👁️ Oculto del portafolio.')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('No se pudo cambiar el estado.')
      setTimeout(() => setError(null), 3000)
    }
  }

  const openLightbox = (photo: Photo) => {
    const index = filteredPhotos.findIndex(p => p.id === photo.id)
    setSelectedPhoto(photo)
    setLightboxIndex(index !== -1 ? index : 0)
    setShowLightbox(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setShowLightbox(false)
    setSelectedPhoto(null)
    document.body.style.overflow = 'auto'
  }

  const navigateLightbox = (direction: 'next' | 'prev') => {
    if (filteredPhotos.length === 0) return
    let newIndex = direction === 'next' ? lightboxIndex + 1 : lightboxIndex - 1

    if (newIndex >= filteredPhotos.length) newIndex = 0
    if (newIndex < 0) newIndex = filteredPhotos.length - 1

    setLightboxIndex(newIndex)
    setSelectedPhoto(filteredPhotos[newIndex])
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute w-48 h-48 bg-amber-500/5 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite] delay-300" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
            <Camera className="w-6 h-6 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-sm font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 animate-pulse">
              CARGANDO
            </p>
            <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              GALERÍA FRESH
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span 
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-pink-500/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1 max-w-7xl mx-auto">

      {/* ============================================================ */}
      {/* CABECERA PRINCIPAL — IDÉNTICA A LA DE AGENDA */}
      {/* ============================================================ */}
      <div 
        className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl text-white border border-white/10"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, #EF4444 100%)`
        }}
      >
        {/* Efecto de Luces y Brillos de Fondo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-black/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Textos Principales */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-pink-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Portafolio del Salón
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight drop-shadow-sm">
              Galería Fresh Nails
            </h1>
            <p className="text-xs md:text-sm text-pink-50/80 font-medium max-w-md">
              Administra el portafolio comercial del salón, organiza tus trabajos y destaca el arte de tu equipo.
            </p>
          </div>

          {/* Acciones y Botones */}
          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <button 
              onClick={() => fetchPhotos(false)} 
              disabled={refreshing} 
              className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95 shadow-lg"
              title="Actualizar Galería"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button 
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white text-stone-900 font-black text-xs uppercase tracking-widest shadow-xl hover:bg-pink-50 hover:scale-105 active:scale-95 transition-all"
            >
              <div className="p-1 rounded-md bg-stone-900 text-white">
                <Plus className="w-3 h-3 stroke-[3]" />
              </div>
              <span>Nueva Foto</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MENSAJES */}
      {/* ============================================================ */}
      {error && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-rose-500/10 to-pink-500/5 border border-rose-500/20 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-xs text-stone-700 dark:text-rose-400 font-medium min-w-0">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs text-stone-700 dark:text-emerald-400 font-medium min-w-0">{success}</p>
        </div>
      )}

      {/* ============================================================ */}
{/* ESTADÍSTICAS — RESPONSIVAS */}
{/* ============================================================ */}
<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
  {/* Total */}
  <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
    <div className="p-1.5 sm:p-2 rounded-xl shrink-0" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
      <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    </div>
    <div className="min-w-0">
      <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Total</p>
      <h3 className="text-sm sm:text-base font-mono font-black text-stone-900 dark:text-pink-100">{stats.total}</h3>
    </div>
  </div>

  {/* Salón */}
  <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
    <div className="p-1.5 sm:p-2 rounded-xl bg-pink-500/10 text-pink-500 shrink-0">
      <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    </div>
    <div className="min-w-0">
      <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Salón</p>
      <h3 className="text-sm sm:text-base font-mono font-black text-pink-500">{stats.adminCount}</h3>
    </div>
  </div>

  {/* Clientes */}
  <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
    <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    </div>
    <div className="min-w-0">
      <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Clientes</p>
      <h3 className="text-sm sm:text-base font-mono font-black text-amber-500">{stats.clientCount}</h3>
    </div>
  </div>

  {/* Visibles */}
  <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
    <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    </div>
    <div className="min-w-0">
      <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Visibles</p>
      <h3 className="text-sm sm:text-base font-mono font-black text-emerald-500">{stats.activeCount}</h3>
    </div>
  </div>
</div>

      {/* ============================================================ */}
      {/* FILTROS Y BÚSQUEDA */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row gap-3 p-4 rounded-2xl border shadow-sm bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <Search className={`w-4 h-4 shrink-0 ${'text-stone-400'}`} />
          <input 
            type="text" 
            placeholder="Buscar por título, descripción o cliente..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs w-full font-medium text-stone-800 dark:text-white placeholder:text-stone-400"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                categoryFilter === cat 
                  ? 'text-white shadow-sm' 
                  : 'bg-stone-100 dark:bg-[#0f0c1b] text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
              }`}
              style={categoryFilter === cat ? brandGradient : {}}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* GRID DE FOTOS */}
      {/* ============================================================ */}
      {filteredPhotos.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-stone-50/50 dark:bg-[#130f24]/30 border-stone-200 dark:border-stone-800">
          <ImageIcon className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">No se encontraron fotos</p>
          <p className="text-xs text-stone-400 dark:text-stone-500">Sube tu primer trabajo al portafolio</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => {
            const imageUrl = getImageUrl(photo)
            const isClient = photo.source === 'client'
            const isAdmin = photo.source === 'admin'

            return (
              <div
                key={`${photo.source}-${photo.id}`}
                onClick={() => openLightbox(photo)}
                onMouseEnter={() => setHoveredId(photo.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer bg-white dark:bg-[#130f24] border shadow-sm transition-all aspect-square ${
                  !photo.is_active ? 'opacity-60 grayscale-[30%]' : ''
                } hover:shadow-xl hover:-translate-y-1`}
              >
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={photo.title || ''} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-stone-400" />
                  </div>
                )}

                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[85%]">
                  <span className={`text-[7px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md text-white shadow-xs ${
                    isClient ? 'bg-amber-500/95' : 'bg-pink-500/95'
                  }`}>
                    {isClient ? `👤 ${photo.client_name || 'Cliente'}` : '👑 Studio'}
                  </span>
                  {photo.category && photo.category !== 'Todas' && (
                    <span className="text-[7px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-900/80 text-white/90">
                      {photo.category}
                    </span>
                  )}
                  {!photo.is_active && (
                    <span className="text-[7px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-900/90 text-white">
                      Oculto
                    </span>
                  )}
                </div>

                {hoveredId === photo.id && (
                  <div className="absolute inset-0 bg-stone-950/70 p-3 flex flex-col justify-between text-white">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={(e) => { e.stopPropagation(); openLightbox(photo); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingPhoto(photo)
                              setFormData({
                                title: photo.title || '',
                                category: photo.category || 'Uñas',
                                description: photo.description || '',
                                image_url: photo.image_url || '',
                                is_active: photo.is_active,
                                sort_order: photo.sort_order || 0,
                                professional_id: photo.professional_id || ''
                              })
                              setShowModal(true)
                            }} 
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30 rounded-xl transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => toggleActive(photo.id, photo.is_active, e)} 
                            className="p-2 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/30 rounded-xl transition-all"
                          >
                            {photo.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button 
                            onClick={(e) => deletePhoto(photo.id, e)} 
                            className="p-2 bg-red-500/20 hover:bg-red-600 border border-red-500/30 rounded-xl transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold truncate line-clamp-1">{photo.title || 'Trabajo del Salón'}</h4>
                      <p className="text-[10px] text-stone-300 truncate line-clamp-1 mt-0.5">{photo.category}</p>
                      {photo.professional_id && professionalMap[photo.professional_id] && (
                        <p className="text-[9px] text-stone-400 flex items-center gap-1">
                          <User className="w-2.5 h-2.5" /> {professionalMap[photo.professional_id]}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* LIGHTBOX CORREGIDO — Admin y Clientes se ven igual */}
      {/* ============================================================ */}
      {showLightbox && selectedPhoto && (
        <div 
          className="fixed inset-0 z-[9999] bg-stone-950/95 backdrop-blur-xl flex flex-col md:flex-row" 
          onClick={closeLightbox}
        >
          {/* Contenedor de la imagen */}
          <div 
            className="relative flex-1 flex items-center justify-center p-3 md:p-6 h-[50vh] md:h-full min-h-[200px]" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar (móvil) */}
            <button 
              onClick={closeLightbox} 
              className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white z-50 md:hidden backdrop-blur-sm border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Navegación */}
            {filteredPhotos.length > 1 && (
              <>
                <button 
                  onClick={() => navigateLightbox('prev')} 
                  className="absolute left-2 p-2 md:p-3 rounded-xl bg-black/50 hover:bg-black/70 text-white transition-all z-40 backdrop-blur-sm border border-white/10"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button 
                  onClick={() => navigateLightbox('next')} 
                  className="absolute right-2 p-2 md:p-3 rounded-xl bg-black/50 hover:bg-black/70 text-white transition-all z-40 backdrop-blur-sm border border-white/10"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </>
            )}

            {/* Contador */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/50 text-[9px] md:text-[10px] tracking-[0.2em] font-mono z-40 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
              {lightboxIndex + 1} / {filteredPhotos.length}
            </div>

            {/* Imagen */}
            <img 
              src={getImageUrl(selectedPhoto)} 
              alt={selectedPhoto.title || ''} 
              className="max-w-full max-h-[45vh] md:max-h-[80vh] w-auto h-auto object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* Panel de información - SIEMPRE visible */}
          <div 
            className="w-full md:w-80 bg-stone-900/95 md:h-full overflow-y-auto p-4 md:p-6 flex flex-col text-stone-200 border-t md:border-t-0 md:border-l border-white/10" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del panel */}
            <div className="flex justify-between items-center mb-4 md:mb-5">
              <span className="text-[9px] md:text-[10px] font-mono uppercase tracking-widest text-stone-400">
                {selectedPhoto.source === 'client' ? '👤 Aporte de Cliente' : '👑 Trabajo del Salón'}
              </span>
              <button 
                onClick={closeLightbox} 
                className="p-1.5 md:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Contenido del panel */}
            <div className="flex-1 overflow-y-auto space-y-4 md:space-y-5 pr-1">
              {/* Categoría */}
              <div>
                <span className="px-2.5 py-1 bg-white/10 rounded-md text-[8px] md:text-[9px] font-mono font-bold uppercase tracking-wider">
                  {selectedPhoto.category || 'Sin categoría'}
                </span>
                {selectedPhoto.source === 'client' && (
                  <span className="ml-2 px-2.5 py-1 bg-amber-500/20 rounded-md text-[8px] md:text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400">
                    Cliente
                  </span>
                )}
              </div>

              {/* Título */}
              <h3 className="text-lg md:text-xl font-serif font-bold text-white">
                {selectedPhoto.title || 'Sin título'}
              </h3>

              {/* Descripción */}
              <p className="text-xs md:text-sm text-stone-400 leading-relaxed">
                {selectedPhoto.description || 'Sin descripción.'}
              </p>

              {/* Detalles adicionales */}
              <div className="space-y-2 pt-3 border-t border-white/10 text-xs">
                {selectedPhoto.professional_id && professionalMap[selectedPhoto.professional_id] && (
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Profesional:
                    </span>
                    <span className="font-medium text-white">{professionalMap[selectedPhoto.professional_id]}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-stone-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Registro:
                  </span>
                  <span className="font-mono text-stone-300">{new Date(selectedPhoto.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Origen:
                  </span>
                  <span className={`font-medium ${selectedPhoto.source === 'client' ? 'text-amber-400' : 'text-pink-400'}`}>
                    {selectedPhoto.source === 'client' ? '👤 Cliente' : '👑 Salón'}
                  </span>
                </div>

                {selectedPhoto.source === 'client' && selectedPhoto.client_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Cliente:
                    </span>
                    <span className="font-medium text-amber-400">{selectedPhoto.client_name}</span>
                  </div>
                )}

                {/* ✅ NUEVO: Mostrar vistas y likes para fotos de clientes */}
                {selectedPhoto.source === 'client' && (
                  <div className="flex items-center gap-4 pt-1">
                    {selectedPhoto.views !== undefined && (
                      <span className="text-stone-400 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {selectedPhoto.views || 0}
                      </span>
                    )}
                    {selectedPhoto.likes !== undefined && (
                      <span className="text-stone-400 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" /> {selectedPhoto.likes || 0}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ✅ ACCIONES - SIEMPRE VISIBLES */}
            <div className="pt-4 border-t border-white/10 flex gap-2 mt-4">
              {selectedPhoto.source === 'admin' ? (
                // ✅ Botones para fotos de ADMIN
                <>
                  <button 
                    onClick={() => {
                      closeLightbox()
                      setEditingPhoto(selectedPhoto)
                      setFormData({
                        title: selectedPhoto.title || '',
                        category: selectedPhoto.category || 'Uñas',
                        description: selectedPhoto.description || '',
                        image_url: selectedPhoto.image_url || '',
                        is_active: selectedPhoto.is_active,
                        sort_order: selectedPhoto.sort_order || 0,
                        professional_id: selectedPhoto.professional_id || ''
                      })
                      setShowModal(true)
                    }}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /> Editar
                  </button>
                  <button 
                    onClick={() => deletePhoto(selectedPhoto.id)}
                    className="p-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                // ✅ Botones para fotos de CLIENTES - Solo cerrar
                <button 
                  onClick={closeLightbox}
                  className="flex-1 py-2.5 bg-stone-700 hover:bg-stone-600 text-white rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-3.5 h-3.5 md:w-4 md:h-4" /> Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: SUBIR/EDITAR FOTO */}
      {/* ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => { setShowModal(false); resetForm(); }}>
          <div 
            className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#130f24] border border-stone-200 dark:border-stone-800 p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => { setShowModal(false); resetForm(); }} className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl text-white shadow-md" style={primaryBgStyle}>
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-extrabold text-stone-900 dark:text-white">
                {editingPhoto ? 'Editar Obra' : 'Subir Nueva Obra'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5 font-mono">
                  Imagen *
                </label>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer bg-stone-50/50 hover:bg-stone-100/50 dark:bg-stone-900/20 border-stone-200 dark:border-stone-800 transition-colors">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  {previewUrl ? (
                    <img src={previewUrl} alt="" className="max-h-36 mx-auto rounded-xl object-contain" />
                  ) : formData.image_url ? (
                    <img src={formData.image_url} alt="" className="max-h-36 mx-auto rounded-xl object-contain" />
                  ) : (
                    <div className="py-2">
                      <ImageIcon className="w-7 h-7 mx-auto text-stone-400 mb-1" />
                      <p className="text-xs text-stone-600 dark:text-stone-300">Seleccionar imagen</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1 font-mono">Título</label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    className="w-full px-4 py-2 rounded-xl border bg-white dark:bg-[#0f0c1b] text-xs focus:ring-1 focus:ring-pink-500/50" 
                    placeholder="Ej: Kapping Gel con Deco" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1 font-mono">Categoría</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})} 
                    className="w-full px-4 py-2 rounded-xl border bg-white dark:bg-[#0f0c1b] text-xs focus:ring-1 focus:ring-pink-500/50"
                  >
                    {categories.filter(c => c !== 'Todas').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1 font-mono">Profesional</label>
                  <select 
                    value={formData.professional_id} 
                    onChange={(e) => setFormData({...formData, professional_id: e.target.value})} 
                    className="w-full px-4 py-2 rounded-xl border bg-white dark:bg-[#0f0c1b] text-xs focus:ring-1 focus:ring-pink-500/50"
                  >
                    <option value="">No asignar</option>
                    {professionals.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1 font-mono">Orden</label>
                  <input 
                    type="number" 
                    value={formData.sort_order} 
                    onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})} 
                    className="w-full px-4 py-2 rounded-xl border bg-white dark:bg-[#0f0c1b] text-xs focus:ring-1 focus:ring-pink-500/50"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1 font-mono">Descripción</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  rows={2} 
                  className="w-full px-4 py-2 rounded-xl border bg-white dark:bg-[#0f0c1b] text-xs resize-none focus:ring-1 focus:ring-pink-500/50" 
                  placeholder="Detalles técnicos del trabajo..."
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  checked={formData.is_active} 
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})} 
                  className="w-4 h-4 rounded border-stone-300 text-pink-500 focus:ring-0" 
                />
                <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Visible en el catálogo</span>
              </div>

              <div className="flex gap-3 pt-3 border-t dark:border-stone-800">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); resetForm(); }} 
                  className="flex-1 py-2.5 rounded-xl border text-xs font-bold uppercase text-stone-600 dark:text-stone-300"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={uploading} 
                  className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold uppercase flex items-center justify-center gap-2 shadow-md hover:scale-105 transition-all" 
                  style={primaryBgStyle}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {uploading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>

    </div>
  )
}