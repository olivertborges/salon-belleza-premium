// components/store/BeautyStore.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaShoppingCart, FaHeart, FaStar, FaTruck } from 'react-icons/fa'

export function BeautyStore() {
  const [cart, setCart] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('todos')

  const products = [
    {
      id: 1,
      name: 'Kit Profesional Microblading',
      brand: 'BrowMaster',
      price: 299,
      category: 'microblading',
      rating: 4.9,
      reviews: 128,
      image: '/products/microblading-kit.jpg',
      stock: 45,
      includes: ['10 cuchillas', 'Pigmentos', 'Agujas', 'Manual']
    },
    {
      id: 2,
      name: 'Set Uñas Acrílicas Premium',
      brand: 'NailPro',
      price: 149,
      category: 'uñas',
      rating: 4.8,
      reviews: 93,
      image: '/products/nail-set.jpg',
      stock: 32,
      includes: ['Polímero', 'Monómero', 'Pinceles', 'Limas']
    },
    {
      id: 3,
      name: 'Pigmentos Labiales HD',
      brand: 'LipArt',
      price: 189,
      category: 'micropigmentacion',
      rating: 4.7,
      reviews: 76,
      image: '/products/lip-pigments.jpg',
      stock: 28,
      includes: ['6 colores', 'Base', 'Fijador', 'Guía de color']
    }
  ]

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold">🛍️ Beauty Store</h2>
          <p className="text-gray-600">Productos profesionales para tu negocio</p>
        </div>
        <motion.button
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
        >
          <FaShoppingCart />
          <span className="font-bold">{cart.length} items</span>
        </motion.button>
      </div>

      {/* Categorías */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['todos', 'microblading', 'uñas', 'micropigmentacion', 'cuidado'].map((cat) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'todos' ? '📦 Todos' :
             cat === 'microblading' ? '✍️ Microblading' :
             cat === 'uñas' ? '💅 Uñas' :
             cat === 'micropigmentacion' ? '🎨 Micropigmentación' :
             '🧴 Cuidado'}
          </button>
        ))}
      </div>

      {/* Productos */}
      <div className="grid grid-cols-3 gap-6">
        {products.map((product) => (
          <motion.div
            key={product.id}
            className="border rounded-2xl overflow-hidden hover:shadow-xl transition-all group"
            whileHover={{ y: -5 }}
          >
            <div className="relative h-48 bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
              <span className="text-6xl">💄</span>
              <button className="absolute top-2 right-2 bg-white/90 backdrop-blur p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                <FaHeart className="text-pink-500" />
              </button>
              {product.stock < 30 && (
                <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  ¡Últimas unidades!
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.brand}</p>
                </div>
                <span className="text-lg font-bold text-purple-600">${product.price}</span>
              </div>

              <div className="flex items-center gap-1 mt-1">
                <FaStar className="text-yellow-400" />
                <span className="font-medium">{product.rating}</span>
                <span className="text-gray-500 text-sm">({product.reviews})</span>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {product.includes.slice(0, 3).map((item, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {item}
                  </span>
                ))}
                {product.includes.length > 3 && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    +{product.includes.length - 3}
                  </span>
                )}
              </div>

              <button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-xl hover:shadow-lg transition-all">
                Agregar al carrito
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}