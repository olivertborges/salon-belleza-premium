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
  XCircle
} from 'lucide-react'
import Link from 'next/link'

// Definimos interfaces claras y planas para la vista
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

      // 1. BUSCAR CLIENTE POR auth_user_id (CORREGIDO CON AS ANY)
      const { data: cliente } = await supabase
        .from('clients')
        .select('id, name, phone, email')
        .eq('auth_user_id', user.id)
        .maybeSingle() as any

      if (cliente) {
        clienteId = cliente.id
        setNombreCliente(cliente.name || '')
      }

      // 2. BUSCAR POR EMAIL (CORREGIDO CON AS ANY)
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

      // 3. BUSCAR POR TELÉFONO (CORREGIDO CON AS ANY)
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
    const base = "inline-flex items-center gap-1.5 text-[9px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm transition-all duration-300"
    switch (status) {
      case 'confirmed':
        return (
          <span className={`${base} bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20`}>
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Confirmado
          </span>
        )
      case 'pending':
        return (
          <span className={`${base} bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse`}>
            <Clock className="w-3 h-3 text-amber-500" /> Pendiente
          </span>
        )
      case 'cancelled':
        return (
          <span className={`${base} bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20`}>
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin" />
          <Sparkles className="w-5 h-5 text-pink-500 absolute animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen antialiased selection:bg-pink-500/20 pb-24 transition-colors duration-500 ${
      isDark ? 'bg-stone-950 text-stone-100' : 'bg-gradient-to-b from-pink-50/20 via-amber-50/10 to-stone-50/30 text-stone-900'
    }`}>
      <div className="max-w-4xl mx-auto px-4">

        {/* HERO BANNER ATELIER PRESTIGE */}
        <div className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 shadow-xl mt-4 transition-all duration-300 ${
          isDark 
            ? 'bg-gradient-to-br from-stone-950 via-pink-950/20 to-neutral-950 border-pink-950/40' 
            : 'bg-gradient-to-br from-stone-900 via-pink-600 to-amber-500 border-pink-100'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className={`inline-flex items-center gap-2 border px-3 py-1 rounded-full backdrop-blur-md ${isDark ? 'bg-pink-500/10 border-pink-500/30' : 'bg-white/20 border-white/30'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                <span className={`text-[9px] uppercase tracking-widest font-black ${isDark ? 'text-pink-300' : 'text-white'}`}>Atelier Digital Experience</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white">
                {nombreCliente ? `Rituales de ${nombreCliente.split(' ')[0]}` : 'Mis Reservas'} <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-amber-200 to-white">VIP</span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-pink-100/90 font-medium'}`}>
                {user?.email ? `Historial y estatus activo de tu cuenta: ${user.email}` : 'Conectado de forma temporal'}
              </p>
            </div>

            <Link
              href="/client/booking"
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border shadow-sm ${
                isDark 
                  ? 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800' 
                  : 'bg-stone-950 border-stone-900 text-white hover:bg-stone-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-pink-400" />
              Agendar Ritual →
            </Link>
          </div>
        </div>

        {/* BOX NOTIFICACIÓN FALLBACK */}
        {error && !citas.length && (
          <div className={`mt-6 flex items-start gap-3 border p-4 rounded-2xl backdrop-blur-md shadow-sm ${
            isDark ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' : 'bg-amber-50/60 border-amber-200 text-amber-800'
          }`}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
            <div className="space-y-0.5">
              <p className="text-xs font-black uppercase tracking-wider font-mono">Verificación de Cuenta</p>
              <p className="text-xs font-medium opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* LISTADO DE CITAS BOUTIQUE */}
        <div className="mt-8">
          {citas.length === 0 ? (
            <div className={`border border-dashed rounded-3xl p-12 text-center backdrop-blur-md ${
              isDark ? 'border-stone-800 bg-stone-900/10' : 'border-pink-100 bg-white/40 shadow-inner'
            }`}>
              <Calendar className={`w-10 h-10 mx-auto mb-4 ${isDark ? 'text-stone-800' : 'text-pink-200'}`} />
              <p className="text-sm font-black tracking-tight text-stone-800 dark:text-stone-200">No registras tratamientos próximos</p>
              <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                Diseña tu próxima experiencia haciendo clic en el botón superior de reservas VIP.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {citas.map((cita) => {
                const fechaObjeto = new Date(cita.date.replace(/-/g, '\/'))
                const fechaLinda = format(fechaObjeto, "EEEE d 'de' MMMM", { locale: es })

                return (
                  <div 
                    key={cita.id} 
                    className={`group relative rounded-2xl border p-5 transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col justify-between min-h-[160px] overflow-hidden ${
                      isDark 
                        ? 'bg-stone-900/40 border-stone-900 hover:border-pink-500/20 hover:bg-stone-900/60 shadow-lg' 
                        : 'bg-white border-pink-100/60 hover:border-pink-300 hover:shadow-md'
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-pink-500/[0.03] to-transparent rounded-bl-full pointer-events-none transition-all group-hover:from-pink-500/[0.08]" />

                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black font-mono uppercase tracking-widest text-pink-500 dark:text-pink-400">Tratamiento Adquirido</span>
                        <h4 className="font-black text-sm tracking-tight text-stone-900 dark:text-stone-200 group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors">
                          {cita.services?.name || 'Servicio Especial Boutique'}
                        </h4>
                        
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold mt-2 border ${
                          isDark ? 'bg-stone-950/60 border-stone-800 text-stone-400' : 'bg-stone-50 border-stone-100 text-stone-500'
                        }`}>
                          <User className="w-3 h-3 text-pink-500" />
                          <span>Especialista:</span>
                          <span className="font-black text-stone-800 dark:text-stone-200">{cita.staff?.name || 'Por asignar'}</span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {renderBadge(cita.status)}
                      </div>
                    </div>

                    <div className={`flex items-center justify-between border-t border-dashed mt-5 pt-3.5 ${
                      isDark ? 'border-stone-800/80' : 'border-stone-100'
                    }`}>
                      <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-pink-500" />
                        <span className="capitalize font-bold text-stone-800 dark:text-stone-300">{fechaLinda}</span>
                      </div>

                      <div className={`flex items-center gap-1.5 font-mono text-[11px] font-black px-2.5 py-1 rounded-xl shadow-sm tracking-widest ${
                        isDark 
                          ? 'bg-pink-500/10 border border-pink-500/20 text-pink-400' 
                          : 'bg-stone-950 text-white'
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

      </div>
    </div>
  )
}