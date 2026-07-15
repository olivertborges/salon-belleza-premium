// app/(client)/peluqueria/page.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Scissors, 
  Clock, 
  DollarSign, 
  Star,
  Sparkles,
  Search,
  Filter,
  Grid3x3,
  LayoutList,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Heart,
  Users,
  Award,
  Quote,
  Instagram,
  Facebook,
  Twitter,
  Play,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Crown,
  Gem,
  Zap,
  Flame,
  Palette,
  Wind,
  Droplets,
  Leaf,
  Sun,
  Moon,
  Eye,
  Camera,
  Image,
  Video,
  Music,
  Coffee,
  Wine,
  Gift,
  PartyPopper
} from 'lucide-react'

interface Servicio {
  id: string
  tenant_id: string
  name: string
  description: string
  price: number
  duration: number
  category: string
  is_active: boolean
  image_url: string | null
  created_at: string
}

interface Testimonio {
  id: string
  client_name: string
  client_image: string | null
  rating: number
  comment: string
  service: string
  created_at: string
}

// Imágenes de muestra para cabello (reemplaza con tus propias imágenes)
const HAIR_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200&h=600&fit=crop',
  corte1: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=400&fit=crop',
  corte2: 'https://images.unsplash.com/photo-1560869713-7d0a2943084e?w=600&h=400&fit=crop',
  color1: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=600&h=400&fit=crop',
  color2: 'https://images.unsplash.com/photo-1522336572468-97b06e8ef143?w=600&h=400&fit=crop',
  tratamiento: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop',
  styling: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=400&fit=crop',
  gallery1: 'https://images.unsplash.com/photo-1560869713-7d0a2943084e?w=400&h=400&fit=crop',
  gallery2: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=400&fit=crop',
  gallery3: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400&h=400&fit=crop',
  gallery4: 'https://images.unsplash.com/photo-1522336572468-97b06e8ef143?w=400&h=400&fit=crop',
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 24 
    }
  }
}

