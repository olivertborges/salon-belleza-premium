// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaClock, FaArrowRight, FaHeart, FaEye, FaGem,
  FaBars, FaTimes, FaRegStar
} from 'react-icons/fa'
import { 
  GiNails, GiSparkles, GiScissors
} from 'react-icons/gi'

// ✅ ICONOS POR CATEGORÍA BASE (Respaldo si no se procesa la columna icon)
const CATEGORY_ICONS: Record<string, any> = {
  'Uñas': GiNails,
  'Micropigmentación': GiSparkles,
  'Peluquería': GiScissors,
  'Cejas': FaRegStar,
  'Estética': GiSparkles,
  'Depilación': FaHeart,
  'Pestañas': FaEye,
  'default': FaGem
}

// ✅ IMÁGENES EDITORIALES FIJAS SEGÚN TU CATEGORÍA REAL
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

// ✅ RELACIÓN DE ARTISTAS DEL ATELIER POR CATEGORÍA
const getProfesionalPorServicio = (category: string) => {
  const cat = category?.toLowerCase() || ''
  if (cat.includes('uña') || cat.includes('micro') || cat.includes('ceja') || cat.includes('pestaña')) {
    return {
      nombre: 'Any',
      rol: 'Nail & Derm Master',
      foto: 'https://kzovcbefedfmpeucrofh.supabase.co/storage/v1/object/public/profesionals/any.png'
    }
  }
  if (cat.includes('pelu') || cat.includes('depil') || cat.includes('corte') || cat.includes('color')) {
    return {
      nombre: 'Sil',
      rol: 'Hair & Body Expert',
      foto: 'https://kzovcbefedfmpeucrofh.supabase.co/storage/v1/object/public/profesionals/sil.png'
    }
  }
  return {
    nombre: 'Especialista Fresh',
    rol: 'Stylist Atelier',
    foto: 'https://kzovcbefedfmpeucrofh.supabase.co/storage/v1/object/public/profesionals/any.png'
  }
}

// ✅ ANIMACIONES FRAMER MOTION
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

