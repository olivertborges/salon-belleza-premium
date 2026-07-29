// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaClock, FaArrowLeft, FaSearch, FaTimes, FaCalendarCheck, FaSparkles, FaGem 
} from 'react-icons/fa'
import { GiNails, GiScissors, GiLipstick, GiSparkles } from 'react-icons/gi'
import { FaRegStar, FaEye, FaHeart, FaSprayCan } from 'react-icons/fa'

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

// Mapeo del equipo basado en las artistas de tu atelier
const PROFESSIONALS_DATA = {
  any: {
    name: 'Any',
    role: 'Nail & Derm Master',
    image: 'https://kzovcbefedfmpeucrofh.supabase.co/storage/v1/object/public/profesionals/any.png'
  },
  sil: {
    name: 'Sil',
    role: 'Hair & Body Expert',
    image: 'https://kzovcbefedfmpeucrofh.supabase.co/storage/v1/object/public/profesionals/sil.png'
  }
}

// Asignación inteligente por categoría del Atelier
const getProfessionalForCategory = (category: string) => {
  const cat = category || ''
  if (['Peluquería', 'Depilación'].includes(cat)) {
    return PROFESSIONALS_DATA.sil
  }
  return PROFESSIONALS_DATA.any // Por defecto Any maneja estética, uñas y mirada
}

