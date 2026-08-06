'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation' // 👈 Importar useRouter
import { supabase } from '@/lib/supabase/client'

const IDLE_TIMEOUT = 15 * 60 * 1000 // 15 minutos de inactividad

export function useIdleTimer() {
  const router = useRouter() // 👈 Cambiar Router() por useRouter()
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
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']

    const handleActivity = () => resetTimer()

    events.forEach((event) => window.addEventListener(event, handleActivity))
    resetTimer()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach((event) => window.removeEventListener(event, handleActivity))
    }
  }, [])
}
