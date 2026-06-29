'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'
import { ContentEditor, ImageUploader } from '@/components/courses'
import { 
  ArrowLeft, Save, X, Plus, Trash2, 
  Layers, Video, FileText, Award, Lock, Unlock,
  ChevronDown, ChevronRight, GraduationCap, Clock, HelpCircle
} from 'lucide-react'
import Link from 'next/link'

interface Leccion {
  title: string
  description: string
  content: string
  video_url: string
  video_duration: string
  pdf_url: string
  is_locked: boolean
  type: 'video' | 'text' | 'quiz' | 'resource'
  duration: string
}

interface Modulo {
  title: string
  description: string
  lecciones: Leccion[]
}

export default function CrearCursoPage() {
  const router = useRouter()
  const { tenantId, user, role, loading: authLoading } = useAuth()
  const supabaseClient = createClientComponentClient()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Datos de control del curso
  const [cursoData, setCursoData] = useState({
    title: '',
    instructor: '',
    description: '',
    image_url: '',
    level: 'beginner',
    category: '',
    is_active: true
  })

  // Módulos y lecciones iniciales
  const [modulos, setModulos] = useState<Modulo[]>([
    {
      title: 'Módulo 1: Fundamentos',
      description: '',
      lecciones: [
        {
          title: 'Introducción al curso',
          description: 'Bienvenida y presentación',
          content: '<p>Bienvenidos al curso. En esta lección aprenderemos los fundamentos.</p>',
          video_url: '',
          video_duration: '10:00',
          pdf_url: '',
          is_locked: false,
          type: 'video',
          duration: '10 min'
        }
      ]
    }
  ])

  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({ 0: true })
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({ '0-0': true })

  const toggleModule = (idx: number) => {
    setExpandedModules(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  const toggleLesson = (id: string) => {
    setExpandedLessons(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Operaciones sobre Módulos
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

  // Operaciones sobre Lecciones con inyección de tipo rápido
  const agregarLeccionConTipo = (moduloIdx: number, type: 'video' | 'text' | 'quiz' | 'resource') => {
    const nuevos = [...modulos]
    const labels = { video: 'Nueva Video-Clase', text: 'Nueva Lectura', quiz: 'Nueva Evaluación', resource: 'Nuevo Recurso' }
    
    const newLesson: Leccion = {
      title: labels[type],
      description: '',
      content: '',
      video_url: '',
      video_duration: type === 'video' ? '15:00' : '00:00',
      pdf_url: '',
      is_locked: false,
      type,
      duration: type === 'video' ? '15 min' : '5 min'
    }
    
    nuevos[moduloIdx].lecciones.push(newLesson)
    setModulos(nuevos)
    
    // Forzar la expansión automática tanto del módulo como de la nueva lección
    setExpandedModules(prev => ({ ...prev, [moduloIdx]: true }))
    const key = `${moduloIdx}-${nuevos[moduloIdx].lecciones.length - 1}`
    setExpandedLessons(prev => ({ ...prev, [key]: true }))
  }

  const eliminarLeccion = (moduloIdx: number, leccionIdx: number) => {
    const nuevos = [...modulos]
    nuevos[moduloIdx].lecciones = nuevos[moduloIdx].lecciones.filter((_, i) => i !== leccionIdx)
    setModulos(nuevos)
  }

  const cambiarLeccion = (moduloIdx: number, leccionIdx: number, field: keyof Leccion, value: any) => {
    const nuevos = [...modulos]
    nuevos[moduloIdx].lecciones[leccionIdx] = {
      ...nuevos[moduloIdx].lecciones[leccionIdx],
      [field]: value
    }
    setModulos(nuevos)
  }

  const getTypeStyle = (type: string) => {
    switch(type) {
      case 'video': return { icon: <Video className="w-3.5 h-3.5" />, classes: 'bg-rose-500/10 text-rose-500 border-rose-500/20' }
      case 'text': return { icon: <FileText className="w-3.5 h-3.5" />, classes: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' }
      case 'quiz': return { icon: <Award className="w-3.5 h-3.5" />, classes: 'bg-amber-500/10 text-amber-500 border-amber-500/20' }
      default: return { icon: <HelpCircle className="w-3.5 h-3.5" />, classes: 'bg-blue-500/10 text-blue-500 border-blue-500/20' }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    if (!tenantId) {
      setError('❌ Operación cancelada: No se detecta un identificador Tenant válido en tu sesión.')
      setSaving(false)
      return
    }

    if (!cursoData.title.trim() || !cursoData.instructor.trim()) {
      setError('❌ Campos requeridos vacíos: El título y el instructor son campos obligatorios.')
      setSaving(false)
      return
    }

    const tieneLecciones = modulos.some(m => m.lecciones.length > 0)
    if (!tieneLecciones) {
      setError('❌ Estructura inválida: Debes agregar al menos una lección dentro del esquema curricular.')
      setSaving(false)
      return
    }

    try {
      const cursoPayload = {
        title: cursoData.title.trim(),
        instructor: cursoData.instructor.trim(),
        description: cursoData.description || '',
        image_url: cursoData.image_url || null,
        level: cursoData.level || 'beginner',
        category: cursoData.category || '',
        is_active: cursoData.is_active,
        tenant_id: tenantId,
        updated_at: new Date().toISOString()
      }

      const { data: curso, error: cursoError } = await supabaseClient
        .from('courses')
        .insert([cursoPayload])
        .select()
        .single()

      if (cursoError) throw cursoError

      let orderIndex = 0
      const allLecciones: any[] = []

      modulos.forEach((modulo) => {
        modulo.lecciones.forEach((leccion) => {
          allLecciones.push({
            course_id: curso.id,
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
            order: orderIndex++
          })
        })
      })

      if (allLecciones.length > 0) {
        const { error: lessonsError } = await supabaseClient
          .from('course_lessons')
          .insert(allLecciones)

        if (lessonsError) throw lessonsError
      }

      setSuccess('✅ Curso e infraestructura de lecciones creados con éxito.')
      setTimeout(() => {
        router.push('/admin/cursos')
      }, 1500)

    } catch (err: any) {
      console.error('💥 Error catastrófico en la transacción:', err)
      setError(`❌ Error de persistencia: ${err.message || 'Error del servidor de base de datos'}`)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 antialiased">
      {/* Header Corporativo Adaptativo */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500/[0.05] via-card to-card border border-rose-500/20 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/cursos"
              className="p-2 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors text-mutedForeground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 font-mono">🎓 Gestión de Academia</p>
              <h2 className="text-2xl font-serif italic text-foreground mt-1">Crear Nuevo Curso</h2>
              <p className="text-xs text-mutedForeground mt-1">Configura la información general, módulos curriculares y material didáctico</p>
              
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[9px] font-mono opacity-80">
                <span className="text-mutedForeground">Tenant:</span>
                <span className={tenantId ? 'text-emerald-500' : 'text-rose-500'}>
                  {tenantId ? `✅ ${tenantId.slice(0, 8)}...` : '❌ Sin tenant'}
                </span>
                <span className="text-mutedForeground">Operador:</span>
                <span className="text-amber-500 uppercase font-bold">{role || 'No verificado'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <Link
              href="/admin/cursos"
              className="px-4 py-2.5 rounded-xl border border-border text-mutedForeground hover:text-foreground text-xs font-mono font-bold uppercase tracking-wider bg-card hover:bg-muted/40 transition-all"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg shadow-rose-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Crear Curso'}
            </button>
          </div>
        </div>
      </div>

      {/* Alertas Remotas */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 p-3 rounded-xl text-xs font-mono">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 p-3 rounded-xl text-xs font-mono">
          {success}
        </div>
      )}

      {/* Panel: Datos del Curso */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <GraduationCap className="w-4 h-4 text-rose-500" />
          <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider">Información del Catálogo</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
              Título del Contenido <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              value={cursoData.title}
              onChange={e => setCursoData({...cursoData, title: e.target.value})}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-rose-500/50 transition-all"
              placeholder="Ej. Master en Estructuras de Gel Avanzado"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
              Instructor asignado <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              value={cursoData.instructor}
              onChange={e => setCursoData({...cursoData, instructor: e.target.value})}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-rose-500/50 transition-all"
              placeholder="Ej. Yuliana Silva"
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
              Sinopsis y Objetivos
            </label>
            <textarea
              value={cursoData.description}
              onChange={e => setCursoData({...cursoData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-rose-500/50 transition-all resize-none"
              placeholder="Describe detalladamente los alcances teóricos y prácticos de este programa..."
            />
          </div>
          
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
              Imagen Ilustrativa de Portada
            </label>
            <ImageUploader
              value={cursoData.image_url}
              onChange={(url) => setCursoData({...cursoData, image_url: url})}
              folder="courses"
              label="Subir imagen de portada"
            />
            {cursoData.image_url && (
              <p className="text-[9px] text-mutedForeground font-mono truncate bg-muted/40 p-2 rounded-lg border border-border mt-1">
                Asset URL: {cursoData.image_url}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
              Complejidad del Nivel
            </label>
            <select
              value={cursoData.level}
              onChange={e => setCursoData({...cursoData, level: e.target.value})}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-rose-500/50 transition-all"
            >
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <label className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-mutedForeground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={cursoData.is_active}
              onChange={e => setCursoData({...cursoData, is_active: e.target.checked})}
              className="rounded border-border bg-background text-rose-500 focus:ring-1 focus:ring-rose-500/20 w-4 h-4 transition-all"
            />
            Publicar inmediatamente en el catálogo activo
          </label>
        </div>
      </div>

      {/* Constructor Espectacular de Estructura Curricular */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider">Estructura Curricular</h3>
            <p className="text-[10px] text-mutedForeground font-mono mt-0.5">
              {modulos.reduce((acc, m) => acc + m.lecciones.length, 0)} lecciones consolidadas en {modulos.length} módulos
            </p>
          </div>
          <button
            type="button"
            onClick={agregarModulo}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-[10px] uppercase tracking-wider font-bold transition-all shadow-md shadow-rose-600/10 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" /> Añadir Módulo
          </button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {modulos.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-2xl border-border bg-muted/5">
              <Layers className="w-10 h-10 text-mutedForeground/30 mx-auto mb-2" />
              <p className="text-xs font-bold font-mono uppercase tracking-wide text-foreground">Tu plan de estudios está vacío</p>
              <p className="text-[11px] text-mutedForeground mt-0.5">Haz clic en "Añadir Módulo" para comenzar a armar el índice.</p>
            </div>
          ) : (
            modulos.map((modulo, mIdx) => (
              <div 
                key={mIdx} 
                className="group border border-border/80 rounded-2xl bg-background overflow-hidden shadow-sm transition-all duration-200 hover:border-rose-500/30"
              >
                {/* Encabezado Visual del Módulo */}
                <div className="flex items-center justify-between p-4 bg-muted/20 gap-4 border-b border-border/40">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleModule(mIdx)}
                      className="p-1.5 rounded-lg hover:bg-muted text-mutedForeground transition-colors shrink-0"
                    >
                      {expandedModules[mIdx] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <Layers className="w-4 h-4 text-rose-500/70 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={modulo.title}
                        onChange={(e) => cambiarModulo(mIdx, 'title', e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground focus:ring-0 focus:outline-none focus:border-b focus:border-rose-500/50"
                        placeholder="Título del módulo..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Selectores Rápidos Flotantes para inyección de clases */}
                    <div className="hidden md:flex items-center gap-1 border border-border bg-card rounded-xl p-1 text-[9px] font-mono font-bold uppercase tracking-wider text-mutedForeground mr-2 shadow-sm">
                      <button
                        type="button"
                        onClick={() => agregarLeccionConTipo(mIdx, 'video')}
                        className="px-2 py-1 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 transition-colors flex items-center gap-1"
                      >
                        <Video className="w-3 h-3" /> +Video
                      </button>
                      <button
                        type="button"
                        onClick={() => agregarLeccionConTipo(mIdx, 'text')}
                        className="px-2 py-1 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" /> +Texto
                      </button>
                      <button
                        type="button"
                        onClick={() => agregarLeccionConTipo(mIdx, 'quiz')}
                        className="px-2 py-1 rounded-lg hover:bg-amber-500/10 hover:text-amber-500 transition-colors flex items-center gap-1"
                      >
                        <Award className="w-3 h-3" /> +Quiz
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => eliminarModulo(mIdx)}
                      className="p-1.5 rounded-xl hover:bg-rose-500/10 text-mutedForeground hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Selectores móviles rápidos */}
                {expandedModules[mIdx] && (
                  <div className="md:hidden flex justify-around p-2 bg-muted/10 border-b border-border/40 text-[9px] font-mono font-bold uppercase tracking-wider text-mutedForeground">
                    <button type="button" onClick={() => agregarLeccionConTipo(mIdx, 'video')} className="flex items-center gap-1"><Video className="w-3 h-3 text-rose-500" /> +Video</button>
                    <button type="button" onClick={() => agregarLeccionConTipo(mIdx, 'text')} className="flex items-center gap-1"><FileText className="w-3 h-3 text-emerald-500" /> +Texto</button>
                    <button type="button" onClick={() => agregarLeccionConTipo(mIdx, 'quiz')} className="flex items-center gap-1"><Award className="w-3 h-3 text-amber-500" /> +Quiz</button>
                  </div>
                )}

                {/* Bloque Interno Expandido del Módulo */}
                {expandedModules[mIdx] && (
                  <div className="p-4 bg-card/30 space-y-4">
                    <input
                      type="text"
                      value={modulo.description}
                      onChange={(e) => cambiarModulo(mIdx, 'description', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-rose-500/50"
                      placeholder="Descripción resumida de los objetivos del módulo..."
                    />

                    {/* Canvas didáctico de Lecciones */}
                    <div className="space-y-3 pl-2 border-l-2 border-border/60">
                      {modulo.lecciones.length === 0 ? (
                        <p className="text-center py-6 text-xs italic text-mutedForeground">No hay lecciones añadidas a este bloque todavía.</p>
                      ) : (
                        modulo.lecciones.map((leccion, lIdx) => {
                          const key = `${mIdx}-${lIdx}`
                          const isExpanded = expandedLessons[key] ?? false
                          const badge = getTypeStyle(leccion.type)

                          return (
                            <div key={lIdx} className="border border-border rounded-xl bg-background overflow-hidden shadow-sm">
                              {/* Barra de Lección de estética minimalista */}
                              <div className="flex items-center justify-between p-3 gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => toggleLesson(key)}
                                    className="p-1 rounded-lg hover:bg-muted text-mutedForeground transition-colors shrink-0"
                                  >
                                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                  </button>

                                  <div className={`p-1.5 rounded-lg border shrink-0 ${badge.classes}`}>
                                    {badge.icon}
                                  </div>

                                  <span className="text-[10px] font-mono text-mutedForeground shrink-0 w-5">
                                    {String(lIdx + 1).padStart(2, '0')}
                                  </span>

                                  <input
                                    type="text"
                                    value={leccion.title}
                                    onChange={(e) => cambiarLeccion(mIdx, lIdx, 'title', e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-xs text-foreground focus:ring-0 focus:outline-none focus:border-b focus:border-rose-500/30 font-medium"
                                    placeholder="Título específico de la lección..."
                                  />
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {/* Tiempo Estimado Inline */}
                                  <div className="flex items-center gap-1 border border-border rounded-lg px-2 py-1 bg-muted/10">
                                    <Clock className="w-3 h-3 text-mutedForeground" />
                                    <input
                                      type="text"
                                      value={leccion.duration}
                                      onChange={(e) => cambiarLeccion(mIdx, lIdx, 'duration', e.target.value)}
                                      className="w-12 bg-transparent border-none p-0 text-[10px] font-mono text-mutedForeground text-center focus:ring-0 focus:outline-none"
                                      placeholder="15 min"
                                    />
                                  </div>

                                  {/* Candado de Privacidad */}
                                  <button
                                    type="button"
                                    onClick={() => cambiarLeccion(mIdx, lIdx, 'is_locked', !leccion.is_locked)}
                                    className={`p-1.5 rounded-xl transition-all ${leccion.is_locked ? 'text-amber-500 bg-amber-500/5' : 'text-mutedForeground hover:bg-muted'}`}
                                  >
                                    {leccion.is_locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => eliminarLeccion(mIdx, lIdx)}
                                    className="p-1.5 rounded-xl text-mutedForeground hover:text-rose-500 hover:bg-rose-500/5 transition-all"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Formulario de Detalle Avanzado de la Lección */}
                              {isExpanded && (
                                <div className="p-4 border-t border-border bg-muted/10 space-y-4">
                                  <div className="space-y-1">
                                    <label className="block text-[9px] font-mono uppercase tracking-wider text-mutedForeground">Descripción Corta</label>
                                    <input
                                      type="text"
                                      value={leccion.description}
                                      onChange={(e) => cambiarLeccion(mIdx, lIdx, 'description', e.target.value)}
                                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-rose-500/50"
                                      placeholder="Describe brevemente lo que el alumno asimilará..."
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-2 space-y-1">
                                      <label className="block text-[9px] font-mono uppercase tracking-wider text-mutedForeground">Streaming Video URL</label>
                                      <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-2.5 py-1 focus-within:border-rose-500/50 transition-all">
                                        <Video className="w-3.5 h-3.5 text-mutedForeground shrink-0" />
                                        <input
                                          type="text"
                                          value={leccion.video_url}
                                          onChange={(e) => cambiarLeccion(mIdx, lIdx, 'video_url', e.target.value)}
                                          className="w-full bg-transparent border-none text-xs text-foreground outline-none focus:ring-0 font-mono py-1"
                                          placeholder="https://youtube.com/vimeo-link"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="block text-[9px] font-mono uppercase tracking-wider text-mutedForeground">Duración del Video</label>
                                      <input
                                        type="text"
                                        value={leccion.video_duration}
                                        onChange={(e) => cambiarLeccion(mIdx, lIdx, 'video_duration', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs text-center font-mono focus:outline-none focus:border-rose-500/50"
                                        placeholder="MM:SS (Ej: 12:45)"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <label className="block text-[9px] font-mono uppercase tracking-wider text-mutedForeground">Documento Adjunto (PDF)</label>
                                      <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-2.5 py-1 focus-within:border-rose-500/50 transition-all">
                                        <FileText className="w-3.5 h-3.5 text-mutedForeground shrink-0" />
                                        <input
                                          type="text"
                                          value={leccion.pdf_url}
                                          onChange={(e) => cambiarLeccion(mIdx, lIdx, 'pdf_url', e.target.value)}
                                          className="w-full bg-transparent border-none text-xs text-foreground outline-none focus:ring-0 font-mono py-1"
                                          placeholder="Enlace o CDN al archivo descargable de soporte"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <label className="block text-[9px] font-mono uppercase tracking-wider text-mutedForeground">Naturaleza didáctica</label>
                                      <select
                                        value={leccion.type}
                                        onChange={(e) => cambiarLeccion(mIdx, lIdx, 'type', e.target.value as any)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-rose-500/50 transition-all"
                                      >
                                        <option value="video">Formativo: Video</option>
                                        <option value="text">Formativo: Texto / Lectura</option>
                                        <option value="quiz">Evaluativo: Cuestionario (Quiz)</option>
                                        <option value="resource">Material complementario</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Editor de apuntes */}
                                  <div className="space-y-1.5 pt-2">
                                    <label className="block text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
                                      Apuntes y Cuerpo Técnico de la Lección
                                    </label>
                                    <ContentEditor
                                      content={leccion.content || ''}
                                      onChange={(content) => cambiarLeccion(mIdx, lIdx, 'content', content)}
                                      placeholder="Redacta la guía paso a paso, código de referencia o apuntes de la clase aquí..."
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Botón clásico alternativo en el pie de módulo */}
                    <div className="pt-2 border-t border-border/40 flex justify-start">
                      <button
                        type="button"
                        onClick={() => agregarLeccionConTipo(mIdx, 'video')}
                        className="inline-flex items-center gap-1.5 text-[9px] text-rose-600 dark:text-rose-400 font-mono uppercase tracking-wider font-bold hover:underline"
                      >
                        <Plus className="w-3 h-3" /> Añadir Clase base
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer de Acciones */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Link
          href="/admin/cursos"
          className="px-4 py-2.5 rounded-xl font-mono text-[10px] uppercase tracking-wider font-bold bg-muted/40 border border-border text-mutedForeground hover:text-foreground hover:bg-muted/80 transition-all"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-gradient-to-r text-white shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Crear Curso'}
        </button>
      </div>
    </form>
  )
}