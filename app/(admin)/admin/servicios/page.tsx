'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Sparkles, Plus, Search, Clock, DollarSign, 
  Layers, Edit, Trash2, CheckCircle2, Sliders,
  X, Save
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

  const categorias = ['Manicuría', 'Sistemas', 'Esmaltado', 'Pedicuría', 'Nail Art', 'Micropigmentación', 'Microblading']

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
      <div className="flex h-96 items-center justify-center font-mono text-xs text-rose-500">
        <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mr-2" />
        Cargando servicios...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500/[0.05] via-card to-card border border-rose-500/20 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 font-mono">💅 Menu & Treatments</p>
            <h2 className="text-2xl font-serif italic text-foreground mt-1">Catálogo de Servicios</h2>
            <p className="text-xs text-mutedForeground mt-1">Configura los treatments disponibles en el salón.</p>
          </div>
          <button 
            onClick={() => { setEditingId(null); setFormData({ name: '', description: '', price: '', duration: '', badge: '', icon: 'Sparkles', category: 'Manicuría' }); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-all shadow-lg shadow-rose-600/10 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nuevo Servicio
          </button>
        </div>
      </div>

      {/* METRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-card border border-border p-5 flex items-center justify-between">
          <div>
            <p className="text-mutedForeground text-xs font-medium">Tratamientos Ofrecidos</p>
            <span className="text-2xl font-mono font-bold text-foreground block mt-1">{servicios.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400"><Sparkles className="w-5 h-5" /></div>
        </div>
        <div className="rounded-2xl bg-card border border-border p-5 flex items-center justify-between">
          <div>
            <p className="text-mutedForeground text-xs font-medium">Ticket Promedio</p>
            <span className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-1">${Math.round(promedioPrecio).toLocaleString()}</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"><DollarSign className="w-5 h-5" /></div>
        </div>
        <div className="rounded-2xl bg-card border border-border p-5 flex items-center justify-between">
          <div>
            <p className="text-mutedForeground text-xs font-medium">Estado</p>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 block mt-2 font-bold">✅ Sincronizado</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-5 h-5" /></div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="flex items-center bg-muted border border-border rounded-xl px-4 py-3 max-w-md flex-1">
          <Search className="w-4 h-4 text-mutedForeground shrink-0" />
          <input type="text" placeholder="Buscar tratamiento..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent border-none outline-none text-xs text-foreground placeholder-mutedForeground w-full ml-3 font-sans" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {['Todos', ...categorias].map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-400' : 'bg-transparent border-border text-mutedForeground hover:text-foreground hover:bg-muted'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* TARJETAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtrados.map((servicio: Servicio) => (
          <div key={servicio.id} className="rounded-2xl bg-card border border-border p-5 space-y-4 flex flex-col justify-between hover:border-rose-500/20 transition-all group">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-mono tracking-wider text-mutedForeground flex items-center gap-1"><Layers className="w-3 h-3" />{servicio.category || 'General'}</span>
                {servicio.badge && <span className="px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 text-[9px] font-mono">{servicio.badge}</span>}
              </div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{servicio.name}</h3>
              <p className="text-xs text-mutedForeground line-clamp-2 leading-relaxed">{servicio.description || 'Sin descripción disponible.'}</p>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-border/60 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-mutedForeground"><Clock className="w-3.5 h-3.5 text-mutedForeground/60" /><span>{servicio.duration || 60} min</span></div>
              <div className="font-bold text-foreground text-sm">${servicio.price?.toLocaleString()}</div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => handleEdit(servicio)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-background border border-border text-mutedForeground hover:text-foreground hover:bg-muted text-xs transition-all"><Edit className="w-3.5 h-3.5" /> Editar</button>
              <button onClick={() => handleDelete(servicio.id)} className="px-3 py-2 rounded-xl bg-background border border-border text-mutedForeground hover:text-rose-500 hover:border-rose-500/20 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
        {filtrados.length === 0 && <div className="col-span-full py-16 text-center font-mono text-mutedForeground text-xs">No se encontraron servicios en esta categoría.</div>}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><Plus className="w-5 h-5 text-rose-600 dark:text-rose-400" /> {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded-lg transition-colors"><X className="w-5 h-5 text-mutedForeground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-mutedForeground font-medium mb-1">Nombre del Servicio *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-rose-500/30" required />
              </div>
              <div>
                <label className="block text-xs text-mutedForeground font-medium mb-1">Descripción</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-rose-500/30 placeholder-mutedForeground" placeholder="Descripción del servicio" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-mutedForeground font-medium mb-1">Precio ($) *</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-rose-500/30" required />
                </div>
                <div>
                  <label className="block text-xs text-mutedForeground font-medium mb-1">Duración (min) *</label>
                  <input type="number" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-rose-500/30" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-mutedForeground font-medium mb-1">Categoría</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-rose-500/30">
                    {categorias.map(cat => <option key={cat} value={cat} className="bg-card text-foreground">{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-mutedForeground font-medium mb-1">Badge (opcional)</label>
                  <input type="text" value={formData.badge} onChange={(e) => setFormData({...formData, badge: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-rose-500/30" placeholder="Ej: TOP, POPULAR" />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-background border border-border text-mutedForeground rounded-xl text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-amber-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
