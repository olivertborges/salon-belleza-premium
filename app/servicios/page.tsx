'use client'

import React from 'react'
import Link from 'next/link'
import { FaArrowRight, FaClock, FaStar } from 'react-icons/fa'
import { GiNails, GiSparkles, GiScissors, GiLipstick } from 'react-icons/gi'

const SERVICES = [
  { 
    name: 'Manicura Rusa',
    description: 'Limpieza profunda de cutículas con fresas de precisión y escudo de gel estructural que unifica y protege la uña natural.',
    price: 45,
    duration: 90,
    icon: GiNails,
    tag: '⭐ Más Solicitado',
    color: 'from-pink-500 to-rose-500'
  },
  { 
    name: 'Extensiones Soft Gel',
    description: 'Arquitectura completa de la uña con tips de gel preformados. Flexibilidad, naturalidad y duración de vanguardia.',
    price: 65,
    duration: 120,
    icon: GiSparkles,
    tag: '🔥 Tendencia',
    color: 'from-amber-500 to-orange-500'
  },
  { 
    name: 'Nail Art de Autor',
    description: 'Diseños geométricos, pan de oro, efectos holográficos y pedrería fina. Cada uña es una obra de arte única.',
    price: 55,
    duration: 105,
    icon: GiLipstick,
    tag: '✨ Estilo Único',
    color: 'from-violet-500 to-purple-500'
  },
  { 
    name: 'Peluquería & Styling',
    description: 'Cortes, colorimetría y peinados. Transformamos tu look con técnicas de vanguardia y productos de alta calidad.',
    price: 50,
    duration: 90,
    icon: GiScissors,
    tag: '✂️ Profesional',
    color: 'from-emerald-500 to-teal-500'
  }
]

export default function ServiciosPage() {
  return (
    <div className="min-h-screen bg-[#0d0b0a] text-white pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-[#C9A96E] border border-[#C9A96E]/20 px-4 py-1.5 rounded-full inline-block">
            ✦ NUESTROS SERVICIOS ✦
          </span>
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight mt-4">
            Descubre <span className="font-serif italic text-[#DB5B9A]">lo que ofrecemos</span>
          </h1>
          <p className="text-stone-400 mt-4 max-w-2xl mx-auto">
            Conoce todos los servicios que tenemos para ti en Fresh Beauty Studio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SERVICES.map((service, idx) => {
            const Icon = service.icon
            return (
              <div
                key={idx}
                className="group bg-gradient-to-b from-[#1a1715] to-[#141211] border border-stone-800/50 rounded-2xl p-6 transition-all duration-500 hover:-translate-y-2 hover:border-[#C9A96E]/30 hover:shadow-2xl hover:shadow-[#C9A96E]/5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white text-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A96E] bg-[#C9A96E]/10 px-2.5 py-1 rounded-full">
                    {service.tag}
                  </span>
                </div>

                <h3 className="text-xl font-medium text-white group-hover:text-[#DB5B9A] transition-colors duration-300">
                  {service.name}
                </h3>
                <p className="text-sm text-stone-400 font-light mt-2 leading-relaxed">
                  {service.description}
                </p>

                <div className="mt-4 pt-4 border-t border-stone-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-serif italic text-[#C9A96E]">${service.price}</span>
                    <span className="text-xs text-stone-500 flex items-center gap-1">
                      <FaClock className="text-[#C9A96E]" /> {service.duration}min
                    </span>
                  </div>
                  <Link href="/agenda" className="text-xs font-bold text-[#DB5B9A] hover:text-[#C9A96E] transition-colors flex items-center gap-1">
                    Agendar <FaArrowRight className="text-[10px]" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA al final */}
        <div className="text-center mt-16">
          <Link 
            href="/agenda" 
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-white font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-[#DB5B9A] to-[#C9A96E] hover:opacity-90 transition-all shadow-lg shadow-[#DB5B9A]/20"
          >
            Reservar tu cita ahora
            <FaArrowRight />
          </Link>
          <p className="text-xs text-stone-500 mt-3">
            ¿Ya tienes cuenta? <Link href="/login" className="text-[#C9A96E] hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}