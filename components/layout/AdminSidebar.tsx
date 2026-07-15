// app/(admin)/promociones/crear/page.tsx
'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
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
  Star  // ✅ Agregado Star
} from 'lucide-react'

export default function CrearPromocionPage() {
  const router = useRouter()
  const { user, tenantId } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color || '#DB5B9A'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_percent: 0,
    code: '',
    valid_until: '',
    category: 'general' as 'flash' | 'premium' | 'seasonal' | 'welcome' | 'referral',
    style: 'volante' as 'volante' | 'tarjeta' | 'flyer',
    featured: false,
    uses_limit: '',
    terms: '',
    min_purchase: '',
    image_url: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) {
      setError('No hay tenant disponible')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const promoData = {
        tenant_id: tenantId,
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
        min_purchase: formData.min_purchase ? parseFloat(formData.min_purchase) : null,
        image_url: formData.image_url || null,
        uses_count: 0
      }

      const { error } = await supabase
        .from('promotions')
        .insert(promoData)

      if (error) throw error

      setSuccess('¡Promoción creada con éxito!')
      setTimeout(() => {
        router.push('/admin/promociones')
      }, 2000)
    } catch (err: any) {
      console.error('Error creando promoción:', err)
      setError(err.message || 'Error al crear la promoción')
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

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

  return (
    <div className="space-y-6 p-1 max-w-3xl mx-auto">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl p-[1px] shadow-xl" style={brandGradient}>
        <div className="absolute inset-0 opacity-20 animate-pulse" style={brandGradient} />
        <div className="relative z-10 rounded-[23px] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0f0c1b]">
          <div className="flex items-center gap-4 min-w-0">
            <Link 
              href="/admin/promociones"
              className="p-2 rounded-xl hover:bg-pink-50 dark:hover:bg-fuchsia-950/40 transition-colors text-stone-500 hover:text-pink-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-serif font-extrabold text-stone-900 dark:text-white mt-0.5 truncate">
                Crear Nueva Promoción
              </h2>
              <p className="text-xs text-stone-500 dark:text-pink-100/60 mt-0.5 truncate">
                Diseña una oferta exclusiva para tus clientes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MENSAJES */}
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

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} className={`rounded-2xl border p-6 space-y-6 ${
        isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
      }`}>
        
        {/* Título */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
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
          <label className="block text-xs font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
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
          {/* Descuento */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
              <Percent className="w-3 h-3 inline mr-1" /> Descuento (%)
            </label>
            <input
              type="number"
              name="discount_percent"
              value={formData.discount_percent}
              onChange={handleChange}
              min="0"
              max="100"
              placeholder="20"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                isDark 
                  ? 'bg-[#0f0c1b] border-fuchsia-950 text-white placeholder-stone-500' 
                  : 'bg-stone-50 border-pink-100/60 text-stone-900 placeholder-stone-400'
              }`}
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>

          {/* Código */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
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

          {/* Categoría */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
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
              <option value="flash">🔥 Flash Sale</option>
              <option value="premium">👑 Premium</option>
              <option value="seasonal">✨ Temporada</option>
              <option value="welcome">🎁 Bienvenida</option>
              <option value="referral">📣 Referido</option>
              <option value="general">🎯 General</option>
            </select>
          </div>

          {/* Estilo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
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
              <option value="volante">📄 Volante</option>
              <option value="tarjeta">💳 Tarjeta</option>
              <option value="flyer">📬 Flyer</option>
            </select>
          </div>

          {/* Fecha de expiración */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
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

          {/* Límite de usos */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
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

        {/* URL de imagen */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
            URL de imagen
          </label>
          <input
            type="url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            placeholder="https://ejemplo.com/imagen.jpg"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
              isDark 
                ? 'bg-[#0f0c1b] border-fuchsia-950 text-white placeholder-stone-500' 
                : 'bg-stone-50 border-pink-100/60 text-stone-900 placeholder-stone-400'
            }`}
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>

        {/* Términos y condiciones */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-1.5">
            Términos y condiciones
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

        {/* Featured y activa */}
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
            className="flex-1 px-6 py-2.5 rounded-xl text-white text-sm font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : 'Guardar Promoción'}
          </button>
        </div>
      </form>
    </div>
  )
}