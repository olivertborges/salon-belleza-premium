'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { CourseCard } from '@/components/courses'
import { BookOpen, GraduationCap, Loader2 } from 'lucide-react'

export default function MisCursosPage() {
  const { user } = useAuth()
  const [cursos, setCursos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      cargarMisCursos()
    } else {
      setLoading(false)
    }
  }, [user])

  async function cargarMisCursos() {
    try {
      setLoading(true)

      // Obtener los cursos donde el usuario está inscrito
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('course_id, progress, status')
        .eq('user_id', user?.id)
        .eq('status', 'active')

      if (enrollError) throw enrollError

      if (enrollments.length === 0) {
        setCursos([])
        setLoading(false)
        return
      }

      const courseIds = enrollments.map(e => e.course_id)

      // Obtener los detalles de los cursos
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .in('id', courseIds)
        .eq('is_active', true)

      if (coursesError) throw coursesError

      // Combinar con el progreso
      const cursosConProgreso = courses.map(curso => {
        const enrollment = enrollments.find(e => e.course_id === curso.id)
        return {
          ...curso,
          progress: enrollment?.progress || 0,
          status: enrollment?.status || 'active'
        }
      })

      setCursos(cursosConProgreso)

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <BookOpen className="w-16 h-16 text-mutedForeground/30" />
        <p className="text-lg font-serif italic text-foreground">Inicia sesión para ver tus cursos</p>
        <a
          href="/login"
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-all"
        >
          Iniciar sesión
        </a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-serif italic text-foreground">Mis Cursos</h1>
          <p className="text-sm text-mutedForeground mt-1">
            {cursos.length} curso{cursos.length !== 1 ? 's' : ''} inscrito{cursos.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {cursos.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-3xl border-border bg-muted/20">
          <GraduationCap className="w-12 h-12 text-mutedForeground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No estás inscrito en ningún curso</p>
          <p className="text-xs text-mutedForeground mt-1">Explora nuestros cursos y comienza a aprender</p>
          <a
            href="/cursos"
            className="inline-block mt-4 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-all"
          >
            Ver cursos disponibles
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cursos.map((curso) => {
            const modules = curso.modules || []
            const totalLessons = modules.reduce((acc: number, m: any) => acc + (m.lecciones?.length || 0), 0)
            
            return (
              <CourseCard
                key={curso.id}
                id={curso.id}
                title={curso.title}
                instructor={curso.instructor}
                description={curso.description || ''}
                image_url={curso.image_url || ''}
                level={curso.level || 'beginner'}
                modules_count={modules.length}
                lessons_count={totalLessons}
                is_active={curso.is_active}
                progress={curso.progress || 0}
                href={`/cursos/${curso.id}`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
