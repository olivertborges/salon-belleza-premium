// @ts-nocheck
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Scissors, Heart, Crown, Calendar, 
  Menu, X, LogOut, Home, CalendarPlus,
  Camera, Tag, Eye, Hand, Globe
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { supabase } from '@/lib/supabase/client'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { theme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [userName, setUserName] = useState('Usuario')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const isDark = theme === 'dark'

  const fetchAvatarDirect = useCallback(async () => {
    if (!user?.id) return

    const initialName = user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || 
                        'Usuario'
    setUserName(initialName)

    try {
      let foundAvatar = null

      let { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (!clientData && user.email) {
        const { data: clientByEmail } = await supabase
          .from('clients')
          .select('*')
          .eq('email', user.email)
          .maybeSingle()
        if (clientByEmail) clientData = clientByEmail
      }

      if (clientData) {
        const name = clientData.name || clientData.full_name || clientData.nombre
        if (name) setUserName(name)

        foundAvatar = clientData.avatar_url || clientData.foto || clientData.image_url || clientData.photo_url || clientData.avatar
      }

      if (!foundAvatar && (user.user_metadata?.avatar_url || user.user_metadata?.picture)) {
        foundAvatar = user.user_metadata.avatar_url || user.user_metadata.picture
      }

      if (foundAvatar && typeof foundAvatar === 'string' && foundAvatar.trim().length > 5) {
        setAvatarUrl(foundAvatar)
      }

    } catch (err) {
      console.error('Error cargando avatar en layout:', err)
    }
  }, [user])

  useEffect(() => {
    fetchAvatarDirect()
  }, [fetchAvatarDirect])

  const firstName = userName.split(' ')[0] || userName
  const inicialNombre = firstName.charAt(0).toUpperCase()

  const menuItems = [
    { icon: Home, label: 'Inicio Portal', href: '/portal' },
    { icon: CalendarPlus, label: 'Reservar Turno', href: '/agenda' },
    { icon: Calendar, label: 'Mis Citas', href: '/reservas' },
    { icon: Scissors, label: 'Peluquería', href: '/peluqueria' },
    { icon: Eye, label: 'Micropigmentación', href: '/micropigmentacion' },
    { icon: Hand, label: 'Uñas', href: '/unhas' },
    { icon: Heart, label: 'Estética', href: '/estetica' },
    { icon: Camera, label: 'Galería & Looks', href: '/mi-galeria' },
    { icon: Tag, label: 'Ofertas Especiales', href: '/promociones' },
    { icon: Crown, label: 'Club Fresh VIP', href: '/fidelizacion' }
  ]

  const handleLogoutClick = async () => {
    try {
      if (signOut) await signOut()
      await supabase.auth.signOut()
      localStorage.clear()
      sessionStorage.clear()
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    } catch (error) {
      window.location.href = '/login'
    }
  }

  return (
    /* Contenedor principal a pantalla completa sin bloquear el scroll del sistema */
    <div className={`fixed inset-0 w-screen h-[100dvh] antialiased flex relative transition-colors duration-500 select-none ${
      isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'
    }`}>

      {/* Backdrop Sidebar Móvil */}
      <div 
        onClick={() => setSidebarOpen(false)} 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-500 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar Lateral */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-76 h-full border-r transition-all duration-500 lg:static lg:translate-x-0 flex flex-col shrink-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } ${
          isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
        }`}
      >
        <div className={`p-6 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
        }`}>
          <span className="text-sm font-light tracking-[0.3em] uppercase">freshNails</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-[#A89588]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link 
                key={index} 
                href={item.href} 
                onClick={() => setSidebarOpen(false)} 
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold ${
                  isActive ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-[#A89588]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-[#3D281E] space-y-1 shrink-0">
          <Link 
            href="/" 
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E]/50 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>Página Principal (Landing)</span>
          </Link>
          <button onClick={handleLogoutClick} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[#A89588]">
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ÁREA DERECHA (HEADER + MAIN) */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 overflow-hidden">

        {/* HEADER RIGIDO */}
        <header className={`shrink-0 w-full z-30 border-b px-4 h-20 flex items-center justify-between gap-4 ${
          isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
        }`}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 rounded-xl border border-[#3D281E] text-[#A89588]">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 ml-auto">
            <Link 
              href="/" 
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#3D281E] text-xs font-semibold text-[#A89588] hover:text-[#FFF9F6] transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>Ver Web</span>
            </Link>

            <ThemeToggle />

            <div className="text-right flex flex-col items-end">
              <p className="text-xs font-bold">{userName}</p>
            </div>
            
            <Link href="/perfil" className="w-10 h-10 rounded-xl border border-[#3D281E] overflow-hidden flex items-center justify-center text-sm font-black bg-[#2A1B14] text-[#D4AF37] relative shrink-0">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{inicialNombre}</span>
              )}
            </Link>
          </div>
        </header>

        {/* ÁREA DE CONTENIDO CON SCROLL HABILITADO */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
