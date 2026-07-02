'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import { 
  Camera, Sparkles, Heart, Share2, Download, ZoomIn, X,
  Grid3x3, LayoutGrid, Image as ImageIcon, Upload, Plus,
  Star, Award, Crown, Gem, Clock, User, Calendar,
  Search, Filter, Loader2, AlertCircle, CheckCircle
} from 'lucide-react'

interface GalleryImage {
  id: string
  client_id: string
  image_url: string
  title: string
  description: string
  is_active: boolean
  created_at: string
  client_name?: string
  is_public?: boolean
  likes?: number
}

interface ClientGalleryImage {
  id: string
  client_id: string
  image_url: string
  title: string
  description: string
  created_at: string
}

export default function GaleriaPage() {
  const { user, tenantId } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [publicImages, setPublicImages] = useState<GalleryImage[]>([])
  const [clientImages, setClientImages] = useState<ClientGalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [activeTab, setActiveTab] = useState<'public' | 'personal'>('public')
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid')
  const [hoveredImage, setHoveredImage] = useState<string | null>(null)
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('todos')
  const [clientId, setClientId] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | 'info' | null; message: string }>({ type: null, message: '' })

  const categories = [
    'todos', 'Corte', 'Color', 'Tratamientos', 'Peinados', 
    'Extensiones', 'Cejas', 'Pestañas', 'Manicuría', 'Estética'
  ]

  useEffect(() => {
    if (user?.id && tenantId) {
      loadGalleryData()
    }
  }, [user, tenantId])

  const loadGalleryData = async () => {
    setLoading(true)
    try {
      const { data: cliente } = await supabase
        .from('clients')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single()

      if (cliente) {
        setClientId(cliente.id)
        const { data: personalPhotos } = await supabase
          .from('client_gallery')
          .select('*')
          .eq('client_id', cliente.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        setClientImages(personalPhotos || [])
      }

      const { data: publicPhotos } = await supabase
        .from('client_gallery')
        .select(`
          *,
          clients:client_id (name)
        `)
        .eq('is_active', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(30)

      const mappedPublic = (publicPhotos || []).map((photo: any) => ({
        ...photo,
        client_name: photo.clients?.name || 'Fresh Nails',
        likes: Math.floor(Math.random() * 50) + 5
      }))

      setPublicImages(mappedPublic)

    } catch (error) {
      console.error('Error cargando galería:', error)
      setUploadStatus({ type: 'error', message: 'Error al cargar la galería' })
    } finally {
      setLoading(false)
    }
  }

  const handleLike = (imageId: string) => {
    const newLiked = new Set(likedImages)
    if (newLiked.has(imageId)) {
      newLiked.delete(imageId)
    } else {
      newLiked.add(imageId)
    }
    setLikedImages(newLiked)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadStatus({ type: null, message: '' })
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setUploadFile(file)
      
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string)
        setUploadStatus({ type: 'info', message: `📸 ${file.name} (${(file.size / 1024).toFixed(0)} KB)` })
      }
      reader.onerror = () => {
        setUploadStatus({ type: 'error', message: 'Error al leer el archivo' })
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleUpload = async () => {
    setUploadStatus({ type: null, message: '' })

    if (!uploadFile) {
      setUploadStatus({ type: 'error', message: 'Selecciona una foto primero' })
      return
    }
    if (!clientId) {
      setUploadStatus({ type: 'error', message: 'No se encontró tu perfil de cliente' })
      return
    }
    if (!tenantId) {
      setUploadStatus({ type: 'error', message: 'No se encontró el tenant' })
      return
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
    if (!validTypes.includes(uploadFile.type)) {
      setUploadStatus({ type: 'error', message: `Formato no válido: ${uploadFile.type}` })
      return
    }

    if (uploadFile.size > 10 * 1024 * 1024) {
      setUploadStatus({ type: 'error', message: 'La imagen no puede superar los 10MB' })
      return
    }

    setUploading(true)
    setUploadProgress(10)
    setUploadStatus({ type: 'info', message: '⏳ Subiendo archivo...' })

    try {
      const fileExt = uploadFile.name.split('.').pop()
      const fileName = `${clientId}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, uploadFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error subiendo:', uploadError)
        setUploadStatus({ type: 'error', message: `Error: ${uploadError.message}` })
        setUploading(false)
        return
      }

      setUploadProgress(50)
      setUploadStatus({ type: 'info', message: '📤 Obteniendo URL...' })

      const { data: urlData } = supabase.storage
        .from('gallery')
        .getPublicUrl(fileName)

      if (!urlData?.publicUrl) {
        setUploadStatus({ type: 'error', message: 'Error obteniendo la URL de la imagen' })
        setUploading(false)
        return
      }

      setUploadProgress(75)
      setUploadStatus({ type: 'info', message: '💾 Guardando en la base de datos...' })

      // Insertar en la base de datos - AHORA CON tenant_id
      const newImage = {
        client_id: clientId,
        tenant_id: tenantId,
        image_url: urlData.publicUrl,
        title: uploadTitle || 'Sin título',
        description: uploadDescription || '',
        is_active: true,
        is_public: true,
        created_at: new Date().toISOString()
      }

      console.log('📝 Datos a insertar:', newImage)

      const { data: insertData, error: insertError } = await supabase
        .from('client_gallery')
        .insert([newImage])
        .select()

      if (insertError) {
        console.error('Error insertando:', insertError)
        setUploadStatus({ type: 'error', message: `Error al guardar: ${insertError.message}` })
        setUploading(false)
        return
      }

      console.log('✅ Insertado correctamente:', insertData)

      setUploadProgress(100)
      setUploadStatus({ type: 'success', message: '✅ Foto subida exitosamente!' })

      if (insertData && insertData[0]) {
        const newImageData = {
          ...insertData[0],
          client_name: 'Tú',
          likes: 0
        }
        setClientImages(prev => [insertData[0], ...prev])
        setPublicImages(prev => [newImageData, ...prev])
      }

      setTimeout(() => {
        setUploadTitle('')
        setUploadDescription('')
        setUploadFile(null)
        setPreviewUrl(null)
        setShowUploadModal(false)
        setUploadStatus({ type: null, message: '' })
      }, 2000)

    } catch (error: any) {
      console.error('Error general:', error)
      setUploadStatus({ type: 'error', message: error.message || 'Error al subir la foto' })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('¿Eliminar esta foto?')) return
    
    try {
      const { error } = await supabase
        .from('client_gallery')
        .update({ is_active: false })
        .eq('id', imageId)

      if (error) throw error
      
      setClientImages(prev => prev.filter(i => i.id !== imageId))
      setPublicImages(prev => prev.filter(i => i.id !== imageId))
      
    } catch (error) {
      console.error('Error eliminando foto:', error)
    }
  }

  const filteredPublicImages = publicImages.filter(img => {
    if (searchTerm) {
      return img.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             img.description?.toLowerCase().includes(searchTerm.toLowerCase())
    }
    if (selectedCategory !== 'todos') {
      return img.title?.toLowerCase().includes(selectedCategory.toLowerCase())
    }
    return true
  })

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'FN'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-rose-500/20 rounded-full animate-ping" />
          </div>
          <Camera className="w-5 h-5 text-rose-500 absolute animate-pulse" />
        </div>
        <p className={`text-xs font-mono tracking-wide animate-pulse ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          Cargando galería...
        </p>
      </div>
    )
  }

  return (
    <div className={`w-full min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-[#0a0908]' : 'bg-[#fcfbfa]'
    }`}>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        {/* HEADER */}
        <div className={`relative overflow-hidden rounded-3xl border p-8 md:p-10 shadow-xl mb-8 ${
          isDark 
            ? 'bg-gradient-to-br from-[#161311] via-[#120f0e] to-[#0a0908] border-stone-800/50 shadow-2xl shadow-black/50' 
            : 'bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 border-stone-700/50 shadow-2xl shadow-stone-900/20'
        }`}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className={`text-[10px] uppercase tracking-[0.3em] font-mono flex items-center gap-2 ${
                isDark ? 'text-rose-400' : 'text-rose-600'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                🖼️ Galería Fresh
              </p>
              <h1 className="text-3xl md:text-4xl font-serif italic text-white mt-2">
                Tu <span className="text-shimmer">Inspiración</span> Visual
              </h1>
              <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-stone-400'}`}>
                Descubre trabajos increíbles y guarda tus mejores momentos
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-xl border text-[10px] font-mono flex items-center gap-1.5 ${
                isDark 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
              }`}>
                <ImageIcon className="w-3 h-3" />
                {publicImages.length + clientImages.length} fotos
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className={`px-4 py-2 rounded-xl text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                  isDark 
                    ? 'bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white shadow-lg shadow-rose-600/20' 
                    : 'bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white shadow-lg shadow-rose-600/20'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Subir foto
              </button>
            </div>
          </div>
        </div>

        {/* TABS + FILTROS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('public')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTab === 'public'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : isDark
                    ? 'bg-stone-900/40 text-stone-400 hover:text-stone-200 border border-stone-800'
                    : 'bg-stone-100/50 text-stone-500 hover:text-stone-800 border border-stone-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5" />
                Inspiración
              </span>
            </button>
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTab === 'personal'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : isDark
                    ? 'bg-stone-900/40 text-stone-400 hover:text-stone-200 border border-stone-800'
                    : 'bg-stone-100/50 text-stone-500 hover:text-stone-800 border border-stone-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5" />
                Mis Fotos
                {clientImages.length > 0 && (
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                    isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-500/10 text-rose-600'
                  }`}>
                    {clientImages.length}
                  </span>
                )}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'public' && (
              <>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  }`} />
                  <input
                    type="text"
                    placeholder="Buscar fotos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:border-rose-500/50 transition-all w-40 md:w-56 ${
                      isDark 
                        ? 'bg-stone-900/40 border-stone-800 text-stone-200 placeholder-stone-500' 
                        : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
                    }`}
                  />
                </div>

                <div className={`flex gap-1 border rounded-xl p-1 ${
                  isDark ? 'border-stone-800' : 'border-stone-200'
                }`}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? isDark ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-900'
                        : isDark ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('masonry')}
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === 'masonry'
                        ? isDark ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-900'
                        : isDark ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* CATEGORÍAS */}
        {activeTab === 'public' && (
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[9px] font-mono font-medium transition-all ${
                  selectedCategory === cat
                    ? isDark
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                      : 'bg-rose-500/10 border border-rose-500/40 text-rose-600'
                    : isDark
                      ? 'bg-stone-900/30 border border-stone-800 text-stone-400 hover:text-stone-200'
                      : 'bg-stone-100/50 border border-stone-200 text-stone-500 hover:text-stone-800'
                }`}
              >
                {cat === 'todos' ? '🌟 Todos' : cat}
              </button>
            ))}
          </div>
        )}

        {/* GALERÍA PÚBLICA */}
        {activeTab === 'public' && (
          <div className="space-y-6">
            {filteredPublicImages.length === 0 ? (
              <div className={`text-center py-16 border-2 border-dashed rounded-3xl ${
                isDark ? 'border-stone-800 bg-stone-900/20' : 'border-stone-200 bg-stone-50/50'
              }`}>
                <Camera className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-stone-700' : 'text-stone-300'}`} />
                <h3 className={`text-xl font-serif italic ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                  No hay fotos disponibles
                </h3>
                <p className={`text-xs mt-2 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                  Sé la primera en compartir tu experiencia
                </p>
              </div>
            ) : (
              <div className={`
                ${viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                  : 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4'
                }
              `}>
                {filteredPublicImages.map((img, index) => {
                  const isLiked = likedImages.has(img.id)
                  const isHovered = hoveredImage === img.id

                  return (
                    <div
                      key={img.id}
                      className={`relative group rounded-2xl overflow-hidden border transition-all duration-500 ${
                        isDark 
                          ? 'bg-stone-900/40 border-stone-800/70 hover:border-rose-500/30' 
                          : 'bg-white border-stone-200/90 hover:border-rose-500/40'
                      } ${viewMode === 'masonry' ? 'break-inside-avoid' : ''}`}
                      onMouseEnter={() => setHoveredImage(img.id)}
                      onMouseLeave={() => setHoveredImage(null)}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="relative aspect-square overflow-hidden cursor-pointer">
                        {img.image_url ? (
                          <img
                            src={img.image_url}
                            alt={img.title || 'Foto de galería'}
                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                            onClick={() => setSelectedImage(img)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-800 to-stone-900">
                            <Camera className="w-12 h-12 text-stone-600" />
                          </div>
                        )}

                        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-300 ${
                          isHovered ? 'opacity-100' : 'opacity-0'
                        }`}>
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="text-white text-sm font-medium truncate">
                                  {img.title || 'Sin título'}
                                </p>
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-[8px] font-bold text-rose-400">
                                    {getInitials(img.client_name || '')}
                                  </div>
                                  <span className="text-white/60 text-[10px]">
                                    {img.client_name || 'Fresh Nails'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleLike(img.id)
                                  }}
                                  className={`p-2 rounded-full transition-all ${
                                    isLiked
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-black/50 text-white hover:bg-rose-500/80'
                                  }`}
                                >
                                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                  onClick={() => setSelectedImage(img)}
                                  className="p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition-all"
                                >
                                  <ZoomIn className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[9px] font-mono flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                          {img.likes || 0}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* GALERÍA PERSONAL */}
        {activeTab === 'personal' && (
          <div className="space-y-6">
            {clientImages.length === 0 ? (
              <div className={`text-center py-16 border-2 border-dashed rounded-3xl ${
                isDark ? 'border-stone-800 bg-stone-900/20' : 'border-stone-200 bg-stone-50/50'
              }`}>
                <Upload className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-stone-700' : 'text-stone-300'}`} />
                <h3 className={`text-xl font-serif italic ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                  Tu galería personal está vacía
                </h3>
                <p className={`text-xs mt-2 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                  Sube tus fotos para guardar tus mejores momentos
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 px-6 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 mx-auto bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white shadow-lg shadow-rose-600/20"
                >
                  <Plus className="w-4 h-4" />
                  Subir mi primera foto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {clientImages.map((img, index) => (
                  <div
                    key={img.id}
                    className={`group relative rounded-2xl overflow-hidden border transition-all duration-500 hover:-translate-y-1 ${
                      isDark 
                        ? 'bg-stone-900/40 border-stone-800/70 hover:border-rose-500/30 hover:shadow-[0_20px_30px_-10px_rgba(0,0,0,0.7)]' 
                        : 'bg-white border-stone-200/90 hover:border-rose-500/40 hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.05)]'
                    }`}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      {img.image_url ? (
                        <img
                          src={img.image_url}
                          alt={img.title || 'Mi foto'}
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-800 to-stone-900">
                          <Camera className="w-12 h-12 text-stone-600" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <p className="text-white text-sm font-medium truncate">
                                {img.title || 'Sin título'}
                              </p>
                              <p className="text-white/60 text-[10px]">
                                {new Date(img.created_at).toLocaleDateString('es', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteImage(img.id)}
                              className="p-2 rounded-full bg-black/50 text-white hover:bg-red-500/80 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE IMAGEN COMPLETA */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative w-full h-full bg-black/50">
              {selectedImage.image_url ? (
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.title || 'Foto'}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              ) : (
                <div className="w-full h-96 flex items-center justify-center">
                  <Camera className="w-20 h-20 text-stone-600" />
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-white text-xl font-serif italic">
                    {selectedImage.title || 'Sin título'}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {selectedImage.description || 'Sin descripción'}
                  </p>
                  <div className="flex items-center gap-3 text-white/50 text-[10px] font-mono">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {selectedImage.client_name || 'Fresh Nails'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                      {selectedImage.likes || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(selectedImage.created_at).toLocaleDateString('es', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLike(selectedImage.id)}
                    className={`p-2 rounded-full transition-all ${
                      likedImages.has(selectedImage.id)
                        ? 'bg-rose-500 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${likedImages.has(selectedImage.id) ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      if (selectedImage.image_url) {
                        window.open(selectedImage.image_url, '_blank')
                      }
                    }}
                    className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: selectedImage.title || 'Fresh Nails',
                          text: selectedImage.description || 'Mira esta increíble transformación ✨',
                          url: selectedImage.image_url
                        })
                      }
                    }}
                    className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUBIR FOTO */}
      {showUploadModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => {
            if (!uploading) {
              setShowUploadModal(false)
              setUploadStatus({ type: null, message: '' })
            }
          }}
        >
          <div 
            className={`max-w-md w-full rounded-3xl p-6 border shadow-2xl ${
              isDark 
                ? 'bg-[#141211] border-stone-800/50' 
                : 'bg-white border-stone-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  isDark ? 'bg-rose-500/10' : 'bg-rose-50'
                }`}>
                  <Upload className="w-5 h-5 text-rose-500" />
                </div>
                <h3 className={`text-lg font-serif italic ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                  Subir foto
                </h3>
              </div>
              <button
                onClick={() => {
                  if (!uploading) {
                    setShowUploadModal(false)
                    setUploadStatus({ type: null, message: '' })
                  }
                }}
                className={`p-1 rounded-full transition-all ${
                  uploading ? 'opacity-50 cursor-not-allowed' : isDark ? 'hover:bg-stone-800 text-stone-500' : 'hover:bg-stone-100 text-stone-400'
                }`}
                disabled={uploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ESTADO DE LA SUBIDA */}
            {uploadStatus.type && (
              <div className={`mb-4 p-3 rounded-xl border flex items-center gap-2 ${
                uploadStatus.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : uploadStatus.type === 'error'
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              }`}>
                {uploadStatus.type === 'success' && <CheckCircle className="w-4 h-4" />}
                {uploadStatus.type === 'error' && <AlertCircle className="w-4 h-4" />}
                {uploadStatus.type === 'info' && <Loader2 className="w-4 h-4 animate-spin" />}
                <span className="text-xs">{uploadStatus.message}</span>
              </div>
            )}

            {/* Preview */}
            {previewUrl && (
              <div className="relative mb-4 rounded-xl overflow-hidden border border-stone-700/30">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={() => {
                    if (!uploading) {
                      setUploadFile(null)
                      setPreviewUrl(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                      setUploadStatus({ type: null, message: '' })
                    }
                  }}
                  className={`absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-red-500/80 transition-all ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Drop zone */}
            <div 
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                previewUrl ? 'hidden' : ''
              } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-rose-500/50'}`}
              onClick={!uploading ? triggerFileInput : undefined}
            >
              <Camera className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-stone-600' : 'text-stone-400'}`} />
              <p className={`text-sm ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                {uploading ? 'Subiendo...' : 'Haz clic para seleccionar una foto'}
              </p>
              <p className={`text-[10px] mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                PNG, JPG, WEBP hasta 10MB
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </div>

            {/* Info del archivo */}
            {uploadFile && previewUrl && !uploading && (
              <div className={`text-center text-[10px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                <p>📸 {uploadFile.name} ({(uploadFile.size / 1024).toFixed(0)} KB)</p>
                <button
                  onClick={triggerFileInput}
                  className="text-rose-500 hover:text-rose-400 transition-colors mt-1"
                  disabled={uploading}
                >
                  Cambiar foto
                </button>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Título de la foto"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                disabled={uploading}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500/50 transition-all ${
                  isDark 
                    ? 'bg-stone-900/30 border-stone-800 text-stone-200 placeholder-stone-500' 
                    : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
                } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <textarea
                placeholder="Descripción (opcional)"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                disabled={uploading}
                rows={2}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500/50 transition-all resize-none ${
                  isDark 
                    ? 'bg-stone-900/30 border-stone-800 text-stone-200 placeholder-stone-500' 
                    : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
                } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              
              {uploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>Subiendo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading || !uploadFile}
                className={`w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-medium transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  uploading ? 'opacity-70' : ''
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Subir foto
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
