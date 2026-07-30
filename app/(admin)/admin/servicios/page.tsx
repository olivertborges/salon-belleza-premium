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
  AlertCircle, ChevronDown
} from 'lucide-react'

type Servicio = {
  id: string
  name: string
  description: string
  price: number
  duration: number
  badge: string
  category: string
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
  category: 'Uñas'
}

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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState(initialFormState)

  // ============================================================
  // PALETA DE COLORES - DORADO PROTAGONISTA
  // ============================================================
  const gold = '#D4AF37'
  const goldLight = '#E8D5A0'
  const goldDark = '#C9A96E'

  const headerGradient = {
    backgroundImage: `linear-gradient(135deg, ${gold} 0%, ${goldDark} 50%, ${goldLight} 100%)`
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) {
      setError('Sesión inválida o sin identificador comercial')
      return
    }

    setError(null)
    setSuccess(null)

    const payload = {
      tenant_id: tenantId,
      name: formData.name.trim(),
      description: formData.description.trim() || '',
      price: parseFloat(formData.price) || 0,
      duration: parseInt(formData.duration) || 60,
      badge: formData.badge.trim().toLowerCase(),
      category: formData.category,
      is_active: true
    }

    try {
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
      category: servicio.category || 'Uñas'
    })
    setShowModal(true)
  }

  const handleCreateNew = () => {
    setEditingId(null)
    setFormData(initialFormState)
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

  const promedioPrecio = servicios.length > 0 ? servicios.reduce((sum, s) => sum + s.price, 0) / servicios.length : 0
  const totalServicios = servicios.length
  const totalCategorias = new Set(servicios.map(s => s.category)).size

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-500 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
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
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-8 relative overflow-x-hidden ${isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'}`}>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-6xl mx-auto px-4 space-y-6 relative z-10 pt-4">

        {/* ============================================================ */}
        {/* CABECERA */}
        {/* ============================================================ */}
        <div 
          className="relative overflow-hidden rounded-2xl p-6 md:p-8 shadow-2xl text-white border border-white/10"
          style={headerGradient}
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-black/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-white/80">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                Catálogo Operativo
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight drop-shadow-sm">
                Servicios Fresh Nails
              </h1>
              <p className="text-xs md:text-sm text-white/80 font-medium max-w-md">
                Administra y edita la oferta comercial de tus tratamientos integrales.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-center shrink-0">
              <button 
                onClick={handleRefresh} 
                disabled={refreshing} 
                className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95 shadow-lg"
                title="Actualizar Catálogo"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button 
                onClick={handleCreateNew}
                className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white text-stone-900 font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#F0E4DA] hover:scale-105 active:scale-95 transition-all"
              >
                <div className="p-1 rounded-md bg-[#D4AF37] text-white">
                  <Plus className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Nuevo Servicio</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* NOTIFICACIONES FLOTANTES / AVISOS */}
        {/* ============================================================ */}
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

        {/* ============================================================ */}
        {/* KPIS METRICS */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`rounded-2xl p-4 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
                <Package className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="min-w-0">
                <p className={`text-[8px] font-mono uppercase tracking-wider font-black ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Servicios Totales</p>
                <p className="text-lg font-black">{totalServicios}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-4 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
                <DollarSign className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="min-w-0">
                <p className={`text-[8px] font-mono uppercase tracking-wider font-black ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Ticket Promedio</p>
                <p className="text-lg font-black text-[#D4AF37]">${Math.round(promedioPrecio).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-4 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
                <Layers className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="min-w-0">
                <p className={`text-[8px] font-mono uppercase tracking-wider font-black ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Categorías</p>
                <p className="text-lg font-black text-[#D4AF37]">{totalCategorias}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* FILTROS Y BÚSQUEDA */}
        {/* ============================================================ */}
        <div className={`flex items-center gap-3 p-3 rounded-2xl border shadow-sm transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
          <Search className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o descripción..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className={`bg-transparent border-none outline-none text-xs w-full font-medium ${isDark ? 'text-[#FFF9F6] placeholder:text-[#A89588]' : 'text-[#1A0E0A] placeholder:text-[#A89588]'}`}
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#F0E4DA]'}`}
            >
              <X className={`w-4 h-4 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
            </button>
          )}
        </div>

        {/* NAVEGACIÓN POR CATEGORÍAS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {categorias.map((cat) => {
            const IconComponent = cat.icon
            const esActivo = selectedCategory === cat.name

            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`relative p-3 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all duration-300 border shadow-sm ${
                  esActivo 
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_4px_15px_rgba(212,175,55,0.15)]' 
                    : isDark 
                      ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40' 
                      : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  esActivo 
                    ? 'bg-[#D4AF37] text-[#1A0E0A] scale-105' 
                    : isDark 
                      ? 'bg-[#1E120C] border border-[#3D281E] text-[#A89588]' 
                      : 'bg-[#FFF9F6] border border-[#F0E4DA] text-[#5C4A3E]'
                }`}>
                  <IconComponent className="w-3.5 h-3.5" />
                </div>

                <span className={`text-[9px] font-mono tracking-tight transition-colors ${
                  esActivo ? 'text-[#D4AF37] font-bold' : isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
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

        {/* ============================================================ */}
        {/* LISTADO DE TRATAMIENTOS (GRID) */}
        {/* ============================================================ */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>
          {filtrados.map((servicio: Servicio) => (
            <div 
              key={servicio.id} 
              className={`rounded-2xl border p-4 flex flex-col justify-between shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group ${
                isDark ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40' : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] uppercase font-mono tracking-widest flex items-center gap-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                    <Layers className="w-3 h-3 text-[#D4AF37]" /> 
                    {servicio.category || 'General'}
                  </span>
                  {servicio.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider text-[#1A0E0A] bg-[#D4AF37]">
                      {servicio.badge.toUpperCase()}
                    </span>
                  )}
                </div>

                <h3 className={`text-sm font-medium transition-colors ${isDark ? 'text-[#FFF9F6] group-hover:text-[#D4AF37]' : 'text-[#1A0E0A] group-hover:text-[#D4AF37]'}`}>
                  {servicio.name}
                </h3>

                <p className={`text-xs line-clamp-2 leading-relaxed min-h-[36px] ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                  {servicio.description || 'Sin descripción detallada asignada.'}
                </p>
              </div>

              <div>
                <div className={`mt-4 pt-3.5 border-t flex justify-between items-center text-xs font-mono ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`}>
                  <div className={`flex items-center gap-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{servicio.duration || 60} min</span>
                  </div>
                  <div className="font-mono font-extrabold text-sm text-[#D4AF37]">
                    ${servicio.price?.toLocaleString()}
                  </div>
                </div>

                <div className="flex gap-2 pt-3.5 mt-1">
                  <button 
                    onClick={() => handleEdit(servicio)} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                      isDark 
                        ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588] hover:text-[#D4AF37] hover:border-[#D4AF37]/40' 
                        : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E] hover:text-[#D4AF37] hover:border-[#D4AF37]/40'
                    }`}
                  >
                    <Edit className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(servicio.id)} 
                    className={`px-3 py-2 rounded-xl border transition-all ${
                      isDark 
                        ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588] hover:text-red-500 hover:border-red-500/30' 
                        : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E] hover:text-red-500 hover:border-red-500/30'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtrados.length === 0 && (
            <div className={`col-span-full py-12 text-center font-mono text-xs border border-dashed rounded-2xl ${
              isDark ? 'bg-[#2A1B14]/40 border-[#3D281E] text-[#A89588]' : 'bg-white border-[#F0E4DA] text-[#5C4A3E]'
            }`}>
              No se encontraron servicios que coincidan con los criterios.
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* DIÁLOGO MODAL ABRE/CIERRA */}
        {/* ============================================================ */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className={`relative w-full max-w-md rounded-2xl shadow-2xl border p-6 max-h-[90vh] overflow-y-auto transition-all duration-300 ${
              isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
            }`}>
              <button 
                onClick={() => setShowModal(false)}
                className={`absolute top-4 right-4 p-2 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#F0E4DA]'
                } text-[#A89588] hover:text-red-400`}
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
                <div>
                  <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                    Nombre del Servicio *
                  </label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                      isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#A89588]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A] placeholder:text-[#A89588]'
                    }`}
                    placeholder="Ej: Microblading Cejas"
                    required 
                  />
                </div>

                <div>
                  <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                    Descripción
                  </label>
                  <textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    rows={3} 
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 resize-none ${
                      isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#A89588]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A] placeholder:text-[#A89588]'
                    }`}
                    placeholder="Detalla el tratamiento..." 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                      Precio ($) *
                    </label>
                    <input 
                      type="number" 
                      value={formData.price} 
                      onChange={(e) => setFormData({...formData, price: e.target.value})} 
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                        isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#A89588]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A] placeholder:text-[#A89588]'
                      }`}
                      placeholder="0.00"
                      required 
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                      Duración (Min) *
                    </label>
                    <input 
                      type="number" 
                      value={formData.duration} 
                      onChange={(e) => setFormData({...formData, duration: e.target.value})} 
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                        isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#A89588]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A] placeholder:text-[#A89588]'
                      }`}
                      placeholder="60"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                      Categoría *
                    </label>
                    <div className="relative w-full">
                      <select 
                        value={formData.category} 
                        onChange={(e) => setFormData({...formData, category: e.target.value})} 
                        className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 appearance-none bg-transparent ${
                          isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A]'
                        }`}
                      >
                        <option value="Uñas" className={isDark ? 'bg-[#2A1B14]' : 'bg-white'}>💅 Uñas</option>
                        <option value="Micropigmentación" className={isDark ? 'bg-[#2A1B14]' : 'bg-white'}>👁️ Micropigmentación</option>
                        <option value="Cejas" className={isDark ? 'bg-[#2A1B14]' : 'bg-white'}>✨ Cejas</option>
                        <option value="Peluquería" className={isDark ? 'bg-[#2A1B14]' : 'bg-white'}>✂️ Peluquería</option>
                        <option value="Depilación" className={isDark ? 'bg-[#2A1B14]' : 'bg-white'}>💖 Depilación</option>
                        <option value="Estética" className={isDark ? 'bg-[#2A1B14]' : 'bg-white'}>🌟 Estética</option>
                      </select>
                      <ChevronDown className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                      Etiqueta destacada
                    </label>
                    <input 
                      type="text" 
                      value={formData.badge} 
                      onChange={(e) => setFormData({...formData, badge: e.target.value})} 
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm uppercase transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                        isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#A89588]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A] placeholder:text-[#A89588]'
                      }`}
                      placeholder="Ej: TOP, NUEVO" 
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-widest transition-colors ${
                      isDark ? 'border-[#3D281E] text-[#A89588] hover:bg-[#3D281E]' : 'border-[#F0E4DA] text-[#5C4A3E] hover:bg-[#F0E4DA]'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-4 py-2.5 rounded-xl text-[#1A0E0A] hover:scale-105 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-md bg-[#D4AF37] hover:bg-[#E8D5A0]"
                  >
                    <Save className="w-4 h-4" /> Guardar
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
