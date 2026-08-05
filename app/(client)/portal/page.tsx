// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import { 
  Calendar, ArrowRight, RefreshCw, Clock, Gem, Star, User
} from 'lucide-react'
import Link from 'next/link'

import InsigniasLogros from '@/components/InsigniasLogros'
import InstagramFeed from '@/components/InstagramFeed'
import QRReferido from '@/components/QRReferido'
import MisionesDiarias from '@/components/MisionesDiarias'
import AnunciosBanner from '@/components/AnunciosBanner'
import PromocionesVolante from '@/components/PromocionesVolante'
import FooterCliente from '@/components/FooterCliente'

interface ServicioInfo { name: string; price: number; duration: number }
interface Cita { id: string; date: string; time: string; status: string; service_id: string; client_id: string; services?: ServicioInfo }
interface Cliente { id: string; name: string; email: string; phone: string; points: number; referral_code: string; created_at: string }

const LoadingSpinner = ({ isDark }: { isDark: boolean }) => (
  <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-500 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-16 h-16">
        <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
        <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
      </div>
      <p className={`text-[10px] tracking-[0.3em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]'}`}>
        Cargando Fresh Nails Salón...
      </p>
    </div>
  </div>
)

const PointsCard = ({ glow, hair, isDark }: { glow: number; hair: number; isDark: boolean }) => (
  <div className={`relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 group ${
    isDark 
      ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_10px_30px_rgba(0,0,0,0.3)]' 
      : 'bg-white border-[#F0E4DA] shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
  }`}>
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full translate-x-8 -translate-y-8 pointer-events-none ${
      isDark ? 'bg-[#3D281E]/40' : 'bg-[#FFF9F6]'
    }`} />
    
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
      <div className="flex items-center gap-8 justify-between md:justify-start w-full md:w-auto">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Gem className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#A89588]">Puntos Glow</span>
          </div>
          <p className={`font-serif text-3xl font-light ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{glow}</p>
        </div>
        
        <div className={`w-[1px] h-10 hidden md:block ${isDark ? 'bg-[#3D281E]' : 'bg-[#F0E4DA]'}`} />
        
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#A89588]">Puntos Hair</span>
          </div>
          <p className={`font-serif text-3xl font-light ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{hair}</p>
        </div>
      </div>

      <div className={`text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 flex flex-col justify-end ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`}>
        <span className="text-[9px] text-[#D4AF37] uppercase tracking-[0.3em] font-bold block mb-1">Total de Puntos</span>
        <div className={`font-serif text-4xl font-normal tracking-tight ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
          {glow + hair} <span className="text-xs font-sans font-light tracking-widest opacity-60">PTS</span>
        </div>
      </div>
    </div>
  </div>
)

const NextAppointmentCard = ({ cita, isDark }: { cita: Cita | undefined; isDark: boolean }) => {
  if (!cita) {
    return (
      <div className={`p-8 text-center border border-dashed rounded-2xl space-y-4 shadow-sm transition-all duration-300 ${
        isDark ? 'border-[#D4AF37]/20 bg-[#2A1B14]/40 hover:bg-[#2A1B14]/60' : 'border-[#D4AF37]/30 bg-white hover:bg-[#FFF9F6]/30'
      }`}>
        <Calendar className="w-6 h-6 text-[#A89588] mx-auto stroke-[1.2]" />
        <p className={`text-xs uppercase tracking-[0.2em] font-light ${isDark ? 'text-[#FFF9F6]/70' : 'text-[#5C4A3E]'}`}>
          NO TIENES NINGUNA CITA AGENDADA EN ESTE MOMENTO
        </p>
        <Link 
          href="/agenda"
          className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-[#D4AF37] hover:opacity-80 transition-opacity pt-2"
        >
          AGENDAR UNA CITA
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    )
  }

  const isConfirmed = cita.status === 'confirmed'

  return (
    <div className={`p-6 border rounded-2xl shadow-md transition-all duration-300 relative overflow-hidden ${
      isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.15em] rounded-full ${
            isDark ? 'bg-[#3D281E] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConfirmed ? 'bg-amber-500' : 'bg-[#A89588]'} animate-pulse`} />
            {isConfirmed ? 'Confirmada' : 'Pendiente'}
          </div>
          
          <h4 className={`font-serif text-2xl font-light tracking-wide ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
            {cita.services?.name || 'Servicio de Belleza'}
          </h4>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs pt-1">
            <span className={`flex items-center gap-2 font-light tracking-wide ${isDark ? 'text-[#FFF9F6]/70' : 'text-[#5C4A3E]'}`}>
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37] stroke-[1.5]" />
              {cita.date}
            </span>
            <span className={`flex items-center gap-2 font-light tracking-wide ${isDark ? 'text-[#FFF9F6]/70' : 'text-[#5C4A3E]'}`}>
              <Clock className="w-3.5 h-3.5 text-[#D4AF37] stroke-[1.5]" />
              {cita.time} hs
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ClientDashboardIndex() {
  const { user, refreshUserData } = useAuth()
  const { theme } = useTheme()

  const [mounted, setMounted] = useState(false)
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

  useEffect(() => { setMounted(true) }, [])

  const isDark = theme === 'dark'

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
      console.error('Error al sincronizar puntos:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshUserData()
    if (clientId) await refreshPuntos(clientId)
    setTimeout(() => setRefreshing(false), 800)
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
          setCodigoReferido(currentCliente.referral_code || '')

          await refreshPuntos(currentCliente.id)

          const { data: citasData } = await supabase
            .from('appointments')
            .select(`*, services:service_id (name, price, duration)`)
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
        console.error('Error al cargar datos:', error)
      } finally {
        setLoading(false)
      }
    }

    if (mounted) loadDashboardData()
  }, [user, mounted])

  if (!mounted) return null
  if (loading) return <LoadingSpinner isDark={isDark} />

  const proximaCita = citasProximas[0]

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-16 relative overflow-x-hidden ${
      isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'
    }`}>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-7xl mx-auto px-4 space-y-6 relative z-10 pt-2">

        {/* CABECERA */}
        <div className={`border p-5 sm:p-8 rounded-2xl transition-all duration-300 ${
          isDark ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_15px_35px_rgba(0,0,0,0.3)]' : 'bg-white border-[#F0E4DA] shadow-[0_15px_35px_rgba(240,228,218,0.6)]'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border flex items-center justify-center shrink-0 ${
                isDark ? 'bg-[#3D281E] border-[#D4AF37]/40' : 'bg-[#FFF9F6] border-[#D4AF37]/30'
              }`}>
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37] stroke-[1.2]" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-[9px] font-bold text-[#D4AF37] tracking-[0.3em] uppercase block">
                  Fresh Nails Salón • Aniexis Campo Leyva
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl font-light tracking-tight leading-snug">
                  ¡Hola, <span className="italic font-normal">{nombreCliente}</span>!
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
              <button 
                onClick={handleRefresh} 
                disabled={refreshing}
                title="Actualizar información"
                className={`p-3 border rounded-xl transition-all duration-300 shrink-0 ${
                  isDark ? 'bg-[#3D281E] border-[#4A3227] text-[#FFF9F6]/70 hover:text-[#D4AF37]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E] hover:text-[#D4AF37]'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <Link 
                href="/agenda" 
                className="bg-[#1A0E0A] hover:bg-[#D4AF37] border border-transparent text-white px-5 sm:px-6 py-3 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300 flex items-center justify-center gap-2 flex-1 lg:flex-none text-center rounded-xl shadow-md hover:shadow-lg"
              >
                <Calendar className="w-3.5 h-3.5 stroke-[1.5]" />
                Reservar Cita
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <PointsCard glow={puntosGlow} hair={puntosHair} isDark={isDark} />
          </div>
        </div>

        {/* CITA */}
        <section className="space-y-3">
          <NextAppointmentCard cita={proximaCita} isDark={isDark} />
        </section>

        {/* SECCIÓN DE ANUNCIOS Y PROMOCIONES (Sin divs envolventes fijos) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 empty:hidden">
          <AnunciosBanner position="hero" limit={2} />
          <PromocionesVolante limit={3} />
        </div>

        {/* MISIONES */}
        <MisionesDiarias />

        {/* RECOMENDADOS E INSIGNIAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`border p-3 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 ${
            isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
          }`}>
            <QRReferido codigo={codigoReferido} user={user} />
          </div>
          <div className={`border p-6 flex flex-col justify-center rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 ${
            isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
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

        <div className={`pt-6 border-t ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`}>
          <InstagramFeed />
        </div>

        <FooterCliente />

      </div>
    </div>
  )
}