export default function PeluqueriaPage() {
  const { tenantId } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'

  const [servicios, setServicios] = useState<Servicio[]>([])
  const [filteredServicios, setFilteredServicios] = useState<Servicio[]>([])
  const [testimonios, setTestimonios] = useState<Testimonio[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedService, setSelectedService] = useState<Servicio | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'servicios' | 'galeria' | 'testimonios'>('servicios')

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
  }

  // Categorías de servicios
  const categories = [
    { id: 'all', label: 'Todos', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'corte', label: 'Cortes', icon: <Scissors className="w-3.5 h-3.5" /> },
    { id: 'color', label: 'Coloración', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'tratamiento', label: 'Tratamientos', icon: <Droplets className="w-3.5 h-3.5" /> },
    { id: 'peinado', label: 'Peinados', icon: <Wind className="w-3.5 h-3.5" /> },
  ]

  useEffect(() => {
    loadServicios()
    loadTestimonios()
  }, [tenantId])

  const loadServicios = async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .eq('category', 'peluqueria')
        .order('name', { ascending: true })

      if (error) throw error
      setServicios(data || [])
      setFilteredServicios(data || [])
    } catch (error) {
      console.error('Error cargando servicios:', error)
      setError('Error al cargar los servicios de peluquería')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadTestimonios = async () => {
    if (!tenantId) return

    try {
      const { data } = await supabase
        .from('testimonials')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6)

      if (data) setTestimonios(data)
    } catch (error) {
      console.error('Error cargando testimonios:', error)
    }
  }

  useEffect(() => {
    let filtered = servicios
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory)
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term)
      )
    }
    setFilteredServicios(filtered)
  }, [selectedCategory, searchTerm, servicios])

  const openModal = (servicio: Servicio) => {
    setSelectedService(servicio)
    setIsModalOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedService(null)
    document.body.style.overflow = 'unset'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 animate-spin" style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }} />
          <Scissors className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ color: primaryColor }} />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse" style={{ color: primaryColor }}>
          Preparando tu experiencia de belleza...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">

      {/* ============================================================ */}
      {/* HERO SECTION - ESPECTACULAR */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0">
          <img 
            src={HAIR_IMAGES.hero}
            alt="Peluquería Fresh Nails"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        </div>

        <div className="relative z-10 px-6 py-16 md:py-24 md:px-12 lg:px-16">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-sm bg-white/10 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/80">
                  {settings?.business_name || 'Fresh Nails Studio'} • Peluquería
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-white leading-[1.1]">
                <span className="font-serif italic" style={{ color: secondaryColor }}>Arte</span>
                <span className="block text-5xl md:text-7xl lg:text-8xl font-bold">Capilar</span>
              </h1>

              <p className="text-base md:text-lg text-white/80 mt-4 max-w-lg leading-relaxed">
                Transformamos tu cabello en una obra de arte. Cortes, coloraciones y tratamientos de vanguardia con los mejores profesionales.
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 rounded-xl text-white text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all"
                  style={{ background: brandGradient.backgroundImage }}
                >
                  <Calendar className="w-4 h-4" />
                  Reservar ahora
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-white/20"
                >
                  <Play className="w-4 h-4" />
                  Ver galería
                </motion.button>
              </div>

              <div className="flex items-center gap-6 mt-6">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white/30 bg-gradient-to-br from-pink-400 to-amber-400 flex items-center justify-center text-[10px] font-bold text-white">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center text-[9px] font-bold text-white">
                    +12
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">12+ profesionales</p>
                  <p className="text-xs text-white/60">Expertos en cabello</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Decoración flotante */}
        <div className="absolute bottom-10 right-10 hidden lg:block">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center"
          >
            <Scissors className="w-8 h-8 text-white/40" />
          </motion.div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CATEGORÍAS RÁPIDAS */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-2 justify-center"
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              selectedCategory === cat.id
                ? 'text-white shadow-md'
                : isDark
                  ? 'bg-[#130f24] border-fuchsia-950 text-stone-400 hover:text-stone-200'
                  : 'bg-white border-pink-100/60 text-stone-600 hover:bg-pink-50'
            }`}
            style={selectedCategory === cat.id ? { background: brandGradient.backgroundImage } : {}}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </motion.div>

      {/* ============================================================ */}
      {/* TABS: SERVICIOS | GALERÍA | TESTIMONIOS */}
      {/* ============================================================ */}
      <div className="flex border-b border-pink-100/60 dark:border-fuchsia-950/60">
        {[
          { id: 'servicios', label: 'Servicios', icon: <Scissors className="w-4 h-4" /> },
          { id: 'galeria', label: 'Galería', icon: <Camera className="w-4 h-4" /> },
          { id: 'testimonios', label: 'Testimonios', icon: <Quote className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 ${
              activeTab === tab.id
                ? `border-[${primaryColor}] text-stone-900 dark:text-white`
                : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
            }`}
            style={activeTab === tab.id ? { borderColor: primaryColor } : {}}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* TAB: SERVICIOS */}
      {/* ============================================================ */}
      {activeTab === 'servicios' && (
        <>
          {/* BÚSQUEDA */}
          <div className="flex flex-col md:flex-row gap-3 p-3 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <Search className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
              <input 
                type="text" 
                placeholder="Buscar servicios de peluquería..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-stone-800 dark:text-pink-100 placeholder:text-stone-400 w-full"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border ${
                  showFilters ? 'text-white border-transparent shadow-md' : 'bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950'
                }`}
                style={showFilters ? { background: brandGradient.backgroundImage } : {}}
              >
                <Filter className="w-3.5 h-3.5" /> Filtros
              </button>

              <div className={`flex rounded-xl overflow-hidden border p-0.5 bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950`}>
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'text-white shadow-sm' : 'text-stone-400'}`} style={viewMode === 'grid' ? { background: brandGradient.backgroundImage } : {}}>
                  <Grid3x3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'text-white shadow-sm' : 'text-stone-400'}`} style={viewMode === 'list' ? { background: brandGradient.backgroundImage } : {}}>
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* GRID DE SERVICIOS */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredServicios.length === 0 ? (
              <div className="col-span-full text-center py-16 border border-dashed rounded-2xl border-pink-200 dark:border-fuchsia-950">
                <Scissors className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-sm text-stone-500">No hay servicios de peluquería disponibles</p>
              </div>
            ) : (
              filteredServicios.map((servicio) => (
                <motion.div key={servicio.id} variants={itemVariants}>
                  <div 
                    className="group relative rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 hover:border-pink-300 dark:hover:border-fuchsia-800"
                    onClick={() => openModal(servicio)}
                  >
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative aspect-video overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800">
                      <img 
                        src={servicio.image_url || HAIR_IMAGES.corte1}
                        alt={servicio.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="mt-4 space-y-2">
                      <h3 className="font-bold text-sm text-stone-800 dark:text-white group-hover:text-pink-500 transition-colors">
                        {servicio.name}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                        {servicio.description}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-pink-100/60 dark:border-fuchsia-950">
                        <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
                          <Clock className="w-3.5 h-3.5" />
                          {servicio.duration} min
                        </div>
                        <div className="flex items-center gap-1 text-sm font-bold text-emerald-500">
                          <DollarSign className="w-3.5 h-3.5" />
                          ${servicio.price}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB: GALERÍA */}
      {/* ============================================================ */}
      {activeTab === 'galeria' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
            Descubre nuestro trabajo y transformaciones capilares
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { src: HAIR_IMAGES.gallery1, title: 'Corte moderno' },
              { src: HAIR_IMAGES.gallery2, title: 'Coloración balayage' },
              { src: HAIR_IMAGES.gallery3, title: 'Tratamiento de keratina' },
              { src: HAIR_IMAGES.gallery4, title: 'Peinado de novia' },
              { src: HAIR_IMAGES.corte1, title: 'Corte degradado' },
              { src: HAIR_IMAGES.color1, title: 'Coloración fantasía' },
              { src: HAIR_IMAGES.tratamiento, title: 'Hidratación profunda' },
              { src: HAIR_IMAGES.styling, title: 'Styling de pasarela' },
            ].map((img, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
              >
                <img 
                  src={img.src}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <p className="text-white text-xs font-bold">{img.title}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center pt-4">
            <button className="px-6 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition hover:scale-105" style={{ background: brandGradient.backgroundImage }}>
              Ver toda la galería
            </button>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* TAB: TESTIMONIOS */}
      {/* ============================================================ */}
      {activeTab === 'testimonios' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
            Lo que dicen nuestros clientes sobre su experiencia
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonios.length === 0 ? (
              // Testimonios de muestra
              [
                { name: 'María García', comment: 'El mejor salón de peluquería que he visitado. El equipo es increíblemente talentoso y profesional.', rating: 5, service: 'Corte y color' },
                { name: 'Laura Martínez', comment: 'Mi experiencia fue maravillosa. Salí con un look totalmente renovado y me encanta.', rating: 5, service: 'Balayage' },
                { name: 'Carmen Rodríguez', comment: 'Excelente atención y resultados espectaculares. 100% recomendado.', rating: 5, service: 'Tratamiento capilar' },
              ].map((t, idx) => (
                <div key={idx} className="p-4 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-amber-400 flex items-center justify-center text-white font-bold text-sm">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-stone-900 dark:text-white">{t.name}</p>
                      <p className="text-xs text-stone-400">{t.service}</p>
                    </div>
                  </div>
                  <div className="flex text-amber-400 text-xs mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">"{t.comment}"</p>
                </div>
              ))
            ) : (
              testimonios.map((t) => (
                <div key={t.id} className="p-4 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-amber-400 flex items-center justify-center text-white font-bold text-sm">
                      {t.client_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-stone-900 dark:text-white">{t.client_name}</p>
                      <p className="text-xs text-stone-400">{t.service}</p>
                    </div>
                  </div>
                  <div className="flex text-amber-400 text-xs mb-2">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">"{t.comment}"</p>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE SERVICIO */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isModalOpen && selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${
                isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-white border-pink-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>

              <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
                <img 
                  src={selectedService.image_url || HAIR_IMAGES.corte1}
                  alt={selectedService.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-bold">
                  {selectedService.duration} min
                </div>
              </div>

              <h3 className="text-2xl font-bold text-stone-900 dark:text-white">
                {selectedService.name}
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
                {selectedService.description}
              </p>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-pink-100/60 dark:border-fuchsia-950">
                <div className="text-2xl font-bold text-emerald-500">
                  ${selectedService.price}
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition hover:scale-105" style={{ background: brandGradient.backgroundImage }}>
                    Reservar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}