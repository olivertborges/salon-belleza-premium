'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface ResizableAppointmentProps {
  id: string
  children: React.ReactNode
  height: number
  onResize: (newHeight: number) => void
  minHeight?: number
  maxHeight?: number
  className?: string
}

export function ResizableAppointment({
  id,
  children,
  height,
  onResize,
  minHeight = 60,
  maxHeight = 200,
  className = ''
}: ResizableAppointmentProps) {
  const [isResizing, setIsResizing] = useState(false)
  const startYRef = useRef(0)
  const startHeightRef = useRef(height)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    startYRef.current = e.clientY
    startHeightRef.current = height

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    startYRef.current = e.touches[0].clientY
    startHeightRef.current = height

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }

  const handleMouseMove = (e: MouseEvent) => {
    const deltaY = e.clientY - startYRef.current
    const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, minHeight), maxHeight)
    onResize(newHeight)
  }

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    const deltaY = e.touches[0].clientY - startYRef.current
    const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, minHeight), maxHeight)
    onResize(newHeight)
  }

  const handleMouseUp = () => {
    setIsResizing(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const handleTouchEnd = () => {
    setIsResizing(false)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }

  return (
    <div className={cn('relative group', className)} style={{ height: `${height}px` }}>
      {children}
      
      {/* Control de redimensionamiento */}
      <div
        className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="w-8 h-1 rounded-full bg-cyan-500/50 hover:bg-cyan-500 transition-colors">
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[6px] text-cyan-500">⏤</span>
          </div>
        </div>
      </div>
    </div>
  )
}
