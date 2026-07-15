// app/(admin)/promociones/uso/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Gift, 
  Search, 
  Users, 
  Calendar, 
  RefreshCw,
  AlertCircle,
  User,
  Clock,
  Tag,
  Percent,
  Loader2
} from 'lucide-react'

interface PromotionUsage {
  id: string
  promotion_id: string
  user_id: string
  client_id: string
  client_name: string
  client_email: string
  tenant_id: string
  action: string
  used_at: string
  promotion: {
    title: string
    discount_percent: number
    code: string
    category: string
  }
}

export default function UsoPromocionesPage() {
  const { tenantId } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color || '#DB5B9A'

  const [usos, setUsos] = useState<PromotionUsage[]>([])
  const [filteredUsos, setFilteredUsos] = useState<PromotionUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

  useEffect(() => {
    loadUsos()
  }, [tenantId])

  // ✅ CONSULTA CORREGIDA - Usa client_name de promotion_usage
  const loadUsos = async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    try {
      console.log('🔍 Cargando usos para tenant:', tenantId)
      
      // ✅ Consulta simple: solo promotion_usage con promotion
      const { data, error } = await supabase
        .from('promotion_usage')
        .select(`
          *,
          promotion:promotion_id (title, discount_percent, code, category)
        `)
        .eq('tenant_id', tenantId)
        .eq('action', 'applied')
        .order('used_at', { ascending: false })

      if (error) {
        console.error('❌ Error en consulta:', error)
        throw error
      }

      console.log('📦 Usos encontrados:', data?.length || 0)

      // ✅ Los datos ya tienen client_name y client_email de la tabla promotion_usage
      setUsos(data || [])
      setFilteredUsos(data || [])
    } catch (error: any) {
      console.error('❌ Error cargando usos:', error)
      setError(`Error al cargar los usos: ${error.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let filtered = usos
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(u => 
        u.client_name?.toLowerCase().includes(term) ||
        u.client_email?.toLowerCase().includes(term) ||
        u.promotion?.title?.toLowerCase().includes(term) ||
        u.promotion?.code?.toLowerCase().includes(term)
      )
    }
    setFilteredUsos(filtered)
  }, [searchTerm, usos])

  const totalUsos = usos.length
  const clientesUnicos = new Set(usos.map(u => u.client_id || u.user_id)).size

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: primaryColor }} />
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse" style={{ color: primaryColor }}>
          Cargando usos de promociones...
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
            <Link 
              href="/admin/promociones"
              className="p-2 rounded-xl hover:bg-pink-50 dark:hover:bg-fuchsia-950/40 transition-colors text-stone-500 hover:text-pink-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-serif font-extrabold text-stone-900 dark:text-white mt-0.5 truncate">
                Uso de Promociones
              </h2>
              <p className="text-xs text-stone-500 dark:text-pink-100/60 mt-0.5 truncate">
                {totalUsos} usos registrados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto justify-end">
            <button 
              onClick={() => { setRefreshing(true); loadUsos() }} 
              disabled={refreshing} 
              className="px-3 py-2 rounded-xl bg-pink-50 dark:bg-fuchsia-950/40 border border-pink-100/60 dark:border-fuchsia-900/40 hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
              style={{ color: primaryColor }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
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

      {/* KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl p-3 border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-black">Total de usos</p>
            <h3 className="text-sm font-mono font-black text-stone-900 dark:text-pink-100">{totalUsos}</h3>
          </div>
        </div>
        <div className="rounded-2xl p-3 border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-black">Clientes únicos</p>
            <h3 className="text-sm font-mono font-black text-emerald-500">{clientesUnicos}</h3>
          </div>
        </div>
        <div className="rounded-2xl p-3 border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-black">Promociones usadas</p>
            <h3 className="text-sm font-mono font-black text-amber-500">{new Set(usos.map(u => u.promotion_id)).size}</h3>
          </div>
        </div>
      </div>

      {/* BÚSQUEDA */}
      <div className="flex flex-col md:flex-row gap-3 p-3 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
        <div className="flex-1 flex items-center gap-3">
          <Search className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
          <input 
            type="text" 
            placeholder="Buscar por cliente, promoción o código..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-stone-800 dark:text-pink-100 placeholder:text-stone-400 w-full"
          />
        </div>
      </div>

      {/* TABLA DE USOS */}
      <div className="rounded-2xl border overflow-hidden bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDark ? 'bg-[#0f0c1b]' : 'bg-stone-50'}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-stone-500">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-stone-500">Promoción</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-stone-500">Descuento</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-stone-500">Código</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-stone-500">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-fuchsia-950">
              {filteredUsos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-stone-500">
                    <div className="flex flex-col items-center gap-2">
                      <Gift className="w-8 h-8 text-stone-300" />
                      <p>No hay usos de promociones registrados</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsos.map((uso) => (
                  <tr key={uso.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/40 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-stone-900 dark:text-white">
                          {uso.client_name || 'Cliente sin nombre'}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {uso.client_email || 'Sin email'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-stone-900 dark:text-white">
                        {uso.promotion?.title || 'Promoción eliminada'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-emerald-500">
                        {uso.promotion?.discount_percent || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 text-xs font-mono">
                        {uso.promotion?.code || 'N/A'}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-stone-500">
                        {new Date(uso.used_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}