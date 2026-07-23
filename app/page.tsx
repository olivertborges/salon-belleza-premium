// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion'
import { 
  FaArrowRight, FaQuoteLeft, FaInstagram, FaWhatsapp, FaStar, FaGem,
  FaBars, FaTimes, FaCalendarCheck, FaPhoneAlt, FaMapMarkerAlt, FaRegHeart,
  FaPalette, FaHandSparkles, FaAward, FaLeaf, FaChevronLeft, FaChevronRight,
  FaCrown, FaRegStar, FaEye, FaHeart, FaClock
} from 'react-icons/fa'
import { GiNails, GiScissors, GiLipstick, GiFlowerStar, GiSparkles } from 'react-icons/gi'
import { HiOutlineSparkles } from 'react-icons/hi'

// ============================================================
// CONSTANTES (solo para fallbacks)
// ============================================================
const CATEGORY_ICONS: Record<string, any> = {
  'Uñas': GiNails,
  'Micropigmentación': GiSparkles,
  'Peluquería': GiScissors,
  'Cejas': FaEye,
  'Estética': GiFlowerStar,
  'Depilación': FaHeart,
  'default': FaGem
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
// FUNCIÓN PARA OBTENER TENANT_ID
// ============================================================
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

// ============================================================
// HEADER, HERO, ESENCIA, TESTIMONIOS, CTA, FOOTER
// (Mantener igual que antes, sin cambios)
// ============================================================

// ============================================================
// SERVICIOS - CON DATOS DE LA DB
// ============================================================
const ServicesSection = ({ services }: { services: any[] }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (!services || services.length === 0) return null

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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.slice(0, 4).map((service, idx) => {
            const Icon = CATEGORY_ICONS[service.category] || CATEGORY_ICONS.default
            const imageUrl = service.image_url || CATEGORY_IMAGES[service.category] || CATEGORY_IMAGES.default
            const isHovered = hoveredId === service.id

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ delay: idx * 0.1 }}
                onMouseEnter={() => setHoveredId(service.id)}
                onMouseLeave={() => setHoveredId(null)}
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
                    <Icon className="text-2xl" />
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
                      <span className="text-xs text-[#5C4A3E] ml-2 flex items-center gap-1">
                        <FaClock className="text-[10px]" />
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
// GALERÍA - CON DATOS DE LA DB
// ============================================================
const GallerySection = ({ images }: { images: any[] }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })

  // Si no hay imágenes de la DB, usar fallbacks de Unsplash
  const displayImages = images && images.length > 0 
    ? images 
    : [
        'https://images.unsplash.com/photo-1591926079847-8181980b0f09?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1641814250010-9887d86eedfd?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1720343409646-960f6dcccae3?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1585885970325-81cba4494c27?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1560869713-7d0a2943087e?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=800&fit=crop'
      ]

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

      <div className="relative">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="flex gap-4 w-max"
        >
          {[...displayImages, ...displayImages].map((img, idx) => {
            const imageUrl = typeof img === 'string' ? img : img.image_url
            const title = typeof img === 'string' ? 'Creación' : img.title || 'Creación exclusiva'
            const clientName = typeof img === 'string' ? 'Fresh Nails' : img.client_name || 'Fresh Nails'

            return (
              <div key={idx} className="w-72 md:w-96 flex-shrink-0 group">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-xl">
                  <img 
                    src={imageUrl} 
                    alt={title}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A0E0A]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-white text-sm font-light tracking-wider">{title}</p>
                    <p className="text-white/50 text-xs font-light mt-1">{clientName}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </motion.div>
      </div>

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
// MAIN
// ============================================================
export default function Home() {
  const [services, setServices] = useState<any[]>([])
  const [galleryImages, setGalleryImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        const tenantId = await getTenantId()

        if (!tenantId) {
          setLoading(false)
          return
        }

        // 1. Cargar SERVICIOS desde la DB
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('name', { ascending: true })

        if (servicesData) setServices(servicesData)

        // 2. Cargar GALERÍA desde la DB
        let allImages: any[] = []

        // Fotos de admin
        const { data: adminPhotos } = await supabase
          .from('gallery')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(8)

        if (adminPhotos) {
          allImages = [...allImages, ...adminPhotos]
        }

        // Fotos de clientes
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
            ...p,
            image_url: p.after_image_url || p.image_url || p.before_image_url || '',
            client_name: p.client_name || 'Cliente'
          }))
          allImages = [...allImages, ...mapped]
        }

        allImages.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setGalleryImages(allImages.slice(0, 6))

      } catch (error) {
        console.error('Error cargando datos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <main className="bg-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
          <p className="text-xs text-[#5C4A3E] tracking-[0.3em] uppercase font-light animate-pulse">Cargando...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-white text-[#1A0E0A] min-h-screen overflow-x-hidden">
      <Header />
      <HeroSection />
      <EsenciaSection />
      <ServicesSection services={services} />
      <GallerySection images={galleryImages} />
      <TestimonialsSection />
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