'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion'
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
  FaRegClock,
  FaSparkles,
  FaRegHeart,
  FaRegSmile,
  FaLeaf
} from 'react-icons/fa'
import { GiNails, GiSparkles, GiScissors, GiLipstick, GiFlowerEmblem } from 'react-icons/gi'

// ============================================================
// COLORES - PALETA PREMIUM
// ============================================================
const COLORS = {
  gold: '#D4AF37',
  goldLight: '#F4E4BC',
  goldGlow: 'rgba(212, 175, 55, 0.15)',
  pink: '#E86F9C',
  pinkDeep: '#D4537E',
  pinkGlow: 'rgba(232, 111, 156, 0.15)',
  copper: '#D4A373',
  dark: '#0A0808',
  darkCard: '#12100E',
  darkSurface: '#1A1715',
  white: '#FAF8F5',
  cream: '#F5F0E8'
}

// ============================================================
// ANIMACIONES AVANZADAS
// ============================================================
const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } }
}

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 }
  }
}

const floatAnimation = {
  y: [0, -10, 0],
  transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
}

const shimmer = {
  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 3s infinite'
}

// ============================================================
// SERVICIOS PREMIUM
// ============================================================
const SERVICES = [
  { 
    name: 'Manicura Rusa Premium',
    description: 'Técnica de precisión con fresas de diamante y gel estructural que esculpe, protege y unifica la uña natural.',
    price: 45,
    duration: 90,
    icon: GiNails,
    tag: '⭐ Más Solicitado',
    gradient: 'from-[#E86F9C] to-[#D4537E]',
    features: ['Pedicura incluida', 'Esmaltado semipermanente', 'Masaje relajante']
  },
  { 
    name: 'Extensiones Soft Gel',
    description: 'Tips de gel ultraligeros que se adaptan a tu uña natural. Flexibilidad y duración de hasta 4 semanas.',
    price: 65,
    duration: 120,
    icon: GiSparkles,
    tag: '🔥 Tendencia',
    gradient: 'from-[#D4AF37] to-[#C8962E]',
    features: ['Diseño personalizado', 'Gel de alta duración', 'Efecto natural']
  },
  { 
    name: 'Nail Art de Autor',
    description: 'Creaciones exclusivas con pan de oro, holografía, pedrería fina y arte en miniatura. Cada uña es única.',
    price: 55,
    duration: 105,
    icon: GiLipstick,
    tag: '✨ Obra de Arte',
    gradient: 'from-[#9B5DE5] to-[#7B2FBE]',
    features: ['Diseño a mano alzada', 'Elementos 3D', 'Acabado premium']
  },
  { 
    name: 'Peluquería & Styling',
    description: 'Cortes de autor, colorimetría avanzada y peinados de alta costura. Transformación total de tu look.',
    price: 50,
    duration: 90,
    icon: GiScissors,
    tag: '✂️ Vanguardia',
    gradient: 'from-[#2D9CDB] to-[#1A6B8A]',
    features: ['Productos orgánicos', 'Técnicas innovadoras', 'Asesoría personalizada']
  }
]

// ============================================================
// GALERÍA DESTACADA
// ============================================================
const GALLERY_IMAGES = [
  { 
    url: 'https://images.unsplash.com/photo-1591926079847-8181980b0f09?w=800&h=800&fit=crop&crop=center', 
    title: 'Manicura Rusa',
    category: 'Manicura'
  },
  { 
    url: 'https://images.unsplash.com/photo-1641814250010-9887d86eedfd?w=800&h=800&fit=crop&crop=center', 
    title: 'Extensiones Soft Gel',
    category: 'Extensiones'
  },
  { 
    url: 'https://images.unsplash.com/photo-1720343409646-960f6dcccae3?w=800&h=800&fit=crop&crop=center', 
    title: 'Nail Art Dorado',
    category: 'Arte'
  },
  { 
    url: 'https://images.unsplash.com/photo-1585885970325-81cba4494c27?w=800&h=800&fit=crop&crop=center', 
    title: 'Pedicura Premium',
    category: 'Pedicura'
  },
  { 
    url: 'https://images.unsplash.com/photo-1560869713-7d0a2943087e?w=800&h=800&fit=crop&crop=center', 
    title: 'Coloración Viva',
    category: 'Color'
  },
  { 
    url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=800&fit=crop&crop=center', 
    title: 'Esmaltado Premium',
    category: 'Esmaltado'
  }
]

