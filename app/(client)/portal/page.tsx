'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import { Calendar, Sparkles, Gift, ArrowRight, RefreshCw } from 'lucide-react'
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
      // Quitamos el filtro estricto de tenant_id para asegurar la lectura directa por client_id
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={`space-y-8 max-w-7xl mx-auto w-full pb-8 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
      
      {/* HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl border bg-stone-950 border-stone-800">
        <div className="relative z-10 p-8 md:p-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-rose-500/20 px-4 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-rose-300 font-medium">
                  {timeOfDay === 'morning' ? 'Buenos días' : timeOfDay === 'afternoon' ? 'Buenas tardes' : 'Buenas noches'}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-white">
                <span className="font-serif italic text-rose-300">{nombreCliente}</span>
              </h1>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div>
                  <p className="text-white font-medium text-sm">{puntosGlow}</p>
                  <p className="text-[9px] uppercase tracking-widest text-stone-400">Pts Estética</p>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{puntosHair}</p>
                  <p className="text-[9px] uppercase tracking-widest text-stone-400">Pts Peluquería</p>
                </div>
                <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-full bg-stone-800 text-stone-400 hover:text-white">
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /> Sincronizar
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
                <span className="px-3 py-1 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
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

      {/* LUCKY WHEEL */}
      <div className="p-6 md:p-8 rounded-3xl border flex flex-col sm:flex-row items-center justify-between bg-stone-900 border-stone-800">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500"><Gift className="w-6 h-6 animate-bounce" /></div>
          <div>
            <h3 className="text-lg font-light">¿Te sientes con <span className="font-serif italic text-amber-500">Suerte</span> hoy?</h3>
            <p className="text-xs text-stone-400">Gira la ruleta diaria y acumula más beneficios.</p>
          </div>
        </div>
        <button onClick={() => setIsRuletaOpen(true)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold">
          Girar Ruleta
        </button>
      </div>

      <InstagramFeed />
      <FooterCliente />

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
