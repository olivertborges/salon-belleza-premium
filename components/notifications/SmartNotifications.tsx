// components/notifications/SmartNotifications.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBell, FaTimes, FaGift, FaCalendar, FaStar, FaRocket } from 'react-icons/fa'

export function SmartNotifications() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'promo',
      title: '🔥 30% Descuento en Servicios',
      message: 'Por tiempo limitado, aprovecha nuestro descuento especial en servicios de micropigmentación',
      time: 'Hace 2 horas',
      read: false,
      icon: <FaGift />,
      color: 'from-red-500 to-orange-500'
    },
    {
      id: 2,
      type: 'reminder',
      title: '📅 Recordatorio de Cita',
      message: 'Tienes una cita mañana a las 10:00 AM con la Dra. Laura',
      time: 'Hace 5 horas',
      read: false,
      icon: <FaCalendar />,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 3,
      type: 'achievement',
      title: '🏆 Logro Desbloqueado',
      message: 'Has completado 10 servicios - ¡Nivel Experto!',
      time: 'Hace 1 día',
      read: true,
      icon: <FaStar />,
      color: 'from-yellow-500 to-amber-500'
    }
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="relative">
      <button
        className="relative p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaBell className="text-xl text-purple-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-14 right-0 w-96 bg-white rounded-2xl shadow-2xl overflow-hidden z-50"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
          >
            <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold">Notificaciones</h3>
                <p className="text-xs opacity-90">{unreadCount} no leídas</p>
              </div>
              <button className="text-white/80 hover:text-white" onClick={() => setIsOpen(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  className={`p-4 border-b hover:bg-gray-50 transition-all ${
                    !notif.read ? 'bg-purple-50' : ''
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 * notif.id }}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${notif.color} flex items-center justify-center text-white flex-shrink-0`}>
                      {notif.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-sm text-gray-600">{notif.message}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-400">{notif.time}</p>
                        <button className="text-xs text-purple-600 hover:text-purple-800 font-medium">
                          Marcar como leída
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-3 bg-gray-50 text-center">
              <button className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                Ver todas las notificaciones
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}