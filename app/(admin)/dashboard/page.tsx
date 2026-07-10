'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, Users, DollarSign, Gem, TrendingUp, Sparkles, 
  Activity, Zap, Target, Crown, Clock, BarChart, ArrowUp,
  Download, AlertCircle, XCircle, PiggyBank, RefreshCw, Award, UserCheck
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
    puntos: 0,
    ocupacion: 0,
    ticketPromedio: 0,
    citasProximas: [] as any[],
    serviciosTop: [] as any[],
    citasHoyList: [] as any[],
    pendientes: 0,
    confirmadas: 0,
    completadas: 0,
    canceladas: 0,
    tasaOcupacion: 0,
    crecimiento: 0,
  })

  useEffect(() => {
    setAuthorized(true);
    cargarEstadisticas();
  }, [user, role, authLoading]);

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

      const ingresosMes = citasConPrecio
        .filter((a: any) => {
          if (!a.date) return false
          const aDate = new Date(a.date)
          const currDate = new Date()
          return aDate.getMonth() === currDate.getMonth() && aDate.getFullYear() === currDate.getFullYear()
        })
        .reduce((sum: number, a: any) => sum + Number(a.total_price || a.price || 0), 0)

      const puntos = clients.reduce((sum: number, c: any) => sum + (c.points || 0), 0)
      const ticketPromedio = totalClientas > 0 ? Math.round(totalIngresos / totalClientas) : 0
      const ocupacion = Math.min(100, Math.round((appointments.length / 50) * 100))

      const pendientes = appointments.filter((c: any) => c.status === 'pending').length
      const confirmadas = appointments.filter((c: any) => c.status === 'confirmed').length
      const completadas = appointments.filter((c: any) => c.status === 'completed').length
      const canceladas = appointments.filter((c: any) => c.status === 'cancelled').length

      const tasaOcupacion = appointments.length > 0 ? Math.round((completadas / appointments.length) * 100) : 0
      const crecimiento = totalClientas > 0 ? Math.round((clientasNuevas / totalClientas) * 100) : 0

      const proximas = appointments
        .filter((c: any) => c.date && new Date(c.date) > new Date() && c.status !== 'cancelled')
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3)

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

      const citasHoyList = citasHoy.slice(0, 3).map((cita: any) => {
        const cliente = clients.find((c: any) => c.id === cita.client_id)
        const servicio = services.find((s: any) => s.id === cita.service_id)
        return { ...cita, clienteNombre: cliente?.name || 'Cliente', servicioNombre: servicio?.name || 'Servicio' }
      })

      const servicioCount: Record<string, number> = {}
      appointments.forEach((c: any) => {
        if (c.service_id) servicioCount[c.service_id] = (servicioCount[c.service_id] || 0) + 1
      })

      const serviciosTop = Object.entries(servicioCount)
        .map(([id, count]) => {
          const servicio = services.find((s: any) => String(s.id) === String(id))
          return { nombre: servicio?.name || 'Servicio', count, price: servicio?.price || 0, duration: servicio?.duration || 0 }
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)

      setStats({
        citasHoy: citasHoyCount, citasSemana, clientas: totalClientas, clientasNuevas,
        ingresos: totalIngresos, ingresosMes, puntos, ocupacion, ticketPromedio,
        citasProximas, serviciosTop, citasHoyList, pendientes, confirmadas,
        completadas, canceladas, tasaOcupacion, crecimiento,
      })
    } catch (error) {
      console.error("Error al procesar las estadísticas del dashboard:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (authorized) {
      const interval = setInterval(() => cargarEstadisticas(), 60000)
      return () => clearInterval(interval)
    }
  }, [authorized])

  const handleRefresh = () => {
    setRefreshing(true)
    cargarEstadisticas()
  }

  const handleExportReport = () => {
    alert('📊 Reporte generado en consola')
  }

  if ((!authorized && loading) || settingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: settings?.primary_color || '#DB5B9A' }}></div>
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse" style={{ color: settings?.primary_color || '#DB5B9A' }}>Abriendo el Salón...</p>
      </div>
    )
  }

  if (!authorized) return null

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

  return (
    <div className="space-y-6 p-1 max-w-full overflow-x-hidden">

      {/* BIENVENIDA CON GLOW Y DEGRADADO CONFIGURABLE */}
      <div className="relative overflow-hidden rounded-3xl p-[1px] shadow-xl" style={brandGradient}>
        <div className="absolute inset-0 opacity-20 animate-pulse" style={brandGradient} />
        <div className="relative z-10 rounded-[23px] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0f0c1b]">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3.5 rounded-2xl text-white shadow-md shrink-0" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}>
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold font-mono truncate" style={{ color: settings?.primary_color || '#DB5B9A' }}>✨ {settings?.business_name || 'Salón VIP'}</p>
              <h2 className="text-xl md:text-2xl font-serif font-extrabold text-stone-900 dark:text-white mt-0.5 truncate">
                Panel Ejecutivo con Brillo
              </h2>
              <p className="text-xs text-stone-500 dark:text-pink-100/60 mt-0.5 truncate">Control absoluto de tus citas, ingresos y comunidad VIP.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto justify-end">
            <button onClick={handleRefresh} disabled={refreshing} className="px-3 py-2 rounded-xl bg-pink-50 dark:bg-fuchsia-950/40 border border-pink-100/60 dark:border-fuchsia-900/40 hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0" style={{ color: settings?.primary_color || '#DB5B9A' }}>
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Sincronizando...' : 'Actualizar'}</span>
              <span className="sm:hidden">{refreshing ? '...' : 'Act.'}</span>
            </button>
            <button onClick={handleExportReport} className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0">
              <Download className="w-3.5 h-3.5" />
              <span>Reporte</span>
            </button>
          </div>
        </div>
      </div>

      {/* COMPONENTES DE ESTADO DINÁMICOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.pendientes > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 animate-bounce"><AlertCircle className="w-4 h-4" /></div>
            <p className="text-xs text-stone-700 dark:text-amber-300 font-medium min-w-0">
              ¡Tienes <span className="text-amber-600 dark:text-amber-400 font-bold underline decoration-2">{stats.pendientes}</span> citas esperando tu confirmación hoy!
            </p>
          </div>
        )}
        {stats.canceladas > 0 && (
          <div className="bg-gradient-to-r from-rose-500/10 to-pink-500/5 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0"><XCircle className="w-4 h-4" /></div>
            <p className="text-xs text-stone-700 dark:text-rose-400 font-medium min-w-0">
              Hay <span className="font-bold">{stats.canceladas}</span> cancelaciones procesadas en el registro general.
            </p>
          </div>
        )}
      </div>

      {/* MÉTRICAS COMPLETAMENTE RESPONSIVAS (MÓVIL EN 1 COLUMNA, MEDIANO EN 2, ESCRITORIO EN 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: CITAS HOY */}
        <div className="rounded-2xl p-4 shadow-sm hover:-translate-y-1 transition-all group relative overflow-hidden border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 min-w-0">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-pink-500/5 to-transparent rounded-bl-full" />
          <div className="flex items-center justify-between gap-2">
            <div className="p-3 rounded-xl text-white shadow-md group-hover:scale-110 transition-transform shrink-0" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}>
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-right min-w-0">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-pink-100 block truncate">{stats.citasHoy}</span>
              <span className="text-[10px] block font-bold mt-0.5 text-stone-400 dark:text-fuchsia-400 truncate">{stats.citasSemana} esta semana</span>
            </div>
          </div>
          <p className="text-stone-600 dark:text-stone-300 text-xs font-bold mt-3 tracking-wide">Citas Agendadas</p>
        </div>

        {/* CARD 2: CLIENTAS */}
        <div className="rounded-2xl p-4 shadow-sm hover:-translate-y-1 transition-all group relative overflow-hidden border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 min-w-0">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-rose-500/5 to-transparent rounded-bl-full" />
          <div className="flex items-center justify-between gap-2">
            <div className="p-3 rounded-xl text-white shadow-md group-hover:scale-110 transition-transform shrink-0" style={{ backgroundColor: settings?.secondary_color || '#E5A46E' }}>
              <Users className="w-5 h-5" />
            </div>
            <div className="text-right min-w-0">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-pink-100 block truncate">{stats.clientas}</span>
              <span className="text-[10px] text-emerald-500 dark:text-emerald-400 block font-bold mt-0.5 truncate">+{stats.clientasNuevas} este mes</span>
            </div>
          </div>
          <p className="text-stone-600 dark:text-stone-300 text-xs font-bold mt-3 tracking-wide">Clientas de Alta</p>
        </div>

        {/* CARD 3: INGRESOS DINÁMICOS */}
        <div className="rounded-2xl p-4 shadow-sm hover:-translate-y-1 transition-all group relative overflow-hidden border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 min-w-0">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-bl-full" />
          <div className="flex items-center justify-between gap-2">
            <div className="p-3 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="text-right min-w-0">
              <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white block truncate">{settings?.currency || '€'}{stats.ingresos.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold mt-0.5 truncate">{settings?.currency || '€'}{stats.ingresosMes.toLocaleString()} en curso</span>
            </div>
          </div>
          <p className="text-stone-600 dark:text-stone-300 text-xs font-bold mt-3 tracking-wide">Caja & Facturación</p>
        </div>

        {/* CARD 4: PUNTOS VIP */}
        <div className="rounded-2xl p-4 shadow-sm hover:-translate-y-1 transition-all group relative overflow-hidden border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 min-w-0">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full" />
          <div className="flex items-center justify-between gap-2">
            <div className="p-3 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform shrink-0">
              <Gem className="w-5 h-5" />
            </div>
            <div className="text-right min-w-0">
              <span className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white block truncate">{stats.puntos.toLocaleString()}</span>
              <span className="text-[10px] text-amber-500 dark:text-amber-400 block font-bold mt-0.5 truncate">Fidelización Club</span>
            </div>
          </div>
          <p className="text-stone-600 dark:text-stone-300 text-xs font-bold mt-3 tracking-wide">Puntos Acumulados</p>
        </div>
      </div>

      {/* PASTILLAS VIBRANTES DE ACCIÓN / SUB-ESTADOS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 p-2.5 text-center min-w-0">
          <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider truncate">Por Confirmar</p>
          <p className="text-base font-bold text-amber-700 dark:text-amber-400 truncate">{stats.pendientes}</p>
        </div>
        <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 p-2.5 text-center min-w-0">
          <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider truncate">Aprobadas</p>
          <p className="text-base font-bold text-emerald-700 dark:text-amber-400 truncate">{stats.confirmadas}</p>
        </div>
        <div className="rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/30 p-2.5 text-center min-w-0">
          <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider truncate">Listas / Éxito</p>
          <p className="text-base font-bold text-indigo-700 dark:text-indigo-400 truncate">{stats.completadas}</p>
        </div>
        <div className="rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 p-2.5 text-center min-w-0">
          <p className="text-[9px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider truncate">Canceladas</p>
          <p className="text-base font-bold text-rose-700 dark:text-rose-400 truncate">{stats.canceladas}</p>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL: CITAS Y TOP SERVICIOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BLOQUE PRÓXIMAS RESERVAS */}
        <div className="lg:col-span-2 rounded-2xl p-4 sm:p-6 shadow-xs border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950/50">
          <div className="flex items-center justify-between mb-5 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-4 h-4 animate-pulse shrink-0" style={{ color: settings?.primary_color || '#DB5B9A' }} />
              <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100 truncate">Próximos Turnos</h3>
            </div>
            <Link href="/admin/agenda" className="text-xs font-bold flex items-center gap-1 transition-all hover:underline shrink-0" style={{ color: settings?.primary_color || '#DB5B9A' }}>
              Ver Agenda →
            </Link>
          </div>

          {stats.citasProximas.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-pink-100 dark:border-fuchsia-950 rounded-2xl">
              <Calendar className="w-8 h-8 text-pink-300 dark:text-fuchsia-800 mx-auto mb-2" />
              <p className="text-xs text-stone-400 font-medium">No hay reservas para las próximas horas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.citasProximas.map((cita, idx) => {
                const hoy = new Date()
                const citaDate = new Date(cita.date)
                const diffDias = Math.ceil((citaDate.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
                const esHoy = diffDias === 0
                const esManana = diffDias === 1

                let label = `En ${diffDias} d`
                let colorClasses = 'bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400'
                if (esHoy) { label = 'Hoy'; colorClasses = 'bg-rose-500 text-white' }
                else if (esManana) { label = 'Mañ.'; colorClasses = 'bg-amber-500 text-white' }

                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#fff8fb] dark:bg-[#1a1430]/40 border border-pink-50/60 dark:border-fuchsia-950 rounded-2xl hover:border-pink-300 transition-all gap-2 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0" style={{ backgroundImage: `linear-gradient(to bottom right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})` }}>
                        {citaDate.getDate()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-stone-800 dark:text-pink-100 truncate">{cita.clienteNombre}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                          <span className="text-[11px] font-medium truncate" style={{ color: settings?.primary_color || '#DB5B9A' }}>{cita.servicioNombre}</span>
                          <span className="w-1 h-1 rounded-full bg-stone-300 shrink-0" />
                          <span className="text-[11px] font-mono font-bold text-stone-500 dark:text-stone-400 shrink-0">{cita.time ? cita.time.slice(0,5) : '--:--'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end shrink-0 min-w-0">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full truncate ${colorClasses}`}>{label}</span>
                      <span className="text-xs font-bold text-stone-700 dark:text-pink-200 mt-1">{settings?.currency || '€'}{cita.precio?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* BLOQUE SERVICIOS TOP RANKING */}
        <div className="rounded-2xl p-4 sm:p-6 shadow-xs border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950/50 min-w-0">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-rose-500 shrink-0" />
            <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100 truncate">Top Preferidos</h3>
          </div>

          {stats.serviciosTop.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-pink-100 dark:border-fuchsia-950 rounded-2xl">
              <BarChart className="w-8 h-8 text-pink-300 dark:text-fuchsia-800 mx-auto mb-2" />
              <p className="text-xs text-stone-400">Sin datos de servicios.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.serviciosTop.map((serv, idx) => {
                const porcentaje = stats.serviciosTop[0]?.count > 0 ? Math.round((serv.count / stats.serviciosTop[0].count) * 100) : 0

                return (
                  <div key={idx} className="space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between text-xs font-semibold gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-lg flex items-center justify-center text-white text-[9px] font-bold shadow-xs shrink-0" style={{ backgroundColor: idx === 0 ? (settings?.primary_color || '#DB5B9A') : '#8b5cf6' }}>
                          {idx + 1}
                        </div>
                        <span className="text-stone-800 dark:text-pink-100 truncate">{serv.nombre}</span>
                      </div>
                      <span className="font-mono font-bold px-2 py-0.5 rounded-md text-[11px] shrink-0" style={{ color: settings?.primary_color || '#DB5B9A', backgroundColor: `${settings?.primary_color || '#DB5B9A'}10` }}>{serv.count} x</span>
                    </div>
                    <div className="w-full bg-pink-100/30 dark:bg-fuchsia-950/30 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${porcentaje}%`, backgroundColor: idx === 0 ? (settings?.primary_color || '#DB5B9A') : (settings?.secondary_color || '#E5A46E') }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* SUB-MÉTRICAS CON VELOCÍMETROS VISUALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-4 flex items-center gap-3 bg-white dark:bg-[#130f24] border border-pink-100/40 dark:border-fuchsia-950 min-w-0">
          <div className="p-2.5 rounded-xl text-white shadow-xs shrink-0" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}><Activity className="w-4 h-4" /></div>
          <div className="w-full min-w-0">
            <p className="text-stone-400 text-[9px] font-bold uppercase tracking-wider truncate">Ocupación</p>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <span className="text-base font-bold text-stone-800 dark:text-pink-100 shrink-0">{stats.tasaOcupacion}%</span>
              <div className="flex-1 bg-pink-100 dark:bg-fuchsia-950/60 h-1.5 rounded-full overflow-hidden">
                <div className="h-full" style={{ width: `${stats.tasaOcupacion}%`, backgroundColor: settings?.primary_color || '#DB5B9A' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4 flex items-center gap-3 bg-white dark:bg-[#130f24] border border-pink-100/40 dark:border-fuchsia-950 min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-xs shrink-0"><PiggyBank className="w-4 h-4" /></div>
          <div className="min-w-0">
            <p className="text-stone-400 text-[9px] font-bold uppercase tracking-wider truncate">Ticket Promedio</p>
            <span className="text-base font-bold text-stone-800 dark:text-pink-100 mt-0.5 block truncate">{settings?.currency || '€'}{stats.ticketPromedio.toLocaleString()}</span>
          </div>
        </div>

        <div className="rounded-2xl p-4 flex items-center gap-3 bg-white dark:bg-[#130f24] border border-pink-100/40 dark:border-fuchsia-950 min-w-0">
          <div className="p-2.5 rounded-xl bg-violet-500 text-white shadow-xs shrink-0"><UserCheck className="w-4 h-4" /></div>
          <div className="min-w-0">
            <p className="text-stone-400 text-[9px] font-bold uppercase tracking-wider truncate">Fidelización</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-base font-bold text-emerald-500">89%</span>
              <ArrowUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4 flex items-center gap-3 bg-white dark:bg-[#130f24] border border-pink-100/40 dark:border-fuchsia-950 min-w-0">
          <div className="p-2.5 rounded-xl text-white shadow-xs shrink-0" style={{ backgroundColor: settings?.secondary_color || '#E5A46E' }}><Award className="w-4 h-4" /></div>
          <div className="min-w-0">
            <p className="text-stone-400 text-[9px] font-bold uppercase tracking-wider truncate">Crecimiento</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-base font-bold text-emerald-500">+{stats.crecimiento}%</span>
              <ArrowUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* SUGERENCIAS INTELIGENTES DEL SISTEMA */}
      <div className="rounded-3xl border border-pink-100/70 dark:border-fuchsia-950/70 p-5 bg-gradient-to-r from-pink-500/5 to-amber-500/5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-amber-500 animate-bounce shrink-0" />
          <h3 className="text-xs font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Fresh Actions Sugeridas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-start gap-3 p-3 bg-white/70 dark:bg-[#16122c]/60 backdrop-blur-md rounded-xl border border-pink-50 dark:border-fuchsia-950 hover:border-pink-400 transition-all min-w-0">
            <div className="w-7 h-7 text-white rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}><Target className="w-3.5 h-3.5" /></div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-stone-800 dark:text-pink-100">Potenciar Servicios</p>
              <p className="text-[11px] text-stone-500 dark:text-pink-200/60 mt-0.5 break-words">Lanza un descuento relámpago en los treatments menos pedidos este mes.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white/70 dark:bg-[#16122c]/60 backdrop-blur-md rounded-xl border border-pink-50 dark:border-fuchsia-950 hover:border-violet-400 transition-all min-w-0">
            <div className="w-7 h-7 bg-violet-500 text-white rounded-lg flex items-center justify-center shrink-0 mt-0.5"><Users className="w-3.5 h-3.5" /></div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-stone-800 dark:text-pink-100">Recuperar Clientas</p>
              <p className="text-[11px] text-stone-500 dark:text-pink-200/60 mt-0.5 break-words">Tienes clientas que no han agendado en 30 días. ¡Ofréceles puntos dobles!</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white/70 dark:bg-[#16122c]/60 backdrop-blur-md rounded-xl border border-pink-50 dark:border-fuchsia-950 hover:border-amber-400 transition-all min-w-0">
            <div className="w-7 h-7 text-white rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: settings?.secondary_color || '#E5A46E' }}><Crown className="w-3.5 h-3.5" /></div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-stone-800 dark:text-pink-100">Club VIP Activo</p>
              <p className="text-[11px] text-stone-500 dark:text-pink-200/60 mt-0.5 break-words">La retención está óptima en 89%. Premia a las mejores con un regalo especial.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
