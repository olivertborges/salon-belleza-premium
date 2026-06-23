// components/referrals/AffiliateSystem.tsx
'use client'

import { motion } from 'framer-motion'
import { FaLink, FaShare, FaWhatsapp, FaInstagram, FaFacebook, FaTwitter, FaCopy } from 'react-icons/fa'

export function AffiliateSystem() {
  const affiliateStats = {
    totalEarnings: 2480,
    referrals: 45,
    conversions: 38,
    conversionRate: 84.4,
    topAffiliates: [
      { name: 'María G.', referrals: 12, earnings: 780 },
      { name: 'Carlos P.', referrals: 9, earnings: 540 },
      { name: 'Ana M.', referrals: 7, earnings: 420 }
    ]
  }

  const commissions = [
    { type: 'Servicios de Belleza', commission: '10%', description: 'Por cada servicio reservado' },
    { type: 'Cursos Academia', commission: '15%', description: 'Por cada inscripción' },
    { type: 'Productos Tienda', commission: '8%', description: 'Por cada compra' },
    { type: 'Membresías VIP', commission: '20%', description: 'Por cada membresía activa' }
  ]

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold">🤝 Programa de Afiliados</h2>
          <p className="text-gray-600">Gana comisiones por recomendar nuestros servicios</p>
        </div>
        <motion.button
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold"
          whileHover={{ scale: 1.05 }}
        >
          <FaLink className="inline mr-2" />
          Generar enlace
        </motion.button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Ganancias Totales', value: `$${affiliateStats.totalEarnings}`, icon: '💰' },
          { label: 'Referidos Totales', value: affiliateStats.referrals, icon: '👥' },
          { label: 'Conversiones', value: affiliateStats.conversions, icon: '📊' },
          { label: 'Tasa de Conversión', value: `${affiliateStats.conversionRate}%`, icon: '📈' }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            className="bg-white rounded-xl p-4 shadow-md text-center"
            whileHover={{ y: -5 }}
          >
            <div className="text-3xl mb-1">{stat.icon}</div>
            <p className="text-2xl font-bold text-green-600">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabla de comisiones */}
      <div className="bg-white rounded-2xl p-6 mb-8">
        <h3 className="font-bold mb-4">💵 Tabla de Comisiones</h3>
        <div className="grid grid-cols-4 gap-4">
          {commissions.map((item, idx) => (
            <div key={idx} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
              <p className="font-bold">{item.type}</p>
              <p className="text-2xl font-bold text-green-600">{item.commission}</p>
              <p className="text-xs text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Afiliados */}
      <div className="bg-white rounded-2xl p-6">
        <h3 className="font-bold mb-4">🏆 Top Afiliados</h3>
        <div className="space-y-3">
          {affiliateStats.topAffiliates.map((aff, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                </span>
                <span className="font-medium">{aff.name}</span>
              </div>
              <div className="flex gap-6">
                <span className="text-gray-600">{aff.referrals} referidos</span>
                <span className="text-green-600 font-bold">${aff.earnings}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compartir */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 mb-3">Comparte tu enlace de afiliado en redes sociales</p>
        <div className="flex justify-center gap-4">
          {[FaWhatsapp, FaInstagram, FaFacebook, FaTwitter, FaCopy].map((Icon, idx) => (
            <motion.button
              key={idx}
              className={`p-3 rounded-full text-white shadow-lg ${
                idx === 0 ? 'bg-green-500' :
                idx === 1 ? 'bg-pink-600' :
                idx === 2 ? 'bg-blue-600' :
                idx === 3 ? 'bg-cyan-500' :
                'bg-gray-600'
              }`}
              whileHover={{ scale: 1.1 }}
            >
              <Icon />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}