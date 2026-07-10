'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { supabase } from '@/lib/supabase/client'
import { 
  Calendar, 
  Sparkles, 
  Gift, 
  ArrowRight, 
  RefreshCw, 
  Trophy, 
  CheckCircle2, 
  Clock,
  Star,
  Award,
  User,
  Zap,
  Gem
} from 'lucide-react'
import Link from 'next/link'
import InsigniasLogros from '@/components/InsigniasLogros'
import InstagramFeed from '@/components/InstagramFeed'
import QRReferido from '@/components/QRReferido'
import RuletaModal from '@/components/RuedaSuerte'
import MisionesDiarias from '@/components/MisionesDiarias'
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
  const { settings } = useSettings()
  
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
  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

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
          <div className="w-12 h-12 rounded-full border-4 animate-spin" 
            style={{ 
              borderColor: `${settings?.primary_color || '#DB5B9A'}40`, 
              borderTopColor: settings?.primary_color || '#DB5B9A' 
            }} 
          />
          <Sparkles className="w-4 h-4 absolute animate-pulse" style={{ color: settings?.primary_color || '#DB5B9A' }} />
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 max-w-5xl mx-auto w-full px-3 pb-12 antialiased transition-colors duration-500 ${
      isDark 
        ? 'text-stone-100 bg-[#0f0c1b]' 
        : 'text-stone-900 bg-gradient-to-br from-pink-50/30 via-white to-amber-50/20'
    }`}>

      {/* 👑 HERO BANNER COMPACTO */}
      <div className="relative overflow-hidden rounded-2xl p-[1px] shadow-lg transition-all hover:shadow-xl" style={brandGradient}>
        <div className="absolute inset-0 opacity-10 animate-pulse" style={brandGradient} />
        <div className={`relative z-10 rounded-2xl p-4 md:p-5 transition-colors ${
          isDark ? 'bg-[#0f0c1b]' : 'bg-white'
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2 w-full md:w-auto">
              {/* Saludo */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border transition-all hover:scale-105"
                style={{ borderColor: `${settings?.primary_color || '#DB5B9A'}30` }}
              >
                <Sparkles className="w-3 h-3 animate-pulse" style={{ color: settings?.primary_color || '#DB5B9A' }} />
                <span className="text-[8px] uppercase tracking-[0.15em] font-bold" style={{ color: settings?.primary_color || '#DB5B9A' }}>
                  {timeOfDay === 'morning' ? '✨ Buenos días' : timeOfDay === 'afternoon' ? '💖 Buenas tardes' : '🌙 Buenas noches'}
                </span>
              </div>

              {/* Nombre */}
              <h1 className="text-xl md:text-2xl font-black tracking-tight transition-all hover:translate-x-1">
                <span className={isDark ? 'text-white' : 'text-stone-900'}>Hola, </span>
                <span className="font-serif italic font-normal" style={brandGradient}>
                  {nombreCliente.split(' ')[0]}
                </span>
              </h1>

              {/* Puntos Compactos */}
              <div className="flex gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all hover:scale-105 hover:shadow-md" 
                  style={{ borderColor: `${settings?.primary_color || '#DB5B9A'}20` }}
                >
                  <Star className="w-3 h-3" style={{ color: settings?.primary_color || '#DB5B9A' }} />
                  <span className="text-sm font-black">{puntosGlow}</span>
                  <span className="text-[7px] font-bold uppercase tracking-wider text-stone-400">Glow</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all hover:scale-105 hover:shadow-md"
                  style={{ borderColor: `${settings?.secondary_color || '#E5A46E'}20` }}
                >
                  <Star className="w-3 h-3" style={{ color: settings?.secondary_color || '#E5A46E' }} />
                  <span className="text-sm font-black">{puntosHair}</span>
                  <span className="text-[7px] font-bold uppercase tracking-wider text-stone-400">Hair</span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={handleRefresh} 
                disabled={refreshing} 
                className={`p-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
                  isDark 
                    ? 'border-fuchsia-950 hover:bg-[#130f24]' 
                    : 'border-pink-100/60 hover:bg-pink-50/50'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} style={{ color: settings?.primary_color || '#DB5B9A' }} />
              </button>

              <Link 
                href="/agenda" 
                className="relative overflow-hidden px-4 py-2 rounded-xl font-bold text-xs tracking-[0.15em] uppercase flex items-center gap-2 shadow-md transition-all hover:scale-105 active:scale-95"
                style={{ background: brandGradient.backgroundImage }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                </span>
                <span className="text-white">Agendar</span>
                <ArrowRight className="w-3 h-3 text-white/80 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 KPIs COMPACTOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: Calendar, label: 'Citas Hoy', value: citasProximas.filter(c => new Date(c.date).toDateString() === new Date().toDateString()).length },
          { icon: Trophy, label: 'Premios', value: puntosTotales > 100 ? '⭐' : puntosTotales > 50 ? '💎' : '✨' },
          { icon: User, label: 'Referidos', value: referidos.length },
          { icon: Zap, label: 'Servicios', value: serviciosUnicos }
        ].map((kpi, i) => (
          <div 
            key={i}
            className={`rounded-xl p-2.5 border transition-all hover:-translate-y-1 hover:shadow-lg ${
              isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
            } flex items-center gap-2.5 shadow-sm`}
          >
            <div className="p-1.5 rounded-lg shrink-0 transition-all group-hover:scale-110" 
              style={{ backgroundColor: `${settings?.primary_color || '#DB5B9A'}10`, color: settings?.primary_color || '#DB5B9A' }}
            >
              <kpi.icon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">{kpi.label}</p>
              <p className="text-sm font-mono font-black text-stone-900 dark:text-pink-100">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 📅 PRÓXIMAS CITAS */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
        isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
      }`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-black tracking-tight">
              <span className={isDark ? 'text-white' : 'text-stone-900'}>Próximos </span>
              <span className="font-serif italic" style={{ color: settings?.primary_color || '#DB5B9A' }}>Turnos</span>
            </h2>
            <span className={`text-[8px] font-mono px-2.5 py-1 rounded-full font-bold border transition-all hover:scale-105 ${
              isDark ? 'bg-[#0f0c1b] text-pink-400 border-fuchsia-950' : 'bg-pink-50 text-pink-600 border-pink-100/60'
            }`}>
              {citasProximas.length}
            </span>
          </div>

          {citasProximas.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed rounded-xl transition-all hover:scale-[0.99]" 
              style={{ borderColor: `${settings?.primary_color || '#DB5B9A'}20` }}
            >
              <Clock className="w-5 h-5 mx-auto mb-2" style={{ color: settings?.primary_color || '#DB5B9A' }} />
              <p className="text-xs font-medium text-stone-400">Sin citas programadas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {citasProximas.slice(0, 4).map((cita: any) => (
                <div 
                  key={cita.id}
                  className={`relative rounded-xl border p-3 flex justify-between items-center transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-white border-pink-100/60'
                  }`}
                >
                  <div className="absolute left-0 top-2 h-6 w-0.5 rounded-full transition-all group-hover:h-8" 
                    style={{ background: brandGradient.backgroundImage }} 
                  />
                  <div className="pl-2.5 space-y-0.5">
                    <h4 className="text-xs font-bold truncate max-w-[120px]">
                      <span className={isDark ? 'text-white' : 'text-stone-900'}>
                        {cita.services?.name || 'Belleza'}
                      </span>
                    </h4>
                    <p className={`text-[9px] font-medium flex items-center gap-1 ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}>
                      <Calendar className="w-2.5 h-2.5" style={{ color: settings?.primary_color || '#DB5B9A' }} />
                      {cita.date} • {cita.time}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {cita.status === 'confirmed' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 transition-all hover:scale-105">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20 transition-all hover:scale-105">
                        <Clock className="w-2.5 h-2.5 animate-spin" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🎯 GAMIFICACIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className={`rounded-2xl border shadow-sm p-4 transition-all hover:-translate-y-1 hover:shadow-md ${
          isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
        }`}>
          <h3 className="text-xs font-black tracking-tight mb-3 flex items-center gap-2">
            <Award className="w-3.5 h-3.5 transition-all hover:scale-110" style={{ color: settings?.primary_color || '#DB5B9A' }} />
            <span className={isDark ? 'text-white' : 'text-stone-900'}>Logros</span>
          </h3>
          <InsigniasLogros 
            citas={citas.length} 
            serviciosUnicos={serviciosUnicos} 
            referidos={referidos.length} 
            puntos={puntosTotales} 
            racha={3} 
          />
        </div>

        <div className={`rounded-2xl border shadow-sm p-4 transition-all hover:-translate-y-1 hover:shadow-md ${
          isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
        }`}>
          <h3 className="text-xs font-black tracking-tight mb-3 flex items-center gap-2">
            <Gem className="w-3.5 h-3.5 transition-all hover:scale-110" style={{ color: settings?.secondary_color || '#E5A46E' }} />
            <span className={isDark ? 'text-white' : 'text-stone-900'}>Misiones</span>
          </h3>
          <MisionesDiarias />
        </div>
      </div>

      {/* 🎡 RULETA VIP */}
      <div className={`relative overflow-hidden rounded-2xl p-[1px] shadow-lg transition-all hover:shadow-xl`} style={brandGradient}>
        <div className="absolute inset-0 opacity-10 animate-pulse" style={brandGradient} />
        <div className={`relative z-10 rounded-2xl p-4 transition-colors ${
          isDark ? 'bg-[#0f0c1b]' : 'bg-white'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2 rounded-xl shadow-md shrink-0 transition-all hover:rotate-12 hover:scale-110" 
                style={{ background: brandGradient.backgroundImage }}
              >
                <Gift className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight">
                  <span className={isDark ? 'text-white' : 'text-stone-900'}>Ruleta </span>
                  <span className="font-serif italic" style={{ color: settings?.primary_color || '#DB5B9A' }}>VIP</span>
                </h3>
                <p className={`text-[9px] font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Gana premios exclusivos
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsRuletaOpen(true)} 
              className="w-full sm:w-auto px-5 py-2 rounded-xl text-white text-[10px] font-black tracking-[0.15em] uppercase shadow-md transition-all hover:scale-105 active:scale-95"
              style={{ background: brandGradient.backgroundImage }}
            >
              Girar
            </button>
          </div>
        </div>
      </div>

      {/* 📱 REFERIDOS Y SOCIAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className={`rounded-2xl border shadow-sm overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md ${
          isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
        }`}>
          <div className="p-4">
            <QRReferido codigo={codigoReferido} user={user} />
          </div>
        </div>

        <div className={`rounded-2xl border shadow-sm overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md ${
          isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
        }`}>
          <div className="p-4">
            <InstagramFeed />
          </div>
        </div>
      </div>

      {/* 📌 FOOTER */}
      <FooterCliente />

      {/* 🎡 MODAL RULETA */}
      <RuletaModal
        isOpen={isRuletaOpen}
        onClose={() => { 
          setIsRuletaOpen(false)
          if (clientId) refreshPuntos(clientId)
        }}
        onPremioProcesado={() => { 
          if (clientId) refreshPuntos(clientId)
        }}
        usuarioActivo={user || undefined}
        tenantIdActivo={tenantId ?? undefined}
      />
    </div>
  )
}