'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  FaArrowLeft, 
  FaGraduationCap, 
  FaClock, 
  FaUsers, 
  FaCertificate, 
  FaStar, 
  FaToggleOn, 
  FaToggleOff, 
  FaPlus, 
  FaTrashAlt, 
  FaSearch, 
  FaSparkles 
} from 'react-icons/fa'

export default function AcademyPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')

  // Catálogo base de formación profesional internacional
  const [cursos, setCursos] = useState([
    { id: 1, title: 'Uñas Básico & Anatomía', category: 'Uñas', level: 'Básico', price: 1200, duration: '40h', seats: '12 cupos', rating: '4.8', reviews: 156, desc: 'Aprende desde cero: anatomía ungueal, manicura rusa combinada, esculpido acrílico y esmaltado semipermanente. Incluye kit inicial.' },
    { id: 2, title: 'Uñas Avanzado & Esculpido Gel', category: 'Uñas', level: 'Intermedio', price: 2200, duration: '60h', seats: '10 cupos', rating: '4.9', reviews: 98, desc: 'Domina estructuras complejas, poligel, nail art avanzado en 3D y estrategias de monetización en salón. Incluye kit profesional.' },
    { id: 3, title: '👑 Uñas Master & Alta Competición', category: 'Uñas', level: 'Master', price: 3800, duration: '80h', seats: '8 cupos', rating: '5.0', reviews: 67, desc: 'Técnicas de salón de velocidad, estructuras extremas y perfeccionamiento internacional con instructores certificados.' },
    { id: 4, title: 'Fundamentos de Micropigmentación', category: 'Micropigmentación', level: 'Básico', price: 2500, duration: '50h', seats: '8 cupos', rating: '4.7', reviews: 112, desc: 'Bases críticas de colorimetría, bioseguridad, visajismo avanzado y prácticas intensivas sobre látex de alta densidad.' },
    { id: 5, title: 'Microblading Pro Pelo a Pelo', category: 'Micropigmentación', level: 'Intermedio', price: 3000, duration: '40h', seats: '8 cupos', rating: '4.9', reviews: 134, desc: 'Técnica de trazado hiperrealista manual, profundidad de implantación de pigmentos orgánicos y diseño adaptativo de cejas.' },
    { id: 6, title: 'Powder Brows & Efecto Sombreado', category: 'Micropigmentación', level: 'Avanzado', price: 3500, duration: '45h', seats: '8 cupos', rating: '4.9', reviews: 89, desc: 'Efecto Ombré y Pixelado con demógrafo. Coberturas, neutralización de cejas viradas y corrección de asimetrías.' },
  ])

  // Estados para simular la creación de nuevas ofertas educativas (Modo Admin)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('Uñas')
  const [newLevel, setNewLevel] = useState('Básico')
  const [newPrice, setNewPrice] = useState('')
  const [newDuration, setNewDuration] = useState('')

  const categories = ['Todos', 'Uñas', 'Micropigmentación']

  const filteredCursos = cursos.filter(c => {
    const matchesCategory = activeCategory === 'Todos' || c.category === activeCategory
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.level.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newPrice) return

    const nuevo = {
      id: Date.now(),
      title: newTitle,
      category: newCategory,
      level: newLevel,
      price: Number(newPrice),
      duration: newDuration || '40h',
      seats: '8 cupos',
      rating: '5.0',
      reviews: 1,
      desc: 'Formación de élite diseñada para capacitar profesionales del sector estético con altos estándares técnicos.'
    }

    setCursos([nuevo, ...cursos])
    setNewTitle('')
    setNewPrice('')
    setNewDuration('')
  }

  const handleDeleteCourse = (id: number) => {
    if (confirm('¿Seguro que deseas dar de baja este programa de la oferta académica?')) {
      setCursos(cursos.filter(c => c.id !== id))
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 pb-20 overflow-x-hidden">
      
      {/* Top Navbar */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-40 flex items-center justify-between">
        <Link href="/" className="text-slate-400 flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium">
          <FaArrowLeft className="text-rose-400" /> Volver al Inicio
        </Link>
        <button 
          onClick={() => setIsAdmin(!isAdmin)} 
          className="flex items-center gap-2 text-[10px] bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 tracking-widest uppercase text-slate-300 active:scale-95 transition-all"
        >
          {isAdmin ? <FaToggleOn className="text-rose-400 text-sm" /> : <FaToggleOff className="text-slate-500 text-sm" />}
          Academia: {isAdmin ? 'Gestión Bedelía' : 'Portal Alumno'}
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        
        {/* Hero Header */}
        <div className="mb-6 text-center pt-2">
          <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1 rounded-full font-bold mb-3">
            <FaGraduationCap /> Certificación Internacional
          </span>
          <h1 className="text-3xl font-light text-slate-100 tracking-tight leading-none">
            Convierte tu Pasión <br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400">en una Profesión</span>
          </h1>
          <p className="text-slate-400 text-xs font-light mt-2 px-2">Escuela de alta especialización técnica. Aprende protocolos estéticos avanzados de la mano de trainers internacionales.</p>
        </div>

        {/* BUSCADOR Y FILTROS INTEGRADOS */}
        <div className="space-y-3 mb-6">
          <div className="flex bg-slate-950 border border-slate-850 rounded-2xl p-3 items-center gap-2 shadow-inner">
            <FaSearch className="text-slate-600 text-xs ml-1" />
            <input 
              type="text" 
              placeholder="Buscar curso, nivel (ej: Master)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-slate-200 text-xs flex-1 outline-none font-light"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-tight whitespace-nowrap transition-all border ${
                  activeCategory === cat 
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white border-transparent font-bold' 
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* MODAL / PANEL DE AGREGAR CURSOS (MODO ADMIN) */}
        {isAdmin && (
          <div className="bg-slate-900 border-2 border-dashed border-rose-500/30 p-5 rounded-3xl shadow-xl mb-6 animate-in slide-in-from-top-4 duration-300">
            <h2 className="text-xs uppercase tracking-wider font-bold text-rose-400 flex items-center gap-1.5 mb-3">
              <FaSparkles /> Apertura de Nueva Matrícula
            </h2>
            <form onSubmit={handleCreateCourse} className="space-y-3">
              <input 
                type="text"
                placeholder="Nombre de la Especialidad Académica"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-slate-100 font-medium"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={newCategory} 
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="Uñas">Uñas</option>
                  <option value="Micropigmentación">Micropigmentación</option>
                </select>
                <select 
                  value={newLevel} 
                  onChange={(e) => setNewLevel(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="Básico">Básico</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                  <option value="Master">Master</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="number" 
                  placeholder="Inversión ($)"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                  required
                />
                <input 
                  type="text" 
                  placeholder="Carga horaria (ej: 40h)"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5"
              >
                <FaPlus /> Publicar Matrícula
              </button>
            </form>
          </div>
        )}

        {/* FEED DE PROGRAMAS ACADÉMICOS DE ÉLITE */}
        <div className="space-y-4">
          {filteredCursos.map((curso) => (
            <div 
              key={curso.id}
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden group hover:border-slate-700/60"
            >
              {/* Encabezado del Curso */}
              <div className="flex justify-between items-start mb-2.5">
                <div className="space-y-1">
                  <div className="flex gap-1.5">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-slate-400">
                      {curso.category}
                    </span>
                    <span className={`text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded text-white ${
                      curso.level === 'Master' ? 'bg-amber-500/80' : 'bg-rose-500/80'
                    }`}>
                      {curso.level}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-100 tracking-tight pt-1">{curso.title}</h3>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">
                    ${curso.price}
                  </div>
                </div>
              </div>

              {/* Sinopsis del Programa */}
              <p className="text-[11px] text-slate-400 font-light leading-relaxed mb-4">{curso.desc}</p>

              {/* Footer de Tarjeta Académica */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-850/60">
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><FaClock className="text-rose-500/70" /> {curso.duration}</span>
                  <span className="flex items-center gap-1"><FaUsers className="text-amber-500/70" /> {curso.seats}</span>
                </div>

                {isAdmin ? (
                  <button 
                    onClick={() => handleDeleteCourse(curso.id)}
                    className="text-slate-600 hover:text-rose-400 p-2 text-xs transition-colors"
                    title="Baja de Curso"
                  >
                    <FaTrashAlt />
                  </button>
                ) : (
                  <Link 
                    href={`https://wa.me/59899000000?text=Hola,%20solicito%20información%20y%20temario%20completo%20del%20curso:%20${encodeURIComponent(curso.title)}`}
                    target="_blank"
                    className="bg-slate-950 border border-slate-800 text-slate-300 font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl hover:bg-slate-900 active:scale-95 transition-all flex items-center gap-1"
                  >
                    <FaCertificate className="text-rose-400" /> Consultar
                  </Link>
                )}
              </div>
            </div>
          ))}

          {filteredCursos.length === 0 && (
            <p className="text-center text-xs text-slate-500 py-12 font-light">No hay módulos académicos que coincidan con el filtro actual.</p>
          )}
        </div>

      </div>
    </main>
  )
}
