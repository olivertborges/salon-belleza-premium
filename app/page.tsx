'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion'
import { 
  FaArrowRight, 
  FaQuoteLeft,
  FaClock,
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
  FaRegSmile,
  FaAward,
  FaLeaf,
  FaChevronLeft,
  FaChevronRight,
  FaFeatherAlt,
  FaRegSun
} from 'react-icons/fa'
import { GiNails, GiScissors, GiLipstick, GiFlowerEmblem } from 'react-icons/gi'

// ============================================================
// PALETA DE LUZ Y ELEGANCIA
// ============================================================
const COLORS = {
  gold: '#C9A96E',
  goldLight: '#F0E3C8',
  goldGlow: 'rgba(201, 169, 110, 0.15)',
  rose: '#E8B4C8',
  roseLight: '#F5E0E8',
  roseDark: '#D498B0',
  blush: '#FDF6F0',
  cream: '#FCF8F3',
  white: '#FFFFFF',
  lightBg: '#FBF7F2',
  darkText: '#2D1B13',
  textSoft: '#6B5A4E',
  textMuted: '#A89588',
  border: '#E8DDD5',
  goldBorder: '#C9A96E',
}

// ============================================================
// DATOS
// ============================================================
const SERVICES = [
  { 
    name: 'Manicura Rusa',
    description: 'Técnica de precisión con fresas de diamante para un acabado impecable y duradero.',
    price: 45,
    duration: 90,
    icon: GiNails,
    tag: 'Premium',
    color: '#C9A96E',
    bgColor: '#F5EDE0'
  },
  { 
    name: 'Extensiones Soft Gel',
    description: 'Tips ultraligeros con flexibilidad y duración de hasta 4 semanas.',
    price: 65,
    duration: 120,
    icon: FaHandSparkles,
    tag: 'Top ventas',
    color: '#E8B4C8',
    bgColor: '#F5E0E8'
  },
  { 
    name: 'Nail Art de Autor',
    description: 'Diseños exclusivos con pan de oro, holografía y pedrería fina.',
    price: 55,
    duration: 105,
    icon: FaPalette,
    tag: 'Edición limitada',
    color: '#D498B0',
    bgColor: '#F0E0E8'
  },
  { 
    name: 'Peluquería & Styling',
    description: 'Cortes de autor, colorimetría avanzada y peinados de alta costura.',
    price: 50,
    duration: 90,
    icon: GiScissors,
    tag: 'Vanguardia',
    color: '#C9A96E',
    bgColor: '#F5EDE0'
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
    text: 'La manicura rusa es una obra de arte. La precisión y el cuidado son excepcionales. Mis uñas nunca habían estado tan perfectas.',
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
  },
  { 
    name: 'Lucía Fernández',
    role: 'Clienta desde 2023',
    text: 'El ambiente es relajante y el resultado es espectacular. Realmente entienden lo que quieres.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop'
  },
  { 
    name: 'Mía Torres',
    role: 'Clienta desde 2021',
    text: 'La atención personalizada y la calidad de los productos hacen la diferencia. 100% recomendado.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop'
  }
]

