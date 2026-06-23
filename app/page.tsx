'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  FaCalendarAlt, 
  FaGem, 
  FaMagic, 
  FaPalette, 
  FaBrush, 
  FaEye, 
  FaCut, 
  FaArrowRight, 
  FaQuoteLeft,
  FaGraduationCap,
  FaCheckCircle,
  FaChevronDown,
  FaStar
} from 'react-icons/fa'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useServices, useStaff, useTestimonials } from '@/hooks/useData'

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-stone-50 pt-28 pb-16 overflow-hidden">
      {/* Toques sutiles de color de fondo */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-100/50 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-100/40 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left w-full max-w-md mx-auto lg:max-w-none">
            <div className="inline-flex items-center gap-2 bg-white border border-stone-200 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-5 text-stone-600 shadow-sm">
              Estética Avanzada & Academia de Belleza
            </div>

            <h1 className="text-4xl sm:text-6xl font-serif text-stone-900 mb-6 leading-tight tracking-tight">
              La simetría perfecta <br />
              <span className="italic font-light text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">
                elevada a arte
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 mb-8 leading-relaxed font-light max-w-sm mx-auto lg:mx-0">
              Especialistas certificados en Microblading, Micropigmentación, Microshading e interiorismo de uñas.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/reservas" className="w-full sm:w-auto">
                <button className="w-full bg-stone-900 text-white hover:bg-stone-800 px-6 py-3.5 rounded-xl font-bold shadow-md active:scale-[0.98] transition-transform flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
                  <FaCalendarAlt /> Agendar Cita <FaArrowRight className="text-[10px]" />
                </button>
              </Link>
              <Link href="/academy" className="w-full sm:w-auto">
                <button className="w-full bg-white border border-stone-200 text-stone-800 hover:bg-stone-50 px-6 py-3.5 rounded-xl font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2 text-xs shadow-sm">
                  <FaGraduationCap /> Ver Cursos
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-10 bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
              {[
                { number: '2.5k+', label: 'Procedimientos' },
                { number: '5.0★', label: 'Calificación' },
                { number: 'Master', label: 'Certificación' }
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-base font-black text-stone-900 tracking-tight">{stat.number}</p>
                  <p className="text-[9px] text-stone-400 font-mono uppercase tracking-wider mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative w-full max-w-xs sm:max-w-sm mx-auto lg:max-w-none">
            <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-xl aspect-[4/3] lg:h-[450px] bg-white">
              <img
                src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80" 
                alt="Procedimiento de Arquitectura de Miradas"
                className="w-full h-full object-cover transition-all duration-700 transform hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ServicesSection() {
  const { data: services, loading } = useServices()

  const iconMap: Record<string, JSX.Element> = {
    FaMagic: <FaMagic className="text-lg" />,
    FaGem: <FaGem className="text-lg" />,
    FaPalette: <FaPalette className="text-lg" />,
    FaBrush: <FaBrush className="text-lg" />,
    FaEye: <FaEye className="text-lg" />,
    FaCut: <FaCut className="text-lg" />,
  }

  const serviceImages: Record<number, string> = {
    0: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&auto=format&fit=crop&q=80",
    1: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80",
    2: "https://images.unsplash.com/photo-1626015713026-d8309cdc91ea?w=600&auto=format&fit=crop&q=80",
  }

  if (loading) return <section className="py-16 bg-white text-center"><div className="animate-pulse text-stone-400 text-xs font-mono">CARGANDO SERVICIOS...</div></section>

  return (
    <section id="servicios" className="py-20 bg-white border-t border-stone-100">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block text-[9px] font-bold tracking-[0.2em] uppercase text-rose-600 bg-rose-50 px-3 py-1 rounded-md mb-3">
            Servicios
          </span>
          <h2 className="text-3xl font-serif text-stone-900 mb-2 tracking-tight">
            Tratamientos Disponibles
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services?.map((service: any, idx: number) => (
            <div key={idx} className="bg-stone-50 rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col justify-between group hover:border-stone-300 transition-colors">
              <div className="h-48 w-full overflow-hidden relative bg-stone-100">
                <img src={serviceImages[idx % 3]} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-rose-500 border border-stone-200 shadow-sm">
                      {iconMap[service.icon] || <FaStar className="text-base" />}
                    </div>
                    <span className="text-[10px] font-mono text-stone-500 bg-white px-2.5 py-0.5 rounded-full border border-stone-200">
                      {service.duration} min
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 tracking-tight mb-2">{service.name}</h3>
                  <p className="text-stone-600 text-xs font-light leading-relaxed mb-4">{service.description}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stone-200 mt-4">
                  <div>
                    <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest leading-none">Inversión</p>
                    <p className="text-lg font-black text-stone-900 mt-1">${service.price}</p>
                  </div>
                  <Link href="/reservas" className="bg-white border border-stone-200 text-stone-800 font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl hover:bg-stone-50 active:scale-95 transition-all flex items-center gap-1 shadow-sm">
                    Agendar <FaArrowRight className="text-[8px]" />
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
  return (
    <section className="py-24 bg-stone-50 border-t border-stone-100 relative">
      <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        <div className="relative">
          <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop&q=80" alt="Academy Training" className="rounded-2xl border border-stone-200 shadow-lg relative z-10 w-full h-[400px] object-cover" />
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-700 bg-amber-50 px-3 py-1 rounded-md border border-amber-200 inline-block mb-4">
            Formación profesional
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-900 mb-6 leading-tight">
            Aprende las técnicas que están <br />
            <span className="italic font-light text-stone-600">revolucionando el mercado</span>
          </h2>
          <p className="text-stone-600 text-xs sm:text-sm font-light leading-relaxed mb-6">
            Nuestra academia ofrece capacitación intensiva con prácticas reales sobre modelos, kits de materiales incluidos y certificaciones homologadas. Conviértete en especialista en diseño de miradas y estructuras de uñas.
          </p>
          <ul className="space-y-3 mb-8">
            {['Cursos Iniciales y Avanzados de Microblading', 'Masterclass Práctica en Uñas', 'Mentoría de Negocio para Estilistas'].map((item, index) => (
              <li key={index} className="flex items-center gap-3 text-xs text-stone-700 font-light">
                <FaCheckCircle className="text-emerald-600 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
          <Link href="/academy" className="inline-flex items-center gap-2 bg-stone-900 text-white hover:bg-stone-800 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md">
            Ver Calendario de Cursos <FaArrowRight className="text-[10px]" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function StaffSection() {
  const { data: staff, loading } = useStaff()
  if (loading || !staff || staff.length === 0) return null

  return (
    <section id="staff" className="py-20 bg-white border-t border-stone-100">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block text-[9px] font-bold tracking-[0.2em] uppercase text-stone-500 bg-stone-50 border border-stone-200 px-3 py-1 rounded-md mb-3">
            Equipo
          </span>
          <h2 className="text-3xl font-serif text-stone-900 mb-2 tracking-tight">
            Especialistas del Centro
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {staff?.map((member: any, idx: number) => (
            <div key={idx} className="bg-stone-50 rounded-2xl p-6 text-center border border-stone-200 shadow-sm">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <img src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=f5f5f4&color=1c1917`} alt={member.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md" />
              </div>
              <h4 className="font-bold text-sm text-stone-900 tracking-tight">{member.name}</h4>
              <p className="text-[10px] text-rose-600 font-mono uppercase tracking-wider mt-1">{member.role || 'Dermo-Especialista'}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const { data: testimonials, loading } = useTestimonials()
  const [currentIndex, setCurrentIndex] = useState(0)

  if (loading || !testimonials || testimonials.length === 0) return null
  const current = testimonials[currentIndex]

  return (
    <section className="py-20 bg-stone-50 border-t border-stone-100">
      <div className="w-full max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200 relative text-center">
          <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-6">
            <FaQuoteLeft className="text-xs" />
          </div>
          <p className="text-stone-700 text-sm font-light leading-relaxed italic mb-6">
            "{current?.comment}"
          </p>
          <div className="inline-flex items-center gap-3 pt-4 border-t border-stone-100 w-full justify-center">
            <div className="text-center">
              <h4 className="font-bold text-xs text-stone-900">{current?.name}</h4>
              <p className="text-[10px] text-stone-400 font-mono uppercase tracking-wider mt-0.5">{current?.service}</p>
            </div>
          </div>
          <div className="flex justify-between items-center mt-6">
            <button onClick={() => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)} className="px-4 py-2 bg-stone-50 border border-stone-200 text-[10px] font-mono text-stone-600 rounded-xl hover:bg-stone-100 transition-colors">← Anterior</button>
            <button onClick={() => setCurrentIndex((prev) => (prev + 1) % testimonials.length)} className="px-4 py-2 bg-stone-50 border border-stone-200 text-[10px] font-mono text-stone-600 rounded-xl hover:bg-stone-100 transition-colors">Siguiente →</button>
          </div>
        </div>
      </div>
    </section>
  )
}

function GallerySection() {
  const galleryImages = [
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1626015713026-d8309cdc91ea?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=500&auto=format&fit=crop&q=80"
  ]

  return (
    <section className="py-20 bg-white border-t border-stone-100">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest block mb-1">Galería</span>
            <h3 className="text-xl font-bold text-stone-900 tracking-tight">📸 Resultados reales</h3>
          </div>
          <Link href="/galeria" className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1">
            Ver Todo <FaArrowRight className="text-[9px]" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {galleryImages.map((src, idx) => (
            <div key={idx} className="relative overflow-hidden rounded-2xl aspect-square bg-stone-50 border border-stone-200 group shadow-sm">
              <img src={src} alt="Resultado de estética" className="w-full h-full object-cover transition-all duration-500 transform group-hover:scale-102" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const faqs = [
    { q: "¿Cuánto dura el procedimiento de Microblading?", a: "Suele tardar entre 2 y 2.5 horas, incluyendo el diseño de visajismo previo." },
    { q: "¿Es dolorosa la micropigmentación?", a: "Utilizamos geles calmantes tópicos para que la molestia sea mínima." },
    { q: "¿Con cuánta anticipación debo agendar?", a: "Recomendamos reservar con un mínimo de 7 a 14 días de anticipación." }
  ]

  return (
    <section className="py-24 bg-stone-50 border-t border-stone-100">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-rose-600 mb-2">Preguntas frecuentes</p>
          <h2 className="text-3xl font-serif text-stone-900 italic">Dudas comunes</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-stone-200 bg-white rounded-xl overflow-hidden shadow-sm">
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full p-5 text-left flex justify-between items-center text-stone-800 text-xs sm:text-sm hover:bg-stone-50 transition-colors">
                <span>{faq.q}</span>
                <FaChevronDown className={`text-xs text-stone-400 transition-transform ${openIndex === i ? 'rotate-180 text-rose-600' : ''}`} />
              </button>
              {openIndex === i && <div className="p-5 pt-0 text-xs text-stone-600 font-light border-t border-stone-100 bg-stone-50/50">{faq.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-20 bg-white text-center border-t border-stone-100">
      <div className="w-full max-w-xl mx-auto px-4">
        <h2 className="text-2xl font-light text-stone-900 mb-2 tracking-tight">¿Deseas agendar un turno?</h2>
        <div className="flex justify-center mt-6">
          <Link href="/reservas" className="bg-stone-900 text-white hover:bg-stone-800 py-3.5 px-8 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md text-center transition-colors">
            Reservar turno
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <main className="bg-white text-stone-900 min-h-screen overflow-x-hidden">
      <Header />
      <HeroSection />
      <ServicesSection />
      <AcademySection />
      <StaffSection />
      <TestimonialsSection />
      <GallerySection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  )
}
