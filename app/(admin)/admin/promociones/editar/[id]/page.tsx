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
  Sparkles,
  Star,
  Upload,
  Image as ImageIcon,
  Loader2
} from 'lucide-react'

// ✅ CATEGORÍAS ADAPTADAS AL DISEÑO PREMIUM
const categories = [
  { value: 'flash', label: '⚡ Flash', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  { value: 'welcome', label: '🎁 Welcome', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { value: 'referral', label: '🔗 Referral', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'special', label: '⭐ Special', color: 'bg-[#D4AF37]/10 text-[#C9A96E] border-[#D4AF37]/30' }
]

const styles = [
  { value: 'volante', label: '📄 Volante' },
  { value: 'tarjeta', label: '💳 Tarjeta' },
  { value: 'flyer', label: '📋 Flyer' }
]

export default function EditarPromocionPage() {
  const router = useRouter()
  const params = useParams()
  const { tenantId } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [promoId, setPromoId] = useState<string | null>(null)

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
      const filePath = `promotions/${tenantId || 'general'}/${fileName}`

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
    setPreviewImage(null)
    setFormData(prev => ({ ...prev, image_url: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!promoId) {
      setError('No hay ID de promoción disponible')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const promoData = {
        title: formData.title,
        description: formData.description,
        discount_percent: Number(formData.discount_percent),
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
      }, 1500)
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
      <div className={`flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden ${isDark ? 'bg-[#150D08]' : 'bg-[#FDFBF9]'}`}>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[100px] pointer-events-none" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-[#D4AF37]/20 shadow-2xl">
          <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
          <p className="text-xs font-black tracking-[0.2em] text-[#C9A96E] uppercase animate-pulse">
            Cargando datos de edición...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-16 relative overflow-hidden ${isDark ? 'bg-[#150D08] text-[#FFF9F6]' : 'bg-[#FDFBF9] text-[#1A0E0A]'}`}>
      
      {/* Fondos Decorativos Orgánicos */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#EC4899]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 relative z-10 pt-4">

        {/* ============================================================ */}
        {/* CABECERA HERO BANNER CON ESTILO DORADO/PREMIUM */}
        {/* ============================================================ */}
        <div className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ${
          isDark 
            ? 'bg-gradient-to-br from-[#271810] via-[#1E120C] to-[#160E09] border-[#3D281E] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]' 
            : 'bg-gradient-to-br from-white via-[#FBF7F4] to-[#F5ECE5] border-[#EADED5] shadow-[0_25px_50px_-15px_rgba(225,208,195,0.4)]'
        }`}>
          <div className="absolute -top-40 -right-40 w-[300px] h-[300px] bg-gradient-to-br from-[#EC4899]/10 to-[#D4AF37]/10 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

          <div className="relative z-10 p-6 md:p-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/admin/promociones"
                className={`p-3 rounded-xl border transition-all duration-300 ${
                  isDark ? 'bg-[#291A11] border-[#3D281E] text-[#BCAEA5] hover:text-white' : 'bg-[#FAF6F2] border-[#EADED5] text-[#6E5A4D] hover:text-[#1A0E0A]'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[9px] font-black uppercase tracking-[0.25em] text-[#C9A96E]">
                  <Sparkles className="w-2.5 h-2.5" />
                  ✦ Panel de Control
                </div>
                <h1 className={`font-serif text-2xl md:text-3xl font-extrabold tracking-tight truncate max-w-[260px] md:max-w-md ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                  Editar Promoción
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MENSAJES DE ESTADO */}
        {/* ============================================================ */}
        {error && (
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isDark ? 'bg-rose-950/20 border-rose-900/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-xs font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isDark ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p className="text-xs font-medium">{success}</p>
          </div>
        )}

        {/* ============================================================ */}
        {/* FORMULARIO DE EDICIÓN */}
        {/* ============================================================ */}
        <form onSubmit={handleSubmit} className={`rounded-3xl border p-6 md:p-8 space-y-6 shadow-xl transition-all duration-500 ${
          isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'
        }`}>

          {/* Título */}
          <div className="space-y-2">
            <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
              Título de la Promoción *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Ej: Descuento Especial de Verano"
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none ${
                isDark 
                  ? 'bg-[#150D08] border-[#3D281E] text-white placeholder-[#8A766A] focus:border-[#D4AF37]' 
                  : 'bg-[#FAF8F5] border-[#EADED5] text-[#1A0E0A] placeholder-[#A39081] focus:border-[#D4AF37]'
              }`}
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
              Descripción detallada
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Explica los detalles de la oferta..."
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none resize-none ${
                isDark 
                  ? 'bg-[#150D08] border-[#3D281E] text-white placeholder-[#8A766A] focus:border-[#D4AF37]' 
                  : 'bg-[#FAF8F5] border-[#EADED5] text-[#1A0E0A] placeholder-[#A39081] focus:border-[#D4AF37]'
              }`}
            />
          </div>

          {/* Grid de campos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Descuento */}
            <div className="space-y-2">
              <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                <Percent className="w-3 h-3 inline mr-1 text-[#C9A96E]" /> Descuento (%)
              </label>
              <input
                type="number"
                name="discount_percent"
                value={formData.discount_percent}
                onChange={handleChange}
                min="0"
                max="100"
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none ${
                  isDark ? 'bg-[#150D08] border-[#3D281E] text-white focus:border-[#D4AF37]' : 'bg-[#FAF8F5] border-[#EADED5] text-[#1A0E0A] focus:border-[#D4AF37]'
                }`}
              />
            </div>

            {/* Código */}
            <div className="space-y-2">
              <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                <Tag className="w-3 h-3 inline mr-1 text-[#C9A96E]" /> Código de Cupón
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="Ej: VERANO2026"
                className={`w-full px-4 py-3 rounded-xl border text-sm font-mono uppercase tracking-wider transition-all outline-none ${
                  isDark ? 'bg-[#150D08] border-[#3D281E] text-white focus:border-[#D4AF37]' : 'bg-[#FAF8F5] border-[#EADED5] text-[#1A0E0A] focus:border-[#D4AF37]'
                }`}
              />
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                Categoría
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none ${
                  isDark ? 'bg-[#150D08] border-[#3D281E] text-white focus:border-[#D4AF37]' : 'bg-[#FAF8F5] border-[#EADED5] text-[#1A0E0A] focus:border-[#D4AF37]'
                }`}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Estilo */}
            <div className="space-y-2">
              <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                Formato Visual
              </label>
              <select
                name="style"
                value={formData.style}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none ${
                  isDark ? 'bg-[#150D08] border-[#3D281E] text-white focus:border-[#D4AF37]' : 'bg-[#FAF8F5] border-[#EADED5] text-[#1A0E0A] focus:border-[#D4AF37]'
                }`}
              >
                {styles.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Válido hasta */}
            <div className="space-y-2">
              <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                <Calendar className="w-3 h-3 inline mr-1 text-[#C9A96E]" /> Válido Hasta
              </label>
              <input
                type="date"
                name="valid_until"
                value={formData.valid_until}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none ${
                  isDark ? 'bg-[#150D08] border-[#3D281E] text-white focus:border-[#D4AF37]' : 'bg-[#FAF8F5] border-[#EADED5] text-[#1A0E0A] focus:border-[#D4AF37]'
                }`}
              />
            </div>

            {/* Límite de usos */}
            <div className="space-y-2">
              <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                <Users className="w-3 h-3 inline mr-1 text-[#C9A96E]" /> Límite de Redenciones
              </label>
              <input
                type="number"
                name="uses_limit"
                value={formData.uses_limit}
                onChange={handleChange}
                placeholder="Ilimitado"
                min="0"
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none ${
                  isDark ? 'bg-[#150D08] border-[#3D281E] text-white focus:border-[#D4AF37]' : 'bg-[#FAF8F5] border-[#EADED5] text-[#1A0E0A] focus:border-[#D4AF37]'
                }`}
              />
            </div>

          </div>

          {/* Imagen de la Promoción */}
          <div className="space-y-2">
            <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
              <ImageIcon className="w-3 h-3 inline mr-1 text-[#C9A96E]" /> Imagen Promocional
            </label>

            {previewImage ? (
              <div className={`relative rounded-2xl overflow-hidden border p-2 ${isDark ? 'bg-[#150D08] border-[#3D281E]' : 'bg-[#FAF6F2] border-[#EADED5]'}`}>
                <img 
                  src={previewImage} 
                  alt="Vista previa" 
                  className="w-full max-h-64 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-4 right-4 p-2 rounded-full bg-rose-500/90 hover:bg-rose-600 text-white transition-colors shadow-lg"
                  title="Eliminar imagen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                  isDark ? 'border-[#3D281E] hover:border-[#D4AF37]/60 bg-[#150D08]/50' : 'border-[#EADED5] hover:border-[#D4AF37]/60 bg-[#FAF8F5]'
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
                    <Loader2 className="w-6 h-6 animate-spin text-[#C9A96E]" />
                    <p className={`text-xs font-medium ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Subiendo imagen a Supabase...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className={`w-6 h-6 ${isDark ? 'text-[#C9A96E]' : 'text-[#C9A96E]'}`} />
                    <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                      Haz clic para cargar una imagen
                    </p>
                    <p className={`text-[10px] ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>
                      PNG, JPG, WEBP • Máximo 5MB
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Términos y Condiciones */}
          <div className="space-y-2">
            <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
              Términos & Condiciones (Opcional)
            </label>
            <textarea
              name="terms"
              value={formData.terms}
              onChange={handleChange}
              rows={2}
              placeholder="Escribe las restricciones o condiciones..."
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none resize-none ${
                isDark 
                  ? 'bg-[#150D08] border-[#3D281E] text-white placeholder-[#8A766A] focus:border-[#D4AF37]' 
                  : 'bg-[#FAF8F5] border-[#EADED5] text-[#1A0E0A] placeholder-[#A39081] focus:border-[#D4AF37]'
              }`}
            />
          </div>

          {/* Destacado */}
          <div className="pt-2">
            <label className="inline-flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="w-4 h-4 rounded border-[#3D281E] text-[#D4AF37] focus:ring-[#D4AF37]"
              />
              <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                <Star className="w-3.5 h-3.5 text-amber-400 fill-current" /> Destacar esta promoción en la interfaz del cliente
              </span>
            </label>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#3D281E]/40">
            <Link
              href="/admin/promociones"
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all border ${
                isDark ? 'bg-[#150D08] border-[#3D281E] text-[#BCAEA5] hover:text-white' : 'bg-[#FAF6F2] border-[#EADED5] text-[#6E5A4D] hover:text-[#1A0E0A]'
              }`}
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl text-neutral-950 font-black text-xs uppercase tracking-[0.15em] transition-all duration-300 shadow-xl bg-gradient-to-r from-[#D4AF37] via-[#E8D5A0] to-[#C9A96E] hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Actualizar Promoción'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
