'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { Calendar, MapPin, Clock, Sparkles, CheckCircle } from 'lucide-react'

type EventoPublico = {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  spots: number
  price: string
  instructor: string
  type: string
  is_active: boolean
}

export default function CursosClientesPage() {
  const [cursos, setCursos] = useState<EventoPublico[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchCursosPublicos = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('is_active', true)
          .order('date', { ascending: true })

        if (error) throw error
        if (data) setCursos(data as EventoPublico[])
      } catch (err) {
        console.error('Error al cargar la academia:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCursosPublicos()
  }, [])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center font-mono text-xs text-fuchsia-400">
        Cargando próximos talleres...
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      
      {/* INTRODUCCIÓN ESTILO ACADEMIA PREMIUM */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-400 font-mono flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Fresh Nails Academy
        </p>
        <h1 className="text-4xl font-serif italic text-white">Lleva tu técnica al siguiente nivel</h1>
        <p className="text-sm text-stone-400 leading-relaxed">
          Capacítate con las mejores profesionales del sector. Talleres intensivos, teóricos y prácticos con certificación garantizada.
        </p>
      </div>

      {/* GRILLA DE CURSOS EN VENTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cursos.map((curso) => {
          const esAgotado = curso.spots === 0

          return (
            <div key={curso.id} className="rounded-3xl bg-gradient-to-b from-stone-900/40 to-stone-950/60 border border-stone-900 overflow-hidden flex flex-col justify-between hover:border-fuchsia-500/30 transition-all duration-300 group shadow-xl">
              
              {/* Contenido Superior */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-1 rounded-full text-[9px] font-mono border bg-fuchsia-500/5 text-fuchsia-400 border-fuchsia-500/10 uppercase tracking-widest">
                    {curso.type || 'Workshop'}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-stone-500 font-mono">
                    <Clock className="w-3 h-3 text-fuchsia-500/40" />
                    {curso.time}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-serif text-stone-100 group-hover:text-fuchsia-300 transition-colors duration-300">
                    {curso.title}
                  </h3>
                  <p className="text-xs text-stone-400 line-clamp-3 font-sans leading-relaxed">
                    {curso.description || 'Aprende los secretos de esta técnica paso a paso con prácticas reales en taller.'}
                  </p>
                </div>

                {/* Detalles de Agenda */}
                <div className="space-y-2 pt-3 border-t border-stone-900 text-xs text-stone-400 font-sans">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-stone-600" />
                    <span>{new Date(curso.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-stone-600" />
                    <span className="truncate">{curso.location}</span>
                  </div>
                </div>

                <p className="text-xs text-stone-500 pt-1">
                  Dictado por: <span className="text-stone-300 font-medium font-serif italic">{curso.instructor}</span>
                </p>
              </div>

              {/* Footer con Precio y Botón de Compra */}
              <div className="p-6 bg-stone-900/20 border-t border-stone-900 space-y-4">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider font-mono">Inversión Total</span>
                    <span className="text-xl font-mono font-bold text-emerald-400">${curso.price}</span>
                  </div>
                  <span className={`text-[11px] font-mono ${esAgotado ? 'text-red-400' : 'text-stone-400'}`}>
                    {esAgotado ? 'Cupos Agotados' : `${curso.spots} lugares disponibles`}
                  </span>
                </div>

                <button 
                  disabled={esAgotado}
                  className={`w-full py-3 rounded-2xl font-medium text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                    esAgotado 
                      ? 'bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed' 
                      : 'bg-white hover:bg-fuchsia-400 text-stone-950 hover:text-stone-950 shadow-lg hover:shadow-fuchsia-500/10'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  {esAgotado ? 'Saber más' : 'Reservar mi Lugar'}
                </button>
              </div>

            </div>
          )
        })}
      </div>

    </div>
  )
}