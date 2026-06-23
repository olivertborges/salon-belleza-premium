// components/sections/GallerySection.tsx
'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { FaExpand, FaHeart } from 'react-icons/fa'

export function GallerySection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const images = [
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1522335140-67fcfea9c78d?w=400&h=300&fit=crop',
      title: 'Corte Moderno',
      category: 'Cortes'
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop',
      title: 'Coloración Balayage',
      category: 'Color'
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop',
      title: 'Peinado de Novia',
      category: 'Peinados'
    },
    {
      id: 4,
      url: 'https://images.unsplash.com/photo-1522336572467-97b06e8ef143?w=400&h=300&fit=crop',
      title: 'Uñas Artísticas',
      category: 'Uñas'
    },
    {
      id: 5,
      url: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop',
      title: 'Maquillaje Profesional',
      category: 'Maquillaje'
    },
    {
      id: 6,
      url: 'https://images.unsplash.com/photo-1522336572467-97b06e8ef143?w=400&h=300&fit=crop',
      title: 'Micropigmentación',
      category: 'Micropigmentación'
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <span className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
            Nuestro Trabajo
          </span>
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Galería de Inspiración
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descubre nuestros trabajos más recientes y encuentra tu próximo estilo.
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          {images.map((image, idx) => (
            <motion.div
              key={image.id}
              className="relative overflow-hidden rounded-2xl cursor-pointer group"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${
                hoveredIndex === idx ? 'opacity-100' : 'opacity-0'
              }`}>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-white font-bold text-lg">{image.title}</p>
                  <p className="text-white/80 text-sm">{image.category}</p>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <button className="bg-white/20 backdrop-blur p-2 rounded-full hover:bg-white/40 transition-all">
                    <FaHeart className="text-white" />
                  </button>
                  <button className="bg-white/20 backdrop-blur p-2 rounded-full hover:bg-white/40 transition-all">
                    <FaExpand className="text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition-all">
            Ver más trabajos →
          </button>
        </div>
      </div>
    </section>
  )
}