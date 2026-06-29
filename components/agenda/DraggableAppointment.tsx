'use client'

import { useDraggable } from '@dnd-kit/core'

interface DraggableAppointmentProps {
  id: string
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

export function DraggableAppointment({ id, disabled, children, className = '' }: DraggableAppointmentProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled
  })

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : 20,
    cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full h-full rounded-lg shadow-sm ${className}`}
      {...listeners}
      {...attributes}
    >
      {/* El onClick se maneja dentro del children, no aquí */}
      {children}
    </div>
  )
}