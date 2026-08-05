// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { 
  FaArrowRight, FaQuoteLeft, FaInstagram, FaWhatsapp, FaStar,
  FaBars, FaTimes, FaPhoneAlt, FaMapMarkerAlt, FaClock
} from 'react-icons/fa'
import { GiNails, GiScissors, GiSparkles } from 'react-icons/gi'

const DEFAULT_HERO_IMAGE = "https://kzovcbefedfmpeucrofh.supabase.co/storage/v1/object/public/gallery/IMG-20260805-WA0002.jpg"

const CATEGORY_ICONS: Record<string, any> = {
  'Uñas': GiNails,
  'Micropigmentación': GiSparkles,
  'Peluquería': GiScissors,
  'Estética': GiSparkles,
  'default': GiNails
}

const getCleanSlug = (text: string) => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

// ============================================================
// HEADER
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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md border-b border-pink-100 shadow-sm py-4' 
        : 'bg-transparent py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        <Link href="/" className="flex flex-col group">
          <span className="text-[#1A0E0A] font-serif text-2xl tracking-wide transition-colors group-hover:text-pink-600">
            SALON FRESH NAILS
          </span>
          <span className="text-[10px] tracking-widest text-pink-600 font-medium uppercase">
            Aniexis Campo Leyva
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {['Equipo', 'Especialidades', 'Servicios', 'Galería', 'Testimonios'].map((item) => (
            <Link 
              key={item}
              href={`#${getCleanSlug(item)}`}
              className="text-xs uppercase tracking-wider text-[#5C4A3E] hover:text-pink-600 transition-colors font-medium"
            >
              {item}
            </Link>
          ))}
          <Link 
            href="/agenda"
            className="bg-pink-600 text-white hover:bg-pink-700 px-6 py-2.5 text-xs font-semibold tracking-wider uppercase transition-all rounded-full shadow-sm"
          >
            Agendar Cita
          </Link>
        </nav>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden text-[#1A0E0A] hover:text-pink-600 transition-colors p-2"
          aria-label="Abrir menú"
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
            className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-pink-100 py-6 px-8 shadow-xl"
          >
            <div className="flex flex-col gap-4">
              {['Equipo', 'Especialidades', 'Servicios', 'Galería', 'Testimonios'].map((item) => (
                <Link
                  key={item}
                  href={`#${getCleanSlug(item)}`}
                  className="text-xs uppercase tracking-wider text-[#5C4A3E] hover:text-pink-600 transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  {item}
                </Link>
              ))}
              <Link 
                href="/agenda"
                className="block text-center bg-pink-600 text-white py-3 text-xs font-semibold tracking-wider uppercase rounded-full mt-2"
                onClick={() => setIsOpen(false)}
              >
                Agendar Cita
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
const HeroSection = ({ heroImage }: { heroImage?: string }) => {
  const imageUrl = heroImage || DEFAULT_HERO_IMAGE

  return (
    <section className="relative min-h-screen flex items-center pt-28 pb-16 overflow-hidden bg-gradient-to-b from-pink-50/50 via-white to-white">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          <motion.div 
            className="lg:col-span-7 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-pink-100/80 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-pink-600" />
              <span className="text-xs tracking-wide uppercase text-pink-700 font-semibold">
                Salon Fresh Nails
              </span>
            </div>

            <h1 className="font-serif text-4xl md:text-6xl text-[#1A0E0A] leading-tight font-medium">
              Especialistas en manicura y belleza por <br />
              <span className="text-pink-600 italic">Aniexis Campo Leyva</span>
            </h1>

            <p className="text-[#5C4A3E] text-base md:text-lg font-normal max-w-lg leading-relaxed">
              Resalta tu belleza natural con técnicas profesionales en manicura, cuidado de uñas y estilismo de peluquería de la mano de nuestro equipo especialista.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                href="/agenda"
                className="bg-pink-600 text-white hover:bg-pink-700 px-8 py-4 text-xs font-semibold tracking-wider uppercase transition-all text-center rounded-full shadow-md hover:shadow-lg"
              >
                Reservar Turno
              </Link>
              <Link
                href="#equipo"
                className="border border-gray-300 text-[#1A0E0A] hover:border-pink-600 hover:text-pink-600 px-8 py-4 text-xs font-semibold tracking-wider uppercase transition-all text-center rounded-full bg-white"
              >
                Conocer al Equipo
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-100 max-w-md">
              <div>
                <p className="font-serif text-3xl text-[#1A0E0A] font-bold">5+</p>
                <p className="text-xs text-gray-500 uppercase mt-1 font-medium">Años de experiencia</p>
              </div>
              <div>
                <p className="font-serif text-3xl text-[#1A0E0A] font-bold">3K+</p>
                <p className="text-xs text-gray-500 uppercase mt-1 font-medium">Clientes satisfechas</p>
              </div>
              <div>
                <p className="font-serif text-3xl text-[#1A0E0A] font-bold">4.9 ★</p>
                <p className="text-xs text-gray-500 uppercase mt-1 font-medium">Valoración</p>
              </div>
            </div>
          </motion.div>

          {/* FOTO ESPECTACULAR DESTACADA EN EL HERO */}
          <motion.div 
            className="lg:col-span-5 relative flex justify-center items-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative w-full max-w-md group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 to-rose-300 rounded-3xl blur-md opacity-30 group-hover:opacity-60 transition duration-500"></div>
              
              <div className="relative aspect-[3/4] bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <img 
                  src={imageUrl}
                  alt="Aniexis Campo Leyva - Salon Fresh Nails"
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition duration-700"
                />
                
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-pink-100">
                  <p className="text-xs font-bold text-pink-600 uppercase tracking-wider">Fundadora & Máster</p>
                  <p className="font-serif text-base text-[#1A0E0A] font-semibold">Aniexis Campo Leyva</p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

// ============================================================
// EQUIPO PROFESIONAL (ANIEXIS & SILVANA)
// ============================================================
const EquipoSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section id="equipo" ref={ref} className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <p className="text-xs tracking-widest uppercase text-pink-600 font-semibold">NUESTRO EQUIPO</p>
          <h2 className="font-serif text-3xl md:text-5xl text-[#1A0E0A] font-medium">Profesionales a tu Servicio</h2>
          <p className="text-[#5C4A3E] text-sm pt-2">Especialistas dedicas a brindarte el mejor cuidado y resultados de alta calidad.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-stretch">
          
          {/* ANIEXIS CAMPO LEYVA */}
          <motion.div 
            className="bg-pink-50/40 rounded-3xl border border-pink-100 overflow-hidden p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="space-y-6">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-pink-100 border border-white shadow-sm">
                <img 
                  src="https://kzovcbefedfmpeucrofh.supabase.co/storage/v1/object/public/profesionals/any.png" 
                  className="w-full h-full object-cover" 
                  alt="Aniexis Campo Leyva" 
                />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-pink-600">Fundadora & Especialista en Uñas</span>
                <h3 className="font-serif text-2xl text-[#1A0E0A] font-semibold mt-1">Aniexis Campo Leyva</h3>
                <p className="text-xs text-[#5C4A3E] leading-relaxed mt-3">
                  Apasionada por la belleza de las manos y pies. Especializada en manicura rusa, esmaltado semipermanente y nivelación con gel, garantizando la salud natural de tus uñas.
                </p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-pink-200/60 flex items-center justify-between text-xs font-semibold text-pink-700">
              <span>Manicura & Pedicura</span>
              <Link href="/agenda" className="hover:underline">Agendar con Aniexis →</Link>
            </div>
          </motion.div>

          {/* SILVANA (PELUQUERÍA) */}
          <motion.div 
            className="bg-pink-50/40 rounded-3xl border border-pink-100 overflow-hidden p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="space-y-6">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-pink-100 border border-white shadow-sm flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&fit=crop" 
                  className="w-full h-full object-cover" 
                  alt="Silvana - Peluquería" 
                />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-pink-600">Especialista Capilar</span>
                <h3 className="font-serif text-2xl text-[#1A0E0A] font-semibold mt-1">Silvana</h3>
                <p className="text-xs text-[#5C4A3E] leading-relaxed mt-3">
                  Encargada del área de Peluquería en Salon Fresh Nails. Experta en cortes, peinados, nutrición capilar y tratamientos que le devuelven el brillo y fuerza a tu cabello.
                </p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-pink-200/60 flex items-center justify-between text-xs font-semibold text-pink-700">
              <span>Peluquería & Estilismo</span>
              <Link href="/agenda" className="hover:underline">Agendar con Silvana →</Link>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  )
}

// ============================================================
// ESPECIALIDADES
// ============================================================
const EspecialidadesSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.05 })

  const categories = [
    { id: 'manicura', name: 'Manicura Profesional', description: 'Manicura rusa, nivelación con gel, esmaltado semipermanente y diseños personalizados por Aniexis.', image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&fit=crop' },
    { id: 'peluqueria', name: 'Peluquería & Capilar', description: 'Cortes, peinados y tratamientos capilares profesionales a cargo de Silvana.', image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&fit=crop' },
    { id: 'pedicura', name: 'Pedicura Completa', description: 'Tratamiento profundo para pies, cuidado de uñas, exfoliación e hidratación.', image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&fit=crop' },
    { id: 'pestanas', name: 'Pestañas y Cejas', description: 'Lifting de pestañas, perfilado y diseño de cejas para resaltar la mirada.', image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&fit=crop' }
  ]

  return (
    <section id="especialidades" ref={ref} className="py-24 bg-pink-50/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <p className="text-xs tracking-widest uppercase text-pink-600 font-semibold">LO QUE OFRECEMOS</p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#1A0E0A] font-medium mt-1">Especialidades del Salón</h2>
          </div>
          <Link href="/servicios" className="text-xs font-semibold tracking-wider uppercase text-pink-600 hover:text-pink-700 transition-colors">
            Ver Todos los Servicios →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((cat, idx) => (
            <motion.div 
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-pink-100 flex flex-col justify-between group transition-all"
            >
              <div>
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-xl text-[#1A0E0A] font-semibold group-hover:text-pink-600 transition-colors">{cat.name}</h3>
                  <p className="text-xs text-[#5C4A3E] font-normal leading-relaxed mt-2">{cat.description}</p>
                </div>
              </div>
              
              <div className="px-6 pb-6">
                <Link href={`/servicios#${cat.id}`} className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-pink-600 hover:text-pink-700">
                  Ver opciones <FaArrowRight className="text-[10px]" />
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
// SERVICIOS
// ============================================================
const ServicesSection = ({ services }: { services: any[] }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  if (!services || services.length === 0) return null

  return (
    <section id="servicios" ref={ref} className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
          <p className="text-xs tracking-widest uppercase text-pink-600 font-semibold">PRECIOS Y TURNOS</p>
          <h2 className="font-serif text-3xl md:text-4xl text-[#1A0E0A] font-medium">Servicios Populares</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.slice(0, 4).map((service, idx) => {
            const Icon = CATEGORY_ICONS[service.category] || CATEGORY_ICONS.default

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:border-pink-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="text-pink-600 text-xl p-3 bg-pink-50 rounded-xl">
                      <Icon />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                      {service.category || 'Nails'}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-semibold text-[#1A0E0A] mt-4 min-h-[48px] flex items-center">
                    {service.name}
                  </h3>

                  <p className="text-xs text-gray-600 font-normal leading-relaxed mt-2 line-clamp-3">
                    {service.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-medium">Precio</p>
                    <p className="font-serif text-2xl font-bold text-pink-600">${service.price}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <FaClock className="text-pink-500" />
                    <span>{service.duration} min</span>
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
              className="inline-flex items-center gap-2 bg-pink-600 text-white hover:bg-pink-700 px-8 py-3.5 text-xs font-semibold tracking-wider uppercase transition-all rounded-full shadow-sm"
            >
              Ver Catálogo Completo <FaArrowRight className="text-[10px]" />
            </Link>
          </div>
        )}

      </div>
    </section>
  )
}

// ============================================================
// GALERÍA
// ============================================================
const GallerySection = ({ images }: { images: any[] }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  const displayImages = images && images.length > 0 
    ? images 
    : [
        DEFAULT_HERO_IMAGE,
        'https://images.unsplash.com/photo-1591926079847-8181980b0f09?w=600&fit=crop',
        'https://images.unsplash.com/photo-1641814250010-9887d86eedfd?w=600&fit=crop',
        'https://images.unsplash.com/photo-1720343409646-960f6dcccae3?w=600&fit=crop'
      ]

  return (
    <section id="galeria" ref={ref} className="py-24 bg-pink-50/20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase text-pink-600 font-semibold">TRABAJOS REALES</p>
          <h2 className="font-serif text-3xl md:text-4xl text-[#1A0E0A] font-medium mt-1">Galería del Salón</h2>
        </div>
        <p className="text-xs text-gray-500 max-w-xs">Resultados diarios en uñas y peluquería en Salon Fresh Nails.</p>
      </div>

      <div className="relative w-full">
        <div className="flex gap-6 overflow-x-auto pb-6 pt-2 px-6 lg:px-12 scrollbar-none snap-x snap-mandatory">
          {displayImages.map((img, idx) => {
            const imageUrl = typeof img === 'string' ? img : img.image_url
            const title = typeof img === 'string' ? 'Diseño de Uñas' : img.title || 'Trabajo Fresh Nails'

            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="w-72 md:w-80 flex-shrink-0 snap-start bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 p-2"
              >
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-50 mb-3">
                  <img src={imageUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-[#1A0E0A]">{title}</p>
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
// TESTIMONIOS
// ============================================================
const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const TESTIMONIALS = [
    { name: 'Valeria Martínez', text: 'Aniexis es súper detallista con la manicura. Mis uñas duran impecables semanas.' },
    { name: 'Carolina Rodríguez', text: 'Silvana me hizo un tratamiento capilar increíble, el cabello me quedó suave y con mucho brillo.' },
    { name: 'Agustina Sosa', text: 'Excelente atención en Salon Fresh Nails. Un ambiente cálido y profesional.' }
  ]

  return (
    <section id="testimonios" className="py-24 bg-white relative border-t border-gray-100">
      <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
        
        <p className="text-xs tracking-widest uppercase text-pink-600 font-semibold mb-8">OPINIONES DE CLIENTES</p>
        
        <div className="min-h-[180px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <FaQuoteLeft className="text-pink-200 text-3xl mx-auto" />
              <p className="font-serif text-lg md:text-2xl text-[#1A0E0A] font-normal leading-relaxed italic">
                "{TESTIMONIALS[currentIndex].text}"
              </p>
              <div>
                <h4 className="text-xs font-bold text-[#1A0E0A] uppercase tracking-wider">{TESTIMONIALS[currentIndex].name}</h4>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-3 mt-8">
          {TESTIMONIALS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-8 bg-pink-600' : 'w-2 bg-gray-200 hover:bg-pink-300'
              }`}
              aria-label={`Testimonio ${idx + 1}`}
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
  return (
    <section className="py-20 bg-pink-600 text-white text-center relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 space-y-6 relative z-10">
        <h2 className="font-serif text-3xl md:text-5xl font-medium">¿Lista para consentirte?</h2>
        <p className="text-white/90 font-normal max-w-md mx-auto text-sm">
          Reserva tu cita en **Salon Fresh Nails** con **Aniexis Campo Leyva** y **Silvana**.
        </p>
        
        <div className="pt-2">
          <Link 
            href="/agenda"
            className="inline-block bg-white text-pink-600 hover:bg-gray-100 px-10 py-4 text-xs font-semibold tracking-wider uppercase transition-all rounded-full shadow-md"
          >
            Agendar Cita Online
          </Link>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// FOOTER
// ============================================================
const Footer = () => (
  <footer className="bg-[#1A0E0A] text-white/70 border-t border-white/5 text-xs">
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      
      <div className="space-y-3">
        <Link href="/" className="flex flex-col">
          <span className="text-white font-serif text-lg">SALON FRESH NAILS</span>
          <span className="text-[9px] tracking-widest text-pink-400 uppercase">Aniexis Campo Leyva</span>
        </Link>
        <p className="text-white/50 text-xs leading-relaxed">
          Especialistas en manicura profesional, pedicura y servicios de peluquería.
        </p>
        <div className="flex gap-3 pt-2">
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/70 hover:border-pink-500 hover:text-pink-500 transition-all"
            aria-label="Instagram"
          >
            <FaInstagram />
          </a>
          <a 
            href="https://whatsapp.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/70 hover:border-pink-500 hover:text-pink-500 transition-all"
            aria-label="WhatsApp"
          >
            <FaWhatsapp />
          </a>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider">Horarios</h4>
        <ul className="space-y-2 text-xs">
          <li className="flex justify-between"><span>Lunes a Viernes</span><span className="text-white">09:00 - 20:00</span></li>
          <li className="flex justify-between"><span>Sábados</span><span className="text-white">09:00 - 18:00</span></li>
          <li className="flex justify-between"><span className="text-white/40">Domingos</span><span className="text-pink-400">Cerrado</span></li>
        </ul>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider">Navegación</h4>
        <ul className="space-y-2 text-xs">
          {['Equipo', 'Especialidades', 'Servicios', 'Galería', 'Testimonios'].map((item) => (
            <li key={item}>
              <Link href={`#${getCleanSlug(item)}`} className="hover:text-pink-400 transition-colors">
                {item}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider">Contacto</h4>
        <ul className="space-y-3 text-xs">
          <li className="flex items-center gap-2">
            <FaPhoneAlt className="text-pink-400" />
            <span className="text-white">099 123 456</span>
          </li>
          <li className="flex items-center gap-2">
            <FaMapMarkerAlt className="text-pink-400" />
            <span className="text-white">Montevideo, Uruguay</span>
          </li>
        </ul>
      </div>

    </div>

    <div className="border-t border-white/5 py-4">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center text-[11px] text-white/40">
        <p>© 2026 Salon Fresh Nails - Aniexis Campo Leyva. Todos los derechos reservados.</p>
      </div>
    </div>
  </footer>
)

// ============================================================
// COMPONENTE PRINCIPAL (HOME)
// ============================================================
export default function Home() {
  const [services, setServices] = useState<any[]>([])
  const [galleryImages, setGalleryImages] = useState<any[]>([])
  const [heroImage, setHeroImage] = useState<string>(DEFAULT_HERO_IMAGE)
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

        // 1. Obtener Servicios
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('name', { ascending: true })

        if (servicesData) setServices(servicesData)

        // 2. Obtener Imagen Dinámica para el Hero si existe en el Admin
        const { data: heroData } = await supabase
          .from('gallery')
          .select('image_url')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .or('category.eq.hero,is_hero.eq.true')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle() as any

        if (heroData?.image_url) {
          setHeroImage(heroData.image_url)
        }

        // 3. Obtener Imágenes de la Galería
        let allImages: any[] = []

        const { data: adminPhotos } = await supabase
          .from('gallery')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(8)

        if (adminPhotos) allImages = [...allImages, ...adminPhotos]

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

        allImages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setGalleryImages(allImages.slice(0, 8))

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
      <main className="bg-[#FFFDFB] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500 uppercase tracking-wider">Cargando...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-[#FFFDFB] text-[#1A0E0A] min-h-screen font-sans antialiased">
      <Header />
      <HeroSection heroImage={heroImage} />
      <EquipoSection />
      <EspecialidadesSection />
      <ServicesSection services={services} />
      <GallerySection images={galleryImages} />
      <TestimonialsSection />
      <CtaSection />
      <Footer />
    </main>
  )
}
