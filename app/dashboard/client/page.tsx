'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import MisionesDiarias from '@/components/MisionesDiarias'
import RachaDeVisitas from '@/components/RachaDeVisitas'
import AgendarCita from '@/components/AgendarCita'
import PromocionesCliente from '@/components/PromocionesCliente'
import AnunciosCliente from '@/components/AnunciosCliente'

export default function ClientDashboard() {
  const { user, tenantId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [puntos, setPuntos] = useState(0)
  const [citas, setCitas] = useState([])

  useEffect(() => {
    if (tenantId && user) {
      cargarDatos()
    }
  }, [tenantId, user])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      // Cargar citas
      const { data: citasData } = await supabase
        .from('appointments')
        .select(`
          *,
          services:service_id (name, price, duration)
        `)
        .eq('client_id', user.id)
        .eq('tenant_id', tenantId)
        .order('date', { ascending: true })

      if (citasData) setCitas(citasData)

      // Cargar puntos
      const { data: puntosData } = await supabase
        .from('clients')
        .select('points')
        .eq('id', user.id)
        .single()

      if (puntosData) setPuntos(puntosData.points || 0)

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-stone-400 text-xs font-mono">CARGANDO...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-stone-900 tracking-tight">
            Panel de Cliente
          </h1>
          <p className="text-sm text-stone-400 font-light">
            Bienvenido de vuelta, {user?.full_name || 'Usuario'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-stone-100 px-4 py-2 rounded-xl">
            <span className="text-xs text-stone-500 font-light">Puntos</span>
            <p className="text-xl font-bold text-stone-900">{puntos}</p>
          </div>
          <div className="bg-stone-100 px-4 py-2 rounded-xl">
            <span className="text-xs text-stone-500 font-light">Citas</span>
            <p className="text-xl font-bold text-stone-900">{citas.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AgendarCita onCitaAgendada={cargarDatos} />
        <RachaDeVisitas />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MisionesDiarias />
        <div className="space-y-6">
          <PromocionesCliente />
          <AnunciosCliente />
        </div>
      </div>
    </div>
  )
}
