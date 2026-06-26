'use client'

import { LessonPlayer } from './LessonPlayer'
import { ModuleList } from './ModuleList'
import { CourseSidebar } from './CourseSidebar'
import { CourseProgress } from './CourseProgress'

interface LessonViewerProps {
  course: {
    id: string
    title: string
    instructor: string
    level: string
    modules: any[]
  }
  currentLessonId: string
  lessons: any[]
  progress: {
    completed: number
    total: number
    percent: number
  }
}

export function LessonViewer({ course, currentLessonId, lessons, progress }: LessonViewerProps) {
  const currentLesson = lessons.find(l => l.id === currentLessonId)
  const currentIndex = lessons.findIndex(l => l.id === currentLessonId)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < lessons.length - 1

  const handlePrevious = () => {
    if (hasPrevious) {
      // Navegar a lección anterior
      window.location.href = `/cursos/${course.id}/lecciones/${lessons[currentIndex - 1].id}`
    }
  }

  const handleNext = () => {
    if (hasNext) {
      // Navegar a siguiente lección
      window.location.href = `/cursos/${course.id}/lecciones/${lessons[currentIndex + 1].id}`
    }
  }

  if (!currentLesson) {
    return <div className="text-center py-12">Lección no encontrada</div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar - 1/4 */}
      <div className="lg:col-span-1">
        <CourseSidebar
          courseTitle={course.title}
          instructor={course.instructor}
          level={course.level}
          totalLessons={progress.total}
          completedLessons={progress.completed}
          progress={progress.percent}
        >
          <ModuleList
            modules={course.modules}
            currentLessonId={currentLessonId}
            onLessonClick={(id) => {
              window.location.href = `/cursos/${course.id}/lecciones/${id}`
            }}
          />
        </CourseSidebar>
      </div>

      {/* Contenido - 3/4 */}
      <div className="lg:col-span-3 space-y-6">
        {/* Progreso */}
        <CourseProgress
          totalLessons={progress.total}
          completedLessons={progress.completed}
          totalQuizzes={0}
          completedQuizzes={0}
          progress={progress.percent}
        />

        {/* Reproductor */}
        <LessonPlayer
          lesson={currentLesson}
          onComplete={() => {
            // Marcar lección como completada
            console.log('Lección completada:', currentLesson.id)
          }}
          onPrevious={handlePrevious}
          onNext={handleNext}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
        />
      </div>
    </div>
  )
}