// ============================================================
// HEADER - TRANSPARENTE CON GLASSMORPHISM LUMINOSO
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
        ? 'bg-white/90 backdrop-blur-2xl border-b border-[#C9A96E]/10 shadow-sm' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-24">
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="w-10 h-10 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/30 flex items-center justify-center group-hover:bg-[#C9A96E]/20 transition-all">
                <FaGem className="w-4 h-4 text-[#C9A96E]" />
              </div>
            </motion.div>
            <span className="text-[#2D1B13] font-serif text-xl tracking-wider">
              FRESH<span className="text-[#C9A96E]">.</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {['Esencia', 'Servicios', 'Testimonios'].map((item) => (
              <Link 
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-[#6B5A4E] hover:text-[#C9A96E] transition-all duration-300 relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#C9A96E] transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
            <Link 
              href="/agenda"
              className="px-7 py-3 text-xs font-light tracking-[0.2em] uppercase text-white bg-[#C9A96E] hover:bg-[#B8955A] transition-all duration-500 rounded-full shadow-lg shadow-[#C9A96E]/20 hover:shadow-xl hover:shadow-[#C9A96E]/30"
            >
              Reservar
            </Link>
          </nav>

          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden w-11 h-11 flex items-center justify-center border border-[#E8DDD5] rounded-full hover:border-[#C9A96E]/40 transition-all"
          >
            {isOpen ? <FaTimes className="text-[#2D1B13]" /> : <FaBars className="text-[#2D1B13]" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/95 backdrop-blur-2xl border-t border-[#E8DDD5]"
          >
            <div className="px-6 py-8 space-y-5">
              {['Esencia', 'Servicios', 'Testimonios'].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="block text-sm text-[#6B5A4E] hover:text-[#C9A96E] transition-all font-light"
                  onClick={() => setIsOpen(false)}
                >
                  {item}
                </Link>
              ))}
              <Link 
                href="/agenda"
                className="block w-full text-center px-6 py-4 text-xs font-light tracking-[0.2em] uppercase text-white bg-[#C9A96E] hover:bg-[#B8955A] transition-all rounded-full"
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
// HERO - LUMINOSO CON VIDEO Y EFECTO MAGNÉTICO
// ============================================================
const HeroSection = () => {
  const buttonRef = useRef<HTMLAnchorElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current) return
      const rect = buttonRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - rect.width / 2) * 0.3
      const y = (e.clientY - rect.top - rect.height / 2) * 0.3
      setMousePosition({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#FBF7F2]">
      {/* Fondo luminoso */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FDF6F0] via-[#FCF8F3] to-[#F5EDE0]" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full filter blur-[200px] bg-[#F0E3C8]/40" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full filter blur-[200px] bg-[#F5E0E8]/30" />
        
        <div className="absolute inset-0 bg-[radial-gradient(#C9A96E_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-10" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.div
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.5, delay: 0.3 }}
            >
              <span className="inline-block text-[10px] tracking-[0.4em] uppercase text-[#C9A96E] font-light border border-[#C9A96E]/20 px-5 py-2 rounded-full bg-white/50 backdrop-blur-sm mb-8">
                ✦ Atelier de Belleza ✦
              </span>

              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-[#2D1B13] leading-[1.05] tracking-tight">
                Belleza que
                <br />
                <span className="italic text-[#C9A96E]">trasciende</span>
              </h1>

              <p className="text-[#6B5A4E] text-base md:text-lg font-light max-w-xl mt-6 leading-relaxed">
                Un santuario donde el arte y el cuidado personal se fusionan 
                para crear experiencias inolvidables.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-wrap gap-4 mt-10"
            >
              <Link
                ref={buttonRef}
                href="/agenda"
                className="relative group px-10 py-4 bg-[#C9A96E] text-white text-xs font-light tracking-[0.2em] uppercase hover:bg-[#B8955A] transition-all duration-500 rounded-full shadow-xl shadow-[#C9A96E]/25 hover:shadow-2xl hover:shadow-[#C9A96E]/40"
                style={{
                  transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
                  transition: 'transform 0.1s ease-out'
                }}
              >
                <span className="relative z-10 flex items-center gap-3">
                  <FaCalendarCheck />
                  Reservar Cita
                  <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link
                href="#esencia"
                className="px-10 py-4 border border-[#E8DDD5] text-[#6B5A4E] text-xs font-light tracking-[0.2em] uppercase hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all duration-500 rounded-full flex items-center gap-3 bg-white/50 backdrop-blur-sm"
              >
                <FaLeaf className="text-[#C9A96E]" />
                Descubrir más
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-center gap-12 mt-16 pt-8 border-t border-[#E8DDD5]"
            >
              <div>
                <p className="text-3xl font-serif text-[#C9A96E]">5+</p>
                <p className="text-[10px] text-[#6B5A4E] uppercase tracking-widest mt-1">Años de arte</p>
              </div>
              <div>
                <p className="text-3xl font-serif text-[#C9A96E]">3K+</p>
                <p className="text-[10px] text-[#6B5A4E] uppercase tracking-widest mt-1">Almas transformadas</p>
              </div>
              <div>
                <p className="text-3xl font-serif text-[#C9A96E]">4.9★</p>
                <p className="text-[10px] text-[#6B5A4E] uppercase tracking-widest mt-1">Excelencia</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
          >
            <div className="aspect-square max-w-md mx-auto relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#F5EDE0] to-[#FDF6F0] border border-[#C9A96E]/10 shadow-2xl" />
              
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-8 right-8 w-16 h-16 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center backdrop-blur-sm"
              >
                <FaHandSparkles className="text-2xl text-[#C9A96E]" />
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-12 left-8 w-12 h-12 rounded-full bg-[#E8B4C8]/10 border border-[#E8B4C8]/20 flex items-center justify-center backdrop-blur-sm"
              >
                <GiNails className="text-xl text-[#E8B4C8]" />
              </motion.div>

              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute top-1/3 right-12 w-10 h-10 rounded-full bg-[#C9A96E]/20 flex items-center justify-center backdrop-blur-sm"
              >
                <FaStar className="text-sm text-[#C9A96E]" />
              </motion.div>

              <div className="absolute inset-6 rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1632661674596-d0b39ea5b87d?w=600&h=600&fit=crop&crop=center"
                  alt="Belleza"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
              </div>

              <div className="absolute -inset-4 rounded-3xl border border-[#C9A96E]/10" />
              <div className="absolute -inset-8 rounded-3xl border border-[#C9A96E]/5" />
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="w-6 h-10 rounded-full border border-[#E8DDD5] flex justify-center p-1.5 bg-white/50 backdrop-blur-sm">
          <div className="w-0.5 h-2 bg-[#C9A96E] rounded-full animate-scroll" />
        </div>
      </motion.div>
    </section>
  )
}

// ============================================================
// SECCIÓN ESENCIA - LUMINOSA CON PARALLAX
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
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#FDF6F0] via-white to-[#FBF7F2]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full filter blur-[200px] bg-[#F0E3C8]/20" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 80 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <span className="text-[10px] tracking-[0.4em] uppercase text-[#C9A96E] font-light">
              Nuestra Esencia
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-[#2D1B13] mt-4 leading-tight">
              Donde el arte
              <br />
              <span className="italic text-[#C9A96E]">encuentra su hogar</span>
            </h2>
            <p className="text-[#6B5A4E] font-light leading-relaxed mt-6">
              Creamos un espacio donde cada detalle está pensado para elevar tu experiencia. 
              Desde la selección de materiales hasta la técnica, cada paso es un acto de amor 
              por la belleza auténtica.
            </p>

            <div className="grid grid-cols-2 gap-6 mt-8">
              <div className="bg-[#FBF7F2] border border-[#E8DDD5] p-5 rounded-2xl hover:border-[#C9A96E] transition-all">
                <FaAward className="text-[#C9A96E] text-xl mb-2" />
                <p className="text-sm text-[#2D1B13] font-light">Excelencia artística</p>
              </div>
              <div className="bg-[#FBF7F2] border border-[#E8DDD5] p-5 rounded-2xl hover:border-[#C9A96E] transition-all">
                <FaRegHeart className="text-[#E8B4C8] text-xl mb-2" />
                <p className="text-sm text-[#2D1B13] font-light">Cuidado personalizado</p>
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
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-60 rounded-[40%_70%_50%_60%] overflow-hidden shadow-2xl border-4 border-white"
            >
              <img 
                src={GALLERY_IMAGES[2]} 
                alt="Arte en uñas"
                className="w-full h-full object-cover"
              />
            </motion.div>

            <div className="absolute -inset-10 rounded-full border border-[#C9A96E]/10 animate-spin-slow" />
            <div className="absolute -inset-20 rounded-full border border-[#C9A96E]/5 animate-spin-slow-reverse" />
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// SERVICIOS - TARJETAS LUMINOSAS
// ============================================================
const ServicesSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section id="servicios" ref={ref} className="py-32 bg-[#FBF7F2] relative">
      <div className="absolute inset-0">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full filter blur-[200px] bg-[#F5E0E8]/30" />
      </div>

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
            className="text-[10px] tracking-[0.4em] uppercase text-[#C9A96E] font-light"
          >
            Servicios
          </motion.span>
          <motion.h2 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="font-serif text-4xl md:text-5xl text-[#2D1B13] mt-4"
          >
            Nuestro <span className="italic text-[#C9A96E]">arte</span>
          </motion.h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((service, idx) => {
            const Icon = service.icon
            const isHovered = hoveredIndex === idx

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ delay: idx * 0.1 }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="group relative bg-white border border-[#E8DDD5] hover:border-[#C9A96E] rounded-2xl p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-[#C9A96E]/10 cursor-pointer"
              >
                <div className={`absolute inset-0 rounded-2xl transition-opacity duration-500 pointer-events-none ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`} style={{ boxShadow: 'inset 0 0 80px rgba(201, 169, 110, 0.05)' }} />

                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isHovered ? 'bg-[#C9A96E]/10 scale-110' : 'bg-[#FBF7F2]'
                  }`}>
                    <Icon className={`text-2xl transition-all duration-500 ${
                      isHovered ? 'text-[#C9A96E]' : 'text-[#6B5A4E]'
                    }`} />
                  </div>
                  
                  <h3 className={`text-xl font-light mt-6 transition-all duration-500 ${
                    isHovered ? 'text-[#C9A96E]' : 'text-[#2D1B13]'
                  }`}>
                    {service.name}
                  </h3>
                  
                  <p className="text-sm text-[#6B5A4E] font-light mt-3 leading-relaxed">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#E8DDD5]">
                    <div>
                      <span className={`text-xl font-serif transition-all duration-500 ${
                        isHovered ? 'text-[#C9A96E]' : 'text-[#2D1B13]'
                      }`}>
                        ${service.price}
                      </span>
                      <span className="text-xs text-[#6B5A4E] ml-3">
                        {service.duration}min
                      </span>
                    </div>
                    <span className={`text-[10px] font-light tracking-wider uppercase px-3 py-1 rounded-full transition-all duration-500 ${
                      isHovered ? 'bg-[#C9A96E] text-white' : 'bg-[#FBF7F2] text-[#6B5A4E]'
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
// TESTIMONIOS - SLIDER LUMINOSO
// ============================================================
const TestimonialsSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragStartX, setDragStartX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
  }

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    setDragStartX(clientX)
    setIsDragging(true)
  }

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    setIsDragging(false)
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX
    const diff = dragStartX - clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide()
      else prevSlide()
    }
  }

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section id="testimonios" ref={ref} className="py-32 bg-white relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#FDF6F0] via-white to-[#FBF7F2]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full filter blur-[200px] bg-[#F0E3C8]/15" />
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
            className="text-[10px] tracking-[0.4em] uppercase text-[#C9A96E] font-light"
          >
            Testimonios
          </motion.span>
          <motion.h2 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="font-serif text-4xl md:text-5xl text-[#2D1B13] mt-4"
          >
            Lo que <span className="italic text-[#C9A96E]">dicen</span>
          </motion.h2>
        </motion.div>

        <div className="relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.3 }}
            className="overflow-hidden"
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
          >
            <motion.div
              animate={{ x: `-${currentIndex * 100}%` }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex cursor-grab active:cursor-grabbing"
            >
              {TESTIMONIALS.map((testimonial, idx) => (
                <div
                  key={idx}
                  className="min-w-full px-4"
                >
                  <div className="max-w-3xl mx-auto bg-white border border-[#E8DDD5] rounded-2xl p-8 md:p-12 shadow-xl hover:shadow-2xl transition-all">
                    <div className="flex items-center gap-6 mb-6">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#C9A96E]/30">
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-[#2D1B13] font-light text-lg">
                          {testimonial.name}
                        </h4>
                        <p className="text-[#6B5A4E] text-sm">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>

                    <FaQuoteLeft className="text-[#C9A96E]/20 text-3xl mb-4" />
                    
                    <p className="text-[#2D1B13] font-light leading-relaxed text-lg">
                      "{testimonial.text}"
                    </p>

                    <div className="flex items-center gap-1 mt-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <FaStar key={i} className="text-[#C9A96E] text-sm" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-[#E8DDD5] hover:border-[#C9A96E] text-[#6B5A4E] hover:text-[#C9A96E] transition-all flex items-center justify-center bg-white shadow-lg hover:shadow-xl"
          >
            <FaChevronLeft className="text-sm" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-[#E8DDD5] hover:border-[#C9A96E] text-[#6B5A4E] hover:text-[#C9A96E] transition-all flex items-center justify-center bg-white shadow-lg hover:shadow-xl"
          >
            <FaChevronRight className="text-sm" />
          </button>
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {TESTIMONIALS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-0.5 rounded-full transition-all duration-500 ${
                idx === currentIndex 
                  ? 'w-10 bg-[#C9A96E]' 
                  : 'w-6 bg-[#E8DDD5] hover:bg-[#C9A96E]/50'
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
    <section ref={ref} className="py-28 bg-[#FBF7F2] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full filter blur-[200px] bg-[#F0E3C8]/30" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full filter blur-[200px] bg-[#F5E0E8]/20" />
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          className="text-center"
        >
          <div className="inline-block mb-6">
            <div className="w-16 h-16 rounded-full bg-[#C9A96E]/10 flex items-center justify-center mx-auto">
              <FaRegHeart className="text-3xl text-[#C9A96E]" />
            </div>
          </div>
          
          <h2 className="font-serif text-4xl md:text-5xl text-[#2D1B13]">
            ¿Lista para <span className="italic text-[#C9A96E]">brillar</span>?
          </h2>
          
          <p className="text-[#6B5A4E] font-light mt-4 max-w-md mx-auto">
            Reserva tu cita y descubre una experiencia de belleza única.
          </p>

          <Link 
            href="/agenda"
            className="inline-flex items-center gap-4 px-12 py-5 mt-8 bg-[#C9A96E] text-white hover:bg-[#B8955A] transition-all duration-500 rounded-full text-xs font-light tracking-[0.2em] uppercase shadow-xl shadow-[#C9A96E]/25 hover:shadow-2xl hover:shadow-[#C9A96E]/40 group"
          >
            <FaCalendarCheck />
            Agendar Cita
            <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
          </Link>

          <div className="flex flex-wrap justify-center gap-8 mt-8 text-[10px] text-[#6B5A4E]">
            <span className="flex items-center gap-2">
              <FaStar className="text-[#C9A96E] text-[8px]" /> Sin costo de reserva
            </span>
            <span className="flex items-center gap-2">
              <FaStar className="text-[#C9A96E] text-[8px]" /> Confirmación inmediata
            </span>
            <span className="flex items-center gap-2">
              <FaStar className="text-[#C9A96E] text-[8px]" /> Flexibilidad total
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
  <footer className="bg-white border-t border-[#E8DDD5] py-16">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="grid md:grid-cols-4 gap-12">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/30 flex items-center justify-center">
              <FaGem className="w-4 h-4 text-[#C9A96E]" />
            </div>
            <span className="text-[#2D1B13] font-serif text-lg tracking-wider">
              FRESH<span className="text-[#C9A96E]">.</span>
            </span>
          </Link>
          <p className="text-[#6B5A4E] text-xs font-light mt-4 leading-relaxed max-w-xs">
            Redefiniendo el cuidado y la estética con arte y pasión.
          </p>
          <div className="flex gap-3 mt-6">
            <a href="#" className="text-[#6B5A4E] hover:text-[#C9A96E] transition-all">
              <FaInstagram className="text-lg" />
            </a>
            <a href="#" className="text-[#6B5A4E] hover:text-[#C9A96E] transition-all">
              <FaWhatsapp className="text-lg" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#6B5A4E] font-light">
            Horarios
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-[#2D1B13] font-light">
            <li className="flex justify-between">
              <span className="text-[#6B5A4E]">Lun a Vie</span>
              <span>09:00 - 20:00</span>
            </li>
            <li className="flex justify-between">
              <span className="text-[#6B5A4E]">Sábados</span>
              <span>09:00 - 18:00</span>
            </li>
            <li className="flex justify-between">
              <span className="text-[#6B5A4E]">Domingos</span>
              <span className="text-[#C9A96E]">Cerrado</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#6B5A4E] font-light">
            Enlaces
          </h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link href="#esencia" className="text-[#6B5A4E] hover:text-[#C9A96E] transition-all">Esencia</Link></li>
            <li><Link href="#servicios" className="text-[#6B5A4E] hover:text-[#C9A96E] transition-all">Servicios</Link></li>
            <li><Link href="#testimonios" className="text-[#6B5A4E] hover:text-[#C9A96E] transition-all">Testimonios</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#6B5A4E] font-light">
            Contacto
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-[#6B5A4E]">
            <li className="flex items-center gap-3">
              <FaPhoneAlt className="text-[#C9A96E] text-xs" />
              <span className="text-[#2D1B13]">099 123 456</span>
            </li>
            <li className="flex items-center gap-3">
              <FaMapMarkerAlt className="text-[#C9A96E] text-xs" />
              <span className="text-[#2D1B13]">Montevideo, Uruguay</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-[#E8DDD5] text-center text-[10px] text-[#6B5A4E] font-light">
        © 2026 Fresh Beauty Studio. Todos los derechos reservados.
        <span className="hidden sm:inline ml-2">✦ Hecho con arte en Uruguay</span>
      </div>
    </div>
  </footer>
)

// ============================================================
// MAIN
// ============================================================
export default function Home() {
  return (
    <main className="bg-white text-[#2D1B13] min-h-screen overflow-x-hidden">
      <Header />
      <HeroSection />
      <EsenciaSection />
      <ServicesSection />
      <TestimonialsSection />
      <CtaSection />
      <Footer />

      <style jsx>{`
        @keyframes scroll {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(8px); opacity: 0; }
        }
        .animate-scroll {
          animation: scroll 2s ease-in-out infinite;
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