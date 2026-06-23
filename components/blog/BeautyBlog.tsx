// components/blog/BeautyBlog.tsx
'use client'

import { motion } from 'framer-motion'
import { FaClock, FaTag, FaShare, FaBookmark } from 'react-icons/fa'

export function BeautyBlog() {
  const posts = [
    {
      id: 1,
      title: '10 Tendencias en Microblading para 2024',
      excerpt: 'Descubre las técnicas más innovadoras que están revolucionando el mundo de la micropigmentación.',
      author: 'Dra. Laura Martínez',
      date: '2024-01-18',
      category: 'Tendencias',
      readTime: '5 min',
      image: '/blog/microblading-trends.jpg',
      likes: 56
    },
    {
      id: 2,
      title: 'Cómo Elegir el Color Perfecto para tus Labios',
      excerpt: 'Guía completa para encontrar el tono ideal según tu tono de piel y estilo personal.',
      author: 'María García',
      date: '2024-01-16',
      category: 'Consejos',
      readTime: '4 min',
      image: '/blog/lip-color.jpg',
      likes: 43
    },
    {
      id: 3,
      title: '5 Errores Comunes al Hacer Uñas Acrílicas',
      excerpt: 'Aprende de los errores más frecuentes y cómo evitarlos para lograr resultados profesionales.',
      author: 'Carlos Ruiz',
      date: '2024-01-14',
      category: 'Tutoriales',
      readTime: '6 min',
      image: '/blog/nail-errors.jpg',
      likes: 38
    }
  ]

  return (
    <div className="bg-gray-50 rounded-3xl p-8 shadow-xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold">📝 Blog de Belleza</h2>
          <p className="text-gray-600">Tips, tendencias y tutoriales profesionales</p>
        </div>
        <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all">
          Ver todos los posts
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {posts.map((post) => (
          <motion.article
            key={post.id}
            className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
            whileHover={{ y: -5 }}
          >
            <div className="h-48 bg-gradient-to-r from-purple-200 to-pink-200 flex items-center justify-center">
              <span className="text-6xl">💄</span>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                  {post.category}
                </span>
                <span className="flex items-center gap-1">
                  <FaClock /> {post.readTime}
                </span>
              </div>

              <h3 className="font-bold text-lg mb-2">{post.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{post.excerpt}</p>

              <div className="flex justify-between items-center border-t pt-3">
                <div>
                  <p className="text-xs text-gray-500">{post.author}</p>
                  <p className="text-xs text-gray-400">{post.date}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-gray-100 rounded-full hover:bg-purple-100 transition-all">
                    <FaBookmark className="text-gray-400 hover:text-purple-600" />
                  </button>
                  <button className="p-2 bg-gray-100 rounded-full hover:bg-purple-100 transition-all">
                    <FaShare className="text-gray-400 hover:text-purple-600" />
                  </button>
                  <span className="p-2 bg-gray-100 rounded-full text-sm font-bold text-purple-600">
                    ❤️ {post.likes}
                  </span>
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  )
}