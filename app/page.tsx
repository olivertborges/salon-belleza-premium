'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { 
  FaArrowRight, 
  FaQuoteLeft,
  FaCheckCircle,
  FaClock,
  FaAward,
  FaInstagram,
  FaWhatsapp,
  FaShieldAlt,
  FaStar,
  FaGem,
  FaUser,
  FaBars,
  FaTimes,
  FaCalendarCheck,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaRegClock
} from 'react-icons/fa'
import { GiNails, GiSparkles, GiScissors, GiLipstick } from 'react-icons/gi'

// ============================================================
// COLORES
// ============================================================
const COLORS = {
  gold: '#C9A96E',
  goldLight: '#E8D5A8',
  pink: '#DB5B9A',
  pinkLight: '#E88AB8',
  copper: '#E5A46E',
  dark: '#0d0b0a',
  darkCard: '#141211',
  white: '#FAF8F5'
}

// ============================================================
// ANIMACIONES
// ============================================================
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}

// ============================================================
// SERVICIOS
// ============================================================
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

// ============================================================
// GALERÍA
// ============================================================
const GALLERY_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1591926079847-8181980b0f09?w=600&h=600&fit=crop', title: 'Manicura Rusa' },
  { url: 'https://images.unsplash.com/photo-1641814250010-9887d86eedfd?w=600&h=600&fit=crop', title: 'Extensiones Soft Gel' },
  { url: 'https://images.unsplash.com/photo-1720343409646-960f6dcccae3?w=600&h=600&fit=crop', title: 'Nail Art' },
  { url: 'https://images.unsplash.com/photo-1585885970325-81cba4494c27?w=600&h=600&fit=crop', title: 'Micropigmentación' },
  { url: 'https://images.unsplash.com/photo-1560869713-7d0a2943087e?w=600&h=600&fit=crop', title: 'Coloración' },
  { url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop', title: 'Esmaltado Premium' },
]

// ============================================================
// TESTIMONIALS
// ============================================================
const TESTIMONIALS = [
  { comment: "La precisión de la manicura rusa aquí es excelente. Mis uñas nunca lucieron tan perfectas.", name: "Valeria M.", rating: 5 },
  { comment: "El mejor salón de Montevideo. Los diseños a mano alzada son divinos.", name: "Carolina R.", rating: 5 },
  { comment: "La atención es increíble y los resultados duran semanas. ¡100% recomendado!", name: "Agustina S.", rating: 5 }
]

// ============================================================
// COMPONENTES
// ============================================================

