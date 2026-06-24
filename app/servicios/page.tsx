'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/config/supabase'
import { 
  FaArrowLeft, 
  FaClock, 
  FaTag, 
  FaCalendarPlus, 
  FaToggleOn, 
  FaToggleOff, 
  FaPlus, 
  FaTrashAlt,
  FaSparkles
} from 'react-icons/fa'

interface ServicioReal {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  is_active: boolean;
}

export default function ServiciosPage() {
  const { tenantId } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [servicios, setServicios] = useState<ServicioReal[]>([])
  const [loading, setLoading] = useState(true)

  // Estados para el formulario de creación
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('Cejas')
  const [newPrice, setNewPrice] = useState('')
  const [newDuration, setNewDuration] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const categories = ['Todos', 'Cejas', 'Pestañas', 'Labios']

  // CARGA REAL DESDE SUPABASE
  useEffect(() => {
    if (tenantId) {
      fetchServiciosRealtime()
    }
  }, [tenantId])

  const fetchServiciosRealtime = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('id, name, description, price, duration, category, is_active')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setServicios(data)
    } catch (err) {
      console.error("Error obteniendo servicios reales:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredServicios = activeCategory === 'Todos' 
    ? servicios 
    : servicios.filter(s => s.category === activeCategory)

  // ESCRITURA REAL EN LA BASE DE DATOS
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newPrice || !tenantId) return

    try {
      const { error } = await supabase
        .from('services')
        .insert([{
          tenant_id: tenantId,
          name: newTitle,
          category: newCategory,
          price: Number(newPrice),
          duration: Number(newDuration) || 60,
          description: newDesc,
          is_active: true
        }])

      if (error) throw error
      
      // Refrescar vitrina de inmediato
      fetchServiciosRealtime()

      // Resetear formulario
      setNewTitle('')
      setNewPrice('')
      setNewDuration('')
      setNewDesc('')
    } catch (err) {
      console.error("Error al insertar servicio:", err)
    }
  }

  // ELIMINACIÓN REAL (DESACTIVACIÓN LÓGICA)
  const handleDeleteService = async (id: string) => {
    if(confirm('¿Seguro que deseas eliminar este servicio de la vitrina real?')) {
      try {
        const { error } = await supabase
          .from('services')
          .update({ is_active: false })
          .eq('id', id)

        if (error) throw error
        setServicios(servicios.filter(s => s.id !== id))
      } catch (err) {
        console.error("Error al eliminar servicio:", err)
      }
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 pb-20 overflow-x-hidden">
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-40 flex items-center justify-between">
        <Link href="/" className="text-slate-400 flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium">
          <FaArrowLeft className="text-rose-400" /> Volver
        </Link>
        <button 
          onClick={() => setIsAdmin(!isAdmin)} 
          className="flex items-center gap-2 text-[10px] bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 tracking-widest uppercase text-slate-300 active:scale-95 transition-all"
        >
          {isAdmin ? <FaToggleOn className="text-rose-400 text-sm" /> : <FaToggleOff className="text-slate-500 text-sm" />}
          Menú: {isAdmin ? 'Gestión' : 'Catálogo'}
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-light text-slate-100 tracking-tight">
            Nuestros <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400">Servicios</span>
          </h1>
          <p className="text-slate-400 text-xs font-light mt-1">Tratamientos estéticos avanzados en tiempo real.</p>
        </div>

        {isAdmin && (
          <div className="bg-slate-900 border-2 border-dashed border-rose-500/30 p-5 rounded-3xl shadow-xl mb-6">
            <h2 className="text-xs uppercase tracking-wider font-bold text-rose-400 flex items-center gap-1.5 mb-3">
              <FaSparkles /> Añadir Nuevo Servicio Real
            </h2>
            <form onSubmit={handleCreateService} className="space-y-3">
              <input 
                type="text"
                placeholder="Nombre del tratamiento"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none"
                required
              />
              <div className="grid grid-cols-3 gap-2">
                <select 
                  value={newCategory} 
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="Cejas">Cejas</option>
                  <option value="Pestañas">Pestañas</option>
                  <option value="Labios">Labios</option>
                </select>
                <input 
                  type="number" 
                  placeholder="Precio ($)"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                  required
                />
                <input 
                  type="number" 
                  placeholder="Minutos"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>
              <textarea 
                placeholder="Descripción del tratamiento..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs h-16 resize-none text-slate-300 focus:outline-none"
              />
              <button type="submit" className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider">
                <FaPlus /> Guardar en Base de Datos
              </button>
            </form>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium border ${
                activeCategory === cat 
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white border-transparent font-bold' 
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-xs text-slate-500 py-8">Cargando catálogo real...</p>
        ) : (
          <div className="space-y-4 mt-2">
            {filteredServicios.map((servicio) => (
              <div key={servicio.id} className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-md text-slate-400">
                      {servicio.category}
                    </span>
                    <h3 className="font-bold text-sm text-slate-100 tracking-tight mt-1.5">{servicio.name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">
                      ${servicio.price}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-light leading-relaxed mb-4">{servicio.description}</p>

                <div className="flex justify-between items-center pt-3 border-t border-slate-850/60">
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><FaClock className="text-rose-500/70" /> {servicio.duration} min</span>
                    <span className="flex items-center gap-1"><FaTag className="text-amber-500/70" /> Cabina Individual</span>
                  </div>

                  {isAdmin ? (
                    <button onClick={() => handleDeleteService(servicio.id)} className="text-slate-600 hover:text-rose-400 p-2 text-xs">
                      <FaTrashAlt />
                    </button>
                  ) : (
                    <Link href={`/reservas?servicio=${encodeURIComponent(servicio.name)}`} className="bg-slate-950 border border-slate-800 text-slate-300 font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl">
                      <FaCalendarPlus className="text-rose-400" /> Agendar
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {filteredServicios.length === 0 && (
              <p className="text-center text-xs text-slate-500 py-8">No hay tratamientos disponibles en esta categoría en este momento.</p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
