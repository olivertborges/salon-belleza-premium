//@ts-nocheck
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Scissors, Star, Eye, Image as ImageIcon, Sparkles, Filter, 
  Grid, List, Heart, MessageSquare, Plus, ChevronRight, X, ChevronLeft, ChevronRight as ChevronRightIcon 
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  category: string
  image_url?: string
}

interface GalleryItem {
  id: string
  title: string
  description: string
  image_url: string
  category: string
  before_image_url?: string
  after_image_url?: string
  likes_count?: number
  is_client_upload?: boolean
}

interface Review {
  id: string
  service_id: string
  user_id: string
  rating: number
  comment: string
  created_at: string
  user_name?: string
}

export default function EsteticaCapilarPage() {
  const { user, tenantId } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'servicios' | 'galeria' | 'resenas'>('servicios')
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Lightbox
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)

  // Reviews modal & form
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [selectedServiceForReview, setSelectedServiceForReview] = useState<string>('')
  const [newReviewRating, setNewReviewRating] = useState<number>(5)
  const [newReviewComment, setNewReviewComment] = useState<string>('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const isDark = true

  // Helper para resolver el Tenant ID
  const getTenantId = useCallback(async (): Promise<string | null> => {
    if (tenantId) return tenantId

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single()

    if (profile?.tenant_id) return profile.tenant_id

    const { data: client } = await supabase
      .from('clients')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single()

    return client?.tenant_id || null
  }, [tenantId])

  // Carga paralela reutilizando un solo Tenant ID
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const activeTenantId = await getTenantId()
      if (!activeTenantId) {
        setLoading(false)
        return
      }

      const [servicesRes, galleryRes, clientGalleryRes, reviewsRes] = await Promise.all([
        supabase
          .from('services')
          .select('*')
          .eq('tenant_id', activeTenantId)
          .ilike('category', '%capilar%'),
        
        supabase
          .from('gallery')
          .select('*')
          .eq('tenant_id', activeTenantId),

        supabase
          .from('client_gallery')
          .select('*')
          .eq('tenant_id', activeTenantId)
          .eq('status', 'approved'),

        supabase
          .from('reviews')
          .select('*')
          .eq('tenant_id', activeTenantId)
          .order('created_at', { ascending: false })
      ])

      if (servicesRes.data) setServices(servicesRes.data)
      
      const adminItems = (galleryRes.data || []).map(item => ({ ...item, is_client_upload: false }))
      const clientItems = (clientGalleryRes.data || []).map(item => ({ ...item, is_client_upload: true }))
      setGallery([...adminItems, ...clientItems])

      if (reviewsRes.data) setReviews(reviewsRes.data)
    } catch (error) {
      console.error('Error cargando datos de estética capilar:', error)
    } finally {
      setLoading(false)
    }
  }, [getTenantId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Navegación por teclado en el Lightbox
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isLightboxOpen) return

    if (e.key === 'Escape') {
      setIsLightboxOpen(false)
    } else if (e.key === 'ArrowLeft') {
      setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1))
    } else if (e.key === 'ArrowRight') {
      setSelectedImageIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0))
    }
  }, [isLightboxOpen, gallery.length])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // CORRECCIÓN: Guardar Reseñas respetando esquema y tenant_id
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReviewComment.trim()) return

    setSubmittingReview(true)
    try {
      const activeTenantId = await getTenantId()
      if (!activeTenantId) {
        alert('No se pudo identificar la barbería/peluquería actual.')
        return
      }

      // Preparar payload respetando campos UUID de Supabase
      const reviewPayload = {
        tenant_id: activeTenantId,
        service_id: selectedServiceForReview || null, // NULL si no seleccionó un servicio específico
        user_id: user?.id || null,                     // NULL si es usuario anónimo
        rating: newReviewRating,
        comment: newReviewComment.trim(),
        user_name: user?.user_metadata?.full_name || user?.email || 'Cliente Anónimo'
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert([reviewPayload])
        .select()

      if (error) {
        console.error('Error de Supabase al guardar review:', error)
        alert('Hubo un problema al guardar tu reseña: ' + error.message)
        return
      }

      if (data) {
        setReviews(prev => [data[0], ...prev])
        setNewReviewComment('')
        setNewReviewRating(5)
        setSelectedServiceForReview('')
        setIsReviewModalOpen(false)
      }
    } catch (err) {
      console.error('Error inesperado al enviar reseña:', err)
    } finally {
      setSubmittingReview(false)
    }
  }

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index)
    setIsLightboxOpen(true)
  }

  const filteredServices = selectedCategory === 'todos' 
    ? services 
    : services.filter(s => s.category.toLowerCase() === selectedCategory.toLowerCase())

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-300 p-4 md:p-8`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent flex items-center gap-2 justify-center md:justify-start">
            <Scissors className="w-8 h-8 text-amber-500" /> Estética Capilar
          </h1>
          <p className="text-slate-400 mt-1">Tratamientos especializados, cortes e imagen personal</p>
        </div>

        {/* Pestanas de Navegación */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('servicios')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'servicios' ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Servicios
          </button>
          <button
            onClick={() => setActiveTab('galeria')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'galeria' ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Galería
          </button>
          <button
            onClick={() => setActiveTab('resenas')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'resenas' ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Reseñas
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <>
            {/* SECCIÓN SERVICIOS */}
            {activeTab === 'servicios' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-slate-400">Filtrar:</span>
                    <button 
                      onClick={() => setSelectedCategory('todos')}
                      className={`px-3 py-1 text-xs rounded-full border ${selectedCategory === 'todos' ? 'border-amber-500 text-amber-400 bg-amber-500/10' : 'border-slate-800 text-slate-400'}`}
                    >
                      Todos
                    </button>
                  </div>
                  
                  <div className="flex gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-800 text-amber-400' : 'text-slate-500'}`}>
                      <Grid className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-800 text-amber-400' : 'text-slate-500'}`}>
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
                  {filteredServices.map(service => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/50 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-slate-100">{service.name}</h3>
                          <span className="text-amber-400 font-extrabold text-lg">${service.price}</span>
                        </div>
                        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{service.description}</p>
                      </div>
                      
                      <div className="flex justify-between items-center pt-4 border-t border-slate-800 text-xs text-slate-500">
                        <span>Duración: {service.duration} min</span>
                        <button 
                          onClick={() => {
                            setSelectedServiceForReview(service.id)
                            setIsReviewModalOpen(true)
                          }}
                          className="text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <Star className="w-3 h-3 fill-amber-400" /> Valorar
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN GALERÍA */}
            {activeTab === 'galeria' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {gallery.map((item, idx) => (
                  <motion.div
                    key={item.id || idx}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => openLightbox(idx)}
                    className="relative group cursor-pointer aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800"
                  >
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                      <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                      {item.is_client_upload && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded w-fit mt-1">
                          Foto de Cliente
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* SECCIÓN RESEÑAS */}
            {activeTab === 'resenas' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-100">Opiniones de Clientes</h2>
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-sm transition-all"
                  >
                    <Plus className="w-4 h-4" /> Dejar Reseña
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map(rev => (
                    <div key={rev.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-slate-200">{rev.user_name || 'Cliente'}</span>
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < rev.rating ? 'fill-amber-400' : 'text-slate-700'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm">{rev.comment}</p>
                      <span className="text-[10px] text-slate-600 block mt-2">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* LIGHTBOX CON TECLAS Y NAVEGACIÓN */}
      <AnimatePresence>
        {isLightboxOpen && gallery[selectedImageIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2"
            >
              <X className="w-8 h-8" />
            </button>

            <button
              onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1))}
              className="absolute left-4 text-slate-400 hover:text-white p-2"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>

            <div className="max-w-3xl max-h-[80vh] flex flex-col items-center">
              <img
                src={gallery[selectedImageIndex].image_url}
                alt={gallery[selectedImageIndex].title}
                className="max-h-[70vh] object-contain rounded-lg"
              />
              <p className="text-slate-200 mt-4 text-center font-medium">
                {gallery[selectedImageIndex].title}
              </p>
            </div>

            <button
              onClick={() => setSelectedImageIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 text-slate-400 hover:text-white p-2"
            >
              <ChevronRightIcon className="w-10 h-10" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE NUEVA RESEÑA */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full relative">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-slate-100 mb-4">Dejar tu Opinión</h3>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Servicio (Opcional)</label>
                  <select
                    value={selectedServiceForReview}
                    onChange={(e) => setSelectedServiceForReview(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">General / Ninguno en específico</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Calificación</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewReviewRating(star)}
                        className="p-1"
                      >
                        <Star
                          className={`w-6 h-6 ${star <= newReviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Comentario</label>
                  <textarea
                    required
                    rows={3}
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="Escribe tu experiencia aquí..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-950 font-bold py-3 rounded-xl transition-all"
                >
                  {submittingReview ? 'Guardando...' : 'Publicar Reseña'}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
