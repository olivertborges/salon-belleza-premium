'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  FaArrowLeft, 
  FaCamera, 
  FaToggleOn, 
  FaToggleOff, 
  FaPlus, 
  FaTrashAlt, 
  FaEye, 
  FaSparkles 
} from 'react-icons/fa'

export default function GaleriaPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeFilter, setActiveFilter] = useState('Todos')

  // Portafolio de trabajos simulado (Imágenes premium de Unsplash optimizadas para estética)
  const [trabajos, setTrabajos] = useState([
    { id: 1, title: 'Microblading Hiperrealista', category: 'Cejas', tag: 'Antes/Después', img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
    { id: 2, title: 'Volumen Ruso Premium', category: 'Pestañas', tag: 'Efecto Rímel', img: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=600&q=80' },
    { id: 3, title: 'Micropigmentación Efecto Acuarela', category: 'Labios', tag: 'Full Lip Tint', img: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80' },
    { id: 4, title: 'Diseño y Laminado Completo', category: 'Cejas', tag: 'Brows On Fleek', img: 'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?auto=format&fit=crop&w=600&q=80' },
    { id: 5, title: 'Lifting de Pestañas + Tinte', category: 'Pestañas', tag: 'Curvatura Natural', img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80' },
  ])

  // Estados para simular la carga de un nuevo trabajo en el feed
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('Cejas')
  const [newTag, setNewTag] = useState('')
  const [newImg, setNewImg] = useState('')

  const filters = ['Todos', 'Cejas', 'Pestañas', 'Labios']

  const filteredTrabajos = activeFilter === 'Todos' 
    ? trabajos 
    : trabajos.filter(t => t.category === activeFilter)

  const handleUploadWork = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle) return

    const nuevoTrabajo = {
      id: Date.now(),
      title: newTitle,
      category: newCategory,
      tag: newTag || 'Diseño Premium',
      img: newImg || 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=600&q=80'
    }

    setTrabajos([nuevoTrabajo, ...trabajos])
    setNewTitle('')
    setNewTag('')
    setNewImg('')
  }

  const handleDeleteWork = (id: number) => {
    if(confirm('¿Deseas retirar esta transformación del catálogo visual?')) {
      setTrabajos(trabajos.filter(t => t.id !== id))
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
          Panel: {isAdmin ? 'Carga Real' : 'Galería'}
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        
        {/* Encabezado */}
        <div className="mb-6">
          <h1 className="text-2xl font-light text-slate-100 tracking-tight">
            Casos de <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400">Éxito Visual</span>
          </h1>
          <p className="text-slate-400 text-xs font-light mt-1">Resultados reales y minuciosos de nuestras pacientes tras salir de cabina.</p>
        </div>

        {/* MODO ADMIN: SUBIR FOTO DESDE EL MOVIL EN CABINA */}
        {isAdmin && (
          <div className="bg-slate-900 border-2 border-dashed border-rose-500/30 p-5 rounded-3xl shadow-xl mb-6 animate-in slide-in-from-top-4 duration-300">
            <h2 className="text-xs uppercase tracking-wider font-bold text-rose-400 flex items-center gap-1.5 mb-3">
              <FaCamera /> Subir Evidencia Fotográfica
            </h2>
            <form onSubmit={handleUploadWork} className="space-y-3">
              <input 
                type="text"
                placeholder="Título del Caso (ej: Efecto Híbrido HD)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400 text-slate-100 font-medium"
                required
              />
              <div className="grid grid-cols-2 gap-2">
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
                  type="text" 
                  placeholder="Efecto / Técnica (ej: Ombré)"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>
              <input 
                type="url" 
                placeholder="URL de la imagen (dejar en blanco para demo)"
                value={newImg}
                onChange={(e) => setNewImg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-slate-300 font-mono"
              />
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-[0.99] transition-transform flex items-center justify-center gap-1.5 shadow-lg"
              >
                <FaPlus /> Añadir al Portafolio
              </button>
            </form>
          </div>
        )}

        {/* CINTA DE FILTROS TÁCTILES */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-medium tracking-tight whitespace-nowrap transition-all border ${
                activeFilter === f 
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white border-transparent font-bold shadow-md shadow-rose-500/10' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* FEED DE IMÁGENES TIPO GRID PREMIUM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {filteredTrabajos.map((trabajo) => (
            <div 
              key={trabajo.id} 
              className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden group shadow-xl relative"
            >
              {/* Contenedor de Imagen con Relación de Aspecto Fija */}
              <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                <img 
                  src={trabajo.img} 
                  alt={trabajo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  loading="lazy"
                />
                
                {/* Badge Flotante Superior */}
                <div className="absolute top-3 left-3 flex gap-1.5 items-center">
                  <span className="text-[8px] tracking-wider uppercase font-extrabold bg-slate-950/80 backdrop-blur-md text-slate-200 px-2 py-0.5 rounded border border-slate-800">
                    {trabajo.category}
                  </span>
                  <span className="text-[8px] tracking-wider uppercase font-extrabold bg-rose-500/90 text-white px-2 py-0.5 rounded shadow-sm">
                    {trabajo.tag}
                  </span>
                </div>

                {/* Acciones de administración flotantes */}
                {isAdmin && (
                  <button 
                    onClick={() => handleDeleteWork(trabajo.id)}
                    className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md text-slate-400 hover:text-rose-400 p-2 rounded-xl text-xs transition-colors border border-slate-800"
                    title="Eliminar del catálogo"
                  >
                    <FaTrashAlt />
                  </button>
                )}
              </div>

              {/* Título inferior */}
              <div className="p-3.5 bg-gradient-to-b from-slate-900 to-slate-950 flex justify-between items-center">
                <h3 className="font-bold text-xs text-slate-200 tracking-tight truncate max-w-[80%]">{trabajo.title}</h3>
                <FaSparkles className="text-amber-400/60 text-[10px]" />
              </div>
            </div>
          ))}
        </div>

        {filteredTrabajos.length === 0 && (
          <p className="text-center text-xs text-slate-500 py-12">No hay capturas disponibles en esta categoría.</p>
        )}

      </div>
    </main>
  )
}
