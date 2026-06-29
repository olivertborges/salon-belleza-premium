'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext' 
import { useTheme } from '@/contexts/ThemeContext'
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
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', color: 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20' },
  { id: 'agenda', name: 'Agenda', icon: Calendar, path: '/admin/agenda', color: 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/20' },
  { id: 'historial', name: 'Historial', icon: History, path: '/admin/historial', color: 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20' },
  { id: 'clientes', name: 'Clientas VIP', icon: Users, path: '/admin/clientes', color: 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' },
  { id: 'servicios', name: 'Servicios', icon: Sparkles, path: '/admin/servicios', color: 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20' },
  { id: 'productos', name: 'Productos / Tienda', icon: ShoppingBag, path: '/admin/productos', color: 'border-violet-500 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20' },
  /* { id: 'cursos', name: 'Cursos / Academia', icon: GraduationCap, path: '/admin/cursos', color: 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/20' }, */,
  { id: 'cancelaciones', name: 'Cancelaciones', icon: XCircle, path: '/admin/cancelaciones', color: 'border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20' },
  { id: 'staff', name: 'Staff Equipo', icon: UsersRound, path: '/admin/staff', color: 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20' },
  { id: 'configuracion', name: 'Configuración', icon: Sliders, path: '/admin/configuracion', color: 'border-stone-500 text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-900/40' },
]

export default function AdminSidebar({ collapsed, setCollapsed, isOpen, onClose }: AdminSidebarProps) {
  const { user, role, signOut } = useAuth() 
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()

  const [mounted, setMounted] = useState(false)
  const [currentPath, setCurrentPath] = useState(pathname)

  const isDark = theme === 'dark'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setCurrentPath(pathname)
  }, [pathname])

  if (!mounted) return null

  // 🔒 CONTROL SEGURO DE VISIBILIDAD:
  // Si el usuario tiene explícitamente rol de administrador o staff, ve todo el menú.
  // De lo contrario (sea cliente o sesión vacía en carga), solo ve los 4 elementos básicos.
  const isAdmin = role === 'admin' || role === 'staff'
  const visibleMenu = isAdmin ? ALL_MENU_ITEMS : ALL_MENU_ITEMS.slice(0, 4)

  const handleNavigation = (path: string) => {
    router.push(path)
    onClose()
  }

  const activePath = currentPath || pathname || '/dashboard'

  const isItemActive = (itemPath: string) => {
    if (itemPath === '/dashboard') return activePath === '/dashboard'
    return activePath?.startsWith(itemPath + '/') || activePath === itemPath
  }

  const handleLogoutClick = async () => {
    try {
      if (signOut) await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      router.push('/login')
    }
  }

  return (
    <>
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen border-r transition-colors duration-300 flex flex-col shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${collapsed ? 'w-[72px]' : 'w-72'}
        ${isDark ? 'bg-[#0e0c0b] border-stone-900/80 text-stone-200' : 'bg-white border-stone-200 text-stone-900'}
      `}>
        {/* HEADER */}
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-stone-900' : 'border-stone-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.25)] flex-shrink-0">
              <span className="text-white text-sm">💅</span>
            </div>
            {!collapsed && (
              <div>
                <span className={`text-xs font-bold uppercase tracking-[0.2em] block ${isDark ? 'text-stone-100' : 'text-stone-800'}`}>Fresh Nails</span>
                <span className={`text-[8px] uppercase tracking-widest font-mono block ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{role || 'Cargando...'} Control</span>
              </div>
            )}
          </div>
          <button 
            onClick={onClose} 
            className={`lg:hidden p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-stone-900 text-stone-400 hover:text-white' : 'hover:bg-stone-100 text-stone-500 hover:text-stone-900'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PERFIL */}
        {!collapsed && (
          <div className={`mx-4 mt-4 p-3 border rounded-xl ${isDark ? 'bg-stone-900/30 border-stone-900/80' : 'bg-stone-50 border-stone-100'}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center font-bold text-rose-500 text-xs">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>{user?.email || 'Cargando...'}</p>
                <span className="text-[8px] font-mono tracking-wider text-amber-500 uppercase block">En Línea</span>
              </div>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* MENÚ */}
        <nav className={`flex-1 p-3 space-y-1 overflow-y-auto ${collapsed ? 'px-2' : ''}`}>
          {visibleMenu.map((item) => {
            const Icon = item.icon
            const isActive = isItemActive(item.path)

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                  isActive 
                    ? `${item.color} font-semibold shadow-sm` 
                    : isDark 
                      ? 'border-transparent text-stone-400 hover:text-stone-100 hover:bg-stone-900/30'
                      : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
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
          <div className={`mx-4 mb-2 p-4 border rounded-xl space-y-2 shrink-0 ${isDark ? 'bg-[#0c0a09] border-stone-900' : 'bg-stone-50 border-stone-100'}`}>
            <p className="text-[9px] font-mono text-stone-400 uppercase tracking-widest">Resumen de Hoy</p>
            <div className="flex justify-between items-center text-[11px]">
              <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>Puntos otorgados</span>
              <span className="text-rose-500 font-medium">+245</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>Nuevas clientas</span>
              <span className="text-amber-500 font-medium">+12</span>
            </div>
            <div className={`flex justify-between items-center text-[11px] pt-1 border-t ${isDark ? 'border-stone-900/40' : 'border-stone-200'}`}>
              <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>Citas hoy</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-medium">8</span>
            </div>
          </div>
        )}

        {/* ACCIONES */}
        <div className={`p-3 border-t space-y-1 ${collapsed ? 'px-2' : ''} ${isDark ? 'border-stone-900/60 bg-[#0c0a09]' : 'border-stone-100 bg-stone-50'}`}>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all ${collapsed ? 'justify-center px-2' : ''} ${
              isDark ? 'text-stone-400 hover:text-stone-100 hover:bg-stone-900/40' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
            {!collapsed && <span>{isDark ? 'Modo claro' : 'Modo oscuro'}</span>}
          </button>

          <button
            onClick={handleLogoutClick}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs border border-transparent transition-all group ${collapsed ? 'justify-center px-2' : ''} ${
              isDark ? 'text-stone-400 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-500/20' : 'text-stone-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'
            }`}
          >
            <Power className="w-4 h-4 text-stone-400 group-hover:text-rose-500 transition-colors" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`hidden lg:flex absolute -right-3 top-20 border rounded-full p-1 transition-all z-50 ${
          isDark ? 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white hover:bg-stone-800' : 'bg-white border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-50'
        }`}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </>
  )
}
