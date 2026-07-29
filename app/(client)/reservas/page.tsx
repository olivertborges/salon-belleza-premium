// @ts-nocheck
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
  ArrowRight,
  CheckCircle2
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

// ============================================================
// COMPONENTE DE CARGA (CON TEMA)
// ============================================================
const ReservasLoadingSpinner = ({ isDark }: { isDark: boolean }) => (
  <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-500 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-16 h-16">
        <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
        <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
      </div>
      <p className={`text-[10px] tracking-[0.4em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]/60'}`}>
        Cargando tus rituales...
      </p>
    </div>
  </div>
)

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
      setCitas([])

      let clienteId = null

      try {
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
    const base = `inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border transition-all duration-300`
    
    switch (status) {
      case 'confirmed':
        return (
          <span className={`${base} ${
            isDark 
              ? 'bg-[#3D281E]/60 border-[#D4AF37]/40 text-[#D4AF37]' 
              : 'bg-[#FFF9F6] border-[#D4AF37]/40 text-[#D4AF37]'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" /> 
            Confirmado
          </span>
        )
      case 'pending':
        return (
          <span className={`${base} ${
            isDark 
              ? 'bg-[#3D281E]/60 border-[#D4AF37]/20 text-[#A89588]' 
              : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E]'
          }`}>
            <Clock className="w-2.5 h-2.5 animate-spin [animation-duration:3s]" /> 
            Pendiente
          </span>
        )
      case 'cancelled':
        return (
          <span className={`${base} ${
            isDark 
              ? 'bg-[#3D281E]/60 border-rose-500/30 text-rose-400' 
              : 'bg-[#FFF9F6] border-rose-200 text-rose-600'
          }`}>
            <XCircle className="w-2.5 h-2.5" /> 
            Cancelado
          </span>
        )
      default:
        return (
          <span className={`${base} ${
            isDark 
              ? 'bg-[#3D281E]/40 border-[#3D281E] text-[#A89588]' 
              : 'bg-[#F0E4DA]/40 border-[#F0E4DA] text-[#5C4A3E]'
          }`}>
            <HelpCircle className="w-2.5 h-2.5" /> 
            Finalizado
          </span>
        )
    }
  }

  if (loading) {
    return <ReservasLoadingSpinner isDark={isDark} />
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-16 relative overflow-x-hidden ${
      isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'
    }`}>
      {/* Fondo texturizado */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-12 space-y-8 relative z-10">

        {/* ============================================================ */}
        {/* HERO BANNER EDITORIAL */}
        {/* ============================================================ */}
        <div className={`border p-7 sm:p-10 rounded-2xl transition-all duration-300 ${
          isDark 
            ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_15px_35px_rgba(0,0,0,0.3)]' 
            : 'bg-white border-[#F0E4DA] shadow-[0_15px_35px_rgba(240,228,218,0.6)]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full border ${
                isDark ? 'border-[#D4AF37]/20 bg-[#3D281E]/40' : 'border-[#D4AF37]/20 bg-[#FFF9F6]'
              }`}>
                <Sparkle className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className={`text-[8px] font-bold tracking-[0.25em] uppercase ${
                  isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                }`}>
                  ✦ Atelier Digital ✦
                </span>
              </div>

              <h2 className={`font-serif text-3xl sm:text-4xl font-light tracking-tight leading-[1.1] ${
                isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
              }`}>
                {nombreCliente ? (
                  <>
                    Rituales de{' '}
                    <span className="font-serif italic font-light text-[#D4AF37]">
                      {nombreCliente.split(' ')[0]}
                    </span>
                  </>
                ) : (
                  'Mis Reservas'
                )}{' '}
                <span className="font-serif italic font-light text-[#D4AF37]">VIP</span>
              </h2>

              <p className={`text-xs font-light max-w-xl ${
                isDark ? 'text-[#FFF9F6]/60' : 'text-[#5C4A3E]'
              }`}>
                {user?.email ? (
                  <>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse mr-2" />
                    Historial y estatus activo de tu cuenta: <span className={`font-medium ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{user.email}</span>
                  </>
                ) : (
                  'Conectado de forma temporal'
                )}
              </p>
            </div>

            <Link
              href="/client/booking"
              className={`w-full sm:w-auto px-6 py-4 rounded-xl text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300 flex items-center justify-center gap-3 shadow-md hover:shadow-lg group active:scale-[0.97] hover:-translate-y-0.5 ${
                isDark 
                  ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                  : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37]'
              }`}
            >
              <Calendar className="w-4 h-4 group-hover:rotate-12 transition-transform duration-500" />
              <span className="relative">Agendar Ritual</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>

        {/* ============================================================ */}
        {/* NOTIFICACIÓN DE ERROR */}
        {/* ============================================================ */}
        {error && (
          <div className={`flex items-start gap-4 border p-5 rounded-2xl transition-all duration-300 ${
            isDark 
              ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' 
              : 'bg-[#FFF9F6] border-[#D4AF37]/30 text-[#1A0E0A]'
          }`}>
            <div className={`p-2 rounded-xl shrink-0 ${
              isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
            }`}>
              <AlertCircle className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div className="space-y-0.5">
              <p className={`text-[9px] font-bold tracking-[0.2em] uppercase ${
                isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
              }`}>
                Verificación de Cuenta
              </p>
              <p className="text-sm font-light">{error}</p>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* LISTADO DE CITAS */}
        {/* ============================================================ */}
        <div className="mt-4">
          {!error && citas.length === 0 ? (
            <div className={`border border-dashed rounded-2xl p-16 text-center transition-all duration-300 ${
              isDark ? 'border-[#3D281E] bg-[#2A1B14]/40' : 'border-[#F0E4DA] bg-white'
            }`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
                isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
              }`}>
                <Calendar className={`w-9 h-9 ${isDark ? 'text-[#A89588]' : 'text-[#A89588]'}`} />
              </div>
              <h3 className={`font-serif text-2xl font-light ${
                isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
              }`}>
                No registras tratamientos próximos
              </h3>
              <p className={`text-sm font-light mt-2 max-w-sm mx-auto ${
                isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
              }`}>
                Diseña tu próxima experiencia haciendo clic en el botón superior de reservas VIP.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {citas.map((cita, index) => {
                const fechaLinda = format(parseISO(cita.date), "EEEE d 'de' MMMM", { locale: es })

                return (
                  <div 
                    key={cita.id} 
                    className={`group relative rounded-2xl border p-5 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between min-h-[180px] overflow-hidden ${
                      isDark 
                        ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
                        : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Banda lateral indicadora */}
                    <div className={`absolute left-0 inset-y-0 w-1 rounded-r-full transition-all duration-500 ${
                      cita.status === 'confirmed' 
                        ? 'bg-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                        : cita.status === 'pending'
                        ? 'bg-[#A89588] shadow-[0_0_15px_rgba(168,149,136,0.2)]'
                        : 'bg-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                    }`} />

                    <div className="flex justify-between items-start gap-4 z-10 pl-3">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[7px] font-bold font-mono uppercase tracking-[0.2em] ${
                            isDark ? 'text-[#D4AF37]' : 'text-[#D4AF37]'
                          }`}>
                            Tratamiento Adquirido
                          </span>
                          <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-[#3D281E]' : 'bg-[#F0E4DA]'}`} />
                          <span className={`text-[7px] font-mono uppercase tracking-[0.2em] ${
                            isDark ? 'text-[#A89588]' : 'text-[#A89588]'
                          }`}>
                            #{cita.id.slice(0, 6)}
                          </span>
                        </div>

                        <h4 className={`font-serif text-lg font-light tracking-wide transition-colors duration-300 ${
                          isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                        }`}>
                          {cita.services?.name || 'Servicio Especial Boutique'}
                        </h4>

                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-300 border ${
                          isDark 
                            ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588]' 
                            : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E]'
                        }`}>
                          <User className="w-3 h-3 text-[#D4AF37]" />
                          <span>Estilista:</span>
                          <span className={`font-medium ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                            {cita.staff?.name || 'Por asignar'}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {renderBadge(cita.status)}
                      </div>
                    </div>

                    <div className={`flex items-center justify-between border-t border-dashed mt-5 pt-4 pl-3 ${
                      isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
                    }`}>
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className={`p-1.5 rounded-lg ${
                          isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
                        }`}>
                          <Calendar className="w-3 h-3 text-[#D4AF37]" />
                        </div>
                        <span className={`capitalize font-serif text-sm font-light ${
                          isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                        }`}>
                          {fechaLinda}
                        </span>
                      </div>

                      <div className={`flex items-center gap-2 font-mono text-[10px] font-bold px-3.5 py-1.5 rounded-xl tracking-widest ${
                        isDark 
                          ? 'bg-[#3D281E] text-[#D4AF37] border border-[#D4AF37]/30' 
                          : 'bg-[#FFF9F6] text-[#D4AF37] border border-[#D4AF37]/30'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                        {cita.time.slice(0, 5)} HS
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ============================================================ */}
{/* MÉTRICAS INFERIORES - RESPONSIVE */}
{/* ============================================================ */}
{!error && citas.length > 0 && (
  <div className={`pt-6 border-t ${
    isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
  }`}>
    <div className={`border rounded-2xl p-4 sm:p-6 shadow-sm transition-all duration-300 ${
      isDark 
        ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
        : 'bg-white border-[#F0E4DA] shadow-[0_10px_30px_rgba(240,228,218,0.5)]'
    }`}>
      
      {/* Grid responsive: 2 columnas en móvil, 4 en tablet, 5 en escritorio */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-2">
        
        {/* Total Reservas */}
        <div className="text-center">
          <p className={`text-[8px] font-bold tracking-[0.2em] uppercase ${
            isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
          }`}>
            Total
          </p>
          <p className={`font-serif text-2xl sm:text-3xl font-light ${
            isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
          }`}>
            {citas.length}
          </p>
        </div>

        {/* Separador visual (solo en desktop) */}
        <div className="hidden lg:block" />

        {/* Confirmadas */}
        <div className="text-center">
          <p className={`text-[8px] font-bold tracking-[0.2em] uppercase ${
            isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
          }`}>
            Confirmadas
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-light text-[#D4AF37]">
            {citas.filter(c => c.status === 'confirmed').length}
          </p>
        </div>

        {/* Separador visual (solo en desktop) */}
        <div className="hidden lg:block" />

        {/* Pendientes */}
        <div className="text-center">
          <p className={`text-[8px] font-bold tracking-[0.2em] uppercase ${
            isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
          }`}>
            Pendientes
          </p>
          <p className={`font-serif text-2xl sm:text-3xl font-light ${
            isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
          }`}>
            {citas.filter(c => c.status === 'pending').length}
          </p>
        </div>

        {/* Separador visual (solo en desktop) */}
        <div className="hidden lg:block" />

        {/* Canceladas */}
        <div className="text-center">
          <p className={`text-[8px] font-bold tracking-[0.2em] uppercase ${
            isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
          }`}>
            Canceladas
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-light text-rose-500">
            {citas.filter(c => c.status === 'cancelled').length}
          </p>
        </div>

      </div>
    </div>
  </div>
)}

      </div>
    </div>
  )
}