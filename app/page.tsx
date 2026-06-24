'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  FaArrowRight, 
  FaQuoteLeft,
  FaGraduationCap,
  FaCheckCircle,
  FaChevronDown,
  FaStar,
  FaGem,
  FaMagic,
  FaPalette,
  FaBrush,
  FaEye,
  FaCalendarAlt,
  FaHeart,
  FaClock,
  FaSparkles,
  FaAward,
  FaInstagram,
  FaFacebook,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaUserGraduette,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useServices, useStaff, useTestimonials } from '@/hooks/useData'

// ============================================
// COMPONENTE: HERO SECTION (CINEMATIC LUXURY)
// ============================================
function HeroSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#0d0b0a] text-white pt-32 pb-24 overflow-hidden">
      {/* Luces de Fondo (Glow FX) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-rose-900/20 rounded-full filter blur-[120px] animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-amber-950/20 rounded-full filter blur-[120px] animate-pulse duration-[6000ms]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1c1917_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Texto Principal */}
          <div className={`lg:col-span-7 space-y-8 transition-all duration-1000 transform ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/30 px-4 py-1.5 rounded-full backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <p className="text-xs uppercase tracking-[0.25em] font-medium bg-gradient-to-r from-amber-200 to-rose-300 bg-clip-text text-transparent">
                The Luxury Standard in Nail Art
              </p>
            </div>

            <h1 className="text-5xl sm:text-7xl font-extralight tracking-tight leading-[1.05] text-stone-100">
              Donde tus manos <br />
              <span className="font-serif italic font-normal text-gradient bg-gradient-to-r from-rose-300 via-amber-200 to-rose-400 bg-clip-text text-transparent">
                se vuelven obras
              </span > <br />
              de alta costura.
            </h1>

            <p className="text-base sm:text-lg text-stone-400 font-light max-w-xl leading-relaxed">
              Especialistas en ingeniería de la manicura combinada y extensiones esculturales. Creamos diseños vanguardistas que fusionan resistencia estructural y joyería fina.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/reservas" className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 p-[1px] transition-all duration-300 shadow-[0_0_30px_rgba(225,29,72,0.2)] hover:shadow-[0_0_40px_rgba(225,29,72,0.4)]">
                <div className="bg-stone-950 text-white group-hover:bg-transparent px-8 py-4 rounded-[11px] font-medium text-sm tracking-wider transition-colors duration-300 flex items-center justify-center gap-3">
                  RESERVAR CITA PREMIUM
                  <FaArrowRight className="text-xs group-hover:translate-x-1.5 transition-transform duration-300 text-rose-400 group-hover:text-white" />
                </div>
              </Link>
              <Link href="#servicios" className="group bg-stone-900/60 hover:bg-stone-900 border border-stone-800 hover:border-stone-700 px-8 py-4 rounded-xl font-medium text-sm tracking-wider transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm">
                VER MENÚ DE GALERÍA
              </Link>
            </div>

            {/* Badges de Confianza */}
            <div className="grid grid-cols-3 gap-6 pt-12 border-t border-stone-900 max-w-md">
              <div>
                <p className="text-2xl font-serif italic text-amber-200">100%</p>
                <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">Esterilización Médica</p>
              </div>
              <div>
                <p className="text-2xl font-serif italic text-rose-300">Nivel 5</p>
                <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">Técnicas Rusas</p>
              </div>
              <div>
                <p className="text-2xl font-serif italic text-stone-200">20k+</p>
                <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">Uñas Esculpidas</p>
              </div>
            </div>
          </div>

          {/* Bloque Gráfico Premium con Efectos Avanzados */}
          <div className={`lg:col-span-5 relative transition-all duration-1000 delay-300 transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="relative w-full max-w-md mx-auto aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-stone-800 bg-stone-950 group">
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent z-10 opacity-60" />
              <img
                src="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&fit=crop&q=90"
                alt="Alta manicura en exposición"
                className="w-full h-full object-cover transition-transform duration-[10s] ease-out group-hover:scale-110"
              />
              
              {/* Overlay Flotante */}
              <div className="absolute bottom-6 left-6 right-6 z-20 bg-stone-900/85 backdrop-blur-xl border border-stone-800 p-5 rounded-2xl shadow-xl transition-all duration-300 group-hover:border-rose-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <FaGem className="animate-spin duration-[4000ms]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200">Garantía Crystal Gloss</h4>
                    <p className="text-[11px] text-stone-400 font-light mt-0.5">Brillo irrompible blindado por hasta 21 días completos.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

// ============================================
// COMPONENTE: SERVICIOS CON TARJETAS TRABAJADAS
// ============================================
function ServicesSection() {
  const { data: services, loading } = useServices()

  const defaultServices = [
    { 
      name: 'Manicura Rusa Combina & Capping', 
      description: 'Limpieza microscópica de cutículas con fresas alemanas de alta precisión, seguida de un escudo de gel estructural que nivela, unifica y protege el crecimiento biológico.', 
      price: 45, 
      duration: 90, 
      image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&fit=crop&q=80',
      tag: 'Más Solicitado'
    },
    { 
      name: 'Extensiones Esculturales Soft Gel', 
      description: 'Arquitectura completa de la uña utilizando tips de gel preformados y adhesión molecular. Flexibilidad de vanguardia con un grosor ultra natural e imperceptible al tacto.', 
      price: 65, 
      duration: 120, 
      image: 'https://images.unsplash.com/photo-1626015713026-d8309cdc91ea?w=600&fit=crop&q=80',
      tag: 'Premium Trend'
    },
    { 
      name: 'Nail Art de Autor (Mano Alzada)', 
      description: 'Llevamos tus ideas al lienzo. Diseños geométricos micro-detallados, encapsulados con pan de oro, efectos holográficos avanzados y pedrería fina genuina.', 
      price: 55, 
      duration: 105, 
      image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&fit=crop&q=80',
      tag: 'Alta Costura'
    },
  ]

  const displayServices = services?.length ? services : defaultServices

  return (
    <section id="servicios" className="py-32 bg-[#12100e] text-white relative">
      <div className="w-full max-w-7xl mx-auto px-4">
        
        {/* Encabezado de Sección */}
        <div className="max-w-3xl mx-auto text-center mb-24 space-y-4">
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-rose-500 bg-rose-500/5 border border-rose-500/20 px-4 py-1.5 rounded-full inline-block">
            CARTA DE EXPERIENCIAS EXCLUSIVAS
          </span>
          <h2 className="text-4xl sm:text-5xl font-extralight tracking-tight">
            Nuestros Tratamientos <span className="font-serif italic text-amber-200">Firmados</span>
          </h2>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-rose-500 to-transparent mx-auto mt-4" />
        </div>

        {/* Rejilla de Tarjetas Trabajadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayServices.map((service: any, idx: number) => (
            <div
              key={idx}
              className="group bg-[#1a1715] border border-stone-850 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex flex-col justify-between"
            >
              {/* Contenedor de Imagen de alta calidad con efecto zoom */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1715] via-transparent to-transparent z-10" />
                <img 
                  src={service.image || defaultServices[idx % 3].image} 
                  alt={service.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                
                {/* Badge Dinámico */}
                <span className="absolute top-4 left-4 z-20 bg-stone-950/80 backdrop-blur-md border border-amber-500/30 text-[10px] font-bold text-amber-300 uppercase tracking-widest px-3 py-1 rounded-md">
                  {service.tag || 'Servicio VIP'}
                </span>

                {/* Precio Flotante Estilizado */}
                <div className="absolute bottom-4 right-4 z-20 bg-rose-600 font-serif italic text-white text-xl px-4 py-1.5 rounded-xl shadow-lg transform group-hover:scale-105 transition-transform">
                  ${service.price}
                </div>
              </div>

              {/* Contenido Técnico de la Tarjeta */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-medium tracking-tight text-stone-100 group-hover:text-rose-400 transition-colors duration-300">
                      {service.name}
                    </h3>
                  </div>
                  <p className="text-sm text-stone-400 font-light leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Métricas e Interacción Inferior */}
                <div className="pt-4 border-t border-stone-800/60 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-stone-400 font-light">
                    <FaClock className="text-amber-400 text-xs" /> {service.duration || 90} Minutos de sesión
                  </span>
                  <Link href="/reservas" className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 group-hover:text-white transition-colors duration-300">
                    AGENDAR EXP <FaArrowRight className="text-[10px] transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

// ============================================
// COMPONENTE: ACADEMIA REESCRITA Y MAJESTUOSA
// ============================================
function AcademySection() {
  const masterclasses = [
    {
      level: 'Nivel Inicial / Intermedio',
      title: 'Máster en Manicura Rusa Combinada',
      description: 'Domina el control absoluto del torno micromotor, la correcta selección de fresas diamantadas y el corte perfecto de cutícula sin sangrado. Incluye química de productos y anatomía de la placa ungueal.',
      duration: '3 Días Intensivos',
      perks: ['Kit Profesional Completo', 'Modelos Reales Incluidas', 'Certificado Internacional', 'Acceso a Comunidad Alumnas']
    },
    {
      level: 'Nivel Avanzado / Perfeccionamiento',
      title: 'Estructuras Extremas y Nail Art Pro',
      description: 'Lleva tu arte al siguiente nivel. Aprendizaje especializado en reversas perfectas, encastre preciso de moldes físicos, manejo de Polygel estructural y simetría arquitectónica en puntas Coffin, Stiletto y Almendra.',
      duration: '2 Jornadas Full-Day',
      perks: ['Materiales de Alta Gama Premium', 'Dosier Técnico Detallado', 'Sesión de Fotografía de Portafolio', 'Soporte Post-Curso de 6 meses']
    }
  ]

  return (
    <section className="py-32 bg-[#0d0b0a] text-white relative overflow-hidden border-t border-stone-900">
      <div className="absolute inset-0 bg-gradient-to-b from-rose-950/10 via-transparent to-transparent opacity-50" />
      
      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        
        {/* Título Academia */}
        <div className="grid lg:grid-cols-12 gap-8 items-center mb-20">
          <div className="lg:col-span-6">
            <span className="text-xs font-bold tracking-[0.3em] text-amber-400 block mb-2">NAIL MASTER ACADEMY</span>
            <h2 className="text-4xl sm:text-5xl font-extralight tracking-tight leading-none">
              Transforma tu pasión en un <br />
              <span className="font-serif italic font-normal text-rose-400">Negocio de Éxito</span>
            </h2>
          </div>
          <div className="lg:col-span-6">
            <p className="text-stone-400 font-light text-sm sm:text-base leading-relaxed">
              No enseñamos pasatiempos, formamos a las futuras líderes de la industria del Nail Art. Nuestros programas de capacitación internacional te dotarán de la precisión quirúrgica y la visión empresarial para destacar de inmediato.
            </p>
          </div>
        </div>

        {/* Tarjetas Monumentales de Cursos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {masterclasses.map((course, index) => (
            <div 
              key={index} 
              className="bg-[#141211] border border-stone-850 rounded-3xl p-8 md:p-10 transition-all duration-500 hover:border-amber-500/20 group relative overflow-hidden"
            >
              {/* Fondo decorativo sutil en hover */}
              <div className="absolute -right-16 -top-16 w-48 h-48 bg-rose-500/5 rounded-full filter blur-xl group-hover:bg-rose-500/10 transition-colors" />

              <div className="flex flex-col h-full justify-between space-y-8">
                <div className="space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300 bg-amber-400/5 border border-amber-400/20 px-3 py-1 rounded-md inline-block">
                    {course.level}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-serif text-stone-100 group-hover:text-rose-300 transition-colors duration-300">
                    {course.title}
                  </h3>
                  <p className="text-sm text-stone-400 font-light leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Lista de Beneficios */}
                <div className="space-y-3 pt-4 border-t border-stone-850">
                  <p className="text-xs font-bold uppercase text-stone-400 tracking-wider flex items-center gap-2">
                    <FaAward className="text-amber-400" /> Beneficios del Programa:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.perks.map((perk, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2 text-xs text-stone-300 font-light">
                        <FaCheckCircle className="text-rose-500 text-[10px] flex-shrink-0" />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Duración y CTA de matrícula */}
                <div className="pt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <span className="text-xs text-stone-400 flex items-center gap-2 bg-stone-900 px-4 py-2 rounded-xl border border-stone-800">
                    ⏱️ <strong className="text-stone-200">{course.duration}</strong>
                  </span>
                  <Link href="/academy" className="bg-stone-100 text-stone-950 hover:bg-rose-500 hover:text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 text-center">
                    CONSULTAR MATRÍCULA
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

// ============================================
// COMPONENTE: TESTIMONIOS (CARRUSEL INTERACTIVO)
// ============================================
function TestimonialsSection() {
  const { data: testimonials, loading } = useTestimonials()
  const [currentIndex, setCurrentIndex] = useState(0)

  const defaultTestimonials = [
    {
      comment: "La precisión de la manicura rusa aquí es de otro planeta. Mis cutículas nunca lucieron tan limpias y perfectas, y el capping me duró intacto un mes entero. ¡Vale cada centavo!",
      name: "Valeria Mendoza",
      service: "Manicura Rusa & Capping"
    },
    {
      comment: "Hice el curso máster en la academia y literal cambió mi carrera. La paciencia de las instructoras y el nivel técnico superó todo lo que vi antes en redes.",
      name: "Agustina Silva",
      service: "Alumna Academia"
    },
    {
      comment: "Un santuario del buen gusto. Los diseños a mano alzada son verdaderas joyas artísticas. No confío mis manos a nadie más.",
      name: "Carolina Rostagnol",
      service: "Nail Art de Autor"
    }
  ]

  const items = testimonials?.length ? testimonials : defaultTestimonials

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % items.length)
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)

  return (
    <section className="py-32 bg-[#12100e] text-white border-t border-stone-900">
      <div className="w-full max-w-4xl mx-auto px-4">
        
        <div className="text-center mb-16 space-y-2">
          <span className="text-xs font-bold tracking-[0.25em] text-rose-500 uppercase">SOCIÉTÉ PRIVÉE</span>
          <h2 className="text-4xl font-extralight tracking-tight">Lo que dicen <span className="font-serif italic text-amber-200">nuestras clientas</span></h2>
        </div>

        {/* Estructura del Carrusel */}
        <div className="relative bg-[#1a1715] border border-stone-850 rounded-3xl p-8 md:p-16 text-center shadow-2xl min-h-[340px] flex flex-col justify-center">
          <FaQuoteLeft className="text-stone-800 text-6xl absolute top-8 left-8 opacity-40 pointer-events-none" />
          
          {/* Animación fluida de opacidad controlada por key */}
          <div key={currentIndex} className="animate-fade-in space-y-6 transition-all duration-500">
            <p className="text-lg md:text-xl text-stone-300 font-light leading-relaxed italic">
              "{items[currentIndex]?.comment}"
            </p>
            
            <div className="pt-4 flex flex-col items-center">
              <span className="text-sm font-semibold text-stone-100 tracking-wide">
                {items[currentIndex]?.name}
              </span>
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-widest mt-1 bg-rose-500/5 border border-rose-500/10 px-2.5 py-0.5 rounded">
                {items[currentIndex]?.service || 'Clienta VIP'}
              </span>
            </div>
          </div>

          {/* Botones Flotantes del Carrusel */}
          <div className="absolute inset-y-0 -left-4 md:-left-6 flex items-center">
            <button 
              onClick={prevSlide}
              className="w-12 h-12 rounded-xl bg-stone-900 border border-stone-800 hover:border-rose-500 text-stone-400 hover:text-white transition-all duration-300 flex items-center justify-center shadow-xl"
            >
              <FaChevronLeft className="text-xs" />
            </button>
          </div>
          <div className="absolute inset-y-0 -right-4 md:-right-6 flex items-center">
            <button 
              onClick={nextSlide}
              className="w-12 h-12 rounded-xl bg-stone-900 border border-stone-800 hover:border-rose-500 text-stone-400 hover:text-white transition-all duration-300 flex items-center justify-center shadow-xl"
            >
              <FaChevronRight className="text-xs" />
            </button>
          </div>

        </div>

      </div>
    </section>
  )
}

// ============================================
// COMPONENTE: COMPROMISO HIGIENE (NUEVO CONTENIDO)
// ============================================
function HygieneSection() {
  return (
    <section className="py-24 bg-[#0d0b0a] text-white border-t border-stone-900 relative">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-[#141211] to-[#1e1917] border border-stone-850 rounded-3xl p-8 md:p-12 grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-4 flex justify-center md:justify-start">
            <div className="w-24 h-24 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-4xl shadow-inner animate-pulse">
              <FaShieldAlt />
            </div>
          </div>
          <div className="md:col-span-8 space-y-3">
            <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400 block">PROTOCOLOS HOSPITALARIOS</span>
            <h3 className="text-2xl sm:text-3xl font-serif text-stone-100">Bioseguridad de Nivel Quirúrgico</h3>
            <p className="text-sm text-stone-400 font-light leading-relaxed">
              Tu salud es innegociable. Todo nuestro instrumental de metal pasa por un proceso estricto de tres etapas: desinfección química por inmersión, lavado ultrasónico y esterilización térmica en autoclave de calor seco de grado médico. Los sobres se abren frente a ti.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// COMPONENTE: FOOTER AVANZADO CORPORATIVO
// ============================================
function PremiumFooter() {
  return (
    <footer className="bg-[#090807] text-stone-400 text-sm pt-24 pb-12 border-t border-stone-900 relative z-10">
      <div className="w-full max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-stone-900">
        
        {/* Columna 1: Brand / Manifesto */}
        <div className="space-y-5">
          <h3 className="text-xl font-serif tracking-wide text-stone-100 italic">
            Atelier de Uñas<span className="text-rose-500">.</span>
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed font-light">
            Redefiniendo los límites de la manicura contemporánea. Estética arquitectónica, salud ungueal y exclusividad absoluta en un solo espacio de autor.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a href="#" className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:border-rose-500 transition-colors">
              <FaInstagram className="text-sm" />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:border-rose-500 transition-colors">
              <FaFacebook className="text-sm" />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:border-rose-500 transition-colors">
              <FaWhatsapp className="text-sm" />
            </a>
          </div>
        </div>

        {/* Columna 2: Horarios de Atención Completo */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200">Horarios Atelier</h4>
          <ul className="space-y-2 text-xs font-light">
            <li className="flex justify-between pb-1 border-b border-stone-900">
              <span>Lunes a Viernes</span>
              <span className="text-stone-300">09:00 - 20:00 h</span>
            </li>
            <li className="flex justify-between pb-1 border-b border-stone-900">
              <span>Sábados VIP</span>
              <span className="text-stone-300">09:00 - 18:00 h</span>
            </li>
            <li className="flex justify-between text-rose-400">
              <span>Domingos & Feriados</span>
              <span>Cerrado</span>
            </li>
          </ul>
          <p className="text-[11px] text-stone-600 italic leading-snug">
            * Se requiere reserva previa en la plataforma para asegurar atención personalizada.
          </p>
        </div>

        {/* Columna 3: Enlaces Cruzados Rápidos */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200">Navegación Selecta</h4>
          <ul className="space-y-2 text-xs font-light grid grid-cols-2 gap-2">
            <li><Link href="#servicios" className="hover:text-rose-400 transition-colors">Menú General</Link></li>
            <li><Link href="/reservas" className="hover:text-rose-400 transition-colors">Agendar Cupo</Link></li>
            <li><Link href="/academy" className="hover:text-rose-400 transition-colors">Nail Academy</Link></li>
            <li><Link href="/galeria" className="hover:text-rose-400 transition-colors">Portafolio</Link></li>
            <li><Link href="/staff" className="hover:text-rose-400 transition-colors">El Equipo</Link></li>
            <li><Link href="/contacto" className="hover:text-rose-400 transition-colors">Ubicación</Link></li>
          </ul>
        </div>

        {/* Columna 4: Newsletter Suscripción */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200">Newsletter Concierge</h4>
          <p className="text-xs text-stone-500 leading-relaxed font-light">
            Entérate antes que nadie del lanzamiento de cupos mensuales y workshops internacionales de la academia.
          </p>
          <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Tu correo electrónico premium..." 
              className="w-full bg-stone-900 border border-stone-800 focus:border-rose-500 focus:outline-none text-xs rounded-xl px-4 py-3 text-stone-200 placeholder-stone-600 transition-colors"
            />
            <button className="w-full bg-stone-200 hover:bg-rose-600 text-stone-950 hover:text-white transition-colors duration-300 text-xs font-bold uppercase tracking-widest py-3 rounded-xl">
              SUSCRIBIRME
            </button>
          </form>
        </div>

      </div>

      {/* Copy y Créditos Finales */}
      <div className="w-full max-w-7xl mx-auto px-4 pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-600 font-light gap-4">
        <p>© 2026 Atelier de Uñas de Alta Costura. Todos los derechos reservados.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-stone-400 transition-colors">Políticas de Cancelación</a>
          <a href="#" className="hover:text-stone-400 transition-colors">Términos del Servicio</a>
        </div>
      </div>
    </footer>
  )
}

// ============================================
// PAGINA MAESTRA (HOME ENTRYPOINT)
// ============================================
export default function Home() {
  return (
    <main className="bg-[#0d0b0a] text-stone-300 min-h-screen overflow-x-hidden antialiased selection:bg-rose-500/20 selection:text-rose-300">
      <Header />
      <HeroSection />
      <ServicesSection />
      <AcademySection />
      <TestimonialsSection />
      <HygieneSection />
      <PremiumFooter />
    </main>
  )
}
