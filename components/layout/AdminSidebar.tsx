'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext' 
import { useTheme } from '@/contexts/ThemeContext'
import {
  LayoutDashboard, Calendar, Users, Sparkles, History,
  XCircle, ShoppingBag, Sliders, UsersRound, Crown,
  Sun, Moon, ChevronLeft, ChevronRight, Power, X
} from 'lucide-react'

interface AdminSidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  isOpen: boolean
  onClose: () => void
}

const ALL_MENU_ITEMS = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', color: 'text-pink-500' },
  { id: 'agenda', name: 'Agenda Citas', icon: Calendar, path: '/admin/agenda', color: 'text-violet-500' },
  { id: 'historial', name: 'Historial', icon: History, path: '/admin/historial', color: 'text-blue-500' },
  { id: 'clientes', name: 'Clientas VIP', icon: Users, path: '/admin/clientes', color: 'text-rose-500' },
  { id: 'fidelizacion', name: 'Consola VIP', icon: Crown, path: '/admin/fidelizacion', color: 'text-amber-500' },
  { id: 'servicios', name: 'Servicios Menu', icon: Sparkles, path: '/admin/servicios', color: 'text-fuchsia-500' },
  { id: 'productos', name: 'Productos / Tienda', icon: ShoppingBag, path: '/admin/productos', color: 'text-emerald-500' },
  { id: 'cancelaciones', name: 'Cancelaciones', icon: XCircle, path: '/admin/cancelaciones', color: 'text-red-500' },
  { id: 'staff', name: 'Staff Equipo', icon: UsersRound, path: '/admin/staff', color: 'text-cyan-500' },
  { id: 'configuracion', name: 'Configuración', icon: Sliders, path: '/admin/configuracion', color: 'text-orange-500' },
]

export default function AdminSidebar({ collapsed, setCollapsed, isOpen, onClose }: AdminSidebarProps) {
  const { user, role, signOut } = useAuth() 
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()

  const [mounted, setMounted] = useState(false)
  const isDark = theme === 'dark'

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleNavigation = (path: string) => {
    router.push(path)
    onClose()
  }

  const isItemActive = (itemPath: string) => {
    if (itemPath === '/dashboard') return pathname === '/dashboard'
    return pathname?.startsWith(itemPath + '/') || pathname === itemPath
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
      {/* OVERLAY MÓVIL DIVERTIDO */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-fuchsia-950/20 backdrop-blur-xs z-40" onClick={onClose} />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen transition-all duration-300 flex flex-col border-r
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${collapsed ? 'w-[76px]' : 'w-64'}
        ${isDark ? 'bg-[#0f0c1b] border-fuchsia-950/40 text-stone-200' : 'bg-[#fffafd] border-pink-100 text-stone-800'}
      `}>
        
        {/* CABECERA CON BRILLO */}
        <div className={`h-16 px-5 flex items-center justify-between border-b ${isDark ? 'border-fuchsia-950/30' : 'border-pink-50'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 flex items-center justify-center shrink-0 shadow-md shadow-pink-500/20">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <span className="text-sm font-serif tracking-wide block font-extrabold bg-gradient-to-r from-pink-600 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent dark:from-pink-400 dark:to-amber-300">
                  Fresh Nails
                </span>
                <span className="text-[9px] uppercase tracking-widest font-mono block text-pink-400 dark:text-fuchsia-400/80 font-bold">{role || 'Studio'}</span>
              </div>
            )}
          </div>
          {isOpen && (
            <button onClick={onClose} className="lg:hidden p-1 text-pink-400 hover:text-pink-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* PERFIL GLOW VIBRANTE */}
        {!collapsed && (
          <div className="px-4 pt-4 shrink-0">
            <div className={`p-3 rounded-2xl flex items-center gap-3 transition-all border ${
              isDark 
                ? 'bg-gradient-to-r from-fuchsia-950/30 to-pink-950/20 border-fuchsia-900/30 shadow-inner' 
                : 'bg-gradient-to-r from-pink-50/60 to-amber-50/40 border-pink-100/70 shadow-xs'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-fuchsia-500 flex items-center justify-center font-mono text-xs font-bold text-white shadow-sm">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate text-stone-800 dark:text-pink-100">{user?.email || 'Admin'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  <span className="text-[9px] font-mono tracking-wider text-emerald-600 dark:text-emerald-400 font-bold uppercase">Activa</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NAVEGACIÓN LLENA DE VIVEZA Y COLOR */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-none select-none">
          {ALL_MENU_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = isItemActive(item.path)
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group ${
                  isActive 
                    ? isDark 
                      ? 'bg-gradient-to-r from-fuchsia-950/60 to-pink-950/40 text-pink-200 border border-fuchsia-900/40 shadow-sm shadow-fuchsia-950/50' 
                      : 'bg-gradient-to-r from-pink-100/70 to-rose-50/50 text-pink-950 border border-pink-200/50 shadow-xs'
                    : isDark
                      ? 'text-stone-400 hover:bg-stone-900/30 hover:text-stone-100'
                      : 'text-stone-500 hover:bg-pink-50/30 hover:text-pink-700'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.name : ''}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-pink-500 to-fuchsia-500" />
                )}
                
                <Icon className={`w-4 h-4 shrink-0 transition-all duration-300 ${
                  isActive 
                    ? 'scale-110 drop-shadow-[0_0_4px_rgba(236,72,153,0.3)]' 
                    : 'group-hover:scale-110'
                } ${item.color}`} />
                
                {!collapsed && <span className="truncate tracking-wide">{item.name}</span>}
              </button>
            )
          })}
        </nav>

        {/* CONTROLES ELEGANTES EN EL PIE */}
        <div className={`p-3 border-t space-y-1 shrink-0 ${isDark ? 'border-fuchsia-950/30 bg-[#0c0a14]' : 'border-pink-50 bg-[#fffdf1]/40'}`}>
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-stone-500 dark:text-stone-400 hover:bg-amber-500/5 hover:text-amber-600 dark:hover:text-amber-400 collapsed ? 'justify-center' : ''">
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            {!collapsed && <span>Cambiar ambiente</span>}
          </button>
          
          <button onClick={handleLogoutClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group text-stone-500 dark:text-stone-400 hover:bg-rose-500/5 hover:text-rose-600 dark:hover:text-rose-400 collapsed ? 'justify-center' : ''">
            <Power className="w-4 h-4 text-stone-400 group-hover:text-rose-500 transition-colors" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* TIRADOR DE PANTALLA FLOTANTE CON DEGRADADO */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`hidden lg:flex fixed top-5 border rounded-full p-1.5 transition-all z-50 shadow-md ${
          isDark 
            ? 'bg-[#151126] border-fuchsia-900/50 text-fuchsia-400 hover:text-pink-400' 
            : 'bg-white border-pink-200 text-pink-400 hover:text-pink-600'
        }`}
        style={{ left: collapsed ? '60px' : '244px', transition: 'left 300ms' }}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5 animate-pulse" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </>
  )
}
