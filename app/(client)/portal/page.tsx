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
  Crown, 
  CheckCircle2, 
  Clock,
  Star,
  Award,
  Heart,
  User,
  TrendingUp,
  Zap,
  Gem,
  Briefcase
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
  const [isMounted, setIsMounted] = useState(false)

  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color
  const secondaryColor = settings?.secondary_color

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${primaryColor || '#DB5B9A'}, ${secondaryColor || '#E5A46E'})`
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

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

  // Mostrar skeleton mientras se monta o carga
  if (!isMounted || loading || !settings) {
    return (
      <div className="max-w-5xl mx-auto w-full px-4 py-8">
        <div className="space-y-6 animate-pulse">
          {/* Skeleton Hero */}
          <div className="rounded-3xl p-[1px] bg-gradient-to-r from-pink-200 to-amber-200">
            <div className="rounded-[23px] p-6 md:p-8 bg-white dark:bg-[#0f0c1b]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-4 w-full md:w-auto">
                  <div className="w-32 h-4 bg-stone-200 dark:bg-stone-700 rounded-full" />
                  <div className="w-48 h-8 bg-stone-200 dark:bg-stone-700 rounded" />
                  <div className="flex gap-3">
                    <div className="w-24 h-10 bg-stone-200 dark:bg-stone-700 rounded-xl" />
                    <div className="w-24 h-10 bg-stone-200 dark:bg-stone-700 rounded-xl" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-24 h-12 bg-stone-200 dark:bg-stone-700 rounded-xl" />
                  <div className="w-32 h-12 bg-stone-200 dark:bg-stone-700 rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Skeleton KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1,2,3,4].map((i) => (
              <div key={i} className="rounded-2xl p-3 bg-white dark:bg-[#130f24] border border-pink-100/60 dark:border-fuchsia-950">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-stone-200 dark:bg-stone-700" />
                  <div>
                    <div className="w-12 h-3 bg-stone-200 dark:bg-stone-700 rounded" />
                    <div className="w-8 h-4 bg-stone-200 dark:bg-stone-700 rounded mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton Citas */}
          <div className="rounded-3xl p-6 bg-white dark:bg-[#130f24] border border-pink-100/60 dark:border-fuchsia-950">
            <div className="flex justify-between items-center mb-6">
              <div className="w-32 h-6 bg-stone-200 dark:bg-stone-700 rounded" />
              <div className="w-16 h-6 bg-stone-200 dark:bg-stone-700 rounded" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2].map((i) => (
                <div key={i} className="h-20 bg-stone-200 dark:bg-stone-700 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-8 max-w-5xl mx-auto w-full px-4 pb-12 antialiased transition-colors duration-500 ${
      isDark 
        ? 'text-stone-100 bg-[#0f0c1b]' 
        : 'text-stone-900 bg-gradient-to-br from-pink-50/30 via-white to-amber-50/20'
    }`}>

      {/* 👑 HERO BANNER PREMIUM */}
      <div className="relative overflow-hidden rounded-3xl p-[1px] shadow-xl" style={brandGradient}>
        <div className="absolute inset-0 opacity-20 animate-pulse" style={brandGradient} />
        <div className={`relative z-10 rounded-[23px] p-6 md:p-8 transition-colors ${
          isDark ? 'bg-[#0f0c1b]' : 'bg-white'
        }`}>
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-56 h-56 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: `${primaryColor}10` }} />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: `${secondaryColor}10` }} />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-4 w-full md:w-auto">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full backdrop-blur-sm border ${
                isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-pink-50/50 border-pink-100/60'
              }`}>
                <Sparkles className="w-3.5 h-3.5 animate-pulse" style={{ color: primaryColor }} />
                <span className={`text-[10px] uppercase tracking-widest font-extrabold ${
                  isDark ? 'text-pink-300' : 'text-stone-600'
                }`}>
                  {timeOfDay === 'morning' ? '✨ Buenos días' : timeOfDay === 'afternoon' ? '💖 Buenas tardes' : '🌙 Buenas noches'}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                <span className={isDark ? 'text-white' : 'text-stone-900'}>
                  Hola,{' '}
                </span>
                <span 
                  className="font-serif italic font-normal bg-clip-text text-transparent"
                  style={brandGradient}
                >
                  {nombreCliente}
                </span>
              </h1>

              {/* PUNTOS DIGITALES */}
              <div className="grid grid-cols-2 gap-3 pt-1 max-w-md">
                <div className={`rounded-2xl p-3.5 border shadow-sm ${
                  isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-pink-50/50 border-pink-100/60'
                }`}>
                  <p className="text-2xl font-black tracking-tight flex items-center gap-1.5">
                    <span className={isDark ? 'text-white' : 'text-stone-900'}>{puntosGlow}</span>
                    <Star className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                  </p>
                  <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${
                    isDark ? 'text-pink-400' : 'text-stone-500'
                  }`}>
                    Estética Glow
                  </p>
                </div>
                <div className={`rounded-2xl p-3.5 border shadow-sm ${
                  isDark ? 'bg-[#130f24] border-amber-950' : 'bg-amber-50/50 border-amber-100/60'
                }`}>
                  <p className="text-2xl font-black tracking-tight flex items-center gap-1.5">
                    <span className={isDark ? 'text-white' : 'text-stone-900'}>{puntosHair}</span>
                    <Star className="w-3.5 h-3.5" style={{ color: secondaryColor }} />
                  </p>
                  <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${
                    isDark ? 'text-amber-400' : 'text-stone-500'
                  }`}>
                    Peluquería Hair
                  </p>
                </div>
              </div>
            </div>

            {/* ACCIONES RÁPIDAS */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button 
                onClick={handleRefresh} 
                disabled={refreshing} 
                className={`inline-flex items-center justify-center gap-2 text-[10px] font-extrabold tracking-wider uppercase px-4 py-3 rounded-xl transition active:scale-95 border ${
                  isDark 
                    ? 'bg-[#130f24] hover:bg-[#1a1430] text-stone-300 border-fuchsia-950' 
                    : 'bg-stone-900 text-white hover:bg-stone-800 border-stone-800'
                }`}
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} style={{ color: primaryColor }} /> 
                Sincronizar
              </button>

              <Link 
                href="/agenda" 
                className={`relative group overflow-hidden px-6 py-3 rounded-xl font-black text-xs tracking-[0.2em] uppercase transition-all duration-300 transform active:scale-[0.98] hover:-translate-y-0.5 flex items-center justify-center gap-3 border shadow-lg ${
                  isDark 
                    ? 'bg-white text-stone-900 border-stone-100 hover:shadow-pink-500/20' 
                    : 'bg-stone-900 text-white border-stone-800 hover:shadow-pink-500/30'
                }`}
                style={isDark ? {} : { backgroundColor: primaryColor, borderColor: primaryColor }}
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: primaryColor }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: primaryColor }} />
                </span>
                <Calendar className="w-4 h-4 transition-transform group-hover:rotate-12 duration-300" />
                <span>Agendar Cita</span>
                <ArrowRight className="w-3.5 h-3.5 transition-all duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 KPIs DE ESTATUS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Calendar, label: 'Citas Hoy', value: citasProximas.filter(c => new Date(c.date).toDateString() === new Date().toDateString()).length },
          { icon: Trophy, label: 'Premios VIP', value: puntosTotales > 100 ? '⭐' : puntosTotales > 50 ? '💎' : '✨' },
          { icon: User, label: 'Referidos', value: referidos.length },
          { icon: Zap, label: 'Servicios', value: serviciosUnicos }
        ].map((kpi, i) => (
          <div key={i} className={`rounded-2xl p-3 shadow-sm border ${
            isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
          } flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:shadow-lg`} style={{ boxShadow: `0 4px 12px ${primaryColor}10` }}>
            <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
              <kpi.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">{kpi.label}</p>
              <h3 className="text-sm font-mono font-black text-stone-900 dark:text-pink-100">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* 📅 PRÓXIMAS CITAS */}
      <div className={`rounded-3xl border shadow-lg overflow-hidden ${
        isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
      }`}>
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black tracking-tight">
              <span className={isDark ? 'text-white' : 'text-stone-900'}>Próximos </span>
              <span className="font-serif italic font-normal" style={{ color: primaryColor }}>Turnos</span>
            </h2>
            <span className={`text-xs font-mono px-3 py-1 rounded-full font-bold border ${
              isDark ? 'bg-[#0f0c1b] text-pink-400 border-fuchsia-950' : 'bg-pink-50 text-pink-600 border-pink-100/60'
            }`}>
              {citasProximas.length} Reservas
            </span>
          </div>

          {citasProximas.length === 0 ? (
            <div className={`text-center py-12 border-2 border-dashed rounded-2xl ${
              isDark ? 'border-fuchsia-950' : 'border-pink-100/60'
            }`}>
              <Clock className="w-8 h-8 mx-auto mb-3" style={{ color: primaryColor }} />
              <p className={`text-sm font-medium ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                Aún no tienes citas programadas
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>
                ¡Consiéntete con un nuevo tratamiento!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {citasProximas.slice(0, 4).map((cita: any) => (
                <div key={cita.id} className={`relative rounded-2xl border p-4 flex justify-between items-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg overflow-hidden ${
                  isDark ? 'bg-[#0f0c1b] border-fuchsia-950' : 'bg-white border-pink-100/60'
                }`}>
                  <div className="absolute left-0 top-0 h-full w-1" style={{ background: brandGradient.backgroundImage }} />
                  <div className="space-y-1 pl-3">
                    <h4 className="text-sm font-black tracking-tight">
                      <span className={isDark ? 'text-white' : 'text-stone-900'}>
                        {cita.services?.name || 'Servicio de Belleza'}
                      </span>
                    </h4>
                    <p className={`text-xs font-bold flex items-center gap-1.5 ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}>
                      <Calendar className="w-3 h-3" style={{ color: primaryColor }} /> 
                      {cita.date} • {cita.time} hs
                    </p>
                  </div>
                  <div>
                    {cita.status === 'confirmed' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Confirmada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Clock className="w-2.5 h-2.5 animate-spin" /> Pendiente
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🎯 SECCIÓN DE LOGROS Y GAMIFICACIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-3xl border shadow-lg p-6 ${
          isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
        }`}>
          <InsigniasLogros 
            citas={citas.length} 
            serviciosUnicos={serviciosUnicos} 
            referidos={referidos.length} 
            puntos={puntosTotales} 
            racha={3} 
          />
        </div>

        <div className={`rounded-3xl border shadow-lg p-6 ${
          isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
        }`}>
          <h3 className="text-sm font-black tracking-tight mb-4 flex items-center gap-2">
            <Gem className="w-4 h-4" style={{ color: secondaryColor }} />
            <span className={isDark ? 'text-white' : 'text-stone-900'}>Misiones Diarias</span>
          </h3>
          <MisionesDiarias />
        </div>
      </div>

      {/* 🎡 RULETA VIP */}
      <div className={`relative overflow-hidden rounded-3xl p-[1px] shadow-xl`} style={brandGradient}>
        <div className="absolute inset-0 opacity-10 animate-pulse" style={brandGradient} />
        <div className={`relative z-10 rounded-[23px] p-6 md:p-8 transition-colors ${
          isDark ? 'bg-[#0f0c1b]' : 'bg-white'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl shadow-lg" style={{ background: brandGradient.backgroundImage }}>
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  <span className={isDark ? 'text-white' : 'text-stone-900'}>¿Te sientes con </span>
                  <span className="font-serif italic font-normal" style={{ color: primaryColor }}>suerte</span>
                  <span className={isDark ? 'text-white' : 'text-stone-900'}> hoy?</span>
                </h3>
                <p className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Gira la ruleta y gana premios exclusivos
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsRuletaOpen(true)} 
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-white text-xs font-black tracking-widest uppercase shadow-lg transition transform active:scale-95 hover:scale-105"
              style={{ background: brandGradient.backgroundImage }}
            >
              Girar Ruleta
            </button>
          </div>
        </div>
      </div>

      {/* 📱 REFERIDOS Y REDES SOCIALES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-3xl border shadow-lg overflow-hidden ${
          isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
        }`}>
          <div className="p-6">
            <QRReferido codigo={codigoReferido} user={user} />
          </div>
        </div>

        <div className={`rounded-3xl border shadow-lg overflow-hidden ${
          isDark ? 'bg-[#130f24] border-fuchsia-950' : 'bg-white border-pink-100/60'
        }`}>
          <div className="p-6">
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