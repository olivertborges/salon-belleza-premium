// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import { 
  Calendar, ArrowRight, RefreshCw, Clock, Sparkles, User, Heart
} from 'lucide-react'
import Link from 'next/link'

// Componentes del Ecosistema del Cliente
import InsigniasLogros from '@/components/InsigniasLogros'
import InstagramFeed from '@/components/InstagramFeed'
import QRReferido from '@/components/QRReferido'
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
// MICRO-COMPONENTES
// ============================================================

const LoadingSpinner = ({ isDark }: { isDark: boolean }) => (
  <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-300 ${isDark ? 'bg-[#1E1E1E]' : 'bg-[#FAFAFA]'}`}>
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-12 h-12">
        <div className={`absolute inset-0 rounded-full border-2 ${isDark ? 'border-pink-500/10' : 'border-pink-500/20'}`} />
        <div className="absolute inset-0 rounded-full border-t-2 border-pink-500 animate-spin" />
      </div>
      <p className={`text-xs tracking-wider uppercase font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Cargando Fresh Nails Salón...
      </p>
    </div>
  </div>
)

const PointsCard = ({ glow, hair, isDark }: { glow: number; hair: number; isDark: boolean }) => (
  <div className={`relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 ${
    isDark 
      ? 'bg-[#252525] border-gray-800 text-white shadow-lg' 
      : 'bg-white border-pink-100 text-gray-800 shadow-sm'
  }`}>
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
      <div className="flex items-center gap-8 justify-between md:justify-start w-full md:w-auto">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase text-pink-500 tracking-wider">Puntos Acumulados</span>
          <p className="text-3xl font-bold">{glow}</p>
        </div>
        
        <div className={`w-[1px] h-10 hidden md:block ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
        
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase text-pink-500 tracking-wider">Puntos de Regalo</span>
          <p className="text-3xl font-bold">{hair}</p>
        </div>
      </div>

      <div className={`border-t md:border-t-0 pt-4 md:pt-0 flex flex-col justify-end ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Total de Beneficios</span>
        <div className="text-3xl font-extrabold text-pink-500">
          {glow + hair} <span className="text-xs font-normal text-gray-400">pts</span>
        </div>
      </div>
    </div>
  </div>
)

const NextAppointmentCard = ({ cita, isDark }: { cita: Cita | undefined; isDark: boolean }) => {
  if (!cita) {
    return (
      <div className={`p-8 text-center border border-dashed rounded-2xl space-y-3 transition-all duration-300 ${
        isDark ? 'border-gray-800 bg-[#252525]' : 'border-pink-200 bg-pink-50/30'
      }`}>
        <Calendar className="w-8 h-8 text-pink-400 mx-auto" />
        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          No tienes ninguna cita agendada en este momento.
        </p>
        <Link 
          href="/agenda"
          className="inline-flex items-center gap-2 text-xs font-semibold text-pink-500 hover:text-pink-600 uppercase tracking-wider pt-2"
        >
          Agendar una cita
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  const isConfirmed = cita.status === 'confirmed'

  return (
    <div className={`p-6 border rounded-2xl shadow-sm transition-all duration-300 ${
      isDark ? 'bg-[#252525] border-gray-800 text-white' : 'bg-white border-pink-100 text-gray-800'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-pink-100 text-pink-700">
            <span className={`w-2 h-2 rounded-full ${isConfirmed ? 'bg-green-500' : 'bg-amber-500'}`} />
            {isConfirmed ? 'Cita Confirmada' : 'Pendiente de Confirmación'}
          </div>
          
          <h4 className="text-xl font-bold">
            {cita.services?.name || 'Servicio de Belleza'}
          </h4>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 pt-1">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-pink-500" />
              {cita.date}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-pink-500" />
              {cita.time} hs
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
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
      console.error('Error al actualizar puntos:', error)
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
        console.error('Error al cargar datos:', error)
      } finally {
        setLoading(false)
      }
    }

    if (mounted) {
      loadDashboardData()
    }
  }, [user, mounted])

  if (!mounted) return null
  if (loading) return <LoadingSpinner isDark={isDark} />

  const proximaCita = citasProximas[0]

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-12 ${
      isDark ? 'bg-[#1E1E1E] text-white' : 'bg-[#FAFAFA] text-gray-800'
    }`}>
      <div className="max-w-6xl mx-auto px-4 space-y-6 pt-2">

        {/* ============================================================ */}
        {/* CABECERA: SALÓN FRESH NAILS & ANAXIS CAMPOS LEIVA */}
        {/* ============================================================ */}
        <div className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${
          isDark ? 'bg-[#252525] border-gray-800' : 'bg-white border-pink-100 shadow-sm'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-pink-500 uppercase tracking-widest">
                  Fresh Nails Salón
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-xs font-medium text-gray-400">
                  By Anaxis Campos Leiva
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                ¡Hola, {nombreCliente}!
              </h1>
              <p className="text-xs text-gray-400">
                Nos alegra verte de nuevo en tu espacio personal.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleRefresh} 
                disabled={refreshing}
                title="Actualizar datos"
                className={`p-3 rounded-xl border transition-all ${
                  isDark 
                    ? 'bg-[#1E1E1E] border-gray-800 text-gray-400 hover:text-white' 
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <Link 
                href="/agenda" 
                className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-3 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Agendar Cita
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <PointsCard glow={puntosGlow} hair={puntosHair} isDark={isDark} />
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECCIÓN PRÓXIMA CITA */}
        {/* ============================================================ */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-pink-500">
            Tu próxima cita en Fresh Nails Salón
          </h2>
          <NextAppointmentCard cita={proximaCita} isDark={isDark} />
        </section>

        {/* ============================================================ */}
        {/* NOVEDADES Y PROMOCIONES */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-4 border rounded-2xl ${isDark ? 'bg-[#252525] border-gray-800' : 'bg-white border-pink-100 shadow-sm'}`}>
            <AnunciosBanner position="hero" limit={2} />
          </div>
          <div className={`p-4 border rounded-2xl ${isDark ? 'bg-[#252525] border-gray-800' : 'bg-white border-pink-100 shadow-sm'}`}>
            <PromocionesVolante limit={3} />
          </div>
        </div>

        {/* ============================================================ */}
        {/* ACTIVIDADES Y RECOMENDACIONES */}
        {/* ============================================================ */}
        <div className={`p-4 border rounded-2xl ${isDark ? 'bg-[#252525] border-gray-800' : 'bg-white border-pink-100 shadow-sm'}`}>
          <MisionesDiarias />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-4 border rounded-2xl ${isDark ? 'bg-[#252525] border-gray-800' : 'bg-white border-pink-100 shadow-sm'}`}>
            <QRReferido codigo={codigoReferido} user={user} />
          </div>
          <div className={`p-6 border rounded-2xl flex flex-col justify-center ${isDark ? 'bg-[#252525] border-gray-800' : 'bg-white border-pink-100 shadow-sm'}`}>
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
        {/* COMUNIDAD Y REDES (Anaxis Campos Leiva) */}
        {/* ============================================================ */}
        <div className={`pt-6 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <InstagramFeed />
        </div>

        {/* Pie de página */}
        <FooterCliente />

      </div>
    </div>
  )
}
