'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/config/supabase'
import { Calendar, Camera, Sparkles } from 'lucide-react'
import { FaHistory } from 'react-icons/fa'
import InsigniasLogros from '@/components/InsigniasLogros'
import InstagramFeed from '@/components/InstagramFeed'
import QRReferido from '@/components/QRReferido'
import RuedaSuerte from '@/components/RuedaSuerte'
import MisionesDiarias from '@/components/MisionesDiarias'
import AgendarCita from '@/components/AgendarCita'
import PromocionesCliente from '@/components/PromocionesCliente'
import AnunciosCliente from '@/components/AnunciosCliente'
import FooterCliente from '@/components/FooterCliente'

export default function ClientDashboardIndex() {
  const { user, tenantId } = useAuth()
  const { theme } = useTheme()
  const [citas, setCitas] = useState([])
  const [puntos, setPuntos] = useState(0)
  const [referidos, setReferidos] = useState([])
  const [loading, setLoading] = useState(true)

  const isDark = theme === 'dark'

  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.email || !tenantId) {
        setLoading(false)
        return
      }

      try {
        const clientAnonym: any = supabase
        const { data: cliente } = await clientAnonym
          .from('clients')
          .select('id, points, referral_code')
          .eq('email', user.email)
          .eq('tenant_id', tenantId)
          .maybeSingle()

        if (cliente) {
          setPuntos(cliente.points || 0)

          const [appointmentsRes, referresRes] = await Promise.allSettled([
            clientAnonym
              .from('appointments')
              .select('*')
              .eq('client_id', cliente.id)
              .eq('tenant_id', tenantId)
              .order('date', { ascending: true }),
            clientAnonym
              .from('clients')
              .select('id')
              .eq('referred_by_id', cliente.id)
              .eq('tenant_id', tenantId)
          ])

          if (appointmentsRes.status === 'fulfilled' && appointmentsRes.value.data) {
            setCitas(appointmentsRes.value.data)
          }
          if (referresRes.status === 'fulfilled' && referresRes.value.data) {
            setReferidos(referresRes.value.data)
          }
        }
      } catch (error) {
        console.error('Error cargando ecosistema del cliente:', error)
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [user, tenantId])

  const citasProximas = citas.filter((c: any) => c.date && new Date(c.date) >= new Date()).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const codigoReferido = user?.codigoReferido || "FRESH_MEMBER"
  const serviciosUnicos = [...new Set(citas.map((c: any) => c.service_id || c.serviceId || ''))].filter(Boolean).length

  const handlePuntosGanados = async (puntosGanados: number) => {
    setPuntos(prev => prev + puntosGanados)
    try {
      if (!user?.email || !tenantId) return
      const clientAnonym: any = supabase
      await clientAnonym.rpc('increment_client_points', {
        target_email: user.email,
        target_tenant: tenantId,
        amount: puntosGanados
      })
    } catch (err) {
      console.error('Error sincronizando puntos:', err)
    }
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
              Bienvenida, <span className="font-serif italic font-normal text-rose-300">Chérie</span>
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm max-w-md font-light leading-relaxed opacity-90">
              Técnicas avanzadas en uñas, micropigmentación, microblading y estilismo capilar de vanguardia. Tu espacio privado en Fresh Nails.
            </p>
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
           </div>
        </div>

        {citasProximas.length === 0 ? (
          <div className={`text-center py-8 border border-dashed rounded-2xl ${
            isDark ? 'border-stone-800 bg-stone-950/10' : 'border-stone-200 bg-stone-50/50'
          }`}>
             <p className="text-stone-400 dark:text-stone-500 text-xs font-light">No tienes sesiones programadas próximamente.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {citasProximas.slice(0, 3).map((cita: any) => (
              <div key={cita.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-2xl ${
                isDark ? 'bg-stone-900/40 border-stone-850' : 'bg-stone-50 border-stone-200'
              }`}>
                <div className="space-y-0.5">
                  <h4 className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>Servicio Registrado</h4>
                  <p className={`text-[11px] flex items-center gap-2 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                    <FaHistory className="text-[10px]" /> {cita.date} — {cita.time} hs
                  </p>
                </div>
                <div className="mt-2 sm:mt-0 px-3 py-1 rounded-full bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider">
                  {cita.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MisionesDiarias />
      <QRReferido codigo={codigoReferido} user={user} />

      <InsigniasLogros 
        citas={citas.length}
        serviciosUnicos={serviciosUnicos}
        referidos={referidos.length}
        puntos={puntos}
        racha={3}
      />

      <RuedaSuerte onPuntosGanados={handlePuntosGanados} />

      {/* GALERÍA */}
      <div className={`border rounded-3xl p-6 sm:p-8 transition-all duration-300 shadow-md ${
        isDark 
          ? 'bg-[#141211] border-stone-850 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' 
          : 'bg-white border-stone-200'
      }`}>
         <div className="flex items-center gap-4 mb-6">
            <Camera className="text-rose-500 dark:text-rose-400 w-5 h-5" />
            <h2 className={`text-lg font-extralight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
              Tu Galería <span className="font-serif italic text-rose-600 dark:text-rose-300">Fresh Nails</span>
            </h2>
         </div>
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="aspect-square border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900">
               <div className="w-full h-full bg-rose-500/10 flex items-center justify-center text-stone-400">Fresh Pic 1</div>
            </div>
            <div className="aspect-square border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900">
               <div className="w-full h-full bg-rose-500/10 flex items-center justify-center text-stone-400">Fresh Pic 2</div>
            </div>
            <div className="aspect-square border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900">
               <div className="w-full h-full bg-rose-500/10 flex items-center justify-center text-stone-400">Fresh Pic 3</div>
            </div>
            <div className="aspect-square border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900">
               <div className="w-full h-full bg-rose-500/10 flex items-center justify-center text-stone-400">Fresh Pic 4</div>
            </div>
            <div className="aspect-square border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900">
               <div className="w-full h-full bg-rose-500/10 flex items-center justify-center text-stone-400">Fresh Pic 5</div>
            </div>
            <div className="aspect-square border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900">
               <div className="w-full h-full bg-rose-500/10 flex items-center justify-center text-stone-400">Fresh Pic 6</div>
            </div>
         </div>
      </div>

      <InstagramFeed />
      <FooterCliente />

    </div>
  )
}
