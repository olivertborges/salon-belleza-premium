'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Sparkles, Plus, Search, Clock, DollarSign, 
  Layers, Edit, Trash2, CheckCircle2, 
  X, Save, Tag, Scissors, Star, Heart, Flame
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
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [servicios, setServicios] = useState<Servicio[]>([])
  const [search, setSearch] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const [loading, setLoading] = useState<boolean>(true)
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

  const categoriasConfig = [
    { name: 'Todos', icon: Star, color: 'from-amber-400 to-rose-500' },
    { name: 'Manicuría', icon: Sparkles, color: 'from-pink-400 to-pink-600' },
    { name: 'Sistemas', icon: Layers, color: 'from-rose-400 to-pink-500' },
    { name: 'Esmaltado', icon: Flame, color: 'from-amber-400 to-rose-500' },
    { name: 'Pedicuría', icon: Heart, color: 'from-pink-500 to-rose-500' },
    { name: 'Nail Art', icon: Scissors, color: 'from-rose-400 to-amber-400' },
    { name: 'Micropigmentación', icon: Tag, color: 'from-pink-500 to-amber-500' },
    { name: 'Microblading', icon: CheckCircle2, color: 'from-rose-500 to-pink-600' },
    { name: 'Pestañas', icon: Sparkles, color: 'from-amber-400 to-pink-500' },
    { name: 'Cejas', icon: Scissors, color: 'from-rose-600 to-pink-500' },
  ]

  const fetchServicios = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })

      if (error) throw error
      if (data) setServicios(data as Servicio[])
    } catch (err) {
      console.error('Error al cargar servicios de Supabase:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServicios()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
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
      } else {
        const { error } = await supabase
          .from('services')
          .insert([payload])
        if (error) throw error
      }

      setShowModal(false)
      setEditingId(null)
      setFormData({ name: '', description: '', price: '', duration: '', badge: '', icon: 'Sparkles', category: 'Manicuría' })
      fetchServicios()
    } catch (err) {
      console.error('Error guardando servicio:', err)
      alert('Error al guardar el servicio')
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
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
      fetchServicios()
    } catch (err) {
      console.error('Error eliminando servicio:', err)
      alert('Error al eliminar el servicio')
    }
  }

  const filtrados = servicios.filter((s: Servicio) => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === 'Todos' || s.category === selectedCategory
    return matchSearch && matchCategory
  })

  const promedioPrecio = servicios.length > 0 ? servicios.reduce((sum, s) => sum + s.price, 0) / servicios.length : 0

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center space-y-4 flex-col">
        <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <span className="text-pink-600/80 font-mono text-xs uppercase tracking-widest animate-pulse">Sincronizando Menú...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-8 max-w-[1400px] mx-auto px-1 transition-colors duration-300 ${
      isDark ? 'text-pink-100' : 'text-stone-800'
    }`}>

      {/* PANEL DE CONTROL ENCABEZADO CON CARD-GLOW */}
      <div className="relative overflow-hidden rounded-3xl p-[1px] shadow-xl shadow-pink-500/5 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400">
        <div className={`relative z-10 rounded-[23px] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          isDark ? 'bg-zinc-900' : 'bg-white'
        }`}>
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-pink-500/10 rounded-full blur-[80px] animate-pulse" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px] animate-pulse delay-1000" />

          <div className="space-y-1 relative z-10">
            <span className="text-[10px] uppercase tracking-[0.3em] text-pink-500 dark:text-pink-400 font-mono font-bold block flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
              💎 Fresh Nails Studio
            </span>
            <h2 className="text-2xl md:text-3xl font-serif font-extrabold bg-gradient-to-r from-stone-900 via-pink-900 to-rose-800 bg-clip-text text-transparent dark:from-white dark:to-pink-200 mt-0.5">
              Catálogo de Servicios
            </h2>
            <p className={`text-xs max-w-xl ${isDark ? 'text-pink-100/60' : 'text-stone-500'}`}>
              Administra y edita la oferta comercial, badges destacados y tiempos operativos de tus tratamientos integrales.
            </p>
          </div>

          <button 
            onClick={() => { setEditingId(null); setFormData({ name: '', description: '', price: '', duration: '', badge: '', icon: 'Sparkles', category: 'Manicuría' }); setShowModal(true) }}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 hover:opacity-95 text-white text-xs font-mono font-bold tracking-widest uppercase transition-all shadow-md shadow-pink-500/20 self-start md:self-auto active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            Nuevo Tratamiento
          </button>
        </div>
      </div>

      {/* MÉTRICAS BOUTIQUE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`rounded-2xl border p-5 flex items-center justify-between shadow-xs hover:border-pink-500/40 transition-all ${
          isDark ? 'bg-zinc-900 border-zinc-800/80' : 'bg-white border-pink-100/60'
        }`}>
          <div className="space-y-1">
            <p className="text-stone-400 dark:text-stone-500 text-[10px] font-mono uppercase tracking-wider">Menú Activo</p>
            <span className="text-3xl font-mono font-extrabold text-stone-800 dark:text-pink-100">
              {servicios.length} <span className="text-xs font-sans text-stone-400 dark:text-stone-500 font-normal">items</span>
            </span>
          </div>
          <div className="p-3 rounded-xl bg-pink-500/10 text-pink-500 border border-pink-500/20"><Sparkles className="w-4 h-4" /></div>
        </div>

        <div className={`rounded-2xl border p-5 flex items-center justify-between shadow-xs hover:border-pink-500/40 transition-all ${
          isDark ? 'bg-zinc-900 border-zinc-800/80' : 'bg-white border-pink-100/60'
        }`}>
          <div className="space-y-1">
            <p className="text-stone-400 dark:text-stone-500 text-[10px] font-mono uppercase tracking-wider">Ticket Promedio</p>
            <span className="text-3xl font-mono font-extrabold text-stone-800 dark:text-pink-100">${Math.round(promedioPrecio).toLocaleString()}</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20"><DollarSign className="w-4 h-4" /></div>
        </div>

        <div className={`rounded-2xl border p-5 flex items-center justify-between shadow-xs hover:border-pink-500/40 transition-all ${
          isDark ? 'bg-zinc-900 border-zinc-800/80' : 'bg-white border-pink-100/60'
        }`}>
          <div className="space-y-1">
            <p className="text-stone-400 dark:text-stone-500 text-[10px] font-mono uppercase tracking-wider">Sincronización Cloud</p>
            <span className="text-xs font-mono text-emerald-500 block pt-2 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Sincronizado
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><CheckCircle2 className="w-4 h-4" /></div>
        </div>
      </div>

      {/* FILTRADO Y BUSCADOR */}
      <div className="space-y-5">
        <div className="relative flex items-center max-w-xl group">
          <Search className={`absolute left-4 w-4.5 h-4.5 transition-colors group-focus-within:text-pink-500 pointer-events-none ${
            isDark ? 'text-stone-500' : 'text-stone-400'
          }`} />
          <input 
            type="text" 
            placeholder="Escribe el nombre de un tratamiento para buscar..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className={`w-full border rounded-2xl pl-12 pr-4 py-3 text-sm placeholder-stone-400 focus:outline-none focus:border-pink-500/40 focus:ring-1 focus:ring-pink-500/20 transition-all font-sans shadow-sm ${
              isDark 
                ? 'bg-zinc-900 border-zinc-800 text-pink-100' 
                : 'bg-white border-pink-100/60 text-stone-800'
            }`} 
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-10 gap-2.5">
          {categoriasConfig.map((cat) => {
            const IconComponent = cat.icon
            const esActivo = selectedCategory === cat.name

            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`relative overflow-hidden p-3 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all duration-300 border ${
                  esActivo 
                    ? `bg-white dark:bg-zinc-900 border-pink-500/40 shadow-sm ring-1 ring-pink-500/10` 
                    : `border-pink-100/40 dark:border-zinc-800/50 hover:border-pink-300 ${
                      isDark ? 'bg-zinc-900/40' : 'bg-pink-50/20'
                    }`
                }`}
              >
                {esActivo && (
                  <div className={`absolute -inset-1 opacity-[0.06] bg-gradient-to-br ${cat.color} blur-md`} />
                )}

                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  esActivo 
                    ? `bg-gradient-to-br ${cat.color} text-white shadow-xs scale-105` 
                    : `border text-stone-400 dark:text-stone-500 ${
                      isDark ? 'bg-zinc-950/40 border-zinc-800' : 'bg-pink-50/40 border-pink-100/40'
                    }`
                }`}>
                  <IconComponent className="w-3.5 h-3.5" />
                </div>

                <span className={`text-[10px] font-mono tracking-tight transition-colors ${
                  esActivo ? 'text-pink-500 dark:text-pink-400 font-bold' : 'text-stone-400 dark:text-stone-500'
                }`}>
                  {cat.name}
                </span>

                {esActivo && (
                  <div className={`absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full bg-gradient-to-r ${cat.color}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* GRID DE TRATAMIENTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtrados.map((servicio: Servicio) => (
          <div 
            key={servicio.id} 
            className={`rounded-2xl border p-6 flex flex-col justify-between hover:border-pink-500/40 hover:shadow-sm transition-all group duration-300 ${
              isDark ? 'bg-zinc-900 border-zinc-800/80' : 'bg-white border-pink-100/40'
            }`}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-mono tracking-widest text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-pink-500" /> {servicio.category || 'General'}
                </span>
                {servicio.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500/10 to-amber-500/10 text-pink-600 dark:text-pink-300 border border-pink-500/20 text-[9px] font-mono font-bold tracking-wider">
                    {servicio.badge.toUpperCase()}
                  </span>
                )}
              </div>
              <h3 className={`text-sm font-bold transition-colors group-hover:text-pink-500 dark:group-hover:text-pink-400 ${
                isDark ? 'text-pink-100' : 'text-stone-800'
              }`}>
                {servicio.name}
              </h3>
              <p className={`text-xs line-clamp-2 leading-relaxed min-h-[36px] font-sans ${
                isDark ? 'text-pink-100/60' : 'text-stone-500'
              }`}>
                {servicio.description || 'Sin descripción detallada asignada todavía.'}
              </p>
            </div>

            <div className={`mt-5 pt-4 border-t flex justify-between items-center text-xs font-mono ${
              isDark ? 'border-zinc-800/40' : 'border-pink-50'
            }`}>
              <div className="flex items-center gap-1.5 text-stone-400 dark:text-stone-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{servicio.duration || 60} min</span>
              </div>
              <div className="font-mono font-extrabold text-sm text-stone-800 dark:text-pink-100">
                ${servicio.price?.toLocaleString()}
              </div>
            </div>

            <div className="flex gap-2 pt-4 mt-2">
              <button 
                onClick={() => handleEdit(servicio)} 
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                  isDark 
                    ? 'bg-zinc-950/40 border-zinc-800 text-stone-400 hover:text-pink-400 hover:bg-zinc-900' 
                    : 'bg-pink-50/30 border-pink-100/40 text-stone-500 hover:text-pink-600 hover:bg-pink-50/70'
                }`}
              >
                <Edit className="w-3.5 h-3.5 stroke-[1.5]" /> Editar
              </button>
              <button 
                onClick={() => handleDelete(servicio.id)} 
                className={`px-3 py-2.5 rounded-xl border transition-all ${
                  isDark 
                    ? 'bg-zinc-950/40 border-zinc-800 text-stone-400 hover:text-rose-500 hover:border-rose-500/20' 
                    : 'bg-pink-50/30 border-pink-100/40 text-stone-500 hover:text-rose-500 hover:border-rose-500/20'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
              </button>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div className={`col-span-full py-20 text-center font-mono text-xs border border-dashed rounded-2xl ${
            isDark ? 'text-stone-500 border-zinc-800 bg-zinc-900/20' : 'text-stone-400 border-pink-100 bg-pink-50/10'
          }`}>
            No se encontraron tratamientos registrados en este módulo.
          </div>
        )}
      </div>

      {/* MODAL CORREGIDO - DISEÑO EXCLUSIVO FRESH NAILS */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-up">
          <div className={`border rounded-[24px] p-6 max-w-md w-full shadow-2xl max-h-[92vh] overflow-y-auto scrollbar-none ${
            isDark 
              ? 'bg-zinc-900 border-zinc-800 text-pink-100' 
              : 'bg-white border-pink-100 text-stone-800'
          }`}>

            <div className={`flex items-center justify-between mb-6 pb-2 border-b ${
              isDark ? 'border-zinc-800/60' : 'border-pink-50'
            }`}>
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                <Tag className="w-4 h-4 text-pink-500" /> 
                {editingId ? 'Modificar Tratamiento' : 'Registrar Tratamiento'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-xl text-stone-400 hover:text-pink-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
                  Nombre del Servicio *
                </label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-pink-500/50 transition-colors placeholder-stone-400 dark:placeholder-stone-600 ${
                    isDark 
                      ? 'bg-zinc-950/40 border-zinc-800 text-pink-100' 
                      : 'bg-transparent border-pink-100 text-stone-800'
                  }`} 
                  placeholder="Ej: Esmaltado Semipermanente Glam"
                  required 
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
                  Descripción Operativa
                </label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  rows={3} 
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-pink-500/50 transition-colors placeholder-stone-400 dark:placeholder-stone-600 leading-relaxed resize-none font-sans ${
                    isDark 
                      ? 'bg-zinc-950/40 border-zinc-800 text-pink-100' 
                      : 'bg-transparent border-pink-100 text-stone-800'
                  }`} 
                  placeholder="Detalla los materiales utilizados o especificaciones particulares del servicio..." 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
                    Precio ($) *
                  </label>
                  <input 
                    type="number" 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})} 
                    className={`w-full border font-mono rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-pink-500/50 transition-colors ${
                      isDark 
                        ? 'bg-zinc-950/40 border-zinc-800 text-pink-100' 
                        : 'bg-transparent border-pink-100 text-stone-800'
                    }`} 
                    placeholder="0.00"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
                    Duración (Min) *
                  </label>
                  <input 
                    type="number" 
                    value={formData.duration} 
                    onChange={(e) => setFormData({...formData, duration: e.target.value})} 
                    className={`w-full border font-mono rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-pink-500/50 transition-colors ${
                      isDark 
                        ? 'bg-zinc-950/40 border-zinc-800 text-pink-100' 
                        : 'bg-transparent border-pink-100 text-stone-800'
                    }`} 
                    placeholder="60"
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
                    Categoría de Menú
                  </label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})} 
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-pink-500/50 transition-colors ${
                      isDark 
                        ? 'bg-zinc-950/40 border-zinc-800 text-pink-100' 
                        : 'bg-transparent border-pink-100 text-stone-800'
                    }`}
                  >
                    {categoriasConfig.filter(c => c.name !== 'Todos').map(cat => (
                      <option key={cat.name} value={cat.name} className={isDark ? 'bg-zinc-900 text-pink-100' : 'bg-white text-stone-800'}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
                    Badge Promocional
                  </label>
                  <input 
                    type="text" 
                    value={formData.badge} 
                    onChange={(e) => setFormData({...formData, badge: e.target.value})} 
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-pink-500/50 transition-colors uppercase placeholder-stone-400 dark:placeholder-stone-600 ${
                      isDark 
                        ? 'bg-zinc-950/40 border-zinc-800 text-pink-100' 
                        : 'bg-transparent border-pink-100 text-stone-800'
                    }`} 
                    placeholder="Ej: TOP, NUEVO" 
                  />
                </div>
              </div>

              <div className={`flex gap-3 pt-6 mt-4 border-t ${
                isDark ? 'border-zinc-800/60' : 'border-pink-50'
              }`}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className={`flex-1 px-4 py-3 border rounded-xl text-[10px] font-mono font-bold tracking-widest uppercase transition-colors ${
                    isDark 
                      ? 'border-zinc-800 text-stone-400 hover:bg-zinc-900' 
                      : 'border-pink-100 text-stone-500 hover:bg-pink-50/40'
                  }`}
                >
                  Cerrar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 text-white rounded-xl text-[10px] font-mono font-bold tracking-widest uppercase hover:opacity-95 shadow-md shadow-pink-500/10 flex items-center justify-center gap-2 active:scale-[0.99]"
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
