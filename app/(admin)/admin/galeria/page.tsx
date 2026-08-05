// @ts-nocheck
'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Camera, Image as ImageIcon, UploadCloud, 
  Trash2, Loader2, X, ZoomIn,
  ChevronLeft, ChevronRight,
  Calendar, Tag, Users, Edit3,
  Check, Eye, EyeOff, User,
  Layers, Search, RefreshCw,
  Info, CheckCircle2, AlertCircle,
  Plus, Sparkles, Scissors
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

const CATEGORIES = ['Todas', 'Uñas', 'Micropigmentacion', 'Peluquería', 'Cejas']

export default function GaleriaAdminPage() {
  const { settings } = useSettings()
  const { tenantId } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Estados principales
  const [photos, setPhotos] = useState<Photo[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Filtros
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [searchQuery, setSearchQuery] = useState('')

  // Modales y Modos
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showLightbox, setShowLightbox] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)

  // Feedback al usuario
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Archivos
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

  // Recuperar Tenant ID
  const getTenantId = useCallback(async (): Promise<string | null> => {
    if (tenantId) return tenantId
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null
    
    const metaTenant = session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id
    if (metaTenant) return metaTenant

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', session.user.id)
      .maybeSingle()

    return profile?.tenant_id || null
  }, [tenantId])

  // Carga aislada de Profesionales
  const fetchProfessionals = useCallback(async (activeTenantId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('tenant_id', activeTenantId)
        .order('full_name', { ascending: true })

      if (!error && data) setProfessionals(data)
    } catch (err) {
      console.error('Error cargando profesionales:', err)
    }
  }, [])

  // Carga aislada de Fotos
  const fetchPhotos = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      else setRefreshing(true)
      setError(null)

      const activeTenantId = await getTenantId()
      if (!activeTenantId) {
        setPhotos([])
        return
      }

      await Promise.all([
        fetchProfessionals(activeTenantId),
        (async () => {
          const [adminRes, clientRes] = await Promise.all([
            supabase.from('gallery').select('*').eq('tenant_id', activeTenantId).order('sort_order', { ascending: true }),
            supabase.from('client_gallery').select('*').eq('tenant_id', activeTenantId)
          ])

          let allPhotos: Photo[] = []

          if (adminRes.data) {
            allPhotos = [...allPhotos, ...adminRes.data.map((p: any) => ({
              ...p,
              category: p.category || 'Uñas',
              is_active: p.is_active ?? true,
              source: 'admin'
            }))]
          }

          if (clientRes.data) {
            allPhotos = [...allPhotos, ...clientRes.data.map((p: any) => ({
              id: p.id,
              image_url: p.after_image_url || p.image_url || p.before_image_url || '',
              title: p.title || 'Aporte de Cliente',
              category: p.category || 'Uñas',
              description: p.description || '',
              is_active: p.is_active ?? true,
              created_at: p.created_at,
              sort_order: p.sort_order || 0,
              professional_id: p.professional_id || null,
              source: 'client',
              client_name: p.client_name || 'Cliente',
              client_id: p.client_id || null,
              views: p.views || 0,
              likes: p.likes || 0
            }))]
          }

          allPhotos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          setPhotos(allPhotos)
        })()
      ])

    } catch (err) {
      setError('No se pudo sincronizar la galería.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [getTenantId, fetchProfessionals])

  useEffect(() => {
    fetchPhotos(true)
  }, [fetchPhotos])

  const professionalMap = useMemo(() => {
    return professionals.reduce<Record<string, string>>((acc, p) => {
      acc[p.id] = p.full_name
      return acc
    }, {})
  }, [professionals])

  const stats = useMemo(() => {
    return photos.reduce((acc, photo) => {
      acc.total++
      if (photo.source === 'admin') acc.adminCount++
      if (photo.source === 'client') acc.clientCount++
      if (photo.is_active) acc.activeCount++
      return acc
    }, { total: 0, adminCount: 0, clientCount: 0, activeCount: 0 })
  }, [photos])

  const filteredPhotos = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return photos.filter(p => {
      const matchesCategory = categoryFilter === 'Todas' || p.category === categoryFilter
      const matchesSearch = !query || 
        p.title?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.client_name?.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [photos, categoryFilter, searchQuery])

  const uploadFile = async (file: File, tId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const filePath = `gallery/${tId}/${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(filePath, file, { cacheControl: '3600', upsert: false })

    if (uploadError) throw uploadError
    return supabase.storage.from('gallery').getPublicUrl(filePath).data.publicUrl
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

      if (selectedFile) {
        imageUrl = await uploadFile(selectedFile, activeTenantId)
      } else if (!editingPhoto) {
        throw new Error('⚠️ Debes seleccionar una imagen.')
      }

      const payload = {
        tenant_id: activeTenantId,
        professional_id: formData.professional_id || null,
        image_url: imageUrl,
        title: formData.title || null,
        category: formData.category,
        description: formData.description || null,
        is_active: formData.is_active,
        sort_order: formData.sort_order || 0
      }

      const query = editingPhoto 
        ? supabase.from('gallery').update(payload).eq('id', editingPhoto.id).eq('tenant_id', activeTenantId)
        : supabase.from('gallery').insert(payload)

      const { error: dbError } = await query
      if (dbError) throw dbError

      setSuccess(editingPhoto ? '✨ Publicación actualizada.' : '✨ Nueva obra guardada.')
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
      const { error: dbError } = await supabase.from('gallery').delete().eq('id', id)
      if (dbError) throw dbError
      setPhotos(prev => prev.filter(p => p.id !== id))
      if (selectedPhoto?.id === id) closeLightbox()
      setSuccess('🗑️ Registro eliminado.')
    } catch (err) {
      setError('No se pudo eliminar el archivo.')
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    try {
      const nextStatus = !currentStatus
      const { error: dbError } = await supabase
        .from('gallery')
        .update({ is_active: nextStatus })
        .eq('id', id)

      if (dbError) throw dbError
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, is_active: nextStatus } : p))
      setSuccess(nextStatus ? '👁️ Visible al público.' : '👁️ Oculto del portafolio.')
    } catch (err) {
      setError('No se pudo cambiar el estado.')
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

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-12 relative overflow-hidden ${isDark ? 'bg-[#150D08] text-[#FFF9F6]' : 'bg-[#FDFBF9] text-[#1A0E0A]'}`}>
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#EC4899]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none z-0 opacity-15 mix-blend-overlay bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 relative z-10 pt-4">
        
        {/* HEADER HERO BANNER (ESTILO EXECUTIVE LUXURY REDISEÑADO) */}
        <div className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ${
          isDark 
            ? 'bg-gradient-to-br from-[#271810] via-[#1E120C] to-[#160E09] border-[#3D281E] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]' 
            : 'bg-gradient-to-br from-white via-[#FBF7F4] to-[#F5ECE5] border-[#EADED5] shadow-[0_25px_50px_-15px_rgba(225,208,195,0.4)]'
        }`}>
          {/* Efectos de luz flotante y línea inferior */}
          <div className="absolute -top-40 -right-40 w-[350px] h-[350px] bg-gradient-to-br from-[#EC4899]/20 to-[#D4AF37]/20 rounded-full blur-[90px] pointer-events-none animate-pulse [animation-duration:6s]" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

          <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Ícono de sección con resplandor */}
              <div className="relative group shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37] via-[#EC4899] to-[#3B82F6] rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-4 rounded-2xl shadow-xl bg-neutral-950 text-white flex items-center justify-center border border-white/10">
                  <Camera className="w-7 h-7 text-[#D4AF37] animate-pulse" />
                </div>
              </div>

              {/* Textos y Badge */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[9px] font-black uppercase tracking-[0.25em] text-[#C9A96E]">
                  <Sparkles className="w-2.5 h-2.5" />
                  ✦ Portafolio Oficial del Salón
                </div>
                <h2 className={`font-serif text-3xl md:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                  Galería <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#EC4899] to-[#C9A96E] font-serif italic font-normal">Fresh Nails</span>
                </h2>
                <p className={`text-sm font-light ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                  Administra el portafolio comercial, organiza tus obras y destaca el arte de tu equipo.
                </p>
              </div>
            </div>

            {/* Acciones del Hero */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 border-t pt-5 md:pt-0 md:border-t-0 border-[#EADED5] dark:border-[#3D281E]">
              <button 
                onClick={() => fetchPhotos(false)} 
                disabled={refreshing} 
                className={`w-full sm:w-auto px-5 py-3 rounded-xl border font-bold text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2.5 transition-all duration-300 backdrop-blur-md shadow-xs active:scale-95 ${
                  isDark 
                    ? 'bg-[#1C120C]/80 border-[#3D281E] text-[#BCAEA5] hover:text-white hover:border-[#D4AF37]/50' 
                    : 'bg-white/80 border-[#EADED5] text-[#5C4A3E] hover:text-[#1A0E0A] hover:border-[#D4AF37]/50'
                }`}
                title="Sincronizar Galería"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Sincronizando' : 'Actualizar'}</span>
              </button>

              <button 
                onClick={() => { resetForm(); setShowModal(true); }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl text-neutral-950 font-black text-xs uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl shadow-[#D4AF37]/10 hover:shadow-[#D4AF37]/20 hover:scale-[1.03] active:scale-95 bg-gradient-to-r from-[#D4AF37] via-[#E8D5A0] to-[#C9A96E]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Nueva Foto</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notificaciones de Feedback */}
        <div className="space-y-2">
          {error && (
            <div className={`flex items-start gap-4 border p-4 rounded-2xl transition-all duration-300 ${isDark ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' : 'bg-white border-[#D4AF37]/30 text-[#1A0E0A]'}`}>
              <div className="p-2 rounded-xl shrink-0 bg-red-500/10">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-sm font-light self-center">{error}</p>
            </div>
          )}

          {success && (
            <div className={`flex items-start gap-4 border p-4 rounded-2xl transition-all duration-300 ${isDark ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' : 'bg-white border-[#D4AF37]/30 text-[#1A0E0A]'}`}>
              <div className="p-2 rounded-xl shrink-0 bg-emerald-500/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-sm font-light self-center">{success}</p>
            </div>
          )}
        </div>

        {/* Módulo de Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Registros', value: stats.total, icon: Layers },
            { label: 'Portafolio Salón', value: stats.adminCount, icon: Tag },
            { label: 'Fotos Clientes', value: stats.clientCount, icon: Users },
            { label: 'Visibles Público', value: stats.activeCount, icon: Eye }
          ].map((stat, idx) => (
            <div key={idx} className={`rounded-2xl p-5 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'}`}>
              <div className="flex items-center gap-4 min-w-0">
                <div className={`p-3 rounded-xl shrink-0 ${isDark ? 'bg-[#291A11]' : 'bg-[#FAF6F2]'}`}>
                  <stat.icon className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[10px] font-mono uppercase tracking-wider font-black ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>{stat.label}</p>
                  <p className="text-2xl font-black mt-0.5">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className={`flex flex-col md:flex-row gap-3 p-4 rounded-2xl border shadow-sm transition-all duration-300 ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'}`}>
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <Search className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`} />
            <input 
              type="text" 
              placeholder="Buscar por título, descripción o cliente..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`bg-transparent border-none outline-none text-xs w-full font-medium ${isDark ? 'text-[#FFF9F6] placeholder:text-[#BCAEA5]' : 'text-[#1A0E0A] placeholder:text-[#6E5A4D]'}`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#EADED5]'}`}
              >
                <X className={`w-4 h-4 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                  categoryFilter === cat 
                    ? 'bg-[#D4AF37] text-[#1A0E0A] shadow-md' 
                    : isDark 
                      ? 'bg-[#150D08] border border-[#3D281E] text-[#BCAEA5] hover:border-[#D4AF37]/40'
                      : 'bg-[#FDFBF9] border border-[#EADED5] text-[#6E5A4D] hover:border-[#D4AF37]/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loader principal */}
        {loading ? (
          <div className={`flex items-center justify-center min-h-[40vh] transition-colors duration-500`}>
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-16 h-16">
                <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
                <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
              </div>
              <p className={`text-[10px] tracking-[0.4em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]/60'}`}>
                Sincronizando Portafolio...
              </p>
            </div>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className={`text-center py-20 border border-dashed rounded-2xl font-mono text-xs ${isDark ? 'bg-[#1E120C]/40 border-[#3D281E] text-[#BCAEA5]' : 'bg-white border-[#EADED5] text-[#6E5A4D]'}`}>
            <ImageIcon className="w-10 h-10 mx-auto mb-3 text-[#D4AF37]/60" />
            <p className="font-semibold">No se encontraron fotografías que coincidan con la búsqueda.</p>
          </div>
        ) : (
          /* Grid de Fotos Comercial */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.map((photo) => {
              const isClient = photo.source === 'client'
              return (
                <div
                  key={photo.id}
                  onClick={() => openLightbox(photo)}
                  onMouseEnter={() => setHoveredId(photo.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`group relative rounded-2xl overflow-hidden cursor-pointer border shadow-sm transition-all duration-300 aspect-square hover:-translate-y-1 hover:shadow-xl ${
                    !photo.is_active ? 'opacity-50 grayscale-[40%]' : ''
                  } ${isDark ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#D4AF37]/40' : 'bg-white border-[#EADED5] hover:border-[#D4AF37]/40'}`}
                >
                  <img src={photo.image_url || ''} alt={photo.title || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  
                  {/* Tags flotantes superiores */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[85%] z-20">
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-[#1A0E0A] bg-[#D4AF37] shadow-md">
                      {isClient ? `👤 ${photo.client_name}` : '👑 Studio'}
                    </span>
                    {!photo.is_active && (
                      <span className="text-[8px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white bg-rose-600 shadow-md">
                        Oculto
                      </span>
                    )}
                  </div>

                  {/* Capa Overlay interactiva en Hover */}
                  <div className={`absolute inset-0 bg-neutral-950/80 p-4 flex flex-col justify-between text-white transition-opacity duration-300 ${hoveredId === photo.id ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openLightbox(photo)} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all">
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      {photo.source === 'admin' && (
                        <>
                          <button 
                            onClick={() => {
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
                            className="p-2 bg-[#D4AF37]/20 hover:bg-[#D4AF37] border border-[#D4AF37]/30 text-[#D4AF37] hover:text-stone-900 rounded-xl transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => toggleActive(photo.id, photo.is_active)} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all">
                            {photo.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => deletePhoto(photo.id)} className="p-2 bg-rose-500/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] font-mono tracking-widest text-[#D4AF37] uppercase">{photo.category}</span>
                      <h4 className="text-xs font-bold truncate text-white">{photo.title || 'Trabajo del Salón'}</h4>
                      {photo.professional_id && professionalMap[photo.professional_id] && (
                        <p className="text-[9px] text-stone-400 flex items-center gap-1">
                          <User className="w-2.5 h-2.5 text-[#D4AF37]" /> {professionalMap[photo.professional_id]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal Lightbox */}
        {showLightbox && selectedPhoto && (
          <div className="fixed inset-0 z-[9999] bg-neutral-950/95 backdrop-blur-xl flex flex-col md:flex-row" onClick={closeLightbox}>
            <div className="relative flex-1 flex items-center justify-center p-6 h-[60vh] md:h-full" onClick={(e) => e.stopPropagation()}>
              <img src={selectedPhoto.image_url || ''} alt="" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
              {filteredPhotos.length > 1 && (
                <>
                  <button onClick={() => navigateLightbox('prev')} className="absolute left-4 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all"><ChevronLeft className="w-6 h-6" /></button>
                  <button onClick={() => navigateLightbox('next')} className="absolute right-4 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all"><ChevronRight className="w-6 h-6" /></button>
                </>
              )}
            </div>
            
            <div className="w-full md:w-96 bg-neutral-900 border-t md:border-t-0 md:border-l border-white/10 p-6 flex flex-col text-stone-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] font-black uppercase">Metadatos de Obra</span>
                <button onClick={closeLightbox} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-stone-400 hover:text-white transition-all"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-mono text-[9px] font-bold uppercase tracking-wider">{selectedPhoto.source === 'client' ? 'Aporte Cliente' : 'Administrador'}</span>
                  <h3 className="text-xl font-serif font-bold text-white mt-2">{selectedPhoto.title || 'Trabajo del Salón'}</h3>
                </div>
                <p className="text-xs text-stone-400 font-light leading-relaxed">{selectedPhoto.description || 'Sin descripción detallada por el momento.'}</p>
                
                <div className="space-y-2.5 pt-4 border-t border-white/5 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-stone-400">Categoría</span><span className="text-white font-semibold">{selectedPhoto.category}</span></div>
                  {selectedPhoto.professional_id && professionalMap[selectedPhoto.professional_id] && (
                    <div className="flex justify-between py-1 border-b border-white/5"><span className="text-stone-400">Especialista</span><span className="text-[#D4AF37] font-semibold">{professionalMap[selectedPhoto.professional_id]}</span></div>
                  )}
                  {selectedPhoto.source === 'client' && (
                    <div className="flex justify-between py-1 border-b border-white/5"><span className="text-stone-400">Cliente</span><span className="text-white font-semibold">{selectedPhoto.client_name}</span></div>
                  )}
                  <div className="flex justify-between py-1"><span className="text-stone-400">Fecha de Registro</span><span className="text-stone-300 font-mono">{new Date(selectedPhoto.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Formulario Inserción/Edición */}
        {showModal && (
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => { setShowModal(false); resetForm(); }}>
            <div className={`relative w-full max-w-xl rounded-2xl border p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'}`} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setShowModal(false); resetForm(); }} className={`absolute top-4 right-4 p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#EADED5]'} text-[#BCAEA5] hover:text-red-400`}><X className="w-5 h-5" /></button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl text-neutral-950 shadow-md bg-[#D4AF37]">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-xl font-serif font-extrabold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                    {editingPhoto ? 'Editar Registro de Galería' : 'Agregar Arte Comercial'}
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Completa la ficha técnica para actualizar el portafolio público.</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Zona de Carga/Preview */}
                <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                  isDark ? 'bg-[#150D08] border-[#3D281E] hover:border-[#D4AF37]/50' : 'bg-[#FDFBF9] border-[#EADED5] hover:border-[#D4AF37]/50'
                }`}>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  {previewUrl || formData.image_url ? (
                    <div className="relative group">
                      <img src={previewUrl || formData.image_url} alt="Preview" className="max-h-40 rounded-xl shadow-md object-contain" />
                      <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity">Cambiar Imagen</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <UploadCloud className="w-8 h-8 text-[#D4AF37] mx-auto stroke-[1.5]" />
                      <div>
                        <p className="text-xs font-bold text-[#D4AF37]">Haz clic para buscar o arrastra una imagen</p>
                        <p className="text-[10px] text-[#BCAEA5] mt-0.5">Formatos soportados: JPG, PNG, WEBP</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Título y Categoría */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Título Comercial</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Uñas Acrílicas Gold Premium" 
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                        isDark ? 'bg-[#150D08] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#BCAEA5]' : 'bg-[#FDFBF9] border-[#EADED5] text-[#1A0E0A] placeholder:text-[#BCAEA5]'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Línea de Servicio</label>
                    <select 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                        isDark ? 'bg-[#150D08] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FDFBF9] border-[#EADED5] text-[#1A0E0A]'
                      }`}
                    >
                      {CATEGORIES.filter(c => c !== 'Todas').map(c => <option key={c} value={c} className={isDark ? 'bg-[#1E120C]' : 'bg-white'}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Profesional */}
                <div className="space-y-1">
                  <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Artista / Profesional Asignado</label>
                  <select 
                    value={formData.professional_id} 
                    onChange={e => setFormData({...formData, professional_id: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                      isDark ? 'bg-[#150D08] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FDFBF9] border-[#EADED5] text-[#1A0E0A]'
                    }`}
                  >
                    <option value="" className={isDark ? 'bg-[#1E120C]' : 'bg-white'}>Ninguno / Salón General</option>
                    {professionals.map(p => <option key={p.id} value={p.id} className={isDark ? 'bg-[#1E120C]' : 'bg-white'}>{p.full_name} {p.role ? `(${p.role})` : ''}</option>)}
                  </select>
                </div>

                {/* Descripción */}
                <div className="space-y-1">
                  <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Descripción / Detalles del Diseño</label>
                  <textarea 
                    placeholder="Describe los materiales, el color o el tipo de técnica utilizada..." 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 resize-none ${
                      isDark ? 'bg-[#150D08] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#BCAEA5]' : 'bg-[#FDFBF9] border-[#EADED5] text-[#1A0E0A] placeholder:text-[#BCAEA5]'
                    }`}
                  />
                </div>

                {/* Switches y Orden */}
                <div className="grid grid-cols-2 gap-4 items-center pt-2">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                      className="accent-[#D4AF37] w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="is_active" className={`text-xs font-medium cursor-pointer ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>Visible al público</label>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <label className={`text-[10px] uppercase tracking-widest font-bold ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Prioridad:</label>
                    <input 
                      type="number"
                      value={formData.sort_order}
                      onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                      className={`w-20 px-3 py-1.5 text-center text-xs rounded-xl border font-mono outline-none ${
                        isDark ? 'bg-[#150D08] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FDFBF9] border-[#EADED5] text-[#1A0E0A]'
                      }`}
                    />
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => { setShowModal(false); resetForm(); }} 
                    className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-widest transition-colors ${
                      isDark ? 'border-[#3D281E] text-[#BCAEA5] hover:bg-[#3D281E]' : 'border-[#EADED5] text-[#6E5A4D] hover:bg-[#EADED5]'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={uploading} 
                    className="flex-1 px-4 py-2.5 rounded-xl text-neutral-950 hover:scale-105 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-md bg-gradient-to-r from-[#D4AF37] via-[#E8D5A0] to-[#C9A96E] disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                    <span>{uploading ? 'Guardando...' : 'Guardar Cambios'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
