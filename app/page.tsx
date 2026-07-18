'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { 
  FaArrowRight, 
  FaQuoteLeft,
  FaCheckCircle,
  FaStar,
  FaGem,
  FaClock,
  FaAward,
  FaInstagram,
  FaFacebook,
  FaWhatsapp,
  FaShieldAlt,
  FaChevronLeft,
  FaChevronRight,
  FaSparkles,
  FaFeather,
  FaPalette,
  FaScissors,
  FaBolt,
  FaRegGem
} from 'react-icons/fa'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useServices, useTestimonials } from '@/hooks/useData'

// ============================================================
// ANIMACIONES GLOBALES
// ============================================================
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
}

const fadeInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] }
  }
}

const fadeInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] }
  }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2
    }
  }
}

// ============================================================
// HERO SECTION - CON IMAGEN DE MICROPIGMENTACIÓN
// ============================================================
function HeroSection() {
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.8], [1, 0.92])
  const y = useTransform(scrollYProgress, [0, 0.8], [0, 80])

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center bg-[#0d0b0a] text-white pt-32 pb-24 overflow-hidden"
    >
      {/* Background con efecto de partículas y gradientes */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-rose-900/15 rounded-full filter blur-[150px] animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-amber-950/15 rounded-full filter blur-[150px] animate-pulse duration-[6000ms]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/5 rounded-full filter blur-[120px] animate-pulse duration-[10000ms]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1c1917_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
      </div>

      {/* Elementos flotantes decorativos */}
      <motion.div 
        className="absolute top-1/4 left-[8%] text-rose-400/10 text-7xl hidden lg:block"
        animate={{ 
          y: [0, -20, 0, 20, 0],
          rotate: [0, 5, 0, -5, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        ✦
      </motion.div>
      <motion.div 
        className="absolute bottom-1/3 right-[5%] text-amber-400/10 text-6xl hidden lg:block"
        animate={{ 
          y: [0, 20, 0, -20, 0],
          rotate: [0, -5, 0, 5, 0]
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      >
        ✦
      </motion.div>

      <motion.div 
        style={{ opacity, scale, y }}
        className="w-full max-w-7xl mx-auto px-4 relative z-10"
      >
        <div className="grid lg:grid-cols-12 gap-12 items-center">

          {/* Texto Hero */}
          <motion.div 
            className="lg:col-span-7 space-y-8"
            initial="hidden"
            animate={mounted ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.div 
              variants={fadeInUp}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/30 px-5 py-2 rounded-full backdrop-blur-md"
            >
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <p className="text-xs uppercase tracking-[0.3em] font-medium bg-gradient-to-r from-amber-200 to-rose-300 bg-clip-text text-transparent">
                ✦ Fresh Nails Salon ✦
              </p>
            </motion.div>

            <motion.h1 
              variants={fadeInUp}
              className="text-5xl sm:text-7xl lg:text-8xl font-extralight tracking-tight leading-[1.05]"
            >
              <span className="text-stone-100">Donde tus manos</span>
              <br />
              <span className="font-serif italic font-normal bg-gradient-to-r from-rose-300 via-amber-200 to-rose-400 bg-clip-text text-transparent">
                se vuelven arte
              </span>
            </motion.h1>

            <motion.p 
              variants={fadeInUp}
              className="text-base sm:text-lg text-stone-400 font-light max-w-xl leading-relaxed"
            >
              Especialistas en manicura combinada y extensiones esculturales. Creamos diseños vanguardistas que fusionan resistencia estructural y estética impecable.
            </motion.p>

            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link 
                href="/reservas" 
                className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 p-[1px] transition-all duration-300 shadow-[0_0_30px_rgba(225,29,72,0.2)] hover:shadow-[0_0_50px_rgba(225,29,72,0.4)]"
              >
                <div className="bg-stone-950 text-white group-hover:bg-transparent px-8 py-4 rounded-[11px] font-medium text-sm tracking-wider transition-colors duration-300 flex items-center justify-center gap-3">
                  RESERVAR CITA
                  <FaArrowRight className="text-xs group-hover:translate-x-1.5 transition-transform duration-300 text-rose-400 group-hover:text-white" />
                </div>
              </Link>
              <Link 
                href="#servicios" 
                className="group bg-stone-900/60 hover:bg-stone-900 border border-stone-800 hover:border-stone-700 px-8 py-4 rounded-xl font-medium text-sm tracking-wider transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                <FaSparkles className="text-amber-400 text-xs group-hover:rotate-180 transition-transform duration-500" />
                VER SERVICIOS
              </Link>
            </motion.div>

            <motion.div 
              variants={fadeInUp}
              className="grid grid-cols-3 gap-6 pt-12 border-t border-stone-900 max-w-md"
            >
              {[
                { number: '100%', label: 'Esterilización Médica', color: 'text-amber-200' },
                { number: 'Técnicas', label: 'Rusas Profesionales', color: 'text-rose-300' },
                { number: '20K+', label: 'Uñas Esculpidas', color: 'text-stone-200' }
              ].map((item, i) => (
                <div key={i}>
                  <p className={`text-2xl font-serif italic ${item.color}`}>{item.number}</p>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">{item.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Imagen Hero con efecto Glassmorphism */}
          <motion.div 
            className="lg:col-span-5 relative"
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={mounted ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative w-full max-w-md mx-auto">
              {/* Marco decorativo */}
              <div className="absolute -top-4 -right-4 w-24 h-24 border border-rose-500/20 rounded-full blur-sm" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 border border-amber-500/20 rounded-full blur-sm" />
              
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-rose-500/10 border border-stone-800 bg-stone-950 group">
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent z-10 opacity-60" />
                
                <motion.img
                  src="https://plus.unsplash.com/premium_photo-1661580887141-7adca5e04c02?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Micropigmentación de cejas - Fresh Nails"
                  className="w-full h-full object-cover transition-transform duration-[12s] ease-out group-hover:scale-110"
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
                />

                {/* Badge flotante */}
                <motion.div 
                  className="absolute bottom-6 left-6 right-6 z-20 bg-stone-900/85 backdrop-blur-xl border border-stone-800 p-5 rounded-2xl shadow-xl"
                  whileHover={{ y: -4, boxShadow: "0 20px 60px rgba(225,29,72,0.15)" }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                      <FaGem className="text-amber-400 animate-pulse duration-[4000ms]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200">Garantía Crystal Gloss</h4>
                      <p className="text-[11px] text-stone-400 font-light mt-0.5">Brillo blindado por hasta 21 días</p>
                    </div>
                  </div>
                </motion.div>

                {/* Badge superior */}
                <div className="absolute top-4 right-4 z-20 bg-rose-600/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white border border-rose-400/30 shadow-lg shadow-rose-500/20">
                  ✦ Micropigmentación
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </section>
  )
}

// ============================================================
// SERVICES SECTION - CON ANIMACIONES ESPECTACULARES
// ============================================================
function ServicesSection() {
  const { data: services } = useServices()
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.6])
  const y = useTransform(scrollYProgress, [0, 0.2], [60, 0])

  const defaultServices = [
    { 
      name: 'Manicura Rusa Combinada & Capping', 
      description: 'Limpieza minuciosa de cutículas con fresas de alta precisión, seguida de un escudo de gel estructural que nivela, unifica y protege el crecimiento biológico.', 
      price: 45, 
      duration: 90, 
      image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&fit=crop&q=80',
      tag: 'Más Solicitado',
      icon: <FaScissors className="text-rose-400" />
    },
    { 
      name: 'Extensiones Esculturales Soft Gel', 
      description: 'Arquitectura completa de la uña utilizando tips de gel preformados y adhesión molecular. Flexibilidad de vanguardia con un grosor natural.', 
      price: 65, 
      duration: 120, 
      image: 'https://images.unsplash.com/photo-1626015713026-d8309cdc91ea?w=600&fit=crop&q=80',
      tag: 'Tendencia',
      icon: <FaFeather className="text-amber-400" />
    },
    { 
      name: 'Nail Art de Autor (Mano Alzada)', 
      description: 'Llevamos tus ideas al lienzo. Diseños geométricos detallados, encapsulados con pan de oro, efectos holográficos avanzados y pedrería fina.', 
      price: 55, 
      duration: 105, 
      image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&fit=crop&q=80',
      tag: 'Estilo Único',
      icon: <FaPalette className="text-purple-400" />
    },
  ]

  const displayServices = services?.length ? services : defaultServices

  return (
    <section 
      ref={sectionRef}
      id="servicios" 
      className="py-32 bg-[#12100e] text-white relative overflow-hidden"
    >
      {/* Elemento decorativo de fondo */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-rose-500/5 rounded-full filter blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-amber-500/5 rounded-full filter blur-[120px]" />

      <motion.div 
        style={{ opacity, y }}
        className="w-full max-w-7xl mx-auto px-4 relative z-10"
      >
        {/* Encabezado */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-3xl mx-auto text-center mb-24 space-y-4"
        >
          <motion.span 
            variants={fadeInUp}
            className="text-xs font-bold tracking-[0.3em] uppercase text-rose-500 bg-rose-500/5 border border-rose-500/20 px-4 py-1.5 rounded-full inline-block"
          >
            ✦ NUESTROS SERVICIOS ✦
          </motion.span>
          <motion.h2 
            variants={fadeInUp}
            className="text-4xl sm:text-5xl font-extralight tracking-tight"
          >
            Tratamientos de <span className="font-serif italic text-amber-200">Fresh Nails</span>
          </motion.h2>
          <motion.div 
            variants={fadeInUp}
            className="h-[2px] w-24 bg-gradient-to-r from-transparent via-rose-500 to-transparent mx-auto mt-4"
          />
        </motion.div>

        {/* Grid de Servicios */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {displayServices.map((service: any, idx: number) => (
            <motion.div
              key={idx}
              variants={scaleIn}
              whileHover={{ 
                y: -12,
                transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
              }}
              className="group bg-gradient-to-b from-[#1a1715] to-[#141211] border border-stone-850 rounded-2xl overflow-hidden transition-all duration-500 hover:border-rose-500/30 hover:shadow-2xl hover:shadow-rose-500/5 flex flex-col justify-between"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-[#1a1715] via-transparent to-transparent z-10"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 0.4 }}
                  transition={{ duration: 0.4 }}
                />
                <motion.img 
                  src={service.image || defaultServices[idx % 3].image} 
                  alt={service.name}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.12 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />

                {/* Badge de categoría */}
                <motion.span 
                  className="absolute top-4 left-4 z-20 bg-stone-950/80 backdrop-blur-md border border-amber-500/30 text-[10px] font-bold text-amber-300 uppercase tracking-widest px-3 py-1 rounded-md"
                  whileHover={{ scale: 1.05, borderColor: "#f59e0b" }}
                >
                  {service.tag || 'Fresh Nails'}
                </motion.span>

                {/* Precio */}
                <motion.div 
                  className="absolute bottom-4 right-4 z-20 bg-gradient-to-br from-rose-600 to-rose-700 font-serif italic text-white text-xl px-4 py-1.5 rounded-xl shadow-lg shadow-black/40"
                  whileHover={{ scale: 1.05 }}
                >
                  ${service.price}
                </motion.div>

                {/* Icono flotante */}
                <div className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/10">
                  {service.icon || <FaRegGem className="text-white/60 text-xs" />}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <motion.h3 
                    className="text-xl font-medium tracking-tight text-stone-100 group-hover:text-rose-400 transition-colors duration-300"
                  >
                    {service.name}
                  </motion.h3>
                  <p className="text-sm text-stone-400 font-light leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-800/60 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-stone-400 font-light">
                    <FaClock className="text-amber-400 text-xs" /> {service.duration || 90} Minutos
                  </span>
                  <Link 
                    href="/reservas" 
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 group-hover:text-white transition-colors duration-300"
                  >
                    AGENDAR CITA <FaArrowRight className="text-[10px] transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Línea decorativa en hover */}
              <motion.div 
                className="h-[2px] bg-gradient-to-r from-rose-500 to-amber-500"
                initial={{ scaleX: 0, originX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}

// ============================================================
// ACADEMY SECTION - CON ANIMACIONES
// ============================================================
function AcademySection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  const masterclasses = [
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
    <section 
      ref={sectionRef}
      className="py-32 bg-[#0d0b0a] text-white relative overflow-hidden border-t border-stone-900"
    >
      {/* Fondo decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#1c1917_0%,transparent_60%)] opacity-30" />
      
      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid lg:grid-cols-12 gap-8 items-center mb-20"
        >
          <motion.div variants={fadeInLeft} className="lg:col-span-6">
            <span className="text-xs font-bold tracking-[0.3em] text-amber-400 block mb-2">✦ FRESH NAILS ACADEMY ✦</span>
            <h2 className="text-4xl sm:text-5xl font-extralight tracking-tight leading-none">
              Perfecciona tu técnica y <br />
              <span className="font-serif italic font-normal text-rose-400">Emprende con Éxito</span>
            </h2>
          </motion.div>
          <motion.div variants={fadeInRight} className="lg:col-span-6">
            <p className="text-stone-400 font-light text-sm sm:text-base leading-relaxed">
              Formamos a profesionales con técnicas actualizadas del mercado. Nuestros programas te dotarán de la precisión y herramientas necesarias para destacar en el sector de la estética de uñas.
            </p>
          </motion.div>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12"
        >
          {masterclasses.map((course, index) => (
            <motion.div 
              key={index} 
              variants={scaleIn}
              whileHover={{ y: -8, transition: { duration: 0.4 } }}
              className="bg-gradient-to-b from-[#141211] to-[#0f0d0c] border border-stone-850 rounded-3xl p-8 md:p-10 transition-all duration-500 group relative overflow-hidden hover:border-rose-500/20 hover:shadow-2xl hover:shadow-rose-500/5"
            >
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

                <div className="space-y-3 pt-4 border-t border-stone-850">
                  <p className="text-xs font-bold uppercase text-stone-400 tracking-wider flex items-center gap-2">
                    <FaAward className="text-amber-400" /> Contenido del Curso:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.perks.map((perk, pIdx) => (
                      <motion.div 
                        key={pIdx} 
                        className="flex items-center gap-2 text-xs text-stone-300 font-light"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + pIdx * 0.08 }}
                        viewport={{ once: true }}
                      >
                        <FaCheckCircle className="text-rose-500 text-[10px] flex-shrink-0" />
                        <span>{perk}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <span className="text-xs text-stone-400 flex items-center gap-2 bg-stone-900 px-4 py-2 rounded-xl border border-stone-800">
                    ⏱️ <strong className="text-stone-200">{course.duration}</strong>
                  </span>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link 
                      href="/academy" 
                      className="bg-stone-100 text-stone-950 hover:bg-gradient-to-r hover:from-rose-600 hover:to-amber-600 hover:text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 text-center block"
                    >
                      CONSULTAR INFORMACIÓN
                    </Link>
                  </motion.div>
                </div>
              </div>

              {/* Brillo decorativo */}
              <div className="absolute -top-40 -right-40 w-60 h-60 bg-rose-500/5 rounded-full filter blur-[80px] group-hover:opacity-100 opacity-0 transition-opacity duration-700" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================
// TESTIMONIALS SECTION - CON SLIDER ANIMADO
// ============================================================
function TestimonialsSection() {
  const { data: testimonials } = useTestimonials()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const defaultTestimonials = [
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

  const items = testimonials?.length ? testimonials : defaultTestimonials

  const nextSlide = () => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }

  const prevSlide = () => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.92
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.92,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    })
  }

  return (
    <section className="py-32 bg-[#12100e] text-white border-t border-stone-900 relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-purple-500/5 rounded-full filter blur-[100px]" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-rose-500/5 rounded-full filter blur-[100px]" />

      <div className="w-full max-w-4xl mx-auto px-4 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="text-center mb-16 space-y-2"
        >
          <motion.span variants={fadeInUp} className="text-xs font-bold tracking-[0.25em] text-rose-500 uppercase block">
            ✦ TESTIMONIOS ✦
          </motion.span>
          <motion.h2 variants={fadeInUp} className="text-4xl font-extralight tracking-tight">
            Lo que dicen <span className="font-serif italic text-amber-200">nuestras clientas</span>
          </motion.h2>
        </motion.div>

        <div className="relative bg-gradient-to-b from-[#1a1715] to-[#141211] border border-stone-850 rounded-3xl p-8 md:p-16 text-center shadow-2xl min-h-[340px] flex flex-col justify-center overflow-hidden">
          <FaQuoteLeft className="text-stone-800 text-6xl absolute top-8 left-8 opacity-40 pointer-events-none" />

          {/* Indicadores de posición */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > currentIndex ? 1 : -1)
                  setCurrentIndex(i)
                }}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentIndex 
                    ? 'w-6 bg-gradient-to-r from-rose-500 to-amber-500' 
                    : 'w-3 bg-stone-700 hover:bg-stone-500'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div 
              key={currentIndex} 
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-6"
            >
              <p className="text-lg md:text-xl text-stone-300 font-light leading-relaxed italic">
                "{items[currentIndex]?.comment}"
              </p>

              <div className="pt-4 flex flex-col items-center">
                <span className="text-sm font-semibold text-stone-100 tracking-wide">
                  {items[currentIndex]?.name}
                </span>
                <span className="text-[10px] uppercase font-bold text-rose-400 tracking-widest mt-1 bg-rose-500/5 border border-rose-500/10 px-2.5 py-0.5 rounded">
                  {items[currentIndex]?.service || 'Clienta'}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Botones de navegación */}
          <motion.button 
            onClick={prevSlide} 
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 hover:border-rose-500 text-stone-400 hover:text-white transition-all duration-300 flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaChevronLeft className="text-xs" />
          </motion.button>
          <motion.button 
            onClick={nextSlide} 
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 hover:border-rose-500 text-stone-400 hover:text-white transition-all duration-300 flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaChevronRight className="text-xs" />
          </motion.button>

          {/* Estrellas decorativas */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 text-amber-400/30 text-[8px]">
            {[...Array(5)].map((_, i) => (
              <FaStar key={i} className={i < Math.round(items[currentIndex]?.rating || 5) ? 'text-amber-400/50' : ''} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// HYGIENE SECTION
// ============================================================
function HygieneSection() {
  return (
    <section className="py-24 bg-[#0d0b0a] text-white border-t border-stone-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,#1c1917_0%,transparent_60%)] opacity-30" />
      
      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="bg-gradient-to-r from-[#141211] to-[#1e1917] border border-stone-850 rounded-3xl p-8 md:p-12 grid md:grid-cols-12 gap-8 items-center"
        >
          <motion.div 
            variants={scaleIn}
            className="md:col-span-4 flex justify-center md:justify-start"
          >
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/10 to-rose-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-4xl shadow-inner">
              <FaShieldAlt className="animate-pulse duration-[4000ms]" />
            </div>
          </motion.div>
          <motion.div variants={fadeInRight} className="md:col-span-8 space-y-3">
            <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400 block">✦ PROTOCOLOS DE HIGIENE ✦</span>
            <h3 className="text-2xl sm:text-3xl font-serif text-stone-100">Bioseguridad y Cuidado Integral</h3>
            <p className="text-sm text-stone-400 font-light leading-relaxed">
              Tu bienestar es nuestra prioridad. Todo nuestro instrumental metálico pasa por un proceso riguroso de tres etapas: desinfección por inmersión, lavado ultrasónico y esterilización térmica en autoclave. Los sobres esterilizados se abren en tu presencia al iniciar la sesión.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================
// FOOTER PREMIUM
// ============================================================
function PremiumFooter() {
  return (
    <footer className="bg-[#090807] text-stone-400 text-sm pt-24 pb-12 border-t border-stone-900 relative z-10">
      <div className="w-full max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-stone-900">

        <div className="space-y-5">
          <h3 className="text-xl font-serif tracking-wide text-stone-100 italic">
            Salon Fresh Nails<span className="text-rose-500">.</span>
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed font-light">
            Redefiniendo el cuidado y la estética de tus uñas. Salud ungueal, diseños actuales y atención personalizada en un espacio diseñado para ti.
          </p>
          <div className="flex items-center gap-3 pt-2">
            {[
              { icon: <FaInstagram className="text-sm" />, href: "https://www.instagram.com/freshnails46" },
              { icon: <FaFacebook className="text-sm" />, href: "#" },
              { icon: <FaWhatsapp className="text-sm" />, href: "#" }
            ].map((social, i) => (
              <motion.a 
                key={i}
                href={social.href} 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:border-rose-500 transition-colors"
                whileHover={{ y: -3, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {social.icon}
              </motion.a>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200">Horarios del Salón</h4>
          <ul className="space-y-2 text-xs font-light">
            <li className="flex justify-between pb-1 border-b border-stone-900">
              <span>Lunes a Viernes</span>
              <span className="text-stone-300">09:00 - 20:00 h</span>
            </li>
            <li className="flex justify-between pb-1 border-b border-stone-900">
              <span>Sábados</span>
              <span className="text-stone-300">09:00 - 18:00 h</span>
            </li>
            <li className="flex justify-between text-rose-400">
              <span>Domingos & Feriados</span>
              <span>Cerrado</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200">Navegación</h4>
          <ul className="space-y-2 text-xs font-light grid grid-cols-2 gap-2">
            <li><Link href="#servicios" className="hover:text-rose-400 transition-colors">Menú</Link></li>
            <li><Link href="/reservas" className="hover:text-rose-400 transition-colors">Reservar</Link></li>
            <li><Link href="/academy" className="hover:text-rose-400 transition-colors">Academia</Link></li>
            <li><Link href="/contacto" className="hover:text-rose-400 transition-colors">Contacto</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200">Novedades</h4>
          <p className="text-xs text-stone-500 leading-relaxed font-light">
            Recibe información sobre la apertura de agendas mensuales y nuevos talleres prácticos de la academia.
          </p>
          <motion.form 
            className="space-y-2" 
            onSubmit={(e) => e.preventDefault()}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.3 }}
          >
            <input 
              type="email" 
              placeholder="Tu correo electrónico..." 
              className="w-full bg-stone-900 border border-stone-800 focus:border-rose-500 focus:outline-none text-xs rounded-xl px-4 py-3 text-stone-200 placeholder-stone-600 transition-colors"
            />
            <motion.button 
              className="w-full bg-stone-200 hover:bg-gradient-to-r hover:from-rose-600 hover:to-amber-600 text-stone-950 hover:text-white transition-all duration-300 text-xs font-bold uppercase tracking-widest py-3 rounded-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              SUSCRIBIRME
            </motion.button>
          </motion.form>
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
}

// ============================================================
// MAIN - PÁGINA PRINCIPAL
// ============================================================
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