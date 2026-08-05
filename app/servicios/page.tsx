// @ts-nocheck
'use client'

import React, { useState, useEffect } useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaArrowRight, FaQuoteLeft, FaInstagram, FaWhatsapp, FaStar, FaGem,
  FaBars, FaTimes, FaCalendarCheck, FaPhoneAlt, FaMapMarkerAlt, FaRegHeart,
  FaPalette, FaHandSparkles, FaAward, FaLeaf,
  FaCrown, FaRegStar, FaEye, FaHeart, FaClock, FaCheckCircle,
  FaSprayCan, FaUserTie, FaSparkles
} from 'react-icons/fa'
import { GiNails, GiScissors, GiLipstick, GiSparkles } from 'react-icons/gi'

// ============================================================
// CONFIGURACIÓN DE ICONOS E IMÁGENES
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
  'Uñas': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop',
  'Micropigmentación': 'https://plus.unsplash.com/premium_photo-1661580887141-7adca5e04c02?w=800&h=600&fit=crop',
  'Peluquería': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop',
  'Cejas': 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=800&h=600&fit=crop',
  'Estética': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop',
  'Depilación': 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&h=600&fit=crop',
  'Pestañas': 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&h=600&fit=crop',
  'default': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop'
}

const getCleanSlug = (text: string) => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

const getProfesionalPorServicio = (category: string) => {
  const cat = category?.toLowerCase() || ''
  if (cat.includes('uña') || cat.includes('micro') || cat.includes('ceja') || cat.includes('pestaña') || cat.includes('labio')) {
    return {
      nombre: 'Any',
      rol: 'Nail & Derm Master',
      foto: 'https://kzovcbefedfmpeucrofh.supabase.co/storage/v1/object/public/profesionals/any.png',
      experiencia: '25+ años'
    }
  }
  return {
    nombre: 'Silvana',
    rol: 'Hair & Body Expert',
    foto: 'https://kzovcbefedfmpeucrofh.supabase.co/storage/v1/object/public/profesionals/sil.png',
    experiencia: '25+ años'
  }
}

