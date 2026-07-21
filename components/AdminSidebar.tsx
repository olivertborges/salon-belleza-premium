// @ts-nocheck
'use client'

import React, { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard, Calendar, Users, Sparkles, History,
  XCircle, ShoppingBag, GraduationCap, Sliders, UsersRound, 
  Sun, Moon, ChevronLeft, ChevronRight, Power
} from 'lucide-react'

interface AdminSidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  isOpen: boolean
  onClose: () => void
}

export default function AdminSidebar({ collapsed, setCollapsed, isOpen, onClose }: AdminSidebarProps) {
  const { logout, role, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const [darkMode, setDarkMode] = useState(true)

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', color: 'border-rose-500 text-rose-400 bg-rose-950/20', roles: ['admin', 'staff'] },
    { id: 'agenda', name: 'Agenda', icon: Calendar, path: '/admin/agenda', color: 'border-cyan-500 text-cyan-400 bg-cyan-950/20', roles: ['admin', 'staff'] },
    { id: 'clientes', name: 'Clientas VIP', icon: Users, path: '/clientes', color: 'border-emerald-500 text-emerald-400 bg-emerald-950/20', roles: ['admin'] },
    { id: 'servicios', name: 'Servicios', icon: Sparkles, path: '/servicios', color: 'border-amber-500 text-amber-400 bg-amber-950/20', roles: ['admin'] },
    { id: 'productos', name: 'Productos / Tienda', icon: ShoppingBag, path: '/productos', color: 'border-violet-500 text-violet-400 bg-violet-950/20', roles: ['admin'] },
    { id: 'cursos', name: 'Cursos / Academia', icon: GraduationCap, path: '/admin/cursos', color: 'border-fuchsia-500 text-fuchsia-400 bg-fuchsia-950/20', roles: ['admin'] },
    { id: 'historial', name: 'Historial', icon: History, path: '/historial', color: 'border-orange-500 text-orange-400 bg-orange-950/20', roles: ['admin', 'staff'] },
    { id: 'cancelaciones', name: 'Cancelaciones', icon: XCircle, path: '/cancelaciones', color: 'border-red-500 text-red-400 bg-red-950/20', roles: ['admin', 'staff'] },
    { id: 'staff', name: 'Staff Equipo', icon: UsersRound, path: '/staff', color: 'border-indigo-500 text-indigo-400 bg-indigo-950/20', roles: ['admin'] },
    { id: 'configuracion', name: 'Configuración', icon: Sliders, path: '/configuracion', color: 'border-stone-500 text-stone-300 bg-stone-900/40', roles: ['admin'] },
  ]

  const userRole = role || 'admin'
  const visibleMenu = menuItems.filter(item => item.roles.includes(userRole))

  // Función asíncrona optimizada para el cierre de sesión
  const handleLogoutClick = async () => {
    try {
      if (logout) {
        await logout() // Ejecuta el cierre de sesión nativo de tu AuthContext
      }
      router.refresh() // Limpia los estados cacheados de Next.js
      router.push('/login') // Te manda directo al login elegante
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <div className={`fixed lg:relative z-[60] flex flex-col h-full bg-[#0e0c0b] border-r border-stone-900/80 transition-all duration-300 ease-in-out shrink-0 ${collapsed ? 'lg:w-20' : 'lg:w-72'} w-72 transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

      {/* LOGO */}
      <div className="p-6 border-b border-stone-900 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.25)] flex-shrink-0">
          <span className="text-white text-base">💅</span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-stone-100 block truncate">Fresh Nails</span>
            <span className="text-[9px] uppercase tracking-widest text-stone-500 font-mono block capitalize">{userRole} Control</span>
          </div>
        )}
      </div>

      {/* PERFIL INFO */}
      {!collapsed && (
        <div className="mx-4 mt-5 p-3 bg-stone-900/30 border border-stone-900/80 rounded-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center font-bold text-rose-400 text-xs">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-stone-200 truncate">{user?.name || 'Administrador'}</p>
              <span className="text-[9px] font-mono tracking-wider text-amber-400/80 uppercase block">En Línea</span>
            </div>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {/* MENÚ DE NAVEGACIÓN */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-stone-950 [&::-webkit-scrollbar-track]:bg-transparent">
        {visibleMenu.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path

          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-medium border transition-all ${
                isActive 
                  ? `${item.color}` 
                  : 'border-transparent text-stone-400 hover:text-stone-100 hover:bg-stone-900/30'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.name : ''}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </button>
          )
        })}
      </nav>

      {/* RECUADRO DE ESTADÍSTICAS RÁPIDAS */}
      {!collapsed && (
        <div className="mx-4 mb-4 p-4 bg-[#0c0a09] border border-stone-900 rounded-xl space-y-2 shrink-0">
          <p className="text-[9px] font-mono text-stone-500 uppercase tracking-widest">Resumen de Hoy</p>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-stone-400">Puntos otorgados</span>
            <span className="text-rose-400 font-medium">+245</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-stone-400">Nuevas clientas</span>
            <span className="text-amber-400 font-medium">+12</span>
          </div>
        </div>
      )}

      {/* ACCIONES FIJAS INFERIORES */}
      <div className="p-4 border-t border-stone-900/60 bg-[#0c0a09] space-y-1.5 shrink-0">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs text-stone-400 hover:text-stone-100 hover:bg-stone-900/40 transition-all ${collapsed ? 'justify-center px-2' : ''}`}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          {!collapsed && <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>}
        </button>

        {/* BOTÓN DE LOGOUT ACTUALIZADO CON CONEXIÓN TOTAL */}
        <button
          onClick={handleLogoutClick}
          className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs text-stone-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-500/20 transition-all group ${collapsed ? 'justify-center px-2' : ''}`}
        >
          <Power className="w-4 h-4 text-stone-500 group-hover:text-rose-400 transition-colors" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>

      {/* BOTÓN FLOTANTE PARA COLAPSAR DESDE ESCRITORIO */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-stone-900 border border-stone-800 rounded-full p-1 hover:bg-stone-800 transition-all hidden lg:block z-50 text-stone-400 hover:text-white"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

    </div>
  )
}
