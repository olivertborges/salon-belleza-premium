'use client'

import { useState, useEffect } from 'react'
import { Play, File, CheckCircle, Lock, Download, ExternalLink, BookOpen, Video, FileText, Award } from 'lucide-react'
import { QuizPlayer } from './QuizPlayer'
import { Comments } from './Comments'
import { createNotification } from '@/lib/notifications'
import { useAuth } from '@/contexts/AuthContext'

interface Lesson {
  id: string
  title: string
  description: string
  content: string
  video_url: string
  video_duration: string
  pdf_url: string
  attachments: any[]
  quiz: any
  type: 'video' | 'text' | 'quiz' | 'resource'
  is_locked: boolean
  is_completed: boolean
  order: number
}

interface LessonPlayerProps {
  lesson: Lesson
  onComplete?: () => void
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
}

export function LessonPlayer({ 
  lesson, 
  onComplete, 
  onPrevious, 
  onNext,
  hasPrevious,
  hasNext
}: LessonPlayerProps) {
  const { user } = useAuth()
  const [completed, setCompleted] = useState(lesson.is_completed)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizPassed, setQuizPassed] = useState(false)

  useEffect(() => {
    setCompleted(lesson.is_completed)
  }, [lesson.is_completed])

  const handleComplete = async () => {
    setCompleted(!completed)
    if (onComplete) onComplete()

    // Crear notificación de progreso
    if (user) {
      await createNotification({
        userId: user.id,
        title: `✅ Lección completada: ${lesson.title}`,
        message: `Has completado la lección "${lesson.title}".`,
        type: 'success'
      })
    }
  }

  const handleQuizComplete = (score: number, passed: boolean) => {
    setQuizCompleted(true)
    setQuizPassed(passed)

    if (passed) {
      handleComplete()
    }

    if (user) {
      createNotification({
        userId: user.id,
        title: passed ? '🎉 Cuestionario aprobado!' : '📝 Cuestionario no aprobado',
        message: `Obtuviste ${score}% en el cuestionario de "${lesson.title}".`,
        type: passed ? 'success' : 'warning'
      })
    }
  }

  const getTypeIcon = () => {
    switch(lesson.type) {
      case 'video': return <Video className="w-4 h-4" />
      case 'text': return <BookOpen className="w-4 h-4" />
      case 'quiz': return <Award className="w-4 h-4" />
      case 'resource': return <FileText className="w-4 h-4" />
      default: return <File className="w-4 h-4" />
    }
  }

  if (lesson.is_locked) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-muted/30 rounded-2xl border border-border">
        <Lock className="w-12 h-12 text-mutedForeground/30 mb-3" />
        <p className="text-sm font-medium text-foreground">Lección bloqueada</p>
        <p className="text-xs text-mutedForeground">Completa las lecciones anteriores para desbloquear</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header de la lección */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-mutedForeground font-mono uppercase">
            <span>Lección {lesson.order + 1}</span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1">
              {getTypeIcon()}
              {lesson.type}
            </span>
            {lesson.video_duration && (
              <>
                <span className="text-border">|</span>
                <span>Duración: {lesson.video_duration}</span>
              </>
            )}
          </div>
          <h1 className="text-xl font-bold text-foreground mt-1">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-sm text-mutedForeground mt-1">{lesson.description}</p>
          )}
        </div>
        {lesson.type === 'quiz' && !quizCompleted && (
          <button
            onClick={() => setShowQuiz(!showQuiz)}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium hover:bg-rose-500/20 transition-colors"
          >
            {showQuiz ? 'Ocultar quiz' : 'Ver quiz'}
          </button>
        )}
      </div>

      {/* Video */}
      {lesson.video_url && lesson.type === 'video' && (
        <div className="aspect-video rounded-2xl overflow-hidden bg-black">
          <iframe
            src={lesson.video_url}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Contenido en texto */}
      {lesson.content && lesson.type !== 'video' && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
        </div>
      )}

      {/* Contenido después del video */}
      {lesson.content && lesson.type === 'video' && (
        <div className="prose prose-sm dark:prose-invert max-w-none mt-4">
          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
        </div>
      )}

      {/* Quiz */}
      {lesson.quiz && showQuiz && (
        <div className="p-4 border border-border rounded-xl bg-muted/20">
          <QuizPlayer 
            quiz={lesson.quiz} 
            onComplete={handleQuizComplete}
          />
        </div>
      )}

      {/* PDF descargable */}
      {lesson.pdf_url && (
        <div className="flex flex-wrap gap-2 pt-2">
          <a
            href={lesson.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors text-sm text-foreground"
          >
            <Download className="w-4 h-4" />
            Descargar PDF
          </a>
          <a
            href={lesson.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors text-sm text-foreground"
          >
            <ExternalLink className="w-4 h-4" />
            Ver en nueva ventana
          </a>
        </div>
      )}

      {/* Archivos adjuntos */}
      {lesson.attachments && lesson.attachments.length > 0 && (
        <div className="pt-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-mutedForeground mb-2">Recursos adicionales</p>
          <div className="flex flex-wrap gap-2">
            {lesson.attachments.map((att, i) => (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/10 hover:bg-muted/30 transition-colors text-xs text-mutedForeground hover:text-foreground"
              >
                <File className="w-3.5 h-3.5" />
                {att.title || `Archivo ${i + 1}`}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Comentarios */}
      <div className="pt-4 border-t border-border">
        <Comments lessonId={lesson.id} />
      </div>

      {/* Navegación y completar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
        <div className="flex gap-2">
          {hasPrevious && (
            <button
              onClick={onPrevious}
              className="px-4 py-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors text-xs font-medium text-foreground"
            >
              ← Lección anterior
            </button>
          )}
          {hasNext && (
            <button
              onClick={onNext}
              className="px-4 py-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors text-xs font-medium text-foreground"
            >
              Siguiente lección →
            </button>
          )}
        </div>

        <button
          onClick={handleComplete}
          disabled={lesson.type === 'quiz' && !quizCompleted}
          className={`px-4 py-2.5 rounded-xl font-mono text-[10px] uppercase tracking-wider font-bold transition-all flex items-center gap-2 ${
            completed
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
              : lesson.type === 'quiz' && !quizCompleted
              ? 'bg-muted/30 text-mutedForeground cursor-not-allowed'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
          }`}
        >
          {completed ? (
            <>
              <CheckCircle className="w-4 h-4" /> Completado
            </>
          ) : lesson.type === 'quiz' && !quizCompleted ? (
            'Completa el quiz primero'
          ) : (
            'Marcar como completada'
          )}
        </button>
      </div>
    </div>
  )
}
