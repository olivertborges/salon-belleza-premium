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

  // ✅ CONTROL DE ACCESO CORREGIDO DIRECTO A LA TABLA STAFF
  useEffect(() => {
    if (authLoading) return
    
    const validarAccesoPanel = async () => {
      if (!user) {
        setAuthorized(false)
        return
      }

      try {
        // Consultamos la tabla 'staff' para obtener el rol y el ID de staff del usuario actual
        const { data: staffData, error } = await supabase
          .from('staff')
          .select('id, auth_role')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error

        let userRole = role
        let currentStaffId = staffData?.id || null

        if (staffData && staffData.auth_role) {
          userRole = staffData.auth_role.toLowerCase().trim()
        }

        if (userRole === 'admin' || userRole === 'staff' || userRole === 'owner') {
          const esAdmin = userRole === 'admin' || userRole === 'owner'
          setIsAdmin(esAdmin)
          setAuthorized(true)
          cargarEstadisticas(esAdmin, currentStaffId)
          return
        }

        setAuthorized(false)

      } catch (err) {
        console.error('Error verificando permisos en el dashboard interno:', err)
        setAuthorized(false)
      }
    }

    validarAccesoPanel()
  }, [user, role, authLoading])

  const cargarEstadisticas = async (esAdmin?: boolean, currentStaffId?: string | null) => {
    try {
      let activeTenantId = tenantId
      let staffMemberId = currentStaffId

      if ((!activeTenantId || staffMemberId === undefined) && user) {
        // Buscamos tenant_id e id del staff si aún no se han resuelto
        const { data: staffTenant } = await supabase
          .from('staff')
          .select('id, tenant_id, auth_role')
          .eq('user_id', user.id)
          .maybeSingle()

        if (staffTenant) {
          activeTenantId = activeTenantId || staffTenant.tenant_id
          staffMemberId = staffMemberId ?? staffTenant.id
        } else {
          const { data: prof } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .maybeSingle()
          if (prof?.tenant_id) activeTenantId = prof.tenant_id
        }
      }

      if (!activeTenantId) {
        setLoading(false)
        return
      }

      const adminCheck = esAdmin !== undefined ? esAdmin : isAdmin

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

      // 🔍 CONSTRUCCIÓN DE LA CONSULTA DE CITAS
      let appointmentsQuery = supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', activeTenantId)

      // Si NO es Admin / Owner, filtramos para que traiga ÚNICAMENTE sus citas
      if (!adminCheck && staffMemberId) {
        appointmentsQuery = appointmentsQuery.eq('staff_id', staffMemberId)
      }

      const { data: appointmentsData } = await appointmentsQuery
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
        .slice(0, 4)

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
                  Panel <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#EC4899] to-[#C9A96E] font-serif italic font-normal">{isAdmin ? 'Executive' : 'Staff'}</span>
                </h2>
                <p className={`text-sm font-light ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                  {isAdmin 
                    ? 'Control intuitivo, analíticas en tiempo real y gestión de tu comunidad exclusiva.' 
                    : 'Gestión de tus turnos, agenda personalizada y resumen de servicios.'}
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

        {/* TARJETAS DE MÉTRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-500 hover:shadow-2xl ${isDark ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#D4AF37]/50' : 'bg-white border-[#EADED5] hover:border-[#D4AF37]/50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Citas Agendadas</p>
                <h4 className={`font-serif text-5xl font-black mt-2 ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>{stats.citasHoy}</h4>
                <p className="text-[11px] mt-2 text-[#C9A96E]">+{stats.citasSemana} esta semana</p>
              </div>
              <div className={`p-4 rounded-xl border text-[#D4AF37] ${isDark ? 'bg-[#291A11] border-[#3D281E]' : 'bg-[#FAF6F2] border-[#EADED5]'}`}><Calendar className="w-6 h-6" /></div>
            </div>
          </div>

          <div className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-500 hover:shadow-2xl ${isDark ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#EC4899]/50' : 'bg-white border-[#EADED5] hover:border-[#EC4899]/50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>Por Confirmar</p>
                <h4 className={`font-serif text-5xl font-black mt-2 ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>{stats.pendientes}</h4>
                <p className="text-[11px] mt-2 text-[#EC4899]">Requieren atención turno</p>
              </div>
              <div className={`p-4 rounded-xl border text-[#EC4899] ${isDark ? 'bg-[#291A11] border-[#3D281E]' : 'bg-[#FAF6F2] border-[#EADED5]'}`}><Clock className="w-6 h-6" /></div>
            </div>
          </div>

          <div className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-500 hover:shadow-2xl ${isDark ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#3B82F6]/50' : 'bg-white border-[#EADED5] hover:border-[#3B82F6]/50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>{isAdmin ? 'Flujo de Caja' : 'Ingresos Generados'}</p>
                <h4 className="font-serif text-4xl font-black mt-2 text-[#3B82F6]">{currencySymbol}{stats.ingresos.toLocaleString()}</h4>
                <p className="text-[11px] mt-2 text-[#3B82F6]">{isAdmin ? 'Facturación total' : 'Monto total tus citas'}</p>
              </div>
              <div className={`p-4 rounded-xl border text-[#3B82F6] ${isDark ? 'bg-[#291A11] border-[#3D281E]' : 'bg-[#FAF6F2] border-[#EADED5]'}`}><DollarSign className="w-6 h-6" /></div>
            </div>
          </div>
        </div>

        {/* CONTENIDO INTERMEDIO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className={`lg:col-span-2 rounded-2xl border p-6 ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'}`}>
            <h3 className="font-serif text-xl font-bold mb-4">Cronograma de Próximas Citas</h3>
            {stats.citasProximas.length === 0 ? (
              <p className="text-sm text-stone-400 py-6 text-center">No hay citas planificadas.</p>
            ) : (
              <div className="space-y-3">
                {stats.citasProximas.map((cita, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3.5 rounded-xl border ${isDark ? 'border-[#3D281E] bg-[#170E09]' : 'border-[#EADED5] bg-[#FAF8F5]'}`}>
                    <div>
                      <p className="text-sm font-bold">{cita.clienteNombre}</p>
                      <p className="text-xs text-[#C9A96E]">{cita.servicioNombre} — {cita.time?.slice(0,5)} hs</p>
                    </div>
                    <span className="font-serif font-black text-[#C9A96E]">{currencySymbol}{cita.precio}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'}`}>
            <h3 className="font-serif text-xl font-bold mb-4">Top Servicios</h3>
            <div className="space-y-3">
              {stats.serviciosTop.map((serv, idx) => (
                <div key={idx} className="flex justify-between text-xs border-b pb-2 dark:border-stone-800">
                  <span>{idx+1}. {serv.nombre}</span>
                  <span className="font-bold text-[#C9A96E]">{serv.count} usos</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ACCIONES RÁPIDAS */}
        <div className={`grid gap-4 ${isAdmin ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
          <Link href="/admin/agenda" className={`p-5 rounded-2xl border text-center ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'}`}><PlusCircle className="mx-auto mb-2 text-[#D4AF37]" /><span className="text-xs font-bold">Agendar Turno</span></Link>
          <Link href="/admin/clientes" className={`p-5 rounded-2xl border text-center ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'}`}><Users className="mx-auto mb-2 text-[#EC4899]" /><span className="text-xs font-bold">Comunidad VIP</span></Link>
          {isAdmin && (
            <>
              <Link href="/admin/servicios" className={`p-5 rounded-2xl border text-center ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'}`}><Scissors className="mx-auto mb-2 text-[#3B82F6]" /><span className="text-xs font-bold">Catálogo</span></Link>
              <Link href="/admin/staff" className={`p-5 rounded-2xl border text-center ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#EADED5]'}`}><UserCheck className="mx-auto mb-2 text-[#D4AF37]" /><span className="text-xs font-bold">Equipo Staff</span></Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
