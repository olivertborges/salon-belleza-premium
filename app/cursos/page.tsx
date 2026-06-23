'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  FaArrowLeft, 
  FaGraduationCap, 
  FaClock, 
  FaAward, 
  FaPlus, 
  FaTrash, 
  FaEdit, 
  FaToggleOn, 
  FaToggleOff,
  FaFire,
  FaBookOpen,
  FaSave,
  FaTimes
} from 'react-icons/fa'

export default function CursosPage() {
  // Switch táctil de administración para simular el panel del staff
  const [isAdmin, setIsAdmin] = useState(false)

  // Listado de capacitaciones simuladas (listo para conectar a tu tabla 'courses' en Supabase)
  const [cursos, setCursos] = useState([
    { id: 1, title: 'Masterclass Micropigmentación Labial', price: 350, duration: 16, level: 'Avanzado', spots: 3, totalSpots: 8, desc: 'Aprende la técnica de efecto acuarela y neutralización de labios oscuros paso a paso con práctica real.' },
    { id: 2, title: 'Iniciación al Microblading de Cejas', price: 499, duration: 24, level: 'Principiante', spots: 2, totalSpots: 6, desc: 'Aprende diseño morfológico, trazado hiperrealista en piel sintética y bioseguridad desde cero.' },
    { id: 3, title: 'Especialista en Uñas Acrílicas & Polygel', price: 190, duration: 12, level: 'Intermedio', spots: 5, totalSpots: 10, desc: 'Dominio de moldes, reversas perfectas, limado estructural y las últimas tendencias de Nail Art comercial.' }
  ])

  // Estados del Modal de Administración
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formDuration, setFormDuration] = useState('')
  const [formLevel, setFormLevel] = useState('Principiante')
  const [formSpots, setFormSpots] = useState('')
  const [formDesc, setFormDesc] = useState('')

  const abrirAgregar = () => {
    setEditingId(null)
    setFormTitle('')
    setFormPrice('')
    setFormDuration('')
    setFormLevel('Principiante')
    setFormSpots('6')
    setFormDesc('')
    setShowModal(true)
  }

  const abrirEditar = (curso: any) => {
    setEditingId(curso.id)
    setFormTitle(curso.title)
    setFormPrice(curso.price.toString())
    setFormDuration(curso.duration.toString())
    setFormLevel(curso.level)
    setFormSpots(curso.spots.toString())
    setFormDesc(curso.desc)
    setShowModal(true)
  }

  const guardarCurso = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      setCursos(cursos.map(c => c.id === editingId ? {
        ...c,
        title: formTitle,
        price: Number(formPrice),
        duration: Number(formDuration),
        level: formLevel,
        spots: Number(formSpots),
        desc: formDesc
      } : c))
    } else {
      setCursos([...cursos, {
        id: Date.now(),
        title: formTitle,
        price: Number(formPrice),
        duration: Number(formDuration),
        level: formLevel,
        spots: Number(formSpots),
        totalSpots: Number(formSpots),
        desc: formDesc
      }])
    }
    setShowModal(false)
  }

  const eliminarCurso = (id: number) => {
    if (confirm('¿Seguro que deseas eliminar esta capacitación del catálogo académico?')) {
      setCursos(cursos.filter(c => c.id !== id))
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 pb-20 overflow-x-hidden">
      
      {/* Control de Modo de Navegación */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-40 flex items-center justify-between">
        <Link href="/" className="text-slate-400 flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium">
          <FaArrowLeft className="text-rose-400" /> Volver
        </Link>
        <button 
          onClick={() => setIsAdmin(!isAdmin)} 
          className="flex items-center gap-2 text-[10px] bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 tracking-widest uppercase text-slate-300 active:scale-95 transition-all"
        >
          {isAdmin ? <FaToggleOn className="text-rose-400 text-sm" /> : <FaToggleOff className="text-slate-500 text-sm" />}
          Panel: {isAdmin ? 'Academia Admin' : 'Estudiante'}
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        
        {/* Encabezado Principal */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-light text-slate-100 tracking-tight">
              Premium <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400">Academy</span>
            </h1>
            <p className="text-slate-400 text-xs font-light mt-1">Capasítate con los mejores expertos del sector estético.</p>
          </div>
          {isAdmin && (
            <button 
              onClick={abrirAgregar}
              className="bg-gradient-to-r from-rose-500 to-amber-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform animate-in fade-in zoom-in-50"
            >
              <FaPlus />
            </button>
          )}
        </div>

        {/* Tarjetas de Cursos Academicos */}
        <div className="space-y-4">
          {cursos.map((curso) => {
            const porcentajeCupos = (curso.spots / curso.totalSpots) * 100
            const ultimosCupos = curso.spots <= 3

            return (
              <div 
                key={curso.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden group animate-in fade-in duration-300"
              >
                {/* Cabecera Interna de la Tarjeta */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider bg-slate-950 text-amber-400 border border-slate-800 px-2 py-0.5 rounded-md font-bold">
                      {curso.level}
                    </span>
                    {ultimosCupos && (
                      <span className="text-[9px] uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 animate-pulse">
                        <FaFire className="text-[8px]" /> ¡Últimos Cupos!
                      </span>
                    )}
                  </div>

                  {/* Controles de Edición */}
                  {isAdmin && (
                    <div className="flex gap-1.5 z-10">
                      <button onClick={() => abrirEditar(curso)} className="text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-xs active:scale-90 transition-all">
                        <FaEdit />
                      </button>
                      <button onClick={() => eliminarCurso(curso.id)} className="text-rose-500 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 text-xs active:scale-90 transition-all">
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>

                {/* Título y Detalles */}
                <h3 className="font-bold text-base text-slate-100 tracking-tight leading-snug group-hover:text-rose-400 transition-colors">{curso.title}</h3>
                <p className="text-slate-400 text-xs font-light mt-1.5 leading-relaxed">{curso.desc}</p>

                {/* Info de Duración y Certificado */}
                <div className="flex gap-4 my-4 text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1"><FaClock className="text-amber-400" /> {curso.duration} horas intensivas</span>
                  <span className="flex items-center gap-1"><FaAward className="text-rose-400" /> Certificación avalada</span>
                </div>

                {/* Barra de Progreso de Cupos */}
                <div className="space-y-1 mt-2 mb-4">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Inscripciones abiertas</span>
                    <span className="font-bold text-slate-300">Quedan {curso.spots} de {curso.totalSpots} lugares</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden p-[2px] border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${ultimosCupos ? 'bg-gradient-to-r from-rose-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                      style={{ width: `${porcentajeCupos}%` }}
                    />
                  </div>
                </div>

                {/* Precio e Inscripción Directa */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-800/60">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-light">Costo de Matrícula</span>
                    <span className="text-xl font-black bg-gradient-to-r from-rose-400 to-amber-400 text-transparent bg-clip-text">${curso.price}</span>
                  </div>
                  <a 
                    href={`https://wa.me/1234567890?text=Hola!%20Me%20interesa%20inscribirme%20en%20el%20curso:%20${encodeURIComponent(curso.title)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-slate-100 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-md flex items-center gap-1"
                  >
                    <FaBookOpen /> Comprar Cupo
                  </a>
                </div>

              </div>
            )
          })}
        </div>
      </div>

      {/* FORMULARIO EDITAR / AGREGAR CURSO (MODAL FLUIDO) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
          <form 
            onSubmit={guardarCurso}
            className="w-full max-w-md bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-sm uppercase tracking-wider font-bold flex items-center gap-2">
                <FaGraduationCap className="text-amber-400" /> {editingId ? 'Editar Capacitación' : 'Nueva Capacitación Académica'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 p-1 text-sm"><FaTimes /></button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Título del Curso</label>
              <input 
                type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ej. Masterclass Avanzada de Cejas"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-100 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Precio de Matrícula ($)</label>
                <input 
                  type="number" required value={formPrice} onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="350"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-100 font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Horas Académicas</label>
                <input 
                  type="number" required value={formDuration} onChange={(e) => setFormDuration(e.target.value)}
                  placeholder="16"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-100 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Nivel</label>
                <select 
                  value={formLevel} onChange={(e) => setFormLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none text-gray-200 font-medium"
                >
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Cupos Disponibles</label>
                <input 
                  type="number" required value={formSpots} onChange={(e) => setFormSpots(e.target.value)}
                  placeholder="6"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-100 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Temario / Descripción</label>
              <textarea 
                rows={3} required value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Indica qué aprenderán tus alumnas..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-100 font-light leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <FaSave /> Confirmar Curso
            </button>
          </form>
        </div>
      )}

    </main>
  )
}
