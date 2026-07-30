// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, Users, DollarSign, TrendingUp, Sparkles, 
  Clock, BarChart, ArrowUpRight, RefreshCw, UserCheck,
  PlusCircle, Scissors, Crown, ArrowRight, Zap, CheckCircle2
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

      const hoy = new Date()
      const year = hoy.getFullYear()
      const month = String(hoy.getMonth() + 1).padStart(2, '0')
      const day = String(hoy.getDate()).padStart(2, '0')
      const hoyStr = `${year}-${month}-${day}`

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

      const citasHoy = appointments.filter((c: any) => c.date === hoyStr)
      const citasHoyCount = citasHoy.length

      const inicioSemanaStr = `${inicioSemana.getFullYear()}-${String(inicioSemana.getMonth() + 1).padStart(2, '0')}-${String(inicioSemana.getDate()).padStart(2, '0')}`
      const finSemanaStr = `${finSemana.getFullYear()}-${String(finSemana.getMonth() + 1).padStart(2, '0')}-${String(finSemana.getDate()).padStart(2, '0')}`

      const citasSemana = appointments.filter((c: any) => {
        if (!c.date) return false
        return c.date >= inicioSemanaStr && c.date <= finSemanaStr
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
        .filter((c: any) => {
          if (!c.date) return false
          if (c.status === 'cancelled') return false
          return c.date >= hoyStr
        })
        .sort((a: any, b: any) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date)
          return (a.time || '00:00').localeCompare(b.time || '00:00')
        })
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
        .slice(0, 4) // Ajustado a 4 para balancear visualmente la columna

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
      <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-500 ${isDark ? 'bg-[#1C120C]' : 'bg-[#FAF5F0]'}`}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className={`absolute inset-0 rounded-full border-2 ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
            <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#D4AF37] animate-spin" />
            <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-[#EC4899] animate-spin [animation-duration:2s]" />
          </div>
          <div className="text-center space-y-1">
            <p className={`text-[10px] tracking-[0.4em] uppercase font-bold ${isDark ? 'text-[#FFF9F6]/80' : 'text-[#1A0E0A]/80'}`}>
              Fresh Nails VIP
            </p>
            <p className={`text-[9px] tracking-[0.2em] font-light animate-pulse ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
              Orquestando su panel de control ejecutivo...
              </p>
          </div>
        </div>
      </div>
    )
  }

  if (!authorized) return null

  const currencySymbol = settings?.currency || '$'

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-12 relative overflow-hidden ${isDark ? 'bg-[#150D08] text-[#FFF9F6]' : 'bg-[#FDFBF9] text-[#1A0E0A]'}`}>
      
      {/* Fondos Decorativos Orgánicos de Lujo */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#EC4899]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[#3B82F6]/5 to-transparent rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none z-0 opacity-15 mix-blend-overlay bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 relative z-10 pt-4">

        {/* HEADER HERO BANNER */}
        <div className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ${
          isDark 
            ? 'bg-gradient-to-br from-[#271810] via-[#1E120C] to-[#160E09] border-[#3D281E] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]' 
            : 'bg-gradient-to-br from-white via-[#FBF7F4] to-[#F5ECE5] border-[#EADED5] shadow-[0_25px_50px_-15px_rgba(225,208,195,0.4)]'
        }`}>
          <div className="absolute -top-40 -right-40 w-[350px] h-[350px] bg-gradient-to-br from-[#EC4899]/20 to-[#D4AF37]/20 rounded-full blur-[90px] pointer-events-none animate-pulse [animation-duration:6s]" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

          <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37] via-[#EC4899] to-[#3B82F6] rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-4 rounded-2xl shadow-xl bg-neutral-950 text-white flex items-center justify-center border border-white/10">
                  <Crown className="w-7 h-7 text-[#D4AF37] animate-pulse" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[9px] font-black uppercase tracking-[0.25em] text-[#C9A96E]">
                  <Sparkles className="w-2.5 h-2.5" />
                  ✦ {settings?.business_name || 'Premium Nail Salón'}
                </div>
                <h2 className={`font-serif text-3xl md:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                  Panel <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#EC4899] to-[#C9A96E] font-serif italic font-normal">Executive</span>
                </h2>
                <p className={`text-sm font-light ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                  Control intuitivo, analíticas en tiempo real y gestión de tu comunidad exclusiva.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 border-t pt-5 md:pt-0 md:border-t-0 border-[#EADED5] dark:border-[#3D281E]">
              <button 
                onClick={handleRefresh} 
                disabled={refreshing} 
                className={`w-full sm:w-auto px-5 py-3 rounded-xl border font-bold text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2.5 transition-all duration-300 backdrop-blur-md shadow-xs active:scale-95 ${
                  isDark 
                    ? 'bg-[#1C120C]/80 border-[#3D281E] text-[#BCAEA5] hover:text-white hover:border-[#D4AF37]/50' 
                    : 'bg-white/80 border-[#EADED5] text-[#5C4A3E] hover:text-[#1A0E0A] hover:border-[#D4AF37]/50'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Sincronizando' : 'Actualizar'}</span>
              </button>

              <Link 
                href="/admin/agenda"
                className="w-full sm:w-auto px-5 py-3 rounded-xl text-neutral-950 font-black text-xs uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl shadow-[#D4AF37]/10 hover:shadow-[#D4AF37]/20 hover:scale-[1.03] active:scale-95 bg-gradient-to-r from-[#D4AF37] via-[#E8D5A0] to-[#C9A96E]"
              >
                <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Ver Agenda</span>
              </Link>
            </div>
          </div>
        </div>

        {/* TARJETAS DE MÉTRICAS PRINCIPALES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Citas de Hoy */}
          <div className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-500 hover:shadow-2xl ${
            isDark 
              ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#D4AF37]/50 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.6)]' 
              : 'bg-white border-[#EADED5] hover:border-[#D4AF37]/50 shadow-[0_15px_40px_-20px_rgba(225,208,195,0.5)]'
          }`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#D4AF37]/10 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Citas Agendadas</p>
                <p className={`text-[11px] font-bold tracking-wider px-2 py-0.5 rounded bg-[#D4AF37]/10 text-[#C9A96E] inline-block`}>HOY</p>
                <h4 className={`font-serif text-5xl font-black mt-2 tracking-tight ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>{stats.citasHoy}</h4>
                <div className="flex items-center gap-1.5 text-[11px] mt-2 font-medium text-[#C9A96E]">
                  <Zap className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                  <span>+{stats.citasSemana} planeadas esta semana</span>
                </div>
              </div>
              <div className={`p-4 rounded-xl border shrink-0 transition-transform duration-500 group-hover:scale-110 shadow-inner ${
                isDark ? 'bg-[#291A11] border-[#3D281E] text-[#D4AF37]' : 'bg-[#FAF6F2] border-[#EADED5] text-[#D4AF37]'
              }`}>
                <Calendar className="w-6 h-6 stroke-[1.75]" />
              </div>
            </div>
          </div>

          {/* Citas Pendientes */}
          <div className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-500 hover:shadow-2xl ${
            isDark 
              ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#EC4899]/50 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.6)]' 
              : 'bg-white border-[#EADED5] hover:border-[#EC4899]/50 shadow-[0_15px_40px_-20px_rgba(225,208,195,0.5)]'
          }`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#EC4899]/10 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Por Confirmar</p>
                <p className={`text-[11px] font-bold tracking-wider px-2 py-0.5 rounded bg-[#EC4899]/10 text-[#EC4899] inline-block`}>PENDIENTES</p>
                <h4 className={`font-serif text-5xl font-black mt-2 tracking-tight ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>{stats.pendientes}</h4>
                <p className={`text-[11px] mt-2 font-medium text-[#EC4899] flex items-center gap-1`}>
                  <Clock className="w-3 h-3 text-[#EC4899]" />
                  {stats.pendientes > 0 ? 'Requieren tu aprobación' : 'Todo al día y ordenado'}
                </p>
              </div>
              <div className={`p-4 rounded-xl border shrink-0 transition-transform duration-500 group-hover:scale-110 shadow-inner ${
                isDark ? 'bg-[#291A11] border-[#3D281E] text-[#EC4899]' : 'bg-[#FAF6F2] border-[#EADED5] text-[#EC4899]'
              }`}>
                <Clock className="w-6 h-6 stroke-[1.75]" />
              </div>
            </div>
          </div>

          {/* Ingresos del Día */}
          <div className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-500 hover:shadow-2xl ${
            isDark 
              ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#3B82F6]/50 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.6)]' 
              : 'bg-white border-[#EADED5] hover:border-[#3B82F6]/50 shadow-[0_15px_40px_-20px_rgba(225,208,195,0.5)]'
          }`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#3B82F6]/10 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Flujo de Caja</p>
                <p className={`text-[11px] font-bold tracking-wider px-2 py-0.5 rounded bg-[#3B82F6]/10 text-[#3B82F6] inline-block`}>INGRESOS TOTALES</p>
                <h4 className="font-serif text-4xl font-black mt-2 tracking-tight text-[#3B82F6]">
                  {currencySymbol}{stats.ingresos.toLocaleString()}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] mt-3 font-medium text-[#3B82F6]">
                  <TrendingUp className="w-3 h-3 text-[#3B82F6]" />
                  <span>Facturación acumulada registrada</span>
                </div>
              </div>
              <div className={`p-4 rounded-xl border shrink-0 transition-transform duration-500 group-hover:scale-110 shadow-inner ${
                isDark ? 'bg-[#291A11] border-[#3D281E] text-[#3B82F6]' : 'bg-[#FAF6F2] border-[#EADED5] text-[#3B82F6]'
              }`}>
                <DollarSign className="w-6 h-6 stroke-[1.75]" />
              </div>
            </div>
          </div>
        </div>

        {/* SECCIONES COMPLEJAS: CITAS PRÓXIMAS Y TOP SERVICIOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Ficha de Citas Próximas */}
          <div className={`lg:col-span-2 rounded-2xl border p-6 md:p-7 shadow-sm transition-all duration-300 ${
            isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'
          }`}>
            <div className="flex items-center justify-between mb-6 border-b pb-4 border-[#EADED5]/50 dark:border-[#3D281E]/50">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-[#291A11] text-[#D4AF37]' : 'bg-[#FAF6F2] text-[#D4AF37]'}`}>
                  <Clock className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className={`font-serif text-xl font-bold ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                    Cronograma de <span className="text-[#C9A96E] font-serif italic font-normal">Próximas Citas</span>
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Próximos turnos reservados en el salón</p>
                </div>
              </div>
              
              <Link 
                href="/admin/agenda" 
                className={`text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 ${
                  isDark ? 'text-[#BCAEA5] bg-[#291A11] hover:text-[#D4AF37]' : 'text-[#6E5A4D] bg-[#FAF6F2] hover:text-[#D4AF37]'
                }`}
              >
                <span>Ver todo</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#D4AF37]" />
              </Link>
            </div>

            {stats.citasProximas.length === 0 ? (
              <div className={`text-center py-12 border border-dashed rounded-2xl flex flex-col items-center justify-center ${
                isDark ? 'border-[#3D281E] bg-[#170E09]/40' : 'border-[#EADED5] bg-[#FAF8F5]/50'
              }`}>
                <Calendar className="w-10 h-10 mb-3 text-[#BCAEA5]/60 stroke-[1.25]" />
                <p className={`text-sm font-medium ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>No hay citas programadas a futuro</p>
                <p className="text-[11px] text-[#A89588] font-light mt-0.5">¡Buen momento para promocionar turnos libres!</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {stats.citasProximas.map((cita, idx) => {
                  const hoy = new Date()
                  hoy.setHours(0, 0, 0, 0)
                  const citaDate = new Date(cita.date)
                  citaDate.setHours(0, 0, 0, 0)

                  const diffDias = Math.ceil((citaDate.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
                  let label = `En ${diffDias} días`
                  let badgeStyles = isDark ? 'bg-neutral-900 border-neutral-800 text-[#BCAEA5]' : 'bg-neutral-50 border-neutral-200 text-[#6E5A4D]'

                  if (diffDias === 0) { 
                    label = 'Hoy'; 
                    badgeStyles = 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#C9A96E] font-bold animate-pulse' 
                  } else if (diffDias === 1) { 
                    label = 'Mañana'; 
                    badgeStyles = 'bg-[#EC4899]/10 border-[#EC4899]/30 text-[#EC4899] font-bold' 
                  }

                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 hover:scale-[1.01] ${
                        isDark 
                          ? 'border-[#3D281E] bg-[#170E09] hover:border-[#D4AF37]/40 shadow-xs' 
                          : 'border-[#EADED5] bg-[#FAF8F5] hover:border-[#D4AF37]/40 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Calendario Icono Miniatura */}
                        <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center text-center shadow-xs border border-[#D4AF37]/20 bg-neutral-950 text-white shrink-0">
                          <span className="text-[9px] uppercase font-black tracking-widest text-[#D4AF37] leading-none">
                            {new Date(cita.date).toLocaleDateString('es-ES', { month: 'short' }).slice(0,3)}
                          </span>
                          <span className="text-sm font-black font-serif leading-none mt-0.5">
                            {new Date(cita.date).getDate() + 1}
                          </span>
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                            {cita.clienteNombre}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="font-semibold text-[#C9A96E] truncate">{cita.servicioNombre}</span>
                            <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-stone-700' : 'bg-stone-300'}`} />
                            <span className={`font-mono text-[11px] font-bold px-1.5 rounded bg-black/5 dark:bg-white/5 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                              {cita.time?.slice(0,5) || '--:--'} hs
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeStyles}`}>
                              {label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-3 pl-2 border-l border-dashed border-[#EADED5]/60 dark:border-[#3D281E]/60">
                        <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-[#A89588]' : 'text-[#9C8A7E]'}`}>Total</p>
                        <span className="text-base font-serif font-black text-[#C9A96E]">
                          {currencySymbol}{cita.precio?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Gráfico y Ficha de Top Servicios */}
          <div className={`rounded-2xl border p-6 shadow-sm transition-all duration-300 flex flex-col justify-between ${
            isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'
          }`}>
            <div>
              <div className="flex items-center gap-3 mb-6 border-b pb-4 border-[#EADED5]/50 dark:border-[#3D281E]/50">
                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-[#291A11] text-[#D4AF37]' : 'bg-[#FAF6F2] text-[#D4AF37]'}`}>
                  <BarChart className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className={`font-serif text-xl font-bold ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                    Top <span className="text-[#C9A96E] font-serif italic font-normal">Servicios</span>
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Los tratamientos más solicitados</p>
                </div>
              </div>

              {stats.serviciosTop.length === 0 ? (
                <div className={`text-center py-12 border border-dashed rounded-xl ${isDark ? 'border-[#3D281E]' : 'border-[#EADED5]'}`}>
                  <Scissors className="w-10 h-10 mx-auto mb-2 text-[#BCAEA5]/60 stroke-[1.25]" />
                  <p className={`text-sm font-medium ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Sin registros comerciales aún</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.serviciosTop.map((serv, idx) => {
                    const maxCount = stats.serviciosTop[0]?.count || 1
                    const porcentaje = Math.round((serv.count / maxCount) * 100)
                    
                    // Colores temáticos cálidos y distinguidos
                    const gradientBars = [
                      'from-[#D4AF37] to-[#E8D5A0]', 
                      'from-[#EC4899] to-[#F472B6]', 
                      'from-[#3B82F6] to-[#60A5FA]',
                      'from-[#8B5CF6] to-[#A78BFA]'
                    ]

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shadow-xs bg-neutral-950 text-[#D4AF37] border border-white/10`}>
                              {idx + 1}
                            </span>
                            <span className={`text-xs font-bold truncate ${isDark ? 'text-stone-100' : 'text-[#1A0E0A]'}`}>
                              {serv.nombre}
                            </span>
                          </div>
                          <span className={`text-[11px] font-mono font-black px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#5C4A3E]'}`}>
                            {serv.count} servicios
                          </span>
                        </div>
                        {/* Barra de progreso fluida */}
                        <div className={`w-full rounded-full h-2 overflow-hidden p-[1px] ${isDark ? 'bg-[#2A1A11]' : 'bg-[#F2E6DD]'}`}>
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r shadow-xs transition-all duration-1000 ${gradientBars[idx % 4]}`} 
                            style={{ width: `${porcentaje}%` }} 
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className={`mt-6 p-3 rounded-xl border border-dashed flex items-center gap-2.5 text-[11px] font-medium ${
              isDark ? 'bg-[#170E09]/50 border-[#3D281E] text-[#BCAEA5]' : 'bg-[#FAF8F5]/60 border-[#EADED5] text-[#6E5A4D]'
            }`}>
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>Estadísticas calculadas basándose en el historial de citas.</span>
            </div>
          </div>
        </div>

        {/* BOTONERÍA / ACCIONES RÁPIDAS EXCLUSIVAS */}
        <div className="space-y-3">
          <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] font-mono ${isDark ? 'text-[#A89588]' : 'text-[#6E5A4D]'}`}>
            Módulos Rápidos de Gestión
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Cita Nueva */}
            <Link 
              href="/admin/agenda" 
              className={`group relative overflow-hidden rounded-2xl border p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isDark ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#D4AF37]/50 shadow-sm' : 'bg-white border-[#EADED5] hover:border-[#D4AF37]/50 shadow-xs'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 shadow-sm ${
                isDark ? 'bg-[#291A11] text-[#D4AF37]' : 'bg-[#FAF6F2] text-[#D4AF37]'
              }`}>
                <PlusCircle className="w-5 h-5 stroke-[1.75]" />
              </div>
              <p className={`text-xs font-bold tracking-wide ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>Agendar Turno</p>
              <p className={`text-[10px] font-medium mt-0.5 opacity-60 flex items-center justify-center gap-0.5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                <span>Nueva cita</span> <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
              </p>
            </Link>

            {/* Ficha Clientes */}
            <Link 
              href="/admin/clientes" 
              className={`group relative overflow-hidden rounded-2xl border p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isDark ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#EC4899]/50 shadow-sm' : 'bg-white border-[#EADED5] hover:border-[#EC4899]/50 shadow-xs'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 shadow-sm ${
                isDark ? 'bg-[#291A11] text-[#EC4899]' : 'bg-[#FAF6F2] text-[#EC4899]'
              }`}>
                <Users className="w-5 h-5 stroke-[1.75]" />
              </div>
              <p className={`text-xs font-bold tracking-wide ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>Comunidad VIP</p>
              <p className={`text-[10px] font-medium mt-0.5 opacity-60 flex items-center justify-center gap-0.5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                <span>{stats.clientas} Clientes</span> <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
              </p>
            </Link>

            {/* Ficha Servicios */}
            <Link 
              href="/admin/servicios" 
              className={`group relative overflow-hidden rounded-2xl border p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isDark ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#3B82F6]/50 shadow-sm' : 'bg-white border-[#EADED5] hover:border-[#3B82F6]/50 shadow-xs'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 shadow-sm ${
                isDark ? 'bg-[#291A11] text-[#3B82F6]' : 'bg-[#FAF6F2] text-[#3B82F6]'
              }`}>
                <Scissors className="w-5 h-5 stroke-[1.75]" />
              </div>
              <p className={`text-xs font-bold tracking-wide ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>Menú de Catálogo</p>
              <p className={`text-[10px] font-medium mt-0.5 opacity-60 flex items-center justify-center gap-0.5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                <span>Servicios</span> <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
              </p>
            </Link>

            {/* Ficha Staff */}
            <Link 
              href="/admin/staff" 
              className={`group relative overflow-hidden rounded-2xl border p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isDark ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#D4AF37]/50 shadow-sm' : 'bg-white border-[#EADED5] hover:border-[#D4AF37]/50 shadow-xs'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 shadow-sm ${
                isDark ? 'bg-[#291A11] text-[#D4AF37]' : 'bg-[#FAF6F2] text-[#D4AF37]'
              }`}>
                <UserCheck className="w-5 h-5 stroke-[1.75]" />
              </div>
              <p className={`text-xs font-bold tracking-wide ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>Equipo de Staff</p>
              <p className={`text-[10px] font-medium mt-0.5 opacity-60 flex items-center justify-center gap-0.5 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                <span>Especialistas</span> <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
              </p>
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
