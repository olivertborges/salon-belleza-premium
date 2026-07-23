'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion'
import { 
  FaArrowRight, 
  FaQuoteLeft,
  FaInstagram,
  FaWhatsapp,
  FaStar,
  FaGem,
  FaBars,
  FaTimes,
  FaCalendarCheck,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaRegHeart,
  FaPalette,
  FaHandSparkles,
  FaAward,
  FaLeaf,
  FaChevronLeft,
  FaChevronRight,
  FaRegSun,
  FaCrown,
  FaRegStar,
  FaSprayCan,
  FaFeatherAlt
} from 'react-icons/fa'
import { GiNails, GiScissors, GiLipstick, GiFlowerEmblem, GiRose } from 'react-icons/gi'
import { HiOutlineSparkles } from 'react-icons/hi'

// ============================================================
// PALETA DE LUJO
// ============================================================
const COLORS = {
  gold: '#D4AF37',
  goldLight: '#F4E4BC',
  goldGlow: 'rgba(212, 175, 55, 0.2)',
  rose: '#E879A0',
  roseLight: '#F5D4E0',
  roseGlow: 'rgba(232, 121, 160, 0.15)',
  blush: '#FFF8F5',
  cream: '#FFFCF8',
  white: '#FFFFFF',
  lightBg: '#FFF9F6',
  darkText: '#1A0E0A',
  textSoft: '#5C4A3E',
  textMuted: '#A89588',
  border: '#F0E4DA',
  goldBorder: '#D4AF37',
}

// ============================================================
// INTERFACES
// ============================================================
interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  category: string
  icon: string
  is_active: boolean
  badge?: string
  image_url?: string
}

interface GalleryImage {
  id: string
  image_url: string
  title: string
  description: string
  is_active: boolean
  is_public: boolean
  created_at: string
  client_name?: string
  source?: 'admin' | 'client'
  category?: string
}

