'use client'

import React, { useState, useEffect } from 'react'
import { QrCode, Share2, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface QRReferidoProps {
  codigo: string
  user: any
}

export default function QRReferido({ codigo, user }: QRReferidoProps) {
  const [copiado, setCopiado] = useState(false)
  const [urlReferido, setUrlReferido] = useState('')

  // Asegurar acceso seguro a window en Next.js
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrlReferido(`${window.location.origin}/register?ref=${codigo}`)
    }
  }, [codigo])

  const handleCopy = async () => {
    if (!urlReferido) return
    try {
      await navigator.clipboard.writeText(urlReferido)
      setCopiado(true)
      toast.success('Enlace copiado al portapapeles')
      setTimeout(() => setCopiado(false), 2000)
    } catch (err) {
      console.error('Error al copiar:', err)
    }
  }

  const handleShare = async () => {
    if (!urlReferido) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fresh Nails Club',
          text: '¡Te invito a unirte a Fresh Nails! Usa mi enlace de invitación y ambas acumularemos beneficios.',
          url: urlReferido,
        })
      } catch (err) {
        console.log('Compartido cancelado o con error:', err)
      }
    } else {
      handleCopy()
    }
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlReferido || 'freshnails')}`

  return (
    <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm space-y-5">
      
      {/* Encabezado del Módulo */}
      <div className="flex items-center gap-2.5 border-b border-stone-100 pb-4">
        <div className="w-8 h-8 bg-stone-100 rounded-xl flex items-center justify-center border border-stone-200">
          <QrCode className="w-4 h-4 text-stone-700" />
        </div>
        <div>
          <h3 className="font-serif text-base text-stone-800 tracking-tight">Programa de Invitación</h3>
          <p className="text-[11px] text-stone-400 font-light">Invita a tus amigas y expande los beneficios del club.</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-5">
        {/* Contenedor del QR de Lujo */}
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl shadow-xs transition-transform duration-300 hover:scale-[1.02]">
          <img
            src={qrUrl}
            alt="Código QR de Referido"
            className="w-36 h-36 object-contain mix-blend-multiply"
          />
        </div>

        <div className="text-center space-y-0.5">
          <p className="text-xs text-stone-700 font-medium">Comparte tu código único</p>
          <p className="text-[11px] text-stone-400 font-light">Ambas recibirán <span className="font-mono font-semibold text-stone-800">500 puntos</span> abonados tras su primera visita.</p>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 w-full">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 bg-stone-50 border border-stone-200 hover:bg-stone-100/80 rounded-xl text-stone-700 text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-stone-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiado ? 'Copiado' : 'Copiar Link'}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 rounded-xl text-white text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            Compartir
          </button>
        </div>

        {/* Identificador de Código */}
        <div className="w-full py-2 bg-stone-50 border border-stone-200/60 rounded-xl text-center">
          <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
            Tu código: <span className="text-stone-800 font-bold select-all tracking-normal ml-1">{codigo}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
