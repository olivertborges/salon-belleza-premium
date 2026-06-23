// components/subscriptions/SubscriptionPlans.tsx
'use client'

import { motion } from 'framer-motion'
import { FaCheck, FaGift, FaCalendar, FaStar } from 'react-icons/fa'

export function SubscriptionPlans() {
  const plans = [
    {
      id: 'basico',
      name: 'Básico',
      price: 49,
      services: 2,
      features: [
        '2 servicios al mes',
        'Descuento 5% en productos',
        'Acceso a eventos básicos',
        'Newsletter exclusiva'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 99,
      services: 4,
      features: [
        '4 servicios al mes',
        'Descuento 15% en productos',
        'Acceso a eventos VIP',
        'Prioridad en agenda',
        'Estilista personal',
        '1 servicio de cortesía extra'
      ],
      popular: true
    },
    {
      id: 'vip',
      name: 'VIP',
      price: 199,
      services: 8,
      features: [
        '8 servicios al mes',
        'Descuento 25% en productos',
        'Eventos exclusivos',
        'Agenda prioritaria 72h',
        'Estilista personal dedicado',
        '3 servicios de cortesía extra',
        'Servicio a domicilio',
        'Kit de bienvenida premium'
      ]
    }
  ]

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">📅 Planes de Suscripción</h2>
        <p className="text-gray-600">Elige el plan que mejor se adapte a ti</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            className={`relative bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all ${
              plan.popular ? 'ring-2 ring-blue-500 transform scale-105' : ''
            }`}
            whileHover={{ y: -10 }}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                ⭐ Más popular
              </div>
            )}

            <h3 className="text-2xl font-bold text-center">{plan.name}</h3>
            <div className="text-center my-4">
              <span className="text-4xl font-bold text-blue-600">${plan.price}</span>
              <span className="text-gray-500">/mes</span>
            </div>
            <p className="text-center text-gray-600 text-sm mb-4">
              {plan.services} servicios incluidos
            </p>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <FaCheck className="text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <motion.button
              className={`w-full py-3 rounded-xl font-bold text-white ${
                plan.popular
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                  : 'bg-gray-600 hover:bg-gray-700'
              } transition-all`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Suscribirse ahora
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}