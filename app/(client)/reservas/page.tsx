'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
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
  Sparkle
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

      let clienteId = null

      const { data: cliente } = await supabase
        .from('clients')
        .select('id, name, phone, email')
        .eq('auth_user_id', user.id)
        .maybeSingle() as any

      if (cliente) {
        clienteId = cliente.id
        setNombreCliente(cliente.name || '')
      }

      if (!clienteId && user.email) {
        const { data: clientePorEmail } = await supabase
          .from('clients')
          .select('id, name')
          .eq('email', user.email)
          .maybeSingle() as any

        if (clientePorEmail) {
          clienteId = clientePorEmail.id
          setNombreCliente(clientePorEmail.name || '')
        }
      }

      if (!clienteId) {
        const telGuardado = localStorage.getItem('cliente_telefono')
        if (telGuardado) {
          const { data: clientePorTel } = await supabase
            .from('clients')
            .select('id, name')
            .eq('phone', telGuardado)
            .maybeSingle() as any

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
              const rawStaff = staffData as any[]
              staffMap = rawStaff.reduce<Record<string, Staff>>((acc, s) => {
                acc[s.id] = { id: s.id, name: s.name }
                return acc
              }, {})
            }
          }

          const citasConStaff: Appointment[] = rawAppointments.map((cita) => {
            return {
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
            }
          })

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
    const base = "inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full border shadow-sm transition-all duration-300"
    switch (status) {
      case 'confirmed':
        return (
          <span className={`${base} bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20`}>
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Confirmado
          </span>
        )
      case 'pending':
        return (
          <span className={`${base} bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse`}>
            <Clock className="w-2.5 h-2.5 text-amber-500" /> Pendiente
          </span>
        )
      case 'cancelled':
        return (
          <span className={`${base} bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20`}>
            <XCircle className="w-2.5 h-2.5 text-rose-500" /> Cancelado
          </span>
        )
      default:
        return (
          <span className={`${base} bg-stone-100 text-stone-600 border-stone-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800`}>
            <HelpCircle className="w-2.5 h-2.5" /> Finalizado
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] relative overflow-hidden">
        <div className="absolute w-36 h-36 bg-pink-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="relative flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-2 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
          <Sparkles className="w-4 h-4 text-pink-400 absolute animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen antialiased selection:bg-pink-500/10 pb-24 transition-colors duration-500 ${
      isDark ? 'bg-[#09090b] text-zinc-100' : 'bg-transparent text-stone-900'
    }`}>
      <div className="max-w-4xl mx-auto px-4 space-y-8">

        {/* ============================================================ */}
        {/* HERO BANNER ATELIER PRESTIGE */}
        {/* ============================================================ */}
        <div className={`relative overflow-hidden rounded-[2.5rem] border p-6 md:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] mt-4 transition-all duration-500 ${
          isDark 
            ? 'bg-gradient-to-br from-zinc-950 via-zinc-900/50 to-black border-zinc-900/80' 
            : 'bg-gradient-to-br from-stone-900 via-stone-950 to-pink-950 border-stone-800'
        }`}>
          {/* Orbes fluorescentes satinados */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-pink-500/10 rounded-full blur-[120px] pointer-events-none animate-[pulse_5s_infinite]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 border px-3.5 py-1.5 rounded-full backdrop-blur-md bg-white/5 border-white/10 shadow-sm">
                <Sparkle className="w-3 h-3 text-pink-400 animate-[spin_4s_linear_infinite]" />
                <span className="text-[9px] uppercase tracking-[0.25em] font-black text-pink-300">Atelier Digital Experience</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-none">
                {nombreCliente ? `Rituales de ${nombreCliente.split(' ')[0]}` : 'Mis Reservas'}{' '}
                <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-rose-300 to-amber-200">VIP</span>
              </h2>
              
              <p className="text-xs text-zinc-400 max-w-xl font-medium tracking-wide">
                {user?.email ? `Historial y estatus activo de tu cuenta: ${user.email}` : 'Conectado de forma temporal'}
              </p>
            </div>

            <Link
              href="/client/booking"
              className="px-5 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/10 hover:shadow-pink-500/20 active:scale-95 shrink-0"
            >
              <Calendar className="w-3.5 h-3.5" />
              Agendar Ritual
            </Link>
          </div>
        </div>

        {/* BOX NOTIFICACIÓN FALLBACK */}
        {error && !citas.length && (
          <div className={`flex items-start gap-3.5 border p-4 rounded-2xl backdrop-blur-md transition-all ${
            isDark ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' : 'bg-amber-50/40 border-amber-200 text-amber-800 shadow-sm'
          }`}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-widest font-mono">Verificación de Cuenta</p>
              <p className="text-xs font-medium opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* LISTADO DE CITAS BOUTIQUE */}
        {/* ============================================================ */}
        <div className="mt-4">
          {citas.length === 0 ? (
            <div className={`border border-dashed rounded-[2rem] p-16 text-center backdrop-blur-sm transition-all ${
              isDark ? 'border-zinc-800 bg-zinc-900/10' : 'border-pink-100 bg-white/50 shadow-inner'
            }`}>
              <Calendar className={`w-10 h-10 mx-auto mb-4 ${isDark ? 'text-zinc-800' : 'text-pink-200 animate-pulse'}`} />
              <p className="text-sm font-black tracking-tight">No registras tratamientos próximos</p>
              <p className="text-xs mt-1.5 max-w-sm mx-auto text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">
                Diseña tu próxima experiencia haciendo clic en el botón superior de reservas VIP.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {citas.map((cita) => {
                const fechaObjeto = new Date(cita.date.replace(/-/g, '\/'))
                const fechaLinda = format(fechaObjeto, "EEEE d 'de' MMMM", { locale: es })

                return (
                  <div 
                    key={cita.id} 
                    className={`group relative rounded-2xl border p-5 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between min-h-[170px] overflow-hidden ${
                      isDark 
                        ? 'bg-zinc-900/20 border-zinc-900/80 hover:border-pink-500/20 shadow-lg hover:shadow-black/40' 
                        : 'bg-white border-stone-200/50 hover:border-pink-200 hover:shadow-xl hover:shadow-pink-100/30'
                    }`}
                  >
                    {/* Efecto Glow Sutil superior */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-pink-500/[0.02] to-transparent rounded-bl-full pointer-events-none transition-all duration-500 group-hover:from-pink-500/[0.08]" />

                    <div className="flex justify-between items-start gap-4 z-10">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black font-mono uppercase tracking-[0.2em] text-pink-500 dark:text-pink-400 block">
                          Tratamiento Adquirido
                        </span>
                        <h4 className="font-black text-sm tracking-tight text-zinc-800 dark:text-zinc-200 group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors duration-300">
                          {cita.services?.name || 'Servicio Especial Boutique'}
                        </h4>

                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold mt-3 border transition-colors ${
                          isDark ? 'bg-zinc-950/40 border-zinc-800 text-zinc-400' : 'bg-stone-50 border-stone-100 text-stone-500'
                        }`}>
                          <User className="w-3 h-3 text-pink-400" />
                          <span>Estilista:</span>
                          <span className="font-black text-zinc-700 dark:text-zinc-300">{cita.staff?.name || 'Por asignar'}</span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {renderBadge(cita.status)}
                      </div>
                    </div>

                    {/* Footer de la tarjeta */}
                    <div className={`flex items-center justify-between border-t border-dashed mt-6 pt-4 ${
                      isDark ? 'border-zinc-800/80' : 'border-stone-100'
                    }`}>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-pink-400" />
                        <span className="capitalize font-bold text-zinc-700 dark:text-zinc-300">{fechaLinda}</span>
                      </div>

                      {/* Ticket de Hora Luxe */}
                      <div className={`flex items-center gap-1.5 font-mono text-[10px] font-black px-3 py-1 rounded-xl shadow-sm tracking-widest ${
                        isDark 
                          ? 'bg-pink-500/10 border border-pink-500/20 text-pink-400' 
                          : 'bg-zinc-950 text-white border border-zinc-950'
                      }`}>
                        <span className="w-1 h-1 rounded-full bg-pink-400 animate-pulse" />
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
    </div>
  )
}
