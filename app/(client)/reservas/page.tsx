'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function MisReservasPremium() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [citas, setCitas] = useState<any[]>([])
  const [nombreCliente, setNombreCliente] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarCitasAutomatico = async () => {
      if (!user) {
        setLoading(false)
        setError('Inicia sesión para ver tus reservas')
        return
      }

      setLoading(true)
      setError(null)

      console.log('🔍 Usuario autenticado:', user.email)

      // Buscar cliente por email
      let clienteId = null

      const { data: cliente, error: clienteError } = await supabase
        .from('clients')
        .select('id, name, phone, email')
        .eq('email', user.email)
        .maybeSingle()

      if (clienteError) {
        console.error('❌ Error buscando cliente:', clienteError)
      }

      if (cliente) {
        clienteId = cliente.id
        setNombreCliente(cliente.name || '')
        console.log('✅ Cliente encontrado:', cliente)
      }

      // Si no se encontró por email, intentar por localStorage
      if (!clienteId) {
        const telGuardado = localStorage.getItem('cliente_telefono')
        if (telGuardado) {
          const { data: clientePorTel } = await supabase
            .from('clients')
            .select('id, name')
            .eq('phone', telGuardado)
            .maybeSingle()
          
          if (clientePorTel) {
            clienteId = clientePorTel.id
            setNombreCliente(clientePorTel.name || '')
            console.log('✅ Cliente encontrado por teléfono:', clientePorTel)
          }
        }
      }

      if (!clienteId) {
        setLoading(false)
        setError('No se encontró tu perfil de cliente')
        return
      }

      // ✅ Cargar citas - SIN LA RELACIÓN CON staff
      try {
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            *,
            clients:client_id (id, name, phone, email),
            services:service_id (id, name, price, duration)
          `)
          .eq('client_id', clienteId)
          .order('date', { ascending: true })

        if (appointmentsError) {
          console.error('❌ Error cargando citas:', appointmentsError)
          throw appointmentsError
        }

        console.log('📋 Citas encontradas:', appointmentsData?.length || 0)

        // ✅ Si quieres mostrar el nombre del staff, cárgalo por separado
        if (appointmentsData && appointmentsData.length > 0) {
          // Obtener los staff IDs
          const staffIds = appointmentsData
            .map(c => c.professional_id)
            .filter(id => id)

          let staffMap: Record<string, any> = {}
          if (staffIds.length > 0) {
            const { data: staffData } = await supabase
              .from('staff')
              .select('id, name')
              .in('id', staffIds)

            if (staffData) {
              staffMap = staffData.reduce((acc, s) => ({ ...acc, [s.id]: s }), {})
            }
          }

          // Combinar los datos
          const citasConStaff = appointmentsData.map(cita => ({
            ...cita,
            staff: cita.professional_id ? staffMap[cita.professional_id] : null
          }))

          setCitas(citasConStaff)
        } else {
          setError('No tienes reservas registradas')
        }

      } catch (err) {
        console.error('❌ Error cargando reservas:', err)
        setError('Error al cargar las reservas')
      } finally {
        setLoading(false)
      }
    }

    cargarCitasAutomatico()
  }, [user])

  const renderBadge = (status: string) => {
    const base = "text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border"
    switch (status) {
      case 'confirmed':
        return <span className={`${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>Confirmado</span>
      case 'pending':
        return <span className={`${base} bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse`}>Por Confirmar</span>
      case 'cancelled':
        return <span className={`${base} bg-rose-500/10 text-rose-400 border-rose-500/20`}>Cancelado</span>
      default:
        return <span className={`${base} bg-stone-800 text-stone-400 border-stone-700`}>Finalizado</span>
    }
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 text-stone-200 selection:bg-amber-500 selection:text-black relative">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[150px] bg-gradient-to-b from-amber-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10">
        
        <div className="mb-8 text-left border-b border-stone-800/60 pb-5">
          <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase font-bold">Panel de Cliente</span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            {nombreCliente ? `Tus Reservas, ${nombreCliente.split(' ')[0]}` : 'Mis Reservas'}
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            {user?.email ? `Usuario: ${user.email}` : 'Inicia sesión para ver tus reservas'}
          </p>
          {error && (
            <p className="text-xs text-amber-500 mt-2 font-mono">{error}</p>
          )}
        </div>

        {citas.length === 0 ? (
          <div className="border border-dashed border-stone-800 rounded-2xl p-8 text-center bg-[#141211]/30 backdrop-blur-md">
            <p className="text-xs text-stone-500 font-mono">
              {error || 'No tienes ninguna reserva registrada.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {citas.map((cita) => {
              const fechaObjeto = new Date(cita.date.replace(/-/g, '\/'))
              const fechaLinda = format(fechaObjeto, "EEEE d 'de' MMMM", { locale: es })

              return (
                <div 
                  key={cita.id} 
                  className="group relative bg-[#141211]/60 backdrop-blur-sm border border-stone-800/80 hover:border-stone-700/80 rounded-2xl p-5 transition-all duration-300 shadow-md hover:shadow-amber-500/[0.01]"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-amber-400 transition-colors">
                        {cita.services?.name || 'Servicio Especial'}
                      </h3>
                      <p className="text-[11px] text-stone-400 font-mono">
                        Profesional: <span className="text-stone-300 font-sans">{cita.staff?.name || 'Especialista asignado'}</span>
                      </p>
                    </div>
                    <div>
                      {renderBadge(cita.status)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-3 border-t border-stone-800/40 text-xs">
                    <div className="flex items-center gap-2 text-stone-400">
                      <svg className="w-3.5 h-3.5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="capitalize text-stone-300">{fechaLinda}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 font-mono text-[11px] bg-[#1c1a19] border border-stone-800 px-2.5 py-1 rounded-lg text-amber-400">
                      <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse inline-block" />
                      {cita.time.slice(0, 5)} HS
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
      </div>
    </div>
  )
}