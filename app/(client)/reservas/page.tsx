'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Calendar, 
  Clock, 
  User, 
  Sparkles, 
  AlertCircle, 
  XCircle,
  HelpCircle,
  Sparkle,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

interface Service {
  id: string
  name: string
  price: number
  duration: number
}

interface ClientProfile {
  id: string
  name: string
  phone: string
  email: string
}

interface Staff {
  id: string
  name: string
}

interface Appointment {
  id: string
  date: string
  time: string
  status: string
  client_id: string
  professional_id: string | null
  service_id: string
  clients: ClientProfile | null
  services: Service | null
  staff?: Staff | null
}

export default function MisReservasPage() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [loading, setLoading] = useState(true)
  const [citas, setCitas] = useState<Appointment[]>([])
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
      setCitas([]) // Evita parpadeos de reservas de sesiones anteriores

      let clienteId = null

      try {
        // 1. Intentar por auth_user_id
        const { data: cliente } = await supabase
          .from('clients')
          .select('id, name, phone, email')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (cliente) {
          clienteId = cliente.id
          setNombreCliente(cliente.name || '')
        }

        // 2. Fallback por email
        if (!clienteId && user.email) {
          const { data: clientePorEmail } = await supabase
            .from('clients')
            .select('id, name')
            .eq('email', user.email)
            .maybeSingle()

          if (clientePorEmail) {
            clienteId = clientePorEmail.id
            setNombreCliente(clientePorEmail.name || '')
          }
        }

        // 3. Fallback por LocalStorage
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

        // 4. Obtener Citas
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            id,
            date,
            time,
            status,
            client_id,
            professional_id,
            service_id,
            clients:client_id (id, name, phone, email),
            services:service_id (id, name, price, duration)
          `)
          .eq('client_id', clienteId)
          .order('date', { ascending: true })

        if (appointmentsError) throw appointmentsError

        if (appointmentsData && appointmentsData.length > 0) {
          const rawAppointments = appointmentsData as any[]

          // Mapeo optimizado de Staff
          const staffIds = rawAppointments
            .map((c) => c.professional_id)
            .filter((id): id is string => !!id)

          let staffMap: Record<string, Staff> = {}
          if (staffIds.length > 0) {
            const { data: staffData } = await supabase
              .from('staff')
              .select('id, name')
              .in('id', staffIds)

            if (staffData) {
              staffMap = (staffData as any[]).reduce<Record<string, Staff>>((acc, s) => {
                acc[s.id] = { id: s.id, name: s.name }
                return acc
              }, {})
            }
          }

          const citasConStaff: Appointment[] = rawAppointments.map((cita) => ({
            id: cita.id,
            date: cita.date,
            time: cita.time,
            status: cita.status,
            client_id: cita.client_id,
            professional_id: cita.professional_id,
            service_id: cita.service_id,
            clients: cita.clients ? {
              id: cita.clients.id,
              name: cita.clients.name,
              phone: cita.clients.phone,
              email: cita.clients.email
            } : null,
            services: cita.services ? {
              id: cita.services.id,
              name: cita.services.name,
              price: Number(cita.services.price),
              duration: Number(cita.services.duration)
            } : null,
            staff: cita.professional_id ? staffMap[cita.professional_id] : null
          }))

          setCitas(citasConStaff)
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
    const base = "inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300"
    switch (status) {
      case 'confirmed':
        return (
          <span className={`${base} bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-emerald-500/5`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Confirmado
          </span>
        )
      case 'pending':
        return (
          <span className={`${base} bg-gradient-to-r from-amber-500/10 to-amber-600/5 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-amber-500/5`}>
            <Clock className="w-2.5 h-2.5 text-amber-500 animate-spin [animation-duration:3s]" /> Pendiente
          </span>
        )
      case 'cancelled':
        return (
          <span className={`${base} bg-gradient-to-r from-rose-500/10 to-rose-600/5 text-rose-600 dark:text-rose-400 border-rose-500/20 shadow-rose-500/5`}>
            <XCircle className="w-2.5 h-2.5 text-rose-500" /> Cancelado
          </span>
        )
      default:
        return (
          <span className={`${base} bg-gradient-to-r from-stone-100 to-stone-200/50 text-stone-600 border-stone-200/60 dark:from-zinc-900 dark:to-zinc-900/50 dark:text-zinc-400 dark:border-zinc-800/60`}>
            <HelpCircle className="w-2.5 h-2.5" /> Finalizado
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="absolute w-64 h-64 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
            <Sparkles className="w-6 h-6 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-sm font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 animate-pulse">
              CARGANDO
            </p>
            <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              TUS RITUALES
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen antialiased selection:bg-pink-500/10 pb-24 transition-colors duration-700 ${
      isDark ? 'bg-gradient-to-b from-[#09090b] via-[#0d0d12] to-[#09090b] text-zinc-100' : 'bg-gradient-to-b from-stone-50 via-white to-stone-50/30 text-stone-900'
    }`}>
      <div className="max-w-5xl mx-auto px-4 space-y-8">

        {/* HERO BANNER */}
        <div className={`relative overflow-hidden rounded-[2.5rem] border p-7 md:p-10 shadow-2xl mt-6 transition-all duration-500 ${
          isDark 
            ? 'bg-gradient-to-br from-zinc-950 via-zinc-900/60 to-black border-zinc-900/60 shadow-[0_20px_60px_rgba(0,0,0,0.6)]' 
            : 'bg-gradient-to-br from-stone-900 via-stone-950 to-rose-950 border-stone-800/50 shadow-[0_20px_60px_rgba(219,91,154,0.12)]'
        }`}>
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full backdrop-blur-xl border ${
                isDark ? 'bg-pink-500/10 border-pink-500/20' : 'bg-white/20 border-white/30'
              }`}>
                <Sparkle className="w-3.5 h-3.5 text-pink-400 animate-[spin_4s_linear_infinite]" />
                <span className={`text-[8px] uppercase tracking-[0.25em] font-black ${isDark ? 'text-pink-300' : 'text-white'}`}>
                  ✦ Atelier Digital Experience ✦
                </span>
              </div>

              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] text-white">
                {nombreCliente ? (
                  <>
                    Rituales de{' '}
                    <span className="font-serif italic font-light text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-rose-300 to-amber-200">
                      {nombreCliente.split(' ')[0]}
                    </span>
                  </>
                ) : (
                  'Mis Reservas'
                )}{' '}
                <span className="font-serif italic font-light text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-rose-300 to-amber-200">
                  VIP
                </span>
              </h2>

              <p className={`text-xs font-medium tracking-wide max-w-xl ${isDark ? 'text-zinc-400' : 'text-pink-100/90'}`}>
                {user?.email ? (
                  <>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-2" />
                    Historial y estatus activo de tu cuenta: <span className="font-bold text-white/90">{user.email}</span>
                  </>
                ) : (
                  'Conectado de forma temporal'
                )}
              </p>
            </div>

            <Link
              href="/client/booking"
              className="w-full sm:w-auto px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 shadow-2xl group relative overflow-hidden transform active:scale-[0.97] hover:-translate-y-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/30 hover:shadow-pink-500/50"
            >
              <Calendar className="w-4 h-4 group-hover:rotate-12 transition-transform duration-500" />
              <span className="relative">Agendar Ritual</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>

        {/* NOTIFICACIÓN DE ERROR CRÍTICO O SESIÓN */}
        {error && (
          <div className={`flex items-start gap-4 border p-5 rounded-2xl backdrop-blur-md transition-all duration-500 shadow-lg ${
            isDark 
              ? 'bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-400' 
              : 'bg-gradient-to-r from-amber-50/80 to-amber-100/40 border-amber-200/60 text-amber-800'
          }`}>
            <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-amber-500/10' : 'bg-amber-100/50'}`}>
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] font-mono">Verificación de Cuenta</p>
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* LISTADO DE CITAS */}
        <div className="mt-4">
          {!error && citas.length === 0 ? (
            <div className={`border border-dashed rounded-[2.5rem] p-16 text-center backdrop-blur-sm transition-all duration-500 ${
              isDark ? 'border-zinc-800/60 bg-zinc-900/10' : 'border-pink-200/60 bg-white/50 shadow-inner'
            }`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${isDark ? 'bg-zinc-800/50' : 'bg-pink-100/50'}`}>
                <Calendar className={`w-9 h-9 ${isDark ? 'text-zinc-700' : 'text-pink-300'}`} />
              </div>
              <h3 className={`text-xl font-black tracking-tight ${isDark ? 'text-zinc-300' : 'text-stone-700'}`}>
                No registras tratamientos próximos
              </h3>
              <p className={`text-sm mt-2 max-w-sm mx-auto font-medium tracking-wide ${isDark ? 'text-zinc-400' : 'text-stone-400'}`}>
                Diseña tu próxima experiencia haciendo clic en el botón superior de reservas VIP.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {citas.map((cita, index) => {
                // Formateo ISO seguro para prevenir Hydration Mismatch en zonas horarias
                const fechaLinda = format(parseISO(cita.date), "EEEE d 'de' MMMM", { locale: es })

                return (
                  <div 
                    key={cita.id} 
                    className={`group relative rounded-2xl border p-5 transition-all duration-500 transform hover:-translate-y-1.5 flex flex-col justify-between min-h-[180px] overflow-hidden ${
                      isDark 
                        ? 'bg-gradient-to-br from-zinc-900/40 via-zinc-900/20 to-zinc-900/40 border-zinc-900/60 hover:border-pink-500/30 hover:shadow-2xl' 
                        : 'bg-gradient-to-br from-white via-stone-50/60 to-white border-stone-200/50 hover:border-pink-300/50 hover:shadow-2xl'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`absolute left-0 inset-y-0 w-1 rounded-r-full transition-all duration-500 ${
                      cita.status === 'confirmed' 
                        ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                        : cita.status === 'pending'
                        ? 'bg-gradient-to-b from-amber-500 to-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-gradient-to-b from-rose-500 to-rose-600'
                    }`} />

                    <div className="flex justify-between items-start gap-4 z-10 pl-3">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[7px] font-black font-mono uppercase tracking-[0.2em] ${isDark ? 'text-pink-400' : 'text-pink-500'}`}>
                            Tratamiento Adquirido
                          </span>
                          <div className="w-1 h-1 rounded-full bg-pink-400/30" />
                          <span className={`text-[7px] font-black font-mono uppercase tracking-[0.2em] ${isDark ? 'text-zinc-500' : 'text-stone-400'}`}>
                            #{cita.id.slice(0, 6)}
                          </span>
                        </div>

                        <h4 className={`font-black text-base tracking-tight transition-colors duration-300 ${
                          isDark ? 'text-zinc-200 group-hover:text-pink-400' : 'text-stone-800 group-hover:text-pink-600'
                        }`}>
                          {cita.services?.name || 'Servicio Especial Boutique'}
                        </h4>

                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-300 border ${
                          isDark ? 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400' : 'bg-stone-50 border-stone-200/60 text-stone-500'
                        }`}>
                          <User className="w-3 h-3 text-pink-400" />
                          <span>Estilista:</span>
                          <span className={`font-black ${isDark ? 'text-zinc-300' : 'text-stone-700'}`}>
                            {cita.staff?.name || 'Por asignar'}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {renderBadge(cita.status)}
                      </div>
                    </div>

                    <div className={`flex items-center justify-between border-t border-dashed mt-5 pt-4 pl-3 z-10 ${
                      isDark ? 'border-zinc-800/60' : 'border-stone-200/60'
                    }`}>
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-pink-500/10' : 'bg-pink-100/50'}`}>
                          <Calendar className="w-3 h-3 text-pink-400" />
                        </div>
                        <span className={`capitalize font-bold ${isDark ? 'text-zinc-300' : 'text-stone-700'}`}>
                          {fechaLinda}
                        </span>
                      </div>

                      <div className={`flex items-center gap-2 font-mono text-[10px] font-black px-3.5 py-1.5 rounded-xl shadow-sm tracking-widest ${
                        isDark 
                          ? 'bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20 text-pink-400' 
                          : 'bg-gradient-to-r from-stone-950 to-stone-800 text-white'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                        {cita.time.slice(0, 5)} HS
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* METRICAS INFERIORES */}
        {!error && citas.length > 0 && (
          <div className={`pt-6 border-t transition-all duration-500 ${isDark ? 'border-zinc-900/60' : 'border-stone-200/40'}`}>
            <div className={`rounded-2xl p-6 border shadow-lg flex flex-wrap items-center justify-around gap-4 ${
              isDark ? 'bg-zinc-900/30 border-zinc-900/60' : 'bg-white/60 border-stone-200/40 backdrop-blur-sm'
            }`}>
              <div className="text-center">
                <p className="text-[8px] font-black font-mono uppercase tracking-[0.2em] text-zinc-500">Total Reservas</p>
                <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-stone-800'}`}>{citas.length}</p>
              </div>
              <div className="w-px h-10 bg-zinc-800/30" />
              <div className="text-center">
                <p className="text-[8px] font-black font-mono uppercase tracking-[0.2em] text-zinc-500">Confirmadas</p>
                <p className={`text-2xl font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {citas.filter(c => c.status === 'confirmed').length}
                </p>
              </div>
              <div className="w-px h-10 bg-zinc-800/30" />
              <div className="text-center">
                <p className="text-[8px] font-black font-mono uppercase tracking-[0.2em] text-zinc-500">Pendientes</p>
                <p className={`text-2xl font-black ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  {citas.filter(c => c.status === 'pending').length}
                </p>
              </div>
              <div className="w-px h-10 bg-zinc-800/30" />
              <div className="text-center">
                <p className="text-[8px] font-black font-mono uppercase tracking-[0.2em] text-zinc-500">Canceladas</p>
                <p className={`text-2xl font-black ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                  {citas.filter(c => c.status === 'cancelled').length}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
