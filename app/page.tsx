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
  FaAward, 
  FaCrown, 
  FaDiamond,
  FaMedal, 
  FaRegGem, 
  FaRegStar, 
  FaCheck, 
  FaGift, 
  FaTrophy,
  FaRocket, 
  FaEye, 
  FaBrush, 
  FaPalette
} from 'react-icons/fa'

import { 
  useServices, 
  useStaff, 
  useTestimonials, 
  useGallery
} from '@/hooks/useData'

// ============================================
// HEADER
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
      scrolled ? 'bg-white/90 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-4'
    }`}>
      <div className="mx-auto px-4 w-full">
        <div className="flex items-center justify-between">
          
          {/* LOGO: Más compacto y estilizado en móvil */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-400 to-amber-400 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-md">
              S
            </div>
            <div>
              <h1 className="text-base font-light tracking-wider text-gray-800 leading-none">
                SALON <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">PREMIUM</span>
              </h1>
              <p className="text-[8px] text-gray-400 tracking-[0.2em] uppercase mt-0.5">Beauty & Aesthetics</p>
            </div>
          </Link>

          {/* NAV COMPUTADORA: Oculto en móvil por defecto, aparece en 'lg' */}
          <nav className="hidden lg:flex items-center gap-10">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="text-sm font-light text-gray-600 hover:text-rose-500 transition-colors relative group tracking-wider uppercase">
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-rose-400 to-amber-400 transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* BOTONES COMPUTADORA: Ocultos en móvil */}
          <div className="hidden lg:flex items-center gap-4">
            <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer">
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                <FaWhatsapp /> WhatsApp
              </button>
            </a>
            <Link href="/reservas">
              <button className="bg-gradient-to-r from-rose-400 to-amber-400 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2">
                <FaCalendarAlt /> Reservar
              </button>
            </Link>
          </div>

          {/* BOTÓN MENÚ MÓVIL: Más grande y fácil de tocar */}
          <button 
            className="lg:hidden text-2xl text-gray-700 w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl active:scale-90 transition-transform" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>

        {/* MENÚ MÓVIL DESPLEGABLE: Diseño tipo App Nativa */}
        {isMenuOpen && (
          <div className="lg:hidden fixed inset-x-4 top-16 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-5 border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-200">
            <nav className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link 
                  key={item.label} 
                  href={item.href} 
                  className="text-gray-700 hover:text-rose-500 py-2 px-3 hover:bg-slate-50 rounded-xl transition-all font-medium text-base flex items-center justify-between" 
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                  <FaArrowRight className="text-xs text-gray-300" />
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-gray-100">
                <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer">
                  <button className="w-full bg-emerald-500 active:scale-[0.98] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-sm transition-transform shadow-md">
                    <FaWhatsapp className="text-lg" /> Contactar por WhatsApp
                  </button>
                </a>
                <Link href="/reservas" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full bg-gradient-to-r from-rose-400 to-amber-400 active:scale-[0.98] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-sm transition-transform shadow-md">
                    <FaCalendarAlt /> Reservar una Cita
                  </button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

// ============================================
// HERO SECTION
// ============================================
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-50 via-white to-rose-50/20 overflow-hidden pt-24 pb-12">
      {/* Fondos difuminados estéticos */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-72 h-72 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Cambiamos a flex-col en móvil y md:grid en pantallas grandes */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* TEXTOS Y BOTONES */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur border border-gray-200/60 px-4 py-2 rounded-full text-xs font-medium mb-6 text-gray-600 shadow-sm mx-auto lg:mx-0">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Especialistas en Estética Avanzada
            </div>

            {/* Ajuste de tamaño de fuente responsivo: text-4xl en móvil, text-7xl en pc */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-light leading-tight mb-4 tracking-tight">
              <span className="text-gray-800">Donde la</span>{' '}
              <span className="font-bold bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400 text-transparent bg-clip-text">
                Belleza
              </span>
              <br />
              <span className="text-gray-700">encuentra el</span>{' '}
              <span className="font-bold text-gray-800">Arte</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-500 mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed font-light">
              Expertos en micropigmentación, microblading y uñas. 
              Resultados que hablan por sí mismos.
            </p>

            {/* Botones de acción verticalizados/adaptados para el pulgar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start max-w-sm mx-auto lg:max-w-none">
              <Link href="/reservas" className="w-full sm:w-auto">
                <button className="w-full group bg-gradient-to-r from-rose-400 to-amber-400 text-white px-8 py-3.5 rounded-xl font-medium shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm">
                  <FaCalendarAlt className="group-hover:rotate-12 transition-transform" />
                  Reservar ahora
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform text-xs" />
                </button>
              </Link>
              <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <button className="w-full bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-medium shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm">
                  <FaWhatsapp className="text-base" /> Contactar por WhatsApp
                </button>
              </a>
            </div>

            {/* Estadísticas en fila horizontal deslizable en móvil */}
            <div className="flex justify-between gap-4 mt-12 bg-white/60 backdrop-blur-sm border border-slate-100 p-4 rounded-2xl shadow-sm max-w-md mx-auto lg:mx-0">
              {[
                { number: '1.2k+', label: 'Clientes' },
                { number: '4.9★', label: 'Reseñas' },
                { number: '15+', label: 'Años exp.' }
              ].map((stat, idx) => (
                <div key={idx} className="text-center flex-1">
                  <p className="text-xl font-bold text-gray-800 tracking-tight">{stat.number}</p>
                  <p className="text-[11px] text-gray-400 font-light uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* IMAGEN Y TARJETAS FLOTANTES */}
          <div className="relative order-1 lg:order-2 w-full max-w-sm mx-auto lg:max-w-none px-4 lg:px-0">
            <div className="rounded-2xl overflow-hidden shadow-xl aspect-[4/3] lg:aspect-auto lg:h-[500px]">
              <img
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop"
                alt="Salón"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Tarjeta flotante superior (Ajustada para no salirse en móvil) */}
            <div className="absolute -top-4 -right-2 bg-white/95 backdrop-blur border border-gray-100 rounded-xl p-3 shadow-lg max-w-[160px] sm:max-w-none">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-rose-100 to-amber-100 rounded-lg flex items-center justify-center text-sm">✦</div>
                <div>
                  <p className="font-bold text-xs text-gray-800 tracking-tight">Micropigmentación</p>
                  <p className="text-[10px] text-gray-400 font-light">Especialistas</p>
                </div>
              </div>
            </div>

            {/* Tarjeta flotante inferior */}
            <div className="absolute -bottom-4 -left-2 bg-white/95 backdrop-blur border border-gray-100 rounded-xl p-3 shadow-lg max-w-[160px] sm:max-w-none">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-rose-100 rounded-lg flex items-center justify-center text-sm">★</div>
                <div>
                  <p className="font-bold text-xs text-gray-800 tracking-tight">4.9 / 5.0</p>
                  <p className="text-[10px] text-gray-400 font-light">156 opiniones reales</p>
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
// SERVICES SECTION
// ============================================
function ServicesSection() {
  const { data: services, loading, error } = useServices()

  const iconMap: Record<string, JSX.Element> = {
    FaMagic: <FaMagic className="text-2xl" />,
    FaGem: <FaGem className="text-2xl" />,
    FaPalette: <FaPalette className="text-2xl" />,
    FaBrush: <FaBrush className="text-2xl" />,
    FaEye: <FaEye className="text-2xl" />,
    FaCut: <FaCut className="text-2xl" />,
  }

  if (loading) {
    return (
      <section className="py-28 bg-slate-50">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse text-gray-400">Cargando servicios...</div>
        </div>
      </section>
    )
  }

  return (
    <section id="servicios" className="py-28 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <span className="inline-block text-xs font-light tracking-[0.2em] uppercase text-rose-400 border border-rose-200 px-4 py-1.5 rounded-full mb-4">
            Servicios
          </span>
          <h2 className="text-4xl font-light text-gray-800 mb-3">
            Tratamientos <span className="font-bold bg-gradient-to-r from-rose-400 to-amber-400 text-transparent bg-clip-text">Premium</span>
          </h2>
          <p className="text-gray-400 font-light max-w-xl mx-auto">
            Selecciona el servicio que mejor se adapte a tus necesidades.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {services?.map((service: any, idx: number) => (
            <div key={idx} className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100/50">
              <div className="flex justify-between items-start mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                  {iconMap[service.icon] || <FaGem className="text-2xl" />}
                </div>
                {service.badge && (
                  <span className="text-[10px] font-bold tracking-widest text-rose-400 bg-rose-50 px-3 py-1 rounded-full">
                    {service.badge}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{service.name}</h3>
              <p className="text-gray-400 text-sm font-light leading-relaxed mb-5">{service.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div>
                  <p className="text-2xl font-bold text-gray-800">${service.price}</p>
                  <p className="text-xs text-gray-400 font-light">{service.duration} min</p>
                </div>
                <Link href="/reservas">
                  <button className="text-rose-400 hover:text-rose-500 transition-colors flex items-center gap-2 text-sm font-medium">
                    Reservar <FaArrowRight className="text-xs" />
                  </button>
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
// STAFF SECTION
// ============================================
function StaffSection() {
  const { data: staff, loading, error } = useStaff()

  if (loading) {
    return (
      <section className="py-28 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse text-gray-400">Cargando equipo...</div>
        </div>
      </section>
    )
  }

  if (!staff || staff.length === 0) {
    return (
      <section className="py-28 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">No hay profesionales disponibles</p>
        </div>
      </section>
    )
  }

  return (
    <section id="staff" className="py-28 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <span className="inline-block text-xs font-light tracking-[0.2em] uppercase text-rose-400 border border-rose-200 px-4 py-1.5 rounded-full mb-4">
            Staff
          </span>
          <h2 className="text-4xl font-light text-gray-800 mb-3">
            Equipo <span className="font-bold bg-gradient-to-r from-rose-400 to-amber-400 text-transparent bg-clip-text">Profesional</span>
          </h2>
          <p className="text-gray-400 font-light max-w-xl mx-auto">
            Expertos apasionados por la belleza y la excelencia.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {staff?.map((member: any, idx: number) => (
            <div key={idx} className="group bg-gray-50/50 rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-gray-100/50">
              <div className="relative w-28 h-28 mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-200 to-amber-200 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <img 
                  src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`} 
                  alt={member.name} 
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-rose-100/50 group-hover:ring-rose-200 transition-all" 
                />
              </div>
              <h4 className="font-semibold text-gray-800">{member.name}</h4>
              <p className="text-sm text-rose-400 font-light">{member.role || member.specialty || 'Especialista'}</p>
              {member.experience && (
                <p className="text-xs text-gray-400 mt-1 font-light">{member.experience}</p>
              )}
              <Link href="/reservas">
                <button className="mt-4 text-sm text-rose-400 hover:text-rose-500 transition-colors font-medium">
                  Reservar con {member.name.split(' ')[0]}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// TESTIMONIALS SECTION
