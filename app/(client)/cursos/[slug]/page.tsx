'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { EnrollButton } from '@/components/courses/EnrollButton'
import { CertificateGenerator } from '@/components/courses/CertificateGenerator'
import { 
  GraduationCap, User, BookOpen, Clock, Award, Layers, 
  Video, Lock, CheckCircle, ChevronRight, Play
} from 'lucide-react'
import Link from 'next/link'

export default function VerCursoPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [curso, setCurso] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  useEffect(() => {
    if (params.slug) {
      cargarCurso()
    }
  }, [params.slug])

  async function cargarCurso() {
    try {
      setLoading(true)
      
      const { data: cursoData, error: cursoError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', params.slug)
        .eq('is_active', true)
        .single()

      if (cursoError) throw cursoError
      setCurso(cursoData)

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('course_id', params.slug)
        .order('order', { ascending: true })

      if (lessonsError) throw lessonsError
      setLessons(lessonsData || [])

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (profileData) {
          setProfileId(profileData.id)
          
          const { data: enrollment } = await supabase
            .from('course_enrollments')
            .select('id, progress')
            .eq('course_id', params.slug)
            .eq('user_id', profileData.id)
            .maybeSingle()

          setIsEnrolled(!!enrollment)
          setProgress(enrollment?.progress || 0)

          // Obtener lecciones completadas
          if (enrollment) {
            const { data: completed } = await supabase
              .from('lesson_progress')
              .select('lesson_id')
              .eq('user_id', profileData.id)
              .in('lesson_id', lessonsData?.map(l => l.id) || [])

            setCompletedLessons(completed?.map(c => c.lesson_id) || [])
          }
        }
      }

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!curso) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-mutedForeground">Curso no encontrado</p>
      </div>
    )
  }

  const totalLessons = lessons.length
  const completedCount = completedLessons.length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-950/40 via-stone-900/40 to-card border border-rose-500/20 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/3">
            <div className="aspect-video rounded-xl overflow-hidden bg-stone-900/50">
              {curso.image_url ? (
                <img src={curso.image_url} alt={curso.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <GraduationCap className="w-16 h-16 text-mutedForeground/20" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase border ${
                curso.is_active 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-stone-500/20 text-stone-400 border-stone-500/30'
              }`}>
                {curso.is_active ? 'Publicado' : 'Borrador'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase border ${
                curso.level === 'beginner' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                curso.level === 'intermediate' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}>
                {curso.level === 'beginner' ? 'Principiante' :
                 curso.level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
              </span>
            </div>

            <h1 className="text-3xl font-serif italic text-foreground">{curso.title}</h1>
            <p className="text-sm text-mutedForeground flex items-center gap-2">
              <User className="w-4 h-4" />
              Por: {curso.instructor}
            </p>

            {curso.description && (
              <p className="text-sm text-mutedForeground">{curso.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-mutedForeground font-mono">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                {lessons.length > 0 ? `${lessons.length} lecciones` : 'Sin lecciones'}
              </span>
              {isEnrolled && (
                <>
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    Progreso: {progress}%
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    {completedCount} completadas
                  </span>
                </>
              )}
            </div>

            <div className="pt-4">
              <EnrollButton 
                courseId={curso.id} 
                onEnroll={() => {
                  setIsEnrolled(true)
                  cargarCurso()
                }}
              />
            </div>

            {isEnrolled && lessons.length > 0 && (
              <Link
                href={`/cursos/${curso.id}/lecciones/${lessons[0].id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-all shadow-lg shadow-rose-600/10"
              >
                <Play className="w-4 h-4" />
                Comenzar a aprender
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}

            {/* ✅ CERTIFICADO - se muestra cuando el progreso es 100% */}
            {isEnrolled && progress === 100 && curso && user && profileId && (
              <div className="pt-4">
                <CertificateGenerator
                  courseId={curso.id}
                  courseTitle={curso.title}
                  userId={profileId}
                  userName={user.email || 'Estudiante'}
                  progress={progress}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {isEnrolled && lessons.length > 0 && (
        <div className="mt-8 p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-lg font-serif italic text-foreground mb-4">Contenido del Curso</h2>
          
          <div className="space-y-4">
            {modules.map((module, mIdx) => (
              <div key={mIdx} className="border border-border rounded-xl overflow-hidden">
                <div className="p-3 bg-muted/20 border-b border-border">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-rose-500" />
                    {module.title}
                  </h3>
                </div>
                <div className="divide-y divide-border/60">
                  {module.lecciones.map((lesson: any, lIdx: number) => (
                    <Link
                      key={lesson.id}
                      href={`/cursos/${curso.id}/lecciones/${lesson.id}`}
                      className="flex items-center gap-4 p-3 hover:bg-muted/10 transition-colors"
                    >
                      <span className="w-6 text-xs text-mutedForeground font-mono text-center">
                        {String(lIdx + 1).padStart(2, '0')}
                      </span>
                      
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{lesson.title}</p>
                        <p className="text-[10px] text-mutedForeground font-mono">
                          {lesson.type || 'video'} • {lesson.duration || '10 min'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {lesson.is_completed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : lesson.is_locked ? (
                          <Lock className="w-4 h-4 text-mutedForeground/50" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-mutedForeground" />
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
        <div className="mt-8 p-6 rounded-2xl bg-card border border-border text-center">
          <GraduationCap className="w-12 h-12 text-mutedForeground/30 mx-auto mb-3" />
          <p className="text-sm text-mutedForeground">Este curso aún no tiene lecciones</p>
          <p className="text-xs text-mutedForeground/60">Vuelve pronto, el contenido se está preparando</p>
        </div>
      )}

      {!isEnrolled && (
        <div className="mt-8 p-6 rounded-2xl bg-card border border-border text-center">
          <Lock className="w-12 h-12 text-mutedForeground/30 mx-auto mb-3" />
          <p className="text-sm text-mutedForeground">Inscríbete para ver el contenido del curso</p>
          <p className="text-xs text-mutedForeground/60 mt-1">Haz clic en "Inscribirme al curso" para comenzar</p>
        </div>
      )}
    </div>
  )
}
