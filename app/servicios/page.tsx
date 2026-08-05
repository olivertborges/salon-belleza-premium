// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaClock, FaHeart, FaEye, FaGem, FaBars, FaTimes, FaRegStar,
  FaUserTie, FaAward
} from 'react-icons/fa'
import { 
  GiNails, GiSparkles, GiScissors, GiLipstick
} from 'react-icons/gi'

// ============================================================
// ICONOS Y ASSETS POR CATEGORÍA
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

const CATEGORY_IMAGES: Record<string, string> = {
  'Uñas': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop',
  'Micropigmentación': 'https://plus.unsplash.com/premium_photo-1661580887141-7adca5e04c02?w=600&h=400&fit=crop',
  'Peluquería': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=400&fit=crop',
  'Cejas': 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=600&h=400&fit=crop',
  'Estética': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop',
  'Depilación': 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=400&fit=crop',
  'Pestañas': 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&h=400&fit=crop',
  'default': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop'
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
// ANIMACIONES
// ============================================================
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

// ============================================================
// HEADER Y NAVEGACIÓN
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
        : 'bg-[#FFFCF8]/60 backdrop-blur-sm border-b border-[#D4AF37]/5 py-5'
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
                item === 'Servicios' ? 'text-[#D4AF37] border-b border-[#D4AF37] pb-1' : ''
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
// COMPONENTE PRINCIPAL CON ESTRATEGIA DE FALLBACK EN SUPABASE
// ============================================================
export default function ServiciosPublicPage() {
  const [servicios, setServicios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [activeService, setActiveService] = useState<any | null>(null)
  const [debugError, setDebugError] = useState<string | null>(null)

  useEffect(() => {
    const fetchServiciosRobust = async () => {
      try {
        setLoading(true)
        setDebugError(null)

        // 1. Obtener Tenant ID desde la sesión si está autenticado
        let tenantId = null
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.user_metadata?.tenant_id) tenantId = session.user.user_metadata.tenant_id
        if (!tenantId && session?.user?.app_metadata?.tenant_id) tenantId = session.user.app_metadata.tenant_id

        // 2. INTENTO 1: Buscar servicios filtrando por tenant_id e is_active
        let query1 = supabase.from('services').select('*')
        if (tenantId) query1 = query1.eq('tenant_id', tenantId)
        query1 = query1.eq('is_active', true)

        let { data, error } = await query1

        // 3. INTENTO 2: Si no trajo datos o falló, buscar SIN el filtro de `is_active`
        if (!error && (!data || data.length === 0)) {
          let query2 = supabase.from('services').select('*')
          if (tenantId) query2 = query2.eq('tenant_id', tenantId)
          const res2 = await query2
          if (res2.data && res2.data.length > 0) {
            data = res2.data
          }
        }

        // 4. INTENTO 3: Fallback Total — Traer absolutamente todos los registros de `services`
        if (!data || data.length === 0) {
          const res3 = await supabase.from('services').select('*').limit(50)
          if (res3.data && res3.data.length > 0) {
            data = res3.data
          } else if (res3.error) {
            error = res3.error
          }
        }

        if (error) {
          console.error('Error Supabase:', error)
          setDebugError(`Error al consultar Supabase: ${error.message}`)
        } else if (data && data.length > 0) {
          setServicios(data)
        } else {
          setDebugError('La tabla "services" se encuentra vacía en Supabase.')
        }
      } catch (err: any) {
        console.error('Error imprevisto:', err)
        setDebugError(`Excepción de red/código: ${err?.message || 'Error desconocido'}`)
      } finally {
        setLoading(false)
      }
    }

    fetchServiciosRobust()
  }, [])

  const allCategories = ['Todos', ...new Set(servicios.map(s => s.category).filter(Boolean))]
  const filteredServicios = selectedCategory === 'Todos' ? servicios : servicios.filter(s => s.category === selectedCategory)
  const activeCategoriesList = selectedCategory === 'Todos' ? Array.from(new Set(servicios.map(s => s.category).filter(Boolean))) : [selectedCategory]

  const getServiceImage = (servicio: any) => {
    if (servicio.image_url) return servicio.image_url
    if (servicio.category && CATEGORY_IMAGES[servicio.category]) return CATEGORY_IMAGES[servicio.category]
    return CATEGORY_IMAGES.default
  }

  if (loading) {
    return (
      <main className="bg-[#FFF9F6] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-t-2 border-[#D4AF37] border-r-2 border-transparent rounded-full animate-spin" />
          <p className="text-[10px] text-[#A89588] tracking-[0.4em] uppercase font-bold">Cargando Servicios</p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF9F6] text-[#1A0E0A] antialiased relative selection:bg-[#D4AF37]/20">
      <Header />

      {/* AMBIENTE DE FONDO */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 right-[-10%] w-[50vw] h-[50vw] bg-[#F5D4E0]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-[-10%] w-[40vw] h-[40vw] bg-[#D4AF37]/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-30 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-40 pb-32 relative z-10">
        
        {/* ENCABEZADO DE SECCIÓN */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16 space-y-6"
        >
          <div className="flex items-center justify-center gap-4">
            <span className="h-[1px] w-12 bg-[#D4AF37]" />
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#D4AF37]">VISUAL ATELIER MENU</span>
            <span className="h-[1px] w-12 bg-[#D4AF37]" />
          </div>
          
          <h1 className="font-serif text-4xl sm:text-6xl font-light tracking-tight text-[#1A0E0A] leading-tight">
            Colección de <br />
            <span className="italic font-normal text-[#D4AF37]">Tratamientos Exclusivos</span>
          </h1>
          
          <p className="text-[#5C4A3E] font-light max-w-lg mx-auto text-base md:text-lg leading-relaxed">
            Explora nuestras técnicas dermoestéticas y rituales de autor diseñados para realzar tu belleza natural.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 border border-[#F0E4DA] rounded-full">
              <FaUserTie className="text-[#D4AF37] text-xs" />
              <span className="text-xs text-[#5C4A3E] font-light">Técnicas de Autor</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 border border-[#F0E4DA] rounded-full">
              <FaAward className="text-[#D4AF37] text-xs" />
              <span className="text-xs text-[#5C4A3E] font-light">25+ Años de Experiencia</span>
            </div>
          </div>
        </motion.div>

        {/* MUESTRA INFORMACIÓN DE DEPURACIÓN EN CASO DE ERROR */}
        {debugError && (
          <div className="max-w-2xl mx-auto my-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center text-amber-800 text-xs font-mono">
            ⚠️ <strong>Aviso de conexión:</strong> {debugError}
          </div>
        )}

        {/* NAVEGACIÓN Y FILTROS POR CATEGORÍA */}
        {allCategories.length > 1 && (
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 mb-20 border-b border-[#F0E4DA] pb-6 max-w-4xl mx-auto">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 pb-2 relative ${
                  selectedCategory === cat ? 'text-[#D4AF37]' : 'text-[#A89588] hover:text-[#1A0E0A]'
                }`}
              >
                {cat}
                {selectedCategory === cat && (
                  <motion.div layoutId="activeFilterLine" className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#D4AF37]" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* VISTA Y TARJETAS DE SERVICIOS */}
        {filteredServicios.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-sm border border-[#F0E4DA] max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-[#5C4A3E] font-light">
              No hay servicios registrados para mostrar.
            </p>
          </div>
        ) : (
          <div className="space-y-24">
            {activeCategoriesList.map((categoryName) => {
              const servicesInCategory = filteredServicios.filter(s => s.category === categoryName)
              if (servicesInCategory.length === 0) return null

              const IconComponent = CATEGORY_ICONS[categoryName] || CATEGORY_ICONS.default

              return (
                <div key={categoryName} className="space-y-10">
                  {/* ENCABEZADO DE CATEGORÍA */}
                  <div className="flex items-center gap-4 border-b border-[#D4AF37]/20 pb-4">
                    <div className="p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full">
                      <IconComponent className="text-[#D4AF37] text-lg" />
                    </div>
                    <h2 className="font-serif text-2xl md:text-3xl text-[#1A0E0A] font-light tracking-wide">
                      {categoryName || 'General'}
                    </h2>
                    <span className="w-full h-[1px] bg-[#F0E4DA]" />
                    <span className="text-[9px] text-[#A89588] tracking-widest uppercase font-light whitespace-nowrap bg-white/80 px-3 py-1 border border-[#F0E4DA]">
                      {servicesInCategory.length} Obras
                    </span>
                  </div>

                  {/* GRID EDITORIAL */}
                  <motion.div 
                    initial="hidden" 
                    whileInView="visible" 
                    viewport={{ once: true }} 
                    variants={staggerContainer} 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                  >
                    {servicesInCategory.map((servicio) => {
                      const imageUrl = getServiceImage(servicio)
                      const profesional = getProfesionalPorServicio(servicio.category)
                      
                      return (
                        <motion.div
                          key={servicio.id || servicio.name}
                          variants={fadeInUp}
                          onClick={() => setActiveService(servicio)}
                          className="group bg-white border border-[#F0E4DA] overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-[#D4AF37]"
                        >
                          {/* CONTENEDOR DE IMAGEN */}
                          <div className="relative aspect-[4/3] overflow-hidden bg-[#FFF9F6]">
                            <img 
                              src={imageUrl} 
                              alt={servicio.name} 
                              className="w-full h-full object-cover filter grayscale-[15%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0E0A]/90 via-[#1A0E0A]/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                            
                            {/* BADGES */}
                            <div className="absolute top-4 left-4 flex gap-2">
                              {servicio.category && (
                                <span className="text-[7px] tracking-widest uppercase font-bold bg-white/90 backdrop-blur-sm text-[#1A0E0A] px-3 py-1.5 border border-[#D4AF37]/20">
                                  {servicio.category}
                                </span>
                              )}
                              {servicio.badge && (
                                <span className="text-[7px] tracking-widest uppercase font-bold bg-[#D4AF37] text-white px-3 py-1.5">
                                  {servicio.badge}
                                </span>
                              )}
                            </div>

                            {/* TEXTO EN TARJETA */}
                            <div className="absolute bottom-0 left-0 right-0 p-5 text-white flex justify-between items-end z-10">
                              <div className="space-y-1 max-w-[70%]">
                                <h3 className="font-serif text-lg leading-tight font-light tracking-wide truncate">
                                  {servicio.name}
                                </h3>
                                <div className="flex items-center gap-3 text-[10px] text-white/70">
                                  {servicio.duration && (
                                    <span className="flex items-center gap-1">
                                      <FaClock className="text-[#D4AF37]" /> {servicio.duration} min
                                    </span>
                                  )}
                                  {servicio.duration && servicio.price && <span>•</span>}
                                  {servicio.price && (
                                    <span className="font-serif text-white font-light">${servicio.price}</span>
                                  )}
                                </div>
                              </div>

                              <span className="text-[8px] tracking-widest uppercase font-bold border border-white/30 bg-white/10 backdrop-blur-md px-3 py-1.5 whitespace-nowrap group-hover:bg-[#D4AF37] group-hover:border-[#D4AF37] transition-all">
                                Ver Ficha
                              </span>
                            </div>
                          </div>

                          {/* PIE DE TARJETA */}
                          <div className="p-4 flex items-center justify-between border-t border-[#F0E4DA] bg-[#FFFCF8]">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#D4AF37]/40 flex-shrink-0">
                                <img src={profesional.foto} alt={profesional.nombre} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <span className="text-[7px] tracking-widest uppercase text-[#D4AF37] font-bold block">Master Artista</span>
                                <span className="text-xs font-medium text-[#1A0E0A]">{profesional.nombre}</span>
                              </div>
                            </div>
                            <span className="text-[8px] text-[#A89588] tracking-widest uppercase">
                              {profesional.experiencia}
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                </div>
              )
            })}
          </div>
        )}

        {/* CTA FINAL */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-28 pt-20 border-t border-[#F0E4DA]"
        >
          <div className="max-w-2xl mx-auto space-y-6">
            <span className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-semibold block">ATELIER PRIVADO</span>
            <h3 className="font-serif text-3xl md:text-4xl text-[#1A0E0A] font-light">
              ¿Lista para transformar tu <span className="italic text-[#D4AF37]">Experiencia</span>?
            </h3>
            <p className="text-sm text-[#5C4A3E] font-light">
              Reserva tu cita con antelación para asegurar disponibilidad con nuestras maestras especializadas.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link 
                href="/agenda"
                className="bg-[#1A0E0A] text-white hover:bg-[#D4AF37] px-10 py-4 text-xs font-semibold tracking-[0.3em] uppercase transition-all duration-300"
              >
                Reservar Cita Ahora
              </Link>
            </div>
          </div>
        </motion.div>

      </div>

      {/* POPUP DE DETALLES */}
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
              className="bg-[#FFFCF8] border border-[#D4AF37]/20 w-full max-w-3xl relative shadow-2xl overflow-hidden z-10 md:grid md:grid-cols-12 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setActiveService(null)} 
                className="absolute top-4 right-4 z-30 bg-white border border-[#F0E4DA] p-2 rounded-full hover:border-[#D4AF37] transition-colors"
              >
                <FaTimes className="text-xs" />
              </button>
              
              <div className="md:col-span-5 relative h-64 md:h-auto bg-[#FFF9F6]">
                <img 
                  src={getServiceImage(activeService)} 
                  alt={activeService.name} 
                  className="w-full h-full object-cover" 
                />
              </div>

              <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <span className="text-[9px] tracking-[0.3em] font-bold uppercase text-[#D4AF37] block">
                    {activeService.category || 'General'}
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl text-[#1A0E0A] font-light tracking-wide">
                    {activeService.name}
                  </h2>
                  <p className="text-xs text-[#5C4A3E] font-light leading-relaxed">
                    {activeService.description || 'Tratamiento exclusivo del atelier diseñado para proporcionar el máximo nivel de estética y cuidado.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-y border-[#F0E4DA] py-4">
                  <div>
                    <span className="text-[8px] tracking-wider text-[#A89588] uppercase block font-bold">Inversión</span>
                    <span className="font-serif text-3xl text-[#1A0E0A] font-light">${activeService.price || 0}</span>
                  </div>
                  <div>
                    <span className="text-[8px] tracking-wider text-[#A89588] uppercase block font-bold">Duración</span>
                    <span className="text-xs font-medium text-[#1A0E0A] flex items-center gap-2 mt-2">
                      <FaClock className="text-[#D4AF37]" /> {activeService.duration || '--'} min
                    </span>
                  </div>
                </div>

                <div className="bg-[#FFF9F6] border border-[#F0E4DA] p-3 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-white border border-[#F0E4DA]">
                    <img 
                      src={getProfesionalPorServicio(activeService.category).foto} 
                      alt="Profesional" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <span className="text-[8px] tracking-widest uppercase text-[#D4AF37] block font-bold">Artista Especializada</span>
                    <span className="font-serif text-sm text-[#1A0E0A] font-normal block">
                      {getProfesionalPorServicio(activeService.category).nombre}
                    </span>
                    <span className="text-[9px] text-[#A89588] block font-light">
                      {getProfesionalPorServicio(activeService.category).rol}
                    </span>
                  </div>
                </div>

                <Link 
                  href={`/agenda?service=${activeService.id}`} 
                  className="w-full block text-center bg-[#1A0E0A] hover:bg-[#D4AF37] text-white py-3.5 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300"
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
