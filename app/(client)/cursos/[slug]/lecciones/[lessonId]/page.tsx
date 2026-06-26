'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { LessonPlayer, ModuleList } from '@/components/courses'
import { CertificateGenerator } from '@/components/courses/CertificateGenerator'
import { ArrowLeft, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default function VerLeccionPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [curso, setCurso] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [currentLesson, setCurrentLesson] = useState<any>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  useEffect(() => {
    if (params.slug && params.lessonId) {
      cargarDatos()
    }
  }, [params.slug, params.lessonId])

  async function cargarDatos() {
    try {
      setLoading(true)

      // Obtener perfil del usuario
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (profileData) {
          setProfileId(profileData.id)
        }
      }

      // Obtener curso
      const { data: cursoData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', params.slug)
        .single()

      setCurso(cursoData)

      // Obtener lecciones
      const { data: lessonsData } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('course_id', params.slug)
        .order('order', { ascending: true })

      setLessons(lessonsData || [])

      // Lección actual
      const current = lessonsData?.find(l => l.id === params.lessonId)
      setCurrentLesson(current)

      // Verificar inscripción y progreso
      if (user && profileId) {
        const { data: enrollment } = await supabase
          .from('course_enrollments')
          .select('id, progress')
          .eq('course_id', params.slug)
          .eq('user_id', profileId)
          .maybeSingle()

        setIsEnrolled(!!enrollment)
        setProgress(enrollment?.progress || 0)

        // Obtener lecciones completadas
        const { data: completed } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', profileId)
          .in('lesson_id', lessonsData?.map(l => l.id) || [])

        setCompletedLessons(completed?.map(c => c.lesson_id) || [])
      }

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function marcarCompletada(lessonId: string) {
    if (!user || !profileId) return

    try {
      // Marcar lección como completada
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: profileId,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id, lesson_id'
        })

      if (error) throw error

      // Actualizar progreso total
      const currentIndex = lessons.findIndex(l => l.id === lessonId)
      const completedCount = lessons.slice(0, currentIndex + 1).length
      const newProgress = Math.round((completedCount / lessons.length) * 100)

      // Actualizar enrollment
      await supabase
        .from('course_enrollments')
        .update({ 
          progress: newProgress, 
          updated_at: new Date().toISOString() 
        })
        .eq('course_id', params.slug)
        .eq('user_id', profileId)

      setProgress(newProgress)
      setCompletedLessons([...completedLessons, lessonId])

      // ✅ Si completó el 100%, generar certificado automáticamente
      if (newProgress === 100) {
        await generarCertificado()
      }

    } catch (error) {
      console.error('Error marking lesson complete:', error)
    }
  }

  async function generarCertificado() {
    if (!user || !profileId || !curso) return

    try {
      // Verificar si ya tiene certificado
      const { data: existing } = await supabase
        .from('course_certificates')
        .select('id')
        .eq('user_id', profileId)
        .eq('course_id', curso.id)
        .maybeSingle()

      if (existing) return

      // Generar certificado
      const certNumber = `FN-${Date.now().toString().slice(-6)}-${profileId.slice(0, 4)}`

      await supabase
        .from('course_certificates')
        .insert([{
          user_id: profileId,
          course_id: curso.id,
          certificate_number: certNumber
        }])

      console.log('✅ Certificado generado!')

    } catch (error) {
      console.error('Error generando certificado:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isEnrolled) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <GraduationCap className="w-16 h-16 text-mutedForeground/30" />
        <p className="text-lg font-serif italic text-foreground">No estás inscrito en este curso</p>
        <Link
          href={`/cursos/${params.slug}`}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-all"
        >
          Ver curso
        </Link>
      </div>
    )
  }

  if (!currentLesson) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-lg font-serif italic text-foreground">Lección no encontrada</p>
        <Link
          href={`/cursos/${params.slug}`}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-all"
        >
          Volver al curso
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

  // Agrupar lecciones por módulo
  const modulesMap = new Map()
  lessons.forEach((lesson: any) => {
    if (!modulesMap.has(lesson.module_title)) {
      modulesMap.set(lesson.module_title, [])
    }
    modulesMap.get(lesson.module_title).push({
      ...lesson,
      is_completed: completedLessons.includes(lesson.id)
    })
  })

  const modules = Array.from(modulesMap.entries()).map(([title, lecciones]) => ({
    title,
    lecciones
  }))

  const totalLessons = lessons.length
  const completedCount = completedLessons.length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <Link
              href={`/cursos/${params.slug}`}
              className="inline-flex items-center gap-1.5 text-[10px] text-mutedForeground hover:text-foreground transition-colors font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al curso
            </Link>

            {/* Barra de progreso */}
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">{curso?.title}</h3>
                  <p className="text-xs text-mutedForeground">Progreso: {progress}%</p>
                </div>
              </div>

              <div className="mt-3 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* ✅ CERTIFICADO - se muestra cuando el progreso es 100% */}
            {progress === 100 && curso && user && profileId && (
              <div className="p-4 rounded-2xl bg-card border border-border">
                <CertificateGenerator
                  courseId={curso.id}
                  courseTitle={curso.title}
                  userId={profileId}
                  userName={user.email || 'Estudiante'}
                  progress={progress}
                />
              </div>
            )}

            {/* Módulos */}
            <div className="p-4 rounded-2xl bg-card border border-border max-h-[50vh] overflow-y-auto">
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

        {/* Contenido de la lección */}
        <div className="lg:col-span-3">
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
  )
}
