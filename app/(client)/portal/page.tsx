// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import { 
  Calendar, Sparkles, Gift, ArrowRight, RefreshCw, Trophy, 
  Crown, CheckCircle2, Clock, Gem, Star, Flame, Compass, 
  Heart, Zap, Award, Shield, Sun, Moon, PartyPopper, 
  Diamond, Medal, Flower2, Waves, Feather,
  Wind, Droplets, Leaf, Palette, Scissors, Eye, 
  Cherry, Coffee, GlassWater, User, Phone, Mail, MapPin,
  CreditCard, History, Settings, LogOut, ChevronRight,
  BadgeCheck, Coins, Sparkle, Stars
} from 'lucide-react'
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

// ============================================================
// COMPONENTE DE CARGA
// ============================================================
const LoadingSpinner = ({ isDark }: { isDark: boolean }) => (
  <div className="flex items-center justify-center min-h-[75vh] relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-rose-50/30 via-white to-pink-50/20 animate-pulse" />
    <div className="absolute w-96 h-96 bg-gradient-to-r from-rose-200/20 to-pink-200/20 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
    <div className="absolute w-72 h-72 bg-amber-200/10 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite] delay-300" />
    <div className="relative flex flex-col items-center justify-center gap-5 bg-white/70 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-rose-100/50 shadow-2xl">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-rose-200/30 border-t-rose-400 animate-spin" />
        <Sparkles className="w-6 h-6 text-rose-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>
      <div className="space-y-1.5 text-center">
        <p className="text-sm font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-400 animate-pulse">
          CARGANDO
        </p>
        <p className="text-[10px] font-medium tracking-[0.3em] text-stone-400">
          TU ESPACIO DE BELLEZA
        </p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span 
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-rose-400/60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  </div>
)

