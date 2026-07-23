'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion'
import { 
  FaArrowRight, 
  FaQuoteLeft,
  FaInstagram,
  FaWhatsapp,
  FaStar,
  FaGem,
  FaBars,
  FaTimes,
  FaCalendarCheck,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaRegHeart,
  FaPalette,
  FaHandSparkles,
  FaAward,
  FaLeaf,
  FaChevronLeft,
  FaChevronRight,
  FaRegSun,
  FaCrown,
  FaRegStar
} from 'react-icons/fa'
import { GiNails, GiScissors, GiLipstick, GiFlowerEmblem, GiRose } from 'react-icons/gi'
import { HiOutlineSparkles } from 'react-icons/hi'

// ============================================================
// PALETA DE LUJO - ELEGANCIA SUPREMA
// ============================================================
const COLORS = {
  gold: '#D4AF37',
  goldLight: '#F4E4BC',
  goldGlow: 'rgba(212, 175, 55, 0.2)',
  rose: '#E879A0',
  roseLight: '#F5D4E0',
  roseGlow: 'rgba(232, 121, 160, 0.15)',
  blush: '#FFF8F5',
  cream: '#FFFCF8',
  white: '#FFFFFF',
  lightBg: '#FFF9F6',
  darkText: '#1A0E0A',
  textSoft: '#5C4A3E',
  textMuted: '#A89588',
  border: '#F0E4DA',
  goldBorder: '#D4AF37',
}

// ============================================================
// DATOS
// ============================================================
const SERVICES = [
  { 
    name: 'Manicura Rusa',
    description: 'Precisión absoluta con fresas de diamante para un acabado impecable que dura semanas.',
    price: 45,
    duration: 90,
    icon: GiNails,
    tag: '⭐ Premium',
    image: 'https://images.unsplash.com/photo-1591926079847-8181980b0f09?w=400&h=400&fit=crop'
  },
  { 
    name: 'Extensiones Soft Gel',
    description: 'Tips ultraligeros de alta resistencia que se adaptan perfectamente a tu uña natural.',
    price: 65,
    duration: 120,
    icon: FaHandSparkles,
    tag: '🔥 Top',
    image: 'https://images.unsplash.com/photo-1641814250010-9887d86eedfd?w=400&h=400&fit=crop'
  },
  { 
    name: 'Nail Art de Autor',
    description: 'Obras de arte en miniatura con pan de oro, holografía y pedrería de alta joyería.',
    price: 55,
    duration: 105,
    icon: FaPalette,
    tag: '✨ Exclusivo',
    image: 'https://images.unsplash.com/photo-1720343409646-960f6dcccae3?w=400&h=400&fit=crop'
  },
  { 
    name: 'Peluquería & Styling',
    description: 'Cortes de autor y colorimetría avanzada con productos orgánicos de lujo.',
    price: 50,
    duration: 90,
    icon: GiScissors,
    tag: '✂️ Vanguardia',
    image: 'https://images.unsplash.com/photo-1560869713-7d0a2943087e?w=400&h=400&fit=crop'
  }
]

const GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1591926079847-8181980b0f09?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1641814250010-9887d86eedfd?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1720343409646-960f6dcccae3?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1585885970325-81cba4494c27?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1560869713-7d0a2943087e?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=800&fit=crop'
]

const TESTIMONIALS = [
  { 
    name: 'Valeria Martínez',
    role: 'Clienta desde 2021',
    text: 'La manicura rusa es una obra de arte. La precisión y el cuidado son excepcionales.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop'
  },
  { 
    name: 'Carolina Rodríguez',
    role: 'Clienta desde 2022',
    text: 'El mejor salón de Montevideo. Los diseños de nail art son divinos y la atención es de primer nivel.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop'
  },
  { 
    name: 'Agustina Sosa',
    role: 'Clienta desde 2020',
    text: 'Llevo 3 años viniendo y nunca me decepcionan. La duración de las extensiones es increíble.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop'
  }
]

