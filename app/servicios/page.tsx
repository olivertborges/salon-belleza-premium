'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  FaArrowLeft, 
  FaClock, 
  FaTag, 
  FaCalendarPlus, 
  FaToggleOn, 
  FaToggleOff, 
  FaPlus, 
  FaTrashAlt,
  FaSparkles
} from 'react-icons/fa'

export default function ServiciosPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Todos')

  // Catálogo base de servicios estéticos profesionales
  const [servicios, setServicios] = useState([
    { id: 1, title: 'Microblading Hiperrealista', category: 'Cejas', price: 180, duration: '120 min', desc: 'Diseño pelo a pelo adaptado a tus facciones naturales con pigmentos orgánicos.' },
    { id: 2, title: 'Lifting + Queratina Infusion', category: 'Pestañas', price: 55, duration: '60 min', desc: 'Elevación e hidratación profunda para tus pestañas naturales desde la raíz.' },
    { id: 3, title: 'Micropigmentación Labial', category: 'Labios', price: 210, duration: '150 min', desc: 'Efecto acuarela o labial diario para definir y dar un rubor saludable permanente.' },
    { id: 4, title: 'Laminado de Cejas (Brows)', category: 'Cejas', price: 45, duration: '45 min', desc: 'Peinado, fijación y diseño semipermanente para unas cejas más dóciles y visualmente pobladas.' },
    { id: 5, title: 'Extensión de Pestañas Volumen', category: 'Pestañas', price: 90, duration: '90 min', desc: 'Aplicación de abanicos artesanales para un efecto denso, oscuro y de mirada impactante.' },
  ])

  // Estados para simular la creación de un nuevo servicio en modo admin
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('Cejas')
  const [newPrice, setNewPrice] = useState('')
  const [newDuration, setNewDuration] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const categories = ['Todos', 'Cejas', 'Pestañas', 'Labios']

  const filteredServicios = activeCategory === 'Todos' 
    ? servicios 
    : servicios.filter(s => s.category === activeCategory)

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newPrice) return

    const nuevo = {
      id: Date.now(),
      title: newTitle,
      category: newCategory,
      price: Number(newPrice),
      duration: newDuration || '60 min',
      desc: newDesc || 'Descripción personalizada del nuevo tratamiento estético premium.'
    }

    setServicios([nuevo, ...servicios])
    setNewTitle('')
    setNewPrice('')
    setNewDuration('')
    setNewDesc('')
  }

  const handleDeleteService = (id: number) => {
    if(confirm('¿Seguro que deseas eliminar este servicio de la vitrina?')) {
      setServicios(servicios.filter(s => s.id !== id))
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 pb-20 overflow-x-hidden">
      
      {/* Top Navbar de navegación */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-40 flex items-center justify-between">
        <Link href="/" className="text-slate-400 flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium">
          <FaArrowLeft className="text-rose-400" /> Volver
        </Link>
        <button 
          onClick={() => setIsAdmin(!isAdmin)} 
          className="flex items-center gap-2 text-[10px] bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 tracking-widest uppercase text-slate-300 active:scale-95 transition-all"
        >
          {isAdmin ? <FaToggleOn className="text-rose-400 text-sm" /> : <FaToggleOff className="text-slate-500 text-sm" />}
          Menú: {isAdmin ? 'Gestión' : 'Catálogo'}
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        
        {/* Cabecera de la vista */}
        <div className="mb-6">
          <h1 className="text-2xl font-light text-slate-100 tracking-tight">
            Nuestros <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400">Servicios</span>
          </h1>
          <p className="text-slate-400 text-xs font-light mt-1">Tratamientos estéticos avanzados diseñados para resaltar tu belleza natural de forma sofisticada.</p>
        </div>

        {/* MODAL / PANEL DE AGREGAR SERVICIOS (MODO ADMIN) */}
        {isAdmin && (
          <div className="bg-slate-900 border-2 border-dashed border-rose-500/30 p-5 rounded-3xl shadow-xl mb-6 animate-in slide-in-from-top-4 duration-300">
            <h2 className="text-xs uppercase tracking-wider font-bold text-rose-400 flex items-center gap-1.5 mb-3">
              <FaSparkles /> Añadir Nuevo Servicio Corporativo
            </h2>
            <form onSubmit={handleCreateService} className="space-y-3">
              <input 
                type="text"
                placeholder="Nombre del tratamiento (ej: Brow Lamination)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400 text-slate-100 font-medium"
                required
              />
              <div className="grid grid-cols-3 gap-2">
                <select 
                  value={newCategory} 
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="Cejas">Cejas</option>
                  <option value="Pestañas">Pestañas</option>
                  <option value="Labios">Labios</option>
                </select>
                <input 
                  type="number" 
                  placeholder="Precio ($)"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                  required
                />
                <input 
                  type="text" 
                  placeholder="Duración (ej: 60 min)"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>
              <textarea 
                placeholder="Breve descripción del beneficio clínico o cosmético..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none h-16 resize-none text-slate-300"
              />
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-[0.99] transition-transform flex items-center justify-center gap-1.5 shadow-lg"
              >
                <FaPlus /> Publicar en Vitrina
              </button>
            </form>
          </div>
        )}

        {/* CINTA DE FILTROS POR CATEGORÍA */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 mask-image-right">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium tracking-tight whitespace-nowrap transition-all border ${
                activeCategory === cat 
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white border-transparent font-bold shadow-md shadow-rose-500/10' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* LISTADO DE SERVICIOS DINÁMICOS */}
        <div className="space-y-4 mt-2">
          {filteredServicios.map((servicio) => (
            <div 
              key={servicio.id}
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden group hover:border-slate-700/60"
            >
              <div className="flex justify-between items-start mb-1.5">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-bold bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-md text-slate-400">
                    {servicio.category}
                  </span>
                  <h3 className="font-bold text-sm text-slate-100 tracking-tight mt-1.5">{servicio.title}</h3>
                </div>
                
                {/* PRECIO DESTACADO */}
                <div className="text-right">
                  <div className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">
                    ${servicio.price}
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <p className="text-[11px] text-slate-400 font-light leading-relaxed mb-4">{servicio.desc}</p>

              {/* Footer de Tarjeta: Info Técnica + Acción */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-850/60">
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><FaClock className="text-rose-500/70" /> {servicio.duration}</span>
                  <span className="flex items-center gap-1"><FaTag className="text-amber-500/70" /> Cabina Individual</span>
                </div>

                {isAdmin ? (
                  <button 
                    onClick={() => handleDeleteService(servicio.id)}
                    className="text-slate-600 hover:text-rose-400 p-2 text-xs transition-colors"
                    title="Eliminar Servicio"
                  >
                    <FaTrashAlt />
                  </button>
                ) : (
                  <Link 
                    href={`/reservas?servicio=${encodeURIComponent(servicio.title)}`}
                    className="bg-slate-950 border border-slate-800 text-slate-300 font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl hover:bg-slate-900 active:scale-95 transition-all flex items-center gap-1"
                  >
                    <FaCalendarPlus className="text-rose-400" /> Agendar
                  </Link>
                )}
              </div>
            </div>
          ))}

          {filteredServicios.length === 0 && (
            <p className="text-center text-xs text-slate-500 py-8">No hay tratamientos disponibles en esta categoría en este momento.</p>
          )}
        </div>

      </div>
    </main>
  )
}