// ============================================================
// TARJETA DE PUNTOS
// ============================================================
const PointsCard = ({ 
  glow, 
  hair, 
  isDark 
}: { 
  glow: number, 
  hair: number, 
  isDark: boolean 
}) => (
  <div className="relative group">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-300 via-pink-300 to-amber-300 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
    <div className={`relative p-4 rounded-2xl border transition-all duration-500 group-hover:-translate-y-1 ${
      isDark 
        ? 'bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border-zinc-800/50' 
        : 'bg-gradient-to-br from-white/90 to-rose-50/70 border-rose-100/50'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${
            isDark ? 'text-zinc-500' : 'text-stone-400'
          }`}>
            Tus Puntos
          </p>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-400/20">
                <Gem className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className={`text-xl font-black ${
                  isDark ? 'text-white' : 'text-stone-800'
                }`}>{glow}</span>
                <span className="text-[8px] font-black tracking-[0.1em] text-rose-400 ml-1">GLOW</span>
              </div>
            </div>
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-stone-300/30 to-transparent" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-400/20">
                <Star className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className={`text-xl font-black ${
                  isDark ? 'text-white' : 'text-stone-800'
                }`}>{hair}</span>
                <span className="text-[8px] font-black tracking-[0.1em] text-amber-400 ml-1">HAIR</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-serif italic ${
            isDark ? 'text-rose-400' : 'text-rose-500'
          }`}>
            {glow + hair}
          </div>
          <p className={`text-[7px] font-black uppercase tracking-[0.2em] ${
            isDark ? 'text-zinc-500' : 'text-stone-400'
          }`}>
            Puntos Totales
          </p>
        </div>
      </div>
    </div>
  </div>
)

// ============================================================
// TARJETA DE PRÓXIMA CITA
// ============================================================
const NextAppointmentCard = ({ 
  cita, 
  isDark 
}: { 
  cita: any, 
  isDark: boolean 
}) => {
  if (!cita) {
    return (
      <div className={`p-6 rounded-2xl border-2 border-dashed text-center transition-all duration-500 ${
        isDark 
          ? 'border-zinc-800/50 bg-zinc-900/20' 
          : 'border-rose-200/40 bg-rose-50/20'
      }`}>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-200/30 to-pink-200/30 flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-5 h-5 text-rose-400" />
        </div>
        <p className={`text-sm font-medium ${
          isDark ? 'text-zinc-400' : 'text-stone-400'
        }`}>
          No tienes citas próximas
        </p>
        <Link 
          href="/agenda"
          className="inline-flex items-center gap-2 mt-3 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
        >
          Agenda tu cita
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    )
  }

  return (
    <div className={`relative group p-6 rounded-2xl border transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl overflow-hidden ${
      isDark 
        ? 'bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border-rose-500/20 shadow-rose-500/10' 
        : 'bg-gradient-to-br from-white/90 to-rose-50/70 border-rose-200/50 shadow-rose-200/20'
    }`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-400/5 to-pink-400/5 rounded-full blur-2xl" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.15em] ${
              cita.status === 'confirmed'
                ? 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/50'
                : 'bg-amber-100/80 text-amber-700 border border-amber-200/50'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                cita.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'
              } animate-pulse`} />
              {cita.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
            </span>
          </div>
          <h4 className={`text-lg font-serif italic ${
            isDark ? 'text-white' : 'text-stone-800'
          }`}>
            {cita.services?.name || 'Servicio de Belleza'}
          </h4>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className={`flex items-center gap-1.5 ${
              isDark ? 'text-zinc-400' : 'text-stone-500'
            }`}>
              <Calendar className="w-3.5 h-3.5 text-rose-400" />
              {cita.date}
            </span>
            <span className={`flex items-center gap-1.5 ${
              isDark ? 'text-zinc-400' : 'text-stone-500'
            }`}>
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              {cita.time} hs
            </span>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${
          isDark ? 'bg-rose-500/10' : 'bg-rose-100/50'
        }`}>
          <Crown className={`w-4 h-4 ${
            isDark ? 'text-rose-400' : 'text-rose-500'
          }`} />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
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
    return <LoadingSpinner isDark={isDark} />
  }

  const saludoMap = {
    morning: { emoji: '🌅', text: 'Buenos días, Radiante' },
    afternoon: { emoji: '☀️', text: 'Buenas tardes, Gloriosa' },
    evening: { emoji: '🌙', text: 'Buenas noches, Estelar' }
  }

  const saludo = saludoMap[timeOfDay]
  const proximaCita = citasProximas[0]

  return (
    <div className={`min-h-screen transition-all duration-700 ${
      isDark 
        ? 'bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950' 
        : 'bg-gradient-to-b from-rose-50/30 via-white to-stone-50/40'
    }`}>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ============================================================ */}
        {/* 👑 HEADER - SALUDO Y PERFIL */}
        {/* ============================================================ */}
        <div className={`relative overflow-hidden rounded-3xl p-6 md:p-8 transition-all duration-500 ${
          isDark 
            ? 'bg-gradient-to-br from-zinc-900/80 via-zinc-950/80 to-black/80 border border-zinc-800/50 shadow-2xl shadow-black/40' 
            : 'bg-gradient-to-br from-white/90 via-rose-50/60 to-white/80 border border-rose-100/40 shadow-xl shadow-rose-200/20'
        }`}>
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[150px] bg-gradient-to-br from-rose-400/10 to-pink-400/10 animate-pulse" />
          <div className="absolute -bottom-40 left-20 w-80 h-80 rounded-full blur-[120px] bg-gradient-to-br from-amber-400/5 to-rose-400/5 animate-pulse delay-1000" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-sm border border-rose-100/50 shadow-sm">
                <span className="text-xl animate-bounce">{saludo.emoji}</span>
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                  isDark ? 'text-zinc-400' : 'text-stone-500'
                }`}>
                  {saludo.text}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              </div>

              <h1 className={`text-3xl md:text-4xl lg:text-5xl font-serif font-light tracking-tight ${
                isDark ? 'text-white' : 'text-stone-800'
              }`}>
                Hola,{' '}
                <span className={`font-serif italic ${
                  isDark 
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-pink-300 to-amber-300' 
                    : 'text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500'
                }`}>
                  {nombreCliente}
                </span>
              </h1>

              <div className="flex flex-wrap items-center gap-3">
                <PointsCard glow={puntosGlow} hair={puntosHair} isDark={isDark} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <button 
                onClick={handleRefresh} 
                disabled={refreshing} 
                className={`w-full sm:w-auto px-5 py-3 rounded-xl text-[8px] font-black tracking-[0.2em] uppercase transition-all duration-500 flex items-center justify-center gap-2 border group ${
                  isDark 
                    ? 'border-zinc-800/50 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-700/50 hover:bg-zinc-800/50' 
                    : 'border-rose-200/50 bg-white/60 text-stone-500 hover:text-rose-600 hover:border-rose-300/60 hover:bg-white/80'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 transition-all duration-500 ${
                  refreshing ? 'animate-spin' : 'group-hover:rotate-180'
                }`} />
                {refreshing ? 'Sincronizando...' : 'Sincronizar'}
              </button>

              <Link 
                href="/agenda" 
                className={`w-full sm:w-auto relative group overflow-hidden px-6 py-3 rounded-xl font-black text-[9px] tracking-[0.2em] uppercase transition-all duration-500 flex items-center justify-center gap-2 text-white shadow-xl hover:shadow-2xl active:scale-95 ${
                  isDark 
                    ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 shadow-rose-500/25 hover:shadow-rose-500/40' 
                    : 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 shadow-rose-500/25 hover:shadow-rose-500/40'
                }`}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />
                <span className="relative flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Agendar Turno
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 📅 PRÓXIMA CITA DESTACADA */}
        {/* ============================================================ */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-xl ${
              isDark ? 'bg-rose-500/10' : 'bg-rose-100/50'
            }`}>
              <Calendar className={`w-4 h-4 ${
                isDark ? 'text-rose-400' : 'text-rose-500'
              }`} />
            </div>
            <h2 className={`text-sm font-black tracking-tight ${
              isDark ? 'text-white' : 'text-stone-800'
            }`}>
              Próxima Cita
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-rose-200/30 to-transparent" />
          </div>
          <NextAppointmentCard cita={proximaCita} isDark={isDark} />
        </section>

        {/* ============================================================ */}
        {/* 📢 ANUNCIOS Y PROMOCIONES */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`rounded-2xl overflow-hidden shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
            isDark ? 'shadow-black/30' : 'shadow-rose-200/20'
          }`}>
            <AnunciosBanner position="hero" limit={2} />
          </div>
          <div className={`rounded-2xl overflow-hidden shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
            isDark ? 'shadow-black/30' : 'shadow-rose-200/20'
          }`}>
            <PromocionesVolante limit={3} />
          </div>
        </div>

        {/* ============================================================ */}
        {/* 🎯 MISIONES DIARIAS + LOGROS */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 gap-4">
          <div className={`rounded-2xl overflow-hidden shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
            isDark ? 'shadow-black/30' : 'shadow-rose-200/20'
          }`}>
            <MisionesDiarias />
          </div>
        </div>

        <div className={`rounded-2xl overflow-hidden shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
          isDark ? 'shadow-black/30' : 'shadow-rose-200/20'
        }`}>
          <QRReferido codigo={codigoReferido} user={user} />
        </div>

        <div className={`p-4 rounded-2xl border transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
          isDark 
            ? 'bg-zinc-900/50 border-zinc-800/50 shadow-black/30' 
            : 'bg-white/60 border-rose-200/40 shadow-rose-200/20'
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
        <div className={`relative overflow-hidden p-6 rounded-2xl border transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
          isDark 
            ? 'bg-gradient-to-br from-zinc-900/80 via-zinc-950/80 to-rose-950/20 border-zinc-800/50 shadow-black/40' 
            : 'bg-gradient-to-br from-white/90 via-rose-50/40 to-amber-50/30 border-rose-200/40 shadow-rose-200/20'
        }`}>
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-[120px] bg-gradient-to-br from-rose-400/10 to-pink-400/10 animate-pulse" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-xl shadow-rose-500/20">
                <Gift className="w-6 h-6 text-white animate-bounce" />
              </div>
              <div>
                <h3 className={`text-base font-serif font-light ${
                  isDark ? 'text-white' : 'text-stone-800'
                }`}>
                  Ruleta de la Suerte
                </h3>
                <p className={`text-[9px] font-medium ${
                  isDark ? 'text-zinc-400' : 'text-stone-500'
                }`}>
                  Gira y gana premios exclusivos
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsRuletaOpen(true)} 
              className={`px-6 py-3 rounded-xl font-black text-[8px] tracking-[0.2em] uppercase transition-all duration-500 flex items-center gap-2 shadow-xl hover:shadow-2xl active:scale-95 group ${
                isDark 
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-500/25 hover:shadow-rose-500/40' 
                  : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-500/25 hover:shadow-rose-500/40'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              Girar Ruleta
              <Sparkles className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-700" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 📸 INSTAGRAM FEED */}
        {/* ============================================================ */}
        <div className={`pt-4 border-t ${
          isDark ? 'border-zinc-800/50' : 'border-rose-200/30'
        }`}>
          <div className={`rounded-2xl overflow-hidden shadow-xl transition-all duration-500 hover:shadow-2xl ${
            isDark ? 'shadow-black/30' : 'shadow-rose-200/20'
          }`}>
            <InstagramFeed />
          </div>
        </div>

        <FooterCliente />

        <RuletaModal
          isOpen={isRuletaOpen}
          onClose={() => { setIsRuletaOpen(false); if (clientId) refreshPuntos(clientId) }}
          onPremioProcesado={() => { if (clientId) refreshPuntos(clientId) }}
          usuarioActivo={user || undefined}
          tenantIdActivo={tenantId ?? undefined}
        />

        <style jsx global>{`
          @keyframes shine {
            from { transform: translateX(-100%); }
            to { transform: translateX(100%); }
          }
          .animate-shine {
            animation: shine 1.5s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  )
}