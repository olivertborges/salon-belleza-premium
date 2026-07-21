// components/loyalty/LoyaltyDashboard.tsx
// @ts-nocheck
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useLoyalty } from '@/hooks/useLoyalty'
import confetti from 'canvas-confetti'
import { useState, useEffect } from 'react'

export function LoyaltyDashboard() {
  const { userPoints, level, nextLevel, progress, benefits } = useLoyalty()
  const [showLevelUp, setShowLevelUp] = useState(false)

  useEffect(() => {
    // Detectar subida de nivel
    if (progress >= 100) {
      setShowLevelUp(true)
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      setTimeout(() => setShowLevelUp(false), 3000)
    }
  }, [progress])

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 shadow-2xl">
      {/* Nivel actual */}
      <motion.div 
        className="text-center relative"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="text-6xl mb-2">{level.emoji}</div>
        <h2 className="text-3xl font-bold" style={{ color: level.color }}>
          {level.name}
        </h2>
        <p className="text-gray-600">{userPoints} puntos acumulados</p>
      </motion.div>

      {/* Barra de progreso animada */}
      <div className="mt-6 relative">
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ 
              background: `linear-gradient(90deg, ${level.color}, ${nextLevel?.color})`,
              width: `${progress}%`
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {nextLevel ? `Faltan ${nextLevel.pointsNeeded - userPoints} pts para ${nextLevel.name}` : '¡Nivel máximo alcanzado!'}
        </p>
      </div>

      {/* Beneficios */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        {benefits.map((benefit, index) => (
          <motion.div
            key={index}
            className="bg-white/80 backdrop-blur p-3 rounded-xl shadow-md"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-sm">{benefit}</span>
          </motion.div>
        ))}
      </div>

      {/* Challenges diarios */}
      <div className="mt-8 bg-white/90 backdrop-blur p-4 rounded-xl">
        <h3 className="font-bold mb-3">⚡ Misiones del día</h3>
        {challenges.daily.map((challenge, idx) => (
          <motion.div
            key={idx}
            className="flex items-center justify-between py-2 border-b last:border-0"
            whileHover={{ x: 10 }}
          >
            <span>{challenge}</span>
            <button className="text-purple-600 font-bold text-sm">
              Completar →
            </button>
          </motion.div>
        ))}
      </div>

      {/* Animación de level up */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
          >
            <div className="bg-gradient-to-r from-yellow-400 to-pink-500 p-12 rounded-3xl shadow-2xl text-white text-center">
              <h1 className="text-6xl font-bold">🎉</h1>
              <h2 className="text-4xl font-bold">¡NIVEL UP!</h2>
              <p>Has alcanzado el nivel {level.name}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}