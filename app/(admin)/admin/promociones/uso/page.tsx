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
  Loader2,
  TrendingUp,
  CheckCircle2
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
  const secondaryColor = settings?.secondary_color || '#E5A46E'

  const [usos, setUsos] = useState<PromotionUsage[]>([])
  const [filteredUsos, setFilteredUsos] = useState<PromotionUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
  }

  const primaryBgStyle = { backgroundColor: primaryColor }

  useEffect(() => {
    loadUsos()
  }, [tenantId])

  const loadUsos = async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    try {
      console.log('🔍 Cargando usos para tenant:', tenantId)

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

      setUsos(data || [])
      setFilteredUsos(data || [])
      setSuccess(`✅ ${data?.length || 0} usos cargados correctamente`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('❌ Error cargando usos:', error)
      setError(`Error al cargar los usos: ${error.message || 'Error desconocido'}`)
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadUsos()
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
  const promocionesUsadas = new Set(usos.map(u => u.promotion_id)).size

  if (loading) {
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
              USOS DE PROMOCIONES
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
    <div className="space-y-6 p-1 max-w-7xl mx-auto">

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
              Registro de Usos
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/admin/promociones"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight drop-shadow-sm">
                Uso de Promociones
              </h1>
            </div>
            <p className="text-xs md:text-sm text-pink-50/80 font-medium max-w-md">
              {totalUsos} usos registrados por clientes del salón.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <button 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95 shadow-lg"
              title="Actualizar Usos"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MENSAJES */}
      {/* ============================================================ */}
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

      {/* ============================================================ */}
      {/* KPIS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl shrink-0" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
            <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Total usos</p>
            <h3 className="text-sm sm:text-base font-mono font-black text-stone-900 dark:text-pink-100">{totalUsos}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Clientes únicos</p>
            <h3 className="text-sm sm:text-base font-mono font-black text-emerald-500">{clientesUnicos}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Promociones usadas</p>
            <h3 className="text-sm sm:text-base font-mono font-black text-amber-500">{promocionesUsadas}</h3>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BÚSQUEDA */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row gap-3 p-3 rounded-2xl border shadow-sm bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <Search className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
          <input 
            type="text" 
            placeholder="Buscar por cliente, promoción o código..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-stone-800 dark:text-pink-100 placeholder:text-stone-400 w-full"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="p-1 hover:bg-pink-100 dark:hover:bg-fuchsia-950/50 rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4 text-stone-400" />
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* TABLA DE USOS */}
      {/* ============================================================ */}
      <div className="rounded-2xl border overflow-hidden shadow-sm bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={isDark ? 'bg-[#0f0c1b]' : 'bg-stone-50'}>
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-stone-500">Cliente</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-stone-500">Promoción</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-stone-500">Descuento</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-stone-500">Código</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-stone-500">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-fuchsia-950/50">
              {filteredUsos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Gift className="w-8 h-8 text-stone-300 dark:text-stone-600" />
                      <p className="text-sm text-stone-500 dark:text-stone-400">No hay usos de promociones registrados</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsos.map((uso) => (
                  <tr key={uso.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-stone-900 dark:text-white">
                          {uso.client_name || 'Cliente sin nombre'}
                        </p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500">
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
                      <code className="px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 text-xs font-mono text-stone-700 dark:text-stone-300">
                        {uso.promotion?.code || 'N/A'}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-stone-500 dark:text-stone-400">
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

        {/* Footer con total */}
        {filteredUsos.length > 0 && (
          <div className={`px-4 py-3 border-t text-xs font-mono text-stone-500 dark:text-stone-400 ${isDark ? 'bg-[#0f0c1b]' : 'bg-stone-50'}`}>
            Mostrando {filteredUsos.length} de {usos.length} usos
          </div>
        )}
      </div>

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