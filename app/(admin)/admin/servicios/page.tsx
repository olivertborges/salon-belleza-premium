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
    { name: 'Todos', icon: Star, color: 'from-amber-400 to-orange-500' },
    { name: 'Manicuría', icon: Sparkles, color: 'from-rose-400 to-pink-500' },
    { name: 'Sistemas', icon: Layers, color: 'from-purple-400 to-indigo-500' },
    { name: 'Esmaltado', icon: Flame, color: 'from-orange-400 to-red-500' },
    { name: 'Pedicuría', icon: Heart, color: 'from-teal-400 to-emerald-500' },
    { name: 'Nail Art', icon: Scissors, color: 'from-blue-400 to-cyan-500' },
    { name: 'Micropigmentación', icon: Tag, color: 'from-fuchsia-400 to-pink-600' },
    { name: 'Microblading', icon: CheckCircle2, color: 'from-yellow-400 to-amber-600' },
    { name: 'Pestañas', icon: Sparkles, color: 'from-violet-400 to-purple-600' },
    { name: 'Cejas', icon: Scissors, color: 'from-neutral-400 to-stone-600' },
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
      <div className="flex h-96 items-center justify-center">
        <div className="relative">
          <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-8 h-8 border-3 border-rose-500/20 rounded-full animate-ping"></div>
        </div>
        <span className="ml-4 text-xs font-mono text-rose-500 animate-pulse">Sincronizando Menú...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-8 max-w-[1400px] mx-auto px-1 transition-colors duration-300 ${
      isDark ? 'text-stone-200' : 'text-stone-800'
    }`}>
      
      {/* PANEL DE CONTROL ENCABEZADO CON CARD-GLOW */}
      <div className={`card-glow relative overflow-hidden rounded-3xl bg-muted/40 border border-border p-8 shadow-2xl backdrop-blur-xl animate-fade-up ${
        isDark 
          ? 'bg-stone-900/40 border-stone-800/80' 
          : 'bg-stone-100/60 border-stone-200'
      }`}>
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-500/10 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px] animate-pulse delay-1000" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.3em] text-rose-500 dark:text-rose-400 font-mono font-semibold block flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Panel de Control
            </span>
            <h2 className="text-2xl md:text-3xl font-serif italic">
              Catálogo de <span className="text-shimmer">Servicios</span>
            </h2>
            <p className={`text-xs max-w-xl ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Administra y edita la oferta comercial, badges destacados y tiempos operativos de tus tratamientos integrales.</p>
          </div>
          <button 
            onClick={() => { setEditingId(null); setFormData({ name: '', description: '', price: '', duration: '', badge: '', icon: 'Sparkles', category: 'Manicuría' }); setShowModal(true) }}
            className="glow-hover flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:opacity-95 text-white text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-lg shadow-rose-600/20 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nuevo Tratamiento
          </button>
        </div>
      </div>

      {/* MÉTRICAS BOUTIQUE CON CARD-GLOW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <div className={`card-glow rounded-2xl bg-card border border-border p-5 flex items-center justify-between backdrop-blur-sm shadow-sm hover:border-rose-500/30 transition-all hover:scale-105 ${
          isDark ? 'bg-[#141211]' : 'bg-white'
        }`}>
          <div className="space-y-1">
            <p className="text-muted-foreground text-[11px] font-mono uppercase tracking-wider">Menú Activo</p>
            <span className="text-3xl font-mono font-bold">{servicios.length} <span className="text-xs font-sans text-muted-foreground font-normal">items</span></span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"><Sparkles className="w-4 h-4" /></div>
        </div>

        <div className={`card-glow rounded-2xl bg-card border border-border p-5 flex items-center justify-between backdrop-blur-sm shadow-sm hover:border-rose-500/30 transition-all hover:scale-105 ${
          isDark ? 'bg-[#141211]' : 'bg-white'
        }`}>
          <div className="space-y-1">
            <p className="text-muted-foreground text-[11px] font-mono uppercase tracking-wider">Ticket Promedio</p>
            <span className="text-3xl font-mono font-bold">${Math.round(promedioPrecio).toLocaleString()}</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"><DollarSign className="w-4 h-4" /></div>
        </div>

        <div className={`card-glow rounded-2xl bg-card border border-border p-5 flex items-center justify-between backdrop-blur-sm shadow-sm hover:border-rose-500/30 transition-all hover:scale-105 ${
          isDark ? 'bg-[#141211]' : 'bg-white'
        }`}>
          <div className="space-y-1">
            <p className="text-muted-foreground text-[11px] font-mono uppercase tracking-wider">Sincronización Cloud</p>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 block pt-2 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Sincronizado
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-4 h-4" /></div>
        </div>
      </div>

      {/* FILTRADO Y BUSCADOR */}
      <div className="space-y-5">
        <div className="relative flex items-center max-w-xl group">
          <Search className={`absolute left-4 w-4.5 h-4.5 transition-colors group-focus-within:text-rose-500 pointer-events-none ${
            isDark ? 'text-stone-500' : 'text-stone-400'
          }`} />
          <input 
            type="text" 
            placeholder="Escribe el nombre de un tratamiento para buscar..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className={`w-full bg-card border rounded-2xl pl-12 pr-4 py-3 text-sm placeholder-muted-foreground focus:outline-none focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/20 transition-all font-sans shadow-sm ${
              isDark 
                ? 'bg-stone-900/40 border-stone-800 text-stone-200' 
                : 'bg-white border-stone-200 text-stone-800'
            }`} 
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categoriasConfig.map((cat) => {
            const IconComponent = cat.icon
            const esActivo = selectedCategory === cat.name
            
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`relative overflow-hidden p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-300 transform hover:scale-[1.03] active:scale-95 border ${
                  esActivo 
                    ? `bg-card border-rose-500/40 shadow-md ring-1 ring-rose-500/10 card-glow` 
                    : `bg-card/60 border-border hover:border-muted-foreground/30 hover:bg-card ${
                      isDark ? 'bg-stone-900/30' : 'bg-stone-100/50'
                    }`
                }`}
              >
                {esActivo && (
                  <div className={`absolute -inset-1 opacity-10 bg-gradient-to-br ${cat.color} blur-md`} />
                )}

                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  esActivo 
                    ? `bg-gradient-to-br ${cat.color} text-white shadow-sm scale-110` 
                    : `bg-muted border border-border text-muted-foreground ${
                      isDark ? 'bg-stone-800 border-stone-700' : 'bg-stone-200 border-stone-200'
                    }`
                }`}>
                  <IconComponent className="w-4 h-4" />
                </div>

                <span className={`text-[11px] font-mono tracking-tight transition-colors ${
                  esActivo ? 'text-foreground font-bold' : 'text-muted-foreground'
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        {filtrados.map((servicio: Servicio, index) => (
          <div 
            key={servicio.id} 
            className={`card-glow rounded-2xl bg-card border border-border p-6 flex flex-col justify-between hover:border-rose-500/30 hover:shadow-md transition-all group duration-300 animate-fade-up delay-${(index % 6) * 100} ${
              isDark ? 'bg-[#141211]' : 'bg-white'
            }`}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Layers className={`w-3 h-3 ${isDark ? 'text-rose-400' : 'text-rose-500'}`} /> {servicio.category || 'General'}
                </span>
                {servicio.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500/10 to-amber-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/20 text-[9px] font-mono font-bold tracking-wider">
                    {servicio.badge.toUpperCase()}
                  </span>
                )}
              </div>
              <h3 className={`text-base font-medium transition-colors group-hover:text-rose-600 dark:group-hover:text-rose-400 ${
                isDark ? 'text-stone-200' : 'text-stone-800'
              }`}>
                {servicio.name}
              </h3>
              <p className={`text-xs line-clamp-2 leading-relaxed font-light min-h-[36px] ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`}>
                {servicio.description || 'Sin descripción detallada asignada todavía.'}
              </p>
            </div>

            <div className={`mt-5 pt-4 border-t flex justify-between items-center text-xs font-mono ${
              isDark ? 'border-stone-800' : 'border-stone-200'
            }`}>
              <div className={`flex items-center gap-1.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{servicio.duration || 60} min</span>
              </div>
              <div className="font-bold text-base text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/80">
                ${servicio.price?.toLocaleString()}
              </div>
            </div>

            <div className="flex gap-2 pt-4 mt-2">
              <button 
                onClick={() => handleEdit(servicio)} 
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs transition-all font-mono ${
                  isDark 
                    ? 'bg-stone-800/40 border-stone-700 text-stone-400 hover:text-stone-200 hover:bg-stone-700/40' 
                    : 'bg-stone-100/60 border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60'
                }`}
              >
                <Edit className="w-3.5 h-3.5" /> Editar
              </button>
              <button 
                onClick={() => handleDelete(servicio.id)} 
                className={`px-3 py-2.5 rounded-xl border transition-all ${
                  isDark 
                    ? 'bg-stone-800/40 border-stone-700 text-stone-400 hover:text-rose-400 hover:border-rose-500/30' 
                    : 'bg-stone-100/60 border-stone-200 text-stone-500 hover:text-rose-500 hover:border-rose-500/20'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        
        {filtrados.length === 0 && (
          <div className={`col-span-full py-20 text-center font-mono text-xs border border-dashed rounded-2xl ${
            isDark ? 'text-stone-500 border-stone-800 bg-stone-950/10' : 'text-stone-400 border-stone-200 bg-stone-50/50'
          }`}>
            No se encontraron tratamientos registrados en este módulo.
          </div>
        )}
      </div>

      {/* MODAL CORREGIDO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-up">
          <div className={`border rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[92vh] overflow-y-auto scrollbar-none animate-in fade-in zoom-in-95 duration-200 ${
            isDark 
              ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
              : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            
            <div className={`flex items-center justify-between mb-6 pb-2 border-b ${
              isDark ? 'border-zinc-800' : 'border-zinc-100'
            }`}>
              <h3 className={`text-base font-mono uppercase tracking-wider flex items-center gap-2 ${
                isDark ? 'text-zinc-100' : 'text-zinc-900'
              }`}>
                <Tag className="w-4 h-4 text-rose-500" /> 
                {editingId ? 'Modificar Tratamiento' : 'Registrar Tratamiento'}
              </h3>
              <button onClick={() => setShowModal(false)} className={`p-1.5 rounded-xl transition-colors ${
                isDark 
                  ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300' 
                  : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600'
              }`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-[11px] font-mono uppercase tracking-wide mb-1.5 ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}>Nombre del Servicio *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500/50 transition-colors placeholder-zinc-400 dark:placeholder-zinc-600 ${
                    isDark 
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`} 
                  placeholder="Ej: Esmaltado Semipermanente Glam"
                  required 
                />
              </div>

              <div>
                <label className={`block text-[11px] font-mono uppercase tracking-wide mb-1.5 ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}>Descripción Operativa</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  rows={3} 
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500/50 transition-colors placeholder-zinc-400 dark:placeholder-zinc-600 text-xs leading-relaxed ${
                    isDark 
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`} 
                  placeholder="Detalla los materiales utilizados o especificaciones particulares del servicio..." 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] font-mono uppercase tracking-wide mb-1.5 ${
                    isDark ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>Precio ($) *</label>
                  <input 
                    type="number" 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})} 
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500/50 transition-colors ${
                      isDark 
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`} 
                    placeholder="0.00"
                    required 
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-mono uppercase tracking-wide mb-1.5 ${
                    isDark ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>Duración (Min) *</label>
                  <input 
                    type="number" 
                    value={formData.duration} 
                    onChange={(e) => setFormData({...formData, duration: e.target.value})} 
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500/50 transition-colors ${
                      isDark 
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`} 
                    placeholder="60"
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] font-mono uppercase tracking-wide mb-1.5 ${
                    isDark ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>Categoría de Menú</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})} 
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500/50 transition-colors ${
                      isDark 
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  >
                    {categoriasConfig.filter(c => c.name !== 'Todos').map(cat => (
                      <option key={cat.name} value={cat.name} className={isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900'}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-[11px] font-mono uppercase tracking-wide mb-1.5 ${
                    isDark ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>Badge Promocional</label>
                  <input 
                    type="text" 
                    value={formData.badge} 
                    onChange={(e) => setFormData({...formData, badge: e.target.value})} 
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500/50 transition-colors uppercase placeholder-zinc-400 dark:placeholder-zinc-600 ${
                      isDark 
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`} 
                    placeholder="Ej: TOP, NUEVO" 
                  />
                </div>
              </div>

              <div className={`flex gap-3 pt-6 mt-2 border-t ${
                isDark ? 'border-zinc-800' : 'border-zinc-100'
              }`}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className={`flex-1 px-4 py-3 border rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-colors ${
                    isDark 
                      ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-950' 
                      : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                  }`}
                >
                  Cerrar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-600 to-amber-500 text-white rounded-xl text-xs font-mono font-bold tracking-wider uppercase hover:opacity-95 shadow-lg shadow-rose-600/10 flex items-center justify-center gap-2"
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