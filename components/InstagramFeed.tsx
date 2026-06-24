'use client'

import React from 'react';
import { FaInstagram, FaPlay, FaImage } from 'react-icons/fa';

const publicaciones = [
  { id: 1, url: "https://www.instagram.com/reel/DYkAbiyxiPa/", tipo: "video", preview: "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=400&auto=format&fit=crop" },
  { id: 2, url: "https://www.instagram.com/reel/DXjesPFjtQy/", tipo: "video", preview: "https://images.unsplash.com/photo-1632345031435-8797b2d58045?q=80&w=400&auto=format&fit=crop" },
  { id: 3, url: "https://www.instagram.com/p/DYDoX5xEeAj/", tipo: "image", preview: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=400&auto=format&fit=crop" },
  { id: 4, url: "https://www.instagram.com/reel/DXsaqmOkVnQ/", tipo: "video", preview: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400&auto=format&fit=crop" }
];

export default function InstagramFeed() {
  const abrirEnlace = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Grid de Fotos Limpio y Responsivo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {publicaciones.map((pub) => (
          <div
            key={pub.id}
            onClick={() => abrirEnlace(pub.url)}
            className="group relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/60 shadow-xs cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            {/* Imagen de fondo simulando el post */}
            <img 
              src={pub.preview} 
              alt="Instagram Grid Content" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            
            {/* Badge de tipo de contenido */}
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs p-1.5 rounded-lg text-slate-700 text-xs shadow-xs">
              {pub.tipo === 'video' ? <FaPlay className="text-[10px]" /> : <FaImage className="text-[10px]" />}
            </div>

            {/* Capa Hover Premium */}
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="bg-white p-3 rounded-full text-[#DB5B9A] shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                <FaInstagram className="text-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
