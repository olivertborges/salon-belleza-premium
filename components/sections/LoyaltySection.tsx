// components/sections/LoyaltySection.tsx
'use client'

import { motion } from 'framer-motion'
import { FaCrown, FaStar, FaGift, FaTrophy, FaRocket } from 'react-icons/fa'

export function LoyaltySection() {
  const levels = [
    {
      name: 'Bronce',
      icon: '🥉',
      points: '0-499',
      benefits: ['5% descuento', '1 punto por $1', 'Welcome drink'],
      color: 'from-amber-700 to-amber-600'
    },
    {
      name: 'Plata',
      icon: '🥈',
      points: '500-1499',
      benefits: ['10% descuento', '1.5 puntos por $1', 'Prioridad en reservas'],
      color: 'from-gray-400 to-gray-300'
    },
    {
      name: 'Oro',
      icon: '🥇',
      points: '1500-4999',
      benefits: ['15% descuento', '2 puntos por $1', 'Estilista personal'],
      color: 'from-yellow-400 to-amber-500'
    },
    {
      name: 'Diamante',
      icon: '💎',
      points: '5000+',
      benefits: ['25% descuento', '3 puntos por $1', 'Servicio VIP', 'Eventos exclusivos'],
      color: 'from-blue-400 to-cyan-400'
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <span className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
            Programa de Fidelización
          </span>
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              ¡Gana Puntos y Sube de Nivel!
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Cada visita te acerca a más beneficios y experiencias exclusivas.
          </p>
        </motion.div>

        <div className="grid grid-cols-4 gap-6">
          {levels.map((level, idx) => (
            <motion.div
              key={idx}
              className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
            >
              <div className="text-5xl mb-4">{level.icon}</div>
              <h3 className={`text-2xl font-bold bg-gradient-to-r ${level.color} text-transparent bg-clip-text`}>
                {level.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{level.points} puntos</p>
              <ul className="text-left space-y-2 mb-4">
                {level.benefits.map((benefit, bIdx) => (
                  <li key={bIdx} className="text-sm flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-xl font-bold text-sm hover:shadow-lg transition-all">
                Ver detalles
              </button>
            </motion.div>
          ))}
        </div>

        {/* Beneficios adicionales */}
        <motion.div
          className="mt-12 grid grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
        >
          {[
            { icon: <FaGift />, title: 'Cumpleaños', desc: 'Descuento especial en tu mes' },
            { icon: <FaTrophy />, title: 'Logros', desc: 'Badges y reconocimientos' },
            { icon: <FaRocket />, title: 'Misiones', desc: 'Desafíos diarios con puntos extra' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl text-purple-600">
                {item.icon}
              </div>
              <div>
                <h4 className="font-bold">{item.title}</h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}