// ============================================================
// HEADER - ESPECTACULAR CON EFECTO JOYA
// ============================================================
const Header = () => {
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
        ? 'bg-white/95 backdrop-blur-2xl border-b border-[#D4AF37]/20 shadow-2xl' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-24">
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#E879A0] flex items-center justify-center shadow-xl shadow-[#D4AF37]/30">
                <FaGem className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#E879A0] blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
            </motion.div>
            <div>
              <span className="text-[#1A0E0A] font-serif text-2xl tracking-wider group-hover:text-[#D4AF37] transition-colors duration-300">
                Salon Fresh
              </span>
              <span className="block text-[10px] tracking-[0.3em] text-[#D4AF37] font-light uppercase -mt-1">
                Nails & Beauty
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {['Esencia', 'Servicios', 'Galería', 'Testimonios'].map((item) => (
              <Link 
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-[#5C4A3E] hover:text-[#D4AF37] transition-all duration-300 relative group font-light tracking-wide"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#E879A0] transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
            <Link 
              href="/agenda"
              className="px-8 py-3.5 text-xs font-light tracking-[0.2em] uppercase text-white bg-gradient-to-r from-[#D4AF37] to-[#E879A0] hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-500 rounded-full relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-2">
                <FaCalendarCheck className="text-xs" />
                Reservar Cita
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#E879A0] to-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
          </nav>

          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden w-12 h-12 flex items-center justify-center border border-[#F0E4DA] rounded-full hover:border-[#D4AF37]/40 transition-all hover:shadow-lg"
          >
            {isOpen ? <FaTimes className="text-[#1A0E0A]" /> : <FaBars className="text-[#1A0E0A]" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/95 backdrop-blur-2xl border-t border-[#F0E4DA]"
          >
            <div className="px-6 py-8 space-y-4">
              {['Esencia', 'Servicios', 'Galería', 'Testimonios'].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="block text-sm text-[#5C4A3E] hover:text-[#D4AF37] transition-all font-light tracking-wide"
                  onClick={() => setIsOpen(false)}
                >
                  {item}
                </Link>
              ))}
              <Link 
                href="/agenda"
                className="block w-full text-center px-6 py-4 text-xs font-light tracking-[0.2em] uppercase text-white bg-gradient-to-r from-[#D4AF37] to-[#E879A0] transition-all rounded-full"
                onClick={() => setIsOpen(false)}
              >
                Reservar Cita
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

// ============================================================
// HERO - IMPACTANTE
// ============================================================
const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - rect.width / 2) / 20
      const y = (e.clientY - rect.top - rect.height / 2) / 20
      setMousePosition({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#FFF8F5]">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8F5] via-[#FFFCF8] to-[#F5EDE0]" />
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full filter blur-[200px] bg-[#D4AF37]/20 animate-pulse-slow" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full filter blur-[200px] bg-[#E879A0]/15 animate-pulse-slow-delay" />
        <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_0.5px,transparent_0.5px)] [background-size:30px_30px] opacity-10" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.div
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.5, delay: 0.3 }}
            >
              <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm border border-[#D4AF37]/20 px-5 py-2 rounded-full mb-8 shadow-lg">
                <span className="flex h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse" />
                <span className="text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] font-light">
                  ✦ Atelier de Lujo ✦
                </span>
                <span className="flex h-2 w-2 rounded-full bg-[#E879A0] animate-pulse delay-300" />
              </div>

              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-[#1A0E0A] leading-[1.05] tracking-tight">
                Donde la belleza
                <br />
                <span className="relative inline-block">
                  <span className="italic bg-gradient-to-r from-[#D4AF37] via-[#E879A0] to-[#D4AF37] bg-clip-text text-transparent bg-[length:300%_auto] animate-gradient">
                    se convierte en arte
                  </span>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -top-6 -right-8 text-[#D4AF37]"
                  >
                    <FaGem className="text-lg" />
                  </motion.div>
                </span>
              </h1>

              <p className="text-[#5C4A3E] text-lg font-light max-w-xl mt-6 leading-relaxed">
                Un santuario de elegancia donde cada detalle está pensado para realzar 
                tu belleza natural con técnicas de vanguardia y materiales de lujo.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-wrap gap-4 mt-10"
            >
              <Link 
                href="/agenda"
                className="group relative px-10 py-4 bg-gradient-to-r from-[#D4AF37] to-[#E879A0] text-white text-xs font-light tracking-[0.2em] uppercase hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-500 rounded-full overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <FaCalendarCheck />
                  Reservar Cita
                  <FaArrowRight className="text-xs group-hover:translate-x-2 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#E879A0] to-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Link>

              <Link
                href="#esencia"
                className="px-10 py-4 border-2 border-[#D4AF37]/30 text-[#5C4A3E] text-xs font-light tracking-[0.2em] uppercase hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all duration-500 rounded-full flex items-center gap-3 bg-white/50 backdrop-blur-sm"
              >
                <FaLeaf className="text-[#D4AF37]" />
                Descubrir
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-center gap-16 mt-16 pt-8 border-t border-[#F0E4DA]"
            >
              <div className="group">
                <p className="text-4xl font-serif text-[#D4AF37] group-hover:scale-110 transition-transform">5+</p>
                <p className="text-[10px] text-[#5C4A3E] uppercase tracking-widest mt-1 font-light">Años de Excelencia</p>
              </div>
              <div className="group">
                <p className="text-4xl font-serif text-[#D4AF37] group-hover:scale-110 transition-transform">3K+</p>
                <p className="text-[10px] text-[#5C4A3E] uppercase tracking-widest mt-1 font-light">Clientas Satisfechas</p>
              </div>
              <div className="group">
                <p className="text-4xl font-serif text-[#D4AF37] group-hover:scale-110 transition-transform">4.9★</p>
                <p className="text-[10px] text-[#5C4A3E] uppercase tracking-widest mt-1 font-light">Valoración Premium</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
            style={{
              transform: `perspective(1000px) rotateY(${mousePosition.x}deg) rotateX(${-mousePosition.y}deg)`
            }}
          >
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#D4AF37]/20 via-[#E879A0]/10 to-[#D4AF37]/20 animate-spin-slow" />
              <div className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-[#D4AF37]/10 to-[#E879A0]/10 animate-spin-slow-reverse" />
              
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-[#D4AF37]/20 border-4 border-white/50">
                <img 
                  src="https://images.unsplash.com/photo-1632661674596-d0b39ea5b87d?w=600&h=600&fit=crop&crop=center"
                  alt="Belleza"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A0E0A]/20 to-transparent" />
              </div>

              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#E879A0] flex items-center justify-center shadow-2xl shadow-[#D4AF37]/30"
              >
                <FaCrown className="text-3xl text-white" />
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white shadow-2xl flex items-center justify-center border-2 border-[#D4AF37]/30"
              >
                <GiNails className="text-2xl text-[#D4AF37]" />
              </motion.div>

              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-1/2 -right-8 w-12 h-12 rounded-full bg-[#E879A0]/10 backdrop-blur-sm border border-[#E879A0]/30 flex items-center justify-center"
              >
                <HiOutlineSparkles className="text-xl text-[#E879A0]" />
              </motion.div>

              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
                className="absolute bottom-1/3 -left-6 w-10 h-10 rounded-full bg-[#D4AF37]/10 backdrop-blur-sm border border-[#D4AF37]/30 flex items-center justify-center"
              >
                <FaRegStar className="text-sm text-[#D4AF37]" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// SECCIÓN ESENCIA
// ============================================================
const EsenciaSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  const y1 = useTransform(scrollYProgress, [0, 1], [80, -80])
  const y2 = useTransform(scrollYProgress, [0, 1], [40, -40])
  const y3 = useTransform(scrollYProgress, [0, 1], [120, -120])

  return (
    <section id="esencia" ref={ref} className="py-32 bg-white relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full filter blur-[200px] bg-[#D4AF37]/10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full filter blur-[200px] bg-[#E879A0]/10" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 80 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="inline-block mb-6">
              <span className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-light border border-[#D4AF37]/20 px-5 py-2 rounded-full bg-white/50">
                Nuestra Esencia
              </span>
            </div>
            
            <h2 className="font-serif text-4xl md:text-5xl text-[#1A0E0A] mt-4 leading-tight">
              Donde el arte
              <br />
              <span className="italic bg-gradient-to-r from-[#D4AF37] to-[#E879A0] bg-clip-text text-transparent">
                encuentra su hogar
              </span>
            </h2>
            
            <p className="text-[#5C4A3E] font-light leading-relaxed mt-6 text-lg">
              En Salon Fresh Nails, cada detalle está cuidadosamente diseñado para ofrecerte 
              una experiencia de belleza única. Nuestra pasión por la excelencia se refleja 
              en cada servicio, desde la técnica hasta la atención personalizada.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-[#FFF8F5] border border-[#F0E4DA] p-5 rounded-2xl hover:border-[#D4AF37] transition-all group">
                <FaAward className="text-[#D4AF37] text-2xl mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm text-[#1A0E0A] font-light">Excelencia Artística</p>
              </div>
              <div className="bg-[#FFF8F5] border border-[#F0E4DA] p-5 rounded-2xl hover:border-[#E879A0] transition-all group">
                <FaRegHeart className="text-[#E879A0] text-2xl mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm text-[#1A0E0A] font-light">Cuidado Personalizado</p>
              </div>
            </div>
          </motion.div>

          <div className="relative h-[500px] lg:h-[600px]">
            <motion.div
              style={{ y: y1 }}
              className="absolute top-0 right-0 w-64 h-80 rounded-[40%_60%_30%_70%] overflow-hidden shadow-2xl border-4 border-white"
            >
              <img 
                src={GALLERY_IMAGES[0]} 
                alt="Arte en uñas"
                className="w-full h-full object-cover"
              />
            </motion.div>

            <motion.div
              style={{ y: y2 }}
              className="absolute bottom-0 left-0 w-56 h-72 rounded-[60%_30%_70%_40%] overflow-hidden shadow-2xl border-4 border-white"
            >
              <img 
                src={GALLERY_IMAGES[1]} 
                alt="Belleza"
                className="w-full h-full object-cover"
              />
            </motion.div>

            <motion.div
              style={{ y: y3 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-60 rounded-[40%_70%_50%_60%] overflow-hidden shadow-2xl border-4 border-[#D4AF37]/30"
            >
              <img 
                src={GALLERY_IMAGES[2]} 
                alt="Arte en uñas"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// SERVICIOS - TARJETAS CON EFECTO WOW
// ============================================================
const ServicesSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section id="servicios" ref={ref} className="py-32 bg-[#FFF8F5] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-5" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
          }}
          className="text-center mb-20"
        >
          <motion.span 
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-light border border-[#D4AF37]/20 px-5 py-2 rounded-full bg-white/50"
          >
            ✦ Servicios de Lujo ✦
          </motion.span>
          <motion.h2 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="font-serif text-4xl md:text-5xl text-[#1A0E0A] mt-6"
          >
            Experiencias que <span className="italic text-[#D4AF37]">transforman</span>
          </motion.h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {SERVICES.map((service, idx) => {
            const Icon = service.icon
            const isHovered = hoveredIndex === idx

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ delay: idx * 0.1 }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="group relative bg-white border border-[#F0E4DA] hover:border-[#D4AF37] rounded-2xl overflow-hidden transition-all duration-700 hover:shadow-2xl hover:shadow-[#D4AF37]/10"
              >
                <div className={`absolute inset-0 transition-all duration-700 ${
                  isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                }`}>
                  <img 
                    src={service.image} 
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
                </div>

                <div className="relative z-10 p-8">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    isHovered ? 'bg-[#D4AF37] text-white scale-110' : 'bg-[#FFF8F5] text-[#D4AF37]'
                  }`}>
                    <Icon className="text-2xl" />
                  </div>
                  
                  <h3 className={`text-xl font-serif mt-6 transition-colors duration-500 ${
                    isHovered ? 'text-[#D4AF37]' : 'text-[#1A0E0A]'
                  }`}>
                    {service.name}
                  </h3>
                  
                  <p className="text-[#5C4A3E] text-sm font-light mt-3 leading-relaxed">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#F0E4DA]">
                    <div>
                      <span className={`text-2xl font-serif transition-colors duration-500 ${
                        isHovered ? 'text-[#D4AF37]' : 'text-[#1A0E0A]'
                      }`}>
                        ${service.price}
                      </span>
                    </div>
                    <span className={`text-[10px] font-light tracking-wider uppercase px-4 py-1.5 rounded-full transition-all duration-500 ${
                      isHovered ? 'bg-[#D4AF37] text-white' : 'bg-[#FFF8F5] text-[#5C4A3E]'
                    }`}>
                      {service.tag}
                    </span>
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
// GALERÍA - CARRUSEL ESPECTACULAR
// ============================================================
const GallerySection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })

  return (
    <section id="galeria" ref={ref} className="py-32 bg-white relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#FFF8F5] via-white to-[#FFF8F5]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
          }}
          className="text-center mb-16"
        >
          <motion.span 
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-light border border-[#D4AF37]/20 px-5 py-2 rounded-full bg-white/50"
          >
            ✦ Galería ✦
          </motion.span>
          <motion.h2 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="font-serif text-4xl md:text-5xl text-[#1A0E0A] mt-6"
          >
            Nuestras <span className="italic text-[#D4AF37]">creaciones</span>
          </motion.h2>
        </motion.div>
      </div>

      <div className="relative">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="flex gap-4 w-max"
        >
          {[...GALLERY_IMAGES, ...GALLERY_IMAGES].map((img, idx) => (
            <div key={idx} className="w-72 md:w-96 flex-shrink-0 group">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-xl">
                <img 
                  src={img} 
                  alt={`Creación ${idx + 1}`}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A0E0A]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-white text-sm font-light tracking-wider">✨ Creación exclusiva</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-12 text-center">
        <Link 
          href="/galeria"
          className="inline-flex items-center gap-3 text-sm text-[#5C4A3E] hover:text-[#D4AF37] transition-all group font-light tracking-wider"
        >
          Ver toda la galería
          <FaArrowRight className="text-xs group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>
    </section>
  )
}

// ============================================================
// TESTIMONIOS
// ============================================================
const TestimonialsSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section id="testimonios" ref={ref} className="py-32 bg-[#FFF8F5] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full filter blur-[200px] bg-[#D4AF37]/10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full filter blur-[200px] bg-[#E879A0]/10" />
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
          }}
          className="text-center mb-16"
        >
          <motion.span 
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-light border border-[#D4AF37]/20 px-5 py-2 rounded-full bg-white/50"
          >
            ✦ Testimonios ✦
          </motion.span>
          <motion.h2 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="font-serif text-4xl md:text-5xl text-[#1A0E0A] mt-6"
          >
            Lo que <span className="italic text-[#D4AF37]">dicen</span>
          </motion.h2>
        </motion.div>

        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white border border-[#F0E4DA] rounded-3xl p-12 shadow-2xl hover:shadow-3xl transition-all"
        >
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#D4AF37]/30 shadow-xl">
              <img 
                src={TESTIMONIALS[currentIndex].image} 
                alt={TESTIMONIALS[currentIndex].name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="text-xl font-serif text-[#1A0E0A]">
                {TESTIMONIALS[currentIndex].name}
              </h4>
              <p className="text-[#5C4A3E] text-sm font-light">
                {TESTIMONIALS[currentIndex].role}
              </p>
            </div>
          </div>

          <FaQuoteLeft className="text-[#D4AF37]/20 text-4xl mb-4" />
          
          <p className="text-[#1A0E0A] font-light leading-relaxed text-lg">
            "{TESTIMONIALS[currentIndex].text}"
          </p>

          <div className="flex items-center gap-1 mt-6">
            {[...Array(TESTIMONIALS[currentIndex].rating)].map((_, i) => (
              <FaStar key={i} className="text-[#D4AF37] text-lg" />
            ))}
          </div>
        </motion.div>

        <div className="flex justify-center gap-3 mt-8">
          {TESTIMONIALS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1 rounded-full transition-all duration-500 ${
                idx === currentIndex 
                  ? 'w-12 bg-gradient-to-r from-[#D4AF37] to-[#E879A0]' 
                  : 'w-4 bg-[#F0E4DA] hover:bg-[#D4AF37]/50'
              }`}
            />
          ))}
        </div>
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
    <section ref={ref} className="py-28 bg-gradient-to-br from-[#FFF8F5] to-[#F5EDE0] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#D4AF37_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full filter blur-[200px] bg-[#D4AF37]/10" />
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-6"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#E879A0] flex items-center justify-center shadow-2xl shadow-[#D4AF37]/30">
              <FaGem className="text-3xl text-white" />
            </div>
          </motion.div>
          
          <h2 className="font-serif text-4xl md:text-5xl text-[#1A0E0A]">
            ¿Lista para <span className="italic text-[#D4AF37]">brillar</span>?
          </h2>
          
          <p className="text-[#5C4A3E] font-light mt-4 max-w-md mx-auto text-lg">
            Descubre una experiencia de belleza única en Salon Fresh Nails.
          </p>

          <Link 
            href="/agenda"
            className="inline-flex items-center gap-4 px-12 py-5 mt-10 bg-gradient-to-r from-[#D4AF37] to-[#E879A0] text-white hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-500 rounded-full text-xs font-light tracking-[0.2em] uppercase group"
          >
            <FaCalendarCheck />
            Agendar Cita
            <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
          </Link>

          <div className="flex flex-wrap justify-center gap-8 mt-8 text-xs text-[#5C4A3E] font-light">
            <span className="flex items-center gap-2">
              <FaStar className="text-[#D4AF37] text-[8px]" /> Sin costo de reserva
            </span>
            <span className="flex items-center gap-2">
              <FaStar className="text-[#D4AF37] text-[8px]" /> Confirmación inmediata
            </span>
            <span className="flex items-center gap-2">
              <FaStar className="text-[#D4AF37] text-[8px]" /> Flexibilidad total
            </span>
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
  <footer className="bg-white border-t border-[#F0E4DA] py-16">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="grid md:grid-cols-4 gap-12">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#E879A0] flex items-center justify-center shadow-lg shadow-[#D4AF37]/30">
              <FaGem className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[#1A0E0A] font-serif text-xl tracking-wider">
                Salon Fresh
              </span>
              <span className="block text-[8px] tracking-[0.3em] text-[#D4AF37] font-light uppercase">
                Nails & Beauty
              </span>
            </div>
          </Link>
          <p className="text-[#5C4A3E] text-xs font-light mt-4 leading-relaxed max-w-xs">
            Redefiniendo el cuidado y la estética con arte, pasión y excelencia.
          </p>
          <div className="flex gap-4 mt-6">
            <a href="#" className="text-[#5C4A3E] hover:text-[#D4AF37] transition-all hover:scale-110">
              <FaInstagram className="text-xl" />
            </a>
            <a href="#" className="text-[#5C4A3E] hover:text-[#D4AF37] transition-all hover:scale-110">
              <FaWhatsapp className="text-xl" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#D4AF37] font-light">
            Horarios
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-[#1A0E0A] font-light">
            <li className="flex justify-between border-b border-[#F0E4DA] pb-2">
              <span className="text-[#5C4A3E]">Lun a Vie</span>
              <span>09:00 - 20:00</span>
            </li>
            <li className="flex justify-between border-b border-[#F0E4DA] pb-2">
              <span className="text-[#5C4A3E]">Sábados</span>
              <span>09:00 - 18:00</span>
            </li>
            <li className="flex justify-between">
              <span className="text-[#5C4A3E]">Domingos</span>
              <span className="text-[#D4AF37]">Cerrado</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#D4AF37] font-light">
            Enlaces
          </h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link href="#esencia" className="text-[#5C4A3E] hover:text-[#D4AF37] transition-all">Esencia</Link></li>
            <li><Link href="#servicios" className="text-[#5C4A3E] hover:text-[#D4AF37] transition-all">Servicios</Link></li>
            <li><Link href="#galeria" className="text-[#5C4A3E] hover:text-[#D4AF37] transition-all">Galería</Link></li>
            <li><Link href="#testimonios" className="text-[#5C4A3E] hover:text-[#D4AF37] transition-all">Testimonios</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#D4AF37] font-light">
            Contacto
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-[#5C4A3E]">
            <li className="flex items-center gap-3">
              <FaPhoneAlt className="text-[#D4AF37] text-xs" />
              <span className="text-[#1A0E0A]">099 123 456</span>
            </li>
            <li className="flex items-center gap-3">
              <FaMapMarkerAlt className="text-[#D4AF37] text-xs" />
              <span className="text-[#1A0E0A]">Montevideo, Uruguay</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-[#F0E4DA] text-center text-[10px] text-[#5C4A3E] font-light">
        © 2026 Salon Fresh Nails. Todos los derechos reservados.
        <span className="hidden sm:inline ml-2">✦ Hecho con pasión en Uruguay</span>
      </div>
    </div>
  </footer>
)

// ============================================================
// MAIN
// ============================================================
export default function Home() {
  return (
    <main className="bg-white text-[#1A0E0A] min-h-screen overflow-x-hidden">
      <Header />
      <HeroSection />
      <EsenciaSection />
      <ServicesSection />
      <GallerySection />
      <TestimonialsSection />
      <CtaSection />
      <Footer />

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 4s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse 6s ease-in-out infinite;
        }
        .animate-pulse-slow-delay {
          animation: pulse 6s ease-in-out infinite 2s;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }
        .animate-spin-slow-reverse {
          animation: spin 25s linear infinite reverse;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  )
}