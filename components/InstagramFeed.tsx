'use client'

import React, { useEffect } from 'react'
import { Camera, ExternalLink } from 'lucide-react'

// Extensión de la interfaz Window para evitar errores de TypeScript con el SDK de Instagram
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void
      }
    }
  }
}

// Lista de URLs de las publicaciones de @freshnails46
const publicaciones = [
  { id: 1, url: "https://www.instagram.com/reel/DYkAbiyxiPa/", tipo: "video" },
  { id: 2, url: "https://www.instagram.com/reel/DXjesPFjtQy/", tipo: "video" },
  { id: 3, url: "https://www.instagram.com/p/DYDoX5xEeAj/", tipo: "image" },
  { id: 4, url: "https://www.instagram.com/reel/DXsaqmOkVnQ/", tipo: "video" },
  { id: 5, url: "https://www.instagram.com/reel/DYIV-raxKhj/", tipo: "video" },
  { id: 6, url: "https://www.instagram.com/reel/DYA1SCxlSiu/", tipo: "video" }
]

interface InstagramPostEmbedProps {
  url: string
}

const InstagramPostEmbed = ({ url }: InstagramPostEmbedProps) => {
  useEffect(() => {
    if (window.instgrm) {
      window.instgrm.Embeds.process()
    }
  }, [url])

  return (
    <div className="w-full flex justify-center bg-stone-50 rounded-xl overflow-hidden">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{ 
          background: 'transparent', 
          border: 0, 
          borderRadius: '12px', 
          margin: 0,
          maxWidth: '100%',
          minWidth: '270px',
          width: '100%'
        }}
      />
    </div>
  )
}

export default function InstagramFeed() {
  const abrirInstagram = () => {
    window.open('https://www.instagram.com/freshnails46', '_blank')
  }

  useEffect(() => {
    if (!document.querySelector('script[src="https://www.instagram.com/embed.js"]')) {
      const script = document.createElement('script')
      script.src = 'https://www.instagram.com/embed.js'
      script.async = true;
      script.defer = true;
      document.body.appendChild(script)
    }
  }, [])

  return (
    <div className="space-y-6 bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
      
      {/* Header Estilizado de Red Social */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-stone-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center">
            <Camera className="w-5 h-5 text-stone-700" />
          </div>
          <div>
            <h3 className="font-serif text-base text-stone-800 tracking-tight">@freshnails46</h3>
            <p className="text-[11px] font-light text-stone-400">Tendencias e Inspiración de Cabina</p>
          </div>
        </div>
        <button
          onClick={abrirInstagram}
          className="flex items-center gap-2 text-[10px] font-mono tracking-wider uppercase bg-stone-100 border border-stone-200 text-stone-700 px-4 py-2 rounded-xl font-bold hover:bg-stone-200/60 transition-all shadow-xs"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Seguir Perfil
        </button>
      </div>

      {/* Grid de Embeds Oficiales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {publicaciones.map((pub) => (
          <div
            key={pub.id}
            className="bg-stone-50 rounded-xl overflow-hidden border border-stone-200/60 p-2 shadow-xs hover:border-stone-400 transition-all flex justify-center items-center"
          >
            <InstagramPostEmbed url={pub.url} />
          </div>
        ))}
      </div>

      {/* Footer Call to Action */}
      <button
        onClick={abrirInstagram}
        className="w-full py-3 bg-stone-900 text-white font-mono text-[11px] uppercase tracking-wider rounded-xl font-bold transition-all hover:bg-stone-800 shadow-sm flex items-center justify-center gap-2"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Ver Galería Completa
      </button>
    </div>
  )
}
