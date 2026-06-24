'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/config/supabase'
import { CarritoProvider } from '@/contexts/CarritoContext'
import { 
  FaUserCircle, FaCalendarAlt, FaSlidersH, FaSignOutAlt, 
  FaInstagram, FaShoppingBag, FaStar, FaHome, FaBell
} from 'react-icons/fa'
import { Menu, X, Gift } from 'lucide-react'
import Notificaciones from '@/components/Notificaciones'
import CarritoWidget from '@/components/CarritoWidget'
import toast from 'react-hot-toast'

export default function DashboardMasterLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut, tenantId } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  const [role, setRole] = useState<'client' | 'staff' | 'admin'>('client')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [citasCliente, setCitasCliente] = useState([])
  const [puntosCliente, setPuntosCliente] = useState(0)
  const [tenantName, setTenantName] = useState('Fresh Nails')

  // 1. Detectar el Rol según la URL actual
  useEffect(() => {
    if (pathname.includes('/dashboard/admin')) setRole('admin')
    else if (pathname.includes('/dashboard/staff')) setRole('staff')
    else setRole('client')
  }, [pathname])

  // 2. Cargar Info del Salón (Tenant) de forma segura para TypeScript
  useEffect(() => {
    async function loadTenantInfo() {
      if (!tenantId) return
      try {
        const clientAnonym: any = supabase
        const { data, error } = await clientAnonym
          .from('tenants')
          .select('name, primary_color')
          .eq('id', tenantId)
          .single()

        if (error) throw error

        if (data) {
          setTenantName(data.name)
          if (data.primary_color) {
            document.documentElement.style.setProperty('--primary-color', data.primary_color)
          }
        }
      } catch (error) {
        console.error('Error loading tenant info:', error)
      }
    }

    loadTenantInfo()
  }, [tenantId])

  // 3. Cargar datos del usuario si es cliente de forma segura para TypeScript
  useEffect(() => {
    async function cargarDatosCliente() {
      if (!user?.email || !tenantId || role !== 'client') return

      try {
        const clientAnonym: any = supabase

        const { data: cliente, error: clientError } = await clientAnonym
          .from('clients')
          .select('id, points, avatar_url')
          .eq('email', user.email)
          .eq('tenant_id', tenantId)
          .single()

        if (clientError) throw clientError

        if (cliente) {
          setPuntosCliente(cliente.points || 0)
          if (cliente.avatar_url) setProfilePhoto(cliente.avatar_url)
          
          const { data: citas, error: appointmentsError } = await clientAnonym
            .from('appointments')
            .select('*')
            .eq('client_id', cliente.id)
            .eq('tenant_id', tenantId)
            .order('date', { ascending: true })

          if (appointmentsError) throw appointmentsError
          if (citas) setCitasCliente(citas)
        }
      } catch (error) {
        console.error('Error cargando datos del cliente:', error)
      }
    }

    cargarDatosCliente()
  }, [user, tenantId, role])

  const handleLogout = async () => {
    if (signOut) {
      await signOut()
    }
    router.push('/login')
    toast.success('Sesión cerrada correctamente')
  }

  // 4. Configuración de Menús dinámicos por Rol
  const menuPorRol = {
    client: [
      { path: '/dashboard/client', label: 'Inicio', icon: FaHome },
      { path: '/dashboard/client/citas', label: 'Mis Citas', icon: FaCalendarAlt },
      { path: '/dashboard/client/tienda', label: 'Tienda', icon: FaShoppingBag },
      { path: '/dashboard/client/fidelidad', label: 'Fidelidad', icon: FaStar },
      { path: '/dashboard/client/perfil', label: 'Perfil', icon: FaUserCircle },
    ],
    staff: [
      { path: '/dashboard/staff', label: 'Agenda Semanal', icon: FaCalendarAlt },
      { path: '/dashboard/staff/servicios', label: 'Mis Servicios', icon: FaSlidersH },
      { path: '/dashboard/staff/perfil', label: 'Mi Perfil', icon: FaUserCircle },
    ],
    admin: [
      { path: '/dashboard/admin', label: 'Métricas Globales', icon: FaSlidersH },
      { path: '/dashboard/admin/clientes', label: 'Control Clientes', icon: FaUserCircle },
      { path: '/dashboard/admin/citas', label: 'Historial General', icon: FaCalendarAlt },
    ]
  }

  const menuActual = menuPorRol[role] || menuPorRol['client']

  return (
    <CarritoProvider>
      <div className="min-h-screen bg-[#faf8f6] text-[#2c2623] flex flex-col md:flex-row w-full overflow-x-hidden font-sans selection:bg-[#f3e1dc]">
        
        {/* HEADER MÓVIL */}
        <header className="w-full md:hidden bg-white border-b border-[#f0eae6] px-6 py-4 flex justify-between items-center z-40 shrink-0">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-xl hover:bg-[#faf6f4]">
            <Menu className="w-5 h-5 text-[#6e5d55]" />
          </button>
          <span className="font-serif italic text-lg tracking-wide text-[#1a1513] font-light">
            {tenantName.toUpperCase()}
          </span>
          <div className="flex items-center gap-2">
            {role === 'client' && <CarritoWidget />}
            
            <button className="p-2.5 bg-white rounded-full border border-[#e6ded9] text-[#6e5d55] relative">
              <FaBell className="text-xs" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#c97d6a] rounded-full" />
              <Notificaciones user={{ ...user, role }} />
            </button>
          </div>
        </header>

        {/* SIDEBAR MÓVIL DESPLEGABLE */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-64 h-full bg-white p-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="font-serif italic text-xl text-[#1a1513]">{tenantName}</span>
                  <button onClick={() => setMobileMenuOpen(false)}><X className="w-5 h-5 text-[#8c7a70]" /></button>
                </div>
                <nav className="flex flex-col gap-1 text-xs">
                  {menuActual.map((item) => (
                    <Link key={item.path} href={item.path} onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                        pathname === item.path ? 'bg-[#fdf6f4] text-[#c97d6a] border border-[#f5e1db] font-semibold' : 'text-[#8c7a70] hover:bg-[#faf6f4]'
                      }`}>
                      <item.icon className="text-sm opacity-80" /> {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
              <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full bg-white border border-[#e6ded9] text-[10px] tracking-wider font-bold py-3 rounded-xl text-red-600">
                <FaSignOutAlt /> CERRAR SESIÓN
              </button>
            </div>
          </div>
        )}

        {/* SIDEBAR PRINCIPAL DESKTOP (EL DE AFUERA) */}
        <aside className="hidden md:flex w-64 bg-white border-r border-[#f0eae6] p-8 flex-col justify-between shrink-0 h-screen sticky top-0">
          <div className="space-y-8">
            <Link href="/" className="flex flex-col items-center text-center group">
              <span className="font-serif italic text-2xl tracking-wide text-[#1a1513] font-light flex items-center gap-1.5">
                {tenantName.toUpperCase()} <span className="text-[#c97d6a] text-xs font-sans tracking-normal animate-pulse">✦</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-[#a3948c] font-medium mt-1">Salon & Spa VIP</span>
            </Link>

            <div className="border-y border-[#f5eee9] py-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#a3948c] font-semibold">Espace Privé</p>
              <p className="text-xs font-serif italic text-[#6e5d55] mt-0.5 capitalize">
                {role === 'admin' ? 'Directora General' : role === 'staff' ? 'L’Artiste Especialista' : 'Membre VIP'}
              </p>
              {role === 'client' && (
                <div className="flex items-center justify-center gap-1 text-[11px] font-sans text-[#c97d6a] mt-1.5 bg-[#fdf6f4] py-0.5 px-2 rounded-full border border-[#f5e1db]/60 w-max mx-auto">
                  <Gift className="w-3 h-3" />
                  <span>{puntosCliente} pts disponibles</span>
                </div>
              )}
            </div>
            
            <nav className="flex flex-col gap-1.5 text-xs">
              {menuActual.map((item) => {
                const isActive = pathname === item.path
                return (
                  <Link 
                    key={item.path} 
                    href={item.path} 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium tracking-wide transition-all ${
                      isActive 
                        ? 'bg-[#fdf6f4] text-[#c97d6a] border border-[#f5e1db] font-semibold shadow-xs' 
                        : 'text-[#8c7a70] hover:bg-[#faf6f4] hover:text-[#2c2623]'
                    }`}
                  >
                    <item.icon className="text-sm opacity-80" /> {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 border-t border-[#f5eee9] pt-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#c97d6a] to-[#e5a46e] flex items-center justify-center overflow-hidden shrink-0">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-xs">{user?.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs text-[#2c2623] truncate">{user?.name || 'Cliente VIP'}</p>
                <p className="text-[10px] text-[#a3948c] truncate">{user?.email}</p>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full bg-white hover:bg-[#fcf9f7] border border-[#e6ded9] text-[10px] tracking-[0.15em] font-bold py-3.5 rounded-xl transition-all text-[#8c7a70] hover:text-[#c97d6a]"
            >
              <FaSignOutAlt className="text-xs" /> CERRAR SESIÓN
            </button>
          </div>
        </aside>

        {/* CONTENEDOR PRINCIPAL DERECHO */}
        <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
          
        {/* TOPBAR DESKTOP PREMIUM */}
        <header className="hidden md:flex w-full bg-white/80 backdrop-blur-md px-12 py-5 justify-between items-center border-b border-[#f0eae6] shrink-0 z-10 sticky top-0">
          
          {/* Sección Izquierda: Saludo Dinámico & Buscador */}
          <div className="flex items-center gap-8 flex-1">
            <div className="hidden lg:block">
              <h2 className="text-sm font-serif italic text-[#1a1513]">
                Bonjour, {user?.name?.split(' ')[0] || 'Chérie'}
              </h2>
              <p className="text-[10px] text-[#a3948c] uppercase tracking-wider mt-0.5">
                Bienvenida de vuelta a tu oasis
              </p>
            </div>

            {/* Buscador minimalista de cortesía */}
            <div className="relative max-w-xs w-full group">
              <input 
                type="text" 
                placeholder="Buscar servicios, productos..." 
                className="w-full bg-[#faf6f4] border border-[#f5e1db]/60 text-xs px-4 py-2 rounded-full text-[#6e5d55] placeholder-[#a3948c] focus:outline-none focus:border-[#c97d6a] transition-colors"
              />
              <span className="absolute right-4 top-2.5 text-[#a3948c] text-[10px] tracking-widest group-focus-within:text-[#c97d6a] transition-colors">✦</span>
            </div>
          </div>
          
          {/* Sección Derecha: Redes, Estatus y Acciones del Carrito/Alertas */}
          <div className="flex items-center gap-6 shrink-0">
            {/* Enlace de Redes Estilizado */}
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 text-[11px] tracking-wider text-[#8c7a70] bg-[#faf6f4] hover:bg-[#fdf6f4] px-4 py-2 rounded-full border border-[#f5e1db]/60 transition-colors"
            >
              <FaInstagram className="text-[#c97d6a]" /> 
              <span className="hover:text-[#c97d6a] transition-colors">@freshnails.salon</span>
            </a>

            {/* Línea divisoria fina */}
            <span className="h-5 w-px bg-[#f0eae6]" />

            {/* Bloque de Widgets de interacción */}
            <div className="flex items-center gap-3.5">
              {role === 'client' && (
                <div className="relative hover:scale-105 transition-transform">
                  <CarritoWidget />
                </div>
              )}
              
              {/* Botón de la campana con el componente Notificaciones */}
              <button className="p-2.5 bg-white hover:bg-[#faf8f6] rounded-full border border-[#e6ded9] text-[#6e5d55] relative transition-all group active:scale-95 shadow-2xs">
                <FaBell className="text-xs group-hover:text-[#c97d6a] transition-colors" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#c97d6a] rounded-full animate-ping" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#c97d6a] rounded-full" />
                <Notificaciones user={{ ...user, role }} />
              </button>
            </div>
          </div>

        </header>

          {/* ÁREA DE CONTENIDO DINÁMICO */}
          <main className="p-8 md:p-12 flex-1 bg-[#faf8f6]">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>

      </div>
    </CarritoProvider>
  )
}