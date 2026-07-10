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
import PromocionesVolante from '@/components/PromocionesVolante'
import AnunciosBanner from '@/components/AnunciosBanner'
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
    setTimeout(() => setRefreshing(false), 500)
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
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin" />
          <Sparkles className="w-5 h-5 text-pink-500 absolute animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-8 max-w-5xl mx-auto w-full px-4 pb-12 antialiased transition-colors duration-500 ${isDark ? 'text-stone-100 bg-neutral-900' : 'text-stone-900 bg-gradient-to-b from-pink-50/60 via-amber-50/30 to-stone-50/50'}`}>

      {/* 👑 HERO BANNER PRESTIGE */}
      <div className="relative overflow-hidden rounded-3xl border transition-all duration-300 shadow-xl p-6 md:p-8 border-pink-100 bg-gradient-to-br from-stone-900 via-pink-600 to-amber-500 dark:from-stone-950 dark:via-pink-950/20 dark:to-neutral-950 dark:border-pink-950/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-56 h-56 bg-amber-400/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-pink-400/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4 w-full md:w-auto">
            <div className={`inline-flex items-center gap-2 border px-3.5 py-1 rounded-full backdrop-blur-md ${isDark ? 'bg-pink-500/10 border-pink-500/30' : 'bg-white/20 border-white/30'}`}>
              <Sparkles className={`w-3.5 h-3.5 animate-pulse ${isDark ? 'text-pink-400' : 'text-amber-200'}`} />
              <span className={`text-[10px] uppercase tracking-widest font-extrabold ${isDark ? 'text-pink-300' : 'text-white'}`}>
                {timeOfDay === 'morning' ? 'Buenos días ✨' : timeOfDay === 'afternoon' ? 'Buenas tardes 💖' : 'Buenas noches 🌙'}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Hola, <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-amber-200 to-white">{nombreCliente}</span>
            </h1>

            {/* MARCADOR DIGITAL DE PUNTOS BOUTIQUE */}
            <div className="grid grid-cols-2 gap-4 pt-1 max-w-md">
              <div className={`border rounded-2xl p-3.5 backdrop-blur-md shadow-inner transition-colors ${isDark ? 'bg-stone-900/80 border-pink-500/20' : 'bg-white/10 border-white/20'}`}>
                <p className="text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
                  {puntosGlow} <span className="text-xs font-normal text-pink-300">★</span>
                </p>
                <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isDark ? 'text-pink-400' : 'text-pink-200'}`}>Estética Glow</p>
              </div>
              <div className={`border rounded-2xl p-3.5 backdrop-blur-md shadow-inner transition-colors ${isDark ? 'bg-stone-900/80 border-amber-500/20' : 'bg-white/10 border-white/20'}`}>
                <p className="text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
                  {puntosHair} <span className="text-xs font-normal text-amber-300">★</span>
                </p>
                <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-200'}`}>Peluquería Hair</p>
              </div>
            </div>

            <button onClick={handleRefresh} disabled={refreshing} className={`inline-flex items-center gap-2 text-[10px] font-extrabold tracking-wider uppercase px-4 py-2 rounded-xl transition active:scale-95 border ${isDark ? 'bg-stone-900/90 hover:bg-stone-800 text-stone-300 border-pink-900/30' : 'bg-stone-950 text-white hover:bg-stone-900 border-stone-800'}`}>
              <RefreshCw className={`w-3 h-3 text-amber-400 ${refreshing ? 'animate-spin' : ''}`} /> Sincronizar Cuenta
            </button>
          </div>

          {/* Botón Agendar Cita */}
          <Link 
            href="/agenda" 
            className={`w-full md:w-auto relative group overflow-hidden px-8 py-4 rounded-2xl font-black text-xs tracking-[0.2em] uppercase transition-all duration-300 transform active:scale-[0.98] hover:-translate-y-0.5 flex items-center justify-center gap-3 border ${
              isDark 
                ? 'bg-white text-stone-950 border-stone-100 shadow-[0_10px_30px_rgba(255,255,255,0.05)] hover:shadow-pink-500/20' 
                : 'bg-stone-950 text-white border-stone-900 shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:shadow-pink-500/30'
            }`}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 dark:via-stone-950/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />

            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>

            <Calendar className="w-4 h-4 text-pink-500 dark:text-pink-600 transition-transform group-hover:rotate-12 duration-300" />

            <span>Agendar Cita VIP</span>

            <span className="font-serif italic font-normal tracking-normal text-pink-500 dark:text-pink-600 lowercase text-sm ml-0.5 transition-all duration-300 group-hover:translate-x-1">
              online →
            </span>
          </Link>
        </div>
      </div>

      {/* ANUNCIOS Y PROMOCIONES MEJORADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="transform transition hover:scale-[1.01]">
          <AnunciosBanner position="hero" limit={2} />
        </div>
        <div className="transform transition hover:scale-[1.01]">
          <PromocionesVolante limit={3} />
        </div>
      </div>

      <div className="mt-6">
        <PromocionesVolante limit={6} showTitle={true} />
      </div>

      {/* 📅 SECCIÓN DE TURNOS STYLE */}
      <div className={`p-6 md:p-8 rounded-3xl border transition shadow-lg ${isDark ? 'bg-stone-900/60 border-pink-950/30 backdrop-blur-md' : 'bg-white border-pink-100/70'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black tracking-tight">Próximos <span className="font-serif italic font-normal text-pink-500">Turnos</span></h2>
          <span className="text-xs font-mono px-3 py-1 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-full font-bold border border-pink-500/20">
            {citasProximas.length} Reservas
          </span>
        </div>

        {citasProximas.length === 0 ? (
          <div className={`text-center py-10 border border-dashed rounded-2xl ${isDark ? 'border-stone-800' : 'border-pink-200 bg-pink-50/20'}`}>
            <Clock className="w-8 h-8 text-pink-300 mx-auto mb-2" />
            <p className="text-stone-400 dark:text-stone-500 text-sm font-medium">Consiéntete hoy, aún no registras citas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {citasProximas.slice(0, 4).map((cita: any) => (
              <div key={cita.id} className={`p-4 rounded-2xl border flex justify-between items-center shadow-sm relative overflow-hidden group transition-all duration-300 ${isDark ? 'bg-stone-950/40 border-stone-800/80 hover:border-pink-500/30' : 'bg-gradient-to-r from-pink-50/50 to-white border-pink-100 hover:border-pink-300'}`}>
                <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-pink-500 to-amber-400"></div>
                <div className="space-y-1 pl-2.5">
                  <h4 className="text-sm font-black tracking-tight text-stone-800 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-300 transition-colors">{cita.services?.name || 'Servicio de Belleza'}</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-bold flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-pink-400" /> {cita.date} • {cita.time} hs
                  </p>
                </div>
                <div>
                  {cita.status === 'confirmed' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Listado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Clock className="w-2.5 h-2.5 animate-spin text-amber-500" /> Pendiente
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COMPONENTES INTEGRADOS ORIGINALES */}
      <div className="space-y-4">
        <MisionesDiarias />
      </div>

      <div className="transform transition hover:scale-[1.005]">
        <QRReferido codigo={codigoReferido} user={user} />
      </div>

      <div className={`p-1.5 rounded-3xl border ${isDark ? 'bg-stone-900/40 border-pink-950/20' : 'bg-white border-pink-100/40 shadow-sm'}`}>
        <InsigniasLogros citas={citas.length} serviciosUnicos={serviciosUnicos} referidos={referidos.length} puntos={puntosTotales} racha={3} />
      </div>

      {/* 🎡 LUCKY WHEEL VIP GAMIFICATION BANNER */}
      <div className={`p-6 md:p-8 rounded-3xl border flex flex-col sm:flex-row items-center justify-between shadow-xl relative overflow-hidden transition-all ${isDark ? 'bg-gradient-to-r from-pink-950/20 via-stone-900 to-amber-950/10 border-pink-950/30' : 'bg-gradient-to-r from-pink-100 via-amber-50 to-white border-pink-200'}`}>
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-4 z-10">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500 to-amber-500 text-white shadow-md">
            <Gift className="w-6 h-6 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black tracking-tight text-stone-900 dark:text-white">¿Te sientes con <span className="font-serif italic font-normal text-pink-600 dark:text-pink-400">Suerte</span> hoy?</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-bold">Gira la ruleta de belleza diaria y reclama fantásticos premios VIP.</p>
          </div>
        </div>
        <button onClick={() => setIsRuletaOpen(true)} className="w-full sm:w-auto mt-4 sm:mt-0 px-6 py-3.5 rounded-xl bg-stone-950 text-white hover:bg-stone-900 text-xs font-black tracking-widest uppercase shadow-xl transition transform active:scale-95 border border-stone-800">
          GIRAR RULETA
        </button>
      </div>

      {/* INSTAGRAM Y PIE DE PÁGINA */}
      <div className="pt-4 border-t border-pink-100 dark:border-stone-900">
        <InstagramFeed />
      </div>

      <FooterCliente />

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