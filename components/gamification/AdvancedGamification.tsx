// components/gamification/AdvancedGamification.tsx
'use client'

import { motion } from 'framer-motion'
import { FaTrophy, FaMedal, FaStar, FaLightbulb, FaRocket } from 'react-icons/fa'

export function AdvancedGamification() {
  const achievements = [
    {
      name: 'Primera Vez',
      description: 'Realizaste tu primer servicio',
      points: 50,
      unlocked: true,
      icon: '🌱'
    },
    {
      name: 'Cliente Fiel',
      description: '10 servicios completados',
      points: 100,
      unlocked: true,
      icon: '🌟'
    },
    {
      name: 'Embajador',
      description: '5 referidos exitosos',
      points: 200,
      unlocked: false,
      icon: '👑'
    },
    {
      name: 'Experto',
      description: '50 servicios completados',
      points: 500,
      unlocked: false,
      icon: '🏆'
    }
  ]

  const dailyChallenges = [
    'Reserva tu cita para mañana → +20 pts',
    'Comparte tu look en Instagram → +30 pts',
    'Deja una reseña de 5 estrellas → +25 pts',
    'Invita a un amigo a la academia → +50 pts'
  ]

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-3xl p-8 shadow-2xl">
      <div className="flex items-center gap-4 mb-8">
        <FaRocket className="text-5xl text-yellow-500" />
        <div>
          <h2 className="text-3xl font-bold">🎮 Sistema de Logros</h2>
          <p className="text-gray-600">Desbloquea logros y gana recompensas</p>
        </div>
      </div>

      {/* Puntos y nivel */}
      <div className="bg-white rounded-2xl p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">Tu nivel</p>
            <p className="text-3xl font-bold text-yellow-600">Nivel 7</p>
          </div>
          <div>
            <p className="text-gray-600">Puntos acumulados</p>
            <p className="text-3xl font-bold text-yellow-600">1,245 pts</p>
          </div>
          <div>
            <p className="text-gray-600">Próximo nivel</p>
            <p className="text-3xl font-bold text-yellow-600">255 pts</p>
          </div>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full mt-4 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 to-amber-500"
            initial={{ width: 0 }}
            animate={{ width: '65%' }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>

      {/* Logros */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {achievements.map((ach, idx) => (
          <motion.div
            key={idx}
            className={`p-4 rounded-xl text-center ${
              ach.unlocked
                ? 'bg-gradient-to-br from-yellow-400 to-amber-400 text-white shadow-lg'
                : 'bg-gray-200 text-gray-500'
            }`}
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-4xl mb-2">{ach.icon}</div>
            <p className="font-bold text-sm">{ach.name}</p>
            <p className="text-xs opacity-90">{ach.points} pts</p>
          </motion.div>
        ))}
      </div>

      {/* Desafíos diarios */}
      <div className="bg-white rounded-2xl p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <FaLightbulb className="text-yellow-500" />
          Desafíos Diarios
        </h3>
        <div className="space-y-2">
          {dailyChallenges.map((challenge, idx) => (
            <motion.div
              key={idx}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl hover:from-yellow-100 hover:to-amber-100 transition-all"
              whileHover={{ x: 5 }}
            >
              <span className="text-sm">{challenge}</span>
              <button className="bg-yellow-500 text-white px-4 py-1 rounded-lg text-sm font-bold">
                Completar
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}