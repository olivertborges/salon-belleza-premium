'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Sparkles, Bell, ShoppingCart, 
  Scissors, Heart, Crown, Calendar, 
  Menu, X, LogOut, Home, CalendarPlus,
  Camera, Tag, Eye, Hand, Sparkle
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
  const [notificaciones, setNotificaciones] = useState(0)
  const [notificacionesList, setNotificacionesList] = useState<any[]>([])
  const [carritoItems] = useState(1)
  const [loadingNotis, setLoadingNotis] = useState(true)

  const isDark = theme === 'dark'

  // 🛡️ EFECTO DE CONTROL DE SCROLL EN EL BODY CUANDO SIDEBAR ESTÁ ABIERTO
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

  useEffect(() => {
    if (!user) return

    const cargarNotificaciones = async () => {
      try {
        setLoadingNotis(true)
        const { data, error } = await supabase
          .from('notifications')
          .select('id, read')
          .eq('user_id', user.id)
          .eq('read', false)

        if (error) throw error
        setNotificaciones(data?.length || 0)
        setNotificacionesList(data || [])
      } catch (error) {
        console.error('Error cargando notificaciones:', error)
      } finally {
        setLoadingNotis(false)
      }
    }

    cargarNotificaciones()

    const canalNotificaciones = supabase
      .channel('notificaciones-layout')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotificaciones(prev => prev + 1)
          setNotificacionesList(prev => [...prev, payload.new])
          try {
            const audio = new Audio('/notification.mp3')
            audio.volume = 0.3
            audio.play().catch(() => {})
          } catch (e) {}
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.read === true) {
            setNotificaciones(prev => Math.max(0, prev - 1))
            setNotificacionesList(prev => 
              prev.map(n => n.id === payload.new.id ? { ...n, read: true } : n)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canalNotificaciones)
    }
  }, [user])

  const menuItems = [
    { icon: Home, label: 'Inicio', href: '/portal' },
    { icon: CalendarPlus, label: 'Reservar Turno', href: '/agenda' },
    { icon: Calendar, label: 'Mis Citas', href: '/reservas' },
    { icon: Scissors, label: 'Peluquería', href: '/peluqueria' },
    { icon: Eye, label: 'Micropigmentación', href: '/micropigmentacion' },
    { icon: Hand, label: 'Uñas', href: '/unhas' },
    { icon: Heart, label: 'Estética', href: '/estetica' },
    { icon: Camera, label: 'Galería & Looks', href: '/galeria' },
    { icon: Tag, label: 'Ofertas Especiales', href: '/promociones' },
    { icon: Crown, label: 'Club Fresh VIP', href: '/fidelizacion' },
  ]

  const inicialNombre = user?.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : 'C'
  const primerNombre = user?.user_metadata?.full_name ? user.user_metadata.full_name.split(' ')[0] : 'Clienta'

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
    // ✅ CONTENEDOR PRINCIPAL: altura completa pero SIN overflow hidden para permitir scroll
    <div className={`h-screen w-full antialiased font-sans flex relative transition-colors duration-500 ${
      isDark 
        ? 'bg-zinc-950 text-zinc-100' 
        : 'bg-gradient-to-b from-stone-50 via-pink-50/20 to-stone-50 text-stone-900'
    }`}>

      {/* BACKDROP - MÓVIL */}
      <div 
        onClick={() => setSidebarOpen(false)} 
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-full xs:w-80 h-full border-r transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:w-72 lg:flex lg:flex-col shrink-0 overflow-y-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        isDark 
          ? 'bg-zinc-950/95 border-zinc-900 shadow-2xl shadow-black/80' 
          : 'bg-white/95 border-stone-200/80 shadow-2xl shadow-stone-300/40'
      }`}>

        {/* LOGO */}
        <div className={`p-6 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-zinc-900/60' : 'border-stone-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-md shadow-pink-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-[0.25em] block text-stone-900 dark:text-white">
                <span className="font-serif italic text-pink-500 dark:text-pink-400 lowercase tracking-normal font-normal text-sm">fresh</span> NAILS
              </span>
              <span className="text-[9px] uppercase tracking-widest font-black font-mono block text-stone-400 dark:text-zinc-500 mt-0.5">
                Studio Center
              </span>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden p-2 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MENÚ */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto overscroll-contain">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link 
                key={index} 
                href={item.href} 
                onClick={() => setSidebarOpen(false)} 
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 group relative border ${
                  isActive 
                    ? isDark 
                      ? 'bg-gradient-to-r from-pink-950/30 to-transparent border-pink-500/30 text-white shadow-sm'
                      : 'bg-gradient-to-r from-pink-50/70 to-transparent border-pink-100 text-stone-900 shadow-sm'
                    : 'border-transparent text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-zinc-900/60'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 w-1 h-5 bg-pink-500 dark:bg-pink-400 rounded-r-full" />
                )}

                <div className={`p-2 rounded-lg border transition-all duration-300 ${
                  isActive 
                    ? 'bg-white border-pink-200 text-pink-500 shadow-sm dark:bg-zinc-900 dark:border-pink-500/30 dark:text-pink-400'
                    : 'bg-stone-50 border-stone-100 text-stone-400 group-hover:border-pink-200 group-hover:text-pink-500 dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-zinc-500 dark:group-hover:border-zinc-700 dark:group-hover:text-pink-400'
                }`}>
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                </div>
                <span className="tracking-wide font-black">{item.label}</span>

                {item.href === '/promociones-cliente' && (
                  <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-500 border border-pink-500/20">
                    Nuevo
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* CERRAR SESIÓN - SIEMPRE VISIBLE */}
        <div className={`p-4 border-t shrink-0 ${
          isDark ? 'border-zinc-900/60 bg-zinc-950/40' : 'border-stone-100 bg-stone-50/30'
        }`}>
          <button 
            onClick={handleLogoutClick}
            className={`flex items-center gap-3.5 px-4 py-3 w-full rounded-xl text-xs font-bold transition-all border border-transparent group ${
              isDark
                ? 'text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-500/20'
                : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'
            }`}
          >
            <div className={`p-2 rounded-lg border transition-colors ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-500 group-hover:text-rose-400 group-hover:border-rose-500/20'
                : 'bg-white border-stone-200 text-stone-400 group-hover:text-rose-500 group-hover:border-rose-300 shadow-sm'
            }`}>
              <LogOut className="w-4 h-4" />
            </div>
            <span className="tracking-wide font-black">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL - CON SCROLL HABILITADO */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">

        {/* HEADER */}
        <header className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 md:px-8 h-20 flex items-center justify-between gap-4 shrink-0 transition-colors duration-300 ${
          isDark ? 'bg-zinc-950/80 border-zinc-900' : 'bg-white/80 border-stone-200/60'
        }`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className={`lg:hidden p-2.5 rounded-xl border transition-colors ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800' 
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 shadow-sm'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h1 className={`text-xl font-bold tracking-tight leading-none ${
                isDark ? 'text-white' : 'text-stone-900'
              }`}>
                Fresh<span className="font-light" style={{ color: '#DB5B9A' }}>Nails</span>
              </h1>
              <span className={`text-[9px] uppercase tracking-[0.25em] font-medium mt-1 ${
                isDark ? 'text-zinc-500' : 'text-stone-400'
              }`}>
                Studio Center
              </span>
            </div>
          </div>

          {/* ACCIONES */}
          <div className="flex items-center gap-3.5">
            <ThemeToggle />

            <Link 
              href="/notificaciones"
              className={`relative p-2.5 rounded-xl border transition-all hover:shadow-sm ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  : 'bg-white border-stone-200 text-stone-500 hover:text-pink-600 hover:border-pink-200 shadow-sm'
              }`}
            >
              <Bell className="w-4 h-4" />
              {notificaciones > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-pink-500 text-[9px] text-white font-black h-5 min-w-5 px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950 shadow-md">
                  {notificaciones > 99 ? '99+' : notificaciones}
                </span>
              )}
            </Link>

            <button className={`relative p-2.5 rounded-xl border transition-all ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                : 'bg-white border-stone-200 text-stone-500 hover:text-pink-600 hover:border-pink-200 shadow-sm'
            }`}>
              <ShoppingCart className="w-4 h-4" />
              {carritoItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-[9px] font-black h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-white dark:border-zinc-950 shadow-sm">
                  {carritoItems}
                </span>
              )}
            </button>

            <div className={`h-6 w-[1px] mx-1 hidden xs:block ${isDark ? 'bg-zinc-800' : 'bg-stone-200'}`}></div>

            <div className="flex items-center gap-3 pr-1">
              <div className="text-right hidden xs:block">
                <p className={`text-xs font-bold leading-none ${
                  isDark ? 'text-white' : 'text-stone-900'
                }`}>
                  {primerNombre}
                </p>
                <span className={`text-[9px] font-bold tracking-[0.15em] uppercase mt-1 block ${
                  isDark ? 'text-zinc-500' : 'text-stone-400'
                }`}>
                  VIP
                </span>
              </div>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black text-xs transition-colors shadow-sm ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 text-pink-400'
                  : 'bg-pink-50/60 border-pink-100 text-pink-600'
              }`}>
                {inicialNombre}
              </div>
            </div>
          </div>
        </header>

        {/* ✅ CONTENIDO - CON SCROLL HABILITADO */}
        <main className="flex-1 w-full p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}