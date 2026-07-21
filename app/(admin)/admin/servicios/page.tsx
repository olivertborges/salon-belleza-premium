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
  RefreshCw, TrendingUp, Package, Eye, Hand
} from 'lucide-react'

type Servicio = {
  id: string
  name: string
  description: string
  price: number
  duration: number
  badge: string
  icon: string
  category: string
  is_active: boolean
  created_at: string
}

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

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    badge: '',
    icon: 'Sparkles',
    category: 'Manicuría'
  })

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

  // ✅ CATEGORÍAS CON PÁGINAS
  const categoriasConfig = [
    { name: 'Todos', icon: Star },
    { name: 'Peluquería', icon: Scissors, page: '/peluqueria' },
    { name: 'Micropigmentación', icon: Eye, page: '/micropigmentacion' },
    { name: 'Uñas', icon: Hand, page: '/unhas' },
    { name: 'Estética', icon: Heart, page: '/estetica' },
    { name: 'Manicuría', icon: Sparkles, page: '/servicios' },
    { name: 'Sistemas', icon: Layers, page: '/servicios' },
    { name: 'Esmaltado', icon: Flame, page: '/servicios' },
    { name: 'Pedicuría', icon: Heart, page: '/servicios' },
    { name: 'Nail Art', icon: Scissors, page: '/servicios' },
  ]

  const getCategoryPage = (category: string) => {
    const found = categoriasConfig.find(c => c.name === category)
    return found?.page || '/servicios'
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
      icon: formData.icon || 'Sparkles',
      category: formData.category || 'Manicuría',
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
      setFormData({ name: '', description: '', price: '', duration: '', badge: '', icon: 'Sparkles', category: 'Manicuría' })
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
      icon: servicio.icon || 'Sparkles',
      category: servicio.category || 'Manicuría'
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
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === 'Todos' || s.category === selectedCategory
    return matchSearch && matchCategory
  })

  const promedioPrecio = servicios.length > 0 ? servicios.reduce((sum, s) => sum + s.price, 0) / servicios.length : 0
  const totalServicios = servicios.length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: settings?.primary_color || '#DB5B9A' }}></div>
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse" style={{ color: settings?.primary_color || '#DB5B9A' }}>
          Sincronizando Menú...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1 max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl p-[1px] shadow-xl" style={brandGradient}>
        <div className="absolute inset-0 opacity-20 animate-pulse" style={brandGradient} />
        <div className="relative z-10 rounded-[23px] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0f0c1b]">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3.5 rounded-2xl text-white shadow-md shrink-0" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}>
              <Package className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold font-mono truncate" style={{ color: settings?.primary_color || '#DB5B9A' }}>
                💎 {settings?.business_name || 'Salón VIP'}
              </p>
              <h2 className="text-xl md:text-2xl font-serif font-extrabold text-stone-900 dark:text-white mt-0.5 truncate">
                Catálogo de Servicios
              </h2>
              <p className="text-xs text-stone-500 dark:text-pink-100/60 mt-0.5 truncate">
                Administra y edita la oferta comercial de tus tratamientos integrales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto justify-end">
            <button 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className="px-3 py-2 rounded-xl bg-pink-50 dark:bg-fuchsia-950/40 border border-pink-100/60 dark:border-fuchsia-900/40 hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
              style={{ color: settings?.primary_color || '#DB5B9A' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Cargando...' : 'Actualizar'}</span>
              <span className="sm:hidden">{refreshing ? '...' : 'Act.'}</span>
            </button>
            <button 
              onClick={() => { setEditingId(null); setFormData({ name: '', description: '', price: '', duration: '', badge: '', icon: 'Sparkles', category: 'Manicuría' }); setShowModal(true) }}
              className="px-3 py-2 rounded-xl text-white hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
              style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuevo Servicio</span>
              <span className="sm:hidden">+</span>
            </button>
          </div>
        </div>
      </div>

      {/* MENSAJES */}
      {error && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-rose-500/10 to-pink-500/5 border border-rose-500/20 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <X className="w-4 h-4" />
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

      {/* KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${settings?.primary_color || '#DB5B9A'}10`, color: settings?.primary_color || '#DB5B9A' }}>
            <Package className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Servicios</p>
            <h3 className="text-sm font-mono font-black text-stone-900 dark:text-pink-100">{totalServicios}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Ticket Promedio</p>
            <h3 className="text-sm font-mono font-black text-emerald-500">${Math.round(promedioPrecio).toLocaleString()}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Categorías</p>
            <h3 className="text-sm font-mono font-black text-amber-500">{categoriasConfig.length - 1}</h3>
          </div>
        </div>
      </div>

      {/* BÚSQUEDA */}
      <div className="flex items-center gap-3 p-3 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 transition-all duration-300">
        <Search className="w-4 h-4 shrink-0" style={{ color: settings?.primary_color || '#DB5B9A' }} />
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

      {/* CATEGORÍAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-2">
        {categoriasConfig.map((cat) => {
          const IconComponent = cat.icon
          const esActivo = selectedCategory === cat.name

          return (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`relative p-3 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all duration-300 border bg-white dark:bg-[#130f24] ${
                esActivo 
                  ? 'border-pink-500/40 shadow-sm ring-1 ring-pink-500/10' 
                  : 'border-pink-100/60 dark:border-fuchsia-950 hover:border-pink-300 dark:hover:border-fuchsia-800'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                esActivo 
                  ? 'text-white shadow-xs scale-105' 
                  : 'text-stone-400 dark:text-stone-500 bg-white dark:bg-[#0f0c1b] border border-pink-100/60 dark:border-fuchsia-950'
              }`} style={esActivo ? brandGradient : {}}>
                <IconComponent className="w-3.5 h-3.5" />
              </div>

              <span className={`text-[10px] font-mono tracking-tight transition-colors ${
                esActivo ? 'text-pink-500 dark:text-pink-400 font-bold' : 'text-stone-400 dark:text-stone-500'
              }`}>
                {cat.name}
              </span>

              {cat.page && cat.page !== '/servicios' && (
                <span className="text-[7px] text-emerald-500 font-mono uppercase tracking-wider">
                  {cat.page.replace('/', '')}
                </span>
              )}

              {esActivo && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* GRID DE SERVICIOS */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>
        {filtrados.map((servicio: Servicio) => {
          const page = getCategoryPage(servicio.category)
          
          return (
            <div 
              key={servicio.id} 
              className="rounded-2xl border p-4 flex flex-col justify-between shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-500/5 group bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 hover:border-pink-300 dark:hover:border-fuchsia-800"
            >
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
                    <Layers className="w-3 h-3" style={{ color: settings?.primary_color || '#DB5B9A' }} /> 
                    {servicio.category || 'General'}
                  </span>
                  {servicio.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider text-white" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}>
                      {servicio.badge.toUpperCase()}
                    </span>
                  )}
                </div>

                <h3 className={`text-sm font-bold transition-colors group-hover:text-pink-500 dark:group-hover:text-pink-400 text-stone-800 dark:text-pink-100`}>
                  {servicio.name}
                </h3>

                <p className={`text-xs line-clamp-2 leading-relaxed min-h-[36px] text-stone-500 dark:text-pink-100/60`}>
                  {servicio.description || 'Sin descripción detallada asignada todavía.'}
                </p>

                <div className="flex items-center gap-1">
                  <span className="text-[8px] text-emerald-500 dark:text-emerald-400 font-mono uppercase tracking-wider">
                    📍 Aparece en: <span className="font-bold">{page}</span>
                  </span>
                </div>
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
                  <Edit className="w-3.5 h-3.5 stroke-[1.5]" /> Editar
                </button>
                <button 
                  onClick={() => handleDelete(servicio.id)} 
                  className="px-3 py-2 rounded-xl border transition-all bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-400 dark:text-stone-500 hover:text-rose-500 hover:border-rose-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                </button>
              </div>
            </div>
          )
        })}

        {filtrados.length === 0 && (
          <div className="col-span-full py-12 text-center font-mono text-xs border border-dashed rounded-2xl bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 text-stone-400 dark:text-stone-500">
            No se encontraron servicios que coincidan con los criterios.
          </div>
        )}
      </div>

      {/* MODAL - CON TODAS LAS CATEGORÍAS */}
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
              <div className="p-2.5 rounded-xl text-white shadow-md" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}>
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
                  style={{ 
                    '--tw-ring-color': settings?.primary_color || '#DB5B9A'
                  } as React.CSSProperties}
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
                  style={{ 
                    '--tw-ring-color': settings?.primary_color || '#DB5B9A'
                  } as React.CSSProperties}
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
                    style={{ 
                      '--tw-ring-color': settings?.primary_color || '#DB5B9A'
                    } as React.CSSProperties}
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
                    style={{ 
                      '--tw-ring-color': settings?.primary_color || '#DB5B9A'
                    } as React.CSSProperties}
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
                  {/* ✅ SELECT CON TODAS LAS CATEGORÍAS */}
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm appearance-none"
                    style={{ 
                      '--tw-ring-color': settings?.primary_color || '#DB5B9A'
                    } as React.CSSProperties}
                  >
                    <option value="Peluquería">✂️ Peluquería</option>
                    <option value="Micropigmentación">👁️ Micropigmentación</option>
                    <option value="Uñas">💅 Uñas</option>
                    <option value="Estética">💖 Estética</option>
                    <option value="Manicuría">💅 Manicuría</option>
                    <option value="Sistemas">📋 Sistemas</option>
                    <option value="Esmaltado">🔥 Esmaltado</option>
                    <option value="Pedicuría">❤️ Pedicuría</option>
                    <option value="Nail Art">✂️ Nail Art</option>
                    <option value="General">📋 General</option>
                  </select>
                  <p className="text-[8px] text-stone-400 mt-1">
                    La categoría determina en qué página aparece el servicio
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
                    style={{ 
                      '--tw-ring-color': settings?.primary_color || '#DB5B9A'
                    } as React.CSSProperties}
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
                  style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
                >
                  <Save className="w-4 h-4" /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}