'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import { Calendar, Sparkles, Gift, ArrowRight, RefreshCw, Trophy, Crown, CheckCircle2, Clock } from 'lucide-react'
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
        <div className="absolute w-40 h-40 bg-pink-500/10 rounded-full blur-2xl animate-pulse" />
        <div className="relative flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 border-2 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
          <Sparkles className="w-5 h-5 text-pink-400 absolute animate-pulse top-4.5" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500/60 animate-pulse">Cargando tu universo Fresh...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-8 max-w-5xl mx-auto w-full px-4 pb-16 antialiased transition-colors duration-700 ${
      isDark ? 'text-zinc-100 bg-[#09090b]' : 'text-stone-900 bg-transparent'
    }`}>

      {/* ============================================================ */}
      {/* 👑 HERO BANNER LUXURY PRESTIGE */}
      {/* ============================================================ */}
      <div className={`relative overflow-hidden rounded-[2.5rem] border transition-all duration-500 p-6 md:p-10 shadow-[0_20px_50px_-12px_rgba(219,91,154,0.15)] ${
        isDark 
          ? 'bg-gradient-to-br from-zinc-950 via-zinc-900/40 to-black border-zinc-900/80' 
          : 'bg-gradient-to-br from-stone-900 via-stone-950 to-pink-950 border-stone-800'
      }`}>
        {/* Luces de neón ambiente */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none animate-[pulse_6s_infinite]" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="space-y-5 w-full lg:w-auto">
            <div className="inline-flex items-center gap-2 border px-4 py-1.5 rounded-full backdrop-blur-md bg-white/5 border-white/10 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin-slow" />
              <span className="text-[10px] uppercase tracking-[0.25em] font-black text-pink-300">
                {timeOfDay === 'morning' ? 'Buenos días ✨' : timeOfDay === 'afternoon' ? 'Buenas tardes 💖' : 'Buenas noches 🌙'}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-none">
              Hola, <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-rose-300 to-amber-200">{nombreCliente}</span>
            </h1>

            {/* MARCADOR DIGITAL DE PUNTOS BOUTIQUE */}
            <div className="grid grid-cols-2 gap-4 pt-2 max-w-md w-full">
              <div className="border border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent rounded-2xl p-4 backdrop-blur-md group hover:border-pink-500/20 transition-all duration-300">
                <p className="text-3xl font-black text-white tracking-tight flex items-baseline gap-1.5">
                  {puntosGlow} <span className="text-xs font-medium text-pink-400">Glow</span>
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] mt-1 text-zinc-400 group-hover:text-pink-400 transition-colors">Estética Premium</p>
              </div>
              <div className="border border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent rounded-2xl p-4 backdrop-blur-md group hover:border-amber-500/20 transition-all duration-300">
                <p className="text-3xl font-black text-white tracking-tight flex items-baseline gap-1.5">
                  {puntosHair} <span className="text-xs font-medium text-amber-400">Hair</span>
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] mt-1 text-zinc-400 group-hover:text-amber-400 transition-colors">Peluquería & Stylist</p>
              </div>
            </div>

            <button 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className="inline-flex items-center gap-2 text-[9px] font-black tracking-[0.2em] uppercase px-4 py-2.5 rounded-xl transition-all duration-300 active:scale-95 border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200"
            >
              <RefreshCw className={`w-3 h-3 text-pink-400 ${refreshing ? 'animate-spin' : ''}`} /> Sincronizar Cuenta
            </button>
          </div>

          {/* Botón Agendar Cita */}
          <Link 
            href="/agenda" 
            className="w-full lg:w-auto relative group overflow-hidden px-8 py-5 rounded-2xl font-black text-xs tracking-[0.25em] uppercase transition-all duration-300 transform active:scale-[0.98] hover:-translate-y-0.5 flex items-center justify-center gap-3 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white border border-pink-400/20 shadow-[0_15px_30px_rgba(219,91,154,0.3)] hover:shadow-[0_20px_40px_rgba(219,91,154,0.4)]"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <Calendar className="w-4 h-4 transition-transform group-hover:rotate-12 duration-300" />
            <span>Agendar Turno VIP</span>
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📢 ANUNCIOS Y PROMOCIONES - RE-ESTRUCTURADOS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="transition-all hover:translate-y-[-2px] duration-300">
          <AnunciosBanner position="hero" limit={2} />
        </div>
        <div className="transition-all hover:translate-y-[-2px] duration-300">
          <PromocionesVolante limit={3} />
        </div>
      </div>

      <div className="opacity-95 hover:opacity-100 transition-opacity">
        <PromocionesVolante limit={6} showTitle={true} />
      </div>

      {/* ============================================================ */}
      {/* 📅 CONTENEDOR DE PRÓXIMOS TURNOS BENTO STYLE */}
      {/* ============================================================ */}
      <div className={`p-6 md:p-8 rounded-3xl border transition-all duration-300 shadow-xl ${
        isDark 
          ? 'bg-zinc-950/40 border-zinc-900/80 backdrop-blur-md' 
          : 'bg-white border-stone-200/60 shadow-stone-200/50'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black tracking-tight">Próximas <span className="font-serif italic font-normal text-pink-500">Citas</span></h2>
          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-pink-500/10 text-pink-500 dark:text-pink-400 rounded-full border border-pink-500/10">
            {citasProximas.length} Activas
          </span>
        </div>

        {citasProximas.length === 0 ? (
          <div className={`text-center py-12 border border-dashed rounded-2xl transition-colors ${
            isDark ? 'border-zinc-800 bg-zinc-900/10' : 'border-pink-100 bg-pink-50/10'
          }`}>
            <Clock className="w-8 h-8 text-pink-300/60 mx-auto mb-2 animate-pulse" />
            <p className="text-zinc-400 dark:text-zinc-500 text-xs font-medium tracking-wide">Consiéntete hoy, aún no registras citas pendientes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {citasProximas.slice(0, 4).map((cita: any) => (
              <div 
                key={cita.id} 
                className={`p-5 rounded-2xl border flex justify-between items-center relative overflow-hidden group transition-all duration-300 shadow-sm ${
                  isDark 
                    ? 'bg-zinc-900/20 border-zinc-900 hover:border-pink-500/20' 
                    : 'bg-gradient-to-r from-stone-50/50 to-white border-stone-200/40 hover:border-pink-200 hover:shadow-md'
                }`}
              >
                {/* Indicador de Línea Premium */}
                <span className="absolute left-0 inset-y-0 w-1 bg-gradient-to-b from-pink-500 via-rose-500 to-amber-400" />
                
                <div className="space-y-1.5 pl-3">
                  <h4 className="text-sm font-black tracking-tight group-hover:text-pink-500 transition-colors">
                    {cita.services?.name || 'Servicio de Belleza'}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-pink-400" /> {cita.date}</span>
                    <span>•</span>
                    <span>{cita.time} hs</span>
                  </div>
                </div>

                <div className="shrink-0">
                  {cita.status === 'confirmed' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Listado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" /> Pendiente
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 🎯 COMPONENTES MISIONES & LOGROS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-6">
        <MisionesDiarias />
      </div>

      <div className="transition-all duration-300 hover:shadow-[0_15px_30px_rgba(0,0,0,0.02)]">
        <QRReferido codigo={codigoReferido} user={user} />
      </div>

      <div className={`p-2 rounded-[2rem] border transition-all duration-300 ${
        isDark ? 'bg-zinc-950/20 border-zinc-900/60' : 'bg-stone-50/50 border-stone-200/40 shadow-inner'
      }`}>
        <InsigniasLogros citas={citas.length} serviciosUnicos={serviciosUnicos} referidos={referidos.length} puntos={puntosTotales} racha={3} />
      </div>

      {/* ============================================================ */}
      {/* 🎡 LUCKY WHEEL GAMIFICATION BANNER LUXE */}
      {/* ============================================================ */}
      <div className={`p-6 md:p-8 rounded-3xl border flex flex-col sm:flex-row items-center justify-between shadow-xl relative overflow-hidden transition-all duration-500 ${
        isDark 
          ? 'bg-gradient-to-r from-pink-950/20 via-zinc-950 to-amber-950/10 border-pink-950/20' 
          : 'bg-gradient-to-r from-pink-50 via-amber-50/20 to-stone-50 border-pink-100 shadow-pink-100/30'
      }`}>
        <div className="absolute top-0 right-1/4 w-40 h-40 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-5 z-10 w-full sm:w-auto">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/20 shrink-0 transform transition group-hover:scale-105">
            <Gift className="w-6 h-6 animate-[bounce_2s_infinite]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black tracking-tight">¿Te sientes con <span className="font-serif italic font-normal text-pink-500 dark:text-pink-400">Suerte</span> hoy?</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Gira la ruleta Fresh diaria y reclama obsequios VIP instantáneos.</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsRuletaOpen(true)} 
          className="w-full sm:w-auto mt-4 sm:mt-0 px-6 py-4 rounded-xl bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-950 text-white hover:bg-zinc-900 dark:hover:bg-white text-xs font-black tracking-widest uppercase shadow-xl transition transform active:scale-95 border border-zinc-800 dark:border-white"
        >
          GIRAR RULETA
        </button>
      </div>

      {/* ============================================================ */}
      {/* 📸 FEEDS Y SOCIALS */}
      {/* ============================================================ */}
      <div className="pt-6 border-t border-zinc-200/60 dark:border-zinc-900/60">
        <InstagramFeed />
      </div>

      <FooterCliente />

      {/* MODAL CONTROLLER */}
      <RuletaModal
        isOpen={isRuletaOpen}
        onClose={() => { setIsRuletaOpen(false); if (clientId) refreshPuntos(clientId) }}
        onPremioProcesado={() => { if (clientId) refreshPuntos(clientId) }}
        usuarioActivo={user || undefined}
        tenantIdActivo={tenantId ?? undefined}
      />
    </div>
  )
}
