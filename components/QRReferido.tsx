'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { QrCode, Share2, Copy, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface QRReferidoProps {
  codigo: string
  user: any
}

export default function QRReferido({ codigo, user }: QRReferidoProps) {
  const { theme } = useTheme()
  const [copiado, setCopiado] = useState(false)
  const [urlReferido, setUrlReferido] = useState('')

  const isDark = theme === 'dark'

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
          title: 'Fresh Nails',
          text: 'Te invito a unirte al Atelier de Fresh Nails. Usa mi enlace y acumularemos beneficios exclusivos.',
          url: urlReferido,
        })
      } catch (err) {
        console.log(err)
      }
    } else {
      handleCopy()
    }
  }

  // Ajuste dinámico de los colores del QR para máxima legibilidad
  const qrBgColor = isDark ? '1a1715' : 'ffffff'
  const qrColor = isDark ? 'ffffff' : '1a1715'
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlReferido || 'fresh_nails')}&bgcolor=${qrBgColor}&color=${qrColor}`

  return (
    <div className={`border p-6 sm:p-8 rounded-3xl transition-all duration-300 shadow-md ${
      isDark 
        ? 'bg-[#141211] border-stone-850 shadow-[0_20px_40px_rgba(0,0,0,0.5)]' 
        : 'bg-white border-stone-200'
    } space-y-6`}>
      <div className={`flex items-center gap-4 border-b pb-6 ${
        isDark ? 'border-stone-900' : 'border-stone-100'
      }`}>
        <div className={`w-12 h-12 border rounded-xl flex items-center justify-center ${
          isDark ? 'bg-gradient-to-r from-amber-500/10 to-rose-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
        }`}>
          <QrCode className="w-5 h-5 text-amber-500 dark:text-amber-300" />
        </div>
        <div>
          <h3 className={`text-xl font-extralight tracking-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
            Programa de <span className="font-serif italic font-normal text-rose-600 dark:text-rose-300">Invitación</span>
          </h3>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-medium mt-1">Expande los privilegios del club</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className={`p-4 border rounded-2xl shadow-sm transition-transform duration-500 hover:scale-[1.02] ${
          isDark ? 'bg-[#1a1715] border-stone-800' : 'bg-stone-50 border-stone-200'
        }`}>
          <img src={qrUrl} alt="Código QR de Referido" className="w-40 h-40 object-contain rounded-xl" />
        </div>

        <div className="text-center">
          <p className={`text-sm font-light leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            Ambas recibirán <span className="font-serif italic text-amber-600 dark:text-amber-200 font-normal">500 puntos</span> abonados tras completarse la primera visita premium.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button
            onClick={handleCopy}
            className={`flex-1 py-3.5 border rounded-xl text-xs font-medium tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
              isDark 
                ? 'bg-stone-900/60 border-stone-800 hover:border-stone-700 text-stone-300' 
                : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700'
            }`}
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiado ? 'Copiado' : 'Copiar Enlace'}
          </button>
          
          <button
            onClick={handleShare}
            className="flex-1 relative group overflow-hidden rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 p-[1px] transition-all duration-300"
          >
            <div className={`py-3 rounded-[11px] font-medium text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 ${
              isDark 
                ? 'bg-stone-950 text-white group-hover:bg-transparent' 
                : 'bg-white text-stone-800 group-hover:bg-transparent group-hover:text-white'
            }`}>
              <Share2 className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 group-hover:text-white" />
              Compartir
            </div>
          </button>
        </div>

        <div className={`w-full py-2.5 border rounded-xl text-center ${
          isDark ? 'bg-stone-950 border-stone-900' : 'bg-stone-50 border-stone-200/60'
        }`}>
          <p className={`text-[10px] font-mono uppercase tracking-[0.2em] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            CÓDIGO ÚNICO: <span className={`font-bold select-all tracking-normal ml-1 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{codigo}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
