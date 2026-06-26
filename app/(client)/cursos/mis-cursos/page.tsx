'use client'

import React, { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  GraduationCap, PlayCircle, CheckCircle2, Bookmark, 
  BookOpen, Trophy, Clock, ChevronRight, ChevronDown, 
  Lock, Award, BarChart3, Presentation
} from 'lucide-react'

interface Leccion {
  id: string
  title: string
  duration: string
  isCompleted: boolean
  isLocked: boolean
}

interface Modulo {
  id: string
  title: string
  lecciones: Leccion[]
}

interface CursoVirtual {
  id: string
  title: string
  instructor: string
  image_url: string
  progreso: number
  totalHoras: string
  modulos: Modulo[]
}

export default function MisCursosLMS() {
  const { user, tenantId } = useAuth()
  const { theme } = useTheme()
  const supabase = createClientComponentClient()
  
  const [cursos, setCursos] = useState<CursoVirtual[]>([])
  const [cursoSeleccionado, setCursoSeleccionado] = useState<CursoVirtual | null>(null)
  const [moduloAbierto, setModuloAbierto] = useState<string | null>(null)
  const [filtroTab, setFiltroTab] = useState<'todos' | 'completados'>('todos')
  const [loading, setLoading] = useState(true)

  const isDark = theme === 'dark'

  useEffect(() => {
    async function obtenerEcosistemaLMS() {
      if (!user?.email || !tenantId) {
        setLoading(false)
        return
      }
      
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title, instructor, image_url')
          .eq('is_active', true)

        if (!error && data) {
          // Simulamos una estructura LMS rica por cada curso asignado/comprado
          const estructurados: CursoVirtual[] = data.map((curso, index) => ({
            id: curso.id,
            title: curso.title,
            instructor: curso.instructor || 'Fresh Nails Master',
            image_url: curso.image_url,
            progreso: index === 0 ? 35 : 100, // Simulamos uno en curso y otro terminado
            totalHoras: '8.5 horas',
            modulos: [
              {
                id: `m1-${curso.id}`,
                title: 'Módulo 1: Fundamentos y Preparación Quirúrgica de la Uña',
                lecciones: [
                  { id: 'l1', title: 'Introducción al instrumental y desinfección', duration: '12:45', isCompleted: true, isLocked: false },
                  { id: 'l2', title: 'Anatomía ungueal y patologías comunes', duration: '22:10', isCompleted: true, isLocked: false },
                  { id: 'l3', title: 'Preparación química con buffers y deshidratadores', duration: '15:30', isCompleted: index === 1, isLocked: false }
                ]
              },
              {
                id: `m2-${curso.id}`,
                title: 'Módulo 2: Técnicas de Esculpido Avanzado y Balance',
                lecciones: [
                  { id: 'l4', title: 'Colocación perfecta del molde de estructura', duration: '18:50', isCompleted: index === 1, isLocked: index === 0 },
                  { id: 'l5', title: 'Manejo del producto y control de perlas de gel/acrílico', duration: '34:12', isCompleted: index === 1, isLocked: index === 0 },
                  { id: 'l6', title: 'Técnicas de limado simétrico y sellado de zona de cutícula', duration: '27:05', isCompleted: index === 1, isLocked: index === 0 }
                ]
              }
            ]
          }))
          
          setCursos(estructurados)
          if (estructurados.length > 0) setCursoSeleccionado(estructurados[0])
        }
      } catch (err) {
        console.error('Error al armar el Aula Virtual:', err)
      } finally {
        setLoading(false)
      }
    }

    obtenerEcosistemaLMS()
  }, [user, tenantId, supabase])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] uppercase font-mono tracking-widest text-stone-400">Abriendo Puertas del Aula Virtual...</p>
      </div>
    )
  }

  const cursosFiltrados = cursos.filter(c => filtroTab === 'todos' ? true : c.progreso === 100)

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full antialiased selection:bg-rose-500/20">
      
      {/* 1. SECCIÓN METRICAS / ESTADÍSTICAS DEL AULA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 border rounded-2xl flex items-center gap-4 transition-colors ${isDark ? 'bg-[#141211] border-stone-850' : 'bg-white border-stone-200'}`}>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500"><BookOpen className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-mono uppercase text-stone-400">Mis Capacitaciones</p>
            <h3 className={`text-lg font-mono font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>{cursos.length} Cursos</h3>
          </div>
        </div>
        <div className={`p-4 border rounded-2xl flex items-center gap-4 transition-colors ${isDark ? 'bg-[#141211] border-stone-850' : 'bg-white border-stone-200'}`}>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500"><Trophy className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-mono uppercase text-stone-400">Certificaciones Ganadas</p>
            <h3 className={`text-lg font-mono font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>{cursos.filter(c => c.progreso === 100).length} Diplomas</h3>
          </div>
        </div>
        <div className={`p-4 border rounded-2xl flex items-center gap-4 transition-colors ${isDark ? 'bg-[#141211] border-stone-850' : 'bg-white border-stone-200'}`}>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500"><Clock className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-mono uppercase text-stone-400">Tiempo de Estudio</p>
            <h3 className={`text-lg font-mono font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>Activo</h3>
          </div>
        </div>
      </div>

      {/* 2. BODY DEL INTERFAZ DEL LMS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: SELECTOR DE CURSOS (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-900/10 dark:border-stone-850 pb-2">
            <span className={`text-xs uppercase font-mono tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>Mis Programas</span>
            <div className="flex gap-2">
              <button onClick={() => setFiltroTab('todos')} className={`text-[10px] px-2 py-0.5 rounded-md transition-colors ${filtroTab === 'todos' ? 'bg-rose-500/10 text-rose-500 font-bold' : 'text-stone-400'}`}>Todos</button>
              <button onClick={() => setFiltroTab('completados')} className={`text-[10px] px-2 py-0.5 rounded-md transition-colors ${filtroTab === 'completados' ? 'bg-rose-500/10 text-rose-500 font-bold' : 'text-stone-400'}`}>Listos</button>
            </div>
          </div>

          <div className="space-y-3">
            {cursosFiltrados.map((curso) => (
              <div 
                key={curso.id}
                onClick={() => { setCursoSeleccionado(curso); setModuloAbierto(null); }}
                className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-center gap-3 group relative ${
                  cursoSeleccionado?.id === curso.id
                    ? isDark ? 'bg-stone-900/60 border-rose-500/40 shadow-md' : 'bg-stone-50 border-rose-500/50 shadow-sm'
                    : isDark ? 'bg-[#141211] border-stone-850 hover:border-stone-800' : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-950 shrink-0 border border-stone-800">
                  {curso.image_url ? (
                    <img src={curso.image_url} alt={curso.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-600"><Presentation className="w-5 h-5" /></div>
                  )}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <h4 className={`text-xs font-medium truncate ${isDark ? 'text-stone-200' : 'text-stone-800'} ${cursoSeleccionado?.id === curso.id ? 'text-rose-500 dark:text-rose-300 font-bold' : ''}`}>
                    {curso.title}
                  </h4>
                  <div className="w-full bg-stone-200 dark:bg-stone-950 h-1 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-500 to-amber-500 h-full" style={{ width: `${curso.progreso}%` }} />
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-mono text-stone-400">
                    <span>{curso.instructor}</span>
                    <span className="font-bold">{curso.progreso}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: REPRODUCTOR / DESGLOSE DE MÓDULOS (8 COLS) */}
        <div className="lg:col-span-8">
          {cursoSeleccionado ? (
            <div className={`border rounded-3xl overflow-hidden transition-all ${isDark ? 'bg-[#141211] border-stone-850' : 'bg-white border-stone-200 shadow-sm'}`}>
              
              {/* Header del Curso Seleccionado */}
              <div className={`p-6 border-b ${isDark ? 'border-stone-850 bg-stone-950/20' : 'bg-stone-50/50 border-stone-100'}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-rose-500 font-bold">Aula de Aprendizaje</span>
                    <h2 className={`text-xl font-serif italic ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>{cursoSeleccionado.title}</h2>
                    <p className="text-xs text-stone-400">Dictado por la especialista {cursoSeleccionado.instructor} — {cursoSeleccionado.totalHoras} totales.</p>
                  </div>
                  {cursoSeleccionado.progreso === 100 && (
                    <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-lg border border-emerald-500/20 text-[10px] font-mono uppercase font-bold">
                      <Award className="w-3.5 h-3.5" /> Diploma Disponible
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de Módulos (Acordeones LMS Reales) */}
              <div className="p-6 space-y-4">
                <p className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>Contenido Estructurado del Curso</p>
                
                {cursoSeleccionado.modulos.map((modulo) => {
                  const esAbierto = moduloAbierto === modulo.id
                  return (
                    <div key={modulo.id} className={`border rounded-2xl overflow-hidden transition-all ${isDark ? 'border-stone-850 bg-stone-900/10' : 'border-stone-200 bg-stone-50/20'}`}>
                      {/* Botón Acordeón */}
                      <div 
                        onClick={() => setModuloAbierto(esAbierto ? null : modulo.id)}
                        className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isDark ? 'hover:bg-stone-900/40' : 'hover:bg-stone-50'}`}
                      >
                        <div className="flex items-center gap-3 pr-2">
                          <BarChart3 className="w-4 h-4 text-rose-400 shrink-0" />
                          <h3 className={`text-xs sm:text-sm font-medium tracking-tight ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{modulo.title}</h3>
                        </div>
                        {esAbierto ? <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />}
                      </div>

                      {/* Lista de Lecciones del Módulo */}
                      {esAbierto && (
                        <div className={`border-t p-2 space-y-1 ${isDark ? 'border-stone-850 bg-stone-950/30' : 'border-stone-100 bg-white'}`}>
                          {modulo.lecciones.map((leccion) => (
                            <div 
                              key={leccion.id} 
                              className={`flex items-center justify-between p-3 rounded-xl text-xs transition-all ${
                                leccion.isLocked 
                                  ? 'opacity-40 cursor-not-allowed' 
                                  : isDark ? 'hover:bg-stone-900/50 cursor-pointer' : 'hover:bg-stone-50 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {leccion.isLocked ? (
                                  <Lock className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                                ) : leccion.isCompleted ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                ) : (
                                  <PlayCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                )}
                                <span className={`truncate ${leccion.isCompleted ? 'text-stone-400 dark:text-stone-500 line-through' : (isDark ? 'text-stone-300' : 'text-stone-700')}`}>
                                  {leccion.title}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] text-stone-400 shrink-0 ml-4">{leccion.duration}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

            </div>
          ) : (
            <div className={`text-center py-16 border border-dashed rounded-3xl ${isDark ? 'border-stone-800 bg-stone-950/10' : 'border-stone-200 bg-stone-50/50'}`}>
              <Bookmark className="w-8 h-8 text-stone-600 mx-auto mb-3 stroke-[1.2]" />
              <p className="text-sm text-stone-400 italic">Selecciona un curso de tu panel para abrir el aula virtual.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
