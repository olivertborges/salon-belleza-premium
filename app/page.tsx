'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  FaWhatsapp, 
  FaCalendarAlt, 
  FaCut, 
  FaMagic, 
  FaGem, 
  FaStar,
  FaArrowRight, 
  FaBars, 
  FaTimes, 
  FaInstagram, 
  FaFacebook, 
  FaYoutube, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaClock, 
  FaUsers, 
  FaRobot,
  FaQuoteLeft, 
  FaChevronLeft, 
  FaChevronRight,
  FaShieldAlt, 
  FaPalette,
  FaBrush,
  FaEye
} from 'react-icons/fa'

import { 
  useServices, 
  useStaff, 
  useTestimonials, 
  useGallery
} from '@/hooks/useData'

// ============================================
// HEADER (Mobile-First)
// ============================================
function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Servicios', href: '/servicios' },
    { label: 'Staff', href: '/staff' },
    { label: 'Clientes', href: '/clientes' },
    { label: 'Contacto', href: '/contacto' }
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-4'
    }`}>
      <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-rose-400 to-amber-400 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
            S
          </div>
          <div>
            <h1 className="text-base font-light tracking-wider text-gray-800 leading-none">
              SALON <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">PREMIUM</span>
            </h1>
            <p className="text-[8px] text-gray-400 tracking-[0.2em] uppercase mt-0.5">Beauty & Aesthetics</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="text-xs font-medium text-gray-600 hover:text-rose-500 transition-colors tracking-wider uppercase">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
            <FaWhatsapp /> WhatsApp
          </a>
          <Link href="/reservas" className="bg-gradient-to-r from-rose-400 to-amber-400 text-white px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
            <FaCalendarAlt /> Reservar
          </Link>
        </div>

        <button className="lg:hidden text-xl text-gray-700 w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl active:scale-90 transition-transform" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden fixed inset-x-4 top-16 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl p-5 border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="text-gray-700 hover:text-rose-500 py-2.5 px-3 hover:bg-slate-50 rounded-xl font-medium text-sm flex items-center justify-between" onClick={() => setIsMenuOpen(false)}>
                {item.label} <FaArrowRight className="text-[10px] text-gray-300" />
              </Link>
            ))}
            <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-gray-100">
              <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="w-full bg-emerald-500 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-xs shadow-sm">
                <FaWhatsapp /> WhatsApp
              </a>
              <Link href="/reservas" onClick={() => setIsMenuOpen(false)} className="w-full bg-gradient-to-r from-rose-400 to-amber-400 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-xs shadow-sm text-center">
                <FaCalendarAlt /> Reservar ahora
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

// ============================================
// HERO SECTION (Fijo sin desbordamiento)
// ============================================
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-50 via-white to-rose-50/20 pt-24 pb-12 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-200/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10 items-center">
          
          <div className="text-center lg:text-left order-2 lg:order-1 w-full max-w-md mx-auto lg:max-w-none">
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200/60 px-4 py-1.5 rounded-full text-[11px] font-medium mb-5 text-gray-600 shadow-sm">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Especialistas en Estética Avanzada
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light leading-tight mb-4 tracking-tight">
              <span className="text-gray-800">Donde la</span>{' '}
              <span className="font-bold bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400 text-transparent bg-clip-text">
                Belleza
              </span>
              <br />
              <span className="text-gray-700">encuentra el</span>{' '}
              <span className="font-bold text-gray-800">Arte</span>
            </h1>

            <p className="text-sm sm:text-base text-gray-500 mb-6 leading-relaxed font-light">
              Expertos en micropigmentación, microblading y uñas. Resultados que hablan por sí mismos.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center lg:justify-start">
              <Link href="/reservas" className="w-full sm:w-auto">
                <button className="w-full bg-gradient-to-r from-rose-400 to-amber-400 text-white px-6 py-3 rounded-xl font-medium shadow-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2 text-xs">
                  <FaCalendarAlt /> Reservar ahora <FaArrowRight className="text-[10px]" />
                </button>
              </Link>
              <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <button className="w-full bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium shadow-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2 text-xs">
                  <FaWhatsapp /> Contactar por WhatsApp
                </button>
              </a>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-8 bg-white/80 border border-slate-100 p-3 rounded-xl shadow-sm">
              {[
                { number: '1.2k+', label: 'Clientes' },
                { number: '4.9★', label: 'Reseñas' },
                { number: '15+', label: 'Años exp.' }
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-base font-bold text-gray-800 tracking-tight">{stat.number}</p>
                  <p className="text-[9px] text-gray-400 font-light uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative order-1 lg:order-2 w-full max-w-xs sm:max-w-sm mx-auto lg:max-w-none">
            <div className="rounded-xl overflow-hidden shadow-md aspect-[4/3] lg:h-[450px]">
              <img
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop"
                alt="Salón"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

// ============================================
// SERVICES SECTION (1 columna en móvil, 3 en PC)
// ============================================
function ServicesSection() {
  const { data: services, loading } = useServices()

  const iconMap: Record<string, JSX.Element> = {
    FaMagic: <FaMagic className="text-xl" />,
    FaGem: <FaGem className="text-xl" />,
    FaPalette: <FaPalette className="text-xl" />,
    FaBrush: <FaBrush className="text-xl" />,
    FaEye: <FaEye className="text-xl" />,
    FaCut: <FaCut className="text-xl" />,
  }

  if (loading) {
    return (
      <section className="py-16 bg-slate-50 text-center">
        <div className="animate-pulse text-gray-400 text-xs">Cargando servicios...</div>
      </section>
    )
  }

  return (
    <section id="servicios" className="py-16 bg-slate-50">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block text-[10px] font-medium tracking-[0.15em] uppercase text-rose-400 border border-rose-200 px-3 py-1 rounded-full mb-3">
            Servicios
          </span>
          <h2 className="text-2xl font-light text-gray-800 mb-2">
            Tratamientos <span className="font-bold bg-gradient-to-r from-rose-400 to-amber-400 text-transparent bg-clip-text">Premium</span>
          </h2>
        </div>

        {/* CLAVE RESPONSIVE: 1 columna en móvil (grid-cols-1), 3 en computadoras (lg:grid-cols-3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services?.map((service: any, idx: number) => (
            <div key={idx} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-50 to-amber-50 rounded-lg flex items-center justify-center text-rose-400">
                    {iconMap[service.icon] || <FaGem className="text-xl" />}
                  </div>
                  {service.badge && (
                    <span className="text-[9px] font-bold tracking-wider text-rose-400 bg-rose-50 px-2.5 py-0.5 rounded-full">
                      {service.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">{service.name}</h3>
                <p className="text-gray-400 text-xs font-light leading-relaxed mb-4">{service.description}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-2">
                <div>
                  <p className="text-lg font-bold text-gray-800">${service.price}</p>
                  <p className="text-[10px] text-gray-400">{service.duration} min</p>
                </div>
                <Link href="/reservas" className="text-rose-400 text-xs font-medium flex items-center gap-1">
                  Reservar <FaArrowRight className="text-[9px]" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// STAFF SECTION (1 columna en móvil, 4 en PC)
// ============================================
function StaffSection() {
  const { data: staff, loading } = useStaff()

  if (loading || !staff || staff.length === 0) {
    return (
      <section className="py-16 bg-white text-center">
        <div className="animate-pulse text-gray-400 text-xs">Cargando equipo...</div>
      </section>
    )
  }

  return (
    <section id="staff" className="py-16 bg-white">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block text-[10px] font-medium tracking-[0.15em] uppercase text-rose-400 border border-rose-200 px-3 py-1 rounded-full mb-3">
            Staff
          </span>
          <h2 className="text-2xl font-light text-gray-800 mb-2">
            Equipo <span className="font-bold bg-gradient-to-r from-rose-400 to-amber-400 text-transparent bg-clip-text">Profesional</span>
          </h2>
        </div>

        {/* CLAVE RESPONSIVE: grid-cols-1 en móvil, se expande a sm:grid-cols-2 y lg:grid-cols-4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {staff?.map((member: any, idx: number) => (
            <div key={idx} className="bg-gray-50/60 rounded-xl p-4 text-center border border-gray-100/70">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <img 
                  src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`} 
                  alt={member.name} 
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-rose-100" 
                />
              </div>
              <h4 className="font-semibold text-sm text-gray-800">{member.name}</h4>
              <p className="text-xs text-rose-400 font-light">{member.role || member.specialty || 'Especialista'}</p>
              <Link href="/reservas" className="mt-3 inline-block text-[11px] text-rose-400 font-medium hover:underline">
                Reservar con {member.name.split(' ')[0]}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// TESTIMONIALS SECTION (Controlador de ancho fijo)
