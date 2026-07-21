// @ts-nocheck
'use client'

import React from 'react'
import { Clock, Calendar, Users, PieChart, BarChart3 } from 'lucide-react'

interface ServicioStat {
  nombre: string
  count: number
}

interface CitaStat {
  date: string | Date
  [key: string]: any
}

interface EstadisticasPersonalesProps {
  citas: CitaStat[]
  servicios?: ServicioStat[]
  puntos?: number
  referidos: number
}

export default function EstadisticasPersonales({ citas = [], servicios = [], puntos = 0, referidos = 0 }: EstadisticasPersonalesProps) {
  const totalCitas = citas.length
  const servicioFavorito = servicios && servicios.length > 0 
    ? servicios.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), { nombre: 'Ninguno', count: 0 })
    : { nombre: 'Ninguno', count: 0 }

  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const citasPorDia = [0, 0, 0, 0, 0, 0, 0]

  citas.forEach(cita => {
    if (!cita.date) return
    const fechaParseda = new Date(cita.date)
    if (!isNaN(fechaParseda.getTime())) {
      citasPorDia[fechaParseda.getDay()]++
    }
  })

  const maxCitasDia = Math.max(...citasPorDia)
  const diaFavorito = maxCitasDia > 0 ? diasSemana[citasPorDia.indexOf(maxCitasDia)] : '—'
  const tiempoAhorrado = totalCitas * 30
  const horasAhorradas = Math.floor(tiempoAhorrado / 60)
  const minutosAhorrados = tiempoAhorrado % 60
  const totalServiciosCount = servicios ? servicios.reduce((sum, s) => sum + s.count, 0) : 0

  return (
    <div className="bg-[#141211] border border-stone-850 p-8 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] space-y-8">
      <div className="flex items-center gap-4 border-b border-stone-900 pb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center">
          <PieChart className="w-5 h-5 text-amber-300" />
        </div>
        <div>
          <h3 className="text-xl font-extralight tracking-tight text-stone-100">
            Tu <span className="font-serif italic font-normal text-rose-300">Actividad</span>
          </h3>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-medium mt-1">Balance personalizado de tu experiencia</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: Clock, label: 'Tiempo Optimizado', val: `${horasAhorradas > 0 ? horasAhorradas + 'h ' : ''}${minutosAhorrados}m` },
          { icon: BarChart3, label: 'Tu Favorito', val: servicioFavorito.nombre },
          { icon: Calendar, label: 'Día Habitual', val: diaFavorito },
          { icon: Users, label: 'Invitaciones', val: referidos }
        ].map((item, i) => (
          <div key={i} className="bg-[#1a1715] border border-stone-850/60 p-5 rounded-xl flex flex-col justify-between space-y-4">
            <div className="flex items-center gap-2 text-stone-500">
              <item.icon className="w-4 h-4 text-rose-400" />
              <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
            </div>
            <p className="text-base font-serif text-stone-100 truncate" title={item.val}>{item.val}</p>
          </div>
        ))}
      </div>

      {servicios && servicios.length > 0 && (
        <div className="border-t border-stone-900 pt-6 space-y-4">
          <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Distribución de Experiencias</h4>
          <div className="space-y-4">
            {servicios.slice(0, 4).map((serv, idx) => {
              const porcentaje = totalServiciosCount > 0 ? (serv.count / totalServiciosCount) * 100 : 0
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400 font-light">{serv.nombre}</span>
                    <span className="font-mono text-amber-300 text-[10px]">{Math.round(porcentaje)}%</span>
                  </div>
                  <div className="w-full bg-stone-950 rounded-full h-[3px]">
                    <div className="h-[3px] rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500" style={{ width: `${porcentaje}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
