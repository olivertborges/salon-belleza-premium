'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'
import { CourseCard } from '@/components/courses'
import { BookOpen, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default function MisCursosPage() {
  const { user, tenantId, loading: authLoading } = useAuth()
  const supabaseClient = createClientComponentClient()

  const [cursos, setCursos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && tenantId) {
      cargarMisCursos()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, tenantId, authLoading])

  async function cargarMisCursos() {
    try {
      setLoading(true)

      // 1. Obtener las inscripciones activas del usuario (sin filtrar por tenant_id aquí porque no existe en esta tabla)
      const { data: enrollments, error: enrollError } = await supabaseClient
        .from('course_enrollments')
        .select('course_id, progress, status')
        .eq('user_id', user?.id)
        .eq('status', 'active')

      if (enrollError) throw enrollError

      if (!enrollments || enrollments.length === 0) {
        setCursos([])
        return
      }

      const courseIds = enrollments.map(e => e.course_id)

      // 2. Obtener los detalles filtrando por las IDs de sus inscripciones Y asegurando el tenant_id de la academia actual
      const { data: courses, error: coursesError } = await supabaseClient
        .from('courses')
        .select(`
          *,
          course_lessons (
            id,
            module_title
          )
        `)
        .in('id', courseIds)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)

      if (coursesError) throw coursesError

      // 3. Combinar los detalles con el progreso mapeando solo los que pasaron el filtro del Tenant
      const cursosConProgreso = (courses || []).map(curso => {
        const enrollment = enrollments.find(e => e.course_id === curso.id)
        return {
          ...curso,
          progress: enrollment?.progress || 0,
          status: enrollment?.status || 'active'
        }
      })

      setCursos(cursosConProgreso)
    } catch (error) {
      console.error('💥 Error al resolver el catálogo personal de alumno:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 antialiased">
        <BookOpen className="w-12 h-12 text-mutedForeground/30" />
        <div className="text-center">
          <h2 className="text-xl font-serif italic text-foreground">Tu espacio de aprendizaje</h2>
          <p className="text-xs text-mutedForeground mt-1">Inicia sesión para retomar tus clases y consultar tus avances</p>
        </div>
        <Link
          href="/login"
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-[10px] uppercase tracking-wider font-bold transition-all shadow-md shadow-rose-600/10 mt-2"
        >
          Iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 antialiased">
      {/* Header institucional plano */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500/[0.05] via-card to-card border border-rose-500/20 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 font-mono">📈 Progreso Académico</p>
            <h2 className="text-2xl font-serif italic text-foreground mt-1">Mis Cursos</h2>
            <p className="text-xs text-mutedForeground mt-1">
              {cursos.length} programa{cursos.length !== 1 ? 's' : ''} en curso actualmente
            </p>
          </div>
        </div>
      </div>

      {/* Grid o Estado Vacío */}
      {cursos.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-3xl border-border bg-muted/10 max-w-xl mx-auto">
          <GraduationCap className="w-12 h-12 text-mutedForeground/30 mx-auto mb-3" />
          <p className="text-sm font-bold text-foreground font-mono uppercase tracking-wide">Aún no tienes inscripciones</p>
          <p className="text-xs text-mutedForeground mt-1 max-w-xs mx-auto">Explora la oferta académica disponible y da el primer paso en tu formación.</p>
          <Link
            href="/cursos"
            className="inline-block mt-5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-[10px] uppercase tracking-wider font-bold transition-all shadow-md shadow-rose-600/10"
          >
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cursos.map((curso) => {
            const lessonsList = curso.course_lessons || []
            const uniqueModules = new Set(lessonsList.map((l: any) => l.module_title)).size
            const totalLessons = lessonsList.length
            
            return (
              <CourseCard
                key={curso.id}
                id={curso.id}
                title={curso.title}
                instructor={curso.instructor}
                description={curso.description || ''}
                image_url={curso.image_url || ''}
                level={curso.level || 'beginner'}
                modules_count={uniqueModules || 1}
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
