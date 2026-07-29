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
  FaCrown, FaRegStar, FaEye, FaHeart, FaClock, FaCheckCircle,
  FaSprayCan
} from 'react-icons/fa'
import { GiNails, GiScissors, GiLipstick, GiSparkles } from 'react-icons/gi'
import { HiOutlineSparkles } from 'react-icons/hi'

// ============================================================
// CONFIGURACIÓN DE ICONOS E IMÁGENES DE RESPALDO (INALTERADOS)
// ============================================================
const CATEGORY_ICONS: Record<string, any> = {
  'Uñas': GiNails,
  'Micropigmentación': GiSparkles,
  'Peluquería': GiScissors,
  'Cejas': FaRegStar,
  'Estética': GiSparkles,
  'Depilación': FaHeart,
  'Pestañas': FaEye,
  'Labios': GiLipstick,
  'Microblading': FaSprayCan,
  'default': FaGem
}

const CATEGORY_IMAGES: Record<string, string> = {
  'Uñas': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop',
  'Micropigmentación': 'https://plus.unsplash.com/premium_photo-1661580887141-7adca5e04c02?w=600&h=400&fit=crop',
  'Peluquería': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=400&fit=crop',
  'Cejas': 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=600&h=400&fit=crop',
  'Estética': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop',
  'Depilación': 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=400&fit=crop',
  'Pestañas': 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&h=400&fit=crop',
  'Labios': 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=400&fit=crop',
  'Microblading': 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=600&h=400&fit=crop',
  'default': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop'
}

