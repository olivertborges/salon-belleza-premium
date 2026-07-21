// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { CarritoProvider } from '@/contexts/CarritoContext'
import { 
  FaSignOutAlt, 
  FaCalendarAlt, 
  FaSlidersH, 
  FaUserCircle, 
  FaBell, 
  FaInstagram,
  FaHeart,
  FaStar,
  FaShoppingBag,
  FaHome,
  FaCrown
} from 'react-icons/fa'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut, tenantId } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [role, setRole] = useState<'client' | 'staff' | 'admin'>('client')
  const [puntosCliente, setPuntosCliente] = useState(0)
  const [tenantName, setTenantName] = useState('Fresh Nails')
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)

  useEffect(() => {
    if (pathname.includes('/admin')) setRole('admin')
    else if (pathname.includes('/staff')) setRole('staff')
    else setRole('client')
  }, [pathname])

  useEffect(() => {
    if (tenantId) {
      loadTenantInfo()
    }
    if (user?.email && tenantId) {
      cargarDatosCliente()
    }
  }, [tenantId, user])

  const loadTenantInfo = async () => {
    try {
      const { data } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', tenantId)
        .single()
      if (data) setTenantName(data.name)
    } catch (error) {
      console.error('Error loading tenant:', error)
    }
  }

  const cargarDatosCliente = async () => {
    try {
      if (!tenantId || !user) return

      const { data: cliente } = await supabase
        .from('clients')
        .select('id, points, avatar_url')
        .eq('email', user.email)
        .eq('tenant_id', tenantId)
        .single()
      
      if (cliente) {
        setPuntosCliente(cliente.points || 0)
        if (cliente.avatar_url) {
          setProfilePhoto(cliente.avatar_url)
        }
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const navItems = [
    { path: '/dashboard/client', icon: FaHome, label: 'Inicio' },
    { path: '/dashboard/client/citas', icon: FaCalendarAlt, label: 'Citas' },
    { path: '/dashboard/client/tienda', icon: FaShoppingBag, label: 'Tienda' },
    { path: '/dashboard/client/fidelidad', icon: FaStar, label: 'Fidelidad' },
    { path: '/dashboard/client/perfil', icon: FaUserCircle, label: 'Perfil' },
  ]

  return (
    <CarritoProvider>
      <div className="min-h-screen bg-[#faf8f6] text-[#2c2623] flex flex-col md:flex-row w-full overflow-x-hidden font-sans selection:bg-[#f3e1dc]">
        
        {/* ====== SIDEBAR ====== */}
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-[#f0eae6] p-8 flex flex-col justify-between shrink-0 h-screen sticky top-0">
          <div className="space-y-8">
            {/* Logo */}
            <Link href="/" className="flex flex-col items-center text-center group">
              <span className="font-serif italic text-2xl tracking-wide text-[#1a1513] font-light flex items-center gap-1.5">
                {tenantName} <span className="text-[#c97d6a] text-xs font-sans tracking-normal animate-pulse">✦</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-[#a3948c] font-medium mt-1">Salon & Spa VIP</span>
            </Link>

            {/* Perfil */}
            <div className="border-y border-[#f5eee9] py-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center overflow-hidden shadow-sm">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-xl font-light">{user?.full_name?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2c2623]">{user?.full_name || 'Cliente'}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#a3948c] font-semibold">
                    {role === 'admin' ? 'Directora General' : role === 'staff' ? 'Especialista' : 'Membre VIP'}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs text-[#c97d6a]">
                    <FaHeart className="text-[10px]" /> {puntosCliente} pts
                  </div>
                </div>
              </div>
            </div>
            
            {/* Navegación */}
            <nav className="flex flex-col gap-1.5 text-xs">
              {navItems.map((item) => {
                const isActive = pathname === item.path
                return (
                  <Link 
                    key={item.path}
                    href={item.path} 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium tracking-wide transition-all ${
                      isActive 
                        ? 'bg-[#fdf6f4] text-[#c97d6a] border border-[#f5e1db] font-semibold' 
                        : 'text-[#8c7a70] hover:bg-[#faf6f4] hover:text-[#2c2623]'
                    }`}
                  >
                    <item.icon className="text-sm opacity-80" /> {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Botón Salir */}
          <button 
            onClick={handleLogout}
            className="mt-8 flex items-center justify-center gap-2 w-full bg-white hover:bg-[#fcf9f7] border border-[#e6ded9] text-[10px] tracking-[0.15em] font-bold py-3.5 rounded-xl transition-all text-[#8c7a70] hover:text-[#c97d6a]"
          >
            <FaSignOutAlt className="text-xs" /> CERRAR SESIÓN
          </button>
        </aside>

        {/* ====== CONTENIDO PRINCIPAL ====== */}
        <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
          
          {/* Header */}
          <header className="w-full bg-white/80 backdrop-blur-md px-8 md:px-12 py-5 flex justify-between items-center border-b border-[#f0eae6] shrink-0 z-10">
            <div className="flex items-center gap-2 text-[11px] tracking-wider text-[#8c7a70] bg-[#faf6f4] px-3.5 py-1.5 rounded-full border border-[#f5e1db]/60">
              <FaInstagram className="text-[#c97d6a]" /> @freshnails.salon
            </div>
            <button className="p-2.5 bg-white hover:bg-[#faf8f6] rounded-full border border-[#e6ded9] text-[#6e5d55] relative transition-colors">
              <FaBell className="text-xs" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#c97d6a] rounded-full" />
            </button>
          </header>

          {/* Contenido */}
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
