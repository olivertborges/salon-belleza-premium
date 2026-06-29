'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'
import { EnrollButton } from '@/components/courses/EnrollButton'
import { 
  GraduationCap, User, Award, Layers, 
  Lock, CheckCircle, ChevronRight, Play
} from 'lucide-react'
import Link from 'next/link'

export default function VerCursoPage() {
  const params = useParams()
  const router = useRouter()
  const { user, tenantId, loading: authLoading } = useAuth()
  const supabaseClient = createClientComponentClient()

  const [curso, setCurso] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  const [completedLessons, setCompletedLessons] = useState<string[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (params.slug && tenantId) {
      cargarCurso()
    } else if (!params.slug) {
      setLoading(false)
    }
  }, [params.slug, tenantId, user, refreshKey])

  async function cargarCurso() {
    try {
      setLoading(true)
      
      // 1. Validar y cargar los datos esenciales del curso aislados por Tenant
      const { data: cursoData, error: cursoError } = await supabaseClient
        .from('courses')
        .select('*')
        .eq('id', params.slug)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .maybeSingle()

      if (cursoError) throw cursoError
      
      if (!cursoData) {
        setCurso(null)
        return
      }
      setCurso(cursoData)

      // 2. Traer el plan de estudios estructurado del curso
      const { data: lessonsData, error: lessonsError } = await supabaseClient
        .from('course_lessons')
        .select('*')
        .eq('course_id', params.slug)
        .order('order', { ascending: true })

      if (lessonsError) throw lessonsError
      setLessons(lessonsData || [])

      // 3. Resolver el ID del perfil usando el email de la sesión y buscar la inscripción
      if (user?.email) {
        const { data: profileData } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('email', user.email)
          .maybeSingle()

        if (profileData) {
          const { data: enrollment } = await supabaseClient
            .from('course_enrollments')
            .select('id, progress')
            .eq('course_id', params.slug)
            .eq('user_id', profileData.id) // Volvemos a vincular usando el ID de la tabla profiles
            .maybeSingle()

          setIsEnrolled(!!enrollment)
          setProgress(enrollment?.progress || 0)

          if (enrollment && lessonsData && lessonsData.length > 0) {
            const { data: completed } = await supabaseClient
              .from('lesson_progress')
              .select('lesson_id')
              .eq('user_id', profileData.id)
              .in('lesson_id', lessonsData.map(l => l.id))

            setCompletedLessons(completed?.map(c => c.lesson_id) || [])
          }
        }
      }

    } catch (error) {
      console.error('💥 Error al inicializar vista detallada de programa:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  const getModules = () => {
    const modulesMap = new Map()
    lessons.forEach((lesson: any) => {
      const moduleTitle = lesson.module_title || 'Módulo 1'
      if (!modulesMap.has(moduleTitle)) {
        modulesMap.set(moduleTitle, [])
      }
      modulesMap.get(moduleTitle).push({
        ...lesson,
        is_completed: completedLessons.includes(lesson.id)
      })
    })
    return Array.from(modulesMap.entries()).map(([title, lecciones]) => ({
      title,
      lecciones
    }))
  }

  const modules = getModules()

  if (authLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!curso) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3 antialiased">
        <GraduationCap className="w-12 h-12 text-mutedForeground/30" />
        <p className="text-sm font-bold font-mono uppercase tracking-wide text-foreground">Programa no encontrado</p>
        <p className="text-xs text-mutedForeground max-w-xs text-center">El curso solicitado no existe o no se encuentra activo dentro de esta academia.</p>
      </div>
    )
  }

  const completedCount = completedLessons.length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 antialiased">
      {/* Hero o Banner del Programa */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-950/10 via-card to-card border border-rose-500/20 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start">
          
          <div className="w-full lg:w-1/3 shrink-0">
            <div className="aspect-video rounded-xl overflow-hidden bg-muted/40 border border-border/40 shadow-sm">
              {curso.image_url ? (
                <img src={curso.image_url} alt={curso.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <GraduationCap className="w-16 h-16 text-mutedForeground/20" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider border ${
                curso.level === 'beginner' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                curso.level === 'intermediate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-rose-500/10 text-rose-500 border-rose-500/20'
              }`}>
                {curso.level === 'beginner' ? 'Principiante' :
                 curso.level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-serif italic text-foreground leading-tight">{curso.title}</h1>
              <p className="text-xs text-mutedForeground flex items-center gap-1.5 mt-2 font-medium">
                <User className="w-3.5 h-3.5 text-rose-500/70" />
                Instructor: {curso.instructor}
              </p>
            </div>

            {curso.description && (
              <p className="text-xs text-mutedForeground leading-relaxed max-w-3xl">{curso.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-[10px] text-mutedForeground font-mono border-t border-border/50 pt-4">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-rose-500" />
                {lessons.length > 0 ? `${lessons.length} LECCIONES` : 'SIN CONTENIDO DISPONIBLE'}
              </span>
              {isEnrolled && (
                <>
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    PROGRESO: {progress}%
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    {completedCount} COMPLETADAS
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
              <EnrollButton 
                courseId={curso.id} 
                onEnroll={handleEnrollSuccess}
              />

              {isEnrolled && lessons.length > 0 && (
                <Link
                  href={`/cursos/${curso.id}/lecciones/${lessons[0].id}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-[10px] uppercase tracking-wider font-bold transition-all shadow-md shadow-rose-600/10"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Comenzar a aprender
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Secciones del plan de estudio dependiendo de la inscripción */}
      {isEnrolled && lessons.length > 0 && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <h2 className="text-xl font-serif italic text-foreground">Contenido del Curso</h2>
          
          <div className="space-y-4">
            {modules.map((module, mIdx) => (
              <div key={mIdx} className="border border-border/80 rounded-xl overflow-hidden bg-muted/5">
                <div className="p-3 bg-muted/30 border-b border-border/80">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wide text-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-rose-500" />
                    {module.title}
                  </h3>
                </div>
                <div className="divide-y divide-border/60">
                  {module.lecciones.map((lesson: any, lIdx: number) => (
                    <Link
                      key={lesson.id}
                      href={`/cursos/${curso.id}/lecciones/${lesson.id}`}
                      className="flex items-center gap-4 p-3.5 hover:bg-muted/30 transition-colors group"
                    >
                      <span className="w-6 text-xs text-mutedForeground font-mono text-center">
                        {String(lIdx + 1).padStart(2, '0')}
                      </span>
                      
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground group-hover:text-rose-500 transition-colors">{lesson.title}</p>
                        <p className="text-[10px] text-mutedForeground font-mono uppercase mt-0.5 tracking-wider">
                          {lesson.type || 'video'} • {lesson.duration || '10 min'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {lesson.is_completed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : lesson.is_locked ? (
                          <Lock className="w-4 h-4 text-mutedForeground/40" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-mutedForeground group-hover:translate-x-0.5 transition-transform" />
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isEnrolled && lessons.length === 0 && (
        <div className="p-12 border border-dashed rounded-3xl border-border bg-muted/10 text-center max-w-xl mx-auto">
          <GraduationCap className="w-12 h-12 text-mutedForeground/30 mx-auto mb-3" />
          <p className="text-sm font-bold font-mono uppercase tracking-wide text-foreground">Estructura en preparación</p>
          <p className="text-xs text-mutedForeground mt-1">El material didáctico de este programa se está terminando de procesar. ¡Vuelve pronto!</p>
        </div>
      )}

      {!isEnrolled && (
        <div className="p-12 border border-dashed rounded-3xl border-border bg-muted/10 text-center max-w-xl mx-auto">
          <Lock className="w-12 h-12 text-mutedForeground/30 mx-auto mb-3" />
          <p className="text-sm font-bold font-mono uppercase tracking-wide text-foreground">Contenido restringido</p>
          <p className="text-xs text-mutedForeground mt-1">Para revisar el plan de estudios pormenorizado y las clases de este programa debes estar inscrito.</p>
        </div>
      )}
    </div>
  )
}
