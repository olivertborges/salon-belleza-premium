'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  GraduationCap, Plus, Search, Users, Calendar, 
  DollarSign, BookOpen, Edit, Trash2, CheckCircle2, X, Save
} from 'lucide-react'

interface Curso {
  id: string
  title: string
  instructor: string
  start_date: string
  price: number
  enrolled: number
  capacity: number
  status: string
  modality: string
  description: string
  is_active: boolean
  created_at: string
}

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [search, setSearch] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    start_date: '',
    price: '',
    enrolled: '',
    capacity: '',
    status: 'Inscripciones Abiertas',
    modality: 'Presencial',
    description: ''
  })

  const statusOptions = ['Inscripciones Abiertas', 'En Curso', 'Finalizado']
  const modalityOptions = ['Presencial', 'Online Live']

  const fetchCursos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: true })

      if (error) {
        console.error('Error:', error)
        setError(error.message)
        return
      }
      
      setCursos(data || [])
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Error al cargar cursos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCursos()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    if (!formData.title || !formData.instructor || !formData.start_date || !formData.price) {
      setError('Título, instructor, fecha y precio son obligatorios')
      return
    }

    const payload = {
      title: formData.title,
      instructor: formData.instructor,
      start_date: formData.start_date,
      price: parseFloat(formData.price) || 0,
      enrolled: parseInt(formData.enrolled) || 0,
      capacity: parseInt(formData.capacity) || 10,
      status: formData.status || 'Inscripciones Abiertas',
      modality: formData.modality || 'Presencial',
      description: formData.description || '',
      is_active: true
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('courses')
          .update(payload)
          .eq('id', editingId)

        if (error) throw error
        setSuccess('✅ Curso actualizado correctamente')
      } else {
        const { error } = await supabase
          .from('courses')
          .insert([payload])

        if (error) throw error
        setSuccess('✅ Curso creado correctamente')
      }

      setShowModal(false)
      setEditingId(null)
      setFormData({ title: '', instructor: '', start_date: '', price: '', enrolled: '', capacity: '', status: 'Inscripciones Abiertas', modality: 'Presencial', description: '' })
      fetchCursos()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error al guardar:', err)
      setError(`Error: ${err.message || 'Error desconocido'}`)
    }
  }

  const handleEdit = (curso: Curso) => {
    setEditingId(curso.id)
    setFormData({
      title: curso.title,
      instructor: curso.instructor,
      start_date: curso.start_date || '',
      price: String(curso.price || 0),
      enrolled: String(curso.enrolled || 0),
      capacity: String(curso.capacity || 10),
      status: curso.status || 'Inscripciones Abiertas',
      modality: curso.modality || 'Presencial',
      description: curso.description || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este curso?')) return
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      setSuccess('✅ Curso eliminado')
      fetchCursos()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error al eliminar:', err)
      setError(err.message || 'Error al eliminar')
    }
  }

  const filtrados = cursos.filter((c: Curso) => 
    c.title?.toLowerCase().includes(search.toLowerCase()) || 
    c.instructor?.toLowerCase().includes(search.toLowerCase())
  )

  const totalAlumnas = cursos.reduce((sum: number, c: Curso) => sum + (c.enrolled || 0), 0)
  const ingresosProyectados = cursos.reduce((sum: number, c: Curso) => sum + ((c.enrolled || 0) * (c.price || 0)), 0)

  if (loading) {
    return <div className="flex h-96 items-center justify-center font-mono text-xs text-fuchsia-400">Cargando cursos...</div>
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-950/40 via-stone-900/40 to-[#0e0c0b] border border-fuchsia-500/20 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-fuchsia-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-fuchsia-400 font-mono">🎓 Academy & Workshops</p>
            <h2 className="text-2xl font-serif italic text-white mt-1">Academia Fresh Nails</h2>
            <p className="text-xs text-stone-400 mt-1">Gestiona tus talleres, controla los cupos disponibles de estudiantes.</p>
          </div>
          <button 
            onClick={() => { setEditingId(null); setFormData({ title: '', instructor: '', start_date: '', price: '', enrolled: '', capacity: '', status: 'Inscripciones Abiertas', modality: 'Presencial', description: '' }); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-medium transition-all shadow-lg shadow-fuchsia-600/10 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nuevo Curso
          </button>
        </div>
      </div>

      {/* ERROR Y SUCCESS */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs">
          <p className="font-mono">❌ {error}</p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-400 text-xs">
          <p className="font-mono">✅ {success}</p>
        </div>
      )}

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Talleres Activos</p>
            <span className="text-2xl font-mono font-bold text-stone-100 block mt-1">{cursos.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>
        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Alumnas Inscritas</p>
            <span className="text-2xl font-mono font-bold text-fuchsia-400 block mt-1">{totalAlumnas}</span>
          </div>
          <div className="p-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Ingresos Proyectados</p>
            <span className="text-2xl font-mono font-bold text-emerald-400 block mt-1">
              ${ingresosProyectados.toLocaleString()}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* BÚSQUEDA */}
      <div className="flex items-center bg-stone-900/40 border border-stone-900 rounded-xl px-4 py-3 max-w-md">
        <Search className="w-4 h-4 text-stone-500 shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar taller por temática o instructor..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-stone-200 placeholder-stone-500 w-full ml-3 font-sans"
        />
      </div>

      {/* GRID DE CURSOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtrados.map((curso: Curso) => {
          const porcentajeLleno = Math.round(((curso.enrolled || 0) / (curso.capacity || 1)) * 100)
          const esLleno = curso.enrolled === curso.capacity

          return (
            <div key={curso.id} className="rounded-2xl bg-[#0e0c0b] border border-stone-900 p-5 space-y-4 flex flex-col justify-between hover:border-fuchsia-500/20 transition-all group">

              <div className="flex justify-between items-center">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono border ${
                  curso.status === 'Inscripciones Abiertas' 
                    ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' 
                    : curso.status === 'En Curso'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-stone-500/10 text-stone-400 border-stone-500/20'
                }`}>
                  {curso.status}
                </span>
                <span className="text-[10px] text-stone-500 font-mono">{curso.modality}</span>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-stone-200 group-hover:text-fuchsia-400 transition-colors line-clamp-2">
                  {curso.title}
                </h3>
                <p className="text-xs text-stone-500">Dictado por: <span className="text-stone-300 font-medium">{curso.instructor}</span></p>
              </div>

              {curso.description && (
                <p className="text-[10px] text-stone-400 line-clamp-2">{curso.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-900/60 text-[11px] font-mono text-stone-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-stone-600" />
                  <span>{curso.start_date}</span>
                </div>
                <div className="flex items-center justify-end font-bold text-stone-200 text-xs">
                  ${(curso.price || 0).toLocaleString()}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-stone-500">Cupos Reservados</span>
                  <span className={esLleno ? 'text-red-400' : 'text-stone-300'}>
                    {curso.enrolled || 0} / {curso.capacity || 0} {esLleno && '(Lleno)'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      esLleno ? 'bg-red-500' : 'bg-gradient-to-r from-fuchsia-600 to-purple-500'
                    }`}
                    style={{ width: `${porcentajeLleno}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-stone-900/60">
                <button 
                  onClick={() => handleEdit(curso)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 text-xs transition-all"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Editar Curso
                </button>
                <button 
                  onClick={() => handleDelete(curso.id)}
                  className="px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-500 hover:text-red-400 hover:border-red-500/20 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )
        })}

        {filtrados.length === 0 && (
          <div className="col-span-full py-12 text-center font-mono text-stone-500 text-xs border border-dashed border-stone-900 rounded-xl">
            No se encontraron cursos
          </div>
        )}
      </div>

      {/* MODAL PARA CREAR/EDITAR CURSO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e0c0b] border border-stone-900 rounded-2xl p-5 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-fuchsia-400" />
                {editingId ? 'Editar Curso' : 'Nuevo Curso'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-stone-900 rounded-lg transition-colors">
                <X className="w-4 h-4 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] text-stone-400 font-medium mb-1">Título del Curso *</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/30" 
                  required 
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone-400 font-medium mb-1">Instructor *</label>
                <input 
                  type="text" 
                  value={formData.instructor} 
                  onChange={(e) => setFormData({...formData, instructor: e.target.value})} 
                  className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/30" 
                  required 
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone-400 font-medium mb-1">Descripción</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  rows={2} 
                  className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/30" 
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone-400 font-medium mb-1">Fecha de Inicio *</label>
                <input 
                  type="date" 
                  value={formData.start_date} 
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})} 
                  className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/30" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1">Precio ($) *</label>
                  <input 
                    type="number" 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})} 
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/30" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1">Capacidad</label>
                  <input 
                    type="number" 
                    value={formData.capacity} 
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})} 
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/30" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1">Inscritos</label>
                  <input 
                    type="number" 
                    value={formData.enrolled} 
                    onChange={(e) => setFormData({...formData, enrolled: e.target.value})} 
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/30" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1">Estado</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value})} 
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/30"
                  >
                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-stone-400 font-medium mb-1">Modalidad</label>
                <select 
                  value={formData.modality} 
                  onChange={(e) => setFormData({...formData, modality: e.target.value})} 
                  className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/30"
                >
                  {modalityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-stone-900">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 px-3 py-2 bg-stone-900/50 border border-stone-900 text-stone-400 rounded-xl text-xs font-medium hover:bg-stone-900 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-fuchsia-600 to-purple-500 text-white rounded-xl text-xs font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
