// app/academy/cursos/unas-basico/page.tsx
'use client'

import { motion } from 'framer-motion'
import { 
  FaClock, FaUsers, FaCertificate, FaStar, FaCheck,
  FaBook, FaVideo, FaFileAlt, FaDownload, FaArrowLeft
} from 'react-icons/fa'
import Link from 'next/link'

export default function CursoUnasBasico() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header con navegación */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
        <div className="container mx-auto px-4 py-8">
          <Link href="/academy" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4">
            <FaArrowLeft /> Volver a la academia
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Nivel Básico</span>
              <h1 className="text-4xl font-bold mt-2">💅 Uñas Básico</h1>
              <p className="text-lg opacity-90 mt-2">Domina los fundamentos de la manicura y uñas acrílicas</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">$1,200</div>
              <span className="text-sm opacity-80">Incluye kit de herramientas</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Contenido principal */}
          <div className="col-span-2 space-y-8">
            {/* Información general */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4">📋 Información del Curso</h2>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { icon: <FaClock />, label: 'Duración', value: '40 horas' },
                  { icon: <FaClock />, label: 'Días', value: '5 días' },
                  { icon: <FaUsers />, label: 'Capacidad', value: '12 estudiantes' },
                  { icon: <FaCertificate />, label: 'Certificación', value: 'Básica' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl shadow-sm">
                    <div className="text-pink-500 text-2xl">{item.icon}</div>
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className="font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Módulos */}
            <div>
              <h2 className="text-2xl font-bold mb-4">📚 Módulos del Curso</h2>
              <div className="space-y-4">
                {[
                  {
                    title: 'Módulo 1: Fundamentos de la Manicura',
                    duration: '8 horas',
                    topics: [
                      'Anatomía y fisiología de la uña',
                      'Enfermedades y alteraciones',
                      'Seguridad e higiene',
                      'Materiales y herramientas'
                    ]
                  },
                  {
                    title: 'Módulo 2: Técnicas de Manicura',
                    duration: '12 horas',
                    topics: [
                      'Manicura clásica',
                      'Manicura spa',
                      'Técnicas de esmaltado',
                      'Diseño básico'
                    ]
                  },
                  {
                    title: 'Módulo 3: Uñas Acrílicas Básicas',
                    duration: '10 horas',
                    topics: [
                      'Preparación de la uña',
                      'Aplicación de acrílico',
                      'Formado y limado',
                      'Acabado y brillo'
                    ]
                  },
                  {
                    title: 'Módulo 4: Prácticas Guiadas',
                    duration: '10 horas',
                    topics: [
                      'Práctica en modelos',
                      'Corrección de errores',
                      'Evaluación final'
                    ]
                  }
                ].map((modulo, idx) => (
                  <motion.div
                    key={idx}
                    className="bg-white border rounded-2xl p-6 hover:shadow-lg transition-all"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold">{modulo.title}</h3>
                        <span className="text-sm text-pink-500">{modulo.duration}</span>
                      </div>
                      <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                        {modulo.topics.length} temas
                      </span>
                    </div>
                    <ul className="mt-4 grid grid-cols-2 gap-2">
                      {modulo.topics.map((topic, tIdx) => (
                        <li key={tIdx} className="flex items-center gap-2 text-sm text-gray-600">
                          <FaCheck className="text-green-500 text-xs" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Lo que incluye */}
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4">🎁 Lo que incluye</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Kit básico de herramientas ($200 valor)',
                  'Manual de prácticas',
                  'Certificado de asistencia',
                  'Materiales para prácticas',
                  'Soporte post-curso 1 mes',
                  'Acceso a comunidad exclusiva'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <FaCheck className="text-green-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resumen de compra */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 sticky top-4">
              <h3 className="text-xl font-bold mb-4">📝 Resumen</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Curso:</span>
                  <span className="font-bold">Uñas Básico</span>
                </div>
                <div className="flex justify-between">
                  <span>Duración:</span>
                  <span>40 horas (5 días)</span>
                </div>
                <div className="flex justify-between">
                  <span>Estudiantes:</span>
                  <span>12 máximo</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="font-bold">Precio:</span>
                  <span className="text-2xl font-bold text-pink-600">$1,200</span>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 rounded-xl font-bold mt-4 hover:shadow-lg transition-all">
                Inscribirse ahora
              </button>

              <div className="mt-4 p-4 bg-white/50 backdrop-blur rounded-xl">
                <p className="text-xs text-center text-gray-600">
                  🔒 Pago seguro vía Stripe o MercadoPago
                  <br />
                  💳 3 cuotas sin interés
                </p>
              </div>
            </div>

            {/* Calificación */}
            <div className="bg-white border rounded-2xl p-6">
              <h4 className="font-bold mb-3">⭐ Calificación del Curso</h4>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-yellow-500">4.8</div>
                <div>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((star) => (
                      <FaStar key={star} className="text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">156 reseñas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}