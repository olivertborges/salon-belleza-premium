'use client'

import React, { useState, useEffect } from 'react'
import { Target, Gift, Star, CheckCircle, X, Sparkles, Coins } from 'lucide-react'

interface Mision {
  id: number
  texto: string
  puntos: number
  accion: string
  completada: boolean
}

export default function MisionesDiarias() {
  const [misiones, setMisiones] = useState<Mision[]>([])
  const [puntos, setPuntos] = useState(0)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [recompensaMision, setRecompensaMision] = useState<Mision | null>(null)
  const [puntosGanados, setPuntosGanados] = useState(0)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const misionesTemplate: Mision[] = [
    { id: 1, texto: "Agenda tu próxima cita", puntos: 200, accion: "agendar", completada: false },
    { id: 2, texto: "Descubre las tendencias de la temporada", puntos: 50, accion: "verTutorial", completada: false },
    { id: 3, texto: "Califica tu última experiencia", puntos: 100, accion: "calificar", completada: false },
    { id: 4, texto: "Comparte tu enlace de invitación", puntos: 150, accion: "compartir", completada: false },
  ]

  useEffect(() => {
    const hoy = new Date().toDateString()
    const misionesGuardadas = localStorage.getItem(`misiones_${hoy}`)
    const puntosGuardados = localStorage.getItem("freshNails_puntos") || "0"
    setPuntos(parseInt(puntosGuardados))

    if (misionesGuardadas) {
      setMisiones(JSON.parse(misionesGuardadas))
    } else {
      setMisiones([...misionesTemplate])
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [timeoutId])

  useEffect(() => {
    const handleCompletarMision = (event: any) => {
      const { accion } = event.detail
      const mision = misiones.find(m => m.accion === accion && !m.completada)
      if (mision) {
        reclamarPuntos(mision.id)
      }
    }

    window.addEventListener('completarMision', handleCompletarMision)
    return () => window.removeEventListener('completarMision', handleCompletarMision)
  }, [misiones])

  useEffect(() => {
    const handlePuntosActualizados = (event: any) => {
      setPuntos(event.detail.puntos)
    }

    window.addEventListener('puntosActualizados', handlePuntosActualizados)
    return () => window.removeEventListener('puntosActualizados', handlePuntosActualizados)
  }, [])

  const cerrarModal = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    setShowRewardModal(false)
    setRecompensaMision(null)
    setPuntosGanados(0)
  }

  const reclamarPuntos = (idMision: number) => {
    if (showRewardModal) return

    const mision = misiones.find(m => m.id === idMision)
    if (!mision || mision.completada) return

    const nuevasMisiones = misiones.map(m =>
      m.id === idMision ? { ...m, completada: true } : m
    )
    setMisiones(nuevasMisiones)
    const hoy = new Date().toDateString()
    localStorage.setItem(`misiones_${hoy}`, JSON.stringify(nuevasMisiones))

    const nuevosPuntos = puntos + mision.puntos
    setPuntos(nuevosPuntos)
    setPuntosGanados(mision.puntos)
    setRecompensaMision(mision)
    localStorage.setItem("freshNails_puntos", nuevosPuntos.toString())

    setShowRewardModal(true)

    const id = setTimeout(() => {
      cerrarModal()
    }, 3500)
    setTimeoutId(id)

    window.dispatchEvent(new CustomEvent('puntosActualizados', { 
      detail: { puntos: nuevosPuntos }
    }))
  }

  const misionesCompletadas = misiones.filter(m => m.completada).length

  return (
    <>
      <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm space-y-5">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-stone-50 rounded-xl flex items-center justify-center border border-stone-200">
              <Target className="w-4 h-4 text-stone-700" />
            </div>
            <div>
              <h3 className="font-serif text-base text-stone-800 tracking-tight">Misiones de Hoy</h3>
              <p className="text-[11px] text-stone-400 font-light">Completa acciones para acumular beneficios.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-0.5 bg-stone-100 border border-stone-200 rounded-full text-[10px] font-mono uppercase font-bold text-stone-600">
              {misionesCompletadas}/{misiones.length}
            </div>
            <div className="flex items-center gap-1 bg-stone-900 px-2.5 py-0.5 rounded-full text-white text-[10px] font-mono uppercase tracking-wider font-bold">
              <Star className="w-2.5 h-2.5 fill-white" />
              <span>{puntos} PTS</span>
            </div>
          </div>
        </div>

        {/* Lista de Misiones */}
        <div className="space-y-2.5">
          {misiones.map(mision => (
            <div
              key={mision.id}
              className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 border ${
                mision.completada 
                  ? 'bg-stone-50/50 border-stone-200/40 opacity-70' 
                  : 'bg-white border-stone-100 hover:border-stone-200 hover:bg-stone-50/30'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                  mision.completada ? 'bg-stone-100 border-stone-200 text-stone-400' : 'bg-stone-50 border-stone-200/60 text-stone-700'
                }`}>
                  {mision.completada ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Coins className="w-4 h-4" />
                  )}
                </div>
                <div className="truncate">
                  <p className={`text-xs font-medium text-stone-800 ${mision.completada ? 'line-through text-stone-400 font-light' : ''}`}>
                    {mision.texto}
                  </p>
                  <p className="text-[10px] font-mono text-stone-400">+{mision.puntos} PUNTOS</p>
                </div>
              </div>

              {!mision.completada ? (
                <button
                  onClick={() => reclamarPuntos(mision.id)}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 rounded-lg text-white text-[10px] font-mono uppercase tracking-wider font-bold transition-all"
                >
                  Obtener
                </button>
              ) : (
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 px-2">
                  Listo
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Barra de Progreso */}
        <div className="pt-2">
          <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
            <span>Progreso diario</span>
            <span>{misiones.length > 0 ? Math.round((misionesCompletadas / misiones.length) * 100) : 0}%</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-1">
            <div 
              className="bg-stone-900 h-1 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${misiones.length > 0 ? (misionesCompletadas / misiones.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Modal Recompensa */}
      {showRewardModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="bg-white rounded-3xl w-full max-w-xs overflow-hidden border border-stone-200 shadow-2xl relative p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={cerrarModal}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4 mt-2">
              <div className="w-12 h-12 mx-auto bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-center mb-3 text-stone-800">
                <Gift className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-stone-900">¡Misión Lograda!</h3>
              <p className="text-[11px] font-mono uppercase tracking-widest text-stone-400 mt-0.5">Recompensa Otorgada</p>
            </div>

            <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-4 mb-5">
              {recompensaMision && (
                <>
                  <h4 className="text-xs font-light text-stone-600 mb-2 italic">“{recompensaMision.texto}”</h4>
                  <div className="flex items-center justify-center gap-1.5 text-stone-900 font-mono font-bold text-xl">
                    <Sparkles className="w-4 h-4 text-stone-800 fill-stone-800" />
                    +{puntosGanados} PTS
                  </div>
                </>
              )}
            </div>

            <button
              onClick={cerrarModal}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
