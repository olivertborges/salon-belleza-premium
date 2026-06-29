'use client'

import { useDroppable } from '@dnd-kit/core'

interface DroppableSlotProps {
  id: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function DroppableSlot({ id, children, className = '', style }: DroppableSlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative min-h-[65px] border-b border-r border-border/20 transition-colors ${
        isOver ? 'bg-cyan-500/10 ring-1 ring-cyan-500/30' : 'bg-background/50'
      } ${className}`}
    >
      {children}
    </div>
  )
}