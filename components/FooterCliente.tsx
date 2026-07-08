'use client'

import React from 'react'
import { Heart, Sparkles } from 'lucide-react'

export default function FooterCliente() {
  return (
    <footer className="mt-16 border-t border-pink-100/60 dark:border-stone-800/80 pt-10 pb-6 text-center space-y-4 font-sans relative overflow-hidden">
      
      {/* Separador de marca ultra elegante y sofisticado */}
      <div className="flex items-center justify-center gap-3">
        <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-pink-300 dark:to-pink-950" />
        <div className="inline-flex items-center gap-2 text-stone-400 dark:text-stone-500 uppercase tracking-[0.25em] text-[10px] font-black">
          SALON <span className="font-serif italic text-pink-500 dark:text-pink-400 lowercase tracking-normal font-normal text-xs">fresh nails</span>
          <Sparkles className="w-3 h-3 text-amber-400 animate-pulse flex-shrink-0" />
        </div>
        <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-pink-300 dark:to-pink-950" />
      </div>
      
      {/* Reseña del Salón con tipografía boutique relajada */}
      <p className="text-[11px] text-stone-500 dark:text-stone-400 font-bold max-w-md mx-auto leading-relaxed px-4">
        Especialistas en manicura de autor, micropigmentación avanzada, microblading premium y estilismo integral para el cabello. Tu santuario de belleza de confianza.
      </p>

      {/* Franja de créditos y derechos con contrastes limpios */}
      <div className="pt-6 border-t border-pink-100/20 dark:border-stone-900/40 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-stone-400 dark:text-stone-500 tracking-wider max-w-5xl mx-auto px-4 gap-3">
        <p className="font-medium">© {new Date().getFullYear()} FRESH NAILS SALON. Todos los derechos reservados.</p>
        <p className="flex items-center gap-1.5 font-bold text-stone-500 dark:text-stone-400">
          Creado con <Heart className="w-3 h-3 text-pink-500 fill-pink-500/30 animate-pulse" /> para nuestra comunidad VIP
        </p>
      </div>
    </footer>
  )
}
