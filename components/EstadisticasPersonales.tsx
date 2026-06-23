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
  
  // Calcular total de citas
  const totalCitas = citas.length

  // Obtener servicio favorito de manera segura
  const servicioFavorito = servicios && servicios.length > 0 
    ? servicios.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), { nombre: 'Ninguno', count: 0 })
    : { nombre: 'Ninguno', count: 0 }

  // Calcular día de la semana preferido
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const citasPorDia = [0, 0, 0, 0, 0, 0, 0]
  
  citas.forEach(cita => {
    if (!cita.date) return
    const fechaParseda = new Date(cita.date)
    if (!isNaN(fechaParseda.getTime())) {
      const dia = fechaParseda.getDay()
      citasPorDia[dia]++
    }
  })
  
  const maxCitasDia = Math.max(...citasPorDia)
  const diaFavorito = maxCitasDia > 0 ? diasSemana[citasPorDia.indexOf(maxCitasDia)] : '—'

  // Tiempo optimizado (30 minutos estimados por cita)
  const tiempoAhorrado = totalCitas * 30
  const horasAhorradas = Math.floor(tiempoAhorrado / 60)
  const minutosAhorrados = tiempoAhorrado % 60

  // Total de servicios para el cálculo de porcentaje de distribución
  const totalServiciosCount = servicios ? servicios.reduce((sum, s) => sum + s.count, 0) : 0

  return (
    <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm space-y-6">
      
      {/* Encabezado del Módulo */}
      <div className="flex items-center gap-2.5 border-b border-stone-100 pb-4">
        <div className="w-8 h-8 bg-stone-50 rounded-xl flex items-center justify-center border border-stone-200">
          <PieChart className="w-4 h-4 text-stone-700" />
        </div>
        <div>
          <h3 className="font-serif text-base text-stone-800 tracking-tight">Tu Actividad</h3>
          <p className="text-[11px] text-stone-400 font-light">Un balance personalizado de tu experiencia en el club.</p>
        </div>
      </div>

      {/* Retícula de Indicadores */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Tiempo Optimizado */}
        <div className="bg-stone-50/60 border border-stone-200/60 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-stone-400 mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Tiempo Optimizado</span>
          </div>
          <div>
            <p className="text-lg font-serif text-stone-800">
              {horasAhorradas > 0 ? `${horasAhorradas}h ` : ''}{minutosAhorrados}m
            </p>
            <p className="text-[10px] text-stone-400 font-light mt-0.5">en reservas y prioridades</p>
          </div>
        </div>

        {/* Preferencia de Estilo */}
        <div className="bg-stone-50/60 border border-stone-200/60 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-stone-400 mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Tu Favorito</span>
          </div>
          <div>
            <p className="text-lg font-serif text-stone-800 truncate" title={servicioFavorito.nombre}>
              {servicioFavorito.nombre}
            </p>
            <p className="text-[10px] text-stone-400 font-light mt-0.5">Solicitado {servicioFavorito.count} {servicioFavorito.count === 1 ? 'vez' : 'veces'}</p>
          </div>
        </div>

        {/* Día Concurrente */}
        <div className="bg-stone-50/60 border border-stone-200/60 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-stone-400 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Día Habitual</span>
          </div>
          <div>
            <p className="text-lg font-serif text-stone-800">
              {diaFavorito}
            </p>
            <p className="text-[10px] text-stone-400 font-light mt-0.5">Tu jornada preferida</p>
          </div>
        </div>

        {/* Círculo de Influencia */}
        <div className="bg-stone-50/60 border border-stone-200/60 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-stone-400 mb-2">
            <Users className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Invitaciones</span>
          </div>
          <div>
            <p className="text-lg font-serif text-stone-800">
              {referidos}
            </p>
            <p className="text-[10px] text-stone-400 font-light mt-0.5">{referidos === 1 ? 'amiga vinculada' : 'amigas vinculadas'}</p>
          </div>
        </div>

      </div>

      {/* Sección: Desglose de Estilos */}
      {servicios && servicios.length > 0 && (
        <div className="border-t border-stone-100 pt-5 space-y-3.5">
          <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400">Distribución de Experiencias</h4>
          <div className="space-y-3">
            {servicios.slice(0, 4).map((serv, idx) => {
              const porcentaje = totalServiciosCount > 0 ? (serv.count / totalServiciosCount) * 100 : 0
              
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-700 font-light">{serv.nombre}</span>
                    <span className="font-mono text-stone-500 text-[11px]">{Math.round(porcentaje)}%</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-1">
                    <div
                      className="h-1 rounded-full bg-stone-800 transition-all duration-500 ease-out"
                      style={{ 
                        width: `${porcentaje}%`,
                        opacity: 1 - (idx * 0.22) // Degradado óptico elegante usando opacidad decreciente
                      }}
                    />
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
