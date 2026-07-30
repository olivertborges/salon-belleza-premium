// app/(admin)/citas/canceladas/page.tsx
// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  XCircle, Calendar, User, Scissors, Search, 
  Clock, DollarSign, Trash2,
  RefreshCw, CheckCircle2, Users,
  AlertCircle, Sparkles
} from 'lucide-react'

interface CitaCancelada {
  id: string
  client_id: string
  professional_id: string
  service_id: string
  date: string
  time: string
  status: string
  notes: string
  total_price: number
  cancelled_at: string
  clients: { name: string; email: string; phone: string }
  services: { name: string; price: number; duration: number }
  staff: { name: string } | null
}

export default function CancelacionesPage() {
  const { tenantId } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [citas, setCitas] = useState<CitaCancelada[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchCancelaciones = async (showLoading = true) => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    if (showLoading) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients:client_id (id, name, email, phone),
          services:service_id (id, name, price, duration)
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'cancelled')
        .order('date', { ascending: false })

      if (error) throw error

      let citasConStaff: any[] = []

      if (data && data.length > 0) {
        const staffIds = data
          .map((c: any) => c.professional_id)
          .filter((id: any) => id)

        let staffMap: Record<string, { name: string }> = {}
        if (staffIds.length > 0) {
          const { data: staffData } = await supabase
            .from('staff')
            .select('id, name')
            .in('id', staffIds)

          if (staffData) {
            staffMap = (staffData as any[]).reduce((acc: any, s: any) => ({ ...acc, [s.id]: { name: s.name } }), {})
          }
        }

        citasConStaff = data.map((cita: any) => ({
          ...cita,
          staff: cita.professional_id ? staffMap[cita.professional_id] || null : null
        }))
      }

      setCitas(citasConStaff)
    } catch (err: any) {
      console.error('Error cargando cancelaciones:', err)
      setError(err.message || 'Error al cargar las cancelaciones')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCancelaciones()
  }, [tenantId])

  const handleRefresh = () => {
    fetchCancelaciones(false)
  }

  const eliminarCita = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar permanentemente esta cita cancelada?')) return

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

      if (error) throw error

      setCitas(prev => prev.filter(c => c.id !== id))
      setSuccess('Cita eliminada permanentemente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error eliminando cita:', err)
      setError(err.message || 'Error al eliminar la cita')
      setTimeout(() => setError(null), 3000)
    }
  }

  const citasFiltradas = citas.filter(c => {
    const matchSearch = c.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
                        c.services?.name?.toLowerCase().includes(search.toLowerCase()) ||
                        c.id?.toLowerCase().includes(search.toLowerCase())
    const matchDate = filterDate ? c.date === filterDate : true
    return matchSearch && matchDate
  })

  const totalCanceladas = citas.length
  const totalPerdido = citas.reduce((sum, c) => sum + (c.total_price || 0), 0)
  const clientesAfectados = new Set(citas.map(c => c.client_id)).size

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden ${isDark ? 'bg-[#150D08]' : 'bg-[#FDFBF9]'}`}>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[100px] pointer-events-none" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-[#D4AF37]/20 shadow-2xl">
          <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
          <p className="text-xs font-black tracking-[0.2em] text-[#C9A96E] uppercase animate-pulse">
            Cargando cancelaciones...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-16 relative overflow-hidden ${isDark ? 'bg-[#150D08] text-[#FFF9F6]' : 'bg-[#FDFBF9] text-[#1A0E0A]'}`}>
      
      {/* Fondos Decorativos Orgánicos */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-rose-500/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 relative z-10 pt-4">

        {/* ============================================================ */}
        {/* CABECERA HERO BANNER */}
        {/* ============================================================ */}
        <div className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ${
          isDark 
            ? 'bg-gradient-to-br from-[#271810] via-[#1E120C] to-[#160E09] border-[#3D281E] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]' 
            : 'bg-gradient-to-br from-white via-[#FBF7F4] to-[#F5ECE5] border-[#EADED5] shadow-[0_25px_50px_-15px_rgba(225,208,195,0.4)]'
        }`}>
          <div className="absolute -top-40 -right-40 w-[300px] h-[300px] bg-gradient-to-br from-rose-500/10 to-[#D4AF37]/10 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

          <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-[9px] font-black uppercase tracking-[0.25em] text-rose-500">
                <Sparkles className="w-2.5 h-2.5" />
                ✦ Historial de Citas
              </div>
              <h1 className={`font-serif text-2xl md:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                Citas Canceladas
              </h1>
              <p className={`text-xs ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                {totalCanceladas} citas canceladas registradas en el sistema.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={handleRefresh} 
                disabled={refreshing} 
                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all border flex items-center gap-2 ${
                  isDark ? 'bg-[#291A11] border-[#3D281E] text-[#BCAEA5] hover:text-white' : 'bg-[#FAF6F2] border-[#EADED5] text-[#6E5A4D] hover:text-[#1A0E0A]'
                }`}
                title="Actualizar Cancelaciones"
              >
                <RefreshCw className={`w-4 h-4 text-[#C9A96E] ${refreshing ? 'animate-spin' : ''}`} />
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
        {/* KPIS — 3 columnas responsivas */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-5 rounded-3xl border flex items-center gap-4 ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5] shadow-sm'}`}>
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>Total Canceladas</p>
              <h3 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>{totalCanceladas}</h3>
            </div>
          </div>

          <div className={`p-5 rounded-3xl border flex items-center gap-4 ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5] shadow-sm'}`}>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>Ingresos Perdidos</p>
              <h3 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>${totalPerdido.toLocaleString()}</h3>
            </div>
          </div>

          <div className={`p-5 rounded-3xl border flex items-center gap-4 ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5] shadow-sm'}`}>
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>Clientes Afectados</p>
              <h3 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>{clientesAfectados}</h3>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* FILTROS Y BÚSQUEDA (CON WRAP ORDENADO) */}
        {/* ============================================================ */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          
          <div className={`w-full lg:w-80 p-3 rounded-2xl border flex items-center gap-3 transition-all duration-300 shrink-0 ${
            isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5] shadow-sm'
          }`}>
            <Search className="w-4 h-4 text-[#C9A96E] shrink-0" />
            <input 
              type="text" 
              placeholder="Buscar por cliente o servicio..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`bg-transparent border-none outline-none text-xs w-full ${
                isDark ? 'text-white placeholder-[#8A766A]' : 'text-[#1A0E0A] placeholder-[#A39081]'
              }`}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-[#C9A96E] hover:underline">Limpiar</button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input 
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className={`px-4 py-3 rounded-2xl border text-xs font-bold outline-none transition-all ${
                isDark ? 'bg-[#1E120C] border-[#3D281E] text-white' : 'bg-white border-[#EADED5] text-[#1A0E0A] shadow-sm'
              }`}
            />
            {filterDate && (
              <button 
                onClick={() => setFilterDate('')}
                className={`px-4 py-3 rounded-2xl border text-xs font-bold uppercase tracking-wider transition-all ${
                  isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#BCAEA5] hover:text-white' : 'bg-white border-[#EADED5] text-[#6E5A4D] hover:text-[#1A0E0A]'
                }`}
              >
                Limpiar Fecha
              </button>
            )}
          </div>

        </div>

        {/* ============================================================ */}
        {/* LISTA DE CANCELACIONES */}
        {/* ============================================================ */}
        <div className={`space-y-4 transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>
          {citasFiltradas.length === 0 ? (
            <div className={`text-center py-16 border border-dashed rounded-3xl ${
              isDark ? 'border-[#3D281E] bg-[#1E120C]/30 text-[#BCAEA5]' : 'border-[#EADED5] bg-white/50 text-[#6E5A4D]'
            }`}>
              <div className="flex flex-col items-center gap-3">
                <XCircle className="w-10 h-10 text-rose-500/60" />
                <p className="text-xs font-bold uppercase tracking-wider">
                  {search || filterDate ? 'No hay cancelaciones con esos filtros' : 'No hay citas canceladas registradas'}
                </p>
              </div>
            </div>
          ) : (
            citasFiltradas.map((cita) => (
              <div 
                key={cita.id} 
                className={`group relative rounded-3xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  isDark 
                    ? 'bg-[#1E120C] border-[#3D281E] hover:border-rose-500/40' 
                    : 'bg-white border-[#EADED5] hover:border-rose-300 shadow-sm'
                }`}
              >
                <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full bg-rose-500" />

                <div className="pl-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                      <XCircle className="w-5 h-5 text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                          {cita.clients?.name || 'Cliente'}
                        </h4>
                        <span className="text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-full text-rose-500 uppercase bg-rose-500/10 border border-rose-500/20">
                          Cancelada
                        </span>
                      </div>
                      
                      <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                        <span className="flex items-center gap-1">
                          <Scissors className="w-3.5 h-3.5 text-[#C9A96E]" />
                          {cita.services?.name || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#C9A96E]" />
                          {cita.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#C9A96E]" />
                          {cita.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-[#C9A96E]" />
                          {cita.staff?.name || 'Sin asignar'}
                        </span>
                      </div>

                      {cita.notes && (
                        <p className={`text-xs italic mt-1 line-clamp-1 ${isDark ? 'text-[#8A766A]' : 'text-[#A39081]'}`}>
                          "{cita.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#3D281E]/20 w-full md:w-auto justify-between md:justify-end">
                    <span className="text-sm font-mono font-bold text-rose-500">
                      ${cita.total_price?.toLocaleString() || 0}
                    </span>
                    <button 
                      onClick={() => eliminarCita(cita.id)}
                      className="p-2 rounded-xl border bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20 transition-all"
                      title="Eliminar permanentemente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
