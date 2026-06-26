'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Award, RefreshCw } from 'lucide-react'

interface Question {
  id: string
  type: 'multiple' | 'truefalse' | 'text'
  question: string
  options: string[]
  correctAnswer: number | string
  points?: number
}

interface QuizPlayerProps {
  quiz: {
    questions: Question[]
    passingScore: number
  }
  onComplete: (score: number, passed: boolean) => void
}

export function QuizPlayer({ quiz, onComplete }: QuizPlayerProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [passed, setPassed] = useState(false)

  const handleAnswer = (questionId: string, answer: any) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = () => {
    if (!quiz.questions || quiz.questions.length === 0) return

    let correctCount = 0
    const totalQuestions = quiz.questions.length

    quiz.questions.forEach((q) => {
      const userAnswer = answers[q.id]
      if (userAnswer === undefined) return

      if (q.type === 'multiple') {
        if (userAnswer === q.correctAnswer) correctCount++
      } else if (q.type === 'truefalse') {
        if (userAnswer === q.correctAnswer) correctCount++
      } else if (q.type === 'text') {
        // Para texto, comparar ignorando mayúsculas
        if (userAnswer.toLowerCase().trim() === String(q.correctAnswer).toLowerCase().trim()) {
          correctCount++
        }
      }
    })

    const finalScore = Math.round((correctCount / totalQuestions) * 100)
    const finalPassed = finalScore >= (quiz.passingScore || 70)

    setScore(finalScore)
    setPassed(finalPassed)
    setSubmitted(true)
    onComplete(finalScore, finalPassed)
  }

  const handleReset = () => {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
    setPassed(false)
  }

  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="text-center py-8 text-mutedForeground text-sm">
        No hay preguntas en este cuestionario
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header del quiz */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-rose-500" />
          <h3 className="text-sm font-bold text-foreground">Cuestionario</h3>
        </div>
        <span className="text-[10px] text-mutedForeground font-mono">
          Nota mínima: {quiz.passingScore || 70}%
        </span>
      </div>

      {/* Preguntas */}
      <div className="space-y-4">
        {quiz.questions.map((q, index) => {
          const userAnswer = answers[q.id]
          const isCorrect = submitted && userAnswer !== undefined && (
            q.type === 'multiple' ? userAnswer === q.correctAnswer :
            q.type === 'truefalse' ? userAnswer === q.correctAnswer :
            String(userAnswer).toLowerCase().trim() === String(q.correctAnswer).toLowerCase().trim()
          )

          return (
            <div key={q.id} className="p-4 border border-border rounded-xl bg-muted/10">
              <p className="text-xs font-medium text-foreground mb-3">
                {index + 1}. {q.question}
                <span className="text-[10px] text-mutedForeground font-normal ml-2">
                  ({q.points || 10} pts)
                </span>
              </p>

              {/* Opciones */}
              {q.type === 'multiple' && (
                <div className="space-y-2">
                  {q.options.map((option, i) => {
                    const isSelected = userAnswer === i
                    const isCorrectAnswer = submitted && q.correctAnswer === i
                    const isWrongAnswer = submitted && isSelected && !isCorrectAnswer

                    return (
                      <label
                        key={i}
                        className={`flex items-center gap-3 p-2 rounded-lg border transition-colors cursor-pointer ${
                          submitted
                            ? isCorrectAnswer
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : isWrongAnswer
                              ? 'border-red-500 bg-red-500/10'
                              : 'border-border opacity-50'
                            : isSelected
                            ? 'border-rose-500 bg-rose-500/10'
                            : 'border-border hover:border-rose-500/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={isSelected}
                          onChange={() => handleAnswer(q.id, i)}
                          disabled={submitted}
                          className="accent-rose-500"
                        />
                        <span className="text-xs text-foreground">{option}</span>
                        {submitted && isCorrectAnswer && (
                          <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />
                        )}
                        {submitted && isWrongAnswer && (
                          <XCircle className="w-4 h-4 text-red-500 ml-auto" />
                        )}
                      </label>
                    )
                  })}
                </div>
              )}

              {q.type === 'truefalse' && (
                <div className="flex gap-4">
                  {['Verdadero', 'Falso'].map((option, i) => {
                    const isSelected = userAnswer === i
                    const isCorrectAnswer = submitted && q.correctAnswer === i
                    const isWrongAnswer = submitted && isSelected && !isCorrectAnswer

                    return (
                      <label
                        key={i}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer ${
                          submitted
                            ? isCorrectAnswer
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : isWrongAnswer
                              ? 'border-red-500 bg-red-500/10'
                              : 'border-border opacity-50'
                            : isSelected
                            ? 'border-rose-500 bg-rose-500/10'
                            : 'border-border hover:border-rose-500/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={isSelected}
                          onChange={() => handleAnswer(q.id, i)}
                          disabled={submitted}
                          className="accent-rose-500"
                        />
                        <span className="text-xs text-foreground">{option}</span>
                      </label>
                    )
                  })}
                </div>
              )}

              {q.type === 'text' && (
                <div>
                  <input
                    type="text"
                    value={userAnswer || ''}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                    disabled={submitted}
                    placeholder="Escribe tu respuesta..."
                    className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground text-xs focus:outline-none focus:border-rose-500/50 ${
                      submitted
                        ? isCorrect
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : userAnswer
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-border'
                        : 'border-border'
                    }`}
                  />
                  {submitted && (
                    <p className={`text-[10px] font-mono mt-1 ${
                      isCorrect ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {isCorrect ? '✅ Correcto' : `❌ Respuesta esperada: ${q.correctAnswer}`}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Resultados y acciones */}
      {submitted ? (
        <div className={`p-4 rounded-xl border ${
          passed ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500 bg-red-500/10'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-bold ${
                passed ? 'text-emerald-500' : 'text-red-500'
              }`}>
                {passed ? '✅ Aprobado' : '❌ No aprobado'}
              </p>
              <p className="text-xs text-mutedForeground font-mono">
                Puntuación: {score}% ({quiz.passingScore || 70}% mínimo)
              </p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted/20 transition-colors text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < quiz.questions.length}
          className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {Object.keys(answers).length < quiz.questions.length 
            ? `Responde ${quiz.questions.length - Object.keys(answers).length} pregunta(s) más` 
            : 'Enviar respuestas'}
        </button>
      )}
    </div>
  )
}
