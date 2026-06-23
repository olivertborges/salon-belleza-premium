// components/events/BeautyEvents.tsx
'use client'

import { motion } from 'framer-motion'
import { FaCalendar, FaUsers, FaMapMarkerAlt, FaTicket } from 'react-icons/fa'

export function BeautyEvents() {
  const events = [
    {
      id: 1,
      title: '✨ Masterclass de Microblading',
      description: 'Aprende técnicas avanzadas con expertos internacionales',
      date: '2024-01-25',
      time: '10:00 AM - 6:00 PM',
      location: 'Salón Premium - Sala de Eventos',
      price: 250,
      spots: 12,
      remaining: 8,
      instructor: 'Dra. Laura Martínez',
      type: 'presencial',
      includes: ['Materiales', 'Certificado', 'Coffee break'],
      image: '/events/microblading-masterclass.jpg'
    },
    {
      id: 2,
      title: '🎨 Nail Art Competition',
      description: 'Competencia de arte en uñas con premios increíbles',
      date: '2024-02-10',
      time: '9:00 AM - 5:00 PM',
      location: 'Salón Premium - Auditorio',
      price: 100,
      spots: 20,
      remaining: 5,
      instructor: 'Jueces internacionales',
      type: 'presencial',
      includes: ['Kit de participación', 'Premios', 'Networking'],
      image: '/events/nail-art.jpg'
    },
    {
      id: 3,
      title: '💻 Webinar: Cómo Crear tu Marca',
      description: 'Construye tu marca personal en el mundo de la belleza',
      date: '2024-01-30',
      time: '7:00 PM - 9:00 PM',
      location: 'Online - Zoom',
      price: 49,
      spots: 100,
      remaining: 67,
      instructor: 'María Fernández - Marketing Digital',
      type: 'online',
      includes: ['Material descargable', 'Grabación', 'Q&A'],
      image: '/events/webinar.jpg'
    }
  ]

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 shadow-2xl">
      <h2 className="text-3xl font-bold mb-2">🎪 Eventos y Talleres</h2>
      <p className="text-gray-600 mb-8">Experiencias únicas para aprender y conectar</p>

      <div className="space-y-4">
        {events.map((event) => (
          <motion.div
            key={event.id}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
            whileHover={{ x: 10 }}
          >
            <div className="grid grid-cols-4 gap-4 items-center">
              <div className="col-span-2">
                <h3 className="text-xl font-bold">{event.title}</h3>
                <p className="text-sm text-gray-600">{event.description}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1">
                    <FaCalendar className="text-purple-600" />
                    {event.date} - {event.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaMapMarkerAlt className="text-purple-600" />
                    {event.location}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
                    {event.type === 'presencial' ? '📍 Presencial' : '💻 Online'}
                  </span>
                  <span className="text-sm bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full">
                    {event.remaining} cupos disponibles
                  </span>
                </div>
              </div>

              <div className="text-center">
                <span className="text-3xl font-bold text-purple-600">${event.price}</span>
                <p className="text-sm text-gray-500">por persona</p>
              </div>

              <div>
                <motion.button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:shadow-lg transition-all"
                  whileHover={{ scale: 1.05 }}
                >
                  <FaTicket className="inline mr-2" />
                  Reservar
                </motion.button>
                <p className="text-xs text-gray-500 text-center mt-1">
                  {event.spots - event.remaining} personas ya se inscribieron
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}