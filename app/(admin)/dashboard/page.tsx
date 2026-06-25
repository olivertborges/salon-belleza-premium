'use client'

import { useEffect, useState } from 'react'
import { Calendar, Users, DollarSign, Gem, TrendingUp, Sparkles, Activity, Heart, Zap, Target, Crown } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext' // Sigue usando tu contexto perfectamente operativo

export default function DashboardPage() {
  const { db } = useAuth() as any
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    citasHoy: 0,
    clientas: 0,
    ingresos: 0,
    puntos: 0,
    ocupacion: 0,
    citasProximas: [] as any[],
    serviciosTop: [] as any[],
  })

  useEffect(() => {
    const cargarEstadisticas = async () => {
      if (!db) {
        setLoading(false)
        return
      }

      try {
        const hoy = new Date().toISOString().split('T')[0]
        const appointments = db.appointments || []
        const clients = db.clients || []
        const services = db.services || []

        const citasHoy = appointments.filter((c: any) => c.date?.startsWith(hoy)).length
        const clientas = clients.length
        const puntos = clients.reduce((sum: number, c: any) => sum + (c.points || 0), 0)
        
        const citasConPrecio = appointments.filter((a: any) => a.price > 0)
        const totalIngresos = citasConPrecio.reduce((sum: number, a: any) => sum + Number(a.price || 0), 0)
        
        const proximas = appointments
          .filter((c: any) => c.date && new Date(c.date) > new Date())
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 5)
        
        const citasProximas = proximas.map((cita: any) => {
          const cliente = clients.find((c: any) => c.id === cita.clientId)
          const servicio = services.find((s: any) => s.id === cita.serviceId)
          return {
            ...cita,
            clienteNombre: cliente?.name || 'Cliente',
            servicioNombre: servicio?.name || 'Servicio',
          }
        })
        
        const servicioCount: Record<string, number> = {}
        appointments.forEach((c: any) => {
          if (c.serviceId) {
            servicioCount[c.serviceId] = (servicioCount[c.serviceId] || 0) + 1
          }
        })
        
        const serviciosTop = Object.entries(servicioCount)
          .map(([id, count]) => {
            // Busqueda flexible si el ID viene como string o número
            const servicio = services.find((s: any) => String(s.id) === String(id))
            return { 
              nombre: servicio?.name || 'Servicio Emprendedor', 
              count, 
              price: servicio?.price || 0 
            }
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 4)
        
        setStats({
          citasHoy,
          clientas,
          ingresos: totalIngresos,
          puntos,
          ocupacion: Math.min(100, Math.round((appointments.length / 50) * 100)) || 0,
          citasProximas,
          serviciosTop,
        })
      } catch (error) {
        console.error("Error al procesar las estadísticas del dashboard:", error)
      } finally {
        setLoading(false)
      }
    };

    cargarEstadisticas()
  }, [db])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-400 font-mono text-xs uppercase tracking-widest">Cargando métricas de control...</p>
        </div>
      </div>
    )
  }

  // Controlamos la división por cero de forma elegante
  const ticketPromedio = stats.clientas > 0 ? Math.round(stats.ingresos / stats.clientas) : 0

  return (
    <div className="space-y-6">
      
      {/* TARJETA DE BIENVENIDA */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/40 via-stone-900/40 to-[#0e0c0b] border border-rose-500/20 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-mono">✨ Operations Center</p>
            <h2 className="text-2xl font-serif italic text-white mt-1">¡Bienvenida/o al Dashboard!</h2>
            <p className="text-xs text-stone-400 mt-1">Monitoreo global de reservas, finanzas e inventario en tiempo real.</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-stone-900/80 border border-stone-800 text-xs font-mono text-stone-400 flex items-center gap-2 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Fresh System Activo
          </div>
        </div>
      </div>

      {/* METRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Citas Hoy */}
        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex flex-col justify-between hover:border-rose-500/20 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-3xl font-mono font-bold text-stone-100">{stats.citasHoy}</span>
          </div>
          <div className="mt-4">
            <p className="text-stone-400 text-xs font-medium">Citas Hoy</p>
            <span className="text-[10px] text-emerald-400 font-mono">+2 vs ayer</span>
          </div>
        </div>

        {/* Clientas Registradas */}
        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex flex-col justify-between hover:border-amber-500/20 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-3xl font-mono font-bold text-stone-100">{stats.clientas}</span>
          </div>
          <div className="mt-4">
            <p className="text-stone-400 text-xs font-medium">Clientas Registradas</p>
            <span className="text-[10px] text-emerald-400 font-mono">+8 esta semana</span>
          </div>
        </div>

        {/* Ingresos */}
        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex flex-col justify-between hover:border-emerald-500/20 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-2xl font-mono font-bold text-stone-100">${stats.ingresos.toLocaleString()}</span>
          </div>
          <div className="mt-4">
            <p className="text-stone-400 text-xs font-medium">Caja Total Acumulada</p>
            <span className="text-[10px] text-emerald-400 font-mono">+12% vs mes anterior</span>
          </div>
        </div>

        {/* Club Puntos */}
        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex flex-col justify-between hover:border-violet-500/20 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Gem className="w-5 h-5" />
            </div>
            <span className="text-2xl font-mono font-bold text-stone-100">{stats.puntos.toLocaleString()}</span>
          </div>
          <div className="mt-4">
            <p className="text-stone-400 text-xs font-medium">Puntos Totales Club</p>
            <span className="text-[10px] text-violet-400 font-mono">+520 emitidos hoy</span>
          </div>
        </div>

      </div>

      {/* BLOQUE DE LISTAS (AGENDA Y TOP SERVICIOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Próximas Citas */}
        <div className="rounded-2xl bg-[#0e0c0b] border border-stone-900 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-200">Próximas Citas en Cola</h3>
          </div>
          {stats.citasProximas.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-stone-900 rounded-xl">
              <p className="text-xs text-stone-500 font-mono">No hay citas pendientes agendadas.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.citasProximas.map((cita, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-stone-900/20 border border-stone-900 rounded-xl hover:bg-stone-900/40 transition-all">
                  <div>
                    <p className="text-xs font-bold text-stone-200">{cita.clienteNombre}</p>
                    <span className="text-[10px] text-stone-400 block mt-0.5">{cita.servicioNombre}</span>
                  </div>
                  <div className="text-right font-mono">
                    <p className="text-xs text-rose-400 font-medium">
                      {cita.date ? new Date(cita.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </p>
                    <p className="text-[9px] text-stone-500">
                      {cita.date ? new Date(cita.date).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Servicios Populares */}
        <div className="rounded-2xl bg-[#0e0c0b] border border-stone-900 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-200">Servicios de Mayor Ocupación</h3>
          </div>
          {stats.serviciosTop.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-stone-900 rounded-xl">
              <p className="text-xs text-stone-500 font-mono">Sin historial de métricas registradas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.serviciosTop.map((serv, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-stone-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{serv.nombre}</span>
                    </div>
                    <span className="font-mono text-stone-400 font-bold">{serv.count} bookings</span>
                  </div>
                  <div className="w-full bg-stone-900 rounded-full h-1">
                    <div 
                      className="bg-gradient-to-r from-rose-500 to-amber-500 h-1 rounded-full transition-all"
                      style={{ width: `${(serv.count / (stats.serviciosTop[0]?.count || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* MÉTRICAS SECUNDARIAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Ocupación */}
        <div className="rounded-2xl bg-[#0e0c0b] border border-stone-900 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-stone-400 text-[11px] leading-none">Ocupación del Salón</p>
              <p className="text-xl font-mono font-bold text-stone-200 mt-1">{stats.ocupacion}%</p>
            </div>
          </div>
          <div className="w-full bg-stone-900 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-rose-500 to-amber-400 h-1.5 rounded-full" style={{ width: `${stats.ocupacion}%` }}></div>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="rounded-2xl bg-[#0e0c0b] border border-stone-900 p-5 flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <p className="text-stone-400 text-[11px] leading-none">Ticket Promedio por Visita</p>
            <p className="text-xl font-mono font-bold text-stone-200 mt-1">
              ${ticketPromedio.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tasa Retención */}
        <div className="rounded-2xl bg-[#0e0c0b] border border-stone-900 p-5 flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <p className="text-stone-400 text-[11px] leading-none">Tasa de Retención (Recurrencia)</p>
            <p className="text-xl font-mono font-bold text-stone-200 mt-1">89%</p>
          </div>
        </div>

      </div>

      {/* STRATEGIC TIPS */}
      <div className="rounded-2xl bg-stone-900/10 border border-stone-900 p-5">
        <div className="flex items-center gap-2 mb-3.5">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">Recomendaciones Operativas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-2 bg-[#0e0c0b]/50 rounded-xl border border-stone-900">
            <div className="w-7 h-7 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-400 shrink-0">
              <Target className="w-3.5 h-3.5" />
            </div>
            <p className="text-stone-400 text-xs">Considera campañas flash en servicios de menor ocupación hoy.</p>
          </div>
          <div className="flex items-center gap-3 p-2 bg-[#0e0c0b]/50 rounded-xl border border-stone-900">
            <div className="w-7 h-7 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-400 shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
            <p className="text-stone-400 text-xs">Las clientas activas requieren seguimiento automatizado de fidelización.</p>
          </div>
          <div className="flex items-center gap-3 p-2 bg-[#0e0c0b]/50 rounded-xl border border-stone-900">
            <div className="w-7 h-7 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 shrink-0">
              <Crown className="w-3.5 h-3.5" />
            </div>
            <p className="text-stone-400 text-xs">La retención está en un 89%. Envía un obsequio de puntos VIP.</p>
          </div>
        </div>
      </div>

    </div>
  )
}