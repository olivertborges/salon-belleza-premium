'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ============================================================
// HERO SECTION - VERSIÓN MÍNIMA
// ============================================================
function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const heroImages = [
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&fit=crop&q=90',
    'https://images.unsplash.com/photo-1626015713026-d8309cdc91ea?w=800&fit=crop&q=90',
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="min-h-screen bg-black text-white flex items-center">
      <div className="max-w-7xl mx-auto px-4 w-full">
        <h1 className="text-5xl font-bold">Fresh Nails</h1>
        <p className="text-xl mt-4">Donde tus manos se vuelven arte</p>
        <div className="mt-8">
          <img 
            src={heroImages[currentSlide]} 
            alt="Fresh Nails" 
            className="w-full max-w-md rounded-2xl"
          />
        </div>
      </div>
    </section>
  )
}

// ============================================================
// PÁGINA PRINCIPAL - VERSIÓN MÍNIMA
// ============================================================
export default function Home() {
  return (
    <main className="bg-black min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 px-4 py-3 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between">
          <span className="text-white font-bold">Fresh Nails</span>
          <nav className="flex gap-4 text-white/60">
            <Link href="#servicios">Servicios</Link>
            <Link href="/reservas">Reservar</Link>
          </nav>
        </div>
      </header>
      <HeroSection />
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl text-white text-center">Nuestros Servicios</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <h3 className="text-white font-bold">Servicio {i}</h3>
                <p className="text-white/60 mt-2">Descripción del servicio</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-white/40 text-sm">
          © 2026 Fresh Nails
        </div>
      </footer>
    </main>
  )
}