// ============================================
function TestimonialsSection() {
  const { data: testimonials, loading, error } = useTestimonials()
  const [currentIndex, setCurrentIndex] = useState(0)

  if (loading) {
    return (
      <section className="py-28 bg-slate-50">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse text-gray-400">Cargando testimonios...</div>
        </div>
      </section>
    )
  }

  if (!testimonials || testimonials.length === 0) {
    return null
  }

  const next = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  const prev = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)

  return (
    <section id="testimonios" className="py-28 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <span className="inline-block text-xs font-light tracking-[0.2em] uppercase text-rose-400 border border-rose-200 px-4 py-1.5 rounded-full mb-4">
            Testimonios
          </span>
          <h2 className="text-4xl font-light text-gray-800 mb-3">
            Lo que <span className="font-bold bg-gradient-to-r from-rose-400 to-amber-400 text-transparent bg-clip-text">dicen</span> nuestros clientes
          </h2>
          <p className="text-gray-400 font-light max-w-xl mx-auto">
            La satisfacción de nuestros clientes es nuestro mejor reconocimiento.
          </p>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div className="overflow-hidden">
            <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
              {testimonials.map((testimonial: any) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-6">
                  <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100/50">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-200 to-amber-200 rounded-full blur-xl opacity-20" />
                        <img 
                          src={testimonial.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=random`} 
                          alt={testimonial.name} 
                          className="w-20 h-20 rounded-full object-cover ring-4 ring-rose-100/50" 
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 text-xl">{testimonial.name}</h4>
                        <p className="text-sm text-gray-400 font-light">{testimonial.location} · {testimonial.service}</p>
                        <div className="flex gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className={i < testimonial.rating ? 'text-amber-400 text-sm' : 'text-gray-200 text-sm'} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <FaQuoteLeft className="text-4xl text-rose-200 mb-4" />
                    <p className="text-gray-600 text-lg leading-relaxed font-light">"{testimonial.comment}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={prev} className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all border border-gray-100">
            <FaChevronLeft className="text-gray-400" />
          </button>
          <button onClick={next} className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all border border-gray-100">
            <FaChevronRight className="text-gray-400" />
          </button>

          <div className="flex justify-center gap-3 mt-10">
            {testimonials.map((_: any, idx: number) => (
              <button
                key={idx}
                className={`transition-all duration-300 ${idx === currentIndex ? 'w-8 h-1.5 bg-rose-400 rounded-full' : 'w-1.5 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400'}`}
                onClick={() => setCurrentIndex(idx)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// GALLERY SECTION
// ============================================
function GallerySection() {
  const { data: gallery, loading, error } = useGallery()

  if (loading || !gallery || gallery.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-light text-gray-800">
            📸 <span className="font-bold bg-gradient-to-r from-rose-400 to-amber-400 text-transparent bg-clip-text">Galería</span>
          </h3>
          <Link href="/galeria">
            <button className="text-sm text-rose-400 hover:text-rose-500 transition-colors font-medium">
              Ver todas →
            </button>
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {gallery.slice(0, 4).map((item: any, idx: number) => (
            <div key={idx} className="relative overflow-hidden rounded-xl group cursor-pointer">
              <img src={item.image_url} alt={item.title || 'Galería'} className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white text-sm">{item.title || 'Transformación'}</p>
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
// CTA SECTION
// ============================================
function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center text-white max-w-3xl mx-auto">
          <div className="text-6xl mb-6 font-light opacity-80">✦</div>
          <h2 className="text-4xl font-light mb-4">
            ¿Listo para <span className="font-bold">transformar</span> tu belleza?
          </h2>
          <p className="text-lg opacity-90 mb-10 font-light leading-relaxed">
            Reserva tu cita ahora y descubre la experiencia de belleza premium.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/reservas">
              <button className="bg-white text-rose-500 px-12 py-5 rounded-full font-medium hover:shadow-2xl transition-all flex items-center gap-3 text-lg">
                <FaCalendarAlt /> Reservar ahora
              </button>
            </Link>
            <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer">
              <button className="bg-emerald-500 text-white px-10 py-5 rounded-full font-medium hover:shadow-2xl transition-all flex items-center gap-3 text-lg">
                <FaWhatsapp /> WhatsApp
              </button>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// FOOTER
// ============================================
function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-4 gap-16">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-amber-400 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                S
              </div>
              <h3 className="text-xl font-light tracking-wider">
                SALON <span className="font-bold">PREMIUM</span>
              </h3>
            </div>
            <p className="text-gray-400 text-sm font-light leading-relaxed">
              Transformando tu belleza con los mejores profesionales y técnicas de vanguardia.
            </p>
            <div className="flex gap-4 mt-8">
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-rose-500 transition-colors">
                <FaInstagram className="text-gray-400 hover:text-white transition-colors" />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-rose-500 transition-colors">
                <FaFacebook className="text-gray-400 hover:text-white transition-colors" />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-rose-500 transition-colors">
                <FaYoutube className="text-gray-400 hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-6">Enlaces</h4>
            <ul className="space-y-3 text-sm text-gray-400 font-light">
              <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
              <li><Link href="/servicios" className="hover:text-white transition-colors">Servicios</Link></li>
              <li><Link href="/staff" className="hover:text-white transition-colors">Staff</Link></li>
              <li><Link href="/contacto" className="hover:text-white transition-colors">Contacto</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-6">Servicios</h4>
            <ul className="space-y-3 text-sm text-gray-400 font-light">
              <li><Link href="/servicios" className="hover:text-white transition-colors">Microblading</Link></li>
              <li><Link href="/servicios" className="hover:text-white transition-colors">Powder Brows</Link></li>
              <li><Link href="/servicios" className="hover:text-white transition-colors">Uñas Acrílicas</Link></li>
              <li><Link href="/servicios" className="hover:text-white transition-colors">Uñas de Gel</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-6">Contacto</h4>
            <ul className="space-y-3 text-sm text-gray-400 font-light">
              <li className="flex items-center gap-3"><FaPhone className="text-rose-400" /> +34 123 456 789</li>
              <li className="flex items-center gap-3"><FaEnvelope className="text-rose-400" /> info@salonpremium.com</li>
              <li className="flex items-center gap-3"><FaMapMarkerAlt className="text-rose-400" /> Calle Principal 123</li>
              <li className="flex items-center gap-3"><FaClock className="text-rose-400" /> Lun-Sáb: 9:00 - 21:00</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-16 pt-8 text-center text-sm text-gray-500 font-light">
          © 2024 SALON PREMIUM · Todos los derechos reservados
        </div>
      </div>
    </footer>
  )
}

// ============================================
// AI ASSISTANT
// ============================================
function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 ¡Hola! Soy tu asistente de belleza. ¿En qué puedo ayudarte?' }
  ])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    setMessages([...messages, { role: 'user', content: input }])
    setInput('')
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Gracias por tu mensaje. ¿Te gustaría reservar una cita o conocer más sobre nuestros servicios?' 
      }])
    }, 1000)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-gradient-to-r from-rose-400 to-amber-400 rounded-full shadow-2xl shadow-rose-500/30 flex items-center justify-center text-white text-2xl hover:scale-110 transition-transform"
      >
        <FaRobot />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-8 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-400 to-amber-400 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FaRobot className="text-xl" />
              <span className="font-medium">Asistente IA</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <FaTimes />
            </button>
          </div>
          <div className="h-80 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-gradient-to-r from-rose-400 to-amber-400 text-white' : 'bg-white border border-gray-100 text-gray-700'}`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escribe tu mensaje..."
              className="flex-1 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
            />
            <button onClick={handleSend} className="px-4 py-2 bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-xl hover:shadow-lg transition-all text-sm">
              <FaArrowRight />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================
export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <ServicesSection />
      <StaffSection />
      <TestimonialsSection />
      <GallerySection />
      <CTASection />
      <Footer />
      <AIAssistant />
    </main>
  )
}
