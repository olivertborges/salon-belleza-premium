'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import { Calendar, Camera, Sparkles, User, Award, Clock, MapPin, Instagram } from 'lucide-react'
import { FaHistory, FaWhatsapp, FaStar, FaGem } from 'react-icons/fa'
import Link from 'next/link'
import InsigniasLogros from '@/components/InsigniasLogros'
import InstagramFeed from '@/components/InstagramFeed'
import QRReferido from '@/components/QRReferido'
import RuedaSuerte from '@/components/RuedaSuerte'
import MisionesDiarias from '@/components/MisionesDiarias'
import AgendarCita from '@/components/AgendarCita'
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

  const isDark = theme === 'dark'

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

        // 2. OBTENER CITAS
        if (clienteData?.id) {
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
            setCitas(citasData || [])
            
            // Filtrar próximas
            const hoy = new Date()
            const proximas = (citasData || []).filter((c: any) => {
              const cDate = new Date(c.date)
              return cDate >= hoy
            }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
            setCitasProximas(proximas)

            // Servicios únicos
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

      } catch (error) {
        console.error('Error cargando datos del dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user, tenantId])

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

  // Determinar saludo según género
  const getSaludo = () => {
    if (genero === 'male') return 'Bienvenido'
    if (genero === 'female') return 'Bienvenida'
    return 'Bienvenid@'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-10 selection:bg-rose-500/20 antialiased max-w-7xl mx-auto w-full transition-colors duration-300">

      {/* SECCIÓN HERO / BIENVENIDA */}
      <div className={`relative p-6 sm:p-8 rounded-3xl border overflow-hidden group transition-all duration-300 shadow-xl ${
        isDark 
          ? 'bg-gradient-to-br from-[#161311] via-[#120f0e] to-[#0a0908] border-stone-850 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' 
          : 'bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 border-stone-200'
      }`}>
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-rose-900/10 rounded-full filter blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-400/20 px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-rose-400" />
              <p className="text-[10px] uppercase tracking-widest text-rose-400 font-bold">Salón & Centro de Estética</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-extralight tracking-tight text-stone-100 leading-tight">
              {getSaludo()}, <span className="font-serif italic font-normal text-rose-300">{nombreCliente}</span>
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm max-w-md font-light leading-relaxed opacity-90">
              Técnicas avanzadas en uñas, micropigmentación, microblading y estilismo capilar de vanguardia. Tu espacio privado en Fresh Nails.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400">
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                {puntos} puntos
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-400" />
                {citas.length} citas
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-400" />
                {referidos.length} referidos
              </span>
            </div>
          </div>
          <div className="w-full sm:w-auto shrink-0 transform hover:scale-[1.01] transition-transform">
            <AgendarCita />
          </div>
        </div>
      </div>

      <AnunciosCliente />
      <PromocionesCliente />

      {/* TURNOS AGENDADOS */}
      <div className={`border rounded-3xl p-6 sm:p-8 transition-all duration-300 shadow-md ${
        isDark 
          ? 'bg-[#141211] border-stone-850 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' 
          : 'bg-white border-stone-200'
      }`}>
        <div className={`flex items-center gap-4 mb-6 border-b pb-4 ${
          isDark ? 'border-stone-900' : 'border-stone-100'
        }`}>
          <Calendar className="text-rose-500 dark:text-rose-400 w-5 h-5" />
          <div>
            <h2 className={`text-lg font-extralight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
              Próximos <span className="font-serif italic text-rose-600 dark:text-rose-300">Turnos Agendados</span>
            </h2>
            <p className={`text-[10px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              {citasProximas.length} citas programadas
            </p>
          </div>
        </div>

        {citasProximas.length === 0 ? (
          <div className={`text-center py-8 border border-dashed rounded-2xl ${
            isDark ? 'border-stone-800 bg-stone-950/10' : 'border-stone-200 bg-stone-50/50'
          }`}>
            <p className="text-stone-400 dark:text-stone-500 text-xs font-light">No tienes sesiones programadas próximamente.</p>
            <Link href="/reservas" className="inline-block mt-3 text-xs text-rose-500 hover:text-rose-400 transition-colors">
              Agendar una cita →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {citasProximas.slice(0, 3).map((cita: any) => (
              <div key={cita.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-2xl ${
                isDark ? 'bg-stone-900/40 border-stone-850' : 'bg-stone-50 border-stone-200'
              }`}>
                <div className="space-y-0.5">
                  <h4 className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                    {cita.services?.name || 'Servicio Registrado'}
                  </h4>
                  <p className={`text-[11px] flex items-center gap-2 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                    <FaHistory className="text-[10px]" /> {cita.date} — {cita.time} hs
                  </p>
                  {cita.professional_id && (
                    <p className="text-[10px] text-stone-500 flex items-center gap-1">
                      <User className="w-3 h-3" /> Profesional asignado
                    </p>
                  )}
                </div>
                <div className="mt-2 sm:mt-0 flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    cita.status === 'confirmed' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : cita.status === 'cancelled'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {cita.status === 'confirmed' ? 'Confirmada' : 
                     cita.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                  </span>
                  <Link href={`/reservas/${cita.id}`} className="text-[9px] text-rose-400 hover:text-rose-300 transition-colors">
                    Ver
                  </Link>
                </div>
              </div>
            ))}
            {citasProximas.length > 3 && (
              <Link href="/reservas" className="block text-center text-xs text-rose-500 hover:text-rose-400 transition-colors py-2">
                Ver todas las citas ({citasProximas.length})
              </Link>
            )}
          </div>
        )}
      </div>

      <MisionesDiarias />
      <QRReferido codigo={cliente?.referral_code || "FRESH_MEMBER"} user={user} />

      <InsigniasLogros 
        citas={citas.length}
        serviciosUnicos={serviciosUnicos}
        referidos={referidos.length}
        puntos={puntos}
        racha={3}
      />

      <RuedaSuerte onPuntosGanados={handlePuntosGanados} />

      {/* GALERÍA - FOTOS REALES DEL CLIENTE */}
      <div className={`border rounded-3xl p-6 sm:p-8 transition-all duration-300 shadow-md ${
        isDark 
          ? 'bg-[#141211] border-stone-850 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' 
          : 'bg-white border-stone-200'
      }`}>
        <div className="flex items-center justify-between mb-6 border-b pb-4 border-stone-900/50">
          <div className="flex items-center gap-4">
            <Camera className="text-rose-500 dark:text-rose-400 w-5 h-5" />
            <div>
              <h2 className={`text-lg font-extralight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                Tu Galería <span className="font-serif italic text-rose-600 dark:text-rose-300">Fresh Nails</span>
              </h2>
              <p className={`text-[10px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                {galeria.length} imágenes guardadas
              </p>
            </div>
          </div>
          {galeria.length > 0 && (
            <Link href="/galeria" className="text-[10px] text-rose-500 hover:text-rose-400 transition-colors">
              Ver todas →
            </Link>
          )}
        </div>

        {galeria.length === 0 ? (
          <div className={`text-center py-8 border border-dashed rounded-2xl ${
            isDark ? 'border-stone-800 bg-stone-950/10' : 'border-stone-200 bg-stone-50/50'
          }`}>
            <p className="text-stone-400 dark:text-stone-500 text-xs font-light">Aún no tienes fotos en tu galería.</p>
            <p className="text-[10px] text-stone-500 mt-1">Sube tus mejores trabajos para compartir.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {galeria.slice(0, 6).map((img) => (
              <div key={img.id} className="aspect-square border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900 group relative">
                {img.image_url ? (
                  <img 
                    src={img.image_url} 
                    alt={img.title || 'Foto de galería'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                    <div className="text-center">
                      <Camera className="w-6 h-6 mx-auto mb-1 opacity-30" />
                      <span className="text-[8px]">{img.title || 'Foto'}</span>
                    </div>
                  </div>
                )}
                {img.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-[8px] truncate">{img.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INSTAGRAM FEED - PUBLICACIONES REALES */}
      <div className={`border rounded-3xl p-6 sm:p-8 transition-all duration-300 shadow-md ${
        isDark 
          ? 'bg-[#141211] border-stone-850 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' 
          : 'bg-white border-stone-200'
      }`}>
        <div className="flex items-center gap-4 mb-6 border-b pb-4 border-stone-900/50">
          <Instagram className="text-pink-500 w-5 h-5" />
          <div>
            <h2 className={`text-lg font-extralight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
              Instagram <span className="font-serif italic text-pink-600 dark:text-pink-400">@freshnails</span>
            </h2>
            <p className={`text-[10px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              Últimas publicaciones
            </p>
          </div>
        </div>
        <InstagramFeed />
      </div>

      <FooterCliente />

    </div>
  )
}