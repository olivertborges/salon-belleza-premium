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
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':')
      const hNum = parseInt(h)
      if (hNum >= 12) {
        setPeriod('PM')
        setHours(String(hNum === 12 ? 12 : hNum - 12).padStart(2, '0'))
      } else {
        setPeriod('AM')
        setHours(String(hNum === 0 ? 12 : hNum).padStart(2, '0'))
      }
      setMinutes(m || '00')
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
    let h = parseInt(hours)
    if (period === 'PM' && h !== 12) h += 12
    if (period === 'AM' && h === 12) h = 0
    const timeStr = `${String(h).padStart(2, '0')}:${minutes}`
    onChange(timeStr)
    setIsOpen(false)
  }

  const incrementHour = () => {
    let h = parseInt(hours)
    h = h === 12 ? 1 : h + 1
    setHours(String(h).padStart(2, '0'))
  }

  const decrementHour = () => {
    let h = parseInt(hours)
    h = h === 1 ? 12 : h - 1
    setHours(String(h).padStart(2, '0'))
  }

  const incrementMinute = () => {
    let m = parseInt(minutes) + 15
    if (m >= 60) m = 0
    setMinutes(String(m).padStart(2, '0'))
  }

  const decrementMinute = () => {
    let m = parseInt(minutes) - 15
    if (m < 0) m = 45
    setMinutes(String(m).padStart(2, '0'))
  }

  const getDisplayTime = () => {
    if (!value) return 'Seleccionar hora'
    const [h, m] = value.split(':')
    const hNum = parseInt(h)
    const periodStr = hNum >= 12 ? 'PM' : 'AM'
    const displayHour = hNum === 0 ? 12 : hNum > 12 ? hNum - 12 : hNum
    return `${String(displayHour).padStart(2, '0')}:${m} ${periodStr}`
  }

  if (disabled) {
    return (
      <div className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-mutedForeground">
        {getDisplayTime()}
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground flex items-center justify-between hover:border-cyan-500/50 transition-all"
      >
        <span className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-mutedForeground" />
          {getDisplayTime()}
        </span>
        <ChevronDown className={`w-4 h-4 text-mutedForeground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-xl shadow-2xl z-50 p-4">
          <div className="flex items-center justify-between gap-2">
            {/* Horas */}
            <div className="flex flex-col items-center flex-1">
              <button
                type="button"
                onClick={incrementHour}
                className="p-1 rounded hover:bg-muted/50 transition-colors text-mutedForeground hover:text-foreground"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <span className="text-3xl font-mono font-bold text-foreground my-1">{hours}</span>
              <button
                type="button"
                onClick={decrementHour}
                className="p-1 rounded hover:bg-muted/50 transition-colors text-mutedForeground hover:text-foreground"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <span className="text-2xl font-mono font-bold text-mutedForeground">:</span>

            {/* Minutos */}
            <div className="flex flex-col items-center flex-1">
              <button
                type="button"
                onClick={incrementMinute}
                className="p-1 rounded hover:bg-muted/50 transition-colors text-mutedForeground hover:text-foreground"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <span className="text-3xl font-mono font-bold text-foreground my-1">{minutes}</span>
              <button
                type="button"
                onClick={decrementMinute}
                className="p-1 rounded hover:bg-muted/50 transition-colors text-mutedForeground hover:text-foreground"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* AM/PM */}
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setPeriod('AM')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all ${
                  period === 'AM' 
                    ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/20' 
                    : 'bg-muted/30 text-mutedForeground hover:bg-muted/50'
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => setPeriod('PM')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all ${
                  period === 'PM' 
                    ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/20' 
                    : 'bg-muted/30 text-mutedForeground hover:bg-muted/50'
                }`}
              >
                PM
              </button>
            </div>
          </div>

          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-muted/30 text-mutedForeground hover:bg-muted/50 transition-colors text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-medium hover:shadow-lg transition-all"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
