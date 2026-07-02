'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import {
  Calendar, Camera, Sparkles, User, Award, Clock, Instagram,
  Gift, Star, Heart, Crown, Gem, Zap, Shield, Check, ArrowRight,
  TrendingUp, Users, Image as ImageIcon, CalendarDays, Bell
} from 'lucide-react'
import Link from 'next/link'
import InsigniasLogros from '@/components/InsigniasLogros'
import InstagramFeed from '@/components/InstagramFeed'
import QRReferido from '@/components/QRReferido'
import RuedaSuerte from '@/components/RuedaSuerte'
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

export default function ClientDashboardIndex() {
  const { user, tenantId, clientId: authClientId, points: authPoints } = useAuth()
  const { theme } = useTheme()
  const [citas, setCitas] = useState<Cita[]>([])
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [puntos, setPuntos] = useState(0)
  const [referidos, setReferidos] = useState<any[]>([])
  const [galeria, setGaleria] = useState<GaleriaImagen[]>([])
  const [loading, setLoading] = useState(true)
  const [nombreCliente, setNombreCliente] = useState('')
  const [genero, setGenero] = useState<'male' | 'female' | 'other'>('female')
  const [citasProximas, setCitasProximas] = useState<Cita[]>([])
  const [serviciosUnicos, setServiciosUnicos] = useState(0)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning')
  const [codigoReferido, setCodigoReferido] = useState('X7K-9M2-P4R')
  const [clientId, setClientId] = useState<string | null>(null)

  const isDark = theme === 'dark'

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setTimeOfDay('morning')
    else if (hour < 18) setTimeOfDay('afternoon')
    else setTimeOfDay('evening')
  }, [])

  useEffect(() => {
    if (authPoints !== null) {
      setPuntos(authPoints)
    }
  }, [authPoints])

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
        .single()

      if (error) {
        console.error('Error al obtener puntos:', error)
        return
      }

      const total = (data?.glow_points || 0) + (data?.hair_points || 0)
      setPuntos(total)
    } catch (error) {
      console.error('Error refrescando puntos:', error)
    }
  }

  const handlePuntosGanados = (puntosGanados: number) => {
    setTimeout(() => {
      refreshPuntos()
    }, 1000)
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

        if (clienteError) {
          console.error('Error cargando cliente:', clienteError)
        }

        if (clienteData) {
          setCliente(clienteData)
          setClientId(clienteData.id)
          setNombreCliente(clienteData.name || user.email?.split('@')[0] || 'Cliente')
          setGenero(clienteData.gender || 'female')
          setCodigoReferido(clienteData.referral_code || 'X7K-9M2-P4R')

          if (authPoints === null) {
            const { data: walletData } = await supabase
              .from('loyalty_wallets')
              .select('glow_points, hair_points')
              .eq('client_id', clienteData.id)
              .eq('tenant_id', tenantId)
              .single()

            const total = (walletData?.glow_points || 0) + (walletData?.hair_points || 0)
            setPuntos(total)
          }

          const { data: citasData, error: citasError } = await supabase
            .from('appointments')
            .select(`
              *,
              services:service_id (name, price, duration)
            `)
            .eq('client_id', clienteData.id)
            .eq('tenant_id', tenantId)
            .order('date', { ascending: true })

          if (citasError) {
            console.error('Error cargando citas:', citasError)
          } else {
            let citasConStaff = citasData || []

            if (citasData && citasData.length > 0) {
              const staffIds = [...new Set(citasData.map((c: any) => c.staff_id).filter(Boolean))]

              if (staffIds.length > 0) {
                const { data: staffData } = await supabase
                  .from('staff')
                  .select('id, name, specialty')
                  .in('id', staffIds)

                const staffMap = (staffData || []).reduce((acc: any, s: any) => {
                  acc[s.id] = s
                  return acc
                }, {})

                citasConStaff = citasData.map((c: any) => ({
                  ...c,
                  staff: c.staff_id ? staffMap[c.staff_id] : null
                }))
              }
            }

            setCitas(citasConStaff)

            const hoy = new Date()
            hoy.setHours(0, 0, 0, 0)

            const proximas = (citasConStaff || [])
              .filter((c: any) => {
                const cDate = new Date(c.date)
                cDate.setHours(0, 0, 0, 0)
                return cDate >= hoy && c.status !== 'cancelled'
              })
              .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

            setCitasProximas(proximas)
            setServiciosUnicos(new Set((citasConStaff || []).map((c: any) => c.service_id)).size)
          }
        } else {
          setNombreCliente(user.email?.split('@')[0] || 'Cliente')
        }

        if (clienteData?.id) {
          const { data: referidosData } = await supabase
            .from('clients')
            .select('id, name, email, created_at')
            .eq('referred_by_id', clienteData.id)
            .eq('tenant_id', tenantId)
          setReferidos(referidosData || [])
        }

        if (clienteData?.id) {
          const { data: galeriaData } = await supabase
            .from('client_gallery')
            .select('*')
            .eq('client_id', clienteData.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(6)
          setGaleria(galeriaData || [])
        }

      } catch (error) {
        console.error('Error cargando datos del dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user, tenantId, authPoints])

  useEffect(() => {
    if (clientId && tenantId) {
      refreshPuntos()
    }
  }, [clientId, tenantId])

  const getSaludo = () => {
    const saludos = {
      morning: { male: 'Buenos días', female: 'Buenos días', other: 'Buenos días' },
      afternoon: { male: 'Buenas tardes', female: 'Buenas tardes', other: 'Buenas tardes' },
      evening: { male: 'Buenas noches', female: 'Buenas noches', other: 'Buenas noches' }
    }
    return saludos[timeOfDay][genero] || saludos.morning.female
  }

  const getEmoji = () => {
    if (timeOfDay === 'morning') return '🌅'
    if (timeOfDay === 'afternoon') return '☀️'
    return '🌙'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-rose-500/20 rounded-full animate-ping" />
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-8 selection:bg-rose-500/20 antialiased max-w-7xl mx-auto w-full transition-colors duration-300 pb-8 ${
      isDark ? 'text-stone-100' : 'text-stone-900'
    }`}>

      {/* HERO */}
      <div className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ${
        isDark
          ? 'bg-gradient-to-br from-[#161311] via-[#120f0e] to-[#0a0908] border-stone-800/50 shadow-2xl shadow-black/50'
          : 'bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 border-stone-700/50 shadow-2xl shadow-stone-900/20'
      }`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        </div>

        <div className="relative z-10 p-8 md:p-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500/20 to-amber-500/20 backdrop-blur-sm border border-rose-400/20 px-4 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.25em] text-rose-300 font-medium">
                  {getEmoji()} {getSaludo()}
                </span>
              </div>

              <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-white leading-[1.1]">
                  <span className="font-serif italic text-rose-300">{nombreCliente}</span>
                </h1>
                <p className="text-stone-300 text-sm max-w-lg font-light leading-relaxed opacity-90">
                  Tu espacio de belleza y bienestar. Descubre servicios exclusivos y vive una experiencia única.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                {[
                  { icon: Award, label: 'Puntos', value: puntos, color: 'text-amber-400' },
                  { icon: Calendar, label: 'Citas', value: citas.length, color: 'text-rose-400' },
                  { icon: Users, label: 'Referidos', value: referidos.length, color: 'text-blue-400' },
                  { icon: Gem, label: 'Nivel', value: 'VIP', color: 'text-purple-400' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    <div>
                      <p className="text-white font-medium text-sm">{stat.value}</p>
                      <p className={`text-[9px] uppercase tracking-widest ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                        {stat.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-auto shrink-0 transform hover:scale-[1.02] transition-all duration-300">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-amber-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                <Link
                  href="/agenda"
                  className="relative flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-rose-600 to-amber-500 text-white font-medium rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-rose-500/30"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Agendar Cita</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ANUNCIOS Y PROMOCIONES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnunciosCliente />
        <PromocionesCliente />
      </div>

      {/* TURNOS AGENDADOS */}
      <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
        isDark
          ? 'bg-[#141211] border-stone-800/50 shadow-xl shadow-black/30'
          : 'bg-white border-stone-200/80 shadow-xl shadow-stone-200/30'
      }`}>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-500/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-500/5 rounded-full blur-2xl" />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${
                isDark ? 'bg-rose-500/10' : 'bg-rose-50'
              }`}>
                <CalendarDays className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h2 className={`text-xl font-light ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                  Próximos <span className="font-serif italic text-rose-500">Turnos</span>
                </h2>
                <p className={`text-[11px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                  {citasProximas.length === 0
                    ? 'No tienes citas programadas'
                    : `${citasProximas.length} cita${citasProximas.length > 1 ? 's' : ''} agendada${citasProximas.length > 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>
            {citasProximas.length > 0 && (
              <Link
                href="/reservas"
                className={`text-xs font-medium flex items-center gap-1 transition-all hover:gap-2 ${
                  isDark ? 'text-rose-400 hover:text-rose-300' : 'text-rose-600 hover:text-rose-700'
                }`}
              >
                Ver todas <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {citasProximas.length === 0 ? (
            <div className={`text-center py-12 border-2 border-dashed rounded-2xl ${
              isDark ? 'border-stone-800 bg-stone-900/20' : 'border-stone-200 bg-stone-50/50'
            }`}>
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                No tienes sesiones programadas
              </p>
              <Link
                href="/agenda"
                className="inline-block mt-3 text-xs text-rose-500 hover:text-rose-400 transition-colors font-medium"
              >
                Agendar una cita →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {citasProximas.slice(0, 3).map((cita: any, index) => {
                const fecha = new Date(cita.date)
                const hoy = new Date()
                const esHoy = fecha.toDateString() === hoy.toDateString()

                let fechaLabel = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(fecha)
                if (esHoy) fechaLabel = 'Hoy'

                return (
                  <div
                    key={cita.id}
                    className={`group flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
                      isDark
                        ? 'bg-stone-900/30 border-stone-800/50 hover:border-rose-500/20 hover:bg-stone-900/50'
                        : 'bg-stone-50/50 border-stone-200/80 hover:border-rose-500/20 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isDark ? 'bg-rose-500/10' : 'bg-rose-50'
                      }`}>
                        <Calendar className="w-4 h-4 text-rose-500" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                          {cita.services?.name || 'Servicio Registrado'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <p className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                            <Clock className="w-3 h-3" />
                            {fechaLabel} • {cita.time} hs
                          </p>
                          {cita.staff?.name && (
                            <p className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                              <User className="w-3 h-3" />
                              {cita.staff.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3 sm:mt-0">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        cita.status === 'confirmed'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : cita.status === 'cancelled'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}>
                        {cita.status === 'confirmed' ? '✓ Confirmada' :
                         cita.status === 'cancelled' ? '✗ Cancelada' : '⏳ Pendiente'}
                      </span>
                      <Link
                        href={`/reservas/${cita.id}`}
                        className={`text-[10px] transition-colors ${
                          isDark ? 'text-rose-400 hover:text-rose-300' : 'text-rose-600 hover:text-rose-700'
                        }`}
                      >
                        Detalles →
                      </Link>
                    </div>
                  </div>
                )
              })}
              {citasProximas.length > 3 && (
                <Link
                  href="/reservas"
                  className="block text-center text-xs text-rose-500 hover:text-rose-400 transition-colors py-2 font-medium"
                >
                  Ver todas las citas ({citasProximas.length})
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MISIONES DIARIAS */}
      <MisionesDiarias />

      {/* QR REFERIDO */}
      <QRReferido codigo={codigoReferido} user={user} />

      {/* INSIGNIAS Y LOGROS */}
      <div className="relative overflow-hidden rounded-3xl border transition-all duration-300">
        <InsigniasLogros
          citas={citas.length}
          serviciosUnicos={serviciosUnicos}
          referidos={referidos.length}
          puntos={puntos}
          racha={3}
        />
      </div>

      {/* ============================================ */}
      {/* RUEDA DE LA SUERTE - CON PROPS EXPLÍCITAS */}
      {/* ============================================ */}
      <RuedaSuerte 
        onPuntosGanados={handlePuntosGanados}
        userId={user?.id}
        clientId={clientId}
        tenantId={tenantId}
      />

      {/* GALERÍA */}
      <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
        isDark
          ? 'bg-[#141211] border-stone-800/50 shadow-xl shadow-black/30'
          : 'bg-white border-stone-200/80 shadow-xl shadow-stone-200/30'
      }`}>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/5 rounded-full blur-2xl" />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${
                isDark ? 'bg-purple-500/10' : 'bg-purple-50'
              }`}>
                <ImageIcon className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h2 className={`text-xl font-light ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                  Tu <span className="font-serif italic text-purple-500">Galería</span>
                </h2>
                <p className={`text-[11px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                  {galeria.length} imágenes guardadas
                </p>
              </div>
            </div>
            {galeria.length > 0 && (
              <Link
                href="/galeria"
                className={`text-xs font-medium flex items-center gap-1 transition-all hover:gap-2 ${
                  isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                }`}
              >
                Ver todas <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {galeria.length === 0 ? (
            <div className={`text-center py-12 border-2 border-dashed rounded-2xl ${
              isDark ? 'border-stone-800 bg-stone-900/20' : 'border-stone-200 bg-stone-50/50'
            }`}>
              <Camera className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Aún no tienes fotos en tu galería
              </p>
              <p className={`text-[10px] mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                Sube tus mejores trabajos para compartir
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {galeria.slice(0, 6).map((img, index) => (
                <div
                  key={img.id}
                  className={`aspect-square rounded-2xl overflow-hidden group relative cursor-pointer transition-all duration-500 hover:scale-[1.02] ${
                    isDark ? 'bg-stone-800' : 'bg-stone-100'
                  }`}
                  onMouseEnter={() => setHoveredCard(img.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {img.image_url ? (
                    <img
                      src={img.image_url}
                      alt={img.title || 'Foto de galería'}
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-8 h-8 opacity-20" />
                    </div>
                  )}

                  <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${
                    hoveredCard === img.id ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      {img.title && (
                        <p className="text-white text-xs font-medium truncate">{img.title}</p>
                      )}
                      {img.description && (
                        <p className="text-white/60 text-[9px] truncate">{img.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* INSTAGRAM FEED */}
      <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
        isDark
          ? 'bg-[#141211] border-stone-800/50 shadow-xl shadow-black/30'
          : 'bg-white border-stone-200/80 shadow-xl shadow-stone-200/30'
      }`}>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-500/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-500/5 rounded-full blur-2xl" />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-2xl ${
              isDark ? 'bg-pink-500/10' : 'bg-pink-50'
            }`}>
              <Instagram className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h2 className={`text-xl font-light ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                Instagram <span className="font-serif italic text-pink-500">@freshnails</span>
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                Últimas publicaciones de nuestro salón
              </p>
            </div>
          </div>
          <InstagramFeed />
        </div>
      </div>

      {/* FOOTER */}
      <FooterCliente />

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  )
}
