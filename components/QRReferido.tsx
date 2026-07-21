// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { QrCode, Share2, Copy, Check, Users, Gift, Sparkles, Crown } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface QRReferidoProps {
  codigo: string
  user: any
}

export default function QRReferido({ codigo, user }: QRReferidoProps) {
  const { theme } = useTheme()
  const { tenantId } = useAuth()
  const [copiado, setCopiado] = useState(false)
  const [urlReferido, setUrlReferido] = useState('')
  const [referidosCount, setReferidosCount] = useState(0)
  const [puntosGanados, setPuntosGanados] = useState(0)

  const isDark = theme === 'dark'
  const codigoActual = codigo || 'X7K-9M2-P4R'

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin
      setUrlReferido(`${baseUrl}/login?ref=${codigoActual}`)
    }
  }, [codigoActual])

  useEffect(() => {
    async function loadReferidosStats() {
      if (!user?.email || !tenantId) return

      try {
        const { data: cliente } = await supabase
          .from('clients')
          .select('id')
          .eq('email', user.email)
          .eq('tenant_id', tenantId)
          .single()

        if (!cliente) return

        const { count } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('referred_by_id', cliente.id)
          .eq('tenant_id', tenantId)

        setReferidosCount(count || 0)
        setPuntosGanados((count || 0) * 500)

      } catch (error) {
        console.error('Error cargando stats de referidos:', error)
      }
    }

    loadReferidosStats()
  }, [user, tenantId])

  const handleCopy = async () => {
    if (!urlReferido) return
    try {
      await navigator.clipboard.writeText(urlReferido)
      setCopiado(true)
      toast.success('✅ Enlace copiado al portapapeles')
      setTimeout(() => setCopiado(false), 3000)
    } catch (err) {
      console.error(err)
      toast.error('Error al copiar el enlace')
    }
  }

  const handleShare = async () => {
    if (!urlReferido) return
    
    const mensaje = `✨ Te invito a Fresh Nails Atelier 💅
    
🎁 Usa mi código de referido: ${codigoActual}
🎟️ Al registrarte, ambos ganamos 500 puntos.

🔗 ${urlReferido}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fresh Nails Atelier',
          text: mensaje,
          url: urlReferido,
        })
        toast.success('✅ Compartido exitosamente')
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error(err)
        }
      }
    } else {
      handleCopy()
    }
  }

  // Colores dinámicos adaptados para el generador de QR externo
  const qrBgColor = isDark ? '1c1917' : 'ffffff'
  const qrColor = 'ec4899' // Rosa vibrante para que el QR sea espectacular y combine
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlReferido || 'fresh_nails')}&bgcolor=${qrBgColor}&color=${qrColor}`

  return (
    <div className={`p-6 rounded-3xl border transition-all duration-500 shadow-xl relative overflow-hidden ${
      isDark 
        ? 'bg-stone-900/60 border-pink-950/30 backdrop-blur-md' 
        : 'bg-white border-pink-100/70'
    } space-y-5`}>
      
      {/* Detalle chic decorativo */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-amber-400/5 dark:bg-amber-400/10 rounded-br-full pointer-events-none"></div>

      {/* ENCABEZADO EXCLUSIVO */}
      <div className="flex items-center gap-4 border-b pb-4 border-pink-100/40 dark:border-stone-800">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-pink-500 to-amber-400 text-white shadow-md shadow-pink-500/20">
          <Crown className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-black tracking-tight text-stone-800 dark:text-white">
            Código <span className="font-serif italic font-normal text-pink-500 dark:text-pink-400">Exclusivo</span>
          </h3>
          <p className="text-[9px] uppercase tracking-widest font-black text-amber-500 dark:text-amber-400">
            Comparte tu brillo & gana beneficios
          </p>
        </div>
      </div>

      {/* TARJETAS DE CONTADORES */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-3.5 rounded-2xl border text-center transition-all ${
          isDark ? 'bg-stone-950/40 border-stone-850' : 'bg-pink-50/30 border-pink-100/60'
        }`}>
          <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-500 mx-auto flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black mt-2 text-stone-800 dark:text-white tracking-tight">
            {referidosCount}
          </p>
          <p className="text-[9px] uppercase font-black tracking-wider text-stone-400 dark:text-stone-500 mt-0.5">
            Amigos Traídos
          </p>
        </div>
        
        <div className={`p-3.5 rounded-2xl border text-center transition-all ${
          isDark ? 'bg-stone-950/40 border-stone-850' : 'bg-amber-50/30 border-amber-100/60'
        }`}>
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black mt-2 text-stone-800 dark:text-white tracking-tight">
            {puntosGanados}
          </p>
          <p className="text-[9px] uppercase font-black tracking-wider text-stone-400 dark:text-stone-500 mt-0.5">
            Puntos VIP Acumulados
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-5">
        {/* CONTENEDOR DEL QR MAGENTA */}
        <div className={`p-4 border rounded-3xl shadow-md transition-all duration-500 hover:scale-[1.03] ${
          isDark ? 'bg-stone-900 border-pink-500/20' : 'bg-gradient-to-br from-pink-50 via-white to-amber-50 border-pink-100'
        }`}>
          <img 
            src={qrUrl} 
            alt="Código QR" 
            className="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded-2xl shadow-inner"
            loading="lazy"
          />
        </div>

        {/* ETIQUETA DE CÓDIGO INTERACTIVA */}
        <div className={`w-full p-4 rounded-2xl border text-center relative overflow-hidden ${
          isDark 
            ? 'bg-gradient-to-r from-pink-950/30 via-stone-950 to-amber-950/30 border-pink-950/50' 
            : 'bg-gradient-to-r from-pink-50 via-amber-50 to-pink-50 border-pink-100'
        }`}>
          <div className="relative z-10 space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-500">
              Tu código de invitación
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl sm:text-2xl font-serif italic font-black bg-gradient-to-r from-pink-500 to-amber-500 bg-clip-text text-transparent">
                FRESH
              </span>
              <span className="text-lg font-light text-pink-300 dark:text-stone-700">✦</span>
              <span className="text-xl sm:text-2xl font-mono font-black tracking-widest text-stone-800 dark:text-white">
                {codigoActual}
              </span>
            </div>
          </div>
        </div>

        {/* RECOMPENSA BANNER */}
        <div className={`w-full p-3.5 rounded-xl border text-center ${
          isDark ? 'bg-stone-950/40 border-stone-850' : 'bg-stone-50/80 border-stone-200'
        }`}>
          <p className="text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-300">
            🎁 ¡Regalo Mutuo! Ambos ganan <span className="font-serif italic text-pink-600 dark:text-pink-400 font-black">500 puntos</span> al registrarse.
          </p>
        </div>

        {/* INPUT DE ENLACE Y BOTÓN ACCIÓN */}
        <div className="w-full space-y-3">
          <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
            isDark ? 'bg-stone-950/60 border-stone-850' : 'bg-stone-50 border-stone-200'
          }`}>
            <div className="flex-1 min-w-0 pl-2">
              <p className="text-[8px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500">
                Enlace Premium de invitación
              </p>
              <p className="text-[11px] truncate font-mono text-stone-600 dark:text-stone-300 mt-0.5">
                {urlReferido || 'Generando enlace...'}
              </p>
            </div>
            
            <button
              onClick={handleCopy}
              className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
                copiado
                  ? 'bg-emerald-500 text-white'
                  : isDark 
                    ? 'bg-stone-800 hover:bg-stone-700 text-stone-300' 
                    : 'bg-stone-950 hover:bg-stone-900 text-white'
              }`}
              title="Copiar enlace"
            >
              {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleShare}
            className="w-full py-4 rounded-xl bg-stone-950 text-white hover:bg-stone-900 font-black text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-xl border border-stone-800 transform active:scale-[0.99]"
          >
            <Share2 className="w-4 h-4 text-pink-400" />
            <span>Compartir pase exclusivo</span>
          </button>
          
          <p className="text-[9px] text-center text-stone-400 dark:text-stone-500 font-medium">
            Abre el selector de aplicaciones de tu smartphone al presionar.
          </p>
        </div>
      </div>
    </div>
  )
}