// ============================================
function TestimonialsSection() {
  const { data: testimonials, loading } = useTestimonials()
  const [currentIndex, setCurrentIndex] = useState(0)

  if (loading || !testimonials || testimonials.length === 0) return null

  const next = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  const prev = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)

  const current = testimonials[currentIndex]

  return (
    <section id="testimonios" className="py-16 bg-slate-50">
      <div className="w-full max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-light text-gray-800">
            Opiniones de <span className="font-bold bg-gradient-to-r from-rose-400 to-amber-400 text-transparent bg-clip-text">Clientes</span>
          </h2>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative">
          <div className="flex items-center gap-4 mb-4">
            <img 
              src={current.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(current.name)}&background=random`} 
              alt={current.name} 
              className="w-12 h-12 rounded-full object-cover" 
            />
            <div>
              <h4 className="font-semibold text-sm text-gray-800">{current.name}</h4>
              <p className="text-[11px] text-gray-400">{current.service}</p>
            </div>
          </div>
          <FaQuoteLeft className="text-2xl text-rose-100 mb-2" />
          <p className="text-gray-600 text-xs sm:text-sm font-light leading-relaxed">"{current.comment}"</p>

          <div className="flex justify-between mt-6 pt-3 border-t border-slate-50">
            <button onClick={prev} className="p-2 bg-slate-50 rounded-lg text-xs font-medium text-gray-600 active:scale-95 transition-transform">Anterior</button>
            <button onClick={next} className="p-2 bg-slate-50 rounded-lg text-xs font-medium text-gray-600 active:scale-95 transition-transform">Siguiente</button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// GALLERY SECTION (Ajustada para móvil)
// ============================================
function GallerySection() {
  const { data: gallery, loading } = useGallery()

  if (loading || !gallery || gallery.length === 0) return null

  return (
    <section className="py-12 bg-white">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">📸 Galería</h3>
          <Link href="/galeria" className="text-xs text-rose-400 font-medium">Ver todas →</Link>
        </div>
        {/* Cambiamos a 2 columnas en móvil y 4 en PC */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {gallery.slice(0, 4).map((item: any, idx: number) => (
            <div key={idx} className="relative overflow-hidden rounded-xl aspect-square bg-slate-100">
              <img src={item.image_url} alt="Galería" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// CTA SECTION
// ============================================
function CTASection() {
  return (
    <section className="py-16 bg-gradient-to-r from-rose-500 to-amber-400 text-white text-center">
      <div className="w-full max-w-xl mx-auto px-4">
        <h2 className="text-2xl font-light mb-2">¿Listo para una transformación?</h2>
        <p className="text-xs opacity-90 mb-6 font-light">Reserva tu cita hoy mismo con nuestros mejores estilistas.</p>
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <Link href="/reservas" className="bg-white text-rose-500 py-3 px-6 rounded-xl font-medium text-xs shadow-sm text-center">
            Reservar ahora
          </Link>
          <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="bg-emerald-500 text-white py-3 px-6 rounded-xl font-medium text-xs shadow-sm">
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}

// ============================================
// FOOTER (Arreglado de 4 columnas a 1 responsiva)
// ============================================
function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-400 py-12 text-xs">
      {/* Usamos flex-col en móvil para apilar verticalmente las secciones */}
      <div className="w-full max-w-7xl mx-auto px-4 flex flex-col lg:grid lg:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-bold text-sm mb-3">SALON PREMIUM</h3>
          <p className="font-light leading-relaxed">Transformando tu belleza con técnicas de vanguardia.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-2">Enlaces</h4>
          <div className="flex flex-col gap-1.5 font-light">
            <Link href="/">Inicio</Link>
            <Link href="/servicios">Servicios</Link>
            <Link href="/staff">Staff</Link>
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-2">Servicios</h4>
          <div className="flex flex-col gap-1.5 font-light">
            <p>Microblading</p>
            <p>Uñas Acrílicas</p>
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-2">Contacto</h4>
          <div className="space-y-1.5 font-light">
            <p>📍 Calle Principal 123</p>
            <p>📞 +34 123 456 789</p>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 mt-10 pt-6 text-center text-[11px]">
        © 2026 SALON PREMIUM · Todos los derechos reservados
      </div>
    </footer>
  )
}

// ============================================
// INTERFAZ PRINCIPAL
// ============================================
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 overflow-x-hidden">
      <Header />
      <HeroSection />
      <ServicesSection />
      <StaffSection />
      <TestimonialsSection />
      <GallerySection />
      <CTASection />
      <Footer />
    </main>
  )
}
