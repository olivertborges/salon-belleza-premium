// app/academy/page.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FaGraduationCap, FaClock, FaUsers, FaCertificate, FaStar } from 'react-icons/fa'

export default function AcademyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <span className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold mb-6">
              🎓 Academia de Belleza Premium
            </span>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
              Convierte tu Pasión en Profesión
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Formación profesional en uñas, micropigmentación y microblading con certificación internacional.
              Aprende de los mejores y construye tu futuro en el mundo de la belleza.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-xl transition-all">
                Ver todos los cursos ↓
              </button>
              <button className="border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition-all">
                Solicitar información
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 mt-12">
              {[
                { number: '12+', label: 'Cursos', icon: '📚' },
                { number: '2,450+', label: 'Estudiantes', icon: '👨‍🎓' },
                { number: '4.9⭐', label: 'Calificación', icon: '⭐' },
                { number: '95%', label: 'Empleabilidad', icon: '💼' }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg"
                  whileHover={{ y: -5 }}
                >
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-bold text-indigo-600">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-3 gap-6">
          {[
            { 
              name: '💅 Uñas', 
              courses: 4, 
              color: 'from-pink-500 to-rose-500',
              icon: '💅',
              desc: 'Desde básico hasta master en uñas'
            },
            { 
              name: '👁️ Micropigmentación', 
              courses: 5, 
              color: 'from-purple-500 to-indigo-500',
              icon: '👁️',
              desc: 'Cejas, labios y técnicas avanzadas'
            },
            { 
              name: '✍️ Microblading', 
              courses: 4, 
              color: 'from-blue-500 to-cyan-500',
              icon: '✍️',
              desc: 'Pelo por pelo, powder y más'
            }
          ].map((cat, idx) => (
            <motion.div
              key={idx}
              className={`bg-gradient-to-br ${cat.color} p-8 rounded-3xl text-white shadow-xl cursor-pointer`}
              whileHover={{ scale: 1.03 }}
            >
              <div className="text-5xl mb-4">{cat.icon}</div>
              <h3 className="text-2xl font-bold">{cat.name}</h3>
              <p className="text-sm opacity-90 mb-2">{cat.desc}</p>
              <p className="text-sm opacity-75">{cat.courses} cursos disponibles</p>
              <button className="mt-4 bg-white/20 backdrop-blur px-6 py-2 rounded-xl text-sm font-bold hover:bg-white/30 transition-all">
                Ver cursos →
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* LISTA DE CURSOS - UÑAS */}
      <section className="container mx-auto px-4 py-12" id="cursos-unas">
        <div className="mb-8">
          <span className="text-4xl mr-3">💅</span>
          <h2 className="text-3xl font-bold inline">Cursos de Uñas</h2>
          <p className="text-gray-600 mt-2">Domina el arte de las uñas desde cero hasta nivel experto</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Curso Uñas Básico */}
          <motion.div
            className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all"
            whileHover={{ y: -5 }}
          >
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Nivel Básico</span>
                  <h3 className="text-2xl font-bold mt-2">Uñas Básico</h3>
                </div>
                <span className="text-2xl font-bold">$1,200</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">40 horas</span>
                <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">5 días</span>
                <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">12 estudiantes</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Aprende desde cero: anatomía, manicura, uñas acrílicas básicas y decoración.
                Incluye kit de herramientas.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <FaCertificate className="text-pink-500" />
                <span>Certificación Básica</span>
                <span className="mx-2">•</span>
                <FaStar className="text-yellow-400" />
                <span>4.8⭐ (156 reseñas)</span>
              </div>
              <Link href="/academy/cursos/unas-basico">
                <button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all">
                  Ver detalles del curso →
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Curso Uñas Avanzado */}
          <motion.div
            className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all"
            whileHover={{ y: -5 }}
          >
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Nivel Intermedio</span>
                  <h3 className="text-2xl font-bold mt-2">Uñas Avanzado</h3>
                </div>
                <span className="text-2xl font-bold">$2,200</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">60 horas</span>
                <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">8 días</span>
                <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">10 estudiantes</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Domina gel, acrílico avanzado, nail art profesional y gestión de negocio.
                Incluye kit avanzado.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <FaCertificate className="text-purple-500" />
                <span>Certificación Profesional</span>
                <span className="mx-2">•</span>
                <FaStar className="text-yellow-400" />
                <span>4.9⭐ (98 reseñas)</span>
              </div>
              <Link href="/academy/cursos/unas-avanzado">
                <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all">
                  Ver detalles del curso →
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Curso Uñas Master */}
          <motion.div
            className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all col-span-2"
            whileHover={{ y: -5 }}
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Nivel Master</span>
                  <h3 className="text-2xl font-bold mt-2">👑 Uñas Master</h3>
                  <span className="text-xs bg-yellow-400/30 px-3 py-1 rounded-full">⭐ Más exclusivo</span>
                </div>
                <span className="text-2xl font-bold">$3,800</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">80 horas</span>
                <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">10 días</span>
                <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">8 estudiantes</span>
                <span className="text-sm bg-amber-100 text-amber-600 px-3 py-1 rounded-full">✨ Incluye todo</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Técnicas de alta especialización, nail art de alta gama, gestión avanzada de negocio
                y masterclass con instructores internacionales. Kit master valor $800.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <FaCertificate className="text-amber-500" />
                <span>Certificación Internacional</span>
                <span className="mx-2">•</span>
                <FaStar className="text-yellow-400" />
                <span>5.0⭐ (67 reseñas)</span>
              </div>
              <Link href="/academy/cursos/unas-master">
                <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all">
                  Ver detalles del curso →
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* LISTA DE CURSOS - MICROPIGMENTACIÓN */}
      <section className="container mx-auto px-4 py-12 bg-gradient-to-b from-purple-50 to-indigo-50 rounded-3xl">
        <div className="mb-8">
          <span className="text-4xl mr-3">👁️</span>
          <h2 className="text-3xl font-bold inline">Cursos de Micropigmentación</h2>
          <p className="text-gray-600 mt-2">Especialízate en técnicas avanzadas de micropigmentación</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Curso Fundamentos */}
          <motion.div
            className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all"
            whileHover={{ y: -5 }}
          >
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Nivel Básico</span>
                  <h3 className="text-xl font-bold mt-1">Fundamentos</h3>
                </div>
                <span className="text-xl font-bold">$2,500</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-1 mb-3">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">50h</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">6 días</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">8 estudiantes</span>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Biología, colorimetría, diseño de cejas y técnicas básicas de implantación.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <FaCertificate className="text-indigo-500" />
                <span>Certificación Básica</span>
              </div>
              <Link href="/academy/cursos/micropigmentacion-fundamentos">
                <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 rounded-xl text-sm font-bold hover:shadow-lg transition-all">
                  Ver detalles →
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Curso Microblading Pro */}
          <motion.div
            className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all"
            whileHover={{ y: -5 }}
          >
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Nivel Intermedio</span>
                  <h3 className="text-xl font-bold mt-1">Microblading Pro</h3>
                </div>
                <span className="text-xl font-bold">$3,000</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-1 mb-3">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">40h</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">5 días</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">8 estudiantes</span>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Técnica pelo por pelo, diseño personalizado, colorimetría y prácticas intensivas.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <FaCertificate className="text-purple-500" />
                <span>Certificación Profesional</span>
              </div>
              <Link href="/academy/cursos/microblading-pro">
                <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-xl text-sm font-bold hover:shadow-lg transition-all">
                  Ver detalles →
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Curso Powder Brows */}
          <motion.div
            className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all"
            whileHover={{ y: -5 }}
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Nivel Avanzado</span>
                  <h3 className="text-xl font-bold mt-1">Powder Brows</h3>
                </div>
                <span className="text-xl font-bold">$3,500</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-1 mb-3">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">45h</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">6 días</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">8 estudiantes</span>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Técnicas de sombreado, ombré, corrección y retoques avanzados.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <FaCertificate className="text-amber-500" />
                <span>Certificación Experto</span>
              </div>
              <Link href="/academy/cursos/powder-brows">
                <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 rounded-xl text-sm font-bold hover:shadow-lg transition-all">
                  Ver detalles →
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Curso Labios */}
          <motion.div
            className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all"
            whileHover={{ y: -5 }}
          >
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Nivel Intermedio</span>
                  <h3 className="text-xl font-bold mt-1">Labios</h3>
                </div>
                <span className="text-xl font-bold">$2,800</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-1 mb-3">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">35h</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">5 días</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">8 estudiantes</span>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Anatomía labial, técnicas full lip, efecto acuarela y colorimetría avanzada.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <FaCertificate className="text-rose-500" />
                <span>Certificación Profesional</span>
              </div>
              <Link href="/academy/cursos/micropigmentacion-labios">
                <button className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-2 rounded-xl text-sm font-bold hover:shadow-lg transition-all">
                  Ver detalles →
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Curso Corrección */}
          <motion.div
            className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all"
            whileHover={{ y: -5 }}
          >
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Nivel Avanzado</span>
                  <h3 className="text-xl font-bold mt-1">Corrección</h3>
                </div>
                <span className="text-xl font-bold">$3,200</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-1 mb-3">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">50h</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">6 días</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">6 estudiantes</span>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Corrección de micropigmentación, camuflaje, retoques y casos complejos.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <FaCertificate className="text-red-500" />
                <span>Certificación Experto</span>
              </div>
              <Link href="/academy/cursos/micropigmentacion-correccion">
                <button className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-2 rounded-xl text-sm font-bold hover:shadow-lg transition-all">
                  Ver detalles →
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Curso Microblading Master */}
          <motion.div
            className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all"
            whileHover={{ y: -5 }}
          >
            <div className="bg-gradient-to-r from-violet-500 to-purple-500 p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Nivel Master</span>
                  <h3 className="text-xl font-bold mt-1">👑 Microblading Master</h3>
                </div>
                <span className="text-xl font-bold">$4,500</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-1 mb-3">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">70h</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">9 días</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">6 estudiantes</span>
                <span className="text-xs bg-violet-100 text-violet-600 px-2 py-1 rounded-full">⭐ Élite</span>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Técnicas de autor, casos complejos, negocio y marketing, prácticas con expertos.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <FaCertificate className="text-violet-500" />
                <span>Certificación Internacional</span>
              </div>
              <Link href="/academy/cursos/microblading-master">
                <button className="w-full bg-gradient-to-r from-violet-500 to-purple-500 text-white py-2 rounded-xl text-sm font-bold hover:shadow-lg transition-all">
                  Ver detalles →
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-white text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-4xl font-bold mb-4">¿Listo para empezar tu carrera?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Inscríbete ahora y obtén un 15% de descuento en tu primer curso.
            Plazas limitadas, ¡no esperes!
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-bold hover:shadow-xl transition-all">
              Ver cursos disponibles
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all">
              Solicitar información
            </button>
          </div>
        </motion.div>
      </section>
    </main>
  )
}