'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { 
  FaArrowRight, 
  FaQuoteLeft,
  FaClock,
  FaAward,
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
  FaSprayCan,
  FaPalette,
  FaHandSparkles,
  FaFeatherAlt,
  FaCrown,
  FaSparkle,
  FaRegStar,
  FaLeaf
} from 'react-icons/fa'
import { GiNails, GiLipstick, GiScissors, GiFlowerEmblem } from 'react-icons/gi'

// ============================================================
// PALETA COMPLETAMENTE NUEVA - VIBE LUXE MINIMAL
// ============================================================
const COLORS = {
  primary: '#F5E6D3',      // Beige cálido
  secondary: '#2D1B13',    // Café oscuro profundo
  accent: '#B8865A',       // Bronce elegante
  accentLight: '#D4A88C',  // Rosa pálido
  gold: '#C9A87C',         // Oro suave
  dark: '#1A120E',         // Negro cálido
  surface: '#261D18',      // Superficie oscura
  card: '#1F1611',         // Tarjeta
  text: '#E8DDD5',         // Texto claro
  textMuted: '#A89588',    // Texto secundario
  border: '#3A2C24',       // Borde
}

// ============================================================
// ANIMACIONES PERSONALIZADAS
// ============================================================
const slideIn = {
  hidden: { opacity: 0, x: -80 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } }
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
}

const scaleUp = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
}

const float = {
  y: [0, -8, 0],
  transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }
}

// ============================================================
// DATOS - MISMA ESTRUCTURA, NUEVA PRESENTACIÓN
// ============================================================
const SERVICES = [
  { 
    name: 'Manicura Rusa',
    description: 'Técnica de precisión con fresas de diamante para un acabado impecable y duradero.',
    price: 45,
    duration: 90,
    icon: GiNails,
    tag: 'Premium',
    color: '#B8865A'
  },
  { 
    name: 'Extensiones Soft Gel',
    description: 'Tips ultraligeros que se adaptan perfectamente a tu uña natural.',
    price: 65,
    duration: 120,
    icon: FaHandSparkles,
    tag: 'Top ventas',
    color: '#C9A87C'
  },
  { 
    name: 'Nail Art',
    description: 'Diseños exclusivos con técnicas avanzadas y materiales de lujo.',
    price: 55,
    duration: 105,
    icon: FaPalette,
    tag: 'Edición limitada',
    color: '#D4A88C'
  },
  { 
    name: 'Peluquería',
    description: 'Cortes, color y peinados con productos orgánicos de alta gama.',
    price: 50,
    duration: 90,
    icon: GiScissors,
    tag: 'Bienestar',
    color: '#A89588'
  }
]

const GALLERY = [
  'https://images.unsplash.com/photo-1591926079847-8181980b0f09?w=600&h=700&fit=crop',
  'https://images.unsplash.com/photo-1641814250010-9887d86eedfd?w=600&h=700&fit=crop',
  'https://images.unsplash.com/photo-1720343409646-960f6dcccae3?w=600&h=700&fit=crop',
  'https://images.unsplash.com/photo-1585885970325-81cba4494c27?w=600&h=700&fit=crop',
  'https://images.unsplash.com/photo-1560869713-7d0a2943087e?w=600&h=700&fit=crop',
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=700&fit=crop'
]

const TESTIMONIALS = [
  { text: "Un espacio que respira tranquilidad. Cada detalle está cuidado con esmero.", name: "María José", rating: 5 },
  { text: "La mejor atención de Montevideo. Salgo renovada siempre.", name: "Camila F.", rating: 5 },
  { text: "Técnicas innovadoras y un trato cálido. 100% recomendable.", name: "Sofía R.", rating: 5 }
]

