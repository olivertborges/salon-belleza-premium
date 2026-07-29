// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { QrCode, Share2, Copy, Check, Users, Gift, Sparkles, Crown, Gem, ArrowRight } from 'lucide-react'

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
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

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

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setShowToast({ message, type })
    setTimeout(() => setShowToast(null), 3500)
  }

  const handleCopy = async () => {
    if (!urlReferido) return
    try {
      await navigator.clipboard.writeText(urlReferido)
      setCopiado(true)
      showToastMessage('✅ Enlace copiado al portapapeles', 'success')
      setTimeout(() => setCopiado(false), 3000)
    } catch (err) {
      console.error(err)
      showToastMessage('❌ Error al copiar el enlace', 'error')
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
        showToastMessage('✅ Compartido exitosamente', 'success')
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error(err)
        }
      }
    } else {
      handleCopy()
    }
  }

  // Colores para el QR
  const qrBgColor = isDark ? '1E120C' : 'FFF9F6'
  const qrColor = 'D4AF37'
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlReferido || 'fresh_nails')}&bgcolor=${qrBgColor}&color=${qrColor}`

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-300 shadow-sm relative overflow-hidden ${
      isDark 
        ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
        : 'bg-white border-[#F0E4DA] shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
    } space-y-5`}>

      {/* Toast flotante */}
      {showToast && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 px-5 py-3 rounded-xl border text-sm font-medium shadow-lg animate-fadeIn ${
          showToast.type === 'success'
            ? isDark 
              ? 'bg-[#3D281E]/90 border-[#D4AF37]/30 text-[#D4AF37]' 
              : 'bg-white border-[#D4AF37]/30 text-[#1A0E0A]'
            : isDark 
              ? 'bg-[#3D281E]/90 border-rose-500/30 text-rose-400' 
              : 'bg-white border-rose-300 text-rose-600'
        }`}>
          {showToast.message}
        </div>
      )}

      {/* Elemento decorativo */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-[#D4AF37]/5 rounded-br-full pointer-events-none" />

      {/* ============================================================ */}
      {/* ENCABEZADO */}
      {/* ============================================================ */}
      <div className={`flex items-center gap-4 border-b pb-4 ${
        isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
      }`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
          isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
        }`}>
          <Crown className="w-5 h-5 text-[#D4AF37] animate-pulse" />
        </div>
        <div>
          <h3 className={`font-serif text-lg font-light ${
            isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
          }`}>
            Código <span className="font-serif italic text-[#D4AF37]">Exclusivo</span>
          </h3>
          <p className={`text-[8px] uppercase tracking-[0.25em] font-black ${
            isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
          }`}>
            Comparte tu brillo & gana beneficios
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TARJETAS DE CONTADORES */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-3.5 rounded-2xl border text-center transition-all hover:-translate-y-0.5 ${
          isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
        }`}>
          <div className={`w-7 h-7 rounded-lg mx-auto flex items-center justify-center ${
            isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
          }`}>
            <Users className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className={`font-serif text-2xl font-light mt-2 ${
            isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
          }`}>
            {referidosCount}
          </p>
          <p className={`text-[8px] uppercase font-black tracking-[0.15em] mt-0.5 ${
            isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
          }`}>
            Amigos Traídos
          </p>
        </div>

        <div className={`p-3.5 rounded-2xl border text-center transition-all hover:-translate-y-0.5 ${
          isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
        }`}>
          <div className={`w-7 h-7 rounded-lg mx-auto flex items-center justify-center ${
            isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
          }`}>
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className={`font-serif text-2xl font-light mt-2 ${
            isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
          }`}>
            {puntosGanados}
          </p>
          <p className={`text-[8px] uppercase font-black tracking-[0.15em] mt-0.5 ${
            isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
          }`}>
            Puntos VIP Acumulados
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* QR Y CÓDIGO */}
      {/* ============================================================ */}
      <div className="flex flex-col items-center gap-5">
        {/* QR */}
        <div className={`p-4 border rounded-2xl shadow-sm transition-all duration-300 hover:scale-[1.02] ${
          isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
        }`}>
          <img 
            src={qrUrl} 
            alt="Código QR" 
            className="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded-xl"
            loading="lazy"
          />
        </div>

        {/* Código */}
        <div className={`w-full p-4 rounded-2xl border text-center relative overflow-hidden ${
          isDark 
            ? 'bg-[#1E120C] border-[#3D281E]' 
            : 'bg-[#FFF9F6] border-[#F0E4DA]'
        }`}>
          <div className="relative z-10 space-y-1">
            <p className={`text-[8px] font-black uppercase tracking-[0.25em] ${
              isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
            }`}>
              Tu código de invitación
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl sm:text-2xl font-serif italic font-black text-[#D4AF37]">
                FRESH
              </span>
              <span className={`text-lg font-light ${isDark ? 'text-[#A89588]' : 'text-[#A89588]'}`}>✦</span>
              <span className={`text-xl sm:text-2xl font-mono font-black tracking-widest ${
                isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
              }`}>
                {codigoActual}
              </span>
            </div>
          </div>
        </div>

        {/* BANNER DE RECOMPENSA */}
        <div className={`w-full p-3.5 rounded-xl border text-center ${
          isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
        }`}>
          <p className={`text-xs font-medium ${
            isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
          }`}>
            🎁 ¡Regalo Mutuo! Ambos ganan <span className={`font-serif font-black text-[#D4AF37]`}>500 puntos</span> al registrarse.
          </p>
        </div>

        {/* ============================================================ */}
        {/* ACCIONES */}
        {/* ============================================================ */}
        <div className="w-full space-y-3">
          <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
            isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
          }`}>
            <div className="flex-1 min-w-0 pl-2">
              <p className={`text-[7px] font-black uppercase tracking-[0.2em] ${
                isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
              }`}>
                Enlace de invitación
              </p>
              <p className={`text-[10px] truncate font-mono mt-0.5 ${
                isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
              }`}>
                {urlReferido || 'Generando enlace...'}
              </p>
            </div>

            <button
              onClick={handleCopy}
              className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
                copiado
                  ? 'bg-emerald-500 text-white'
                  : isDark 
                    ? 'bg-[#3D281E] hover:bg-[#4A3227] text-[#A89588]' 
                    : 'bg-[#1A0E0A] hover:bg-[#D4AF37] text-[#FFF9F6] hover:text-[#1A0E0A]'
              }`}
              title="Copiar enlace"
            >
              {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleShare}
            className={`w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
              isDark 
                ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' 
                : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37] hover:text-[#1A0E0A] shadow-[0_4px_15px_rgba(26,14,10,0.15)]'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir pase exclusivo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <p className={`text-[8px] text-center font-medium ${
            isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
          }`}>
            Abre el selector de aplicaciones de tu smartphone al presionar.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}