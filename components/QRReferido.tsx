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

  const qrBgColor = isDark ? '1a1715' : 'ffffff'
  const qrColor = isDark ? 'ffffff' : '1a1715'
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlReferido || 'fresh_nails')}&bgcolor=${qrBgColor}&color=${qrColor}`

  return (
    <div className={`border p-4 sm:p-6 rounded-3xl transition-all duration-300 shadow-md ${
      isDark 
        ? 'bg-[#141211] border-stone-850 shadow-[0_20px_40px_rgba(0,0,0,0.5)]' 
        : 'bg-white border-stone-200'
    } space-y-4`}>
      
      <div className={`flex items-center gap-3 border-b pb-4 ${
        isDark ? 'border-stone-900' : 'border-stone-100'
      }`}>
        <div className={`w-10 h-10 border rounded-xl flex items-center justify-center flex-shrink-0 ${
          isDark ? 'bg-gradient-to-r from-amber-500/10 to-rose-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
        }`}>
          <Crown className="w-4 h-4 text-amber-500 dark:text-amber-300" />
        </div>
        <div>
          <h3 className={`text-base font-extralight tracking-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
            Código <span className="font-serif italic font-normal text-rose-600 dark:text-rose-300">Exclusivo</span>
          </h3>
          <p className="text-[8px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-medium">
            Comparte tu código único
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-xl border text-center ${
          isDark ? 'bg-stone-900/30 border-stone-800' : 'bg-stone-50/50 border-stone-200'
        }`}>
          <Users className="w-4 h-4 mx-auto text-rose-500" />
          <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
            {referidosCount}
          </p>
          <p className={`text-[8px] uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            Amigos referidos
          </p>
        </div>
        <div className={`p-3 rounded-xl border text-center ${
          isDark ? 'bg-stone-900/30 border-stone-800' : 'bg-stone-50/50 border-stone-200'
        }`}>
          <Sparkles className="w-4 h-4 mx-auto text-amber-500" />
          <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
            {puntosGanados}
          </p>
          <p className={`text-[8px] uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            Puntos ganados
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className={`p-3 border rounded-2xl shadow-sm transition-transform duration-500 hover:scale-[1.02] ${
          isDark ? 'bg-[#1a1715] border-stone-800' : 'bg-stone-50 border-stone-200'
        }`}>
          <img 
            src={qrUrl} 
            alt="Código QR" 
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-xl"
            loading="lazy"
          />
        </div>

        <div className={`w-full p-4 rounded-xl border text-center relative overflow-hidden ${
          isDark 
            ? 'bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-amber-500/10 border-amber-500/20' 
            : 'bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 border-amber-200'
        }`}>
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-rose-500 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10">
            <p className={`text-[8px] uppercase tracking-[0.3em] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              Tu código de invitación
            </p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className={`text-xl sm:text-2xl font-serif italic font-bold bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent`}>
                FRESH
              </span>
              <span className={`text-xl sm:text-2xl font-light ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                ✦
              </span>
              <span className={`text-xl sm:text-2xl font-mono font-bold tracking-wider ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                {codigoActual}
              </span>
            </div>
          </div>
        </div>

        <div className={`w-full p-3 rounded-xl border text-center ${
          isDark ? 'bg-stone-900/20 border-stone-800' : 'bg-stone-50/50 border-stone-200'
        }`}>
          <p className={`text-xs sm:text-sm font-light leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            🎁 Ambos ganan <span className="font-serif italic text-amber-600 dark:text-amber-200 font-normal">500 puntos</span> al registrarse
          </p>
        </div>

        <div className="w-full space-y-3">
          <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${
            isDark ? 'bg-stone-900/30 border-stone-800' : 'bg-stone-50/50 border-stone-200'
          }`}>
            <div className="flex-1 min-w-0">
              <p className={`text-[7px] uppercase tracking-widest ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                Enlace de invitación
              </p>
              <p className={`text-[10px] truncate font-mono ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                {urlReferido || 'Cargando...'}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className={`p-1.5 rounded-xl transition-all flex-shrink-0 ${
                copiado
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : isDark 
                    ? 'bg-stone-800 hover:bg-stone-700 text-stone-400' 
                    : 'bg-stone-200 hover:bg-stone-300 text-stone-600'
              }`}
              title="Copiar enlace"
            >
              {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={handleShare}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 text-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir enlace</span>
          </button>
          
          <p className={`text-[8px] text-center ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            Al compartir, se abrirá el selector de tu dispositivo
          </p>
        </div>
      </div>
    </div>
  )
}
