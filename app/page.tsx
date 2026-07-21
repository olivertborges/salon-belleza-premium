'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

import { 
  FaArrowRight, 
  FaQuoteLeft,
  FaCheckCircle,
  FaClock,
  FaAward,
  FaInstagram,
  FaFacebook,
  FaWhatsapp,
  FaShieldAlt,
  FaChevronLeft,
  FaChevronRight,
  FaStar,
  FaPlay,
  FaPause,
  FaGem,
  FaUser,
  FaBars, 
  FaTimes,
  FaCalendarCheck,
  FaGraduationCap
} from 'react-icons/fa'

// ============================================================
// COLORES DE LA MARCA
// ============================================================
const COLORS = {
  gold: '#C9A96E',
  goldLight: '#E8D5A8',
  goldDark: '#A8894A',
  pink: '#DB5B9A',
  pinkLight: '#E88AB8',
  pinkDark: '#C43A7A',
  copper: '#E5A46E',
  copperLight: '#F0C49A',
  dark: '#0d0b0a',
  darkCard: '#141211',
  darkBorder: '#1e1a18',
  white: '#FAF8F5'
}

// ============================================================
// IMÁGENES
// ============================================================
const GALLERY_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1591926079847-8181980b0f09?q=80&w=389&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Manicura Rusa',
    category: 'Combinada'
  },
  {
    url: 'https://images.unsplash.com/photo-1641814250010-9887d86eedfd?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Extensiones Soft Gel',
    category: 'Esculturales'
  },
  {
    url: 'https://images.unsplash.com/photo-1720343409646-960f6dcccae3?q=80&w=327&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Nail Art',
    category: 'Mano Alzada'
  },
  {
    url: 'https://images.unsplash.com/photo-1585885970325-81cba4494c27?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Micropigmentación',
    category: 'Cejas'
  },
]

const SERVICES = [
  { 
    name: 'Manicura Rusa Combinada & Capping', 
    description: 'Limpieza minuciosa de cutículas con fresas de alta precisión, seguida de un escudo de gel estructural que nivela, unifica y protege el crecimiento biológico.', 
    price: 45, 
    duration: 90, 
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&fit=crop&q=80',
    tag: 'Más Solicitado'
  },
  { 
    name: 'Extensiones Esculturales Soft Gel', 
    description: 'Arquitectura completa de la uña utilizando tips de gel preformados y adhesión molecular. Flexibilidad de vanguardia con un grosor natural.', 
    price: 65, 
    duration: 120, 
    image: 'https://images.unsplash.com/photo-1641814250010-9887d86eedfd?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    tag: 'Tendencia'
  },
  { 
    name: 'Nail Art de Autor (Mano Alzada)', 
    description: 'Llevamos tus ideas al lienzo. Diseños geométricos detallados, encapsulados con pan de oro, efectos holográficos avanzados y pedrería fina.', 
    price: 55, 
    duration: 105, 
    image: 'https://images.unsplash.com/photo-1720343409646-960f6dcccae3?q=80&w=327&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    tag: 'Estilo Único'
  },
]

const TESTIMONIALS = [
  {
    comment: "La precisión de la manicura rusa aquí es excelente. Mis cutículas nunca lucieron tan limpias y prolijas, y el capping me duró un mes entero. ¡Súper recomendable!",
    name: "Valeria Mendoza",
    service: "Manicura Rusa & Capping"
  },
  {
    comment: "Hice el curso en la academia y realmente impulsó mi trabajo. La paciencia de las instructoras y el nivel de detalle técnico es fantástico.",
    name: "Agustina Silva",
    service: "Alumna Academia"
  },
  {
    comment: "Un lugar con un gusto excelente. Los diseños a mano alzada son divinos. No cambio este salón por ningún otro.",
    name: "Carolina Rostagnol",
    service: "Nail Art"
  }
]

// ============================================================
// SUBCOMPONENTES
// ============================================================

