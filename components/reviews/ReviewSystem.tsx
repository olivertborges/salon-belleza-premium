// components/reviews/ReviewSystem.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaStar, FaHeart, FaThumbsUp, FaCamera } from 'react-icons/fa'

export function ReviewSystem() {
  const [reviews, setReviews] = useState([
    {
      id: 1,
      user: 'María González',
      service: 'Microblading',
      rating: 5,
      comment: 'Increíble experiencia! Mis cejas quedaron perfectas, muy natural.',
      date: '2024-01-15',
      likes: 24,
      images: ['/reviews/1.jpg'],
      verified: true
    },
    {
      id: 2,
      user: 'Carlos Pérez',
      service: 'Corte y Color',
      rating: 5,
      comment: 'El mejor salón de la ciudad. Atención de primera y profesionales excelentes.',
      date: '2024-01-14',
      likes: 18,
      images: [],
      verified: true
    },
    {
      id: 3,
      user: 'Ana Martínez',
      service: 'Curso de Uñas',
      rating: 4,
      comment: 'Excelente curso, aprendí mucho. Los instructores son muy profesionales.',
      date: '2024-01-12',
      likes: 12,
      images: ['/reviews/2.jpg'],
      verified: true
    }
  ])

  const stats = {
    average: 4.8,
    total: 156,
    distribution: {
      5: 120,
      4: 28,
      3: 6,
      2: 2,
      1: 0
    }
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl">
      <h2 className="text-3xl font-bold mb-6">⭐ Reseñas de Clientes</h2>

      {/* Estadísticas */}
      <div className="flex items-center gap-8 mb-8 bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl">
        <div className="text-center">
          <div className="text-5xl font-bold text-purple-600">{stats.average}</div>
          <div className="flex gap-1 justify-center mt-1">
            {[1,2,3,4,5].map((star) => (
              <FaStar key={star} className="text-yellow-400" />
            ))}
          </div>
          <p className="text-sm text-gray-600">{stats.total} reseñas</p>
        </div>

        <div className="flex-1">
          {Object.entries(stats.distribution).reverse().map(([rating, count]) => (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-sm w-6">{rating}⭐</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-amber-500"
                  style={{ width: `${(count / stats.total) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 w-8">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <motion.div
            key={review.id}
            className="border rounded-xl p-4 hover:shadow-md transition-all"
            whileHover={{ x: 5 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{review.user}</span>
                  {review.verified && (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                      ✓ Verificado
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1">
                    {Array.from({ length: review.rating }).map((_, idx) => (
                      <FaStar key={idx} className="text-yellow-400 text-sm" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">{review.service}</span>
                </div>
                <p className="mt-2 text-gray-700">{review.comment}</p>
                {review.images.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {review.images.map((img, idx) => (
                      <div key={idx} className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <FaCamera className="text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">{review.date}</p>
                <button className="flex items-center gap-1 mt-1 text-sm text-gray-500 hover:text-purple-600">
                  <FaThumbsUp /> {review.likes}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:shadow-lg transition-all"
        whileHover={{ scale: 1.02 }}
      >
        📝 Dejar tu reseña
      </motion.button>
    </div>
  )
}