// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaClock, FaBars, FaTimes, FaInstagram, FaWhatsapp, FaMapMarkerAlt
} from 'react-icons/fa'

// ✅ IMÁGENES DE RESPALDO ASEGURADAS POR CATEGORÍA
const CATEGORY_IMAGES: Record<string, string> = {
  'Uñas': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop',
  'Micropigmentación': 'https://plus.unsplash.com/premium_photo-1661580887141-7adca5e04c02?w=600&h=400&fit=crop',
  'Microblading': 'https://plus.unsplash.com/premium_photo-1661580887141-7adca5e04c02?w=600&h=400&fit=crop',
  'Peluquería': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=400&fit=crop',
  'Cejas': 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=600&h=400&fit=crop',
  'Estética': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop',
  'Depilación': 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=400&fit=crop',
  'Pestañas': 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&h=400&fit=crop',
  'default': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop'
}

// ✅ MAPEO DE PROFESIONALES (ANY / SIL) SEGÚN TUS RUTA DE STORAGE
const getProfesionalPorServicio = (category: string) => {
  const cat = category?.toLowerCase() || ''
  
  if (
    cat.includes('uña') || 
    cat.includes('micro') || 
    cat.includes('ceja') || 
    cat.includes('pestaña') || 
    cat.includes('blading') || 
    cat.includes('pigment')
  ) {
    return {
      nombre: 'Any',
      rol: 'Nail & Derm Master',
      foto: 'https://kzovcbefedfmpeucrofh.supabase.co/storage/v1/object/public/profesionals/any.png'
    }
  }
  
  if (
    cat.includes('pelu') || 
    cat.includes('depil') || 
    cat.includes('corte') || 
    cat.includes('color') || 
    cat.includes('este')
  ) {
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

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

export default function LandingPage() {
  const [servicios, setServicios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [activeService, setActiveService] = useState<any | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Control del scroll del Header
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Múltiples fallbacks automáticos para conseguir el tenant_id
  const getTenantId = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.user_metadata?.tenant_id) return session.user.user_metadata.tenant_id
      if (session?.user?.app_metadata?.tenant_id) return session.user.app_metadata.tenant_id

      if (session?.user?.id) {
        const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', session.user.id).maybeSingle() as any
        if (profile?.tenant_id) return profile.tenant_id
      }

      const { data: firstService } = await supabase.from('services').select('tenant_id').limit(1).maybeSingle() as any
      if (firstService?.tenant_id) return firstService.tenant_id

      return null
    } catch (error) {
      return null
    }
  }

  // Carga de todo el portafolio
  useEffect(() => {
    const fetchServicios = async () => {
      try {
        setLoading(true)
        const tenantId = await getTenantId()
        if (!tenantId) { setServicios([]); setLoading(false); return }

        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('category', { ascending: true })

        if (!error && data) setServicios(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchServicios()
  }, [])

  const allCategories = ['Todos', ...new Set(servicios.map(s => s.category).filter(Boolean))]
  
  const filteredServicios = selectedCategory === 'Todos'
    ? servicios
    : servicios.filter(s => s.category === selectedCategory)

  const activeCategoriesList = selectedCategory === 'Todos'
    ? Array.from(new Set(servicios.map(s => s.category).filter(Boolean)))
    : [selectedCategory]

  return (
    <div className="min-h-screen bg-[#FFFCF8] text-[#1A0E0A] antialiased font-sans relative selection:bg-[#D4AF37]/20">
      
      {/* ============================================================
          HEADER DE NAVEGACIÓN FLUIDO
         ============================================================ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-[#FFFCF8]/90 backdrop-blur-md border-b border-[#D4AF37]/10 py-4 shadow-sm' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
          <Link href="#" className="flex flex-col tracking-widest group">
            <span className="text-[#1A0E0A] font-serif text-2xl tracking-[0.15em] transition-colors group-hover:text-[#D4AF37]">
              SALON FRESH
            </span>
            <span className="text-[9px] tracking-[0.4em] text-[#D4AF37] font-light uppercase mt-0.5">
              NAILS & BEAUTY ATELIER
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {['Inicio', 'Esencia', 'Servicios', 'Artistas', 'Ubicación'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                className="text-xs uppercase tracking-[0.2em] text-[#5C4A3E] hover:text-[#D4AF37] transition-all font-medium"
              >
                {item}
              </a>
            ))}
            <Link href="/agenda" className="border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white px-7 py-3 text-[11px] font-medium tracking-[0.25em] uppercase transition-all rounded-none">
              Reservar Cita
            </Link>
          </nav>

          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-[#1A0E0A] hover:text-[#D4AF37] p-2">
            {isOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="lg:hidden absolute top-full left-0 right-0 bg-[#FFFCF8] border-b border-[#D4AF37]/10 py-6 px-8 shadow-xl">
              <div className="flex flex-col gap-4">
                {['Inicio', 'Esencia', 'Servicios', 'Artistas', 'Ubicación'].map((item) => (
                  <a key={item} href={`#${item.toLowerCase()}`} className="text-xs uppercase tracking-[0.2em] text-[#5C4A3E] hover:text-[#D4AF37]" onClick={() => setIsOpen(false)}>
                    {item}
                  </a>
                ))}
                <Link href="/agenda" className="block text-center border border-[#D4AF37] text-[#D4AF37] py-3 text-[11px] font-medium tracking-[0.25em] uppercase mt-2" onClick={() => setIsOpen(false)}>
                  Reservar Cita
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ============================================================
          SECCIÓN HERO (BIENVENIDA DE LUJO)
         ============================================================ */}
      <section id="inicio" className="relative min-h-screen flex items-center justify-center bg-[#FFF9F6] overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1800&q=80" 
            alt="Salon Fresh Hero" 
            className="w-full h-full object-cover opacity-15 filter sepia-[20%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FFFCF8]/50 to-[#FFFCF8]" />
        </div>

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10 space-y-6">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-[11px] font-bold tracking-[0.5em] text-[#D4AF37] uppercase block">
            BIENVENIDO A TU PROPIO RITUAL
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="font-serif text-5xl sm:text-7xl font-light tracking-tight text-[#1A0E0A] leading-tight">
            Donde la belleza se convierte en <span className="italic font-normal text-[#D4AF37]">Alta Costura</span>
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }} className="text-sm sm:text-base text-[#5C4A3E] font-light max-w-xl mx-auto leading-relaxed">
            Especialistas en manicura avanzada, diseño de cejas, micropigmentación premium y transformaciones de peluquería vanguardistas.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="pt-4">
            <Link href="/agenda" className="bg-[#1A0E0A] hover:bg-[#D4AF37] text-white px-10 py-4 text-xs font-bold tracking-[0.3em] uppercase transition-all duration-300 inline-block shadow-lg">
              Agendar Experiencia
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============================================================
          SECCIÓN: ESENCIA (NUESTRO MANIFESTO)
         ============================================================ */}
      <section id="esencia" className="py-28 max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 gap-16 items-center border-b border-[#F0E4DA]">
        <div className="space-y-6">
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#D4AF37]">NUESTRA FILOSOFÍA</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-[#1A0E0A] tracking-wide">
            Creamos detalles que cautivan a simple vista
          </h2>
          <p className="text-xs sm:text-sm text-[#5C4A3E] font-light leading-relaxed">
            En Salon Fresh no creemos en tratamientos genéricos. Diseñamos experiencias personalizadas combinando la precisión técnica dermoestética de Any con el arte, color y simetría capilar de Sil. Cada sesión es un lienzo en blanco creado exclusivamente para ti.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4 text-center">
            <div className="border border-[#F0E4DA] p-4 bg-[#FFF9F6]">
              <span className="font-serif text-2xl text-[#D4AF37]">100%</span>
              <p className="text-[9px] uppercase tracking-widest text-[#5C4A3E] mt-1">Customizado</p>
            </div>
            <div className="border border-[#F0E4DA] p-4 bg-[#FFF9F6]">
              <span className="font-serif text-2xl text-[#D4AF37]">Premium</span>
              <p className="text-[9px] uppercase tracking-widest text-[#5C4A3E] mt-1">Activos</p>
            </div>
            <div className="border border-[#F0E4DA] p-4 bg-[#FFF9F6]">
              <span className="font-serif text-2xl text-[#D4AF37]">Elite</span>
              <p className="text-[9px] uppercase tracking-widest text-[#5C4A3E] mt-1">Resultados</p>
            </div>
          </div>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden border border-[#D4AF37]/20 shadow-2xl">
          <img 
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80" 
            alt="Interior Atelier" 
            className="w-full h-full object-cover grayscale-[15%] hover:scale-105 transition-transform duration-700"
          />
        </div>
      </section>

      {/* ============================================================
          SECCIÓN PRINCIPAL: MENÚ DE SERVICIOS INTERACTIVO
         ============================================================ */}
      <section id="servicios" className="py-32 bg-[#FFF9F6] relative z-10 border-b border-[#F0E4DA]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#D4AF37]">MENU PREMIUM</span>
            <h2 className="font-serif text-3xl sm:text-5xl font-light tracking-tight text-[#1A0E0A]">
              Menú de <span className="italic font-normal text-[#D4AF37]">Tratamientos</span>
            </h2>
            <div className="w-12 h-[1px] bg-[#D4AF37] mx-auto mt-3" />
            <p className="text-xs sm:text-sm text-[#5C4A3E] font-light">
              Haz clic sobre la fotografía de cualquier tratamiento para desvelar su ritual extendido, precios y especialista asignada.
            </p>
          </div>

          {/* Selector de Filtros */}
          {allCategories.length > 1 && (
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 mb-20 border-b border-[#F0E4DA] pb-6 max-w-3xl mx-auto">
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
                    <motion.div layoutId="landingFilterLine" className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#D4AF37]" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Render del Catálogo Dinámico */}
          {loading ? (
            <div className="text-center py-20 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-t-2 border-[#D4AF37] border-transparent rounded-full animate-spin" />
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#A89588]">Cargando Catálogo...</span>
            </div>
          ) : filteredServicios.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#F0E4DA]">
              <p className="text-xs uppercase tracking-[0.2em] text-[#5C4A3E] font-light">No hay servicios disponibles en este segmento.</p>
            </div>
          ) : (
            <div className="space-y-20">
              {activeCategoriesList.map((categoryName) => {
                const servicesInCategory = filteredServicios.filter(s => s.category === categoryName)
                if (servicesInCategory.length === 0) return null

                return (
                  <div key={categoryName} className="space-y-8">
                    <div className="flex items-center gap-4 border-b border-[#D4AF37]/20 pb-3">
                      <h3 className="font-serif text-xl sm:text-2xl text-[#1A0E0A] font-light tracking-wide">{categoryName}</h3>
                      <span className="w-full h-[1px] bg-[#F0E4DA]" />
                    </div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.05 }} variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {servicesInCategory.map((servicio) => {
                        const imageUrl = servicio.image_url || CATEGORY_IMAGES[servicio.category] || CATEGORY_IMAGES.default
                        
                        return (
                          <motion.div
                            key={servicio.id}
                            variants={fadeInUp}
                            onClick={() => setActiveService(servicio)}
                            className="relative aspect-[4/3] overflow-hidden bg-white border border-[#F0E4DA] group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500"
                          >
                            <img src={imageUrl} alt={servicio.name} className="w-full h-full object-cover filter grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0E0A]/90 via-[#1A0E0A]/10 to-transparent opacity-85 group-hover:opacity-90 transition-opacity duration-300" />
                            
                            <div className="absolute bottom-0 left-0 right-0 p-5 text-white flex justify-between items-end z-10">
                              <div className="max-w-[75%]">
                                <span className="text-[8px] tracking-[0.2em] uppercase text-[#D4AF37] font-semibold block mb-0.5">✦ {servicio.category}</span>
                                <h4 className="font-serif text-base font-light tracking-wide truncate">{servicio.name}</h4>
                              </div>
                              <span className="text-[9px] tracking-widest uppercase font-bold border border-white/20 bg-white/10 backdrop-blur-md px-3 py-1.5 whitespace-nowrap group-hover:bg-[#D4AF37] group-hover:border-[#D4AF37] transition-all duration-300">Detalles</span>
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
      </section>

      {/* ============================================================
          SECCIÓN: ARTISTAS STAFF (ANY & SIL)
         ============================================================ */}
      <section id="artistas" className="py-28 max-w-7xl mx-auto px-6 lg:px-12 border-b border-[#F0E4DA]">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#D4AF37]">NUESTRO STAFF</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-[#1A0E0A]">Las Manos Detrás del <span className="italic font-normal text-[#D4AF37]">Arte</span></h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {/* Artista 1 */}
          <div className="border border-[#F0E4DA] p-6 bg-[#FFF9F6] text-center space-y-4">
            <div className="w-32 h-32 rounded-full overflow-hidden mx-auto border-2 border-[#D4AF37]/40">
              <img src="https://kzovcbefedfmpeucrofh.supabase.co/storage/v1/object/public/profesionals/any.png" alt="Any Master Artist" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-normal text-[#1A0E0A]">Any</h3>
              <p className="text-[10px] uppercase text-[#D4AF37] tracking-widest font-bold mt-0.5">Nail & Derm Master</p>
            </div>
            <p className="text-xs text-[#5C4A3E] font-light leading-relaxed px-4">
              Especialista en estructuración arquitectónica de uñas de gel, micropigmentación facial hiperrealista y cuidado avanzado de la mirada.
            </p>
          </div>

          {/* Artista 2 */}
          <div className="border border-[#F0E4DA] p-6 bg-[#FFF9F6] text-center space-y-4">
            <div className="w-32 h-32 rounded-full overflow-hidden mx-auto border-2 border-[#D4AF37]/40">
              <img src="https://kzovcbefedfmpeucrofh.supabase.co/storage/v1/object/public/profesionals/sil.png" alt="Sil Master Artist" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-normal text-[#1A0E0A]">Sil</h3>
              <p className="text-[10px] uppercase text-[#D4AF37] tracking-widest font-bold mt-0.5">Hair & Body Expert</p>
            </div>
            <p className="text-xs text-[#5C4A3E] font-light leading-relaxed px-4">
              Ingeniera de color capilar, cortes de tendencia vanguardista y tratamientos de reestructuración y estética corporal holística.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECCIÓN: UBICACIÓN Y HORARIOS
         ============================================================ */}
      <section id="ubicación" className="py-28 bg-[#FFF9F6]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#D4AF37]">VISÍTANOS</span>
            <h2 className="font-serif text-3xl font-light text-[#1A0E0A]">Tu espacio de desconexión</h2>
            <p className="text-xs sm:text-sm text-[#5C4A3E] font-light leading-relaxed">
              Te esperamos en nuestro atelier para brindarte una atención VIP en un entorno seguro y relajante. Reserva previamente para garantizar tu espacio exclusivo.
            </p>
            <div className="space-y-3 text-xs text-[#5C4A3E]">
              <p className="flex items-center gap-3"><FaMapMarkerAlt className="text-[#D4AF37]" /> Centro de Estética & Belleza Fresh Atelier</p>
              <p className="flex items-center gap-3"><FaClock className="text-[#D4AF37]" /> Lunes a Sábados: 09:00 - 20:00</p>
            </div>
            <div className="flex gap-4 pt-2">
              <a href="#" className="p-3 bg-white border border-[#F0E4DA] text-[#1A0E0A] hover:text-[#D4AF37] rounded-full transition-colors"><FaInstagram /></a>
              <a href="#" className="p-3 bg-white border border-[#F0E4DA] text-[#1A0E0A] hover:text-[#D4AF37] rounded-full transition-colors"><FaWhatsapp /></a>
            </div>
          </div>
          <div className="h-72 w-full border border-[#D4AF37]/20 bg-white shadow-xl flex items-center justify-center text-center p-8">
            <div>
              <FaMapMarkerAlt className="text-3xl text-[#D4AF37] mx-auto mb-3" />
              <p className="font-serif text-lg text-[#1A0E0A] font-light">Mapa de Ubicación</p>
              <p className="text-[11px] uppercase tracking-widest text-[#A89588] mt-1">Tu dirección configurada de Supabase / Google Maps</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          MODAL INTERACTIVO DE DETALLES (POPUP FLOTANTE DE LA LANDING)
         ============================================================ */}
      <AnimatePresence>
        {activeService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveService(null)} className="fixed inset-0 bg-[#1A0E0A]/70 backdrop-blur-md" />

            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.96, y: 15 }} 
              transition={{ type: 'spring', duration: 0.4 }} 
              className="bg-[#FFFCF8] border border-[#D4AF37]/20 w-full max-w-3xl relative shadow-2xl overflow-hidden z-10 md:grid md:grid-cols-12 max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible"
            >
              <button onClick={() => setActiveService(null)} className="absolute top-4 right-4 z-30 bg-white border border-[#F0E4DA] p-2 rounded-full text-[#1A0E0A] hover:text-[#D4AF37] shadow-sm"><FaTimes className="text-xs" /></button>

              <div className="md:col-span-5 relative h-60 md:h-auto min-h-[280px]">
                <img src={activeService.image_url || CATEGORY_IMAGES[activeService.category] || CATEGORY_IMAGES.default} alt={activeService.name} className="w-full h-full object-cover" />
              </div>

              <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <span className="text-[9px] tracking-[0.3em] font-bold uppercase text-[#D4AF37] block">{activeService.category}</span>
                  <h2 className="font-serif text-2xl md:text-3xl text-[#1A0E0A] font-light tracking-wide leading-tight">{activeService.name}</h2>
                  <div className="w-10 h-[1px] bg-[#D4AF37] my-3" />
                  <p className="text-xs text-[#5C4A3E] font-light leading-relaxed">
                    {activeService.description || 'Este tratamiento exclusivo fusiona metodologías avanzadas de vanguardia con activos selectos de nuestro atelier para esculpir, refinar y embellecer bajo un diagnóstico totalmente personalizado.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-y border-[#F0E4DA] py-4">
                  <div>
                    <span className="text-[8px] tracking-wider text-[#A89588] uppercase block">Inversión</span>
                    <span className="font-serif text-3xl text-[#1A0E0A] font-medium">${activeService.price}</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[8px] tracking-wider text-[#A89588] uppercase block">Duración Estimada</span>
                    <span className="text-xs font-semibold text-[#1A0E0A] flex items-center gap-1.5 mt-1"><FaClock className="text-[#D4AF37] text-[10px]" /> {activeService.duration} minutos</span>
                  </div>
                </div>

                {/* Tarjeta Profesional Especializada */}
                <div className="bg-[#FFF9F6] border border-[#F0E4DA] p-3 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-[#D4AF37]/30 bg-white flex-shrink-0">
                    <img src={getProfesionalPorServicio(activeService.category).foto} alt={getProfesionalPorServicio(activeService.category).nombre} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] tracking-widest uppercase text-[#D4AF37] block font-bold">Artista Asignada</span>
                    <span className="font-serif text-sm text-[#1A0E0A] font-normal block">{getProfesionalPorServicio(activeService.category).nombre}</span>
                    <span className="text-[9px] text-[#A89588] block font-light">{getProfesionalPorServicio(activeService.category).rol}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/agenda" className="w-full block text-center bg-[#1A0E0A] hover:bg-[#D4AF37] text-white py-3.5 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300">
                    Agendar este Tratamiento
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="bg-[#150B08] text-white/40 border-t border-white/5 text-[10px] tracking-wider uppercase">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Salon Fresh Nails. Todos los derechos reservados.</p>
          <p className="font-serif italic text-white/60 normal-case text-xs">Exclusividad & Elegancia Atelier</p>
        </div>
      </footer>
    </div>
  )
}
