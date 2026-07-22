'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { Bell, Menu, User, Sun, Moon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AdminHeaderProps {
  collapsed: boolean
  onMenuClick: () => void
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showNotifications, setShowNotifications] = useState(false)

  const isDark = theme === 'dark'

  const notifications = [
    { id: 1, message: 'María González ha agendado una cita', time: 'Hace 5 min', read: false },
    { id: 2, message: 'Carlos Ruiz confirmó su cita de mañana', time: 'Hace 2h', read: false },
    { id: 3, message: 'Nueva clienta: Sofía Martínez', time: 'Hace 4h', read: true },
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  // ⚡ CONTROL DE ERRORES BLINDADO: Extraemos el nombre de forma 100% segura
  const userName = user?.email || 'Administrador'
  const firstName = userName.split('@')[0] || 'Admin'

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 md:px-8 h-20 flex items-center justify-between transition-colors duration-300 ${
      isDark
        ? 'bg-[#0e0c0b]/95 border-stone-900/80 text-white'
        : 'bg-white/95 border-stone-200 text-stone-900'
    }`}>
      {/* LADO IZQUIERDO */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Botón hamburguesa (móvil) */}
        <button
          onClick={onMenuClick}
          className={`lg:hidden h-10 w-10 p-2.5 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
            isDark
              ? 'bg-stone-900/50 border-stone-900 text-stone-400 hover:text-white hover:border-stone-700'
              : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 hover:border-stone-300'
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className={`text-sm md:text-lg font-light tracking-tight transition-colors ${
            isDark ? 'text-white' : 'text-stone-900'
          }`}>
            Bienvenido, <span className="font-bold bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">{firstName}</span>
          </h1>
          <p className={`text-[10px] md:text-xs font-light hidden sm:block transition-colors ${
            isDark ? 'text-stone-500' : 'text-stone-400'
          }`}>
            {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      {/* LADO DERECHO - TRES ICONOS JUNTOS (TEMA, NOTIFICACIONES, PERFIL MÓVIL) */}
      <div className="flex items-center gap-2.5 md:gap-4 h-10">

        {/* 1. Icono Cambiar Tema */}
        <button
          onClick={toggleTheme}
          className={`h-10 w-10 p-2.5 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
            isDark
              ? 'bg-stone-900/50 border-stone-900 text-stone-400 hover:text-white hover:border-stone-700'
              : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 hover:border-stone-300'
          }`}
          aria-label="Cambiar tema"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
          ) : (
            <Moon className="w-4 h-4 text-rose-500" />
          )}
        </button>

        {/* 2. Icono Notificaciones */}
        <div className="relative h-10 w-10 shrink-0 flex items-center justify-center">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`h-10 w-10 p-2.5 rounded-xl border flex items-center justify-center transition-all relative ${
              isDark
                ? 'bg-stone-900/50 border-stone-900 text-stone-400 hover:text-white hover:border-stone-700'
                : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 hover:border-stone-300'
            }`}
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            {unreadCount > 0 && (
              <span className={`absolute top-1.5 right-1.5 w-4 h-4 text-[8px] font-bold text-white rounded-full flex items-center justify-center border animate-pulse shadow-[0_0_10px_rgba(225,29,72,0.4)] ${
                isDark ? 'border-[#0e0c0b]' : 'border-white'
              } bg-rose-500`}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown notificaciones */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className={`absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl shadow-2xl overflow-hidden z-50 border backdrop-blur-xl ${
                isDark
                  ? 'bg-[#0e0c0b]/95 border-stone-900 text-stone-200'
                  : 'bg-white/95 border-stone-200 text-stone-900'
              }`}>
                <div className={`p-3 border-b flex items-center justify-between ${
                  isDark ? 'border-stone-900' : 'border-stone-200'
                }`}>
                  <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    Notificaciones
                  </span>
                  <button className={`text-[10px] font-medium transition-colors ${
                    isDark ? 'text-stone-400 hover:text-rose-400' : 'text-stone-500 hover:text-rose-600'
                  }`}>
                    Marcar todas como leídas
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-3 border-b transition-colors ${!n.read ? (isDark ? 'bg-rose-500/5' : 'bg-rose-50/70') : ''} ${
                      isDark ? 'border-stone-900/50 hover:bg-stone-900/30' : 'border-stone-200/50 hover:bg-stone-50/70'
                    }`}>
                      <p className={`text-xs ${isDark ? 'text-stone-200' : 'text-stone-700'} ${!n.read ? 'font-medium' : ''}`}>
                        {n.message}
                      </p>
                      <p className={`text-[10px] mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                        {n.time}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 3. Icono Perfil móvil / Avatar Desktop */}
        {/* En móvil se ve como el 3er botón de la fila de 3 iconos */}
        <button className={`md:hidden h-10 w-10 p-2.5 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
          isDark
            ? 'bg-stone-900/50 border-stone-900 text-stone-400 hover:text-white hover:border-stone-700'
            : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 hover:border-stone-300'
        }`}>
          <User className="w-4 h-4" />
        </button>

        {/* Separador Visual y Perfil (solo visible en Desktop) */}
        <div className={`h-6 w-[1px] mx-0.5 hidden md:block shrink-0 ${isDark ? 'bg-stone-800' : 'bg-stone-200'}`}></div>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className={`text-xs font-medium truncate max-w-[150px] transition-colors ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
              {userName}
            </p>
            <span className={`text-[9px] font-mono tracking-wider uppercase transition-colors ${
              isDark ? 'text-amber-400/80' : 'text-amber-600'
            }`}>
              Admin
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-sm font-bold shadow-sm transition-colors ${
            isDark
              ? 'bg-gradient-to-br from-rose-500/20 to-amber-500/20 border-rose-500/30 text-rose-400'
              : 'bg-gradient-to-br from-rose-50 to-amber-50 border-rose-200 text-rose-600'
          }`}>
            {firstName.charAt(0).toUpperCase()}
          </div>
        </div>

      </div>
    </header>
  )
}