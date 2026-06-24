'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  FaArrowLeft, 
  FaCamera, 
  FaPlus, 
  FaTrashAlt,
  FaToggleOff,
  FaToggleOn
} from 'react-icons/fa'
import { useGallery } from '@/hooks/useData'

export default function GaleriaPage() {
  const { data: images, loading, error } = useGallery()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse text-stone-400 text-xs font-mono">CARGANDO GALERÍA...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-500 transition-colors">
            <FaArrowLeft /> Volver al inicio
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-colors ${viewMode === 'grid' ? 'bg-stone-200 text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-colors ${viewMode === 'list' ? 'bg-stone-200 text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
            >
              ☰
            </button>
          </div>
        </div>

        <h1 className="text-4xl font-light text-stone-900 mb-4">
          <span className="font-bold bg-gradient-to-r from-rose-400 to-amber-400 text-transparent bg-clip-text">Galería</span>
        </h1>
        <p className="text-stone-400 font-light mb-8">Nuestros trabajos más recientes</p>

        {/* Grid de imágenes */}
        {error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
            <p className="text-rose-600 text-sm">Error al cargar las imágenes</p>
          </div>
        ) : !images || images.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-stone-200 text-center">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-lg font-light text-stone-900">No hay imágenes disponibles</h3>
            <p className="text-sm text-stone-400 font-light mt-2">Sube tus primeras imágenes a la galería</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {images.map((img: any, idx: number) => (
              <div key={idx} className={`bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-md transition-all group ${viewMode === 'list' ? 'flex gap-4 p-4' : ''}`}>
                <div className={`${viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'w-full aspect-square'} relative overflow-hidden bg-stone-100`}>
                  <img 
                    src={img.image_url || 'https://images.unsplash.com/photo-1522336572467-97b06e8ef143?w=400&h=300&fit=crop'} 
                    alt={img.title || 'Imagen de galería'} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button className="p-2 bg-white/20 backdrop-blur rounded-full hover:bg-white/40 transition-all">
                      <FaCamera className="text-white w-4 h-4" />
                    </button>
                    <button className="p-2 bg-white/20 backdrop-blur rounded-full hover:bg-white/40 transition-all">
                      <FaPlus className="text-white w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className={`${viewMode === 'list' ? 'flex-1 flex flex-col justify-center' : 'p-4'}`}>
                  <h3 className="font-medium text-stone-900 text-sm">{img.title || 'Sin título'}</h3>
                  {img.category && <p className="text-xs text-stone-400 font-light mt-0.5">{img.category}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <button className="text-xs text-rose-400 hover:text-rose-500 transition-colors font-medium">
                      Ver
                    </button>
                    <button className="text-xs text-stone-400 hover:text-red-500 transition-colors">
                      <FaTrashAlt className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
