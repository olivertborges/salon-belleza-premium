// app/(admin)/promociones/editar/[id]/page.tsx
// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Gift, 
  Save, 
  X, 
  AlertCircle,
  CheckCircle2,
  Tag,
  Percent,
  Calendar,
  Users,
  Flame,
  Crown,
  Sparkles,
  Star,
  Upload,
  Image as ImageIcon,
  Loader2,
  Trash2,
  PlusCircle
} from 'lucide-react'

// ✅ CATEGORÍAS SIMPLIFICADAS
const categories = [
  { value: 'flash', label: '⚡ Flash', color: 'from-red-500 to-red-600' },
  { value: 'welcome', label: '🎁 Welcome', color: 'from-emerald-400 to-emerald-600' },
  { value: 'referral', label: '🔗 Referral', color: 'from-blue-400 to-blue-600' },
  { value: 'special', label: '⭐ Special', color: 'from-purple-400 to-purple-600' }
]

// ✅ STYLES
const styles = [
  { value: 'volante', label: '📄 Volante' },
  { value: 'tarjeta', label: '💳 Tarjeta' },
  { value: 'flyer', label: '📋 Flyer' }
]

export default function EditarPromocionPage() {
  const router = useRouter()
  const params = useParams()
  const { user, tenantId } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [promoId, setPromoId] = useState<string | null>(null)

  // ✅ FORMULARIO SIN min_purchase
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_percent: 0,
    code: '',
    valid_until: '',
    category: 'special' as 'flash' | 'welcome' | 'referral' | 'special',
    style: 'volante' as 'volante' | 'tarjeta' | 'flyer',
    featured: false,
    uses_limit: '',
    terms: '',
    image_url: ''
  })

  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
  }

  const primaryBgStyle = { backgroundColor: primaryColor }

  useEffect(() => {
    if (params?.id) {
      setPromoId(params.id as string)
      loadPromocion(params.id as string)
    }
  }, [params])

  const loadPromocion = async (id: string) => {
    setLoadingData(true)
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          discount_percent: data.discount_percent || 0,
          code: data.code || '',
          valid_until: data.valid_until ? data.valid_until.split('T')[0] : '',
          category: data.category || 'special',
          style: data.style || 'volante',
          featured: data.featured || false,
          uses_limit: data.uses_limit ? String(data.uses_limit) : '',
          terms: data.terms || '',
          image_url: data.image_url || ''
        })
        if (data.image_url) {
          setPreviewImage(data.image_url)
        }
      }
    } catch (error) {
      console.error('Error cargando promoción:', error)
      setError('Error al cargar la promoción')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoadingData(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Solo se permiten imágenes (JPEG, PNG, WEBP, GIF)')
      setTimeout(() => setError(null), 3000)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar los 5MB')
      setTimeout(() => setError(null), 3000)
      return
    }

    setUploading(true)
    setError(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `promotions/${tenantId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('promotions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error subiendo imagen:', uploadError)
        setError('Error al subir la imagen: ' + uploadError.message)
        setTimeout(() => setError(null), 3000)
        setUploading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('promotions')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      setPreviewImage(publicUrl)
      setFormData(prev => ({ ...prev, image_url: publicUrl }))
      setSuccess('Imagen subida correctamente')
      setTimeout(() => setSuccess(null), 3000)

    } catch (err: any) {
      console.error('Error:', err)
      setError('Error al procesar la imagen: ' + err.message)
      setTimeout(() => setError(null), 3000)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async () => {
    if (formData.image_url) {
      try {
        const urlParts = formData.image_url.split('/')
        const filePath = urlParts.slice(urlParts.indexOf('promotions')).join('/')
        await supabase.storage
          .from('promotions')
          .remove([filePath])
      } catch (e) {
        console.error('Error eliminando imagen:', e)
      }
    }

    setPreviewImage(null)
    setFormData(prev => ({ ...prev, image_url: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId || !promoId) {
      setError('No hay tenant disponible')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const promoData = {
        title: formData.title,
        description: formData.description,
        discount_percent: formData.discount_percent,
        code: formData.code || null,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        category: formData.category,
        style: formData.style,
        featured: formData.featured,
        is_active: true,
        uses_limit: formData.uses_limit ? parseInt(formData.uses_limit) : null,
        terms: formData.terms || null,
        image_url: formData.image_url || null
      }

      const { error } = await supabase
        .from('promotions')
        .update(promoData)
        .eq('id', promoId)

      if (error) throw error

      setSuccess('¡Promoción actualizada con éxito!')
      setTimeout(() => {
        router.push('/admin/promociones')
      }, 2000)
    } catch (err: any) {
      console.error('Error actualizando promoción:', err)
      setError(err.message || 'Error al actualizar la promoción')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute w-48 h-48 bg-amber-500/5 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite] delay-300" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
            <Gift className="w-6 h-6 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-sm font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 animate-pulse">
              CARGANDO
            </p>
            <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              EDITAR PROMOCIÓN
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span 
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-pink-500/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1 max-w-3xl mx-auto">

      {/* ============================================================ */}
      {/* CABECERA PRINCIPAL — IDÉNTICA AL DASHBOARD */}
      {/* ============================================================ */}
      <div 
        className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl text-white border border-white/10"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, #EF4444 100%)`
        }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-black/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-pink-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Editar Promoción
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/admin/promociones"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight drop-shadow-sm">
                {formData.title || 'Editar Promoción'}
              </h1>
            </div>
            <p className="text-xs md:text-sm text-pink-50/80 font-medium max-w-md">
              Modifica los datos de esta promoción especial.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MENSAJES */}
      {/* ============================================================ */}
      {error && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-rose-500/10 to-pink-500/5 border border-rose-500/20 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-xs text-stone-700 dark:text-rose-400 font-medium min-w-0">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs text-stone-700 dark:text-emerald-400 font-medium min-w-0">{success}</p>
        </div>
      )}

      {/* ============================================================ */}
      {/* FORMULARIO */}
      {/* ============================================================ */}
      <form onSubmit={handleSubmit} className={`rounded-2xl border p-6 space-y-6 shadow-sm ${
        isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
      }`}>

        {/* Título */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
            Título de la promoción *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Ej: Oferta Flash - 30% Off"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
              isDark 
                ? 'bg-[#0f0c1b] border-fuchsia-950 text-white placeholder-stone-500' 
                : 'bg-stone-50 border-pink-100/60 text-stone-900 placeholder-stone-400'
            }`}
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
            Descripción
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Describe los beneficios de esta promoción..."
            className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 resize-none ${
              isDark 
                ? 'bg-[#0f0c1b] border-fuchsia-950 text-white placeholder-stone-500' 
                : 'bg-stone-50 border-pink-100/60 text-stone-900 placeholder-stone-400'
            }`}
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>

        {/* Grid de campos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
              <Percent className="w-3 h-3 inline mr-1" /> Descuento (%)
            </label>
            <input
              type="number"
              name="discount_percent"
              value={formData.discount_percent}
              onChange={handleChange}
              min="0"
              max="100"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                isDark 
                  ? 'bg-[#0f0c1b] border-fuchsia-950 text-white placeholder-stone-500' 
                  : 'bg-stone-50 border-pink-100/60 text-stone-900 placeholder-stone-400'
              }`}
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
              <Tag className="w-3 h-3 inline mr-1" /> Código promocional
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="FLASH30"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                isDark 
                  ? 'bg-[#0f0c1b] border-fuchsia-950 text-white placeholder-stone-500' 
                  : 'bg-stone-50 border-pink-100/60 text-stone-900 placeholder-stone-400'
              }`}
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
              Categoría
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                isDark 
                  ? 'bg-[#0f0c1b] border-fuchsia-950 text-white' 
                  : 'bg-stone-50 border-pink-100/60 text-stone-900'
              }`}
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
              Estilo de presentación
            </label>
            <select
              name="style"
              value={formData.style}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                isDark 
                  ? 'bg-[#0f0c1b] border-fuchsia-950 text-white' 
                  : 'bg-stone-50 border-pink-100/60 text-stone-900'
              }`}
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            >
              {styles.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
              <Calendar className="w-3 h-3 inline mr-1" /> Válido hasta
            </label>
            <input
              type="date"
              name="valid_until"
              value={formData.valid_until}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                isDark 
                  ? 'bg-[#0f0c1b] border-fuchsia-950 text-white' 
                  : 'bg-stone-50 border-pink-100/60 text-stone-900'
              }`}
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
              <Users className="w-3 h-3 inline mr-1" /> Límite de usos
            </label>
            <input
              type="number"
              name="uses_limit"
              value={formData.uses_limit}
              onChange={handleChange}
              placeholder="Sin límite"
              min="0"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                isDark 
                  ? 'bg-[#0f0c1b] border-fuchsia-950 text-white placeholder-stone-500' 
                  : 'bg-stone-50 border-pink-100/60 text-stone-900 placeholder-stone-400'
              }`}
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Imagen */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
            <ImageIcon className="w-3 h-3 inline mr-1" /> Imagen de la promoción
          </label>

          {previewImage ? (
            <div className="relative rounded-xl overflow-hidden border border-pink-100/60 dark:border-fuchsia-950">
              <img 
                src={previewImage} 
                alt="Vista previa" 
                className="w-full h-48 object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 hover:bg-red-600 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/50 text-white text-[10px]">
                Imagen cargada
              </div>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-pink-500 ${
                isDark ? 'border-fuchsia-950 hover:border-fuchsia-700' : 'border-pink-200 hover:border-pink-400'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                  <p className="text-xs text-stone-500">Subiendo imagen...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-stone-400" />
                  <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
                    Haz clic para subir una imagen
                  </p>
                  <p className="text-xs text-stone-400">
                    PNG, JPG, WEBP • Máx 5MB
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Términos (opcional) */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
            Términos y condiciones (opcional)
          </label>
          <textarea
            name="terms"
            value={formData.terms}
            onChange={handleChange}
            rows={2}
            placeholder="Términos y condiciones de la promoción..."
            className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 resize-none ${
              isDark 
                ? 'bg-[#0f0c1b] border-fuchsia-950 text-white placeholder-stone-500' 
                : 'bg-stone-50 border-pink-100/60 text-stone-900 placeholder-stone-400'
            }`}
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>

        {/* Featured */}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
              className="w-4 h-4 rounded border-pink-100/60 text-pink-500 focus:ring-pink-500"
            />
            <Star className="w-4 h-4 text-amber-400" />
            Destacar promoción
          </label>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4 border-t border-pink-100/60 dark:border-fuchsia-950">
          <Link
            href="/admin/promociones"
            className="px-6 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-2.5 rounded-xl text-white text-sm font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
            style={primaryBgStyle}
          >
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : 'Actualizar Promoción'}
          </button>
        </div>
      </form>

      {/* ============================================================ */}
      {/* STYLES GLOBALES */}
      {/* ============================================================ */}
      <style jsx global>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>

    </div>
  )
}