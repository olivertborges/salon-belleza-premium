// components/sections/CTASection.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FaCalendarAlt, FaWhatsapp, FaRocket } from 'react-icons/fa'

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center text-white max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="text-6xl mb-4"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            ✨
          </motion.div>
          
          <h2 className="text-4xl font-bold mb-4">
            ¿Listo para transformar tu look?
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Reserva tu cita ahora y descubre la experiencia de belleza premium.
            ¡Te esperamos con los brazos abiertos!
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/reservas">
              <motion.button
                className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaCalendarAlt /> Reservar ahora
              </motion.button>
            </Link>
            <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer">
              <motion.button
                className="bg-green-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaWhatsapp /> WhatsApp
              </motion.button>
            </a>
            <Link href="/cursos">
              <motion.button
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaRocket /> Ver cursos
              </motion.button>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-8 text-sm opacity-80">
            <div>
              <p className="font-bold text-lg">📅 24/7</p>
              <p>Reservas online</p>
            </div>
            <div>
              <p className="font-bold text-lg">⭐ 4.9/5</p>
              <p>Calificación promedio</p>
            </div>
            <div>
              <p className="font-bold text-lg">💳</p>
              <p>Múltiples formas de pago</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}