// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import { 
  Calendar, Sparkles, Gift, ArrowRight, RefreshCw, 
  Crown, Clock, Gem, Star, User
} from 'lucide-react'
import Link from 'next/link'

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
// MICRO-COMPONENTES RESPONSIVOS Y ADAPTABLES AL TEMA
// ============================================================

const LoadingSpinner = ({ isDark }: { isDark: boolean }) => (
  <div className={`flex items-center justify-center min-h-[80vh] transition-colors duration-500 ${isDark ? 'bg-[#120A07]' : 'bg-[#FFF9F6]'}`}>
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-16 h-16">
        <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
        <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
      </div>
      <p className={`text-[10px] tracking-[0.4em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]'}`}>
        Sincronizando tu espacio de belleza...
      </p>
    </div>
  </div>
)

const PointsCard = ({ glow, hair, isDark }: { glow: number; hair: number; isDark: boolean }) => (
  <div className={`relative overflow-hidden border p-6 rounded-none shadow-sm transition-all duration-500 group hover:border-[#D4AF37]/40 ${
    isDark ? 'bg-[#1A0E0A] border-[#2C1A14]' : 'bg-white border-[#F0E4DA]'
  }`}>
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full translate-x-8 -translate-y-8 pointer-events-none group-hover:scale-110 transition-transform duration-700 ${
      isDark ? 'bg-[#2C1A14]/30' : 'bg-[#FFF9F6]'
    }`} />
    
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
      <div className="flex items-center gap-8 justify-between md:justify-start w-full md:w-auto">
        {/* Marcador GLOW */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Gem className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#A89588]">Glow Points</span>
          </div>
          <p className={`font-serif text-3xl font-light ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{glow}</p>
        </div>
        
        <div className={`w-[1px] h-10 hidden md:block ${isDark ? 'bg-[#2C1A14]' : 'bg-[#F0E4DA]'}`} />
        
        {/* Marcador HAIR */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#A89588]">Hair Points</span>
          </div>
          <p className={`font-serif text-3xl font-light ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{hair}</p>
        </div>
      </div>

      <div className={`text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 flex flex-col justify-end ${isDark ? 'border-[#2C1A14]' : 'border-[#F0E4DA]'}`}>
        <span className="text-[9px] text-[#D4AF37] uppercase tracking-[0.3em] font-bold block mb-1">Estatus del Balance</span>
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
      <div className={`p-8 text-center border border-dashed rounded-none space-y-4 ${
        isDark ? 'border-[#D4AF37]/20 bg-[#1A0E0A]/40' : 'border-[#D4AF37]/30 bg-white'
      }`}>
        <Calendar className="w-6 h-6 text-[#A89588] mx-auto stroke-[1.2]" />
        <p className={`text-xs uppercase tracking-[0.2em] font-light ${isDark ? 'text-[#FFF9F6]/70' : 'text-[#5C4A3E]'}`}>
          No tienes rituales programados en agenda
        </p>
        <Link 
          href="/agenda"
          className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-[#D4AF37] hover:opacity-80 transition-opacity pt-2"
        >
          Agendar Tratamiento de Autor
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    )
  }

  const isConfirmed = cita.status === 'confirmed'

  return (
    <div className={`p-6 border rounded-none shadow-sm transition-all duration-500 relative overflow-hidden group ${
      isDark ? 'bg-[#1A0E0A] border-[#2C1A14]' : 'bg-white border-[#F0E4DA]'
    }`}>
      <div className="absolute top-0 left-0 h-[3px] bg-[#D4AF37] w-0 group-hover:w-full transition-all duration-700" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.15em] ${
            isDark ? 'bg-[#2C1A14] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConfirmed ? 'bg-amber-500' : 'bg-[#A89588]'} animate-pulse`} />
            {isConfirmed ? 'Confirmado' : 'Pendiente'}
          </div>
          
          <h4 className={`font-serif text-2xl font-light tracking-wide ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
            {cita.services?.name || 'Tratamiento de Belleza'}
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

        <div className={`w-12 h-12 border flex items-center justify-center rounded-none shrink-0 ${
          isDark ? 'bg-[#2C1A14]/50 border-[#3d271f]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
        }`}>
          <Crown className="w-4 h-4 text-[#D4AF37] stroke-[1.2]" />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL (RUIDO BAJO E HIDRATACIÓN INTEGRAL)
// ============================================================
export default function ClientDashboardIndex() {
  const { user, tenantId, refreshUserData } = useAuth()
  const { theme } = useTheme()

  // Protección anti desajustes entre servidor y cliente (Next.js Hydration Mismatch)
  const [mounted, setMounted] = useState(false)

  // Estados de Negocio
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

  useEffect(() => {
    setMounted(true)
  }, [])

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
      console.error('Error al sincronizar monedero:', error)
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
          setNombreCliente(currentCliente.name || 'Invitado')
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
        console.error('Error al poblar el panel de control:', error)
      } finally {
        setLoading(false)
      }
    }

    if (mounted) {
      loadDashboardData()
    }
  }, [user, mounted])

  // Retorno nulo controlado durante la fase de hidratación estática inicial
  if (!mounted) return null

  if (loading) return <LoadingSpinner isDark={isDark} />

  const proximaCita = citasProximas[0]

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-16 relative overflow-x-hidden ${
      isDark ? 'bg-[#120A07] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'
    }`}>
      
      {/* Fondo Texturizado Minimalista */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-12 space-y-8 relative z-10">

        {/* ============================================================ */}
        {/* 👤 PERFIL & CABECERA EDITORIAL (RESPONSIVA) */}
        {/* ============================================================ */}
        <div className={`border p-5 sm:p-8 rounded-none shadow-sm space-y-6 transition-colors duration-500 ${
          isDark ? 'bg-[#1A0E0A] border-[#2C1A14]' : 'bg-white border-[#F0E4DA]'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-none border flex items-center justify-center shrink-0 ${
                isDark ? 'bg-[#2C1A14] border-[#D4AF37]/40' : 'bg-[#FFF9F6] border-[#D4AF37]/30'
              }`}>
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37] stroke-[1.2]" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] font-bold text-[#D4AF37] tracking-[0.3em] uppercase block">Panel Privado</span>
                <h1 className="font-serif text-2xl sm:text-3xl font-light tracking-tight truncate">
                  Bienvenido, <span className="italic font-normal">{nombreCliente}</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
              <button 
                onClick={handleRefresh} 
                disabled={refreshing}
                className={`p-3 border transition-all duration-300 shrink-0 ${
                  isDark ? 'bg-[#2C1A14] border-[#3d271f] text-[#FFF9F6]/70 hover:text-[#D4AF37]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E] hover:text-[#D4AF37]'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <Link 
                href="/agenda" 
                className="bg-[#1A0E0A] hover:bg-[#D4AF37] border border-transparent text-white px-5 sm:px-6 py-3 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-500 flex items-center justify-center gap-2 flex-1 lg:flex-none text-center"
              >
                <Calendar className="w-3.5 h-3.5 stroke-[1.5]" />
                Reservar Cita
              </Link>
            </div>
          </div>

          <PointsCard glow={puntosGlow} hair={puntosHair} isDark={isDark} />
        </div>

        {/* ============================================================ */}
        {/* 📅 EJE DE CITAS ACTIVAS */}
        {/* ============================================================ */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-[#D4AF37] tracking-[0.3em] uppercase">Próximo Ritual</span>
            <div className={`flex-1 h-[1px] ${isDark ? 'bg-[#D4AF37]/10' : 'bg-[#D4AF37]/20'}`} />
          </div>
          <NextAppointmentCard cita={proximaCita} isDark={isDark} />
        </section>

        {/* ============================================================ */}
        {/* 📢 PASARELA DE ANUNCIOS Y EVENTOS */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`border p-2 ${isDark ? 'bg-[#1A0E0A] border-[#2C1A14]' : 'bg-white border-[#F0E4DA]'}`}>
            <AnunciosBanner position="hero" limit={2} />
          </div>
          <div className={`border p-2 ${isDark ? 'bg-[#1A0E0A] border-[#2C1A14]' : 'bg-white border-[#F0E4DA]'}`}>
            <PromocionesVolante limit={3} />
          </div>
        </div>

        {/* ============================================================ */}
        {/* 🎯 SECCIÓN MISIONES DEL ATELIER */}
        {/* ============================================================ */}
        <div className={`border p-2 ${isDark ? 'bg-[#1A0E0A] border-[#2C1A14]' : 'bg-white border-[#F0E4DA]'}`}>
          <MisionesDiarias />
        </div>

        {/* ============================================================ */}
        {/* 🏆 FIDELIZACIÓN: INSIGNIAS Y RECOMENDADOS */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`border p-2 ${isDark ? 'bg-[#1A0E0A] border-[#2C1A14]' : 'bg-white border-[#F0E4DA]'}`}>
            <QRReferido codigo={codigoReferido} user={user} />
          </div>
          <div className={`border p-6 flex flex-col justify-center ${isDark ? 'bg-[#1A0E0A] border-[#2C1A14]' : 'bg-white border-[#F0E4DA]'}`}>
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
        {/* 🎡 EXPERIENCIA INTERACTIVA */}
        {/* ============================================================ */}
        <div className={`border p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden group ${
          isDark ? 'bg-[#1A0E0A] border-[#D4AF37]/40' : 'bg-white border-[#D4AF37]/30'
        }`}>
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full translate-x-12 translate-y-12 opacity-50 group-hover:scale-110 transition-transform duration-700 pointer-events-none ${
            isDark ? 'bg-[#2C1A14]/30' : 'bg-[#FFF9F6]'
          }`} />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className={`w-12 h-12 border flex items-center justify-center ${
              isDark ? 'bg-[#2C1A14] border-[#D4AF37]/40' : 'bg-[#FFF9F6] border-[#D4AF37]/30'
            }`}>
              <Gift className="w-4 h-4 text-[#D4AF37] stroke-[1.2]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-light tracking-wide">La Rueda de la Fortuna</h3>
              <p className={`text-xs font-light ${isDark ? 'text-[#FFF9F6]/70' : 'text-[#5C4A3E]'}`}>Accede a recompensas y beneficios exclusivos por lealtad.</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsRuletaOpen(true)} 
            className="w-full sm:w-auto bg-[#1A0E0A] hover:bg-[#D4AF37] text-white px-6 py-3.5 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-500 shrink-0 relative z-10 border border-transparent hover:border-transparent"
          >
            Activar Rueda
          </button>
        </div>

        {/* ============================================================ */}
        {/* 📸 INSTAGRAM SOCIAL GALLERY */}
        {/* ============================================================ */}
        <div className={`pt-6 border-t ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`}>
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
