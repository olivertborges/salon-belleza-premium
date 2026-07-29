// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { 
  Calendar, Sparkles, Gift, ArrowRight, RefreshCw, 
  Crown, Clock, Gem, Star, User, Heart, Compass
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

// Componentes del Ecosistema del Cliente
import InsigniasLogros from '@/components/InsigniasLogros'
import InstagramFeed from '@/components/InstagramFeed'
import QRReferido from '@/components/QRReferido'
import RuletaModal from '@/components/RuedaSuerte'
import MisionesDiarias from '@/components/MisionesDiarias'
import AnunciosBanner from '@/components/AnunciosBanner'
import PromocionesVolante from '@/components/PromocionesVolante'
import FooterCliente from '@/components/FooterCliente'

// ============================================================
// PROTOCOLOS DE TIPADO (TypeScript)
// ============================================================
interface ServicioInfo {
  name: string
  price: number
  duration: number
}

interface Cita {
  id: string
  date: string
  time: string
  status: string
  service_id: string
  client_id: string
  services?: ServicioInfo
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
// MICRO-COMPONENTES REDISEÑADOS (ESTILO ATELIER EDITORIAL)
// ============================================================

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[80vh] bg-[#FFF9F6]">
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border border-[#D4AF37]/20" />
        <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
      </div>
      <p className="text-[10px] text-[#1A0E0A] tracking-[0.4em] uppercase font-light animate-pulse">
        Sincronizando tu espacio de belleza...
      </p>
    </div>
  </div>
)

const PointsCard = ({ glow, hair }: { glow: number; hair: number }) => (
  <div className="relative overflow-hidden bg-white border border-[#F0E4DA] p-6 rounded-none shadow-sm group hover:border-[#D4AF37]/40 transition-all duration-500">
    <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFF9F6] rounded-full translate-x-8 -translate-y-8 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
    
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
      <div className="flex items-center gap-8">
        {/* Marcador GLOW */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Gem className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-[9px] font-bold text-[#A89588] tracking-[0.2em] uppercase">Glow Points</span>
          </div>
          <p className="font-serif text-3xl font-light text-[#1A0E0A]">{glow}</p>
        </div>
        
        <div className="w-[1px] h-10 bg-[#F0E4DA] hidden sm:block" />
        
        {/* Marcador HAIR */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-[9px] font-bold text-[#A89588] tracking-[0.2em] uppercase">Hair Points</span>
          </div>
          <p className="font-serif text-3xl font-light text-[#1A0E0A]">{hair}</p>
        </div>
      </div>

      <div className="text-left sm:text-right border-t sm:border-t-0 border-[#F0E4DA] pt-4 sm:pt-0">
        <span className="text-[9px] text-[#D4AF37] uppercase tracking-[0.3em] font-bold block mb-1">Estatus del Balance</span>
        <div className="font-serif text-4xl font-normal text-[#1A0E0A] tracking-tight">
          {glow + hair} <span className="text-xs font-sans font-light text-[#5C4A3E] tracking-widest">PTS</span>
        </div>
      </div>
    </div>
  </div>
)

const NextAppointmentCard = ({ cita }: { cita: Cita | undefined }) => {
  if (!cita) {
    return (
      <div className="p-8 text-center bg-white border border-dashed border-[#D4AF37]/30 rounded-none space-y-4">
        <Calendar className="w-6 h-6 text-[#A89588] mx-auto stroke-[1.2]" />
        <p className="text-xs uppercase tracking-[0.2em] text-[#5C4A3E] font-light">
          No registras rituales programados en el radar
        </p>
        <Link 
          href="/agenda"
          className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-[#D4AF37] hover:text-[#1A0E0A] transition-colors pt-2"
        >
          Agendar Tratamiento de Autor
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    )
  }

  const isConfirmed = cita.status === 'confirmed'

  return (
    <div className="p-6 bg-white border border-[#F0E4DA] rounded-none shadow-sm hover:shadow-md transition-all duration-500 relative overflow-hidden group">
      <div className="absolute top-0 left-0 h-[3px] bg-[#D4AF37] w-0 group-hover:w-full transition-all duration-700" />
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFF9F6] border border-[#D4AF37]/20 text-[9px] font-bold uppercase tracking-[0.15em] text-[#1A0E0A]">
            <span className={`w-1.5 h-1.5 rounded-full ${isConfirmed ? 'bg-amber-600' : 'bg-[#A89588]'} animate-pulse`} />
            {isConfirmed ? 'Confirmado en Agenda' : 'Esperando Confirmación'}
          </div>
          
          <h4 className="font-serif text-2xl font-light tracking-wide text-[#1A0E0A]">
            {cita.services?.name || 'Tratamiento de Belleza Plena'}
          </h4>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs pt-1">
            <span className="flex items-center gap-2 text-[#5C4A3E] font-light tracking-wide">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37] stroke-[1.5]" />
              {cita.date}
            </span>
            <span className="flex items-center gap-2 text-[#5C4A3E] font-light tracking-wide">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37] stroke-[1.5]" />
              {cita.time} hs
            </span>
          </div>
        </div>

        <div className="w-12 h-12 bg-[#FFF9F6] border border-[#F0E4DA] flex items-center justify-center rounded-none shrink-0 self-start sm:self-center">
          <Crown className="w-4 h-4 text-[#D4AF37] stroke-[1.2]" />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// VISTA MAESTRA (DISEÑO EDITORIAL INTEGRADO)
// ============================================================
export default function ClientDashboardIndex() {
  const { user, tenantId, refreshUserData } = useAuth()

  // Controladores de Estado Reactivos
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
      console.error('Error al sincronizar monedero de fidelidad:', error)
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
          setNombreCliente(currentCliente.name || 'Invitado Atelier')
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
        console.error('Error al poblar el panel de control editorial:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  if (loading) return <LoadingSpinner />

  const proximaCita = citasProximas[0]

  return (
    <div className="min-h-screen bg-[#FFF9F6] text-[#1A0E0A] antialiased selection:bg-[#D4AF37]/20 pb-16">
      
      {/* Fondo Texturizado Minimalista */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-5xl mx-auto px-6 pt-24 pb-12 space-y-8 relative z-10">

        {/* ============================================================ */}
        {/* 👤 PERFIL & CABECERA EDITORIAL */}
        {/* ============================================================ */}
        <div className="bg-white border border-[#F0E4DA] p-6 sm:p-8 rounded-none shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-none bg-[#FFF9F6] border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-[#D4AF37] stroke-[1.2]" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#D4AF37] tracking-[0.3em] uppercase block">Panel Privado</span>
                <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-tight text-[#1A0E0A]">
                  Bienvenido, <span className="italic font-normal">{nombreCliente}</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <button 
                onClick={handleRefresh} 
                disabled={refreshing}
                aria-label="Refrescar catálogo"
                className="p-3 bg-[#FFF9F6] border border-[#F0E4DA] text-[#5C4A3E] hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all duration-300"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <Link 
                href="/agenda" 
                className="bg-[#1A0E0A] hover:bg-[#D4AF37] text-white px-6 py-3 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-500 flex items-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5 stroke-[1.5]" />
                Reservar Cita
              </Link>
            </div>
          </div>

          {/* Wallet Integrada */}
          <PointsCard glow={puntosGlow} hair={puntosHair} />
        </div>

        {/* ============================================================ */}
        {/* 📅 EJE DE CITAS ACTIVAS */}
        {/* ============================================================ */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-[#D4AF37] tracking-[0.3em] uppercase">Próximo Ritual</span>
            <div className="flex-1 h-[1px] bg-[#D4AF37]/20" />
          </div>
          <NextAppointmentCard cita={proximaCita} />
        </section>

        {/* ============================================================ */}
        {/* 📢 PASARELA DE ANUNCIOS Y EVENTOS */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-[#F0E4DA] bg-white p-2">
            <AnunciosBanner position="hero" limit={2} />
          </div>
          <div className="border border-[#F0E4DA] bg-white p-2">
            <PromocionesVolante limit={3} />
          </div>
        </div>

        {/* ============================================================ */}
        {/* 🎯 SECCIÓN MISIONES DEL ATELIER */}
        {/* ============================================================ */}
        <div className="bg-white border border-[#F0E4DA] p-2">
          <MisionesDiarias />
        </div>

        {/* ============================================================ */}
        {/* 🏆 FIDELIZACIÓN: INSIGNIAS Y RECOMENDADOS */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#F0E4DA] p-2">
            <QRReferido codigo={codigoReferido} user={user} />
          </div>
          <div className="bg-white border border-[#F0E4DA] p-6 flex flex-col justify-center">
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
        {/* 🎡 EXPERIENCIA INTERACTIVA (RULETA RE-IMAGINADA) */}
        {/* ============================================================ */}
        <div className="bg-white border border-[#D4AF37]/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFF9F6] rounded-full translate-x-12 translate-y-12 opacity-50 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-[#FFF9F6] border border-[#D4AF37]/30 flex items-center justify-center">
              <Gift className="w-4 h-4 text-[#D4AF37] stroke-[1.2]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-light text-[#1A0E0A] tracking-wide">La Rueda de la Fortuna</h3>
              <p className="text-xs text-[#5C4A3E] font-light">Accede a recompensas y beneficios exclusivos por lealtad.</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsRuletaOpen(true)} 
            className="w-full sm:w-auto bg-[#1A0E0A] hover:bg-[#D4AF37] text-white px-6 py-3.5 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-500 shrink-0 relative z-10"
          >
            Activar Rueda
          </button>
        </div>

        {/* ============================================================ */}
        {/* 📸 INSTAGRAM SOCIAL GALLERY */}
        {/* ============================================================ */}
        <div className="pt-6 border-t border-[#D4AF37]/20">
          <InstagramFeed />
        </div>

        {/* Footer del Ecosistema */}
        <FooterCliente />

        {/* ============================================================ */}
        {/* 🎡 CAPA MODAL: EXPERIENCIA DIGITAL */}
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
