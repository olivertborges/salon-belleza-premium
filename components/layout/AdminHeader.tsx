'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Bell, Menu, X, User, LogOut, Settings } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AdminHeaderProps {
  onMenuClick: () => void
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const notifications = [
    { id: 1, message: 'María González ha agendado una cita', time: 'Hace 5 min', read: false },
    { id: 2, message: 'Carlos Ruiz confirmó su cita de mañana', time: 'Hace 2h', read: false },
    { id: 3, message: 'Nueva clienta: Sofía Martínez', time: 'Hace 4h', read: true },
  ]

  const unreadCount = notifications.filter(n => !n.read).length
  const userName = user?.name || user?.full_name || 'Admin'
  const firstName = userName.split(' ')[0]

  return (
    <header className="sticky top-0 z-30 bg-[#0e0c0b]/95 backdrop-blur-md border-b border-stone-900 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
      {/* Lado izquierdo */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Botón hamburguesa (móvil) */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl bg-stone-900/50 border border-stone-900 text-stone-400 hover:text-white hover:border-stone-700 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm md:text-lg font-light text-white tracking-tight">
            Bienvenido{user?.name?.endsWith('a') ? 'a' : 'o'}, <span className="font-bold bg-gradient-to-r from-cyan-400 to-amber-400 bg-clip-text text-transparent">{firstName}</span>
          </h1>
          <p className="text-[10px] md:text-xs text-stone-500 font-light hidden sm:block">
            {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      {/* Lado derecho */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-stone-900/50 border border-stone-900 text-stone-400 hover:text-white hover:border-stone-700 transition-all relative"
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-[8px] font-bold text-white rounded-full flex items-center justify-center border border-[#0e0c0b]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown notificaciones */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#0e0c0b] border border-stone-900 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-stone-900 flex items-center justify-between">
                <span className="text-xs font-medium text-white">Notificaciones</span>
                <button className="text-[10px] text-stone-400 hover:text-cyan-400 transition-colors">
                  Marcar todas como leídas
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-3 border-b border-stone-900/50 hover:bg-stone-900/30 transition-colors ${!n.read ? 'bg-cyan-500/5' : ''}`}>
                    <p className="text-xs text-stone-200">{n.message}</p>
                    <p className="text-[10px] text-stone-500 mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-stone-900 text-center">
                <button className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors">
                  Ver todas
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Perfil usuario (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-medium text-white">{userName}</p>
            <span className="text-[9px] font-mono tracking-wider text-amber-400/80 uppercase">Admin</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-amber-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 text-sm">
            {firstName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Perfil móvil (solo icono) */}
        <button className="md:hidden p-2 rounded-xl bg-stone-900/50 border border-stone-900 text-stone-400 hover:text-white hover:border-stone-700 transition-all">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
