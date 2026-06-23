// components/sections/ServicesSection.tsx
'use client'

import { motion } from 'framer-motion'
import { FaCut, FaPaintBrush, FaMagic, FaHandSparkles, FaSprayCan, FaGraduationCap } from 'react-icons/fa'

export function ServicesSection() {
  const services = [
    {
      icon: <FaCut className="text-3xl" />,
      title: 'Cortes y Peinados',
      description: 'Cortes modernos, clásicos y peinados para toda ocasión.',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: <FaPaintBrush className="text-3xl" />,
      title: 'Coloración',
      description: 'Coloración, reflejos, balayage y técnicas avanzadas.',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      icon: <FaMagic className="text-3xl" />,
      title: 'Micropigmentación',
      description: 'Cejas, labios y pestañas con técnicas profesionales.',
      color: 'from-amber-500 to-orange-500'
    },
    {
      icon: <FaHandSparkles className="text-3xl" />,
      title: 'Uñas y Manicura',
      description: 'Uñas acrílicas, gel, esmaltado y nail art profesional.',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: <FaSprayCan className="text-3xl" />,
      title: 'Tratamientos Capilares',
      description: 'Nutrición, hidratación y tratamientos de keratina.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <FaGraduationCap className="text-3xl" />,
      title: 'Cursos y Academia',
      description: 'Formación profesional en todas las técnicas de belleza.',
      color: 'from-violet-500 to-purple-500'
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <span className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
            Nuestros Servicios
          </span>
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Servicios Profesionales
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Ofrecemos una amplia gama de servicios de belleza con los más altos estándares de calidad.
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-6">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all group cursor-pointer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                {service.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{service.title}</h3>
              <p className="text-gray-600 text-sm">{service.description}</p>
              <button className="mt-4 text-purple-600 font-medium hover:text-purple-800 transition-colors text-sm">
                Saber más →
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}