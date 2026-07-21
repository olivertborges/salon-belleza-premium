// components/gallery/StyleGallery.tsx
// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAI } from '@/hooks/useAI'

export function StyleGallery() {
  const [images, setImages] = useState([])
  const [filters, setFilters] = useState({
    style: 'todos',
    color: 'todos',
    length: 'todos',
    occasion: 'todos'
  })
  const { generateStyles, findSimilarStyles } = useAI()

  const loadImages = async () => {
    // IA genera estilos basados en tendencias actuales
    const generated = await generateStyles(filters)
    setImages(generated)
  }

  useEffect(() => {
    loadImages()
  }, [filters])

  return (
    <div className="space-y-6">
      {/* Filtros inteligentes */}
      <div className="bg-white rounded-2xl p-6 shadow-xl">
        <div className="grid grid-cols-4 gap-4">
          <select 
            className="p-3 border rounded-xl"
            onChange={(e) => setFilters({...filters, style: e.target.value})}
          >
            <option value="todos">Todos los estilos</option>
            <option value="moderno">Moderno</option>
            <option value="clasico">Clásico</option>
            <option value="vanguardista">Vanguardista</option>
            <option value="retro">Retro</option>
          </select>

          <select 
            className="p-3 border rounded-xl"
            onChange={(e) => setFilters({...filters, color: e.target.value})}
          >
            <option value="todos">Todos los colores</option>
            <option value="rubio">Rubio</option>
            <option value="castaño">Castaño</option>
            <option value="rojo">Rojo</option>
            <option value="pastel">Pastel</option>
            <option value="neon">Neón</option>
          </select>

          <select 
            className="p-3 border rounded-xl"
            onChange={(e) => setFilters({...filters, length: e.target.value})}
          >
            <option value="todos">Todos los largos</option>
            <option value="corto">Corto</option>
            <option value="medio">Medio</option>
            <option value="largo">Largo</option>
          </select>

          <button 
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-xl"
            onClick={() => loadImages()}
          >
            🔮 Buscar con IA
          </button>
        </div>
      </div>

      {/* Grid de imágenes con efecto 3D */}
      <div className="grid grid-cols-4 gap-6">
        {images.map((image, idx) => (
          <motion.div
            key={idx}
            className="relative group cursor-pointer"
            whileHover={{ 
              scale: 1.05,
              rotateY: 5,
              rotateX: 5,
              zIndex: 10
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative overflow-hidden rounded-2xl shadow-xl">
              <img 
                src={image.url} 
                alt={image.style}
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="font-bold">{image.style}</p>
                  <p className="text-sm text-gray-300">{image.color}</p>
                </div>
              </div>
            </div>

            {/* Botón de acción */}
            <button 
              className="absolute top-2 right-2 bg-white/90 backdrop-blur p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
              onClick={() => alert('¡Guardado en favoritos!')}
            >
              ❤️
            </button>

            {/* Similares */}
            <button 
              className="absolute bottom-2 left-2 bg-black/50 backdrop-blur p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all text-white text-xs"
              onClick={() => findSimilarStyles(image)}
            >
              🔍 Buscar similares
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}