'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  FaArrowLeft, 
  FaStar, 
  FaPlus, 
  FaTrash, 
  FaEdit, 
  FaToggleOn, 
  FaToggleOff,
  FaQuoteLeft,
  FaSave,
  FaTimes,
  FaHeart
} from 'react-icons/fa'

export default function ClientesPage() {
  // Estado para simular si eres Administrador
  const [isAdmin, setIsAdmin] = useState(false)

  // Datos simulados de testimonios (listo para tu base de datos)
  const [testimonios, setTestimonios] = useState([
    { id: 1, name: 'Valeria Mendoza', treatment: 'Microblading Hiperrealista', rating: 5, comment: '¡Increíble la atención! Mis cejas quedaron súper naturales y perfectas. El diseño morfológico que me hicieron cambió mi rostro por completo.', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' },
    { id: 2, name: 'Sofía Castillo', treatment: 'Micropigmentación Labial', rating: 5, comment: 'Amé el efecto acuarela en mis labios. Ya no necesito usar labial a diario, tienen un color saludable hermoso. Súper recomendado.', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { id: 3, name: 'Camila Ríos', treatment: 'Uñas Acrílicas Full Set', rating: 5, comment: 'La delicadeza del Nail Art que hacen aquí es de otro nivel. Súper resistentes y el diseño a mano alzada es una obra de arte.', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' }
  ])

  // Estados del Modal de Administración
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formTreatment, setFormTreatment] = useState('Microblading Hiperrealista')
  const [formRating, setFormRating] = useState('5')
  const [formComment, setFormComment] = useState('')
  const [formImage, setFormImage] = useState('')

  const abrirAgregar = () => {
    setEditingId(null)
    setFormName('')
    setFormTreatment('Microblading Hiperrealista')
    setFormRating('5')
    setFormComment('')
    setFormImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')
    setShowModal(true)
  }

  const abrirEditar = (item: any) => {
    setEditingId(item.id)
    setFormName(item.name)
    setFormTreatment(item.treatment)
    setFormRating(item.rating.toString())
    setFormComment(item.comment)
    setFormImage(item.image)
    setShowModal(true)
  }

  const guardarTestimonio = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      setTestimonios(testimonios.map(t => t.id === editingId ? {
        ...t,
        name: formName,
        treatment: formTreatment,
        rating: Number(formRating),
        comment: formComment,
        image: formImage
      } : t))
    } else {
      setTestimonios([...testimonios, {
        id: Date.now(),
        name: formName,
        treatment: formTreatment,
        rating: Number(formRating),
        comment: formComment,
        image: formImage
      }])
    }
    setShowModal(false)
  }

  const eliminarTestimonio = (id: number) => {
    if (confirm('¿Seguro que deseas eliminar esta reseña?')) {
      setTestimonios(testimonios.filter(t => t.id !== id))
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 pb-20 overflow-x-hidden">
      
      {/* Navbar Superior */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-40 flex items-center justify-between">
        <Link href="/" className="text-slate-400 flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium">
          <FaArrowLeft className="text-rose-400" /> Volver
        </Link>
        <button 
          onClick={() => setIsAdmin(!isAdmin)} 
          className="flex items-center gap-2 text-[10px] bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 tracking-widest uppercase text-slate-300 active:scale-95 transition-all"
        >
          {isAdmin ? <FaToggleOn className="text-rose-400 text-sm" /> : <FaToggleOff className="text-slate-500 text-sm" />}
          Modo: {isAdmin ? 'Admin Reseñas' : 'Cliente'}
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        
        {/* Título de la Sección */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-light text-slate-100 tracking-tight">
              Experiencias <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400">Reales</span>
            </h1>
            <p className="text-slate-400 text-xs font-light mt-1">Lo que opinan quienes ya confían en nuestras manos profesionales.</p>
          </div>
          {isAdmin && (
            <button 
              onClick={abrirAgregar}
              className="bg-gradient-to-r from-rose-500 to-amber-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              <FaPlus />
            </button>
          )}
        </div>

        {/* Tarjetas de Reseñas */}
        <div className="space-y-4">
          {testimonios.map((item) => (
            <div 
              key={item.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden group animate-in fade-in duration-300"
            >
              <FaQuoteLeft className="absolute top-4 right-4 text-slate-800 text-3xl pointer-events-none" />

              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-800"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{item.name}</h3>
                    <span className="text-[10px] text-amber-400 font-medium block">{item.treatment}</span>
                  </div>
                </div>

                {/* Controles Admin */}
                {isAdmin && (
                  <div className="flex gap-1.5 z-10">
                    <button onClick={() => abrirEditar(item)} className="text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-xs active:scale-90 transition-all">
                      <FaEdit />
                    </button>
                    <button onClick={() => eliminarTestimonio(item.id)} className="text-rose-500 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 text-xs active:scale-90 transition-all">
                      <FaTrash />
                    </button>
                  </div>
                )}
              </div>

              {/* Estrellas */}
              <div className="flex gap-0.5 text-[10px] text-amber-400 mb-2">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <FaStar key={i} />
                ))}
              </div>

              {/* Opinión */}
              <p className="text-slate-300 text-xs font-light leading-relaxed">
                "{item.comment}"
              </p>

              <div className="mt-3 pt-3 border-t border-slate-800/40 flex items-center gap-1 text-[9px] text-rose-400 uppercase tracking-widest font-bold">
                <FaHeart className="text-[8px]" /> Cliente Satisfecho
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL PARA AGREGAR/EDITAR RESEÑA */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
          <form 
            onSubmit={guardarTestimonio}
            className="w-full max-w-md bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom-10"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-sm uppercase tracking-wider font-bold">
                {editingId ? 'Editar Reseña' : 'Añadir Nueva Reseña'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 p-1 text-sm"><FaTimes /></button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Nombre de la Clienta</label>
              <input 
                type="text" required value={formName} onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej. María Elena"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-100 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Tratamiento Realizado</label>
                <select 
                  value={formTreatment} onChange={(e) => setFormTreatment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none text-slate-200"
                >
                  <option value="Microblading Hiperrealista">Microblading</option>
                  <option value="Micropigmentación Labial">Micropigmentación</option>
                  <option value="Uñas Acrílicas Full Set">Uñas Acrílicas</option>
                  <option value="Lifting de Pestañas">Lifting</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Calificación</label>
                <select 
                  value={formRating} onChange={(e) => setFormRating(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none text-slate-200"
                >
                  <option value="5">5 Estrellas ⭐⭐⭐⭐⭐</option>
                  <option value="4">4 Estrellas ⭐⭐⭐ Solamente</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Comentario / Reseña</label>
              <textarea 
                rows={4} required value={formComment} onChange={(e) => setFormComment(e.target.value)}
                placeholder="Escribe la maravillosa experiencia del cliente..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-100 font-light"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <FaSave /> Guardar Reseña
            </button>
          </form>
        </div>
      )}

    </main>
  )
}
