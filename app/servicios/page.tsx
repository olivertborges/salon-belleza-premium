// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Scissors, Sparkles, Star, Heart, 
  Clock, User, ChevronRight, Calendar, 
  Crown, ArrowRight, Gem,
  Wind, Droplets, Flower2, 
  Waves, Sparkle, Leaf, Eye, Brush, Palette,
  StarHalf, MessageCircle, ThumbsUp, Send, X,
  AlertCircle, CheckCircle2, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

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
  professional_id: string
  rating: number
  comment: string
  images: string[]
  is_approved: boolean
  created_at: string
  client_name?: string
  client_avatar?: string
}

export default function ServiciosPage() {
  const { theme } = useTheme()
  const { user, tenantId } = useAuth()
  const isDark = theme === 'dark'
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [reviews, setReviews] = useState<Record<string, Review[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('todos')
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>([])
  const [selectedService, setSelectedService] = useState<Servicio | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const primaryColor = '#DB5B9A'

  useEffect(() => {
    cargarServicios()
  }, [])

  const cargarServicios = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      setServicios(data || [])

      const categorias = [...new Set(data.map(s => s.category).filter(Boolean))] as string[]
      setCategoriasDisponibles(categorias)

      await cargarReviews(data || [])
    } catch (error) {
      console.error('Error cargando servicios:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarReviews = async (serviciosList: Servicio[]) => {
    if (!tenantId) {
      console.log('No hay tenantId, no se cargan reviews')
      return
    }

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

  const handleSubmitReview = async () => {
    if (!user) {
      setErrorMessage('Debes iniciar sesión para calificar')
      setTimeout(() => setErrorMessage(null), 3000)
      return
    }

    if (!tenantId) {
      setErrorMessage('No hay tenant disponible')
      setTimeout(() => setErrorMessage(null), 3000)
      return
    }

    if (rating === 0) {
      setErrorMessage('Selecciona una calificación')
      setTimeout(() => setErrorMessage(null), 3000)
      return
    }

    if (!comment.trim()) {
      setErrorMessage('Escribe un comentario')
      setTimeout(() => setErrorMessage(null), 3000)
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      const { data, error } = await supabase
        .from('review')
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
          client_name: user.email?.split('@')[0] || 'Cliente'
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

    } catch (error: any) {
      console.error('Error enviando review:', error)
      setErrorMessage('Error al enviar la calificación')
      setTimeout(() => setErrorMessage(null), 3000)
    } finally {
      setSubmitting(false)
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

  // ============================================================
  // ✅ FUNCIÓN RENDER STARS CORREGIDA
  // ============================================================
  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizes = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    }
    const className = sizes[size] || sizes.md
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - Math.ceil(rating)

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className={`${className} fill-yellow-400 text-yellow-400`} />
        ))}
        {hasHalfStar && (
          <StarHalf className={`${className} fill-yellow-400 text-yellow-400`} />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className={`${className} text-gray-300 dark:text-gray-600`} />
        ))}
      </div>
    )
  }

  const filteredServices = selectedCategory === 'todos'
    ? servicios
    : servicios.filter(s => s.category === selectedCategory)

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor }} />
          <div className="absolute inset-0 w-12 h-12 rounded-full animate-ping opacity-20" style={{ backgroundColor: primaryColor }} />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse" style={{ color: primaryColor }}>
          Cargando servicios...
        </p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0908] text-white' : 'bg-[#fcf9f7] text-stone-800'}`}>

      {/* HERO HEADER */}
      <div className="relative overflow-hidden px-4 pt-12 pb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-amber-500/5" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30" style={{ backgroundColor: primaryColor }} />

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-pink-500/20 bg-pink-500/5 text-pink-500 text-[10px] font-mono uppercase tracking-widest font-bold">
              <Sparkles className="w-3 h-3" />
              Fresh Nails Studio
            </span>
            <h1 className="text-3xl md:text-5xl font-serif font-bold mt-4 leading-tight">
              Nuestros{' '}
              <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                Servicios
              </span>
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-3 max-w-xl mx-auto">
              Descubre nuestra selección de tratamientos premium diseñados para realzar tu belleza natural
            </p>
          </motion.div>
        </div>
      </div>

      {/* CATEGORÍAS */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('todos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedCategory === 'todos'
                ? 'text-white shadow-lg'
                : 'border border-pink-100/60 dark:border-fuchsia-950 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-pink-100'
            }`}
            style={selectedCategory === 'todos' ? { backgroundColor: primaryColor } : {}}
          >
            Todos
          </button>
          {categoriasDisponibles.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'text-white shadow-lg'
                  : 'border border-pink-100/60 dark:border-fuchsia-950 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-pink-100'
              }`}
              style={selectedCategory === cat ? { backgroundColor: primaryColor } : {}}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRID DE SERVICIOS */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {filteredServices.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
            <p className="text-sm text-stone-400 dark:text-stone-500">No hay servicios disponibles en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((servicio, index) => {
              const avgRating = getAverageRating(servicio.id)
              const ratingCount = getRatingCount(servicio.id)

              return (
                <motion.div
                  key={servicio.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group rounded-2xl border p-5 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 ${
                    isDark 
                      ? 'bg-[#141211] border-stone-800 hover:border-pink-500/30' 
                      : 'bg-white border-stone-200/60 hover:border-pink-200'
                  }`}
                >
                  {/* Badge */}
                  {servicio.badge && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-gradient-to-r from-pink-500 to-rose-500 text-white mb-3">
                      {servicio.badge}
                    </span>
                  )}

                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-stone-800 dark:text-white group-hover:text-pink-500 transition-colors">
                      {servicio.name}
                    </h3>
                    <span className="text-xs font-mono font-bold text-stone-400 dark:text-stone-500">
                      {servicio.duration}min
                    </span>
                  </div>

                  {/* Descripción */}
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 line-clamp-2">
                    {servicio.description || 'Tratamiento de belleza premium'}
                  </p>

                  {/* Rating */}
                  {ratingCount > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      {renderStars(avgRating, 'sm')}
                      <span className="text-[10px] text-stone-400 dark:text-stone-500">
                        ({ratingCount})
                      </span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
                    <span className="text-lg font-bold text-pink-500">
                      ${servicio.price.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedService(servicio)
                          setRating(0)
                          setComment('')
                          setShowReviewModal(true)
                        }}
                        className="p-1.5 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-950/20 text-stone-400 hover:text-pink-500 transition-colors"
                        title="Calificar servicio"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/servicios/${servicio.id}`}
                        className="p-1.5 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-950/20 text-stone-400 hover:text-pink-500 transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL DE CALIFICACIÓN */}
      <AnimatePresence>
        {showReviewModal && selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowReviewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl border bg-white dark:bg-[#141211] border-pink-100/60 dark:border-fuchsia-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowReviewModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-pink-50 dark:hover:bg-fuchsia-950/40 transition-colors text-stone-400 hover:text-stone-700 dark:hover:text-pink-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl text-white shadow-md" style={{ backgroundColor: primaryColor }}>
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-stone-800 dark:text-white">
                    Calificar {selectedService.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Comparte tu experiencia</p>
                </div>
              </div>

              {/* Estrellas */}
              <div className="flex items-center gap-1 justify-center py-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <p className="text-center text-xs text-stone-400 dark:text-stone-500 mb-4">
                {rating === 1 && '⭐ Muy malo'}
                {rating === 2 && '⭐⭐ Malo'}
                {rating === 3 && '⭐⭐⭐ Regular'}
                {rating === 4 && '⭐⭐⭐⭐ Bueno'}
                {rating === 5 && '⭐⭐⭐⭐⭐ Excelente'}
                {rating === 0 && 'Selecciona una calificación'}
              </p>

              {/* Comentario */}
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Cuéntanos tu experiencia con este servicio..."
                className={`w-full px-4 py-3 rounded-xl border resize-none h-24 text-sm focus:outline-none focus:ring-2 transition-all ${
                  isDark
                    ? 'bg-[#0f0c1b] border-fuchsia-950 text-white placeholder:text-stone-500'
                    : 'bg-white border-pink-100 text-stone-800 placeholder:text-stone-400'
                }`}
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />

              {/* Mensajes */}
              {errorMessage && (
                <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {successMessage}
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border hover:bg-pink-50 dark:hover:bg-fuchsia-950/30 transition-all text-xs font-bold uppercase tracking-widest border-pink-100/60 dark:border-fuchsia-950 text-stone-600 dark:text-stone-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-white hover:scale-105 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {submitting ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}