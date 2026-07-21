// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'
import { LessonPlayer, ModuleList } from '@/components/courses'
import { CertificateGenerator } from '@/components/courses/CertificateGenerator'
import { ArrowLeft, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default function VerLeccionPage() {
  const params = useParams()
  const router = useRouter()
  const { user, tenantId, loading: authLoading } = useAuth()
  const supabaseClient = createClientComponentClient()

  const [loading, setLoading] = useState(true)
  const [curso, setCurso] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [currentLesson, setCurrentLesson] = useState<any>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null)
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  useEffect(() => {
    if (params.slug && params.lessonId && tenantId) {
      cargarDatos()
    }
  }, [params.slug, params.lessonId, tenantId, user])

  async function cargarDatos() {
    try {
      setLoading(true)

      // 1. Obtener los detalles del curso validando el aislamiento por Tenant actual
      const { data: cursoData, error: cursoError } = await supabaseClient
        .from('courses')
        .select('*')
        .eq('id', params.slug)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .maybeSingle()

      if (cursoError) throw cursoError
      setCurso(cursoData)

      if (!cursoData) {
        setLoading(false)
        return
      }

      // 2. Cargar todo el plan de estudios indexado por orden
      const { data: lessonsData, error: lessonsError } = await supabaseClient
        .from('course_lessons')
        .select('*')
        .eq('course_id', params.slug)
        .order('order', { ascending: true })

      if (lessonsError) throw lessonsError
      setLessons(lessonsData || [])

      const current = lessonsData?.find(l => l.id === params.lessonId)
      setCurrentLesson(current)

      // 3. Resolver la inscripción cruzando identificadores de Auth y de Perfiles de forma segura
      if (user) {
        const { data: profileData } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('email', user.email)
          .maybeSingle()

        const idsParaBuscar = [user.id]
        if (profileData?.id) {
          idsParaBuscar.push(profileData.id)
        }

        const { data: enrollment, error: enrollError } = await supabaseClient
          .from('course_enrollments')
          .select('id, progress, user_id')
          .eq('course_id', params.slug)
          .in('user_id', idsParaBuscar)
          .eq('status', 'active')
          .maybeSingle()

        if (enrollError) throw enrollError

        if (enrollment) {
          setIsEnrolled(true)
          setProgress(enrollment.progress || 0)
          setResolvedUserId(enrollment.user_id) // Guardamos el ID exacto con el que se inscribió

          // Obtener lecciones completadas usando la llave correcta
          const { data: completed } = await supabaseClient
            .from('lesson_progress')
            .select('lesson_id')
            .eq('user_id', enrollment.user_id)
            .in('lesson_id', lessonsData?.map(l => l.id) || [])

          setCompletedLessons(completed?.map(c => c.lesson_id) || [])
        } else {
          setIsEnrolled(false)
        }
      }

    } catch (error) {
      console.error('💥 Error al inicializar reproductor de clase:', error)
    } finally {
      setLoading(false)
    }
  }

  async function marcarCompletada(lessonId: string) {
    if (!user || !resolvedUserId) return

    try {
      const { error } = await supabaseClient
        .from('lesson_progress')
        .upsert({
          user_id: resolvedUserId,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id, lesson_id'
        })

      if (error) throw error

      // Recalcular progreso en base a la lista ordenada de lecciones
      const currentIndex = lessons.findIndex(l => l.id === lessonId)
      const completedCount = lessons.slice(0, currentIndex + 1).length
      const newProgress = Math.round((completedCount / lessons.length) * 100)

      await supabaseClient
        .from('course_enrollments')
        .update({ 
          progress: newProgress, 
          updated_at: new Date().toISOString() 
        })
        .eq('course_id', params.slug)
        .eq('user_id', resolvedUserId)

      setProgress(newProgress)
      
      if (!completedLessons.includes(lessonId)) {
        setCompletedLessons([...completedLessons, lessonId])
      }

      if (newProgress === 100) {
        await generarCertificado()
      }

    } catch (error) {
      console.error('💥 Error al guardar avance de lección:', error)
    }
  }

  async function generarCertificado() {
    if (!user || !resolvedUserId || !curso) return

    try {
      const { data: existing } = await supabaseClient
        .from('course_certificates')
        .select('id')
        .eq('user_id', resolvedUserId)
        .eq('course_id', curso.id)
        .maybeSingle()

      if (existing) return

      const certNumber = `FN-${Date.now().toString().slice(-6)}-${resolvedUserId.slice(0, 4)}`

      await supabaseClient
        .from('course_certificates')
        .insert([{
          user_id: resolvedUserId,
          course_id: curso.id,
          certificate_number: certNumber
        }])

    } catch (error) {
      console.error('💥 Error en la emisión del certificado automático:', error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!curso || !isEnrolled) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3 antialiased">
        <GraduationCap className="w-12 h-12 text-mutedForeground/30" />
        <p className="text-sm font-bold font-mono uppercase tracking-wide text-foreground">Acceso no autorizado</p>
        <p className="text-xs text-mutedForeground max-w-xs text-center">Para poder visualizar las clases y materiales adjuntos necesitas tener una inscripción activa.</p>
        <Link
          href={`/cursos/${params.slug}`}
          className="mt-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-[10px] uppercase tracking-wider font-bold transition-all shadow-md shadow-rose-600/10"
        >
          Ir a la presentación
        </Link>
      </div>
    )
  }

  if (!currentLesson) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3 antialiased">
        <p className="text-sm font-bold font-mono uppercase tracking-wide text-foreground">Clase no disponible</p>
        <p className="text-xs text-mutedForeground text-center">La lección solicitada no pertenece al plan de estudios actual.</p>
        <Link
          href={`/cursos/${params.slug}`}
          className="mt-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-mono text-[10px] uppercase tracking-wider font-bold transition-all border border-border"
        >
          Volver al índice
        </Link>
      </div>
    )
  }

  const currentIndex = lessons.findIndex(l => l.id === params.lessonId)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < lessons.length - 1

  const handlePrevious = () => {
    if (hasPrevious) {
      router.push(`/cursos/${params.slug}/lecciones/${lessons[currentIndex - 1].id}`)
    }
  }

  const handleNext = () => {
    if (hasNext) {
      router.push(`/cursos/${params.slug}/lecciones/${lessons[currentIndex + 1].id}`)
    }
  }

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

  const modules = Array.from(modulesMap.entries()).map(([title, lecciones]) => ({
    title,
    lecciones
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 antialiased">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar de Progreso Estructurado */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="sticky top-4 space-y-4">
            <Link
              href={`/cursos/${params.slug}`}
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-mutedForeground hover:text-foreground transition-colors font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-rose-500" /> Volver al índice
            </Link>

            {/* Panel de Avance */}
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-foreground truncate uppercase font-mono tracking-wide">{curso?.title}</h3>
                  <p className="text-[10px] text-mutedForeground font-mono mt-0.5">COMPLETADO: {progress}%</p>
                </div>
              </div>

              <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Certificaciones Automáticas */}
            {progress === 100 && curso && user && resolvedUserId && (
              <div className="p-1 rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
                <CertificateGenerator
                  courseId={curso.id}
                  courseTitle={curso.title}
                  userId={resolvedUserId}
                  userName={user.email || 'Estudiante'}
                  progress={progress}
                />
              </div>
            )}

            {/* Listado de Módulos */}
            <div className="p-3 rounded-2xl bg-card border border-border shadow-sm max-h-[60vh] overflow-y-auto scrollbar-none">
              <ModuleList
                modules={modules}
                currentLessonId={currentLesson.id}
                onLessonClick={(id) => {
                  router.push(`/cursos/${params.slug}/lecciones/${id}`)
                }}
              />
            </div>
          </div>
        </div>

        {/* Reproductor Central e Información Didáctica */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden p-4 md:p-6">
            <LessonPlayer
              lesson={{
                ...currentLesson,
                is_completed: completedLessons.includes(currentLesson.id)
              }}
              onComplete={() => marcarCompletada(currentLesson.id)}
              onPrevious={handlePrevious}
              onNext={handleNext}
              hasPrevious={hasPrevious}
              hasNext={hasNext}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