// HEADER
const Header = () => {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'bg-[#0d0b0a]/95 backdrop-blur-xl border-b border-[#C9A96E]/10 shadow-2xl' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#DB5B9A] to-[#C9A96E] flex items-center justify-center shadow-lg shadow-[#DB5B9A]/20 group-hover:scale-110 transition-transform duration-300">
                <FaGem className="w-4 h-4 text-white" />
              </div>
            </div>
            <span className="text-white font-serif text-xl tracking-tight group-hover:text-[#C9A96E] transition-colors duration-300">
              Fresh<span className="text-[#DB5B9A]">.</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/servicios" className="text-sm text-stone-400 hover:text-white transition-colors">Servicios</Link>
            <Link href="/galeria" className="text-sm text-stone-400 hover:text-white transition-colors">Galería</Link>
            <Link href="#testimonios" className="text-sm text-stone-400 hover:text-white transition-colors">Testimonios</Link>
            <Link href="/agenda" className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#DB5B9A] to-[#C9A96E] hover:opacity-90 transition-all shadow-lg shadow-[#DB5B9A]/20">
              Agendar Cita
            </Link>
          </nav>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden w-10 h-10 rounded-xl border border-stone-800 hover:border-[#C9A96E]/40 transition-all flex items-center justify-center bg-stone-900/30">
            {isOpen ? <FaTimes className="w-5 h-5 text-white" /> : <FaBars className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden overflow-hidden bg-[#0d0b0a]/95 backdrop-blur-xl border-t border-[#C9A96E]/10">
            <div className="px-4 py-6 space-y-4">
              <Link href="#servicios" className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-400 hover:text-white hover:bg-stone-900/50 transition-all" onClick={() => setIsOpen(false)}>
                <GiNails className="w-4 h-4 text-[#C9A96E]" /> Servicios
              </Link>
              <Link href="#galeria" className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-400 hover:text-white hover:bg-stone-900/50 transition-all" onClick={() => setIsOpen(false)}>
                <FaGem className="w-4 h-4 text-[#C9A96E]" /> Galería
              </Link>
              <Link href="#testimonios" className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-400 hover:text-white hover:bg-stone-900/50 transition-all" onClick={() => setIsOpen(false)}>
                <FaStar className="w-4 h-4 text-[#C9A96E]" /> Testimonios
              </Link>
              <Link href="/agenda" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-[#DB5B9A] to-[#C9A96E] shadow-lg shadow-[#DB5B9A]/20" onClick={() => setIsOpen(false)}>
                <FaCalendarCheck /> Agendar Cita
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

// ============================================================
// HERO CON ANIMACIÓN DE FONDO
// ============================================================
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#0d0b0a] text-white pt-20 overflow-hidden">
      {/* Fondo animado */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-30%] left-[-10%] w-[800px] h-[800px] rounded-full filter blur-[150px] animate-pulse" style={{ background: `${COLORS.pink}10` }} />
        <div className="absolute bottom-[-30%] right-[-10%] w-[800px] h-[800px] rounded-full filter blur-[150px] animate-pulse delay-1000" style={{ background: `${COLORS.gold}10` }} />
        
        <div className="absolute inset-0 bg-[radial-gradient(#1c1917_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
        
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1000 600">
          <path d="M 0 100 Q 200 50 400 120 T 800 80 T 1000 150" stroke="#C9A96E" strokeWidth="1" fill="none" className="animate-[path_8s_ease-in-out_infinite]" />
          <path d="M 0 300 Q 200 250 400 320 T 800 280 T 1000 350" stroke="#DB5B9A" strokeWidth="0.5" fill="none" className="animate-[path_10s_ease-in-out_infinite_delay-2s]" />
        </svg>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#C9A96E]/10 to-[#DB5B9A]/10 border border-[#C9A96E]/30 px-5 py-2 rounded-full backdrop-blur-md mb-8">
            <span className="flex h-2 w-2 rounded-full bg-[#C9A96E] animate-ping" />
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-[#C9A96E]">✦ Fresh Beauty Studio ✦</p>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-light tracking-tight leading-[1.05]">
            Donde tus manos
            <br />
            <span className="font-serif italic font-normal bg-gradient-to-r from-[#DB5B9A] via-[#C9A96E] to-[#E5A46E] bg-clip-text text-transparent bg-[length:300%_auto] animate-gradient">
              se vuelven arte
            </span>
          </h1>

          <p className="text-base sm:text-lg text-stone-400 font-light max-w-xl mx-auto mt-6 leading-relaxed">
            Especialistas en manicura combinada, extensiones esculturales y nail art. 
            Cada detalle está pensado para realzar tu belleza natural.
          </p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          >
            <Link href="/agenda" className="group relative overflow-hidden rounded-xl p-[1px] transition-all shadow-[0_0_30px_rgba(219,91,154,0.2)] hover:shadow-[0_0_60px_rgba(219,91,154,0.4)]">
              <div className="bg-[#0d0b0a] group-hover:bg-transparent px-8 py-4 rounded-[11px] font-medium text-sm tracking-wider transition-colors duration-300 flex items-center gap-3 text-white">
                <FaCalendarCheck className="text-[#C9A96E]" />
                RESERVAR CITA
                <FaArrowRight className="text-xs group-hover:translate-x-2 transition-transform duration-300 text-[#C9A96E]" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#DB5B9A] to-[#C9A96E] -z-10" />
            </Link>

            <Link href="#servicios" className="group bg-stone-900/60 hover:bg-stone-900 border border-stone-800 hover:border-[#C9A96E] px-8 py-4 rounded-xl font-medium text-sm tracking-wider transition-all duration-300 flex items-center gap-2 text-stone-300 hover:text-white">
              <FaStar className="text-[#C9A96E] group-hover:rotate-180 transition-transform duration-500" />
              VER SERVICIOS
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid grid-cols-3 gap-6 max-w-md mx-auto mt-16 pt-8 border-t border-stone-900"
          >
            {[
              { number: '100%', label: 'Esterilización Médica', color: COLORS.gold },
              { number: 'Técnicas', label: 'Rusas Profesionales', color: COLORS.pink },
              { number: '20K+', label: 'Uñas Esculpidas', color: COLORS.copper }
            ].map((item, i) => (
              <div key={i}>
                <p className="text-2xl font-serif italic" style={{ color: item.color }}>{item.number}</p>
                <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">{item.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes path {
          0%, 100% { transform: translateX(-20px); }
          50% { transform: translateX(20px); }
        }
        .animate-gradient {
          animation: gradient 4s ease-in-out infinite;
        }
        .delay-1000 { animation-delay: 1s; }
        .delay-2s { animation-delay: 2s; }
      `}</style>
    </section>
  )
}

// ============================================================
// SERVICIOS — CON TARJETAS INTERACTIVAS
// ============================================================
const ServicesSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })

  return (
    <section id="servicios" ref={ref} className="py-24 bg-[#12100e] text-white relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full filter blur-[120px] bg-pink-500/10" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full filter blur-[120px] bg-amber-500/10" />

      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        <motion.div 
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.span variants={fadeInUp} className="text-xs font-bold tracking-[0.3em] uppercase inline-block px-4 py-1.5 rounded-full border border-[#C9A96E]/20 text-[#C9A96E]">
            ✦ SERVICIOS ✦
          </motion.span>
          <motion.h2 variants={fadeInUp} className="text-4xl sm:text-5xl font-light tracking-tight mt-4">
            ¿Qué <span className="font-serif italic text-[#DB5B9A]">servicios</span> ofrecemos?
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-stone-400 mt-4 max-w-2xl mx-auto">
            Descubre nuestra experiencia en el cuidado y embellecimiento de uñas.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((service, idx) => {
            const Icon = service.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="group bg-gradient-to-b from-[#1a1715] to-[#141211] border border-stone-800/50 rounded-2xl p-6 transition-all duration-500 hover:-translate-y-2 hover:border-[#C9A96E]/30 hover:shadow-2xl hover:shadow-[#C9A96E]/5 flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white text-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A96E] bg-[#C9A96E]/10 px-2.5 py-1 rounded-full">
                    {service.tag}
                  </span>
                </div>

                <h3 className="text-lg font-medium text-white group-hover:text-[#DB5B9A] transition-colors duration-300">
                  {service.name}
                </h3>
                <p className="text-sm text-stone-400 font-light mt-2 leading-relaxed flex-1">
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
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ============================================================
// GALERÍA — CON ANIMACIÓN DE ZOOM
// ============================================================
const GallerySection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section id="galeria" ref={ref} className="py-24 bg-[#0d0b0a] relative overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4">
        <motion.div 
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.span variants={fadeInUp} className="text-xs font-bold tracking-[0.3em] uppercase inline-block px-4 py-1.5 rounded-full border border-[#C9A96E]/20 text-[#C9A96E]">
            ✦ GALERÍA ✦
          </motion.span>
          <motion.h2 variants={fadeInUp} className="text-4xl sm:text-5xl font-light tracking-tight mt-4">
            Nuestros <span className="font-serif italic text-[#DB5B9A]">trabajos</span>
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {GALLERY_IMAGES.map((img, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
              className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <img 
                src={img.url} 
                alt={img.title}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              />
              <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-400 ${hoveredIndex === idx ? 'opacity-100' : 'opacity-0'}`}>
                <div className={`absolute bottom-0 left-0 right-0 p-3 transition-all duration-400 ${hoveredIndex === idx ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                  <p className="text-white text-xs font-medium">{img.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8"
        >
          <Link href="/galeria" className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-[#C9A96E] transition-colors">
            Ver toda la galería <FaArrowRight className="text-xs" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================
// TESTIMONIALS
// ============================================================
const TestimonialsSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="testimonios" ref={ref} className="py-24 bg-[#12100e] text-white border-t border-stone-900/50">
      <div className="w-full max-w-4xl mx-auto px-4">
        <motion.div 
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.span variants={fadeInUp} className="text-xs font-bold tracking-[0.3em] uppercase inline-block px-4 py-1.5 rounded-full border border-[#C9A96E]/20 text-[#C9A96E]">
            ✦ TESTIMONIOS ✦
          </motion.span>
          <motion.h2 variants={fadeInUp} className="text-4xl font-light tracking-tight mt-4">
            Lo que dicen <span className="font-serif italic text-[#DB5B9A]">nuestras clientas</span>
          </motion.h2>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-b from-[#1a1715] to-[#141211] border border-stone-800/50 rounded-3xl p-8 md:p-12 text-center shadow-2xl"
        >
          <FaQuoteLeft className="text-[#C9A96E]/20 text-5xl mx-auto mb-6" />
          
          <p className="text-lg md:text-xl text-stone-200 font-light leading-relaxed italic">
            "{TESTIMONIALS[currentIndex].comment}"
          </p>

          <div className="flex items-center justify-center gap-1 mt-6">
            {[...Array(TESTIMONIALS[currentIndex].rating)].map((_, i) => (
              <FaStar key={i} className="text-[#C9A96E] text-sm" />
            ))}
          </div>

          <p className="text-sm font-medium text-stone-300 mt-3">
            {TESTIMONIALS[currentIndex].name}
          </p>

          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'w-8 bg-gradient-to-r from-[#DB5B9A] to-[#C9A96E]' : 'w-3 bg-stone-700 hover:bg-stone-500'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================
// CTA FINAL
// ============================================================
const CtaSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section ref={ref} className="py-20 bg-[#0d0b0a] border-t border-stone-900/50">
      <div className="w-full max-w-4xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl p-12 text-center"
          style={{ background: `linear-gradient(135deg, ${COLORS.pink}20, ${COLORS.gold}15)` }}
        >
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-[100px] bg-[#DB5B9A]/10" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-[100px] bg-[#C9A96E]/10" />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-light text-white">
              ¿Lista para <span className="font-serif italic text-[#DB5B9A]">brillar</span>?
            </h2>
            <p className="text-stone-400 mt-3 max-w-md mx-auto">
              Reserva tu cita y descubre la experiencia Fresh Nails.
            </p>
            <Link 
              href="/agenda" 
              className="inline-flex items-center gap-3 px-8 py-4 mt-6 rounded-xl text-white font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-[#DB5B9A] to-[#C9A96E] hover:opacity-90 transition-all shadow-lg shadow-[#DB5B9A]/20 group"
            >
              <FaCalendarCheck />
              AGENDAR CITA
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================
// FOOTER
// ============================================================
const Footer = () => (
  <footer className="bg-[#090807] text-stone-400 text-sm pt-16 pb-8 border-t border-stone-900/50">
    <div className="w-full max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-stone-900/50">
      <div>
        <h3 className="text-xl font-serif tracking-wide text-white">Fresh<span className="text-[#DB5B9A]">.</span></h3>
        <p className="text-xs text-stone-500 mt-3 leading-relaxed">
          Redefiniendo el cuidado y la estética de tus uñas.
        </p>
        <div className="flex gap-3 mt-4">
          <a href="#" className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:border-[#C9A96E] transition-colors">
            <FaInstagram className="text-sm" />
          </a>
          <a href="#" className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:border-[#C9A96E] transition-colors">
            <FaWhatsapp className="text-sm" />
          </a>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200">Horarios</h4>
        <ul className="mt-3 space-y-2 text-xs">
          <li className="flex justify-between"><span>Lun a Vie</span><span className="text-stone-300">09:00 - 20:00</span></li>
          <li className="flex justify-between"><span>Sábados</span><span className="text-stone-300">09:00 - 18:00</span></li>
          <li className="flex justify-between text-[#DB5B9A]"><span>Domingos</span><span>Cerrado</span></li>
        </ul>
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200">Enlaces</h4>
        <ul className="mt-3 space-y-2 text-xs">
          <li><Link href="#servicios" className="hover:text-[#C9A96E] transition-colors">Servicios</Link></li>
          <li><Link href="#galeria" className="hover:text-[#C9A96E] transition-colors">Galería</Link></li>
          <li><Link href="/agenda" className="hover:text-[#C9A96E] transition-colors">Reservar</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200">Contacto</h4>
        <ul className="mt-3 space-y-2 text-xs">
          <li className="flex items-center gap-2"><FaPhoneAlt className="text-[#C9A96E] text-xs" /> 099 123 456</li>
          <li className="flex items-center gap-2"><FaMapMarkerAlt className="text-[#C9A96E] text-xs" /> Montevideo, Uruguay</li>
        </ul>
      </div>
    </div>
    <div className="w-full max-w-7xl mx-auto px-4 pt-6 text-center text-[10px] text-stone-600">
      © 2026 Fresh Beauty Studio. Todos los derechos reservados.
    </div>
  </footer>
)

// ============================================================
// MAIN
// ============================================================
export default function Home() {
  return (
    <main className="bg-[#0d0b0a] text-stone-300 min-h-screen overflow-x-hidden selection:bg-[#DB5B9A]/20 selection:text-[#DB5B9A]">
      <Header />
      <HeroSection />
      <ServicesSection />
      <GallerySection />
      <TestimonialsSection />
      <CtaSection />
      <Footer />
    </main>
  )
}