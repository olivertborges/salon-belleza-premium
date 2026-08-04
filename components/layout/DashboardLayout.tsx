// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Sparkles, Scissors, Heart, Crown, Calendar, 
  Menu, X, LogOut, Home, CalendarPlus,
  Camera, Tag, Eye, Hand, User
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { supabase } from '@/lib/supabase/client'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { theme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Estados locales para el nombre y avatar sincronizados con la BD
  const [dbName, setDbName] = useState('')
  const [dbAvatarUrl, setDbAvatarUrl] = useState<string | null>(null)

  const isDark = theme === 'dark'

  useEffect(() => {
    if (sidebarOpen) {
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
    } else {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }

    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  // Cargar perfil real desde la tabla 'staff' o 'clients' para asegurar la foto actualizada
  useEffect(() => {
    const fetchUserHeaderProfile = async () => {
      if (!user?.id) return

      try {
        // 1. Intentar obtener perfil desde 'staff' primero
        const { data: staffData } = await supabase
          .from('staff')
          .select('name, photo_url, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle()

        if (staffData && (staffData.photo_url || staffData.avatar_url || staffData.name)) {
          if (staffData.name) setDbName(staffData.name)
          if (staffData.photo_url || staffData.avatar_url) {
            setDbAvatarUrl(staffData.photo_url || staffData.avatar_url)
            return
          }
        }

        // 2. Si no existe en staff, consultar en 'clients'
        const { data: clientData } = await supabase
          .from('clients')
          .select('name, avatar_url')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (clientData) {
          if (clientData.name) setDbName(clientData.name)
          if (clientData.avatar_url) setDbAvatarUrl(clientData.avatar_url)
        }
      } catch (err) {
        console.error('Error cargando foto del header:', err)
      }
    }

    fetchUserHeaderProfile()
  }, [user])

  const menuItems = [
    { icon: Home, label: 'Inicio', href: '/portal' },
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

  // Respaldo de nombre e imagen usando los metadatos de autenticación si no están en BD
  const finalName = dbName || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Usuario'
  const inicialNombre = finalName.charAt(0).toUpperCase()
  const primerNombre = finalName.split(' ')[0]
  
  const avatarUrl = dbAvatarUrl || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null

  const handleLogoutClick = async () => {
    try {
      if (signOut) await signOut()
      await supabase.auth.signOut()
      localStorage.clear()
      sessionStorage.clear()
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    } catch (error) {
      console.error('Error crítico en el logout:', error)
      window.location.href = '/login'
    }
  }

  return (
    <div className={`h-screen w-full antialiased flex relative transition-colors duration-500 overflow-hidden ${
      isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'
    }`}>

      {/* Fondo texturizado */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      {/* GLOW DE FONDO DECORATIVO */}
      {isDark && (
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/5 blur-[150px] pointer-events-none rounded-full z-0" />
      )}

      {/* BACKDROP */}
      <div 
        onClick={() => setSidebarOpen(false)} 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-500 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ============================================================ */}
      {/* SIDEBAR */}
      {/* ============================================================ */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-76 h-full border-r transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] lg:static lg:translate-x-0 flex flex-col shrink-0 ${
          sidebarOpen ? 'translate-x-0 shadow-[25px_0_50px_-15px_rgba(0,0,0,0.3)]' : '-translate-x-full'
        } ${
          isDark ? 'bg-[#1E120C]/95 border-[#3D281E]' : 'bg-[#FFF9F6]/95 border-[#F0E4DA]'
        }`}
      >
        {/* LOGO AREA */}
        <div className={`p-6 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
        }`}>
          <div className="flex items-center gap-2.5 group cursor-default">
            <Sparkles className="w-4 h-4 text-[#D4AF37] opacity-80 group-hover:rotate-12 transition-transform duration-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-light tracking-[0.3em] uppercase leading-tight">
                <span className="font-serif italic text-[#D4AF37] text-xl tracking-normal normal-case font-medium mr-1">fresh</span>
                <span className={isDark ? 'text-[#FFF9F6]/90' : 'text-[#1A0E0A]/90'}>Nails</span>
              </span>
              <span className={`text-[8px] uppercase tracking-[0.4em] font-light block mt-0.5 border-t pt-0.5 ${
                isDark ? 'text-[#A89588]/60 border-[#3D281E]' : 'text-[#5C4A3E]/60 border-[#F0E4DA]'
              }`}>
                Studio Center
              </span>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className={`lg:hidden p-2 rounded-xl transition-all ${
              isDark ? 'text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E]' : 'text-[#A89588] hover:text-[#1A0E0A] hover:bg-[#F0E4DA]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MENÚ */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-[#D4AF37]/20">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link 
                key={index} 
                href={item.href} 
                onClick={() => setSidebarOpen(false)} 
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-300 group relative border ${
                  isActive 
                    ? isDark 
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]'
                      : 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]'
                    : 'border-transparent text-[#A89588] hover:text-[#1A0E0A] dark:hover:text-[#FFF9F6] hover:bg-[#D4AF37]/5'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 w-1 h-6 rounded-r-full bg-[#D4AF37]" />
                )}

                <div className={`p-2 rounded-lg border transition-all duration-300 transform group-hover:scale-105 ${
                  isActive 
                    ? 'bg-[#D4AF37] border-[#D4AF37] text-[#1A0E0A] shadow-md shadow-[#D4AF37]/20'
                    : isDark
                      ? 'bg-[#2A1B14] border-[#3D281E] text-[#A89588] group-hover:border-[#D4AF37]/30 group-hover:text-[#D4AF37]'
                      : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#A89588] group-hover:border-[#D4AF37]/30 group-hover:text-[#D4AF37]'
                }`}>
                  <Icon className={`w-4 h-4 transition-transform duration-500 ${isActive ? '' : 'group-hover:rotate-6'}`} />
                </div>

                <span className="tracking-wide font-medium">{item.label}</span>

                {item.href === '/promociones' && (
                  <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 animate-pulse">
                    HOT
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* LOGOUT BOTÓN */}
        <div className={`p-4 border-t shrink-0 ${
          isDark ? 'border-[#3D281E] bg-[#1E120C]/50' : 'border-[#F0E4DA] bg-[#FFF9F6]/50'
        }`}>
          <button 
            onClick={handleLogoutClick}
            className={`flex items-center gap-3.5 px-4 py-3 w-full rounded-xl text-xs font-semibold transition-all border border-transparent group ${
              isDark
                ? 'text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E] hover:border-[#D4AF37]/20'
                : 'text-[#5C4A3E] hover:text-[#1A0E0A] hover:bg-[#F0E4DA] hover:border-[#D4AF37]/20'
            }`}
          >
            <div className={`p-2 rounded-lg border transition-all duration-300 ${
              isDark
                ? 'bg-[#2A1B14] border-[#3D281E] text-[#A89588] group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/30 group-hover:rotate-6'
                : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#A89588] group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/30 group-hover:rotate-6'
            }`}>
              <LogOut className="w-4 h-4" />
            </div>
            <span className="tracking-wide">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* VISTA PRINCIPAL CONTENIDO */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">

        {/* HEADER */}
        <header className={`sticky top-0 z-30 border-b px-4 md:px-8 h-20 flex items-center justify-between gap-4 shrink-0 transition-all duration-300 ${
          isDark ? 'bg-[#1E120C]/80 border-[#3D281E] backdrop-blur-xl' : 'bg-[#FFF9F6]/80 border-[#F0E4DA] backdrop-blur-xl'
        }`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className={`lg:hidden p-2.5 rounded-xl border transition-all active:scale-95 ${
                isDark 
                  ? 'bg-[#2A1B14] border-[#3D281E] text-[#A89588] hover:bg-[#3D281E]' 
                  : 'bg-white border-[#F0E4DA] text-[#5C4A3E] hover:bg-[#FFF9F6] shadow-sm'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col lg:hidden">
              <h1 className="text-base font-light tracking-[0.2em] uppercase leading-none">
                <span className="font-serif italic text-[#D4AF37] text-lg tracking-normal normal-case font-medium mr-0.5">fresh</span>
                <span className={isDark ? 'text-[#FFF9F6]/90' : 'text-[#1A0E0A]/90'}>Nails</span>
              </h1>
            </div>
          </div>

          {/* ACCIONES DEL HEADER (Barra Superior con Foto) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <div className={`h-5 w-[1px] mx-1 ${isDark ? 'bg-[#3D281E]' : 'bg-[#F0E4DA]'}`} />

            {/* Perfil VIP / Staff — CLICKEABLE CON FOTO DE LA PERSONA */}
            <Link 
              href="/perfil"
              className="flex items-center gap-2.5 sm:gap-3 pl-1 group cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className={`text-xs font-bold leading-none transition-colors group-hover:text-[#D4AF37] ${
                  isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                }`}>
                  {primerNombre}
                </p>
                <span className="text-[8px] font-black tracking-[0.2em] uppercase mt-1 block bg-gradient-to-r from-[#D4AF37] to-[#E8D5A0] bg-clip-text text-transparent">
                  VIP MEMBER
                </span>
              </div>
              
              {/* Contenedor Avatar con imagen de la BD */}
              <div className={`relative w-10 h-10 rounded-xl border overflow-hidden flex items-center justify-center font-black text-xs transition-all duration-300 shadow-sm ring-offset-2 ring-0 group-hover:ring-2 group-hover:ring-[#D4AF37] shrink-0 ${
                isDark
                  ? 'bg-[#2A1B14] border-[#3D281E] text-[#D4AF37] ring-offset-[#1E120C]'
                  : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#D4AF37] ring-offset-[#FFF9F6]'
              }`}>
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={`Foto de ${primerNombre}`} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      // Respaldo por si la imagen da error de carga
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <span>{inicialNombre}</span>
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 w-full p-4 md:p-8 overflow-y-auto bg-transparent transition-all duration-300">
          <div className="max-w-7xl mx-auto animate-[fadeIn_0.4s_ease-out]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
