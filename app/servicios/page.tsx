// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaClock, FaArrowLeft, FaSearch, FaChevronRight, FaRegHeart, FaGem 
} from 'react-icons/fa'
import { GiNails, GiScissors, GiLipstick, GiSparkles } from 'react-icons/gi'
import { FaRegStar, FaEye, FaHeart, FaSprayCan } from 'react-icons/fa'

// Mapeo de iconos idéntico a tu Home
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

export default function ServiciosPage() {
  const [services, setServices] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAllServices = async () => {
      try {
        setLoading(true)
        
        // 1. Obtención óptima del Tenant ID (Tu misma lógica de la Home unificada)
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

        // 2. Consulta completa a la base de datos
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('name', { ascending: true })

        if (servicesData) {
          setServices(servicesData)
          
          // Extraer categorías únicas dinámicamente para los filtros
          const uniqueCategories = Array.from(
            new Set(servicesData.map((s: any) => s.category).filter(Boolean))
          ) as string[]
          setCategories(uniqueCategories)
        }
      } catch (error) {
        console.error('Error cargando catálogo de servicios:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllServices()
  }, [])

  // Filtrado lógico por buscador y categoría seleccionada
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
          <p className="text-[10px] text-[#A89588] tracking-[0.4em] uppercase font-bold">Abriendo la carta de tratamientos</p>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-[#FFFCEF]/30 text-[#1A0E0A] min-h-screen antialiased selection:bg-[#D4AF37]/20 pt-28 pb-24">
      
      {/* HEADER DE NAVEGACIÓN RETROCESO */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-12">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-[#5C4A3E] hover:text-[#D4AF37] transition-colors group"
        >
          <FaArrowLeft className="text-[9px] translate-x-0 group-hover:-translate-x-1 transition-transform" /> Volver al Atelier
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* ENCABEZADO TIPO REVISTA */}
        <div className="grid lg:grid-cols-12 gap-8 items-end border-b border-[#F0E4DA] pb-12 mb-16">
          <div className="lg:col-span-8 space-y-4">
            <p className="text-[10px] tracking-[0.5em] uppercase text-[#D4AF37] font-bold">MENU COMPLETO DE DISCIPLINAS</p>
            <h1 className="font-serif text-5xl md:text-7xl text-[#1A0E0A] font-light leading-none">
              El Catálogo <br /><span className="italic font-normal text-[#D4AF37]">de Especialidades</span>
            </h1>
          </div>
          <div className="lg:col-span-4">
            {/* BUSCADOR ELEGANTE */}
            <div className="relative flex items-center border-b border-[#1A0E0A]/30 focus-within:border-[#D4AF37] transition-colors py-2">
              <FaSearch className="text-[#A89588] text-xs mr-3" />
              <input 
                type="text"
                placeholder="Buscar tratamiento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm font-light w-full outline-none placeholder-[#A89588]/60 text-[#1A0E0A]"
              />
            </div>
          </div>
        </div>

        {/* FILTROS DE CATEGORÍA DINÁMICOS */}
        <div className="flex flex-wrap gap-2 mb-16 pb-4 border-b border-[#F0E4DA]/40 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-2.5 text-[10px] font-semibold tracking-widest uppercase transition-all border ${
              selectedCategory === 'all'
                ? 'bg-[#1A0E0A] text-white border-[#1A0E0A]'
                : 'bg-white text-[#5C4A3E] border-[#F0E4DA] hover:border-[#D4AF37]'
            }`}
          >
            Todos ({services.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 text-[10px] font-semibold tracking-widest uppercase transition-all border ${
                selectedCategory === cat
                  ? 'bg-[#1A0E0A] text-white border-[#1A0E0A]'
                  : 'bg-white text-[#5C4A3E] border-[#F0E4DA] hover:border-[#D4AF37]'
              }`}
            >
              {cat} ({services.filter(s => s.category === cat).length})
            </button>
          ))}
        </div>

        {/* GRILLA DE SERVICIOS CON ANIMACIONES SUAVES */}
        <motion.div 
          layout
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service) => {
              const Icon = CATEGORY_ICONS[service.category] || CATEGORY_ICONS.default

              return (
                <motion.div
                  key={service.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white border border-[#F0E4DA] p-8 flex flex-col justify-between hover:border-[#D4AF37] hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="text-[#D4AF37] text-xl p-3 bg-[#FFF8F5] group-hover:bg-[#D4AF37] group-hover:text-white transition-colors duration-500">
                        <Icon />
                      </div>
                      <span className="text-[9px] font-bold tracking-widest uppercase text-[#5C4A3E]/70 bg-[#FFF9F6] border border-[#F0E4DA]/60 px-3 py-1">
                        {service.category || 'Atelier'}
                      </span>
                    </div>

                    <h3 className="font-serif text-2xl text-[#1A0E0A] mt-6 group-hover:text-[#D4AF37] transition-colors duration-300 min-h-[64px] flex items-center font-light tracking-wide">
                      {service.name}
                    </h3>

                    <p className="text-xs text-[#5C4A3E] font-light leading-relaxed mt-4 line-clamp-4">
                      {service.description || 'Tratamiento exclusivo diseñado a medida bajo los más altos estándares internacionales del atelier.'}
                    </p>
                  </div>

                  <div className="pt-6 mt-8 border-t border-[#F0E4DA] flex items-end justify-between">
                    <div>
                      <p className="text-[9px] tracking-wider text-[#A89588] uppercase font-medium">Inversión Premium</p>
                      <p className="font-serif text-3xl text-[#1A0E0A] mt-0.5">${service.price}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#5C4A3E]/80 font-light">
                        <FaClock className="text-[10px] text-[#D4AF37]" />
                        <span>{service.duration} min</span>
                      </div>
                      
                      <Link 
                        href={`/agenda?service=${service.id}`}
                        className="inline-flex items-center gap-1 text-[9px] font-bold tracking-[0.2em] uppercase text-[#1A0E0A] group-hover:text-[#D4AF37] transition-colors"
                      >
                        Reservar <FaChevronRight className="text-[7px]" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>

        {/* CONTROL DE ESTADO VACÍO */}
        {filteredServices.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 border border-dashed border-[#F0E4DA] bg-white mt-8"
          >
            <p className="text-sm font-serif text-[#5C4A3E] italic">No encontramos tratamientos que coincidan con tu criterio.</p>
            <button 
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="mt-4 text-[10px] font-bold tracking-widest uppercase text-[#D4AF37] border-b border-[#D4AF37] pb-0.5"
            >
              Restablecer filtros
            </button>
          </motion.div>
        )}

      </div>
    </main>
  )
}
