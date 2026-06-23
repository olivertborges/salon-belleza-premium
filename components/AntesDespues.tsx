'use client'

import React, { useState, useEffect } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'

interface AntesDespuesProps {
  user: any
  onFotoSubida?: (puntos: number) => void
}

interface FotoResultado {
  id: number
  antes: string
  despues: string
  fecha: Date
}

export default function AntesDespues({ user, onFotoSubida }: AntesDespuesProps) {
  const [fotos, setFotos] = useState<FotoResultado[]>([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [antes, setAntes] = useState<File | null>(null)
  const [despues, setDespues] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubirFoto = async () => {
    if (!antes || !despues) {
      toast.error('Por favor, selecciona ambas imágenes')
      return
    }

    setSubiendo(true)
    // Simulación de subida controlada
    await new Promise(resolve => setTimeout(resolve, 1200))

    const nuevaFoto: FotoResultado = {
      id: Date.now(),
      antes: URL.createObjectURL(antes),
      despues: URL.createObjectURL(despues),
      fecha: new Date()
    }

    setFotos([nuevaFoto, ...fotos])
    setMostrarModal(false)
    setAntes(null)
    setDespues(null)
    setSubiendo(false)
    
    toast.success('Galería actualizada con éxito')
    if (onFotoSubida) onFotoSubida(100)
  }

  // Contenido estructurado del Modal
  const modalContent = mostrarModal && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs" onClick={() => setMostrarModal(false)} />
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-5 border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-serif text-base text-stone-800 tracking-tight">Añadir Registro Visual</h3>
            <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider mt-0.5">Evolución de tratamiento</p>
          </div>
          <button onClick={() => setMostrarModal(false)} className="text-stone-400 hover:text-stone-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <span className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 mb-2">Estado Inicial</span>
            <label className="block aspect-square bg-stone-50 rounded-xl border border-stone-200 cursor-pointer hover:border-stone-400 transition-all overflow-hidden relative group">
              {antes ? (
                <img src={URL.createObjectURL(antes)} className="w-full h-full object-cover" alt="Preview antes" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <Upload className="w-4 h-4 text-stone-400 mb-1 group-hover:text-stone-600 transition-colors" />
                  <span className="text-[10px] font-mono uppercase text-stone-400 group-hover:text-stone-600">Subir</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setAntes(e.target.files?.[0] || null)} />
            </label>
          </div>
          <div>
            <span className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 mb-2">Resultado Final</span>
            <label className="block aspect-square bg-stone-50 rounded-xl border border-stone-200 cursor-pointer hover:border-stone-400 transition-all overflow-hidden relative group">
              {despues ? (
                <img src={URL.createObjectURL(despues)} className="w-full h-full object-cover" alt="Preview despues" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <Upload className="w-4 h-4 text-stone-400 mb-1 group-hover:text-stone-600 transition-colors" />
                  <span className="text-[10px] font-mono uppercase text-stone-400 group-hover:text-stone-600">Subir</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setDespues(e.target.files?.[0] || null)} />
            </label>
          </div>
        </div>

        <button
          onClick={handleSubirFoto}
          disabled={subiendo}
          className="w-full py-3 bg-stone-900 text-white font-mono text-[11px] uppercase tracking-wider rounded-xl font-bold transition-all hover:bg-stone-800 disabled:opacity-40"
        >
          {subiendo ? 'Procesando...' : 'Guardar en Bitácora'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-stone-100 rounded-xl flex items-center justify-center border border-stone-200">
            <Camera className="w-4 h-4 text-stone-700" />
          </div>
          <div>
            <h3 className="font-serif text-base text-stone-800 tracking-tight">Antes y Después</h3>
            <p className="text-[11px] text-stone-400 font-light">Historial clínico y estético de tus uñas.</p>
          </div>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="text-[10px] font-mono uppercase tracking-wider bg-stone-50 border border-stone-200 text-stone-700 px-3 py-2 rounded-xl font-bold hover:bg-stone-100 transition-all shadow-xs"
        >
          + Agregar registro
        </button>
      </div>

      {fotos.length === 0 ? (
        <div className="text-center py-10 bg-stone-50/50 rounded-xl border border-stone-200/60 border-dashed">
          <Camera className="w-6 h-6 mx-auto mb-2 text-stone-300" />
          <p className="text-stone-700 text-xs font-medium">Sin registros guardados</p>
          <p className="text-stone-400 text-[11px] font-light mt-0.5">Sube tus fotos comparativas para ver la evolución.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {fotos.map(foto => (
            <div key={foto.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1.5 text-center sm:text-left">Antes</p>
                <div className="aspect-video sm:h-32 w-full overflow-hidden rounded-lg border border-stone-200">
                  <img src={foto.antes} className="w-full h-full object-cover" alt="Antes" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1.5 text-center sm:text-left">Después</p>
                <div className="aspect-video sm:h-32 w-full overflow-hidden rounded-lg border border-stone-200">
                  <img src={foto.despues} className="w-full h-full object-cover" alt="Después" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {mounted && createPortal(modalContent, document.body)}
    </div>
  )
}
