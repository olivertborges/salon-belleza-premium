// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import { Calendar, Sparkles, Gift, ArrowRight, RefreshCw, Trophy, Crown, CheckCircle2, Clock, Gem, Star, Flame, Compass, Heart, Zap, Award, Shield, Sun, Moon, PartyPopper, Sparkle, Diamond, Medal } from 'lucide-react'
import Link from 'next/link'
import InsigniasLogros from '@/components/InsigniasLogros'
import InstagramFeed from '@/components/InstagramFeed'
import QRReferido from '@/components/QRReferido'
import RuletaModal from '@/components/RuedaSuerte'
import MisionesDiarias from '@/components/MisionesDiarias'
import AnunciosBanner from '@/components/AnunciosBanner'
import PromocionesVolante from '@/components/PromocionesVolante'
import FooterCliente from '@/components/FooterCliente'

interface Cita {
  id: string
  date: string
  time: string
  status: string
  service_id: string
  client_id: string
  services?: { name: string; price: number; duration: number }
}

interface Cliente {
  id: string
  name: string
  email: string
  phone: string
  points: number
  referral_code: string
  created_at: string
}

export default function ClientDashboardIndex() {
  const { user, tenantId, refreshUserData } = useAuth()
  const { theme } = useTheme()
  const [citas, setCitas] = useState<Cita[]>([])
  const [puntosGlow, setPuntosGlow] = useState(0)
  const [puntosHair, setPuntosHair] = useState(0)
  const [puntosTotales, setPuntosTotales] = useState(0)
  const [referidos, setReferidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nombreCliente, setNombreCliente] = useState('')
  const [citasProximas, setCitasProximas] = useState<Cita[]>([])
  const [serviciosUnicos, setServiciosUnicos] = useState(0)
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning')
  const [codigoReferido, setCodigoReferido] = useState('X7K-9M2-P4R')
  const [clientId, setClientId] = useState<string | null>(null)
  const [isRuletaOpen, setIsRuletaOpen] = useState(false)

  const isDark = theme === 'dark'

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setTimeOfDay('morning')
    else if (hour < 18) setTimeOfDay('afternoon')
    else setTimeOfDay('evening')
  }, [])

  const refreshPuntos = async (activeClientId: string) => {
    if (!activeClientId) return
    try {
      const { data, error } = await supabase
        .from('loyalty_wallets')
        .select('glow_points, hair_points')
        .eq('client_id', activeClientId)
        .maybeSingle()

      if (error) console.error("❌ Error leyendo loyalty_wallets:", error.message)

      if (data) {
        setPuntosGlow(data.glow_points || 0)
        setPuntosHair(data.hair_points || 0)
        setPuntosTotales((data.glow_points || 0) + (data.hair_points || 0))
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshUserData()
    if (clientId) await refreshPuntos(clientId)
    setTimeout(() => setRefreshing(false), 600)
  }

  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const { data: clienteData } = await supabase
          .from('clients')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (clienteData) {
          const currentCliente = clienteData as unknown as Cliente
          setClientId(currentCliente.id)
          setNombreCliente(currentCliente.name || 'Cliente')
          setCodigoReferido(currentCliente.referral_code || 'X7K-9M2-P4R')

          await refreshPuntos(currentCliente.id)

          const { data: citasData } = await supabase
            .from('appointments')
            .select(`
              *,
              services:service_id (name, price, duration)
            `)
            .eq('client_id', currentCliente.id)
            .order('date', { ascending: true })

          const safeCitas = (citasData || []) as any[]
          setCitas(safeCitas)

          const hoy = new Date()
          hoy.setHours(0, 0, 0, 0)

          const proximas = safeCitas.filter((c: any) => {
            const cDate = new Date(c.date)
            cDate.setHours(0, 0, 0, 0)
            return cDate >= hoy && c.status !== 'cancelled'
          })
          setCitasProximas(proximas)
          setServiciosUnicos(new Set(safeCitas.map((c: any) => c.service_id)).size)

          const { data: referidosData } = await supabase
            .from('clients')
            .select('id')
            .eq('referred_by_id', currentCliente.id)
          setReferidos(referidosData || [])
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[75vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="absolute w-64 h-64 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute w-48 h-48 bg-amber-500/5 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite] delay-300" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
            <Sparkles className="w-6 h-6 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-sm font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 animate-pulse">
              CARGANDO
            </p>
            <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              TU UNIVERSO FRESH
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span 
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-pink-500/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const saludoMap = {
    morning: { emoji: '🌅', text: 'Buenos días, Radiante' },
    afternoon: { emoji: '☀️', text: 'Buenas tardes, Gloriosa' },
    evening: { emoji: '🌙', text: 'Buenas noches, Estelar' }
  }

  const saludo = saludoMap[timeOfDay]

  return (
    <div className={`space-y-8 max-w-5xl mx-auto w-full px-4 pb-20 antialiased transition-colors duration-700 ${
      isDark 
        ? 'text-zinc-100 bg-gradient-to-b from-[#09090b] via-[#0d0d12] to-[#09090b]' 
        : 'text-stone-800 bg-gradient-to-b from-stone-50 via-white to-stone-50/50'
    }`}>

      {/* ============================================================ */}
      {/* 👑 HERO BANNER — LUXURY PRESTIGE EDITION */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-[2.5rem] border transition-all duration-700 p-6 md:p-10 shadow-2xl group">
        {/* Fondo con gradiente dinámico según tema */}
        <div className={`absolute inset-0 transition-colors duration-700 ${
          isDark 
            ? 'bg-gradient-to-br from-zinc-950 via-zinc-900/80 to-black' 
            : 'bg-gradient-to-br from-stone-900 via-stone-950 to-rose-950'
        }`} />

        {/* Efectos de luz ambiental animados continuamente */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none animate-[pulse_10s_ease-in-out_infinite] delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none animate-[pulse_12s_ease-in-out_infinite] delay-2000" />

        {/* Rejilla de lujo con movimiento sutil */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_transparent_0%,_white_100%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] pointer-events-none" />

        {/* Borde decorativo animado */}
        <div className="absolute inset-0 rounded-[2.5rem] p-[1px] bg-gradient-to-r from-pink-500/0 via-pink-500/20 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          {/* Columna izquierda */}
          <div className="space-y-6 w-full lg:w-auto">
            {/* Badge saludo con glassmorphism */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full backdrop-blur-xl bg-white/5 border border-white/10 shadow-lg hover:bg-white/10 transition-all duration-500">
              <span className="text-xl animate-bounce">{saludo.emoji}</span>
              <span className="text-[10px] uppercase tracking-[0.25em] font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-rose-300 to-amber-300">
                {saludo.text}
              </span>
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            </div>

            {/* Título principal con efecto de escritura sutil */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Hola,{' '}
              <span className="font-serif italic font-light text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-rose-300 to-amber-200 bg-[length:200%_auto] animate-[gradient_4s_ease-in-out_infinite]">
                {nombreCliente}
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-400 ml-2 animate-pulse" />
            </h1>

            {/* Contador de puntos — Diseño BOUTIQUE con efectos hover */}
            <div className="grid grid-cols-2 gap-4 pt-1 max-w-sm w-full">
              {/* Glow Points */}
              <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-4 md:p-5 backdrop-blur-md hover:border-pink-500/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(219,91,154,0.12)] hover:-translate-y-1">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl md:text-4xl font-black text-white tracking-tight">{puntosGlow}</span>
                  <span className="text-[10px] md:text-xs font-black tracking-[0.15em] text-pink-400">GLOW</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Gem className="w-3 h-3 text-pink-400/60 group-hover:text-pink-400 transition-colors" />
                  <span className="text-[8px] md:text-[9px] font-medium tracking-[0.1em] text-zinc-400 group-hover:text-pink-400/80 transition-colors">Estética Premium</span>
                </div>
                <div className="mt-3 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full animate-[pulse_3s_ease-in-out_infinite]" />
                </div>
              </div>

              {/* Hair Points */}
              <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-4 md:p-5 backdrop-blur-md hover:border-amber-500/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(245,158,11,0.12)] hover:-translate-y-1">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl md:text-4xl font-black text-white tracking-tight">{puntosHair}</span>
                  <span className="text-[10px] md:text-xs font-black tracking-[0.15em] text-amber-400">HAIR</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Star className="w-3 h-3 text-amber-400/60 group-hover:text-amber-400 transition-colors" />
                  <span className="text-[8px] md:text-[9px] font-medium tracking-[0.1em] text-zinc-400 group-hover:text-amber-400/80 transition-colors">Stylist & Color</span>
                </div>
                <div className="mt-3 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-[pulse_4s_ease-in-out_infinite] delay-500" />
                </div>
              </div>
            </div>

            {/* Botón sincronizar con efecto de brillo */}
            <button 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className="inline-flex items-center gap-3 text-[9px] font-black tracking-[0.2em] uppercase px-5 py-3 rounded-xl transition-all duration-300 active:scale-95 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-zinc-300 hover:text-white group relative overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
              <RefreshCw className={`w-3.5 h-3.5 text-pink-400/70 group-hover:text-pink-400 transition-colors ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} /> 
              <span className="relative">{refreshing ? 'Sincronizando...' : 'Sincronizar Cuenta'}</span>
            </button>
          </div>

          {/* Columna derecha — Botón CTA principal con efectos premium */}
          <Link 
            href="/agenda" 
            className="w-full lg:w-auto relative group overflow-hidden px-6 md:px-8 py-4 md:py-5 rounded-2xl font-black text-[10px] md:text-xs tracking-[0.25em] uppercase transition-all duration-500 transform active:scale-[0.97] hover:-translate-y-1 flex items-center justify-center gap-3 md:gap-4 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white border border-pink-400/20 shadow-[0_15px_40px_rgba(219,91,154,0.35)] hover:shadow-[0_25px_60px_rgba(219,91,154,0.5)]"
          >
            {/* Efecto shine */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-400/0 via-white/10 to-pink-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Punto pulsante */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>

            <Calendar className="w-4 h-4 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
            <span className="relative">Agendar Turno VIP</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-500 group-hover:translate-x-1.5" />
          </Link>
        </div>

        {/* Decoración esquina inferior con animación */}
        <div className="absolute bottom-5 right-8 opacity-[0.06] text-white text-[8px] md:text-[10px] font-black tracking-[0.3em] select-none pointer-events-none animate-pulse">
          ✦ FRESH BEAUTY ✦
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📢 ANUNCIOS Y PROMOCIONES — CON EFECTOS CONTINUOS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className={`transition-all duration-500 hover:translate-y-[-4px] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl ${
          isDark ? 'shadow-black/30 hover:shadow-black/50' : 'shadow-stone-200/50 hover:shadow-stone-300/60'
        }`}>
          <AnunciosBanner position="hero" limit={2} />
        </div>
        <div className={`transition-all duration-500 hover:translate-y-[-4px] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl ${
          isDark ? 'shadow-black/30 hover:shadow-black/50' : 'shadow-stone-200/50 hover:shadow-stone-300/60'
        }`}>
          <PromocionesVolante limit={3} />
        </div>
      </div>

      <div className={`transition-all duration-500 hover:scale-[1.01] rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl ${
        isDark ? 'shadow-black/20 hover:shadow-black/40' : 'shadow-stone-200/40 hover:shadow-stone-300/50'
      }`}>
        <PromocionesVolante limit={6} showTitle={true} />
      </div>

      {/* ============================================================ */}
      {/* 📅 PRÓXIMOS TURNOS — BENTO LUXURY CON ANIMACIONES CONTINUAS */}
      {/* ============================================================ */}
      <div className={`p-6 md:p-9 rounded-3xl border transition-all duration-500 shadow-2xl hover:shadow-3xl ${
        isDark 
          ? 'bg-gradient-to-br from-zinc-950/60 via-zinc-950/30 to-zinc-950/60 border-zinc-900/60 shadow-black/40 hover:shadow-black/60' 
          : 'bg-gradient-to-br from-white via-stone-50/80 to-white border-stone-200/60 shadow-stone-300/30 hover:shadow-stone-400/40'
      }`}>
        {/* Header con diseño premium */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 ${
              isDark ? 'bg-pink-500/10' : 'bg-pink-100/50'
            }`}>
              <Calendar className={`w-4 h-4 ${
                isDark ? 'text-pink-400' : 'text-pink-600'
              }`} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black tracking-tight">Tus <span className="font-serif italic font-normal text-pink-500">Próximas</span> Citas</h2>
              <p className="text-[9px] md:text-[10px] font-medium tracking-wider text-zinc-400 dark:text-zinc-500">Consiente tu agenda</p>
            </div>
          </div>
          <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-wider px-3 md:px-4 py-1.5 rounded-full border transition-all duration-300 hover:scale-105 ${
            isDark 
              ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' 
              : 'bg-pink-100/50 text-pink-600 border-pink-200'
          }`}>
            {citasProximas.length} Activas
          </span>
        </div>

        {citasProximas.length === 0 ? (
          <div className={`text-center py-12 md:py-16 border border-dashed rounded-2xl transition-all duration-500 hover:border-pink-300/30 ${
            isDark ? 'border-zinc-800 bg-zinc-900/20' : 'border-pink-200/50 bg-pink-50/30'
          }`}>
            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 hover:scale-110 ${
              isDark ? 'bg-zinc-800/50' : 'bg-pink-100/50'
            }`}>
              <Clock className={`w-6 h-6 md:w-7 md:h-7 ${
                isDark ? 'text-zinc-600' : 'text-pink-300'
              }`} />
            </div>
            <p className={`text-sm font-medium tracking-wide ${
              isDark ? 'text-zinc-400' : 'text-stone-400'
            }`}>
              Aún no tienes citas pendientes
            </p>
            <p className="text-[9px] md:text-[10px] text-zinc-500 dark:text-zinc-600 mt-1 tracking-wider">
              Agenda tu próximo momento de belleza ✨
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {citasProximas.slice(0, 4).map((cita: any, index: number) => (
              <div 
                key={cita.id} 
                className={`group p-4 md:p-5 rounded-2xl border flex justify-between items-center relative overflow-hidden transition-all duration-500 shadow-sm hover:shadow-xl hover:-translate-y-1 ${
                  isDark 
                    ? 'bg-zinc-900/30 border-zinc-800/60 hover:border-pink-500/30 hover:bg-zinc-900/50' 
                    : 'bg-white/70 border-stone-200/60 hover:border-pink-300/50 hover:bg-white shadow-stone-200/30'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Línea lateral colorida con glow */}
                <span className="absolute left-0 inset-y-0 w-1 rounded-r-full bg-gradient-to-b from-pink-500 via-rose-500 to-amber-400 shadow-[0_0_20px_rgba(219,91,154,0.3)] group-hover:shadow-[0_0_30px_rgba(219,91,154,0.5)] transition-all duration-500" />

                {/* Contenido */}
                <div className="space-y-1.5 pl-4 flex-1 min-w-0">
                  <h4 className={`text-sm font-black tracking-tight truncate transition-colors duration-300 ${
                    isDark ? 'text-zinc-200 group-hover:text-pink-400' : 'text-stone-800 group-hover:text-pink-600'
                  }`}>
                    {cita.services?.name || 'Servicio de Belleza'}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-pink-400/70 group-hover:text-pink-400 transition-colors" />
                      {cita.date}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-zinc-400/30" />
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-pink-400/70 group-hover:text-pink-400 transition-colors" />
                      {cita.time} hs
                    </span>
                  </div>
                </div>

                {/* Badge estado */}
                <div className="shrink-0 ml-2">
                  {cita.status === 'confirmed' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-[0.15em] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 hover:bg-emerald-500/20 transition-all duration-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Confirmada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-[0.15em] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15 hover:bg-amber-500/20 transition-all duration-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      Pendiente
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Link Ver todas */}
        {citasProximas.length > 4 && (
          <div className="mt-5 text-center">
            <Link 
              href="/mis-citas" 
              className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 hover:tracking-[0.3em] inline-flex items-center gap-2 group ${
                isDark ? 'text-zinc-400 hover:text-pink-400' : 'text-stone-400 hover:text-pink-600'
              }`}
            >
              Ver todas las citas <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 🎯 MISIONES DIARIAS + LOGROS — DISEÑO INTEGRADO */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-6">
        <div className={`rounded-3xl overflow-hidden shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
          isDark ? 'shadow-black/30 hover:shadow-black/50' : 'shadow-stone-200/40 hover:shadow-stone-300/50'
        }`}>
          <MisionesDiarias />
        </div>
      </div>

      {/* QR Referido — con glass effect y hover premium */}
      <div className={`transition-all duration-500 hover:translate-y-[-3px] rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl ${
        isDark ? 'shadow-black/40 hover:shadow-black/60' : 'shadow-stone-300/30 hover:shadow-stone-400/40'
      }`}>
        <QRReferido codigo={codigoReferido} user={user} />
      </div>

      {/* Insignias y Logros — con efecto premium */}
      <div className={`p-3 rounded-[2.5rem] border transition-all duration-500 hover:shadow-2xl ${
        isDark 
          ? 'bg-gradient-to-br from-zinc-950/40 via-zinc-950/20 to-zinc-950/40 border-zinc-900/60 shadow-black/30 hover:shadow-black/50' 
          : 'bg-gradient-to-br from-white via-stone-50/60 to-white border-stone-200/50 shadow-stone-300/20 hover:shadow-stone-400/30'
      }`}>
        <InsigniasLogros 
          citas={citas.length} 
          serviciosUnicos={serviciosUnicos} 
          referidos={referidos.length} 
          puntos={puntosTotales} 
          racha={3} 
        />
      </div>

      {/* ============================================================ */}
      {/* 🎡 LUCKY WHEEL — GAMIFICATION LUXE CON EFECTOS CONTINUOS */}
      {/* ============================================================ */}
      <div className={`p-6 md:p-9 rounded-3xl border flex flex-col sm:flex-row items-center justify-between shadow-2xl relative overflow-hidden transition-all duration-700 hover:shadow-3xl hover:-translate-y-1 ${
        isDark 
          ? 'bg-gradient-to-br from-pink-950/15 via-zinc-950 to-amber-950/10 border-pink-950/20 shadow-black/40 hover:shadow-black/60' 
          : 'bg-gradient-to-br from-pink-50/80 via-amber-50/40 to-stone-50/80 border-pink-200/30 shadow-pink-200/30 hover:shadow-pink-300/40'
      }`}>
        {/* Fondo decorativo con animación continua */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-full blur-3xl pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-20 left-20 w-40 h-40 bg-amber-500/5 rounded-full blur-2xl pointer-events-none animate-[pulse_10s_ease-in-out_infinite] delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-pink-500/5 rounded-full blur-2xl pointer-events-none animate-[pulse_12s_ease-in-out_infinite] delay-2000" />

        <div className="flex flex-col sm:flex-row items-center gap-6 z-10 w-full">
          <div className="relative shrink-0">
            <div className={`p-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-2xl shadow-pink-500/30 shrink-0 transform transition-all duration-500 hover:scale-110 hover:rotate-3 ${
              isDark ? 'shadow-pink-500/20' : 'shadow-pink-500/30'
            }`}>
              <Gift className="w-6 h-6 md:w-7 md:h-7 animate-[bounce_2s_ease-in-out_infinite]" />
            </div>
            {/* Anillo decorativo */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-pink-500/20 to-amber-500/20 blur-lg -z-10 animate-pulse" />
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
            <h3 className="text-lg md:text-xl font-black tracking-tight flex flex-wrap items-center justify-center sm:justify-start gap-2">
              ¿Sientes la <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">Suerte</span> hoy?
              <PartyPopper className="w-4 h-4 text-amber-400 inline-block animate-bounce" />
            </h3>
            <p className="text-[10px] md:text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-wide max-w-xs mx-auto sm:mx-0">
              Gira la ruleta Fresh y reclama obsequios VIP instantáneos. ¡Un premio te espera!
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1">
              {['✨', '💎', '🌟', '🎯'].map((emoji, i) => (
                <span key={i} className="text-sm md:text-base animate-[bounce_2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.2}s` }}>
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsRuletaOpen(true)} 
          className={`w-full sm:w-auto mt-4 sm:mt-0 px-6 md:px-8 py-3.5 md:py-4.5 rounded-xl font-black text-[9px] md:text-xs tracking-[0.25em] uppercase transition-all duration-500 transform active:scale-95 hover:-translate-y-1 shadow-xl flex items-center justify-center gap-3 group relative overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-r from-zinc-100 to-white text-zinc-950 hover:shadow-2xl hover:shadow-white/10' 
              : 'bg-gradient-to-r from-zinc-900 to-stone-800 text-white hover:shadow-2xl hover:shadow-stone-900/20'
          }`}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
          <Trophy className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
          <span className="relative">GIRAR RULETA</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-180 transition-transform duration-700" />
        </button>
      </div>

      {/* ============================================================ */}
      {/* 📸 INSTAGRAM FEED — BORDER GLOW */}
      {/* ============================================================ */}
      <div className={`pt-6 border-t transition-all duration-500 ${
        isDark ? 'border-zinc-900/60' : 'border-stone-200/40'
      }`}>
        <div className={`rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 ${
          isDark ? 'shadow-black/30 hover:shadow-black/50' : 'shadow-stone-200/40 hover:shadow-stone-300/50'
        }`}>
          <InstagramFeed />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📱 FOOTER CLIENTE */}
      {/* ============================================================ */}
      <FooterCliente />

      {/* ============================================================ */}
      {/* 🎡 MODAL RULETA */}
      {/* ============================================================ */}
      <RuletaModal
        isOpen={isRuletaOpen}
        onClose={() => { setIsRuletaOpen(false); if (clientId) refreshPuntos(clientId) }}
        onPremioProcesado={() => { if (clientId) refreshPuntos(clientId) }}
        usuarioActivo={user || undefined}
        tenantIdActivo={tenantId ?? undefined}
      />

      {/* ============================================================ */}
      {/* STYLES GLOBALES */}
      {/* ============================================================ */}
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shine {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .animate-gradient {
          animation: gradient 4s ease-in-out infinite;
        }
        .animate-shine {
          animation: shine 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}