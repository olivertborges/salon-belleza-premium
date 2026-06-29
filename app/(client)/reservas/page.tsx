'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Calendar, 
  Clock, 
  User, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2,
  HelpCircle,
  XCircle,
  ArrowUpRight
} from 'lucide-react'

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
        setError('Inicia sesión para visualizar tus próximas citas')
        return
      }

      setLoading(true)
      setError(null)

      let clienteId = null

      const { data: cliente, error: clienteError } = await supabase
        .from('clients')
        .select('id, name, phone, email')
        .eq('email', user.email)
        .maybeSingle()

      if (clienteError) console.error('❌ Error buscando cliente:', clienteError)

      if (cliente) {
        clienteId = cliente.id
        setNombreCliente(cliente.name || '')
      }

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
          }
        }
      }

      if (!clienteId) {
        setLoading(false)
        setError('No logramos localizar tu registro de perfil único')
        return
      }

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

        if (appointmentsError) throw appointmentsError

        if (appointmentsData && appointmentsData.length > 0) {
          const staffIds = appointmentsData.map(c => c.professional_id).filter(id => id)

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

          const citasConStaff = appointmentsData.map(cita => ({
            ...cita,
            staff: cita.professional_id ? staffMap[cita.professional_id] : null
          }))

          setCitas(citasConStaff)
        } else {
          setError('No posees ninguna reserva agendada en este momento')
        }

      } catch (err) {
        console.error('❌ Error cargando reservas:', err)
        setError('Error de comunicación con el servidor al cargar reservas')
      } finally {
        setLoading(false)
      }
    }

    cargarCitasAutomatico()
  }, [user])

  const renderBadge = (status: string) => {
    const base = "inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm transition-all duration-300"
    switch (status) {
      case 'confirmed':
        return (
          <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 dark:shadow-[0_0_12px_rgba(16,185,129,0.1)]`}>
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Confirmado
          </span>
        )
      case 'pending':
        return (
          <span className={`${base} bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 animate-pulse dark:shadow-[0_0_12px_rgba(245,158,11,0.15)]`}>
            <Clock className="w-3 h-3 text-amber-400" /> Pendiente
          </span>
        )
      case 'cancelled':
        return (
          <span className={`${base} bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30`}>
            <XCircle className="w-3 h-3 text-rose-500" /> Cancelado
          </span>
        )
      default:
        return (
          <span className={`${base} bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800/80 dark:text-stone-400 dark:border-stone-700`}>
            <HelpCircle className="w-3 h-3" /> Finalizado
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[45vh] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <Sparkles className="w-4 h-4 text-amber-500 absolute animate-pulse" />
        </div>
        <p className="text-xs font-mono tracking-wide text-stone-500 dark:text-stone-400 animate-pulse">Sincronizando tus agendas premium...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 text-stone-800 dark:text-stone-200 antialiased selection:bg-amber-500/20 relative min-h-[60vh]">
      
      {/* Auroras de iluminación ambiental de fondo */}
      <div className="absolute top-[-10%] left-1/4 w-[300px] h-[300px] bg-amber-500/[0.03] dark:bg-amber-500/[0.04] rounded-full blur-[120px] pointer-events-none animate-float" />
      <div className="absolute bottom-[10%] right-1/4 w-[250px] h-[250px] bg-purple-500/[0.02] dark:bg-indigo-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 space-y-8">
        
        {/* Encabezado con animación de entrada suave */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-200 dark:border-stone-800/80 pb-6 gap-4 animate-fadeIn">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-amber-600 dark:text-amber-400 uppercase font-black bg-amber-500/5 dark:bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/10">
              <Sparkles className="w-3 h-3 text-amber-500 animate-spin-slow" /> Salón VIP
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight mt-1.5 bg-clip-text bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 dark:from-white dark:via-stone-200 dark:to-stone-400">
              {nombreCliente ? `Tus Reservas, ${nombreCliente.split(' ')[0]}` : 'Mis Reservas Premium'}
            </h1>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 font-mono tracking-wide">
              {user?.email ? `CLIENT_ID: ${user.email}` : 'Inicia sesión para sincronizar la app'}
            </p>
          </div>
          
          {error && !citas.length && (
            <div className="inline-flex items-center gap-2 bg-amber-500/[0.04] border border-amber-500/20 px-3 py-2 rounded-xl text-[11px] font-mono text-amber-700 dark:text-amber-400 backdrop-blur-md shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Listado Principal de Citas */}
        {citas.length === 0 ? (
          <div className="border border-dashed border-stone-200 dark:border-stone-800/80 rounded-2xl p-12 text-center bg-white/60 dark:bg-stone-900/20 backdrop-blur-md shadow-inner animate-fadeIn">
            <Calendar className="w-10 h-10 text-stone-300 dark:text-stone-700 mx-auto mb-3.5" />
            <p className="text-xs text-stone-400 dark:text-stone-500 font-mono max-w-sm mx-auto">
              {error || 'No registras ningún tratamiento o reserva asignada en tu historial próximo.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {citas.map((cita, index) => {
              const fechaObjeto = new Date(cita.date.replace(/-/g, '\/'))
              const fechaLinda = format(fechaObjeto, "EEEE d 'de' MMMM", { locale: es })

              return (
                <div 
                  key={cita.id} 
                  style={{ animationDelay: `${index * 80}ms` }}
                  className="group relative bg-white dark:bg-stone-900/40 backdrop-blur-md border border-stone-200/90 dark:border-stone-800/70 hover:border-amber-500/40 dark:hover:border-amber-500/30 rounded-2xl p-5 transition-all duration-500 hover:-translate-y-1 shadow-sm hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_20px_30px_-10px_rgba(0,0,0,0.7)] overflow-hidden animate-slideUp"
                >
                  {/* Resplandor interno de esquina interactivo al hacer Hover (Modo Oscuro) */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/[0.02] dark:bg-amber-500/[0.03] rounded-full blur-2xl group-hover:bg-amber-500/[0.08] transition-all duration-500 pointer-events-none" />

                  {/* Línea lateral decorativa de acento */}
                  <div className="absolute top-0 left-0 w-[4px] h-full bg-stone-100 dark:bg-stone-800/60 rounded-l-full group-hover:bg-amber-500 transition-all duration-500" />
                  
                  <div className="flex justify-between items-start gap-4 pl-1">
                    <div className="space-y-2">
                      <h3 className="text-sm font-black text-stone-900 dark:text-stone-100 tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                        {cita.services?.name || 'Servicio Especial Premium'}
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300 text-amber-500" />
                      </h3>
                      
                      <div className="inline-flex items-center gap-2 bg-stone-50 dark:bg-stone-950/50 border border-stone-200/60 dark:border-stone-800/60 px-2.5 py-1 rounded-xl text-[11px]">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-stone-400 dark:text-stone-500 font-medium">Especialista:</span>
                        <span className="font-bold text-stone-700 dark:text-stone-300">{cita.staff?.name || 'Por asignar'}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {renderBadge(cita.status)}
                    </div>
                  </div>

                  {/* Panel de Tiempos e Inserción de Fecha */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-100 dark:border-stone-800/60 text-xs pl-1">
                    <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                      <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-500/80" />
                      <span className="capitalize text-stone-800 dark:text-stone-200 font-bold tracking-tight">{fechaLinda}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px] bg-stone-900 text-white dark:bg-amber-500/10 border border-stone-950 dark:border-amber-500/20 px-3 py-1.5 rounded-xl text-amber-400 font-black shadow-md dark:shadow-none tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                      {cita.time.slice(0, 5)} HS
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* Estilos CSS Inyectados inline para soportar las animaciones sin romper configuraciones externas */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slideUp { animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
      `}</style>
    </div>
  )
}
