'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import {
  LayoutDashboard, Calendar, Users, Sparkles, History,
  XCircle, ShoppingBag, GraduationCap, Sliders, UsersRound,
  Sun, Moon, ChevronLeft, ChevronRight, Power, X
} from 'lucide-react'

interface AdminSidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  isOpen: boolean
  onClose: () => void
}

const ALL_MENU_ITEMS = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/admin', color: 'border-rose-500 text-rose-400 bg-rose-950/20' },
  { id: 'agenda', name: 'Agenda', icon: Calendar, path: '/admin/agenda', color: 'border-cyan-500 text-cyan-400 bg-cyan-950/20' },
  { id: 'historial', name: 'Historial', icon: History, path: '/admin/historial', color: 'border-amber-500 text-amber-400 bg-amber-950/20' },
  { id: 'clientes', name: 'Clientas VIP', icon: Users, path: '/clientes', color: 'border-emerald-500 text-emerald-400 bg-emerald-950/20' },
  { id: 'servicios', name: 'Servicios', icon: Sparkles, path: '/servicios', color: 'border-amber-500 text-amber-400 bg-amber-950/20' },
  { id: 'productos', name: 'Productos / Tienda', icon: ShoppingBag, path: '/productos', color: 'border-violet-500 text-violet-400 bg-violet-950/20' },
  { id: 'cursos', name: 'Cursos / Academia', icon: GraduationCap, path: '/admin/cursos', color: 'border-fuchsia-500 text-fuchsia-400 bg-fuchsia-950/20' },
  { id: 'cancelaciones', name: 'Cancelaciones', icon: XCircle, path: '/cancelaciones', color: 'border-red-500 text-red-400 bg-red-950/20' },
  { id: 'staff', name: 'Staff Equipo', icon: UsersRound, path: '/admin/staff', color: 'border-indigo-500 text-indigo-400 bg-indigo-950/20' },
  { id: 'configuracion', name: 'Configuración', icon: Sliders, path: '/admin/configuracion', color: 'border-stone-500 text-stone-300 bg-stone-900/40' },
]

export default function AdminSidebar({ collapsed, setCollapsed, isOpen, onClose }: AdminSidebarProps) {
  const { user, role, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [darkMode, setDarkMode] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [currentPath, setCurrentPath] = useState(pathname)
  const [userRole, setUserRole] = useState<string>('admin')
  const [forceRender, setForceRender] = useState(0)

  // Obtener el rol del usuario
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        if (role) {
          setUserRole(role)
          return
        }
        if (user?.id) {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          if (!error && data) {
            setUserRole(data.role || 'admin')
          }
        }
      } catch (error) {
        console.error('Error obteniendo rol:', error)
      }
    }
    fetchUserRole()
  }, [user, role])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setCurrentPath(pathname)
  }, [pathname])

  // Recuperar menú al desbloquear
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setCurrentPath(window.location.pathname)
        setForceRender(prev => prev + 1)
        if (user?.id) {
          supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setUserRole(data.role || 'admin')
                setForceRender(prev => prev + 1)
              }
            })
        }
      }
    }

    const handleFocus = () => {
      setCurrentPath(window.location.pathname)
      setForceRender(prev => prev + 1)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user])

  const isAdmin = userRole === 'admin' || userRole === 'staff'
  const visibleMenu = isAdmin ? ALL_MENU_ITEMS : ALL_MENU_ITEMS.slice(0, 4)

  const handleNavigation = (path: string) => {
    router.push(path)
    onClose()
  }

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

  if (!mounted) {
    return (
      <div className="w-72 h-screen bg-[#0e0c0b] border-r border-stone-900/80 animate-pulse">
        <div className="p-4 border-b border-stone-900">
          <div className="w-8 h-8 rounded-xl bg-stone-800"></div>
        </div>
      </div>
    )
  }

  // USAR EL PATHNAME REAL PARA DETERMINAR QUÉ ESTÁ ACTIVO
  const activePath = currentPath || pathname || '/admin'

  // Función para determinar si un item está activo
  const isItemActive = (itemPath: string) => {
    // Si es dashboard (/admin), solo activo cuando EXACTAMENTE es /admin
    if (itemPath === '/admin') {
      return activePath === '/admin'
    }
    // Para los demás, si empieza con la ruta
    return activePath?.startsWith(itemPath + '/') || activePath === itemPath
  }

  return (
    <>
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen bg-[#0e0c0b] border-r border-stone-900/80
        transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${collapsed ? 'w-[72px]' : 'w-72'}
      `}>
        {/* HEADER */}
        <div className="p-4 border-b border-stone-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.25)] flex-shrink-0">
              <span className="text-white text-sm">💅</span>
            </div>
            {!collapsed && (
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-100 block">Fresh Nails</span>
                <span className="text-[8px] uppercase tracking-widest text-stone-500 font-mono block">{userRole} Control</span>
              </div>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="lg:hidden p-1.5 rounded-lg hover:bg-stone-900 transition-colors text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PERFIL */}
        {!collapsed && (
          <div className="mx-4 mt-4 p-3 bg-stone-900/30 border border-stone-900/80 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center font-bold text-rose-400 text-xs">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-stone-200 truncate">{user?.email || 'Administrador'}</p>
                <span className="text-[8px] font-mono tracking-wider text-amber-400/80 uppercase block">En Línea</span>
              </div>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* MENÚ - CON DETECCIÓN CORRECTA DE ACTIVO */}
        <nav key={`menu-${forceRender}`} className={`flex-1 p-3 space-y-1 overflow-y-auto ${collapsed ? 'px-2' : ''}`}>
          {visibleMenu.map((item) => {
            const Icon = item.icon
            const isActive = isItemActive(item.path)

            return (
              <button
                key={`${item.id}-${forceRender}`}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                  isActive 
                    ? `${item.color}` 
                    : 'border-transparent text-stone-400 hover:text-stone-100 hover:bg-stone-900/30'
                } ${collapsed ? 'justify-center px-2' : ''}`}
                title={collapsed ? item.name : ''}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.name}</span>}
                {isActive && <span className="ml-auto w-1 h-6 rounded-full bg-current opacity-60"></span>}
              </button>
            )
          })}
        </nav>

        {/* RESUMEN */}
        {!collapsed && (
          <div className="mx-4 mb-2 p-4 bg-[#0c0a09] border border-stone-900 rounded-xl space-y-2 shrink-0">
            <p className="text-[9px] font-mono text-stone-500 uppercase tracking-widest">Resumen de Hoy</p>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-stone-400">Puntos otorgados</span>
              <span className="text-rose-400 font-medium">+245</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-stone-400">Nuevas clientas</span>
              <span className="text-amber-400 font-medium">+12</span>
            </div>
            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-stone-900/40">
              <span className="text-stone-400">Citas hoy</span>
              <span className="text-cyan-400 font-medium">8</span>
            </div>
          </div>
        )}

        {/* ACCIONES */}
        <div className={`p-3 border-t border-stone-900/60 bg-[#0c0a09] space-y-1 ${collapsed ? 'px-2' : ''}`}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-stone-400 hover:text-stone-100 hover:bg-stone-900/40 transition-all ${collapsed ? 'justify-center px-2' : ''}`}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            {!collapsed && <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>}
          </button>

          <button
            onClick={handleLogoutClick}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-stone-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-500/20 transition-all group ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <Power className="w-4 h-4 text-stone-500 group-hover:text-rose-400 transition-colors" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-20 bg-stone-900 border border-stone-800 rounded-full p-1 hover:bg-stone-800 transition-all z-50 text-stone-400 hover:text-white"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </>
  )
}