// ============================================================
// TESTIMONIALS AUTÉNTICOS
// ============================================================
const TESTIMONIALS = [
  { 
    comment: "La manicura rusa es una obra de arte. La precisión y el cuidado son excepcionales. ¡Mis uñas nunca habían estado tan perfectas!", 
    name: "Valeria Martínez", 
    rating: 5,
    service: "Manicura Rusa"
  },
  { 
    comment: "El mejor salón de Montevideo. Los diseños de nail art son divinos y la atención es de primer nivel. Totalmente recomendado.", 
    name: "Carolina Rodríguez", 
    rating: 5,
    service: "Nail Art"
  },
  { 
    comment: "Llevo 3 años viniendo y nunca me decepcionan. La duración de las extensiones es increíble y siempre salgo con una sonrisa.", 
    name: "Agustina Sosa", 
    rating: 5,
    service: "Extensiones"
  }
]

// ============================================================
// STATS IMPRESIONANTES
// ============================================================
const STATS = [
  { number: '5+', label: 'Años de Experiencia', icon: FaAward },
  { number: '3K+', label: 'Clientas Felices', icon: FaRegSmile },
  { number: '100%', label: 'Esterilización Médica', icon: FaShieldAlt },
  { number: '4.9★', label: 'Valoración Media', icon: FaStar }
]

