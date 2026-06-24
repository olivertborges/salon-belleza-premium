'use client'

import React, { useState, useEffect } from 'react'
import { Camera, Upload, X, ArrowRight } from 'lucide-react'
import { createPortal } from 'react-dom'
import { toast } from 'react-hot-toast'

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
    toast.success('Registro añadido a tu bitácora')
    if (onFotoSubida) onFotoSubida(100)
  }

  const modalContent = mostrarModal && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative bg-[#141211] border border-stone-850 rounded-2xl max-w-md w-full p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-serif text-xl text-stone-100">Nuevo Registro Visual</h3>
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-1">Evolución de tratamiento</p>
          </div>
          <button onClick={() => setMostrarModal(false)} className="text-stone-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {[ { label: 'Estado Inicial', file: antes, setFile: setAntes }, { label: 'Resultado Final', file: despues, setFile: setDespues } ].map((item, i) => (
            <label key={i} className="block aspect-square bg-stone-950 border border-stone-900 rounded-xl cursor-pointer hover:border-rose-500/40 transition-all overflow-hidden relative group">
              {item.file ? (
                <img src={URL.createObjectURL(item.file)} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-4 text-stone-500 group-hover:text-stone-400">
                  <Upload className="w-5 h-5 mb-1.5 transition-colors" />
                  <span className="text-[10px] font-mono uppercase tracking-wider">{item.label}</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => item.setFile(e.target.files?.[0] || null)} />
            </label>
          ))}
        </div>

        <button
          onClick={handleSubirFoto}
          disabled={subiendo}
          className="w-full py-4 bg-stone-100 hover:bg-rose-600 text-stone-950 hover:text-white transition-colors font-medium text-xs uppercase tracking-wider rounded-xl font-bold"
        >
          {subiendo ? 'Procesando Archivos...' : 'Añadir a Galería'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="bg-[#141211] border border-stone-850 p-8 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] space-y-6">
      <div className="flex items-center justify-between border-b border-stone-900 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center">
            <Camera className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-xl font-extralight tracking-tight text-stone-100">
              Antes y <span className="font-serif italic font-normal text-rose-300">Después</span>
            </h3>
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-medium mt-1">Historial estético de tus diseños</p>
          </div>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="text-[10px] font-bold uppercase tracking-wider bg-stone-900 border border-stone-800 text-stone-300 px-4 py-2.5 rounded-xl hover:border-stone-600 transition-all shadow-xs"
        >
          + Registro
        </button>
      </div>

      {fotos.length === 0 ? (
        <div className="text-center py-12 bg-stone-950/30 rounded-xl border border-stone-900/60 border-dashed">
          <Camera className="w-8 h-8 mx-auto mb-3 text-stone-700" />
          <p className="text-stone-400 text-xs font-light">Sin registros de evolución visual guardados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {fotos.map(foto => (
            <div key={foto.id} className="p-4 bg-[#1a1715] rounded-xl border border-stone-850/60 flex items-center gap-4">
              <div className="flex-1 rounded-lg overflow-hidden border border-stone-900 aspect-video"><img src={foto.antes} className="w-full h-full object-cover" /></div>
              <ArrowRight className="text-stone-600 flex-shrink-0" />
              <div className="flex-1 rounded-lg overflow-hidden border border-stone-900 aspect-video"><img src={foto.despues} className="w-full h-full object-cover" /></div>
            </div>
          ))}
        </div>
      )}

      {mounted && createPortal(modalContent, document.body)}
    </div>
  )
}
