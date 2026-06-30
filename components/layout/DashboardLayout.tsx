'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Sparkles, Bell, ShoppingCart, 
  Scissors, Heart, Crown, Calendar, 
  Menu, X, Store, LogOut, Home, CalendarPlus
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
          console.log('🔔 Nueva notificación en tiempo real:', payload.new)
          setNotificaciones(prev => prev + 1)
          setNotificacionesList(prev => [...prev, payload.new])

          // 🔊 Sonido de notificación (opcional)
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
          // Actualizar contador cuando se marcan como leídas
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

  // ✅ MARCAR TODAS COMO LEÍDAS AL HACER CLICK EN EL BOTÓN
  const marcarTodasLeidas = async () => {
    if (!user || notificaciones === 0) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error

      setNotificaciones(0)
      setNotificacionesList(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Error marcando notificaciones como leídas:', error)
    }
  }

  // ✅ ELIMINAR UNA NOTIFICACIÓN
  const eliminarNotificacion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error

      setNotificacionesList(prev => prev.filter(n => n.id !== id))
      setNotificaciones(prev => {
        const notif = notificacionesList.find(n => n.id === id)
        return notif?.read === false ? Math.max(0, prev - 1) : prev
      })
    } catch (error) {
      console.error('Error eliminando notificación:', error)
    }
  }

  const menuItems = [
    { icon: Home, label: 'Inicio', href: '/portal' },
    { icon: CalendarPlus, label: 'Reservar Turno', href: '/agenda' },
    { icon: Calendar, label: 'Mis Citas', href: '/reservas' },
    /*{ icon: Store, label: 'Boutique Fresh', href: '/productos' }*/,
    { icon: Scissors, label: 'Peluquería & Estilo', href: '/peluqueria' },
    { icon: Heart, label: 'Cuidado & Estética', href: '/estetica' },
    { icon: Crown, label: 'Club Fresh VIP', href: '/fidelizacion' },
  ]

  const inicialNombre = user?.name ? user.name.charAt(0).toUpperCase() : 'C'
  const primerNombre = user?.name ? user.name.split(' ')[0] : 'Clienta'

  const handleLogoutClick = async () => {
    try {
      if (signOut) {
        await signOut()
      }
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      router.push('/login')
    }
  }

  return (
    <div className={`h-screen w-full antialiased font-sans flex relative overflow-hidden m-0 p-0 transition-colors duration-300 ${
      isDark ? 'bg-[#090807]' : 'bg-[#faf8f6]'
    }`}>

      {/* FONDO OSCURO INTERACTIVO MÓVIL */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 h-full border-r backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:flex lg:flex-col shrink-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        isDark ? 'bg-[#0e0c0b] border-stone-900/80' : 'bg-white border-stone-200'
      }`}>

        <div className={`p-6 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-stone-900' : 'border-stone-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.25)]">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className={`text-sm font-bold uppercase tracking-[0.2em] block ${
                isDark ? 'text-stone-100' : 'text-stone-900'
              }`}>
                Fresh Nails
              </span>
              <span className={`text-[9px] uppercase tracking-widest font-mono block ${
                isDark ? 'text-stone-500' : 'text-stone-400'
              }`}>
                Estética Integral
              </span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className={`lg:hidden p-2 transition-colors ${
            isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
          }`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link 
                key={index} 
                href={item.href} 
                onClick={() => setSidebarOpen(false)} 
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-medium border transition-all ${
                  isActive 
                    ? isDark 
                      ? 'bg-gradient-to-r from-rose-950/40 via-stone-900/40 to-transparent border-rose-500/30 text-white'
                      : 'bg-gradient-to-r from-rose-100/40 via-stone-100/40 to-transparent border-rose-300 text-stone-900'
                    : isDark
                      ? 'border-transparent text-stone-400 hover:text-stone-100 hover:bg-stone-900/30'
                      : 'border-transparent text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <div className={`p-1.5 rounded-lg border transition-colors ${
                  isActive 
                    ? isDark
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      : 'bg-rose-50 border-rose-200 text-rose-600'
                    : isDark
                      ? 'bg-stone-950 border-stone-800 text-stone-500'
                      : 'bg-stone-100 border-stone-200 text-stone-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className={`p-4 border-t shrink-0 ${
          isDark ? 'border-stone-900/60 bg-[#0c0a09]' : 'border-stone-200/60 bg-stone-50'
        }`}>
          <button 
            onClick={handleLogoutClick}
            className={`flex items-center gap-3.5 px-4 py-3 w-full rounded-xl text-xs font-medium transition-all group ${
              isDark
                ? 'text-stone-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-500/20'
                : 'text-stone-500 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200'
            }`}
          >
            <div className={`p-1.5 rounded-lg border transition-colors ${
              isDark
                ? 'bg-stone-950 border-stone-800 text-stone-500 group-hover:text-rose-400 group-hover:border-rose-500/10'
                : 'bg-stone-100 border-stone-200 text-stone-400 group-hover:text-rose-500 group-hover:border-rose-300'
            }`}>
              <LogOut className="w-4 h-4" />
            </div>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 overflow-hidden">

        {/* HEADER */}
        <header className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 md:px-8 h-20 flex items-center justify-between gap-4 shrink-0 transition-colors duration-300 ${
          isDark
            ? 'bg-[#090807]/80 border-stone-900'
            : 'bg-white/80 border-stone-200'
        }`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className={`lg:hidden p-2.5 rounded-xl border transition-colors ${
              isDark
                ? 'bg-stone-900 border-stone-800 text-stone-400'
                : 'bg-stone-100 border-stone-200 text-stone-500'
            }`}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h1 className={`text-xl md:text-2xl font-serif italic tracking-tight ${
                isDark
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-rose-400 to-amber-200'
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600'
              }`}>
                Fresh Nails
              </h1>
              <span className={`text-[10px] uppercase tracking-[0.25em] hidden sm:block font-mono ${
                isDark ? 'text-stone-500' : 'text-stone-400'
              }`}>
                Panel de Clientes
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <ThemeToggle />

            {/* ✅ BOTÓN DE NOTIFICACIONES CON CONTADOR REAL */}
            <Link 
              href="/notificaciones"
              className={`relative p-2.5 rounded-xl border transition-all hover:shadow-lg ${
                isDark
                  ? 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-100 hover:border-stone-700'
                  : 'bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-300'
              }`}
            >
              <Bell className="w-4 h-4" />
              {notificaciones > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-600 to-amber-500 text-[9px] text-white font-bold h-5 min-w-5 px-1 rounded-full flex items-center justify-center border-2 border-background shadow-lg shadow-rose-500/20">
                  {notificaciones > 99 ? '99+' : notificaciones}
                </span>
              )}
            </Link>

            <button className={`relative p-2.5 rounded-xl border transition-all ${
              isDark
                ? 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-100 hover:border-stone-700'
                : 'bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-300'
            }`}>
              <ShoppingCart className="w-4 h-4" />
              {carritoItems > 0 && (
                <span className={`absolute -top-1 -right-1 bg-gradient-to-r from-rose-600 to-amber-500 text-[9px] text-white font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center border ${
                  isDark ? 'border-[#090807]' : 'border-white'
                }`}>
                  {carritoItems}
                </span>
              )}
            </button>

            <div className={`h-6 w-[1px] mx-1 hidden xs:block ${isDark ? 'bg-stone-800' : 'bg-stone-200'}`}></div>

            <div className="flex items-center gap-2.5 pr-2">
              <div className="text-right hidden xs:block">
                <p className={`text-xs font-medium leading-none transition-colors ${
                  isDark ? 'text-stone-200' : 'text-stone-800'
                }`}>
                  {primerNombre}
                </p>
                <span className={`text-[9px] font-mono tracking-wider uppercase transition-colors ${
                  isDark ? 'text-rose-400' : 'text-rose-600'
                }`}>
                  En línea
                </span>
              </div>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold shadow-inner transition-colors ${
                isDark
                  ? 'bg-stone-900 border-stone-800 text-rose-400'
                  : 'bg-stone-200 border-stone-300 text-rose-600'
              }`}>
                {inicialNombre}
              </div>
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main className={`flex-1 w-full p-4 md:p-8 overflow-y-auto transition-colors duration-300 ${
          isDark ? 'bg-[#090807]' : 'bg-[#faf8f6]'
        }`}>
          {children}
        </main>
      </div>
    </div>
  )
}
