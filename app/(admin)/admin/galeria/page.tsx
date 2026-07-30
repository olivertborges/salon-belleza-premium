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
  Plus
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
const GOLD_PALETTE = { primary: '#D4AF37', light: '#E8D5A0', dark: '#C9A96E' }

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

  // Estilos Dinámicos
  const headerGradient = useMemo(() => ({
    backgroundImage: `linear-gradient(135deg, ${GOLD_PALETTE.primary} 0%, ${GOLD_PALETTE.dark} 50%, ${GOLD_PALETTE.light} 100%)`
  }), [])

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
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-8 relative overflow-x-hidden ${isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'}`}>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-7xl mx-auto px-4 space-y-6 relative z-10 pt-6">
        
        {/* Cabecera */}
        <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl text-white border border-white/10" style={headerGradient}>
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-white/80">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                Portafolio del Salón
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight">Galería Fresh Nails</h1>
              <p className="text-xs md:text-sm text-white/80 font-medium max-w-md">Administra el portafolio comercial del salón, organiza tus trabajos y destaca el arte de tu equipo.</p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-center shrink-0">
              <button 
                onClick={() => fetchPhotos(false)} 
                disabled={refreshing} 
                className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95 shadow-lg"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button 
                onClick={() => { resetForm(); setShowModal(true); }}
                className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white text-stone-900 font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#F0E4DA] hover:scale-105 active:scale-95 transition-all"
              >
                <div className="p-1 rounded-md bg-[#D4AF37] text-white">
                  <Plus className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Nueva Foto</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notificaciones de Feedback */}
        {error && (
          <div className={`flex items-start gap-4 border p-4 rounded-2xl animate-fade-in ${isDark ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#D4AF37]/30 text-[#1A0E0A]'}`}>
            <AlertCircle className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <p className="text-sm font-light">{error}</p>
          </div>
        )}

        {success && (
          <div className={`flex items-start gap-4 border p-4 rounded-2xl animate-fade-in ${isDark ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#D4AF37]/30 text-[#1A0E0A]'}`}>
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <p className="text-sm font-light">{success}</p>
          </div>
        )}

        {/* Módulo de Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: 'Total', value: stats.total, icon: Layers },
            { label: 'Salón', value: stats.adminCount, icon: Tag },
            { label: 'Clientes', value: stats.clientCount, icon: Users },
            { label: 'Visibles', value: stats.activeCount, icon: Eye }
          ].map((stat, idx) => (
            <div key={idx} className={`rounded-2xl p-3 shadow-sm border transition-all ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
                  <stat.icon className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <p className={`text-[9px] font-mono uppercase tracking-wider font-black ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>{stat.label}</p>
                  <h3 className={`text-sm sm:text-base font-mono font-black ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{stat.value}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className={`flex flex-col md:flex-row gap-3 p-4 rounded-2xl border shadow-sm ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <Search className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
            <input 
              type="text" 
              placeholder="Buscar por título, descripción o cliente..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`bg-transparent border-none outline-none text-xs w-full font-medium ${isDark ? 'text-[#FFF9F6] placeholder:text-[#A89588]' : 'text-[#1A0E0A] placeholder:text-[#A89588]'}`}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                  categoryFilter === cat 
                    ? 'bg-[#D4AF37] text-[#1A0E0A]' 
                    : isDark 
                      ? 'bg-[#1E120C] border border-[#3D281E] text-[#A89588] hover:bg-[#3D281E]'
                      : 'bg-[#FFF9F6] border border-[#F0E4DA] text-[#5C4A3E] hover:bg-[#F0E4DA]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loader principal */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
            <p className="text-xs tracking-widest font-mono text-stone-400 uppercase">Sincronizando Portafolio...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className={`text-center py-20 border-2 border-dashed rounded-2xl ${isDark ? 'bg-[#2A1B14]/40 border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <ImageIcon className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
            <p className="text-sm font-medium">No se encontraron fotos en la galería</p>
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
                  className={`group relative rounded-2xl overflow-hidden cursor-pointer border shadow-md transition-all aspect-square transform hover:-translate-y-1 duration-300 ${
                    !photo.is_active ? 'opacity-50 grayscale-[40%]' : ''
                  } ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}
                >
                  <img src={photo.image_url || ''} alt={photo.title || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  
                  {/* Tags flotantes superiores */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[85%] z-20">
                    <span className="text-[7px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-white bg-[#D4AF37] shadow-sm">
                      {isClient ? `👤 ${photo.client_name}` : '👑 Studio'}
                    </span>
                    {!photo.is_active && (
                      <span className="text-[7px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-white bg-rose-600 shadow-sm">
                        Oculto
                      </span>
                    )}
                  </div>

                  {/* Capa Overlay interactiva en Hover */}
                  <div className={`absolute inset-0 bg-stone-950/80 p-4 flex flex-col justify-between text-white transition-opacity duration-300 ${hoveredId === photo.id ? 'opacity-100' : 'opacity-0'}`}>
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
          <div className="fixed inset-0 z-[9999] bg-stone-950/95 backdrop-blur-xl flex flex-col md:flex-row" onClick={closeLightbox}>
            <div className="relative flex-1 flex items-center justify-center p-6 h-[60vh] md:h-full" onClick={(e) => e.stopPropagation()}>
              <img src={selectedPhoto.image_url || ''} alt="" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
              {filteredPhotos.length > 1 && (
                <>
                  <button onClick={() => navigateLightbox('prev')} className="absolute left-4 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all"><ChevronLeft className="w-6 h-6" /></button>
                  <button onClick={() => navigateLightbox('next')} className="absolute right-4 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all"><ChevronRight className="w-6 h-6" /></button>
                </>
              )}
            </div>
            
            <div className="w-full md:w-96 bg-stone-900 border-t md:border-t-0 md:border-l border-white/10 p-6 flex flex-col text-stone-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] font-black uppercase">Metadatos de Obra</span>
                <button onClick={closeLightbox} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-stone-400 hover:text-white transition-all"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                <div>
                  <span className="px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-mono text-[9px] font-bold uppercase tracking-wider">{selectedPhoto.source === 'client' ? 'Aporte Cliente' : 'Administrador'}</span>
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
          <div className="fixed inset-0 z-[9999] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setShowModal(false); resetForm(); }}>
            <div className={`relative w-full max-w-xl rounded-3xl border p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setShowModal(false); resetForm(); }} className={`absolute top-4 right-4 p-2 rounded-xl transition-all ${isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#FFF9F6]'}`}><X className="w-5 h-5" /></button>
              
              <div className="mb-5">
                <h3 className="text-xl font-serif font-black tracking-tight">{editingPhoto ? 'Editar Registro de Galería' : 'Agregar Arte Comercial'}</h3>
                <p className="text-xs text-stone-400 mt-0.5">Completa la ficha técnica para actualizar el portafolio público.</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Zona de Carga/Preview */}
                <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${isDark ? 'border-[#3D281E] bg-[#1E120C]/50 hover:bg-[#3D281E]/30' : 'border-[#F0E4DA] bg-[#FFF9F6]/50 hover:bg-[#F0E4DA]/50'}`}>
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
                        <p className="text-xs font-bold">Haz clic para buscar o arrastra una imagen</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">Formatos soportados: JPG, PNG, WEBP</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Título y Categoría */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider font-bold">Título Comercial</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Uñas Acrílicas Gold Premium" 
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none font-medium focus:border-[#D4AF37] transition-all ${isDark ? 'bg-[#1E120C] border-[#3D281E] text-white' : 'bg-[#FFF9F6] border-[#F0E4DA] text-stone-900'}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider font-bold">Línea de Servicio</label>
                    <select 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none font-medium focus:border-[#D4AF37] transition-all ${isDark ? 'bg-[#1E120C] border-[#3D281E] text-white' : 'bg-[#FFF9F6] border-[#F0E4DA] text-stone-900'}`}
                    >
                      {CATEGORIES.filter(c => c !== 'Todas').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Profesional */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider font-bold">Artista / Profesional Asignado</label>
                  <select 
                    value={formData.professional_id} 
                    onChange={e => setFormData({...formData, professional_id: e.target.value})}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none font-medium focus:border-[#D4AF37] transition-all ${isDark ? 'bg-[#1E120C] border-[#3D281E] text-white' : 'bg-[#FFF9F6] border-[#F0E4DA] text-stone-900'}`}
                  >
                    <option value="">Ninguno / Salón General</option>
                    {professionals.map(p => <option key={p.id} value={p.id}>{p.full_name} {p.role ? `(${p.role})` : ''}</option>)}
                  </select>
                </div>

                {/* Descripción */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider font-bold">Descripción / Detalles del Diseño</label>
                  <textarea 
                    placeholder="Describe los materiales, el color o el tipo de técnica utilizada..." 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none font-medium focus:border-[#D4AF37] transition-all ${isDark ? 'bg-[#1E120C] border-[#3D281E] text-white' : 'bg-[#FFF9F6] border-[#F0E4DA] text-stone-900'}`}
                    rows={3}
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
                    <label htmlFor="is_active" className="text-xs font-medium cursor-pointer">Visible al público</label>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider font-bold">Prioridad:</label>
                    <input 
                      type="number"
                      value={formData.sort_order}
                      onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                      className={`w-20 px-2 py-1 text-center text-xs rounded-lg border outline-none ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'}`}
                    />
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-3 pt-4 border-t border-stone-200/10">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all">Cancelar</button>
                  <button type="submit" disabled={uploading} className="flex-1 py-3 bg-[#D4AF37] text-stone-900 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/10 hover:brightness-110 disabled:opacity-50">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />} Guardar Cambios
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