// ============================================================
// HEADER (MISMO ESTILO QUE HOME)
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
          <span className="text-[#1A0E0A] font-serif text-xl md:text-2xl tracking-[0.15em] transition-colors duration-300 group-hover:text-[#D4AF37]">
            SALON FRESH
          </span>
          <span className="text-[9px] tracking-[0.4em] text-[#D4AF37] font-light uppercase mt-0.5">
            NAILS & BEAUTY ATELIER
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-10">
          {['Esencia', 'Categorías', 'Servicios', 'Galería', 'Testimonios'].map((item) => (
            <Link 
              key={item}
              href={item === 'Servicios' ? '/servicios' : `/#${getCleanSlug(item)}`}
              className={`text-xs uppercase tracking-[0.2em] text-[#5C4A3E] hover:text-[#D4AF37] transition-colors duration-300 font-medium ${
                item === 'Servicios' ? 'text-[#D4AF37] border-b border-[#D4AF37]' : ''
              }`}
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
            className="lg:hidden absolute top-full left-0 right-0 bg-[#FFFCF8] border-b border-[#D4AF37]/10 py-6 px-8 shadow-xl"
          >
            <div className="flex flex-col gap-4">
              {['Esencia', 'Categorías', 'Servicios', 'Galería', 'Testimonios'].map((item) => (
                <Link
                  key={item}
                  href={item === 'Servicios' ? '/servicios' : `/#${getCleanSlug(item)}`}
                  className={`text-xs uppercase tracking-[0.2em] text-[#5C4A3E] hover:text-[#D4AF37] transition-all ${
                    item === 'Servicios' ? 'text-[#D4AF37]' : ''
                  }`}
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
// HERO DE SERVICIOS
// ============================================================
const ServicesHero = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden bg-[#FFF9F6]">
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="absolute top-1/4 right-[-10%] w-[50vw] h-[50vw] bg-[#F5D4E0]/20 rounded-full blur-[120px]" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-center gap-3">
            <span className="h-[1px] w-12 bg-[#D4AF37]" />
            <span className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-semibold">
              Catálogo de Autor
            </span>
            <span className="h-[1px] w-12 bg-[#D4AF37]" />
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#1A0E0A] font-light leading-tight">
            La Carta de <br />
            <span className="italic font-normal text-[#D4AF37]">Tratamientos</span> Exclusivos
          </h1>

          <p className="text-[#5C4A3E] font-light max-w-xl mx-auto text-base md:text-lg leading-relaxed">
            Descubre nuestra colección de servicios de alta perfumería, diseñados bajo la dirección de Any y ejecutados por nuestras artistas especializadas.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 border border-[#F0E4DA]">
              <FaUserTie className="text-[#D4AF37] text-sm" />
              <span className="text-xs text-[#5C4A3E] font-light">25+ años de trayectoria</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 border border-[#F0E4DA]">
              <FaSparkles className="text-[#D4AF37] text-sm" />
              <span className="text-xs text-[#5C4A3E] font-light">Certificaciones internacionales</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// STATS DE SERVICIOS
// ============================================================
const ServicesStats = ({ total }: { total: number }) => {
  const stats = [
    { number: total, label: 'Tratamientos Disponibles' },
    { number: '25+', label: 'Años de Experiencia' },
    { number: '4.9', label: 'Calificación Global' },
    { number: '100%', label: 'Garantía de Calidad' }
  ]

  return (
    <section className="py-16 bg-white border-y border-[#F0E4DA]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="font-serif text-3xl md:text-4xl text-[#1A0E0A] font-light">{stat.number}</p>
              <p className="text-[9px] tracking-[0.25em] text-[#5C4A3E] uppercase mt-2 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function ServiciosPublicPage() {
  const [servicios, setServicios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [activeService, setActiveService] = useState<any | null>(null)

  useEffect(() => {
    const fetchServicios = async () => {
      try {
        setLoading(true)
        
        let tenantId = null
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.user_metadata?.tenant_id) tenantId = session.user.user_metadata.tenant_id
        if (!tenantId && session?.user?.app_metadata?.tenant_id) tenantId = session.user.app_metadata.tenant_id

        if (!tenantId) {
          const { data: fallbackQuery } = await supabase
            .from('services')
            .select('tenant_id')
            .limit(1)
            .maybeSingle()
          
          if (fallbackQuery?.tenant_id) {
            tenantId = fallbackQuery.tenant_id
          }
        }

        let query = supabase
          .from('services')
          .select('id, name, description, price, duration, category, badge, is_active, subcategory')
          .eq('is_active', true)

        if (tenantId) {
          query = query.eq('tenant_id', tenantId)
        }

        const { data, error } = await query
          .order('category', { ascending: true })
          .order('name', { ascending: true })

        if (!error && data) {
          setServicios(data)
        }
      } catch (error) {
        console.error('Error general en fetchServicios:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchServicios()
  }, [])

  const allCategories = ['Todos', ...new Set(servicios.map(s => s.category).filter(Boolean))]
  const filteredServicios = selectedCategory === 'Todos' ? servicios : servicios.filter(s => s.category === selectedCategory)
  const activeCategoriesList = selectedCategory === 'Todos' ? Array.from(new Set(servicios.map(s => s.category).filter(Boolean))) : [selectedCategory]

  if (loading) {
    return (
      <main className="bg-[#FFF9F6] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-t-2 border-[#D4AF37] border-r-2 border-transparent rounded-full animate-spin" />
          <p className="text-[10px] text-[#A89588] tracking-[0.4em] uppercase font-bold">Cargando el catálogo</p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF9F6] text-[#1A0E0A] antialiased selection:bg-[#D4AF37]/20">
      <Header />
      <ServicesHero />
      <ServicesStats total={servicios.length} />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 relative z-10">
        
        {/* FILTROS ELEGANTES */}
        {allCategories.length > 1 && (
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 mb-16 border-b border-[#F0E4DA] pb-6 max-w-4xl mx-auto">
            {allCategories.map((cat) => {
              const count = cat === 'Todos' ? servicios.length : servicios.filter(s => s.category === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 pb-2 relative flex items-center gap-2 ${
                    selectedCategory === cat ? 'text-[#D4AF37]' : 'text-[#A89588] hover:text-[#1A0E0A]'
                  }`}
                >
                  {cat}
                  <span className={`text-[8px] ${selectedCategory === cat ? 'text-[#D4AF37]' : 'text-[#A89588]'}`}>
                    ({count})
                  </span>
                  {selectedCategory === cat && (
                    <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#D4AF37]" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {filteredServicios.length === 0 ? (
          <div className="text-center py-24 bg-white border border-[#F0E4DA]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#5C4A3E] font-light">No hay tratamientos disponibles en esta categoría.</p>
          </div>
        ) : (
          <div className="space-y-20">
            {activeCategoriesList.map((categoryName) => {
              const servicesInCategory = filteredServicios.filter(s => s.category === categoryName)
              if (servicesInCategory.length === 0) return null

              const Icon = CATEGORY_ICONS[categoryName] || CATEGORY_ICONS.default

              return (
                <div key={categoryName} className="space-y-8">
                  <div className="flex items-center gap-4 border-b border-[#D4AF37]/20 pb-4">
                    <div className="text-[#D4AF37] text-xl p-2 bg-[#FFF8F5] border border-[#F0E4DA]">
                      <Icon />
                    </div>
                    <h2 className="font-serif text-2xl md:text-3xl text-[#1A0E0A] font-light tracking-wide">{categoryName}</h2>
                    <span className="text-[9px] text-[#A89588] font-light ml-auto bg-white px-3 py-1 border border-[#F0E4DA]">
                      {servicesInCategory.length} tratamientos
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {servicesInCategory.map((servicio) => {
                      const imageUrl = CATEGORY_IMAGES[servicio.category] || CATEGORY_IMAGES.default
                      const profesional = getProfesionalPorServicio(servicio.category)
                      
                      return (
                        <div
                          key={servicio.id}
                          onClick={() => setActiveService(servicio)}
                          className="group bg-white border border-[#F0E4DA] overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 hover:border-[#D4AF37]"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-[#FFF9F6]">
                            <img 
                              src={imageUrl} 
                              alt={servicio.name} 
                              className="w-full h-full object-cover filter grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0E0A]/80 via-[#1A0E0A]/10 to-transparent opacity-80 group-hover:opacity-70 transition-opacity duration-500" />
                            
                            <div className="absolute top-4 left-4 flex gap-2">
                              <span className="text-[7px] tracking-widest uppercase font-bold bg-white/90 backdrop-blur-sm text-[#1A0E0A] px-3 py-1.5 border border-[#D4AF37]/20">
                                {servicio.category}
                              </span>
                              {servicio.badge && (
                                <span className="text-[7px] tracking-widest uppercase font-bold bg-[#D4AF37] text-white px-3 py-1.5">
                                  {servicio.badge}
                                </span>
                              )}
                            </div>
                            
                            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <h3 className="font-serif text-xl leading-tight font-light tracking-wide">{servicio.name}</h3>
                                  <div className="flex items-center gap-3 text-[10px] text-white/60">
                                    <span className="flex items-center gap-1">
                                      <FaClock className="text-[#D4AF37]" />
                                      {servicio.duration} min
                                    </span>
                                    <span className="w-px h-3 bg-white/20" />
                                    <span className="font-serif font-light">${servicio.price}</span>
                                  </div>
                                </div>
                                <span className="text-[8px] tracking-widest uppercase font-bold border border-white/25 bg-white/10 backdrop-blur-md px-3 py-1.5 whitespace-nowrap group-hover:bg-[#D4AF37] group-hover:border-[#D4AF37] transition-all">
                                  Ver Ficha
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* ARTISTA ASIGNADA */}
                          <div className="p-4 flex items-center gap-3 border-t border-[#F0E4DA] bg-[#FFFCF8]">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#F0E4DA] flex-shrink-0">
                              <img src={profesional.foto} alt={profesional.nombre} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[8px] tracking-widest uppercase text-[#D4AF37] font-bold">Artista</p>
                              <p className="text-xs font-medium text-[#1A0E0A] truncate">{profesional.nombre}</p>
                            </div>
                            <span className="text-[7px] tracking-widest text-[#A89588] border border-[#F0E4DA] px-2 py-1">
                              {profesional.experiencia}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* CTA FINAL */}
        <div className="text-center mt-24 pt-16 border-t border-[#F0E4DA]">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-semibold mb-4">¿Lista para reservar?</p>
          <h3 className="font-serif text-2xl md:text-3xl text-[#1A0E0A] font-light max-w-2xl mx-auto">
            Agenda tu experiencia <span className="italic text-[#D4AF37]">exclusiva</span> con nuestras artistas
          </h3>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link 
              href="/agenda"
              className="bg-[#1A0E0A] text-white hover:bg-[#D4AF37] px-10 py-4 text-xs font-semibold tracking-[0.3em] uppercase transition-all duration-300"
            >
              Reservar Cita
            </Link>
            <Link
              href="/"
              className="border border-[#1A0E0A]/20 text-[#1A0E0A] hover:border-[#D4AF37] hover:text-[#D4AF37] px-10 py-4 text-xs font-semibold tracking-[0.3em] uppercase transition-all duration-300 bg-white/40 backdrop-blur-sm"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================
          POPUP DE DETALLES
          ============================================================ */}
      <AnimatePresence>
        {activeService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
            <div 
              onClick={() => setActiveService(null)} 
              className="fixed inset-0 bg-[#1A0E0A]/80 backdrop-blur-md" 
            />
            
            <div className="bg-[#FFFCF8] border border-[#D4AF37]/20 w-full max-w-4xl relative shadow-2xl overflow-hidden z-10 md:grid md:grid-cols-12 max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setActiveService(null)} 
                className="absolute top-4 right-4 z-30 bg-white border border-[#F0E4DA] p-2 rounded-full hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all"
              >
                <FaTimes className="text-xs" />
              </button>
              
              {/* IMAGEN LATERAL */}
              <div className="md:col-span-5 relative h-64 md:h-auto bg-[#FFF9F6]">
                <img 
                  src={CATEGORY_IMAGES[activeService.category] || CATEGORY_IMAGES.default} 
                  alt={activeService.name} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A0E0A]/60 via-transparent to-transparent md:bg-gradient-to-r" />
                
                <div className="absolute bottom-4 left-4 md:left-6 md:bottom-6 flex flex-wrap gap-2">
                  <span className="text-[8px] tracking-widest uppercase font-bold bg-white/90 backdrop-blur-sm text-[#1A0E0A] px-3 py-1.5 border border-[#D4AF37]/20">
                    {activeService.category}
                  </span>
                  {activeService.badge && (
                    <span className="text-[8px] tracking-widest uppercase font-bold bg-[#D4AF37] text-white px-3 py-1.5">
                      {activeService.badge}
                    </span>
                  )}
                </div>
              </div>

              {/* CONTENIDO */}
              <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h2 className="font-serif text-2xl md:text-3xl text-[#1A0E0A] font-light tracking-wide">
                      {activeService.name}
                    </h2>
                  </div>
                  
                  <p className="text-sm text-[#5C4A3E] font-light leading-relaxed">
                    {activeService.description || 'Tratamiento de autor del atelier, diseñado con técnicas exclusivas y productos de alta gama.'}
                  </p>

                  {activeService.subcategory && (
                    <span className="inline-block text-[8px] tracking-widest uppercase text-[#A89588] border border-[#F0E4DA] px-3 py-1.5 bg-white">
                      Subcategoría: {activeService.subcategory}
                    </span>
                  )}
                </div>

                {/* PRECIO Y DURACIÓN */}
                <div className="grid grid-cols-2 gap-4 border-y border-[#F0E4DA] py-5">
                  <div>
                    <span className="text-[8px] tracking-wider text-[#A89588] uppercase block font-bold">Inversión</span>
                    <span className="font-serif text-4xl text-[#1A0E0A] font-light">${activeService.price}</span>
                  </div>
                  <div>
                    <span className="text-[8px] tracking-wider text-[#A89588] uppercase block font-bold">Duración</span>
                    <span className="text-sm font-medium text-[#1A0E0A] flex items-center gap-2 mt-1">
                      <FaClock className="text-[#D4AF37]" /> 
                      {activeService.duration} minutos
                    </span>
                  </div>
                </div>

                {/* ARTISTA */}
                <div className="bg-[#FFF9F6] border border-[#F0E4DA] p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-white border border-[#F0E4DA] flex-shrink-0">
                    <img 
                      src={getProfesionalPorServicio(activeService.category).foto} 
                      alt={getProfesionalPorServicio(activeService.category).nombre} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <span className="text-[8px] tracking-widest uppercase text-[#D4AF37] block font-bold">Artista Especializada</span>
                    <span className="font-serif text-lg text-[#1A0E0A] font-light block">
                      {getProfesionalPorServicio(activeService.category).nombre}
                    </span>
                    <span className="text-[10px] text-[#A89588] block font-light">
                      {getProfesionalPorServicio(activeService.category).rol} · {getProfesionalPorServicio(activeService.category).experiencia} de experiencia
                    </span>
                  </div>
                </div>

                <Link 
                  href={`/agenda?service=${activeService.id}`} 
                  className="w-full block text-center bg-[#1A0E0A] hover:bg-[#D4AF37] text-white py-4 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300"
                >
                  Agendar este Tratamiento
                </Link>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}