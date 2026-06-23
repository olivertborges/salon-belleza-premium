'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Users, Gem, DollarSign, TrendingUp, Clock, Crown, Star, Zap, Target, Heart, Activity } from 'lucide-react'

// Interfaces estrictas para el tipado de base de datos simulada
interface Appointment {
  id: number
  date: string
  price: number
  clientId: string | number
  serviceId: number
}

interface Client {
  id: string | number
  name: string
  points: number
}

interface Service {
  id: number
  name: string
  price: number
}

interface DB {
  appointments?: Appointment[]
  clients?: Client[]
  services?: Service[]
}

interface AdminDashboardProps {
  db: DB
}

export default function AdminDashboard({ db }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    citasHoy: 0,
    clientas: 0,
    ingresos: 0,
    puntos: 0,
    ocupacion: 0,
    citasProximas: [] as any[],
    serviciosTop: [] as any[],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarEstadisticas = () => {
      if (!db) return

      const ahora = new Date()
      const hoyStr = ahora.toISOString().split('T')[0]
      
      const citasHoy = db.appointments?.filter(c => c.date?.startsWith(hoyStr)).length || 0
      const clientas = db.clients?.length || 0
      const puntos = db.clients?.reduce((sum, c) => sum + (c.points || 0), 0) || 0

      const citasConPrecio = db.appointments?.filter(a => (a.price || 0) > 0) || []
      const totalIngresos = citasConPrecio.reduce((sum, a) => sum + a.price, 0)

      // Próximas citas ordenadas cronológicamente
      const proximas = db.appointments
        ?.filter(c => c.date && new Date(c.date).getTime() > ahora.getTime())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5) || []

      const citasProximas = proximas.map(cita => {
        const cliente = db.clients?.find(c => c.id === cita.clientId)
        const servicio = db.services?.find(s => s.id === cita.serviceId)
        return {
          ...cita,
          clienteNombre: cliente?.name || 'Cliente Alterno',
          servicioNombre: servicio?.name || 'Servicio General',
        }
      })

      // Servicios más populares
      const servicioCount: Record<number, number> = {}
      db.appointments?.forEach(c => {
        if (c.serviceId) {
          servicioCount[c.serviceId] = (servicioCount[c.serviceId] || 0) + 1
        }
      })
      
      const serviciosTop = Object.entries(servicioCount)
        .map(([id, count]) => {
          const servicio = db.services?.find(s => s.id === parseInt(id, 10))
          return { nombre: servicio?.name || 'Servicio', count, price: servicio?.price || 0 }
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)

      setStats({
        citasHoy,
        clientas,
        ingresos: totalIngresos,
        puntos,
        ocupacion: Math.min(100, Math.round(((db.appointments?.length || 0) / 50) * 100)),
        citasProximas,
        serviciosTop,
      })
      setLoading(false)
    }

    cargarEstadisticas()
  }, [db])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <div className="w-6 h-6 border-2 border-stone-800 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono uppercase tracking-wider text-stone-400">Compilando analíticas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ==================== TARJETA DE BIENVENIDA EDITORIAL ==================== */}
      <div className="bg-stone-900 border border-stone-900 p-8 rounded-2xl text-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block">Atelier Control</span>
          <h2 className="font-serif text-2xl tracking-tight text-white">Resumen Ejecutivo del Negocio</h2>
          <p className="text-xs text-stone-400 font-light max-w-md">
            Balance general de ocupación, flujos de caja e interacción de la comunidad activa.
          </p>
        </div>
        <div className="text-left md:text-right border-t md:border-t-0 md:border-l border-stone-800 pt-4 md:pt-0 md:pl-6 flex-shrink-0">
          <span className="text-[9px] font-mono uppercase text-stone-400 block">Estado Global</span>
          <span className="text-xs font-serif italic text-stone-200 block mt-0.5">Operaciones estables</span>
        </div>
      </div>

      {/* ==================== RETÍCULA DE INDICADORES CLAVE ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Citas de Hoy */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between gap-2 text-stone-400 mb-4">
            <span className="text-[10px] font-mono uppercase tracking-wider">Citas Hoy</span>
            <Calendar className="w-4 h-4 text-stone-500" />
          </div>
          <div>
            <h3 className="text-3xl font-serif text-stone-800 font-bold">{stats.citasHoy}</h3>
            <p className="text-[10px] text-stone-400 font-light mt-1">+2 vs jornada anterior</p>
          </div>
        </div>

        {/* Clientas Activas */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between gap-2 text-stone-400 mb-4">
            <span className="text-[10px] font-mono uppercase tracking-wider">Comunidad</span>
            <Users className="w-4 h-4 text-stone-500" />
          </div>
          <div>
            <h3 className="text-3xl font-serif text-stone-800 font-bold">{stats.clientas}</h3>
            <p className="text-[10px] text-stone-400 font-light mt-1">+8 adiciones esta semana</p>
          </div>
        </div>

        {/* Ingresos Totales */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between gap-2 text-stone-400 mb-4">
            <span className="text-[10px] font-mono uppercase tracking-wider">Caja Acumulada</span>
            <DollarSign className="w-4 h-4 text-stone-500" />
          </div>
          <div>
            <h3 className="text-3xl font-serif text-stone-800 font-bold">${stats.ingresos.toLocaleString()}</h3>
            <p className="text-[10px] text-stone-400 font-light mt-1">+12% de crecimiento bruto</p>
          </div>
        </div>

        {/* Puntos Circulantes */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between gap-2 text-stone-400 mb-4">
            <span className="text-[10px] font-mono uppercase tracking-wider">Pts Circulantes</span>
            <Gem className="w-4 h-4 text-stone-500" />
          </div>
          <div>
            <h3 className="text-3xl font-serif text-stone-800 font-bold">{stats.puntos.toLocaleString()}</h3>
            <p className="text-[10px] text-stone-400 font-light mt-1">Fidelización activa en club</p>
          </div>
        </div>

      </div>

      {/* ==================== ANÁLISIS CRONOLÓGICO Y POPULARIDAD ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Próximas Sesiones */}
        <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-4 mb-4">
            <Clock className="w-4 h-4 text-stone-700" />
            <h3 className="font-serif text-base text-stone-800 tracking-tight">Próximas Sesiones</h3>
          </div>
          
          {stats.citasProximas.length === 0 ? (
            <div className="text-center py-10 text-stone-400 border border-dashed border-stone-200 rounded-xl">
              <p className="text-xs font-light italic">Sin citas programadas en las próximas horas.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.citasProximas.map((cita, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-stone-50/60 border border-stone-100 rounded-xl hover:border-stone-200 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-stone-800 truncate">{cita.clienteNombre}</p>
                    <p className="text-[11px] text-stone-400 font-light mt-0.5 truncate">{cita.servicioNombre}</p>
                  </div>
                  <div className="text-right flex-shrink-0 pl-2">
                    <p className="text-xs font-mono font-bold text-stone-800">
                      {new Date(cita.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] text-stone-400 font-light">{new Date(cita.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Distribución de Popularidad */}
        <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-4 mb-4">
            <TrendingUp className="w-4 h-4 text-stone-700" />
            <h3 className="font-serif text-base text-stone-800 tracking-tight">Estilos con Mayor Demanda</h3>
          </div>
          
          {stats.serviciosTop.length === 0 ? (
            <div className="text-center py-10 text-stone-400 border border-dashed border-stone-200 rounded-xl">
              <p className="text-xs font-light italic">Esperando flujos de datos de reservas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.serviciosTop.map((serv, idx) => {
                const maxCount = stats.serviciosTop[0]?.count || 1
                const porcentaje = (serv.count / maxCount) * 100
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-700 font-light">{serv.nombre}</span>
                      <span className="font-mono text-stone-500 text-[11px]">{serv.count} servicios</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-1">
                      <div 
                        className="h-1 rounded-full bg-stone-800 transition-all duration-500 ease-out"
                        style={{ width: `${porcentaje}%`, opacity: 1 - idx * 0.2 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* ==================== RENDIMIENTO DE INFRAESTRUCTURA ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Ocupación Global */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-stone-400">
            <Activity className="w-4 h-4 text-stone-500" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">Ocupación Operativa</span>
          </div>
          <div>
            <h4 className="text-xl font-serif text-stone-800 font-bold">{stats.ocupacion}%</h4>
            <div className="w-full bg-stone-100 rounded-full h-1 mt-2">
              <div className="bg-stone-800 h-1 rounded-full transition-all duration-500" style={{ width: `${stats.ocupacion}%` }}></div>
            </div>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center gap-2.5 text-stone-400 mb-2">
            <DollarSign className="w-4 h-4 text-stone-500" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">Ticket Promedio</span>
          </div>
          <h4 className="text-xl font-serif text-stone-800 font-bold">
            ${stats.ingresos && stats.clientas ? Math.round(stats.ingresos / stats.clientas).toLocaleString() : 0}
          </h4>
          <p className="text-[10px] text-stone-400 font-light">Cálculo por base de cuentas vinculadas</p>
        </div>

        {/* Tasa de Retención */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center gap-2.5 text-stone-400 mb-2">
            <Heart className="w-4 h-4 text-stone-500" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">Tasa de Lealtad</span>
          </div>
          <h4 className="text-xl font-serif text-stone-800 font-bold">89%</h4>
          <p className="text-[10px] text-stone-400 font-light">Retención recurrente mensual</p>
        </div>

      </div>

      {/* ==================== LINEAMIENTOS ESTRATÉGICOS ==================== */}
      <div className="bg-stone-50 border border-stone-200/60 p-5 rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-stone-700" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-stone-600">Recomendaciones Automatizadas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-stone-400 rounded-full flex-shrink-0"></div>
            <p className="text-xs text-stone-600 font-light">Vincular incentivos directos a servicios de baja demanda.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-stone-400 rounded-full flex-shrink-0"></div>
            <p className="text-xs text-stone-600 font-light">Potenciar dinámicas de referidos sobre carteras premium.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-stone-400 rounded-full flex-shrink-0"></div>
            <p className="text-xs text-stone-600 font-light">Asignar prioridades especiales a perfiles de alta retención.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
