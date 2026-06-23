'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

// ============================================
// 1. useServices
// ============================================
export function useServices() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase no inicializado')
        }

        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true })

        if (error) throw error
        setData(data || [])
      } catch (err: any) {
        console.error('Error en useServices:', err)
        setError(err.message || 'Error al cargar servicios')
        // Datos de respaldo
        setData([
          { id: '1', name: 'Microblading', description: 'Técnica de precisión pelo por pelo.', price: 350, duration: 120, badge: 'TOP', icon: 'FaScissors', category: 'Cejas' },
          { id: '2', name: 'Powder Brows', description: 'Efecto maquillaje en polvo.', price: 300, duration: 120, badge: 'POPULAR', icon: 'FaMagic', category: 'Cejas' },
          { id: '3', name: 'Uñas Acrílicas', description: 'Diseños resistentes y elegantes.', price: 80, duration: 90, badge: 'CLÁSICO', icon: 'FaBrush', category: 'Uñas' },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}

// ============================================
// 2. useStaff
// ============================================
export function useStaff() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase no inicializado')
        }

        // Intentar con staff
        let { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('is_active', true)

        // Si no hay datos en staff, intentar con professionals
        if (staffError || !staffData || staffData.length === 0) {
          const { data: profData, error: profError } = await supabase
            .from('professionals')
            .select('*')
            .eq('is_active', true)

          if (!profError && profData && profData.length > 0) {
            staffData = profData.map((p: any) => ({
              id: p.id,
              name: p.name,
              role: p.specialty || 'Especialista',
              avatar_url: p.avatar_url,
              experience: p.bio || '',
            }))
          } else {
            // Datos de respaldo
            staffData = [
              { id: '1', name: 'Laura Martínez', role: 'Directora', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', experience: '15 años' },
              { id: '2', name: 'Carlos Ruiz', role: 'Especialista', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', experience: '10 años' },
              { id: '3', name: 'Ana Torres', role: 'Experta', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', experience: '8 años' },
            ]
          }
        }

        setData(staffData || [])
      } catch (err: any) {
        console.error('Error en useStaff:', err)
        setError(err.message || 'Error al cargar staff')
        // Datos de respaldo
        setData([
          { id: '1', name: 'Laura Martínez', role: 'Directora', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', experience: '15 años' },
          { id: '2', name: 'Carlos Ruiz', role: 'Especialista', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', experience: '10 años' },
          { id: '3', name: 'Ana Torres', role: 'Experta', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', experience: '8 años' },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}

// ============================================
// 3. useTestimonials
// ============================================
export function useTestimonials() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase no inicializado')
        }

        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        setData(data || [])
      } catch (err: any) {
        console.error('Error en useTestimonials:', err)
        setError(err.message || 'Error al cargar testimonios')
        // Datos de respaldo
        setData([
          { id: '1', name: 'Marta Fernández', location: 'Madrid', service: 'Microblading', rating: 5, comment: 'Resultados impecables. La atención al detalle es extraordinaria.', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
          { id: '2', name: 'Javier López', location: 'Barcelona', service: 'Uñas', rating: 5, comment: 'El mejor servicio que he recibido. Duración y calidad excepcional.', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
          { id: '3', name: 'Elena Martínez', location: 'Valencia', service: 'Powder Brows', rating: 5, comment: 'El efecto es increíblemente natural. Muy recomendable.', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}

// ============================================
// 4. useGallery
// ============================================
export function useGallery() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase no inicializado')
        }

        const { data, error } = await supabase
          .from('gallery')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (error) throw error
        setData(data || [])
      } catch (err: any) {
        console.error('Error en useGallery:', err)
        setError(err.message)
        // Datos de respaldo
        setData([
          { id: '1', image_url: 'https://images.unsplash.com/photo-1522336572467-97b06e8ef143?w=400&h=300&fit=crop', title: 'Transformación de Cejas' },
          { id: '2', image_url: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop', title: 'Micropigmentación Labial' },
          { id: '3', image_url: 'https://images.unsplash.com/photo-1522335140-67fcfea9c78d?w=400&h=300&fit=crop', title: 'Uñas Artísticas' },
          { id: '4', image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop', title: 'Powder Brows' },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}

// ============================================
// 5. useEvents
// ============================================
export function useEvents() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase no inicializado')
        }

        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true })

        if (error) throw error
        setData(data || [])
      } catch (err: any) {
        console.error('Error en useEvents:', err)
        setError(err.message)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}

// ============================================
// 6. useBlogPosts
// ============================================
export function useBlogPosts() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase no inicializado')
        }

        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(3)

        if (error) throw error
        setData(data || [])
      } catch (err: any) {
        console.error('Error en useBlogPosts:', err)
        setError(err.message)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}

// ============================================
// 7. useMemberships
// ============================================
export function useMemberships() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase no inicializado')
        }

        const { data, error } = await supabase
          .from('memberships')
          .select('*')
          .eq('is_active', true)

        if (error) throw error
        setData(data || [])
      } catch (err: any) {
        console.error('Error en useMemberships:', err)
        setError(err.message)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}

// ============================================
// 8. useAnalytics
// ============================================
export function useAnalytics() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase no inicializado')
        }

        const { data, error } = await supabase
          .from('analytics')
          .select('*')
          .order('created_at', { ascending: true })

        if (error) throw error
        setData(data || [])
      } catch (err: any) {
        console.error('Error en useAnalytics:', err)
        setError(err.message)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}
