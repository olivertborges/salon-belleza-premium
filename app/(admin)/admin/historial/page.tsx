// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  History, CheckCircle2, Clock, Search,
  ArrowRight, User, DollarSign, Sparkles,
  RefreshCw, X, TrendingUp, Calendar, Users,
  Plus, AlertCircle
} from 'lucide-react'

interface HistorialItem {
  id: string
  type: 'cita' | 'cliente'
  title: string
  description: string
  date: string
  amount?: number
  status: string
}

const TYPE_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  bg: string; 
  icon: React.ComponentType<{ className?: string }> 
}> = {
  cita: { 
    label: 'Cita', 
    color: 'text-[#D4AF37]', 
    bg: 'bg-[#D4AF37]/10', 
    icon: CheckCircle2 
  },
  cliente: { 
    label: 'Cliente', 
    color: 'text-[#EC4899]', 
    bg: 'bg-[#EC4899]/10', 
    icon: User 
  }
}

export default function HistorialPage() {
  const { settings } = useSettings()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // ============================================================
  // PALETA DE COLORES - DORADO PROTAGONISTA
  // ============================================================
  const gold = '#D4AF37'
  const goldLight = '#E8D5A0'
  const goldDark = '#C9A96E'
  const pink = '#EC4899'
  const blue = '#3B82F6'

  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${gold}, ${goldLight}, ${gold})`
  }

  const headerGradient = {
    backgroundImage: `linear-gradient(135deg, ${gold} 0%, ${goldDark} 50%, ${goldLight} 100%)`
  }

  useEffect(() => {
    cargarHistorial()
  }, [])

  const cargarHistorial = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)

    try {
      const items: HistorialItem[] = []

      // 1. ✅ TODAS LAS CITAS (no solo completadas)
      const { data: citas } = await supabase
        .from('appointments')
        .select(`
          id, total_price, date, time, status,
          clients:client_id (name),
          services:service_id (name)
        `)
        .order('date', { ascending: false })
        .limit(30)

      if (citas) {
        citas.forEach((c: any) => {
          const statusMap: Record<string, string> = {
            pending: 'Pendiente',
            confirmed: 'Confirmada',
            in_progress: 'En curso',
            completed: 'Completada',
            cancelled: 'Cancelada'
          }
          items.push({
            id: c.id,
            type: 'cita',
            title: `Cita: ${c.clients?.name || 'Cliente'}`,
            description: `${c.services?.name || 'Servicio'} — ${c.time?.slice(0,5) || '--:--'}`,
            date: `${c.date}T12:00:00`,
            amount: c.total_price || 0,
            status: statusMap[c.status] || c.status || 'Pendiente'
          })
        })
      }

      // 2. ✅ CLIENTES NUEVOS
      const { data: clientes } = await supabase
        .from('clients')
        .select('id, name, email, phone, created_at')
        .order('created_at', { ascending: false })
        .limit(20)

      if (clientes) {
        clientes.forEach((c) => {
          items.push({
            id: c.id,
            type: 'cliente',
            title: `Nueva clienta: ${c.name}`,
            description: `Email: ${c.email || 'No registrado'} • Tel: ${c.phone || 'No registrado'}`,
            date: c.created_at,
            amount: 0,
            status: 'Registrada'
          })
        })
      }

      // Ordenar por fecha (más reciente primero)
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setHistorial(items)
      setSuccess('Historial actualizado correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error cargando historial:', err)
      setError(err.message || 'Error de sincronización con la base de datos')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    cargarHistorial(true)
  }

  const filtrados = historial.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                        item.description.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'todos' || item.type === filterType
    return matchSearch && matchType
  })

  const totalEventos = historial.length
  const totalCitas = historial.filter(i => i.type === 'cita').length
  const totalClientes = historial.filter(i => i.type === 'cliente').length
  const totalIngresos = historial
    .filter(i => i.amount && i.amount > 0)
    .reduce((sum, i) => sum + (i.amount || 0), 0)

  const filtros = [
    { id: 'todos', label: 'VER TODO' },
    { id: 'cita', label: 'CITAS' },
    { id: 'cliente', label: 'CLIENTES' }
  ]

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-500 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
            <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
          </div>
          <p className={`text-[10px] tracking-[0.4em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]/60'}`}>
            Cargando historial...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-8 relative overflow-x-hidden ${isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'}`}>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-6xl mx-auto px-4 space-y-6 relative z-10">

        {/* ============================================================ */}
        {/* CABECERA — DORADO PROTAGONISTA */}
        {/* ============================================================ */}
        <div 
          className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl text-white border border-white/10"
          style={headerGradient}
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-black/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-white/80">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                Auditoría del Sistema
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight drop-shadow-sm">
                Historial Fresh Nails
              </h1>
              <p className="text-xs md:text-sm text-white/80 font-medium max-w-md">
                Registro cronológico de citas y nuevas clientas del salón.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-center shrink-0">
              <button 
                onClick={handleRefresh} 
                disabled={refreshing} 
                className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95 shadow-lg"
                title="Actualizar Historial"
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
          <div className={`flex items-start gap-4 border p-4 rounded-2xl transition-all duration-300 ${isDark ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#D4AF37]/30 text-[#1A0E0A]'}`}>
            <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
              <AlertCircle className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-sm font-light">{error}</p>
          </div>
        )}

        {success && (
          <div className={`flex items-start gap-4 border p-4 rounded-2xl transition-all duration-300 ${isDark ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#D4AF37]/30 text-[#1A0E0A]'}`}>
            <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-sm font-light">{success}</p>
          </div>
        )}

        {/* ============================================================ */}
        {/* KPIS — DORADO PROTAGONISTA */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className={`rounded-2xl p-2.5 sm:p-3 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className={`p-1.5 sm:p-2 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
                <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
              </div>
              <div className="min-w-0">
                <p className={`text-[7px] sm:text-[9px] font-mono uppercase tracking-wider font-black truncate ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Total</p>
                <h3 className={`text-sm sm:text-base font-mono font-black ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{totalEventos}</h3>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-2.5 sm:p-3 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className={`p-1.5 sm:p-2 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
              </div>
              <div className="min-w-0">
                <p className={`text-[7px] sm:text-[9px] font-mono uppercase tracking-wider font-black truncate ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Citas</p>
                <h3 className="text-sm sm:text-base font-mono font-black text-[#D4AF37]">{totalCitas}</h3>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-2.5 sm:p-3 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className={`p-1.5 sm:p-2 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#EC4899]" />
              </div>
              <div className="min-w-0">
                <p className={`text-[7px] sm:text-[9px] font-mono uppercase tracking-wider font-black truncate ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Clientes</p>
                <h3 className="text-sm sm:text-base font-mono font-black text-[#EC4899]">{totalClientes}</h3>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-2.5 sm:p-3 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className={`p-1.5 sm:p-2 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
              </div>
              <div className="min-w-0">
                <p className={`text-[7px] sm:text-[9px] font-mono uppercase tracking-wider font-black truncate ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Ingresos</p>
                <h3 className="text-sm sm:text-base font-mono font-black text-[#D4AF37]">${totalIngresos.toLocaleString()}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* FILTROS Y BUSCADOR */}
        {/* ============================================================ */}
        <div className={`flex flex-col md:flex-row gap-3 p-3 rounded-2xl border shadow-sm transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
          <div className="flex items-center gap-3 flex-1">
            <Search className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
            <input 
              type="text" 
              placeholder="Buscar por cliente, servicio o descripción..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`bg-transparent border-none outline-none text-xs w-full font-medium ${isDark ? 'text-[#FFF9F6] placeholder:text-[#A89588]' : 'text-[#1A0E0A] placeholder:text-[#A89588]'}`}
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#F0E4DA]'}`}
              >
                <X className={`w-4 h-4 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {filtros.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-mono font-bold transition-all duration-300 whitespace-nowrap ${
                  filterType === f.id
                    ? 'bg-[#D4AF37] text-[#1A0E0A] shadow-sm'
                    : isDark 
                      ? 'bg-[#1E120C] border border-[#3D281E] text-[#A89588] hover:text-[#FFF9F6]'
                      : 'bg-[#FFF9F6] border border-[#F0E4DA] text-[#5C4A3E] hover:text-[#1A0E0A]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* LISTA DE HISTORIAL — LÍNEA DE TIEMPO */}
        {/* ============================================================ */}
        <div className="relative space-y-3 pl-2 sm:pl-6 before:absolute before:left-[18px] sm:before:left-[34px] before:top-3 before:bottom-3 before:w-[1px] before:bg-gradient-to-b before:from-[#D4AF37]/30 before:to-transparent">
          {filtrados.length === 0 ? (
            <div className={`text-center py-12 border border-dashed rounded-2xl font-mono text-xs ${isDark ? 'bg-[#2A1B14]/40 border-[#3D281E] text-[#A89588]' : 'bg-white border-[#F0E4DA] text-[#5C4A3E]'}`}>
              No se encontraron registros en este segmento.
            </div>
          ) : (
            filtrados.map((item, index) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.cita
              const IconComponent = config.icon
              const isCita = item.type === 'cita'

              return (
                <div 
                  key={`${item.id}-${index}`} 
                  className={`relative border rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                    isDark ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40' : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40'
                  }`}
                >
                  <div className={`absolute left-[-18px] sm:left-[-34px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border transition-all duration-300 hidden sm:block ${
                    isCita ? 'bg-[#D4AF37] border-[#D4AF37]/50' : 'bg-[#EC4899] border-[#EC4899]/50'
                  }`} />

                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${
                      isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
                    } ${config.bg}`}>
                      <IconComponent className={`w-4 h-4 ${config.color}`} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className={`text-xs font-medium truncate ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                          {item.title}
                        </h4>
                        <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>{item.description}</p>

                      <div className="flex items-center gap-3 pt-1 text-[10px] font-mono">
                        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E]'}`}>
                          <Calendar className="w-3 h-3" />
                          {new Date(item.date).toLocaleDateString('es-ES', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                        {isCita && item.amount && item.amount > 0 && (
                          <span className="font-bold text-[#D4AF37] bg-[#D4AF37]/5 px-1.5 py-0.5 rounded border border-[#D4AF37]/10">
                            ${item.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t pt-2.5 sm:pt-0 sm:border-t-0 ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E]'}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

      </div>

      <style jsx global>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>

    </div>
  )
}