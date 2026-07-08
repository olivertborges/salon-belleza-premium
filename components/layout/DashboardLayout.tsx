'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Sparkles, Bell, ShoppingCart, 
  Scissors, Heart, Crown, Calendar, 
  Menu, X, LogOut, Home, CalendarPlus,
  Camera, Tag  // ✅ Agregamos Tag para el ícono de promociones
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { supabase } from '@/lib/supabase/client'
import { SidebarGalleryWidget } from '@/app/(client)/galeria/page' 

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

  // ✅ CARGAR NOTIFICACIONES NO LEÍDAS
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

    // ✅ ESCUCHAR NUEVAS NOTIFICACIONES EN TIEMPO REAL
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

  // 📋 MENÚ DE NAVEGACIÓN - AGREGAMOS PROMOCIONES
  const menuItems = [
    { icon: Home, label: 'Inicio', href: '/portal' },
    { icon: CalendarPlus, label: 'Reservar Turno', href: '/agenda' },
    { icon: Calendar, label: 'Mis Citas', href: '/reservas' },
    { icon: Scissors, label: 'Peluquería & Estilo', href: '/peluqueria' },
    { icon: Heart, label: 'Cuidado & Estética', href: '/estetica' },
    { icon: Camera, label: 'Galería & Looks', href: '/galeria' },
    { icon: Tag, label: 'Ofertas Especiales', href: '/promociones' }, // ✅ NUEVO: Página de promociones
    { icon: Crown, label: 'Club Fresh VIP', href: '/fidelizacion' },
  ]

  const inicialNombre = user?.name ? user.name.charAt(0).toUpperCase() : 'C'
  const primerNombre = user?.name ? user.name.split(' ')[0] : 'Clienta'

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
    <div className={`h-screen w-full antialiased font-sans flex relative overflow-hidden transition-all duration-500 ${
      isDark ? 'bg-stone-950 text-stone-100' : 'bg-gradient-to-b from-pink-50/40 via-amber-50/20 to-stone-50/40 text-stone-900'
    }`}>

      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-stone-950/40 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* 🔮 ASIDE SIDEBAR PREMIUM ATELIER */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 h-full border-r transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:flex lg:flex-col shrink-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        isDark ? 'bg-stone-950/80 border-stone-900 backdrop-blur-xl' : 'bg-white/95 border-pink-100/80 backdrop-blur-xl'
      }`}>

        {/* LOGO AREA */}
        <div className={`p-6 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-stone-900/60' : 'border-pink-100/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 dark:from-pink-600 dark:to-neutral-900 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-[0.25em] block text-stone-800 dark:text-stone-100">
                SALON <span className="font-serif italic text-pink-500 dark:text-pink-400 lowercase tracking-normal font-normal text-sm">fresh nails</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest font-black font-mono block text-stone-400 dark:text-stone-500 mt-0.5">
                Nails & Estética
              </span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-stone-400 hover:text-pink-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MENÚ DE NAVEGACIÓN CHIC */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link 
                key={index} 
                href={item.href} 
                onClick={() => setSidebarOpen(false)} 
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-300 group relative border ${
                  isActive 
                    ? isDark 
                      ? 'bg-gradient-to-r from-pink-950/30 via-stone-900/40 to-transparent border-pink-500/30 text-white shadow-[0_4px_20px_rgba(236,72,153,0.05)]'
                      : 'bg-gradient-to-r from-pink-100/50 via-pink-50/20 to-transparent border-pink-200 text-stone-900 shadow-[0_4px_20px_rgba(236,72,153,0.08)]'
                    : 'border-transparent text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-pink-50/30 dark:hover:bg-stone-900/40'
                }`}
              >
                {/* Indicador Izquierdo */}
                {isActive && (
                  <span className="absolute left-0 w-1 h-5 bg-pink-500 dark:bg-pink-400 rounded-r-full" />
                )}

                <div className={`p-2 rounded-xl border transition-all duration-300 ${
                  isActive 
                    ? 'bg-white border-pink-200 text-pink-500 shadow-sm dark:bg-stone-900 dark:border-pink-500/20 dark:text-pink-400'
                    : 'bg-stone-50 border-stone-200 text-stone-400 group-hover:border-pink-200 group-hover:text-pink-500 dark:bg-stone-900/60 dark:border-stone-800 dark:text-stone-500 dark:group-hover:border-stone-700 dark:group-hover:text-pink-400'
                }`}>
                  <Icon className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                </div>
                <span className="tracking-wide font-black">{item.label}</span>

                {/* Badge de "Nuevo" para Promociones */}
                {item.href === '/promociones' && (
                  <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-500 border border-pink-500/20 animate-pulse">
                    Nuevo
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* 📸 WIDGET DE PREVISUALIZACIÓN DE LA BITÁCORA */}
        <div className="shrink-0 px-1">
          <SidebarGalleryWidget />
        </div>

        {/* BOTÓN CERRAR SESIÓN */}
        <div className={`p-4 border-t shrink-0 ${
          isDark ? 'border-stone-900/60 bg-stone-950/40' : 'border-pink-100/40 bg-pink-50/10'
        }`}>
          <button 
            onClick={handleLogoutClick}
            className={`flex items-center gap-3.5 px-4 py-3 w-full rounded-2xl text-xs font-bold transition-all border border-transparent group ${
              isDark
                ? 'text-stone-400 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-500/20'
                : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'
            }`}
          >
            <div className={`p-2 rounded-xl border transition-colors ${
              isDark
                ? 'bg-stone-900 border-stone-800 text-stone-500 group-hover:text-rose-400 group-hover:border-rose-500/20'
                : 'bg-stone-100 border-stone-200 text-stone-400 group-hover:text-rose-500 group-hover:border-rose-300'
            }`}>
              <LogOut className="w-3.5 h-3.5" />
            </div>
            <span className="tracking-wide font-black">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* 👑 CONTENIDO PRINCIPAL Y HEADER FLUIDO */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 overflow-hidden">
        {/* HEADER EXTRA PREMIUM */}
        <header className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 md:px-8 h-20 flex items-center justify-between gap-4 shrink-0 transition-colors duration-300 ${
          isDark ? 'bg-stone-950/80 border-stone-900' : 'bg-white/80 border-pink-100/60'
        }`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className={`lg:hidden p-2.5 rounded-xl border transition-colors ${
              isDark ? 'bg-stone-900 border-stone-800 text-stone-400' : 'bg-white border-pink-100 text-stone-600 shadow-sm'
            }`}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-serif italic tracking-tight text-stone-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-pink-200 dark:via-pink-400 dark:to-amber-200">
                {!isDark && <span className="text-stone-950">Salon </span>}Fresh Nails
              </h1>
              <span className="text-[9px] uppercase tracking-[0.25em] hidden sm:block font-black font-mono text-stone-400 dark:text-stone-500 mt-0.5">
                Tu Santuario Personal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <ThemeToggle />

            {/* NOTIFICACIONES */}
            <Link 
              href="/notificaciones"
              className={`relative p-2.5 rounded-xl border transition-all hover:shadow-md ${
                isDark
                  ? 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-100 hover:border-stone-700'
                  : 'bg-white border-pink-100 text-stone-500 hover:text-pink-600 hover:border-pink-200 shadow-sm'
              }`}
            >
              <Bell className="w-4 h-4" />
              {notificaciones > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-pink-500 to-pink-600 text-[9px] text-white font-black h-5 min-w-5 px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-stone-950 shadow-md">
                  {notificaciones > 99 ? '99+' : notificaciones}
                </span>
              )}
            </Link>

            {/* CARRITO */}
            <button className={`relative p-2.5 rounded-xl border transition-all ${
              isDark
                ? 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-100 hover:border-stone-700'
                : 'bg-white border-pink-100 text-stone-500 hover:text-pink-600 hover:border-pink-200 shadow-sm'
            }`}>
              <ShoppingCart className="w-4 h-4" />
              {carritoItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-stone-950 dark:bg-white text-white dark:text-stone-950 text-[9px] font-black h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-white dark:border-stone-950 shadow-sm">
                  {carritoItems}
                </span>
              )}
            </button>

            <div className={`h-6 w-[1px] mx-1 hidden xs:block ${isDark ? 'bg-stone-800' : 'bg-pink-100'}`}></div>

            {/* PERFIL DIGITAL */}
            <div className="flex items-center gap-3 pr-1">
              <div className="text-right hidden xs:block">
                <p className="text-xs font-black tracking-tight text-stone-800 dark:text-stone-200 leading-none">
                  {primerNombre}
                </p>
                <span className="text-[9px] font-black font-mono tracking-widest uppercase text-pink-500 dark:text-pink-400 block mt-1">
                  MEMBER VIP
                </span>
              </div>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black text-xs shadow-inner transition-colors ${
                isDark
                  ? 'bg-stone-900 border-stone-800 text-pink-400'
                  : 'bg-pink-50/60 border-pink-100 text-pink-600'
              }`}>
                {inicialNombre}
              </div>
            </div>
          </div>
        </header>

        {/* ÁREA CENTRAL DE CONTENIDO CONTINUO */}
        <main className="flex-1 w-full p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}