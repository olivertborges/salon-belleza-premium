// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaClock, FaHeart, FaEye, FaGem, FaBars, FaTimes, FaRegStar
} from 'react-icons/fa'
import { 
  GiNails, GiSparkles, GiScissors
} from 'react-icons/gi'

// ✅ ICONOS POR CATEGORÍA REAL
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

// ✅ IMÁGENES EDITORIALES FIJAS
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

const getProfesionalPorServicio = (category: string) => {
  const cat = category?.toLowerCase() || ''
  if (cat.includes('uña') || cat.includes('micro') || cat.includes('ceja') || cat.includes('pestaña')) {
    return {
      nombre: 'Any',
      rol: 'Nail & Derm Master',
      foto: 'https://kzovcbefedfmpeucrofh.supabase.co/storage/v1/object/public/profesionals/any.png'
    }
  }
  return {
    nombre: 'Sil',
    rol: 'Hair & Body Expert',
    foto: 'https://kzovcbefedfmpeucrofh.supabase.co/storage/v1/object/public/profesionals/sil.png'
  }
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

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
      scrolled ? 'bg-[#FFFCF8]/90 backdrop-blur-md border-b border-[#D4AF37]/10 shadow-sm py-4' : 'bg-[#FFFCF8]/60 backdrop-blur-sm border-b border-[#D4AF37]/5 py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        <Link href="/" className="flex flex-col tracking-widest group">
          <span className="text-[#1A0E0A] font-serif text-2xl tracking-[0.15em] group-hover:text-[#D4AF37] transition-colors">SALON FRESH</span>
          <span className="text-[9px] tracking-[0.4em] text-[#D4AF37] font-light uppercase mt-0.5">NAILS & BEAUTY ATELIER</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-10">
          {['Esencia', 'Categorías', 'Servicios', 'Galería', 'Testimonios'].map((item) => (
            <Link key={item} href={`/#${item.toLowerCase()}`} className="text-xs uppercase tracking-[0.2em] text-[#5C4A3E] hover:text-[#D4AF37] transition-all font-medium">
              {item}
            </Link>
          ))}
          <Link href="/agenda" className="border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white px-7 py-3 text-[11px] font-medium tracking-[0.25em] uppercase transition-all">
            Reservar Cita
          </Link>
        </nav>
        <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-[#1A0E0A] p-2">
          {isOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
        </button>
      </div>
    </header>
  )
}

export default function ServiciosPublicPage() {
  const [servicios, setServicios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [activeService, setActiveService] = useState<any | null>(null)

  useEffect(() => {
    const fetchServicios = async () => {
      try {
        setLoading(true)
        
        // 1. Intentar buscar Tenant ID desde la sesión del usuario
        let tenantId = null
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.user_metadata?.tenant_id) tenantId = session.user.user_metadata.tenant_id
        if (!tenantId && session?.user?.app_metadata?.tenant_id) tenantId = session.user.app_metadata.tenant_id

        // 2. 🚨 ESTRATEGIA DE RESCATE (FALLBACK) 🚨
        // Si no hay sesión o no hay tenant_id, hacemos una consulta limpia a la tabla sin filtro
        // para extraer el tenant_id real asignado al negocio. ¡Esto evitará que la página salga vacía!
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

        // 3. Consulta de datos filtrando solo si logramos conseguir un ID
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
        <div className="w-10 h-10 border-t-2 border-[#D4AF37] border-r-2 border-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF9F6] text-[#1A0E0A] antialiased relative selection:bg-[#D4AF37]/20">
      <Header />

      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 right-[-10%] w-[50vw] h-[50vw] bg-[#F5D4E0]/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-40 pb-32 relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#D4AF37]">VISUAL ATELIER MENU</span>
          <h1 className="font-serif text-4xl sm:text-6xl font-light tracking-tight text-[#1A0E0A] leading-tight">
            Nuestro Menú de <span className="italic font-normal text-[#D4AF37]">Tratamientos</span>
          </h1>
          <div className="w-12 h-[1px] bg-[#D4AF37] mx-auto mt-4" />
        </div>

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
                  <motion.div layoutId="activeFilterLine" className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#D4AF37]" />
                )}
              </button>
            ))}
          </div>
        )}

        {filteredServicios.length === 0 ? (
          <div className="text-center py-24 bg-white border border-[#F0E4DA]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#5C4A3E] font-light">No hay obras dermoestéticas cargadas.</p>
          </div>
        ) : (
          <div className="space-y-24">
            {activeCategoriesList.map((categoryName) => {
              const servicesInCategory = filteredServicios.filter(s => s.category === categoryName)
              if (servicesInCategory.length === 0) return null

              return (
                <div key={categoryName} className="space-y-8">
                  <div className="flex items-center gap-4 border-b border-[#D4AF37]/20 pb-4">
                    <h2 className="font-serif text-2xl md:text-3xl text-[#1A0E0A] font-light tracking-wide">{categoryName}</h2>
                    <span className="w-full h-[1px] bg-[#F0E4DA]" />
                  </div>

                  <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {servicesInCategory.map((servicio) => {
                      const imageUrl = CATEGORY_IMAGES[servicio.category] || CATEGORY_IMAGES.default
                      return (
                        <motion.div
                          key={servicio.id}
                          variants={fadeInUp}
                          onClick={() => setActiveService(servicio)}
                          className="relative aspect-[4/3] overflow-hidden bg-[#FFF9F6] border border-[#F0E4DA] group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500"
                        >
                          <img src={imageUrl} alt={servicio.name} className="w-full h-full object-cover filter grayscale-[25%] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1A0E0A]/90 via-[#1A0E0A]/10 to-transparent opacity-85" />
                          
                          <div className="absolute bottom-0 left-0 right-0 p-5 text-white flex justify-between items-end z-10">
                            <div className="max-w-[75%] space-y-0.5">
                              <h3 className="font-serif text-lg leading-tight font-light tracking-wide truncate">{servicio.name}</h3>
                            </div>
                            <span className="text-[9px] tracking-widest uppercase font-bold border border-white/25 bg-white/10 backdrop-blur-md px-3 py-1.5 whitespace-nowrap">Ver Ficha</span>
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

      {/* POPUP DE DETALLES EXCLUSIVO */}
      <AnimatePresence>
        {activeService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveService(null)} className="fixed inset-0 bg-[#1A0E0A]/70 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="bg-[#FFFCF8] border border-[#D4AF37]/20 w-full max-w-3xl relative shadow-2xl overflow-hidden z-10 md:grid md:grid-cols-12 max-h-[90vh] md:max-h-none overflow-y-auto">
              <button onClick={() => setActiveService(null)} className="absolute top-4 right-4 z-30 bg-white border p-2 rounded-full"><FaTimes className="text-xs" /></button>
              
              <div className="md:col-span-5 relative h-60 md:h-auto bg-[#FFF9F6]">
                <img src={CATEGORY_IMAGES[activeService.category] || CATEGORY_IMAGES.default} alt={activeService.name} className="w-full h-full object-cover" />
              </div>

              <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <span className="text-[9px] tracking-[0.3em] font-bold uppercase text-[#D4AF37] block">{activeService.category}</span>
                  <h2 className="font-serif text-2xl text-[#1A0E0A] font-light tracking-wide">{activeService.name}</h2>
                  <p className="text-xs text-[#5C4A3E] font-light leading-relaxed">{activeService.description || 'Tratamiento de autor del atelier.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-y border-[#F0E4DA] py-4">
                  <div>
                    <span className="text-[8px] tracking-wider text-[#A89588] uppercase block">Inversión</span>
                    <span className="font-serif text-3xl text-[#1A0E0A] font-medium">${activeService.price}</span>
                  </div>
                  <div>
                    <span className="text-[8px] tracking-wider text-[#A89588] uppercase block">Duración</span>
                    <span className="text-xs font-semibold text-[#1A0E0A] flex items-center gap-1.5 mt-2"><FaClock className="text-[#D4AF37]" /> {activeService.duration} min</span>
                  </div>
                </div>

                <div className="bg-[#FFF9F6] border border-[#F0E4DA] p-3 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white">
                    <img src={getProfesionalPorServicio(activeService.category).foto} alt="Profesional" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[8px] tracking-widest uppercase text-[#D4AF37] block font-bold">Artista Especializada</span>
                    <span className="font-serif text-sm text-[#1A0E0A] font-normal block">{getProfesionalPorServicio(activeService.category).nombre}</span>
                    <span className="text-[9px] text-[#A89588] block font-light">{getProfesionalPorServicio(activeService.category).rol}</span>
                  </div>
                </div>

                <Link href={`/agenda?service=${activeService.id}`} className="w-full block text-center bg-[#1A0E0A] hover:bg-[#D4AF37] text-white py-3.5 text-[10px] font-bold tracking-[0.25em] uppercase transition-all">
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
