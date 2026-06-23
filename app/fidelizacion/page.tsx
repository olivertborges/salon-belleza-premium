'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  FaArrowLeft, 
  FaCrown, 
  FaGem, 
  FaGift, 
  FaPlus, 
  FaStar, 
  FaToggleOn, 
  FaToggleOff, 
  FaQrcode, 
  FaCheckCircle 
} from 'react-icons/fa'

export default function FidelizacionPage() {
  // Simulación de rol: Cliente o Administrador en caja
  const [isAdmin, setIsAdmin] = useState(false)

  // Estado del cliente simulado (listo para conectar con auth y perfiles en tu base de datos)
  const [clientPoints, setClientPoints] = useState(1450)
  const nextLevelPoints = 2000
  const progressPercent = (clientPoints / nextLevelPoints) * 100

  // Estado para simular la recarga de puntos en caja
  const [pointsToAdd, setPointsToAdd] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Catálogo de recompensas exclusivas
  const recompensas = [
    { id: 1, title: 'Lifting de Pestañas Gratis', pointsCost: 600, available: clientPoints >= 600 },
    { id: 2, title: 'Kit de Cuidados Post-Microblading', pointsCost: 450, available: clientPoints >= 450 },
    { id: 3, title: '50% Desc. en Micropigmentación Labial', pointsCost: 1200, available: clientPoints >= 1200 },
    { id: 4, title: 'Sesión de Nail Art Avanzado', pointsCost: 800, available: clientPoints >= 800 },
  ]

  // Función para sumar puntos desde el panel de administración
  const handleAddPoints = (e: React.FormEvent) => {
    e.preventDefault()
    const num = Number(pointsToAdd)
    if (!isNaN(num) && num > 0) {
      setClientPoints(prev => prev + num)
      setPointsToAdd('')
      setSuccessMessage(`¡Se han acreditado +${num} puntos con éxito!`)
      setTimeout(() => setSuccessMessage(''), 4000)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 pb-20 overflow-x-hidden">
      
      {/* Navbar de Navegación */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-40 flex items-center justify-between">
        <Link href="/" className="text-slate-400 flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium">
          <FaArrowLeft className="text-rose-400" /> Volver
        </Link>
        <button 
          onClick={() => setIsAdmin(!isAdmin)} 
          className="flex items-center gap-2 text-[10px] bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 tracking-widest uppercase text-slate-300 active:scale-95 transition-all"
        >
          {isAdmin ? <FaToggleOn className="text-rose-400 text-sm" /> : <FaToggleOff className="text-slate-500 text-sm" />}
          Acceso: {isAdmin ? 'Caja / Staff' : 'Socio VIP'}
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        
        {/* Título */}
        <div className="mb-6">
          <h1 className="text-2xl font-light text-slate-100 tracking-tight">
            Club de <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400">Fidelidad</span>
          </h1>
          <p className="text-slate-400 text-xs font-light mt-1">Acumula puntos en cada visita y canjéalos por experiencias premium.</p>
        </div>

        {/* MODO ADMINISTRADOR: PANEL DE RECARGA EN CAJA */}
        {isAdmin && (
          <div className="bg-slate-900 border-2 border-dashed border-amber-500/40 p-5 rounded-3xl shadow-xl mb-6 animate-in slide-in-from-top-4 duration-300">
            <h2 className="text-xs uppercase tracking-wider font-bold text-amber-400 flex items-center gap-2 mb-3">
              <FaCrown /> Terminal de Caja Estéril
            </h2>
            <form onSubmit={handleAddPoints} className="flex gap-2">
              <input 
                type="number" 
                value={pointsToAdd} 
                onChange={(e) => setPointsToAdd(e.target.value)}
                placeholder="Ej. 150 puntos por servicio"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-100 font-medium"
                required
              />
              <button 
                type="submit"
                className="bg-gradient-to-r from-amber-500 to-rose-500 text-white px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-transform flex items-center gap-1"
              >
                <FaPlus /> Cargar
              </button>
            </form>
            {successMessage && (
              <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1 animate-pulse">
                <FaCheckCircle /> {successMessage}
              </p>
            )}
          </div>
        )}

        {/* TARJETA VIP VIRTUAL DEL CLIENTE */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md font-bold">
                Estatus Gold
              </span>
              <h3 className="font-bold text-base text-slate-200 mt-2">Valeria Mendoza</h3>
              <p className="text-[10px] text-slate-500 tracking-wider">ID Socio: #VIP-2026</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl text-slate-300">
              <FaQrcode className="text-2xl opacity-80" />
            </div>
          </div>

          {/* Balance de Puntos */}
          <div className="mb-4">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 block">Tus Puntos Disponibles</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400 text-transparent bg-clip-text">
                {clientPoints}
              </span>
              <span className="text-xs text-slate-400 font-medium">PTS</span>
            </div>
          </div>

          {/* Barra de Progreso Hacia Siguiente Nivel */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Próximo Nivel: <strong className="text-amber-400">Diamond Club</strong></span>
              <span>Faltan {nextLevelPoints - clientPoints} pts</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-[2px] border border-slate-800">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-orange-400 transition-all duration-500"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* CATÁLOGO DE RECOMPENSAS */}
        <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-1.5">
          <FaGift className="text-rose-400" /> Recompensas Disponibles
        </h2>

        <div className="space-y-3">
          {recompensas.map((rec) => (
            <div 
              key={rec.id}
              className={`p-4 rounded-2xl border transition-all flex justify-between items-center bg-slate-900/60 ${
                rec.available 
                  ? 'border-slate-800 hover:border-rose-500/40 opacity-100 shadow-xl' 
                  : 'border-slate-850 opacity-40 select-none'
              }`}
            >
              <div className="pr-4">
                <h4 className="font-bold text-xs text-slate-200 tracking-tight">{rec.title}</h4>
                <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold mt-1">
                  <FaGem className="text-[9px]" /> {rec.pointsCost} Puntos
                </div>
              </div>

              <div>
                {rec.available ? (
                  <button 
                    onClick={() => {
                      if(confirm(`¿Quieres canjear tus puntos por: ${rec.title}?`)) {
                        setClientPoints(prev => prev - rec.pointsCost)
                        alert('¡Canje Exitoso! Muestra el código en tu próxima cita.')
                      }
                    }}
                    className="bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-bold px-3 py-2 rounded-xl uppercase tracking-wider active:scale-95 transition-transform shadow-md"
                  >
                    Canjear
                  </button>
                ) : (
                  <span className="text-[9px] uppercase tracking-wider bg-slate-950 border border-slate-800 text-slate-600 px-2 py-1 rounded-lg font-bold">
                    Bloqueado
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
