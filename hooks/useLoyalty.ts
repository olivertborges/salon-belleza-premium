// @ts-nocheck
// hooks/useLoyalty.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

// Definir los niveles
const LEVELS = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 1500,
  PLATINUM: 3500,
  DIAMOND: 8000
}

const LEVEL_NAMES = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']

export function useLoyalty() {
  const { user } = useAuth()
  const userId = user?.id

  const [userPoints, setUserPoints] = useState(0)
  const [level, setLevel] = useState('BRONZE')
  const [nextLevel, setNextLevel] = useState('SILVER')
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)

  // Función para obtener el siguiente nivel
  const getNextLevel = (currentLevel: string): string => {
    const currentIndex = LEVEL_NAMES.indexOf(currentLevel)
    if (currentIndex === LEVEL_NAMES.length - 1) {
      return currentLevel
    }
    return LEVEL_NAMES[currentIndex + 1]
  }

  // Función para actualizar el nivel basado en puntos
  const updateLevel = (points: number) => {
    let currentLevel = 'BRONZE'
    for (const [name, threshold] of Object.entries(LEVELS)) {
      if (points >= threshold) {
        currentLevel = name
      }
    }

    setLevel(currentLevel)
    
    const nextLevelName = getNextLevel(currentLevel)
    setNextLevel(nextLevelName)

    const currentThreshold = LEVELS[currentLevel as keyof typeof LEVELS]
    const nextThreshold = LEVELS[nextLevelName as keyof typeof LEVELS]
    
    if (currentLevel === 'DIAMOND') {
      setProgress(100)
    } else {
      const progressValue = ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100
      setProgress(Math.min(Math.max(progressValue, 0), 100))
    }
  }

  // Cargar datos de fidelidad
  const fetchLoyaltyData = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      // @ts-ignore
      const { data, error } = await supabase
        .from('profiles')
        .select('loyalty_points, level')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error

      if (data) {
        const points = data.loyalty_points || 0
        setUserPoints(points)
        updateLevel(points)
      }
    } catch (error) {
      console.error('Error cargando datos de fidelidad:', error)
    } finally {
      setLoading(false)
    }
  }

  // Suscribirse a cambios en tiempo real
  const subscribeToPoints = () => {
    if (!userId) return

    const channel = supabase
      .channel('loyalty_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          const newPoints = payload.new.loyalty_points || 0
          setUserPoints(newPoints)
          updateLevel(newPoints)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  useEffect(() => {
    fetchLoyaltyData()
    const unsubscribe = subscribeToPoints()
    
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [userId])

  // Ganar puntos
  const earnPoints = async (amount: number, reason: string) => {
    if (!userId) {
      console.error('Usuario no autenticado')
      return null
    }

    try {
      // @ts-ignore
      const { data, error } = await supabase
        .rpc('earn_loyalty_points', {
          user_id: userId,
          points: amount,
          reason: reason
        })

      if (error) throw error
      
      // Actualizar puntos localmente
      setUserPoints(prev => prev + amount)
      updateLevel(userPoints + amount)
      
      return data
    } catch (error) {
      console.error('Error ganando puntos:', error)
      return null
    }
  }

  // Canjear puntos
  const redeemPoints = async (amount: number, reward: string) => {
    if (!userId) {
      console.error('Usuario no autenticado')
      return null
    }

    if (amount > userPoints) {
      console.error('Puntos insuficientes')
      return null
    }

    try {
      // @ts-ignore
      const { data, error } = await supabase
        .rpc('redeem_loyalty_points', {
          user_id: userId,
          points: amount,
          reward: reward
        })

      if (error) throw error
      
      // Actualizar puntos localmente
      setUserPoints(prev => prev - amount)
      updateLevel(userPoints - amount)
      
      return data
    } catch (error) {
      console.error('Error canjeando puntos:', error)
      return null
    }
  }

  return {
    userPoints,
    level,
    nextLevel,
    progress,
    loading,
    earnPoints,
    redeemPoints,
    refreshPoints: fetchLoyaltyData
  }
}