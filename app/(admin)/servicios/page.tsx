'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { 
  Sparkles, Plus, Search, Clock, DollarSign, 
  Layers, Edit, Trash2, CheckCircle2, Sliders 
} from 'lucide-react'

// Estructura exacta basada en tu esquema de Supabase para 'services'
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

  // Lista dinámica de categorías para filtrar en la UI
  const categorias: string[] = ['Todos', 'Manicuría', 'Sistemas', 'Esmaltado', 'Pedicuría', 'Nail Art']

  // 📡 FETCH: Obtener los servicios desde Supabase
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

  // Filtrado lógico en memoria
  const filtrados = servicios.filter((s: Servicio) => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === 'Todos' || s.category === selectedCategory
    return matchSearch && matchCategory
  })

  // Métricas rápidas calculadas
  const promedioPrecio = servicios.length > 0 ? servicios.reduce((sum, s) => sum + s.price, 0) / servicios.length : 0

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center font-mono text-xs text-rose-400">
        Sincronizando menú de servicios con Supabase...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/40 via-stone-900/40 to-[#0e0c0b] border border-rose-500/20 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-rose-400 font-mono">💅 Menu & Treatments</p>
            <h2 className="text-2xl font-serif italic text-white mt-1">Catálogo de Servicios</h2>
            <p className="text-xs text-stone-400 mt-1">Configura los tratamientos disponibles en el salón, sus valores comerciales y tiempos de cabina.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-all shadow-lg shadow-rose-600/10 self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            Nuevo Servicio
          </button>
        </div>
      </div>

      {/* METRICAS DE SERVICIOS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Tratamientos Ofrecidos</p>
            <span className="text-2xl font-mono font-bold text-stone-100 block mt-1">{servicios.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Ticket Promedio Servicio</p>
            <span className="text-2xl font-mono font-bold text-emerald-400 block mt-1">
              ${Math.round(promedioPrecio).toLocaleString()}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Estado de Disponibilidad</p>
            <span className="text-xs font-mono text-rose-400 block mt-2 font-bold">Sincronizado Online</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Sliders className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="flex items-center bg-stone-900/40 border border-stone-900 rounded-xl px-4 py-3 max-w-md flex-1">
          <Search className="w-4 h-4 text-stone-500 shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar tratamiento o descripción..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-stone-200 placeholder-stone-500 w-full ml-3 font-sans"
          />
        </div>

        {/* Chips de Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-400'
                  : 'bg-transparent border-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-900/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRILLA DE TARJETAS DE SERVICIOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtrados.map((servicio: Servicio) => (
          <div key={servicio.id} className="rounded-2xl bg-[#0e0c0b] border border-stone-900 p-5 space-y-4 flex flex-col justify-between hover:border-rose-500/20 transition-all group">
            
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {servicio.category || 'General'}
                </span>
                {servicio.badge && (
                  <span className="px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-mono">
                    {servicio.badge}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-stone-200 group-hover:text-rose-400 transition-colors">
                {servicio.name}
              </h3>
              <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                {servicio.description || 'Sin descripción disponible.'}
              </p>
            </div>

            {/* Duración y Precio */}
            <div className="flex justify-between items-center pt-3 border-t border-stone-900/60 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-stone-400">
                <Clock className="w-3.5 h-3.5 text-stone-600" />
                <span>{servicio.duration || 60} min</span>
              </div>
              <div className="font-bold text-stone-200 text-sm">
                ${servicio.price?.toLocaleString()}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 pt-1">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 text-xs transition-all">
                <Edit className="w-3.5 h-3.5" />
                Editar Servicio
              </button>
              <button className="px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-500 hover:text-red-400 hover:border-red-500/20 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ))}

        {filtrados.length === 0 && (
          <div className="col-span-full py-16 text-center font-mono text-stone-600 text-xs">
            No se encontraron servicios asignados a esta categoría.
          </div>
        )}
      </div>

    </div>
  )
}