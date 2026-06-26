'use client'

import { Award, TrendingUp, CheckCircle, Clock } from 'lucide-react'

interface CourseProgressProps {
  totalLessons: number
  completedLessons: number
  totalQuizzes: number
  completedQuizzes: number
  progress: number
  className?: string
}

export function CourseProgress({
  totalLessons,
  completedLessons,
  totalQuizzes,
  completedQuizzes,
  progress,
  className = ''
}: CourseProgressProps) {
  const stats = [
    {
      icon: CheckCircle,
      label: 'Lecciones completadas',
      value: `${completedLessons}/${totalLessons}`,
      color: 'text-emerald-500'
    },
    {
      icon: Award,
      label: 'Quizzes completados',
      value: `${completedQuizzes}/${totalQuizzes}`,
      color: 'text-amber-500'
    },
    {
      icon: TrendingUp,
      label: 'Progreso total',
      value: `${progress}%`,
      color: 'text-rose-500'
    },
    {
      icon: Clock,
      label: 'Tiempo estimado',
      value: '4h 30min',
      color: 'text-violet-500'
    }
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra grande */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-mutedForeground">Progreso del curso</span>
          <span className="font-bold text-foreground">{progress}%</span>
        </div>
        <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <div key={index} className="p-3 rounded-xl bg-muted/20 border border-border">
            <div className="flex items-center gap-2">
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              <span className="text-[9px] text-mutedForeground font-mono">{stat.label}</span>
            </div>
            <span className="text-base font-bold text-foreground block mt-0.5">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
