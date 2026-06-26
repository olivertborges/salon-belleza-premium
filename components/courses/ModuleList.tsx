'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Play, Lock, CheckCircle, Video, BookOpen, Award, FileText, Clock } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  type: 'video' | 'text' | 'quiz' | 'resource'
  is_locked: boolean
  is_completed: boolean
  duration: string
  order: number
}

interface Module {
  id?: string
  title: string
  description?: string
  lessons: Lesson[]  // 👈 Asegurar que siempre es un array
}

interface ModuleListProps {
  modules: Module[]
  currentLessonId?: string
  onLessonClick: (lessonId: string) => void
}

export function ModuleList({ modules, currentLessonId, onLessonClick }: ModuleListProps) {
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({
    0: true
  })

  const toggleModule = (index: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'video': return <Video className="w-3.5 h-3.5" />
      case 'text': return <BookOpen className="w-3.5 h-3.5" />
      case 'quiz': return <Award className="w-3.5 h-3.5" />
      case 'resource': return <FileText className="w-3.5 h-3.5" />
      default: return <Play className="w-3.5 h-3.5" />
    }
  }

  // ✅ SI NO HAY MÓDULOS O ESTÁ VACÍO
  if (!modules || modules.length === 0) {
    return (
      <div className="text-center py-8 text-mutedForeground text-xs">
        No hay módulos disponibles en este curso.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {modules.map((module, mIdx) => {
        // ✅ ASEGURAR QUE lessons SIEMPRE ES UN ARRAY
        const lessons = module.lessons || []
        const isExpanded = expandedModules[mIdx] ?? false
        const completedCount = lessons.filter(l => l?.is_completed).length

        return (
          <div key={mIdx} className="border border-border rounded-xl overflow-hidden">
            {/* Cabecera del módulo */}
            <button
              onClick={() => toggleModule(mIdx)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/20 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-mutedForeground flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-mutedForeground flex-shrink-0" />
              )}
              <span className="text-xs font-medium text-foreground flex-1">
                {module.title || 'Módulo sin título'}
              </span>
              <span className="text-[9px] text-mutedForeground font-mono">
                {completedCount}/{lessons.length}
              </span>
              {completedCount === lessons.length && lessons.length > 0 && (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              )}
            </button>

            {/* Lista de lecciones */}
            {isExpanded && (
              <div className="border-t border-border divide-y divide-border/60">
                {lessons.length === 0 ? (
                  <div className="p-3 text-center text-[10px] text-mutedForeground">
                    No hay lecciones en este módulo
                  </div>
                ) : (
                  lessons.map((lesson, lIdx) => {
                    // ✅ VERIFICAR QUE lesson EXISTE
                    if (!lesson) return null
                    
                    const isActive = currentLessonId === lesson.id
                    
                    return (
                      <button
                        key={lesson.id || lIdx}
                        onClick={() => !lesson.is_locked && onLessonClick(lesson.id)}
                        disabled={lesson.is_locked}
                        className={`w-full flex items-center gap-3 p-2.5 text-left transition-colors ${
                          isActive ? 'bg-rose-500/10 border-l-2 border-l-rose-500' : ''
                        } ${
                          lesson.is_locked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted/20'
                        }`}
                      >
                        <span className="w-5 text-[10px] text-mutedForeground font-mono text-center">
                          {lIdx + 1}
                        </span>
                        
                        {lesson.is_completed ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        ) : lesson.is_locked ? (
                          <Lock className="w-3.5 h-3.5 text-mutedForeground flex-shrink-0" />
                        ) : (
                          getTypeIcon(lesson.type || 'video')
                        )}

                        <span className={`text-xs flex-1 truncate ${
                          isActive ? 'text-rose-500 font-medium' : 'text-foreground'
                        }`}>
                          {lesson.title || 'Lección sin título'}
                        </span>

                        {lesson.duration && (
                          <span className="text-[9px] text-mutedForeground font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {lesson.duration}
                          </span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
