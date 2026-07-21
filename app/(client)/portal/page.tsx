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
      {/* 👑 HERO BANNER — LUXURY COMPACT EDITION */}
      {/* ============================================================ */}
      <div className={`relative overflow-hidden rounded-2xl md:rounded-3xl border transition-all duration-700 p-5 md:p-8 shadow-2xl ${
        isDark 
          ? 'bg-gradient-to-br from-zinc-950 via-zinc-900/80 to-black border-zinc-900/60 shadow-[0_20px_60px_rgba(0,0,0,0.6)]' 
          : 'bg-gradient-to-br from-rose-50/90 via-pink-50/80 to-amber-50/70 border-pink-200/50 shadow-[0_20px_60px_rgba(219,91,154,0.12)]'
      }`}>
        
        {/* Efectos de luz ambiental */}
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite] ${
          isDark ? 'bg-pink-600/10' : 'bg-pink-300/20'
        }`} />
        <div className={`absolute -bottom-32 left-1/4 w-80 h-80 rounded-full blur-[100px] pointer-events-none animate-[pulse_10s_ease-in-out_infinite] delay-1000 ${
          isDark ? 'bg-amber-500/5' : 'bg-amber-300/15'
        }`} />

        {/* Rejilla decorativa */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_transparent_0%,_white_100%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Columna izquierda */}
          <div className="space-y-4 w-full lg:w-auto">
            {/* Badge saludo */}
            <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full backdrop-blur-xl border shadow-sm ${
              isDark 
                ? 'bg-white/5 border-white/10' 
                : 'bg-white/60 border-white/80'
            }`}>
              <span className="text-lg animate-bounce">{saludo.emoji}</span>
              <span className={`text-[9px] uppercase tracking-[0.2em] font-black ${
                isDark 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-rose-300 to-amber-300' 
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600'
              }`}>
                {saludo.text}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                isDark ? 'bg-pink-500' : 'bg-pink-500'
              }`} />
            </div>

            {/* Título */}
            <h1 className={`text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] ${
              isDark ? 'text-white' : 'text-stone-800'
            }`}>
              Hola,{' '}
              <span className={`font-serif italic font-light bg-[length:200%_auto] animate-[gradient_4s_ease-in-out_infinite] ${
                isDark 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-rose-300 to-amber-200' 
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600'
              }`}>
                {nombreCliente}
              </span>
            </h1>

            {/* Puntos - diseño compacto horizontal en móvil, vertical en desktop */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Glow Points */}
              <div className={`relative group flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-500 hover:-translate-y-0.5 ${
                isDark 
                  ? 'border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent hover:border-pink-500/40 hover:shadow-[0_0_30px_rgba(219,91,154,0.1)]' 
                  : 'border-pink-200/50 bg-gradient-to-br from-white/80 to-pink-50/50 hover:border-pink-400/40 hover:shadow-[0_0_30px_rgba(219,91,154,0.1)]'
              }`}>
                <Gem className={`w-4 h-4 ${
                  isDark ? 'text-pink-400/70' : 'text-pink-500/70'
                }`} />
                <div>
                  <span className={`text-xl font-black ${
                    isDark ? 'text-white' : 'text-stone-800'
                  }`}>{puntosGlow}</span>
                  <span className="text-[10px] font-black tracking-[0.1em] text-pink-500 ml-1">GLOW</span>
                </div>
              </div>

              {/* Hair Points */}
              <div className={`relative group flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-500 hover:-translate-y-0.5 ${
                isDark 
                  ? 'border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]' 
                  : 'border-amber-200/50 bg-gradient-to-br from-white/80 to-amber-50/50 hover:border-amber-400/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]'
              }`}>
                <Star className={`w-4 h-4 ${
                  isDark ? 'text-amber-400/70' : 'text-amber-500/70'
                }`} />
                <div>
                  <span className={`text-xl font-black ${
                    isDark ? 'text-white' : 'text-stone-800'
                  }`}>{puntosHair}</span>
                  <span className="text-[10px] font-black tracking-[0.1em] text-amber-500 ml-1">HAIR</span>
                </div>
              </div>
            </div>

            {/* Botón sincronizar */}
            <button 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className={`inline-flex items-center gap-2 text-[8px] font-black tracking-[0.2em] uppercase px-4 py-2 rounded-xl transition-all duration-300 active:scale-95 border group relative overflow-hidden ${
                isDark 
                  ? 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-zinc-300 hover:text-white' 
                  : 'border-pink-200/60 bg-pink-50/50 hover:bg-pink-100/50 hover:border-pink-300/60 text-stone-600 hover:text-pink-700'
              }`}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
              <RefreshCw className={`w-3 h-3 transition-colors ${
                isDark 
                  ? 'text-pink-400/70 group-hover:text-pink-400' 
                  : 'text-pink-500/70 group-hover:text-pink-500'
              } ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} /> 
              <span className="relative">{refreshing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>
          </div>

          {/* Columna derecha — Botón CTA */}
          <Link 
            href="/agenda" 
            className={`w-full lg:w-auto relative group overflow-hidden px-6 py-4 rounded-xl font-black text-[10px] tracking-[0.2em] uppercase transition-all duration-500 transform active:scale-[0.97] hover:-translate-y-1 flex items-center justify-center gap-3 text-white border border-pink-400/20 shadow-[0_15px_40px_rgba(219,91,154,0.3)] hover:shadow-[0_20px_50px_rgba(219,91,154,0.45)] ${
              isDark 
                ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600' 
                : 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600'
            }`}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
            
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>

            <Calendar className="w-4 h-4 transition-transform duration-500 group-hover:rotate-12" />
            <span className="relative">Agendar Turno VIP</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-500 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Decoración esquina */}
        <div className={`absolute bottom-3 right-6 opacity-[0.04] text-[8px] font-black tracking-[0.3em] select-none pointer-events-none ${
          isDark ? 'text-white' : 'text-stone-800'
        }`}>
          ✦ FRESH BEAUTY ✦
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📢 ANUNCIOS Y PROMOCIONES */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className={`transition-all duration-500 hover:translate-y-[-3px] rounded-2xl overflow-hidden shadow-lg ${
          isDark ? 'shadow-black/30' : 'shadow-stone-200/50'
        }`}>
          <AnunciosBanner position="hero" limit={2} />
        </div>
        <div className={`transition-all duration-500 hover:translate-y-[-3px] rounded-2xl overflow-hidden shadow-lg ${
          isDark ? 'shadow-black/30' : 'shadow-stone-200/50'
        }`}>
          <PromocionesVolante limit={3} />
        </div>
      </div>

      <div className={`transition-all duration-500 hover:scale-[1.005] rounded-2xl overflow-hidden shadow-xl ${
        isDark ? 'shadow-black/20' : 'shadow-stone-200/40'
      }`}>
        <PromocionesVolante limit={6} showTitle={true} />
      </div>

      {/* ============================================================ */}
      {/* 📅 PRÓXIMOS TURNOS */}
      {/* ============================================================ */}
      <div className={`p-6 md:p-8 rounded-2xl border transition-all duration-500 shadow-xl ${
        isDark 
          ? 'bg-zinc-950/60 border-zinc-900/60 shadow-black/40' 
          : 'bg-white/80 border-stone-200/60 shadow-stone-300/30 backdrop-blur-sm'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              isDark ? 'bg-pink-500/10' : 'bg-pink-100/50'
            }`}>
              <Calendar className={`w-4 h-4 ${
                isDark ? 'text-pink-400' : 'text-pink-600'
              }`} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Tus <span className="font-serif italic font-normal text-pink-500">Próximas</span> Citas</h2>
              <p className="text-[9px] font-medium tracking-wider text-zinc-400 dark:text-zinc-500">Consiente tu agenda</p>
            </div>
          </div>
          <span className={`text-[8px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
            isDark 
              ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' 
              : 'bg-pink-100/50 text-pink-600 border-pink-200'
          }`}>
            {citasProximas.length} Activas
          </span>
        </div>

        {citasProximas.length === 0 ? (
          <div className={`text-center py-12 border border-dashed rounded-xl ${
            isDark ? 'border-zinc-800 bg-zinc-900/20' : 'border-pink-200/50 bg-pink-50/30'
          }`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
              isDark ? 'bg-zinc-800/50' : 'bg-pink-100/50'
            }`}>
              <Clock className={`w-6 h-6 ${
                isDark ? 'text-zinc-600' : 'text-pink-300'
              }`} />
            </div>
            <p className={`text-sm font-medium ${
              isDark ? 'text-zinc-400' : 'text-stone-400'
            }`}>
              Aún no tienes citas pendientes
            </p>
            <p className="text-[9px] text-zinc-500 dark:text-zinc-600 mt-1">
              Agenda tu próximo momento de belleza ✨
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {citasProximas.slice(0, 4).map((cita: any) => (
              <div 
                key={cita.id} 
                className={`group p-4 rounded-xl border flex justify-between items-center relative overflow-hidden transition-all duration-500 shadow-sm hover:shadow-xl hover:-translate-y-0.5 ${
                  isDark 
                    ? 'bg-zinc-900/30 border-zinc-800/60 hover:border-pink-500/30 hover:bg-zinc-900/50' 
                    : 'bg-white/70 border-stone-200/60 hover:border-pink-300/50 hover:bg-white shadow-stone-200/30'
                }`}
              >
                <span className="absolute left-0 inset-y-0 w-1 rounded-r-full bg-gradient-to-b from-pink-500 via-rose-500 to-amber-400" />
                <div className="space-y-1 pl-4 flex-1 min-w-0">
                  <h4 className={`text-sm font-black tracking-tight truncate transition-colors ${
                    isDark ? 'text-zinc-200 group-hover:text-pink-400' : 'text-stone-800 group-hover:text-pink-600'
                  }`}>
                    {cita.services?.name || 'Servicio de Belleza'}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-pink-400/70" />
                      {cita.date}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-zinc-400/30" />
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-pink-400/70" />
                      {cita.time} hs
                    </span>
                  </div>
                </div>
                <div className="shrink-0 ml-2">
                  {cita.status === 'confirmed' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.15em] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Confirmada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.15em] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      Pendiente
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 🎯 MISIONES DIARIAS + LOGROS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-6">
        <div className={`rounded-2xl overflow-hidden shadow-xl transition-all duration-500 hover:shadow-2xl ${
          isDark ? 'shadow-black/30' : 'shadow-stone-200/40'
        }`}>
          <MisionesDiarias />
        </div>
      </div>

      {/* QR Referido */}
      <div className={`transition-all duration-500 hover:translate-y-[-2px] rounded-2xl overflow-hidden shadow-2xl ${
        isDark ? 'shadow-black/40' : 'shadow-stone-300/30'
      }`}>
        <QRReferido codigo={codigoReferido} user={user} />
      </div>

      {/* Insignias y Logros */}
      <div className={`p-3 rounded-2xl border transition-all duration-500 ${
        isDark 
          ? 'bg-zinc-950/40 border-zinc-900/60 shadow-black/30' 
          : 'bg-white/60 border-stone-200/50 shadow-stone-300/20'
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
      {/* 🎡 LUCKY WHEEL */}
      {/* ============================================================ */}
      <div className={`p-6 md:p-8 rounded-2xl border flex flex-col sm:flex-row items-center justify-between shadow-2xl relative overflow-hidden transition-all duration-700 hover:shadow-3xl ${
        isDark 
          ? 'bg-gradient-to-br from-pink-950/10 via-zinc-950 to-amber-950/5 border-pink-950/20 shadow-black/40' 
          : 'bg-gradient-to-br from-pink-50/60 via-amber-50/30 to-stone-50/60 border-pink-200/30 shadow-pink-200/20'
      }`}>
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-20 left-20 w-40 h-40 bg-amber-500/5 rounded-full blur-2xl pointer-events-none animate-pulse" />

        <div className="flex flex-col sm:flex-row items-center gap-5 z-10 w-full">
          <div className="relative shrink-0">
            <div className={`p-3.5 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-xl shadow-pink-500/30 transform transition-all duration-500 hover:scale-110 hover:rotate-3`}>
              <Gift className="w-5 h-5 animate-bounce" />
            </div>
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-pink-500/20 to-amber-500/20 blur-lg -z-10 animate-pulse" />
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
            <h3 className="text-lg font-black tracking-tight flex flex-wrap items-center justify-center sm:justify-start gap-2">
              ¿Sientes la <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">Suerte</span> hoy?
              <PartyPopper className="w-4 h-4 text-amber-400 inline-block animate-bounce" />
            </h3>
            <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto sm:mx-0">
              Gira la ruleta Fresh y reclama obsequios VIP instantáneos.
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsRuletaOpen(true)} 
          className={`w-full sm:w-auto mt-4 sm:mt-0 px-6 py-3.5 rounded-xl font-black text-[9px] tracking-[0.2em] uppercase transition-all duration-500 transform active:scale-95 hover:-translate-y-1 shadow-xl flex items-center justify-center gap-3 group relative overflow-hidden ${
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
      {/* 📸 INSTAGRAM FEED */}
      {/* ============================================================ */}
      <div className={`pt-6 border-t ${
        isDark ? 'border-zinc-900/60' : 'border-stone-200/40'
      }`}>
        <div className={`rounded-2xl overflow-hidden shadow-xl ${
          isDark ? 'shadow-black/30' : 'shadow-stone-200/40'
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