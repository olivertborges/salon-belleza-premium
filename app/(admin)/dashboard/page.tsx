// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, Users, DollarSign, TrendingUp, Sparkles, 
  Clock, BarChart, ArrowUp, RefreshCw, UserCheck,
  PlusCircle, Scissors
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="absolute w-64 h-64 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute w-48 h-48 bg-amber-500/5 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite] delay-300" />
        <div className={`relative flex flex-col items-center justify-center gap-5 backdrop-blur-2xl px-12 py-10 rounded-3xl border shadow-2xl ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-pink-200/50'
        }`}>
          <div className="relative">
            <div className={`w-16 h-16 rounded-full border-2 animate-spin ${
              isDark ? 'border-pink-500/20 border-t-pink-500' : 'border-pink-300/50 border-t-pink-500'
            }`} />
            <Sparkles className={`w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse ${
              isDark ? 'text-pink-400' : 'text-pink-500'
            }`} />
          </div>
          <div className="space-y-1.5 text-center">
            <p className={`text-sm font-black tracking-[0.15em] animate-pulse ${
              isDark 
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400' 
                : 'text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600'
            }`}>
              ABRIENDO EL SALÓN
            </p>
            <p className={`text-[10px] font-medium tracking-[0.3em] ${
              isDark ? 'text-zinc-500' : 'text-stone-400'
            }`}>
              FRESH BEAUTY STUDIO
            </p>
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

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* 👑 HEADER — BIENVENIDA */}
      <div className={`relative overflow-hidden rounded-3xl p-[1px] shadow-xl transition-all duration-700 ${
        isDark 
          ? 'bg-gradient-to-br from-zinc-950 via-zinc-900/80 to-black border-zinc-900/60' 
          : 'bg-gradient-to-br from-rose-50/90 via-pink-50/80 to-amber-50/70 border-pink-200/50'
      }`}>
        <div className="absolute inset-0 opacity-20 animate-pulse" style={brandGradient} />
        <div className={`relative z-10 rounded-[23px] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark ? 'bg-[#0f0c1b]' : 'bg-white'
        }`}>
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3.5 rounded-2xl text-white shadow-md shrink-0" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}>
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] uppercase tracking-widest font-bold font-mono truncate ${
                isDark ? 'text-pink-400' : 'text-pink-500'
              }`}>
                ✨ {settings?.business_name || 'Salón VIP'}
              </p>
              <h2 className={`text-xl md:text-2xl font-serif font-extrabold mt-0.5 truncate ${
                isDark ? 'text-white' : 'text-stone-900'
              }`}>
                Panel Ejecutivo
              </h2>
              <p className={`text-xs mt-0.5 truncate ${
                isDark ? 'text-pink-100/60' : 'text-stone-500'
              }`}>
                Control absoluto de tus citas, ingresos y comunidad VIP.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto justify-end">
            <button 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className={`px-3 py-2 rounded-xl border hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0 ${
                isDark 
                  ? 'bg-fuchsia-950/40 border-fuchsia-900/40 text-pink-400' 
                  : 'bg-pink-50 border-pink-100/60 text-pink-600'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Sincronizando...' : 'Actualizar'}</span>
            </button>

            <Link 
              href="/admin/agenda"
              className="px-3 py-2 rounded-xl text-white hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
              style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Agenda</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 📊 MÉTRICAS PRINCIPALES — 3 CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl shadow-lg ${
          isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
        }`}>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Citas Hoy</p>
              <p className={`text-4xl font-black mt-1 ${isDark ? 'text-pink-100' : 'text-stone-800'}`}>{stats.citasHoy}</p>
              <p className="text-[10px] text-emerald-500 font-medium mt-0.5">+{stats.citasSemana} esta semana</p>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-100/50 text-pink-600'}`}>
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl shadow-lg ${
          isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
        }`}>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Pendientes</p>
              <p className={`text-4xl font-black mt-1 ${isDark ? 'text-pink-100' : 'text-stone-800'}`}>{stats.pendientes}</p>
              <p className="text-[10px] text-amber-500 font-medium mt-0.5">Requieren atención</p>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100/50 text-amber-600'}`}>
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl shadow-lg ${
          isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
        }`}>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Ingresos</p>
              <p className={`text-4xl font-black mt-1 ${isDark ? 'text-pink-100' : 'text-stone-800'}`}>{settings?.currency || '$'}{stats.ingresos.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-500 font-medium mt-0.5">Hoy</p>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100/50 text-emerald-600'}`}>
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* 📋 PRÓXIMAS CITAS + SERVICIOS TOP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 rounded-2xl border p-6 shadow-xl ${
          isDark ? 'bg-[#130f24] border-fuchsia-950/50' : 'bg-white border-pink-100/60'
        }`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-pink-500/10' : 'bg-pink-100/50'}`}>
                <Clock className={`w-4 h-4 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
              </div>
              <div>
                <h3 className={`text-sm font-black tracking-tight ${isDark ? 'text-pink-100' : 'text-stone-800'}`}>
                  Próximas <span className="font-serif italic font-normal text-pink-500">Citas</span>
                </h3>
              </div>
            </div>
            <Link href="/admin/agenda" className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>
              Ver todas <ArrowUp className="w-3 h-3 rotate-45" />
            </Link>
          </div>

          {stats.citasProximas.length === 0 ? (
            <div className={`text-center py-10 border border-dashed rounded-xl ${isDark ? 'border-fuchsia-950/50' : 'border-pink-100/60'}`}>
              <Calendar className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              <p className="text-xs text-stone-400">No hay citas próximas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.citasProximas.map((cita, idx) => {
                const hoy = new Date()
                const citaDate = new Date(cita.date)
                const diffDias = Math.ceil((citaDate.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
                let label = `En ${diffDias} d`
                let color = 'text-stone-400'
                if (diffDias === 0) { label = 'Hoy'; color = 'text-rose-500' }
                else if (diffDias === 1) { label = 'Mañana'; color = 'text-amber-500' }

                return (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${
                    isDark ? 'border-fuchsia-950/50 bg-[#0f0c1b]' : 'border-pink-100/60 bg-pink-50/20'
                  }`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-pink-500 to-rose-500">
                        {citaDate.getDate()}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${isDark ? 'text-pink-100' : 'text-stone-800'}`}>{cita.clienteNombre}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-medium text-pink-500 truncate">{cita.servicioNombre}</span>
                          <span className="text-[10px] font-mono text-stone-400">{cita.time?.slice(0,5) || '--:--'}</span>
                          <span className={`text-[8px] font-black uppercase tracking-wider ${color}`}>{label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="text-xs font-bold text-emerald-500">{settings?.currency || '$'}{cita.precio?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className={`rounded-2xl border p-6 shadow-xl ${
          isDark ? 'bg-[#130f24] border-fuchsia-950/50' : 'bg-white border-pink-100/60'
        }`}>
          <div className="flex items-center gap-3 mb-5">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-100/50'}`}>
              <TrendingUp className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            </div>
            <div>
              <h3 className={`text-sm font-black tracking-tight ${isDark ? 'text-pink-100' : 'text-stone-800'}`}>
                Top <span className="font-serif italic font-normal text-amber-500">Servicios</span>
              </h3>
            </div>
          </div>

          {stats.serviciosTop.length === 0 ? (
            <div className={`text-center py-10 border border-dashed rounded-xl ${isDark ? 'border-fuchsia-950/50' : 'border-pink-100/60'}`}>
              <BarChart className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              <p className="text-xs text-stone-400">Sin datos</p>
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
                        <span className={`text-xs font-bold truncate ${isDark ? 'text-pink-100' : 'text-stone-800'}`}>{serv.nombre}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-stone-400">{serv.count}x</span>
                    </div>
                    <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-fuchsia-950/50' : 'bg-pink-100/30'}`}>
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

      {/* 🔧 ACCIONES RÁPIDAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/admin/agenda" className={`group relative overflow-hidden rounded-2xl border p-4 text-center shadow-lg ${
          isDark ? 'bg-[#130f24] border-fuchsia-950 shadow-black/20' : 'bg-white border-pink-100/60 shadow-pink-200/20'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${isDark ? 'bg-pink-500/10' : 'bg-pink-100/50'}`}>
            <PlusCircle className={`w-5 h-5 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
          </div>
          <p className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-pink-100' : 'text-stone-800'}`}>Nueva Cita</p>
        </Link>

        <Link href="/admin/cliente" className={`group relative overflow-hidden rounded-2xl border p-4 text-center shadow-lg ${
          isDark ? 'bg-[#130f24] border-fuchsia-950 shadow-black/20' : 'bg-white border-pink-100/60 shadow-pink-200/20'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${isDark ? 'bg-violet-500/10' : 'bg-violet-100/50'}`}>
            <Users className={`w-5 h-5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
          </div>
          <p className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-pink-100' : 'text-stone-800'}`}>Clientes</p>
        </Link>

        <Link href="/admin/servicios" className={`group relative overflow-hidden rounded-2xl border p-4 text-center shadow-lg ${
          isDark ? 'bg-[#130f24] border-fuchsia-950 shadow-black/20' : 'bg-white border-pink-100/60 shadow-pink-200/20'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-100/50'}`}>
            <Scissors className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </div>
          <p className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-pink-100' : 'text-stone-800'}`}>Servicios</p>
        </Link>

        <Link href="/admin/staff" className={`group relative overflow-hidden rounded-2xl border p-4 text-center shadow-lg ${
          isDark ? 'bg-[#130f24] border-fuchsia-950 shadow-black/20' : 'bg-white border-pink-100/60 shadow-pink-200/20'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${isDark ? 'bg-amber-500/10' : 'bg-amber-100/50'}`}>
            <UserCheck className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
          <p className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-pink-100' : 'text-stone-800'}`}>Staff</p>
        </Link>
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  )
}
