// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, Users, DollarSign, TrendingUp, Sparkles, 
  Clock, BarChart, ArrowUp, RefreshCw, UserCheck,
  PlusCircle, Scissors, Crown
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, tenantId, role, loading: authLoading } = useAuth()
  const { settings, loading: settingsLoading } = useSettings()
  const { theme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  const [stats, setStats] = useState({
    citasHoy: 0,
    citasSemana: 0,
    clientas: 0,
    clientasNuevas: 0,
    ingresos: 0,
    ingresosMes: 0,
    pendientes: 0,
    confirmadas: 0,
    completadas: 0,
    canceladas: 0,
    citasProximas: [] as any[],
    serviciosTop: [] as any[],
  })

  const [isAdmin, setIsAdmin] = useState(false)
  const isDark = theme === 'dark'

  useEffect(() => {
    setAuthorized(true)
    cargarEstadisticas()
    verificarAdmin()
  }, [user, role, authLoading])

  const verificarAdmin = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      setIsAdmin(data?.role === 'admin')
    } catch (error) {
      console.error('Error verifying admin:', error)
    }
  }

  const cargarEstadisticas = async () => {
    try {
      let activeTenantId = tenantId

      if (!activeTenantId && user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .maybeSingle()

        if (prof?.tenant_id) {
          activeTenantId = prof.tenant_id
        } else {
          const { data: firstTenant } = await supabase
            .from('appointments')
            .select('tenant_id')
            .limit(1)
            .maybeSingle()
          activeTenantId = firstTenant?.tenant_id || null
        }
      }

      if (!activeTenantId) {
        setLoading(false)
        return
      }

      const hoy = new Date().toISOString().split('T')[0]
      const hoyDate = new Date()
      const inicioSemana = new Date(hoyDate)
      inicioSemana.setDate(hoyDate.getDate() - hoyDate.getDay() + 1)
      const finSemana = new Date(inicioSemana)
      finSemana.setDate(inicioSemana.getDate() + 6)
      const mesAtras = new Date()
      mesAtras.setMonth(mesAtras.getMonth() - 1)

      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', activeTenantId)
      const appointments = appointmentsData || []

      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('tenant_id', activeTenantId)
      const clients = clientsData || []

      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', activeTenantId)
      const services = servicesData || []

      const citasHoy = appointments.filter((c: any) => c.date?.startsWith(hoy))
      const citasHoyCount = citasHoy.length

      const citasSemana = appointments.filter((c: any) => {
        if (!c.date) return false
        const cDate = new Date(c.date)
        return cDate >= inicioSemana && cDate <= finSemana
      }).length

      const totalClientas = clients.length
      const clientasNuevas = clients.filter((c: any) => {
        if (!c.created_at) return false
        const cDate = new Date(c.created_at)
        return cDate >= mesAtras
      }).length

      const citasConPrecio = appointments.filter((a: any) => a.total_price > 0 || a.price > 0)
      const totalIngresos = citasConPrecio.reduce((sum: number, a: any) => sum + Number(a.total_price || a.price || 0), 0)

      const pendientes = appointments.filter((c: any) => c.status === 'pending').length
      const confirmadas = appointments.filter((c: any) => c.status === 'confirmed').length
      const completadas = appointments.filter((c: any) => c.status === 'completed').length
      const canceladas = appointments.filter((c: any) => c.status === 'cancelled').length

      const proximas = appointments
        .filter((c: any) => c.date && new Date(c.date) > new Date() && c.status !== 'cancelled')
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 4)

      const citasProximas = proximas.map((cita: any) => {
        const cliente = clients.find((c: any) => c.id === cita.client_id)
        const servicio = services.find((s: any) => s.id === cita.service_id)
        return {
          ...cita,
          clienteNombre: cliente?.name || 'Cliente',
          servicioNombre: servicio?.name || 'Servicio',
          precio: servicio?.price || cita.total_price || 0,
        }
      })

      const servicioCount: Record<string, number> = {}
      appointments.forEach((c: any) => {
        if (c.service_id) servicioCount[c.service_id] = (servicioCount[c.service_id] || 0) + 1
      })

      const serviciosTop = Object.entries(servicioCount)
        .map(([id, count]) => {
          const servicio = services.find((s: any) => String(s.id) === String(id))
          return { nombre: servicio?.name || 'Servicio', count, price: servicio?.price || 0 }
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)

      setStats({
        citasHoy: citasHoyCount,
        citasSemana,
        clientas: totalClientas,
        clientasNuevas,
        ingresos: totalIngresos,
        ingresosMes: 0,
        pendientes,
        confirmadas,
        completadas,
        canceladas,
        citasProximas,
        serviciosTop,
      })
    } catch (error) {
      console.error("Error al procesar las estadísticas del dashboard:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    cargarEstadisticas()
  }

  if ((!authorized && loading) || settingsLoading) {
    return (
      <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-500 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
            <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
          </div>
          <p className={`text-[10px] tracking-[0.4em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]/60'}`}>
            Cargando panel ejecutivo...
          </p>
        </div>
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-8 relative overflow-x-hidden ${isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'}`}>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-7xl mx-auto px-4 space-y-6 relative z-10">

        {/* ============================================================ */}
        {/* HEADER */}
        {/* ============================================================ */}
        <div className={`relative overflow-hidden rounded-2xl border shadow-lg transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_15px_35px_rgba(0,0,0,0.3)]' : 'bg-white border-[#F0E4DA] shadow-[0_15px_35px_rgba(240,228,218,0.6)]'}`}>
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-32 left-1/4 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4 min-w-0 w-full">
              <div className={`p-3.5 rounded-2xl shadow-sm shrink-0 mt-0.5 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
                <Crown className="w-6 h-6 text-[#D4AF37]" />
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <p className={`text-[10px] uppercase tracking-[0.25em] font-black ${isDark ? 'text-[#D4AF37]' : 'text-[#D4AF37]'}`}>
                  ✦ {settings?.business_name || 'Salón VIP'}
                </p>
                <h2 className={`font-serif text-2xl md:text-3xl font-light tracking-tight ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  Panel Ejecutivo
                </h2>
                <p className={`text-sm font-light ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                  Control absoluto de tus citas, ingresos y comunidad VIP.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 w-full md:w-auto shrink-0 border-t pt-4 md:pt-0 md:border-t-0 ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}">
              <button 
                onClick={handleRefresh} 
                disabled={refreshing} 
                className={`px-4 py-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.15em] w-full sm:w-auto hover:scale-105 active:scale-95 ${isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588] hover:text-[#FFF9F6] hover:border-[#D4AF37]/40' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E] hover:text-[#1A0E0A] hover:border-[#D4AF37]/40'}`}>
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>

              <Link 
                href="/admin/agenda"
                className={`px-4 py-2.5 rounded-xl text-[#1A0E0A] text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto hover:scale-105 active:scale-95 ${isDark ? 'bg-[#D4AF37] hover:bg-[#E8D5A0] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' : 'bg-[#D4AF37] hover:bg-[#E8D5A0] shadow-[0_4px_15px_rgba(212,175,55,0.3)]'}`}>
                <Calendar className="w-4 h-4" />
                <span>Ver Agenda</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MÉTRICAS PRINCIPALES */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDark ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]' : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'}`}>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Citas Hoy</p>
                <p className={`font-serif text-4xl font-light mt-1 ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{stats.citasHoy}</p>
                <p className={`text-[10px] font-medium mt-0.5 text-[#D4AF37]`}>+{stats.citasSemana} esta semana</p>
              </div>
              <div className={`p-3.5 rounded-xl ${isDark ? 'bg-[#3D281E] text-[#D4AF37]' : 'bg-[#FFF9F6] text-[#D4AF37]'}`}>
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDark ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]' : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'}`}>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Pendientes</p>
                <p className={`font-serif text-4xl font-light mt-1 ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{stats.pendientes}</p>
                <p className={`text-[10px] font-medium mt-0.5 text-[#A89588]`}>Requieren atención</p>
              </div>
              <div className={`p-3.5 rounded-xl ${isDark ? 'bg-[#3D281E] text-[#D4AF37]' : 'bg-[#FFF9F6] text-[#D4AF37]'}`}>
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDark ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]' : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'}`}>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Ingresos</p>
                <p className={`font-serif text-4xl font-light mt-1 text-[#D4AF37]`}>{settings?.currency || '$'}{stats.ingresos.toLocaleString()}</p>
                <p className={`text-[10px] font-medium mt-0.5 text-[#A89588]`}>Hoy</p>
              </div>
              <div className={`p-3.5 rounded-xl ${isDark ? 'bg-[#3D281E] text-[#D4AF37]' : 'bg-[#FFF9F6] text-[#D4AF37]'}`}>
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECCIONES DETALLADAS */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Citas Próximas */}
          <div className={`lg:col-span-2 rounded-2xl border p-6 shadow-sm transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_10px_30px_rgba(0,0,0,0.2)]' : 'bg-white border-[#F0E4DA] shadow-[0_10px_30px_rgba(240,228,218,0.5)]'}`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
                  <Clock className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <h3 className={`font-serif text-xl font-light ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  Próximas <span className="font-serif italic text-[#D4AF37]">Citas</span>
                </h3>
              </div>
              <Link href="/admin/agenda" className={`text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1 transition-colors ${isDark ? 'text-[#A89588] hover:text-[#D4AF37]' : 'text-[#5C4A3E] hover:text-[#D4AF37]'}`}>
                Ver todas <ArrowUp className="w-3 h-3 rotate-45" />
              </Link>
            </div>

            {stats.citasProximas.length === 0 ? (
              <div className={`text-center py-10 border border-dashed rounded-xl ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`}>
                <Calendar className="w-8 h-8 mx-auto mb-2 text-[#A89588]" />
                <p className={`text-sm ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>No hay citas próximas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.citasProximas.map((cita, idx) => {
                  const hoy = new Date()
                  const citaDate = new Date(cita.date)
                  const diffDias = Math.ceil((citaDate.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
                  let label = `En ${diffDias} d`
                  let color = 'text-[#A89588]'
                  if (diffDias === 0) { label = 'Hoy'; color = 'text-[#D4AF37]' }
                  else if (diffDias === 1) { label = 'Mañana'; color = 'text-[#E8D5A0]' }

                  return (
                    <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'border-[#3D281E] bg-[#1E120C]' : 'border-[#F0E4DA] bg-[#FFF9F6]'}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-[#1A0E0A] bg-[#D4AF37]">
                          {citaDate.getDate()}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{cita.clienteNombre}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className={`text-xs font-medium text-[#D4AF37] truncate`}>{cita.servicioNombre}</span>
                            <span className={`text-xs font-mono ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>{cita.time?.slice(0,5) || '--:--'}</span>
                            <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${color}`}>{label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className={`text-sm font-bold text-[#D4AF37]`}>{settings?.currency || '$'}{cita.precio?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top Servicios */}
          <div className={`rounded-2xl border p-6 shadow-sm transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_10px_30px_rgba(0,0,0,0.2)]' : 'bg-white border-[#F0E4DA] shadow-[0_10px_30px_rgba(240,228,218,0.5)]'}`}>
            <div className="flex items-center gap-3 mb-5">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
                <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <h3 className={`font-serif text-xl font-light ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                Top <span className="font-serif italic text-[#D4AF37]">Servicios</span>
              </h3>
            </div>

            {stats.serviciosTop.length === 0 ? (
              <div className={`text-center py-10 border border-dashed rounded-xl ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`}>
                <BarChart className="w-8 h-8 mx-auto mb-2 text-[#A89588]" />
                <p className={`text-sm ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Sin datos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.serviciosTop.map((serv, idx) => {
                  const maxCount = stats.serviciosTop[0]?.count || 1
                  const porcentaje = Math.round((serv.count / maxCount) * 100)

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black text-[#1A0E0A] bg-[#D4AF37]`}>
                            {idx + 1}
                          </span>
                          <span className={`text-sm font-medium truncate ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{serv.nombre}</span>
                        </div>
                        <span className={`text-xs font-mono font-bold ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>{serv.count}x</span>
                      </div>
                      <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-[#3D281E]' : 'bg-[#F0E4DA]'}`}>
                        <div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${porcentaje}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* ACCIONES RÁPIDAS */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/admin/agenda" className={`group relative overflow-hidden rounded-2xl border p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDark ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]' : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
              <PlusCircle className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Nueva Cita</p>
          </Link>

          <Link href="/admin/clientes" className={`group relative overflow-hidden rounded-2xl border p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDark ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]' : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
              <Users className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Clientes</p>
          </Link>

          <Link href="/admin/servicios" className={`group relative overflow-hidden rounded-2xl border p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDark ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]' : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
              <Scissors className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Servicios</p>
          </Link>

          <Link href="/admin/staff" className={`group relative overflow-hidden rounded-2xl border p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDark ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]' : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
              <UserCheck className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Staff</p>
          </Link>
        </div>

      </div>

      <style jsx global>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>
    </div>
  )
}