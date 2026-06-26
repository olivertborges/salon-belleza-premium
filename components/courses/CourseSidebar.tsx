'use client'

import { GraduationCap, User, BookOpen, Clock, Award, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface CourseSidebarProps {
  courseTitle: string
  instructor: string
  level: string
  totalLessons: number
  completedLessons: number
  progress: number
  children?: React.ReactNode
  backHref?: string
}

export function CourseSidebar({
  courseTitle,
  instructor,
  level,
  totalLessons,
  completedLessons,
  progress,
  children,
  backHref = '/cursos'
}: CourseSidebarProps) {
  const getLevelColor = (level: string) => {
    switch(level) {
      case 'beginner': return 'text-emerald-400'
      case 'intermediate': return 'text-amber-400'
      case 'advanced': return 'text-rose-400'
      default: return 'text-mutedForeground'
    }
  }

  const getLevelLabel = (level: string) => {
    switch(level) {
      case 'beginner': return 'Principiante'
      case 'intermediate': return 'Intermedio'
      case 'advanced': return 'Avanzado'
      default: return level
    }
  }

  return (
    <div className="sticky top-4 space-y-4">
      {/* Header del curso */}
      <div className="p-4 rounded-2xl bg-card border border-border">
        <Link 
          href={backHref}
          className="inline-flex items-center gap-1.5 text-[10px] text-mutedForeground hover:text-foreground transition-colors font-mono mb-3"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Volver a cursos
        </Link>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{courseTitle || 'Curso'}</h3>
            <p className="text-xs text-mutedForeground flex items-center gap-1">
              <User className="w-3 h-3" /> {instructor || 'Instructor'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-[10px] text-mutedForeground">
          <span className={`font-mono font-bold ${getLevelColor(level)}`}>
            {getLevelLabel(level)}
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> {completedLessons || 0}/{totalLessons || 0}
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1">
            <Award className="w-3 h-3" /> {progress || 0}%
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="mt-3 h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-500"
            style={{ width: `${progress || 0}%` }}
          />
        </div>
      </div>

      {/* Módulos y lecciones */}
      <div className="p-4 rounded-2xl bg-card border border-border max-h-[60vh] overflow-y-auto">
        {children || (
          <div className="text-center py-8 text-mutedForeground text-xs">
            No hay contenido disponible
          </div>
        )}
      </div>
    </div>
  )
}
