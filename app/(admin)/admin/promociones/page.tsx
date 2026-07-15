// app/(admin)/promociones/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Copy,
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
  Loader2
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

  // ✅ FUNCIÓN ELIMINAR - CORREGIDA CON CASCADA
  const handleDelete = async (id: string) => {
    // Contar cuántos usos tiene
    const { count, error: countError } = await supabase
      .from('promotion_usage')
      .select('*', { count: 'exact', head: true })
      .eq('promotion_id', id)

    if (countError) {
      console.error('Error contando usos:', countError)
    }

    const usoCount = count || 0
    let confirmMessage = '¿Estás seguro de eliminar esta promoción? Esta acción no se puede deshacer.'
    
    if (usoCount > 0) {
      confirmMessage = `⚠️ Esta promoción tiene ${usoCount} uso${usoCount > 1 ? 's' : ''} registrado${usoCount > 1 ? 's' : ''}. Al eliminarla, también se eliminarán todos los registros de uso. ¿Continuar?`
    }

    if (!confirm(confirmMessage)) return

    setDeletingId(id)
    setError(null)
    setSuccess(null)

    try {
      // 1. Primero eliminar los usos de promotion_usage
      if (usoCount > 0) {
        const { error: deleteUsageError } = await supabase
          .from('promotion_usage')
          .delete()
          .eq('promotion_id', id)

        if (deleteUsageError) {
          console.error('Error eliminando usos:', deleteUsageError)
          throw new Error('No se pudieron eliminar los usos asociados')
        }
      }

      // 2. Obtener la promoción para eliminar la imagen
      const { data: promo, error: fetchError } = await supabase
        .from('promotions')
        .select('image_url')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('Error obteniendo promoción:', fetchError)
      }

      // 3. Si tiene imagen, eliminar del storage
      if (promo?.image_url) {
        try {
          const urlParts = promo.image_url.split('/')
          const filePath = urlParts.slice(urlParts.indexOf('promotions')).join('/')
          await supabase.storage
            .from('promotions')
            .remove([filePath])
        } catch (storageError) {
          console.error('Error eliminando imagen del storage:', storageError)
          // Continuamos aunque falle la eliminación de la imagen
        }
      }

      // 4. Eliminar la promoción de la base de datos
      const { error: deleteError } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setSuccess(`✅ Promoción eliminada correctamente${usoCount > 0 ? ` (se eliminaron ${usoCount} uso${usoCount > 1 ? 's' : ''})` : ''}`)
      setTimeout(() => setSuccess(null), 3000)
      
      // Recargar la lista
      await loadPromociones()
      
    } catch (error: any) {
      console.error('Error eliminando promoción:', error)
      setError(`❌ Error al eliminar: ${error.message || 'Error desconocido'}`)
      setTimeout(() => setError(null), 3000)
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      setSuccess(`✅ Promoción ${!currentStatus ? 'activada' : 'desactivada'} correctamente`)
      setTimeout(() => setSuccess(null), 3000)
      await loadPromociones()
    } catch (error) {
      console.error('Error cambiando estado:', error)
      setError('❌ Error al cambiar el estado')
      setTimeout(() => setError(null), 3000)
    }
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
      case 'flash': return <Flame className="w-3.5 h-3.5" />
      case 'premium': return <Crown className="w-3.5 h-3.5" />
      case 'welcome': return <Gift className="w-3.5 h-3.5" />
      case 'seasonal': return <Sparkles className="w-3.5 h-3.5" />
      default: return <Tag className="w-3.5 h-3.5" />
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
                Crea y gestiona todas tus promociones y volantes
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
              <span className="sm:hidden">Act.</span>
            </button>
            <Link 
              href="/admin/promociones/crear"
              className="px-3 py-2 rounded-xl text-white hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva Promoción</span>
              <span className="sm:hidden">+</span>
            </Link>
          </div>
        </div>
      </div>

      {/* MENSAJES DE ERROR/SUCCESS */}
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

      {/* FILTROS */}
      <div className="flex flex-col md:flex-row gap-3 p-3 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <Search className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
          <input 
            type="text" 
            placeholder="Buscar promociones por título, descripción o código..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-stone-800 dark:text-pink-100 placeholder:text-stone-400 w-full"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs border bg-white dark:bg-[#0f0c1b] text-stone-800 dark:text-pink-100 border-pink-100/60 dark:border-fuchsia-950`}
          >
            <option value="all">Todas las categorías</option>
            <option value="flash">Flash Sale</option>
            <option value="premium">Premium</option>
            <option value="seasonal">Temporada</option>
            <option value="welcome">Bienvenida</option>
          </select>

          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs border bg-white dark:bg-[#0f0c1b] text-stone-800 dark:text-pink-100 border-pink-100/60 dark:border-fuchsia-950`}
          >
            <option value="all">Todos</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>
        </div>
      </div>

      {/* TABLA DE PROMOCIONES */}
      <div className="rounded-2xl border overflow-hidden bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDark ? 'bg-[#0f0c1b]' : 'bg-stone-50'}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-stone-500">Promoción</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-stone-500">Descuento</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-stone-500">Código</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-stone-500">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-stone-500">Usos</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-stone-500">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-stone-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-fuchsia-950">
              {filteredPromociones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-stone-500">
                    <div className="flex flex-col items-center gap-2">
                      <Gift className="w-8 h-8 text-stone-300" />
                      <p>No hay promociones creadas</p>
                      <Link 
                        href="/admin/promociones/crear"
                        className="px-4 py-2 rounded-xl text-white text-xs font-bold hover:scale-105 transition-all"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Crear primera promoción
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPromociones.map((promo) => (
                  <tr key={promo.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/40 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-stone-900 dark:text-white truncate max-w-[200px]">
                          {promo.title}
                        </p>
                        <p className="text-[10px] text-stone-400 truncate max-w-[200px]">
                          {promo.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-emerald-500">
                        {promo.discount_percent}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 text-xs font-mono">
                        {promo.code || 'N/A'}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        promo.category === 'flash' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                        promo.category === 'premium' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                        promo.category === 'welcome' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                      }`}>
                        {getCategoryIcon(promo.category)}
                        {getCategoryLabel(promo.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-stone-600 dark:text-stone-400">
                        {promo.uses_count || 0}{promo.uses_limit ? `/${promo.uses_limit}` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(promo.id, promo.is_active)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${
                          promo.is_active 
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-stone-100 text-stone-400 border border-stone-200 hover:bg-stone-200'
                        }`}
                      >
                        {promo.is_active ? (
                          <><CheckCircle2 className="w-2.5 h-2.5" /> Activa</>
                        ) : (
                          <><XCircle className="w-2.5 h-2.5" /> Inactiva</>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link 
                          href={`/admin/promociones/editar/${promo.id}`}
                          className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-400 hover:text-pink-500"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <Link 
                          href={`/promociones-cliente#${promo.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-400 hover:text-blue-500"
                        >
                          <Eye className="w-3.5 h-3.5" />
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESUMEN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Usos totales</p>
        </div>
      </div>
    </div>
  )
}