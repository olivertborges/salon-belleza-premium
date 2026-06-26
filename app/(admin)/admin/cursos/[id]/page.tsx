'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { ContentEditor } from '@/components/courses'
import { 
  ArrowLeft, Save, X, Plus, PlusCircle, Trash2, 
  Layers, Video, FileText, Award, Lock, Unlock,
  ChevronDown, ChevronRight
} from 'lucide-react'
import Link from 'next/link'

interface Leccion {
  id?: string
  title: string
  description: string
  content: string
  video_url: string
  video_duration: string
  pdf_url: string
  is_locked: boolean
  type: 'video' | 'text' | 'quiz' | 'resource'
  duration: string
  quiz?: any
  attachments?: any[]
  order?: number
}

interface Modulo {
  title: string
  description: string
  lecciones: Leccion[]
}

export default function EditarCursoPage() {
  const router = useRouter()
  const params = useParams()
  const { tenantId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [cursoData, setCursoData] = useState({
    title: '',
    instructor: '',
    description: '',
    image_url: '',
    level: 'beginner',
    category: '',
    is_active: true
  })

  const [modulos, setModulos] = useState<Modulo[]>([])
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({})
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (tenantId && params.id) {
      cargarCurso()
    }
  }, [tenantId, params.id])

  async function cargarCurso() {
    try {
      setLoading(true)
      
      // Obtener el curso
      const { data: curso, error: cursoError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (cursoError) throw cursoError

      setCursoData({
        title: curso.title || '',
        instructor: curso.instructor || '',
        description: curso.description || '',
        image_url: curso.image_url || '',
        level: curso.level || 'beginner',
        category: curso.category || '',
        is_active: curso.is_active ?? true
      })

      // Obtener lecciones
      const { data: lessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('course_id', params.id)
        .order('order', { ascending: true })

      if (lessonsError) throw lessonsError

      // Agrupar lecciones por módulo
      const modulesMap = new Map()
      lessons?.forEach((lesson: any) => {
        if (!modulesMap.has(lesson.module_title)) {
          modulesMap.set(lesson.module_title, [])
        }
        modulesMap.get(lesson.module_title).push({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || '',
          content: lesson.content || '',
          video_url: lesson.video_url || '',
          video_duration: lesson.video_duration || '00:00',
          pdf_url: lesson.pdf_url || '',
          is_locked: lesson.is_locked || false,
          type: lesson.type || 'video',
          duration: lesson.duration || '15 min',
          quiz: lesson.quiz || null,
          attachments: lesson.attachments || [],
          order: lesson.order || 0
        })
      })

      const modules = Array.from(modulesMap.entries()).map(([title, lecciones]) => ({
        title,
        description: '',
        lecciones
      }))

      setModulos(modules.length > 0 ? modules : [
        {
          title: 'Módulo 1',
          description: '',
          lecciones: []
        }
      ])

      setExpandedModules({ 0: true })

    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Error al cargar el curso')
    } finally {
      setLoading(false)
    }
  }

  const toggleModule = (idx: number) => {
    setExpandedModules(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  const toggleLesson = (id: string) => {
    setExpandedLessons(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const agregarModulo = () => {
    setModulos([...modulos, {
      title: `Nuevo Módulo ${modulos.length + 1}`,
      description: '',
      lecciones: []
    }])
    setExpandedModules({ ...expandedModules, [modulos.length]: true })
  }

  const eliminarModulo = (idx: number) => {
    setModulos(modulos.filter((_, i) => i !== idx))
  }

  const cambiarModulo = (idx: number, field: keyof Modulo, value: string) => {
    const nuevos = [...modulos]
    nuevos[idx] = { ...nuevos[idx], [field]: value }
    setModulos(nuevos)
  }

  const agregarLeccion = (moduloIdx: number) => {
    const nuevos = [...modulos]
    const newLesson: Leccion = {
      title: 'Nueva Lección',
      description: '',
      content: '',
      video_url: '',
      video_duration: '15:00',
      pdf_url: '',
      is_locked: false,
      type: 'video',
      duration: '15 min',
      quiz: null,
      attachments: []
    }
    nuevos[moduloIdx].lecciones.push(newLesson)
    setModulos(nuevos)
    const id = Date.now().toString()
    setExpandedLessons({ ...expandedLessons, [id]: true })
  }

  const eliminarLeccion = (moduloIdx: number, leccionIdx: number) => {
    const nuevos = [...modulos]
    nuevos[moduloIdx].lecciones = nuevos[moduloIdx].lecciones.filter((_, i) => i !== leccionIdx)
    setModulos(nuevos)
  }

  const cambiarLeccion = (
    moduloIdx: number,
    leccionIdx: number,
    field: keyof Leccion,
    value: any
  ) => {
    const nuevos = [...modulos]
    nuevos[moduloIdx].lecciones[leccionIdx] = {
      ...nuevos[moduloIdx].lecciones[leccionIdx],
      [field]: value
    }
    setModulos(nuevos)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    if (!tenantId) {
      setError('No tienes un tenant asignado.')
      setSaving(false)
      return
    }

    if (!cursoData.title.trim() || !cursoData.instructor.trim()) {
      setError('El título y el instructor son obligatorios.')
      setSaving(false)
      return
    }

    const tieneLecciones = modulos.some(m => m.lecciones.length > 0)
    if (!tieneLecciones) {
      setError('Debes agregar al menos una lección.')
      setSaving(false)
      return
    }

    try {
      // Actualizar el curso
      const { error: cursoError } = await supabase
        .from('courses')
        .update({
          title: cursoData.title.trim(),
          instructor: cursoData.instructor.trim(),
          description: cursoData.description || '',
          image_url: cursoData.image_url || null,
          level: cursoData.level,
          category: cursoData.category || '',
          is_active: cursoData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('tenant_id', tenantId)

      if (cursoError) throw cursoError

      // Eliminar lecciones antiguas
      const { error: deleteError } = await supabase
        .from('course_lessons')
        .delete()
        .eq('course_id', params.id)

      if (deleteError) throw deleteError

      // Crear nuevas lecciones
      let order = 0
      const allLecciones: any[] = []

      modulos.forEach((modulo) => {
        modulo.lecciones.forEach((leccion) => {
          allLecciones.push({
            course_id: params.id,
            module_title: modulo.title,
            title: leccion.title,
            description: leccion.description || '',
            content: leccion.content || '',
            video_url: leccion.video_url || '',
            video_duration: leccion.video_duration || '00:00',
            pdf_url: leccion.pdf_url || '',
            is_locked: leccion.is_locked || false,
            type: leccion.type || 'video',
            duration: leccion.duration || '15 min',
            quiz: leccion.quiz || null,
            attachments: leccion.attachments || [],
            order: order++
          })
        })
      })

      if (allLecciones.length > 0) {
        const { error: lessonsError } = await supabase
          .from('course_lessons')
          .insert(allLecciones)

        if (lessonsError) throw lessonsError
      }

      router.push('/admin/cursos')
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Error al actualizar el curso')
    } finally {
      setSaving(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'video': return <Video className="w-3.5 h-3.5" />
      case 'text': return <FileText className="w-3.5 h-3.5" />
      case 'quiz': return <Award className="w-3.5 h-3.5" />
      default: return <FileText className="w-3.5 h-3.5" />
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500/[0.05] via-card to-card border border-rose-500/20 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/cursos"
              className="p-2 rounded-xl border border-border hover:bg-muted/20 transition-colors text-mutedForeground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 font-mono">🎓 Administración</p>
              <h2 className="text-2xl font-serif italic text-foreground mt-1">Editar Curso</h2>
              <p className="text-xs text-mutedForeground mt-1">{cursoData.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/cursos"
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted/20 transition-colors text-xs font-medium text-foreground"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-all shadow-lg shadow-rose-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Actualizar Curso'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-xl text-xs font-mono">
          {error}
        </div>
      )}

      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <h3 className="text-sm font-bold text-foreground">Información del Curso</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
              Título <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              value={cursoData.title}
              onChange={e => setCursoData({...cursoData, title: e.target.value})}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-rose-500/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
              Instructor <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              value={cursoData.instructor}
              onChange={e => setCursoData({...cursoData, instructor: e.target.value})}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-rose-500/50"
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
              Descripción
            </label>
            <textarea
              value={cursoData.description}
              onChange={e => setCursoData({...cursoData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-rose-500/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
              URL de Portada
            </label>
            <input
              type="text"
              value={cursoData.image_url}
              onChange={e => setCursoData({...cursoData, image_url: e.target.value})}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-rose-500/50 font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
              Nivel
            </label>
            <select
              value={cursoData.level}
              onChange={e => setCursoData({...cursoData, level: e.target.value})}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-rose-500/50"
            >
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-mutedForeground cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={cursoData.is_active}
            onChange={e => setCursoData({...cursoData, is_active: e.target.checked})}
            className="rounded border-border bg-background text-rose-500 focus:ring-1 focus:ring-rose-500/20 w-4 h-4"
          />
          Publicado
        </label>
      </div>

      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-foreground">Módulos y Lecciones</h3>
            <p className="text-[10px] text-mutedForeground font-mono">
              {modulos.reduce((acc, m) => acc + m.lecciones.length, 0)} lecciones en {modulos.length} módulos
            </p>
          </div>
          <button
            type="button"
            onClick={agregarModulo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-600 dark:text-rose-400 font-mono text-[9px] uppercase tracking-wider hover:bg-rose-500/5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Añadir Módulo
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {modulos.map((modulo, mIdx) => (
            <div key={mIdx} className="border border-border rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleModule(mIdx)}
                className="w-full flex items-center gap-3 p-3 bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                {expandedModules[mIdx] ? (
                  <ChevronDown className="w-4 h-4 text-mutedForeground flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-mutedForeground flex-shrink-0" />
                )}
                <Layers className="w-3.5 h-3.5 text-rose-500/60 flex-shrink-0" />
                <input
                  type="text"
                  value={modulo.title}
                  onChange={(e) => cambiarModulo(mIdx, 'title', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-transparent border-none text-sm font-medium text-foreground focus:outline-none"
                  placeholder="Nombre del módulo"
                />
                <span className="text-[9px] text-mutedForeground font-mono">
                  {modulo.lecciones.length} lecciones
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); eliminarModulo(mIdx) }}
                  className="p-1 rounded text-mutedForeground hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </button>

              {expandedModules[mIdx] && (
                <div className="p-3 pt-0 border-t border-border space-y-3">
                  <input
                    type="text"
                    value={modulo.description}
                    onChange={(e) => cambiarModulo(mIdx, 'description', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:border-rose-500/50"
                    placeholder="Descripción del módulo (opcional)"
                  />

                  <div className="space-y-2">
                    {modulo.lecciones.map((leccion, lIdx) => {
                      const key = `${mIdx}-${lIdx}`
                      const isExpanded = expandedLessons[key] ?? false

                      return (
                        <div key={lIdx} className="border border-border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleLesson(key)}
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-muted/10 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-mutedForeground flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-mutedForeground flex-shrink-0" />
                            )}
                            {getTypeIcon(leccion.type)}
                            <input
                              type="text"
                              value={leccion.title}
                              onChange={(e) => cambiarLeccion(mIdx, lIdx, 'title', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 bg-transparent border-none text-xs text-foreground focus:outline-none"
                              placeholder="Título de la lección"
                            />
                            <span className="text-[9px] text-mutedForeground font-mono">
                              {leccion.duration}
                            </span>
                            <button
                              type="button"
                              onClick={() => cambiarLeccion(mIdx, lIdx, 'is_locked', !leccion.is_locked)}
                              className="p-0.5 rounded text-mutedForeground hover:text-rose-500 transition-all"
                            >
                              {leccion.is_locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); eliminarLeccion(mIdx, lIdx) }}
                              className="p-0.5 rounded text-mutedForeground hover:text-red-500 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </button>

                          {isExpanded && (
                            <div className="p-3 pt-0 border-t border-border space-y-3">
                              <input
                                type="text"
                                value={leccion.description}
                                onChange={(e) => cambiarLeccion(mIdx, lIdx, 'description', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:border-rose-500/50"
                                placeholder="Descripción breve de la lección..."
                              />

                              <div className="flex items-center gap-2">
                                <Video className="w-4 h-4 text-red-500/60 flex-shrink-0" />
                                <input
                                  type="text"
                                  value={leccion.video_url}
                                  onChange={(e) => cambiarLeccion(mIdx, lIdx, 'video_url', e.target.value)}
                                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:border-rose-500/50 font-mono"
                                  placeholder="URL del video (YouTube/Vimeo)"
                                />
                                <input
                                  type="text"
                                  value={leccion.video_duration}
                                  onChange={(e) => cambiarLeccion(mIdx, lIdx, 'video_duration', e.target.value)}
                                  className="w-20 px-2 py-2 rounded-lg border border-border bg-background text-foreground text-xs text-center focus:outline-none focus:border-rose-500/50 font-mono"
                                  placeholder="10:00"
                                />
                              </div>

                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-500/60 flex-shrink-0" />
                                <input
                                  type="text"
                                  value={leccion.pdf_url}
                                  onChange={(e) => cambiarLeccion(mIdx, lIdx, 'pdf_url', e.target.value)}
                                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:border-rose-500/50 font-mono"
                                  placeholder="URL del PDF descargable"
                                />
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-[9px] text-mutedForeground font-mono uppercase">Tipo:</span>
                                <select
                                  value={leccion.type}
                                  onChange={(e) => cambiarLeccion(mIdx, lIdx, 'type', e.target.value)}
                                  className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:border-rose-500/50"
                                >
                                  <option value="video">Video</option>
                                  <option value="text">Texto</option>
                                  <option value="quiz">Quiz</option>
                                  <option value="resource">Recurso</option>
                                </select>
                                <input
                                  type="text"
                                  value={leccion.duration}
                                  onChange={(e) => cambiarLeccion(mIdx, lIdx, 'duration', e.target.value)}
                                  className="w-24 px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs text-center focus:outline-none focus:border-rose-500/50 font-mono"
                                  placeholder="10 min"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
                                  Contenido de la lección
                                </label>
                                <ContentEditor
                                  content={leccion.content || ''}
                                  onChange={(content) => cambiarLeccion(mIdx, lIdx, 'content', content)}
                                  placeholder="Escribe el contenido de la lección aquí..."
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => agregarLeccion(mIdx)}
                    className="text-[9px] text-mutedForeground hover:text-rose-500 transition-colors flex items-center gap-1 font-mono"
                  >
                    <Plus className="w-3 h-3" /> Añadir Lección
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Link
          href="/admin/cursos"
          className="px-4 py-2.5 rounded-xl font-mono text-[10px] uppercase tracking-wider font-bold bg-muted/50 text-mutedForeground hover:text-foreground hover:bg-muted transition-all"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Actualizar Curso'}
        </button>
      </div>
    </form>
  )
}
