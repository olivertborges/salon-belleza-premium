'use client'

import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Plus, PlusCircle, Trash2, Save, GraduationCap, 
  Layers, Video, Edit3, X 
} from 'lucide-react'

interface LeccionForm {
  title: string
  duration: string
  isLocked: boolean
}

interface ModuloForm {
  title: string
  lecciones: LeccionForm[]
}

export default function AdminCursosPage() {
  const { user, tenantId, profile } = useAuth()
  const { theme } = useTheme()
  const supabase = createClientComponentClient()
  const isDark = theme === 'dark'

  const [cursos, setCursos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCursoId, setEditingCursoId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [instructor, setInstructor] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [modulos, setModulos] = useState<ModuloForm[]>([
    { title: 'Módulo 1: Fundamentos', lecciones: [{ title: 'Introducción', duration: '10:00', isLocked: false }] }
  ])

  useEffect(() => {
    console.log("[DEBUG] tenantId:", tenantId);
    if (tenantId) {
      cargarCursos()
    } else {
      setLoading(false)
    }
  }, [tenantId])

  async function cargarCursos() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('tenant_id', tenantId)

      if (error) throw error
      setCursos(data || [])
      setLoading(false)
    } catch (err) {
      console.error('Error cargando cursos:', err)
      setLoading(false)
    }
  }

  const agregarModulo = () => {
    setModulos([...modulos, { title: `Nuevo Módulo ${modulos.length + 1}`, lecciones: [] }])
  }

  const eliminarModulo = (mIdx: number) => {
    setModulos(modulos.filter((_, idx) => idx !== mIdx))
  }

  const cambiarTituloModulo = (mIdx: number, val: string) => {
    const nuevos = [...modulos]
    nuevos[mIdx].title = val
    setModulos(nuevos)
  }

  const agregarLeccion = (mIdx: number) => {
    const nuevos = [...modulos]
    nuevos[mIdx].lecciones.push({ title: 'Nueva Lección', duration: '15:00', isLocked: false })
    setModulos(nuevos)
  }

  const eliminarLeccion = (mIdx: number, lIdx: number) => {
    const nuevos = [...modulos]
    nuevos[mIdx].lecciones = nuevos[mIdx].lecciones.filter((_, idx) => idx !== lIdx)
    setModulos(nuevos)
  }

  const actualizarLeccion = (mIdx: number, lIdx: number, campo: keyof LeccionForm, val: any) => {
    const nuevos = [...modulos]
    nuevos[mIdx].lecciones[lIdx] = { ...nuevos[mIdx].lecciones[lIdx], [campo]: val }
    setModulos(nuevos)
  }

  async function handleGuardarCurso(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    
    console.log("=== GUARDANDO CURSO ===")
    console.log("tenantId:", tenantId)
    console.log("title:", title)
    console.log("instructor:", instructor)
    
    // VALIDACIONES
    if (!tenantId) {
      setErrorMsg("❌ Error: No tienes un tenant asignado.")
      console.error("ERROR: tenantId es null")
      return
    }

    if (!title.trim() || !instructor.trim()) {
      setErrorMsg("❌ El título y el instructor son obligatorios")
      return
    }

    const modulosValidos = modulos.every(m => 
      m.title.trim() && 
      m.lecciones.length > 0 && 
      m.lecciones.every(l => l.title.trim() && l.duration.trim())
    )
    
    if (!modulosValidos) {
      setErrorMsg("❌ Cada módulo debe tener al menos una lección con título y duración")
      return
    }

    const cursoPayload = {
      title: title.trim(),
      instructor: instructor.trim(),
      image_url: imageUrl || null,
      is_active: isActive,
      tenant_id: tenantId,
      modules: modulos,
      updated_at: new Date().toISOString()
    }
    
    console.log("Payload:", JSON.stringify(cursoPayload))

    try {
      if (editingCursoId) {
        console.log("Actualizando curso:", editingCursoId)
        const { error } = await supabase
          .from('courses')
          .update(cursoPayload)
          .eq('id', editingCursoId)
          .eq('tenant_id', tenantId)
        
        if (error) {
          console.error("ERROR UPDATE:", error)
          setErrorMsg("❌ Error al actualizar: " + error.message)
          return
        }
        alert('✅ Curso actualizado correctamente')
      } else {
        console.log("Insertando nuevo curso")
        const { error } = await supabase
          .from('courses')
          .insert([cursoPayload])
        
        if (error) {
          console.error("ERROR INSERT:", error)
          setErrorMsg("❌ Error al crear: " + error.message)
          return
        }
        alert('✅ Curso creado correctamente')
      }
      
      resetForm()
      await cargarCursos()
      
    } catch (err: any) {
      console.error("ERROR GENERAL:", err)
      setErrorMsg("❌ Error: " + (err.message || 'Error desconocido'))
    }
  }

  function resetForm() {
    setTitle('')
    setInstructor('')
    setImageUrl('')
    setIsActive(true)
    setModulos([{ title: 'Módulo 1: Fundamentos', lecciones: [{ title: 'Introducción', duration: '10:00', isLocked: false }] }])
    setEditingCursoId(null)
    setIsModalOpen(false)
  }

  function abrirEditar(curso: any) {
    setEditingCursoId(curso.id)
    setTitle(curso.title || '')
    setInstructor(curso.instructor || '')
    setImageUrl(curso.image_url || '')
    setIsActive(curso.is_active ?? true)
    if (curso.modules && Array.isArray(curso.modules)) {
      setModulos(curso.modules)
    }
    setIsModalOpen(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 antialiased">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 dark:border-stone-850 pb-6">
        <div>
          <h1 className={`text-2xl font-serif italic ${isDark ? 'text-white' : 'text-stone-900'}`}>
            Gestión de la <span className="text-rose-500">Academia Virtual</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">Crea, edita y estructura módulos y videolecciones para tus alumnas.</p>
          <div className="mt-2 text-[10px] font-mono">
            <span className="text-stone-500">Tenant: </span>
            <span className={tenantId ? 'text-emerald-500' : 'text-red-500'}>
              {tenantId ? '✅ Activo' : '❌ Sin tenant'}
            </span>
          </div>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-rose-600/10"
        >
          <Plus className="w-4 h-4" /> Nuevo Curso LMS
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-xl text-xs font-mono">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 font-mono text-xs text-stone-400">Cargando catálogo...</div>
      ) : cursos.length === 0 ? (
        <div className={`text-center py-16 border border-dashed rounded-3xl ${isDark ? 'border-stone-800 bg-stone-950/10' : 'border-stone-200 bg-stone-50/50'}`}>
          <GraduationCap className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <p className="text-xs text-stone-400">No hay cursos creados en este Tenant todavía.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cursos.map((curso) => (
            <div 
              key={curso.id}
              className={`border rounded-2xl overflow-hidden flex flex-col justify-between transition-all ${
                isDark ? 'bg-[#141211] border-stone-850' : 'bg-white border-stone-200 shadow-sm'
              }`}
            >
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                    curso.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-stone-500/10 text-stone-400'
                  }`}>
                    {curso.is_active ? 'Publicado' : 'Borrador'}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">
                    {Array.isArray(curso.modules) ? curso.modules.length : 0} Módulos
                  </span>
                </div>

                <div>
                  <h3 className={`text-sm font-medium line-clamp-1 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{curso.title}</h3>
                  <p className="text-xs text-stone-400 italic">Por: {curso.instructor}</p>
                </div>
              </div>

              <div className={`p-4 border-t flex justify-end gap-2 ${isDark ? 'border-stone-900 bg-stone-950/20' : 'border-stone-100 bg-stone-50/40'}`}>
                <button 
                  onClick={() => abrirEditar(curso)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase font-bold transition-colors flex items-center gap-1 ${
                    isDark ? 'bg-stone-900 text-stone-200 hover:bg-stone-800' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <Edit3 className="w-3 h-3" /> Configurar LMS
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-4xl rounded-3xl border overflow-hidden max-h-[90vh] flex flex-col ${
            isDark ? 'bg-[#141211] border-stone-850 text-white' : 'bg-white border-stone-200 text-stone-900'
          }`}>
            
            <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-stone-850 bg-stone-950/40' : 'border-stone-100 bg-stone-50'}`}>
              <div className="flex items-center gap-2">
                <Layers className="text-rose-500 w-5 h-5" />
                <h2 className="text-base font-medium font-serif italic">
                  {editingCursoId ? 'Editar Estructura Curricular' : 'Diseñar Nuevo Curso Virtual'}
                </h2>
              </div>
              <button onClick={resetForm} className="text-stone-400 hover:text-stone-200"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleGuardarCurso} className="p-6 space-y-6 overflow-y-auto flex-1 font-sans text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-stone-400 font-mono text-[10px] uppercase">Título del Curso</label>
                  <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className={`w-full px-3 py-2 rounded-xl border font-medium ${isDark ? 'bg-stone-950 border-stone-800 text-white' : 'bg-white border-stone-200'}`} placeholder="Ej. Master en Estructuras de Gel" />
                </div>
                <div className="space-y-1">
                  <label className="block text-stone-400 font-mono text-[10px] uppercase">Instructor / Master</label>
                  <input required type="text" value={instructor} onChange={e => setInstructor(e.target.value)} className={`w-full px-3 py-2 rounded-xl border font-medium ${isDark ? 'bg-stone-950 border-stone-800 text-white' : 'bg-white border-stone-200'}`} placeholder="Ej. Yuliana Silva" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-stone-400 font-mono text-[10px] uppercase">URL de Portada de Video (Imagen)</label>
                  <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className={`w-full px-3 py-2 rounded-xl border font-mono ${isDark ? 'bg-stone-950 border-stone-800 text-white' : 'bg-white border-stone-200'}`} placeholder="https://images.unsplash.com/..." />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-stone-900/10 dark:border-stone-850">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif italic text-sm text-rose-400">Estructura de Módulos y Clases</h3>
                  <button type="button" onClick={agregarModulo} className="px-2.5 py-1 rounded-lg border border-rose-500/30 text-rose-400 font-mono text-[9px] uppercase tracking-wider hover:bg-rose-500/5 flex items-center gap-1">
                    <PlusCircle className="w-3 h-3" /> Añadir Módulo
                  </button>
                </div>

                <div className="space-y-4">
                  {modulos.map((modulo, mIdx) => (
                    <div key={mIdx} className={`p-4 border rounded-2xl space-y-3 ${isDark ? 'bg-stone-950/40 border-stone-850' : 'bg-stone-50/50 border-stone-200'}`}>
                      <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <Layers className="w-3.5 h-3.5 text-stone-400" />
                          <input required type="text" value={modulo.title} onChange={e => cambiarTituloModulo(mIdx, e.target.value)} className={`px-2 py-1 rounded-md border font-medium text-xs flex-1 ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`} />
                        </div>
                        <button type="button" onClick={() => eliminarModulo(mIdx)} className="text-stone-500 hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>

                      <div className="pl-6 space-y-2 border-l border-stone-800">
                        {modulo.lecciones.map((leccion, lIdx) => (
                          <div key={lIdx} className="flex flex-wrap items-center gap-2 bg-stone-900/10 dark:bg-stone-900/30 p-2 rounded-xl border border-stone-900/5 dark:border-stone-850">
                            <Video className="w-3.5 h-3.5 text-rose-400/70" />
                            <input required type="text" value={leccion.title} onChange={e => actualizarLeccion(mIdx, lIdx, 'title', e.target.value)} className={`px-2 py-1 rounded-md border text-[11px] flex-1 min-w-[150px] ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-white border-stone-200'}`} placeholder="Nombre de la Clase" />
                            <input required type="text" value={leccion.duration} onChange={e => actualizarLeccion(mIdx, lIdx, 'duration', e.target.value)} className={`px-2 py-1 rounded-md border text-[11px] font-mono w-16 text-center ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-white border-stone-200'}`} placeholder="15:00" />
                            <label className="flex items-center gap-1 font-mono text-[9px] cursor-pointer text-stone-400 select-none">
                              <input type="checkbox" checked={leccion.isLocked} onChange={e => actualizarLeccion(mIdx, lIdx, 'isLocked', e.target.checked)} className="rounded border-stone-700 bg-stone-950 text-rose-500 focus:ring-0" />
                              Bloqueada
                            </label>
                            <button type="button" onClick={() => eliminarLeccion(mIdx, lIdx)} className="text-stone-500 hover:text-red-400 ml-auto p-1"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                        <button type="button" onClick={() => agregarLeccion(mIdx)} className="text-[10px] text-stone-400 hover:text-rose-400 font-mono flex items-center gap-1 pt-1">
                          <Plus className="w-3 h-3" /> Vincular Clase en Video
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 font-mono text-[10px] uppercase text-stone-400 cursor-pointer select-none pt-2">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded border-stone-700 bg-stone-950 text-rose-500 focus:ring-0 w-4 h-4" />
                Publicar inmediatamente para las alumnas
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-900/10 dark:border-stone-850">
                <button type="button" onClick={resetForm} className={`px-4 py-2 rounded-xl font-mono uppercase tracking-wider font-bold ${isDark ? 'bg-stone-900 text-stone-300 hover:bg-stone-800' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>Cancelar</button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono uppercase tracking-wider font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-rose-600/10"
                >
                  <Save className="w-3.5 h-3.5" /> {editingCursoId ? 'Guardar Cambios' : 'Lanzar Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