// ============================================================
// COMPONENTE: HEADER NAVEGACIÓN
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
          <span className="text-[#1A0E0A] font-serif text-2xl tracking-[0.15em] transition-colors duration-300 group-hover:text-[#D4AF37]">
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
              href={`/#${item.toLowerCase()}`} 
              className="text-xs uppercase tracking-[0.2em] text-[#5C4A3E] hover:text-[#D4AF37] transition-all font-medium"
            >
              {item}
            </Link>
          ))}
          <Link 
            href="/agenda" 
            className="border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white px-7 py-3 text-[11px] font-medium tracking-[0.25em] uppercase transition-all rounded-none"
          >
            Reservar Cita
          </Link>
        </nav>

        <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-[#1A0E0A] hover:text-[#D4AF37] p-2">
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
                  href={`/#${item.toLowerCase()}`} 
                  className="text-xs uppercase tracking-[0.2em] text-[#5C4A3E] hover:text-[#D4AF37]" 
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

  // ✅ CONTROLADOR DE TENANT ID OPTIMIZADO
  const getTenantId = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.user_metadata?.tenant_id) return session.user.user_metadata.tenant_id
      if (session?.user?.app_metadata?.tenant_id) return session.user.app_metadata.tenant_id

      if (session?.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', session.user.id)
          .maybeSingle()
        if (profile?.tenant_id) return profile.tenant_id
      }

      const { data: firstService } = await supabase
        .from('services')
        .select('tenant_id')
        .limit(1)
        .maybeSingle()
      if (firstService?.tenant_id) return firstService.tenant_id

      return null
    } catch (error) {
      console.error('Error obteniendo tenant_id:', error)
      return null
    }
  }

  // ✅ EFECTO DE PETICIÓN A SUPABASE
  useEffect(() => {
    const fetchServicios = async () => {
      try {
        setLoading(true)
        const tenantId = await getTenantId()

        if (!tenantId) {
          setServicios([])
          setLoading(false)
          return
        }

        // Usamos exactamente los nombres de tus columnas reales
        const { data, error } = await supabase
          .from('services')
          .select('id, name, description, price, duration, category, badge, is_active, subcategory')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('name', { ascending: true })

        if (error) {
          console.error('Error cargando servicios:', error)
          setServicios([])
        } else {
          setServicios(data || [])
        }
      } catch (error) {
        console.error('Error general en fetchServicios:', error)
        setServicios([])
      } finally {
        setLoading(false)
      }
    }

    fetchServicios()
  }, [])

  // Mapeo dinámico de categorías a partir de la BD
  const allCategories = ['Todos', ...new Set(servicios.map(s => s.category).filter(Boolean))]
  
  const filteredServicios = selectedCategory === 'Todos'
    ? servicios
    : servicios.filter(s => s.category === selectedCategory)

  const activeCategoriesList = selectedCategory === 'Todos'
    ? Array.from(new Set(servicios.map(s => s.category).filter(Boolean)))
    : [selectedCategory]

  if (loading) {
    return (
      <main className="bg-[#FFF9F6] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-t-2 border-[#D4AF37] border-r-2 border-transparent rounded-full animate-spin" />
          <p className="text-[10px] text-[#A89588] tracking-[0.4em] uppercase font-bold">Desplegando el dossier del atelier...</p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF9F6] text-[#1A0E0A] antialiased relative selection:bg-[#D4AF37]/20">
      <Header />

      {/* Fondos y Texturas Estéticas */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 right-[-10%] w-[50vw] h-[50vw] bg-[#F5D4E0]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-[-10%] w-[50vw] h-[50vw] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-40 pb-32 relative z-10">
        
        {/* Encabezado Editorial */}
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#D4AF37]">VISUAL ATELIER MENU</span>
          <h1 className="font-serif text-4xl sm:text-6xl font-light tracking-tight text-[#1A0E0A] leading-tight">
            Nuestro Menú de <span className="italic font-normal text-[#D4AF37]">Tratamientos</span>
          </h1>
          <div className="w-12 h-[1px] bg-[#D4AF37] mx-auto mt-4" />
          <p className="text-sm text-[#5C4A3E] font-light max-w-md mx-auto leading-relaxed">
            Explora las disciplinas haciendo clic sobre cada fotografía para descubrir su valor, tiempos e ingeniería artística asignada.
          </p>
        </div>

        {/* Filtros Interactivos */}
        {allCategories.length > 1 && (
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 mb-24 border-b border-[#F0E4DA] pb-6 max-w-4xl mx-auto">
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
                  <motion.div 
                    layoutId="activeFilterLine"
                    className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#D4AF37]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Galería Fotográfica Pura */}
        {filteredServicios.length === 0 ? (
          <div className="text-center py-24 bg-white border border-[#F0E4DA]">
            <FaGem className="w-6 h-6 text-[#A89588]/40 mx-auto mb-4" />
            <p className="text-xs uppercase tracking-[0.2em] text-[#5C4A3E] font-light">No hay tratamientos activos en este segmento.</p>
          </div>
        ) : (
          <div className="space-y-24">
            {activeCategoriesList.map((categoryName) => {
              const servicesInCategory = filteredServicios.filter(s => s.category === categoryName)
              
              if (servicesInCategory.length === 0) return null

              return (
                <div key={categoryName} className="space-y-8">
                  {/* Divisor Visual de Categorías */}
                  <div className="flex items-center gap-4 border-b border-[#D4AF37]/20 pb-4">
                    <h2 className="font-serif text-2xl md:text-3xl text-[#1A0E0A] font-light tracking-wide">
                      {categoryName}
                    </h2>
                    <span className="w-full h-[1px] bg-[#F0E4DA]" />
                    <span className="text-[9px] text-[#A89588] tracking-widest font-light uppercase whitespace-nowrap">
                      {servicesInCategory.length} {servicesInCategory.length === 1 ? 'Ritual' : 'Rituales'}
                    </span>
                  </div>

                  {/* Grid Interactiva */}
                  <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.02 }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {servicesInCategory.map((servicio) => {
                      // Se asigna la imagen según su categoría real de la BD
                      const imageUrl = CATEGORY_IMAGES[servicio.category] || CATEGORY_IMAGES.default
                      
                      return (
                        <motion.div
                          key={servicio.id}
                          variants={fadeInUp}
                          onClick={() => setActiveService(servicio)}
                          className="relative aspect-[4/3] overflow-hidden bg-[#FFF9F6] border border-[#F0E4DA] group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500"
                        >
                          <img 
                            src={imageUrl} 
                            alt={servicio.name}
                            className="w-full h-full object-cover filter grayscale-[25%] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1A0E0A]/90 via-[#1A0E0A]/10 to-transparent opacity-85 group-hover:opacity-90 transition-opacity duration-300" />
                          
                          {/* Insignia dinámica si viene configurada desde la BD */}
                          {servicio.badge && (
                            <span className="absolute top-4 left-4 z-10 text-[8px] tracking-[0.2em] font-bold uppercase bg-[#D4AF37] text-white px-2.5 py-1">
                              {servicio.badge}
                            </span>
                          )}

                          {/* Textos fijados en la fotografía */}
                          <div className="absolute bottom-0 left-0 right-0 p-5 text-white flex justify-between items-end z-10">
                            <div className="max-w-[75%] space-y-0.5">
                              <span className="text-[8px] tracking-[0.2em] uppercase text-[#D4AF37] font-semibold block">
                                ✦ {servicio.subcategory || servicio.category}
                              </span>
                              <h3 className="font-serif text-lg leading-tight font-light tracking-wide truncate">
                                {servicio.name}
                              </h3>
                            </div>
                            <span className="text-[9px] tracking-widest uppercase font-bold border border-white/25 bg-white/10 backdrop-blur-md px-3 py-1.5 whitespace-nowrap group-hover:bg-[#D4AF37] group-hover:border-[#D4AF37] transition-all duration-300">
                              Ver Ficha
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
      </div>

      {/* ============================================================
          MODAL INTERACTIVO DE DETALLES EXCLUSIVO (POPUP FLOTANTE)
         ============================================================ */}
      <AnimatePresence>
        {activeService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveService(null)}
              className="fixed inset-0 bg-[#1A0E0A]/70 backdrop-blur-md"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-[#FFFCF8] border border-[#D4AF37]/20 w-full max-w-3xl relative shadow-2xl overflow-hidden z-10 md:grid md:grid-cols-12 max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible"
            >
              <button 
                onClick={() => setActiveService(null)}
                className="absolute top-4 right-4 z-30 bg-white border border-[#F0E4DA] p-2 rounded-full text-[#1A0E0A] hover:text-[#D4AF37] transition-colors shadow-sm focus:outline-none"
              >
                <FaTimes className="text-xs" />
              </button>

              {/* Lado A: Fotografía a Gran Escala */}
              <div className="md:col-span-5 relative h-60 md:h-auto min-h-[280px] bg-[#FFF9F6]">
                <img 
                  src={CATEGORY_IMAGES[activeService.category] || CATEGORY_IMAGES.default} 
                  alt={activeService.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[#1A0E0A]/5" />
              </div>

              {/* Lado B: Métricas de la Base de Datos */}
              <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <span className="text-[9px] tracking-[0.3em] font-bold uppercase text-[#D4AF37] block">
                    {activeService.category} {activeService.subcategory && `• ${activeService.subcategory}`}
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl text-[#1A0E0A] font-light tracking-wide leading-tight">
                    {activeService.name}
                  </h2>
                  <div className="w-10 h-[1px] bg-[#D4AF37] my-3" />
                  <p className="text-xs text-[#5C4A3E] font-light leading-relaxed">
                    {activeService.description || 'Este tratamiento exclusivo fusiona metodologías avanzadas de vanguardia con activos selectos de nuestro atelier para esculpir y embellecer bajo un diagnóstico personalizado.'}
                  </p>
                </div>

                {/* Métricas Reales */}
                <div className="grid grid-cols-2 gap-4 border-y border-[#F0E4DA] py-4">
                  <div>
                    <span className="text-[8px] tracking-wider text-[#A89588] uppercase block">Inversión</span>
                    <span className="font-serif text-3xl text-[#1A0E0A] font-medium">${activeService.price}</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[8px] tracking-wider text-[#A89588] uppercase block">Duración Estimada</span>
                    <span className="text-xs font-semibold text-[#1A0E0A] flex items-center gap-1.5 mt-1">
                      <FaClock className="text-[#D4AF37] text-[10px]" /> {activeService.duration} minutos
                    </span>
                  </div>
                </div>

                {/* Tarjeta de la Profesional */}
                <div className="bg-[#FFF9F6] border border-[#F0E4DA] p-3 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-[#D4AF37]/30 bg-white flex-shrink-0">
                    <img 
                      src={getProfesionalPorServicio(activeService.category).foto} 
                      alt={getProfesionalPorServicio(activeService.category).nombre}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] tracking-widest uppercase text-[#D4AF37] block font-bold">Artista Especializada</span>
                    <span className="font-serif text-sm text-[#1A0E0A] font-normal block">
                      {getProfesionalPorServicio(activeService.category).nombre}
                    </span>
                    <span className="text-[9px] text-[#A89588] block font-light">
                      {getProfesionalPorServicio(activeService.category).rol}
                    </span>
                  </div>
                </div>

                {/* Acción Directa pasando el ID por URL */}
                <div className="pt-2">
                  <Link 
                    href={`/agenda?service=${activeService.id}`}
                    className="w-full block text-center bg-[#1A0E0A] hover:bg-[#D4AF37] text-white py-3.5 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300"
                  >
                    Agendar este Tratamiento
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-[#150B08] text-white/40 border-t border-white/5 text-xs font-light relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] tracking-wider uppercase">
          <p>© 2026 Salon Fresh Nails. Todos los derechos reservados.</p>
          <Link href="/" className="hover:text-[#D4AF37] transition-colors">← Volver al Atelier Principal</Link>
        </div>
      </footer>
    </div>
  )
}
