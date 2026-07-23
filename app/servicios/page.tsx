'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  FaClock, FaStar, FaArrowRight, FaSparkles, 
  FaScissors, FaEye, FaHeart
} from 'react-icons/fa'
import { GiNails, GiSparkles, GiLipstick, GiFlowerStar } from 'react-icons/gi'

// ✅ ICONOS POR CATEGORÍA
const CATEGORY_ICONS: Record<string, any> = {
  'Uñas': GiNails,
  'Micropigmentación': GiSparkles,
  'Peluquería': FaScissors,
  'Cejas': FaEye,
  'Estética': GiFlowerStar,
  'Depilación': FaHeart,
  'default': FaSparkles
}

const CATEGORY_COLORS: Record<string, string> = {
  'Uñas': 'from-pink-500 to-rose-500',
  'Micropigmentación': 'from-amber-500 to-orange-500',
  'Peluquería': 'from-emerald-500 to-teal-500',
  'Cejas': 'from-violet-500 to-purple-500',
  'Estética': 'from-rose-500 to-pink-500',
  'Depilación': 'from-fuchsia-500 to-pink-500',
  'default': 'from-pink-500 to-rose-500'
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

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
}

export default function ServiciosPublicPage() {
  const [servicios, setServicios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // ✅ OBTENER TENANT_ID - VERSIÓN SIMPLIFICADA
  const getTenantId = async (): Promise<string | null> => {
    try {
      // 1. Intentar obtener de la sesión
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.user_metadata?.tenant_id) {
        return session.user.user_metadata.tenant_id
      }
      if (session?.user?.app_metadata?.tenant_id) {
        return session.user.app_metadata.tenant_id
      }

      // 2. Buscar en profiles
      if (session?.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', session.user.id)
          .maybeSingle()
        
        if (profile?.tenant_id) {
          return profile.tenant_id
        }
      }

      // 3. Buscar en clients
      if (session?.user?.id) {
        const { data: client } = await supabase
          .from('clients')
          .select('tenant_id')
          .eq('auth_user_id', session.user.id)
          .maybeSingle()
        
        if (client?.tenant_id) {
          return client.tenant_id
        }
      }

      // 4. Buscar el primer tenant disponible en appointments
      const { data: firstAppointment } = await supabase
        .from('appointments')
        .select('tenant_id')
        .limit(1)
        .maybeSingle()
      
      if (firstAppointment?.tenant_id) {
        return firstAppointment.tenant_id
      }

      // 5. Buscar en services directamente
      const { data: firstService } = await supabase
        .from('services')
        .select('tenant_id')
        .limit(1)
        .maybeSingle()
      
      if (firstService?.tenant_id) {
        return firstService.tenant_id
      }

      return null
    } catch (error) {
      console.error('Error obteniendo tenant_id:', error)
      return null
    }
  }

  // ✅ CARGAR SERVICIOS
  useEffect(() => {
    const fetchServicios = async () => {
      try {
        setLoading(true)

        const tenantId = await getTenantId()
        console.log('🔍 Tenant ID encontrado:', tenantId)

        if (!tenantId) {
          console.warn('⚠️ No se encontró tenant_id')
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
          console.error('❌ Error cargando servicios:', error)
          setServicios([])
        } else {
          console.log(`✅ ${data?.length || 0} servicios cargados`)
          setServicios(data || [])
        }
      } catch (error) {
        console.error('❌ Error en fetchServicios:', error)
        setServicios([])
      } finally {
        setLoading(false)
      }
    }

    fetchServicios()
  }, [])

  // ✅ CATEGORÍAS
  const categories = ['Todos', ...new Set(servicios.map(s => s.category).filter(Boolean))]
  const filteredServicios = selectedCategory === 'Todos'
    ? servicios
    : servicios.filter(s => s.category === selectedCategory)

  // ✅ RENDER
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0b0a] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-[#C9A96E]/20 border-t-[#C9A96E] animate-spin" />
            <FaSparkles className="w-6 h-6 text-[#C9A96E] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-xs text-stone-400 tracking-[0.3em] uppercase animate-pulse font-light">Cargando servicios...</p>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0b0a] text-white pt-28 pb-20 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] bg-pink-500/5" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] bg-amber-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(#1c1917_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* HEADER */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.span 
            variants={fadeInUp} 
            className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#C9A96E] border border-[#C9A96E]/20 px-5 py-2 rounded-full inline-block backdrop-blur-sm bg-[#C9A96E]/5"
          >
            ✦ DESCRUBRE NUESTROS SERVICIOS ✦
          </motion.span>
          <motion.h1 
            variants={fadeInUp} 
            className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight mt-6 leading-[1.05]"
          >
            Tratamientos{' '}
            <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#DB5B9A] via-[#C9A96E] to-[#E5A46E] bg-[length:300%_auto] animate-[gradient_4s_ease-in-out_infinite]">
              de Belleza
            </span>
          </motion.h1>
          <motion.p 
            variants={fadeInUp} 
            className="text-stone-400 mt-4 max-w-2xl mx-auto text-sm leading-relaxed"
          >
            Conoce todos los servicios que tenemos para ti en Fresh Beauty Studio.
          </motion.p>
        </motion.div>

        {/* CATEGORÍAS */}
        {categories.length > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-2 mb-12"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'text-white shadow-lg scale-105'
                    : 'text-stone-400 hover:text-white border border-stone-800 hover:border-[#C9A96E]/30'
                }`}
                style={selectedCategory === cat ? {
                  background: 'linear-gradient(135deg, #DB5B9A, #C9A96E)',
                  boxShadow: '0 4px 20px rgba(219, 91, 154, 0.3)'
                } : {}}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        )}

        {/* GRID */}
        {filteredServicios.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-stone-900/50 border border-stone-800 flex items-center justify-center mb-4">
              <FaSparkles className="w-8 h-8 text-stone-600" />
            </div>
            <p className="text-stone-400 text-sm">No hay servicios disponibles.</p>
            <p className="text-stone-500 text-xs mt-2">Tenant ID: {servicios.length}</p>
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredServicios.map((servicio, index) => {
              const Icon = CATEGORY_ICONS[servicio.category] || CATEGORY_ICONS.default
              const color = CATEGORY_COLORS[servicio.category] || CATEGORY_COLORS.default
              const imageUrl = servicio.image_url || CATEGORY_IMAGES[servicio.category] || CATEGORY_IMAGES.default
              const isHovered = hoveredId === servicio.id

              return (
                <motion.div
                  key={servicio.id}
                  variants={fadeInUp}
                  onMouseEnter={() => setHoveredId(servicio.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="group relative bg-gradient-to-b from-[#1a1715] to-[#141211] border border-stone-800/50 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:border-[#C9A96E]/30 hover:shadow-2xl hover:shadow-[#C9A96E]/5"
                >
                  {/* Imagen */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
                    <img 
                      src={imageUrl} 
                      alt={servicio.name}
                      className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1715] via-transparent to-transparent opacity-60" />

                    {servicio.badge && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.4, type: "spring", stiffness: 300 }}
                        className="absolute top-4 right-4 z-10 text-[8px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full text-white shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, #DB5B9A, #C9A96E)',
                          boxShadow: '0 4px 15px rgba(219, 91, 154, 0.3)'
                        }}
                      >
                        {servicio.badge}
                      </motion.span>
                    )}

                    <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
                      <span className="text-[8px] font-black uppercase tracking-[0.15em] text-white/90 flex items-center gap-1.5">
                        <Icon className="w-3 h-3 text-[#C9A96E]" />
                        {servicio.category || 'General'}
                      </span>
                    </div>

                    <motion.div 
                      animate={{ 
                        scale: isHovered ? 1.1 : 1,
                        y: isHovered ? -4 : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className={`absolute bottom-4 right-4 z-10 font-serif italic text-white text-xl px-4 py-2 rounded-xl shadow-lg shadow-black/40 bg-gradient-to-br ${color}`}
                    >
                      ${servicio.price}
                    </motion.div>

                    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 text-[10px] text-white/70 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
                      <FaClock className="w-3 h-3 text-[#C9A96E]" />
                      {servicio.duration} min
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-medium text-white group-hover:text-[#DB5B9A] transition-colors duration-300 line-clamp-1">
                      {servicio.name}
                    </h3>
                    <p className="text-sm text-stone-400 font-light mt-2 leading-relaxed line-clamp-2 flex-1">
                      {servicio.description || 'Descubre este tratamiento exclusivo en Fresh Beauty Studio.'}
                    </p>

                    <div className="mt-4 pt-4 border-t border-stone-800/50 flex items-center justify-between">
                      <Link 
                        href="/agenda" 
                        className="inline-flex items-center gap-2 text-xs font-bold text-[#DB5B9A] hover:text-[#C9A96E] transition-colors group/link"
                      >
                        Agendar
                        <FaArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </div>
                  </div>

                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                    className={`h-[2px] bg-gradient-to-r ${color} origin-left`}
                  />
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>

      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient { animation: gradient 4s ease-in-out infinite; }
      `}</style>
    </div>
  )
}