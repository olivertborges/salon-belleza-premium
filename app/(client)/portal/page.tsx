'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import { 
  Calendar, Camera, Sparkles, User, Award, Clock, MapPin, Instagram,
  Gift, Star, Heart, Crown, Gem, Zap, Shield, Check, ArrowRight,
  TrendingUp, Users, Image as ImageIcon, Layers, CalendarDays, Bell, Coffee,
  Flower2, Palette, Brush, Scissors, Sparkle, Moon, Sun, Share2,
  Trophy, Target, Rocket, Medal, Flame, PartyPopper
} from 'lucide-react'
import { FaHistory, FaWhatsapp, FaStar, FaGem, FaCrown, FaGift, FaShareAlt } from 'react-icons/fa'
import Link from 'next/link'
import Image from 'next/image'
import InsigniasLogros from '@/components/InsigniasLogros'
import InstagramFeed from '@/components/InstagramFeed'
import QRReferido from '@/components/QRReferido'
import RuedaSuerte from '@/components/RuedaSuerte'
import MisionesDiarias from '@/components/MisionesDiarias'
import PromocionesCliente from '@/components/PromocionesCliente'
import AnunciosCliente from '@/components/AnunciosCliente'
import FooterCliente from '@/components/FooterCliente'

// Definir tipos
interface Cita {
  id: string
  date: string
  time: string
  status: string
  service_id: string
  client_id: string
  professional_id?: string
  notes?: string
  services?: { name: string; price: number; duration: number }
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

interface MisionDiaria {
  id: string
  title: string
  description: string
  icon: string
  points: number
  progress: number
  target: number
  completed: boolean
}

export default function ClientDashboardIndex() {
  const { user, tenantId } = useAuth()
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
  const [misiones, setMisiones] = useState<MisionDiaria[]>([])
  const [showShareTooltip, setShowShareTooltip] = useState(false)
  const [copied, setCopied] = useState(false)

  const isDark = theme === 'dark'

  // Determinar momento del día
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setTimeOfDay('morning')
    else if (hour < 18) setTimeOfDay('afternoon')
    else setTimeOfDay('evening')
  }, [])

  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.email || !tenantId) {
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        // 1. OBTENER CLIENTE
        const { data: clienteData, error: clienteError } = await supabase
          .from('clients')
          .select('*')
          .eq('email', user.email)
          .eq('tenant_id', tenantId)
          .maybeSingle()

        if (clienteError) {
          console.error('Error cargando cliente:', clienteError)
        }

        if (clienteData) {
          setCliente(clienteData)
          setPuntos(clienteData.points || 0)
          setNombreCliente(clienteData.name || user.email?.split('@')[0] || 'Cliente')
          setGenero(clienteData.gender || 'female')
        } else {
          setNombreCliente(user.email?.split('@')[0] || 'Cliente')
        }

        // 2. OBTENER CITAS - CONSULTA MEJORADA
        if (clienteData?.id) {
          const { data: citasData, error: citasError } = await supabase
            .from('appointments')
            .select(`
              *,
              services:service_id (name, price, duration),
              professionals:professional_id (name, specialty)
            `)
            .eq('client_id', clienteData.id)
            .eq('tenant_id', tenantId)
            .order('date', { ascending: true })

          if (citasError) {
            console.error('Error cargando citas:', citasError)
          } else {
            setCitas(citasData || [])
            
            // Filtrar citas próximas (fecha >= hoy)
            const hoy = new Date()
            hoy.setHours(0, 0, 0, 0)
            
            const proximas = (citasData || [])
              .filter((c: any) => {
                const cDate = new Date(c.date)
                cDate.setHours(0, 0, 0, 0)
                return cDate >= hoy && c.status !== 'cancelled'
              })
              .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
            
            setCitasProximas(proximas)

            const servicios = new Set((citasData || []).map((c: any) => c.service_id))
            setServiciosUnicos(servicios.size)
          }
        }

        // 3. OBTENER REFERIDOS
        if (clienteData?.id) {
          const { data: referidosData, error: referidosError } = await supabase
            .from('clients')
            .select('id, name, email, created_at')
            .eq('referred_by_id', clienteData.id)
            .eq('tenant_id', tenantId)

          if (!referidosError) {
            setReferidos(referidosData || [])
          }
        }

        // 4. OBTENER GALERÍA
        if (clienteData?.id) {
          const { data: galeriaData, error: galeriaError } = await supabase
            .from('client_gallery')
            .select('*')
            .eq('client_id', clienteData.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(6)

          if (!galeriaError) {
            setGaleria(galeriaData || [])
          }
        }

        // 5. CARGAR MISIONES DIARIAS
        await cargarMisiones(clienteData?.id)

      } catch (error) {
        console.error('Error cargando datos del dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user, tenantId])

  // Función para cargar misiones diarias
  const cargarMisiones = async (clientId?: string) => {
    // Misiones predefinidas
    const misionesBase: MisionDiaria[] = [
      {
        id: '1',
        title: 'Visita Fresh Nails',
        description: 'Agenda una cita hoy',
        icon: 'Calendar',
        points: 50,
        progress: citasProximas.length > 0 ? 1 : 0,
        target: 1,
        completed: citasProximas.length > 0
      },
      {
        id: '2',
        title: 'Comparte tu experiencia',
        description: 'Comparte en redes sociales',
        icon: 'Share2',
        points: 30,
        progress: 0,
        target: 1,
        completed: false
      },
      {
        id: '3',
        title: 'Invita a un amigo',
        description: 'Comparte tu código de referido',
        icon: 'Users',
        points: 100,
        progress: referidos.length,
        target: 1,
        completed: referidos.length > 0
      },
      {
        id: '4',
        title: 'Completa tu perfil',
        description: 'Añade tu foto y datos',
        icon: 'User',
        points: 20,
        progress: cliente?.avatar_url ? 1 : 0,
        target: 1,
        completed: !!cliente?.avatar_url
      }
    ]

    // Si hay un cliente ID, verificar misiones completadas desde la BD
    if (clientId) {
      try {
        const { data: misionesCompletadas } = await supabase
          .from('client_missions')
          .select('mission_id')
          .eq('client_id', clientId)
          .eq('completed', true)
          .gte('completed_at', new Date().toISOString().split('T')[0])

        const completadasIds = new Set(misionesCompletadas?.map(m => m.mission_id) || [])
        
        misionesBase.forEach(m => {
          if (completadasIds.has(m.id)) {
            m.completed = true
            m.progress = m.target
          }
        })
      } catch (error) {
        console.error('Error cargando misiones completadas:', error)
      }
    }

    setMisiones(misionesBase)
  }

  const handlePuntosGanados = async (puntosGanados: number) => {
    setPuntos(prev => prev + puntosGanados)
    try {
      if (!user?.email || !tenantId) return
      await supabase.rpc('increment_client_points', {
        target_email: user.email,
        target_tenant: tenantId,
        amount: puntosGanados
      })
    } catch (err) {
      console.error('Error sincronizando puntos:', err)
    }
  }

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

  // Compartir por WhatsApp
  const compartirWhatsApp = () => {
    const mensaje = `✨ ¡Hola! Te invito a conocer Fresh Nails Atelier, el mejor lugar para el cuidado de tus uñas y belleza.
    
🎁 Usa mi código de referido: ${cliente?.referral_code || 'FRESH_MEMBER'}
🎟️ Gana puntos y descuentos exclusivos.

📍 Visítanos y vive una experiencia única.
¡Te esperamos! 💅✨`

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  // Compartir en redes sociales
  const compartirRedes = (red: string) => {
    const texto = `✨ ¡Descubre Fresh Nails Atelier! 🎁 Usa mi código: ${cliente?.referral_code || 'FRESH_MEMBER'} y obtén beneficios exclusivos. 💅✨`
    const url = window.location.origin
    
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(texto)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`,
      instagram: `https://www.instagram.com/freshnails/`,
    }
    
    window.open(urls[red as keyof typeof urls], '_blank')
  }

  // Copiar código
  const copiarCodigo = async () => {
    const codigo = cliente?.referral_code || 'FRESH_MEMBER'
    try {
      await navigator.clipboard.writeText(codigo)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Error al copiar:', err)
    }
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

      {/* ============================================================ */}
      {/* HERO - BIENVENIDA ESPECTACULAR */}
      {/* ============================================================ */}
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
          
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-full animate-float ${
                isDark ? 'bg-rose-400/10' : 'bg-rose-400/5'
              }`}
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                top: `${10 + Math.random() * 80}%`,
                left: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 10}s`,
              }}
            />
          ))}
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
                  className="relative flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-rose-600 to-amber-500 text-white font-medium rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-rose-500/30 group-hover:scale-[1.02]"
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

      {/* ============================================================ */}
      {/* ANUNCIOS Y PROMOCIONES */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnunciosCliente />
        <PromocionesCliente />
      </div>

      {/* ============================================================ */}
      {/* TURNOS AGENDADOS - MEJORADO CON DATOS DE BD */}
      {/* ============================================================ */}
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
                const esManana = new Date(fecha)
                esManana.setDate(esManana.getDate() - 1)
                const esMananaDate = esManana.toDateString() === hoy.toDateString()
                
                let fechaLabel = format(fecha, "d MMM", { locale: es })
                if (esHoy) fechaLabel = 'Hoy'
                else if (esMananaDate) fechaLabel = 'Mañana'
                
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
                        <Scissors className="w-4 h-4 text-rose-500" />
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
                          {cita.professionals?.name && (
                            <p className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                              <User className="w-3 h-3" />
                              {cita.professionals.name}
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

      {/* ============================================================ */}
      {/* MISIONES DIARIAS - VERSIÓN MEJORADA */}
      {/* ============================================================ */}
      <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
        isDark 
          ? 'bg-[#141211] border-stone-800/50 shadow-xl shadow-black/30' 
          : 'bg-white border-stone-200/80 shadow-xl shadow-stone-200/30'
      }`}>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl" />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-2xl ${
              isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
            }`}>
              <Trophy className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className={`text-xl font-light ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                Misiones <span className="font-serif italic text-emerald-500">Diarias</span>
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                Completa misiones y gana puntos extras
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {misiones.map((mision, index) => {
              const IconComponent = {
                Calendar: Calendar,
                Share2: Share2,
                Users: Users,
                User: User
              }[mision.icon] || Star

              const porcentaje = Math.min((mision.progress / mision.target) * 100, 100)
              
              return (
                <div
                  key={mision.id}
                  className={`relative p-4 rounded-2xl border transition-all duration-300 ${
                    mision.completed
                      ? isDark 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-emerald-50 border-emerald-200'
                      : isDark 
                        ? 'bg-stone-900/30 border-stone-800/50 hover:border-stone-700' 
                        : 'bg-stone-50/50 border-stone-200/80 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        mision.completed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isDark 
                            ? 'bg-stone-800/50 text-stone-400' 
                            : 'bg-stone-100 text-stone-500'
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-medium ${
                          mision.completed 
                            ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                            : isDark ? 'text-stone-200' : 'text-stone-800'
                        }`}>
                          {mision.title}
                        </h4>
                        <p className={`text-[10px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                          {mision.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-3 h-3 text-amber-400" />
                      <span className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                        +{mision.points}
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[9px] text-stone-500 mb-1">
                      <span>{mision.completed ? '✅ Completada' : `${mision.progress}/${mision.target}`}</span>
                      <span>{Math.round(porcentaje)}%</span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${
                      isDark ? 'bg-stone-800' : 'bg-stone-200'
                    }`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          mision.completed 
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                            : 'bg-gradient-to-r from-rose-500 to-amber-500'
                        }`}
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>

                  {mision.completed && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PROGRAMA DE INVITACIÓN - MEJORADO CON WHATSAPP */}
      {/* ============================================================ */}
      <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
        isDark 
          ? 'bg-[#141211] border-stone-800/50 shadow-xl shadow-black/30' 
          : 'bg-white border-stone-200/80 shadow-xl shadow-stone-200/30'
      }`}>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/5 rounded-full blur-2xl" />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-2xl ${
              isDark ? 'bg-purple-500/10' : 'bg-purple-50'
            }`}>
              <Gift className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className={`text-xl font-light ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                Programa de <span className="font-serif italic text-purple-500">Invitación</span>
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                Invita a tus amigos y gana puntos por cada referido
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Código de referido */}
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-stone-900/30 border-stone-800/50' : 'bg-stone-50/50 border-stone-200/80'
            }`}>
              <p className={`text-[10px] uppercase tracking-wider font-medium ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                Tu código de referido
              </p>
              <div className="flex items-center gap-3 mt-2">
                <code className={`flex-1 text-center text-2xl font-mono font-bold tracking-wider ${
                  isDark ? 'text-purple-400' : 'text-purple-600'
                }`}>
                  {cliente?.referral_code || 'FRESH_MEMBER'}
                </code>
                <button
                  onClick={copiarCodigo}
                  className={`p-2 rounded-xl transition-all ${
                    copied
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isDark 
                        ? 'bg-stone-800 hover:bg-stone-700 text-stone-400' 
                        : 'bg-stone-200 hover:bg-stone-300 text-stone-600'
                  }`}
                  title="Copiar código"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>
              {copied && (
                <p className="text-[10px] text-emerald-500 mt-1 animate-pulse">
                  ¡Código copiado! ✅
                </p>
              )}
            </div>

            {/* Botones de compartir */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* WhatsApp */}
              <button
                onClick={compartirWhatsApp}
                className={`group flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                  isDark 
                    ? 'bg-[#25D366]/10 border-[#25D366]/30 hover:bg-[#25D366]/20' 
                    : 'bg-[#25D366]/5 border-[#25D366]/20 hover:bg-[#25D366]/10'
                }`}
              >
                <FaWhatsapp className="w-6 h-6 text-[#25D366]" />
                <span className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                  WhatsApp
                </span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => compartirRedes('facebook')}
                className={`group flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                  isDark 
                    ? 'bg-[#1877F2]/10 border-[#1877F2]/30 hover:bg-[#1877F2]/20' 
                    : 'bg-[#1877F2]/5 border-[#1877F2]/20 hover:bg-[#1877F2]/10'
                }`}
              >
                <svg className="w-6 h-6 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                  Facebook
                </span>
              </button>

              {/* Instagram */}
              <button
                onClick={() => compartirRedes('instagram')}
                className={`group flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                  isDark 
                    ? 'bg-[#E4405F]/10 border-[#E4405F]/30 hover:bg-[#E4405F]/20' 
                    : 'bg-[#E4405F]/5 border-[#E4405F]/20 hover:bg-[#E4405F]/10'
                }`}
              >
                <Instagram className="w-6 h-6 text-[#E4405F]" />
                <span className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                  Instagram
                </span>
              </button>
            </div>
          </div>

          {/* Estadísticas de referidos */}
          <div className={`mt-6 p-4 rounded-2xl border ${
            isDark ? 'bg-stone-900/20 border-stone-800/50' : 'bg-stone-50/50 border-stone-200/80'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-500" />
                <div>
                  <p className={`text-sm ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                    <span className="font-bold text-purple-500">{referidos.length}</span> amigos referidos
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                    {referidos.length > 0 
                      ? '¡Sigue compartiendo y gana más puntos!' 
                      : 'Comparte tu código y comienza a ganar puntos'}
                  </p>
                </div>
              </div>
              {referidos.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    +{referidos.length * 100} puntos ganados
                  </span>
                  <PartyPopper className="w-4 h-4 text-amber-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* QR REFERIDO */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl border transition-all duration-300">
        <QRReferido codigo={cliente?.referral_code || "FRESH_MEMBER"} user={user} />
      </div>

      {/* ============================================================ */}
      {/* INSIGNIAS Y LOGROS */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl border transition-all duration-300">
        <InsigniasLogros 
          citas={citas.length}
          serviciosUnicos={serviciosUnicos}
          referidos={referidos.length}
          puntos={puntos}
          racha={3}
        />
      </div>

      {/* ============================================================ */}
      {/* RUEDA DE LA SUERTE */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl border transition-all duration-300">
        <RuedaSuerte onPuntosGanados={handlePuntosGanados} />
      </div>

      {/* ============================================================ */}
      {/* GALERÍA */}
      {/* ============================================================ */}
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

      {/* ============================================================ */}
      {/* INSTAGRAM FEED */}
      {/* ============================================================ */}
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

      {/* ============================================================ */}
      {/* FOOTER */}
      {/* ============================================================ */}
      <FooterCliente />

      {/* ============================================================ */}
      {/* ANIMACIONES GLOBALES */}
      {/* ============================================================ */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .animate-float {
          animation: float linear infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}