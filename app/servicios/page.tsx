// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, Star, Clock, ArrowRight, 
  MessageCircle, X, AlertCircle, CheckCircle2, Loader2,
  Eye, Gem, Crown, Scissors, Heart, Flower2, Droplets, Wind
} from 'lucide-react'
import Link from 'next/link'

interface Servicio {
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

interface Review {
  id: string
  tenant_id: string
  client_id: string
  service_id: string
  rating: number
  comment: string
  images: string[]
  is_approved: boolean
  created_at: string
  client_name?: string
}

// ✅ ICONOS POR CATEGORÍA
const CATEGORY_ICONS: Record<string, any> = {
  'Uñas': Scissors,
  'Micropigmentación': Eye,
  'Peluquería': Scissors,
  'Cejas': Eye,
  'Estética': Flower2,
  'Depilación': Heart,
  'default': Sparkles
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
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [reviews, setReviews] = useState<Record<string, Review[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('todos')
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const primaryColor = '#DB5B9A'

  useEffect(() => {
    cargarServicios()
  }, [])

  const cargarServicios = async () => {
    try {
      setLoading(true)

      // ✅ OBTENER TENANT_ID (público)
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

      // ✅ CARGAR SERVICIOS
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setServicios(data || [])

      const categorias = [...new Set(data.map(s => s.category).filter(Boolean))] as string[]
      setCategoriasDisponibles(categorias)

      // ✅ CARGAR REVIEWS
      await cargarReviews(data || [], tenantId)
    } catch (error) {
      console.error('Error cargando servicios:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarReviews = async (serviciosList: Servicio[], tenantId: string) => {
    try {
      const reviewsMap: Record<string, Review[]> = {}

      for (const servicio of serviciosList) {
        const { data, error } = await supabase
          .from('review')
          .select(`
            *,
            clients:client_id (name, avatar_url)
          `)
          .eq('service_id', servicio.id)
          .eq('tenant_id', tenantId)
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(5)

        if (!error && data) {
          reviewsMap[servicio.id] = data.map((r: any) => ({
            ...r,
            client_name: r.clients?.name || 'Cliente'
          }))
        }
      }

      setReviews(reviewsMap)
    } catch (error) {
      console.error('Error cargando reviews:', error)
    }
  }

  const getAverageRating = (serviceId: string) => {
    const serviceReviews = reviews[serviceId] || []
    if (serviceReviews.length === 0) return 0
    const sum = serviceReviews.reduce((acc, r) => acc + r.rating, 0)
    return sum / serviceReviews.length
  }

  const getRatingCount = (serviceId: string) => {
    return reviews[serviceId]?.length || 0
  }

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4' }
    const className = sizes[size] || sizes.sm
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - Math.ceil(rating)

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className={`${className} fill-yellow-400 text-yellow-400`} />
        ))}
        {hasHalfStar && (
          <Star className={`${className} fill-yellow-400 text-yellow-400`} />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className={`${className} text-stone-300 dark:text-stone-600`} />
        ))}
      </div>
    )
  }

  const filteredServices = selectedCategory === 'todos'
    ? servicios
    : servicios.filter(s => s.category === selectedCategory)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0b0a] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-[#C9A96E]/20 border-t-[#C9A96E] animate-spin" />
            <Sparkles className="w-6 h-6 text-[#C9A96E] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
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
      {/* Fondo decorativo */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] bg-pink-500/5" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] bg-amber-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(#1c1917_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* ============================================================ */}
        {/* HEADER */}
        {/* ============================================================ */}
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
            Cada tratamiento está diseñado para realzar tu belleza natural.
          </motion.p>
        </motion.div>

        {/* ============================================================ */}
        {/* CATEGORÍAS */}
        {/* ============================================================ */}
        {categoriasDisponibles.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-2 mb-12"
          >
            <button
              onClick={() => setSelectedCategory('todos')}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                selectedCategory === 'todos'
                  ? 'text-white shadow-lg scale-105'
                  : 'text-stone-400 hover:text-white border border-stone-800 hover:border-[#C9A96E]/30'
              }`}
              style={selectedCategory === 'todos' ? {
                background: 'linear-gradient(135deg, #DB5B9A, #C9A96E)',
                boxShadow: '0 4px 20px rgba(219, 91, 154, 0.3)'
              } : {}}
            >
              Todos
            </button>
            {categoriasDisponibles.map((cat) => (
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

        {/* ============================================================ */}
        {/* GRID DE SERVICIOS */}
        {/* ============================================================ */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-stone-900/50 border border-stone-800 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-stone-600" />
            </div>
            <p className="text-stone-400 text-sm">No hay servicios disponibles en esta categoría.</p>
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredServices.map((servicio, index) => {
              const Icon = CATEGORY_ICONS[servicio.category] || CATEGORY_ICONS.default
              const color = CATEGORY_COLORS[servicio.category] || CATEGORY_COLORS.default
              const imageUrl = servicio.image_url || CATEGORY_IMAGES[servicio.category] || CATEGORY_IMAGES.default
              const avgRating = getAverageRating(servicio.id)
              const ratingCount = getRatingCount(servicio.id)
              const isHovered = hoveredId === servicio.id

              return (
                <motion.div
                  key={servicio.id}
                  variants={fadeInUp}
                  onMouseEnter={() => setHoveredId(servicio.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="group relative bg-gradient-to-b from-[#1a1715] to-[#141211] border border-stone-800/50 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:border-[#C9A96E]/30 hover:shadow-2xl hover:shadow-[#C9A96E]/5"
                >
                  {/* ========================================================== */}
                  {/* IMAGEN */}
                  {/* ========================================================== */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
                    <img 
                      src={imageUrl} 
                      alt={servicio.name}
                      className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1715] via-transparent to-transparent opacity-60" />

                    {/* Badge animado */}
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

                    {/* Categoría */}
                    <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
                      <span className="text-[8px] font-black uppercase tracking-[0.15em] text-white/90 flex items-center gap-1.5">
                        <Icon className="w-3 h-3 text-[#C9A96E]" />
                        {servicio.category || 'General'}
                      </span>
                    </div>

                    {/* Precio flotante */}
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

                    {/* Duración */}
                    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 text-[10px] text-white/70 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
                      <Clock className="w-3 h-3 text-[#C9A96E]" />
                      {servicio.duration} min
                    </div>
                  </div>

                  {/* ========================================================== */}
                  {/* CONTENIDO */}
                  {/* ========================================================== */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-medium text-white group-hover:text-[#DB5B9A] transition-colors duration-300 line-clamp-1">
                      {servicio.name}
                    </h3>
                    <p className="text-sm text-stone-400 font-light mt-2 leading-relaxed line-clamp-2 flex-1">
                      {servicio.description || 'Descubre este tratamiento exclusivo en Fresh Beauty Studio.'}
                    </p>

                    {/* Rating */}
                    {ratingCount > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        {renderStars(avgRating, 'sm')}
                        <span className="text-[10px] text-stone-400">
                          ({ratingCount} {ratingCount === 1 ? 'reseña' : 'reseñas'})
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-stone-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {servicio.icon && (
                          <span className="text-xs text-stone-500">
                            {servicio.icon}
                          </span>
                        )}
                      </div>
                      <Link 
                        href="/agenda" 
                        className="inline-flex items-center gap-2 text-xs font-bold text-[#DB5B9A] hover:text-[#C9A96E] transition-colors group/link"
                      >
                        Agendar
                        <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </div>
                  </div>

                  {/* Línea de brillo inferior */}
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

        {/* ============================================================ */}
        {/* CTA FINAL */}
        {/* ============================================================ */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center mt-16"
        >
          <div className="relative overflow-hidden rounded-3xl p-10 text-center" style={{ background: 'linear-gradient(135deg, rgba(219,91,154,0.15), rgba(201,169,110,0.1))' }}>
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-[100px] bg-[#DB5B9A]/10" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-[100px] bg-[#C9A96E]/10" />
            
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-light text-white">
                ¿Lista para <span className="font-serif italic text-[#DB5B9A]">brillar</span>?
              </h2>
              <p className="text-stone-400 mt-2 text-sm">
                Reserva tu cita y descubre la experiencia Fresh Nails.
              </p>
              <Link 
                href="/agenda" 
                className="inline-flex items-center gap-3 px-8 py-4 mt-6 rounded-xl text-white font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-[#DB5B9A] to-[#C9A96E] hover:opacity-90 transition-all shadow-lg shadow-[#DB5B9A]/20 group"
              >
                <Sparkles className="w-4 h-4" />
                AGENDAR CITA
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-xs text-stone-500 mt-3">
                ¿Ya tienes cuenta? <Link href="/login" className="text-[#C9A96E] hover:underline">Inicia sesión</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}