// ============================================================
// HEADER REDISEÑADO - NAVBAR ESPECTACULAR
// ============================================================
const Header = () => {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Servicios', href: '#servicios', icon: 'FaScissors' },
    { name: 'Galería', href: '#galeria', icon: 'FaGem' },
    { name: 'Reservar', href: '/reservas', icon: 'FaCalendarCheck' },
    { name: 'Academia', href: '/academy', icon: 'FaGraduationCap' },
  ]

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-[#0d0b0a]/95 backdrop-blur-xl border-b border-[#C9A96E]/10 shadow-2xl shadow-black/50' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* ===== LOGO ===== */}
          <Link 
            href="/" 
            className="flex items-center gap-2 group shrink-0"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#DB5B9A] to-[#C9A96E] flex items-center justify-center shadow-lg shadow-[#DB5B9A]/20 group-hover:scale-110 transition-transform duration-300">
                <FaGem className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-[#DB5B9A]/20 to-[#C9A96E]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <span className="text-white font-serif text-xl tracking-tight group-hover:text-[#C9A96E] transition-colors duration-300">
              Fresh<span className="text-[#DB5B9A]">. NAILS</span>
            </span>
          </Link>

          {/* ===== DESKTOP NAV ===== */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = false // Podrías agregar lógica de active
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative group flex items-center gap-2 text-sm font-light tracking-wide transition-all duration-300 ${
                    isActive 
                      ? 'text-[#C9A96E]' 
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <span>{link.name}</span>
                  
                  {isActive && (
                    <motion.span 
                      layoutId="activeNav"
                      className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-[#DB5B9A] to-[#C9A96E] rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  <span className="absolute -bottom-1 left-0 right-0 h-[1px] bg-gradient-to-r from-[#DB5B9A]/0 via-[#C9A96E]/50 to-[#DB5B9A]/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
                </Link>
              )
            })}
          </nav>

          {/* ===== AUTH BUTTON DESKTOP ===== */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Link
                href={user.role === 'admin' || user.role === 'owner' || user.role === 'staff' ? '/dashboard' : '/portal'}
                className="group flex items-center gap-2 px-5 py-2 rounded-xl border border-[#C9A96E]/20 hover:border-[#C9A96E]/50 transition-all duration-300 bg-gradient-to-r from-[#DB5B9A]/5 to-[#C9A96E]/5 hover:from-[#DB5B9A]/10 hover:to-[#C9A96E]/10"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#DB5B9A] to-[#C9A96E] flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-[#DB5B9A]/20">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-xs text-stone-300 group-hover:text-white transition-colors font-medium">
                  Mi Cuenta
                </span>
                <FaArrowRight className="w-3 h-3 text-[#C9A96E] group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="group relative overflow-hidden px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-2 text-white">
                  <FaUser className="w-3.5 h-3.5" />
                  Iniciar Sesión
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-[#DB5B9A] to-[#C9A96E] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute inset-[1px] bg-[#0d0b0a] rounded-xl group-hover:opacity-0 transition-opacity duration-300" />
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#DB5B9A] to-[#C9A96E] blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
              </Link>
            )}
          </div>

          {/* ===== MOBILE MENU BUTTON ===== */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden relative w-10 h-10 rounded-xl border border-stone-800 hover:border-[#C9A96E]/40 transition-all duration-300 flex items-center justify-center bg-stone-900/30 backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isOpen ? (
                <FaTimes className="w-5 h-5 text-white" />
              ) : (
                <FaBars className="w-5 h-5 text-white" />
              )}
            </motion.div>
          </button>
        </div>
      </div>

      {/* ===== MOBILE MENU ===== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-[#C9A96E]/10 bg-[#0d0b0a]/95 backdrop-blur-xl"
          >
            <div className="px-4 py-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Nav Links Mobile */}
              <nav className="space-y-2">
                {navLinks.map((link, index) => {
                  return (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-stone-400 hover:text-white hover:bg-stone-900/50`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-stone-900 text-stone-500`}>
                          {link.name === 'Servicios' && <FaScissors className="w-4 h-4" />}
                          {link.name === 'Galería' && <FaGem className="w-4 h-4" />}
                          {link.name === 'Reservar' && <FaCalendarCheck className="w-4 h-4" />}
                          {link.name === 'Academia' && <FaGraduationCap className="w-4 h-4" />}
                        </div>
                        <span className="text-sm font-medium">{link.name}</span>
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>

              <div className="h-px bg-gradient-to-r from-transparent via-[#C9A96E]/20 to-transparent" />

              {/* Auth Section Mobile */}
              {user ? (
                <Link
                  href={user.role === 'admin' || user.role === 'owner' || user.role === 'staff' ? '/dashboard' : '/portal'}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#DB5B9A]/10 to-[#C9A96E]/10 border border-[#C9A96E]/20 text-white hover:from-[#DB5B9A]/20 hover:to-[#C9A96E]/20 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DB5B9A] to-[#C9A96E] flex items-center justify-center text-white font-bold shadow-lg shadow-[#DB5B9A]/20">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Mi Cuenta</p>
                    <p className="text-[10px] text-stone-400">{user.email}</p>
                  </div>
                  <FaArrowRight className="ml-auto text-[#C9A96E]" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#DB5B9A] to-[#C9A96E] text-white text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-all duration-300 shadow-lg shadow-[#DB5B9A]/20"
                >
                  <FaUser className="w-4 h-4" />
                  Iniciar Sesión
                </Link>
              )}

              {/* Social Icons Mobile */}
              <div className="flex items-center justify-center gap-6 pt-4">
                <a href="#" className="text-stone-500 hover:text-[#C9A96E] transition-colors hover:scale-110 transform duration-300">
                  <FaInstagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-stone-500 hover:text-[#C9A96E] transition-colors hover:scale-110 transform duration-300">
                  <FaWhatsapp className="w-5 h-5" />
                </a>
              </div>

              {/* Brand */}
              <div className="text-center pt-4">
                <p className="text-[10px] tracking-[0.3em] text-stone-600 font-light">
                  ✦ FRESH NAILS STUDIO ✦
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DB5B9A] animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] animate-pulse" style={{ animationDelay: '0.3s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DB5B9A] animate-pulse" style={{ animationDelay: '0.6s' }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0)

  const heroImages = [
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&fit=crop&q=90',
    'https://images.unsplash.com/photo-1641814280326-d74ea2300067?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://plus.unsplash.com/premium_photo-1661580887141-7adca5e04c02?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [heroImages.length])

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#0d0b0a] text-white pt-32 pb-24 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full filter blur-[150px] animate-pulse" style={{ background: `${COLORS.pink}15` }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full filter blur-[150px] animate-pulse" style={{ background: `${COLORS.gold}15` }} />
        <div className="absolute inset-0 bg-[radial-gradient(#1c1917_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-8">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#C9A96E]/10 to-[#DB5B9A]/10 border border-[#C9A96E]/30 px-5 py-2 rounded-full backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-[#C9A96E] animate-ping" />
              <p className="text-xs uppercase tracking-[0.3em] font-medium" style={{ color: COLORS.gold }}>
                ✦ Fresh Nails Salon ✦
              </p>
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extralight tracking-tight leading-[1.05]">
              <span className="text-stone-100">Donde tus manos</span>
              <br />
              <span className="font-serif italic font-normal" style={{ background: `linear-gradient(to right, ${COLORS.pink}, ${COLORS.gold}, ${COLORS.copper})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                se vuelven arte
              </span>
            </h1>

            <p className="text-base sm:text-lg text-stone-400 font-light max-w-xl leading-relaxed">
              Especialistas en manicura combinada y extensiones esculturales.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a 
                href="/reservas" 
                className="relative group overflow-hidden rounded-xl p-[1px] transition-all duration-300 shadow-[0_0_30px_rgba(219,91,154,0.2)] hover:shadow-[0_0_50px_rgba(219,91,154,0.4)]"
                style={{ background: `linear-gradient(to right, ${COLORS.pink}, ${COLORS.gold})` }}
              >
                <div className="bg-[#0d0b0a] text-white group-hover:bg-transparent px-8 py-4 rounded-[11px] font-medium text-sm tracking-wider transition-colors duration-300 flex items-center justify-center gap-3">
                  RESERVAR CITA
                  <FaArrowRight className="text-xs group-hover:translate-x-1.5 transition-transform duration-300" style={{ color: COLORS.gold }} />
                </div>
              </a>
              <a 
                href="#servicios" 
                className="group bg-stone-900/60 hover:bg-stone-900 border border-stone-800 hover:border-[#C9A96E] px-8 py-4 rounded-xl font-medium text-sm tracking-wider transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                <FaStar className="text-xs group-hover:rotate-180 transition-transform duration-500" style={{ color: COLORS.gold }} />
                VER SERVICIOS
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-12 border-t border-stone-900 max-w-md">
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
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="relative w-full max-w-md mx-auto aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-stone-800">
              {heroImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    idx === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img src={img} alt="Fresh Nails" className="w-full h-full object-cover" />
                </div>
              ))}

              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b0a] via-transparent to-transparent opacity-60" />

              <div className="absolute bottom-6 left-6 right-6 z-20 bg-[#0d0b0a]/85 backdrop-blur-xl border border-[#C9A96E]/30 p-5 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl border border-[#C9A96E]/30 flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, ${COLORS.pink}20, ${COLORS.gold}20)` }}>
                    <FaGem className="animate-pulse" style={{ color: COLORS.gold }} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200">Garantía Crystal Gloss</h4>
                    <p className="text-[11px] text-stone-400 font-light mt-0.5">Brillo blindado por hasta 21 días</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {heroImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === currentSlide ? 'w-6' : 'w-3 bg-stone-700 hover:bg-stone-500'
                    }`}
                    style={i === currentSlide ? { background: `linear-gradient(to right, ${COLORS.pink}, ${COLORS.gold})` } : {}}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const FeaturedGallery = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section className="py-24 bg-[#0d0b0a] relative overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-[0.3em] uppercase inline-block px-4 py-1.5 rounded-full border border-[#C9A96E]/20" style={{ color: COLORS.gold }}>
            ✦ GALERÍA DESTACADA ✦
          </span>
          <h2 className="text-4xl sm:text-5xl font-extralight tracking-tight mt-4">
            Nuestros <span className="font-serif italic" style={{ color: COLORS.pink }}>trabajos</span> más recientes
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GALLERY_IMAGES.map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <img 
                src={img.url} 
                alt={img.title}
                className="w-full h-full object-cover transition-all duration-700 ease-out"
                style={{ 
                  transform: hoveredIndex === idx ? 'scale(1.12)' : 'scale(1)',
                  filter: hoveredIndex === idx ? 'brightness(0.9)' : 'brightness(1)'
                }}
              />

              <div 
                className="absolute inset-0 bg-gradient-to-t from-[#0d0b0a] via-transparent to-transparent transition-opacity duration-400"
                style={{ opacity: hoveredIndex === idx ? 0.8 : 0 }}
              />

              <div 
                className="absolute bottom-0 left-0 right-0 p-4 transition-all duration-400"
                style={{ 
                  transform: hoveredIndex === idx ? 'translateY(0)' : 'translateY(20px)',
                  opacity: hoveredIndex === idx ? 1 : 0
                }}
              >
                <h4 className="text-white text-sm font-medium">{img.title}</h4>
                <p className="text-xs" style={{ color: COLORS.gold }}>{img.category}</p>
              </div>

              <div className="absolute top-3 left-3">
                <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-[#C9A96E]/30" style={{ color: COLORS.gold, background: 'rgba(13,11,10,0.6)' }}>
                  Fresh Nails
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const ServicesSection = () => (
  <section id="servicios" className="py-32 bg-[#12100e] text-white relative overflow-hidden">
    <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full filter blur-[120px]" style={{ background: `${COLORS.pink}15` }} />
    <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full filter blur-[120px]" style={{ background: `${COLORS.gold}15` }} />

    <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
      <div className="max-w-3xl mx-auto text-center mb-24 space-y-4">
        <span className="text-xs font-bold tracking-[0.3em] uppercase inline-block px-4 py-1.5 rounded-full border border-[#C9A96E]/20" style={{ color: COLORS.gold }}>
          ✦ NUESTROS SERVICIOS ✦
        </span>
        <h2 className="text-4xl sm:text-5xl font-extralight tracking-tight">
          Tratamientos de <span className="font-serif italic" style={{ color: COLORS.pink }}>Fresh Nails</span>
        </h2>
        <div className="h-[2px] w-24 mx-auto mt-4" style={{ background: `linear-gradient(to right, transparent, ${COLORS.gold}, transparent)` }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {SERVICES.map((service, idx) => (
          <div
            key={idx}
            className="group bg-gradient-to-b from-[#1a1715] to-[#141211] border border-stone-850 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:border-[#C9A96E]/30 hover:shadow-2xl hover:shadow-[#C9A96E]/5 flex flex-col justify-between"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
              <img 
                src={service.image} 
                alt={service.name}
                className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1715] via-transparent to-transparent z-10" />

              <span className="absolute top-4 left-4 z-20 bg-[#0d0b0a]/80 backdrop-blur-md border border-[#C9A96E]/30 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md" style={{ color: COLORS.gold }}>
                {service.tag}
              </span>

              <div 
                className="absolute bottom-4 right-4 z-20 font-serif italic text-white text-xl px-4 py-1.5 rounded-xl shadow-lg shadow-black/40"
                style={{ background: `linear-gradient(to bottom right, ${COLORS.pink}, ${COLORS.pinkDark})` }}
              >
                ${service.price}
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h3 className="text-xl font-medium tracking-tight text-stone-100 group-hover:text-[#DB5B9A] transition-colors duration-300">
                  {service.name}
                </h3>
                <p className="text-sm text-stone-400 font-light leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="pt-4 border-t border-stone-800/60 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-stone-400 font-light">
                  <FaClock style={{ color: COLORS.gold }} className="text-xs" /> {service.duration} Minutos
                </span>
                <a 
                  href="/reservas" 
                  className="inline-flex items-center gap-1 text-xs font-bold transition-colors duration-300" 
                  style={{ color: COLORS.pink }}
                >
                  AGENDAR CITA <FaArrowRight className="text-[10px]" />
                </a>
              </div>
            </div>

            <div 
              className="h-[2px] transition-all duration-500 group-hover:scale-x-100 scale-x-0"
              style={{ 
                background: `linear-gradient(to right, ${COLORS.pink}, ${COLORS.gold}, ${COLORS.copper})`,
                transformOrigin: 'left'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  </section>
)

const AcademySection = () => {
  const courses = [
    {
      level: 'Nivel Inicial / Intermedio',
      title: 'Capacitación en Manicura Rusa Combinada',
      description: 'Domina el control del torno, la correcta selección de fresas diamantadas y el corte limpio de cutícula. Incluye química de productos y anatomía de la placa ungueal.',
      duration: '3 Días Intensivos',
      perks: ['Kit de Práctica Completo', 'Modelos Reales Incluidas', 'Certificado de Asistencia', 'Soporte Post-Curso']
    },
    {
      level: 'Nivel Avanzado / Perfeccionamiento',
      title: 'Estructuras y Nail Art Avanzado',
      description: 'Lleva tus habilidades al siguiente nivel. Aprendizaje especializado en reversas, encastre preciso de moldes, manejo de Polygel y simetría en puntas comerciales.',
      duration: '2 Jornadas Completas',
      perks: ['Materiales de Alta Calidad', 'Dosier Técnico Detallado', 'Sesión de Fotos de Portafolio', 'Soporte Post-Curso de 6 meses']
    }
  ]

  return (
    <section className="py-32 bg-[#0d0b0a] text-white relative overflow-hidden border-t border-stone-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#1c1917_0%,transparent_60%)] opacity-30" />

      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-20">
          <div className="lg:col-span-6">
            <span className="text-xs font-bold tracking-[0.3em] block mb-2" style={{ color: COLORS.gold }}>✦ FRESH NAILS ACADEMY ✦</span>
            <h2 className="text-4xl sm:text-5xl font-extralight tracking-tight leading-none">
              Perfecciona tu técnica y <br />
              <span className="font-serif italic font-normal" style={{ color: COLORS.pink }}>Emprende con Éxito</span>
            </h2>
          </div>
          <div className="lg:col-span-6">
            <p className="text-stone-400 font-light text-sm sm:text-base leading-relaxed">
              Formamos a profesionales con técnicas actualizadas del mercado. Nuestros programas te dotarán de la precisión y herramientas necesarias para destacar en el sector de la estética de uñas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {courses.map((course, index) => (
            <div 
              key={index} 
              className="bg-gradient-to-b from-[#141211] to-[#0f0d0c] border border-stone-850 rounded-3xl p-8 md:p-10 transition-all duration-500 group relative overflow-hidden hover:-translate-y-2 hover:border-[#C9A96E]/20 hover:shadow-2xl hover:shadow-[#C9A96E]/5"
            >
              <div className="flex flex-col h-full justify-between space-y-8">
                <div className="space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-md inline-block border border-[#C9A96E]/20" style={{ color: COLORS.gold }}>
                    {course.level}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-serif text-stone-100 group-hover:text-[#DB5B9A] transition-colors duration-300">
                    {course.title}
                  </h3>
                  <p className="text-sm text-stone-400 font-light leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-stone-850">
                  <p className="text-xs font-bold uppercase text-stone-400 tracking-wider flex items-center gap-2">
                    <FaAward style={{ color: COLORS.gold }} /> Contenido del Curso:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.perks.map((perk, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2 text-xs text-stone-300 font-light">
                        <FaCheckCircle className="text-[10px] flex-shrink-0" style={{ color: COLORS.pink }} />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <span className="text-xs text-stone-400 flex items-center gap-2 bg-stone-900 px-4 py-2 rounded-xl border border-stone-800">
                    ⏱️ <strong className="text-stone-200">{course.duration}</strong>
                  </span>
                  <a 
                    href="/academy" 
                    className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 text-center hover:opacity-90"
                    style={{ background: `linear-gradient(to right, ${COLORS.pink}, ${COLORS.gold})`, color: COLORS.white }}
                  >
                    CONSULTAR INFORMACIÓN
                  </a>
                </div>
              </div>

              <div className="absolute -top-40 -right-40 w-60 h-60 rounded-full filter blur-[80px] group-hover:opacity-100 opacity-0 transition-opacity duration-700" style={{ background: `${COLORS.pink}10` }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [isPlaying])

  return (
    <section className="py-32 bg-[#12100e] text-white border-t border-stone-900 relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full filter blur-[100px]" style={{ background: `${COLORS.pink}10` }} />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full filter blur-[100px]" style={{ background: `${COLORS.gold}10` }} />

      <div className="w-full max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16 space-y-2">
          <span className="text-xs font-bold tracking-[0.25em] uppercase block" style={{ color: COLORS.pink }}>
            ✦ TESTIMONIOS ✦
          </span>
          <h2 className="text-4xl font-extralight tracking-tight">
            Lo que dicen <span className="font-serif italic" style={{ color: COLORS.gold }}>nuestras clientas</span>
          </h2>
        </div>

        <div className="relative bg-gradient-to-b from-[#1a1715] to-[#141211] border border-stone-850 rounded-3xl p-8 md:p-16 text-center shadow-2xl min-h-[340px] flex flex-col justify-center overflow-hidden">
          <FaQuoteLeft className="text-stone-800 text-6xl absolute top-8 left-8 opacity-40 pointer-events-none" style={{ color: COLORS.gold }} />

          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === currentIndex ? '24px' : '12px',
                  background: i === currentIndex 
                    ? `linear-gradient(to right, ${COLORS.pink}, ${COLORS.gold})` 
                    : '#3d3d3d'
                }}
              />
            ))}
          </div>

          <div className="space-y-6 transition-all duration-500">
            <p className="text-lg md:text-xl text-stone-300 font-light leading-relaxed italic">
              "{TESTIMONIALS[currentIndex].comment}"
            </p>

            <div className="pt-4 flex flex-col items-center">
              <span className="text-sm font-semibold text-stone-100 tracking-wide">
                {TESTIMONIALS[currentIndex].name}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest mt-1 px-2.5 py-0.5 rounded" style={{ color: COLORS.gold, background: `${COLORS.gold}10`, border: `1px solid ${COLORS.gold}20` }}>
                {TESTIMONIALS[currentIndex].service}
              </span>
            </div>
          </div>

          <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 flex gap-2">
            <button 
              onClick={() => setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
              className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 hover:border-[#C9A96E] text-stone-400 hover:text-white transition-all duration-300 flex items-center justify-center"
            >
              <FaChevronLeft className="text-xs" />
            </button>
            <button 
              onClick={() => setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length)}
              className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 hover:border-[#C9A96E] text-stone-400 hover:text-white transition-all duration-300 flex items-center justify-center"
            >
              <FaChevronRight className="text-xs" />
            </button>
          </div>

          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute right-4 md:right-6 bottom-4 md:bottom-6 w-8 h-8 rounded-full bg-stone-900 border border-stone-800 text-stone-400 hover:text-white transition-all duration-300 flex items-center justify-center"
          >
            {isPlaying ? <FaPause className="text-[10px]" /> : <FaPlay className="text-[10px]" />}
          </button>
        </div>
      </div>
    </section>
  )
}

const HygieneSection = () => (
  <section className="py-24 bg-[#0d0b0a] text-white border-t border-stone-900 relative overflow-hidden">
    <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
      <div className="bg-gradient-to-r from-[#141211] to-[#1e1917] border border-stone-850 rounded-3xl p-8 md:p-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-4 flex justify-center md:justify-start">
          <div className="w-24 h-24 rounded-2xl border border-[#C9A96E]/30 flex items-center justify-center text-4xl shadow-inner" style={{ background: `linear-gradient(to bottom right, ${COLORS.pink}10, ${COLORS.gold}10)` }}>
            <FaShieldAlt className="animate-pulse" style={{ color: COLORS.gold }} />
          </div>
        </div>
        <div className="md:col-span-8 space-y-3">
          <span className="text-[10px] font-bold tracking-widest uppercase block" style={{ color: COLORS.gold }}>✦ PROTOCOLOS DE HIGIENE ✦</span>
          <h3 className="text-2xl sm:text-3xl font-serif text-stone-100">Bioseguridad y Cuidado Integral</h3>
          <p className="text-sm text-stone-400 font-light leading-relaxed">
            Tu bienestar es nuestra prioridad. Todo nuestro instrumental metálico pasa por un proceso riguroso de tres etapas: desinfección por inmersión, lavado ultrasónico y esterilización térmica en autoclave. Los sobres esterilizados se abren en tu presencia al iniciar la sesión.
          </p>
        </div>
      </div>
    </div>
  </section>
)

const Footer = () => (
  <footer className="bg-[#090807] text-stone-400 text-sm pt-24 pb-12 border-t border-stone-900">
    <div className="w-full max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-stone-900">
      <div className="space-y-5">
        <h3 className="text-xl font-serif tracking-wide text-stone-100 italic">
          Salon Fresh Nails<span style={{ color: COLORS.pink }}>.</span>
        </h3>
        <p className="text-xs text-stone-500 leading-relaxed font-light">
          Redefiniendo el cuidado y la estética de tus uñas. Salud ungueal, diseños actuales y atención personalizada.
        </p>
        <div className="flex items-center gap-3 pt-2">
          <a href="#" className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:border-[#C9A96E] transition-colors">
            <FaInstagram className="text-sm" />
          </a>
          <a href="#" className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:border-[#C9A96E] transition-colors">
            <FaFacebook className="text-sm" />
          </a>
          <a href="#" className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:border-[#C9A96E] transition-colors">
            <FaWhatsapp className="text-sm" />
          </a>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200">Horarios</h4>
        <ul className="space-y-2 text-xs font-light">
          <li className="flex justify-between pb-1 border-b border-stone-900">
            <span>Lunes a Viernes</span>
            <span className="text-stone-300">09:00 - 20:00 h</span>
          </li>
          <li className="flex justify-between pb-1 border-b border-stone-900">
            <span>Sábados</span>
            <span className="text-stone-300">09:00 - 18:00 h</span>
          </li>
          <li className="flex justify-between" style={{ color: COLORS.pink }}>
            <span>Domingos & Feriados</span>
            <span>Cerrado</span>
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200">Navegación</h4>
        <ul className="space-y-2 text-xs font-light grid grid-cols-2 gap-2">
          <li><a href="#servicios" className="hover:text-[#C9A96E] transition-colors">Servicios</a></li>
          <li><a href="/reservas" className="hover:text-[#C9A96E] transition-colors">Reservar</a></li>
          <li><a href="/academy" className="hover:text-[#C9A96E] transition-colors">Academia</a></li>
          <li><a href="/contacto" className="hover:text-[#C9A96E] transition-colors">Contacto</a></li>
          <li><a href="/login" className="hover:text-[#C9A96E] transition-colors">Iniciar Sesión</a></li>
        </ul>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200">Novedades</h4>
        <p className="text-xs text-stone-500 leading-relaxed font-light">
          Recibe información sobre la apertura de agendas mensuales y nuevos talleres.
        </p>
        <div className="space-y-2">
          <input 
            type="email" 
            placeholder="Tu correo..." 
            className="w-full bg-stone-900 border border-stone-800 focus:border-[#C9A96E] focus:outline-none text-xs rounded-xl px-4 py-3 text-stone-200 placeholder-stone-600 transition-colors"
          />
          <button 
            className="w-full text-white text-xs font-bold uppercase tracking-widest py-3 rounded-xl transition-all duration-300 hover:opacity-90"
            style={{ background: `linear-gradient(to right, ${COLORS.pink}, ${COLORS.gold})` }}
          >
            SUSCRIBIRME
          </button>
        </div>
      </div>
    </div>

    <div className="w-full max-w-7xl mx-auto px-4 pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-600 font-light gap-4">
      <p>© 2026 Salon Fresh Nails. Todos los derechos reservados.</p>
      <div className="flex gap-6">
        <a href="#" className="hover:text-stone-400 transition-colors">Políticas de Cancelación</a>
        <a href="#" className="hover:text-stone-400 transition-colors">Términos del Servicio</a>
      </div>
    </div>
  </footer>
)

// ============================================================
// MAIN EXPORT COMPONENT
// ============================================================
export default function Home() {
  return (
    <main className="bg-[#0d0b0a] text-stone-300 min-h-screen overflow-x-hidden selection:bg-[#DB5B9A]/20 selection:text-[#DB5B9A]">
      <Header />
      <HeroSection />
      <FeaturedGallery />
      <ServicesSection />
      <AcademySection />
      <TestimonialsSection />
      <HygieneSection />
      <Footer />
    </main>
  )
}