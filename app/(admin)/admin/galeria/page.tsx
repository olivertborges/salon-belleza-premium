'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { 
  Camera, Image as ImageIcon, UploadCloud, 
  Trash2, Loader2, Sparkles
} from 'lucide-react'

type Photo = {
  id: string
  image_url: string
  uploaded_by: 'admin'
  category: string
  created_at: string
}

export default function GaleriaAdminPage() {
  const { theme } = useTheme()
  const { tenantId, loading: authLoading } = useAuth()
  const isDark = theme === 'dark'

  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('Todas')

  // Cargar las fotos del catálogo del salón
  const fetchPhotos = async () => {
    if (!tenantId) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('uploaded_by', 'admin') // Traer solo los trabajos oficiales del staff
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setPhotos(data as Photo[])
    } catch (err) {
      console.error('Error cargando catálogo del salón:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tenantId) fetchPhotos()
  }, [tenantId])

  // Subir un trabajo de muestra al catálogo
  const handleUploadPlaceholder = async () => {
    if (!tenantId) return
    try {
      setUploading(true)
      
      const mockImages = [
        'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1632345031435-8797b2d58045?w=500&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=500&auto=format&fit=crop&q=60'
      ]
      const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)]

      const { error } = await supabase
        .from('gallery_photos')
        .insert({
          tenant_id: tenantId,
          uploaded_by: 'admin',
          image_url: randomImage,
          category: categoryFilter === 'Todas' ? 'Nail Art' : categoryFilter,
        })

      if (error) throw error
      fetchPhotos()
    } catch (err) {
      console.error('Error al subir foto al catálogo:', err)
    } finally {
      setUploading(false)
    }
  }

  const deletePhoto = async (id: string) => {
    try {
      const { error } = await supabase.from('gallery_photos').delete().eq('id', id)
      if (error) throw error
      setPhotos(photos.filter(p => p.id !== id))
    } catch (err) {
      console.error('Error al eliminar del catálogo:', err)
    }
  }

  const photosFiltradas = photos.filter(p => 
    categoryFilter === 'Todas' || p.category === categoryFilter
  )

  if (authLoading || loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-3">
        <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
        <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400">Sincronizando catálogo...</span>
      </div>
    )
  }

  return (
    <div className={`max-w-5xl mx-auto space-y-6 transition-colors duration-300 px-2 sm:px-0 ${
      isDark ? 'text-stone-300' : 'text-stone-800'
    }`}>
      
      {/* HEADER EDITORIAL */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-stone-200 dark:border-stone-800/60">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-mono font-bold flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" /> Portafolio Profesional
          </p>
          <h1 className="text-3xl font-serif italic tracking-tight text-stone-900 dark:text-stone-100 mt-2">
            Catálogo de <span className="text-shimmer">Trabajos</span>
          </h1>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">Gestione las fotos de muestra que se expondrán como inspiración a las clientas.</p>
        </div>

        <button
          onClick={handleUploadPlaceholder}
          disabled={uploading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 text-[11px] font-mono uppercase tracking-wider font-bold shadow-sm active:scale-95 transition-transform disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
          Añadir Foto Nueva
        </button>
      </div>

      {/* FILTRO DE CATEGORÍAS */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {['Todas', 'Nail Art', 'Acrílicas', 'Semipermanente'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all border ${
              categoryFilter === cat
                ? 'bg-stone-100 dark:bg-stone-800/80 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* GRID DE FOTOS RESPONSIVO */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photosFiltradas.map((photo) => (
          <div 
            key={photo.id}
            className="group relative aspect-square rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 shadow-sm"
          >
            <img 
              src={photo.image_url} 
              alt="Muestra de trabajo" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Controles en Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
              <div className="flex justify-between items-start">
                <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md">
                  {photo.category}
                </span>
                
                <button 
                  onClick={() => deletePhoto(photo.id)}
                  className="p-1.5 bg-red-500/20 hover:bg-red-500/80 text-white rounded-lg backdrop-blur-md transition-colors"
                  title="Eliminar de la galería"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-white font-mono text-[9px] tracking-tight opacity-80">
                Subido el {new Date(photo.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ESTADO VACÍO */}
      {photosFiltradas.length === 0 && (
        <div className="text-center py-20 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl font-mono text-xs text-stone-400">
          <ImageIcon className="w-6 h-6 mx-auto mb-2 stroke-[1.25] text-stone-300" />
          No hay fotos cargadas en esta categoría.
        </div>
      )}
    </div>
  )
}
