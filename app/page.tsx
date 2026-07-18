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
  FaChevronRight,
  FaSparkles,
  FaPlay,
  FaPause
} from 'react-icons/fa'

// ============================================================
// COLORES DE LA MARCA
// ============================================================
const COLORS = {
  gold: '#C9A96E',
  pink: '#DB5B9A',
  copper: '#E5A46E',
  pinkDark: '#C43A7A',
}

// ============================================================
// HERO SECTION - COMPONENTE SIMPLE
// ============================================================
function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const heroImages = [
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&fit=crop&q=90',
    'https://images.unsplash.com/photo-1626015713026-d8309cdc91ea?w=800&fit=crop&q=90',
    'https://plus.unsplash.com/premium_photo-1661580887141-7adca5e04c02?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#0d0b0a] text-white pt-32 pb-24 overflow-hidden">
      {/* Fondo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full filter blur-[150px] animate-pulse" style={{ background: `${COLORS.pink}15` }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full filter blur-[150px] animate-pulse" style={{ background: `${COLORS.gold}15` }} />
        <div className="absolute inset-0 bg-[radial-gradient(#1c1917_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">

          {/* Texto */}
          <div className="lg:col-span-6 space-y-8">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#C9A96E]/10 to-[#DB5B9A]/10 border border-[#C9A96E]/30 px-5 py-2 rounded-full backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-[#C9A96E] animate-ping" />
              <p className="text-xs uppercase tracking-[0.3em] font-medium" style={{ color: COLORS.gold }}>
                ✦ Fresh Nails Salon ✦
              </p>
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extralight tracking-tight leading-[1.05]">
              <span className="text-stone-100">Donde tus manos</span>
              <br />
              <span className="font-serif italic font-normal" style={{ background: `linear-gradient(to right, ${COLORS.pink}, ${COLORS.gold}, ${COLORS.copper})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                se vuelven arte
              </span>
            </h1>

            <p className="text-base sm:text-lg text-stone-400 font-light max-w-xl leading-relaxed">
              Especialistas en manicura combinada y extensiones esculturales.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                href="/reservas" 
                className="relative group overflow-hidden rounded-xl p-[1px] transition-all duration-300"
                style={{ background: `linear-gradient(to right, ${COLORS.pink}, ${COLORS.gold})` }}
              >
                <div className="bg-[#0d0b0a] text-white group-hover:bg-transparent px-8 py-4 rounded-[11px] font-medium text-sm tracking-wider transition-colors duration-300 flex items-center justify-center gap-3">
                  RESERVAR CITA
                  <FaArrowRight className="text-xs group-hover:translate-x-1.5 transition-transform duration-300" style={{ color: COLORS.gold }} />
                </div>
              </Link>
              <Link 
                href="#servicios" 
                className="group bg-stone-900/60 hover:bg-stone-900 border border-stone-800 hover:border-[#C9A96E] px-8 py-4 rounded-xl font-medium text-sm tracking-wider transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                <FaSparkles className="text-xs group-hover:rotate-180 transition-transform duration-500" style={{ color: COLORS.gold }} />
                VER SERVICIOS
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-12 border-t border-stone-900 max-w-md">
              {[
                { number: '100%', label: 'Esterilización Médica', color: COLORS.gold },
                { number: 'Técnicas', label: 'Rusas Profesionales', color: COLORS.pink },
                { number: '20K+', label: 'Uñas Esculpidas', color: COLORS.copper }
              ].map((item, i) => (
                <div key={i}>
                  <p className="text-2xl font-serif italic" style={{ color: item.color }}>{item.number}</p>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Carrusel */}
          <div className="lg:col-span-6 relative">
            <div className="relative w-full max-w-md mx-auto aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-stone-800">
              {heroImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    idx === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img src={img} alt="Fresh Nails" className="w-full h-full object-cover" />
                </div>
              ))}

              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b0a] via-transparent to-transparent opacity-60" />

              {/* Badge */}
              <div className="absolute bottom-6 left-6 right-6 z-20 bg-[#0d0b0a]/85 backdrop-blur-xl border border-[#C9A96E]/30 p-5 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl border border-[#C9A96E]/30 flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, ${COLORS.pink}20, ${COLORS.gold}20)` }}>
                    <FaGem className="animate-pulse" style={{ color: COLORS.gold }} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200">Garantía Crystal Gloss</h4>
                    <p className="text-[11px] text-stone-400 font-light mt-0.5">Brillo blindado por hasta 21 días</p>
                  </div>
                </div>
              </div>

              {/* Indicadores */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {heroImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === currentSlide ? 'w-6' : 'w-3 bg-stone-700 hover:bg-stone-500'
                    }`}
                    style={i === currentSlide ? { background: `linear-gradient(to right, ${COLORS.pink}, ${COLORS.gold})` } : {}}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

// ============================================================
// GALERÍA DESTACADA
// ============================================================
function FeaturedGallery() {
  const images = [
    { url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&fit=crop&q=90', title: 'Manicura Rusa' },
    { url: 'https://images.unsplash.com/photo-1626015713026-d8309cdc91ea?w=800&fit=crop&q=90', title: 'Extensiones Soft Gel' },
    { url: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800&fit=crop&q=90', title: 'Nail Art' },
    { url: 'https://plus.unsplash.com/premium_photo-1661580887141-7adca5e04c02?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', title: 'Micropigmentación' },
  ]

  return (
    <section className="py-24 bg-[#0d0b0a]">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-[0.3em] uppercase inline-block px-4 py-1.5 rounded-full border border-[#C9A96E]/20" style={{ color: COLORS.gold }}>
            ✦ GALERÍA DESTACADA ✦
          </span>
          <h2 className="text-4xl sm:text-5xl font-extralight tracking-tight mt-4">
            Nuestros <span className="font-serif italic" style={{ color: COLORS.pink }}>trabajos</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group">
              <img src={img.url} alt={img.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h4 className="text-white text-sm font-medium">{img.title}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================
// SERVICIOS
// ============================================================
function ServicesSection() {
  const services = [
    { name: 'Manicura Rusa Combinada', price: 45, duration: 90, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&fit=crop&q=80' },
    { name: 'Extensiones Soft Gel', price: 65, duration: 120, image: 'https://images.unsplash.com/photo-1626015713026-d8309cdc91ea?w=600&fit=crop&q=80' },
    { name: 'Nail Art de Autor', price: 55, duration: 105, image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&fit=crop&q=80' },
  ]

  return (
    <section id="servicios" className="py-32 bg-[#12100e] text-white">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-24">
          <span className="text-xs font-bold tracking-[0.3em] uppercase inline-block px-4 py-1.5 rounded-full border border-[#C9A96E]/20" style={{ color: COLORS.gold }}>
            ✦ NUESTROS SERVICIOS ✦
          </span>
          <h2 className="text-4xl sm:text-5xl font-extralight tracking-tight mt-4">
            Tratamientos <span className="font-serif italic" style={{ color: COLORS.pink }}>Fresh Nails</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <div key={idx} className="group bg-[#1a1715] border border-stone-800 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:border-[#C9A96E]/30">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={service.image} alt={service.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute bottom-4 right-4 bg-gradient-to-br from-[#DB5B9A] to-[#C43A7A] text-white text-xl font-serif italic px-4 py-1.5 rounded-xl">
                  ${service.price}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium text-stone-100 group-hover:text-[#DB5B9A] transition-colors">{service.name}</h3>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-800">
                  <span className="flex items-center gap-1.5 text-xs text-stone-400">
                    <FaClock style={{ color: COLORS.gold }} /> {service.duration} Min
                  </span>
                  <Link href="/reservas" className="text-xs font-bold" style={{ color: COLORS.pink }}>
                    AGENDAR →
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

// ============================================================
// TESTIMONIOS
// ============================================================
function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const testimonials = [
    { comment: "La precisión de la manicura rusa aquí es excelente. ¡Súper recomendable!", name: "Valeria Mendoza", service: "Manicura Rusa" },
    { comment: "Hice el curso en la academia y realmente impulsó mi trabajo.", name: "Agustina Silva", service: "Alumna" },
    { comment: "Un lugar con un gusto excelente. No cambio este salón por ningún otro.", name: "Carolina Rostagnol", service: "Nail Art" }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-32 bg-[#12100e] text-white border-t border-stone-900">
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: COLORS.pink }}>✦ TESTIMONIOS ✦</span>
          <h2 className="text-4xl font-extralight tracking-tight mt-2">
            Lo que dicen <span className="font-serif italic" style={{ color: COLORS.gold }}>nuestras clientas</span>
          </h2>
        </div>

        <div className="relative bg-[#1a1715] border border-stone-800 rounded-3xl p-12 text-center min-h-[300px] flex flex-col justify-center">
          <FaQuoteLeft className="text-stone-700 text-5xl absolute top-6 left-6 opacity-40" />

          <div className="space-y-6 transition-all duration-500">
            <p className="text-lg md:text-xl text-stone-300 font-light italic">
              "{testimonials[currentIndex].comment}"
            </p>
            <div>
              <p className="font-semibold text-stone-100">{testimonials[currentIndex].name}</p>
              <p className="text-xs text-[#C9A96E] mt-1">{testimonials[currentIndex].service}</p>
            </div>
          </div>

          {/* Controles */}
          <button onClick={() => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)} 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-stone-800 border border-stone-700 hover:border-[#C9A96E] text-stone-400 hover:text-white transition-all flex items-center justify-center">
            <FaChevronLeft className="text-xs" />
          </button>
          <button onClick={() => setCurrentIndex((prev) => (prev + 1) % testimonials.length)} 
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-stone-800 border border-stone-700 hover:border-[#C9A96E] text-stone-400 hover:text-white transition-all flex items-center justify-center">
            <FaChevronRight className="text-xs" />
          </button>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// HIGIENE
// ============================================================
function HygieneSection() {
  return (
    <section className="py-24 bg-[#0d0b0a] text-white border-t border-stone-900">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="bg-[#141211] border border-stone-800 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 rounded-2xl border border-[#C9A96E]/30 flex items-center justify-center text-4xl" style={{ background: `${COLORS.pink}10` }}>
            <FaShieldAlt style={{ color: COLORS.gold }} />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: COLORS.gold }}>✦ PROTOCOLOS DE HIGIENE ✦</span>
            <h3 className="text-2xl font-serif text-stone-100 mt-1">Bioseguridad y Cuidado Integral</h3>
            <p className="text-sm text-stone-400 font-light mt-2">
              Todo nuestro instrumental pasa por un proceso riguroso de tres etapas: desinfección, lavado ultrasónico y esterilización en autoclave.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// FOOTER
// ============================================================
function Footer() {
  return (
    <footer className="bg-[#090807] text-stone-400 text-sm pt-16 pb-8 border-t border-stone-900">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-stone-900">
          <div>
            <h3 className="text-xl font-serif text-stone-100">Fresh Nails<span style={{ color: COLORS.pink }}>.</span></h3>
            <p className="text-xs text-stone-500 mt-2">Redefiniendo el cuidado de tus uñas.</p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200">Horarios</h4>
            <ul className="text-xs space-y-1 mt-2">
              <li>Lun-Vie: 09:00 - 20:00</li>
              <li>Sáb: 09:00 - 18:00</li>
              <li style={{ color: COLORS.pink }}>Dom: Cerrado</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200">Enlaces</h4>
            <ul className="text-xs space-y-1 mt-2">
              <li><Link href="#servicios" className="hover:text-[#C9A96E]">Servicios</Link></li>
              <li><Link href="/reservas" className="hover:text-[#C9A96E]">Reservar</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200">Síguenos</h4>
            <div className="flex gap-3 mt-2">
              <a href="#" className="hover:text-[#C9A96E]"><FaInstagram /></a>
              <a href="#" className="hover:text-[#C9A96E]"><FaFacebook /></a>
              <a href="#" className="hover:text-[#C9A96E]"><FaWhatsapp /></a>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-stone-600 text-center mt-6">© 2026 Fresh Nails. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}

// ============================================================
// MAIN - COMPONENTE PRINCIPAL
// ============================================================
export default function Home() {
  // Importamos Header y Footer de forma segura con try/catch
  const [HeaderComponent, setHeaderComponent] = useState<any>(null)
  const [FooterComponent, setFooterComponent] = useState<any>(null)

  useEffect(() => {
    try {
      // Intentamos importar los componentes
      import('@/components/Header').then(mod => {
        setHeaderComponent(() => mod.default || mod.Header)
      }).catch(() => {
        // Si falla, usamos un Header simple
        setHeaderComponent(() => function SimpleHeader() {
          return (
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d0b0a]/90 backdrop-blur-md border-b border-stone-900 px-4 py-3">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <span className="text-white font-serif text-lg">Fresh Nails</span>
                <nav className="flex gap-6 text-xs text-stone-400">
                  <Link href="#servicios" className="hover:text-[#C9A96E]">Servicios</Link>
                  <Link href="/reservas" className="hover:text-[#C9A96E]">Reservar</Link>
                </nav>
              </div>
            </header>
          )
        })
      })

      import('@/components/Footer').then(mod => {
        setFooterComponent(() => mod.default || mod.Footer)
      }).catch(() => {
        // Si falla, usamos un Footer simple
        setFooterComponent(() => function SimpleFooter() {
          return <Footer />
        })
      })
    } catch (e) {
      console.log('Error loading components, using fallbacks')
    }
  }, [])

  const Header = HeaderComponent || (() => null)
  const FooterComp = FooterComponent || (() => null)

  return (
    <main className="bg-[#0d0b0a] text-stone-300 min-h-screen overflow-x-hidden">
      <Header />
      <HeroSection />
      <FeaturedGallery />
      <ServicesSection />
      <TestimonialsSection />
      <HygieneSection />
      <FooterComp />
    </main>
  )
}