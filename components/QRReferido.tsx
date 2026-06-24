'use client'

import React, { useState, useEffect } from 'react'
import { QrCode, Share2, Copy, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface QRReferidoProps {
  codigo: string
  user: any
}

export default function QRReferido({ codigo, user }: QRReferidoProps) {
  const [copiado, setCopiado] = useState(false)
  const [urlReferido, setUrlReferido] = useState('')

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
      console.error(err)
    }
  }

  const handleShare = async () => {
    if (!urlReferido) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Atelier de Uñas',
          text: 'Te invito a unirte al Atelier de Uñas de Alta Costura. Usa mi enlace y acumularemos beneficios exclusivos.',
          url: urlReferido,
        })
      } catch (err) {
        console.log(err)
      }
    } else {
      handleCopy()
    }
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlReferido || 'atelier')}&bgcolor=1a1715&color=ffffff`

  return (
    <div className="bg-[#141211] border border-stone-850 p-8 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] space-y-6">
      <div className="flex items-center gap-4 border-b border-stone-900 pb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center">
          <QrCode className="w-5 h-5 text-amber-300" />
        </div>
        <div>
          <h3 className="text-xl font-extralight tracking-tight text-stone-100">
            Programa de <span className="font-serif italic font-normal text-rose-300">Invitación</span>
          </h3>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-medium mt-1">Expande los privilegios del club</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="p-4 bg-[#1a1715] border border-stone-800 rounded-2xl shadow-inner transition-transform duration-500 hover:scale-[1.02]">
          <img src={qrUrl} alt="Código QR de Referido" className="w-40 h-40 object-contain rounded-xl" />
        </div>

        <div className="text-center">
          <p className="text-sm text-stone-400 font-light leading-relaxed">
            Ambas recibirán <span className="font-serif italic text-amber-200 font-normal">500 puntos</span> abonados tras completarse la primera visita premium.
          </p>
        </div>

        <div className="flex gap-4 w-full">
          <button
            onClick={handleCopy}
            className="flex-1 py-3.5 bg-stone-900/60 border border-stone-800 hover:border-stone-700 rounded-xl text-stone-300 text-xs font-medium tracking-wider uppercase transition-all flex items-center justify-center gap-2"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiado ? 'Copiado' : 'Copiar Enlace'}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 relative group overflow-hidden rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 p-[1px] transition-all duration-300"
          >
            <div className="bg-stone-950 text-white group-hover:bg-transparent py-3 rounded-[11px] font-medium text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-rose-400 group-hover:text-white" />
              Compartir
            </div>
          </button>
        </div>

        <div className="w-full py-2.5 bg-stone-950 border border-stone-900 rounded-xl text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-500">
            CÓDIGO ÚNICO: <span className="text-stone-200 font-bold select-all tracking-normal ml-1">{codigo}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
