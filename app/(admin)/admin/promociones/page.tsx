// @ts-nocheck
'use client'

import { useState } from 'react'
import { Sparkles, Crown, Percent, Calendar, ArrowRight, CheckCircle2, PlusCircle } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'

export default function PromocionesPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Simulación de promociones activas alineadas a la base de datos
  const [promociones] = useState([
    {
      id: 1,
      titulo: "Nails VIP Season",
      descuento: "20% OFF",
      descripcion: "Aplica para sistemas de esculpidas completas y diseño premium los días martes y miércoles.",
      validez: "Hasta 31 Ago",
      badge: "POPULAR"
    },
    {
      id: 2,
      titulo: "Glow Up Birthday",
      descuento: "Gift Card",
      descripcion: "Trae a una amiga en el mes de tu cumpleaños y ambas reciben un tratamiento de spa de manos gratis.",
      validez: "Permanente",
      badge: "EXCLUSIVO"
    }
  ])

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-12 relative overflow-hidden ${isDark ? 'bg-[#150D08] text-[#FFF9F6]' : 'bg-[#FDFBF9] text-[#1A0E0A]'}`}>
      
      {/* Fondos Decorativos Orgánicos Coincidentes */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#EC4899]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none z-0 opacity-15 mix-blend-overlay bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 relative z-10 pt-4">

        {/* HEADER HERO BANNER (Copia exacta de tu diseño base) */}
        <div className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ${
          isDark 
            ? 'bg-gradient-to-br from-[#271810] via-[#1E120C] to-[#160E09] border-[#3D281E] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]' 
            : 'bg-gradient-to-br from-white via-[#FBF7F4] to-[#F5ECE5] border-[#EADED5] shadow-[0_25px_50px_-15px_rgba(225,208,195,0.4)]'
        }`}>
          <div className="absolute -top-40 -right-40 w-[350px] h-[350px] bg-gradient-to-br from-[#EC4899]/20 to-[#D4AF37]/20 rounded-full blur-[90px] pointer-events-none animate-pulse [animation-duration:6s]" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

          <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37] via-[#EC4899] to-[#3B82F6] rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-4 rounded-2xl shadow-xl bg-neutral-950 text-white flex items-center justify-center border border-white/10">
                  <Percent className="w-7 h-7 text-[#D4AF37] animate-pulse" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[9px] font-black uppercase tracking-[0.25em] text-[#C9A96E]">
                  <Sparkles className="w-2.5 h-2.5" />
                  ✦ Campañas Activas
                </div>
                <h2 className={`font-serif text-3xl md:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                  Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#EC4899] to-[#C9A96E] font-serif italic font-normal">Promociones</span>
                </h2>
                <p className={`text-sm font-light ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                  Crea, edita y distribuye ofertas exclusivas para fidelizar a tu comunidad VIP.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 border-t pt-5 md:pt-0 md:border-t-0 border-[#EADED5] dark:border-[#3D281E]">
              <button 
                className={`w-full sm:w-auto px-5 py-3 rounded-xl text-neutral-950 font-black text-xs uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl shadow-[#D4AF37]/10 hover:shadow-[#D4AF37]/20 hover:scale-[1.03] active:scale-95 bg-gradient-to-r from-[#D4AF37] via-[#E8D5A0] to-[#C9A96E]`}
              >
                <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Nueva Promoción</span>
              </button>
            </div>
          </div>
        </div>

        {/* GRILLA DE PROMOCIONES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promociones.map((promo) => (
            <div 
              key={promo.id}
              className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-500 hover:shadow-2xl ${
                isDark 
                  ? 'bg-[#1E120C] border-[#3D281E] hover:border-[#D4AF37]/50 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.6)]' 
                  : 'bg-white border-[#EADED5] hover:border-[#D4AF37]/50 shadow-[0_15px_40px_-20px_rgba(225,208,195,0.5)]'
              }`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#D4AF37]/10 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110" />
              
              <div className="flex flex-col h-full justify-between space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isDark 
                        ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#C9A96E]' 
                        : 'bg-[#FAF6F2] border-[#EADED5] text-[#C9A96E]'
                    }`}>
                      {promo.badge}
                    </span>
                    <h3 className={`font-serif text-xl font-bold mt-2 ${isDark ? 'text-white' : 'text-[#1A0E0A]'}`}>
                      {promo.titulo}
                    </h3>
                    <p className={`text-xs font-light mt-1 line-clamp-2 ${isDark ? 'text-[#BCAEA5]' : 'text-[#6E5A4D]'}`}>
                      {promo.descripcion}
                    </p>
                  </div>

                  {/* CORRECCIÓN AQUÍ: Letras blancas (text-white) sobre el gradiente dinámico */}
                  <div className="p-4 rounded-xl shrink-0 shadow-xl bg-gradient-to-tr from-[#D4AF37] via-[#EC4899] to-[#C9A96E] text-white flex flex-col items-center justify-center min-w-[85px] text-center border border-white/10">
                    <span className="text-xs font-black uppercase tracking-tighter leading-none opacity-90">Valor</span>
                    <span className="text-sm font-serif font-black tracking-tight leading-none mt-1 text-white">
                      {promo.descuento}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-dashed border-[#EADED5]/60 dark:border-[#3D281E]/60">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#C9A96E]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{promo.validez}</span>
                  </div>
                  
                  <button className={`text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 ${
                    isDark ? 'text-[#BCAEA5] bg-[#291A11] hover:text-[#D4AF37]' : 'text-[#6E5A4D] bg-[#FAF6F2] hover:text-[#D4AF37]'
                  }`}>
                    <span>Configurar</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`p-4 rounded-xl border border-dashed flex items-center gap-2.5 text-[11px] font-medium ${
          isDark ? 'bg-[#170E09]/50 border-[#3D281E] text-[#BCAEA5]' : 'bg-[#FAF8F5]/60 border-[#EADED5] text-[#6E5A4D]'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span>Las promociones activas se sincronizan automáticamente con la app móvil de tus clientes.</span>
        </div>

      </div>
    </div>
  )
}
