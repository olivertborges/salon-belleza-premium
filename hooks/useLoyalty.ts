// hooks/useLoyalty.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useLoyalty() {
  const [userPoints, setUserPoints] = useState(0)
  const [level, setLevel] = useState(null)
  const [nextLevel, setNextLevel] = useState(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    fetchLoyaltyData()
    subscribeToPoints()
  }, [])

  const fetchLoyaltyData = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('loyalty_points, level')
      .eq('id', userId)
      .single()

    setUserPoints(data.loyalty_points)
    updateLevel(data.loyalty_points)
  }

  const updateLevel = (points: number) => {
    const levels = {
      BRONZE: 0,
      SILVER: 500,
      GOLD: 1500,
      PLATINUM: 3500,
      DIAMOND: 8000
    }

    let currentLevel = 'BRONZE'
    for (const [name, threshold] of Object.entries(levels)) {
      if (points >= threshold) currentLevel = name
    }

    setLevel(currentLevel)
    
    // Calcular progreso
    const currentThreshold = levels[currentLevel]
    const nextThreshold = levels[getNextLevel(currentLevel)]
    const progress = ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    setProgress(Math.min(progress, 100))
  }

  const subscribeToPoints = () => {
    supabase
      .channel('loyalty_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`
      }, (payload) => {
        setUserPoints(payload.new.loyalty_points)
        updateLevel(payload.new.loyalty_points)
      })
      .subscribe()
  }

  const earnPoints = async (amount: number, reason: string) => {
    const { data } = await supabase
      .rpc('earn_loyalty_points', {
        user_id: userId,
        points: amount,
        reason: reason
      })
    return data
  }

  const redeemPoints = async (amount: number, reward: string) => {
    const { data } = await supabase
      .rpc('redeem_loyalty_points', {
        user_id: userId,
        points: amount,
        reward: reward
      })
    return data
  }

  return {
    userPoints,
    level,
    nextLevel,
    progress,
    earnPoints,
    redeemPoints
  }
}