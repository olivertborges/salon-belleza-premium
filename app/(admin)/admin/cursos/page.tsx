'use client'

import React, { useState } from 'react'
import { 
  GraduationCap, Plus, Search, Users, Calendar, 
  DollarSign, BookOpen, Edit, Trash2, CheckCircle2 
} from 'lucide-react'

// Definimos la estructura estricta del Curso para TypeScript
interface Curso {
  id: number
  title: string
  instructor: string
  startDate: string
  price: number
  enrolled: number
  capacity: number
  status: 'Inscripciones Abiertas' | 'En Curso' | 'Finalizado'
  modality: 'Presencial' | 'Online Live'
}

const cursosIniciales: Curso[] = [
  {
    id: 1,
    title: 'Masterclass: Manicuría Rusa Combinada & Capping Gel',
    instructor: 'Valeria Gómez',
    startDate: '2026-07-12',
    price: 8500,
    enrolled: 12,
    capacity: 15,
    status: 'Inscripciones Abiertas',
    modality: 'Presencial'
  },
  {
    id: 2,
    title: 'Especialización en Nail Art Avanzado & Trazo Fino',
    instructor: 'Camila Rodríguez',
    startDate: '2026-07-20',
    price: 6200,
    enrolled: 8,
    capacity: 20,
    status: 'Inscripciones Abiertas',
    modality: 'Online Live'
  },
  {
    id: 3,
    title: 'Taller Inicial: Extensiones en Soft Gel y Polygel',
    instructor: 'Valeria Gómez',
    startDate: '2026-06-10',
    price: 9800,
    enrolled: 10,
    capacity: 10,
    status: 'En Curso',
    modality: 'Presencial'
  }
]

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>(cursosIniciales)
  const [search, setSearch] = useState<string>('')

  // Filtrado
  const filtrados = cursos.filter((c: Curso) => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.instructor.toLowerCase().includes(search.toLowerCase())
  )

  // Métricas
  const totalAlumnas = cursos.reduce((sum: number, c: Curso) => sum + c.enrolled, 0)
  const ingresosProyectados = cursos.reduce((sum: number, c: Curso) => sum + (c.enrolled * c.price), 0)

  return (
    <div className="space-y-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-950/40 via-stone-900/40 to-[#0e0c0b] border border-fuchsia-500/20 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-fuchsia-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-fuchsia-400 font-mono">🎓 Academy & Workshops</p>
            <h2 className="text-2xl font-serif italic text-white mt-1">Academia Fresh Nails</h2>
            <p className="text-xs text-stone-400 mt-1">Gestiona tus talleres, controla los cupos disponibles de estudiantes y analiza las ganancias por formación.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-medium transition-all shadow-lg shadow-fuchsia-600/10 self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            Nuevo Curso
          </button>
        </div>
      </div>

      {/* METRICAS DE LA ACADEMIA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Talleres Dictados / Activos</p>
            <span className="text-2xl font-mono font-bold text-stone-100 block mt-1">{cursos.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Alumnas Inscritas</p>
            <span className="text-2xl font-mono font-bold text-fuchsia-400 block mt-1">{totalAlumnas}</span>
          </div>
          <div className="p-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Caja Proyectada Academia</p>
            <span className="text-2xl font-mono font-bold text-emerald-400 block mt-1">
              ${ingresosProyectados.toLocaleString()}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTRO DE BUSQUEDA */}
      <div className="flex items-center bg-stone-900/40 border border-stone-900 rounded-xl px-4 py-3 max-w-md">
        <Search className="w-4 h-4 text-stone-500 shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar taller por temática o instructor..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-stone-200 placeholder-stone-500 w-full ml-3 font-sans"
        />
      </div>

      {/* GRILLA DE TARJETAS DE CURSOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtrados.map((curso: Curso) => {
          const porcentajeLleno = Math.round((curso.enrolled / curso.capacity) * 100)
          const esLleno = curso.enrolled === curso.capacity

          return (
            <div key={curso.id} className="rounded-2xl bg-[#0e0c0b] border border-stone-900 p-5 space-y-4 flex flex-col justify-between hover:border-fuchsia-500/20 transition-all group">
              
              {/* STATUS Y MODALIDAD */}
              <div className="flex justify-between items-center">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono border ${
                  curso.status === 'Inscripciones Abiertas' 
                    ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {curso.status}
                </span>
                <span className="text-[10px] text-stone-500 font-mono">{curso.modality}</span>
              </div>

              {/* TITULO E INSTRUCTOR */}
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-stone-200 group-hover:text-fuchsia-400 transition-colors line-clamp-2">
                  {curso.title}
                </h3>
                <p className="text-xs text-stone-500">Dictado por: <span className="text-stone-300 font-medium">{curso.instructor}</span></p>
              </div>

              {/* INFORMACIÓN CLAVE */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-900/60 text-[11px] font-mono text-stone-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-stone-600" />
                  <span>{curso.startDate}</span>
                </div>
                <div className="flex items-center justify-end font-bold text-stone-200 text-xs">
                  ${curso.price.toLocaleString()}
                </div>
              </div>

              {/* BARRA DE CAPACIDAD / ALUMNAS */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-stone-500">Cupos Reservados</span>
                  <span className={esLleno ? 'text-red-400' : 'text-stone-300'}>
                    {curso.enrolled} / {curso.capacity} {esLleno && '(Lleno)'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      esLleno ? 'bg-red-500' : 'bg-gradient-to-r from-fuchsia-600 to-purple-500'
                    }`}
                    style={{ width: `${porcentajeLleno}%` }}
                  ></div>
                </div>
              </div>

              {/* ACCIONES */}
              <div className="flex gap-2 pt-2 border-t border-stone-900/60">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 text-xs transition-all">
                  <Edit className="w-3.5 h-3.5" />
                  Editar Curso
                </button>
                <button className="px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-500 hover:text-red-400 hover:border-red-500/20 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )
        })}
      </div>

    </div>
  )
}