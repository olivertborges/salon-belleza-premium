'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  Star,
  Sparkles,
  Search,
  Filter,
  Grid3x3,
  LayoutList,
  AlertCircle,
  CheckCircle2,
  Quote,
  Calendar,
  Eye,
  Camera,
  StarHalf,
  Send,
  X,
  Loader2,
  Droplets,
  Feather
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

interface Review {
  id: string
  tenant_id: string
  client_id: string
  service_id: string
  professional_id: string | null
  rating: number
  comment: string
  images: string[]
  is_approved: boolean
  created_at: string
  client_name?: string
}

const MICRO_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=1200&h=600&fit=crop',
  cejas1: 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=600&h=400&fit=crop',
  cejas2: 'https://images.unsplash.com/photo-1611849889765-cde2b945cf09?w=600&h=400&fit=crop',
  cejas3: 'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=600&h=400&fit=crop',
  labios1: 'https://images.unsplash.com/photo-1589256469067-ea99122bb5f4?w=600&h=400&fit=crop',
  labios2: 'https://images.unsplash.com/photo-1589256469067-ea99122bb5f4?w=600&h=400&fit=crop',
  ojos1: 'https://images.unsplash.com/photo-1611849889765-cde2b945cf09?w=600&h=400&fit=crop',
  ojos2: 'https://images.unsplash.com/photo-1604685227049-0ea4b0f9b1b3?w=600&h=400&fit=crop',
  tratamiento: 'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=600&h=400&fit=crop',
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export default function MicropigmentacionPage() {
  const { user, tenantId } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'

  const [servicios, setServicios] = useState<Servicio[]>([])
  const [filteredServicios, setFilteredServicios] = useState<Servicio[]>([])
  const [reviews, setReviews] = useState<Record<string, Review[]>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedService, setSelectedService] = useState<Servicio | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'servicios' | 'galeria' | 'testimonios'>('servicios')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
  }

  const categories = [
    { id: 'all', label: 'Todos', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'Cejas', label: 'Cejas', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'Labios', label: 'Labios', icon: <Droplets className="w-3.5 h-3.5" /> },
    { id: 'Ojos', label: 'Ojos', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'Tratamientos', label: 'Tratamientos', icon: <Feather className="w-3.5 h-3.5" /> },
  ]

  useEffect(() => {
    loadServicios()
    loadReviews()
  }, [tenantId])

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

  const loadServicios = async () => {
    if (!tenantId) { setLoading(false); return }
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .in('category', ['Cejas', 'Labios', 'Ojos', 'Tratamientos', 'micropigmentacion', 'Micropigmentación'])
        .order('name', { ascending: true })

      if (error) throw error
      setServicios(data || [])
      setFilteredServicios(data || [])
    } catch (error) {
      console.error('Error cargando servicios:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    if (!tenantId) return
    try {
      const reviewsMap: Record<string, Review[]> = {}
      const { data, error } = await supabase
        .from('reviews')
        .select(`*, clients:client_id (name, avatar_url)`)
        .eq('tenant_id', tenantId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        data.forEach((review: any) => {
          const serviceId = review.service_id
          if (!reviewsMap[serviceId]) reviewsMap[serviceId] = []
          reviewsMap[serviceId].push({
            ...review,
            client_name: review.clients?.name || 'Cliente'
          })
        })
      }
      setReviews(reviewsMap)
    } catch (error) {
      console.error('Error cargando reviews:', error)
    }
  }

  const handleSubmitReview = async () => {
    if (!user || !tenantId || rating === 0 || !comment.trim()) return
    setSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          tenant_id: tenantId,
          client_id: user.id,
          service_id: selectedService!.id,
          professional_id: null,
          rating: rating,
          comment: comment.trim(),
          images: [],
          is_approved: true,
          created_at: new Date().toISOString()
        })
        .select()

      if (error) throw error

      if (data) {
        const newReview: Review = {
          ...data[0],
          client_name: user.user_metadata?.name || user.email || 'Cliente'
        }
        setReviews(prev => ({
          ...prev,
          [selectedService!.id]: [newReview, ...(prev[selectedService!.id] || [])]
        }))
      }

      setSuccessMessage('✅ ¡Gracias por tu calificación!')
      setTimeout(() => setSuccessMessage(null), 3000)
      setShowReviewModal(false)
      setRating(0)
      setComment('')
      setSelectedService(null)
    } catch (error) {
      setErrorMessage('Error al enviar la calificación')
      setTimeout(() => setErrorMessage(null), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  const getAverageRating = (serviceId: string) => {
    const serviceReviews = reviews[serviceId] || []
    if (serviceReviews.length === 0) return 0
    return serviceReviews.reduce((acc, r) => acc + r.rating, 0) / serviceReviews.length
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' }
    const sizeClass = sizes[size]
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => <Star key={`f-${i}`} className={`${sizeClass} fill-amber-400 text-amber-400`} />)}
        {hasHalfStar && <StarHalf className={`${sizeClass} fill-amber-400 text-amber-400`} />}
        {[...Array(emptyStars)].map((_, i) => <Star key={`e-${i}`} className={`${sizeClass} text-stone-300 dark:text-stone-600`} />)}
      </div>
    )
  }

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
          <Sparkles className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: primaryColor }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4">
      {errorMessage && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">{errorMessage}</div>}
      {successMessage && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">{successMessage}</div>}

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl min-h-[380px] flex items-center">
        <div className="absolute inset-0">
          <img src={MICRO_IMAGES.hero} alt="Micropigmentación" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        </div>
        <div className="relative z-10 p-6 md:p-12 max-w-2xl text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/10 mb-4 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Fresh Nails • Micropigmentación</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-light tracking-tight leading-tight">
            <span className="font-serif italic" style={{ color: secondaryColor }}>Arte</span> Permanente
          </h1>
          <p className="text-sm md:text-base text-white/80 mt-4 max-w-md">
            Microblading, Microshading y técnicas avanzadas conducidas por nuestra especialista <span className="font-bold text-amber-300">Ana Martínez</span>.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/agenda" className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 transition hover:scale-105" style={{ background: brandGradient.backgroundImage }}>
              <Calendar className="w-4 h-4" /> Reservar
            </Link>
            <button onClick={() => setActiveTab('galeria')} className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition hover:bg-white/20">
              <Camera className="w-4 h-4" /> Galería
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-stone-200 dark:border-stone-800">
        {(['servicios', 'galeria', 'testimonios'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all ${
              activeTab === tab ? 'text-pink-500' : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
            style={activeTab === tab ? { borderColor: primaryColor, color: primaryColor } : {}}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* CONTENIDO DE TABS */}
      {activeTab === 'servicios' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id ? 'text-white shadow-md' : isDark ? 'bg-[#130f24] text-stone-400' : 'bg-white text-stone-600 border'
                }`}
                style={selectedCategory === cat.id ? { background: brandGradient.backgroundImage } : {}}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 p-3 rounded-2xl border bg-white dark:bg-[#130f24] dark:border-stone-800">
            <div className="flex-1 flex items-center gap-3">
              <Search className="w-4 h-4 text-stone-400" />
              <input 
                type="text" 
                placeholder="Buscar servicios..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent outline-none text-xs w-full dark:text-white"
              />
            </div>
            <div className="flex rounded-xl overflow-hidden border p-0.5 dark:border-stone-800">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-stone-100 dark:bg-stone-800' : 'text-stone-400'}`}><Grid3x3 className="w-3.5 h-3.5" /></button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-stone-100 dark:bg-stone-800' : 'text-stone-400'}`}><LayoutList className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible" 
            className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}
          >
            {filteredServicios.map((servicio) => {
              const avgRating = getAverageRating(servicio.id)
              let imageUrl = servicio.image_url || MICRO_IMAGES.cejas1
              if (servicio.category === 'Labios') imageUrl = MICRO_IMAGES.labios1
              if (servicio.category === 'Ojos') imageUrl = MICRO_IMAGES.ojos1

              return (
                <motion.div 
                  key={servicio.id} 
                  variants={itemVariants} 
                  className={`p-4 border rounded-2xl bg-white dark:bg-[#130f24] dark:border-stone-800 flex ${viewMode === 'grid' ? 'flex-col justify-between' : 'flex-row gap-4 items-center'}`}
                >
                  <div onClick={() => openModal(servicio)} className={`cursor-pointer ${viewMode === 'grid' ? 'space-y-2' : 'flex-1 flex gap-4 items-center'}`}>
                    <img src={imageUrl} alt={servicio.name} className={`${viewMode === 'grid' ? 'w-full aspect-video' : 'w-24 h-24'} object-cover rounded-xl`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center"><h3 className="font-bold text-sm dark:text-white">{servicio.name}</h3><span className="text-xs font-bold text-emerald-500">${servicio.price}</span></div>
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1">{servicio.description}</p>
                    </div>
                  </div>
                  <div className={`flex items-center justify-between ${viewMode === 'grid' ? 'mt-4 pt-2 border-t' : 'flex-col gap-2 justify-center'} dark:border-stone-800`}>
                    <div className="flex items-center gap-1 text-[11px] text-stone-400"><Clock className="w-3 h-3" /> {servicio.duration} min</div>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedService(servicio); setShowReviewModal(true) }} className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1"><Star className="w-3 h-3 fill-amber-500" /> Reseñar</button>
                      <Link href="/agenda" className="px-3 py-1 rounded-lg text-white text-[10px] font-bold uppercase tracking-wider" style={{ background: brandGradient.backgroundImage }}>Agendar</Link>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      )}

      {activeTab === 'galeria' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn">
          {Object.values(MICRO_IMAGES).filter((_, i) => i > 0).map((img, index) => (
            <div key={index} className="overflow-hidden rounded-2xl aspect-square bg-stone-100 relative group">
              <img src={img} alt="Galería Trabajo" className="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'testimonios' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
          {Object.values(reviews).flat().length === 0 ? (
            <div className="col-span-full text-center py-12 text-stone-400 text-xs uppercase tracking-widest">Aún no hay testimonios registrados</div>
          ) : (
            Object.values(reviews).flat().map((rev) => (
              <div key={rev.id} className="p-5 border rounded-2xl bg-white dark:bg-[#130f24] dark:border-stone-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-xs dark:text-white">{rev.client_name}</h4>
                    <span className="text-[10px] text-stone-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                  </div>
                  {renderStars(rev.rating)}
                </div>
                <p className="text-xs italic text-stone-600 dark:text-stone-300 flex gap-2"><Quote className="w-4 h-4 shrink-0 opacity-20" />{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODALS */}
      <AnimatePresence>
        {isModalOpen && selectedService && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
            <motion.div className="bg-white dark:bg-[#0f0c1b] p-6 rounded-3xl max-w-sm w-full space-y-4 relative" onClick={e => e.stopPropagation()}>
              <button onClick={closeModal} className="absolute top-4 right-4 text-stone-400"><X className="w-4 h-4" /></button>
              <h3 className="text-lg font-bold dark:text-white">{selectedService.name}</h3>
              <p className="text-xs text-stone-500 leading-relaxed">{selectedService.description}</p>
              <div className="flex justify-between items-center pt-2"><span className="font-bold text-emerald-500">${selectedService.price}</span><Link href="/agenda" className="px-4 py-2 text-white text-xs font-bold rounded-xl" style={{ background: brandGradient.backgroundImage }}>Agendar Cupo</Link></div>
            </motion.div>
          </motion.div>
        )}

        {showReviewModal && selectedService && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowReviewModal(false)}>
            <motion.div className="bg-white dark:bg-[#0f0c1b] p-6 rounded-3xl max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-bold dark:text-white">Calificar {selectedService.name}</h3>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(s)}>
                    <Star className={`w-8 h-8 ${(hoverRating || rating) >= s ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                  </button>
                ))}
              </div>
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Tu opinión sobre el servicio..." className="w-full p-3 border rounded-xl text-xs dark:bg-stone-900 outline-none" rows={3} />
              <div className="flex gap-2">
                <button onClick={() => setShowReviewModal(false)} className="flex-1 py-2 border rounded-xl text-xs">Cancelar</button>
                <button onClick={handleSubmitReview} disabled={submitting || !rating} className="flex-1 py-2 text-white text-xs rounded-xl font-bold flex justify-center items-center" style={{ backgroundColor: primaryColor }}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
