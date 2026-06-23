// components/sections/HeroSection.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FaWhatsapp, FaCalendarAlt, FaVideo } from 'react-icons/fa'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-purple-100/50 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-r from-pink-100/50 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 gap-12 items-center">
          {/* Contenido izquierdo */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.span
              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              ⭐ Salón de Belleza Premium
            </motion.span>

            <motion.h1
              className="text-6xl font-bold leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-transparent bg-clip-text">
                Belleza & Estilo
              </span>
              <br />
              <span className="text-gray-800">para Ti</span>
            </motion.h1>

            <motion.p
              className="text-xl text-gray-600 mb-8 max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Descubre la experiencia de belleza más exclusiva. 
              Reserva tu cita y transforma tu estilo con nuestros expertos.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link href="/reservas">
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2">
                  <FaCalendarAlt /> Reservar ahora
                </button>
              </Link>
              <Link href="/cursos">
                <button className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-xl font-bold hover:bg-purple-50 transition-all flex items-center gap-2">
                  <FaVideo /> Ver cursos
                </button>
              </Link>
              <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer">
                <button className="bg-green-500 text-white px-6 py-4 rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2">
                  <FaWhatsapp /> WhatsApp
                </button>
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="flex gap-8 mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {[
                { number: '500+', label: 'Clientes felices' },
                { number: '4.9⭐', label: 'Calificación' },
                { number: '12+', label: 'Años de experiencia' }
              ].map((stat, idx) => (
                <div key={idx}>
                  <p className="text-2xl font-bold text-purple-600">{stat.number}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Imagen derecha */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative">
              {/* Imagen principal */}
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop"
                  alt="Salón de Belleza"
                  className="w-full h-[500px] object-cover"
                />
              </div>

              {/* Badge flotante 1 */}
              <motion.div
                className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: 'spring' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-2xl">💄</div>
                  <div>
                    <p className="font-bold text-sm">Nuevos servicios</p>
                    <p className="text-xs text-gray-500">Micropigmentación</p>
                  </div>
                </div>
              </motion.div>

              {/* Badge flotante 2 */}
              <motion.div
                className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: 'spring' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-2xl">⭐</div>
                  <div>
                    <p className="font-bold text-sm">4.9/5</p>
                    <p className="text-xs text-gray-500">156 reseñas</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}