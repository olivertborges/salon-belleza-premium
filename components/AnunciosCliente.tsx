'use client'

import React, { useState, useEffect } from 'react'
import { Megaphone } from 'lucide-react'

interface Anuncio {
  id: string
  titulo: string
  descripcion: string
  activa: boolean
}

export default function AnunciosCliente() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [anuncioActual, setAnuncioActual] = useState<Anuncio | null>(null)
  const [indice, setIndice] = useState(0)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    cargarAnuncios()
    const handleActualizacion = () => cargarAnuncios()
    window.addEventListener('anunciosActualizados', handleActualizacion)
    return () => window.removeEventListener('anunciosActualizados', handleActualizacion)
  }, [])

  const cargarAnuncios = () => {
    const anunciosGuardados = localStorage.getItem('freshNails_anuncios')
    if (anunciosGuardados) {
      const activos: Anuncio[] = JSON.parse(anunciosGuardados).filter((a: Anuncio) => a.activa)
      setAnuncios(activos)
      if (activos.length > 0) {
        setAnuncioActual(activos[0])
        setIndice(0)
      }
    }
  }

  useEffect(() => {
    if (anuncios.length > 1) {
      const interval = setInterval(() => {
        setIsFading(true)
        
        // Esperar a que la animación de salida termine antes de cambiar el contenido
        setTimeout(() => {
          setIndice(prev => {
            const nuevo = (prev + 1) % anuncios.length
            setAnuncioActual(anuncios[nuevo])
            return nuevo
          })
          setIsFading(false)
        }, 300)
      }, 6000)
      
      return () => clearInterval(interval)
    }
  }, [anuncios])

  if (anuncios.length === 0 || !anuncioActual) return null

  return (
    <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Icono de Megáfono Estilizado */}
          <div className="w-8 h-8 bg-stone-900 rounded-xl flex items-center justify-center border border-stone-900 text-white flex-shrink-0">
            <Megaphone className="w-3.5 h-3.5" />
          </div>
          
          {/* Contenido con Efecto Desvanecido Controlado */}
          <div className={`min-w-0 transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
            <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400 block mb-0.5">Nota Oficial</span>
            <p className="text-xs font-semibold text-stone-800 truncate">
              {anuncioActual.titulo}
            </p>
            <p className="text-[11px] text-stone-500 font-light line-clamp-1 mt-0.5">
              {anuncioActual.descripcion}
            </p>
          </div>
        </div>

        {/* Indicadores de Paginación Minimalistas (Puntos de carrusel) */}
        {anuncios.length > 1 && (
          <div className="flex gap-1.5 px-1 flex-shrink-0">
            {anuncios.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === indice ? 'w-3 bg-stone-800' : 'w-1 bg-stone-200'
                }`} 
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
