'use client'

import React from 'react'
import { Heart } from 'lucide-react'

export default function FooterCliente() {
  return (
    <footer className="mt-20 border-t border-stone-900 pt-10 pb-6 text-center space-y-4 font-sans">
      <div className="flex items-center justify-center gap-2">
        <span className="h-[1px] w-8 bg-stone-800" />
        <div className="inline-flex items-center gap-1.5 text-stone-500 uppercase tracking-[0.3em] text-[10px] font-medium">
          Salón <span className="font-serif italic text-rose-400/80 lowercase">fresh</span> Nails
        </div>
        <span className="h-[1px] w-8 bg-stone-800" />
      </div>
      
      <p className="text-[11px] text-stone-600 font-light max-w-lg mx-auto leading-relaxed">
        Especialistas en manicura de autor, micropigmentación, microblading y estilismo integral para el cabello. Tu centro premium de confianza.
      </p>

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-stone-700 tracking-wider max-w-7xl mx-auto px-4 gap-2">
        <p>© {new Date().getFullYear()} Fresh Nails. Todos los derechos reservados.</p>
        <p className="flex items-center gap-1">
          Hecho con <Heart className="w-2.5 h-2.5 text-rose-600/60 fill-rose-600/20" /> para nuestra comunidad exclusiva
        </p>
      </div>
    </footer>
  )
}