// ============================================================
// HEADER (REDISEÑADO ELEGANTE & MINIMALISTA)
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
        ? 'bg-[#FFFCF8]/90 backdrop-blur-md border-b border-[#D4AF37]/10 shadow-sm py-4' 
        : 'bg-transparent py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        <Link href="/" className="flex flex-col tracking-widest group">
          <span className="text-[#1A0E0A] font-serif text-2xl tracking-[0.15em] transition-colors duration-300 group-hover:text-[#D4AF37]">
            SALON FRESH NAILS
          </span>
          <span className="text-[9px] tracking-[0.4em] text-[#D4AF37] font-light uppercase mt-0.5">
            NAILS & BEAUTY
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-10">
          {['Esencia', 'Categorías', 'Servicios', 'Galería', 'Testimonios'].map((item) => (
            <Link 
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-xs uppercase tracking-[0.2em] text-[#5C4A3E] hover:text-[#D4AF37] transition-colors duration-300 font-medium"
            >
              {item}
            </Link>
          ))}
          <Link 
            href="/agenda"
            className="border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white px-7 py-3 text-[11px] font-medium tracking-[0.25em] uppercase transition-all duration-300 rounded-none"
          >
            Reservar Cita
          </Link>
        </nav>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden text-[#1A0E0A] hover:text-[#D4AF37] transition-colors p-2"
        >
          {isOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-[#FFFCF8] border-b border-[#D4AF37]/10 py-6 px-8 shadow-xl"
          >
            <div className="flex flex-col gap-4">
              {['Esencia', 'Categorías', 'Servicios', 'Galería', 'Testimonios'].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-xs uppercase tracking-[0.2em] text-[#5C4A3E] hover:text-[#D4AF37] transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  {item}
                </Link>
              ))}
              <Link 
                href="/agenda"
                className="block text-center border border-[#D4AF37] text-[#D4AF37] py-3 text-[11px] font-medium tracking-[0.25em] uppercase mt-2"
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
// HERO (REDISEÑO ASIMÉTRICO DE ALTA COSTURA)
// ============================================================
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-24 overflow-hidden bg-[#FFF9F6]">
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="absolute top-1/4 right-[-10%] w-[50vw] h-[50vw] bg-[#F5D4E0]/30 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 relative z-10 py-12">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          <motion.div 
            className="lg:col-span-7 space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="flex items-center gap-3">
              <span className="h-[1px] w-8 bg-[#D4AF37]" />
              <span className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-semibold">
                Haute Couture Beauty Atelier
              </span>
            </div>

            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-[#1A0E0A] leading-[1.1] font-light">
              Redefiniendo <br />
              <span className="font-normal italic text-[#D4AF37] tracking-normal">la estética</span> <br />
              como arte puro.
            </h1>

            <p className="text-[#5C4A3E] text-base md:text-lg font-light max-w-lg leading-relaxed">
              Un santuario arquitectónico de relajación y vanguardia. Elevamos el cuidado de tu imagen a una experiencia sensorial inigualable y personalizada.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                href="/agenda"
                className="bg-[#1A0E0A] text-white hover:bg-[#D4AF37] px-10 py-5 text-xs font-semibold tracking-[0.3em] uppercase transition-all duration-300 text-center"
              >
                Agendar Experiencia
              </Link>
              <Link
                href="#esencia"
                className="border border-[#1A0E0A]/20 text-[#1A0E0A] hover:border-[#D4AF37] hover:text-[#D4AF37] px-10 py-5 text-xs font-semibold tracking-[0.3em] uppercase transition-all duration-300 text-center bg-white/40 backdrop-blur-sm"
              >
                Conocer la Esencia
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-12 border-t border-[#F0E4DA] max-w-md">
              <div>
                <p className="font-serif text-3xl text-[#1A0E0A]">05+</p>
                <p className="text-[9px] tracking-[0.2em] text-[#A89588] uppercase mt-1">Años Premium</p>
              </div>
              <div>
                <p className="font-serif text-3xl text-[#1A0E0A]">3K+</p>
                <p className="text-[9px] tracking-[0.2em] text-[#A89588] uppercase mt-1">Almas Felices</p>
              </div>
              <div>
                <p className="font-serif text-3xl text-[#1A0E0A]">4.9</p>
                <p className="text-[9px] tracking-[0.2em] text-[#A89588] uppercase mt-1">Reseñas Google</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="lg:col-span-5 relative flex justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
          >
            <div className="relative w-full max-w-md aspect-[3/4] bg-[#F0E4DA] overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1632661674596-d0b39ea5b87d?w=800&h=1000&fit=crop"
                alt="Elegancia y Belleza"
                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[#1A0E0A]/5 group-hover:bg-transparent transition-all duration-700" />
              
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm p-5 shadow-lg border-l-2 border-[#D4AF37]">
                <p className="text-[9px] tracking-[0.25em] text-[#D4AF37] font-bold uppercase">Atelier Destacado</p>
                <p className="font-serif text-base text-[#1A0E0A] mt-1">Técnicas exclusivas internacionales</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

// ============================================================
// ESENCIA (ESTILO REVISTA EDITORIAL)
// ============================================================
const EsenciaSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section id="esencia" ref={ref} className="py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          
          <div className="lg:col-span-5 order-2 lg:order-1 relative">
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                className="aspect-[3/5] bg-gray-100 overflow-hidden"
                animate={isInView ? { y: [40, 0], opacity: [0, 1] } : {}}
                transition={{ duration: 0.8 }}
              >
                <img src="https://images.unsplash.com/photo-1591926079847-8181980b0f09?w=500&h=800&fit=crop" className="w-full h-full object-cover" alt="Detalle" />
              </motion.div>
              <motion.div 
                className="aspect-[3/5] bg-gray-100 overflow-hidden mt-12"
                animate={isInView ? { y: [-40, 0], opacity: [0, 1] } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <img src="https://images.unsplash.com/photo-1641814250010-9887d86eedfd?w=500&h=800&fit=crop" className="w-full h-full object-cover" alt="Estilo" />
              </motion.div>
            </div>
            <div className="absolute -z-10 bottom-4 right-4 left-4 top-4 border border-[#D4AF37]/20 pointer-events-none transform translate-x-4 translate-y-4" />
          </div>

          <motion.div 
            className="lg:col-span-7 order-1 lg:order-2 space-y-6"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-semibold">NUESTRO MANIFIESTO</p>
            <h2 className="font-serif text-4xl md:text-5xl text-[#1A0E0A] font-light leading-tight">
              Crear belleza no es seguir tendencias, es <span className="italic font-normal text-[#D4AF37]">esculpir la identidad.</span>
            </h2>
            <p className="text-[#5C4A3E] font-light leading-relaxed text-base">
              Nos distanciamos de lo genérico. En Salon Fresh fusionamos ingredientes orgánicos premium con el dominio milimétrico de la técnica moderna. Aquí, cada cita es un ritual de renovación privada diseñado exclusivamente para ti.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-6 pt-6">
              <div className="border-t border-[#F0E4DA] pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <FaAward className="text-[#D4AF37]" />
                  <h4 className="text-xs font-bold tracking-[0.1em] uppercase text-[#1A0E0A]">Alta Rigurosidad</h4>
                </div>
                <p className="text-xs text-[#5C4A3E] font-light">Especialistas certificados internacionalmente en continuo perfeccionamiento técnico.</p>
              </div>
              <div className="border-t border-[#F0E4DA] pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <FaLeaf className="text-[#E879A0]" />
                  <h4 className="text-xs font-bold tracking-[0.1em] uppercase text-[#1A0E0A]">Línea Orgánica</h4>
                </div>
                <p className="text-xs text-[#5C4A3E] font-light">Productos libres de crueldad y tóxicos, priorizando la salud a largo plazo de tu piel y uñas.</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

// ============================================================
// STATS SECTION (MINIMALISTA Y SOFISTICADA)
// ============================================================
const StatsSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  const stats = [
    { number: '05+', label: 'Años de Trayectoria' },
    { number: '3K+', label: 'Clientes Premium' },
    { number: '4.9', label: 'Calificación Global' },
    { number: '100%', label: 'Garantía de Satisfacción' }
  ]

  return (
    <section ref={ref} className="py-20 bg-[#FFF8F5] border-y border-[#F0E4DA]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: idx * 0.1 }}
              className="text-center"
            >
              <p className="font-serif text-4xl md:text-5xl text-[#1A0E0A] font-light">{stat.number}</p>
              <p className="text-[10px] tracking-[0.25em] text-[#5C4A3E] uppercase mt-2 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================
// CATEGORIES SECTION (ESTILO MENÚ DE LUJO)
// ============================================================
const CategoriesSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.05 })

  const categories = [
    { id: 'manicura', name: 'Manicura de Autor', description: 'Manicura rusa refinada, nivelación e ingeniería de uñas con acabados de alta costura.', image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&fit=crop', tag: 'Elite' },
    { id: 'micropigmentacion', name: 'Micropigmentación', description: 'Realce hiperrealista de cejas, ojos y labios con pigmentos orgánicos biocompatibles.', image: 'https://plus.unsplash.com/premium_photo-1661580887141-7adca5e04c02?w=600&fit=crop', tag: 'Premium' },
    { id: 'microblading', name: 'Microblading 3D', description: 'Diseño arquitectónico pelo a pelo adaptado a la morfología de tu rostro.', image: 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=600&fit=crop', tag: 'Natural' },
    { id: 'peluqueria', name: 'Alta Peluquería', description: 'Cortes direccionales, colorimetría francesa y tratamientos moleculares de reconstrucción.', image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&fit=crop', tag: 'Vanguardia' },
    { id: 'pestanas', name: 'Mirada Minimal', description: 'Lifting botox y extensiones avanzadas con peso pluma que respetan tu pestaña natural.', image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&fit=crop', tag: 'Impacto' },
    { id: 'estetica', name: 'Estética Avanzada', description: 'Tratamientos dermacéuticos de rejuvenecimiento celular y limpieza profunda hidrafacial.', image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&fit=crop', tag: 'Bienestar' }
  ]

  return (
    <section id="categorías" ref={ref} className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
          <div className="space-y-3">
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-semibold">NUESTRAS DISCIPLINAS</p>
            <h2 className="font-serif text-4xl md:text-5xl text-[#1A0E0A] font-light">La Carta de <span className="italic font-normal text-[#D4AF37]">Especialidades</span></h2>
          </div>
          <Link href="/servicios" className="text-xs font-semibold tracking-[0.2em] uppercase text-[#1A0E0A] hover:text-[#D4AF37] transition-colors border-b border-[#1A0E0A] hover:border-[#D4AF37] pb-1 self-start md:self-auto">
            Ver Todos los Tratamientos →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat, idx) => (
            <motion.div 
              key={cat.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
              className="group border-b border-[#F0E4DA] pb-8 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="relative aspect-[16/10] overflow-hidden mb-6 bg-gray-50">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale-[30%] group-hover:grayscale-0" />
                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-[9px] tracking-widest uppercase font-semibold text-[#1A0E0A] px-3 py-1.5">{cat.tag}</span>
                </div>
                <h3 className="font-serif text-2xl text-[#1A0E0A] group-hover:text-[#D4AF37] transition-colors duration-300">{cat.name}</h3>
                <p className="text-sm text-[#5C4A3E] font-light leading-relaxed">{cat.description}</p>
              </div>
              
              <div className="pt-6">
                <Link href={`/servicios#${cat.id}`} className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-[#1A0E0A] group-hover:text-[#D4AF37] transition-colors">
                  Descubrir menú <FaArrowRight className="text-[9px] translate-x-0 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}

// ============================================================
// SERVICIOS (CON DATOS DE LA DB COMPATIBLE)
// ============================================================
const ServicesSection = ({ services }: { services: any[] }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  if (!services || services.length === 0) return null

  return (
    <section id="servicios" ref={ref} className="py-32 bg-[#FFF9F6]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        <div className="text-center max-w-xl mx-auto mb-20 space-y-3">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-semibold">RESERVAS DESTACADAS</p>
          <h2 className="font-serif text-4xl md:text-5xl text-[#1A0E0A] font-light">Experiencias más Solicitadas</h2>
          <div className="w-12 h-[1px] bg-[#D4AF37] mx-auto mt-4" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.slice(0, 4).map((service, idx) => {
            const Icon = CATEGORY_ICONS[service.category] || CATEGORY_ICONS.default
            const imageUrl = service.image_url || CATEGORY_IMAGES[service.category] || CATEGORY_IMAGES.default

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="bg-white border border-[#F0E4DA] p-8 flex flex-col justify-between transition-all duration-300 hover:border-[#D4AF37] hover:shadow-xl group"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="text-[#D4AF37] text-xl p-3 bg-[#FFF8F5] group-hover:bg-[#D4AF37] group-hover:text-white transition-colors duration-300">
                      <Icon />
                    </div>
                    <span className="text-[9px] font-bold tracking-widest uppercase text-[#5C4A3E]/60 bg-gray-50 px-2.5 py-1">
                      {service.category || 'Premium'}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl text-[#1A0E0A] mt-6 group-hover:text-[#D4AF37] transition-colors duration-300 min-h-[56px] flex items-center">
                    {service.name}
                  </h3>

                  <p className="text-xs text-[#5C4A3E] font-light leading-relaxed mt-4 line-clamp-3">
                    {service.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#F0E4DA] flex items-end justify-between">
                  <div>
                    <p className="text-[9px] tracking-wider text-[#A89588] uppercase">Inversión</p>
                    <p className="font-serif text-2xl text-[#1A0E0A] mt-0.5">${service.price}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#5C4A3E]/80 font-light">
                    <FaClock className="text-[10px] text-[#D4AF37]" />
                    <span>{service.duration} min</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {services.length > 4 && (
          <div className="text-center mt-16">
            <Link 
              href="/servicios"
              className="inline-flex items-center gap-3 border border-[#1A0E0A] text-[#1A0E0A] hover:bg-[#1A0E0A] hover:text-white px-8 py-4 text-xs font-semibold tracking-[0.25em] uppercase transition-all duration-300"
            >
              Explorar Catálogo Completo <FaArrowRight className="text-[10px]" />
            </Link>
          </div>
        )}

      </div>
    </section>
  )
}

// ============================================================
// GALERÍA (ESTILO DIARIO VISUAL CONTINUO)
// ============================================================
const GallerySection = ({ images }: { images: any[] }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  const displayImages = images && images.length > 0 
    ? images 
    : [
        'https://images.unsplash.com/photo-1591926079847-8181980b0f09?w=600&fit=crop',
        'https://images.unsplash.com/photo-1641814250010-9887d86eedfd?w=600&fit=crop',
        'https://images.unsplash.com/photo-1720343409646-960f6dcccae3?w=600&fit=crop'
      ]

  return (
    <section id="galeria" ref={ref} className="py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-16 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div className="space-y-3">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-semibold">PORTAFOLIO VISUAL</p>
          <h2 className="font-serif text-4xl md:text-5xl text-[#1A0E0A] font-light">Obras Exclusivas</h2>
        </div>
        <p className="text-sm text-[#5C4A3E] font-light max-w-xs leading-relaxed">Una mirada íntima al arte real creado diariamente en los tocadores de nuestro atelier.</p>
      </div>

      <div className="relative w-full">
        <div className="flex gap-6 overflow-x-auto pb-8 pt-4 px-6 lg:px-12 scrollbar-none snap-x snap-mandatory">
          {displayImages.map((img, idx) => {
            const imageUrl = typeof img === 'string' ? img : img.image_url
            const title = typeof img === 'string' ? 'Acabado de Autor' : img.title || 'Diseño Exclusivo'

            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="w-72 md:w-96 flex-shrink-0 snap-start group bg-white border border-[#F0E4DA] p-3"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-50 mb-4">
                  <img src={imageUrl} alt={title} className="w-full h-full object-cover filter grayscale-[15%] group-hover:grayscale-0 transition-all duration-700" loading="lazy" />
                </div>
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-serif text-[#1A0E0A] tracking-wide">{title}</p>
                  <span className="text-[9px] tracking-widest text-[#D4AF37] uppercase font-bold">✦ Fresh Art</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="text-center mt-12">
        <Link href="/galeria" className="text-xs font-bold tracking-[0.25em] uppercase text-[#1A0E0A] hover:text-[#D4AF37] border-b border-[#1A0E0A] hover:border-[#D4AF37] pb-1 transition-colors">
          Ver Todo el Feed de Arte
        </Link>
      </div>
    </section>
  )
}

// ============================================================
// TESTIMONIOS (MINIMALISTA DE GRAN IMPACTO TIPOGRÁFICO)
// ============================================================
const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const TESTIMONIALS = [
    { name: 'Valeria Martínez', role: 'Cliente desde 2021', text: 'La precisión milimétrica de su manicura rusa superó todas mis expectativas. Un nivel de detalle que roza la perfección absoluta.' },
    { name: 'Carolina Rodríguez', role: 'Cliente desde 2022', text: 'El ambiente del atelier es sublime. La colorimetría avanzada me devolvió la luminosidad natural del cabello. Son artesanas.' },
    { name: 'Agustina Sosa', role: 'Cliente desde 2020', text: 'Tres años de fidelidad absoluta. La durabilidad y sanidad de los tratamientos faciales y de uñas no tienen rival en la ciudad.' }
  ]

  return (
    <section id="testimonios" className="py-32 bg-[#FFF8F5] relative border-t border-[#F0E4DA]">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        
        <p className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-semibold mb-12">VOCES INSIGNIA</p>
        
        <div className="min-h-[220px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <FaQuoteLeft className="text-[#D4AF37]/20 text-4xl mx-auto" />
              <p className="font-serif text-xl md:text-3xl text-[#1A0E0A] font-light leading-relaxed italic">
                "{TESTIMONIALS[currentIndex].text}"
              </p>
              <div>
                <h4 className="text-sm font-bold tracking-[0.1em] text-[#1A0E0A] uppercase">{TESTIMONIALS[currentIndex].name}</h4>
                <p className="text-xs text-[#A89588] mt-1 font-light">{TESTIMONIALS[currentIndex].role}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-4 mt-12">
          {TESTIMONIALS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 transition-all duration-300 ${
                idx === currentIndex ? 'w-10 bg-[#D4AF37]' : 'w-2 bg-[#F0E4DA] hover:bg-[#D4AF37]/50'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  )
}

// ============================================================
// CTA FINAL (REDISEÑO DE CONVERSIÓN MINIMALISTA)
// ============================================================
const CtaSection = () => {
  return (
    <section className="py-32 bg-[#1A0E0A] text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(white_1px,transparent_1px)] [background-size:32px_32px]" />
      
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center relative z-10 space-y-8">
        <p className="text-[10px] tracking-[0.5em] text-[#D4AF37] uppercase font-bold">RESERVA PRIVADA</p>
        <h2 className="font-serif text-4xl md:text-6xl font-light leading-tight">¿Lista para vivir la <br /><span className="italic text-[#D4AF37] font-normal tracking-normal">experiencia Fresh</span>?</h2>
        <p className="text-white/60 font-light max-w-md mx-auto text-sm leading-relaxed">
          Las citas son limitadas para garantizar la dedicación exclusiva de nuestras especialistas a cada detalle de tu imagen.
        </p>
        
        <div className="pt-4">
          <Link 
            href="/agenda"
            className="inline-block bg-[#D4AF37] text-white hover:bg-white hover:text-[#1A0E0A] px-12 py-5 text-xs font-semibold tracking-[0.3em] uppercase transition-all duration-300"
          >
            Agendar Ahora Online
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-6 pt-6 text-[10px] tracking-wider text-white/40 uppercase font-light">
          <span>✦ Sin Costo Adicional de Gestión</span>
          <span className="text-white/10">|</span>
          <span>✦ Confirmación en Tiempo Real</span>
          <span className="text-white/10">|</span>
          <span>✦ Gestión de Cancelación Flexible</span>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// FOOTER (ESTILO BOUTIQUE INTERNACIONAL)
// ============================================================
const Footer = () => (
  <footer className="bg-[#150B08] text-white/60 border-t border-white/5 text-xs font-light">
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
      
      <div className="space-y-4">
        <Link href="/" className="flex flex-col tracking-widest">
          <span className="text-white font-serif text-xl tracking-[0.15em]">SALON FRESH</span>
          <span className="text-[8px] tracking-[0.4em] text-[#D4AF37] font-medium uppercase mt-0.5">ATELIER</span>
        </Link>
        <p className="text-white/40 leading-relaxed max-w-xs pr-4">
          Un espacio donde el rigor metodológico y la finura estética convergen para esculpir tu versión más sublime y auténtica.
        </p>
        <div className="flex gap-3 pt-2">
          <a href="#" className="w-9 h-9 border border-white/10 flex items-center justify-center text-white/50 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all"><FaInstagram /></a>
          <a href="#" className="w-9 h-9 border border-white/10 flex items-center justify-center text-white/50 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all"><FaWhatsapp /></a>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] tracking-[0.25em] uppercase text-[#D4AF37] font-bold">Disponibilidad</h4>
        <ul className="space-y-2.5">
          <li className="flex justify-between border-b border-white/5 pb-2 pr-4"><span>Lunes a Viernes</span><span className="text-white">09:00 - 20:00</span></li>
          <li className="flex justify-between border-b border-white/5 pb-2 pr-4"><span>Sábados</span><span className="text-white">09:00 - 18:00</span></li>
          <li className="flex justify-between pr-4"><span className="text-white/30">Domingos y Feriados</span><span className="text-[#D4AF37] font-medium">Cerrado</span></li>
        </ul>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] tracking-[0.25em] uppercase text-[#D4AF37] font-bold">Navegación</h4>
        <ul className="grid grid-cols-2 gap-2">
          {['Esencia', 'Categorías', 'Servicios', 'Galería', 'Testimonios'].map((item) => (
            <li key={item}>
              <Link href={`#${item.toLowerCase()}`} className="hover:text-[#D4AF37] transition-colors flex items-center gap-1.5">
                <span className="text-[8px] text-[#D4AF37]/40">✦</span> {item}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] tracking-[0.25em] uppercase text-[#D4AF37] font-bold">Contacto Boutique</h4>
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <FaPhoneAlt className="text-[#D4AF37] mt-0.5" />
            <div>
              <p className="text-[9px] uppercase tracking-wider text-white/30">Línea Directa</p>
              <p className="text-white font-medium mt-0.5">099 123 456</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <FaMapMarkerAlt className="text-[#D4AF37] mt-0.5" />
            <div>
              <p className="text-[9px] uppercase tracking-wider text-white/30">Ubicación</p>
              <p className="text-white font-medium mt-0.5">Montevideo, Uruguay</p>
            </div>
          </li>
        </ul>
      </div>

    </div>

    <div className="border-t border-white/5 py-6">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-white/30 tracking-wider uppercase">
        <p>© 2026 Salon Fresh Nails. Todos los derechos reservados.</p>
        <p className="font-light">✦ Hecho en Uruguay para el mundo</p>
      </div>
    </div>
  </footer>
)

// ============================================================
// MAIN (LÓGICA E INICIALIZACIONES TOTALMENTE INTACTAS)
// ============================================================
export default function Home() {
  const [services, setServices] = useState<any[]>([])
  const [galleryImages, setGalleryImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

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

        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('name', { ascending: true })

        if (servicesData) setServices(servicesData)

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
      <main className="bg-[#FFF9F6] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-t-2 border-[#D4AF37] border-r-2 border-transparent rounded-full animate-spin" />
          <p className="text-[10px] text-[#A89588] tracking-[0.4em] uppercase font-bold">Cargando la experiencia</p>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-white text-[#1A0E0A] min-h-screen overflow-x-hidden antialiased selection:bg-[#D4AF37]/20">
      <Header />
      <HeroSection />
      <EsenciaSection />
      <StatsSection />
      <CategoriesSection />
      <ServicesSection services={services} />
      <GallerySection images={galleryImages} />
      <TestimonialsSection />
      <CtaSection />
      <Footer />
    </main>
  )
}
