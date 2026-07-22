// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Sparkles, Plus, Search, Clock, DollarSign, 
  Layers, Edit, Trash2, CheckCircle2, 
  X, Save, Tag, Scissors, Star, Heart, Flame,
  RefreshCw, TrendingUp, Package, Eye, Hand,
  AlertCircle, Crown, Gem, PlusCircle
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

// ✅ CATEGORÍAS REALES DEL SALÓN
const categorias = [
  { name: 'Todos', icon: Star },
  { name: 'Uñas', icon: Hand },
  { name: 'Micropigmentación', icon: Eye },
  { name: 'Cejas', icon: Sparkles },
  { name: 'Peluquería', icon: Scissors },
  { name: 'Depilación', icon: Heart },
  { name: 'Estética', icon: Sparkles }
]

export default function ServiciosPage() {
  const { settings } = useSettings()
  const { tenantId } = useAuth()

  const [servicios, setServicios] = useState<Servicio[]>([])
  const [search, setSearch] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // ✅ FORMULARIO SIN CAMPO "icon"
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    badge: '',
    category: 'Uñas'
  })

  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'

  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
  }

  const primaryBgStyle = { backgroundColor: primaryColor }

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
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      if (data) setServicios(data as Servicio[])
      setSuccess('Catálogo actualizado correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error al cargar servicios de Supabase:', err)
      setError(err.message || 'Error al cargar los servicios')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchServicios()
  }, [tenantId])

  const handleRefresh = () => {
    fetchServicios(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) {
      setError('No hay tenant disponible')
      return
    }

    setError(null)
    setSuccess(null)

    const payload = {
      tenant_id: tenantId,
      name: formData.name,
      description: formData.description || '',
      price: parseFloat(formData.price) || 0,
      duration: parseInt(formData.duration) || 60,
      badge: formData.badge || '',
      category: formData.category || 'Uñas',
      is_active: true
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('services')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
        setSuccess('Servicio actualizado correctamente')
      } else {
        const { error } = await supabase
          .from('services')
          .insert([payload])
        if (error) throw error
        setSuccess('Servicio creado correctamente')
      }

      setShowModal(false)
      setEditingId(null)
      setFormData({ name: '', description: '', price: '', duration: '', badge: '', category: 'Uñas' })
      setTimeout(() => setSuccess(null), 3000)
      fetchServicios(false)
    } catch (err: any) {
      console.error('Error guardando servicio:', err)
      setError(err.message || 'Error al guardar el servicio')
      setTimeout(() => setError(null), 3000)
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

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
      setSuccess('Servicio eliminado correctamente')
      setTimeout(() => setSuccess(null), 3000)
      fetchServicios(false)
    } catch (err: any) {
      console.error('Error eliminando servicio:', err)
      setError(err.message || 'Error al eliminar el servicio')
      setTimeout(() => setError(null), 3000)
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute w-48 h-48 bg-amber-500/5 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite] delay-300" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
            <Package className="w-6 h-6 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-sm font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 animate-pulse">
              CARGANDO
            </p>
            <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              SERVICIOS FRESH
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
    <div className="space-y-6 p-1 max-w-6xl mx-auto">

      {/* ============================================================ */}
      {/* CABECERA PRINCIPAL — IDÉNTICA AL DASHBOARD */}
      {/* ============================================================ */}
      <div 
        className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl text-white border border-white/10"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, #EF4444 100%)`
        }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-black/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-pink-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Catálogo de Servicios
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight drop-shadow-sm">
              Servicios Fresh Nails
            </h1>
            <p className="text-xs md:text-sm text-pink-50/80 font-medium max-w-md">
              Administra y edita la oferta comercial de tus tratamientos integrales.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <button 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95 shadow-lg"
              title="Actualizar Servicios"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button 
              onClick={() => { setEditingId(null); setFormData({ name: '', description: '', price: '', duration: '', badge: '', category: 'Uñas' }); setShowModal(true) }}
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white text-stone-900 font-black text-xs uppercase tracking-widest shadow-xl hover:bg-pink-50 hover:scale-105 active:scale-95 transition-all"
            >
              <div className="p-1 rounded-md bg-stone-900 text-white">
                <Plus className="w-3 h-3 stroke-[3]" />
              </div>
              <span>Nuevo Servicio</span>
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
      {/* KPIS — 3 columnas responsivas */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl shrink-0" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Servicios</p>
            <h3 className="text-sm sm:text-base font-mono font-black text-stone-900 dark:text-pink-100">{totalServicios}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Ticket Promedio</p>
            <h3 className="text-sm sm:text-base font-mono font-black text-emerald-500">${Math.round(promedioPrecio).toLocaleString()}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Categorías</p>
            <h3 className="text-sm sm:text-base font-mono font-black text-amber-500">{totalCategorias}</h3>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BÚSQUEDA */}
      {/* ============================================================ */}
      <div className="flex items-center gap-3 p-3 rounded-2xl border shadow-sm bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
        <Search className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o descripción..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="bg-transparent border-none outline-none text-xs text-stone-800 dark:text-pink-100 placeholder:text-stone-400 w-full"
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            className="p-1 hover:bg-pink-100 dark:hover:bg-fuchsia-950/50 rounded-lg transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-stone-400" />
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/* CATEGORÍAS — SOLO LAS REALES */}
      {/* ============================================================ */}
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
                  ? 'border-pink-500/40 shadow-md ring-1 ring-pink-500/10 scale-[1.02]' 
                  : 'bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 hover:border-pink-300 dark:hover:border-fuchsia-800'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                esActivo 
                  ? 'text-white shadow-xs scale-105' 
                  : 'text-stone-400 dark:text-stone-500 bg-white dark:bg-[#0f0c1b] border border-pink-100/60 dark:border-fuchsia-950'
              }`} style={esActivo ? brandGradient : {}}>
                <IconComponent className="w-3.5 h-3.5" />
              </div>

              <span className={`text-[9px] font-mono tracking-tight transition-colors ${
                esActivo ? 'text-pink-500 dark:text-pink-400 font-bold' : 'text-stone-400 dark:text-stone-500'
              }`}>
                {cat.name}
              </span>

              {esActivo && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full" style={{ backgroundColor: primaryColor }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ============================================================ */}
      {/* GRID DE SERVICIOS */}
      {/* ============================================================ */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>
        {filtrados.map((servicio: Servicio) => (
          <div 
            key={servicio.id} 
            className="rounded-2xl border p-4 flex flex-col justify-between shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 hover:border-pink-300 dark:hover:border-fuchsia-800"
          >
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-mono tracking-widest text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
                  <Layers className="w-3 h-3" style={{ color: primaryColor }} /> 
                  {servicio.category || 'General'}
                </span>
                {servicio.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider text-white" style={{ backgroundColor: primaryColor }}>
                    {servicio.badge.toUpperCase()}
                  </span>
                )}
              </div>

              <h3 className={`text-sm font-bold transition-colors group-hover:text-pink-500 dark:group-hover:text-pink-400 text-stone-800 dark:text-pink-100`}>
                {servicio.name}
              </h3>

              <p className={`text-xs line-clamp-2 leading-relaxed min-h-[36px] text-stone-500 dark:text-pink-100/60`}>
                {servicio.description || 'Sin descripción detallada asignada.'}
              </p>
            </div>

            <div className={`mt-4 pt-3.5 border-t flex justify-between items-center text-xs font-mono border-pink-100/60 dark:border-fuchsia-950/50`}>
              <div className="flex items-center gap-1.5 text-stone-400 dark:text-stone-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{servicio.duration || 60} min</span>
              </div>
              <div className="font-mono font-extrabold text-sm text-stone-800 dark:text-pink-100">
                ${servicio.price?.toLocaleString()}
              </div>
            </div>

            <div className="flex gap-2 pt-3.5 mt-1">
              <button 
                onClick={() => handleEdit(servicio)} 
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-wider transition-all bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-500 dark:text-stone-400 hover:text-pink-600 dark:hover:text-pink-400 hover:border-pink-300 dark:hover:border-fuchsia-800"
              >
                <Edit className="w-3.5 h-3.5" /> Editar
              </button>
              <button 
                onClick={() => handleDelete(servicio.id)} 
                className="px-3 py-2 rounded-xl border transition-all bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-400 dark:text-stone-500 hover:text-rose-500 hover:border-rose-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div className="col-span-full py-12 text-center font-mono text-xs border border-dashed rounded-2xl bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 text-stone-400 dark:text-stone-500">
            No se encontraron servicios que coincidan con los criterios.
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL — SIN CAMPO "icon" */}
      {/* ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl shadow-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 p-6 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-pink-50 dark:hover:bg-fuchsia-950/40 rounded-xl transition-colors text-stone-400 hover:text-stone-700 dark:hover:text-pink-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl text-white shadow-md" style={primaryBgStyle}>
                <Tag className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif font-extrabold text-stone-800 dark:text-pink-100">
                {editingId ? 'Modificar Tratamiento' : 'Registrar Tratamiento'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                  Nombre del Servicio *
                </label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm placeholder:text-stone-400"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  placeholder="Ej: Microblading Cejas"
                  required 
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                  Descripción
                </label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  rows={3} 
                  className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm resize-none placeholder:text-stone-400"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  placeholder="Detalla el tratamiento..." 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                    Precio ($) *
                  </label>
                  <input 
                    type="number" 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm font-mono placeholder:text-stone-400"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    placeholder="0.00"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                    Duración (Min) *
                  </label>
                  <input 
                    type="number" 
                    value={formData.duration} 
                    onChange={(e) => setFormData({...formData, duration: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm font-mono placeholder:text-stone-400"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    placeholder="60"
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                    Categoría *
                  </label>
                  {/* ✅ SELECT CON CATEGORÍAS REALES */}
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm appearance-none"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  >
                    <option value="Uñas">💅 Uñas</option>
                    <option value="Micropigmentación">👁️ Micropigmentación</option>
                    <option value="Cejas">✨ Cejas</option>
                    <option value="Peluquería">✂️ Peluquería</option>
                    <option value="Depilación">💖 Depilación</option>
                    <option value="Estética">🌟 Estética</option>
                  </select>
                  <p className="text-[8px] text-stone-400 mt-1">
                    La categoría determina dónde aparece el servicio
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                    Badge
                  </label>
                  <input 
                    type="text" 
                    value={formData.badge} 
                    onChange={(e) => setFormData({...formData, badge: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm uppercase placeholder:text-stone-400"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    placeholder="Ej: TOP, NUEVO" 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 px-4 py-2.5 rounded-xl border hover:bg-pink-50 dark:hover:bg-fuchsia-950/30 transition-all text-xs font-bold uppercase tracking-widest border-pink-100/60 dark:border-fuchsia-950 text-stone-600 dark:text-stone-400"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2.5 rounded-xl text-white hover:scale-105 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-md"
                  style={primaryBgStyle}
                >
                  <Save className="w-4 h-4" /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STYLES GLOBALES */}
      {/* ============================================================ */}
      <style jsx global>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>

    </div>
  )
}