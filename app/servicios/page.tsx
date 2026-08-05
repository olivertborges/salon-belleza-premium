// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaClock, FaHeart, FaEye, FaGem, FaBars, FaTimes, FaRegStar,
  FaArrowRight, FaUserTie, FaSparkles, FaQuoteLeft, FaAward
} from 'react-icons/fa'
import { 
  GiNails, GiSparkles, GiScissors, GiLipstick
} from 'react-icons/gi'

// ============================================================
// ICONOS POR CATEGORÍA
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
  'default': FaGem
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
// HEADER (IGUAL QUE LANDING)
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
// COMPONENTE PRINCIPAL
// ============================================================
export default function ServiciosPublicPage() {
  const [servicios, setServicios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [activeService, setActiveService] = useState<any | null>(null)
  const [galleryImages, setGalleryImages] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
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

        // OBTENER SERVICIOS
        let query = supabase
          .from('services')
          .select('id, name, description, price, duration, category, badge, is_active, subcategory, image_url')
          .eq('is_active', true)

        if (tenantId) {
          query = query.eq('tenant_id', tenantId)
        }

        const { data: servicesData, error: servicesError } = await query
          .order('category', { ascending: true })
          .order('name', { ascending: true })

        if (!servicesError && servicesData) {
          setServicios(servicesData)
        }

        // OBTENER IMÁGENES DE GALERÍA PARA FONDO
        const { data: galleryData } = await supabase
          .from('gallery')
          .select('image_url')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .limit(6)

        if (galleryData) {
          setGalleryImages(galleryData)
        }

      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const allCategories = ['Todos', ...new Set(servicios.map(s => s.category).filter(Boolean))]
  const filteredServicios = selectedCategory === 'Todos' ? servicios : servicios.filter(s => s.category === selectedCategory)
  const activeCategoriesList = selectedCategory === 'Todos' ? Array.from(new Set(servicios.map(s => s.category).filter(Boolean))) : [selectedCategory]

  // Obtener imagen de respaldo de la galería
  const getServiceImage = (servicio: any) => {
    if (servicio.image_url) return servicio.image_url
    if (galleryImages.length > 0) {
      const randomImage = galleryImages[Math.floor(Math.random() * galleryImages.length)]
      return randomImage.image_url
    }
    return 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop'
  }

  if (loading) {
    return (
      <main className="bg-[#FFF9F6] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-t-2 border-[#D4AF37] border-r-2 border-transparent rounded-full animate-spin" />
          <p className="text-[10px] text-[#A89588] tracking-[0.4em] uppercase font-bold">Cargando experiencias</p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF9F6] text-[#1A0E0A] antialiased selection:bg-[#D4AF37]/20">
      <Header />

      {/* FONDO DINÁMICO */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 right-[-10%] w-[50vw] h-[50vw] bg-[#F5D4E0]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-[-10%] w-[40vw] h-[40vw] bg-[#D4AF37]/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-30 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-40 pb-32 relative z-10">
        
        {/* HERO */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-20 space-y-6"
        >
          <div className="flex items-center justify-center gap-4">
            <span className="h-[1px] w-16 bg-[#D4AF37]" />
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#D4AF37]">EXPERIENCIAS DE AUTOR</span>
            <span className="h-[1px] w-16 bg-[#D4AF37]" />
          </div>
          
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-[#1A0E0A] leading-tight">
            El Arte de <br />
            <span className="italic font-normal text-[#D4AF37]">Embellecer</span>
          </h1>
          
          <p className="text-[#5C4A3E] font-light max-w-lg mx-auto text-base md:text-lg leading-relaxed">
            Descubre nuestra colección de tratamientos exclusivos, diseñados bajo la dirección de Any y ejecutados por nuestras artistas especializadas con más de 25 años de experiencia.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 border border-[#F0E4DA] rounded-full">
              <FaUserTie className="text-[#D4AF37] text-sm" />
              <span className="text-xs text-[#5C4A3E] font-light">25+ años de trayectoria</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 border border-[#F0E4DA] rounded-full">
              <FaAward className="text-[#D4AF37] text-sm" />
              <span className="text-xs text-[#5C4A3E] font-light">Certificaciones internacionales</span>
            </div>
          </div>
        </motion.div>

        {/* ESTADÍSTICAS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          <div className="text-center bg-white/60 backdrop-blur-sm border border-[#F0E4DA] p-6">
            <p className="font-serif text-3xl text-[#D4AF37]">{servicios.length}</p>
            <p className="text-[9px] tracking-[0.2em] text-[#5C4A3E] uppercase mt-1">Tratamientos</p>
          </div>
          <div className="text-center bg-white/60 backdrop-blur-sm border border-[#F0E4DA] p-6">
            <p className="font-serif text-3xl text-[#D4AF37]">25+</p>
            <p className="text-[9px] tracking-[0.2em] text-[#5C4A3E] uppercase mt-1">Años de Experiencia</p>
          </div>
          <div className="text-center bg-white/60 backdrop-blur-sm border border-[#F0E4DA] p-6">
            <p className="font-serif text-3xl text-[#D4AF37]">4.9</p>
            <p className="text-[9px] tracking-[0.2em] text-[#5C4A3E] uppercase mt-1">Calificación</p>
          </div>
          <div className="text-center bg-white/60 backdrop-blur-sm border border-[#F0E4DA] p-6">
            <p className="font-serif text-3xl text-[#D4AF37]">100%</p>
            <p className="text-[9px] tracking-[0.2em] text-[#5C4A3E] uppercase mt-1">Satisfacción</p>
          </div>
        </motion.div>

        {/* FILTROS */}
        {allCategories.length > 1 && (
          <div className="flex flex-wrap justify-center items-center gap-3 mb-16">
            {allCategories.map((cat) => {
              const count = cat === 'Todos' ? servicios.length : servicios.filter(s => s.category === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2.5 text-xs uppercase tracking-[0.15em] font-medium transition-all duration-300 border ${
                    selectedCategory === cat 
                      ? 'border-[#D4AF37] bg-[#D4AF37] text-white' 
                      : 'border-[#F0E4DA] bg-white/60 text-[#5C4A3E] hover:border-[#D4AF37] hover:text-[#D4AF37]'
                  }`}
                >
                  {cat}
                  <span className="ml-2 text-[9px] opacity-60">({count})</span>
                </button>
              )
            })}
          </div>
        )}

        {/* SERVICIOS - GRID DINÁMICO */}
        {filteredServicios.length === 0 ? (
          <div className="text-center py-24 bg-white/60 backdrop-blur-sm border border-[#F0E4DA]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#5C4A3E] font-light">No hay tratamientos disponibles</p>
          </div>
        ) : (
          <div className="space-y-24">
            {activeCategoriesList.map((categoryName, catIndex) => {
              const servicesInCategory = filteredServicios.filter(s => s.category === categoryName)
              if (servicesInCategory.length === 0) return null

              const Icon = CATEGORY_ICONS[categoryName] || CATEGORY_ICONS.default

              return (
                <motion.div 
                  key={categoryName}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: catIndex * 0.1 }}
                  className="space-y-10"
                >
                  {/* TÍTULO DE CATEGORÍA */}
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full">
                      <Icon className="text-[#D4AF37] text-xl" />
                    </div>
                    <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl text-[#1A0E0A] font-light tracking-wide">
                      {categoryName}
                    </h2>
                    <span className="text-[9px] text-[#A89588] font-light ml-auto bg-white/60 backdrop-blur-sm px-4 py-1.5 border border-[#F0E4DA]">
                      {servicesInCategory.length} tratamientos
                    </span>
                  </div>

                  {/* TARJETAS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {servicesInCategory.map((servicio, idx) => {
                      const imageUrl = getServiceImage(servicio)
                      const profesional = getProfesionalPorServicio(servicio.category)
                      
                      return (
                        <motion.div
                          key={servicio.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: idx * 0.05 }}
                          onClick={() => setActiveService(servicio)}
                          className="group relative bg-white border border-[#F0E4DA] overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 hover:border-[#D4AF37]"
                        >
                          {/* IMAGEN */}
                          <div className="relative aspect-[4/3] overflow-hidden bg-[#FFF9F6]">
                            <img 
                              src={imageUrl} 
                              alt={servicio.name} 
                              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0E0A]/80 via-[#1A0E0A]/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />
                            
                            {/* BADGES */}
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
                            
                            {/* CONTENIDO OVERLAY */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                              <div className="flex items-start justify-between">
                                <div className="space-y-2 flex-1">
                                  <h3 className="font-serif text-xl leading-tight font-light tracking-wide">
                                    {servicio.name}
                                  </h3>
                                  <div className="flex items-center gap-4 text-[10px] text-white/70">
                                    <span className="flex items-center gap-1.5">
                                      <FaClock className="text-[#D4AF37] text-[10px]" />
                                      {servicio.duration} min
                                    </span>
                                    <span className="w-px h-3 bg-white/20" />
                                    <span className="font-serif font-light text-white">
                                      ${servicio.price}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[8px] tracking-widest uppercase font-bold border border-white/30 bg-white/10 backdrop-blur-md px-3 py-1.5 whitespace-nowrap group-hover:bg-[#D4AF37] group-hover:border-[#D4AF37] transition-all duration-300">
                                  Ver Ficha
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* ARTISTA */}
                          <div className="p-4 flex items-center gap-3 border-t border-[#F0E4DA] bg-[#FFFCF8]">
                            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#F0E4DA] flex-shrink-0 group-hover:border-[#D4AF37] transition-all duration-300">
                              <img src={profesional.foto} alt={profesional.nombre} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[8px] tracking-widest uppercase text-[#D4AF37] font-bold">Artista</p>
                              <p className="text-sm font-medium text-[#1A0E0A] truncate">{profesional.nombre}</p>
                            </div>
                            <span className="text-[7px] tracking-widest text-[#A89588] border border-[#F0E4DA] px-2 py-1 bg-white">
                              {profesional.experiencia}
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* CTA FINAL */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mt-28 pt-20 border-t border-[#F0E4DA]"
        >
          <div className="max-w-2xl mx-auto space-y-6">
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-semibold">¿Lista para tu experiencia?</p>
            <h3 className="font-serif text-3xl md:text-4xl text-[#1A0E0A] font-light">
              Agenda tu sesión <span className="italic text-[#D4AF37]">exclusiva</span>
            </h3>
            <p className="text-sm text-[#5C4A3E] font-light">
              Reserva tu cita y vive una experiencia única de belleza y bienestar.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
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
        </motion.div>
      </div>

      {/* ============================================================
          POPUP DE DETALLES
          ============================================================ */}
      <AnimatePresence>
        {activeService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setActiveService(null)} 
              className="fixed inset-0 bg-[#1A0E0A]/80 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#FFFCF8] border border-[#D4AF37]/20 w-full max-w-4xl relative shadow-2xl overflow-hidden z-10 md:grid md:grid-cols-12 max-h-[95vh] md:max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setActiveService(null)} 
                className="absolute top-4 right-4 z-30 bg-white border border-[#F0E4DA] p-2 rounded-full hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all"
              >
                <FaTimes className="text-xs" />
              </button>
              
              {/* IMAGEN */}
              <div className="md:col-span-5 relative h-64 md:h-auto bg-[#FFF9F6]">
                <img 
                  src={getServiceImage(activeService)} 
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
                  <h2 className="font-serif text-2xl md:text-3xl text-[#1A0E0A] font-light tracking-wide">
                    {activeService.name}
                  </h2>
                  
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}