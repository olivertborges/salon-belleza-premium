'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { Bell, Menu, User, LogOut, Settings, Sun, Moon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AdminHeaderProps {
  onMenuClick: () => void
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const isDark = theme === 'dark'

  const notifications = [
    { id: 1, message: 'María González ha agendado una cita', time: 'Hace 5 min', read: false },
    { id: 2, message: 'Carlos Ruiz confirmó su cita de mañana', time: 'Hace 2h', read: false },
    { id: 3, message: 'Nueva clienta: Sofía Martínez', time: 'Hace 4h', read: true },
  ]

  const unreadCount = notifications.filter(n => !n.read).length
  const userName = user?.name || user?.full_name || 'Admin'
  const firstName = userName.split(' ')[0]

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 md:px-8 py-3 md:py-4 flex items-center justify-between transition-colors duration-300 ${
      isDark
        ? 'bg-[#0e0c0b]/95 border-stone-900 text-white'
        : 'bg-white/95 border-stone-200 text-stone-900'
    }`}>
      {/* Lado izquierdo */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Botón hamburguesa (móvil) */}
        <button
          onClick={onMenuClick}
          className={`lg:hidden p-2 rounded-xl border transition-all ${
            isDark
              ? 'bg-stone-900/50 border-stone-900 text-stone-400 hover:text-white hover:border-stone-700'
              : 'bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-300'
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className={`text-sm md:text-lg font-light tracking-tight transition-colors ${
            isDark ? 'text-white' : 'text-stone-900'
          }`}>
            Bienvenido{user?.name?.endsWith('a') ? 'a' : 'o'}, <span className="font-bold bg-gradient-to-r from-cyan-400 to-amber-400 bg-clip-text text-transparent">{firstName}</span>
          </h1>
          <p className={`text-[10px] md:text-xs font-light hidden sm:block transition-colors ${
            isDark ? 'text-stone-500' : 'text-stone-400'
          }`}>
            {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      {/* Lado derecho */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Botón de tema (Dark/Light) */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl border transition-all ${
            isDark
              ? 'bg-stone-900/50 border-stone-900 text-stone-400 hover:text-white hover:border-stone-700'
              : 'bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-300'
          }`}
          aria-label="Cambiar tema"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>

        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-xl border transition-all relative ${
              isDark
                ? 'bg-stone-900/50 border-stone-900 text-stone-400 hover:text-white hover:border-stone-700'
                : 'bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            {unreadCount > 0 && (
              <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 text-[8px] font-bold text-white rounded-full flex items-center justify-center border ${
                isDark ? 'border-[#0e0c0b]' : 'border-white'
              } bg-rose-500`}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown notificaciones */}
          {showNotifications && (
            <div className={`absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl shadow-2xl overflow-hidden z-50 border ${
              isDark
                ? 'bg-[#0e0c0b] border-stone-900'
                : 'bg-white border-stone-200'
            }`}>
              <div className={`p-3 border-b flex items-center justify-between ${
                isDark ? 'border-stone-900' : 'border-stone-200'
              }`}>
                <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  Notificaciones
                </span>
                <button className={`text-[10px] transition-colors ${
                  isDark ? 'text-stone-400 hover:text-cyan-400' : 'text-stone-500 hover:text-cyan-600'
                }`}>
                  Marcar todas como leídas
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-3 border-b transition-colors ${!n.read ? (isDark ? 'bg-cyan-500/5' : 'bg-cyan-50') : ''} ${
                    isDark ? 'border-stone-900/50 hover:bg-stone-900/30' : 'border-stone-200/50 hover:bg-stone-50'
                  }`}>
                    <p className={`text-xs ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                      {n.message}
                    </p>
                    <p className={`text-[10px] mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                      {n.time}
                    </p>
                  </div>
                ))}
              </div>
              <div className={`p-2 border-t text-center ${
                isDark ? 'border-stone-900' : 'border-stone-200'
              }`}>
                <button className={`text-[10px] transition-colors ${
                  isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'
                }`}>
                  Ver todas
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Perfil usuario (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <p className={`text-xs font-medium transition-colors ${isDark ? 'text-white' : 'text-stone-900'}`}>
              {userName}
            </p>
            <span className={`text-[9px] font-mono tracking-wider uppercase transition-colors ${
              isDark ? 'text-amber-400/80' : 'text-amber-600'
            }`}>
              Admin
            </span>
          </div>
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm font-bold transition-colors ${
            isDark
              ? 'bg-gradient-to-br from-cyan-500/20 to-amber-500/20 border-cyan-500/30 text-cyan-400'
              : 'bg-gradient-to-br from-cyan-100 to-amber-100 border-cyan-300 text-cyan-700'
          }`}>
            {firstName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Perfil móvil (solo icono) */}
        <button className={`md:hidden p-2 rounded-xl border transition-all ${
          isDark
            ? 'bg-stone-900/50 border-stone-900 text-stone-400 hover:text-white hover:border-stone-700'
            : 'bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-300'
        }`}>
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
