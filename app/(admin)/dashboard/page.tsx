// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, Users, DollarSign, TrendingUp, Sparkles, 
  Clock, BarChart, ArrowUp, RefreshCw, UserCheck,
  PlusCircle, CheckCircle2, Loader2, AlertCircle,
  Scissors, Eye, Crown, Star, Zap
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, tenantId, role, loading: authLoading } = useAuth()
  const { settings, loading: settingsLoading } = useSettings()
  const router = useRouter()
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

  const isDark = true // Se adaptará con el tema

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
      console.error('Error verificando admin:', error)
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="absolute w-64 h-64 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute w-48 h-48 bg-amber-500/5 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite] delay-300" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
            <Sparkles className="w-6 h-6 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-sm font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 animate-pulse">
              ABRIENDO EL SALÓN
            </p>
            <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              FRESH BEAUTY STUDIO
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

  if (!authorized) return null

  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'
  
  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
  }

  // Saludo según hora
  const hour = new Date().getHours()
  let saludo = 'Buenos días'
  let emoji = '🌅'
  if (hour >= 12 && hour < 18) { saludo = 'Buenas tardes'; emoji = '☀️' }
  else if (hour >= 18) { saludo = 'Buenas noches'; emoji = '🌙' }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 pb-12 antialiased transition-colors duration-700">
      
      {/* ============================================================ */}
      {/* 👑 HEADER — BIENVENIDA */}
      {/* ============================================================ */}
      <div className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 shadow-2xl ${
        true 
          ? 'bg-gradient-to-br from-zinc-950 via-zinc-900/80 to-black border-zinc-900/60 shadow-[0_20px_60px_rgba(0,0,0,0.6)]' 
          : 'bg-gradient-to-br from-rose-50/90 via-pink-50/80 to-amber-50/70 border-pink-200/50'
      }`}>
        
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none animate-[pulse_10s_ease-in-out_infinite] delay-1000" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full backdrop-blur-xl border border-white/10 bg-white/5">
              <span className="text-lg">{emoji}</span>
              <span className="text-[9px] uppercase tracking-[0.2em] font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-rose-300 to-amber-300">
                {saludo}, {user?.email?.split('@')[0] || 'Admin'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              <span className="font-serif italic font-light text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-rose-300 to-amber-200">
                Panel de Control
              </span>
              <span className="text-white/60 text-sm font-light ml-3">• {settings?.business_name || 'Fresh Beauty'}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className={`inline-flex items-center gap-2 text-[8px] font-black tracking-[0.2em] uppercase px-4 py-2 rounded-xl transition-all duration-300 active:scale-95 border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white group relative overflow-hidden`}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'} transition-all duration-500 text-pink-400/70`} />
              <span className="relative">{refreshing ? '...' : 'Actualizar'}</span>
            </button>

            <Link 
              href="/admin/agenda"
              className="group relative overflow-hidden px-5 py-2 rounded-xl font-black text-[9px] tracking-[0.2em] uppercase flex items-center gap-2 text-white border border-pink-400/20 shadow-[0_15px_40px_rgba(219,91,154,0.25)] hover:shadow-[0_20px_50px_rgba(219,91,154,0.4)]"
              style={brandGradient}
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
              <Calendar className="w-3.5 h-3.5" />
              <span className="relative">Ver Agenda</span>
            </Link>
          </div>
        </div>

        <div className="absolute bottom-2 right-6 opacity-[0.04] text-[6px] font-black tracking-[0.3em] text-white select-none pointer-events-none">
          ✦ FRESH BEAUTY STUDIO ✦
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📊 MÉTRICAS PRINCIPALES — 3 CARDS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: Citas Hoy */}
        <div className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br from-zinc-950/80 to-zinc-900/50 border-zinc-900/60 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Citas Hoy</p>
              <p className="text-4xl font-black text-white mt-1">{stats.citasHoy}</p>
              <p className="text-[10px] text-emerald-400 font-medium mt-0.5">+{stats.citasSemana} esta semana</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/20 text-pink-400 group-hover:scale-110 transition-transform duration-500">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 2: Pendientes */}
        <div className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br from-zinc-950/80 to-zinc-900/50 border-zinc-900/60 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Pendientes</p>
              <p className="text-4xl font-black text-white mt-1">{stats.pendientes}</p>
              <p className="text-[10px] text-amber-400 font-medium mt-0.5">Requieren atención</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform duration-500">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 3: Ingresos */}
        <div className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br from-zinc-950/80 to-zinc-900/50 border-zinc-900/60 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Ingresos</p>
              <p className="text-4xl font-black text-white mt-1">{settings?.currency || '$'}{stats.ingresos.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-400 font-medium mt-0.5">Hoy</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform duration-500">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📋 PRÓXIMAS CITAS + SERVICIOS TOP */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bloque: Próximas Citas */}
        <div className="lg:col-span-2 rounded-2xl border p-6 transition-all duration-500 shadow-xl bg-zinc-950/60 border-zinc-900/60 shadow-black/40">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-pink-500/10">
                <Clock className="w-4 h-4 text-pink-400" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight text-white">Próximas <span className="font-serif italic font-normal text-pink-400">Citas</span></h3>
                <p className="text-[9px] text-zinc-400">Las próximas 4 citas</p>
              </div>
            </div>
            <Link 
              href="/admin/agenda" 
              className="text-[9px] font-black uppercase tracking-wider text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1"
            >
              Ver todas <ArrowUp className="w-3 h-3 rotate-45" />
            </Link>
          </div>

          {stats.citasProximas.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl">
              <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">No hay citas próximas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.citasProximas.map((cita, idx) => {
                const hoy = new Date()
                const citaDate = new Date(cita.date)
                const diffDias = Math.ceil((citaDate.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
                let label = `En ${diffDias} d`
                let color = 'text-zinc-400'
                if (diffDias === 0) { label = 'Hoy'; color = 'text-rose-400' }
                else if (diffDias === 1) { label = 'Mañana'; color = 'text-amber-400' }

                return (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-900/60 bg-zinc-900/20 hover:border-pink-500/30 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm bg-gradient-to-br from-pink-500 to-rose-500`}>
                        {citaDate.getDate()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{cita.clienteNombre}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-medium text-pink-400 truncate">{cita.servicioNombre}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-600" />
                          <span className="text-[10px] font-mono text-zinc-400">{cita.time?.slice(0,5) || '--:--'}</span>
                          <span className={`text-[8px] font-black uppercase tracking-wider ${color}`}>{label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="text-xs font-bold text-emerald-400">{settings?.currency || '$'}{cita.precio?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Bloque: Servicios Top */}
        <div className="rounded-2xl border p-6 transition-all duration-500 shadow-xl bg-zinc-950/60 border-zinc-900/60 shadow-black/40">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white">Top <span className="font-serif italic font-normal text-amber-400">Servicios</span></h3>
              <p className="text-[9px] text-zinc-400">Los más solicitados</p>
            </div>
          </div>

          {stats.serviciosTop.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl">
              <BarChart className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Sin datos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.serviciosTop.map((serv, idx) => {
                const maxCount = stats.serviciosTop[0]?.count || 1
                const porcentaje = Math.round((serv.count / maxCount) * 100)
                const colors = ['from-pink-500 to-rose-500', 'from-amber-500 to-orange-500', 'from-violet-500 to-purple-500']

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[8px] font-black text-white bg-gradient-to-r ${colors[idx] || 'from-pink-500 to-rose-500'}`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-white truncate">{serv.nombre}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-zinc-400">{serv.count}x</span>
                    </div>
                    <div className="w-full bg-zinc-800/50 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${colors[idx] || 'from-pink-500 to-rose-500'}`} 
                        style={{ width: `${porcentaje}%` }} 
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 🔧 ACCIONES RÁPIDAS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link 
          href="/admin/agenda"
          className="group relative overflow-hidden rounded-2xl border p-4 text-center transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl bg-zinc-950/60 border-zinc-900/60 shadow-black/20 hover:border-pink-500/30"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-500">
              <PlusCircle className="w-5 h-5 text-pink-400" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider text-white">Nueva Cita</p>
          </div>
        </Link>

        <Link 
          href="/admin/cliente"
          className="group relative overflow-hidden rounded-2xl border p-4 text-center transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl bg-zinc-950/60 border-zinc-900/60 shadow-black/20 hover:border-violet-500/30"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-500">
              <Users className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider text-white">Clientes</p>
          </div>
        </Link>

        <Link 
          href="/admin/servicios"
          className="group relative overflow-hidden rounded-2xl border p-4 text-center transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl bg-zinc-950/60 border-zinc-900/60 shadow-black/20 hover:border-emerald-500/30"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-500">
              <Scissors className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider text-white">Servicios</p>
          </div>
        </Link>

        <Link 
          href="/admin/staff"
          className="group relative overflow-hidden rounded-2xl border p-4 text-center transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl bg-zinc-950/60 border-zinc-900/60 shadow-black/20 hover:border-amber-500/30"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-500">
              <UserCheck className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider text-white">Staff</p>
          </div>
        </Link>
      </div>

      {/* ============================================================ */}
      {/* STYLES GLOBALES */}
      {/* ============================================================ */}
      <style jsx global>{`
        @keyframes shine {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .animate-shine {
          animation: shine 1.5s ease-in-out infinite;
        }
      `}</style>

    </div>
  )
}