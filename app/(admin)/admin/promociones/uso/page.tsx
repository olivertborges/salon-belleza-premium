// @ts-nocheck
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
  Clock, 
  Tag, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  Star,
  Flame
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

const categoryColors: Record<string, string> = {
  flash: 'from-red-500 to-red-600',
  welcome: 'from-emerald-400 to-emerald-600',
  referral: 'from-blue-400 to-blue-600',
  special: 'from-[#D4AF37] to-[#C9A96E]'
}

const categoryIcons: Record<string, React.ReactNode> = {
  flash: <Flame className="w-3.5 h-3.5" />,
  welcome: <Gift className="w-3.5 h-3.5" />,
  referral: <Users className="w-3.5 h-3.5" />,
  special: <Star className="w-3.5 h-3.5" />
}

export default function UsoPromocionesPage() {
  const { tenantId } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'

  const [usos, setUsos] = useState<PromotionUsage[]>([])
  const [filteredUsos, setFilteredUsos] = useState<PromotionUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadUsos()
  }, [tenantId])

  const loadUsos = async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('promotion_usage')
        .select(`
          *,
          promotion:promotion_id (title, discount_percent, code, category)
        `)
        .eq('tenant_id', tenantId)
        .eq('action', 'applied')
        .order('used_at', { ascending: false })

      if (error) throw error

      setUsos(data || [])
      setFilteredUsos(data || [])
      setSuccess(`${data?.length || 0} usos cargados correctamente`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error cargando usos:', error)
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
      <div className={`flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden ${isDark ? 'bg-[#150D08]' : 'bg-[#FDFBF9]'}`}>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[100px] pointer-events-none" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-[#D4AF37]/20 shadow-2xl">
          <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
          <p className="text-xs font-black tracking-[0.2em] text-[#C9A96E] uppercase animate-pulse">
            Cargando historial de usos...
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 relative z-10 pt-4">

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

          <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
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
                <h1 className={`font-serif text-2xl md:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                  Uso de Promociones
                </h1>
                <p className={`text-xs ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                  {totalUsos} usos registrados por clientes del salón.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start md:self-center shrink-0">
              <button 
                onClick={handleRefresh} 
                disabled={refreshing} 
                className={`p-3 rounded-xl border transition-all duration-300 flex items-center gap-2 text-xs font-bold ${
                  isDark 
                    ? 'bg-[#291A11] border-[#3D281E] text-[#BCAEA5] hover:text-white' 
                    : 'bg-[#FAF6F2] border-[#EADED5] text-[#6E5A4D] hover:text-[#1A0E0A]'
                }`}
                title="Actualizar Usos"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
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
        {/* KPIS */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`rounded-2xl p-4 border transition-all duration-300 flex items-center gap-4 ${
            isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5] shadow-sm'
          }`}>
            <div className="p-3 rounded-xl bg-[#D4AF37]/10 text-[#C9A96E] shrink-0 border border-[#D4AF37]/20">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Total Usos</p>
              <h3 className={`text-xl font-bold font-serif ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>{totalUsos}</h3>
            </div>
          </div>

          <div className={`rounded-2xl p-4 border transition-all duration-300 flex items-center gap-4 ${
            isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5] shadow-sm'
          }`}>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Clientes Únicos</p>
              <h3 className={`text-xl font-bold font-serif ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>{clientesUnicos}</h3>
            </div>
          </div>

          <div className={`rounded-2xl p-4 border transition-all duration-300 flex items-center gap-4 ${
            isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5] shadow-sm'
          }`}>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 border border-amber-500/20">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Promociones Usadas</p>
              <h3 className={`text-xl font-bold font-serif ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>{promocionesUsadas}</h3>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BÚSQUEDA */}
        {/* ============================================================ */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all duration-300 ${
          isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5] shadow-sm'
        }`}>
          <Search className="w-4 h-4 text-[#C9A96E] shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, promoción o código..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`bg-transparent border-none outline-none text-xs w-full ${
              isDark ? 'text-white placeholder-[#8A766A]' : 'text-[#1A0E0A] placeholder-[#A39081]'
            }`}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className={`p-1 rounded-lg transition-colors shrink-0 ${
                isDark ? 'hover:bg-[#291A11] text-[#BCAEA5]' : 'hover:bg-[#FAF6F2] text-[#6E5A4D]'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ============================================================ */}
        {/* LISTADO DE USOS */}
        {/* ============================================================ */}
        <div className="space-y-3">
          {filteredUsos.length === 0 ? (
            <div className={`text-center py-16 border border-dashed rounded-3xl ${
              isDark ? 'border-[#3D281E] bg-[#1E120C]/30 text-[#BCAEA5]' : 'border-[#EADED5] bg-white/50 text-[#6E5A4D]'
            }`}>
              <div className="flex flex-col items-center gap-3">
                <Gift className="w-10 h-10 text-[#C9A96E]/60" />
                <p className="text-xs font-bold uppercase tracking-wider">No hay usos de promociones registrados</p>
              </div>
            </div>
          ) : (
            filteredUsos.map((uso) => {
              const category = uso.promotion?.category || 'special'
              const gradientColor = categoryColors[category] || 'from-[#D4AF37] to-[#C9A96E]'
              const icon = categoryIcons[category] || <Star className="w-3.5 h-3.5" />

              return (
                <div 
                  key={uso.id}
                  className={`group relative rounded-2xl border p-4 md:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    isDark 
                      ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#D4AF37]/50' 
                      : 'bg-white border-[#EADED5] hover:border-[#D4AF37]/50 shadow-sm'
                  }`}
                >
                  <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b ${gradientColor}`} />

                  <div className="pl-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-950 font-bold text-xs shrink-0 bg-gradient-to-br from-[#D4AF37] via-[#E8D5A0] to-[#C9A96E] shadow-sm">
                          {uso.client_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                            {uso.client_name || 'Cliente sin nombre'}
                          </p>
                          <p className={`text-[10px] truncate ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                            {uso.client_email || 'Sin email'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-sm bg-gradient-to-r ${gradientColor}`}>
                          {icon}
                          {uso.promotion?.category || 'Special'}
                        </span>
                        <span className={`text-sm font-medium truncate ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                          {uso.promotion?.title || 'Promoción eliminada'}
                        </span>
                        {uso.promotion?.discount_percent > 0 && (
                          <span className="text-sm font-bold text-emerald-500">
                            -{uso.promotion.discount_percent}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-6 shrink-0">
                      {uso.promotion?.code && (
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-[#C9A96E]" />
                          <code className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                            isDark ? 'bg-[#150D08] border-[#3D281E] text-[#FFF9F6]' : 'bg-[#FAF8F5] border-[#EADED5] text-[#1A0E0A]'
                          }`}>
                            {uso.promotion.code}
                          </code>
                        </div>
                      )}

                      <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                        <Clock className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <span>
                          {new Date(uso.used_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {filteredUsos.length > 0 && (
          <div className={`text-center text-[10px] font-mono tracking-widest uppercase py-2 border-t ${
            isDark ? 'border-[#3D281E] text-[#BCAEA5]' : 'border-[#EADED5] text-[#6E5A4D]'
          }`}>
            Mostrando {filteredUsos.length} de {usos.length} usos
          </div>
        )}

      </div>
    </div>
  )
}
