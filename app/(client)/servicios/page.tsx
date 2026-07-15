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
  // Datos del cliente (join)
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

      // Cargar reviews para cada servicio
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
        // 🔥 CONSULTA PARA TU TABLA 'review'
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
      // 🔥 INSERT EN TU TABLA 'review' - Adaptado a tu estructura
      const { data, error } = await supabase
        .from('review')
        .insert({
          tenant_id: tenantId,
          client_id: user.id,
          service_id: selectedService!.id,
          professional_id: null, // Puedes agregar lógica para seleccionar profesional
          rating: rating,
          comment: comment.trim(),
          images: [], // Array vacío por ahora
          is_approved: true, // O false si quieres moderación
          created_at: new Date().toISOString()
        })
        .select()

      if (error) throw error

      // Actualizar reviews localmente
      if (data) {
        const newReview: Review = {
          ...data[0],
          client_name: user.name || 'Cliente'
        }
        setReviews(prev => ({
          ...prev,
          [selectedService!.id]: [newReview, ...(prev[selectedService!.id] || [])]
        }))
      }

      setSuccessMessage('✅ ¡Gracias por tu calificación!')
      setTimeout(() => setSuccessMessage(null), 3000)
      
      // Cerrar modal y resetear
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

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = '