// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Sparkles, Plus, Search, Clock, DollarSign, 
  Layers, Edit, Trash2, CheckCircle2, 
  X, Save, Tag, Scissors, Star, Heart,
  RefreshCw, Package, Eye, Hand,
  AlertCircle, ChevronDown, ChevronLeft, ChevronRight,
  Image as ImageIcon, Upload, Loader2
} from 'lucide-react'

type Servicio = {
  id: string
  name: string
  description: string
  price: number
  duration: number
  badge: string
  category: string
  image_url?: string
  is_active: boolean
  created_at: string
}

const categorias = [
  { name: 'Todos', icon: Star },
  { name: 'Uñas', icon: Hand },
  { name: 'Micropigmentación', icon: Eye },
  { name: 'Cejas', icon: Sparkles },
  { name: 'Peluquería', icon: Scissors },
  { name: 'Depilación', icon: Heart },
  { name: 'Estética', icon: Sparkles }
]

const initialFormState = {
  name: '',
  description: '',
  price: '',
  duration: '',
  badge: '',
  category: 'Uñas',
  image_url: ''
}

const ITEMS_PER_PAGE = 6

export default function ServiciosPage() {
  const { settings } = useSettings()
  const { tenantId } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [servicios, setServicios] = useState<Servicio[]>([])
  const [search, setSearch] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [uploadingImage, setUploadingImage] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState(initialFormState)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState<number>(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedCategory])

  const fetchServicios = async (showLoading = true) => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    if (showLoading) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)

    try {
      const { data, error: sbError } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (sbError) throw sbError
      if (data) setServicios(data as Servicio[])
    } catch (err: any) {
      console.error('Error al cargar servicios de Supabase:', err)
      setError(err.message || 'Error al cargar los servicios')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchServicios()
  }, [tenantId])

  const handleRefresh = async () => {
    await fetchServicios(false)
    setSuccess('Catálogo actualizado')
    setTimeout(() => setSuccess(null), 2500)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar los 5MB')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${tenantId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('services')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('services')
        .getPublicUrl(fileName)

      return publicUrlData.publicUrl
    } catch (err: any) {
      console.error('Error subiendo imagen a Storage:', err)
      throw new Error('No se pudo subir la imagen del servicio')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) {
      setError('Sesión inválida o sin identificador comercial')
      return
    }

    setError(null)
    setSuccess(null)

    try {
      let finalImageUrl = formData.image_url

      if (imageFile) {
        const uploadedUrl = await uploadImageToStorage(imageFile)
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl
        }
      }

      const payload = {
        tenant_id: tenantId,
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        price: parseFloat(formData.price) || 0,
        duration: parseInt(formData.duration) || 60,
        badge: formData.badge.trim().toLowerCase(),
        category: formData.category,
        image_url: finalImageUrl,
        is_active: true
      }

      if (editingId) {
        const { error: updateError } = await supabase
          .from('services')
          .update(payload)
          .eq('id', editingId)
        if (updateError) throw updateError
        setSuccess('Servicio actualizado correctamente')
      } else {
        const { error: insertError } = await supabase
          .from('services')
          .insert([payload])
        if (insertError) throw insertError
        setSuccess('Servicio creado correctamente')
      }

      setShowModal(false)
      setEditingId(null)
      setFormData(initialFormState)
      setImageFile(null)
      setImagePreview(null)
      fetchServicios(false)
    } catch (err: any) {
      console.error('Error guardando servicio:', err)
      setError(err.message || 'Error al procesar la solicitud')
    } finally {
      setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 3000)
    }
  }

  const handleEdit = (servicio: Servicio) => {
    setEditingId(servicio.id)
    setFormData({
      name: servicio.name,
      description: servicio.description || '',
      price: String(servicio.price),
      duration: String(servicio.duration),
      badge: servicio.badge || '',
      category: servicio.category || 'Uñas',
      image_url: servicio.image_url || ''
    })
    setImageFile(null)
    setImagePreview(servicio.image_url || null)
    setShowModal(true)
  }

  const handleCreateNew = () => {
    setEditingId(null)
    setFormData(initialFormState)
    setImageFile(null)
    setImagePreview(null)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente este tratamiento del catálogo comercial?')) return
    setError(null)
    setSuccess(null)

    try {
      const { error: deleteError } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', id)
      if (deleteError) throw deleteError
      setSuccess('Servicio removido del catálogo')
      fetchServicios(false)
    } catch (err: any) {
      console.error('Error eliminando servicio:', err)
      setError(err.message || 'No se pudo eliminar el servicio')
    } finally {
      setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 3000)
    }
  }

  const filtrados = servicios.filter((s: Servicio) => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) || 
                        s.description?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === 'Todos' || s.category === selectedCategory
    return matchSearch && matchCategory
  })

  const totalPages = Math.ceil(filtrados.length / ITEMS_PER_PAGE)
  const serviciosPaginados = filtrados.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const promedioPrecio = servicios.length > 0 ? servicios.reduce((sum, s) => sum + s.price, 0) / servicios.length : 0
  const totalServicios = servicios.length
  const totalCategorias = new Set(servicios.map(s => s.category)).size

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-500 ${isDark ? 'bg-[#150D08]' : 'bg-[#FDFBF9]'}`}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
            <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
          </div>
          <p className={`text-[10px] tracking-[0.4em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]/60'}`}>
            Sincronizando Catálogo...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-12 relative overflow-hidden ${isDark ? 'bg-[#150D08] text-[#FFF9F6]' : 'bg-[#FDFBF9] text-[#1A0E0A]'}`}>
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#EC4899]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none z-0 opacity-15 mix-blend-overlay bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 relative z-10 pt-4">

        {/* HEADER HERO BANNER (REDISEÑADO - EXECUTIVE LUXURY) */}
        <div className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ${
          isDark 
            ? 'bg-gradient-to-br from-[#271810] via-[#1E120C] to-[#160E09] border-[#3D281E] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]' 
            : 'bg-gradient-to-br from-white via-[#FBF7F4] to-[#F5ECE5] border-[#EADED5] shadow-[0_25px_50px_-15px_rgba(225,208,195,0.4)]'
        }`}>
          <div className="absolute -top-40 -right-40 w-[350px] h-[350px] bg-gradient-to-br from-[#EC4899]/20 to-[#D4AF37]/20 rounded-full blur-[90px] pointer-events-none animate-pulse [animation-duration:6s]" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

          <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37] via-[#EC4899] to-[#3B82F6] rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-4 rounded-2xl shadow-xl bg-neutral-950 text-white flex items-center justify-center border border-white/10">
                  <Scissors className="w-7 h-7 text-[#D4AF37] animate-pulse" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[9px] font-black uppercase tracking-[0.25em] text-[#C9A96E]">
                  <Sparkles className="w-2.5 h-2.5" />
                  ✦ Catálogo Operativo Sincronizado
                </div>
                <h2 className={`font-serif text-3xl md:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                  Servicios <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#EC4899] to-[#C9A96E] font-serif italic font-normal">Fresh Nails</span>
                </h2>
                <p className={`text-sm font-light ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                  Administra la oferta comercial, precios, fotos y tiempos de tus tratamientos integrales.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 border-t pt-5 md:pt-0 md:border-t-0 border-[#EADED5] dark:border-[#3D281E]">
              <button 
                onClick={handleRefresh} 
                disabled={refreshing} 
                className={`w-full sm:w-auto px-5 py-3 rounded-xl border font-bold text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2.5 transition-all duration-300 backdrop-blur-md shadow-xs active:scale-95 ${
                  isDark 
                    ? 'bg-[#1C120C]/80 border-[#3D281E] text-[#BCAEA5] hover:text-white hover:border-[#D4AF37]/50' 
                    : 'bg-white/80 border-[#EADED5] text-[#5C4A3E] hover:text-[#1A0E0A] hover:border-[#D4AF37]/50'
                }`}
                title="Actualizar Catálogo"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Sincronizando' : 'Actualizar'}</span>
              </button>

              <button 
                onClick={handleCreateNew}
                className="w-full sm:w-auto px-5 py-3 rounded-xl text-neutral-950 font-black text-xs uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl shadow-[#D4AF37]/10 hover:shadow-[#D4AF37]/20 hover:scale-[1.03] active:scale-95 bg-gradient-to-r from-[#D4AF37] via-[#E8D5A0] to-[#C9A96E]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Nuevo Servicio</span>
              </button>
            </div>
          </div>
        </div>

        {/* NOTIFICACIONES */}
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

        {/* METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className={`rounded-2xl p-5 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'}`}>
            <div className="flex items-center gap-4 min-w-0">
              <div className={`p-3 rounded-xl shrink-0 ${isDark ? 'bg-[#291A11]' : 'bg-[#FAF6F2]'}`}>
                <Package className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div className="min-w-0">
                <p className={`text-[10px] font-mono uppercase tracking-wider font-black ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Servicios Totales</p>
                <p className="text-2xl font-black mt-0.5">{totalServicios}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-5 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'}`}>
            <div className="flex items-center gap-4 min-w-0">
              <div className={`p-3 rounded-xl shrink-0 ${isDark ? 'bg-[#291A11]' : 'bg-[#FAF6F2]'}`}>
                <DollarSign className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div className="min-w-0">
                <p className={`text-[10px] font-mono uppercase tracking-wider font-black ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Ticket Promedio</p>
                <p className="text-2xl font-black text-[#D4AF37] mt-0.5">${Math.round(promedioPrecio).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-5 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'}`}>
            <div className="flex items-center gap-4 min-w-0">
              <div className={`p-3 rounded-xl shrink-0 ${isDark ? 'bg-[#291A11]' : 'bg-[#FAF6F2]'}`}>
                <Layers className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div className="min-w-0">
                <p className={`text-[10px] font-mono uppercase tracking-wider font-black ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Categorías</p>
                <p className="text-2xl font-black text-[#D4AF37] mt-0.5">{totalCategorias}</p>
              </div>
            </div>
          </div>
        </div>

        {/* FILTROS Y BÚSQUEDA */}
        <div className={`flex items-center gap-3 p-3.5 rounded-2xl border shadow-sm transition-all duration-300 ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'}`}>
          <Search className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o descripción..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className={`bg-transparent border-none outline-none text-xs w-full font-medium ${isDark ? 'text-[#FFF9F6] placeholder:text-[#BCAEA5]' : 'text-[#1A0E0A] placeholder:text-[#6E5A4D]'}`}
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#EADED5]'}`}
            >
              <X className={`w-4 h-4 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`} />
            </button>
          )}
        </div>

        {/* CATEGORÍAS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {categorias.map((cat) => {
            const IconComponent = cat.icon
            const esActivo = selectedCategory === cat.name

            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`relative p-3.5 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all duration-300 border shadow-sm ${
                  esActivo 
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_4px_15px_rgba(212,175,55,0.15)]' 
                    : isDark 
                      ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#D4AF37]/40' 
                      : 'bg-white border-[#EADED5] hover:border-[#D4AF37]/40'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  esActivo 
                    ? 'bg-[#D4AF37] text-[#1A0E0A] scale-105' 
                    : isDark 
                      ? 'bg-[#150D08] border border-[#3D281E] text-[#BCAEA5]' 
                      : 'bg-[#FDFBF9] border border-[#EADED5] text-[#6E5A4D]'
                }`}>
                  <IconComponent className="w-3.5 h-3.5" />
                </div>

                <span className={`text-[10px] font-mono tracking-tight transition-colors ${
                  esActivo ? 'text-[#D4AF37] font-bold' : isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'
                }`}>
                  {cat.name}
                </span>

                {esActivo && (
                  <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full bg-[#D4AF37]" />
                )}
              </button>
            )
          })}
        </div>

        {/* LISTADO CON IMÁGENES */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>
          {serviciosPaginados.map((servicio: Servicio) => (
            <div 
              key={servicio.id} 
              className={`rounded-2xl border overflow-hidden flex flex-col justify-between shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group ${
                isDark ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#D4AF37]/40' : 'bg-white border-[#EADED5] hover:border-[#D4AF37]/40'
              }`}
            >
              {/* IMAGEN DEL SERVICIO */}
              <div className="relative h-44 w-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                {servicio.image_url ? (
                  <img 
                    src={servicio.image_url} 
                    alt={servicio.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center opacity-40 text-stone-500">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-[10px] uppercase font-mono">Sin Imagen</span>
                  </div>
                )}
                {servicio.badge && (
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider text-[#1A0E0A] bg-[#D4AF37] shadow-md">
                    {servicio.badge.toUpperCase()}
                  </span>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className={`text-[9px] uppercase font-mono tracking-widest flex items-center gap-1.5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                    <Layers className="w-3 h-3 text-[#D4AF37]" /> 
                    {servicio.category || 'General'}
                  </span>

                  <h3 className={`text-base font-semibold transition-colors ${isDark ? 'text-[#FFF9F6] group-hover:text-[#D4AF37]' : 'text-[#1A0E0A] group-hover:text-[#D4AF37]'}`}>
                    {servicio.name}
                  </h3>

                  <p className={`text-xs line-clamp-2 leading-relaxed min-h-[36px] ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                    {servicio.description || 'Sin descripción detallada asignada.'}
                  </p>
                </div>

                <div>
                  <div className={`pt-3 border-t flex justify-between items-center text-xs font-mono ${isDark ? 'border-[#3D281E]' : 'border-[#EADED5]'}`}>
                    <div className={`flex items-center gap-1.5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{servicio.duration || 60} min</span>
                    </div>
                    <div className="font-mono font-extrabold text-base text-[#D4AF37]">
                      ${servicio.price?.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button 
                      onClick={() => handleEdit(servicio)} 
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                        isDark 
                          ? 'bg-[#150D08] border-[#3D281E] text-[#BCAEA5] hover:text-[#D4AF37] hover:border-[#D4AF37]/40' 
                          : 'bg-[#FDFBF9] border-[#EADED5] text-[#6E5A4D] hover:text-[#D4AF37] hover:border-[#D4AF37]/40'
                      }`}
                    >
                      <Edit className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(servicio.id)} 
                      className={`px-3 py-2.5 rounded-xl border transition-all ${
                        isDark 
                          ? 'bg-[#150D08] border-[#3D281E] text-[#BCAEA5] hover:text-red-500 hover:border-red-500/30' 
                          : 'bg-[#FDFBF9] border-[#EADED5] text-[#6E5A4D] hover:text-red-500 hover:border-red-500/30'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filtrados.length === 0 && (
            <div className={`col-span-full py-12 text-center font-mono text-xs border border-dashed rounded-2xl ${
              isDark ? 'bg-[#1E120C]/40 border-[#3D281E] text-[#BCAEA5]' : 'bg-white border-[#EADED5] text-[#6E5A4D]'
            }`}>
              No se encontraron servicios que coincidan con los criterios.
            </div>
          )}
        </div>

        {/* PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 font-mono text-xs">
            <span className={isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}>
              Mostrando <span className="font-bold text-[#D4AF37]">{serviciosPaginados.length}</span> de <span className="font-bold">{filtrados.length}</span> resultados
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2.5 rounded-xl border transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
                  isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6]' : 'bg-white border-[#EADED5] text-[#1A0E0A]'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => {
                const esPaginaActual = currentPage === page
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-xl border text-[10px] font-bold transition-all ${
                      esPaginaActual
                        ? 'bg-[#D4AF37] border-[#D4AF37] text-[#1A0E0A]'
                        : isDark
                          ? 'bg-[#1E120C] border-[#3D281E] text-[#BCAEA5] hover:border-[#D4AF37]/40'
                          : 'bg-white border-[#EADED5] text-[#6E5A4D] hover:border-[#D4AF37]/40'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2.5 rounded-xl border transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
                  isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6]' : 'bg-white border-[#EADED5] text-[#1A0E0A]'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* DIÁLOGO MODAL CON SUBIDA DE FOTO */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className={`relative w-full max-w-md rounded-2xl shadow-2xl border p-6 max-h-[90vh] overflow-y-auto transition-all duration-300 ${
              isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'
            }`}>
              <button 
                onClick={() => setShowModal(false)}
                className={`absolute top-4 right-4 p-2 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#EADED5]'
                } text-[#BCAEA5] hover:text-red-400`}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl text-white shadow-md bg-[#D4AF37]">
                  <Tag className="w-5 h-5" />
                </div>
                <h3 className={`text-xl font-serif font-extrabold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  {editingId ? 'Modificar Tratamiento' : 'Registrar Tratamiento'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* CAMPO PARA SUBIR IMAGEN */}
                <div>
                  <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                    Fotografía del Servicio
                  </label>
                  
                  <div className="space-y-3">
                    {imagePreview ? (
                      <div className="relative h-40 w-full rounded-xl overflow-hidden border border-[#D4AF37]/30 group">
                        <img src={imagePreview} alt="Previsualización" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null)
                            setImagePreview(null)
                            setFormData({...formData, image_url: ''})
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600 text-white shadow-lg hover:bg-red-700 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center h-32 w-full rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                        isDark ? 'bg-[#150D08] border-[#3D281E] hover:border-[#D4AF37]/50' : 'bg-[#FDFBF9] border-[#EADED5] hover:border-[#D4AF37]/50'
                      }`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-6 h-6 text-[#D4AF37] mb-1" />
                          <p className="text-xs font-semibold text-[#D4AF37]">Haz clic para subir imagen</p>
                          <p className="text-[9px] text-[#BCAEA5] mt-0.5">PNG, JPG o WEBP (Máx. 5MB)</p>
                        </div>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                    Nombre del Servicio *
                  </label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                      isDark ? 'bg-[#150D08] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#BCAEA5]' : 'bg-[#FDFBF9] border-[#EADED5] text-[#1A0E0A] placeholder:text-[#BCAEA5]'
                    }`}
                    placeholder="Ej: Microblading Cejas"
                    required 
                  />
                </div>

                <div>
                  <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                    Descripción
                  </label>
                  <textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    rows={3} 
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 resize-none ${
                      isDark ? 'bg-[#150D08] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#BCAEA5]' : 'bg-[#FDFBF9] border-[#EADED5] text-[#1A0E0A] placeholder:text-[#BCAEA5]'
                    }`}
                    placeholder="Detalla el tratamiento..." 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                      Precio ($) *
                    </label>
                    <input 
                      type="number" 
                      value={formData.price} 
                      onChange={(e) => setFormData({...formData, price: e.target.value})} 
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                        isDark ? 'bg-[#150D08] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#BCAEA5]' : 'bg-[#FDFBF9] border-[#EADED5] text-[#1A0E0A] placeholder:text-[#BCAEA5]'
                      }`}
                      placeholder="0.00"
                      required 
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                      Duración (Min) *
                    </label>
                    <input 
                      type="number" 
                      value={formData.duration} 
                      onChange={(e) => setFormData({...formData, duration: e.target.value})} 
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                        isDark ? 'bg-[#150D08] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#BCAEA5]' : 'bg-[#FDFBF9] border-[#EADED5] text-[#1A0E0A] placeholder:text-[#BCAEA5]'
                      }`}
                      placeholder="60"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                      Categoría *
                    </label>
                    <div className="relative w-full">
                      <select 
                        value={formData.category} 
                        onChange={(e) => setFormData({...formData, category: e.target.value})} 
                        className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 appearance-none bg-transparent ${
                          isDark ? 'bg-[#150D08] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FDFBF9] border-[#EADED5] text-[#1A0E0A]'
                        }`}
                      >
                        <option value="Uñas" className={isDark ? 'bg-[#1E120C]' : 'bg-white'}>💅 Uñas</option>
                        <option value="Micropigmentación" className={isDark ? 'bg-[#1E120C]' : 'bg-white'}>👁️ Micropigmentación</option>
                        <option value="Cejas" className={isDark ? 'bg-[#1E120C]' : 'bg-white'}>✨ Cejas</option>
                        <option value="Peluquería" className={isDark ? 'bg-[#1E120C]' : 'bg-white'}>✂️ Peluquería</option>
                        <option value="Depilación" className={isDark ? 'bg-[#1E120C]' : 'bg-white'}>💖 Depilación</option>
                        <option value="Estética" className={isDark ? 'bg-[#1E120C]' : 'bg-white'}>🌟 Estética</option>
                      </select>
                      <ChevronDown className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`} />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                      Etiqueta destacada
                    </label>
                    <input 
                      type="text" 
                      value={formData.badge} 
                      onChange={(e) => setFormData({...formData, badge: e.target.value})} 
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm uppercase transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                        isDark ? 'bg-[#150D08] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#BCAEA5]' : 'bg-[#FDFBF9] border-[#EADED5] text-[#1A0E0A] placeholder:text-[#BCAEA5]'
                      }`}
                      placeholder="Ej: TOP, NUEVO" 
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    disabled={uploadingImage}
                    className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-widest transition-colors ${
                      isDark ? 'border-[#3D281E] text-[#BCAEA5] hover:bg-[#3D281E]' : 'border-[#EADED5] text-[#6E5A4D] hover:bg-[#EADED5]'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={uploadingImage}
                    className="flex-1 px-4 py-2.5 rounded-xl text-[#1A0E0A] hover:scale-105 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-md bg-gradient-to-r from-[#D4AF37] via-[#E8D5A0] to-[#C9A96E] disabled:opacity-50"
                  >
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{uploadingImage ? 'Subiendo...' : 'Guardar'}</span>
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
