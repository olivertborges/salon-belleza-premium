'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  FaChevronRight
} from 'react-icons/fa'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useServices, useTestimonials } from '@/hooks/useData'

function HeroSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#0d0b0a] text-white pt-32 pb-24 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-rose-900/20 rounded-full filter blur-[120px] animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-amber-950/20 rounded-full filter blur-[120px] animate-pulse duration-[6000ms]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1c1917_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">

          <div className={`lg:col-span-7 space-y-8 transition-all duration-1000 transform ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/30 px-4 py-1.5 rounded-full backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <p className="text-xs uppercase tracking-[0.25em] font-medium bg-gradient-to-r from-amber-200 to-rose-300 bg-clip-text text-transparent">
                Salon Fresh Nails
              </p>
            </div>

            <h1 className="text-5xl sm:text-7xl font-extralight tracking-tight leading-[1.05] text-stone-100">
              Donde tus manos <br />
              <span className="font-serif italic font-normal text-gradient bg-gradient-to-r from-rose-300 via-amber-200 to-rose-400 bg-clip-text text-transparent">
                se vuelven obras
              </span > <br />
              de arte.
            </h1>

            <p className="text-base sm:text-lg text-stone-400 font-light max-w-xl leading-relaxed">
              Especialistas en manicura combinada y extensiones esculturales. Creamos diseños vanguardistas que fusionan resistencia estructural y estética impecable.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/reservas" className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 p-[1px] transition-all duration-300 shadow-[0_0_30px_rgba(225,29,72,0.2)] hover:shadow-[0_0_40px_rgba(225,29,72,0.4)]">
                <div className="bg-stone-950 text-white group-hover:bg-transparent px-8 py-4 rounded-[11px] font-medium text-sm tracking-wider transition-colors duration-300 flex items-center justify-center gap-3">
                  RESERVAR CITA
                  <FaArrowRight className="text-xs group-hover:translate-x-1.5 transition-transform duration-300 text-rose-400 group-hover:text-white" />
                </div>
              </Link>
              <Link href="#servicios" className="group bg-stone-900/60 hover:bg-stone-900 border border-stone-800 hover:border-stone-700 px-8 py-4 rounded-xl font-medium text-sm tracking-wider transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm">
                VER SERVICIOS
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-12 border-t border-stone-900 max-w-md">
              <div>
                <p className="text-2xl font-serif italic text-amber-200">100%</p>
                <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">Esterilización Médica</p>
              </div>
              <div>
                <p className="text-2xl font-serif italic text-rose-300">Técnicas</p>
                <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">Rusas Profesionales</p>
              </div>
              <div>
                <p className="text-2xl font-serif italic text-stone-200">20k+</p>
                <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">Uñas Esculpidas</p>
              </div>
            </div>
          </div>

          <div className={`lg:col-span-5 relative transition-all duration-1000 delay-300 transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="relative w-full max-w-md mx-auto aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-stone-800 bg-stone-950 group">
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent z-10 opacity-60" />
              <img
                src="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&fit=crop&q=90"
                alt="Manicura en exposición"
                className="w-full h-full object-cover transition-transform duration-[10s] ease-out group-hover:scale-110"
              />

              <div className="absolute bottom-6 left-6 right-6 z-20 bg-stone-900/85 backdrop-blur-xl border border-stone-800 p-5 rounded-2xl shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <FaGem className="animate-spin duration-[4000ms]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200">Garantía Crystal Gloss</h4>
                    <p className="text-[11px] text-stone-400 font-light mt-0.5">Brillo de alta duración blindado por hasta 21 días completos.</p>
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

function ServicesSection() {
  const { data: services } = useServices()

  const defaultServices = [
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
      image: 'https://images.unsplash.com/photo-1626015713026-d8309cdc91ea?w=600&fit=crop&q=80',
      tag: 'Tendencia'
    },
    { 
      name: 'Nail Art de Autor (Mano Alzada)', 
      description: 'Llevamos tus ideas al lienzo. Diseños geométricos detallados, encapsulados con pan de oro, efectos holográficos avanzados y pedrería fina.', 
      price: 55, 
      duration: 105, 
      image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&fit=crop&q=80',
      tag: 'Estilo Único'
    },
  ]

  const displayServices = services?.length ? services : defaultServices

  return (
    <section id="servicios" className="py-32 bg-[#12100e] text-white relative">
      <div className="w-full max-w-7xl mx-auto px-4">

        <div className="max-w-3xl mx-auto text-center mb-24 space-y-4">
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-rose-500 bg-rose-500/5 border border-rose-500/20 px-4 py-1.5 rounded-full inline-block">
            NUESTROS SERVICIOS
          </span>
          <h2 className="text-4xl sm:text-5xl font-extralight tracking-tight">
            Tratamientos de <span className="font-serif italic text-amber-200">Fresh Nails</span>
          </h2>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-rose-500 to-transparent mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayServices.map((service: any, idx: number) => (
            <div
              key={idx}
              className="group bg-[#1a1715] border border-stone-850 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-3 flex flex-col justify-between"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1715] via-transparent to-transparent z-10" />
                <img 
                  src={service.image || defaultServices[idx % 3].image} 
                  alt={service.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />

                <span className="absolute top-4 left-4 z-20 bg-stone-950/80 backdrop-blur-md border border-amber-500/30 text-[10px] font-bold text-amber-300 uppercase tracking-widest px-3 py-1 rounded-md">
                  {service.tag || 'Fresh Nails'}
                </span>

                <div className="absolute bottom-4 right-4 z-20 bg-rose-600 font-serif italic text-white text-xl px-4 py-1.5 rounded-xl shadow-lg shadow-black/40">
                  ${service.price}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xl font-medium tracking-tight text-stone-100 group-hover:text-rose-400 transition-colors duration-300">
                    {service.name}
                  </h3>
                  <p className="text-sm text-stone-400 font-light leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-800/60 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-stone-400 font-light">
                    <FaClock className="text-amber-400 text-xs" /> {service.duration || 90} Minutos
                  </span>
                  <Link href="/reservas" className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 group-hover:text-white transition-colors duration-300">
                    AGENDAR CITA <FaArrowRight className="text-[10px] transform group-hover:translate-x-1 transition-transform" />
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

function AcademySection() {
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
    <section className="py-32 bg-[#0d0b0a] text-white relative overflow-hidden border-t border-stone-900">
      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">

        <div className="grid lg:grid-cols-12 gap-8 items-center mb-20">
          <div className="lg:col-span-6">
            <span className="text-xs font-bold tracking-[0.3em] text-amber-400 block mb-2">FRESH NAILS ACADEMY</span>
            <h2 className="text-4xl sm:text-5xl font-extralight tracking-tight leading-none">
              Perfecciona tu técnica y <br />
              <span className="font-serif italic font-normal text-rose-400">Emprende con Éxito</span>
            </h2>
          </div>
          <div className="lg:col-span-6">
            <p className="text-stone-400 font-light text-sm sm:text-base leading-relaxed">
              Formamos a profesionales con técnicas actualizadas del mercado. Nuestros programas te dotarán de la precisión y herramientas necesarias para destacar en el sector de la estética de uñas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {masterclasses.map((course, index) => (
            <div 
              key={index} 
              className="bg-[#141211] border border-stone-850 rounded-3xl p-8 md:p-10 transition-all duration-500 group relative overflow-hidden"
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
                      <div key={pIdx} className="flex items-center gap-2 text-xs text-stone-300 font-light">
                        <FaCheckCircle className="text-rose-500 text-[10px] flex-shrink-0" />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <span className="text-xs text-stone-400 flex items-center gap-2 bg-stone-900 px-4 py-2 rounded-xl border border-stone-800">
                    ⏱️ <strong className="text-stone-200">{course.duration}</strong>
                  </span>
                  <Link href="/academy" className="bg-stone-100 text-stone-950 hover:bg-rose-500 hover:text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 text-center">
                    CONSULTAR INFORMACIÓN
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

function TestimonialsSection() {
  const { data: testimonials } = useTestimonials()
  const [currentIndex, setCurrentIndex] = useState(0)

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

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % items.length)
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)

  return (
    <section className="py-32 bg-[#12100e] text-white border-t border-stone-900">
      <div className="w-full max-w-4xl mx-auto px-4">

        <div className="text-center mb-16 space-y-2">
          <span className="text-xs font-bold tracking-[0.25em] text-rose-500 uppercase">TESTIMONIOS</span>
          <h2 className="text-4xl font-extralight tracking-tight">Lo que dicen <span className="font-serif italic text-amber-200">nuestras clientas</span></h2>
        </div>

        <div className="relative bg-[#1a1715] border border-stone-850 rounded-3xl p-8 md:p-16 text-center shadow-2xl min-h-[340px] flex flex-col justify-center">
          <FaQuoteLeft className="text-stone-800 text-6xl absolute top-8 left-8 opacity-40 pointer-events-none" />

          <div key={currentIndex} className="animate-fade-in space-y-6 transition-all duration-500">
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
          </div>

          <div className="absolute inset-y-0 -left-4 md:-left-6 flex items-center">
            <button onClick={prevSlide} className="w-12 h-12 rounded-xl bg-stone-900 border border-stone-800 hover:border-rose-500 text-stone-400 hover:text-white transition-all duration-300 flex items-center justify-center">
              <FaChevronLeft className="text-xs" />
            </button>
          </div>
          <div className="absolute inset-y-0 -right-4 md:-right-6 flex items-center">
            <button onClick={nextSlide} className="w-12 h-12 rounded-xl bg-stone-900 border border-stone-800 hover:border-rose-500 text-stone-400 hover:text-white transition-all duration-300 flex items-center justify-center">
              <FaChevronRight className="text-xs" />
            </button>
          </div>

        </div>

      </div>
    </section>
  )
}

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
            <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400 block">PROTOCOLOS DE HIGIENE</span>
            <h3 className="text-2xl sm:text-3xl font-serif text-stone-100">Bioseguridad y Cuidado Integral</h3>
            <p className="text-sm text-stone-400 font-light leading-relaxed">
              Tu bienestar es nuestra prioridad. Todo nuestro instrumental metálico pasa por un proceso riguroso de tres etapas: desinfección por inmersión, lavado ultrasónico y esterilización térmica en autoclave. Los sobres esterilizados se abren en tu presencia al iniciar la sesión.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

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
            <a href="https://www.instagram.com/freshnails46" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:border-rose-500 transition-colors">
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
          <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Tu correo electrónico..." 
              className="w-full bg-stone-900 border border-stone-800 focus:border-rose-500 focus:outline-none text-xs rounded-xl px-4 py-3 text-stone-200 placeholder-stone-600 transition-colors"
            />
            <button className="w-full bg-stone-200 hover:bg-rose-600 text-stone-950 hover:text-white transition-colors duration-300 text-xs font-bold uppercase tracking-widest py-3 rounded-xl">
              SUSCRIBIRME
            </button>
          </form>
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
