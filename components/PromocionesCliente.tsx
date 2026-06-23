'use client'

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'next/navigation'
import { ChevronRight, X, ShoppingBag, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface Promocion {
  id: string
  titulo: string
  descripcion: string
  tipo: 'descuento' | 'puntos_dobles' | 'servicio_gratis' | '2x1' | 'info'
  valor?: number
  codigo?: string
  fechaFin: string
  activa: boolean
  icono?: string
}

export default function PromocionesCliente() {
  const navigate = useNavigate()
  const [promociones, setPromociones] = useState<Promocion[]>([])
  const [promocionActiva, setPromocionActiva] = useState<Promocion | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    cargarPromociones()
    const handleActualizacion = () => cargarPromociones()
    window.addEventListener('promocionesActualizadas', handleActualizacion)
    return () => window.removeEventListener('promocionesActualizadas', handleActualizacion)
  }, [])

  const cargarPromociones = () => {
    const promosGuardadas = localStorage.getItem('freshNails_promociones')
    if (promosGuardadas) {
      const todas: Promocion[] = JSON.parse(promosGuardadas)
      const hoy = new Date()
      const activas = todas.filter(promo => {
        const fechaFin = new Date(promo.fechaFin)
        return promo.activa && fechaFin >= hoy
      })
      setPromociones(activas)
    }
  }

  const getTipoTexto = (tipo: string) => {
    const textos: Record<string, string> = {
      descuento: 'Beneficio Exclusivo',
      puntos_dobles: 'Puntos Dobles',
      servicio_gratis: 'Cortesía de la Casa',
      '2x1': 'Oportunidad Duplicada',
      info: 'Nota del Atelier'
    }
    return textos[tipo] || 'Oferta Limitada'
  }

  const handleAprovechar = (promocion: Promocion) => {
    localStorage.setItem('promocion_aplicar', JSON.stringify(promocion))
    setShowModal(false)

    if (promocion.tipo === 'descuento' || promocion.tipo === '2x1') {
      toast.success('Beneficio vinculado a tu bolsa de compra')
      navigate.push('/tienda')
    } else if (promocion.tipo === 'servicio_gratis' || promocion.tipo === 'puntos_dobles') {
      toast.success('Selecciona tu horario para aplicar el beneficio')
      navigate.push('/dashboard')
    } else {
      toast.success(promocion.descripcion)
    }
  }

  const handleCopiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo)
    setCopiado(true)
    toast.success('Código copiado al portapapeles')
    setTimeout(() => setCopiado(false), 2000)
  }

  if (promociones.length === 0) return null

  const promocionDestacada = promociones[0]
  const otrasPromociones = promociones.slice(1, 4)

  return (
    <div className="space-y-4">
      {/* Promoción Destacada (Estilo Cartel Editorial) */}
      <div
        onClick={() => {
          setPromocionActiva(promocionDestacada)
          setShowModal(true)
        }}
        className="group relative overflow-hidden rounded-2xl bg-stone-900 text-stone-100 p-6 shadow-sm cursor-pointer transition-all duration-300 hover:bg-stone-800 border border-stone-900"
      >
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block">
              {getTipoTexto(promocionDestacada.tipo)}
            </span>
            <h3 className="font-serif text-xl tracking-tight text-white group-hover:text-stone-200 transition-colors">
              {promocionDestacada.titulo}
            </h3>
            <p className="text-xs text-stone-400 font-light line-clamp-2">
              {promocionDestacada.descripcion}
            </p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-stone-800 border border-stone-700/60 group-hover:bg-stone-700 transition-all flex-shrink-0">
            <ChevronRight className="w-4 h-4 text-stone-300" />
          </div>
        </div>
      </div>

      {/* Grid de Otras Promociones */}
      {otrasPromociones.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {otrasPromociones.map((promo) => (
            <div
              key={promo.id}
              onClick={() => {
                setPromocionActiva(promo)
                setShowModal(true)
              }}
              className="group bg-white border border-stone-200 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:border-stone-400 hover:bg-stone-50/40 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 space-y-0.5">
                <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 block">
                  {getTipoTexto(promo.tipo)}
                </span>
                <p className="text-xs font-medium text-stone-800 truncate">
                  {promo.titulo}
                </p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-colors flex-shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalle (Sofisticado, fondo blanco/neutro) */}
      {showModal && promocionActiva && (
        <div 
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full p-6 text-center border border-stone-200 shadow-2xl relative"
          >
            <button 
              onClick={() => setShowModal(false)} 
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4 mt-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block mb-1">
                {getTipoTexto(promocionActiva.tipo)}
              </span>
              <h3 className="font-serif text-2xl text-stone-900 tracking-tight">
                {promocionActiva.titulo}
              </h3>
            </div>

            <p className="text-xs text-stone-600 font-light leading-relaxed px-2 mb-4">
              {promocionActiva.descripcion}
            </p>

            {/* Tarjeta de Valorización Limpia */}
            {promocionActiva.valor && (
              <div className="bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 mb-4 inline-block mx-auto min-w-[120px]">
                <span className="text-xs font-mono uppercase tracking-wider text-stone-500 block text-[10px]">Beneficio</span>
                <span className="font-serif text-lg font-bold text-stone-900 mt-0.5 block">
                  {promocionActiva.tipo === 'descuento' && `${promocionActiva.valor}% Directo`}
                  {promocionActiva.tipo === 'puntos_dobles' && `+${promocionActiva.valor} Pts`}
                  {promocionActiva.tipo === '2x1' && 'Duplicado 2x1'}
                </span>
              </div>
            )}

            {/* Input de Copiado de Código Minimalista */}
            {promocionActiva.codigo && (
              <div className="mb-6 max-w-[240px] mx-auto">
                <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 block mb-1.5">Código Promocional</span>
                <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl p-1.5 pl-3.5">
                  <code className="font-mono text-xs tracking-wider text-stone-800 font-bold">
                    {promocionActiva.codigo}
                  </code>
                  <button
                    onClick={() => handleCopiarCodigo(promocionActiva.codigo!)}
                    className="p-2 hover:bg-stone-200/60 rounded-lg transition-colors text-stone-500 hover:text-stone-800"
                  >
                    {copiado ? <Check className="w-3.5 h-3.5 text-stone-800" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Footer de Acciones */}
            <div className="pt-4 border-t border-stone-100">
              <p className="text-[10px] font-mono text-stone-400 mb-4">
                Vence el {new Date(promocionActiva.fechaFin).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-stone-200 text-stone-600 rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-stone-50 transition-colors"
                >
                  Regresar
                </button>
                <button
                  onClick={() => handleAprovechar(promocionActiva)}
                  className="flex-1 py-3 bg-stone-900 text-white rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-stone-800 transition-all flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
