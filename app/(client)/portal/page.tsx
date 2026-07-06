'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import {
  Calendar, Camera, Sparkles, User, Award, Clock, Instagram,
  Gift, CalendarDays, ArrowRight, RefreshCw
} from 'lucide-react'
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
  professional_id?: string
  staff_id?: string
  notes?: string
  services?: { name: string; price: number; duration: number }
  staff?: { name: string; specialty: string }
}

interface Cliente {
  id: string
  name: string
  email: string
  phone: string
  points: number
  referral_code: string
  avatar_url?: string
  gender?: 'male' | 'female' | 'other'
  created_at: string
}

interface GaleriaImagen {
  id: string
  client_id: string
  image_url: string
  title: string
  description: string
  is_active: boolean
  created_at: string
}

interface LoyaltyWalletRow {
  glow_points: number
  hair_points: number
}

export default function ClientDashboardIndex() {
  const { user, tenantId, clientId: authClientId, refreshUserData } = useAuth()
  const { theme } = useTheme()
  const [citas, setCitas] = useState<Cita[]>([])
  const [cliente, setCliente] = useState<Cliente | null>(null)
  
  const [puntosGlow, setPuntosGlow] = useState(0)
  const [puntosHair, setPuntosHair] = useState(0)
  const [puntosTotales, setPuntosTotales] = useState(0)
  
  const [referidos, setReferidos] = useState<any[]>([])
  const [galeria, setGaleria] = useState<GaleriaImagen[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nombreCliente, setNombreCliente] = useState('')
  const [genero, setGenero] = useState<'male' | 'female' | 'other'>('female')
  const [citasProximas, setCitasProximas] = useState<Cita[]>([])
  const [serviciosUnicos, setServiciosUnicos] = useState(0)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
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

  useEffect(() => {
    if (authClientId) {
      setClientId(authClientId)
    }
  }, [authClientId])

  const refreshPuntos = async () => {
    if (!clientId || !tenantId) return

    try {
      const { data, error } = await supabase
        .from('loyalty_wallets')
        .select('glow_points, hair_points')
        .eq('client_id', clientId)
        .eq('tenant_id', tenantId)
        .maybeSingle()

      if (error) return

      if (data) {
        const wallet = data as unknown as LoyaltyWalletRow
        setPuntosGlow(wallet.glow_points || 0)
        setPuntosHair(wallet.hair_points || 0)
        setPuntosTotales((wallet.glow_points || 0) + (wallet.hair_points || 0))
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshUserData()
    await refreshPuntos()
    setTimeout(() => setRefreshing(false), 500)
  }

  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.id || !tenantId) {
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const { data: clienteData, error: clienteError } = await supabase
          .from('clients')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (clienteData) {
          const currentCliente = clienteData as unknown as Cliente
          setCliente(currentCliente)
          setClientId(currentCliente.id)
          setNombreCliente(currentCliente.name || user.email?.split('@')[0] || 'Cliente')
          setGenero(currentCliente.gender || 'female')
          setCodigoReferido(currentCliente.referral_code || 'X7K-9M2-P4R')

          const { data: walletData } = await supabase
            .from('loyalty_wallets')
            .select('glow_points, hair_points')
            .eq('client_id', currentCliente.id)
            .eq('tenant_id', tenantId)
            .maybeSingle()

          if (walletData) {
            const wallet = walletData as unknown as LoyaltyWalletRow
            setPuntosGlow(wallet.glow_points || 0)
            setPuntosHair(wallet.hair_points || 0)
            setPuntosTotales((wallet.glow_points || 0) + (wallet.hair_points || 0))
          }

          const { data: citasData } = await supabase
            .from('appointments')
            .select(`
              *,
              services:service_id (name, price, duration)
            `)
            .eq('client_id', currentCliente.id)
            .eq('tenant_id', tenantId)
            .order('date', { ascending: true })

          let citasConStaff = (citasData || []) as any[]

          if (citasConStaff && citasConStaff.length > 0) {
            const todosLosStaffIds = citasConStaff.map((c: any) => c.staff_id).filter(Boolean);
            const staffIds = todosLosStaffIds.filter((id: any, index: number) => todosLosStaffIds.indexOf(id) === index);

            if (staffIds.length > 0) {
              const { data: staffData } = await supabase
                .from('staff')
                .select('id, name, specialty')
                .in('id', staffIds)

              const staffMap = (staffData || []).reduce((acc: any, s: any) => {
                acc[s.id] = s
                return acc
              }, {})

              citasConStaff = citasConStaff.map((c: any) => ({
                ...c,
                staff: c.staff_id ? staffMap[c.staff_id] : null
              }))
            }
          }

          setCitas(citasConStaff)

          const hoy = new Date()
          hoy.setHours(0, 0, 0, 0)

          const proximas = citasConStaff
            .filter((c: any) => {
              const cDate = new Date(c.date)
              cDate.setHours(0, 0, 0, 0)
              return cDate >= hoy && c.status !== 'cancelled'
            })
          setCitasProximas(proximas)
          setServiciosUnicos(new Set(citasConStaff.map((c: any) => c.service_id)).size)
        }

        if (clienteData) {
          const currentCliente = clienteData as unknown as Cliente
          const { data: referidosData } = await supabase
            .from('clients')
            .select('id, name, email, created_at')
            .eq('referred_by_id', currentCliente.id)
            .eq('tenant_id', tenantId)
          setReferidos(referidosData || [])

          const { data: galeriaData } = await supabase
            .from('client_gallery')
            .select('*')
            .eq('client_id', currentCliente.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(6)
          setGaleria((galeriaData || []) as GaleriaImagen[])
        }

      } catch (error) {
        console.error(error)
      } {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user, tenantId])

  const getSaludo = () => {
    const saludos = {
      morning: 'Buenos días',
      afternoon: 'Buenas tardes',
      evening: 'Buenas noches'
    }
    return saludos[timeOfDay]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={`space-y-8 max-w-7xl mx-auto w-full pb-8 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>

      {/* HERO */}
      <div className={`relative overflow-hidden rounded-3xl border ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-950 border-stone-700'}`}>
        <div className="relative z-10 p-8 md:p-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-rose-500/20 border border-rose-400/20 px-4 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-rose-300 font-medium">{getSaludo()}</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-white">
                <span className="font-serif italic text-rose-300">{nombreCliente}</span>
              </h1>

              {/* BILLETERAS VIP */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  <div>
                    <p className="text-white font-medium text-sm">{puntosGlow}</p>
                    <p className="text-[9px] uppercase tracking-widest text-stone-400">Pts Estética</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-white font-medium text-sm">{puntosHair}</p>
                    <p className="text-[9px] uppercase tracking-widest text-stone-400">Pts Peluquería</p>
                  </div>
                </div>
                <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-full bg-stone-800 text-stone-400 hover:text-white">
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /> Recargar puntos
                </button>
              </div>
            </div>

            <Link href="/agenda" className="px-8 py-4 bg-gradient-to-r from-rose-600 to-amber-500 text-white font-medium rounded-2xl flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Agendar Cita <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnunciosCliente />
        <PromocionesCliente />
      </div>

      {/* TURNOS */}
      <div className={`p-6 md:p-8 rounded-3xl border ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`}>
        <h2 className="text-xl font-light mb-4">Próximos <span className="font-serif italic text-rose-500">Turnos</span></h2>
        {citasProximas.length === 0 ? (
          <p className="text-stone-400 text-sm py-4">No tienes citas programadas.</p>
        ) : (
          <div className="space-y-3">
            {citasProximas.slice(0, 3).map((cita: any) => (
              <div key={cita.id} className="p-4 rounded-2xl border bg-stone-900/10 flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium">{cita.services?.name || 'Servicio'}</h4>
                  <p className="text-xs text-stone-400">{cita.date} • {cita.time} hs</p>
                </div>
                <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {cita.status === 'confirmed' ? '✓ Confirmada' : '⏳ Pendiente'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <MisionesDiarias />
      <QRReferido codigo={codigoReferido} user={user} />

      <InsigniasLogros citas={citas.length} serviciosUnicos={serviciosUnicos} referidos={referidos.length} puntos={puntosTotales} racha={3} />

      {/* 🎰 BANNER EXCLUSIVO DE LA RULETA */}
      <div className={`p-6 md:p-8 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-6 ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-rose-50 border-rose-100'}`}>
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500"><Gift className="w-6 h-6 animate-bounce" /></div>
          <div>
            <h3 className="text-lg font-light">¿Te sientes con <span className="font-serif italic text-amber-500">Suerte</span> hoy?</h3>
            <p className="text-xs text-stone-400">Tienes 1 giro diario disponible para ganar puntos VIP en Peluquería o Estética.</p>
          </div>
        </div>
        <button onClick={() => setIsRuletaOpen(true)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs uppercase font-bold">
          Girar Ruleta
        </button>
      </div>

      {/* GALERÍA */}
      <div className={`p-6 md:p-8 rounded-3xl border ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`}>
        <h2 className="text-xl font-light mb-4">Tu <span className="font-serif italic text-purple-500">Galería</span></h2>
        {galeria.length === 0 ? (
          <p className="text-stone-400 text-sm py-4">Aún no tienes fotos guardadas.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {galeria.slice(0, 6).map((img) => (
              <div key={img.id} className="aspect-square rounded-2xl overflow-hidden bg-stone-800">
                <img src={img.image_url} alt="Galería" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      <InstagramFeed />
      <FooterCliente />

      {/* 🎰 MODAL DE LA RULETA MANDANDO SESIÓN DIRECTA */}
      <RuletaModal
        isOpen={isRuletaOpen}
        onClose={() => setIsRuletaOpen(false)}
        onPremioProcesado={refreshPuntos}
        usuarioActivo={user}       // Enlace directo de sesión
        tenantIdActivo={tenantId} // Enlace directo de empresa
      />
    </div>
  )
}