const CATEGORY_IMAGES: Record<string, string> = {
  'Uñas': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop',
  'Micropigmentación': 'https://plus.unsplash.com/premium_photo-1661580887141-7adca5e04c02?w=600&h=400&fit=crop',
  'Peluquería': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=400&fit=crop',
  'Cejas': 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=600&h=400&fit=crop',
  'Estética': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop',
  'Depilación': 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=400&fit=crop',
  'default': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop'
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function Home() {
  const { user } = useAuth()
  
  // Estados para datos de la DB
  const [services, setServices] = useState<Service[]>([])
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredServiceId, setHoveredServiceId] = useState<string | null>(null)

  // ============================================================
  // CARGAR DATOS DESDE SUPABASE
  // ============================================================
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // 1. Obtener tenant_id
        let tenantId = null
        const { data: { session } } = await supabase.auth.getSession()
        tenantId = session?.user?.user_metadata?.tenant_id || 
                    session?.user?.app_metadata?.tenant_id || null

        if (!tenantId) {
          const { data: firstAppointment } = await supabase
            .from('appointments')
            .select('tenant_id')
            .limit(1)
            .maybeSingle()
          tenantId = firstAppointment?.tenant_id || null
        }

        if (!tenantId) {
          setLoading(false)
          return
        }

        // 2. Cargar servicios
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('name', { ascending: true })

        if (!servicesError && servicesData) {
          setServices(servicesData)
        }

        // 3. Cargar galería
        let allImages: GalleryImage[] = []

        // Fotos de Admin
        const { data: adminPhotos } = await supabase
          .from('gallery')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(8)

        if (adminPhotos) {
          const mapped = adminPhotos.map((p: any) => ({
            ...p,
            source: 'admin' as const,
            client_name: p.client_name || 'Fresh Nails Studio',
            category: p.category || 'Exclusivo'
          }))
          allImages = [...allImages, ...mapped]
        }

        // Fotos de Clientes (públicas)
        const { data: clientPhotos } = await supabase
          .from('client_gallery')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(6)

        if (clientPhotos) {
          const mapped = clientPhotos.map((p: any) => ({
            id: p.id,
            image_url: p.after_image_url || p.image_url || p.before_image_url || '',
            title: p.title || 'Aporte de Cliente',
            description: p.description || '',
            is_active: p.is_active !== undefined ? p.is_active : true,
            is_public: p.is_public !== undefined ? p.is_public : true,
            created_at: p.created_at,
            source: 'client' as const,
            client_name: p.client_name || 'Cliente',
            category: p.category || 'Exclusivo'
          }))
          allImages = [...allImages, ...mapped]
        }

        allImages.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setGalleryImages(allImages.slice(0, 6)) // Solo 6 para la landing

      } catch (error) {
        console.error('Error cargando datos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // ============================================================
  // HEADER
  // ============================================================
  // ... (mantén el Header igual que en la landing anterior)

  // ============================================================
  // HERO
  // ============================================================
  // ... (mantén el Hero igual que en la landing anterior)

  // ============================================================
  // SECCIÓN SERVICIOS - CON DATOS DE LA DB
  // ============================================================
  const ServicesSection = () => {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, amount: 0.1 })

    if (loading) {
      return (
        <section className="py-32 bg-[#FFF8F5]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin mx-auto" />
            <p className="text-[#5C4A3E] mt-4 text-sm font-light">Cargando servicios...</p>
          </div>
        </section>
      )
    }

    return (
      <section id="servicios" ref={ref} className="py-32 bg-[#FFF8F5] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-5" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
            }}
            className="text-center mb-20"
          >
            <motion.span 
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
              className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-light border border-[#D4AF37]/20 px-5 py-2 rounded-full bg-white/50"
            >
              ✦ Servicios de Lujo ✦
            </motion.span>
            <motion.h2 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="font-serif text-4xl md:text-5xl text-[#1A0E0A] mt-6"
            >
              Experiencias que <span className="italic text-[#D4AF37]">transforman</span>
            </motion.h2>
          </motion.div>

          {services.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#5C4A3E] font-light">No hay servicios disponibles</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {services.slice(0, 4).map((service, idx) => {
                const imageUrl = service.image_url || CATEGORY_IMAGES[service.category] || CATEGORY_IMAGES.default
                const isHovered = hoveredServiceId === service.id

                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                    transition={{ delay: idx * 0.1 }}
                    onMouseEnter={() => setHoveredServiceId(service.id)}
                    onMouseLeave={() => setHoveredServiceId(null)}
                    className="group relative bg-white border border-[#F0E4DA] hover:border-[#D4AF37] rounded-2xl overflow-hidden transition-all duration-700 hover:shadow-2xl hover:shadow-[#D4AF37]/10"
                  >
                    <div className={`absolute inset-0 transition-all duration-700 ${
                      isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                    }`}>
                      <img 
                        src={imageUrl} 
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
                    </div>

                    <div className="relative z-10 p-8">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                        isHovered ? 'bg-[#D4AF37] text-white scale-110' : 'bg-[#FFF8F5] text-[#D4AF37]'
                      }`}>
                        <GiNails className="text-2xl" />
                      </div>
                      
                      <h3 className={`text-xl font-serif mt-6 transition-colors duration-500 ${
                        isHovered ? 'text-[#D4AF37]' : 'text-[#1A0E0A]'
                      }`}>
                        {service.name}
                      </h3>
                      
                      <p className="text-[#5C4A3E] text-sm font-light mt-3 leading-relaxed line-clamp-3">
                        {service.description}
                      </p>

                      <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#F0E4DA]">
                        <div>
                          <span className={`text-2xl font-serif transition-colors duration-500 ${
                            isHovered ? 'text-[#D4AF37]' : 'text-[#1A0E0A]'
                          }`}>
                            ${service.price}
                          </span>
                          <span className="text-xs text-[#5C4A3E] ml-2">
                            {service.duration}min
                          </span>
                        </div>
                        <span className={`text-[10px] font-light tracking-wider uppercase px-4 py-1.5 rounded-full transition-all duration-500 ${
                          isHovered ? 'bg-[#D4AF37] text-white' : 'bg-[#FFF8F5] text-[#5C4A3E]'
                        }`}>
                          {service.category || 'Premium'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {services.length > 4 && (
            <div className="text-center mt-12">
              <Link 
                href="/servicios"
                className="inline-flex items-center gap-3 text-sm text-[#5C4A3E] hover:text-[#D4AF37] transition-all group font-light tracking-wider"
              >
                Ver todos los servicios
                <FaArrowRight className="text-xs group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </section>
    )
  }

  // ============================================================
  // SECCIÓN GALERÍA - CON DATOS DE LA DB
  // ============================================================
  const GallerySection = () => {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, amount: 0.1 })

    if (loading) {
      return (
        <section className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin mx-auto" />
            <p className="text-[#5C4A3E] mt-4 text-sm font-light">Cargando galería...</p>
          </div>
        </section>
      )
    }

    return (
      <section id="galeria" ref={ref} className="py-32 bg-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#FFF8F5] via-white to-[#FFF8F5]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
            }}
            className="text-center mb-16"
          >
            <motion.span 
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
              className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-light border border-[#D4AF37]/20 px-5 py-2 rounded-full bg-white/50"
            >
              ✦ Galería ✦
            </motion.span>
            <motion.h2 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="font-serif text-4xl md:text-5xl text-[#1A0E0A] mt-6"
            >
              Nuestras <span className="italic text-[#D4AF37]">creaciones</span>
            </motion.h2>
          </motion.div>
        </div>

        {galleryImages.length === 0 ? (
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <p className="text-[#5C4A3E] font-light">No hay imágenes disponibles</p>
          </div>
        ) : (
          <div className="relative">
            <motion.div
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="flex gap-4 w-max"
            >
              {[...galleryImages, ...galleryImages].map((img, idx) => (
                <div key={`${img.id}-${idx}`} className="w-72 md:w-96 flex-shrink-0 group">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-xl">
                    <img 
                      src={img.image_url} 
                      alt={img.title || 'Creación'}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A0E0A]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                      <p className="text-white text-sm font-light tracking-wider">
                        {img.title || '✨ Creación exclusiva'}
                      </p>
                      <p className="text-white/50 text-xs font-light mt-1">
                        {img.client_name || 'Fresh Nails'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-12 text-center">
          <Link 
            href="/galeria"
            className="inline-flex items-center gap-3 text-sm text-[#5C4A3E] hover:text-[#D4AF37] transition-all group font-light tracking-wider"
          >
            Ver toda la galería
            <FaArrowRight className="text-xs group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>
    )
  }

  // ============================================================
  // SECCIONES RESTANTES (Testimonios, CTA, Footer)
  // ============================================================
  // ... (mantén TestimoniosSection, CtaSection y Footer igual que la landing anterior)

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <main className="bg-white text-[#1A0E0A] min-h-screen overflow-x-hidden">
      <Header />
      <HeroSection />
      <EsenciaSection /> {/* Esta sección puede mantener imágenes estáticas o también venir de la DB */}
      <ServicesSection />
      <GallerySection />
      <TestimonialsSection /> {/* También podría venir de la DB */}
      <CtaSection />
      <Footer />

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 4s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse 6s ease-in-out infinite;
        }
        .animate-pulse-slow-delay {
          animation: pulse 6s ease-in-out infinite 2s;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }
        .animate-spin-slow-reverse {
          animation: spin 25s linear infinite reverse;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  )
}