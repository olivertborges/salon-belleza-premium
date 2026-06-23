// components/analytics/BusinessAnalytics.tsx
'use client'

import { motion } from 'framer-motion'
import { FaChartLine, FaUsers, FaDollarSign, FaClock, FaArrowUp, FaArrowDown } from 'react-icons/fa'

export function BusinessAnalytics() {
  const metrics = {
    revenue: {
      total: 45230,
      growth: 12.5,
      previous: 40200
    },
    clients: {
      total: 245,
      new: 18,
      returning: 82
    },
    appointments: {
      total: 312,
      completion: 94,
      cancellation: 6
    },
    courses: {
      total: 156,
      active: 12,
      completion: 78
    }
  }

  const popularServices = [
    { name: 'Microblading', revenue: 12450, percentage: 27.5 },
    { name: 'Coloración', revenue: 9800, percentage: 21.7 },
    { name: 'Uñas Acrílicas', revenue: 8600, percentage: 19.0 },
    { name: 'Tratamientos', revenue: 7200, percentage: 15.9 },
    { name: 'Cursos', revenue: 7180, percentage: 15.9 }
  ]

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl">
      <h2 className="text-3xl font-bold mb-6">📊 Analytics de Negocio</h2>

      {/* Métricas principales */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { 
            label: 'Ingresos Totales', 
            value: `$${metrics.revenue.total.toLocaleString()}`, 
            growth: metrics.revenue.growth,
            icon: <FaDollarSign />,
            color: 'from-green-500 to-emerald-500'
          },
          { 
            label: 'Clientes Activos', 
            value: metrics.clients.total, 
            growth: 8.2,
            icon: <FaUsers />,
            color: 'from-blue-500 to-cyan-500'
          },
          { 
            label: 'Citas Completadas', 
            value: `${metrics.appointments.completion}%`, 
            growth: 4.5,
            icon: <FaClock />,
            color: 'from-purple-500 to-pink-500'
          },
          { 
            label: 'Tasa de Retención', 
            value: `${metrics.clients.returning}%`, 
            growth: 6.3,
            icon: <FaChartLine />,
            color: 'from-yellow-500 to-amber-500'
          }
        ].map((metric, idx) => (
          <motion.div
            key={idx}
            className={`bg-gradient-to-br ${metric.color} p-6 rounded-2xl text-white shadow-lg`}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-start justify-between">
              <div className="text-3xl">{metric.icon}</div>
              <span className={`text-sm ${metric.growth > 0 ? 'bg-white/20' : 'bg-red-500/30'} px-2 py-1 rounded-full`}>
                {metric.growth > 0 ? <FaArrowUp className="inline" /> : <FaArrowDown className="inline" />}
                {metric.growth}%
              </span>
            </div>
            <p className="text-2xl font-bold mt-3">{metric.value}</p>
            <p className="text-sm opacity-90">{metric.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Servicios populares */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-2xl p-6">
          <h3 className="font-bold mb-4">🌟 Servicios Más Populares</h3>
          <div className="space-y-3">
            {popularServices.map((service, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm">
                  <span>{service.name}</span>
                  <span className="font-bold">${service.revenue.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${service.percentage}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6">
          <h3 className="font-bold mb-4">📈 Tendencia de Citas</h3>
          <div className="h-48 flex items-end justify-between gap-2">
            {[
              { day: 'Lun', value: 45 },
              { day: 'Mar', value: 52 },
              { day: 'Mié', value: 38 },
              { day: 'Jue', value: 61 },
              { day: 'Vie', value: 73 },
              { day: 'Sáb', value: 68 },
              { day: 'Dom', value: 25 }
            ].map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <motion.div
                  className="w-full bg-gradient-to-t from-purple-600 to-pink-600 rounded-t-lg"
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.value / 73) * 100}%` }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                />
                <p className="text-xs text-gray-500 mt-2">{day.day}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}