export default function ServiciosPage() {
  const [services, setServices] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedService, setSelectedService] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchServicesData = async () => {
      try {
        setLoading(true)
        let tenantId = null
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user?.user_metadata?.tenant_id) {
          tenantId = session.user.user_metadata.tenant_id
        } else if (session?.user?.app_metadata?.tenant_id) {
          tenantId = session.user.app_metadata.tenant_id
        }

        if (!tenantId && session?.user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', session.user.id)
            .maybeSingle()
          if (profile?.tenant_id) tenantId = profile.tenant_id
        }

        if (!tenantId) {
          const { data: firstService } = await supabase
            .from('services')
            .select('tenant_id')
            .limit(1)
            .maybeSingle()
          if (firstService?.tenant_id) tenantId = firstService.tenant_id
        }

        if (!tenantId) return

        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('name', { ascending: true })

        if (servicesData) {
          setServices(servicesData)
          const uniqueCategories = Array.from(
            new Set(servicesData.map((s: any) => s.category).filter(Boolean))
          ) as string[]
          setCategories(uniqueCategories)
        }
      } catch (error) {
        console.error('Error:', error)
      } final {
        setLoading(false)
      }
    }

    fetchServicesData()
  }, [])

  const filteredServices = services.filter((service) => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <main className="bg-[#FFF9F6] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-t-2 border-[#D4AF37] border-r-2 border-transparent rounded-full animate-spin" />
          <p className="text-[10px] text-[#A89588] tracking-[0.4em] uppercase font-bold">Cargando menú de autor</p>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-[#FFFCEF]/20 text-[#1A0E0A] min-h-screen antialiased selection:bg-[#D4AF37]/20 pt-28 pb-24 relative">
      
      {/* BOTÓN VOLVER */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-12">
        <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-[#5C4A3E] hover:text-[#D4AF37] transition-colors">
          <FaArrowLeft className="text-[9px]" /> Volver al Atelier
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* TITULAR EDITORIAL */}
        <div className="grid lg:grid-cols-12 gap-8 items-end border-b border-[#F0E4DA] pb-12 mb-16">
          <div className="lg:col-span-8 space-y-4">
            <p className="text-[10px] tracking-[0.5em] uppercase text-[#D4AF37] font-bold">EXPERIENCIAS SENSORIALES</p>
            <h1 className="font-serif text-5xl md:text-7xl text-[#1A0E0A] font-light leading-none">
              Nuestros <br /><span className="italic font-normal text-[#D4AF37]">Tratamientos</span>
            </h1>
          </div>
          <div className="lg:col-span-4">
            <div className="relative flex items-center border-b border-[#1A0E0A]/30 focus-within:border-[#D4AF37] transition-colors py-2">
              <FaSearch className="text-[#A89588] text-xs mr-3" />
              <input 
                type="text"
                placeholder="Buscar especialidad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm font-light w-full outline-none placeholder-[#A89588]/60 text-[#1A0E0A]"
              />
            </div>
          </div>
        </div>

        {/* FILTROS POR PESTAÑA */}
        <div className="flex flex-wrap gap-2 mb-16 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-3 text-[10px] font-bold tracking-widest uppercase transition-all border ${
              selectedCategory === 'all' ? 'bg-[#1A0E0A] text-white border-[#1A0E0A]' : 'bg-white text-[#5C4A3E] border-[#F0E4DA] hover:border-[#D4AF37]'
            }`}
          >
            Ver Todo ({services.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 text-[10px] font-bold tracking-widest uppercase transition-all border ${
                selectedCategory === cat ? 'bg-[#1A0E0A] text-white border-[#1A0E0A]' : 'bg-white text-[#5C4A3E] border-[#F0E4DA] hover:border-[#D4AF37]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* LISTADO DE SERVICIOS */}
        <div className="grid lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => {
            const Icon = CATEGORY_ICONS[service.category] || CATEGORY_ICONS.default
            const professional = getProfessionalForCategory(service.category)

            return (
              <div
                key={service.id}
                onClick={() => setSelectedService(service)}
                className="bg-white border border-[#F0E4DA] p-8 flex flex-col justify-between hover:border-[#D4AF37] shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer group"
              >
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[9px] font-bold tracking-widest uppercase text-[#D4AF37] bg-[#FFF9F6] px-3 py-1 border border-[#D4AF37]/20">
                      {service.category}
                    </span>
                    <div className="text-[#5C4A3E]/40 group-hover:text-[#D4AF37] transition-colors">
                      <Icon className="text-lg" />
                    </div>
                  </div>
                  <h3 className="font-serif text-2xl text-[#1A0E0A] font-light group-hover:text-[#D4AF37] transition-colors min-h-[56px]">
                    {service.name}
                  </h3>
                  <p className="text-xs text-[#5C4A3E]/80 font-light line-clamp-2 mt-2">
                    {service.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#F0E4DA] flex items-center justify-between text-xs">
                  <span className="font-serif text-xl text-[#1A0E0A] font-medium">${service.price}</span>
                  <span className="text-[#A89588] tracking-widest uppercase text-[9px] font-bold group-hover:text-[#1A0E0A] transition-colors">
                    Ver Detalles +
                  </span>
                </div>
              </div>
            )
          })}
        </div>

      </div>

      {/* VISTA DETALLADA DEL SERVICIO (MODAL LATERAL HAUTE COUTURE) */}
      <AnimatePresence>
        {selectedService && (() => {
          const professional = getProfessionalForCategory(selectedService.category)
          
          return (
            <>
              {/* Fondo traslúcido */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedService(null)}
                className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
              />

              {/* Contenedor Lateral */}
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-[#FFFFCF8] bg-[#FFFCF8] z-50 shadow-2xl p-8 md:p-12 overflow-y-auto border-l border-[#D4AF37]/20 flex flex-col justify-between"
              >
                <div>
                  {/* Botón Cerrar */}
                  <div className="flex justify-between items-center mb-12">
                    <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#D4AF37]">
                      DOSSIER DE TRATAMIENTO
                    </span>
                    <button 
                      onClick={() => setSelectedService(null)}
                      className="text-[#1A0E0A] hover:text-[#D4AF37] transition-colors p-2"
                    >
                      <FaTimes className="text-base" />
                    </button>
                  </div>

                  {/* Detalles Principales */}
                  <div className="space-y-6">
                    <span className="text-[10px] tracking-widest uppercase font-bold text-[#5C4A3E]/60 bg-gray-100 px-3 py-1">
                      ✦ {selectedService.category}
                    </span>
                    <h2 className="font-serif text-4xl md:text-5xl text-[#1A0E0A] font-light leading-tight">
                      {selectedService.name}
                    </h2>
                    
                    {/* Fila de Métricas de Lujo */}
                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#F0E4DA]">
                      <div>
                        <p className="text-[9px] tracking-wider text-[#A89588] uppercase">Inversión Premium</p>
                        <p className="font-serif text-3xl text-[#1A0E0A] mt-1">${selectedService.price}</p>
                      </div>
                      <div>
                        <p className="text-[9px] tracking-wider text-[#A89588] uppercase">Duración Estimada</p>
                        <p className="font-serif text-3xl text-[#1A0E0A] mt-1 flex items-center gap-2">
                          {selectedService.duration} <span className="text-xs font-sans text-[#5C4A3E] font-light">min</span>
                        </p>
                      </div>
                    </div>

                    {/* Descripción Ampliada */}
                    <div className="space-y-3 pt-4">
                      <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#1A0E0A]">En Qué Consiste</h4>
                      <p className="text-sm text-[#5C4A3E] font-light leading-relaxed">
                        {selectedService.description || 'Una experiencia integral diseñada minuciosamente para cuidar tu estética bajo un estándar premium de salud y belleza, empleando únicamente productos libres de tóxicos.'}
                      </p>
                    </div>

                    {/* ARTISTA ASIGNADA */}
                    <div className="pt-8 space-y-4">
                      <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#1A0E0A]">Especialista Asignada</h4>
                      <div className="flex items-center gap-4 bg-[#FFF9F6] border border-[#F0E4DA] p-4">
                        <div className="w-16 h-16 bg-[#F0E4DA] overflow-hidden rounded-none border border-[#D4AF37]/20 flex-shrink-0">
                          <img 
                            src={professional.image} 
                            alt={professional.name} 
                            className="w-full h-full object-cover grayscale-[20%]"
                          />
                        </div>
                        <div>
                          <p className="font-serif text-lg text-[#1A0E0A] font-light">{professional.name}</p>
                          <p className="text-[10px] tracking-wider text-[#D4AF37] uppercase font-semibold mt-0.5">{professional.role}</p>
                          <p className="text-[11px] text-[#5C4A3E] font-light mt-1">Garantiza precisión y acabado de alta costura.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACCIÓN DE RESERVA */}
                <div className="pt-12 mt-12 border-t border-[#F0E4DA]">
                  <Link 
                    href={`/agenda?service=${selectedService.id}`}
                    className="w-full bg-[#1A0E0A] text-white hover:bg-[#D4AF37] py-5 px-6 text-xs font-semibold tracking-[0.3em] uppercase transition-all duration-300 flex items-center justify-center gap-3 shadow-lg"
                  >
                    <FaCalendarCheck className="text-xs" /> Reservar Cita con {professional.name}
                  </Link>
                </div>

              </motion.div>
            </>
          )
        })()}
      </AnimatePresence>

    </main>
  )
}
