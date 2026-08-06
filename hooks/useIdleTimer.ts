'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Tiempo de inactividad en milisegundos (ejemplo: 15 minutos)
const IDLE_TIMEOUT = 15 * 60 * 1000 

export function useIdleTimer() {
  const router = Router()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login?expired=1')
  }

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(handleLogout, IDLE_TIMEOUT)
  }

  useEffect(() => {
    // Eventos que reinician el contador de actividad
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']

    const handleActivity = () => resetTimer()

    events.forEach((event) => window.addEventListener(event, handleActivity))
    resetTimer() // Iniciar temporizador al montar

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach((event) => window.removeEventListener(event, handleActivity))
    }
  }, [])
}
