// app/(admin)/promociones/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Gift,
  Tag,
  Flame,
  Crown,
  Sparkles,
  Star,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Loader2,
  Calendar,
  Percent,
  Copy
} from 'lucide-react'

interface Promocion {
  id: string
  tenant_id: string
  title: string
  description: string
  image_url: string | null
  discount_percent: number
  discount_amount: number | null
  code: string | null
  valid_until: string
  category: 'flash' | 'premium' | 'seasonal' | 'welcome' | 'referral'
  style: 'volante' | 'tarjeta' | 'flyer'
  is_active: boolean
  featured: boolean
  created_at: string
  uses_count: number
  uses_limit: number | null
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

export default function AdminPromocionesPage() {
  const { tenantId } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color || '#DB5B9A'

  const [promociones, setPromociones] = useState<Promocion[]>([])
  const [filteredPromociones, setFilteredPromociones] = useState<Promocion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterActive, setFilterActive] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

  useEffect(() => {
    loadPromociones()
  }, [tenantId])

  const loadPromociones = async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPromociones(data || [])
      setFilteredPromociones(data || [])
    } catch (error) {
      console.error('Error cargando promociones:', error)
      setError('Error al cargar las promociones')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleDelete = async (id: string) => {
    const { count } = await supabase
      .from('promotion_usage')
      .select('*', { count: 'exact', head: true })
      .eq('promotion_id', id)

    const usoCount = count || 0
    let confirmMessage = '¿Estás seguro de eliminar esta promoción?'
    if (usoCount > 0) {
      confirmMessage = `⚠️ Esta promoción tiene ${usoCount} uso${usoCount > 1 ? 's' : ''}. Al eliminarla, también se eliminarán todos los registros de uso.`
    }

    if (!confirm(confirmMessage)) return

    setDeletingId(id)
    setError(null)
    setSuccess(null)

    try {
      if (usoCount > 0) {
        await supabase.from('promotion_usage').delete().eq('promotion_id', id)
      }

      const { data: promo } = await supabase
        .from('promotions')
        .select('image_url')
        .eq('id', id)
        .single()

      if (promo?.image_url) {
        try {
          const urlParts = promo.image_url.split('/')
          const filePath = urlParts.slice(urlParts.indexOf('promotions')).join('/')
          await supabase.storage.from('promotions').remove([filePath])
        } catch (e) {}
      }

      await supabase.from('promotions').delete().eq('id', id)

      setSuccess(`✅ Promoción eliminada correctamente`)
      setTimeout(() => setSuccess(null), 3000)
      await loadPromociones()
    } catch (error: any) {
      setError(`❌ Error al eliminar: ${error.message || 'Error desconocido'}`)
      setTimeout(() => setError(null), 3000)
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('promotions')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      setSuccess(`✅ Promoción ${!currentStatus ? 'activada' : 'desactivada'}`)
      setTimeout(() => setSuccess(null), 3000)
      await loadPromociones()
    } catch (error) {
      setError('❌ Error al cambiar el estado')
      setTimeout(() => setError(null), 3000)
    }
  }

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  useEffect(() => {
    let filtered = promociones
    if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.category === filterCategory)
    }
    if (filterActive !== 'all') {
      const isActive = filterActive === 'active'
      filtered = filtered.filter(p => p.is_active === isActive)
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.code?.toLowerCase().includes(term)
      )
    }
    setFilteredPromociones(filtered)
  }, [searchTerm, filterCategory, filterActive, promociones])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'flash': return <Flame className="w-4 h-4" />
      case 'premium': return <Crown className="w-4 h-4" />
      case 'welcome': return <Gift className="w-4 h-4" />
      case 'seasonal': return <Sparkles className="w-4 h-4" />
      default: return <Tag className="w-4 h-4" />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'flash': return 'Flash Sale'
      case 'premium': return 'Premium'
      case 'welcome': return 'Bienvenida'
      case 'seasonal': return 'Temporada'
      default: return 'Especial'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'flash': return 'from-red-500 to-red-600'
      case 'premium': return 'from-amber-400 to-amber-600'
      case 'welcome': return 'from-emerald-400 to-emerald-600'
      case 'seasonal': return 'from-purple-400 to-purple-600'
      default: return `from-[${primaryColor}] to-[${settings?.secondary_color || '#E5A46E'}]`
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: primaryColor }} />
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse" style={{ color: primaryColor }}>
          Cargando Promociones...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl p-[1px] shadow-xl" style={brandGradient}>
        <div className="absolute inset-0 opacity-20 animate-pulse" style={brandGradient} />
        <div className="relative z-10 rounded-[23px] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0f0c1b]">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3.5 rounded-2xl text-white shadow-md shrink-0" style={{ backgroundColor: primaryColor }}>
              <Gift className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold font-mono truncate" style={{ color: primaryColor }}>
                ✨ {settings?.business_name || 'Fresh Nails Studio'}
              </p>
              <h2 className="text-xl md:text-2xl font-serif font-extrabold text-stone-900 dark:text-white mt-0.5 truncate">
                Gestión de Promociones
              </h2>
              <p className="text-xs text-stone-500 dark:text-pink-100/60 mt-0.5 truncate">
                {filteredPromociones.length} promociones encontradas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto justify-end">
            <button 
              onClick={() => { setRefreshing(true); loadPromociones() }} 
              disabled={refreshing} 
              className="px-3 py-2 rounded-xl bg-pink-50 dark:bg-fuchsia-950/40 border border-pink-100/60 dark:border-fuchsia-900/40 hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
              style={{ color: primaryColor }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <Link 
              href="/admin/promociones/crear"
              className="px-3 py-2 rounded-xl text-white hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva</span>
            </Link>
          </div>
        </div>
      </div>

      {/* MENSAJES */}
      {error && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-rose-500/10 to-pink-500/5 border border-rose-500/20 flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <p className="text-xs text-stone-700 dark:text-rose-400 font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-xs text-stone-700 dark:text-emerald-400 font-medium">{success}</p>
        </div>
      )}

      {/* FILTROS - RESPONSIVE */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <Search className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
          <input 
            type="text" 
            placeholder="Buscar promociones..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-stone-800 dark:text-pink-100 placeholder:text-stone-400 w-full"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs border bg-white dark:bg-[#0f0c1b] text-stone-800 dark:text-pink-100 border-pink-100/60 dark:border-fuchsia-950 flex-1 sm:flex-none`}
          >
            <option value="all">Todas</option>
            <option value="flash">Flash</option>
            <option value="premium">Premium</option>
            <option value="seasonal">Temporada</option>
            <option value="welcome">Bienvenida</option>
          </select>

          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs border bg-white dark:bg-[#0f0c1b] text-stone-800 dark:text-pink-100 border-pink-100/60 dark:border-fuchsia-950 flex-1 sm:flex-none`}
          >
            <option value="all">Todos</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>
        </div>
      </div>

      {/* KPIS - RESPONSIVE */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl p-3 border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 text-center">
          <p className="text-2xl font-bold text-stone-900 dark:text-white">{promociones.length}</p>
          <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Total</p>
        </div>
        <div className="rounded-xl p-3 border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 text-center">
          <p className="text-2xl font-bold text-emerald-500">{promociones.filter(p => p.is_active).length}</p>
          <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Activas</p>
        </div>
        <div className="rounded-xl p-3 border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 text-center">
          <p className="text-2xl font-bold text-amber-500">{promociones.filter(p => p.featured).length}</p>
          <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Destacadas</p>
        </div>
        <div className="rounded-xl p-3 border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 text-center">
          <p className="text-2xl font-bold text-purple-500">{promociones.reduce((sum, p) => sum + (p.uses_count || 0), 0)}</p>
          <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Usos</p>
        </div>
      </div>

      {/* TARJETAS DE PROMOCIONES - GRID RESPONSIVE */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredPromociones.length === 0 ? (
          <div className="col-span-full text-center py-16 border border-dashed rounded-2xl border-pink-200 dark:border-fuchsia-950">
            <Gift className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-stone-500">No hay promociones creadas</p>
            <Link 
              href="/admin/promociones/crear"
              className="inline-block mt-4 px-4 py-2 rounded-xl text-white text-xs font-bold hover:scale-105 transition-all"
              style={{ backgroundColor: primaryColor }}
            >
              Crear primera promoción
            </Link>
          </div>
        ) : (
          filteredPromociones.map((promo) => (
            <motion.div
              key={promo.id}
              variants={itemVariants}
              className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 ${
                isDark 
                  ? 'bg-[#130f24] border-fuchsia-950 hover:border-fuchsia-800' 
                  : 'bg-white border-pink-100/60 hover:border-pink-300 hover:shadow-lg'
              }`}
            >
              {/* Imagen o placeholder */}
              {promo.image_url ? (
                <div className="relative aspect-video overflow-hidden bg-stone-100 dark:bg-stone-800">
                  <img 
                    src={promo.image_url} 
                    alt={promo.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  {promo.discount_percent > 0 && (
                    <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-white text-lg font-bold border border-amber-400/30">
                      -{promo.discount_percent}%
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900">
                  <Percent className="w-12 h-12 text-stone-300 dark:text-stone-600" />
                  {promo.discount_percent > 0 && (
                    <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-white text-lg font-bold border border-amber-400/30">
                      -{promo.discount_percent}%
                    </div>
                  )}
                </div>
              )}

              {/* Badges - arriba izquierda */}
              <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest text-white shadow-sm bg-gradient-to-r ${getCategoryColor(promo.category)}`}>
                  {getCategoryIcon(promo.category)}
                  {getCategoryLabel(promo.category)}
                </span>
                {promo.featured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest bg-amber-400 text-stone-900 shadow-sm">
                    <Star className="w-2.5 h-2.5 fill-current" /> Destacada
                  </span>
                )}
              </div>

              {/* Contenido */}
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-sm text-stone-800 dark:text-white line-clamp-1">
                  {promo.title}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                  {promo.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-pink-100/60 dark:border-fuchsia-950">
                  <div className="flex items-center gap-2 text-[10px] text-stone-400 dark:text-stone-500">
                    <Clock className="w-3 h-3" />
                    {promo.valid_until ? new Date(promo.valid_until).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'Sin fecha'}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-stone-400">
                    <Users className="w-3 h-3" />
                    {promo.uses_count || 0}{promo.uses_limit ? `/${promo.uses_limit}` : ''}
                  </div>
                </div>

                {/* Código y acciones - BOTÓN DE ESTADO MOVIDO AQUÍ */}
                <div className="flex items-center gap-2 pt-2">
                  {promo.code && (
                    <button
                      onClick={() => copyCode(promo.code!, promo.id)}
                      className="flex-1 px-2 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors flex items-center justify-center gap-1"
                    >
                      {copiedId === promo.id ? (
                        <><CheckCircle2 className="w-3 h-3" /> Copiado</>
                      ) : (
                        <><Copy className="w-3 h-3" /> {promo.code}</>
                      )}
                    </button>
                  )}

                  {/* ✅ BOTÓN DE ESTADO - MOVIDO AQUÍ PARA QUE NO SE SUPERPONGA */}
                  <button
                    onClick={() => handleToggleActive(promo.id, promo.is_active)}
                    className={`px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${
                      promo.is_active 
                        ? 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400'
                        : 'bg-stone-500/20 text-stone-600 dark:bg-stone-500/30 dark:text-stone-400'
                    }`}
                  >
                    {promo.is_active ? 'Activa' : 'Inactiva'}
                  </button>

                  <div className="flex items-center gap-1">
                    <Link 
                      href={`/admin/promociones/${promo.id}`}
                      className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-400 hover:text-blue-500"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <Link 
                      href={`/admin/promociones/editar/${promo.id}`}
                      className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-400 hover:text-pink-500"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      disabled={deletingId === promo.id}
                      className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-400 hover:text-rose-500 disabled:opacity-50"
                    >
                      {deletingId === promo.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  )
}