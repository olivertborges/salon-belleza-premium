'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronUp, ChevronDown, Clock } from 'lucide-react'

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
  disabled?: boolean
}

export function TimePicker({ value, onChange, disabled = false }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hours, setHours] = useState('09')
  const [minutes, setMinutes] = useState('00')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':')
      setHours(h.padStart(2, '0'))
      setMinutes(m?.padStart(2, '0') || '00')
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleConfirm = () => {
    const h = parseInt(hours)
    const m = parseInt(minutes)
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      onChange(timeStr)
      setIsOpen(false)
    }
  }

  const incrementHour = () => {
    let h = parseInt(hours)
    h = h === 23 ? 0 : h + 1
    setHours(String(h).padStart(2, '0'))
  }

  const decrementHour = () => {
    let h = parseInt(hours)
    h = h === 0 ? 23 : h - 1
    setHours(String(h).padStart(2, '0'))
  }

  const incrementMinute = () => {
    let m = parseInt(minutes)
    m = m + 15
    if (m >= 60) m = 0
    setMinutes(String(m).padStart(2, '0'))
  }

  const decrementMinute = () => {
    let m = parseInt(minutes)
    m = m - 15
    if (m < 0) m = 45
    setMinutes(String(m).padStart(2, '0'))
  }

  const getDisplayTime = () => {
    if (!value) return 'Seleccionar hora'
    const [h, m] = value.split(':')
    if (!h || !m) return 'Seleccionar hora'
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
  }

  if (disabled) {
    return (
      <div className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm text-mutedForeground">
        {getDisplayTime()}
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground flex items-center justify-between hover:border-cyan-500/50 transition-all"
      >
        <span className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-mutedForeground" />
          {getDisplayTime()}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-mutedForeground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-xl shadow-2xl z-50 p-2.5">
          <div className="flex items-center justify-between gap-1">
            {/* Horas 0-23 */}
            <div className="flex flex-col items-center flex-1">
              <button
                type="button"
                onClick={incrementHour}
                className="p-0.5 rounded hover:bg-muted/50 transition-colors text-mutedForeground hover:text-foreground"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <span className="text-xl font-mono font-bold text-foreground my-0.5">{hours}</span>
              <button
                type="button"
                onClick={decrementHour}
                className="p-0.5 rounded hover:bg-muted/50 transition-colors text-mutedForeground hover:text-foreground"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            <span className="text-lg font-mono font-bold text-mutedForeground">:</span>

            {/* Minutos 00, 15, 30, 45 */}
            <div className="flex flex-col items-center flex-1">
              <button
                type="button"
                onClick={incrementMinute}
                className="p-0.5 rounded hover:bg-muted/50 transition-colors text-mutedForeground hover:text-foreground"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <span className="text-xl font-mono font-bold text-foreground my-0.5">{minutes}</span>
              <button
                type="button"
                onClick={decrementMinute}
                className="p-0.5 rounded hover:bg-muted/50 transition-colors text-mutedForeground hover:text-foreground"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Indicador 24h */}
            <div className="flex items-center justify-center">
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-1.5 py-0.5">
                <span className="text-[8px] font-mono font-bold text-cyan-600 dark:text-cyan-400">24h</span>
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 mt-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-2 py-1 rounded-lg bg-muted/30 text-mutedForeground hover:bg-muted/50 transition-colors text-[9px] font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 px-2 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[9px] font-medium hover:shadow-lg transition-all"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
