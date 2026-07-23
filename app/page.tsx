// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion'
import { 
  FaArrowRight, FaQuoteLeft, FaInstagram, FaWhatsapp, FaStar, FaGem,
  FaBars, FaTimes, FaCalendarCheck, FaPhoneAlt, FaMapMarkerAlt, FaRegHeart,
  FaPalette, FaHandSparkles, FaAward, FaLeaf, FaChevronLeft, FaChevronRight,
  FaCrown, FaRegStar, FaEye, FaHeart, FaClock
} from 'react-icons/fa'
import { GiNails, GiScissors, GiLipstick, GiFlowerStar, GiSparkles } from 'react-icons/gi'
import { HiOutlineSparkles } from 'react-icons/hi'

// ============================================================
// CONSTANTES (solo para fallbacks)
// ============================================================
const CATEGORY_ICONS: Record<string, any> = {
  'Uñas': GiNails,
  'Micropigmentación': GiSparkles,
  'Peluquería': GiScissors,
  'Cejas': FaEye,
  'Estética': GiFlowerStar,
  'Depilación': FaHeart,
  'default': FaGem
}

const CATEGORY_IMAGES: Record<string, string> = {
  'Uñas': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop',
  'Micropigmentación': 'https://plus.unsplash.com/premium_photo-1661580887141-7adca5e04c02?w=600&h=400&fit=crop',
  'Peluquería': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=400&fit=crop',
  'Cejas': 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=600&h=400&fit=crop',
  'Estética': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop',
  'Depilación': 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=400&fit=crop',
  'default': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop'
}

// ============================================================
// HEADER
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
// HERO
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
    </section>
  )
}

