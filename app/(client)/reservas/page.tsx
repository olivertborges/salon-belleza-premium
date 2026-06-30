'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
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
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
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
          <div className="relative">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-amber-500/20 rounded-full animate-ping"></div>
          </div>
          <Sparkles className="w-5 h-5 text-amber-500 absolute animate-pulse" />
        </div>
        <p className={`text-xs font-mono tracking-wide animate-pulse ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Sincronizando tus agendas premium...</p>
      </div>
    )
  }

  return (
    <div className={`w-full max-w-4xl mx-auto p-4 md:p-6 antialiased selection:bg-amber-500/20 relative min-h-[60vh] transition-colors duration-300 ${
      isDark ? 'text-stone-200' : 'text-stone-800'
    }`}>
      
      <div className={`absolute top-[-10%] left-1/4 w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none ${
        isDark ? 'bg-amber-500/[0.04]' : 'bg-amber-500/[0.03]'
      }`} />
      <div className={`absolute bottom-[10%] right-1/4 w-[250px] h-[250px] rounded-full blur-[100px] pointer-events-none ${
        isDark ? 'bg-indigo-500/[0.03]' : 'bg-purple-500/[0.02]'
      }`} />

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
        .stagger-children > * { animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
        .stagger-children > *:nth-child(2) { animation-delay: 0.10s; }
        .stagger-children > *:nth-child(3) { animation-delay: 0.15s; }
        .stagger-children > *:nth-child(4) { animation-delay: 0.20s; }
        .stagger-children > *:nth-child(5) { animation-delay: 0.25s; }
        .stagger-children > *:nth-child(6) { animation-delay: 0.30s; }
        .stagger-children > *:nth-child(7) { animation-delay: 0.35s; }
        .stagger-children > *:nth-child(8) { animation-delay: 0.40s; }
        .stagger-children > *:nth-child(9) { animation-delay: 0.45s; }
        .stagger-children > *:nth-child(10) { animation-delay: 0.50s; }
      `}</style>

      <div className="relative z-10 space-y-8">
        
        {/* ============================================================ */}
        {/* HEADER CORREGIDO CON CARD-GLOW Y TEXTO SHIMMER */}
        {/* ============================================================ */}
        <div className={`card-glow relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/[0.08] via-card to-card border border-amber-500/20 p-6 shadow-xl animate-fade-up ${
          isDark 
            ? 'bg-gradient-to-br from-amber-950/20 via-[#161311] to-[#0a0908]' 
            : 'bg-gradient-to-br from-amber-50/50 via-white to-stone-50'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className={`text-[10px] uppercase tracking-[0.3em] font-mono flex items-center gap-2 ${
                isDark ? 'text-amber-400' : 'text-amber-600'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                📅 Mis Reservas
              </p>
              <h2 className="text-2xl font-serif italic text-foreground mt-1">
                {nombreCliente ? `Reservas de ${nombreCliente.split(' ')[0]}` : 'Mis Reservas'}
                <span className="text-shimmer ml-2">Premium</span>
              </h2>
              <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {user?.email ? `Usuario: ${user.email}` : 'Inicia sesión para sincronizar la app'}
              </p>
            </div>
            
            {error && !citas.length && (
              <div className={`inline-flex items-center gap-2 border px-3 py-2 rounded-xl text-[11px] font-mono backdrop-blur-md shadow-sm ${
                isDark 
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                  : 'bg-amber-500/5 border-amber-500/20 text-amber-700'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* LISTADO DE CITAS */}
        {citas.length === 0 ? (
          <div className={`border border-dashed rounded-2xl p-12 text-center backdrop-blur-md shadow-inner animate-fadeIn ${
            isDark 
              ? 'border-stone-800/80 bg-stone-900/20' 
              : 'border-stone-200 bg-white/60'
          }`}>
            <Calendar className={`w-10 h-10 mx-auto mb-3.5 ${isDark ? 'text-stone-700' : 'text-stone-300'}`} />
            <p className={`text-xs font-mono max-w-sm mx-auto ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              {error || 'No registras ningún tratamiento o reserva asignada en tu historial próximo.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger-children">
            {citas.map((cita) => {
              const fechaObjeto = new Date(cita.date.replace(/-/g, '\/'))
              const fechaLinda = format(fechaObjeto, "EEEE d 'de' MMMM", { locale: es })

              return (
                <div 
                  key={cita.id} 
                  className={`card-glow group relative backdrop-blur-md border rounded-2xl p-5 transition-all duration-500 hover:-translate-y-1 shadow-sm hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.05)] overflow-hidden animate-slideUp ${
                    isDark 
                      ? 'bg-stone-900/40 border-stone-800/70 hover:border-amber-500/30 hover:shadow-[0_20px_30px_-10px_rgba(0,0,0,0.7)]' 
                      : 'bg-white border-stone-200/90 hover:border-amber-500/40 hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.05)]'
                  }`}
                >
                  <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl group-hover:bg-amber-500/[0.08] transition-all duration-500 pointer-events-none ${
                    isDark ? 'bg-amber-500/[0.03]' : 'bg-amber-500/[0.02]'
                  }`} />

                  <div className={`absolute top-0 left-0 w-[4px] h-full rounded-l-full transition-all duration-500 ${
                    isDark 
                      ? 'bg-stone-800/60 group-hover:bg-amber-500' 
                      : 'bg-stone-100 group-hover:bg-amber-500'
                  }`} />
                  
                  <div className="flex justify-between items-start gap-4 pl-1">
                    <div className="space-y-2">
                      <h3 className={`text-sm font-black tracking-tight transition-colors flex items-center gap-1.5 ${
                        isDark 
                          ? 'text-stone-100 group-hover:text-amber-400' 
                          : 'text-stone-900 group-hover:text-amber-600'
                      }`}>
                        {cita.services?.name || 'Servicio Especial Premium'}
                        <ArrowUpRight className={`w-3.5 h-3.5 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300 ${
                          isDark ? 'text-amber-400' : 'text-amber-500'
                        }`} />
                      </h3>
                      
                      <div className={`inline-flex items-center gap-2 border px-2.5 py-1 rounded-xl text-[11px] ${
                        isDark 
                          ? 'bg-stone-950/50 border-stone-800/60' 
                          : 'bg-stone-50 border-stone-200/60'
                      }`}>
                        <User className={`w-3.5 h-3.5 ${isDark ? 'text-stone-400' : 'text-stone-400'}`} />
                        <span className={`font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Especialista:</span>
                        <span className={`font-bold ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>{cita.staff?.name || 'Por asignar'}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {renderBadge(cita.status)}
                    </div>
                  </div>

                  <div className={`flex items-center justify-between mt-6 pt-4 border-t text-xs pl-1 ${
                    isDark ? 'border-stone-800/60' : 'border-stone-100'
                  }`}>
                    <div className={`flex items-center gap-2 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      <Calendar className={`w-4 h-4 ${isDark ? 'text-amber-500/80' : 'text-amber-600'}`} />
                      <span className={`capitalize font-bold tracking-tight ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{fechaLinda}</span>
                    </div>

                    <div className={`flex items-center gap-2 font-mono text-[11px] px-3 py-1.5 rounded-xl shadow-md dark:shadow-none tracking-wide ${
                      isDark 
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                        : 'bg-stone-900 text-white border-stone-950'
                    }`}>
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
    </div>
  )
}