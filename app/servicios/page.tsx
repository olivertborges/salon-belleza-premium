// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaClock, FaArrowRight, FaHeart, FaEye, FaGem,
  FaBars, FaTimes, FaRegStar
} from 'react-icons/fa'
import { 
  GiNails, GiSparkles, GiLipstick, GiScissors
} from 'react-icons/gi'

// ✅ ICONOS POR CATEGORÍA
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

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

// ============================================================
// HEADER COMPARTIDO (ESTILO DE LA LANDING)
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
              className="text-xs uppercase tracking-[0.2em] text-[#5C4A3E] hover:text-[#D4AF37] transition-colors duration-300 font-medium"
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
                  href={`/#${item.toLowerCase()}`}
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
// COMPONENTE PRINCIPAL DE SERVICIOS
// ============================================================
export default function ServiciosPublicPage() {
  const [servicios, setServicios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // ✅ OBTENER TENANT_ID (LÓGICA INTACTA)
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
          .maybeSingle() as any
        if (profile?.tenant_id) return profile.tenant_id
      }

      if (session?.user?.id) {
        const { data: client } = await supabase
          .from('clients')
          .select('tenant_id')
          .eq('auth_user_id', session.user.id)
          .maybeSingle() as any
        if (client?.tenant_id) return client.tenant_id
      }

      const { data: firstAppointment } = await supabase
        .from('appointments')
        .select('tenant_id')
        .limit(1)
        .maybeSingle() as any
      if (firstAppointment?.tenant_id) return firstAppointment.tenant_id

      const { data: firstService } = await supabase
        .from('services')
        .select('tenant_id')
        .limit(1)
        .maybeSingle() as any
      if (firstService?.tenant_id) return firstService.tenant_id

      return null
    } catch (error) {
      console.error('Error obteniendo tenant_id:', error)
      return null
    }
  }

  // ✅ CARGAR SERVICIOS (LÓGICA INTACTA)
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

        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('name', { ascending: true })

        if (error) {
          setServicios([])
        } else {
          setServicios(data || [])
        }
      } catch (error) {
        console.error('Error en fetchServicios:', error)
        setServicios([])
      } finally {
        setLoading(false)
      }
    }

    fetchServicios()
  }, [])

  // ✅ AGRUPAR SERVICIOS POR CATEGORÍA
  const categoriesList = Array.from(new Set(servicios.map(s => s.category).filter(Boolean)))

  // ✅ RENDER CARGA EDITORIAL
  if (loading) {
    return (
      <main className="bg-[#FFF9F6] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-t-2 border-[#D4AF37] border-r-2 border-transparent rounded-full animate-spin" />
          <p className="text-[10px] text-[#A89588] tracking-[0.4em] uppercase font-bold">Cargando el Catálogo</p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF9F6] text-[#1A0E0A] antialiased selection:bg-[#D4AF37]/20">
      <Header />

      {/* TEXTURAS Y FONDOS EXCLUSIVOS */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 right-[-10%] w-[50vw] h-[50vw] bg-[#F5D4E0]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-[-10%] w-[50vw] h-[50vw] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-40 pb-32 relative z-10">
        
        {/* ENCABEZADO TIPO REVISTA */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center max-w-2xl mx-auto mb-28 space-y-4"
        >
          <motion.span 
            variants={fadeInUp} 
            className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#D4AF37]"
          >
            ATELIER MENU
          </motion.span>
          <motion.h1 
            variants={fadeInUp} 
            className="font-serif text-4xl sm:text-6xl font-light tracking-tight text-[#1A0E0A] leading-tight"
          >
            Menú General de <span className="italic font-normal text-[#D4AF37]">Tratamientos</span>
          </motion.h1>
          <motion.div variants={fadeInUp} className="w-12 h-[1px] bg-[#D4AF37] mx-auto mt-4" />
          <motion.p 
            variants={fadeInUp} 
            className="text-sm text-[#5C4A3E] font-light max-w-md mx-auto leading-relaxed"
          >
            Explora todas nuestras disciplinas de autor diseñadas meticulosamente para realzar tu belleza natural.
          </motion.p>
        </motion.div>

        {/* CONTENEDOR ESTRUCTURADO POR BLOQUES DE CATEGORÍAS */}
        {servicios.length === 0 ? (
          <div className="text-center py-24 bg-white border border-[#F0E4DA]">
            <FaGem className="w-6 h-6 text-[#A89588]/40 mx-auto mb-4" />
            <p className="text-xs uppercase tracking-[0.2em] text-[#5C4A3E] font-light">No hay tratamientos disponibles en este momento.</p>
          </div>
        ) : (
          <div className="space-y-24">
            {categoriesList.map((categoryName) => {
              const servicesInCategory = servicios.filter(s => s.category === categoryName)
              const Icon = CATEGORY_ICONS[categoryName] || CATEGORY_ICONS.default
              
              return (
                <div key={categoryName} className="space-y-8">
                  
                  {/* Título de la Disciplina con Línea de Lujo */}
                  <div className="flex items-center gap-4 border-b border-[#D4AF37]/20 pb-4">
                    <div className="text-[#D4AF37] text-xl p-2 bg-white border border-[#F0E4DA]">
                      <Icon />
                    </div>
                    <h2 className="font-serif text-2xl md:text-3xl text-[#1A0E0A] font-light tracking-wide">
                      {categoryName}
                    </h2>
                    <span className="text-[10px] font-light tracking-[0.2em] text-[#A89588] uppercase ml-auto">
                      {servicesInCategory.length} {servicesInCategory.length === 1 ? 'Servicio' : 'Servicios'}
                    </span>
                  </div>

                  {/* Grid de Tarjetas de esta Categoría */}
                  <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.05 }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  >
                    {servicesInCategory.map((servicio) => {
                      const imageUrl = servicio.image_url || CATEGORY_IMAGES[servicio.category] || CATEGORY_IMAGES.default

                      return (
                        <motion.div
                          key={servicio.id}
                          variants={fadeInUp}
                          className="bg-white border border-[#F0E4DA] p-6 flex flex-col justify-between transition-all duration-500 hover:border-[#D4AF37] hover:shadow-xl group"
                        >
                          <div>
                            {/* Imagen y badges enmarcados */}
                            <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#FFF9F6] border border-[#F0E4DA]/40 mb-6">
                              <img 
                                src={imageUrl} 
                                alt={servicio.name}
                                className="w-full h-full object-cover filter grayscale-[15%] group-hover:grayscale-0 transition-transform duration-1000 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-[#1A0E0A]/5 group-hover:bg-transparent transition-all duration-500" />

                              {servicio.badge && (
                                <span className="absolute top-4 right-4 z-10 text-[8px] font-bold tracking-widest uppercase bg-[#E879A0] text-white px-3 py-1.5 shadow-md">
                                  {servicio.badge}
                                </span>
                              )}
                            </div>

                            {/* Encabezado e info */}
                            <h3 className="font-serif text-xl text-[#1A0E0A] group-hover:text-[#D4AF37] transition-colors duration-300 line-clamp-1">
                              {servicio.name}
                            </h3>
                            <p className="text-xs text-[#5C4A3E] font-light mt-3 leading-relaxed line-clamp-3">
                              {servicio.description || 'Descubre este tratamiento premium personalizado en nuestro estudio.'}
                            </p>
                          </div>

                          {/* Precios e inversión */}
                          <div className="mt-6 pt-5 border-t border-[#F0E4DA] flex items-center justify-between">
                            <div>
                              <p className="text-[8px] tracking-wider text-[#A89588] uppercase">Inversión</p>
                              <p className="font-serif text-2xl text-[#1A0E0A] mt-0.5">${servicio.price}</p>
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-xs text-[#5C4A3E]/80 font-light">
                              <FaClock className="text-[10px] text-[#D4AF37]" />
                              <span>{servicio.duration} min</span>
                            </div>
                          </div>

                          {/* Enlace a la reserva */}
                          <div className="mt-4 pt-3 flex items-center">
                            <Link 
                              href="/agenda" 
                              className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#1A0E0A] hover:text-[#D4AF37] transition-colors group/link"
                            >
                              Reservar experiencia
                              <FaArrowRight className="text-[9px] group-hover/link:translate-x-1 transition-transform duration-300" />
                            </Link>
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

      {/* FOOTER DEL ATELIER INTEGRADO */}
      <footer className="bg-[#150B08] text-white/40 border-t border-white/5 text-xs font-light">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] tracking-wider uppercase">
          <p>© 2026 Salon Fresh Nails. Todos los derechos reservados.</p>
          <Link href="/" className="hover:text-[#D4AF37] transition-colors">← Volver al Atelier Principal</Link>
        </div>
      </footer>
    </div>
  )
}