// ============================================================
// HEADER - MINIMALISTA ELEGANTE
// ============================================================
const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-[#1A120E]/95 backdrop-blur-xl border-b border-[#3A2C24]' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full border border-[#B8865A] flex items-center justify-center group-hover:bg-[#B8865A]/10 transition-all">
              <FaGem className="w-3.5 h-3.5 text-[#B8865A]" />
            </div>
            <span className="text-white font-light tracking-widest text-sm">
              FRESH<span className="text-[#B8865A]">.</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {['Servicios', 'Trabajos', 'Testimonios'].map((item) => (
              <Link 
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-xs text-[#A89588] hover:text-[#F5E6D3] transition-all font-light tracking-wider uppercase"
              >
                {item}
              </Link>
            ))}
            <Link 
              href="/agenda"
              className="px-6 py-2.5 text-xs font-light tracking-widest uppercase text-[#F5E6D3] border border-[#B8865A] hover:bg-[#B8865A] hover:text-[#1A120E] transition-all duration-300 rounded-full"
            >
              Reservar
            </Link>
          </nav>

          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center border border-[#3A2C24] rounded-full"
          >
            {isOpen ? <FaTimes className="text-white" /> : <FaBars className="text-white" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#1A120E]/95 backdrop-blur-xl border-t border-[#3A2C24]"
          >
            <div className="px-6 py-6 space-y-4">
              {['Servicios', 'Trabajos', 'Testimonios'].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="block text-sm text-[#A89588] hover:text-[#F5E6D3] transition-all font-light"
                  onClick={() => setIsOpen(false)}
                >
                  {item}
                </Link>
              ))}
              <Link 
                href="/agenda"
                className="block w-full text-center px-6 py-3 text-xs font-light tracking-widest uppercase text-[#F5E6D3] border border-[#B8865A] hover:bg-[#B8865A] hover:text-[#1A120E] transition-all rounded-full"
                onClick={() => setIsOpen(false)}
              >
                Reservar
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

// ============================================================
// HERO - DISEÑO EDITORIAL
// ============================================================
const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-[#1A120E] flex items-center overflow-hidden">
      {/* Fondo con textura orgánica */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#2D1B13_0%,_transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#B8865A_0%,_transparent_50%)] opacity-10" />
        
        {/* Líneas decorativas */}
        <div className="absolute top-1/3 right-0 w-px h-64 bg-gradient-to-b from-[#B8865A]/0 via-[#B8865A]/30 to-[#B8865A]/0" />
        <div className="absolute bottom-1/4 left-1/4 w-px h-32 bg-gradient-to-b from-[#B8865A]/0 via-[#B8865A]/20 to-[#B8865A]/0" />
        
        {/* Círculo decorativo */}
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full border border-[#B8865A]/10" />
        <div className="absolute -top-40 -left-40 w-[400px] h-[400px] rounded-full border border-[#B8865A]/5" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Columna izquierda - Texto */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={slideIn}
          >
            <div className="inline-block mb-8">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#B8865A] font-light border border-[#B8865A]/20 px-4 py-2 rounded-full">
                Estudio de Belleza
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-light text-[#F5E6D3] leading-[1.1] tracking-tight">
              Belleza
              <br />
              <span className="font-serif italic text-[#B8865A]">en cada detalle</span>
            </h1>

            <p className="text-[#A89588] text-base font-light leading-relaxed mt-6 max-w-md">
              Un espacio donde el cuidado personal se convierte en un ritual. 
              Especialistas en el arte de realzar tu belleza natural.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <Link 
                href="/agenda"
                className="group px-8 py-3.5 bg-[#B8865A] text-[#1A120E] text-xs font-light tracking-widest uppercase hover:bg-[#C9A87C] transition-all duration-300 rounded-full flex items-center justify-center gap-3"
              >
                <FaCalendarCheck className="text-sm" />
                Reservar cita
                <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="#servicios"
                className="px-8 py-3.5 border border-[#3A2C24] text-[#A89588] text-xs font-light tracking-widest uppercase hover:border-[#B8865A] hover:text-[#F5E6D3] transition-all rounded-full flex items-center justify-center"
              >
                Explorar servicios
              </Link>
            </div>

            {/* Stats minimalistas */}
            <div className="flex gap-12 mt-12 pt-8 border-t border-[#3A2C24]">
              <div>
                <p className="text-2xl font-serif text-[#B8865A]">5+</p>
                <p className="text-[10px] text-[#A89588] uppercase tracking-widest mt-1">Años de trayectoria</p>
              </div>
              <div>
                <p className="text-2xl font-serif text-[#B8865A]">3K+</p>
                <p className="text-[10px] text-[#A89588] uppercase tracking-widest mt-1">Clientas felices</p>
              </div>
            </div>
          </motion.div>

          {/* Columna derecha - Imagen abstracta */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
          >
            <div className="aspect-square max-w-md mx-auto relative">
              {/* Círculo principal */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#2D1B13] to-[#1A120E] border border-[#B8865A]/20" />
              
              {/* Elementos decorativos flotantes */}
              <motion.div 
                animate={float}
                className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full bg-[#B8865A]/10 border border-[#B8865A]/30 flex items-center justify-center"
              >
                <FaHandSparkles className="text-2xl text-[#B8865A]" />
              </motion.div>
              
              <motion.div 
                animate={{ ...float, transition: { delay: 1.5, duration: 4 } }}
                className="absolute bottom-1/4 right-1/4 w-12 h-12 rounded-full bg-[#D4A88C]/10 border border-[#D4A88C]/30 flex items-center justify-center"
              >
                <GiNails className="text-xl text-[#D4A88C]" />
              </motion.div>

              <motion.div 
                animate={{ ...float, transition: { delay: 3, duration: 4.5 } }}
                className="absolute top-1/3 right-8 w-8 h-8 rounded-full bg-[#C9A87C]/20 flex items-center justify-center"
              >
                <FaSparkle className="text-xs text-[#C9A87C]" />
              </motion.div>

              {/* Círculo interior con imagen */}
              <div className="absolute inset-8 rounded-full overflow-hidden border border-[#B8865A]/30">
                <img 
                  src="https://images.unsplash.com/photo-1632661674596-d0b39ea5b87d?w=600&h=600&fit=crop&crop=center"
                  alt="Belleza"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A120E]/60 to-transparent" />
              </div>

              {/* Anillo decorativo */}
              <div className="absolute -inset-4 rounded-full border border-[#B8865A]/5" />
              <div className="absolute -inset-8 rounded-full border border-[#B8865A]/5" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// SERVICIOS - DISEÑO CON TARJETAS VERTICALES
// ============================================================
const ServicesSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })

  return (
    <section id="servicios" ref={ref} className="py-28 bg-[#1A120E]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeIn}
          className="text-center mb-16"
        >
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#B8865A] font-light">
            Servicios
          </span>
          <h2 className="text-3xl md:text-5xl font-light text-[#F5E6D3] mt-4">
            Nuestro <span className="font-serif italic text-[#B8865A]">arte</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((service, idx) => {
            const Icon = service.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ delay: idx * 0.1 }}
                className="group bg-[#261D18] border border-[#3A2C24] hover:border-[#B8865A]/30 transition-all duration-500 p-8 rounded-2xl"
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110"
                  style={{ backgroundColor: `${service.color}20` }}
                >
                  <Icon className="text-xl" style={{ color: service.color }} />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[#F5E6D3] font-light text-lg">{service.name}</h3>
                    <p className="text-[#A89588] text-xs font-light mt-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                  <span className="text-xs text-[#B8865A] font-light whitespace-nowrap">
                    ${service.price}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-[#3A2C24] flex items-center justify-between">
                  <span className="text-[10px] text-[#A89588] flex items-center gap-2">
                    <FaClock className="text-[#B8865A]" />
                    {service.duration} min
                  </span>
                  <span className="text-[10px] text-[#B8865A] bg-[#B8865A]/10 px-3 py-1 rounded-full">
                    {service.tag}
                  </span>
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
// GALERÍA - DISEÑO MARQUEE
// ============================================================
const GallerySection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })

  return (
    <section id="trabajos" ref={ref} className="py-28 bg-[#261D18] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeIn}
          className="text-center mb-16"
        >
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#B8865A] font-light">
            Galería
          </span>
          <h2 className="text-3xl md:text-5xl font-light text-[#F5E6D3] mt-4">
            Nuestros <span className="font-serif italic text-[#B8865A]">trabajos</span>
          </h2>
        </motion.div>
      </div>

      {/* Carrusel horizontal continuo */}
      <div className="relative">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex gap-4 w-max"
        >
          {[...GALLERY, ...GALLERY].map((img, idx) => (
            <div key={idx} className="w-64 md:w-80 flex-shrink-0 group">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#1A120E]">
                <img 
                  src={img} 
                  alt={`Trabajo ${idx + 1}`}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A120E]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 text-center">
        <Link 
          href="/galeria"
          className="text-xs text-[#A89588] hover:text-[#B8865A] transition-colors font-light tracking-widest uppercase inline-flex items-center gap-2"
        >
          Ver toda la galería
          <FaArrowRight className="text-[10px]" />
        </Link>
      </div>
    </section>
  )
}

// ============================================================
// TESTIMONIALS - DISEÑO CON FONDO TEXTURADO
// ============================================================
const TestimonialsSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section id="testimonios" ref={ref} className="py-28 bg-[#1A120E] relative">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#B8865A_0%,_transparent_70%)] opacity-5" />
      </div>

      <div className="max-w-4xl mx-auto px-6 relative">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeIn}
          className="text-center mb-16"
        >
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#B8865A] font-light">
            Testimonios
          </span>
          <h2 className="text-3xl md:text-5xl font-light text-[#F5E6D3] mt-4">
            Lo que <span className="font-serif italic text-[#B8865A]">dicen</span>
          </h2>
        </motion.div>

        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center bg-[#261D18] border border-[#3A2C24] p-12 md:p-16 rounded-2xl"
        >
          <FaQuoteLeft className="text-3xl text-[#B8865A]/30 mx-auto mb-6" />
          
          <p className="text-[#F5E6D3] text-lg md:text-xl font-light leading-relaxed">
            "{TESTIMONIALS[current].text}"
          </p>

          <div className="flex items-center justify-center gap-1 mt-6">
            {[...Array(TESTIMONIALS[current].rating)].map((_, i) => (
              <FaStar key={i} className="text-[#B8865A] text-sm" />
            ))}
          </div>

          <p className="text-[#A89588] text-sm mt-4 font-light">
            {TESTIMONIALS[current].name}
          </p>

          <div className="flex justify-center gap-2 mt-8">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-0.5 rounded-full transition-all duration-500 ${
                  i === current 
                    ? 'w-8 bg-[#B8865A]' 
                    : 'w-4 bg-[#3A2C24] hover:bg-[#A89588]'
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
// CTA - DISEÑO SOBRIO ELEGANTE
// ============================================================
const CtaSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section ref={ref} className="py-28 bg-[#261D18]">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          className="text-center"
        >
          <div className="inline-block mb-6">
            <FaRegHeart className="text-2xl text-[#B8865A]" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-light text-[#F5E6D3]">
            ¿Lista para <span className="font-serif italic text-[#B8865A]">brillar</span>?
          </h2>
          
          <p className="text-[#A89588] font-light mt-4 max-w-md mx-auto">
            Reserva tu cita y descubre una experiencia de belleza única.
          </p>

          <Link 
            href="/agenda"
            className="inline-flex items-center gap-3 px-10 py-4 mt-8 bg-[#B8865A] text-[#1A120E] hover:bg-[#C9A87C] transition-all duration-300 rounded-full text-xs font-light tracking-widest uppercase"
          >
            <FaCalendarCheck />
            Agendar cita
            <FaArrowRight className="text-xs" />
          </Link>

          <div className="flex flex-wrap justify-center gap-6 mt-8 text-[10px] text-[#A89588]">
            <span>✦ Sin costo de reserva</span>
            <span>✦ Confirmación inmediata</span>
            <span>✦ Flexibilidad total</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================
// FOOTER - MINIMALISTA
// ============================================================
const Footer = () => (
  <footer className="bg-[#1A120E] border-t border-[#3A2C24] py-16">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-8">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border border-[#B8865A] flex items-center justify-center">
              <FaGem className="w-3.5 h-3.5 text-[#B8865A]" />
            </div>
            <span className="text-white font-light tracking-widest text-sm">
              FRESH<span className="text-[#B8865A]">.</span>
            </span>
          </Link>
          <p className="text-[#A89588] text-xs font-light mt-4 leading-relaxed">
            Redefiniendo el cuidado y la estética.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="#" className="text-[#A89588] hover:text-[#B8865A] transition-all">
              <FaInstagram className="text-sm" />
            </a>
            <a href="#" className="text-[#A89588] hover:text-[#B8865A] transition-all">
              <FaWhatsapp className="text-sm" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#A89588] font-light">
            Horarios
          </h4>
          <ul className="mt-4 space-y-2 text-xs text-[#F5E6D3] font-light">
            <li>Lun a Vie: 09:00 - 20:00</li>
            <li>Sábados: 09:00 - 18:00</li>
            <li className="text-[#B8865A]">Domingos: Cerrado</li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#A89588] font-light">
            Enlaces
          </h4>
          <ul className="mt-4 space-y-2 text-xs">
            <li><Link href="#servicios" className="text-[#A89588] hover:text-[#B8865A] transition-all">Servicios</Link></li>
            <li><Link href="#trabajos" className="text-[#A89588] hover:text-[#B8865A] transition-all">Trabajos</Link></li>
            <li><Link href="#testimonios" className="text-[#A89588] hover:text-[#B8865A] transition-all">Testimonios</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#A89588] font-light">
            Contacto
          </h4>
          <ul className="mt-4 space-y-2 text-xs text-[#A89588]">
            <li className="flex items-center gap-2">
              <FaPhoneAlt className="text-[#B8865A] text-[10px]" />
              <span>099 123 456</span>
            </li>
            <li className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-[#B8865A] text-[10px]" />
              <span>Montevideo, Uruguay</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-[#3A2C24] text-center text-[10px] text-[#A89588] font-light">
        © 2026 Fresh Beauty Studio. Todos los derechos reservados.
      </div>
    </div>
  </footer>
)

// ============================================================
// MAIN
// ============================================================
export default function Home() {
  return (
    <main className="bg-[#1A120E] text-[#F5E6D3] min-h-screen overflow-x-hidden">
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