// components/memberships/VIPMembership.tsx
'use client'

import { motion } from 'framer-motion'
import { FaCrown, FaGift, FaStar, FaCalendar } from 'react-icons/fa'

export function VIPMembership() {
  const memberships = [
    {
      tier: 'SILVER',
      price: '$49/mes',
      benefits: [
        '10% descuento en todos los servicios',
        'Prioridad en reservas (48h antes)',
        '1 servicio de cortesía al año',
        'Acceso a promociones exclusivas',
        'Cumpleaños con regalo especial'
      ],
      color: 'from-gray-400 to-gray-300'
    },
    {
      tier: 'GOLD',
      price: '$99/mes',
      benefits: [
        '20% descuento en todos los servicios',
        'Prioridad VIP en reservas (72h antes)',
        '2 servicios de cortesía al año',
        'Descuento en productos (15%)',
        'Acceso a eventos exclusivos',
        'Estilista personal asignado',
        'Invitación a lanzamientos de colecciones'
      ],
      color: 'from-yellow-400 to-amber-500',
      recommended: true
    },
    {
      tier: 'PLATINUM',
      price: '$199/mes',
      benefits: [
        '30% descuento en todos los servicios',
        'Reserva exclusiva con 7 días de anticipación',
        '4 servicios de cortesía al año',
        'Descuento en productos (25%)',
        'Acceso a eventos VIP con celebridades',
        'Servicio a domicilio incluido (2 veces al mes)',
        'Asesor de imagen personal',
        'Kit de productos premium mensual',
        'Acceso a colecciones de lujo',
        'Descuentos en cursos de la academia'
      ],
      color: 'from-purple-500 to-pink-500'
    }
  ]

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <FaCrown className="text-5xl text-yellow-500 mx-auto mb-4" />
        <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text">
          👑 Membresías VIP
        </h2>
        <p className="text-gray-600">Beneficios exclusivos para clientes premium</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {memberships.map((plan, idx) => (
          <motion.div
            key={idx}
            className={`relative bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all ${
              plan.recommended ? 'ring-2 ring-yellow-400 transform scale-105' : ''
            }`}
            whileHover={{ y: -10 }}
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                ⭐ Más popular
              </div>
            )}

            <h3 className="text-2xl font-bold mb-2">{plan.tier}</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold">{plan.price}</span>
            </div>

            <ul className="space-y-2 mb-6">
              {plan.benefits.map((benefit, bIdx) => (
                <li key={bIdx} className="text-sm flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  {benefit}
                </li>
              ))}
            </ul>

            <button className={`w-full py-3 rounded-xl font-bold text-white ${
              plan.recommended
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                : 'bg-gradient-to-r from-gray-600 to-gray-700'
            } hover:shadow-lg transition-all`}>
              Unirse ahora
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}