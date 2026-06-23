// components/referrals/ReferralSystem.tsx
'use client'

import { motion } from 'framer-motion'
import { useReferrals } from '@/hooks/useReferrals'
import { FaShare, FaWhatsapp, FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa'

export function ReferralSystem() {
  const { referralCode, referrals, rewards, shareOnSocial } = useReferrals()

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-3xl font-bold text-center mb-6">
        🌟 Invita y Gana
      </h2>

      {/* Código de referido */}
      <div className="bg-white p-6 rounded-xl shadow-inner text-center">
        <p className="text-sm text-gray-500">Tu código único</p>
        <div className="text-3xl font-mono font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-transparent bg-clip-text">
          {referralCode}
        </div>
        <button 
          className="mt-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-3 rounded-xl hover:shadow-lg"
          onClick={() => navigator.clipboard.writeText(referralCode)}
        >
          📋 Copiar código
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <motion.div 
          className="bg-white p-4 rounded-xl text-center shadow-md"
          whileHover={{ y: -5 }}
        >
          <p className="text-2xl font-bold text-amber-600">{referrals.total}</p>
          <p className="text-sm text-gray-500">Amigos invitados</p>
        </motion.div>
        <motion.div 
          className="bg-white p-4 rounded-xl text-center shadow-md"
          whileHover={{ y: -5 }}
        >
          <p className="text-2xl font-bold text-orange-600">{referrals.converted}</p>
          <p className="text-sm text-gray-500">Conversiones</p>
        </motion.div>
        <motion.div 
          className="bg-white p-4 rounded-xl text-center shadow-md"
          whileHover={{ y: -5 }}
        >
          <p className="text-2xl font-bold text-yellow-600">+{rewards.earned}</p>
          <p className="text-sm text-gray-500">Puntos ganados</p>
        </motion.div>
      </div>

      {/* Recompensas */}
      <div className="mt-6 bg-white/90 backdrop-blur p-6 rounded-xl">
        <h3 className="font-bold mb-4">🎁 Recompensas por referir</h3>
        <div className="space-y-3">
          {[
            { level: '1 amigo', reward: '100 puntos + 5% descuento' },
            { level: '3 amigos', reward: '300 puntos + 15% descuento' },
            { level: '5 amigos', reward: '500 puntos + Servicio gratis' },
            { level: '10 amigos', reward: '1000 puntos + Nivel VIP' },
          ].map((item, idx) => (
            <div key={idx} className="flex justify-between items-center border-b pb-2">
              <span>{item.level}</span>
              <span className="text-amber-600 font-bold">{item.reward}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Compartir en redes */}
      <div className="flex justify-center gap-4 mt-6">
        <motion.button
          className="bg-green-500 text-white p-4 rounded-full shadow-lg"
          whileHover={{ scale: 1.1 }}
          onClick={() => shareOnSocial('whatsapp')}
        >
          <FaWhatsapp className="text-2xl" />
        </motion.button>
        <motion.button
          className="bg-pink-600 text-white p-4 rounded-full shadow-lg"
          whileHover={{ scale: 1.1 }}
          onClick={() => shareOnSocial('instagram')}
        >
          <FaInstagram className="text-2xl" />
        </motion.button>
        <motion.button
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg"
          whileHover={{ scale: 1.1 }}
          onClick={() => shareOnSocial('facebook')}
        >
          <FaFacebook className="text-2xl" />
        </motion.button>
        <motion.button
          className="bg-cyan-500 text-white p-4 rounded-full shadow-lg"
          whileHover={{ scale: 1.1 }}
          onClick={() => shareOnSocial('twitter')}
        >
          <FaTwitter className="text-2xl" />
        </motion.button>
      </div>
    </div>
  )
}