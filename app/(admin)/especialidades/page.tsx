'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FaArrowLeft, FaCrown, FaPlus, FaSearch, FaToggleOff, FaToggleOn, FaTrashAlt } from 'react-icons/fa'
import { Sparkles } from 'lucide-react'

export default function EspecialidadesPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Catálogo de especialidades premium exclusivas del salón
  const [especialidades, setEspecialidades] = useState([
    { id: 1, title: 'Reconstrucción de Cejas Alopécicas', duration: '150 min', price: 240, desc: 'Protocolo avanzado de diseño capilar combinando Microblading y sombreado nanométrico para cejas con pérdida total o cicatrices.' },
    { id: 2, title: 'Neutralización de Labios Oscuros', duration: '120 min', price: 220, desc: 'Especialidad clínica de colorimetría para corregir tonos melánicos, violáceos o asimétricos, logrando un fondo rosado natural y saludable.' },
    { id: 3, title: 'Arquitectura de Mirada con Megavolumen', duration: '120 min', price: 110, desc: 'Diseño personalizado de abanicos ultrafinos de alta densidad respetando rigurosamente la salud y fase de crecimiento de la pestaña natural.' },
  ])

  // Estados para simular la creación de especialidades en modo administración
  const [newTitle, setNewTitle] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newDuration, setNewDuration] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const filteredEspecialidades = especialidades.filter(esp => 
    esp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    esp.desc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateEspecialidad = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newPrice) return

    const nueva = {
      id: Date.now(),
      title: newTitle,
      price: Number(newPrice),
      duration: newDuration || '60 min',
      desc: newDesc || 'Tratamiento exclusivo de autor desarrollado bajo estándares internacionales de estética avanzada.'
    }

    setEspecialidades([nueva, ...especialidades])
    setNewTitle('')
    setNewPrice('')
    setNewDuration('')
    setNewDesc('')
  }

  const handleDeleteEspecialidad = (id: number) => {
    if (confirm('¿Seguro que deseas retirar esta especialidad exclusiva de la cartilla?')) {
      setEspecialidades(especialidades.filter(esp => esp.id !== id))
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 pb-20 overflow-x-hidden">
      
      {/* Top Navbar */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-40 flex items-center justify-between">
        <Link href="/" className="text-slate-400 flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium">
          <FaArrowLeft className="text-rose-400" /> Volver
        </Link>
        <button 
          onClick={() => setIsAdmin(!isAdmin)} 
          className="flex items-center gap-2 text-[10px] bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 tracking-widest uppercase text-slate-300 active:scale-95 transition-all"
        >
          {isAdmin ? <FaToggleOn className="text-rose-400 text-sm" /> : <FaToggleOff className="text-slate-500 text-sm" />}
          Menú: {isAdmin ? 'Configuración' : 'Servicios VIP'}
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        
        {/* Cabecera */}
        <div className="mb-6">
          <h1 className="text-2xl font-light text-slate-100 tracking-tight">
            Técnicas de <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400">Especialidad</span>
          </h1>
          <p className="text-slate-400 text-xs font-light mt-1">Tratamientos firma de autor y protocolos avanzados que requieren certificación máster internacional.</p>
        </div>

        {/* BUSCADOR */}
        <div className="flex bg-slate-950 border border-slate-850 rounded-2xl p-3 items-center gap-2 mb-6 shadow-inner">
          <FaSearch className="text-slate-600 text-xs ml-1" />
          <input 
            type="text" 
            placeholder="Buscar especialidad de autor..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-slate-200 text-xs flex-1 outline-none font-light"
          />
        </div>

        {/* MODAL / PANEL DE AGREGAR (MODO ADMIN) */}
        {isAdmin && (
          <div className="bg-slate-900 border-2 border-dashed border-rose-500/30 p-5 rounded-3xl shadow-xl mb-6 animate-in slide-in-from-top-4 duration-300">
            <h2 className="text-xs uppercase tracking-wider font-bold text-rose-400 flex items-center gap-1.5 mb-3">
              <FaCrown /> Dar de Alta Técnica de Autor
            </h2>
            <form onSubmit={handleCreateEspecialidad} className="space-y-3">
              <input 
                type="text"
                placeholder="Nombre de la Especialidad Premium"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-slate-100 font-medium"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="number" 
                  placeholder="Precio Firma ($)"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                  required
                />
                <input 
                  type="text" 
                  placeholder="Tiempo (ej: 120 min)"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>
              <textarea 
                placeholder="Describe el protocolo, la complejidad técnica y los resultados que ofrece este servicio de alta gama..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none h-16 resize-none text-slate-300"
              />
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-[0.99] transition-transform flex items-center justify-center gap-1.5 shadow-lg"
              >
                <FaPlus /> Publicar Especialidad
              </button>
            </form>
          </div>
        )}

        {/* FEED DE TARJETAS DE ESPECIALIDADES */}
        <div className="space-y-4">
          {filteredEspecialidades.map((esp) => (
            <div 
              key={esp.id}
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700/60"
            >
              {/* Encabezado */}
              <div className="flex justify-between items-start mb-2">
                <div className="max-w-[75%]">
                  <div className="flex items-center gap-1 text-[9px] text-amber-400 font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md w-fit">
                    <FaCrown className="text-[8px]" /> Master Signature
                  </div>
                  <h3 className="font-bold text-sm text-slate-100 tracking-tight mt-1.5">{esp.title}</h3>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">
                    ${esp.price}
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <p className="text-[11px] text-slate-400 font-light leading-relaxed mb-4">{esp.desc}</p>

              {/* Acciones e Info Técnica */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-850/60">
                <span className="text-[10px] text-slate-500 font-mono">Duración: {esp.duration}</span>

                {isAdmin ? (
                  <button 
                    onClick={() => handleDeleteEspecialidad(esp.id)}
                    className="text-slate-600 hover:text-rose-400 p-2 text-xs transition-colors"
                    title="Retirar Técnica"
                  >
                    <FaTrashAlt />
                  </button>
                ) : (
                  <Link 
                    href={`/reservas?servicio=${encodeURIComponent(esp.title)}`}
                    className="bg-slate-950 border border-slate-800 text-slate-300 font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl hover:bg-slate-900 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <FaSparkles className="text-amber-400" /> Agendar Firma
                  </Link>
                )}
              </div>
            </div>
          ))}

          {filteredEspecialidades.length === 0 && (
            <p className="text-center text-xs text-slate-500 py-12 font-light">No encontramos técnicas bajo ese término de búsqueda.</p>
          )}
        </div>

      </div>
    </main>
  )
}