// ============================================================
// HEADER CON EFECTO GLASSMORPHISM
// ============================================================
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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
      scrolled 
        ? 'bg-[#0A0808]/95 backdrop-blur-2xl border-b border-[#D4AF37]/10 shadow-2xl shadow-black/50' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-24">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <motion.div 
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E86F9C] to-[#D4AF37] flex items-center justify-center shadow-2xl shadow-[#E86F9C]/25 group-hover:shadow-[#D4AF37]/50 transition-all duration-500">
                <FaGem className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#E86F9C] to-[#D4AF37] blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
            </motion.div>
            <span className="text-white font-serif text-2xl tracking-tight group-hover:text-[#D4AF37] transition-colors duration-300">
              Fresh<span className="text-[#E86F9C]">.</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {['Servicios', 'Galería', 'Testimonios'].map((item) => (
              <Link 
                key={item}
                href={`#${item.toLowerCase()}`} 
                className="text-sm text-stone-400 hover:text-white transition-all duration-300 relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#E86F9C] to-[#D4AF37] transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
            <Link 
              href="/agenda" 
              className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-gradient-to-r from-[#E86F9C] to-[#D4AF37] hover:shadow-2xl hover:shadow-[#E86F9C]/30 transition-all duration-500 transform hover:scale-105"
            >
              Agendar Cita
            </Link>
          </nav>

          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="md:hidden w-12 h-12 rounded-xl border border-stone-800 hover:border-[#D4AF37]/40 transition-all duration-300 flex items-center justify-center bg-stone-900/30 hover:bg-stone-900/60"
          >
            {isOpen ? <FaTimes className="w-5 h-5 text-white" /> : <FaBars className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-[#0A0808]/95 backdrop-blur-2xl border-t border-[#D4AF37]/10"
          >
            <div className="px-4 py-8 space-y-3">
              {['Servicios', 'Galería', 'Testimonios'].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="flex items-center gap-3 px-4 py-4 rounded-xl text-stone-400 hover:text-white hover:bg-stone-900/50 transition-all duration-300"
                  onClick={() => setIsOpen(false)}
                >
                  <FaStar className="w-4 h-4 text-[#D4AF37]" />
                  {item}
                </Link>
              ))}
              <Link 
                href="/agenda" 
                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-[#E86F9C] to-[#D4AF37] shadow-xl shadow-[#E86F9C]/20 hover:shadow-[#D4AF37]/30 transition-all duration-300"
                onClick={() => setIsOpen(false)}
              >
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
// HERO - EXPERIENCIA INMERSIVA
// ============================================================
const HeroSection = () => {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 150])
  const opacity = useTransform(scrollY, [0, 500], [1, 0.5])

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#0A0808] text-white overflow-hidden">
      {/* Fondo animado premium */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          style={{ y, opacity }}
          className="absolute inset-0"
        >
          {/* Orbes de luz */}
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full filter blur-[180px] animate-pulse" style={{ background: `${COLORS.pinkGlow}` }} />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full filter blur-[180px] animate-pulse delay-1000" style={{ background: `${COLORS.goldGlow}` }} />
          
          {/* Grid de lujo */}
          <div className="absolute inset-0 bg-[radial-gradient(#1c1917_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-30" />
          
          {/* Líneas de flujo */}
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1000 600">
            <path d="M 0 100 Q 200 50 400 120 T 800 80 T 1000 150" stroke="#D4AF37" strokeWidth="1" fill="none" className="animate-[path_10s_ease-in-out_infinite]" />
            <path d="M 0 300 Q 200 250 400 320 T 800 280 T 1000 350" stroke="#E86F9C" strokeWidth="0.8" fill="none" className="animate-[path_12s_ease-in-out_infinite_delay-2s]" />
            <path d="M 0 500 Q 200 450 400 520 T 800 480 T 1000 550" stroke="#D4AF37" strokeWidth="0.5" fill="none" className="animate-[path_14s_ease-in-out_infinite_delay-4s]" />
          </svg>
        </motion.div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center max-w-5xl mx-auto"
        >
          {/* Badge premium */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-4 bg-gradient-to-r from-[#D4AF37]/10 to-[#E86F9C]/10 border border-[#D4AF37]/30 px-6 py-3 rounded-full backdrop-blur-2xl mb-10"
          >
            <span className="flex h-3 w-3 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="flex h-3 w-3 rounded-full bg-[#E86F9C] animate-pulse delay-300" />
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
              ✦ Fresh Beauty Studio ✦
            </p>
            <span className="flex h-3 w-3 rounded-full bg-[#D4AF37] animate-pulse delay-700" />
            <span className="flex h-3 w-3 rounded-full bg-[#E86F9C] animate-pulse delay-1000" />
          </motion.div>

          {/* Título impactante */}
          <motion.h1 
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-tight leading-[0.95]"
          >
            Donde tus manos
            <br />
            <span className="font-serif italic font-normal bg-gradient-to-r from-[#E86F9C] via-[#D4AF37] to-[#D4A373] bg-clip-text text-transparent bg-[length:300%_auto] animate-gradient">
              se vuelven arte
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-base sm:text-lg text-stone-400 font-light max-w-2xl mx-auto mt-8 leading-relaxed"
          >
            Especialistas en manicura combinada, extensiones esculturales y nail art de autor. 
            Cada detalle está pensado para realzar tu belleza natural.
          </motion.p>

          {/* CTA Principal */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-12"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="/agenda" 
                className="group relative overflow-hidden rounded-2xl p-[2px] transition-all shadow-2xl shadow-[#E86F9C]/20 hover:shadow-[#D4AF37]/30"
              >
                <div className="bg-[#0A0808] group-hover:bg-transparent px-10 py-5 rounded-[14px] font-bold text-sm tracking-widest transition-all duration-500 flex items-center gap-4 text-white">
                  <FaCalendarCheck className="text-[#D4AF37] text-lg" />
                  RESERVAR CITA
                  <FaArrowRight className="text-sm group-hover:translate-x-2 transition-transform duration-500 text-[#D4AF37]" />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#E86F9C] to-[#D4AF37] -z-10 animate-gradient" style={{ backgroundSize: '200% 100%' }} />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="#servicios" 
                className="group bg-stone-900/60 hover:bg-stone-900/80 border border-stone-800 hover:border-[#D4AF37] px-10 py-5 rounded-2xl font-medium text-sm tracking-widest transition-all duration-500 flex items-center gap-3 text-stone-300 hover:text-white"
              >
                <FaSparkles className="text-[#D4AF37] group-hover:rotate-180 transition-transform duration-700" />
                VER SERVICIOS
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto mt-16 pt-10 border-t border-stone-900/50"
          >
            {STATS.map((stat, i) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + (i * 0.1) }}
                  className="text-center group"
                >
                  <div className="flex justify-center mb-2">
                    <Icon className="text-2xl text-[#D4AF37] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <p className="text-3xl font-serif italic text-white group-hover:text-[#D4AF37] transition-colors duration-300">
                    {stat.number}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">
                    {stat.label}
                  </p>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="w-6 h-10 rounded-full border-2 border-stone-700 flex justify-center p-1">
          <div className="w-1 h-2 bg-[#D4AF37] rounded-full animate-[scrollDown_2s_ease-in-out_infinite]" />
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes path {
          0%, 100% { transform: translateX(-30px); }
          50% { transform: translateX(30px); }
        }
        @keyframes scrollDown {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(10px); opacity: 0; }
        }
        .animate-gradient {
          animation: gradient 6s ease-in-out infinite;
        }
        .delay-1000 { animation-delay: 1s; }
        .delay-2s { animation-delay: 2s; }
        .delay-4s { animation-delay: 4s; }
        .delay-300 { animation-delay: 300ms; }
        .delay-700 { animation-delay: 700ms; }
        .delay-1000 { animation-delay: 1000ms; }
      `}</style>
    </section>
  )
}

// ============================================================
// SERVICIOS - TARJETAS DE LUJO
// ============================================================
const ServicesSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })

  return (
    <section id="servicios" ref={ref} className="py-32 bg-[#0A0808] text-white relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute -top-60 -right-60 w-[800px] h-[800px] rounded-full filter blur-[150px] bg-[#E86F9C]/5" />
      <div className="absolute -bottom-60 -left-60 w-[800px] h-[800px] rounded-full filter blur-[150px] bg-[#D4AF37]/5" />

      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        <motion.div 
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-20"
        >
          <motion.span 
            variants={fadeInUp} 
            className="text-xs font-bold tracking-[0.4em] uppercase inline-block px-6 py-2 rounded-full border border-[#D4AF37]/20 text-[#D4AF37] bg-[#D4AF37]/5 backdrop-blur-sm"
          >
            ✦ Servicios de Élite ✦
          </motion.span>
          <motion.h2 
            variants={fadeInUp} 
            className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight mt-6"
          >
            Experiencias que
            <br />
            <span className="font-serif italic text-[#E86F9C]">transforman</span>
          </motion.h2>
          <motion.p 
            variants={fadeInUp} 
            className="text-stone-400 mt-4 max-w-2xl mx-auto text-lg"
          >
            Descubre nuestra selección de servicios premium, diseñados para realzar tu belleza natural.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {SERVICES.map((service, idx) => {
            const Icon = service.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="group relative"
              >
                {/* Glow background */}
                <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-r ${service.gradient} opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-xl`} />
                
                <div className="relative bg-gradient-to-b from-[#1A1715] to-[#12100E] border border-stone-800/50 rounded-2xl p-8 transition-all duration-500 hover:-translate-y-2 hover:border-[#D4AF37]/30 hover:shadow-2xl hover:shadow-[#D4AF37]/5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5">
                    <motion.div 
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-white text-2xl shadow-xl`}
                    >
                      <Icon />
                    </motion.div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1.5 rounded-full">
                      {service.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-medium text-white group-hover:text-[#E86F9C] transition-colors duration-300">
                    {service.name}
                  </h3>
                  <p className="text-sm text-stone-400 font-light mt-3 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Features */}
                  <div className="mt-4 space-y-2">
                    {service.features.map((feature, fi) => (
                      <div key={fi} className="flex items-center gap-2 text-xs text-stone-500">
                        <FaCheckCircle className="text-[#D4AF37] text-[10px]" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="mt-6 pt-6 border-t border-stone-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-serif italic text-[#D4AF37]">${service.price}</span>
                      <span className="text-xs text-stone-500 flex items-center gap-1">
                        <FaClock className="text-[#D4AF37]" /> {service.duration}min
                      </span>
                    </div>
                    <Link 
                      href="/agenda" 
                      className="text-xs font-bold text-[#E86F9C] hover:text-[#D4AF37] transition-colors flex items-center gap-2 group"
                    >
                      Agendar 
                      <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
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
// GALERÍA - MASONRY LAYOUT
// ============================================================
const GallerySection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section id="galeria" ref={ref} className="py-32 bg-[#12100E] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#1c1917_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-30" />
      
      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        <motion.div 
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-20"
        >
          <motion.span 
            variants={fadeInUp} 
            className="text-xs font-bold tracking-[0.4em] uppercase inline-block px-6 py-2 rounded-full border border-[#D4AF37]/20 text-[#D4AF37] bg-[#D4AF37]/5 backdrop-blur-sm"
          >
            ✦ Galería ✦
          </motion.span>
          <motion.h2 
            variants={fadeInUp} 
            className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight mt-6"
          >
            Nuestros <span className="font-serif italic text-[#E86F9C]">trabajos</span>
          </motion.h2>
          <motion.p 
            variants={fadeInUp} 
            className="text-stone-400 mt-4"
          >
            Cada creación es única y está hecha con pasión
          </motion.p>
        </motion.div>

        <motion.div 
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
        >
          {GALLERY_IMAGES.map((img, idx) => (
            <motion.div
              key={idx}
              variants={fadeInScale}
              className={`relative rounded-2xl overflow-hidden cursor-pointer group ${
                idx === 0 || idx === 3 ? 'md:row-span-2' : ''
              }`}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className={`aspect-square ${(idx === 0 || idx === 3) ? 'md:aspect-auto md:h-[400px]' : ''} overflow-hidden`}>
                <img 
                  src={img.url} 
                  alt={img.title}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                />
              </div>
              
              {/* Overlay de lujo */}
              <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-500 ${
                hoveredIndex === idx ? 'opacity-100' : 'opacity-0'
              }`}>
                <div className={`absolute bottom-0 left-0 right-0 p-6 transition-all duration-500 ${
                  hoveredIndex === idx ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}>
                  <p className="text-white text-lg font-medium">{img.title}</p>
                  <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">
                    {img.category}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <Link 
            href="/galeria" 
            className="inline-flex items-center gap-3 text-sm text-stone-400 hover:text-[#D4AF37] transition-all duration-300 group"
          >
            Ver toda la galería 
            <FaArrowRight className="text-xs group-hover:translate-x-2 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================
// TESTIMONIALS - CARRUSEL PREMIUM
// ============================================================
const TestimonialsSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="testimonios" ref={ref} className="py-32 bg-[#0A0808] text-white relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full filter blur-[200px] bg-[#E86F9C]/5" />
      
      <div className="w-full max-w-5xl mx-auto px-4 relative z-10">
        <motion.div 
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.span 
            variants={fadeInUp} 
            className="text-xs font-bold tracking-[0.4em] uppercase inline-block px-6 py-2 rounded-full border border-[#D4AF37]/20 text-[#D4AF37] bg-[#D4AF37]/5 backdrop-blur-sm"
          >
            ✦ Testimonios ✦
          </motion.span>
          <motion.h2 
            variants={fadeInUp} 
            className="text-4xl sm:text-5xl font-light tracking-tight mt-6"
          >
            Lo que dicen <span className="font-serif italic text-[#E86F9C]">nuestras clientas</span>
          </motion.h2>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="bg-gradient-to-b from-[#1A1715] to-[#12100E] border border-stone-800/50 rounded-3xl p-8 md:p-14 text-center shadow-2xl">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <FaQuoteLeft className="text-[#D4AF37]/20 text-6xl mx-auto mb-8" />
              
              <p className="text-xl md:text-2xl text-stone-200 font-light leading-relaxed italic">
                "{TESTIMONIALS[currentIndex].comment}"
              </p>

              <div className="flex items-center justify-center gap-1 mt-8">
                {[...Array(TESTIMONIALS[currentIndex].rating)].map((_, i) => (
                  <FaStar key={i} className="text-[#D4AF37] text-lg" />
                ))}
              </div>

              <p className="text-base font-medium text-white mt-4">
                {TESTIMONIALS[currentIndex].name}
              </p>
              <p className="text-sm text-[#D4AF37] mt-1">
                {TESTIMONIALS[currentIndex].service}
              </p>
            </motion.div>

            {/* Indicadores */}
            <div className="flex justify-center gap-3 mt-10">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === currentIndex 
                      ? 'w-12 bg-gradient-to-r from-[#E86F9C] to-[#D4AF37]' 
                      : 'w-4 bg-stone-700 hover:bg-stone-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================
// CTA FINAL - IRRESISTIBLE
// ============================================================
const CtaSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section ref={ref} className="py-28 bg-[#0A0808] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_#D4AF37_0%,_transparent_70%)] opacity-[0.03]" />
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl p-12 md:p-16 text-center border border-[#D4AF37]/20"
          style={{ 
            background: 'linear-gradient(135deg, rgba(232, 111, 156, 0.08), rgba(212, 175, 55, 0.05))'
          }}
        >
          {/* Efectos decorativos */}
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-[120px] bg-[#E86F9C]/10" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-[120px] bg-[#D4AF37]/10" />
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <FaGem className="text-5xl text-[#D4AF37] mx-auto mb-6 opacity-50" />
            
            <h2 className="text-3xl sm:text-5xl font-light text-white">
              ¿Lista para <span className="font-serif italic text-[#E86F9C]">brillar</span>?
            </h2>
            <p className="text-stone-400 mt-4 max-w-lg mx-auto text-lg">
              Reserva tu cita hoy y descubre la experiencia Fresh Nails. 
              Tu belleza es nuestra pasión.
            </p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-10"
            >
              <Link 
                href="/agenda" 
                className="inline-flex items-center gap-4 px-10 py-5 rounded-2xl text-white font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-[#E86F9C] to-[#D4AF37] hover:shadow-2xl hover:shadow-[#E86F9C]/30 transition-all duration-500 group"
              >
                <FaCalendarCheck className="text-lg" />
                Agendar Cita
                <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </motion.div>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs text-stone-500">
              <span className="flex items-center gap-2">
                <FaCheckCircle className="text-[#D4AF37]" /> Sin costo de reserva
              </span>
              <span className="flex items-center gap-2">
                <FaCheckCircle className="text-[#D4AF37]" /> Confirma en minutos
              </span>
              <span className="flex items-center gap-2">
                <FaCheckCircle className="text-[#D4AF37]" /> Cambia tu cita sin problema
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================
// FOOTER - ELEGANTE
// ============================================================
const Footer = () => (
  <footer className="bg-[#060505] text-stone-400 text-sm pt-20 pb-8 border-t border-stone-900/50">
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-stone-900/50">
        {/* Brand */}
        <div>
          <h3 className="text-2xl font-serif tracking-wide text-white">
            Fresh<span className="text-[#E86F9C]">.</span>
          </h3>
          <p className="text-xs text-stone-500 mt-4 leading-relaxed max-w-xs">
            Redefiniendo el cuidado y la estética de tus uñas con técnicas de vanguardia y atención personalizada.
          </p>
          <div className="flex gap-3 mt-6">
            <a href="#" className="w-10 h-10 rounded-xl bg-stone-900/50 border border-stone-800 hover:border-[#D4AF37] flex items-center justify-center text-stone-400 hover:text-white transition-all duration-300 hover:scale-110">
              <FaInstagram className="text-sm" />
            </a>
            <a href="#" className="w-10 h-10 rounded-xl bg-stone-900/50 border border-stone-800 hover:border-[#D4AF37] flex items-center justify-center text-stone-400 hover:text-white transition-all duration-300 hover:scale-110">
              <FaWhatsapp className="text-sm" />
            </a>
          </div>
        </div>

        {/* Horarios */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200">Horarios</h4>
          <ul className="mt-4 space-y-3 text-xs">
            <li className="flex justify-between items-center">
              <span className="text-stone-500">Lun a Vie</span>
              <span className="text-stone-300 font-medium">09:00 - 20:00</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-stone-500">Sábados</span>
              <span className="text-stone-300 font-medium">09:00 - 18:00</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-stone-500">Domingos</span>
              <span className="text-[#E86F9C] font-medium">Cerrado</span>
            </li>
          </ul>
        </div>

        {/* Enlaces */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200">Enlaces</h4>
          <ul className="mt-4 space-y-3 text-xs">
            <li><Link href="#servicios" className="text-stone-500 hover:text-[#D4AF37] transition-colors">Servicios</Link></li>
            <li><Link href="#galeria" className="text-stone-500 hover:text-[#D4AF37] transition-colors">Galería</Link></li>
            <li><Link href="#testimonios" className="text-stone-500 hover:text-[#D4AF37] transition-colors">Testimonios</Link></li>
            <li><Link href="/agenda" className="text-stone-500 hover:text-[#D4AF37] transition-colors">Reservar</Link></li>
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200">Contacto</h4>
          <ul className="mt-4 space-y-4 text-xs">
            <li className="flex items-center gap-3 text-stone-500">
              <FaPhoneAlt className="text-[#D4AF37] text-xs" />
              <span className="text-stone-300">099 123 456</span>
            </li>
            <li className="flex items-center gap-3 text-stone-500">
              <FaMapMarkerAlt className="text-[#D4AF37] text-xs" />
              <span className="text-stone-300">Montevideo, Uruguay</span>
            </li>
            <li className="flex items-center gap-3 text-stone-500">
              <FaRegClock className="text-[#D4AF37] text-xs" />
              <span className="text-stone-300">Atención personalizada</span>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="pt-8 text-center text-[10px] text-stone-600">
        © 2026 Fresh Beauty Studio. Todos los derechos reservados. 
        <span className="hidden sm:inline"> Hecho con ❤️ en Uruguay</span>
      </div>
    </div>
  </footer>
)

// ============================================================
// MAIN
// ============================================================
export default function Home() {
  return (
    <main className="bg-[#0A0808] text-stone-300 min-h-screen overflow-x-hidden selection:bg-[#E86F9C]/20 selection:text-[#E86F9C]">
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