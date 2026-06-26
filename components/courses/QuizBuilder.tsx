'use client'

import { useState } from 'react'
import { Plus, Trash2, X, Check, ChevronDown, ChevronRight } from 'lucide-react'

interface Question {
  id: string
  type: 'multiple' | 'truefalse' | 'text'
  question: string
  options: string[]
  correctAnswer: number | string
  points?: number
}

interface QuizBuilderProps {
  questions: Question[]
  onChange: (questions: Question[]) => void
  passingScore?: number
  onPassingScoreChange?: (score: number) => void
}

export function QuizBuilder({ 
  questions, 
  onChange, 
  passingScore = 70,
  onPassingScoreChange 
}: QuizBuilderProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: 'multiple',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 10
    }
    onChange([...questions, newQuestion])
    setExpanded(newQuestion.id)
  }

  const removeQuestion = (id: string) => {
    onChange(questions.filter(q => q.id !== id))
  }

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    onChange(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ))
  }

  const updateOption = (id: string, index: number, value: string) => {
    onChange(questions.map(q => {
      if (q.id === id) {
        const newOptions = [...q.options]
        newOptions[index] = value
        return { ...q, options: newOptions }
      }
      return q
    }))
  }

  const addOption = (id: string) => {
    onChange(questions.map(q => {
      if (q.id === id) {
        return { ...q, options: [...q.options, ''] }
      }
      return q
    }))
  }

  const removeOption = (id: string, index: number) => {
    onChange(questions.map(q => {
      if (q.id === id) {
        const newOptions = q.options.filter((_, i) => i !== index)
        return { ...q, options: newOptions }
      }
      return q
    }))
  }

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'multiple': return 'Selección múltiple'
      case 'truefalse': return 'Verdadero/Falso'
      case 'text': return 'Respuesta abierta'
      default: return type
    }
  }

  return (
    <div className="space-y-4">
      {/* Configuración del quiz */}
      <div className="flex items-center gap-4 p-3 bg-muted/20 rounded-xl border border-border">
        <label className="text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
          Nota mínima:
        </label>
        <input
          type="number"
          value={passingScore}
          onChange={(e) => onPassingScoreChange?.(parseInt(e.target.value) || 70)}
          className="w-16 px-2 py-1 rounded-lg border border-border bg-background text-foreground text-sm text-center focus:outline-none focus:border-rose-500/50"
          min="0"
          max="100"
        />
        <span className="text-xs text-mutedForeground">%</span>
        <span className="text-[10px] text-mutedForeground font-mono ml-2">
          {questions.length} preguntas
        </span>
      </div>

      {/* Lista de preguntas */}
      <div className="space-y-2">
        {questions.map((q) => (
          <div key={q.id} className="border border-border rounded-xl overflow-hidden">
            {/* Header de la pregunta */}
            <button
              onClick={() => setExpanded(expanded === q.id ? null : q.id)}
              className="w-full flex items-center gap-2 p-3 text-left hover:bg-muted/20 transition-colors"
            >
              {expanded === q.id ? (
                <ChevronDown className="w-4 h-4 text-mutedForeground flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-mutedForeground flex-shrink-0" />
              )}
              <span className="text-xs font-medium text-foreground flex-1 truncate">
                {q.question || 'Nueva pregunta'}
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-muted/50 text-mutedForeground font-mono">
                {getTypeLabel(q.type)}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); removeQuestion(q.id) }}
                className="p-1 rounded text-mutedForeground hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </button>

            {/* Contenido expandido */}
            {expanded === q.id && (
              <div className="p-3 pt-0 border-t border-border space-y-3">
                <input
                  type="text"
                  placeholder="Escribe la pregunta..."
                  value={q.question}
                  onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-rose-500/50"
                />

                <div className="flex gap-2">
                  <select
                    value={q.type}
                    onChange={(e) => {
                      const type = e.target.value as 'multiple' | 'truefalse' | 'text'
                      const options = type === 'multiple' ? ['', '', '', ''] : 
                                     type === 'truefalse' ? ['Verdadero', 'Falso'] : []
                      updateQuestion(q.id, 'type', type)
                      updateQuestion(q.id, 'options', options)
                      updateQuestion(q.id, 'correctAnswer', type === 'truefalse' ? 0 : 0)
                    }}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:border-rose-500/50"
                  >
                    <option value="multiple">Selección múltiple</option>
                    <option value="truefalse">Verdadero/Falso</option>
                    <option value="text">Respuesta abierta</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Puntos"
                    value={q.points || 10}
                    onChange={(e) => updateQuestion(q.id, 'points', parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs text-center focus:outline-none focus:border-rose-500/50"
                  />
                </div>

                {/* Opciones */}
                {q.type === 'multiple' && (
                  <div className="space-y-1.5 pl-2">
                    {q.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[10px] text-mutedForeground font-mono w-5">{i + 1}.</span>
                        <input
                          type="text"
                          placeholder={`Opción ${i + 1}`}
                          value={opt}
                          onChange={(e) => updateOption(q.id, i, e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:border-rose-500/50"
                        />
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctAnswer === i}
                          onChange={() => updateQuestion(q.id, 'correctAnswer', i)}
                          className="accent-rose-500"
                        />
                        <span className="text-[9px] text-mutedForeground">Correcta</span>
                        {q.options.length > 2 && (
                          <button
                            onClick={() => removeOption(q.id, i)}
                            className="p-0.5 rounded text-mutedForeground hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(q.id)}
                      className="text-[9px] text-mutedForeground hover:text-rose-500 transition-colors flex items-center gap-1 font-mono"
                    >
                      <Plus className="w-3 h-3" /> Añadir opción
                    </button>
                  </div>
                )}

                {q.type === 'truefalse' && (
                  <div className="flex gap-4 pl-2">
                    <label className="flex items-center gap-2 text-xs text-foreground">
                      <input
                        type="radio"
                        name={`tf-${q.id}`}
                        checked={q.correctAnswer === 0}
                        onChange={() => updateQuestion(q.id, 'correctAnswer', 0)}
                        className="accent-rose-500"
                      />
                      Verdadero
                    </label>
                    <label className="flex items-center gap-2 text-xs text-foreground">
                      <input
                        type="radio"
                        name={`tf-${q.id}`}
                        checked={q.correctAnswer === 1}
                        onChange={() => updateQuestion(q.id, 'correctAnswer', 1)}
                        className="accent-rose-500"
                      />
                      Falso
                    </label>
                  </div>
                )}

                {q.type === 'text' && (
                  <div className="text-xs text-mutedForeground pl-2">
                    <p>Respuesta abierta - El estudiante escribe su respuesta</p>
                    <div className="mt-2 p-2 rounded-lg bg-muted/20 border border-border">
                      <textarea
                        placeholder="Ejemplo de respuesta esperada..."
                        className="w-full bg-transparent border-none text-xs text-foreground focus:outline-none resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Botón para agregar pregunta */}
      <button
        onClick={addQuestion}
        className="w-full py-3 rounded-xl border border-dashed border-border hover:border-rose-500/50 text-mutedForeground hover:text-rose-500 transition-colors flex items-center justify-center gap-2 text-xs font-mono"
      >
        <Plus className="w-4 h-4" /> Agregar pregunta
      </button>
    </div>
  )
}
