'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Sparkles, Bell, ShoppingCart, 
  Scissors, Heart, Crown, Calendar, 
  Menu, X, LogOut, Home, CalendarPlus,
  Camera, Tag, Eye, Hand
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
  const [animateBell, setAnimateBell] = useState(false)

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
          setAnimateBell(true)
          setTimeout(() => setAnimateBell(false), 1200)
          try {
            const audio = new Audio('/notification.mp3')
            audio.volume = 0.25
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
    <div className={`h-screen w-full antialiased flex relative transition-colors duration-700 overflow-hidden selection:bg-pink-200 dark:selection:bg-pink-900/40 ${
      isDark 
        ? 'bg-[#09090b] text-zinc-100' 
        : 'bg-gradient-to-br from-stone-50 via-pink-50/30 to-stone-100 text-stone-900'
    }`}>
      
      {/* GLOW DE FONDO DECORATIVO (Solo modo oscuro para dar profundidad de neón) */}
      {isDark && (
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-600/5 blur-[150px] pointer-events-none rounded-full z-0" />
      )}

      {/* BACKDROP CON BLUR INTEGRADO */}
      <div 
        onClick={() => setSidebarOpen(false)} 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-500 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ============================================================ */}
      {/* SIDEBAR ULTRA PREMIUM */}
      {/* ============================================================ */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-76 h-full border-r transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] lg:static lg:translate-x-0 flex flex-col shrink-0 ${
          sidebarOpen ? 'translate-x-0 shadow-[25px_0_50px_-15px_rgba(0,0,0,0.3)]' : '-translate-x-full'
        } ${
          isDark 
            ? 'bg-zinc-950/80 border-zinc-900/80 backdrop-blur-xl' 
            : 'bg-white/80 border-stone-200/60 backdrop-blur-xl'
        }`}
      >
        {/* LOGO AREA */}
        <div className={`p-6 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-zinc-900/40' : 'border-stone-100'
        }`}>
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 flex items-center justify-center shadow-lg shadow-pink-500/20 transition-transform duration-500 group-hover:rotate-12">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-sm font-black uppercase tracking-[0.2em] block">
                <span className="font-serif italic text-pink-500 dark:text-pink-400 lowercase tracking-normal font-medium text-lg mr-0.5">fresh</span>NAILS
              </span>
              <span className="text-[9px] uppercase tracking-[0.3em] font-bold block text-stone-400 dark:text-zinc-500 mt-0.5">
                Studio Center
              </span>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden p-2 rounded-xl text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-900 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MENÚ - SCROLL ANIMADO */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-pink-500/20">
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
                      ? 'bg-gradient-to-r from-pink-500/10 via-pink-500/5 to-transparent border-pink-500/30 text-pink-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                      : 'bg-gradient-to-r from-pink-500/5 via-pink-500/[0.01] to-transparent border-pink-200/60 text-pink-600 shadow-sm'
                    : 'border-transparent text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-stone-100/60 dark:hover:bg-zinc-900/40'
                }`}
              >
                {/* Indicador Flotante Activo */}
                {isActive && (
                  <span className="absolute left-0 w-1 h-6 bg-gradient-to-b from-pink-500 to-rose-500 rounded-r-full animate-fade-in" />
                )}

                {/* Contenedor del Ícono */}
                <div className={`p-2 rounded-lg border transition-all duration-300 transform group-hover:scale-105 ${
                  isActive 
                    ? 'bg-gradient-to-br from-pink-500 to-rose-500 border-transparent text-white shadow-md shadow-pink-500/10'
                    : 'bg-stone-50 border-stone-200/40 text-stone-400 group-hover:border-pink-200 group-hover:text-pink-500 dark:bg-zinc-900/50 dark:border-zinc-800/60 dark:text-zinc-500 dark:group-hover:border-pink-500/30 dark:group-hover:text-pink-400'
                }`}>
                  <Icon className={`w-4 h-4 transition-transform duration-500 ${isActive ? '' : 'group-hover:rotate-6'}`} />
                </div>
                
                <span className="tracking-wide font-medium">{item.label}</span>

                {item.href === '/promociones' && (
                  <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                    HOT
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* LOGOUT BOTÓN */}
        <div className={`p-4 border-t shrink-0 ${
          isDark ? 'border-zinc-900/60 bg-zinc-950/20' : 'border-stone-100 bg-stone-50/20'
        }`}>
          <button 
            onClick={handleLogoutClick}
            className={`flex items-center gap-3.5 px-4 py-3 w-full rounded-xl text-xs font-semibold transition-all border border-transparent group ${
              isDark
                ? 'text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-500/10'
                : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50/60 hover:border-rose-200/60'
            }`}
          >
            <div className={`p-2 rounded-lg border transition-all duration-300 ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-500 group-hover:text-rose-400 group-hover:border-rose-500/20 group-hover:rotate-6'
                : 'bg-white border-stone-200 text-stone-400 group-hover:text-rose-500 group-hover:border-rose-300 shadow-sm group-hover:rotate-6'
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

        {/* HEADER MODERNO */}
        <header className={`sticky top-0 z-30 border-b px-4 md:px-8 h-20 flex items-center justify-between gap-4 shrink-0 transition-all duration-300 ${
          isDark ? 'bg-zinc-950/60 border-zinc-900/60 backdrop-blur-xl' : 'bg-white/60 border-stone-200/40 backdrop-blur-xl'
        }`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className={`lg:hidden p-2.5 rounded-xl border transition-all active:scale-95 ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800' 
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 shadow-sm'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col lg:hidden">
              <h1 className="text-lg font-black tracking-tight leading-none">
                Fresh<span className="font-serif italic text-pink-500">Nails</span>
              </h1>
            </div>
          </div>

          {/* ACCIONES DEL HEADER ACCESIBLES */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Notificaciones con campana oscilante */}
            <Link 
              href="/notificaciones"
              className={`relative p-2.5 rounded-xl border transition-all active:scale-95 ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700'
                  : 'bg-white border-stone-200 text-stone-500 hover:text-pink-600 hover:border-pink-200 shadow-sm'
              } ${animateBell ? 'animate-[bounce_0.5s_ease-in-out_infinite]' : ''}`}
            >
              <Bell className={`w-4 h-4 ${animateBell ? 'text-pink-500' : ''}`} />
              {notificaciones > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-rose-500 text-[9px] text-white font-black h-5 min-w-5 px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950 shadow-md animate-fade-in">
                  {notificaciones > 99 ? '99+' : notificaciones}
                </span>
              )}
            </Link>

            {/* Carrito */}
            <button className={`relative p-2.5 rounded-xl border transition-all active:scale-95 ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700'
                : 'bg-white border-stone-200 text-stone-500 hover:text-pink-600 hover:border-pink-200 shadow-sm'
            }`}>
              <ShoppingCart className="w-4 h-4" />
              {carritoItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[9px] font-bold h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center border border-white dark:border-zinc-950 shadow-sm">
                  {carritoItems}
                </span>
              )}
            </button>

            <div className={`h-5 w-[1px] mx-1 hidden xs:block ${isDark ? 'bg-zinc-800' : 'bg-stone-200'}`} />

            {/* Perfil VIP */}
            <div className="flex items-center gap-3 pl-1 group cursor-pointer">
              <div className="text-right hidden xs:block">
                <p className={`text-xs font-bold leading-none transition-colors group-hover:text-pink-500 ${
                  isDark ? 'text-zinc-200' : 'text-stone-800'
                }`}>
                  {primerNombre}
                </p>
                <span className="text-[8px] font-black tracking-[0.2em] uppercase mt-1 block bg-gradient-to-r from-amber-500 to-yellow-400 bg-clip-text text-transparent">
                  VIP MEMBER
                </span>
              </div>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-xs transition-all duration-300 shadow-sm group-hover:scale-105 ${
                isDark
                  ? 'bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-800 text-pink-400 group-hover:border-pink-500/30'
                  : 'bg-gradient-to-br from-pink-50 to-pink-100/50 border-pink-100 text-pink-600 group-hover:border-pink-300'
              }`}>
                {inicialNombre}
              </div>
            </div>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL CON SUAVIZADO DE SCROLL */}
        <main className="flex-1 w-full p-4 md:p-8 overflow-y-auto bg-transparent transition-all duration-300">
          <div className="max-w-7xl mx-auto animate-[fadeIn_0.4s_ease-out]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