// ============================================================
// ESENCIA
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

  const GALLERY_IMAGES = [
    'https://images.unsplash.com/photo-1591926079847-8181980b0f09?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1641814250010-9887d86eedfd?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1720343409646-960f6dcccae3?w=600&h=800&fit=crop'
  ]

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
// SERVICIOS DESTACADOS - CATEGORÍAS
// ============================================================
const ServicesCategoriesSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })

  const categories = [
    {
      id: 'manicura',
      name: 'Manicura',
      description: 'Manicura rusa, esmaltado semipermanente, diseño de uñas y cuidado profesional.',
      icon: GiNails,
      color: '#D4AF37',
      bgColor: 'from-[#D4AF37]/20 to-[#D4AF37]/5',
      image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop',
      tag: '⭐ Premium'
    },
    {
      id: 'micropigmentacion',
      name: 'Micropigmentación',
      description: 'Labios, cejas y ojos con técnicas avanzadas para resultados naturales y duraderos.',
      icon: FaEye,
      color: '#E879A0',
      bgColor: 'from-[#E879A0]/20 to-[#E879A0]/5',
      image: 'https://plus.unsplash.com/premium_photo-1661580887141-7adca5e04c02?w=400&h=400&fit=crop',
      tag: '✨ Tendencia'
    },
    {
      id: 'peluqueria',
      name: 'Peluquería',
      description: 'Cortes de autor, colorimetría avanzada, tratamientos capilares y peinados de alta costura.',
      icon: GiScissors,
      color: '#2D9CDB',
      bgColor: 'from-[#2D9CDB]/20 to-[#2D9CDB]/5',
      image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=400&fit=crop',
      tag: '✂️ Vanguardia'
    },
    {
      id: 'pestanas',
      name: 'Pestañas',
      description: 'Extensiones de pestañas, lifting, tintado y tratamientos para una mirada impactante.',
      icon: HiOutlineSparkles,
      color: '#9B5DE5',
      bgColor: 'from-[#9B5DE5]/20 to-[#9B5DE5]/5',
      image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=400&fit=crop',
      tag: '👁️ Impacto'
    },
    {
      id: 'cejas',
      name: 'Cejas',
      description: 'Diseño de cejas, microblading, depilación con hilo y técnicas de realce natural.',
      icon: FaRegStar,
      color: '#F2994A',
      bgColor: 'from-[#F2994A]/20 to-[#F2994A]/5',
      image: 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=400&h=400&fit=crop',
      tag: '🌟 Natural'
    },
    {
      id: 'labios',
      name: 'Labios',
      description: 'Micropigmentación de labios, hidratación profunda y tratamientos de volumen natural.',
      icon: GiLipstick,
      color: '#E879A0',
      bgColor: 'from-[#E879A0]/20 to-[#E879A0]/5',
      image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=400&fit=crop',
      tag: '💋 Glamour'
    }
  ]

  return (
    <section ref={ref} className="py-32 bg-white relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#FFF8F5] via-white to-[#FFF8F5]" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full filter blur-[200px] bg-[#D4AF37]/5" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full filter blur-[200px] bg-[#E879A0]/5" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Encabezado */}
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
            className="inline-block text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-light border border-[#D4AF37]/20 px-6 py-2 rounded-full bg-white/50 backdrop-blur-sm"
          >
            ✦ Nuestros Servicios ✦
          </motion.span>
          <motion.h2 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="font-serif text-4xl md:text-5xl text-[#1A0E0A] mt-6"
          >
            Especialidades que <span className="italic text-[#D4AF37]">transforman</span>
          </motion.h2>
          <motion.p 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="text-[#5C4A3E] font-light mt-4 max-w-2xl mx-auto"
          >
            Descubre nuestra amplia gama de servicios profesionales, diseñados para realzar 
            tu belleza natural con técnicas de vanguardia.
          </motion.p>
        </motion.div>

        {/* Grid de categorías */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, idx) => {
            const Icon = category.icon
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ delay: idx * 0.08, duration: 0.6 }}
                className="group relative"
              >
                {/* Tarjeta principal */}
                <div className="relative bg-white border border-[#F0E4DA] rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-[#D4AF37]/10 hover:border-[#D4AF37]/30 hover:-translate-y-2">
                  
                  {/* Imagen de fondo */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A0E0A]/80 via-[#1A0E0A]/30 to-transparent" />
                    
                    {/* Tag */}
                    <div className="absolute top-4 right-4">
                      <span className="text-[8px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full text-white shadow-lg" style={{
                        background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)`,
                        boxShadow: `0 4px 15px ${category.color}40`
                      }}>
                        {category.tag}
                      </span>
                    </div>

                    {/* Icono flotante */}
                    <div className="absolute bottom-4 left-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                        <Icon className="text-2xl text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    <h3 className="text-xl font-serif text-[#1A0E0A] group-hover:text-[#D4AF37] transition-colors duration-300">
                      {category.name}
                    </h3>
                    <p className="text-[#5C4A3E] text-sm font-light mt-2 leading-relaxed">
                      {category.description}
                    </p>
                    
                    {/* Línea decorativa */}
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-0.5 flex-1 bg-gradient-to-r from-[#D4AF37] to-transparent" />
                      <Link 
                        href="/servicios"
                        className="text-xs text-[#D4AF37] hover:text-[#E879A0] transition-colors font-light tracking-wider uppercase flex items-center gap-1 group/link"
                      >
                        Ver más
                        <FaArrowRight className="text-[10px] group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>

                  {/* Efecto de brillo en hover */}
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute -inset-full top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform skew-x-12 group-hover:translate-x-full transition-transform duration-1000" />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* CTA final */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <Link 
            href="/servicios"
            className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-[#D4AF37] to-[#E879A0] text-white hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-500 rounded-full text-xs font-light tracking-[0.2em] uppercase group"
          >
            <FaGem className="text-xs" />
            Explorar todos los servicios
            <FaArrowRight className="text-xs group-hover:translate-x-2 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================
// SERVICIOS - CON DATOS DE LA DB
// ============================================================
const ServicesSection = ({ services }: { services: any[] }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (!services || services.length === 0) return null

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
          {services.slice(0, 4).map((service, idx) => {
            const Icon = CATEGORY_ICONS[service.category] || CATEGORY_ICONS.default
            const imageUrl = service.image_url || CATEGORY_IMAGES[service.category] || CATEGORY_IMAGES.default
            const isHovered = hoveredId === service.id

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ delay: idx * 0.1 }}
                onMouseEnter={() => setHoveredId(service.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="group relative bg-white border border-[#F0E4DA] hover:border-[#D4AF37] rounded-2xl overflow-hidden transition-all duration-700 hover:shadow-2xl hover:shadow-[#D4AF37]/10"
              >
                <div className={`absolute inset-0 transition-all duration-700 ${
                  isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                }`}>
                  <img 
                    src={imageUrl} 
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
                  
                  <p className="text-[#5C4A3E] text-sm font-light mt-3 leading-relaxed line-clamp-3">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#F0E4DA]">
                    <div>
                      <span className={`text-2xl font-serif transition-colors duration-500 ${
                        isHovered ? 'text-[#D4AF37]' : 'text-[#1A0E0A]'
                      }`}>
                        ${service.price}
                      </span>
                      <span className="text-xs text-[#5C4A3E] ml-2 flex items-center gap-1">
                        <FaClock className="text-[10px]" />
                        {service.duration}min
                      </span>
                    </div>
                    <span className={`text-[10px] font-light tracking-wider uppercase px-4 py-1.5 rounded-full transition-all duration-500 ${
                      isHovered ? 'bg-[#D4AF37] text-white' : 'bg-[#FFF8F5] text-[#5C4A3E]'
                    }`}>
                      {service.category || 'Premium'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {services.length > 4 && (
          <div className="text-center mt-12">
            <Link 
              href="/servicios"
              className="inline-flex items-center gap-3 text-sm text-[#5C4A3E] hover:text-[#D4AF37] transition-all group font-light tracking-wider"
            >
              Ver todos los servicios
              <FaArrowRight className="text-xs group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

// ============================================================
// GALERÍA - REDISEÑADA
// ============================================================
const GallerySection = ({ images }: { images: any[] }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })

  const displayImages = images && images.length > 0 
    ? images 
    : [
        'https://images.unsplash.com/photo-1591926079847-8181980b0f09?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1641814250010-9887d86eedfd?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1720343409646-960f6dcccae3?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1585885970325-81cba4494c27?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1560869713-7d0a2943087e?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=800&fit=crop'
      ]

  return (
    <section id="galeria" ref={ref} className="py-32 bg-[#FFF8F5] relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white via-[#FFF8F5] to-white" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full filter blur-[200px] bg-[#D4AF37]/5" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full filter blur-[150px] bg-[#E879A0]/5" />
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
            className="inline-block text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-light border border-[#D4AF37]/20 px-6 py-2 rounded-full bg-white/50 backdrop-blur-sm"
          >
            ✦ Galería ✦
          </motion.span>
          <motion.h2 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="font-serif text-4xl md:text-5xl text-[#1A0E0A] mt-6"
          >
            Nuestras <span className="italic text-[#D4AF37]">creaciones</span>
          </motion.h2>
          <motion.p 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="text-[#5C4A3E] font-light mt-4 max-w-md mx-auto"
          >
            Cada diseño es una obra de arte única, creada con pasión y dedicación.
          </motion.p>
        </motion.div>
      </div>

      {/* Carrusel con efecto de luz */}
      <div className="relative">
        {/* Efecto de desvanecimiento en los bordes */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#FFF8F5] to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#FFF8F5] to-transparent z-20 pointer-events-none" />

        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="flex gap-5 w-max"
        >
          {[...displayImages, ...displayImages].map((img, idx) => {
            const imageUrl = typeof img === 'string' ? img : img.image_url
            const title = typeof img === 'string' ? 'Creación' : img.title || 'Creación exclusiva'
            const clientName = typeof img === 'string' ? 'Fresh Nails' : img.client_name || 'Fresh Nails'

            return (
              <div key={idx} className="w-72 md:w-80 flex-shrink-0 group">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-2xl shadow-[#D4AF37]/10">
                  {/* Imagen */}
                  <img 
                    src={imageUrl} 
                    alt={title}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  
                  {/* Overlay con gradiente premium */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A0E0A]/80 via-[#1A0E0A]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Marco dorado en hover */}
                  <div className="absolute inset-2 rounded-xl border-2 border-[#D4AF37]/0 group-hover:border-[#D4AF37]/50 transition-all duration-500" />
                  
                  {/* Contenido inferior */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-white text-lg font-serif font-light tracking-wide">
                      {title}
                    </p>
                    <p className="text-[#D4AF37] text-xs font-light tracking-wider uppercase mt-1">
                      {clientName}
                    </p>
                    <div className="w-12 h-0.5 bg-[#D4AF37] mt-3" />
                  </div>

                  {/* Badge de luz */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 backdrop-blur-sm border border-[#D4AF37]/30 flex items-center justify-center">
                      <FaGem className="text-[#D4AF37] text-xs" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </motion.div>
      </div>

      {/* Botón Ver más */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.4 }}
        >
          <Link 
            href="/galeria"
            className="inline-flex items-center gap-3 px-8 py-4 border-2 border-[#D4AF37]/30 text-[#5C4A3E] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all duration-500 rounded-full group font-light tracking-wider text-sm bg-white/50 backdrop-blur-sm hover:shadow-xl hover:shadow-[#D4AF37]/10"
          >
            <span>Ver toda la galería</span>
            <FaArrowRight className="text-xs group-hover:translate-x-2 transition-transform duration-300" />
            <span className="w-6 h-6 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] text-[10px]">
              {displayImages.length}+
            </span>
          </Link>
        </motion.div>
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
// FOOTER - REDISEÑADO
// ============================================================
const Footer = () => (
  <footer className="bg-[#1A0E0A] text-white/70 border-t border-[#D4AF37]/10">
    {/* Parte superior con ondas decorativas */}
    <div className="relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Columna 1 - Marca */}
          <div>
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#E879A0] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 group-hover:shadow-[#D4AF37]/40 transition-all duration-500">
                <FaGem className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-white font-serif text-xl tracking-wider group-hover:text-[#D4AF37] transition-colors duration-300">
                  Salon Fresh
                </span>
                <span className="block text-[8px] tracking-[0.3em] text-[#D4AF37] font-light uppercase">
                  Nails & Beauty
                </span>
              </div>
            </Link>
            
            <p className="text-white/50 text-sm font-light mt-6 leading-relaxed max-w-xs">
              Redefiniendo el cuidado y la estética con arte, pasión y excelencia. 
              Un espacio donde la belleza se convierte en experiencia.
            </p>
            
            <div className="flex gap-4 mt-6">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 flex items-center justify-center text-white/40 hover:text-[#D4AF37] transition-all duration-300 hover:scale-110"
              >
                <FaInstagram className="text-sm" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 flex items-center justify-center text-white/40 hover:text-[#D4AF37] transition-all duration-300 hover:scale-110"
              >
                <FaWhatsapp className="text-sm" />
              </a>
            </div>
          </div>

          {/* Columna 2 - Horarios */}
          <div>
            <h4 className="text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] font-light mb-6">
              Horarios de Atención
            </h4>
            <ul className="space-y-4 text-sm">
              <li className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-white/50 font-light">Lunes a Viernes</span>
                <span className="text-white font-light">09:00 - 20:00</span>
              </li>
              <li className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-white/50 font-light">Sábados</span>
                <span className="text-white font-light">09:00 - 18:00</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-white/50 font-light">Domingos</span>
                <span className="text-[#D4AF37] font-light">Cerrado</span>
              </li>
            </ul>
          </div>

          {/* Columna 3 - Enlaces Rápidos */}
          <div>
            <h4 className="text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] font-light mb-6">
              Enlaces Rápidos
            </h4>
            <ul className="space-y-3">
              {['Esencia', 'Servicios', 'Galería', 'Testimonios'].map((item) => (
                <li key={item}>
                  <Link 
                    href={`#${item.toLowerCase()}`}
                    className="text-white/50 hover:text-[#D4AF37] transition-all duration-300 text-sm font-light flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/30 group-hover:bg-[#D4AF37] transition-all duration-300" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 4 - Contacto */}
          <div>
            <h4 className="text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] font-light mb-6">
              Contacto
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-4 group">
                <div className="w-9 h-9 rounded-full bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#D4AF37]/20 transition-all duration-300">
                  <FaPhoneAlt className="text-[#D4AF37] text-xs" />
                </div>
                <div>
                  <p className="text-white/40 text-[10px] font-light uppercase tracking-wider">Teléfono</p>
                  <p className="text-white text-sm font-light">099 123 456</p>
                </div>
              </li>
              <li className="flex items-start gap-4 group">
                <div className="w-9 h-9 rounded-full bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#D4AF37]/20 transition-all duration-300">
                  <FaMapMarkerAlt className="text-[#D4AF37] text-xs" />
                </div>
                <div>
                  <p className="text-white/40 text-[10px] font-light uppercase tracking-wider">Dirección</p>
                  <p className="text-white text-sm font-light">Montevideo, Uruguay</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    {/* Parte inferior - Copyright */}
    <div className="border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-[10px] font-light tracking-wider">
            © 2026 Salon Fresh Nails. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6 text-[10px] text-white/20 font-light">
            <span>✦ Hecho con pasión en Uruguay</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">Términos y Condiciones</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
)

// ============================================================
// MAIN
// ============================================================
export default function Home() {
  const [services, setServices] = useState<any[]>([])
  const [galleryImages, setGalleryImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Obtener tenant_id
        let tenantId = null
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user?.user_metadata?.tenant_id) {
          tenantId = session.user.user_metadata.tenant_id
        } else if (session?.user?.app_metadata?.tenant_id) {
          tenantId = session.user.app_metadata.tenant_id
        }

        if (!tenantId && session?.user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', session.user.id)
            .maybeSingle() as any
          if (profile?.tenant_id) tenantId = profile.tenant_id
        }

        if (!tenantId) {
          const { data: firstService } = await supabase
            .from('services')
            .select('tenant_id')
            .limit(1)
            .maybeSingle() as any
          if (firstService?.tenant_id) tenantId = firstService.tenant_id
        }

        if (!tenantId) {
          setLoading(false)
          return
        }

        // 1. Cargar SERVICIOS desde la DB
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('name', { ascending: true })

        if (servicesData) setServices(servicesData)

        // 2. Cargar GALERÍA desde la DB
        let allImages: any[] = []

        const { data: adminPhotos } = await supabase
          .from('gallery')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(8)

        if (adminPhotos) {
          allImages = [...allImages, ...adminPhotos]
        }

        const { data: clientPhotos } = await supabase
          .from('client_gallery')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(6)

        if (clientPhotos) {
          const mapped = clientPhotos.map((p: any) => ({
            ...p,
            image_url: p.after_image_url || p.image_url || p.before_image_url || '',
            client_name: p.client_name || 'Cliente'
          }))
          allImages = [...allImages, ...mapped]
        }

        allImages.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setGalleryImages(allImages.slice(0, 6))

      } catch (error) {
        console.error('Error cargando datos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <main className="bg-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
          <p className="text-xs text-[#5C4A3E] tracking-[0.3em] uppercase font-light animate-pulse">Cargando...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-white text-[#1A0E0A] min-h-screen overflow-x-hidden">
      <Header />
      <HeroSection />
      <EsenciaSection />
      <ServicesSection services={services} />
      <GallerySection images={galleryImages} />
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