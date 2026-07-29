// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import { 
  Calendar, Sparkles, Gift, ArrowRight, RefreshCw, 
  Crown, CheckCircle2, Clock, Gem, Star, 
  Heart, Award, PartyPopper, Diamond, Medal, User
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

// ============================================================
// TIPOS
// ============================================================
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
// COMPONENTE DE CARGA - SIMPLIFICADO
// ============================================================
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-rose-200/30 border-t-rose-400 animate-spin" />
        <Sparkles className="w-5 h-5 text-rose-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>
      <p className="text-xs text-stone-400 tracking-widest uppercase font-light animate-pulse">
        Cargando tu espacio...
      </p>
    </div>
  </div>
)

// ============================================================
// TARJETA DE PUNTOS - REDISEÑADA Y MÁS LIMPIA
// ============================================================
const PointsCard = ({ glow, hair, isDark }: { glow: number; hair: number; isDark: boolean }) => (
  <div className={`relative p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
    isDark 
      ? 'bg-zinc-900/60 border-zinc-800/50' 
      : 'bg-white/80 border-rose-100/50 shadow-sm'
  }`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isDark ? 'bg-rose-500/20' : 'bg-rose-100'
          }`}>
            <Gem className={`w-4 h-4 ${isDark ? 'text-rose-400' : 'text-rose-500'}`} />
          </div>
          <div>
            <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-stone-800'}`}>
              {glow}
            </span>
            <span className="text-[10px] font-semibold text-rose-400 ml-1">GLOW</span>
          </div>
        </div>
        <div className="w-px h-8 bg-stone-200/30" />
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isDark ? 'bg-amber-500/20' : 'bg-amber-100'
          }`}>
            <Star className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
          </div>
          <div>
            <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-stone-800'}`}>
              {hair}
            </span>
            <span className="text-[10px] font-semibold text-amber-400 ml-1">HAIR</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-2xl font-serif ${isDark ? 'text-rose-400' : 'text-rose-500'}`}>
          {glow + hair}
        </div>
        <p className="text-[8px] text-stone-400 uppercase tracking-widest">Total</p>
      </div>
    </div>
  </div>
)

// ============================================================
// TARJETA DE PRÓXIMA CITA - REDISEÑADA
// ============================================================
const NextAppointmentCard = ({ cita, isDark }: { cita: any; isDark: boolean }) => {
  if (!cita) {
    return (
      <div className={`p-6 rounded-2xl border-2 border-dashed text-center ${
        isDark ? 'border-zinc-800/50 bg-zinc-900/20' : 'border-rose-200/40 bg-rose-50/20'
      }`}>
        <Calendar className="w-8 h-8 text-rose-300 mx-auto mb-3" />
        <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-stone-400'}`}>
          No tienes citas próximas
        </p>
        <Link 
          href="/agenda"
          className="inline-flex items-center gap-2 mt-3 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
        >
          Agenda tu cita
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    )
  }

  return (
    <div className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
      isDark 
        ? 'bg-zinc-900/60 border-zinc-800/50' 
        : 'bg-white/80 border-rose-100/50 shadow-sm'
    }`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider ${
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
          <h4 className={`text-lg font-serif ${isDark ? 'text-white' : 'text-stone-800'}`}>
            {cita.services?.name || 'Servicio de Belleza'}
          </h4>
          <div className="flex items-center gap-4 text-sm">
            <span className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-stone-500'}`}>
              <Calendar className="w-3.5 h-3.5 text-rose-400" />
              {cita.date}
            </span>
            <span className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-stone-500'}`}>
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              {cita.time} hs
            </span>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isDark ? 'bg-rose-500/10' : 'bg-rose-100/50'
        }`}>
          <Crown className={`w-4 h-4 ${isDark ? 'text-rose-400' : 'text-rose-500'}`} />
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
  
  // Estados
  const [citas, setCitas] = useState<Cita[]>([])
  const [puntosGlow, setPuntosGlow] = useState(0)
  const [puntosHair, setPuntosHair] = useState(0)
  const [referidos, setReferidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nombreCliente, setNombreCliente] = useState('')
  const [citasProximas, setCitasProximas] = useState<Cita[]>([])
  const [serviciosUnicos, setServiciosUnicos] = useState(0)
  const [codigoReferido, setCodigoReferido] = useState('')
  const [clientId, setClientId] = useState<string | null>(null)
  const [isRuletaOpen, setIsRuletaOpen] = useState(false)

  const isDark = theme === 'dark'

  // ============================================================
  // FUNCIONES
  // ============================================================
  const refreshPuntos = async (activeClientId: string) => {
    if (!activeClientId) return
    try {
      const { data } = await supabase
        .from('loyalty_wallets')
        .select('glow_points, hair_points')
        .eq('client_id', activeClientId)
        .maybeSingle()

      if (data) {
        setPuntosGlow(data.glow_points || 0)
        setPuntosHair(data.hair_points || 0)
      }
    } catch (error) {
      console.error('Error al refrescar puntos:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshUserData()
    if (clientId) await refreshPuntos(clientId)
    setTimeout(() => setRefreshing(false), 600)
  }

  // ============================================================
  // EFECTO PRINCIPAL
  // ============================================================
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
          setCodigoReferido(currentCliente.referral_code || '')

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
        console.error('Error cargando dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) return <LoadingSpinner />

  const proximaCita = citasProximas[0]

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDark ? 'bg-zinc-950' : 'bg-stone-50'
    }`}>
      
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* ============================================================ */}
        {/* 👤 HEADER */}
        {/* ============================================================ */}
        <div className={`p-6 rounded-2xl border transition-all duration-300 ${
          isDark 
            ? 'bg-zinc-900/60 border-zinc-800/50' 
            : 'bg-white/80 border-rose-100/50 shadow-sm'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-rose-500/20' : 'bg-rose-100'
                }`}>
                  <User className={`w-5 h-5 ${isDark ? 'text-rose-400' : 'text-rose-500'}`} />
                </div>
                <div>
                  <h1 className={`text-2xl font-serif font-light ${
                    isDark ? 'text-white' : 'text-stone-800'
                  }`}>
                    Hola, <span className={`font-serif italic ${
                      isDark ? 'text-rose-400' : 'text-rose-500'
                    }`}>{nombreCliente}</span>
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={handleRefresh} 
                disabled={refreshing}
                className={`p-2.5 rounded-xl transition-all duration-300 ${
                  isDark 
                    ? 'hover:bg-zinc-800/50 text-zinc-400 hover:text-white' 
                    : 'hover:bg-rose-50 text-stone-400 hover:text-rose-600'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <Link 
                href="/agenda" 
                className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 flex items-center gap-2 text-white ${
                  isDark 
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-lg hover:shadow-rose-500/25' 
                    : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-lg hover:shadow-rose-500/25'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Agendar
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Puntos */}
          <div className="mt-4">
            <PointsCard glow={puntosGlow} hair={puntosHair} isDark={isDark} />
          </div>
        </div>

        {/* ============================================================ */}
        {/* 📅 PRÓXIMA CITA */}
        {/* ============================================================ */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <Calendar className={`w-4 h-4 ${isDark ? 'text-rose-400' : 'text-rose-500'}`} />
            <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-stone-700'}`}>
              Próxima Cita
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-rose-200/30 to-transparent" />
          </div>
          <NextAppointmentCard cita={proximaCita} isDark={isDark} />
        </section>

        {/* ============================================================ */}
        {/* 📢 ANUNCIOS */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
            isDark ? 'shadow-black/20' : 'shadow-rose-200/10'
          }`}>
            <AnunciosBanner position="hero" limit={2} />
          </div>
          <div className={`rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
            isDark ? 'shadow-black/20' : 'shadow-rose-200/10'
          }`}>
            <PromocionesVolante limit={3} />
          </div>
        </div>

        {/* ============================================================ */}
        {/* 🎯 MISIONES DIARIAS */}
        {/* ============================================================ */}
        <div className={`rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
          isDark ? 'shadow-black/20' : 'shadow-rose-200/10'
        }`}>
          <MisionesDiarias />
        </div>

        {/* ============================================================ */}
        {/* 🏆 LOGROS Y REFERIDOS */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
            isDark ? 'shadow-black/20' : 'shadow-rose-200/10'
          }`}>
            <QRReferido codigo={codigoReferido} user={user} />
          </div>
          <div className={`p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
            isDark 
              ? 'bg-zinc-900/60 border-zinc-800/50' 
              : 'bg-white/80 border-rose-100/50 shadow-sm'
          }`}>
            <InsigniasLogros 
              citas={citas.length} 
              serviciosUnicos={serviciosUnicos} 
              referidos={referidos.length} 
              puntos={puntosGlow + puntosHair} 
              racha={3} 
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* 🎡 RULETA DE LA SUERTE */}
        {/* ============================================================ */}
        <div className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDark 
            ? 'bg-zinc-900/60 border-zinc-800/50' 
            : 'bg-white/80 border-rose-100/50 shadow-sm'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDark ? 'bg-rose-500/20' : 'bg-rose-100'
            }`}>
              <Gift className={`w-5 h-5 ${isDark ? 'text-rose-400' : 'text-rose-500'}`} />
            </div>
            <div>
              <h3 className={`font-serif font-light ${isDark ? 'text-white' : 'text-stone-800'}`}>
                Ruleta de la Suerte
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-stone-500'}`}>
                Gira y gana premios exclusivos
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsRuletaOpen(true)} 
            className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 flex items-center gap-2 text-white ${
              isDark 
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-lg hover:shadow-rose-500/25' 
                : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-lg hover:shadow-rose-500/25'
            }`}
          >
            <PartyPopper className="w-4 h-4" />
            Girar
          </button>
        </div>

        {/* ============================================================ */}
        {/* 📸 INSTAGRAM */}
        {/* ============================================================ */}
        <div className={`pt-4 border-t ${isDark ? 'border-zinc-800/50' : 'border-rose-200/30'}`}>
          <div className={`rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
            isDark ? 'shadow-black/20' : 'shadow-rose-200/10'
          }`}>
            <InstagramFeed />
          </div>
        </div>

        <FooterCliente />

        {/* ============================================================ */}
        {/* 🎡 RULETA MODAL */}
        {/* ============================================================ */}
        <RuletaModal
          isOpen={isRuletaOpen}
          onClose={() => { setIsRuletaOpen(false); if (clientId) refreshPuntos(clientId) }}
          onPremioProcesado={() => { if (clientId) refreshPuntos(clientId) }}
          usuarioActivo={user || undefined}
          tenantIdActivo={tenantId ?? undefined}
        />

      </div>
    </div>
  )
}