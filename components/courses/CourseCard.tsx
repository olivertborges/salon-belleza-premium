'use client'

import Link from 'next/link'
import { GraduationCap, Layers, Video, BookOpen, Clock, Award, ChevronRight } from 'lucide-react'

interface CourseCardProps {
  id: string
  title: string
  instructor: string
  description: string
  image_url: string
  level: string
  modules_count: number
  lessons_count: number
  is_active: boolean
  progress?: number
  slug?: string
  href: string
}

export function CourseCard({
  id,
  title,
  instructor,
  description,
  image_url,
  level,
  modules_count,
  lessons_count,
  is_active,
  progress = 0,
  href
}: CourseCardProps) {
  const getLevelColor = (level: string) => {
    switch(level) {
      case 'beginner': return 'bg-emerald-500/20 text-emerald-400'
      case 'intermediate': return 'bg-amber-500/20 text-amber-400'
      case 'advanced': return 'bg-rose-500/20 text-rose-400'
      default: return 'bg-stone-500/20 text-stone-400'
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
    <Link href={href} className="group block">
      <div className="rounded-2xl bg-card border border-border hover:border-rose-500/30 transition-all overflow-hidden h-full">
        {/* Imagen */}
        <div className="relative h-40 bg-gradient-to-br from-rose-950/40 via-stone-900/40 to-card">
          {image_url ? (
            <img src={image_url} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <GraduationCap className="w-14 h-14 text-mutedForeground/20" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
            {is_active && (
              <span className="px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Publicado
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase border ${getLevelColor(level)}`}>
              {getLevelLabel(level)}
            </span>
          </div>

          {/* Barra de progreso (si existe) */}
          {progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30">
              <div 
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-foreground group-hover:text-rose-500 transition-colors line-clamp-1">
              {title}
            </h3>
            <p className="text-xs text-mutedForeground">Por: {instructor}</p>
            {description && (
              <p className="text-[10px] text-mutedForeground line-clamp-2 mt-1">{description}</p>
            )}
          </div>

          <div className="flex items-center gap-3 text-[10px] text-mutedForeground font-mono">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {modules_count} módulos
            </span>
            <span className="flex items-center gap-1">
              <Video className="w-3 h-3" />
              {lessons_count} lecciones
            </span>
          </div>

          {progress > 0 && (
            <div className="flex items-center justify-between text-[10px] text-mutedForeground font-mono">
              <span>Progreso: {progress}%</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
