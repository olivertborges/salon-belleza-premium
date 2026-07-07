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
import PromocionesCliente from '@/components/PromocionesCliente'
import AnunciosCliente from '@/components/AnunciosCliente'
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
          <div className="w-16 h-16 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
          <Sparkles className="w-5 h-5 text-rose-400 absolute animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-8 max-w-5xl mx-auto w-full px-4 pb-12 antialiased transition-colors duration-300 ${isDark ? 'text-stone-100 bg-stone-950' : 'text-stone-900 bg-stone-50'}`}>

      {/* 👑 HERO BANNER PRESTIGE */}
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-stone-900 via-stone-950 to-neutral-900 border-stone-800 shadow-2xl p-6 md:p-8 animate-fade-in">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4 w-full md:w-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-500/20 px-3.5 py-1 rounded-full backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest text-rose-300 font-bold">
                {timeOfDay === 'morning' ? 'Buenos días' : timeOfDay === 'afternoon' ? 'Buenas tardes' : 'Buenas noches'}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Hola, <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-amber-200 to-white">{nombreCliente}</span>
            </h1>

            {/* MARCADOR DIGITAL DE BILLETERAS */}
            <div className="grid grid-cols-2 gap-4 pt-2 max-w-md">
              <div className="bg-stone-900/60 border border-stone-800/80 rounded-2xl p-3 backdrop-blur-md">
                <p className="text-2xl font-black text-white tracking-tight">{puntosGlow}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-rose-400 mt-0.5">Estética Glow</p>
              </div>
              <div className="bg-stone-900/60 border border-stone-800/80 rounded-2xl p-3 backdrop-blur-md">
                <p className="text-2xl font-black text-white tracking-tight">{puntosHair}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-amber-400 mt-0.5">Peluquería Hair</p>
              </div>
            </div>

            <button onClick={handleRefresh} disabled={refreshing} className="inline-flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase px-4 py-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-white transition active:scale-95 border border-stone-800/40">
              <RefreshCw className={`w-3 h-3 text-rose-400 ${refreshing ? 'animate-spin' : ''}`} /> Sincronizar Cuenta
            </button>
          </div>

          <Link href="/agenda" className="w-full md:w-auto px-6 py-4 bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 transition duration-300 transform active:scale-98">
            <Calendar className="w-4 h-4" /> AGENDAR CITA <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ANUNCIOS Y PROMOCIONES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="transform transition hover:scale-[1.01]"><AnunciosCliente /></div>
        <div className="transform transition hover:scale-[1.01]"><PromocionesCliente /></div>
      </div>

      {/* 📅 SECCIÓN DE TURNOS REDISEÑADA (ESTILO TICKET MULTIMEDIA) */}
      <div className={`p-6 md:p-8 rounded-3xl border transition shadow-xl ${isDark ? 'bg-stone-900/40 border-stone-800/80 backdrop-blur-md' : 'bg-white border-stone-200'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold tracking-tight">Próximos <span className="font-serif italic font-normal text-rose-500">Turnos</span></h2>
          <span className="text-xs font-mono px-2.5 py-1 bg-rose-500/10 text-rose-400 rounded-lg font-bold border border-rose-500/10">
            {citasProximas.length} Activos
          </span>
        </div>

        {citasProximas.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-2xl border-stone-800">
            <Clock className="w-8 h-8 text-stone-600 mx-auto mb-2" />
            <p className="text-stone-400 text-sm font-medium">No tienes citas programadas para estos días.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {citasProximas.slice(0, 4).map((cita: any) => (
              <div key={cita.id} className="p-4 rounded-2xl border bg-gradient-to-r from-stone-900 to-stone-900/60 border-stone-800/60 flex justify-between items-center shadow-md relative overflow-hidden group">
                <div className="absolute left-0 top-0 h-full w-1 bg-rose-500"></div>
                <div className="space-y-1 pl-2">
                  <h4 className="text-sm font-bold text-white tracking-wide group-hover:text-rose-300 transition-colors">{cita.services?.name || 'Servicio Premium'}</h4>
                  <p className="text-xs text-stone-400 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-stone-500" /> {cita.date} • {cita.time} hs
                  </p>
                </div>
                <div>
                  {cita.status === 'confirmed' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Confirmada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Clock className="w-2.5 h-2.5 animate-spin" /> Pendiente
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COMPONENTES INTEGRADOS ORIGINALES CON ESPACIADO ELEGANTE */}
      <div className="space-y-4">
        <MisionesDiarias />
      </div>

      <div className="transform transition hover:scale-[1.005]">
        <QRReferido codigo={codigoReferido} user={user} />
      </div>

      <div className="p-1 rounded-3xl bg-gradient-to-b from-stone-900 to-transparent">
        <InsigniasLogros citas={citas.length} serviciosUnicos={serviciosUnicos} referidos={referidos.length} puntos={puntosTotales} racha={3} />
      </div>

      {/* 🎡 LUCKY WHEEL VIP GAMIFICATION BANNER */}
      <div className="p-6 md:p-8 rounded-3xl border flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-amber-500/10 via-stone-900 to-rose-500/5 border-stone-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-4 z-10">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-400 shadow-inner">
            <Gift className="w-6 h-6 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight">¿Te sientes con <span className="font-serif italic font-normal text-amber-400">Suerte</span> hoy?</h3>
            <p className="text-xs text-stone-400 font-medium">Gira la ruleta de recompensas diaria y reclama tus puntos VIP.</p>
          </div>
        </div>
        <button onClick={() => setIsRuletaOpen(true)} className="w-full sm:w-auto mt-4 sm:mt-0 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white text-xs font-black tracking-widest uppercase shadow-lg shadow-amber-950/40 transform active:scale-95 transition duration-300">
          GIRAR RULETA
        </button>
      </div>

      {/* INSTAGRAM Y PIE DE PÁGINA */}
      <div className="pt-4 border-t border-stone-900">
        <InstagramFeed />
      </div>

      <FooterCliente />

      {/* CONTROL DE MODALES */}
      <RuletaModal
        isOpen={isRuletaOpen}
        onClose={() => { setIsRuletaOpen(false); if (clientId) refreshPuntos(clientId) }}
        onPremioProcesado={() => { if (clientId) refreshPuntos(clientId) }}
        usuarioActivo={user}
        tenantIdActivo={tenantId}
      />
    </div>
  )
}
