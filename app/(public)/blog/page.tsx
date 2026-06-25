'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  FaArrowLeft, 
  FaBookOpen, 
  FaClock, 
  FaToggleOn, 
  FaToggleOff, 
  FaPlus, 
  FaTrashAlt, 
  FaSearch, 
  FaHeart 
} from 'react-icons/fa'

export default function BlogPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Listado de artículos educativos premium orientados a la conversión
  const [articulos, setArticulos] = useState([
    { id: 1, title: 'Guía Definitiva: Cuidados vitales tras tu sesión de Microblading', category: 'Cuidado Posterior', readTime: '4 min', likes: 142, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', desc: 'Los primeros 7 días determinan el 90% de la retención del pigmento. Sigue estos pasos para evitar costras y mantener el color perfecto.' },
    { id: 2, title: 'Lifting de Pestañas vs Extensions: ¿Cuál elegir según tu ojo?', category: 'Tendencias', readTime: '3 min', likes: 98, img: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=600&q=80', desc: 'Analizamos la durabilidad, el mantenimiento y el impacto visual de cada técnica para que descubras cuál se adapta mejor a tu ritmo diario.' },
    { id: 3, title: 'Mitología Cosmética: ¿El laminado daña tus cejas naturales?', category: 'Mitos', readTime: '5 min', likes: 215, img: 'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?auto=format&fit=crop&w=600&q=80', desc: 'Desmentimos los miedos comunes sobre la fijación semipermanente y te explicamos el papel crucial que juega la queratina de infusión.' },
  ])

  // Estados para simular la creación de posts en modo administrativo
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('Cuidado Posterior')
  const [newDesc, setNewDesc] = useState('')

  const filteredArticulos = articulos.filter(art => 
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    art.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newDesc) return

    const nuevoPost = {
      id: Date.now(),
      title: newTitle,
      category: newCategory,
      readTime: '3 min',
      likes: 1,
      img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80',
      desc: newDesc
    }

    setArticulos([nuevoPost, ...articulos])
    setNewTitle('')
    setNewDesc('')
  }

  const handleDeletePost = (id: number) => {
    if (confirm('¿Seguro que deseas retirar este artículo de la vista pública?')) {
      setArticulos(articulos.filter(art => art.id !== id))
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
          Editor: {isAdmin ? 'Escritura' : 'Lectura VIP'}
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        
        {/* Cabecera */}
        <div className="mb-6">
          <h1 className="text-2xl font-light text-slate-100 tracking-tight">
            Beauty <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400">Magazine</span>
          </h1>
          <p className="text-slate-400 text-xs font-light mt-1">Consejos profesionales, tendencias globales y guías clínicas para el cuidado de tu piel y mirada.</p>
        </div>

        {/* BUSCADOR TÁCTIL */}
        <div className="flex bg-slate-950 border border-slate-850 rounded-2xl p-3 items-center gap-2 mb-6 shadow-inner">
          <FaSearch className="text-slate-600 text-xs ml-1" />
          <input 
            type="text" 
            placeholder="Buscar por cuidado, técnica o mito..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-slate-200 text-xs flex-1 outline-none font-light"
          />
        </div>

        {/* PANEL DE REDACCIÓN DE ENTRADAS (MODO ADMIN) */}
        {isAdmin && (
          <div className="bg-slate-900 border-2 border-dashed border-rose-500/30 p-5 rounded-3xl shadow-xl mb-6 animate-in slide-in-from-top-4 duration-300">
            <h2 className="text-xs uppercase tracking-wider font-bold text-rose-400 flex items-center gap-1.5 mb-3">
              <FaBookOpen /> Redactar Artículo de Autoridad
            </h2>
            <form onSubmit={handleCreatePost} className="space-y-3">
              <input 
                type="text"
                placeholder="Título impactante de la nota..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400 text-slate-100 font-medium"
                required
              />
              <select 
                value={newCategory} 
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="Cuidado Posterior">Cuidado Posterior</option>
                <option value="Tendencias">Tendencias</option>
                <option value="Mitos">Mitos</option>
              </select>
              <textarea 
                placeholder="Introducción y desarrollo educativo del artículo para tus pacientes..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none h-20 resize-none text-slate-300"
                required
              />
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-[0.99] transition-transform flex items-center justify-center gap-1.5 shadow-lg"
              >
                <FaPlus /> Publicar Artículo
              </button>
            </form>
          </div>
        )}

        {/* FEED DE ARTÍCULOS EN FORMATO CARD PREMIUM */}
        <div className="space-y-6">
          {filteredArticulos.map((art) => (
            <article 
              key={art.id}
              className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-850 rounded-2xl overflow-hidden group shadow-xl relative"
            >
              {/* Imagen de cabecera del post */}
              <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden">
                <img 
                  src={art.img} 
                  alt={art.title}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-[1.02] transition-transform duration-700"
                  loading="lazy"
                />
                <span className="absolute bottom-3 left-3 text-[8px] tracking-wider uppercase font-black bg-slate-950/80 backdrop-blur-md text-slate-300 px-2.5 py-1 rounded-md border border-slate-800/60">
                  {art.category}
                </span>

                {isAdmin && (
                  <button 
                    onClick={() => handleDeletePost(art.id)}
                    className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md text-slate-400 hover:text-rose-400 p-2 rounded-xl text-xs transition-colors border border-slate-800"
                    title="Eliminar publicación"
                  >
                    <FaTrashAlt />
                  </button>
                )}
              </div>

              {/* Contenido del Post */}
              <div className="p-5">
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium mb-2">
                  <span className="flex items-center gap-1"><FaClock className="text-rose-500/70" /> Lectura: {art.readTime}</span>
                  <span className="flex items-center gap-1"><FaHeart className="text-amber-500/70" /> {art.likes} Me gusta</span>
                </div>

                <h3 className="font-bold text-sm text-slate-200 tracking-tight leading-snug group-hover:text-white transition-colors mb-2">
                  {art.title}
                </h3>
                
                <p className="text-[11px] text-slate-400 font-light leading-relaxed mb-4 line-clamp-2">
                  {art.desc}
                </p>

                {/* Enlace simulado de lectura completa */}
                <span className="text-[10px] uppercase tracking-wider font-bold text-rose-400 group-hover:text-rose-300 transition-colors inline-flex items-center gap-1 cursor-pointer">
                  Leer artículo completo &rarr;
                </span>
              </div>
            </article>
          ))}

          {filteredArticulos.length === 0 && (
            <p className="text-center text-xs text-slate-500 py-12 font-light">No se encontraron artículos que coincidan con tu búsqueda.</p>
          )}
        </div>

      </div>
    </main>
  )
}
